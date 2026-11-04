'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  PackageCheck,
  CheckCircle2,
  Check,
  Filter,
  Sparkles,
  ArrowRight,
  Layers,
} from 'lucide-react';
import { useWms, BarcodeScannerBar } from '@/features/wms';

export default function WmsPickPage() {
  const { orders, markPicked, markBatchPicked, playAudio, showToast } = useWms();
  const [zoneFilter, setZoneFilter] = useState('ALL');

  const pickList = orders.filter((o) => o.stage === 'READY_TO_PICK');

  const filteredList = pickList.filter((item) => {
    if (zoneFilter === 'ALL') return true;
    return item.bin.startsWith(zoneFilter);
  });

  const handleScan = (code: string) => {
    const target = pickList.find(
      (o) =>
        o.id.toUpperCase() === code.toUpperCase() ||
        o.sku.toUpperCase() === code.toUpperCase(),
    );

    if (target) {
      markPicked(target.id);
    } else {
      playAudio('error');
      showToast(`Scanned code "${code}" not found in current pick queue!`);
    }
  };

  const handlePickAllVisible = () => {
    if (filteredList.length === 0) return;
    markBatchPicked(filteredList.map((o) => o.id));
  };

  return (
    <div className="space-y-5">
      {/* Step Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 font-mono text-[10px] font-bold border border-emerald-500/30">
              PIPELINE STEP 1 OF 4
            </span>
            <span className="text-xs text-slate-400 font-mono">
              Queue: {pickList.length} items to pick
            </span>
          </div>
          <h1 className="text-xl font-black text-white tracking-tight mt-1 flex items-center gap-2">
            <PackageCheck className="h-5 w-5 text-emerald-400" />
            <span>Bin-Guided Order Picking</span>
          </h1>
          <p className="text-xs text-slate-400">
            Walk to assigned rack bins, verify SKU labels, and collect physical items.
          </p>
        </div>

        {pickList.length > 0 && (
          <button
            onClick={handlePickAllVisible}
            className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-emerald-600 text-slate-200 hover:text-white text-xs font-bold transition-all border border-slate-700 flex items-center gap-2 self-start sm:self-auto shadow-sm active:scale-95"
          >
            <CheckCircle2 className="h-4 w-4" />
            <span>Mark All Visible Picked ({filteredList.length})</span>
          </button>
        )}
      </div>

      {/* Barcode Scanner Bar */}
      <BarcodeScannerBar
        placeholder="Scan SKU barcode or Order ID (e.g. MC-101-HOODIE-BLK-XL or ORD-9824)..."
        onScan={handleScan}
      />

      {/* Zone Filters */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs">
        <span className="text-slate-400 flex items-center gap-1 shrink-0">
          <Filter className="h-3.5 w-3.5" />
          <span>Bin Filter:</span>
        </span>
        {['ALL', 'A', 'B', 'C'].map((zone) => (
          <button
            key={zone}
            onClick={() => setZoneFilter(zone)}
            className={`px-3 py-1 rounded-lg font-mono font-bold transition-colors ${
              zoneFilter === zone
                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                : 'bg-slate-900 text-slate-400 border border-slate-800 hover:border-slate-700'
            }`}
          >
            {zone === 'ALL' ? 'All Zones' : `Rack ${zone}`}
          </button>
        ))}
      </div>

      {/* Pick List Display */}
      {filteredList.length === 0 ? (
        <div className="p-12 text-center rounded-2xl bg-slate-900/60 border border-slate-800 space-y-3">
          <CheckCircle2 className="h-12 w-12 text-emerald-400 mx-auto" />
          <h2 className="font-extrabold text-base text-white">All Scheduled Items Picked!</h2>
          <p className="text-xs text-slate-400 max-w-md mx-auto">
            No items are currently waiting in this shelf zone. Picked items are now queued at the packing desk for 4x6 thermal slip printing.
          </p>
          <div className="pt-2">
            <Link
              href="/wms/pack"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-lg transition-all active:scale-95"
            >
              <span>Go to Step 2: Pack &amp; Print Memo</span>
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {filteredList.map((item) => (
            <div
              key={item.id}
              className="p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-3 hover:border-slate-700 transition-all shadow-md"
            >
              {/* Header: Shelf Bin Location & Order ID */}
              <div className="flex items-center justify-between border-b border-slate-800/80 pb-2.5">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] text-slate-400 uppercase font-semibold">
                    SHELF BIN:
                  </span>
                  <span className="font-mono text-sm font-black text-amber-300 bg-amber-500/10 px-2.5 py-0.5 rounded border border-amber-500/30">
                    {item.bin}
                  </span>
                </div>
                <span className="font-mono text-xs text-emerald-400 font-bold bg-slate-950 px-2 py-0.5 rounded border border-slate-800">
                  {item.id}
                </span>
              </div>

              {/* Product Info */}
              <div>
                <h3 className="font-extrabold text-base text-white leading-tight">
                  {item.itemTitle}
                </h3>
                <div className="flex flex-wrap items-center gap-2 mt-1.5">
                  <span className="text-xs font-semibold px-2 py-0.5 rounded bg-slate-800 text-slate-200 border border-slate-700">
                    {item.variant}
                  </span>
                  <span className="text-xs font-extrabold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                    Qty: {item.qty} pcs
                  </span>
                  <span className="text-[11px] text-slate-400">
                    Store: <span className="text-slate-300 font-semibold">{item.reseller}</span>
                  </span>
                </div>

                <div className="mt-2.5 text-xs font-mono text-slate-400 bg-slate-950 p-2 rounded-lg border border-slate-800/80 truncate">
                  SKU: <span className="text-slate-200 font-bold">{item.sku}</span>
                </div>
              </div>

              {/* Action Footer */}
              <div className="pt-2 flex items-center justify-between border-t border-slate-800/80">
                <div className="text-[11px] text-slate-400">
                  Memo: <span className="font-mono text-indigo-400 font-semibold">{item.memoCode}</span>
                </div>

                <button
                  onClick={() => markPicked(item.id)}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-md active:scale-95 transition-all"
                >
                  <Check className="h-4 w-4" />
                  <span>Mark Picked</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
