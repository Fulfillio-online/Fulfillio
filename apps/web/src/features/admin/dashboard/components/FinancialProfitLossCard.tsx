'use client';

import React, { useState } from 'react';
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  PieChart,
  BarChart3,
  CheckCircle2,
  AlertTriangle,
  ArrowUpRight,
  Sparkles,
  Layers,
  Building2,
  Truck,
  Box,
  Users,
  Cpu,
  Receipt,
  Info,
} from 'lucide-react';
import { FinancialAnalytics, DashboardTimeframe } from '../types';

interface FinancialProfitLossCardProps {
  financials: FinancialAnalytics;
  timeframeLabel: string;
}

export function FinancialProfitLossCard({
  financials,
  timeframeLabel,
}: FinancialProfitLossCardProps) {
  const [activeView, setActiveView] = useState<'overview' | 'revenue' | 'expenses' | 'statement'>('overview');

  const { grossRevenue, totalExpenses, netProfit, netMarginPercentage, isProfitable } = financials;

  const formatCurrency = (val: number) => {
    return `৳ ${val.toLocaleString()}`;
  };

  const expenseCategoryIcons = {
    facilities: Building2,
    logistics: Truck,
    packaging: Box,
    payroll: Users,
    tech: Cpu,
  };

  return (
    <div className="p-6 rounded-2xl bg-white dark:bg-navy-900 border border-slate-200 dark:border-white/10 shadow-lg space-y-6">
      {/* Header & View Tabs */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-slate-100 dark:border-white/10">
        <div>
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
              <BarChart3 className="h-5 w-5" />
            </div>
            <h2 className="text-lg font-bold text-navy-900 dark:text-white">
              Financial Profit & Loss Analytics
            </h2>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Realtime 3PL revenue realization vs direct operating expenses for {timeframeLabel}.
          </p>
        </div>

        {/* View Switcher Tabs */}
        <div className="flex items-center p-1 rounded-xl bg-slate-100 dark:bg-navy-950 border border-slate-200 dark:border-white/10 self-start sm:self-auto">
          <button
            type="button"
            onClick={() => setActiveView('overview')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              activeView === 'overview'
                ? 'bg-white dark:bg-navy-800 text-navy-900 dark:text-white shadow-xs'
                : 'text-slate-500 dark:text-slate-400 hover:text-navy-900 dark:hover:text-white'
            }`}
          >
            Overview
          </button>
          <button
            type="button"
            onClick={() => setActiveView('revenue')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              activeView === 'revenue'
                ? 'bg-white dark:bg-navy-800 text-indigo-600 dark:text-indigo-400 shadow-xs'
                : 'text-slate-500 dark:text-slate-400 hover:text-navy-900 dark:hover:text-white'
            }`}
          >
            Revenue
          </button>
          <button
            type="button"
            onClick={() => setActiveView('expenses')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              activeView === 'expenses'
                ? 'bg-white dark:bg-navy-800 text-orange-600 dark:text-orange-400 shadow-xs'
                : 'text-slate-500 dark:text-slate-400 hover:text-navy-900 dark:hover:text-white'
            }`}
          >
            Expenses
          </button>
          <button
            type="button"
            onClick={() => setActiveView('statement')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              activeView === 'statement'
                ? 'bg-white dark:bg-navy-800 text-emerald-600 dark:text-emerald-400 shadow-xs'
                : 'text-slate-500 dark:text-slate-400 hover:text-navy-900 dark:hover:text-white'
            }`}
          >
            P&L Statement
          </button>
        </div>
      </div>

      {/* PROFIT OR LOSS EXECUTIVE VERDICT BANNER (KEY USER REQUIREMENT) */}
      <div className={`p-5 rounded-2xl border-2 flex flex-col md:flex-row md:items-center md:justify-between gap-4 shadow-sm ${
        isProfitable
          ? 'bg-emerald-50/80 dark:bg-emerald-950/30 border-emerald-500/50'
          : 'bg-rose-50/80 dark:bg-rose-950/30 border-rose-500/50'
      }`}>
        <div className="flex items-start md:items-center gap-3.5">
          <div className={`h-12 w-12 rounded-xl flex items-center justify-center shrink-0 shadow-sm ${
            isProfitable
              ? 'bg-emerald-600 text-white'
              : 'bg-rose-600 text-white'
          }`}>
            {isProfitable ? (
              <CheckCircle2 className="h-6 w-6" />
            ) : (
              <AlertTriangle className="h-6 w-6" />
            )}
          </div>

          <div>
            <div className="flex items-center gap-2">
              <span className={`text-xs uppercase font-black px-2.5 py-0.5 rounded-full ${
                isProfitable
                  ? 'bg-emerald-600 text-white'
                  : 'bg-rose-600 text-white'
              }`}>
                {isProfitable ? 'PROFITABLE (POSITIVE MARGIN)' : 'OPERATING LOSS (DEFICIT)'}
              </span>
              <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                {timeframeLabel}
              </span>
            </div>

            <p className="text-sm font-bold text-navy-900 dark:text-white mt-1">
              {isProfitable
                ? `Net Profit Margin: +${netMarginPercentage.toFixed(2)}% — Topline revenue exceeds expenses by ৳ ${netProfit.toLocaleString()}!`
                : `Operating Deficit: ${netMarginPercentage.toFixed(2)}% — Direct costs exceed realized revenue.`}
            </p>
            <p className="text-xs text-slate-600 dark:text-slate-300 mt-0.5">
              Gross top-line revenue of {formatCurrency(grossRevenue)} net of total operating expenses of {formatCurrency(totalExpenses)} yields net positive profit.
            </p>
          </div>
        </div>

        {/* Big Profit Number Display */}
        <div className="bg-white dark:bg-navy-900/90 border border-slate-200 dark:border-white/10 rounded-xl p-3.5 md:text-right shrink-0">
          <span className="text-[11px] uppercase font-bold text-slate-400 block tracking-wider">
            Net Realized Profit
          </span>
          <span className={`text-2xl font-black tabular-nums block ${
            isProfitable ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'
          }`}>
            +{formatCurrency(netProfit)}
          </span>
          <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">
            {netMarginPercentage.toFixed(1)}% of gross top-line
          </span>
        </div>
      </div>

      {/* Visual Comparison Progress Bars: Revenue vs Expenses vs Net Profit */}
      <div className="space-y-3 p-4 rounded-xl bg-slate-50 dark:bg-navy-950 border border-slate-200 dark:border-white/10">
        <div className="flex items-center justify-between text-xs font-bold text-slate-700 dark:text-slate-300">
          <span>Comparative Cash Flow Visualizer</span>
          <span className="text-slate-500 font-normal">Base: 100% Gross Revenue</span>
        </div>

        {/* Multi-segment visual bar */}
        <div className="w-full h-8 rounded-xl bg-slate-200 dark:bg-navy-900 overflow-hidden flex p-1 gap-1 shadow-inner">
          {/* Operating Expense Segment */}
          <div
            style={{ width: `${(totalExpenses / grossRevenue) * 100}%` }}
            className="h-full rounded-lg bg-slate-500 dark:bg-slate-600 flex items-center justify-center text-[10px] font-black text-white truncate px-2 transition-all duration-500"
            title={`Operating Expenses: ${formatCurrency(totalExpenses)} (${((totalExpenses / grossRevenue) * 100).toFixed(1)}%)`}
          >
            Expenses: {((totalExpenses / grossRevenue) * 100).toFixed(0)}%
          </div>

          {/* Net Profit Segment */}
          <div
            style={{ width: `${(netProfit / grossRevenue) * 100}%` }}
            className="h-full rounded-lg bg-emerald-500 flex items-center justify-center text-[10px] font-black text-white truncate px-2 shadow-sm transition-all duration-500 animate-pulse"
            title={`Net Profit: +${formatCurrency(netProfit)} (${netMarginPercentage.toFixed(1)}%)`}
          >
            Net Profit: +{netMarginPercentage.toFixed(0)}%
          </div>
        </div>

        <div className="grid grid-cols-3 gap-2 pt-1 text-center text-xs">
          <div className="p-2 rounded-lg bg-white dark:bg-navy-900 border border-slate-200/80 dark:border-white/10">
            <span className="text-[10px] uppercase font-bold text-indigo-600 dark:text-indigo-400 block">
              Gross Revenue
            </span>
            <span className="font-extrabold text-navy-900 dark:text-white tabular-nums">
              {formatCurrency(grossRevenue)}
            </span>
          </div>

          <div className="p-2 rounded-lg bg-white dark:bg-navy-900 border border-slate-200/80 dark:border-white/10">
            <span className="text-[10px] uppercase font-bold text-slate-500 dark:text-slate-400 block">
              Total Expenses
            </span>
            <span className="font-extrabold text-navy-900 dark:text-white tabular-nums">
              {formatCurrency(totalExpenses)}
            </span>
          </div>

          <div className="p-2 rounded-lg bg-emerald-500/10 border border-emerald-500/30">
            <span className="text-[10px] uppercase font-bold text-emerald-600 dark:text-emerald-400 block">
              Net Profit
            </span>
            <span className="font-extrabold text-emerald-600 dark:text-emerald-400 tabular-nums">
              +{formatCurrency(netProfit)}
            </span>
          </div>
        </div>
      </div>

      {/* Dynamic Content Views */}
      {activeView === 'overview' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 pt-2">
          {/* Top Revenue Streams */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400 flex items-center gap-1.5">
                <Receipt className="h-4 w-4" />
                <span>Primary Revenue Channels</span>
              </h3>
              <button
                onClick={() => setActiveView('revenue')}
                className="text-xs text-indigo-600 dark:text-indigo-400 hover:underline font-semibold"
              >
                View all ({financials.revenueStreams.length})
              </button>
            </div>

            <div className="space-y-2.5">
              {financials.revenueStreams.slice(0, 3).map((stream) => (
                <div
                  key={stream.id}
                  className="p-3.5 rounded-xl bg-slate-50 dark:bg-navy-950 border border-slate-200/80 dark:border-white/10 space-y-1.5"
                >
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-navy-900 dark:text-white">
                      {stream.name}
                    </span>
                    <span className="font-extrabold text-indigo-600 dark:text-indigo-400 tabular-nums">
                      {formatCurrency(stream.amount)}
                    </span>
                  </div>
                  <div className="w-full bg-slate-200 dark:bg-navy-900 h-1.5 rounded-full overflow-hidden">
                    <div
                      className="bg-indigo-600 h-full rounded-full"
                      style={{ width: `${stream.sharePercentage}%` }}
                    />
                  </div>
                  <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400">
                    <span>{stream.sharePercentage}% of revenue</span>
                    <span className="text-emerald-600 dark:text-emerald-400 font-semibold">
                      +{stream.changePercentage}%
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Top Operating Expenses */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold uppercase tracking-wider text-orange-600 dark:text-orange-400 flex items-center gap-1.5">
                <Building2 className="h-4 w-4" />
                <span>Key Operating Cost Centers</span>
              </h3>
              <button
                onClick={() => setActiveView('expenses')}
                className="text-xs text-orange-600 dark:text-orange-400 hover:underline font-semibold"
              >
                View all ({financials.expenses.length})
              </button>
            </div>

            <div className="space-y-2.5">
              {financials.expenses.slice(0, 3).map((exp) => {
                const Icon = expenseCategoryIcons[exp.category] || Box;
                return (
                  <div
                    key={exp.id}
                    className="p-3.5 rounded-xl bg-slate-50 dark:bg-navy-950 border border-slate-200/80 dark:border-white/10 space-y-1.5"
                  >
                    <div className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-1.5">
                        <Icon className="h-3.5 w-3.5 text-slate-400" />
                        <span className="font-bold text-navy-900 dark:text-white">
                          {exp.name}
                        </span>
                      </div>
                      <span className="font-extrabold text-slate-700 dark:text-slate-300 tabular-nums">
                        {formatCurrency(exp.amount)}
                      </span>
                    </div>
                    <div className="w-full bg-slate-200 dark:bg-navy-900 h-1.5 rounded-full overflow-hidden">
                      <div
                        className="bg-orange-500 h-full rounded-full"
                        style={{ width: `${exp.sharePercentage}%` }}
                      />
                    </div>
                    <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400">
                      <span>{exp.sharePercentage}% of expenses</span>
                      <span>Category: {exp.category}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Detailed Revenue Streams View */}
      {activeView === 'revenue' && (
        <div className="space-y-3 pt-2">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-navy-900 dark:text-white">
              All 3PL Revenue Streams Breakdown
            </h3>
            <span className="text-xs font-bold text-indigo-600 dark:text-indigo-400">
              Total: {formatCurrency(grossRevenue)}
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {financials.revenueStreams.map((stream) => (
              <div
                key={stream.id}
                className="p-4 rounded-xl bg-slate-50 dark:bg-navy-950 border border-slate-200/80 dark:border-white/10 space-y-2"
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold text-xs text-navy-900 dark:text-white">
                    {stream.name}
                  </span>
                  <span className="text-xs font-black text-indigo-600 dark:text-indigo-400 tabular-nums">
                    {formatCurrency(stream.amount)}
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
                  {stream.description}
                </p>
                <div className="w-full bg-slate-200 dark:bg-navy-900 h-1.5 rounded-full overflow-hidden">
                  <div
                    className="bg-indigo-600 h-full rounded-full"
                    style={{ width: `${stream.sharePercentage}%` }}
                  />
                </div>
                <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400 pt-0.5">
                  <span>Share: {stream.sharePercentage}%</span>
                  <span className="text-emerald-600 dark:text-emerald-400 font-semibold">
                    +{stream.changePercentage}% MoM
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Detailed Expenses View */}
      {activeView === 'expenses' && (
        <div className="space-y-3 pt-2">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-navy-900 dark:text-white">
              Warehouse & Logistics Operating Costs Breakdown
            </h3>
            <span className="text-xs font-bold text-orange-600 dark:text-orange-400">
              Total: {formatCurrency(totalExpenses)}
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {financials.expenses.map((exp) => {
              const Icon = expenseCategoryIcons[exp.category] || Box;
              return (
                <div
                  key={exp.id}
                  className="p-4 rounded-xl bg-slate-50 dark:bg-navy-950 border border-slate-200/80 dark:border-white/10 space-y-2"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="p-1 rounded-md bg-orange-500/10 text-orange-600 dark:text-orange-400">
                        <Icon className="h-3.5 w-3.5" />
                      </div>
                      <span className="font-bold text-xs text-navy-900 dark:text-white">
                        {exp.name}
                      </span>
                    </div>
                    <span className="text-xs font-black text-slate-800 dark:text-slate-200 tabular-nums">
                      {formatCurrency(exp.amount)}
                    </span>
                  </div>
                  <div className="w-full bg-slate-200 dark:bg-navy-900 h-1.5 rounded-full overflow-hidden">
                    <div
                      className="bg-orange-500 h-full rounded-full"
                      style={{ width: `${exp.sharePercentage}%` }}
                    />
                  </div>
                  <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400 pt-0.5">
                    <span>{exp.sharePercentage}% of total budget</span>
                    <span className="capitalize px-1.5 py-0.5 rounded bg-slate-200/60 dark:bg-navy-900 text-[10px]">
                      {exp.category}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Full Statement View */}
      {activeView === 'statement' && (
        <div className="space-y-4 pt-2">
          <div className="border border-slate-200 dark:border-white/10 rounded-xl overflow-hidden">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-100 dark:bg-navy-950 border-b border-slate-200 dark:border-white/10 text-slate-600 dark:text-slate-300 font-bold uppercase text-[10px] tracking-wider">
                <tr>
                  <th className="py-2.5 px-4">Line Item</th>
                  <th className="py-2.5 px-4 text-center">Category</th>
                  <th className="py-2.5 px-4 text-right">Amount (BDT)</th>
                  <th className="py-2.5 px-4 text-right">Margin / Share</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-white/5">
                <tr className="bg-indigo-50/50 dark:bg-indigo-950/20 font-bold">
                  <td className="py-2 px-4 text-indigo-700 dark:text-indigo-300">1. GROSS REVENUE</td>
                  <td className="py-2 px-4 text-center text-slate-500">Invoiced</td>
                  <td className="py-2 px-4 text-right text-indigo-700 dark:text-indigo-300 font-extrabold">{formatCurrency(grossRevenue)}</td>
                  <td className="py-2 px-4 text-right text-indigo-700 dark:text-indigo-300">100.0%</td>
                </tr>
                {financials.revenueStreams.map((s) => (
                  <tr key={s.id} className="text-slate-600 dark:text-slate-300">
                    <td className="py-1.5 px-4 pl-8">{s.name}</td>
                    <td className="py-1.5 px-4 text-center text-[10px] text-slate-400">Revenue Stream</td>
                    <td className="py-1.5 px-4 text-right font-medium">{formatCurrency(s.amount)}</td>
                    <td className="py-1.5 px-4 text-right text-slate-400">{s.sharePercentage}%</td>
                  </tr>
                ))}

                <tr className="bg-slate-100 dark:bg-navy-950 font-bold">
                  <td className="py-2 px-4 text-slate-800 dark:text-slate-200">2. OPERATING EXPENSES</td>
                  <td className="py-2 px-4 text-center text-slate-500">Cost of Ops</td>
                  <td className="py-2 px-4 text-right text-slate-800 dark:text-slate-200 font-extrabold">{formatCurrency(totalExpenses)}</td>
                  <td className="py-2 px-4 text-right text-slate-800 dark:text-slate-200">{((totalExpenses / grossRevenue) * 100).toFixed(1)}%</td>
                </tr>
                {financials.expenses.map((e) => (
                  <tr key={e.id} className="text-slate-600 dark:text-slate-300">
                    <td className="py-1.5 px-4 pl-8">{e.name}</td>
                    <td className="py-1.5 px-4 text-center text-[10px] capitalize text-slate-400">{e.category}</td>
                    <td className="py-1.5 px-4 text-right font-medium">{formatCurrency(e.amount)}</td>
                    <td className="py-1.5 px-4 text-right text-slate-400">{e.sharePercentage}%</td>
                  </tr>
                ))}

                <tr className="bg-emerald-50 dark:bg-emerald-950/40 font-black text-sm border-t-2 border-emerald-500/50">
                  <td className="py-3 px-4 text-emerald-800 dark:text-emerald-300">3. NET OPERATING PROFIT</td>
                  <td className="py-3 px-4 text-center text-emerald-700 dark:text-emerald-400 uppercase text-[10px]">Surplus Margin</td>
                  <td className="py-3 px-4 text-right text-emerald-700 dark:text-emerald-300 text-base">+{formatCurrency(netProfit)}</td>
                  <td className="py-3 px-4 text-right text-emerald-700 dark:text-emerald-300 text-base">+{netMarginPercentage.toFixed(2)}%</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
