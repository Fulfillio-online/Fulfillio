import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { MemoTemplateLayout } from '@fulfillio/shared';

@Injectable()
export class MemoEngineRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findByCode(merchantId: string, memoCode: string) {
    return this.prisma.memoTemplate.findUnique({
      where: {
        merchantId_memoCode: {
          merchantId,
          memoCode: memoCode.toUpperCase(),
        },
      },
    });
  }

  async findDefault(merchantId: string) {
    return this.prisma.memoTemplate.findFirst({
      where: { merchantId, isDefault: true },
    });
  }

  async unsetDefault(merchantId: string) {
    return this.prisma.memoTemplate.updateMany({
      where: { merchantId, isDefault: true },
      data: { isDefault: false },
    });
  }

  async create(data: {
    merchantId: string;
    memoCode: string;
    name: string;
    isDefault: boolean;
    layout: MemoTemplateLayout;
  }) {
    return this.prisma.memoTemplate.create({
      data: {
        merchantId: data.merchantId,
        memoCode: data.memoCode.toUpperCase(),
        name: data.name,
        isDefault: data.isDefault,
        layout: data.layout as any,
      },
    });
  }

  async listByMerchant(merchantId: string) {
    return this.prisma.memoTemplate.findMany({
      where: { merchantId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOrderWithItemsAndMerchant(orderId: string) {
    return this.prisma.order.findUnique({
      where: { id: orderId },
      include: {
        merchant: true,
        items: {
          include: {
            variant: {
              include: {
                product: true,
              },
            },
          },
        },
      },
    });
  }
}
