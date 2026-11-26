import { Injectable } from '@nestjs/common';
import { CourierProvider } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { OrderStatus, PackagingType } from '@fulfillio/contracts';

function normalizeCourierProvider(raw?: string | null): CourierProvider | null {
  const upper = (raw || '').trim().toUpperCase();
  if (!upper) return null;
  if (upper === 'STEADFAST') return CourierProvider.STEADFAST;
  if (upper === 'PATHAO') return CourierProvider.PATHAO;
  if (upper === 'REDX') return CourierProvider.REDX;
  if (upper === 'PAPERFLY') return CourierProvider.PAPERFLY;
  if (upper === 'CUSTOM') return CourierProvider.CUSTOM;
  return null;
}

@Injectable()
export class OrderRepository {
  constructor(private readonly prisma: PrismaService) {}

  private parseDateBound(raw?: string, isEndOfDay = false): Date | undefined {
    if (!raw) return undefined;
    const trimmed = raw.trim();
    if (!trimmed) return undefined;
    const normalized = /^\d{4}-\d{2}-\d{2}$/.test(trimmed)
      ? `${trimmed}${isEndOfDay ? 'T23:59:59.999Z' : 'T00:00:00.000Z'}`
      : trimmed;
    const parsed = new Date(normalized);
    return Number.isNaN(parsed.getTime()) ? undefined : parsed;
  }

  private buildWhereClause(options: {
    merchantId?: string;
    status?: OrderStatus;
    search?: string;
    dateFrom?: string;
    dateTo?: string;
    courier?: string;
  }) {
    const { merchantId, status, search, dateFrom, dateTo, courier } = options;
    const where: any = {};

    if (merchantId) where.merchantId = merchantId;
    if (status) where.status = status;

    if (courier && courier.trim()) {
      const upperCourier = courier.trim().toUpperCase();
      if (upperCourier === 'UNASSIGNED') {
        where.courierProvider = null;
      } else {
        const normalizedCourier = normalizeCourierProvider(courier);
        if (normalizedCourier) {
          where.courierProvider = normalizedCourier;
        }
      }
    }

    const fromDate = this.parseDateBound(dateFrom, false);
    const toDate = this.parseDateBound(dateTo, true);
    if (fromDate || toDate) {
      where.createdAt = {
        ...(fromDate && { gte: fromDate }),
        ...(toDate && { lte: toDate }),
      };
    }

    if (search) {
      where.OR = [
        { id: { contains: search, mode: 'insensitive' } },
        { externalOrderId: { contains: search, mode: 'insensitive' } },
        { customerName: { contains: search, mode: 'insensitive' } },
        { customerPhone: { contains: search } },
        { trackingCode: { contains: search, mode: 'insensitive' } },
        { memoCode: { contains: search, mode: 'insensitive' } },
        {
          items: {
            some: {
              OR: [
                { sku: { contains: search, mode: 'insensitive' } },
                { productTitle: { contains: search, mode: 'insensitive' } },
              ],
            },
          },
        },
      ];
    }

    return where;
  }

  async findManyWithFilters(options: {
    merchantId?: string;
    status?: OrderStatus;
    search?: string;
    dateFrom?: string;
    dateTo?: string;
    courier?: string;
    limit?: number;
    offset?: number;
  }) {
    const { limit = 50, offset = 0 } = options;
    const where = this.buildWhereClause(options);

    return this.prisma.order.findMany({
      where,
      include: {
        merchant: {
          select: {
            merchantCode: true,
            businessName: true,
            phone: true,
            location: true,
            logoUrl: true,
          },
        },
        items: {
          include: {
            variant: {
              include: {
                product: true,
                inventoryItems: {
                  include: {
                    location: true,
                  },
                },
              },
            },
          },
        },
        fulfillments: true,
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
      skip: offset,
    });
  }

  async countWithFilters(options: {
    merchantId?: string;
    status?: OrderStatus;
    search?: string;
    dateFrom?: string;
    dateTo?: string;
    courier?: string;
  }) {
    const where = this.buildWhereClause(options);
    return this.prisma.order.count({ where });
  }

  async findById(id: string, merchantId?: string) {
    const cleanId = (id || '').replace(/^#/, '').trim();
    const where: any = {
      OR: [
        { id },
        { id: cleanId },
        { externalOrderId: id },
        { externalOrderId: cleanId },
        { externalOrderId: `#${cleanId}` },
      ],
    };
    if (merchantId) where.merchantId = merchantId;

    return this.prisma.order.findFirst({
      where,
      include: {
        merchant: true,
        items: {
          include: {
            variant: {
              include: {
                product: true,
                inventoryItems: {
                  include: {
                    location: true,
                  },
                },
              },
            },
          },
        },
        fulfillments: true,
      },
    });
  }

  async countCustomerOrders(cleanPhone: string, status: OrderStatus | OrderStatus[]) {
    const statusClause = Array.isArray(status) ? { in: status } : status;
    return this.prisma.order.count({
      where: {
        customerPhone: { contains: cleanPhone },
        status: statusClause,
      },
    });
  }

  async createOrderWithItems(data: {
    merchantId: string;
    externalOrderId?: string;
    customerName: string;
    customerPhone: string;
    customerAddress: string;
    city?: string;
    memoCode?: string;
    courierProvider?: string;
    status: OrderStatus;
    customerRiskScore: number;
    customerRiskLevel: string;
    totalAmount: number;
    codAmount: number;
    subtotal?: number;
    deliveryFee?: number;
    discount?: number;
    advancePayment?: number;
    paymentMethod?: string;
    paymentStatus?: string;
    advancePaymentMethod?: string;
    advanceTrxId?: string;
    timeline?: any;
    items: Array<{
      variantId?: string | null;
      sku?: string | null;
      productTitle?: string | null;
      variantLabel?: string | null;
      quantity: number;
      unitPrice: number;
      isVerifiedAtPacking?: boolean;
    }>;
  }) {
    const totalAmount = isNaN(Number(data.totalAmount)) ? 0 : Number(data.totalAmount);
    const codAmount = isNaN(Number(data.codAmount)) ? totalAmount : Number(data.codAmount);
    const subtotal = isNaN(Number(data.subtotal)) ? totalAmount : Number(data.subtotal);
    const deliveryFee = isNaN(Number(data.deliveryFee)) ? 0 : Number(data.deliveryFee);
    const discount = isNaN(Number(data.discount)) ? 0 : Number(data.discount);
    const advancePayment = isNaN(Number(data.advancePayment)) ? 0 : Number(data.advancePayment);

    try {
      return await this.prisma.order.create({
        data: {
          merchant: { connect: { id: data.merchantId } },
          externalOrderId: data.externalOrderId,
          customerName: data.customerName,
          customerPhone: data.customerPhone,
          customerAddress: data.customerAddress,
          city: data.city || 'Dhaka',
          memoCode: data.memoCode ? data.memoCode.trim().toUpperCase() : null,
          courierProvider: normalizeCourierProvider(data.courierProvider),
          status: data.status,
          customerRiskScore: data.customerRiskScore,
          customerRiskLevel: data.customerRiskLevel,
          totalAmount,
          codAmount,
          subtotal,
          deliveryFee,
          discount,
          advancePayment,
          paymentMethod: data.paymentMethod,
          paymentStatus: data.paymentStatus ?? 'Unpaid',
          advancePaymentMethod: data.advancePaymentMethod,
          advanceTrxId: data.advanceTrxId,
          timeline: data.timeline ?? undefined,
          items: {
            create: data.items.map((i) => ({
              variantId: i.variantId || null,
              sku: i.sku,
              productTitle: i.productTitle,
              variantLabel: i.variantLabel,
              quantity: Math.max(1, Number(i.quantity) || 1),
              unitPrice: isNaN(Number(i.unitPrice)) ? 0 : Number(i.unitPrice),
              isVerifiedAtPacking: i.isVerifiedAtPacking ?? false,
            })),
          },
        },
        include: {
          items: {
            include: {
              variant: {
                include: {
                  product: true,
                },
              },
            },
          },
        },
      });
    } catch (createErr: any) {
      console.warn('[OrderRepository] Full order insert failed, attempting safe fallback:', createErr.message);
      // Fallback: insert using minimal fields with connected merchant
      return await this.prisma.order.create({
        data: {
          merchant: { connect: { id: data.merchantId } },
          externalOrderId: data.externalOrderId,
          customerName: data.customerName,
          customerPhone: data.customerPhone,
          customerAddress: data.customerAddress,
          city: data.city || 'Dhaka',
          memoCode: data.memoCode ? data.memoCode.trim().toUpperCase() : null,
          courierProvider: normalizeCourierProvider(data.courierProvider),
          status: data.status,
          totalAmount,
          codAmount,
          items: {
            create: data.items.map((i) => ({
              variantId: i.variantId || null,
              productTitle: i.productTitle,
              variantLabel: i.variantLabel,
              sku: i.sku,
              quantity: Math.max(1, Number(i.quantity) || 1),
              unitPrice: isNaN(Number(i.unitPrice)) ? 0 : Number(i.unitPrice),
              isVerifiedAtPacking: i.isVerifiedAtPacking ?? false,
            })),
          },
        },
        include: {
          items: true,
        },
      });
    }
  }

  async updateStatus(id: string, status: OrderStatus) {
    const data: any = { status };
    if (status === OrderStatus.DELIVERED || status === OrderStatus.PARTIAL_DELIVERED) {
      data.deliveredAt = new Date();
    } else if (status === OrderStatus.RETURNED) {
      data.returnedAt = new Date();
    }

    return this.prisma.order.update({
      where: { id },
      data,
      include: { items: true },
    });
  }

  async verifyOrderItem(orderId: string, itemId: string, isVerified: boolean = true) {
    return this.prisma.orderItem.updateMany({
      where: {
        id: itemId,
        orderId,
      },
      data: {
        isVerifiedAtPacking: isVerified,
      },
    });
  }

  async findPrintedOrders(orderIds: string[]) {
    return this.prisma.order.findMany({
      where: {
        id: { in: orderIds },
        isMemoPrinted: true,
      },
      select: { id: true, customerName: true },
    });
  }

  async lockBatchMemoPrintAndPack(
    orderIds: string[],
    packagingType: PackagingType,
    packagingCost: number,
  ) {
    return this.prisma.order.updateMany({
      where: { id: { in: orderIds } },
      data: {
        status: OrderStatus.PACKED,
        isMemoPrinted: true,
        memoPrintedAt: new Date(),
        packagingType,
        packagingCost,
      },
    });
  }

  async findAllocatedOrders(orderIds?: string[]) {
    const where: any = { status: OrderStatus.ALLOCATED };
    if (orderIds && orderIds.length > 0) {
      where.id = { in: orderIds };
    }

    return this.prisma.order.findMany({
      where,
      include: {
        items: {
          include: {
            variant: {
              include: {
                product: true,
                inventoryItems: {
                  include: {
                    location: true,
                  },
                },
              },
            },
          },
        },
      },
    });
  }

  async updateOrderStatusMany(orderIds: string[], status: OrderStatus) {
    return this.prisma.order.updateMany({
      where: { id: { in: orderIds } },
      data: { status },
    });
  }

  async updateOrderCourier(orderId: string, courierProvider?: string | null) {
    const normalized = normalizeCourierProvider(courierProvider);
    const existing = await this.prisma.order.findFirst({
      where: {
        OR: [{ id: orderId }, { externalOrderId: orderId }],
      },
      select: { id: true },
    });
    if (!existing) return null;
    return this.prisma.order.update({
      where: { id: existing.id },
      data: { courierProvider: normalized },
    });
  }
}
