import React from 'react';
import { X, Printer } from 'lucide-react';
import { UnifiedThermalSticker } from '@/features/thermal-print/UnifiedThermalSticker';
import { PackingOrder } from '../../types';

interface SingleSlipPreviewModalProps {
  order: PackingOrder | null;
  onClose: () => void;
  onPrint: (order: PackingOrder) => void;
}

export function SingleSlipPreviewModal({
  order,
  onClose,
  onPrint,
}: SingleSlipPreviewModalProps) {
  if (!order) return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-xl w-full p-4 sm:p-6 shadow-2xl">
        <div className="flex items-start sm:items-center justify-between gap-2 border-b border-slate-800 pb-4 mb-5">
          <div>
            <span className="text-xs font-mono font-bold text-emerald-400 uppercase">
              4x6&quot; Thermal Sticker Preview · {order.memoCode}
            </span>
            <h3 className="text-base sm:text-lg font-bold text-white mt-0.5">
              {order.id} — {order.resellerName}
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 shrink-0"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="bg-slate-950 p-3 sm:p-4 rounded-xl border border-slate-800 overflow-x-auto flex justify-center">
          <UnifiedThermalSticker
            orderId={order.id}
            memoCode={order.memoCode}
            resellerName={order.resellerName}
            resellerPhone={order.resellerPhone}
            resellerAddress={order.resellerAddress}
            brandColor={order.brandColor}
            customerName={order.customerName}
            customerPhone={order.customerPhone}
            customerAddress={order.customerAddress}
            city={order.city}
            codAmount={order.codAmount}
            courierProvider={order.courier.toUpperCase()}
            consignmentId={order.consignmentId}
            trackingCode={order.trackingCode}
            packagingType={order.packagingType}
            items={order.items}
          />
        </div>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-end gap-2.5 sm:gap-3 mt-5 pt-4 border-t border-slate-800">
          <button
            type="button"
            onClick={onClose}
            className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-300 text-center"
          >
            Close Preview
          </button>
          <button
            type="button"
            onClick={() => onPrint(order)}
            className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-xs font-bold text-white inline-flex items-center justify-center gap-2 shadow-lg"
          >
            <Printer className="w-4 h-4 shrink-0" />
            <span>Print 4x6&quot; Slip &amp; Mark Packed</span>
          </button>
        </div>
      </div>
    </div>
  );
}
