'use client';

import React from 'react';
import { CourierPartner, WarehousePipelineOrder } from '../../types';
import { OrdersTableRow } from './OrdersTableRow';

interface OrdersAllTabProps {
  orders: WarehousePipelineOrder[];
  selectedIds: string[];
  onToggleSelectRow: (id: string) => void;
  onToggleSelectAll: () => void;
  allVisibleSelected: boolean;
  onPreviewMemo: (order: WarehousePipelineOrder) => void;
  onInlineCourierChange: (orderId: string, newCourier: CourierPartner) => void;
  onMarkWaiting: (order: WarehousePipelineOrder) => void;
  onMarkPicked: (order: WarehousePipelineOrder) => void;
  onResumePick: (order: WarehousePipelineOrder) => void;
  onPrintAndPack: (order: WarehousePipelineOrder) => void;
  onBookCourier: (order: WarehousePipelineOrder) => void;
  onConfirmHandover: (order: WarehousePipelineOrder) => void;
  onCancelOrder: (order: WarehousePipelineOrder) => void;
}

export function OrdersAllTab({
  orders,
  selectedIds,
  onToggleSelectRow,
  onToggleSelectAll,
  allVisibleSelected,
  onPreviewMemo,
  onInlineCourierChange,
  onMarkWaiting,
  onMarkPicked,
  onResumePick,
  onPrintAndPack,
  onBookCourier,
  onConfirmHandover,
  onCancelOrder,
}: OrdersAllTabProps) {
  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-900 overflow-hidden shadow-lg">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[960px] text-left text-sm">
          <thead className="bg-slate-950/80 text-slate-400 text-xs uppercase border-b border-slate-800">
            <tr>
              <th className="p-4 w-10">
                <input
                  type="checkbox"
                  checked={allVisibleSelected}
                  onChange={onToggleSelectAll}
                  aria-label="Select All Orders"
                  className="h-4 w-4 rounded border-slate-700 bg-slate-900 text-emerald-500 cursor-pointer"
                />
              </th>
              <th className="p-4">Order ID &amp; Merchant</th>
              <th className="p-4">Product, Variant &amp; 2-Part SKU</th>
              <th className="p-4">Bin Location &amp; Stock</th>
              <th className="p-4">Memo / Invoice</th>
              <th className="p-4">Customer &amp; Courier (Editable)</th>
              <th className="p-4">Stage</th>
              <th className="p-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800">
            {orders.length === 0 ? (
              <tr>
                <td colSpan={8} className="p-10 text-center text-xs text-slate-400">
                  No active warehouse orders found in this stage matching your filter.
                </td>
              </tr>
            ) : (
              orders.map((order) => (
                <OrdersTableRow
                  key={order.id}
                  order={order}
                  isSelected={selectedIds.includes(order.id)}
                  onToggleSelect={onToggleSelectRow}
                  onPreviewMemo={onPreviewMemo}
                  onInlineCourierChange={onInlineCourierChange}
                  onMarkWaiting={onMarkWaiting}
                  onMarkPicked={onMarkPicked}
                  onResumePick={onResumePick}
                  onPrintAndPack={onPrintAndPack}
                  onBookCourier={onBookCourier}
                  onConfirmHandover={onConfirmHandover}
                  onCancelOrder={onCancelOrder}
                />
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
