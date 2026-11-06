'use client';

import React from 'react';
import { Layers } from 'lucide-react';
import { ProductFilterTab } from '../types';

interface ProductStatusTabsProps {
  activeTab: ProductFilterTab;
  onTabChange: (tab: ProductFilterTab) => void;
  counts: {
    all: number;
    published: number;
    draft: number;
    outOfStock: number;
    stockRequests: number;
  };
}

export function ProductStatusTabs({
  activeTab,
  onTabChange,
  counts,
}: ProductStatusTabsProps) {
  const tabs: { id: ProductFilterTab; label: string; count: number; isSpecial?: boolean }[] = [
    { id: 'PUBLISHED', label: 'Published', count: counts.published },
    { id: 'DRAFT', label: 'Drafts', count: counts.draft },
    { id: 'OUT_OF_STOCK', label: 'Out of Stock', count: counts.outOfStock },
    { id: 'STOCK_REQUESTS', label: 'Stock Requests', count: counts.stockRequests, isSpecial: true },
    { id: 'ALL', label: 'All Items', count: counts.all },
  ];

  return (
    <div className="flex items-center gap-1 sm:gap-2 border-b border-slate-800 overflow-x-auto no-scrollbar">
      {tabs.map((tab) => {
        const isActive = activeTab === tab.id;
        return (
          <button
            key={tab.id}
            type="button"
            onClick={() => onTabChange(tab.id)}
            className={`flex items-center gap-2 py-3 px-3 sm:px-4 text-xs font-semibold whitespace-nowrap transition-colors relative cursor-pointer ${
              isActive
                ? 'text-emerald-400 font-bold border-b-2 border-emerald-500'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            {tab.isSpecial && <Layers className="h-3.5 w-3.5 text-amber-400" />}
            <span>{tab.label}</span>
            <span
              className={`text-[10px] font-mono px-1.5 py-0.5 rounded-full transition-colors ${
                isActive
                  ? 'bg-emerald-500/20 text-emerald-300 font-bold border border-emerald-500/30'
                  : tab.isSpecial && tab.count > 0
                  ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30 font-bold'
                  : 'bg-slate-800 text-slate-400'
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
