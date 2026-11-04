import { Controller, Post, Get, Param, Body, UseGuards, Request } from '@nestjs/common';
import { InventoryService } from './inventory.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { UserRole } from '@fulfillio/contracts';

@Controller('inventory')
@UseGuards(JwtAuthGuard, RolesGuard)
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
      title: string;
      description?: string;
      baseSku: string;
      imageUrl?: string;
      variants: Array<{
        title: string;
        variantCode: string;
        price: number;
        wholesalePrice?: number;
        defaultBinCode?: string;
        attributes?: Record<string, any>;
      }>;
    },
  ) {
    return this.inventoryService.createProductWithVariants(req.user.merchantId, body);
  }

  /**
   * List all products & stock levels for the authenticated merchant (or all if admin)
   */
  @Get('products')
  async listProducts(@Request() req: any) {
    const isMerchant = req.user?.role === UserRole.MERCHANT;
    const effectiveMerchantId = isMerchant ? req.user.merchantId : undefined;
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
  @Roles(UserRole.SUPER_ADMIN, UserRole.WAREHOUSE_OPERATOR)
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
