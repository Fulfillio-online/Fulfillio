import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class IntegrationsRepository {
  constructor(private readonly prisma: PrismaService) {}

  async upsertWooCommerceProduct(
    merchantId: string,
    payload: {
      externalId: string;
      title: string;
      sku: string;
      price: number;
      barcode?: string;
    },
  ) {
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
}
