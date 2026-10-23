import { Injectable, BadRequestException } from '@nestjs/common';
import { ShippingRepository } from './shipping.repository';
import { CourierProvider } from '@fulfillio/contracts';

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
}
