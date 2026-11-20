import { Controller, Post, Get, Put, Patch, Param, Body, Query, Request } from '@nestjs/common';
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
      imageUrl?: string;
      images?: string[];
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
}
