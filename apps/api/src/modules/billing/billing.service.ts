import { Injectable, NotFoundException } from '@nestjs/common';
import { BillingRepository } from './billing.repository';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class BillingService {
  constructor(
    private readonly repository: BillingRepository,
    private readonly prisma: PrismaService,
  ) {}

  async calculateMerchantSettlement(merchantId: string, grossCod?: number, ordersCount?: number) {
    const merchant = await this.prisma.merchant.findUnique({
      where: { id: merchantId },
    });

    if (!merchant) {
      throw new NotFoundException(`Merchant '${merchantId}' not found.`);
    }

    const baseHandlingRate = Number(merchant.baseHandlingFee) || 50;
    const monthlyStorage = Number(merchant.monthlyStorageFee) || 2500;

    // If counts are omitted, calculate directly from delivered orders in DB
    let totalGrossCod = grossCod;
    let count = ordersCount;

    if (totalGrossCod === undefined || count === undefined) {
      const delivered = await this.prisma.order.findMany({
        where: { merchantId, status: 'DELIVERED' },
        select: { codAmount: true },
      });
      totalGrossCod = delivered.reduce((sum, o) => sum + Number(o.codAmount), 0);
      count = delivered.length;
    }

    const totalHandlingFees = count * baseHandlingRate;
    const weeklyStorageFees = Math.round(monthlyStorage / 4); // Weekly cycle
    const netPayout = Math.max(0, totalGrossCod - totalHandlingFees - weeklyStorageFees);

    const cycleEnd = new Date();
    const cycleStart = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

    return this.repository.createSettlement({
      merchantId,
      cycleStart,
      cycleEnd,
      totalCodCollected: totalGrossCod,
      storageFees: weeklyStorageFees,
      handlingFees: totalHandlingFees,
      netPayout,
    });
  }

  async getSettlementHistory(merchantId?: string) {
    return this.repository.getMerchantSettlements(merchantId);
  }

  async markSettlementPaid(settlementId: string) {
    return this.repository.markSettlementAsPaid(settlementId);
  }

  async getBillingOverview(merchantId?: string) {
    return this.repository.getBillingAggregates(merchantId);
  }
}
