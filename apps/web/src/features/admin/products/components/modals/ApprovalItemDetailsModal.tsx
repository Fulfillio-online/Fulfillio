'use client';

import React from 'react';
import { Package, Truck, MapPin, Store, Tag, Calendar, Layers, CheckCircle2, PackageMinus } from 'lucide-react';
import { Modal } from '@/components/admin/AdminModal';
import { UnifiedApprovalItem } from '../../types';

interface ApprovalItemDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  item: UnifiedApprovalItem | null;
}

export function ApprovalItemDetailsModal({
  isOpen,
  onClose,
  item,
}: ApprovalItemDetailsModalProps) {
  if (!item) return null;

  const isRestock = item.approvalType === 'RESTOCK';
  const isWithdrawal = item.approvalType === 'WITHDRAWAL';
  const isNewProduct = item.approvalType === 'NEW_PRODUCT';

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={
        isWithdrawal
          ? 'Stock Withdrawal & Recall Request Details'
          : isRestock
          ? 'Inbound Stock Restock Submission Details'
          : 'New Inbound Product Submission Details'
      }
      size="md"
    >
      <div className="space-y-4">
        {/* Top Badges */}
        <div className="flex flex-wrap items-center justify-between gap-2 pb-2 border-b border-slate-200 dark:border-white/10">
          <div className="flex items-center gap-2">
            {isWithdrawal ? (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-rose-500/15 text-rose-700 dark:text-rose-300 border border-rose-500/30">
                📤 Stock Withdrawal (-{item.inboundQty} units)
              </span>
            ) : isRestock ? (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-amber-500/15 text-amber-700 dark:text-amber-300 border border-amber-500/30">
                🔄 Existing SKU Restock (+{item.inboundQty} units)
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-indigo-500/15 text-indigo-700 dark:text-indigo-300 border border-indigo-500/30">
                ✨ New Catalog Product Submission
              </span>
            )}
            <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-slate-100 dark:bg-navy-800 text-slate-700 dark:text-slate-300">
              {item.category}
            </span>
          </div>

          <div className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1">
            <Calendar className="w-3.5 h-3.5" />
            <span>Submitted {item.submittedAt}</span>
          </div>
        </div>

        {/* Product Media & SKU */}
        <div className="flex items-start gap-4 p-3.5 rounded-xl bg-slate-50 dark:bg-navy-950 border border-slate-200 dark:border-white/10">
          <img
            src={item.imageUrl}
            alt={item.title}
            className="w-16 h-16 rounded-xl object-cover border border-slate-200 dark:border-white/10 shrink-0"
          />
          <div className="space-y-1 min-w-0 flex-1">
            <h4 className="font-bold text-sm text-navy-800 dark:text-white leading-snug">
              {item.title}
            </h4>
            <div className="font-mono text-xs font-bold text-orange-600 dark:text-orange-400">
              {item.sku}
            </div>
            {(item.color || item.size) && (
              <div className="text-xs text-slate-600 dark:text-slate-300 flex items-center gap-2">
                {item.color && <span>Color: <strong>{item.color}</strong></span>}
                {item.size && <span>Size: <strong>{item.size}</strong></span>}
              </div>
            )}
          </div>
        </div>

        {/* Details Grid */}
        <div className="grid grid-cols-2 gap-3 text-xs">
          <div className="p-3 rounded-xl bg-slate-100 dark:bg-navy-900/50 border border-slate-200 dark:border-white/10 space-y-1">
            <div className="text-slate-500 dark:text-slate-400 flex items-center gap-1.5 font-semibold text-[11px]">
              <Store className="w-3.5 h-3.5" />
              <span>Merchant Attribution</span>
            </div>
            <div className="font-bold text-navy-800 dark:text-white">{item.merchantName}</div>
            <div className="text-[11px] text-slate-500 dark:text-slate-400">{item.merchantCode}</div>
          </div>

          <div className="p-3 rounded-xl bg-slate-100 dark:bg-navy-900/50 border border-slate-200 dark:border-white/10 space-y-1">
            <div className="text-slate-500 dark:text-slate-400 flex items-center gap-1.5 font-semibold text-[11px]">
              <MapPin className="w-3.5 h-3.5" />
              <span>{isWithdrawal ? 'Pick Location' : 'Storage Bin'}</span>
            </div>
            <div className="font-bold text-orange-600 dark:text-orange-400">
              {isNewProduct ? 'Unassigned (Pending QC)' : `Bin ${item.binCode}`}
            </div>
            <div className="text-[11px] text-slate-500 dark:text-slate-400">
              {isNewProduct ? 'Assigned upon approval' : 'Warehouse shelf slot'}
            </div>
          </div>
        </div>

        {/* Quantities Comparison */}
        <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-navy-950 border border-slate-200 dark:border-white/10 text-xs">
          <div className="font-bold text-navy-800 dark:text-white mb-2">
            Inventory Quantities
          </div>
          <div className="grid grid-cols-3 gap-2 text-center">
            <div className="p-2 rounded-lg bg-white dark:bg-navy-900 border border-slate-200 dark:border-white/10">
              <div className="text-[10px] text-slate-500 dark:text-slate-400 font-bold uppercase">
                Current Stock
              </div>
              <div
                className={`text-sm font-extrabold mt-0.5 ${
                  isRestock && item.currentStock === 0
                    ? 'text-rose-600 dark:text-rose-400'
                    : 'text-navy-800 dark:text-white'
                }`}
              >
                {item.currentStock} pcs
              </div>
            </div>

            <div
              className={`p-2 rounded-lg border ${
                isWithdrawal
                  ? 'bg-rose-500/10 border-rose-500/20 text-rose-700 dark:text-rose-400'
                  : 'bg-emerald-500/10 border-emerald-500/20 text-emerald-700 dark:text-emerald-400'
              }`}
            >
              <div className="text-[10px] font-bold uppercase">
                {isWithdrawal ? 'Withdrawal' : isRestock ? 'Inbound Restock' : 'Initial Stock'}
              </div>
              <div className="text-sm font-extrabold mt-0.5">
                {isWithdrawal ? `-${item.inboundQty}` : `+${item.inboundQty}`} pcs
              </div>
            </div>

            <div className="p-2 rounded-lg bg-white dark:bg-navy-900 border border-slate-200 dark:border-white/10">
              <div className="text-[10px] text-slate-500 dark:text-slate-400 font-bold uppercase">
                Projected Live Stock
              </div>
              <div className="text-sm font-extrabold text-navy-800 dark:text-white mt-0.5">
                {isWithdrawal
                  ? Math.max(0, item.currentStock - item.inboundQty)
                  : item.currentStock + item.inboundQty}{' '}
                pcs
              </div>
            </div>
          </div>
        </div>

        {/* Note / Dispatch Ref */}
        {(item.note || item.trackingRef) && (
          <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-xs text-slate-700 dark:text-slate-300 space-y-1">
            {item.note && (
              <div>
                <strong className="text-amber-700 dark:text-amber-400">Request Reason / Note: </strong>
                {item.note}
              </div>
            )}
            {item.trackingRef && (
              <div className="flex items-center gap-1.5 text-slate-500 dark:text-slate-400">
                <Truck className="w-3.5 h-3.5 text-amber-500" />
                <span>Reference: {item.trackingRef}</span>
              </div>
            )}
          </div>
        )}

        <div className="flex justify-end pt-2">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-navy-800 hover:bg-slate-200 dark:hover:bg-navy-700 text-xs font-bold text-navy-800 dark:text-slate-100 transition-colors cursor-pointer"
          >
            Close Details
          </button>
        </div>
      </div>
    </Modal>
  );
}
