'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  Clock,
  XCircle,
  CheckCircle2,
  MapPin,
  ExternalLink,
  RotateCcw,
  AlertCircle,
  Loader2,
} from 'lucide-react';
import { CancelledOrderItemRecord } from '../types';

interface CancelledOrdersTableProps {
  orders: CancelledOrderItemRecord[];
  availableBins: string[];
  restockingId?: string | null;
  onRestockOrderToBin?: (order: CancelledOrderItemRecord, bin: string) => void;
}

export function CancelledOrdersTable({
  orders,
  availableBins,
  restockingId = null,
  onRestockOrderToBin,
}: CancelledOrdersTableProps) {
  const [selectedBins, setSelectedBins] = useState<Record<string, string>>({});

  if (orders.length === 0) {
    return (
      <div className="bg-white dark:bg-navy-900 border border-slate-200 dark:border-white/10 rounded-2xl p-12 text-center shadow-xl">
        <XCircle className="w-12 h-12 text-slate-300 dark:text-slate-600 mx-auto mb-3" />
        <h3 className="text-base font-bold text-navy-900 dark:text-white">
          No Cancelled Orders Recorded
        </h3>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-md mx-auto">
          When an order is cancelled from the Orders Pipeline, it appears here as{' '}
          <strong className="text-amber-600 dark:text-amber-400">Pending Restock</strong> so
          warehouse staff can verify and restock units to a bin.
        </p>
      </div>
    );
  }

  const binOptions = availableBins.length > 0 ? availableBins : ['A-01-01'];

  return (
    <div className="bg-white dark:bg-navy-900 border border-slate-200 dark:border-white/10 rounded-2xl overflow-hidden shadow-xl">
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse min-w-[1080px]">
          <thead>
            <tr className="border-b border-slate-200 dark:border-white/10 text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-300 bg-slate-50/60 dark:bg-navy-950/60">
              <th className="py-3.5 px-4">Order ID &amp; Cancelled</th>
              <th className="py-3.5 px-4">Product &amp; Variant Spec</th>
              <th className="py-3.5 px-4">Merchant</th>
              <th className="py-3.5 px-4">Customer &amp; COD</th>
              <th className="py-3.5 px-4">Stock Recovery Bin</th>
              <th className="py-3.5 px-4 text-center">Restock Status</th>
              <th className="py-3.5 px-4">Cancel Reason</th>
              <th className="py-3.5 px-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200/80 dark:divide-white/10 text-sm">
            {orders.map((item) => {
              const cleanId = (item.orderId || item.id || '').replace(/^#/, '').trim();
              const variantLabel = [item.color, item.size].filter(Boolean).join(' · ');
              const chosenBin =
                selectedBins[item.id] ||
                item.restockedBin ||
                item.targetBin ||
                binOptions[0];
              const isBusy = restockingId === item.id;

              const rowBins = binOptions.includes(chosenBin)
                ? binOptions
                : [chosenBin, ...binOptions];

              return (
                <tr
                  key={item.id}
                  className="hover:bg-slate-100/40 dark:hover:bg-navy-800/40 transition-colors"
                >
                  {/* Order ID & Cancelled Date */}
                  <td className="py-3.5 px-4">
                    <div className="flex items-center gap-1.5">
                      <span className="tabular-nums font-mono font-bold text-navy-900 dark:text-white text-sm">
                        #{cleanId}
                      </span>
                    </div>
                    <span className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1 mt-0.5">
                      <Clock className="w-3 h-3 text-slate-400" />
                      <span>{item.cancelledAt || 'Recently'}</span>
                    </span>
                  </td>

                  {/* Product & Variant Spec */}
                  <td className="py-3.5 px-4">
                    <div className="font-semibold text-navy-900 dark:text-white text-xs sm:text-sm line-clamp-1">
                      {item.productTitle}
                    </div>
                    <div className="flex items-center gap-2 mt-1 flex-wrap">
                      {variantLabel && (
                        <span className="text-xs font-medium text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-navy-800 px-2 py-0.5 rounded border border-slate-200/80 dark:border-white/10">
                          {variantLabel}
                        </span>
                      )}
                      <span className="tabular-nums font-mono text-[11px] text-emerald-700 dark:text-emerald-300 bg-emerald-500/10 border border-emerald-500/20 px-1.5 py-0.5 rounded">
                        {item.fullSku}
                      </span>
                      <span className="text-xs tabular-nums font-bold text-orange-600 dark:text-orange-400 bg-orange-500/10 px-2 py-0.5 rounded border border-orange-500/20">
                        Qty: {item.qty}
                      </span>
                    </div>
                  </td>

                  {/* Merchant */}
                  <td className="py-3.5 px-4">
                    <span className="tabular-nums text-xs font-bold text-orange-600 dark:text-orange-400 block">
                      {item.merchantCode}
                    </span>
                    <span className="text-xs text-slate-700 dark:text-slate-200 font-medium">
                      {item.merchantName}
                    </span>
                  </td>

                  {/* Customer & COD */}
                  <td className="py-3.5 px-4">
                    <div className="font-semibold text-xs text-navy-900 dark:text-white">
                      {item.customerName || 'Customer'}
                    </div>
                    <div className="text-[11px] font-mono text-slate-500 dark:text-slate-400">
                      {item.customerPhone}
                    </div>
                    <div className="text-xs font-bold font-mono text-navy-900 dark:text-slate-200 mt-0.5">
                      ৳{Number(item.codAmount || item.qty * item.unitPrice || 0).toLocaleString()}
                    </div>
                  </td>

                  {/* Stock Recovery Bin */}
                  <td className="py-3.5 px-4">
                    {item.isRestocked ? (
                      <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-500/30 text-xs font-mono font-bold text-emerald-700 dark:text-emerald-300">
                        <MapPin className="w-3.5 h-3.5 shrink-0" />
                        <span>{item.restockedBin || item.targetBin || 'A-01-01'}</span>
                      </div>
                    ) : (
                      <select
                        value={chosenBin}
                        onChange={(e) =>
                          setSelectedBins((prev) => ({ ...prev, [item.id]: e.target.value }))
                        }
                        aria-label={`Select restock bin for order ${cleanId}`}
                        className="px-2.5 py-1.5 rounded-lg bg-slate-50 dark:bg-navy-950 border border-slate-200 dark:border-white/15 text-xs font-mono font-bold text-navy-900 dark:text-slate-100 focus:outline-none focus:border-orange-500 cursor-pointer"
                      >
                        {rowBins.map((b) => (
                          <option key={b} value={b}>
                            {b}
                          </option>
                        ))}
                      </select>
                    )}
                  </td>

                  {/* Restock Status */}
                  <td className="py-3.5 px-4 text-center">
                    {item.isRestocked ? (
                      <>
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                          <span>+{item.qty} Restocked</span>
                        </span>
                        <span className="block text-[10px] text-slate-400 mt-0.5 font-mono">
                          {item.restockedAt || 'Saved to DB'}
                        </span>
                      </>
                    ) : (
                      <>
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-500/30">
                          <AlertCircle className="w-3.5 h-3.5 text-amber-500" />
                          <span>Pending Restock</span>
                        </span>
                        <span className="block text-[10px] text-slate-400 mt-0.5 font-mono">
                          Current Stock: {item.currentStockSnapshot ?? 0} pcs
                        </span>
                      </>
                    )}
                  </td>

                  {/* Reason / Notes */}
                  <td className="py-3.5 px-4 max-w-xs">
                    <p className="text-xs text-slate-600 dark:text-slate-300 line-clamp-2">
                      {item.cancelReason || 'Cancelled from Order Pipeline'}
                    </p>
                  </td>

                  {/* Actions */}
                  <td className="py-3.5 px-4 text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      {!item.isRestocked && onRestockOrderToBin && (
                        <button
                          type="button"
                          disabled={isBusy}
                          onClick={() => onRestockOrderToBin(item, chosenBin)}
                          className="px-3 py-1.5 rounded-lg bg-orange-600 hover:bg-orange-700 disabled:opacity-60 text-white text-xs font-bold inline-flex items-center gap-1.5 shadow-sm transition-colors cursor-pointer whitespace-nowrap"
                        >
                          {isBusy ? (
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          ) : (
                            <RotateCcw className="w-3.5 h-3.5" />
                          )}
                          <span>{isBusy ? 'Restocking...' : 'Restock to Bin'}</span>
                        </button>
                      )}
                      <Link
                        href={`/admin/orders/${encodeURIComponent(cleanId)}`}
                        className="px-2.5 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-navy-800 dark:hover:bg-navy-700 text-slate-700 dark:text-slate-200 text-xs font-semibold flex items-center gap-1 border border-slate-200/80 dark:border-white/10 transition-colors whitespace-nowrap"
                        title="View Order Details"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                        <span>View</span>
                      </Link>
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
