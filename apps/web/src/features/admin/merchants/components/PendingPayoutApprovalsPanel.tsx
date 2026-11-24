'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  Clock,
  Landmark,
  CheckCircle2,
  XCircle,
  Eye,
  ArrowUpRight,
  CreditCard,
} from 'lucide-react';
import { DocumentViewerModal } from '@/components/ui';
import { MerchantRecord } from '../types';

export interface PendingPayoutApprovalsPanelProps {
  pendingMerchants: MerchantRecord[];
  onReviewPayout: (
    merchantId: string,
    action: 'APPROVE' | 'REJECT',
    rejectionReason?: string,
  ) => void;
  title?: string;
  subtitle?: string;
}

export function PendingPayoutApprovalsPanel({
  pendingMerchants,
  onReviewPayout,
  title = 'Pending Payment Details Approvals',
  subtitle = 'Review and verify merchant bank or MFS payout accounts submitted from the Merchant Portal.',
}: PendingPayoutApprovalsPanelProps) {
  const [rejectingId, setRejectingId] = useState<string | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [previewMerchant, setPreviewMerchant] = useState<MerchantRecord | null>(null);

  if (!pendingMerchants || pendingMerchants.length === 0) {
    return null;
  }

  return (
    <div className="rounded-2xl border border-amber-500/35 bg-amber-50/70 dark:bg-amber-950/15 p-4 sm:p-5 space-y-4 shadow-lg">
      {/* Section Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div className="flex items-start gap-3">
          <div className="h-10 w-10 rounded-xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-amber-700 dark:text-amber-300 shrink-0">
            <Clock className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-sm sm:text-base font-extrabold text-navy-900 dark:text-white">
                {title}
              </h2>
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-500/20 text-amber-800 dark:text-amber-300 border border-amber-500/30 tabular-nums">
                {pendingMerchants.length} Pending
              </span>
            </div>
            <p className="text-xs text-slate-600 dark:text-slate-300 mt-0.5">{subtitle}</p>
          </div>
        </div>
      </div>

      {/* Pending Merchant Cards */}
      <div className="grid grid-cols-1 gap-3">
        {pendingMerchants.map((m) => {
          const isRejecting = rejectingId === m.id;
          const payout = m.payoutAccount;
          return (
            <div
              key={m.id}
              className="rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-navy-900 p-4 space-y-3 shadow-sm"
            >
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                {/* Merchant & Account Info */}
                <div className="space-y-2 min-w-0 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-bold text-sm text-navy-900 dark:text-white">
                      {m.storeName}
                    </span>
                    <span className="tabular-nums text-[11px] font-bold text-indigo-600 dark:text-indigo-400 bg-indigo-500/10 px-2 py-0.5 rounded border border-indigo-500/20">
                      {m.merchantCode}
                    </span>
                    <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-amber-500/15 text-amber-700 dark:text-amber-300 border border-amber-500/30">
                      Pending Approval
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-2.5 text-xs">
                    <div className="rounded-lg bg-slate-50 dark:bg-navy-950 border border-slate-200/80 dark:border-white/10 px-3 py-2">
                      <span className="text-[10px] uppercase font-bold text-slate-500 dark:text-slate-400 flex items-center gap-1">
                        <Landmark className="w-3 h-3 text-orange-500" />
                        Provider
                      </span>
                      <span className="font-semibold text-navy-900 dark:text-slate-100 block mt-0.5 truncate">
                        {payout.provider || '—'}
                      </span>
                    </div>

                    <div className="rounded-lg bg-slate-50 dark:bg-navy-950 border border-slate-200/80 dark:border-white/10 px-3 py-2">
                      <span className="text-[10px] uppercase font-bold text-slate-500 dark:text-slate-400 flex items-center gap-1">
                        <CreditCard className="w-3 h-3 text-orange-500" />
                        Account / MFS #
                      </span>
                      <span className="font-mono font-bold text-orange-600 dark:text-orange-400 block mt-0.5 truncate">
                        {payout.accountNumber || payout.bkashNumber || '—'}
                      </span>
                    </div>

                    <div className="rounded-lg bg-slate-50 dark:bg-navy-950 border border-slate-200/80 dark:border-white/10 px-3 py-2">
                      <span className="text-[10px] uppercase font-bold text-slate-500 dark:text-slate-400 block">
                        Account Holder
                      </span>
                      <span className="font-semibold text-navy-900 dark:text-slate-100 block mt-0.5 truncate">
                        {payout.accountHolder || m.ownerName || '—'}
                      </span>
                    </div>

                    <div className="rounded-lg bg-slate-50 dark:bg-navy-950 border border-slate-200/80 dark:border-white/10 px-3 py-2">
                      <span className="text-[10px] uppercase font-bold text-slate-500 dark:text-slate-400 block">
                        Branch / Routing / MFS
                      </span>
                      <span className="font-medium text-slate-700 dark:text-slate-200 block mt-0.5 truncate">
                        {[
                          payout.branchName && payout.branchName !== '—' ? payout.branchName : null,
                          payout.routingNumber && payout.routingNumber !== '—'
                            ? `Routing: ${payout.routingNumber}`
                            : null,
                          payout.bkashNumber ? `MFS: ${payout.bkashNumber}` : null,
                        ]
                          .filter(Boolean)
                          .join(' · ') || payout.frequency || 'Standard'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex flex-wrap items-center gap-2 shrink-0">
                  {payout.chequeLeafUrl && (
                    <button
                      type="button"
                      onClick={() => setPreviewMerchant(m)}
                      className="px-3 py-2 rounded-xl bg-slate-100 dark:bg-navy-800 hover:bg-slate-200 dark:hover:bg-navy-700 border border-slate-200 dark:border-white/10 text-xs font-semibold text-navy-900 dark:text-slate-100 flex items-center gap-1.5 transition-colors cursor-pointer"
                    >
                      <Eye className="w-3.5 h-3.5 text-orange-600 dark:text-orange-400" />
                      <span>Cheque Leaf</span>
                    </button>
                  )}

                  <Link
                    href={`/admin/merchants/${encodeURIComponent(m.id)}?tab=payout`}
                    className="px-3 py-2 rounded-xl bg-slate-100 dark:bg-navy-800 hover:bg-slate-200 dark:hover:bg-navy-700 border border-slate-200 dark:border-white/10 text-xs font-semibold text-navy-900 dark:text-slate-100 flex items-center gap-1.5 transition-colors"
                  >
                    <span>Review Profile</span>
                    <ArrowUpRight className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400" />
                  </Link>

                  <button
                    type="button"
                    onClick={() => {
                      setRejectingId(null);
                      setRejectionReason('');
                      onReviewPayout(m.id, 'APPROVE');
                    }}
                    className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center gap-1.5 shadow-sm transition-colors cursor-pointer"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Approve</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setRejectingId(isRejecting ? null : m.id);
                      setRejectionReason('');
                    }}
                    className="px-3 py-2 rounded-xl bg-rose-500/15 hover:bg-rose-500/25 border border-rose-500/30 text-rose-700 dark:text-rose-300 text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <XCircle className="w-3.5 h-3.5" />
                    <span>Reject</span>
                  </button>
                </div>
              </div>

              {/* Optional Rejection Reason Box */}
              {isRejecting && (
                <div className="pt-3 border-t border-slate-200/80 dark:border-white/10 flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
                  <input
                    type="text"
                    value={rejectionReason}
                    onChange={(e) => setRejectionReason(e.target.value)}
                    placeholder="Enter rejection reason (e.g. Cheque leaf unclear / Account name mismatch)"
                    className="flex-1 px-3 py-2 rounded-lg bg-slate-50 dark:bg-navy-950 border border-slate-200 dark:border-white/10 text-xs text-navy-900 dark:text-white focus:outline-none focus:border-rose-500"
                  />
                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      type="button"
                      onClick={() => {
                        setRejectingId(null);
                        setRejectionReason('');
                      }}
                      className="px-3 py-2 rounded-lg bg-slate-100 dark:bg-navy-800 text-xs font-semibold text-slate-600 dark:text-slate-300 cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        onReviewPayout(
                          m.id,
                          'REJECT',
                          rejectionReason.trim() || 'Payout details verification failed'
                        );
                        setRejectingId(null);
                        setRejectionReason('');
                      }}
                      className="px-4 py-2 rounded-lg bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold cursor-pointer"
                    >
                      Confirm Reject
                    </button>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Cheque Document Viewer Modal */}
      <DocumentViewerModal
        isOpen={Boolean(previewMerchant)}
        onClose={() => setPreviewMerchant(null)}
        title={`Cheque Leaf · ${previewMerchant?.storeName || ''}`}
        subtitle={
          previewMerchant
            ? `${previewMerchant.payoutAccount.provider} — A/C: ${previewMerchant.payoutAccount.accountNumber}`
            : undefined
        }
        documentUrl={previewMerchant?.payoutAccount?.chequeLeafUrl}
      />
    </div>
  );
}
