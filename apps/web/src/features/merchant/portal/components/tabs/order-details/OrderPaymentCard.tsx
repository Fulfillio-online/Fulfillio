'use client';

import React from 'react';
import { CreditCard, CheckCircle2, AlertCircle } from 'lucide-react';
import { MerchantOrderItem } from '../../../types';

interface OrderPaymentCardProps {
  order: MerchantOrderItem;
  orderTotal: number;
}

export function OrderPaymentCard({ order, orderTotal }: OrderPaymentCardProps) {
  const codDue = order.codAmount ?? Math.max(0, orderTotal - (order.advancePayment || 0));

  const getPaymentBadge = () => {
    switch (order.paymentStatus) {
      case 'Paid':
        return (
          <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 flex items-center gap-1">
            <CheckCircle2 className="h-3 w-3" />
            Paid (100%)
          </span>
        );
      case 'Partial':
        return (
          <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-sky-500/10 text-sky-400 border border-sky-500/30 flex items-center gap-1">
            <AlertCircle className="h-3 w-3" />
            Partial (Adv: ৳{order.advancePayment})
          </span>
        );
      default:
        return (
          <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-amber-500/10 text-amber-400 border border-amber-500/30 flex items-center gap-1">
            <AlertCircle className="h-3 w-3" />
            Unpaid (COD)
          </span>
        );
    }
  };

  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-900 p-5 shadow-md space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between pb-3.5 border-b border-slate-800">
        <div className="flex items-center gap-2.5">
          <div className="h-8 w-8 rounded-lg bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
            <CreditCard className="h-4 w-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-100">Payment &amp; Collection</h3>
            <p className="text-xs text-slate-400">Settlement terms and customer advance</p>
          </div>
        </div>

        {getPaymentBadge()}
      </div>

      {/* Payment Method Details */}
      <div className="p-3.5 rounded-xl bg-slate-950/70 border border-slate-800 flex items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2 text-slate-200 font-semibold">
          <CreditCard className="h-4 w-4 text-emerald-400" />
          <span>{order.paymentMethod || 'Cash on Delivery'}</span>
        </div>
        <span className="font-mono text-slate-400 text-[11px]">
          {order.advanceTrxId || order.transactionId || `COD-${order.id.slice(-6)}`}
        </span>
      </div>

      {/* Breakdown Rows */}
      <div className="space-y-2.5 text-xs">
        <div className="flex justify-between text-slate-400">
          <span className="text-slate-500 uppercase tracking-wider text-[10px] font-semibold">
            Transaction Ref
          </span>
          <span className="font-mono text-slate-300 font-medium">
            {order.advanceTrxId || order.transactionId || `COD-TRX-${order.id}`}
          </span>
        </div>

        {order.advancePayment && order.advancePayment > 0 ? (
          <div className="flex justify-between text-slate-400">
            <span className="text-slate-500 uppercase tracking-wider text-[10px] font-semibold">
              Advance Collected
            </span>
            <span className="font-mono text-emerald-400 font-semibold">
              ৳{Number(order.advancePayment).toLocaleString()} ({order.advancePaymentMethod || 'bKash'})
            </span>
          </div>
        ) : null}

        <div className="flex justify-between items-center pt-2.5 border-t border-slate-800">
          <span className="text-slate-200 font-bold">Due Courier COD to Collect</span>
          <span className="text-base font-extrabold text-emerald-400 font-mono">
            ৳{Number(codDue).toLocaleString()}
          </span>
        </div>
      </div>
    </div>
  );
}
