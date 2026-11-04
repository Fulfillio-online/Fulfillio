import React from 'react';
import Link from 'next/link';
import { PackageCheck, Printer, Truck, Boxes, LogOut } from 'lucide-react';
import { WorkerTab, WorkerProfile } from '../types';

interface WorkerHeaderProps {
  worker: WorkerProfile;
  activeTab: WorkerTab;
  setActiveTab: (tab: WorkerTab) => void;
  pickCount: number;
  packCount: number;
  courierCount: number;
}

export function WorkerHeader({
  worker,
  activeTab,
  setActiveTab,
  pickCount,
  packCount,
  courierCount,
}: WorkerHeaderProps) {
  return (
    <header className="p-4 bg-slate-900 border-b border-slate-800 sticky top-0 z-30">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="h-9 w-9 rounded-xl bg-emerald-600 flex items-center justify-center font-black text-white text-base shadow-sm">
            F
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-extrabold text-sm tracking-tight text-white">
                Fulfillio WMS
              </span>
              <span className="text-[10px] uppercase font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 px-1.5 py-0.2 rounded">
                Worker App
              </span>
            </div>
            <span className="text-xs text-slate-400 block">
              {worker.name} • <span className="font-mono text-emerald-400 font-bold">{worker.id}</span>
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Link
            href="/"
            className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-slate-200 transition-colors"
            title="Exit App"
          >
            <LogOut className="h-4 w-4" />
          </Link>
        </div>
      </div>

      {/* Shift Banner */}
      <div className="mt-3 p-2 rounded-lg bg-slate-950 border border-slate-800 flex items-center justify-between text-[11px] text-slate-400">
        <div className="flex items-center gap-1.5">
          <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
          <span>Station: {worker.station}</span>
        </div>
        <span className="font-semibold text-slate-300">{worker.shift}</span>
      </div>

      {/* 4 Main Action Tabs */}
      <nav className="grid grid-cols-4 gap-1.5 mt-3 pt-2 border-t border-slate-800">
        <button
          onClick={() => setActiveTab('pick')}
          className={`py-2 px-1 rounded-lg text-xs font-bold transition-colors flex flex-col items-center gap-1 relative ${
            activeTab === 'pick'
              ? 'bg-emerald-600 text-white shadow-sm'
              : 'bg-slate-950 text-slate-400 hover:text-slate-200 border border-slate-800'
          }`}
        >
          <div className="flex items-center gap-1">
            <PackageCheck className="h-4 w-4" />
            <span>1. Pick</span>
          </div>
          {pickCount > 0 && (
            <span className="text-[10px] font-mono px-1.5 py-0.2 rounded-full bg-slate-900/80 text-emerald-300 font-bold">
              {pickCount}
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveTab('pack')}
          className={`py-2 px-1 rounded-lg text-xs font-bold transition-colors flex flex-col items-center gap-1 relative ${
            activeTab === 'pack'
              ? 'bg-emerald-600 text-white shadow-sm'
              : 'bg-slate-950 text-slate-400 hover:text-slate-200 border border-slate-800'
          }`}
        >
          <div className="flex items-center gap-1">
            <Printer className="h-4 w-4" />
            <span>2. Pack</span>
          </div>
          {packCount > 0 && (
            <span className="text-[10px] font-mono px-1.5 py-0.2 rounded-full bg-slate-900/80 text-emerald-300 font-bold">
              {packCount}
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveTab('courier')}
          className={`py-2 px-1 rounded-lg text-xs font-bold transition-colors flex flex-col items-center gap-1 relative ${
            activeTab === 'courier'
              ? 'bg-emerald-600 text-white shadow-sm'
              : 'bg-slate-950 text-slate-400 hover:text-slate-200 border border-slate-800'
          }`}
        >
          <div className="flex items-center gap-1">
            <Truck className="h-4 w-4" />
            <span>3. Dispatch</span>
          </div>
          {courierCount > 0 && (
            <span className="text-[10px] font-mono px-1.5 py-0.2 rounded-full bg-slate-900/80 text-emerald-300 font-bold">
              {courierCount}
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveTab('dock')}
          className={`py-2 px-1 rounded-lg text-xs font-bold transition-colors flex flex-col items-center gap-1 relative ${
            activeTab === 'dock'
              ? 'bg-indigo-600 text-white shadow-sm'
              : 'bg-slate-950 text-slate-400 hover:text-slate-200 border border-slate-800'
          }`}
        >
          <div className="flex items-center gap-1">
            <Boxes className="h-4 w-4" />
            <span>4. ASN/RTO</span>
          </div>
          <span className="text-[10px] font-mono px-1.5 py-0.2 rounded-full bg-slate-900/80 text-indigo-300 font-bold">
            New
          </span>
        </button>
      </nav>
    </header>
  );
}
