import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  EarningsChartPeriod,
  FinanceEntryCategory,
  FinanceEntryType,
  FinanceTimeframePreset,
} from '@fulfillio/contracts';
import { billingApi } from '../api/billingApi';

function invalidateAllBillingQueries(queryClient: ReturnType<typeof useQueryClient>) {
  queryClient.invalidateQueries({ queryKey: ['merchantEarnings'] });
  queryClient.invalidateQueries({ queryKey: ['payoutRequests'] });
  queryClient.invalidateQueries({ queryKey: ['settlements'] });
  queryClient.invalidateQueries({ queryKey: ['billingOverview'] });
  queryClient.invalidateQueries({ queryKey: ['adminOrderEarnings'] });
  queryClient.invalidateQueries({ queryKey: ['adminFinanceAnalytics'] });
  queryClient.invalidateQueries({ queryKey: ['adminOperationsDashboard'] });
}

export function useMerchantEarnings(
  merchantCode?: string,
  period: EarningsChartPeriod = 'THIS_MONTH',
) {
  return useQuery({
    queryKey: ['merchantEarnings', merchantCode || 'default', period],
    queryFn: () => billingApi.getMerchantEarnings(merchantCode, period),
    staleTime: 1000 * 15,
    refetchOnWindowFocus: true,
  });
}

export function useClaimEarnings() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: {
      merchantCode?: string;
      earningIds?: string[];
      claimAll?: boolean;
    }) => billingApi.claimEarnings(payload),
    onSuccess: () => {
      invalidateAllBillingQueries(queryClient);
    },
  });
}

export function useCreatePayoutRequest() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: {
      merchantCode?: string;
      amount: number;
      method: string;
      provider: string;
      accountNumber: string;
      accountHolder?: string;
      branchName?: string;
      routingNumber?: string;
      remarks?: string;
    }) => billingApi.createPayoutRequest(payload),
    onSuccess: () => {
      invalidateAllBillingQueries(queryClient);
    },
  });
}

export function useCancelPayoutRequest() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, merchantCode }: { id: string; merchantCode?: string }) =>
      billingApi.cancelPayoutRequest(id, merchantCode),
    onSuccess: () => {
      invalidateAllBillingQueries(queryClient);
    },
  });
}

export function useAdminPayoutRequests(params?: {
  merchantId?: string;
  merchantCode?: string;
  status?: string;
  method?: string;
  search?: string;
}) {
  return useQuery({
    queryKey: ['payoutRequests', params || {}],
    queryFn: () => billingApi.getPayoutRequests(params),
    staleTime: 1000 * 15,
    refetchOnWindowFocus: true,
  });
}

export function useAcceptPayoutRequest() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => billingApi.acceptPayoutRequest(id),
    onSuccess: () => {
      invalidateAllBillingQueries(queryClient);
    },
  });
}

export function useRejectPayoutRequest() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, rejectionReason }: { id: string; rejectionReason?: string }) =>
      billingApi.rejectPayoutRequest(id, rejectionReason),
    onSuccess: () => {
      invalidateAllBillingQueries(queryClient);
    },
  });
}

export function useBulkPayoutAction() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      ids,
      action,
      rejectionReason,
    }: {
      ids: string[];
      action: 'ACCEPT' | 'REJECT';
      rejectionReason?: string;
    }) => billingApi.bulkUpdatePayoutRequests(ids, action, rejectionReason),
    onSuccess: () => {
      invalidateAllBillingQueries(queryClient);
    },
  });
}

export function usePayPayoutRequest() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      payload,
    }: {
      id: string;
      payload: {
        trxId: string;
        proofDocumentUrl: string;
        proofDocumentName?: string;
        proofDocumentMime?: string;
        proofChannel?: string;
        proofNotes?: string;
        paidByAdminName?: string;
      };
    }) => billingApi.payPayoutRequest(id, payload),
    onSuccess: () => {
      invalidateAllBillingQueries(queryClient);
    },
  });
}

export function useAdminOrderEarnings(params?: {
  merchantId?: string;
  merchantCode?: string;
  status?: string;
  search?: string;
}) {
  return useQuery({
    queryKey: ['adminOrderEarnings', params || {}],
    queryFn: () => billingApi.getAdminOrderEarnings(params),
    staleTime: 1000 * 15,
    refetchOnWindowFocus: true,
  });
}

export function useReleaseOrderEarning() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => billingApi.releaseOrderEarning(id),
    onSuccess: () => {
      invalidateAllBillingQueries(queryClient);
    },
  });
}

export function useUpdateMerchantBillingSettings() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      merchantId,
      payload,
    }: {
      merchantId: string;
      payload: { returnWindowDays?: number; minPayoutAmount?: number };
    }) => billingApi.updateMerchantBillingSettings(merchantId, payload),
    onSuccess: () => {
      invalidateAllBillingQueries(queryClient);
    },
  });
}

export function useSettlements(merchantId?: string, merchantCode?: string) {
  return useQuery({
    queryKey: ['settlements', merchantId || 'ALL', merchantCode || 'ALL'],
    queryFn: () => billingApi.getSettlements(merchantId, merchantCode),
    staleTime: 1000 * 15,
    refetchOnWindowFocus: true,
  });
}

export function useBillingOverview(merchantId?: string, merchantCode?: string) {
  return useQuery({
    queryKey: ['billingOverview', merchantId || 'ALL', merchantCode || 'ALL'],
    queryFn: () => billingApi.getOverview(merchantId, merchantCode),
    staleTime: 1000 * 15,
    refetchOnWindowFocus: true,
  });
}

export function useRecordDisbursement() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: {
      merchantId: string;
      amount: number;
      paymentMethod?: string;
      paidAt?: string;
      notes?: string;
      trxId?: string;
      proofDocumentUrl?: string;
      proofDocumentName?: string;
      proofDocumentMime?: string;
    }) => billingApi.disburse(data),
    onSuccess: () => {
      invalidateAllBillingQueries(queryClient);
    },
  });
}

export function useMarkSettlementPaid() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (settlementId: string) => billingApi.markPaid(settlementId),
    onSuccess: () => {
      invalidateAllBillingQueries(queryClient);
    },
  });
}

export function useAdminFinanceAnalytics(params?: {
  preset?: FinanceTimeframePreset;
  startDate?: string;
  endDate?: string;
  merchantId?: string;
  merchantCode?: string;
}) {
  return useQuery({
    queryKey: ['adminFinanceAnalytics', params || {}],
    queryFn: () => billingApi.getAdminFinanceAnalytics(params),
    staleTime: 1000 * 15,
    refetchOnWindowFocus: true,
  });
}

export function useCreateFinanceEntry() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: {
      type: FinanceEntryType | string;
      category: FinanceEntryCategory | string;
      title: string;
      amount: number;
      entryDate?: string;
      merchantId?: string;
      paymentMethod?: string;
      referenceNo?: string;
      notes?: string;
    }) => billingApi.createFinanceEntry(payload),
    onSuccess: () => {
      invalidateAllBillingQueries(queryClient);
    },
  });
}

export function useUpdateFinanceEntry() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      payload,
    }: {
      id: string;
      payload: {
        type?: FinanceEntryType | string;
        category?: FinanceEntryCategory | string;
        title?: string;
        amount?: number;
        entryDate?: string;
        merchantId?: string | null;
        paymentMethod?: string | null;
        referenceNo?: string | null;
        notes?: string | null;
      };
    }) => billingApi.updateFinanceEntry(id, payload),
    onSuccess: () => {
      invalidateAllBillingQueries(queryClient);
    },
  });
}

export function useDeleteFinanceEntry() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => billingApi.deleteFinanceEntry(id),
    onSuccess: () => {
      invalidateAllBillingQueries(queryClient);
    },
  });
}

export function useAdminOperationsDashboard() {
  return useQuery({
    queryKey: ['adminOperationsDashboard'],
    queryFn: () => billingApi.getAdminOperationsDashboard(),
    staleTime: 1000 * 15,
    refetchOnWindowFocus: true,
  });
}
