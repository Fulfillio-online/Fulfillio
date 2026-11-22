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
      status?: string;
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

    const seenSkus = new Set<string>();
    const formattedVariants = payload.variants.map((v, idx) => {
      const rawVar = (v.variantCode || `V${idx + 1}`).trim().toUpperCase().replace(/[^a-zA-Z0-9_-]/g, '-');
      let cleanVar = rawVar.length > 0 ? rawVar : `V${idx + 1}`;
      let twoPartSku = `${merchantPrefix}-${finalBaseSku}-${cleanVar}`;
      if (seenSkus.has(twoPartSku)) {
        twoPartSku = `${merchantPrefix}-${finalBaseSku}-${cleanVar}-${idx + 1}`;
      }
      seenSkus.add(twoPartSku);

      const randEntropy = Math.floor(100 + Math.random() * 900);
      const ean13 = (v as any).barcode?.trim() || `894${Date.now().toString().slice(-7)}${idx % 10}${randEntropy}`;

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
      status: payload.status,
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
      status?: string;
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
      status: payload.status,
      defaultLocationId: defaultLocation.id,
      variants: formattedVariants.length > 0 ? formattedVariants : undefined,
    });
  }

  /**
   * Update product status (e.g., 'DRAFT' or 'PUBLISHED')
   */
  async updateProductStatus(productId: string, status: string) {
    return this.inventoryRepo.updateProductStatus(productId, status);
  }

  /**
   * Approve a product submission (Step 1):
   * Sets status to PUBLISHED/APPROVED, assigns binCode, sets initial stock (0 for catalog only)
   */
  async approveProduct(
    productId: string,
    data: {
      binCode?: string;
      finalQty?: number;
      acceptStockNow?: boolean;
    },
  ) {
    return this.inventoryRepo.approveProduct(productId, data);
  }

  /**
   * Accept physical stock intake (Step 2 - Store Done):
   * Adds received quantity into warehouse bin and updates product stock
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
    return this.inventoryRepo.acceptStock(productId, data);
  }

  /**
   * Delete a product from PostgreSQL (only allowed if warehouse stock === 0)
   */
  async deleteProduct(productId: string) {
    return this.inventoryRepo.deleteProduct(productId);
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

  // ============================================================================
  // PRODUCT LIFECYCLE & REQUEST WORKFLOWS
  // ============================================================================

  async submitApprovalRequest(productId: string, requestedBy?: string) {
    return this.inventoryRepo.submitApprovalRequest(productId, requestedBy);
  }

  async cancelApprovalRequest(productId: string, merchantId?: string) {
    return this.inventoryRepo.cancelApprovalRequest(productId, merchantId);
  }

  async approveSubmission(productId: string, adminId?: string, binCode?: string) {
    return this.inventoryRepo.approveSubmission(productId, adminId, binCode);
  }

  async rejectSubmission(productId: string, adminId?: string, reason?: string) {
    return this.inventoryRepo.rejectSubmission(productId, adminId, reason);
  }

  async receiveInitialStock(productId: string, data: any) {
    return this.inventoryRepo.receiveInitialStock(productId, data);
  }

  async requestEditAccess(productId: string, merchantId?: string, reason?: string) {
    return this.inventoryRepo.requestEditAccess(productId, merchantId, reason);
  }

  async reviewEditAccess(productId: string, adminId?: string, action: 'GRANT' | 'DENY' = 'GRANT', reason?: string) {
    return this.inventoryRepo.reviewEditAccess(productId, adminId, action, reason);
  }

  async submitRevision(productId: string, merchantId?: string, proposedSnapshot?: any) {
    return this.inventoryRepo.submitRevision(productId, merchantId, proposedSnapshot);
  }

  async reviewRevision(productId: string, adminId?: string, action: 'APPROVE' | 'REJECT' = 'APPROVE', reason?: string) {
    return this.inventoryRepo.reviewRevision(productId, adminId, action, reason);
  }

  async createRestockRequest(productId: string, merchantId: string, data: any) {
    return this.inventoryRepo.createRestockRequest(productId, merchantId, data);
  }

  async reviewRestockRequest(requestId: string, adminId?: string, action: 'APPROVE' | 'REJECT' = 'APPROVE', approvedQty?: number, reason?: string) {
    return this.inventoryRepo.reviewRestockRequest(requestId, adminId, action, approvedQty, reason);
  }

  async receiveRestockStock(requestId: string, adminId: string, data: any) {
    return this.inventoryRepo.receiveRestockStock(requestId, adminId, data);
  }

  async createReturnRequest(productId: string, merchantId: string, data: any) {
    return this.inventoryRepo.createReturnRequest(productId, merchantId, data);
  }

  async reviewReturnRequest(requestId: string, adminId?: string, action: 'APPROVE' | 'REJECT' = 'APPROVE', approvedQty?: number, reason?: string) {
    return this.inventoryRepo.reviewReturnRequest(requestId, adminId, action, approvedQty, reason);
  }

  async dispatchReturnStock(requestId: string, adminId: string, data: any) {
    return this.inventoryRepo.dispatchReturnStock(requestId, adminId, data);
  }

  async suspendProduct(productId: string, adminId?: string, reason?: string) {
    return this.inventoryRepo.suspendProduct(productId, adminId, reason);
  }

  async reactivateProduct(productId: string, adminId?: string) {
    return this.inventoryRepo.reactivateProduct(productId, adminId);
  }

  async listApprovalRequests(merchantId?: string, status?: string) {
    return this.inventoryRepo.listApprovalRequests(merchantId, status);
  }

  async listEditRequests(merchantId?: string, status?: string) {
    return this.inventoryRepo.listEditRequests(merchantId, status);
  }

  async listRestockRequests(merchantId?: string, status?: string) {
    return this.inventoryRepo.listRestockRequests(merchantId, status);
  }

  async listReturnRequests(merchantId?: string, status?: string) {
    return this.inventoryRepo.listReturnRequests(merchantId, status);
  }

  async listInventoryTransactions(productId?: string, merchantId?: string) {
    return this.inventoryRepo.listInventoryTransactions(productId, merchantId);
  }

  async listActivityLogs(entityType?: string, entityId?: string) {
    return this.inventoryRepo.listActivityLogs(entityType, entityId);
  }

  async listNotifications(role?: string, merchantId?: string, isRead?: boolean) {
    return this.inventoryRepo.listNotifications(role, merchantId, isRead);
  }

  async markNotificationRead(id: string) {
    return this.inventoryRepo.markNotificationRead(id);
  }

  async markAllNotificationsRead(role?: string, merchantId?: string) {
    return this.inventoryRepo.markAllNotificationsRead(role, merchantId);
  }

  async checkOrderEligibility(productId: string, quantity: number = 1) {
    return this.inventoryRepo.checkOrderEligibility(productId, quantity);
  }
}
