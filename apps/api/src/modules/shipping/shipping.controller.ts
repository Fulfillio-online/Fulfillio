import { Controller, Post, Get, Param, Body, UseGuards } from '@nestjs/common';
import { ShippingService } from './shipping.service';
import { CourierProvider } from '@fulfillio/contracts';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('shipping')
export class ShippingController {
  constructor(private readonly shippingService: ShippingService) {}

  @Post('book')
  @UseGuards(JwtAuthGuard)
  async book(@Body('orderId') orderId: string, @Body('provider') provider: CourierProvider) {
    return this.shippingService.bookConsignment(orderId, provider);
  }

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

  /**
   * Inward courier webhook receiver (Steadfast / Pathao / RedX / Simulator)
   */
  @Post('webhooks/:provider')
  async handleWebhook(@Param('provider') provider: string, @Body() body: any) {
    return this.shippingService.processCourierWebhook(provider, body);
  }
}
