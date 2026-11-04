import { Injectable, NotFoundException } from '@nestjs/common';
import { ReturnsRepository } from './returns.repository';

@Injectable()
export class ReturnsService {
  constructor(private readonly repository: ReturnsRepository) {}

  async listReturns(merchantId?: string) {
    const orders = await this.repository.listReturnedOrders(merchantId);

    return orders.map((o) => ({
      id: o.id,
      merchantCode: o.merchant.merchantCode,
      merchantName: o.merchant.businessName,
      customerName: o.customerName,
      customerPhone: o.customerPhone,
      city: o.city || 'Dhaka',
      courier: o.courierProvider || 'STEADFAST',
      consignmentId: o.consignmentId || `CN-${o.id}`,
      trackingCode: o.trackingCode || `TRK-${o.id}`,
      totalAmount: Number(o.totalAmount),
      status: o.status,
      returnedAt: o.updatedAt.toISOString(),
      items: o.items.map((i) => ({
        variantId: i.variantId,
        sku: i.variant.sku,
        title: i.variant.product.title,
        qty: i.quantity,
        price: Number(i.unitPrice),
      })),
    }));
  }

  async getReturnStats(merchantId?: string) {
    return this.repository.getReturnAuditStats(merchantId);
  }

  async processInboundRTO(orderId: string, isUndamaged: boolean, reasonNotes?: string) {
    const order = await this.repository.markOrderReturned(orderId);

    for (const item of order.items) {
      await this.repository.restockOrQuarantineVariant(
        order.merchantId,
        order.id,
        item.variantId,
        item.quantity,
        isUndamaged,
        reasonNotes,
      );
    }

    return {
      orderId,
      status: 'RETURNED',
      restockedToSellable: isUndamaged,
      routedToDamagedQuarantine: !isUndamaged,
      processedAt: new Date().toISOString(),
    };
  }

  async processDetailedQc(
    orderId: string,
    decisions: Array<{
      variantId: string;
      restockGoodQty: number;
      quarantineDamageQty: number;
      notes?: string;
    }>,
  ) {
    const order = await this.repository.markOrderReturned(orderId);

    for (const d of decisions) {
      if (d.restockGoodQty > 0) {
        await this.repository.restockOrQuarantineVariant(
          order.merchantId,
          order.id,
          d.variantId,
          d.restockGoodQty,
          true,
          d.notes || 'QC Passed: Restocked to shelf',
        );
      }
      if (d.quarantineDamageQty > 0) {
        await this.repository.restockOrQuarantineVariant(
          order.merchantId,
          order.id,
          d.variantId,
          d.quarantineDamageQty,
          false,
          d.notes || 'QC Failed: Routed to Quarantine Bin',
        );
      }
    }

    return {
      orderId,
      status: 'RETURNED',
      qcCompleted: true,
      processedAt: new Date().toISOString(),
    };
  }
}
