'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { Palette, Layers } from 'lucide-react';
import { Modal } from '@/components/admin/AdminModal';
import { CourierPartner, WarehousePipelineOrder, CatalogProductItem, ResellerMemoItem } from '../../types';
import { PRODUCT_CATALOG, RESELLER_MEMOS } from '../../mockData';

const POPULAR_COLORS = [
  { name: 'Red', hex: '#ef4444' },
  { name: 'Charcoal Black', hex: '#1e293b' },
  { name: 'Pure White', hex: '#ffffff' },
  { name: 'Navy Blue', hex: '#1e3a8a' },
  { name: 'Royal Blue', hex: '#2563eb' },
  { name: 'Maroon', hex: '#881337' },
  { name: 'Olive Green', hex: '#3f6212' },
  { name: 'Beige', hex: '#d4b996' },
  { name: 'Grey', hex: '#64748b' },
  { name: 'Yellow', hex: '#eab308' },
];

const POPULAR_SIZES = ['XS', 'S', 'M', 'L', 'XL', 'XXL', '3XL', 'Free Size'];

const DEFAULT_FALLBACK_PRODUCT: CatalogProductItem = {
  sku: 'MC-101-HOODIE-BLK-XL',
  title: 'Heavyweight Winter Fleece Hoodie',
  price: 1650,
  merchantCode: 'MC-101',
  merchantName: "Sabbir's Store",
  productImage: '',
  bin: 'A-01-02',
  color: 'Black',
  size: 'XL',
  stock: 42,
};

const DEFAULT_FALLBACK_MEMO: ResellerMemoItem = {
  code: 'MEMO-DEFAULT',
  resellerName: "Sabbir's Store Official",
  phone: '+880 1711-234567',
  address: 'Gulshan-1, Dhaka',
};

interface CreateOrderModalProps {
  isOpen: boolean;
  onClose: () => void;
  ordersCount: number;
  onCreateOrder: (order: WarehousePipelineOrder) => void;
}

export function CreateOrderModal({
  isOpen,
  onClose,
  ordersCount,
  onCreateOrder,
}: CreateOrderModalProps) {
  const memoList: ResellerMemoItem[] = useMemo(() => {
    if (Array.isArray(RESELLER_MEMOS) && RESELLER_MEMOS.length > 0) {
      return RESELLER_MEMOS;
    }
    return [DEFAULT_FALLBACK_MEMO];
  }, []);

  const [availableProducts, setAvailableProducts] = useState<CatalogProductItem[]>(() => {
    if (Array.isArray(PRODUCT_CATALOG) && PRODUCT_CATALOG.length > 0) {
      return PRODUCT_CATALOG;
    }
    return [DEFAULT_FALLBACK_PRODUCT];
  });

  const [newCustomerName, setNewCustomerName] = useState('');
  const [newCustomerPhone, setNewCustomerPhone] = useState('');
  const [newCustomerAddress, setNewCustomerAddress] = useState('');
  const [newCity, setNewCity] = useState('Dhaka');
  const [newSku, setNewSku] = useState(
    (PRODUCT_CATALOG && PRODUCT_CATALOG[0]?.sku) || DEFAULT_FALLBACK_PRODUCT.sku
  );
  const [newColor, setNewColor] = useState('Red');
  const [newSize, setNewSize] = useState('XXL');
  const [newQty, setNewQty] = useState(1);
  const [newMemoCode, setNewMemoCode] = useState(memoList[0]?.code || 'MEMO-DEFAULT');
  const [newCourier, setNewCourier] = useState<CourierPartner>('Steadfast');

  // Load any live published products from localStorage
  useEffect(() => {
    try {
      const raw = localStorage.getItem('fulfillio_warehouse_products_v1');
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed) && parsed.length > 0) {
          const liveItems: CatalogProductItem[] = [];
          for (const item of parsed) {
            if (item.status === 'PUBLISHED' || item.status === 'ACTIVE' || !item.status) {
              liveItems.push({
                merchantCode: item.merchantCode || 'MC-101',
                merchantName: item.merchantName || "Sabbir's Store",
                title: item.title || item.name || 'Warehouse Product',
                productImage: item.thumbnail || item.productImage || '',
                bin: item.bin || 'A-01-01',
                color: item.color || 'Black',
                size: item.size || 'XL',
                sku: item.sku || `SKU-${item.id || Math.random().toString(36).slice(2, 6)}`,
                price: Number(item.price) || 1200,
                stock: Number(item.stock) || Number(item.availableStock) || 10,
              });
            }
          }
          if (liveItems.length > 0) {
            const combined = [...liveItems];
            for (const base of (PRODUCT_CATALOG || [])) {
              if (!combined.some((c) => c.sku === base.sku)) {
                combined.push(base);
              }
            }
            setAvailableProducts(combined);
          }
        }
      }
    } catch {
      // ignore JSON parse errors
    }
  }, []);

  const selectedProduct = useMemo(() => {
    return (
      availableProducts.find((p) => p.sku === newSku) ||
      availableProducts[0] ||
      DEFAULT_FALLBACK_PRODUCT
    );
  }, [availableProducts, newSku]);

  // Sync color/size when sku selection changes
  useEffect(() => {
    if (selectedProduct) {
      if (selectedProduct.color) setNewColor(selectedProduct.color);
      if (selectedProduct.size) setNewSize(selectedProduct.size);
    }
  }, [selectedProduct]);

  const [newUnitPrice, setNewUnitPrice] = useState<number | ''>(selectedProduct.price);

  useEffect(() => {
    setNewUnitPrice(selectedProduct.price);
  }, [selectedProduct.sku, selectedProduct.price]);

  const effectivePrice = typeof newUnitPrice === 'number' ? newUnitPrice : selectedProduct.price;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCustomerName.trim() || !newCustomerPhone.trim() || !newCustomerAddress.trim()) {
      return;
    }
    const product = selectedProduct;
    const memo = memoList.find((m) => m.code === newMemoCode) ||
      memoList[0] ||
      DEFAULT_FALLBACK_MEMO;
    const nextOrderNum = 9833 + ordersCount;

    const colorCode = newColor.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 3) || 'RED';
    const sizeCode = newSize.toUpperCase().replace(/[^A-Z0-9]/g, '') || 'XXL';
    const variantSku = `${product.sku}-${colorCode}-${sizeCode}`;

    const created: WarehousePipelineOrder = {
      id: `ORD-${nextOrderNum}`,
      createdAt: 'Just now',
      merchantCode: product.merchantCode,
      merchantName: product.merchantName,
      customerName: newCustomerName.trim(),
      customerPhone: newCustomerPhone.trim(),
      customerAddress: newCustomerAddress.trim(),
      city: newCity,
      productTitle: product.title,
      productImage: product.productImage,
      bin: product.bin,
      color: newColor,
      size: newSize,
      sku: variantSku,
      qty: newQty,
      stockAvailable: Math.max(0, product.stock - newQty),
      memoCode: memo.code,
      resellerName: memo.resellerName,
      resellerPhone: memo.phone,
      resellerAddress: memo.address,
      codAmount: effectivePrice * newQty,
      courier: newCourier,
      stage: 'PICK',
    };

    onCreateOrder(created);
    setNewCustomerName('');
    setNewCustomerPhone('');
    setNewCustomerAddress('');
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Create Manual Order"
      subtitle="Select product, pick color & size variants, and assign Reseller Memo Code. Orders go directly to Pick List."
      size="md"
    >
      <form onSubmit={handleSubmit} className="space-y-4 text-xs">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block font-bold text-slate-700 dark:text-slate-200 mb-1">Customer Name</label>
            <input
              type="text"
              required
              value={newCustomerName}
              onChange={(e) => setNewCustomerName(e.target.value)}
              placeholder="e.g. Tanvir Hasan"
              className="w-full rounded-xl bg-slate-50 dark:bg-navy-950 border border-slate-200 dark:border-white/10 px-3 py-2 text-navy-800 dark:text-white focus:outline-none focus:border-orange-500 shadow-2xs"
            />
          </div>
          <div>
            <label className="block font-bold text-slate-700 dark:text-slate-200 mb-1">Phone Number</label>
            <input
              type="text"
              required
              value={newCustomerPhone}
              onChange={(e) => setNewCustomerPhone(e.target.value)}
              placeholder="e.g. 01712-889900"
              className="w-full rounded-xl bg-slate-50 dark:bg-navy-950 border border-slate-200 dark:border-white/10 px-3 py-2 text-navy-800 dark:text-white focus:outline-none focus:border-orange-500 shadow-2xs"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="sm:col-span-2">
            <label className="block font-bold text-slate-700 dark:text-slate-200 mb-1">Delivery Address</label>
            <input
              type="text"
              required
              value={newCustomerAddress}
              onChange={(e) => setNewCustomerAddress(e.target.value)}
              placeholder="House, Road, Area"
              className="w-full rounded-xl bg-slate-50 dark:bg-navy-950 border border-slate-200 dark:border-white/10 px-3 py-2 text-navy-800 dark:text-white focus:outline-none focus:border-orange-500 shadow-2xs"
            />
          </div>
          <div>
            <label className="block font-bold text-slate-700 dark:text-slate-200 mb-1">City</label>
            <select
              value={newCity}
              onChange={(e) => setNewCity(e.target.value)}
              aria-label="City"
              className="w-full rounded-xl bg-slate-50 dark:bg-navy-950 border border-slate-200 dark:border-white/10 px-3 py-2 text-navy-800 dark:text-white focus:outline-none focus:border-orange-500 shadow-2xs cursor-pointer"
            >
              <option value="Dhaka">Dhaka</option>
              <option value="Chattogram">Chattogram</option>
              <option value="Sylhet">Sylhet</option>
              <option value="Khulna">Khulna</option>
            </select>
          </div>
        </div>

        {/* Product Selector */}
        <div>
          <label className="block font-bold text-slate-700 dark:text-slate-200 mb-1">
            Catalog Product (Merchant · Bin · Stock)
          </label>
          <select
            value={newSku}
            onChange={(e) => {
              setNewSku(e.target.value);
              const p = availableProducts.find((prod) => prod.sku === e.target.value);
              if (p?.color) setNewColor(p.color);
              if (p?.size) setNewSize(p.size);
            }}
            aria-label="Product Catalog"
            className="w-full rounded-xl bg-slate-50 dark:bg-navy-950 border border-slate-200 dark:border-white/10 px-3 py-2 text-navy-800 dark:text-white focus:outline-none focus:border-orange-500 shadow-2xs cursor-pointer"
          >
            {availableProducts.map((p) => (
              <option key={p.sku} value={p.sku}>
                {p.title} ({p.merchantName}) · Bin: {p.bin} · Stock: {p.stock}
              </option>
            ))}
          </select>
        </div>

        {/* Variant Selectors: Color, Size & Quantity */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-3 rounded-xl bg-slate-50 dark:bg-navy-950 border border-slate-200 dark:border-white/10">
          <div>
            <label className="block font-bold text-slate-700 dark:text-slate-200 mb-1 flex items-center justify-between">
              <span className="flex items-center gap-1">
                <Palette className="h-3 w-3 text-orange-500" />
                Color Variant
              </span>
              {(() => {
                const active = POPULAR_COLORS.find((c) => c.name.toLowerCase() === newColor.toLowerCase());
                return active ? (
                  <span
                    className="inline-block w-2.5 h-2.5 rounded-full border border-slate-300 dark:border-white/30"
                    style={{ backgroundColor: active.hex }}
                  />
                ) : null;
              })()}
            </label>
            <select
              value={newColor}
              onChange={(e) => setNewColor(e.target.value)}
              className="w-full rounded-xl bg-white dark:bg-navy-900 border border-slate-200 dark:border-white/10 px-3 py-2 text-navy-800 dark:text-white focus:outline-none focus:border-orange-500 shadow-2xs cursor-pointer"
            >
              {POPULAR_COLORS.map((c) => (
                <option key={c.name} value={c.name}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block font-bold text-slate-700 dark:text-slate-200 mb-1 flex items-center gap-1">
              <Layers className="h-3 w-3 text-emerald-500" />
              Size Variant
            </label>
            <select
              value={newSize}
              onChange={(e) => setNewSize(e.target.value)}
              className="w-full rounded-xl bg-white dark:bg-navy-900 border border-slate-200 dark:border-white/10 px-3 py-2 text-navy-800 dark:text-white focus:outline-none focus:border-orange-500 shadow-2xs cursor-pointer"
            >
              {POPULAR_SIZES.map((sz) => (
                <option key={sz} value={sz}>
                  {sz}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block font-bold text-slate-700 dark:text-slate-200 mb-1">Quantity</label>
            <input
              type="number"
              min={1}
              max={selectedProduct.stock || 20}
              value={newQty}
              onChange={(e) => setNewQty(Math.max(1, Number(e.target.value)))}
              className="w-full rounded-xl bg-white dark:bg-navy-900 border border-slate-200 dark:border-white/10 px-3 py-2 font-mono font-bold text-navy-800 dark:text-white focus:outline-none focus:border-orange-500 shadow-2xs"
            />
          </div>
        </div>

        {/* Pricing Selection Row: Selling Price vs Declared Price */}
        <div className="p-3 rounded-xl bg-slate-50 dark:bg-navy-950/60 border border-slate-200 dark:border-white/10 space-y-1.5">
          <div className="flex items-center justify-between">
            <label className="block text-xs font-bold text-slate-800 dark:text-slate-200">
              Order Selling Price (৳ BDT) *
            </label>
            <span className="text-[11px] text-slate-500 dark:text-slate-400 font-mono">
              Catalog Declared Price: <strong className="text-slate-700 dark:text-slate-200 font-bold">৳{selectedProduct.price}</strong>
            </span>
          </div>
          <div className="relative">
            <span className="absolute left-3.5 top-2.5 font-bold text-slate-400 text-xs">৳</span>
            <input
              type="number"
              min={0}
              required
              value={newUnitPrice}
              onChange={(e) =>
                setNewUnitPrice(e.target.value === '' ? '' : Math.max(0, Number(e.target.value)))
              }
              placeholder={String(selectedProduct.price)}
              className="w-full rounded-xl bg-white dark:bg-navy-900 border border-slate-300 dark:border-white/20 pl-8 pr-3.5 py-2 font-mono font-bold text-sm text-emerald-600 dark:text-emerald-400 focus:outline-none focus:border-orange-500 shadow-2xs"
            />
          </div>
          <p className="text-[10px] text-slate-400">
            Set customer invoice selling price for this specific order. Declared price is the liability catalog value.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block font-bold text-slate-700 dark:text-slate-200 mb-1">
              Reseller Memo Code (4x6&quot; Branded Slip)
            </label>
            <select
              value={newMemoCode}
              onChange={(e) => setNewMemoCode(e.target.value)}
              aria-label="Reseller Memo Template Code"
              className="w-full rounded-xl bg-slate-50 dark:bg-navy-950 border border-slate-200 dark:border-white/10 px-3 py-2 text-navy-800 dark:text-white focus:outline-none focus:border-orange-500 shadow-2xs cursor-pointer"
            >
              {memoList.map((m) => (
                <option key={m.code} value={m.code}>
                  {m.code} — {m.resellerName}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block font-bold text-slate-700 dark:text-slate-200 mb-1">Courier Partner</label>
            <select
              value={newCourier}
              onChange={(e) => setNewCourier(e.target.value as CourierPartner)}
              aria-label="Courier Partner"
              className="w-full rounded-xl bg-slate-50 dark:bg-navy-950 border border-slate-200 dark:border-white/10 px-3 py-2 text-navy-800 dark:text-white focus:outline-none focus:border-orange-500 shadow-2xs cursor-pointer"
            >
              <option value="Steadfast">Steadfast</option>
              <option value="Pathao">Pathao</option>
              <option value="RedX">RedX</option>
            </select>
          </div>
        </div>

        <div className="flex justify-between items-center pt-3 border-t border-slate-200 dark:border-white/10">
          <div className="text-[11px] text-slate-500">
            Selected: <strong className="text-navy-900 dark:text-white">{newColor} / {newSize}</strong> · Total COD: <strong className="text-emerald-600 dark:text-emerald-400 font-mono font-bold">৳{(effectivePrice * newQty).toLocaleString()}</strong>
            <span className="text-[10px] text-slate-400 block font-mono">
              (৳{effectivePrice} × {newQty} pcs)
            </span>
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-navy-800 hover:bg-slate-200 dark:hover:bg-navy-700 text-slate-700 dark:text-slate-200 font-semibold cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 rounded-xl bg-orange-600 hover:bg-orange-700 text-white font-bold cursor-pointer shadow-md shadow-orange-500/20 active:scale-95 transition-all"
            >
              Create &amp; Send to Pick List
            </button>
          </div>
        </div>
      </form>
    </Modal>
  );
}
