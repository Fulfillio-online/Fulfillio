'use client';

import React, { useState, useEffect } from 'react';
import { X, CreditCard, AlertCircle } from 'lucide-react';
import { PayoutAccount } from '../types';
import { DocumentUploadDropzone } from '@/components/ui';

interface ManagePayoutModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentAccount: PayoutAccount;
  onSave: (account: PayoutAccount) => void;
}

export function ManagePayoutModal({
  isOpen,
  onClose,
  currentAccount,
  onSave,
}: ManagePayoutModalProps) {
  const [provider, setProvider] = useState(currentAccount.provider || 'BRAC Bank PLC');
  const [accountHolder, setAccountHolder] = useState(currentAccount.accountHolder || '');
  const [accountNumber, setAccountNumber] = useState(currentAccount.accountNumber || '');
  const [branchName, setBranchName] = useState(currentAccount.branchName || '');
  const [routingNumber, setRoutingNumber] = useState(currentAccount.routingNumber || '');
  const [bkashMerchantNumber, setBkashMerchantNumber] = useState(
    currentAccount.bkashMerchantNumber || ''
  );
  const [frequency, setFrequency] = useState(currentAccount.frequency || 'Weekly');
  const [chequeLeafUrl, setChequeLeafUrl] = useState(currentAccount.chequeLeafUrl || '');

  useEffect(() => {
    if (!isOpen) return;
    setProvider(currentAccount.provider || 'BRAC Bank PLC');
    setAccountHolder(currentAccount.accountHolder || '');
    setAccountNumber(currentAccount.accountNumber || '');
    setBranchName(currentAccount.branchName || '');
    setRoutingNumber(currentAccount.routingNumber || '');
    setBkashMerchantNumber(currentAccount.bkashMerchantNumber || '');
    setFrequency(currentAccount.frequency || 'Weekly');
    setChequeLeafUrl(currentAccount.chequeLeafUrl || '');
  }, [isOpen, currentAccount]);

  if (!isOpen) return null;

  const isMfsProvider =
    provider.toLowerCase().includes('bkash') || provider.toLowerCase().includes('nagad');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const nowIso = new Date().toISOString();
    const cleanAccountNo = accountNumber.trim();
    const cleanMfs = bkashMerchantNumber.trim();

    onSave({
      provider,
      accountHolder: accountHolder.trim(),
      accountNumber: cleanAccountNo,
      branchName: isMfsProvider ? branchName.trim() || 'MFS Wallet' : branchName.trim(),
      routingNumber: isMfsProvider ? routingNumber.trim() || '—' : routingNumber.trim(),
      bkashMerchantNumber: provider.toLowerCase().includes('bkash')
        ? cleanMfs || cleanAccountNo
        : cleanMfs,
      frequency,
      status: 'PENDING_REVIEW', // Strict Verification Lock on change
      chequeLeafUrl,
      submittedAt: nowIso,
      updatedAt: nowIso,
      rejectionReason: undefined,
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 dark:bg-navy-950/80 backdrop-blur-sm animate-in fade-in">
      <div className="w-full max-w-xl bg-white dark:bg-navy-900 border border-slate-200 dark:border-white/10 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-slate-200 dark:border-white/10 bg-white dark:bg-navy-900/50">
          <div className="flex items-center gap-2.5">
            <div className="h-9 w-9 rounded-xl bg-orange-500/10 border border-orange-500/20 flex items-center justify-center text-orange-600 dark:text-orange-400">
              <CreditCard className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-navy-900 dark:text-white">Configure Payout Account</h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">COD disbursement bank / MFS account &amp; verification leaf</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-navy-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-navy-800 transition-colors cursor-pointer"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Verification Warning Banner */}
        <div className="px-5 py-3 bg-amber-500/10 border-b border-amber-500/20 flex items-start gap-2.5">
          <AlertCircle className="h-4 w-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
          <p className="text-[11px] text-amber-800 dark:text-amber-300 leading-relaxed">
            <strong>Security Notice:</strong> Adding or updating payment details submits them to the Admin Panel for verification. Status will remain <strong>PENDING REVIEW</strong> until approved.
          </p>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="overflow-y-auto p-5 space-y-4 flex-1 text-xs">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Bank / MFS Provider</label>
              <select
                value={provider}
                onChange={(e) => setProvider(e.target.value)}
                className="w-full px-3 py-2 bg-slate-100 dark:bg-navy-800 border border-slate-200 dark:border-white/10 rounded-lg text-navy-900 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-orange-500"
              >
                <option value="BRAC Bank PLC">BRAC Bank PLC</option>
                <option value="The City Bank PLC">The City Bank PLC</option>
                <option value="Dutch-Bangla Bank PLC">Dutch-Bangla Bank PLC</option>
                <option value="Eastern Bank PLC">Eastern Bank PLC</option>
                <option value="Islami Bank Bangladesh PLC">Islami Bank Bangladesh PLC</option>
                <option value="bKash Merchant Wallet">bKash Merchant Wallet</option>
                <option value="bKash Personal">bKash Personal</option>
                <option value="Nagad Merchant Wallet">Nagad Merchant Wallet</option>
              </select>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Disbursement Frequency</label>
              <select
                value={frequency}
                onChange={(e) => setFrequency(e.target.value)}
                className="w-full px-3 py-2 bg-slate-100 dark:bg-navy-800 border border-slate-200 dark:border-white/10 rounded-lg text-navy-900 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-orange-500"
              >
                <option value="Weekly">Weekly (Every Friday)</option>
                <option value="Bi-Weekly">Bi-Weekly (1st &amp; 15th)</option>
                <option value="Monthly">Monthly</option>
              </select>
            </div>

            <div className="sm:col-span-2">
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Account Holder Full Name</label>
              <input
                type="text"
                value={accountHolder}
                onChange={(e) => setAccountHolder(e.target.value)}
                required
                placeholder="e.g. Tariqul Rahman / Official Business Name"
                className="w-full px-3 py-2 bg-slate-100 dark:bg-navy-800 border border-slate-200 dark:border-white/10 rounded-lg text-navy-900 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-orange-500"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                {isMfsProvider ? 'MFS Wallet Number' : 'Account Number'}
              </label>
              <input
                type="text"
                value={accountNumber}
                onChange={(e) => setAccountNumber(e.target.value)}
                required
                placeholder={isMfsProvider ? 'e.g. 01711-000000' : 'e.g. 1501204892019001'}
                className="w-full px-3 py-2 bg-slate-100 dark:bg-navy-800 border border-slate-200 dark:border-white/10 rounded-lg text-navy-900 dark:text-slate-200 font-mono focus:outline-none focus:ring-1 focus:ring-orange-500"
              />
            </div>

            {!isMfsProvider && (
              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  bKash / MFS Number (Optional)
                </label>
                <input
                  type="text"
                  value={bkashMerchantNumber}
                  onChange={(e) => setBkashMerchantNumber(e.target.value)}
                  placeholder="e.g. 01711-000000"
                  className="w-full px-3 py-2 bg-slate-100 dark:bg-navy-800 border border-slate-200 dark:border-white/10 rounded-lg text-navy-900 dark:text-slate-200 font-mono focus:outline-none focus:ring-1 focus:ring-orange-500"
                />
              </div>
            )}

            {!isMfsProvider && (
              <>
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Branch Name</label>
                  <input
                    type="text"
                    value={branchName}
                    onChange={(e) => setBranchName(e.target.value)}
                    placeholder="e.g. Banani Branch"
                    className="w-full px-3 py-2 bg-slate-100 dark:bg-navy-800 border border-slate-200 dark:border-white/10 rounded-lg text-navy-900 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-orange-500"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Routing Number (9 Digits)</label>
                  <input
                    type="text"
                    value={routingNumber}
                    onChange={(e) => setRoutingNumber(e.target.value)}
                    maxLength={9}
                    placeholder="e.g. 060271829"
                    className="w-full px-3 py-2 bg-slate-100 dark:bg-navy-800 border border-slate-200 dark:border-white/10 rounded-lg text-navy-900 dark:text-slate-200 font-mono focus:outline-none focus:ring-1 focus:ring-orange-500"
                  />
                </div>
              </>
            )}
          </div>

          <div>
            <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Cheque Leaf / Bank Statement Photo ({isMfsProvider ? 'Optional for MFS' : 'Recommended for Verification'})
            </label>
            <DocumentUploadDropzone
              label="Upload Cheque Leaf Image"
              sublabel="Clear photo of a crossed void cheque leaf or MFS merchant screenshot"
              currentUrl={chequeLeafUrl}
              onUploadSuccess={(url) => setChequeLeafUrl(url)}
            />
          </div>

          {/* Footer Submit */}
          <div className="pt-4 border-t border-slate-200 dark:border-white/10 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-slate-100 dark:bg-navy-800 hover:bg-slate-200 dark:hover:bg-navy-700 text-slate-700 dark:text-slate-300 rounded-lg font-semibold transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 bg-orange-600 hover:bg-orange-500 text-white rounded-lg font-semibold transition-colors shadow-sm cursor-pointer"
            >
              Submit for Verification
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
