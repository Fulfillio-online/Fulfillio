import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { returnsApi } from '../api/returnsApi';

export function useReturns(merchantId?: string) {
  return useQuery({
    queryKey: ['returns', merchantId],
    queryFn: async () => {
      try {
        return await returnsApi.getReturns(merchantId);
      } catch (err) {
        console.warn('API /returns unavailable, falling back:', err);
        return [];
      }
    },
    staleTime: 1000 * 30,
  });
}

export function useReturnStats(merchantId?: string) {
  return useQuery({
    queryKey: ['returnStats', merchantId],
    queryFn: async () => {
      try {
        return await returnsApi.getStats(merchantId);
      } catch (err) {
        console.warn('API /returns/stats unavailable, falling back:', err);
        return {
          totalReturnedOrders: 0,
          totalDispatchedOrders: 0,
          totalRestockedUnits: 0,
          totalQuarantineUnits: 0,
          returnRate: 0,
        };
      }
    },
    staleTime: 1000 * 60,
  });
}

export function useIntakeReturn() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: { trackingOrConsignment: string; courierProvider?: string }) =>
      returnsApi.intake(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['returns'] });
      queryClient.invalidateQueries({ queryKey: ['returnStats'] });
    },
  });
}

export function useQcInspectReturn() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: {
      orderId: string;
      variantId: string;
      quantity: number;
      isUndamaged: boolean;
      reasonNotes?: string;
    }) => returnsApi.qcInspect(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['returns'] });
      queryClient.invalidateQueries({ queryKey: ['returnStats'] });
    },
  });
}
