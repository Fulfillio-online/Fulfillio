import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { merchantsApi, MerchantFilterParams } from '../api/merchantsApi';

export function useMerchants(params?: MerchantFilterParams) {
  return useQuery({
    queryKey: ['merchants', params],
    queryFn: async () => {
      try {
        return await merchantsApi.getMerchants(params);
      } catch (err) {
        console.warn('API /merchants unavailable, falling back:', err);
        return { items: [], total: 0, page: 1, limit: 20, totalPages: 0 };
      }
    },
    staleTime: 1000 * 60, // 1 min
  });
}

export function useMerchantProfile() {
  return useQuery({
    queryKey: ['merchantProfile'],
    queryFn: async () => {
      return await merchantsApi.getProfile();
    },
  });
}

export function useUpdateMerchantStatus() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      data,
    }: {
      id: string;
      data: {
        status?: 'PENDING' | 'APPROVED' | 'SUSPENDED';
        baseHandlingFee?: number;
        monthlyStorageFee?: number;
      };
    }) => merchantsApi.updateStatusAndRates(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['merchants'] });
    },
  });
}
