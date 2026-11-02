import { Injectable } from '@nestjs/common';
import { ReturnsRepository } from './returns.repository';

@Injectable()
export class ReturnsService {
  constructor(private readonly repository: ReturnsRepository) {}

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
}
