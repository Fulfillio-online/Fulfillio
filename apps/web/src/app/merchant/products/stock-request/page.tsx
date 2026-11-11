'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  ArrowLeft,
  ArrowUpRight,
  Package,
  Boxes,
  Store,
  AlertCircle,
  CheckCircle2,
} from 'lucide-react';
import { useMerchant } from '@/features/merchant/portal/MerchantContext';
import { ProductThumbnail } from '@/features/merchant/portal/products/components/ProductThumbnail';

export default function StockRequestPage() {
  const router = useRouter();
  const { products, profile, requestStockAdd, showToast } = useMerchant();

  const [selectedProductId, setSelectedProductId] = useState<string>(
    products[0]?.id || ''
  );
  const [requestedQty, setRequestedQty] = useState<number>(50);
  const [note, setNote] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  const selectedProduct =
    products.find((p) => p.id === selectedProductId) || products[0];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProduct || requestedQty <= 0) return;

    setIsSubmitting(true);
    requestStockAdd(selectedProduct.id, requestedQty, note.trim() || undefined);
    showToast(
      `Stock replenishment request (+${requestedQty} units) submitted for "${selectedProduct.title}".`
    );

    setTimeout(() => {
      if (typeof window !== 'undefined') {
        sessionStorage.setItem('fulfillio_products_initial_tab', 'STOCK_REQUESTS');
      }
      router.push('/merchant/products');
    }, 400);
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Top Navigation */}
      <div className="flex items-center justify-between">
        <Link
          href="/merchant/products"
          className="inline-flex items-center gap-2 text-xs font-semibold text-slate-500 hover:text-navy-900 dark:hover:text-white transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Back to Products</span>
        </Link>
        <span className="text-xs font-mono font-bold text-orange-600 dark:text-orange-400 bg-orange-500/10 px-2.5 py-1 rounded-lg border border-orange-500/20">
          Merchant: {profile.merchantCode}
        </span>
      </div>

      {/* Page Card */}
      <div className="rounded-2xl border border-slate-200/80 dark:border-white/10 bg-white dark:bg-navy-900 shadow-sm p-5 sm:p-7 space-y-6">
        <div>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-orange-500/10 text-orange-600 dark:text-orange-400 text-xs font-bold border border-orange-500/20 mb-2">
            <ArrowUpRight className="h-3.5 w-3.5" />
            <span>Inbound Restock Request</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-navy-900 dark:text-white tracking-tight">
            Request Warehouse Stock Replenishment
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
            Send additional units of an existing catalog item to the Fulfillio warehouse without duplicate SKUs.
          </p>
        </div>

        {products.length === 0 ? (
          <div className="p-8 text-center rounded-xl bg-slate-50 dark:bg-navy-950 border border-slate-200 dark:border-white/10 space-y-3">
            <Package className="h-10 w-10 text-slate-400 mx-auto" />
            <h3 className="font-bold text-sm text-navy-900 dark:text-white">
              No Catalog Products Found
            </h3>
            <p className="text-xs text-slate-400 max-w-sm mx-auto">
              You must have at least one product created before requesting warehouse replenishment.
            </p>
            <Link
              href="/merchant/products/new"
              className="inline-flex items-center gap-2 px-4 py-2 bg-orange-600 hover:bg-orange-500 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-orange-500/20"
            >
              Add First Product &rarr;
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* 1. Select Product */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-navy-900 dark:text-white uppercase tracking-wider block">
                1. Select Product to Replenish
              </label>
              <select
                value={selectedProduct?.id || ''}
                onChange={(e) => setSelectedProductId(e.target.value)}
                className="w-full px-3.5 py-3 bg-slate-50 dark:bg-navy-950 border border-slate-200 dark:border-white/10 rounded-xl text-sm font-semibold text-navy-900 dark:text-white focus:outline-none focus:border-orange-500 cursor-pointer shadow-xs"
              >
                {products.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.title} ({p.sku}) — Current Stock: {p.stock} units
                  </option>
                ))}
              </select>

              {/* Selected Product Card */}
              {selectedProduct && (
                <div className="p-4 rounded-xl bg-slate-50 dark:bg-navy-950/70 border border-slate-200/80 dark:border-white/10 flex items-center gap-3.5">
                  <ProductThumbnail
                    src={selectedProduct.imageUrl}
                    alt={selectedProduct.title}
                    size="lg"
                  />
                  <div className="flex-1 min-w-0">
                    <h4 className="font-bold text-navy-900 dark:text-white text-sm truncate">
                      {selectedProduct.title}
                    </h4>
                    <div className="flex items-center gap-2.5 mt-1 text-xs text-slate-500 dark:text-slate-400 font-mono">
                      <span className="font-bold text-orange-600 dark:text-orange-400">
                        {selectedProduct.sku}
                      </span>
                      <span>•</span>
                      <span>Barcode: {selectedProduct.barcode || 'N/A'}</span>
                      <span>•</span>
                      <span className="text-emerald-600 dark:text-emerald-400 font-bold">
                        Stock: {selectedProduct.stock} units
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* 2. Replenishment Quantity */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-navy-900 dark:text-white uppercase tracking-wider block">
                  2. Inbound Units Quantity
                </label>
                <span className="text-xs font-bold text-orange-600 dark:text-orange-400 font-mono">
                  Resulting Total: {(selectedProduct?.stock || 0) + requestedQty} units
                </span>
              </div>

              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                <input
                  type="number"
                  min="1"
                  max="10000"
                  value={requestedQty}
                  onChange={(e) =>
                    setRequestedQty(Math.max(1, parseInt(e.target.value) || 1))
                  }
                  required
                  className="flex-1 px-4 py-2.5 bg-slate-50 dark:bg-navy-950 border border-slate-200 dark:border-white/10 rounded-xl text-base font-bold text-navy-900 dark:text-white focus:outline-none focus:border-orange-500 font-mono"
                />

                <div className="flex items-center gap-1.5 shrink-0">
                  {[25, 50, 100, 250, 500].map((preset) => (
                    <button
                      key={preset}
                      type="button"
                      onClick={() => setRequestedQty(preset)}
                      className={`px-3 py-2 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                        requestedQty === preset
                          ? 'bg-orange-600 text-white border-orange-600 shadow-sm'
                          : 'bg-slate-100 dark:bg-navy-800 border-slate-200 dark:border-white/10 text-slate-700 dark:text-slate-300 hover:border-orange-500/40'
                      }`}
                    >
                      +{preset}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* 3. Inbound Carrier / Notes */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-navy-900 dark:text-white uppercase tracking-wider block">
                3. Carrier & Tracking Notes (Optional)
              </label>
              <input
                type="text"
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="e.g. Courier: Sundarban / SA Paribahan, Consignment No: 49219, Expected Arrival: Saturday"
                className="w-full px-4 py-2.5 bg-slate-50 dark:bg-navy-950 border border-slate-200 dark:border-white/10 rounded-xl text-xs text-navy-900 dark:text-white focus:outline-none focus:border-orange-500 shadow-xs"
              />
            </div>

            {/* Info Box */}
            <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-900 dark:text-amber-300 text-xs flex items-start gap-3">
              <AlertCircle className="h-5 w-5 shrink-0 text-amber-500 mt-0.5" />
              <div className="leading-relaxed">
                <strong>Warehouse Approval Workflow:</strong> রিকোয়েস্ট সাবমিট করার পর এটি{' '}
                <span className="font-mono font-bold">Stock Requests</span> ট্যাবে{' '}
                <em>Pending Admin Approval</em> হিসেবে থাকবে। Fulfillio ওয়্যারহাউস টিম পার্সেল রিসিভ করে স্ক্যান ও অ্যাপ্রুভ করলে আপনার প্রোডাক্টের স্টক স্বয়ংক্রিয়ভাবে +{requestedQty} বৃদ্ধি পাবে।
              </div>
            </div>

            {/* Action Buttons */}
            <div className="pt-3 border-t border-slate-100 dark:border-white/10 flex items-center justify-end gap-3">
              <Link
                href="/merchant/products"
                className="px-5 py-2.5 rounded-xl bg-slate-100 dark:bg-navy-800 hover:bg-slate-200 dark:hover:bg-navy-700 text-slate-700 dark:text-slate-300 text-xs font-semibold transition-colors"
              >
                Cancel
              </Link>
              <button
                type="submit"
                disabled={isSubmitting || !selectedProduct}
                className="px-6 py-2.5 rounded-xl bg-orange-600 hover:bg-orange-500 disabled:opacity-50 text-white text-xs font-bold transition-all shadow-md shadow-orange-500/20 flex items-center gap-2 cursor-pointer active:scale-95"
              >
                <ArrowUpRight className="h-4 w-4" />
                <span>Submit Stock Request (+{requestedQty} Units)</span>
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
