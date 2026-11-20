'use client';

import React from 'react';
import Link from 'next/link';
import {
  Truck,
  CheckCircle2,
  RotateCcw,
  Clock,
  Banknote,
  ArrowUpRight,
  ShieldCheck,
  ChevronRight,
} from 'lucide-react';
import { CourierPerformance } from '../types';

interface CourierPerformanceCardProps {
  couriers: CourierPerformance[];
  timeframeLabel: string;
}

export function CourierPerformanceCard({
  couriers,
  timeframeLabel,
}: CourierPerformanceCardProps) {
  const formatCurrency = (val: number) => {
    if (val >= 1000000) return `৳ ${(val / 1000000).toFixed(2)}M`;
    if (val >= 1000) return `৳ ${(val / 1000).toFixed(0)}k`;
    return `৳ ${val.toLocaleString()}`;
  };

  return (
    <div className="p-6 rounded-2xl bg-white dark:bg-navy-900 border border-slate-200 dark:border-white/10 shadow-lg space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-4 border-b border-slate-100 dark:border-white/10">
        <div>
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400">
              <Truck className="h-5 w-5" />
            </div>
            <h2 className="text-lg font-bold text-navy-900 dark:text-white">
              Courier Delivery & COD Performance
            </h2>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Steadfast, Pathao & RedX delivery success ratios, turnaround SLAs, and in-transit escrow.
          </p>
        </div>

        <Link
          href="/admin/couriers"
          className="text-xs font-bold text-orange-600 dark:text-orange-400 hover:text-orange-700 dark:hover:text-orange-300 flex items-center gap-1 self-start sm:self-auto"
        >
          <span>Courier API Hub</span>
          <ArrowUpRight className="h-3.5 w-3.5" />
        </Link>
      </div>

      {/* Courier Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {couriers.map((courier) => (
          <div
            key={courier.id}
            className="p-5 rounded-2xl bg-slate-50 dark:bg-navy-950 border border-slate-200/80 dark:border-white/10 space-y-4 hover:border-orange-500/30 transition-all group"
          >
            {/* Courier Header */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="h-9 w-9 rounded-xl bg-white dark:bg-navy-900 border border-slate-200 dark:border-white/10 flex items-center justify-center font-black text-xs text-navy-900 dark:text-white shadow-xs">
                  {courier.code === 'steadfast' ? 'SF' : courier.code === 'pathao' ? 'PT' : 'RX'}
                </div>
                <div>
                  <h3 className="font-bold text-xs text-navy-900 dark:text-white group-hover:text-orange-600 dark:group-hover:text-orange-400 transition-colors">
                    {courier.name}
                  </h3>
                  <span className="text-[10px] text-slate-400">
                    {courier.sharePercentage}% Market Share
                  </span>
                </div>
              </div>

              <span className={`text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full ${
                courier.status === 'optimal'
                  ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20'
                  : 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20'
              }`}>
                {courier.status}
              </span>
            </div>

            {/* Success Meter */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-slate-600 dark:text-slate-300">
                  Delivered Success
                </span>
                <span className="font-black text-emerald-600 dark:text-emerald-400 tabular-nums">
                  {courier.deliverySuccessRate}%
                </span>
              </div>
              <div className="w-full bg-slate-200 dark:bg-navy-900 h-2 rounded-full overflow-hidden">
                <div
                  className="bg-emerald-500 h-full rounded-full transition-all duration-500"
                  style={{ width: `${courier.deliverySuccessRate}%` }}
                />
              </div>
              <div className="flex items-center justify-between text-[10px] text-slate-400">
                <span>{courier.deliveredCount.toLocaleString()} delivered</span>
                <span className="text-rose-500 font-semibold">{courier.returnRate}% RTO</span>
              </div>
            </div>

            {/* Metrics Grid */}
            <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-200/60 dark:border-white/5 text-xs">
              <div className="p-2 rounded-lg bg-white dark:bg-navy-900 border border-slate-200/60 dark:border-white/10">
                <span className="text-[10px] text-slate-400 flex items-center gap-1">
                  <Clock className="h-3 w-3 text-amber-500" />
                  Avg SLA
                </span>
                <span className="font-extrabold text-navy-900 dark:text-white tabular-nums block mt-0.5">
                  {courier.averageSlaHours} Hours
                </span>
              </div>

              <div className="p-2 rounded-lg bg-white dark:bg-navy-900 border border-slate-200/60 dark:border-white/10">
                <span className="text-[10px] text-slate-400 flex items-center gap-1">
                  <Banknote className="h-3 w-3 text-emerald-500" />
                  In-Transit COD
                </span>
                <span className="font-extrabold text-emerald-600 dark:text-emerald-400 tabular-nums block mt-0.5">
                  {formatCurrency(courier.codInTransitAmount)}
                </span>
              </div>
            </div>

            {/* Manifest Count */}
            <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400 pt-1">
              <span>{courier.activeManifests} Manifests Dispatched</span>
              <span className="font-semibold text-orange-600 dark:text-orange-400">
                {courier.totalParcels.toLocaleString()} Parcels
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
