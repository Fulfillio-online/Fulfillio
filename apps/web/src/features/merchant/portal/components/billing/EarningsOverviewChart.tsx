'use client';

import React from 'react';
import { BarChart3, Info } from 'lucide-react';

interface EarningsOverviewChartProps {
  grossProductEarnings: number;
  deliveryFees: number;
  netEarnings: number;
}

export function EarningsOverviewChart({
  grossProductEarnings,
  deliveryFees,
  netEarnings,
}: EarningsOverviewChartProps) {
  // Weekly simulation percentages
  const weeklyData = [
    { week: 'Week 1', amount: 8200, height: '85%' },
    { week: 'Week 2', amount: 5600, height: '60%' },
    { week: 'Week 3', amount: 4100, height: '45%' },
    { week: 'Week 4', amount: 1300, height: '20%' },
  ];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
      {/* Left: Monthly Earnings Bar Chart */}
      <div className="lg:col-span-8 rounded-2xl bg-slate-900 border border-slate-800 p-5 sm:p-6 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-bold text-sm text-slate-100 flex items-center gap-2">
              <BarChart3 className="h-4 w-4 text-emerald-400" />
              <span>Earnings overview</span>
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              The scheduled earnings aggregated from active orders of the month
            </p>
          </div>

          <span className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-slate-800 text-slate-300 border border-slate-700">
            This month
          </span>
        </div>

        <div className="pt-2">
          <div className="text-2xl font-black text-slate-100 flex items-baseline gap-1">
            <span className="text-emerald-400">৳</span>
            <span>{netEarnings.toLocaleString()}</span>
            <span className="text-xs font-medium text-emerald-400 ml-2">Total settled</span>
          </div>
        </div>

        {/* Visual Bar Columns */}
        <div className="pt-6 pb-2">
          <div className="h-44 w-full flex items-end justify-between gap-4 px-2 sm:px-6 border-b border-slate-800">
            {weeklyData.map((item, idx) => (
              <div key={idx} className="flex-1 flex flex-col items-center gap-2 h-full justify-end group">
                <span className="text-[10px] font-mono text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity">
                  ৳{item.amount.toLocaleString()}
                </span>
                <div
                  className="w-full max-w-[48px] rounded-t-lg bg-emerald-500/80 group-hover:bg-emerald-400 transition-all duration-300 relative shadow-sm"
                  style={{ height: item.height }}
                />
              </div>
            ))}
          </div>

          <div className="flex justify-between px-2 sm:px-6 pt-2 text-[11px] font-semibold text-slate-400">
            {weeklyData.map((item, idx) => (
              <span key={idx} className="flex-1 text-center">
                {item.week}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Right: Breakdown Card */}
      <div className="lg:col-span-4 rounded-2xl bg-slate-900 border border-slate-800 p-5 sm:p-6 shadow-sm flex flex-col justify-between">
        <div>
          <h3 className="font-bold text-sm text-slate-100">Earnings breakdown</h3>
          <p className="text-xs text-slate-400 mt-0.5">Where your earnings come from.</p>

          <div className="space-y-3.5 mt-5">
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-400">Product Earnings</span>
              <span className="font-bold text-slate-200">
                +৳ {grossProductEarnings.toLocaleString()}
              </span>
            </div>

            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-400">Delivery & 3PL Fees</span>
              <span className="font-bold text-rose-400">
                -৳ {deliveryFees.toLocaleString()}
              </span>
            </div>

            <div className="pt-3 border-t border-slate-800 flex items-center justify-between text-sm">
              <span className="font-bold text-slate-200">Net earnings</span>
              <span className="font-black text-emerald-400">
                ৳ {netEarnings.toLocaleString()}
              </span>
            </div>
          </div>
        </div>

        <div className="mt-5 p-3 rounded-xl bg-slate-950/70 border border-slate-800 text-[11px] text-slate-400 flex items-start gap-2">
          <Info className="h-4 w-4 text-emerald-400 shrink-0 mt-0.5" />
          <span>
            Earnings payout available once they have satisfied the 3-day customer return window.
          </span>
        </div>
      </div>
    </div>
  );
}
