'use client';

import React, { useState } from 'react';
import { PlusCircle, Package, ArrowRight, CheckCircle2 } from 'lucide-react';
import { Modal } from '@/components/admin/AdminModal';
import { WarehouseBin, WarehouseProductItem } from '../../types';

interface ManualRestockModalProps {
  isOpen: boolean;
  onClose: () => void;
  products: WarehouseProductItem[];
  bins: WarehouseBin[];
  onConfirm: (productId: string, quantity: number, binCode: string, note?: string) => void;
}

export function ManualRestockModal({
  isOpen,
  onClose,
  products,
  bins,
  onConfirm,
}: ManualRestockModalProps) {
  const approvedProducts = products.filter((p) => p.status === 'APPROVED');
  const [selectedProductId, setSelectedProductId] = useState<string>(
    approvedProducts[0]?.id || ''
  );
  const [quantity, setQuantity] = useState<number>(50);
  const [selectedBin, setSelectedBin] = useState<string>(bins[0]?.code || 'A-01-02');
  const [note, setNote] = useState<string>('Walk-in merchant restock / direct courier dock delivery');

  const selectedProduct =
    approvedProducts.find((p) => p.id === selectedProductId) || approvedProducts[0];

  const handleConfirm = () => {
    if (!selectedProduct || quantity <= 0) return;
    onConfirm(selectedProduct.id, quantity, selectedBin || selectedProduct.binCode, note);
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Record Direct Inbound Stock Replenishment"
      size="md"
    >
      <div className="space-y-4">
        {/* Banner Alert */}
        <div className="flex items-start gap-3 p-3.5 rounded-xl bg-indigo-500/10 border border-indigo-500/20">
          <div className="w-9 h-9 rounded-xl bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0">
            <PlusCircle className="w-5 h-5" />
          </div>
          <div className="text-xs sm:text-sm text-slate-700 dark:text-slate-200">
            Direct warehouse stock intake for an existing catalog product. Stock will be immediately
            credited to the product and stored in the designated bin.
          </div>
        </div>

        {/* Product Selector */}
        <div>
          <label className="block text-xs font-bold text-slate-700 dark:text-slate-200 mb-1.5">
            Select Existing Catalog Product *
          </label>
          <select
            value={selectedProductId}
            onChange={(e) => {
              const pid = e.target.value;
              setSelectedProductId(pid);
              const p = approvedProducts.find((item) => item.id === pid);
              if (p?.binCode) setSelectedBin(p.binCode);
            }}
            className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-navy-950 border border-slate-300 dark:border-white/10 text-xs font-semibold text-navy-800 dark:text-slate-100 focus:outline-none focus:border-orange-500 cursor-pointer"
          >
            {approvedProducts.map((p) => (
              <option key={p.id} value={p.id}>
                {p.fullSku} — {p.title} (Stock: {p.stock} pcs · {p.merchantName})
              </option>
            ))}
          </select>
        </div>

        {/* Selected Product Preview */}
        {selectedProduct && (
          <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-navy-950 border border-slate-200 dark:border-white/10 flex items-center gap-3">
            <img
              src={selectedProduct.imageUrl}
              alt={selectedProduct.title}
              className="w-12 h-12 rounded-xl object-cover border border-slate-200 dark:border-white/10 shrink-0"
            />
            <div className="text-xs space-y-0.5 flex-1 min-w-0">
              <div className="font-bold text-navy-800 dark:text-white truncate">
                {selectedProduct.title}
              </div>
              <div className="tabular-nums font-mono text-[11px] text-orange-600 dark:text-orange-400">
                {selectedProduct.fullSku}
              </div>
              <div className="flex items-center gap-2 text-[11px] text-slate-500 dark:text-slate-400">
                <span>Current Warehouse Stock: <strong>{selectedProduct.stock} pcs</strong></span>
                <span>·</span>
                <span>Bin: <strong>{selectedProduct.binCode}</strong></span>
              </div>
            </div>
          </div>
        )}

        {/* Restock Quantity & Math Preview */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-200 mb-1.5">
              Intake Quantity (Units) *
            </label>
            <input
              type="number"
              min={1}
              value={quantity}
              onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value, 10) || 1))}
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-navy-950 border border-slate-300 dark:border-white/10 text-xs font-bold text-orange-600 dark:text-orange-400 focus:outline-none focus:border-orange-500 tabular-nums"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-200 mb-1.5">
              Target Warehouse Bin *
            </label>
            <select
              value={selectedBin}
              onChange={(e) => setSelectedBin(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-navy-950 border border-slate-300 dark:border-white/10 text-xs font-semibold text-navy-800 dark:text-slate-100 focus:outline-none focus:border-orange-500 cursor-pointer"
            >
              {bins.map((bin) => (
                <option key={bin.code} value={bin.code}>
                  Bin {bin.code} ({bin.zone})
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Note / Carrier Reference */}
        <div>
          <label className="block text-xs font-bold text-slate-700 dark:text-slate-200 mb-1.5">
            Arrival Reference / Inspection Notes
          </label>
          <input
            type="text"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="e.g. Consignment via courier or merchant van"
            className="w-full px-3.5 py-2 rounded-xl bg-slate-50 dark:bg-navy-950 border border-slate-300 dark:border-white/10 text-xs text-navy-800 dark:text-slate-100 focus:outline-none focus:border-orange-500"
          />
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-200 dark:border-white/10">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl border border-slate-300 dark:border-white/10 text-xs font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-navy-800 transition-colors cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-md shadow-emerald-500/20 transition-all cursor-pointer flex items-center gap-1.5 active:scale-95"
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>Intake Stock (+{quantity} units)</span>
          </button>
        </div>
      </div>
    </Modal>
  );
}
