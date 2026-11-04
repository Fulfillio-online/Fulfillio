'use client';

import React from 'react';
import { ClipboardList, AlertTriangle, MapPin } from 'lucide-react';
import { CourierPartner, WarehousePipelineOrder } from '../../types';
import { OrdersTableRow } from './OrdersTableRow';
import { OrdersMobileCard } from './OrdersMobileCard';

interface OrdersPickTabProps {
  orders: WarehousePipelineOrder[];
  selectedIds: string[];
  onToggleSelectRow: (id: string) => void;
  onToggleSelectAll: () => void;
  allVisibleSelected: boolean;
  pickSubFilter: 'READY' | 'WAITING';
  onPickSubFilterChange: (sub: 'READY' | 'WAITING') => void;
  counts: {
    pickReady: number;
    pickWaiting: number;
  };
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

export function OrdersPickTab({
  orders,
  selectedIds,
  onToggleSelectRow,
  onToggleSelectAll,
  allVisibleSelected,
  pickSubFilter,
  onPickSubFilterChange,
  counts,
  onPreviewMemo,
  onInlineCourierChange,
  onMarkWaiting,
  onMarkPicked,
  onResumePick,
  onPrintAndPack,
  onBookCourier,
  onConfirmHandover,
  onCancelOrder,
}: OrdersPickTabProps) {
  return (
    <div className="space-y-4">
      {/* Pick Sub-tabs (Ready to Pick vs Not in Bin Waiting) */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-2xl bg-slate-900 border border-slate-800">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => onPickSubFilterChange('READY')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
              pickSubFilter === 'READY'
                ? 'bg-emerald-500 text-slate-950 font-black shadow-md'
                : 'bg-slate-800/80 text-slate-300 hover:bg-slate-700'
            }`}
          >
            <ClipboardList className="w-3.5 h-3.5" />
            <span>Ready to Pick ({counts.pickReady})</span>
          </button>

          <button
            type="button"
            onClick={() => onPickSubFilterChange('WAITING')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
              pickSubFilter === 'WAITING'
                ? 'bg-amber-500 text-slate-950 font-black shadow-md'
                : 'bg-slate-800/80 text-slate-300 hover:bg-slate-700'
            }`}
          >
            <AlertTriangle className="w-3.5 h-3.5" />
            <span>Not in Bin / Hold ({counts.pickWaiting})</span>
          </button>
        </div>

        <div className="text-[11px] text-slate-400 flex items-center gap-1.5">
          <MapPin className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
          <span>
            {pickSubFilter === 'READY'
              ? 'Verify Bin Location before picking. If an item is missing from the bin, click "Not Found / Hold".'
              : 'Orders on hold because items were missing or damaged in the assigned bin.'}
          </span>
        </div>
      </div>

      {/* Orders Table */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900 overflow-hidden shadow-lg p-3 sm:p-0">
        {/* 1. Mobile Collapsible List */}
        <div className="block md:hidden space-y-2.5">
          {orders.length === 0 ? (
            <div className="p-8 text-center text-xs text-slate-400">
              {pickSubFilter === 'READY'
                ? 'No orders are currently waiting to be picked.'
                : 'No orders are currently on hold/waiting in bin.'}
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
        </div>

        {/* 2. Desktop Full Table */}
        <div className="hidden md:block overflow-x-auto">
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
                <th className="p-4">Product, Variant &amp; SKU</th>
                <th className="p-4">Bin Location &amp; Stock</th>
                <th className="p-4">Memo / Invoice</th>
                <th className="p-4">Customer &amp; Courier</th>
                <th className="p-4">Stage</th>
                <th className="p-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {orders.length === 0 ? (
                <tr>
                  <td colSpan={8} className="p-10 text-center text-xs text-slate-400">
                    {pickSubFilter === 'READY'
                      ? 'No orders are currently waiting to be picked.'
                      : 'No orders are currently on hold/waiting in bin.'}
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
    </div>
  );
}
