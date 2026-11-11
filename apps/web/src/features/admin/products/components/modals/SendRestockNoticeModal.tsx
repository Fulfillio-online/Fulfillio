'use client';

import React, { useState } from 'react';
import { BellRing, Send, AlertTriangle, Package, Check } from 'lucide-react';
import { Modal } from '@/components/admin/AdminModal';
import { WarehouseProductItem } from '../../types';

interface SendRestockNoticeModalProps {
  isOpen: boolean;
  onClose: () => void;
  products: WarehouseProductItem[];
  preselectedProductId?: string;
  onSend: (productId: string, suggestedQty: number, note?: string) => void;
}

export function SendRestockNoticeModal({
  isOpen,
  onClose,
  products,
  preselectedProductId,
  onSend,
}: SendRestockNoticeModalProps) {
  const [selectedProductId, setSelectedProductId] = useState<string>(
    preselectedProductId || products[0]?.id || ''
  );
  const [suggestedQty, setSuggestedQty] = useState<number>(50);
  const [message, setMessage] = useState<string>(
    'Warehouse stock has reached low threshold / depleted. Please initiate replenishment consignment batch.'
  );

  const selectedProduct = products.find((p) => p.id === selectedProductId) || products[0];

  const handleSend = () => {
    if (!selectedProduct) return;
    onSend(selectedProduct.id, suggestedQty, message);
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Send Stock Restock Notification to Merchant"
      size="md"
    >
      <div className="space-y-4">
        {/* Banner Alert */}
        <div className="flex items-start gap-3 p-3.5 rounded-xl bg-orange-500/10 border border-orange-500/20">
          <div className="w-9 h-9 rounded-xl bg-orange-500/20 text-orange-600 dark:text-orange-400 flex items-center justify-center shrink-0">
            <BellRing className="w-5 h-5" />
          </div>
          <div className="text-xs sm:text-sm text-slate-700 dark:text-slate-200">
            Notify merchant that warehouse stock for their product is low or depleted, and request an
            inbound replenishment batch.
          </div>
        </div>

        {/* Product Selector */}
        <div>
          <label className="block text-xs font-bold text-slate-700 dark:text-slate-200 mb-1.5">
            Select Warehouse Product *
          </label>
          <select
            value={selectedProductId}
            onChange={(e) => setSelectedProductId(e.target.value)}
            className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-navy-950 border border-slate-300 dark:border-white/10 text-xs font-semibold text-navy-800 dark:text-slate-100 focus:outline-none focus:border-orange-500 cursor-pointer"
          >
            {products
              .filter((p) => p.status === 'APPROVED')
              .sort((a, b) => a.stock - b.stock)
              .map((p) => (
                <option key={p.id} value={p.id}>
                  {p.stock === 0 ? '⚠️ [OUT OF STOCK]' : `[Stock: ${p.stock}]`} {p.fullSku} — {p.title} ({p.merchantName})
                </option>
              ))}
          </select>
        </div>

        {/* Selected Product Preview Card */}
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
                <span>
                  Current Stock:{' '}
                  <strong
                    className={
                      selectedProduct.stock === 0
                        ? 'text-rose-600 dark:text-rose-400'
                        : 'text-navy-900 dark:text-white'
                    }
                  >
                    {selectedProduct.stock} pcs
                  </strong>
                </span>
                <span>·</span>
                <span>Merchant: {selectedProduct.merchantName} ({selectedProduct.merchantCode})</span>
              </div>
            </div>
          </div>
        )}

        {/* Suggested Restock Quantity */}
        <div>
          <label className="block text-xs font-bold text-slate-700 dark:text-slate-200 mb-1.5">
            Suggested Restock Quantity (Units) *
          </label>
          <input
            type="number"
            min={1}
            value={suggestedQty}
            onChange={(e) => setSuggestedQty(Math.max(1, parseInt(e.target.value, 10) || 1))}
            className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-navy-950 border border-slate-300 dark:border-white/10 text-xs font-bold text-orange-600 dark:text-orange-400 focus:outline-none focus:border-orange-500 tabular-nums"
          />
          <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
            Merchant will receive an in-app alert and email requesting this suggested restock volume.
          </p>
        </div>

        {/* Custom Message to Merchant */}
        <div>
          <label className="block text-xs font-bold text-slate-700 dark:text-slate-200 mb-1.5">
            Notice Note to Merchant
          </label>
          <textarea
            rows={2}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
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
            onClick={handleSend}
            className="px-5 py-2 rounded-xl bg-orange-600 hover:bg-orange-500 text-white text-xs font-bold shadow-md shadow-orange-500/20 transition-all cursor-pointer flex items-center gap-1.5 active:scale-95"
          >
            <Send className="w-3.5 h-3.5" />
            <span>Send Restock Notice</span>
          </button>
        </div>
      </div>
    </Modal>
  );
}
