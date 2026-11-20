'use client';

import React, { useState, useEffect, useMemo } from 'react';
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
  Check,
} from 'lucide-react';
import { MerchantProductItem } from '../../types';
import { StockRequestType } from '../types';

export interface SubmitStockRequestPayload {
  productId: string;
  type: StockRequestType;
  requestedQty: number;
  variantId?: string;
  variantSku?: string;
  color?: string;
  size?: string;
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
  
  // Variant selection states
  const [selectedColor, setSelectedColor] = useState<string>('');
  const [selectedSize, setSelectedSize] = useState<string>('');

  // Restock mode states
  const [restockQty, setRestockQty] = useState(50);
  const [carrier, setCarrier] = useState(COURIER_OPTIONS[0]);
  const [trackingRef, setTrackingRef] = useState('');
  const [restockNote, setRestockNote] = useState('');

  // Return mode states
  const [returnQty, setReturnQty] = useState(1);
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
    }
  }, [isOpen, initialMode, product, products]);

  // Available colors
  const availableColors = useMemo(() => {
    if (!activeProduct) return [];
    if (activeProduct.colors && activeProduct.colors.length > 0) {
      return activeProduct.colors.map((c) => c.name);
    }
    if (activeProduct.variantsList && activeProduct.variantsList.length > 0) {
      return Array.from(
        new Set(
          activeProduct.variantsList
            .map((v) => v.color)
            .filter((c): c is string => Boolean(c && c.trim()))
        )
      );
    }
    return [];
  }, [activeProduct]);

  // When activeProduct changes, initialize selectedColor
  useEffect(() => {
    if (availableColors.length > 0) {
      if (!selectedColor || !availableColors.includes(selectedColor)) {
        setSelectedColor(availableColors[0]);
      }
    } else {
      setSelectedColor('');
    }
  }, [availableColors, selectedColor]);

  // Available sizes for selectedColor
  const availableSizes = useMemo(() => {
    if (!activeProduct) return [];
    if (activeProduct.variantsList && activeProduct.variantsList.length > 0) {
      const filtered = selectedColor
        ? activeProduct.variantsList.filter(
            (v) => (v.color || '').toLowerCase() === selectedColor.toLowerCase()
          )
        : activeProduct.variantsList;
      return Array.from(
        new Set(
          filtered
            .map((v) => v.size || v.attributeValue || '')
            .filter((s): s is string => Boolean(s && s.trim()))
        )
      );
    }
    if (activeProduct.sizes && activeProduct.sizes.length > 0) {
      return activeProduct.sizes;
    }
    return [];
  }, [activeProduct, selectedColor]);

  // When availableSizes change, initialize selectedSize
  useEffect(() => {
    if (availableSizes.length > 0) {
      if (!selectedSize || !availableSizes.includes(selectedSize)) {
        setSelectedSize(availableSizes[0]);
      }
    } else {
      setSelectedSize('');
    }
  }, [availableSizes, selectedSize]);

  // Matched variant based on chosen color & size
  const matchedVariant = useMemo(() => {
    if (!activeProduct?.variantsList || activeProduct.variantsList.length === 0) return null;
    return (
      activeProduct.variantsList.find((v) => {
        const matchColor =
          !selectedColor || (v.color || '').toLowerCase() === selectedColor.toLowerCase();
        const matchSize =
          !selectedSize || (v.size || '').toLowerCase() === selectedSize.toLowerCase();
        return matchColor && matchSize;
      }) || null
    );
  }, [activeProduct, selectedColor, selectedSize]);

  // Effective warehouse stock of the selected variant (or whole product)
  const currentVariantStock = useMemo(() => {
    if (!activeProduct) return 0;
    if (matchedVariant !== null) return matchedVariant.stock;
    return activeProduct.stock;
  }, [activeProduct, matchedVariant]);

  // Adjust returnQty whenever variant stock changes
  useEffect(() => {
    if (currentVariantStock > 0) {
      setReturnQty((prev) => Math.min(prev, currentVariantStock));
    } else {
      setReturnQty(0);
    }
  }, [currentVariantStock]);

  if (!isOpen || !activeProduct) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (activeMode === 'RESTOCK') {
      if (restockQty <= 0) return;
      onSubmitRequest({
        productId: activeProduct.id,
        type: 'RESTOCK',
        requestedQty: restockQty,
        variantId: matchedVariant?.id,
        variantSku: matchedVariant?.variantSku || activeProduct.sku,
        color: selectedColor || undefined,
        size: selectedSize || undefined,
        carrier,
        trackingRef: trackingRef.trim() || undefined,
        note: restockNote.trim() || undefined,
      });
    } else {
      if (returnQty <= 0) return;
      if (returnQty > currentVariantStock) {
        alert(
          `Cannot return more than available warehouse stock (${currentVariantStock} units) for ${selectedColor} / ${selectedSize}.`
        );
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
        variantId: matchedVariant?.id,
        variantSku: matchedVariant?.variantSku || activeProduct.sku,
        color: selectedColor || undefined,
        size: selectedSize || undefined,
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
                }
              }}
              className="w-full px-3 py-2 bg-slate-50 dark:bg-navy-950 border border-slate-200 dark:border-white/10 rounded-xl text-xs font-semibold text-navy-900 dark:text-white focus:outline-none focus:border-orange-500 cursor-pointer"
            >
              {products.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.title} ({p.sku}) — Total Stock: {p.stock} pcs
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Product summary card */}
        <div className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 dark:bg-navy-950 border border-slate-200 dark:border-white/10">
          <div className="relative h-12 w-12 rounded-lg bg-slate-100 dark:bg-navy-800 border border-slate-200 dark:border-white/10 overflow-hidden shrink-0 flex items-center justify-center">
            {activeProduct.imageUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={activeProduct.imageUrl}
                alt={activeProduct.title}
                className="h-full w-full object-cover"
              />
            ) : (
              <Package className="h-6 w-6 text-slate-500" />
            )}
          </div>
          <div className="min-w-0 flex-1">
            <h4 className="font-semibold text-navy-900 dark:text-slate-200 text-xs sm:text-sm truncate">
              {activeProduct.title}
            </h4>
            <div className="flex items-center gap-2 mt-0.5 text-xs flex-wrap">
              <span className="font-mono text-[11px] text-slate-500 dark:text-slate-400">
                {activeProduct.sku}
              </span>
              <span className="text-slate-400">•</span>
              <span className="text-slate-600 dark:text-slate-300">
                Total Stock:{' '}
                <strong className="text-emerald-600 dark:text-emerald-400 font-mono">
                  {activeProduct.stock}
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

        {/* Variant Specific Selectors (Color & Size) */}
        {(availableColors.length > 0 || availableSizes.length > 0) && (
          <div className="p-3.5 rounded-xl bg-slate-50/70 dark:bg-navy-950/70 border border-slate-200 dark:border-white/10 space-y-3">
            <div className="flex items-center justify-between text-xs font-bold text-navy-900 dark:text-slate-200">
              <span>Select Color &amp; Size Variant:</span>
              <span className="text-[11px] text-slate-500 font-normal">
                {activeMode === 'RESTOCK' ? 'Target for restock' : 'Target for return'}
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* Color Selector */}
              {availableColors.length > 0 && (
                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                    Color:
                  </label>
                  <select
                    value={selectedColor}
                    onChange={(e) => setSelectedColor(e.target.value)}
                    className="w-full px-2.5 py-1.5 bg-white dark:bg-navy-900 border border-slate-200 dark:border-white/10 rounded-lg text-xs font-semibold text-navy-900 dark:text-white focus:outline-none focus:border-orange-500 cursor-pointer"
                  >
                    {availableColors.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Size Selector */}
              {availableSizes.length > 0 && (
                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                    Size / Spec:
                  </label>
                  <select
                    value={selectedSize}
                    onChange={(e) => setSelectedSize(e.target.value)}
                    className="w-full px-2.5 py-1.5 bg-white dark:bg-navy-900 border border-slate-200 dark:border-white/10 rounded-lg text-xs font-semibold text-navy-900 dark:text-white focus:outline-none focus:border-orange-500 cursor-pointer"
                  >
                    {availableSizes.map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>

            {/* Target Variant SKU & Live Stock Status Card */}
            <div className="p-2.5 rounded-lg bg-white dark:bg-navy-900 border border-slate-200/80 dark:border-white/10 flex items-center justify-between text-xs">
              <div>
                <span className="text-[10px] text-slate-400 uppercase font-semibold block">
                  Target Variant SKU
                </span>
                <span className="font-mono text-emerald-600 dark:text-emerald-400 font-bold block mt-0.5">
                  {matchedVariant?.variantSku || activeProduct.sku}
                </span>
              </div>
              <div className="text-right">
                <span className="text-[10px] text-slate-400 uppercase font-semibold block">
                  Available Warehouse Stock
                </span>
                <span
                  className={`font-mono font-extrabold text-sm block mt-0.5 ${
                    currentVariantStock > 0
                      ? 'text-emerald-600 dark:text-emerald-400'
                      : 'text-rose-500 dark:text-rose-400'
                  }`}
                >
                  {currentVariantStock} units
                </span>
              </div>
            </div>
          </div>
        )}

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
                  Physical cargo arriving at warehouse dock will be verified and slotted by the admin for SKU{' '}
                  <span className="font-mono font-bold text-emerald-700 dark:text-emerald-300">
                    {matchedVariant?.variantSku || activeProduct.sku}
                  </span>
                  . Once approved, live stock will update automatically.
                </div>
              </div>
            </>
          ) : (
            /* ========================================================= */
            /* 2. RETURN / RECALL FORM                                   */
            /* ========================================================= */
            <>
              {currentVariantStock <= 0 ? (
                <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-400 text-xs space-y-1">
                  <div className="flex items-center gap-2 font-bold">
                    <AlertCircle className="h-4 w-4 shrink-0" />
                    <span>No Warehouse Stock Available for this Variant</span>
                  </div>
                  <p className="text-[11px] leading-relaxed text-slate-600 dark:text-slate-400">
                    নির্বাচিত ভ্যারিয়েন্টে (<strong className="text-navy-900 dark:text-white">{selectedColor} · {selectedSize}</strong>) বর্তমানে ওয়্যারহাউসে কোনো পণ্য নেই (স্টক ০)। পণ্য ফেরত নেওয়ার পূর্বে ওয়্যারহাউসে পণ্য মজুদ থাকতে হবে।
                  </p>
                </div>
              ) : (
                <>
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                        Units to Withdraw / Return <span className="text-rose-500">*</span>
                      </label>
                      <span className="text-[11px] text-slate-500">
                        Available for Variant: <strong className="font-mono text-orange-600 dark:text-orange-400">{currentVariantStock}</strong>
                      </span>
                    </div>
                    <div className="relative">
                      <input
                        type="number"
                        min="1"
                        max={Math.max(1, currentVariantStock)}
                        required
                        value={returnQty}
                        onChange={(e) =>
                          setReturnQty(
                            Math.min(
                              currentVariantStock,
                              Math.max(1, Number(e.target.value) || 1)
                            )
                          )
                        }
                        className="w-full px-3 py-2 bg-slate-50 dark:bg-navy-950 border border-slate-200 dark:border-white/10 rounded-lg text-sm font-bold text-navy-900 dark:text-white focus:outline-none focus:border-orange-500"
                        placeholder="1"
                      />
                      <span className="absolute right-3 top-2 text-xs text-slate-500">
                        units
                      </span>
                    </div>
                    <div className="flex gap-2 mt-2">
                      {[1, 5, 10].filter((n) => n <= currentVariantStock).map((preset) => (
                        <button
                          key={preset}
                          type="button"
                          onClick={() => setReturnQty(preset)}
                          className="px-2.5 py-1 text-xs rounded bg-slate-100 dark:bg-navy-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-navy-700 hover:text-navy-900 dark:hover:text-white transition-colors cursor-pointer font-mono"
                        >
                          {preset} unit{preset > 1 ? 's' : ''}
                        </button>
                      ))}
                      {currentVariantStock > 0 && (
                        <button
                          type="button"
                          onClick={() => setReturnQty(currentVariantStock)}
                          className="px-2.5 py-1 text-xs rounded bg-orange-500/10 text-orange-600 dark:text-orange-400 hover:bg-orange-500/20 font-semibold transition-colors cursor-pointer font-mono"
                        >
                          All ({currentVariantStock})
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
                        Outlet Contact Person &amp; Phone
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
                        Warehouse Dispatch &amp; Gate Pass Policy:
                      </strong>
                      When submitted, the warehouse is dispatched to pack{' '}
                      <span className="font-bold text-orange-600 dark:text-orange-300">
                        {returnQty} units
                      </span>{' '}
                      of SKU <strong className="font-mono">{matchedVariant?.variantSku || activeProduct.sku}</strong>, issue an official <strong>Delivery Gate Pass</strong>, and dispatch to your specified address. Stock is deducted immediately.
                    </div>
                  </div>
                </>
              )}
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
              disabled={activeMode === 'RETURN' && currentVariantStock <= 0}
              className={`px-5 py-2 rounded-lg text-white text-xs font-bold transition-all cursor-pointer shadow-md flex items-center gap-1.5 disabled:opacity-50 disabled:cursor-not-allowed ${
                activeMode === 'RESTOCK'
                  ? 'bg-emerald-600 hover:bg-emerald-500 shadow-emerald-500/20'
                  : 'bg-orange-600 hover:bg-orange-500 shadow-orange-500/20'
              }`}
            >
              {activeMode === 'RESTOCK' ? (
                <>
                  <ArrowUpRight className="h-3.5 w-3.5" />
                  <span>Submit Restock for Admin Approval (+{restockQty})</span>
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
