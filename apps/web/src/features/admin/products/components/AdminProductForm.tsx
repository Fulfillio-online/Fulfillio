'use client';

import React, { useState, useEffect, useRef, useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  ArrowLeft,
  Package,
  UploadCloud,
  Check,
  Plus,
  Trash2,
  Shirt,
  Smartphone,
  Sparkle,
  Apple,
  Box,
  Building2,
  RefreshCw,
  Copy,
  ChevronDown,
  X,
  Star,
} from 'lucide-react';
import { WarehouseBin, WarehouseProductItem } from '../types';
import { INITIAL_BINS, INITIAL_PRODUCTS, STORAGE_KEY_BINS, STORAGE_KEY_PRODUCTS } from '../mockData';
import { ColorSwatch, ProductType, ProductVariantConfig } from '@/features/merchant/portal/products/types';
import { compressImage, compressThumbnail } from '@/features/merchant/portal/products/utils/imageCompressor';
import {
  getStoredMerchantDirectory,
  syncAdminProductsToMerchant,
  getAuthHeaders,
} from '@/lib/warehouseSync';
import { MerchantRecord } from '@/features/admin/merchants/types';

export function AdminProductForm() {
  const router = useRouter();

  const mainImageInputRef = useRef<HTMLInputElement>(null);
  const colorFileInputRef = useRef<HTMLInputElement>(null);
  const [activeColorUploadId, setActiveColorUploadId] = useState<string | null>(null);
  const [copiedSku, setCopiedSku] = useState(false);

  // Merchants & Bins
  const [merchants, setMerchants] = useState<MerchantRecord[]>([]);
  const [selectedMerchantCode, setSelectedMerchantCode] = useState<string>('MC-101');
  const [bins, setBins] = useState<WarehouseBin[]>(INITIAL_BINS);
  const [selectedBin, setSelectedBin] = useState<string>('A-01-01');

  // Basic Information
  const [title, setTitle] = useState('');
  const [masterSku, setMasterSku] = useState('MC-101-PRD-101');
  const [category, setCategory] = useState<'Apparel' | 'Footwear' | 'Electronics' | 'Accessories' | 'Beauty' | 'Grocery'>('Apparel');
  const [subcategory, setSubcategory] = useState('Hoodie');
  const [description, setDescription] = useState('');
  const [declaredValue, setDeclaredValue] = useState<string>('1250');

  // Product Type
  const [productType, setProductType] = useState<ProductType>('FASHION');

  // Colors
  const [colors, setColors] = useState<ColorSwatch[]>([
    {
      id: 'c-1',
      name: 'Black',
      hex: '#111827',
      imageUrl: '',
      sizes: ['S', 'M', 'L', 'XL', 'XXL'],
    },
  ]);

  // Sizes
  const [allSizes, setAllSizes] = useState<string[]>(['S', 'M', 'L', 'XL', 'XXL']);
  const [customSizeInputs, setCustomSizeInputs] = useState<Record<string, string>>({});

  // Type-specific attributes
  const [electronicStorages, setElectronicStorages] = useState<string[]>(['64GB', '128GB', '256GB']);
  const [newStorageInput, setNewStorageInput] = useState('');

  const [beautyVolumes, setBeautyVolumes] = useState<string[]>(['30ml', '50ml', '100ml']);
  const [newVolumeInput, setNewVolumeInput] = useState('');

  const [groceryPacks, setGroceryPacks] = useState<string[]>(['500g', '1kg', '2kg']);
  const [newPackInput, setNewPackInput] = useState('');

  // Bulk stock & variants
  const [bulkStockValue, setBulkStockValue] = useState<string>('20');
  const [variantStockMap, setVariantStockMap] = useState<Record<string, number>>({});
  const [excludedVariantIds, setExcludedVariantIds] = useState<string[]>([]);
  const [standardStock, setStandardStock] = useState('50');

  // Image
  const [imageUrl, setImageUrl] = useState('');

  // Features
  const [features, setFeatures] = useState<string[]>([
    'Verified warehouse stock',
    'Intake QA inspected',
  ]);
  const [newFeatureText, setNewFeatureText] = useState('');

  // Toast
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const activeBarcodeString = useMemo(() => {
    return `890${Math.floor(1000000000 + Math.random() * 9000000000)}`;
  }, []);

  // Hydrate merchants & bins
  useEffect(() => {
    const directory = getStoredMerchantDirectory();
    setMerchants(directory);
    if (directory.length > 0) {
      setSelectedMerchantCode(directory[0].merchantCode);
      setMasterSku(`${directory[0].merchantCode}-PRD-${Math.floor(100 + Math.random() * 900)}`);
    }

    try {
      const rawBins = localStorage.getItem(STORAGE_KEY_BINS);
      if (rawBins) {
        const parsed = JSON.parse(rawBins);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setBins(parsed);
          setSelectedBin(parsed[0].code);
        }
      }
    } catch {
      // ignore
    }
  }, []);

  const handleMerchantChange = (newCode: string) => {
    setSelectedMerchantCode(newCode);
    setMasterSku((prev) => {
      const cleanPrev = prev.replace(/^[A-Z0-9]+-PRD-/i, '');
      const suffix = cleanPrev || String(Math.floor(100 + Math.random() * 900));
      return `${newCode}-PRD-${suffix}`;
    });
  };

  const handleSelectProductType = (type: ProductType) => {
    setProductType(type);
    if (type === 'FASHION') setCategory('Apparel');
    else if (type === 'ELECTRONICS') setCategory('Electronics');
    else if (type === 'BEAUTY') setCategory('Beauty');
    else if (type === 'GROCERY') setCategory('Grocery');
    else setCategory('Accessories');
  };

  const handleMainImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const compressed = await compressImage(file);
      setImageUrl(compressed);
    } catch (err) {
      console.error('Failed to compress product image:', err);
    } finally {
      if (mainImageInputRef.current) mainImageInputRef.current.value = '';
    }
  };

  const handleColorImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !activeColorUploadId) return;

    try {
      const compressed = await compressThumbnail(file);
      setColors((prev) =>
        prev.map((c) => (c.id === activeColorUploadId ? { ...c, imageUrl: compressed } : c))
      );
      if (!imageUrl) setImageUrl(compressed);
    } catch (err) {
      console.error('Failed to compress color thumbnail:', err);
    } finally {
      setActiveColorUploadId(null);
      if (colorFileInputRef.current) colorFileInputRef.current.value = '';
    }
  };

  const handleAddColor = () => {
    const newId = `c-${Date.now()}`;
    const palette = [
      { name: 'Pure White', hex: '#FFFFFF' },
      { name: 'Navy Blue', hex: '#1E3A8A' },
      { name: 'Charcoal Grey', hex: '#374151' },
      { name: 'Olive Green', hex: '#4D7C0F' },
      { name: 'Crimson Red', hex: '#DC2626' },
      { name: 'Warm Beige', hex: '#F5F5DC' },
    ];
    const fallbackChoice = palette[(colors.length - 1) % palette.length] || {
      name: `Color ${colors.length + 1}`,
      hex: '#6B7280',
    };
    setColors((prev) => [
      ...prev,
      {
        id: newId,
        name: fallbackChoice.name,
        hex: fallbackChoice.hex,
        imageUrl: '',
        sizes: [...allSizes],
      },
    ]);
  };

  const handleRemoveColor = (id: string) => {
    if (colors.length <= 1) return;
    setColors(colors.filter((c) => c.id !== id));
  };

  const handleToggleColorSize = (colorId: string, size: string) => {
    setColors((prev) =>
      prev.map((c) => {
        if (c.id !== colorId) return c;
        const currentSizes = c.sizes && c.sizes.length > 0 ? c.sizes : allSizes;
        const nextSizes = currentSizes.includes(size)
          ? currentSizes.filter((s) => s !== size)
          : [...currentSizes, size];
        return { ...c, sizes: nextSizes };
      })
    );
  };

  const handleAddFeature = () => {
    if (!newFeatureText.trim()) return;
    setFeatures([...features, newFeatureText.trim()]);
    setNewFeatureText('');
  };

  const handleRemoveFeature = (idx: number) => {
    setFeatures(features.filter((_, i) => i !== idx));
  };

  // Generate dynamic variants
  const generatedVariants: ProductVariantConfig[] = useMemo(() => {
    const baseSkuClean = masterSku.trim() || 'SKU';

    if (productType === 'FASHION') {
      const list: ProductVariantConfig[] = [];
      colors.forEach((c, cIdx) => {
        const colorSizes = c.sizes && c.sizes.length > 0 ? c.sizes : allSizes;
        const colorNameClean = (c.name || '').trim();
        const cleanAlpha = colorNameClean.replace(/[^a-zA-Z0-9]/g, '').toUpperCase();
        const colorCode =
          cleanAlpha.length >= 3
            ? cleanAlpha.substring(0, 3)
            : cleanAlpha.length > 0
            ? cleanAlpha
            : `C${cIdx + 1}`;

        colorSizes.forEach((s) => {
          const id = `${c.id}-${s.toLowerCase()}`;
          if (excludedVariantIds.includes(id)) return;
          const variantSku = `${baseSkuClean}-${colorCode}-${s}`;
          const stock = variantStockMap[id] ?? 20;
          list.push({
            id,
            variantSku,
            color: colorNameClean || `Color ${cIdx + 1}`,
            size: s,
            imageUrl: c.imageUrl || '',
            stock,
          });
        });
      });
      return list;
    }

    if (productType === 'ELECTRONICS') {
      const list: ProductVariantConfig[] = [];
      colors.forEach((c) => {
        electronicStorages.forEach((storage) => {
          const id = `${c.name.toLowerCase().replace(/\s+/g, '-')}-${storage.toLowerCase()}`;
          if (excludedVariantIds.includes(id)) return;
          const variantSku = `${baseSkuClean}-${storage}-${c.name.substring(0, 3).toUpperCase()}`;
          const stock = variantStockMap[id] ?? 10;
          list.push({
            id,
            variantSku,
            color: c.name,
            imageUrl: c.imageUrl || '',
            attributeName: 'Storage',
            attributeValue: storage,
            stock,
          });
        });
      });
      return list;
    }

    if (productType === 'BEAUTY') {
      const list: ProductVariantConfig[] = [];
      beautyVolumes.forEach((vol) => {
        colors.forEach((c) => {
          const id = `${vol.toLowerCase()}-${c.name.toLowerCase().replace(/\s+/g, '-')}`;
          if (excludedVariantIds.includes(id)) return;
          const variantSku = `${baseSkuClean}-${vol}-${c.name.substring(0, 3).toUpperCase()}`;
          const stock = variantStockMap[id] ?? 15;
          list.push({
            id,
            variantSku,
            attributeName: 'Volume',
            attributeValue: vol,
            color: c.name,
            imageUrl: c.imageUrl || '',
            stock,
          });
        });
      });
      return list;
    }

    if (productType === 'GROCERY') {
      const list: ProductVariantConfig[] = [];
      groceryPacks.forEach((pack) => {
        const id = `pack-${pack.toLowerCase()}`;
        if (excludedVariantIds.includes(id)) return;
        const variantSku = `${baseSkuClean}-${pack}`;
        const stock = variantStockMap[id] ?? 25;
        list.push({
          id,
          variantSku,
          attributeName: 'Pack Size',
          attributeValue: pack,
          stock,
        });
      });
      return list;
    }

    // STANDARD
    return [
      {
        id: 'std-item',
        variantSku: baseSkuClean,
        stock: parseInt(standardStock, 10) || 50,
      },
    ];
  }, [
    productType,
    masterSku,
    colors,
    allSizes,
    electronicStorages,
    beautyVolumes,
    groceryPacks,
    variantStockMap,
    excludedVariantIds,
    standardStock,
  ]);

  const computedTotalStock = useMemo(() => {
    return generatedVariants.reduce((sum, v) => sum + (v.stock || 0), 0);
  }, [generatedVariants]);

  const handleBulkApplyStock = () => {
    const val = Math.max(0, parseInt(bulkStockValue, 10) || 0);
    const updated: Record<string, number> = { ...variantStockMap };
    generatedVariants.forEach((v) => {
      updated[v.id] = val;
    });
    setVariantStockMap(updated);
  };

  const handleCopySku = () => {
    if (typeof navigator !== 'undefined') {
      navigator.clipboard.writeText(masterSku);
      setCopiedSku(true);
      setTimeout(() => setCopiedSku(false), 2000);
    }
  };

  const handleSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();

    if (!title.trim()) {
      showToast('Please enter a product title.');
      return;
    }

    const priceNum = parseFloat(declaredValue) || 1250;
    const targetMerchant = merchants.find((m) => m.merchantCode === selectedMerchantCode);
    const merchantName = targetMerchant?.storeName || targetMerchant?.ownerName || 'Merchant Store';

    const newProduct: WarehouseProductItem = {
      id: `p-${Date.now()}`,
      merchantCode: selectedMerchantCode,
      merchantName,
      title: title.trim(),
      shortSku: masterSku.trim(),
      fullSku: masterSku.trim(),
      color: colors[0]?.name || 'Standard',
      size: allSizes[0] || 'Default',
      barcode: activeBarcodeString,
      category,
      binCode: 'Pending Approval',
      stock: 0,
      stockAccepted: false,
      stockStatus: 'AWAITING_STOCK',
      price: priceNum,
      imageUrl: imageUrl || '',
      images: imageUrl ? [imageUrl] : [],
      status: 'PENDING_APPROVAL',
      submittedAt: new Date().toISOString(),
      variantsList: generatedVariants.map((v) => ({ ...v, stock: 0 })),
      colors: colors.map((c) => ({ ...c, imageUrl: c.imageUrl || '' })),
      sizes: allSizes,
      description: description.trim(),
    };

    try {
      const apiBase = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api';
      fetch(`${apiBase}/inventory/products`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-merchant-code': selectedMerchantCode,
          ...getAuthHeaders(),
        },
        body: JSON.stringify({
          merchantCode: selectedMerchantCode,
          title: newProduct.title,
          description: newProduct.description,
          baseSku: newProduct.shortSku.replace(/^MC-\d+-/i, ''),
          imageUrl: newProduct.imageUrl,
          images: newProduct.images,
          status: 'PENDING_APPROVAL',
          variants: generatedVariants.map((v, idx) => ({
            title: `${v.color || 'Standard'} / ${v.size || 'Standard'}`,
            variantCode: `${v.color || 'STD'}-${v.size || idx + 1}`,
            price: priceNum,
            defaultBinCode: 'Pending Approval',
            initialStock: 0,
            attributes: {
              color: v.color,
              size: v.size,
              category,
              allColors: newProduct.colors,
              sizes: allSizes,
              status: 'PENDING_APPROVAL',
              bin: 'Pending Approval',
            },
          })),
        }),
      }).catch(() => {});

      const existingRaw = localStorage.getItem(STORAGE_KEY_PRODUCTS);
      const existing: WarehouseProductItem[] = existingRaw ? JSON.parse(existingRaw) : INITIAL_PRODUCTS;
      const updated = [newProduct, ...existing];
      localStorage.setItem(STORAGE_KEY_PRODUCTS, JSON.stringify(updated));

      syncAdminProductsToMerchant([newProduct]);

      showToast(`Product [${newProduct.fullSku}] added under ${selectedMerchantCode} as Pending Approval!`);
      setTimeout(() => {
        router.push('/admin/products');
      }, 1000);
    } catch (err) {
      console.error('Failed to save product:', err);
      showToast('Error saving product.');
    }
  };

  return (
    <div className="max-w-4xl mx-auto pb-32">
      {/* Toast */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 px-4 py-3 rounded-xl bg-slate-900 text-white text-xs font-semibold shadow-xl border border-white/10 flex items-center gap-2">
          <Check className="h-4 w-4 text-emerald-400" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Sticky Header */}
      <header className="sticky top-0 z-30 -mx-4 sm:-mx-6 px-4 sm:px-6 py-4 bg-white/95 dark:bg-navy-950/95 backdrop-blur-md border-b border-slate-200/80 dark:border-white/10 mb-8 transition-all">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0">
            <Link
              href="/admin/products"
              className="h-9 w-9 rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-navy-900 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white flex items-center justify-center transition-all shrink-0 shadow-xs"
              title="Return to admin products"
            >
              <ArrowLeft className="h-4 w-4" />
            </Link>

            <div className="min-w-0">
              <div className="flex items-center gap-2.5">
                <h1 className="text-lg sm:text-xl font-bold tracking-tight text-slate-900 dark:text-white truncate">
                  Admin Intake · Add Product
                </h1>
                <span className="inline-flex items-center text-[10px] font-bold tracking-wider uppercase px-2.5 py-0.5 rounded-full bg-orange-500/10 text-orange-600 dark:text-orange-400 border border-orange-500/20">
                  {selectedMerchantCode}
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 font-mono">
                Assigned Bin: {selectedBin}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5 shrink-0">
            <Link
              href="/admin/products"
              className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white bg-slate-100 dark:bg-navy-900 hover:bg-slate-200 transition-all cursor-pointer"
            >
              Cancel
            </Link>

            <button
              type="button"
              onClick={() => handleSubmit()}
              className="px-5 py-2 rounded-xl bg-orange-600 hover:bg-orange-500 text-white text-xs font-bold shadow-[0_1px_2px_rgba(242,107,29,0.25)] transition-all flex items-center gap-2 cursor-pointer active:scale-[0.98]"
            >
              <Check className="h-4 w-4 stroke-[2.5]" />
              <span>Publish to Warehouse</span>
            </button>
          </div>
        </div>
      </header>

      {/* Form Stack */}
      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Merchant & Warehouse Bin */}
        <section className="bg-white dark:bg-navy-900/90 rounded-2xl border border-slate-200/80 dark:border-white/10 p-6 sm:p-8 shadow-[0_1px_3px_rgba(0,0,0,0.04)] space-y-6">
          <div className="border-b border-slate-100 dark:border-white/5 pb-4">
            <h2 className="text-base font-bold text-slate-900 dark:text-white">
              Merchant Attribution &amp; Warehouse Bin
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Select which merchant owns this SKU and allocate its physical warehouse shelf/rack bin.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div>
              <label className="block text-xs font-semibold text-slate-800 dark:text-slate-200 mb-2">
                Merchant Store <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <select
                  value={selectedMerchantCode}
                  onChange={(e) => handleMerchantChange(e.target.value)}
                  className="w-full appearance-none px-4 py-3 bg-white dark:bg-navy-950/60 border border-slate-200 dark:border-white/10 rounded-xl text-sm font-semibold text-slate-900 dark:text-white focus:outline-none focus:ring-4 focus:ring-orange-500/10 focus:border-orange-500 transition-all shadow-xs cursor-pointer pr-10"
                >
                  {merchants.map((m) => (
                    <option key={m.id || m.merchantCode} value={m.merchantCode}>
                      [{m.merchantCode}] {m.storeName} ({m.ownerName})
                    </option>
                  ))}
                </select>
                <ChevronDown className="absolute right-3.5 top-3.5 h-4 w-4 text-slate-400 pointer-events-none" />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-800 dark:text-slate-200 mb-2 flex items-center justify-between">
                <span>Warehouse Bin Location <span className="text-rose-500">*</span></span>
                <span className="font-mono text-[11px] text-orange-600 dark:text-orange-400 font-bold">
                  {selectedBin}
                </span>
              </label>
              <div className="relative">
                <select
                  value={selectedBin}
                  onChange={(e) => setSelectedBin(e.target.value)}
                  className="w-full appearance-none px-4 py-3 bg-white dark:bg-navy-950/60 border border-slate-200 dark:border-white/10 rounded-xl text-sm font-mono font-bold text-slate-900 dark:text-white focus:outline-none focus:ring-4 focus:ring-orange-500/10 focus:border-orange-500 transition-all shadow-xs cursor-pointer pr-10"
                >
                  {bins.map((b) => (
                    <option key={b.code} value={b.code}>
                      Bin {b.code} ({b.zone} • Cap: {b.capacityUnits} units)
                    </option>
                  ))}
                </select>
                <ChevronDown className="absolute right-3.5 top-3.5 h-4 w-4 text-slate-400 pointer-events-none" />
              </div>
            </div>
          </div>
        </section>

        {/* General Details */}
        <section className="bg-white dark:bg-navy-900/90 rounded-2xl border border-slate-200/80 dark:border-white/10 p-6 sm:p-8 shadow-[0_1px_3px_rgba(0,0,0,0.04)] space-y-6">
          <div className="border-b border-slate-100 dark:border-white/5 pb-4">
            <h2 className="text-base font-bold text-slate-900 dark:text-white">
              Product Information
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Specify product title, master SKU, valuation, and classification.
            </p>
          </div>

          <div className="space-y-5">
            <div>
              <label className="block text-xs font-semibold text-slate-800 dark:text-slate-200 mb-2">
                Product Title <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Premium Oversized Graphic Fleece Hoodie"
                className="w-full px-4 py-3 bg-white dark:bg-navy-950/60 border border-slate-200 dark:border-white/10 rounded-xl text-sm font-medium text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-4 focus:ring-orange-500/10 focus:border-orange-500 transition-all shadow-xs"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-xs font-semibold text-slate-800 dark:text-slate-200">
                    Master SKU <span className="text-rose-500">*</span>
                  </label>
                  <button
                    type="button"
                    onClick={handleCopySku}
                    className="text-xs text-slate-500 hover:text-orange-600 flex items-center gap-1 transition-colors cursor-pointer"
                  >
                    {copiedSku ? (
                      <Check className="h-3 w-3 text-emerald-500" />
                    ) : (
                      <Copy className="h-3 w-3" />
                    )}
                    <span>{copiedSku ? 'Copied' : 'Copy'}</span>
                  </button>
                </div>
                <input
                  type="text"
                  required
                  value={masterSku}
                  onChange={(e) => setMasterSku(e.target.value.toUpperCase())}
                  className="w-full px-4 py-3 bg-white dark:bg-navy-950/60 border border-slate-200 dark:border-white/10 rounded-xl text-sm font-mono font-bold text-slate-900 dark:text-white tracking-wider focus:outline-none focus:ring-4 focus:ring-orange-500/10 focus:border-orange-500 shadow-xs"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-800 dark:text-slate-200 mb-2">
                  Selling Price (৳ BDT) <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <span className="absolute left-4 top-3 text-sm font-bold text-slate-400">৳</span>
                  <input
                    type="number"
                    min="0"
                    required
                    value={declaredValue}
                    onChange={(e) => setDeclaredValue(e.target.value)}
                    placeholder="1250"
                    className="w-full pl-9 pr-4 py-3 bg-white dark:bg-navy-950/60 border border-slate-200 dark:border-white/10 rounded-xl text-sm font-bold text-slate-900 dark:text-white focus:outline-none focus:ring-4 focus:ring-orange-500/10 focus:border-orange-500 shadow-xs"
                  />
                </div>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-800 dark:text-slate-200 mb-2">
                Description &amp; QA Handling Notes
              </label>
              <textarea
                rows={3}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Product specs, sizing guidelines, packaging and QA inspection notes..."
                className="w-full px-4 py-3 bg-white dark:bg-navy-950/60 border border-slate-200 dark:border-white/10 rounded-xl text-sm font-medium text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-4 focus:ring-orange-500/10 focus:border-orange-500 shadow-xs"
              />
            </div>
          </div>
        </section>

        {/* Display Photo */}
        <section className="bg-white dark:bg-navy-900/90 rounded-2xl border border-slate-200/80 dark:border-white/10 p-6 sm:p-8 shadow-[0_1px_3px_rgba(0,0,0,0.04)] space-y-6">
          <div className="border-b border-slate-100 dark:border-white/5 pb-4">
            <h2 className="text-base font-bold text-slate-900 dark:text-white">
              Catalog Display Photo
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Primary product photo displayed on packing slips and warehouse scanning screens.
            </p>
          </div>

          <div className="flex items-center gap-5">
            {imageUrl ? (
              <div className="relative h-28 w-28 rounded-2xl bg-slate-100 dark:bg-navy-950 border border-slate-200 dark:border-white/10 overflow-hidden shrink-0 shadow-xs">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={imageUrl} alt="Product display" className="h-full w-full object-cover" />
                <button
                  type="button"
                  onClick={() => setImageUrl('')}
                  className="absolute top-1.5 right-1.5 p-1 rounded-lg bg-rose-600 text-white hover:bg-rose-500 shadow transition-colors cursor-pointer"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            ) : (
              <div
                onClick={() => mainImageInputRef.current?.click()}
                className="h-28 w-28 rounded-2xl border-2 border-dashed border-slate-200 dark:border-white/20 hover:border-orange-500 flex flex-col items-center justify-center gap-1.5 text-slate-400 hover:text-orange-600 transition-colors cursor-pointer bg-slate-50/50 dark:bg-navy-950/40 shrink-0"
              >
                <UploadCloud className="h-6 w-6" />
                <span className="text-[11px] font-bold">Upload</span>
              </div>
            )}

            <div className="space-y-2 flex-1 min-w-0">
              <button
                type="button"
                onClick={() => mainImageInputRef.current?.click()}
                className="px-4 py-2 rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-navy-900 hover:bg-slate-50 text-xs font-semibold text-slate-800 dark:text-slate-200 transition-colors cursor-pointer shadow-xs"
              >
                {imageUrl ? 'Change Photo' : 'Select Photo from Computer'}
              </button>
              <p className="text-xs text-slate-400">
                Auto-compressed to 800×800 for optimal fast rendering across warehouse terminals.
              </p>
            </div>
          </div>
        </section>

        {/* Archetype & Variants */}
        <section className="bg-white dark:bg-navy-900/90 rounded-2xl border border-slate-200/80 dark:border-white/10 p-6 sm:p-8 shadow-[0_1px_3px_rgba(0,0,0,0.04)] space-y-6">
          <div className="border-b border-slate-100 dark:border-white/5 pb-4">
            <h2 className="text-base font-bold text-slate-900 dark:text-white">
              Product Archetype &amp; Variants
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Select product schema for dynamic variant attributes and initial warehouse stock allocation.
            </p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
            {[
              { id: 'FASHION' as const, label: 'Fashion', desc: 'Colors & Sizes', icon: Shirt },
              { id: 'ELECTRONICS' as const, label: 'Electronics', desc: 'Storage & Spec', icon: Smartphone },
              { id: 'BEAUTY' as const, label: 'Beauty', desc: 'Volume & Shade', icon: Sparkle },
              { id: 'GROCERY' as const, label: 'Grocery', desc: 'Pack Sizes', icon: Apple },
              { id: 'STANDARD' as const, label: 'Standard', desc: 'Single SKU', icon: Box },
            ].map((t) => {
              const isSelected = productType === t.id;
              const Icon = t.icon;
              return (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => handleSelectProductType(t.id)}
                  className={`p-4 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between gap-3 ${
                    isSelected
                      ? 'bg-orange-500/10 border-orange-500 text-orange-600 dark:text-orange-400 ring-2 ring-orange-500/20 font-semibold shadow-xs'
                      : 'bg-white dark:bg-navy-950/60 border-slate-200 dark:border-white/10 text-slate-600 dark:text-slate-400 hover:border-slate-300'
                  }`}
                >
                  <Icon className={`h-5 w-5 ${isSelected ? 'text-orange-600 dark:text-orange-400' : 'text-slate-400'}`} />
                  <div>
                    <span className="text-xs font-bold block text-slate-900 dark:text-white leading-tight">
                      {t.label}
                    </span>
                    <span className="text-[11px] text-slate-400 block mt-0.5">
                      {t.desc}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>

          {/* Colors */}
          {(productType === 'FASHION' || productType === 'ELECTRONICS') && (
            <div className="space-y-4 pt-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-900 dark:text-white">
                  Color Variants ({colors.length})
                </span>
                <button
                  type="button"
                  onClick={handleAddColor}
                  className="text-xs font-bold text-orange-600 dark:text-orange-400 hover:underline flex items-center gap-1 cursor-pointer"
                >
                  <Plus className="h-4 w-4" />
                  <span>Add Another Color</span>
                </button>
              </div>

              <div className="space-y-4">
                {colors.map((color) => {
                  const currentSizes = color.sizes && color.sizes.length > 0 ? color.sizes : allSizes;
                  return (
                    <div
                      key={color.id}
                      className="p-4 sm:p-5 rounded-2xl bg-slate-50/70 dark:bg-navy-950/50 border border-slate-200/80 dark:border-white/10 space-y-4"
                    >
                      <div className="flex items-center justify-between gap-3">
                        <div className="flex items-center gap-3 flex-1 min-w-0">
                          <input
                            type="color"
                            value={color.hex}
                            onChange={(e) =>
                              setColors(
                                colors.map((c) => (c.id === color.id ? { ...c, hex: e.target.value } : c))
                              )
                            }
                            className="w-8 h-8 rounded-xl cursor-pointer border border-slate-200 dark:border-white/20 bg-transparent p-0"
                            title="Pick color"
                          />
                          <input
                            type="text"
                            value={color.name}
                            onChange={(e) =>
                              setColors(
                                colors.map((c) => (c.id === color.id ? { ...c, name: e.target.value } : c))
                              )
                            }
                            placeholder="Color name"
                            className="flex-1 max-w-sm px-4 py-2 bg-white dark:bg-navy-900 border border-slate-200 dark:border-white/10 rounded-xl text-xs font-semibold text-slate-900 dark:text-white focus:outline-none focus:border-orange-500 shadow-xs"
                          />
                        </div>

                        <div className="flex items-center gap-2.5">
                          <button
                            type="button"
                            onClick={() => {
                              setActiveColorUploadId(color.id);
                              colorFileInputRef.current?.click();
                            }}
                            className="px-3 py-2 rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-navy-900 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-50 transition-colors cursor-pointer shadow-xs"
                          >
                            Upload Photo
                          </button>
                          {colors.length > 1 && (
                            <button
                              type="button"
                              onClick={() => handleRemoveColor(color.id)}
                              className="p-2 rounded-xl text-slate-400 hover:text-rose-500 transition-colors cursor-pointer"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          )}
                        </div>
                      </div>

                      {productType === 'FASHION' && (
                        <div className="pt-3 border-t border-slate-200/60 dark:border-white/5 flex flex-wrap items-center gap-2">
                          <span className="text-xs font-semibold text-slate-500 mr-1">
                            Sizes:
                          </span>
                          {allSizes.map((sz) => {
                            const isActive = currentSizes.includes(sz);
                            return (
                              <button
                                key={sz}
                                type="button"
                                onClick={() => handleToggleColorSize(color.id, sz)}
                                className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                                  isActive
                                    ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900 border-transparent shadow-xs'
                                    : 'bg-white dark:bg-navy-900 text-slate-500 border-slate-200 dark:border-white/10 hover:border-slate-300'
                                }`}
                              >
                                {sz}
                              </button>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Matrix Table */}
          <div className="space-y-4 pt-4 border-t border-slate-100 dark:border-white/5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                  Variant Stock Matrix
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Total Allocated: <strong className="font-mono text-slate-900 dark:text-white">{computedTotalStock} units</strong>
                </p>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-xs font-medium text-slate-500">Bulk fill:</span>
                <input
                  type="number"
                  min="0"
                  value={bulkStockValue}
                  onChange={(e) => setBulkStockValue(e.target.value)}
                  className="w-20 px-3 py-1.5 bg-slate-50 dark:bg-navy-950 border border-slate-200 dark:border-white/10 rounded-xl text-xs font-mono font-bold text-center focus:outline-none focus:border-orange-500 shadow-xs"
                />
                <button
                  type="button"
                  onClick={handleBulkApplyStock}
                  className="px-3.5 py-1.5 rounded-xl bg-slate-100 dark:bg-navy-800 hover:bg-slate-200 text-xs font-bold text-slate-800 dark:text-slate-200 cursor-pointer shadow-xs"
                >
                  Apply All
                </button>
              </div>
            </div>

            <div className="rounded-2xl border border-slate-200/80 dark:border-white/10 overflow-hidden bg-white dark:bg-navy-900 shadow-xs">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50/80 dark:bg-navy-950 text-slate-600 dark:text-slate-400 font-semibold border-b border-slate-200/80 dark:border-white/10 text-[11px]">
                  <tr>
                    <th className="py-3 px-4">Variant SKU</th>
                    <th className="py-3 px-4">Option</th>
                    <th className="py-3 px-4">Bin Location</th>
                    <th className="py-3 px-4 text-right">Initial Stock</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-white/5">
                  {generatedVariants.map((v) => {
                    const label = [v.color, v.size || v.attributeValue].filter(Boolean).join(' / ');
                    return (
                      <tr key={v.id} className="hover:bg-slate-50/50 dark:hover:bg-navy-950/40">
                        <td className="py-3 px-4 font-mono font-bold text-slate-800 dark:text-slate-200 text-xs">
                          {v.variantSku}
                        </td>
                        <td className="py-3 px-4 text-slate-700 dark:text-slate-300 font-medium">
                          {label || 'Standard Item'}
                        </td>
                        <td className="py-3 px-4 font-mono text-slate-500">
                          {selectedBin}
                        </td>
                        <td className="py-3 px-4 text-right">
                          <input
                            type="number"
                            min="0"
                            value={v.stock}
                            onChange={(e) => {
                              const val = Math.max(0, parseInt(e.target.value, 10) || 0);
                              setVariantStockMap((prev) => ({ ...prev, [v.id]: val }));
                            }}
                            className="w-24 px-3 py-1.5 text-right bg-slate-50/60 dark:bg-navy-950/60 border border-slate-200 dark:border-white/10 rounded-xl text-xs font-mono font-bold text-slate-900 dark:text-white focus:outline-none focus:border-orange-500 shadow-xs"
                          />
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </section>

        {/* Bottom Actions */}
        <div className="flex items-center justify-end gap-3 pt-4">
          <Link
            href="/admin/products"
            className="px-5 py-2.5 rounded-xl border border-slate-200 dark:border-white/10 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100 transition-colors"
          >
            Cancel
          </Link>
          <button
            type="submit"
            className="px-6 py-2.5 rounded-xl bg-orange-600 hover:bg-orange-500 text-white text-xs font-bold shadow-[0_1px_2px_rgba(242,107,29,0.25)] transition-all flex items-center gap-2 cursor-pointer active:scale-[0.98]"
          >
            <Check className="h-4 w-4 stroke-[2.5]" />
            <span>Publish to Warehouse</span>
          </button>
        </div>
      </form>

      {/* Hidden file inputs */}
      <input
        type="file"
        ref={mainImageInputRef}
        onChange={handleMainImageUpload}
        accept="image/*"
        className="hidden"
      />
      <input
        type="file"
        ref={colorFileInputRef}
        onChange={handleColorImageUpload}
        accept="image/*"
        className="hidden"
      />
    </div>
  );
}
