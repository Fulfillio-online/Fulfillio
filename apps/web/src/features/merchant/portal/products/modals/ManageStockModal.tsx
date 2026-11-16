'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import {
  X,
  Layers,
  AlertCircle,
  ArrowUpRight,
  RotateCcw,
  Package,
  Truck,
  MapPin,
  CheckCircle2,
  Building2,
  FileText,
} from 'lucide-react';
import { MerchantProductItem } from '../../types';
import { StockRequestType } from '../types';

export interface SubmitStockRequestPayload {
  productId: string;
  type: StockRequestType;
  requestedQty: number;
  note?: string;
  reason?: string;
  destination?: string;
  carrier?: string;
  trackingRef?: string;
}

interface ManageStockModalProps {
  isOpen: boolean;
  product: MerchantProductItem | null;
  products?: MerchantProductItem[];
  initialMode?: StockRequestType;
  onClose: () => void;
  onSubmitRequest: (payload: SubmitStockRequestPayload) => void;
}

const RETURN_REASONS = [
  'Shop / Retail Demand (দোকানের সরাসরি বিক্রির জন্য স্টক প্রত্যাহার)',
  'Defective / QC Inspection (ত্রুটিপূর্ণ পণ্য ওয়্যারহাউস থেকে ফেরত)',
  'Seasonal Pullout (মৌসুম শেষে অবিক্রিত পণ্য আউটলেটে স্থানান্তর)',
  'Outlet Relocation (অন্য শো-রুমে স্থানান্তর)',
  'Other Custom Reason (অন্যান্য কারণ)',
];

const COURIER_OPTIONS = [
  'Steadfast Courier Consignment',
  'Pathao Logistics',
  'RedX Parcel',
  'SA Paribahan Cargo',
  'Merchant Own Delivery Van / Agent',
];

export function ManageStockModal({
  isOpen,
  product,
  products = [],
  initialMode = 'RESTOCK',
  onClose,
  onSubmitRequest,
}: ManageStockModalProps) {
  const [activeProduct, setActiveProduct] = useState<MerchantProductItem | null>(product);
  const [activeMode, setActiveMode] = useState<StockRequestType>(initialMode);
  const [restockQty, setRestockQty] = useState(50);
  const [carrier, setCarrier] = useState(COURIER_OPTIONS[0]);
  const [trackingRef, setTrackingRef] = useState('');
  const [restockNote, setRestockNote] = useState('');

  // Return mode states
  const [returnQty, setReturnQty] = useState(10);
  const [returnReason, setReturnReason] = useState(RETURN_REASONS[0]);
  const [customReason, setCustomReason] = useState('');
  const [destination, setDestination] = useState('Dhanmondi Branch, Road 27, Dhaka');
  const [recipientContact, setRecipientContact] = useState('01711-000000 (Outlet Manager)');
  const [returnNote, setReturnNote] = useState('');

  useEffect(() => {
    if (isOpen) {
      const target = product || (products.length > 0 ? products[0] : null);
      setActiveProduct(target);
      setActiveMode(initialMode || 'RESTOCK');
      if (target) {
        setReturnQty(Math.min(10, Math.max(1, target.stock)));
      }
    }
  }, [isOpen, initialMode, product, products]);

  if (!isOpen || !activeProduct) return null;

  const currentStock = activeProduct.stock;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (activeMode === 'RESTOCK') {
      if (restockQty <= 0) return;
      onSubmitRequest({
        productId: activeProduct.id,
        type: 'RESTOCK',
        requestedQty: restockQty,
        carrier,
        trackingRef: trackingRef.trim() || undefined,
        note: restockNote.trim() || undefined,
      });
    } else {
      if (returnQty <= 0) return;
      if (returnQty > currentStock) {
        alert(`Cannot withdraw more than current warehouse stock (${currentStock} units).`);
        return;
      }
      const finalReason =
        returnReason.startsWith('Other') && customReason.trim()
          ? customReason.trim()
          : returnReason;

      onSubmitRequest({
        productId: activeProduct.id,
        type: 'RETURN',
        requestedQty: returnQty,
        reason: finalReason,
        destination: `${destination.trim()}${
          recipientContact.trim() ? ` (Contact: ${recipientContact.trim()})` : ''
        }`,
        note: returnNote.trim() || undefined,
        trackingRef: `RET-${Date.now().toString().slice(-6)}`,
      });
    }

    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 cursor-pointer"
      onClick={onClose}
    >
      <div
        className="bg-white dark:bg-navy-900 border border-slate-200 dark:border-white/10 rounded-2xl w-full max-w-lg p-5 sm:p-6 space-y-4 shadow-2xl animate-in zoom-in-95 duration-200 cursor-default max-h-[92vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-200 dark:border-white/10 pb-3">
          <div className="flex items-center gap-2.5">
            <div
              className={`h-9 w-9 rounded-lg flex items-center justify-center ${
                activeMode === 'RESTOCK'
                  ? 'bg-emerald-500/10 border border-emerald-500/20 text-emerald-500'
                  : 'bg-orange-500/10 border border-orange-500/20 text-orange-500'
              }`}
            >
              {activeMode === 'RESTOCK' ? (
                <ArrowUpRight className="h-5 w-5" />
              ) : (
                <RotateCcw className="h-5 w-5" />
              )}
            </div>
            <div>
              <h3 className="font-bold text-base text-navy-900 dark:text-white">
                {activeMode === 'RESTOCK'
                  ? 'Inbound Restock Request'
                  : 'Product Return & Recall Request'}
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {activeMode === 'RESTOCK'
                  ? 'Send additional inventory to warehouse dock for intake & slotting.'
                  : 'Withdraw inventory from warehouse back to your shop or physical outlet.'}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-navy-800 transition-colors cursor-pointer"
            aria-label="Close"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Tab Switcher: Restock vs Return */}
        <div className="grid grid-cols-2 gap-2 p-1 bg-slate-100 dark:bg-navy-950 rounded-xl border border-slate-200/80 dark:border-white/10 text-xs font-semibold">
          <button
            type="button"
            onClick={() => setActiveMode('RESTOCK')}
            className={`py-2 px-3 rounded-lg flex items-center justify-center gap-2 transition-all cursor-pointer ${
              activeMode === 'RESTOCK'
                ? 'bg-white dark:bg-navy-800 text-emerald-600 dark:text-emerald-400 shadow-sm font-bold border border-emerald-500/20'
                : 'text-slate-500 dark:text-slate-400 hover:text-navy-900 dark:hover:text-white'
            }`}
          >
            <ArrowUpRight className="h-4 w-4" />
            <span>Inbound Restock (+Stock)</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveMode('RETURN')}
            className={`py-2 px-3 rounded-lg flex items-center justify-center gap-2 transition-all cursor-pointer ${
              activeMode === 'RETURN'
                ? 'bg-white dark:bg-navy-800 text-orange-600 dark:text-orange-400 shadow-sm font-bold border border-orange-500/20'
                : 'text-slate-500 dark:text-slate-400 hover:text-navy-900 dark:hover:text-white'
            }`}
          >
            <RotateCcw className="h-4 w-4" />
            <span>Product Return / Recall (-Stock)</span>
          </button>
        </div>

        {/* Product Selector Dropdown if multiple products exist */}
        {products.length > 1 && (
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Select Product:
            </label>
            <select
              value={activeProduct.id}
              onChange={(e) => {
                const found = products.find((p) => p.id === e.target.value);
                if (found) {
                  setActiveProduct(found);
                  setReturnQty(Math.min(10, Math.max(1, found.stock)));
                }
              }}
              className="w-full px-3 py-2 bg-slate-50 dark:bg-navy-950 border border-slate-200 dark:border-white/10 rounded-xl text-xs font-semibold text-navy-900 dark:text-white focus:outline-none focus:border-orange-500 cursor-pointer"
            >
              {products.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.title} ({p.sku}) — Stock: {p.stock} pcs
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Product summary card */}
        <div className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 dark:bg-navy-950 border border-slate-200 dark:border-white/10">
          <div className="relative h-12 w-12 rounded-lg bg-slate-100 dark:bg-navy-800 border border-slate-200 dark:border-white/10 overflow-hidden shrink-0 flex items-center justify-center">
            {activeProduct.imageUrl ? (
              activeProduct.imageUrl.startsWith('data:') ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={activeProduct.imageUrl}
                  alt={activeProduct.title}
                  className="h-full w-full object-cover"
                />
              ) : (
                <Image
                  src={activeProduct.imageUrl}
                  alt={activeProduct.title}
                  fill
                  unoptimized={true}
                  sizes="48px"
                  className="object-cover"
                />
              )
            ) : (
              <Package className="h-6 w-6 text-slate-500" />
            )}
          </div>
          <div className="min-w-0 flex-1">
            <h4 className="font-semibold text-navy-900 dark:text-slate-200 text-xs sm:text-sm truncate">
              {activeProduct.title}
            </h4>
            <div className="flex items-center gap-2 mt-0.5 text-xs">
              <span className="font-mono text-[11px] text-slate-500 dark:text-slate-400">
                {activeProduct.sku}
              </span>
              <span className="text-slate-400">•</span>
              <span className="text-slate-600 dark:text-slate-300">
                Current Stock:{' '}
                <strong className="text-emerald-600 dark:text-emerald-400 font-mono">
                  {currentStock}
                </strong>{' '}
                units
              </span>
              {activeProduct.bin && (
                <>
                  <span className="text-slate-400">•</span>
                  <span className="text-slate-500 font-mono text-[11px]">
                    Bin: {activeProduct.bin}
                  </span>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {activeMode === 'RESTOCK' ? (
            /* ========================================================= */
            /* 1. RESTOCK FORM                                           */
            /* ========================================================= */
            <>
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Inbound Restock Quantity to Add <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <input
                    type="number"
                    min="1"
                    required
                    value={restockQty}
                    onChange={(e) => setRestockQty(Math.max(1, Number(e.target.value) || 1))}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-navy-950 border border-slate-200 dark:border-white/10 rounded-lg text-sm font-bold text-navy-900 dark:text-white focus:outline-none focus:border-emerald-500"
                    placeholder="50"
                  />
                  <span className="absolute right-3 top-2 text-xs text-slate-500">
                    units
                  </span>
                </div>
                <div className="flex gap-2 mt-2">
                  {[25, 50, 100, 250].map((preset) => (
                    <button
                      key={preset}
                      type="button"
                      onClick={() => setRestockQty(preset)}
                      className="px-2.5 py-1 text-xs rounded bg-slate-100 dark:bg-navy-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-navy-700 hover:text-navy-900 dark:hover:text-white transition-colors cursor-pointer font-mono"
                    >
                      +{preset}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Carrier / Logistics Partner
                  </label>
                  <select
                    value={carrier}
                    onChange={(e) => setCarrier(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-navy-950 border border-slate-200 dark:border-white/10 rounded-lg text-xs text-navy-900 dark:text-white focus:outline-none focus:border-emerald-500"
                  >
                    {COURIER_OPTIONS.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Consignment / Tracking Ref (Optional)
                  </label>
                  <input
                    type="text"
                    value={trackingRef}
                    onChange={(e) => setTrackingRef(e.target.value)}
                    placeholder="e.g. STDF-8839201"
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-navy-950 border border-slate-200 dark:border-white/10 rounded-lg text-xs text-navy-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Supplier / Batch Reference Notes (Optional)
                </label>
                <input
                  type="text"
                  value={restockNote}
                  onChange={(e) => setRestockNote(e.target.value)}
                  placeholder="e.g. Winter batch #402 from Gazipur factory"
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-navy-950 border border-slate-200 dark:border-white/10 rounded-lg text-xs text-navy-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-emerald-500"
                />
              </div>

              {/* Notice */}
              <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-xs text-emerald-800 dark:text-emerald-300 flex items-start gap-2.5">
                <AlertCircle className="h-4 w-4 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                <div className="leading-relaxed">
                  <strong className="block font-semibold mb-0.5">
                    Warehouse Inbound Protocol:
                  </strong>
                  Physical cargo arriving at warehouse dock will be verified and slotted by the admin. Once approved, live stock will update automatically.
                </div>
              </div>
            </>
          ) : (
            /* ========================================================= */
            /* 2. RETURN / RECALL FORM                                   */
            /* ========================================================= */
            <>
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                    Units to Withdraw / Return <span className="text-rose-500">*</span>
                  </label>
                  <span className="text-[11px] text-slate-500">
                    Max Available: <strong className="font-mono text-orange-600 dark:text-orange-400">{currentStock}</strong>
                  </span>
                </div>
                <div className="relative">
                  <input
                    type="number"
                    min="1"
                    max={Math.max(1, currentStock)}
                    required
                    value={returnQty}
                    onChange={(e) =>
                      setReturnQty(
                        Math.min(
                          currentStock,
                          Math.max(1, Number(e.target.value) || 1)
                        )
                      )
                    }
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-navy-950 border border-slate-200 dark:border-white/10 rounded-lg text-sm font-bold text-navy-900 dark:text-white focus:outline-none focus:border-orange-500"
                    placeholder="10"
                  />
                  <span className="absolute right-3 top-2 text-xs text-slate-500">
                    units
                  </span>
                </div>
                <div className="flex gap-2 mt-2">
                  {[5, 10, 25].filter((n) => n <= currentStock).map((preset) => (
                    <button
                      key={preset}
                      type="button"
                      onClick={() => setReturnQty(preset)}
                      className="px-2.5 py-1 text-xs rounded bg-slate-100 dark:bg-navy-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-navy-700 hover:text-navy-900 dark:hover:text-white transition-colors cursor-pointer font-mono"
                    >
                      {preset} units
                    </button>
                  ))}
                  {currentStock > 0 && (
                    <button
                      type="button"
                      onClick={() => setReturnQty(currentStock)}
                      className="px-2.5 py-1 text-xs rounded bg-orange-500/10 text-orange-600 dark:text-orange-400 hover:bg-orange-500/20 font-semibold transition-colors cursor-pointer font-mono"
                    >
                      All ({currentStock})
                    </button>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Reason for Return / Recall <span className="text-rose-500">*</span>
                </label>
                <select
                  value={returnReason}
                  onChange={(e) => setReturnReason(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-navy-950 border border-slate-200 dark:border-white/10 rounded-lg text-xs text-navy-900 dark:text-white focus:outline-none focus:border-orange-500"
                >
                  {RETURN_REASONS.map((r) => (
                    <option key={r} value={r}>
                      {r}
                    </option>
                  ))}
                </select>
                {returnReason.startsWith('Other') && (
                  <input
                    type="text"
                    value={customReason}
                    onChange={(e) => setCustomReason(e.target.value)}
                    placeholder="Please specify the reason..."
                    className="w-full mt-2 px-3 py-2 bg-slate-50 dark:bg-navy-950 border border-slate-200 dark:border-white/10 rounded-lg text-xs text-navy-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-orange-500"
                  />
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Return Destination Outlet / Address <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={destination}
                    onChange={(e) => setDestination(e.target.value)}
                    placeholder="e.g. Dhanmondi Branch, Road 27, Dhaka"
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-navy-950 border border-slate-200 dark:border-white/10 rounded-lg text-xs text-navy-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-orange-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Outlet Contact Person & Phone
                  </label>
                  <input
                    type="text"
                    value={recipientContact}
                    onChange={(e) => setRecipientContact(e.target.value)}
                    placeholder="e.g. 01711-000000 (Store Manager)"
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-navy-950 border border-slate-200 dark:border-white/10 rounded-lg text-xs text-navy-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-orange-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Additional Notes (Optional)
                </label>
                <input
                  type="text"
                  value={returnNote}
                  onChange={(e) => setReturnNote(e.target.value)}
                  placeholder="e.g. Please pick up and pack before weekend rush"
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-navy-950 border border-slate-200 dark:border-white/10 rounded-lg text-xs text-navy-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-orange-500"
                />
              </div>

              {/* Notice */}
              <div className="p-3 rounded-xl bg-orange-500/10 border border-orange-500/20 text-xs text-orange-800 dark:text-orange-300 flex items-start gap-2.5">
                <AlertCircle className="h-4 w-4 text-orange-600 dark:text-orange-400 shrink-0 mt-0.5" />
                <div className="leading-relaxed">
                  <strong className="block font-semibold mb-0.5">
                    Warehouse Dispatch & Gate Pass Policy:
                  </strong>
                  When admin approves your return request, the warehouse will pick and pack{' '}
                  <span className="font-bold text-orange-600 dark:text-orange-300">
                    {returnQty} units
                  </span>
                  , issue an official <strong>Delivery Gate Pass</strong>, and dispatch to your specified address. Stock will be deducted accordingly.
                </div>
              </div>
            </>
          )}

          {/* Actions */}
          <div className="pt-2 flex items-center justify-end gap-2.5 border-t border-slate-200 dark:border-white/10">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-lg bg-slate-100 dark:bg-navy-800 hover:bg-slate-200 dark:hover:bg-navy-700 text-slate-700 dark:text-slate-300 text-xs font-semibold transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className={`px-5 py-2 rounded-lg text-white text-xs font-bold transition-all cursor-pointer shadow-md flex items-center gap-1.5 ${
                activeMode === 'RESTOCK'
                  ? 'bg-emerald-600 hover:bg-emerald-500 shadow-emerald-500/20'
                  : 'bg-orange-600 hover:bg-orange-500 shadow-orange-500/20'
              }`}
            >
              {activeMode === 'RESTOCK' ? (
                <>
                  <ArrowUpRight className="h-3.5 w-3.5" />
                  <span>Submit Restock for Admin Approval</span>
                </>
              ) : (
                <>
                  <RotateCcw className="h-3.5 w-3.5" />
                  <span>Submit Return Request ({returnQty} units)</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
