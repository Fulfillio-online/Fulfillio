'use client';

import React, { useState } from 'react';
import { X, Sparkles } from 'lucide-react';
import { MerchantProductItem } from '../../types';

interface AddSingleProductModalProps {
  isOpen: boolean;
  onClose: () => void;
  merchantCode: string;
  onAddProducts: (newProducts: MerchantProductItem[]) => void;
}

export function AddSingleProductModal({
  isOpen,
  onClose,
  merchantCode,
  onAddProducts,
}: AddSingleProductModalProps) {
  const [prodTitle, setProdTitle] = useState('');
  const [prodBaseSku, setProdBaseSku] = useState('');
  const [hasVariants, setHasVariants] = useState(true);
  const [colorInput, setColorInput] = useState('');
  const [sizeInput, setSizeInput] = useState('');
  const [colors, setColors] = useState(['Black', 'White']);
  const [sizes, setSizes] = useState(['M', 'L', 'XL']);
  const [singlePrice, setSinglePrice] = useState('950');
  const [singleStock, setSingleStock] = useState('25');
  const [binLocation, setBinLocation] = useState('A-01-02-05');

  if (!isOpen) return null;

  const getColorCode = (name: string) => {
    const clean = name.trim().toUpperCase();
    if (clean === 'BLACK') return 'BLK';
    if (clean === 'WHITE') return 'WHT';
    if (clean === 'NAVY' || clean === 'NAVY BLUE') return 'NVY';
    if (clean === 'RED') return 'RED';
    if (clean === 'BLUE') return 'BLU';
    if (clean === 'GREEN') return 'GRN';
    return clean.substring(0, 3);
  };

  const getSizeCode = (name: string) => {
    return name.trim().toUpperCase();
  };

  const handleAddColor = () => {
    if (colorInput.trim() && !colors.includes(colorInput.trim())) {
      setColors([...colors, colorInput.trim()]);
      setColorInput('');
    }
  };

  const handleAddSize = () => {
    if (sizeInput.trim() && !sizes.includes(sizeInput.trim().toUpperCase())) {
      setSizes([...sizes, sizeInput.trim().toUpperCase()]);
      setSizeInput('');
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!prodTitle || !prodBaseSku) return;

    const baseClean = prodBaseSku.trim().toUpperCase().replace(/\s+/g, '-');
    const newItems: MerchantProductItem[] = [];

    if (hasVariants && colors.length > 0 && sizes.length > 0) {
      colors.forEach((col) => {
        sizes.forEach((sz) => {
          const colCode = getColorCode(col);
          const szCode = getSizeCode(sz);
          const fullSku = `${merchantCode}-${baseClean}-${colCode}-${szCode}`;
          const autoBarcode = `89010100${Math.floor(10000 + Math.random() * 90000)}`;
          newItems.push({
            id: `p-${Date.now()}-${colCode}-${szCode}`,
            title: prodTitle,
            variantLabel: `${col} / ${sz}`,
            sku: fullSku,
            barcode: autoBarcode,
            stock: Number(singleStock) || 20,
            reserved: 0,
            price: Number(singlePrice) || 950,
            bin: binLocation || 'A-01-02-05',
          });
        });
      });
    } else {
      const fullSku = `${merchantCode}-${baseClean}`;
      const autoBarcode = `89010100${Math.floor(10000 + Math.random() * 90000)}`;
      newItems.push({
        id: `p-${Date.now()}`,
        title: prodTitle,
        variantLabel: 'Standard',
        sku: fullSku,
        barcode: autoBarcode,
        stock: Number(singleStock) || 20,
        reserved: 0,
        price: Number(singlePrice) || 950,
        bin: binLocation || 'A-01-02-05',
      });
    }

    onAddProducts(newItems);
    onClose();
    setProdTitle('');
    setProdBaseSku('');
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto p-4 sm:p-6 space-y-5 shadow-2xl animate-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div>
            <h3 className="font-bold text-base text-slate-100">Add New Product to Warehouse Catalog</h3>
            <p className="text-xs text-slate-400">
              Automatically generates 2-part SKUs ({merchantCode}-[SKU]) and 13-digit barcodes.
            </p>
          </div>
          <button onClick={onClose} className="text-slate-500 hover:text-slate-300 p-1">
            <X className="h-4 w-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-xs font-semibold text-slate-400 block mb-1">Product Title</label>
            <input
              type="text"
              value={prodTitle}
              onChange={(e) => setProdTitle(e.target.value)}
              placeholder="e.g. Heavyweight Oversized T-Shirt"
              required
              className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-sm text-slate-100 focus:outline-none focus:border-emerald-500"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-slate-400 block mb-1">
                Base SKU Code (Your Internal Code)
              </label>
              <input
                type="text"
                value={prodBaseSku}
                onChange={(e) => setProdBaseSku(e.target.value.toUpperCase())}
                placeholder="e.g. TSHIRT"
                required
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-sm font-mono text-emerald-400 uppercase focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-400 block mb-1">
                Merchant Code (System Locked)
              </label>
              <input
                type="text"
                value={merchantCode}
                readOnly
                className="w-full px-3 py-2 bg-slate-950/60 border border-slate-800 rounded-lg text-sm font-mono text-slate-500 cursor-not-allowed"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="text-xs font-semibold text-slate-400 block mb-1">Unit Price (৳)</label>
              <input
                type="number"
                value={singlePrice}
                onChange={(e) => setSinglePrice(e.target.value)}
                required
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-sm text-slate-100 focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-400 block mb-1">Initial Stock</label>
              <input
                type="number"
                value={singleStock}
                onChange={(e) => setSingleStock(e.target.value)}
                required
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-sm text-slate-100 focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-400 block mb-1">Warehouse Bin</label>
              <input
                type="text"
                value={binLocation}
                onChange={(e) => setBinLocation(e.target.value)}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-sm font-mono text-amber-400 focus:outline-none focus:border-emerald-500"
              />
            </div>
          </div>

          {/* Variant Toggle */}
          <div className="pt-2 border-t border-slate-800">
            <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-slate-200">
              <input
                type="checkbox"
                checked={hasVariants}
                onChange={(e) => setHasVariants(e.target.checked)}
                className="rounded bg-slate-950 border-slate-800 text-emerald-600 focus:ring-0 h-4 w-4"
              />
              <span>This product has variants (Color / Size)</span>
            </label>
          </div>

          {hasVariants && (
            <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-4">
              {/* Colors Builder */}
              <div>
                <span className="text-xs font-semibold text-slate-400 block mb-1.5">Colors:</span>
                <div className="flex flex-wrap items-center gap-2">
                  {colors.map((c) => (
                    <span
                      key={c}
                      className="px-2.5 py-1 rounded bg-slate-800 border border-slate-700 text-xs text-slate-200 flex items-center gap-1.5"
                    >
                      <span>{c}</span>
                      <button
                        type="button"
                        onClick={() => setColors(colors.filter((x) => x !== c))}
                        className="text-slate-400 hover:text-rose-400"
                      >
                        ×
                      </button>
                    </span>
                  ))}
                  <div className="flex items-center gap-1">
                    <input
                      type="text"
                      value={colorInput}
                      onChange={(e) => setColorInput(e.target.value)}
                      placeholder="+ Add Color"
                      className="w-24 px-2 py-1 bg-slate-900 border border-slate-800 rounded text-xs text-slate-200"
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          handleAddColor();
                        }
                      }}
                    />
                    <button
                      type="button"
                      onClick={handleAddColor}
                      className="p-1 rounded bg-slate-800 text-xs text-slate-300"
                    >
                      +
                    </button>
                  </div>
                </div>
              </div>

              {/* Sizes Builder */}
              <div>
                <span className="text-xs font-semibold text-slate-400 block mb-1.5">Sizes:</span>
                <div className="flex flex-wrap items-center gap-2">
                  {sizes.map((s) => (
                    <span
                      key={s}
                      className="px-2.5 py-1 rounded bg-slate-800 border border-slate-700 text-xs text-slate-200 flex items-center gap-1.5"
                    >
                      <span>{s}</span>
                      <button
                        type="button"
                        onClick={() => setSizes(sizes.filter((x) => x !== s))}
                        className="text-slate-400 hover:text-rose-400"
                      >
                        ×
                      </button>
                    </span>
                  ))}
                  <div className="flex items-center gap-1">
                    <input
                      type="text"
                      value={sizeInput}
                      onChange={(e) => setSizeInput(e.target.value)}
                      placeholder="+ Add Size"
                      className="w-24 px-2 py-1 bg-slate-900 border border-slate-800 rounded text-xs text-slate-200"
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          handleAddSize();
                        }
                      }}
                    />
                    <button
                      type="button"
                      onClick={handleAddSize}
                      className="p-1 rounded bg-slate-800 text-xs text-slate-300"
                    >
                      +
                    </button>
                  </div>
                </div>
              </div>

              {/* Dynamic Generated SKU Preview */}
              {prodBaseSku && colors.length > 0 && sizes.length > 0 && (
                <div className="pt-2 border-t border-slate-800/80">
                  <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block mb-1">
                    Generated 2-Part SKUs Preview ({colors.length * sizes.length} variants):
                  </span>
                  <div className="space-y-1 max-h-32 overflow-y-auto pr-1">
                    {colors.map((col) =>
                      sizes.map((sz) => (
                        <div
                          key={`${col}-${sz}`}
                          className="flex items-center justify-between text-xs py-1 px-2 rounded bg-slate-900/60"
                        >
                          <span className="text-slate-300">
                            {col} / {sz}
                          </span>
                          <span className="font-mono text-emerald-400 font-semibold">
                            {merchantCode}-{prodBaseSku.trim().toUpperCase()}-{getColorCode(col)}-{getSizeCode(sz)}
                          </span>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          <div className="pt-2 flex justify-end gap-3 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-300"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-xs font-semibold text-white shadow-sm flex items-center gap-1.5"
            >
              <Sparkles className="h-4 w-4" />
              <span>Generate & Save Products</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
