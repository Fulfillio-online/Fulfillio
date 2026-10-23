import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class ReturnsRepository {
  constructor(private readonly prisma: PrismaService) {}

  async markOrderReturned(orderId: string) {
    return this.prisma.order.update({
      where: { id: orderId },
      data: { status: 'RETURNED' },
      include: { items: true },
    });
  }

  async restockVariant(variantId: string, quantity: number) {
    return this.prisma.inventoryItem.updateMany({
      where: { variantId },
      data: {
        quantityAvailable: { increment: quantity },
      },
    });
  }
}
