'use client';

import React, { useState } from 'react';
import { PackageMinus, ArrowRight, CheckCircle2 } from 'lucide-react';
import { Modal } from '@/components/admin/AdminModal';
import { WarehouseProductItem } from '../../types';

interface ManualWithdrawalModalProps {
  isOpen: boolean;
  onClose: () => void;
  products: WarehouseProductItem[];
  onConfirm: (productId: string, quantity: number, reason?: string) => void;
}

export function ManualWithdrawalModal({
  isOpen,
  onClose,
  products,
  onConfirm,
}: ManualWithdrawalModalProps) {
  const inStockProducts = products.filter((p) => p.status === 'APPROVED' && p.stock > 0);
  const [selectedProductId, setSelectedProductId] = useState<string>(
    inStockProducts[0]?.id || ''
  );
  const [quantity, setQuantity] = useState<number>(10);
  const [reason, setReason] = useState<string>('Merchant direct stock recall / offline retail replenishment');

  const selectedProduct =
    inStockProducts.find((p) => p.id === selectedProductId) || inStockProducts[0];

  const maxStock = selectedProduct ? selectedProduct.stock : 0;

  const handleConfirm = () => {
    if (!selectedProduct || quantity <= 0) return;
    const finalQty = Math.min(maxStock, quantity);
    onConfirm(selectedProduct.id, finalQty, reason);
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Record Direct Merchant Stock Withdrawal"
      size="md"
    >
      <div className="space-y-4">
        {/* Banner Alert */}
        <div className="flex items-start gap-3 p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/20">
          <div className="w-9 h-9 rounded-xl bg-rose-500/20 text-rose-600 dark:text-rose-400 flex items-center justify-center shrink-0">
            <PackageMinus className="w-5 h-5" />
          </div>
          <div className="text-xs sm:text-sm text-slate-700 dark:text-slate-200">
            Direct stock deduction for goods returned to or picked up by the merchant. Quantity will be
            immediately removed from the warehouse bin and live catalog stock.
          </div>
        </div>

        {/* Product Selector */}
        <div>
          <label className="block text-xs font-bold text-slate-700 dark:text-slate-200 mb-1.5">
            Select Product to Withdraw *
          </label>
          <select
            value={selectedProductId}
            onChange={(e) => {
              const pid = e.target.value;
              setSelectedProductId(pid);
              const p = inStockProducts.find((item) => item.id === pid);
              if (p) setQuantity(Math.min(p.stock, 10));
            }}
            className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-navy-950 border border-slate-300 dark:border-white/10 text-xs font-semibold text-navy-800 dark:text-slate-100 focus:outline-none focus:border-orange-500 cursor-pointer"
          >
            {inStockProducts.map((p) => (
              <option key={p.id} value={p.id}>
                {p.fullSku} — {p.title} (Stock: {p.stock} pcs · Bin: {p.binCode} · {p.merchantName})
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
                <span>Available Stock: <strong>{selectedProduct.stock} pcs</strong></span>
                <span>·</span>
                <span>Pick Bin: <strong>Bin {selectedProduct.binCode}</strong></span>
              </div>
            </div>
          </div>
        )}

        {/* Withdrawal Quantity */}
        <div>
          <label className="block text-xs font-bold text-slate-700 dark:text-slate-200 mb-1.5">
            Withdrawal Quantity (Max: {maxStock} units) *
          </label>
          <input
            type="number"
            min={1}
            max={maxStock}
            value={quantity}
            onChange={(e) => {
              const val = parseInt(e.target.value, 10);
              if (!isNaN(val)) {
                setQuantity(Math.min(maxStock, Math.max(1, val)));
              }
            }}
            className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-navy-950 border border-slate-300 dark:border-white/10 text-xs font-bold text-rose-600 dark:text-rose-400 focus:outline-none focus:border-orange-500 tabular-nums"
          />
          <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
            After withdrawal, remaining stock in Bin {selectedProduct?.binCode} will be{' '}
            <strong>{Math.max(0, maxStock - quantity)} pcs</strong>.
          </p>
        </div>

        {/* Reason / Dispatch Note */}
        <div>
          <label className="block text-xs font-bold text-slate-700 dark:text-slate-200 mb-1.5">
            Withdrawal Reason / Courier Reference
          </label>
          <input
            type="text"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="e.g. Return to merchant, offline store allocation, or recall"
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
            className="px-5 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold shadow-md shadow-rose-500/20 transition-all cursor-pointer flex items-center gap-1.5 active:scale-95"
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>Release &amp; Deduct Stock (-{quantity})</span>
          </button>
        </div>
      </div>
    </Modal>
  );
}
