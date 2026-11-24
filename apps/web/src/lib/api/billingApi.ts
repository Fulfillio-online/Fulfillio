import {
  AdminFinanceAnalyticsDto,
  AdminOperationsDashboardDto,
  CompanyFinanceEntryDto,
  EarningsChartPeriod,
  FinanceEntryCategory,
  FinanceEntryType,
  FinanceTimeframePreset,
  MerchantEarningsDashboardDto,
  OrderEarningDto,
  PayoutRequestDto,
} from '@fulfillio/contracts';
import { getActiveMerchantSession } from '@/lib/warehouseSync';
import { fetchApi } from './client';

function getMerchantHeaders(merchantCode?: string): Record<string, string> {
  if (typeof window === 'undefined') {
    return merchantCode ? { 'x-merchant-code': merchantCode } : {};
  }
  const resolved = merchantCode || getActiveMerchantSession()?.merchantCode;
  return resolved ? { 'x-merchant-code': resolved } : {};
}

export const billingApi = {
  /**
   * Merchant: Get complete dynamic earnings & payouts dashboard
   */
  getMerchantEarnings: (
    merchantCode?: string,
    period: EarningsChartPeriod = 'THIS_MONTH',
  ): Promise<MerchantEarningsDashboardDto> => {
    const resolved =
      merchantCode ||
      (typeof window !== 'undefined' ? getActiveMerchantSession()?.merchantCode : undefined);
    return fetchApi<MerchantEarningsDashboardDto>('/billing/earnings', {
      params: { merchantCode: resolved, period },
      headers: getMerchantHeaders(resolved),
    });
  },

  /**
   * Merchant: Claim READY_TO_CLAIM earnings into wallet balance
   */
  claimEarnings: (payload: {
    merchantCode?: string;
    earningIds?: string[];
    claimAll?: boolean;
  }) => {
    const resolved =
      payload.merchantCode ||
      (typeof window !== 'undefined' ? getActiveMerchantSession()?.merchantCode : undefined);
    return fetchApi('/billing/earnings/claim', {
      method: 'POST',
      headers: getMerchantHeaders(resolved),
      body: JSON.stringify({
        merchantCode: resolved,
        earningIds: payload.earningIds,
        claimAll: payload.claimAll,
      }),
    });
  },

  /**
   * Merchant: Submit a payout / withdrawal request
   */
  createPayoutRequest: (payload: {
    merchantCode?: string;
    amount: number;
    method: string;
    provider: string;
    accountNumber: string;
    accountHolder?: string;
    branchName?: string;
    routingNumber?: string;
    remarks?: string;
  }): Promise<PayoutRequestDto> => {
    const resolved =
      payload.merchantCode ||
      (typeof window !== 'undefined' ? getActiveMerchantSession()?.merchantCode : undefined);
    return fetchApi<PayoutRequestDto>('/billing/payout-requests', {
      method: 'POST',
      headers: getMerchantHeaders(resolved),
      body: JSON.stringify({
        ...payload,
        merchantCode: resolved,
      }),
    });
  },

  /**
   * Merchant: Cancel a PENDING payout request
   */
  cancelPayoutRequest: (id: string, merchantCode?: string): Promise<PayoutRequestDto> => {
    const resolved =
      merchantCode ||
      (typeof window !== 'undefined' ? getActiveMerchantSession()?.merchantCode : undefined);
    return fetchApi<PayoutRequestDto>(
      `/billing/payout-requests/${encodeURIComponent(id)}/cancel`,
      {
        method: 'POST',
        headers: getMerchantHeaders(resolved),
        body: JSON.stringify({ merchantCode: resolved }),
      },
    );
  },

  /**
   * Admin/Merchant: List payout requests with optional filters
   */
  getPayoutRequests: (params?: {
    merchantId?: string;
    merchantCode?: string;
    status?: string;
    method?: string;
    search?: string;
  }): Promise<{
    items: PayoutRequestDto[];
    stats: {
      totalRequests: number;
      pendingRequests: number;
      acceptedRequests: number;
      paidRequests: number;
      rejectedRequests: number;
      cancelledRequests: number;
      totalPendingAmount: number;
      totalPaidAmount: number;
    };
  }> => {
    return fetchApi('/billing/payout-requests', { params });
  },

  /**
   * Admin: Accept payout request
   */
  acceptPayoutRequest: (id: string): Promise<PayoutRequestDto> => {
    return fetchApi<PayoutRequestDto>(
      `/billing/payout-requests/${encodeURIComponent(id)}/accept`,
      { method: 'PATCH' },
    );
  },

  /**
   * Admin: Reject payout request
   */
  rejectPayoutRequest: (id: string, rejectionReason?: string): Promise<PayoutRequestDto> => {
    return fetchApi<PayoutRequestDto>(
      `/billing/payout-requests/${encodeURIComponent(id)}/reject`,
      {
        method: 'PATCH',
        body: JSON.stringify({ rejectionReason }),
      },
    );
  },

  /**
   * Admin: Bulk accept or reject payout requests
   */
  bulkUpdatePayoutRequests: (
    ids: string[],
    action: 'ACCEPT' | 'REJECT',
    rejectionReason?: string,
  ) => {
    return fetchApi('/billing/payout-requests/bulk-status', {
      method: 'POST',
      body: JSON.stringify({ ids, action, rejectionReason }),
    });
  },

  /**
   * Admin: Complete payout request with MANDATORY TrxID + Digital Proof receipt
   */
  payPayoutRequest: (
    id: string,
    payload: {
      trxId: string;
      proofDocumentUrl: string;
      proofDocumentName?: string;
      proofDocumentMime?: string;
      proofChannel?: string;
      proofNotes?: string;
      paidByAdminName?: string;
    },
  ): Promise<{ payoutRequest: PayoutRequestDto; settlement: any }> => {
    return fetchApi(`/billing/payout-requests/${encodeURIComponent(id)}/pay`, {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  /**
   * Admin: List all order earnings across merchants (including return-window hold status)
   */
  getAdminOrderEarnings: (params?: {
    merchantId?: string;
    merchantCode?: string;
    status?: string;
    search?: string;
  }): Promise<OrderEarningDto[]> => {
    return fetchApi<OrderEarningDto[]>('/billing/admin/earnings', { params });
  },

  /**
   * Admin: Release a PENDING earning early to READY_TO_CLAIM
   */
  releaseOrderEarning: (id: string): Promise<OrderEarningDto> => {
    return fetchApi<OrderEarningDto>(
      `/billing/earnings/${encodeURIComponent(id)}/release`,
      { method: 'POST' },
    );
  },

  /**
   * Admin: Update merchant return window days & min payout amount
   */
  updateMerchantBillingSettings: (
    merchantId: string,
    payload: { returnWindowDays?: number; minPayoutAmount?: number },
  ) => {
    return fetchApi(`/billing/merchants/${encodeURIComponent(merchantId)}/settings`, {
      method: 'PATCH',
      body: JSON.stringify(payload),
    });
  },

  /**
   * List merchant COD settlements / disbursement ledger
   */
  getSettlements: (merchantId?: string, merchantCode?: string) => {
    return fetchApi('/billing/settlements', { params: { merchantId, merchantCode } });
  },

  /**
   * Get 3PL billing overview and financial summaries
   */
  getOverview: (merchantId?: string, merchantCode?: string) => {
    return fetchApi('/billing/overview', { params: { merchantId, merchantCode } });
  },

  /**
   * Admin: Generate a billing cycle settlement
   */
  generateCycle: (data: {
    merchantId: string;
    grossCod?: number;
    ordersCount?: number;
  }) => {
    return fetchApi('/billing/generate-cycle', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  /**
   * Admin: Record an on-demand, partial or installment disbursement
   */
  disburse: (data: {
    merchantId: string;
    amount: number;
    paymentMethod?: string;
    paidAt?: string;
    notes?: string;
    trxId?: string;
    proofDocumentUrl?: string;
    proofDocumentName?: string;
    proofDocumentMime?: string;
  }) => {
    return fetchApi('/billing/disburse', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  /**
   * Admin: Mark settlement as paid
   */
  markPaid: (settlementId: string) => {
    return fetchApi(`/billing/${settlementId}/mark-paid`, {
      method: 'POST',
    });
  },

  /**
   * Admin: Overall Finance, COD Settlement, 3PL P&L, and Order Volume Analytics
   */
  getAdminFinanceAnalytics: (params?: {
    preset?: FinanceTimeframePreset;
    startDate?: string;
    endDate?: string;
    merchantId?: string;
    merchantCode?: string;
  }): Promise<AdminFinanceAnalyticsDto> => {
    return fetchApi<AdminFinanceAnalyticsDto>('/billing/admin/finance-analytics', {
      params,
    });
  },

  /**
   * Admin: Create Company Finance Ledger Entry (Expense or Manual Income)
   */
  createFinanceEntry: (payload: {
    type: FinanceEntryType | string;
    category: FinanceEntryCategory | string;
    title: string;
    amount: number;
    entryDate?: string;
    merchantId?: string;
    paymentMethod?: string;
    referenceNo?: string;
    notes?: string;
  }): Promise<CompanyFinanceEntryDto> => {
    return fetchApi<CompanyFinanceEntryDto>('/billing/admin/finance-entries', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  /**
   * Admin: Update Company Finance Ledger Entry
   */
  updateFinanceEntry: (
    id: string,
    payload: {
      type?: FinanceEntryType | string;
      category?: FinanceEntryCategory | string;
      title?: string;
      amount?: number;
      entryDate?: string;
      merchantId?: string | null;
      paymentMethod?: string | null;
      referenceNo?: string | null;
      notes?: string | null;
    },
  ): Promise<CompanyFinanceEntryDto> => {
    return fetchApi<CompanyFinanceEntryDto>(
      `/billing/admin/finance-entries/${encodeURIComponent(id)}`,
      {
        method: 'PATCH',
        body: JSON.stringify(payload),
      },
    );
  },

  /**
   * Admin: Delete Company Finance Ledger Entry
   */
  deleteFinanceEntry: (id: string): Promise<{ deleted: boolean; id: string }> => {
    return fetchApi<{ deleted: boolean; id: string }>(
      `/billing/admin/finance-entries/${encodeURIComponent(id)}`,
      {
        method: 'DELETE',
      },
    );
  },

  /**
   * Admin: Live Operations Dashboard payload
   */
  getAdminOperationsDashboard: (): Promise<AdminOperationsDashboardDto> => {
    return fetchApi<AdminOperationsDashboardDto>('/billing/admin/operations-dashboard');
  },
};
