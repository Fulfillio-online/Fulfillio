'use client';

import React from 'react';
import { createPortal } from 'react-dom';
import { UnifiedThermalSticker } from '@/features/shared/thermal-print/UnifiedThermalSticker';
import { WarehousePipelineOrder } from '../../types';

interface IsolatedPrintPortalProps {
  printMode: 'MEMOS' | 'PICK_SHEET' | 'MANIFEST' | null;
  orders: WarehousePipelineOrder[];
}

export function IsolatedPrintPortal({
  printMode,
  orders,
}: IsolatedPrintPortalProps) {
  if (!printMode || orders.length === 0 || typeof document === 'undefined') {
    return null;
  }

  return createPortal(
    <div id="fulfillio-print-invoice-root" className="hidden">
      {printMode === 'MEMOS' &&
        orders.map((ord) => (
          <div key={ord.id} className="fulfillio-thermal-page-break">
            <UnifiedThermalSticker
              orderId={ord.id}
              memoCode={ord.memoCode}
              resellerName={ord.resellerName}
              resellerPhone={ord.resellerPhone}
              resellerAddress={ord.resellerAddress}
              customerName={ord.customerName}
              customerPhone={ord.customerPhone}
              customerAddress={ord.customerAddress}
              city={ord.city}
              codAmount={ord.codAmount}
              courierProvider={ord.courier.toUpperCase()}
              consignmentId={`CN-${ord.id.replace(/\D/g, '')}`}
              trackingCode={
                ord.trackingCode ||
                `TRK-${ord.courier.slice(0, 3).toUpperCase()}-${ord.id.replace(/\D/g, '')}`
              }
              items={[
                {
                  sku: ord.sku,
                  title: ord.productTitle,
                  color: ord.color,
                  size: ord.size,
                  qty: ord.qty,
                  price: ord.codAmount,
                },
              ]}
            />
          </div>
        ))}

      {printMode === 'PICK_SHEET' && (
        <div className="bg-white text-black p-6 font-sans text-xs max-w-2xl mx-auto">
          <h2 className="text-lg font-extrabold uppercase border-b-2 border-black pb-2 mb-3">
            Fulfillio Warehouse — Bin-Guided Pick List Sheet ({orders.length} Orders)
          </h2>
          <table className="w-full border-collapse border border-black text-left">
            <thead>
              <tr className="bg-slate-100 dark:bg-slate-300 border-b border-black">
                <th className="p-2 border-r border-black">Bin Location</th>
                <th className="p-2 border-r border-black">Order ID</th>
                <th className="p-2 border-r border-black">2-Part SKU</th>
                <th className="p-2 border-r border-black">Product &amp; Variant</th>
                <th className="p-2 text-center">Qty</th>
              </tr>
            </thead>
            <tbody>
              {orders.map((ord) => (
                <tr key={ord.id} className="border-b border-black">
                  <td className="p-2 border-r border-black tabular-nums font-extrabold">{ord.bin}</td>
                  <td className="p-2 border-r border-black tabular-nums font-bold">{ord.id}</td>
                  <td className="p-2 border-r border-black tabular-nums">{ord.sku}</td>
                  <td className="p-2 border-r border-black">
                    {ord.productTitle} ({ord.color} / {ord.size})
                  </td>
                  <td className="p-2 text-center font-bold">{ord.qty}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {printMode === 'MANIFEST' && (
        <div className="bg-white text-black p-6 font-sans text-xs max-w-2xl mx-auto space-y-4">
          <div className="border-b-2 border-black pb-2 flex justify-between items-end">
            <div>
              <h2 className="text-lg font-extrabold uppercase">Courier Handover Manifest Sheet</h2>
              <p className="text-xs">
                Total Parcels: {orders.length} • Date: {new Date().toLocaleDateString('en-GB')}
              </p>
            </div>
            <span className="tabular-nums font-bold">FULFILLIO 3PL</span>
          </div>
          <table className="w-full border-collapse border border-black text-left">
            <thead>
              <tr className="bg-slate-100 dark:bg-slate-300 border-b border-black">
                <th className="p-2 border-r border-black">Order ID</th>
                <th className="p-2 border-r border-black">Courier &amp; Tracking</th>
                <th className="p-2 border-r border-black">Customer</th>
                <th className="p-2 text-right">COD Amount</th>
              </tr>
            </thead>
            <tbody>
              {orders.map((ord) => (
                <tr key={ord.id} className="border-b border-black">
                  <td className="p-2 border-r border-black tabular-nums font-bold">{ord.id}</td>
                  <td className="p-2 border-r border-black tabular-nums">
                    {ord.courier} — {ord.trackingCode || 'BOOKED'}
                  </td>
                  <td className="p-2 border-r border-black">
                    {ord.customerName} ({ord.customerPhone})
                  </td>
                  <td className="p-2 text-right tabular-nums font-bold">
                    ৳ {ord.codAmount.toLocaleString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="pt-8 flex justify-between text-xs font-bold">
            <span className="border-t border-black pt-1 px-4">Warehouse Supervisor Signature</span>
            <span className="border-t border-black pt-1 px-4">Courier Pickup Rider Signature</span>
          </div>
        </div>
      )}
    </div>,
    document.body
  );
}
