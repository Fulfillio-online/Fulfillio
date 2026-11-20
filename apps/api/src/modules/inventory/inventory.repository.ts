import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { StockMovementReason } from '@fulfillio/contracts';

@Injectable()
export class InventoryRepository {
  constructor(private readonly prisma: PrismaService) {}

  private isConnectionError(err: any): boolean {
    return (
      err?.name === 'PrismaClientInitializationError' ||
      err?.name === 'PrismaClientRustPanicError' ||
      err?.code === 'P1001' ||
      err?.code === 'P1002' ||
      err?.message?.includes("Can't reach database server") ||
      err?.message?.includes('connect ECONNREFUSED')
    );
  }

  async findMerchantById(merchantId: string) {
    if (!merchantId) return null;
    if (this.prisma.isOffline()) {
      return this.prisma.fallbackStore.findMerchantById(merchantId) as any;
    }
    const clean = merchantId.trim();
    try {
      return await this.prisma.merchant.findFirst({
        where: {
          OR: [
            { id: clean },
            { merchantCode: clean.toUpperCase() },
            { email: clean.toLowerCase() },
          ],
        },
      });
    } catch (err: any) {
      if (this.isConnectionError(err)) {
        this.prisma.isConnected = false;
        return this.prisma.fallbackStore.findMerchantById(merchantId) as any;
      }
      throw err;
    }
  }

  async ensureProductImagesColumn() {
    if (this.prisma.isOffline()) return;
    try {
      await this.prisma.$executeRawUnsafe(
        `ALTER TABLE IF EXISTS "products" ADD COLUMN IF NOT EXISTS "images" text[] DEFAULT ARRAY[]::text[];`
      );
    } catch {
      // ignore
    }
  }

  async findProductByMerchantAndBaseSku(merchantId: string, baseSku: string) {
    if (this.prisma.isOffline()) {
      return this.prisma.fallbackStore.findProductByMerchantAndBaseSku(merchantId, baseSku) as any;
    }
    try {
      return await this.prisma.product.findFirst({
        where: {
          merchantId,
          baseSku,
        },
        select: {
          id: true,
          merchantId: true,
          title: true,
          baseSku: true,
        },
      });
    } catch (err: any) {
      if (this.isConnectionError(err)) {
        this.prisma.isConnected = false;
        return this.prisma.fallbackStore.findProductByMerchantAndBaseSku(merchantId, baseSku) as any;
      }
      if (err?.code === 'P2022') {
        await this.ensureProductImagesColumn();
        return await this.prisma.product.findFirst({
          where: {
            merchantId,
            baseSku,
          },
          select: {
            id: true,
            merchantId: true,
            title: true,
            baseSku: true,
          },
        });
      }
      throw err;
    }
  }

  async upsertMerchantStub(merchantCode: string) {
    if (this.prisma.isOffline()) {
      return this.prisma.fallbackStore.upsertMerchantStub(merchantCode) as any;
    }
    const cleanCode = merchantCode.trim().toUpperCase();
    const safeEmail = `${cleanCode.toLowerCase().replace(/[^a-z0-9]/g, '')}@fulfillio.online`;
    try {
      return await this.prisma.merchant.upsert({
        where: { merchantCode: cleanCode },
        update: {},
        create: {
          merchantCode: cleanCode,
          businessName: `Merchant Store (${cleanCode})`,
          ownerName: 'Store Owner',
          email: safeEmail,
          phone: '01700-000000',
          location: 'Dhaka, Bangladesh',
          status: 'APPROVED',
        },
      });
    } catch (err: any) {
      if (this.isConnectionError(err)) {
        this.prisma.isConnected = false;
        return this.prisma.fallbackStore.upsertMerchantStub(merchantCode) as any;
      }
      throw err;
    }
  }

  async upsertLocation(data: {
    zone: string;
    aisle: string;
    rack: string;
    shelf: string;
    binCode: string;
    isDamaged?: boolean;
  }) {
    if (this.prisma.isOffline()) {
      return this.prisma.fallbackStore.upsertLocation(data) as any;
    }
    try {
      return await this.prisma.inventoryLocation.upsert({
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
    } catch (err: any) {
      if (this.isConnectionError(err)) {
        this.prisma.isConnected = false;
        return this.prisma.fallbackStore.upsertLocation(data) as any;
      }
      throw err;
    }
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
    images?: string[];
    defaultLocationId: string;
    variants: Array<{
      sku: string;
      barcode: string;
      title: string;
      price: number;
      wholesalePrice?: number;
      defaultBinCode?: string;
      initialStock?: number;
      imageUrl?: string;
      attributes?: Record<string, any>;
    }>;
  }) {
    if (this.prisma.isOffline()) {
      return this.prisma.fallbackStore.createProductWithVariants(data) as any;
    }

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
          images: data.images || (sanitizedImageUrl ? [sanitizedImageUrl] : []),
        variants: {
          create: data.variants.map((v) => ({
            sku: v.sku,
            barcode: v.barcode,
            title: v.title,
            price: v.price,
            wholesalePrice: v.wholesalePrice,
            defaultBinCode: v.defaultBinCode || 'A-01-01',
            imageUrl: v.imageUrl,
            attributes: v.attributes || {},
            inventoryItems: {
              create: {
                locationId: data.defaultLocationId,
                quantityAvailable: Math.max(0, Number(v.initialStock) || 0),
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
      if (err?.code === 'P2022') {
        await this.ensureProductImagesColumn();
        try {
          return await this.prisma.product.create({
            data: {
              merchantId: data.merchantId,
              title: data.title,
              description: data.description,
              baseSku: data.baseSku,
              imageUrl: sanitizedImageUrl,
              images: data.images || (sanitizedImageUrl ? [sanitizedImageUrl] : []),
              variants: {
                create: data.variants.map((v) => ({
                  sku: v.sku,
                  barcode: v.barcode,
                  title: v.title,
                  price: v.price,
                  wholesalePrice: v.wholesalePrice,
                  defaultBinCode: v.defaultBinCode || 'A-01-01',
                  imageUrl: v.imageUrl,
                  attributes: v.attributes || {},
                  inventoryItems: {
                    create: {
                      locationId: data.defaultLocationId,
                      quantityAvailable: Math.max(0, Number(v.initialStock) || 0),
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
        } catch (retryErr: any) {
          console.error('[PostgreSQL Save Error] Retry after schema patch failed:', retryErr?.message || retryErr);
        }
      }
      if (err?.code === 'P2002') {
        try {
          const saltedVariants = data.variants.map((v, i) => ({
            ...v,
            sku: `${v.sku}-${Math.floor(100 + Math.random() * 900)}`,
            barcode: `894${Date.now().toString().slice(-7)}${i}${Math.floor(10 + Math.random() * 90)}`,
          }));
          return await this.prisma.product.create({
            data: {
              merchantId: data.merchantId,
              title: data.title,
              description: data.description,
              baseSku: `${data.baseSku}-${Date.now().toString().slice(-3)}`,
              imageUrl: sanitizedImageUrl,
              images: data.images || (sanitizedImageUrl ? [sanitizedImageUrl] : []),
              variants: {
                create: saltedVariants.map((v) => ({
                  sku: v.sku,
                  barcode: v.barcode,
                  title: v.title,
                  price: v.price,
                  wholesalePrice: v.wholesalePrice,
                  defaultBinCode: v.defaultBinCode || 'A-01-01',
                  imageUrl: v.imageUrl,
                  attributes: v.attributes || {},
                  inventoryItems: {
                    create: {
                      locationId: data.defaultLocationId,
                      quantityAvailable: Math.max(0, Number(v.initialStock) || 0),
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
        } catch (retryErr: any) {
          console.error('[PostgreSQL Save Error] Retry after unique constraint resolve failed:', retryErr?.message || retryErr);
        }
      }
      if (this.isConnectionError(err)) {
        this.prisma.isConnected = false;
        return this.prisma.fallbackStore.createProductWithVariants(data) as any;
      }
      console.error('[PostgreSQL Save Error] Failed to create product with variants:', err?.message || err);
      throw new BadRequestException(`PostgreSQL Save Error: ${err?.message || 'Database transaction failed'}`);
    }
  }

  async updateProductWithVariants(
    productId: string,
    data: {
      merchantId?: string;
      title?: string;
      description?: string;
      baseSku?: string;
      imageUrl?: string;
      images?: string[];
      defaultLocationId: string;
      variants?: Array<{
        id?: string;
        sku?: string;
        barcode?: string;
        title: string;
        price: number;
        wholesalePrice?: number;
        defaultBinCode?: string;
        initialStock?: number;
        imageUrl?: string;
        attributes?: Record<string, any>;
      }>;
    },
  ) {
    if (this.prisma.isOffline()) {
      return this.prisma.fallbackStore.updateProductWithVariants(productId, data.merchantId || 'MC-101', data) as any;
    }
    const searchConditions: any[] = [
      { id: productId },
      { baseSku: productId },
    ];
    if (data.baseSku) {
      searchConditions.push({ baseSku: data.baseSku });
    }
    let existing;
    try {
      existing = await this.prisma.product.findFirst({
        where: {
          OR: searchConditions,
        },
        include: {
          variants: {
            include: {
              inventoryItems: true,
              orderItems: { select: { id: true } },
              inboundItems: { select: { id: true } },
            },
          },
        },
      });
    } catch (err: any) {
      if (err?.code === 'P2022') {
        await this.ensureProductImagesColumn();
        existing = await this.prisma.product.findFirst({
          where: {
            OR: searchConditions,
          },
          include: {
            variants: {
              include: {
                inventoryItems: true,
                orderItems: { select: { id: true } },
                inboundItems: { select: { id: true } },
              },
            },
          },
        });
      } else {
        throw err;
      }
    }

    if (!existing) {
      throw new BadRequestException(`Product with ID '${productId}' not found.`);
    }

    // Update Product scalar fields
    try {
      await this.prisma.product.update({
        where: { id: existing.id },
        data: {
          title: data.title ?? existing.title,
          description: data.description !== undefined ? data.description : existing.description,
          baseSku: data.baseSku ?? existing.baseSku,
          imageUrl: data.imageUrl !== undefined ? data.imageUrl : existing.imageUrl,
          images: data.images !== undefined ? data.images : existing.images,
        },
      });
    } catch (err: any) {
      if (err?.code === 'P2022') {
        await this.ensureProductImagesColumn();
        await this.prisma.product.update({
          where: { id: existing.id },
          data: {
            title: data.title ?? existing.title,
            description: data.description !== undefined ? data.description : existing.description,
            baseSku: data.baseSku ?? existing.baseSku,
            imageUrl: data.imageUrl !== undefined ? data.imageUrl : existing.imageUrl,
            images: data.images !== undefined ? data.images : existing.images,
          },
        });
      } else {
        throw err;
      }
    }

    // If variants were provided, synchronize them
    if (data.variants && data.variants.length > 0) {
      const incomingSkus = new Set(data.variants.map((v) => v.sku).filter(Boolean));
      const incomingIds = new Set(data.variants.map((v) => v.id).filter(Boolean));

      for (const v of data.variants) {
        const matchingExisting = existing.variants.find(
          (ev) =>
            (v.id && ev.id === v.id) ||
            (v.sku && ev.sku === v.sku) ||
            (v.sku && (ev.sku.endsWith(v.sku) || v.sku.endsWith(ev.sku))) ||
            ((ev.attributes as any)?.color && (v.attributes as any)?.color &&
             (ev.attributes as any)?.color?.trim()?.toLowerCase() === (v.attributes as any)?.color?.trim()?.toLowerCase() &&
             (ev.attributes as any)?.size?.trim()?.toLowerCase() === (v.attributes as any)?.size?.trim()?.toLowerCase())
        );

        if (matchingExisting) {
          await this.prisma.productVariant.update({
            where: { id: matchingExisting.id },
            data: {
              title: v.title,
              price: v.price,
              wholesalePrice: v.wholesalePrice,
              imageUrl: v.imageUrl,
              attributes: v.attributes || {},
              defaultBinCode: v.defaultBinCode || matchingExisting.defaultBinCode,
            },
          });

          if (v.initialStock !== undefined) {
            const stockQty = Math.max(0, Number(v.initialStock) || 0);
            const defaultItem = matchingExisting.inventoryItems[0];
            if (defaultItem) {
              await this.prisma.inventoryItem.update({
                where: { id: defaultItem.id },
                data: { quantityAvailable: stockQty },
              });
            } else {
              await this.prisma.inventoryItem.create({
                data: {
                  variantId: matchingExisting.id,
                  locationId: data.defaultLocationId,
                  quantityAvailable: stockQty,
                  quantityReserved: 0,
                  quantityDamaged: 0,
                },
              });
            }
          }
        } else {
          // Create new variant
          await this.prisma.productVariant.create({
            data: {
              productId: existing.id,
              sku: v.sku || `SKU-${Date.now().toString().slice(-6)}`,
              barcode: v.barcode || `894${Date.now().toString().slice(-9)}`,
              title: v.title,
              price: v.price,
              wholesalePrice: v.wholesalePrice,
              defaultBinCode: v.defaultBinCode || 'A-01-01',
              imageUrl: v.imageUrl,
              attributes: v.attributes || {},
              inventoryItems: {
                create: {
                  locationId: data.defaultLocationId,
                  quantityAvailable: Math.max(0, Number(v.initialStock) || 0),
                  quantityReserved: 0,
                  quantityDamaged: 0,
                },
              },
            },
          });
        }
      }

      // If any existing variant was deleted from variant list, remove only if not tied to orders
      for (const ev of existing.variants) {
        const isStillPresent = incomingIds.has(ev.id) || incomingSkus.has(ev.sku);
        if (!isStillPresent) {
          if (ev.orderItems.length === 0 && ev.inboundItems.length === 0) {
            await this.prisma.productVariant.delete({
              where: { id: ev.id },
            });
          }
        }
      }
    }

    return this.findProductById(existing.id);
  }

  async findProducts(merchantId?: string) {
    if (this.prisma.isOffline()) {
      return this.prisma.fallbackStore.findProducts(merchantId) as any;
    }
    const where: any = {};
    if (merchantId) {
      where.OR = [
        { merchantId },
        { merchant: { merchantCode: merchantId.trim().toUpperCase() } },
      ];
    }

    try {
      return await this.prisma.product.findMany({
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
    } catch (err: any) {
      if (this.isConnectionError(err)) {
        this.prisma.isConnected = false;
        return this.prisma.fallbackStore.findProducts(merchantId) as any;
      }
      if (err?.code === 'P2022') {
        await this.ensureProductImagesColumn();
        return await this.prisma.product.findMany({
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
      throw err;
    }
  }

  async findProductById(id: string, merchantId?: string) {
    if (this.prisma.isOffline()) {
      return this.prisma.fallbackStore.findProductById(id, merchantId) as any;
    }
    const where: any = { id };
    if (merchantId) where.merchantId = merchantId;

    try {
      return await this.prisma.product.findFirst({
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
    } catch (err: any) {
      if (this.isConnectionError(err)) {
        this.prisma.isConnected = false;
        return this.prisma.fallbackStore.findProductById(id, merchantId) as any;
      }
      if (err?.code === 'P2022') {
        await this.ensureProductImagesColumn();
        return await this.prisma.product.findFirst({
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
      throw err;
    }
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
