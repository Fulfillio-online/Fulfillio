import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { StockMovementReason } from '@fulfillio/contracts';

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

  async restockOrQuarantineVariant(
    merchantId: string,
    orderId: string,
    variantId: string,
    quantity: number,
    isUndamaged: boolean,
    reasonNotes?: string,
  ) {
    return this.prisma.$transaction(async (tx) => {
      await tx.inventoryItem.updateMany({
        where: { variantId },
        data: isUndamaged
          ? { quantityAvailable: { increment: quantity } }
          : { quantityDamaged: { increment: quantity } },
      });

      await tx.inventoryAuditLog.create({
        data: {
          merchantId,
          variantId,
          quantityDelta: quantity,
          reason: isUndamaged
            ? StockMovementReason.RETURN_RESTOCK
            : StockMovementReason.DAMAGED_QUARANTINE,
          referenceId: orderId,
          notes:
            reasonNotes ||
            (isUndamaged
              ? 'Courier RTO inspected & restocked to sellable shelf'
              : 'Courier RTO damaged — routed to Quarantine Bin'),
        },
      });
    });
  }
}
