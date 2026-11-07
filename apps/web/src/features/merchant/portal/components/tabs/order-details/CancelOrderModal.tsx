'use client';

import React from 'react';
import { AlertTriangle } from 'lucide-react';

interface CancelOrderModalProps {
  isOpen: boolean;
  orderNumber: string;
  onClose: () => void;
  onConfirm: () => void;
}

export function CancelOrderModal({
  isOpen,
  orderNumber,
  onClose,
  onConfirm,
}: CancelOrderModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-150">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-5 sm:p-6 shadow-2xl space-y-4">
        <div className="flex items-start gap-3.5">
          <div className="p-2.5 bg-rose-500/10 border border-rose-500/30 rounded-xl text-rose-400 shrink-0">
            <AlertTriangle className="h-5 w-5" />
          </div>
          <div className="space-y-1">
            <h3 className="text-base font-bold text-white">Cancel Order {orderNumber}?</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Are you sure you want to cancel this order? This will stop fulfillment and automatically
              restore the reserved inventory items back into warehouse stock bins.
            </p>
          </div>
        </div>

        <div className="flex justify-end gap-2.5 pt-3 border-t border-slate-800">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-semibold transition-colors cursor-pointer"
          >
            No, Keep Order
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className="px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white rounded-xl text-xs font-semibold transition-colors shadow-sm cursor-pointer"
          >
            Yes, Cancel Order
          </button>
        </div>
      </div>
    </div>
  );
}
