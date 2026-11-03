'use client';

import React, { useState, useEffect } from 'react';
import { AlertCircle, Upload } from 'lucide-react';
import { Modal } from '@/components/ui';
import { PayoutAccount } from '../../types';

interface ManagePayoutModalProps {
  isOpen: boolean;
  onClose: () => void;
  payoutAccount: PayoutAccount;
  onSave: (updated: PayoutAccount) => void;
}

export function ManagePayoutModal({
  isOpen,
  onClose,
  payoutAccount,
  onSave,
}: ManagePayoutModalProps) {
  const [provider, setProvider] = useState(payoutAccount.provider);
  const [accountHolder, setAccountHolder] = useState(payoutAccount.accountHolder);
  const [accountNumber, setAccountNumber] = useState(payoutAccount.accountNumber);
  const [branchName, setBranchName] = useState(payoutAccount.branchName);
  const [routingNumber, setRoutingNumber] = useState(payoutAccount.routingNumber);
  const [chequeFileName, setChequeFileName] = useState('cheque_leaf_verified_2026.png');

  useEffect(() => {
    if (isOpen) {
      setProvider(payoutAccount.provider);
      setAccountHolder(payoutAccount.accountHolder);
      setAccountNumber(payoutAccount.accountNumber);
      setBranchName(payoutAccount.branchName);
      setRoutingNumber(payoutAccount.routingNumber);
    }
  }, [isOpen, payoutAccount]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({
      ...payoutAccount,
      provider,
      accountHolder,
      accountNumber,
      branchName,
      routingNumber,
      status: 'PENDING_REVIEW', // changes require admin verification
    });
    onClose();
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setChequeFileName(file.name);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Update COD Payout Account"
      subtitle="Receive weekly seller earnings directly in your bank or verified MFS account."
      size="md"
    >
      <div className="space-y-4 text-xs">
        {/* Security Warning Notice */}
        <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-start gap-2.5 text-xs text-amber-300">
          <AlertCircle className="h-4 w-4 shrink-0 mt-0.5 text-amber-400" />
          <div>
            <span className="font-bold block">Admin Verification Protocol</span>
            <span>
              For fraud prevention, modifying settlement details requires Admin verification with a
              valid cheque leaf photo before future payouts switch.
            </span>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-xs font-semibold text-slate-400 block mb-1">
              Bank / Provider Name *
            </label>
            <select
              value={provider}
              onChange={(e) => setProvider(e.target.value)}
              aria-label="Bank Provider Name"
              className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-sm text-slate-100 focus:outline-none focus:border-emerald-500"
            >
              <option value="BRAC Bank PLC">BRAC Bank PLC</option>
              <option value="The City Bank Limited">The City Bank Limited</option>
              <option value="Dutch-Bangla Bank (DBBL)">Dutch-Bangla Bank (DBBL)</option>
              <option value="Eastern Bank PLC (EBL)">Eastern Bank PLC (EBL)</option>
              <option value="Islami Bank Bangladesh">Islami Bank Bangladesh</option>
              <option value="bKash Merchant Account">bKash Merchant Account</option>
            </select>
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-400 block mb-1">
              Account Holder Name (Must match cheque leaf exactly) *
            </label>
            <input
              type="text"
              value={accountHolder}
              onChange={(e) => setAccountHolder(e.target.value)}
              required
              className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-sm text-slate-100 focus:outline-none focus:border-emerald-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-slate-400 block mb-1">
                Account Number *
              </label>
              <input
                type="text"
                value={accountNumber}
                onChange={(e) => setAccountNumber(e.target.value)}
                required
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-sm font-mono text-slate-100 focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-400 block mb-1">
                Branch &amp; Routing Number *
              </label>
              <input
                type="text"
                value={branchName}
                onChange={(e) => setBranchName(e.target.value)}
                placeholder="e.g. Banani Branch"
                required
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-sm text-slate-100 focus:outline-none focus:border-emerald-500"
              />
            </div>
          </div>

          {/* Cheque Leaf Upload Area */}
          <div>
            <label className="text-xs font-semibold text-slate-400 block mb-1">
              Cheque Leaf / Bank Statement Photo (JPG, PNG max 5MB) *
            </label>
            <label className="border-2 border-dashed border-slate-800 hover:border-emerald-500/50 rounded-xl p-4 text-center bg-slate-950/60 transition-colors cursor-pointer block">
              <Upload className="h-6 w-6 text-slate-500 mx-auto mb-1.5" />
              <span className="text-xs font-semibold text-slate-300 block">
                Click to replace cheque photo or drag &amp; drop
              </span>
              <span className="text-[11px] text-emerald-400 font-mono mt-1 block">
                Selected: {chequeFileName}
              </span>
              <input
                type="file"
                accept="image/*"
                onChange={handleFileUpload}
                className="hidden"
              />
            </label>
          </div>

          <div className="pt-2 flex justify-end gap-3 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-300 cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-xs font-semibold text-white shadow-sm cursor-pointer"
            >
              Submit for Admin Review
            </button>
          </div>
        </form>
      </div>
    </Modal>
  );
}
