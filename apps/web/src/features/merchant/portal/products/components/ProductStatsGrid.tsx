'use client';

import React from 'react';
import {
  Package,
  Clock,
  CheckCircle2,
  FileText,
  AlertCircle,
} from 'lucide-react';
import { ProductStats, ProductFilterTab } from '../types';

interface ProductStatsGridProps {
  stats: ProductStats;
  onSelectTab?: (tab: ProductFilterTab) => void;
  activeTab?: ProductFilterTab;
}

export function ProductStatsGrid({ stats, onSelectTab, activeTab }: ProductStatsGridProps) {
  const statItems: Array<{
    label: string;
    value: number;
    subtitle: string;
    icon: React.ReactNode;
    accentBg: string;
    tabTarget?: ProductFilterTab;
    isPrimary?: boolean;
  }> = [
    {
      label: 'Total Products',
      value: stats.totalProducts ?? stats.storeProducts ?? 0,
      subtitle: 'Registered in store catalog',
      icon: <Package className="h-5 w-5 text-orange-500" />,
      accentBg: 'bg-orange-500/10 border-orange-500/20 text-orange-500',
      tabTarget: 'ALL',
    },
    {
      label: 'Active Products',
      value: stats.activeProducts ?? stats.published ?? 0,
      subtitle: 'Approved & available to sell',
      icon: <CheckCircle2 className="h-5 w-5 text-emerald-500" />,
      accentBg: 'bg-emerald-500/10 border-emerald-500/20 text-emerald-500',
      tabTarget: 'ACTIVE',
    },
    {
      label: 'Pending',
      value: stats.pendingApproval ?? 0,
      subtitle: 'Awaiting admin review',
      icon: <Clock className="h-5 w-5 text-amber-500" />,
      accentBg: 'bg-amber-500/10 border-amber-500/20 text-amber-500',
      tabTarget: 'PENDING_APPROVAL',
    },
    {
      label: 'Drafts',
      value: stats.draftProducts ?? 0,
      subtitle: 'Unsubmitted private drafts',
      icon: <FileText className="h-5 w-5 text-slate-500" />,
      accentBg: 'bg-slate-100 dark:bg-navy-800 border-slate-200 dark:border-white/10 text-slate-500',
      tabTarget: 'DRAFT',
    },
    {
      label: 'Out of Stock',
      value: stats.outOfStock ?? 0,
      subtitle: '0 inventory units remaining',
      icon: <AlertCircle className="h-5 w-5 text-rose-500" />,
      accentBg: 'bg-rose-500/10 border-rose-500/20 text-rose-500',
      tabTarget: 'OUT_OF_STOCK',
    },
  ];

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4">
      {statItems.map((item) => {
        const isSelected = activeTab && item.tabTarget === activeTab;
        const isClickable = Boolean(item.tabTarget && onSelectTab);

        return (
          <div
            key={item.label}
            onClick={() => {
              if (item.tabTarget && onSelectTab) {
                onSelectTab(item.tabTarget);
              }
            }}
            role={isClickable ? 'button' : undefined}
            tabIndex={isClickable ? 0 : undefined}
            className={`rounded-2xl border bg-white dark:bg-navy-900 p-4 sm:p-5 shadow-xs transition-all flex flex-col justify-between ${
              isClickable ? 'cursor-pointer hover:border-orange-500/40 hover:shadow-sm hover:-translate-y-0.5' : ''
            } ${
              isSelected
                ? 'border-orange-500 ring-2 ring-orange-500/20 bg-orange-50/20 dark:bg-orange-950/20'
                : 'border-slate-200/80 dark:border-white/10'
            }`}
          >
            <div className="flex items-center justify-between gap-2">
              <span className="text-xs sm:text-sm font-semibold tracking-wide text-slate-500 dark:text-slate-400">
                {item.label}
              </span>
              <div
                className={`h-8 w-8 sm:h-9 sm:w-9 rounded-xl border flex items-center justify-center shrink-0 ${item.accentBg}`}
              >
                {item.icon}
              </div>
            </div>

            <div className="mt-3">
              <span className="text-2xl sm:text-3xl font-extrabold tracking-tight text-navy-900 dark:text-white tabular-nums">
                {item.value.toLocaleString()}
              </span>
              <p className="text-xs text-slate-400 mt-1 line-clamp-1">
                {item.subtitle}
              </p>
            </div>
          </div>
        );
      })}
    </div>
  );
}
