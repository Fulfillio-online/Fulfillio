'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Eye,
  AlertTriangle,
  Printer,
  Truck,
  ChevronDown,
  PackageCheck,
} from 'lucide-react';
import { CourierPartner, OrderStage, WarehousePipelineOrder, formatOrderDate } from '../../types';

export interface OrdersMobileCardProps {
  order: WarehousePipelineOrder;
  isSelected: boolean;
  onToggleSelect: (id: string) => void;
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

export function OrdersMobileCard({
  order,
  isSelected,
  onToggleSelect,
  onPreviewMemo,
  onInlineCourierChange,
  onInlineStageChange,
  onViewOrder,
}: OrdersMobileCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const router = useRouter();

  const handleView = () => {
    if (onViewOrder) {
      onViewOrder(order);
    } else {
      router.push(`/admin/orders/${encodeURIComponent(order.id)}`);
    }
  };

  const handlePrintMemo = () => {
    onPreviewMemo(order);
  };

  const dateDisplay = formatOrderDate(order.createdAt);

  return (
    <div
      className={`rounded-2xl border transition-all shadow-sm overflow-hidden ${
        isSelected
          ? 'border-emerald-500/50 bg-emerald-50 dark:bg-emerald-950/20'
          : order.stage === 'WAITING'
          ? 'border-amber-500/40 bg-amber-50/70 dark:bg-amber-950/10'
          : 'border-slate-200 dark:border-white/10 bg-white dark:bg-navy-900'
      }`}
    >
      {/* Card Header */}
      <div
        onClick={() => setIsExpanded(!isExpanded)}
        className="p-4 flex items-start justify-between gap-3 cursor-pointer select-none transition-colors"
      >
        <div className="min-w-0 flex-1 space-y-1">
          {/* Row 1: Checkbox + Order ID + Date */}
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={isSelected}
              onClick={(e) => e.stopPropagation()}
              onChange={() => onToggleSelect(order.id)}
              aria-label={`Select order ${order.id}`}
              className="h-4 w-4 rounded border-slate-300 dark:border-white/15 bg-white dark:bg-navy-900 text-orange-600 dark:text-orange-500 cursor-pointer"
            />
            <span className="tabular-nums font-extrabold text-sm text-navy-900 dark:text-white">
              {order.id}
            </span>
            <span className="text-xs text-slate-400 dark:text-slate-500 font-medium">
              · {dateDisplay}
            </span>
          </div>

          {/* Row 2: Merchant Name */}
          <div className="text-xs font-bold text-slate-700 dark:text-slate-200">
            {order.merchantName}
          </div>

          {/* Row 3: Customer & Amount */}
          <div className="flex items-center justify-between text-xs pt-1">
            <span className="text-slate-600 dark:text-slate-300 font-medium truncate max-w-[170px]">
              {order.customerName}
            </span>
            <span className="font-black text-navy-900 dark:text-white tabular-nums">
              ৳ {order.codAmount.toLocaleString()}
            </span>
          </div>
        </div>

        {/* Right: Stage Badge & Dropdown Arrow */}
        <div className="flex flex-col items-end gap-2 shrink-0">
          <span
            className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
              order.stage === 'PICK'
                ? 'bg-amber-500/10 text-amber-700 dark:text-amber-300 border-amber-500/30'
                : order.stage === 'WAITING'
                ? 'bg-rose-500/15 text-rose-700 dark:text-rose-300 border-rose-500/40'
                : order.stage === 'PACK'
                ? 'bg-indigo-500/10 text-indigo-700 dark:text-indigo-300 border-indigo-500/30'
                : order.stage === 'DISPATCH'
                ? order.isCourierBooked
                  ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-500/40'
                  : 'bg-sky-500/10 text-sky-700 dark:text-sky-300 border-sky-500/30'
                : 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/30'
            }`}
          >
            {order.stage === 'PICK'
              ? 'TO PICK'
              : order.stage === 'WAITING'
              ? 'ON HOLD'
              : order.stage === 'PACK'
              ? 'TO PACK'
              : order.stage === 'DISPATCH'
              ? order.isCourierBooked
                ? 'COURIER BOOKED'
                : 'READY DISPATCH'
              : order.stage}
          </span>
          <ChevronDown
            className={`w-4 h-4 text-slate-400 transition-transform ${
              isExpanded ? 'rotate-180' : ''
            }`}
          />
        </div>
      </div>

      {/* Expanded Details */}
      {isExpanded && (
        <div className="px-4 pb-4 pt-2 border-t border-slate-100 dark:border-white/5 space-y-3 text-xs bg-slate-50/50 dark:bg-navy-950/50">
          {/* Customer info */}
          <div className="space-y-1">
            <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
              Customer Details
            </span>
            <div className="font-semibold text-navy-900 dark:text-white">
              {order.customerName} ({order.customerPhone})
            </div>
            <div className="text-[11px] text-slate-500 dark:text-slate-400">
              {order.customerAddress || order.city}
            </div>
          </div>

          {/* Courier & Memo info */}
          <div className="grid grid-cols-2 gap-2 pt-1 border-t border-slate-200/50 dark:border-white/5">
            <div>
              <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block">
                Courier
              </span>
              <select
                value={order.courier}
                onChange={(e) => onInlineCourierChange(order.id, e.target.value as CourierPartner)}
                aria-label="Change Courier"
                className="mt-1 text-xs font-bold px-2 py-1 rounded-lg bg-white dark:bg-navy-900 text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-white/10"
              >
                <option value="">Unassigned</option>
                <option value="Steadfast">Steadfast</option>
                <option value="Pathao">Pathao</option>
                <option value="RedX">RedX</option>
              </select>
              {order.trackingCode && (
                <span className="text-[10px] font-mono block text-amber-600 dark:text-amber-400 mt-0.5">
                  {order.trackingCode}
                </span>
              )}
            </div>

            <div>
              <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block">
                Memo
              </span>
              <span className="font-mono font-bold text-indigo-600 dark:text-indigo-400 block mt-1">
                {order.memoCode}
              </span>
              {order.stage === 'WAITING' && (
                <span className="text-[10px] text-amber-700 dark:text-amber-300 block truncate mt-0.5">
                  {order.holdReason || 'Awaiting merchant stock delivery'}
                </span>
              )}
            </div>
          </div>

          {/* Quick Stage Action Pills (English Only) */}
          <div className="flex flex-wrap items-center gap-1.5 pt-2 border-t border-slate-200/50 dark:border-white/5">
            {order.stage !== 'PACK' && order.stage !== 'CANCELLED' && (
              <button
                type="button"
                onClick={() => onInlineStageChange?.(order.id, 'PACK')}
                className="px-2.5 py-1 rounded-lg bg-indigo-500/10 text-indigo-700 dark:text-indigo-300 border border-indigo-500/20 text-[11px] font-bold flex items-center gap-1"
              >
                <PackageCheck className="w-3 h-3" />
                <span>Move to Pack</span>
              </button>
            )}
            {order.stage !== 'WAITING' && order.stage !== 'CANCELLED' && (
              <button
                type="button"
                onClick={() =>
                  onInlineStageChange?.(
                    order.id,
                    'WAITING',
                    'Awaiting merchant stock delivery'
                  )
                }
                className="px-2.5 py-1 rounded-lg bg-amber-500/10 text-amber-700 dark:text-amber-300 border border-amber-500/20 text-[11px] font-bold flex items-center gap-1"
              >
                <AlertTriangle className="w-3 h-3" />
                <span>Put on Hold</span>
              </button>
            )}
            {order.stage !== 'DISPATCH' && order.stage !== 'CANCELLED' && (
              <button
                type="button"
                onClick={() => onInlineStageChange?.(order.id, 'DISPATCH')}
                className="px-2.5 py-1 rounded-lg bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border border-emerald-500/20 text-[11px] font-bold flex items-center gap-1"
              >
                <Truck className="w-3 h-3" />
                <span>Move to Dispatch</span>
              </button>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2 pt-2 border-t border-slate-200/50 dark:border-white/5">
            <button
              type="button"
              onClick={handleView}
              className="flex-1 py-2 px-3 rounded-xl bg-orange-600 hover:bg-orange-700 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-sm"
            >
              <Eye className="w-3.5 h-3.5" />
              <span>View Details</span>
            </button>

            <button
              type="button"
              onClick={handlePrintMemo}
              className="py-2 px-3 rounded-xl bg-white dark:bg-navy-900 border border-slate-200 dark:border-white/10 text-slate-700 dark:text-slate-200 hover:bg-slate-100 font-bold text-xs flex items-center justify-center gap-1.5"
            >
              <Printer className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
              <span>Print Memo</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
