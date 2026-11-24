import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  Request,
} from '@nestjs/common';
import { EarningsChartPeriod } from '@fulfillio/contracts';
import { BillingService } from './billing.service';

@Controller('billing')
export class BillingController {
  constructor(private readonly billingService: BillingService) {}

  private resolveMerchantIdentifier(
    req: any,
    body?: any,
    queryId?: string,
    queryCode?: string,
  ): string | undefined {
    if (req?.user?.merchantId) {
      return String(req.user.merchantId);
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
        // Ignore malformed token and fall back to explicit header/query identifiers
      }
    }

    const headerCode = req?.headers?.['x-merchant-code'];
    const resolvedHeaderCode = Array.isArray(headerCode) ? headerCode[0] : headerCode;

    return (
      decodedMerchantId ||
      body?.merchantId ||
      body?.merchantCode ||
      queryId ||
      queryCode ||
      resolvedHeaderCode ||
      decodedMerchantCode ||
      undefined
    );
  }

  private resolveAdminContext(req: any): { adminId?: string; adminName?: string } {
    if (req?.user) {
      return {
        adminId: req.user.id || req.user.sub,
        adminName: req.user.name || req.user.email || 'Super Admin',
      };
    }

    const authHeader = req?.headers?.authorization;
    if (typeof authHeader === 'string' && authHeader.startsWith('Bearer ')) {
      try {
        const parts = authHeader.slice(7).trim().split('.');
        if (parts.length === 3) {
          const payload = JSON.parse(Buffer.from(parts[1], 'base64url').toString('utf8'));
          return {
            adminId: payload?.sub || payload?.id,
            adminName: payload?.name || payload?.email || 'Super Admin',
          };
        }
      } catch {}
    }

    return { adminName: 'Super Admin' };
  }

  /**
   * Merchant Earnings & Payouts dynamic dashboard
   */
  @Get('earnings')
  async getMerchantEarnings(
    @Request() req: any,
    @Query('merchantId') merchantId?: string,
    @Query('merchantCode') merchantCode?: string,
    @Query('period') period?: EarningsChartPeriod,
  ) {
    const effectiveMerchant =
      this.resolveMerchantIdentifier(req, undefined, merchantId, merchantCode) || 'MC-101';
    return this.billingService.getMerchantEarningsDashboard(
      effectiveMerchant,
      period || 'THIS_MONTH',
    );
  }

  /**
   * Merchant claims READY_TO_CLAIM earnings into wallet balance
   */
  @Post('earnings/claim')
  async claimEarnings(
    @Request() req: any,
    @Query('merchantCode') merchantCode: string | undefined,
    @Body() body: { merchantId?: string; merchantCode?: string; earningIds?: string[]; claimAll?: boolean },
  ) {
    const effectiveMerchant =
      this.resolveMerchantIdentifier(req, body, undefined, merchantCode) || 'MC-101';
    return this.billingService.claimEarnings(effectiveMerchant, body || {});
  }

  /**
   * Admin: Release a PENDING order earning early to READY_TO_CLAIM
   */
  @Post('earnings/:id/release')
  async releaseOrderEarning(@Request() req: any, @Param('id') id: string) {
    const { adminId } = this.resolveAdminContext(req);
    return this.billingService.releaseOrderEarningEarly(id, adminId);
  }

  /**
   * Admin: List all order earnings across merchants with status/search filters
   */
  @Get('admin/earnings')
  async listAdminOrderEarnings(
    @Query('merchantId') merchantId?: string,
    @Query('merchantCode') merchantCode?: string,
    @Query('status') status?: string,
    @Query('search') search?: string,
  ) {
    return this.billingService.listAdminOrderEarnings({
      merchantId,
      merchantCode,
      status,
      search,
    });
  }

  /**
   * Admin: Update merchant return window days & minimum payout amount
   */
  @Patch('merchants/:merchantId/settings')
  async updateMerchantBillingSettings(
    @Param('merchantId') merchantId: string,
    @Body() body: { returnWindowDays?: number; minPayoutAmount?: number },
  ) {
    return this.billingService.updateMerchantBillingSettings(merchantId, body || {});
  }

  /**
   * List payout requests (Admin all or Merchant-scoped)
   */
  @Get('payout-requests')
  async listPayoutRequests(
    @Query('merchantId') merchantId?: string,
    @Query('merchantCode') merchantCode?: string,
    @Query('status') status?: string,
    @Query('method') method?: string,
    @Query('search') search?: string,
  ) {
    return this.billingService.listPayoutRequests({
      merchantId,
      merchantCode,
      status,
      method,
      search,
    });
  }

  /**
   * Merchant submits a withdrawal / payout request
   */
  @Post('payout-requests')
  async createPayoutRequest(
    @Request() req: any,
    @Query('merchantCode') merchantCode: string | undefined,
    @Body()
    body: {
      merchantId?: string;
      merchantCode?: string;
      amount: number;
      method: string;
      provider: string;
      accountNumber: string;
      accountHolder?: string;
      branchName?: string;
      routingNumber?: string;
      remarks?: string;
    },
  ) {
    const effectiveMerchant =
      this.resolveMerchantIdentifier(req, body, undefined, merchantCode) || 'MC-101';
    return this.billingService.createPayoutRequest(effectiveMerchant, body);
  }

  /**
   * Merchant cancels own PENDING payout request
   */
  @Post('payout-requests/:id/cancel')
  async cancelPayoutRequest(
    @Request() req: any,
    @Param('id') id: string,
    @Query('merchantCode') merchantCode?: string,
    @Body() body?: { merchantId?: string; merchantCode?: string },
  ) {
    const effectiveMerchant =
      this.resolveMerchantIdentifier(req, body, undefined, merchantCode) || 'MC-101';
    return this.billingService.cancelPayoutRequest(id, effectiveMerchant);
  }

  /**
   * Admin: Accept payout request
   */
  @Patch('payout-requests/:id/accept')
  async acceptPayoutRequest(@Request() req: any, @Param('id') id: string) {
    const { adminId } = this.resolveAdminContext(req);
    return this.billingService.acceptPayoutRequest(id, adminId);
  }

  /**
   * Admin: Reject payout request with optional reason (restores wallet balance)
   */
  @Patch('payout-requests/:id/reject')
  async rejectPayoutRequest(
    @Request() req: any,
    @Param('id') id: string,
    @Body() body?: { rejectionReason?: string },
  ) {
    const { adminId } = this.resolveAdminContext(req);
    return this.billingService.rejectPayoutRequest(id, body?.rejectionReason, adminId);
  }

  /**
   * Admin: Bulk accept or reject payout requests
   */
  @Post('payout-requests/bulk-status')
  async bulkUpdatePayoutRequests(
    @Request() req: any,
    @Body()
    body: {
      ids: string[];
      action: 'ACCEPT' | 'REJECT';
      rejectionReason?: string;
    },
  ) {
    const { adminId } = this.resolveAdminContext(req);
    return this.billingService.bulkUpdatePayoutRequests(
      body?.ids || [],
      body?.action,
      body?.rejectionReason,
      adminId,
    );
  }

  /**
   * Admin: Settle payout request with MANDATORY TrxID + Digital Proof receipt upload
   */
  @Post('payout-requests/:id/pay')
  async completePayoutRequest(
    @Request() req: any,
    @Param('id') id: string,
    @Body()
    body: {
      trxId: string;
      proofDocumentUrl: string;
      proofDocumentName?: string;
      proofDocumentMime?: string;
      proofChannel?: string;
      proofNotes?: string;
      paidByAdminName?: string;
    },
  ) {
    const { adminId, adminName } = this.resolveAdminContext(req);
    return this.billingService.completePayoutRequest(id, {
      ...body,
      paidByAdminId: adminId,
      paidByAdminName: body?.paidByAdminName || adminName,
    });
  }

  /**
   * Get billing settlements history / disbursement ledger (with digital proof metadata)
   */
  @Get('settlements')
  async getSettlements(
    @Request() req: any,
    @Query('merchantId') merchantId?: string,
    @Query('merchantCode') merchantCode?: string,
  ) {
    const effective = merchantId || merchantCode || (req?.user?.role !== 'SUPER_ADMIN' ? req?.user?.merchantId : undefined);
    return this.billingService.getSettlementHistory(effective);
  }

  /**
   * Get billing KPIs and dynamic COD/earnings aggregate summary
   */
  @Get('overview')
  async getOverview(
    @Request() req: any,
    @Query('merchantId') merchantId?: string,
    @Query('merchantCode') merchantCode?: string,
  ) {
    const effective = merchantId || merchantCode || (req?.user?.role !== 'SUPER_ADMIN' ? req?.user?.merchantId : undefined);
    return this.billingService.getBillingOverview(effective);
  }

  /**
   * Generate a periodic settlement cycle for a merchant
   */
  @Post('generate-cycle')
  async generateCycle(
    @Body('merchantId') merchantId: string,
    @Body('grossCod') grossCod?: number,
    @Body('ordersCount') ordersCount?: number,
  ) {
    return this.billingService.calculateMerchantSettlement(merchantId, grossCod, ordersCount);
  }

  /**
   * Record an on-demand / partial / installment disbursement
   */
  @Post('disburse')
  async disburse(
    @Body()
    body: {
      merchantId: string;
      amount: number;
      paymentMethod?: string;
      paidAt?: string;
      notes?: string;
      trxId?: string;
      proofDocumentUrl?: string;
      proofDocumentName?: string;
      proofDocumentMime?: string;
    },
  ) {
    return this.billingService.recordDisbursement({
      merchantId: body.merchantId,
      amount: body.amount,
      paymentMethod: body.paymentMethod,
      paidAt: body.paidAt ? new Date(body.paidAt) : new Date(),
      notes: body.notes,
      trxId: body.trxId,
      proofDocumentUrl: body.proofDocumentUrl,
      proofDocumentName: body.proofDocumentName,
      proofDocumentMime: body.proofDocumentMime,
    });
  }

  /**
   * Admin: Overall Finance, COD Settlement, 3PL P&L, and Order Volume Analytics
   */
  @Get('admin/finance-analytics')
  async getAdminFinanceAnalytics(
    @Query('preset') preset?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('merchantId') merchantId?: string,
    @Query('merchantCode') merchantCode?: string,
  ) {
    return this.billingService.getAdminFinanceAnalytics({
      preset,
      startDate,
      endDate,
      merchantIdentifier: merchantId || merchantCode || 'ALL',
    });
  }

  /**
   * Admin: Create a Company Finance Entry (Operating Expense or Manual Income)
   */
  @Post('admin/finance-entries')
  async createFinanceEntry(
    @Request() req: any,
    @Body()
    body: {
      type: string;
      category: string;
      title: string;
      amount: number;
      entryDate?: string;
      merchantId?: string;
      paymentMethod?: string;
      referenceNo?: string;
      notes?: string;
    },
  ) {
    const adminCtx = this.resolveAdminContext(req);
    return this.billingService.createCompanyFinanceEntry(body, adminCtx);
  }

  /**
   * Admin: Update a Company Finance Entry
   */
  @Patch('admin/finance-entries/:id')
  async updateFinanceEntry(
    @Param('id') id: string,
    @Body()
    body: {
      type?: string;
      category?: string;
      title?: string;
      amount?: number;
      entryDate?: string;
      merchantId?: string | null;
      paymentMethod?: string | null;
      referenceNo?: string | null;
      notes?: string | null;
    },
  ) {
    return this.billingService.updateCompanyFinanceEntry(id, body || {});
  }

  /**
   * Admin: Delete a Company Finance Entry
   */
  @Delete('admin/finance-entries/:id')
  async deleteFinanceEntry(@Param('id') id: string) {
    return this.billingService.deleteCompanyFinanceEntry(id);
  }

  /**
   * Admin: Real-time Warehouse Operations Dashboard
   */
  @Get('admin/operations-dashboard')
  async getAdminOperationsDashboard() {
    return this.billingService.getAdminOperationsDashboard();
  }

  /**
   * Mark a settlement cycle as paid
   */
  @Post(':id/mark-paid')
  async markPaid(@Param('id') settlementId: string) {
    return this.billingService.markSettlementPaid(settlementId);
  }
}
