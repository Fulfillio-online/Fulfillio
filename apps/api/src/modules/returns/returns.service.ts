import { Injectable, BadRequestException } from '@nestjs/common';
import { ReturnsRepository } from './returns.repository';

@Injectable()
export class ReturnsService {
  constructor(private readonly repository: ReturnsRepository) {}

  async processInboundRTO(orderId: string, isUndamaged: boolean) {
    const order = await this.repository.markOrderReturned(orderId);

    if (isUndamaged) {
      for (const item of order.items) {
        await this.repository.restockVariant(item.variantId, item.quantity);
      }
    }

    return {
      orderId,
      status: 'RETURNED',
      restocked: isUndamaged,
      processedAt: new Date().toISOString(),
    };
  }
}
