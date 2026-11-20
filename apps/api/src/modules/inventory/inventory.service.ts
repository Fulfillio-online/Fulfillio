import { Injectable, NotFoundException } from '@nestjs/common';
import { InventoryRepository } from './inventory.repository';

@Injectable()
export class InventoryService {
  constructor(private readonly inventoryRepo: InventoryRepository) {}

  /**
   * Create a new Product with 2-Part SKU Variants ([MerchantCode]-[BaseSKU]-[Variant])
   */
  async createProductWithVariants(
    merchantId: string,
    payload: {
      merchantId?: string;
      merchantCode?: string;
      title: string;
      description?: string;
      baseSku: string;
      imageUrl?: string;
      images?: string[];
      variants: Array<{
        title: string;
        variantCode: string; // e.g., BLK-XL
        price: number;
        wholesalePrice?: number;
        defaultBinCode?: string;
        initialStock?: number;
        imageUrl?: string;
        attributes?: Record<string, any>;
      }>;
    },
  ) {
    let merchant = await this.inventoryRepo.findMerchantById(merchantId);
    if (!merchant) {
      // Auto-provision merchant in PostgreSQL if not present
      const candidateCode = (payload.merchantCode || merchantId || 'MC-101').trim().toUpperCase();
      merchant = await this.inventoryRepo.upsertMerchantStub(candidateCode);
    }

    const cleanBaseSku = payload.baseSku.trim().toUpperCase().replace(/\s+/g, '-');
    const merchantPrefix = merchant.merchantCode.toUpperCase();

    // Prevent PostgreSQL unique constraint error on (merchantId, baseSku)
    const existingProduct = await this.inventoryRepo.findProductByMerchantAndBaseSku(merchant.id, cleanBaseSku);
    const finalBaseSku = existingProduct ? `${cleanBaseSku}-${Date.now().toString().slice(-4)}` : cleanBaseSku;

    // Ensure default warehouse bin exists
    const defaultLocation = await this.inventoryRepo.upsertLocation({
      zone: 'A',
      aisle: '01',
      rack: '01',
      shelf: '01',
      binCode: 'A-01-01',
    });

    const formattedVariants = payload.variants.map((v, idx) => {
      const cleanVar = v.variantCode.trim().toUpperCase().replace(/\s+/g, '-');
      const twoPartSku = `${merchantPrefix}-${finalBaseSku}-${cleanVar}`;
      const ean13 = `894${Date.now().toString().slice(-9)}${idx % 10}`;

      return {
        sku: twoPartSku,
        barcode: ean13,
        title: v.title,
        price: v.price,
        wholesalePrice: v.wholesalePrice ?? v.price * 0.75,
        defaultBinCode: v.defaultBinCode || 'A-01-01',
        initialStock: Math.max(0, Number(v.initialStock) || 0),
        imageUrl: v.imageUrl || (v.attributes as any)?.imageUrl || payload.imageUrl,
        attributes: v.attributes || {},
      };
    });

    // Sanitize and compile all distinct images
    const sanitizedImage = payload.imageUrl
      ? payload.imageUrl.replace(/\0/g, '').replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g, '').trim()
      : undefined;

    const allImages = Array.from(
      new Set(
        [
          sanitizedImage,
          ...(payload.images || []).map((u) => u?.replace(/\0/g, '').trim()),
          ...formattedVariants.map((fv) => fv.imageUrl?.replace(/\0/g, '').trim()),
        ].filter((u): u is string => Boolean(u && u.trim()))
      )
    );

    return this.inventoryRepo.createProductWithVariants({
      merchantId: merchant.id,
      title: payload.title,
      description: payload.description,
      baseSku: finalBaseSku,
      imageUrl: sanitizedImage || allImages[0],
      images: allImages,
      defaultLocationId: defaultLocation.id,
      variants: formattedVariants,
    });
  }

    /**
   * Update an existing product and its variants
   */
  async updateProductWithVariants(
    productId: string,
    merchantId: string,
    payload: {
      title?: string;
      description?: string;
      baseSku?: string;
      imageUrl?: string;
      images?: string[];
      variants?: Array<{
        id?: string;
        sku?: string;
        barcode?: string;
        title: string;
        variantCode?: string;
        price: number;
        wholesalePrice?: number;
        defaultBinCode?: string;
        initialStock?: number;
        imageUrl?: string;
        attributes?: Record<string, any>;
      }>;
    },
  ) {
    let merchant = await this.inventoryRepo.findMerchantById(merchantId);
    if (!merchant) {
      const candidateCode = (merchantId || 'MC-101').trim().toUpperCase();
      merchant = await this.inventoryRepo.upsertMerchantStub(candidateCode);
    }

    const defaultLocation = await this.inventoryRepo.upsertLocation({
      zone: 'A',
      aisle: '01',
      rack: '01',
      shelf: '01',
      binCode: 'A-01-01',
    });

    const merchantPrefix = merchant.merchantCode.toUpperCase();
    const cleanBaseSku = (payload.baseSku || 'SKU').trim().toUpperCase().replace(/\s+/g, '-');

    const formattedVariants = (payload.variants || []).map((v, idx) => {
      let finalSku = v.sku;
      if (!finalSku) {
        const cleanVar = (v.variantCode || `VAR-${idx}`).trim().toUpperCase().replace(/\s+/g, '-');
        finalSku = `${merchantPrefix}-${cleanBaseSku}-${cleanVar}`;
      }
      const ean13 = v.barcode || `894${Date.now().toString().slice(-9)}${idx % 10}`;

      return {
        id: v.id,
        sku: finalSku,
        barcode: ean13,
        title: v.title,
        price: v.price,
        wholesalePrice: v.wholesalePrice ?? v.price * 0.75,
        defaultBinCode: v.defaultBinCode || 'A-01-01',
        initialStock: Math.max(0, Number(v.initialStock) || 0),
        imageUrl: v.imageUrl || (v.attributes as any)?.imageUrl || payload.imageUrl,
        attributes: v.attributes || {},
      };
    });

    const allImages = Array.from(
      new Set(
        [
          payload.imageUrl,
          ...(payload.images || []),
          ...formattedVariants.map((fv) => fv.imageUrl),
        ].filter((u): u is string => Boolean(u && u.trim()))
      )
    );

    return this.inventoryRepo.updateProductWithVariants(productId, {
      title: payload.title,
      description: payload.description,
      baseSku: payload.baseSku ? cleanBaseSku : undefined,
      imageUrl: payload.imageUrl || allImages[0],
      images: allImages,
      defaultLocationId: defaultLocation.id,
      variants: formattedVariants.length > 0 ? formattedVariants : undefined,
    });
  }

/**
   * List all products & variants with real-time stock breakdown
   */
  async listMerchantProducts(merchantId?: string) {
    return this.inventoryRepo.findProducts(merchantId);
  }

  /**
   * Get single product by ID
   */
  async getProductById(id: string, merchantId?: string) {
    const product = await this.inventoryRepo.findProductById(id, merchantId);
    if (!product) {
      throw new NotFoundException(`Product with ID '${id}' not found`);
    }
    return product;
  }

  /**
   * List stock movement audit ledger for transparency
   */
  async listAuditLogs(merchantId?: string) {
    return this.inventoryRepo.findAuditLogs(merchantId);
  }

  /**
   * Create or update warehouse location bin
   */
  async createLocation(data: {
    zone: string;
    aisle: string;
    rack: string;
    shelf: string;
    binCode: string;
    isDamaged?: boolean;
  }) {
    return this.inventoryRepo.upsertLocation(data);
  }

  /**
   * List all locations
   */
  async listLocations() {
    return this.inventoryRepo.listLocations();
  }

  /**
   * Stock adjustment
   */
  async adjustStock(data: {
    variantId: string;
    locationId: string;
    quantityDelta: number;
    isDamaged?: boolean;
    reason?: string;
    merchantId?: string;
    performedByUserId?: string;
  }) {
    return this.inventoryRepo.adjustStock(data);
  }

  /**
   * Atomically reserve stock for an order's line items and record audit trail.
   */
  async reserveStockForOrder(
    items: Array<{ variantId: string; quantity: number }>,
    merchantId?: string,
    orderReference?: string,
  ): Promise<boolean> {
    return this.inventoryRepo.reserveStockAtomically(items, merchantId, orderReference);
  }

  /**
   * Release reserved stock back to available stock and log audit entry
   */
  async releaseReservedStock(
    items: Array<{ variantId: string; quantity: number }>,
    merchantId?: string,
    orderReference?: string,
  ) {
    return this.inventoryRepo.releaseReservedStock(items, merchantId, orderReference);
  }
}
