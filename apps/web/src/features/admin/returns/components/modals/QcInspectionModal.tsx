'use client';

import React from 'react';
import { X, CheckCircle2, ShieldAlert } from 'lucide-react';
import { WarehouseReturnRecord } from '../../types';

interface QcInspectionModalProps {
  modalState: {
    mode: 'RESTOCK' | 'DAMAGED';
    item: WarehouseReturnRecord;
    selectedBin: string;
    note: string;
  } | null;
  availableBins: string[];
  currentLiveStock: number;
  onClose: () => void;
  onConfirm: (mode: 'RESTOCK' | 'DAMAGED', bin: string, note: string) => void;
}

export function QcInspectionModal({
  modalState,
  availableBins,
  currentLiveStock,
  onClose,
  onConfirm,
}: QcInspectionModalProps) {
  const [bin, setBin] = React.useState(modalState?.selectedBin || '');
  const [note, setNote] = React.useState(modalState?.note || '');

  React.useEffect(() => {
    if (modalState) {
      setBin(modalState.selectedBin);
      setNote(modalState.note);
    }
  }, [modalState]);

  if (!modalState) return null;

  const { mode, item } = modalState;
  const nextStock = currentLiveStock + item.qty;

  const handleConfirm = () => {
    onConfirm(mode, bin, note);
  };

  return (
    <div className="fixed inset-0 z-50 bg-navy-950/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white dark:bg-navy-900 border border-slate-200 dark:border-white/10 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4 animate-in zoom-in-95 duration-200">
        <div className="flex items-start justify-between gap-3 border-b border-slate-200 dark:border-white/10 pb-3">
          <div className="flex items-center gap-3">
            <div
              className={`w-10 h-10 rounded-xl flex items-center justify-center border ${
                mode === 'RESTOCK'
                  ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-600 dark:text-emerald-400'
                  : 'bg-rose-500/15 border-rose-500/30 text-rose-600 dark:text-rose-400'
              }`}
            >
              {mode === 'RESTOCK' ? (
                <CheckCircle2 className="w-5 h-5" />
              ) : (
                <ShieldAlert className="w-5 h-5" />
              )}
            </div>
            <div>
              <h3 className="text-base font-bold text-navy-800 dark:text-white">
                {mode === 'RESTOCK' ? 'QC Pass & Shelf Restock' : 'Mark as Damaged Parcel'}
              </h3>
              <p className="text-xs text-slate-600 dark:text-slate-300">
                {item.id} · {item.orderId} ({item.courier})
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 text-slate-600 dark:text-slate-300 hover:text-navy-800 dark:hover:text-white"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-navy-950 border border-slate-200 dark:border-white/10 text-xs space-y-2">
          <div className="flex justify-between">
            <span className="text-slate-600 dark:text-slate-300">Product:</span>
            <span className="font-semibold text-navy-800 dark:text-white truncate max-w-[220px]">
              {item.productTitle}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-600 dark:text-slate-300">SKU Code:</span>
            <span className="tabular-nums text-orange-700 dark:text-orange-300 font-bold">{item.fullSku}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-600 dark:text-slate-300">Merchant:</span>
            <span className="text-navy-800 dark:text-slate-100">{item.merchantName}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-600 dark:text-slate-300">Return Reason:</span>
            <span className="text-slate-700 dark:text-slate-200 max-w-[200px] text-right truncate">
              {item.returnReason}
            </span>
          </div>
        </div>

        {mode === 'RESTOCK' ? (
          <div className="space-y-3 text-xs">
            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-200 mb-1">
                Target Restock Warehouse Bin *
              </label>
              <select
                value={bin}
                onChange={(e) => setBin(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-navy-950 border border-slate-200 dark:border-white/10 text-orange-700 dark:text-orange-300 tabular-nums font-bold"
              >
                {availableBins.map((b) => (
                  <option key={b} value={b}>
                    Bin {b}
                  </option>
                ))}
              </select>
            </div>

            <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-between tabular-nums">
              <span className="text-xs text-orange-700 dark:text-orange-300 font-sans">Warehouse Stock Delta:</span>
              <span className="text-sm font-bold text-orange-600 dark:text-orange-400">
                {currentLiveStock} → {nextStock} (+{item.qty} pcs)
              </span>
            </div>
          </div>
        ) : (
          <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-xs text-rose-700 dark:text-rose-300 leading-relaxed">
            This parcel will be marked as <strong>DAMAGED</strong> and quarantined. Sellable inventory will <strong>NOT</strong> be increased.
          </div>
        )}

        <div>
          <label className="block text-xs font-bold text-slate-700 dark:text-slate-200 mb-1">
            Inspector Notes / Justification
          </label>
          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            rows={2}
            className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-navy-950 border border-slate-200 dark:border-white/10 text-xs text-navy-800 dark:text-white placeholder-slate-500 dark:placeholder-slate-400 focus:outline-none focus:border-orange-500"
            placeholder="Add quality inspection note..."
          />
        </div>

        <div className="flex justify-end gap-2 pt-2 border-t border-slate-200 dark:border-white/10">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-navy-800 hover:bg-slate-200 dark:hover:bg-navy-700 text-xs font-semibold text-slate-700 dark:text-slate-200 cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            className={`px-4 py-2 rounded-xl text-xs font-bold text-white shadow-lg cursor-pointer ${
              mode === 'RESTOCK'
                ? 'bg-orange-600 hover:bg-orange-700 shadow-orange-500/25'
                : 'bg-rose-600 hover:bg-rose-500 shadow-rose-600/25'
            }`}
          >
            {mode === 'RESTOCK' ? 'Confirm Bin Restock' : 'Confirm Damage Quarantine'}
          </button>
        </div>
      </div>
    </div>
  );
}
