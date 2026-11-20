'use client';

import React, { useState, useMemo, useEffect } from 'react';
import Link from 'next/link';
import {
  ArrowLeft,
  Edit2,
  Package,
  Layers,
  Printer,
  ChevronLeft,
  ChevronRight,
  Check,
  CheckCircle2,
  ShoppingCart,
  Plus,
  Minus,
  AlertCircle,
  FileText,
} from 'lucide-react';
import { MerchantProductItem, ResellerMemo, MerchantOrderItem } from '../../types';
import { ProductOrderListSection } from './ProductOrderListSection';
import { ManageStockModal, SubmitStockRequestPayload } from '../modals/ManageStockModal';
import { PrintBarcodeModal } from '../../components/modals/PrintBarcodeModal';
import { addToOrderCart } from '../lib/orderCartStorage';

const COLOR_MAP: Record<string, string> = {
  black: '#18181b',
  white: '#ffffff',
  red: '#ef4444',
  blue: '#3b82f6',
  green: '#10b981',
  yellow: '#eab308',
  gray: '#64748b',
  grey: '#64748b',
  'charcoal grey': '#4b5563',
  charcoal: '#334155',
  navy: '#1e3a8a',
  'navy blue': '#1e3a8a',
  orange: '#f97316',
  pink: '#ec4899',
  purple: '#a855f7',
  brown: '#78350f',
  beige: '#f5f5dc',
  maroon: '#800000',
  olive: '#556b2f',
  'olive green': '#4d7c0f',
};

function getColorHex(name?: string, hex?: string): string {
  if (hex && hex.trim().startsWith('#')) return hex.trim();
  if (!name) return '#64748b';
  const clean = name.toLowerCase().trim();
  return COLOR_MAP[clean] || hex || '#64748b';
}

function generateColorFallbackImage(colorName: string, hex: string, title: string): string {
  const isLight = ['#ffffff', '#fff', '#f8fafc', '#f5f5dc'].includes(hex.toLowerCase());
  const textColor = isLight ? '#0f172a' : '#ffffff';
  const subColor = isLight ? '#475569' : '#cbd5e1';
  const accentBorder = isLight ? '#cbd5e1' : hex;

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="600" height="600" viewBox="0 0 600 600">
    <defs>
      <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="${isLight ? '#f8fafc' : hex}" stop-opacity="0.95" />
        <stop offset="100%" stop-color="${isLight ? '#e2e8f0' : '#090d16'}" stop-opacity="1" />
      </linearGradient>
    </defs>
    <rect width="600" height="600" rx="36" fill="url(#bg)" />
    <rect x="24" y="24" width="552" height="552" rx="28" fill="none" stroke="${accentBorder}" stroke-opacity="0.4" stroke-width="3" />
    <g transform="translate(150, 100) scale(1.2)" stroke="${textColor}" stroke-width="12" stroke-linecap="round" stroke-linejoin="round" fill="none" opacity="0.85">
      <path d="M 50 20 Q 125 60 200 20 L 230 70 L 190 90 L 190 240 L 60 240 L 60 90 L 20 70 Z" fill="${hex}" fill-opacity="0.3" />
      <path d="M 90 20 C 90 50 160 50 160 20" />
    </g>
    <rect x="180" y="440" width="240" height="48" rx="24" fill="${isLight ? '#0f172a' : '#ffffff'}" />
    <circle cx="206" cy="464" r="12" fill="${hex}" stroke="${isLight ? '#ffffff' : '#0f172a'}" stroke-width="2" />
    <text x="310" y="471" text-anchor="middle" fill="${isLight ? '#ffffff' : '#0f172a'}" font-family="system-ui, sans-serif" font-weight="800" font-size="18">${colorName.toUpperCase()}</text>
    <text x="300" y="525" text-anchor="middle" fill="${subColor}" font-family="system-ui, sans-serif" font-weight="600" font-size="14">${title}</text>
  </svg>`;
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

interface ProductDetailsViewProps {
  product: MerchantProductItem;
  storeName: string;
  merchantCode?: string;
  memos?: ResellerMemo[];
  onCreateOrder?: (
    order: MerchantOrderItem,
    productIdOrItems?: string | { productId: string; qty: number; variantSku?: string }[],
    qty?: number
  ) => void;
  onRequestStockAdd: (productId: string, qty: number, note?: string) => void;
  onRequestStockOperation?: (payload: SubmitStockRequestPayload) => void;
  onTriggerToast: (msg: string) => void;
}

export function ProductDetailsView({
  product,
  storeName,
  merchantCode,
  memos,
  onCreateOrder,
  onRequestStockAdd,
  onRequestStockOperation,
  onTriggerToast,
}: ProductDetailsViewProps) {
  const [isStockModalOpen, setIsStockModalOpen] = useState(false);
  const [isBarcodeModalOpen, setIsBarcodeModalOpen] = useState(false);

  // 1. Normalize colors list
  const productColors = useMemo(() => {
    if (product.colors && product.colors.length > 0) return product.colors;
    return Array.from(
      new Set(
        (product.variantsList || [])
          .map((v) => v.color)
          .filter((c): c is string => Boolean(c && c.trim()))
      )
    ).map((cName, idx) => ({
      id: `c-${idx}`,
      name: cName,
      hex: getColorHex(cName),
      imageUrl: '',
      sizes: product.sizes || [],
    }));
  }, [product]);

  // Color to Image mapping
  const colorToImageMap = useMemo(() => {
    const map = new Map<string, { url: string; label: string; hex: string }>();

    productColors.forEach((c, idx) => {
      const hex = getColorHex(c.name, c.hex);
      let imgUrl = (c.imageUrl || '').trim();

      if (!imgUrl && product.variantsList) {
        const matchV = product.variantsList.find(
          (v) => (v.color || '').trim().toLowerCase() === c.name.trim().toLowerCase()
        );
        imgUrl = (matchV as any)?.imageUrl || (matchV as any)?.attributes?.imageUrl || '';
      }

      if (!imgUrl && idx === 0 && product.imageUrl && product.imageUrl.trim()) {
        imgUrl = product.imageUrl.trim();
      }

      if (!imgUrl) {
        imgUrl = generateColorFallbackImage(c.name, hex, product.title);
      }

      map.set(c.name.toLowerCase(), {
        url: imgUrl,
        label: c.name,
        hex,
      });
    });

    return map;
  }, [product, productColors]);

  // Gallery images collection
  const allImages = useMemo(() => {
    const list: { url: string; label: string; colorName?: string; colorHex?: string }[] = [];

    productColors.forEach((c) => {
      const colorEntry = colorToImageMap.get(c.name.toLowerCase());
      if (colorEntry && !list.some((img) => img.url === colorEntry.url)) {
        list.push({
          url: colorEntry.url,
          label: c.name,
          colorName: c.name,
          colorHex: colorEntry.hex,
        });
      }
    });

    if (
      product.imageUrl &&
      product.imageUrl.trim() &&
      !list.some((img) => img.url === product.imageUrl!.trim())
    ) {
      list.unshift({
        url: product.imageUrl.trim(),
        label: 'Main Product',
        colorName: productColors[0]?.name,
        colorHex: productColors[0]
          ? getColorHex(productColors[0].name, productColors[0].hex)
          : undefined,
      });
    }

    return list;
  }, [product, productColors, colorToImageMap]);

  // Stock per color calculation
  const colorStockMap = useMemo(() => {
    const map = new Map<string, number>();
    productColors.forEach((c) => {
      const variantsForColor = (product.variantsList || []).filter(
        (v) => (v.color || '').toLowerCase() === c.name.toLowerCase()
      );
      const totalStock =
        variantsForColor.length > 0
          ? variantsForColor.reduce((sum, v) => sum + (v.stock || 0), 0)
          : product.stock;
      map.set(c.name.toLowerCase(), totalStock);
    });
    return map;
  }, [product, productColors]);

  // Selected Color state: defaults to first in-stock color if available
  const [selectedColor, setSelectedColor] = useState<string>(() => {
    const firstInStock = productColors.find(
      (c) => (colorStockMap.get(c.name.toLowerCase()) ?? 0) > 0
    );
    return firstInStock ? firstInStock.name : productColors[0]?.name || '';
  });

  // Active Image URL
  const [activeImageUrl, setActiveImageUrl] = useState<string>(() => {
    if (selectedColor) {
      const entry = colorToImageMap.get(selectedColor.toLowerCase());
      if (entry?.url) return entry.url;
    }
    return product.imageUrl || allImages[0]?.url || '';
  });

  // Available sizes for currently selected color
  const availableSizes = useMemo(() => {
    const matchedColorObj = productColors.find(
      (c) => c.name.toLowerCase() === selectedColor.toLowerCase()
    );
    if (matchedColorObj?.sizes && matchedColorObj.sizes.length > 0) {
      return matchedColorObj.sizes;
    }
    if (product.variantsList && product.variantsList.length > 0) {
      const filtered = product.variantsList.filter(
        (v) =>
          !selectedColor ||
          (v.color || '').toLowerCase() === selectedColor.toLowerCase()
      );
      const list = Array.from(
        new Set(filtered.map((v) => v.size || '').filter(Boolean))
      );
      if (list.length > 0) return list;
    }
    return product.sizes && product.sizes.length > 0
      ? product.sizes
      : ['Standard'];
  }, [product, productColors, selectedColor]);

  // Stock for each size of currently selected color
  const sizeStockMap = useMemo(() => {
    const map = new Map<string, number>();
    availableSizes.forEach((s) => {
      const matchV = (product.variantsList || []).find(
        (v) =>
          (!selectedColor || (v.color || '').toLowerCase() === selectedColor.toLowerCase()) &&
          (v.size || '').toLowerCase() === s.toLowerCase()
      );
      const stock = matchV ? matchV.stock : product.variantsList?.length ? 0 : product.stock;
      map.set(s.toLowerCase(), stock);
    });
    return map;
  }, [product, selectedColor, availableSizes]);

  // Selected Size state: defaults to first in-stock size
  const [selectedSize, setSelectedSize] = useState<string>(() => {
    const inStock = availableSizes.find(
      (s) => (sizeStockMap.get(s.toLowerCase()) ?? 0) > 0
    );
    return inStock || availableSizes[0] || '';
  });

  // Keep selectedSize synchronized with availableSizes
  useEffect(() => {
    if (availableSizes.length > 0) {
      if (!selectedSize || !availableSizes.includes(selectedSize)) {
        const inStock = availableSizes.find(
          (s) => (sizeStockMap.get(s.toLowerCase()) ?? 0) > 0
        );
        setSelectedSize(inStock || availableSizes[0]);
      }
    }
  }, [availableSizes, selectedSize, sizeStockMap]);

  // Handle color click
  const handleSelectColor = (colorName: string) => {
    const stock = colorStockMap.get(colorName.toLowerCase()) ?? 0;
    if (stock <= 0) return; // Disallow selecting out-of-stock color

    setSelectedColor(colorName);

    // Switch image to selected color
    const colorEntry = colorToImageMap.get(colorName.toLowerCase());
    if (colorEntry?.url) {
      setActiveImageUrl(colorEntry.url);
    } else {
      const hex = getColorHex(colorName);
      setActiveImageUrl(generateColorFallbackImage(colorName, hex, product.title));
    }
  };

  // Handle thumbnail click
  const handleSelectThumbnail = (img: { url: string; label: string; colorName?: string }) => {
    setActiveImageUrl(img.url);
    if (img.colorName) {
      const stock = colorStockMap.get(img.colorName.toLowerCase()) ?? 0;
      if (stock > 0) {
        setSelectedColor(img.colorName);
      }
    }
  };

  // Prev / Next gallery controls
  const currentIndex = allImages.findIndex((img) => img.url === activeImageUrl);
  const handlePrevImage = () => {
    const prevIdx = currentIndex <= 0 ? allImages.length - 1 : currentIndex - 1;
    if (allImages[prevIdx]) handleSelectThumbnail(allImages[prevIdx]);
  };
  const handleNextImage = () => {
    const nextIdx = currentIndex >= allImages.length - 1 ? 0 : currentIndex + 1;
    if (allImages[nextIdx]) handleSelectThumbnail(allImages[nextIdx]);
  };

  // Find active variant details
  const selectedVariant = useMemo(() => {
    return (
      (product.variantsList || []).find((v) => {
        const matchColor =
          !selectedColor || (v.color || '').toLowerCase() === selectedColor.toLowerCase();
        const matchSize =
          !selectedSize || (v.size || '').toLowerCase() === selectedSize.toLowerCase();
        return matchColor && matchSize;
      }) || product.variantsList?.[0]
    );
  }, [product, selectedColor, selectedSize]);

  const currentVariantSku = selectedVariant?.variantSku || product.sku;
  const currentVariantStock =
    selectedVariant !== undefined ? selectedVariant.stock : product.stock;

  // Integrated Hero B2B Quick Order Quantity & Memo
  const [orderQty, setOrderQty] = useState<number>(1);
  const [selectedMemoCode, setSelectedMemoCode] = useState<string>(() => {
    if (memos && memos.length > 0) {
      const def = memos.find((m) => m.isDefault);
      return def ? def.code : memos[0].code;
    }
    return 'MEMO-DEFAULT';
  });

  // Reset or cap orderQty when variant stock changes
  useEffect(() => {
    if (currentVariantStock > 0) {
      setOrderQty((q) => Math.min(Math.max(1, q), currentVariantStock));
    } else {
      setOrderQty(1);
    }
  }, [currentVariantStock]);

  const handleAddToCart = () => {
    if (currentVariantStock <= 0 || orderQty <= 0) return;

    const matchedColorObj = productColors.find(
      (c) => c.name.toLowerCase() === selectedColor.toLowerCase()
    );
    const itemImage = matchedColorObj?.imageUrl || activeImageUrl || product.imageUrl;

    addToOrderCart({
      productId: product.id,
      title: product.title,
      imageUrl: itemImage,
      variantLabel: `${selectedColor} · ${selectedSize}`,
      color: selectedColor,
      size: selectedSize,
      sku: currentVariantSku,
      unitPrice: product.price || 0,
      qty: orderQty,
      maxStock: currentVariantStock,
    });

    onTriggerToast(
      `Added ${orderQty}x "${product.title} (${selectedColor} · ${selectedSize})" to Order List!`
    );
  };

  const defaultFeatures =
    product.keyFeatures && product.keyFeatures.length > 0
      ? product.keyFeatures
      : [
          'Premium cotton-blend fabric',
          'Oversized relaxed fit',
          'Soft and comfortable interior',
          'Unisex streetwear design',
        ];

  const isPendingApproval =
    product.status !== 'PUBLISHED' &&
    (!product.bin || product.bin === 'Pending Approval' || product.bin === 'Assigned on intake');

  const variants =
    product.variantsList && product.variantsList.length > 0
      ? product.variantsList
      : [
          {
            variant:
              product.colors?.[0]?.name ||
              product.variantLabel?.split('/')[0]?.trim() ||
              'Standard',
            size:
              product.sizes?.[0] || product.variantLabel?.split('/')[1]?.trim() || 'Standard',
            stock: product.stock,
          },
        ];

  return (
    <div className="max-w-5xl mx-auto space-y-6 pb-16">
      {/* Top Back bar & Quick Action Buttons */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 dark:border-white/10 pb-3">
        <Link
          href="/merchant/products"
          className="flex items-center gap-1.5 text-xs font-semibold text-slate-400 hover:text-orange-600 dark:hover:text-orange-400 transition-colors cursor-pointer"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Back to products</span>
        </Link>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setIsBarcodeModalOpen(true)}
            className="px-3 py-1.5 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-700 dark:bg-indigo-600/20 dark:hover:bg-indigo-600/30 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-500/30 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer shadow-2xs"
          >
            <Printer className="h-3.5 w-3.5" />
            <span>Print Thermal Sticker</span>
          </button>
          <button
            type="button"
            onClick={() => setIsStockModalOpen(true)}
            className="px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-navy-900 dark:bg-navy-800 dark:hover:bg-navy-700 dark:text-slate-200 border border-slate-200 dark:border-white/10 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer shadow-2xs"
          >
            <Layers className="h-3.5 w-3.5 text-emerald-500" />
            <span>Manage Stock</span>
          </button>
          <Link
            href={`/merchant/products/${product.id}/edit`}
            className="px-3.5 py-1.5 rounded-lg bg-orange-600 hover:bg-orange-500 text-white text-xs font-bold flex items-center gap-1.5 shadow-sm shadow-orange-500/20 transition-colors cursor-pointer"
          >
            <Edit2 className="h-3.5 w-3.5" />
            <span>Edit Product</span>
          </Link>
        </div>
      </div>

      {/* Modern E-Commerce Product Showcase (Gallery + Color & Size Switchers + Integrated Add-to-Order) */}
      <div className="p-6 rounded-2xl bg-white dark:bg-navy-900 border border-slate-200 dark:border-white/10 shadow-sm">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
          {/* Left Column: Interactive Image Gallery */}
          <div className="md:col-span-5 flex flex-col gap-3">
            {/* Large Active Display Container */}
            <div className="relative w-full aspect-square max-h-[400px] rounded-2xl bg-slate-50 dark:bg-navy-950 border border-slate-200/80 dark:border-white/10 overflow-hidden flex items-center justify-center group shadow-inner">
              {activeImageUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  key={activeImageUrl}
                  src={activeImageUrl}
                  alt={product.title}
                  className="w-full h-full object-contain p-3 transition-all duration-300 hover:scale-105"
                />
              ) : (
                <div className="flex flex-col items-center justify-center text-slate-400 p-6 text-center">
                  <Package className="h-16 w-16 stroke-[1.2] mb-2 opacity-50" />
                  <span className="text-xs font-medium">No image preview available</span>
                </div>
              )}

              {/* Floating Active Color Badge */}
              {selectedColor && (
                <div className="absolute top-3 left-3 flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-navy-900/80 backdrop-blur-md text-white text-[10px] font-semibold shadow-sm border border-white/10">
                  <span
                    className="h-2 w-2 rounded-full border border-white/20 shrink-0"
                    style={{ backgroundColor: getColorHex(selectedColor) }}
                  />
                  <span>{selectedColor}</span>
                </div>
              )}

              {/* Image Counter Badge */}
              {allImages.length > 1 && (
                <div className="absolute top-3 right-3 px-2 py-0.5 rounded-md bg-black/60 backdrop-blur-sm text-white text-[10px] font-mono font-medium">
                  {Math.max(1, currentIndex + 1)} / {allImages.length}
                </div>
              )}

              {/* Navigation Arrows for Gallery */}
              {allImages.length > 1 && (
                <>
                  <button
                    type="button"
                    onClick={handlePrevImage}
                    className="absolute left-2 top-1/2 -translate-y-1/2 h-8 w-8 rounded-full bg-white/90 dark:bg-navy-900/90 text-navy-900 dark:text-white shadow-md flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-orange-500 hover:text-white cursor-pointer border border-slate-200/50 dark:border-white/10"
                    aria-label="Previous image"
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </button>
                  <button
                    type="button"
                    onClick={handleNextImage}
                    className="absolute right-2 top-1/2 -translate-y-1/2 h-8 w-8 rounded-full bg-white/90 dark:bg-navy-900/90 text-navy-900 dark:text-white shadow-md flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-orange-500 hover:text-white cursor-pointer border border-slate-200/50 dark:border-white/10"
                    aria-label="Next image"
                  >
                    <ChevronRight className="h-4 w-4" />
                  </button>
                </>
              )}
            </div>

            {/* Thumbnail Strip */}
            {allImages.length > 1 && (
              <div className="flex items-center gap-2.5 overflow-x-auto pb-1 pt-0.5 scrollbar-thin">
                {allImages.map((img, idx) => {
                  const isActive = img.url === activeImageUrl;
                  return (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => handleSelectThumbnail(img)}
                      className={`relative h-14 w-14 rounded-xl overflow-hidden border-2 shrink-0 transition-all cursor-pointer bg-slate-50 dark:bg-navy-950 ${
                        isActive
                          ? 'border-orange-500 ring-2 ring-orange-500/30 scale-105'
                          : 'border-slate-200 dark:border-white/10 hover:border-slate-400 opacity-70 hover:opacity-100'
                      }`}
                      title={img.label}
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={img.url}
                        alt={img.label}
                        className="w-full h-full object-cover"
                      />
                      {img.colorHex && (
                        <span
                          className="absolute bottom-1 right-1 h-2.5 w-2.5 rounded-full border border-white shadow-xs"
                          style={{ backgroundColor: img.colorHex }}
                        />
                      )}
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Right Column: E-Commerce Product Info, Selectors & Integrated Add-to-Order */}
          <div className="md:col-span-7 flex flex-col justify-between space-y-5">
            <div className="space-y-4">
              {/* Top Badges */}
              <div className="flex items-center gap-2 flex-wrap">
                <span
                  className={`px-2.5 py-0.5 rounded-full text-[10px] font-semibold border ${
                    isPendingApproval
                      ? 'bg-amber-500/10 text-amber-500 dark:text-amber-400 border-amber-500/30'
                      : 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30'
                  }`}
                >
                  {isPendingApproval ? 'Pending Approval' : 'Approved Catalog'}
                </span>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-sky-500/10 text-sky-600 dark:text-sky-400 border border-sky-500/30">
                  {isPendingApproval ? 'Awaiting Intake' : product.status || 'Active'}
                </span>
                {product.category && (
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-slate-100 dark:bg-navy-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-white/10">
                    {product.category} {product.subcategory ? `• ${product.subcategory}` : ''}
                  </span>
                )}
              </div>

              {/* Product Title & Master SKU */}
              <div>
                <h1 className="text-2xl sm:text-3xl font-extrabold text-navy-900 dark:text-white tracking-tight leading-snug">
                  {product.title}
                </h1>
                <p className="text-xs font-mono text-slate-400 mt-1">
                  Master SKU: <span className="text-emerald-500 font-bold font-mono">{product.sku}</span>
                  {product.barcode && (
                    <span className="ml-3 text-slate-400">Barcode: {product.barcode}</span>
                  )}
                </p>
              </div>

              {/* Price & Declared Valuation */}
              <div className="flex items-baseline gap-3 p-3.5 rounded-xl bg-orange-50/50 dark:bg-orange-500/5 border border-orange-200/50 dark:border-orange-500/20">
                <div className="text-3xl font-extrabold text-orange-600 dark:text-orange-400">
                  ৳{product.price.toLocaleString()}
                </div>
                <div className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                  Declared Unit Value (BDT)
                </div>
              </div>

              {/* Interactive Color Switcher with Out-of-Stock Disabling */}
              {productColors.length > 0 && (
                <div className="space-y-2 pt-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-navy-900 dark:text-slate-200 flex items-center gap-1.5">
                      <span>Color:</span>
                      <span className="text-orange-600 dark:text-orange-400 font-semibold">
                        {selectedColor || 'Select a color'}
                      </span>
                    </span>
                    <span className="text-[11px] text-slate-400">
                      {productColors.length} {productColors.length === 1 ? 'option' : 'options'}
                    </span>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    {productColors.map((color) => {
                      const isSelected =
                        color.name.toLowerCase() === selectedColor.toLowerCase();
                      const hex = getColorHex(color.name, color.hex);
                      const isLight =
                        hex.toLowerCase() === '#ffffff' ||
                        hex.toLowerCase() === '#f8fafc' ||
                        hex.toLowerCase() === '#f5f5dc';

                      const stockForColor = colorStockMap.get(color.name.toLowerCase()) ?? 0;
                      const isOutOfStock = stockForColor <= 0;

                      return (
                        <button
                          key={color.id || color.name}
                          type="button"
                          disabled={isOutOfStock}
                          onClick={() => handleSelectColor(color.name)}
                          title={isOutOfStock ? `${color.name} is Out of Stock (স্টক নেই)` : color.name}
                          className={`group relative flex items-center gap-2 px-3 py-1.5 rounded-xl border text-xs font-semibold transition-all ${
                            isOutOfStock
                              ? 'bg-slate-200/50 dark:bg-black/60 border-slate-300/80 dark:border-white/10 text-slate-400 dark:text-slate-600 opacity-40 cursor-not-allowed line-through'
                              : isSelected
                              ? 'border-orange-500 bg-orange-500/10 text-orange-600 dark:text-orange-400 ring-2 ring-orange-500/30 cursor-pointer shadow-xs'
                              : 'border-slate-200 dark:border-white/10 hover:border-slate-300 dark:hover:border-white/20 bg-slate-50/50 dark:bg-navy-950/50 text-slate-700 dark:text-slate-300 cursor-pointer'
                          }`}
                        >
                          <span
                            className={`h-3.5 w-3.5 rounded-full shrink-0 shadow-2xs ${
                              isLight ? 'border border-slate-300 dark:border-white/30' : ''
                            } ${isOutOfStock ? 'grayscale opacity-60' : ''}`}
                            style={{ backgroundColor: hex }}
                          />
                          <span>{color.name}</span>
                          {isOutOfStock && (
                            <span className="text-[9px] font-bold text-rose-500 dark:text-rose-400 no-underline ml-0.5">
                              (Stock Out)
                            </span>
                          )}
                          {!isOutOfStock && isSelected && (
                            <Check className="h-3 w-3 text-orange-600 dark:text-orange-400" />
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Interactive Size Switcher with Out-of-Stock Disabling */}
              {availableSizes.length > 0 && (
                <div className="space-y-2 pt-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-navy-900 dark:text-slate-200 flex items-center gap-1.5">
                      <span>Size / Spec:</span>
                      <span className="text-navy-900 dark:text-white font-semibold">
                        {selectedSize || 'Select a size'}
                      </span>
                    </span>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    {availableSizes.map((size) => {
                      const isSelected = size === selectedSize;
                      const stockForSize = sizeStockMap.get(size.toLowerCase()) ?? 0;
                      const isOutOfStock = stockForSize <= 0;

                      return (
                        <button
                          key={size}
                          type="button"
                          disabled={isOutOfStock}
                          onClick={() => {
                            if (!isOutOfStock) setSelectedSize(size);
                          }}
                          title={isOutOfStock ? `${size} is Out of Stock (0 units)` : `${size} — ${stockForSize} in stock`}
                          className={`min-w-[44px] px-3.5 py-1.5 rounded-xl border text-xs font-bold transition-all text-center relative ${
                            isOutOfStock
                              ? 'bg-slate-200/60 dark:bg-black/70 border-slate-300/80 dark:border-white/10 text-slate-400 dark:text-slate-600 opacity-40 cursor-not-allowed line-through'
                              : isSelected
                              ? 'bg-navy-900 text-white dark:bg-orange-600 dark:text-white border-transparent shadow-sm cursor-pointer'
                              : 'border-slate-200 dark:border-white/10 hover:border-slate-300 dark:hover:border-white/20 bg-slate-50 dark:bg-navy-950 text-slate-700 dark:text-slate-300 cursor-pointer'
                          }`}
                        >
                          {size}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Active Variant Specs Bar */}
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-navy-950 border border-slate-200/80 dark:border-white/10 flex flex-wrap items-center justify-between gap-3 text-xs">
                <div>
                  <span className="text-[10px] uppercase font-semibold text-slate-400 block">
                    Selected Variant SKU
                  </span>
                  <span className="font-mono text-emerald-500 font-bold text-sm block mt-0.5">
                    {currentVariantSku}
                  </span>
                </div>

                <div>
                  <span className="text-[10px] uppercase font-semibold text-slate-400 block text-right sm:text-left">
                    Warehouse Available Stock
                  </span>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    {currentVariantStock > 0 ? (
                      <>
                        <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                        <span className="font-mono font-bold text-navy-900 dark:text-white text-sm">
                          {currentVariantStock} units
                        </span>
                      </>
                    ) : (
                      <>
                        <span className="h-2 w-2 rounded-full bg-rose-500" />
                        <span className="font-mono font-bold text-rose-500 text-sm">
                          Out of Stock (0 units)
                        </span>
                      </>
                    )}
                  </div>
                </div>

                <div>
                  <span className="text-[10px] uppercase font-semibold text-slate-400 block text-right">
                    Warehouse Location
                  </span>
                  <span className="text-slate-600 dark:text-slate-300 font-mono text-xs block mt-0.5 text-right">
                    {product.bin || 'Auto-Allocated'}
                  </span>
                </div>
              </div>

              {/* Integrated Quantity & Add-to-Order Action (Directly in Hero Card!) */}
              <div className="pt-2 border-t border-slate-100 dark:border-white/5 space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  {/* Quantity Counter */}
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold text-slate-600 dark:text-slate-300">
                      Quantity:
                    </span>
                    <div className="flex items-center border border-slate-200 dark:border-white/10 rounded-xl bg-slate-50 dark:bg-navy-950 p-1">
                      <button
                        type="button"
                        disabled={currentVariantStock <= 0 || orderQty <= 1}
                        onClick={() => setOrderQty((q) => Math.max(1, q - 1))}
                        className="p-1 rounded-lg hover:bg-slate-200 dark:hover:bg-navy-800 text-slate-500 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                        aria-label="Decrease quantity"
                      >
                        <Minus className="h-3.5 w-3.5" />
                      </button>
                      <input
                        type="number"
                        min="1"
                        max={Math.max(1, currentVariantStock)}
                        disabled={currentVariantStock <= 0}
                        value={orderQty}
                        onChange={(e) =>
                          setOrderQty(
                            Math.min(
                              currentVariantStock,
                              Math.max(1, parseInt(e.target.value, 10) || 1)
                            )
                          )
                        }
                        className="w-12 text-center text-xs font-mono font-bold bg-transparent border-0 focus:outline-none text-navy-900 dark:text-white disabled:opacity-50"
                      />
                      <button
                        type="button"
                        disabled={currentVariantStock <= 0 || orderQty >= currentVariantStock}
                        onClick={() => setOrderQty((q) => Math.min(currentVariantStock, q + 1))}
                        className="p-1 rounded-lg hover:bg-slate-200 dark:hover:bg-navy-800 text-slate-500 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                        aria-label="Increase quantity"
                      >
                        <Plus className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Reseller Memo Selector (if memos available) */}
                  {memos && memos.length > 0 && (
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-semibold text-slate-600 dark:text-slate-300 flex items-center gap-1">
                        <FileText className="h-3 w-3 text-orange-500" />
                        <span>Memo:</span>
                      </span>
                      <select
                        value={selectedMemoCode}
                        onChange={(e) => setSelectedMemoCode(e.target.value)}
                        className="px-2.5 py-1.5 bg-slate-50 dark:bg-navy-950 border border-slate-200 dark:border-white/10 rounded-xl text-xs font-medium text-navy-900 dark:text-white focus:outline-none focus:border-orange-500 cursor-pointer"
                      >
                        {memos.map((m) => (
                          <option key={m.id || m.code} value={m.code}>
                            {m.name || m.code}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}
                </div>

                {/* Main Add to Order List Button */}
                <button
                  type="button"
                  disabled={currentVariantStock <= 0}
                  onClick={handleAddToCart}
                  className={`w-full py-3 px-5 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all ${
                    currentVariantStock <= 0
                      ? 'bg-slate-200/60 dark:bg-black/60 border border-slate-300/80 dark:border-white/10 text-slate-400 dark:text-slate-600 cursor-not-allowed opacity-50'
                      : 'bg-orange-600 hover:bg-orange-500 active:scale-[0.99] text-white shadow-md shadow-orange-500/20 cursor-pointer'
                  }`}
                >
                  <ShoppingCart className="h-4 w-4" />
                  <span>
                    {currentVariantStock <= 0
                      ? 'Out of Stock — Cannot Add to Order'
                      : `Add to Order List (৳${(product.price * orderQty).toLocaleString()})`}
                  </span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Persistent Order Cart Table (hideQuickAddForm=true to prevent duplicate selectors) */}
      <ProductOrderListSection
        product={product}
        storeName={storeName}
        merchantCode={merchantCode || 'MC-101'}
        memos={memos || []}
        hideQuickAddForm={true}
        onCreateOrder={onCreateOrder}
        onTriggerToast={onTriggerToast}
      />

      {/* Main Grid: Left Specs & Right Variants */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column (2 Cols) */}
        <div className="lg:col-span-2 space-y-5">
          {/* Core Specs Card */}
          <div className="p-5 rounded-2xl bg-white dark:bg-navy-900 border border-slate-200 dark:border-white/10 space-y-4 shadow-sm">
            <div>
              <h3 className="font-bold text-sm text-navy-900 dark:text-slate-200">Product Information</h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Core database details and declared specifications
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4 text-xs">
              <div>
                <span className="text-[10px] uppercase font-semibold text-slate-500 block">
                  PRODUCT NAME
                </span>
                <span className="text-navy-900 dark:text-slate-200 font-medium block mt-0.5">
                  {product.title}
                </span>
              </div>
              <div>
                <span className="text-[10px] uppercase font-semibold text-slate-500 block">
                  SKU
                </span>
                <span className="font-mono text-emerald-500 font-bold block mt-0.5">
                  {product.sku}
                </span>
              </div>
              <div>
                <span className="text-[10px] uppercase font-semibold text-slate-500 block">
                  CATEGORY
                </span>
                <span className="text-navy-900 dark:text-slate-200 block mt-0.5 capitalize">
                  {product.category || 'Fashion'} {product.subcategory ? `• ${product.subcategory}` : ''}
                </span>
              </div>
              <div>
                <span className="text-[10px] uppercase font-semibold text-slate-500 block">
                  DECLARED VALUE
                </span>
                <span className="text-emerald-500 font-bold block mt-0.5">
                  ৳{product.price.toLocaleString()}
                </span>
              </div>
            </div>

            {/* Description */}
            <div className="pt-3 border-t border-slate-200/80 dark:border-white/10">
              <span className="text-[10px] uppercase font-semibold text-slate-500 block mb-1">
                DESCRIPTION
              </span>
              <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                {product.description ||
                  `${product.title} high-quality item engineered for durable performance and customer satisfaction.`}
              </p>
            </div>

            {/* Key Features */}
            <div className="pt-3 border-t border-slate-200/80 dark:border-white/10">
              <span className="text-[10px] uppercase font-semibold text-slate-500 block mb-2">
                KEY FEATURES
              </span>
              <ul className="space-y-1.5 text-xs text-slate-600 dark:text-slate-300">
                {defaultFeatures.map((feat, idx) => (
                  <li key={idx} className="flex items-center gap-2">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 shrink-0" />
                    <span>{feat}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Inventory Status Card */}
          <div className="p-5 rounded-2xl bg-white dark:bg-navy-900 border border-slate-200 dark:border-white/10 space-y-3 shadow-sm">
            <h3 className="font-bold text-sm text-navy-900 dark:text-slate-200">Inventory Status</h3>
            <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-navy-950 border border-slate-200 dark:border-white/10">
              <div>
                <span className="text-xs font-semibold text-slate-700 dark:text-slate-300 block">
                  Available inventory
                </span>
                <span className="text-[11px] text-slate-500 block">
                  Recorded warehouse physical stock
                </span>
              </div>
              <span className="text-2xl font-extrabold text-navy-900 dark:text-white font-mono">
                {product.stock}
              </span>
            </div>
            <div className="p-2.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-xs text-emerald-600 dark:text-emerald-400 flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" />
              <span>Stock levels are healthy & ready for fulfillment.</span>
            </div>
          </div>
        </div>

        {/* Right Column: Variants Breakdown Table */}
        <div className="p-5 rounded-2xl bg-white dark:bg-navy-900 border border-slate-200 dark:border-white/10 space-y-4 shadow-sm">
          <div>
            <h3 className="font-bold text-sm text-navy-900 dark:text-slate-200">Product Variants</h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Sizes, colors, and stock configurations
            </p>
          </div>

          <div className="rounded-xl border border-slate-200 dark:border-white/10 overflow-hidden bg-slate-50 dark:bg-navy-950">
            <table className="w-full text-left text-xs">
              <thead className="bg-white dark:bg-navy-900 text-slate-500 dark:text-slate-400 font-semibold border-b border-slate-200 dark:border-white/10">
                <tr>
                  <th className="p-2.5">Variant</th>
                  <th className="p-2.5">Size / Spec</th>
                  <th className="p-2.5 text-right">Stock</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-white/5 font-mono">
                {variants.map((v: any, idx: number) => (
                  <tr key={idx} className="hover:bg-white dark:bg-navy-900/40">
                    <td className="p-2.5 text-slate-700 dark:text-slate-300 font-sans font-medium">
                      {v.color || v.variant || 'Standard'}
                    </td>
                    <td className="p-2.5 text-slate-500 dark:text-slate-400">
                      <span className="px-1.5 py-0.5 rounded bg-slate-100 dark:bg-navy-850 text-navy-900 dark:text-slate-200 border border-slate-200/80 dark:border-white/10 text-[11px]">
                        {v.size || v.attributeValue || 'Default'}
                      </span>
                    </td>
                    <td className={`p-2.5 text-right font-mono font-bold ${v.stock > 0 ? 'text-navy-900 dark:text-white' : 'text-rose-500'}`}>
                      {v.stock}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Stock Management Modal (Restock & Return by Variant) */}
      <ManageStockModal
        isOpen={isStockModalOpen}
        product={product}
        onClose={() => setIsStockModalOpen(false)}
        onSubmitRequest={(payload) => {
          if (onRequestStockOperation) {
            onRequestStockOperation(payload);
          } else {
            onRequestStockAdd(payload.productId, payload.requestedQty, payload.note);
          }
        }}
      />

      {/* Print Thermal Label Sticker Modal */}
      <PrintBarcodeModal
        isOpen={isBarcodeModalOpen}
        product={product}
        storeName={storeName}
        onClose={() => setIsBarcodeModalOpen(false)}
        onTriggerToast={onTriggerToast}
      />
    </div>
  );
}
