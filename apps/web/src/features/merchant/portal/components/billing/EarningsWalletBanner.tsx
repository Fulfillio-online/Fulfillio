'use client';

import React from 'react';
import {
  Wallet,
  Smartphone,
  Building2,
  CheckCircle2,
  ArrowRight,
  Sparkles,
  AlertTriangle,
} from 'lucide-react';
import { PayoutAccount } from '../../types';

interface EarningsWalletBannerProps {
  availableBalance: number;
  readyToClaim: number;
  withdrawableTotal: number;
  pendingEarnings: number;
  upcomingPayout: number;
  totalPaidOut: number;
  minPayoutAmount: number;
  returnWindowDays: number;
  clawbackDeficit?: number;
  payoutAccount?: PayoutAccount;
  isClaiming?: boolean;
  onClaimAll: () => void;
  onRequestPayout: () => void;
  onManageAccount: () => void;
}

export function EarningsWalletBanner({
  availableBalance,
  readyToClaim,
  withdrawableTotal,
  pendingEarnings,
  upcomingPayout,
  totalPaidOut,
  minPayoutAmount,
  returnWindowDays,
  clawbackDeficit = 0,
  payoutAccount,
  isClaiming = false,
  onClaimAll,
  onRequestPayout,
  onManageAccount,
}: EarningsWalletBannerProps) {
  const providerLower = (payoutAccount?.provider || '').toLowerCase();
  const isBkash = providerLower.includes('bkash') || Boolean(payoutAccount?.bkashMerchantNumber);
  const isNagad = providerLower.includes('nagad');
  const isRocket = providerLower.includes('rocket');

  const providerLabel = payoutAccount?.provider?.trim()
    ? payoutAccount.provider
    : isBkash
      ? 'bKash'
      : isNagad
        ? 'Nagad'
        : isRocket
          ? 'Rocket'
          : 'Payout Account Not Set';

  const accountNumber = isBkash
    ? payoutAccount?.bkashMerchantNumber || payoutAccount?.accountNumber || 'Not configured'
    : payoutAccount?.accountNumber || 'Not configured';

  const canWithdraw = withdrawableTotal >= minPayoutAmount;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
      {/* Left: Wallet, Claim Stage & Request Payout */}
      <div className="lg:col-span-8 rounded-2xl bg-gradient-to-br from-white via-slate-50 to-orange-50/40 dark:from-navy-900 dark:via-navy-900 dark:to-navy-950 border border-slate-200/80 dark:border-white/10 p-5 sm:p-6 shadow-sm flex flex-col justify-between">
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400 text-xs font-semibold">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <span className="uppercase tracking-wider">Withdrawable Balance (Wallet + Claimable)</span>
              </div>
              <div className="text-3xl sm:text-4xl font-black text-navy-900 dark:text-white tracking-tight mt-1.5 flex items-baseline gap-1.5 tabular-nums">
                <span className="text-orange-600 dark:text-orange-400">৳</span>
                <span>{withdrawableTotal.toLocaleString()}</span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                Wallet: <strong className="text-navy-900 dark:text-white tabular-nums">৳{availableBalance.toLocaleString()}</strong>
                {' · '}
                Ready to Claim: <strong className="text-emerald-600 dark:text-emerald-400 tabular-nums">৳{readyToClaim.toLocaleString()}</strong>
                {' · '}
                Min payout: <strong className="tabular-nums">৳{minPayoutAmount.toLocaleString()}</strong>
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2 shrink-0">
              {readyToClaim > 0 && (
                <button
                  type="button"
                  onClick={onClaimAll}
                  disabled={isClaiming}
                  className="px-4 py-2.5 rounded-xl bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-700 dark:text-emerald-300 border border-emerald-500/35 font-bold text-xs sm:text-sm flex items-center justify-center gap-1.5 transition-all cursor-pointer disabled:opacity-60"
                >
                  <Sparkles className="h-4 w-4" />
                  <span>
                    {isClaiming ? 'Claiming...' : `Claim ৳${readyToClaim.toLocaleString()} to Wallet`}
                  </span>
                </button>
              )}

              <button
                type="button"
                onClick={onRequestPayout}
                disabled={!canWithdraw}
                className={`px-5 py-2.5 rounded-xl font-bold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-md transition-all cursor-pointer shrink-0 ${
                  canWithdraw
                    ? 'bg-orange-600 hover:bg-orange-500 text-white shadow-orange-600/20'
                    : 'bg-slate-100 dark:bg-navy-800 text-slate-400 dark:text-slate-500 cursor-not-allowed border border-slate-200 dark:border-white/10 shadow-none'
                }`}
              >
                <Wallet className="h-4 w-4" />
                <span>Request Payout</span>
              </button>
            </div>
          </div>

          {clawbackDeficit > 0 && (
            <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-700 dark:text-rose-300 text-xs flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span>
                Return adjustment of ৳{clawbackDeficit.toLocaleString()} from refunded order(s) is being offset against incoming claimable earnings.
              </span>
            </div>
          )}
        </div>

        {/* Bottom Stats Bar */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-5 mt-4 border-t border-slate-200/80 dark:border-white/10 text-xs">
          <div>
            <span className="text-slate-500 dark:text-slate-400 block text-[11px]">
              Pending ({returnWindowDays}d Return Hold)
            </span>
            <span className="font-bold text-amber-600 dark:text-amber-400 text-xs sm:text-sm tabular-nums">
              ৳ {pendingEarnings.toLocaleString()}
            </span>
          </div>

          <div className="sm:border-l sm:border-slate-200/80 dark:sm:border-white/10 sm:pl-3">
            <span className="text-slate-500 dark:text-slate-400 block text-[11px]">Ready to Claim</span>
            <span className="font-bold text-emerald-600 dark:text-emerald-400 text-xs sm:text-sm tabular-nums">
              ৳ {readyToClaim.toLocaleString()}
            </span>
          </div>

          <div className="sm:border-l sm:border-slate-200/80 dark:sm:border-white/10 sm:pl-3">
            <span className="text-slate-500 dark:text-slate-400 block text-[11px]">Requested / Queued</span>
            <span className="font-bold text-orange-600 dark:text-orange-400 text-xs sm:text-sm tabular-nums">
              ৳ {upcomingPayout.toLocaleString()}
            </span>
          </div>

          <div className="sm:border-l sm:border-slate-200/80 dark:sm:border-white/10 sm:pl-3">
            <span className="text-slate-500 dark:text-slate-400 block text-[11px]">Total Paid Out</span>
            <span className="font-bold text-navy-900 dark:text-slate-100 text-xs sm:text-sm tabular-nums">
              ৳ {totalPaidOut.toLocaleString()}
            </span>
          </div>
        </div>
      </div>

      {/* Right: Payout Account Card */}
      <div className="lg:col-span-4 rounded-2xl bg-white dark:bg-navy-900 border border-slate-200/80 dark:border-white/10 p-5 sm:p-6 shadow-sm flex flex-col justify-between">
        <div>
          <div className="flex items-center justify-between gap-2">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Payout account
            </span>
            {payoutAccount?.status === 'VERIFIED' ? (
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 inline-flex items-center gap-1 select-none">
                <CheckCircle2 className="h-3 w-3" />
                <span>Verified</span>
              </span>
            ) : payoutAccount?.status === 'PENDING_REVIEW' ? (
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/15 text-amber-600 dark:text-amber-300 border border-amber-500/30 inline-flex items-center gap-1 select-none">
                <span>Pending Approval</span>
              </span>
            ) : payoutAccount?.status === 'REJECTED' ? (
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-500/15 text-rose-600 dark:text-rose-400 border border-rose-500/30 inline-flex items-center gap-1 select-none">
                <span>Rejected</span>
              </span>
            ) : (
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 dark:bg-navy-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-white/10 inline-flex items-center gap-1 select-none">
                <span>Not Configured</span>
              </span>
            )}
          </div>

          <div className="mt-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-orange-500/10 border border-orange-500/20 flex items-center justify-center shrink-0 text-orange-600 dark:text-orange-400">
              {isBkash || isNagad || isRocket ? (
                <Smartphone className="h-5 w-5" />
              ) : (
                <Building2 className="h-5 w-5" />
              )}
            </div>
            <div className="min-w-0">
              <h4 className="font-bold text-sm text-navy-900 dark:text-white truncate">
                {providerLabel}
              </h4>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-mono mt-0.5 truncate">
                {accountNumber}
              </p>
            </div>
          </div>

          <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-3 leading-relaxed">
            Every payout settled to this destination includes a mandatory Transaction ID and verified digital receipt proof.
          </p>
        </div>

        <button
          type="button"
          onClick={onManageAccount}
          className="mt-4 pt-3 border-t border-slate-200/80 dark:border-white/10 text-xs font-semibold text-orange-600 dark:text-orange-400 hover:text-orange-500 flex items-center gap-1 transition-colors group cursor-pointer"
        >
          <span>Manage payout account</span>
          <ArrowRight className="h-3.5 w-3.5 group-hover:translate-x-0.5 transition-transform" />
        </button>
      </div>
    </div>
  );
}
