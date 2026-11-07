'use client';

import React, { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import {
  X,
  Package,
  UploadCloud,
  Check,
  Tag,
  ShieldAlert,
  Truck,
  Plus,
  Trash2,
} from 'lucide-react';
import { MerchantProductItem } from '../../types';

interface ColorSwatch {
  id: string;
  name: string;
  hex: string;
  imageUrl?: string;
  sizes?: string[];
}

interface AddEditProductModalProps {
  isOpen: boolean;
  onClose: () => void;
  merchantCode: string;
  initialProduct?: MerchantProductItem | null;
  onSave: (product: MerchantProductItem) => void;
}

export function AddEditProductModal({
  isOpen,
  onClose,
  merchantCode,
  initialProduct,
  onSave,
}: AddEditProductModalProps) {
  const isEdit = Boolean(initialProduct);
  const colorFileInputRef = useRef<HTMLInputElement>(null);
  const [activeColorUploadId, setActiveColorUploadId] = useState<string | null>(null);

  // Basic Information
  const [title, setTitle] = useState('');
  const [masterSku, setMasterSku] = useState('');
  const [category, setCategory] = useState('Fashion');
  const [subcategory, setSubcategory] = useState('Hoodie');
  const [description, setDescription] = useState('');

  // Declared Product Value (For damage/loss liability)
  const [declaredValue, setDeclaredValue] = useState('850');

  // Images & Color Swatches
  const [imageUrl, setImageUrl] = useState('');
  const [colors, setColors] = useState<ColorSwatch[]>([
    {
      id: 'c-1',
      name: 'Black',
      hex: '#111827',
      imageUrl: 'https://images.unsplash.com/photo-1556905055-8f358a7a47b2?auto=format&fit=crop&w=200&q=80',
      sizes: ['S', 'M', 'L', 'XL', 'XXL', '3XL'],
    },
    {
      id: 'c-2',
      name: 'Charcoal Grey',
      hex: '#4B5563',
      imageUrl: 'https://images.unsplash.com/photo-1509967419530-da38b4704bc6?auto=format&fit=crop&w=200&q=80',
      sizes: ['S', 'M', 'L', 'XL', 'XXL', '3XL'],
    },
  ]);

  // Sizes & Custom Sizes
  const [allSizes, setAllSizes] = useState<string[]>(['S', 'M', 'L', 'XL', 'XXL', '3XL']);
  const [customSizeInputs, setCustomSizeInputs] = useState<Record<string, string>>({});

  // Key Features
  const [newFeatureText, setNewFeatureText] = useState('');
  const [features, setFeatures] = useState<string[]>([
    'Premium cotton-blend fabric',
    'Oversized relaxed fit',
    'Soft and comfortable interior',
  ]);

  // Status & Initial stock
  const [status, setStatus] = useState<'PUBLISHED' | 'DRAFT'>('PUBLISHED');
  const [initialStock, setInitialStock] = useState('30');

  useEffect(() => {
    if (initialProduct) {
      setTitle(initialProduct.title);
      setMasterSku(initialProduct.sku);
      setCategory(initialProduct.category || 'Fashion');
      setSubcategory(initialProduct.subcategory || 'Hoodie');
      setDescription(initialProduct.description || '');
      setDeclaredValue(String(initialProduct.price || 850));
      setImageUrl(initialProduct.imageUrl || '');
      if (initialProduct.colors && initialProduct.colors.length > 0) {
        setColors(initialProduct.colors);
      }
      if (initialProduct.sizes && initialProduct.sizes.length > 0) {
        const merged = ['S', 'M', 'L', 'XL', 'XXL', '3XL'];
        initialProduct.sizes.forEach((sz) => {
          if (!merged.includes(sz)) merged.push(sz);
        });
        setAllSizes(merged);
      }
      setFeatures(
        initialProduct.keyFeatures && initialProduct.keyFeatures.length > 0
          ? initialProduct.keyFeatures
          : ['Premium cotton-blend fabric', 'Oversized relaxed fit']
      );
      setStatus(initialProduct.status === 'DRAFT' ? 'DRAFT' : 'PUBLISHED');
      setInitialStock(String(initialProduct.stock || 30));
    } else {
      // New product defaults
      setTitle('');
      const randomSuffix = Math.floor(100 + Math.random() * 900);
      setMasterSku(`${merchantCode}-HOD-${randomSuffix}`);
      setCategory('Fashion');
      setSubcategory('Hoodie');
      setDescription('');
      setDeclaredValue('850');
      setImageUrl('https://images.unsplash.com/photo-1556905055-8f358a7a47b2?auto=format&fit=crop&w=300&q=80');
      setColors([
        {
          id: 'c-1',
          name: 'Black',
          hex: '#111827',
          imageUrl: 'https://images.unsplash.com/photo-1556905055-8f358a7a47b2?auto=format&fit=crop&w=200&q=80',
          sizes: ['S', 'M', 'L', 'XL', 'XXL', '3XL'],
        },
        {
          id: 'c-2',
          name: 'Charcoal Grey',
          hex: '#4B5563',
          imageUrl: 'https://images.unsplash.com/photo-1509967419530-da38b4704bc6?auto=format&fit=crop&w=200&q=80',
          sizes: ['S', 'M', 'L', 'XL', 'XXL', '3XL'],
        },
      ]);
      setAllSizes(['S', 'M', 'L', 'XL', 'XXL', '3XL']);
      setFeatures([
        'Premium cotton-blend fabric',
        'Oversized relaxed fit',
        'Soft and comfortable interior',
      ]);
      setStatus('PUBLISHED');
      setInitialStock('30');
    }
  }, [initialProduct, isOpen, merchantCode]);

  if (!isOpen) return null;

  // Color Swatch Image Upload
  const handleColorFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !activeColorUploadId) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const base64 = event.target?.result as string;
      setColors((prev) =>
        prev.map((c) => (c.id === activeColorUploadId ? { ...c, imageUrl: base64 } : c))
      );
      if (!imageUrl) setImageUrl(base64);
      setActiveColorUploadId(null);
    };
    reader.readAsDataURL(file);
  };

  const handleAddColor = () => {
    const newId = `c-${Date.now()}`;
    setColors([
      ...colors,
      { id: newId, name: 'New Color', hex: '#6B7280', sizes: [...allSizes] },
    ]);
  };

  const handleRemoveColor = (id: string) => {
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
    const finalImageUrl =
      imageUrl || colors.find((c) => Boolean(c.imageUrl))?.imageUrl || '';
    const allActiveSizes = Array.from(
      new Set(
        colors.flatMap((c) => (c.sizes && c.sizes.length > 0 ? c.sizes : allSizes))
      )
    );

    const productPayload: MerchantProductItem = {
      id: initialProduct?.id || `p-${Date.now()}`,
      title: title.trim(),
      variantLabel: initialProduct?.variantLabel || 'Standard',
      sku: masterSku.trim(),
      // Barcode & Bin are auto-assigned by warehouse / system on intake
      barcode: initialProduct?.barcode || `890${Math.floor(1000000000 + Math.random() * 9000000000)}`,
      bin: initialProduct?.bin || 'Assigned on intake',
      category,
      subcategory,
      description,
      price: numValue,
      costPrice: numValue,
      stock: Math.max(0, Number(initialStock) || 0),
      reserved: initialProduct?.reserved || 0,
      status,
      imageUrl: finalImageUrl || undefined,
      colors,
      sizes: allActiveSizes,
      keyFeatures: features,
      totalOrders: initialProduct?.totalOrders || 0,
    };

    onSave(productPayload);
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-2 sm:p-4 overflow-y-auto cursor-pointer"
      onClick={onClose}
    >
      <div
        className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-3xl my-6 p-5 sm:p-7 space-y-6 shadow-2xl animate-in zoom-in-95 duration-200 cursor-default text-slate-100 max-h-[92vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <div className="flex items-center gap-2.5">
            <div className="h-9 w-9 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
              <Package className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-slate-100">
                {isEdit ? 'Edit Product' : 'Create New Product'}
              </h2>
              <p className="text-xs text-slate-400">
                Configure master info, color swatches, photos & product value.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Section 1: Basic Information */}
          <div className="space-y-3 p-4 rounded-xl bg-slate-950/60 border border-slate-800">
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
                className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-lg text-xs text-slate-200 focus:outline-none focus:border-emerald-500"
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
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-lg text-xs font-mono text-emerald-400 font-bold focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  CATEGORY
                </label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-lg text-xs text-slate-200 focus:outline-none focus:border-emerald-500 cursor-pointer"
                >
                  <option value="Fashion">Fashion</option>
                  <option value="Apparel">Apparel</option>
                  <option value="Electronics">Electronics</option>
                  <option value="Footwear">Footwear</option>
                  <option value="Accessories">Accessories</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  SUBCATEGORY
                </label>
                <input
                  type="text"
                  value={subcategory}
                  onChange={(e) => setSubcategory(e.target.value)}
                  placeholder="e.g. hoodie"
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-lg text-xs text-slate-200 focus:outline-none focus:border-emerald-500"
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
                placeholder="Describe the apparel fabric, fit, and style..."
                className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-lg text-xs text-slate-200 focus:outline-none focus:border-emerald-500"
              />
            </div>
          </div>

          {/* Section 2: Declared Product Value (For Liability & Insurance claims) */}
          <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs font-bold text-slate-200 uppercase tracking-wider">
                <ShieldAlert className="h-4 w-4 text-emerald-400" />
                <span>Product Declared Value (৳ BDT)</span>
              </div>
              <span className="text-[11px] text-slate-400">
                For damage/loss replacement valuation
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
                  className="w-full pl-8 pr-4 py-2 bg-slate-900 border border-slate-800 rounded-lg text-sm font-bold text-emerald-400 focus:outline-none focus:border-emerald-500"
                />
              </div>
            </div>
            <p className="text-[11px] text-slate-500 leading-relaxed">
              ℹ️ যদি ওয়্যারহাউস বা কুরিয়ারে কোনো সমস্যা, হারিয়ে যাওয়া বা ড্যামেজ হয়, তবে ক্ষতিপূরণ ও ইনস্যুরেন্স ভ্যালু নির্ধারণে এই মূল্য ব্যবহার করা হবে। কাস্টমার অর্ডার আসলে তাতে বিক্রয়মূল্য আলাদাভাবে সংযুক্ত হবে।
            </p>
          </div>

          {/* Section 3: Color Swatches & Photos */}
          <div className="space-y-3 p-4 rounded-xl bg-slate-950/60 border border-slate-800">
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

            {/* Hidden file input for color swatches */}
            <input
              type="file"
              ref={colorFileInputRef}
              onChange={handleColorFileChange}
              accept="image/*"
              className="hidden"
            />

            <div className="space-y-3">
              {colors.map((c) => {
                const activeSizes = c.sizes && c.sizes.length > 0 ? c.sizes : allSizes;
                return (
                  <div
                    key={c.id}
                    className="p-3.5 rounded-xl bg-slate-900 border border-slate-800 space-y-3"
                  >
                    <div className="flex items-center gap-3">
                      {/* Color box / hex picker */}
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
                        placeholder="Color Name (e.g. Charcoal Grey)"
                        className="flex-1 px-3 py-1.5 bg-slate-950 border border-slate-800 rounded-lg text-xs text-slate-200 focus:outline-none focus:border-emerald-500"
                      />

                      {/* Thumbnail Preview */}
                      <div className="relative h-9 w-9 rounded-lg bg-slate-950 border border-slate-800 overflow-hidden shrink-0 flex items-center justify-center">
                        {c.imageUrl ? (
                          <Image
                            src={c.imageUrl}
                            alt={c.name}
                            fill
                            sizes="36px"
                            className="object-cover"
                          />
                        ) : (
                          <Package className="h-4 w-4 text-slate-600" />
                        )}
                      </div>

                      {/* Upload Image Button */}
                      <button
                        type="button"
                        onClick={() => {
                          setActiveColorUploadId(c.id);
                          colorFileInputRef.current?.click();
                        }}
                        className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer border border-slate-700 shrink-0"
                      >
                        <UploadCloud className="h-3.5 w-3.5 text-emerald-400" />
                        <span>Upload Image</span>
                      </button>

                      {/* Delete Color */}
                      {colors.length > 1 && (
                        <button
                          type="button"
                          onClick={() => handleRemoveColor(c.id)}
                          className="p-1.5 rounded-lg text-slate-500 hover:text-rose-400 transition-colors cursor-pointer shrink-0"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      )}
                    </div>

                    {/* Per-color sizes customization with custom size adder */}
                    <div className="pt-2.5 border-t border-slate-800/80 space-y-2.5">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                        <div className="text-[11px] text-slate-400">
                          Available Sizes for <strong className="text-slate-200">{c.name || 'this color'}</strong>:
                        </div>

                        {/* Custom size input */}
                        <div className="flex items-center gap-1.5">
                          <input
                            type="text"
                            placeholder="+ Custom Size (e.g. 4XL, Free Size)"
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
                            className="px-2.5 py-1 bg-slate-950 border border-slate-800 rounded-lg text-xs text-slate-200 placeholder:text-slate-500 focus:outline-none focus:border-emerald-500 w-44"
                          />
                          <button
                            type="button"
                            onClick={() => handleAddCustomSizeToColor(c.id)}
                            className="px-2.5 py-1 rounded-lg bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-400 border border-emerald-500/30 text-xs font-semibold flex items-center gap-1 cursor-pointer transition-colors shrink-0"
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
                                    : 'bg-slate-950 text-slate-500 border-slate-800 hover:text-slate-300 hover:border-slate-700'
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

          {/* Section 4: Key Features (Bullet points) */}
          <div className="space-y-3 p-4 rounded-xl bg-slate-950/60 border border-slate-800">
            <span className="text-xs font-bold text-slate-200 uppercase tracking-wider block">
              Key Features
            </span>
            <div className="flex gap-2">
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
                className="flex-1 px-3 py-2 bg-slate-900 border border-slate-800 rounded-lg text-xs text-slate-200 focus:outline-none focus:border-emerald-500"
              />
              <button
                type="button"
                onClick={handleAddFeature}
                className="px-3 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-200 transition-colors cursor-pointer"
              >
                Add Feature
              </button>
            </div>

            <div className="space-y-1.5 pt-1">
              {features.map((feat, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between p-2 rounded-lg bg-slate-900 border border-slate-800/80 text-xs"
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

          {/* Section 7: Initial Stock & Visibility Status */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Initial Stock Units
              </label>
              <input
                type="number"
                min="0"
                value={initialStock}
                onChange={(e) => setInitialStock(e.target.value)}
                placeholder="30"
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs font-bold text-slate-200 focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Storefront Status
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setStatus('PUBLISHED')}
                  className={`py-2 px-3 rounded-lg text-xs font-semibold border transition-all cursor-pointer ${
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
                  className={`py-2 px-3 rounded-lg text-xs font-semibold border transition-all cursor-pointer ${
                    status === 'DRAFT'
                      ? 'bg-slate-800 text-slate-200 border-slate-600'
                      : 'bg-slate-950 text-slate-400 border-slate-800 hover:bg-slate-800'
                  }`}
                >
                  Draft
                </button>
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
              className="px-5 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition-colors cursor-pointer shadow-md flex items-center gap-1.5"
            >
              <Check className="h-4 w-4" />
              <span>{isEdit ? 'Save Changes' : 'Publish Product'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
