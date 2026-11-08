'use client';

import React from 'react';
import { Printer } from 'lucide-react';
import { Modal } from '@/components/admin/AdminModal';
import { UnifiedThermalSticker } from '@/features/shared/thermal-print/UnifiedThermalSticker';
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
        <div className="flex items-center justify-between bg-slate-50 dark:bg-navy-950 border border-slate-200 dark:border-white/10 rounded-xl p-3">
          <div className="text-xs text-slate-700 dark:text-slate-200">
            <span className="font-bold text-navy-800 dark:text-white">{order.resellerName}</span> •{' '}
            <span className="tabular-nums text-orange-600 dark:text-orange-400">{order.memoCode}</span> •{' '}
            <span className="tabular-nums text-amber-700 dark:text-amber-300">Bin: {order.bin}</span>
          </div>
          <button
            type="button"
            onClick={onPrint}
            className="px-4 py-1.5 rounded-lg bg-orange-600 hover:bg-orange-700 text-xs font-bold text-white flex items-center gap-1.5 cursor-pointer shadow-md"
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
