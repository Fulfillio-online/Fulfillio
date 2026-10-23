import { Controller, Post, Get, Param, Body, UseGuards } from '@nestjs/common';
import { PackingService } from './packing.service';
import { PrismaService } from '../../prisma/prisma.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('packing')
export class PackingController {
  constructor(
    private readonly packingService: PackingService,
    private readonly prisma: PrismaService,
  ) {}

  /**
   * Fetch active packing order and items for verification
   */
  @Get('orders/:id')
  async getOrderForPacking(@Param('id') orderId: string) {
    return this.prisma.order.findUnique({
      where: { id: orderId },
      include: {
        items: {
          include: {
            variant: {
              include: {
                product: true,
              },
            },
          },
        },
      },
    });
  }

  /**
   * Operator scan verification endpoint
   */
  @Post('verify')
  async verifyBarcode(
    @Body('orderId') orderId: string,
    @Body('barcode') barcode: string,
  ) {
    return this.packingService.verifyItemBarcode(orderId, barcode);
  }
}
