'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import {
  Search,
  RefreshCw,
  Check,
  ChevronDown,
  HandCoins,
  X,
  ShieldCheck,
  Clock,
} from 'lucide-react';
import { useSettlements, useBillingOverview } from '@/lib/hooks/useBilling';
import {
  PayoutDigitalProofModal,
  PayoutDigitalProofData,
} from '@/components/billing/PayoutDigitalProofModal';
import { MerchantFinancialProfile, SettlementTransaction, PaymentMethod } from './types';
import { MerchantSelectCombobox } from './components/MerchantSelectCombobox';

function formatDate(iso?: string): string {
  if (!iso) return '—';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  });
}

function getInitials(name: string): string {
  const parts = (name || 'M').trim().split(/\s+/);
  return ((parts[0]?.[0] || 'M') + (parts[1]?.[0] || '')).toUpperCase();
}

export function AdminBillingManager() {
  const {
    data: serverSettlements = [],
    isLoading: isSettlementsLoading,
    isFetching: isSettlementsFetching,
    refetch: refetchSettlements,
  } = useSettlements();

  const {
    data: overview,
    isLoading: isOverviewLoading,
    refetch: refetchOverview,
  } = useBillingOverview();

  const [selectedMerchantFilter, setSelectedMerchantFilter] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [methodFilter, setMethodFilter] = useState<'ALL' | PaymentMethod>('ALL');
  const [expandedTxIds, setExpandedTxIds] = useState<Set<string>>(new Set());
  const [activeProof, setActiveProof] = useState<PayoutDigitalProofData | null>(null);

  const toggleExpand = (id: string) => {
    setExpandedTxIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const transactions: SettlementTransaction[] = useMemo(() => {
    if (!Array.isArray(serverSettlements)) return [];
    return serverSettlements.map((s: any) => ({
      id: s.id,
      settlementId: s.id,
      requestCode: s.requestCode,
      transactionRef: s.transactionRef || `SET-${String(s.id).slice(0, 8).toUpperCase()}`,
      merchantId: s.merchantId,
      merchantCode: s.merchantCode || '',
      merchantName: s.merchantName || 'Merchant',
      ownerName: s.ownerName || 'Store Owner',
      transactionDate: formatDate(s.paidAt || s.createdAt),
      paymentMethod: (s.paymentMethod || 'BANK_TRANSFER') as PaymentMethod,
      accountDetails: {
        provider: s.accountDetails?.provider || 'Bank / MFS',
        accountNumber: s.accountDetails?.accountNumber || '—',
        accountHolder: s.accountDetails?.accountHolder || s.ownerName || 'Store Owner',
      },
      amount: Number(s.netPayout) || 0,
      status: s.isPaid ? 'PAID' : 'UNPAID',
      remarks: s.remarks,
      proofDocumentUrl: s.proofDocumentUrl,
      proofDocumentName: s.proofDocumentName,
      proofDocumentMime: s.proofDocumentMime,
      proofChannel: s.proofChannel,
      proofNotes: s.proofNotes,
      proofChecksum: s.proofChecksum,
      paidByAdminName: s.paidByAdminName,
      paidAt: s.paidAt || s.createdAt,
    }));
  }, [serverSettlements]);

  const merchantProfiles: MerchantFinancialProfile[] = useMemo(() => {
    const rawList = Array.isArray(overview?.merchantProfiles) ? overview.merchantProfiles : [];
    return rawList.map((m: any) => ({
      merchantId: m.merchantId,
      merchantCode: m.merchantCode,
      merchantName: m.merchantName,
      ownerName: m.ownerName || 'Store Owner',
      phone: m.phone || '',
      avatarBg: 'from-orange-600 to-amber-500',
      avatarInitials: getInitials(m.merchantName),
      totalCodEarned: Number(m.totalCodEarned) || 0,
      totalPaid: Number(m.totalPaid) || 0,
      unpaidBalance: Number(m.unpaidBalance) || 0,
      payoutAccount: {
        provider: m.payoutAccount?.provider || 'Not Configured',
        accountHolder: m.payoutAccount?.accountHolder || m.ownerName || 'Store Owner',
        accountNumber: m.payoutAccount?.accountNumber || '',
        bkashNumber: m.payoutAccount?.bkashNumber || '',
      },
      withdrawalsCount: Number(m.withdrawalsCount) || 0,
    }));
  }, [overview]);

  const profilesByCode = useMemo(() => {
    const map: Record<string, MerchantFinancialProfile> = {};
    for (const p of merchantProfiles) {
      map[p.merchantCode] = p;
    }
    return map;
  }, [merchantProfiles]);

  const stats = useMemo(() => {
    return {
      totalCodGross: Number(overview?.totalCodCollected) || 0,
      totalPaidAmount:
        Number(overview?.totalPaidPayouts) ||
        transactions.filter((t) => t.status === 'PAID').reduce((s, t) => s + t.amount, 0),
      totalPendingHoldAndClaim:
        (Number(overview?.totalPendingHold) || 0) + (Number(overview?.totalReadyToClaim) || 0),
      totalTransactions: transactions.length,
      deliveredOrdersCount: Number(overview?.deliveredOrdersCount) || 0,
    };
  }, [overview, transactions]);

  const filteredTransactions = useMemo(() => {
    const query = searchQuery.toLowerCase().trim();
    return transactions.filter((tx) => {
      const matchMerchant =
        selectedMerchantFilter === 'ALL' || tx.merchantCode === selectedMerchantFilter;
      const matchMethod = methodFilter === 'ALL' || tx.paymentMethod === methodFilter;
      const matchSearch =
        !query ||
        tx.transactionRef.toLowerCase().includes(query) ||
        (tx.requestCode && tx.requestCode.toLowerCase().includes(query)) ||
        tx.merchantName.toLowerCase().includes(query) ||
        tx.merchantCode.toLowerCase().includes(query) ||
        tx.accountDetails.accountNumber.includes(query) ||
        tx.accountDetails.provider.toLowerCase().includes(query);

      return matchMerchant && matchMethod && matchSearch;
    });
  }, [transactions, selectedMerchantFilter, methodFilter, searchQuery]);

  const openProofModal = (tx: SettlementTransaction) => {
    setActiveProof({
      requestCode: tx.requestCode || tx.transactionRef,
      transactionRef: tx.transactionRef,
      merchantName: tx.merchantName,
      merchantCode: tx.merchantCode,
      amount: tx.amount,
      method: tx.paymentMethod,
      provider: tx.accountDetails.provider,
      accountNumber: tx.accountDetails.accountNumber,
      accountHolder: tx.accountDetails.accountHolder,
      trxId: tx.transactionRef,
      proofDocumentUrl: tx.proofDocumentUrl,
      proofDocumentName: tx.proofDocumentName,
      proofDocumentMime: tx.proofDocumentMime,
      proofChannel: tx.proofChannel,
      proofNotes: tx.proofNotes || tx.remarks,
      proofChecksum: tx.proofChecksum,
      paidAt: tx.paidAt,
      paidByAdminName: tx.paidByAdminName,
      status: tx.status,
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-navy-800 dark:text-white">
            Billing &amp; COD Settlement Ledger
          </h1>
          <p className="text-sm text-slate-600 dark:text-slate-300 mt-1">
            Live completed order remittances, return-window holds, and digital-proof verified payout vouchers.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/admin/payouts"
            className="px-3.5 py-2 rounded-xl bg-white dark:bg-navy-900 hover:bg-slate-100 dark:hover:bg-navy-800 border border-slate-300 dark:border-white/15 text-xs font-bold text-navy-800 dark:text-slate-100 flex items-center gap-2 shadow-sm transition-colors cursor-pointer"
          >
            <HandCoins className="w-4 h-4 text-orange-600 dark:text-orange-400" />
            <span>Merchant Payout Requests</span>
          </Link>

          <button
            type="button"
            onClick={() => {
              refetchSettlements();
              refetchOverview();
            }}
            disabled={isSettlementsFetching}
            className="px-3.5 py-2 rounded-xl bg-slate-100 dark:bg-navy-800 hover:bg-slate-200 dark:hover:bg-navy-700 border border-slate-300 dark:border-white/15 text-xs font-semibold text-navy-800 dark:text-slate-100 flex items-center gap-2 transition-all cursor-pointer"
          >
            <RefreshCw
              className={`w-3.5 h-3.5 text-slate-600 dark:text-slate-300 ${
                isSettlementsFetching ? 'animate-spin' : ''
              }`}
            />
            <span>Sync</span>
          </button>
        </div>
      </div>

      {/* Live Summary KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-5 rounded-2xl bg-white dark:bg-navy-900 border border-slate-200 dark:border-white/10 shadow-sm">
          <span className="text-xs uppercase font-bold tracking-wider text-slate-500 dark:text-slate-400 block">
            Completed Order Bill
          </span>
          <div className="text-2xl font-extrabold text-orange-600 dark:text-orange-400 mt-2 tabular-nums">
            ৳{stats.totalCodGross.toLocaleString()}
          </div>
          <span className="text-xs text-slate-500 dark:text-slate-400 mt-1 block">
            {stats.deliveredOrdersCount} delivered order(s)
          </span>
        </div>

        <div className="p-5 rounded-2xl bg-white dark:bg-navy-900 border border-slate-200 dark:border-white/10 shadow-sm">
          <span className="text-xs uppercase font-bold tracking-wider text-slate-500 dark:text-slate-400 block">
            Total Paid Out
          </span>
          <div className="text-2xl font-extrabold text-emerald-600 dark:text-emerald-400 mt-2 tabular-nums">
            ৳{stats.totalPaidAmount.toLocaleString()}
          </div>
          <span className="text-xs text-slate-500 dark:text-slate-400 mt-1 block">
            Settled with TrxID &amp; Digital Proof
          </span>
        </div>

        <div className="p-5 rounded-2xl bg-white dark:bg-navy-900 border border-slate-200 dark:border-white/10 shadow-sm">
          <span className="text-xs uppercase font-bold tracking-wider text-slate-500 dark:text-slate-400 block">
            Return Hold &amp; Claimable
          </span>
          <div className="text-2xl font-extrabold text-amber-600 dark:text-amber-400 mt-2 tabular-nums">
            ৳{stats.totalPendingHoldAndClaim.toLocaleString()}
          </div>
          <span className="text-xs text-slate-500 dark:text-slate-400 mt-1 block">
            Unclaimed merchant earnings
          </span>
        </div>

        <div className="p-5 rounded-2xl bg-white dark:bg-navy-900 border border-slate-200 dark:border-white/10 shadow-sm">
          <span className="text-xs uppercase font-bold tracking-wider text-slate-500 dark:text-slate-400 block">
            Settlement Vouchers
          </span>
          <div className="text-2xl font-extrabold text-navy-900 dark:text-white mt-2 tabular-nums">
            {stats.totalTransactions}
          </div>
          <span className="text-xs text-slate-500 dark:text-slate-400 mt-1 block">
            Audit-ready disbursement records
          </span>
        </div>
      </div>

      {/* Transactions Section */}
      <div className="p-4 sm:p-6 rounded-2xl bg-white dark:bg-navy-900 border border-slate-200 dark:border-white/10 shadow-xl space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 dark:border-white/10 pb-4">
          <div className="flex flex-wrap items-center gap-2.5">
            <h2 className="text-base font-bold text-navy-800 dark:text-white">
              Settlement Vouchers &amp; Digital Proof
            </h2>
            <span className="px-2.5 py-0.5 rounded-full text-xs tabular-nums font-bold bg-slate-100 dark:bg-navy-800 text-slate-700 dark:text-slate-200 border border-slate-300 dark:border-white/15">
              {filteredTransactions.length} records
            </span>
            {selectedMerchantFilter !== 'ALL' && (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30">
                <span>
                  {profilesByCode[selectedMerchantFilter]?.merchantName || selectedMerchantFilter}
                </span>
                <button
                  type="button"
                  onClick={() => setSelectedMerchantFilter('ALL')}
                  className="hover:text-navy-800 dark:hover:text-white cursor-pointer"
                  title="Remove filter"
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <div className="relative flex-1 sm:flex-initial min-w-[200px]">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 dark:text-slate-400" />
              <input
                type="text"
                placeholder="Search TrxID, Request, Merchant, A/C..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 rounded-xl bg-slate-50 dark:bg-navy-950 border border-slate-200 dark:border-white/10 text-xs text-navy-800 dark:text-slate-100 placeholder-slate-500 dark:placeholder-slate-400 focus:outline-none focus:border-orange-500"
              />
            </div>

            <MerchantSelectCombobox
              selectedMerchant={selectedMerchantFilter}
              onSelectMerchant={setSelectedMerchantFilter}
              merchants={merchantProfiles}
              transactions={transactions}
            />

            <select
              value={methodFilter}
              onChange={(e) => setMethodFilter(e.target.value as any)}
              className="px-3 py-1.5 rounded-xl bg-slate-50 dark:bg-navy-950 border border-slate-200 dark:border-white/10 text-xs text-slate-700 dark:text-slate-200 focus:outline-none focus:border-orange-500 font-medium cursor-pointer"
            >
              <option value="ALL">All Methods</option>
              <option value="BKASH">bKash</option>
              <option value="NAGAD">Nagad</option>
              <option value="ROCKET">Rocket</option>
              <option value="BANK_TRANSFER">Bank Transfer</option>
              <option value="CASH">Cash</option>
            </select>
          </div>
        </div>

        {/* 1. Mobile Collapsible List */}
        <div className="block md:hidden space-y-2.5">
          {isSettlementsLoading || isOverviewLoading ? (
            <div className="p-6 text-center text-xs text-slate-500">Loading settlements...</div>
          ) : filteredTransactions.length === 0 ? (
            <div className="p-6 text-center text-slate-500 dark:text-slate-400 font-sans text-xs">
              No settlement vouchers found yet.
            </div>
          ) : (
            filteredTransactions.map((tx) => {
              const isExpanded = expandedTxIds.has(tx.id);
              return (
                <div
                  key={tx.id}
                  className="rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50/60 dark:bg-navy-950/60 overflow-hidden shadow-sm"
                >
                  <div
                    onClick={() => toggleExpand(tx.id)}
                    className="p-3.5 flex items-start justify-between gap-3 cursor-pointer"
                  >
                    <div className="min-w-0 flex-1 space-y-1">
                      <div className="font-mono font-bold text-xs text-navy-800 dark:text-slate-100">
                        {tx.transactionRef}
                      </div>
                      <div className="text-xs font-semibold text-slate-700 dark:text-slate-200 truncate">
                        {tx.merchantName}{' '}
                        <span className="text-[11px] tabular-nums text-slate-500">
                          ({tx.merchantCode})
                        </span>
                      </div>
                      <div className="tabular-nums font-bold text-orange-600 dark:text-orange-400 text-sm">
                        ৳{tx.amount.toLocaleString()}
                      </div>
                    </div>

                    <div className="flex flex-col items-end justify-between self-stretch shrink-0">
                      <span
                        className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold border select-none ${
                          tx.status === 'PAID'
                            ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30'
                            : 'bg-amber-500/15 text-amber-600 dark:text-amber-300 border-amber-500/30'
                        }`}
                      >
                        {tx.status === 'PAID' ? <Check className="w-2.5 h-2.5" /> : <Clock className="w-2.5 h-2.5" />}
                        {tx.status}
                      </span>

                      <ChevronDown
                        className={`w-4 h-4 text-slate-500 transition-transform ${
                          isExpanded ? 'rotate-180 text-orange-600' : ''
                        }`}
                      />
                    </div>
                  </div>

                  {isExpanded && (
                    <div className="px-3.5 pb-3.5 pt-2 border-t border-slate-200/80 dark:border-white/10 bg-white/60 dark:bg-navy-900/60 text-xs space-y-2">
                      <div>Date: {tx.transactionDate}</div>
                      <div>
                        Destination: {tx.accountDetails.provider} · {tx.accountDetails.accountNumber}
                      </div>
                      {tx.proofDocumentUrl && (
                        <button
                          type="button"
                          onClick={() => openProofModal(tx)}
                          className="w-full py-2 rounded-lg bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30 font-bold flex items-center justify-center gap-1.5"
                        >
                          <ShieldCheck className="w-3.5 h-3.5" />
                          <span>View Digital Proof</span>
                        </button>
                      )}
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>

        {/* 2. Desktop Full Table */}
        <div className="hidden md:block rounded-xl border border-slate-200 dark:border-white/10 overflow-x-auto bg-slate-50/40 dark:bg-navy-950/40">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-100/80 dark:bg-navy-800/80 text-slate-600 dark:text-slate-300 uppercase tracking-wider font-semibold border-b border-slate-200 dark:border-white/10">
              <tr>
                <th className="p-3.5">TrxID / Voucher</th>
                <th className="p-3.5">Date &amp; Time</th>
                <th className="p-3.5">Merchant</th>
                <th className="p-3.5">Payment Method &amp; Account</th>
                <th className="p-3.5">Amount Paid</th>
                <th className="p-3.5 text-center">Status</th>
                <th className="p-3.5 text-right">Digital Proof</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-white/10 tabular-nums">
              {isSettlementsLoading ? (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-slate-500 font-sans">
                    Loading live settlement records...
                  </td>
                </tr>
              ) : filteredTransactions.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-slate-500 dark:text-slate-400 font-sans">
                    No settlement vouchers recorded yet. Approve &amp; pay a merchant payout request with Digital Proof to generate a voucher.
                  </td>
                </tr>
              ) : (
                filteredTransactions.map((tx) => (
                  <tr key={tx.id} className="hover:bg-slate-100/40 dark:hover:bg-navy-800/40 transition-colors">
                    <td className="p-3.5">
                      <span className="font-mono font-bold text-navy-800 dark:text-slate-100 block">
                        {tx.transactionRef}
                      </span>
                      {tx.requestCode && (
                        <span className="font-mono text-[11px] text-slate-500">{tx.requestCode}</span>
                      )}
                    </td>

                    <td className="p-3.5 font-sans text-slate-700 dark:text-slate-200 whitespace-nowrap">
                      {tx.transactionDate}
                    </td>

                    <td className="p-3.5 font-sans">
                      <span className="font-bold text-navy-800 dark:text-white block">{tx.merchantName}</span>
                      <span className="text-slate-600 dark:text-slate-300 tabular-nums text-xs block">
                        {tx.merchantCode}
                      </span>
                    </td>

                    <td className="p-3.5 font-sans text-slate-700 dark:text-slate-200">
                      <div>
                        <span className="font-semibold text-navy-800 dark:text-white">
                          {tx.accountDetails.provider}
                        </span>
                        <span className="text-slate-600 dark:text-slate-300">
                          {' '}
                          · {tx.accountDetails.accountNumber}
                        </span>
                      </div>
                      <span className="text-xs text-slate-500 dark:text-slate-400 block mt-0.5">
                        Owner: {tx.accountDetails.accountHolder}
                      </span>
                    </td>

                    <td className="p-3.5 font-bold text-orange-600 dark:text-orange-400 text-sm">
                      ৳{tx.amount.toLocaleString()}
                    </td>

                    <td className="p-3.5 font-sans text-center">
                      <span
                        className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] uppercase font-bold border select-none ${
                          tx.status === 'PAID'
                            ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30'
                            : 'bg-amber-500/15 text-amber-600 dark:text-amber-300 border-amber-500/30'
                        }`}
                      >
                        {tx.status === 'PAID' ? <Check className="w-3 h-3" /> : <Clock className="w-3 h-3" />}
                        {tx.status}
                      </span>
                    </td>

                    <td className="p-3.5 font-sans text-right">
                      {tx.proofDocumentUrl ? (
                        <button
                          type="button"
                          onClick={() => openProofModal(tx)}
                          className="px-3 py-1.5 rounded-lg bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30 text-[11px] font-bold inline-flex items-center gap-1 cursor-pointer"
                        >
                          <ShieldCheck className="w-3.5 h-3.5" />
                          <span>View Proof</span>
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

      {/* Digital Proof Modal */}
      <PayoutDigitalProofModal
        isOpen={Boolean(activeProof)}
        onClose={() => setActiveProof(null)}
        proof={activeProof}
      />
    </div>
  );
}
