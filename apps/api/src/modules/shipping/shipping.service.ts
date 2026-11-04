import { Injectable, NotFoundException } from '@nestjs/common';
import { ShippingRepository } from './shipping.repository';
import { CourierProvider } from '@fulfillio/contracts';
import { OrderStatus } from '@prisma/client';

@Injectable()
export class ShippingService {
  constructor(private readonly repository: ShippingRepository) {}

  async bookConsignment(orderId: string, provider: CourierProvider) {
    // Generate simulated tracking & consignment ID
    const trackingCode = `TRK-${provider.substring(0, 3)}-${Date.now()}`;
    const consignmentId = `CN-${Math.floor(Math.random() * 900000 + 100000)}`;

    return this.repository.assignCourier(orderId, provider, trackingCode, consignmentId);
  }

  async generateHandoverManifest(provider: CourierProvider) {
    const orders = await this.repository.getManifestOrders(provider);
    return {
      manifestId: `MAN-${provider}-${Date.now()}`,
      provider,
      totalParcels: orders.length,
      orders: orders.map((o) => ({
        id: o.id,
        trackingCode: o.trackingCode,
        customerName: o.customerName,
        codAmount: o.codAmount,
      })),
      generatedAt: new Date().toISOString(),
    };
  }

  async getPublicTracking(trackingCode: string) {
    const order = await this.repository.getOrderByTrackingCode(trackingCode);
    if (!order) {
      throw new NotFoundException(`Tracking reference ${trackingCode} not found in system.`);
    }

    return {
      trackingCode: order.trackingCode,
      consignmentId: order.consignmentId,
      status: order.status,
      courier: order.courierProvider,
      merchant: order.merchant.businessName,
      customerCity: order.city,
      codAmount: order.codAmount,
      updatedAt: order.updatedAt,
    };
  }

  async processCourierWebhook(provider: string, payload: any) {
    const trackingCode = payload.tracking_code || payload.trackingCode;
    const consignmentId = payload.consignment_id || payload.consignmentId;
    const rawStatus = (payload.status || '').toUpperCase();

    let orderStatus: OrderStatus | undefined;
    if (rawStatus === 'DELIVERED') orderStatus = OrderStatus.DELIVERED;
    else if (rawStatus === 'RETURNED' || rawStatus === 'RETURNED_TO_ORIGIN') orderStatus = OrderStatus.RETURNED;
    else if (rawStatus === 'IN_TRANSIT' || rawStatus === 'PICKED_UP') orderStatus = OrderStatus.DISPATCHED;
    else if (rawStatus === 'CANCELLED') orderStatus = OrderStatus.CANCELLED;

    if (orderStatus) {
      const updated = await this.repository.updateStatusByTrackingOrConsignment(
        trackingCode,
        consignmentId,
        orderStatus,
      );
      return {
        success: true,
        provider,
        orderId: updated?.id,
        newStatus: orderStatus,
      };
    }

    return {
      success: true,
      provider,
      acknowledged: true,
    };
  }
}
