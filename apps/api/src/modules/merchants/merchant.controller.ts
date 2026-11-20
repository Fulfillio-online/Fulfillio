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
export class MerchantController {
  constructor(private readonly merchantService: MerchantService) {}

  /**
   * Public directory of merchants (so admin and app can rehydrate after cache clear)
   */
  @Get('public-directory')
  async getPublicDirectory() {
    return this.merchantService.listMerchants({ limit: 100 });
  }

  /**
   * Update merchant status (Approve / Suspend) for Admin console
   */
  @Patch(':id/status')
  async updateStatus(
    @Param('id') merchantId: string,
    @Body('status') status: 'PENDING' | 'APPROVED' | 'SUSPENDED',
  ) {
    return this.merchantService.updateMerchantStatusAndRates(merchantId, { status });
  }

  /**
   * Super Admin: List all registered merchants with stats
   */
  @Get()
  @UseGuards(JwtAuthGuard, RolesGuard)
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
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.SUPER_ADMIN, UserRole.WAREHOUSE_OPERATOR)
  async getMerchantDetail(@Param('id') id: string) {
    return this.merchantService.getMerchantDetail(id);
  }

  @Get('profile')
  @UseGuards(JwtAuthGuard)
  async getProfile(@Request() req: any) {
    return this.merchantService.getProfile(req.user.merchantId);
  }

  @Patch('profile')
  @UseGuards(JwtAuthGuard)
  async updateProfile(@Request() req: any, @Body() body: any) {
    return this.merchantService.updateProfile(req.user.merchantId, body);
  }

  @Post('profile/upload')
  @UseGuards(JwtAuthGuard)
  async uploadDocument(
    @Request() req: any,
    @Body() body: { fileName: string; fileType?: string; base64Data?: string }
  ) {
    return this.merchantService.saveUploadedDocument(req.user.merchantId, body);
  }

  @Patch(':id/status-and-rates')
  @UseGuards(JwtAuthGuard, RolesGuard)
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
  @UseGuards(JwtAuthGuard)
  async configureWebhook(@Request() req: any, @Body('webhookUrl') webhookUrl: string) {
    return this.merchantService.configureWebhook(req.user.merchantId, webhookUrl);
  }

  @Get('dashboard')
  @UseGuards(JwtAuthGuard)
  async getDashboard(@Request() req: any) {
    return this.merchantService.getDashboardStats(req.user.merchantId);
  }
}
