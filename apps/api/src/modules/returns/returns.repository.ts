import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { StockMovementReason } from '@fulfillio/contracts';

@Injectable()
export class ReturnsRepository {
  constructor(private readonly prisma: PrismaService) {}

  async resolveMerchantId(merchantIdOrCode?: string): Promise<string | undefined> {
    if (!merchantIdOrCode) return undefined;
    const clean = merchantIdOrCode.trim();
    if (!clean) return undefined;
    const found = await this.prisma.merchant.findFirst({
      where: {
        OR: [
          { id: clean },
          { merchantCode: clean.toUpperCase() },
          { email: clean.toLowerCase() },
        ],
      },
      select: { id: true },
    });
    return found?.id;
  }

  private async syncVariantStockAttrs(tx: any, variantId: string) {
    if (typeof tx.inventoryItem?.findMany !== 'function' || typeof tx.productVariant?.findUnique !== 'function') {
      return;
    }
    const allInvs = await tx.inventoryItem.findMany({
      where: { variantId },
      select: { quantityAvailable: true },
    });
    const totalAvail = (allInvs || []).reduce(
      (sum: number, r: any) => sum + Math.max(0, Number(r.quantityAvailable) || 0),
      0,
    );
    const variantRow = await tx.productVariant.findUnique({
      where: { id: variantId },
      select: { attributes: true },
    });
    if (variantRow) {
      const existingAttrs =
        variantRow.attributes && typeof variantRow.attributes === 'object'
          ? { ...(variantRow.attributes as Record<string, any>) }
          : {};
      await tx.productVariant.update({
        where: { id: variantId },
        data: {
          attributes: {
            ...existingAttrs,
            declaredStock: totalAvail,
            stock: totalAvail,
          },
        },
      });
    }
  }

  async findOrderReturnProcessingState(orderId: string) {
    const cleanId = (orderId || '').replace(/^#/, '').trim();
    const order = await this.prisma.order.findFirst({
      where: {
        OR: [{ id: orderId }, { id: cleanId }, { externalOrderId: orderId }, { externalOrderId: cleanId }],
      },
      include: { items: true },
    });
    if (!order) {
      throw new NotFoundException(`Order '${orderId}' not found.`);
    }
    const existingLog =
      typeof (this.prisma as any).inventoryAuditLog?.findFirst === 'function'
        ? await (this.prisma as any).inventoryAuditLog.findFirst({
            where: {
              referenceId: order.id,
              reason: {
                in: [StockMovementReason.RETURN_RESTOCK, StockMovementReason.DAMAGED_QUARANTINE],
              },
            },
            select: { id: true },
          })
        : null;
    return { order, alreadyProcessed: order.status === 'RETURNED' && Boolean(existingLog) };
  }

  async markOrderReturned(orderId: string) {
    const cleanId = (orderId || '').replace(/^#/, '').trim();
    const existing = await this.prisma.order.findFirst({
      where: {
        OR: [{ id: orderId }, { id: cleanId }, { externalOrderId: orderId }, { externalOrderId: cleanId }],
      },
      select: { id: true, status: true },
    });
    if (!existing) {
      throw new NotFoundException(`Order '${orderId}' not found.`);
    }
    const previousStatus = existing.status;
    const updated = await this.prisma.order.update({
      where: { id: existing.id },
      data: { status: 'RETURNED', returnedAt: new Date() },
      include: { items: true },
    });
    return { ...updated, previousStatus };
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
                inventoryItems: {
                  include: { location: true },
                },
              },
            },
          },
        },
      },
      orderBy: { updatedAt: 'desc' },
    });
  }

  async listCancelledOrders(merchantId?: string) {
    const orders = await this.prisma.order.findMany({
      where: {
        status: 'CANCELLED',
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
                inventoryItems: {
                  include: { location: true },
                },
              },
            },
          },
        },
      },
      orderBy: { updatedAt: 'desc' },
    });

    if (orders.length === 0) return [];

    // Fetch cancel/restock metadata directly from DB columns
    const ids = orders.map((o) => o.id);
    const metaRows = await this.prisma.$queryRaw<
      Array<{
        id: string;
        cancelReason: string | null;
        cancelledAt: Date | null;
        isRestocked: boolean | null;
        restockedAt: Date | null;
        restockedBin: string | null;
      }>
    >`
      SELECT "id", "cancelReason", "cancelledAt", "isRestocked", "restockedAt", "restockedBin"
      FROM "orders"
      WHERE "id" = ANY(${ids}::text[])
    `;

    const metaMap = new Map(metaRows.map((r) => [r.id, r]));

    return orders.map((o) => ({
      ...o,
      cancelMeta: metaMap.get(o.id) || {
        cancelReason: null,
        cancelledAt: o.updatedAt,
        isRestocked: false,
        restockedAt: null,
        restockedBin: null,
      },
    }));
  }

  async restockCancelledOrder(orderId: string, binCode: string, notes?: string) {
    const cleanId = orderId.replace(/^#/, '').trim();
    const cleanBin = (binCode || 'A-01-01').trim().toUpperCase();

    const order = await this.prisma.order.findUnique({
      where: { id: cleanId },
      include: {
        merchant: { select: { merchantCode: true, businessName: true } },
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

    if (!order) {
      throw new NotFoundException(`Order '${orderId}' not found.`);
    }

    if (order.status !== 'CANCELLED') {
      throw new BadRequestException(`Order '${orderId}' is not in CANCELLED status.`);
    }

    const metaRows = await this.prisma.$queryRaw<Array<{ isRestocked: boolean | null }>>`
      SELECT "isRestocked" FROM "orders" WHERE "id" = ${order.id}
    `;
    if (metaRows[0]?.isRestocked) {
      return {
        orderId: order.id,
        alreadyRestocked: true,
        restockedBin: cleanBin,
      };
    }

    return this.prisma.$transaction(async (tx) => {
      // 1. Ensure target bin location exists
      const parts = cleanBin.split('-');
      const location = await tx.inventoryLocation.upsert({
        where: { binCode: cleanBin },
        update: {},
        create: {
          zone: parts[0] || 'Z1',
          aisle: parts[1] || 'A01',
          rack: parts[2] || 'R01',
          shelf: parts[3] || 'S01',
          binCode: cleanBin,
          isDamaged: false,
        },
      });

      // 2. Restore stock for each order item with a variantId
      let totalUnitsRestocked = 0;
      for (const item of order.items) {
        if (!item.variantId) continue;
        const qty = item.quantity || 1;
        totalUnitsRestocked += qty;

        // Release reserved quantity safely on any existing inventory item for this variant
        const existingItems = await tx.inventoryItem.findMany({
          where: { variantId: item.variantId },
        });

        let remainingToRelease = qty;
        for (const inv of existingItems) {
          if (remainingToRelease <= 0) break;
          const releaseAmt = Math.min(inv.quantityReserved, remainingToRelease);
          if (releaseAmt > 0) {
            await tx.inventoryItem.update({
              where: { id: inv.id },
              data: { quantityReserved: { decrement: releaseAmt } },
            });
            remainingToRelease -= releaseAmt;
          }
        }

        // Increment quantityAvailable in the chosen target bin
        await tx.inventoryItem.upsert({
          where: {
            variantId_locationId: {
              variantId: item.variantId,
              locationId: location.id,
            },
          },
          update: {
            quantityAvailable: { increment: qty },
          },
          create: {
            variantId: item.variantId,
            locationId: location.id,
            quantityAvailable: qty,
            quantityReserved: 0,
            quantityDamaged: 0,
            reorderPoint: 10,
          },
        });

        // Sync ProductVariant attributes stock snapshot
        await this.syncVariantStockAttrs(tx, item.variantId);

        // Create immutable InventoryAuditLog entry
        await tx.inventoryAuditLog.create({
          data: {
            merchantId: order.merchantId,
            variantId: item.variantId,
            quantityDelta: qty,
            reason: StockMovementReason.ORDER_CANCELLED,
            referenceId: order.id,
            notes:
              (notes || '').trim() ||
              `Cancelled Order #${order.id} manually restocked to Bin ${cleanBin}`,
          },
        });
      }

      // 3. Mark order as restocked
      await tx.$executeRaw`
        UPDATE "orders"
        SET "isRestocked" = true,
            "restockedAt" = NOW(),
            "restockedBin" = ${cleanBin}
        WHERE "id" = ${order.id}
      `;

      return {
        orderId: order.id,
        isRestocked: true,
        restockedBin: cleanBin,
        restockedAt: new Date().toISOString(),
        totalUnitsRestocked,
      };
    });
  }

  async listRecoveryLedger(merchantId?: string) {
    return this.prisma.inventoryAuditLog.findMany({
      where: {
        reason: {
          in: [
            StockMovementReason.ORDER_CANCELLED,
            StockMovementReason.RETURN_RESTOCK,
            StockMovementReason.DAMAGED_QUARANTINE,
          ],
        },
        ...(merchantId ? { merchantId } : {}),
      },
      include: {
        variant: {
          include: {
            product: {
              include: {
                merchant: {
                  select: { merchantCode: true, businessName: true },
                },
              },
            },
            inventoryItems: {
              include: { location: true },
            },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: 100,
    });
  }

  async listWarehouseBins() {
    const locations = await this.prisma.inventoryLocation.findMany({
      where: { isDamaged: false },
      orderBy: { binCode: 'asc' },
      select: { binCode: true, zone: true },
    });
    return locations.map((l) => l.binCode);
  }

  async getReturnAuditStats(merchantId?: string) {
    const totalReturnedOrders = await this.prisma.order.count({
      where: {
        status: 'RETURNED',
        ...(merchantId ? { merchantId } : {}),
      },
    });

    const totalCancelledOrders = await this.prisma.order.count({
      where: {
        status: 'CANCELLED',
        ...(merchantId ? { merchantId } : {}),
      },
    });

    const totalDispatchedOrders = await this.prisma.order.count({
      where: {
        status: { in: ['DISPATCHED', 'DELIVERED', 'PARTIAL_DELIVERED', 'RETURNED'] },
        ...(merchantId ? { merchantId } : {}),
      },
    });

    const totalDeliveredTerminal = await this.prisma.order.count({
      where: {
        status: { in: ['DELIVERED', 'PARTIAL_DELIVERED'] },
        ...(merchantId ? { merchantId } : {}),
      },
    });

    const auditLogs = await this.prisma.inventoryAuditLog.findMany({
      where: {
        reason: {
          in: [
            StockMovementReason.RETURN_RESTOCK,
            StockMovementReason.DAMAGED_QUARANTINE,
            StockMovementReason.ORDER_CANCELLED,
          ],
        },
        ...(merchantId ? { merchantId } : {}),
      },
      select: {
        reason: true,
        quantityDelta: true,
      },
    });

    const totalRestockedUnits = auditLogs
      .filter(
        (l) =>
          l.reason === StockMovementReason.RETURN_RESTOCK ||
          l.reason === StockMovementReason.ORDER_CANCELLED,
      )
      .reduce((sum, l) => sum + l.quantityDelta, 0);

    const totalQuarantineUnits = auditLogs
      .filter((l) => l.reason === StockMovementReason.DAMAGED_QUARANTINE)
      .reduce((sum, l) => sum + l.quantityDelta, 0);

    const terminalOrdersCount = totalDeliveredTerminal + totalReturnedOrders;
    const returnRate =
      terminalOrdersCount > 0
        ? Math.round((totalReturnedOrders / terminalOrdersCount) * 10000) / 100
        : 0;

    return {
      totalReturnedOrders,
      totalCancelledOrders,
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
    releaseReservedFirst: boolean = false,
  ) {
    const qty = Math.max(0, Number(quantity) || 0);
    if (qty <= 0) return;

    return this.prisma.$transaction(async (tx) => {
      const existingItems = await tx.inventoryItem.findMany({
        where: { variantId },
        include: { location: true },
        orderBy: { quantityAvailable: 'desc' },
      });

      if (releaseReservedFirst) {
        let remainingReserve = qty;
        for (const inv of existingItems) {
          if (remainingReserve <= 0) break;
          const resAmt = Math.min(Math.max(0, Number(inv.quantityReserved) || 0), remainingReserve);
          if (resAmt > 0) {
            await tx.inventoryItem.update({
              where: { id: inv.id },
              data: { quantityReserved: { decrement: resAmt } },
            });
            remainingReserve -= resAmt;
          }
        }
      }

      if (existingItems.length > 0) {
        // Choose a single bin (prefer non-damaged shelf for undamaged restock, or damaged bin for quarantine)
        const targetItem = isUndamaged
          ? existingItems.find((it: any) => !it.location?.isDamaged) || existingItems[0]
          : existingItems.find((it: any) => it.location?.isDamaged) || existingItems[0];

        await tx.inventoryItem.update({
          where: { id: targetItem.id },
          data: isUndamaged
            ? { quantityAvailable: { increment: qty } }
            : { quantityDamaged: { increment: qty } },
        });
      } else {
        const binCode = isUndamaged ? 'A-01-01' : 'DMG-01';
        const loc = await tx.inventoryLocation.upsert({
          where: { binCode },
          update: {},
          create: {
            zone: isUndamaged ? 'Z1' : 'DMG',
            aisle: isUndamaged ? 'A01' : 'Q01',
            rack: 'R01',
            shelf: 'S01',
            binCode,
            isDamaged: !isUndamaged,
          },
        });
        await tx.inventoryItem.create({
          data: {
            variantId,
            locationId: loc.id,
            quantityAvailable: isUndamaged ? qty : 0,
            quantityReserved: 0,
            quantityDamaged: isUndamaged ? 0 : qty,
            reorderPoint: 10,
          },
        });
      }

      if (isUndamaged) {
        await this.syncVariantStockAttrs(tx, variantId);
      }

      await tx.inventoryAuditLog.create({
        data: {
          merchantId,
          variantId,
          quantityDelta: qty,
          reason: isUndamaged
            ? StockMovementReason.RETURN_RESTOCK
            : StockMovementReason.DAMAGED_QUARANTINE,
          referenceId: orderId,
          notes:
            reasonNotes ||
            (isUndamaged
              ? 'Courier RTO inspected & restocked to sellable shelf'
              : 'Damaged return routed to warehouse quarantine bin'),
        },
      });
    });
  }
}
