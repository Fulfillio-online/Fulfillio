'use client';

import React from 'react';
import {
  Calendar,
  Clock,
  CheckCircle2,
  XCircle,
  Check,
  CreditCard,
  Building2,
  Smartphone,
  ArrowRight,
} from 'lucide-react';
import { PaymentRequest } from '@/features/admin/payouts/types';

interface PayoutHistorySectionProps {
  payoutRequests: PaymentRequest[];
  onManageAccount: () => void;
  onTriggerToast: (msg: string) => void;
}

export function PayoutHistorySection({
  payoutRequests,
  onManageAccount,
  onTriggerToast,
}: PayoutHistorySectionProps) {
  const getStatusBadge = (status: PaymentRequest['status']) => {
    switch (status) {
      case 'PENDING':
        return (
          <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-amber-500/15 text-amber-300 border border-amber-500/30 inline-flex items-center gap-1">
            <Clock className="w-3 h-3" />
            <span>Pending Approval</span>
          </span>
        );
      case 'ACCEPTED':
        return (
          <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-sky-500/15 text-sky-300 border border-sky-500/30 inline-flex items-center gap-1">
            <Check className="w-3 h-3" />
            <span>Approved (Queued)</span>
          </span>
        );
      case 'PAID':
        return (
          <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 inline-flex items-center gap-1">
            <CheckCircle2 className="w-3 h-3" />
            <span>Completed</span>
          </span>
        );
      case 'REJECTED':
        return (
          <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-rose-500/15 text-rose-300 border border-rose-500/30 inline-flex items-center gap-1">
            <XCircle className="w-3 h-3" />
            <span>Rejected</span>
          </span>
        );
    }
  };

  const getMethodIcon = (method: PaymentRequest['method']) => {
    switch (method) {
      case 'BKASH':
      case 'NAGAD':
        return <Smartphone className="w-3.5 h-3.5 text-emerald-400" />;
      case 'BANK_TRANSFER':
      default:
        return <Building2 className="w-3.5 h-3.5 text-sky-400" />;
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
      {/* Left: Payout history & requests */}
      <div className="lg:col-span-8 rounded-2xl bg-slate-900 border border-slate-800 p-5 sm:p-6 shadow-sm space-y-4">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div>
            <h3 className="font-bold text-sm text-slate-100 flex items-center gap-2">
              <CreditCard className="h-4 w-4 text-emerald-400" />
              <span>Payout history & requests</span>
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Recent payouts, ongoing clearing, and pending admin approvals.
            </p>
          </div>
          <span className="text-xs text-slate-400 font-mono">
            {payoutRequests.length} record(s)
          </span>
        </div>

        <div className="space-y-3">
          {payoutRequests.length === 0 ? (
            <div className="p-8 text-center text-xs text-slate-500">
              No payout requests submitted yet. Click &quot;Request payout&quot; above to submit.
            </div>
          ) : (
            payoutRequests.map((req) => (
              <div
                key={req.id}
                className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800/80 hover:border-slate-700 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-3"
              >
                <div className="flex items-start sm:items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-center shrink-0">
                    {getMethodIcon(req.method)}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold text-slate-100">
                        ৳ {req.amount.toLocaleString()}
                      </span>
                      <span className="font-mono text-[10px] text-slate-500 bg-slate-900 px-1.5 py-0.5 rounded border border-slate-800">
                        {req.id}
                      </span>
                    </div>
                    <div className="text-[11px] text-slate-400 mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-0.5">
                      <span>{req.accountDetails?.provider || req.method}</span>
                      <span className="font-mono text-slate-500">
                        ({req.accountDetails?.accountNumber})
                      </span>
                      <span className="text-slate-600">•</span>
                      <span>Requested: {req.requestedAt}</span>
                    </div>
                    {req.trxId && (
                      <div className="text-[10px] text-emerald-400 font-mono mt-1">
                        TrxID: {req.trxId} {req.paidAt && `(Paid: ${req.paidAt})`}
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex sm:flex-col items-center sm:items-end justify-between sm:justify-center gap-1.5 shrink-0">
                  {getStatusBadge(req.status)}
                  {req.status === 'PENDING' && (
                    <span className="text-[10px] text-slate-500">Awaiting Admin Approval</span>
                  )}
                  {req.status === 'ACCEPTED' && (
                    <span className="text-[10px] text-sky-400 font-medium">Ready for Payment</span>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Right: Payout schedule card */}
      <div className="lg:col-span-4 rounded-2xl bg-slate-900 border border-slate-800 p-5 sm:p-6 shadow-sm flex flex-col justify-between">
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
              <Calendar className="w-4 h-4" />
            </div>
            <div>
              <h4 className="font-bold text-sm text-slate-100">Payout schedule</h4>
              <p className="text-[11px] text-slate-400">Your earnings are paid automatically.</p>
            </div>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-950/70 border border-slate-800 space-y-2">
            <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider block">
              Next scheduled payout
            </span>
            <div className="text-base font-extrabold text-slate-100">October 22, 2026</div>
            <span className="text-[11px] text-emerald-400 font-medium block">
              Direct to verified account
            </span>
          </div>

          <div className="space-y-2 text-xs border-t border-slate-800 pt-3">
            <div className="flex justify-between text-slate-400">
              <span>Frequency:</span>
              <span className="font-semibold text-slate-200">Weekly</span>
            </div>
            <div className="flex justify-between text-slate-400">
              <span>Minimum payout:</span>
              <span className="font-semibold text-slate-200">৳ 1,000</span>
            </div>
            <div className="flex justify-between text-slate-400">
              <span>Hold period:</span>
              <span className="font-semibold text-slate-200">3-5 days</span>
            </div>
          </div>
        </div>

        <button
          type="button"
          onClick={onManageAccount}
          className="mt-4 pt-3 border-t border-slate-800 text-xs font-semibold text-emerald-400 hover:text-emerald-300 flex items-center gap-1 transition-colors group cursor-pointer"
        >
          <span>Manage payout settings</span>
          <ArrowRight className="h-3.5 w-3.5 group-hover:translate-x-0.5 transition-transform" />
        </button>
      </div>
    </div>
  );
}
