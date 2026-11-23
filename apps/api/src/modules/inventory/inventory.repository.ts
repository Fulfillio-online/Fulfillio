import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { StockMovementReason } from '@fulfillio/contracts';

@Injectable()
export class InventoryRepository {
  constructor(private readonly prisma: PrismaService) {}


  async findMerchantById(merchantId: string) {
    if (!merchantId) return null;
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
      throw err;
    }
  }

  async ensureProductImagesColumn() {
    try {
      await this.prisma.$executeRawUnsafe(
        `ALTER TABLE IF EXISTS "products" ADD COLUMN IF NOT EXISTS "images" text[] DEFAULT ARRAY[]::text[];
         ALTER TABLE IF EXISTS "products" ADD COLUMN IF NOT EXISTS "status" text DEFAULT 'PUBLISHED';`
      );
    } catch {
      // ignore
    }
  }

  async findProductByMerchantAndBaseSku(merchantId: string, baseSku: string) {
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
    status?: string;
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

    // Sanitize imageUrl to prevent PostgreSQL UTF-8 null byte error (0x00)
    const sanitizedImageUrl = data.imageUrl
      ? data.imageUrl.replace(/\0/g, '').replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g, '')
      : null;

    const rawStatus = (data.status || 'PENDING_APPROVAL').toUpperCase();
    const cleanStatus =
      rawStatus === 'DRAFT'
        ? 'DRAFT'
        : rawStatus === 'APPROVED'
          ? 'APPROVED'
          : rawStatus === 'STOCK_STORED' || rawStatus === 'PUBLISHED'
            ? 'STOCK_STORED'
            : 'PENDING_APPROVAL';
    const isStockStoredInitially = cleanStatus === 'STOCK_STORED';
    try {
      return await (this.prisma.product as any).create({
        data: {
          merchantId: data.merchantId,
          title: data.title,
          description: data.description,
          baseSku: data.baseSku,
          imageUrl: sanitizedImageUrl,
          images: data.images || (sanitizedImageUrl ? [sanitizedImageUrl] : []),
          status: cleanStatus,
          variants: {
          create: data.variants.map((v) => ({
            sku: v.sku,
            barcode: v.barcode,
            title: v.title,
            price: v.price,
            wholesalePrice: v.wholesalePrice,
            defaultBinCode: cleanStatus === 'PENDING_APPROVAL' ? 'Pending Approval' : (v.defaultBinCode || 'A-01-01'),
            imageUrl: v.imageUrl,
            attributes: {
              ...(v.attributes || {}),
              declaredStock: Math.max(0, Number(v.initialStock) || 0),
            },
            inventoryItems: {
              create: {
                locationId: data.defaultLocationId,
                quantityAvailable: isStockStoredInitially ? Math.max(0, Number(v.initialStock) || 0) : 0,
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
          return await (this.prisma.product as any).create({
            data: {
              merchantId: data.merchantId,
              title: data.title,
              description: data.description,
              baseSku: data.baseSku,
              imageUrl: sanitizedImageUrl,
              images: data.images || (sanitizedImageUrl ? [sanitizedImageUrl] : []),
              status: cleanStatus,
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
          return await (this.prisma.product as any).create({
            data: {
              merchantId: data.merchantId,
              title: data.title,
              description: data.description,
              baseSku: `${data.baseSku}-${Date.now().toString().slice(-3)}`,
              imageUrl: sanitizedImageUrl,
              images: data.images || (sanitizedImageUrl ? [sanitizedImageUrl] : []),
              status: cleanStatus,
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
      status?: string;
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

    // Security & Inventory Integrity Guard:
    // Merchants can strictly only edit products during Draft or First-Time Pending Approval (0 stock in warehouse).
    // Once accepted by admin (APPROVED / STOCK_STORED / assigned bin), direct editing and moving to Draft are locked.
    const existingStatus = ((existing as any).status || '').trim().toUpperCase();
    const isDraft = existingStatus === 'DRAFT';
    const isPending = existingStatus === 'PENDING_APPROVAL';
    const existingTotalStock = (existing.variants || []).reduce(
      (sum: number, v: any) =>
        sum + (v.inventoryItems || []).reduce((s: number, it: any) => s + (it.quantityAvailable || 0), 0),
      0,
    );
    const hasApprovedBin = (existing.variants || []).some(
      (v: any) =>
        v.defaultBinCode &&
        v.defaultBinCode !== 'Pending Approval' &&
        v.defaultBinCode !== 'Assigned on intake',
    );
    const isAccepted = existingStatus === 'APPROVED' || existingStatus === 'STOCK_STORED' || hasApprovedBin;

    if (isAccepted || (!isPending && !isDraft) || existingTotalStock > 0) {
      throw new BadRequestException(
        existingTotalStock > 0
          ? `Cannot edit product '${existing.title}': Product already has ${existingTotalStock} pcs stored in the warehouse. Direct editing is locked.`
          : isAccepted
          ? `Action Blocked: Cannot edit product '${existing.title}'. After warehouse admin accepts a product, it cannot be edited or moved to Draft.`
          : `Cannot edit product '${existing.title}': Merchants can strictly only edit products in Draft or First-Time Pending Approval status (current status: ${existingStatus}).`,
      );
    }

    // Update Product scalar fields
    const rawUpdateStatus = data.status !== undefined ? data.status.toUpperCase() : (existing as any).status;
    const updatedStatus =
      rawUpdateStatus === 'DRAFT'
        ? 'DRAFT'
        : rawUpdateStatus === 'PENDING_APPROVAL'
          ? 'PENDING_APPROVAL'
          : rawUpdateStatus === 'APPROVED'
            ? 'APPROVED'
            : rawUpdateStatus === 'STOCK_STORED' || rawUpdateStatus === 'PUBLISHED'
              ? 'STOCK_STORED'
              : (existing as any).status || 'PENDING_APPROVAL';

    if (updatedStatus === 'DRAFT' && isAccepted) {
      throw new BadRequestException(
        `Action Blocked: Cannot move product '${existing.title}' to Draft. After warehouse admin accepts a product, it cannot be drafted.`
      );
    }
    try {
      await (this.prisma.product as any).update({
        where: { id: existing.id },
        data: {
          title: data.title ?? existing.title,
          description: data.description !== undefined ? data.description : existing.description,
          baseSku: data.baseSku ?? existing.baseSku,
          imageUrl: data.imageUrl !== undefined ? data.imageUrl : existing.imageUrl,
          images: data.images !== undefined ? data.images : existing.images,
          status: updatedStatus,
        },
      });
    } catch (err: any) {
      if (err?.code === 'P2022') {
        await this.ensureProductImagesColumn();
        await (this.prisma.product as any).update({
          where: { id: existing.id },
          data: {
            title: data.title ?? existing.title,
            description: data.description !== undefined ? data.description : existing.description,
            baseSku: data.baseSku ?? existing.baseSku,
            imageUrl: data.imageUrl !== undefined ? data.imageUrl : existing.imageUrl,
            images: data.images !== undefined ? data.images : existing.images,
            status: updatedStatus,
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

        const nextAttributes = {
          ...(v.attributes || {}),
          ...(v.initialStock !== undefined
            ? { declaredStock: Math.max(0, Number(v.initialStock) || 0) }
            : {}),
        };
        const isPhysicalStored = updatedStatus === 'STOCK_STORED';

        if (matchingExisting) {
          await this.prisma.productVariant.update({
            where: { id: matchingExisting.id },
            data: {
              title: v.title,
              price: v.price,
              wholesalePrice: v.wholesalePrice,
              imageUrl: v.imageUrl,
              attributes: nextAttributes,
              defaultBinCode: v.defaultBinCode || matchingExisting.defaultBinCode,
            },
          });

          if (v.initialStock !== undefined) {
            const stockQty = isPhysicalStored ? Math.max(0, Number(v.initialStock) || 0) : 0;
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
              attributes: nextAttributes,
              inventoryItems: {
                create: {
                  locationId: data.defaultLocationId,
                  quantityAvailable: isPhysicalStored ? Math.max(0, Number(v.initialStock) || 0) : 0,
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

  async updateProductStatus(productId: string, status: string) {
    const rawStatus = (status || '').trim().toUpperCase();
    const initialCleanStatus =
      rawStatus === 'DRAFT'
        ? 'DRAFT'
        : rawStatus === 'PENDING_APPROVAL'
          ? 'PENDING_APPROVAL'
          : rawStatus === 'APPROVED'
            ? 'APPROVED'
            : rawStatus === 'STOCK_STORED'
              ? 'STOCK_STORED'
              : 'PUBLISHED';
    await this.ensureProductImagesColumn();

    const searchConditions: any[] = [
      { id: productId },
      { baseSku: productId },
    ];

    let existing = await this.prisma.product.findFirst({
      where: { OR: searchConditions },
      include: {
        variants: {
          include: { inventoryItems: true },
        },
      },
    });

    if (!existing) {
      const variant = await this.prisma.productVariant.findFirst({
        where: { OR: [{ id: productId }, { sku: productId }] },
        include: {
          product: {
            include: {
              variants: {
                include: { inventoryItems: true },
              },
            },
          },
        },
      });
      if (variant?.product) {
        existing = variant.product;
      }
    }

    if (!existing) {
      throw new BadRequestException(`Product with ID '${productId}' not found.`);
    }

    const existingStatus = ((existing as any).status || '').trim().toUpperCase();
    const hasApprovedBin = (existing.variants || []).some(
      (v: any) =>
        v.defaultBinCode &&
        v.defaultBinCode !== 'Pending Approval' &&
        v.defaultBinCode !== 'Assigned on intake',
    );
    const isAccepted = existingStatus === 'APPROVED' || existingStatus === 'STOCK_STORED' || hasApprovedBin;

    // Rule: After warehouse admin accepts a product, it cannot be drafted
    if (initialCleanStatus === 'DRAFT' && isAccepted) {
      throw new BadRequestException(
        `Action Blocked: Cannot move product '${existing.title}' to Draft. After warehouse admin accepts a product, it cannot be drafted or directly edited.`
      );
    }

    let finalStatus = initialCleanStatus;
    if (initialCleanStatus === 'PUBLISHED') {
      if (existingStatus === 'DRAFT') {
        finalStatus = 'PENDING_APPROVAL';
      } else {
        const totalStock = (existing.variants || []).reduce(
          (sum: number, v: any) =>
            sum + (v.inventoryItems || []).reduce((s: number, it: any) => s + (it.quantityAvailable || 0), 0),
          0,
        );
        finalStatus = totalStock > 0 ? 'STOCK_STORED' : hasApprovedBin ? 'APPROVED' : 'PENDING_APPROVAL';
      }
    }

    await (this.prisma.product as any).update({
      where: { id: existing.id },
      data: { status: finalStatus },
    });

    return this.findProductById(existing.id);
  }

  /**
   * Step 1: Admin Approves Merchant Product Catalog Spec / Store Request
   * Sets status to APPROVED (when catalog only / awaiting physical stock arrival)
   * or STOCK_STORED (when stock is accepted immediately).
   */
  async approveProduct(
    productId: string,
    data: {
      binCode?: string;
      finalQty?: number;
      acceptStockNow?: boolean;
      variantStocks?: Record<string, number>;
    },
  ) {
    const binCode = (data.binCode || 'A-01-02').trim().toUpperCase();
    const isStockAccepted = data.acceptStockNow ?? (typeof data.finalQty === 'number' && data.finalQty > 0);
    const finalStock = isStockAccepted ? Math.max(0, Number(data.finalQty) || 0) : 0;
    const nextStatus = isStockAccepted && finalStock > 0 ? 'STOCK_STORED' : 'APPROVED';


    await this.ensureProductImagesColumn();

    const searchConditions: any[] = [
      { id: productId },
      { baseSku: productId },
    ];

    let existing = await this.prisma.product.findFirst({
      where: { OR: searchConditions },
      include: {
        variants: {
          include: {
            inventoryItems: true,
          },
        },
      },
    });

    if (!existing) {
      const variant = await this.prisma.productVariant.findFirst({
        where: { OR: [{ id: productId }, { sku: productId }] },
        include: {
          product: {
            include: {
              variants: {
                include: { inventoryItems: true },
              },
            },
          },
        },
      });
      if (variant?.product) {
        existing = variant.product;
      }
    }

    if (!existing) {
      throw new BadRequestException(`Product with ID '${productId}' not found.`);
    }

    // Ensure bin location exists in InventoryLocation
    const binParts = binCode.split('-');
    const defaultLocation = await this.upsertLocation({
      zone: binParts[0] || 'A',
      aisle: binParts[1] || '01',
      rack: binParts[2] || '01',
      shelf: binParts[3] || '01',
      binCode,
    });

    const effectiveNextStatus = isStockAccepted && finalStock > 0 ? 'STOCK_STORED' : 'APPROVED';

    // 1. Update Product status to APPROVED (or STOCK_STORED if stock accepted now)
    await (this.prisma.product as any).update({
      where: { id: existing.id },
      data: { status: effectiveNextStatus },
    });

    // 2. Update all variants with binCode & stock
    for (const v of existing.variants) {
      await this.prisma.productVariant.update({
        where: { id: v.id },
        data: { defaultBinCode: binCode },
      });

      let vStock = finalStock;
      if (data.variantStocks) {
        if (data.variantStocks[v.id] !== undefined) {
          vStock = Number(data.variantStocks[v.id]) || 0;
        } else if (data.variantStocks[v.sku] !== undefined) {
          vStock = Number(data.variantStocks[v.sku]) || 0;
        }
      }
      const effectiveVariantQty = isStockAccepted ? Math.max(0, vStock) : 0;

      const defaultItem = v.inventoryItems[0];
      if (defaultItem) {
        await this.prisma.inventoryItem.update({
          where: { id: defaultItem.id },
          data: {
            quantityAvailable: effectiveVariantQty,
            locationId: defaultLocation.id,
          },
        });
      } else {
        await this.prisma.inventoryItem.create({
          data: {
            variantId: v.id,
            locationId: defaultLocation.id,
            quantityAvailable: effectiveVariantQty,
            quantityReserved: 0,
            quantityDamaged: 0,
          },
        });
      }

      if (isStockAccepted && effectiveVariantQty > 0) {
        try {
          await this.prisma.inventoryAuditLog.create({
            data: {
              merchantId: existing.merchantId,
              variantId: v.id,
              quantityDelta: effectiveVariantQty,
              reason: StockMovementReason.INBOUND_ASN,
              notes: `Catalog approved & initial stock accepted into Bin ${binCode} (${effectiveVariantQty} pcs)`,
            },
          });
        } catch {}
      }
    }

    return this.findProductById(existing.id);
  }

  /**
   * Step 2: Accept Physical Stock into Warehouse (Store Done -> STOCK_STORED)
   * When physical items arrive at warehouse dock, warehouse receives goods,
   * counts quantity, slots into bin, and activates merchant order fulfillment.
   */
  async acceptStock(
    productId: string,
    data: {
      quantity: number;
      binCode?: string;
      challanOrTracking?: string;
      note?: string;
    },
  ) {
    const intakeQty = Math.max(1, Number(data.quantity) || 1);
    const binCode = (data.binCode || 'A-01-02').trim().toUpperCase();


    await this.ensureProductImagesColumn();

    const searchConditions: any[] = [
      { id: productId },
      { baseSku: productId },
    ];

    let existing = await this.prisma.product.findFirst({
      where: { OR: searchConditions },
      include: {
        variants: {
          include: {
            inventoryItems: true,
          },
        },
      },
    });

    if (!existing) {
      const variant = await this.prisma.productVariant.findFirst({
        where: { OR: [{ id: productId }, { sku: productId }] },
        include: {
          product: {
            include: {
              variants: {
                include: { inventoryItems: true },
              },
            },
          },
        },
      });
      if (variant?.product) {
        existing = variant.product;
      }
    }

    if (!existing) {
      throw new BadRequestException(`Product with ID '${productId}' not found.`);
    }

    // Ensure bin location exists in InventoryLocation
    const binParts = binCode.split('-');
    const targetLocation = await this.upsertLocation({
      zone: binParts[0] || 'A',
      aisle: binParts[1] || '01',
      rack: binParts[2] || '01',
      shelf: binParts[3] || '01',
      binCode,
    });

    // Update product status to STOCK_STORED
    await (this.prisma.product as any).update({
      where: { id: existing.id },
      data: { status: 'STOCK_STORED' },
    });

    // Update variants: update defaultBinCode and increment stock in inventory item
    for (const v of existing.variants) {
      await this.prisma.productVariant.update({
        where: { id: v.id },
        data: { defaultBinCode: binCode },
      });

      const defaultItem = v.inventoryItems[0];
      if (defaultItem) {
        await this.prisma.inventoryItem.update({
          where: { id: defaultItem.id },
          data: {
            quantityAvailable: { increment: intakeQty },
            locationId: targetLocation.id,
          },
        });
      } else {
        await this.prisma.inventoryItem.create({
          data: {
            variantId: v.id,
            locationId: targetLocation.id,
            quantityAvailable: intakeQty,
            quantityReserved: 0,
            quantityDamaged: 0,
          },
        });
      }

      try {
        await this.prisma.inventoryAuditLog.create({
          data: {
            merchantId: existing.merchantId,
            variantId: v.id,
            quantityDelta: intakeQty,
            reason: StockMovementReason.INBOUND_ASN,
            notes: data.note || `Physical stock accepted into warehouse Bin ${binCode}. Challan: ${data.challanOrTracking || 'N/A'}`,
          },
        });
      } catch {}
    }

    return this.findProductById(existing.id);
  }

  /**
   * Delete a product from PostgreSQL ONLY if warehouse stock is 0.
   * If even 1 unit exists in warehouse stock, deletion is strictly rejected.
   */
  async deleteProduct(productId: string) {

    const searchConditions: any[] = [
      { id: productId },
      { baseSku: productId },
    ];

    let existing = await this.prisma.product.findFirst({
      where: { OR: searchConditions },
      include: {
        variants: {
          include: {
            inventoryItems: true,
          },
        },
      },
    });

    if (!existing) {
      const variant = await this.prisma.productVariant.findFirst({
        where: { OR: [{ id: productId }, { sku: productId }] },
        include: {
          product: {
            include: {
              variants: {
                include: { inventoryItems: true },
              },
            },
          },
        },
      });
      if (variant?.product) {
        existing = variant.product;
      }
    }

    if (!existing) {
      return { deleted: true, id: productId };
    }

    const totalStock = (existing.variants || []).reduce(
      (sum: number, v: any) =>
        sum +
        (v.inventoryItems || []).reduce(
          (s: number, it: any) => s + (it.quantityAvailable || 0) + (it.quantityReserved || 0),
          0,
        ),
      0,
    );

    if (totalStock >= 1) {
      throw new BadRequestException(
        `Cannot delete product "${existing.title}": Warehouse currently holds ${totalStock} pcs in stock. Product stock must be 0 before deleting.`,
      );
    }

    const variantIds = (existing.variants || []).map((v: any) => v.id);
    if (variantIds.length > 0) {
      try {
        await this.prisma.inventoryAuditLog.deleteMany({
          where: { variantId: { in: variantIds } },
        });
      } catch {}
    }

    await this.prisma.product.delete({
      where: { id: existing.id },
    });

    return { deleted: true, id: existing.id };
  }

  async findProducts(merchantId?: string) {
    const where: any = {};
    if (merchantId) {
      where.OR = [
        { merchantId },
        { merchant: { merchantCode: merchantId.trim().toUpperCase() } },
      ];
    } else {
      // Admin Catalog / Approval view: Never show private merchant drafts!
      where.status = { not: 'DRAFT' };
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

  // ============================================================================
  // WMS PRODUCT LIFECYCLE & APPROVAL WORKFLOW REPOSITORY METHODS
  // ============================================================================

  async submitApprovalRequest(productId: string, requestedBy?: string) {
    try {
      return await this.prisma.$transaction(async (tx) => {
        const product = await tx.product.findUnique({ where: { id: productId } });
        if (!product) throw new BadRequestException(`Product '${productId}' not found`);

        const updated = await tx.product.update({
          where: { id: productId },
          data: {
            lifecycleStatus: 'PENDING_APPROVAL',
            status: 'PENDING_APPROVAL',
          },
        });

        await tx.productApprovalRequest.create({
          data: {
            productId,
            merchantId: product.merchantId,
            requestedBy,
            status: 'PENDING',
          },
        });

        await tx.inAppNotification.create({
          data: {
            recipientRole: 'SUPER_ADMIN',
            merchantId: product.merchantId,
            title: 'New Product Submission',
            message: `Merchant submitted product "${product.title}" (${product.baseSku}) for admin review.`,
            type: 'PRODUCT_SUBMITTED',
            linkUrl: '/admin/products?tab=APPROVAL',
          },
        });

        await tx.activityLog.create({
          data: {
            action: 'SUBMIT_FOR_APPROVAL',
            entityType: 'PRODUCT',
            entityId: productId,
            userId: requestedBy,
            notes: 'Product submitted for admin review',
          },
        });

        return updated;
      });
    } catch (err: any) {
      throw err;
    }
  }

  async cancelApprovalRequest(productId: string, merchantId?: string) {
    try {
      return await this.prisma.$transaction(async (tx) => {
        const product = await tx.product.findUnique({ where: { id: productId } });
        if (!product) throw new BadRequestException(`Product '${productId}' not found`);

        const updated = await tx.product.update({
          where: { id: productId },
          data: {
            lifecycleStatus: 'DRAFT',
            status: 'DRAFT',
          },
        });

        await tx.productApprovalRequest.updateMany({
          where: { productId, status: 'PENDING' },
          data: { status: 'CANCELLED', reviewedAt: new Date() },
        });

        await tx.activityLog.create({
          data: {
            action: 'CANCEL_APPROVAL_REQUEST',
            entityType: 'PRODUCT',
            entityId: productId,
            notes: 'Merchant cancelled approval request; returned to Draft',
          },
        });

        return updated;
      });
    } catch (err: any) {
      throw err;
    }
  }

  async approveSubmission(productId: string, adminId?: string, binCode?: string) {
    try {
      return await this.prisma.$transaction(async (tx) => {
        const product = await tx.product.findUnique({
          where: { id: productId },
          include: { variants: true },
        });
        if (!product) throw new BadRequestException(`Product '${productId}' not found`);

        const assignedBin = binCode || 'A-01-01';

        const updated = await tx.product.update({
          where: { id: productId },
          data: {
            lifecycleStatus: 'AWAITING_STOCK',
            status: 'AWAITING_STOCK',
            approvedById: adminId,
            approvedAt: new Date(),
          },
        });

        await tx.productVariant.updateMany({
          where: { productId },
          data: { defaultBinCode: assignedBin },
        });

        await tx.productApprovalRequest.updateMany({
          where: { productId, status: 'PENDING' },
          data: {
            status: 'APPROVED',
            adminId,
            reviewedAt: new Date(),
          },
        });

        await tx.inAppNotification.create({
          data: {
            recipientRole: 'MERCHANT',
            merchantId: product.merchantId,
            title: 'Product Approved',
            message: `Your product "${product.title}" has been approved. Please deliver inventory to warehouse bin ${assignedBin}.`,
            type: 'PRODUCT_APPROVED',
            linkUrl: `/merchant/products/${product.id}`,
          },
        });

        await tx.activityLog.create({
          data: {
            action: 'APPROVE_PRODUCT_SUBMISSION',
            entityType: 'PRODUCT',
            entityId: productId,
            userId: adminId,
            notes: `Admin approved product; awaiting physical stock delivery into bin ${assignedBin}`,
          },
        });

        return updated;
      });
    } catch (err: any) {
      throw err;
    }
  }

  async rejectSubmission(productId: string, adminId?: string, reason?: string) {
    try {
      return await this.prisma.$transaction(async (tx) => {
        const product = await tx.product.findUnique({ where: { id: productId } });
        if (!product) throw new BadRequestException(`Product '${productId}' not found`);

        const updated = await tx.product.update({
          where: { id: productId },
          data: {
            lifecycleStatus: 'REJECTED',
            status: 'REJECTED',
            rejectionReason: reason,
          },
        });

        await tx.productApprovalRequest.updateMany({
          where: { productId, status: 'PENDING' },
          data: {
            status: 'REJECTED',
            adminId,
            rejectionReason: reason,
            reviewedAt: new Date(),
          },
        });

        await tx.inAppNotification.create({
          data: {
            recipientRole: 'MERCHANT',
            merchantId: product.merchantId,
            title: 'Product Submission Rejected',
            message: `Your product "${product.title}" was rejected: ${reason}`,
            type: 'PRODUCT_REJECTED',
            linkUrl: `/merchant/products/${product.id}`,
          },
        });

        await tx.activityLog.create({
          data: {
            action: 'REJECT_PRODUCT_SUBMISSION',
            entityType: 'PRODUCT',
            entityId: productId,
            userId: adminId,
            notes: `Admin rejected product: ${reason}`,
          },
        });

        return updated;
      });
    } catch (err: any) {
      throw err;
    }
  }

  async receiveInitialStock(productId: string, data: any) {
    try {
      return await this.prisma.$transaction(async (tx) => {
        const product = await tx.product.findUnique({
          where: { id: productId },
          include: { variants: true },
        });
        if (!product) throw new BadRequestException(`Product '${productId}' not found`);

        if (product.lifecycleStatus !== 'AWAITING_STOCK' && product.lifecycleStatus !== 'ACTIVE') {
          throw new BadRequestException(
            `Cannot receive stock for product in status '${product.lifecycleStatus}'. Must pass Admin Approval first!`
          );
        }

        const assignedBin = data.binCode || 'A-01-01';
        const loc = await tx.inventoryLocation.upsert({
          where: { binCode: assignedBin },
          update: {},
          create: {
            binCode: assignedBin,
            zone: assignedBin.split('-')[0] || 'A',
            aisle: assignedBin.split('-')[1] || '01',
            rack: assignedBin.split('-')[2] || '01',
            shelf: '01',
          },
        });

        if (data.acceptedQuantity > 0) {
          await tx.product.update({
            where: { id: productId },
            data: {
              lifecycleStatus: 'ACTIVE',
              status: 'STOCK_STORED',
            },
          });

          for (const v of product.variants) {
            await tx.inventoryItem.upsert({
              where: {
                variantId_locationId: {
                  variantId: v.id,
                  locationId: loc.id,
                },
              },
              update: {
                quantityAvailable: { increment: data.acceptedQuantity },
                quantityDamaged: { increment: data.damagedQuantity || 0 },
              },
              create: {
                variantId: v.id,
                locationId: loc.id,
                quantityAvailable: data.acceptedQuantity,
                quantityDamaged: data.damagedQuantity || 0,
                quantityReserved: 0,
              },
            });
          }

          await tx.inventoryTransaction.create({
            data: {
              productId,
              merchantId: product.merchantId,
              locationId: loc.id,
              transactionType: 'INITIAL_STOCK_IN',
              quantity: data.acceptedQuantity,
              referenceType: 'STOCK_RECEIVING',
              performedBy: data.receivedBy,
              notes: data.receivingNotes || `Initial intake: ${data.acceptedQuantity} pcs accepted into ${assignedBin}`,
            },
          });

          await tx.inAppNotification.create({
            data: {
              recipientRole: 'MERCHANT',
              merchantId: product.merchantId,
              title: 'Stock Received — Product Active',
              message: `Warehouse accepted ${data.acceptedQuantity} pcs of "${product.title}". Product is now Active!`,
              type: 'STOCK_RECEIVED',
              linkUrl: `/merchant/products/${productId}`,
            },
          });
        }

        await tx.activityLog.create({
          data: {
            action: 'STOCK_RECEIVED',
            entityType: 'PRODUCT',
            entityId: productId,
            userId: data.receivedBy,
            notes: `Stock intake: ${data.acceptedQuantity} accepted, ${data.damagedQuantity || 0} damaged into ${assignedBin}`,
          },
        });

        return product;
      });
    } catch (err: any) {
      throw err;
    }
  }

  async requestEditAccess(productId: string, merchantId?: string, reason?: string) {
    try {
      return await this.prisma.$transaction(async (tx) => {
        const product = await tx.product.findUnique({ where: { id: productId } });
        if (!product) throw new BadRequestException(`Product '${productId}' not found`);

        const updated = await tx.product.update({
          where: { id: productId },
          data: { editState: 'EDIT_REQUESTED' },
        });

        await tx.productEditRequest.create({
          data: {
            productId,
            merchantId: product.merchantId,
            requestType: 'EDIT_PERMISSION',
            status: 'PENDING',
            reason,
            originalSnapshot: {
              title: product.title,
              description: product.description,
              category: product.category,
              brand: product.brand,
              sellingPrice: product.sellingPrice ? Number(product.sellingPrice) : undefined,
              purchasePrice: product.purchasePrice ? Number(product.purchasePrice) : undefined,
              weight: product.weight,
              dimensions: product.dimensions,
              imageUrl: product.imageUrl,
              images: product.images,
            },
          },
        });

        await tx.inAppNotification.create({
          data: {
            recipientRole: 'SUPER_ADMIN',
            merchantId: product.merchantId,
            title: 'Product Edit Permission Requested',
            message: `Merchant requested edit permission for Active product "${product.title}".`,
            type: 'EDIT_PERMISSION_REQUEST',
            linkUrl: '/admin/products?tab=EDIT_APPROVAL',
          },
        });

        return updated;
      });
    } catch (err: any) {
      throw err;
    }
  }

  async reviewEditAccess(productId: string, adminId?: string, action: 'GRANT' | 'DENY' = 'GRANT', reason?: string) {
    try {
      return await this.prisma.$transaction(async (tx) => {
        const product = await tx.product.findUnique({ where: { id: productId } });
        if (!product) throw new BadRequestException(`Product '${productId}' not found`);

        const nextState = action === 'GRANT' ? 'EDIT_ALLOWED' : 'NONE';
        const updated = await tx.product.update({
          where: { id: productId },
          data: { editState: nextState },
        });

        await tx.productEditRequest.updateMany({
          where: { productId, requestType: 'EDIT_PERMISSION', status: 'PENDING' },
          data: {
            status: action === 'GRANT' ? 'APPROVED' : 'REJECTED',
            adminId,
            rejectionReason: reason,
            reviewedAt: new Date(),
          },
        });

        await tx.inAppNotification.create({
          data: {
            recipientRole: 'MERCHANT',
            merchantId: product.merchantId,
            title: action === 'GRANT' ? 'Edit Permission Granted' : 'Edit Request Denied',
            message:
              action === 'GRANT'
                ? `Admin granted edit permission for "${product.title}". You can now submit revisions.`
                : `Edit permission denied for "${product.title}": ${reason}`,
            type: action === 'GRANT' ? 'EDIT_PERMISSION_GRANTED' : 'EDIT_PERMISSION_DENIED',
            linkUrl: `/merchant/products/${product.id}`,
          },
        });

        return updated;
      });
    } catch (err: any) {
      throw err;
    }
  }

  async submitRevision(productId: string, merchantId?: string, proposedSnapshot?: any) {
    try {
      return await this.prisma.$transaction(async (tx) => {
        const product = await tx.product.findUnique({ where: { id: productId } });
        if (!product) throw new BadRequestException(`Product '${productId}' not found`);

        const updated = await tx.product.update({
          where: { id: productId },
          data: { editState: 'EDIT_APPROVAL_PENDING' },
        });

        await tx.productEditRequest.create({
          data: {
            productId,
            merchantId: product.merchantId,
            requestType: 'REVISION_APPROVAL',
            status: 'PENDING',
            originalSnapshot: {
              title: product.title,
              description: product.description,
              category: product.category,
              brand: product.brand,
              sellingPrice: product.sellingPrice ? Number(product.sellingPrice) : undefined,
              purchasePrice: product.purchasePrice ? Number(product.purchasePrice) : undefined,
              weight: product.weight,
              dimensions: product.dimensions,
              imageUrl: product.imageUrl,
              images: product.images,
            },
            proposedSnapshot: proposedSnapshot || {},
          },
        });

        await tx.inAppNotification.create({
          data: {
            recipientRole: 'SUPER_ADMIN',
            merchantId: product.merchantId,
            title: 'Product Revision Submitted',
            message: `Merchant submitted revisions for "${product.title}". Ordering paused during review.`,
            type: 'REVISION_SUBMITTED',
            linkUrl: '/admin/products?tab=EDIT_APPROVAL',
          },
        });

        return updated;
      });
    } catch (err: any) {
      throw err;
    }
  }

  async reviewRevision(productId: string, adminId?: string, action: 'APPROVE' | 'REJECT' = 'APPROVE', reason?: string) {
    try {
      return await this.prisma.$transaction(async (tx) => {
        const product = await tx.product.findUnique({ where: { id: productId } });
        if (!product) throw new BadRequestException(`Product '${productId}' not found`);

        const pendingRev = await tx.productEditRequest.findFirst({
          where: { productId, requestType: 'REVISION_APPROVAL', status: 'PENDING' },
        });

        let updateData: any = { editState: 'NONE' };
        if (action === 'APPROVE' && pendingRev?.proposedSnapshot) {
          const snap = pendingRev.proposedSnapshot as any;
          if (snap.title) updateData.title = snap.title;
          if (snap.description !== undefined) updateData.description = snap.description;
          if (snap.category) updateData.category = snap.category;
          if (snap.brand !== undefined) updateData.brand = snap.brand;
          if (snap.purchasePrice !== undefined) updateData.purchasePrice = snap.purchasePrice;
          if (snap.sellingPrice !== undefined) updateData.sellingPrice = snap.sellingPrice;
          if (snap.weight !== undefined) updateData.weight = snap.weight;
          if (snap.dimensions !== undefined) updateData.dimensions = snap.dimensions;
          if (snap.imageUrl) updateData.imageUrl = snap.imageUrl;
          if (snap.images) updateData.images = snap.images;
        }

        const updated = await tx.product.update({
          where: { id: productId },
          data: updateData,
        });

        if (pendingRev) {
          await tx.productEditRequest.update({
            where: { id: pendingRev.id },
            data: {
              status: action === 'APPROVE' ? 'APPROVED' : 'REJECTED',
              adminId,
              rejectionReason: reason,
              reviewedAt: new Date(),
            },
          });
        }

        await tx.inAppNotification.create({
          data: {
            recipientRole: 'MERCHANT',
            merchantId: product.merchantId,
            title: action === 'APPROVE' ? 'Revision Approved' : 'Revision Rejected',
            message:
              action === 'APPROVE'
                ? `Admin approved revisions for "${product.title}". Ordering active!`
                : `Revision rejected for "${product.title}": ${reason}`,
            type: action === 'APPROVE' ? 'REVISION_APPROVED' : 'REVISION_REJECTED',
            linkUrl: `/merchant/products/${product.id}`,
          },
        });

        return updated;
      });
    } catch (err: any) {
      throw err;
    }
  }

  async createRestockRequest(productId: string, merchantId: string, data: any) {
    try {
      return await this.prisma.restockRequest.create({
        data: {
          productId,
          merchantId,
          requestedQuantity: data.requestedQuantity,
          estimatedDeliveryDate: data.estimatedDeliveryDate ? new Date(data.estimatedDeliveryDate) : null,
          status: 'REQUESTED',
          notes: data.notes,
        },
      });
    } catch (err: any) {
      throw err;
    }
  }

  async reviewRestockRequest(requestId: string, adminId?: string, action: 'APPROVE' | 'REJECT' = 'APPROVE', approvedQty?: number, reason?: string) {
    try {
      return await this.prisma.restockRequest.update({
        where: { id: requestId },
        data: {
          status: action === 'APPROVE' ? 'APPROVED' : 'REJECTED',
          approvedQuantity: action === 'APPROVE' ? approvedQty : undefined,
          adminId,
          rejectionReason: reason,
          reviewedAt: new Date(),
        },
      });
    } catch (err: any) {
      throw err;
    }
  }

  async receiveRestockStock(requestId: string, adminId: string, data: any) {
    try {
      return await this.prisma.$transaction(async (tx) => {
        const req = await tx.restockRequest.findUnique({ where: { id: requestId } });
        if (!req) throw new BadRequestException(`Restock request '${requestId}' not found`);

        const p = await tx.product.findUnique({
          where: { id: req.productId },
          include: { variants: true },
        });
        if (!p) throw new BadRequestException(`Product '${req.productId}' not found`);

        const assignedBin = data.binCode || 'A-01-01';
        const loc = await tx.inventoryLocation.upsert({
          where: { binCode: assignedBin },
          update: {},
          create: {
            binCode: assignedBin,
            zone: assignedBin.split('-')[0] || 'A',
            aisle: assignedBin.split('-')[1] || '01',
            rack: assignedBin.split('-')[2] || '01',
            shelf: '01',
          },
        });

        for (const v of p.variants) {
          await tx.inventoryItem.upsert({
            where: {
              variantId_locationId: {
                variantId: v.id,
                locationId: loc.id,
              },
            },
            update: {
              quantityAvailable: { increment: data.acceptedQuantity },
              quantityDamaged: { increment: data.damagedQuantity || 0 },
            },
            create: {
              variantId: v.id,
              locationId: loc.id,
              quantityAvailable: data.acceptedQuantity,
              quantityDamaged: data.damagedQuantity || 0,
              quantityReserved: 0,
            },
          });
        }

        const newReceived = req.receivedQuantity + data.acceptedQuantity;
        const totalApproved = req.approvedQuantity || req.requestedQuantity;
        const isComplete = newReceived >= totalApproved;

        const updatedReq = await tx.restockRequest.update({
          where: { id: requestId },
          data: {
            receivedQuantity: newReceived,
            status: isComplete ? 'COMPLETED' : 'PARTIALLY_RECEIVED',
            completedAt: isComplete ? new Date() : null,
          },
        });

        await tx.inventoryTransaction.create({
          data: {
            productId: p.id,
            merchantId: p.merchantId,
            locationId: loc.id,
            transactionType: 'RESTOCK_IN',
            quantity: data.acceptedQuantity,
            referenceType: 'RESTOCK_REQUEST',
            referenceId: req.id,
            performedBy: adminId,
            notes: data.receivingNotes || `Restock accepted: ${data.acceptedQuantity} pcs into bin ${assignedBin}`,
          },
        });

        return { product: p, request: updatedReq };
      });
    } catch (err: any) {
      throw err;
    }
  }

  async createReturnRequest(productId: string, merchantId: string, data: any) {
    try {
      return await this.prisma.returnRequest.create({
        data: {
          productId,
          merchantId,
          requestedQuantity: data.requestedQuantity,
          returnReason: data.returnReason,
          notes: data.notes,
          status: 'REQUESTED',
        },
      });
    } catch (err: any) {
      throw err;
    }
  }

  async reviewReturnRequest(requestId: string, adminId?: string, action: 'APPROVE' | 'REJECT' = 'APPROVE', approvedQty?: number, reason?: string) {
    try {
      return await this.prisma.returnRequest.update({
        where: { id: requestId },
        data: {
          status: action === 'APPROVE' ? 'APPROVED' : 'REJECTED',
          approvedQuantity: action === 'APPROVE' ? approvedQty : undefined,
          adminId,
          rejectionReason: reason,
          reviewedAt: new Date(),
        },
      });
    } catch (err: any) {
      throw err;
    }
  }

  async dispatchReturnStock(requestId: string, adminId: string, data: any) {
    try {
      return await this.prisma.$transaction(async (tx) => {
        const req = await tx.returnRequest.findUnique({ where: { id: requestId } });
        if (!req) throw new BadRequestException(`Return request '${requestId}' not found`);

        const p = await tx.product.findUnique({
          where: { id: req.productId },
          include: { variants: { include: { inventoryItems: true } } },
        });
        if (!p) throw new BadRequestException(`Product '${req.productId}' not found`);

        let qtyToDeduct = data.dispatchedQuantity;
        for (const v of p.variants) {
          for (const it of v.inventoryItems) {
            const canTake = Math.min(it.quantityAvailable, qtyToDeduct);
            if (canTake > 0) {
              await tx.inventoryItem.update({
                where: { id: it.id },
                data: { quantityAvailable: { decrement: canTake } },
              });
              qtyToDeduct -= canTake;
            }
            if (qtyToDeduct <= 0) break;
          }
          if (qtyToDeduct <= 0) break;
        }

        const newDispatched = req.dispatchedQuantity + data.dispatchedQuantity;
        const totalApproved = req.approvedQuantity || req.requestedQuantity;
        const isComplete = newDispatched >= totalApproved;

        const updatedReq = await tx.returnRequest.update({
          where: { id: requestId },
          data: {
            dispatchedQuantity: newDispatched,
            courierName: data.courierName,
            trackingNumber: data.trackingNumber,
            status: isComplete ? 'DISPATCHED' : 'PARTIALLY_DISPATCHED',
            completedAt: isComplete ? new Date() : null,
          },
        });

        await tx.inventoryTransaction.create({
          data: {
            productId: p.id,
            merchantId: p.merchantId,
            transactionType: 'RETURN_TO_MERCHANT',
            quantity: data.dispatchedQuantity,
            referenceType: 'RETURN_DISPATCH',
            referenceId: req.id,
            performedBy: adminId,
            notes: data.notes || `Dispatched ${data.dispatchedQuantity} pcs via ${data.courierName || 'Courier'}`,
          },
        });

        return { product: p, request: updatedReq };
      });
    } catch (err: any) {
      throw err;
    }
  }

  async suspendProduct(productId: string, adminId?: string, reason?: string) {
    try {
      return await this.prisma.product.update({
        where: { id: productId },
        data: {
          isSuspended: true,
          suspendedReason: reason,
          suspendedAt: new Date(),
        },
      });
    } catch (err: any) {
      throw err;
    }
  }

  async reactivateProduct(productId: string, adminId?: string) {
    try {
      return await this.prisma.product.update({
        where: { id: productId },
        data: {
          isSuspended: false,
          suspendedReason: null,
          suspendedAt: null,
        },
      });
    } catch (err: any) {
      throw err;
    }
  }

  async listApprovalRequests(merchantId?: string, status?: string) {
    const where: any = {};
    if (merchantId) where.merchantId = merchantId;
    if (status) where.status = status;
    return this.prisma.productApprovalRequest.findMany({
      where,
      include: { product: true },
      orderBy: { submittedAt: 'desc' },
    });
  }

  async listEditRequests(merchantId?: string, status?: string) {
    const where: any = {};
    if (merchantId) where.merchantId = merchantId;
    if (status) where.status = status;
    return this.prisma.productEditRequest.findMany({
      where,
      include: { product: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  async listRestockRequests(merchantId?: string, status?: string) {
    const where: any = {};
    if (merchantId) where.merchantId = merchantId;
    if (status) where.status = status;
    return this.prisma.restockRequest.findMany({
      where,
      include: { product: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  async listReturnRequests(merchantId?: string, status?: string) {
    const where: any = {};
    if (merchantId) where.merchantId = merchantId;
    if (status) where.status = status;
    return this.prisma.returnRequest.findMany({
      where,
      include: { product: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  async listInventoryTransactions(productId?: string, merchantId?: string) {
    const where: any = {};
    if (productId) where.productId = productId;
    if (merchantId) where.merchantId = merchantId;
    return this.prisma.inventoryTransaction.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    });
  }

  async listActivityLogs(entityType?: string, entityId?: string) {
    const where: any = {};
    if (entityType) where.entityType = entityType;
    if (entityId) where.entityId = entityId;
    return this.prisma.activityLog.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: 100,
    });
  }

  async listNotifications(role?: string, merchantId?: string, isRead?: boolean) {
    const where: any = {};
    if (role) where.recipientRole = role;
    if (merchantId) where.merchantId = merchantId;
    if (isRead !== undefined) where.isRead = isRead;
    return this.prisma.inAppNotification.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    });
  }

  async markNotificationRead(id: string) {
    return this.prisma.inAppNotification.update({
      where: { id },
      data: { isRead: true },
    });
  }

  async markAllNotificationsRead(role?: string, merchantId?: string) {
    const where: any = {};
    if (role) where.recipientRole = role;
    if (merchantId) where.merchantId = merchantId;
    return this.prisma.inAppNotification.updateMany({
      where,
      data: { isRead: true },
    });
  }

  async checkOrderEligibility(productId: string, quantity: number = 1): Promise<{ eligible: boolean; reason?: string }> {
    const p = await this.prisma.product.findUnique({
      where: { id: productId },
      include: {
        variants: {
          include: { inventoryItems: true },
        },
      },
    });
    if (!p) return { eligible: false, reason: 'Product not found' };
    if (p.lifecycleStatus !== 'ACTIVE') {
      return { eligible: false, reason: `Product lifecycle status is '${p.lifecycleStatus}' (must be ACTIVE)` };
    }
    if (p.isSuspended) {
      return { eligible: false, reason: `Product is suspended: ${p.suspendedReason || 'Admin restriction'}` };
    }
    if (p.editState === 'EDIT_APPROVAL_PENDING') {
      return { eligible: false, reason: 'Product is currently undergoing revision review by Admin' };
    }
    const totalAvailable = p.variants.reduce(
      (sum, v) => sum + v.inventoryItems.reduce((s, it) => s + (it.quantityAvailable || 0), 0),
      0
    );
    const totalReserved = p.variants.reduce(
      (sum, v) => sum + v.inventoryItems.reduce((s, it) => s + (it.quantityReserved || 0), 0),
      0
    );
    const free = totalAvailable - totalReserved;
    if (free < quantity) {
      return { eligible: false, reason: `Insufficient stock (available: ${free}, requested: ${quantity})` };
    }
    return { eligible: true };
  }
}
