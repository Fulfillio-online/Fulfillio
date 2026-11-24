'use client';

import React from 'react';
import Link from 'next/link';
import {
  RotateCw,
  BarChart3,
  ArrowUpRight,
  AlertCircle,
} from 'lucide-react';
import { useAdminOperationsDashboard } from '@/lib/hooks/useBilling';
import { ExecutiveKpiSummary } from './components/ExecutiveKpiSummary';
import { PendingActionCenterCard } from './components/PendingActionCenterCard';
import { CourierPerformanceCard } from './components/CourierPerformanceCard';
import { WarehouseCapacityCard } from './components/WarehouseCapacityCard';
import { ActivityLogAndShortcuts } from './components/ActivityLogAndShortcuts';

export function ExecutiveDashboard() {
  const {
    data,
    isLoading,
    isFetching,
    isError,
    error,
    refetch,
  } = useAdminOperationsDashboard();

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-navy-900 dark:text-white">
              Live Operations Dashboard
            </h1>
            <span className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
              <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>Realtime WMS</span>
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
            Live warehouse order pipeline, pending approval queues, courier network status, and bin stock.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center gap-2 self-start md:self-auto">
          <Link
            href="/admin/finance"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-orange-600 hover:bg-orange-500 text-xs font-bold text-white shadow-md shadow-orange-500/20 transition-all active:scale-95"
          >
            <BarChart3 className="h-4 w-4" />
            <span>Finance &amp; P&amp;L Analytics</span>
            <ArrowUpRight className="h-3.5 w-3.5" />
          </Link>

          <button
            type="button"
            onClick={() => refetch()}
            disabled={isFetching}
            title="Refresh live operations"
            className="p-2.5 rounded-xl bg-white dark:bg-navy-900 border border-slate-200 dark:border-white/10 text-slate-600 dark:text-slate-300 hover:text-orange-500 hover:border-orange-500/30 transition-all shadow-xs cursor-pointer active:scale-95"
          >
            <RotateCw
              className={`h-4 w-4 ${isFetching ? 'animate-spin text-orange-500' : ''}`}
            />
          </button>
        </div>
      </div>

      {isError ? (
        <div className="p-6 rounded-2xl bg-rose-500/10 border border-rose-500/30 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-rose-600 dark:text-rose-400 shrink-0 mt-0.5" />
            <div>
              <h3 className="text-sm font-extrabold text-rose-700 dark:text-rose-300">
                Could not load live warehouse operations
              </h3>
              <p className="text-xs text-rose-600/80 dark:text-rose-400/80 mt-0.5">
                {(error as any)?.message || 'Please check that the API server is running.'}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => refetch()}
            className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-xs font-bold text-white cursor-pointer self-start sm:self-auto"
          >
            Retry
          </button>
        </div>
      ) : isLoading || !data ? (
        <div className="space-y-6 animate-pulse">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
            {[1, 2, 3, 4, 5].map((n) => (
              <div
                key={n}
                className="h-28 rounded-2xl bg-slate-200/70 dark:bg-navy-900/60 border border-slate-200 dark:border-white/10"
              />
            ))}
          </div>
          <div className="h-44 rounded-2xl bg-slate-200/70 dark:bg-navy-900/60 border border-slate-200 dark:border-white/10" />
          <div className="h-64 rounded-2xl bg-slate-200/70 dark:bg-navy-900/60 border border-slate-200 dark:border-white/10" />
        </div>
      ) : (
        <>
          {/* 1. 5 Live Order Pipeline KPIs */}
          <ExecutiveKpiSummary pipeline={data.pipeline} />

          {/* 2. Pending Approvals & Action Center */}
          <PendingActionCenterCard actionCenter={data.actionCenter} />

          {/* 3. Courier Delivery & In-Transit COD */}
          <CourierPerformanceCard couriers={data.couriers} />

          {/* 4. Warehouse Floor Stock & Zone Capacity */}
          <WarehouseCapacityCard warehouseCapacity={data.warehouseCapacity} />

          {/* 5. Live Operational Activity Feed & Shortcuts */}
          <ActivityLogAndShortcuts recentActivity={data.recentActivity} />
        </>
      )}
    </div>
  );
}
