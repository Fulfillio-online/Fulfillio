'use client';

import React from 'react';
import Link from 'next/link';
import { Boxes, ArrowUpRight, AlertTriangle } from 'lucide-react';
import { AdminOperationsDashboardDto } from '@fulfillio/contracts';

interface WarehouseCapacityCardProps {
  warehouseCapacity: AdminOperationsDashboardDto['warehouseCapacity'];
}

export function WarehouseCapacityCard({
  warehouseCapacity,
}: WarehouseCapacityCardProps) {
  return (
    <div className="p-6 rounded-2xl bg-white dark:bg-navy-900 border border-slate-200/80 dark:border-white/10 shadow-sm space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-4 border-b border-slate-200/80 dark:border-white/10">
        <div>
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-orange-500/10 text-orange-600 dark:text-orange-400">
              <Boxes className="h-5 w-5" />
            </div>
            <h2 className="text-base sm:text-lg font-extrabold text-navy-900 dark:text-white">
              Warehouse Floor Inventory &amp; Zone Stock
            </h2>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Live shelf bins, available vs reserved stock units, and low-stock reorder alerts.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3 self-start sm:self-auto">
          <span className="text-xs font-bold text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-navy-950 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-white/10 font-mono">
            {warehouseCapacity.totalBins} Bins · {warehouseCapacity.totalAvailableUnits.toLocaleString()} Avail · {warehouseCapacity.totalReservedUnits.toLocaleString()} Reserved
          </span>
          <Link
            href="/admin/bins"
            className="text-xs font-bold text-orange-600 dark:text-orange-400 hover:underline flex items-center gap-1"
          >
            <span>Manage Bins</span>
            <ArrowUpRight className="h-3.5 w-3.5" />
          </Link>
        </div>
      </div>

      {warehouseCapacity.zones.length === 0 ? (
        <div className="p-6 rounded-xl bg-slate-50 dark:bg-navy-950 border border-slate-200/80 dark:border-white/10 text-center text-xs text-slate-500 dark:text-slate-400">
          No warehouse bin zones configured yet. Go to{' '}
          <Link href="/admin/bins" className="text-orange-600 dark:text-orange-400 font-bold hover:underline">
            Warehouse Bins
          </Link>{' '}
          to create bins and track floor stock.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {warehouseCapacity.zones.map((zone) => {
            const availShare =
              zone.totalUnits > 0
                ? Math.round((zone.availableUnits / zone.totalUnits) * 100)
                : 0;
            return (
              <div
                key={zone.zoneId}
                className="p-4 rounded-2xl bg-slate-50 dark:bg-navy-950 border border-slate-200/80 dark:border-white/10 space-y-3 hover:border-orange-500/30 transition-all"
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs font-extrabold text-navy-900 dark:text-white truncate">
                    Zone {zone.zone}
                  </span>
                  <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-orange-500/10 text-orange-600 dark:text-orange-400 border border-orange-500/20">
                    {zone.binCount} bin(s)
                  </span>
                </div>

                <div className="space-y-1">
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="text-slate-500 dark:text-slate-400">Available Stock</span>
                    <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400">
                      {zone.availableUnits.toLocaleString()} ({availShare}%)
                    </span>
                  </div>
                  <div className="w-full bg-slate-200 dark:bg-navy-900 h-2 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full bg-emerald-500 transition-all duration-500"
                      style={{ width: `${availShare}%` }}
                    />
                  </div>
                </div>

                <div className="flex items-center justify-between text-[11px] pt-2 border-t border-slate-200/60 dark:border-white/5">
                  <span className="text-slate-500 dark:text-slate-400">
                    {zone.skuCount} active SKUs
                  </span>
                  {zone.reorderAlerts > 0 ? (
                    <span className="text-amber-600 dark:text-amber-400 font-bold flex items-center gap-1">
                      <AlertTriangle className="h-3 w-3" />
                      {zone.reorderAlerts} low
                    </span>
                  ) : (
                    <span className="text-slate-500 dark:text-slate-400 font-mono">
                      {zone.reservedUnits} reserved
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
