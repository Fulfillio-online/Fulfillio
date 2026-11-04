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
    const merchant = await this.inventoryRepo.findMerchantById(merchantId);
    if (!merchant) {
      throw new NotFoundException(`Merchant '${merchantId}' not found.`);
    }

    const cleanBaseSku = payload.baseSku.trim().toUpperCase().replace(/\s+/g, '-');
    const merchantPrefix = merchant.merchantCode.toUpperCase();

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
      };
    });

    return this.inventoryRepo.createProductWithVariants({
      merchantId,
      title: payload.title,
      description: payload.description,
      baseSku: cleanBaseSku,
      imageUrl: payload.imageUrl,
      defaultLocationId: defaultLocation.id,
      variants: formattedVariants,
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
