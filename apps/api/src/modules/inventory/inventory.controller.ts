import { Controller, Post, Get, Body, UseGuards, Request } from '@nestjs/common';
import { InventoryService } from './inventory.service';
import { PrismaService } from '../../prisma/prisma.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { StockMovementReason } from '@fulfillio/contracts';

@Controller('inventory')
@UseGuards(JwtAuthGuard, RolesGuard)
export class InventoryController {
  constructor(
    private readonly inventoryService: InventoryService,
    private readonly prisma: PrismaService,
  ) {}

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
   * List all products & stock levels for the authenticated merchant
   */
  @Get('products')
  async listProducts(@Request() req: any) {
    return this.inventoryService.listMerchantProducts(req.user.merchantId);
  }

  /**
   * Get auditable stock movement ledger
   */
  @Get('audit-logs')
  async listAuditLogs(@Request() req: any) {
    return this.inventoryService.listAuditLogs(req.user.merchantId);
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
    return this.prisma.inventoryLocation.create({
      data: {
        zone: body.zone,
        aisle: body.aisle,
        rack: body.rack,
        shelf: body.shelf,
        binCode: body.binCode.toUpperCase(),
        isDamaged: body.isDamaged ?? false,
      },
    });
  }

  @Get('locations')
  async listLocations() {
    return this.prisma.inventoryLocation.findMany({
      orderBy: { binCode: 'asc' },
    });
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
    return this.prisma.$transaction(async (tx) => {
      const item = await tx.inventoryItem.upsert({
        where: {
          variantId_locationId: {
            variantId: body.variantId,
            locationId: body.locationId,
          },
        },
        update: body.isDamaged
          ? { quantityDamaged: { increment: body.quantityDelta } }
          : { quantityAvailable: { increment: body.quantityDelta } },
        create: {
          variantId: body.variantId,
          locationId: body.locationId,
          quantityAvailable: body.isDamaged ? 0 : Math.max(0, body.quantityDelta),
          quantityDamaged: body.isDamaged ? Math.max(0, body.quantityDelta) : 0,
          quantityReserved: 0,
        },
      });

      if (req.user?.merchantId) {
        await tx.inventoryAuditLog.create({
          data: {
            merchantId: req.user.merchantId,
            variantId: body.variantId,
            quantityDelta: body.quantityDelta,
            reason: body.isDamaged
              ? StockMovementReason.DAMAGED_QUARANTINE
              : StockMovementReason.MANUAL_ADJUSTMENT,
            performedByUserId: req.user.sub,
            notes: body.reason || 'Manual warehouse stock adjustment',
          },
        });
      }

      return {
        item,
        reason: body.reason,
        adjustedAt: new Date().toISOString(),
      };
    });
  }
}
