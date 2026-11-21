'use client';

import React, { useState, useEffect } from 'react';
import { CheckCircle2, ArrowRight, Minus, Plus, Truck, AlertTriangle } from 'lucide-react';
import { Modal } from '@/components/admin/AdminModal';
import { InboundStockReplenishment, WarehouseBin } from '../../types';

interface RestockIntakeModalProps {
  isOpen: boolean;
  onClose: () => void;
  replenishment: InboundStockReplenishment | null;
  bins: WarehouseBin[];
  onConfirm: (
    replenishment: InboundStockReplenishment,
    receivedQty: number,
    targetBin: string
  ) => void;
}

export function RestockIntakeModal({
  isOpen,
  onClose,
  replenishment,
  bins,
  onConfirm,
}: RestockIntakeModalProps) {
  const [receivedQty, setReceivedQty] = useState<number | ''>(50);
  const [selectedBin, setSelectedBin] = useState<string>('A-01-02');

  const initializedRef = React.useRef<string | null>(null);

  useEffect(() => {
    if (isOpen && replenishment) {
      if (initializedRef.current !== replenishment.id) {
        initializedRef.current = replenishment.id;
        setReceivedQty(replenishment.requestedQty || 50);
        setSelectedBin(replenishment.binCode || bins[0]?.code || 'A-01-02');
      }
    } else if (!isOpen) {
      initializedRef.current = null;
    }
  }, [isOpen, replenishment?.id]);

  if (!replenishment) return null;

  const currentStock = replenishment.currentStock ?? 0;
  const numQty = typeof receivedQty === 'number' ? receivedQty : 0;
  const projectedTotalStock = currentStock + numQty;

  const handleDecrement = () => {
    setReceivedQty((prev) => {
      const curr = typeof prev === 'number' ? prev : 1;
      return Math.max(1, curr - 1);
    });
  };

  const handleIncrement = () => {
    setReceivedQty((prev) => {
      const curr = typeof prev === 'number' ? prev : 0;
      return curr + 1;
    });
  };

  const handleConfirm = () => {
    const finalQty = typeof receivedQty === 'number' && receivedQty > 0 ? receivedQty : 1;
    onConfirm(replenishment, finalQty, selectedBin);
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Confirm Inbound Stock Replenishment & Put-Away"
      size="md"
    >
      <div className="space-y-4">
        {/* Header Alert */}
        <div className="flex items-start gap-3.5 p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
            <CheckCircle2 className="w-5 h-5" />
          </div>
          <div className="text-xs sm:text-sm text-slate-700 dark:text-slate-200">
            <span className="font-bold text-navy-800 dark:text-white">Inbound Stock Arrival: </span>
            Merchant{' '}
            <strong className="text-navy-900 dark:text-white">
              {replenishment.merchantName} ({replenishment.merchantCode})
            </strong>{' '}
            requested to restock existing catalog item. Verify physical arrival and put away into
            warehouse bin.
          </div>
        </div>

        {/* Product Card Info */}
        <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-navy-950 border border-slate-200 dark:border-white/10 flex items-center gap-3">
          <img
            src={replenishment.imageUrl}
            alt={replenishment.productTitle}
            className="w-14 h-14 rounded-xl object-cover border border-slate-200 dark:border-white/10 shrink-0"
          />
          <div className="text-xs space-y-1 min-w-0 flex-1">
            <div className="font-bold text-navy-800 dark:text-white truncate">
              {replenishment.productTitle}
            </div>
            <div className="tabular-nums font-mono text-[11px] text-orange-600 dark:text-orange-400">
              {replenishment.productSku}
            </div>
            <div className="flex items-center gap-2 text-[11px] text-slate-500 dark:text-slate-400">
              <span>Category: {replenishment.category}</span>
              <span>·</span>
              <span>Merchant: {replenishment.merchantCode}</span>
            </div>
          </div>
        </div>

        {/* Stock Math Summary */}
        <div className="grid grid-cols-3 gap-2 p-3 rounded-xl bg-slate-100 dark:bg-navy-900/60 border border-slate-200 dark:border-white/10 text-center text-xs">
          <div>
            <div className="text-slate-500 dark:text-slate-400 text-[10px] uppercase font-bold tracking-wider">
              Current Stock
            </div>
            <div
              className={`text-sm font-extrabold tabular-nums mt-0.5 ${
                currentStock === 0
                  ? 'text-rose-600 dark:text-rose-400'
                  : 'text-navy-800 dark:text-white'
              }`}
            >
              {currentStock} pcs
            </div>
          </div>

          <div className="flex flex-col items-center justify-center">
            <ArrowRight className="w-4 h-4 text-orange-500 my-0.5" />
            <div className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 tabular-nums">
              +{numQty} inbound
            </div>
          </div>

          <div>
            <div className="text-slate-500 dark:text-slate-400 text-[10px] uppercase font-bold tracking-wider">
              Projected Stock
            </div>
            <div className="text-sm font-extrabold text-emerald-600 dark:text-emerald-400 tabular-nums mt-0.5">
              {projectedTotalStock} pcs
            </div>
          </div>
        </div>

        {/* Quantity Intake Input */}
        <div>
          <label className="block text-xs font-bold text-slate-700 dark:text-slate-200 mb-1.5">
            Verified Physical Intake Quantity (Units) *
          </label>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleDecrement}
              className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-navy-800 hover:bg-slate-200 dark:hover:bg-navy-700 border border-slate-300 dark:border-white/10 text-navy-800 dark:text-slate-100 flex items-center justify-center font-bold text-base transition-colors shrink-0 cursor-pointer select-none"
              title="Decrease quantity"
            >
              <Minus className="w-4 h-4" />
            </button>
            <div className="relative flex-1">
              <input
                type="number"
                min={1}
                value={receivedQty}
                placeholder="Enter verified quantity"
                onChange={(e) => {
                  const val = e.target.value;
                  if (val === '') {
                    setReceivedQty('');
                  } else {
                    const parsed = parseInt(val, 10);
                    if (!isNaN(parsed)) {
                      setReceivedQty(Math.max(1, parsed));
                    }
                  }
                }}
                onBlur={() => {
                  if (receivedQty === '' || receivedQty < 1) {
                    setReceivedQty(1);
                  }
                }}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-navy-950 border border-slate-300 dark:border-white/10 text-sm tabular-nums font-bold text-orange-600 dark:text-orange-400 focus:outline-none focus:border-orange-500"
              />
            </div>
            <button
              type="button"
              onClick={handleIncrement}
              className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-navy-800 hover:bg-slate-200 dark:hover:bg-navy-700 border border-slate-300 dark:border-white/10 text-navy-800 dark:text-slate-100 flex items-center justify-center font-bold text-base transition-colors shrink-0 cursor-pointer select-none"
              title="Increase quantity"
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
            Merchant declared <strong>{replenishment.requestedQty} units</strong>. If cartons
            contain shortages or damages, adjust verified count above.
          </p>
        </div>

        {/* Target Bin Assignment */}
        <div>
          <label className="block text-xs font-bold text-slate-700 dark:text-slate-200 mb-1.5">
            Put-Away Warehouse Storage Bin *
          </label>
          <select
            value={selectedBin}
            onChange={(e) => setSelectedBin(e.target.value)}
            className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-navy-950 border border-slate-300 dark:border-white/10 text-xs font-semibold text-navy-800 dark:text-slate-100 focus:outline-none focus:border-orange-500 cursor-pointer"
          >
            {bins.map((bin) => (
              <option key={bin.code} value={bin.code}>
                Bin {bin.code} ({bin.zone}) — {bin.description}
              </option>
            ))}
          </select>
        </div>

        {/* Merchant Note & Inbound Ref */}
        {(replenishment.note || replenishment.trackingRef) && (
          <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-xs text-slate-700 dark:text-slate-300 space-y-1">
            {replenishment.note && (
              <div>
                <strong className="text-amber-700 dark:text-amber-400">Merchant Note: </strong>
                {replenishment.note}
              </div>
            )}
            {replenishment.trackingRef && (
              <div className="flex items-center gap-1.5 text-slate-500 dark:text-slate-400">
                <Truck className="w-3.5 h-3.5 text-amber-500" />
                <span>Tracking Ref: {replenishment.trackingRef}</span>
              </div>
            )}
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-200 dark:border-white/10">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2.5 rounded-xl border border-slate-300 dark:border-white/10 text-xs font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-navy-800 transition-colors cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-md shadow-emerald-500/20 transition-all cursor-pointer flex items-center gap-1.5 active:scale-95"
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>Approve &amp; Add Stock (+{numQty})</span>
          </button>
        </div>
      </div>
    </Modal>
  );
}
