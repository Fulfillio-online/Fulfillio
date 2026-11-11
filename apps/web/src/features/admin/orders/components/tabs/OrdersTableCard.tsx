'use client';

import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { CourierPartner, OrderStage, WarehousePipelineOrder } from '../../types';
import { OrdersTableRow } from './OrdersTableRow';
import { OrdersMobileCard } from './OrdersMobileCard';

export interface OrdersTableCardProps {
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
  // Empty state message
  emptyMessage?: string;
  // Action handlers
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

export function OrdersTableCard({
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
  emptyMessage = 'No active warehouse orders found in this stage matching your filter.',
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
}: OrdersTableCardProps) {
  return (
    <div className="rounded-2xl border border-slate-200 dark:border-white/10 bg-white dark:bg-navy-900 overflow-hidden shadow-lg">
      {/* 1. Top Attached Sub-header Row: Bulk Selection Info (Left) & Rows-to-Show Selector (Right) */}
      <div className="flex items-center justify-between px-4 py-2.5 bg-slate-50/80 dark:bg-navy-950/80 border-b border-slate-200 dark:border-white/10 text-xs text-slate-600 dark:text-slate-300">
        {/* Left: Bulk selection info in standard subtle typography */}
        <div>
          <span className="text-slate-500 dark:text-slate-400 text-xs font-medium">
            {selectedIds.length > 0
              ? `${selectedIds.length} ${selectedIds.length === 1 ? 'order' : 'orders'} selected`
              : 'Select orders to apply bulk actions'}
          </span>
        </div>

        {/* Right: Show rows per page selector */}
        <div className="flex items-center gap-1.5">
          <span className="text-slate-500 dark:text-slate-400 font-medium">Show</span>
          <select
            value={pageSize}
            onChange={(e) => {
              onPageSizeChange(Number(e.target.value));
              onPageChange(1);
            }}
            aria-label="Rows per page"
            className="px-2 py-1 rounded-lg bg-white dark:bg-navy-900 border border-slate-200 dark:border-white/10 text-xs font-semibold text-navy-800 dark:text-slate-100 focus:outline-none focus:border-orange-500 cursor-pointer shadow-2xs"
          >
            <option value={10}>10</option>
            <option value={25}>25</option>
            <option value={50}>50</option>
            <option value={100}>100</option>
          </select>
          <span className="text-slate-500 dark:text-slate-400 font-medium">rows</span>
        </div>
      </div>

      {/* 2. Mobile Collapsible List (Visible on mobile screens) */}
      <div className="block md:hidden p-2.5 space-y-2.5">
        {orders.length === 0 ? (
          <div className="p-8 text-center text-xs text-slate-500 dark:text-slate-400">
            {emptyMessage}
          </div>
        ) : (
          orders.map((order) => (
            <OrdersMobileCard
              key={order.id}
              order={order}
              isSelected={selectedIds.includes(order.id)}
              onToggleSelect={onToggleSelectRow}
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
          ))
        )}
      </div>

      {/* 3. Desktop Full Table (Visible on md screens and larger, 100% responsive without scroll) */}
      <div className="hidden md:block overflow-x-auto">
        <table className="w-full text-left text-xs sm:text-sm">
          <thead className="bg-slate-50/80 dark:bg-navy-950/80 text-slate-500 dark:text-slate-400 text-[11px] uppercase tracking-wider font-bold border-b border-slate-200 dark:border-white/10">
            <tr>
              <th className="py-3 px-2 sm:px-3 w-8">
                <input
                  type="checkbox"
                  checked={allVisibleSelected}
                  onChange={onToggleSelectAll}
                  aria-label="Select All Orders"
                  className="h-3.5 w-3.5 rounded border-slate-300 dark:border-white/15 bg-white dark:bg-navy-900 text-orange-600 dark:text-orange-500 cursor-pointer"
                />
              </th>
              <th className="py-3 px-2 sm:px-3 whitespace-nowrap">Order ID &amp; Merchant</th>
              <th className="py-3 px-2 sm:px-3 whitespace-nowrap">Memo / Invoice</th>
              <th className="py-3 px-2 sm:px-3 whitespace-nowrap">Customer</th>
              <th className="py-3 px-2 sm:px-3 whitespace-nowrap">Courier</th>
              <th className="py-3 px-2 sm:px-3 whitespace-nowrap">Total Amount</th>
              <th className="py-3 px-2 sm:px-3 whitespace-nowrap">Stage</th>
              <th className="py-3 px-2 sm:px-3 text-right whitespace-nowrap">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-white/5">
            {orders.length === 0 ? (
              <tr>
                <td colSpan={8} className="p-10 text-center text-xs text-slate-500 dark:text-slate-400">
                  {emptyMessage}
                </td>
              </tr>
            ) : (
              orders.map((order, idx) => (
                <OrdersTableRow
                  key={order.id}
                  order={order}
                  isSelected={selectedIds.includes(order.id)}
                  isNearBottom={idx >= orders.length - 2}
                  onToggleSelect={onToggleSelectRow}
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
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* 4. Bottom Attached Footer: Showing count (Left) & Page number with Previous/Next (Right) */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 px-4 py-3 bg-slate-50/80 dark:bg-navy-950/80 border-t border-slate-200 dark:border-white/10 text-xs text-slate-600 dark:text-slate-300">
        <div className="text-slate-600 dark:text-slate-300">
          Showing <span className="font-bold text-navy-800 dark:text-white">{totalItems > 0 ? startIndex + 1 : 0}</span> to{' '}
          <span className="font-bold text-navy-800 dark:text-white">
            {Math.min(startIndex + pageSize, totalItems)}
          </span>{' '}
          of <span className="font-bold text-navy-800 dark:text-white">{totalItems}</span> orders
        </div>

        <div className="flex items-center gap-2">
          <span className="text-slate-600 dark:text-slate-300 font-medium">
            Page <span className="text-navy-800 dark:text-white font-bold">{safePage}</span> of{' '}
            <span className="text-navy-800 dark:text-white font-bold">{totalPages}</span>
          </span>

          <div className="flex items-center gap-1">
            <button
              type="button"
              disabled={safePage <= 1}
              onClick={() => onPageChange(Math.max(1, safePage - 1))}
              aria-label="Previous page"
              className="p-1.5 rounded-lg border border-slate-200 dark:border-white/10 bg-white dark:bg-navy-900 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-navy-800 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer transition-colors shadow-2xs"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              type="button"
              disabled={safePage >= totalPages}
              onClick={() => onPageChange(Math.min(totalPages, safePage + 1))}
              aria-label="Next page"
              className="p-1.5 rounded-lg border border-slate-200 dark:border-white/10 bg-white dark:bg-navy-900 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-navy-800 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer transition-colors shadow-2xs"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
