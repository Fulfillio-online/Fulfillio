'use client';

import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { X, Wallet, Smartphone, Building2, AlertCircle, Sparkles } from 'lucide-react';
import { PayoutMethod } from '@fulfillio/contracts';
import { PayoutAccount } from '../../types';

interface RequestPayoutModalProps {
  isOpen: boolean;
  onClose: () => void;
  availableBalance: number;
  readyToClaim: number;
  withdrawableTotal: number;
  minPayoutAmount: number;
  payoutAccount?: PayoutAccount;
  onSubmit: (params: {
    amount: number;
    method: PayoutMethod;
    provider: string;
    accountNumber: string;
    accountHolder?: string;
    branchName?: string;
    routingNumber?: string;
    remarks?: string;
  }) => Promise<void>;
}

function inferMethodFromAccount(payoutAccount?: PayoutAccount): PayoutMethod {
  const provider = (payoutAccount?.provider || '').toLowerCase();
  if (provider.includes('nagad')) return PayoutMethod.NAGAD;
  if (provider.includes('rocket')) return PayoutMethod.ROCKET;
  if (provider.includes('bkash') || payoutAccount?.bkashMerchantNumber) return PayoutMethod.BKASH;
  if (payoutAccount?.accountNumber) return PayoutMethod.BANK_TRANSFER;
  return PayoutMethod.BKASH;
}

export function RequestPayoutModal({
  isOpen,
  onClose,
  availableBalance,
  readyToClaim,
  withdrawableTotal,
  minPayoutAmount,
  payoutAccount,
  onSubmit,
}: RequestPayoutModalProps) {
  const [mounted, setMounted] = useState(false);
  const [amount, setAmount] = useState<number>(0);
  const [method, setMethod] = useState<PayoutMethod>(PayoutMethod.BKASH);
  const [providerName, setProviderName] = useState('bKash Personal');
  const [accountNumber, setAccountNumber] = useState('');
  const [accountHolder, setAccountHolder] = useState('');
  const [remarks, setRemarks] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!isOpen) return;
    const defaultMethod = inferMethodFromAccount(payoutAccount);
    setMethod(defaultMethod);
    setAmount(withdrawableTotal);
    setProviderName(
      defaultMethod === PayoutMethod.BKASH
        ? payoutAccount?.provider?.toLowerCase().includes('bkash')
          ? payoutAccount.provider
          : 'bKash Personal'
        : defaultMethod === PayoutMethod.NAGAD
          ? 'Nagad Commercial'
          : defaultMethod === PayoutMethod.ROCKET
            ? 'Rocket MFS'
            : payoutAccount?.provider || 'BRAC Bank PLC',
    );
    setAccountNumber(
      defaultMethod === PayoutMethod.BKASH
        ? payoutAccount?.bkashMerchantNumber || payoutAccount?.accountNumber || ''
        : payoutAccount?.accountNumber || '',
    );
    setAccountHolder(payoutAccount?.accountHolder || '');
    setRemarks('');
    setError(null);
    setSubmitting(false);
  }, [isOpen, withdrawableTotal, payoutAccount]);

  if (!isOpen || !mounted) return null;

  const handlePercentage = (percent: number) => {
    const calculated = Math.floor((withdrawableTotal * percent) / 100);
    setAmount(Math.min(withdrawableTotal, Math.max(minPayoutAmount, calculated)));
    setError(null);
  };

  const handleMethodChange = (newMethod: PayoutMethod) => {
    setMethod(newMethod);
    setError(null);
    if (newMethod === PayoutMethod.BKASH) {
      setProviderName('bKash Personal');
      setAccountNumber(payoutAccount?.bkashMerchantNumber || payoutAccount?.accountNumber || '');
    } else if (newMethod === PayoutMethod.NAGAD) {
      setProviderName('Nagad Commercial');
      setAccountNumber(payoutAccount?.accountNumber || '');
    } else if (newMethod === PayoutMethod.ROCKET) {
      setProviderName('Rocket MFS');
      setAccountNumber(payoutAccount?.accountNumber || '');
    } else {
      setProviderName(
        payoutAccount?.provider && !/bkash|nagad|rocket/i.test(payoutAccount.provider)
          ? payoutAccount.provider
          : 'BRAC Bank PLC',
      );
      setAccountNumber(payoutAccount?.accountNumber || '');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (amount < minPayoutAmount) {
      setError(`Minimum payout request amount is ৳ ${minPayoutAmount.toLocaleString()}`);
      return;
    }
    if (amount > withdrawableTotal) {
      setError('Requested amount exceeds your available + claimable balance');
      return;
    }
    if (!accountNumber.trim()) {
      setError('Please provide a valid account/phone number');
      return;
    }

    setSubmitting(true);
    setError(null);
    try {
      await onSubmit({
        amount,
        method,
        provider: providerName.trim() || method,
        accountNumber: accountNumber.trim(),
        accountHolder: accountHolder.trim() || undefined,
        branchName: method === PayoutMethod.BANK_TRANSFER ? payoutAccount?.branchName : undefined,
        routingNumber: method === PayoutMethod.BANK_TRANSFER ? payoutAccount?.routingNumber : undefined,
        remarks: remarks.trim() || undefined,
      });
      onClose();
    } catch (err: any) {
      setError(err?.message || 'Failed to submit payout request.');
    } finally {
      setSubmitting(false);
    }
  };

  const willAutoClaim = amount > availableBalance && readyToClaim > 0;
  const remainingBalance = Math.max(0, withdrawableTotal - amount);

  return createPortal(
    <div
      className="fixed inset-0 z-[9999] bg-slate-950/75 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-150"
      onClick={onClose}
    >
      <div
        className="w-full max-w-lg rounded-2xl bg-white dark:bg-navy-900 border border-slate-200/80 dark:border-white/10 shadow-2xl p-5 sm:p-6 space-y-4 max-h-[92vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-slate-200/80 dark:border-white/10 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-orange-500/10 border border-orange-500/20 flex items-center justify-center text-orange-600 dark:text-orange-400">
              <Wallet className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-base text-navy-900 dark:text-white">
                Request Payout Withdrawal
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Withdraw cleared earnings with verified digital proof settlement.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-500 dark:text-slate-400 hover:text-navy-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-navy-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {error && (
          <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-700 dark:text-rose-300 text-xs flex items-center gap-2 font-medium">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-navy-950/70 border border-slate-200/80 dark:border-white/10 space-y-1.5 text-xs">
            <div className="flex items-center justify-between">
              <span className="text-slate-500 dark:text-slate-400">Wallet Available:</span>
              <span className="font-bold text-navy-900 dark:text-white tabular-nums">
                ৳ {availableBalance.toLocaleString()}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-500 dark:text-slate-400">Ready to Claim Stage:</span>
              <span className="font-bold text-emerald-600 dark:text-emerald-400 tabular-nums">
                +৳ {readyToClaim.toLocaleString()}
              </span>
            </div>
            <div className="pt-1.5 border-t border-slate-200/80 dark:border-white/10 flex items-center justify-between">
              <span className="font-bold text-navy-900 dark:text-white">Total Withdrawable:</span>
              <span className="font-black text-orange-600 dark:text-orange-400 text-sm tabular-nums">
                ৳ {withdrawableTotal.toLocaleString()}
              </span>
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                Payout Amount (BDT)
              </label>
              <span className="text-[11px] text-slate-500 font-mono">
                Min ৳ {minPayoutAmount.toLocaleString()}
              </span>
            </div>
            <div className="relative">
              <span className="absolute left-3 top-2.5 text-slate-500 font-bold text-sm">৳</span>
              <input
                type="number"
                min={minPayoutAmount}
                max={withdrawableTotal}
                step="1"
                value={amount || ''}
                onChange={(e) => {
                  setAmount(Number(e.target.value));
                  setError(null);
                }}
                required
                className="w-full pl-8 pr-3 py-2 rounded-xl bg-slate-50 dark:bg-navy-950 border border-slate-200/80 dark:border-white/10 text-sm font-bold text-navy-900 dark:text-white focus:outline-none focus:border-orange-500 tabular-nums"
              />
            </div>

            <div className="flex gap-2 mt-2">
              {[
                { label: '25%', val: 25 },
                { label: '50%', val: 50 },
                { label: '75%', val: 75 },
                { label: 'Max (100%)', val: 100 },
              ].map((p) => (
                <button
                  key={p.val}
                  type="button"
                  onClick={() => handlePercentage(p.val)}
                  className="flex-1 py-1.5 rounded-lg bg-slate-100 dark:bg-navy-800 hover:bg-slate-200 dark:hover:bg-navy-700 text-slate-700 dark:text-slate-300 text-xs font-semibold transition-colors border border-slate-200 dark:border-white/10 cursor-pointer"
                >
                  {p.label}
                </button>
              ))}
            </div>
          </div>

          {willAutoClaim && (
            <div className="p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-700 dark:text-emerald-300 text-[11px] flex items-center gap-2">
              <Sparkles className="w-3.5 h-3.5 shrink-0" />
              <span>
                Ready-to-claim earnings will be automatically claimed into your wallet when submitting this request.
              </span>
            </div>
          )}

          <div>
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1.5">
              Select Payout Channel
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {(
                [
                  { id: PayoutMethod.BKASH, label: 'bKash', icon: Smartphone },
                  { id: PayoutMethod.NAGAD, label: 'Nagad', icon: Smartphone },
                  { id: PayoutMethod.ROCKET, label: 'Rocket', icon: Smartphone },
                  { id: PayoutMethod.BANK_TRANSFER, label: 'Bank', icon: Building2 },
                ] as const
              ).map((ch) => {
                const Icon = ch.icon;
                const active = method === ch.id;
                return (
                  <button
                    key={ch.id}
                    type="button"
                    onClick={() => handleMethodChange(ch.id)}
                    className={`p-2.5 rounded-xl border text-xs font-bold flex flex-col items-center gap-1 transition-all cursor-pointer ${
                      active
                        ? 'border-orange-500 bg-orange-500/10 text-orange-600 dark:text-orange-400'
                        : 'border-slate-200/80 dark:border-white/10 bg-slate-50 dark:bg-navy-950/60 text-slate-500 dark:text-slate-400 hover:text-navy-900 dark:hover:text-white'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    <span>{ch.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {method === PayoutMethod.BANK_TRANSFER && (
            <div>
              <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 block mb-1">
                Bank Name
              </label>
              <input
                type="text"
                value={providerName}
                onChange={(e) => setProviderName(e.target.value)}
                required
                className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-navy-950 border border-slate-200/80 dark:border-white/10 text-xs text-navy-900 dark:text-slate-200 focus:outline-none focus:border-orange-500"
              />
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 block mb-1">
                {method === PayoutMethod.BANK_TRANSFER ? 'Bank Account Number' : 'Mobile Wallet Number'}
              </label>
              <input
                type="text"
                value={accountNumber}
                onChange={(e) => setAccountNumber(e.target.value)}
                placeholder={method === PayoutMethod.BANK_TRANSFER ? '150120489...' : '017xx-xxxxxx'}
                required
                className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-navy-950 border border-slate-200/80 dark:border-white/10 text-xs font-mono text-navy-900 dark:text-slate-200 focus:outline-none focus:border-orange-500"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 block mb-1">
                Account Holder Name
              </label>
              <input
                type="text"
                value={accountHolder}
                onChange={(e) => setAccountHolder(e.target.value)}
                placeholder="e.g. Store Owner Name"
                className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-navy-950 border border-slate-200/80 dark:border-white/10 text-xs text-navy-900 dark:text-slate-200 focus:outline-none focus:border-orange-500"
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 block mb-1">
              Remarks / Note (Optional)
            </label>
            <input
              type="text"
              value={remarks}
              onChange={(e) => setRemarks(e.target.value)}
              placeholder="e.g. Weekly clearance payout"
              className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-navy-950 border border-slate-200/80 dark:border-white/10 text-xs text-navy-900 dark:text-slate-200 focus:outline-none focus:border-orange-500"
            />
          </div>

          <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-navy-950 border border-slate-200/80 dark:border-white/10 space-y-1.5 text-xs">
            <div className="flex justify-between text-slate-500 dark:text-slate-400">
              <span>Requested Amount:</span>
              <span className="font-bold text-navy-900 dark:text-slate-200 tabular-nums">
                ৳ {amount.toLocaleString()}
              </span>
            </div>
            <div className="flex justify-between text-slate-500 dark:text-slate-400">
              <span>Disbursement Fee:</span>
              <span className="text-emerald-600 dark:text-emerald-400 font-semibold">৳ 0 (Free)</span>
            </div>
            <div className="pt-2 border-t border-slate-200/80 dark:border-white/10 flex justify-between font-bold text-navy-900 dark:text-white">
              <span>Remaining Withdrawable:</span>
              <span className="text-emerald-600 dark:text-emerald-400 font-mono tabular-nums">
                ৳ {remainingBalance.toLocaleString()}
              </span>
            </div>
          </div>

          <div className="pt-2 flex justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              disabled={submitting}
              className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-navy-800 hover:bg-slate-200 dark:hover:bg-navy-700 text-slate-700 dark:text-slate-300 font-semibold text-xs transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting || amount < minPayoutAmount || amount > withdrawableTotal}
              className="px-5 py-2 rounded-xl bg-orange-600 hover:bg-orange-500 text-white font-bold text-xs flex items-center gap-1.5 shadow-md transition-all disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>{submitting ? 'Submitting...' : 'Submit Payout Request'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body,
  );
}
