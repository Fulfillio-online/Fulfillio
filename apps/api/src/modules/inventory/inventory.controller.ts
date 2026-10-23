import { Controller, Post, Get, Body, UseGuards, Request } from '@nestjs/common';
import { InventoryService } from './inventory.service';
import { PrismaService } from '../../prisma/prisma.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('inventory')
@UseGuards(JwtAuthGuard)
export class InventoryController {
  constructor(
    private readonly inventoryService: InventoryService,
    private readonly prisma: PrismaService,
  ) {}

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
    },
  ) {
    return this.prisma.inventoryLocation.create({
      data: {
        zone: body.zone,
        aisle: body.aisle,
        rack: body.rack,
        shelf: body.shelf,
        binCode: body.binCode.toUpperCase(),
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
   * Adjust stock with an auditable reason code
   */
  @Post('adjust')
  async adjustStock(
    @Body()
    body: {
      variantId: string;
      locationId: string;
      quantityDelta: number;
      reason: string;
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
        update: {
          quantityAvailable: { increment: body.quantityDelta },
        },
        create: {
          variantId: body.variantId,
          locationId: body.locationId,
          quantityAvailable: Math.max(0, body.quantityDelta),
          quantityReserved: 0,
        },
      });

      return {
        item,
        reason: body.reason,
        adjustedAt: new Date().toISOString(),
      };
    });
  }
}
