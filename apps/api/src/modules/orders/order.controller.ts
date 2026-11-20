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
  BadRequestException,
} from '@nestjs/common';
import { OrderService } from './order.service';
import { ApiKeyGuard } from '../auth/guards/api-key.guard';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { JwtOrApiKeyGuard } from '../auth/guards/jwt-or-api-key.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { PackagingType, OrderStatus, UserRole } from '@fulfillio/contracts';

@Controller('orders')
export class OrderController {
  constructor(private readonly orderService: OrderService) {}

  /**
   * List orders with pagination, search, status filtering, and multi-tenant security
   */
  @Get()
  async listOrders(
    @Request() req: any,
    @Query('status') status?: OrderStatus,
    @Query('search') search?: string,
    @Query('merchantId') merchantIdQuery?: string,
    @Query('merchantCode') merchantCodeQuery?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    const rawMerchant =
      req.user?.merchantId ||
      merchantIdQuery ||
      merchantCodeQuery ||
      req.headers['x-merchant-code'];

    let effectiveMerchantId: string | undefined = undefined;
    if (rawMerchant) {
      const merchant = await this.orderService.resolveMerchant(rawMerchant);
      if (merchant) {
        effectiveMerchantId = merchant.id;
      }
    }

    return this.orderService.listOrders({
      merchantId: effectiveMerchantId,
      status,
      search,
      page: page ? parseInt(page, 10) : 1,
      limit: limit ? parseInt(limit, 10) : 50,
    });
  }

  /**
   * Get single order by ID with line items and fulfillments
   */
  @Get(':id')
  async getOrderById(@Request() req: any, @Param('id') id: string) {
    const rawMerchant = req.user?.merchantId || req.headers['x-merchant-code'];
    let effectiveMerchantId: string | undefined = undefined;
    if (rawMerchant) {
      const merchant = await this.orderService.resolveMerchant(rawMerchant);
      if (merchant) effectiveMerchantId = merchant.id;
    }
    return this.orderService.getOrderById(id, effectiveMerchantId);
  }

  /**
   * Update order status
   */
  @Patch(':id/status')
  async updateStatus(
    @Request() req: any,
    @Param('id') id: string,
    @Body('status') status: OrderStatus,
  ) {
    const rawMerchant = req.user?.merchantId || req.headers['x-merchant-code'];
    let effectiveMerchantId: string | undefined = undefined;
    if (rawMerchant) {
      const merchant = await this.orderService.resolveMerchant(rawMerchant);
      if (merchant) effectiveMerchantId = merchant.id;
    }
    return this.orderService.updateOrderStatus(id, status, effectiveMerchantId);
  }

  /**
   * Packing station line item barcode scan verification
   */
  @Post(':id/items/:itemId/verify')
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
   * External store ingestion endpoint (WooCommerce / Shopify / Custom REST API / Merchant Portal)
   */
  @Post()
  async ingestOrder(@Request() req: any, @Body() body: any) {
    try {
      const effectiveMerchant =
        req.merchant?.id ||
        req.user?.merchantId ||
        body?.merchantId ||
        body?.merchantCode ||
        req.headers['x-merchant-code'] ||
        'MC-101';
      return await this.orderService.createOrder(effectiveMerchant, body);
    } catch (err: any) {
      console.error('[OrderController] Failed to ingest order:', err);
      throw new BadRequestException(err?.message || 'Database error occurred while saving order');
    }
  }

  /**
   * Bulk CSV / Excel Order Import endpoint
   */
  @Post('bulk')
  async bulkCreateOrders(@Request() req: any, @Body() body: any) {
    const effectiveMerchant =
      req.merchant?.id ||
      req.user?.merchantId ||
      body.merchantId ||
      body.merchantCode ||
      req.headers['x-merchant-code'] ||
      'MC-101';
    const ordersList = Array.isArray(body) ? body : body.orders || [];
    return this.orderService.bulkCreateOrders(effectiveMerchant, ordersList);
  }

  /**
   * Lock 4x6 Thermal Memo Print & assign Packaging Material cost
   */
  @Post('batch-print-lock')
  async batchPrintLock(
    @Body() body: { orderIds: string[]; packagingType?: PackagingType },
  ) {
    return this.orderService.lockBatchMemoPrintAndPack(body.orderIds, body.packagingType);
  }

  @Post(':id/cancel')
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
