'use client';

import React from 'react';
import { TrendingUp, Clock, CreditCard, Percent } from 'lucide-react';

interface EarningsKpiCardsProps {
  totalNetEarnings: number;
  completedOrdersCount: number;
  pendingEarnings: number;
  pendingCount: number;
  returnWindowDays: number;
  totalPayouts: number;
  paidPayoutsCount: number;
  platformFees: number;
  totalRefunded: number;
  refundedCount: number;
}

export function EarningsKpiCards({
  totalNetEarnings,
  completedOrdersCount,
  pendingEarnings,
  pendingCount,
  returnWindowDays,
  totalPayouts,
  paidPayoutsCount,
  platformFees,
  totalRefunded,
  refundedCount,
}: EarningsKpiCardsProps) {
  const kpis = [
    {
      title: 'Total Net Earnings',
      amount: totalNetEarnings,
      icon: TrendingUp,
      color: 'text-emerald-600 dark:text-emerald-400',
      bgColor: 'bg-emerald-500/10 border-emerald-500/20',
      subtext: `From ${completedOrdersCount} completed order(s)`,
    },
    {
      title: 'Pending (Return Hold)',
      amount: pendingEarnings,
      icon: Clock,
      color: 'text-amber-600 dark:text-amber-400',
      bgColor: 'bg-amber-500/10 border-amber-500/20',
      subtext: `${pendingCount} order(s) in ${returnWindowDays}-day customer return window`,
    },
    {
      title: 'Total Payouts Paid',
      amount: totalPayouts,
      icon: CreditCard,
      color: 'text-orange-600 dark:text-orange-400',
      bgColor: 'bg-orange-500/10 border-orange-500/20',
      subtext: `${paidPayoutsCount} settled payout(s) with digital proof`,
    },
    {
      title: 'Delivery & 3PL Fees',
      amount: platformFees,
      icon: Percent,
      color: 'text-rose-600 dark:text-rose-400',
      bgColor: 'bg-rose-500/10 border-rose-500/20',
      subtext:
        refundedCount > 0
          ? `${refundedCount} returned/refunded (৳${totalRefunded.toLocaleString()})`
          : 'Courier + handling + packaging fees',
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {kpis.map((kpi, idx) => {
        const Icon = kpi.icon;
        return (
          <div
            key={idx}
            className="p-5 rounded-2xl bg-white dark:bg-navy-900 border border-slate-200/80 dark:border-white/10 shadow-sm space-y-3 relative overflow-hidden"
          >
            <div className="flex items-center justify-between gap-2">
              <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                {kpi.title}
              </span>
              <div
                className={`w-7 h-7 rounded-lg border flex items-center justify-center shrink-0 ${kpi.bgColor} ${kpi.color}`}
              >
                <Icon className="h-3.5 w-3.5" />
              </div>
            </div>

            <div>
              <div className="text-2xl font-black text-navy-900 dark:text-white flex items-baseline gap-1 tabular-nums">
                <span className="text-sm font-bold text-slate-500 dark:text-slate-400">৳</span>
                <span>{kpi.amount.toLocaleString()}</span>
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">{kpi.subtext}</p>
            </div>
          </div>
        );
      })}
    </div>
  );
}
