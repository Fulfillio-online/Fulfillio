import {
  Controller,
  Post,
  Get,
  Patch,
  Param,
  Query,
  Body,
  UseGuards,
  Request,
} from '@nestjs/common';
import { OrderService } from './order.service';
import { ApiKeyGuard } from '../auth/guards/api-key.guard';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { PackagingType, OrderStatus, UserRole } from '@fulfillio/contracts';

@Controller('orders')
export class OrderController {
  constructor(private readonly orderService: OrderService) {}

  /**
   * List orders with pagination, search, status filtering, and multi-tenant security
   */
  @Get()
  @UseGuards(JwtAuthGuard, RolesGuard)
  async listOrders(
    @Request() req: any,
    @Query('status') status?: OrderStatus,
    @Query('search') search?: string,
    @Query('merchantId') merchantIdQuery?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    // If MERCHANT role, always enforce their own merchantId
    const isMerchant = req.user?.role === UserRole.MERCHANT;
    const effectiveMerchantId = isMerchant ? req.user.merchantId : merchantIdQuery;

    return this.orderService.listOrders({
      merchantId: effectiveMerchantId,
      status,
      search,
      page: page ? parseInt(page, 10) : 1,
      limit: limit ? parseInt(limit, 10) : 20,
    });
  }

  /**
   * Get single order by ID with line items and fulfillments
   */
  @Get(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  async getOrderById(@Request() req: any, @Param('id') id: string) {
    const isMerchant = req.user?.role === UserRole.MERCHANT;
    const effectiveMerchantId = isMerchant ? req.user.merchantId : undefined;
    return this.orderService.getOrderById(id, effectiveMerchantId);
  }

  /**
   * Update order status
   */
  @Patch(':id/status')
  @UseGuards(JwtAuthGuard, RolesGuard)
  async updateStatus(
    @Request() req: any,
    @Param('id') id: string,
    @Body('status') status: OrderStatus,
  ) {
    const isMerchant = req.user?.role === UserRole.MERCHANT;
    const effectiveMerchantId = isMerchant ? req.user.merchantId : undefined;
    return this.orderService.updateOrderStatus(id, status, effectiveMerchantId);
  }

  /**
   * Packing station line item barcode scan verification
   */
  @Post(':id/items/:itemId/verify')
  @UseGuards(JwtAuthGuard)
  async verifyItem(
    @Param('id') orderId: string,
    @Param('itemId') itemId: string,
    @Body('isVerified') isVerified?: boolean,
  ) {
    return this.orderService.verifyOrderItem(orderId, itemId, isVerified ?? true);
  }

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
