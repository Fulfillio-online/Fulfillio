import React from 'react';
import Link from 'next/link';
import { ArrowLeft, PackageCheck, RotateCcw, Printer } from 'lucide-react';

interface PackingHeaderProps {
  selectedCount: number;
  onResetDemoOrders: () => void;
  onBatchPrintSelected: () => void;
}

export function PackingHeader({
  selectedCount,
  onResetDemoOrders,
  onBatchPrintSelected,
}: PackingHeaderProps) {
  return (
    <header className="border-b border-slate-800 bg-slate-900/90 backdrop-blur sticky top-0 z-20 px-4 sm:px-6 lg:px-8 py-4">
      <div className="max-w-[1600px] mx-auto flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-4">
          <Link
            href="/admin"
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-xs font-semibold text-slate-200 transition-colors shrink-0"
          >
            <ArrowLeft className="w-4 h-4 text-emerald-400" />
            ← Back to Admin Panel
          </Link>

          <div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wider bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                <PackageCheck className="w-3.5 h-3.5 shrink-0" />
                Module 07 · Multi-Select Thermal Station
              </span>
              <span className="text-xs font-mono text-slate-400 hidden sm:inline">
                4x6&quot; Reseller Memo Standard (Zero Scanner / Zero Weight Gate)
              </span>
            </div>
            <h1 className="text-lg sm:text-2xl font-bold tracking-tight text-white mt-1">
              Packing &amp; Multi-Select 4x6&quot; Thermal Print Station
            </h1>
          </div>
        </div>

        {/* Primary Batch Action Buttons */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 sm:gap-3 w-full lg:w-auto">
          <button
            type="button"
            onClick={onResetDemoOrders}
            className="w-full sm:w-auto px-3 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-xs font-semibold text-slate-300 inline-flex items-center justify-center gap-1.5 transition-colors"
            title="Reset Demo Orders"
          >
            <RotateCcw className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            Reset Queue
          </button>

          <button
            type="button"
            onClick={onBatchPrintSelected}
            disabled={selectedCount === 0}
            className={`w-full sm:w-auto px-4 sm:px-5 py-3 rounded-xl font-bold text-xs sm:text-sm inline-flex items-center justify-center gap-2 transition-all shadow-lg ${
              selectedCount > 0
                ? 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-950/60 cursor-pointer'
                : 'bg-slate-800 text-slate-500 border border-slate-700 cursor-not-allowed shadow-none'
            }`}
          >
            <Printer className="w-4 h-4 shrink-0" />
            <span>Print Selected 4x6&quot; Invoices &amp; Mark Packed ({selectedCount})</span>
          </button>
        </div>
      </div>
    </header>
  );
}
