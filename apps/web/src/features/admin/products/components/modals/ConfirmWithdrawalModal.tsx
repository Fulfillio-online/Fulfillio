'use client';

import React, { useState, useEffect } from 'react';
import { CheckCircle2, ArrowRight, Minus, Plus, Truck, AlertTriangle, PackageMinus } from 'lucide-react';
import { Modal } from '@/components/admin/AdminModal';
import { StockWithdrawalRequest, WarehouseBin } from '../../types';

interface ConfirmWithdrawalModalProps {
  isOpen: boolean;
  onClose: () => void;
  withdrawal: StockWithdrawalRequest | null;
  onConfirm: (
    withdrawal: StockWithdrawalRequest,
    verifiedQty: number,
    dispatchNotes?: string
  ) => void;
}

export function ConfirmWithdrawalModal({
  isOpen,
  onClose,
  withdrawal,
  onConfirm,
}: ConfirmWithdrawalModalProps) {
  const [verifiedQty, setVerifiedQty] = useState<number | ''>(50);
  const [dispatchNote, setDispatchNote] = useState<string>('Picked from bin and dispatched to merchant');

  useEffect(() => {
    if (withdrawal) {
      setVerifiedQty(withdrawal.withdrawQty || 50);
      setDispatchNote(withdrawal.reason || 'Picked from bin and dispatched to merchant');
    }
  }, [withdrawal]);

  if (!withdrawal) return null;

  const currentStock = withdrawal.currentStock ?? 0;
  const numQty = typeof verifiedQty === 'number' ? verifiedQty : 0;
  const remainingStock = Math.max(0, currentStock - numQty);

  const handleDecrement = () => {
    setVerifiedQty((prev) => {
      const curr = typeof prev === 'number' ? prev : 1;
      return Math.max(1, curr - 1);
    });
  };

  const handleIncrement = () => {
    setVerifiedQty((prev) => {
      const curr = typeof prev === 'number' ? prev : 0;
      return Math.min(currentStock, curr + 1);
    });
  };

  const handleConfirm = () => {
    const finalQty = typeof verifiedQty === 'number' && verifiedQty > 0 ? verifiedQty : 1;
    onConfirm(withdrawal, finalQty, dispatchNote);
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Confirm Stock Withdrawal & Return to Merchant"
      size="md"
    >
      <div className="space-y-4">
        {/* Header Alert */}
        <div className="flex items-start gap-3.5 p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/20">
          <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
            <PackageMinus className="w-5 h-5" />
          </div>
          <div className="text-xs sm:text-sm text-slate-700 dark:text-slate-200">
            <span className="font-bold text-navy-800 dark:text-white">Merchant Stock Recall: </span>
            Merchant{' '}
            <strong className="text-navy-900 dark:text-white">
              {withdrawal.merchantName} ({withdrawal.merchantCode})
            </strong>{' '}
            requested to withdraw stock from warehouse. Pick verified quantity from storage bin and
            release for courier / merchant pickup.
          </div>
        </div>

        {/* Product Card Info */}
        <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-navy-950 border border-slate-200 dark:border-white/10 flex items-center gap-3">
          <img
            src={withdrawal.imageUrl}
            alt={withdrawal.productTitle}
            className="w-14 h-14 rounded-xl object-cover border border-slate-200 dark:border-white/10 shrink-0"
          />
          <div className="text-xs space-y-1 min-w-0 flex-1">
            <div className="font-bold text-navy-800 dark:text-white truncate">
              {withdrawal.productTitle}
            </div>
            <div className="tabular-nums font-mono text-[11px] text-orange-600 dark:text-orange-400">
              {withdrawal.productSku}
            </div>
            <div className="flex items-center gap-2 text-[11px] text-slate-500 dark:text-slate-400">
              <span>Pick Location: <strong>Bin {withdrawal.binCode}</strong></span>
              <span>·</span>
              <span>Merchant: {withdrawal.merchantCode}</span>
            </div>
          </div>
        </div>

        {/* Stock Math Summary */}
        <div className="grid grid-cols-3 gap-2 p-3 rounded-xl bg-slate-100 dark:bg-navy-900/60 border border-slate-200 dark:border-white/10 text-center text-xs">
          <div>
            <div className="text-slate-500 dark:text-slate-400 text-[10px] uppercase font-bold tracking-wider">
              Current Live Stock
            </div>
            <div className="text-sm font-extrabold text-navy-800 dark:text-white tabular-nums mt-0.5">
              {currentStock} pcs
            </div>
          </div>

          <div className="flex flex-col items-center justify-center">
            <ArrowRight className="w-4 h-4 text-rose-500 my-0.5" />
            <div className="text-[10px] font-bold text-rose-600 dark:text-rose-400 tabular-nums">
              -{numQty} withdraw
            </div>
          </div>

          <div>
            <div className="text-slate-500 dark:text-slate-400 text-[10px] uppercase font-bold tracking-wider">
              Remaining in Bin
            </div>
            <div
              className={`text-sm font-extrabold tabular-nums mt-0.5 ${
                remainingStock === 0 ? 'text-amber-600 dark:text-amber-400' : 'text-emerald-600 dark:text-emerald-400'
              }`}
            >
              {remainingStock} pcs
            </div>
          </div>
        </div>

        {/* Quantity Withdrawal Input */}
        <div>
          <label className="block text-xs font-bold text-slate-700 dark:text-slate-200 mb-1.5">
            Verified Picked &amp; Released Quantity (Units) *
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
                max={currentStock}
                value={verifiedQty}
                placeholder="Enter verified quantity"
                onChange={(e) => {
                  const val = e.target.value;
                  if (val === '') {
                    setVerifiedQty('');
                  } else {
                    const parsed = parseInt(val, 10);
                    if (!isNaN(parsed)) {
                      setVerifiedQty(Math.min(currentStock, Math.max(1, parsed)));
                    }
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
            Pick from <strong>Bin {withdrawal.binCode}</strong>. Maximum available stock:{' '}
            <strong>{currentStock} units</strong>.
          </p>
        </div>

        {/* Merchant Recall Reason */}
        {withdrawal.reason && (
          <div className="p-3 rounded-xl bg-slate-100 dark:bg-navy-950 border border-slate-200 dark:border-white/10 text-xs text-slate-700 dark:text-slate-300">
            <strong className="text-navy-900 dark:text-white">Merchant Recall Reason: </strong>
            {withdrawal.reason}
          </div>
        )}

        {/* Dispatch Notes */}
        <div>
          <label className="block text-xs font-bold text-slate-700 dark:text-slate-200 mb-1.5">
            Warehouse Release / Dispatch Notes
          </label>
          <input
            type="text"
            value={dispatchNote}
            onChange={(e) => setDispatchNote(e.target.value)}
            className="w-full px-3.5 py-2 rounded-xl bg-slate-50 dark:bg-navy-950 border border-slate-300 dark:border-white/10 text-xs text-navy-800 dark:text-slate-100 focus:outline-none focus:border-orange-500"
          />
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-200 dark:border-white/10">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl border border-slate-300 dark:border-white/10 text-xs font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-navy-800 transition-colors cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            className="px-5 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold shadow-md shadow-rose-500/20 transition-all cursor-pointer flex items-center gap-1.5 active:scale-95"
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>Approve &amp; Release Stock (-{numQty})</span>
          </button>
        </div>
      </div>
    </Modal>
  );
}
