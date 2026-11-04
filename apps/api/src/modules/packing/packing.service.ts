import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { MemoEngineService } from '../memo-engine/memo-engine.service';
import { QueueService } from '../queue/queue.service';
import { OrderStatus } from '@prisma/client';

@Injectable()
export class PackingService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly memoEngine: MemoEngineService,
    private readonly queueService: QueueService,
  ) {}

  /**
   * Fetch active packing queue for warehouse packing station
   */
  async getPackingQueue(merchantId?: string) {
    const orders = await this.prisma.order.findMany({
      where: {
        ...(merchantId ? { merchantId } : {}),
        status: { in: [OrderStatus.PICKING, OrderStatus.PACKED, OrderStatus.ALLOCATED] },
      },
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
              },
            },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return orders.map((o) => ({
      id: o.id,
      merchantCode: o.merchant.merchantCode,
      merchantName: o.merchant.businessName,
      memoCode: o.memoCode || 'MEMO-DEFAULT',
      resellerName: o.merchant.businessName,
      resellerPhone: '01711-223344',
      resellerAddress: 'Tejgaon Central Hub, Dhaka',
      brandColor: '#059669',
      customerName: o.customerName,
      customerPhone: o.customerPhone,
      customerAddress: o.customerAddress,
      city: o.city || 'Dhaka',
      courier: o.courierProvider || 'STEADFAST',
      consignmentId: o.consignmentId || `CN-${o.id}`,
      trackingCode: o.trackingCode || `TRK-STE-${o.id}`,
      packagingType: o.packagingType || 'POLY_SMALL',
      codAmount: Number(o.codAmount),
      status: o.status === OrderStatus.PACKED ? 'PACKED' : 'READY_TO_PACK',
      packedAt: o.memoPrintedAt
        ? o.memoPrintedAt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        : undefined,
      pickedRack: o.items[0]?.variant?.defaultBinCode || 'Z1-R02-S1-B04',
      items: o.items.map((i) => ({
        sku: i.variant.sku,
        title: i.variant.product.title,
        color: (i.variant.attributes as any)?.color || 'Standard',
        size: (i.variant.attributes as any)?.size || 'STD',
        qty: i.quantity,
        price: Number(i.unitPrice),
      })),
    }));
  }

  /**
   * Batch mark orders as packed after 4x6" thermal invoice print
   */
  async batchPrintAndMarkPacked(orderIds: string[], packagingType?: string) {
    const now = new Date();

    const updateResult = await this.prisma.order.updateMany({
      where: { id: { in: orderIds } },
      data: {
        status: OrderStatus.PACKED,
        isMemoPrinted: true,
        memoPrintedAt: now,
        ...(packagingType ? { packagingType } : {}),
      },
    });

    // Enqueue background webhook notifications for merchants
    for (const orderId of orderIds) {
      const order = await this.prisma.order.findUnique({
        where: { id: orderId },
        select: { merchantId: true, memoCode: true },
      });
      if (order) {
        await this.queueService.enqueueWebhook(order.merchantId, 'order.packed', {
          orderId,
          memoCode: order.memoCode,
          packedAt: now.toISOString(),
        });
      }
    }

    return {
      success: true,
      printedCount: updateResult.count,
      orderIds,
      packedAt: now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };
  }

  /**
   * Scan barcode of an item at the packing station for an active order
   */
  async verifyItemBarcode(orderId: string, scannedBarcode: string) {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      include: {
        items: {
          include: {
            variant: true,
          },
        },
      },
    });

    if (!order) {
      throw new NotFoundException(`Order '${orderId}' not found.`);
    }

    if (order.status !== OrderStatus.PICKING && order.status !== OrderStatus.ALLOCATED) {
      throw new BadRequestException(`Order '${orderId}' is not ready for packing (Current status: ${order.status}).`);
    }

    // Find matching unverified item
    const matchingItem = order.items.find(
      (item) =>
        (item.variant.barcode === scannedBarcode || item.variant.sku === scannedBarcode) &&
        !item.isVerifiedAtPacking,
    );

    if (!matchingItem) {
      throw new BadRequestException(
        `Barcode '${scannedBarcode}' does not match any pending unverified items in order '${orderId}'.`,
      );
    }

    // Mark item verified
    await this.prisma.orderItem.update({
      where: { id: matchingItem.id },
      data: { isVerifiedAtPacking: true },
    });

    // Check if all items in order are now verified
    const remainingUnverified = await this.prisma.orderItem.count({
      where: {
        orderId,
        isVerifiedAtPacking: false,
      },
    });

    const isPackingComplete = remainingUnverified === 0;

    let compiledInvoice = null;

    if (isPackingComplete) {
      // Transition order status to PACKED
      await this.prisma.order.update({
        where: { id: orderId },
        data: { status: OrderStatus.PACKED, isMemoPrinted: true, memoPrintedAt: new Date() },
      });

      // Auto-compile invoice using the order's Memo Code
      compiledInvoice = await this.memoEngine.compileInvoice(orderId);

      // Enqueue background PDF generation job & webhook
      await this.queueService.enqueuePdfGeneration(orderId, order.memoCode || 'MEMO-DEFAULT');
      await this.queueService.enqueueWebhook(order.merchantId, 'order.packed', {
        orderId,
        memoCode: order.memoCode,
        packedAt: new Date().toISOString(),
      });
    }

    return {
      orderId,
      verifiedItemId: matchingItem.id,
      verifiedSku: matchingItem.variant.sku,
      remainingItemsCount: remainingUnverified,
      isPackingComplete,
      compiledInvoice,
    };
  }
}
