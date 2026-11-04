import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ordersApi, OrderFilterParams } from '../api/ordersApi';
import { PackagingType } from '@fulfillio/contracts';

export function useOrders(params?: OrderFilterParams) {
  return useQuery({
    queryKey: ['orders', params],
    queryFn: async () => {
      try {
        return await ordersApi.getOrders(params);
      } catch (err) {
        console.warn('API /orders unavailable, falling back:', err);
        return { items: [], total: 0, page: 1, limit: 20, totalPages: 0 };
      }
    },
    staleTime: 1000 * 30, // 30s
  });
}

export function useOrderDetail(id: string) {
  return useQuery({
    queryKey: ['order', id],
    queryFn: async () => {
      return await ordersApi.getOrderById(id);
    },
    enabled: Boolean(id),
  });
}

export function useUpdateOrderStatus() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) =>
      ordersApi.updateStatus(id, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['orders'] });
    },
  });
}

export function useBatchPrintLock() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      orderIds,
      packagingType,
    }: {
      orderIds: string[];
      packagingType?: PackagingType;
    }) => ordersApi.lockBatchMemoPrint(orderIds, packagingType),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['orders'] });
      queryClient.invalidateQueries({ queryKey: ['packingQueue'] });
    },
  });
}
