'use client';

import React, { useState } from 'react';
import { Sparkles, Layers, CheckCircle2, Clock, Check, XCircle } from 'lucide-react';
import { WarehouseBin, WarehouseProductItem } from '../../types';

interface ProductsApprovalTabProps {
  products: WarehouseProductItem[];
  bins: WarehouseBin[];
  onOpenApprovalModal: (
    mode: 'APPROVE' | 'REJECT',
    product: WarehouseProductItem,
    selectedBin: string
  ) => void;
  onSwitchToAllTab: () => void;
}

export function ProductsApprovalTab({
  products,
  bins,
  onOpenApprovalModal,
  onSwitchToAllTab,
}: ProductsApprovalTabProps) {
  const pendingProducts = products.filter((p) => p.status === 'PENDING_APPROVAL');

  const [pendingBinSelection, setPendingBinSelection] = useState<Record<string, string>>({
    'PRD-2001': 'A-02-01',
    'PRD-2002': 'B-01-03',
    'PRD-2003': 'C-01-02',
    'PRD-2004': 'D-01-01',
  });

  return (
    <div className="space-y-4">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 shadow-md">
        <div>
          <h3 className="text-base font-bold text-white flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-amber-400" />
            <span>Inbound Merchant Product Submissions Awaiting Bin Assignment</span>
          </h3>
          <p className="text-xs sm:text-sm text-slate-400 mt-0.5">
            Verify merchant 2-part SKU details, inspect received stock quantity, assign a physical warehouse bin, and approve.
          </p>
        </div>
        <div className="text-xs text-slate-400 flex items-center gap-1.5 self-start sm:self-auto bg-slate-950 px-3 py-1.5 rounded-xl border border-slate-800">
          <Layers className="w-3.5 h-3.5 text-emerald-400" />
          <span>Bins can be configured from <strong>Warehouse Bins</strong> tab</span>
        </div>
      </div>

      {pendingProducts.length === 0 ? (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-12 text-center space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 flex items-center justify-center mx-auto">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <h4 className="text-base font-bold text-white">
            All Merchant Product Submissions Approved!
          </h4>
          <p className="text-xs sm:text-sm text-slate-400 max-w-md mx-auto">
            Every pending product has been assigned a warehouse storage bin and moved into the active catalog.
          </p>
          <button
            type="button"
            onClick={onSwitchToAllTab}
            className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold cursor-pointer"
          >
            View All Approved Products
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {pendingProducts.map((item) => {
            const chosenBin =
              pendingBinSelection[item.id] || item.binCode || bins[0]?.code || 'A-01-02';
            return (
              <div
                key={item.id}
                className="bg-slate-900 border border-slate-800 hover:border-slate-700 rounded-2xl p-5 transition-all shadow-lg flex flex-col lg:flex-row lg:items-center lg:justify-between gap-5"
              >
                {/* Left: Thumbnail + Product + Merchant + 2-Part SKU */}
                <div className="flex items-start sm:items-center gap-4">
                  <img
                    src={item.imageUrl}
                    alt={item.title}
                    className="w-16 h-16 rounded-2xl object-cover border border-slate-700 bg-slate-950 shrink-0 shadow-md"
                  />
                  <div className="space-y-1.5">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wider bg-amber-500/15 text-amber-300 border border-amber-500/30">
                        PENDING_APPROVAL
                      </span>
                      <span className="text-xs text-slate-400 flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5 text-slate-500" />
                        Submitted {item.submittedAt}
                      </span>
                    </div>

                    <h4 className="text-base font-bold text-white">{item.title}</h4>

                    <div className="flex flex-wrap items-center gap-2 text-xs">
                      <span className="px-2.5 py-1 rounded-lg bg-slate-950 border border-slate-800 text-slate-200 font-medium">
                        Merchant:{' '}
                        <strong className="text-emerald-400 font-mono">{item.merchantCode}</strong> ·{' '}
                        {item.merchantName}
                      </span>
                      <span className="px-2.5 py-1 rounded-lg bg-emerald-500/10 border border-emerald-500/25 font-mono font-bold text-emerald-300">
                        SKU: {item.fullSku}
                      </span>
                      <span className="px-2.5 py-1 rounded-lg bg-slate-950 border border-slate-800 text-slate-300">
                        Variant: {item.color} / {item.size}
                      </span>
                      <span className="px-2.5 py-1 rounded-lg bg-slate-950 border border-slate-800 text-slate-200 font-mono">
                        Initial Qty: <strong>{item.stock} pcs</strong>
                      </span>
                      <span className="px-2.5 py-1 rounded-lg bg-slate-950 border border-slate-800 text-emerald-300 font-mono font-bold">
                        ৳{item.price.toLocaleString()}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Right: Select Bin to Store + Approve & Assign Bin + Reject */}
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 pt-3 lg:pt-0 border-t lg:border-t-0 border-slate-800">
                  <div className="flex items-center gap-2">
                    <div>
                      <label className="block text-[11px] font-semibold uppercase tracking-wider text-slate-400 mb-1">
                        Assign Target Bin
                      </label>
                      <select
                        value={chosenBin}
                        onChange={(e) =>
                          setPendingBinSelection((prev) => ({
                            ...prev,
                            [item.id]: e.target.value,
                          }))
                        }
                        aria-label={`Select Bin to Store ${item.title}`}
                        className="bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs font-mono font-bold text-emerald-300 focus:outline-none focus:border-emerald-500"
                      >
                        {bins.map((b) => (
                          <option key={b.code} value={b.code}>
                            {b.code} — {b.zone}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 sm:self-end">
                    <button
                      type="button"
                      onClick={() => onOpenApprovalModal('APPROVE', item, chosenBin)}
                      className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center gap-1.5 shadow-lg shadow-emerald-600/20 transition-all cursor-pointer"
                    >
                      <Check className="w-4 h-4" />
                      <span>Approve &amp; Assign Bin</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => onOpenApprovalModal('REJECT', item, chosenBin)}
                      className="px-3.5 py-2.5 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 text-rose-300 text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer"
                    >
                      <XCircle className="w-4 h-4" />
                      <span>Reject</span>
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
