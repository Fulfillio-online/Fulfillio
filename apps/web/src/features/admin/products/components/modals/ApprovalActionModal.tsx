'use client';

import React, { useState, useEffect, useMemo } from 'react';
import {
  CheckCircle2,
  AlertTriangle,
  Package,
  Layers,
  AlertOctagon,
  Check,
  RotateCcw,
} from 'lucide-react';
import { Modal } from '@/components/admin/AdminModal';
import { WarehouseBin, WarehouseProductItem } from '../../types';

interface VariantQCItem {
  id: string;
  sku: string;
  color?: string;
  size?: string;
  declaredStock: number;
  acceptedStock: number;
}

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
    acceptStockNow?: boolean,
    rejectionReason?: string,
    variantStocks?: Record<string, number>
  ) => void;
}

export function ApprovalActionModal({
  isOpen,
  onClose,
  approvalData,
  bins,
  onConfirm,
}: ApprovalActionModalProps) {
  const [approvalSelectedBin, setApprovalSelectedBin] = useState<string>('A-01-02');
  const [variantsQC, setVariantsQC] = useState<VariantQCItem[]>([]);
  const [qcNotes, setQcNotes] = useState<string>('');
  const [rejectionReason, setRejectionReason] = useState<string>('');
  const [rejectionError, setRejectionError] = useState<string | null>(null);

  const initializedRef = React.useRef<string | null>(null);

  useEffect(() => {
    if (isOpen && approvalData) {
      if (initializedRef.current !== approvalData.product.id) {
        initializedRef.current = approvalData.product.id;
        setRejectionReason('');
        setRejectionError(null);
        setQcNotes('');

        const existingBin =
          approvalData.product.binCode &&
          approvalData.product.binCode !== 'Pending Approval' &&
          approvalData.product.binCode !== 'Assigned on intake'
            ? approvalData.product.binCode
            : approvalData.selectedBin || bins[0]?.code || 'A-01-02';
        setApprovalSelectedBin(existingBin);

        // Initialize variant QC list from product variants or fallback to standard product stock
        if (approvalData.product.variantsList && approvalData.product.variantsList.length > 0) {
          setVariantsQC(
            approvalData.product.variantsList.map((v) => ({
              id: v.id || v.variantSku,
              sku: v.variantSku || approvalData.product.fullSku,
              color: v.color,
              size: v.size,
              declaredStock: Math.max(0, Number(v.stock) || 0),
              acceptedStock: Math.max(0, Number(v.stock) || 0),
            }))
          );
        } else {
          const initialStock = Math.max(0, Number(approvalData.product.stock) || 50);
          setVariantsQC([
            {
              id: approvalData.product.id,
              sku: approvalData.product.fullSku,
              color: approvalData.product.color || 'Standard',
              size: approvalData.product.size || 'Standard',
              declaredStock: initialStock,
              acceptedStock: initialStock,
            },
          ]);
        }
      }
    } else if (!isOpen) {
      initializedRef.current = null;
    }
  }, [isOpen, approvalData?.product?.id, bins]);

  const totalDeclared = useMemo(
    () => variantsQC.reduce((sum, v) => sum + v.declaredStock, 0),
    [variantsQC]
  );
  const totalAccepted = useMemo(
    () => variantsQC.reduce((sum, v) => sum + v.acceptedStock, 0),
    [variantsQC]
  );
  const totalProblemCount = Math.max(0, totalDeclared - totalAccepted);

  if (!approvalData) return null;

  const isApprove = approvalData.mode === 'APPROVE';
  const isDraftToPublish = (approvalData.product.stock || 0) > 0;

  const handleVariantStockChange = (key: string, val: number) => {
    const safeVal = Math.max(0, val);
    setVariantsQC((prev) =>
      prev.map((v) => (v.id === key || v.sku === key ? { ...v, acceptedStock: safeVal } : v))
    );
  };

  const handleResetAllToDeclared = () => {
    setVariantsQC((prev) => prev.map((v) => ({ ...v, acceptedStock: v.declaredStock })));
  };

  const handleConfirm = () => {
    if (!isApprove) {
      if (!rejectionReason.trim()) {
        setRejectionError('A rejection reason is strictly required to notify the merchant.');
        return;
      }
      setRejectionError(null);
      onConfirm(
        'REJECT',
        approvalData.product,
        0,
        approvalSelectedBin || 'A-01-02',
        false,
        rejectionReason.trim()
      );
      onClose();
      return;
    }

    const variantStocksMap: Record<string, number> = {};
    variantsQC.forEach((v) => {
      variantStocksMap[v.id] = v.acceptedStock;
      variantStocksMap[v.sku] = v.acceptedStock;
    });

    onConfirm(
      'APPROVE',
      approvalData.product,
      totalAccepted,
      approvalSelectedBin || 'A-01-02',
      true,
      undefined,
      variantStocksMap
    );
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={
        isApprove
          ? 'Approve Product & Verify Physical Stock'
          : isDraftToPublish
          ? 'Reject Publish Request (Return to Draft)'
          : 'Reject Product Submission'
      }
      size="lg"
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
                ? `Verify and accept warehouse intake stock for "${approvalData.product.title}" by ${approvalData.product.merchantName}. You can inspect each variant, adjust for damaged or missing units, and assign the storage bin.`
                : isDraftToPublish
                ? `Reject publish request for "${approvalData.product.title}" (${approvalData.product.fullSku})? Because ${approvalData.product.stock} pcs are already in warehouse, this returns the item to Draft without deleting stock.`
                : `Are you sure you want to reject "${approvalData.product.title}" (${approvalData.product.fullSku}) submitted by ${approvalData.product.merchantName}?`}
            </p>
          </div>
        </div>

        {/* Product Basic Info Banner */}
        <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-navy-950 border border-slate-200 dark:border-white/10 flex items-center gap-3">
          <img
            src={approvalData.product.imageUrl || '/placeholder.png'}
            alt={approvalData.product.title}
            className="w-12 h-12 rounded-xl object-cover border border-slate-200 dark:border-white/10 shrink-0 bg-white dark:bg-navy-900"
          />
          <div className="text-xs space-y-0.5 min-w-0 flex-1">
            <div className="font-bold text-navy-800 dark:text-white truncate">
              {approvalData.product.title}
            </div>
            <div className="tabular-nums font-mono text-orange-600 dark:text-orange-400 text-[11px]">
              {approvalData.product.fullSku} · {approvalData.product.merchantName} ({approvalData.product.merchantCode})
            </div>
            <div className="flex items-center gap-2 text-[11px] text-slate-500 dark:text-slate-400">
              <span>Declared Price: <strong className="text-slate-700 dark:text-slate-200 font-mono font-bold">৳{approvalData.product.price}</strong></span>
              <span>·</span>
              <span>Merchant Declared Total: <strong className="text-navy-900 dark:text-white font-mono font-bold">{totalDeclared} pcs</strong></span>
            </div>
          </div>
        </div>

        {isApprove && (
          <div className="space-y-4 pt-1">
            {/* QC Inspection Summary Strip */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-navy-950/60 border border-slate-200 dark:border-white/10">
                <span className="text-[10px] uppercase font-bold text-slate-400 block">Merchant Declared</span>
                <span className="text-lg font-extrabold text-navy-900 dark:text-white font-mono">{totalDeclared} pcs</span>
              </div>
              <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
                <span className="text-[10px] uppercase font-bold text-emerald-600 dark:text-emerald-400 block">QC Accepted to Bin</span>
                <span className="text-lg font-extrabold text-emerald-600 dark:text-emerald-400 font-mono">{totalAccepted} pcs</span>
              </div>
              <div className={`p-3 rounded-xl border ${totalProblemCount > 0 ? 'bg-rose-500/10 border-rose-500/30' : 'bg-slate-50 dark:bg-navy-950/60 border-slate-200 dark:border-white/10'}`}>
                <span className="text-[10px] uppercase font-bold text-slate-400 block">Problematic / Rejected</span>
                <div className="flex items-center gap-1.5">
                  <span className={`text-lg font-extrabold font-mono ${totalProblemCount > 0 ? 'text-rose-600 dark:text-rose-400' : 'text-slate-400'}`}>
                    {totalProblemCount} pcs
                  </span>
                  {totalProblemCount > 0 && (
                    <span className="text-[10px] font-bold text-rose-500">QC Discrepancy</span>
                  )}
                </div>
              </div>
            </div>

            {/* Variant Stock Selection & Management Table */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                  <Layers className="h-3.5 w-3.5 text-orange-500" />
                  <span>Variant Intake &amp; Stock Verification ({variantsQC.length} Variants)</span>
                </label>
                {totalProblemCount > 0 && (
                  <button
                    type="button"
                    onClick={handleResetAllToDeclared}
                    className="text-[11px] text-orange-600 dark:text-orange-400 hover:underline flex items-center gap-1 font-semibold cursor-pointer"
                  >
                    <RotateCcw className="h-3 w-3" />
                    <span>Reset to Declared Stock</span>
                  </button>
                )}
              </div>

              <div className="rounded-xl border border-slate-200 dark:border-white/10 overflow-hidden max-h-60 overflow-y-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead className="bg-slate-100 dark:bg-navy-950 text-slate-500 dark:text-slate-400 font-bold sticky top-0 border-b border-slate-200 dark:border-white/10 select-none">
                    <tr>
                      <th className="py-2.5 px-3">Variant (Color / Size)</th>
                      <th className="py-2.5 px-3 text-center">Declared Stock</th>
                      <th className="py-2.5 px-3 text-center w-36">Accepted Stock</th>
                      <th className="py-2.5 px-3 text-right">QC Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-white/5">
                    {variantsQC.map((v) => {
                      const diff = v.declaredStock - v.acceptedStock;
                      const hasProblem = diff > 0;

                      return (
                        <tr key={v.id} className="hover:bg-slate-50/60 dark:hover:bg-navy-900/40 transition-colors">
                          <td className="py-2.5 px-3">
                            <span className="font-bold text-navy-900 dark:text-white block">
                              {v.color || 'Standard'} {v.size ? `/ ${v.size}` : ''}
                            </span>
                            <span className="font-mono text-[10px] text-slate-400 block">
                              {v.sku}
                            </span>
                          </td>
                          <td className="py-2.5 px-3 text-center font-mono text-slate-600 dark:text-slate-300 font-semibold">
                            {v.declaredStock} pcs
                          </td>
                          <td className="py-2.5 px-3 text-center">
                            <div className="flex items-center justify-center gap-1.5">
                              <input
                                type="number"
                                min={0}
                                max={v.declaredStock * 2}
                                value={v.acceptedStock}
                                onChange={(e) =>
                                  handleVariantStockChange(v.id, Number(e.target.value) || 0)
                                }
                                aria-label={`Accepted stock for ${v.sku}`}
                                className={`w-20 px-2 py-1 rounded-lg text-center font-mono font-bold text-xs border focus:outline-none transition-all ${
                                  hasProblem
                                    ? 'border-amber-400 bg-amber-50/50 dark:bg-amber-950/30 text-amber-700 dark:text-amber-300'
                                    : 'border-slate-300 dark:border-white/20 bg-white dark:bg-navy-900 text-navy-900 dark:text-white focus:border-orange-500'
                                }`}
                              />
                              <span className="text-[11px] text-slate-400">pcs</span>
                            </div>
                          </td>
                          <td className="py-2.5 px-3 text-right font-mono">
                            {hasProblem ? (
                              <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20">
                                <AlertOctagon className="h-3 w-3" />
                                <span>-{diff} Problem</span>
                              </span>
                            ) : v.acceptedStock > v.declaredStock ? (
                              <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-sky-500/10 text-sky-600 dark:text-sky-400 border border-sky-500/20">
                                <span>+{v.acceptedStock - v.declaredStock} Extra</span>
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                                <Check className="h-3 w-3" />
                                <span>100% Verified</span>
                              </span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Target Bin & QC Notes */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-200 mb-1.5">
                  Target Warehouse Storage Bin *
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

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-200 mb-1.5">
                  QC Inspection Notes (Optional)
                </label>
                <input
                  type="text"
                  value={qcNotes}
                  onChange={(e) => setQcNotes(e.target.value)}
                  placeholder={
                    totalProblemCount > 0
                      ? `e.g. ${totalProblemCount} damaged items held in quarantine dock`
                      : 'e.g. All units verified in perfect condition'
                  }
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-navy-950 border border-slate-300 dark:border-white/15 text-xs text-navy-800 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:border-orange-500"
                />
              </div>
            </div>
          </div>
        )}

        {!isApprove && (
          <div className="space-y-2 pt-1">
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-200">
              Rejection Reason <span className="text-rose-500">*</span>
            </label>
            <textarea
              value={rejectionReason}
              onChange={(e) => {
                setRejectionReason(e.target.value);
                if (rejectionError) setRejectionError(null);
              }}
              placeholder="Explain why this submission is rejected (e.g. invalid SKU format, missing weight specs, packaging non-compliant)..."
              rows={3}
              required
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-navy-950 border border-slate-300 dark:border-white/15 text-xs text-navy-800 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:border-rose-500"
            />
            {rejectionError && (
              <p className="text-[11px] font-semibold text-rose-500">{rejectionError}</p>
            )}
          </div>
        )}

        <div className="flex items-center justify-between pt-3 border-t border-slate-200 dark:border-white/10">
          <div className="text-[11px] text-slate-500">
            {isApprove && (
              <span>
                Total Store Intake: <strong className="text-emerald-600 dark:text-emerald-400 font-mono font-bold">{totalAccepted} pcs</strong>
                {totalProblemCount > 0 && <span className="text-rose-500 ml-1">({totalProblemCount} problem units excluded)</span>}
              </span>
            )}
          </div>
          <div className="flex items-center gap-2.5">
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
              {!isApprove
                ? isDraftToPublish
                  ? 'Reject & Return to Draft'
                  : 'Confirm Reject'
                : `Confirm & Store Stock (${totalAccepted} pcs)`}
            </button>
          </div>
        </div>
      </div>
    </Modal>
  );
}
