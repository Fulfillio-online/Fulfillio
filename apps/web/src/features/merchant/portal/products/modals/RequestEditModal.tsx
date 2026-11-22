'use client';

import React, { useState } from 'react';
import { Edit3, X, AlertCircle, CheckCircle2, ShieldAlert } from 'lucide-react';
import { MerchantProductItem } from '../../types';

interface RequestEditModalProps {
  product: MerchantProductItem | null;
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (productId: string, reason: string) => Promise<boolean | void>;
}

export function RequestEditModal({
  product,
  isOpen,
  onClose,
  onSubmit,
}: RequestEditModalProps) {
  const [reason, setReason] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen || !product) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reason.trim()) {
      setError('Please provide a reason or summary of changes you wish to make.');
      return;
    }
    setError(null);
    setIsSubmitting(true);
    try {
      await onSubmit(product.id, reason.trim());
      setIsSubmitting(false);
      onClose();
    } catch (err: any) {
      setError(err?.message || 'Failed to submit edit request');
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
      <div className="bg-white dark:bg-navy-900 rounded-2xl border border-slate-200 dark:border-white/10 shadow-2xl max-w-md w-full overflow-hidden flex flex-col">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-100 dark:border-white/10 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="h-9 w-9 rounded-xl bg-orange-500/10 text-orange-600 dark:text-orange-400 flex items-center justify-center border border-orange-500/20">
              <Edit3 className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-sm sm:text-base font-bold text-navy-900 dark:text-white">
                Request Edit Access
              </h3>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                Active &amp; stocked products require admin revision review
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-navy-800 transition-colors cursor-pointer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          {error && (
            <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-500/20 text-xs text-rose-600 dark:text-rose-400 flex items-center gap-2">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Product Pill */}
          <div className="p-3 rounded-xl bg-slate-50 dark:bg-navy-950/60 border border-slate-200/80 dark:border-white/10 flex items-center justify-between text-xs">
            <div>
              <span className="font-bold text-navy-900 dark:text-white block line-clamp-1">
                {product.title}
              </span>
              <span className="font-mono text-[11px] text-orange-600 dark:text-orange-400 font-semibold">
                SKU: {product.sku}
              </span>
            </div>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/15 text-emerald-600 border border-emerald-500/30">
              Active ({product.stock} in stock)
            </span>
          </div>

          <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/20 text-xs text-amber-800 dark:text-amber-300 flex items-start gap-2">
            <ShieldAlert className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
            <p className="text-[11px] leading-relaxed">
              Once approved by admin, you will receive temporary editing access to submit your proposed revisions without affecting warehouse stock.
            </p>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
              Reason for Edit Request <span className="text-rose-500">*</span>
            </label>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="e.g. Updated product dimensions, corrected title spelling, or updated lifestyle gallery images..."
              rows={4}
              required
              className="w-full rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-navy-900 p-3 text-xs text-navy-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2 rounded-xl border border-slate-200 dark:border-white/10 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100 transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2 rounded-xl bg-orange-600 hover:bg-orange-500 disabled:opacity-50 text-white text-xs font-bold shadow-md shadow-orange-500/20 transition-all flex items-center gap-2 cursor-pointer active:scale-[0.98]"
            >
              {isSubmitting ? 'Submitting...' : 'Request Permission'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
