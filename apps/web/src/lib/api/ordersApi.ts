import { fetchApi } from './client';
import { PackagingType } from '@fulfillio/contracts';

export interface OrderFilterParams {
  status?: string;
  search?: string;
  merchantId?: string;
  page?: number;
  limit?: number;
}

export const ordersApi = {
  /**
   * List orders with pagination, search, status filter
   */
  getOrders: (params?: OrderFilterParams) => {
    return fetchApi('/orders', { params: params as any });
  },

  /**
   * Get single order by ID
   */
  getOrderById: (id: string) => {
    return fetchApi(`/orders/${id}`);
  },

  /**
   * Update order status
   */
  updateStatus: (id: string, status: string) => {
    return fetchApi(`/orders/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    });
  },

  /**
   * Packing table barcode scan verification for an item
   */
  verifyOrderItem: (orderId: string, itemId: string, isVerified: boolean = true) => {
    return fetchApi(`/orders/${orderId}/items/${itemId}/verify`, {
      method: 'POST',
      body: JSON.stringify({ isVerified }),
    });
  },

  /**
   * Lock batch memo print & assign packaging cost
   */
  lockBatchMemoPrint: (orderIds: string[], packagingType?: PackagingType) => {
    return fetchApi('/orders/batch-print-lock', {
      method: 'POST',
      body: JSON.stringify({ orderIds, packagingType }),
    });
  },

  /**
   * Evaluate customer fraud ratio against BD delivery history
   */
  checkFraud: (phone: string) => {
    return fetchApi(`/orders/fraud-check/${phone}`);
  },

  /**
   * Warehouse wave pick list generation
   */
  generateWavePick: (orderIds?: string[]) => {
    return fetchApi('/orders/wave-pick', {
      method: 'POST',
      body: JSON.stringify({ orderIds }),
    });
  },

  /**
   * Cancel order
   */
  cancelOrder: (id: string) => {
    return fetchApi(`/orders/${id}/cancel`, {
      method: 'POST',
    });
  },
};
