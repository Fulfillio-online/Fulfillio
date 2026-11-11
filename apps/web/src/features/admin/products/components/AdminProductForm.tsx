'use client';

import React, { useState, useEffect, useRef, useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  ArrowLeft,
  Package,
  UploadCloud,
  Check,
  Tag,
  Plus,
  Trash2,
  Sparkles,
  Shirt,
  Smartphone,
  Sparkle,
  Apple,
  Box,
  Building2,
  MapPin,
  Hash,
  CheckCircle2,
  DollarSign,
  Layers,
  Palette,
} from 'lucide-react';
import { WarehouseBin, WarehouseProductItem } from '../types';
import { INITIAL_BINS, INITIAL_PRODUCTS, STORAGE_KEY_BINS, STORAGE_KEY_PRODUCTS } from '../mockData';
import { ColorSwatch, ProductType, ProductVariantConfig } from '@/features/merchant/portal/products/types';
import { compressImage } from '@/features/merchant/portal/products/utils/imageCompressor';
import {
  getStoredMerchantDirectory,
  syncAdminProductsToMerchant,
} from '@/lib/warehouseSync';
import { MerchantRecord } from '@/features/admin/merchants/types';

export function AdminProductForm() {
  const router = useRouter();

  const mainImageInputRef = useRef<HTMLInputElement>(null);
  const colorFileInputRef = useRef<HTMLInputElement>(null);
  const [activeColorUploadId, setActiveColorUploadId] = useState<string | null>(null);

  // Merchants & Bins lists
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

  // Color Swatches
  const [colors, setColors] = useState<ColorSwatch[]>([
    {
      id: 'c-1',
      name: 'Black',
      hex: '#111827',
      imageUrl: 'https://images.unsplash.com/photo-1556905055-8f358a7a47b2?auto=format&fit=crop&w=200&q=80',
    },
    {
      id: 'c-2',
      name: 'Charcoal Grey',
      hex: '#4B5563',
      imageUrl: 'https://images.unsplash.com/photo-1509967419530-da38b4704bc6?auto=format&fit=crop&w=200&q=80',
    },
  ]);

  // Sizes for Fashion
  const [allSizes, setAllSizes] = useState<string[]>(['S', 'M', 'L', 'XL', 'XXL']);
  const [customSizeInputs, setCustomSizeInputs] = useState<Record<string, string>>({});

  // Type-specific attributes
  const [electronicStorages, setElectronicStorages] = useState<string[]>(['64GB', '128GB', '256GB']);
  const [newStorageInput, setNewStorageInput] = useState('');

  const [beautyVolumes, setBeautyVolumes] = useState<string[]>(['30ml', '50ml', '100ml']);
  const [newVolumeInput, setNewVolumeInput] = useState('');

  const [groceryPacks, setGroceryPacks] = useState<string[]>(['500g', '1kg', '2kg']);
  const [newPackInput, setNewPackInput] = useState('');

  // Variant stock map
  const [variantStockMap, setVariantStockMap] = useState<Record<string, number>>({});
  const [excludedVariantIds, setExcludedVariantIds] = useState<string[]>([]);
  const [standardStock, setStandardStock] = useState('50');

  // Main Image
  const [imageUrl, setImageUrl] = useState('');

  // Key Features
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

  // Update Master SKU prefix when merchant changes
  const handleMerchantChange = (newCode: string) => {
    setSelectedMerchantCode(newCode);
    setMasterSku((prev) => {
      const cleanPrev = prev.replace(/^[A-Z0-9]+-PRD-/i, '');
      const suffix = cleanPrev || String(Math.floor(100 + Math.random() * 900));
      return `${newCode}-PRD-${suffix}`;
    });
  };

  // Sync category when product type changes
  const handleSelectProductType = (type: ProductType) => {
    setProductType(type);
    if (type === 'FASHION') setCategory('Apparel');
    else if (type === 'ELECTRONICS') setCategory('Electronics');
    else if (type === 'BEAUTY') setCategory('Beauty');
    else if (type === 'GROCERY') setCategory('Grocery');
    else setCategory('Accessories');
  };

  // Image Upload handler
  const handleMainImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const compressed = await compressImage(file, 800, 800, 0.8);
      setImageUrl(compressed);
    } catch (err) {
      console.error('Failed to compress image:', err);
    } finally {
      if (mainImageInputRef.current) {
        mainImageInputRef.current.value = '';
      }
    }
  };

  // Color Swatch Image Upload handler
  const handleColorFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !activeColorUploadId) return;

    try {
      const compressed = await compressImage(file, 800, 800, 0.8);
      setColors((prev) =>
        prev.map((c) => (c.id === activeColorUploadId ? { ...c, imageUrl: compressed } : c))
      );
      if (!imageUrl) {
        setImageUrl(compressed);
      }
    } catch (err) {
      console.error('Image compression error:', err);
    } finally {
      setActiveColorUploadId(null);
      if (colorFileInputRef.current) {
        colorFileInputRef.current.value = '';
      }
    }
  };

  const handleAddColor = () => {
    const newId = `c-${Date.now()}`;
    setColors([
      ...colors,
      {
        id: newId,
        name: 'New Color',
        hex: '#ea580c',
        sizes: [...allSizes],
      },
    ]);
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

  const handleAddCustomSizeToColor = (colorId: string) => {
    const val = (customSizeInputs[colorId] || '').trim();
    if (!val) return;
    const formatted = val.toUpperCase();
    if (!allSizes.includes(formatted)) {
      setAllSizes((prev) => [...prev, formatted]);
    }
    setColors((prev) =>
      prev.map((c) => {
        if (c.id !== colorId) return c;
        const current = c.sizes && c.sizes.length > 0 ? c.sizes : allSizes;
        if (current.includes(formatted)) return c;
        return { ...c, sizes: [...current, formatted] };
      })
    );
    setCustomSizeInputs((prev) => ({ ...prev, [colorId]: '' }));
  };

  const handleRemoveCustomSize = (sizeToRemove: string) => {
    setAllSizes((prev) => prev.filter((s) => s !== sizeToRemove));
    setColors((prev) =>
      prev.map((c) => ({
        ...c,
        sizes: (c.sizes || []).filter((s) => s !== sizeToRemove),
      }))
    );
  };

  const handleRemoveColor = (id: string) => {
    if (colors.length <= 1) return;
    setColors(colors.filter((c) => c.id !== id));
  };

  const handleAddFeature = () => {
    if (!newFeatureText.trim()) return;
    setFeatures([...features, newFeatureText.trim()]);
    setNewFeatureText('');
  };

  const handleRemoveFeature = (idx: number) => {
    setFeatures(features.filter((_, i) => i !== idx));
  };

  // Generate All Variants Breakdown
  const generatedVariants = useMemo<ProductVariantConfig[]>(() => {
    const list: ProductVariantConfig[] = [];
    const baseSku = masterSku.trim() || `${selectedMerchantCode}-PRD-001`;

    if (productType === 'FASHION') {
      colors.forEach((col) => {
        const activeSizes = col.sizes && col.sizes.length > 0 ? col.sizes : allSizes;
        activeSizes.forEach((sz) => {
          const cleanCol = col.name.trim().replace(/\s+/g, '-').toUpperCase();
          const cleanSz = sz.trim().toUpperCase();
          const vId = `${col.id}-${cleanSz}`;
          if (excludedVariantIds.includes(vId)) return;

          const variantSku = `${baseSku}-${cleanCol.slice(0, 3)}-${cleanSz}`;
          const currentStock = variantStockMap[vId] ?? 20;

          list.push({
            id: vId,
            variantSku,
            color: col.name,
            size: cleanSz,
            stock: currentStock,
          });
        });
      });
    } else if (productType === 'ELECTRONICS') {
      colors.forEach((col) => {
        electronicStorages.forEach((storage) => {
          const cleanCol = col.name.trim().replace(/\s+/g, '-').toUpperCase();
          const cleanStorage = storage.trim().toUpperCase();
          const vId = `${col.id}-${cleanStorage}`;
          if (excludedVariantIds.includes(vId)) return;

          const variantSku = `${baseSku}-${cleanCol.slice(0, 3)}-${cleanStorage}`;
          const currentStock = variantStockMap[vId] ?? 15;

          list.push({
            id: vId,
            variantSku,
            color: col.name,
            attributeName: 'Storage',
            attributeValue: cleanStorage,
            stock: currentStock,
          });
        });
      });
    } else if (productType === 'BEAUTY') {
      beautyVolumes.forEach((volume) => {
        const cleanVol = volume.trim().toUpperCase();
        const vId = `vol-${cleanVol}`;
        if (excludedVariantIds.includes(vId)) return;

        const variantSku = `${baseSku}-${cleanVol}`;
        const currentStock = variantStockMap[vId] ?? 25;

        list.push({
          id: vId,
          variantSku,
          attributeName: 'Volume',
          attributeValue: cleanVol,
          stock: currentStock,
        });
      });
    } else if (productType === 'GROCERY') {
      groceryPacks.forEach((pack) => {
        const cleanPack = pack.trim().toUpperCase();
        const vId = `pack-${cleanPack}`;
        if (excludedVariantIds.includes(vId)) return;

        const variantSku = `${baseSku}-${cleanPack}`;
        const currentStock = variantStockMap[vId] ?? 30;

        list.push({
          id: vId,
          variantSku,
          attributeName: 'Pack Size',
          attributeValue: cleanPack,
          stock: currentStock,
        });
      });
    } else {
      // STANDARD
      list.push({
        id: 'var-std',
        variantSku: baseSku,
        stock: Number(standardStock) || 50,
      });
    }

    return list;
  }, [
    productType,
    colors,
    allSizes,
    electronicStorages,
    beautyVolumes,
    groceryPacks,
    masterSku,
    selectedMerchantCode,
    excludedVariantIds,
    variantStockMap,
    standardStock,
  ]);

  const computedTotalStock = useMemo(() => {
    if (productType === 'STANDARD') {
      return Number(standardStock) || 0;
    }
    return generatedVariants.reduce((sum, v) => sum + (v.stock || 0), 0);
  }, [productType, standardStock, generatedVariants]);

  // Form Submit Handler
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      showToast('Please enter a product title.');
      return;
    }
    if (!masterSku.trim()) {
      showToast('Please specify a Master SKU.');
      return;
    }

    const merchantObj =
      merchants.find((m) => m.merchantCode === selectedMerchantCode) ||
      merchants[0] || {
        merchantCode: selectedMerchantCode,
        storeName: 'Merchant Store',
        ownerName: 'Merchant',
      };

    const numPrice = Number(declaredValue) || 1250;
    const finalBin = selectedBin || 'A-01-01';
    const finalImageUrl = imageUrl || colors.find((c) => Boolean(c.imageUrl))?.imageUrl || '';
    const newProdId = `PRD-${Math.floor(3000 + Math.random() * 6000)}`;

    const allActiveSizes = Array.from(
      new Set(colors.flatMap((c) => (c.sizes && c.sizes.length > 0 ? c.sizes : allSizes)))
    );

    const newAdminProduct: WarehouseProductItem = {
      id: newProdId,
      title: title.trim(),
      category: (category as any) || 'Apparel',
      merchantCode: merchantObj.merchantCode,
      merchantName: merchantObj.storeName,
      shortSku: masterSku.replace(new RegExp(`^${merchantObj.merchantCode}-`, 'i'), ''),
      fullSku: masterSku.trim(),
      color: colors[0]?.name || 'Standard',
      size: allActiveSizes[0] || 'OS',
      binCode: finalBin,
      stock: computedTotalStock,
      price: numPrice,
      status: 'APPROVED',
      submittedAt: 'Added by Admin just now',
      imageUrl: finalImageUrl.trim(),
      barcode: `890${Math.floor(1000000000 + Math.random() * 9000000000)}`,
      description,
      colors,
      sizes: allActiveSizes.length > 0 ? allActiveSizes : allSizes,
      variantsList: generatedVariants,
    };

    // Save to Admin Products list in localStorage
    try {
      const stored = localStorage.getItem(STORAGE_KEY_PRODUCTS);
      const existing: WarehouseProductItem[] = stored ? JSON.parse(stored) : INITIAL_PRODUCTS;
      const updated = [newAdminProduct, ...existing];
      localStorage.setItem(STORAGE_KEY_PRODUCTS, JSON.stringify(updated));

      // Sync immediately to the merchant's portal catalog
      syncAdminProductsToMerchant(updated);

      if (typeof window !== 'undefined') {
        window.dispatchEvent(
          new CustomEvent('fulfillio-warehouse-sync', { detail: { source: 'AdminProductForm' } })
        );
      }
    } catch (err) {
      console.error('Error saving new product to catalog', err);
    }

    showToast(`Product "${newAdminProduct.title}" (${newAdminProduct.fullSku}) published under ${merchantObj.storeName}!`);
    setTimeout(() => {
      router.push('/admin/products');
    }, 600);
  };

  return (
    <div className="space-y-6 pb-20 max-w-5xl mx-auto">
      {/* Toast Banner */}
      {toastMessage && (
        <div className="fixed top-5 right-5 z-50 flex items-center gap-2.5 px-4 py-3 rounded-xl bg-emerald-600 text-white shadow-xl animate-in fade-in slide-in-from-top-4">
          <CheckCircle2 className="w-5 h-5 shrink-0" />
          <span className="text-sm font-semibold">{toastMessage}</span>
        </div>
      )}

      {/* Hidden file inputs for image compression */}
      <input
        ref={mainImageInputRef}
        type="file"
        accept="image/*"
        onChange={handleMainImageUpload}
        className="hidden"
      />
      <input
        ref={colorFileInputRef}
        type="file"
        accept="image/*"
        onChange={handleColorFileChange}
        className="hidden"
      />

      {/* Header & Breadcrumb */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 dark:border-white/10 pb-5">
        <div className="flex items-center gap-3">
          <Link
            href="/admin/products"
            className="p-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-white/5 dark:hover:bg-white/10 text-slate-600 dark:text-slate-300 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-orange-600 dark:text-orange-400">
              <Package className="w-4 h-4" />
              <span>Admin Inventory Intake</span>
            </div>
            <h1 className="text-xl sm:text-2xl font-black text-navy-900 dark:text-white">
              Add Product Under Merchant Account
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              মার্চেন্ট সিলেক্ট করুন, সাইজ, কালার, ছবি এবং ওয়্যারহাউস বিন অ্যাসাইন করে সরাসরি ক্যাটালগে পাবলিশ করুন।
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <Link
            href="/admin/products"
            className="px-4 py-2.5 rounded-xl border border-slate-200 dark:border-white/10 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-white/5 transition-colors"
          >
            Cancel
          </Link>
          <button
            type="button"
            onClick={handleSubmit}
            className="px-5 py-2.5 rounded-xl bg-orange-600 hover:bg-orange-700 text-white text-xs sm:text-sm font-bold flex items-center gap-2 shadow-lg shadow-orange-500/25 transition-all cursor-pointer"
          >
            <Check className="w-4 h-4" />
            <span>Publish to Warehouse</span>
          </button>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Card 1: Merchant Selection & Warehouse Bin Assignment */}
        <div className="p-5 rounded-2xl bg-white dark:bg-navy-900 border border-slate-200 dark:border-white/10 shadow-sm space-y-4">
          <div className="flex items-center gap-2 text-xs font-bold text-navy-900 dark:text-white uppercase tracking-wider border-b border-slate-100 dark:border-white/5 pb-3">
            <Building2 className="w-4 h-4 text-orange-600 dark:text-orange-400" />
            <span>Merchant Attribution & Physical Warehouse Bin</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-200 mb-1.5">
                SELECT MERCHANT <span className="text-rose-500">*</span>
              </label>
              <select
                value={selectedMerchantCode}
                onChange={(e) => handleMerchantChange(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-navy-950 border border-slate-200 dark:border-white/10 text-sm font-semibold text-navy-900 dark:text-white focus:outline-none focus:border-orange-500 cursor-pointer"
              >
                {merchants.map((m) => (
                  <option key={m.id || m.merchantCode} value={m.merchantCode}>
                    [{m.merchantCode}] {m.storeName} — {m.ownerName}
                  </option>
                ))}
              </select>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
                এই প্রোডাক্টটি সরাসরি উক্ত মার্চেন্টের পোর্টালে সিঙ্ক হয়ে যাবে।
              </p>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-200 mb-1.5 flex items-center justify-between">
                <span>PRIMARY WAREHOUSE BIN <span className="text-rose-500">*</span></span>
                <span className="text-[11px] font-mono text-orange-600 dark:text-orange-400">
                  Bin: {selectedBin}
                </span>
              </label>
              <select
                value={selectedBin}
                onChange={(e) => setSelectedBin(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-navy-950 border border-slate-200 dark:border-white/10 text-sm font-semibold font-mono text-navy-900 dark:text-white focus:outline-none focus:border-orange-500 cursor-pointer"
              >
                {bins.map((b) => (
                  <option key={b.code} value={b.code}>
                    Bin {b.code} ({b.zone} • Cap: {b.capacityUnits} units)
                  </option>
                ))}
              </select>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
                প্রোডাক্ট ইনটেকের পর ফিজিক্যাল র‌্যাক বা সেলফ লোকেশন।
              </p>
            </div>
          </div>
        </div>

        {/* Card 2: Basic Information */}
        <div className="p-5 rounded-2xl bg-white dark:bg-navy-900 border border-slate-200 dark:border-white/10 shadow-sm space-y-4">
          <div className="flex items-center gap-2 text-xs font-bold text-navy-900 dark:text-white uppercase tracking-wider border-b border-slate-100 dark:border-white/5 pb-3">
            <Package className="w-4 h-4 text-orange-600 dark:text-orange-400" />
            <span>Product Core Information</span>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-200 mb-1.5">
              PRODUCT TITLE <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Premium Oversized Graphic Hoodie"
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-navy-950 border border-slate-200 dark:border-white/10 text-sm text-navy-900 dark:text-white focus:outline-none focus:border-orange-500"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-200 mb-1.5">
                MASTER SKU <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                value={masterSku}
                onChange={(e) => setMasterSku(e.target.value.toUpperCase())}
                placeholder="e.g. MC-101-PRD-101"
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-navy-950 border border-slate-200 dark:border-white/10 text-sm font-mono font-bold text-orange-600 dark:text-orange-400 focus:outline-none focus:border-orange-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-200 mb-1.5">
                RETAIL PRICE (৳) <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <span className="absolute left-3 top-2.5 text-xs font-bold text-slate-400">৳</span>
                <input
                  type="number"
                  min="0"
                  required
                  value={declaredValue}
                  onChange={(e) => setDeclaredValue(e.target.value)}
                  placeholder="1250"
                  className="w-full pl-8 pr-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-navy-950 border border-slate-200 dark:border-white/10 text-sm font-bold text-navy-900 dark:text-white focus:outline-none focus:border-orange-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-200 mb-1.5">
                CATEGORY
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as any)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-navy-950 border border-slate-200 dark:border-white/10 text-sm font-semibold text-navy-900 dark:text-white focus:outline-none focus:border-orange-500 cursor-pointer"
              >
                <option value="Apparel">Apparel / Fashion</option>
                <option value="Footwear">Footwear</option>
                <option value="Electronics">Electronics</option>
                <option value="Accessories">Accessories</option>
                <option value="Beauty">Beauty & Cosmetics</option>
                <option value="Grocery">Grocery & Food</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-200 mb-1.5">
              DESCRIPTION
            </label>
            <textarea
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Product fabric, build quality, warranty, packaging and handling notes..."
              className="w-full px-3.5 py-2 rounded-xl bg-slate-50 dark:bg-navy-950 border border-slate-200 dark:border-white/10 text-sm text-navy-900 dark:text-white focus:outline-none focus:border-orange-500"
            />
          </div>
        </div>

        {/* Card 3: Display Image Upload */}
        <div className="p-5 rounded-2xl bg-white dark:bg-navy-900 border border-slate-200 dark:border-white/10 shadow-sm space-y-3">
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-white/5 pb-3">
            <div className="flex items-center gap-2 text-xs font-bold text-navy-900 dark:text-white uppercase tracking-wider">
              <UploadCloud className="w-4 h-4 text-orange-600 dark:text-orange-400" />
              <span>Product Display Photo</span>
            </div>
            <span className="text-[11px] text-slate-400">Primary catalog photo</span>
          </div>

          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 pt-1">
            {imageUrl ? (
              <div className="relative group h-24 w-24 rounded-xl bg-slate-100 dark:bg-navy-950 border border-slate-200 dark:border-white/10 overflow-hidden shrink-0 shadow-md">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={imageUrl} alt="Uploaded product" className="h-full w-full object-cover" />
                <button
                  type="button"
                  onClick={() => setImageUrl('')}
                  className="absolute top-1 right-1 p-1 rounded-full bg-rose-600 text-white hover:bg-rose-500 shadow transition-colors cursor-pointer"
                  title="Remove image"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => mainImageInputRef.current?.click()}
                className="h-24 w-24 rounded-xl border-2 border-dashed border-slate-300 dark:border-white/20 hover:border-orange-500 dark:hover:border-orange-400 flex flex-col items-center justify-center gap-1.5 text-slate-400 hover:text-orange-600 transition-colors cursor-pointer bg-slate-50 dark:bg-navy-950 shrink-0"
              >
                <UploadCloud className="h-6 w-6" />
                <span className="text-[10px] font-bold uppercase">Upload</span>
              </button>
            )}

            <div className="space-y-1.5 flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => mainImageInputRef.current?.click()}
                  className="px-3 py-1.5 rounded-lg bg-orange-600/10 hover:bg-orange-600/20 text-orange-600 dark:text-orange-400 text-xs font-semibold border border-orange-500/30 transition-colors cursor-pointer"
                >
                  Choose File from Computer
                </button>
                {imageUrl && (
                  <span className="text-xs text-emerald-600 dark:text-emerald-400 font-semibold flex items-center gap-1">
                    <Check className="h-3.5 w-3.5" /> Image attached
                  </span>
                )}
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                Supports JPG, PNG, WEBP. Images are automatically compressed to 800x800 for optimal fast rendering.
              </p>
            </div>
          </div>
        </div>

        {/* Card 4: Product Type Selection */}
        <div className="p-5 rounded-2xl bg-white dark:bg-navy-900 border border-slate-200 dark:border-white/10 shadow-sm space-y-3">
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-white/5 pb-3">
            <div className="flex items-center gap-2 text-xs font-bold text-navy-900 dark:text-white uppercase tracking-wider">
              <Layers className="w-4 h-4 text-orange-600 dark:text-orange-400" />
              <span>Product Type & Variant Schema</span>
            </div>
            <span className="text-xs font-bold text-orange-600 dark:text-orange-400 font-mono">
              Type: {productType}
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5">
            {[
              { id: 'FASHION' as const, label: 'Fashion', desc: 'Colors & Sizes', icon: Shirt },
              { id: 'ELECTRONICS' as const, label: 'Electronics', desc: 'Storage & Spec', icon: Smartphone },
              { id: 'BEAUTY' as const, label: 'Beauty', desc: 'Volume & Shades', icon: Sparkle },
              { id: 'GROCERY' as const, label: 'Grocery', desc: 'Pack Sizes', icon: Apple },
              { id: 'STANDARD' as const, label: 'Standard', desc: 'Single SKU', icon: Box },
            ].map((t) => {
              const Icon = t.icon;
              const isSelected = productType === t.id;
              return (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => handleSelectProductType(t.id)}
                  className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-orange-500/10 border-orange-500 text-orange-600 dark:text-orange-400 ring-2 ring-orange-500/20'
                      : 'bg-slate-50 dark:bg-navy-950 border-slate-200 dark:border-white/10 text-slate-600 dark:text-slate-300 hover:border-slate-300 dark:hover:border-white/20'
                  }`}
                >
                  <Icon className="h-5 w-5 mb-1.5" />
                  <div className="text-xs font-bold text-navy-900 dark:text-white">{t.label}</div>
                  <div className="text-[10px] text-slate-500 dark:text-slate-400">{t.desc}</div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Card 5: Type-Specific Variant Customizer */}
        {(productType === 'FASHION' || productType === 'ELECTRONICS') && (
          <div className="p-5 rounded-2xl bg-white dark:bg-navy-900 border border-slate-200 dark:border-white/10 shadow-sm space-y-5">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-white/5 pb-3">
              <div className="flex items-center gap-2 text-xs font-bold text-navy-900 dark:text-white uppercase tracking-wider">
                <Palette className="w-4 h-4 text-orange-600 dark:text-orange-400" />
                <span>Colors & Associated Sizes ({colors.length} colors)</span>
              </div>
              <button
                type="button"
                onClick={handleAddColor}
                className="px-3 py-1.5 rounded-lg bg-orange-600/10 hover:bg-orange-600/20 text-orange-600 dark:text-orange-400 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <Plus className="h-3.5 w-3.5" />
                <span>Add Color</span>
              </button>
            </div>

            <div className="space-y-4">
              {colors.map((color, idx) => {
                const currentSizes = color.sizes && color.sizes.length > 0 ? color.sizes : allSizes;
                return (
                  <div
                    key={color.id}
                    className="p-4 rounded-xl bg-slate-50 dark:bg-navy-950 border border-slate-200 dark:border-white/10 space-y-3"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <div className="relative">
                          <input
                            type="color"
                            value={color.hex}
                            onChange={(e) =>
                              setColors(
                                colors.map((c) => (c.id === color.id ? { ...c, hex: e.target.value } : c))
                              )
                            }
                            className="w-8 h-8 rounded-lg cursor-pointer border border-slate-200 dark:border-white/20 bg-transparent p-0"
                            title="Click to pick color hex"
                          />
                        </div>

                        <input
                          type="text"
                          value={color.name}
                          onChange={(e) =>
                            setColors(
                              colors.map((c) => (c.id === color.id ? { ...c, name: e.target.value } : c))
                            )
                          }
                          placeholder="e.g. Navy Blue"
                          className="px-3 py-1.5 bg-white dark:bg-navy-900 border border-slate-200 dark:border-white/10 rounded-lg text-xs font-bold text-navy-900 dark:text-white focus:outline-none focus:border-orange-500"
                        />

                        {/* Color image attachment */}
                        <div className="flex items-center gap-2">
                          {color.imageUrl ? (
                            <div className="relative h-8 w-8 rounded-lg overflow-hidden border border-slate-200 dark:border-white/20">
                              {/* eslint-disable-next-line @next/next/no-img-element */}
                              <img src={color.imageUrl} alt={color.name} className="h-full w-full object-cover" />
                              <button
                                type="button"
                                onClick={() =>
                                  setColors(
                                    colors.map((c) => (c.id === color.id ? { ...c, imageUrl: undefined } : c))
                                  )
                                }
                                className="absolute inset-0 bg-black/60 text-white opacity-0 hover:opacity-100 flex items-center justify-center transition-opacity"
                                title="Remove color photo"
                              >
                                <Trash2 className="h-3 w-3" />
                              </button>
                            </div>
                          ) : (
                            <button
                              type="button"
                              onClick={() => {
                                setActiveColorUploadId(color.id);
                                colorFileInputRef.current?.click();
                              }}
                              className="px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-white/10 text-[11px] font-semibold text-slate-600 dark:text-slate-300 hover:bg-white dark:hover:bg-navy-900 flex items-center gap-1 cursor-pointer"
                            >
                              <UploadCloud className="h-3.5 w-3.5 text-orange-500" />
                              <span>Photo</span>
                            </button>
                          )}
                        </div>
                      </div>

                      {colors.length > 1 && (
                        <button
                          type="button"
                          onClick={() => handleRemoveColor(color.id)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-rose-500 hover:bg-rose-500/10 transition-colors cursor-pointer"
                          title="Remove color"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      )}
                    </div>

                    {/* Sizes available for this specific color */}
                    <div className="pt-2 border-t border-slate-200/60 dark:border-white/5 space-y-1.5">
                      <div className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                        Active Sizes for {color.name}:
                      </div>
                      <div className="flex flex-wrap items-center gap-1.5">
                        {allSizes.map((sz) => {
                          const isActive = currentSizes.includes(sz);
                          return (
                            <button
                              key={sz}
                              type="button"
                              onClick={() => handleToggleColorSize(color.id, sz)}
                              className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                                isActive
                                  ? 'bg-orange-600 text-white shadow-sm'
                                  : 'bg-white dark:bg-navy-900 border border-slate-200 dark:border-white/10 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200'
                              }`}
                            >
                              {sz}
                            </button>
                          );
                        })}

                        {/* Add custom size to this color */}
                        <div className="flex items-center gap-1 ml-2">
                          <input
                            type="text"
                            value={customSizeInputs[color.id] || ''}
                            onChange={(e) =>
                              setCustomSizeInputs({
                                ...customSizeInputs,
                                [color.id]: e.target.value,
                              })
                            }
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') {
                                e.preventDefault();
                                handleAddCustomSizeToColor(color.id);
                              }
                            }}
                            placeholder="+ Size"
                            className="w-16 px-2 py-1 bg-white dark:bg-navy-900 border border-slate-200 dark:border-white/10 rounded-lg text-xs text-navy-900 dark:text-white focus:outline-none focus:border-orange-500"
                          />
                          <button
                            type="button"
                            onClick={() => handleAddCustomSizeToColor(color.id)}
                            className="px-2 py-1 rounded-lg bg-slate-200 dark:bg-white/10 hover:bg-orange-600 hover:text-white text-xs font-bold transition-colors cursor-pointer"
                          >
                            +
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Card 6: Variant Matrix Table with Per-Variant Stock */}
        <div className="p-5 rounded-2xl bg-white dark:bg-navy-900 border border-slate-200 dark:border-white/10 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-white/5 pb-3">
            <div className="flex items-center gap-2 text-xs font-bold text-navy-900 dark:text-white uppercase tracking-wider">
              <Layers className="w-4 h-4 text-orange-600 dark:text-orange-400" />
              <span>Real-Time Variant Matrix & Initial Stock</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-500 dark:text-slate-400">Total Stock:</span>
              <span className="px-2.5 py-1 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-mono font-extrabold text-xs border border-emerald-500/20">
                {computedTotalStock} pcs
              </span>
            </div>
          </div>

          <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-white/10">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-navy-950 text-slate-500 dark:text-slate-400 uppercase tracking-wider text-[11px] font-bold">
                <tr>
                  {productType !== 'STANDARD' && <th className="py-2.5 px-3">Variant Option</th>}
                  <th className="py-2.5 px-3">Generated Variant SKU</th>
                  <th className="py-2.5 px-3">Assigned Bin</th>
                  <th className="py-2.5 px-3 text-center">Initial Stock (pcs)</th>
                  {productType !== 'STANDARD' && <th className="py-2.5 px-3 text-right">Action</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-white/5">
                {generatedVariants.map((v) => {
                  const label = [v.color, v.size || v.attributeValue].filter(Boolean).join(' / ');
                  return (
                    <tr key={v.id} className="hover:bg-slate-50/50 dark:hover:bg-white/5 transition-colors">
                      {productType !== 'STANDARD' && (
                        <td className="py-2.5 px-3 font-semibold text-navy-900 dark:text-white">
                          {label || 'Standard'}
                        </td>
                      )}
                      <td className="py-2.5 px-3 font-mono font-bold text-orange-600 dark:text-orange-400">
                        {v.variantSku}
                      </td>
                      <td className="py-2.5 px-3 font-mono text-slate-500 dark:text-slate-400">
                        <span className="px-2 py-0.5 rounded bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10">
                          {selectedBin}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-center">
                        <input
                          type="number"
                          min="0"
                          value={v.stock}
                          onChange={(e) => {
                            const val = Math.max(0, parseInt(e.target.value, 10) || 0);
                            setVariantStockMap((prev) => ({
                              ...prev,
                              [v.id]: val,
                            }));
                          }}
                          className="w-20 px-2 py-1 rounded-lg bg-slate-50 dark:bg-navy-950 border border-slate-200 dark:border-white/10 text-xs font-bold text-center text-navy-900 dark:text-white focus:outline-none focus:border-orange-500"
                        />
                      </td>
                      {productType !== 'STANDARD' && (
                        <td className="py-2.5 px-3 text-right">
                          <button
                            type="button"
                            onClick={() => setExcludedVariantIds((prev) => [...prev, v.id])}
                            className="p-1 rounded text-slate-400 hover:text-rose-500 transition-colors"
                            title="Exclude this variant"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      )}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Card 7: Key Features */}
        <div className="p-5 rounded-2xl bg-white dark:bg-navy-900 border border-slate-200 dark:border-white/10 shadow-sm space-y-3">
          <div className="flex items-center gap-2 text-xs font-bold text-navy-900 dark:text-white uppercase tracking-wider border-b border-slate-100 dark:border-white/5 pb-3">
            <Sparkles className="w-4 h-4 text-orange-600 dark:text-orange-400" />
            <span>Key Product Features ({features.length} points)</span>
          </div>

          <div className="space-y-2">
            {features.map((feat, idx) => (
              <div key={idx} className="flex items-center justify-between gap-2 p-2 rounded-lg bg-slate-50 dark:bg-navy-950 border border-slate-200 dark:border-white/5 text-xs">
                <span className="text-navy-900 dark:text-slate-200">• {feat}</span>
                <button
                  type="button"
                  onClick={() => handleRemoveFeature(idx)}
                  className="p-1 text-slate-400 hover:text-rose-500 transition-colors"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}

            <div className="flex items-center gap-2 pt-1">
              <input
                type="text"
                value={newFeatureText}
                onChange={(e) => setNewFeatureText(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddFeature();
                  }
                }}
                placeholder="Add a new feature bullet point..."
                className="flex-1 px-3 py-2 bg-slate-50 dark:bg-navy-950 border border-slate-200 dark:border-white/10 rounded-lg text-xs text-navy-900 dark:text-white focus:outline-none focus:border-orange-500"
              />
              <button
                type="button"
                onClick={handleAddFeature}
                className="px-3.5 py-2 rounded-lg bg-orange-600 hover:bg-orange-700 text-white text-xs font-bold transition-colors cursor-pointer"
              >
                Add
              </button>
            </div>
          </div>
        </div>

        {/* Bottom Action Footer */}
        <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200 dark:border-white/10">
          <Link
            href="/admin/products"
            className="px-5 py-2.5 rounded-xl border border-slate-200 dark:border-white/10 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-white/5 transition-colors"
          >
            Cancel
          </Link>
          <button
            type="submit"
            className="px-6 py-2.5 rounded-xl bg-orange-600 hover:bg-orange-700 text-white text-xs sm:text-sm font-bold flex items-center gap-2 shadow-lg shadow-orange-500/25 transition-all cursor-pointer"
          >
            <Check className="w-4 h-4" />
            <span>Publish Product Under Merchant</span>
          </button>
        </div>
      </form>
    </div>
  );
}
