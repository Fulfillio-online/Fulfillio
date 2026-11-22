'use client';

import React from 'react';
import { AlertTriangle, CheckCircle2, ShieldAlert, XCircle, PackageCheck, Layers } from 'lucide-react';
import { CancelledOrderItemRecord, WarehouseReturnRecord } from '../types';

interface ReturnsStatsCardsProps {
  returnsList: WarehouseReturnRecord[];
  cancelledList?: CancelledOrderItemRecord[];
  totalLedgerMovements?: number;
}

export function ReturnsStatsCards({
  returnsList,
  cancelledList = [],
  totalLedgerMovements = 0,
}: ReturnsStatsCardsProps) {
  const pendingRtoCount = returnsList.filter((r) => r.status === 'PENDING_INSPECTION').length;
  const restockedRtoCount = returnsList.filter((r) => r.status === 'RESTOCKED').length;
  const damagedCount = returnsList.filter((r) => r.status === 'DAMAGED').length;

  const totalCancelledUnits = cancelledList.reduce((sum, c) => sum + (c.qty || 1), 0);
  const totalRtoUnits = returnsList.reduce((sum, r) => sum + (r.qty || 1), 0);
  const totalRestockedUnits =
    totalCancelledUnits +
    returnsList
      .filter((r) => r.status === 'RESTOCKED')
      .reduce((sum, r) => sum + (r.qty || 1), 0);

  const totalRestockedValue =
    cancelledList.reduce((sum, c) => sum + (c.codAmount || c.qty * c.unitPrice || 0), 0) +
    returnsList
      .filter((r) => r.status === 'RESTOCKED')
      .reduce((sum, r) => sum + r.qty * 850, 0);

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {/* 1. Cancelled Orders */}
      <div className="p-4 rounded-2xl bg-white dark:bg-navy-900 border border-slate-200 dark:border-white/10 flex items-center justify-between shadow-sm">
        <div>
          <span className="text-xs font-semibold uppercase text-slate-500 dark:text-slate-400 block tracking-wider">
            Cancelled Orders
          </span>
          <span className="text-2xl font-extrabold text-navy-900 dark:text-white tabular-nums mt-1 block">
            {cancelledList.length}{' '}
            <span className="text-xs font-normal text-slate-500 dark:text-slate-400">
              ({totalCancelledUnits} pcs)
            </span>
          </span>
          <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-medium">
            Auto-restored to available stock
          </span>
        </div>
        <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-navy-800 border border-slate-200 dark:border-white/10 flex items-center justify-center text-slate-600 dark:text-slate-300 shrink-0">
          <XCircle className="w-5 h-5 text-rose-500" />
        </div>
      </div>

      {/* 2. Courier Returns (RTO) */}
      <div className="p-4 rounded-2xl bg-white dark:bg-navy-900 border border-slate-200 dark:border-white/10 flex items-center justify-between shadow-sm">
        <div>
          <span className="text-xs font-semibold uppercase text-slate-500 dark:text-slate-400 block tracking-wider">
            Inbound Returns (RTO)
          </span>
          <span className="text-2xl font-extrabold text-amber-600 dark:text-amber-400 tabular-nums mt-1 block">
            {returnsList.length}{' '}
            <span className="text-xs font-normal text-slate-500 dark:text-slate-400">
              ({pendingRtoCount} pending QC)
            </span>
          </span>
          <span className="text-[11px] text-slate-500 dark:text-slate-400">
            Steadfast, Pathao &amp; RedX parcels
          </span>
        </div>
        <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-600 dark:text-amber-400 shrink-0">
          <AlertTriangle className="w-5 h-5" />
        </div>
      </div>

      {/* 3. Sellable Stock Recovered */}
      <div className="p-4 rounded-2xl bg-white dark:bg-navy-900 border border-slate-200 dark:border-white/10 flex items-center justify-between shadow-sm">
        <div>
          <span className="text-xs font-semibold uppercase text-slate-500 dark:text-slate-400 block tracking-wider">
            Sellable Stock Recovered
          </span>
          <span className="text-2xl font-extrabold text-emerald-600 dark:text-emerald-400 tabular-nums mt-1 block">
            +{totalRestockedUnits} pcs
          </span>
          <span className="text-[11px] text-slate-500 dark:text-slate-400">
            Valued at ৳{totalRestockedValue.toLocaleString()}
          </span>
        </div>
        <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-600 dark:text-emerald-400 shrink-0">
          <PackageCheck className="w-5 h-5" />
        </div>
      </div>

      {/* 4. Quarantined / Damaged */}
      <div className="p-4 rounded-2xl bg-white dark:bg-navy-900 border border-slate-200 dark:border-white/10 flex items-center justify-between shadow-sm">
        <div>
          <span className="text-xs font-semibold uppercase text-slate-500 dark:text-slate-400 block tracking-wider">
            Damaged / Quarantine
          </span>
          <span className="text-2xl font-extrabold text-rose-600 dark:text-rose-400 tabular-nums mt-1 block">
            {damagedCount} Parcels
          </span>
          <span className="text-[11px] text-slate-500 dark:text-slate-400">
            Held for courier/merchant claims
          </span>
        </div>
        <div className="w-10 h-10 rounded-xl bg-rose-500/10 border border-rose-500/30 flex items-center justify-center text-rose-600 dark:text-rose-400 shrink-0">
          <ShieldAlert className="w-5 h-5" />
        </div>
      </div>
    </div>
  );
}
