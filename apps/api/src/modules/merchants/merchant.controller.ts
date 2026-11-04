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
import { MerchantService } from './merchant.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { UserRole, MerchantStatus } from '@fulfillio/contracts';

@Controller('merchants')
@UseGuards(JwtAuthGuard, RolesGuard)
export class MerchantController {
  constructor(private readonly merchantService: MerchantService) {}

  /**
   * Super Admin: List all registered merchants with stats
   */
  @Get()
  @Roles(UserRole.SUPER_ADMIN, UserRole.WAREHOUSE_OPERATOR)
  async listMerchants(
    @Query('status') status?: MerchantStatus,
    @Query('search') search?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.merchantService.listMerchants({
      status,
      search,
      page: page ? parseInt(page, 10) : 1,
      limit: limit ? parseInt(limit, 10) : 20,
    });
  }

  /**
   * Super Admin: Get single merchant full details
   */
  @Get('detail/:id')
  @Roles(UserRole.SUPER_ADMIN, UserRole.WAREHOUSE_OPERATOR)
  async getMerchantDetail(@Param('id') id: string) {
    return this.merchantService.getMerchantDetail(id);
  }

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
      status?: MerchantStatus;
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
