'use client';

import React from 'react';
import { X, CheckCircle2, AlertTriangle } from 'lucide-react';
import { DeliveryTrackingStatus, DispatchedOrderRecord } from '../../types';

interface ConfirmDeliveryStatusModalProps {
  modalState: {
    order: DispatchedOrderRecord;
    nextStatus: DeliveryTrackingStatus;
  } | null;
  onClose: () => void;
  onConfirm: () => void;
}

export function ConfirmDeliveryStatusModal({
  modalState,
  onClose,
  onConfirm,
}: ConfirmDeliveryStatusModalProps) {
  if (!modalState) return null;

  const { order, nextStatus } = modalState;

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-5 animate-in zoom-in-95 duration-200">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-3">
            <div
              className={`w-11 h-11 rounded-2xl flex items-center justify-center shrink-0 border ${
                nextStatus === 'DELIVERED'
                  ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-400'
                  : 'bg-rose-500/15 border-rose-500/30 text-rose-400'
              }`}
            >
              {nextStatus === 'DELIVERED' ? (
                <CheckCircle2 className="w-6 h-6" />
              ) : (
                <AlertTriangle className="w-6 h-6" />
              )}
            </div>
            <div>
              <h3 className="text-base font-bold text-white">
                {nextStatus === 'DELIVERED'
                  ? 'Confirm Delivery Completion'
                  : 'Confirm Parcel Return (RTO)'}
              </h3>
              <p className="text-xs sm:text-sm text-slate-300 mt-1 leading-relaxed">
                {nextStatus === 'DELIVERED'
                  ? `Confirm marking Order ${order.id} (${order.courier} · ${order.trackingCode}) as DELIVERED with ৳${order.codAmount.toLocaleString()} COD collected?`
                  : `Confirm marking Order ${order.id} (${order.courier} · ${order.trackingCode}) as RETURNED / RTO for ${order.merchantName}?`}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 text-xs space-y-1">
          <div className="flex justify-between">
            <span className="text-slate-400">Merchant:</span>
            <span className="font-semibold text-white">
              {order.merchantCode} · {order.merchantName}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-400">Product &amp; Qty:</span>
            <span className="font-mono text-emerald-300">
              {order.fullSku} × {order.qtySent} pcs
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-400">Customer:</span>
            <span className="text-slate-200">
              {order.customerName} ({order.city})
            </span>
          </div>
        </div>

        <div className="flex items-center justify-end gap-2.5">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-300 cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className={`px-4 py-2 rounded-xl text-xs font-bold text-white shadow-lg cursor-pointer ${
              nextStatus === 'DELIVERED'
                ? 'bg-emerald-600 hover:bg-emerald-500 shadow-emerald-600/25'
                : 'bg-rose-600 hover:bg-rose-500 shadow-rose-600/25'
            }`}
          >
            {nextStatus === 'DELIVERED'
              ? 'Confirm Mark Delivered'
              : 'Confirm Mark Returned'}
          </button>
        </div>
      </div>
    </div>
  );
}
