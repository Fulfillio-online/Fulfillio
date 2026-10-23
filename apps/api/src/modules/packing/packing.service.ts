import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { MemoEngineService } from '../memo-engine/memo-engine.service';
import { QueueService } from '../queue/queue.service';
import { OrderStatus } from '@fulfillio/shared';

@Injectable()
export class PackingService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly memoEngine: MemoEngineService,
    private readonly queueService: QueueService,
  ) {}

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
        data: { status: OrderStatus.PACKED },
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
