import { fetchApi } from './client';

export interface MerchantFilterParams {
  status?: string;
  search?: string;
  page?: number;
  limit?: number;
}

export const merchantsApi = {
  /**
   * Super Admin: List all registered merchants
   */
  getMerchants: (params?: MerchantFilterParams) => {
    return fetchApi('/merchants', { params: params as any });
  },

  /**
   * Super Admin: Get single merchant details
   */
  getMerchantDetail: (id: string) => {
    return fetchApi(`/merchants/detail/${id}`);
  },

  /**
   * Get authenticated merchant profile
   */
  getProfile: () => {
    return fetchApi('/merchants/profile');
  },

  /**
   * Update merchant profile
   */
  updateProfile: (data: any) => {
    return fetchApi('/merchants/profile', {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  },

  /**
   * Super Admin: Update merchant approval status & custom fee rates
   */
  updateStatusAndRates: (
    id: string,
    data: {
      status?: 'PENDING' | 'APPROVED' | 'SUSPENDED';
      baseHandlingFee?: number;
      monthlyStorageFee?: number;
    },
  ) => {
    return fetchApi(`/merchants/${id}/status-and-rates`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  },

  /**
   * Get merchant dashboard overview
   */
  getDashboard: () => {
    return fetchApi('/merchants/dashboard');
  },
};
