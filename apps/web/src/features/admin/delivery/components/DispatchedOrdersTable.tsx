'use client';

import React from 'react';
import {
  Clock,
  MapPin,
  Truck,
  ExternalLink,
  CheckCircle2,
  RotateCcw,
  Filter,
} from 'lucide-react';
import { DeliveryTrackingStatus, DispatchedOrderRecord } from '../types';

interface DispatchedOrdersTableProps {
  orders: DispatchedOrderRecord[];
  onRequestStatusChange: (
    order: DispatchedOrderRecord,
    nextStatus: DeliveryTrackingStatus
  ) => void;
  onOpenReturns?: () => void;
}

export function DispatchedOrdersTable({
  orders,
  onRequestStatusChange,
  onOpenReturns,
}: DispatchedOrdersTableProps) {
  return (
    <div className="bg-white dark:bg-navy-900 border border-slate-200 dark:border-white/10 rounded-2xl overflow-hidden shadow-xl">
      <div className="px-5 py-3.5 border-b border-slate-200 dark:border-white/10 flex flex-wrap items-center justify-between gap-2 bg-slate-50/50 dark:bg-navy-950/50">
        <div className="flex items-center gap-2 text-xs sm:text-sm text-slate-700 dark:text-slate-200 font-medium">
          <Filter className="w-4 h-4 text-orange-600 dark:text-orange-400" />
          <span>
            Showing <strong className="text-navy-800 dark:text-white">{orders.length}</strong> dispatched shipments
          </span>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse min-w-[1040px]">
          <thead>
            <tr className="border-b border-slate-200 dark:border-white/10 text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-300 bg-slate-50/60 dark:bg-navy-950/60">
              <th className="py-3.5 px-4">Order ID &amp; Dispatched Time</th>
              <th className="py-3.5 px-4">Merchant</th>
              <th className="py-3.5 px-4">Product &amp; Qty Sent</th>
              <th className="py-3.5 px-4">Customer &amp; City</th>
              <th className="py-3.5 px-4">Courier &amp; Tracking Code</th>
              <th className="py-3.5 px-4 text-right">COD Amount</th>
              <th className="py-3.5 px-4 text-center">Delivery Status</th>
              <th className="py-3.5 px-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200/80 dark:divide-white/10 text-sm">
            {orders.map((order) => (
              <tr key={order.id} className="hover:bg-slate-100/40 dark:hover:bg-navy-800/40 transition-colors">
                {/* Order ID & Dispatched Time */}
                <td className="py-3.5 px-4">
                  <div className="tabular-nums font-bold text-navy-800 dark:text-white">{order.id}</div>
                  <div className="text-xs text-slate-600 dark:text-slate-300 flex items-center gap-1 mt-0.5">
                    <Clock className="w-3 h-3 text-slate-500 dark:text-slate-400" />
                    <span>{order.dispatchedAt}</span>
                  </div>
                </td>

                {/* Merchant */}
                <td className="py-3.5 px-4">
                  <div className="tabular-nums text-xs font-bold text-orange-600 dark:text-orange-400">
                    {order.merchantCode}
                  </div>
                  <div className="text-xs text-slate-700 dark:text-slate-200">{order.merchantName}</div>
                </td>

                {/* Product & Qty Sent */}
                <td className="py-3.5 px-4">
                  <div className="font-semibold text-navy-800 dark:text-white">{order.productTitle}</div>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="tabular-nums text-xs text-emerald-700 dark:text-emerald-300 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded">
                      {order.fullSku}
                    </span>
                    <span className="text-xs tabular-nums font-bold text-navy-800 dark:text-slate-100">
                      × {order.qtySent} pcs
                    </span>
                  </div>
                </td>

                {/* Customer & City */}
                <td className="py-3.5 px-4">
                  <div className="font-medium text-navy-800 dark:text-navy-800 dark:text-white">{order.customerName}</div>
                  <div className="text-xs text-slate-600 dark:text-slate-300 flex items-center gap-1 mt-0.5">
                    <MapPin className="w-3 h-3 text-slate-500 dark:text-slate-400" />
                    <span>{order.city}</span>
                  </div>
                </td>

                {/* Courier & Tracking Code */}
                <td className="py-3.5 px-4">
                  <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md bg-slate-50 dark:bg-navy-950 border border-slate-200 dark:border-white/10 text-xs font-semibold text-navy-800 dark:text-slate-100">
                    <Truck className="w-3 h-3 text-orange-600 dark:text-orange-400" />
                    <span>{order.courier}</span>
                  </div>
                  <div className="tabular-nums text-xs text-orange-600 dark:text-orange-400 mt-1 flex items-center gap-1">
                    <span>{order.trackingCode}</span>
                    <ExternalLink className="w-3 h-3 text-slate-500 dark:text-slate-400" />
                  </div>
                </td>

                {/* COD Amount */}
                <td className="py-3.5 px-4 text-right tabular-nums font-bold text-navy-800 dark:text-white">
                  ৳{order.codAmount.toLocaleString()}
                </td>

                {/* Delivery Status Badge */}
                <td className="py-3.5 px-4 text-center">
                  {order.status === 'IN_TRANSIT' && (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-sky-500/15 text-sky-700 dark:text-sky-300 border border-sky-500/30">
                      <span className="w-1.5 h-1.5 rounded-full bg-sky-400 animate-pulse" />
                      IN TRANSIT
                    </span>
                  )}
                  {order.status === 'DELIVERED' && (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30">
                      <CheckCircle2 className="w-3.5 h-3.5 text-orange-600 dark:text-orange-400" />
                      DELIVERED
                    </span>
                  )}
                  {order.status === 'RETURNED' && (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-rose-500/15 text-rose-700 dark:text-rose-300 border border-rose-500/30">
                      <RotateCcw className="w-3.5 h-3.5 text-rose-600 dark:text-rose-400" />
                      RETURNED
                    </span>
                  )}
                </td>

                {/* Action Buttons */}
                <td className="py-3.5 px-4 text-right">
                  <div className="flex items-center justify-end gap-2">
                    <button
                      type="button"
                      disabled={order.status === 'DELIVERED'}
                      onClick={() => onRequestStatusChange(order, 'DELIVERED')}
                      className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                        order.status === 'DELIVERED'
                          ? 'bg-slate-100/50 dark:bg-navy-800/50 text-slate-400 dark:text-slate-500 cursor-not-allowed'
                          : 'bg-orange-500/20 hover:bg-orange-700 text-orange-700 dark:text-orange-300 hover:text-white border border-orange-500/30 cursor-pointer'
                      }`}
                    >
                      Mark Delivered
                    </button>
                    {order.status === 'RETURNED' && onOpenReturns ? (
                      <button
                        type="button"
                        onClick={onOpenReturns}
                        className="px-2.5 py-1.5 rounded-lg text-xs font-bold bg-amber-500/15 hover:bg-amber-500/25 text-amber-700 dark:text-amber-300 border border-amber-500/40 flex items-center gap-1 transition-all cursor-pointer"
                      >
                        <RotateCcw className="w-3 h-3" />
                        <span>Intake &amp; Restock</span>
                      </button>
                    ) : (
                      <button
                        type="button"
                        disabled={order.status === 'RETURNED'}
                        onClick={() => onRequestStatusChange(order, 'RETURNED')}
                        className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                          order.status === 'RETURNED'
                            ? 'bg-slate-100/50 dark:bg-navy-800/50 text-slate-400 dark:text-slate-500 cursor-not-allowed'
                            : 'bg-rose-500/10 hover:bg-rose-600 text-rose-700 dark:text-rose-300 hover:text-white border border-rose-500/30 cursor-pointer'
                        }`}
                      >
                        Mark Returned
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}

            {orders.length === 0 && (
              <tr>
                <td colSpan={8} className="py-12 text-center text-slate-600 dark:text-slate-300">
                  No dispatched orders match your current filters.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
