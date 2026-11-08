import React, { useState } from 'react';
import { Landmark, Eye } from 'lucide-react';
import { Modal } from '@/components/admin/AdminModal';
import { MerchantRecord } from '../../types';

export interface MerchantBankDetailsTabProps {
  merchant: MerchantRecord;
}

export function MerchantBankDetailsTab({ merchant }: MerchantBankDetailsTabProps) {
  const [isChequePreviewOpen, setIsChequePreviewOpen] = useState(false);

  return (
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
          <span className="px-3 py-1 rounded-full text-xs font-bold bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30">
            {merchant.payoutAccount.status}
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
          <div className="rounded-xl bg-slate-50 dark:bg-navy-950 border border-slate-200 dark:border-white/10 p-3.5">
            <span className="text-[11px] uppercase font-bold text-slate-500 dark:text-slate-400 block">
              BANK NAME
            </span>
            <span className="font-bold text-navy-800 dark:text-white mt-0.5 block">
              {merchant.payoutAccount.provider}
            </span>
          </div>

          <div className="rounded-xl bg-slate-50 dark:bg-navy-950 border border-slate-200 dark:border-white/10 p-3.5">
            <span className="text-[11px] uppercase font-bold text-slate-500 dark:text-slate-400 block">
              ACCOUNT HOLDER
            </span>
            <span className="font-bold text-navy-800 dark:text-white mt-0.5 block">
              {merchant.payoutAccount.accountHolder}
            </span>
          </div>

          <div className="rounded-xl bg-slate-50 dark:bg-navy-950 border border-slate-200 dark:border-white/10 p-3.5">
            <span className="text-[11px] uppercase font-bold text-slate-500 dark:text-slate-400 block">
              ACCOUNT NUMBER
            </span>
            <span className="tabular-nums font-bold text-orange-600 dark:text-orange-400 mt-0.5 block">
              {merchant.payoutAccount.accountNumber}
            </span>
          </div>

          <div className="rounded-xl bg-slate-50 dark:bg-navy-950 border border-slate-200 dark:border-white/10 p-3.5">
            <span className="text-[11px] uppercase font-bold text-slate-500 dark:text-slate-400 block">
              BRANCH &amp; ROUTING NO
            </span>
            <span className="font-medium text-navy-800 dark:text-slate-100 mt-0.5 block">
              {merchant.payoutAccount.branchName} ({merchant.payoutAccount.routingNumber})
            </span>
          </div>

          <div className="rounded-xl bg-slate-50 dark:bg-navy-950 border border-slate-200 dark:border-white/10 p-3.5">
            <span className="text-[11px] uppercase font-bold text-slate-500 dark:text-slate-400 block">
              BKASH MERCHANT NUMBER
            </span>
            <span className="tabular-nums font-bold text-pink-400 mt-0.5 block">
              {merchant.payoutAccount.bkashNumber}
            </span>
          </div>

          <div className="rounded-xl bg-slate-50 dark:bg-navy-950 border border-slate-200 dark:border-white/10 p-3.5">
            <span className="text-[11px] uppercase font-bold text-slate-500 dark:text-slate-400 block">
              DISBURSEMENT SCHEDULE
            </span>
            <span className="font-bold text-indigo-600 dark:text-indigo-400 mt-0.5 block">
              {merchant.payoutAccount.frequency}
            </span>
          </div>
        </div>

        <div className="pt-2">
          <button
            type="button"
            onClick={() => setIsChequePreviewOpen(true)}
            className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-navy-800 hover:bg-slate-200 dark:hover:bg-navy-700 text-xs font-bold text-navy-800 dark:text-slate-100 flex items-center gap-2 cursor-pointer transition-colors"
          >
            <Eye className="w-4 h-4 text-orange-600 dark:text-orange-400" />
            <span>View Verified Cheque Leaf</span>
          </button>
        </div>
      </div>

      {/* Right: Balance Ledger */}
      <div className="lg:col-span-5 space-y-4">
        <div className="rounded-2xl border border-slate-200 dark:border-white/10 bg-gradient-to-br from-orange-600/60 to-white dark:to-navy-900 p-6 space-y-2 shadow-lg">
          <span className="text-xs font-bold uppercase tracking-wider text-orange-600 dark:text-orange-400">
            Available COD Balance
          </span>
          <div className="text-3xl font-extrabold text-navy-800 dark:text-white tabular-nums">
            ৳{merchant.payoutAccount.availableBalance.toLocaleString()}
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
            ৳{merchant.payoutAccount.lastPayoutAmount.toLocaleString()}
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
            <span className="font-bold text-orange-600 dark:text-orange-500">FULFILLIO KYC VERIFIED</span>
          </div>
        </div>
      </Modal>
    </div>
  );
}
