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
      <div className="p-4 sm:p-5 rounded-2xl bg-slate-900 border border-slate-800 shadow-lg">
        <div className="flex items-center justify-between">
          <span className="text-xs uppercase font-bold text-slate-400">Total Registered</span>
          <div className="p-2 rounded-xl bg-slate-800 text-slate-300">
            <Store className="w-4 h-4" />
          </div>
        </div>
        <div className="text-2xl sm:text-3xl font-black text-white mt-2 font-mono">
          {merchants.length}
        </div>
        <span className="text-xs text-slate-400 mt-1 block">Verified merchant accounts</span>
      </div>

      {/* 2. Active Stores */}
      <div className="p-4 sm:p-5 rounded-2xl bg-slate-900 border border-slate-800 shadow-lg">
        <div className="flex items-center justify-between">
          <span className="text-xs uppercase font-bold text-slate-400">Active Stores</span>
          <div className="p-2 rounded-xl bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
            <UserCheck className="w-4 h-4" />
          </div>
        </div>
        <div className="text-2xl sm:text-3xl font-black text-emerald-400 mt-2 font-mono">
          {activeCount}
        </div>
        <span className="text-xs text-emerald-400/80 mt-1 block font-medium">Ready for fulfillment</span>
      </div>

      {/* 3. Pending Review */}
      <div className="p-4 sm:p-5 rounded-2xl bg-slate-900 border border-slate-800 shadow-lg">
        <div className="flex items-center justify-between">
          <span className="text-xs uppercase font-bold text-slate-400">Pending Review</span>
          <div className="p-2 rounded-xl bg-amber-500/15 text-amber-300 border border-amber-500/30">
            <Clock className="w-4 h-4" />
          </div>
        </div>
        <div className="text-2xl sm:text-3xl font-black text-amber-300 mt-2 font-mono">
          {pendingCount}
        </div>
        <span className="text-xs text-amber-400/80 mt-1 block font-medium">Awaiting admin KYC check</span>
      </div>

      {/* 4. Total Active SKUs */}
      <div className="p-4 sm:p-5 rounded-2xl bg-slate-900 border border-slate-800 shadow-lg">
        <div className="flex items-center justify-between">
          <span className="text-xs uppercase font-bold text-slate-400">Warehouse SKUs</span>
          <div className="p-2 rounded-xl bg-indigo-500/15 text-indigo-400 border border-indigo-500/30">
            <Boxes className="w-4 h-4" />
          </div>
        </div>
        <div className="text-2xl sm:text-3xl font-black text-indigo-400 mt-2 font-mono">
          {productsCount}
        </div>
        <span className="text-xs text-slate-400 mt-1 block">Live catalog items in storage</span>
      </div>
    </div>
  );
}
