'use client';

import React from 'react';
import Image from 'next/image';
import {
  Clock,
  CheckCircle2,
  XCircle,
  Package,
  ArrowUpRight,
  ShieldCheck,
  Trash2,
} from 'lucide-react';
import { StockRequestItem } from '../types';

interface StockRequestsTableProps {
  requests: StockRequestItem[];
  onApproveRequest: (id: string) => void;
  onCancelRequest: (id: string) => void;
}

export function StockRequestsTable({
  requests,
  onApproveRequest,
  onCancelRequest,
}: StockRequestsTableProps) {
  if (requests.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-slate-800 p-12 text-center">
        <Package className="h-10 w-10 text-slate-600 mx-auto mb-3" />
        <h3 className="text-sm font-semibold text-slate-200">No Stock Requests</h3>
        <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
          You haven&apos;t submitted any restock requests yet. Go to your products list and click &ldquo;Manage Stock&rdquo; on any product to request inbound restock.
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-slate-800 bg-slate-900 overflow-hidden shadow-sm">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[700px] text-left text-sm">
          <thead className="bg-slate-950/60 text-slate-400 text-xs uppercase tracking-wider font-semibold border-b border-slate-800">
            <tr>
              <th className="p-4">Product & SKU</th>
              <th className="p-4">Current Stock</th>
              <th className="p-4">Requested Inbound</th>
              <th className="p-4">Inbound Notes / Ref</th>
              <th className="p-4">Status</th>
              <th className="p-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/80">
            {requests.map((r) => {
              const isPending = r.status === 'PENDING_APPROVAL';
              const isApproved = r.status === 'APPROVED';

              return (
                <tr key={r.id} className="hover:bg-slate-800/30 transition-colors">
                  <td className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="relative h-11 w-11 rounded-lg bg-slate-800 border border-slate-700 overflow-hidden shrink-0 flex items-center justify-center">
                        {r.imageUrl ? (
                          <Image
                            src={r.imageUrl}
                            alt={r.productTitle}
                            fill
                            sizes="44px"
                            className="object-cover"
                          />
                        ) : (
                          <Package className="h-5 w-5 text-slate-500" />
                        )}
                      </div>
                      <div className="min-w-0">
                        <span className="font-semibold text-slate-200 text-sm block truncate max-w-xs">
                          {r.productTitle}
                        </span>
                        <span className="font-mono text-[11px] text-slate-400 block mt-0.5">
                          {r.productSku}
                        </span>
                      </div>
                    </div>
                  </td>

                  <td className="p-4">
                    <span className="font-mono text-xs text-slate-300 font-semibold">
                      {r.currentStock} units
                    </span>
                  </td>

                  <td className="p-4">
                    <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 font-mono text-xs font-bold">
                      <ArrowUpRight className="h-3.5 w-3.5" />
                      <span>+{r.requestedQty} units</span>
                    </div>
                  </td>

                  <td className="p-4 text-xs text-slate-400 max-w-xs">
                    <span className="block truncate">{r.note || 'Restock request'}</span>
                    <span className="text-[10px] text-slate-500 block mt-0.5">
                      {r.createdAt}
                    </span>
                  </td>

                  <td className="p-4">
                    {isPending ? (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-amber-500/10 text-amber-300 border border-amber-500/30">
                        <Clock className="h-3 w-3 animate-pulse" />
                        <span>Pending Admin Approval</span>
                      </span>
                    ) : isApproved ? (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-emerald-500/10 text-emerald-300 border border-emerald-500/30">
                        <CheckCircle2 className="h-3 w-3" />
                        <span>Approved & Inbounded</span>
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-rose-500/10 text-rose-300 border border-rose-500/30">
                        <XCircle className="h-3 w-3" />
                        <span>Rejected</span>
                      </span>
                    )}
                  </td>

                  <td className="p-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      {isPending && (
                        <button
                          type="button"
                          onClick={() => onApproveRequest(r.id)}
                          className="px-2.5 py-1.5 rounded-lg bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 border border-emerald-500/30 text-xs font-semibold flex items-center gap-1 transition-colors cursor-pointer"
                          title="Simulate Admin Inbound Approval (Instant Restock)"
                        >
                          <ShieldCheck className="h-3.5 w-3.5 text-emerald-400" />
                          <span>Approve (Admin Demo)</span>
                        </button>
                      )}

                      <button
                        type="button"
                        onClick={() => onCancelRequest(r.id)}
                        className="p-1.5 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 transition-colors cursor-pointer"
                        title="Cancel Request"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
