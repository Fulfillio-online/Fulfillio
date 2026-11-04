import { fetchApi } from './client';

export const shippingApi = {
  /**
   * Public tracking by tracking code or consignment ID
   */
  trackShipment: (code: string) => {
    return fetchApi(`/shipping/tracking/${code}`);
  },

  /**
   * Dispatch an order via courier API adapter
   */
  dispatchOrder: (data: {
    orderId: string;
    courier: string;
    weightKg?: number;
  }) => {
    return fetchApi('/shipping/dispatch', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  /**
   * Get courier delivery performance metrics
   */
  getPerformance: () => {
    return fetchApi('/shipping/performance');
  },
};
