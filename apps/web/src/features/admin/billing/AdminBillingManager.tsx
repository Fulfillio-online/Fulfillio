'use client';

import React, { useState, useMemo } from 'react';
import {
  CreditCard,
  Landmark,
  CheckCircle2,
  Clock,
  Search,
  DollarSign,
  Calendar,
  RefreshCw,
  Plus,
  Check,
  Building2,
  Smartphone,
  ChevronDown,
} from 'lucide-react';
import { useSettlements, useRecordDisbursement, useMarkSettlementPaid } from '@/lib/hooks/useBilling';
import { MerchantFinancialProfile, SettlementTransaction, PaymentMethod, PaymentStatus } from './types';
import { INITIAL_SETTLEMENT_TRANSACTIONS, MERCHANT_FINANCIAL_PROFILES } from './mockData';
import { Modal } from '@/components/ui/Modal';

export function AdminBillingManager() {
  const { data: serverSettlements, isLoading: isSettlementsLoading, refetch } = useSettlements();
  const recordDisbursementMutation = useRecordDisbursement();
  const markSettlementPaidMutation = useMarkSettlementPaid();

  // Filters & Search
  const [selectedMerchantFilter, setSelectedMerchantFilter] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | PaymentStatus>('ALL');
  const [methodFilter, setMethodFilter] = useState<'ALL' | PaymentMethod>('ALL');

  // Transactions & Profiles state
  const [transactions, setTransactions] = useState<SettlementTransaction[]>(INITIAL_SETTLEMENT_TRANSACTIONS);
  const [profiles, setProfiles] = useState<Record<string, MerchantFinancialProfile>>(MERCHANT_FINANCIAL_PROFILES);

  // Mobile Collapsible Row Expanded state
  const [expandedTxIds, setExpandedTxIds] = useState<Set<string>>(new Set());

  const toggleExpand = (id: string) => {
    setExpandedTxIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  // New Payout Modal State
  const [isDisburseModalOpen, setIsDisburseModalOpen] = useState(false);
  const [formMerchantCode, setFormMerchantCode] = useState<string>('MC-101');
  const [formAmount, setFormAmount] = useState<string>('5000');
  const [formMethod, setFormMethod] = useState<PaymentMethod>('BKASH');
  const [formDate, setFormDate] = useState<string>(() => new Date().toISOString().slice(0, 10));
  const [formRemarks, setFormRemarks] = useState('');

  // Top KPI Stats
  const stats = useMemo(() => {
    const totalTransactions = transactions.length;
    const totalPaidAmount = transactions
      .filter((t) => t.status === 'PAID')
      .reduce((sum, t) => sum + t.amount, 0);
    const totalUnpaidAmount = transactions
      .filter((t) => t.status === 'UNPAID')
      .reduce((sum, t) => sum + t.amount, 0);
    const allProfiles = Object.values(profiles);
    const totalCodGross = allProfiles.reduce((sum, p) => sum + p.totalCodEarned, 0);

    return {
      totalCodGross,
      totalPaidAmount,
      totalUnpaidAmount,
      totalTransactions,
    };
  }, [transactions, profiles]);

  // Filtered transactions
  const filteredTransactions = useMemo(() => {
    return transactions.filter((tx) => {
      const matchMerchant = selectedMerchantFilter === 'ALL' || tx.merchantCode === selectedMerchantFilter;
      const matchStatus = statusFilter === 'ALL' || tx.status === statusFilter;
      const matchMethod = methodFilter === 'ALL' || tx.paymentMethod === methodFilter;
      const query = searchQuery.toLowerCase().trim();
      const matchSearch =
        !query ||
        tx.transactionRef.toLowerCase().includes(query) ||
        tx.merchantName.toLowerCase().includes(query) ||
        tx.merchantCode.toLowerCase().includes(query) ||
        tx.accountDetails.accountNumber.includes(query) ||
        tx.accountDetails.provider.toLowerCase().includes(query) ||
        tx.transactionDate.toLowerCase().includes(query);

      return matchMerchant && matchStatus && matchMethod && matchSearch;
    });
  }, [transactions, selectedMerchantFilter, statusFilter, methodFilter, searchQuery]);

  // Mark transaction as Paid
  const handleMarkAsPaid = async (txId: string) => {
    const targetTx = transactions.find((t) => t.id === txId);
    if (!targetTx) return;

    if (targetTx.settlementId) {
      try {
        await markSettlementPaidMutation.mutateAsync(targetTx.settlementId);
      } catch {
        // Fallback locally
      }
    }

    setTransactions((prev) =>
      prev.map((item) =>
        item.id === txId
          ? {
              ...item,
              status: 'PAID',
            }
          : item
      )
    );
  };

  // Submit New Disbursement
  const handleCreateDisbursement = async (e: React.FormEvent) => {
    e.preventDefault();
    const currentMerchant = profiles[formMerchantCode];
    if (!currentMerchant) return;

    const amt = parseFloat(formAmount) || 0;
    if (amt <= 0) {
      alert('Please enter a valid amount.');
      return;
    }

    let provider = currentMerchant.payoutAccount.provider;
    let accNumber = currentMerchant.payoutAccount.accountNumber;

    if (formMethod === 'BKASH') {
      provider = 'bKash';
      accNumber = currentMerchant.payoutAccount.bkashNumber || '01712-345678';
    } else if (formMethod === 'NAGAD') {
      provider = 'Nagad';
      accNumber = currentMerchant.phone;
    } else if (formMethod === 'CASH') {
      provider = 'Cash Handover';
      accNumber = 'Counter Cash';
    }

    const formattedDate = new Date(formDate).toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });

    const newTx: SettlementTransaction = {
      id: `tx-${Date.now()}`,
      transactionRef: `TXN-${formDate.replace(/-/g, '')}-${Math.floor(100 + Math.random() * 900)}`,
      merchantId: currentMerchant.merchantId,
      merchantCode: currentMerchant.merchantCode,
      merchantName: currentMerchant.merchantName,
      ownerName: currentMerchant.ownerName,
      transactionDate: `${formattedDate}, ${new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true })}`,
      paymentMethod: formMethod,
      accountDetails: {
        provider,
        accountNumber: accNumber,
        accountHolder: currentMerchant.ownerName,
      },
      amount: amt,
      status: 'PAID',
      remarks: formRemarks || 'Payment disbursed by Admin',
    };

    setTransactions((prev) => [newTx, ...prev]);

    // Update profile
    setProfiles((prev) => ({
      ...prev,
      [formMerchantCode]: {
        ...prev[formMerchantCode],
        totalPaid: prev[formMerchantCode].totalPaid + amt,
        unpaidBalance: Math.max(0, prev[formMerchantCode].unpaidBalance - amt),
        withdrawalsCount: prev[formMerchantCode].withdrawalsCount + 1,
      },
    }));

    try {
      await recordDisbursementMutation.mutateAsync({
        merchantId: currentMerchant.merchantId,
        amount: amt,
        paymentMethod: formMethod,
        paidAt: formDate,
        notes: formRemarks,
      });
    } catch {
      // Local fallback
    }

    setIsDisburseModalOpen(false);
    setFormRemarks('');
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white">Billing &amp; COD Settlement</h1>
          <p className="text-sm text-slate-400 mt-1">
            Track all merchant COD payouts, partial withdrawals, and payment statuses.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => refetch()}
            disabled={isSettlementsLoading}
            className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-xs font-semibold text-slate-200 flex items-center gap-2 transition-all cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-slate-400 ${isSettlementsLoading ? 'animate-spin' : ''}`} />
            <span>Sync</span>
          </button>

          <button
            onClick={() => setIsDisburseModalOpen(true)}
            className="px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-white text-xs font-bold shadow-lg shadow-emerald-900/30 flex items-center gap-2 transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Record Payment</span>
          </button>
        </div>
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 shadow-lg">
          <span className="text-[11px] uppercase font-bold tracking-wider text-slate-400 block">Total COD Collected</span>
          <div className="text-2xl font-black text-emerald-400 mt-2 font-mono">
            ৳{stats.totalCodGross.toLocaleString()}
          </div>
          <span className="text-xs text-slate-500 mt-1 block">Gross remittances collected</span>
        </div>

        <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 shadow-lg">
          <span className="text-[11px] uppercase font-bold tracking-wider text-slate-400 block">Total Paid Out</span>
          <div className="text-2xl font-black text-white mt-2 font-mono">
            ৳{stats.totalPaidAmount.toLocaleString()}
          </div>
          <span className="text-xs text-emerald-400 mt-1 block font-medium">Successfully disbursed</span>
        </div>

        <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 shadow-lg">
          <span className="text-[11px] uppercase font-bold tracking-wider text-slate-400 block">Unpaid / Pending</span>
          <div className="text-2xl font-black text-amber-400 mt-2 font-mono">
            ৳{stats.totalUnpaidAmount.toLocaleString()}
          </div>
          <span className="text-xs text-slate-400 mt-1 block">Awaiting payment confirmation</span>
        </div>

        <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 shadow-lg">
          <span className="text-[11px] uppercase font-bold tracking-wider text-slate-400 block">Total Transactions</span>
          <div className="text-2xl font-black text-indigo-400 mt-2 font-mono">
            {stats.totalTransactions}
          </div>
          <span className="text-xs text-slate-400 mt-1 block">Disbursement vouchers</span>
        </div>
      </div>

      {/* Merchant Quick Filter Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
        <button
          onClick={() => setSelectedMerchantFilter('ALL')}
          className={`px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer border ${
            selectedMerchantFilter === 'ALL'
              ? 'bg-emerald-500 text-slate-950 border-emerald-400 shadow-md'
              : 'bg-slate-900 hover:bg-slate-800 text-slate-300 border-slate-800'
          }`}
        >
          All Merchants ({transactions.length})
        </button>

        {Object.values(profiles).map((m) => {
          const isSelected = selectedMerchantFilter === m.merchantCode;
          const count = transactions.filter((t) => t.merchantCode === m.merchantCode).length;
          return (
            <button
              key={m.merchantCode}
              onClick={() => setSelectedMerchantFilter(m.merchantCode)}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer border ${
                isSelected
                  ? 'bg-emerald-500 text-slate-950 border-emerald-400 shadow-md'
                  : 'bg-slate-900 hover:bg-slate-800 text-slate-300 border-slate-800'
              }`}
            >
              {m.merchantCode} · {m.merchantName} ({count})
            </button>
          );
        })}
      </div>

      {/* Transactions Section */}
      <div className="p-4 sm:p-6 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl space-y-4">
        {/* Search & Filter Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
          <div className="flex items-center gap-3">
            <h2 className="text-base font-bold text-white">Payment Transactions</h2>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-mono font-bold bg-slate-800 text-slate-300 border border-slate-700">
              {filteredTransactions.length} records
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            {/* Search */}
            <div className="relative flex-1 sm:flex-initial min-w-[200px]">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
              <input
                type="text"
                placeholder="Search ID, Merchant, A/C..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-emerald-500"
              />
            </div>

            {/* Method Filter */}
            <select
              value={methodFilter}
              onChange={(e) => setMethodFilter(e.target.value as any)}
              className="px-3 py-1.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-300 focus:outline-none focus:border-emerald-500 font-medium"
            >
              <option value="ALL">All Methods</option>
              <option value="BKASH">bKash</option>
              <option value="BANK_TRANSFER">Bank Transfer</option>
              <option value="NAGAD">Nagad</option>
              <option value="CASH">Cash</option>
            </select>

            {/* Status Filter */}
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as any)}
              className="px-3 py-1.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-300 focus:outline-none focus:border-emerald-500 font-medium"
            >
              <option value="ALL">All Status</option>
              <option value="PAID">Paid</option>
              <option value="UNPAID">Unpaid</option>
            </select>
          </div>
        </div>

        {/* 1. Mobile Collapsible List (Visible on mobile screens) */}
        <div className="block md:hidden space-y-2.5">
          {filteredTransactions.length === 0 ? (
            <div className="p-6 text-center text-slate-500 font-sans text-xs">
              No transactions found.
            </div>
          ) : (
            filteredTransactions.map((tx) => {
              const isExpanded = expandedTxIds.has(tx.id);
              return (
                <div
                  key={tx.id}
                  className="rounded-xl border border-slate-800 bg-slate-950/60 overflow-hidden transition-all shadow-sm"
                >
                  {/* Collapsed Header Summary: 3 Rows on Left & Status + Button on Right */}
                  <div
                    onClick={() => toggleExpand(tx.id)}
                    className="p-3.5 flex items-start justify-between gap-3 cursor-pointer hover:bg-slate-800/40 select-none transition-colors"
                  >
                    {/* Left Side: 3 Distinct Rows */}
                    <div className="min-w-0 flex-1 space-y-1">
                      {/* Row 1: Only Transaction ID */}
                      <div className="font-mono font-bold text-xs text-slate-200 tracking-wide">
                        {tx.transactionRef}
                      </div>

                      {/* Row 2: Merchant Name */}
                      <div className="text-xs font-semibold text-slate-300 truncate">
                        {tx.merchantName} <span className="text-[10px] font-mono text-slate-400">({tx.merchantCode})</span>
                      </div>

                      {/* Row 3: Amount Paid */}
                      <div className="font-mono font-bold text-emerald-400 text-sm pt-0.5">
                        ৳{tx.amount.toLocaleString()}
                      </div>
                    </div>

                    {/* Right Side: Status Tag on Top Right Corner & Toggle Button Below */}
                    <div className="flex flex-col items-end justify-between self-stretch shrink-0">
                      {/* Top Right: Status Badge */}
                      <div>
                        {tx.status === 'PAID' ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                            <Check className="w-2.5 h-2.5" /> PAID
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/15 text-amber-300 border border-amber-500/30">
                            UNPAID
                          </span>
                        )}
                      </div>

                      {/* Bottom Right: Toggle Chevron Button */}
                      <button
                        type="button"
                        aria-label="Toggle details"
                        className="p-1 rounded-lg bg-slate-800 text-slate-400 hover:text-white transition-colors"
                      >
                        <ChevronDown
                          className={`w-4 h-4 transition-transform duration-200 ${
                            isExpanded ? 'rotate-180 text-emerald-400' : ''
                          }`}
                        />
                      </button>
                    </div>
                  </div>

                  {/* Expanded Row Details */}
                  {isExpanded && (
                    <div className="px-3.5 pb-3.5 pt-2 border-t border-slate-800/80 bg-slate-900/60 text-xs space-y-2.5 animate-in fade-in-50 duration-150">
                      <div className="grid grid-cols-2 gap-2 text-[11px] pt-1">
                        <div>
                          <span className="text-slate-400 block text-[10px] uppercase font-semibold">Date &amp; Time</span>
                          <span className="text-slate-200 font-sans">{tx.transactionDate}</span>
                        </div>
                        <div>
                          <span className="text-slate-400 block text-[10px] uppercase font-semibold">Account Owner</span>
                          <span className="text-slate-200 font-sans">{tx.accountDetails.accountHolder}</span>
                        </div>
                      </div>

                      <div className="p-2.5 rounded-lg bg-slate-950 border border-slate-800 text-[11px]">
                        <span className="text-slate-400 block text-[10px] uppercase font-semibold">Payment Destination</span>
                        <span className="font-semibold text-white mt-0.5 block">
                          {tx.accountDetails.provider} · {tx.accountDetails.accountNumber}
                        </span>
                        {tx.remarks && (
                          <span className="text-slate-400 block mt-1 text-[10px] font-sans">
                            Note: {tx.remarks}
                          </span>
                        )}
                      </div>

                      {/* Action Button on Mobile */}
                      <div className="pt-1 flex items-center justify-between">
                        <span className="text-[11px] text-slate-400">Payment Action:</span>
                        {tx.status === 'UNPAID' ? (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleMarkAsPaid(tx.id);
                            }}
                            className="px-4 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-md transition-colors cursor-pointer"
                          >
                            Mark as Paid
                          </button>
                        ) : (
                          <span className="text-xs text-slate-400 font-medium inline-flex items-center gap-1">
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                            Settled
                          </span>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>

        {/* 2. Desktop Full Table (Visible on md screens and larger) */}
        <div className="hidden md:block rounded-xl border border-slate-800 overflow-x-auto bg-slate-950/40">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-800/80 text-slate-400 uppercase tracking-wider font-semibold border-b border-slate-800">
              <tr>
                {/* 1st column: Transaction ID */}
                <th className="p-3.5">Transaction ID</th>
                {/* 2nd column: Date & Time */}
                <th className="p-3.5">Date &amp; Time</th>
                {/* 3rd column: Merchant */}
                <th className="p-3.5">Merchant</th>
                {/* 4th column: Payment Method & Details */}
                <th className="p-3.5">Payment Method &amp; Account</th>
                {/* 5th column: Amount */}
                <th className="p-3.5">Amount Paid</th>
                {/* 6th column: Status */}
                <th className="p-3.5">Status</th>
                {/* 7th column: Action Button */}
                <th className="p-3.5 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800 font-mono">
              {filteredTransactions.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-slate-500 font-sans">
                    No transactions found.
                  </td>
                </tr>
              ) : (
                filteredTransactions.map((tx) => (
                  <tr key={tx.id} className="hover:bg-slate-800/40 transition-colors">
                    {/* 1. Transaction ID */}
                    <td className="p-3.5 font-bold text-slate-200">
                      {tx.transactionRef}
                    </td>

                    {/* 2. Date & Time */}
                    <td className="p-3.5 font-sans text-slate-300 whitespace-nowrap">
                      {tx.transactionDate}
                    </td>

                    {/* 3. Merchant Name */}
                    <td className="p-3.5 font-sans">
                      <span className="font-bold text-white block">{tx.merchantName}</span>
                      <span className="text-slate-400 font-mono text-[11px] block">{tx.merchantCode}</span>
                    </td>

                    {/* 4. Payment Method, Account & Owner */}
                    <td className="p-3.5 font-sans text-slate-300">
                      <div>
                        <span className="font-semibold text-white">{tx.accountDetails.provider}</span>
                        <span className="text-slate-400"> · {tx.accountDetails.accountNumber}</span>
                      </div>
                      <span className="text-[11px] text-slate-400 block mt-0.5">
                        Owner: {tx.accountDetails.accountHolder}
                      </span>
                    </td>

                    {/* 5. Amount Paid */}
                    <td className="p-3.5 font-bold text-emerald-400 text-sm">
                      ৳{tx.amount.toLocaleString()}
                    </td>

                    {/* 6. Status (Paid vs Unpaid) */}
                    <td className="p-3.5 font-sans">
                      {tx.status === 'PAID' ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                          <Check className="w-3 h-3" />
                          PAID
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-amber-500/15 text-amber-300 border border-amber-500/30">
                          UNPAID
                        </span>
                      )}
                    </td>

                    {/* 7. Action Button */}
                    <td className="p-3.5 text-right font-sans">
                      {tx.status === 'UNPAID' ? (
                        <button
                          type="button"
                          onClick={() => handleMarkAsPaid(tx.id)}
                          className="px-3.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-md transition-colors cursor-pointer"
                        >
                          Mark as Paid
                        </button>
                      ) : (
                        <span className="text-xs text-slate-500 font-medium inline-flex items-center gap-1">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                          Settled
                        </span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Record Payment Modal */}
      <Modal
        isOpen={isDisburseModalOpen}
        onClose={() => setIsDisburseModalOpen(false)}
        title="Record Merchant Payment"
        subtitle="Disburse funds to merchant and record transaction"
        size="md"
      >
        <form onSubmit={handleCreateDisbursement} className="space-y-4 text-xs font-sans">
          <div>
            <label className="block text-slate-300 font-semibold mb-1">Select Merchant</label>
            <select
              value={formMerchantCode}
              onChange={(e) => {
                const code = e.target.value;
                setFormMerchantCode(code);
                const target = profiles[code];
                if (target?.payoutAccount.bkashNumber) {
                  setFormMethod('BKASH');
                } else {
                  setFormMethod('BANK_TRANSFER');
                }
              }}
              className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white font-medium focus:outline-none focus:border-emerald-500"
            >
              {Object.values(profiles).map((m) => (
                <option key={m.merchantCode} value={m.merchantCode}>
                  {m.merchantCode} · {m.merchantName} (Owner: {m.ownerName})
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-300 font-semibold mb-1">Amount to Pay (৳)</label>
              <input
                type="number"
                placeholder="e.g. 5000"
                value={formAmount}
                onChange={(e) => setFormAmount(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white font-mono text-sm focus:outline-none focus:border-emerald-500"
                required
              />
            </div>

            <div>
              <label className="block text-slate-300 font-semibold mb-1">Payment Method</label>
              <select
                value={formMethod}
                onChange={(e) => setFormMethod(e.target.value as any)}
                className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:border-emerald-500 font-medium"
              >
                <option value="BKASH">bKash</option>
                <option value="BANK_TRANSFER">Bank Transfer</option>
                <option value="NAGAD">Nagad</option>
                <option value="CASH">Cash</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-slate-300 font-semibold mb-1">Payment Date</label>
            <input
              type="date"
              value={formDate}
              onChange={(e) => setFormDate(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white font-mono focus:outline-none focus:border-emerald-500"
              required
            />
          </div>

          <div>
            <label className="block text-slate-300 font-semibold mb-1">Remarks (Optional)</label>
            <input
              type="text"
              placeholder="e.g. Partial COD disbursement"
              value={formRemarks}
              onChange={(e) => setFormRemarks(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:border-emerald-500"
            />
          </div>

          <div className="flex justify-end gap-3 pt-3">
            <button
              type="button"
              onClick={() => setIsDisburseModalOpen(false)}
              className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold shadow-lg shadow-emerald-900/30 cursor-pointer"
            >
              Confirm Payment
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
