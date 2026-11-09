'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import {
  X,
  Package,
  Plus,
  Trash2,
  Sparkles,
  Truck,
  CreditCard,
  AlertCircle,
  CheckCircle2,
  Tag,
  DollarSign,
  HelpCircle,
  Phone,
  MapPin,
  User,
  Layers,
  Palette,
  Check,
} from 'lucide-react';
import { MerchantOrderItem, MerchantProductItem, ResellerMemo, OrderLineItem } from '../../types';
import { ProductThumbnail } from '../../products/components/ProductThumbnail';

interface OrderLineItemDraft {
  rowId: string;
  productId: string;
  variantLabel: string;
  sku: string;
  title: string;
  unitPrice: number;
  qty: number;
  maxStock: number;
  imageUrl?: string;
  selectedColor?: string;
  selectedSize?: string;
  selectedVariantId?: string;
}

interface CreateManualOrderModalProps {
  isOpen: boolean;
  onClose: () => void;
  products: MerchantProductItem[];
  memoList: ResellerMemo[];
  onCreateOrder: (
    order: MerchantOrderItem,
    productIdOrItems?: string | { productId: string; qty: number; variantSku?: string }[],
    qty?: number
  ) => void;
  onTriggerToast: (msg: string) => void;
}

export function getAttributeLabel(productType?: string): string {
  if (productType === 'FASHION') return 'Size';
  if (productType === 'ELECTRONICS') return 'Storage / Spec';
  if (productType === 'BEAUTY') return 'Volume / Shade';
  if (productType === 'GROCERY') return 'Pack Size';
  return 'Variant / Size';
}

export function getAvailableSizesForColor(
  p: MerchantProductItem,
  selectedColorName?: string
): string[] {
  // 1. If color has explicit sizes
  if (selectedColorName && p.colors && p.colors.length > 0) {
    const colorObj = p.colors.find((c) => c.name === selectedColorName);
    if (colorObj?.sizes && colorObj.sizes.length > 0) {
      return colorObj.sizes;
    }
  }

  // 2. If variantsList has matching entries for this color
  if (p.variantsList && p.variantsList.length > 0) {
    const matching = selectedColorName
      ? p.variantsList.filter((v) => !v.color || v.color === selectedColorName)
      : p.variantsList;
    const sizes = matching
      .map((v) => v.size || v.attributeValue)
      .filter((s): s is string => Boolean(s));
    if (sizes.length > 0) {
      return Array.from(new Set(sizes));
    }
  }

  // 3. Fallback to product sizes
  if (p.sizes && p.sizes.length > 0) {
    return p.sizes;
  }

  return [];
}

export function getOptionStock(
  p: MerchantProductItem,
  colorName?: string,
  sizeOrAttr?: string
): number {
  if (!p.variantsList || p.variantsList.length === 0) {
    return p.stock || 0;
  }
  const match = p.variantsList.find((v) => {
    const colorMatches = !colorName || !v.color || v.color === colorName;
    const sizeMatches =
      !sizeOrAttr ||
      v.size === sizeOrAttr ||
      v.attributeValue === sizeOrAttr;
    return colorMatches && sizeMatches;
  });
  return match ? match.stock : p.stock || 0;
}

export function resolveVariantConfig(
  p: MerchantProductItem,
  colorName?: string,
  sizeOrAttr?: string
): {
  sku: string;
  variantLabel: string;
  maxStock: number;
  imageUrl?: string;
  selectedColor?: string;
  selectedSize?: string;
  selectedVariantId?: string;
} {
  const hasColors = Boolean(p.colors && p.colors.length > 0);
  const resolvedColor = hasColors
    ? colorName || p.colors![0]?.name
    : undefined;

  const colorObj = hasColors && resolvedColor
    ? p.colors!.find((c) => c.name === resolvedColor)
    : undefined;
  const resolvedImage = colorObj?.imageUrl || p.imageUrl;

  const availableSizes = getAvailableSizesForColor(p, resolvedColor);
  let resolvedSize: string | undefined = undefined;
  if (availableSizes.length > 0) {
    if (sizeOrAttr && availableSizes.includes(sizeOrAttr) && getOptionStock(p, resolvedColor, sizeOrAttr) > 0) {
      resolvedSize = sizeOrAttr;
    } else {
      const inStockSize = availableSizes.find((sz) => getOptionStock(p, resolvedColor, sz) > 0);
      resolvedSize = inStockSize || (sizeOrAttr && availableSizes.includes(sizeOrAttr) ? sizeOrAttr : availableSizes[0]);
    }
  }

  // Find in variantsList
  let matchedVariant = p.variantsList?.find((v) => {
    const colorMatches = !resolvedColor || !v.color || v.color === resolvedColor;
    const sizeMatches =
      !resolvedSize ||
      v.size === resolvedSize ||
      v.attributeValue === resolvedSize;
    return colorMatches && sizeMatches;
  });

  if (!matchedVariant && resolvedColor && p.variantsList) {
    matchedVariant = p.variantsList.find((v) => v.color === resolvedColor);
  }

  if (matchedVariant) {
    const labelParts = [
      matchedVariant.color,
      matchedVariant.size || matchedVariant.attributeValue,
    ].filter(Boolean);
    const label =
      labelParts.length > 0 ? labelParts.join(' / ') : p.variantLabel || 'Standard';
    return {
      sku: matchedVariant.variantSku,
      variantLabel: label,
      maxStock: matchedVariant.stock,
      imageUrl: resolvedImage,
      selectedColor: resolvedColor,
      selectedSize: resolvedSize,
      selectedVariantId: matchedVariant.id,
    };
  }

  // Fallback if no specific variantsList item
  const labelParts = [resolvedColor, resolvedSize].filter(Boolean);
  const label =
    labelParts.length > 0 ? labelParts.join(' / ') : p.variantLabel || 'Standard';
  return {
    sku: p.sku,
    variantLabel: label,
    maxStock: p.stock || 0,
    imageUrl: resolvedImage,
    selectedColor: resolvedColor,
    selectedSize: resolvedSize,
  };
}

export function CreateManualOrderModal({
  isOpen,
  onClose,
  products,
  memoList,
  onCreateOrder,
  onTriggerToast,
}: CreateManualOrderModalProps) {
  // 1. Customer Information
  const [orderCustomer, setOrderCustomer] = useState('');
  const [orderPhone, setOrderPhone] = useState('');
  const [orderAddress, setOrderAddress] = useState('');
  const [orderCity, setOrderCity] = useState('Dhaka');
  const [orderCourier, setOrderCourier] = useState('Steadfast');
  const [orderMemoCode, setOrderMemoCode] = useState(
    memoList[0]?.code || 'MEMO-DEFAULT'
  );

  // 2. Multi-Product Line Items
  const [items, setItems] = useState<OrderLineItemDraft[]>(() => {
    const p = products[0];
    if (!p) return [];
    const cfg = resolveVariantConfig(p);
    return [
      {
        rowId: `row-${Date.now()}-1`,
        productId: p.id,
        title: p.title,
        variantLabel: cfg.variantLabel,
        sku: cfg.sku,
        unitPrice: p.price || 0,
        qty: cfg.maxStock > 0 ? 1 : 0,
        maxStock: cfg.maxStock,
        imageUrl: cfg.imageUrl,
        selectedColor: cfg.selectedColor,
        selectedSize: cfg.selectedSize,
        selectedVariantId: cfg.selectedVariantId,
      },
    ];
  });

  // Re-sync line items when modal opens or products data is updated
  useEffect(() => {
    if (isOpen) {
      setItems((prev) => {
        if (prev.length === 0) {
          const p = products[0];
          if (!p) return [];
          const cfg = resolveVariantConfig(p);
          return [
            {
              rowId: `row-${Date.now()}-1`,
              productId: p.id,
              title: p.title,
              variantLabel: cfg.variantLabel,
              sku: cfg.sku,
              unitPrice: p.price || 0,
              qty: cfg.maxStock > 0 ? 1 : 0,
              maxStock: cfg.maxStock,
              imageUrl: cfg.imageUrl,
              selectedColor: cfg.selectedColor,
              selectedSize: cfg.selectedSize,
              selectedVariantId: cfg.selectedVariantId,
            },
          ];
        }
        return prev.map((item) => {
          const p = products.find((prod) => prod.id === item.productId);
          if (!p) return item;
          const cfg = resolveVariantConfig(p, item.selectedColor, item.selectedSize);
          const nextMaxStock = cfg.maxStock;
          const nextQty = nextMaxStock <= 0 ? 0 : Math.min(item.qty > 0 ? item.qty : 1, nextMaxStock);
          return {
            ...item,
            variantLabel: cfg.variantLabel,
            sku: cfg.sku,
            maxStock: nextMaxStock,
            qty: nextQty,
            imageUrl: cfg.imageUrl || item.imageUrl,
            selectedColor: cfg.selectedColor,
            selectedSize: cfg.selectedSize,
            selectedVariantId: cfg.selectedVariantId,
          };
        });
      });
    }
  }, [isOpen, products]);

  // 3. Pricing Adjustments: Delivery, Discount, Advance
  const [deliveryArea, setDeliveryArea] = useState<'INSIDE_DHAKA' | 'SUB_DHAKA' | 'OUTSIDE_DHAKA' | 'FREE' | 'CUSTOM'>('INSIDE_DHAKA');
  const [deliveryFee, setDeliveryFee] = useState<number>(60);
  const [discount, setDiscount] = useState<number>(0);
  const [advancePayment, setAdvancePayment] = useState<number>(0);
  const [advanceMethod, setAdvanceMethod] = useState<string>('bKash');
  const [advanceTrxId, setAdvanceTrxId] = useState<string>('');
  const [orderNotes, setOrderNotes] = useState<string>('');

  if (!isOpen) return null;

  // Real-time Calculations
  const subtotal = items.reduce((sum, item) => sum + (item.unitPrice * item.qty), 0);
  const orderTotal = Math.max(0, subtotal + deliveryFee - discount);
  const codAmount = Math.max(0, orderTotal - advancePayment);
  const totalQty = items.reduce((sum, item) => sum + item.qty, 0);

  // Delivery Presets Handler
  const handleSelectDeliveryPreset = (
    preset: 'INSIDE_DHAKA' | 'SUB_DHAKA' | 'OUTSIDE_DHAKA' | 'FREE',
    fee: number
  ) => {
    setDeliveryArea(preset);
    setDeliveryFee(fee);
  };

  // Advance Payment Presets Handler
  const handleSetAdvancePreset = (type: 'NONE' | 'DELIVERY' | 'FULL') => {
    if (type === 'NONE') {
      setAdvancePayment(0);
    } else if (type === 'DELIVERY') {
      setAdvancePayment(deliveryFee);
    } else if (type === 'FULL') {
      setAdvancePayment(orderTotal);
    }
  };

  // Line Item Handlers
  const handleAddItem = () => {
    // Pick first product not already in items, or fallback to first product
    const available = products.find((p) => !items.some((it) => it.productId === p.id)) || products[0];
    if (!available) {
      onTriggerToast('No more products available to add.');
      return;
    }
    const cfg = resolveVariantConfig(available);
    const newItem: OrderLineItemDraft = {
      rowId: `row-${Date.now()}-${items.length + 1}`,
      productId: available.id,
      title: available.title,
      variantLabel: cfg.variantLabel,
      sku: cfg.sku,
      unitPrice: available.price || 0,
      qty: cfg.maxStock > 0 ? 1 : 0,
      maxStock: cfg.maxStock,
      imageUrl: cfg.imageUrl,
      selectedColor: cfg.selectedColor,
      selectedSize: cfg.selectedSize,
      selectedVariantId: cfg.selectedVariantId,
    };
    setItems((prev) => [...prev, newItem]);
  };

  const handleRemoveItem = (rowId: string) => {
    if (items.length <= 1) {
      onTriggerToast('An order must contain at least 1 product.');
      return;
    }
    setItems((prev) => prev.filter((it) => it.rowId !== rowId));
  };

  const handleProductChange = (rowId: string, newProductId: string) => {
    const p = products.find((prod) => prod.id === newProductId);
    if (!p) return;
    const cfg = resolveVariantConfig(p);
    const nextQty = cfg.maxStock > 0 ? 1 : 0;
    setItems((prev) =>
      prev.map((it) =>
        it.rowId === rowId
          ? {
              ...it,
              productId: p.id,
              title: p.title,
              variantLabel: cfg.variantLabel,
              sku: cfg.sku,
              unitPrice: p.price || 0,
              qty: nextQty,
              maxStock: cfg.maxStock,
              imageUrl: cfg.imageUrl,
              selectedColor: cfg.selectedColor,
              selectedSize: cfg.selectedSize,
              selectedVariantId: cfg.selectedVariantId,
            }
          : it
      )
    );
  };

  const handleColorChange = (rowId: string, newColorName: string) => {
    setItems((prev) =>
      prev.map((it) => {
        if (it.rowId !== rowId) return it;
        const p = products.find((prod) => prod.id === it.productId);
        if (!p) return it;
        const cfg = resolveVariantConfig(p, newColorName, it.selectedSize);
        const nextQty = cfg.maxStock <= 0 ? 0 : Math.min(cfg.maxStock, Math.max(1, it.qty));
        return {
          ...it,
          variantLabel: cfg.variantLabel,
          sku: cfg.sku,
          maxStock: cfg.maxStock,
          qty: nextQty,
          imageUrl: cfg.imageUrl,
          selectedColor: cfg.selectedColor,
          selectedSize: cfg.selectedSize,
          selectedVariantId: cfg.selectedVariantId,
        };
      })
    );
  };

  const handleSizeChange = (rowId: string, newSize: string) => {
    setItems((prev) =>
      prev.map((it) => {
        if (it.rowId !== rowId) return it;
        const p = products.find((prod) => prod.id === it.productId);
        if (!p) return it;
        const cfg = resolveVariantConfig(p, it.selectedColor, newSize);
        const nextQty = cfg.maxStock <= 0 ? 0 : Math.min(cfg.maxStock, Math.max(1, it.qty));
        return {
          ...it,
          variantLabel: cfg.variantLabel,
          sku: cfg.sku,
          maxStock: cfg.maxStock,
          qty: nextQty,
          imageUrl: cfg.imageUrl,
          selectedSize: cfg.selectedSize,
          selectedVariantId: cfg.selectedVariantId,
        };
      })
    );
  };

  const handleUnitPriceChange = (rowId: string, newPrice: number) => {
    setItems((prev) =>
      prev.map((it) =>
        it.rowId === rowId ? { ...it, unitPrice: Math.max(0, newPrice) } : it
      )
    );
  };

  const handleQtyChange = (rowId: string, newQty: number) => {
    setItems((prev) =>
      prev.map((it) => {
        if (it.rowId !== rowId) return it;
        if (it.maxStock <= 0) {
          return { ...it, qty: 0 };
        }
        const clamped = Math.min(it.maxStock, Math.max(1, newQty));
        return { ...it, qty: clamped };
      })
    );
  };

  // Form Submit Handler
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!orderCustomer.trim()) {
      onTriggerToast('Please enter customer name.');
      return;
    }
    if (!orderPhone.trim()) {
      onTriggerToast('Please enter customer phone number.');
      return;
    }
    if (!orderAddress.trim()) {
      onTriggerToast('Please enter customer delivery address.');
      return;
    }
    if (items.length === 0) {
      onTriggerToast('Please add at least one product.');
      return;
    }

    // Stock validation
    for (const item of items) {
      if (item.maxStock <= 0 || item.qty <= 0) {
        onTriggerToast(
          `"${item.title} (${item.variantLabel})" এর কোনো স্টক নেই! অনুগ্রহ করে অন্য কালার/সাইজ নির্বাচন করুন।`
        );
        return;
      }
      if (item.qty > item.maxStock) {
        onTriggerToast(
          `"${item.title} (${item.variantLabel})" এর পর্যাপ্ত স্টক নেই! আপনি চেয়েছেন: ${item.qty} টি, কিন্তু ওয়্যারহাউসে আছে: ${item.maxStock} টি।`
        );
        return;
      }
    }

    const newOrderId = `ORD-${Math.floor(1000 + Math.random() * 9000)}`;

    const isFullPaid = advancePayment >= orderTotal;
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

    const lineItems: OrderLineItem[] = items.map((it) => ({
      id: it.productId,
      title: it.title,
      variant: it.variantLabel,
      sku: it.sku,
      price: it.unitPrice,
      quantity: it.qty,
      total: it.unitPrice * it.qty,
      imageUrl: it.imageUrl,
    }));

    const newOrder: MerchantOrderItem = {
      id: newOrderId,
      orderNumber: newOrderId,
      date: 'Today, Just now',
      customer: orderCustomer.trim(),
      phone: orderPhone.trim(),
      address: orderAddress.trim(),
      productId: items[0].productId,
      items: items.map((it) => `${it.title} (${it.variantLabel}) x ${it.qty}`).join(', '),
      qty: totalQty,
      amount: orderTotal,
      subtotal,
      deliveryFee,
      discount,
      advancePayment,
      codAmount,
      memoCode: orderMemoCode,
      status: 'PENDING',
      courier: orderCourier,
      paymentMethod: paymentMethodLabel,
      paymentStatus,
      advancePaymentMethod: advancePayment > 0 ? advanceMethod : undefined,
      advanceTrxId: advancePayment > 0 && advanceTrxId ? advanceTrxId.trim() : undefined,
      lineItems,
      timeline: [
        {
          title: 'Order Created (Manual)',
          description: `Order created by merchant. ${
            advancePayment > 0
              ? `Advance received: ৳${advancePayment.toLocaleString()} (${advanceMethod}). COD: ৳${codAmount.toLocaleString()}`
              : `Full COD collection: ৳${codAmount.toLocaleString()}`
          }`,
          timestamp: 'Just now',
          isCompleted: true,
        },
      ],
    };

    // Deduct stock for all items (including variant-level stock)
    const itemsToDeduct = items.map((it) => ({
      productId: it.productId,
      qty: it.qty,
      variantSku: it.sku,
    }));

    onCreateOrder(newOrder, itemsToDeduct);
    onClose();

    onTriggerToast(
      `Order ${newOrderId} created with ${items.length} product(s)! ${
        codAmount === 0
          ? 'Full Paid (৳0 COD)'
          : `COD to Collect: ৳${codAmount.toLocaleString()}`
      }`
    );
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-2 sm:p-4 overflow-y-auto">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-4xl max-h-[92vh] overflow-y-auto p-4 sm:p-7 space-y-6 shadow-2xl animate-in zoom-in-95 duration-200 text-slate-100">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
              <Package className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-white">Create Manual Order</h2>
              <p className="text-xs text-slate-400">
                একাধিক প্রোডাক্ট যুক্ত করুন, ডেলিভারি চার্জ অ্যাডজাস্ট করুন এবং কাস্টমারের অগ্রিম বা সম্পূর্ণ পেমেন্ট ক্যালকুলেট করুন।
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Section 1: Customer Details */}
          <div className="p-4 sm:p-5 rounded-xl bg-slate-950/70 border border-slate-800 space-y-4">
            <div className="flex items-center gap-2 text-xs font-bold text-slate-200 uppercase tracking-wider">
              <User className="h-4 w-4 text-emerald-400" />
              <span>Customer & Delivery Details</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Customer Full Name <span className="text-rose-400">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={orderCustomer}
                  onChange={(e) => setOrderCustomer(e.target.value)}
                  placeholder="e.g. Tanvir Hasan"
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-lg text-xs text-slate-200 focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Phone Number <span className="text-rose-400">*</span>
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-2 text-xs font-mono text-slate-500">+88</span>
                  <input
                    type="text"
                    required
                    value={orderPhone}
                    onChange={(e) => setOrderPhone(e.target.value)}
                    placeholder="01712345678"
                    className="w-full pl-10 pr-3 py-2 bg-slate-900 border border-slate-800 rounded-lg text-xs font-mono text-slate-200 focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  City / District
                </label>
                <input
                  type="text"
                  value={orderCity}
                  onChange={(e) => setOrderCity(e.target.value)}
                  placeholder="Dhaka, Chittagong, Sylhet..."
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-lg text-xs text-slate-200 focus:outline-none focus:border-emerald-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Full Delivery Address <span className="text-rose-400">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={orderAddress}
                  onChange={(e) => setOrderAddress(e.target.value)}
                  placeholder="House 12, Road 4, Sector 7, Uttara, Dhaka"
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-lg text-xs text-slate-200 focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Courier Partner
                </label>
                <select
                  value={orderCourier}
                  onChange={(e) => setOrderCourier(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-lg text-xs text-slate-200 focus:outline-none focus:border-emerald-500 cursor-pointer"
                >
                  <option value="Steadfast">Steadfast Courier</option>
                  <option value="Pathao">Pathao Logistics</option>
                  <option value="RedX">RedX Delivery</option>
                  <option value="Paperfly">Paperfly</option>
                </select>
              </div>
            </div>
          </div>

          {/* Section 2: Multiple Products List */}
          <div className="p-4 sm:p-5 rounded-xl bg-slate-950/70 border border-slate-800 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs font-bold text-slate-200 uppercase tracking-wider">
                <Layers className="h-4 w-4 text-emerald-400" />
                <span>Order Products & Stock Allocation ({items.length} items)</span>
              </div>

              <button
                type="button"
                onClick={handleAddItem}
                className="px-3 py-1.5 rounded-lg bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-400 border border-emerald-500/40 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <Plus className="h-3.5 w-3.5" />
                <span>Add Another Product</span>
              </button>
            </div>

            <div className="space-y-3">
              {items.map((item, index) => {
                const p = products.find((prod) => prod.id === item.productId);
                const hasColors = Boolean(p && p.colors && p.colors.length > 0);
                const availableSizes = p ? getAvailableSizesForColor(p, item.selectedColor) : [];
                const hasSizes = availableSizes.length > 0;
                const hasVariants = Boolean(p && p.variantsList && p.variantsList.length > 0);
                const isOutOfStock = item.maxStock === 0 || item.qty > item.maxStock;

                return (
                  <div
                    key={item.rowId}
                    className={`p-3 sm:p-4 rounded-xl bg-slate-900 border transition-all space-y-3 ${
                      isOutOfStock ? 'border-rose-500/60 bg-rose-950/10' : 'border-slate-800'
                    }`}
                  >
                    {/* Top Row: Full-width Product Selector & Delete button */}
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-2.5 flex-1 min-w-0">
                        <ProductThumbnail src={item.imageUrl} alt={item.title} size="sm" />
                        <div className="flex-1 min-w-0">
                          <label className="block text-[11px] font-semibold text-slate-400 mb-1">
                            Product #{index + 1}
                          </label>
                          <select
                            value={item.productId}
                            onChange={(e) => handleProductChange(item.rowId, e.target.value)}
                            className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-slate-200 focus:outline-none focus:border-emerald-500 cursor-pointer"
                          >
                            {products.map((prod) => (
                              <option key={prod.id} value={prod.id}>
                                {prod.title} — Base Stock: {prod.stock} pcs (৳{prod.price})
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>

                      {items.length > 1 && (
                        <div className="pt-5 shrink-0">
                          <button
                            type="button"
                            onClick={() => handleRemoveItem(item.rowId)}
                            className="p-2 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-slate-800 transition-colors cursor-pointer"
                            title="Remove this product"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      )}
                    </div>

                    {/* Middle Row: Responsive Grid for Color Dropdown, Size/Spec Dropdown, Unit Price, and Quantity */}
                    <div
                      className={`grid gap-3 pt-3 border-t border-slate-800/80 items-end ${
                        hasColors && hasSizes
                          ? 'grid-cols-1 sm:grid-cols-2 md:grid-cols-4'
                          : hasColors || hasSizes
                          ? 'grid-cols-1 sm:grid-cols-3'
                          : 'grid-cols-1 sm:grid-cols-2'
                      }`}
                    >
                      {/* Color Dropdown */}
                      {hasColors && p && (
                        <div>
                          <label className="block text-[11px] font-semibold text-slate-400 mb-1 flex items-center justify-between">
                            <span className="flex items-center gap-1.5">
                              <Palette className="h-3.5 w-3.5 text-emerald-400" />
                              Color
                            </span>
                            {(() => {
                              const activeColor = p.colors?.find((c) => c.name === item.selectedColor);
                              return activeColor ? (
                                <span
                                  className="inline-block w-2.5 h-2.5 rounded-full border border-white/30"
                                  style={{ backgroundColor: activeColor.hex }}
                                  title={activeColor.name}
                                />
                              ) : null;
                            })()}
                          </label>
                          <select
                            value={item.selectedColor || ''}
                            onChange={(e) => handleColorChange(item.rowId, e.target.value)}
                            className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-slate-200 focus:outline-none focus:border-emerald-500 cursor-pointer"
                          >
                            {p.colors!.map((c) => (
                              <option key={c.id || c.name} value={c.name}>
                                {c.name}
                              </option>
                            ))}
                          </select>
                        </div>
                      )}

                      {/* Size / Specification Dropdown */}
                      {hasSizes && p && (
                        <div>
                          <label className="block text-[11px] font-semibold text-slate-400 mb-1">
                            {getAttributeLabel(p.productType)}
                          </label>
                          <select
                            value={item.selectedSize || ''}
                            onChange={(e) => handleSizeChange(item.rowId, e.target.value)}
                            className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-slate-200 focus:outline-none focus:border-emerald-500 cursor-pointer"
                          >
                            {availableSizes.map((sizeName) => {
                              const stockForOption = getOptionStock(p, item.selectedColor, sizeName);
                              const isZeroStock = stockForOption <= 0;
                              return (
                                <option key={sizeName} value={sizeName} disabled={isZeroStock}>
                                  {sizeName} {isZeroStock ? '(Out of Stock — 0 pcs)' : `(${stockForOption} in stock)`}
                                </option>
                              );
                            })}
                          </select>
                        </div>
                      )}

                      {/* Unit Price (৳) */}
                      <div>
                        <label className="block text-[11px] font-semibold text-slate-400 mb-1">
                          Unit Price (৳)
                        </label>
                        <input
                          type="number"
                          min="0"
                          value={item.unitPrice}
                          onChange={(e) =>
                            handleUnitPriceChange(item.rowId, Number(e.target.value) || 0)
                          }
                          className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs font-bold text-slate-200 text-right focus:outline-none focus:border-emerald-500"
                        />
                      </div>

                      {/* Quantity with +/- */}
                      <div>
                        <label className="block text-[11px] font-semibold text-slate-400 mb-1">
                          Qty (Stock: {item.maxStock})
                        </label>
                        <div className="flex items-center">
                          <button
                            type="button"
                            disabled={item.qty <= 1 || item.maxStock <= 0}
                            onClick={() => handleQtyChange(item.rowId, item.qty - 1)}
                            className="px-2.5 py-2 bg-slate-800 hover:bg-slate-700 disabled:opacity-40 disabled:cursor-not-allowed text-slate-300 rounded-l-lg text-xs font-bold border border-slate-700 cursor-pointer"
                          >
                            -
                          </button>
                          <input
                            type="number"
                            min={item.maxStock > 0 ? 1 : 0}
                            max={item.maxStock}
                            disabled={item.maxStock <= 0}
                            value={item.qty}
                            onChange={(e) =>
                              handleQtyChange(item.rowId, Number(e.target.value) || 0)
                            }
                            className="w-full py-2 bg-slate-950 border-y border-slate-800 text-xs font-bold text-center text-slate-200 focus:outline-none disabled:opacity-40 disabled:cursor-not-allowed"
                          />
                          <button
                            type="button"
                            disabled={item.qty >= item.maxStock || item.maxStock <= 0}
                            onClick={() => handleQtyChange(item.rowId, item.qty + 1)}
                            className="px-2.5 py-2 bg-slate-800 hover:bg-slate-700 disabled:opacity-40 disabled:cursor-not-allowed text-slate-300 rounded-r-lg text-xs font-bold border border-slate-700 cursor-pointer"
                          >
                            +
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Bottom Row: Variant Pill, SKU, Stock Status & Line Total */}
                    <div className="pt-2.5 border-t border-slate-800/60 flex flex-wrap items-center justify-between gap-2.5 text-xs">
                      <div className="flex flex-wrap items-center gap-2 text-[11px]">
                        <span className="px-2 py-0.5 rounded bg-slate-950 text-slate-300 font-mono border border-slate-800">
                          SKU: <strong className="text-white">{item.sku}</strong>
                        </span>
                        <span className="px-2 py-0.5 rounded bg-slate-950 text-slate-400 border border-slate-800">
                          Variant: <strong className="text-slate-200">{item.variantLabel}</strong>
                        </span>
                        <span
                          className={`px-2 py-0.5 rounded font-mono border font-semibold ${
                            item.maxStock === 0
                              ? 'bg-rose-500/10 text-rose-400 border-rose-500/30'
                              : item.maxStock < 5
                              ? 'bg-amber-500/10 text-amber-400 border-amber-500/30'
                              : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                          }`}
                        >
                          {item.maxStock === 0 ? 'Out of Stock' : `${item.maxStock} in stock`}
                        </span>
                      </div>

                      <div className="flex items-center gap-1.5 ml-auto">
                        <span className="text-[11px] text-slate-400">Total:</span>
                        <span className="font-bold text-emerald-400 font-mono text-sm">
                          ৳{(item.unitPrice * item.qty).toLocaleString()}
                        </span>
                      </div>
                    </div>

                    {/* Out of Stock Alert */}
                    {isOutOfStock && (
                      <div className="flex items-center gap-1.5 mt-2.5 p-2 rounded-lg bg-rose-500/10 border border-rose-500/20 text-xs text-rose-400 font-medium">
                        <AlertCircle className="h-4 w-4 shrink-0" />
                        <span>
                          {item.maxStock === 0
                            ? `এই ভ্যারিয়েন্টের কোনো স্টক নেই! ("${item.title} - ${item.variantLabel}")`
                            : `ওয়্যারহাউস স্টকে পর্যাপ্ত প্রোডাক্ট নেই! মোট উপলব্ধ স্টক: ${item.maxStock} টি (আপনি চেয়েছেন: ${item.qty} টি)`}
                        </span>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Section 3: Pricing Engine (Delivery, Discount, Advance Payment & COD) */}
          <div className="p-4 sm:p-5 rounded-xl bg-slate-950/70 border border-slate-800 space-y-5">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2 text-xs font-bold text-slate-200 uppercase tracking-wider">
                <DollarSign className="h-4 w-4 text-emerald-400" />
                <span>Pricing Calculation & Payment Collection Engine</span>
              </div>
              <span className="text-[11px] text-slate-400 hidden sm:inline">
                প্রোডাক্টের ধরন, ডেলিভারি চার্জ ও অগ্রিম পেমেন্টের হিসাব
              </span>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
              {/* Left Column (Inputs for Delivery, Discount, Advance) */}
              <div className="lg:col-span-7 space-y-4">
                {/* 1. Delivery Charge with Presets & Custom Input */}
                <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-800 space-y-2.5">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
                      <Truck className="h-3.5 w-3.5 text-blue-400" />
                      <span>ডেলিভারি চার্জ (Delivery Charge)</span>
                    </label>
                    <span className="text-[11px] text-slate-400">ওজন বা লোকেশন অনুযায়ী কম-বেশি হতে পারে</span>
                  </div>

                  {/* Preset Pills */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
                    <button
                      type="button"
                      onClick={() => handleSelectDeliveryPreset('INSIDE_DHAKA', 60)}
                      className={`px-2 py-1.5 rounded-lg text-[11px] font-semibold border transition-all ${
                        deliveryFee === 60
                          ? 'bg-blue-600/20 text-blue-300 border-blue-500/50 shadow-sm'
                          : 'bg-slate-950 text-slate-400 border-slate-800 hover:bg-slate-800'
                      }`}
                    >
                      Inside Dhaka ৳60
                    </button>
                    <button
                      type="button"
                      onClick={() => handleSelectDeliveryPreset('SUB_DHAKA', 100)}
                      className={`px-2 py-1.5 rounded-lg text-[11px] font-semibold border transition-all ${
                        deliveryFee === 100
                          ? 'bg-blue-600/20 text-blue-300 border-blue-500/50 shadow-sm'
                          : 'bg-slate-950 text-slate-400 border-slate-800 hover:bg-slate-800'
                      }`}
                    >
                      Sub-Dhaka ৳100
                    </button>
                    <button
                      type="button"
                      onClick={() => handleSelectDeliveryPreset('OUTSIDE_DHAKA', 120)}
                      className={`px-2 py-1.5 rounded-lg text-[11px] font-semibold border transition-all ${
                        deliveryFee === 120
                          ? 'bg-blue-600/20 text-blue-300 border-blue-500/50 shadow-sm'
                          : 'bg-slate-950 text-slate-400 border-slate-800 hover:bg-slate-800'
                      }`}
                    >
                      Outside Dhaka ৳120
                    </button>
                    <button
                      type="button"
                      onClick={() => handleSelectDeliveryPreset('FREE', 0)}
                      className={`px-2 py-1.5 rounded-lg text-[11px] font-semibold border transition-all ${
                        deliveryFee === 0
                          ? 'bg-emerald-600/20 text-emerald-300 border-emerald-500/50 shadow-sm'
                          : 'bg-slate-950 text-slate-400 border-slate-800 hover:bg-slate-800'
                      }`}
                    >
                      Free Delivery ৳0
                    </button>
                  </div>

                  {/* Custom Delivery Charge Input */}
                  <div className="flex items-center gap-2 pt-1">
                    <span className="text-[11px] text-slate-400 shrink-0">Custom Charge:</span>
                    <div className="relative flex-1">
                      <span className="absolute left-3 top-1.5 text-xs font-bold text-slate-400">৳</span>
                      <input
                        type="number"
                        min="0"
                        value={deliveryFee}
                        onChange={(e) => {
                          setDeliveryArea('CUSTOM');
                          setDeliveryFee(Number(e.target.value) || 0);
                        }}
                        className="w-full pl-7 pr-3 py-1.5 bg-slate-950 border border-slate-800 rounded-lg text-xs font-bold text-slate-200 focus:outline-none focus:border-blue-500"
                        placeholder="e.g. 150 for heavy parcel"
                      />
                    </div>
                  </div>
                </div>

                {/* 2. Discount */}
                <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-800 space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
                      <Tag className="h-3.5 w-3.5 text-amber-400" />
                      <span>স্পেশাল ডিসকাউন্ট (Special Discount)</span>
                    </label>
                    <span className="text-[11px] text-slate-400">টোটাল থেকে বাদ যাবে</span>
                  </div>

                  <div className="relative">
                    <span className="absolute left-3 top-2 text-xs font-bold text-slate-400">৳</span>
                    <input
                      type="number"
                      min="0"
                      value={discount}
                      onChange={(e) => setDiscount(Math.max(0, Number(e.target.value) || 0))}
                      placeholder="0"
                      className="w-full pl-7 pr-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs font-bold text-slate-200 focus:outline-none focus:border-amber-500"
                    />
                  </div>
                </div>

                {/* 3. Advance Payment (অগ্রিম পেমেন্ট) */}
                <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-800 space-y-2.5">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
                      <CreditCard className="h-3.5 w-3.5 text-emerald-400" />
                      <span>অগ্রিম পেমেন্ট (Advance Received)</span>
                    </label>
                    <span className="text-[11px] text-slate-400">
                      কাস্টমার অগ্রিম টাকা দিলে এখানে লিখুন
                    </span>
                  </div>

                  {/* Quick Preset Buttons */}
                  <div className="grid grid-cols-3 gap-2">
                    <button
                      type="button"
                      onClick={() => handleSetAdvancePreset('NONE')}
                      className={`px-2 py-1.5 rounded-lg text-[11px] font-semibold border transition-all ${
                        advancePayment === 0
                          ? 'bg-amber-600/20 text-amber-300 border-amber-500/50'
                          : 'bg-slate-950 text-slate-400 border-slate-800 hover:bg-slate-800'
                      }`}
                    >
                      No Advance (Full COD)
                    </button>
                    <button
                      type="button"
                      onClick={() => handleSetAdvancePreset('DELIVERY')}
                      className={`px-2 py-1.5 rounded-lg text-[11px] font-semibold border transition-all ${
                        advancePayment === deliveryFee && deliveryFee > 0
                          ? 'bg-emerald-600/20 text-emerald-300 border-emerald-500/50'
                          : 'bg-slate-950 text-slate-400 border-slate-800 hover:bg-slate-800'
                      }`}
                    >
                      Delivery Only (৳{deliveryFee})
                    </button>
                    <button
                      type="button"
                      onClick={() => handleSetAdvancePreset('FULL')}
                      className={`px-2 py-1.5 rounded-lg text-[11px] font-semibold border transition-all ${
                        advancePayment >= orderTotal && orderTotal > 0
                          ? 'bg-emerald-600/20 text-emerald-300 border-emerald-500/50'
                          : 'bg-slate-950 text-slate-400 border-slate-800 hover:bg-slate-800'
                      }`}
                    >
                      Full Paid (৳{orderTotal.toLocaleString()})
                    </button>
                  </div>

                  {/* Custom Advance Input */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                    <div className="relative">
                      <span className="absolute left-3 top-2 text-xs font-bold text-slate-400">৳</span>
                      <input
                        type="number"
                        min="0"
                        max={orderTotal}
                        value={advancePayment}
                        onChange={(e) =>
                          setAdvancePayment(Math.max(0, Number(e.target.value) || 0))
                        }
                        placeholder="Advance Amount"
                        className="w-full pl-7 pr-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs font-bold text-emerald-400 focus:outline-none focus:border-emerald-500"
                      />
                    </div>

                    <select
                      value={advanceMethod}
                      onChange={(e) => setAdvanceMethod(e.target.value)}
                      disabled={advancePayment <= 0}
                      className="px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-slate-200 focus:outline-none focus:border-emerald-500 disabled:opacity-50"
                    >
                      <option value="bKash">bKash (বিকাশ)</option>
                      <option value="Nagad">Nagad (নগদ)</option>
                      <option value="Rocket">Rocket (রকেট)</option>
                      <option value="Bank Transfer">Bank Transfer</option>
                      <option value="Cash">Cash Handover</option>
                    </select>
                  </div>

                  {advancePayment > 0 && (
                    <div className="pt-1">
                      <input
                        type="text"
                        value={advanceTrxId}
                        onChange={(e) => setAdvanceTrxId(e.target.value)}
                        placeholder="Advance Trx ID / Transaction Note (Optional, e.g. 9J83KA2)"
                        className="w-full px-3 py-1.5 bg-slate-950 border border-slate-800 rounded-lg text-xs font-mono text-slate-300 placeholder:text-slate-600 focus:outline-none focus:border-emerald-500"
                      />
                    </div>
                  )}
                </div>
              </div>

              {/* Right Column: Live Order Summary Card */}
              <div className="lg:col-span-5 flex flex-col justify-between p-4 sm:p-5 rounded-xl bg-slate-900 border border-slate-800 space-y-4">
                <div>
                  <span className="text-xs font-bold text-slate-200 uppercase tracking-wider block mb-3">
                    Order Price Summary
                  </span>

                  <div className="space-y-2.5 text-xs">
                    <div className="flex justify-between text-slate-400">
                      <span>Products Subtotal ({totalQty} pcs)</span>
                      <span className="font-semibold text-slate-200 font-mono">
                        ৳{subtotal.toLocaleString()}
                      </span>
                    </div>

                    <div className="flex justify-between text-slate-400">
                      <span>Delivery Charge</span>
                      <span className="font-semibold text-blue-400 font-mono">
                        +৳{deliveryFee.toLocaleString()}
                      </span>
                    </div>

                    {discount > 0 && (
                      <div className="flex justify-between text-amber-400">
                        <span>Discount Applied</span>
                        <span className="font-semibold font-mono">
                          -৳{discount.toLocaleString()}
                        </span>
                      </div>
                    )}

                    <div className="pt-2 border-t border-slate-800 flex justify-between items-center text-xs font-bold text-slate-300">
                      <span>Total Invoice Value:</span>
                      <span className="text-sm font-extrabold text-white font-mono">
                        ৳{orderTotal.toLocaleString()}
                      </span>
                    </div>

                    {advancePayment > 0 && (
                      <div className="flex justify-between items-center text-xs text-emerald-400 bg-emerald-950/30 p-2 rounded-lg border border-emerald-500/20">
                        <span className="font-semibold">
                          Advance Received ({advanceMethod}):
                        </span>
                        <span className="font-bold font-mono">
                          -৳{advancePayment.toLocaleString()}
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                {/* COD Amount Banner */}
                <div
                  className={`p-4 rounded-xl border space-y-1.5 ${
                    codAmount === 0
                      ? 'bg-emerald-950/40 border-emerald-500/40 text-emerald-300'
                      : advancePayment > 0
                      ? 'bg-sky-950/40 border-sky-500/40 text-sky-200'
                      : 'bg-amber-950/40 border-amber-500/40 text-amber-200'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs uppercase font-extrabold tracking-wider">
                      {codAmount === 0
                        ? 'Full Paid (No COD)'
                        : advancePayment > 0
                        ? 'Partial COD Collection'
                        : 'Cash on Delivery (COD)'}
                    </span>
                    <span className="text-lg font-black font-mono">
                      ৳{codAmount.toLocaleString()}
                    </span>
                  </div>

                  <p className="text-[11px] leading-relaxed opacity-90">
                    {codAmount === 0
                      ? '✅ কাস্টমার সম্পূর্ণ মূল্য পরিশোধ করেছেন। কুরিয়ার কোনো টাকা কালেক্ট করবে না।'
                      : advancePayment > 0
                      ? `⚠️ কাস্টমার ৳${advancePayment.toLocaleString()} অগ্রিম দিয়েছেন। বাকি ৳${codAmount.toLocaleString()} কুরিয়ার ডেলিভারির সময় কালেক্ট করবে।`
                      : `📦 সম্পূর্ণ ৳${codAmount.toLocaleString()} ডেলিভারির সময় কুরিয়ার কাস্টমার থেকে কালেক্ট করবে।`}
                  </p>
                </div>

                {/* Thermal Memo Template Selector */}
                <div className="pt-2 border-t border-slate-800">
                  <label className="block text-[11px] font-semibold text-slate-400 mb-1">
                    Assign Reseller Memo (4x6 Thermal Slip)
                  </label>
                  <select
                    value={orderMemoCode}
                    onChange={(e) => setOrderMemoCode(e.target.value)}
                    className="w-full px-2.5 py-1.5 bg-slate-950 border border-slate-800 rounded-lg text-xs font-mono text-indigo-300 focus:outline-none focus:border-indigo-500 cursor-pointer"
                  >
                    {memoList.map((m) => (
                      <option key={m.id} value={m.code}>
                        {m.code} — {m.resellerName} {m.isDefault ? '[DEFAULT]' : ''}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          </div>

          {/* Bottom Actions */}
          <div className="pt-4 border-t border-slate-800 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-6 py-2.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition-all shadow-lg shadow-emerald-950/40 flex items-center gap-2 cursor-pointer"
            >
              <Sparkles className="h-4 w-4" />
              <span>Confirm & Reserve Stock ({totalQty} Items)</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
