'use client';

import React, { useState, useEffect } from 'react';
import { X, Building2, Smartphone, AlertCircle, Save } from 'lucide-react';
import { PayoutAccount } from '../../types';

interface ManagePayoutAccountModalProps {
  isOpen: boolean;
  onClose: () => void;
  payoutAccount?: PayoutAccount;
  onSave: (updated: PayoutAccount) => void;
}

export function ManagePayoutAccountModal({
  isOpen,
  onClose,
  payoutAccount,
  onSave,
}: ManagePayoutAccountModalProps) {
  const resolveType = (p?: PayoutAccount): 'BKASH' | 'NAGAD' | 'BANK' =>
    p?.provider?.toLowerCase().includes('bkash')
      ? 'BKASH'
      : p?.provider?.toLowerCase().includes('nagad')
      ? 'NAGAD'
      : 'BANK';

  const [providerType, setProviderType] = useState<'BKASH' | 'NAGAD' | 'BANK'>(
    resolveType(payoutAccount)
  );
  const [provider, setProvider] = useState(payoutAccount?.provider || 'BRAC Bank PLC');
  const [accountHolder, setAccountHolder] = useState(payoutAccount?.accountHolder || '');
  const [accountNumber, setAccountNumber] = useState(
    payoutAccount?.bkashMerchantNumber || payoutAccount?.accountNumber || ''
  );
  const [branchName, setBranchName] = useState(payoutAccount?.branchName || '');
  const [routingNumber, setRoutingNumber] = useState(payoutAccount?.routingNumber || '');
  const [frequency, setFrequency] = useState(payoutAccount?.frequency || 'Weekly (Every Friday)');

  useEffect(() => {
    if (!isOpen) return;
    const type = resolveType(payoutAccount);
    setProviderType(type);
    setProvider(
      payoutAccount?.provider ||
        (type === 'BKASH' ? 'bKash Personal' : type === 'NAGAD' ? 'Nagad Commercial' : 'BRAC Bank PLC')
    );
    setAccountHolder(payoutAccount?.accountHolder || '');
    setAccountNumber(payoutAccount?.bkashMerchantNumber || payoutAccount?.accountNumber || '');
    setBranchName(payoutAccount?.branchName || '');
    setRoutingNumber(payoutAccount?.routingNumber || '');
    setFrequency(payoutAccount?.frequency || 'Weekly (Every Friday)');
  }, [isOpen, payoutAccount]);

  if (!isOpen) return null;

  const handleTypeSelect = (type: 'BKASH' | 'NAGAD' | 'BANK') => {
    setProviderType(type);
    if (type === 'BKASH') {
      setProvider('bKash Personal');
      setAccountNumber(payoutAccount?.bkashMerchantNumber || accountNumber || '');
    } else if (type === 'NAGAD') {
      setProvider('Nagad Commercial');
      setAccountNumber(accountNumber || '');
    } else {
      setProvider('BRAC Bank PLC');
      setAccountNumber(payoutAccount?.accountNumber || accountNumber || '');
    }
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    const nowIso = new Date().toISOString();

    const updated: PayoutAccount = {
      provider: providerType === 'BKASH' ? 'bKash Personal' : providerType === 'NAGAD' ? 'Nagad' : provider,
      accountHolder: accountHolder.trim(),
      accountNumber: accountNumber.trim(),
      branchName: providerType === 'BANK' ? branchName.trim() : 'MFS Wallet',
      routingNumber: providerType === 'BANK' ? routingNumber.trim() : '—',
      frequency,
      status: 'PENDING_REVIEW',
      chequeLeafUrl: payoutAccount?.chequeLeafUrl || '',
      bkashMerchantNumber: providerType === 'BKASH' ? accountNumber.trim() : undefined,
      submittedAt: nowIso,
      updatedAt: nowIso,
      rejectionReason: undefined,
    };

    onSave(updated);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/60 dark:bg-navy-950/80 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="w-full max-w-lg rounded-2xl bg-white dark:bg-navy-900 border border-slate-200/80 dark:border-white/10 shadow-2xl p-5 sm:p-6 space-y-5">
        <div className="flex items-center justify-between border-b border-slate-200/80 dark:border-white/10 pb-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-600 dark:text-amber-400">
              <AlertCircle className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-base text-navy-900 dark:text-white">Manage Payout Account</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Changes are submitted to the Admin Panel for verification before payouts disburse.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-lg text-slate-500 dark:text-slate-400 hover:text-navy-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-navy-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSave} className="space-y-4">
          {/* Method Type */}
          <div>
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1.5">
              Account Type
            </label>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => handleTypeSelect('BKASH')}
                className={`p-2.5 rounded-xl border text-xs font-bold flex flex-col items-center gap-1 transition-all ${
                  providerType === 'BKASH'
                    ? 'border-emerald-500 bg-emerald-500/10 text-emerald-300'
                    : 'border-slate-200/80 dark:border-white/10 bg-slate-50 dark:bg-navy-950/60 text-slate-500 dark:text-slate-400 hover:text-navy-900 dark:text-slate-200'
                }`}
              >
                <Smartphone className="w-4 h-4" />
                <span>bKash</span>
              </button>

              <button
                type="button"
                onClick={() => handleTypeSelect('NAGAD')}
                className={`p-2.5 rounded-xl border text-xs font-bold flex flex-col items-center gap-1 transition-all ${
                  providerType === 'NAGAD'
                    ? 'border-emerald-500 bg-emerald-500/10 text-emerald-300'
                    : 'border-slate-200/80 dark:border-white/10 bg-slate-50 dark:bg-navy-950/60 text-slate-500 dark:text-slate-400 hover:text-navy-900 dark:text-slate-200'
                }`}
              >
                <Smartphone className="w-4 h-4" />
                <span>Nagad</span>
              </button>

              <button
                type="button"
                onClick={() => handleTypeSelect('BANK')}
                className={`p-2.5 rounded-xl border text-xs font-bold flex flex-col items-center gap-1 transition-all ${
                  providerType === 'BANK'
                    ? 'border-emerald-500 bg-emerald-500/10 text-emerald-300'
                    : 'border-slate-200/80 dark:border-white/10 bg-slate-50 dark:bg-navy-950/60 text-slate-500 dark:text-slate-400 hover:text-navy-900 dark:text-slate-200'
                }`}
              >
                <Building2 className="w-4 h-4" />
                <span>Bank Transfer</span>
              </button>
            </div>
          </div>

          {providerType === 'BANK' && (
            <div>
              <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 block mb-1">
                Bank Name
              </label>
              <input
                type="text"
                value={provider}
                onChange={(e) => setProvider(e.target.value)}
                placeholder="e.g. BRAC Bank PLC, City Bank PLC"
                required
                className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-navy-950 border border-slate-200/80 dark:border-white/10 text-xs text-navy-900 dark:text-slate-200 focus:outline-none focus:border-orange-500"
              />
            </div>
          )}

          <div>
            <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 block mb-1">
              Account Holder Name
            </label>
            <input
              type="text"
              value={accountHolder}
              onChange={(e) => setAccountHolder(e.target.value)}
              placeholder="e.g. Tariqul Rahman / Official Business Name"
              required
              className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-navy-950 border border-slate-200/80 dark:border-white/10 text-xs text-navy-900 dark:text-slate-200 focus:outline-none focus:border-orange-500"
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 block mb-1">
              {providerType === 'BANK' ? 'Bank Account Number' : 'Mobile Wallet Number'}
            </label>
            <input
              type="text"
              value={accountNumber}
              onChange={(e) => setAccountNumber(e.target.value)}
              placeholder={providerType === 'BANK' ? '150120489...' : '017xx-xxxxxx'}
              required
              className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-navy-950 border border-slate-200/80 dark:border-white/10 text-xs font-mono text-navy-900 dark:text-slate-200 focus:outline-none focus:border-orange-500"
            />
          </div>

          {providerType === 'BANK' && (
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 block mb-1">
                  Branch Name
                </label>
                <input
                  type="text"
                  value={branchName}
                  onChange={(e) => setBranchName(e.target.value)}
                  placeholder="e.g. Banani Branch"
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-navy-950 border border-slate-200/80 dark:border-white/10 text-xs text-navy-900 dark:text-slate-200 focus:outline-none focus:border-orange-500"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 block mb-1">
                  Routing Number
                </label>
                <input
                  type="text"
                  value={routingNumber}
                  onChange={(e) => setRoutingNumber(e.target.value)}
                  placeholder="e.g. 060261122"
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-navy-950 border border-slate-200/80 dark:border-white/10 text-xs font-mono text-navy-900 dark:text-slate-200 focus:outline-none focus:border-orange-500"
                />
              </div>
            </div>
          )}

          <div>
            <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 block mb-1">
              Disbursement Frequency
            </label>
            <select
              value={frequency}
              onChange={(e) => setFrequency(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-navy-950 border border-slate-200/80 dark:border-white/10 text-xs text-navy-900 dark:text-slate-200 focus:outline-none focus:border-orange-500"
            >
              <option value="Weekly (Every Friday)">Weekly (Every Friday)</option>
              <option value="Bi-Weekly (1st & 15th)">Bi-Weekly (1st & 15th)</option>
              <option value="Monthly Cycle">Monthly Cycle</option>
              <option value="On-Demand Manual Request">On-Demand Manual Request Only</option>
            </select>
          </div>

          <div className="pt-2 flex justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-navy-800 hover:bg-slate-200 dark:hover:bg-navy-700 text-slate-700 dark:text-slate-300 font-semibold text-xs transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs flex items-center gap-1.5 shadow-md transition-all"
            >
              <Save className="w-3.5 h-3.5" />
              <span>Save Account</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
