import { Controller, Post, Get, Body, Query, Param, Request } from '@nestjs/common';
import { ReturnsService } from './returns.service';

@Controller('returns')
export class ReturnsController {
  constructor(private readonly returnsService: ReturnsService) {}

  /**
   * List all returned orders / RTO records
   */
  @Get()
  async listReturns(
    @Query('merchantId') merchantId?: string,
    @Query('merchantCode') merchantCode?: string,
    @Request() req?: any,
  ) {
    const effectiveMerchant =
      req?.user?.role === 'SUPER_ADMIN'
        ? merchantId || merchantCode
        : req?.user?.merchantId || merchantId || merchantCode;
    return this.returnsService.listReturns(effectiveMerchant);
  }

  /**
   * List all cancelled orders from Neon PostgreSQL with restock status
   */
  @Get('cancelled')
  async listCancelledOrders(
    @Query('merchantId') merchantId?: string,
    @Query('merchantCode') merchantCode?: string,
    @Request() req?: any,
  ) {
    const effectiveMerchant =
      req?.user?.role === 'SUPER_ADMIN'
        ? merchantId || merchantCode
        : req?.user?.merchantId || merchantId || merchantCode;
    return this.returnsService.listCancelledOrders(effectiveMerchant);
  }

  /**
   * Manually restock a cancelled order back to a selected warehouse bin
   */
  @Post('cancelled/:orderId/restock')
  async restockCancelledOrder(
    @Param('orderId') orderId: string,
    @Body('binCode') binCode?: string,
    @Body('notes') notes?: string,
  ) {
    return this.returnsService.restockCancelledOrder(orderId, binCode || 'A-01-01', notes);
  }

  /**
   * List stock recovery ledger entries (ORDER_CANCELLED, RETURN_RESTOCK, DAMAGED_QUARANTINE)
   */
  @Get('ledger')
  async listRecoveryLedger(
    @Query('merchantId') merchantId?: string,
    @Query('merchantCode') merchantCode?: string,
    @Request() req?: any,
  ) {
    const effectiveMerchant =
      req?.user?.role === 'SUPER_ADMIN'
        ? merchantId || merchantCode
        : req?.user?.merchantId || merchantId || merchantCode;
    return this.returnsService.listRecoveryLedger(effectiveMerchant);
  }

  /**
   * List available warehouse bin codes for restock dropdowns
   */
  @Get('bins')
  async listBins() {
    return this.returnsService.listWarehouseBins();
  }

  /**
   * Get KPI statistics for returns and reverse logistics
   */
  @Get('stats')
  async getReturnStats(
    @Query('merchantId') merchantId?: string,
    @Query('merchantCode') merchantCode?: string,
    @Request() req?: any,
  ) {
    const effectiveMerchant =
      req?.user?.role === 'SUPER_ADMIN'
        ? merchantId || merchantCode
        : req?.user?.merchantId || merchantId || merchantCode;
    return this.returnsService.getReturnStats(effectiveMerchant);
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
