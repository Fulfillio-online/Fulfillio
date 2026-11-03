'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { ShoppingCart, Plus, Printer } from 'lucide-react';
import { FraudRatioBadge } from '@/components/ui/FraudRatioBadge';
import { MerchantOrderItem, MerchantProductItem, ResellerMemo } from '../../types';
import { CreateManualOrderModal } from '../modals/CreateManualOrderModal';

interface MerchantOrdersTabProps {
  orders: MerchantOrderItem[];
  products: MerchantProductItem[];
  memoList: ResellerMemo[];
  onCreateOrder: (order: MerchantOrderItem, productId: string, qty: number) => void;
  onCancelOrder: (orderId: string) => void;
  onTriggerToast: (msg: string) => void;
}

export function MerchantOrdersTab({
  orders,
  products,
  memoList,
  onCreateOrder,
  onCancelOrder,
  onTriggerToast,
}: MerchantOrdersTabProps) {
  const [isCreateOrderOpen, setIsCreateOrderOpen] = useState(false);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-100 flex items-center gap-2">
            <ShoppingCart className="h-6 w-6 text-emerald-400 shrink-0" />
            <span>Order Lifecycle & Reseller Attribution</span>
          </h1>
          <p className="text-sm text-slate-400 mt-0.5">
            Orders received from store sync or manual entry with assigned Reseller Memo Codes.
          </p>
        </div>

        <button
          onClick={() => setIsCreateOrderOpen(true)}
          className="w-full sm:w-auto px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-semibold flex items-center justify-center gap-2 transition-colors shadow-sm shrink-0"
        >
          <Plus className="h-4 w-4" />
          <span>Create Manual Order</span>
        </button>
      </div>

      {/* Orders Table */}
      <div className="rounded-xl border border-slate-800 bg-slate-900 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[680px] text-left text-sm">
            <thead className="bg-slate-800/80 text-slate-400 text-xs uppercase tracking-wider font-semibold border-b border-slate-800">
              <tr>
                <th className="p-4">Order ID & Date</th>
                <th className="p-4">Customer Details</th>
                <th className="p-4">Items Ordered</th>
                <th className="p-4">Reseller Memo Code</th>
                <th className="p-4">Courier</th>
                <th className="p-4">Status</th>
                <th className="p-4 text-right">COD Total</th>
                <th className="p-4 text-center">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {orders.map((o) => (
                <tr key={o.id} className="hover:bg-slate-800/40 transition-colors">
                  <td className="p-4">
                    <span className="font-mono text-xs font-bold text-slate-200 block">{o.id}</span>
                    <span className="text-[11px] text-slate-500">{o.date}</span>
                  </td>
                  <td className="p-4">
                    <div className="font-semibold text-slate-200">{o.customer}</div>
                    <div className="text-xs text-slate-400">{o.phone}</div>
                    <div className="text-[11px] text-slate-500 truncate max-w-xs mb-1">{o.address}</div>
                    <FraudRatioBadge
                      successRatio={o.phone.endsWith('000') ? 32 : 94}
                      compact={false}
                    />
                  </td>
                  <td className="p-4">
                    <span className="text-xs font-medium text-slate-200 block">{o.items}</span>
                    <span className="text-[10px] text-emerald-400 font-mono">Qty: {o.qty}</span>
                  </td>
                  <td className="p-4">
                    <span className="font-mono text-xs px-2.5 py-1 rounded bg-indigo-950/80 text-indigo-300 border border-indigo-800/60 font-semibold inline-block">
                      {o.memoCode}
                    </span>
                  </td>
                  <td className="p-4 text-xs font-semibold text-slate-300">{o.courier}</td>
                  <td className="p-4">
                    <span
                      className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${
                        o.status === 'PACKED'
                          ? 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/30'
                          : o.status === 'DISPATCHED'
                          ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                          : o.status === 'CANCELLED'
                          ? 'bg-rose-500/10 text-rose-400 border border-rose-500/30'
                          : 'bg-amber-500/10 text-amber-400 border border-amber-500/30'
                      }`}
                    >
                      {o.status}
                    </span>
                  </td>
                  <td className="p-4 text-right font-bold text-slate-200">৳ {o.amount.toLocaleString()}</td>
                  <td className="p-4 text-center">
                    <div className="flex items-center justify-center gap-1.5">
                      <Link
                        href={`/print/memo/${o.id}?memoCode=${encodeURIComponent(o.memoCode)}&customerName=${encodeURIComponent(o.customer)}&customerPhone=${encodeURIComponent(o.phone)}&customerAddress=${encodeURIComponent(o.address)}&codAmount=${o.amount}`}
                        className="px-2 py-1 bg-indigo-600/20 hover:bg-indigo-600/30 border border-indigo-500/40 text-indigo-300 rounded text-xs font-semibold flex items-center gap-1 transition-colors"
                        title="Open 2-in-1 4x6 Thermal Sticker"
                      >
                        <Printer className="h-3 w-3" />
                        <span>4x6 Slip</span>
                      </Link>
                      {o.status !== 'CANCELLED' && o.status !== 'DISPATCHED' && (
                        <button
                          onClick={() => onCancelOrder(o.id)}
                          className="px-2 py-1 text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 rounded text-xs transition-colors"
                          title="Cancel order and restore reserved stock"
                        >
                          Cancel
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal */}
      <CreateManualOrderModal
        isOpen={isCreateOrderOpen}
        onClose={() => setIsCreateOrderOpen(false)}
        products={products}
        memoList={memoList}
        onCreateOrder={onCreateOrder}
        onTriggerToast={onTriggerToast}
      />
    </div>
  );
}
