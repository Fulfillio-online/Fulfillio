'use client';

import React, { useState, useEffect } from 'react';
import { CheckCircle2, AlertTriangle, Plus, Minus, Package, Clock, ShieldCheck } from 'lucide-react';
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
    finalBin: string,
    acceptStockNow?: boolean
  ) => void;
}

export function ApprovalActionModal({
  isOpen,
  onClose,
  approvalData,
  bins,
  onConfirm,
}: ApprovalActionModalProps) {
  // Operational Approval Mode:
  // CATALOG_ONLY = Approve product catalog spec. Stock remains 0 until physical items arrive. Merchant cannot order yet.
  // ACCEPT_STOCK_NOW = Physical goods already arrived at dock. Count & slot into bin immediately.
  const [approvalType, setApprovalType] = useState<'CATALOG_ONLY' | 'ACCEPT_STOCK_NOW'>('CATALOG_ONLY');
  const [approvalQty, setApprovalQty] = useState<number | ''>(50);
  const [approvalSelectedBin, setApprovalSelectedBin] = useState<string>('A-01-02');

  const initializedRef = React.useRef<string | null>(null);

  useEffect(() => {
    if (isOpen && approvalData) {
      if (initializedRef.current !== approvalData.product.id) {
        initializedRef.current = approvalData.product.id;
        setApprovalType('CATALOG_ONLY');
        setApprovalQty(approvalData.product.stock || 50);
        setApprovalSelectedBin(approvalData.selectedBin || bins[0]?.code || 'A-01-02');
      }
    } else if (!isOpen) {
      initializedRef.current = null;
    }
  }, [isOpen, approvalData?.product?.id]);

  if (!approvalData) return null;

  const isApprove = approvalData.mode === 'APPROVE';

  const handleDecrement = () => {
    setApprovalQty((prev) => {
      const current = typeof prev === 'number' ? prev : 1;
      return Math.max(1, current - 5);
    });
  };

  const handleIncrement = () => {
    setApprovalQty((prev) => {
      const current = typeof prev === 'number' ? prev : 0;
      return current + 5;
    });
  };

  const handleConfirm = () => {
    if (!isApprove) {
      onConfirm('REJECT', approvalData.product, 0, approvalSelectedBin || 'A-01-02', false);
      onClose();
      return;
    }

    // Step 1 always moves the product to the APPROVED stage (0 stored stock until warehouse receives physical goods)
    onConfirm(
      'APPROVE',
      approvalData.product,
      0,
      approvalSelectedBin || 'A-01-02',
      false
    );
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isApprove ? 'Accept & Approve Product Request' : 'Reject Product Submission'}
      size="md"
    >
      <div className="space-y-4">
        {/* Header Alert */}
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
                ? `Approve store request for "${approvalData.product.title}" from ${approvalData.product.merchantName} (${approvalData.product.merchantCode}). This moves the product to the Approved stage so the merchant can send their physical shipment to the warehouse.`
                : `Are you sure you want to reject "${approvalData.product.title}" (${approvalData.product.fullSku}) submitted by ${approvalData.product.merchantName}?`}
            </p>
          </div>
        </div>

        {/* Product Card */}
        <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-navy-950 border border-slate-200 dark:border-white/10 flex items-center gap-3">
          <img
            src={approvalData.product.imageUrl || '/placeholder.png'}
            alt={approvalData.product.title}
            className="w-12 h-12 rounded-xl object-cover border border-slate-200 dark:border-white/10 shrink-0"
          />
          <div className="text-xs space-y-0.5 min-w-0 flex-1">
            <div className="font-bold text-navy-800 dark:text-white truncate">
              {approvalData.product.title}
            </div>
            <div className="tabular-nums font-mono text-orange-600 dark:text-orange-400 text-[11px]">
              {approvalData.product.fullSku}
            </div>
            <div className="text-slate-600 dark:text-slate-300">
              Reserved Bin:{' '}
              <strong className="text-orange-700 dark:text-orange-300 tabular-nums">
                {approvalSelectedBin}
              </strong>
            </div>
          </div>
        </div>

        {isApprove && (
          <div className="space-y-4 pt-1">
            <div className="p-3 rounded-xl bg-orange-500/10 border border-orange-500/30 flex items-start gap-3">
              <Clock className="w-4 h-4 text-orange-600 shrink-0 mt-0.5" />
              <div className="text-xs">
                <span className="font-bold text-slate-900 dark:text-white block">
                  Stage 1: Product Approval (Awaiting Physical Stock)
                </span>
                <p className="text-slate-500 dark:text-slate-400 mt-1 leading-relaxed text-[11px]">
                  Changes status to <strong>Approved</strong> in PostgreSQL. Once the merchant sends the product to the warehouse and it arrives, click <strong>Product Stock</strong> to accept the goods and change the status to <strong>Stock Stored</strong>.
                </p>
              </div>
            </div>

            {/* Target Bin */}
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-200 mb-1.5">
                Reserved Warehouse Storage Bin *
              </label>
              <select
                value={approvalSelectedBin}
                onChange={(e) => setApprovalSelectedBin(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-navy-950 border border-slate-300 dark:border-white/15 text-xs font-bold text-navy-800 dark:text-slate-100 focus:outline-none focus:border-orange-500 cursor-pointer"
              >
                {bins.map((b) => (
                  <option key={b.code} value={b.code}>
                    Bin {b.code} — {b.zone} ({b.description || 'Fulfillment Bay'})
                  </option>
                ))}
              </select>
            </div>
          </div>
        )}

        <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-200 dark:border-white/10">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-navy-800 hover:bg-slate-200 dark:hover:bg-navy-700 text-xs font-semibold text-slate-700 dark:text-slate-200 cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            className={`px-5 py-2.5 rounded-xl text-xs font-bold text-white shadow-lg cursor-pointer transition-all active:scale-[0.98] ${
              isApprove
                ? 'bg-orange-600 hover:bg-orange-500 shadow-orange-500/25'
                : 'bg-rose-600 hover:bg-rose-500 shadow-rose-600/25'
            }`}
          >
            {!isApprove ? 'Confirm Reject' : 'Accept & Approve Product'}
          </button>
        </div>
      </div>
    </Modal>
  );
}
