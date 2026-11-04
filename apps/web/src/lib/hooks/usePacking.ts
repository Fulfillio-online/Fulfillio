import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { packingApi } from '../api/packingApi';
import { PackagingType } from '@fulfillio/contracts';

export function usePackingQueue() {
  return useQuery({
    queryKey: ['packingQueue'],
    queryFn: async () => {
      try {
        return await packingApi.getQueue();
      } catch (err) {
        console.warn('API /packing/queue unavailable, using local mock state:', err);
        return [];
      }
    },
    refetchInterval: 15000, // Poll every 15s for new picked orders
  });
}

export function useBatchPrintPacking() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      orderIds,
      packagingType,
    }: {
      orderIds: string[];
      packagingType?: PackagingType;
    }) => packingApi.batchPrint(orderIds, packagingType),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['packingQueue'] });
      queryClient.invalidateQueries({ queryKey: ['orders'] });
    },
  });
}
