'use client';

import React from 'react';
import Link from 'next/link';
import { Truck, FileText, ChevronRight, CheckCircle2, Boxes } from 'lucide-react';

export function FulfillmentHubCard() {
  return (
    <div className="p-5 sm:p-6 rounded-2xl bg-slate-900 border border-slate-800 shadow-md space-y-5">
      <div className="border-b border-slate-800 pb-4">
        <h3 className="font-bold text-base text-slate-100 flex items-center gap-2">
          <Truck className="h-4 w-4 text-emerald-400 shrink-0" />
          <span>Fulfillment &amp; Couriers</span>
        </h3>
        <p className="text-xs text-slate-400 mt-0.5">
          Live logistics pipelines connected to warehouse stations.
        </p>
      </div>

      {/* Courier Pipeline Status */}
      <div className="space-y-2">
        <span className="text-[10px] uppercase tracking-wider font-semibold text-slate-500 block">
          Dispatch Carriers Ready
        </span>
        <div className="grid grid-cols-3 gap-2 text-center text-xs">
          <div className="p-2.5 rounded-xl bg-slate-950/70 border border-slate-800">
            <span className="font-bold text-white block text-xs">Steadfast</span>
            <span className="text-[10px] text-emerald-400 flex items-center justify-center gap-1 mt-0.5 font-medium">
              <CheckCircle2 className="h-2.5 w-2.5" />
              Active
            </span>
          </div>

          <div className="p-2.5 rounded-xl bg-slate-950/70 border border-slate-800">
            <span className="font-bold text-white block text-xs">Pathao</span>
            <span className="text-[10px] text-emerald-400 flex items-center justify-center gap-1 mt-0.5 font-medium">
              <CheckCircle2 className="h-2.5 w-2.5" />
              Active
            </span>
          </div>

          <div className="p-2.5 rounded-xl bg-slate-950/70 border border-slate-800">
            <span className="font-bold text-white block text-xs">RedX</span>
            <span className="text-[10px] text-emerald-400 flex items-center justify-center gap-1 mt-0.5 font-medium">
              <CheckCircle2 className="h-2.5 w-2.5" />
              Active
            </span>
          </div>
        </div>
      </div>

      {/* Memo Slip Branding Box */}
      <div className="p-3.5 rounded-xl bg-slate-950/70 border border-slate-800 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="h-8 w-8 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 shrink-0">
            <FileText className="h-4 w-4" />
          </div>
          <div className="min-w-0">
            <span className="text-xs font-bold text-slate-200 block truncate">
              Order Memo Slip Template
            </span>
            <span className="text-[11px] text-slate-400 font-mono block">
              MEMO-DEFAULT (A4/POS)
            </span>
          </div>
        </div>

        <Link
          href="/merchant/memos"
          className="text-xs text-emerald-400 hover:text-emerald-300 font-semibold inline-flex items-center gap-1 shrink-0 transition-colors"
        >
          <span>Designer</span>
          <ChevronRight className="h-3.5 w-3.5" />
        </Link>
      </div>
    </div>
  );
}
