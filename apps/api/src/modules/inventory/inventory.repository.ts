import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
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

    const productInclude = {
      merchant: {
        select: { merchantCode: true, businessName: true },
      },
      variants: {
        orderBy: { createdAt: 'asc' as const },
        include: {
          inventoryItems: {
            include: { location: true },
          },
        },
      },
      editRequests: {
        where: { requestType: 'REVISION_APPROVAL' as const },
        orderBy: { createdAt: 'desc' as const },
        take: 2,
      },
    };

    try {
      return await this.prisma.product.findMany({
        where,
        include: productInclude,
        orderBy: { createdAt: 'desc' },
      });
    } catch (err: any) {
      if (err?.code === 'P2022') {
        await this.ensureProductImagesColumn();
        return await this.prisma.product.findMany({
          where,
          include: productInclude,
          orderBy: { createdAt: 'desc' },
        });
      }
      throw err;
    }
  }

  async findProductById(id: string, merchantId?: string) {
    const where: any = { id };
    if (merchantId) where.merchantId = merchantId;

    const productInclude = {
      merchant: true,
      variants: {
        orderBy: { createdAt: 'asc' as const },
        include: {
          inventoryItems: {
            include: { location: true },
          },
        },
      },
      editRequests: {
        where: { requestType: 'REVISION_APPROVAL' as const },
        orderBy: { createdAt: 'desc' as const },
        take: 2,
      },
    };

    try {
      return await this.prisma.product.findFirst({
        where,
        include: productInclude,
      });
    } catch (err: any) {
      if (err?.code === 'P2022') {
        await this.ensureProductImagesColumn();
        return await this.prisma.product.findFirst({
          where,
          include: productInclude,
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

        let remaining = item.quantity;
        for (const row of rows) {
          if (remaining <= 0) break;
          const avail = Number(row.quantity_available) || 0;
          if (avail <= 0) continue;
          const take = Math.min(avail, remaining);
          await tx.$executeRaw`
            UPDATE inventory_items
            SET "quantityAvailable" = "quantityAvailable" - ${take},
                "quantityReserved" = "quantityReserved" + ${take},
                "updatedAt" = NOW()
            WHERE id = ${row.id}
          `;
          remaining -= take;
        }

        const newAvailable = Math.max(0, totalAvailable - item.quantity);
        if (typeof (tx as any).productVariant?.findUnique === 'function') {
          const variantRow = await (tx as any).productVariant.findUnique({
            where: { id: item.variantId },
            select: { attributes: true },
          });
          if (variantRow) {
            const existingAttrs =
              variantRow.attributes && typeof variantRow.attributes === 'object'
                ? { ...(variantRow.attributes as Record<string, any>) }
                : {};
            await (tx as any).productVariant.update({
              where: { id: item.variantId },
              data: {
                attributes: {
                  ...existingAttrs,
                  declaredStock: newAvailable,
                  stock: newAvailable,
                },
              },
            });
          }
        }

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

  async consumeReservedStockAtomically(
    items: Array<{ variantId: string; quantity: number }>,
    merchantId?: string,
    orderReference?: string,
  ): Promise<boolean> {
    return this.prisma.$transaction(async (tx) => {
      for (const item of items) {
        if (!item?.variantId || (Number(item.quantity) || 0) <= 0) continue;
        const rows = await tx.$queryRaw<Array<{ id: string; quantity_reserved: number }>>`
          SELECT id, "quantityReserved" as quantity_reserved
          FROM inventory_items
          WHERE "variantId" = ${item.variantId}
            AND "quantityReserved" > 0
          ORDER BY "quantityReserved" DESC
          FOR UPDATE
        `;

        let remaining = Math.max(0, Number(item.quantity) || 0);
        let consumedTotal = 0;
        for (const row of rows) {
          if (remaining <= 0) break;
          const resQty = Math.max(0, Number(row.quantity_reserved) || 0);
          if (resQty <= 0) continue;
          const take = Math.min(resQty, remaining);
          await tx.$executeRaw`
            UPDATE inventory_items
            SET "quantityReserved" = GREATEST(0, "quantityReserved" - ${take}),
                "updatedAt" = NOW()
            WHERE id = ${row.id}
          `;
          remaining -= take;
          consumedTotal += take;
        }

        if (merchantId && consumedTotal > 0) {
          await tx.inventoryAuditLog.create({
            data: {
              merchantId,
              variantId: item.variantId,
              quantityDelta: 0,
              reason: StockMovementReason.MANUAL_ADJUSTMENT,
              referenceId: orderReference,
              notes: `Consumed ${consumedTotal} reserved unit(s) on parcel dispatch/handover`,
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
        if (!item?.variantId || (Number(item.quantity) || 0) <= 0) continue;
        const rows = await tx.$queryRaw<
          Array<{ id: string; quantity_available: number; quantity_reserved: number }>
        >`
          SELECT id, "quantityAvailable" as quantity_available, "quantityReserved" as quantity_reserved
          FROM inventory_items
          WHERE "variantId" = ${item.variantId}
          ORDER BY "quantityReserved" DESC, "quantityAvailable" DESC
          FOR UPDATE
        `;

        if (!rows || rows.length === 0) continue;

        let remainingToRelease = Math.max(0, Number(item.quantity) || 0);
        for (const row of rows) {
          if (remainingToRelease <= 0) break;
          const resQty = Math.max(0, Number(row.quantity_reserved) || 0);
          if (resQty <= 0) continue;
          const releaseAmt = Math.min(resQty, remainingToRelease);
          await tx.$executeRaw`
            UPDATE inventory_items
            SET "quantityReserved" = GREATEST(0, "quantityReserved" - ${releaseAmt}),
                "updatedAt" = NOW()
            WHERE id = ${row.id}
          `;
          remainingToRelease -= releaseAmt;
        }

        // Increment available stock on ONLY the primary row (avoid multiplying stock across multiple bins)
        await tx.$executeRaw`
          UPDATE inventory_items
          SET "quantityAvailable" = "quantityAvailable" + ${item.quantity},
              "updatedAt" = NOW()
          WHERE id = ${rows[0].id}
        `;

        const newAvailable =
          rows.reduce((sum, r) => sum + (Number(r.quantity_available) || 0), 0) + item.quantity;

        if (typeof (tx as any).productVariant?.findUnique === 'function') {
          const variantRow = await (tx as any).productVariant.findUnique({
            where: { id: item.variantId },
            select: { attributes: true },
          });
          if (variantRow) {
            const existingAttrs =
              variantRow.attributes && typeof variantRow.attributes === 'object'
                ? { ...(variantRow.attributes as Record<string, any>) }
                : {};
            await (tx as any).productVariant.update({
              where: { id: item.variantId },
              data: {
                attributes: {
                  ...existingAttrs,
                  declaredStock: newAvailable,
                  stock: newAvailable,
                },
              },
            });
          }
        }

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

  private sanitizeText(value?: string | null): string | undefined {
    if (value === undefined || value === null) return undefined;
    return String(value)
      .replace(/\0/g, '')
      .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g, '')
      .trim();
  }

  private sanitizeSnapshot(snap: any): Record<string, any> {
    if (!snap || typeof snap !== 'object') return {};
    const sanitizedColors = Array.isArray(snap.colors)
      ? snap.colors.map((c: any, idx: number) => ({
          id: this.sanitizeText(c?.id) || `c-${idx + 1}`,
          name: this.sanitizeText(c?.name) || 'Standard',
          hex: this.sanitizeText(c?.hex) || '#111827',
          ...(this.sanitizeText(c?.imageUrl) ? { imageUrl: this.sanitizeText(c.imageUrl) } : {}),
          ...(Array.isArray(c?.sizes)
            ? { sizes: c.sizes.map((s: any) => this.sanitizeText(s)).filter(Boolean) }
            : {}),
          ...(this.sanitizeText(c?.originalName) ? { originalName: this.sanitizeText(c.originalName) } : {}),
        }))
      : undefined;

    const sanitizedVariants = Array.isArray(snap.variantsList)
      ? snap.variantsList.map((v: any) => ({
          ...(v?.id ? { id: v.id } : {}),
          ...(this.sanitizeText(v?.variantSku) ? { variantSku: this.sanitizeText(v.variantSku) } : {}),
          ...(this.sanitizeText(v?.sku) ? { sku: this.sanitizeText(v.sku) } : {}),
          ...(this.sanitizeText(v?.variantCode) ? { variantCode: this.sanitizeText(v.variantCode) } : {}),
          ...(this.sanitizeText(v?.title) ? { title: this.sanitizeText(v.title) } : {}),
          ...(this.sanitizeText(v?.color) ? { color: this.sanitizeText(v.color) } : {}),
          ...(this.sanitizeText(v?.originalColor) ? { originalColor: this.sanitizeText(v.originalColor) } : {}),
          ...(this.sanitizeText(v?.hex) ? { hex: this.sanitizeText(v.hex) } : {}),
          ...(this.sanitizeText(v?.size) ? { size: this.sanitizeText(v.size) } : {}),
          ...(this.sanitizeText(v?.originalSize) ? { originalSize: this.sanitizeText(v.originalSize) } : {}),
          ...(v?.price !== undefined ? { price: Number(v.price) || 0 } : {}),
          ...(v?.imageUrl !== undefined ? { imageUrl: this.sanitizeText(v.imageUrl) || '' } : {}),
          ...(this.sanitizeText(v?.attributeName) ? { attributeName: this.sanitizeText(v.attributeName) } : {}),
          ...(this.sanitizeText(v?.attributeValue) ? { attributeValue: this.sanitizeText(v.attributeValue) } : {}),
          ...(v?.stock !== undefined ? { stock: Math.max(0, Number(v.stock) || 0) } : {}),
        }))
      : undefined;

    const primaryImage = this.sanitizeText(snap.imageUrl);
    const images = Array.isArray(snap.images)
      ? Array.from(
          new Set(
            [
              primaryImage,
              ...snap.images.map((u: any) => this.sanitizeText(u)),
              ...(sanitizedColors || []).map((c: any) => this.sanitizeText(c.imageUrl)),
            ].filter((u): u is string => Boolean(u)),
          ),
        )
      : undefined;

    return {
      ...snap,
      ...(snap.title !== undefined ? { title: this.sanitizeText(snap.title) || '' } : {}),
      ...(snap.description !== undefined ? { description: this.sanitizeText(snap.description) || '' } : {}),
      ...(snap.category !== undefined ? { category: this.sanitizeText(snap.category) || '' } : {}),
      ...(snap.subcategory !== undefined ? { subcategory: this.sanitizeText(snap.subcategory) || '' } : {}),
      ...(snap.brand !== undefined ? { brand: this.sanitizeText(snap.brand) || '' } : {}),
      ...(snap.imageUrl !== undefined ? { imageUrl: primaryImage || '' } : {}),
      ...(images !== undefined ? { images } : {}),
      ...(Array.isArray(snap.keyFeatures)
        ? { keyFeatures: snap.keyFeatures.map((f: any) => this.sanitizeText(f)).filter(Boolean) }
        : {}),
      ...(sanitizedColors !== undefined ? { colors: sanitizedColors } : {}),
      ...(Array.isArray(snap.sizes)
        ? { sizes: snap.sizes.map((s: any) => this.sanitizeText(s)).filter(Boolean) }
        : {}),
      ...(sanitizedVariants !== undefined ? { variantsList: sanitizedVariants } : {}),
    };
  }

  private buildLiveProductSnapshot(product: any): Record<string, any> {
    const variants = Array.isArray(product?.variants) ? product.variants : [];
    const firstVariant = variants[0];
    const firstAttrs = (firstVariant?.attributes as Record<string, any>) || {};
    const minPrice =
      variants.length > 0
        ? Math.min(...variants.map((v: any) => Number(v.price) || 0))
        : Number(product?.sellingPrice) || 0;

    let colors: any[] = [];
    if (Array.isArray(firstAttrs.allColors) && firstAttrs.allColors.length > 0) {
      colors = firstAttrs.allColors;
    } else {
      const colorMap = new Map<string, any>();
      for (const v of variants) {
        const vAttrs = (v.attributes as Record<string, any>) || {};
        const colorName = this.sanitizeText(vAttrs.color || v.title?.split('/')?.[0]);
        const sizeName = this.sanitizeText(vAttrs.size || v.title?.split('/')?.[1]);
        if (!colorName) continue;
        const key = colorName.toLowerCase();
        if (!colorMap.has(key)) {
          colorMap.set(key, {
            id: `c-${colorMap.size + 1}`,
            name: colorName,
            hex: this.sanitizeText(vAttrs.hex) || '#111827',
            imageUrl: this.sanitizeText(v.imageUrl || vAttrs.imageUrl) || undefined,
            sizes: sizeName ? [sizeName] : [],
          });
        } else {
          const entry = colorMap.get(key)!;
          if (!entry.imageUrl && (v.imageUrl || vAttrs.imageUrl)) {
            entry.imageUrl = this.sanitizeText(v.imageUrl || vAttrs.imageUrl);
          }
          if (sizeName && !entry.sizes.includes(sizeName)) {
            entry.sizes.push(sizeName);
          }
        }
      }
      colors = Array.from(colorMap.values());
    }

    const sizesSet = new Set<string>();
    const variantsList = variants.map((v: any) => {
      const vAttrs = (v.attributes as Record<string, any>) || {};
      const color = this.sanitizeText(vAttrs.color || v.title?.split('/')?.[0]) || 'Standard';
      const size = this.sanitizeText(vAttrs.size || v.title?.split('/')?.[1]) || 'Standard';
      if (size) sizesSet.add(size);
      const phys = (v.inventoryItems || []).reduce(
        (sum: number, it: any) => sum + (it.quantityAvailable || 0),
        0,
      );
      const decl = Number(vAttrs.declaredStock ?? vAttrs.stock ?? 0);
      return {
        id: v.id,
        variantSku: v.sku,
        sku: v.sku,
        title: v.title,
        color,
        hex: this.sanitizeText(vAttrs.hex) || '#111827',
        size,
        price: Number(v.price) || minPrice,
        imageUrl: this.sanitizeText(v.imageUrl || vAttrs.imageUrl) || undefined,
        attributeName: vAttrs.attributeName,
        attributeValue: vAttrs.attributeValue,
        stock: phys > 0 ? phys : decl,
      };
    });

    const sizes =
      Array.isArray(firstAttrs.sizes) && firstAttrs.sizes.length > 0
        ? firstAttrs.sizes
        : Array.from(sizesSet);

    return {
      title: product.title,
      description: product.description || '',
      sku: product.baseSku,
      baseSku: product.baseSku,
      category: firstAttrs.category || product.category || 'Fashion',
      subcategory: firstAttrs.subcategory || 'Apparel',
      productType: firstAttrs.productType || 'FASHION',
      brand: product.brand || undefined,
      price: Number(product.sellingPrice) || minPrice || 0,
      costPrice:
        product.purchasePrice !== undefined && product.purchasePrice !== null
          ? Number(product.purchasePrice)
          : undefined,
      sellingPrice: product.sellingPrice ? Number(product.sellingPrice) : minPrice,
      purchasePrice: product.purchasePrice ? Number(product.purchasePrice) : undefined,
      weight: product.weight || undefined,
      dimensions: product.dimensions || undefined,
      imageUrl: product.imageUrl || '',
      images: Array.isArray(product.images) ? product.images : [],
      keyFeatures: Array.isArray(firstAttrs.keyFeatures) ? firstAttrs.keyFeatures : [],
      colors,
      sizes,
      variantsList,
    };
  }

  private computeChangedFields(originalSnap: any, proposedSnap: any): string[] {
    const changed: string[] = [];
    if ((originalSnap?.title || '') !== (proposedSnap?.title || '')) changed.push('Product Title');
    if (Number(originalSnap?.price || 0) !== Number(proposedSnap?.price ?? proposedSnap?.sellingPrice ?? 0)) {
      changed.push('Declare Price');
    }
    if ((originalSnap?.category || '') !== (proposedSnap?.category || '')) changed.push('Category');
    if ((originalSnap?.subcategory || '') !== (proposedSnap?.subcategory || '')) changed.push('Subcategory');
    if ((originalSnap?.description || '') !== (proposedSnap?.description || '')) changed.push('Description');
    if ((originalSnap?.imageUrl || '') !== (proposedSnap?.imageUrl || '')) {
      changed.push('Photos');
    } else if (JSON.stringify(originalSnap?.images || []) !== JSON.stringify(proposedSnap?.images || [])) {
      changed.push('Photos');
    }
    if (JSON.stringify(originalSnap?.colors || []) !== JSON.stringify(proposedSnap?.colors || [])) {
      changed.push('Colors');
    }
    if (JSON.stringify(originalSnap?.sizes || []) !== JSON.stringify(proposedSnap?.sizes || [])) {
      changed.push('Sizes');
    }
    if (JSON.stringify(originalSnap?.keyFeatures || []) !== JSON.stringify(proposedSnap?.keyFeatures || [])) {
      changed.push('Key Features');
    }
    return changed;
  }

  async submitRevision(productId: string, merchantId?: string, proposedSnapshot?: any, reason?: string) {
    try {
      const updatedId = await this.prisma.$transaction(async (tx) => {
        const includeSpec = {
          variants: {
            orderBy: { createdAt: 'asc' as const },
            include: { inventoryItems: true },
          },
        };
        let product = await tx.product.findUnique({
          where: { id: productId },
          include: includeSpec,
        });
        if (!product) {
          product = await tx.product.findFirst({
            where: { baseSku: productId },
            include: includeSpec,
          });
        }
        if (!product) throw new BadRequestException(`Product '${productId}' not found`);
        if (product.isSuspended) {
          throw new BadRequestException(`Cannot submit edit for suspended product '${product.title}'.`);
        }

        const originalSnapshot = this.buildLiveProductSnapshot(product);
        const cleanProposed = this.sanitizeSnapshot(proposedSnapshot || {});
        const changedFields = this.computeChangedFields(originalSnapshot, cleanProposed);

        const existingPending = await tx.productEditRequest.findFirst({
          where: {
            productId: product.id,
            requestType: 'REVISION_APPROVAL',
            status: 'PENDING',
          },
          orderBy: { createdAt: 'desc' },
        });

        if (existingPending) {
          await tx.productEditRequest.update({
            where: { id: existingPending.id },
            data: {
              reason: reason || existingPending.reason,
              requestedChanges: { changedFields },
              originalSnapshot,
              proposedSnapshot: cleanProposed,
              createdAt: new Date(),
            },
          });
        } else {
          await tx.productEditRequest.create({
            data: {
              productId: product.id,
              merchantId: product.merchantId,
              requestType: 'REVISION_APPROVAL',
              status: 'PENDING',
              reason,
              requestedChanges: { changedFields },
              originalSnapshot,
              proposedSnapshot: cleanProposed,
            },
          });
        }

        // Keep live published product fields & status untouched; only mark editState as pending approval
        await tx.product.update({
          where: { id: product.id },
          data: { editState: 'EDIT_APPROVAL_PENDING' },
        });

        const fieldsSummary = changedFields.length > 0 ? changedFields.join(', ') : 'Product details';

        await tx.inAppNotification.create({
          data: {
            recipientRole: 'SUPER_ADMIN',
            merchantId: product.merchantId,
            title: 'Product Edit Pending Approval',
            message: `Merchant submitted edits (${fieldsSummary}) for published product "${product.title}". Live product stays published until approved.`,
            type: 'REVISION_SUBMITTED',
            linkUrl: '/admin/products?tab=EDIT_APPROVAL',
          },
        });

        await tx.activityLog.create({
          data: {
            action: 'SUBMIT_PRODUCT_REVISION',
            entityType: 'PRODUCT',
            entityId: product.id,
            previousValues: originalSnapshot,
            newValues: cleanProposed,
            notes: `Pending edit submitted for "${product.title}" (${fieldsSummary})`,
          },
        });

        return product.id;
      });

      return this.findProductById(updatedId);
    } catch (err: any) {
      throw err;
    }
  }

  async cancelRevision(productId: string, merchantId?: string) {
    try {
      const updatedId = await this.prisma.$transaction(async (tx) => {
        let product = await tx.product.findUnique({ where: { id: productId } });
        if (!product) {
          product = await tx.product.findFirst({ where: { baseSku: productId } });
        }
        if (!product) throw new BadRequestException(`Product '${productId}' not found`);

        await tx.product.update({
          where: { id: product.id },
          data: { editState: 'NONE' },
        });

        await tx.productEditRequest.updateMany({
          where: {
            productId: product.id,
            requestType: 'REVISION_APPROVAL',
            status: 'PENDING',
          },
          data: {
            status: 'CANCELLED',
            reviewedAt: new Date(),
          },
        });

        await tx.activityLog.create({
          data: {
            action: 'CANCEL_PRODUCT_REVISION',
            entityType: 'PRODUCT',
            entityId: product.id,
            notes: `Merchant cancelled pending edit for "${product.title}"`,
          },
        });

        return product.id;
      });

      return this.findProductById(updatedId);
    } catch (err: any) {
      throw err;
    }
  }

  async reviewRevision(productId: string, adminId?: string, action: 'APPROVE' | 'REJECT' = 'APPROVE', reason?: string) {
    try {
      const updatedId = await this.prisma.$transaction(async (tx) => {
        const includeSpec = {
          merchant: true,
          variants: {
            orderBy: { createdAt: 'asc' as const },
            include: {
              inventoryItems: true,
              orderItems: { select: { id: true } },
              inboundItems: { select: { id: true } },
            },
          },
        };
        let product = await tx.product.findUnique({
          where: { id: productId },
          include: includeSpec,
        });
        if (!product) {
          product = await tx.product.findFirst({
            where: { baseSku: productId },
            include: includeSpec,
          });
        }
        if (!product) throw new BadRequestException(`Product '${productId}' not found`);

        const pendingRev = await tx.productEditRequest.findFirst({
          where: { productId: product.id, requestType: 'REVISION_APPROVAL', status: 'PENDING' },
          orderBy: { createdAt: 'desc' },
        });

        if (action === 'REJECT') {
          await tx.product.update({
            where: { id: product.id },
            data: { editState: 'NONE' },
          });

          const rejectionNote = this.sanitizeText(reason) || 'Edit rejected by admin';
          if (pendingRev) {
            await tx.productEditRequest.update({
              where: { id: pendingRev.id },
              data: {
                status: 'REJECTED',
                adminId,
                rejectionReason: rejectionNote,
                reviewedAt: new Date(),
              },
            });
          }

          await tx.productEditRequest.updateMany({
            where: {
              productId: product.id,
              requestType: 'REVISION_APPROVAL',
              status: 'PENDING',
            },
            data: { status: 'CANCELLED', reviewedAt: new Date() },
          });

          await tx.inAppNotification.create({
            data: {
              recipientRole: 'MERCHANT',
              merchantId: product.merchantId,
              title: 'Product Edit Rejected',
              message: `Pending edits for "${product.title}" were rejected: ${rejectionNote}. Your published product remains unchanged.`,
              type: 'REVISION_REJECTED',
              linkUrl: `/merchant/products/${product.id}`,
            },
          });

          await tx.activityLog.create({
            data: {
              action: 'REJECT_PRODUCT_REVISION',
              entityType: 'PRODUCT',
              entityId: product.id,
              userId: adminId,
              notes: `Rejected pending edit for "${product.title}": ${rejectionNote}`,
            },
          });

          return product.id;
        }

        // APPROVE: Apply proposedSnapshot onto live product & variants while preserving status, bin, and warehouse stock
        const updateData: any = { editState: 'NONE' };
        if (pendingRev?.proposedSnapshot) {
          const snap = this.sanitizeSnapshot(pendingRev.proposedSnapshot as any);
          const proposedColors: any[] = Array.isArray(snap.colors) ? snap.colors : [];
          const cleanProposedColors = proposedColors.map(({ originalName: _orig, ...rest }) => rest);

          const primaryImage = this.sanitizeText(snap.imageUrl);
          const allImages = Array.from(
            new Set(
              [
                primaryImage,
                ...(Array.isArray(snap.images) ? snap.images.map((u: any) => this.sanitizeText(u)) : []),
                ...cleanProposedColors.map((c: any) => this.sanitizeText(c.imageUrl)),
                ...(Array.isArray(snap.variantsList)
                  ? snap.variantsList.map((v: any) => this.sanitizeText(v.imageUrl))
                  : []),
              ].filter((u): u is string => Boolean(u)),
            ),
          );

          if (snap.title) updateData.title = snap.title;
          if (snap.description !== undefined) updateData.description = snap.description || null;
          if (snap.category) updateData.category = snap.category;
          if (snap.brand !== undefined) updateData.brand = snap.brand || null;

          const nextPurchasePrice = snap.purchasePrice ?? snap.costPrice;
          if (nextPurchasePrice !== undefined && !Number.isNaN(Number(nextPurchasePrice))) {
            updateData.purchasePrice = Number(nextPurchasePrice);
          }
          const nextSellingPrice = snap.sellingPrice ?? snap.price;
          if (nextSellingPrice !== undefined && !Number.isNaN(Number(nextSellingPrice))) {
            updateData.sellingPrice = Number(nextSellingPrice);
          }
          if (snap.weight !== undefined) updateData.weight = snap.weight;
          if (snap.dimensions !== undefined) updateData.dimensions = snap.dimensions;
          if (snap.imageUrl !== undefined) updateData.imageUrl = primaryImage || allImages[0] || null;
          if (allImages.length > 0 || Array.isArray(snap.images)) updateData.images = allImages;

          await tx.product.update({
            where: { id: product.id },
            data: updateData,
          });

          const firstRealBinVariant = (product.variants || []).find(
            (v) =>
              v.defaultBinCode &&
              v.defaultBinCode !== 'Pending Approval' &&
              v.defaultBinCode !== 'Assigned on intake',
          );
          const existingBin =
            firstRealBinVariant?.defaultBinCode || product.variants?.[0]?.defaultBinCode || 'A-01-01';
          let existingLocationId = (product.variants || []).flatMap((v) => v.inventoryItems || [])[0]
            ?.locationId;
          if (!existingLocationId) {
            const binCodeUpper = existingBin.toUpperCase();
            const parts = binCodeUpper.split('-');
            const loc = await tx.inventoryLocation.upsert({
              where: { binCode: binCodeUpper },
              update: {},
              create: {
                zone: parts[0] || 'A',
                aisle: parts[1] || '01',
                rack: parts[2] || '01',
                shelf: parts[3] || '01',
                binCode: binCodeUpper,
              },
            });
            existingLocationId = loc.id;
          }

          const merchantPrefix = (product.merchant?.merchantCode || 'MC-101').trim().toUpperCase();
          const proposedVariants: any[] = Array.isArray(snap.variantsList) ? snap.variantsList : [];

          if (proposedVariants.length > 0) {
            const matchedExistingIds = new Set<string>();

            for (let idx = 0; idx < proposedVariants.length; idx++) {
              const pv = proposedVariants[idx];
              const pvColor = this.sanitizeText(pv.color) || 'Standard';
              const matchedColorObj = proposedColors.find(
                (c) => (c.name || '').trim().toLowerCase() === pvColor.toLowerCase(),
              );
              const pvOrigColor =
                this.sanitizeText(pv.originalColor) ||
                this.sanitizeText(matchedColorObj?.originalName);
              const pvSize = this.sanitizeText(pv.size || pv.attributeValue) || 'Standard';
              const pvOrigSize = this.sanitizeText(pv.originalSize) || pvSize;
              const pvSku = (this.sanitizeText(pv.variantSku || pv.sku) || '').toUpperCase();

              const matchEv =
                (pv.id &&
                  product.variants.find((ev) => !matchedExistingIds.has(ev.id) && ev.id === pv.id)) ||
                (pvSku &&
                  product.variants.find(
                    (ev) => !matchedExistingIds.has(ev.id) && ev.sku.toUpperCase() === pvSku,
                  )) ||
                (pvOrigColor &&
                  product.variants.find((ev) => {
                    if (matchedExistingIds.has(ev.id)) return false;
                    const attrs = (ev.attributes as Record<string, any>) || {};
                    const evColor = (attrs.color || ev.title?.split('/')?.[0] || '').trim().toLowerCase();
                    const evSize = (attrs.size || ev.title?.split('/')?.[1] || '').trim().toLowerCase();
                    return evColor === pvOrigColor.toLowerCase() && evSize === pvOrigSize.toLowerCase();
                  })) ||
                product.variants.find((ev) => {
                  if (matchedExistingIds.has(ev.id)) return false;
                  const attrs = (ev.attributes as Record<string, any>) || {};
                  const evColor = (attrs.color || ev.title?.split('/')?.[0] || '').trim().toLowerCase();
                  const evSize = (attrs.size || ev.title?.split('/')?.[1] || '').trim().toLowerCase();
                  return evColor === pvColor.toLowerCase() && evSize === pvSize.toLowerCase();
                }) ||
                (product.variants.length === 1 && proposedVariants.length === 1
                  ? product.variants.find((ev) => !matchedExistingIds.has(ev.id))
                  : undefined);

              const variantPrice =
                pv.price !== undefined && !Number.isNaN(Number(pv.price))
                  ? Number(pv.price)
                  : nextSellingPrice !== undefined && !Number.isNaN(Number(nextSellingPrice))
                  ? Number(nextSellingPrice)
                  : undefined;

              const variantImg =
                pv.imageUrl !== undefined
                  ? this.sanitizeText(pv.imageUrl) ||
                    this.sanitizeText(matchedColorObj?.imageUrl) ||
                    primaryImage ||
                    null
                  : this.sanitizeText(matchedColorObj?.imageUrl) || primaryImage || undefined;

              if (matchEv) {
                matchedExistingIds.add(matchEv.id);
                const existingAttrs = (matchEv.attributes as Record<string, any>) || {};
                const nextAttrs: Record<string, any> = {
                  ...existingAttrs,
                  color: pvColor,
                  size: pvSize,
                  hex: this.sanitizeText(pv.hex) || matchedColorObj?.hex || existingAttrs.hex || '#111827',
                  ...(pv.attributeName !== undefined ? { attributeName: pv.attributeName } : {}),
                  ...(pv.attributeValue !== undefined ? { attributeValue: pv.attributeValue } : {}),
                  ...(snap.category !== undefined ? { category: snap.category } : {}),
                  ...(snap.subcategory !== undefined ? { subcategory: snap.subcategory } : {}),
                  ...(snap.productType !== undefined ? { productType: snap.productType } : {}),
                  ...(Array.isArray(snap.sizes) ? { sizes: snap.sizes } : {}),
                };

                await tx.productVariant.update({
                  where: { id: matchEv.id },
                  data: {
                    title: `${pvColor} / ${pvSize}`,
                    ...(variantPrice !== undefined ? { price: variantPrice } : {}),
                    ...(nextPurchasePrice !== undefined && !Number.isNaN(Number(nextPurchasePrice))
                      ? { wholesalePrice: Number(nextPurchasePrice) }
                      : {}),
                    ...(variantImg !== undefined ? { imageUrl: variantImg } : {}),
                    attributes: nextAttrs,
                  },
                });
              } else {
                const colorCode =
                  pvColor.replace(/[^a-zA-Z0-9]/g, '').toUpperCase().slice(0, 3) || 'STD';
                const sizeCode =
                  pvSize.replace(/[^a-zA-Z0-9_-]/g, '').toUpperCase() || 'STD';
                const rawCandidate = pv.variantCode || `${colorCode}-${sizeCode}`;
                let candidateSku = (
                  pvSku || `${merchantPrefix}-${product.baseSku}-${rawCandidate}`
                )
                  .trim()
                  .toUpperCase()
                  .replace(/\s+/g, '-');

                const collision = await tx.productVariant.findUnique({
                  where: { sku: candidateSku },
                });
                if (collision) {
                  candidateSku = `${candidateSku}-${Date.now().toString().slice(-4)}-${idx}`;
                }

                const ean13 = `894${Date.now().toString().slice(-7)}${idx % 10}${Math.floor(
                  100 + Math.random() * 900,
                )}`;

                await tx.productVariant.create({
                  data: {
                    productId: product.id,
                    sku: candidateSku,
                    barcode: ean13,
                    title: `${pvColor} / ${pvSize}`,
                    price: variantPrice ?? 0,
                    wholesalePrice:
                      nextPurchasePrice !== undefined && !Number.isNaN(Number(nextPurchasePrice))
                        ? Number(nextPurchasePrice)
                        : variantPrice !== undefined
                        ? variantPrice * 0.75
                        : undefined,
                    defaultBinCode: existingBin,
                    imageUrl: variantImg ?? primaryImage ?? null,
                    attributes: {
                      color: pvColor,
                      size: pvSize,
                      hex: this.sanitizeText(pv.hex) || matchedColorObj?.hex || '#111827',
                      ...(pv.attributeName !== undefined ? { attributeName: pv.attributeName } : {}),
                      ...(pv.attributeValue !== undefined ? { attributeValue: pv.attributeValue } : {}),
                      ...(snap.category !== undefined ? { category: snap.category } : {}),
                      ...(snap.subcategory !== undefined ? { subcategory: snap.subcategory } : {}),
                      ...(snap.productType !== undefined ? { productType: snap.productType } : {}),
                      ...(Array.isArray(snap.sizes) ? { sizes: snap.sizes } : {}),
                      declaredStock: 0,
                    },
                    inventoryItems: {
                      create: {
                        locationId: existingLocationId,
                        quantityAvailable: 0,
                        quantityReserved: 0,
                        quantityDamaged: 0,
                      },
                    },
                  },
                });
              }
            }

            // Safely remove deleted variants ONLY if 0 stock and no order/inbound history
            for (const ev of product.variants) {
              if (matchedExistingIds.has(ev.id)) continue;
              const evStock = (ev.inventoryItems || []).reduce(
                (sum, it) => sum + (it.quantityAvailable || 0) + (it.quantityReserved || 0),
                0,
              );
              if (evStock === 0 && ev.orderItems.length === 0 && ev.inboundItems.length === 0) {
                try {
                  await tx.inventoryAuditLog.deleteMany({ where: { variantId: ev.id } });
                } catch {}
                await tx.productVariant.delete({ where: { id: ev.id } });
              }
            }
          } else {
            // Single/Standard product without explicit variantsList
            for (const ev of product.variants) {
              const existingAttrs = (ev.attributes as Record<string, any>) || {};
              await tx.productVariant.update({
                where: { id: ev.id },
                data: {
                  ...(nextSellingPrice !== undefined && !Number.isNaN(Number(nextSellingPrice))
                    ? { price: Number(nextSellingPrice) }
                    : {}),
                  ...(nextPurchasePrice !== undefined && !Number.isNaN(Number(nextPurchasePrice))
                    ? { wholesalePrice: Number(nextPurchasePrice) }
                    : {}),
                  ...(primaryImage ? { imageUrl: primaryImage } : {}),
                  attributes: {
                    ...existingAttrs,
                    ...(snap.category !== undefined ? { category: snap.category } : {}),
                    ...(snap.subcategory !== undefined ? { subcategory: snap.subcategory } : {}),
                    ...(snap.productType !== undefined ? { productType: snap.productType } : {}),
                    ...(Array.isArray(snap.keyFeatures) ? { keyFeatures: snap.keyFeatures } : {}),
                    ...(Array.isArray(snap.sizes) ? { sizes: snap.sizes } : {}),
                    ...(cleanProposedColors.length > 0 ? { allColors: cleanProposedColors } : {}),
                  },
                },
              });
            }
          }

          // Final metadata sync on first surviving variant
          const surviving = await tx.productVariant.findMany({
            where: { productId: product.id },
            orderBy: { createdAt: 'asc' },
          });
          if (surviving.length > 0) {
            const firstSurviving = surviving[0];
            const firstAttrs = (firstSurviving.attributes as Record<string, any>) || {};
            await tx.productVariant.update({
              where: { id: firstSurviving.id },
              data: {
                attributes: {
                  ...firstAttrs,
                  ...(cleanProposedColors.length > 0 ? { allColors: cleanProposedColors } : {}),
                  ...(Array.isArray(snap.keyFeatures) ? { keyFeatures: snap.keyFeatures } : {}),
                  ...(Array.isArray(snap.sizes) ? { sizes: snap.sizes } : {}),
                  ...(snap.category !== undefined ? { category: snap.category } : {}),
                  ...(snap.subcategory !== undefined ? { subcategory: snap.subcategory } : {}),
                  ...(snap.productType !== undefined ? { productType: snap.productType } : {}),
                },
              },
            });
          }
        } else {
          await tx.product.update({
            where: { id: product.id },
            data: updateData,
          });
        }

        if (pendingRev) {
          await tx.productEditRequest.update({
            where: { id: pendingRev.id },
            data: {
              status: 'APPROVED',
              adminId,
              reviewedAt: new Date(),
            },
          });
        }

        await tx.productEditRequest.updateMany({
          where: {
            productId: product.id,
            requestType: 'REVISION_APPROVAL',
            status: 'PENDING',
          },
          data: { status: 'CANCELLED', reviewedAt: new Date() },
        });

        await tx.inAppNotification.create({
          data: {
            recipientRole: 'MERCHANT',
            merchantId: product.merchantId,
            title: 'Product Edit Approved',
            message: `Admin approved your pending edits for "${updateData.title || product.title}". Changes are now live!`,
            type: 'REVISION_APPROVED',
            linkUrl: `/merchant/products/${product.id}`,
          },
        });

        await tx.activityLog.create({
          data: {
            action: 'APPROVE_PRODUCT_REVISION',
            entityType: 'PRODUCT',
            entityId: product.id,
            userId: adminId,
            previousValues: (pendingRev?.originalSnapshot as any) || undefined,
            newValues: (pendingRev?.proposedSnapshot as any) || undefined,
            notes: `Approved and applied pending edit for "${updateData.title || product.title}"`,
          },
        });

        return product.id;
      });

      return this.findProductById(updatedId);
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

  /**
   * Add new variants and/or adjust variant & size quantities from Merchant Portal Manage Stock
   */
  async manageProductStock(
    productId: string,
    merchantId: string | undefined,
    payload: {
      newVariants?: Array<{
        title?: string;
        color?: string;
        hex?: string;
        size?: string;
        attributeName?: string;
        attributeValue?: string;
        variantCode?: string;
        price?: number;
        wholesalePrice?: number;
        imageUrl?: string;
        stock: number;
      }>;
      adjustments?: Array<{
        variantId?: string;
        variantSku?: string;
        color?: string;
        size?: string;
        newQuantity: number;
        reason?: string;
      }>;
    },
  ) {
    const cleanId = productId.trim();
    const strippedSku = cleanId.replace(/^[A-Z0-9]+-\d+-/i, '').trim().toUpperCase();
    const merchantFilter = merchantId?.trim()
      ? {
          OR: [
            { merchantId: merchantId.trim() },
            { merchant: { merchantCode: merchantId.trim().toUpperCase() } },
          ],
        }
      : undefined;

    const skuCandidates = Array.from(
      new Set([cleanId, cleanId.toUpperCase(), strippedSku].filter(Boolean)),
    );

    const product = await this.prisma.product.findFirst({
      where: {
        OR: [
          { id: cleanId },
          merchantFilter
            ? {
                AND: [
                  merchantFilter,
                  { OR: skuCandidates.map((skuVal) => ({ baseSku: skuVal })) },
                ],
              }
            : { OR: skuCandidates.map((skuVal) => ({ baseSku: skuVal })) },
        ],
      },
      include: {
        merchant: true,
        variants: {
          include: { inventoryItems: true },
          orderBy: { createdAt: 'asc' },
        },
      },
    });

    if (!product) {
      throw new BadRequestException(`Product with ID '${productId}' not found.`);
    }

    const dbStatus = ((product as any).status || '').trim().toUpperCase();
    if (product.isSuspended) {
      throw new BadRequestException(`Product '${product.title}' is suspended and cannot be modified.`);
    }
    if (dbStatus === 'REJECTED') {
      throw new BadRequestException(`Rejected product '${product.title}' cannot be modified.`);
    }

    const defaultLocation = await this.upsertLocation({
      zone: 'A',
      aisle: '01',
      rack: '01',
      shelf: '01',
      binCode: 'A-01-01',
    });

    const existingVariants = product.variants || [];
    const existingLocationId =
      existingVariants[0]?.inventoryItems?.[0]?.locationId || defaultLocation.id;
    const existingBinCode =
      existingVariants[0]?.defaultBinCode &&
      existingVariants[0].defaultBinCode !== 'Pending Approval' &&
      existingVariants[0].defaultBinCode !== 'Assigned on intake'
        ? existingVariants[0].defaultBinCode
        : existingVariants[0]?.defaultBinCode || 'Pending Approval';

    const existingTotalPhysical = existingVariants.reduce(
      (sum, v) =>
        sum + v.inventoryItems.reduce((s, it) => s + (it.quantityAvailable || 0), 0),
      0,
    );
    const hasApprovedBin = existingVariants.some(
      (v) =>
        v.defaultBinCode &&
        v.defaultBinCode !== 'Pending Approval' &&
        v.defaultBinCode !== 'Assigned on intake',
    );
    const isAcceptedOrStored =
      dbStatus === 'APPROVED' ||
      dbStatus === 'STOCK_STORED' ||
      dbStatus === 'PUBLISHED' ||
      hasApprovedBin ||
      existingTotalPhysical > 0;

    const merchantCode = (product.merchant?.merchantCode || 'MC-101').toUpperCase();
    const cleanBaseSku = (product.baseSku || 'SKU').trim().toUpperCase().replace(/\s+/g, '-');
    const basePrice = Number(existingVariants[0]?.price ?? product.sellingPrice ?? 0);
    const baseWholesale = Number(
      existingVariants[0]?.wholesalePrice ?? product.purchasePrice ?? basePrice * 0.75,
    );

    const usedSkus = new Set(existingVariants.map((v) => v.sku.toUpperCase()));

    await this.prisma.$transaction(async (tx) => {
      // 0. Zero-variant product adjustment fallback
      if (
        existingVariants.length === 0 &&
        (payload.adjustments || []).length > 0 &&
        (payload.newVariants || []).length === 0
      ) {
        const adj = payload.adjustments![0];
        const newQty = Math.max(0, Math.round(Number(adj.newQuantity) || 0));
        const stdSku = `${merchantCode}-${cleanBaseSku}-STD`;
        usedSkus.add(stdSku.toUpperCase());

        const createdDefaultVariant = await tx.productVariant.create({
          data: {
            productId: product.id,
            sku: stdSku,
            barcode: `894${Date.now().toString().slice(-8)}00`,
            title: 'Standard',
            price: basePrice,
            wholesalePrice: baseWholesale,
            defaultBinCode: existingBinCode,
            imageUrl: product.imageUrl || undefined,
            attributes: {
              declaredStock: newQty,
              stock: newQty,
            },
          },
        });

        await tx.inventoryItem.create({
          data: {
            variantId: createdDefaultVariant.id,
            locationId: existingLocationId,
            quantityAvailable: isAcceptedOrStored ? newQty : 0,
            quantityReserved: 0,
            quantityDamaged: 0,
          },
        });

        if (newQty > 0 && product.merchantId) {
          await tx.inventoryAuditLog.create({
            data: {
              merchantId: product.merchantId,
              variantId: createdDefaultVariant.id,
              quantityDelta: newQty,
              reason: StockMovementReason.MANUAL_ADJUSTMENT,
              notes: adj.reason || 'Merchant portal stock adjustment',
            },
          });
        }
      }

      // 1. Process adjustments on existing variants
      for (const adj of payload.adjustments || []) {
        const target = this.matchVariantForStockOp(existingVariants, adj);

        if (!target) continue;

        const newQty = Math.max(0, Math.round(Number(adj.newQuantity) || 0));
        const existingAttrs = (target.attributes as Record<string, any>) || {};
        const oldQty = this.computeVariantLiveStock(target, isAcceptedOrStored);

        await tx.productVariant.update({
          where: { id: target.id },
          data: {
            attributes: {
              ...existingAttrs,
              declaredStock: newQty,
              stock: newQty,
            },
          },
        });

        if (isAcceptedOrStored || (target.inventoryItems && target.inventoryItems.length > 0)) {
          const locId = target.inventoryItems?.[0]?.locationId || existingLocationId;
          await tx.inventoryItem.upsert({
            where: {
              variantId_locationId: {
                variantId: target.id,
                locationId: locId,
              },
            },
            update: { quantityAvailable: isAcceptedOrStored ? newQty : 0 },
            create: {
              variantId: target.id,
              locationId: locId,
              quantityAvailable: isAcceptedOrStored ? newQty : 0,
              quantityReserved: 0,
              quantityDamaged: 0,
            },
          });

          // If a variant had multiple bin rows, zero out secondary rows so total across rows equals newQty
          if (target.inventoryItems && target.inventoryItems.length > 1) {
            for (const extraInv of target.inventoryItems.slice(1)) {
              if (extraInv.id && extraInv.locationId !== locId) {
                await tx.inventoryItem.update({
                  where: { id: extraInv.id },
                  data: { quantityAvailable: 0 },
                });
              }
            }
          }
        }

        if (newQty !== oldQty && product.merchantId) {
          await tx.inventoryAuditLog.create({
            data: {
              merchantId: product.merchantId,
              variantId: target.id,
              quantityDelta: newQty - oldQty,
              reason: StockMovementReason.MANUAL_ADJUSTMENT,
              notes: adj.reason || 'Merchant portal variant stock adjustment',
            },
          });
        }
      }

      // 2. Process new variants
      let idxCounter = existingVariants.length;
      for (const nv of payload.newVariants || []) {
        idxCounter += 1;
        const color = (nv.color || '').trim();
        const size = (nv.size || '').trim();
        const qty = Math.max(0, Math.round(Number(nv.stock) || 0));

        // If matching color+size (or color-only / size-only) already exists, update its stock instead of duplicating
        const duplicate = existingVariants.find((v) => {
          const attrs = (v.attributes as Record<string, any>) || {};
          const vColor = (attrs.color || '').trim().toLowerCase();
          const vSize = (attrs.size || attrs.attributeValue || '').trim().toLowerCase();
          if (!color && !size) return false;
          return vColor === color.toLowerCase() && vSize === size.toLowerCase();
        });

        if (duplicate) {
          const existingAttrs = (duplicate.attributes as Record<string, any>) || {};
          const oldPhysical = duplicate.inventoryItems?.[0]?.quantityAvailable ?? 0;
          const oldDeclared = Number(existingAttrs.declaredStock ?? existingAttrs.stock ?? 0);
          const oldQty = oldPhysical > 0 ? oldPhysical : oldDeclared;

          await tx.productVariant.update({
            where: { id: duplicate.id },
            data: {
              attributes: { ...existingAttrs, declaredStock: qty, stock: qty },
            },
          });
          if (isAcceptedOrStored || duplicate.inventoryItems.length > 0) {
            const locId = duplicate.inventoryItems?.[0]?.locationId || existingLocationId;
            await tx.inventoryItem.upsert({
              where: {
                variantId_locationId: { variantId: duplicate.id, locationId: locId },
              },
              update: { quantityAvailable: isAcceptedOrStored ? qty : 0 },
              create: {
                variantId: duplicate.id,
                locationId: locId,
                quantityAvailable: isAcceptedOrStored ? qty : 0,
                quantityReserved: 0,
                quantityDamaged: 0,
              },
            });
          }
          if (qty !== oldQty && product.merchantId) {
            await tx.inventoryAuditLog.create({
              data: {
                merchantId: product.merchantId,
                variantId: duplicate.id,
                quantityDelta: qty - oldQty,
                reason: StockMovementReason.MANUAL_ADJUSTMENT,
                notes: 'Updated existing variant quantity via Merchant Portal Manage Stock',
              },
            });
          }
          continue;
        }

        const rawVarCode =
          nv.variantCode ||
          [color, size].filter(Boolean).join('-') ||
          `V${idxCounter}`;
        const cleanVarCode = rawVarCode
          .trim()
          .toUpperCase()
          .replace(/[^A-Z0-9_-]/g, '-');

        let candidateSku = `${merchantCode}-${cleanBaseSku}-${cleanVarCode}`;
        let suffix = 2;
        while (usedSkus.has(candidateSku.toUpperCase())) {
          candidateSku = `${merchantCode}-${cleanBaseSku}-${cleanVarCode}-${suffix}`;
          suffix += 1;
        }
        usedSkus.add(candidateSku.toUpperCase());

        const title =
          nv.title ||
          [color, size].filter(Boolean).join(' / ') ||
          nv.attributeValue ||
          'Standard';
        const price = nv.price !== undefined && Number(nv.price) > 0 ? Number(nv.price) : basePrice;
        const wholesalePrice =
          nv.wholesalePrice !== undefined && Number(nv.wholesalePrice) > 0
            ? Number(nv.wholesalePrice)
            : baseWholesale;
        const ean13 = `894${Date.now().toString().slice(-8)}${String(idxCounter % 100).padStart(2, '0')}`;

        const createdVariant = await tx.productVariant.create({
          data: {
            productId: product.id,
            sku: candidateSku,
            barcode: ean13,
            title,
            price,
            wholesalePrice,
            defaultBinCode: existingBinCode,
            imageUrl: nv.imageUrl || product.imageUrl || undefined,
            attributes: {
              color: color || undefined,
              hex: nv.hex || '#111827',
              size: size || undefined,
              attributeName: nv.attributeName || undefined,
              attributeValue: nv.attributeValue || undefined,
              imageUrl: nv.imageUrl || undefined,
              declaredStock: qty,
              stock: qty,
            },
          },
        });

        await tx.inventoryItem.create({
          data: {
            variantId: createdVariant.id,
            locationId: existingLocationId,
            quantityAvailable: isAcceptedOrStored ? qty : 0,
            quantityReserved: 0,
            quantityDamaged: 0,
          },
        });

        if (qty > 0 && product.merchantId) {
          await tx.inventoryAuditLog.create({
            data: {
              merchantId: product.merchantId,
              variantId: createdVariant.id,
              quantityDelta: qty,
              reason: StockMovementReason.MANUAL_ADJUSTMENT,
              notes: 'New variant added via Merchant Portal Manage Stock',
            },
          });
        }
      }

      // 3. Refresh allColors & sizes metadata on first variant and promote APPROVED -> STOCK_STORED when physical stock > 0
      const refreshedVariants = await tx.productVariant.findMany({
        where: { productId: product.id },
        include: { inventoryItems: true },
        orderBy: { createdAt: 'asc' },
      });

      if (refreshedVariants.length > 0) {
        const first = refreshedVariants[0];
        const firstAttrs = (first.attributes as Record<string, any>) || {};
        const prevColorMeta = new Map<
          string,
          { id?: string; hex?: string; imageUrl?: string }
        >();
        if (Array.isArray(firstAttrs.allColors)) {
          for (const existingC of firstAttrs.allColors) {
            if (existingC?.name) {
              prevColorMeta.set(String(existingC.name).trim().toLowerCase(), {
                id: existingC.id,
                hex: existingC.hex,
                imageUrl: existingC.imageUrl,
              });
            }
          }
        }

        const colorMap = new Map<
          string,
          { id: string; name: string; hex: string; imageUrl?: string; sizes: string[] }
        >();
        const sizeSet = new Set<string>();

        for (const rv of refreshedVariants) {
          const attrs = (rv.attributes as Record<string, any>) || {};
          const cName = (attrs.color || '').trim();
          const sName = (attrs.size || attrs.attributeValue || '').trim();
          if (sName) sizeSet.add(sName);
          if (cName) {
            const key = cName.toLowerCase();
            const prevMeta = prevColorMeta.get(key);
            if (!colorMap.has(key)) {
              colorMap.set(key, {
                id: prevMeta?.id || `c-${colorMap.size + 1}`,
                name: cName,
                hex: attrs.hex || prevMeta?.hex || '#111827',
                imageUrl: rv.imageUrl || attrs.imageUrl || prevMeta?.imageUrl,
                sizes: sName ? [sName] : [],
              });
            } else {
              const entry = colorMap.get(key)!;
              if (sName && !entry.sizes.includes(sName)) {
                entry.sizes.push(sName);
              }
              if (!entry.imageUrl && (rv.imageUrl || attrs.imageUrl)) {
                entry.imageUrl = rv.imageUrl || attrs.imageUrl;
              }
            }
          }
        }

        const nextAllColors =
          colorMap.size > 0
            ? Array.from(colorMap.values())
            : Array.isArray(firstAttrs.allColors)
            ? firstAttrs.allColors
            : undefined;
        const nextSizes =
          sizeSet.size > 0
            ? Array.from(sizeSet)
            : Array.isArray(firstAttrs.sizes)
            ? firstAttrs.sizes
            : undefined;

        if (nextAllColors || nextSizes) {
          await tx.productVariant.update({
            where: { id: first.id },
            data: {
              attributes: {
                ...firstAttrs,
                ...(nextAllColors ? { allColors: nextAllColors } : {}),
                ...(nextSizes ? { sizes: nextSizes } : {}),
              },
            },
          });
        }

        if (dbStatus === 'APPROVED') {
          const totalPhysical = refreshedVariants.reduce(
            (sum, rv) =>
              sum +
              (rv.inventoryItems || []).reduce(
                (s: number, it: any) => s + (it.quantityAvailable || 0),
                0,
              ),
            0,
          );
          if (totalPhysical > 0) {
            await tx.product.update({
              where: { id: product.id },
              data: {
                status: 'STOCK_STORED',
                lifecycleStatus: 'ACTIVE',
              },
            });
          }
        }
      }
    });

    return this.prisma.product.findUnique({
      where: { id: product.id },
      include: {
        variants: {
          include: { inventoryItems: true },
          orderBy: { createdAt: 'asc' },
        },
      },
    });
  }

  private isProductStocked(product: any): boolean {
    const rawStatus = String(product?.status || product?.lifecycleStatus || '')
      .trim()
      .toUpperCase();
    const variants = product?.variants || [];
    const hasApprovedBin = variants.some(
      (v: any) =>
        v.defaultBinCode &&
        v.defaultBinCode !== 'Pending Approval' &&
        v.defaultBinCode !== 'Assigned on intake',
    );
    const hasPhysicalInventory = variants.some((v: any) =>
      (v.inventoryItems || []).some(
        (it: any) =>
          (Number(it?.quantityAvailable) || 0) > 0 ||
          (Number(it?.quantityReserved) || 0) > 0,
      ),
    );
    return (
      ['IN_STOCK', 'STOCKED', 'STOCK_STORED', 'APPROVED', 'PUBLISHED', 'ACTIVE'].includes(
        rawStatus,
      ) ||
      hasApprovedBin ||
      hasPhysicalInventory
    );
  }

  private computeVariantLiveStock(variant: any, isStocked: boolean): number {
    const invItems = Array.isArray(variant?.inventoryItems) ? variant.inventoryItems : [];
    const phys = invItems.reduce(
      (s: number, it: any) => s + (Number(it?.quantityAvailable) || 0),
      0,
    );
    const resv = invItems.reduce(
      (s: number, it: any) => s + (Number(it?.quantityReserved) || 0),
      0,
    );
    const attrs =
      variant?.attributes && typeof variant.attributes === 'object'
        ? (variant.attributes as Record<string, any>)
        : {};
    const decl = Number(attrs.declaredStock ?? attrs.stock ?? 0);
    const usePhysical = invItems.length > 0 && (isStocked || phys > 0 || resv > 0);
    return usePhysical ? phys : decl;
  }

  private matchVariantForStockOp(
    variants: any[],
    criteria: {
      variantId?: string;
      variantSku?: string;
      color?: string;
      size?: string;
    },
  ): any {
    if (!variants || variants.length === 0) return undefined;

    if (criteria.variantId) {
      const byId = variants.find((v) => v.id === criteria.variantId);
      if (byId) return byId;
    }

    if (criteria.variantSku) {
      const skuUpper = criteria.variantSku.trim().toUpperCase();
      const bySku = variants.find((v) => String(v.sku || '').trim().toUpperCase() === skuUpper);
      if (bySku) return bySku;
    }

    const isGeneric = (s?: string) =>
      ['', 'standard', 'free size', 'free', 'default', 'one size'].includes(
        (s || '').trim().toLowerCase(),
      );

    const getColor = (v: any) => {
      const attrs = (v.attributes as Record<string, any>) || {};
      return String(attrs.color || v.title?.split('/')[0] || '')
        .trim()
        .toLowerCase();
    };
    const getSize = (v: any) => {
      const attrs = (v.attributes as Record<string, any>) || {};
      return String(attrs.size || attrs.attributeValue || v.title?.split('/')[1] || '')
        .trim()
        .toLowerCase();
    };

    const tColor = (criteria.color || '').trim().toLowerCase();
    const tSize = (criteria.size || '').trim().toLowerCase();

    if (tColor && tSize) {
      const exact = variants.find((v) => getColor(v) === tColor && getSize(v) === tSize);
      if (exact) return exact;

      if (isGeneric(tSize)) {
        const genericMatch = variants.find(
          (v) => getColor(v) === tColor && isGeneric(getSize(v)),
        );
        if (genericMatch) return genericMatch;
      }

      const colorOnlyFallback = variants.find((v) => getColor(v) === tColor);
      if (colorOnlyFallback) return colorOnlyFallback;
    }

    if (tColor && !tSize) {
      const byColor = variants.find((v) => getColor(v) === tColor);
      if (byColor) return byColor;
    }

    if (tSize && !tColor) {
      const bySize = variants.find((v) => getSize(v) === tSize);
      if (bySize) return bySize;
    }

    if (!tColor && !tSize && variants.length === 1) {
      return variants[0];
    }

    if (!criteria.variantId && !tColor && !tSize && variants.length > 0) {
      return variants[0];
    }

    return undefined;
  }

  private buildRecallAdjustmentsForVariants(
    variants: any[],
    isStocked: boolean,
    requestedQty: number,
    reason?: string,
    plannedAdjustments?: any[],
  ): Array<any> {
    const deductByVarId = new Map<string, number>();
    let remaining = Math.max(0, Math.round(Number(requestedQty) || 0));

    // Pass 1: Honor any explicit per-variant planned deductions if present
    if (Array.isArray(plannedAdjustments) && plannedAdjustments.length > 0) {
      for (const adj of plannedAdjustments) {
        if (remaining <= 0) break;
        if (!adj?.variantId) continue;
        const v = variants.find((cand) => cand.id === adj.variantId);
        if (!v) continue;
        const planned = Math.max(
          0,
          (Number(adj.previousQuantity) || 0) - (Number(adj.newQuantity) || 0),
        );
        const avail =
          this.computeVariantLiveStock(v, isStocked) - (deductByVarId.get(v.id) || 0);
        const take = Math.min(avail, planned > 0 ? planned : avail, remaining);
        if (take > 0) {
          deductByVarId.set(v.id, (deductByVarId.get(v.id) || 0) + take);
          remaining -= take;
        }
      }
    }

    // Pass 2: Distribute any remaining recall quantity across stocked variants in order
    for (const v of variants) {
      if (remaining <= 0) break;
      const avail =
        this.computeVariantLiveStock(v, isStocked) - (deductByVarId.get(v.id) || 0);
      const take = Math.min(avail, remaining);
      if (take > 0) {
        deductByVarId.set(v.id, (deductByVarId.get(v.id) || 0) + take);
        remaining -= take;
      }
    }

    const result: Array<any> = [];
    for (const v of variants) {
      const deduct = deductByVarId.get(v.id) || 0;
      if (deduct <= 0) continue;
      const vLive = this.computeVariantLiveStock(v, isStocked);
      const attrs = (v.attributes as Record<string, any>) || {};
      result.push({
        variantId: v.id,
        variantSku: v.sku,
        color: attrs.color || '',
        size: attrs.size || '',
        previousQuantity: vLive,
        newQuantity: Math.max(0, vLive - deduct),
        reason: reason || 'Product recall / return to merchant',
      });
    }
    return result;
  }

  private async reconcileMissedApprovedRecalls(records: any[]): Promise<void> {
    if (
      !Array.isArray(records) ||
      records.length === 0 ||
      typeof this.prisma.product?.findFirst !== 'function' ||
      typeof this.prisma.productEditRequest?.update !== 'function'
    ) {
      return;
    }

    for (const r of records) {
      const changes = (r?.requestedChanges as Record<string, any>) || {};
      const adjs = Array.isArray(changes.adjustments) ? changes.adjustments : [];
      const needsReconcile =
        r?.status === 'APPROVED' &&
        changes.operationType === 'RETURN' &&
        changes.reconciledApplied !== true &&
        (adjs.length === 0 || adjs.some((a: any) => !a?.variantId));

      if (!needsReconcile || !r.productId) continue;

      try {
        const liveProduct = await this.prisma.product.findFirst({
          where: { id: r.productId },
          include: {
            variants: {
              include: { inventoryItems: true },
              orderBy: { createdAt: 'asc' },
            },
          },
        });
        if (!liveProduct || !liveProduct.variants || liveProduct.variants.length === 0) continue;

        const isStocked = this.isProductStocked(liveProduct);
        const totalLiveStock = liveProduct.variants.reduce(
          (sum, v) => sum + this.computeVariantLiveStock(v, isStocked),
          0,
        );
        const firstAdj = adjs[0];
        const opQty = Math.round(
          Number(changes.requestedQty) ||
            Math.abs(
              (Number(firstAdj?.newQuantity) || 0) -
                (Number(firstAdj?.previousQuantity) || 0),
            ),
        );
        if (opQty <= 0 || totalLiveStock < opQty) continue;

        const matchedSingle = this.matchVariantForStockOp(liveProduct.variants, {
          variantId: changes.variantId || firstAdj?.variantId,
          variantSku: changes.variantSku || firstAdj?.variantSku,
          color: changes.color || firstAdj?.color,
          size: changes.size || firstAdj?.size,
        });

        let liveAdjustments: Array<any>;
        let resolvedScope: 'VARIANT' | 'ALL_VARIANTS' = 'ALL_VARIANTS';
        if (matchedSingle && changes.scope !== 'ALL_VARIANTS') {
          const singleLive = this.computeVariantLiveStock(matchedSingle, isStocked);
          if (singleLive >= opQty) {
            const matchedAttrs = (matchedSingle.attributes as Record<string, any>) || {};
            resolvedScope = 'VARIANT';
            liveAdjustments = [
              {
                variantId: matchedSingle.id,
                variantSku: matchedSingle.sku,
                color: changes.color || matchedAttrs.color || '',
                size: changes.size || matchedAttrs.size || '',
                previousQuantity: singleLive,
                newQuantity: singleLive - opQty,
                reason: changes.reason || changes.note,
              },
            ];
          } else {
            liveAdjustments = this.buildRecallAdjustmentsForVariants(
              liveProduct.variants,
              isStocked,
              opQty,
              changes.reason || changes.note,
            );
          }
        } else {
          liveAdjustments = this.buildRecallAdjustmentsForVariants(
            liveProduct.variants,
            isStocked,
            opQty,
            changes.reason || changes.note,
          );
        }

        if (liveAdjustments.length === 0) continue;

        await this.manageProductStock(r.productId, r.merchantId, {
          newVariants: [],
          adjustments: liveAdjustments,
        });

        const nextChanges = {
          ...changes,
          scope: resolvedScope,
          adjustments: liveAdjustments,
          reconciledApplied: true,
        };
        await this.prisma.productEditRequest.update({
          where: { id: r.id },
          data: { requestedChanges: nextChanges as any },
        });
        r.requestedChanges = nextChanges;
      } catch {
        // Leave record untouched if reconciliation fails for any reason
      }
    }
  }

  /**
   * Submit a Stock, Variant, Recall/Return, or Inbound Restock request for Admin approval (does NOT mutate live stock).
   */
  async submitStockManageRequest(
    productId: string,
    merchantIdOrCode: string | undefined,
    payload: {
      operationType?: 'ADJUST' | 'RESTOCK' | 'RETURN';
      scope?: 'VARIANT' | 'ALL_VARIANTS';
      requestedQty?: number;
      variantId?: string;
      variantSku?: string;
      color?: string;
      size?: string;
      destination?: string;
      carrier?: string;
      trackingRef?: string;
      note?: string;
      newVariants?: Array<{
        title?: string;
        color?: string;
        hex?: string;
        size?: string;
        attributeName?: string;
        attributeValue?: string;
        variantCode?: string;
        price?: number;
        wholesalePrice?: number;
        imageUrl?: string;
        stock: number;
      }>;
      adjustments?: Array<{
        variantId?: string;
        variantSku?: string;
        color?: string;
        size?: string;
        previousQuantity?: number;
        newQuantity: number;
        reason?: string;
      }>;
      reason?: string;
    },
  ) {
    let resolvedMerchantId = merchantIdOrCode;
    if (merchantIdOrCode && merchantIdOrCode.toUpperCase().startsWith('MC-')) {
      const m = await this.prisma.merchant.findFirst({
        where: { merchantCode: { equals: merchantIdOrCode.toUpperCase(), mode: 'insensitive' } },
      });
      if (m) resolvedMerchantId = m.id;
    }

    const product = await this.prisma.product.findFirst({
      where: {
        OR: [{ id: productId }, { baseSku: productId }],
        ...(resolvedMerchantId ? { merchantId: resolvedMerchantId } : {}),
      },
      include: {
        variants: {
          include: { inventoryItems: true },
          orderBy: { createdAt: 'asc' },
        },
      },
    });

    if (!product) {
      throw new NotFoundException(`Product '${productId}' not found`);
    }

    const isStocked = this.isProductStocked(product);
    const operationType: 'ADJUST' | 'RESTOCK' | 'RETURN' = payload.operationType || 'ADJUST';

    const originalVariants = product.variants.map((v) => ({
      id: v.id,
      sku: v.sku,
      title: v.title,
      color: (v.attributes as any)?.color || '',
      size: (v.attributes as any)?.size || '',
      stock: this.computeVariantLiveStock(v, isStocked),
    }));
    const originalTotalStock = originalVariants.reduce((s, v) => s + v.stock, 0);

    const newVariants = payload.newVariants || [];
    let matchedVariant: any = undefined;
    let resolvedRequestedQty: number | undefined = payload.requestedQty;
    let resolvedScope: 'VARIANT' | 'ALL_VARIANTS' | undefined = payload.scope;
    let adjustments: Array<any>;

    if (operationType === 'RETURN' || operationType === 'RESTOCK') {
      const requestedQty = Math.round(Number(payload.requestedQty) || 0);
      if (requestedQty <= 0) {
        throw new BadRequestException(
          `${operationType === 'RETURN' ? 'Recall' : 'Restock'} quantity must be greater than 0.`,
        );
      }
      resolvedRequestedQty = requestedQty;

      if (payload.scope !== 'ALL_VARIANTS') {
        matchedVariant = this.matchVariantForStockOp(product.variants, {
          variantId: payload.variantId,
          variantSku: payload.variantSku,
          color: payload.color,
          size: payload.size,
        });
      }

      if (
        operationType === 'RETURN' &&
        (payload.scope === 'ALL_VARIANTS' ||
          (!payload.variantId && !matchedVariant && product.variants.length > 0))
      ) {
        resolvedScope = 'ALL_VARIANTS';
        if (requestedQty > originalTotalStock) {
          throw new BadRequestException(
            `Cannot recall ${requestedQty} units: only ${originalTotalStock} units available in warehouse.`,
          );
        }
        adjustments =
          payload.adjustments && payload.adjustments.length > 0
            ? payload.adjustments
            : this.buildRecallAdjustmentsForVariants(
                product.variants,
                isStocked,
                requestedQty,
                payload.reason || payload.note,
              );
      } else {
        if (
          operationType === 'RETURN' &&
          payload.variantId &&
          !matchedVariant &&
          product.variants.length > 0
        ) {
          throw new BadRequestException('Selected variant not found for recall.');
        }

        const targetCurrentQty = matchedVariant
          ? this.computeVariantLiveStock(matchedVariant, isStocked)
          : originalTotalStock;

        if (operationType === 'RETURN' && requestedQty > targetCurrentQty) {
          throw new BadRequestException(
            `Cannot recall ${requestedQty} units: only ${targetCurrentQty} units available in warehouse.`,
          );
        }

        if (payload.adjustments && payload.adjustments.length > 0) {
          adjustments = payload.adjustments;
        } else {
          const matchedAttrs = (matchedVariant?.attributes as Record<string, any>) || {};
          adjustments = [
            {
              variantId: matchedVariant?.id,
              variantSku: matchedVariant?.sku || payload.variantSku,
              color: payload.color || matchedAttrs.color || '',
              size: payload.size || matchedAttrs.size || '',
              previousQuantity: targetCurrentQty,
              newQuantity:
                operationType === 'RETURN'
                  ? Math.max(0, targetCurrentQty - requestedQty)
                  : targetCurrentQty + requestedQty,
              reason:
                payload.reason ||
                payload.note ||
                (operationType === 'RETURN'
                  ? 'Product recall / return to merchant'
                  : 'Inbound restock request'),
            },
          ];
        }
      }
    } else {
      adjustments = (payload.adjustments || []).map((adj) => {
        const matched = this.matchVariantForStockOp(product.variants, adj);
        const currentQty = matched
          ? this.computeVariantLiveStock(matched, isStocked)
          : originalTotalStock;
        return {
          ...adj,
          previousQuantity: adj.previousQuantity ?? currentQty,
        };
      });
    }

    const reasonText =
      payload.reason ||
      payload.note ||
      (operationType === 'RETURN'
        ? 'Product recall / return to merchant'
        : operationType === 'RESTOCK'
        ? 'Inbound restock request'
        : 'Stock & variant manage request');

    return this.prisma.productEditRequest.create({
      data: {
        productId: product.id,
        merchantId: product.merchantId,
        requestType: 'REVISION_APPROVAL',
        status: 'PENDING',
        reason: reasonText,
        requestedChanges: {
          kind: 'STOCK_MANAGE',
          operationType,
          ...(resolvedScope ? { scope: resolvedScope } : {}),
          ...(resolvedRequestedQty !== undefined ? { requestedQty: resolvedRequestedQty } : {}),
          ...(resolvedScope !== 'ALL_VARIANTS' && (matchedVariant?.id || payload.variantId)
            ? { variantId: matchedVariant?.id || payload.variantId }
            : {}),
          ...(matchedVariant?.sku || payload.variantSku
            ? { variantSku: matchedVariant?.sku || payload.variantSku }
            : {}),
          ...(resolvedScope !== 'ALL_VARIANTS' && payload.color ? { color: payload.color } : {}),
          ...(resolvedScope !== 'ALL_VARIANTS' && payload.size ? { size: payload.size } : {}),
          ...(payload.destination ? { destination: payload.destination } : {}),
          ...(payload.carrier ? { carrier: payload.carrier } : {}),
          ...(payload.trackingRef ? { trackingRef: payload.trackingRef } : {}),
          ...(payload.note ? { note: payload.note } : {}),
          newVariants,
          adjustments,
          reason: payload.reason || payload.note || '',
        } as any,
        originalSnapshot: {
          totalStock: originalTotalStock,
          variants: originalVariants,
        } as any,
        proposedSnapshot: {
          operationType,
          ...(resolvedScope ? { scope: resolvedScope } : {}),
          ...(resolvedRequestedQty !== undefined ? { requestedQty: resolvedRequestedQty } : {}),
          newVariantsCount: newVariants.length,
          adjustmentsCount: adjustments.length,
        } as any,
      },
      include: {
        product: {
          include: {
            merchant: { select: { id: true, merchantCode: true, businessName: true } },
          },
        },
      },
    });
  }

  /**
   * List Stock & Variant manage requests (for Merchant or Admin).
   */
  async listStockManageRequests(merchantIdOrCode?: string, status?: string) {
    let resolvedMerchantId = merchantIdOrCode;
    if (merchantIdOrCode && merchantIdOrCode.toUpperCase().startsWith('MC-')) {
      const m = await this.prisma.merchant.findFirst({
        where: { merchantCode: { equals: merchantIdOrCode.toUpperCase(), mode: 'insensitive' } },
      });
      if (m) resolvedMerchantId = m.id;
    }

    const where: any = {
      requestedChanges: {
        path: ['kind'],
        equals: 'STOCK_MANAGE',
      },
    };
    if (resolvedMerchantId) where.merchantId = resolvedMerchantId;
    if (status) where.status = status;

    const records = await this.prisma.productEditRequest.findMany({
      where,
      include: {
        product: {
          include: {
            merchant: { select: { id: true, merchantCode: true, businessName: true } },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    await this.reconcileMissedApprovedRecalls(records);
    return records;
  }

  /**
   * Admin: Approve or Reject a pending Stock, Variant, Recall/Return, or Restock request.
   */
  async reviewStockManageRequest(
    requestId: string,
    adminId: string,
    action: 'APPROVE' | 'REJECT',
    rejectionReason?: string,
  ) {
    const reqRecord = await this.prisma.productEditRequest.findUnique({
      where: { id: requestId },
    });

    if (!reqRecord) {
      throw new NotFoundException(`Stock manage request '${requestId}' not found`);
    }

    if (reqRecord.status !== 'PENDING') {
      throw new BadRequestException(`Request is already ${reqRecord.status}`);
    }

    const changes = (reqRecord.requestedChanges as Record<string, any>) || {};
    if (action === 'APPROVE') {
      const opType: 'ADJUST' | 'RESTOCK' | 'RETURN' = changes.operationType || 'ADJUST';
      let updatedProduct: any;
      let updatedRequestedChanges = changes;

      if (opType === 'RETURN' || opType === 'RESTOCK') {
        const liveProduct = await this.prisma.product.findFirst({
          where: { id: reqRecord.productId },
          include: {
            variants: {
              include: { inventoryItems: true },
              orderBy: { createdAt: 'asc' },
            },
          },
        });

        if (!liveProduct) {
          throw new NotFoundException(`Product '${reqRecord.productId}' not found`);
        }

        const isStocked = this.isProductStocked(liveProduct);
        const variants = liveProduct.variants || [];
        const firstAdj = Array.isArray(changes.adjustments) ? changes.adjustments[0] : undefined;
        let matched =
          changes.scope !== 'ALL_VARIANTS'
            ? this.matchVariantForStockOp(variants, {
                variantId: changes.variantId || firstAdj?.variantId,
                variantSku: changes.variantSku || firstAdj?.variantSku,
                color: changes.color || firstAdj?.color,
                size: changes.size || firstAdj?.size,
              })
            : undefined;

        if (opType === 'RESTOCK' && !matched && variants.length > 0) {
          matched = variants[0];
        }

        const totalLiveStock = variants.reduce(
          (s: number, v: any) => s + this.computeVariantLiveStock(v, isStocked),
          0,
        );

        const opQty = Math.round(
          Number(changes.requestedQty) ||
            Math.abs(
              (Number(firstAdj?.newQuantity) || 0) -
                (Number(firstAdj?.previousQuantity) || 0),
            ),
        );

        if (opQty <= 0) {
          throw new BadRequestException('Invalid request quantity for approval.');
        }

        const isMultiVariantRecall =
          opType === 'RETURN' &&
          (changes.scope === 'ALL_VARIANTS' ||
            (Array.isArray(changes.adjustments) && changes.adjustments.length > 1) ||
            (!matched && variants.length > 0));

        let liveAdjustments: Array<any>;
        let resolvedScope: 'VARIANT' | 'ALL_VARIANTS' | undefined = changes.scope;

        if (isMultiVariantRecall) {
          resolvedScope = 'ALL_VARIANTS';
          if (totalLiveStock < opQty) {
            throw new BadRequestException(
              `Insufficient live warehouse stock to approve recall: requested ${opQty} pcs, currently available ${totalLiveStock} pcs.`,
            );
          }
          liveAdjustments = this.buildRecallAdjustmentsForVariants(
            variants,
            isStocked,
            opQty,
            changes.reason || changes.note,
            changes.adjustments,
          );
        } else {
          const liveQty = matched ? this.computeVariantLiveStock(matched, isStocked) : totalLiveStock;
          if (opType === 'RETURN' && liveQty < opQty) {
            throw new BadRequestException(
              `Insufficient live warehouse stock to approve recall: requested ${opQty} pcs, currently available ${liveQty} pcs.`,
            );
          }
          const matchedAttrs = (matched?.attributes as Record<string, any>) || {};
          liveAdjustments = [
            {
              ...(firstAdj || {}),
              variantId: matched?.id || changes.variantId,
              variantSku: matched?.sku || changes.variantSku,
              color: changes.color || matchedAttrs.color || firstAdj?.color || '',
              size: changes.size || matchedAttrs.size || firstAdj?.size || '',
              previousQuantity: liveQty,
              newQuantity: opType === 'RETURN' ? liveQty - opQty : liveQty + opQty,
              reason: changes.reason || changes.note,
            },
          ];
        }

        updatedProduct = await this.manageProductStock(
          reqRecord.productId,
          reqRecord.merchantId,
          {
            newVariants: [],
            adjustments: liveAdjustments,
          },
        );

        const gatePassNo =
          opType === 'RETURN'
            ? changes.gatePassNo ||
              `GP-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`
            : undefined;

        if (typeof (this.prisma as any).inventoryTransaction?.create === 'function') {
          await (this.prisma as any).inventoryTransaction.create({
            data: {
              productId: reqRecord.productId,
              merchantId: reqRecord.merchantId,
              transactionType: opType === 'RETURN' ? 'RETURN_TO_MERCHANT' : 'RESTOCK_IN',
              quantity: opQty,
              referenceType: opType === 'RETURN' ? 'STOCK_RECALL' : 'RESTOCK_REQUEST',
              referenceId: requestId,
              performedBy: adminId,
              notes:
                opType === 'RETURN'
                  ? `Stock recall approved. Gate Pass ${gatePassNo}. Destination: ${
                      changes.destination || 'Merchant Outlet'
                    }.`
                  : `Inbound restock approved. Carrier: ${changes.carrier || 'N/A'}${
                      changes.trackingRef ? ` (${changes.trackingRef})` : ''
                    }.`,
            },
          });
        }

        updatedRequestedChanges = {
          ...changes,
          ...(resolvedScope ? { scope: resolvedScope } : {}),
          ...(gatePassNo ? { gatePassNo } : {}),
          adjustments: liveAdjustments,
          reconciledApplied: true,
        };
      } else {
        updatedProduct = await this.manageProductStock(
          reqRecord.productId,
          reqRecord.merchantId,
          {
            newVariants: changes.newVariants || [],
            adjustments: changes.adjustments || [],
          },
        );
      }

      const updatedRequest = await this.prisma.productEditRequest.update({
        where: { id: requestId },
        data: {
          status: 'APPROVED',
          adminId,
          reviewedAt: new Date(),
          rejectionReason: null,
          ...(opType === 'RETURN' || opType === 'RESTOCK'
            ? { requestedChanges: updatedRequestedChanges as any }
            : {}),
        },
        include: {
          product: {
            include: {
              merchant: { select: { id: true, merchantCode: true, businessName: true } },
            },
          },
        },
      });

      return { request: updatedRequest, product: updatedProduct };
    }

    const rejectedRequest = await this.prisma.productEditRequest.update({
      where: { id: requestId },
      data: {
        status: 'REJECTED',
        adminId,
        rejectionReason: rejectionReason?.trim() || 'Rejected by Admin',
        reviewedAt: new Date(),
      },
      include: {
        product: {
          include: {
            merchant: { select: { id: true, merchantCode: true, businessName: true } },
          },
        },
      },
    });

    return { request: rejectedRequest };
  }

  async cancelStockManageRequest(requestId: string, merchantIdOrCode?: string) {
    let resolvedMerchantId = merchantIdOrCode;
    if (merchantIdOrCode && merchantIdOrCode.toUpperCase().startsWith('MC-')) {
      const m = await this.prisma.merchant.findFirst({
        where: { merchantCode: { equals: merchantIdOrCode.toUpperCase(), mode: 'insensitive' } },
      });
      if (m) resolvedMerchantId = m.id;
    }

    const existing = await this.prisma.productEditRequest.findUnique({
      where: { id: requestId },
    });

    if (!existing) {
      throw new NotFoundException(`Stock manage request '${requestId}' not found`);
    }

    if (resolvedMerchantId && existing.merchantId !== resolvedMerchantId) {
      throw new BadRequestException('Unauthorized to cancel another merchant stock request');
    }

    if (existing.status !== 'PENDING') {
      throw new BadRequestException(
        `Only PENDING requests can be cancelled (current status: ${existing.status})`,
      );
    }

    await this.prisma.productEditRequest.delete({
      where: { id: requestId },
    });

    return { ok: true, id: requestId };
  }
}
