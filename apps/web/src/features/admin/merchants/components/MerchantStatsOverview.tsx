import React from 'react';
import { Store, UserCheck, Clock, Boxes } from 'lucide-react';
import { MerchantRecord } from '../types';

export interface MerchantStatsOverviewProps {
  merchants: MerchantRecord[];
  productsCount: number;
}

export function MerchantStatsOverview({
  merchants,
  productsCount,
}: MerchantStatsOverviewProps) {
  const activeCount = merchants.filter((m) => m.status === 'Active').length;
  const pendingCount = merchants.filter((m) => m.status === 'Pending').length;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {/* 1. Total Registered */}
      <div className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-navy-900 border border-slate-200 dark:border-white/10 shadow-lg">
        <div className="flex items-center justify-between">
          <span className="text-xs uppercase font-bold text-slate-600 dark:text-slate-300">Total Registered</span>
          <div className="p-2 rounded-xl bg-slate-100 dark:bg-navy-800 text-slate-700 dark:text-slate-200">
            <Store className="w-4 h-4" />
          </div>
        </div>
        <div className="text-2xl sm:text-3xl font-extrabold text-navy-800 dark:text-white mt-2 tabular-nums">
          {merchants.length}
        </div>
        <span className="text-xs text-slate-600 dark:text-slate-300 mt-1 block">Verified merchant accounts</span>
      </div>

      {/* 2. Active Stores */}
      <div className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-navy-900 border border-slate-200 dark:border-white/10 shadow-lg">
        <div className="flex items-center justify-between">
          <span className="text-xs uppercase font-bold text-slate-600 dark:text-slate-300">Active Stores</span>
          <div className="p-2 rounded-xl bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30">
            <UserCheck className="w-4 h-4" />
          </div>
        </div>
        <div className="text-2xl sm:text-3xl font-extrabold text-orange-600 dark:text-orange-400 mt-2 tabular-nums">
          {activeCount}
        </div>
        <span className="text-xs text-orange-600 dark:text-orange-400 mt-1 block font-medium">Ready for fulfillment</span>
      </div>

      {/* 3. Pending Review */}
      <div className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-navy-900 border border-slate-200 dark:border-white/10 shadow-lg">
        <div className="flex items-center justify-between">
          <span className="text-xs uppercase font-bold text-slate-600 dark:text-slate-300">Pending Review</span>
          <div className="p-2 rounded-xl bg-amber-500/15 text-amber-700 dark:text-amber-300 border border-amber-500/30">
            <Clock className="w-4 h-4" />
          </div>
        </div>
        <div className="text-2xl sm:text-3xl font-extrabold text-amber-700 dark:text-amber-300 mt-2 tabular-nums">
          {pendingCount}
        </div>
        <span className="text-xs text-amber-600 dark:text-amber-400 mt-1 block font-medium">Awaiting admin KYC check</span>
      </div>

      {/* 4. Total Active SKUs */}
      <div className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-navy-900 border border-slate-200 dark:border-white/10 shadow-lg">
        <div className="flex items-center justify-between">
          <span className="text-xs uppercase font-bold text-slate-600 dark:text-slate-300">Warehouse SKUs</span>
          <div className="p-2 rounded-xl bg-indigo-500/15 text-indigo-600 dark:text-indigo-400 border border-indigo-500/30">
            <Boxes className="w-4 h-4" />
          </div>
        </div>
        <div className="text-2xl sm:text-3xl font-extrabold text-indigo-600 dark:text-indigo-400 mt-2 tabular-nums">
          {productsCount}
        </div>
        <span className="text-xs text-slate-600 dark:text-slate-300 mt-1 block">Live catalog items in storage</span>
      </div>
    </div>
  );
}
