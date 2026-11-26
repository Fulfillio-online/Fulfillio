import {
  Controller,
  Post,
  Get,
  Put,
  Param,
  Body,
  Query,
  Req,
  Headers,
  HttpCode,
  UseGuards,
} from '@nestjs/common';
import { ShippingService } from './shipping.service';
import { CourierProvider } from '@fulfillio/contracts';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('shipping')
export class ShippingController {
  constructor(private readonly shippingService: ShippingService) {}

  // =========================================================================
  // COURIER INTEGRATIONS (DB-BACKED, ENCRYPTED)
  // =========================================================================

  @Get('integrations')
  @UseGuards(JwtAuthGuard)
  async listIntegrations() {
    return this.shippingService.listIntegrations();
  }

  @Put('integrations/:provider')
  @UseGuards(JwtAuthGuard)
  async upsertIntegration(@Param('provider') provider: string, @Body() body: any) {
    return this.shippingService.upsertIntegration(provider, body);
  }

  @Post('integrations/:provider/test')
  @HttpCode(200)
  @UseGuards(JwtAuthGuard)
  async testConnection(@Param('provider') provider: string) {
    return this.shippingService.testConnection(provider);
  }

  @Get('integrations/:provider/balance')
  @UseGuards(JwtAuthGuard)
  async getBalance(@Param('provider') provider: string) {
    return this.shippingService.getCourierBalance(provider);
  }

  // =========================================================================
  // CONSIGNMENT BOOKING (SINGLE & BULK)
  // =========================================================================

  @Post('book')
  @UseGuards(JwtAuthGuard)
  async book(@Body() body: any) {
    return this.shippingService.bookConsignment(body.orderId, body.provider, {
      note: body.note,
      deliveryType: body.deliveryType,
      exchange: body.exchange,
      alternativePhone: body.alternativePhone,
      recipientEmail: body.recipientEmail,
      forceRebook: body.forceRebook,
    });
  }

  @Post('book/bulk')
  @UseGuards(JwtAuthGuard)
  async bookBulk(@Body() body: any) {
    return this.shippingService.bookBulkConsignments(body.orderIds || [], body.provider);
  }

  // =========================================================================
  // LIVE STATUS SYNC, TRACKING HISTORY & RETURN REQUESTS
  // =========================================================================

  @Post('orders/:orderId/sync-status')
  @HttpCode(200)
  @UseGuards(JwtAuthGuard)
  async syncOrderStatus(@Param('orderId') orderId: string) {
    return this.shippingService.syncOrderCourierStatus(orderId);
  }

  @Get('orders/:orderId/tracking-history')
  @UseGuards(JwtAuthGuard)
  async getOrderTrackingHistory(@Param('orderId') orderId: string) {
    return this.shippingService.getOrderTrackingHistory(orderId);
  }

  @Post('orders/:orderId/return-request')
  @UseGuards(JwtAuthGuard)
  async createReturnRequest(
    @Param('orderId') orderId: string,
    @Body('reason') reason?: string,
  ) {
    return this.shippingService.createCourierReturnRequest(orderId, reason);
  }

  // =========================================================================
  // MANIFEST & PUBLIC TRACKING
  // =========================================================================

  @Get('manifest/:provider')
  @UseGuards(JwtAuthGuard)
  async getManifest(@Param('provider') provider: CourierProvider) {
    return this.shippingService.generateHandoverManifest(provider);
  }

  /**
   * Public tracking lookup (No JWT required)
   */
  @Get('tracking/:code')
  async getTracking(@Param('code') code: string) {
    return this.shippingService.getPublicTracking(code);
  }

  // =========================================================================
  // WEBHOOK LOGS & INWARD WEBHOOK RECEIVER
  // =========================================================================

  @Get('webhooks/logs')
  @UseGuards(JwtAuthGuard)
  async getWebhookLogs(
    @Query('provider') provider?: string,
    @Query('limit') limit?: string,
  ) {
    return this.shippingService.listWebhookLogs(provider, limit ? Number(limit) : 30);
  }

  /**
   * Inward courier webhook receiver (Steadfast / Pathao / RedX)
   * Verifies X-Signature (HMAC-SHA256) / Bearer token + Idempotency-Key
   */
  @Post('webhooks/:provider')
  @HttpCode(200)
  async handleWebhook(
    @Param('provider') provider: string,
    @Body() body: any,
    @Req() req: any,
    @Headers() headers: Record<string, string | string[] | undefined>,
  ) {
    return this.shippingService.processCourierWebhook(provider, body, req?.rawBody, headers);
  }
}
