import { Controller, Post, Get, Param, Body, UseGuards } from '@nestjs/common';
import { ShippingService } from './shipping.service';
import { CourierProvider } from '@fulfillio/contracts';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('shipping')
@UseGuards(JwtAuthGuard)
export class ShippingController {
  constructor(private readonly shippingService: ShippingService) {}

  @Post('book')
  async book(@Body('orderId') orderId: string, @Body('provider') provider: CourierProvider) {
    return this.shippingService.bookConsignment(orderId, provider);
  }

  @Get('manifest/:provider')
  async getManifest(@Param('provider') provider: CourierProvider) {
    return this.shippingService.generateHandoverManifest(provider);
  }
}
