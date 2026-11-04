'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  courierSimulator,
  ConsignmentRecord,
  ConsignmentRequest,
  CourierDeliveryStatus,
  CourierName,
  CourierSettlementSummary,
} from '@/lib/couriers';

export const COURIER_QUERY_KEYS = {
  all: ['consignments'] as const,
  byCode: (code: string) => ['consignments', code] as const,
  byOrder: (orderId: string) => ['consignments', 'order', orderId] as const,
  settlements: ['consignments', 'settlements'] as const,
};

export function useConsignments() {
  return useQuery({
    queryKey: COURIER_QUERY_KEYS.all,
    queryFn: async (): Promise<ConsignmentRecord[]> => {
      // Simulate network latency (100ms) for realistic UX
      await new Promise((res) => setTimeout(res, 80));
      return courierSimulator.getAll();
    },
  });
}

export function useConsignment(trackingCode: string) {
  return useQuery({
    queryKey: COURIER_QUERY_KEYS.byCode(trackingCode),
    queryFn: async (): Promise<ConsignmentRecord | null> => {
      await new Promise((res) => setTimeout(res, 60));
      return courierSimulator.getByTrackingCode(trackingCode) || null;
    },
    enabled: Boolean(trackingCode),
  });
}

export function useCreateConsignment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (req: ConsignmentRequest) => {
      await new Promise((res) => setTimeout(res, 120));
      return courierSimulator.createConsignment(req);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: COURIER_QUERY_KEYS.all });
    },
  });
}

export function useAdvanceConsignmentStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      consignmentId,
      status,
      location,
      notes,
    }: {
      consignmentId: string;
      status: CourierDeliveryStatus;
      location?: string;
      notes?: string;
    }) => {
      await new Promise((res) => setTimeout(res, 120));
      const updated = courierSimulator.advanceStatus(consignmentId, status, location, notes);
      if (!updated) throw new Error(`Consignment ${consignmentId} not found`);
      return updated;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: COURIER_QUERY_KEYS.all });
    },
  });
}

export function useCourierSettlements() {
  const { data: consignments = [] } = useConsignments();

  const couriers: CourierName[] = ['Steadfast', 'Pathao', 'RedX'];

  const summaries: CourierSettlementSummary[] = couriers.map((courier) => {
    const courierOrders = consignments.filter((c) => c.courier === courier);
    const deliveredOrders = courierOrders.filter((c) => c.status === 'DELIVERED');

    const totalCodCollected = deliveredOrders.reduce((sum, c) => sum + c.codAmount, 0);
    const totalDeliveryFee = courierOrders.reduce((sum, c) => sum + c.deliveryCharge, 0);
    const totalCodFee = deliveredOrders.reduce((sum, c) => sum + c.codFee, 0);
    const netPayableToMerchant = Math.max(0, totalCodCollected - (totalDeliveryFee + totalCodFee));

    return {
      courier,
      totalConsignments: courierOrders.length,
      totalCodCollected,
      totalDeliveryFee,
      totalCodFee,
      netPayableToMerchant,
      settlementStatus: totalCodCollected > 0 ? 'PENDING' : 'SETTLED',
    };
  });

  return { summaries };
}
