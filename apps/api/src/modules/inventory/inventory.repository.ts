import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { StockMovementReason } from '@fulfillio/contracts';

@Injectable()
export class InventoryRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findMerchantById(merchantId: string) {
    if (!merchantId) return null;
    return this.prisma.merchant.findFirst({
      where: {
        OR: [
          { id: merchantId },
          { merchantCode: merchantId },
        ],
      },
    });
  }

  async findProductByMerchantAndBaseSku(merchantId: string, baseSku: string) {
    return this.prisma.product.findFirst({
      where: {
        merchantId,
        baseSku,
      },
    });
  }

  async upsertLocation(data: {
    zone: string;
    aisle: string;
    rack: string;
    shelf: string;
    binCode: string;
    isDamaged?: boolean;
  }) {
    return this.prisma.inventoryLocation.upsert({
      where: { binCode: data.binCode.toUpperCase() },
      update: { isDamaged: data.isDamaged ?? false },
      create: {
        zone: data.zone,
        aisle: data.aisle,
        rack: data.rack,
        shelf: data.shelf,
        binCode: data.binCode.toUpperCase(),
        isDamaged: data.isDamaged ?? false,
      },
    });
  }

  async listLocations() {
    return this.prisma.inventoryLocation.findMany({
      orderBy: { binCode: 'asc' },
    });
  }

  async createProductWithVariants(data: {
    merchantId: string;
    title: string;
    description?: string;
    baseSku: string;
    imageUrl?: string;
    defaultLocationId: string;
    variants: Array<{
      sku: string;
      barcode: string;
      title: string;
      price: number;
      wholesalePrice?: number;
      defaultBinCode?: string;
      attributes?: Record<string, any>;
    }>;
  }) {
    // Sanitize imageUrl to prevent PostgreSQL UTF-8 null byte error (0x00)
    const sanitizedImageUrl = data.imageUrl
      ? data.imageUrl.replace(/\0/g, '').replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g, '')
      : null;

    try {
      return await this.prisma.product.create({
        data: {
          merchantId: data.merchantId,
          title: data.title,
          description: data.description,
          baseSku: data.baseSku,
          imageUrl: sanitizedImageUrl,
        variants: {
          create: data.variants.map((v) => ({
            sku: v.sku,
            barcode: v.barcode,
            title: v.title,
            price: v.price,
            wholesalePrice: v.wholesalePrice,
            defaultBinCode: v.defaultBinCode || 'A-01-01',
            attributes: v.attributes || {},
            inventoryItems: {
              create: {
                locationId: data.defaultLocationId,
                quantityAvailable: 0,
                quantityReserved: 0,
                quantityDamaged: 0,
              },
            },
          })),
        },
      },
      include: {
        variants: {
          include: { inventoryItems: true },
        },
      },
    });
    } catch (err: any) {
      console.error('[PostgreSQL Save Error] Failed to create product with variants:', err?.message || err);
      throw new BadRequestException(`PostgreSQL Save Error: ${err?.message || 'Database transaction failed'}`);
    }
  }

  async findProducts(merchantId?: string) {
    const where: any = {};
    if (merchantId) where.merchantId = merchantId;

    return this.prisma.product.findMany({
      where,
      include: {
        merchant: {
          select: { merchantCode: true, businessName: true },
        },
        variants: {
          include: {
            inventoryItems: {
              include: { location: true },
            },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findProductById(id: string, merchantId?: string) {
    const where: any = { id };
    if (merchantId) where.merchantId = merchantId;

    return this.prisma.product.findFirst({
      where,
      include: {
        merchant: true,
        variants: {
          include: {
            inventoryItems: {
              include: { location: true },
            },
          },
        },
      },
    });
  }

  async findAuditLogs(merchantId?: string, limit: number = 100) {
    const where: any = {};
    if (merchantId) where.merchantId = merchantId;

    return this.prisma.inventoryAuditLog.findMany({
      where,
      include: {
        variant: {
          select: { sku: true, title: true },
        },
        merchant: {
          select: { merchantCode: true, businessName: true },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });
  }

  async adjustStock(data: {
    variantId: string;
    locationId: string;
    quantityDelta: number;
    isDamaged?: boolean;
    reason?: string;
    merchantId?: string;
    performedByUserId?: string;
  }) {
    return this.prisma.$transaction(async (tx) => {
      const item = await tx.inventoryItem.upsert({
        where: {
          variantId_locationId: {
            variantId: data.variantId,
            locationId: data.locationId,
          },
        },
        update: data.isDamaged
          ? { quantityDamaged: { increment: data.quantityDelta } }
          : { quantityAvailable: { increment: data.quantityDelta } },
        create: {
          variantId: data.variantId,
          locationId: data.locationId,
          quantityAvailable: data.isDamaged ? 0 : Math.max(0, data.quantityDelta),
          quantityDamaged: data.isDamaged ? Math.max(0, data.quantityDelta) : 0,
          quantityReserved: 0,
        },
      });

      if (data.merchantId) {
        await tx.inventoryAuditLog.create({
          data: {
            merchantId: data.merchantId,
            variantId: data.variantId,
            quantityDelta: data.quantityDelta,
            reason: data.isDamaged
              ? StockMovementReason.DAMAGED_QUARANTINE
              : StockMovementReason.MANUAL_ADJUSTMENT,
            performedByUserId: data.performedByUserId,
            notes: data.reason || 'Manual warehouse stock adjustment',
          },
        });
      }

      return {
        item,
        reason: data.reason,
        adjustedAt: new Date().toISOString(),
      };
    });
  }

  async reserveStockAtomically(
    items: Array<{ variantId: string; quantity: number }>,
    merchantId?: string,
    orderReference?: string,
  ): Promise<boolean> {
    return this.prisma.$transaction(async (tx) => {
      for (const item of items) {
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

        await tx.$executeRaw`
          UPDATE inventory_items
          SET "quantityAvailable" = "quantityAvailable" - ${item.quantity},
              "quantityReserved" = "quantityReserved" + ${item.quantity},
              "updatedAt" = NOW()
          WHERE id = ${rows[0].id}
        `;

        if (merchantId) {
          await tx.inventoryAuditLog.create({
            data: {
              merchantId,
              variantId: item.variantId,
              quantityDelta: -item.quantity,
              reason: StockMovementReason.ORDER_RESERVED,
              referenceId: orderReference,
              notes: `Reserved ${item.quantity} units for order`,
            },
          });
        }
      }
      return true;
    });
  }

  async releaseReservedStock(
    items: Array<{ variantId: string; quantity: number }>,
    merchantId?: string,
    orderReference?: string,
  ) {
    return this.prisma.$transaction(async (tx) => {
      for (const item of items) {
        await tx.$executeRaw`
          UPDATE inventory_items
          SET "quantityAvailable" = "quantityAvailable" + ${item.quantity},
              "quantityReserved" = GREATEST(0, "quantityReserved" - ${item.quantity}),
              "updatedAt" = NOW()
          WHERE "variantId" = ${item.variantId}
        `;

        if (merchantId) {
          await tx.inventoryAuditLog.create({
            data: {
              merchantId,
              variantId: item.variantId,
              quantityDelta: item.quantity,
              reason: StockMovementReason.ORDER_CANCELLED,
              referenceId: orderReference,
              notes: `Released ${item.quantity} reserved units from cancelled order`,
            },
          });
        }
      }
    });
  }
}
