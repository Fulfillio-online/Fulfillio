'use client';

import React, { useState } from 'react';
import { RotateCcw, AlertTriangle, CheckCircle2, ShieldCheck, MapPin, FileText, Truck, Printer } from 'lucide-react';
import { Modal } from '@/components/admin/AdminModal';
import { StockWithdrawalRequest } from '@/features/admin/products/types';

interface ReturnApprovalModalProps {
  isOpen: boolean;
  onClose: () => void;
  withdrawal: StockWithdrawalRequest | null;
  onConfirm: (withdrawal: StockWithdrawalRequest, approvedQty: number) => void;
}

export function ReturnApprovalModal({
  isOpen,
  onClose,
  withdrawal,
  onConfirm,
}: ReturnApprovalModalProps) {
  const [approvedQty, setApprovedQty] = useState<number>(10);

  React.useEffect(() => {
    if (withdrawal) {
      setApprovedQty(withdrawal.withdrawQty || 10);
    }
  }, [withdrawal]);

  if (!withdrawal) return null;

  const currentStock = withdrawal.currentStock ?? 0;
  const finalWithdrawQty = Math.min(currentStock, Math.max(1, approvedQty));
  const projectedRemainingStock = Math.max(0, currentStock - finalWithdrawQty);

  const handleConfirm = () => {
    onConfirm(withdrawal, finalWithdrawQty);
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Approve Merchant Product Return & Issue Gate Pass"
      size="md"
    >
      <div className="space-y-4">
        {/* Warning / Policy Banner */}
        <div className="flex items-start gap-3 p-3.5 rounded-xl bg-orange-500/10 border border-orange-500/20 text-xs text-orange-800 dark:text-orange-300">
          <RotateCcw className="w-5 h-5 text-orange-600 dark:text-orange-400 shrink-0 mt-0.5" />
          <div className="leading-relaxed">
            <strong className="block font-bold text-orange-900 dark:text-orange-200 mb-0.5">
              Stock Withdrawal & Return Protocol:
            </strong>
            Merchant <strong>{withdrawal.merchantName} ({withdrawal.merchantCode})</strong> has requested to withdraw{' '}
            <span className="font-bold underline">{withdrawal.withdrawQty} units</span> from warehouse stock back to their store. Approving this will generate an official Delivery Gate Pass and deduct live stock.
          </div>
        </div>

        {/* Product Card */}
        <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-navy-950 border border-slate-200 dark:border-white/10 flex items-center gap-3">
          <img
            src={withdrawal.imageUrl}
            alt={withdrawal.productTitle}
            className="w-14 h-14 rounded-xl object-cover border border-slate-200 dark:border-white/10 shrink-0"
          />
          <div className="text-xs space-y-1 min-w-0 flex-1">
            <div className="font-bold text-navy-800 dark:text-white truncate">
              {withdrawal.productTitle}
            </div>
            <div className="tabular-nums font-mono text-[11px] text-orange-600 dark:text-orange-400 font-bold">
              {withdrawal.productSku}
            </div>
            <div className="flex items-center gap-2 text-[11px] text-slate-500 dark:text-slate-400">
              <span>Category: {withdrawal.category}</span>
              <span>•</span>
              <span>Current Bin: <strong className="text-navy-900 dark:text-white font-mono">{withdrawal.binCode || 'A-01-04'}</strong></span>
            </div>
          </div>
        </div>

        {/* Stock Deduction Math Calculation */}
        <div className="grid grid-cols-3 gap-2 p-3 rounded-xl bg-slate-100 dark:bg-navy-900/60 border border-slate-200 dark:border-white/10 text-center text-xs">
          <div>
            <div className="text-slate-500 dark:text-slate-400 text-[10px] uppercase font-bold tracking-wider">
              Current Stock
            </div>
            <div className="text-sm font-extrabold tabular-nums mt-0.5 text-navy-800 dark:text-white font-mono">
              {currentStock}
            </div>
          </div>
          <div>
            <div className="text-orange-600 dark:text-orange-400 text-[10px] uppercase font-bold tracking-wider">
              Return / Recall
            </div>
            <div className="text-sm font-extrabold tabular-nums mt-0.5 text-orange-600 dark:text-orange-400 font-mono">
              -{finalWithdrawQty}
            </div>
          </div>
          <div>
            <div className="text-slate-500 dark:text-slate-400 text-[10px] uppercase font-bold tracking-wider">
              Remaining Stock
            </div>
            <div className="text-sm font-extrabold tabular-nums mt-0.5 text-emerald-600 dark:text-emerald-400 font-mono">
              {projectedRemainingStock}
            </div>
          </div>
        </div>

        {/* Return Details */}
        <div className="p-3 rounded-xl bg-slate-50 dark:bg-navy-950 border border-slate-200 dark:border-white/10 space-y-2 text-xs">
          <div className="flex items-start gap-2">
            <FileText className="w-4 h-4 text-orange-500 shrink-0 mt-0.5" />
            <div>
              <span className="text-slate-400 block text-[11px]">Reason for Return:</span>
              <span className="font-semibold text-navy-900 dark:text-white">
                {withdrawal.reason || 'Merchant stock recall for shop retail demand'}
              </span>
            </div>
          </div>

          {withdrawal.destination && (
            <div className="flex items-start gap-2">
              <MapPin className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
              <div>
                <span className="text-slate-400 block text-[11px]">Destination Outlet / Address:</span>
                <span className="font-semibold text-navy-900 dark:text-white">
                  {withdrawal.destination}
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Gate Pass Preview */}
        <div className="p-3 rounded-xl bg-slate-900 text-white border border-slate-800 space-y-1.5 text-xs font-mono">
          <div className="flex items-center justify-between text-slate-400 text-[11px]">
            <span>OFFICIAL DELIVERY GATE PASS</span>
            <span className="text-emerald-400">READY TO ISSUE</span>
          </div>
          <div className="text-sm font-bold text-orange-400">
            GP-{new Date().getFullYear()}-{Math.floor(1000 + Math.random() * 9000)}
          </div>
          <div className="text-[11px] text-slate-400">
            Carrier: Merchant Outlet Transfer • Authorized by Warehouse Controller
          </div>
        </div>

        {/* Actions */}
        <div className="pt-3 flex items-center justify-end gap-2.5 border-t border-slate-200 dark:border-white/10">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-navy-800 transition-colors cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            className="px-5 py-2.5 rounded-xl bg-orange-600 hover:bg-orange-500 text-white text-xs font-bold transition-all shadow-md shadow-orange-500/20 flex items-center gap-1.5 cursor-pointer"
          >
            <ShieldCheck className="w-4 h-4" />
            <span>Approve Return &amp; Issue Gate Pass</span>
          </button>
        </div>
      </div>
    </Modal>
  );
}
