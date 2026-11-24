'use client';

import React from 'react';
import {
  Clock,
  PackageCheck,
  Truck,
  CheckCircle2,
  AlertTriangle,
} from 'lucide-react';
import { AdminOperationsDashboardDto } from '@fulfillio/contracts';

interface ExecutiveKpiSummaryProps {
  pipeline: AdminOperationsDashboardDto['pipeline'];
}

export function ExecutiveKpiSummary({ pipeline }: ExecutiveKpiSummaryProps) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
      {/* 1. Pending & Processing */}
      <div className="p-5 rounded-2xl bg-white dark:bg-navy-900 border border-slate-200/80 dark:border-white/10 shadow-sm hover:border-orange-500/30 transition-all">
        <div className="flex justify-between items-start gap-2">
          <span className="text-[11px] uppercase font-bold text-slate-500 dark:text-slate-400 tracking-wider">
            Pending &amp; Processing
          </span>
          <div className="p-1.5 rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400">
            <Clock className="h-4 w-4" />
          </div>
        </div>
        <div className="text-2xl sm:text-3xl font-black mt-2 tabular-nums text-navy-900 dark:text-white">
          {pipeline.pendingAndProcessingCount.toLocaleString()}
        </div>
        <div className="mt-2 text-xs text-slate-500 dark:text-slate-400">
          {pipeline.pendingCount} new · {pipeline.pickingAndAllocatedCount} picking
        </div>
      </div>

      {/* 2. Packed & Ready */}
      <div className="p-5 rounded-2xl bg-white dark:bg-navy-900 border border-slate-200/80 dark:border-white/10 shadow-sm hover:border-orange-500/30 transition-all">
        <div className="flex justify-between items-start gap-2">
          <span className="text-[11px] uppercase font-bold text-slate-500 dark:text-slate-400 tracking-wider">
            Packed &amp; Ready
          </span>
          <div className="p-1.5 rounded-lg bg-orange-500/10 text-orange-600 dark:text-orange-400">
            <PackageCheck className="h-4 w-4" />
          </div>
        </div>
        <div className="text-2xl sm:text-3xl font-black mt-2 tabular-nums text-orange-600 dark:text-orange-400">
          {pipeline.packedAndReadyCount.toLocaleString()}
        </div>
        <div className="mt-2 text-xs text-slate-500 dark:text-slate-400">
          Ready for courier pickup
        </div>
      </div>

      {/* 3. Dispatched (In Transit) */}
      <div className="p-5 rounded-2xl bg-white dark:bg-navy-900 border border-slate-200/80 dark:border-white/10 shadow-sm hover:border-sky-500/30 transition-all">
        <div className="flex justify-between items-start gap-2">
          <span className="text-[11px] uppercase font-bold text-slate-500 dark:text-slate-400 tracking-wider">
            Dispatched (In Transit)
          </span>
          <div className="p-1.5 rounded-lg bg-sky-500/10 text-sky-600 dark:text-sky-400">
            <Truck className="h-4 w-4" />
          </div>
        </div>
        <div className="text-2xl sm:text-3xl font-black mt-2 tabular-nums text-sky-600 dark:text-sky-400">
          {pipeline.dispatchedInTransitCount.toLocaleString()}
        </div>
        <div className="mt-2 text-xs text-slate-500 dark:text-slate-400">
          Out with courier riders
        </div>
      </div>

      {/* 4. Delivered Today */}
      <div className="p-5 rounded-2xl bg-emerald-50/70 dark:bg-emerald-950/30 border border-emerald-500/40 shadow-sm">
        <div className="flex justify-between items-start gap-2">
          <span className="text-[11px] uppercase font-extrabold text-emerald-700 dark:text-emerald-300 tracking-wider">
            Delivered Today
          </span>
          <div className="p-1.5 rounded-lg bg-emerald-600 text-white">
            <CheckCircle2 className="h-4 w-4" />
          </div>
        </div>
        <div className="text-2xl sm:text-3xl font-black mt-2 tabular-nums text-emerald-700 dark:text-emerald-300">
          {pipeline.deliveredTodayCount.toLocaleString()}
        </div>
        <div className="mt-2 flex items-center justify-between text-xs font-bold text-emerald-700 dark:text-emerald-400">
          <span>{pipeline.totalDeliveredAllTime.toLocaleString()} total</span>
          <span>{pipeline.deliverySuccessRate}% rate</span>
        </div>
      </div>

      {/* 5. Returned / On Hold */}
      <div className="p-5 rounded-2xl bg-white dark:bg-navy-900 border border-slate-200/80 dark:border-white/10 shadow-sm hover:border-rose-500/30 transition-all">
        <div className="flex justify-between items-start gap-2">
          <span className="text-[11px] uppercase font-bold text-slate-500 dark:text-slate-400 tracking-wider">
            Returned / On Hold
          </span>
          <div className="p-1.5 rounded-lg bg-rose-500/10 text-rose-600 dark:text-rose-400">
            <AlertTriangle className="h-4 w-4" />
          </div>
        </div>
        <div className="text-2xl sm:text-3xl font-black mt-2 tabular-nums text-rose-600 dark:text-rose-400">
          {(pipeline.returnedCount + pipeline.onHoldCount).toLocaleString()}
        </div>
        <div className="mt-2 text-xs text-slate-500 dark:text-slate-400">
          {pipeline.returnedCount} RTO · {pipeline.onHoldCount} hold · {pipeline.cancelledCount} cancel
        </div>
      </div>
    </div>
  );
}
