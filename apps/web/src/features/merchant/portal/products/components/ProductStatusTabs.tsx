'use client';

import React from 'react';
import {
  Layers,
  Clock,
  CheckCircle2,
  FileText,
  AlertCircle,
  XCircle,
  Edit2,
  ArrowUpRight,
} from 'lucide-react';
import { ProductFilterTab } from '../types';

interface ProductStatusTabsProps {
  activeTab: ProductFilterTab;
  onTabChange: (tab: ProductFilterTab) => void;
  counts: {
    all: number;
    active: number;
    pendingApproval: number;
    draft: number;
    rejected?: number;
    outOfStock: number;
    // Optional legacy support
    awaitingStock?: number;
    editApprovalPending?: number;
    restockRequests?: number;
    returnRequests?: number;
    published?: number;
    stockRequests?: number;
  };
}

export function ProductStatusTabs({
  activeTab,
  onTabChange,
  counts,
}: ProductStatusTabsProps) {
  const tabs: Array<{
    id: ProductFilterTab;
    label: string;
    count: number;
    icon: React.ReactNode;
    badgeStyle?: string;
  }> = [
    {
      id: 'ALL',
      label: 'All Items',
      count: counts.all,
      icon: <Layers className="h-3.5 w-3.5 text-slate-400" />,
    },
    {
      id: 'ACTIVE',
      label: 'Active',
      count: counts.active ?? counts.published ?? 0,
      icon: <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />,
      badgeStyle: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20',
    },
    {
      id: 'PENDING_APPROVAL',
      label: 'Pending',
      count: counts.pendingApproval,
      icon: <Clock className="h-3.5 w-3.5 text-amber-500" />,
      badgeStyle: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20',
    },
    {
      id: 'EDIT_APPROVAL_PENDING',
      label: 'Pending Edits',
      count: counts.editApprovalPending ?? 0,
      icon: <Edit2 className="h-3.5 w-3.5 text-orange-500" />,
      badgeStyle: 'bg-orange-500/10 text-orange-600 dark:text-orange-400 border-orange-500/20',
    },
    {
      id: 'DRAFT',
      label: 'Drafts',
      count: counts.draft,
      icon: <FileText className="h-3.5 w-3.5 text-slate-400" />,
    },
    {
      id: 'REJECTED',
      label: 'Rejected',
      count: counts.rejected ?? 0,
      icon: <XCircle className="h-3.5 w-3.5 text-rose-500" />,
      badgeStyle: 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20',
    },
    {
      id: 'OUT_OF_STOCK',
      label: 'Out of Stock',
      count: counts.outOfStock,
      icon: <AlertCircle className="h-3.5 w-3.5 text-rose-500" />,
      badgeStyle: 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20',
    },
    {
      id: 'STOCK_REQUESTS',
      label: 'Stock Requests',
      count: counts.stockRequests ?? 0,
      icon: <ArrowUpRight className="h-3.5 w-3.5 text-indigo-500" />,
      badgeStyle: 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-indigo-500/20',
    },
  ];

  return (
    <div className="flex flex-wrap items-center gap-1 sm:gap-2 border-b border-slate-200 dark:border-white/10">
      {tabs.map((tab) => {
        const isActive =
          activeTab === tab.id ||
          (tab.id === 'ACTIVE' && activeTab === 'PUBLISHED');

        return (
          <button
            key={tab.id}
            type="button"
            onClick={() => onTabChange(tab.id)}
            className={`flex items-center gap-2 py-3 px-3 sm:px-4 text-xs font-semibold whitespace-nowrap transition-colors relative cursor-pointer ${
              isActive
                ? 'text-orange-600 dark:text-orange-400 font-bold border-b-2 border-orange-500'
                : 'text-slate-500 dark:text-slate-400 hover:text-navy-900 dark:hover:text-white'
            }`}
          >
            {tab.icon}
            <span>{tab.label}</span>
            <span
              className={`text-[10px] font-mono px-1.5 py-0.5 rounded-full transition-colors ${
                isActive
                  ? 'bg-orange-500/15 text-orange-600 dark:text-orange-400 font-bold border border-orange-500/30'
                  : tab.badgeStyle && tab.count > 0
                  ? `${tab.badgeStyle} font-bold border`
                  : 'bg-slate-100 dark:bg-navy-800 text-slate-600 dark:text-slate-400 border border-slate-200/60 dark:border-white/10'
              }`}
            >
              {tab.count}
            </span>
          </button>
        );
      })}
    </div>
  );
}
