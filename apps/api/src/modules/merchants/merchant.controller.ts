import { Controller, Post, Get, Patch, Body, UseGuards, Request } from '@nestjs/common';
import { MerchantService } from './merchant.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('merchants')
@UseGuards(JwtAuthGuard)
export class MerchantController {
  constructor(private readonly merchantService: MerchantService) {}

  @Get('profile')
  async getProfile(@Request() req: any) {
    return this.merchantService.getProfile(req.user.merchantId);
  }

  @Patch('profile')
  async updateProfile(@Request() req: any, @Body() body: any) {
    return this.merchantService.updateProfile(req.user.merchantId, body);
  }

  @Post('webhooks')
  async configureWebhook(@Request() req: any, @Body('webhookUrl') webhookUrl: string) {
    return this.merchantService.configureWebhook(req.user.merchantId, webhookUrl);
  }

  @Get('dashboard')
  async getDashboard(@Request() req: any) {
    return this.merchantService.getDashboardStats(req.user.merchantId);
  }
}
