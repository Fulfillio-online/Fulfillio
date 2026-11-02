'use client';

import React from 'react';
import { Printer } from 'lucide-react';
import { Modal } from '@/components/ui';
import { UnifiedThermalSticker } from '@/features/thermal-print/UnifiedThermalSticker';
import { WarehousePipelineOrder } from '../../types';

interface MemoPreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  order: WarehousePipelineOrder | null;
  onPrint: () => void;
}

export function MemoPreviewModal({
  isOpen,
  onClose,
  order,
  onPrint,
}: MemoPreviewModalProps) {
  if (!order) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`4x6" Invoice Preview · ${order.id} (${order.memoCode})`}
      subtitle={`${order.resellerName} — Ready for 4x6" Thermal Printer`}
      size="lg"
    >
      <div className="space-y-4">
        <div className="flex items-center justify-between bg-slate-950 border border-slate-800 rounded-xl p-3">
          <div className="text-xs text-slate-300">
            <span className="font-bold text-white">{order.resellerName}</span> •{' '}
            <span className="font-mono text-emerald-400">{order.memoCode}</span> •{' '}
            <span className="font-mono text-amber-300">Bin: {order.bin}</span>
          </div>
          <button
            type="button"
            onClick={onPrint}
            className="px-4 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-xs font-bold text-white flex items-center gap-1.5 cursor-pointer shadow-md"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Print 4x6&quot; Invoice</span>
          </button>
        </div>

        <div className="max-h-[65vh] overflow-y-auto py-2">
          <UnifiedThermalSticker
            orderId={order.id}
            memoCode={order.memoCode}
            resellerName={order.resellerName}
            resellerPhone={order.resellerPhone}
            resellerAddress={order.resellerAddress}
            customerName={order.customerName}
            customerPhone={order.customerPhone}
            customerAddress={order.customerAddress}
            city={order.city}
            codAmount={order.codAmount}
            courierProvider={order.courier.toUpperCase()}
            consignmentId={`CN-${order.id.replace(/\D/g, '')}`}
            trackingCode={
              order.trackingCode ||
              `TRK-${order.courier.slice(0, 3).toUpperCase()}-${order.id.replace(/\D/g, '')}`
            }
            items={[
              {
                sku: order.sku,
                title: order.productTitle,
                color: order.color,
                size: order.size,
                qty: order.qty,
                price: order.codAmount,
              },
            ]}
          />
        </div>
      </div>
    </Modal>
  );
}
