'use client';

import React, { useState } from 'react';
import {
  Clock,
  CheckCircle2,
  XCircle,
  Package,
  ArrowUpRight,
  RotateCcw,
  Trash2,
  Truck,
  MapPin,
  FileText,
  Layers,
  X,
} from 'lucide-react';
import { StockManageRequestRecord, StockRequestItem } from '../types';
import { ProductThumbnail } from './ProductThumbnail';

interface StockRequestsTableProps {
  requests: StockRequestItem[];
  stockManageRequests?: StockManageRequestRecord[];
  onApproveRequest?: (id: string) => void;
  onCancelRequest: (id: string) => void;
  onCancelManageRequest?: (id: string) => void;
}

export function StockRequestsTable({
  requests,
  stockManageRequests = [],
  onCancelRequest,
  onCancelManageRequest,
}: StockRequestsTableProps) {
  const [previewImage, setPreviewImage] = useState<{ title: string; url: string } | null>(null);

  if (requests.length === 0 && stockManageRequests.length === 0) {
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
    <div className="space-y-6">
      {stockManageRequests.length > 0 && (
        <div className="rounded-xl border border-slate-200/80 dark:border-white/10 bg-white dark:bg-navy-900 overflow-hidden shadow-xs">
          <div className="px-4 py-3 border-b border-slate-200/80 dark:border-white/10 bg-slate-50/80 dark:bg-navy-950/60 flex items-center justify-between">
            <div>
              <h3 className="text-xs sm:text-sm font-bold text-navy-900 dark:text-white">
                Stock, Recall &amp; Variant Requests ({stockManageRequests.length})
              </h3>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                All recall/return, inbound restock, and variant/quantity requests require Admin verification before live stock updates.
              </p>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[920px] text-left text-sm">
              <thead className="bg-slate-50 dark:bg-navy-950/70 text-slate-500 dark:text-slate-400 text-xs uppercase tracking-wider font-semibold border-b border-slate-200/80 dark:border-white/10">
                <tr>
                  <th className="py-3 px-4">Type</th>
                  <th className="py-3 px-4">Product &amp; SKU</th>
                  <th className="py-3 px-4">Variants / Changes</th>
                  <th className="py-3 px-4">Qty Adjustments</th>
                  <th className="py-3 px-4">Details / Destination / Reason</th>
                  <th className="py-3 px-4 text-center">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-white/5">
                {stockManageRequests.map((req) => {
                  const opType = req.operationType || 'ADJUST';
                  const isRecall = opType === 'RETURN';
                  const isRestock = opType === 'RESTOCK';
                  const variantLabel = [req.color, req.size].filter(Boolean).join(' / ');

                  return (
                    <tr key={req.id} className="hover:bg-slate-50/80 dark:hover:bg-navy-800/40">
                      <td className="py-3.5 px-4 align-top">
                        {isRecall ? (
                          <div className="space-y-1">
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-orange-500/10 border border-orange-500/20 text-orange-600 dark:text-orange-400 font-bold text-[11px] whitespace-nowrap">
                              <RotateCcw className="h-3.5 w-3.5" />
                              <span>RETURN / RECALL</span>
                            </span>
                            {req.requestedQty ? (
                              <div className="font-mono text-xs font-extrabold text-orange-600 dark:text-orange-400">
                                -{req.requestedQty} pcs
                              </div>
                            ) : null}
                          </div>
                        ) : isRestock ? (
                          <div className="space-y-1">
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 font-bold text-[11px] whitespace-nowrap">
                              <ArrowUpRight className="h-3.5 w-3.5" />
                              <span>INBOUND RESTOCK</span>
                            </span>
                            {req.requestedQty ? (
                              <div className="font-mono text-xs font-extrabold text-emerald-600 dark:text-emerald-400">
                                +{req.requestedQty} pcs
                              </div>
                            ) : null}
                          </div>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-indigo-500/10 border border-indigo-500/20 text-indigo-600 dark:text-indigo-400 font-bold text-[11px] whitespace-nowrap">
                            <Layers className="h-3.5 w-3.5" />
                            <span>STOCK / VARIANT</span>
                          </span>
                        )}
                      </td>

                      <td className="py-3.5 px-4 align-top">
                        <div className="flex items-center gap-3">
                          <ProductThumbnail src={req.productImageUrl} alt={req.productTitle} size="md" />
                          <div className="min-w-0">
                            <span className="font-semibold text-navy-900 dark:text-white text-xs sm:text-sm block truncate max-w-[200px]">
                              {req.productTitle}
                            </span>
                            <span className="font-mono text-[11px] text-slate-500 dark:text-slate-400 block mt-0.5">
                              {req.variantSku || req.productSku}
                            </span>
                            <span className="text-[10px] text-slate-400 block mt-0.5">
                              {new Date(req.createdAt).toLocaleString()}
                            </span>
                          </div>
                        </div>
                      </td>

                      <td className="py-3.5 px-4 align-top">
                        {isRecall || isRestock ? (
                          <div className="space-y-1 text-xs">
                            <div className="font-semibold text-navy-900 dark:text-white">
                              {variantLabel || 'Default / Product Level'}
                            </div>
                            {req.variantSku && (
                              <div className="font-mono text-[11px] text-slate-500 dark:text-slate-400">
                                SKU: {req.variantSku}
                              </div>
                            )}
                          </div>
                        ) : req.newVariants.length === 0 ? (
                          <span className="text-xs text-slate-400 italic">None</span>
                        ) : (
                          <div className="space-y-1.5">
                            {req.newVariants.map((nv, i) => (
                              <div key={i} className="flex items-center gap-2 text-xs">
                                {nv.imageUrl && (
                                  <button
                                    type="button"
                                    onClick={() =>
                                      setPreviewImage({
                                        title: `${req.productTitle} — ${[nv.color, nv.size]
                                          .filter(Boolean)
                                          .join(' / ')}`,
                                        url: nv.imageUrl!,
                                      })
                                    }
                                    className="shrink-0 cursor-pointer hover:opacity-80"
                                    title="Click to zoom variant photo"
                                  >
                                    {/* eslint-disable-next-line @next/next/no-img-element */}
                                    <img
                                      src={nv.imageUrl}
                                      alt={nv.color || 'Variant'}
                                      className="h-7 w-7 rounded object-cover border border-slate-200 dark:border-white/10"
                                    />
                                  </button>
                                )}
                                <span className="font-semibold text-navy-900 dark:text-white">
                                  {[nv.color, nv.size].filter(Boolean).join(' / ') || 'Standard'}
                                </span>
                                <span className="font-mono text-emerald-600 dark:text-emerald-400 font-bold">
                                  +{nv.stock} pcs
                                </span>
                              </div>
                            ))}
                          </div>
                        )}
                      </td>

                      <td className="py-3.5 px-4 align-top">
                        {req.adjustments.length === 0 ? (
                          <span className="text-xs text-slate-400 italic">None</span>
                        ) : (
                          <div className="space-y-1 text-xs">
                            {req.adjustments.map((adj, i) => (
                              <div key={i} className="font-mono">
                                <span className="text-slate-600 dark:text-slate-300 font-sans font-semibold mr-1.5">
                                  {[adj.color, adj.size].filter(Boolean).join(' / ') || adj.variantSku || 'Base'}:
                                </span>
                                <span className="text-slate-400">{adj.previousQuantity ?? '—'}</span>
                                <span className="mx-1 text-slate-400">→</span>
                                <span
                                  className={`font-bold ${
                                    isRecall
                                      ? 'text-orange-600 dark:text-orange-400'
                                      : isRestock
                                      ? 'text-emerald-600 dark:text-emerald-400'
                                      : 'text-orange-600 dark:text-orange-400'
                                  }`}
                                >
                                  {adj.newQuantity} pcs
                                </span>
                              </div>
                            ))}
                          </div>
                        )}
                      </td>

                      <td className="py-3.5 px-4 align-top text-xs text-slate-600 dark:text-slate-300 space-y-1 max-w-[230px]">
                        <p className="font-medium text-navy-900 dark:text-slate-200">
                          {req.reason || '—'}
                        </p>
                        {req.destination && (
                          <div className="flex items-start gap-1 text-[11px] text-slate-500 dark:text-slate-400">
                            <MapPin className="h-3 w-3 text-orange-500 shrink-0 mt-0.5" />
                            <span>{req.destination}</span>
                          </div>
                        )}
                        {(req.carrier || req.trackingRef) && (
                          <div className="flex items-center gap-1 text-[11px] font-mono text-slate-500 dark:text-slate-400">
                            <Truck className="h-3 w-3 text-emerald-500 shrink-0" />
                            <span>
                              {[req.carrier, req.trackingRef].filter(Boolean).join(' · ')}
                            </span>
                          </div>
                        )}
                        {req.note && req.note !== req.reason && (
                          <p className="text-[11px] text-slate-400">Note: {req.note}</p>
                        )}
                        {req.status === 'APPROVED' && req.gatePassNo && (
                          <span className="inline-block px-2 py-0.5 rounded bg-emerald-500/10 border border-emerald-500/20 font-mono text-[11px] font-bold text-emerald-600 dark:text-emerald-400">
                            Gate Pass: {req.gatePassNo}
                          </span>
                        )}
                        {req.status === 'REJECTED' && req.rejectionReason && (
                          <p className="mt-1 text-rose-600 dark:text-rose-400 font-semibold">
                            Rejected: {req.rejectionReason}
                          </p>
                        )}
                      </td>

                      <td className="py-3.5 px-4 text-center align-top">
                        {req.status === 'PENDING' && (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-600 dark:text-amber-400 text-xs font-bold whitespace-nowrap">
                            <Clock className="h-3.5 w-3.5" />
                            <span>Pending Admin</span>
                          </span>
                        )}
                        {req.status === 'APPROVED' && (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-xs font-bold whitespace-nowrap">
                            <CheckCircle2 className="h-3.5 w-3.5" />
                            <span>{isRecall ? 'Approved (Gate Pass)' : 'Approved'}</span>
                          </span>
                        )}
                        {req.status === 'REJECTED' && (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-400 text-xs font-bold whitespace-nowrap">
                            <XCircle className="h-3.5 w-3.5" />
                            <span>Rejected</span>
                          </span>
                        )}
                      </td>

                      <td className="py-3.5 px-4 text-right align-top">
                        {req.status === 'PENDING' && onCancelManageRequest ? (
                          <button
                            type="button"
                            onClick={() => onCancelManageRequest(req.id)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-500/10 transition-colors cursor-pointer"
                            title="Cancel Pending Request"
                            aria-label="Cancel Pending Request"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        ) : (
                          <span className="text-[11px] text-slate-400">
                            {req.reviewedAt
                              ? new Date(req.reviewedAt).toLocaleDateString()
                              : '—'}
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {requests.length > 0 && (
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
      )}

      {/* Variant Image Zoom Preview Modal */}
      {previewImage && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-navy-950/80 backdrop-blur-xs"
          onClick={() => setPreviewImage(null)}
        >
          <div
            className="max-w-lg w-full rounded-2xl bg-white dark:bg-navy-900 border border-slate-200 dark:border-white/10 p-4 space-y-3 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-navy-900 dark:text-white truncate">
                {previewImage.title}
              </span>
              <button
                type="button"
                onClick={() => setPreviewImage(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-white"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={previewImage.url}
              alt={previewImage.title}
              className="w-full max-h-[65vh] object-contain rounded-xl bg-slate-50 dark:bg-navy-950"
            />
          </div>
        </div>
      )}
    </div>
  );
}
