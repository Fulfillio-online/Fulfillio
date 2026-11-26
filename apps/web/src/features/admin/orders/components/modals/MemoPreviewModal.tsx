'use client';

import React from 'react';
import { Printer } from 'lucide-react';
import { Modal } from '@/components/admin/AdminModal';
import {
  UnifiedThermalSticker,
  ThermalStickerItem,
} from '@/features/shared/thermal-print/UnifiedThermalSticker';
import { WarehousePipelineOrder } from '../../types';

interface MemoPreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  order: WarehousePipelineOrder | null;
  onPrint: () => void;
}

function resolveStickerItems(order: WarehousePipelineOrder): ThermalStickerItem[] {
  if (order.items && order.items.length > 0) {
    return order.items.map((item) => ({
      sku: item.sku || order.sku || 'SKU',
      title: (item.title || 'Ordered Product')
        .replace(/\s*\(\+\d+\s*more\)/gi, '')
        .replace(/\s*\+\s*\d+\s*more/gi, '')
        .trim(),
      color: item.color,
      size: item.size,
      qty: item.qty || 1,
      price: Number(item.unitPrice) || 0,
    }));
  }

  const qty = order.qty || 1;
  const fallbackUnitPrice =
    order.subtotal && order.subtotal > 0
      ? Math.round(order.subtotal / qty)
      : Math.round((order.totalAmount ?? order.codAmount) / qty);

  return [
    {
      sku: order.sku,
      title: order.productTitle,
      color: order.color,
      size: order.size,
      qty,
      price: fallbackUnitPrice,
    },
  ];
}

export function MemoPreviewModal({
  isOpen,
  onClose,
  order,
  onPrint,
}: MemoPreviewModalProps) {
  if (!order) return null;

  const stickerItems = resolveStickerItems(order);
  const courierLabel = (order.courier || 'STANDARD').toUpperCase();

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
            logoUrl={order.resellerLogo}
            customerName={order.customerName}
            customerPhone={order.customerPhone}
            customerAddress={order.customerAddress}
            city={order.city}
            codAmount={order.codAmount}
            subtotal={order.subtotal}
            deliveryFee={order.deliveryFee}
            discount={order.discount}
            totalAmount={order.totalAmount}
            advancePayment={order.advancePayment}
            advancePaymentMethod={order.advancePaymentMethod}
            paymentStatus={order.paymentStatus}
            courierProvider={courierLabel}
            consignmentId={`CN-${order.id.replace(/\D/g, '') || order.id.slice(-6)}`}
            trackingCode={
              order.trackingCode ||
              `TRK-${courierLabel.slice(0, 3)}-${order.id.replace(/\D/g, '') || order.id.slice(-6)}`
            }
            items={stickerItems}
          />
        </div>
      </div>
    </Modal>
  );
}
