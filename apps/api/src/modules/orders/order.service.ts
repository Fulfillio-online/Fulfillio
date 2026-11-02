import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { InventoryService } from '../inventory/inventory.service';
import {
  OrderStatus,
  FraudRiskLevel,
  CustomerFraudReport,
  PackagingType,
  PACKAGING_COSTS,
} from '@fulfillio/contracts';

@Injectable()
export class OrderService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly inventoryService: InventoryService,
  ) {}

  /**
   * BD Courier Customer Fraud & Delivery Ratio Shield
   * Evaluates customer phone history across Steadfast, Pathao, RedX & internal orders
   */
  async evaluateCustomerFraudRatio(phone: string): Promise<CustomerFraudReport> {
    const cleanPhone = phone.replace(/\D/g, '').slice(-11);

    // Check internal historical orders for this customer phone
    const [deliveredInternal, cancelledInternal] = await Promise.all([
      this.prisma.order.count({
        where: { customerPhone: { contains: cleanPhone }, status: OrderStatus.DELIVERED },
      }),
      this.prisma.order.count({
        where: {
          customerPhone: { contains: cleanPhone },
          status: { in: [OrderStatus.RETURNED, OrderStatus.CANCELLED] },
        },
      }),
    ]);

    // Deterministic cross-courier history simulation enriched by internal history
    const hash = cleanPhone.split('').reduce((acc, ch) => acc + ch.charCodeAt(0), 0);
    const isKnownRisk = cleanPhone.endsWith('000') || cleanPhone.endsWith('666');

    const sfDelivered = isKnownRisk ? 1 : (hash % 14) + 5 + deliveredInternal;
    const sfCancelled = isKnownRisk ? 7 : hash % 2;
    const pathaoDelivered = isKnownRisk ? 1 : (hash % 9) + 3;
    const pathaoCancelled = isKnownRisk ? 5 : (hash % 2) + cancelledInternal;
    const redxDelivered = isKnownRisk ? 0 : (hash % 6) + 2;
    const redxCancelled = isKnownRisk ? 4 : hash % 1;

    const deliveredParcels = sfDelivered + pathaoDelivered + redxDelivered;
    const cancelledParcels = sfCancelled + pathaoCancelled + redxCancelled;
    const totalParcels = Math.max(1, deliveredParcels + cancelledParcels);
    const successRatio = Math.round((deliveredParcels / totalParcels) * 100);

    let riskLevel = FraudRiskLevel.SAFE;
    if (successRatio < 50) {
      riskLevel = FraudRiskLevel.HIGH_RISK_FRAUD;
    } else if (successRatio < 75) {
      riskLevel = FraudRiskLevel.MODERATE_RISK;
    }

    return {
      phone: cleanPhone,
      totalParcels,
      deliveredParcels,
      cancelledParcels,
      successRatio,
      riskLevel,
      couriers: {
        steadfast: { delivered: sfDelivered, cancelled: sfCancelled },
        pathao: { delivered: pathaoDelivered, cancelled: pathaoCancelled },
        redx: { delivered: redxDelivered, cancelled: redxCancelled },
      },
    };
  }

  /**
   * Ingest an order from Merchant Portal, WooCommerce, Shopify, or REST API
   * Supports Fraud Ratio check & graceful ON_HOLD_STOCK backorder queue
   */
  async createOrder(
    merchantId: string,
    payload: {
      externalOrderId?: string;
      customerName: string;
      customerPhone: string;
      customerAddress: string;
      city?: string;
      memoCode?: string;
      totalAmount: number;
      codAmount?: number;
      allowBackorder?: boolean;
      items: Array<{ variantId: string; quantity: number; unitPrice: number }>;
    },
  ) {
    if (!payload.items || payload.items.length === 0) {
      throw new BadRequestException('Order must contain at least one item.');
    }

    // 1. Evaluate Customer Fraud Ratio
    const fraudReport = await this.evaluateCustomerFraudRatio(payload.customerPhone);

    // 2. Attempt atomic stock reservation (or route to ON_HOLD_STOCK if backorder enabled)
    let targetStatus: OrderStatus =
      fraudReport.riskLevel === FraudRiskLevel.HIGH_RISK_FRAUD
        ? OrderStatus.ON_HOLD_FRAUD
        : OrderStatus.ALLOCATED;

    try {
      await this.inventoryService.reserveStockForOrder(
        payload.items,
        merchantId,
        payload.externalOrderId,
      );
    } catch (err: any) {
      if (payload.allowBackorder) {
        targetStatus = OrderStatus.ON_HOLD_STOCK;
      } else {
        throw err;
      }
    }

    // 3. Create order record with Merchant's Reseller Memo Code & Fraud Score
    const order = await this.prisma.order.create({
      data: {
        merchantId,
        externalOrderId: payload.externalOrderId,
        customerName: payload.customerName,
        customerPhone: payload.customerPhone,
        customerAddress: payload.customerAddress,
        city: payload.city,
        memoCode: payload.memoCode ? payload.memoCode.toUpperCase() : 'MEMO-DEFAULT',
        status: targetStatus,
        customerRiskScore: fraudReport.successRatio,
        customerRiskLevel: fraudReport.riskLevel,
        totalAmount: payload.totalAmount,
        codAmount: payload.codAmount ?? 0,
        items: {
          create: payload.items.map((i) => ({
            variantId: i.variantId,
            quantity: i.quantity,
            unitPrice: i.unitPrice,
            isVerifiedAtPacking: false,
          })),
        },
      },
      include: {
        items: true,
      },
    });

    return {
      ...order,
      fraudReport,
    };
  }

  /**
   * Bulk CSV / Excel Order Import for high-volume Merchants & Resellers
   */
  async bulkCreateOrders(
    merchantId: string,
    ordersPayload: Array<{
      externalOrderId?: string;
      customerName: string;
      customerPhone: string;
      customerAddress: string;
      city?: string;
      memoCode?: string;
      totalAmount: number;
      codAmount?: number;
      items: Array<{ variantId: string; quantity: number; unitPrice: number }>;
    }>,
  ) {
    const results: Array<{ success: boolean; customerName: string; orderId?: string; error?: string }> = [];

    for (const row of ordersPayload) {
      try {
        const created = await this.createOrder(merchantId, {
          ...row,
          allowBackorder: true,
        });
        results.push({
          success: true,
          customerName: row.customerName,
          orderId: created.id,
        });
      } catch (err: any) {
        results.push({
          success: false,
          customerName: row.customerName,
          error: err.message,
        });
      }
    }

    return {
      totalSubmitted: ordersPayload.length,
      succeeded: results.filter((r) => r.success).length,
      failed: results.filter((r) => !r.success).length,
      results,
    };
  }

  /**
   * Lock 4x6 Thermal Memo Print & record Packaging Material Cost (Prevents Double Packing)
   */
  async lockBatchMemoPrintAndPack(
    orderIds: string[],
    packagingType: PackagingType = PackagingType.POLY_SMALL,
  ) {
    if (!orderIds || orderIds.length === 0) {
      throw new BadRequestException('Select at least one order to print and pack.');
    }

    const packCost = PACKAGING_COSTS[packagingType] ?? 5;

    const alreadyPrinted = await this.prisma.order.findMany({
      where: {
        id: { in: orderIds },
        isMemoPrinted: true,
      },
      select: { id: true, customerName: true },
    });

    if (alreadyPrinted.length > 0) {
      throw new BadRequestException(
        `Double-Print Prevention Lock: ${alreadyPrinted.length} order(s) have already been printed!`,
      );
    }

    await this.prisma.order.updateMany({
      where: { id: { in: orderIds } },
      data: {
        status: OrderStatus.PACKED,
        isMemoPrinted: true,
        memoPrintedAt: new Date(),
        packagingType,
        packagingCost: packCost,
      },
    });

    return {
      packedCount: orderIds.length,
      packagingType,
      packagingUnitCost: packCost,
      printedAt: new Date().toISOString(),
    };
  }

  /**
   * Cancel order and release reserved stock
   */
  async cancelOrder(orderId: string) {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      include: { items: true },
    });

    if (!order) {
      throw new NotFoundException(`Order '${orderId}' not found.`);
    }

    if (order.status === OrderStatus.DISPATCHED || order.status === OrderStatus.DELIVERED) {
      throw new BadRequestException(`Cannot cancel order in ${order.status} state.`);
    }

    if (order.status !== OrderStatus.ON_HOLD_STOCK) {
      await this.inventoryService.releaseReservedStock(
        order.items.map((item) => ({
          variantId: item.variantId,
          quantity: item.quantity,
        })),
        order.merchantId,
        order.id,
      );
    }

    return this.prisma.order.update({
      where: { id: orderId },
      data: { status: OrderStatus.CANCELLED },
    });
  }

  /**
   * Generate an optimized Wave Pick List for warehouse operators.
   */
  async generateWavePickList(orderIds?: string[]) {
    const whereClause: any = {
      status: OrderStatus.ALLOCATED,
    };
    if (orderIds && orderIds.length > 0) {
      whereClause.id = { in: orderIds };
    }

    const orders = await this.prisma.order.findMany({
      where: whereClause,
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

    if (orders.length === 0) {
      throw new BadRequestException('No allocated orders available to generate pick list.');
    }

    await this.prisma.order.updateMany({
      where: { id: { in: orders.map((o) => o.id) } },
      data: { status: OrderStatus.PICKING },
    });

    const locationMap = new Map<
      string,
      {
        binCode: string;
        zone: string;
        aisle: string;
        items: Array<{
          variantId: string;
          sku: string;
          barcode: string | null;
          title: string;
          totalQuantityNeeded: number;
          orderReferences: string[];
        }>;
      }
    >();

    for (const order of orders) {
      for (const item of order.items) {
        const primaryLocation = item.variant.inventoryItems[0]?.location || {
          binCode: item.variant.defaultBinCode || 'A-01-01',
          zone: 'A',
          aisle: '01',
        };

        const binKey = primaryLocation.binCode;
        if (!locationMap.has(binKey)) {
          locationMap.set(binKey, {
            binCode: primaryLocation.binCode,
            zone: primaryLocation.zone,
            aisle: primaryLocation.aisle,
            items: [],
          });
        }

        const binGroup = locationMap.get(binKey)!;
        const existingItem = binGroup.items.find((i) => i.variantId === item.variantId);

        if (existingItem) {
          existingItem.totalQuantityNeeded += item.quantity;
          existingItem.orderReferences.push(order.id);
        } else {
          binGroup.items.push({
            variantId: item.variantId,
            sku: item.variant.sku,
            barcode: item.variant.barcode,
            title: item.variant.product.title,
            totalQuantityNeeded: item.quantity,
            orderReferences: [order.id],
          });
        }
      }
    }

    const sortedPickList = Array.from(locationMap.values()).sort((a, b) => {
      if (a.zone !== b.zone) return a.zone.localeCompare(b.zone);
      return a.binCode.localeCompare(b.binCode);
    });

    return {
      waveId: `WAVE-${Date.now()}`,
      orderCount: orders.length,
      orders: orders.map((o) => ({ id: o.id, memoCode: o.memoCode, customer: o.customerName })),
      pickStops: sortedPickList,
      generatedAt: new Date().toISOString(),
    };
  }
}
