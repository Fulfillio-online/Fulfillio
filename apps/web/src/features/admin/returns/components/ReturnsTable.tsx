'use client';

import React from 'react';
import {
  Clock,
  Truck,
  RotateCcw,
  CheckCircle2,
  ShieldAlert,
  MapPin,
  Sparkles,
} from 'lucide-react';
import { ReturnStatus, WarehouseReturnRecord } from '../types';

interface ReturnsTableProps {
  returns: WarehouseReturnRecord[];
  availableBins: string[];
  rowBinSelections: Record<string, string>;
  onBinSelectionChange: (returnId: string, bin: string) => void;
  onOpenQcModal: (item: WarehouseReturnRecord, mode: 'RESTOCK' | 'DAMAGED') => void;
  getLiveStock: (sku: string, fallback: number) => number;
}

export function ReturnsTable({
  returns,
  availableBins,
  rowBinSelections,
  onBinSelectionChange,
  onOpenQcModal,
  getLiveStock,
}: ReturnsTableProps) {
  return (
    <div className="bg-white dark:bg-navy-900 border border-slate-200 dark:border-white/10 rounded-2xl overflow-hidden shadow-xl">
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse min-w-[1040px]">
          <thead>
            <tr className="border-b border-slate-200 dark:border-white/10 text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-300 bg-slate-50/60 dark:bg-navy-950/60">
              <th className="py-3.5 px-4">RTO ID &amp; Received</th>
              <th className="py-3.5 px-4">Product &amp; SKU</th>
              <th className="py-3.5 px-4">Merchant</th>
              <th className="py-3.5 px-4">Courier &amp; Tracking</th>
              <th className="py-3.5 px-4">Target Restock Bin</th>
              <th className="py-3.5 px-4 text-center">Live Stock</th>
              <th className="py-3.5 px-4">Return Reason / QC Notes</th>
              <th className="py-3.5 px-4 text-center">Status</th>
              <th className="py-3.5 px-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200/80 dark:divide-white/10 text-sm">
            {returns.map((item) => {
              const liveStock = getLiveStock(item.fullSku, item.currentStockSnapshot);
              const selectedBin = rowBinSelections[item.id] || item.targetBin;

              return (
                <tr key={item.id} className="hover:bg-slate-100/40 dark:hover:bg-navy-800/40 transition-colors">
                  {/* RTO ID & Received */}
                  <td className="py-3.5 px-4">
                    <span className="tabular-nums font-bold text-navy-800 dark:text-white block">{item.id}</span>
                    <span className="text-xs text-slate-600 dark:text-slate-300 flex items-center gap-1 mt-0.5">
                      <Clock className="w-3 h-3 text-slate-500 dark:text-slate-400" />
                      <span>{item.receivedAt}</span>
                    </span>
                  </td>

                  {/* Product & SKU */}
                  <td className="py-3.5 px-4">
                    <div className="font-semibold text-navy-800 dark:text-white">{item.productTitle}</div>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="tabular-nums text-xs text-emerald-700 dark:text-emerald-300 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded">
                        {item.fullSku}
                      </span>
                      <span className="text-xs tabular-nums font-bold text-slate-700 dark:text-slate-200">
                        Qty: {item.qty}
                      </span>
                    </div>
                  </td>

                  {/* Merchant */}
                  <td className="py-3.5 px-4">
                    <span className="tabular-nums text-xs font-bold text-orange-600 dark:text-orange-400 block">
                      {item.merchantCode}
                    </span>
                    <span className="text-xs text-slate-700 dark:text-slate-200">{item.merchantName}</span>
                  </td>

                  {/* Courier & Tracking */}
                  <td className="py-3.5 px-4">
                    <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md bg-slate-50 dark:bg-navy-950 border border-slate-200 dark:border-white/10 text-xs font-semibold text-navy-800 dark:text-slate-100">
                      <Truck className="w-3 h-3 text-orange-600 dark:text-orange-400" />
                      <span>{item.courier}</span>
                    </div>
                    <div className="tabular-nums text-xs text-slate-600 dark:text-slate-300 mt-1 block">
                      {item.trackingCode}
                    </div>
                  </td>

                  {/* Target Restock Bin */}
                  <td className="py-3.5 px-4">
                    {item.status === 'PENDING_INSPECTION' ? (
                      <select
                        value={selectedBin}
                        onChange={(e) => onBinSelectionChange(item.id, e.target.value)}
                        className="px-2.5 py-1.5 rounded-lg bg-slate-50 dark:bg-navy-950 border border-slate-200 dark:border-white/10 text-xs tabular-nums text-orange-700 dark:text-orange-300 focus:outline-none focus:border-orange-500"
                      >
                        {availableBins.map((bin) => (
                          <option key={bin} value={bin}>
                            Bin {bin}
                          </option>
                        ))}
                      </select>
                    ) : (
                      <span className="px-2.5 py-1 rounded-lg bg-slate-50 dark:bg-navy-950 border border-slate-200 dark:border-white/10 text-xs tabular-nums text-slate-700 dark:text-slate-200 inline-flex items-center gap-1">
                        <MapPin className="w-3 h-3 text-orange-600 dark:text-orange-400" />
                        <span>Bin {item.targetBin}</span>
                      </span>
                    )}
                  </td>

                  {/* Live Stock */}
                  <td className="py-3.5 px-4 text-center tabular-nums font-bold text-navy-800 dark:text-white">
                    {liveStock} pcs
                  </td>

                  {/* Return Reason / Inspector Notes */}
                  <td className="py-3.5 px-4 max-w-xs">
                    <p className="text-xs text-slate-700 dark:text-slate-200 line-clamp-2">{item.returnReason}</p>
                    {item.inspectorNote && (
                      <p className="text-xs text-orange-600 dark:text-orange-400 mt-1 italic line-clamp-2">
                        QC: {item.inspectorNote}
                      </p>
                    )}
                  </td>

                  {/* Status Badge */}
                  <td className="py-3.5 px-4 text-center">
                    {item.status === 'PENDING_INSPECTION' && (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-amber-500/15 text-amber-700 dark:text-amber-300 border border-amber-500/30">
                        <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
                        PENDING QC
                      </span>
                    )}
                    {item.status === 'RESTOCKED' && (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30">
                        <CheckCircle2 className="w-3.5 h-3.5 text-orange-600 dark:text-orange-400" />
                        RESTOCKED
                      </span>
                    )}
                    {item.status === 'DAMAGED' && (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-rose-500/15 text-rose-700 dark:text-rose-300 border border-rose-500/30">
                        <ShieldAlert className="w-3.5 h-3.5 text-rose-600 dark:text-rose-400" />
                        DAMAGED
                      </span>
                    )}
                  </td>

                  {/* Action Buttons */}
                  <td className="py-3.5 px-4 text-right">
                    {item.status === 'PENDING_INSPECTION' ? (
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          type="button"
                          onClick={() => onOpenQcModal(item, 'RESTOCK')}
                          className="px-2.5 py-1.5 rounded-lg bg-orange-600 hover:bg-orange-700 text-xs font-bold text-white shadow-sm flex items-center gap-1 transition-colors cursor-pointer"
                        >
                          <Sparkles className="w-3 h-3" />
                          <span>QC Pass (+{item.qty})</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => onOpenQcModal(item, 'DAMAGED')}
                          className="px-2 py-1.5 rounded-lg bg-rose-500/15 hover:bg-rose-500/25 border border-rose-500/30 text-rose-700 dark:text-rose-300 text-xs font-semibold transition-colors cursor-pointer"
                        >
                          Damaged
                        </button>
                      </div>
                    ) : (
                      <span className="text-xs text-slate-500 dark:text-slate-400 italic">
                        {item.processedAt || 'Processed'}
                      </span>
                    )}
                  </td>
                </tr>
              );
            })}

            {returns.length === 0 && (
              <tr>
                <td colSpan={9} className="py-12 text-center text-slate-600 dark:text-slate-300">
                  No return parcels match your search or filter.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
