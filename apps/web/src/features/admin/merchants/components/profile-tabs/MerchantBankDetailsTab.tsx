import React, { useState } from 'react';
import { Landmark, Eye, CheckCircle2, XCircle, Clock, AlertTriangle } from 'lucide-react';
import { Modal } from '@/components/admin/AdminModal';
import { MerchantRecord } from '../../types';

export interface MerchantBankDetailsTabProps {
  merchant: MerchantRecord;
  onApprovePayout?: () => void;
  onRejectPayout?: (reason?: string) => void;
}

export function MerchantBankDetailsTab({
  merchant,
  onApprovePayout,
  onRejectPayout,
}: MerchantBankDetailsTabProps) {
  const [isChequePreviewOpen, setIsChequePreviewOpen] = useState(false);
  const [showRejectInput, setShowRejectInput] = useState(false);
  const [rejectReason, setRejectReason] = useState('');

  const hasPayoutDetails = Boolean(
    merchant.payoutAccount?.accountNumber?.trim() ||
      merchant.payoutAccount?.bkashNumber?.trim()
  );
  const payoutStatus = hasPayoutDetails
    ? merchant.payoutAccount?.status || 'PENDING_REVIEW'
    : merchant.payoutAccount?.status === 'REJECTED'
      ? 'REJECTED'
      : 'UNVERIFIED';
  const isPending = payoutStatus === 'PENDING_REVIEW';
  const isRejected = payoutStatus === 'REJECTED';
  const isUnverified = payoutStatus === 'UNVERIFIED';

  return (
    <div className="space-y-5">
      {/* Unconfigured / Not Yet Submitted Banner */}
      {isUnverified && (
        <div className="rounded-2xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-navy-900/60 p-4 sm:p-5 flex items-start gap-3">
          <div className="h-10 w-10 rounded-xl bg-slate-200/70 dark:bg-navy-800 border border-slate-300/70 dark:border-white/10 flex items-center justify-center text-slate-600 dark:text-slate-300 shrink-0">
            <Landmark className="w-5 h-5" />
          </div>
          <div>
            <h4 className="text-sm font-bold text-navy-900 dark:text-white">
              No Payment Details Added Yet
            </h4>
            <p className="text-xs text-slate-600 dark:text-slate-300 mt-0.5 leading-relaxed">
              This merchant has not submitted any Bank or MFS payout account details from their portal yet. Once submitted, they will appear here for Admin verification.
            </p>
          </div>
        </div>
      )}

      {/* Pending Approval Action Banner */}
      {isPending && (
        <div className="rounded-2xl border border-amber-500/30 bg-amber-500/10 p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="h-10 w-10 rounded-xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-amber-600 dark:text-amber-400 shrink-0">
              <Clock className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-amber-900 dark:text-amber-200">
                Payment Details Pending Admin Approval
              </h4>
              <p className="text-xs text-amber-800/80 dark:text-amber-300/80 mt-0.5 leading-relaxed">
                This merchant submitted new or updated payout account details from their portal. Verify the bank/MFS details and cheque leaf before approving COD disbursements.
              </p>
            </div>
          </div>
          {(onApprovePayout || onRejectPayout) && (
            <div className="flex items-center gap-2 shrink-0 flex-wrap">
              {onApprovePayout && (
                <button
                  type="button"
                  onClick={onApprovePayout}
                  className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center gap-1.5 shadow-md shadow-emerald-500/20 transition-all cursor-pointer"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Approve Payout Account</span>
                </button>
              )}
              {onRejectPayout && (
                <button
                  type="button"
                  onClick={() => setShowRejectInput((prev) => !prev)}
                  className="px-3.5 py-2 rounded-xl bg-rose-500/15 hover:bg-rose-500/25 border border-rose-500/30 text-rose-700 dark:text-rose-300 text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  <XCircle className="w-4 h-4" />
                  <span>Reject</span>
                </button>
              )}
            </div>
          )}
        </div>
      )}

      {/* Rejected Banner */}
      {isRejected && (
        <div className="rounded-2xl border border-rose-500/30 bg-rose-500/10 p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-rose-500 shrink-0 mt-0.5" />
            <div>
              <h4 className="text-sm font-bold text-rose-800 dark:text-rose-200">
                Payout Account Rejected
              </h4>
              <p className="text-xs text-rose-700/80 dark:text-rose-300/80 mt-0.5">
                {merchant.payoutAccount?.rejectionReason
                  ? `Reason: ${merchant.payoutAccount.rejectionReason}`
                  : 'Merchant must resubmit valid bank or MFS payout details.'}
              </p>
            </div>
          </div>
          {onApprovePayout && (
            <button
              type="button"
              onClick={onApprovePayout}
              className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer shrink-0"
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Approve Anyway</span>
            </button>
          )}
        </div>
      )}

      {/* Optional Rejection Reason Box */}
      {showRejectInput && onRejectPayout && (
        <div className="rounded-xl border border-rose-500/30 bg-white dark:bg-navy-900 p-4 flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
          <input
            type="text"
            value={rejectReason}
            onChange={(e) => setRejectReason(e.target.value)}
            placeholder="Enter rejection reason (e.g. Cheque leaf unclear / Account name mismatch)"
            className="flex-1 px-3 py-2 rounded-lg bg-slate-50 dark:bg-navy-950 border border-slate-200 dark:border-white/10 text-xs text-navy-900 dark:text-white focus:outline-none focus:border-rose-500"
          />
          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={() => {
                setShowRejectInput(false);
                setRejectReason('');
              }}
              className="px-3 py-2 rounded-lg bg-slate-100 dark:bg-navy-800 text-xs font-semibold text-slate-600 dark:text-slate-300 cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={() => {
                onRejectPayout(rejectReason.trim() || 'Payout details verification failed');
                setShowRejectInput(false);
                setRejectReason('');
              }}
              className="px-4 py-2 rounded-lg bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold cursor-pointer"
            >
              Confirm Reject
            </button>
          </div>
        </div>
      )}

    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
      {/* Left: Account Coordinates */}
      <div className="lg:col-span-7 rounded-2xl border border-slate-200 dark:border-white/10 bg-white/90 dark:bg-navy-900/90 p-6 space-y-5 shadow-xl">
        <div className="flex items-center justify-between border-b border-slate-200 dark:border-white/10 pb-4">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
              <Landmark className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-navy-800 dark:text-white">
                Default Payout Account ({merchant.merchantCode})
              </h3>
              <p className="text-xs text-slate-600 dark:text-slate-300">
                Verified bank and mobile financial account for weekly COD disbursements.
              </p>
            </div>
          </div>
          <span
            className={`px-3 py-1 rounded-full text-xs font-bold border ${
              isPending
                ? 'bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/30'
                : isRejected
                ? 'bg-rose-500/15 text-rose-600 dark:text-rose-400 border-rose-500/30'
                : isUnverified
                ? 'bg-slate-100 dark:bg-navy-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-white/10'
                : 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30'
            }`}
          >
            {isPending
              ? 'PENDING REVIEW'
              : isRejected
              ? 'REJECTED'
              : isUnverified
              ? 'NOT CONFIGURED'
              : 'VERIFIED'}
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
          <div className="rounded-xl bg-slate-50 dark:bg-navy-950 border border-slate-200 dark:border-white/10 p-3.5">
            <span className="text-[11px] uppercase font-bold text-slate-500 dark:text-slate-400 block">
              BANK / MFS PROVIDER
            </span>
            <span className="font-bold text-navy-800 dark:text-white mt-0.5 block">
              {merchant.payoutAccount?.provider || 'Not Configured'}
            </span>
          </div>

          <div className="rounded-xl bg-slate-50 dark:bg-navy-950 border border-slate-200 dark:border-white/10 p-3.5">
            <span className="text-[11px] uppercase font-bold text-slate-500 dark:text-slate-400 block">
              ACCOUNT HOLDER
            </span>
            <span className="font-bold text-navy-800 dark:text-white mt-0.5 block">
              {merchant.payoutAccount?.accountHolder || '—'}
            </span>
          </div>

          <div className="rounded-xl bg-slate-50 dark:bg-navy-950 border border-slate-200 dark:border-white/10 p-3.5">
            <span className="text-[11px] uppercase font-bold text-slate-500 dark:text-slate-400 block">
              ACCOUNT NUMBER
            </span>
            <span className="tabular-nums font-bold text-orange-600 dark:text-orange-400 mt-0.5 block">
              {merchant.payoutAccount?.accountNumber || '—'}
            </span>
          </div>

          <div className="rounded-xl bg-slate-50 dark:bg-navy-950 border border-slate-200 dark:border-white/10 p-3.5">
            <span className="text-[11px] uppercase font-bold text-slate-500 dark:text-slate-400 block">
              BRANCH &amp; ROUTING NO
            </span>
            <span className="font-medium text-navy-800 dark:text-slate-100 mt-0.5 block">
              {merchant.payoutAccount?.branchName || '—'}
              {merchant.payoutAccount?.routingNumber ? ` (${merchant.payoutAccount.routingNumber})` : ''}
            </span>
          </div>

          <div className="rounded-xl bg-slate-50 dark:bg-navy-950 border border-slate-200 dark:border-white/10 p-3.5">
            <span className="text-[11px] uppercase font-bold text-slate-500 dark:text-slate-400 block">
              BKASH MERCHANT NUMBER
            </span>
            <span className="tabular-nums font-bold text-pink-400 mt-0.5 block">
              {merchant.payoutAccount?.bkashNumber || '—'}
            </span>
          </div>

          <div className="rounded-xl bg-slate-50 dark:bg-navy-950 border border-slate-200 dark:border-white/10 p-3.5">
            <span className="text-[11px] uppercase font-bold text-slate-500 dark:text-slate-400 block">
              DISBURSEMENT SCHEDULE
            </span>
            <span className="font-bold text-indigo-600 dark:text-indigo-400 mt-0.5 block">
              {merchant.payoutAccount?.frequency || 'Weekly'}
            </span>
          </div>
        </div>

        {hasPayoutDetails && (
          <div className="pt-2">
            <button
              type="button"
              onClick={() => setIsChequePreviewOpen(true)}
              className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-navy-800 hover:bg-slate-200 dark:hover:bg-navy-700 text-xs font-bold text-navy-800 dark:text-slate-100 flex items-center gap-2 cursor-pointer transition-colors"
            >
              <Eye className="w-4 h-4 text-orange-600 dark:text-orange-400" />
              <span>View Cheque Leaf</span>
            </button>
          </div>
        )}
      </div>

      {/* Right: Balance Ledger */}
      <div className="lg:col-span-5 space-y-4">
        <div className="rounded-2xl border border-slate-200 dark:border-white/10 bg-gradient-to-br from-orange-600/60 to-white dark:to-navy-900 p-6 space-y-2 shadow-lg">
          <span className="text-xs font-bold uppercase tracking-wider text-orange-600 dark:text-orange-400">
            Available COD Balance
          </span>
          <div className="text-3xl font-extrabold text-navy-800 dark:text-white tabular-nums">
            ৳{(merchant.payoutAccount?.availableBalance ?? 0).toLocaleString()}
          </div>
          <p className="text-xs text-slate-600 dark:text-slate-300">
            Net payable after 3PL Pick-Pack &amp; storage fee deductions.
          </p>
        </div>

        <div className="rounded-2xl border border-slate-200 dark:border-white/10 bg-white/80 dark:bg-navy-900/80 p-6 space-y-2 shadow-lg">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300">
            Last Disbursed Payout
          </span>
          <div className="text-2xl font-bold text-navy-800 dark:text-slate-100 tabular-nums">
            ৳{(merchant.payoutAccount?.lastPayoutAmount ?? 0).toLocaleString()}
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Settled via BEFTN bank transfer to {merchant.payoutAccount.provider}.
          </p>
        </div>
      </div>

      {/* Cheque Leaf Modal */}
      <Modal
        isOpen={isChequePreviewOpen}
        onClose={() => setIsChequePreviewOpen(false)}
        title={`Verified Bank Cheque Leaf · ${merchant.storeName}`}
        subtitle={`${merchant.payoutAccount.provider} — A/C: ${merchant.payoutAccount.accountNumber}`}
        size="md"
      >
        <div className="rounded-xl border border-slate-300 dark:border-white/15 p-6 flex flex-col justify-between h-56 relative overflow-hidden tabular-nums text-slate-200 dark:text-slate-700 bg-gradient-to-r from-orange-400 to-orange-400">
          <div className="flex justify-between items-start">
            <div>
              <span className="font-bold text-sm block text-orange-600 dark:text-orange-500">
                {merchant.payoutAccount.provider}
              </span>
              <span className="text-[11px] text-slate-400 dark:text-slate-500">
                {merchant.payoutAccount.branchName}
              </span>
            </div>
            <span className="text-xs font-bold text-slate-300 dark:text-slate-600">ACCOUNT PAYEE ONLY</span>
          </div>

          <div className="space-y-1.5 my-auto">
            <div className="border-b border-slate-400 dark:border-white/30 pb-1 text-xs">
              Pay: <strong>{merchant.payoutAccount.accountHolder}</strong>
            </div>
            <div className="border-b border-slate-400 dark:border-white/30 pb-1 text-xs">
              A/C No: <strong>{merchant.payoutAccount.accountNumber}</strong>
            </div>
          </div>

          <div className="flex justify-between text-[11px] text-slate-400 dark:text-slate-500 border-t border-slate-400 dark:border-white/30 pt-2">
            <span>⑆{merchant.payoutAccount.routingNumber}⑆</span>
            <span className="font-bold text-orange-600 dark:text-orange-500">
              {isPending ? 'PENDING VERIFICATION' : 'FULFILLIO KYC VERIFIED'}
            </span>
          </div>
        </div>
        {merchant.payoutAccount?.chequeLeafUrl && (
          <div className="mt-4 rounded-xl border border-slate-200 dark:border-white/10 overflow-hidden bg-slate-50 dark:bg-navy-950 p-2">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={merchant.payoutAccount.chequeLeafUrl}
              alt="Uploaded Cheque Leaf"
              className="w-full max-h-64 object-contain rounded-lg"
            />
          </div>
        )}
      </Modal>
    </div>
    </div>
  );
}
