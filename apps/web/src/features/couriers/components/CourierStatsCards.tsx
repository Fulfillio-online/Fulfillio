'use client';

import React from 'react';
import { ShieldCheck, Activity, RefreshCw } from 'lucide-react';
import { CourierIntegrationItem } from '../types';

interface CourierStatsCardsProps {
  couriers: CourierIntegrationItem[];
}

export function CourierStatsCards({ couriers }: CourierStatsCardsProps) {
  const connectedCount = couriers.filter((c) => c.status === 'CONNECTED').length;
  const totalConsignments = couriers.reduce((sum, c) => sum + c.activeConsignments, 0);

  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
      <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-between shadow-sm">
        <div>
          <span className="text-xs font-semibold uppercase text-slate-400 block tracking-wider">
            Connected Couriers
          </span>
          <span className="text-2xl font-extrabold text-emerald-400 font-mono mt-1 block">
            {connectedCount} / {couriers.length} Active
          </span>
          <span className="text-[11px] text-slate-400">Available in Orders Dispatch Pipeline</span>
        </div>
        <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shrink-0">
          <ShieldCheck className="w-5 h-5" />
        </div>
      </div>

      <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-between shadow-sm">
        <div>
          <span className="text-xs font-semibold uppercase text-slate-400 block tracking-wider">
            Active Consignments
          </span>
          <span className="text-2xl font-extrabold text-white font-mono mt-1 block">
            {totalConsignments} Parcels
          </span>
          <span className="text-[11px] text-slate-400">Live webhook tracking enabled</span>
        </div>
        <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/30 flex items-center justify-center text-indigo-400 shrink-0">
          <Activity className="w-5 h-5" />
        </div>
      </div>

      <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-between shadow-sm">
        <div>
          <span className="text-xs font-semibold uppercase text-slate-400 block tracking-wider">
            Courier Override Routing
          </span>
          <span className="text-2xl font-extrabold text-emerald-400 font-mono mt-1 block">
            Enabled
          </span>
          <span className="text-[11px] text-slate-400">Operators can switch courier at Dispatch</span>
        </div>
        <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shrink-0">
          <RefreshCw className="w-5 h-5" />
        </div>
      </div>
    </div>
  );
}
