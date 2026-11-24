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
  ShieldCheck,
  Ban,
} from 'lucide-react';
import { PayoutMethod, PayoutRequestDto, PayoutRequestStatus } from '@fulfillio/contracts';

interface PayoutHistorySectionProps {
  payoutRequests: PayoutRequestDto[];
  nextScheduledPayoutDate: string;
  payoutFrequency?: string;
  minPayoutAmount: number;
  returnWindowDays: number;
  cancellingId?: string | null;
  onCancelRequest: (id: string) => void;
  onViewDigitalProof: (req: PayoutRequestDto) => void;
  onManageAccount: () => void;
}

function formatDate(iso?: string): string {
  if (!iso) return '—';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  });
}

export function PayoutHistorySection({
  payoutRequests,
  nextScheduledPayoutDate,
  payoutFrequency = 'Weekly',
  minPayoutAmount,
  returnWindowDays,
  cancellingId,
  onCancelRequest,
  onViewDigitalProof,
  onManageAccount,
}: PayoutHistorySectionProps) {
  const renderStatusBadge = (status: PayoutRequestStatus) => {
    switch (status) {
      case PayoutRequestStatus.PENDING:
        return (
          <span className="px-2.5 py-1 rounded-full text-[10px] uppercase tracking-wider font-bold bg-amber-500/15 text-amber-600 dark:text-amber-300 border border-amber-500/30 inline-flex items-center gap-1 select-none">
            <Clock className="w-3 h-3" />
            <span>Pending Approval</span>
          </span>
        );
      case PayoutRequestStatus.ACCEPTED:
        return (
          <span className="px-2.5 py-1 rounded-full text-[10px] uppercase tracking-wider font-bold bg-sky-500/15 text-sky-600 dark:text-sky-300 border border-sky-500/30 inline-flex items-center gap-1 select-none">
            <Check className="w-3 h-3" />
            <span>Approved (Queued)</span>
          </span>
        );
      case PayoutRequestStatus.PAID:
        return (
          <span className="px-2.5 py-1 rounded-full text-[10px] uppercase tracking-wider font-bold bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 inline-flex items-center gap-1 select-none">
            <CheckCircle2 className="w-3 h-3" />
            <span>Paid · Digital Proof</span>
          </span>
        );
      case PayoutRequestStatus.REJECTED:
        return (
          <span className="px-2.5 py-1 rounded-full text-[10px] uppercase tracking-wider font-bold bg-rose-500/15 text-rose-600 dark:text-rose-400 border border-rose-500/30 inline-flex items-center gap-1 select-none">
            <XCircle className="w-3 h-3" />
            <span>Rejected</span>
          </span>
        );
      case PayoutRequestStatus.CANCELLED:
      default:
        return (
          <span className="px-2.5 py-1 rounded-full text-[10px] uppercase tracking-wider font-bold bg-slate-100 dark:bg-navy-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-white/10 inline-flex items-center gap-1 select-none">
            <Ban className="w-3 h-3" />
            <span>Cancelled</span>
          </span>
        );
    }
  };

  const getMethodIcon = (method: PayoutMethod) => {
    switch (method) {
      case PayoutMethod.BKASH:
      case PayoutMethod.NAGAD:
      case PayoutMethod.ROCKET:
        return <Smartphone className="w-3.5 h-3.5 text-orange-600 dark:text-orange-400" />;
      case PayoutMethod.BANK_TRANSFER:
      default:
        return <Building2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />;
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
      {/* Left: Payout history & requests */}
      <div className="lg:col-span-8 rounded-2xl bg-white dark:bg-navy-900 border border-slate-200/80 dark:border-white/10 p-5 sm:p-6 shadow-sm space-y-4">
        <div className="flex items-center justify-between border-b border-slate-200/80 dark:border-white/10 pb-3">
          <div>
            <h3 className="font-bold text-sm text-navy-900 dark:text-white flex items-center gap-2">
              <CreditCard className="h-4 w-4 text-orange-600 dark:text-orange-400" />
              <span>Payout History &amp; Withdrawal Requests</span>
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Every completed payout includes a verifiable TrxID and Digital Proof voucher.
            </p>
          </div>
          <span className="text-xs text-slate-500 dark:text-slate-400 font-mono">
            {payoutRequests.length} record(s)
          </span>
        </div>

        <div className="space-y-3">
          {payoutRequests.length === 0 ? (
            <div className="p-8 text-center text-xs text-slate-500 dark:text-slate-400">
              No payout requests submitted yet. Once your completed orders clear the {returnWindowDays}-day return window, claim them or click &quot;Request Payout&quot; above.
            </div>
          ) : (
            payoutRequests.map((req) => (
              <div
                key={req.id}
                className="p-3.5 rounded-xl bg-slate-50/80 dark:bg-navy-950/60 border border-slate-200/80 dark:border-white/10 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-3"
              >
                <div className="flex items-start sm:items-center gap-3 min-w-0">
                  <div className="w-9 h-9 rounded-xl bg-white dark:bg-navy-900 border border-slate-200/80 dark:border-white/10 flex items-center justify-center shrink-0">
                    {getMethodIcon(req.method)}
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-sm font-black text-navy-900 dark:text-white tabular-nums">
                        ৳ {req.amount.toLocaleString()}
                      </span>
                      <span className="font-mono text-[10px] text-slate-600 dark:text-slate-300 bg-white dark:bg-navy-900 px-1.5 py-0.5 rounded border border-slate-200/80 dark:border-white/10">
                        {req.requestCode}
                      </span>
                    </div>
                    <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-0.5">
                      <span>{req.provider}</span>
                      <span className="font-mono">({req.accountNumber})</span>
                      <span>•</span>
                      <span>Requested: {formatDate(req.requestedAt)}</span>
                    </div>
                    {req.trxId && (
                      <div className="text-[11px] text-emerald-600 dark:text-emerald-400 font-mono mt-1 flex items-center gap-1.5 flex-wrap">
                        <ShieldCheck className="w-3.5 h-3.5 shrink-0" />
                        <span>
                          TrxID: {req.trxId} {req.paidAt ? `· Paid ${formatDate(req.paidAt)}` : ''}
                        </span>
                      </div>
                    )}
                    {req.status === PayoutRequestStatus.REJECTED && req.rejectionReason && (
                      <div className="text-[11px] text-rose-600 dark:text-rose-400 mt-1">
                        Reason: {req.rejectionReason} (Balance restored to wallet)
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex sm:flex-col items-center sm:items-end justify-between sm:justify-center gap-2 shrink-0">
                  {renderStatusBadge(req.status)}

                  {req.status === PayoutRequestStatus.PENDING && (
                    <button
                      type="button"
                      disabled={cancellingId === req.id}
                      onClick={() => onCancelRequest(req.id)}
                      className="text-[11px] font-semibold text-rose-600 dark:text-rose-400 hover:underline cursor-pointer disabled:opacity-50"
                    >
                      {cancellingId === req.id ? 'Cancelling...' : 'Cancel Request'}
                    </button>
                  )}

                  {req.status === PayoutRequestStatus.ACCEPTED && (
                    <span className="text-[10px] text-sky-600 dark:text-sky-400 font-medium">
                      Awaiting Transfer &amp; Digital Proof
                    </span>
                  )}

                  {req.status === PayoutRequestStatus.PAID && (
                    <button
                      type="button"
                      onClick={() => onViewDigitalProof(req)}
                      className="px-3 py-1 rounded-lg bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30 text-[11px] font-bold inline-flex items-center gap-1 transition-colors cursor-pointer"
                    >
                      <ShieldCheck className="w-3.5 h-3.5" />
                      <span>View Digital Proof</span>
                    </button>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Right: Payout schedule card */}
      <div className="lg:col-span-4 rounded-2xl bg-white dark:bg-navy-900 border border-slate-200/80 dark:border-white/10 p-5 sm:p-6 shadow-sm flex flex-col justify-between">
        <div className="space-y-4">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-orange-500/10 border border-orange-500/20 flex items-center justify-center text-orange-600 dark:text-orange-400">
              <Calendar className="w-4 h-4" />
            </div>
            <div>
              <h4 className="font-bold text-sm text-navy-900 dark:text-white">Payout Policy &amp; Schedule</h4>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                Protected against customer returns.
              </p>
            </div>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-navy-950/70 border border-slate-200/80 dark:border-white/10 space-y-1.5">
            <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider block">
              Next scheduled cycle
            </span>
            <div className="text-base font-extrabold text-navy-900 dark:text-white">
              {nextScheduledPayoutDate}
            </div>
            <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-medium block">
              Verified account + digital proof on every payout
            </span>
          </div>

          <div className="space-y-2 text-xs border-t border-slate-200/80 dark:border-white/10 pt-3">
            <div className="flex justify-between text-slate-500 dark:text-slate-400">
              <span>Frequency:</span>
              <span className="font-semibold text-navy-900 dark:text-slate-200">{payoutFrequency}</span>
            </div>
            <div className="flex justify-between text-slate-500 dark:text-slate-400">
              <span>Minimum payout:</span>
              <span className="font-semibold text-navy-900 dark:text-slate-200 tabular-nums">
                ৳ {minPayoutAmount.toLocaleString()}
              </span>
            </div>
            <div className="flex justify-between text-slate-500 dark:text-slate-400">
              <span>Return hold window:</span>
              <span className="font-semibold text-navy-900 dark:text-slate-200">
                {returnWindowDays} days
              </span>
            </div>
          </div>
        </div>

        <button
          type="button"
          onClick={onManageAccount}
          className="mt-4 pt-3 border-t border-slate-200/80 dark:border-white/10 text-xs font-semibold text-orange-600 dark:text-orange-400 hover:text-orange-500 flex items-center gap-1 transition-colors group cursor-pointer"
        >
          <span>Manage payout settings</span>
          <ArrowRight className="h-3.5 w-3.5 group-hover:translate-x-0.5 transition-transform" />
        </button>
      </div>
    </div>
  );
}
