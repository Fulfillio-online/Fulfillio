'use client';

import React from 'react';
import Link from 'next/link';
import {
  Clock,
  XCircle,
  Package,
  CheckCircle2,
  MapPin,
  ExternalLink,
  ShieldCheck,
  RotateCcw,
} from 'lucide-react';
import { CancelledOrderItemRecord } from '../types';

interface CancelledOrdersTableProps {
  orders: CancelledOrderItemRecord[];
  availableBins: string[];
  onRestockOrderToBin?: (order: CancelledOrderItemRecord, bin: string) => void;
}

export function CancelledOrdersTable({
  orders,
  availableBins,
  onRestockOrderToBin,
}: CancelledOrdersTableProps) {
  if (orders.length === 0) {
    return (
      <div className="bg-white dark:bg-navy-900 border border-slate-200 dark:border-white/10 rounded-2xl p-12 text-center shadow-xl">
        <XCircle className="w-12 h-12 text-slate-300 dark:text-slate-600 mx-auto mb-3" />
        <h3 className="text-base font-bold text-navy-900 dark:text-white">No Cancelled Orders Recorded</h3>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-md mx-auto">
          When an order is cancelled from the Orders Pipeline or Merchant Portal, it will accumulate here automatically with its products, quantities, and restored stock accounting.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-navy-900 border border-slate-200 dark:border-white/10 rounded-2xl overflow-hidden shadow-xl">
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse min-w-[1040px]">
          <thead>
            <tr className="border-b border-slate-200 dark:border-white/10 text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-300 bg-slate-50/60 dark:bg-navy-950/60">
              <th className="py-3.5 px-4">Order ID &amp; Cancelled</th>
              <th className="py-3.5 px-4">Product &amp; Variant Spec</th>
              <th className="py-3.5 px-4">Merchant</th>
              <th className="py-3.5 px-4">Customer &amp; COD</th>
              <th className="py-3.5 px-4">Stock Recovery Bin</th>
              <th className="py-3.5 px-4 text-center">Stock Accounting</th>
              <th className="py-3.5 px-4">Reason / Notes</th>
              <th className="py-3.5 px-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200/80 dark:divide-white/10 text-sm">
            {orders.map((item) => {
              const cleanId = (item.orderId || item.id || '').replace(/^#/, '').trim();
              const variantLabel = [item.color, item.size].filter(Boolean).join(' · ');

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
                      ৳{Number(item.codAmount || item.qty * item.unitPrice).toLocaleString()}
                    </div>
                  </td>

                  {/* Stock Recovery Bin */}
                  <td className="py-3.5 px-4">
                    <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-50 dark:bg-navy-950 border border-slate-200 dark:border-white/10 text-xs font-mono font-bold text-navy-900 dark:text-slate-100">
                      <MapPin className="w-3.5 h-3.5 text-orange-600 dark:text-orange-400 shrink-0" />
                      <span>{item.restockedBin || item.targetBin || 'A-01-01'}</span>
                    </div>
                  </td>

                  {/* Stock Accounting Status */}
                  <td className="py-3.5 px-4 text-center">
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                      <span>+{item.qty} Restored</span>
                    </span>
                    <span className="block text-[10px] text-slate-400 mt-0.5 font-mono">
                      Available Stock Updated
                    </span>
                  </td>

                  {/* Reason / Notes */}
                  <td className="py-3.5 px-4 max-w-xs">
                    <p className="text-xs text-slate-600 dark:text-slate-300 line-clamp-2">
                      {item.cancelReason || 'Order cancelled & reserved stock released back to warehouse bin.'}
                    </p>
                  </td>

                  {/* Actions */}
                  <td className="py-3.5 px-4 text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      <Link
                        href={`/admin/orders?search=${encodeURIComponent(cleanId)}`}
                        className="px-2.5 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-navy-800 dark:hover:bg-navy-700 text-slate-700 dark:text-slate-200 text-xs font-semibold flex items-center gap-1 border border-slate-200/80 dark:border-white/10 transition-colors"
                        title="View Order in Pipeline"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                        <span>View Order</span>
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
