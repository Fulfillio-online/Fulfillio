'use client';

import React, { useState, useMemo, useEffect } from 'react';
import Link from 'next/link';
import {
  HandCoins,
  CheckCircle2,
  Clock,
  Check,
  XCircle,
  TrendingUp,
  DollarSign,
  Plus,
  CreditCard,
  ArrowRight,
} from 'lucide-react';
import { PaymentRequest, PaymentRequestMethod, PaymentRequestStatus } from './types';
import { INITIAL_PAYMENT_REQUESTS, STORAGE_KEY_PAYMENT_REQUESTS } from './mockData';
import { PaymentRequestsFiltersBar } from './components/PaymentRequestsFiltersBar';
import { PaymentRequestsTable } from './components/PaymentRequestsTable';
import { PaymentRequestsPagination } from './components/PaymentRequestsPagination';
import { PayTransactionModal } from './components/PayTransactionModal';
import {
  STORAGE_KEY_BILLING_TRANSACTIONS,
  STORAGE_KEY_BILLING_PROFILES,
  INITIAL_SETTLEMENT_TRANSACTIONS,
  MERCHANT_FINANCIAL_PROFILES,
} from '../billing/mockData';
import { SettlementTransaction } from '../billing/types';

export function PaymentRequestsManager() {
  const [requests, setRequests] = useState<PaymentRequest[]>(INITIAL_PAYMENT_REQUESTS);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  // Search & Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | PaymentRequestStatus>('ALL');
  const [methodFilter, setMethodFilter] = useState<'ALL' | PaymentRequestMethod>('ALL');

  // Pagination
  const [pageSize, setPageSize] = useState<number>(10);
  const [currentPage, setCurrentPage] = useState<number>(1);

  // Pay Modal State
  const [payingRequest, setPayingRequest] = useState<PaymentRequest | null>(null);

  // Toast Notification
  const [toast, setToast] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3600);
  };

  // Hydrate from localStorage
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY_PAYMENT_REQUESTS);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setRequests(parsed);
        }
      }
    } catch (err) {
      console.error('Failed to load payment requests:', err);
    }
  }, []);

  // Listen to sync events
  useEffect(() => {
    const handleSync = (e: Event) => {
      const customEvent = e as CustomEvent<{ source?: string }>;
      if (customEvent.detail?.source === 'PaymentRequestsManager') return;
      try {
        const stored = localStorage.getItem(STORAGE_KEY_PAYMENT_REQUESTS);
        if (stored) {
          const parsed = JSON.parse(stored);
          if (Array.isArray(parsed) && parsed.length > 0) {
            setRequests(parsed);
          }
        }
      } catch (err) {
        console.error('Failed to sync payment requests:', err);
      }
    };
    window.addEventListener('fulfillio-warehouse-sync', handleSync);
    return () => window.removeEventListener('fulfillio-warehouse-sync', handleSync);
  }, []);

  // Update requests state & localStorage
  const updateRequestsAndPersist = (
    updater: (prev: PaymentRequest[]) => PaymentRequest[]
  ) => {
    setRequests((prev) => {
      const next = updater(prev);
      try {
        localStorage.setItem(STORAGE_KEY_PAYMENT_REQUESTS, JSON.stringify(next));
        window.dispatchEvent(
          new CustomEvent('fulfillio-warehouse-sync', {
            detail: { source: 'PaymentRequestsManager' },
          })
        );
      } catch (err) {
        console.error('Failed to save payment requests:', err);
      }
      return next;
    });
  };

  // Reset page when filters change
  useEffect(() => {
    setCurrentPage(1);
    setSelectedIds([]);
  }, [searchQuery, statusFilter, methodFilter, pageSize]);

  // Top KPI Stats
  const stats = useMemo(() => {
    const totalRequests = requests.length;
    const pendingRequests = requests.filter((r) => r.status === 'PENDING').length;
    const acceptedRequests = requests.filter((r) => r.status === 'ACCEPTED').length;
    const rejectedRequests = requests.filter((r) => r.status === 'REJECTED').length;

    return {
      totalRequests,
      pendingRequests,
      acceptedRequests,
      rejectedRequests,
    };
  }, [requests]);

  // Filtered requests
  const filteredRequests = useMemo(() => {
    return requests.filter((req) => {
      const q = searchQuery.toLowerCase().trim();
      const matchSearch =
        !q ||
        req.id.toLowerCase().includes(q) ||
        req.merchantName.toLowerCase().includes(q) ||
        req.merchantCode.toLowerCase().includes(q) ||
        req.ownerName.toLowerCase().includes(q) ||
        req.accountDetails.accountNumber.includes(q) ||
        req.accountDetails.provider.toLowerCase().includes(q) ||
        (req.trxId && req.trxId.toLowerCase().includes(q));

      const matchStatus = statusFilter === 'ALL' || req.status === statusFilter;
      const matchMethod = methodFilter === 'ALL' || req.method === methodFilter;

      return matchSearch && matchStatus && matchMethod;
    });
  }, [requests, searchQuery, statusFilter, methodFilter]);

  // Pagination calculation
  const totalItems = filteredRequests.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  const safePage = Math.min(Math.max(1, currentPage), totalPages);
  const startIndex = (safePage - 1) * pageSize;
  const paginatedRequests = filteredRequests.slice(startIndex, startIndex + pageSize);

  // Bulk Selection
  const allVisibleSelected =
    paginatedRequests.length > 0 &&
    paginatedRequests.every((r) => selectedIds.includes(r.id));

  const toggleSelectAll = () => {
    setSelectedIds(allVisibleSelected ? [] : paginatedRequests.map((r) => r.id));
  };

  const toggleSelectRow = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  // Actions: Accept single request
  const handleAccept = (req: PaymentRequest) => {
    updateRequestsAndPersist((prev) =>
      prev.map((r) => (r.id === req.id ? { ...r, status: 'ACCEPTED' } : r))
    );
    showToast(`Payment request ${req.id} for ${req.merchantName} marked as Accepted!`);
  };

  // Actions: Reject single request
  const handleReject = (req: PaymentRequest) => {
    updateRequestsAndPersist((prev) =>
      prev.map((r) => (r.id === req.id ? { ...r, status: 'REJECTED' } : r))
    );
    showToast(`Payment request ${req.id} rejected.`);
  };

  // Bulk Actions
  const handleBulkAccept = () => {
    const idsToAccept = new Set(selectedIds);
    updateRequestsAndPersist((prev) =>
      prev.map((r) =>
        idsToAccept.has(r.id) && r.status === 'PENDING' ? { ...r, status: 'ACCEPTED' } : r
      )
    );
    showToast(`Accepted ${selectedIds.length} payment request(s).`);
    setSelectedIds([]);
  };

  const handleBulkReject = () => {
    const idsToReject = new Set(selectedIds);
    updateRequestsAndPersist((prev) =>
      prev.map((r) =>
        idsToReject.has(r.id) && r.status === 'PENDING' ? { ...r, status: 'REJECTED' } : r
      )
    );
    showToast(`Rejected ${selectedIds.length} payment request(s).`);
    setSelectedIds([]);
  };

  // Pay Confirmation with TrxID -> Synced to Billing & COD Statement & Removed from Payment Requests
  const handleConfirmPayout = (requestId: string, trxId: string) => {
    const target = requests.find((r) => r.id === requestId);
    if (!target) return;

    const paidAt = new Date().toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    }) + ', ' + new Date().toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    });

    // 1. Remove the paid request completely from Payment Requests!
    updateRequestsAndPersist((prev) => prev.filter((r) => r.id !== requestId));

    // 2. Synchronize to Billing & COD Settlement transactions
    try {
      let currentTransactions: SettlementTransaction[] = INITIAL_SETTLEMENT_TRANSACTIONS;
      const stored = localStorage.getItem(STORAGE_KEY_BILLING_TRANSACTIONS);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) {
          currentTransactions = parsed;
        }
      }

      const newSettlementTx: SettlementTransaction = {
        id: `tx-payout-${Date.now()}`,
        transactionRef: trxId,
        merchantId: target.merchantId,
        merchantCode: target.merchantCode,
        merchantName: target.merchantName,
        ownerName: target.ownerName,
        transactionDate: paidAt,
        paymentMethod: target.method,
        accountDetails: {
          provider: target.accountDetails.provider,
          accountNumber: target.accountDetails.accountNumber,
          accountHolder: target.accountDetails.accountHolder || target.ownerName,
        },
        amount: target.amount,
        status: 'PAID',
        remarks: `Disbursed against Payment Request ${target.id}`,
      };

      const updatedTransactions = [newSettlementTx, ...currentTransactions];
      localStorage.setItem(
        STORAGE_KEY_BILLING_TRANSACTIONS,
        JSON.stringify(updatedTransactions)
      );

      // 3. Update merchant financial profile balances in billing
      let currentProfiles = MERCHANT_FINANCIAL_PROFILES;
      const storedProfiles = localStorage.getItem(STORAGE_KEY_BILLING_PROFILES);
      if (storedProfiles) {
        const parsed = JSON.parse(storedProfiles);
        if (parsed && typeof parsed === 'object') {
          currentProfiles = parsed;
        }
      }
      if (currentProfiles[target.merchantCode]) {
        const p = currentProfiles[target.merchantCode];
        currentProfiles = {
          ...currentProfiles,
          [target.merchantCode]: {
            ...p,
            totalPaid: p.totalPaid + target.amount,
            unpaidBalance: Math.max(0, p.unpaidBalance - target.amount),
            withdrawalsCount: p.withdrawalsCount + 1,
          },
        };
        localStorage.setItem(
          STORAGE_KEY_BILLING_PROFILES,
          JSON.stringify(currentProfiles)
        );
      }

      // Dispatch sync event so Billing & COD tab refreshes immediately
      window.dispatchEvent(
        new CustomEvent('fulfillio-warehouse-sync', {
          detail: { source: 'PaymentRequestsManager' },
        })
      );
    } catch (err) {
      console.error('Failed to sync transaction to billing:', err);
    }

    showToast(
      `Payout of ৳${target.amount.toLocaleString()} for ${target.merchantName} recorded with TrxID: ${trxId} & moved to Billing & COD Statement!`
    );
  };

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
      {toast && (
        <div className="fixed top-6 right-6 z-50 bg-emerald-600 text-white px-4 py-3 rounded-xl shadow-2xl flex items-center gap-2 text-xs font-bold animate-in fade-in">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>{toast}</span>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl font-bold tracking-tight text-white">
              Merchant Payment Requests
            </h1>
            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-mono font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
              Payouts &amp; Settlements
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            Review and process merchant COD payout requests. Accepted requests can be settled with bank/mobile banking TrxID.
          </p>
        </div>

        <Link
          href="/admin/billing"
          className="px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-xs font-bold text-slate-200 flex items-center gap-2 shadow-sm transition-colors cursor-pointer w-fit"
        >
          <CreditCard className="w-4 h-4 text-emerald-400" />
          <span>View Billing &amp; COD Statement</span>
        </Link>
      </div>

      {/* 4 KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
        {/* Total Requests */}
        <div className="rounded-2xl border border-slate-800 bg-slate-900/90 p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-400 font-medium">Active Requests</span>
            <div className="w-8 h-8 rounded-xl bg-slate-800 flex items-center justify-center text-slate-300">
              <HandCoins className="w-4 h-4" />
            </div>
          </div>
          <div className="font-mono text-xl font-extrabold text-white mt-2">
            {stats.totalRequests}
          </div>
          <span className="text-[10px] text-slate-500 mt-0.5 block">Pending &amp; accepted payouts</span>
        </div>

        {/* Pending Requests */}
        <div className="rounded-2xl border border-amber-500/30 bg-amber-950/10 p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs text-amber-300 font-medium">Pending Approval</span>
            <div className="w-8 h-8 rounded-xl bg-amber-500/15 flex items-center justify-center text-amber-300 border border-amber-500/30">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="font-mono text-xl font-extrabold text-amber-300 mt-2">
            {stats.pendingRequests}
          </div>
          <span className="text-[10px] text-amber-400/80 mt-0.5 block">Awaiting review</span>
        </div>

        {/* Accepted (Ready to Pay) */}
        <div className="rounded-2xl border border-sky-500/30 bg-sky-950/10 p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs text-sky-300 font-medium">Accepted (Ready to Pay)</span>
            <div className="w-8 h-8 rounded-xl bg-sky-500/15 flex items-center justify-center text-sky-300 border border-sky-500/30">
              <Check className="w-4 h-4" />
            </div>
          </div>
          <div className="font-mono text-xl font-extrabold text-sky-300 mt-2">
            {stats.acceptedRequests}
          </div>
          <span className="text-[10px] text-sky-400/80 mt-0.5 block">Approved for disbursement</span>
        </div>

        {/* Rejected Requests */}
        <div className="rounded-2xl border border-rose-500/30 bg-rose-950/10 p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs text-rose-300 font-medium">Rejected Requests</span>
            <div className="w-8 h-8 rounded-xl bg-rose-500/15 flex items-center justify-center text-rose-300 border border-rose-500/30">
              <XCircle className="w-4 h-4" />
            </div>
          </div>
          <div className="font-mono text-xl font-extrabold text-rose-300 mt-2">
            {stats.rejectedRequests}
          </div>
          <span className="text-[10px] text-rose-400/80 mt-0.5 block">Declined payouts</span>
        </div>
      </div>

      {/* Filter Bar with Bulk Actions */}
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

      {/* Requests Table */}
      <PaymentRequestsTable
        requests={paginatedRequests}
        selectedIds={selectedIds}
        onToggleSelectRow={toggleSelectRow}
        onToggleSelectAll={toggleSelectAll}
        allVisibleSelected={allVisibleSelected}
        onAccept={handleAccept}
        onReject={handleReject}
        onOpenPayModal={(req) => setPayingRequest(req)}
      />

      {/* Pagination Footer */}
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

      {/* Pay with TrxID Modal */}
      <PayTransactionModal
        isOpen={Boolean(payingRequest)}
        onClose={() => setPayingRequest(null)}
        request={payingRequest}
        onConfirm={handleConfirmPayout}
      />
    </div>
  );
}
