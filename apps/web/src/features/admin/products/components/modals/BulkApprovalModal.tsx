'use client';

import React, { useState, useEffect } from 'react';
import { CheckCircle2, MapPin, Package, ArrowRight, Layers } from 'lucide-react';
import { Modal } from '@/components/admin/AdminModal';
import { WarehouseBin, WarehouseProductItem } from '../../types';

export interface BulkSlotAssignment {
  productId: string;
  binCode: string;
  qty: number;
}

interface BulkApprovalModalProps {
  isOpen: boolean;
  onClose: () => void;
  products: WarehouseProductItem[];
  bins: WarehouseBin[];
  onConfirm: (assignments: BulkSlotAssignment[]) => void;
}

export function BulkApprovalModal({
  isOpen,
  onClose,
  products,
  bins,
  onConfirm,
}: BulkApprovalModalProps) {
  const [assignments, setAssignments] = useState<Record<string, { binCode: string; qty: number }>>({});
  const [globalBin, setGlobalBin] = useState<string>('');

  useEffect(() => {
    if (products.length > 0) {
      const initial: Record<string, { binCode: string; qty: number }> = {};
      products.forEach((p, idx) => {
        // Distribute or pick default bin
        const defaultBin = p.binCode && p.binCode !== 'Pending Approval' && p.binCode !== 'Unassigned'
          ? p.binCode
          : bins[idx % Math.max(1, bins.length)]?.code || 'A-01-02';
        initial[p.id] = {
          binCode: defaultBin,
          qty: typeof p.stock === 'number' && p.stock > 0 ? p.stock : 50,
        };
      });
      setAssignments(initial);
      setGlobalBin(bins[0]?.code || 'A-01-02');
    }
  }, [products, bins]);

  if (!isOpen || products.length === 0) return null;

  const handleUpdateBin = (productId: string, binCode: string) => {
    setAssignments((prev) => ({
      ...prev,
      [productId]: {
        ...prev[productId],
        binCode,
      },
    }));
  };

  const handleUpdateQty = (productId: string, qty: number) => {
    setAssignments((prev) => ({
      ...prev,
      [productId]: {
        ...prev[productId],
        qty: Math.max(1, qty),
      },
    }));
  };

  const handleApplyGlobalBin = () => {
    if (!globalBin) return;
    setAssignments((prev) => {
      const next = { ...prev };
      Object.keys(next).forEach((id) => {
        next[id] = {
          ...next[id],
          binCode: globalBin,
        };
      });
      return next;
    });
  };

  const handleConfirmAll = () => {
    const result: BulkSlotAssignment[] = products.map((p) => ({
      productId: p.id,
      binCode: assignments[p.id]?.binCode || bins[0]?.code || 'A-01-02',
      qty: assignments[p.id]?.qty || p.stock || 50,
    }));
    onConfirm(result);
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Bulk Approve & Slot Products to Bins"
    >
      <div className="space-y-4 max-w-2xl">
        <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300">
          You are approving <strong className="text-navy-900 dark:text-white font-bold">{products.length} product(s)</strong>.
          Assign designated warehouse shelf bins and verify initial stock intake for each product before publishing to catalog.
        </p>

        {/* Quick Bulk Tool: Apply Same Bin to All */}
        <div className="flex flex-wrap items-center justify-between gap-2.5 p-3 rounded-xl bg-orange-50/60 dark:bg-orange-950/20 border border-orange-200/80 dark:border-orange-500/20 text-xs">
          <div className="flex items-center gap-2 text-orange-900 dark:text-orange-200 font-semibold">
            <Layers className="w-4 h-4 text-orange-600 dark:text-orange-400" />
            <span>Quick Shortcut: Assign all to same bin</span>
          </div>

          <div className="flex items-center gap-2">
            <select
              value={globalBin}
              onChange={(e) => setGlobalBin(e.target.value)}
              aria-label="Select global bin"
              className="px-2.5 py-1.5 rounded-lg bg-white dark:bg-navy-900 border border-orange-300 dark:border-orange-500/30 text-xs font-mono font-bold text-navy-800 dark:text-slate-100 focus:outline-none focus:border-orange-500 cursor-pointer"
            >
              {bins.map((b) => (
                <option key={b.code} value={b.code}>
                  Bin {b.code} ({b.zone})
                </option>
              ))}
            </select>

            <button
              type="button"
              onClick={handleApplyGlobalBin}
              className="px-3 py-1.5 rounded-lg text-xs font-bold bg-orange-600 hover:bg-orange-500 text-white transition-all cursor-pointer shadow-xs"
            >
              Apply to All
            </button>
          </div>
        </div>

        {/* Products Slotting List Table */}
        <div className="border border-slate-200 dark:border-white/10 rounded-xl overflow-hidden max-h-[380px] overflow-y-auto divide-y divide-slate-100 dark:divide-white/5">
          {products.map((p) => {
            const currentAssignment = assignments[p.id] || {
              binCode: bins[0]?.code || 'A-01-02',
              qty: p.stock || 50,
            };

            return (
              <div
                key={p.id}
                className="p-3 sm:p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white dark:bg-navy-900 hover:bg-slate-50/60 dark:hover:bg-navy-800/40 transition-colors"
              >
                {/* Product Summary */}
                <div className="flex items-center gap-3 min-w-0 flex-1">
                  <img
                    src={p.imageUrl}
                    alt={p.title}
                    className="w-10 h-10 rounded-lg object-cover border border-slate-200 dark:border-white/10 shrink-0"
                  />
                  <div className="min-w-0">
                    <p className="font-bold text-navy-900 dark:text-white text-xs truncate">
                      {p.title}
                    </p>
                    <div className="flex items-center gap-2 text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                      <span className="font-semibold text-orange-600 dark:text-orange-400">
                        {p.merchantName} ({p.merchantCode})
                      </span>
                      <span>·</span>
                      <span className="font-medium">{p.category}</span>
                    </div>
                  </div>
                </div>

                {/* Stock Qty & Bin Selector Controls */}
                <div className="flex items-center gap-2.5 shrink-0">
                  {/* Intake Qty Input */}
                  <div className="flex items-center gap-1.5">
                    <span className="text-[11px] text-slate-500 font-medium">Qty:</span>
                    <input
                      type="number"
                      min={1}
                      value={currentAssignment.qty}
                      onChange={(e) => handleUpdateQty(p.id, Number(e.target.value))}
                      aria-label={`Intake quantity for ${p.title}`}
                      className="w-16 px-2 py-1.5 rounded-lg bg-slate-50 dark:bg-navy-950 border border-slate-200 dark:border-white/10 text-xs font-bold text-navy-900 dark:text-white text-center focus:outline-none focus:border-orange-500 tabular-nums"
                    />
                  </div>

                  {/* Bin Selector */}
                  <div className="flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-orange-600 dark:text-orange-400 shrink-0" />
                    <select
                      value={currentAssignment.binCode}
                      onChange={(e) => handleUpdateBin(p.id, e.target.value)}
                      aria-label={`Assign bin for ${p.title}`}
                      className="px-2.5 py-1.5 rounded-lg bg-slate-50 dark:bg-navy-950 border border-slate-200 dark:border-white/15 text-xs font-mono font-bold text-orange-700 dark:text-orange-300 focus:outline-none focus:border-orange-500 cursor-pointer"
                    >
                      {bins.map((b) => (
                        <option key={b.code} value={b.code}>
                          Bin {b.code} ({b.zone})
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-white/10">
          <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">
            Total {products.length} product(s) ready for slotting
          </span>

          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-semibold border border-slate-200 dark:border-white/10 hover:bg-slate-100 dark:hover:bg-navy-800 text-slate-700 dark:text-slate-300 cursor-pointer"
            >
              Cancel
            </button>

            <button
              type="button"
              onClick={handleConfirmAll}
              className="px-4 py-2 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white flex items-center gap-1.5 shadow-md shadow-emerald-500/20 cursor-pointer transition-all active:scale-95"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>Confirm &amp; Slot All ({products.length})</span>
            </button>
          </div>
        </div>
      </div>
    </Modal>
  );
}
