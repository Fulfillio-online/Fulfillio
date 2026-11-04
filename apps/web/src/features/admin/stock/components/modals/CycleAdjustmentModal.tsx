'use client';

import React, { useState } from 'react';
import { X } from 'lucide-react';
import { WarehouseProductItem } from '@/features/admin/products';

interface CycleAdjustmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  products: WarehouseProductItem[];
  onApplyAdjustment: (
    sku: string,
    type: 'CYCLE_SURPLUS' | 'MANUAL_RESTOCK' | 'DAMAGE_WRITEOFF',
    qty: number,
    reason: string
  ) => void;
}

export function CycleAdjustmentModal({
  isOpen,
  onClose,
  products,
  onApplyAdjustment,
}: CycleAdjustmentModalProps) {
  const [selectedSku, setSelectedSku] = useState(
    products[0]?.fullSku || 'MC-101-HOODIE-BLK-XL'
  );
  const [adjustType, setAdjustType] = useState<
    'CYCLE_SURPLUS' | 'MANUAL_RESTOCK' | 'DAMAGE_WRITEOFF'
  >('CYCLE_SURPLUS');
  const [adjustQty, setAdjustQty] = useState('5');
  const [adjustReason, setAdjustReason] = useState(
    'Weekly shelf cycle count verification'
  );

  React.useEffect(() => {
    if (products.length > 0 && !selectedSku) {
      setSelectedSku(products[0].fullSku);
    }
  }, [products, selectedSku]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const qtyNum = Math.max(1, Number(adjustQty) || 1);
    onApplyAdjustment(selectedSku, adjustType, qtyNum, adjustReason);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4 animate-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <h3 className="text-base font-bold text-white">New Cycle Count / Stock Adjustment</h3>
          <button
            type="button"
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-white"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3.5 text-xs">
          <div>
            <label className="block font-bold text-slate-300 mb-1">Select Product SKU *</label>
            <select
              value={selectedSku}
              onChange={(e) => setSelectedSku(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white font-mono text-xs"
            >
              {products.map((p) => (
                <option key={p.id} value={p.fullSku}>
                  {p.fullSku} (Bin {p.binCode} • Current: {p.stock} pcs)
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-slate-300 mb-1">Adjustment Type *</label>
              <select
                value={adjustType}
                onChange={(e) => setAdjustType(e.target.value as any)}
                className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white"
              >
                <option value="CYCLE_SURPLUS">Cycle Count Surplus (+Qty)</option>
                <option value="MANUAL_RESTOCK">Manual Restock (+Qty)</option>
                <option value="DAMAGE_WRITEOFF">Damaged Write-Off (-Qty)</option>
              </select>
            </div>
            <div>
              <label className="block font-bold text-slate-300 mb-1">Quantity (Units) *</label>
              <input
                type="number"
                min={1}
                required
                value={adjustQty}
                onChange={(e) => setAdjustQty(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white font-mono"
              />
            </div>
          </div>

          <div>
            <label className="block font-bold text-slate-300 mb-1">Supervisor Reason Note *</label>
            <input
              type="text"
              required
              value={adjustReason}
              onChange={(e) => setAdjustReason(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white"
            />
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 font-semibold cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold cursor-pointer"
            >
              Confirm Adjustment
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
