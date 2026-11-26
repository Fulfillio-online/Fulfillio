import { Injectable, BadRequestException } from '@nestjs/common';
import { ReturnsRepository } from './returns.repository';
import { BillingService } from '../billing/billing.service';
import { StockMovementReason } from '@fulfillio/contracts';

@Injectable()
export class ReturnsService {
  constructor(
    private readonly repository: ReturnsRepository,
    private readonly billingService: BillingService,
  ) {}

  async listReturns(merchantIdOrCode?: string) {
    const resolvedId = await this.repository.resolveMerchantId(merchantIdOrCode);
    const orders = await this.repository.listReturnedOrders(resolvedId);

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
        sku: i.variant?.sku || i.sku || 'SKU-N/A',
        title: i.variant?.product?.title || i.productTitle || 'Product Item',
        qty: i.quantity,
        price: Number(i.unitPrice),
      })),
    }));
  }

  async listCancelledOrders(merchantIdOrCode?: string) {
    const resolvedId = await this.repository.resolveMerchantId(merchantIdOrCode);
    const orders = await this.repository.listCancelledOrders(resolvedId);

    return orders.map((o) => {
      const firstItem = o.items[0];
      const firstVariant = firstItem?.variant;
      const firstInv = firstVariant?.inventoryItems?.[0];
      const attrs = (firstVariant?.attributes as Record<string, any>) || {};
      const totalQty = o.items.reduce((sum, it) => sum + (it.quantity || 1), 0) || 1;
      const totalCurrentStock = (firstVariant?.inventoryItems || []).reduce(
        (sum, inv) => sum + (inv.quantityAvailable || 0),
        0,
      );

      const meta = o.cancelMeta;
      const cancelledDate = meta?.cancelledAt ? new Date(meta.cancelledAt) : o.updatedAt;
      const restockedDate = meta?.restockedAt ? new Date(meta.restockedAt) : null;
      const targetBin =
        meta?.restockedBin ||
        firstInv?.location?.binCode ||
        firstVariant?.defaultBinCode ||
        'A-01-01';

      return {
        id: o.id,
        orderId: o.id.startsWith('#') ? o.id : `#${o.id}`,
        merchantCode: o.merchant.merchantCode,
        merchantName: o.merchant.businessName,
        customerName: o.customerName,
        customerPhone: o.customerPhone,
        city: o.city || 'Dhaka',
        productTitle:
          firstItem?.productTitle || firstVariant?.product?.title || 'Order Product',
        fullSku: firstItem?.sku || firstVariant?.sku || 'SKU-N/A',
        color: attrs.color || firstItem?.variantLabel?.split('/')[0]?.trim() || '',
        size: attrs.size || firstItem?.variantLabel?.split('/')[1]?.trim() || '',
        qty: totalQty,
        unitPrice: Number(firstItem?.unitPrice ?? 0),
        codAmount: Number(o.codAmount || o.totalAmount || 0),
        targetBin,
        currentStockSnapshot: totalCurrentStock,
        cancelledAt: cancelledDate.toLocaleString('en-GB', {
          day: '2-digit',
          month: 'short',
          hour: '2-digit',
          minute: '2-digit',
        }),
        cancelledAtIso: cancelledDate.toISOString(),
        cancelReason:
          meta?.cancelReason || 'Cancelled from Order Pipeline — Pending Warehouse Restock',
        isRestocked: Boolean(meta?.isRestocked),
        restockedAt: restockedDate
          ? restockedDate.toLocaleString('en-GB', {
              day: '2-digit',
              month: 'short',
              hour: '2-digit',
              minute: '2-digit',
            })
          : undefined,
        restockedBin: meta?.restockedBin || undefined,
        imageUrl: firstVariant?.imageUrl || firstVariant?.product?.imageUrl || '',
        items: o.items.map((it) => ({
          id: it.id,
          variantId: it.variantId,
          title: it.productTitle || it.variant?.product?.title || 'Product',
          sku: it.sku || it.variant?.sku || 'SKU-N/A',
          qty: it.quantity,
          unitPrice: Number(it.unitPrice),
          bin: it.variant?.defaultBinCode || targetBin,
        })),
      };
    });
  }

  async restockCancelledOrder(orderId: string, binCode: string, notes?: string) {
    return this.repository.restockCancelledOrder(orderId, binCode, notes);
  }

  async listRecoveryLedger(merchantIdOrCode?: string) {
    const resolvedId = await this.repository.resolveMerchantId(merchantIdOrCode);
    const logs = await this.repository.listRecoveryLedger(resolvedId);

    const runningVariantStock = new Map<string, number>();

    return logs.map((log) => {
      const product = log.variant?.product;
      const merchant = product?.merchant;
      const binCode =
        log.variant?.inventoryItems?.[0]?.location?.binCode ||
        log.variant?.defaultBinCode ||
        'A-01-01';
      const liveTotalStock = (log.variant?.inventoryItems || []).reduce(
        (sum, inv) => sum + (inv.quantityAvailable || 0),
        0,
      );

      const vKey = log.variantId || log.id;
      const newStock = runningVariantStock.has(vKey)
        ? runningVariantStock.get(vKey)!
        : liveTotalStock;
      const deltaAppliedToSellable =
        log.reason === StockMovementReason.DAMAGED_QUARANTINE ? 0 : log.quantityDelta;
      const previousStock = Math.max(0, newStock - deltaAppliedToSellable);
      runningVariantStock.set(vKey, previousStock);

      return {
        id: log.id,
        timestamp: log.createdAt.toLocaleString('en-GB', {
          day: '2-digit',
          month: 'short',
          year: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
        }),
        sourceType:
          log.reason === StockMovementReason.ORDER_CANCELLED
            ? 'ORDER_CANCELLED'
            : log.reason === StockMovementReason.DAMAGED_QUARANTINE
            ? 'DAMAGED_QUARANTINE'
            : 'COURIER_RETURN',
        orderId: log.referenceId
          ? log.referenceId.startsWith('#')
            ? log.referenceId
            : `#${log.referenceId}`
          : '—',
        merchantCode: merchant?.merchantCode || 'MC-101',
        merchantName: merchant?.businessName || 'Merchant',
        productTitle: product?.title || 'Product',
        fullSku: log.variant?.sku || 'SKU-N/A',
        qty: Math.abs(log.quantityDelta),
        previousStock,
        newStock,
        binCode,
        operatorName: 'Warehouse Admin',
        notes: log.notes || 'Stock recovery logged in database',
      };
    });
  }

  async listWarehouseBins() {
    return this.repository.listWarehouseBins();
  }

  async getReturnStats(merchantIdOrCode?: string) {
    const resolvedId = await this.repository.resolveMerchantId(merchantIdOrCode);
    return this.repository.getReturnAuditStats(resolvedId);
  }

  async processInboundRTO(orderId: string, isUndamaged: boolean, reasonNotes?: string) {
    const { alreadyProcessed } = await this.repository.findOrderReturnProcessingState(orderId);
    if (alreadyProcessed) {
      throw new BadRequestException(
        `Return stock for order '${orderId}' has already been processed.`,
      );
    }

    const order = await this.repository.markOrderReturned(orderId);
    const shouldReleaseReserved = [
      'ALLOCATED',
      'PICKING',
      'PACKED',
      'ON_HOLD_FRAUD',
    ].includes((order as any).previousStatus || '');

    for (const item of order.items) {
      if (!item.variantId) continue;
      await this.repository.restockOrQuarantineVariant(
        order.merchantId,
        order.id,
        item.variantId,
        item.quantity,
        isUndamaged,
        reasonNotes,
        shouldReleaseReserved,
      );
    }

    try {
      await this.billingService.reverseOrderEarning(
        order.id,
        reasonNotes || 'Customer returned product (RTO intake) — earning refunded',
      );
    } catch (err: any) {
      console.warn('[ReturnsService] Billing earning reversal notice:', err?.message || err);
    }

    return {
      orderId: order.id,
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
    const { alreadyProcessed } = await this.repository.findOrderReturnProcessingState(orderId);
    if (alreadyProcessed) {
      throw new BadRequestException(
        `Return stock for order '${orderId}' has already been processed.`,
      );
    }

    const order = await this.repository.markOrderReturned(orderId);
    const shouldReleaseReserved = [
      'ALLOCATED',
      'PICKING',
      'PACKED',
      'ON_HOLD_FRAUD',
    ].includes((order as any).previousStatus || '');

    for (const d of decisions) {
      if (d.restockGoodQty > 0) {
        await this.repository.restockOrQuarantineVariant(
          order.merchantId,
          order.id,
          d.variantId,
          d.restockGoodQty,
          true,
          d.notes || 'QC Passed: Restocked to shelf',
          shouldReleaseReserved,
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
          shouldReleaseReserved && d.restockGoodQty <= 0,
        );
      }
    }

    try {
      await this.billingService.reverseOrderEarning(
        order.id,
        'Customer return QC processed — earning refunded',
      );
    } catch (err: any) {
      console.warn('[ReturnsService] Billing earning reversal notice:', err?.message || err);
    }

    return {
      orderId: order.id,
      status: 'RETURNED',
      qcCompleted: true,
      processedAt: new Date().toISOString(),
    };
  }
}
