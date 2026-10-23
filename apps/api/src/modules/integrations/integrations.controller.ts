import { Controller, Post, Body, UseGuards, Request } from '@nestjs/common';
import { IntegrationsService } from './integrations.service';
import { ApiKeyGuard } from '../auth/guards/api-key.guard';

@Controller('integrations')
@UseGuards(ApiKeyGuard)
export class IntegrationsController {
  constructor(private readonly integrationsService: IntegrationsService) {}

  @Post('woocommerce/products')
  async syncProduct(@Request() req: any, @Body() body: any) {
    return this.integrationsService.syncWooCommerceProduct(req.merchant.id, body);
  }

  @Post('woocommerce/orders')
  async receiveOrderWebhook(@Request() req: any, @Body() body: any) {
    return this.integrationsService.processWooCommerceOrder(req.merchant?.id, body);
  }
}
