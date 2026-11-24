'use client';

import React, { useState } from 'react';
import {
  CreditCard,
  Eye,
  Pencil,
  Copy,
  CheckCircle2,
  Building2,
  FileText,
  Clock,
  AlertCircle,
  XCircle,
  PlusCircle,
} from 'lucide-react';
import { PayoutAccount } from '../types';
import { VerificationStatusBadge, DocumentViewerModal } from '@/components/ui';

interface PayoutAccountCardProps {
  payoutAccount: PayoutAccount;
  onManagePayout: () => void;
}

export function PayoutAccountCard({
  payoutAccount,
  onManagePayout,
}: PayoutAccountCardProps) {
  const [isViewerOpen, setIsViewerOpen] = useState(false);
  const [copiedAccount, setCopiedAccount] = useState(false);

  const hasDetails = Boolean(
    payoutAccount?.accountNumber?.trim() || payoutAccount?.bkashMerchantNumber?.trim()
  );
  const effectiveStatus = hasDetails
    ? payoutAccount.status || 'PENDING_REVIEW'
    : payoutAccount?.status === 'REJECTED'
      ? 'REJECTED'
      : 'UNVERIFIED';

  const isVerified = effectiveStatus === 'VERIFIED';
  const isPending = effectiveStatus === 'PENDING_REVIEW';
  const isRejected = effectiveStatus === 'REJECTED';

  const handleCopyAccount = async () => {
    try {
      await navigator.clipboard.writeText(payoutAccount.accountNumber || payoutAccount.bkashMerchantNumber || '');
      setCopiedAccount(true);
      setTimeout(() => setCopiedAccount(false), 2000);
    } catch {
      setCopiedAccount(true);
      setTimeout(() => setCopiedAccount(false), 2000);
    }
  };

  return (
    <div className="p-5 sm:p-6 rounded-2xl bg-white dark:bg-navy-900 border border-slate-200/80 dark:border-white/10 shadow-md relative overflow-hidden space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-200/80 dark:border-white/10">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-orange-500/10 border border-orange-500/20 flex items-center justify-center text-orange-600 dark:text-orange-400 shrink-0">
            <CreditCard className="h-5 w-5" />
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-base font-bold text-navy-900 dark:text-white">COD Payout &amp; Disbursement</h2>
              <VerificationStatusBadge status={effectiveStatus} />
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Net COD customer remittances deposited to this designated account.
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={onManagePayout}
          className="inline-flex items-center justify-center gap-1.5 px-3.5 py-2 bg-slate-100 dark:bg-navy-800 hover:bg-slate-200 dark:hover:bg-navy-700 text-navy-900 dark:text-slate-200 border border-slate-200 dark:border-white/10 rounded-xl text-xs font-semibold transition-colors cursor-pointer self-start sm:self-auto min-h-[38px]"
        >
          {hasDetails ? (
            <>
              <Pencil className="h-3.5 w-3.5 text-orange-600 dark:text-orange-400" />
              <span>Configure Account</span>
            </>
          ) : (
            <>
              <PlusCircle className="h-3.5 w-3.5 text-orange-600 dark:text-orange-400" />
              <span>Add Payment Details</span>
            </>
          )}
        </button>
      </div>

      {/* Status Notice Banners */}
      {isPending && hasDetails && (
        <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-start gap-2.5 text-xs">
          <Clock className="h-4 w-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
          <div>
            <p className="font-bold text-amber-800 dark:text-amber-200">
              Pending Admin Approval
            </p>
            <p className="text-amber-700/90 dark:text-amber-300/90 mt-0.5">
              Your submitted payment details are currently in the Admin Panel review queue. Once approved, COD settlements will disburse to this account.
            </p>
          </div>
        </div>
      )}

      {isRejected && (
        <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 flex items-start gap-2.5 text-xs">
          <XCircle className="h-4 w-4 text-rose-600 dark:text-rose-400 shrink-0 mt-0.5" />
          <div>
            <p className="font-bold text-rose-800 dark:text-rose-200">
              Payment Details Rejected by Admin
            </p>
            <p className="text-rose-700/90 dark:text-rose-300/90 mt-0.5">
              {payoutAccount.rejectionReason
                ? `Reason: ${payoutAccount.rejectionReason}. Please update and resubmit your account details.`
                : 'Your payment details could not be verified. Please update and resubmit.'}
            </p>
          </div>
        </div>
      )}

      {/* Empty State when no payout details added yet */}
      {!hasDetails ? (
        <div className="p-6 rounded-xl border border-dashed border-slate-300 dark:border-white/15 bg-slate-50/70 dark:bg-navy-950/60 text-center space-y-3">
          <div className="h-11 w-11 rounded-xl bg-orange-500/10 border border-orange-500/20 flex items-center justify-center text-orange-600 dark:text-orange-400 mx-auto">
            <Building2 className="h-5 w-5" />
          </div>
          <div className="space-y-1 max-w-md mx-auto">
            <h3 className="text-sm font-bold text-navy-900 dark:text-white">
              No Payment Details Added Yet
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Add your Bank or bKash/Nagad merchant payout details to submit them for Admin verification and receive COD payouts.
            </p>
          </div>
          <button
            type="button"
            onClick={onManagePayout}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-orange-600 hover:bg-orange-500 text-white text-xs font-bold shadow-sm transition-colors cursor-pointer"
          >
            <PlusCircle className="h-4 w-4" />
            <span>Add Payment Details</span>
          </button>
        </div>
      ) : (
        /* Fintech Styled Bank Card Container */
        <div className="p-5 sm:p-6 rounded-xl bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 border border-slate-200/80 dark:border-white/10 shadow-lg relative overflow-hidden space-y-5 group transition-all">
          {/* Subtle decorative glow */}
          <div className="absolute top-0 right-0 -mr-16 -mt-16 h-36 w-36 rounded-full bg-emerald-500/5 blur-2xl pointer-events-none" />

          {/* Bank & Status Row */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="h-11 w-11 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shrink-0 shadow-inner">
                <Building2 className="h-5 w-5" />
              </div>
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                  Primary Disbursement Bank / MFS
                </span>
                <span className="text-sm sm:text-base font-bold text-white tracking-tight">
                  {payoutAccount.provider}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2 self-start sm:self-auto">
              <span className="px-2.5 py-1 rounded-md text-[11px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                Default
              </span>
              {isVerified ? (
                <span className="px-2.5 py-1 rounded-md text-[11px] font-bold bg-teal-500/10 text-teal-300 border border-teal-500/30 flex items-center gap-1.5">
                  <CheckCircle2 className="h-3.5 w-3.5 text-teal-400" />
                  Verified for Payout
                </span>
              ) : isRejected ? (
                <span className="px-2.5 py-1 rounded-md text-[11px] font-bold bg-rose-500/15 text-rose-300 border border-rose-500/30 flex items-center gap-1.5">
                  <XCircle className="h-3.5 w-3.5 text-rose-400" />
                  Rejected
                </span>
              ) : (
                <span className="px-2.5 py-1 rounded-md text-[11px] font-bold bg-amber-500/10 text-amber-400 border border-amber-500/30 flex items-center gap-1.5">
                  <AlertCircle className="h-3.5 w-3.5 text-amber-400" />
                  Pending Approval
                </span>
              )}
            </div>
          </div>

          {/* Account Number & Holder */}
          <div className="pt-2 border-t border-white/10 grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1">
              <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 block">
                Account Number / MFS #
              </span>
              <div className="flex items-center gap-2">
                <span className="font-mono text-base sm:text-lg font-bold text-white tracking-wider">
                  {payoutAccount.accountNumber || payoutAccount.bkashMerchantNumber}
                </span>
                <button
                  type="button"
                  onClick={handleCopyAccount}
                  className="p-1.5 rounded-lg bg-navy-800 hover:bg-navy-700 text-slate-400 hover:text-white transition-colors cursor-pointer"
                  title="Copy Account Number"
                >
                  {copiedAccount ? (
                    <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />
                  ) : (
                    <Copy className="h-3.5 w-3.5" />
                  )}
                </button>
              </div>
            </div>

            <div className="space-y-1">
              <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 block">
                Account Holder Full Name
              </span>
              <span className="text-sm font-semibold text-slate-200 block">
                {payoutAccount.accountHolder}
              </span>
            </div>
          </div>

          {/* Routing, Branch & Schedule Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 pt-3 border-t border-white/10 text-xs">
            <div className="space-y-0.5">
              <span className="text-slate-400 text-[11px] block">Branch &amp; Routing:</span>
              <span className="text-slate-200 font-medium">
                {payoutAccount.branchName || 'Online Banking'}{' '}
                {payoutAccount.routingNumber && payoutAccount.routingNumber !== '—' && (
                  <span className="font-mono text-slate-400 text-[11px]">
                    (Routing: {payoutAccount.routingNumber})
                  </span>
                )}
              </span>
            </div>

            <div className="space-y-0.5">
              <span className="text-slate-400 text-[11px] block">Payout Frequency:</span>
              <span className="text-emerald-400 font-semibold flex items-center gap-1.5">
                <Clock className="h-3.5 w-3.5 text-emerald-400" />
                {payoutAccount.frequency} Disbursement
              </span>
            </div>

            <div className="space-y-0.5 sm:col-span-2 lg:col-span-1">
              <span className="text-slate-400 text-[11px] block">Settlement Currency:</span>
              <span className="text-slate-200 font-medium font-mono">BDT (Bangladeshi Taka)</span>
            </div>
          </div>

          {/* Cheque Leaf Verification Row */}
          <div className="pt-3 border-t border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2 text-slate-400 min-w-0">
              <FileText className="h-4 w-4 text-emerald-400 shrink-0" />
              <span className="text-slate-400 shrink-0">Cheque Leaf Document:</span>
              <span className="font-mono text-slate-300 text-[11px] truncate">
                {payoutAccount.chequeLeafUrl
                  ? 'cheque_leaf_attachment'
                  : 'No cheque leaf submitted'}
              </span>
            </div>

            {payoutAccount.chequeLeafUrl ? (
              <button
                type="button"
                onClick={() => setIsViewerOpen(true)}
                className="px-3 py-1.5 rounded-lg bg-navy-800 hover:bg-navy-700 text-slate-200 hover:text-white text-xs font-semibold flex items-center gap-1.5 transition-colors border border-white/10 cursor-pointer self-start sm:self-auto shrink-0 shadow-sm"
              >
                <Eye className="h-3.5 w-3.5 text-emerald-400" />
                <span>View Cheque Leaf</span>
              </button>
            ) : (
              <span className="text-amber-400 text-xs italic flex items-center gap-1">
                <AlertCircle className="h-3.5 w-3.5" />
                Optional for MFS · Recommended for Bank
              </span>
            )}
          </div>
        </div>
      )}

      {/* Cheque Document Viewer Modal */}
      <DocumentViewerModal
        isOpen={isViewerOpen}
        onClose={() => setIsViewerOpen(false)}
        title="Disbursement Bank Cheque Leaf"
        subtitle={`Submitted for ${payoutAccount.accountHolder} (${payoutAccount.provider})`}
        documentUrl={payoutAccount.chequeLeafUrl}
      />
    </div>
  );
}
