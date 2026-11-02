import { Controller, Post, Get, Param, Body, UseGuards, Request } from '@nestjs/common';
import { OrderService } from './order.service';
import { ApiKeyGuard } from '../auth/guards/api-key.guard';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PackagingType } from '@fulfillio/contracts';

@Controller('orders')
export class OrderController {
  constructor(private readonly orderService: OrderService) {}

  /**
   * Check customer phone number against BD Courier Fraud & Delivery Ratio Shield
   */
  @Get('fraud-check/:phone')
  async checkFraudRatio(@Param('phone') phone: string) {
    return this.orderService.evaluateCustomerFraudRatio(phone);
  }

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

  /**
   * Bulk CSV / Excel Order Import endpoint
   */
  @Post('bulk')
  @UseGuards(JwtAuthGuard)
  async bulkCreateOrders(@Request() req: any, @Body('orders') orders: any[]) {
    return this.orderService.bulkCreateOrders(req.user.merchantId, orders);
  }

  /**
   * Lock 4x6 Thermal Memo Print & assign Packaging Material cost
   */
  @Post('batch-print-lock')
  @UseGuards(JwtAuthGuard)
  async batchPrintLock(
    @Body() body: { orderIds: string[]; packagingType?: PackagingType },
  ) {
    return this.orderService.lockBatchMemoPrintAndPack(body.orderIds, body.packagingType);
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
