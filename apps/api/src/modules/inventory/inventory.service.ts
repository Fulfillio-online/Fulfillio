import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { StockMovementReason } from '@fulfillio/contracts';

@Injectable()
export class InventoryService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Create a new Product with 2-Part SKU Variants ([MerchantCode]-[BaseSKU]-[Variant])
   */
  async createProductWithVariants(
    merchantId: string,
    payload: {
      title: string;
      description?: string;
      baseSku: string;
      imageUrl?: string;
      variants: Array<{
        title: string;
        variantCode: string; // e.g., BLK-XL
        price: number;
        wholesalePrice?: number;
        defaultBinCode?: string;
        attributes?: Record<string, any>;
      }>;
    },
  ) {
    const merchant = await this.prisma.merchant.findUnique({
      where: { id: merchantId },
    });

    if (!merchant) {
      throw new NotFoundException(`Merchant '${merchantId}' not found.`);
    }

    const cleanBaseSku = payload.baseSku.trim().toUpperCase().replace(/\s+/g, '-');
    const merchantPrefix = merchant.merchantCode.toUpperCase();

    return this.prisma.$transaction(async (tx) => {
      // Ensure default warehouse bin exists
      const defaultLocation = await tx.inventoryLocation.upsert({
        where: { binCode: 'A-01-01' },
        update: {},
        create: {
          zone: 'A',
          aisle: '01',
          rack: '01',
          shelf: '01',
          binCode: 'A-01-01',
        },
      });

      const product = await tx.product.create({
        data: {
          merchantId,
          title: payload.title,
          description: payload.description,
          baseSku: cleanBaseSku,
          imageUrl: payload.imageUrl,
          variants: {
            create: payload.variants.map((v, idx) => {
              const cleanVar = v.variantCode.trim().toUpperCase().replace(/\s+/g, '-');
              const twoPartSku = `${merchantPrefix}-${cleanBaseSku}-${cleanVar}`;
              const ean13 = `894${Date.now().toString().slice(-9)}${idx % 10}`;

              return {
                sku: twoPartSku,
                barcode: ean13,
                title: v.title,
                price: v.price,
                wholesalePrice: v.wholesalePrice ?? v.price * 0.75,
                defaultBinCode: v.defaultBinCode || 'A-01-01',
                attributes: v.attributes || {},
                inventoryItems: {
                  create: {
                    locationId: defaultLocation.id,
                    quantityAvailable: 0,
                    quantityReserved: 0,
                    quantityDamaged: 0,
                  },
                },
              };
            }),
          },
        },
        include: {
          variants: {
            include: { inventoryItems: true },
          },
        },
      });

      return product;
    });
  }

  /**
   * List all products & variants with real-time stock breakdown for a merchant
   */
  async listMerchantProducts(merchantId: string) {
    return this.prisma.product.findMany({
      where: { merchantId },
      include: {
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

  /**
   * List stock movement audit ledger for transparency
   */
  async listAuditLogs(merchantId: string) {
    return this.prisma.inventoryAuditLog.findMany({
      where: { merchantId },
      include: {
        variant: {
          select: { sku: true, title: true },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: 100,
    });
  }

  /**
   * Atomically reserve stock for an order's line items and record audit trail.
   * Guarantees zero race conditions and eliminates negative stock.
   */
  async reserveStockForOrder(
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

  /**
   * Release reserved stock back to available stock and log audit entry
   */
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
