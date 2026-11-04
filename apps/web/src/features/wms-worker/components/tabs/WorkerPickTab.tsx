import React from 'react';
import { PackageCheck, CheckCircle2, Check } from 'lucide-react';
import { WorkerOrder } from '../../types';

interface WorkerPickTabProps {
  pickList: WorkerOrder[];
  onMarkPicked: (orderId: string) => void;
  onGoToPack: () => void;
}

export function WorkerPickTab({
  pickList,
  onMarkPicked,
  onGoToPack,
}: WorkerPickTabProps) {
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-base font-bold text-white flex items-center gap-1.5">
            <PackageCheck className="h-4 w-4 text-emerald-400" />
            <span>Items to Pick from Shelf</span>
          </h2>
          <p className="text-[11px] text-slate-400">
            Walk to assigned shelf bins and pick designated SKUs.
          </p>
        </div>
        <span className="text-xs font-mono font-bold text-slate-300 bg-slate-900 px-2 py-1 rounded border border-slate-800">
          {pickList.length} Left
        </span>
      </div>

      {pickList.length === 0 ? (
        <div className="p-8 text-center rounded-2xl bg-slate-900/60 border border-slate-800 space-y-2">
          <CheckCircle2 className="h-10 w-10 text-emerald-400 mx-auto" />
          <h3 className="font-bold text-sm text-slate-200">All Items Picked!</h3>
          <p className="text-xs text-slate-400">
            Switch to the Pack &amp; Print tab to process thermal invoices.
          </p>
          <button
            onClick={onGoToPack}
            className="mt-2 px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs"
          >
            Go to Pack &amp; Print →
          </button>
        </div>
      ) : (
        pickList.map((item) => (
          <div
            key={item.id}
            className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-3 shadow-sm hover:border-slate-700 transition-colors"
          >
            {/* Bin Location Highlight Header */}
            <div className="flex items-center justify-between border-b border-slate-800/80 pb-2">
              <div className="flex items-center gap-1.5">
                <span className="text-[11px] text-slate-400">BIN LOCATION:</span>
                <span className="font-mono text-sm font-black text-amber-300 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/30">
                  {item.bin}
                </span>
              </div>
              <span className="font-mono text-xs text-indigo-300 font-bold">
                {item.id}
              </span>
            </div>

            {/* Product Details (Large fonts for worker readability) */}
            <div>
              <h3 className="font-extrabold text-base text-white tracking-tight leading-snug">
                {item.itemTitle}
              </h3>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-xs font-semibold px-2 py-0.5 rounded bg-slate-800 text-slate-200 border border-slate-700">
                  {item.variant}
                </span>
                <span className="text-xs font-bold text-emerald-400">
                  Quantity: {item.qty} pcs
                </span>
              </div>

              <div className="mt-2 text-xs font-mono text-slate-400 bg-slate-950 p-2 rounded border border-slate-800/80 truncate">
                SKU: <span className="text-slate-200 font-bold">{item.sku}</span>
              </div>
            </div>

            {/* Pick Action Button */}
            <div className="pt-1 flex items-center justify-between">
              <div className="text-[11px] text-slate-400">
                Attribution: <span className="font-mono text-indigo-400">{item.memoCode}</span>
              </div>

              <button
                onClick={() => onMarkPicked(item.id)}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 shadow-md active:scale-95 transition-all"
              >
                <Check className="h-4 w-4" />
                <span>Mark Picked</span>
              </button>
            </div>
          </div>
        ))
      )}
    </div>
  );
}
