'use client';

import React from 'react';
import { AlertTriangle, CheckCircle2, ShieldAlert } from 'lucide-react';
import { WarehouseReturnRecord } from '../types';

interface ReturnsStatsCardsProps {
  returnsList: WarehouseReturnRecord[];
}

export function ReturnsStatsCards({ returnsList }: ReturnsStatsCardsProps) {
  const pendingCount = returnsList.filter((r) => r.status === 'PENDING_INSPECTION').length;
  const restockedCount = returnsList.filter((r) => r.status === 'RESTOCKED').length;
  const damagedCount = returnsList.filter((r) => r.status === 'DAMAGED').length;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
      <div className="p-4 rounded-2xl bg-white dark:bg-navy-900 border border-slate-200 dark:border-white/10 flex items-center justify-between shadow-sm">
        <div>
          <span className="text-xs font-semibold uppercase text-slate-600 dark:text-slate-300 block tracking-wider">
            Pending QC &amp; Restock
          </span>
          <span className="text-2xl font-extrabold text-amber-600 dark:text-amber-400 tabular-nums mt-1 block">
            {pendingCount} Parcels
          </span>
          <span className="text-xs text-slate-600 dark:text-slate-300">Awaiting visual &amp; barcode inspection</span>
        </div>
        <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-600 dark:text-amber-400 shrink-0">
          <AlertTriangle className="w-5 h-5" />
        </div>
      </div>

      <div className="p-4 rounded-2xl bg-white dark:bg-navy-900 border border-slate-200 dark:border-white/10 flex items-center justify-between shadow-sm">
        <div>
          <span className="text-xs font-semibold uppercase text-slate-600 dark:text-slate-300 block tracking-wider">
            Restocked to Shelf
          </span>
          <span className="text-2xl font-extrabold text-orange-600 dark:text-orange-400 tabular-nums mt-1 block">
            {restockedCount} Parcels
          </span>
          <span className="text-xs text-slate-600 dark:text-slate-300">Added to physical bin sellable stock</span>
        </div>
        <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-600 dark:text-emerald-400 shrink-0">
          <CheckCircle2 className="w-5 h-5" />
        </div>
      </div>

      <div className="p-4 rounded-2xl bg-white dark:bg-navy-900 border border-slate-200 dark:border-white/10 flex items-center justify-between shadow-sm">
        <div>
          <span className="text-xs font-semibold uppercase text-slate-600 dark:text-slate-300 block tracking-wider">
            Damaged / Quarantine
          </span>
          <span className="text-2xl font-extrabold text-rose-600 dark:text-rose-400 tabular-nums mt-1 block">
            {damagedCount} Parcels
          </span>
          <span className="text-xs text-slate-600 dark:text-slate-300">Held for merchant return or claim</span>
        </div>
        <div className="w-10 h-10 rounded-xl bg-rose-500/10 border border-rose-500/30 flex items-center justify-center text-rose-600 dark:text-rose-400 shrink-0">
          <ShieldAlert className="w-5 h-5" />
        </div>
      </div>
    </div>
  );
}
