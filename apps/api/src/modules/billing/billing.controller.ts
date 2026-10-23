import { Controller, Post, Get, Body, UseGuards, Request } from '@nestjs/common';
import { BillingService } from './billing.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('billing')
@UseGuards(JwtAuthGuard)
export class BillingController {
  constructor(private readonly billingService: BillingService) {}

  @Get('settlements')
  async getSettlements(@Request() req: any) {
    return this.billingService.getSettlementHistory(req.user.merchantId);
  }
}
