import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CourierProvider } from '@fulfillio/contracts';

@Injectable()
export class ShippingRepository {
  constructor(private readonly prisma: PrismaService) {}

  async assignCourier(orderId: string, provider: CourierProvider, trackingCode: string, consignmentId: string) {
    return this.prisma.order.update({
      where: { id: orderId },
      data: {
        courierProvider: provider,
        trackingCode,
        consignmentId,
      },
    });
  }

  async getManifestOrders(provider: CourierProvider) {
    return this.prisma.order.findMany({
      where: {
        courierProvider: provider,
        status: 'PACKED',
      },
      include: {
        merchant: true,
      },
    });
  }
}
