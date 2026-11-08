'use client';

import React, { useState, useMemo, useEffect } from 'react';
import Link from 'next/link';
import {
  Search,
  RefreshCw,
  Check,
  ChevronDown,
  HandCoins,
  X,
} from 'lucide-react';
import { useSettlements } from '@/lib/hooks/useBilling';
import { MerchantFinancialProfile, SettlementTransaction, PaymentMethod } from './types';
import {
  INITIAL_SETTLEMENT_TRANSACTIONS,
  MERCHANT_FINANCIAL_PROFILES,
  STORAGE_KEY_BILLING_TRANSACTIONS,
  STORAGE_KEY_BILLING_PROFILES,
} from './mockData';
import { MerchantSelectCombobox } from './components/MerchantSelectCombobox';

export function AdminBillingManager() {
  const { data: serverSettlements, isLoading: isSettlementsLoading, refetch } = useSettlements();

  // Filters & Search
  const [selectedMerchantFilter, setSelectedMerchantFilter] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [methodFilter, setMethodFilter] = useState<'ALL' | PaymentMethod>('ALL');

  // Transactions & Profiles state (All payments are strictly PAID)
  const [transactions, setTransactions] = useState<SettlementTransaction[]>(INITIAL_SETTLEMENT_TRANSACTIONS);
  const [profiles, setProfiles] = useState<Record<string, MerchantFinancialProfile>>(MERCHANT_FINANCIAL_PROFILES);

  // Hydrate billing transactions & profiles from localStorage
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY_BILLING_TRANSACTIONS);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setTransactions(parsed.map((tx: SettlementTransaction) => ({ ...tx, status: 'PAID' })));
        }
      }
      const storedProfiles = localStorage.getItem(STORAGE_KEY_BILLING_PROFILES);
      if (storedProfiles) {
        const parsedP = JSON.parse(storedProfiles);
        if (parsedP && typeof parsedP === 'object') {
          setProfiles(parsedP);
        }
      }
    } catch (err) {
      console.error('Failed to load billing transactions:', err);
    }
  }, []);

  // Sync when payment requests are settled in other tabs
  useEffect(() => {
    const handleSync = () => {
      try {
        const stored = localStorage.getItem(STORAGE_KEY_BILLING_TRANSACTIONS);
        if (stored) {
          const parsed = JSON.parse(stored);
          if (Array.isArray(parsed) && parsed.length > 0) {
            setTransactions(parsed.map((tx: SettlementTransaction) => ({ ...tx, status: 'PAID' })));
          }
        }
        const storedProfiles = localStorage.getItem(STORAGE_KEY_BILLING_PROFILES);
        if (storedProfiles) {
          const parsedP = JSON.parse(storedProfiles);
          if (parsedP && typeof parsedP === 'object') {
            setProfiles(parsedP);
          }
        }
      } catch (err) {
        console.error('Failed to sync billing transactions:', err);
      }
    };
    window.addEventListener('fulfillio-warehouse-sync', handleSync);
    return () => window.removeEventListener('fulfillio-warehouse-sync', handleSync);
  }, []);

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

  // Top KPI Stats - All Transactions are Paid / Settled
  const stats = useMemo(() => {
    const totalTransactions = transactions.length;
    const totalPaidAmount = transactions.reduce((sum, t) => sum + t.amount, 0);
    const allProfiles = Object.values(profiles);
    const totalCodGross = allProfiles.reduce((sum, p) => sum + p.totalCodEarned, 0);
    const totalMerchants = allProfiles.length;

    return {
      totalCodGross,
      totalPaidAmount,
      totalTransactions,
      totalMerchants,
    };
  }, [transactions, profiles]);

  // Filtered transactions (All strictly PAID)
  const filteredTransactions = useMemo(() => {
    return transactions.filter((tx) => {
      const matchMerchant = selectedMerchantFilter === 'ALL' || tx.merchantCode === selectedMerchantFilter;
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

      return matchMerchant && matchMethod && matchSearch;
    });
  }, [transactions, selectedMerchantFilter, methodFilter, searchQuery]);

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-navy-800 dark:text-white">Billing &amp; COD Settlement</h1>
          <p className="text-sm text-slate-600 dark:text-slate-300 mt-1">
            Track all completed merchant COD payouts, settlement vouchers, and remittance records.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/admin/payouts"
            className="px-3.5 py-2 rounded-xl bg-white dark:bg-navy-900 hover:bg-slate-100 dark:hover:bg-navy-800 border border-slate-300 dark:border-white/15 text-xs font-bold text-navy-800 dark:text-slate-100 flex items-center gap-2 shadow-sm transition-colors cursor-pointer"
          >
            <HandCoins className="w-4 h-4 text-orange-600 dark:text-orange-400" />
            <span>Merchant Payment Requests</span>
          </Link>

          <button
            onClick={() => refetch()}
            disabled={isSettlementsLoading}
            className="px-3.5 py-2 rounded-xl bg-slate-100 dark:bg-navy-800 hover:bg-slate-200 dark:hover:bg-navy-700 border border-slate-300 dark:border-white/15 text-xs font-semibold text-navy-800 dark:text-slate-100 flex items-center gap-2 transition-all cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-slate-600 dark:text-slate-300 ${isSettlementsLoading ? 'animate-spin' : ''}`} />
            <span>Sync</span>
          </button>
        </div>
      </div>

      {/* Summary KPI Cards - All Statuses Paid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-5 rounded-2xl bg-white dark:bg-navy-900 border border-slate-200 dark:border-white/10 shadow-lg">
          <span className="text-xs uppercase font-bold tracking-wider text-slate-600 dark:text-slate-300 block">Total COD Collected</span>
          <div className="text-2xl font-extrabold text-orange-600 dark:text-orange-400 mt-2 tabular-nums">
            ৳{stats.totalCodGross.toLocaleString()}
          </div>
          <span className="text-xs text-slate-500 dark:text-slate-400 mt-1 block">Gross remittances collected</span>
        </div>

        <div className="p-5 rounded-2xl bg-white dark:bg-navy-900 border border-slate-200 dark:border-white/10 shadow-lg">
          <span className="text-xs uppercase font-bold tracking-wider text-slate-600 dark:text-slate-300 block">Total Paid Out</span>
          <div className="text-2xl font-extrabold text-navy-800 dark:text-white mt-2 tabular-nums">
            ৳{stats.totalPaidAmount.toLocaleString()}
          </div>
          <span className="text-xs text-orange-600 dark:text-orange-400 mt-1 block font-medium">100% settled payouts</span>
        </div>

        <div className="p-5 rounded-2xl bg-white dark:bg-navy-900 border border-slate-200 dark:border-white/10 shadow-lg">
          <span className="text-xs uppercase font-bold tracking-wider text-slate-600 dark:text-slate-300 block">Total Settlement Vouchers</span>
          <div className="text-2xl font-extrabold text-indigo-600 dark:text-indigo-400 mt-2 tabular-nums">
            {stats.totalTransactions}
          </div>
          <span className="text-xs text-slate-600 dark:text-slate-300 mt-1 block">Disbursement records</span>
        </div>

        <div className="p-5 rounded-2xl bg-white dark:bg-navy-900 border border-slate-200 dark:border-white/10 shadow-lg">
          <span className="text-xs uppercase font-bold tracking-wider text-slate-600 dark:text-slate-300 block">Active Merchants</span>
          <div className="text-2xl font-extrabold text-cyan-600 dark:text-cyan-400 mt-2 tabular-nums">
            {stats.totalMerchants}
          </div>
          <span className="text-xs text-slate-600 dark:text-slate-300 mt-1 block">Registered stores</span>
        </div>
      </div>

      {/* Transactions Section */}
      <div className="p-4 sm:p-6 rounded-2xl bg-white dark:bg-navy-900 border border-slate-200 dark:border-white/10 shadow-xl space-y-4">
        {/* Search & Filter Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 dark:border-white/10 pb-4">
          <div className="flex flex-wrap items-center gap-2.5">
            <h2 className="text-base font-bold text-navy-800 dark:text-white">Payment Transactions</h2>
            <span className="px-2.5 py-0.5 rounded-full text-xs tabular-nums font-bold bg-slate-100 dark:bg-navy-800 text-slate-700 dark:text-slate-200 border border-slate-300 dark:border-white/15">
              {filteredTransactions.length} records
            </span>
            {selectedMerchantFilter !== 'ALL' && (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30">
                <span>{profiles[selectedMerchantFilter]?.merchantName || selectedMerchantFilter}</span>
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
            {/* Search */}
            <div className="relative flex-1 sm:flex-initial min-w-[200px]">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 dark:text-slate-400" />
              <input
                type="text"
                placeholder="Search ID, Merchant, A/C..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 rounded-xl bg-slate-50 dark:bg-navy-950 border border-slate-200 dark:border-white/10 text-xs text-navy-800 dark:text-slate-100 placeholder-slate-500 dark:placeholder-slate-400 focus:outline-none focus:border-orange-500"
              />
            </div>

            {/* Searchable Merchant Combobox */}
            <MerchantSelectCombobox
              selectedMerchant={selectedMerchantFilter}
              onSelectMerchant={setSelectedMerchantFilter}
              merchants={Object.values(profiles)}
              transactions={transactions}
            />

            {/* Method Filter */}
            <select
              value={methodFilter}
              onChange={(e) => setMethodFilter(e.target.value as any)}
              className="px-3 py-1.5 rounded-xl bg-slate-50 dark:bg-navy-950 border border-slate-200 dark:border-white/10 text-xs text-slate-700 dark:text-slate-200 focus:outline-none focus:border-orange-500 font-medium"
            >
              <option value="ALL">All Methods</option>
              <option value="BKASH">bKash</option>
              <option value="BANK_TRANSFER">Bank Transfer</option>
              <option value="NAGAD">Nagad</option>
              <option value="CASH">Cash</option>
            </select>
          </div>
        </div>

        {/* 1. Mobile Collapsible List (Visible on mobile screens) */}
        <div className="block md:hidden space-y-2.5">
          {filteredTransactions.length === 0 ? (
            <div className="p-6 text-center text-slate-500 dark:text-slate-400 font-sans text-xs">
              No transactions found.
            </div>
          ) : (
            filteredTransactions.map((tx) => {
              const isExpanded = expandedTxIds.has(tx.id);
              return (
                <div
                  key={tx.id}
                  className="rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50/60 dark:bg-navy-950/60 overflow-hidden transition-all shadow-sm"
                >
                  {/* Collapsed Header Summary: 3 Rows on Left & Status + Button on Right */}
                  <div
                    onClick={() => toggleExpand(tx.id)}
                    className="p-3.5 flex items-start justify-between gap-3 cursor-pointer hover:bg-slate-100/40 dark:hover:bg-navy-800/40 select-none transition-colors"
                  >
                    {/* Left Side: 3 Distinct Rows */}
                    <div className="min-w-0 flex-1 space-y-1">
                      {/* Row 1: Only Transaction ID */}
                      <div className="tabular-nums font-bold text-xs text-navy-800 dark:text-slate-100 tracking-wide">
                        {tx.transactionRef}
                      </div>

                      {/* Row 2: Merchant Name */}
                      <div className="text-xs font-semibold text-slate-700 dark:text-slate-200 truncate">
                        {tx.merchantName} <span className="text-[11px] tabular-nums text-slate-600 dark:text-slate-300">({tx.merchantCode})</span>
                      </div>

                      {/* Row 3: Amount Paid */}
                      <div className="tabular-nums font-bold text-orange-600 dark:text-orange-400 text-sm pt-0.5">
                        ৳{tx.amount.toLocaleString()}
                      </div>
                    </div>

                    {/* Right Side: Status Tag on Top Right Corner & Toggle Button Below */}
                    <div className="flex flex-col items-end justify-between self-stretch shrink-0">
                      {/* Top Right: Status Badge */}
                      <div>
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30">
                          <Check className="w-2.5 h-2.5" /> PAID
                        </span>
                      </div>

                      {/* Bottom Right: Toggle Chevron Button */}
                      <button
                        type="button"
                        aria-label="Toggle details"
                        className="p-1 rounded-lg bg-navy-800 dark:bg-navy-700 text-slate-600 dark:text-slate-300 hover:text-white transition-colors"
                      >
                        <ChevronDown
                          className={`w-4 h-4 transition-transform duration-200 ${
                            isExpanded ? 'rotate-180 text-orange-600 dark:text-orange-400' : ''
                          }`}
                        />
                      </button>
                    </div>
                  </div>

                  {/* Expanded Row Details */}
                  {isExpanded && (
                    <div className="px-3.5 pb-3.5 pt-2 border-t border-slate-200/80 dark:border-white/10 bg-white/60 dark:bg-navy-900/60 text-xs space-y-2.5 animate-in fade-in-50 duration-150">
                      <div className="grid grid-cols-2 gap-2 text-xs pt-1">
                        <div>
                          <span className="text-slate-600 dark:text-slate-300 block text-[11px] uppercase font-semibold">Date &amp; Time</span>
                          <span className="text-navy-800 dark:text-slate-100 font-sans">{tx.transactionDate}</span>
                        </div>
                        <div>
                          <span className="text-slate-600 dark:text-slate-300 block text-[11px] uppercase font-semibold">Account Owner</span>
                          <span className="text-navy-800 dark:text-slate-100 font-sans">{tx.accountDetails.accountHolder}</span>
                        </div>
                      </div>

                      <div className="p-2.5 rounded-lg bg-slate-50 dark:bg-navy-950 border border-slate-200 dark:border-white/10 text-xs">
                        <span className="text-slate-600 dark:text-slate-300 block text-[11px] uppercase font-semibold">Payment Destination</span>
                        <span className="font-semibold text-navy-800 dark:text-white mt-0.5 block">
                          {tx.accountDetails.provider} · {tx.accountDetails.accountNumber}
                        </span>
                        {tx.remarks && (
                          <span className="text-slate-600 dark:text-slate-300 block mt-1 text-[11px] font-sans">
                            Note: {tx.remarks}
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
        <div className="hidden md:block rounded-xl border border-slate-200 dark:border-white/10 overflow-x-auto bg-slate-50/40 dark:bg-navy-950/40">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-100/80 dark:bg-navy-800/80 text-slate-600 dark:text-slate-300 uppercase tracking-wider font-semibold border-b border-slate-200 dark:border-white/10">
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
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-white/10 tabular-nums">
              {filteredTransactions.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-slate-500 dark:text-slate-400 font-sans">
                    No transactions found.
                  </td>
                </tr>
              ) : (
                filteredTransactions.map((tx) => (
                  <tr key={tx.id} className="hover:bg-slate-100/40 dark:hover:bg-navy-800/40 transition-colors">
                    {/* 1. Transaction ID */}
                    <td className="p-3.5 font-bold text-navy-800 dark:text-slate-100">
                      {tx.transactionRef}
                    </td>

                    {/* 2. Date & Time */}
                    <td className="p-3.5 font-sans text-slate-700 dark:text-slate-200 whitespace-nowrap">
                      {tx.transactionDate}
                    </td>

                    {/* 3. Merchant Name */}
                    <td className="p-3.5 font-sans">
                      <span className="font-bold text-navy-800 dark:text-white block">{tx.merchantName}</span>
                      <span className="text-slate-600 dark:text-slate-300 tabular-nums text-xs block">{tx.merchantCode}</span>
                    </td>

                    {/* 4. Payment Method, Account & Owner */}
                    <td className="p-3.5 font-sans text-slate-700 dark:text-slate-200">
                      <div>
                        <span className="font-semibold text-navy-800 dark:text-white">{tx.accountDetails.provider}</span>
                        <span className="text-slate-600 dark:text-slate-300"> · {tx.accountDetails.accountNumber}</span>
                      </div>
                      <span className="text-xs text-slate-600 dark:text-slate-300 block mt-0.5">
                        Owner: {tx.accountDetails.accountHolder}
                      </span>
                    </td>

                    {/* 5. Amount Paid */}
                    <td className="p-3.5 font-bold text-orange-600 dark:text-orange-400 text-sm">
                      ৳{tx.amount.toLocaleString()}
                    </td>

                    {/* 6. Status */}
                    <td className="p-3.5 font-sans">
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30">
                        <Check className="w-3 h-3" />
                        PAID
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
