'use client';

import React, { useMemo, useState } from 'react';
import Link from 'next/link';
import {
  Banknote,
  HandCoins,
  CheckCircle2,
  Clock,
  ArrowUpRight,
  PieChart as PieChartIcon,
  ShieldCheck,
} from 'lucide-react';
import { AdminFinanceAnalyticsDto } from '@fulfillio/contracts';

interface CodSettlementSectionProps {
  codSettlement: AdminFinanceAnalyticsDto['codSettlement'];
  periodLabel: string;
}

interface PieSlice {
  id: string;
  label: string;
  amount: number;
  color: string;
  badgeClass: string;
}

function formatTaka(val: number): string {
  return `৳${Math.round(val || 0).toLocaleString('en-US')}`;
}

export function CodSettlementSection({
  codSettlement,
  periodLabel,
}: CodSettlementSectionProps) {
  const [hoveredSliceId, setHoveredSliceId] = useState<string | null>(null);

  const slices: PieSlice[] = useMemo(
    () => [
      {
        id: 'merchant-net',
        label: 'Merchant Net Share',
        amount: Math.max(0, codSettlement.merchantNetPayable),
        color: '#10b981',
        badgeClass: 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-500/30',
      },
      {
        id: 'delivery-fee',
        label: 'Courier Delivery Charges',
        amount: Math.max(0, codSettlement.deliveryFeesDeducted),
        color: '#f59e0b',
        badgeClass: 'bg-amber-500/15 text-amber-700 dark:text-amber-300 border-amber-500/30',
      },
      {
        id: 'handling-packing',
        label: '3PL Handling & Packaging Fee',
        amount: Math.max(0, codSettlement.handlingAndPackagingDeducted),
        color: '#f43f5e',
        badgeClass: 'bg-rose-500/15 text-rose-700 dark:text-rose-300 border-rose-500/30',
      },
    ],
    [codSettlement],
  );

  const totalPieAmount = useMemo(
    () => slices.reduce((sum, s) => sum + s.amount, 0),
    [slices],
  );

  // Authentic Solid SVG Pie Chart geometries meeting at center (cx, cy)
  const pieSectors = useMemo(() => {
    const cx = 90;
    const cy = 90;
    const r = 78;

    const nonZero = slices.filter((s) => s.amount > 0);
    if (totalPieAmount <= 0 || nonZero.length === 0) {
      // Muted placeholder wedges for empty state
      const placeholders = [
        { id: 'empty-1', startDeg: 0, endDeg: 280, color: '#10b981' },
        { id: 'empty-2', startDeg: 280, endDeg: 335, color: '#f59e0b' },
        { id: 'empty-3', startDeg: 335, endDeg: 360, color: '#f43f5e' },
      ];
      return {
        isEmpty: true,
        items: placeholders.map((p) => {
          const startRad = ((p.startDeg - 90) * Math.PI) / 180;
          const endRad = ((p.endDeg - 90) * Math.PI) / 180;
          const x1 = cx + r * Math.cos(startRad);
          const y1 = cy + r * Math.sin(startRad);
          const x2 = cx + r * Math.cos(endRad);
          const y2 = cy + r * Math.sin(endRad);
          const largeArc = p.endDeg - p.startDeg > 180 ? 1 : 0;
          return {
            id: p.id,
            label: '',
            amount: 0,
            pct: 0,
            color: p.color,
            isFullCircle: false,
            d: `M ${cx} ${cy} L ${x1} ${y1} A ${r} ${r} 0 ${largeArc} 1 ${x2} ${y2} Z`,
          };
        }),
      };
    }

    let currentDeg = 0;
    const items = nonZero.map((slice) => {
      const pct = (slice.amount / totalPieAmount) * 100;
      const angleDeg = (slice.amount / totalPieAmount) * 360;
      const isFullCircle = angleDeg >= 359.99;

      const startRad = ((currentDeg - 90) * Math.PI) / 180;
      const endRad = ((currentDeg + angleDeg - 90) * Math.PI) / 180;
      const x1 = cx + r * Math.cos(startRad);
      const y1 = cy + r * Math.sin(startRad);
      const x2 = cx + r * Math.cos(endRad);
      const y2 = cy + r * Math.sin(endRad);
      const largeArc = angleDeg > 180 ? 1 : 0;
      currentDeg += angleDeg;

      return {
        id: slice.id,
        label: slice.label,
        amount: slice.amount,
        pct,
        color: slice.color,
        isFullCircle,
        d: `M ${cx} ${cy} L ${x1} ${y1} A ${r} ${r} 0 ${largeArc} 1 ${x2} ${y2} Z`,
      };
    });

    return { isEmpty: false, items };
  }, [slices, totalPieAmount]);

  const activeSlice = useMemo(() => {
    if (!hoveredSliceId) return null;
    const found = slices.find((s) => s.id === hoveredSliceId);
    if (!found) return null;
    const pct = totalPieAmount > 0 ? (found.amount / totalPieAmount) * 100 : 0;
    return { ...found, pct };
  }, [hoveredSliceId, slices, totalPieAmount]);

  return (
    <section className="p-6 rounded-2xl bg-white dark:bg-navy-900 border border-slate-200/80 dark:border-white/10 shadow-sm space-y-5">
      {/* Section Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-4 border-b border-slate-200/80 dark:border-white/10">
        <div>
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-orange-500/10 border border-orange-500/20 text-orange-600 dark:text-orange-400">
              <HandCoins className="w-4 h-4" />
            </div>
            <h2 className="text-base sm:text-lg font-extrabold text-navy-900 dark:text-white">
              Section 1 · COD &amp; Merchant Settlement Summary
            </h2>
            <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-slate-100 dark:bg-navy-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-white/10">
              Pass-through Cashflow
            </span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Separates customer COD collected on behalf of merchants from Fulfillio&apos;s own fee revenue ({periodLabel}).
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link
            href="/admin/payouts"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-navy-800 hover:bg-orange-500/10 hover:text-orange-600 dark:hover:text-orange-400 border border-slate-200 dark:border-white/10 text-xs font-bold text-navy-900 dark:text-slate-100 transition-colors"
          >
            <span>Payout Requests ({codSettlement.pendingPayoutRequestsCount})</span>
            <ArrowUpRight className="w-3.5 h-3.5" />
          </Link>
          <Link
            href="/admin/billing"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-navy-800 hover:bg-orange-500/10 hover:text-orange-600 dark:hover:text-orange-400 border border-slate-200 dark:border-white/10 text-xs font-bold text-navy-900 dark:text-slate-100 transition-colors"
          >
            <span>Settlement Vouchers</span>
            <ArrowUpRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>

      {/* 4 KPI Cards + Authentic Solid Pie Chart */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-5 items-stretch">
        {/* 4 Settlement Cards (7 cols) */}
        <div className="xl:col-span-7 grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* 1. Total Order Bill Collected */}
          <div className="p-4 rounded-2xl bg-slate-50/70 dark:bg-navy-950/60 border border-slate-200/80 dark:border-white/10 flex flex-col justify-between">
            <div className="flex items-start justify-between gap-2">
              <span className="text-[11px] uppercase font-bold tracking-wider text-slate-500 dark:text-slate-400">
                Total Order Bill Collected (COD)
              </span>
              <div className="p-1.5 rounded-lg bg-orange-500/10 text-orange-600 dark:text-orange-400">
                <Banknote className="w-4 h-4" />
              </div>
            </div>
            <div className="text-2xl font-black text-navy-900 dark:text-white tabular-nums mt-2">
              {formatTaka(codSettlement.totalOrderBillCollected)}
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1.5">
              Across{' '}
              <strong className="text-navy-900 dark:text-white font-mono">
                {codSettlement.deliveredOrdersInPeriod.toLocaleString()}
              </strong>{' '}
              delivered order(s) in period
            </p>
          </div>

          {/* 2. Merchant Net Payable */}
          <div className="p-4 rounded-2xl bg-slate-50/70 dark:bg-navy-950/60 border border-slate-200/80 dark:border-white/10 flex flex-col justify-between">
            <div className="flex items-start justify-between gap-2">
              <span className="text-[11px] uppercase font-bold tracking-wider text-slate-500 dark:text-slate-400">
                Merchant Net Payable
              </span>
              <div className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                <ShieldCheck className="w-4 h-4" />
              </div>
            </div>
            <div className="text-2xl font-black text-emerald-600 dark:text-emerald-400 tabular-nums mt-2">
              {formatTaka(codSettlement.merchantNetPayable)}
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1.5">
              After deducting{' '}
              <strong className="text-rose-600 dark:text-rose-400 font-mono">
                {formatTaka(codSettlement.totalPlatformFeesDeducted)}
              </strong>{' '}
              3PL &amp; courier fees
            </p>
          </div>

          {/* 3. Total Paid to Merchants */}
          <div className="p-4 rounded-2xl bg-slate-50/70 dark:bg-navy-950/60 border border-slate-200/80 dark:border-white/10 flex flex-col justify-between">
            <div className="flex items-start justify-between gap-2">
              <span className="text-[11px] uppercase font-bold tracking-wider text-slate-500 dark:text-slate-400">
                Paid to Merchants (Period)
              </span>
              <div className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                <CheckCircle2 className="w-4 h-4" />
              </div>
            </div>
            <div className="text-2xl font-black text-navy-900 dark:text-white tabular-nums mt-2">
              {formatTaka(codSettlement.totalPaidToMerchants)}
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1.5">
              All-time settled:{' '}
              <strong className="text-navy-900 dark:text-white font-mono">
                {formatTaka(codSettlement.allTimePaidToMerchants)}
              </strong>
            </p>
          </div>

          {/* 4. Current Unpaid / Pending Liability (Live Snapshot) */}
          <div className="p-4 rounded-2xl bg-amber-500/5 border border-amber-500/30 flex flex-col justify-between">
            <div className="flex items-start justify-between gap-2">
              <span className="text-[11px] uppercase font-bold tracking-wider text-amber-700 dark:text-amber-300">
                Live Unpaid Merchant Liability
              </span>
              <div className="p-1.5 rounded-lg bg-amber-500/15 text-amber-600 dark:text-amber-400">
                <Clock className="w-4 h-4" />
              </div>
            </div>
            <div className="text-2xl font-black text-amber-600 dark:text-amber-400 tabular-nums mt-2">
              {formatTaka(codSettlement.totalUnpaidMerchantLiability)}
            </div>
            <div className="mt-2 pt-2 border-t border-amber-500/20 grid grid-cols-3 gap-1 text-[10px]">
              <div>
                <span className="text-slate-500 dark:text-slate-400 block">Hold</span>
                <strong className="font-mono text-navy-900 dark:text-white">
                  {formatTaka(codSettlement.pendingReturnWindowHold)}
                </strong>
              </div>
              <div>
                <span className="text-slate-500 dark:text-slate-400 block">Wallet</span>
                <strong className="font-mono text-navy-900 dark:text-white">
                  {formatTaka(codSettlement.readyToClaimAndWalletBalance)}
                </strong>
              </div>
              <div>
                <span className="text-slate-500 dark:text-slate-400 block">Requested</span>
                <strong className="font-mono text-amber-700 dark:text-amber-300">
                  {formatTaka(codSettlement.pendingPayoutRequestsAmount)}
                </strong>
              </div>
            </div>
          </div>
        </div>

        {/* Authentic Solid SVG Pie Chart (5 cols) */}
        <div className="xl:col-span-5 p-4 rounded-2xl bg-slate-50/70 dark:bg-navy-950/60 border border-slate-200/80 dark:border-white/10 flex flex-col justify-between">
          <div className="flex items-center justify-between gap-2 mb-3">
            <div className="flex items-center gap-2">
              <PieChartIcon className="w-4 h-4 text-orange-600 dark:text-orange-400" />
              <h3 className="text-xs font-extrabold uppercase tracking-wider text-navy-900 dark:text-white">
                COD Split Breakdown
              </h3>
            </div>
            <span className="text-[11px] font-mono text-slate-500 dark:text-slate-400">
              {formatTaka(totalPieAmount)}
            </span>
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-5 my-auto">
            <div className="shrink-0 relative">
              <svg
                viewBox="0 0 180 180"
                className={`w-40 h-40 ${pieSectors.isEmpty ? 'opacity-25' : ''}`}
                aria-label="COD Settlement Breakdown Pie Chart"
              >
                {pieSectors.items.map((sector) =>
                  sector.isFullCircle ? (
                    <circle
                      key={sector.id}
                      cx={90}
                      cy={90}
                      r={78}
                      fill={sector.color}
                      stroke="currentColor"
                      className="text-white dark:text-navy-900 transition-opacity cursor-pointer"
                      strokeWidth="2.5"
                      onMouseEnter={() => !pieSectors.isEmpty && setHoveredSliceId(sector.id)}
                      onMouseLeave={() => setHoveredSliceId(null)}
                    />
                  ) : (
                    <path
                      key={sector.id}
                      d={sector.d}
                      fill={sector.color}
                      stroke="currentColor"
                      className="text-white dark:text-navy-900 transition-all duration-200 cursor-pointer"
                      strokeWidth="2.5"
                      style={{
                        opacity:
                          hoveredSliceId && hoveredSliceId !== sector.id ? 0.65 : 1,
                        transform:
                          hoveredSliceId === sector.id ? 'scale(1.03)' : 'scale(1)',
                        transformOrigin: '90px 90px',
                      }}
                      onMouseEnter={() => !pieSectors.isEmpty && setHoveredSliceId(sector.id)}
                      onMouseLeave={() => setHoveredSliceId(null)}
                    />
                  ),
                )}
              </svg>
            </div>

            <div className="flex-1 w-full space-y-2.5">
              {slices.map((slice) => {
                const pct =
                  totalPieAmount > 0 ? (slice.amount / totalPieAmount) * 100 : 0;
                const isActive = hoveredSliceId === slice.id;
                return (
                  <div
                    key={slice.id}
                    onMouseEnter={() => setHoveredSliceId(slice.id)}
                    onMouseLeave={() => setHoveredSliceId(null)}
                    className={`p-2 rounded-xl border transition-all cursor-pointer ${
                      isActive
                        ? 'bg-white dark:bg-navy-900 border-orange-500/40 shadow-xs'
                        : 'bg-white/70 dark:bg-navy-900/50 border-slate-200/80 dark:border-white/10'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2 text-xs">
                      <span className="flex items-center gap-2 font-bold text-navy-900 dark:text-white truncate">
                        <span
                          className="w-2.5 h-2.5 rounded-full shrink-0"
                          style={{ backgroundColor: slice.color }}
                        />
                        <span className="truncate">{slice.label}</span>
                      </span>
                      <span className="font-mono font-bold text-slate-600 dark:text-slate-300 shrink-0">
                        {pct.toFixed(1)}%
                      </span>
                    </div>
                    <div className="text-[11px] font-mono font-extrabold text-navy-900 dark:text-white mt-0.5 pl-4">
                      {formatTaka(slice.amount)}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="mt-3 pt-2.5 border-t border-slate-200/80 dark:border-white/10 flex items-center justify-between text-[11px]">
            {activeSlice ? (
              <span className={`px-2 py-0.5 rounded-full border font-bold ${activeSlice.badgeClass}`}>
                {activeSlice.label}: {formatTaka(activeSlice.amount)} ({activeSlice.pct.toFixed(1)}%)
              </span>
            ) : (
              <span className="text-slate-500 dark:text-slate-400">
                {pieSectors.isEmpty
                  ? 'No delivered COD orders in selected period yet'
                  : 'Hover a pie slice to inspect exact deduction share'}
              </span>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
