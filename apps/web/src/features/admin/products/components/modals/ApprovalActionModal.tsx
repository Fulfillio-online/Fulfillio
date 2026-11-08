'use client';

import React, { useState, useEffect } from 'react';
import { CheckCircle2, AlertTriangle, Plus, Minus } from 'lucide-react';
import { Modal } from '@/components/admin/AdminModal';
import { WarehouseBin, WarehouseProductItem } from '../../types';

interface ApprovalActionModalProps {
  isOpen: boolean;
  onClose: () => void;
  approvalData: {
    mode: 'APPROVE' | 'REJECT';
    product: WarehouseProductItem;
    selectedBin: string;
  } | null;
  bins: WarehouseBin[];
  onConfirm: (
    mode: 'APPROVE' | 'REJECT',
    product: WarehouseProductItem,
    finalQty: number,
    finalBin: string
  ) => void;
}

export function ApprovalActionModal({
  isOpen,
  onClose,
  approvalData,
  bins,
  onConfirm,
}: ApprovalActionModalProps) {
  const [approvalQty, setApprovalQty] = useState<number | ''>(50);
  const [approvalSelectedBin, setApprovalSelectedBin] = useState<string>('A-01-02');

  useEffect(() => {
    if (approvalData) {
      setApprovalQty(approvalData.product.stock ?? 50);
      setApprovalSelectedBin(approvalData.selectedBin || bins[0]?.code || 'A-01-02');
    }
  }, [approvalData, bins]);

  if (!approvalData) return null;

  const isApprove = approvalData.mode === 'APPROVE';

  const handleDecrement = () => {
    setApprovalQty((prev) => {
      const current = typeof prev === 'number' ? prev : 1;
      return Math.max(1, current - 1);
    });
  };

  const handleIncrement = () => {
    setApprovalQty((prev) => {
      const current = typeof prev === 'number' ? prev : 0;
      return current + 1;
    });
  };

  const handleConfirm = () => {
    const finalQty = typeof approvalQty === 'number' && approvalQty > 0 ? approvalQty : 1;
    onConfirm(
      approvalData.mode,
      approvalData.product,
      finalQty,
      approvalSelectedBin || 'A-01-02'
    );
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isApprove ? 'Confirm Product Approval & Bin Assignment' : 'Confirm Rejecting Product Submission'}
      size="md"
    >
      <div className="space-y-4">
        <div className="flex items-start gap-3.5">
          <div
            className={`w-11 h-11 rounded-2xl flex items-center justify-center shrink-0 border ${
              isApprove
                ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-600 dark:text-emerald-400'
                : 'bg-rose-500/15 border-rose-500/30 text-rose-600 dark:text-rose-400'
            }`}
          >
            {isApprove ? <CheckCircle2 className="w-6 h-6" /> : <AlertTriangle className="w-6 h-6" />}
          </div>
          <div>
            <p className="text-xs sm:text-sm text-slate-700 dark:text-slate-200 leading-relaxed">
              {isApprove
                ? `Confirm approving "${approvalData.product.title}" under ${approvalData.product.merchantCode} (${approvalData.product.merchantName}) and storing in Bin ${approvalSelectedBin}?`
                : `Are you sure you want to reject "${approvalData.product.title}" (${approvalData.product.fullSku}) submitted by ${approvalData.product.merchantName}?`}
            </p>
          </div>
        </div>

        <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-navy-950 border border-slate-200 dark:border-white/10 flex items-center gap-3">
          <img
            src={approvalData.product.imageUrl}
            alt={approvalData.product.title}
            className="w-12 h-12 rounded-xl object-cover border border-slate-200 dark:border-white/10 shrink-0"
          />
          <div className="text-xs space-y-0.5">
            <div className="font-bold text-navy-800 dark:text-white">{approvalData.product.title}</div>
            <div className="tabular-nums text-orange-600 dark:text-orange-400">{approvalData.product.fullSku}</div>
            <div className="text-slate-600 dark:text-slate-300">
              Merchant Declared Stock: {approvalData.product.stock} pcs · Target Bin:{' '}
              <strong className="text-orange-700 dark:text-orange-300 tabular-nums">{approvalSelectedBin}</strong>
            </div>
          </div>
        </div>

        {isApprove && (
          <div className="space-y-3 pt-1">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-200 mb-1.5">
                Received &amp; Approved Quantity (Units) *
              </label>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleDecrement}
                  className="w-10 h-10 rounded-xl bg-white dark:bg-navy-900 hover:bg-navy-700 dark:hover:bg-navy-600 border border-slate-300 dark:border-white/15 text-navy-800 dark:text-slate-100 hover:text-white flex items-center justify-center font-bold text-base transition-colors shrink-0 cursor-pointer select-none"
                  title="Decrease quantity"
                >
                  <Minus className="w-4 h-4" />
                </button>
                <div className="relative flex-1">
                  <input
                    type="number"
                    min={1}
                    value={approvalQty}
                    placeholder="Enter quantity"
                    onChange={(e) => {
                      const val = e.target.value;
                      if (val === '') {
                        setApprovalQty('');
                      } else {
                        const parsed = parseInt(val, 10);
                        if (!isNaN(parsed)) {
                          setApprovalQty(Math.max(0, parsed));
                        }
                      }
                    }}
                    onBlur={() => {
                      if (approvalQty === '' || approvalQty < 1) {
                        setApprovalQty(1);
                      }
                    }}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-navy-950 border border-slate-300 dark:border-white/15 text-sm tabular-nums font-bold text-orange-600 dark:text-orange-400 focus:outline-none focus:border-orange-500 pr-12"
                  />
                  <span className="absolute right-3.5 top-2.5 text-xs text-slate-500 dark:text-slate-400 font-semibold pointer-events-none select-none">
                    pcs
                  </span>
                </div>
                <button
                  type="button"
                  onClick={handleIncrement}
                  className="w-10 h-10 rounded-xl bg-white dark:bg-navy-900 hover:bg-navy-700 dark:hover:bg-navy-600 border border-slate-300 dark:border-white/15 text-navy-800 dark:text-slate-100 hover:text-white flex items-center justify-center font-bold text-base transition-colors shrink-0 cursor-pointer select-none"
                  title="Increase quantity"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>
              <span className="text-xs text-slate-600 dark:text-slate-300 mt-1 block">
                Merchant submitted: <strong>{approvalData.product.stock} pcs</strong>. You can edit/verify the actual physical received count.
              </span>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-200 mb-1.5">Assign Storage Bin *</label>
              <select
                value={approvalSelectedBin}
                onChange={(e) => setApprovalSelectedBin(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-navy-950 border border-slate-300 dark:border-white/15 text-sm tabular-nums font-bold text-orange-700 dark:text-orange-300 focus:outline-none focus:border-orange-500"
              >
                {bins.map((b) => (
                  <option key={b.code} value={b.code}>
                    {b.code} — {b.zone} ({b.description})
                  </option>
                ))}
              </select>
            </div>
          </div>
        )}

        <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-slate-200 dark:border-white/10">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-navy-800 hover:bg-slate-200 dark:hover:bg-navy-700 text-xs font-semibold text-slate-700 dark:text-slate-200"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            className={`px-4 py-2 rounded-xl text-xs font-bold text-white shadow-lg cursor-pointer ${
              isApprove
                ? 'bg-orange-600 hover:bg-orange-700 shadow-orange-500/25'
                : 'bg-rose-600 hover:bg-rose-500 shadow-rose-600/25'
            }`}
          >
            {isApprove ? `Confirm & Store ${approvalQty} pcs in ${approvalSelectedBin}` : 'Confirm Reject'}
          </button>
        </div>
      </div>
    </Modal>
  );
}
