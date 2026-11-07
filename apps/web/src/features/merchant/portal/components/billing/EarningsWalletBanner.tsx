'use client';

import React from 'react';
import { Wallet, Smartphone, Building2, CheckCircle2, ArrowRight } from 'lucide-react';
import { PayoutAccount } from '../../types';

interface EarningsWalletBannerProps {
  availableBalance: number;
  readyToClaim: number;
  upcomingPayout: number;
  totalPaidOut: number;
  payoutAccount?: PayoutAccount;
  onRequestPayout: () => void;
  onManageAccount: () => void;
}

export function EarningsWalletBanner({
  availableBalance,
  readyToClaim,
  upcomingPayout,
  totalPaidOut,
  payoutAccount,
  onRequestPayout,
  onManageAccount,
}: EarningsWalletBannerProps) {
  const isBkash = payoutAccount?.provider?.toLowerCase().includes('bkash') || Boolean(payoutAccount?.bkashMerchantNumber);
  const isNagad = payoutAccount?.provider?.toLowerCase().includes('nagad');

  const providerLabel = isBkash
    ? 'bKash'
    : isNagad
    ? 'Nagad'
    : payoutAccount?.provider || 'BRAC Bank PLC';

  const accountNumber = isBkash
    ? payoutAccount?.bkashMerchantNumber || payoutAccount?.accountNumber || '01711-234567'
    : payoutAccount?.accountNumber || '1501204892019001';

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
      {/* Left: Available Balance & Request Payout Action */}
      <div className="lg:col-span-8 rounded-2xl bg-gradient-to-br from-slate-900 via-slate-900 to-slate-950 border border-slate-800 p-5 sm:p-6 shadow-sm flex flex-col justify-between">
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <div className="flex items-center gap-2 text-slate-400 text-xs font-semibold">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <span className="uppercase tracking-wider">Available balance (Wallet)</span>
              </div>
              <div className="text-3xl sm:text-4xl font-extrabold text-slate-100 tracking-tight mt-1.5 flex items-baseline gap-1.5">
                <span className="text-emerald-400">৳</span>
                <span>{availableBalance.toLocaleString()}</span>
              </div>
              <p className="text-xs text-slate-400 mt-1">
                Available for your next payout (Min payout: ৳1,000 on eligible accounts)
              </p>
            </div>

            <button
              type="button"
              onClick={onRequestPayout}
              disabled={availableBalance < 1000}
              className={`px-5 py-2.5 rounded-xl font-bold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-md transition-all cursor-pointer shrink-0 ${
                availableBalance >= 1000
                  ? 'bg-emerald-500 hover:bg-emerald-400 text-slate-950 hover:shadow-emerald-500/20'
                  : 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700'
              }`}
            >
              <Wallet className="h-4 w-4" />
              <span>Request payout</span>
            </button>
          </div>
        </div>

        {/* Sub-stats bottom bar */}
        <div className="grid grid-cols-3 gap-2 pt-5 mt-4 border-t border-slate-800/80 text-xs">
          <div>
            <span className="text-slate-400 block text-[11px]">Ready to claim:</span>
            <span className="font-bold text-emerald-400 text-xs sm:text-sm">
              ৳ {readyToClaim.toLocaleString()}
            </span>
          </div>

          <div className="border-x border-slate-800/80 px-2 sm:px-4">
            <span className="text-slate-400 block text-[11px]">Upcoming Payout:</span>
            <span className="font-bold text-amber-400 text-xs sm:text-sm">
              ৳ {upcomingPayout.toLocaleString()}
            </span>
          </div>

          <div className="text-right sm:text-left">
            <span className="text-slate-400 block text-[11px]">Total Paid Out:</span>
            <span className="font-bold text-slate-200 text-xs sm:text-sm">
              ৳ {totalPaidOut.toLocaleString()}
            </span>
          </div>
        </div>
      </div>

      {/* Right: Payout Account Card */}
      <div className="lg:col-span-4 rounded-2xl bg-slate-900 border border-slate-800 p-5 sm:p-6 shadow-sm flex flex-col justify-between">
        <div>
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Payout account
            </span>
            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 flex items-center gap-1">
              <CheckCircle2 className="h-3 w-3" />
              <span>Account verified</span>
            </span>
          </div>

          <div className="mt-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center shrink-0 text-emerald-400">
              {isBkash || isNagad ? (
                <Smartphone className="h-5 w-5" />
              ) : (
                <Building2 className="h-5 w-5" />
              )}
            </div>
            <div>
              <h4 className="font-bold text-sm text-slate-100">{providerLabel}</h4>
              <p className="text-xs text-slate-400 font-mono mt-0.5">{accountNumber}</p>
            </div>
          </div>

          <p className="text-[11px] text-slate-400 mt-3 leading-relaxed">
            The payout method can be used to receive earnings. Fast settlements are cleared directly to this account.
          </p>
        </div>

        <button
          type="button"
          onClick={onManageAccount}
          className="mt-4 pt-3 border-t border-slate-800 text-xs font-semibold text-emerald-400 hover:text-emerald-300 flex items-center gap-1 transition-colors group cursor-pointer"
        >
          <span>Manage payout account</span>
          <ArrowRight className="h-3.5 w-3.5 group-hover:translate-x-0.5 transition-transform" />
        </button>
      </div>
    </div>
  );
}
