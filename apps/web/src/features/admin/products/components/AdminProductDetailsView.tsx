'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import {
  ArrowLeft,
  Package,
  TrendingUp,
  ShoppingCart,
  Truck,
  CheckCircle2,
  Clock,
  Boxes,
  Store,
  MapPin,
  Barcode,
  SlidersHorizontal,
  Layers,
  Phone,
  User,
  ExternalLink,
  Calendar,
  AlertTriangle,
  RotateCcw,
  Palette,
  Maximize2,
  Filter,
} from 'lucide-react';
import { StatusBadge } from '@/components/ui';
import { Modal } from '@/components/admin/AdminModal';
import { WarehouseProductItem, WarehouseBin } from '../types';
import {
  INITIAL_PRODUCTS,
  INITIAL_BINS,
  STORAGE_KEY_PRODUCTS,
  STORAGE_KEY_BINS,
} from '../mockData';

interface AdminProductDetailsViewProps {
  productId: string;
}

export interface ProductVariantStockItem {
  id: string;
  sku: string;
  colorName: string;
  colorHex: string;
  size: string;
  binCode: string;
  stock: number;
  reserved: number;
  available: number;
}

interface ProductOrderRecord {
  id: string;
  orderNumber: string;
  customerName: string;
  customerPhone: string;
  customerAddress: string;
  city: string;
  variant: string;
  qty: number;
  codAmount: number;
  courier: string;
  stage: 'DELIVERED' | 'DISPATCH' | 'PACK' | 'PICK';
  createdAt: string;
}

export function AdminProductDetailsView({ productId }: AdminProductDetailsViewProps) {
  const [product, setProduct] = useState<WarehouseProductItem | null>(null);
  const [bins, setBins] = useState<WarehouseBin[]>(INITIAL_BINS);
  const [isLoading, setIsLoading] = useState(true);

  // Variant Stocks State
  const [variants, setVariants] = useState<ProductVariantStockItem[]>([]);

  // Variant Stock Adjust Modal & Draft State
  const [isAdjustModalOpen, setIsAdjustModalOpen] = useState(false);
  const [draftVariantStocks, setDraftVariantStocks] = useState<Record<string, number>>({});
  const [adjustReason, setAdjustReason] = useState('Stock audit cycle recount');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Load product & bins from localStorage or initial mock data
  useEffect(() => {
    try {
      const storedProducts = localStorage.getItem(STORAGE_KEY_PRODUCTS);
      const allProducts: WarehouseProductItem[] = storedProducts
        ? JSON.parse(storedProducts)
        : INITIAL_PRODUCTS;

      const found = allProducts.find(
        (p) => p.id.toLowerCase() === productId.toLowerCase()
      );
      setProduct(found || null);

      const storedBins = localStorage.getItem(STORAGE_KEY_BINS);
      if (storedBins) {
        setBins(JSON.parse(storedBins));
      }
    } catch (err) {
      console.warn('Error loading product details from localStorage', err);
      const found = INITIAL_PRODUCTS.find(
        (p) => p.id.toLowerCase() === productId.toLowerCase()
      );
      setProduct(found || null);
    } finally {
      setIsLoading(false);
    }
  }, [productId]);

  // Generate or load variants breakdown for this product
  useEffect(() => {
    if (!product) return;

    const storageKey = `fulfillio_variants_${product.id}`;
    const savedVariants = localStorage.getItem(storageKey);
    if (savedVariants) {
      try {
        setVariants(JSON.parse(savedVariants));
        return;
      } catch {
        // fallback to generate
      }
    }

    // Generate realistic color & size variant matrix based on category & master product
    const isApparel = product.category === 'Apparel';
    const isFootwear = product.category === 'Footwear';
    const isElectronics = product.category === 'Electronics';

    const baseSku = product.fullSku.split('-').slice(0, 3).join('-');

    let generated: ProductVariantStockItem[] = [];

    if (isFootwear) {
      const shoeSizes = ['EU 40', 'EU 41', 'EU 42', 'EU 43', 'EU 44'];
      const shares = [0.12, 0.22, 0.35, 0.21, 0.1];
      generated = shoeSizes.map((sz, idx) => {
        const stockUnits = Math.round(product.stock * shares[idx]);
        const reserved = Math.min(stockUnits, Math.round(stockUnits * 0.15));
        return {
          id: `${product.id}-VAR-${idx + 1}`,
          sku: `${baseSku}-${product.color.toUpperCase().slice(0, 3)}-${sz.replace('EU ', '')}`,
          colorName: product.color,
          colorHex: '#92400e',
          size: sz,
          binCode: product.binCode,
          stock: stockUnits,
          reserved,
          available: Math.max(0, stockUnits - reserved),
        };
      });
    } else if (isElectronics) {
      const colors = [
        { name: 'Matte Obsidian', hex: '#111827', size: 'Standard Edition', share: 0.5 },
        { name: 'Space Silver', hex: '#64748b', size: 'Standard Edition', share: 0.3 },
        { name: 'Midnight Blue', hex: '#1e3a8a', size: 'Pro Edition', share: 0.2 },
      ];
      generated = colors.map((c, idx) => {
        const stockUnits = Math.round(product.stock * c.share);
        const reserved = Math.min(stockUnits, Math.round(stockUnits * 0.12));
        return {
          id: `${product.id}-VAR-${idx + 1}`,
          sku: `${baseSku}-${c.name.slice(0, 3).toUpperCase()}-${idx + 1}`,
          colorName: c.name,
          colorHex: c.hex,
          size: c.size,
          binCode: product.binCode,
          stock: stockUnits,
          reserved,
          available: Math.max(0, stockUnits - reserved),
        };
      });
    } else {
      // Apparel (Default): Multiple sizes and secondary color
      const apparelVariants = [
        { color: product.color, hex: '#0f172a', size: 'S', share: 0.15 },
        { color: product.color, hex: '#0f172a', size: 'M', share: 0.25 },
        { color: product.color, hex: '#0f172a', size: 'L', share: 0.32 },
        { color: product.color, hex: '#0f172a', size: 'XL', share: 0.18 },
        { color: 'Midnight Navy', hex: '#1e3a8a', size: 'M', share: 0.05 },
        { color: 'Midnight Navy', hex: '#1e3a8a', size: 'L', share: 0.05 },
      ];

      generated = apparelVariants.map((item, idx) => {
        const stockUnits = Math.round(product.stock * item.share);
        const reserved = Math.min(stockUnits, Math.round(stockUnits * 0.12));
        const colorTag = item.color.toUpperCase().slice(0, 3);
        return {
          id: `${product.id}-VAR-${idx + 1}`,
          sku: `${baseSku}-${colorTag}-${item.size}`,
          colorName: item.color,
          colorHex: item.hex,
          size: item.size,
          binCode: idx >= 4 ? 'A-01-04' : product.binCode,
          stock: stockUnits,
          reserved,
          available: Math.max(0, stockUnits - reserved),
        };
      });
    }

    setVariants(generated);
  }, [product]);

  // Open Variant Stock Adjust Modal and populate drafts
  const handleOpenAdjustModal = () => {
    const draft: Record<string, number> = {};
    variants.forEach((v) => {
      draft[v.id] = v.stock;
    });
    setDraftVariantStocks(draft);
    setIsAdjustModalOpen(true);
  };

  const handleUpdateDraftStock = (variantId: string, value: number) => {
    setDraftVariantStocks((prev) => ({
      ...prev,
      [variantId]: Math.max(0, value),
    }));
  };

  const handleDeltaDraftStock = (variantId: string, delta: number) => {
    setDraftVariantStocks((prev) => {
      const current = prev[variantId] ?? 0;
      return {
        ...prev,
        [variantId]: Math.max(0, current + delta),
      };
    });
  };

  // Save all modified variant stocks
  const handleSaveVariantStockAdjustments = () => {
    if (!product) return;

    const updated = variants.map((v) => {
      const newStock = Math.max(0, draftVariantStocks[v.id] ?? v.stock);
      const reserved = Math.min(newStock, v.reserved);
      return {
        ...v,
        stock: newStock,
        reserved,
        available: Math.max(0, newStock - reserved),
      };
    });

    setVariants(updated);

    try {
      localStorage.setItem(`fulfillio_variants_${product.id}`, JSON.stringify(updated));
    } catch (err) {
      console.warn('Could not save variants to localStorage', err);
    }

    const totalUnits = updated.reduce((acc, curr) => acc + curr.stock, 0);
    setProduct((prod) => (prod ? { ...prod, stock: totalUnits } : null));

    try {
      const storedProducts = localStorage.getItem(STORAGE_KEY_PRODUCTS);
      if (storedProducts) {
        const all: WarehouseProductItem[] = JSON.parse(storedProducts);
        const next = all.map((p) => (p.id === product.id ? { ...p, stock: totalUnits } : p));
        localStorage.setItem(STORAGE_KEY_PRODUCTS, JSON.stringify(next));
      }
    } catch (e) {
      console.warn('Could not update master product stock', e);
    }

    showToast(`Stock updated for ${updated.length} variants! Total stock: ${totalUnits} pcs.`);
    setIsAdjustModalOpen(false);
  };

  // Find assigned bin info
  const assignedBin = useMemo(() => {
    if (!product) return null;
    return bins.find((b) => b.code === product.binCode) || {
      code: product.binCode,
      zone: 'Zone A',
      description: 'Standard Fast-Moving Bay',
      capacityUnits: 250,
      createdAt: '2026-10-01',
    };
  }, [product, bins]);

  // Derived Performance & Order Stats
  const stats = useMemo(() => {
    if (!product) {
      return {
        totalSold: 148,
        totalRevenue: 214600,
        totalOrders: 112,
        delivered: 96,
        pendingDelivery: 16,
      };
    }

    const seed = product.id.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    const totalOrders = 65 + (seed % 90);
    const avgQtyPerOrder = 1.3;
    const totalSold = Math.round(totalOrders * avgQtyPerOrder);
    const totalRevenue = totalSold * product.price;
    const delivered = Math.round(totalOrders * 0.84);
    const pendingDelivery = totalOrders - delivered;

    return {
      totalSold,
      totalRevenue,
      totalOrders,
      delivered,
      pendingDelivery,
    };
  }, [product]);

  // 3 Latest Customer Orders for this specific product
  const recentOrders = useMemo<ProductOrderRecord[]>(() => {
    if (!product) return [];

    const defaultNames = [
      { name: 'Tariqul Islam', phone: '01812-345678', address: 'House 14, Road 7, Dhanmondi, Dhaka', city: 'Dhaka', courier: 'Steadfast', variant: `${product.color} / L` },
      { name: 'Kazi Mahbub', phone: '01712-987654', address: 'Sector 4, Road 12, Uttara, Dhaka', city: 'Dhaka', courier: 'Pathao', variant: `${product.color} / M` },
      { name: 'Tanvir Ahmed', phone: '01911-223344', address: 'GEC Circle, Nasirabad, Chattogram', city: 'Chattogram', courier: 'Steadfast', variant: `${product.color} / XL` },
    ];

    const stages: ('DELIVERED' | 'DISPATCH' | 'PICK')[] = [
      'DELIVERED',
      'DISPATCH',
      'PICK',
    ];

    const dates = [
      'Today, 10:15 AM',
      'Today, 09:30 AM',
      'Yesterday, 04:20 PM',
    ];

    return defaultNames.map((item, idx) => {
      const orderNum = 9820 + idx;
      const qty = idx === 1 ? 2 : 1;
      return {
        id: `ORD-${orderNum}`,
        orderNumber: `ORD-${orderNum}`,
        customerName: item.name,
        customerPhone: item.phone,
        customerAddress: item.address,
        city: item.city,
        variant: item.variant,
        qty,
        codAmount: product.price * qty,
        courier: item.courier,
        stage: stages[idx],
        createdAt: dates[idx],
      };
    });
  }, [product]);

  // Total stock calculated from variants
  const totalVariantStock = useMemo(() => {
    if (variants.length === 0 && product) return product.stock;
    return variants.reduce((acc, v) => acc + v.stock, 0);
  }, [variants, product]);

  const totalVariantReserved = useMemo(() => {
    return variants.reduce((acc, v) => acc + v.reserved, 0);
  }, [variants]);


  if (isLoading) {
    return (
      <div className="p-12 text-center text-slate-500 dark:text-slate-400 text-sm animate-pulse">
        Loading product details and variant inventory...
      </div>
    );
  }

  if (!product) {
    return (
      <div className="rounded-3xl border border-dashed border-slate-300 dark:border-white/10 p-12 text-center max-w-lg mx-auto my-12 bg-white dark:bg-navy-900 shadow-xl">
        <Package className="h-12 w-12 text-slate-400 mx-auto mb-3" />
        <h2 className="text-xl font-bold text-navy-900 dark:text-white">Product Not Found</h2>
        <p className="text-sm text-slate-600 dark:text-slate-300 mt-1">
          No warehouse SKU matches the identifier &quot;{productId}&quot;.
        </p>
        <Link
          href="/admin/products"
          className="mt-5 inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-orange-600 hover:bg-orange-700 text-xs font-bold text-white transition-all shadow-md shadow-orange-500/20"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Back to Warehouse Products</span>
        </Link>
      </div>
    );
  }

  const isLowStock = product.stock < 30;

  // Search filter query parameter for Orders page
  const orderSearchQuery = product.fullSku.split('-').slice(0, 3).join('-') || product.fullSku;

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-6 right-6 z-50 bg-orange-600 text-white px-4 py-2.5 rounded-xl shadow-2xl flex items-center gap-2 text-xs font-bold animate-in fade-in slide-in-from-top-2">
          <CheckCircle2 className="w-4 h-4" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Top Breadcrumb & Page Action Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link
            href="/admin/products"
            className="p-2.5 rounded-xl bg-white dark:bg-navy-900 border border-slate-200 dark:border-white/10 text-slate-700 dark:text-slate-200 hover:text-orange-600 dark:hover:text-orange-400 hover:border-orange-500/30 transition-colors shadow-2xs"
            title="Return to Products Catalog"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs uppercase font-bold text-orange-600 dark:text-orange-400 tracking-wider">
                Product Specification &amp; Variant Inventory
              </span>
              <span className="text-slate-400 dark:text-slate-600">·</span>
              <span className="text-xs tabular-nums text-slate-500 dark:text-slate-400 font-mono">
                {product.id}
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-navy-900 dark:text-white leading-tight">
              {product.title}
            </h1>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={handleOpenAdjustModal}
            className="px-4 py-2.5 rounded-xl bg-white dark:bg-navy-900 hover:bg-slate-100 dark:hover:bg-navy-800 border border-slate-200 dark:border-white/10 text-xs font-bold text-navy-800 dark:text-slate-100 flex items-center gap-2 shadow-2xs transition-colors cursor-pointer"
          >
            <SlidersHorizontal className="w-4 h-4 text-orange-600 dark:text-orange-400" />
            <span>Master Stock Adjust</span>
          </button>
        </div>
      </div>

      {/* TOP KPI CARDS: Total Sold, Orders, Delivered, Pending, Stock */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {/* 1. Total Units Sold */}
        <div className="p-5 rounded-2xl bg-white dark:bg-navy-900 border border-slate-200 dark:border-white/10 shadow-lg">
          <div className="flex justify-between items-start">
            <span className="text-xs uppercase font-bold text-slate-500 dark:text-slate-400">Total Units Sold</span>
            <div className="p-2 rounded-xl bg-orange-500/10 text-orange-600 dark:text-orange-400 border border-orange-500/20">
              <TrendingUp className="h-4 w-4" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold mt-2 tabular-nums text-navy-900 dark:text-white">
            {stats.totalSold.toLocaleString()} <span className="text-xs font-semibold text-slate-500">pcs</span>
          </div>
          <span className="text-xs text-orange-600 dark:text-orange-400 mt-1 inline-block font-semibold">
            ৳{stats.totalRevenue.toLocaleString()} volume
          </span>
        </div>

        {/* 2. Total Orders Placed */}
        <div className="p-5 rounded-2xl bg-white dark:bg-navy-900 border border-slate-200 dark:border-white/10 shadow-lg">
          <div className="flex justify-between items-start">
            <span className="text-xs uppercase font-bold text-slate-500 dark:text-slate-400">Total Orders</span>
            <div className="p-2 rounded-xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20">
              <ShoppingCart className="h-4 w-4" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold mt-2 tabular-nums text-navy-900 dark:text-white">
            {stats.totalOrders}
          </div>
          <span className="text-xs text-slate-600 dark:text-slate-300 mt-1 inline-block">
            Across online merchant channels
          </span>
        </div>

        {/* 3. Delivered Successfully */}
        <div className="p-5 rounded-2xl bg-white dark:bg-navy-900 border border-slate-200 dark:border-white/10 shadow-lg">
          <div className="flex justify-between items-start">
            <span className="text-xs uppercase font-bold text-slate-500 dark:text-slate-400">Delivered</span>
            <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
              <CheckCircle2 className="h-4 w-4" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold mt-2 tabular-nums text-emerald-600 dark:text-emerald-400">
            {stats.delivered}
          </div>
          <span className="text-xs text-emerald-600 dark:text-emerald-400 mt-1 inline-block font-semibold">
            {Math.round((stats.delivered / stats.totalOrders) * 100)}% delivery success
          </span>
        </div>

        {/* 4. Pending Delivery / In Fulfillment */}
        <div className="p-5 rounded-2xl bg-white dark:bg-navy-900 border border-slate-200 dark:border-white/10 shadow-lg">
          <div className="flex justify-between items-start">
            <span className="text-xs uppercase font-bold text-slate-500 dark:text-slate-400">Pending Delivery</span>
            <div className="p-2 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
              <Clock className="h-4 w-4" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold mt-2 tabular-nums text-amber-600 dark:text-amber-400">
            {stats.pendingDelivery}
          </div>
          <span className="text-xs text-amber-600 dark:text-amber-400 mt-1 inline-block font-medium">
            In Pick, Pack &amp; Transit
          </span>
        </div>

        {/* 5. Physical Warehouse Stock */}
        <div className="p-5 rounded-2xl bg-white dark:bg-navy-900 border border-slate-200 dark:border-white/10 shadow-lg">
          <div className="flex justify-between items-start">
            <span className="text-xs uppercase font-bold text-slate-500 dark:text-slate-400">Physical Stock</span>
            <div
              className={`p-2 rounded-xl border ${
                isLowStock
                  ? 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20'
                  : 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20'
              }`}
            >
              <Boxes className="h-4 w-4" />
            </div>
          </div>
          <div
            className={`text-2xl sm:text-3xl font-extrabold mt-2 tabular-nums ${
              isLowStock ? 'text-rose-600 dark:text-rose-400' : 'text-navy-900 dark:text-white'
            }`}
          >
            {totalVariantStock} <span className="text-xs font-semibold text-slate-500">pcs</span>
          </div>
          <span className="text-xs text-slate-600 dark:text-slate-300 mt-1 inline-block">
            {variants.length} active variants in Bin <strong className="text-orange-600 dark:text-orange-400 tabular-nums">{product.binCode}</strong>
          </span>
        </div>
      </div>

      {/* SECTION 1: Product Identity Card (Left) & Color & Size Variant Matrix Table (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column (4 Cols): Product Identity & Physical Storage Card */}
        <div className="lg:col-span-4 space-y-6">
          <div className="rounded-2xl bg-white dark:bg-navy-900 border border-slate-200 dark:border-white/10 p-5 shadow-lg space-y-5">
            {/* Image Preview & SKU Badges */}
            <div className="flex items-start gap-4">
              <img
                src={product.imageUrl}
                alt={product.title}
                className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl object-cover border border-slate-200 dark:border-white/10 shrink-0 shadow-sm"
              />
              <div className="min-w-0 flex-1 space-y-1.5">
                <span className="px-2.5 py-0.5 rounded-lg text-xs font-bold bg-slate-100 dark:bg-navy-800 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-white/10 inline-block">
                  {product.category}
                </span>
                <h3 className="font-extrabold text-base text-navy-900 dark:text-white leading-snug line-clamp-2">
                  {product.title}
                </h3>
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-xs font-mono font-bold text-orange-600 dark:text-orange-400">
                    {product.fullSku}
                  </span>
                  <StatusBadge status="Approved" />
                </div>
              </div>
            </div>

            {/* Specifications Grid */}
            <div className="border-t border-slate-200 dark:border-white/10 pt-4 grid grid-cols-2 gap-3 text-xs">
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-navy-950/60 border border-slate-200/80 dark:border-white/10">
                <span className="text-slate-500 dark:text-slate-400 block font-medium">Selling Price</span>
                <span className="text-sm font-extrabold text-navy-900 dark:text-white tabular-nums block mt-0.5">
                  ৳{product.price.toLocaleString()}
                </span>
              </div>

              <div className="p-3 rounded-xl bg-slate-50 dark:bg-navy-950/60 border border-slate-200/80 dark:border-white/10">
                <span className="text-slate-500 dark:text-slate-400 block font-medium">Primary Variant</span>
                <span className="text-sm font-bold text-navy-900 dark:text-white block mt-0.5">
                  {product.color} / {product.size}
                </span>
              </div>

              <div className="p-3 rounded-xl bg-slate-50 dark:bg-navy-950/60 border border-slate-200/80 dark:border-white/10">
                <span className="text-slate-500 dark:text-slate-400 block font-medium">Merchant Store</span>
                <span className="text-xs font-bold text-navy-900 dark:text-white block mt-0.5 truncate">
                  {product.merchantName}
                </span>
                <span className="text-[10px] text-slate-500 font-mono">({product.merchantCode})</span>
              </div>

              <div className="p-3 rounded-xl bg-slate-50 dark:bg-navy-950/60 border border-slate-200/80 dark:border-white/10">
                <span className="text-slate-500 dark:text-slate-400 block font-medium">Total Physical Units</span>
                <span
                  className={`text-sm font-extrabold tabular-nums block mt-0.5 ${
                    isLowStock ? 'text-rose-600 dark:text-rose-400' : 'text-emerald-600 dark:text-emerald-400'
                  }`}
                >
                  {totalVariantStock} units
                </span>
                <span className="text-[10px] text-slate-500">Across {variants.length} variants</span>
              </div>
            </div>

            {/* Warehouse Bin Slotting Info */}
            <div className="p-3.5 rounded-xl bg-orange-500/5 dark:bg-orange-500/10 border border-orange-500/20 space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-orange-600 dark:text-orange-400" />
                  <span className="text-xs font-bold text-navy-900 dark:text-white">
                    Master Bin Slot
                  </span>
                </div>
                <span className="px-2 py-0.5 rounded-md text-xs font-mono font-bold bg-orange-500 text-white">
                  {product.binCode}
                </span>
              </div>
              <p className="text-xs text-slate-600 dark:text-slate-300">
                {assignedBin?.description || 'Fast moving fulfillment slot in Warehouse Zone A.'}
              </p>
              <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400 pt-1 border-t border-orange-500/20">
                <span>Capacity: <strong>{assignedBin?.capacityUnits || 250} units</strong></span>
                <span>Zone: <strong>{assignedBin?.zone || 'Zone A'}</strong></span>
              </div>
            </div>

            {/* Simulated Barcode & Inbound Info */}
            <div className="border-t border-slate-200 dark:border-white/10 pt-4 flex items-center justify-between gap-4 text-xs">
              <div>
                <span className="text-slate-500 dark:text-slate-400 block font-medium">Inbound Timestamp</span>
                <span className="font-semibold text-navy-900 dark:text-white block mt-0.5">
                  {product.submittedAt}
                </span>
              </div>
              <div className="text-right">
                <span className="text-slate-500 dark:text-slate-400 block font-medium">Barcode / EAN-13</span>
                <div className="flex items-center gap-1.5 font-mono text-xs font-bold text-navy-900 dark:text-slate-100 justify-end mt-0.5">
                  <Barcode className="w-4 h-4 text-slate-500" />
                  <span>880{product.fullSku.replace(/[^0-9]/g, '').slice(0, 7) || '912048'}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column (8 Cols): COLOR & SIZE VARIANT STOCK MATRIX TABLE */}
        <div className="lg:col-span-8 space-y-4">
          <div className="rounded-2xl bg-white dark:bg-navy-900 border border-slate-200 dark:border-white/10 shadow-lg overflow-hidden">
            {/* Matrix Header */}
            <div className="p-5 border-b border-slate-200 dark:border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-extrabold text-base sm:text-lg text-navy-900 dark:text-white tracking-tight flex items-center gap-2">
                    <Palette className="w-4 h-4 text-orange-600 dark:text-orange-400" />
                    <span>Color &amp; Size Variant Inventory Matrix</span>
                  </h3>
                  <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-orange-500/10 text-orange-600 dark:text-orange-400 border border-orange-500/20">
                    {variants.length} Variants
                  </span>
                </div>
                <p className="text-xs text-slate-600 dark:text-slate-300 mt-0.5">
                  Physical warehouse stock breakdown for each specific color and size SKU.
                </p>
              </div>

              <div className="text-right shrink-0">
                <span className="text-xs text-slate-500 dark:text-slate-400">Total Available: </span>
                <strong className="text-sm font-extrabold text-orange-600 dark:text-orange-400 tabular-nums">
                  {totalVariantStock - totalVariantReserved} pcs
                </strong>
              </div>
            </div>

            {/* Matrix Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead className="bg-slate-50/80 dark:bg-navy-950/80 text-[11px] uppercase tracking-wider text-slate-600 dark:text-slate-300 font-bold border-b border-slate-200 dark:border-white/10">
                  <tr>
                    <th className="py-3 px-4">Color</th>
                    <th className="py-3 px-3">Size</th>
                    <th className="py-3 px-3">Variant SKU</th>
                    <th className="py-3 px-3">Bin</th>
                    <th className="py-3 px-3 text-center">Physical Stock</th>
                    <th className="py-3 px-3 text-center">Reserved</th>
                    <th className="py-3 px-4 text-center">Available</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200/70 dark:divide-white/10 font-medium">
                  {variants.map((v) => {
                    return (
                      <tr
                        key={v.id}
                        className="hover:bg-slate-50 dark:hover:bg-navy-800/40 transition-colors"
                      >
                        {/* Color */}
                        <td className="py-3 px-4 align-middle">
                          <div className="flex items-center gap-2">
                            <span
                              className="w-3.5 h-3.5 rounded-full inline-block border border-slate-300 dark:border-white/20 shadow-2xs shrink-0"
                              style={{ backgroundColor: v.colorHex }}
                            />
                            <span className="font-bold text-navy-900 dark:text-white whitespace-nowrap">
                              {v.colorName}
                            </span>
                          </div>
                        </td>

                        {/* Size */}
                        <td className="py-3 px-3 align-middle">
                          <span className="px-2.5 py-1 rounded-md text-xs font-extrabold bg-slate-100 dark:bg-navy-800 text-navy-900 dark:text-slate-100 border border-slate-200 dark:border-white/10 inline-block">
                            {v.size}
                          </span>
                        </td>

                        {/* Variant SKU */}
                        <td className="py-3 px-3 align-middle">
                          <span className="font-mono font-bold text-orange-600 dark:text-orange-400 whitespace-nowrap">
                            {v.sku}
                          </span>
                        </td>

                        {/* Bin */}
                        <td className="py-3 px-3 align-middle">
                          <span className="font-mono text-slate-600 dark:text-slate-300 font-semibold">
                            {v.binCode}
                          </span>
                        </td>

                        {/* Physical Stock */}
                        <td className="py-3 px-3 text-center align-middle">
                          <span className="font-extrabold tabular-nums text-navy-900 dark:text-white">
                            {v.stock} <span className="text-[11px] font-normal text-slate-500">pcs</span>
                          </span>
                        </td>

                        {/* Reserved */}
                        <td className="py-3 px-3 text-center tabular-nums text-slate-500 font-semibold align-middle">
                          {v.reserved} pcs
                        </td>

                        {/* Available: Green if >20, Red if <10, Amber if 10-20 */}
                        <td className="py-3 px-4 text-center align-middle">
                          <span
                            className={`tabular-nums font-bold ${
                              v.available > 20
                                ? 'text-emerald-600 dark:text-emerald-400'
                                : v.available < 10
                                ? 'text-rose-600 dark:text-rose-400'
                                : 'text-amber-600 dark:text-amber-400'
                            }`}
                          >
                            {v.available} pcs
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
                {/* Table Summary Footer */}
                <tfoot className="bg-slate-50 dark:bg-navy-950 font-bold text-xs text-navy-900 dark:text-white border-t border-slate-200 dark:border-white/10">
                  <tr>
                    <td colSpan={4} className="py-3 px-4">
                      Total Across All Variants:
                    </td>
                    <td className="py-3 px-3 text-center tabular-nums text-orange-600 dark:text-orange-400 font-extrabold">
                      {totalVariantStock} pcs
                    </td>
                    <td className="py-3 px-3 text-center tabular-nums text-slate-500">
                      {totalVariantReserved} pcs
                    </td>
                    <td className="py-3 px-4 text-center tabular-nums text-emerald-600 dark:text-emerald-400 font-extrabold">
                      {totalVariantStock - totalVariantReserved} pcs
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>
        </div>
      </div>

      {/* SECTION 2: RECENT CUSTOMER ORDERS (3 Latest) + VIEW ALL IN PIPELINE ACTION */}
      <div className="space-y-4">
        <div className="rounded-2xl bg-white dark:bg-navy-900 border border-slate-200 dark:border-white/10 shadow-lg overflow-hidden">
          {/* Section Header */}
          <div className="p-5 border-b border-slate-200 dark:border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-extrabold text-base sm:text-lg text-navy-900 dark:text-white tracking-tight flex items-center gap-2">
                  <ShoppingCart className="w-4 h-4 text-orange-600 dark:text-orange-400" />
                  <span>Recent Customer Orders for this Product</span>
                </h3>
                <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-orange-500/10 text-orange-600 dark:text-orange-400 border border-orange-500/20">
                  3 Latest Orders
                </span>
              </div>
              <p className="text-xs text-slate-600 dark:text-slate-300 mt-0.5">
                Most recent customer dispatches with customer name, contact phone, and delivery destination.
              </p>
            </div>

            <Link
              href={`/admin/orders?search=${encodeURIComponent(orderSearchQuery)}`}
              className="px-4 py-2 rounded-xl bg-orange-600 hover:bg-orange-700 text-xs font-bold text-white flex items-center gap-2 shadow-md shadow-orange-500/25 transition-all cursor-pointer shrink-0"
              title="View all pipeline orders for this product"
            >
              <Layers className="w-4 h-4" />
              <span>View All Orders for this SKU</span>
              <ExternalLink className="w-3.5 h-3.5 ml-0.5" />
            </Link>
          </div>

          {/* 3 Orders Table */}
          <div className="divide-y divide-slate-200/80 dark:divide-white/10 overflow-x-auto">
            {recentOrders.map((order) => {
              const isDelivered = order.stage === 'DELIVERED';
              const isDispatched = order.stage === 'DISPATCH';
              const isPicking = order.stage === 'PICK';

              const stageBadge = isDelivered ? (
                <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30">
                  Delivered
                </span>
              ) : isDispatched ? (
                <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-sky-500/15 text-sky-700 dark:text-sky-300 border border-sky-500/30">
                  In Transit
                </span>
              ) : (
                <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-indigo-500/15 text-indigo-700 dark:text-indigo-300 border border-indigo-500/30">
                  Ready to Pick
                </span>
              );

              return (
                <div
                  key={order.id}
                  className="p-4 sm:p-5 hover:bg-slate-50 dark:hover:bg-navy-800/40 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-xs"
                >
                  {/* Customer, Phone & Delivery Address */}
                  <div className="space-y-1.5 min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-mono font-bold text-orange-600 dark:text-orange-400 tabular-nums">
                        {order.orderNumber}
                      </span>
                      <span className="text-slate-400">·</span>
                      <div className="flex items-center gap-1 font-bold text-navy-900 dark:text-white">
                        <User className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span>{order.customerName}</span>
                      </div>
                      <span className="text-slate-400">·</span>
                      <span className="text-slate-500 dark:text-slate-400 font-mono">
                        {order.customerPhone}
                      </span>
                      <span className="text-slate-400">·</span>
                      <span className="px-2 py-0.5 rounded bg-slate-100 dark:bg-navy-800 text-[10px] font-semibold text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-white/10">
                        {order.variant}
                      </span>
                    </div>

                    {/* Address & City */}
                    <div className="flex items-start gap-1.5 text-slate-600 dark:text-slate-300">
                      <MapPin className="w-3.5 h-3.5 text-orange-500 shrink-0 mt-0.5" />
                      <span className="line-clamp-1">{order.customerAddress} ({order.city})</span>
                    </div>

                    <div className="flex items-center gap-3 text-[11px] text-slate-500 dark:text-slate-400 pt-0.5">
                      <span>Ordered: <strong>{order.createdAt}</strong></span>
                      <span>·</span>
                      <span>Courier: <strong>{order.courier}</strong></span>
                    </div>
                  </div>

                  {/* Price & Stage Status */}
                  <div className="flex sm:flex-col items-center sm:items-end justify-between sm:justify-center gap-1.5 shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-200/60 dark:border-white/10">
                    <div>{stageBadge}</div>
                    <div className="text-right">
                      <span className="font-extrabold text-sm text-navy-900 dark:text-white tabular-nums block">
                        ৳{order.codAmount.toLocaleString()}
                      </span>
                      <span className="text-[11px] text-slate-500 dark:text-slate-400 block">
                        {order.qty} unit{order.qty > 1 ? 's' : ''} (COD)
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Variant Stock Adjust Modal */}
      <Modal
        isOpen={isAdjustModalOpen}
        onClose={() => setIsAdjustModalOpen(false)}
        title="Adjust Variant Physical Inventory (Color & Size)"
        size="lg"
      >
        <div className="space-y-4">
          {/* Product Summary Header */}
          <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-navy-950 border border-slate-200 dark:border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0">
              <img
                src={product.imageUrl}
                alt={product.title}
                className="w-12 h-12 rounded-xl object-cover border border-slate-200 dark:border-white/10 shrink-0"
              />
              <div className="text-xs space-y-0.5 min-w-0">
                <div className="font-bold text-navy-900 dark:text-white truncate">{product.title}</div>
                <div className="tabular-nums font-mono font-bold text-orange-600 dark:text-orange-400">
                  {product.fullSku}
                </div>
                <div className="text-slate-500 dark:text-slate-400">
                  Bin: <strong className="text-orange-600 dark:text-orange-400 font-mono">{product.binCode}</strong> · Category: <strong className="text-navy-900 dark:text-white">{product.category}</strong>
                </div>
              </div>
            </div>

            <div className="text-right shrink-0 bg-white dark:bg-navy-900 px-3.5 py-2 rounded-xl border border-slate-200 dark:border-white/10">
              <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 block">Total After Adjust</span>
              <span className="text-base font-extrabold text-orange-600 dark:text-orange-400 tabular-nums">
                {variants.reduce((sum, v) => sum + (draftVariantStocks[v.id] ?? v.stock), 0)} pcs
              </span>
            </div>
          </div>

          {/* Variants Adjustment Table */}
          <div className="border border-slate-200 dark:border-white/10 rounded-xl overflow-hidden">
            <div className="max-h-72 overflow-y-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead className="bg-slate-100/90 dark:bg-navy-950/90 sticky top-0 z-10 text-[11px] uppercase tracking-wider text-slate-600 dark:text-slate-300 font-bold border-b border-slate-200 dark:border-white/10">
                  <tr>
                    <th className="py-2.5 px-3">Variant (Color / Size)</th>
                    <th className="py-2.5 px-2">SKU &amp; Bin</th>
                    <th className="py-2.5 px-2 text-center">Current</th>
                    <th className="py-2.5 px-3 text-center">Adjusted Physical Units</th>
                    <th className="py-2.5 px-3 text-right">Balance Change</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200/80 dark:divide-white/10 font-medium">
                  {variants.map((v) => {
                    const currentDraft = draftVariantStocks[v.id] ?? v.stock;
                    const diff = currentDraft - v.stock;

                    return (
                      <tr key={v.id} className="hover:bg-slate-50 dark:hover:bg-navy-800/40">
                        {/* Variant Color & Size */}
                        <td className="py-2.5 px-3 align-middle">
                          <div className="flex items-center gap-2">
                            <span
                              className="w-3.5 h-3.5 rounded-full inline-block border border-slate-300 dark:border-white/20 shrink-0"
                              style={{ backgroundColor: v.colorHex }}
                            />
                            <div>
                              <span className="font-bold text-navy-900 dark:text-white block">
                                {v.colorName}
                              </span>
                              <span className="px-1.5 py-0.5 rounded text-[10px] font-extrabold bg-slate-100 dark:bg-navy-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-white/10 inline-block mt-0.5">
                                Size {v.size}
                              </span>
                            </div>
                          </div>
                        </td>

                        {/* SKU & Bin */}
                        <td className="py-2.5 px-2 align-middle">
                          <div className="font-mono text-[11px] font-bold text-orange-600 dark:text-orange-400">
                            {v.sku}
                          </div>
                          <div className="text-[10px] text-slate-500 font-mono">
                            Bin: {v.binCode}
                          </div>
                        </td>

                        {/* Current */}
                        <td className="py-2.5 px-2 text-center align-middle font-bold tabular-nums text-slate-600 dark:text-slate-300">
                          {v.stock} pcs
                        </td>

                        {/* Adjusted Physical Units (+ / - and direct input) */}
                        <td className="py-2.5 px-3 text-center align-middle">
                          <div className="inline-flex items-center rounded-lg p-0.5 border border-slate-200 dark:border-white/10 bg-white dark:bg-navy-950 shadow-2xs">
                            <button
                              type="button"
                              onClick={() => handleDeltaDraftStock(v.id, -1)}
                              disabled={currentDraft <= 0}
                              className="w-6 h-6 rounded flex items-center justify-center font-bold text-slate-700 dark:text-slate-200 hover:text-white hover:bg-orange-600 disabled:opacity-30 transition-colors cursor-pointer"
                              title="Decrease by 1"
                            >
                              -
                            </button>
                            <input
                              type="number"
                              min={0}
                              value={currentDraft}
                              onChange={(e) =>
                                handleUpdateDraftStock(v.id, parseInt(e.target.value) || 0)
                              }
                              className="w-12 text-center text-xs font-extrabold tabular-nums bg-transparent text-navy-900 dark:text-white focus:outline-none"
                            />
                            <button
                              type="button"
                              onClick={() => handleDeltaDraftStock(v.id, 1)}
                              className="w-6 h-6 rounded flex items-center justify-center font-bold text-slate-700 dark:text-slate-200 hover:text-white hover:bg-orange-600 transition-colors cursor-pointer"
                              title="Increase by 1"
                            >
                              +
                            </button>
                          </div>
                        </td>

                        {/* Balance Change */}
                        <td className="py-2.5 px-3 text-right align-middle tabular-nums font-bold">
                          {diff > 0 ? (
                            <span className="text-emerald-600 dark:text-emerald-400">+{diff} pcs</span>
                          ) : diff < 0 ? (
                            <span className="text-rose-600 dark:text-rose-400">{diff} pcs</span>
                          ) : (
                            <span className="text-slate-400 font-normal">No change</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Adjustment Reason */}
          <div>
            <label className="block text-xs font-bold text-navy-900 dark:text-slate-200 mb-1.5">
              Adjustment Reason &amp; Audit Reference
            </label>
            <select
              value={adjustReason}
              onChange={(e) => setAdjustReason(e.target.value)}
              className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-navy-950 border border-slate-300 dark:border-white/15 text-navy-900 dark:text-slate-100 focus:outline-none focus:border-orange-500 font-medium"
            >
              <option value="Stock audit cycle recount">Stock audit cycle recount</option>
              <option value="New inbound shipment verified">New inbound shipment verified</option>
              <option value="Damaged item write-off">Damaged item write-off</option>
              <option value="Manual discrepancy correction">Manual discrepancy correction</option>
            </select>
          </div>

          {/* Modal Actions */}
          <div className="flex items-center justify-between pt-3 border-t border-slate-200 dark:border-white/10">
            <button
              type="button"
              onClick={() => {
                const resetDraft: Record<string, number> = {};
                variants.forEach((v) => {
                  resetDraft[v.id] = v.stock;
                });
                setDraftVariantStocks(resetDraft);
              }}
              className="text-xs font-bold text-slate-500 hover:text-orange-600 dark:hover:text-orange-400 transition-colors cursor-pointer"
            >
              Reset to Current
            </button>

            <div className="flex items-center gap-2.5">
              <button
                type="button"
                onClick={() => setIsAdjustModalOpen(false)}
                className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-navy-800 hover:bg-slate-200 dark:hover:bg-navy-700 text-slate-700 dark:text-slate-200 text-xs font-semibold cursor-pointer transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSaveVariantStockAdjustments}
                className="px-4 py-2 rounded-xl bg-orange-600 hover:bg-orange-700 text-white text-xs font-bold cursor-pointer transition-colors shadow-md shadow-orange-500/20"
              >
                Save Variant Adjustments
              </button>
            </div>
          </div>
        </div>
      </Modal>
    </div>
  );
}
