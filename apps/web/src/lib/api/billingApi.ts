import { fetchApi } from './client';

export const billingApi = {
  /**
   * List merchant COD settlements / disbursement ledger
   */
  getSettlements: (merchantId?: string) => {
    return fetchApi('/billing/settlements', { params: { merchantId } });
  },

  /**
   * Get 3PL billing overview and financial summaries
   */
  getOverview: (merchantId?: string) => {
    return fetchApi('/billing/overview', { params: { merchantId } });
  },

  /**
   * Admin: Generate a billing cycle settlement
   */
  generateCycle: (data: {
    merchantId: string;
    cycleStart: string;
    cycleEnd: string;
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
};
