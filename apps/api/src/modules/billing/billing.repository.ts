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
        netPayout: data.netPayout,
        isPaid: false,
      },
    });
  }

  async getMerchantSettlements(merchantId: string) {
    return this.prisma.settlement.findMany({
      where: { merchantId },
      orderBy: { createdAt: 'desc' },
    });
  }
}
