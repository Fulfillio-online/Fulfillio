import { Controller, Post, Get, Param, Body, UseGuards, Request } from '@nestjs/common';
import { OrderService } from './order.service';
import { ApiKeyGuard } from '../auth/guards/api-key.guard';

@Controller('orders')
export class OrderController {
  constructor(private readonly orderService: OrderService) {}

  /**
   * External store ingestion endpoint (WooCommerce / Shopify / Custom REST API)
   * Authenticated via X-Fulfillio-Api-Key
   */
  @Post()
  @UseGuards(ApiKeyGuard)
  async ingestOrder(@Request() req: any, @Body() body: any) {
    const merchantId = req.merchant.id;
    return this.orderService.createOrder(merchantId, body);
  }

  @Post(':id/cancel')
  @UseGuards(ApiKeyGuard)
  async cancelOrder(@Param('id') id: string) {
    return this.orderService.cancelOrder(id);
  }

  /**
   * Warehouse wave pick list generation
   */
  @Post('wave-pick')
  async generateWavePick(@Body('orderIds') orderIds?: string[]) {
    return this.orderService.generateWavePickList(orderIds);
  }
}
