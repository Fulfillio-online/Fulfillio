'use client';

import React from 'react';
import Link from 'next/link';
import {
  TrendingUp,
  ClipboardList,
  Truck,
  BadgeDollarSign,
  PackageCheck,
  Users,
  ArrowUpRight,
  ChevronRight,
  ExternalLink,
  ShieldCheck,
  CheckCircle2,
} from 'lucide-react';

export default function AdminDashboardPage() {
  return (
    <div className="space-y-6">
      {/* Page Title & Intro */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-white">Executive 3PL Dashboard</h1>
        <p className="text-sm text-slate-400">
          Real-time warehouse metrics, active merchant integrations, and pending dispatches.
        </p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 shadow-lg">
          <div className="flex justify-between items-start">
            <span className="text-xs uppercase font-semibold text-slate-400">Today&apos;s Orders</span>
            <TrendingUp className="h-4 w-4 text-emerald-400" />
          </div>
          <div className="text-3xl font-bold mt-2 font-mono text-white">1,248</div>
          <span className="text-xs text-emerald-400 mt-1 inline-block font-semibold">
            +14.2% from yesterday
          </span>
        </div>

        <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 shadow-lg">
          <div className="flex justify-between items-start">
            <span className="text-xs uppercase font-semibold text-slate-400">Ready for Pick</span>
            <ClipboardList className="h-4 w-4 text-indigo-400" />
          </div>
          <div className="text-3xl font-bold mt-2 font-mono text-white">384</div>
          <span className="text-xs text-indigo-400 mt-1 inline-block">Across 4 zones</span>
        </div>

        <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 shadow-lg">
          <div className="flex justify-between items-start">
            <span className="text-xs uppercase font-semibold text-slate-400">Dispatched Today</span>
            <Truck className="h-4 w-4 text-amber-400" />
          </div>
          <div className="text-3xl font-bold mt-2 font-mono text-white">860</div>
          <span className="text-xs text-slate-400 mt-1 inline-block">3 courier collection waves</span>
        </div>

        <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 shadow-lg">
          <div className="flex justify-between items-start">
            <span className="text-xs uppercase font-semibold text-slate-400">Pending COD Remittance</span>
            <BadgeDollarSign className="h-4 w-4 text-emerald-400" />
          </div>
          <div className="text-3xl font-bold mt-2 font-mono text-white">৳ 4.82M</div>
          <span className="text-xs text-slate-400 mt-1 inline-block">Settlement scheduled Friday</span>
        </div>
      </div>

      {/* Operational Flow & Operator Quick Access */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Operational Flow */}
        <div className="lg:col-span-2 p-6 rounded-2xl bg-slate-900 border border-slate-800 shadow-lg space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="font-bold text-base text-white">Warehouse Operational Flow</h2>
            <span className="text-xs text-emerald-400 font-mono bg-emerald-500/10 border border-emerald-500/25 px-2.5 py-1 rounded-lg">
              Live Sync
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-center">
            <div className="p-4 rounded-xl bg-slate-950 border border-slate-800">
              <span className="text-xs text-slate-400 font-medium">1. Wave Picking</span>
              <div className="text-xl font-bold text-slate-100 mt-1 font-mono">42 Waves</div>
              <span className="text-[11px] text-emerald-400 font-semibold">12 Processing</span>
            </div>

            <div className="p-4 rounded-xl bg-slate-950 border border-slate-800">
              <span className="text-xs text-slate-400 font-medium">2. Packing Station</span>
              <div className="text-xl font-bold text-slate-100 mt-1 font-mono">6 Active Stations</div>
              <span className="text-[11px] text-indigo-400 font-semibold">Barcode Scan Live</span>
            </div>

            <div className="p-4 rounded-xl bg-slate-950 border border-slate-800">
              <span className="text-xs text-slate-400 font-medium">3. Courier Handover</span>
              <div className="text-xl font-bold text-slate-100 mt-1 font-mono">3 Manifests Ready</div>
              <span className="text-[11px] text-amber-400 font-semibold">Awaiting Drivers</span>
            </div>
          </div>

          <div className="pt-4 border-t border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs text-slate-400">
            <span className="flex items-center gap-1.5">
              <ShieldCheck className="h-4 w-4 text-emerald-400" />
              <span>Atomic inventory locks active: 0 oversold items recorded this month.</span>
            </span>
            <Link
              href="/admin/orders"
              className="text-emerald-400 hover:text-emerald-300 font-semibold flex items-center gap-1 self-start sm:self-auto"
            >
              <span>View All Orders</span>
              <ArrowUpRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        </div>

        {/* Operator Quick Access */}
        <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 shadow-lg flex flex-col justify-between space-y-4">
          <div>
            <h2 className="font-bold text-base mb-3 text-white">Operator Quick Access</h2>
            <div className="space-y-2">
              <Link
                href="/wms/packing"
                target="_blank"
                className="w-full p-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 font-bold text-sm text-white flex items-center justify-between transition-colors shadow-lg shadow-emerald-600/20"
              >
                <div className="flex items-center gap-2">
                  <PackageCheck className="h-4 w-4" />
                  <span>Open Packing Station #1</span>
                </div>
                <ExternalLink className="h-3.5 w-3.5" />
              </Link>

              <Link
                href="/admin/merchants"
                className="w-full p-3 rounded-xl bg-slate-800 hover:bg-slate-700 font-semibold text-sm text-slate-200 flex items-center justify-between transition-colors border border-slate-700"
              >
                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4 text-indigo-400" />
                  <span>Approve Pending Merchants (1)</span>
                </div>
                <ChevronRight className="h-3.5 w-3.5" />
              </Link>

              <Link
                href="/admin/couriers"
                className="w-full p-3 rounded-xl bg-slate-800 hover:bg-slate-700 font-semibold text-sm text-slate-200 flex items-center justify-between transition-colors border border-slate-700"
              >
                <div className="flex items-center gap-2">
                  <Truck className="h-4 w-4 text-amber-400" />
                  <span>Courier Sync Status</span>
                </div>
                <ChevronRight className="h-3.5 w-3.5" />
              </Link>
            </div>
          </div>

          <div className="pt-3 border-t border-slate-800 flex items-center justify-between text-[11px] text-slate-500 font-mono">
            <span>Fulfillio WMS v0.1.0</span>
            <span className="flex items-center gap-1 text-emerald-400">
              <CheckCircle2 className="h-3 w-3" />
              Node Healthy
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
