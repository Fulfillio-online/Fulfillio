import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { OrderStatus, PackagingType } from '@fulfillio/contracts';

@Injectable()
export class OrderRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findManyWithFilters(options: {
    merchantId?: string;
    status?: OrderStatus;
    search?: string;
    limit?: number;
    offset?: number;
  }) {
    const { merchantId, status, search, limit = 50, offset = 0 } = options;

    const where: any = {};
    if (merchantId) where.merchantId = merchantId;
    if (status) where.status = status;
    if (search) {
      where.OR = [
        { id: { contains: search, mode: 'insensitive' } },
        { externalOrderId: { contains: search, mode: 'insensitive' } },
        { customerName: { contains: search, mode: 'insensitive' } },
        { customerPhone: { contains: search } },
        { trackingCode: { contains: search, mode: 'insensitive' } },
        { memoCode: { contains: search, mode: 'insensitive' } },
      ];
    }

    return this.prisma.order.findMany({
      where,
      include: {
        merchant: {
          select: {
            merchantCode: true,
            businessName: true,
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
  }) {
    const { merchantId, status, search } = options;
    const where: any = {};
    if (merchantId) where.merchantId = merchantId;
    if (status) where.status = status;
    if (search) {
      where.OR = [
        { id: { contains: search, mode: 'insensitive' } },
        { externalOrderId: { contains: search, mode: 'insensitive' } },
        { customerName: { contains: search, mode: 'insensitive' } },
        { customerPhone: { contains: search } },
        { trackingCode: { contains: search, mode: 'insensitive' } },
        { memoCode: { contains: search, mode: 'insensitive' } },
      ];
    }
    return this.prisma.order.count({ where });
  }

  async findById(id: string, merchantId?: string) {
    const where: any = { id };
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
    status: OrderStatus;
    customerRiskScore: number;
    customerRiskLevel: string;
    totalAmount: number;
    codAmount: number;
    items: Array<{
      variantId: string;
      quantity: number;
      unitPrice: number;
      isVerifiedAtPacking?: boolean;
    }>;
  }) {
    return this.prisma.order.create({
      data: {
        merchantId: data.merchantId,
        externalOrderId: data.externalOrderId,
        customerName: data.customerName,
        customerPhone: data.customerPhone,
        customerAddress: data.customerAddress,
        city: data.city,
        memoCode: data.memoCode ? data.memoCode.toUpperCase() : 'MEMO-DEFAULT',
        status: data.status,
        customerRiskScore: data.customerRiskScore,
        customerRiskLevel: data.customerRiskLevel,
        totalAmount: data.totalAmount,
        codAmount: data.codAmount,
        items: {
          create: data.items.map((i) => ({
            variantId: i.variantId,
            quantity: i.quantity,
            unitPrice: i.unitPrice,
            isVerifiedAtPacking: i.isVerifiedAtPacking ?? false,
          })),
        },
      },
      include: {
        items: true,
      },
    });
  }

  async updateStatus(id: string, status: OrderStatus) {
    return this.prisma.order.update({
      where: { id },
      data: { status },
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
}
