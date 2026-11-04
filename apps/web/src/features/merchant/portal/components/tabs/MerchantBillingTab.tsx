'use client';

import React from 'react';
import { CreditCard, FileText } from 'lucide-react';
import { PayoutAccount } from '../../types';

interface MerchantBillingTabProps {
  payoutAccount?: PayoutAccount;
}

export function MerchantBillingTab({ payoutAccount }: MerchantBillingTabProps) {
  const bankInfo = payoutAccount
    ? `${payoutAccount.provider} (A/C: ${payoutAccount.accountNumber})`
    : 'BRAC Bank (A/C: 1501204892019001)';

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-100 flex items-center gap-2">
          <CreditCard className="h-6 w-6 text-emerald-400 shrink-0" />
          <span>Billing & COD Settlement Statements</span>
        </h1>
        <p className="text-sm text-slate-400 mt-0.5">
          Itemized fulfillment fee deductions, storage billing, and net disbursement balance.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 shadow-sm">
          <span className="text-xs uppercase font-semibold text-slate-400">Gross COD Collected</span>
          <div className="text-2xl font-bold text-emerald-400 mt-2">৳ 198,400</div>
          <span className="text-xs text-slate-500">From Steadfast & Pathao</span>
        </div>

        <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 shadow-sm">
          <span className="text-xs uppercase font-semibold text-slate-400">Fulfillio 3PL Fees</span>
          <div className="text-2xl font-bold text-rose-400 mt-2">- ৳ 13,900</div>
          <span className="text-xs text-slate-500">৳ 50 per order pick & pack + shelf storage</span>
        </div>

        <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 shadow-sm">
          <span className="text-xs uppercase font-semibold text-slate-400">Net Payable Payout</span>
          <div className="text-2xl font-bold text-slate-100 mt-2">৳ 184,500</div>
          <span className="text-xs text-emerald-400 font-semibold">Scheduled for weekly bank deposit</span>
        </div>
      </div>

      {/* Itemized Settlement History Table */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900 overflow-hidden shadow-sm">
        <div className="p-4 border-b border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <h3 className="font-bold text-sm text-slate-100 flex items-center gap-2">
            <FileText className="h-4 w-4 text-emerald-400 shrink-0" />
            <span>Weekly Settlement Statements</span>
          </h3>
          <span className="text-xs text-slate-400">Directly deposited to {bankInfo}</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[680px] text-left text-sm">
            <thead className="bg-slate-800/80 text-slate-400 text-xs uppercase tracking-wider font-semibold border-b border-slate-800">
              <tr>
                <th className="p-4">Settlement Cycle</th>
                <th className="p-4">Orders</th>
                <th className="p-4">Gross COD</th>
                <th className="p-4">3PL Pick & Pack</th>
                <th className="p-4">Storage Fees</th>
                <th className="p-4 font-bold text-emerald-400">Net Disbursed</th>
                <th className="p-4">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              <tr className="hover:bg-slate-800/40 transition-colors">
                <td className="p-4">
                  <span className="font-bold text-slate-200 block text-xs">15 Oct 2026 - 21 Oct 2026</span>
                  <span className="text-[11px] font-mono text-slate-500">SETTLE-2026-W42</span>
                </td>
                <td className="p-4 font-mono text-xs text-slate-300">228 Orders</td>
                <td className="p-4 font-bold text-slate-200">৳ 198,400</td>
                <td className="p-4 text-xs text-rose-400">- ৳ 11,400</td>
                <td className="p-4 text-xs text-rose-400">- ৳ 2,500</td>
                <td className="p-4 font-bold text-emerald-400">৳ 184,500</td>
                <td className="p-4">
                  <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                    Disbursed (Friday)
                  </span>
                </td>
              </tr>
              <tr className="hover:bg-slate-800/40 transition-colors">
                <td className="p-4">
                  <span className="font-bold text-slate-200 block text-xs">08 Oct 2026 - 14 Oct 2026</span>
                  <span className="text-[11px] font-mono text-slate-500">SETTLE-2026-W41</span>
                </td>
                <td className="p-4 font-mono text-xs text-slate-300">195 Orders</td>
                <td className="p-4 font-bold text-slate-200">৳ 162,100</td>
                <td className="p-4 text-xs text-rose-400">- ৳ 9,750</td>
                <td className="p-4 text-xs text-rose-400">- ৳ 2,500</td>
                <td className="p-4 font-bold text-emerald-400">৳ 149,850</td>
                <td className="p-4">
                  <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-slate-800 text-slate-300 border border-slate-700">
                    Settled & Paid
                  </span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
