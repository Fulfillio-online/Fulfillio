'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import Link from 'next/link';
import {
  BarChart3,
  PackageCheck,
  RotateCcw,
  Truck,
  CheckCircle2,
  XCircle,
  Clock,
  Search,
  MoreVertical,
  Filter,
  HandCoins,
  CreditCard,
  ExternalLink,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
} from 'lucide-react';
import {
  AdminFinanceAnalyticsDto,
  FinanceMerchantBreakdownDto,
} from '@fulfillio/contracts';

interface OrderVolumeAndMerchantsSectionProps {
  orderVolume: AdminFinanceAnalyticsDto['orderVolume'];
  merchantBreakdown: FinanceMerchantBreakdownDto[];
  periodLabel: string;
  selectedMerchantId: string;
  onSelectMerchant: (merchantId: string) => void;
}

function formatTaka(val: number): string {
  return `৳${Math.round(val || 0).toLocaleString('en-US')}`;
}

export function OrderVolumeAndMerchantsSection({
  orderVolume,
  merchantBreakdown,
  periodLabel,
  selectedMerchantId,
  onSelectMerchant,
}: OrderVolumeAndMerchantsSectionProps) {
  const [chartMode, setChartMode] = useState<'volume' | 'financial'>('volume');
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);

  const [merchantSearch, setMerchantSearch] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [expandedMobileId, setExpandedMobileId] = useState<string | null>(null);
  const [menuState, setMenuState] = useState<{
    row: FinanceMerchantBreakdownDto;
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
    row: FinanceMerchantBreakdownDto,
    e: React.MouseEvent<HTMLButtonElement>,
  ) => {
    e.stopPropagation();
    if (menuState?.row.merchantId === row.merchantId) {
      setMenuState(null);
      return;
    }
    const rect = e.currentTarget.getBoundingClientRect();
    const menuWidth = 220;
    const menuHeight = 160;
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
    setMenuState({ row, top, left });
  };

  const maxChartValue = useMemo(() => {
    if (orderVolume.buckets.length === 0) return 10;
    if (chartMode === 'volume') {
      return Math.max(
        1,
        ...orderVolume.buckets.map((b) =>
          Math.max(b.totalOrders, b.deliveredOrders, b.returnedOrders + b.cancelledOrders),
        ),
      );
    }
    return Math.max(
      100,
      ...orderVolume.buckets.map((b) => Math.max(b.revenue3pl, b.expenses)),
    );
  }, [orderVolume.buckets, chartMode]);

  const filteredMerchants = useMemo(() => {
    const q = merchantSearch.trim().toLowerCase();
    return merchantBreakdown.filter(
      (m) =>
        !q ||
        m.merchantName.toLowerCase().includes(q) ||
        m.merchantCode.toLowerCase().includes(q) ||
        m.ownerName.toLowerCase().includes(q),
    );
  }, [merchantBreakdown, merchantSearch]);

  useEffect(() => {
    setCurrentPage(1);
  }, [merchantSearch, merchantBreakdown.length]);

  const totalPages = Math.max(1, Math.ceil(filteredMerchants.length / pageSize));
  const safePage = Math.min(currentPage, totalPages);
  const paginatedMerchants = useMemo(() => {
    const start = (safePage - 1) * pageSize;
    return filteredMerchants.slice(start, start + pageSize);
  }, [filteredMerchants, safePage, pageSize]);

  const activeBucket =
    hoveredIdx !== null
      ? orderVolume.buckets[hoveredIdx]
      : orderVolume.buckets[orderVolume.buckets.length - 1];

  return (
    <section className="p-6 rounded-2xl bg-white dark:bg-navy-900 border border-slate-200/80 dark:border-white/10 shadow-sm space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-4 border-b border-slate-200/80 dark:border-white/10">
        <div>
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-orange-500/10 border border-orange-500/20 text-orange-600 dark:text-orange-400">
              <BarChart3 className="w-4 h-4" />
            </div>
            <h2 className="text-base sm:text-lg font-extrabold text-navy-900 dark:text-white">
              Section 3 · Order Volume Velocity &amp; Merchant-wise Hishab
            </h2>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Order funnel health, daily/monthly column velocity, and per-merchant COD &amp; 3PL fee breakdown ({periodLabel}).
          </p>
        </div>

        {/* Chart Mode Toggle */}
        <div className="flex items-center p-1 rounded-xl bg-slate-100 dark:bg-navy-950 border border-slate-200 dark:border-white/10 self-start sm:self-auto text-xs font-bold">
          <button
            type="button"
            onClick={() => setChartMode('volume')}
            className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
              chartMode === 'volume'
                ? 'bg-orange-600 text-white shadow-xs'
                : 'text-slate-500 dark:text-slate-400 hover:text-navy-900 dark:hover:text-white'
            }`}
          >
            Order Volume
          </button>
          <button
            type="button"
            onClick={() => setChartMode('financial')}
            className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
              chartMode === 'financial'
                ? 'bg-orange-600 text-white shadow-xs'
                : 'text-slate-500 dark:text-slate-400 hover:text-navy-900 dark:hover:text-white'
            }`}
          >
            3PL Rev vs Expense
          </button>
        </div>
      </div>

      {/* Order Volume KPI Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-navy-950 border border-slate-200/80 dark:border-white/10">
          <span className="text-[10px] uppercase font-bold text-slate-500 dark:text-slate-400 flex items-center gap-1">
            <PackageCheck className="w-3.5 h-3.5 text-orange-500" />
            Total Orders
          </span>
          <div className="text-xl font-black text-navy-900 dark:text-white tabular-nums mt-1">
            {orderVolume.totalOrders.toLocaleString()}
          </div>
        </div>

        <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-navy-950 border border-slate-200/80 dark:border-white/10">
          <span className="text-[10px] uppercase font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
            <CheckCircle2 className="w-3.5 h-3.5" />
            Delivered ({orderVolume.deliverySuccessRate}%)
          </span>
          <div className="text-xl font-black text-emerald-600 dark:text-emerald-400 tabular-nums mt-1">
            {orderVolume.deliveredOrders.toLocaleString()}
          </div>
        </div>

        <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-navy-950 border border-slate-200/80 dark:border-white/10">
          <span className="text-[10px] uppercase font-bold text-sky-600 dark:text-sky-400 flex items-center gap-1">
            <Truck className="w-3.5 h-3.5" />
            In Transit
          </span>
          <div className="text-xl font-black text-sky-600 dark:text-sky-400 tabular-nums mt-1">
            {orderVolume.dispatchedInTransitOrders.toLocaleString()}
          </div>
        </div>

        <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-navy-950 border border-slate-200/80 dark:border-white/10">
          <span className="text-[10px] uppercase font-bold text-amber-600 dark:text-amber-400 flex items-center gap-1">
            <Clock className="w-3.5 h-3.5" />
            Pending / Pack
          </span>
          <div className="text-xl font-black text-amber-600 dark:text-amber-400 tabular-nums mt-1">
            {orderVolume.pendingAndProcessingOrders.toLocaleString()}
          </div>
        </div>

        <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-navy-950 border border-slate-200/80 dark:border-white/10">
          <span className="text-[10px] uppercase font-bold text-rose-600 dark:text-rose-400 flex items-center gap-1">
            <RotateCcw className="w-3.5 h-3.5" />
            Returned ({orderVolume.returnRate}%)
          </span>
          <div className="text-xl font-black text-rose-600 dark:text-rose-400 tabular-nums mt-1">
            {orderVolume.returnedOrders.toLocaleString()}
          </div>
        </div>

        <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-navy-950 border border-slate-200/80 dark:border-white/10">
          <span className="text-[10px] uppercase font-bold text-slate-500 dark:text-slate-400 flex items-center gap-1">
            <XCircle className="w-3.5 h-3.5 text-slate-400" />
            Cancelled
          </span>
          <div className="text-xl font-black text-slate-700 dark:text-slate-200 tabular-nums mt-1">
            {orderVolume.cancelledOrders.toLocaleString()}
          </div>
        </div>
      </div>

      {/* Vertical Column Chart */}
      <div className="p-4 rounded-2xl bg-slate-50/70 dark:bg-navy-950/60 border border-slate-200/80 dark:border-white/10 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div className="flex flex-wrap items-center gap-3 text-[11px] font-bold">
            {chartMode === 'volume' ? (
              <>
                <span className="flex items-center gap-1.5 text-orange-600 dark:text-orange-400">
                  <span className="w-2.5 h-2.5 rounded-sm bg-gradient-to-t from-orange-600 to-amber-400" />
                  Total Orders
                </span>
                <span className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400">
                  <span className="w-2.5 h-2.5 rounded-sm bg-emerald-500" />
                  Delivered
                </span>
                <span className="flex items-center gap-1.5 text-rose-600 dark:text-rose-400">
                  <span className="w-2.5 h-2.5 rounded-sm bg-rose-500" />
                  Returned / Cancelled
                </span>
              </>
            ) : (
              <>
                <span className="flex items-center gap-1.5 text-orange-600 dark:text-orange-400">
                  <span className="w-2.5 h-2.5 rounded-sm bg-gradient-to-t from-orange-600 to-amber-400" />
                  3PL Gross Revenue
                </span>
                <span className="flex items-center gap-1.5 text-rose-600 dark:text-rose-400">
                  <span className="w-2.5 h-2.5 rounded-sm bg-rose-500" />
                  Operating Expenses
                </span>
              </>
            )}
          </div>

          {activeBucket && (
            <div className="text-[11px] font-mono px-3 py-1 rounded-lg bg-white dark:bg-navy-900 border border-slate-200 dark:border-white/10 text-navy-900 dark:text-white">
              <strong>{activeBucket.label}:</strong>{' '}
              {chartMode === 'volume'
                ? `${activeBucket.totalOrders} orders · ${activeBucket.deliveredOrders} delivered · ${activeBucket.returnedOrders} RTO`
                : `Rev ${formatTaka(activeBucket.revenue3pl)} · Exp ${formatTaka(activeBucket.expenses)} · Net ${activeBucket.netProfit >= 0 ? '+' : '-'}${formatTaka(Math.abs(activeBucket.netProfit))}`}
            </div>
          )}
        </div>

        {/* Bars Viewport */}
        <div className="overflow-x-auto pb-1">
          <div className="min-w-[560px] h-52 flex items-end gap-1.5 pt-4 px-1 border-b border-slate-200 dark:border-white/10">
            {orderVolume.buckets.length === 0 ? (
              <div className="w-full h-full flex items-center justify-center text-xs text-slate-400">
                No time-series data for this period.
              </div>
            ) : (
              orderVolume.buckets.map((bucket, idx) => {
                const isHovered = hoveredIdx === idx;
                if (chartMode === 'volume') {
                  const totalH = (bucket.totalOrders / maxChartValue) * 100;
                  const delivH = (bucket.deliveredOrders / maxChartValue) * 100;
                  const rtoH =
                    ((bucket.returnedOrders + bucket.cancelledOrders) / maxChartValue) * 100;

                  return (
                    <div
                      key={bucket.dateKey}
                      onMouseEnter={() => setHoveredIdx(idx)}
                      onMouseLeave={() => setHoveredIdx(null)}
                      className={`flex-1 min-w-[20px] h-full flex flex-col justify-end items-center group cursor-pointer rounded-t-lg px-0.5 transition-colors ${
                        isHovered ? 'bg-orange-500/5' : ''
                      }`}
                    >
                      <div className="w-full flex-1 flex items-end justify-center gap-0.5 pb-1">
                        <div
                          className="w-2.5 sm:w-3 rounded-t-md bg-gradient-to-t from-orange-600 to-amber-400 transition-all duration-300"
                          style={{
                            height: `${bucket.totalOrders > 0 ? Math.max(4, totalH) : 0}%`,
                          }}
                          title={`${bucket.label} Total: ${bucket.totalOrders}`}
                        />
                        <div
                          className="w-2 sm:w-2.5 rounded-t-md bg-emerald-500 transition-all duration-300"
                          style={{
                            height: `${bucket.deliveredOrders > 0 ? Math.max(4, delivH) : 0}%`,
                          }}
                          title={`${bucket.label} Delivered: ${bucket.deliveredOrders}`}
                        />
                        {(bucket.returnedOrders > 0 || bucket.cancelledOrders > 0) && (
                          <div
                            className="w-2 rounded-t-md bg-rose-500 transition-all duration-300"
                            style={{ height: `${Math.max(4, rtoH)}%` }}
                            title={`${bucket.label} Returned/Cancelled: ${bucket.returnedOrders + bucket.cancelledOrders}`}
                          />
                        )}
                      </div>
                      <span className="text-[10px] font-mono text-slate-500 dark:text-slate-400 truncate max-w-full py-1">
                        {bucket.label}
                      </span>
                    </div>
                  );
                }

                const revH = (bucket.revenue3pl / maxChartValue) * 100;
                const expH = (bucket.expenses / maxChartValue) * 100;
                return (
                  <div
                    key={bucket.dateKey}
                    onMouseEnter={() => setHoveredIdx(idx)}
                    onMouseLeave={() => setHoveredIdx(null)}
                    className={`flex-1 min-w-[20px] h-full flex flex-col justify-end items-center group cursor-pointer rounded-t-lg px-0.5 transition-colors ${
                      isHovered ? 'bg-orange-500/5' : ''
                    }`}
                  >
                    <div className="w-full flex-1 flex items-end justify-center gap-0.5 pb-1">
                      <div
                        className="w-2.5 sm:w-3 rounded-t-md bg-gradient-to-t from-orange-600 to-amber-400 transition-all duration-300"
                        style={{
                          height: `${bucket.revenue3pl > 0 ? Math.max(4, revH) : 0}%`,
                        }}
                        title={`${bucket.label} 3PL Revenue: ${formatTaka(bucket.revenue3pl)}`}
                      />
                      <div
                        className="w-2.5 sm:w-3 rounded-t-md bg-rose-500 transition-all duration-300"
                        style={{
                          height: `${bucket.expenses > 0 ? Math.max(4, expH) : 0}%`,
                        }}
                        title={`${bucket.label} Expenses: ${formatTaka(bucket.expenses)}`}
                      />
                    </div>
                    <span className="text-[10px] font-mono text-slate-500 dark:text-slate-400 truncate max-w-full py-1">
                      {bucket.label}
                    </span>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>

      {/* Merchant-wise Financial Breakdown Table */}
      <div className="space-y-4">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
          <div>
            <h3 className="text-sm font-extrabold text-navy-900 dark:text-white">
              Merchant-wise Financial &amp; Order Breakdown ({filteredMerchants.length})
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Complete per-merchant order count, COD collected, 3PL service charges earned, payouts sent, and current unpaid liability.
            </p>
          </div>

          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={merchantSearch}
              onChange={(e) => setMerchantSearch(e.target.value)}
              placeholder="Filter merchant code or name..."
              className="pl-8 pr-3 py-1.5 rounded-xl border border-slate-200 dark:border-white/15 bg-slate-50 dark:bg-navy-950 text-xs text-navy-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-orange-500/30 w-56"
            />
          </div>
        </div>

        {/* Desktop Table */}
        <div className="hidden md:block overflow-x-auto rounded-2xl border border-slate-200/80 dark:border-white/10">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 dark:bg-navy-950 border-b border-slate-200/80 dark:border-white/10 text-[11px] uppercase font-bold tracking-wider text-slate-500 dark:text-slate-400">
                <th className="py-3 px-3.5">Merchant</th>
                <th className="py-3 px-3.5 text-center">Orders (Deliv / Total)</th>
                <th className="py-3 px-3.5 text-right">COD Collected</th>
                <th className="py-3 px-3.5 text-right">3PL Fees Earned</th>
                <th className="py-3 px-3.5 text-right">Merchant Net</th>
                <th className="py-3 px-3.5 text-right">Paid Out</th>
                <th className="py-3 px-3.5 text-right">Live Unpaid Due</th>
                <th className="py-3 px-3.5 text-center">Status</th>
                <th className="py-3 px-3.5 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200/70 dark:divide-white/10 text-xs">
              {paginatedMerchants.length === 0 ? (
                <tr>
                  <td
                    colSpan={9}
                    className="py-10 px-4 text-center text-slate-500 dark:text-slate-400"
                  >
                    No merchants matched your filter.
                  </td>
                </tr>
              ) : (
                paginatedMerchants.map((m) => {
                  const hasPendingPayout = m.pendingPayoutCount > 0;
                  const hasDue = m.currentUnpaidDue > 0;
                  return (
                    <tr
                      key={m.merchantId}
                      className={`hover:bg-slate-50/70 dark:hover:bg-navy-950/50 transition-colors ${
                        selectedMerchantId === m.merchantId
                          ? 'bg-orange-500/5'
                          : ''
                      }`}
                    >
                      <td className="py-3 px-3.5">
                        <div className="font-bold text-navy-900 dark:text-white">
                          {m.merchantName}
                        </div>
                        <div className="text-[11px] font-mono text-slate-400">
                          {m.merchantCode} · {m.ownerName}
                        </div>
                      </td>
                      <td className="py-3 px-3.5 text-center font-mono">
                        <span className="font-extrabold text-emerald-600 dark:text-emerald-400">
                          {m.deliveredOrders}
                        </span>{' '}
                        <span className="text-slate-400">/ {m.totalOrders}</span>
                        {m.returnedOrders > 0 && (
                          <div className="text-[10px] text-rose-500">
                            {m.returnedOrders} RTO
                          </div>
                        )}
                      </td>
                      <td className="py-3 px-3.5 text-right font-mono font-bold text-navy-900 dark:text-white">
                        {formatTaka(m.grossCodCollected)}
                      </td>
                      <td className="py-3 px-3.5 text-right font-mono">
                        <div className="font-extrabold text-orange-600 dark:text-orange-400">
                          {formatTaka(m.total3plFees)}
                        </div>
                        <div className="text-[10px] text-slate-400">
                          H:{formatTaka(m.handlingFees)} · D:{formatTaka(m.deliveryFees)}
                        </div>
                      </td>
                      <td className="py-3 px-3.5 text-right font-mono font-bold text-emerald-600 dark:text-emerald-400">
                        {formatTaka(m.merchantNetEarned)}
                      </td>
                      <td className="py-3 px-3.5 text-right font-mono font-semibold text-navy-900 dark:text-slate-200">
                        {formatTaka(m.totalPaidOut)}
                      </td>
                      <td className="py-3 px-3.5 text-right font-mono font-extrabold text-amber-600 dark:text-amber-400">
                        {formatTaka(m.currentUnpaidDue)}
                      </td>
                      <td className="py-3 px-3.5 text-center">
                        <span
                          className={`inline-flex items-center justify-center text-[11px] uppercase font-bold tracking-wider px-2.5 py-0.5 rounded-full border select-none ${
                            hasPendingPayout
                              ? 'bg-amber-500/15 text-amber-700 dark:text-amber-300 border-amber-500/30'
                              : hasDue
                                ? 'bg-sky-500/15 text-sky-700 dark:text-sky-300 border-sky-500/30'
                                : 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30'
                          }`}
                        >
                          {hasPendingPayout
                            ? `${m.pendingPayoutCount} Payout Req`
                            : hasDue
                              ? 'Balance Due'
                              : 'Settled'}
                        </span>
                      </td>
                      <td className="py-3 px-3.5 text-center">
                        <div className="flex items-center justify-center">
                          <button
                            type="button"
                            onClick={(e) => handleOpenMenu(m, e)}
                            className="p-2 rounded-xl text-slate-500 hover:text-navy-900 dark:text-slate-400 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-navy-800 transition-colors cursor-pointer"
                            aria-label="Merchant actions"
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

        {/* Mobile Expandable Cards (< md) */}
        <div className="md:hidden space-y-2.5">
          {paginatedMerchants.map((m) => {
            const isExpanded = expandedMobileId === m.merchantId;
            return (
              <div
                key={m.merchantId}
                className="p-3.5 rounded-xl bg-slate-50 dark:bg-navy-950 border border-slate-200/80 dark:border-white/10 space-y-2"
              >
                <div className="flex items-start justify-between gap-2">
                  <button
                    type="button"
                    onClick={() =>
                      setExpandedMobileId(isExpanded ? null : m.merchantId)
                    }
                    className="flex items-center gap-2 text-left min-w-0 cursor-pointer"
                  >
                    <ChevronDown
                      className={`w-4 h-4 text-slate-400 shrink-0 transition-transform ${
                        isExpanded ? 'rotate-180' : ''
                      }`}
                    />
                    <div className="min-w-0">
                      <div className="text-xs font-extrabold text-navy-900 dark:text-white truncate">
                        {m.merchantName}
                      </div>
                      <div className="text-[11px] font-mono text-slate-400">
                        {m.merchantCode} · {m.deliveredOrders}/{m.totalOrders} orders
                      </div>
                    </div>
                  </button>
                  <button
                    type="button"
                    onClick={(e) => handleOpenMenu(m, e)}
                    className="p-1.5 rounded-lg text-slate-500 hover:bg-slate-200/60 dark:hover:bg-navy-800 cursor-pointer"
                    aria-label="Merchant actions"
                  >
                    <MoreVertical className="w-4 h-4" />
                  </button>
                </div>

                <div className="grid grid-cols-3 gap-2 pt-1.5 border-t border-slate-200/70 dark:border-white/10 text-[11px]">
                  <div>
                    <span className="text-slate-400 block">3PL Fees</span>
                    <strong className="font-mono text-orange-600 dark:text-orange-400">
                      {formatTaka(m.total3plFees)}
                    </strong>
                  </div>
                  <div>
                    <span className="text-slate-400 block">Paid</span>
                    <strong className="font-mono text-navy-900 dark:text-white">
                      {formatTaka(m.totalPaidOut)}
                    </strong>
                  </div>
                  <div>
                    <span className="text-slate-400 block">Due</span>
                    <strong className="font-mono text-amber-600 dark:text-amber-400">
                      {formatTaka(m.currentUnpaidDue)}
                    </strong>
                  </div>
                </div>

                {isExpanded && (
                  <div className="pt-2 border-t border-slate-200/70 dark:border-white/10 grid grid-cols-2 gap-2 text-[11px]">
                    <div>
                      <span className="text-slate-400 block">COD Collected</span>
                      <strong className="font-mono text-navy-900 dark:text-white">
                        {formatTaka(m.grossCodCollected)}
                      </strong>
                    </div>
                    <div>
                      <span className="text-slate-400 block">Merchant Net</span>
                      <strong className="font-mono text-emerald-600 dark:text-emerald-400">
                        {formatTaka(m.merchantNetEarned)}
                      </strong>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Pagination */}
        {filteredMerchants.length > 0 && (
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-4 border-t border-slate-200/80 dark:border-white/10 text-xs text-slate-500 dark:text-slate-400">
            <div>
              Showing{' '}
              <strong className="text-navy-900 dark:text-white font-mono">
                {(safePage - 1) * pageSize + 1}
              </strong>{' '}
              to{' '}
              <strong className="text-navy-900 dark:text-white font-mono">
                {Math.min(safePage * pageSize, filteredMerchants.length)}
              </strong>{' '}
              of{' '}
              <strong className="text-navy-900 dark:text-white font-mono">
                {filteredMerchants.length}
              </strong>{' '}
              merchants
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
            className="fixed z-50 w-56 rounded-xl border border-slate-200 dark:border-white/15 bg-white dark:bg-navy-900 shadow-2xl py-1.5 overflow-y-auto"
          >
            <button
              type="button"
              onClick={() => {
                const mId = menuState.row.merchantId;
                setMenuState(null);
                onSelectMerchant(selectedMerchantId === mId ? 'ALL' : mId);
              }}
              className="w-full px-3.5 py-2 text-left text-xs font-semibold text-navy-900 dark:text-slate-100 hover:bg-slate-100 dark:hover:bg-navy-800 flex items-center gap-2 cursor-pointer"
            >
              <Filter className="w-3.5 h-3.5 text-orange-600 dark:text-orange-400" />
              <span>
                {selectedMerchantId === menuState.row.merchantId
                  ? 'Show All Merchants'
                  : 'Filter Page to Merchant'}
              </span>
            </button>
            <Link
              href="/admin/payouts"
              onClick={() => setMenuState(null)}
              className="w-full px-3.5 py-2 text-left text-xs font-semibold text-navy-900 dark:text-slate-100 hover:bg-slate-100 dark:hover:bg-navy-800 flex items-center gap-2"
            >
              <HandCoins className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
              <span>View Payout Requests</span>
            </Link>
            <Link
              href="/admin/billing"
              onClick={() => setMenuState(null)}
              className="w-full px-3.5 py-2 text-left text-xs font-semibold text-navy-900 dark:text-slate-100 hover:bg-slate-100 dark:hover:bg-navy-800 flex items-center gap-2"
            >
              <CreditCard className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
              <span>Open Billing Ledger</span>
            </Link>
            <div className="my-1 border-t border-slate-100 dark:border-white/10" />
            <Link
              href={`/admin/merchants/${encodeURIComponent(menuState.row.merchantId)}`}
              onClick={() => setMenuState(null)}
              className="w-full px-3.5 py-2 text-left text-xs font-semibold text-navy-900 dark:text-slate-100 hover:bg-slate-100 dark:hover:bg-navy-800 flex items-center gap-2"
            >
              <ExternalLink className="w-3.5 h-3.5 text-slate-500" />
              <span>View Merchant Profile</span>
            </Link>
          </div>,
          document.body,
        )}
    </section>
  );
}
