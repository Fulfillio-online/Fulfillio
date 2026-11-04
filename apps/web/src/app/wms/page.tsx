'use client';

import React from 'react';
import Link from 'next/link';
import {
  PackageCheck,
  Printer,
  BookmarkCheck,
  Truck,
  ArrowRight,
  Warehouse,
  Activity,
  Layers,
  Zap,
} from 'lucide-react';
import { useWms } from '@/features/wms';

export default function WmsDashboardPage() {
  const { counts, station, orders } = useWms();

  const pipelineCards = [
    {
      step: 'Step 1',
      title: 'Pick List',
      count: counts.readyToPick,
      unit: 'items pending',
      desc: 'Collect items from designated shelf bins into pick cart.',
      href: '/wms/pick',
      cta: 'Start Picking',
      icon: PackageCheck,
      color: 'emerald',
      bgBorder: 'hover:border-emerald-500/50',
    },
    {
      step: 'Step 2',
      title: 'Pack & Print Memo',
      count: counts.picked,
      unit: 'orders ready',
      desc: 'Verify items, pack into polybags/boxes, and auto-print 4x6 thermal invoices.',
      href: '/wms/pack',
      cta: 'Open Packing Desk',
      icon: Printer,
      color: 'indigo',
      bgBorder: 'hover:border-indigo-500/50',
    },
    {
      step: 'Step 3',
      title: 'Courier Booking',
      count: counts.packed,
      unit: 'parcels waiting',
      desc: 'One-click API consignment booking with Steadfast, Pathao, and RedX.',
      href: '/wms/book',
      cta: 'Book Consignments',
      icon: BookmarkCheck,
      color: 'amber',
      bgBorder: 'hover:border-amber-500/50',
    },
    {
      step: 'Step 4',
      title: 'Courier Handover',
      count: counts.booked,
      unit: 'ready for rider',
      desc: 'Scan parcels into manifest sheets and hand over to courier drivers.',
      href: '/wms/handover',
      cta: 'Handover & Manifest',
      icon: Truck,
      color: 'teal',
      bgBorder: 'hover:border-teal-500/50',
    },
  ];

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="p-5 rounded-2xl bg-gradient-to-r from-slate-900 via-slate-900/90 to-emerald-950/20 border border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-lg">
        <div>
          <div className="flex items-center gap-2">
            <span className="h-2.5 w-2.5 rounded-full bg-emerald-400 animate-pulse" />
            <h1 className="text-lg font-black text-white tracking-tight">
              Warehouse Floor Operations Dashboard
            </h1>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Current Station: <span className="font-semibold text-slate-200">{station.stationName}</span> •{' '}
            Shift: <span className="text-emerald-400 font-semibold">{station.shift}</span>
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/wms/pick"
            className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center gap-2 shadow-md transition-all active:scale-95"
          >
            <Zap className="h-4 w-4" />
            <span>Fast Launch: Pick List</span>
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>
      </div>

      {/* 4-Step Pipeline Action Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {pipelineCards.map((card) => {
          const Icon = card.icon;
          return (
            <div
              key={card.step}
              className={`p-5 rounded-2xl bg-slate-900 border border-slate-800 flex flex-col justify-between transition-all shadow-md group ${card.bgBorder}`}
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400 font-mono">
                    {card.step}
                  </span>
                  <div className="h-8 w-8 rounded-xl bg-slate-800 flex items-center justify-center text-slate-300 group-hover:bg-emerald-500 group-hover:text-slate-950 transition-colors">
                    <Icon className="h-4 w-4" />
                  </div>
                </div>

                <div>
                  <h3 className="font-extrabold text-base text-slate-100 group-hover:text-white transition-colors">
                    {card.title}
                  </h3>
                  <div className="flex items-baseline gap-1.5 mt-1">
                    <span className="font-mono text-2xl font-black text-emerald-400">
                      {card.count}
                    </span>
                    <span className="text-xs text-slate-400">{card.unit}</span>
                  </div>
                  <p className="text-xs text-slate-400 mt-2 leading-relaxed">
                    {card.desc}
                  </p>
                </div>
              </div>

              <div className="pt-4 mt-4 border-t border-slate-800/80">
                <Link
                  href={card.href}
                  className="w-full py-2 px-3 rounded-xl bg-slate-800 hover:bg-emerald-600 text-slate-200 hover:text-white text-xs font-bold flex items-center justify-between transition-all shadow-sm"
                >
                  <span>{card.cta}</span>
                  <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              </div>
            </div>
          );
        })}
      </div>

      {/* Floor Shift Performance Overview */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Real-time Stage Distribution */}
        <div className="lg:col-span-2 p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-200 flex items-center gap-2">
              <Layers className="h-4 w-4 text-emerald-400" />
              <span>Current Batch Progression</span>
            </h3>
            <span className="text-xs font-mono text-slate-400">
              Total {orders.length} Active Orders
            </span>
          </div>

          <div className="space-y-3">
            <div>
              <div className="flex justify-between text-xs text-slate-300 mb-1 font-semibold">
                <span>1. Ready to Pick</span>
                <span className="font-mono">{counts.readyToPick} orders</span>
              </div>
              <div className="w-full bg-slate-950 h-2.5 rounded-full overflow-hidden border border-slate-800">
                <div
                  className="bg-emerald-500 h-full rounded-full transition-all duration-500"
                  style={{
                    width: `${Math.round((counts.readyToPick / (orders.length || 1)) * 100)}%`,
                  }}
                />
              </div>
            </div>

            <div>
              <div className="flex justify-between text-xs text-slate-300 mb-1 font-semibold">
                <span>2. Picked (Waiting Pack)</span>
                <span className="font-mono">{counts.picked} orders</span>
              </div>
              <div className="w-full bg-slate-950 h-2.5 rounded-full overflow-hidden border border-slate-800">
                <div
                  className="bg-indigo-500 h-full rounded-full transition-all duration-500"
                  style={{
                    width: `${Math.round((counts.picked / (orders.length || 1)) * 100)}%`,
                  }}
                />
              </div>
            </div>

            <div>
              <div className="flex justify-between text-xs text-slate-300 mb-1 font-semibold">
                <span>3. Packed (Waiting Courier Booking)</span>
                <span className="font-mono">{counts.packed} parcels</span>
              </div>
              <div className="w-full bg-slate-950 h-2.5 rounded-full overflow-hidden border border-slate-800">
                <div
                  className="bg-amber-500 h-full rounded-full transition-all duration-500"
                  style={{
                    width: `${Math.round((counts.packed / (orders.length || 1)) * 100)}%`,
                  }}
                />
              </div>
            </div>

            <div>
              <div className="flex justify-between text-xs text-slate-300 mb-1 font-semibold">
                <span>4. Booked (Waiting Driver Handover)</span>
                <span className="font-mono">{counts.booked} parcels</span>
              </div>
              <div className="w-full bg-slate-950 h-2.5 rounded-full overflow-hidden border border-slate-800">
                <div
                  className="bg-teal-500 h-full rounded-full transition-all duration-500"
                  style={{
                    width: `${Math.round((counts.booked / (orders.length || 1)) * 100)}%`,
                  }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Station Hardware & Scanner Status */}
        <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-4">
          <h3 className="text-sm font-bold text-slate-200 flex items-center gap-2">
            <Activity className="h-4 w-4 text-emerald-400" />
            <span>Station Peripherals</span>
          </h3>

          <div className="space-y-3 text-xs">
            <div className="p-3 rounded-xl bg-slate-950 border border-slate-800/80 flex items-center justify-between">
              <div>
                <span className="font-bold text-slate-200 block">Thermal Slip Printer</span>
                <span className="text-[11px] text-slate-400">4x6 Reseller Memo Paper</span>
              </div>
              <span className="px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 font-mono text-[10px] font-bold border border-emerald-500/30">
                READY
              </span>
            </div>

            <div className="p-3 rounded-xl bg-slate-950 border border-slate-800/80 flex items-center justify-between">
              <div>
                <span className="font-bold text-slate-200 block">Barcode Wedge Scanner</span>
                <span className="text-[11px] text-slate-400">USB HID / Bluetooth</span>
              </div>
              <span className="px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 font-mono text-[10px] font-bold border border-emerald-500/30">
                CONNECTED
              </span>
            </div>

            <div className="p-3 rounded-xl bg-slate-950 border border-slate-800/80 flex items-center justify-between">
              <div>
                <span className="font-bold text-slate-200 block">Weighing Scale</span>
                <span className="text-[11px] text-slate-400">Auto Tare Enabled</span>
              </div>
              <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-400 font-mono text-[10px] font-bold border border-slate-700">
                STANDBY
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
