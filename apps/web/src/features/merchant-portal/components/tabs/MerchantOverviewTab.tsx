'use client';

import React from 'react';
import { Sparkles, LayoutDashboard } from 'lucide-react';
import { MerchantTab } from '../../types';

interface MerchantOverviewTabProps {
  memoCount: number;
  onSelectTab: (tab: MerchantTab) => void;
}

export function MerchantOverviewTab({ memoCount, onSelectTab }: MerchantOverviewTabProps) {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-100 flex items-center gap-2">
          <LayoutDashboard className="h-6 w-6 text-emerald-400 shrink-0" />
          <span>Merchant Store Performance</span>
        </h1>
        <p className="text-sm text-slate-400 mt-0.5">
          Real-time inventory levels, orders fulfilled by Fulfillio, and COD settlement balance.
        </p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-5 rounded-xl bg-slate-900 border border-slate-800 shadow-sm">
          <span className="text-xs uppercase font-semibold text-slate-400 tracking-wider">
            Total Fulfillments
          </span>
          <div className="text-2xl sm:text-3xl font-bold mt-2 text-slate-100">1,842</div>
          <span className="text-xs text-emerald-400 mt-1 inline-block font-medium">
            99.8% on-time dispatch
          </span>
        </div>

        <div className="p-5 rounded-xl bg-slate-900 border border-slate-800 shadow-sm">
          <span className="text-xs uppercase font-semibold text-slate-400 tracking-wider">
            Warehouse In-Stock
          </span>
          <div className="text-2xl sm:text-3xl font-bold mt-2 text-slate-100">183 Units</div>
          <span className="text-xs text-slate-400 mt-1 inline-block">Across 3 active SKUs</span>
        </div>

        <div className="p-5 rounded-xl bg-slate-900 border border-slate-800 shadow-sm">
          <span className="text-xs uppercase font-semibold text-slate-400 tracking-wider">
            Active Memo Codes
          </span>
          <div className="text-2xl sm:text-3xl font-bold text-indigo-400 mt-2">
            {memoCount} Designs
          </div>
          <span className="text-xs text-slate-400 mt-1 inline-block">1 Default / 4x6 Thermal</span>
        </div>

        <div className="p-5 rounded-xl bg-slate-900 border border-slate-800 shadow-sm">
          <span className="text-xs uppercase font-semibold text-slate-400 tracking-wider">
            Available COD Balance
          </span>
          <div className="text-2xl sm:text-3xl font-bold text-emerald-400 mt-2">৳ 184,500</div>
          <span className="text-xs text-slate-400 mt-1 inline-block">Disbursement on Friday</span>
        </div>
      </div>

      {/* Quick Info Banner */}
      <div className="p-5 rounded-xl bg-gradient-to-r from-indigo-950/60 to-slate-900 border border-indigo-800/50 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-sm">
        <div className="flex items-start sm:items-center gap-4">
          <div className="h-12 w-12 rounded-xl bg-indigo-600/20 border border-indigo-500/40 flex items-center justify-center text-indigo-400 shrink-0">
            <Sparkles className="h-6 w-6" />
          </div>
          <div>
            <h3 className="font-bold text-base text-slate-100">Bespoke Branded Invoice Delivery</h3>
            <p className="text-sm text-slate-400 max-w-2xl mt-0.5">
              When your WooCommerce or Shopify store pushes orders, specify a{' '}
              <code className="text-xs font-mono text-indigo-300 bg-slate-950 px-1.5 py-0.5 rounded border border-indigo-900/50">
                memo_code
              </code>{' '}
              to have our warehouse packers print your exact branded invoice.
            </p>
          </div>
        </div>

        <button
          onClick={() => onSelectTab('memo-designer')}
          className="w-full sm:w-auto px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs rounded-lg transition-colors shrink-0 text-center shadow-sm"
        >
          Manage Memo Designs
        </button>
      </div>
    </div>
  );
}
