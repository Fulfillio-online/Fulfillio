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
          <h1 className="text-2xl font-bold tracking-tight text-white">Billing &amp; COD Settlement</h1>
          <p className="text-sm text-slate-400 mt-1">
            Track all completed merchant COD payouts, settlement vouchers, and remittance records.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/admin/payouts"
            className="px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-xs font-bold text-slate-200 flex items-center gap-2 shadow-sm transition-colors cursor-pointer"
          >
            <HandCoins className="w-4 h-4 text-emerald-400" />
            <span>Merchant Payment Requests</span>
          </Link>

          <button
            onClick={() => refetch()}
            disabled={isSettlementsLoading}
            className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-xs font-semibold text-slate-200 flex items-center gap-2 transition-all cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-slate-400 ${isSettlementsLoading ? 'animate-spin' : ''}`} />
            <span>Sync</span>
          </button>
        </div>
      </div>

      {/* Summary KPI Cards - All Statuses Paid */}
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
          <span className="text-xs text-emerald-400 mt-1 block font-medium">100% settled payouts</span>
        </div>

        <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 shadow-lg">
          <span className="text-[11px] uppercase font-bold tracking-wider text-slate-400 block">Total Settlement Vouchers</span>
          <div className="text-2xl font-black text-indigo-400 mt-2 font-mono">
            {stats.totalTransactions}
          </div>
          <span className="text-xs text-slate-400 mt-1 block">Disbursement records</span>
        </div>

        <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 shadow-lg">
          <span className="text-[11px] uppercase font-bold tracking-wider text-slate-400 block">Active Merchants</span>
          <div className="text-2xl font-black text-cyan-400 mt-2 font-mono">
            {stats.totalMerchants}
          </div>
          <span className="text-xs text-slate-400 mt-1 block">Registered stores</span>
        </div>
      </div>

      {/* Transactions Section */}
      <div className="p-4 sm:p-6 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl space-y-4">
        {/* Search & Filter Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
          <div className="flex flex-wrap items-center gap-2.5">
            <h2 className="text-base font-bold text-white">Payment Transactions</h2>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-mono font-bold bg-slate-800 text-slate-300 border border-slate-700">
              {filteredTransactions.length} records
            </span>
            {selectedMerchantFilter !== 'ALL' && (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
                <span>{profiles[selectedMerchantFilter]?.merchantName || selectedMerchantFilter}</span>
                <button
                  type="button"
                  onClick={() => setSelectedMerchantFilter('ALL')}
                  className="hover:text-white cursor-pointer"
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
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
              <input
                type="text"
                placeholder="Search ID, Merchant, A/C..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-emerald-500"
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
              className="px-3 py-1.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-300 focus:outline-none focus:border-emerald-500 font-medium"
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
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                          <Check className="w-2.5 h-2.5" /> PAID
                        </span>
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
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800 font-mono">
              {filteredTransactions.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-slate-500 font-sans">
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

                    {/* 6. Status */}
                    <td className="p-3.5 font-sans">
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
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
