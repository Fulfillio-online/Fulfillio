'use client';

import React from 'react';
import Link from 'next/link';
import {
  Users,
  Package,
  Truck,
  HandCoins,
  RotateCcw,
  ArrowRight,
  BellRing,
} from 'lucide-react';
import { AdminOperationsDashboardDto } from '@fulfillio/contracts';

interface PendingActionCenterCardProps {
  actionCenter: AdminOperationsDashboardDto['actionCenter'];
}

export function PendingActionCenterCard({
  actionCenter,
}: PendingActionCenterCardProps) {
  const items = [
    {
      id: 'merchants',
      label: 'Merchant Approvals',
      count: actionCenter.pendingMerchantsCount,
      subtitle: 'Pending KYC / onboarding',
      href: '/admin/merchants',
      icon: Users,
    },
    {
      id: 'products',
      label: 'Product Approvals',
      count: actionCenter.pendingProductApprovalsCount,
      subtitle: 'Waiting catalog review',
      href: '/admin/products',
      icon: Package,
    },
    {
      id: 'inbound',
      label: 'Restock Requests',
      count: actionCenter.pendingRestockRequestsCount,
      subtitle: 'Inbound stock requests',
      href: '/admin/inbound',
      icon: Truck,
    },
    {
      id: 'payouts',
      label: 'Payout Requests',
      count: actionCenter.pendingPayoutRequestsCount,
      subtitle: `৳${Math.round(actionCenter.pendingPayoutRequestsAmount).toLocaleString('en-US')} pending`,
      href: '/admin/payouts',
      icon: HandCoins,
    },
    {
      id: 'returns',
      label: 'Return Requests',
      count: actionCenter.pendingReturnRequestsCount,
      subtitle: 'Awaiting reverse dispatch',
      href: '/admin/returns',
      icon: RotateCcw,
    },
  ];

  return (
    <div className="p-6 rounded-2xl bg-white dark:bg-navy-900 border border-slate-200/80 dark:border-white/10 shadow-sm space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 pb-3 border-b border-slate-200/80 dark:border-white/10">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-orange-500/10 text-orange-600 dark:text-orange-400">
            <BellRing className="h-4 w-4" />
          </div>
          <div>
            <h2 className="text-base font-extrabold text-navy-900 dark:text-white">
              Pending Approvals &amp; Action Center
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Live queues requiring admin review across onboarding, catalog, stock, and payouts.
            </p>
          </div>
        </div>

        <span
          className={`self-start sm:self-auto px-3 py-1 rounded-full text-xs font-extrabold border ${
            actionCenter.totalActionItems > 0
              ? 'bg-amber-500/15 text-amber-700 dark:text-amber-300 border-amber-500/30'
              : 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-500/30'
          }`}
        >
          {actionCenter.totalActionItems > 0
            ? `${actionCenter.totalActionItems} Action(s) Waiting`
            : 'All Queues Clear'}
        </span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
        {items.map((item) => {
          const Icon = item.icon;
          const hasPending = item.count > 0;
          return (
            <Link
              key={item.id}
              href={item.href}
              className={`p-4 rounded-xl border transition-all group flex flex-col justify-between gap-3 ${
                hasPending
                  ? 'bg-amber-500/5 border-amber-500/30 hover:border-orange-500/50'
                  : 'bg-slate-50 dark:bg-navy-950 border-slate-200/80 dark:border-white/10 hover:border-orange-500/30'
              }`}
            >
              <div className="flex items-center justify-between gap-2">
                <div className="p-2 rounded-lg bg-white dark:bg-navy-900 border border-slate-200 dark:border-white/10 text-orange-600 dark:text-orange-400">
                  <Icon className="h-4 w-4" />
                </div>
                <span
                  className={`text-xl font-black tabular-nums ${
                    hasPending
                      ? 'text-amber-600 dark:text-amber-400'
                      : 'text-slate-400 dark:text-slate-500'
                  }`}
                >
                  {item.count}
                </span>
              </div>

              <div>
                <div className="flex items-center justify-between gap-1 text-xs font-extrabold text-navy-900 dark:text-white group-hover:text-orange-600 dark:group-hover:text-orange-400 transition-colors">
                  <span>{item.label}</span>
                  <ArrowRight className="h-3.5 w-3.5 shrink-0" />
                </div>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                  {item.subtitle}
                </p>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
