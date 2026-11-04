'use client';

import React, { useState } from 'react';
import { CreditCard, Eye, Pencil, ShieldCheck, Clock, FileText } from 'lucide-react';
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

  return (
    <div className="p-5 sm:p-6 rounded-2xl bg-slate-900 border border-slate-800 shadow-sm relative overflow-hidden">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-5 border-b border-slate-800">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
            <CreditCard className="h-5 w-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-bold text-slate-100">COD Payout & Disbursement Account</h3>
              <VerificationStatusBadge status={payoutAccount.status} />
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Net COD revenue deposited according to chosen disbursement schedule
            </p>
          </div>
        </div>

        <button
          onClick={onManagePayout}
          className="px-3.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors self-start sm:self-auto"
        >
          <Pencil className="h-3.5 w-3.5 text-indigo-400" />
          <span>Configure Account</span>
        </button>
      </div>

      {/* Account Info Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-5 text-xs">
        <div className="space-y-1">
          <span className="text-slate-500 uppercase tracking-wider font-semibold text-[10px]">
            Bank / MFS Provider
          </span>
          <p className="text-slate-100 font-bold">{payoutAccount.provider}</p>
          <span className="text-slate-400 text-[11px] block">{payoutAccount.branchName || 'Online Banking'}</span>
        </div>

        <div className="space-y-1">
          <span className="text-slate-500 uppercase tracking-wider font-semibold text-[10px]">
            Account Holder & Number
          </span>
          <p className="text-slate-200 font-semibold">{payoutAccount.accountHolder}</p>
          <p className="font-mono text-emerald-400 font-bold text-xs tracking-wider">
            {payoutAccount.accountNumber}
          </p>
        </div>

        <div className="space-y-1">
          <span className="text-slate-500 uppercase tracking-wider font-semibold text-[10px]">
            Routing & Schedule
          </span>
          <p className="font-mono text-slate-300">
            Routing: <strong className="text-slate-200">{payoutAccount.routingNumber || 'N/A'}</strong>
          </p>
          <span className="text-indigo-400 text-[11px] font-semibold block">
            {payoutAccount.frequency} Disbursement
          </span>
        </div>

        <div className="space-y-1">
          <span className="text-slate-500 uppercase tracking-wider font-semibold text-[10px]">
            Cheque Leaf Verification
          </span>
          <div>
            {payoutAccount.chequeLeafUrl ? (
              <button
                onClick={() => setIsViewerOpen(true)}
                className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors"
              >
                <Eye className="h-3.5 w-3.5 text-emerald-400" />
                <span>View Cheque Leaf</span>
              </button>
            ) : (
              <span className="text-amber-400 text-[11px] italic">No cheque leaf uploaded</span>
            )}
          </div>
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
