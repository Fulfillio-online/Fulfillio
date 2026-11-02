import { Controller, Post, Get, Patch, Param, Body, UseGuards, Request } from '@nestjs/common';
import { MerchantService } from './merchant.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { UserRole } from '@fulfillio/contracts';

@Controller('merchants')
@UseGuards(JwtAuthGuard, RolesGuard)
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

  @Patch(':id/status-and-rates')
  @Roles(UserRole.SUPER_ADMIN)
  async updateStatusAndRates(
    @Param('id') merchantId: string,
    @Body()
    body: {
      status?: 'PENDING' | 'APPROVED' | 'SUSPENDED';
      baseHandlingFee?: number;
      monthlyStorageFee?: number;
    },
  ) {
    return this.merchantService.updateMerchantStatusAndRates(merchantId, body);
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
