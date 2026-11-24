'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import {
  TrendingUp,
  TrendingDown,
  CheckCircle2,
  AlertTriangle,
  Plus,
  Building2,
  Users,
  Truck,
  Box,
  Cpu,
  Receipt,
  MoreVertical,
  Edit2,
  Trash2,
  Search,
  Info,
  Warehouse,
  Sparkles,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import {
  AdminFinanceAnalyticsDto,
  CompanyFinanceEntryDto,
  FinanceEntryCategory,
  FinanceEntryType,
} from '@fulfillio/contracts';
import { useDeleteFinanceEntry } from '@/lib/hooks/useBilling';

interface CompanyProfitLossSectionProps {
  companyProfitLoss: AdminFinanceAnalyticsDto['companyProfitLoss'];
  ledgerEntries: CompanyFinanceEntryDto[];
  periodLabel: string;
  onOpenNewEntry: (defaultType: FinanceEntryType) => void;
  onEditEntry: (entry: CompanyFinanceEntryDto) => void;
}

const CATEGORY_LABELS: Record<FinanceEntryCategory, string> = {
  RENT: 'Rent',
  SALARY: 'Salary',
  COURIER_COST: 'Courier Cost',
  PACKAGING_PURCHASE: 'Packaging Buy',
  UTILITY_MISC: 'Utility / Misc',
  STORAGE_FEE: 'Storage Fee',
  OTHER_INCOME: 'Other Income',
};

const EXPENSE_ICON_MAP: Record<string, React.ComponentType<{ className?: string }>> = {
  RENT: Building2,
  SALARY: Users,
  COURIER_COST: Truck,
  PACKAGING_PURCHASE: Box,
  UTILITY_MISC: Cpu,
};

function formatTaka(val: number): string {
  return `৳${Math.round(val || 0).toLocaleString('en-US')}`;
}

function formatShortDate(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

export function CompanyProfitLossSection({
  companyProfitLoss,
  ledgerEntries,
  periodLabel,
  onOpenNewEntry,
  onEditEntry,
}: CompanyProfitLossSectionProps) {
  const deleteMutation = useDeleteFinanceEntry();

  const [typeFilter, setTypeFilter] = useState<'ALL' | 'EXPENSE' | 'INCOME'>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [menuState, setMenuState] = useState<{
    entry: CompanyFinanceEntryDto;
    top: number;
    left: number;
  } | null>(null);

  useEffect(() => {
    if (!menuState) return;
    const close = () => setMenuState(null);
    window.addEventListener('scroll', close, true);
    window.addEventListener('resize', close);
    window.addEventListener('click', close);
    return () => {
      window.removeEventListener('scroll', close, true);
      window.removeEventListener('resize', close);
      window.removeEventListener('click', close);
    };
  }, [menuState]);

  const handleOpenMenu = (
    entry: CompanyFinanceEntryDto,
    e: React.MouseEvent<HTMLButtonElement>,
  ) => {
    e.stopPropagation();
    if (menuState?.entry.id === entry.id) {
      setMenuState(null);
      return;
    }
    const rect = e.currentTarget.getBoundingClientRect();
    const menuWidth = 190;
    const menuHeight = 104;
    const spaceBelow = window.innerHeight - rect.bottom;
    const spaceAbove = rect.top;
    const rawTop =
      spaceBelow < menuHeight && spaceAbove >= spaceBelow
        ? rect.top - menuHeight - 6
        : rect.bottom + 6;
    const top = Math.max(10, Math.min(rawTop, window.innerHeight - menuHeight - 10));
    const left = Math.max(
      10,
      Math.min(rect.right - menuWidth, window.innerWidth - menuWidth - 10),
    );
    setMenuState({ entry, top, left });
  };

  const filteredEntries = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return ledgerEntries.filter((entry) => {
      const matchType = typeFilter === 'ALL' || entry.type === typeFilter;
      const matchSearch =
        !q ||
        entry.title.toLowerCase().includes(q) ||
        entry.entryCode.toLowerCase().includes(q) ||
        CATEGORY_LABELS[entry.category]?.toLowerCase().includes(q) ||
        (entry.merchantName || '').toLowerCase().includes(q) ||
        (entry.referenceNo || '').toLowerCase().includes(q);
      return matchType && matchSearch;
    });
  }, [ledgerEntries, typeFilter, searchQuery]);

  useEffect(() => {
    setCurrentPage(1);
  }, [typeFilter, searchQuery, ledgerEntries.length]);

  const totalPages = Math.max(1, Math.ceil(filteredEntries.length / pageSize));
  const safePage = Math.min(currentPage, totalPages);
  const paginatedEntries = useMemo(() => {
    const start = (safePage - 1) * pageSize;
    return filteredEntries.slice(start, start + pageSize);
  }, [filteredEntries, safePage, pageSize]);

  const handleDelete = async (entry: CompanyFinanceEntryDto) => {
    setDeletingId(entry.id);
    try {
      await deleteMutation.mutateAsync(entry.id);
    } finally {
      setDeletingId(null);
    }
  };

  const {
    gross3plRevenue,
    totalOperatingExpenses,
    netProfit,
    netMarginPercentage,
    isProfitable,
    isMerchantScoped,
    revenueStreams,
    expensesByCategory,
  } = companyProfitLoss;

  const totalBarBase = Math.max(1, gross3plRevenue, totalOperatingExpenses);
  const expenseWidthPct = Math.min(100, (totalOperatingExpenses / totalBarBase) * 100);
  const revenueWidthPct = Math.min(100, (gross3plRevenue / totalBarBase) * 100);

  return (
    <section className="p-6 rounded-2xl bg-white dark:bg-navy-900 border border-slate-200/80 dark:border-white/10 shadow-sm space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-4 border-b border-slate-200/80 dark:border-white/10">
        <div>
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400">
              <TrendingUp className="w-4 h-4" />
            </div>
            <h2 className="text-base sm:text-lg font-extrabold text-navy-900 dark:text-white">
              Section 2 · Fulfillio 3PL Revenue &amp; Profit / Loss Analytics
            </h2>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Company-owned earnings (Handling + Packaging + Delivery + Storage/Manual Income) minus logged operating expenses for {periodLabel}.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => onOpenNewEntry(FinanceEntryType.INCOME)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 text-xs font-bold text-emerald-700 dark:text-emerald-300 transition-colors cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Log Storage / Income</span>
          </button>
          <button
            type="button"
            onClick={() => onOpenNewEntry(FinanceEntryType.EXPENSE)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-orange-600 hover:bg-orange-500 text-xs font-bold text-white shadow-sm shadow-orange-500/20 transition-all cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Log Expense</span>
          </button>
        </div>
      </div>

      {/* Single-Merchant Scope Notice */}
      {isMerchantScoped && (
        <div className="flex items-start gap-2.5 p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-xs text-amber-800 dark:text-amber-200">
          <Info className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
          <span>
            <strong>Single-Merchant Scope Active:</strong> Unallocated warehouse overhead expenses
            (such as general rent and staff payroll without a specific merchant attached) are
            excluded here and included in the <strong>All Merchants</strong> view.
          </span>
        </div>
      )}

      {/* Executive Profit / Loss Verdict Banner */}
      <div
        className={`p-5 rounded-2xl border-2 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 ${
          isProfitable
            ? 'bg-emerald-50/70 dark:bg-emerald-950/30 border-emerald-500/40'
            : 'bg-rose-50/70 dark:bg-rose-950/30 border-rose-500/40'
        }`}
      >
        <div className="flex items-start sm:items-center gap-3.5">
          <div
            className={`h-11 w-11 rounded-xl flex items-center justify-center shrink-0 text-white shadow-sm ${
              isProfitable ? 'bg-emerald-600' : 'bg-rose-600'
            }`}
          >
            {isProfitable ? (
              <CheckCircle2 className="w-6 h-6" />
            ) : (
              <AlertTriangle className="w-6 h-6" />
            )}
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <span
                className={`text-[11px] uppercase font-black px-2.5 py-0.5 rounded-full text-white ${
                  isProfitable ? 'bg-emerald-600' : 'bg-rose-600'
                }`}
              >
                {isProfitable ? 'Net Profitable' : 'Net Operating Deficit'}
              </span>
              <span className="text-xs font-semibold text-slate-600 dark:text-slate-300">
                {periodLabel}
              </span>
            </div>
            <p className="text-sm font-extrabold text-navy-900 dark:text-white mt-1">
              {isProfitable
                ? `Net 3PL Margin: +${netMarginPercentage.toFixed(1)}% — Realized 3PL fees & income exceed logged expenses by ${formatTaka(netProfit)}.`
                : `Operating Deficit: ${netMarginPercentage.toFixed(1)}% — Logged expenses exceed 3PL revenue by ${formatTaka(Math.abs(netProfit))}.`}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-2.5 shrink-0">
          <div className="px-3.5 py-2.5 rounded-xl bg-white dark:bg-navy-900 border border-slate-200/80 dark:border-white/10">
            <span className="text-[10px] uppercase font-bold text-orange-600 dark:text-orange-400 block">
              Gross 3PL Rev
            </span>
            <span className="text-sm sm:text-base font-black text-navy-900 dark:text-white tabular-nums">
              {formatTaka(gross3plRevenue)}
            </span>
          </div>
          <div className="px-3.5 py-2.5 rounded-xl bg-white dark:bg-navy-900 border border-slate-200/80 dark:border-white/10">
            <span className="text-[10px] uppercase font-bold text-slate-500 dark:text-slate-400 block">
              Expenses
            </span>
            <span className="text-sm sm:text-base font-black text-rose-600 dark:text-rose-400 tabular-nums">
              {formatTaka(totalOperatingExpenses)}
            </span>
          </div>
          <div className="px-3.5 py-2.5 rounded-xl bg-white dark:bg-navy-900 border border-slate-200/80 dark:border-white/10">
            <span className="text-[10px] uppercase font-bold text-emerald-600 dark:text-emerald-400 block">
              Net P&amp;L
            </span>
            <span
              className={`text-sm sm:text-base font-black tabular-nums ${
                isProfitable
                  ? 'text-emerald-600 dark:text-emerald-400'
                  : 'text-rose-600 dark:text-rose-400'
              }`}
            >
              {netProfit >= 0 ? '+' : '-'}
              {formatTaka(Math.abs(netProfit))}
            </span>
          </div>
        </div>
      </div>

      {/* Revenue vs Expense Comparative Bars */}
      <div className="p-4 rounded-xl bg-slate-50/70 dark:bg-navy-950/60 border border-slate-200/80 dark:border-white/10 space-y-3">
        <div className="flex items-center justify-between text-xs font-bold text-navy-900 dark:text-white">
          <span>3PL Revenue vs Operating Expense Comparison</span>
          <span className="text-[11px] font-mono text-slate-500 dark:text-slate-400">
            Margin: {netMarginPercentage.toFixed(1)}%
          </span>
        </div>

        <div className="space-y-2">
          <div>
            <div className="flex justify-between text-[11px] font-semibold mb-1">
              <span className="text-orange-600 dark:text-orange-400">Gross 3PL Revenue</span>
              <span className="font-mono font-bold text-navy-900 dark:text-white">
                {formatTaka(gross3plRevenue)}
              </span>
            </div>
            <div className="h-3 w-full rounded-full bg-slate-200 dark:bg-navy-800 overflow-hidden">
              <div
                className="h-full rounded-full bg-orange-500 transition-all duration-500"
                style={{ width: `${gross3plRevenue > 0 ? Math.max(2, revenueWidthPct) : 0}%` }}
              />
            </div>
          </div>

          <div>
            <div className="flex justify-between text-[11px] font-semibold mb-1">
              <span className="text-rose-600 dark:text-rose-400">Operating Expenses</span>
              <span className="font-mono font-bold text-navy-900 dark:text-white">
                {formatTaka(totalOperatingExpenses)}
              </span>
            </div>
            <div className="h-3 w-full rounded-full bg-slate-200 dark:bg-navy-800 overflow-hidden">
              <div
                className="h-full rounded-full bg-rose-500 transition-all duration-500"
                style={{
                  width: `${totalOperatingExpenses > 0 ? Math.max(2, expenseWidthPct) : 0}%`,
                }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Revenue Streams & Expense Categories Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Left: Revenue Streams */}
        <div className="p-4 rounded-2xl bg-slate-50/70 dark:bg-navy-950/60 border border-slate-200/80 dark:border-white/10 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-extrabold uppercase tracking-wider text-navy-900 dark:text-white flex items-center gap-1.5">
              <Receipt className="w-4 h-4 text-orange-600 dark:text-orange-400" />
              <span>3PL Revenue Streams</span>
            </h3>
            <span className="text-xs font-mono font-bold text-emerald-600 dark:text-emerald-400">
              {formatTaka(gross3plRevenue)}
            </span>
          </div>

          <div className="space-y-2.5">
            {revenueStreams.map((stream) => (
              <div
                key={stream.id}
                className="p-2.5 rounded-xl bg-white dark:bg-navy-900 border border-slate-200/80 dark:border-white/10 space-y-1.5"
              >
                <div className="flex items-center justify-between gap-2 text-xs">
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="font-bold text-navy-900 dark:text-white truncate">
                      {stream.label}
                    </span>
                    <span
                      className={`text-[10px] font-bold px-1.5 py-0.5 rounded border shrink-0 ${
                        stream.source === 'AUTO_ORDER_FEE'
                          ? 'bg-orange-500/10 text-orange-600 dark:text-orange-400 border-orange-500/20'
                          : 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20'
                      }`}
                    >
                      {stream.source === 'AUTO_ORDER_FEE' ? 'Auto' : 'Ledger'}
                    </span>
                  </div>
                  <div className="text-right shrink-0 font-mono">
                    <span className="font-extrabold text-navy-900 dark:text-white">
                      {formatTaka(stream.amount)}
                    </span>
                    <span className="text-[10px] text-slate-400 ml-1.5">
                      ({stream.sharePercentage.toFixed(0)}%)
                    </span>
                  </div>
                </div>
                <div className="h-1.5 w-full rounded-full bg-slate-100 dark:bg-navy-950 overflow-hidden">
                  <div
                    className="h-full rounded-full bg-emerald-500 transition-all duration-500"
                    style={{ width: `${Math.min(100, stream.sharePercentage)}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right: Operating Expenses by Category */}
        <div className="p-4 rounded-2xl bg-slate-50/70 dark:bg-navy-950/60 border border-slate-200/80 dark:border-white/10 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-extrabold uppercase tracking-wider text-navy-900 dark:text-white flex items-center gap-1.5">
              <Warehouse className="w-4 h-4 text-rose-600 dark:text-rose-400" />
              <span>Operating Expenses by Category</span>
            </h3>
            <span className="text-xs font-mono font-bold text-rose-600 dark:text-rose-400">
              {formatTaka(totalOperatingExpenses)}
            </span>
          </div>

          <div className="space-y-2.5">
            {expensesByCategory.map((cat) => {
              const Icon = EXPENSE_ICON_MAP[cat.category] || Sparkles;
              return (
                <div
                  key={cat.category}
                  className="p-2.5 rounded-xl bg-white dark:bg-navy-900 border border-slate-200/80 dark:border-white/10 space-y-1.5"
                >
                  <div className="flex items-center justify-between gap-2 text-xs">
                    <div className="flex items-center gap-2 min-w-0">
                      <Icon className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400 shrink-0" />
                      <span className="font-bold text-navy-900 dark:text-white truncate">
                        {cat.label}
                      </span>
                      <span className="text-[10px] text-slate-400 font-mono">
                        ({cat.entriesCount})
                      </span>
                    </div>
                    <div className="text-right shrink-0 font-mono">
                      <span className="font-extrabold text-navy-900 dark:text-white">
                        {formatTaka(cat.amount)}
                      </span>
                      <span className="text-[10px] text-slate-400 ml-1.5">
                        ({cat.sharePercentage.toFixed(0)}%)
                      </span>
                    </div>
                  </div>
                  <div className="h-1.5 w-full rounded-full bg-slate-100 dark:bg-navy-950 overflow-hidden">
                    <div
                      className="h-full rounded-full bg-rose-500 transition-all duration-500"
                      style={{ width: `${Math.min(100, cat.sharePercentage)}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Company Income & Expense Ledger Table */}
      <div className="pt-2 space-y-4">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
          <div>
            <h3 className="text-sm font-extrabold text-navy-900 dark:text-white">
              Company Income &amp; Expense Ledger ({filteredEntries.length})
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Logged warehouse expenses (rent, salary, courier, packaging) and manual income entries in {periodLabel}.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Search */}
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search title, code, ref..."
                className="pl-8 pr-3 py-1.5 rounded-xl border border-slate-200 dark:border-white/15 bg-slate-50 dark:bg-navy-950 text-xs text-navy-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-orange-500/30 w-48"
              />
            </div>

            {/* Type Tabs */}
            <div className="flex items-center p-1 rounded-xl bg-slate-100 dark:bg-navy-950 border border-slate-200 dark:border-white/10 text-xs font-bold">
              {(['ALL', 'EXPENSE', 'INCOME'] as const).map((tab) => (
                <button
                  key={tab}
                  type="button"
                  onClick={() => setTypeFilter(tab)}
                  className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
                    typeFilter === tab
                      ? 'bg-orange-600 text-white shadow-xs'
                      : 'text-slate-500 dark:text-slate-400 hover:text-navy-900 dark:hover:text-white'
                  }`}
                >
                  {tab === 'ALL' ? 'All' : tab === 'EXPENSE' ? 'Expenses' : 'Income'}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Desktop Table */}
        <div className="hidden md:block overflow-x-auto rounded-2xl border border-slate-200/80 dark:border-white/10">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 dark:bg-navy-950 border-b border-slate-200/80 dark:border-white/10 text-[11px] uppercase font-bold tracking-wider text-slate-500 dark:text-slate-400">
                <th className="py-3 px-3.5">Date &amp; Code</th>
                <th className="py-3 px-3.5">Description</th>
                <th className="py-3 px-3.5">Category</th>
                <th className="py-3 px-3.5 text-center">Type</th>
                <th className="py-3 px-3.5">Merchant / Ref</th>
                <th className="py-3 px-3.5 text-right">Amount</th>
                <th className="py-3 px-3.5 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200/70 dark:divide-white/10 text-xs">
              {paginatedEntries.length === 0 ? (
                <tr>
                  <td
                    colSpan={7}
                    className="py-10 px-4 text-center text-slate-500 dark:text-slate-400"
                  >
                    No expense or manual income entries logged in this period yet. Click{' '}
                    <strong className="text-orange-600 dark:text-orange-400">
                      + Log Expense
                    </strong>{' '}
                    to track rent, salaries, or courier bills.
                  </td>
                </tr>
              ) : (
                paginatedEntries.map((entry) => {
                  const isExpense = entry.type === FinanceEntryType.EXPENSE;
                  return (
                    <tr
                      key={entry.id}
                      className="hover:bg-slate-50/70 dark:hover:bg-navy-950/50 transition-colors"
                    >
                      <td className="py-3 px-3.5 whitespace-nowrap">
                        <div className="font-semibold text-navy-900 dark:text-white">
                          {formatShortDate(entry.entryDate)}
                        </div>
                        <div className="text-[11px] font-mono text-slate-400">
                          {entry.entryCode}
                        </div>
                      </td>
                      <td className="py-3 px-3.5">
                        <div className="font-bold text-navy-900 dark:text-white">
                          {entry.title}
                        </div>
                        {entry.notes && (
                          <div className="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-1">
                            {entry.notes}
                          </div>
                        )}
                      </td>
                      <td className="py-3 px-3.5 whitespace-nowrap font-semibold text-slate-700 dark:text-slate-300">
                        {CATEGORY_LABELS[entry.category] || entry.category}
                      </td>
                      <td className="py-3 px-3.5 text-center">
                        <span
                          className={`inline-flex items-center justify-center text-[11px] uppercase font-bold tracking-wider px-2.5 py-0.5 rounded-full border select-none ${
                            isExpense
                              ? 'bg-rose-500/15 text-rose-600 dark:text-rose-400 border-rose-500/30'
                              : 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30'
                          }`}
                        >
                          {isExpense ? 'Expense' : 'Income'}
                        </span>
                      </td>
                      <td className="py-3 px-3.5">
                        <div className="font-medium text-slate-700 dark:text-slate-300">
                          {entry.merchantName
                            ? `${entry.merchantCode} · ${entry.merchantName}`
                            : 'Company-wide'}
                        </div>
                        <div className="text-[11px] font-mono text-slate-400">
                          {entry.paymentMethod || '—'}
                          {entry.referenceNo ? ` · ${entry.referenceNo}` : ''}
                        </div>
                      </td>
                      <td className="py-3 px-3.5 text-right whitespace-nowrap font-mono font-extrabold">
                        <span
                          className={
                            isExpense
                              ? 'text-rose-600 dark:text-rose-400'
                              : 'text-emerald-600 dark:text-emerald-400'
                          }
                        >
                          {isExpense ? '-' : '+'}
                          {formatTaka(entry.amount)}
                        </span>
                      </td>
                      <td className="py-3 px-3.5 text-center">
                        <div className="flex items-center justify-center">
                          <button
                            type="button"
                            onClick={(e) => handleOpenMenu(entry, e)}
                            disabled={deletingId === entry.id}
                            className="p-2 rounded-xl text-slate-500 hover:text-navy-900 dark:text-slate-400 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-navy-800 transition-colors cursor-pointer"
                            aria-label="Entry actions"
                          >
                            <MoreVertical className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Mobile Cards (< md) */}
        <div className="md:hidden space-y-2.5">
          {paginatedEntries.length === 0 ? (
            <div className="p-6 rounded-xl border border-slate-200/80 dark:border-white/10 text-center text-xs text-slate-500 dark:text-slate-400">
              No expense or manual income entries in this period.
            </div>
          ) : (
            paginatedEntries.map((entry) => {
              const isExpense = entry.type === FinanceEntryType.EXPENSE;
              return (
                <div
                  key={entry.id}
                  className="p-3.5 rounded-xl bg-slate-50 dark:bg-navy-950 border border-slate-200/80 dark:border-white/10 space-y-2"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <span className="text-[11px] font-mono text-slate-400">
                        {formatShortDate(entry.entryDate)} · {entry.entryCode}
                      </span>
                      <div className="text-xs font-extrabold text-navy-900 dark:text-white mt-0.5">
                        {entry.title}
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={(e) => handleOpenMenu(entry, e)}
                      className="p-1.5 rounded-lg text-slate-500 hover:bg-slate-200/60 dark:hover:bg-navy-800 cursor-pointer"
                      aria-label="Entry actions"
                    >
                      <MoreVertical className="w-4 h-4" />
                    </button>
                  </div>
                  <div className="flex items-center justify-between pt-1.5 border-t border-slate-200/70 dark:border-white/10">
                    <span
                      className={`inline-flex items-center text-[10px] uppercase font-bold px-2 py-0.5 rounded-full border select-none ${
                        isExpense
                          ? 'bg-rose-500/15 text-rose-600 dark:text-rose-400 border-rose-500/30'
                          : 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30'
                      }`}
                    >
                      {CATEGORY_LABELS[entry.category] || entry.category}
                    </span>
                    <span
                      className={`text-sm font-mono font-black ${
                        isExpense
                          ? 'text-rose-600 dark:text-rose-400'
                          : 'text-emerald-600 dark:text-emerald-400'
                      }`}
                    >
                      {isExpense ? '-' : '+'}
                      {formatTaka(entry.amount)}
                    </span>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Pagination */}
        {filteredEntries.length > 0 && (
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-4 border-t border-slate-200/80 dark:border-white/10 text-xs text-slate-500 dark:text-slate-400">
            <div>
              Showing{' '}
              <strong className="text-navy-900 dark:text-white font-mono">
                {(safePage - 1) * pageSize + 1}
              </strong>{' '}
              to{' '}
              <strong className="text-navy-900 dark:text-white font-mono">
                {Math.min(safePage * pageSize, filteredEntries.length)}
              </strong>{' '}
              of{' '}
              <strong className="text-navy-900 dark:text-white font-mono">
                {filteredEntries.length}
              </strong>{' '}
              entries
            </div>

            <div className="flex items-center gap-4">
              <div className="flex items-center gap-1.5">
                <span>Rows per page:</span>
                <select
                  value={pageSize}
                  onChange={(e) => {
                    setPageSize(Number(e.target.value));
                    setCurrentPage(1);
                  }}
                  className="rounded-lg border border-slate-200 dark:border-white/15 bg-white dark:bg-navy-950 px-2 py-1 text-xs font-bold text-navy-900 dark:text-white"
                >
                  <option value={10}>10</option>
                  <option value={25}>25</option>
                  <option value={50}>50</option>
                  <option value={100}>100</option>
                </select>
              </div>

              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={safePage === 1}
                  className="p-1.5 rounded-lg border border-slate-200 dark:border-white/15 disabled:opacity-40 hover:bg-slate-100 dark:hover:bg-navy-800 cursor-pointer"
                  aria-label="Previous page"
                >
                  <ChevronLeft className="w-3.5 h-3.5" />
                </button>
                {Array.from({ length: totalPages }, (_, i) => i + 1)
                  .slice(Math.max(0, safePage - 3), Math.min(totalPages, safePage + 2))
                  .map((p) => (
                    <button
                      key={p}
                      type="button"
                      onClick={() => setCurrentPage(p)}
                      className={`px-2.5 py-1 rounded-lg font-mono font-bold transition-colors cursor-pointer ${
                        p === safePage
                          ? 'bg-orange-600 text-white'
                          : 'hover:bg-slate-100 dark:hover:bg-navy-800 text-slate-600 dark:text-slate-300'
                      }`}
                    >
                      {p}
                    </button>
                  ))}
                <button
                  type="button"
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  disabled={safePage === totalPages}
                  className="p-1.5 rounded-lg border border-slate-200 dark:border-white/15 disabled:opacity-40 hover:bg-slate-100 dark:hover:bg-navy-800 cursor-pointer"
                  aria-label="Next page"
                >
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Portaled 3-dots Floating Action Menu */}
      {menuState &&
        typeof document !== 'undefined' &&
        createPortal(
          <div
            style={{ top: menuState.top, left: menuState.left, maxHeight: 'calc(100vh - 20px)' }}
            onClick={(e) => e.stopPropagation()}
            className="fixed z-50 w-48 rounded-xl border border-slate-200 dark:border-white/15 bg-white dark:bg-navy-900 shadow-2xl py-1.5 overflow-y-auto"
          >
            <button
              type="button"
              onClick={() => {
                const target = menuState.entry;
                setMenuState(null);
                onEditEntry(target);
              }}
              className="w-full px-3.5 py-2 text-left text-xs font-semibold text-navy-900 dark:text-slate-100 hover:bg-slate-100 dark:hover:bg-navy-800 flex items-center gap-2 cursor-pointer"
            >
              <Edit2 className="w-3.5 h-3.5 text-orange-600 dark:text-orange-400" />
              <span>Edit Entry</span>
            </button>
            <div className="my-1 border-t border-slate-100 dark:border-white/10" />
            <button
              type="button"
              onClick={() => {
                const target = menuState.entry;
                setMenuState(null);
                handleDelete(target);
              }}
              className="w-full px-3.5 py-2 text-left text-xs font-semibold text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 flex items-center gap-2 cursor-pointer"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Delete Entry</span>
            </button>
          </div>,
          document.body,
        )}
    </section>
  );
}
