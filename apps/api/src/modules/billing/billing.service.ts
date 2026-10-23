import { Injectable } from '@nestjs/common';
import { BillingRepository } from './billing.repository';

@Injectable()
export class BillingService {
  constructor(private readonly repository: BillingRepository) {}

  async calculateMerchantSettlement(merchantId: string, grossCod: number, ordersCount: number) {
    const handlingFeePerOrder = 50; // 50 BDT per order
    const totalHandlingFees = ordersCount * handlingFeePerOrder;
    const storageFees = 2500; // standard monthly shelf fee
    const netPayout = grossCod - totalHandlingFees - storageFees;

    const cycleEnd = new Date();
    const cycleStart = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

    return this.repository.createSettlement({
      merchantId,
      cycleStart,
      cycleEnd,
      totalCodCollected: grossCod,
      storageFees,
      handlingFees: totalHandlingFees,
      netPayout,
    });
  }

  async getSettlementHistory(merchantId: string) {
    return this.repository.getMerchantSettlements(merchantId);
  }
}
