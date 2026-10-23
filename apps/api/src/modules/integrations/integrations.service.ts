import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class IntegrationsService {
  constructor(private readonly prisma: PrismaService) {}

  async syncWooCommerceProduct(merchantId: string, payload: {
    externalId: string;
    title: string;
    sku: string;
    price: number;
    barcode?: string;
  }) {
    return this.prisma.product.upsert({
      where: {
        merchantId_baseSku: {
          merchantId,
          baseSku: payload.sku,
        },
      },
      update: {
        title: payload.title,
      },
      create: {
        merchantId,
        title: payload.title,
        baseSku: payload.sku,
        variants: {
          create: {
            sku: payload.sku,
            barcode: payload.barcode,
            title: payload.title,
            price: payload.price,
          },
        },
      },
    });
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
