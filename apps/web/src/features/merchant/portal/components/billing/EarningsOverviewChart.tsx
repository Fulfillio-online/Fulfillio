'use client';

import React from 'react';
import { BarChart3, Info } from 'lucide-react';
import { EarningsChartBucketDto, EarningsChartPeriod } from '@fulfillio/contracts';

interface EarningsOverviewChartProps {
  period: EarningsChartPeriod;
  onPeriodChange: (period: EarningsChartPeriod) => void;
  buckets: EarningsChartBucketDto[];
  grossProductEarnings: number;
  deliveryFees: number;
  handlingAndPackagingFees: number;
  refundedAmount: number;
  netEarnings: number;
  returnWindowDays: number;
}

export function EarningsOverviewChart({
  period,
  onPeriodChange,
  buckets,
  grossProductEarnings,
  deliveryFees,
  handlingAndPackagingFees,
  refundedAmount,
  netEarnings,
  returnWindowDays,
}: EarningsOverviewChartProps) {
  const maxVal = Math.max(1, ...buckets.map((b) => b.netAmount));
  const hasData = buckets.some((b) => b.netAmount > 0 || b.ordersCount > 0);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
      {/* Left: Dynamic Column Chart */}
      <div className="lg:col-span-8 rounded-2xl bg-white dark:bg-navy-900 border border-slate-200/80 dark:border-white/10 p-5 sm:p-6 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h3 className="font-bold text-sm text-navy-900 dark:text-white flex items-center gap-2">
              <BarChart3 className="h-4 w-4 text-orange-600 dark:text-orange-400" />
              <span>Earnings Velocity &amp; Revenue</span>
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Aggregated dynamically from completed merchant orders in PostgreSQL
            </p>
          </div>

          <select
            value={period}
            onChange={(e) => onPeriodChange(e.target.value as EarningsChartPeriod)}
            aria-label="Earnings timeframe"
            className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-slate-50 dark:bg-navy-950 text-navy-900 dark:text-slate-200 border border-slate-200 dark:border-white/10 focus:outline-none focus:border-orange-500 cursor-pointer"
          >
            <option value="THIS_MONTH">This Month (Weekly)</option>
            <option value="LAST_30_DAYS">Last 30 Days</option>
            <option value="LAST_6_MONTHS">Last 6 Months</option>
            <option value="ALL_TIME">All Time</option>
          </select>
        </div>

        <div className="pt-1">
          <div className="text-2xl font-black text-navy-900 dark:text-white flex items-baseline gap-1 tabular-nums">
            <span className="text-orange-600 dark:text-orange-400">৳</span>
            <span>{netEarnings.toLocaleString()}</span>
            <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 ml-2">
              Period Net Earnings
            </span>
          </div>
        </div>

        {/* Visual Vertical Column Bars */}
        <div className="pt-4 pb-2">
          {!hasData ? (
            <div className="h-44 flex flex-col items-center justify-center rounded-xl border border-dashed border-slate-200 dark:border-white/10 bg-slate-50/50 dark:bg-navy-950/40 text-xs text-slate-500 dark:text-slate-400">
              <BarChart3 className="w-6 h-6 text-slate-400 mb-1.5 opacity-60" />
              <span>No completed order earnings recorded for this timeframe yet.</span>
            </div>
          ) : (
            <>
              <div className="h-44 w-full flex items-end justify-between gap-3 sm:gap-4 px-2 sm:px-6 border-b border-slate-200/80 dark:border-white/10">
                {buckets.map((item, idx) => {
                  const pct =
                    item.netAmount > 0
                      ? Math.max(8, Math.round((item.netAmount / maxVal) * 100))
                      : 0;
                  return (
                    <div
                      key={idx}
                      className="flex-1 flex flex-col items-center gap-1.5 h-full justify-end group relative"
                    >
                      <div className="opacity-0 group-hover:opacity-100 transition-opacity text-center pointer-events-none">
                        <span className="block text-[10px] font-mono font-bold text-navy-900 dark:text-white whitespace-nowrap">
                          ৳{item.netAmount.toLocaleString()}
                        </span>
                        <span className="block text-[9px] text-slate-500 dark:text-slate-400">
                          {item.ordersCount} ord
                        </span>
                      </div>
                      <div
                        className={`w-full max-w-[48px] rounded-t-lg transition-all duration-300 relative shadow-sm ${
                          pct > 0
                            ? 'bg-gradient-to-t from-orange-600 to-amber-400 group-hover:from-orange-500 group-hover:to-amber-300'
                            : 'bg-slate-200/70 dark:bg-navy-800/70 h-1'
                        }`}
                        style={pct > 0 ? { height: `${pct}%` } : undefined}
                        title={`${item.label}: Net ৳${item.netAmount.toLocaleString()} (${item.ordersCount} orders)`}
                      />
                    </div>
                  );
                })}
              </div>

              <div className="flex justify-between px-2 sm:px-6 pt-2 text-[11px] font-semibold text-slate-500 dark:text-slate-400">
                {buckets.map((item, idx) => (
                  <span key={idx} className="flex-1 text-center truncate">
                    {item.label}
                  </span>
                ))}
              </div>
            </>
          )}
        </div>
      </div>

      {/* Right: Itemized Earnings Breakdown */}
      <div className="lg:col-span-4 rounded-2xl bg-white dark:bg-navy-900 border border-slate-200/80 dark:border-white/10 p-5 sm:p-6 shadow-sm flex flex-col justify-between">
        <div>
          <h3 className="font-bold text-sm text-navy-900 dark:text-white">Earnings breakdown</h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Live order bill &amp; deduction ledger for selected period.
          </p>

          <div className="space-y-3 mt-5 text-xs">
            <div className="flex items-center justify-between">
              <span className="text-slate-500 dark:text-slate-400">Gross Order Bill</span>
              <span className="font-bold text-navy-900 dark:text-slate-200 tabular-nums">
                +৳ {grossProductEarnings.toLocaleString()}
              </span>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-slate-500 dark:text-slate-400">Courier Delivery Fees</span>
              <span className="font-bold text-amber-600 dark:text-amber-400 tabular-nums">
                -৳ {deliveryFees.toLocaleString()}
              </span>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-slate-500 dark:text-slate-400">3PL Handling &amp; Packaging</span>
              <span className="font-bold text-rose-600 dark:text-rose-400 tabular-nums">
                -৳ {handlingAndPackagingFees.toLocaleString()}
              </span>
            </div>

            {refundedAmount > 0 && (
              <div className="flex items-center justify-between">
                <span className="text-slate-500 dark:text-slate-400">Returned / Refunded Orders</span>
                <span className="font-bold text-rose-600 dark:text-rose-400 tabular-nums">
                  ৳ {refundedAmount.toLocaleString()} reversed
                </span>
              </div>
            )}

            <div className="pt-3 border-t border-slate-200/80 dark:border-white/10 flex items-center justify-between text-sm">
              <span className="font-bold text-navy-900 dark:text-slate-200">Net earnings</span>
              <span className="font-black text-emerald-600 dark:text-emerald-400 tabular-nums">
                ৳ {netEarnings.toLocaleString()}
              </span>
            </div>
          </div>
        </div>

        <div className="mt-5 p-3 rounded-xl bg-slate-50 dark:bg-navy-950/70 border border-slate-200/80 dark:border-white/10 text-[11px] text-slate-500 dark:text-slate-400 flex items-start gap-2">
          <Info className="h-4 w-4 text-orange-600 dark:text-orange-400 shrink-0 mt-0.5" />
          <span>
            Completed order bills remain in <strong>Pending Hold</strong> during the{' '}
            <strong>{returnWindowDays}-day customer return window</strong>. Unreturned orders move automatically to{' '}
            <strong>Ready to Claim</strong>.
          </span>
        </div>
      </div>
    </div>
  );
}
