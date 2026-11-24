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
   * Approve or Reject merchant payout account details from Admin console
   */
  @Patch(':id/payout-status')
  async updatePayoutStatus(
    @Param('id') merchantId: string,
    @Body()
    body: {
      status: 'VERIFIED' | 'REJECTED' | 'PENDING_REVIEW';
      rejectionReason?: string;
    },
  ) {
    return this.merchantService.updatePayoutStatus(merchantId, body);
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

  private resolveMerchantIdentifier(req: any, body?: any, queryCode?: string): string {
    if (req.user?.merchantId) {
      return req.user.merchantId;
    }

    let decodedMerchantId: string | undefined;
    let decodedMerchantCode: string | undefined;
    const authHeader = req?.headers?.authorization;
    if (typeof authHeader === 'string' && authHeader.startsWith('Bearer ')) {
      try {
        const token = authHeader.slice(7).trim();
        const parts = token.split('.');
        if (parts.length === 3) {
          const decodedJson = Buffer.from(parts[1], 'base64url').toString('utf8');
          const payload = JSON.parse(decodedJson);
          if (payload?.merchantId) decodedMerchantId = String(payload.merchantId);
          if (payload?.merchantCode) decodedMerchantCode = String(payload.merchantCode);
        }
      } catch {
        // Ignore invalid/malformed bearer token and fall back to explicit identifier
      }
    }

    const headerCode = req?.headers?.['x-merchant-code'];
    const explicitIdentifier =
      body?.merchantId ||
      body?.merchantCode ||
      queryCode ||
      (Array.isArray(headerCode) ? headerCode[0] : headerCode);

    return decodedMerchantId || explicitIdentifier || decodedMerchantCode || 'MC-101';
  }

  @Get('profile')
  async getProfile(
    @Request() req: any,
    @Query('merchantCode') merchantCode?: string,
  ) {
    return this.merchantService.getProfile(
      this.resolveMerchantIdentifier(req, undefined, merchantCode),
    );
  }

  @Patch('profile')
  async updateProfile(
    @Request() req: any,
    @Query('merchantCode') merchantCode: string | undefined,
    @Body() body: any,
  ) {
    return this.merchantService.updateProfile(
      this.resolveMerchantIdentifier(req, body, merchantCode),
      body,
    );
  }

  @Post('profile/upload')
  async uploadDocument(
    @Request() req: any,
    @Query('merchantCode') merchantCode: string | undefined,
    @Body()
    body: {
      fileName: string;
      fileType?: string;
      base64Data?: string;
      merchantId?: string;
      merchantCode?: string;
    },
  ) {
    return this.merchantService.saveUploadedDocument(
      this.resolveMerchantIdentifier(req, body, merchantCode),
      body,
    );
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
