import { Controller, Post, Get, Put, Patch, Delete, Param, Body, Query, Request } from '@nestjs/common';
import { InventoryService } from './inventory.service';
import { UserRole } from '@fulfillio/contracts';

@Controller('inventory')
export class InventoryController {
  constructor(private readonly inventoryService: InventoryService) {}

  /**
   * Create a new Product with 2-Part SKU variants ([MerchantCode]-[BaseSKU]-[Variant])
   */
  @Post('products')
  async createProduct(
    @Request() req: any,
    @Body()
    body: {
      merchantId?: string;
      merchantCode?: string;
      title: string;
      description?: string;
      baseSku: string;
      category?: string;
      brand?: string;
      purchasePrice?: number;
      sellingPrice?: number;
      weight?: string;
      dimensions?: string;
      imageUrl?: string;
      images?: string[];
      status?: string;
      saveAsDraft?: boolean;
      variants: Array<{
        title: string;
        variantCode: string;
        price: number;
        wholesalePrice?: number;
        defaultBinCode?: string;
        initialStock?: number;
        imageUrl?: string;
        attributes?: Record<string, any>;
      }>;
    },
  ) {
    const effectiveMerchant =
      req.user?.merchantId ||
      body.merchantId ||
      body.merchantCode ||
      req.headers['x-merchant-code'] ||
      'MC-101';
    return this.inventoryService.createProductWithVariants(effectiveMerchant, body);
  }

  /**
   * Update an existing product by ID or baseSku
   */
  @Put('products/:id')
  async updateProduct(
    @Request() req: any,
    @Param('id') id: string,
    @Body() body: any,
  ) {
    const effectiveMerchant =
      req.user?.merchantId ||
      body.merchantId ||
      body.merchantCode ||
      req.headers['x-merchant-code'] ||
      'MC-101';
    return this.inventoryService.updateProductWithVariants(id, effectiveMerchant, body);
  }

  @Patch('products/:id')
  async patchProduct(
    @Request() req: any,
    @Param('id') id: string,
    @Body() body: any,
  ) {
    const effectiveMerchant =
      req.user?.merchantId ||
      body.merchantId ||
      body.merchantCode ||
      req.headers['x-merchant-code'] ||
      'MC-101';
    return this.inventoryService.updateProductWithVariants(id, effectiveMerchant, body);
  }

  /**
   * Dedicated endpoint to update product status (DRAFT vs PUBLISHED/APPROVED)
   */
  @Patch('products/:id/status')
  async patchProductStatus(
    @Param('id') id: string,
    @Body() body: { status: string },
  ) {
    return this.inventoryService.updateProductStatus(id, body.status);
  }

  @Put('products/:id/status')
  async putProductStatus(
    @Param('id') id: string,
    @Body() body: { status: string },
  ) {
    return this.inventoryService.updateProductStatus(id, body.status);
  }

  /**
   * Step 1: Approve product specification / store request
   */
  @Post('products/:id/approve')
  async approveProduct(
    @Param('id') id: string,
    @Body()
    body: {
      binCode?: string;
      finalQty?: number;
      acceptStockNow?: boolean;
      variantStocks?: Record<string, number>;
    },
  ) {
    return this.inventoryService.approveProduct(id, body);
  }

  @Patch('products/:id/approve')
  async patchApproveProduct(
    @Param('id') id: string,
    @Body()
    body: {
      binCode?: string;
      finalQty?: number;
      acceptStockNow?: boolean;
      variantStocks?: Record<string, number>;
    },
  ) {
    return this.inventoryService.approveProduct(id, body);
  }

  /**
   * Step 2: Accept physical stock into warehouse bin (Store Done)
   */
  @Post('products/:id/accept-stock')
  async acceptStock(
    @Param('id') id: string,
    @Body()
    body: {
      quantity: number;
      binCode?: string;
      challanOrTracking?: string;
      note?: string;
    },
  ) {
    return this.inventoryService.acceptStock(id, body);
  }

  @Patch('products/:id/accept-stock')
  async patchAcceptStock(
    @Param('id') id: string,
    @Body()
    body: {
      quantity: number;
      binCode?: string;
      challanOrTracking?: string;
      note?: string;
    },
  ) {
    return this.inventoryService.acceptStock(id, body);
  }

  @Post('products/:id/intake')
  async intakeStock(
    @Param('id') id: string,
    @Body()
    body: {
      quantity: number;
      binCode?: string;
      challanOrTracking?: string;
      note?: string;
    },
  ) {
    return this.inventoryService.acceptStock(id, body);
  }

  /**
   * Delete a product from PostgreSQL (only allowed if warehouse stock === 0)
   */
  @Delete('products/:id')
  async deleteProduct(@Param('id') id: string) {
    return this.inventoryService.deleteProduct(id);
  }

  /**
   * List all products & stock levels for the authenticated merchant (or all if admin)
   */
  @Get('products')
  async listProducts(
    @Request() req: any,
    @Query('merchantCode') merchantCode?: string,
    @Query('merchantId') merchantIdQuery?: string,
  ) {
    const isMerchant = req.user?.role === UserRole.MERCHANT;
    const effectiveMerchantId =
      req.user?.merchantId ||
      merchantIdQuery ||
      merchantCode ||
      req.headers['x-merchant-code'] ||
      (isMerchant ? req.user.merchantId : undefined);
    return this.inventoryService.listMerchantProducts(effectiveMerchantId);
  }

  /**
   * Get single product detail
   */
  @Get('products/:id')
  async getProductById(@Request() req: any, @Param('id') id: string) {
    const isMerchant = req.user?.role === UserRole.MERCHANT;
    const effectiveMerchantId = isMerchant ? req.user.merchantId : undefined;
    return this.inventoryService.getProductById(id, effectiveMerchantId);
  }

  /**
   * Get auditable stock movement ledger
   */
  @Get('audit-logs')
  async listAuditLogs(@Request() req: any) {
    const isMerchant = req.user?.role === UserRole.MERCHANT;
    const effectiveMerchantId = isMerchant ? req.user.merchantId : undefined;
    return this.inventoryService.listAuditLogs(effectiveMerchantId);
  }

  /**
   * Register a physical warehouse bin location
   */
  @Post('locations')
  async createLocation(
    @Body()
    body: {
      zone: string;
      aisle: string;
      rack: string;
      shelf: string;
      binCode: string;
      isDamaged?: boolean;
    },
  ) {
    return this.inventoryService.createLocation(body);
  }

  /**
   * List warehouse bin locations
   */
  @Get('locations')
  async listLocations() {
    return this.inventoryService.listLocations();
  }

  /**
   * Adjust stock with an auditable reason code & damaged quarantine support
   */
  @Post('adjust')
  async adjustStock(
    @Request() req: any,
    @Body()
    body: {
      variantId: string;
      locationId: string;
      quantityDelta: number;
      isDamaged?: boolean;
      reason?: string;
    },
  ) {
    return this.inventoryService.adjustStock({
      ...body,
      merchantId: req.user?.merchantId,
      performedByUserId: req.user?.sub,
    });
  }

  // ============================================================================
  // WORKFLOW 1: SUBMIT DRAFT FOR APPROVAL
  // ============================================================================
  @Post('products/:id/submit-approval')
  async submitApproval(@Param('id') id: string, @Request() req: any) {
    const userId = req.user?.sub || req.user?.id;
    return this.inventoryService.submitApprovalRequest(id, userId);
  }

  // ============================================================================
  // WORKFLOW 2: CANCEL APPROVAL / SUBMISSION (Returns to Draft)
  // ============================================================================
  @Post('products/:id/cancel-approval')
  async cancelApproval(@Param('id') id: string, @Request() req: any) {
    const merchantId = req.user?.merchantId || req.headers['x-merchant-code'];
    return this.inventoryService.cancelApprovalRequest(id, merchantId);
  }

  // ============================================================================
  // WORKFLOW 3: ADMIN APPROVE PRODUCT SUBMISSION
  // ============================================================================
  @Post('products/:id/approve-submission')
  async approveSubmission(
    @Param('id') id: string,
    @Request() req: any,
    @Body() body: { binCode?: string },
  ) {
    const adminId = req.user?.sub || req.user?.id || 'admin';
    return this.inventoryService.approveSubmission(id, adminId, body.binCode);
  }

  // ============================================================================
  // WORKFLOW 4: ADMIN REJECT PRODUCT SUBMISSION
  // ============================================================================
  @Post('products/:id/reject-submission')
  async rejectSubmission(
    @Param('id') id: string,
    @Request() req: any,
    @Body() body: { reason: string },
  ) {
    const adminId = req.user?.sub || req.user?.id || 'admin';
    return this.inventoryService.rejectSubmission(id, adminId, body.reason);
  }

  // ============================================================================
  // WORKFLOW 5: RECEIVE INITIAL PHYSICAL STOCK (Awaiting Stock -> Active)
  // ============================================================================
  @Post('products/:id/receive-stock')
  async receiveInitialStock(
    @Param('id') id: string,
    @Request() req: any,
    @Body()
    body: {
      expectedQuantity: number;
      actualQuantity: number;
      acceptedQuantity: number;
      damagedQuantity: number;
      warehouseLocation?: string;
      binCode: string;
      receivingNotes?: string;
      receivedBy?: string;
    },
  ) {
    const receivedBy = body.receivedBy || req.user?.name || req.user?.sub || 'Warehouse Staff';
    return this.inventoryService.receiveInitialStock(id, { ...body, receivedBy });
  }

  // ============================================================================
  // WORKFLOW 6: PRODUCT EDIT PERMISSION & REVISION WORKFLOW
  // ============================================================================
  @Post('products/:id/request-edit')
  async requestEditAccess(
    @Param('id') id: string,
    @Request() req: any,
    @Body() body: { reason?: string },
  ) {
    const merchantId = req.user?.merchantId || req.headers['x-merchant-code'];
    return this.inventoryService.requestEditAccess(id, merchantId, body.reason);
  }

  @Post('products/:id/review-edit-permission')
  async reviewEditPermission(
    @Param('id') id: string,
    @Request() req: any,
    @Body() body: { action: 'GRANT' | 'DENY'; reason?: string },
  ) {
    const adminId = req.user?.sub || req.user?.id || 'admin';
    return this.inventoryService.reviewEditAccess(id, adminId, body.action, body.reason);
  }

  @Post('products/:id/submit-revision')
  async submitRevision(
    @Param('id') id: string,
    @Request() req: any,
    @Body() body: { proposedSnapshot: any },
  ) {
    const merchantId = req.user?.merchantId || req.headers['x-merchant-code'];
    return this.inventoryService.submitRevision(id, merchantId, body.proposedSnapshot);
  }

  @Post('products/:id/review-revision')
  async reviewRevision(
    @Param('id') id: string,
    @Request() req: any,
    @Body() body: { action: 'APPROVE' | 'REJECT'; reason?: string },
  ) {
    const adminId = req.user?.sub || req.user?.id || 'admin';
    return this.inventoryService.reviewRevision(id, adminId, body.action, body.reason);
  }

  // ============================================================================
  // WORKFLOW 7: RESTOCK REQUEST WORKFLOW
  // ============================================================================
  @Post('products/:id/request-restock')
  async requestRestock(
    @Param('id') id: string,
    @Request() req: any,
    @Body() body: { requestedQuantity: number; estimatedDeliveryDate?: string; notes?: string },
  ) {
    const merchantId = req.user?.merchantId || req.headers['x-merchant-code'];
    return this.inventoryService.createRestockRequest(id, merchantId, body);
  }

  @Post('restock-requests/:id/review')
  async reviewRestock(
    @Param('id') id: string,
    @Request() req: any,
    @Body() body: { action: 'APPROVE' | 'REJECT'; approvedQuantity?: number; rejectionReason?: string },
  ) {
    const adminId = req.user?.sub || req.user?.id || 'admin';
    return this.inventoryService.reviewRestockRequest(
      id,
      adminId,
      body.action,
      body.approvedQuantity,
      body.rejectionReason,
    );
  }

  @Post('restock-requests/:id/receive')
  async receiveRestock(
    @Param('id') id: string,
    @Request() req: any,
    @Body()
    body: {
      actualQuantity: number;
      acceptedQuantity: number;
      damagedQuantity: number;
      binCode: string;
      receivingNotes?: string;
      receivedBy?: string;
    },
  ) {
    const adminId = req.user?.sub || req.user?.id || 'admin';
    return this.inventoryService.receiveRestockStock(id, adminId, body);
  }

  // ============================================================================
  // WORKFLOW 8: RETURN TO MERCHANT WORKFLOW
  // ============================================================================
  @Post('products/:id/request-return')
  async requestReturn(
    @Param('id') id: string,
    @Request() req: any,
    @Body() body: { requestedQuantity: number; returnReason: string; notes?: string },
  ) {
    const merchantId = req.user?.merchantId || req.headers['x-merchant-code'];
    return this.inventoryService.createReturnRequest(id, merchantId, body);
  }

  @Post('return-requests/:id/review')
  async reviewReturn(
    @Param('id') id: string,
    @Request() req: any,
    @Body() body: { action: 'APPROVE' | 'REJECT'; approvedQuantity?: number; rejectionReason?: string },
  ) {
    const adminId = req.user?.sub || req.user?.id || 'admin';
    return this.inventoryService.reviewReturnRequest(
      id,
      adminId,
      body.action,
      body.approvedQuantity,
      body.rejectionReason,
    );
  }

  @Post('return-requests/:id/dispatch')
  async dispatchReturn(
    @Param('id') id: string,
    @Request() req: any,
    @Body()
    body: {
      dispatchedQuantity: number;
      courierName?: string;
      trackingNumber?: string;
      notes?: string;
    },
  ) {
    const adminId = req.user?.sub || req.user?.id || 'admin';
    return this.inventoryService.dispatchReturnStock(id, adminId, body);
  }

  // ============================================================================
  // WORKFLOW 9: PRODUCT SUSPENSION & REACTIVATION
  // ============================================================================
  @Post('products/:id/suspend')
  async suspendProduct(
    @Param('id') id: string,
    @Request() req: any,
    @Body() body: { reason: string },
  ) {
    const adminId = req.user?.sub || req.user?.id || 'admin';
    return this.inventoryService.suspendProduct(id, adminId, body.reason);
  }

  @Post('products/:id/reactivate')
  async reactivateProduct(@Param('id') id: string, @Request() req: any) {
    const adminId = req.user?.sub || req.user?.id || 'admin';
    return this.inventoryService.reactivateProduct(id, adminId);
  }

  // ============================================================================
  // QUERIES FOR REQUESTS, LOGS & NOTIFICATIONS
  // ============================================================================
  @Get('approval-requests')
  async listApprovalRequests(
    @Request() req: any,
    @Query('merchantId') merchantIdQuery?: string,
    @Query('status') status?: string,
  ) {
    const isMerchant = req.user?.role === UserRole.MERCHANT;
    const effectiveMerchantId = isMerchant
      ? req.user.merchantId
      : merchantIdQuery || req.headers['x-merchant-code'];
    return this.inventoryService.listApprovalRequests(effectiveMerchantId, status);
  }

  @Get('edit-requests')
  async listEditRequests(
    @Request() req: any,
    @Query('merchantId') merchantIdQuery?: string,
    @Query('status') status?: string,
  ) {
    const isMerchant = req.user?.role === UserRole.MERCHANT;
    const effectiveMerchantId = isMerchant
      ? req.user.merchantId
      : merchantIdQuery || req.headers['x-merchant-code'];
    return this.inventoryService.listEditRequests(effectiveMerchantId, status);
  }

  @Get('restock-requests')
  async listRestockRequests(
    @Request() req: any,
    @Query('merchantId') merchantIdQuery?: string,
    @Query('status') status?: string,
  ) {
    const isMerchant = req.user?.role === UserRole.MERCHANT;
    const effectiveMerchantId = isMerchant
      ? req.user.merchantId
      : merchantIdQuery || req.headers['x-merchant-code'];
    return this.inventoryService.listRestockRequests(effectiveMerchantId, status);
  }

  @Get('return-requests')
  async listReturnRequests(
    @Request() req: any,
    @Query('merchantId') merchantIdQuery?: string,
    @Query('status') status?: string,
  ) {
    const isMerchant = req.user?.role === UserRole.MERCHANT;
    const effectiveMerchantId = isMerchant
      ? req.user.merchantId
      : merchantIdQuery || req.headers['x-merchant-code'];
    return this.inventoryService.listReturnRequests(effectiveMerchantId, status);
  }

  @Get('transactions')
  async listTransactions(
    @Request() req: any,
    @Query('productId') productId?: string,
    @Query('merchantId') merchantIdQuery?: string,
  ) {
    const isMerchant = req.user?.role === UserRole.MERCHANT;
    const effectiveMerchantId = isMerchant
      ? req.user.merchantId
      : merchantIdQuery || req.headers['x-merchant-code'];
    return this.inventoryService.listInventoryTransactions(productId, effectiveMerchantId);
  }

  @Get('activity-logs')
  async listActivityLogs(
    @Query('entityType') entityType?: string,
    @Query('entityId') entityId?: string,
  ) {
    return this.inventoryService.listActivityLogs(entityType, entityId);
  }

  @Get('notifications')
  async listNotifications(
    @Request() req: any,
    @Query('role') role?: string,
    @Query('merchantId') merchantId?: string,
    @Query('isRead') isRead?: string,
  ) {
    const effectiveRole = req.user?.role || role;
    const effectiveMerchant = req.user?.merchantId || merchantId;
    const isReadBool = isRead !== undefined ? isRead === 'true' : undefined;
    return this.inventoryService.listNotifications(effectiveRole, effectiveMerchant, isReadBool);
  }

  @Patch('notifications/:id/read')
  async markNotificationRead(@Param('id') id: string) {
    return this.inventoryService.markNotificationRead(id);
  }

  @Post('notifications/mark-all-read')
  async markAllNotificationsRead(@Request() req: any, @Body() body: { role?: string; merchantId?: string }) {
    const role = req.user?.role || body.role;
    const merchantId = req.user?.merchantId || body.merchantId;
    return this.inventoryService.markAllNotificationsRead(role, merchantId);
  }

  @Get('products/:id/order-eligibility')
  async checkOrderEligibility(@Param('id') id: string, @Query('quantity') qty?: string) {
    const parsedQty = qty ? parseInt(qty, 10) : 1;
    return this.inventoryService.checkOrderEligibility(id, parsedQty);
  }
}
