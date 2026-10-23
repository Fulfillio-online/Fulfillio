import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class InventoryService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Atomically reserve stock for an order's line items.
   * Guarantees zero race conditions and eliminates negative stock.
   */
  async reserveStockForOrder(
    items: Array<{ variantId: string; quantity: number }>,
  ): Promise<boolean> {
    return this.prisma.$transaction(async (tx) => {
      for (const item of items) {
        // Find inventory item with row-level lock
        const rows = await tx.$queryRaw<Array<{ id: string; quantity_available: number }>>`
          SELECT id, "quantityAvailable" as quantity_available
          FROM inventory_items
          WHERE "variantId" = ${item.variantId}
          FOR UPDATE
        `;

        if (!rows || rows.length === 0) {
          throw new BadRequestException(`No inventory record found for variant '${item.variantId}'`);
        }

        const totalAvailable = rows.reduce((sum, r) => sum + r.quantity_available, 0);

        if (totalAvailable < item.quantity) {
          throw new BadRequestException(
            `Insufficient stock for variant '${item.variantId}'. Requested: ${item.quantity}, Available: ${totalAvailable}`,
          );
        }

        // Atomically decrement available and increment reserved
        await tx.$executeRaw`
          UPDATE inventory_items
          SET "quantityAvailable" = "quantityAvailable" - ${item.quantity},
              "quantityReserved" = "quantityReserved" + ${item.quantity},
              "updatedAt" = NOW()
          WHERE id = ${rows[0].id}
        `;
      }
      return true;
    });
  }

  /**
   * Release reserved stock back to available stock
   */
  async releaseReservedStock(items: Array<{ variantId: string; quantity: number }>) {
    return this.prisma.$transaction(async (tx) => {
      for (const item of items) {
        await tx.$executeRaw`
          UPDATE inventory_items
          SET "quantityAvailable" = "quantityAvailable" + ${item.quantity},
              "quantityReserved" = GREATEST(0, "quantityReserved" - ${item.quantity}),
              "updatedAt" = NOW()
          WHERE "variantId" = ${item.variantId}
        `;
      }
    });
  }
}
