import { fetchApi } from './client';

export const returnsApi = {
  /**
   * List all returned orders / RTO queue
   */
  getReturns: (merchantId?: string) => {
    return fetchApi('/returns', { params: { merchantId } });
  },

  /**
   * Get return audit statistics (restocked vs quarantine rates)
   */
  getStats: (merchantId?: string) => {
    return fetchApi('/returns/stats', { params: { merchantId } });
  },

  /**
   * Warehouse dock return parcel intake
   */
  intake: (data: { trackingOrConsignment: string; courierProvider?: string }) => {
    return fetchApi('/returns/intake', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  /**
   * Reverse logistics QC inspection: Restock vs Quarantine Damaged
   */
  qcInspect: (data: {
    orderId: string;
    variantId: string;
    quantity: number;
    isUndamaged: boolean;
    reasonNotes?: string;
  }) => {
    return fetchApi('/returns/qc-inspect', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },
};
