'use client';

import React, { useState } from 'react';
import {
  AlertTriangle,
  RotateCcw,
  ShieldCheck,
  X,
  CheckCircle2,
  PackageX,
  Loader2,
} from 'lucide-react';

interface CancelOrderModalProps {
  isOpen: boolean;
  orderNumber: string;
  customerName?: string;
  amount?: number;
  qty?: number;
  isCancelling?: boolean;
  onClose: () => void;
  onConfirm: (reason: string) => Promise<void> | void;
}

const PRESET_REASONS = [
  'Customer requested cancellation (Changed mind)',
  'Customer unreachable / Phone switched off',
  'Duplicate order placed by customer',
  'Customer requested address, color or size change',
  'Customer cancelled before warehouse packaging',
  'Other / Manual cancellation',
];

export function CancelOrderModal({
  isOpen,
  orderNumber,
  customerName,
  amount,
  qty,
  isCancelling = false,
  onClose,
  onConfirm,
}: CancelOrderModalProps) {
  const [selectedReason, setSelectedReason] = useState(PRESET_REASONS[0]);
  const [customNote, setCustomNote] = useState('');
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const displayOrderNum = orderNumber.startsWith('#') ? orderNumber : `#${orderNumber}`;

  const handleExecute = async () => {
    const finalReason =
      selectedReason === 'Other / Manual cancellation' && customNote.trim()
        ? `Other: ${customNote.trim()}`
        : selectedReason;

    setLoading(true);
    try {
      await onConfirm(finalReason);
    } finally {
      setLoading(false);
    }
  };

  const isSubmitting = isCancelling || loading;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-150">
      <div className="bg-white dark:bg-navy-900 border border-slate-200 dark:border-white/10 rounded-3xl max-w-lg w-full p-6 shadow-2xl space-y-5 text-navy-900 dark:text-white relative">
        {/* Header */}
        <div className="flex items-start justify-between gap-3 pb-3 border-b border-slate-100 dark:border-white/10">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-rose-500/10 border border-rose-500/30 rounded-2xl text-rose-500 shrink-0">
              <PackageX className="h-6 w-6" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-bold text-navy-900 dark:text-white tracking-tight">
                Cancel Order {displayOrderNum}
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Confirm order cancellation &amp; automatic warehouse stock restoration
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="p-1 rounded-lg text-slate-400 hover:text-navy-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-navy-800 transition-colors disabled:opacity-50 cursor-pointer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Order Details Snippet (if available) */}
        {(customerName || amount !== undefined || qty !== undefined) && (
          <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-navy-950 border border-slate-200/80 dark:border-white/5 flex items-center justify-between text-xs">
            <div>
              <span className="text-slate-400 block text-[11px]">Customer</span>
              <span className="font-semibold text-navy-900 dark:text-white">
                {customerName || 'Customer'}
              </span>
            </div>
            {qty !== undefined && (
              <div>
                <span className="text-slate-400 block text-[11px]">Items</span>
                <span className="font-bold text-navy-900 dark:text-white">
                  {qty} {qty === 1 ? 'pc' : 'pcs'}
                </span>
              </div>
            )}
            {amount !== undefined && (
              <div className="text-right">
                <span className="text-slate-400 block text-[11px]">Order Value</span>
                <span className="font-mono font-bold text-orange-600 dark:text-orange-400">
                  ৳{Number(amount).toLocaleString()}
                </span>
              </div>
            )}
          </div>
        )}

        {/* Reason Selector */}
        <div className="space-y-2">
          <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block">
            Select Cancellation Reason:
          </label>
          <select
            value={selectedReason}
            onChange={(e) => setSelectedReason(e.target.value)}
            disabled={isSubmitting}
            className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-navy-950 border border-slate-200 dark:border-white/10 text-xs sm:text-sm text-navy-900 dark:text-white focus:outline-none focus:border-orange-500 cursor-pointer"
          >
            {PRESET_REASONS.map((r) => (
              <option key={r} value={r}>
                {r}
              </option>
            ))}
          </select>

          {selectedReason === 'Other / Manual cancellation' && (
            <input
              type="text"
              value={customNote}
              onChange={(e) => setCustomNote(e.target.value)}
              placeholder="Enter specific reason..."
              disabled={isSubmitting}
              className="w-full px-3.5 py-2 rounded-xl bg-slate-50 dark:bg-navy-950 border border-slate-200 dark:border-white/10 text-xs text-navy-900 dark:text-white focus:outline-none focus:border-orange-500 mt-2"
            />
          )}
        </div>

        {/* Automatic Consequences Checklist */}
        <div className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/25 space-y-2 text-xs text-slate-700 dark:text-slate-300">
          <div className="flex items-center gap-2 font-bold text-amber-700 dark:text-amber-400">
            <AlertTriangle className="h-4 w-4 shrink-0" />
            <span>What happens next:</span>
          </div>
          <ul className="space-y-1.5 pl-6 list-disc text-[11px] text-slate-600 dark:text-slate-300">
            <li>
              Order status is immediately updated to{' '}
              <strong className="text-rose-600 dark:text-rose-400">CANCELLED</strong> in the PostgreSQL database.
            </li>
            <li>
              Reserved inventory is released and returned directly to available sellable warehouse stock.
            </li>
            <li>
              Accumulates automatically in the{' '}
              <strong className="text-orange-600 dark:text-orange-400">Returns &amp; Cancellations Hub</strong> with an immutable digital stock proof.
            </li>
          </ul>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100 dark:border-white/10">
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="px-4 py-2.5 bg-slate-100 dark:bg-navy-800 hover:bg-slate-200 dark:hover:bg-navy-700 text-slate-700 dark:text-slate-200 rounded-xl text-xs font-semibold transition-colors disabled:opacity-50 cursor-pointer"
          >
            No, Keep Order
          </button>
          <button
            type="button"
            onClick={handleExecute}
            disabled={isSubmitting}
            className="px-5 py-2.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-rose-600/25 flex items-center gap-2 disabled:opacity-50 cursor-pointer"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Cancelling Order...</span>
              </>
            ) : (
              <span>Yes, Cancel Order</span>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

export default CancelOrderModal;
