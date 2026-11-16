'use client';

import React from 'react';
import {
  Clock,
  CheckCircle2,
  XCircle,
  Package,
  ArrowUpRight,
  RotateCcw,
  ShieldCheck,
  Trash2,
  Truck,
  MapPin,
  FileText,
} from 'lucide-react';
import { StockRequestItem } from '../types';
import { ProductThumbnail } from './ProductThumbnail';

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
      <div className="rounded-xl border border-dashed border-slate-200 dark:border-white/10 p-12 text-center bg-slate-50/50 dark:bg-navy-950/40">
        <Package className="h-10 w-10 text-slate-400 dark:text-slate-600 mx-auto mb-3" />
        <h3 className="text-sm font-semibold text-navy-900 dark:text-white">No Stock Requests</h3>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-sm mx-auto">
          You haven&apos;t submitted any restock or return requests yet. Go to your products list and click &ldquo;Request Inbound Restock&rdquo; or &ldquo;Request Product Return&rdquo; on any product.
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-slate-200/80 dark:border-white/10 bg-white dark:bg-navy-900 overflow-hidden shadow-xs">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[760px] text-left text-sm">
          <thead className="bg-slate-50 dark:bg-navy-950/70 text-slate-500 dark:text-slate-400 text-xs uppercase tracking-wider font-semibold border-b border-slate-200/80 dark:border-white/10">
            <tr>
              <th className="py-3 px-4">Type</th>
              <th className="py-3 px-4">Product & SKU</th>
              <th className="py-3 px-4 text-center">Warehouse Stock</th>
              <th className="py-3 px-4 text-center">Requested Qty</th>
              <th className="py-3 px-4">Details / Notes / Destination</th>
              <th className="py-3 px-4 text-center">Approval Status</th>
              <th className="py-3 px-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-white/5">
            {requests.map((r) => {
              const isPending = r.status === 'PENDING_APPROVAL';
              const isApproved = r.status === 'APPROVED';
              const isReturn = r.type === 'RETURN';

              return (
                <tr
                  key={r.id}
                  className="hover:bg-slate-50/80 dark:hover:bg-navy-800/40 transition-colors"
                >
                  {/* Type Badge */}
                  <td className="py-3.5 px-4 align-top">
                    {isReturn ? (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-orange-500/10 border border-orange-500/20 text-orange-600 dark:text-orange-400 font-bold text-xs">
                        <RotateCcw className="h-3.5 w-3.5" />
                        <span>RETURN / RECALL</span>
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 font-bold text-xs">
                        <ArrowUpRight className="h-3.5 w-3.5" />
                        <span>INBOUND RESTOCK</span>
                      </span>
                    )}
                  </td>

                  {/* Product & SKU */}
                  <td className="py-3.5 px-4 align-top">
                    <div className="flex items-center gap-3">
                      <ProductThumbnail src={r.imageUrl} alt={r.productTitle} size="md" />
                      <div className="min-w-0">
                        <span className="font-semibold text-navy-900 dark:text-white text-xs sm:text-sm block truncate max-w-xs">
                          {r.productTitle}
                        </span>
                        <span className="font-mono text-[11px] text-slate-500 dark:text-slate-400 block mt-0.5">
                          {r.productSku}
                        </span>
                      </div>
                    </div>
                  </td>

                  {/* Current Warehouse Stock */}
                  <td className="py-3.5 px-4 text-center align-top">
                    <span className="font-mono text-xs text-navy-800 dark:text-slate-200 font-bold">
                      {r.currentStock} units
                    </span>
                  </td>

                  {/* Requested Qty */}
                  <td className="py-3.5 px-4 text-center align-top">
                    {isReturn ? (
                      <div className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-orange-500/10 border border-orange-500/20 text-orange-600 dark:text-orange-400 font-mono text-xs font-bold">
                        <RotateCcw className="h-3 w-3" />
                        <span>-{r.requestedQty} pcs</span>
                      </div>
                    ) : (
                      <div className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 font-mono text-xs font-bold">
                        <ArrowUpRight className="h-3 w-3" />
                        <span>+{r.requestedQty} pcs</span>
                      </div>
                    )}
                  </td>

                  {/* Details / Notes / Destination */}
                  <td className="py-3.5 px-4 text-xs text-slate-600 dark:text-slate-300 max-w-xs align-top space-y-1">
                    {isReturn ? (
                      <>
                        {r.reason && (
                          <div className="flex items-start gap-1 text-[11px] font-medium text-navy-900 dark:text-slate-200">
                            <FileText className="h-3 w-3 text-orange-500 shrink-0 mt-0.5" />
                            <span>{r.reason}</span>
                          </div>
                        )}
                        {r.destination && (
                          <div className="flex items-start gap-1 text-[11px] text-slate-500 dark:text-slate-400">
                            <MapPin className="h-3 w-3 text-slate-400 shrink-0 mt-0.5" />
                            <span>{r.destination}</span>
                          </div>
                        )}
                      </>
                    ) : (
                      <>
                        <div className="truncate font-medium">{r.note || 'Inbound Restock Request'}</div>
                        {(r.carrier || r.trackingRef) && (
                          <div className="flex items-center gap-1 text-[11px] text-slate-500 font-mono">
                            <Truck className="h-3 w-3 text-emerald-500 shrink-0" />
                            <span>{r.carrier || 'Logistics'} {r.trackingRef ? `(${r.trackingRef})` : ''}</span>
                          </div>
                        )}
                      </>
                    )}
                    <span className="text-[10px] text-slate-400 block pt-0.5">
                      Submitted: {r.createdAt}
                    </span>
                  </td>

                  {/* Status Badge */}
                  <td className="py-3.5 px-4 text-center align-top">
                    {isPending ? (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/30">
                        <Clock className="h-3 w-3 animate-pulse" />
                        <span>Pending Admin Approval</span>
                      </span>
                    ) : isApproved ? (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30">
                        <CheckCircle2 className="h-3 w-3" />
                        <span>{isReturn ? 'Approved (Gate Pass Issued)' : 'Approved & Inbounded'}</span>
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/30">
                        <XCircle className="h-3 w-3" />
                        <span>Rejected</span>
                      </span>
                    )}
                  </td>

                  {/* Actions */}
                  <td className="py-3.5 px-4 text-right align-top">
                    <div className="flex items-center justify-end gap-2">
                      {isPending && (
                        <button
                          type="button"
                          onClick={() => onApproveRequest(r.id)}
                          className="px-2.5 py-1.5 rounded-lg bg-emerald-600/10 hover:bg-emerald-600/20 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 text-xs font-semibold flex items-center gap-1 transition-colors cursor-pointer"
                          title="Instant Approval Demo"
                        >
                          <ShieldCheck className="h-3.5 w-3.5 text-emerald-500" />
                          <span>Approve (Demo)</span>
                        </button>
                      )}

                      <button
                        type="button"
                        onClick={() => onCancelRequest(r.id)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-500/10 transition-colors cursor-pointer"
                        title="Cancel Request"
                        aria-label="Cancel Request"
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
