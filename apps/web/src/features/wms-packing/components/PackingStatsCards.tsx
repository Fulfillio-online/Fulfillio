import React from 'react';
import { Layers, Printer, CheckCircle2, Tag } from 'lucide-react';

interface PackingStatsCardsProps {
  readyCount: number;
  selectedCount: number;
  packedCount: number;
}

export function PackingStatsCards({
  readyCount,
  selectedCount,
  packedCount,
}: PackingStatsCardsProps) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex items-center justify-between gap-3">
        <div>
          <p className="text-xs uppercase tracking-wider text-slate-400 font-semibold">
            Ready to Pack (Picked)
          </p>
          <p className="text-2xl font-black font-mono text-emerald-400 mt-1">{readyCount}</p>
          <p className="text-[11px] text-slate-400 mt-0.5">
            Physically packed on table, awaiting 4x6&quot; label
          </p>
        </div>
        <div className="w-10 h-10 rounded-lg bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shrink-0">
          <Layers className="w-5 h-5" />
        </div>
      </div>

      <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex items-center justify-between gap-3">
        <div>
          <p className="text-xs uppercase tracking-wider text-slate-400 font-semibold">
            Selected for Batch Print
          </p>
          <p className="text-2xl font-black font-mono text-white mt-1">{selectedCount}</p>
          <p className="text-[11px] text-slate-400 mt-0.5">
            1-Click prints all selected reseller memos
          </p>
        </div>
        <div className="w-10 h-10 rounded-lg bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shrink-0">
          <Printer className="w-5 h-5" />
        </div>
      </div>

      <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex items-center justify-between gap-3">
        <div>
          <p className="text-xs uppercase tracking-wider text-slate-400 font-semibold">
            Packed (Done Today)
          </p>
          <p className="text-2xl font-black font-mono text-emerald-400 mt-1">{packedCount}</p>
          <p className="text-[11px] text-slate-400 mt-0.5">
            Ready for courier manifest handover
          </p>
        </div>
        <div className="w-10 h-10 rounded-lg bg-slate-800 border border-slate-700 flex items-center justify-center text-emerald-400 shrink-0">
          <CheckCircle2 className="w-5 h-5" />
        </div>
      </div>

      <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex items-center justify-between gap-3">
        <div>
          <p className="text-xs uppercase tracking-wider text-slate-400 font-semibold">
            Thermal Spec
          </p>
          <p className="text-lg font-black font-mono text-white mt-1">4&quot; × 6&quot; Sticker</p>
          <p className="text-[11px] text-emerald-400 mt-0.5">
            Reseller Branded Memo + Courier Barcode
          </p>
        </div>
        <div className="w-10 h-10 rounded-lg bg-slate-800 border border-slate-700 flex items-center justify-center text-emerald-400 shrink-0">
          <Tag className="w-5 h-5" />
        </div>
      </div>
    </div>
  );
}
