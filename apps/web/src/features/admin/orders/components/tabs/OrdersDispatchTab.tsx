'use client';

import React from 'react';
import { Truck } from 'lucide-react';
import { CourierPartner, OrderStage, WarehousePipelineOrder } from '../../types';
import { OrdersTableCard } from './OrdersTableCard';

export interface OrdersDispatchTabProps {
  orders: WarehousePipelineOrder[];
  selectedIds: string[];
  onToggleSelectRow: (id: string) => void;
  onToggleSelectAll: () => void;
  allVisibleSelected: boolean;
  onClearSelection?: () => void;
  // Pagination & rows limit
  totalItems: number;
  startIndex: number;
  pageSize: number;
  safePage: number;
  totalPages: number;
  onPageSizeChange: (size: number) => void;
  onPageChange: (page: number) => void;
  // Action callbacks
  onPreviewMemo: (order: WarehousePipelineOrder) => void;
  onInlineCourierChange: (orderId: string, newCourier: CourierPartner) => void;
  onInlineStageChange?: (
    orderId: string,
    newStage: OrderStage | 'COURIER_BOOKED',
    customHoldReason?: string
  ) => void;
  onMarkWaiting: (order: WarehousePipelineOrder) => void;
  onMarkPicked: (order: WarehousePipelineOrder) => void;
  onResumePick: (order: WarehousePipelineOrder) => void;
  onPrintAndPack: (order: WarehousePipelineOrder) => void;
  onBookCourier: (order: WarehousePipelineOrder) => void;
  onConfirmHandover: (order: WarehousePipelineOrder) => void;
  onCancelOrder: (order: WarehousePipelineOrder) => void;
  onViewOrder?: (order: WarehousePipelineOrder) => void;
}

export function OrdersDispatchTab({
  orders,
  selectedIds,
  onToggleSelectRow,
  onToggleSelectAll,
  allVisibleSelected,
  onClearSelection,
  totalItems,
  startIndex,
  pageSize,
  safePage,
  totalPages,
  onPageSizeChange,
  onPageChange,
  onPreviewMemo,
  onInlineCourierChange,
  onInlineStageChange,
  onMarkWaiting,
  onMarkPicked,
  onResumePick,
  onPrintAndPack,
  onBookCourier,
  onConfirmHandover,
  onCancelOrder,
  onViewOrder,
}: OrdersDispatchTabProps) {
  return (
    <div className="space-y-4">
      {/* Banner */}
      <div className="p-4 rounded-2xl bg-white dark:bg-navy-900 border border-slate-200 dark:border-white/10 shadow-sm flex items-center justify-between text-xs text-slate-600 dark:text-slate-300">
        <div className="flex items-center gap-2">
          <Truck className="w-4 h-4 text-orange-600 dark:text-orange-400 shrink-0" />
          <span>
            Courier Handover Hub: Assign tracking IDs, generate courier manifest sheets, and confirm parcels to driver.
          </span>
        </div>
      </div>

      {/* Orders Table Card with Integrated Header & Footer */}
      <OrdersTableCard
        orders={orders}
        selectedIds={selectedIds}
        onToggleSelectRow={onToggleSelectRow}
        onToggleSelectAll={onToggleSelectAll}
        allVisibleSelected={allVisibleSelected}
        onClearSelection={onClearSelection}
        totalItems={totalItems}
        startIndex={startIndex}
        pageSize={pageSize}
        safePage={safePage}
        totalPages={totalPages}
        onPageSizeChange={onPageSizeChange}
        onPageChange={onPageChange}
        emptyMessage="No orders are currently waiting for courier dispatch."
        onPreviewMemo={onPreviewMemo}
        onInlineCourierChange={onInlineCourierChange}
        onInlineStageChange={onInlineStageChange}
        onMarkWaiting={onMarkWaiting}
        onMarkPicked={onMarkPicked}
        onResumePick={onResumePick}
        onPrintAndPack={onPrintAndPack}
        onBookCourier={onBookCourier}
        onConfirmHandover={onConfirmHandover}
        onCancelOrder={onCancelOrder}
        onViewOrder={onViewOrder}
      />
    </div>
  );
}
