'use client';

import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  ArrowLeft,
  Package,
  UploadCloud,
  Check,
  Plus,
  Trash2,
  ExternalLink,
  AlertCircle,
  X,
  Star,
  Link as LinkIcon,
  Shirt,
  Smartphone,
  Sparkle,
  Apple,
  Box,
  RefreshCw,
  Copy,
  ChevronDown,
  Info,
  SlidersHorizontal,
} from 'lucide-react';
import { SAMPLE_PRODUCT_PRESETS } from '../utils/imageCompressor';
import { MerchantProductItem } from '../../types';
import {
  ColorSwatch,
  ProductType,
  ProductVariantConfig,
} from '../types';
import { compressImage, compressThumbnail } from '../utils/imageCompressor';
import { ColorPickerInput } from './ColorPickerInput';
import { useMerchant } from '@/features/merchant/portal/MerchantContext';
import { MerchantCategoryItem } from '../../types';

interface ProductFormProps {
  initialProduct?: MerchantProductItem | null;
  merchantCode: string;
  onSave: (product: MerchantProductItem) => Promise<{ ok: boolean; error?: string } | void> | void;
}

export function ProductForm({
  initialProduct,
  merchantCode,
  onSave,
}: ProductFormProps) {
  const router = useRouter();
  const isEdit = Boolean(initialProduct);
  const { categories } = useMerchant();

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [copiedSku, setCopiedSku] = useState(false);

  const mainImageInputRef = useRef<HTMLInputElement>(null);
  const colorFileInputRef = useRef<HTMLInputElement>(null);
  const galleryFileInputRef = useRef<HTMLInputElement>(null);
  const [activeColorUploadId, setActiveColorUploadId] = useState<string | null>(null);

  // 1. Core Identification
  const [title, setTitle] = useState(initialProduct?.title || '');
  const [masterSku, setMasterSku] = useState(
    initialProduct?.sku || `${merchantCode}-PRD-${Math.floor(100 + Math.random() * 900)}`
  );
  const [category, setCategory] = useState(initialProduct?.category || 'Fashion');
  const [subcategory, setSubcategory] = useState(initialProduct?.subcategory || 'Hoodie');
  const [description, setDescription] = useState(initialProduct?.description || '');

  // 2. Valuation & Commercials
  const [declaredValue, setDeclaredValue] = useState(String(initialProduct?.price || 850));
  const [costPrice, setCostPrice] = useState(String(initialProduct?.costPrice || 600));

  // 3. Archetype
  const [productType, setProductType] = useState<ProductType>(
    initialProduct?.productType || 'FASHION'
  );

  // 4. Variants: Colors & Sizes
  const [colors, setColors] = useState<ColorSwatch[]>(
    initialProduct?.colors && initialProduct.colors.length > 0
      ? initialProduct.colors
      : [
          {
            id: 'c-1',
            name: 'Jet Black',
            hex: '#111827',
            imageUrl: '',
            sizes: ['S', 'M', 'L', 'XL', 'XXL'],
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

  const [electronicStorages, setElectronicStorages] = useState<string[]>(['64GB', '128GB', '256GB']);
  const [newStorageInput, setNewStorageInput] = useState('');

  const [beautyVolumes, setBeautyVolumes] = useState<string[]>(['30ml', '50ml', '100ml']);
  const [newVolumeInput, setNewVolumeInput] = useState('');

  const [groceryPacks, setGroceryPacks] = useState<string[]>(['500g', '1kg', '2kg']);
  const [newPackInput, setNewPackInput] = useState('');

  // Bulk Stock Setter
  const [bulkStockValue, setBulkStockValue] = useState<string>('20');

  // Variant Stock Map
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
  const [standardStock, setStandardStock] = useState(String(initialProduct?.stock || 30));

  // 5. Visual Media
  const [imageUrl, setImageUrl] = useState(initialProduct?.imageUrl || '');
  const [galleryImages, setGalleryImages] = useState<string[]>(() => {
    if (initialProduct?.images && initialProduct.images.length > 0) {
      const main = initialProduct.imageUrl || '';
      return initialProduct.images.filter((img) => img !== main);
    }
    return [];
  });
  const [imageInputMode, setImageInputMode] = useState<'UPLOAD' | 'URL' | 'PRESET'>('UPLOAD');
  const [urlInput, setUrlInput] = useState('');
  const [urlError, setUrlError] = useState<string | null>(null);

  // 6. Features & Highlights
  const [features, setFeatures] = useState<string[]>(
    initialProduct?.keyFeatures && initialProduct.keyFeatures.length > 0
      ? initialProduct.keyFeatures
      : [
          'Heavyweight cotton-blend fleece',
          'Tailored oversized relaxed fit',
          'Preshrunk brushed interior',
        ]
  );
  const [newFeatureText, setNewFeatureText] = useState('');

  // 7. Logistics & Fulfillment Options
  const [deliveryTime, setDeliveryTime] = useState('2-3 business days');
  const [enableCod, setEnableCod] = useState(true);
  const [enableReturns, setEnableReturns] = useState(true);
  const [enableFragile, setEnableFragile] = useState(false);

  // 8. Visibility Status
  const [status, setStatus] = useState<'PUBLISHED' | 'DRAFT'>(
    initialProduct?.status === 'PUBLISHED' ? 'PUBLISHED' : 'DRAFT'
  );

  // Categories helper
  const currentCategoryObj = useMemo(() => {
    return (
      categories.find((c: MerchantCategoryItem) => c.name.toLowerCase() === category.toLowerCase()) ||
      categories.find((c: MerchantCategoryItem) => c.slug.toLowerCase() === category.toLowerCase()) ||
      null
    );
  }, [categories, category]);

  const subcategoryList = useMemo(() => {
    return currentCategoryObj?.subcategories || [];
  }, [currentCategoryObj]);

  // Sync state when initialProduct updates
  useEffect(() => {
    if (!initialProduct) return;
    setTitle(initialProduct.title || '');
    setMasterSku(initialProduct.sku || '');
    setCategory(initialProduct.category || 'Fashion');
    setSubcategory(initialProduct.subcategory || 'Hoodie');
    setDescription(initialProduct.description || '');
    setDeclaredValue(String(initialProduct.price || 850));
    setCostPrice(String(initialProduct.costPrice || Math.round((initialProduct.price || 850) * 0.7)));
    setProductType(initialProduct.productType || 'FASHION');
    setImageUrl(initialProduct.imageUrl || '');
    if (initialProduct.images && initialProduct.images.length > 0) {
      const main = initialProduct.imageUrl || '';
      setGalleryImages(initialProduct.images.filter((img) => img !== main));
    } else {
      setGalleryImages([]);
    }
    if (initialProduct.colors && initialProduct.colors.length > 0) {
      setColors(initialProduct.colors);
    }
    if (initialProduct.sizes && initialProduct.sizes.length > 0) {
      setAllSizes(initialProduct.sizes);
    }
    if (initialProduct.keyFeatures && initialProduct.keyFeatures.length > 0) {
      setFeatures(initialProduct.keyFeatures);
    }
    if (initialProduct.stock !== undefined) {
      setStandardStock(String(initialProduct.stock));
    }
    setStatus(initialProduct.status === 'PUBLISHED' ? 'PUBLISHED' : 'DRAFT');
  }, [initialProduct]);

  // Archetype change handler
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
          const stock = variantStockMap[id] ?? 15;
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

  // Total stock calculation
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

  const handleBulkApplyStock = () => {
    const val = Math.max(0, parseInt(bulkStockValue, 10) || 0);
    const updated: Record<string, number> = { ...variantStockMap };
    generatedVariants.forEach((v) => {
      updated[v.id] = val;
    });
    setVariantStockMap(updated);
  };

  const handleMainImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const compressed = await compressImage(file);
      setImageUrl(compressed);
      setColors((prev) =>
        prev.map((c, idx) => (idx === 0 && !c.imageUrl ? { ...c, imageUrl: compressed } : c))
      );
    } catch (err) {
      console.error('Failed to compress image:', err);
    } finally {
      if (mainImageInputRef.current) mainImageInputRef.current.value = '';
    }
  };

  const handleGalleryFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    try {
      for (const file of files) {
        const compressed = await compressImage(file, 600, 600, 0.75);
        if (!imageUrl) {
          setImageUrl(compressed);
        } else {
          setGalleryImages((prev) => {
            if (!prev.includes(compressed)) return [...prev, compressed];
            return prev;
          });
        }
      }
    } catch (err) {
      console.error('Failed to compress gallery image:', err);
    } finally {
      if (galleryFileInputRef.current) galleryFileInputRef.current.value = '';
    }
  };

  const handleAddUrlImage = () => {
    const trimmed = (urlInput || '').trim();
    if (!trimmed) {
      setUrlError('Please enter a valid image URL');
      return;
    }
    if (!trimmed.startsWith('http://') && !trimmed.startsWith('https://') && !trimmed.startsWith('data:')) {
      setUrlError('URL must start with http:// or https://');
      return;
    }
    setUrlError(null);
    if (!imageUrl) {
      setImageUrl(trimmed);
      setColors((prev) =>
        prev.map((c, idx) => (idx === 0 && !c.imageUrl ? { ...c, imageUrl: trimmed } : c))
      );
    } else {
      setGalleryImages((prev) => (!prev.includes(trimmed) ? [...prev, trimmed] : prev));
    }
    setUrlInput('');
  };

  const handleApplyPreset = (presetUrl: string) => {
    if (!imageUrl) {
      setImageUrl(presetUrl);
      setColors((prev) =>
        prev.map((c, idx) => (idx === 0 && !c.imageUrl ? { ...c, imageUrl: presetUrl } : c))
      );
    } else {
      setGalleryImages((prev) => (!prev.includes(presetUrl) ? [...prev, presetUrl] : prev));
    }
  };

  const handleSetAsMainPhoto = (newMainUrl: string) => {
    if (!newMainUrl || newMainUrl === imageUrl) return;
    const oldMain = imageUrl;
    setImageUrl(newMainUrl);
    setGalleryImages((prev) => {
      const filtered = prev.filter((u) => u !== newMainUrl);
      return oldMain ? [oldMain, ...filtered] : filtered;
    });
  };

  const handleRemovePhoto = (targetUrl: string) => {
    if (targetUrl === imageUrl) {
      if (galleryImages.length > 0) {
        const nextMain = galleryImages[0];
        setImageUrl(nextMain);
        setGalleryImages((prev) => prev.slice(1));
      } else {
        setImageUrl('');
      }
    } else {
      setGalleryImages((prev) => prev.filter((u) => u !== targetUrl));
    }
  };

  const handleColorFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !activeColorUploadId) return;

    try {
      const compressed = await compressThumbnail(file);
      setColors((prev) =>
        prev.map((c) => (c.id === activeColorUploadId ? { ...c, imageUrl: compressed } : c))
      );
      if (!imageUrl) setImageUrl(compressed);
    } catch (err) {
      console.error('Image compression error:', err);
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

  const handleGenerateNewSku = () => {
    const rand = Math.floor(100 + Math.random() * 900);
    setMasterSku(`${merchantCode}-PRD-${rand}`);
  };

  const handleCopySku = () => {
    if (typeof navigator !== 'undefined') {
      navigator.clipboard.writeText(masterSku);
      setCopiedSku(true);
      setTimeout(() => setCopiedSku(false), 2000);
    }
  };

  // Gross Margin & Profit
  const calculatedProfit = useMemo(() => {
    const val = Number(declaredValue) || 0;
    const cost = Number(costPrice) || 0;
    const profit = Math.max(0, val - cost);
    const margin = val > 0 ? Math.round((profit / val) * 100) : 0;
    return { profit, margin };
  }, [declaredValue, costPrice]);

  const activeBarcodeString = useMemo(() => {
    return initialProduct?.barcode || `890${Math.floor(1000000000 + Math.random() * 9000000000)}`;
  }, [initialProduct?.barcode]);

  // Submit Handler
  const handleSubmit = useCallback(async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (isSubmitting) return;

    if (!title.trim()) {
      setSubmitError('Product name is required. Please provide a title.');
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }
    if (!masterSku.trim()) {
      setSubmitError('Product SKU is required for warehouse inventory tracking.');
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    setSubmitError(null);
    setIsSubmitting(true);

    const numValue = Number(declaredValue) || 850;
    const numCost = Number(costPrice) || Math.round(numValue * 0.7);
    const allActiveSizes = Array.from(
      new Set(colors.flatMap((c) => (c.sizes && c.sizes.length > 0 ? c.sizes : allSizes)))
    );
    const primaryImage = (imageUrl || galleryImages[0] || '').trim();

    const isApprovedByAdmin =
      isEdit &&
      initialProduct?.bin &&
      initialProduct.bin !== 'Pending Approval' &&
      initialProduct.bin !== 'Assigned on intake' &&
      initialProduct.status !== 'PENDING_APPROVAL' &&
      initialProduct.status !== 'DRAFT';

    const allActiveImages = Array.from(
      new Set(
        [
          primaryImage,
          ...galleryImages,
          ...colors.map((c) => (c.imageUrl || '').trim()),
        ].filter((u): u is string => Boolean(u && u.trim()))
      )
    );

    const cleanedVariants = generatedVariants.map((v) => {
      const matchColor = colors.find(
        (c) => (c.name || '').trim().toLowerCase() === (v.color || '').trim().toLowerCase()
      );
      const varImg = matchColor?.imageUrl || primaryImage;
      return {
        ...v,
        imageUrl: varImg,
      };
    });

    const productPayload: MerchantProductItem = {
      id: initialProduct?.id || `p-${Date.now()}`,
      title: title.trim(),
      variantLabel: initialProduct?.variantLabel || 'Standard',
      sku: masterSku.trim(),
      barcode: activeBarcodeString,
      bin: isApprovedByAdmin ? initialProduct.bin : 'Pending Approval',
      category,
      subcategory,
      productType,
      description,
      price: numValue,
      costPrice: numCost,
      stock: computedTotalStock,
      reserved: initialProduct?.reserved || 0,
      status: status === 'DRAFT' ? 'DRAFT' : isApprovedByAdmin ? status : 'PENDING_APPROVAL',
      imageUrl: primaryImage,
      images: allActiveImages,
      keyFeatures: features,
      colors: colors.map((c) => ({
        ...c,
        imageUrl: (c.imageUrl || '').trim(),
      })),
      sizes: allActiveSizes.length > 0 ? allActiveSizes : allSizes,
      variantsList: cleanedVariants,
      totalOrders: initialProduct?.totalOrders || 0,
    };

    try {
      const res = await onSave(productPayload);
      if (res && typeof res === 'object' && 'ok' in res && !res.ok) {
        setSubmitError(res.error || 'Failed to save product in database.');
        setIsSubmitting(false);
        return;
      }
      if (!isApprovedByAdmin && typeof window !== 'undefined') {
        sessionStorage.setItem('fulfillio_products_initial_tab', 'PENDING_APPROVAL');
      }
      router.push('/merchant/products');
    } catch (err: any) {
      setSubmitError(err?.message || 'Failed to save product in database.');
      setIsSubmitting(false);
    }
  }, [
    isSubmitting,
    title,
    masterSku,
    declaredValue,
    costPrice,
    colors,
    allSizes,
    imageUrl,
    galleryImages,
    isEdit,
    initialProduct,
    generatedVariants,
    category,
    subcategory,
    productType,
    description,
    computedTotalStock,
    status,
    features,
    activeBarcodeString,
    onSave,
    router,
  ]);

  // Keyboard shortcut: Cmd/Ctrl + S
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 's') {
        e.preventDefault();
        handleSubmit();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleSubmit]);

  const isApprovedByAdmin =
    isEdit &&
    initialProduct?.bin &&
    initialProduct.bin !== 'Pending Approval' &&
    initialProduct.bin !== 'Assigned on intake' &&
    initialProduct.status !== 'PENDING_APPROVAL';

  return (
    <div className="max-w-4xl mx-auto pb-32">
      {/* 1. Sticky Frosted Header */}
      <header className="sticky top-0 z-30 -mx-4 sm:-mx-6 px-4 sm:px-6 py-4 bg-white/95 dark:bg-navy-950/95 backdrop-blur-md border-b border-slate-200/80 dark:border-white/10 mb-8 transition-all">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0">
            <Link
              href="/merchant/products"
              className="h-9 w-9 rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-navy-900 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-navy-800 flex items-center justify-center transition-all shrink-0 shadow-xs"
              title="Return to products"
            >
              <ArrowLeft className="h-4 w-4" />
            </Link>

            <div className="min-w-0">
              <div className="flex items-center gap-2.5">
                <h1 className="text-lg sm:text-xl font-bold tracking-tight text-slate-900 dark:text-white truncate">
                  {isEdit ? (title || 'Edit Product') : 'Add New Product'}
                </h1>
                <span
                  className={`inline-flex items-center text-[10px] uppercase font-bold tracking-wider px-2.5 py-0.5 rounded-full border ${
                    !isApprovedByAdmin
                      ? 'bg-amber-500/10 text-amber-700 dark:text-amber-300 border-amber-500/20'
                      : status === 'PUBLISHED'
                      ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/20'
                      : 'bg-slate-100 dark:bg-navy-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-white/10'
                  }`}
                >
                  {!isApprovedByAdmin ? 'Pending Approval' : status}
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 font-mono">
                {masterSku} · {merchantCode}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5 shrink-0">
            <Link
              href="/merchant/products"
              className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white bg-slate-100 dark:bg-navy-900 hover:bg-slate-200/80 dark:hover:bg-navy-800 transition-all cursor-pointer"
            >
              Discard
            </Link>

            <button
              type="button"
              onClick={() => handleSubmit()}
              disabled={isSubmitting}
              className="px-5 py-2 rounded-xl bg-orange-600 hover:bg-orange-500 disabled:opacity-50 text-white text-xs font-bold shadow-[0_1px_2px_rgba(242,107,29,0.25)] transition-all flex items-center gap-2 cursor-pointer active:scale-[0.98]"
            >
              {isSubmitting ? (
                <>
                  <div className="h-3.5 w-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Saving...</span>
                </>
              ) : (
                <>
                  <Check className="h-4 w-4 stroke-[2.5]" />
                  <span>{isEdit ? 'Save Changes' : 'Publish Product'}</span>
                  <span className="hidden md:inline-block text-[10px] opacity-75 font-mono ml-0.5">
                    ⌘S
                  </span>
                </>
              )}
            </button>
          </div>
        </div>
      </header>

      {/* Validation Error Banner */}
      {submitError && (
        <div className="mb-8 p-4 rounded-2xl bg-rose-50 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-500/30 text-rose-700 dark:text-rose-400 text-xs flex items-center gap-3 shadow-xs">
          <AlertCircle className="h-4 w-4 shrink-0 text-rose-600 dark:text-rose-400" />
          <div className="flex-1 font-semibold">{submitError}</div>
          <button
            type="button"
            onClick={() => setSubmitError(null)}
            className="text-rose-400 hover:text-rose-600 p-1 cursor-pointer"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      )}

      {/* Form Body: Immaculate Single-Column Clean Surface Stack */}
      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Section 1: Product Core Details */}
        <section className="bg-white dark:bg-navy-900/90 rounded-2xl border border-slate-200/80 dark:border-white/10 p-6 sm:p-8 shadow-[0_1px_3px_rgba(0,0,0,0.04)] space-y-6">
          <div className="border-b border-slate-100 dark:border-white/5 pb-4">
            <h2 className="text-base font-bold text-slate-900 dark:text-white">
              Basic Information
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Specify your product title, master SKU code, and category classification.
            </p>
          </div>

          <div className="space-y-5">
            {/* Title */}
            <div>
              <label className="block text-xs font-semibold text-slate-800 dark:text-slate-200 mb-2">
                Product Name <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Mens Heavyweight Half Zip Fleece Hoodie"
                className="w-full px-4 py-3 bg-white dark:bg-navy-950/60 border border-slate-200 dark:border-white/10 rounded-xl text-sm font-medium text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-4 focus:ring-orange-500/10 focus:border-orange-500 transition-all shadow-xs"
              />
            </div>

            {/* SKU and Barcode Row */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-xs font-semibold text-slate-800 dark:text-slate-200">
                    Master SKU <span className="text-rose-500">*</span>
                  </label>
                  <div className="flex items-center gap-2.5">
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
                    <button
                      type="button"
                      onClick={handleGenerateNewSku}
                      className="text-xs text-slate-500 hover:text-orange-600 flex items-center gap-1 transition-colors cursor-pointer"
                    >
                      <RefreshCw className="h-3 w-3" />
                      <span>Generate</span>
                    </button>
                  </div>
                </div>
                <input
                  type="text"
                  required
                  value={masterSku}
                  onChange={(e) => setMasterSku(e.target.value.toUpperCase())}
                  placeholder="e.g. MC-101-PRD-820"
                  className="w-full px-4 py-3 bg-white dark:bg-navy-950/60 border border-slate-200 dark:border-white/10 rounded-xl text-sm font-mono font-bold text-slate-900 dark:text-white tracking-wider focus:outline-none focus:ring-4 focus:ring-orange-500/10 focus:border-orange-500 transition-all shadow-xs"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-800 dark:text-slate-200 mb-2">
                  Barcode (EAN-13 / Code128)
                </label>
                <div className="flex items-center justify-between px-4 py-3 bg-slate-50/80 dark:bg-navy-950/40 border border-slate-200 dark:border-white/10 rounded-xl text-sm font-mono font-semibold text-slate-700 dark:text-slate-300">
                  <span>{activeBarcodeString}</span>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider px-2 py-0.5 rounded bg-white dark:bg-navy-900 border border-slate-200/60 dark:border-white/10">
                    Auto Generated
                  </span>
                </div>
              </div>
            </div>

            {/* Category and Subcategory Row */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-xs font-semibold text-slate-800 dark:text-slate-200">
                    Category
                  </label>
                  <Link
                    href="/merchant/categories"
                    target="_blank"
                    className="text-xs font-semibold text-orange-600 dark:text-orange-400 hover:underline flex items-center gap-1"
                  >
                    <span>Manage Categories</span>
                    <ExternalLink className="h-3 w-3" />
                  </Link>
                </div>
                <div className="relative">
                  <select
                    value={category}
                    onChange={(e) => {
                      const newCat = e.target.value;
                      setCategory(newCat);
                      const catObj = categories.find((c: any) => c.name.toLowerCase() === newCat.toLowerCase());
                      if (catObj && catObj.subcategories.length > 0) {
                        setSubcategory(catObj.subcategories[0].name);
                      } else {
                        setSubcategory('');
                      }
                    }}
                    className="w-full appearance-none px-4 py-3 bg-white dark:bg-navy-950/60 border border-slate-200 dark:border-white/10 rounded-xl text-sm font-medium text-slate-900 dark:text-white focus:outline-none focus:ring-4 focus:ring-orange-500/10 focus:border-orange-500 transition-all shadow-xs cursor-pointer pr-10"
                  >
                    {categories.map((cat: any) => (
                      <option key={cat.id} value={cat.name}>
                        {cat.name} ({cat.subcategories.length} sub-items)
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-3.5 top-3.5 h-4 w-4 text-slate-400 pointer-events-none" />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-800 dark:text-slate-200 mb-2">
                  Subcategory
                </label>
                {subcategoryList.length > 0 ? (
                  <div className="relative">
                    <select
                      value={subcategory}
                      onChange={(e) => setSubcategory(e.target.value)}
                      className="w-full appearance-none px-4 py-3 bg-white dark:bg-navy-950/60 border border-slate-200 dark:border-white/10 rounded-xl text-sm font-medium text-slate-900 dark:text-white focus:outline-none focus:ring-4 focus:ring-orange-500/10 focus:border-orange-500 transition-all shadow-xs cursor-pointer pr-10"
                    >
                      {subcategoryList.map((sub: any) => (
                        <option key={sub.id} value={sub.name}>
                          {sub.name}
                        </option>
                      ))}
                    </select>
                    <ChevronDown className="absolute right-3.5 top-3.5 h-4 w-4 text-slate-400 pointer-events-none" />
                  </div>
                ) : (
                  <input
                    type="text"
                    value={subcategory}
                    onChange={(e) => setSubcategory(e.target.value)}
                    placeholder="e.g. Standard item"
                    className="w-full px-4 py-3 bg-white dark:bg-navy-950/60 border border-slate-200 dark:border-white/10 rounded-xl text-sm font-medium text-slate-900 dark:text-white focus:outline-none focus:ring-4 focus:ring-orange-500/10 focus:border-orange-500 transition-all shadow-xs"
                  />
                )}
              </div>
            </div>

            {/* Description */}
            <div>
              <label className="block text-xs font-semibold text-slate-800 dark:text-slate-200 mb-2">
                Product Description
              </label>
              <textarea
                rows={3}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Describe fabric materials, fit specifications, care instructions, or warranty details..."
                className="w-full px-4 py-3 bg-white dark:bg-navy-950/60 border border-slate-200 dark:border-white/10 rounded-xl text-sm font-medium text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-4 focus:ring-orange-500/10 focus:border-orange-500 transition-all shadow-xs leading-relaxed"
              />
            </div>
          </div>
        </section>

        {/* Section 2: Media & Product Images */}
        <section className="bg-white dark:bg-navy-900/90 rounded-2xl border border-slate-200/80 dark:border-white/10 p-6 sm:p-8 shadow-[0_1px_3px_rgba(0,0,0,0.04)] space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 dark:border-white/5 pb-4">
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white">
                Photos &amp; Media Gallery
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                The primary photo appears on packing slips, order tables, and invoice headers.
              </p>
            </div>

            <div className="inline-flex items-center p-1 bg-slate-100 dark:bg-navy-950 rounded-xl border border-slate-200/80 dark:border-white/5 self-start sm:self-auto">
              <button
                type="button"
                onClick={() => setImageInputMode('UPLOAD')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                  imageInputMode === 'UPLOAD'
                    ? 'bg-white dark:bg-navy-800 text-orange-600 dark:text-orange-400 shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                Upload File
              </button>
              <button
                type="button"
                onClick={() => setImageInputMode('URL')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                  imageInputMode === 'URL'
                    ? 'bg-white dark:bg-navy-800 text-orange-600 dark:text-orange-400 shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                Image URL
              </button>
              <button
                type="button"
                onClick={() => setImageInputMode('PRESET')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                  imageInputMode === 'PRESET'
                    ? 'bg-white dark:bg-navy-800 text-orange-600 dark:text-orange-400 shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                Presets
              </button>
            </div>
          </div>

          {/* URL Input Drawer */}
          {imageInputMode === 'URL' && (
            <div className="p-4 rounded-xl bg-slate-50 dark:bg-navy-950/60 border border-slate-200/80 dark:border-white/10 space-y-2">
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
                <div className="relative flex-1">
                  <LinkIcon className="absolute left-3.5 top-3.5 h-4 w-4 text-slate-400" />
                  <input
                    type="url"
                    value={urlInput}
                    onChange={(e) => {
                      setUrlInput(e.target.value);
                      setUrlError(null);
                    }}
                    placeholder="https://images.unsplash.com/... or direct image CDN URL"
                    className="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-navy-900 border border-slate-200 dark:border-white/10 rounded-xl text-xs font-medium text-slate-900 dark:text-white focus:outline-none focus:border-orange-500 shadow-xs"
                  />
                </div>
                <button
                  type="button"
                  onClick={handleAddUrlImage}
                  className="px-5 py-2.5 rounded-xl bg-orange-600 hover:bg-orange-500 text-white text-xs font-bold shadow-xs shrink-0 cursor-pointer"
                >
                  Add URL
                </button>
              </div>
              {urlError && <p className="text-xs text-rose-500 font-medium">{urlError}</p>}
            </div>
          )}

          {/* Presets Grid */}
          {imageInputMode === 'PRESET' && (
            <div className="p-4 rounded-xl bg-slate-50 dark:bg-navy-950/60 border border-slate-200/80 dark:border-white/10 space-y-3">
              <p className="text-xs font-semibold text-slate-600 dark:text-slate-300">
                Click a sample preset image to populate instantly:
              </p>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3">
                {SAMPLE_PRODUCT_PRESETS.map((preset, pIdx) => (
                  <button
                    key={pIdx}
                    type="button"
                    onClick={() => handleApplyPreset(preset.url)}
                    className="group flex flex-col items-center gap-1.5 p-2 rounded-xl bg-white dark:bg-navy-900 border border-slate-200 dark:border-white/10 hover:border-orange-500 transition-all text-left cursor-pointer"
                  >
                    <div className="h-16 w-full rounded-lg overflow-hidden bg-slate-100 dark:bg-navy-950 relative">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={preset.url}
                        alt={preset.name}
                        className="h-full w-full object-cover group-hover:scale-105 transition-transform"
                      />
                    </div>
                    <span className="text-[11px] font-semibold text-slate-800 dark:text-slate-200 truncate w-full text-center">
                      {preset.name}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Photos Matrix */}
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
            {/* Primary Featured Photo */}
            <div className="relative group rounded-2xl bg-slate-50/70 dark:bg-navy-950/50 border-2 border-orange-500/40 p-2.5 flex flex-col justify-between shadow-xs">
              <div className="flex items-center justify-between mb-2">
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-orange-600 text-white text-[10px] font-bold">
                  <Star className="h-2.5 w-2.5 fill-current" />
                  Primary Photo
                </span>
                {imageUrl && (
                  <button
                    type="button"
                    onClick={() => handleRemovePhoto(imageUrl)}
                    className="p-1 rounded-md text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-navy-900 transition-colors cursor-pointer"
                    title="Remove"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>

              <div className="h-36 rounded-xl bg-white dark:bg-navy-900 border border-slate-200/80 dark:border-white/10 overflow-hidden flex items-center justify-center">
                {imageUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={imageUrl} alt="Primary" className="h-full w-full object-cover" />
                ) : (
                  <div
                    onClick={() => mainImageInputRef.current?.click()}
                    className="h-full w-full flex flex-col items-center justify-center text-slate-400 hover:text-orange-500 cursor-pointer transition-colors p-4 text-center"
                  >
                    <UploadCloud className="h-8 w-8 mb-1.5 opacity-60" />
                    <span className="text-xs font-semibold">Upload Photo</span>
                  </div>
                )}
              </div>

              <button
                type="button"
                onClick={() => mainImageInputRef.current?.click()}
                className="mt-2.5 w-full py-2 px-3 rounded-xl bg-white dark:bg-navy-800 hover:bg-slate-100 text-slate-700 dark:text-slate-200 text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer border border-slate-200 dark:border-white/10 shadow-xs"
              >
                <UploadCloud className="h-3.5 w-3.5 text-orange-500" />
                <span>{imageUrl ? 'Replace' : 'Upload'}</span>
              </button>
            </div>

            {/* Gallery Photos */}
            {galleryImages.map((gUrl, gIdx) => (
              <div
                key={gIdx}
                className="relative group rounded-2xl bg-white dark:bg-navy-900/60 border border-slate-200/80 dark:border-white/10 p-2.5 flex flex-col justify-between hover:border-slate-300 transition-all shadow-xs"
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[11px] font-semibold text-slate-400">
                    Photo #{gIdx + 2}
                  </span>
                  <button
                    type="button"
                    onClick={() => handleRemovePhoto(gUrl)}
                    className="p-1 rounded-md text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-navy-900 transition-colors cursor-pointer"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>

                <div className="h-36 rounded-xl bg-slate-50 dark:bg-navy-950 border border-slate-200/80 dark:border-white/10 overflow-hidden flex items-center justify-center">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={gUrl} alt={`Gallery ${gIdx + 2}`} className="h-full w-full object-cover" />
                </div>

                <button
                  type="button"
                  onClick={() => handleSetAsMainPhoto(gUrl)}
                  className="mt-2.5 w-full py-2 px-3 rounded-xl bg-orange-500/10 hover:bg-orange-500/20 text-orange-600 dark:text-orange-400 text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                >
                  <Star className="h-3.5 w-3.5" />
                  <span>Set as Main</span>
                </button>
              </div>
            ))}

            {/* Add More Dropzone */}
            {galleryImages.length < 8 && (
              <div
                onClick={() => galleryFileInputRef.current?.click()}
                className="h-full min-h-[210px] rounded-2xl border-2 border-dashed border-slate-200 dark:border-white/10 hover:border-orange-500 bg-slate-50/50 dark:bg-navy-950/40 hover:bg-orange-50/20 flex flex-col items-center justify-center text-slate-400 hover:text-orange-600 cursor-pointer transition-all p-4 text-center group"
              >
                <div className="h-10 w-10 rounded-full bg-slate-100 dark:bg-navy-900 group-hover:bg-orange-500/10 flex items-center justify-center mb-2 transition-colors">
                  <Plus className="h-5 w-5 group-hover:text-orange-500" />
                </div>
                <span className="text-xs font-bold text-slate-700 dark:text-slate-300 group-hover:text-orange-600">
                  Add Photo
                </span>
                <span className="text-[11px] text-slate-400 mt-0.5">
                  Angles &amp; details
                </span>
              </div>
            )}
          </div>
        </section>

       

        {/* Section 3: Product Archetype & Variants */}
        <section className="bg-white dark:bg-navy-900/90 rounded-2xl border border-slate-200/80 dark:border-white/10 p-6 sm:p-8 shadow-[0_1px_3px_rgba(0,0,0,0.04)] space-y-6">
          <div className="border-b border-slate-100 dark:border-white/5 pb-4">
            <h2 className="text-base font-bold text-slate-900 dark:text-white">
              Product Archetype &amp; Variants
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Select product classification to unlock dynamic color, size, storage, or volume combinations.
            </p>
          </div>

          {/* Archetype Selector */}
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
            {[
              { id: 'FASHION' as const, label: 'Fashion', desc: 'Color + Size Matrix', icon: Shirt },
              { id: 'ELECTRONICS' as const, label: 'Electronics', desc: 'Storage + Color', icon: Smartphone },
              { id: 'BEAUTY' as const, label: 'Beauty', desc: 'Volume + Shade', icon: Sparkle },
              { id: 'GROCERY' as const, label: 'Grocery', desc: 'Pack / Weight', icon: Apple },
              { id: 'STANDARD' as const, label: 'Standard', desc: 'Single SKU item', icon: Box },
            ].map((t) => {
              const isSelected = productType === t.id;
              const Icon = t.icon;
              return (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => handleProductTypeChange(t.id)}
                  className={`p-4 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between gap-3 ${
                    isSelected
                      ? 'bg-orange-500/10 border-orange-500 text-orange-600 dark:text-orange-400 ring-2 ring-orange-500/20 font-semibold shadow-xs'
                      : 'bg-white dark:bg-navy-950/60 border-slate-200 dark:border-white/10 text-slate-600 dark:text-slate-400 hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <Icon className={`h-5 w-5 ${isSelected ? 'text-orange-600 dark:text-orange-400' : 'text-slate-400'}`} />
                    {isSelected && <Check className="h-4 w-4 text-orange-600 stroke-[3]" />}
                  </div>
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

          {/* FASHION Colors & Sizes */}
          {productType === 'FASHION' && (
            <div className="space-y-5 pt-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-900 dark:text-white">
                  Color Swatches &amp; Associated Sizes ({colors.length})
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
                {colors.map((c) => {
                  const activeSizes = c.sizes && c.sizes.length > 0 ? c.sizes : allSizes;
                  return (
                    <div
                      key={c.id}
                      className="p-4 sm:p-5 rounded-2xl bg-slate-50/70 dark:bg-navy-950/50 border border-slate-200/80 dark:border-white/10 space-y-4"
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <div className="flex items-center gap-3 flex-1 min-w-0">
                          <ColorPickerInput
                            colorHex={c.hex}
                            colorName={c.name}
                            onChange={(hex: string, suggestedName?: string) => {
                              setColors(
                                colors.map((item) =>
                                  item.id === c.id
                                    ? {
                                        ...item,
                                        hex,
                                        name:
                                          !item.name || item.name === 'New Color'
                                            ? (suggestedName || item.name)
                                            : item.name,
                                      }
                                    : item
                                )
                              );
                            }}
                          />
                          <input
                            type="text"
                            value={c.name}
                            onChange={(e) => {
                              const name = e.target.value;
                              setColors(
                                colors.map((item) => (item.id === c.id ? { ...item, name } : item))
                              );
                            }}
                            placeholder="Color name (e.g. Jet Black)"
                            className="flex-1 max-w-sm px-4 py-2.5 bg-white dark:bg-navy-900 border border-slate-200 dark:border-white/10 rounded-xl text-xs font-semibold text-slate-900 dark:text-white focus:outline-none focus:border-orange-500 shadow-xs"
                          />
                        </div>

                        <div className="flex items-center gap-2.5 shrink-0">
                          <div
                            onClick={() => {
                              setActiveColorUploadId(c.id);
                              colorFileInputRef.current?.click();
                            }}
                            className="relative h-9 w-9 rounded-xl bg-white dark:bg-navy-900 border border-slate-200 dark:border-white/10 overflow-hidden flex items-center justify-center cursor-pointer hover:border-orange-500 transition-colors shadow-xs"
                            title="Upload swatch photo"
                          >
                            {(c.imageUrl || imageUrl) ? (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img
                                src={c.imageUrl || imageUrl}
                                alt={c.name}
                                className="h-full w-full object-cover"
                              />
                            ) : (
                              <Package className="h-4 w-4 text-slate-400" />
                            )}
                          </div>

                          <button
                            type="button"
                            onClick={() => {
                              setActiveColorUploadId(c.id);
                              colorFileInputRef.current?.click();
                            }}
                            className="px-3 py-2 rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-navy-900 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-50 transition-colors cursor-pointer shadow-xs"
                          >
                            Upload Photo
                          </button>

                          {colors.length > 1 && (
                            <button
                              type="button"
                              onClick={() => handleRemoveColor(c.id)}
                              className="p-2 rounded-xl text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-navy-900 transition-colors cursor-pointer"
                              title="Delete color"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          )}
                        </div>
                      </div>

                      {/* Active sizes chips */}
                      <div className="pt-3 border-t border-slate-200/60 dark:border-white/5 flex flex-wrap items-center gap-2">
                        <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 mr-1">
                          Available Sizes:
                        </span>
                        {allSizes.map((sz) => {
                          const isSzActive = activeSizes.includes(sz);
                          return (
                            <button
                              key={sz}
                              type="button"
                              onClick={() => handleToggleColorSize(c.id, sz)}
                              className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                                isSzActive
                                  ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900 border-transparent shadow-xs'
                                  : 'bg-white dark:bg-navy-900 text-slate-500 border-slate-200 dark:border-white/10 hover:border-slate-300'
                              }`}
                            >
                              {sz}
                            </button>
                          );
                        })}

                        {/* Custom size adder */}
                        <div className="inline-flex items-center gap-1.5 ml-2">
                          <input
                            type="text"
                            placeholder="+ Size"
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
                            className="w-20 px-3 py-1.5 bg-white dark:bg-navy-900 border border-slate-200 dark:border-white/10 rounded-xl text-xs text-slate-900 dark:text-white focus:outline-none focus:border-orange-500 shadow-xs"
                          />
                          <button
                            type="button"
                            onClick={() => handleAddCustomSizeToColor(c.id)}
                            className="px-3 py-1.5 rounded-xl bg-slate-200 dark:bg-navy-800 text-slate-800 dark:text-slate-200 text-xs font-bold cursor-pointer"
                          >
                            Add
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* ELECTRONICS */}
          {productType === 'ELECTRONICS' && (
            <div className="space-y-4 pt-2">
              <span className="text-xs font-bold text-slate-900 dark:text-white block">
                Storage Configurations
              </span>
              <div className="flex items-center gap-2 flex-wrap">
                {electronicStorages.map((storage) => (
                  <span
                    key={storage}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-50 dark:bg-navy-950 border border-slate-200 dark:border-white/10 text-xs font-mono font-bold text-slate-800 dark:text-slate-200"
                  >
                    <span>{storage}</span>
                    <button
                      type="button"
                      onClick={() =>
                        setElectronicStorages(electronicStorages.filter((s) => s !== storage))
                      }
                      className="text-slate-400 hover:text-rose-500 ml-1 cursor-pointer"
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
                  className="flex-1 px-3 py-2 bg-slate-50 dark:bg-navy-950 border border-slate-200 dark:border-white/10 rounded-xl text-xs font-medium focus:outline-none focus:border-orange-500"
                />
                <button
                  type="button"
                  onClick={() => {
                    if (newStorageInput.trim()) {
                      setElectronicStorages([...electronicStorages, newStorageInput.trim()]);
                      setNewStorageInput('');
                    }
                  }}
                  className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-navy-800 text-xs font-semibold text-slate-800 dark:text-slate-200 cursor-pointer"
                >
                  Add
                </button>
              </div>
            </div>
          )}

          {/* BEAUTY */}
          {productType === 'BEAUTY' && (
            <div className="space-y-4 pt-2">
              <span className="text-xs font-bold text-slate-900 dark:text-white block">
                Volume / Container Sizes
              </span>
              <div className="flex items-center gap-2 flex-wrap">
                {beautyVolumes.map((vol) => (
                  <span
                    key={vol}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-50 dark:bg-navy-950 border border-slate-200 dark:border-white/10 text-xs font-mono font-bold text-slate-800 dark:text-slate-200"
                  >
                    <span>{vol}</span>
                    <button
                      type="button"
                      onClick={() => setBeautyVolumes(beautyVolumes.filter((v) => v !== vol))}
                      className="text-slate-400 hover:text-rose-500 ml-1 cursor-pointer"
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
                  className="flex-1 px-3 py-2 bg-slate-50 dark:bg-navy-950 border border-slate-200 dark:border-white/10 rounded-xl text-xs font-medium focus:outline-none focus:border-orange-500"
                />
                <button
                  type="button"
                  onClick={() => {
                    if (newVolumeInput.trim()) {
                      setBeautyVolumes([...beautyVolumes, newVolumeInput.trim()]);
                      setNewVolumeInput('');
                    }
                  }}
                  className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-navy-800 text-xs font-semibold text-slate-800 dark:text-slate-200 cursor-pointer"
                >
                  Add
                </button>
              </div>
            </div>
          )}

          {/* GROCERY */}
          {productType === 'GROCERY' && (
            <div className="space-y-4 pt-2">
              <span className="text-xs font-bold text-slate-900 dark:text-white block">
                Pack Sizes / Net Weight
              </span>
              <div className="flex items-center gap-2 flex-wrap">
                {groceryPacks.map((pack) => (
                  <span
                    key={pack}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-50 dark:bg-navy-950 border border-slate-200 dark:border-white/10 text-xs font-mono font-bold text-slate-800 dark:text-slate-200"
                  >
                    <span>{pack}</span>
                    <button
                      type="button"
                      onClick={() => setGroceryPacks(groceryPacks.filter((p) => p !== pack))}
                      className="text-slate-400 hover:text-rose-500 ml-1 cursor-pointer"
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
              <div className="flex gap-2 max-w-xs">
                <input
                  type="text"
                  value={newPackInput}
                  onChange={(e) => setNewPackInput(e.target.value)}
                  placeholder="e.g. 5kg"
                  className="flex-1 px-3 py-2 bg-slate-50 dark:bg-navy-950 border border-slate-200 dark:border-white/10 rounded-xl text-xs font-medium focus:outline-none focus:border-orange-500"
                />
                <button
                  type="button"
                  onClick={() => {
                    if (newPackInput.trim()) {
                      setGroceryPacks([...groceryPacks, newPackInput.trim()]);
                      setNewPackInput('');
                    }
                  }}
                  className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-navy-800 text-xs font-semibold text-slate-800 dark:text-slate-200 cursor-pointer"
                >
                  Add
                </button>
              </div>
            </div>
          )}

          {/* VARIANT INVENTORY MATRIX TABLE */}
          {productType !== 'STANDARD' && generatedVariants.length > 0 && (
            <div className="space-y-4 pt-4 border-t border-slate-100 dark:border-white/5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                    Variant Stock Matrix
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    {generatedVariants.length} Active Variant{generatedVariants.length === 1 ? '' : 's'} · Total:{' '}
                    <strong className="text-slate-900 dark:text-white font-mono">
                      {computedTotalStock} units
                    </strong>
                  </p>
                </div>

                {/* Bulk Stock Setter */}
                <div className="flex items-center gap-2">
                  <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
                    Bulk fill:
                  </span>
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
                    className="px-3.5 py-1.5 rounded-xl bg-slate-100 dark:bg-navy-800 hover:bg-slate-200 text-xs font-bold text-slate-800 dark:text-slate-200 transition-colors cursor-pointer shadow-xs"
                  >
                    Apply All
                  </button>
                </div>
              </div>

              {/* Table */}
              <div className="rounded-2xl border border-slate-200/80 dark:border-white/10 overflow-hidden bg-white dark:bg-navy-900 shadow-xs">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50/80 dark:bg-navy-950 text-slate-600 dark:text-slate-400 font-semibold border-b border-slate-200/80 dark:border-white/10 text-[11px]">
                    <tr>
                      <th className="py-3 px-4">Variant SKU</th>
                      <th className="py-3 px-4">Color / Attribute</th>
                      <th className="py-3 px-4">Size / Spec</th>
                      <th className="py-3 px-4 text-right">Warehouse Stock</th>
                      <th className="py-3 px-4 w-10"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-white/5">
                    {generatedVariants.map((v) => (
                      <tr key={v.id} className="hover:bg-slate-50/50 dark:hover:bg-navy-950/40 transition-colors">
                        <td className="py-3 px-4 font-mono font-bold text-slate-800 dark:text-slate-200 text-xs">
                          {v.variantSku}
                        </td>
                        <td className="py-3 px-4 text-slate-700 dark:text-slate-300 font-medium">
                          {v.color || v.attributeName || 'Standard'}
                        </td>
                        <td className="py-3 px-4">
                          <span className="px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-navy-800 text-slate-800 dark:text-slate-200 text-xs font-mono font-bold">
                            {v.size || v.attributeValue || 'Default'}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-right">
                          <input
                            type="number"
                            min="0"
                            value={v.stock}
                            onChange={(e) =>
                              handleStockChange(v.id, Number(e.target.value) || 0)
                            }
                            className="w-24 px-3 py-1.5 text-right bg-slate-50/60 dark:bg-navy-950/60 border border-slate-200 dark:border-white/10 rounded-xl text-xs font-mono font-bold text-slate-900 dark:text-white focus:outline-none focus:border-orange-500 shadow-xs"
                          />
                        </td>
                        <td className="py-3 px-4 text-center">
                          <button
                            type="button"
                            onClick={() => handleRemoveVariant(v.id)}
                            className="text-slate-400 hover:text-rose-500 p-1 cursor-pointer"
                            title="Exclude variant from stock"
                          >
                            <X className="h-4 w-4" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Standard Item Stock */}
          {productType === 'STANDARD' && (
            <div className="pt-3 border-t border-slate-100 dark:border-white/5">
              <label className="block text-xs font-semibold text-slate-800 dark:text-slate-200 mb-2">
                Initial Warehouse Stock Units
              </label>
              <input
                type="number"
                min="0"
                value={standardStock}
                onChange={(e) => setStandardStock(e.target.value)}
                placeholder="30"
                className="w-48 px-4 py-2.5 bg-white dark:bg-navy-950/60 border border-slate-200 dark:border-white/10 rounded-xl text-sm font-bold text-slate-900 dark:text-white focus:outline-none focus:border-orange-500 shadow-xs"
              />
            </div>
          )}
        </section>

        {/* Section 4: Key Features & Bullet Highlights */}
        <section className="bg-white dark:bg-navy-900/90 rounded-2xl border border-slate-200/80 dark:border-white/10 p-6 sm:p-8 shadow-[0_1px_3px_rgba(0,0,0,0.04)] space-y-6">
          <div className="border-b border-slate-100 dark:border-white/5 pb-4">
            <h2 className="text-base font-bold text-slate-900 dark:text-white">
              Key Highlights &amp; Features
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Concise bullet points printed on invoices and product memos.
            </p>
          </div>

          <div className="flex gap-2.5">
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
              placeholder="e.g. 100% Pre-shrunk combed cotton"
              className="flex-1 px-4 py-3 bg-white dark:bg-navy-950/60 border border-slate-200 dark:border-white/10 rounded-xl text-sm font-medium text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-4 focus:ring-orange-500/10 focus:border-orange-500 transition-all shadow-xs"
            />
            <button
              type="button"
              onClick={handleAddFeature}
              className="px-5 py-3 rounded-xl bg-slate-100 dark:bg-navy-800 hover:bg-slate-200 text-xs font-bold text-slate-800 dark:text-slate-200 transition-colors cursor-pointer shadow-xs"
            >
              Add Bullet
            </button>
          </div>

          <div className="space-y-2 pt-1">
            {features.map((feat, idx) => (
              <div
                key={idx}
                className="flex items-center justify-between p-3 rounded-xl bg-slate-50/60 dark:bg-navy-950/40 border border-slate-200/60 dark:border-white/5 text-xs font-medium text-slate-800 dark:text-slate-200"
              >
                <span>• {feat}</span>
                <button
                  type="button"
                  onClick={() => handleRemoveFeature(idx)}
                  className="text-slate-400 hover:text-rose-500 p-1 transition-colors cursor-pointer"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            ))}
          </div>
        </section>

        {/* Section 7: Storefront Visibility Status */}
        <section className="bg-white dark:bg-navy-900/90 rounded-2xl border border-slate-200/80 dark:border-white/10 p-6 sm:p-8 shadow-[0_1px_3px_rgba(0,0,0,0.04)] space-y-4">
          <h2 className="text-base font-bold text-slate-900 dark:text-white">
            Publishing Status
          </h2>

          {!isApprovedByAdmin ? (
            <div className="p-4 rounded-xl bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/20 text-xs text-amber-800 dark:text-amber-300 space-y-1">
              <p className="font-bold">Pending Warehouse Intake QA Approval</p>
              <p className="text-[11px] text-amber-700 dark:text-amber-400/90 leading-relaxed">
                When physical stock is delivered to the warehouse dock, an intake manager will assign your rack/shelf bin and automatically move this product to Published status.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3 max-w-xs">
              <button
                type="button"
                onClick={() => setStatus('PUBLISHED')}
                className={`py-2.5 px-4 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                  status === 'PUBLISHED'
                    ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30 ring-2 ring-emerald-500/20'
                    : 'bg-slate-50 dark:bg-navy-950 text-slate-500 border-slate-200 dark:border-white/10 hover:border-slate-300'
                }`}
              >
                Published
              </button>
              <button
                type="button"
                onClick={() => setStatus('DRAFT')}
                className={`py-2.5 px-4 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                  status === 'DRAFT'
                    ? 'bg-slate-100 dark:bg-navy-800 text-slate-800 dark:text-slate-200 border-slate-300 dark:border-white/20'
                    : 'bg-slate-50 dark:bg-navy-950 text-slate-500 border-slate-200 dark:border-white/10 hover:border-slate-300'
                }`}
              >
                Draft
              </button>
            </div>
          )}
        </section>

        {/* Bottom Actions */}
        <div className="flex items-center justify-end gap-3 pt-4">
          <Link
            href="/merchant/products"
            className="px-5 py-2.5 rounded-xl border border-slate-200 dark:border-white/10 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100 transition-colors"
          >
            Discard
          </Link>
          <button
            type="submit"
            disabled={isSubmitting}
            className="px-6 py-2.5 rounded-xl bg-orange-600 hover:bg-orange-500 disabled:opacity-50 text-white text-xs font-bold shadow-[0_1px_2px_rgba(242,107,29,0.25)] transition-all flex items-center gap-2 cursor-pointer active:scale-[0.98]"
          >
            {isSubmitting ? (
              <>
                <div className="h-3.5 w-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <span>Saving...</span>
              </>
            ) : (
              <>
                <Check className="h-4 w-4 stroke-[2.5]" />
                <span>{isEdit ? 'Save Changes' : 'Publish Product'}</span>
              </>
            )}
          </button>
        </div>
      </form>

      {/* Hidden file inputs */}
      <input
        type="file"
        ref={mainImageInputRef}
        onChange={handleMainImageChange}
        accept="image/*"
        className="hidden"
      />
      <input
        type="file"
        ref={colorFileInputRef}
        onChange={handleColorFileChange}
        accept="image/*"
        className="hidden"
      />
      <input
        type="file"
        ref={galleryFileInputRef}
        onChange={handleGalleryFileChange}
        accept="image/*"
        multiple
        className="hidden"
      />
    </div>
  );
}
