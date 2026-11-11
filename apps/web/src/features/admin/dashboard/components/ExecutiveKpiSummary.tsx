'use client';

import React from 'react';
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  PackageCheck,
  Clock,
  Sparkles,
  ShieldCheck,
  AlertCircle,
  Receipt,
  Wallet,
} from 'lucide-react';
import { ExecutiveDashboardData } from '../types';

interface ExecutiveKpiSummaryProps {
  data: ExecutiveDashboardData;
}

export function ExecutiveKpiSummary({ data }: ExecutiveKpiSummaryProps) {
  const { summary } = data;

  const formatCurrency = (val: number) => {
    if (val >= 1000000) {
      return `৳ ${(val / 1000000).toFixed(2)}M`;
    }
    if (val >= 1000) {
      return `৳ ${(val / 1000).toFixed(1)}k`;
    }
    return `৳ ${val.toLocaleString()}`;
  };

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
      {/* 1. Total Volume */}
      <div className="p-5 rounded-2xl bg-white dark:bg-navy-900 border border-slate-200 dark:border-white/10 shadow-lg relative overflow-hidden group hover:border-orange-500/30 transition-all">
        <div className="flex justify-between items-start">
          <span className="text-xs uppercase font-bold text-slate-500 dark:text-slate-400 tracking-wider">
            Total Order Volume
          </span>
          <div className="p-1.5 rounded-lg bg-orange-500/10 text-orange-600 dark:text-orange-400">
            <PackageCheck className="h-4 w-4" />
          </div>
        </div>
        <div className="text-2xl sm:text-3xl font-black mt-2 tabular-nums text-navy-900 dark:text-white">
          {summary.totalOrders.toLocaleString()}
        </div>
        <div className="mt-2 flex items-center gap-1.5 text-xs font-semibold text-emerald-600 dark:text-emerald-400">
          <TrendingUp className="h-3.5 w-3.5" />
          <span>+{summary.ordersGrowthPercentage}% vs prior</span>
        </div>
      </div>

      {/* 2. Gross 3PL Revenue */}
      <div className="p-5 rounded-2xl bg-white dark:bg-navy-900 border border-slate-200 dark:border-white/10 shadow-lg relative overflow-hidden group hover:border-indigo-500/30 transition-all">
        <div className="flex justify-between items-start">
          <span className="text-xs uppercase font-bold text-slate-500 dark:text-slate-400 tracking-wider">
            Gross 3PL Revenue
          </span>
          <div className="p-1.5 rounded-lg bg-indigo-500/10 text-indigo-600 dark:text-indigo-400">
            <Receipt className="h-4 w-4" />
          </div>
        </div>
        <div className="text-2xl sm:text-3xl font-black mt-2 tabular-nums text-indigo-600 dark:text-indigo-400">
          {formatCurrency(summary.grossRevenue)}
        </div>
        <div className="mt-2 flex items-center gap-1.5 text-xs font-semibold text-indigo-600 dark:text-indigo-400">
          <TrendingUp className="h-3.5 w-3.5" />
          <span>+{summary.revenueGrowthPercentage}% realization</span>
        </div>
      </div>

      {/* 3. Total Operating Costs */}
      <div className="p-5 rounded-2xl bg-white dark:bg-navy-900 border border-slate-200 dark:border-white/10 shadow-lg relative overflow-hidden group hover:border-slate-400/30 transition-all">
        <div className="flex justify-between items-start">
          <span className="text-xs uppercase font-bold text-slate-500 dark:text-slate-400 tracking-wider">
            Operating Expenses
          </span>
          <div className="p-1.5 rounded-lg bg-slate-500/10 text-slate-600 dark:text-slate-400">
            <Wallet className="h-4 w-4" />
          </div>
        </div>
        <div className="text-2xl sm:text-3xl font-black mt-2 tabular-nums text-slate-700 dark:text-slate-200">
          {formatCurrency(summary.totalExpenses)}
        </div>
        <div className="mt-2 flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400">
          <span>71.6% of gross revenue</span>
        </div>
      </div>

      {/* 4. NET PROFIT (KEY USER REQUIREMENT) */}
      <div className="p-5 rounded-2xl bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-emerald-950/40 dark:to-teal-950/30 border-2 border-emerald-500/40 dark:border-emerald-500/50 shadow-xl relative overflow-hidden group">
        <div className="flex justify-between items-start">
          <span className="text-xs uppercase font-extrabold text-emerald-800 dark:text-emerald-300 tracking-wider flex items-center gap-1">
            <Sparkles className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
            Net 3PL Profit
          </span>
          <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-emerald-600 text-white shadow-xs">
            Profitable
          </span>
        </div>
        <div className="text-2xl sm:text-3xl font-black mt-2 tabular-nums text-emerald-700 dark:text-emerald-300">
          +{formatCurrency(summary.netProfit)}
        </div>
        <div className="mt-2 flex items-center justify-between text-xs font-bold text-emerald-700 dark:text-emerald-400">
          <span>Margin: +{summary.profitMarginPercentage.toFixed(1)}%</span>
          <span className="text-[10px] bg-emerald-200/60 dark:bg-emerald-900/60 px-1.5 py-0.5 rounded text-emerald-900 dark:text-emerald-200">
            Net Profit
          </span>
        </div>
      </div>

      {/* 5. Dispatch SLA */}
      <div className="p-5 rounded-2xl bg-white dark:bg-navy-900 border border-slate-200 dark:border-white/10 shadow-lg relative overflow-hidden group hover:border-amber-500/30 transition-all">
        <div className="flex justify-between items-start">
          <span className="text-xs uppercase font-bold text-slate-500 dark:text-slate-400 tracking-wider">
            Dispatch SLA & Speed
          </span>
          <div className="p-1.5 rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400">
            <Clock className="h-4 w-4" />
          </div>
        </div>
        <div className="text-2xl sm:text-3xl font-black mt-2 tabular-nums text-amber-600 dark:text-amber-400">
          {summary.dispatchSlaPercentage}%
        </div>
        <div className="mt-2 flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400">
          <ShieldCheck className="h-3.5 w-3.5 text-emerald-500" />
          <span>Avg Turnaround: {summary.avgOrderTurnaroundHours} hrs</span>
        </div>
      </div>
    </div>
  );
}
