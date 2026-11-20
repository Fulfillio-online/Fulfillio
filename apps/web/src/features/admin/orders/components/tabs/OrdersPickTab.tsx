'use client';

import React from 'react';
import { ClipboardList, AlertTriangle, MapPin } from 'lucide-react';
import { CourierPartner, OrderStage, WarehousePipelineOrder } from '../../types';
import { OrdersTableCard } from './OrdersTableCard';

export interface OrdersPickTabProps {
  orders: WarehousePipelineOrder[];
  selectedIds: string[];
  onToggleSelectRow: (id: string) => void;
  onToggleSelectAll: () => void;
  allVisibleSelected: boolean;
  onClearSelection?: () => void;
  pickSubFilter: 'READY' | 'WAITING';
  onPickSubFilterChange: (sub: 'READY' | 'WAITING') => void;
  counts: {
    pickReady: number;
    pickWaiting: number;
  };
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

export function OrdersPickTab({
  orders,
  selectedIds,
  onToggleSelectRow,
  onToggleSelectAll,
  allVisibleSelected,
  onClearSelection,
  pickSubFilter,
  onPickSubFilterChange,
  counts,
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
}: OrdersPickTabProps) {
  return (
    <div className="space-y-4">
      {/* Pick Sub-tabs (Ready to Pick vs Not in Bin Waiting) */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-2xl bg-white dark:bg-navy-900 border border-slate-200 dark:border-white/10 shadow-sm">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => onPickSubFilterChange('READY')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
              pickSubFilter === 'READY'
                ? 'bg-orange-600 text-white shadow-md'
                : 'bg-slate-100 dark:bg-navy-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-navy-700'
            }`}
          >
            <ClipboardList className="w-4 h-4" />
            <span>Ready to Pick ({counts.pickReady})</span>
          </button>

          <button
            type="button"
            onClick={() => onPickSubFilterChange('WAITING')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
              pickSubFilter === 'WAITING'
                ? 'bg-amber-600 text-white shadow-md'
                : 'bg-slate-100 dark:bg-navy-800 text-amber-600 dark:text-amber-400 hover:bg-slate-200 dark:hover:bg-navy-700'
            }`}
          >
            <AlertTriangle className="w-4 h-4" />
            <span>Not in Bin / Hold ({counts.pickWaiting})</span>
          </button>
        </div>

        <div className="text-xs text-slate-600 dark:text-slate-300 flex items-center gap-1.5">
          <MapPin className="w-3.5 h-3.5 text-orange-600 dark:text-orange-400 shrink-0" />
          <span>
            {pickSubFilter === 'READY'
              ? 'Verify bin locations before picking. Mark "Not Found / Hold" if any stock discrepancy occurs.'
              : 'Orders on hold awaiting bin stock replenishment.'}
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
        emptyMessage={
          pickSubFilter === 'READY'
            ? 'No orders are currently waiting to be picked.'
            : 'No orders are currently on hold/waiting in bin.'
        }
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
