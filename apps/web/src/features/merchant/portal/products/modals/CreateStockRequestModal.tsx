'use client';

import React, { useState, useEffect } from 'react';
import {
  X,
  Package,
  ArrowUpRight,
  Plus,
  Boxes,
  FileText,
  Search,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react';
import { MerchantProductItem } from '../../types';
import { ProductThumbnail } from '../components/ProductThumbnail';

interface CreateStockRequestModalProps {
  isOpen: boolean;
  onClose: () => void;
  products: MerchantProductItem[];
  initialProductId?: string;
  onSubmit: (productId: string, requestedQty: number, note?: string) => void;
}

export function CreateStockRequestModal({
  isOpen,
  onClose,
  products,
  initialProductId,
  onSubmit,
}: CreateStockRequestModalProps) {
  const [selectedProductId, setSelectedProductId] = useState<string>('');
  const [requestedQty, setRequestedQty] = useState<number>(50);
  const [note, setNote] = useState<string>('');
  const [searchFilter, setSearchFilter] = useState<string>('');

  useEffect(() => {
    if (initialProductId) {
      setSelectedProductId(initialProductId);
    } else if (products.length > 0 && !selectedProductId) {
      setSelectedProductId(products[0].id);
    }
  }, [initialProductId, products, selectedProductId]);

  if (!isOpen) return null;

  const selectedProduct = products.find((p) => p.id === selectedProductId) || products[0];

  const filteredProducts = products.filter(
    (p) =>
      p.title.toLowerCase().includes(searchFilter.toLowerCase()) ||
      p.sku.toLowerCase().includes(searchFilter.toLowerCase())
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProduct || requestedQty <= 0) return;
    onSubmit(selectedProduct.id, requestedQty, note.trim() || undefined);
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 cursor-pointer"
      onClick={onClose}
    >
      <div
        className="bg-white dark:bg-navy-900 border border-slate-200 dark:border-white/10 rounded-2xl w-full max-w-lg p-5 sm:p-6 space-y-4 shadow-2xl animate-in zoom-in-95 duration-200 cursor-default"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="flex items-start justify-between border-b border-slate-100 dark:border-white/10 pb-3">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-orange-500/10 border border-orange-500/20 flex items-center justify-center text-orange-600 dark:text-orange-400 shrink-0">
              <ArrowUpRight className="h-5 w-5" />
            </div>
            <div>
              <h3 className="font-bold text-base text-navy-900 dark:text-white">
                Request Stock Replenishment
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Send additional stock units to Fulfillio warehouse without re-creating SKUs.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-navy-900 dark:hover:text-white p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-navy-800 transition-colors cursor-pointer"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Select Product */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-600 dark:text-slate-300 flex items-center justify-between">
              <span>Select Warehouse Product to Restock:</span>
              <span className="text-[11px] text-slate-400">({products.length} Products Available)</span>
            </label>

            {products.length === 0 ? (
              <div className="p-4 rounded-xl bg-slate-50 dark:bg-navy-950 border border-slate-200 dark:border-white/10 text-xs text-slate-400 text-center">
                কোনো প্রোডাক্ট পাওয়া যায়নি। অনুগ্রহ করে আগে একটি প্রোডাক্ট যোগ করুন।
              </div>
            ) : (
              <>
                <select
                  value={selectedProduct?.id || ''}
                  onChange={(e) => setSelectedProductId(e.target.value)}
                  className="w-full px-3 py-2.5 bg-slate-50 dark:bg-navy-950 border border-slate-200 dark:border-white/10 rounded-xl text-xs font-medium text-navy-900 dark:text-white focus:outline-none focus:border-orange-500 cursor-pointer"
                >
                  {products.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.title} ({p.sku}) — Current Stock: {p.stock} units
                    </option>
                  ))}
                </select>

                {/* Selected Product Summary Card */}
                {selectedProduct && (
                  <div className="p-3 rounded-xl bg-slate-50 dark:bg-navy-950/70 border border-slate-200 dark:border-white/10 flex items-center gap-3">
                    <ProductThumbnail
                      src={selectedProduct.imageUrl}
                      alt={selectedProduct.title}
                      size="md"
                    />
                    <div className="flex-1 min-w-0">
                      <span className="font-semibold text-navy-900 dark:text-white text-xs block truncate">
                        {selectedProduct.title}
                      </span>
                      <div className="flex items-center gap-2 mt-0.5 text-[11px] text-slate-400 font-mono">
                        <span className="text-orange-600 dark:text-orange-400 font-bold">
                          {selectedProduct.sku}
                        </span>
                        <span>•</span>
                        <span>Current Stock: {selectedProduct.stock} units</span>
                      </div>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>

          {/* Requested Quantity */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-600 dark:text-slate-300 flex items-center justify-between">
              <span>Requested Replenishment Units (Inbound Qty):</span>
              <span className="text-[11px] text-orange-600 dark:text-orange-400 font-bold">
                New Total: {(selectedProduct?.stock || 0) + requestedQty} units
              </span>
            </label>
            <div className="flex items-center gap-2">
              <input
                type="number"
                min="1"
                max="10000"
                value={requestedQty}
                onChange={(e) => setRequestedQty(Math.max(1, parseInt(e.target.value) || 1))}
                required
                className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-navy-950 border border-slate-200 dark:border-white/10 rounded-xl text-sm font-bold text-navy-900 dark:text-white focus:outline-none focus:border-orange-500 font-mono"
              />
              <div className="flex items-center gap-1.5 shrink-0">
                {[20, 50, 100, 200].map((preset) => (
                  <button
                    key={preset}
                    type="button"
                    onClick={() => setRequestedQty(preset)}
                    className={`px-2.5 py-2 rounded-lg text-xs font-semibold border transition-all cursor-pointer ${
                      requestedQty === preset
                        ? 'bg-orange-600 text-white border-orange-600'
                        : 'bg-slate-100 dark:bg-navy-800 border-slate-200 dark:border-white/10 text-slate-600 dark:text-slate-300 hover:border-orange-500/40'
                    }`}
                  >
                    +{preset}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Note or Inbound Tracking Reference */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-600 dark:text-slate-300">
              Inbound Notes / Carrier Tracking (Optional):
            </label>
            <input
              type="text"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="e.g. Courier: Sundarban, Tracking: SN-49201, Arriving Sunday"
              className="w-full px-3.5 py-2 bg-slate-50 dark:bg-navy-950 border border-slate-200 dark:border-white/10 rounded-xl text-xs text-navy-900 dark:text-white focus:outline-none focus:border-orange-500"
            />
          </div>

          {/* Workflow Alert */}
          <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-800 dark:text-amber-300 text-xs flex items-start gap-2.5">
            <AlertCircle className="h-4 w-4 shrink-0 mt-0.5 text-amber-500" />
            <p className="leading-relaxed">
              রিকোয়েস্ট পাঠানোর পর এটি <strong>Stock Requests</strong> ট্যাবে <em>Pending Admin Approval</em> হিসেবে জমা থাকবে। ওয়্যারহাউসে রিসিভ ও অ্যাপ্রুভ করার সাথে সাথে স্টক স্বয়ংক্রিয়ভাবে আপডেট হবে।
            </p>
          </div>

          {/* Modal Footer */}
          <div className="pt-2 flex items-center justify-end gap-2.5 border-t border-slate-100 dark:border-white/10">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl bg-slate-100 dark:bg-navy-800 hover:bg-slate-200 dark:hover:bg-navy-700 text-slate-700 dark:text-slate-300 text-xs font-semibold transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!selectedProduct || requestedQty <= 0}
              className="px-5 py-2.5 rounded-xl bg-orange-600 hover:bg-orange-500 disabled:opacity-50 text-white text-xs font-bold transition-all shadow-md shadow-orange-500/20 cursor-pointer flex items-center gap-1.5"
            >
              <ArrowUpRight className="h-4 w-4" />
              <span>Submit Stock Request (+{requestedQty})</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
