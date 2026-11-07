'use client';

import React from 'react';
import { Package } from 'lucide-react';
import { MerchantOrderItem } from '../../../types';

interface OrderItemsCardProps {
  order: MerchantOrderItem;
  lineItems: Array<{
    id: string;
    title: string;
    variant: string;
    sku: string;
    price: number;
    quantity: number;
    total: number;
    imageUrl?: string;
  }>;
  subtotal: number;
  deliveryFee: number;
  discount: number;
  orderTotal: number;
}

export function OrderItemsCard({
  order,
  lineItems,
  subtotal,
  deliveryFee,
  discount,
  orderTotal,
}: OrderItemsCardProps) {
  const codAmount = order.codAmount ?? Math.max(0, orderTotal - (order.advancePayment || 0));

  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-900 overflow-hidden shadow-md">
      {/* Header */}
      <div className="p-4 sm:p-5 border-b border-slate-800 flex justify-between items-center">
        <div className="flex items-center gap-2.5">
          <div className="h-8 w-8 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
            <Package className="h-4 w-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-100">Order Items</h3>
            <p className="text-xs text-slate-400">
              {lineItems.length} product{lineItems.length !== 1 ? 's' : ''} in this order
            </p>
          </div>
        </div>

        <span className="text-xs px-2.5 py-1 rounded-full bg-slate-800 text-slate-300 font-semibold border border-slate-700">
          {order.qty || lineItems.reduce((acc, it) => acc + it.quantity, 0)} items
        </span>
      </div>

      {/* Items List */}
      <div className="p-4 sm:p-5 divide-y divide-slate-800/80">
        {lineItems.map((item) => (
          <div
            key={item.id}
            className="py-4 first:pt-0 last:pb-0 flex items-center justify-between gap-3 sm:gap-4"
          >
            <div className="flex items-center gap-3 min-w-0">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={
                  item.imageUrl ||
                  'https://images.unsplash.com/photo-1556905055-8f358a7a47b2?auto=format&fit=crop&w=150&q=80'
                }
                alt={item.title}
                className="h-12 w-12 sm:h-14 sm:w-14 rounded-xl object-cover bg-slate-800 border border-slate-700/80 shrink-0"
              />
              <div className="min-w-0">
                <h4 className="text-xs sm:text-sm font-semibold text-slate-100 truncate">
                  {item.title}
                </h4>
                <p className="text-[11px] sm:text-xs text-slate-400 mt-0.5">{item.variant}</p>
                <p className="text-[10px] sm:text-[11px] font-mono text-slate-500 mt-0.5">
                  SKU: {item.sku}
                </p>
              </div>
            </div>

            <div className="text-right shrink-0">
              <div className="text-xs sm:text-sm font-bold text-slate-100">
                ৳{Number(item.total).toLocaleString()}
              </div>
              <div className="text-[11px] text-slate-400 mt-0.5 font-mono">
                ৳{Number(item.price).toLocaleString()} × {item.quantity}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Pricing Breakdown */}
      <div className="p-4 sm:p-5 bg-slate-950/70 border-t border-slate-800 space-y-2.5 text-xs">
        <div className="flex justify-between text-slate-400">
          <span>Subtotal</span>
          <span className="font-semibold text-slate-200">৳{Number(subtotal).toLocaleString()}</span>
        </div>

        <div className="flex justify-between text-slate-400">
          <span>Delivery Fee</span>
          <span className="font-semibold text-slate-200">৳{Number(deliveryFee).toLocaleString()}</span>
        </div>

        {discount > 0 && (
          <div className="flex justify-between text-slate-400">
            <span>Promotional Discount</span>
            <span className="font-semibold text-emerald-400">
              -৳{Number(discount).toLocaleString()}
            </span>
          </div>
        )}

        <div className="pt-2 border-t border-slate-800 flex justify-between items-center text-xs text-slate-300">
          <span className="font-medium">Total Invoice Value</span>
          <span className="font-bold text-sm sm:text-base text-white">
            ৳{Number(orderTotal).toLocaleString()}
          </span>
        </div>

        {order.advancePayment && order.advancePayment > 0 ? (
          <div className="flex justify-between items-center text-xs text-emerald-400 bg-emerald-950/40 p-2.5 rounded-xl border border-emerald-500/20">
            <span>Advance Received ({order.advancePaymentMethod || 'bKash'})</span>
            <span className="font-bold font-mono">
              -৳{Number(order.advancePayment).toLocaleString()}
            </span>
          </div>
        ) : null}

        <div className="pt-2.5 border-t border-slate-800 flex justify-between items-center">
          <span className="text-xs sm:text-sm font-bold text-slate-200">
            Courier COD Collection:
          </span>
          <span className="text-base sm:text-lg font-black text-emerald-400 font-mono">
            ৳{Number(codAmount).toLocaleString()}
          </span>
        </div>
      </div>
    </div>
  );
}
