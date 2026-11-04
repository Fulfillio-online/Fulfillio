'use client';

import React, { useState } from 'react';
import { SlidersHorizontal } from 'lucide-react';
import { Modal } from '@/components/ui';
import { WarehouseProductItem } from '../../types';

interface StockAdjustModalProps {
  isOpen: boolean;
  onClose: () => void;
  product: WarehouseProductItem | null;
  onAdjustStock: (productId: string, delta: number, reason?: string) => void;
}

export function StockAdjustModal({
  isOpen,
  onClose,
  product,
  onAdjustStock,
}: StockAdjustModalProps) {
  const [delta, setDelta] = useState<number>(0);
  const [reason, setReason] = useState<string>('Cycle Count Adjustment');

  if (!product) return null;

  const currentStock = product.stock;
  const newStock = Math.max(0, currentStock + delta);

  const handleApply = () => {
    if (delta !== 0) {
      onAdjustStock(product.id, delta, reason);
    }
    setDelta(0);
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Adjust Physical Inventory Stock"
      subtitle={`${product.title} (${product.fullSku})`}
      size="sm"
    >
      <div className="space-y-4">
        <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between">
          <div>
            <div className="text-xs text-slate-400">Current Stock</div>
            <div className="text-xl font-bold font-mono text-white">{currentStock} pcs</div>
          </div>
          <div className="text-right">
            <div className="text-xs text-slate-400">Adjusted Stock</div>
            <div
              className={`text-xl font-bold font-mono ${
                newStock > currentStock
                  ? 'text-emerald-400'
                  : newStock < currentStock
                  ? 'text-rose-400'
                  : 'text-slate-300'
              }`}
            >
              {newStock} pcs
            </div>
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-2">
            Adjustment Quantity (+ / -)
          </label>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setDelta((d) => d - 10)}
              className="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-mono font-bold text-slate-200"
            >
              -10
            </button>
            <button
              type="button"
              onClick={() => setDelta((d) => d - 1)}
              className="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-mono font-bold text-slate-200"
            >
              -1
            </button>
            <input
              type="number"
              value={delta}
              onChange={(e) => setDelta(parseInt(e.target.value, 10) || 0)}
              className="w-20 text-center py-1.5 rounded-lg bg-slate-950 border border-slate-700 text-sm font-mono font-bold text-white focus:outline-none focus:border-emerald-500"
            />
            <button
              type="button"
              onClick={() => setDelta((d) => d + 1)}
              className="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-mono font-bold text-slate-200"
            >
              +1
            </button>
            <button
              type="button"
              onClick={() => setDelta((d) => d + 10)}
              className="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-mono font-bold text-slate-200"
            >
              +10
            </button>
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
            Reason for Adjustment
          </label>
          <select
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white focus:outline-none focus:border-emerald-500"
          >
            <option value="Cycle Count Adjustment">Physical Cycle Count Correction</option>
            <option value="Damaged Goods Write-off">Damaged Goods / Scrap Write-off</option>
            <option value="Manual Inbound Receipt">Unscheduled Inbound Restock</option>
            <option value="Return QC Accepted">Returns &amp; RTO QC Inspection Accepted</option>
          </select>
        </div>

        <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-800">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-300"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleApply}
            disabled={delta === 0}
            className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-xs font-bold text-white shadow-lg shadow-emerald-600/25 cursor-pointer"
          >
            Apply Adjustment
          </button>
        </div>
      </div>
    </Modal>
  );
}
