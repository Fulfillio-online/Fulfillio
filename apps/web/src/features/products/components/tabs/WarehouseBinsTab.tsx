'use client';

import React from 'react';
import { MapPin, Plus } from 'lucide-react';
import { WarehouseBin, WarehouseProductItem } from '../../types';

interface WarehouseBinsTabProps {
  bins: WarehouseBin[];
  products: WarehouseProductItem[];
  onOpenCreateBinModal: () => void;
}

export function WarehouseBinsTab({
  bins,
  products,
  onOpenCreateBinModal,
}: WarehouseBinsTabProps) {
  const approvedProducts = products.filter((p) => p.status === 'APPROVED');

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 shadow-md">
        <div>
          <h3 className="text-base font-bold text-white flex items-center gap-2">
            <MapPin className="w-4 h-4 text-emerald-400" />
            <span>Physical Warehouse Bins &amp; Shelf Slotting Registry</span>
          </h3>
          <p className="text-xs sm:text-sm text-slate-400 mt-0.5">
            Zone, rack, and shelf locations for rapid pick waves and capacity tracking.
          </p>
        </div>
        <button
          type="button"
          onClick={onOpenCreateBinModal}
          className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center gap-2 shadow-lg shadow-emerald-600/25 transition-all self-start sm:self-auto cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>+ Create New Bin</span>
        </button>
      </div>

      {/* Bins Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {bins.map((bin) => {
          const storedProducts = approvedProducts.filter((p) => p.binCode === bin.code);
          const totalUnits = storedProducts.reduce((sum, p) => sum + p.stock, 0);
          const utilizationPct = Math.min(
            100,
            Math.round((totalUnits / (bin.capacityUnits || 250)) * 100)
          );

          return (
            <div
              key={bin.code}
              className="bg-slate-900 border border-slate-800 hover:border-slate-700 rounded-2xl p-5 flex flex-col justify-between gap-4 shadow-lg transition-all"
            >
              <div className="space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <div className="inline-flex items-center gap-2">
                      <span className="px-3 py-1 rounded-xl bg-emerald-500/15 border border-emerald-500/30 font-mono text-sm font-bold text-emerald-300">
                        📍 {bin.code}
                      </span>
                      <span className="text-xs font-semibold text-slate-400">{bin.zone}</span>
                    </div>
                    <p className="text-xs text-slate-300 mt-2">{bin.description}</p>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-mono font-bold text-white">
                      {totalUnits} <span className="text-xs text-slate-400">units</span>
                    </div>
                    <div className="text-[11px] text-slate-400">
                      {storedProducts.length} SKU{storedProducts.length === 1 ? '' : 's'} stored
                    </div>
                  </div>
                </div>

                {/* Capacity bar */}
                <div>
                  <div className="flex justify-between text-[11px] text-slate-400 mb-1">
                    <span>Bin Utilization</span>
                    <span className="font-mono">
                      {totalUnits} / {bin.capacityUnits} pcs ({utilizationPct}%)
                    </span>
                  </div>
                  <div className="w-full h-2 rounded-full bg-slate-950 overflow-hidden border border-slate-800">
                    <div
                      className={`h-full rounded-full transition-all ${
                        utilizationPct > 85 ? 'bg-amber-500' : 'bg-emerald-500'
                      }`}
                      style={{ width: `${utilizationPct}%` }}
                    />
                  </div>
                </div>

                {/* Stored Products Inside Bin */}
                <div className="pt-2 border-t border-slate-800/80 space-y-2">
                  <div className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                    Products Inside Bin ({storedProducts.length})
                  </div>
                  {storedProducts.length === 0 ? (
                    <div className="text-xs text-slate-500 italic py-2">
                      Empty bin — ready for product assignment
                    </div>
                  ) : (
                    <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                      {storedProducts.map((prod) => (
                        <div
                          key={prod.id}
                          className="flex items-center justify-between gap-2 p-2 rounded-xl bg-slate-950/80 border border-slate-800/90"
                        >
                          <div className="flex items-center gap-2.5 min-w-0">
                            <img
                              src={prod.imageUrl}
                              alt={prod.title}
                              className="w-8 h-8 rounded-lg object-cover border border-slate-800 shrink-0"
                            />
                            <div className="min-w-0">
                              <div className="text-xs font-semibold text-white truncate">
                                {prod.title}
                              </div>
                              <div className="text-[11px] font-mono text-emerald-400 truncate">
                                {prod.fullSku}
                              </div>
                            </div>
                          </div>
                          <span className="px-2 py-0.5 rounded-md bg-slate-900 border border-slate-800 font-mono text-xs font-semibold text-slate-200 shrink-0">
                            {prod.stock} pcs
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
