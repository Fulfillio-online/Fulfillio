'use client';

import React, { useState, useEffect } from 'react';
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
  ChevronDown,
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
}: PaymentRequestsTableProps) {
  const [activeMenuId, setActiveMenuId] = useState<string | null>(null);

  // Close dropdown on outside click
  useEffect(() => {
    if (!activeMenuId) return;
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target.closest('[data-dropdown-container]')) {
        setActiveMenuId(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [activeMenuId]);
  const getMethodBadge = (req: PaymentRequest) => {
    switch (req.method) {
      case 'BKASH':
        return (
          <div className="flex items-center gap-1.5 text-pink-400 font-semibold text-xs">
            <Smartphone className="w-3.5 h-3.5 shrink-0" />
            <span>bKash</span>
          </div>
        );
      case 'NAGAD':
        return (
          <div className="flex items-center gap-1.5 text-orange-400 font-semibold text-xs">
            <Smartphone className="w-3.5 h-3.5 shrink-0" />
            <span>Nagad</span>
          </div>
        );
      case 'BANK_TRANSFER':
        return (
          <div className="flex items-center gap-1.5 text-sky-400 font-semibold text-xs">
            <Building2 className="w-3.5 h-3.5 shrink-0" />
            <span>Bank Transfer</span>
          </div>
        );
      case 'CASH':
      default:
        return (
          <div className="flex items-center gap-1.5 text-slate-300 font-semibold text-xs">
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
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider bg-amber-500/15 text-amber-300 border border-amber-500/30">
            <Clock className="w-3 h-3" />
            Pending
          </span>
        );
      case 'ACCEPTED':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider bg-sky-500/15 text-sky-300 border border-sky-500/30">
            <Check className="w-3 h-3" />
            Accepted
          </span>
        );
      case 'PAID':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
            <CheckCircle2 className="w-3 h-3" />
            Paid
          </span>
        );
      case 'REJECTED':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider bg-rose-500/15 text-rose-300 border border-rose-500/30">
            <XCircle className="w-3 h-3" />
            Rejected
          </span>
        );
    }
  };

  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-900/90 overflow-hidden shadow-xl">
      {/* 1. Mobile Cards (< md screens) */}
      <div className="block md:hidden p-3 space-y-3">
        {requests.length === 0 ? (
          <div className="p-8 text-center text-xs text-slate-400">
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
                    ? 'border-emerald-500/50 bg-emerald-950/20'
                    : 'border-slate-800 bg-slate-950/70'
                }`}
              >
                {/* Row 1: Checkbox + ID + Status */}
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => onToggleSelectRow(req.id)}
                      aria-label={`Select ${req.id}`}
                      className="w-4 h-4 rounded bg-slate-950 border-slate-700 text-emerald-500 focus:ring-emerald-500 cursor-pointer accent-emerald-500"
                    />
                    <span className="font-mono text-xs font-extrabold text-white">
                      {req.id}
                    </span>
                  </div>
                  <div>{getStatusBadge(req)}</div>
                </div>

                {/* Row 2: Merchant & Amount */}
                <div className="flex items-center justify-between text-xs pt-1 border-t border-slate-900">
                  <div>
                    <div className="font-bold text-white">{req.merchantName}</div>
                    <div className="text-[11px] font-mono text-emerald-400">{req.merchantCode}</div>
                  </div>
                  <div className="text-right">
                    <span className="font-mono text-base font-extrabold text-emerald-400">
                      ৳{req.amount.toLocaleString()}
                    </span>
                  </div>
                </div>

                {/* Row 3: Account info & TrxID */}
                <div className="text-xs space-y-1 pt-1 border-t border-slate-900 text-slate-300">
                  <div className="flex items-center justify-between">
                    <div>{getMethodBadge(req)}</div>
                    <span className="font-mono text-slate-300">{req.accountDetails.accountNumber}</span>
                  </div>
                  {req.trxId && (
                    <div className="font-mono text-[11px] text-emerald-400 flex items-center justify-between">
                      <span className="text-slate-500">TrxID:</span>
                      <span className="font-bold">{req.trxId}</span>
                    </div>
                  )}
                  <div className="text-[10px] text-slate-500">{req.requestedAt}</div>
                </div>

                {/* Row 4: Action Buttons */}
                <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-900">
                  {req.status === 'PENDING' && (
                    <div className="relative inline-block text-left" data-dropdown-container>
                      <button
                        type="button"
                        onClick={() =>
                          setActiveMenuId(activeMenuId === `mob-${req.id}` ? null : `mob-${req.id}`)
                        }
                        className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-bold text-slate-200 border border-slate-700 flex items-center gap-1.5 transition-colors cursor-pointer shadow-sm"
                      >
                        <span>Actions</span>
                        <ChevronDown
                          className={`w-3.5 h-3.5 transition-transform duration-200 ${
                            activeMenuId === `mob-${req.id}` ? 'rotate-180 text-emerald-400' : 'text-slate-400'
                          }`}
                        />
                      </button>

                      {activeMenuId === `mob-${req.id}` && (
                        <div className="absolute right-0 bottom-full mb-1.5 w-44 rounded-xl bg-slate-900 border border-slate-800 shadow-2xl py-1.5 z-[100] text-left text-xs pointer-events-auto">
                          <button
                            type="button"
                            onClick={() => {
                              setActiveMenuId(null);
                              onAccept(req);
                            }}
                            className="w-full px-3 py-2 text-left text-emerald-300 hover:bg-emerald-950/40 font-semibold flex items-center gap-2 transition-colors cursor-pointer"
                          >
                            <Check className="w-4 h-4 text-emerald-400" />
                            <span>Accept Request</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setActiveMenuId(null);
                              onReject(req);
                            }}
                            className="w-full px-3 py-2 text-left text-rose-300 hover:bg-rose-950/40 font-semibold flex items-center gap-2 transition-colors cursor-pointer border-t border-slate-800"
                          >
                            <XCircle className="w-4 h-4 text-rose-400" />
                            <span>Reject Request</span>
                          </button>
                        </div>
                      )}
                    </div>
                  )}

                  {req.status === 'ACCEPTED' && (
                    <button
                      type="button"
                      onClick={() => onOpenPayModal(req)}
                      className="px-3.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center gap-1.5 shadow-md transition-colors cursor-pointer"
                    >
                      <CreditCard className="w-3.5 h-3.5" />
                      <span>Pay Payout</span>
                    </button>
                  )}

                  {req.status === 'REJECTED' && (
                    <span className="text-xs text-rose-400 font-semibold inline-flex items-center gap-1">
                      <XCircle className="w-3.5 h-3.5 text-rose-400" />
                      <span>Rejected</span>
                    </span>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* 2. Desktop Full Table (>= md screens) */}
      <div className="hidden md:block overflow-x-auto">
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="border-b border-slate-800 bg-slate-950/70 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
              <th className="py-3.5 pl-4 pr-2 w-10 align-middle">
                <input
                  type="checkbox"
                  checked={allVisibleSelected}
                  onChange={onToggleSelectAll}
                  aria-label="Select all requests on this page"
                  className="w-4 h-4 rounded bg-slate-950 border-slate-700 text-emerald-500 focus:ring-emerald-500 cursor-pointer accent-emerald-500"
                />
              </th>
              <th className="py-3.5 px-3 align-middle">Request ID &amp; Date</th>
              <th className="py-3.5 px-3 align-middle">Merchant / Store</th>
              <th className="py-3.5 px-3 align-middle">Amount</th>
              <th className="py-3.5 px-3 align-middle">Method &amp; Account Details</th>
              <th className="py-3.5 px-3 align-middle">Status</th>
              <th className="py-3.5 pl-3 pr-5 text-right align-middle">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60 font-sans">
            {requests.length === 0 ? (
              <tr>
                <td colSpan={7} className="p-10 text-center text-xs text-slate-400">
                  No payment requests found matching your filters.
                </td>
              </tr>
            ) : (
              requests.map((req, idx) => {
                const isNearBottom = idx > 0 && idx >= requests.length - 2;
                const isSelected = selectedIds.includes(req.id);
                return (
                  <tr
                    key={req.id}
                    className={`hover:bg-slate-800/40 transition-colors ${
                      isSelected ? 'bg-emerald-950/15' : ''
                    }`}
                  >
                    {/* Checkbox */}
                    <td className="py-3.5 pl-4 pr-2 w-10 align-middle">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => onToggleSelectRow(req.id)}
                        aria-label={`Select ${req.id}`}
                        className="w-4 h-4 rounded bg-slate-950 border-slate-700 text-emerald-500 focus:ring-emerald-500 cursor-pointer accent-emerald-500"
                      />
                    </td>

                    {/* Request ID & Date */}
                    <td className="py-3.5 px-3 align-middle">
                      <span className="font-mono text-xs font-bold text-white block">
                        {req.id}
                      </span>
                      <span className="text-[11px] text-slate-400 flex items-center gap-1 mt-0.5">
                        <Clock className="w-3 h-3 text-slate-500" />
                        <span>{req.requestedAt}</span>
                      </span>
                    </td>

                    {/* Merchant & Store */}
                    <td className="py-3.5 px-3 align-middle">
                      <div className="font-semibold text-white flex items-center gap-1.5">
                        <Store className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                        <span>{req.merchantName}</span>
                      </div>
                      <div className="font-mono text-[11px] font-bold text-emerald-400 mt-0.5">
                        {req.merchantCode} · <span className="font-sans text-slate-400 font-normal">{req.ownerName}</span>
                      </div>
                    </td>

                    {/* Amount */}
                    <td className="py-3.5 px-3 align-middle">
                      <span className="font-mono text-sm font-extrabold text-emerald-400 block">
                        ৳{req.amount.toLocaleString()}
                      </span>
                    </td>

                    {/* Method & Account Details */}
                    <td className="py-3.5 px-3 align-middle">
                      <div>{getMethodBadge(req)}</div>
                      <div className="font-mono text-xs text-slate-300 font-semibold mt-0.5">
                        {req.accountDetails.accountNumber}
                      </div>
                      <div className="text-[10px] text-slate-500 font-medium">
                        {req.accountDetails.provider}
                        {req.accountDetails.accountHolder && ` · ${req.accountDetails.accountHolder}`}
                      </div>
                    </td>

                    {/* Status */}
                    <td className="py-3.5 px-3 align-middle">
                      <div>{getStatusBadge(req)}</div>
                      {req.trxId && (
                        <div className="font-mono text-[10px] font-bold text-emerald-400 mt-1">
                          Trx: {req.trxId}
                        </div>
                      )}
                    </td>

                    {/* Actions Column */}
                    <td className="py-3.5 pl-3 pr-5 text-right align-middle">
                      {req.status === 'PENDING' && (
                        <div className="relative inline-block text-left" data-dropdown-container>
                          <button
                            type="button"
                            onClick={() =>
                              setActiveMenuId(activeMenuId === req.id ? null : req.id)
                            }
                            className="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-bold text-slate-200 border border-slate-700 flex items-center gap-1.5 transition-colors cursor-pointer shadow-sm"
                          >
                            <span>Actions</span>
                            <ChevronDown
                              className={`w-3.5 h-3.5 transition-transform duration-200 ${
                                activeMenuId === req.id ? 'rotate-180 text-emerald-400' : 'text-slate-400'
                              }`}
                            />
                          </button>

                          {activeMenuId === req.id && (
                            <div
                              className={`absolute right-0 ${
                                isNearBottom ? 'bottom-full mb-1.5' : 'top-full mt-1.5'
                              } w-44 rounded-xl bg-slate-900 border border-slate-800 shadow-2xl py-1.5 z-[100] text-left text-xs pointer-events-auto`}
                            >
                              <button
                                type="button"
                                onClick={() => {
                                  setActiveMenuId(null);
                                  onAccept(req);
                                }}
                                className="w-full px-3 py-2 text-left text-emerald-300 hover:bg-emerald-950/40 font-semibold flex items-center gap-2 transition-colors cursor-pointer"
                              >
                                <Check className="w-4 h-4 text-emerald-400" />
                                <span>Accept Request</span>
                              </button>
                              <button
                                type="button"
                                onClick={() => {
                                  setActiveMenuId(null);
                                  onReject(req);
                                }}
                                className="w-full px-3 py-2 text-left text-rose-300 hover:bg-rose-950/40 font-semibold flex items-center gap-2 transition-colors cursor-pointer border-t border-slate-800"
                              >
                                <XCircle className="w-4 h-4 text-rose-400" />
                                <span>Reject Request</span>
                              </button>
                            </div>
                          )}
                        </div>
                      )}

                      {req.status === 'ACCEPTED' && (
                        <button
                          type="button"
                          onClick={() => onOpenPayModal(req)}
                          className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center gap-1.5 shadow-md transition-colors cursor-pointer ml-auto"
                        >
                          <CreditCard className="w-3.5 h-3.5" />
                          <span>Pay Payout</span>
                        </button>
                      )}

                      {req.status === 'REJECTED' && (
                        <span className="text-xs text-rose-400 font-semibold inline-flex items-center gap-1">
                          <XCircle className="w-3.5 h-3.5 text-rose-400" />
                          <span>Rejected</span>
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
