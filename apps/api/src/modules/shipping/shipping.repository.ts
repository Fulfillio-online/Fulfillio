import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CourierProvider } from '@fulfillio/contracts';
import { OrderStatus } from '@prisma/client';

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

  async getOrderByTrackingCode(trackingCode: string) {
    return this.prisma.order.findFirst({
      where: { trackingCode },
      include: {
        merchant: {
          select: {
            merchantCode: true,
            businessName: true,
          },
        },
        items: {
          include: {
            variant: true,
          },
        },
      },
    });
  }

  async updateStatusByTrackingOrConsignment(
    trackingCode?: string,
    consignmentId?: string,
    status?: OrderStatus,
  ) {
    if (!status) return null;

    const existing = await this.prisma.order.findFirst({
      where: {
        OR: [
          ...(trackingCode ? [{ trackingCode }] : []),
          ...(consignmentId ? [{ consignmentId }] : []),
        ],
      },
    });

    if (!existing) return null;

    return this.prisma.order.update({
      where: { id: existing.id },
      data: { status },
    });
  }
}
