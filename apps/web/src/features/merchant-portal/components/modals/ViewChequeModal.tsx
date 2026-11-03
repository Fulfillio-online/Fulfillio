'use client';

import React from 'react';
import { CheckCircle2, FileText } from 'lucide-react';
import { Modal } from '@/components/ui';
import { PayoutAccount } from '../../types';

interface ViewChequeModalProps {
  isOpen: boolean;
  onClose: () => void;
  payoutAccount: PayoutAccount;
}

export function ViewChequeModal({
  isOpen,
  onClose,
  payoutAccount,
}: ViewChequeModalProps) {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Verified Cheque Leaf"
      subtitle={`${payoutAccount.provider} · A/C: ${payoutAccount.accountNumber}`}
      size="md"
    >
      <div className="space-y-4 text-xs">
        <div className="rounded-xl border border-slate-800 bg-slate-950 p-4 space-y-3">
          <div className="flex items-center justify-between border-b border-slate-800 pb-2">
            <div className="flex items-center gap-2">
              <FileText className="h-4 w-4 text-emerald-400" />
              <span className="font-bold text-slate-200">Cheque Verification Certificate</span>
            </div>
            {payoutAccount.status === 'VERIFIED' && (
              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 flex items-center gap-1">
                <CheckCircle2 className="h-3 w-3" />
                Verified
              </span>
            )}
          </div>

          <div className="aspect-video w-full rounded-lg bg-slate-900 border border-slate-800 flex flex-col items-center justify-center p-4 text-center">
            <div className="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 mb-2">
              <FileText className="w-6 h-6" />
            </div>
            <p className="font-mono text-xs font-bold text-slate-300">
              {payoutAccount.provider} — MICR CHEQUE LEAF
            </p>
            <p className="text-[11px] text-slate-500 mt-1">
              Account Holder: {payoutAccount.accountHolder} · Routing: {payoutAccount.routingNumber}
            </p>
          </div>

          <div className="text-[11px] text-slate-400 leading-relaxed">
            This cheque leaf was reviewed and verified by Fulfillio Finance Compliance. COD earnings
            are disbursed directly to this account every Friday.
          </div>
        </div>

        <div className="flex justify-end pt-2">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-300 cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </Modal>
  );
}
