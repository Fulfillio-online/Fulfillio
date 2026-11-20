'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import {
  ShoppingCart,
  Plus,
  Minus,
  Trash2,
  Package,
  Layers,
  ArrowRight,
  CheckCircle,
  AlertCircle,
  Tag,
} from 'lucide-react';
import { MerchantProductItem, ResellerMemo, MerchantOrderItem } from '../../types';
import { useMerchant } from '../../MerchantContext';
import {
  OrderCartItem,
  getOrderCart,
  addToOrderCart,
  updateOrderCartItemQty,
  removeOrderCartItem,
  clearOrderCart,
} from '../lib/orderCartStorage';
import { QuickOrderCheckoutModal } from './QuickOrderCheckoutModal';

interface ProductOrderListSectionProps {
  product: MerchantProductItem;
  storeName?: string;
  merchantCode?: string;
  memos?: ResellerMemo[];
  hideQuickAddForm?: boolean;
  onCreateOrder?: (
    order: MerchantOrderItem,
    productIdOrItems?: string | { productId: string; qty: number; variantSku?: string }[],
    qty?: number
  ) => void;
  onTriggerToast?: (msg: string) => void;
}

export function ProductOrderListSection({
  product,
  storeName,
  merchantCode,
  memos,
  hideQuickAddForm = false,
  onCreateOrder,
  onTriggerToast,
}: ProductOrderListSectionProps) {
  const merchantCtx = useMerchant();
  const effectiveCreateOrder = onCreateOrder || merchantCtx.createOrder;
  const effectiveStoreName = storeName || merchantCtx.profile.storeName || "Sabbir's Store";
  const effectiveMerchantCode = merchantCode || merchantCtx.profile.merchantCode || 'MC-101';
  const effectiveMemos = memos && memos.length > 0 ? memos : merchantCtx.memoList || [];
  const effectiveToast = onTriggerToast || merchantCtx.showToast;
  // Available colors
  const availableColors = useMemo(() => {
    if (product.colors && product.colors.length > 0) {
      return product.colors;
    }
    const colorFromLabel = product.variantLabel?.split('/')[0]?.trim();
    return [{ id: 'c-1', name: colorFromLabel || 'Standard', hex: '#3b82f6' }];
  }, [product]);

  // Selected color
  const [selectedColor, setSelectedColor] = useState(availableColors[0]?.name || 'Standard');

  // Available sizes based on selected color or product sizes
  const availableSizes = useMemo(() => {
    const matchedColor = availableColors.find((c) => c.name === selectedColor);
    if (matchedColor?.sizes && matchedColor.sizes.length > 0) {
      return matchedColor.sizes;
    }
    if (product.sizes && product.sizes.length > 0) {
      return product.sizes;
    }
    if (product.variantsList && product.variantsList.length > 0) {
      const sizesFromVariants = product.variantsList
        .filter((v) => !v.color || v.color === selectedColor)
        .map((v) => v.size || v.attributeValue || 'Standard')
        .filter(Boolean);
      if (sizesFromVariants.length > 0) return Array.from(new Set(sizesFromVariants));
    }
    const sizeFromLabel = product.variantLabel?.split('/')[1]?.trim();
    return [sizeFromLabel || 'Standard'];
  }, [product, availableColors, selectedColor]);

  // Selected size
  const [selectedSize, setSelectedSize] = useState(availableSizes[0] || 'Standard');

  // When selectedColor changes, ensure selectedSize is valid
  useEffect(() => {
    if (!availableSizes.includes(selectedSize) && availableSizes.length > 0) {
      setSelectedSize(availableSizes[0]);
    }
  }, [availableSizes, selectedSize]);

  // Selected quantity
  const [selectedQty, setSelectedQty] = useState(1);

  // Cart state
  const [cartItems, setCartItems] = useState<OrderCartItem[]>([]);
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);

  // Load and listen to cart changes
  useEffect(() => {
    setCartItems(getOrderCart());

    const handleSync = () => {
      setCartItems(getOrderCart());
    };

    window.addEventListener('fulfillio-order-cart-sync', handleSync);
    window.addEventListener('storage', handleSync);

    return () => {
      window.removeEventListener('fulfillio-order-cart-sync', handleSync);
      window.removeEventListener('storage', handleSync);
    };
  }, []);

  // Compute matched variant details
  const matchedVariant = useMemo(() => {
    if (product.variantsList && product.variantsList.length > 0) {
      const match = product.variantsList.find(
        (v) =>
          (v.color?.toLowerCase() === selectedColor.toLowerCase() || !v.color) &&
          (v.size?.toLowerCase() === selectedSize.toLowerCase() || !v.size)
      );
      if (match) return match;
    }
    return null;
  }, [product, selectedColor, selectedSize]);

  const currentVariantSku = useMemo(() => {
    if (matchedVariant?.variantSku) return matchedVariant.variantSku;
    const cCode = selectedColor.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 3) || 'VAR';
    const sCode = selectedSize.toUpperCase().replace(/[^A-Z0-9]/g, '') || 'STD';
    return `${product.sku}-${cCode}-${sCode}`;
  }, [product.sku, matchedVariant, selectedColor, selectedSize]);

  const maxStock = matchedVariant?.stock ?? product.stock ?? 50;

  // Add to Order List handler
  const handleAddToOrderList = () => {
    if (selectedQty <= 0) return;

    const matchedColorObj = availableColors.find((c) => c.name === selectedColor);
    const itemImage = matchedColorObj?.imageUrl || product.imageUrl;

    const updated = addToOrderCart({
      productId: product.id,
      title: product.title,
      imageUrl: itemImage,
      variantLabel: `${selectedColor} · ${selectedSize}`,
      color: selectedColor,
      size: selectedSize,
      sku: currentVariantSku,
      unitPrice: product.price || 0,
      qty: selectedQty,
      maxStock,
    });

    setCartItems(updated);
    effectiveToast(`Added "${product.title} (${selectedColor} · ${selectedSize})" to Order List!`);
  };

  const handleUpdateQty = (id: string, newQty: number) => {
    const updated = updateOrderCartItemQty(id, newQty);
    setCartItems(updated);
  };

  const handleRemoveItem = (id: string) => {
    const updated = removeOrderCartItem(id);
    setCartItems(updated);
    effectiveToast('Item removed from Order List');
  };

  const handleClearCart = () => {
    clearOrderCart();
    setCartItems([]);
    effectiveToast('Order List cleared');
  };

  const cartTotalAmount = cartItems.reduce((acc, it) => acc + it.unitPrice * it.qty, 0);
  const cartTotalQty = cartItems.reduce((acc, it) => acc + it.qty, 0);

  return (
    <div className="space-y-6">
      {/* 1. Quick Add to Order List Selector Box (Shown only if not hidden) */}
      {!hideQuickAddForm && (
        <div className="p-5 rounded-2xl bg-white dark:bg-navy-900 border border-slate-200 dark:border-white/10 shadow-sm space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 dark:border-white/5 pb-3">
            <div className="flex items-center gap-2.5">
              <div className="h-8 w-8 rounded-lg bg-orange-500/10 border border-orange-500/20 flex items-center justify-center text-orange-600 dark:text-orange-400">
                <ShoppingCart className="h-4 w-4" />
              </div>
              <div>
                <h3 className="font-bold text-sm text-navy-900 dark:text-white">
                  Add to Order List (B2B Quick Order)
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Select color, size, and quantity to add to your persistent order queue
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs font-mono font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                ৳{product.price.toLocaleString()} / unit
              </span>
              <span className="text-xs text-slate-400 font-mono">
                Stock: <span className="font-bold text-navy-900 dark:text-slate-200">{maxStock}</span>
              </span>
            </div>
          </div>

          {/* Variant Selectors: Color, Size, Qty */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {/* Color Selector */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Select Color
              </label>
              <div className="flex flex-wrap gap-2">
                {availableColors.map((c) => (
                  <button
                    key={c.id || c.name}
                    type="button"
                    onClick={() => setSelectedColor(c.name)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 border transition-all cursor-pointer ${
                      selectedColor === c.name
                        ? 'bg-orange-50 dark:bg-orange-950/40 border-orange-500 text-orange-600 dark:text-orange-400 font-bold shadow-xs'
                        : 'bg-slate-50 dark:bg-navy-950 border-slate-200 dark:border-white/10 text-slate-600 dark:text-slate-300 hover:border-slate-300'
                    }`}
                  >
                    <span
                      className="h-2.5 w-2.5 rounded-full border border-black/20 shrink-0"
                      style={{ backgroundColor: c.hex || '#f97316' }}
                    />
                    <span>{c.name}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Size Selector */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Select Size / Spec
              </label>
              <div className="flex flex-wrap gap-2">
                {availableSizes.map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => setSelectedSize(s)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all cursor-pointer ${
                      selectedSize === s
                        ? 'bg-orange-50 dark:bg-orange-950/40 border-orange-500 text-orange-600 dark:text-orange-400 font-bold shadow-xs'
                        : 'bg-slate-50 dark:bg-navy-950 border-slate-200 dark:border-white/10 text-slate-600 dark:text-slate-300 hover:border-slate-300'
                    }`}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>

            {/* Quantity and Add Button */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Quantity &amp; Action
              </label>
              <div className="flex items-center gap-2">
                <div className="flex items-center border border-slate-200 dark:border-white/10 rounded-xl bg-slate-50 dark:bg-navy-950 p-1 shrink-0">
                  <button
                    type="button"
                    onClick={() => setSelectedQty((q) => Math.max(1, q - 1))}
                    className="p-1 rounded-lg hover:bg-slate-200 dark:hover:bg-navy-800 text-slate-500 cursor-pointer"
                  >
                    <Minus className="h-3.5 w-3.5" />
                  </button>
                  <input
                    type="number"
                    min="1"
                    max={maxStock}
                    value={selectedQty}
                    onChange={(e) => setSelectedQty(Math.max(1, parseInt(e.target.value, 10) || 1))}
                    className="w-12 text-center text-xs font-mono font-bold bg-transparent border-0 focus:outline-none text-navy-900 dark:text-white"
                  />
                  <button
                    type="button"
                    onClick={() => setSelectedQty((q) => Math.min(maxStock, q + 1))}
                    className="p-1 rounded-lg hover:bg-slate-200 dark:hover:bg-navy-800 text-slate-500 cursor-pointer"
                  >
                    <Plus className="h-3.5 w-3.5" />
                  </button>
                </div>

                <button
                  type="button"
                  onClick={handleAddToOrderList}
                  className="flex-1 py-2 px-3 rounded-xl bg-orange-600 hover:bg-orange-500 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-md shadow-orange-500/20 transition-all cursor-pointer active:scale-95"
                >
                  <Plus className="h-3.5 w-3.5" />
                  <span>Add to Order List</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 2. Persistent Order List Table Card (Stored across all product pages) */}
      <div className="p-5 rounded-2xl bg-white dark:bg-navy-900 border border-slate-200 dark:border-white/10 shadow-sm space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-white/5 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="h-8 w-8 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
              <Package className="h-4 w-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-sm text-navy-900 dark:text-white">
                  Current Order List
                </h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-orange-500/10 text-orange-600 dark:text-orange-400 border border-orange-500/20">
                  {cartItems.length} Product Variant{cartItems.length !== 1 ? 's' : ''} ({cartTotalQty} Item{cartTotalQty !== 1 ? 's' : ''})
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Items stay saved here while browsing other products in your catalog
              </p>
            </div>
          </div>

          {cartItems.length > 0 && (
            <button
              type="button"
              onClick={handleClearCart}
              className="px-2.5 py-1 text-xs text-slate-400 hover:text-rose-500 flex items-center gap-1 transition-colors cursor-pointer"
            >
              <Trash2 className="h-3.5 w-3.5" />
              <span>Clear List</span>
            </button>
          )}
        </div>

        {/* Empty State vs Table */}
        {cartItems.length === 0 ? (
          <div className="py-8 text-center rounded-xl border border-dashed border-slate-200 dark:border-white/10 bg-slate-50/50 dark:bg-navy-950/40 p-6 space-y-2">
            <ShoppingCart className="h-8 w-8 text-slate-400 mx-auto" />
            <p className="text-xs font-semibold text-slate-600 dark:text-slate-300">
              No items in your order list yet
            </p>
            <p className="text-[11px] text-slate-400 max-w-sm mx-auto">
              Select a color, size, and quantity above and click &quot;Add to Order List&quot;. You can add multiple variants from this product or browse other products.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Table */}
            <div className="rounded-xl border border-slate-200 dark:border-white/10 overflow-hidden bg-white dark:bg-navy-950 overflow-x-auto">
              <table className="w-full text-left text-xs min-w-[580px]">
                <thead className="bg-slate-50 dark:bg-navy-900 text-slate-400 font-semibold border-b border-slate-200 dark:border-white/10">
                  <tr>
                    <th className="py-2.5 px-3">Product</th>
                    <th className="py-2.5 px-3">Variant / Spec</th>
                    <th className="py-2.5 px-3">SKU</th>
                    <th className="py-2.5 px-3 text-right">Unit Price</th>
                    <th className="py-2.5 px-3 text-center">Quantity</th>
                    <th className="py-2.5 px-3 text-right">Total</th>
                    <th className="py-2.5 px-2 text-center w-10">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-white/5">
                  {cartItems.map((item) => (
                    <tr key={item.id} className="hover:bg-slate-50/70 dark:hover:bg-navy-900/40">
                      <td className="py-3 px-3">
                        <div className="flex items-center gap-2.5">
                          <img
                            src={
                              item.imageUrl ||
                              'https://images.unsplash.com/photo-1556905055-8f358a7a47b2?auto=format&fit=crop&w=100&q=80'
                            }
                            alt={item.title}
                            className="h-10 w-10 rounded-lg object-cover bg-slate-100 dark:bg-navy-800 border border-slate-200 dark:border-white/10 shrink-0"
                          />
                          <span className="font-semibold text-navy-900 dark:text-white truncate max-w-[180px] block">
                            {item.title}
                          </span>
                        </div>
                      </td>

                      <td className="py-3 px-3">
                        <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[11px] font-semibold bg-slate-100 dark:bg-navy-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-white/10">
                          <span className="h-2 w-2 rounded-full bg-orange-500" />
                          <span>{item.variantLabel || `${item.color} · ${item.size}`}</span>
                        </span>
                      </td>

                      <td className="py-3 px-3 font-mono text-[11px] text-slate-500 dark:text-slate-400">
                        {item.sku}
                      </td>

                      <td className="py-3 px-3 text-right font-mono font-medium text-navy-900 dark:text-slate-200">
                        ৳{item.unitPrice.toLocaleString()}
                      </td>

                      <td className="py-3 px-3">
                        <div className="flex items-center justify-center gap-1">
                          <button
                            type="button"
                            onClick={() => handleUpdateQty(item.id, item.qty - 1)}
                            className="p-1 rounded bg-slate-100 dark:bg-navy-800 hover:bg-slate-200 text-slate-500 cursor-pointer"
                          >
                            <Minus className="h-3 w-3" />
                          </button>
                          <span className="w-8 text-center font-mono font-bold text-xs text-navy-900 dark:text-white">
                            {item.qty}
                          </span>
                          <button
                            type="button"
                            onClick={() => handleUpdateQty(item.id, item.qty + 1)}
                            className="p-1 rounded bg-slate-100 dark:bg-navy-800 hover:bg-slate-200 text-slate-500 cursor-pointer"
                          >
                            <Plus className="h-3 w-3" />
                          </button>
                        </div>
                      </td>

                      <td className="py-3 px-3 text-right font-mono font-bold text-emerald-600 dark:text-emerald-400">
                        ৳{(item.unitPrice * item.qty).toLocaleString()}
                      </td>

                      <td className="py-3 px-2 text-center">
                        <button
                          type="button"
                          onClick={() => handleRemoveItem(item.id)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors cursor-pointer"
                          title="Remove item"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Bottom Summary Bar and Place Order Button */}
            <div className="p-4 rounded-xl bg-slate-50 dark:bg-navy-950 border border-slate-200/80 dark:border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-slate-500">Total Order Value:</span>
                  <span className="text-lg font-black text-navy-900 dark:text-white font-mono">
                    ৳{cartTotalAmount.toLocaleString()}
                  </span>
                </div>
                <p className="text-[11px] text-slate-400">
                  {cartTotalQty} item{cartTotalQty !== 1 ? 's' : ''} ready to dispatch (+ courier shipping fee)
                </p>
              </div>

              <div className="flex items-center gap-3">
                <Link
                  href="/merchant/products"
                  className="px-3.5 py-2 rounded-xl bg-white dark:bg-navy-900 text-xs font-semibold text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-white/10 hover:bg-slate-100 transition-colors"
                >
                  + Add More Products
                </Link>

                <button
                  type="button"
                  onClick={() => setIsCheckoutOpen(true)}
                  className="px-5 py-2.5 rounded-xl bg-orange-600 hover:bg-orange-500 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-md shadow-orange-500/25 transition-all cursor-pointer active:scale-95"
                >
                  <Package className="h-4 w-4" />
                  <span>Place Order Now</span>
                  <ArrowRight className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Checkout Modal */}
      <QuickOrderCheckoutModal
        isOpen={isCheckoutOpen}
        onClose={() => setIsCheckoutOpen(false)}
        cartItems={cartItems}
        memos={effectiveMemos}
        merchantStoreName={effectiveStoreName}
        merchantCode={effectiveMerchantCode}
        onOrderPlaced={(newOrder, itemsToDeduct) => {
          effectiveCreateOrder(newOrder, itemsToDeduct);
          clearOrderCart();
          setCartItems([]);
        }}
        onTriggerToast={effectiveToast || (() => {})}
      />
    </div>
  );
}
