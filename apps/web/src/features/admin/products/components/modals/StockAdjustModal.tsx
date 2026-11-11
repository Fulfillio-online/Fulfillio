'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { SlidersHorizontal, Package, RefreshCw, AlertCircle, Check, ArrowRight } from 'lucide-react';
import { Modal } from '@/components/admin/AdminModal';
import { WarehouseProductItem } from '../../types';

export interface VariantStockItemDraft {
  id: string;
  variantSku: string;
  color?: string;
  size?: string;
  attributeName?: string;
  attributeValue?: string;
  stock: number;
}

interface StockAdjustModalProps {
  isOpen: boolean;
  onClose: () => void;
  product: WarehouseProductItem | null;
  onAdjustStock?: (productId: string, delta: number, reason?: string) => void;
  onSaveVariantStocks: (
    productId: string,
    updatedVariants: VariantStockItemDraft[],
    totalStock: number,
    reason?: string
  ) => void;
}

function resolveColorHex(colorName?: string): string {
  const clean = (colorName || '').trim().toLowerCase();
  if (clean.includes('black') || clean.includes('obsidian')) return '#0f172a';
  if (clean.includes('white') || clean.includes('ivory') || clean.includes('cream')) return '#f8fafc';
  if (clean.includes('navy') || clean.includes('blue') || clean.includes('cobalt')) return '#1e3a8a';
  if (clean.includes('red') || clean.includes('crimson') || clean.includes('maroon')) return '#dc2626';
  if (clean.includes('green') || clean.includes('olive') || clean.includes('emerald')) return '#15803d';
  if (clean.includes('brown') || clean.includes('tan') || clean.includes('coffee')) return '#92400e';
  if (clean.includes('gold') || clean.includes('yellow') || clean.includes('amber')) return '#d97706';
  if (clean.includes('grey') || clean.includes('gray') || clean.includes('silver')) return '#64748b';
  if (clean.includes('pink') || clean.includes('rose')) return '#e11d48';
  if (clean.includes('purple') || clean.includes('violet')) return '#7c3aed';
  return '#ea580c';
}

export function StockAdjustModal({
  isOpen,
  onClose,
  product,
  onSaveVariantStocks,
}: StockAdjustModalProps) {
  const [variants, setVariants] = useState<VariantStockItemDraft[]>([]);
  const [draftStocks, setDraftStocks] = useState<Record<string, number>>({});
  const [reason, setReason] = useState<string>('Physical Cycle Count Correction');

  // Load and construct variants whenever product opens
  useEffect(() => {
    if (!product || !isOpen) return;

    let initialList: VariantStockItemDraft[] = [];

    // 1. Try to read previously stored custom variant stocks
    try {
      const stored = localStorage.getItem(`fulfillio_variants_${product.id}`);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) {
          initialList = parsed.map((v: any) => ({
            id: v.id || `${product.id}-${v.sku}`,
            variantSku: v.sku || v.variantSku || product.fullSku,
            color: v.colorName || v.color || product.color || 'Standard',
            size: v.size || product.size || 'Standard',
            stock: Number(v.stock) || 0,
          }));
        }
      }
    } catch {
      // ignore
    }

    // 2. If not stored, check product.variantsList
    if (initialList.length === 0 && product.variantsList && product.variantsList.length > 0) {
      initialList = product.variantsList.map((v) => ({
        id: v.id,
        variantSku: v.variantSku,
        color: v.color || product.color,
        size: v.size || product.size,
        attributeName: v.attributeName,
        attributeValue: v.attributeValue,
        stock: Number(v.stock) || 0,
      }));
    }

    // 3. If still empty, check colors & sizes combinations
    if (
      initialList.length === 0 &&
      product.colors &&
      product.colors.length > 0 &&
      product.sizes &&
      product.sizes.length > 0
    ) {
      const totalCombinations = product.colors.length * product.sizes.length;
      const basePerVar = Math.max(0, Math.floor(product.stock / totalCombinations));
      const remainder = product.stock % totalCombinations;

      let idx = 0;
      product.colors.forEach((col) => {
        const sizesList = col.sizes && col.sizes.length > 0 ? col.sizes : product.sizes!;
        sizesList.forEach((sz) => {
          const cleanCol = col.name.trim().replace(/\s+/g, '-').toUpperCase().slice(0, 3);
          const cleanSz = sz.trim().toUpperCase();
          const allocated = basePerVar + (idx === 0 ? remainder : 0);
          initialList.push({
            id: `${product.id}-${col.id}-${cleanSz}`,
            variantSku: `${product.fullSku}-${cleanCol}-${cleanSz}`,
            color: col.name,
            size: cleanSz,
            stock: allocated,
          });
          idx++;
        });
      });
    }

    // 4. Fallback to single standard item
    if (initialList.length === 0) {
      initialList = [
        {
          id: `${product.id}-var-1`,
          variantSku: product.fullSku,
          color: product.color || 'Standard',
          size: product.size || 'Standard',
          stock: product.stock,
        },
      ];
    }

    setVariants(initialList);

    // Populate draft stocks map
    const drafts: Record<string, number> = {};
    initialList.forEach((v) => {
      drafts[v.id] = v.stock;
    });
    setDraftStocks(drafts);
  }, [product, isOpen]);

  if (!product) return null;

  const currentTotalStock = variants.reduce((sum, v) => sum + v.stock, 0);
  const newTotalStock = variants.reduce(
    (sum, v) => sum + (draftStocks[v.id] ?? v.stock),
    0
  );
  const totalDifference = newTotalStock - currentTotalStock;

  const handleUpdateStock = (variantId: string, val: number) => {
    setDraftStocks((prev) => ({
      ...prev,
      [variantId]: Math.max(0, val),
    }));
  };

  const handleDeltaStock = (variantId: string, delta: number) => {
    setDraftStocks((prev) => {
      const curr = prev[variantId] ?? 0;
      return {
        ...prev,
        [variantId]: Math.max(0, curr + delta),
      };
    });
  };

  const handleReset = () => {
    const drafts: Record<string, number> = {};
    variants.forEach((v) => {
      drafts[v.id] = v.stock;
    });
    setDraftStocks(drafts);
  };

  const handleApply = () => {
    const updatedVariantsList: VariantStockItemDraft[] = variants.map((v) => ({
      ...v,
      stock: draftStocks[v.id] ?? v.stock,
    }));

    onSaveVariantStocks(product.id, updatedVariantsList, newTotalStock, reason);
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Manage Inventory Stock (Color & Size Breakdown)"
      subtitle={`সাইজ ও কালার ভ্যারিয়েন্ট অনুযায়ী আলাদা আলাদা স্টক আপডেট করুন`}
      size="lg"
    >
      <div className="space-y-4">
        {/* Product Overview Card */}
        <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-navy-950 border border-slate-200 dark:border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            {product.imageUrl && (
              <img
                src={product.imageUrl}
                alt={product.title}
                className="w-12 h-12 rounded-xl object-cover border border-slate-200 dark:border-white/10 shrink-0"
              />
            )}
            <div className="text-xs space-y-0.5 min-w-0">
              <div className="font-bold text-navy-900 dark:text-white truncate text-sm">
                {product.title}
              </div>
              <div className="flex items-center gap-2 font-mono text-slate-500 dark:text-slate-400">
                <span className="font-bold text-orange-600 dark:text-orange-400">
                  {product.fullSku}
                </span>
                <span>•</span>
                <span>Merchant: <strong className="text-navy-900 dark:text-white">{product.merchantCode}</strong></span>
                <span>•</span>
                <span>Bin: <strong className="text-navy-900 dark:text-white">{product.binCode}</strong></span>
              </div>
            </div>
          </div>

          {/* Current vs New Total Indicator */}
          <div className="flex items-center gap-3 bg-white dark:bg-navy-900 px-3.5 py-2 rounded-xl border border-slate-200 dark:border-white/10 shrink-0">
            <div>
              <div className="text-[10px] uppercase font-bold text-slate-500">Current Total</div>
              <div className="text-sm font-extrabold tabular-nums text-slate-700 dark:text-slate-300">
                {currentTotalStock} pcs
              </div>
            </div>
            <ArrowRight className="w-4 h-4 text-slate-400" />
            <div>
              <div className="text-[10px] uppercase font-bold text-slate-500">New Total</div>
              <div className="text-sm font-extrabold tabular-nums text-orange-600 dark:text-orange-400">
                {newTotalStock} pcs
              </div>
            </div>
            {totalDifference !== 0 && (
              <span
                className={`px-2 py-0.5 rounded text-xs font-bold font-mono ${
                  totalDifference > 0
                    ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                    : 'bg-rose-500/10 text-rose-600 dark:text-rose-400'
                }`}
              >
                {totalDifference > 0 ? `+${totalDifference}` : totalDifference}
              </span>
            )}
          </div>
        </div>

        {/* Variant Table with Controls */}
        <div className="rounded-xl border border-slate-200 dark:border-white/10 overflow-hidden">
          <div className="max-h-[360px] overflow-y-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-navy-950 text-slate-500 dark:text-slate-400 uppercase tracking-wider text-[11px] font-bold sticky top-0 z-10 border-b border-slate-200 dark:border-white/10">
                <tr>
                  <th className="py-2.5 px-3">Variant Option</th>
                  <th className="py-2.5 px-3">Variant SKU</th>
                  <th className="py-2.5 px-3 text-center">Current</th>
                  <th className="py-2.5 px-3 text-center">Update Stock (pcs)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-white/5 font-medium">
                {variants.map((v) => {
                  const currentVal = v.stock;
                  const draftVal = draftStocks[v.id] ?? currentVal;
                  const label = [v.color, v.size || v.attributeValue].filter(Boolean).join(' / ');
                  const hexColor = resolveColorHex(v.color);
                  const isModified = draftVal !== currentVal;

                  return (
                    <tr
                      key={v.id}
                      className={`hover:bg-slate-50 dark:hover:bg-navy-800/50 transition-colors ${
                        isModified ? 'bg-orange-50/50 dark:bg-orange-950/20' : ''
                      }`}
                    >
                      {/* Variant Option */}
                      <td className="py-3 px-3 align-middle">
                        <div className="flex items-center gap-2">
                          <span
                            className="w-3 h-3 rounded-full border border-slate-300 dark:border-white/20 shrink-0"
                            style={{ backgroundColor: hexColor }}
                          />
                          <span className="font-bold text-navy-900 dark:text-white">
                            {label || 'Standard'}
                          </span>
                        </div>
                      </td>

                      {/* Variant SKU */}
                      <td className="py-3 px-3 font-mono text-xs font-bold text-orange-600 dark:text-orange-400 align-middle">
                        {v.variantSku}
                      </td>

                      {/* Current Stock */}
                      <td className="py-3 px-3 text-center align-middle font-mono font-bold text-slate-500 dark:text-slate-400">
                        {currentVal} pcs
                      </td>

                      {/* Adjustment Buttons + Input */}
                      <td className="py-3 px-3 text-center align-middle">
                        <div className="inline-flex items-center gap-1.5 justify-center">
                          <button
                            type="button"
                            onClick={() => handleDeltaStock(v.id, -10)}
                            className="px-2 py-1 rounded-lg bg-slate-100 dark:bg-navy-800 hover:bg-slate-200 dark:hover:bg-navy-700 text-[11px] font-bold text-slate-600 dark:text-slate-300 cursor-pointer"
                            title="Decrease by 10"
                          >
                            -10
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeltaStock(v.id, -1)}
                            className="px-2 py-1 rounded-lg bg-slate-100 dark:bg-navy-800 hover:bg-slate-200 dark:hover:bg-navy-700 text-xs font-bold text-slate-600 dark:text-slate-300 cursor-pointer"
                            title="Decrease by 1"
                          >
                            -1
                          </button>

                          <input
                            type="number"
                            min="0"
                            value={draftVal}
                            onChange={(e) =>
                              handleUpdateStock(v.id, parseInt(e.target.value, 10) || 0)
                            }
                            className="w-16 py-1 text-center rounded-lg bg-white dark:bg-navy-900 border border-slate-300 dark:border-white/15 text-xs font-bold tabular-nums text-navy-900 dark:text-white focus:outline-none focus:border-orange-500"
                          />

                          <button
                            type="button"
                            onClick={() => handleDeltaStock(v.id, 1)}
                            className="px-2 py-1 rounded-lg bg-slate-100 dark:bg-navy-800 hover:bg-slate-200 dark:hover:bg-navy-700 text-xs font-bold text-slate-600 dark:text-slate-300 cursor-pointer"
                            title="Increase by 1"
                          >
                            +1
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeltaStock(v.id, 10)}
                            className="px-2 py-1 rounded-lg bg-slate-100 dark:bg-navy-800 hover:bg-slate-200 dark:hover:bg-navy-700 text-[11px] font-bold text-slate-600 dark:text-slate-300 cursor-pointer"
                            title="Increase by 10"
                          >
                            +10
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Reason for Adjustment */}
        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-200 mb-1.5">
            Reason for Adjustment
          </label>
          <select
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-navy-950 border border-slate-200 dark:border-white/10 text-xs text-navy-800 dark:text-white focus:outline-none focus:border-orange-500 cursor-pointer"
          >
            <option value="Physical Cycle Count Correction">Physical Cycle Count Correction</option>
            <option value="Inbound Stock Restock">Inbound Restock Receipt</option>
            <option value="Damaged Goods Write-off">Damaged Goods / Scrap Write-off</option>
            <option value="Return QC Accepted">Returns &amp; RTO QC Inspection Accepted</option>
            <option value="Manual Warehouse Audit">Manual Warehouse Audit</option>
          </select>
        </div>

        {/* Modal Actions */}
        <div className="flex items-center justify-between pt-3 border-t border-slate-200 dark:border-white/10">
          <button
            type="button"
            onClick={handleReset}
            className="text-xs font-bold text-slate-500 hover:text-orange-600 dark:hover:text-orange-400 transition-colors cursor-pointer flex items-center gap-1.5"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Reset to Current</span>
          </button>

          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-navy-800 hover:bg-slate-200 dark:hover:bg-navy-700 text-xs font-semibold text-slate-700 dark:text-slate-200 transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleApply}
              className="px-5 py-2 rounded-xl bg-orange-600 hover:bg-orange-700 text-white text-xs font-bold transition-all shadow-md shadow-orange-500/20 flex items-center gap-1.5 cursor-pointer"
            >
              <Check className="w-4 h-4" />
              <span>Save Variant Stock</span>
            </button>
          </div>
        </div>
      </div>
    </Modal>
  );
}
