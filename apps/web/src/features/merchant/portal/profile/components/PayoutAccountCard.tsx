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
  ExternalLink,
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

  const handleCopyAccount = async () => {
    try {
      await navigator.clipboard.writeText(payoutAccount.accountNumber);
      setCopiedAccount(true);
      setTimeout(() => setCopiedAccount(false), 2000);
    } catch {
      setCopiedAccount(true);
      setTimeout(() => setCopiedAccount(false), 2000);
    }
  };

  return (
    <div className="p-5 sm:p-6 rounded-2xl bg-slate-900 border border-slate-800 shadow-md relative overflow-hidden space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-800">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 shrink-0">
            <CreditCard className="h-5 w-5" />
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-base font-bold text-slate-100">COD Payout &amp; Disbursement</h2>
              <VerificationStatusBadge status={payoutAccount.status} />
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Net COD customer remittances deposited to this designated account.
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={onManagePayout}
          className="inline-flex items-center justify-center gap-1.5 px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white border border-slate-700 rounded-xl text-xs font-semibold transition-colors cursor-pointer self-start sm:self-auto min-h-[38px]"
        >
          <Pencil className="h-3.5 w-3.5 text-indigo-400" />
          <span>Configure Account</span>
        </button>
      </div>

      {/* Fintech Styled Bank Card Container */}
      <div className="p-5 sm:p-6 rounded-xl bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 border border-slate-800/90 shadow-lg relative overflow-hidden space-y-5 group hover:border-slate-700/80 transition-all">
        {/* Subtle decorative glow */}
        <div className="absolute top-0 right-0 -mr-16 -mt-16 h-36 w-36 rounded-full bg-emerald-500/5 blur-2xl pointer-events-none" />

        {/* Bank & Status Row */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="h-11 w-11 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shrink-0 shadow-inner">
              <Building2 className="h-5 w-5" />
            </div>
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">
                Primary Disbursement Bank
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
            {payoutAccount.status === 'VERIFIED' ? (
              <span className="px-2.5 py-1 rounded-md text-[11px] font-bold bg-teal-500/10 text-teal-300 border border-teal-500/30 flex items-center gap-1.5">
                <CheckCircle2 className="h-3.5 w-3.5 text-teal-400" />
                Verified for Payout
              </span>
            ) : (
              <span className="px-2.5 py-1 rounded-md text-[11px] font-bold bg-amber-500/10 text-amber-400 border border-amber-500/30 flex items-center gap-1.5">
                <AlertCircle className="h-3.5 w-3.5 text-amber-400" />
                Pending Verification
              </span>
            )}
          </div>
        </div>

        {/* Account Number & Holder */}
        <div className="pt-2 border-t border-slate-800/80 grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1">
            <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-500 block">
              Account Number / MFS #
            </span>
            <div className="flex items-center gap-2">
              <span className="font-mono text-base sm:text-lg font-bold text-slate-100 tracking-wider">
                {payoutAccount.accountNumber}
              </span>
              <button
                type="button"
                onClick={handleCopyAccount}
                className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors cursor-pointer"
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
            <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-500 block">
              Account Holder Full Name
            </span>
            <span className="text-sm font-semibold text-slate-200 block">
              {payoutAccount.accountHolder}
            </span>
          </div>
        </div>

        {/* Routing, Branch & Schedule Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 pt-3 border-t border-slate-800/80 text-xs">
          <div className="space-y-0.5">
            <span className="text-slate-500 text-[11px] block">Branch &amp; Routing:</span>
            <span className="text-slate-300 font-medium">
              {payoutAccount.branchName || 'Online Banking'}{' '}
              {payoutAccount.routingNumber && (
                <span className="font-mono text-slate-400 text-[11px]">
                  (Routing: {payoutAccount.routingNumber})
                </span>
              )}
            </span>
          </div>

          <div className="space-y-0.5">
            <span className="text-slate-500 text-[11px] block">Payout Frequency:</span>
            <span className="text-emerald-400 font-semibold flex items-center gap-1.5">
              <Clock className="h-3.5 w-3.5 text-emerald-400" />
              {payoutAccount.frequency} Disbursement
            </span>
          </div>

          <div className="space-y-0.5 sm:col-span-2 lg:col-span-1">
            <span className="text-slate-500 text-[11px] block">Settlement Currency:</span>
            <span className="text-slate-300 font-medium font-mono">BDT (Bangladeshi Taka)</span>
          </div>
        </div>

        {/* Cheque Leaf Verification Row */}
        <div className="pt-3 border-t border-slate-800/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2 text-slate-400 min-w-0">
            <FileText className="h-4 w-4 text-emerald-400 shrink-0" />
            <span className="text-slate-400 shrink-0">Cheque Leaf Document:</span>
            <span className="font-mono text-slate-300 text-[11px] truncate">
              {payoutAccount.chequeLeafUrl
                ? 'cheque_leaf_verified_attachment.png'
                : 'No cheque leaf submitted'}
            </span>
          </div>

          {payoutAccount.chequeLeafUrl ? (
            <button
              type="button"
              onClick={() => setIsViewerOpen(true)}
              className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white text-xs font-semibold flex items-center gap-1.5 transition-colors border border-slate-700 cursor-pointer self-start sm:self-auto shrink-0 shadow-sm"
            >
              <Eye className="h-3.5 w-3.5 text-emerald-400" />
              <span>View Cheque Leaf</span>
            </button>
          ) : (
            <span className="text-amber-400 text-xs italic flex items-center gap-1">
              <AlertCircle className="h-3.5 w-3.5" />
              Upload required for bank verification
            </span>
          )}
        </div>
      </div>

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
