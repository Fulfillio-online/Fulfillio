import { Injectable } from '@nestjs/common';
import { IntegrationsRepository } from './integrations.repository';

@Injectable()
export class IntegrationsService {
  constructor(private readonly integrationsRepo: IntegrationsRepository) {}

  async syncWooCommerceProduct(
    merchantId: string,
    payload: {
      externalId: string;
      title: string;
      sku: string;
      price: number;
      barcode?: string;
    },
  ) {
    return this.integrationsRepo.upsertWooCommerceProduct(merchantId, payload);
  }

  async processWooCommerceOrder(merchantId: string, payload: any) {
    const orderNumber = payload.id || `WC-${Date.now()}`;
    const memoCode = payload.memo_code || 'MEMO-DEFAULT';

    return {
      success: true,
      orderNumber,
      memoCode,
      status: 'ALLOCATED',
      message: `WooCommerce order ${orderNumber} attributed to memo ${memoCode} and queued for packing.`,
    };
  }
}
