'use client';

import React, { useState, useEffect, useRef, useMemo } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import {
  ArrowLeft,
  Package,
  UploadCloud,
  Check,
  Tag,
  ShieldAlert,
  Plus,
  Trash2,
  Sparkles,
  Shirt,
  Smartphone,
  Sparkle,
  Apple,
  Box,
} from 'lucide-react';
import { MerchantProductItem } from '../../types';
import {
  ColorSwatch,
  ProductType,
  ProductVariantConfig,
} from '../types';
import { compressImage } from '../utils/imageCompressor';

interface ProductFormProps {
  initialProduct?: MerchantProductItem | null;
  merchantCode: string;
  onSave: (product: MerchantProductItem) => void;
}

export function ProductForm({
  initialProduct,
  merchantCode,
  onSave,
}: ProductFormProps) {
  const router = useRouter();
  const isEdit = Boolean(initialProduct);

  const mainImageInputRef = useRef<HTMLInputElement>(null);
  const colorFileInputRef = useRef<HTMLInputElement>(null);
  const [activeColorUploadId, setActiveColorUploadId] = useState<string | null>(null);

  // 1. Basic Information
  const [title, setTitle] = useState(initialProduct?.title || '');
  const [masterSku, setMasterSku] = useState(
    initialProduct?.sku || `${merchantCode}-PRD-${Math.floor(100 + Math.random() * 900)}`
  );
  const [category, setCategory] = useState(initialProduct?.category || 'Fashion');
  const [subcategory, setSubcategory] = useState(initialProduct?.subcategory || 'Hoodie');
  const [description, setDescription] = useState(initialProduct?.description || '');

  // 2. Declared Value
  const [declaredValue, setDeclaredValue] = useState(
    String(initialProduct?.price || 850)
  );

  // 3. Product Type (placed right after Declared Value as requested)
  const [productType, setProductType] = useState<ProductType>(
    initialProduct?.productType || 'FASHION'
  );

  // 4. Type-specific variant configs
  // A. Fashion: Colors & Sizes
  const [colors, setColors] = useState<ColorSwatch[]>(
    initialProduct?.colors && initialProduct.colors.length > 0
      ? initialProduct.colors
      : [
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
        ]
  );
  const [allSizes, setAllSizes] = useState<string[]>(() => {
    const defaults = ['S', 'M', 'L', 'XL', 'XXL', '3XL'];
    const existing = initialProduct?.sizes || [];
    const merged = [...defaults];
    existing.forEach((sz) => {
      if (!merged.includes(sz)) merged.push(sz);
    });
    return merged;
  });
  const [customSizeInputs, setCustomSizeInputs] = useState<Record<string, string>>({});

  // B. Electronics: Storages & Gadget Colors
  const [electronicStorages, setElectronicStorages] = useState<string[]>([
    '64GB',
    '128GB',
    '256GB',
  ]);
  const [newStorageInput, setNewStorageInput] = useState('');

  // C. Beauty: Volumes & Shades
  const [beautyVolumes, setBeautyVolumes] = useState<string[]>([
    '30ml',
    '50ml',
    '100ml',
  ]);
  const [newVolumeInput, setNewVolumeInput] = useState('');

  // D. Grocery: Pack sizes
  const [groceryPacks, setGroceryPacks] = useState<string[]>([
    '500g',
    '1kg',
    '2kg',
  ]);
  const [newPackInput, setNewPackInput] = useState('');

  // E. Variant stock map: variantId -> stock quantity
  const [variantStockMap, setVariantStockMap] = useState<Record<string, number>>(() => {
    const initialMap: Record<string, number> = {};
    if (initialProduct?.variantsList && initialProduct.variantsList.length > 0) {
      initialProduct.variantsList.forEach((v) => {
        initialMap[v.id] = v.stock;
      });
    }
    return initialMap;
  });

  const [excludedVariantIds, setExcludedVariantIds] = useState<string[]>([]);

  // Simple stock for STANDARD type
  const [standardStock, setStandardStock] = useState(
    String(initialProduct?.stock || 30)
  );

  // 5. Main Image
  const [imageUrl, setImageUrl] = useState(initialProduct?.imageUrl || '');

  // 6. Key Features
  const [features, setFeatures] = useState<string[]>(
    initialProduct?.keyFeatures && initialProduct.keyFeatures.length > 0
      ? initialProduct.keyFeatures
      : [
          'Premium cotton-blend fabric',
          'Oversized relaxed fit',
          'Soft and comfortable interior',
        ]
  );
  const [newFeatureText, setNewFeatureText] = useState('');

  // 7. Status (New products start as DRAFT / Pending Admin Approval)
  const [status, setStatus] = useState<'PUBLISHED' | 'DRAFT'>(
    initialProduct?.status === 'PUBLISHED' ? 'PUBLISHED' : 'DRAFT'
  );

  // Sync category with productType
  const handleProductTypeChange = (type: ProductType) => {
    setProductType(type);
    if (!isEdit) {
      if (type === 'FASHION') {
        setCategory('Fashion');
        setSubcategory('Hoodie');
      } else if (type === 'ELECTRONICS') {
        setCategory('Electronics');
        setSubcategory('Gadgets');
      } else if (type === 'BEAUTY') {
        setCategory('Beauty');
        setSubcategory('Skincare');
      } else if (type === 'GROCERY') {
        setCategory('Food & Grocery');
        setSubcategory('Packaged Goods');
      } else {
        setCategory('General');
        setSubcategory('Standard Item');
      }
    }
  };

  // Generate dynamic variants pairings based on active ProductType
  const generatedVariants: ProductVariantConfig[] = useMemo(() => {
    const baseSkuClean = masterSku.trim() || 'SKU';

    if (productType === 'FASHION') {
      const list: ProductVariantConfig[] = [];
      colors.forEach((c) => {
        const colorSizes = c.sizes && c.sizes.length > 0 ? c.sizes : allSizes;
        colorSizes.forEach((s) => {
          const id = `${c.name.toLowerCase().replace(/\s+/g, '-')}-${s.toLowerCase()}`;
          if (excludedVariantIds.includes(id)) return;
          const colorCode = c.name.substring(0, 3).toUpperCase();
          const variantSku = `${baseSkuClean}-${colorCode}-${s}`;
          const stock = variantStockMap[id] ?? 10;
          list.push({
            id,
            variantSku,
            color: c.name,
            size: s,
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
          const stock = variantStockMap[id] ?? 10;
          list.push({
            id,
            variantSku,
            attributeName: 'Volume',
            attributeValue: vol,
            color: c.name,
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
        const stock = variantStockMap[id] ?? 20;
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
    return [];
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
  ]);

  // Total stock calculation: sum of variants or standard stock
  const computedTotalStock = useMemo(() => {
    if (productType === 'STANDARD' || generatedVariants.length === 0) {
      return Math.max(0, Number(standardStock) || 0);
    }
    return generatedVariants.reduce((sum, v) => sum + (v.stock || 0), 0);
  }, [productType, generatedVariants, standardStock]);

  const handleStockChange = (variantId: string, val: number) => {
    setVariantStockMap((prev) => ({
      ...prev,
      [variantId]: Math.max(0, val),
    }));
  };

  const handleMainImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
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
        hex: '#6B7280',
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

  const handleRemoveVariant = (variantId: string) => {
    setExcludedVariantIds((prev) => [...prev, variantId]);
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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !masterSku.trim()) return;

    const numValue = Number(declaredValue) || 850;
    const allActiveSizes = Array.from(
      new Set(colors.flatMap((c) => (c.sizes && c.sizes.length > 0 ? c.sizes : allSizes)))
    );
    const finalImageUrl = imageUrl || colors.find((c) => Boolean(c.imageUrl))?.imageUrl || '';

    const isApprovedByAdmin =
      isEdit &&
      initialProduct?.bin &&
      initialProduct.bin !== 'Pending Approval' &&
      initialProduct.bin !== 'Assigned on intake';

    const productPayload: MerchantProductItem = {
      id: initialProduct?.id || `p-${Date.now()}`,
      title: title.trim(),
      variantLabel: initialProduct?.variantLabel || 'Standard',
      sku: masterSku.trim(),
      barcode: initialProduct?.barcode || `890${Math.floor(1000000000 + Math.random() * 9000000000)}`,
      bin: isApprovedByAdmin ? initialProduct.bin : 'Pending Approval',
      category,
      subcategory,
      productType,
      description,
      price: numValue,
      costPrice: numValue,
      stock: computedTotalStock,
      reserved: initialProduct?.reserved || 0,
      status: isApprovedByAdmin ? status : 'DRAFT',
      imageUrl: finalImageUrl.trim() || undefined,
      keyFeatures: features,
      colors,
      sizes: allActiveSizes.length > 0 ? allActiveSizes : allSizes,
      variantsList: generatedVariants,
      totalOrders: initialProduct?.totalOrders || 0,
    };

    onSave(productPayload);
    if (!isApprovedByAdmin && typeof window !== 'undefined') {
      sessionStorage.setItem('fulfillio_products_initial_tab', 'PENDING_APPROVAL');
    }
    router.push('/merchant/products');
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6 pb-16">
      {/* Top Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-4">
        <div>
          <Link
            href="/merchant/products"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-400 hover:text-emerald-400 transition-colors mb-1.5"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Back to products</span>
          </Link>
          <h1 className="text-xl sm:text-2xl font-extrabold text-slate-100 tracking-tight">
            {isEdit ? 'Edit Product' : 'Create New Product'}
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Configure master info, product type, custom variant stock & photos.
          </p>
        </div>

        <div className="flex items-center gap-2 sm:gap-3 w-full sm:w-auto">
          <Link
            href="/merchant/products"
            className="flex-1 sm:flex-initial text-center px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition-colors cursor-pointer"
          >
            Cancel
          </Link>
          <button
            type="button"
            onClick={handleSubmit}
            className="flex-1 sm:flex-initial justify-center px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition-colors cursor-pointer shadow-md shadow-emerald-900/30 flex items-center gap-1.5"
          >
            <Check className="h-4 w-4" />
            <span>{isEdit ? 'Save Changes' : 'Submit for Approval'}</span>
          </button>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Section 1: Basic Information */}
        <div className="space-y-4 p-4 sm:p-5 rounded-2xl bg-slate-900/80 border border-slate-800 shadow-sm">
          <div className="flex items-center gap-2 text-xs font-bold text-slate-200 uppercase tracking-wider">
            <Tag className="h-4 w-4 text-emerald-400" />
            <span>Basic Information</span>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              PRODUCT NAME <span className="text-rose-400">*</span>
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Mens Heavyweight Half Zip Hoodie"
              className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-slate-200 focus:outline-none focus:border-emerald-500"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                MASTER SKU <span className="text-rose-400">*</span>
              </label>
              <input
                type="text"
                required
                value={masterSku}
                onChange={(e) => setMasterSku(e.target.value.toUpperCase())}
                placeholder="e.g. HOD-HMZ-001"
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs font-mono text-emerald-400 font-bold focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                CATEGORY
              </label>
              <input
                type="text"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                placeholder="Fashion"
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-slate-200 focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                SUBCATEGORY
              </label>
              <input
                type="text"
                value={subcategory}
                onChange={(e) => setSubcategory(e.target.value)}
                placeholder="Hoodie"
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-slate-200 focus:outline-none focus:border-emerald-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              DESCRIPTION
            </label>
            <textarea
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe the product specifications, materials, and details..."
              className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-slate-200 focus:outline-none focus:border-emerald-500"
            />
          </div>
        </div>

        {/* Product Photo Upload Section */}
        <div className="p-4 sm:p-5 rounded-2xl bg-slate-900/80 border border-slate-800 shadow-sm space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
            <div className="flex items-center gap-2 text-xs font-bold text-slate-200 uppercase tracking-wider">
              <UploadCloud className="h-4 w-4 text-emerald-400" />
              <span>Product Display Photo</span>
            </div>
            <span className="text-[11px] text-slate-400">
              Primary image shown across tables, orders & catalog
            </span>
          </div>

          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 pt-1">
            {imageUrl ? (
              <div className="relative group h-24 w-24 rounded-xl bg-slate-950 border border-slate-700 overflow-hidden shrink-0 flex items-center justify-center shadow-md">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={imageUrl}
                  alt="Product Image"
                  className="h-full w-full object-cover"
                />
                <button
                  type="button"
                  onClick={() => setImageUrl('')}
                  className="absolute top-1 right-1 p-1 rounded-full bg-rose-600/90 text-white hover:bg-rose-500 shadow transition-colors cursor-pointer"
                  title="Remove image"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            ) : (
              <div
                onClick={() => mainImageInputRef.current?.click()}
                className="h-24 w-24 rounded-xl bg-slate-950 border-2 border-dashed border-slate-800 hover:border-emerald-500/50 flex flex-col items-center justify-center text-slate-500 hover:text-emerald-400 cursor-pointer transition-colors shrink-0"
              >
                <Package className="h-6 w-6 mb-1 opacity-60" />
                <span className="text-[10px] font-semibold">Upload Photo</span>
              </div>
            )}

            <div className="space-y-1.5 flex-1">
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => mainImageInputRef.current?.click()}
                  className="px-3.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold flex items-center gap-1.5 border border-slate-700 transition-colors cursor-pointer"
                >
                  <UploadCloud className="h-3.5 w-3.5 text-emerald-400" />
                  <span>{imageUrl ? 'Change Photo' : 'Upload Product Photo'}</span>
                </button>
                {imageUrl && (
                  <button
                    type="button"
                    onClick={() => setImageUrl('')}
                    className="px-3 py-1.5 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 text-xs font-semibold border border-rose-500/20 transition-colors cursor-pointer"
                  >
                    Remove Photo
                  </button>
                )}
              </div>
              <p className="text-[11px] text-slate-400">
                Supports PNG, JPG, or WebP. Auto-compressed for fast loading and zero broken images.
              </p>
            </div>
          </div>
        </div>

        {/* Section 2: Declared Product Value */}
        <div className="p-4 sm:p-5 rounded-2xl bg-slate-900/80 border border-slate-800 shadow-sm space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
            <div className="flex items-center gap-2 text-xs font-bold text-slate-200 uppercase tracking-wider">
              <ShieldAlert className="h-4 w-4 text-emerald-400" />
              <span>Product Declared Value (৳ BDT)</span>
            </div>
            <span className="text-[11px] text-slate-400">
              For loss/damage replacement valuation
            </span>
          </div>

          <div className="max-w-xs">
            <div className="relative">
              <span className="absolute left-3 top-2 text-xs font-bold text-slate-400">
                ৳
              </span>
              <input
                type="number"
                min="0"
                required
                value={declaredValue}
                onChange={(e) => setDeclaredValue(e.target.value)}
                placeholder="850"
                className="w-full pl-8 pr-4 py-2 bg-slate-950 border border-slate-800 rounded-lg text-sm font-bold text-emerald-400 focus:outline-none focus:border-emerald-500"
              />
            </div>
          </div>
          <p className="text-[11px] text-slate-500 leading-relaxed">
            ℹ️ যদি কোনো প্রোডাক্টে কোনো সমস্যা হয় বা ওয়্যারহাউসে হারিয়ে যায়, তবে ক্ষতিপূরণ ও ইনস্যুরেন্স ক্লেইমের জন্য এই ভ্যালু ব্যবহার করা হবে। কাস্টমার অর্ডারের বিক্রয়মূল্য অর্ডারের সাথে সংযুক্ত থাকবে।
          </p>
        </div>

        {/* Section 3: Product Type & Dynamic Variant Attributes (Placed right after Declared Value!) */}
        <div className="p-4 sm:p-5 rounded-2xl bg-slate-900/80 border border-slate-800 shadow-sm space-y-5">
          <div>
            <div className="flex items-center gap-2 text-xs font-bold text-slate-200 uppercase tracking-wider">
              <Sparkles className="h-4 w-4 text-emerald-400" />
              <span>Product Type & Variant Configurations</span>
            </div>
            <p className="text-xs text-slate-400 mt-1">
              Select product archetype to reveal tailored variant options (e.g. Apparel gets Color+Size, Electronics gets Storage+Color, Beauty gets Volume+Shade).
            </p>
          </div>

          {/* Product Type Cards Selector */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2 sm:gap-3">
            {[
              {
                id: 'FASHION' as const,
                label: 'Fashion & Apparel',
                sub: 'Color + Size Matrix',
                icon: <Shirt className="h-4 w-4" />,
              },
              {
                id: 'ELECTRONICS' as const,
                label: 'Electronics & Gadgets',
                sub: 'Storage + Color',
                icon: <Smartphone className="h-4 w-4" />,
              },
              {
                id: 'BEAUTY' as const,
                label: 'Beauty & Skincare',
                sub: 'Volume + Shade',
                icon: <Sparkle className="h-4 w-4" />,
              },
              {
                id: 'GROCERY' as const,
                label: 'Food & Grocery',
                sub: 'Pack Size / Weight',
                icon: <Apple className="h-4 w-4" />,
              },
              {
                id: 'STANDARD' as const,
                label: 'Standard / General',
                sub: 'Single SKU item',
                icon: <Box className="h-4 w-4" />,
              },
            ].map((t) => {
              const isSelected = productType === t.id;
              return (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => handleProductTypeChange(t.id)}
                  className={`p-3 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between gap-2 ${
                    isSelected
                      ? 'bg-emerald-600/15 border-emerald-500 text-emerald-300 ring-2 ring-emerald-500/20'
                      : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700 hover:text-slate-200'
                  }`}
                >
                  <div className="h-7 w-7 rounded-lg bg-slate-900 border border-slate-800 flex items-center justify-center text-emerald-400 shrink-0">
                    {t.icon}
                  </div>
                  <div>
                    <span className="text-xs font-bold block leading-tight text-slate-100">
                      {t.label}
                    </span>
                    <span className="text-[10px] text-slate-500 block mt-0.5">
                      {t.sub}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>

          {/* DYNAMIC ATTRIBUTES AREA BASED ON SELECTED PRODUCT TYPE */}

          {/* 1. FASHION & APPAREL: Colors & Sizes */}
          {productType === 'FASHION' && (
            <div className="space-y-5 pt-3 border-t border-slate-800">
              {/* Color Swatches */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-200 uppercase tracking-wider">
                    Color Swatches & Photos
                  </span>
                  <button
                    type="button"
                    onClick={handleAddColor}
                    className="text-xs font-semibold text-emerald-400 hover:text-emerald-300 flex items-center gap-1 cursor-pointer"
                  >
                    <Plus className="h-3.5 w-3.5" />
                    <span>Add Another Color</span>
                  </button>
                </div>

                <div className="space-y-3">
                  {colors.map((c) => {
                    const activeSizes = c.sizes && c.sizes.length > 0 ? c.sizes : allSizes;
                    return (
                      <div
                        key={c.id}
                        className="p-3 sm:p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-3"
                      >
                        <div className="flex flex-col sm:flex-row sm:items-center gap-2.5 sm:gap-3">
                          {/* Row 1 on mobile: Color picker & Color name */}
                          <div className="flex items-center gap-2.5 flex-1 min-w-0">
                            <input
                              type="color"
                              value={c.hex}
                              onChange={(e) => {
                                const hex = e.target.value;
                                setColors(colors.map((item) => (item.id === c.id ? { ...item, hex } : item)));
                              }}
                              className="h-8 w-8 rounded-lg cursor-pointer bg-transparent border-0 shrink-0"
                              title="Choose color"
                            />
                            <input
                              type="text"
                              value={c.name}
                              onChange={(e) => {
                                const name = e.target.value;
                                setColors(colors.map((item) => (item.id === c.id ? { ...item, name } : item)));
                              }}
                              placeholder="Color Name (e.g. Black)"
                              className="flex-1 px-3 py-1.5 bg-slate-900 border border-slate-800 rounded-lg text-xs text-slate-200 focus:outline-none focus:border-emerald-500"
                            />
                            {colors.length > 1 && (
                              <button
                                type="button"
                                onClick={() => handleRemoveColor(c.id)}
                                className="sm:hidden p-1.5 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-slate-900 transition-colors cursor-pointer shrink-0"
                                title="Delete color"
                              >
                                <Trash2 className="h-4 w-4" />
                              </button>
                            )}
                          </div>

                          {/* Row 2 on mobile: Photo Preview & Upload Button */}
                          <div className="flex items-center gap-2 w-full sm:w-auto">
                            <div className="relative h-9 w-9 rounded-lg bg-slate-900 border border-slate-800 overflow-hidden shrink-0 flex items-center justify-center">
                              {c.imageUrl ? (
                                c.imageUrl.startsWith('data:') ? (
                                  // eslint-disable-next-line @next/next/no-img-element
                                  <img
                                    src={c.imageUrl}
                                    alt={c.name}
                                    className="h-full w-full object-cover"
                                  />
                                ) : (
                                  <Image
                                    src={c.imageUrl}
                                    alt={c.name}
                                    fill
                                    unoptimized={true}
                                    sizes="36px"
                                    className="object-cover"
                                  />
                                )
                              ) : (
                                <Package className="h-4 w-4 text-slate-600" />
                              )}
                            </div>

                            <button
                              type="button"
                              onClick={() => {
                                setActiveColorUploadId(c.id);
                                colorFileInputRef.current?.click();
                              }}
                              className="flex-1 sm:flex-initial justify-center px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer border border-slate-700"
                            >
                              <UploadCloud className="h-3.5 w-3.5 text-emerald-400" />
                              <span>Upload Image</span>
                            </button>

                            {colors.length > 1 && (
                              <button
                                type="button"
                                onClick={() => handleRemoveColor(c.id)}
                                className="hidden sm:inline-flex p-1.5 rounded-lg text-slate-500 hover:text-rose-400 transition-colors cursor-pointer shrink-0"
                                title="Delete color"
                              >
                                <Trash2 className="h-4 w-4" />
                              </button>
                            )}
                          </div>
                        </div>

                        {/* Per-color sizes customization with custom size adder */}
                        <div className="pt-3 border-t border-slate-900 space-y-2.5">
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                            <div className="text-[11px] text-slate-400">
                              Available Sizes for <strong className="text-slate-200">{c.name || 'this color'}</strong>:
                            </div>

                            {/* Custom size input */}
                            <div className="flex items-center gap-1.5 w-full sm:w-auto">
                              <input
                                type="text"
                                placeholder="+ Custom Size (e.g. 4XL)"
                                value={customSizeInputs[c.id] || ''}
                                onChange={(e) =>
                                  setCustomSizeInputs({ ...customSizeInputs, [c.id]: e.target.value })
                                }
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter') {
                                    e.preventDefault();
                                    handleAddCustomSizeToColor(c.id);
                                  }
                                }}
                                className="px-2.5 py-1.5 bg-slate-900 border border-slate-800 rounded-lg text-xs text-slate-200 placeholder:text-slate-500 focus:outline-none focus:border-emerald-500 flex-1 sm:w-44"
                              />
                              <button
                                type="button"
                                onClick={() => handleAddCustomSizeToColor(c.id)}
                                className="px-3 py-1.5 rounded-lg bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-400 border border-emerald-500/30 text-xs font-semibold flex items-center gap-1 cursor-pointer transition-colors shrink-0"
                              >
                                <Plus className="h-3 w-3" />
                                <span>Add Size</span>
                              </button>
                            </div>
                          </div>

                          {/* Size buttons */}
                          <div className="flex items-center gap-1.5 flex-wrap">
                            {allSizes.map((sz) => {
                              const isSzActive = activeSizes.includes(sz);
                              const isDefault = ['S', 'M', 'L', 'XL', 'XXL', '3XL'].includes(sz);
                              return (
                                <div key={sz} className="inline-flex items-center">
                                  <button
                                    type="button"
                                    onClick={() => handleToggleColorSize(c.id, sz)}
                                    className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer border ${
                                      isSzActive
                                        ? 'bg-emerald-600/20 text-emerald-300 border-emerald-500/50 shadow-sm'
                                        : 'bg-slate-900 text-slate-500 border-slate-800 hover:text-slate-300 hover:border-slate-700'
                                    }`}
                                  >
                                    <span>{sz}</span>
                                    {isSzActive && <span className="ml-1 text-emerald-400 font-bold">✓</span>}
                                  </button>
                                  {!isDefault && (
                                    <button
                                      type="button"
                                      onClick={() => handleRemoveCustomSize(sz)}
                                      title={`Delete custom size ${sz}`}
                                      className="ml-1 p-0.5 text-slate-500 hover:text-rose-400 text-xs cursor-pointer"
                                    >
                                      ×
                                    </button>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* 2. ELECTRONICS & GADGETS: Storage & Colors */}
          {productType === 'ELECTRONICS' && (
            <div className="space-y-5 pt-3 border-t border-slate-800">
              <div className="space-y-3">
                <span className="text-xs font-bold text-slate-200 uppercase tracking-wider block">
                  Storage / Model Configurations
                </span>
                <div className="flex items-center gap-2 flex-wrap">
                  {electronicStorages.map((storage) => (
                    <span
                      key={storage}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-950 border border-slate-800 text-xs font-mono font-bold text-slate-200"
                    >
                      <span>{storage}</span>
                      <button
                        type="button"
                        onClick={() =>
                          setElectronicStorages(electronicStorages.filter((s) => s !== storage))
                        }
                        className="text-slate-500 hover:text-rose-400"
                      >
                        ×
                      </button>
                    </span>
                  ))}
                </div>
                <div className="flex gap-2 max-w-xs">
                  <input
                    type="text"
                    value={newStorageInput}
                    onChange={(e) => setNewStorageInput(e.target.value)}
                    placeholder="e.g. 512GB"
                    className="flex-1 px-3 py-1.5 bg-slate-950 border border-slate-800 rounded-lg text-xs text-slate-200 focus:outline-none focus:border-emerald-500"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      if (newStorageInput.trim()) {
                        setElectronicStorages([...electronicStorages, newStorageInput.trim()]);
                        setNewStorageInput('');
                      }
                    }}
                    className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs text-slate-200 font-semibold"
                  >
                    Add
                  </button>
                </div>
              </div>

              {/* Color variants for electronics */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-200 uppercase tracking-wider">
                    Device Colors
                  </span>
                  <button
                    type="button"
                    onClick={handleAddColor}
                    className="text-xs font-semibold text-emerald-400 hover:text-emerald-300 flex items-center gap-1 cursor-pointer"
                  >
                    <Plus className="h-3.5 w-3.5" />
                    <span>Add Color</span>
                  </button>
                </div>
                <div className="flex gap-2 flex-wrap">
                  {colors.map((c) => (
                    <span
                      key={c.id}
                      className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-200 font-medium"
                    >
                      <span
                        className="h-3 w-3 rounded-full border border-slate-700"
                        style={{ backgroundColor: c.hex }}
                      />
                      <span>{c.name}</span>
                    </span>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* 3. BEAUTY & SKINCARE: Volumes & Shades */}
          {productType === 'BEAUTY' && (
            <div className="space-y-5 pt-3 border-t border-slate-800">
              <div className="space-y-3">
                <span className="text-xs font-bold text-slate-200 uppercase tracking-wider block">
                  Volume / Container Sizes
                </span>
                <div className="flex items-center gap-2 flex-wrap">
                  {beautyVolumes.map((vol) => (
                    <span
                      key={vol}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-950 border border-slate-800 text-xs font-mono font-bold text-slate-200"
                    >
                      <span>{vol}</span>
                      <button
                        type="button"
                        onClick={() => setBeautyVolumes(beautyVolumes.filter((v) => v !== vol))}
                        className="text-slate-500 hover:text-rose-400"
                      >
                        ×
                      </button>
                    </span>
                  ))}
                </div>
                <div className="flex gap-2 max-w-xs">
                  <input
                    type="text"
                    value={newVolumeInput}
                    onChange={(e) => setNewVolumeInput(e.target.value)}
                    placeholder="e.g. 150ml"
                    className="flex-1 px-3 py-1.5 bg-slate-950 border border-slate-800 rounded-lg text-xs text-slate-200 focus:outline-none focus:border-emerald-500"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      if (newVolumeInput.trim()) {
                        setBeautyVolumes([...beautyVolumes, newVolumeInput.trim()]);
                        setNewVolumeInput('');
                      }
                    }}
                    className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs text-slate-200 font-semibold"
                  >
                    Add
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* 4. FOOD & GROCERY: Pack sizes */}
          {productType === 'GROCERY' && (
            <div className="space-y-5 pt-3 border-t border-slate-800">
              <div className="space-y-3">
                <span className="text-xs font-bold text-slate-200 uppercase tracking-wider block">
                  Pack Sizes / Net Weight
                </span>
                <div className="flex items-center gap-2 flex-wrap">
                  {groceryPacks.map((pack) => (
                    <span
                      key={pack}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-950 border border-slate-800 text-xs font-mono font-bold text-slate-200"
                    >
                      <span>{pack}</span>
                      <button
                        type="button"
                        onClick={() => setGroceryPacks(groceryPacks.filter((p) => p !== pack))}
                        className="text-slate-500 hover:text-rose-400"
                      >
                        ×
                      </button>
                    </span>
                  ))}
                </div>
                <div className="flex gap-2 w-full sm:max-w-xs">
                  <input
                    type="text"
                    value={newPackInput}
                    onChange={(e) => setNewPackInput(e.target.value)}
                    placeholder="e.g. 5kg"
                    className="flex-1 px-3 py-1.5 bg-slate-950 border border-slate-800 rounded-lg text-xs text-slate-200 focus:outline-none focus:border-emerald-500"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      if (newPackInput.trim()) {
                        setGroceryPacks([...groceryPacks, newPackInput.trim()]);
                        setNewPackInput('');
                      }
                    }}
                    className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs text-slate-200 font-semibold"
                  >
                    Add
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* 5. VARIANT INVENTORY GRID: Custom Stock per Variant pairing (From Image 1 & 4) */}
          {productType !== 'STANDARD' && generatedVariants.length > 0 && (
            <div className="space-y-3 pt-3 border-t border-slate-800">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <span className="text-xs font-bold text-slate-200 uppercase tracking-wider block">
                    Variant Inventory Grid
                  </span>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    Configure initial stock count for each Color, Size, and Specification pairing.
                  </p>
                </div>
                <div className="text-left sm:text-right">
                  <span className="text-xs text-slate-400">Total Computed Stock:</span>
                  <span className="ml-1.5 font-mono text-emerald-400 font-extrabold text-sm">
                    {computedTotalStock} units
                  </span>
                </div>
              </div>

              {/* Mobile Card List for Variants */}
              <div className="block sm:hidden space-y-2.5">
                {generatedVariants.map((v) => (
                  <div
                    key={v.id}
                    className="p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-2 text-xs"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-emerald-400 font-mono font-semibold text-[11px]">
                        {v.variantSku}
                      </span>
                      <button
                        type="button"
                        onClick={() => handleRemoveVariant(v.id)}
                        className="p-1 rounded text-slate-500 hover:text-rose-400 hover:bg-slate-900 transition-colors cursor-pointer"
                        title="Exclude this variant"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                    <div className="flex items-center justify-between text-slate-300">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="text-slate-400 font-sans">
                          {v.color || v.attributeName || 'Standard'}
                        </span>
                        <span className="text-slate-600">•</span>
                        <span className="px-2 py-0.5 rounded bg-slate-850 text-slate-200 border border-slate-700/80 font-mono text-[11px]">
                          {v.size || v.attributeValue || 'Default'}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-[11px] text-slate-500 font-medium">Stock:</span>
                        <input
                          type="number"
                          min="0"
                          value={v.stock}
                          onChange={(e) =>
                            handleStockChange(v.id, Number(e.target.value) || 0)
                          }
                          className="w-20 px-2.5 py-1 text-right bg-slate-900 border border-slate-700 rounded-lg text-xs font-bold text-slate-100 focus:outline-none focus:border-emerald-500"
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Desktop Table View */}
              <div className="hidden sm:block rounded-xl border border-slate-800 overflow-x-auto bg-slate-950">
                <table className="w-full text-left text-xs min-w-[500px]">
                  <thead className="bg-slate-900/90 text-slate-400 font-semibold border-b border-slate-800 uppercase text-[10px]">
                    <tr>
                      <th className="p-3">Variant SKU</th>
                      <th className="p-3">Color / Attribute</th>
                      <th className="p-3">Size / Spec</th>
                      <th className="p-3 text-right">Initial Stock</th>
                      <th className="p-3 text-right w-12">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/80 font-mono">
                    {generatedVariants.map((v) => (
                      <tr key={v.id} className="hover:bg-slate-900/40">
                        <td className="p-3 text-emerald-400 font-semibold text-[11px]">
                          {v.variantSku}
                        </td>
                        <td className="p-3 text-slate-300 font-sans">
                          {v.color || v.attributeName || 'Standard'}
                        </td>
                        <td className="p-3 text-slate-400">
                          <span className="px-2 py-0.5 rounded bg-slate-850 text-slate-200 border border-slate-700/80">
                            {v.size || v.attributeValue || 'Default'}
                          </span>
                        </td>
                        <td className="p-3 text-right">
                          <input
                            type="number"
                            min="0"
                            value={v.stock}
                            onChange={(e) =>
                              handleStockChange(v.id, Number(e.target.value) || 0)
                            }
                            className="w-20 px-2.5 py-1 text-right bg-slate-900 border border-slate-700 rounded-lg text-xs font-bold text-slate-100 focus:outline-none focus:border-emerald-500"
                          />
                        </td>
                        <td className="p-3 text-right">
                          <button
                            type="button"
                            onClick={() => handleRemoveVariant(v.id)}
                            className="p-1 rounded text-slate-500 hover:text-rose-400 hover:bg-slate-900 transition-colors cursor-pointer"
                            title="Exclude this variant"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* STANDARD PRODUCT STOCK INPUT */}
          {productType === 'STANDARD' && (
            <div className="pt-3 border-t border-slate-800">
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Initial Warehouse Stock Units
              </label>
              <input
                type="number"
                min="0"
                value={standardStock}
                onChange={(e) => setStandardStock(e.target.value)}
                placeholder="50"
                className="w-full sm:w-48 px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs font-bold text-slate-200 focus:outline-none focus:border-emerald-500"
              />
            </div>
          )}
        </div>

        {/* Section 4: Key Features (Bullet points) */}
        <div className="space-y-3 p-4 sm:p-5 rounded-2xl bg-slate-900/80 border border-slate-800 shadow-sm">
          <span className="text-xs font-bold text-slate-200 uppercase tracking-wider block">
            Key Features
          </span>
          <div className="flex flex-col sm:flex-row gap-2">
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
              placeholder="e.g. Premium heavy cotton-blend fleece"
              className="flex-1 px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-slate-200 focus:outline-none focus:border-emerald-500"
            />
            <button
              type="button"
              onClick={handleAddFeature}
              className="w-full sm:w-auto px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-200 transition-colors cursor-pointer text-center"
            >
              Add Feature
            </button>
          </div>

          <div className="space-y-1.5 pt-1">
            {features.map((feat, idx) => (
              <div
                key={idx}
                className="flex items-center justify-between p-2 rounded-lg bg-slate-950 border border-slate-800/80 text-xs"
              >
                <span className="text-slate-300">• {feat}</span>
                <button
                  type="button"
                  onClick={() => handleRemoveFeature(idx)}
                  className="text-rose-400 hover:text-rose-300 text-[11px] font-medium transition-colors cursor-pointer"
                >
                  Remove
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Section 6: Visibility Status */}
        <div className="p-4 sm:p-5 rounded-2xl bg-slate-900/80 border border-slate-800 shadow-sm space-y-2">
          <label className="block text-xs font-semibold text-slate-300">
            Storefront &amp; Warehouse Visibility
          </label>
          {!isEdit ||
          !initialProduct?.bin ||
          initialProduct.bin === 'Pending Approval' ||
          initialProduct.bin === 'Assigned on intake' ? (
            <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs font-medium flex items-center gap-2">
              <ShieldAlert className="h-4 w-4 text-amber-400 shrink-0" />
              <span>
                নতুন প্রোডাক্ট আপলোড করার পর এটি <strong>Pending Admin Approval</strong> হিসেবে থাকবে। Admin Panel থেকে Bin অ্যাসাইন ও Approve করার পর স্বয়ংক্রিয়ভাবে <strong>Published</strong> হয়ে যাবে।
              </span>
            </div>
          ) : (
            <div className="flex gap-2.5 sm:gap-3 w-full sm:max-w-xs">
              <button
                type="button"
                onClick={() => setStatus('PUBLISHED')}
                className={`flex-1 py-2 px-3 rounded-lg text-xs font-semibold border transition-all cursor-pointer ${
                  status === 'PUBLISHED'
                    ? 'bg-emerald-600/20 text-emerald-300 border-emerald-500/50'
                    : 'bg-slate-950 text-slate-400 border-slate-800 hover:bg-slate-800'
                }`}
              >
                Published
              </button>
              <button
                type="button"
                onClick={() => setStatus('DRAFT')}
                className={`flex-1 py-2 px-3 rounded-lg text-xs font-semibold border transition-all cursor-pointer ${
                  status === 'DRAFT'
                    ? 'bg-slate-800 text-slate-200 border-slate-600'
                    : 'bg-slate-950 text-slate-400 border-slate-800 hover:bg-slate-800'
                }`}
              >
                Draft
              </button>
            </div>
          )}
        </div>

        {/* Bottom Actions */}
        <div className="pt-4 border-t border-slate-800 flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-end gap-2.5 sm:gap-3">
          <Link
            href="/merchant/products"
            className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition-colors cursor-pointer text-center"
          >
            Cancel
          </Link>
          <button
            type="submit"
            className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition-colors cursor-pointer shadow-md flex items-center justify-center gap-1.5"
          >
            <Check className="h-4 w-4" />
            <span>{isEdit ? 'Save Changes' : 'Submit for Approval'}</span>
          </button>
        </div>
      </form>

      {/* Hidden file input for main product photo */}
      <input
        type="file"
        ref={mainImageInputRef}
        onChange={handleMainImageChange}
        accept="image/*"
        className="hidden"
      />

      {/* Hidden file input for color swatches */}
      <input
        type="file"
        ref={colorFileInputRef}
        onChange={handleColorFileChange}
        accept="image/*"
        className="hidden"
      />
    </div>
  );
}
