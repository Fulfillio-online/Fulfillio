'use client';

import React from 'react';
import { TrendingUp, Clock, CreditCard, Percent } from 'lucide-react';

interface EarningsKpiCardsProps {
  totalProfit: number;
  pendingEarnings: number;
  totalPayouts: number;
  platformFees: number;
}

export function EarningsKpiCards({
  totalProfit,
  pendingEarnings,
  totalPayouts,
  platformFees,
}: EarningsKpiCardsProps) {
  const kpis = [
    {
      title: 'Total Cleared Profit',
      amount: totalProfit,
      icon: TrendingUp,
      color: 'text-emerald-400',
      bgColor: 'bg-emerald-500/10 border-emerald-500/20',
      badge: '+18.2%',
      subtext: 'Net profit settled',
    },
    {
      title: 'Pending earnings',
      amount: pendingEarnings,
      icon: Clock,
      color: 'text-amber-400',
      bgColor: 'bg-amber-500/10 border-amber-500/20',
      subtext: 'Awaiting last-mile delivery completion',
    },
    {
      title: 'Total payouts',
      amount: totalPayouts,
      icon: CreditCard,
      color: 'text-sky-400',
      bgColor: 'bg-sky-500/10 border-sky-500/20',
      subtext: 'Paid to payout account',
    },
    {
      title: 'Platform & delivery fees',
      amount: platformFees,
      icon: Percent,
      color: 'text-rose-400',
      bgColor: 'bg-rose-500/10 border-rose-500/20',
      subtext: 'Settled / courier fees',
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {kpis.map((kpi, idx) => {
        const Icon = kpi.icon;
        return (
          <div
            key={idx}
            className="p-5 rounded-2xl bg-slate-900 border border-slate-800 shadow-sm space-y-3 relative overflow-hidden"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                {kpi.title}
              </span>
              <div
                className={`w-7 h-7 rounded-lg border flex items-center justify-center shrink-0 ${kpi.bgColor} ${kpi.color}`}
              >
                <Icon className="h-3.5 w-3.5" />
              </div>
            </div>

            <div>
              <div className="text-2xl font-black text-slate-100 flex items-baseline gap-1">
                <span className="text-sm font-bold text-slate-400">৳</span>
                <span>{kpi.amount.toLocaleString()}</span>
                {kpi.badge && (
                  <span className="ml-2 text-[10px] font-bold text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded border border-emerald-500/20">
                    {kpi.badge}
                  </span>
                )}
              </div>
              <p className="text-[11px] text-slate-400 mt-1">{kpi.subtext}</p>
            </div>
          </div>
        );
      })}
    </div>
  );
}
