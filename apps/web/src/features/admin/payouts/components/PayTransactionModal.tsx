'use client';

import React, { useState, useEffect } from 'react';
import { CreditCard, CheckCircle2, X } from 'lucide-react';
import { Modal } from '@/components/admin/AdminModal';
import { PaymentRequest } from '../types';

interface PayTransactionModalProps {
  isOpen: boolean;
  onClose: () => void;
  request: PaymentRequest | null;
  onConfirm: (requestId: string, trxId: string) => void;
}

export function PayTransactionModal({
  isOpen,
  onClose,
  request,
  onConfirm,
}: PayTransactionModalProps) {
  const [trxId, setTrxId] = useState('');
  const [error, setError] = useState('');

  // Auto-generate a suggested TrxID when opened
  useEffect(() => {
    if (isOpen && request) {
      const prefix = request.method === 'BKASH' ? 'BK' : request.method === 'NAGAD' ? 'NGD' : 'TXN';
      setTrxId(`${prefix}-${Math.floor(10000000 + Math.random() * 90000000)}`);
      setError('');
    }
  }, [isOpen, request]);

  if (!request) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!trxId.trim()) {
      setError('Please provide a valid Transaction ID.');
      return;
    }
    onConfirm(request.id, trxId.trim());
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Complete Merchant Payout">
      <form onSubmit={handleSubmit} className="space-y-4 pt-1">
        <div className="bg-slate-50 dark:bg-navy-950 border border-slate-200 dark:border-white/10 rounded-xl p-3.5 space-y-1">
          <div className="flex items-center justify-between text-xs">
            <span className="text-slate-600 dark:text-slate-300">Request ID:</span>
            <span className="tabular-nums font-bold text-navy-800 dark:text-white">{request.id}</span>
          </div>
          <div className="flex items-center justify-between text-xs">
            <span className="text-slate-600 dark:text-slate-300">Merchant:</span>
            <span className="font-semibold text-navy-800 dark:text-white">
              {request.merchantName} ({request.merchantCode})
            </span>
          </div>
          <div className="flex items-center justify-between text-xs pt-1 border-t border-slate-100 dark:border-white/5">
            <span className="text-slate-600 dark:text-slate-300">Payout Amount:</span>
            <span className="tabular-nums text-sm font-extrabold text-orange-600 dark:text-orange-400">
              ৳{request.amount.toLocaleString()}
            </span>
          </div>
          <div className="flex items-center justify-between text-xs">
            <span className="text-slate-600 dark:text-slate-300">Destination:</span>
            <span className="text-slate-700 dark:text-slate-200 tabular-nums">
              {request.accountDetails.provider} · {request.accountDetails.accountNumber}
            </span>
          </div>
        </div>

        {/* Transaction ID Input */}
        <div className="space-y-1.5">
          <label className="block text-xs font-bold text-navy-800 dark:text-slate-100">
            Transaction ID (TrxID) <span className="text-rose-600 dark:text-rose-400">*</span>
          </label>
          <input
            type="text"
            value={trxId}
            onChange={(e) => {
              setTrxId(e.target.value);
              if (error) setError('');
            }}
            placeholder="e.g. BK-98765432 or TXN-20261105-01"
            autoFocus
            className={`w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-navy-950 border text-xs tabular-nums font-bold text-orange-700 dark:text-orange-300 focus:outline-none transition-colors ${
              error ? 'border-rose-500' : 'border-slate-200 dark:border-white/10 focus:border-orange-500'
            }`}
          />
          {error ? (
            <p className="text-xs text-rose-600 dark:text-rose-400 font-medium">{error}</p>
          ) : (
            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              Enter the bank or mobile banking transaction reference ID for record keeping.
            </p>
          )}
        </div>

        {/* Modal Actions */}
        <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-200 dark:border-white/10">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-navy-800 hover:bg-slate-200 dark:hover:bg-navy-700 text-xs font-semibold text-slate-700 dark:text-slate-200 transition-colors cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="px-4 py-2 rounded-xl bg-orange-600 hover:bg-orange-700 text-xs font-bold text-white flex items-center gap-1.5 shadow-lg transition-colors cursor-pointer"
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>Confirm Payout &amp; Settle</span>
          </button>
        </div>
      </form>
    </Modal>
  );
}
