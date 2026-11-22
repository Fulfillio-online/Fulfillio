'use client';

import React from 'react';
import {
  Package,
  FileText,
  Clock,
  PackageCheck,
  CheckCircle2,
  Edit3,
  ArrowUpRight,
  RotateCcw,
  Boxes,
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
      icon: <Package className="h-4 w-4 text-orange-500" />,
      accentBg: 'bg-orange-500/10 border-orange-500/20 text-orange-500',
      tabTarget: 'ALL',
    },
    {
      label: 'Draft Products',
      value: stats.draftProducts ?? 0,
      subtitle: 'Saved but not submitted',
      icon: <FileText className="h-4 w-4 text-slate-500" />,
      accentBg: 'bg-slate-100 dark:bg-navy-800 border-slate-200 dark:border-white/10 text-slate-500',
      tabTarget: 'DRAFT',
    },
    {
      label: 'Pending Approval',
      value: stats.pendingApproval ?? 0,
      subtitle: 'Awaiting admin review',
      icon: <Clock className="h-4 w-4 text-amber-500" />,
      accentBg: 'bg-amber-500/10 border-amber-500/20 text-amber-500',
      tabTarget: 'PENDING_APPROVAL',
    },
    {
      label: 'Awaiting Stock',
      value: stats.awaitingStock ?? 0,
      subtitle: 'Approved; delivery pending',
      icon: <PackageCheck className="h-4 w-4 text-sky-500" />,
      accentBg: 'bg-sky-500/10 border-sky-500/20 text-sky-500',
      tabTarget: 'AWAITING_STOCK',
    },
    {
      label: 'Active Products',
      value: stats.activeProducts ?? stats.published ?? 0,
      subtitle: 'Stored & available to sell',
      icon: <CheckCircle2 className="h-4 w-4 text-emerald-500" />,
      accentBg: 'bg-emerald-500/10 border-emerald-500/20 text-emerald-500',
      tabTarget: 'ACTIVE',
    },
    {
      label: 'Edit Approval Pending',
      value: stats.editApprovalPending ?? 0,
      subtitle: 'Proposed revisions in QA',
      icon: <Edit3 className="h-4 w-4 text-indigo-500" />,
      accentBg: 'bg-indigo-500/10 border-indigo-500/20 text-indigo-500',
      tabTarget: 'EDIT_APPROVAL_PENDING',
    },
    {
      label: 'Restock Requests',
      value: stats.restockRequests ?? 0,
      subtitle: 'Inbound inventory requests',
      icon: <ArrowUpRight className="h-4 w-4 text-emerald-600" />,
      accentBg: 'bg-emerald-500/10 border-emerald-500/20 text-emerald-600',
      tabTarget: 'RESTOCK_REQUESTS',
    },
    {
      label: 'Return Requests',
      value: stats.returnRequests ?? 0,
      subtitle: 'Pending return to merchant',
      icon: <RotateCcw className="h-4 w-4 text-rose-500" />,
      accentBg: 'bg-rose-500/10 border-rose-500/20 text-rose-500',
      tabTarget: 'RETURN_REQUESTS',
    },
    {
      label: 'Total Warehouse Stock',
      value: stats.totalWarehouseStock ?? 0,
      subtitle: 'Verified physical units (pcs)',
      icon: <Boxes className="h-4 w-4 text-orange-600" />,
      accentBg: 'bg-orange-600/10 border-orange-600/20 text-orange-600',
      isPrimary: true,
    },
  ];

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-9 gap-2.5 sm:gap-3">
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
            className={`rounded-xl border bg-white dark:bg-navy-900 p-3 shadow-xs transition-all flex flex-col justify-between ${
              isClickable ? 'cursor-pointer hover:border-orange-500/40 hover:shadow-sm' : ''
            } ${
              isSelected
                ? 'border-orange-500 ring-2 ring-orange-500/20 bg-orange-50/20 dark:bg-orange-950/20'
                : 'border-slate-200/80 dark:border-white/10'
            }`}
          >
            <div className="flex items-center justify-between gap-1">
              <span className="text-[10px] sm:text-[11px] font-semibold tracking-wide text-slate-400 truncate">
                {item.label}
              </span>
              <div
                className={`h-6 w-6 sm:h-7 sm:w-7 rounded-lg border flex items-center justify-center shrink-0 ${item.accentBg}`}
              >
                {item.icon}
              </div>
            </div>

            <div className="mt-2">
              <span className="text-lg sm:text-2xl font-extrabold tracking-tight text-navy-900 dark:text-white tabular-nums">
                {item.value.toLocaleString()}
              </span>
              <p className="text-[9px] sm:text-[10px] text-slate-400 mt-0.5 line-clamp-1">
                {item.subtitle}
              </p>
            </div>
          </div>
        );
      })}
    </div>
  );
}
