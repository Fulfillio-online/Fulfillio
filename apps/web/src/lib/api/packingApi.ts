import { fetchApi } from './client';
import { PackagingType } from '@fulfillio/contracts';

export const packingApi = {
  /**
   * Get warehouse packing queue (orders picked and ready for packing)
   */
  getQueue: () => {
    return fetchApi('/packing/queue');
  },

  /**
   * Verify an order item barcode at the packing station
   */
  verifyItem: (orderId: string, barcode: string) => {
    return fetchApi('/packing/verify-item', {
      method: 'POST',
      body: JSON.stringify({ orderId, barcode }),
    });
  },

  /**
   * Complete packing and generate thermal print payload
   */
  batchPrint: (orderIds: string[], packagingType?: PackagingType) => {
    return fetchApi('/packing/batch-print', {
      method: 'POST',
      body: JSON.stringify({ orderIds, packagingType }),
    });
  },
};
