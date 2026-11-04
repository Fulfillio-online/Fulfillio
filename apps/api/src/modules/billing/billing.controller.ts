import { Controller, Post, Get, Param, Body, UseGuards, Request, Query } from '@nestjs/common';
import { BillingService } from './billing.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { UserRole } from '@fulfillio/contracts';

@Controller('billing')
@UseGuards(JwtAuthGuard, RolesGuard)
export class BillingController {
  constructor(private readonly billingService: BillingService) {}

  /**
   * Get billing settlements history
   */
  @Get('settlements')
  async getSettlements(@Request() req: any, @Query('merchantId') merchantId?: string) {
    const effectiveMerchantId = req.user.role === UserRole.SUPER_ADMIN ? merchantId : req.user.merchantId;
    return this.billingService.getSettlementHistory(effectiveMerchantId);
  }

  /**
   * Get billing KPIs and COD aggregate summary
   */
  @Get('overview')
  async getOverview(@Request() req: any, @Query('merchantId') merchantId?: string) {
    const effectiveMerchantId = req.user.role === UserRole.SUPER_ADMIN ? merchantId : req.user.merchantId;
    return this.billingService.getBillingOverview(effectiveMerchantId);
  }

  /**
   * Generate a periodic settlement cycle for a merchant
   */
  @Post('generate-cycle')
  @Roles(UserRole.SUPER_ADMIN)
  async generateCycle(
    @Body('merchantId') merchantId: string,
    @Body('grossCod') grossCod?: number,
    @Body('ordersCount') ordersCount?: number,
  ) {
    return this.billingService.calculateMerchantSettlement(merchantId, grossCod, ordersCount);
  }

  /**
   * Mark a settlement cycle as paid (e.g. bKash / Bank transfer complete)
   */
  @Post(':id/mark-paid')
  @Roles(UserRole.SUPER_ADMIN)
  async markPaid(@Param('id') settlementId: string) {
    return this.billingService.markSettlementPaid(settlementId);
  }
}
