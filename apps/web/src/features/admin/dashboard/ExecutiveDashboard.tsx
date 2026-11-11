'use client';

import React, { useState } from 'react';
import {
  Calendar,
  RotateCw,
  Download,
  LayoutDashboard,
  Sparkles,
  ShieldCheck,
  CheckCircle2,
} from 'lucide-react';
import { DashboardTimeframe } from './types';
import { mockDashboardData } from './mockDashboardData';
import { ExecutiveKpiSummary } from './components/ExecutiveKpiSummary';
import { FinancialProfitLossCard } from './components/FinancialProfitLossCard';
import { OrderVolumeGraphCard } from './components/OrderVolumeGraphCard';
import { CourierPerformanceCard } from './components/CourierPerformanceCard';
import { WarehouseCapacityCard } from './components/WarehouseCapacityCard';
import { ActivityLogAndShortcuts } from './components/ActivityLogAndShortcuts';

export function ExecutiveDashboard() {
  const [timeframe, setTimeframe] = useState<DashboardTimeframe>('7d');
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastRefreshed, setLastRefreshed] = useState('Just now');

  const activeData = mockDashboardData[timeframe] || mockDashboardData['7d'];

  const handleRefresh = () => {
    setIsRefreshing(true);
    setTimeout(() => {
      setIsRefreshing(false);
      setLastRefreshed('Updated just now');
    }, 600);
  };

  const timeframeOptions: { id: DashboardTimeframe; label: string }[] = [
    { id: 'today', label: 'Today (Live)' },
    { id: '7d', label: 'Last 7 Days' },
    { id: '30d', label: 'Last 30 Days' },
    { id: 'quarter', label: 'This Quarter (Q4)' },
  ];

  return (
    <div className="space-y-6">
      {/* Top Header & Range Filter Bar */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-navy-900 dark:text-white">
              Executive 3PL Dashboard
            </h1>
            <span className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
              <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>Realtime WMS Node #1</span>
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
            Realtime warehouse throughput, multi-carrier delivery SLAs, and gross revenue vs net operating profit.
          </p>
        </div>

        {/* Timeframe Filter Tabs & Action Buttons */}
        <div className="flex flex-wrap items-center gap-2 self-start md:self-auto">
          {/* Timeframe Selector */}
          <div className="flex items-center p-1 rounded-xl bg-white dark:bg-navy-900 border border-slate-200 dark:border-white/10 shadow-xs">
            {timeframeOptions.map((opt) => (
              <button
                key={opt.id}
                type="button"
                onClick={() => setTimeframe(opt.id)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  timeframe === opt.id
                    ? 'bg-orange-600 text-white shadow-sm'
                    : 'text-slate-600 dark:text-slate-400 hover:text-navy-900 dark:hover:text-white'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>

          {/* Refresh Button */}
          <button
            type="button"
            onClick={handleRefresh}
            title="Refresh realtime metrics"
            className="p-2.5 rounded-xl bg-white dark:bg-navy-900 border border-slate-200 dark:border-white/10 text-slate-600 dark:text-slate-300 hover:text-orange-500 hover:border-orange-500/30 transition-all shadow-xs cursor-pointer active:scale-95"
          >
            <RotateCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin text-orange-500' : ''}`} />
          </button>
        </div>
      </div>

      {/* 1. Scorecards: 5 Top Executive KPIs */}
      <ExecutiveKpiSummary data={activeData} />

      {/* 2. Financial Profit & Loss Analytics Engine (KEY USER REQUIREMENT) */}
      <FinancialProfitLossCard
        financials={activeData.financials}
        timeframeLabel={activeData.timeframeLabel}
      />

      {/* 3. Order Volume & Pipeline Flow Graph (KEY USER REQUIREMENT) */}
      <OrderVolumeGraphCard
        timeSeries={activeData.timeSeries}
        timeframeLabel={activeData.timeframeLabel}
      />

      {/* 4. Courier Delivery Performance (Steadfast, Pathao, RedX) */}
      <CourierPerformanceCard
        couriers={activeData.couriers}
        timeframeLabel={activeData.timeframeLabel}
      />

      {/* 5. Warehouse Capacity & Bin Slotting Utilization */}
      <WarehouseCapacityCard zones={activeData.warehouseCapacity} />

      {/* 6. Live Warehouse Operational Stream & Quick Shortcuts */}
      <ActivityLogAndShortcuts auditFeed={activeData.auditFeed} />
    </div>
  );
}
