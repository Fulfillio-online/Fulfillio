'use client';

import React, { useState } from 'react';
import { X, Wallet, Smartphone, Building2, AlertCircle, Sparkles } from 'lucide-react';
import { PaymentRequestMethod } from '@/features/admin/payouts/types';
import { PayoutAccount } from '../../types';

interface RequestPayoutModalProps {
  isOpen: boolean;
  onClose: () => void;
  availableBalance: number;
  payoutAccount?: PayoutAccount;
  onSubmit: (params: {
    amount: number;
    method: PaymentRequestMethod;
    provider: string;
    accountNumber: string;
    accountHolder?: string;
    remarks?: string;
  }) => void;
}

export function RequestPayoutModal({
  isOpen,
  onClose,
  availableBalance,
  payoutAccount,
  onSubmit,
}: RequestPayoutModalProps) {
  const [amount, setAmount] = useState<number>(Math.min(availableBalance, 5000));
  const [method, setMethod] = useState<PaymentRequestMethod>('BKASH');
  const [accountNumber, setAccountNumber] = useState(
    payoutAccount?.bkashMerchantNumber || payoutAccount?.accountNumber || '01711-234567'
  );
  const [accountHolder, setAccountHolder] = useState(payoutAccount?.accountHolder || 'Merchant');
  const [remarks, setRemarks] = useState('');
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handlePercentage = (percent: number) => {
    const calculated = Math.floor((availableBalance * percent) / 100);
    setAmount(Math.max(1000, calculated));
    setError(null);
  };

  const handleMethodChange = (newMethod: PaymentRequestMethod) => {
    setMethod(newMethod);
    if (newMethod === 'BKASH') {
      setAccountNumber(payoutAccount?.bkashMerchantNumber || '01711-234567');
    } else if (newMethod === 'NAGAD') {
      setAccountNumber(payoutAccount?.accountNumber || '01912-334455');
    } else {
      setAccountNumber(payoutAccount?.accountNumber || '1501204892019001');
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (amount < 1000) {
      setError('Minimum payout request amount is ৳ 1,000');
      return;
    }
    if (amount > availableBalance) {
      setError('Requested amount exceeds your available wallet balance');
      return;
    }
    if (!accountNumber.trim()) {
      setError('Please provide a valid account/phone number');
      return;
    }

    const provider =
      method === 'BKASH'
        ? 'bKash Personal'
        : method === 'NAGAD'
        ? 'Nagad Commercial'
        : payoutAccount?.provider || 'Bank Transfer PLC';

    onSubmit({
      amount,
      method,
      provider,
      accountNumber: accountNumber.trim(),
      accountHolder: accountHolder.trim() || undefined,
      remarks: remarks.trim() || undefined,
    });

    onClose();
  };

  const remainingBalance = Math.max(0, availableBalance - amount);

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="w-full max-w-lg rounded-2xl bg-slate-900 border border-slate-800 shadow-2xl p-5 sm:p-6 space-y-5">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
              <Wallet className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-base text-slate-100">Request Payout</h3>
              <p className="text-xs text-slate-400">
                Disburse your cleared earnings directly to your verified account.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {error && (
          <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Available balance indicator */}
          <div className="p-3.5 rounded-xl bg-slate-950/70 border border-slate-800 flex items-center justify-between text-xs">
            <span className="text-slate-400">Current Available Balance:</span>
            <span className="font-extrabold text-emerald-400 text-sm">
              ৳ {availableBalance.toLocaleString()}
            </span>
          </div>

          {/* Amount input */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-xs font-semibold text-slate-300">
                Payout Amount (BDT)
              </label>
              <span className="text-[11px] text-slate-500 font-mono">Min ৳ 1,000</span>
            </div>
            <div className="relative">
              <span className="absolute left-3 top-2.5 text-slate-500 font-bold text-sm">৳</span>
              <input
                type="number"
                min={1000}
                max={availableBalance}
                value={amount || ''}
                onChange={(e) => {
                  setAmount(Number(e.target.value));
                  setError(null);
                }}
                required
                className="w-full pl-8 pr-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-sm font-bold text-slate-100 focus:outline-none focus:border-emerald-500"
              />
            </div>

            {/* Quick amount buttons */}
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
                  className="flex-1 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition-colors border border-slate-700/60"
                >
                  {p.label}
                </button>
              ))}
            </div>
          </div>

          {/* Payment Method Selector */}
          <div>
            <label className="text-xs font-semibold text-slate-300 block mb-1.5">
              Select Payout Channel
            </label>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => handleMethodChange('BKASH')}
                className={`p-2.5 rounded-xl border text-xs font-bold flex flex-col items-center gap-1 transition-all ${
                  method === 'BKASH'
                    ? 'border-emerald-500 bg-emerald-500/10 text-emerald-300'
                    : 'border-slate-800 bg-slate-950/60 text-slate-400 hover:text-slate-200'
                }`}
              >
                <Smartphone className="w-4 h-4" />
                <span>bKash</span>
              </button>

              <button
                type="button"
                onClick={() => handleMethodChange('NAGAD')}
                className={`p-2.5 rounded-xl border text-xs font-bold flex flex-col items-center gap-1 transition-all ${
                  method === 'NAGAD'
                    ? 'border-emerald-500 bg-emerald-500/10 text-emerald-300'
                    : 'border-slate-800 bg-slate-950/60 text-slate-400 hover:text-slate-200'
                }`}
              >
                <Smartphone className="w-4 h-4" />
                <span>Nagad</span>
              </button>

              <button
                type="button"
                onClick={() => handleMethodChange('BANK_TRANSFER')}
                className={`p-2.5 rounded-xl border text-xs font-bold flex flex-col items-center gap-1 transition-all ${
                  method === 'BANK_TRANSFER'
                    ? 'border-emerald-500 bg-emerald-500/10 text-emerald-300'
                    : 'border-slate-800 bg-slate-950/60 text-slate-400 hover:text-slate-200'
                }`}
              >
                <Building2 className="w-4 h-4" />
                <span>Bank Transfer</span>
              </button>
            </div>
          </div>

          {/* Account Number & Holder */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-slate-400 block mb-1">
                {method === 'BANK_TRANSFER' ? 'Account Number' : 'Mobile Wallet Number'}
              </label>
              <input
                type="text"
                value={accountNumber}
                onChange={(e) => setAccountNumber(e.target.value)}
                placeholder={method === 'BANK_TRANSFER' ? '150120489...' : '017xx-xxxxxx'}
                required
                className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs font-mono text-slate-200 focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-400 block mb-1">
                Account Holder Name
              </label>
              <input
                type="text"
                value={accountHolder}
                onChange={(e) => setAccountHolder(e.target.value)}
                placeholder="e.g. Tariqul Rahman"
                className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-200 focus:outline-none focus:border-emerald-500"
              />
            </div>
          </div>

          {/* Remarks */}
          <div>
            <label className="text-xs font-semibold text-slate-400 block mb-1">
              Remarks / Internal Note (Optional)
            </label>
            <input
              type="text"
              value={remarks}
              onChange={(e) => setRemarks(e.target.value)}
              placeholder="e.g. Urgent weekly clearance"
              className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-200 focus:outline-none focus:border-emerald-500"
            />
          </div>

          {/* Settlement calculation breakdown */}
          <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800/80 space-y-1.5 text-xs">
            <div className="flex justify-between text-slate-400">
              <span>Requested Amount:</span>
              <span className="font-bold text-slate-200">৳ {amount.toLocaleString()}</span>
            </div>
            <div className="flex justify-between text-slate-400">
              <span>Disbursement Fee:</span>
              <span className="text-emerald-400 font-semibold">৳ 0 (Free)</span>
            </div>
            <div className="pt-2 border-t border-slate-800 flex justify-between font-bold text-slate-100">
              <span>Remaining Wallet Balance:</span>
              <span className="text-emerald-400 font-mono">
                ৳ {remainingBalance.toLocaleString()}
              </span>
            </div>
          </div>

          {/* Buttons */}
          <div className="pt-2 flex justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-xs transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={amount < 1000 || amount > availableBalance}
              className="px-5 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs flex items-center gap-1.5 shadow-md transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Submit Payout Request</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
