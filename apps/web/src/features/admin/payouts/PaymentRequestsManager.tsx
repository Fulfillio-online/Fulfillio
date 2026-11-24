'use client';

import React, { useState, useMemo, useEffect } from 'react';
import Link from 'next/link';
import {
  HandCoins,
  CheckCircle2,
  Clock,
  Check,
  XCircle,
  CreditCard,
  ShieldCheck,
  RefreshCw,
  Search,
  Unlock,
  Sliders,
} from 'lucide-react';
import { OrderEarningDto, OrderEarningStatus, PayoutRequestDto } from '@fulfillio/contracts';
import {
  useAdminPayoutRequests,
  useAcceptPayoutRequest,
  useRejectPayoutRequest,
  useBulkPayoutAction,
  usePayPayoutRequest,
  useAdminOrderEarnings,
  useReleaseOrderEarning,
  useUpdateMerchantBillingSettings,
} from '@/lib/hooks/useBilling';
import { Modal } from '@/components/admin/AdminModal';
import {
  PayoutDigitalProofModal,
  PayoutDigitalProofData,
} from '@/components/billing/PayoutDigitalProofModal';
import { PaymentRequest, PaymentRequestMethod, PaymentRequestStatus } from './types';
import { PaymentRequestsFiltersBar } from './components/PaymentRequestsFiltersBar';
import { PaymentRequestsTable } from './components/PaymentRequestsTable';
import { PaymentRequestsPagination } from './components/PaymentRequestsPagination';
import { PayTransactionModal, PayTransactionPayload } from './components/PayTransactionModal';
import { useMerchantDirectory } from '../merchants/useMerchantDirectory';

function mapDtoToPaymentRequest(r: PayoutRequestDto): PaymentRequest {
  return {
    id: r.id,
    requestCode: r.requestCode,
    merchantId: r.merchantId,
    merchantCode: r.merchantCode,
    merchantName: r.merchantName,
    ownerName: r.ownerName,
    amount: r.amount,
    method: r.method as PaymentRequestMethod,
    accountDetails: {
      provider: r.provider,
      accountNumber: r.accountNumber,
      accountHolder: r.accountHolder,
      branchName: r.branchName,
      routingNumber: r.routingNumber,
    },
    requestedAt: r.requestedAt,
    reviewedAt: r.reviewedAt,
    status: r.status as PaymentRequestStatus,
    rejectionReason: r.rejectionReason,
    trxId: r.trxId,
    proofDocumentUrl: r.proofDocumentUrl,
    proofDocumentName: r.proofDocumentName,
    proofDocumentMime: r.proofDocumentMime,
    proofChannel: r.proofChannel,
    proofNotes: r.proofNotes,
    proofChecksum: r.proofChecksum,
    paidAt: r.paidAt,
    paidByAdminName: r.paidByAdminName,
    remarks: r.remarks,
  };
}

export function PaymentRequestsManager() {
  const { merchants: directoryMerchants } = useMerchantDirectory();
  const pendingPayoutMerchants = useMemo(
    () => directoryMerchants.filter((m) => m.payoutAccount?.status === 'PENDING_REVIEW'),
    [directoryMerchants],
  );

  const [activeTab, setActiveTab] = useState<'REQUESTS' | 'EARNINGS'>('REQUESTS');

  // Tab 1: Payout Requests filters & pagination
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | PaymentRequestStatus>('ALL');
  const [methodFilter, setMethodFilter] = useState<'ALL' | PaymentRequestMethod>('ALL');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [pageSize, setPageSize] = useState<number>(10);
  const [currentPage, setCurrentPage] = useState<number>(1);

  // Tab 2: Order Earnings & Return Hold filters
  const [earningsSearch, setEarningsSearch] = useState('');
  const [earningsStatusFilter, setEarningsStatusFilter] = useState<'ALL' | OrderEarningStatus>('ALL');

  // Modals
  const [payingRequest, setPayingRequest] = useState<PaymentRequest | null>(null);
  const [rejectingRequest, setRejectingRequest] = useState<PaymentRequest | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [activeProof, setActiveProof] = useState<PayoutDigitalProofData | null>(null);

  // Settings Modal for Return Window
  const [settingsMerchant, setSettingsMerchant] = useState<{
    id: string;
    code: string;
    name: string;
    returnWindowDays: number;
    minPayoutAmount: number;
  } | null>(null);

  const [toast, setToast] = useState<string | null>(null);
  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => {
      setToast((curr) => (curr === msg ? null : curr));
    }, 3800);
  };

  // Live API Queries
  const {
    data: requestsResp,
    isLoading: isRequestsLoading,
    isFetching: isRequestsFetching,
    refetch: refetchRequests,
  } = useAdminPayoutRequests();

  const {
    data: adminEarnings = [],
    isLoading: isEarningsLoading,
    isFetching: isEarningsFetching,
    refetch: refetchEarnings,
  } = useAdminOrderEarnings({
    status: earningsStatusFilter,
    search: earningsSearch || undefined,
  });

  const acceptMutation = useAcceptPayoutRequest();
  const rejectMutation = useRejectPayoutRequest();
  const bulkMutation = useBulkPayoutAction();
  const payMutation = usePayPayoutRequest();
  const releaseMutation = useReleaseOrderEarning();
  const updateSettingsMutation = useUpdateMerchantBillingSettings();

  const allRequests: PaymentRequest[] = useMemo(
    () => (requestsResp?.items || []).map(mapDtoToPaymentRequest),
    [requestsResp],
  );

  const stats = requestsResp?.stats || {
    totalRequests: allRequests.length,
    pendingRequests: allRequests.filter((r) => r.status === 'PENDING').length,
    acceptedRequests: allRequests.filter((r) => r.status === 'ACCEPTED').length,
    paidRequests: allRequests.filter((r) => r.status === 'PAID').length,
    rejectedRequests: allRequests.filter((r) => r.status === 'REJECTED').length,
    cancelledRequests: allRequests.filter((r) => r.status === 'CANCELLED').length,
    totalPendingAmount: 0,
    totalPaidAmount: 0,
  };

  useEffect(() => {
    setCurrentPage(1);
    setSelectedIds([]);
  }, [searchQuery, statusFilter, methodFilter, pageSize]);

  const filteredRequests = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    return allRequests.filter((req) => {
      const matchSearch =
        !q ||
        req.requestCode.toLowerCase().includes(q) ||
        req.merchantName.toLowerCase().includes(q) ||
        req.merchantCode.toLowerCase().includes(q) ||
        req.ownerName.toLowerCase().includes(q) ||
        req.accountDetails.accountNumber.toLowerCase().includes(q) ||
        req.accountDetails.provider.toLowerCase().includes(q) ||
        (req.trxId && req.trxId.toLowerCase().includes(q));
      const matchStatus = statusFilter === 'ALL' || req.status === statusFilter;
      const matchMethod = methodFilter === 'ALL' || req.method === methodFilter;
      return matchSearch && matchStatus && matchMethod;
    });
  }, [allRequests, searchQuery, statusFilter, methodFilter]);

  const totalItems = filteredRequests.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  const safePage = Math.min(Math.max(1, currentPage), totalPages);
  const paginatedRequests = filteredRequests.slice(
    (safePage - 1) * pageSize,
    safePage * pageSize,
  );

  const allVisibleSelected =
    paginatedRequests.length > 0 &&
    paginatedRequests.every((r) => selectedIds.includes(r.id));

  const toggleSelectAll = () => {
    setSelectedIds(allVisibleSelected ? [] : paginatedRequests.map((r) => r.id));
  };

  const toggleSelectRow = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id],
    );
  };

  const handleAccept = async (req: PaymentRequest) => {
    try {
      await acceptMutation.mutateAsync(req.id);
      showToast(`Payout request ${req.requestCode} approved and queued for transfer.`);
    } catch (err: any) {
      showToast(err?.message || 'Failed to accept payout request.');
    }
  };

  const handleConfirmReject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!rejectingRequest) return;
    try {
      await rejectMutation.mutateAsync({
        id: rejectingRequest.id,
        rejectionReason: rejectionReason.trim() || 'Rejected by Finance Admin',
      });
      showToast(
        `Payout request ${rejectingRequest.requestCode} rejected. Wallet balance restored to merchant.`,
      );
      setRejectingRequest(null);
      setRejectionReason('');
    } catch (err: any) {
      showToast(err?.message || 'Failed to reject payout request.');
    }
  };

  const handleBulkAccept = async () => {
    try {
      const res: any = await bulkMutation.mutateAsync({
        ids: selectedIds,
        action: 'ACCEPT',
      });
      showToast(`Accepted ${res.updatedCount} payout request(s).`);
      setSelectedIds([]);
    } catch (err: any) {
      showToast(err?.message || 'Bulk accept failed.');
    }
  };

  const handleBulkReject = async () => {
    try {
      const res: any = await bulkMutation.mutateAsync({
        ids: selectedIds,
        action: 'REJECT',
        rejectionReason: 'Rejected via Admin bulk action',
      });
      showToast(`Rejected ${res.updatedCount} payout request(s).`);
      setSelectedIds([]);
    } catch (err: any) {
      showToast(err?.message || 'Bulk reject failed.');
    }
  };

  const handleConfirmPayout = async (requestId: string, payload: PayTransactionPayload) => {
    const res = await payMutation.mutateAsync({
      id: requestId,
      payload,
    });
    showToast(
      `Payout ${res.payoutRequest.requestCode} (৳${res.payoutRequest.amount.toLocaleString()}) settled with TrxID ${res.payoutRequest.trxId} & Digital Proof!`,
    );
  };

  const handleReleaseEarly = async (earning: OrderEarningDto) => {
    try {
      await releaseMutation.mutateAsync(earning.id);
      showToast(
        `Order #${earning.orderNumber} (৳${earning.netAmount.toLocaleString()}) released early to Ready to Claim!`,
      );
    } catch (err: any) {
      showToast(err?.message || 'Failed to release earning early.');
    }
  };

  const handleSaveBillingSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!settingsMerchant) return;
    try {
      await updateSettingsMutation.mutateAsync({
        merchantId: settingsMerchant.id,
        payload: {
          returnWindowDays: settingsMerchant.returnWindowDays,
          minPayoutAmount: settingsMerchant.minPayoutAmount,
        },
      });
      showToast(
        `Updated ${settingsMerchant.name} (${settingsMerchant.code}) return hold to ${settingsMerchant.returnWindowDays} days & min payout ৳${settingsMerchant.minPayoutAmount}.`,
      );
      setSettingsMerchant(null);
    } catch (err: any) {
      showToast(err?.message || 'Failed to update merchant billing settings.');
    }
  };

  const handleOpenProof = (req: PaymentRequest) => {
    setActiveProof({
      requestCode: req.requestCode,
      transactionRef: req.trxId,
      merchantName: req.merchantName,
      merchantCode: req.merchantCode,
      amount: req.amount,
      method: req.method,
      provider: req.accountDetails.provider,
      accountNumber: req.accountDetails.accountNumber,
      accountHolder: req.accountDetails.accountHolder,
      trxId: req.trxId,
      proofDocumentUrl: req.proofDocumentUrl,
      proofDocumentName: req.proofDocumentName,
      proofDocumentMime: req.proofDocumentMime,
      proofChannel: req.proofChannel,
      proofNotes: req.proofNotes,
      proofChecksum: req.proofChecksum,
      paidAt: req.paidAt,
      paidByAdminName: req.paidByAdminName,
      status: req.status,
    });
  };

  return (
    <div className="space-y-6">
      {toast && (
        <div className="fixed top-6 right-6 z-50 bg-orange-600 text-white px-4 py-3 rounded-xl shadow-2xl flex items-center gap-2 text-xs font-bold animate-in fade-in">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>{toast}</span>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5 flex-wrap">
            <h1 className="text-2xl font-bold tracking-tight text-navy-800 dark:text-white">
              Merchant Payouts &amp; Claims
            </h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs tabular-nums font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30">
              Digital Proof Enforced
            </span>
          </div>
          <p className="text-xs text-slate-600 dark:text-slate-300 mt-0.5">
            Approve merchant withdrawal requests, upload mandatory digital payment proof, and manage order return-window holds.
          </p>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          <button
            type="button"
            onClick={() => {
              refetchRequests();
              refetchEarnings();
            }}
            className="px-3.5 py-2 rounded-xl bg-white dark:bg-navy-900 hover:bg-slate-100 dark:hover:bg-navy-800 border border-slate-300 dark:border-white/15 text-xs font-bold text-navy-800 dark:text-slate-100 flex items-center gap-1.5 shadow-sm transition-colors cursor-pointer"
          >
            <RefreshCw
              className={`w-3.5 h-3.5 text-orange-600 ${
                isRequestsFetching || isEarningsFetching ? 'animate-spin' : ''
              }`}
            />
            <span>Sync</span>
          </button>

          <Link
            href="/admin/payment-accounts"
            className="px-3.5 py-2 rounded-xl bg-white dark:bg-navy-900 hover:bg-slate-100 dark:hover:bg-navy-800 border border-slate-300 dark:border-white/15 text-xs font-bold text-navy-800 dark:text-slate-100 flex items-center gap-2 shadow-sm transition-colors cursor-pointer w-fit"
          >
            <ShieldCheck className="w-4 h-4 text-orange-600 dark:text-orange-400" />
            <span>Account Verifications</span>
            {pendingPayoutMerchants.length > 0 && (
              <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-amber-500/20 text-amber-700 dark:text-amber-300 border border-amber-500/30 tabular-nums">
                {pendingPayoutMerchants.length} Pending
              </span>
            )}
          </Link>

          <Link
            href="/admin/billing"
            className="px-3.5 py-2 rounded-xl bg-white dark:bg-navy-900 hover:bg-slate-100 dark:hover:bg-navy-800 border border-slate-300 dark:border-white/15 text-xs font-bold text-navy-800 dark:text-slate-100 flex items-center gap-2 shadow-sm transition-colors cursor-pointer w-fit"
          >
            <CreditCard className="w-4 h-4 text-orange-600 dark:text-orange-400" />
            <span>Billing &amp; COD Statement</span>
          </Link>
        </div>
      </div>

      {/* 4 KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
        <div className="rounded-2xl border border-slate-200 dark:border-white/10 bg-white/90 dark:bg-navy-900/90 p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-600 dark:text-slate-300 font-medium">Total Requests</span>
            <div className="w-8 h-8 rounded-xl bg-slate-100 dark:bg-navy-800 flex items-center justify-center text-slate-700 dark:text-slate-200">
              <HandCoins className="w-4 h-4" />
            </div>
          </div>
          <div className="tabular-nums text-xl font-extrabold text-navy-800 dark:text-white mt-2">
            {stats.totalRequests}
          </div>
          <span className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 block">
            All-time payout requests
          </span>
        </div>

        <div className="rounded-2xl border border-amber-500/30 bg-amber-50 dark:bg-amber-950/10 p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs text-amber-700 dark:text-amber-300 font-medium">Pending Approval</span>
            <div className="w-8 h-8 rounded-xl bg-amber-500/15 flex items-center justify-center text-amber-700 dark:text-amber-300 border border-amber-500/30">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="tabular-nums text-xl font-extrabold text-amber-700 dark:text-amber-300 mt-2">
            {stats.pendingRequests}
          </div>
          <span className="text-[11px] text-amber-600 dark:text-amber-400 mt-0.5 block">
            Awaiting review (৳{stats.totalPendingAmount.toLocaleString()} queued)
          </span>
        </div>

        <div className="rounded-2xl border border-sky-500/30 bg-sky-50 dark:bg-sky-950/10 p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs text-sky-700 dark:text-sky-300 font-medium">Accepted (Ready to Pay)</span>
            <div className="w-8 h-8 rounded-xl bg-sky-500/15 flex items-center justify-center text-sky-700 dark:text-sky-300 border border-sky-500/30">
              <Check className="w-4 h-4" />
            </div>
          </div>
          <div className="tabular-nums text-xl font-extrabold text-sky-700 dark:text-sky-300 mt-2">
            {stats.acceptedRequests}
          </div>
          <span className="text-[11px] text-sky-600 dark:text-sky-400 mt-0.5 block">
            Approved — attach digital proof to pay
          </span>
        </div>

        <div className="rounded-2xl border border-emerald-500/30 bg-emerald-50 dark:bg-emerald-950/10 p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs text-emerald-700 dark:text-emerald-300 font-medium">Settled w/ Proof</span>
            <div className="w-8 h-8 rounded-xl bg-emerald-500/15 flex items-center justify-center text-emerald-700 dark:text-emerald-300 border border-emerald-500/30">
              <ShieldCheck className="w-4 h-4" />
            </div>
          </div>
          <div className="tabular-nums text-xl font-extrabold text-emerald-700 dark:text-emerald-300 mt-2">
            ৳{stats.totalPaidAmount.toLocaleString()}
          </div>
          <span className="text-[11px] text-emerald-600 dark:text-emerald-400 mt-0.5 block">
            {stats.paidRequests} verified payout(s)
          </span>
        </div>
      </div>

      {/* Mode Switch Tabs */}
      <div className="flex flex-wrap items-center gap-2 border-b border-slate-200 dark:border-white/10 pb-3">
        <button
          type="button"
          onClick={() => setActiveTab('REQUESTS')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-colors cursor-pointer ${
            activeTab === 'REQUESTS'
              ? 'bg-orange-600 text-white shadow-sm'
              : 'bg-white dark:bg-navy-900 border border-slate-200 dark:border-white/10 text-slate-600 dark:text-slate-300 hover:text-navy-900 dark:hover:text-white'
          }`}
        >
          Payout Requests ({allRequests.length})
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('EARNINGS')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-colors cursor-pointer ${
            activeTab === 'EARNINGS'
              ? 'bg-orange-600 text-white shadow-sm'
              : 'bg-white dark:bg-navy-900 border border-slate-200 dark:border-white/10 text-slate-600 dark:text-slate-300 hover:text-navy-900 dark:hover:text-white'
          }`}
        >
          Completed Order Earnings &amp; Return Hold ({adminEarnings.length})
        </button>
      </div>

      {activeTab === 'REQUESTS' ? (
        <>
          <PaymentRequestsFiltersBar
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            statusFilter={statusFilter}
            onStatusFilterChange={setStatusFilter}
            methodFilter={methodFilter}
            onMethodFilterChange={setMethodFilter}
            selectedCount={selectedIds.length}
            onBulkAccept={handleBulkAccept}
            onBulkReject={handleBulkReject}
            onResetFilters={() => {
              setSearchQuery('');
              setStatusFilter('ALL');
              setMethodFilter('ALL');
            }}
          />

          {isRequestsLoading ? (
            <div className="h-48 rounded-2xl bg-slate-200/70 dark:bg-navy-900/70 animate-pulse" />
          ) : (
            <PaymentRequestsTable
              requests={paginatedRequests}
              selectedIds={selectedIds}
              onToggleSelectRow={toggleSelectRow}
              onToggleSelectAll={toggleSelectAll}
              allVisibleSelected={allVisibleSelected}
              onAccept={handleAccept}
              onReject={(req) => {
                setRejectingRequest(req);
                setRejectionReason('');
              }}
              onOpenPayModal={(req) => setPayingRequest(req)}
              onViewProof={handleOpenProof}
            />
          )}

          <PaymentRequestsPagination
            totalItems={totalItems}
            pageSize={pageSize}
            currentPage={safePage}
            onPageChange={setCurrentPage}
            onPageSizeChange={(size) => {
              setPageSize(size);
              setCurrentPage(1);
            }}
          />
        </>
      ) : (
        /* Tab 2: Completed Order Earnings & Return Hold Management */
        <div className="space-y-4">
          <div className="rounded-2xl border border-slate-200 dark:border-white/10 bg-white dark:bg-navy-900 p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-2.5 flex-1">
              <div className="relative flex-1 sm:flex-initial sm:w-72">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                <input
                  type="text"
                  value={earningsSearch}
                  onChange={(e) => setEarningsSearch(e.target.value)}
                  placeholder="Search order #, merchant, TXN ref..."
                  className="w-full pl-10 pr-4 py-2 rounded-xl bg-slate-50 dark:bg-navy-950 border border-slate-200 dark:border-white/10 text-xs text-navy-900 dark:text-slate-100 focus:outline-none focus:border-orange-500"
                />
              </div>

              <select
                value={earningsStatusFilter}
                onChange={(e) => setEarningsStatusFilter(e.target.value as any)}
                className="px-3.5 py-2 rounded-xl bg-slate-50 dark:bg-navy-950 border border-slate-200 dark:border-white/10 text-xs font-semibold text-navy-900 dark:text-slate-100 cursor-pointer"
              >
                <option value="ALL">All Earning Stages</option>
                <option value="PENDING">Pending (Return Hold)</option>
                <option value="READY_TO_CLAIM">Ready to Claim</option>
                <option value="CLAIMED">Claimed to Wallet</option>
                <option value="REFUNDED">Refunded (Returned)</option>
              </select>
            </div>

            {directoryMerchants.length > 0 && (
              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-500 dark:text-slate-400">Configure hold:</span>
                <select
                  defaultValue=""
                  onChange={(e) => {
                    const m = directoryMerchants.find((dm) => dm.id === e.target.value);
                    if (m) {
                      setSettingsMerchant({
                        id: m.id,
                        code: m.merchantCode,
                        name: m.storeName,
                        returnWindowDays: (m as any).returnWindowDays ?? 3,
                        minPayoutAmount: Number((m as any).minPayoutAmount ?? 100),
                      });
                    }
                    e.target.value = '';
                  }}
                  className="px-3 py-2 rounded-xl bg-slate-50 dark:bg-navy-950 border border-slate-200 dark:border-white/10 text-xs font-semibold text-navy-900 dark:text-slate-100 cursor-pointer"
                >
                  <option value="" disabled>
                    Select merchant settings...
                  </option>
                  {directoryMerchants.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.storeName} ({m.merchantCode})
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>

          <div className="rounded-2xl border border-slate-200 dark:border-white/10 bg-white dark:bg-navy-900 overflow-hidden shadow-lg">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 dark:bg-navy-950 text-slate-600 dark:text-slate-300 uppercase font-bold tracking-wider border-b border-slate-200 dark:border-white/10">
                  <tr>
                    <th className="p-3.5">Order &amp; Ref</th>
                    <th className="p-3.5">Merchant</th>
                    <th className="p-3.5">Gross Bill</th>
                    <th className="p-3.5">Fees</th>
                    <th className="p-3.5">Net Earning</th>
                    <th className="p-3.5">Return Window</th>
                    <th className="p-3.5 text-center">Stage</th>
                    <th className="p-3.5 text-right">Admin Control</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200/70 dark:divide-white/10">
                  {isEarningsLoading ? (
                    <tr>
                      <td colSpan={8} className="p-8 text-center text-slate-500">
                        Loading completed order earnings...
                      </td>
                    </tr>
                  ) : adminEarnings.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="p-8 text-center text-slate-500">
                        No order earnings recorded yet.
                      </td>
                    </tr>
                  ) : (
                    adminEarnings.map((e) => (
                      <tr key={e.id} className="hover:bg-slate-50 dark:hover:bg-navy-800/40">
                        <td className="p-3.5">
                          <span className="font-bold text-navy-900 dark:text-white block">
                            #{e.orderNumber}
                          </span>
                          <span className="font-mono text-[11px] text-slate-500">{e.transactionRef}</span>
                        </td>
                        <td className="p-3.5">
                          <span className="font-semibold text-navy-900 dark:text-white block">
                            {e.merchantName || 'Merchant'}
                          </span>
                          <span className="text-[11px] text-orange-600 dark:text-orange-400 font-bold">
                            {e.merchantCode}
                          </span>
                        </td>
                        <td className="p-3.5 font-semibold tabular-nums">
                          ৳{e.grossAmount.toLocaleString()}
                        </td>
                        <td className="p-3.5 text-rose-500 font-mono tabular-nums">
                          -৳{e.feeAmount.toLocaleString()}
                        </td>
                        <td className="p-3.5 font-black text-emerald-600 dark:text-emerald-400 tabular-nums">
                          ৳{e.netAmount.toLocaleString()}
                        </td>
                        <td className="p-3.5 text-[11px]">
                          {e.status === 'PENDING' ? (
                            <span className="text-amber-600 dark:text-amber-300 font-semibold">
                              {Math.ceil(e.remainingMs / (1000 * 60 * 60))}h left ({e.returnWindowDays}d rule)
                            </span>
                          ) : e.status === 'REFUNDED' ? (
                            <span className="text-rose-600 dark:text-rose-400">{e.refundReason || 'Returned'}</span>
                          ) : (
                            <span className="text-slate-500 dark:text-slate-400">
                              Cleared {new Date(e.claimableAt).toLocaleDateString()}
                            </span>
                          )}
                        </td>
                        <td className="p-3.5 text-center">
                          <span
                            className={`inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border select-none ${
                              e.status === 'READY_TO_CLAIM'
                                ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30'
                                : e.status === 'PENDING'
                                  ? 'bg-amber-500/15 text-amber-600 dark:text-amber-300 border-amber-500/30'
                                  : e.status === 'CLAIMED'
                                    ? 'bg-orange-500/15 text-orange-600 dark:text-orange-400 border-orange-500/30'
                                    : 'bg-rose-500/15 text-rose-600 dark:text-rose-400 border-rose-500/30'
                            }`}
                          >
                            {e.status.replace(/_/g, ' ')}
                          </span>
                        </td>
                        <td className="p-3.5 text-right">
                          {e.status === 'PENDING' ? (
                            <button
                              type="button"
                              onClick={() => handleReleaseEarly(e)}
                              disabled={releaseMutation.isPending}
                              className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-[11px] font-bold inline-flex items-center gap-1 cursor-pointer disabled:opacity-50"
                            >
                              <Unlock className="w-3 h-3" />
                              <span>Release Early</span>
                            </button>
                          ) : (
                            <span className="text-[11px] text-slate-400">—</span>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Pay with Mandatory Digital Proof Modal */}
      <PayTransactionModal
        isOpen={Boolean(payingRequest)}
        onClose={() => setPayingRequest(null)}
        request={payingRequest}
        onConfirm={handleConfirmPayout}
      />

      {/* Reject Reason Modal */}
      <Modal
        isOpen={Boolean(rejectingRequest)}
        onClose={() => setRejectingRequest(null)}
        title="Reject Payout Request"
        subtitle={
          rejectingRequest
            ? `${rejectingRequest.requestCode} · ৳${rejectingRequest.amount.toLocaleString()} (${rejectingRequest.merchantName})`
            : undefined
        }
        size="sm"
      >
        <form onSubmit={handleConfirmReject} className="space-y-4">
          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-navy-900 dark:text-white">
              Rejection Reason <span className="text-rose-500">*</span>
            </label>
            <textarea
              rows={3}
              required
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              placeholder="e.g. Account number verification mismatch — balance restored to wallet."
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-navy-950 border border-slate-200 dark:border-white/10 text-xs text-navy-900 dark:text-slate-100 focus:outline-none focus:border-orange-500"
            />
          </div>
          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setRejectingRequest(null)}
              className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-navy-800 text-xs font-semibold cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={rejectMutation.isPending}
              className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold cursor-pointer"
            >
              {rejectMutation.isPending ? 'Rejecting...' : 'Confirm Reject'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Merchant Return Window / Min Payout Settings Modal */}
      <Modal
        isOpen={Boolean(settingsMerchant)}
        onClose={() => setSettingsMerchant(null)}
        title="Merchant Return Hold & Payout Settings"
        subtitle={settingsMerchant ? `${settingsMerchant.name} (${settingsMerchant.code})` : undefined}
        size="sm"
      >
        {settingsMerchant && (
          <form onSubmit={handleSaveBillingSettings} className="space-y-4">
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-navy-900 dark:text-white">
                Customer Return Hold Window (Days)
              </label>
              <input
                type="number"
                min={0}
                max={60}
                value={settingsMerchant.returnWindowDays}
                onChange={(e) =>
                  setSettingsMerchant({
                    ...settingsMerchant,
                    returnWindowDays: Number(e.target.value),
                  })
                }
                className="w-full px-3.5 py-2 rounded-xl bg-slate-50 dark:bg-navy-950 border border-slate-200 dark:border-white/10 text-xs font-bold"
              />
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-navy-900 dark:text-white">
                Minimum Withdrawal Amount (BDT)
              </label>
              <input
                type="number"
                min={1}
                value={settingsMerchant.minPayoutAmount}
                onChange={(e) =>
                  setSettingsMerchant({
                    ...settingsMerchant,
                    minPayoutAmount: Number(e.target.value),
                  })
                }
                className="w-full px-3.5 py-2 rounded-xl bg-slate-50 dark:bg-navy-950 border border-slate-200 dark:border-white/10 text-xs font-bold"
              />
            </div>

            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setSettingsMerchant(null)}
                className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-navy-800 text-xs font-semibold cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={updateSettingsMutation.isPending}
                className="px-4 py-2 rounded-xl bg-orange-600 hover:bg-orange-500 text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer"
              >
                <Sliders className="w-3.5 h-3.5" />
                <span>{updateSettingsMutation.isPending ? 'Saving...' : 'Save Settings'}</span>
              </button>
            </div>
          </form>
        )}
      </Modal>

      {/* Digital Proof Modal */}
      <PayoutDigitalProofModal
        isOpen={Boolean(activeProof)}
        onClose={() => setActiveProof(null)}
        proof={activeProof}
      />
    </div>
  );
}
