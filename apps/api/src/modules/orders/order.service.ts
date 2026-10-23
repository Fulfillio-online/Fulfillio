import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { InventoryService } from '../inventory/inventory.service';
import { OrderStatus } from '@fulfillio/shared';

@Injectable()
export class OrderService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly inventoryService: InventoryService,
  ) {}

  /**
   * Ingest an order from WooCommerce, Shopify, or REST API
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
      items: Array<{ variantId: string; quantity: number; unitPrice: number }>;
    },
  ) {
    if (!payload.items || payload.items.length === 0) {
      throw new BadRequestException('Order must contain at least one item.');
    }

    // 1. Atomically reserve inventory
    await this.inventoryService.reserveStockForOrder(payload.items);

    // 2. Create order record with the merchant's specified Memo Code
    const order = await this.prisma.order.create({
      data: {
        merchantId,
        externalOrderId: payload.externalOrderId,
        customerName: payload.customerName,
        customerPhone: payload.customerPhone,
        customerAddress: payload.customerAddress,
        city: payload.city,
        memoCode: payload.memoCode ? payload.memoCode.toUpperCase() : 'MEMO-DEFAULT',
        status: OrderStatus.ALLOCATED,
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

    return order;
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

    // Release reserved stock back to available
    await this.inventoryService.releaseReservedStock(
      order.items.map((item) => ({
        variantId: item.variantId,
        quantity: item.quantity,
      })),
    );

    return this.prisma.order.update({
      where: { id: orderId },
      data: { status: OrderStatus.CANCELLED },
    });
  }

  /**
   * Generate an optimized Wave Pick List for warehouse operators.
   * Groups items across all allocated orders by zone & bin location to minimize travel time.
   */
  async generateWavePickList(orderIds?: string[]) {
    // 1. Fetch allocated orders
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

    // 2. Mark orders as PICKING
    await this.prisma.order.updateMany({
      where: { id: { in: orders.map((o) => o.id) } },
      data: { status: OrderStatus.PICKING },
    });

    // 3. Aggregate pick tasks by location
    const locationMap = new Map<string, {
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
    }>();

    for (const order of orders) {
      for (const item of order.items) {
        const primaryLocation = item.variant.inventoryItems[0]?.location || {
          binCode: 'UNASSIGNED',
          zone: 'GENERAL',
          aisle: '0',
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

    // 4. Return sorted by zone & aisle for optimal physical routing
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
