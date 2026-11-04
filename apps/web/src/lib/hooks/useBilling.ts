import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { billingApi } from '../api/billingApi';

export function useSettlements(merchantId?: string) {
  return useQuery({
    queryKey: ['settlements', merchantId],
    queryFn: async () => {
      try {
        return await billingApi.getSettlements(merchantId);
      } catch (err) {
        console.warn('API /billing/settlements unavailable, falling back:', err);
        return [];
      }
    },
    staleTime: 1000 * 60,
  });
}

export function useBillingOverview(merchantId?: string) {
  return useQuery({
    queryKey: ['billingOverview', merchantId],
    queryFn: async () => {
      try {
        return await billingApi.getOverview(merchantId);
      } catch (err) {
        console.warn('API /billing/overview unavailable, falling back:', err);
        return null;
      }
    },
    staleTime: 1000 * 60,
  });
}

export function useMarkSettlementPaid() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (settlementId: string) => billingApi.markPaid(settlementId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['settlements'] });
      queryClient.invalidateQueries({ queryKey: ['billingOverview'] });
    },
  });
}
