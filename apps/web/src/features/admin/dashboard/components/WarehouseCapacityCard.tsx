'use client';

import React from 'react';
import Link from 'next/link';
import {
  Boxes,
  Layers,
  ArrowUpRight,
  AlertTriangle,
  CheckCircle2,
  Users,
  ShieldCheck,
} from 'lucide-react';
import { WarehouseZoneCapacity } from '../types';

interface WarehouseCapacityCardProps {
  zones: WarehouseZoneCapacity[];
}

export function WarehouseCapacityCard({ zones }: WarehouseCapacityCardProps) {
  const totalOccupied = zones.reduce((acc, curr) => acc + curr.occupiedSlots, 0);
  const totalCapacity = zones.reduce((acc, curr) => acc + curr.totalSlots, 0);
  const totalPickers = zones.reduce((acc, curr) => acc + curr.activePickers, 0);
  const overallOccupancy = Math.round((totalOccupied / totalCapacity) * 100);

  return (
    <div className="p-6 rounded-2xl bg-white dark:bg-navy-900 border border-slate-200 dark:border-white/10 shadow-lg space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-4 border-b border-slate-100 dark:border-white/10">
        <div>
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-indigo-500/10 text-indigo-600 dark:text-indigo-400">
              <Boxes className="h-5 w-5" />
            </div>
            <h2 className="text-lg font-bold text-navy-900 dark:text-white">
              Warehouse Floor Capacity & Bin Slotting
            </h2>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Zone racking bays, pick bin slotting, reserve pallets, and active floor personnel.
          </p>
        </div>

        <div className="flex items-center gap-3 self-start sm:self-auto">
          <span className="text-xs font-bold text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-navy-950 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-white/10">
            Overall: {overallOccupancy}% ({totalOccupied} / {totalCapacity} Units)
          </span>
          <Link
            href="/admin/stock"
            className="text-xs font-bold text-orange-600 dark:text-orange-400 hover:text-orange-700 dark:hover:text-orange-300 flex items-center gap-1"
          >
            <span>Stock Audit</span>
            <ArrowUpRight className="h-3.5 w-3.5" />
          </Link>
        </div>
      </div>

      {/* Zones Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {zones.map((zone) => (
          <div
            key={zone.zoneId}
            className="p-5 rounded-2xl bg-slate-50 dark:bg-navy-950 border border-slate-200/80 dark:border-white/10 space-y-3 hover:border-indigo-500/30 transition-all group"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-navy-900 dark:text-white truncate">
                {zone.name}
              </span>
              <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-full ${
                zone.occupancyPercentage >= 85
                  ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20'
                  : 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20'
              }`}>
                {zone.occupancyPercentage}%
              </span>
            </div>

            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              {zone.type}
            </p>

            {/* Capacity Meter */}
            <div className="space-y-1">
              <div className="w-full bg-slate-200 dark:bg-navy-900 h-2 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${
                    zone.occupancyPercentage >= 85
                      ? 'bg-amber-500'
                      : 'bg-indigo-600'
                  }`}
                  style={{ width: `${zone.occupancyPercentage}%` }}
                />
              </div>
              <div className="flex items-center justify-between text-[10px] text-slate-400">
                <span>{zone.occupiedSlots} occupied</span>
                <span>{zone.totalSlots} max slots</span>
              </div>
            </div>

            {/* Bottom details */}
            <div className="flex items-center justify-between text-xs pt-2 border-t border-slate-200/60 dark:border-white/5">
              <span className="text-[11px] text-slate-500">{zone.topSkuCount} SKUs assigned</span>
              <span className="text-[11px] font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1">
                <Users className="h-3 w-3 text-orange-500" />
                {zone.activePickers} Pickers
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
