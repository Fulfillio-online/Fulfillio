'use client';

import React from 'react';
import { PackageCheck, Truck, CheckCircle2, RotateCcw } from 'lucide-react';
import { DeliveryKpiData } from '../types';

interface DeliveryKpiCardsProps {
  kpiStats: DeliveryKpiData;
}

export function DeliveryKpiCards({ kpiStats }: DeliveryKpiCardsProps) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
      {/* Card 1: Total Dispatched Orders */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
            Total Dispatched Orders
          </span>
          <div className="w-9 h-9 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shrink-0">
            <PackageCheck className="w-4 h-4" />
          </div>
        </div>
        <div className="mt-3 flex items-baseline gap-2">
          <span className="text-2xl sm:text-3xl font-extrabold text-white font-mono">
            {kpiStats.totalOrders}
          </span>
          <span className="text-xs font-semibold text-emerald-400">
            Orders · {kpiStats.totalProductsSent} Products Sent
          </span>
        </div>
        <p className="text-xs text-slate-400 mt-1.5">
          Handed over from packing stations to 3PL couriers
        </p>
      </div>

      {/* Card 2: In Transit with Courier */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
            In Transit with Courier
          </span>
          <div className="w-9 h-9 rounded-xl bg-sky-500/10 border border-sky-500/30 flex items-center justify-center text-sky-400 shrink-0">
            <Truck className="w-4 h-4" />
          </div>
        </div>
        <div className="mt-3 flex items-baseline gap-2">
          <span className="text-2xl sm:text-3xl font-extrabold text-sky-400 font-mono">
            {kpiStats.inTransitCount}
          </span>
          <span className="text-xs font-semibold text-slate-300">
            Parcels on the way
          </span>
        </div>
        <p className="text-xs text-slate-400 mt-1.5">
          Out for last-mile hub sorting &amp; doorstep delivery
        </p>
      </div>

      {/* Card 3: Successfully Delivered */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
            Successfully Delivered
          </span>
          <div className="w-9 h-9 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shrink-0">
            <CheckCircle2 className="w-4 h-4" />
          </div>
        </div>
        <div className="mt-3 flex items-baseline gap-2">
          <span className="text-2xl sm:text-3xl font-extrabold text-emerald-400 font-mono">
            {kpiStats.deliveredCount}
          </span>
          <span className="px-2 py-0.5 rounded-md bg-emerald-500/15 border border-emerald-500/30 text-[11px] font-mono font-bold text-emerald-300">
            {kpiStats.deliverySuccessRate}% Success Rate
          </span>
        </div>
        <p className="text-xs text-slate-400 mt-1.5">
          COD collected &amp; verified by courier webhook
        </p>
      </div>

      {/* Card 4: Returned / RTO */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
            Returned / RTO
          </span>
          <div className="w-9 h-9 rounded-xl bg-rose-500/10 border border-rose-500/30 flex items-center justify-center text-rose-400 shrink-0">
            <RotateCcw className="w-4 h-4" />
          </div>
        </div>
        <div className="mt-3 flex items-baseline gap-2">
          <span className="text-2xl sm:text-3xl font-extrabold text-rose-400 font-mono">
            {kpiStats.returnedCount}
          </span>
          <span className="text-xs font-semibold text-rose-300">
            Parcels returned
          </span>
        </div>
        <p className="text-xs text-slate-400 mt-1.5">
          Marked for reverse logistics restocking intake
        </p>
      </div>
    </div>
  );
}
