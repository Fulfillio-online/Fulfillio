'use client';

import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import {
  X,
  Package,
  User,
  Phone,
  MapPin,
  Truck,
  CreditCard,
  FileText,
  DollarSign,
  AlertCircle,
  CheckCircle,
  ChevronDown,
} from 'lucide-react';
import { MerchantOrderItem, OrderLineItem, ResellerMemo } from '../../types';
import { OrderCartItem } from '../lib/orderCartStorage';

interface QuickOrderCheckoutModalProps {
  isOpen: boolean;
  onClose: () => void;
  cartItems: OrderCartItem[];
  memos: ResellerMemo[];
  merchantStoreName: string;
  merchantCode: string;
  initialMemoCode?: string;
  baseHandlingFee?: number;
  onUpdateItemPrice?: (id: string, unitPrice: number) => void;
  onOrderPlaced: (
    newOrder: MerchantOrderItem,
    itemsToDeduct: { productId: string; qty: number; variantSku?: string }[]
  ) => void;
  onTriggerToast: (msg: string) => void;
}

export function QuickOrderCheckoutModal({
  isOpen,
  onClose,
  cartItems,
  memos,
  merchantStoreName,
  merchantCode,
  initialMemoCode,
  baseHandlingFee = 45,
  onUpdateItemPrice,
  onOrderPlaced,
  onTriggerToast,
}: QuickOrderCheckoutModalProps) {
  const [mounted, setMounted] = useState(false);
  const [priceOverrides, setPriceOverrides] = useState<Record<string, number>>({});
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [customerAddress, setCustomerAddress] = useState('');
  const [city, setCity] = useState<'Dhaka' | 'Chattogram' | 'Sylhet' | 'Rajshahi' | 'Khulna' | 'Other'>('Dhaka');
  const [courier, setCourier] = useState('');
  const [memoCode, setMemoCode] = useState(() => {
    if (initialMemoCode) return initialMemoCode;
    if (memos && memos.length > 0) {
      const def = memos.find((m) => m.isDefault);
      return def ? def.code : memos[0].code;
    }
    return '';
  });
  const [deliveryFee, setDeliveryFee] = useState(80);
  const [discount, setDiscount] = useState(0);
  const [advancePayment, setAdvancePayment] = useState(0);
  const [advanceMethod, setAdvanceMethod] = useState<'bKash' | 'Nagad' | 'Bank'>('bKash');
  const [advanceTrxId, setAdvanceTrxId] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (isOpen) {
      setPriceOverrides({});
    }
  }, [isOpen]);

  useEffect(() => {
    if (initialMemoCode) {
      setMemoCode(initialMemoCode);
    } else if (memos && memos.length > 0) {
      if (!memoCode || !memos.some((m) => m.code === memoCode)) {
        const def = memos.find((m) => m.isDefault);
        setMemoCode(def ? def.code : memos[0].code);
      }
    } else {
      setMemoCode('');
    }
  }, [initialMemoCode, memos, memoCode]);

  useEffect(() => {
    // Auto-update delivery fee when city changes
    if (city === 'Dhaka') {
      setDeliveryFee(80);
    } else {
      setDeliveryFee(120);
    }
  }, [city]);

  if (!isOpen || !mounted) return null;

  const effectiveCartItems = cartItems.map((it) => ({
    ...it,
    unitPrice:
      priceOverrides[it.id] !== undefined ? priceOverrides[it.id] : it.unitPrice,
    declaredPrice: it.declaredPrice ?? it.unitPrice,
  }));

  const handleItemPriceEdit = (id: string, nextPrice: number) => {
    const safePrice = Math.max(0, Number(nextPrice) || 0);
    setPriceOverrides((prev) => ({ ...prev, [id]: safePrice }));
    onUpdateItemPrice?.(id, safePrice);
  };

  const subtotal = effectiveCartItems.reduce((acc, it) => acc + it.unitPrice * it.qty, 0);
  const baseSubtotal = effectiveCartItems.reduce((acc, it) => acc + it.declaredPrice * it.qty, 0);
  const extraMarkup = subtotal - baseSubtotal;
  const totalItemCount = effectiveCartItems.reduce((acc, it) => acc + it.qty, 0);
  const orderTotal = Math.max(0, subtotal + deliveryFee - discount);
  const codAmount = Math.max(0, orderTotal - advancePayment);
  const estHandlingFee = Math.max(0, Number(baseHandlingFee) || 0);
  const estPackagingFee = 5;
  const estNetEarning = Math.max(0, orderTotal - deliveryFee - estHandlingFee - estPackagingFee);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const newErrors: Record<string, string> = {};

    if (!customerName.trim()) {
      newErrors.customerName = 'Customer name is required';
    }
    if (!customerPhone.trim()) {
      newErrors.customerPhone = 'Phone number is required';
    } else if (customerPhone.replace(/[^0-9]/g, '').length < 10) {
      newErrors.customerPhone = 'Enter a valid 11-digit phone number';
    }
    if (!customerAddress.trim()) {
      newErrors.customerAddress = 'Delivery address is required';
    }

    if (!memos || memos.length === 0) {
      onTriggerToast('Cannot create order: You must create at least one custom Memo Template in Memo Designer first.');
      return;
    }

    if (!memoCode || !memoCode.trim()) {
      newErrors.memoCode = 'Please select a custom memo template';
    } else if (!memos.some((m) => m.code === memoCode)) {
      newErrors.memoCode = 'Selected memo is invalid. Please select one of your created memos.';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    // Business check: Every item must have accepted warehouse stock & valid selling price
    for (const it of effectiveCartItems) {
      if ((it.maxStock || 0) <= 0 || it.qty <= 0) {
        onTriggerToast(`Cannot create order: "${it.title}" has 0 stock stored in warehouse bins.`);
        return;
      }
      if (!Number.isFinite(it.unitPrice) || it.unitPrice <= 0) {
        onTriggerToast(`Please enter a valid selling price (> ৳0) for "${it.title}".`);
        return;
      }
    }

    setIsSubmitting(true);

    try {
      const generatedId = `ORD-${Math.floor(1000 + Math.random() * 9000)}`;
      const isFullPaid = advancePayment >= orderTotal && orderTotal > 0;
      const isPartialPaid = advancePayment > 0 && advancePayment < orderTotal;
      const paymentStatus: 'Paid' | 'Unpaid' | 'Partial' = isFullPaid
        ? 'Paid'
        : isPartialPaid
        ? 'Partial'
        : 'Unpaid';

      const paymentMethodLabel = isFullPaid
        ? `${advanceMethod} (100% Advance)`
        : isPartialPaid
        ? `Partial (${advanceMethod} Adv + COD)`
        : 'Cash on Delivery';

      const lineItems: OrderLineItem[] = effectiveCartItems.map((it) => ({
        id: it.productId,
        title: it.title,
        variant: it.variantLabel || `${it.color} · ${it.size}`,
        sku: it.sku,
        price: it.unitPrice,
        basePrice: it.declaredPrice,
        quantity: it.qty,
        total: it.unitPrice * it.qty,
        imageUrl: it.imageUrl,
      }));

      const newOrder: MerchantOrderItem = {
        id: generatedId,
        orderNumber: generatedId,
        date: 'Today, Just now',
        customer: customerName.trim(),
        phone: customerPhone.trim(),
        address: `${customerAddress.trim()}, ${city}`,
        city: city,
        productId: effectiveCartItems[0]?.productId || 'p-1',
        items: effectiveCartItems.map((it) => `${it.title} (${it.variantLabel}) x ${it.qty}`).join(', '),
        qty: totalItemCount,
        amount: orderTotal,
        subtotal,
        deliveryFee,
        discount,
        advancePayment,
        codAmount,
        memoCode,
        status: 'PENDING',
        courier,
        paymentMethod: paymentMethodLabel,
        paymentStatus,
        advancePaymentMethod: advancePayment > 0 ? advanceMethod : undefined,
        advanceTrxId: advancePayment > 0 && advanceTrxId ? advanceTrxId.trim() : undefined,
        lineItems,
        timeline: [
          {
            title: 'Order Created from Product Page',
            description: `Quick B2B order created by ${merchantStoreName}. Total items: ${totalItemCount}. COD collection: ৳${codAmount.toLocaleString()}`,
            timestamp: 'Just now',
            isCompleted: true,
          },
        ],
      };

      const itemsToDeduct = effectiveCartItems.map((it) => ({
        productId: it.productId,
        qty: it.qty,
        variantSku: it.sku,
      }));

      onOrderPlaced(newOrder, itemsToDeduct);
      onTriggerToast(`Order #${generatedId} successfully created with ${totalItemCount} item(s)!`);
      onClose();
    } catch (err) {
      console.error(err);
      onTriggerToast('Failed to create order. Please check inputs.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return createPortal(
    <div
      className="fixed inset-0 z-[9999] bg-black/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 overflow-y-auto animate-in fade-in duration-150"
      onClick={onClose}
    >
      <div
        className="bg-white dark:bg-navy-900 border border-slate-200 dark:border-white/10 rounded-2xl w-full max-w-3xl max-h-[92vh] overflow-y-auto p-4 sm:p-6 space-y-5 shadow-2xl animate-in zoom-in-95 duration-150 text-slate-800 dark:text-slate-100 my-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-200 dark:border-white/10 pb-4">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-orange-500/10 border border-orange-500/20 flex items-center justify-center text-orange-600 dark:text-orange-400">
              <Package className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-navy-900 dark:text-white">
                Place Order from Product List
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {cartItems.length} product variant{cartItems.length > 1 ? 's' : ''} ({totalItemCount} unit{totalItemCount > 1 ? 's' : ''}) ready for fulfillment
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-navy-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-navy-800 transition-colors cursor-pointer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Items Summary Strip */}
          <div className="rounded-xl border border-slate-200/80 dark:border-white/10 bg-slate-50 dark:bg-navy-950 p-3.5 space-y-2">
            <div className="flex justify-between items-center text-xs font-bold text-slate-500 uppercase tracking-wider">
              <span>Items in this Order ({cartItems.length})</span>
              <span className="text-navy-900 dark:text-white font-mono">Subtotal: ৳{subtotal.toLocaleString()}</span>
            </div>
            <div className="max-h-44 overflow-y-auto divide-y divide-slate-200/60 dark:divide-white/5 space-y-1.5">
              {effectiveCartItems.map((it) => {
                const markupPerUnit = it.unitPrice - it.declaredPrice;
                return (
                <div key={it.id} className="pt-2 first:pt-0 flex items-center justify-between text-xs gap-3">
                  <div className="flex items-center gap-2 min-w-0">
                    <img
                      src={it.imageUrl || 'https://images.unsplash.com/photo-1556905055-8f358a7a47b2?auto=format&fit=crop&w=100&q=80'}
                      alt={it.title}
                      className="h-8 w-8 rounded-lg object-cover bg-slate-200 dark:bg-navy-800 shrink-0"
                    />
                    <div className="min-w-0">
                      <span className="font-semibold text-navy-900 dark:text-slate-200 truncate block">
                        {it.title}
                      </span>
                      <div className="flex flex-wrap items-center gap-1.5 text-[10px] text-slate-500 dark:text-slate-400">
                        <span>{it.variantLabel || `${it.color} · ${it.size}`} · SKU: {it.sku}</span>
                        <span className="font-mono text-slate-400">Base: ৳{it.declaredPrice.toLocaleString()}</span>
                        {markupPerUnit > 0 && (
                          <span className="px-1.5 py-0.2 rounded bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 font-mono font-bold border border-emerald-500/30">
                            +৳{markupPerUnit.toLocaleString()}/unit
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <div className="relative">
                      <span className="absolute left-2 top-1/2 -translate-y-1/2 text-[10px] font-bold text-slate-400">
                        ৳
                      </span>
                      <input
                        type="number"
                        min="1"
                        step="any"
                        placeholder={String(it.declaredPrice)}
                        value={it.unitPrice === 0 ? '' : it.unitPrice}
                        onChange={(e) => {
                          const raw = e.target.value;
                          handleItemPriceEdit(
                            it.id,
                            raw === '' ? 0 : Math.max(0, Number(raw) || 0)
                          );
                        }}
                        aria-label={`Selling price for ${it.title}`}
                        className="w-20 pl-5 pr-1.5 py-1 rounded-lg border border-slate-200 dark:border-white/15 bg-white dark:bg-navy-900 text-xs font-mono font-bold text-right text-navy-900 dark:text-white focus:outline-none focus:border-orange-500"
                      />
                    </div>
                    <span className="text-[11px] font-mono text-slate-400">× {it.qty}</span>
                    <span className="font-mono font-bold text-navy-900 dark:text-white w-16 text-right tabular-nums">
                      ৳{(it.unitPrice * it.qty).toLocaleString()}
                    </span>
                  </div>
                </div>
                );
              })}
            </div>
          </div>

          {/* Customer Delivery Details */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
              <User className="h-3.5 w-3.5 text-orange-500" />
              <span>Customer Information</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Recipient Full Name *
                </label>
                <div className="relative">
                  <User className="h-3.5 w-3.5 absolute left-3 top-3 text-slate-400" />
                  <input
                    type="text"
                    required
                    value={customerName}
                    onChange={(e) => {
                      setCustomerName(e.target.value);
                      if (errors.customerName) setErrors((prev) => ({ ...prev, customerName: '' }));
                    }}
                    placeholder="e.g. Tariqul Islam"
                    className="w-full pl-9 pr-3 py-2 bg-slate-50 dark:bg-navy-950 border border-slate-200 dark:border-white/10 rounded-xl text-xs text-navy-900 dark:text-white focus:outline-none focus:border-orange-500"
                  />
                </div>
                {errors.customerName && <p className="text-[11px] text-rose-500 mt-0.5">{errors.customerName}</p>}
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Phone Number *
                </label>
                <div className="relative">
                  <Phone className="h-3.5 w-3.5 absolute left-3 top-3 text-slate-400" />
                  <input
                    type="tel"
                    required
                    value={customerPhone}
                    onChange={(e) => {
                      setCustomerPhone(e.target.value);
                      if (errors.customerPhone) setErrors((prev) => ({ ...prev, customerPhone: '' }));
                    }}
                    placeholder="e.g. 01712-345678"
                    className="w-full pl-9 pr-3 py-2 bg-slate-50 dark:bg-navy-950 border border-slate-200 dark:border-white/10 rounded-xl text-xs text-navy-900 dark:text-white focus:outline-none focus:border-orange-500"
                  />
                </div>
                {errors.customerPhone && <p className="text-[11px] text-rose-500 mt-0.5">{errors.customerPhone}</p>}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Delivery Address *
                </label>
                <div className="relative">
                  <MapPin className="h-3.5 w-3.5 absolute left-3 top-3 text-slate-400" />
                  <input
                    type="text"
                    required
                    value={customerAddress}
                    onChange={(e) => {
                      setCustomerAddress(e.target.value);
                      if (errors.customerAddress) setErrors((prev) => ({ ...prev, customerAddress: '' }));
                    }}
                    placeholder="e.g. House 14, Road 7, Dhanmondi"
                    className="w-full pl-9 pr-3 py-2 bg-slate-50 dark:bg-navy-950 border border-slate-200 dark:border-white/10 rounded-xl text-xs text-navy-900 dark:text-white focus:outline-none focus:border-orange-500"
                  />
                </div>
                {errors.customerAddress && <p className="text-[11px] text-rose-500 mt-0.5">{errors.customerAddress}</p>}
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Destination City
                </label>
                <select
                  value={city}
                  onChange={(e) => setCity(e.target.value as any)}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-navy-950 border border-slate-200 dark:border-white/10 rounded-xl text-xs text-navy-900 dark:text-white focus:outline-none focus:border-orange-500 cursor-pointer"
                >
                  <option value="Dhaka">Dhaka (৳80 Fee)</option>
                  <option value="Chattogram">Chattogram (৳120 Fee)</option>
                  <option value="Sylhet">Sylhet (৳120 Fee)</option>
                  <option value="Rajshahi">Rajshahi (৳120 Fee)</option>
                  <option value="Khulna">Khulna (৳120 Fee)</option>
                  <option value="Other">Other District (৳120 Fee)</option>
                </select>
              </div>
            </div>
          </div>

          {/* Courier & Memo Settings */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-slate-100 dark:border-white/5">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Courier Partner
              </label>
              <div className="relative">
                <Truck className="h-3.5 w-3.5 absolute left-3 top-3 text-slate-400" />
                <select
                  value={courier}
                  onChange={(e) => setCourier(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 bg-slate-50 dark:bg-navy-950 border border-slate-200 dark:border-white/10 rounded-xl text-xs text-navy-900 dark:text-white focus:outline-none focus:border-orange-500 cursor-pointer"
                >
                  <option value="">Select Courier (Optional)</option>
                  <option value="Steadfast">Steadfast Courier</option>
                  <option value="Pathao">Pathao Courier</option>
                  <option value="RedX">RedX Logistics</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1 flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <FileText className="h-3.5 w-3.5 text-orange-500" />
                  <span>Branded Memo / Slip Template *</span>
                </span>
                <span className="text-[10px] text-orange-600 dark:text-orange-400 font-normal">
                  Required for print
                </span>
              </label>
              {memos && memos.length > 0 ? (
                <>
                  <div className="relative">
                    <select
                      value={memoCode}
                      onChange={(e) => {
                        setMemoCode(e.target.value);
                        if (errors.memoCode) setErrors((prev) => ({ ...prev, memoCode: '' }));
                      }}
                      className="w-full px-3 py-2 bg-slate-50 dark:bg-navy-950 border border-slate-200 dark:border-white/10 rounded-xl text-xs text-navy-900 dark:text-white focus:outline-none focus:border-orange-500 cursor-pointer font-medium"
                    >
                      {memos.map((m) => (
                        <option key={m.code} value={m.code}>
                          {m.code} — {m.resellerName || m.name || merchantStoreName}
                        </option>
                      ))}
                    </select>
                  </div>
                  {errors.memoCode && <p className="text-[11px] text-rose-500 mt-1">{errors.memoCode}</p>}
                  <p className="text-[10px] text-slate-400 mt-1">
                    The warehouse packing station will print this custom template when packing.
                  </p>
                </>
              ) : (
                <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/25 space-y-2">
                  <div className="flex items-start gap-2 text-xs text-amber-700 dark:text-amber-400">
                    <AlertCircle className="h-4 w-4 shrink-0 mt-0.5 text-amber-600 dark:text-amber-400" />
                    <span>
                      <strong>No Memo Template Found:</strong> You must create at least one custom memo template before placing orders.
                    </span>
                  </div>
                  <a
                    href="/merchant/memos"
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-orange-600 hover:bg-orange-700 text-white font-bold text-xs shadow-xs transition-colors"
                  >
                    <FileText className="h-3.5 w-3.5" />
                    <span>Create Memo Template</span>
                  </a>
                </div>
              )}
            </div>
          </div>

          {/* Pricing & Advance Payment */}
          <div className="p-4 rounded-xl bg-slate-50 dark:bg-navy-950/80 border border-slate-200/80 dark:border-white/10 space-y-3">
            <div className="grid grid-cols-3 gap-3 text-xs">
              <div>
                <label className="block text-[11px] text-slate-500 mb-1">Delivery Fee</label>
                <div className="font-mono font-bold text-navy-900 dark:text-white py-1">
                  ৳{deliveryFee}
                </div>
              </div>

              <div>
                <label className="block text-[11px] text-slate-500 mb-1">Discount (৳)</label>
                <input
                  type="number"
                  min="0"
                  value={discount}
                  onChange={(e) => setDiscount(Math.max(0, parseInt(e.target.value, 10) || 0))}
                  className="w-full px-2.5 py-1 bg-white dark:bg-navy-900 border border-slate-200 dark:border-white/10 rounded-lg text-xs font-mono text-navy-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-[11px] text-slate-500 mb-1">Advance Paid (৳)</label>
                <input
                  type="number"
                  min="0"
                  max={orderTotal}
                  value={advancePayment}
                  onChange={(e) => setAdvancePayment(Math.max(0, parseInt(e.target.value, 10) || 0))}
                  className="w-full px-2.5 py-1 bg-white dark:bg-navy-900 border border-slate-200 dark:border-white/10 rounded-lg text-xs font-mono text-navy-900 dark:text-white"
                />
              </div>
            </div>

            {advancePayment > 0 && (
              <div className="grid grid-cols-2 gap-3 pt-2 border-t border-slate-200/60 dark:border-white/5 text-xs">
                <div>
                  <label className="block text-[11px] text-slate-500 mb-1">Advance Payment Method</label>
                  <select
                    value={advanceMethod}
                    onChange={(e) => setAdvanceMethod(e.target.value as any)}
                    className="w-full px-2 py-1 bg-white dark:bg-navy-900 border border-slate-200 dark:border-white/10 rounded-lg text-xs text-navy-900 dark:text-white"
                  >
                    <option value="bKash">bKash</option>
                    <option value="Nagad">Nagad</option>
                    <option value="Bank">Bank Transfer</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[11px] text-slate-500 mb-1">TrxID / Reference (optional)</label>
                  <input
                    type="text"
                    placeholder="e.g. 9J4K2L8"
                    value={advanceTrxId}
                    onChange={(e) => setAdvanceTrxId(e.target.value)}
                    className="w-full px-2.5 py-1 bg-white dark:bg-navy-900 border border-slate-200 dark:border-white/10 rounded-lg text-xs font-mono text-navy-900 dark:text-white"
                  />
                </div>
              </div>
            )}

            <div className="pt-2 border-t border-slate-200 dark:border-white/10 flex justify-between items-center text-xs">
              <span className="font-semibold text-slate-600 dark:text-slate-300">
                Courier COD to Collect:
              </span>
              <span className="text-base sm:text-lg font-black text-emerald-600 dark:text-emerald-400 font-mono">
                ৳{codAmount.toLocaleString()}
              </span>
            </div>

            {extraMarkup > 0 && (
              <div className="flex justify-between items-center text-[11px] text-emerald-700 dark:text-emerald-300">
                <span>Extra Markup Above Base Price</span>
                <span className="font-mono font-bold">+৳{extraMarkup.toLocaleString()}</span>
              </div>
            )}

            <div className="pt-2 border-t border-slate-200/70 dark:border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-1 text-xs">
              <div>
                <span className="font-bold text-navy-900 dark:text-slate-200 block">
                  Estimated Merchant Net Earning
                </span>
                <span className="text-[10px] font-mono text-slate-400">
                  Invoice ৳{orderTotal.toLocaleString()} − Delivery ৳{deliveryFee} − Handling ৳{estHandlingFee} − Est. Packaging ৳{estPackagingFee}
                </span>
              </div>
              <span className="text-base font-black text-orange-600 dark:text-orange-400 font-mono tabular-nums">
                ৳{estNetEarning.toLocaleString()}
              </span>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-navy-800 text-slate-600 dark:text-slate-300 text-xs font-semibold hover:bg-slate-200 dark:hover:bg-navy-700 transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting || !memos || memos.length === 0}
              className="px-5 py-2.5 rounded-xl bg-orange-600 hover:bg-orange-500 text-white text-xs font-bold shadow-md shadow-orange-500/20 transition-all cursor-pointer flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Package className="h-4 w-4" />
              <span>
                {isSubmitting
                  ? 'Placing Order...'
                  : !memos || memos.length === 0
                  ? 'Create Memo to Place Order'
                  : 'Confirm & Place Order'}
              </span>
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body
  );
}
