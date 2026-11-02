'use client';

import React, { useState } from 'react';
import { Box, Upload, Tag, X } from 'lucide-react';
import { Modal } from '@/components/ui';
import { WarehouseBin, WarehouseProductItem } from '../../types';
import { MERCHANTS, PRESET_THUMBNAILS } from '../../mockData';

interface AddProductModalProps {
  isOpen: boolean;
  onClose: () => void;
  bins: WarehouseBin[];
  onAddProduct: (newProduct: WarehouseProductItem) => void;
}

export function AddProductModal({
  isOpen,
  onClose,
  bins,
  onAddProduct,
}: AddProductModalProps) {
  const [confirmStep, setConfirmStep] = useState(false);
  const [formMerchantCode, setFormMerchantCode] = useState('MC-101');
  const [formTitle, setFormTitle] = useState('');
  const [formCategory, setFormCategory] = useState<'Apparel' | 'Footwear' | 'Electronics' | 'Accessories'>('Apparel');
  const [formShortSku, setFormShortSku] = useState('');
  const [formColor, setFormColor] = useState('Black');
  const [formSize, setFormSize] = useState('L');
  const [formPrice, setFormPrice] = useState('1650');
  const [formStock, setFormStock] = useState('50');
  const [formBinCode, setFormBinCode] = useState(bins[0]?.code || 'A-01-02');
  const [formImageUrl, setFormImageUrl] = useState(PRESET_THUMBNAILS[0].url);

  const sanitizedShortSku = (formShortSku.trim() || 'ITEM-01')
    .toUpperCase()
    .replace(/[^A-Z0-9-]/g, '-');
  const generatedFullSku = `${formMerchantCode}-${sanitizedShortSku}`;

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        setFormImageUrl(reader.result);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleSave = () => {
    const merchantObj = MERCHANTS.find((m) => m.code === formMerchantCode) || MERCHANTS[0];
    const finalBin = formBinCode || bins[0]?.code || 'A-01-02';

    const newProd: WarehouseProductItem = {
      id: `PRD-${Math.floor(3000 + Math.random() * 6000)}`,
      title: formTitle.trim() || 'New Merchant Catalog Item',
      category: formCategory,
      merchantCode: merchantObj.code,
      merchantName: merchantObj.name,
      shortSku: sanitizedShortSku,
      fullSku: generatedFullSku,
      color: formColor.trim() || 'Standard',
      size: formSize.trim() || 'OS',
      binCode: finalBin,
      stock: Math.max(0, parseInt(formStock, 10) || 0),
      price: Math.max(0, parseInt(formPrice, 10) || 0),
      status: 'APPROVED',
      submittedAt: 'Added just now',
      imageUrl: formImageUrl,
    };

    onAddProduct(newProd);
    setConfirmStep(false);
    setFormTitle('');
    setFormShortSku('');
    onClose();
  };

  const handleModalClose = () => {
    setConfirmStep(false);
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleModalClose}
      title="Add Product Under Merchant Account"
      subtitle="Generates a 2-Part System SKU and assigns a physical warehouse bin immediately"
      size="lg"
    >
      {!confirmStep ? (
        <div className="space-y-4">
          {/* Merchant + Category */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
                Select Merchant *
              </label>
              <select
                value={formMerchantCode}
                onChange={(e) => setFormMerchantCode(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-sm text-white focus:outline-none focus:border-emerald-500"
              >
                {MERCHANTS.map((m) => (
                  <option key={m.code} value={m.code}>
                    {m.code} — {m.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
                Category *
              </label>
              <select
                value={formCategory}
                onChange={(e) =>
                  setFormCategory(
                    e.target.value as 'Apparel' | 'Footwear' | 'Electronics' | 'Accessories'
                  )
                }
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-sm text-white focus:outline-none focus:border-emerald-500"
              >
                <option value="Apparel">Apparel</option>
                <option value="Footwear">Footwear</option>
                <option value="Electronics">Electronics</option>
                <option value="Accessories">Accessories</option>
              </select>
            </div>
          </div>

          {/* Product Photo Upload + Preset Illustrations */}
          <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-3.5">
                <img
                  src={formImageUrl}
                  alt="Product preview"
                  className="w-14 h-14 rounded-2xl object-cover border border-emerald-500/40 shadow-md shrink-0"
                />
                <div>
                  <div className="text-xs font-bold uppercase tracking-wider text-slate-200">
                    Product Thumbnail Photo
                  </div>
                  <p className="text-xs text-slate-400">
                    Upload custom image or pick a preset offline SVG illustration below
                  </p>
                </div>
              </div>

              <label className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-xs font-semibold text-emerald-400 flex items-center gap-2 cursor-pointer self-start sm:self-auto">
                <Upload className="w-4 h-4" />
                <span>Upload Photo</span>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleFileUpload}
                  className="hidden"
                />
              </label>
            </div>

            <div className="flex items-center gap-2 overflow-x-auto pb-1">
              {PRESET_THUMBNAILS.map((preset) => (
                <button
                  key={preset.id}
                  type="button"
                  onClick={() => setFormImageUrl(preset.url)}
                  className={`p-1 rounded-xl border transition-all shrink-0 flex items-center gap-1.5 pr-2.5 ${
                    formImageUrl === preset.url
                      ? 'border-emerald-500 bg-emerald-500/10'
                      : 'border-slate-800 bg-slate-900 hover:border-slate-700'
                  }`}
                >
                  <img
                    src={preset.url}
                    alt={preset.name}
                    className="w-7 h-7 rounded-lg object-cover"
                  />
                  <span className="text-[11px] text-slate-300 font-medium">
                    {preset.name.split(' ')[1] || preset.name}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Title & Short SKU + Live 2-Part SKU */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
                Product Title *
              </label>
              <input
                type="text"
                value={formTitle}
                onChange={(e) => setFormTitle(e.target.value)}
                placeholder="e.g. Heavyweight Zip Hoodie"
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-sm text-white focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
                Merchant Short SKU *
              </label>
              <input
                type="text"
                value={formShortSku}
                onChange={(e) => setFormShortSku(e.target.value)}
                placeholder="e.g. ZIPHOOD-BLK-XL"
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-sm font-mono text-white focus:outline-none focus:border-emerald-500"
              />
            </div>
          </div>

          {/* Live Generated 2-Part System SKU Banner */}
          <div className="px-4 py-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-between">
            <span className="text-xs text-emerald-200 flex items-center gap-1.5">
              <Tag className="w-3.5 h-3.5 text-emerald-400" />
              <span>Live Generated 2-Part System SKU:</span>
            </span>
            <span className="font-mono text-sm font-bold text-emerald-300">
              {generatedFullSku}
            </span>
          </div>

          {/* Variant & Pricing & Stock */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1">
                Color
              </label>
              <input
                type="text"
                value={formColor}
                onChange={(e) => setFormColor(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-sm text-white"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1">
                Size
              </label>
              <input
                type="text"
                value={formSize}
                onChange={(e) => setFormSize(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-sm text-white"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1">
                Unit Price (৳)
              </label>
              <input
                type="number"
                value={formPrice}
                onChange={(e) => setFormPrice(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-sm font-mono text-white"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1">
                Initial Stock
              </label>
              <input
                type="number"
                value={formStock}
                onChange={(e) => setFormStock(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-sm font-mono text-white"
              />
            </div>
          </div>

          {/* Warehouse Bin Assignment */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
              Assign Warehouse Bin *
            </label>
            <select
              value={formBinCode}
              onChange={(e) => setFormBinCode(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-sm font-mono text-emerald-300 focus:outline-none focus:border-emerald-500"
            >
              {bins.map((b) => (
                <option key={b.code} value={b.code}>
                  {b.code} — {b.zone} ({b.description})
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
            <button
              type="button"
              onClick={handleModalClose}
              className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-300"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={() => setConfirmStep(true)}
              className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-xs font-bold text-white shadow-lg shadow-emerald-600/25 cursor-pointer"
            >
              Review &amp; Confirm SKU →
            </button>
          </div>
        </div>
      ) : (
        /* Confirmation Step */
        <div className="space-y-5">
          <div className="p-4 rounded-2xl bg-slate-950 border border-emerald-500/30 flex items-center gap-4">
            <img
              src={formImageUrl}
              alt="Confirm Preview"
              className="w-16 h-16 rounded-2xl object-cover border border-slate-800 shrink-0"
            />
            <div className="space-y-1 text-xs">
              <div className="text-emerald-400 font-bold uppercase tracking-wider">
                Confirm New Warehouse Product Registration
              </div>
              <div className="text-base font-bold text-white">
                {formTitle.trim() || 'New Merchant Catalog Item'}
              </div>
              <div className="font-mono text-emerald-300 font-bold">
                2-Part SKU: {generatedFullSku}
              </div>
              <div className="text-slate-400">
                Merchant: {formMerchantCode} · Assigned Bin:{' '}
                <strong className="text-white font-mono">{formBinCode}</strong> · Initial
                Stock: <strong>{formStock} pcs</strong> · Price: ৳{formPrice}
              </div>
            </div>
          </div>

          <div className="flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={() => setConfirmStep(false)}
              className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-300"
            >
              ← Back to Edit
            </button>
            <button
              type="button"
              onClick={handleSave}
              className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-xs font-bold text-white shadow-lg shadow-emerald-600/25 cursor-pointer"
            >
              Confirm &amp; Save to Warehouse Catalog
            </button>
          </div>
        </div>
      )}
    </Modal>
  );
}
