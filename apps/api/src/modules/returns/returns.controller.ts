import { Controller, Post, Get, Body, UseGuards, Query, Request } from '@nestjs/common';
import { ReturnsService } from './returns.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('returns')
@UseGuards(JwtAuthGuard)
export class ReturnsController {
  constructor(private readonly returnsService: ReturnsService) {}

  /**
   * List all returned orders / RTO records
   */
  @Get()
  async listReturns(@Query('merchantId') merchantId?: string, @Request() req?: any) {
    const effectiveMerchantId = req?.user?.role === 'SUPER_ADMIN' ? merchantId : (req?.user?.merchantId || merchantId);
    return this.returnsService.listReturns(effectiveMerchantId);
  }

  /**
   * Get KPI statistics for returns and reverse logistics
   */
  @Get('stats')
  async getReturnStats(@Query('merchantId') merchantId?: string, @Request() req?: any) {
    const effectiveMerchantId = req?.user?.role === 'SUPER_ADMIN' ? merchantId : (req?.user?.merchantId || merchantId);
    return this.returnsService.getReturnStats(effectiveMerchantId);
  }

  /**
   * Quick RTO intake (all items undamaged or damaged)
   */
  @Post('intake')
  async intakeReturn(
    @Body('orderId') orderId: string,
    @Body('isUndamaged') isUndamaged: boolean,
    @Body('reasonNotes') reasonNotes?: string,
  ) {
    return this.returnsService.processInboundRTO(orderId, isUndamaged, reasonNotes);
  }

  /**
   * Detailed item-by-item QC inspection
   */
  @Post('qc-inspect')
  async qcInspect(
    @Body('orderId') orderId: string,
    @Body('decisions')
    decisions: Array<{
      variantId: string;
      restockGoodQty: number;
      quarantineDamageQty: number;
      notes?: string;
    }>,
  ) {
    return this.returnsService.processDetailedQc(orderId, decisions);
  }
}
