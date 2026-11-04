import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class BillingRepository {
  constructor(private readonly prisma: PrismaService) {}

  async createSettlement(data: {
    merchantId: string;
    cycleStart: Date;
    cycleEnd: Date;
    totalCodCollected: number;
    storageFees: number;
    handlingFees: number;
    packagingFees?: number;
    netPayout: number;
  }) {
    return this.prisma.settlement.create({
      data: {
        merchantId: data.merchantId,
        cycleStart: data.cycleStart,
        cycleEnd: data.cycleEnd,
        totalCodCollected: data.totalCodCollected,
        storageFees: data.storageFees,
        handlingFees: data.handlingFees,
        packagingFees: data.packagingFees || 0,
        netPayout: data.netPayout,
        isPaid: false,
      },
    });
  }

  async getMerchantSettlements(merchantId?: string) {
    return this.prisma.settlement.findMany({
      where: {
        ...(merchantId ? { merchantId } : {}),
      },
      include: {
        merchant: {
          select: {
            merchantCode: true,
            businessName: true,
            payoutAccount: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async markSettlementAsPaid(settlementId: string) {
    return this.prisma.settlement.update({
      where: { id: settlementId },
      data: { isPaid: true },
    });
  }

  async getBillingAggregates(merchantId?: string) {
    const deliveredOrders = await this.prisma.order.findMany({
      where: {
        status: 'DELIVERED',
        ...(merchantId ? { merchantId } : {}),
      },
      select: {
        codAmount: true,
        packagingCost: true,
      },
    });

    const settlements = await this.prisma.settlement.findMany({
      where: {
        ...(merchantId ? { merchantId } : {}),
      },
    });

    const totalCodCollected = deliveredOrders.reduce(
      (sum, o) => sum + Number(o.codAmount),
      0,
    );

    const totalPackagingCost = deliveredOrders.reduce(
      (sum, o) => sum + Number(o.packagingCost),
      0,
    );

    const totalPaidPayouts = settlements
      .filter((s) => s.isPaid)
      .reduce((sum, s) => sum + Number(s.netPayout), 0);

    const totalPendingPayouts = settlements
      .filter((s) => !s.isPaid)
      .reduce((sum, s) => sum + Number(s.netPayout), 0);

    return {
      totalCodCollected,
      totalPackagingCost,
      totalPaidPayouts,
      totalPendingPayouts,
      settlementsCount: settlements.length,
      deliveredOrdersCount: deliveredOrders.length,
    };
  }
}
