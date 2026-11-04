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
    <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
      <div className="px-5 py-3.5 border-b border-slate-800 flex flex-wrap items-center justify-between gap-2 bg-slate-950/50">
        <div className="flex items-center gap-2 text-xs sm:text-sm text-slate-300 font-medium">
          <Filter className="w-4 h-4 text-emerald-400" />
          <span>
            Showing <strong className="text-white">{orders.length}</strong> dispatched shipments
          </span>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse min-w-[1040px]">
          <thead>
            <tr className="border-b border-slate-800 text-[11px] font-semibold uppercase tracking-wider text-slate-400 bg-slate-950/60">
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
          <tbody className="divide-y divide-slate-800/80 text-sm">
            {orders.map((order) => (
              <tr key={order.id} className="hover:bg-slate-800/40 transition-colors">
                {/* Order ID & Dispatched Time */}
                <td className="py-3.5 px-4">
                  <div className="font-mono font-bold text-white">{order.id}</div>
                  <div className="text-xs text-slate-400 flex items-center gap-1 mt-0.5">
                    <Clock className="w-3 h-3 text-slate-500" />
                    <span>{order.dispatchedAt}</span>
                  </div>
                </td>

                {/* Merchant */}
                <td className="py-3.5 px-4">
                  <div className="font-mono text-xs font-bold text-emerald-400">
                    {order.merchantCode}
                  </div>
                  <div className="text-xs text-slate-300">{order.merchantName}</div>
                </td>

                {/* Product & Qty Sent */}
                <td className="py-3.5 px-4">
                  <div className="font-semibold text-white">{order.productTitle}</div>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="font-mono text-[11px] text-emerald-300 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded">
                      {order.fullSku}
                    </span>
                    <span className="text-xs font-mono font-bold text-slate-200">
                      × {order.qtySent} pcs
                    </span>
                  </div>
                </td>

                {/* Customer & City */}
                <td className="py-3.5 px-4">
                  <div className="font-medium text-slate-100">{order.customerName}</div>
                  <div className="text-xs text-slate-400 flex items-center gap-1 mt-0.5">
                    <MapPin className="w-3 h-3 text-slate-500" />
                    <span>{order.city}</span>
                  </div>
                </td>

                {/* Courier & Tracking Code */}
                <td className="py-3.5 px-4">
                  <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md bg-slate-950 border border-slate-800 text-xs font-semibold text-slate-200">
                    <Truck className="w-3 h-3 text-emerald-400" />
                    <span>{order.courier}</span>
                  </div>
                  <div className="font-mono text-xs text-emerald-400 mt-1 flex items-center gap-1">
                    <span>{order.trackingCode}</span>
                    <ExternalLink className="w-3 h-3 text-slate-500" />
                  </div>
                </td>

                {/* COD Amount */}
                <td className="py-3.5 px-4 text-right font-mono font-bold text-white">
                  ৳{order.codAmount.toLocaleString()}
                </td>

                {/* Delivery Status Badge */}
                <td className="py-3.5 px-4 text-center">
                  {order.status === 'IN_TRANSIT' && (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider bg-sky-500/15 text-sky-300 border border-sky-500/30">
                      <span className="w-1.5 h-1.5 rounded-full bg-sky-400 animate-pulse" />
                      IN TRANSIT
                    </span>
                  )}
                  {order.status === 'DELIVERED' && (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                      DELIVERED
                    </span>
                  )}
                  {order.status === 'RETURNED' && (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider bg-rose-500/15 text-rose-300 border border-rose-500/30">
                      <RotateCcw className="w-3.5 h-3.5 text-rose-400" />
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
                          ? 'bg-slate-800/50 text-slate-600 cursor-not-allowed'
                          : 'bg-emerald-600/20 hover:bg-emerald-600 text-emerald-300 hover:text-white border border-emerald-500/30 cursor-pointer'
                      }`}
                    >
                      Mark Delivered
                    </button>
                    {order.status === 'RETURNED' && onOpenReturns ? (
                      <button
                        type="button"
                        onClick={onOpenReturns}
                        className="px-2.5 py-1.5 rounded-lg text-xs font-bold bg-amber-500/15 hover:bg-amber-500/25 text-amber-300 border border-amber-500/40 flex items-center gap-1 transition-all cursor-pointer"
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
                            ? 'bg-slate-800/50 text-slate-600 cursor-not-allowed'
                            : 'bg-rose-500/10 hover:bg-rose-600 text-rose-300 hover:text-white border border-rose-500/30 cursor-pointer'
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
                <td colSpan={8} className="py-12 text-center text-slate-400">
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
