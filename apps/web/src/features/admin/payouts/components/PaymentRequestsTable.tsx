'use client';

import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import {
  CheckCircle2,
  XCircle,
  Clock,
  Check,
  CreditCard,
  Building2,
  Smartphone,
  Store,
  DollarSign,
  MoreVertical,
  ShieldCheck,
  Ban,
} from 'lucide-react';
import { PaymentRequest } from '../types';

interface PaymentRequestsTableProps {
  requests: PaymentRequest[];
  selectedIds: string[];
  onToggleSelectRow: (id: string) => void;
  onToggleSelectAll: () => void;
  allVisibleSelected: boolean;
  onAccept: (request: PaymentRequest) => void;
  onReject: (request: PaymentRequest) => void;
  onOpenPayModal: (request: PaymentRequest) => void;
  onViewProof: (request: PaymentRequest) => void;
}

function formatDateTime(iso?: string): string {
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

export function PaymentRequestsTable({
  requests,
  selectedIds,
  onToggleSelectRow,
  onToggleSelectAll,
  allVisibleSelected,
  onAccept,
  onReject,
  onOpenPayModal,
  onViewProof,
}: PaymentRequestsTableProps) {
  const [menuState, setMenuState] = useState<{
    req: PaymentRequest;
    top: number;
    left: number;
  } | null>(null);

  useEffect(() => {
    if (!menuState) return;
    const close = () => setMenuState(null);
    window.addEventListener('scroll', close, true);
    window.addEventListener('resize', close);
    window.addEventListener('click', close);
    return () => {
      window.removeEventListener('scroll', close, true);
      window.removeEventListener('resize', close);
      window.removeEventListener('click', close);
    };
  }, [menuState]);

  const handleOpenMenu = (req: PaymentRequest, e: React.MouseEvent<HTMLButtonElement>) => {
    e.stopPropagation();
    if (menuState?.req.id === req.id) {
      setMenuState(null);
      return;
    }
    const rect = e.currentTarget.getBoundingClientRect();
    const menuWidth = 210;
    const menuHeight = 148;
    const spaceBelow = window.innerHeight - rect.bottom;
    const spaceAbove = rect.top;
    const rawTop =
      spaceBelow < menuHeight && spaceAbove >= spaceBelow
        ? rect.top - menuHeight - 6
        : rect.bottom + 6;
    const top = Math.max(10, Math.min(rawTop, window.innerHeight - menuHeight - 10));
    const left = Math.max(10, Math.min(rect.right - menuWidth, window.innerWidth - menuWidth - 10));
    setMenuState({ req, top, left });
  };

  const getMethodBadge = (req: PaymentRequest) => {
    switch (req.method) {
      case 'BKASH':
        return (
          <div className="flex items-center gap-1.5 text-orange-600 dark:text-orange-400 font-semibold text-xs">
            <Smartphone className="w-3.5 h-3.5 shrink-0" />
            <span>bKash</span>
          </div>
        );
      case 'NAGAD':
        return (
          <div className="flex items-center gap-1.5 text-amber-600 dark:text-amber-400 font-semibold text-xs">
            <Smartphone className="w-3.5 h-3.5 shrink-0" />
            <span>Nagad</span>
          </div>
        );
      case 'ROCKET':
        return (
          <div className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400 font-semibold text-xs">
            <Smartphone className="w-3.5 h-3.5 shrink-0" />
            <span>Rocket</span>
          </div>
        );
      case 'BANK_TRANSFER':
        return (
          <div className="flex items-center gap-1.5 text-sky-600 dark:text-sky-400 font-semibold text-xs">
            <Building2 className="w-3.5 h-3.5 shrink-0" />
            <span>Bank Transfer</span>
          </div>
        );
      case 'CASH':
      default:
        return (
          <div className="flex items-center gap-1.5 text-slate-700 dark:text-slate-200 font-semibold text-xs">
            <DollarSign className="w-3.5 h-3.5 shrink-0" />
            <span>Cash</span>
          </div>
        );
    }
  };

  const getStatusBadge = (req: PaymentRequest) => {
    switch (req.status) {
      case 'PENDING':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider bg-amber-500/15 text-amber-700 dark:text-amber-300 border border-amber-500/30 select-none">
            <Clock className="w-3 h-3" />
            <span>Pending</span>
          </span>
        );
      case 'ACCEPTED':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider bg-sky-500/15 text-sky-700 dark:text-sky-300 border border-sky-500/30 select-none">
            <Check className="w-3 h-3" />
            <span>Accepted</span>
          </span>
        );
      case 'PAID':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30 select-none">
            <CheckCircle2 className="w-3 h-3" />
            <span>Paid · Proof</span>
          </span>
        );
      case 'REJECTED':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider bg-rose-500/15 text-rose-700 dark:text-rose-300 border border-rose-500/30 select-none">
            <XCircle className="w-3 h-3" />
            <span>Rejected</span>
          </span>
        );
      case 'CANCELLED':
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider bg-slate-100 dark:bg-navy-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-white/10 select-none">
            <Ban className="w-3 h-3" />
            <span>Cancelled</span>
          </span>
        );
    }
  };

  return (
    <div className="rounded-2xl border border-slate-200 dark:border-white/10 bg-white/90 dark:bg-navy-900/90 overflow-hidden shadow-xl">
      {/* 1. Mobile Cards (< md) */}
      <div className="block md:hidden p-3 space-y-3">
        {requests.length === 0 ? (
          <div className="p-8 text-center text-xs text-slate-600 dark:text-slate-300">
            No payment requests found matching your filters.
          </div>
        ) : (
          requests.map((req) => {
            const isSelected = selectedIds.includes(req.id);
            return (
              <div
                key={req.id}
                className={`rounded-xl border transition-all p-3.5 space-y-2.5 ${
                  isSelected
                    ? 'border-orange-500/50 bg-orange-500/5'
                    : 'border-slate-200 dark:border-white/10 bg-slate-50/70 dark:bg-navy-950/70'
                }`}
              >
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => onToggleSelectRow(req.id)}
                      aria-label={`Select ${req.requestCode}`}
                      className="w-4 h-4 rounded bg-slate-50 dark:bg-navy-950 border-slate-300 dark:border-white/15 text-orange-600 focus:ring-orange-500 cursor-pointer accent-orange-500"
                    />
                    <span className="font-mono text-xs font-extrabold text-navy-800 dark:text-white">
                      {req.requestCode}
                    </span>
                  </div>
                  {getStatusBadge(req)}
                </div>

                <div className="flex items-center justify-between text-xs pt-1 border-t border-slate-100 dark:border-white/5">
                  <div>
                    <div className="font-bold text-navy-800 dark:text-white">{req.merchantName}</div>
                    <div className="text-xs tabular-nums text-orange-600 dark:text-orange-400">{req.merchantCode}</div>
                  </div>
                  <div className="text-right">
                    <span className="tabular-nums text-base font-extrabold text-orange-600 dark:text-orange-400">
                      ৳{req.amount.toLocaleString()}
                    </span>
                  </div>
                </div>

                <div className="text-xs space-y-1 pt-1 border-t border-slate-100 dark:border-white/5 text-slate-700 dark:text-slate-200">
                  <div className="flex items-center justify-between">
                    {getMethodBadge(req)}
                    <span className="font-mono">{req.accountDetails.accountNumber}</span>
                  </div>
                  {req.trxId && (
                    <div className="font-mono text-xs text-emerald-600 dark:text-emerald-400 flex items-center justify-between">
                      <span>TrxID:</span>
                      <span className="font-bold">{req.trxId}</span>
                    </div>
                  )}
                  <div className="text-[11px] text-slate-500 dark:text-slate-400">{formatDateTime(req.requestedAt)}</div>
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-white/5">
                  <span className="text-[11px] text-slate-500 dark:text-slate-400">
                    {req.rejectionReason ? `Rejected: ${req.rejectionReason}` : req.remarks || ''}
                  </span>
                  <button
                    type="button"
                    onClick={(e) => handleOpenMenu(req, e)}
                    className="p-2 rounded-xl text-slate-500 hover:text-navy-900 dark:text-slate-400 dark:hover:text-white hover:bg-slate-200/70 dark:hover:bg-navy-800"
                    aria-label="Actions menu"
                  >
                    <MoreVertical className="h-4 w-4" />
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* 2. Desktop Table (>= md) */}
      <div className="hidden md:block overflow-x-auto">
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="border-b border-slate-200 dark:border-white/10 bg-slate-50/70 dark:bg-navy-950/70 text-xs font-bold text-slate-600 dark:text-slate-300 uppercase tracking-wider">
              <th className="py-3.5 pl-4 pr-2 w-10 align-middle">
                <input
                  type="checkbox"
                  checked={allVisibleSelected}
                  onChange={onToggleSelectAll}
                  aria-label="Select all requests on this page"
                  className="w-4 h-4 rounded bg-slate-50 dark:bg-navy-950 border-slate-300 dark:border-white/15 text-orange-600 focus:ring-orange-500 cursor-pointer accent-orange-500"
                />
              </th>
              <th className="py-3.5 px-3 align-middle">Request ID &amp; Date</th>
              <th className="py-3.5 px-3 align-middle">Merchant / Store</th>
              <th className="py-3.5 px-3 align-middle">Amount</th>
              <th className="py-3.5 px-3 align-middle">Method &amp; Account Details</th>
              <th className="py-3.5 px-3 text-center align-middle">Status</th>
              <th className="py-3.5 pl-3 pr-5 text-center align-middle w-16">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200/60 dark:divide-white/10 font-sans">
            {requests.length === 0 ? (
              <tr>
                <td colSpan={7} className="p-10 text-center text-xs text-slate-600 dark:text-slate-300">
                  No payment requests found matching your filters.
                </td>
              </tr>
            ) : (
              requests.map((req) => {
                const isSelected = selectedIds.includes(req.id);
                return (
                  <tr
                    key={req.id}
                    className={`hover:bg-slate-100/40 dark:hover:bg-navy-800/40 transition-colors ${
                      isSelected ? 'bg-orange-500/5' : ''
                    }`}
                  >
                    <td className="py-3.5 pl-4 pr-2 w-10 align-middle">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => onToggleSelectRow(req.id)}
                        aria-label={`Select ${req.requestCode}`}
                        className="w-4 h-4 rounded bg-slate-50 dark:bg-navy-950 border-slate-300 dark:border-white/15 text-orange-600 focus:ring-orange-500 cursor-pointer accent-orange-500"
                      />
                    </td>

                    <td className="py-3.5 px-3 align-middle">
                      <span className="font-mono text-xs font-bold text-navy-800 dark:text-white block">
                        {req.requestCode}
                      </span>
                      <span className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-1 mt-0.5">
                        <Clock className="w-3 h-3" />
                        <span>{formatDateTime(req.requestedAt)}</span>
                      </span>
                    </td>

                    <td className="py-3.5 px-3 align-middle">
                      <div className="font-semibold text-navy-800 dark:text-white flex items-center gap-1.5">
                        <Store className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400 shrink-0" />
                        <span>{req.merchantName}</span>
                      </div>
                      <div className="tabular-nums text-xs font-bold text-orange-600 dark:text-orange-400 mt-0.5">
                        {req.merchantCode} ·{' '}
                        <span className="font-sans text-slate-600 dark:text-slate-300 font-normal">
                          {req.ownerName}
                        </span>
                      </div>
                    </td>

                    <td className="py-3.5 px-3 align-middle">
                      <span className="tabular-nums text-sm font-extrabold text-orange-600 dark:text-orange-400 block">
                        ৳{req.amount.toLocaleString()}
                      </span>
                    </td>

                    <td className="py-3.5 px-3 align-middle">
                      <div>{getMethodBadge(req)}</div>
                      <div className="font-mono text-xs text-slate-700 dark:text-slate-200 font-semibold mt-0.5">
                        {req.accountDetails.accountNumber}
                      </div>
                      <div className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">
                        {req.accountDetails.provider}
                        {req.accountDetails.accountHolder && ` · ${req.accountDetails.accountHolder}`}
                      </div>
                    </td>

                    <td className="py-3.5 px-3 text-center align-middle">
                      <div className="flex flex-col items-center gap-1">
                        {getStatusBadge(req)}
                        {req.trxId && (
                          <span className="font-mono text-[11px] font-bold text-emerald-600 dark:text-emerald-400">
                            Trx: {req.trxId}
                          </span>
                        )}
                        {req.status === 'REJECTED' && req.rejectionReason && (
                          <span className="text-[10px] text-rose-600 dark:text-rose-400 max-w-[160px] truncate">
                            {req.rejectionReason}
                          </span>
                        )}
                      </div>
                    </td>

                    <td className="py-3.5 pl-3 pr-5 text-center align-middle">
                      <div className="flex items-center justify-center">
                        <button
                          type="button"
                          onClick={(e) => handleOpenMenu(req, e)}
                          className="p-2 rounded-xl text-slate-500 hover:text-navy-900 dark:text-slate-400 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-navy-800 transition-colors cursor-pointer"
                          aria-label="Actions menu"
                        >
                          <MoreVertical className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Portaled Clamped Dropdown Menu */}
      {menuState &&
        typeof document !== 'undefined' &&
        createPortal(
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              position: 'fixed',
              top: menuState.top,
              left: menuState.left,
              width: 210,
              maxHeight: 'calc(100vh - 20px)',
            }}
            className="z-[9999] rounded-xl border border-slate-200 dark:border-white/15 bg-white dark:bg-navy-900 shadow-2xl py-1.5 overflow-y-auto text-xs"
          >
            {menuState.req.status === 'PENDING' && (
              <>
                <button
                  type="button"
                  onClick={() => {
                    const target = menuState.req;
                    setMenuState(null);
                    onAccept(target);
                  }}
                  className="w-full px-3.5 py-2 text-left text-emerald-700 dark:text-emerald-300 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 font-semibold flex items-center gap-2 cursor-pointer"
                >
                  <Check className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                  <span>Accept Request</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const target = menuState.req;
                    setMenuState(null);
                    onOpenPayModal(target);
                  }}
                  className="w-full px-3.5 py-2 text-left text-orange-600 dark:text-orange-400 hover:bg-orange-50 dark:hover:bg-orange-950/30 font-semibold flex items-center gap-2 cursor-pointer"
                >
                  <CreditCard className="w-4 h-4" />
                  <span>Pay &amp; Attach Proof</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const target = menuState.req;
                    setMenuState(null);
                    onReject(target);
                  }}
                  className="w-full px-3.5 py-2 text-left text-rose-700 dark:text-rose-300 hover:bg-rose-50 dark:hover:bg-rose-950/40 font-semibold flex items-center gap-2 border-t border-slate-100 dark:border-white/10 cursor-pointer"
                >
                  <XCircle className="w-4 h-4 text-rose-600 dark:text-rose-400" />
                  <span>Reject Request</span>
                </button>
              </>
            )}

            {menuState.req.status === 'ACCEPTED' && (
              <>
                <button
                  type="button"
                  onClick={() => {
                    const target = menuState.req;
                    setMenuState(null);
                    onOpenPayModal(target);
                  }}
                  className="w-full px-3.5 py-2 text-left text-orange-600 dark:text-orange-400 hover:bg-orange-50 dark:hover:bg-orange-950/30 font-semibold flex items-center gap-2 cursor-pointer"
                >
                  <CreditCard className="w-4 h-4" />
                  <span>Pay &amp; Attach Proof</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const target = menuState.req;
                    setMenuState(null);
                    onReject(target);
                  }}
                  className="w-full px-3.5 py-2 text-left text-rose-700 dark:text-rose-300 hover:bg-rose-50 dark:hover:bg-rose-950/40 font-semibold flex items-center gap-2 border-t border-slate-100 dark:border-white/10 cursor-pointer"
                >
                  <XCircle className="w-4 h-4 text-rose-600 dark:text-rose-400" />
                  <span>Reject Request</span>
                </button>
              </>
            )}

            {menuState.req.status === 'PAID' && (
              <button
                type="button"
                onClick={() => {
                  const target = menuState.req;
                  setMenuState(null);
                  onViewProof(target);
                }}
                className="w-full px-3.5 py-2 text-left text-emerald-700 dark:text-emerald-300 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 font-semibold flex items-center gap-2 cursor-pointer"
              >
                <ShieldCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                <span>View Digital Proof</span>
              </button>
            )}

            {(menuState.req.status === 'REJECTED' || menuState.req.status === 'CANCELLED') && (
              <div className="px-3.5 py-2 text-[11px] text-slate-500 dark:text-slate-400">
                No further actions ({menuState.req.status.toLowerCase()})
              </div>
            )}
          </div>,
          document.body,
        )}
    </div>
  );
}
