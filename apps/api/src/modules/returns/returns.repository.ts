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

  async listReturnedOrders(merchantId?: string) {
    return this.prisma.order.findMany({
      where: {
        status: 'RETURNED',
        ...(merchantId ? { merchantId } : {}),
      },
      include: {
        merchant: {
          select: {
            merchantCode: true,
            businessName: true,
          },
        },
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
      orderBy: { updatedAt: 'desc' },
    });
  }

  async getReturnAuditStats(merchantId?: string) {
    const totalReturnedOrders = await this.prisma.order.count({
      where: {
        status: 'RETURNED',
        ...(merchantId ? { merchantId } : {}),
      },
    });

    const totalDispatchedOrders = await this.prisma.order.count({
      where: {
        status: { in: ['DISPATCHED', 'DELIVERED', 'RETURNED'] },
        ...(merchantId ? { merchantId } : {}),
      },
    });

    const auditLogs = await this.prisma.inventoryAuditLog.findMany({
      where: {
        reason: { in: [StockMovementReason.RETURN_RESTOCK, StockMovementReason.DAMAGED_QUARANTINE] },
        ...(merchantId ? { merchantId } : {}),
      },
      select: {
        reason: true,
        quantityDelta: true,
      },
    });

    const totalRestockedUnits = auditLogs
      .filter((l) => l.reason === StockMovementReason.RETURN_RESTOCK)
      .reduce((sum, l) => sum + l.quantityDelta, 0);

    const totalQuarantineUnits = auditLogs
      .filter((l) => l.reason === StockMovementReason.DAMAGED_QUARANTINE)
      .reduce((sum, l) => sum + l.quantityDelta, 0);

    const returnRate =
      totalDispatchedOrders > 0
        ? Math.round((totalReturnedOrders / totalDispatchedOrders) * 100)
        : 0;

    return {
      totalReturnedOrders,
      totalDispatchedOrders,
      totalRestockedUnits,
      totalQuarantineUnits,
      returnRate,
    };
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
