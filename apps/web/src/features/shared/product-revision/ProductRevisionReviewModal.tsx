'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import {
  CheckCircle2,
  XCircle,
  Clock,
  ArrowRight,
  Palette,
  Edit2,
  Trash2,
  Image as ImageIcon,
  ShieldCheck,
  AlertCircle,
  Loader2,
  Sparkles,
} from 'lucide-react';
import { Modal } from '@/components/admin/AdminModal';
import {
  computeRevisionDiff,
  ProductPendingEditInfo,
} from '@/lib/productRevision';

export interface ProductRevisionReviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  mode: 'ADMIN' | 'MERCHANT';
  product: {
    id: string;
    title: string;
    sku: string;
    imageUrl?: string;
    merchantName?: string;
    merchantCode?: string;
    stock?: number;
    bin?: string;
  } | null;
  pendingEdit: ProductPendingEditInfo | null;
  onApprove?: (productId: string) => Promise<void> | void;
  onReject?: (productId: string, reason: string) => Promise<void> | void;
  onCancelPendingEdit?: (productId: string) => Promise<void> | void;
  initialRejectMode?: boolean;
}

function formatTimestamp(iso?: string): string {
  if (!iso) return 'Just now';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleString(undefined, {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function ProductRevisionReviewModal({
  isOpen,
  onClose,
  mode,
  product,
  pendingEdit,
  onApprove,
  onReject,
  onCancelPendingEdit,
  initialRejectMode = false,
}: ProductRevisionReviewModalProps) {
  const [isRejecting, setIsRejecting] = useState(initialRejectMode);
  const [rejectionReason, setRejectionReason] = useState('');
  const [rejectError, setRejectError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setIsRejecting(initialRejectMode);
      setRejectionReason('');
      setRejectError(null);
      setIsSubmitting(false);
    }
  }, [isOpen, initialRejectMode, product?.id]);

  const diff = useMemo(() => {
    if (!pendingEdit) return null;
    return computeRevisionDiff(
      pendingEdit.originalSnapshot,
      pendingEdit.proposedSnapshot
    );
  }, [pendingEdit]);

  if (!isOpen || !product || !pendingEdit || !diff) return null;

  const handleApproveClick = async () => {
    if (!onApprove || isSubmitting) return;
    setIsSubmitting(true);
    try {
      await onApprove(product.id);
      onClose();
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleConfirmRejectClick = async () => {
    if (!onReject || isSubmitting) return;
    if (!rejectionReason.trim()) {
      setRejectError('Please provide a reason so the merchant knows why the edit was declined.');
      return;
    }
    setRejectError(null);
    setIsSubmitting(true);
    try {
      await onReject(product.id, rejectionReason.trim());
      onClose();
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancelClick = async () => {
    if (!onCancelPendingEdit || isSubmitting) return;
    setIsSubmitting(true);
    try {
      await onCancelPendingEdit(product.id);
      onClose();
    } finally {
      setIsSubmitting(false);
    }
  };

  const footerContent =
    mode === 'ADMIN' ? (
      <div className="w-full flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
          <ShieldCheck className="w-4 h-4 text-emerald-500 shrink-0" />
          <span>Warehouse stock ({product.stock ?? 0} pcs) &amp; bin slot ({product.bin || 'Assigned'}) will be preserved.</span>
        </div>
        <div className="flex items-center justify-end gap-2.5 shrink-0">
          {isRejecting ? (
            <>
              <button
                type="button"
                disabled={isSubmitting}
                onClick={() => {
                  setIsRejecting(false);
                  setRejectError(null);
                }}
                className="px-4 py-2 rounded-xl border border-slate-200 dark:border-white/10 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-navy-800 cursor-pointer"
              >
                Back
              </button>
              <button
                type="button"
                disabled={isSubmitting}
                onClick={handleConfirmRejectClick}
                className="px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 disabled:opacity-50 text-white text-xs font-bold flex items-center gap-1.5 shadow-md shadow-rose-500/20 cursor-pointer"
              >
                {isSubmitting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <XCircle className="w-3.5 h-3.5" />}
                <span>Confirm Reject Edit</span>
              </button>
            </>
          ) : (
            <>
              <button
                type="button"
                disabled={isSubmitting}
                onClick={() => setIsRejecting(true)}
                className="px-4 py-2.5 rounded-xl border border-rose-200 dark:border-rose-500/30 bg-rose-50 dark:bg-rose-500/10 hover:bg-rose-100 dark:hover:bg-rose-500/20 text-rose-700 dark:text-rose-300 text-xs font-bold flex items-center gap-1.5 cursor-pointer"
              >
                <XCircle className="w-3.5 h-3.5" />
                <span>Reject Edit</span>
              </button>
              <button
                type="button"
                disabled={isSubmitting}
                onClick={handleApproveClick}
                className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white text-xs font-bold flex items-center gap-1.5 shadow-md shadow-emerald-500/20 cursor-pointer"
              >
                {isSubmitting ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <CheckCircle2 className="w-3.5 h-3.5" />
                )}
                <span>Approve &amp; Apply Changes</span>
              </button>
            </>
          )}
        </div>
      </div>
    ) : (
      <div className="w-full flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="text-[11px] text-slate-500 dark:text-slate-400">
          Your live product stays <strong className="text-emerald-600 dark:text-emerald-400">Published</strong> while admin reviews these changes.
        </div>
        <div className="flex items-center justify-end gap-2.5 shrink-0">
          {onCancelPendingEdit && (
            <button
              type="button"
              disabled={isSubmitting}
              onClick={handleCancelClick}
              className="px-4 py-2.5 rounded-xl border border-rose-200 dark:border-rose-500/30 bg-rose-50 dark:bg-rose-500/10 hover:bg-rose-100 dark:hover:bg-rose-500/20 text-rose-700 dark:text-rose-300 text-xs font-bold flex items-center gap-1.5 cursor-pointer"
            >
              {isSubmitting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
              <span>Cancel Pending Edit</span>
            </button>
          )}
          <Link
            href={`/merchant/products/${product.id}/edit`}
            onClick={onClose}
            className="px-5 py-2.5 rounded-xl bg-orange-600 hover:bg-orange-500 text-white text-xs font-bold flex items-center gap-1.5 shadow-md shadow-orange-500/20 cursor-pointer"
          >
            <Edit2 className="w-3.5 h-3.5" />
            <span>Modify Pending Edit</span>
          </Link>
        </div>
      </div>
    );

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={mode === 'ADMIN' ? 'Review Pending Product Edit' : 'Pending Edit Preview'}
      subtitle={`${product.title} · ${product.sku}${product.merchantName ? ` · ${product.merchantName} (${product.merchantCode || ''})` : ''}`}
      size="xl"
      footer={footerContent}
    >
      {/* Top Status Banner */}
      <div className="p-4 rounded-2xl bg-amber-50/90 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-500/30 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-start gap-3">
          <div className="w-9 h-9 rounded-xl bg-amber-500/15 border border-amber-500/30 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
            <Clock className="w-4 h-4" />
          </div>
          <div className="space-y-1">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs font-bold text-amber-900 dark:text-amber-200">
                Awaiting Admin Approval — Live Product Remains Published
              </span>
              <span className="text-[10px] font-mono text-amber-700 dark:text-amber-300 bg-amber-500/15 px-2 py-0.5 rounded-full border border-amber-500/20">
                Submitted {formatTimestamp(pendingEdit.submittedAt)}
              </span>
            </div>
            <p className="text-[11px] text-amber-800/90 dark:text-amber-300/80 leading-relaxed">
              Orders and existing published attributes stay active without interruption until an admin approves or rejects these edits.
            </p>
          </div>
        </div>

        {/* Changed Fields Summary Pills */}
        {diff.changedFields.length > 0 && (
          <div className="flex flex-wrap items-center gap-1.5 shrink-0">
            {diff.changedFields.map((field) => (
              <span
                key={field}
                className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-white dark:bg-navy-900 text-orange-600 dark:text-orange-400 border border-orange-500/30 shadow-2xs"
              >
                {field}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Reject Reason Box (Admin Mode) */}
      {mode === 'ADMIN' && isRejecting && (
        <div className="p-4 rounded-2xl bg-rose-50/80 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-500/30 space-y-2">
          <label className="block text-xs font-bold text-rose-800 dark:text-rose-200">
            Rejection Reason <span className="text-rose-500">*</span>
          </label>
          <textarea
            rows={3}
            value={rejectionReason}
            onChange={(e) => {
              setRejectionReason(e.target.value);
              if (rejectError) setRejectError(null);
            }}
            placeholder="Explain why this pending edit is declined (e.g. color photo does not match actual warehouse stock, incorrect pricing)..."
            className="w-full rounded-xl border border-rose-200 dark:border-rose-500/30 bg-white dark:bg-navy-900 p-3 text-xs text-navy-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500"
          />
          {rejectError && (
            <p className="text-[11px] font-semibold text-rose-600 dark:text-rose-400 flex items-center gap-1">
              <AlertCircle className="w-3.5 h-3.5 shrink-0" />
              <span>{rejectError}</span>
            </p>
          )}
        </div>
      )}

      {/* 1. Color Swatches Diff */}
      {diff.colorChanges.length > 0 && (
        <div className="rounded-2xl border border-slate-200 dark:border-white/10 bg-slate-50/60 dark:bg-navy-950/50 p-4 space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-bold uppercase tracking-wider text-navy-900 dark:text-white flex items-center gap-2">
              <Palette className="w-4 h-4 text-orange-500" />
              <span>Color &amp; Swatch Changes ({diff.colorChanges.length})</span>
            </h4>
          </div>

          <div className="space-y-2.5">
            {diff.colorChanges.map((entry, idx) => (
              <div
                key={idx}
                className="p-3.5 rounded-xl bg-white dark:bg-navy-900 border border-slate-200/80 dark:border-white/10 flex flex-col md:flex-row md:items-center justify-between gap-3"
              >
                <div className="flex items-center gap-3 flex-1 min-w-0 flex-wrap">
                  {/* Before Swatch */}
                  {entry.before ? (
                    <div className="flex items-center gap-2.5 px-3 py-2 rounded-xl bg-slate-100/80 dark:bg-navy-950 border border-slate-200 dark:border-white/10">
                      {entry.before.imageUrl && (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={entry.before.imageUrl}
                          alt={entry.before.name}
                          className="w-8 h-8 rounded-lg object-cover border border-slate-200 dark:border-white/10"
                        />
                      )}
                      <span
                        className="w-4 h-4 rounded-full border border-black/15 shrink-0"
                        style={{ backgroundColor: entry.before.hex }}
                      />
                      <div>
                        <span className="text-[10px] uppercase font-bold text-slate-400 block">
                          Current Published
                        </span>
                        <span className="text-xs font-bold text-navy-900 dark:text-white">
                          {entry.before.name}
                        </span>
                        <span className="ml-1.5 text-[10px] font-mono text-slate-400">
                          {entry.before.hex}
                        </span>
                      </div>
                    </div>
                  ) : (
                    <span className="px-2.5 py-1 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-[11px] font-bold border border-emerald-500/20">
                      + New Color
                    </span>
                  )}

                  <ArrowRight className="w-4 h-4 text-orange-500 shrink-0" />

                  {/* After Swatch */}
                  {entry.after ? (
                    <div className="flex items-center gap-2.5 px-3 py-2 rounded-xl bg-orange-50/70 dark:bg-orange-950/30 border border-orange-500/30">
                      {entry.after.imageUrl && (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={entry.after.imageUrl}
                          alt={entry.after.name}
                          className="w-8 h-8 rounded-lg object-cover border border-orange-500/30"
                        />
                      )}
                      <span
                        className="w-4 h-4 rounded-full border border-black/15 shrink-0"
                        style={{ backgroundColor: entry.after.hex }}
                      />
                      <div>
                        <span className="text-[10px] uppercase font-bold text-orange-600 dark:text-orange-400 block">
                          Proposed Change
                        </span>
                        <span className="text-xs font-bold text-navy-900 dark:text-white">
                          {entry.after.name}
                        </span>
                        <span className="ml-1.5 text-[10px] font-mono text-slate-500 dark:text-slate-300">
                          {entry.after.hex}
                        </span>
                      </div>
                    </div>
                  ) : (
                    <span className="px-2.5 py-1 rounded-lg bg-rose-500/10 text-rose-600 dark:text-rose-400 text-[11px] font-bold border border-rose-500/20">
                      Removed
                    </span>
                  )}
                </div>

                {/* Change details */}
                <div className="flex flex-wrap gap-1.5 shrink-0">
                  {entry.details.map((d, dIdx) => (
                    <span
                      key={dIdx}
                      className={`px-2 py-0.5 rounded-md text-[10px] font-semibold border ${
                        entry.kind === 'ADDED'
                          ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/25'
                          : entry.kind === 'REMOVED'
                          ? 'bg-rose-500/10 text-rose-700 dark:text-rose-300 border-rose-500/25'
                          : 'bg-amber-500/10 text-amber-700 dark:text-amber-300 border-amber-500/25'
                      }`}
                    >
                      {d}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 2. Scalar Product Fields Diff */}
      {diff.scalarChanges.length > 0 && (
        <div className="rounded-2xl border border-slate-200 dark:border-white/10 overflow-hidden bg-white dark:bg-navy-900">
          <div className="px-4 py-3 bg-slate-50 dark:bg-navy-950/70 border-b border-slate-200 dark:border-white/10">
            <h4 className="text-xs font-bold uppercase tracking-wider text-navy-900 dark:text-white">
              Product Details Comparison
            </h4>
          </div>
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-200/80 dark:border-white/10 text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase bg-slate-50/40 dark:bg-navy-950/30">
                <th className="py-2.5 px-4 w-40">Field</th>
                <th className="py-2.5 px-4">Current Published</th>
                <th className="py-2.5 px-4">Proposed Change</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-white/5">
              {diff.scalarChanges.map((sc) => (
                <tr key={sc.field}>
                  <td className="py-3 px-4 font-bold text-navy-900 dark:text-white align-top">
                    {sc.label}
                  </td>
                  <td className="py-3 px-4 text-slate-600 dark:text-slate-300 bg-rose-50/30 dark:bg-rose-950/10 align-top">
                    <span className="line-through opacity-80 whitespace-pre-wrap break-words">
                      {sc.before}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-emerald-700 dark:text-emerald-300 font-semibold bg-emerald-50/30 dark:bg-emerald-950/10 align-top">
                    <span className="whitespace-pre-wrap break-words">{sc.after}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* 3. Sizes & Key Features Diff */}
      {(diff.sizeChanges.added.length > 0 ||
        diff.sizeChanges.removed.length > 0 ||
        diff.featureChanges.added.length > 0 ||
        diff.featureChanges.removed.length > 0) && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {(diff.sizeChanges.added.length > 0 || diff.sizeChanges.removed.length > 0) && (
            <div className="rounded-2xl border border-slate-200 dark:border-white/10 bg-slate-50/60 dark:bg-navy-950/50 p-4 space-y-2.5">
              <h4 className="text-xs font-bold uppercase tracking-wider text-navy-900 dark:text-white">
                Size Changes
              </h4>
              <div className="flex flex-wrap gap-1.5">
                {diff.sizeChanges.added.map((s) => (
                  <span
                    key={`add-${s}`}
                    className="px-2.5 py-1 rounded-lg bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30 text-xs font-mono font-bold"
                  >
                    + {s}
                  </span>
                ))}
                {diff.sizeChanges.removed.map((s) => (
                  <span
                    key={`rem-${s}`}
                    className="px-2.5 py-1 rounded-lg bg-rose-500/15 text-rose-700 dark:text-rose-300 border border-rose-500/30 text-xs font-mono font-bold line-through"
                  >
                    - {s}
                  </span>
                ))}
              </div>
            </div>
          )}

          {(diff.featureChanges.added.length > 0 || diff.featureChanges.removed.length > 0) && (
            <div className="rounded-2xl border border-slate-200 dark:border-white/10 bg-slate-50/60 dark:bg-navy-950/50 p-4 space-y-2.5">
              <h4 className="text-xs font-bold uppercase tracking-wider text-navy-900 dark:text-white flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-orange-500" />
                <span>Key Features Changes</span>
              </h4>
              <ul className="space-y-1.5 text-xs">
                {diff.featureChanges.added.map((f, idx) => (
                  <li
                    key={`af-${idx}`}
                    className="text-emerald-700 dark:text-emerald-300 font-semibold flex items-center gap-1.5"
                  >
                    <span>+</span>
                    <span>{f}</span>
                  </li>
                ))}
                {diff.featureChanges.removed.map((f, idx) => (
                  <li
                    key={`rf-${idx}`}
                    className="text-rose-600 dark:text-rose-400 line-through flex items-center gap-1.5"
                  >
                    <span>-</span>
                    <span>{f}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      {/* 4. Photos / Gallery Diff */}
      {(diff.imageChanges.primaryChanged ||
        diff.imageChanges.addedImages.length > 0 ||
        diff.imageChanges.removedImages.length > 0) && (
        <div className="rounded-2xl border border-slate-200 dark:border-white/10 bg-slate-50/60 dark:bg-navy-950/50 p-4 space-y-3">
          <h4 className="text-xs font-bold uppercase tracking-wider text-navy-900 dark:text-white flex items-center gap-2">
            <ImageIcon className="w-4 h-4 text-orange-500" />
            <span>Product Photo Changes</span>
          </h4>

          {diff.imageChanges.primaryChanged && (
            <div className="flex flex-wrap items-center gap-4">
              <div className="space-y-1">
                <span className="text-[10px] uppercase font-bold text-slate-400 block">
                  Current Primary Photo
                </span>
                {diff.imageChanges.beforePrimary ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={diff.imageChanges.beforePrimary}
                    alt="Current Primary"
                    className="w-20 h-20 rounded-xl object-cover border border-slate-200 dark:border-white/10"
                  />
                ) : (
                  <div className="w-20 h-20 rounded-xl bg-slate-100 dark:bg-navy-900 border border-dashed border-slate-300 dark:border-white/15 flex items-center justify-center text-[10px] text-slate-400">
                    None
                  </div>
                )}
              </div>

              <ArrowRight className="w-4 h-4 text-orange-500" />

              <div className="space-y-1">
                <span className="text-[10px] uppercase font-bold text-orange-600 dark:text-orange-400 block">
                  Proposed Primary Photo
                </span>
                {diff.imageChanges.afterPrimary ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={diff.imageChanges.afterPrimary}
                    alt="Proposed Primary"
                    className="w-20 h-20 rounded-xl object-cover border-2 border-orange-500/40"
                  />
                ) : (
                  <div className="w-20 h-20 rounded-xl bg-slate-100 dark:bg-navy-900 border border-dashed border-slate-300 dark:border-white/15 flex items-center justify-center text-[10px] text-slate-400">
                    Removed
                  </div>
                )}
              </div>
            </div>
          )}

          {(diff.imageChanges.addedImages.length > 0 ||
            diff.imageChanges.removedImages.length > 0) && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
              {diff.imageChanges.addedImages.length > 0 && (
                <div className="space-y-1.5">
                  <span className="text-[10px] uppercase font-bold text-emerald-600 dark:text-emerald-400 block">
                    Added Gallery Photos ({diff.imageChanges.addedImages.length})
                  </span>
                  <div className="flex flex-wrap gap-2">
                    {diff.imageChanges.addedImages.map((u, i) => (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        key={i}
                        src={u}
                        alt={`Added ${i + 1}`}
                        className="w-14 h-14 rounded-lg object-cover border-2 border-emerald-500/40"
                      />
                    ))}
                  </div>
                </div>
              )}

              {diff.imageChanges.removedImages.length > 0 && (
                <div className="space-y-1.5">
                  <span className="text-[10px] uppercase font-bold text-rose-600 dark:text-rose-400 block">
                    Removed Photos ({diff.imageChanges.removedImages.length})
                  </span>
                  <div className="flex flex-wrap gap-2">
                    {diff.imageChanges.removedImages.map((u, i) => (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        key={i}
                        src={u}
                        alt={`Removed ${i + 1}`}
                        className="w-14 h-14 rounded-lg object-cover border-2 border-rose-500/40 opacity-60"
                      />
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </Modal>
  );
}
