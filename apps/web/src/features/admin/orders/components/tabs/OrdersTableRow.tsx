'use client';

import React, { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Eye,
  AlertTriangle,
  Printer,
  Truck,
  CheckCircle2,
  XCircle,
  ChevronDown,
  PackageCheck,
} from 'lucide-react';
import { CourierPartner, OrderStage, WarehousePipelineOrder, formatOrderDate } from '../../types';

export interface OrdersTableRowProps {
  order: WarehousePipelineOrder;
  isSelected: boolean;
  isNearBottom?: boolean;
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

export function OrdersTableRow({
  order,
  isSelected,
  isNearBottom = false,
  onToggleSelect,
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
}: OrdersTableRowProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsMenuOpen(false);
      }
    };
    if (isMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isMenuOpen]);

  const handleView = () => {
    setIsMenuOpen(false);
    if (onViewOrder) {
      onViewOrder(order);
    } else {
      router.push(`/admin/orders/${encodeURIComponent(order.id)}`);
    }
  };

  const handlePrintMemo = () => {
    setIsMenuOpen(false);
    onPreviewMemo(order);
  };

  const dateDisplay = formatOrderDate(order.createdAt);

  return (
    <tr
      className={`transition-colors border-b border-slate-100 dark:border-white/5 text-xs ${
        isSelected
          ? 'bg-emerald-50 dark:bg-emerald-950/20'
          : order.stage === 'WAITING'
          ? 'bg-amber-50/70 dark:bg-amber-950/10 hover:bg-amber-50 dark:hover:bg-amber-950/20'
          : 'hover:bg-slate-50 dark:hover:bg-navy-800/40'
      }`}
    >
      {/* 1. Checkbox */}
      <td className="py-3 px-2 sm:px-3 align-top w-8">
        <input
          type="checkbox"
          checked={isSelected}
          onChange={() => onToggleSelect(order.id)}
          aria-label={`Select order ${order.id}`}
          className="h-3.5 w-3.5 rounded border-slate-300 dark:border-white/15 bg-white dark:bg-navy-950 text-orange-600 dark:text-orange-500 cursor-pointer mt-0.5"
        />
      </td>

      {/* 2. Order ID & Merchant (Stacked: Order ID -> Merchant Name -> Date) */}
      <td className="py-3 px-2 sm:px-3 align-top">
        <div className="space-y-0.5">
          <Link
            href={`/admin/orders/${encodeURIComponent(order.id)}`}
            className="tabular-nums font-black text-navy-900 dark:text-white hover:text-orange-600 dark:hover:text-orange-400 block transition-colors leading-tight"
          >
            {order.id}
          </Link>
          <div className="font-semibold text-slate-700 dark:text-slate-300 truncate max-w-[140px] leading-tight">
            {order.merchantName}
          </div>
          <div className="text-[11px] font-medium text-slate-400 dark:text-slate-400 leading-tight">
            {dateDisplay}
          </div>
        </div>
      </td>

      {/* 3. Memo / Invoice */}
      <td className="py-3 px-2 sm:px-3 align-top">
        <div className="space-y-0.5">
          <span className="tabular-nums font-bold px-2 py-0.5 rounded bg-indigo-500/10 text-indigo-700 dark:text-indigo-300 border border-indigo-500/30 inline-block font-mono text-[11px]">
            {order.memoCode.replace(/^MEMO-?/i, '')}
          </span>
          <span className="text-[11px] text-slate-500 dark:text-slate-400 block truncate max-w-[130px] font-medium leading-tight">
            {order.resellerName}
          </span>
        </div>
      </td>

      {/* 4. Customer (Name, Phone Number, Address) */}
      <td className="py-3 px-2 sm:px-3 align-top">
        <div className="space-y-0.5 max-w-[160px] sm:max-w-[200px]">
          <div className="font-bold text-navy-900 dark:text-white truncate">
            {order.customerName}
          </div>
          <div className="tabular-nums text-slate-600 dark:text-slate-300 font-medium text-[11px]">
            {order.customerPhone}
          </div>
          <div
            className="text-[11px] text-slate-500 dark:text-slate-400 truncate leading-tight"
            title={order.customerAddress || order.city}
          >
            {order.customerAddress || order.city}
          </div>
        </div>
      </td>

      {/* 5. Courier (Partner & Tracking) */}
      <td className="py-3 px-2 sm:px-3 align-top">
        <div className="space-y-1">
          <select
            value={order.courier}
            onChange={(e) => onInlineCourierChange(order.id, e.target.value as CourierPartner)}
            disabled={order.stage === 'CANCELLED'}
            aria-label="Change Courier Partner"
            className="text-xs font-bold px-2 py-0.5 rounded-lg bg-slate-100 dark:bg-navy-950 text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-white/15 hover:border-orange-500/60 focus:outline-none focus:border-orange-500 cursor-pointer shadow-2xs"
          >
            <option value="Steadfast">Steadfast</option>
            <option value="Pathao">Pathao</option>
            <option value="RedX">RedX</option>
          </select>

          {order.trackingCode && (
            <div className="text-[10px] font-mono font-bold text-amber-600 dark:text-amber-400 block truncate max-w-[110px]">
              {order.trackingCode}
            </div>
          )}
        </div>
      </td>

      {/* 6. Total / Amount (Order Value / COD) */}
      <td className="py-3 px-2 sm:px-3 align-top whitespace-nowrap">
        <div className="space-y-0.5">
          <div className="font-black text-navy-900 dark:text-white tabular-nums text-xs sm:text-sm">
            ৳ {order.codAmount.toLocaleString()}
          </div>
          <span className="text-[10px] uppercase font-bold text-emerald-600 dark:text-emerald-400 block tracking-wider leading-none">
            COD Total
          </span>
        </div>
      </td>

      {/* 7. Stage / Status (Clean, single-line Badge ONLY - NO Dropdown) */}
      <td className="py-3 px-2 sm:px-3 align-top whitespace-nowrap">
        <div className="space-y-0.5">
          <span
            className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full border whitespace-nowrap inline-flex items-center gap-1 leading-none ${
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

          {order.stage === 'WAITING' && (
            <p
              className="text-[10px] text-amber-700 dark:text-amber-300 font-medium truncate max-w-[130px] leading-tight block pt-0.5"
              title={order.holdReason || 'Awaiting merchant stock delivery'}
            >
              {order.holdReason || 'Awaiting merchant stock delivery'}
            </p>
          )}
        </div>
      </td>

      {/* 8. Actions (Fully visible, text-right, whitespace-nowrap) */}
      <td className="py-3 px-2 sm:px-3 align-top text-right whitespace-nowrap">
        <div className="relative inline-block text-left" ref={menuRef}>
          <button
            type="button"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-navy-800 hover:bg-slate-200 dark:hover:bg-navy-700 text-xs font-bold text-navy-900 dark:text-slate-100 border border-slate-300 dark:border-white/15 inline-flex items-center gap-1 transition-colors cursor-pointer shadow-2xs whitespace-nowrap"
          >
            <span>Actions</span>
            <ChevronDown
              className={`w-3.5 h-3.5 transition-transform duration-200 ${
                isMenuOpen
                  ? 'rotate-180 text-orange-600 dark:text-orange-400'
                  : 'text-slate-600 dark:text-slate-300'
              }`}
            />
          </button>

          {isMenuOpen && (
            <div
              className={`absolute right-0 ${
                isNearBottom ? 'bottom-full mb-1' : 'top-full mt-1'
              } w-52 rounded-xl bg-white dark:bg-navy-900 border border-slate-200 dark:border-white/10 shadow-2xl py-1 z-[100] text-left font-sans text-xs`}
            >
              {/* Option 1: View Order Details */}
              <button
                type="button"
                onClick={handleView}
                className="w-full px-3 py-2 text-left text-navy-900 dark:text-slate-100 hover:bg-slate-100 dark:hover:bg-navy-800 flex items-center gap-2 transition-colors cursor-pointer font-semibold"
              >
                <Eye className="w-4 h-4 text-orange-600 dark:text-orange-400 shrink-0" />
                <span>View Order Details</span>
              </button>

              {/* Option 2: Print Memo */}
              <button
                type="button"
                onClick={handlePrintMemo}
                className="w-full px-3 py-2 text-left text-navy-900 dark:text-slate-100 hover:bg-slate-100 dark:hover:bg-navy-800 flex items-center gap-2 transition-colors cursor-pointer font-semibold"
              >
                <Printer className="w-4 h-4 text-indigo-600 dark:text-indigo-400 shrink-0" />
                <span>Print Memo Invoice</span>
              </button>

              <div className="border-t border-slate-100 dark:border-white/10 my-1" />

              {/* Stage Transitions (English Only) */}
              {order.stage !== 'PACK' && order.stage !== 'CANCELLED' && (
                <button
                  type="button"
                  onClick={() => {
                    setIsMenuOpen(false);
                    if (onInlineStageChange) {
                      onInlineStageChange(order.id, 'PACK');
                    } else {
                      onMarkPicked(order);
                    }
                  }}
                  className="w-full px-3 py-2 text-left text-indigo-700 dark:text-indigo-300 hover:bg-indigo-50 dark:hover:bg-indigo-950/40 font-semibold flex items-center gap-2 transition-colors cursor-pointer"
                >
                  <PackageCheck className="w-4 h-4 text-indigo-600 dark:text-indigo-400 shrink-0" />
                  <span>Move to Pack</span>
                </button>
              )}

              {order.stage !== 'WAITING' && order.stage !== 'CANCELLED' && (
                <button
                  type="button"
                  onClick={() => {
                    setIsMenuOpen(false);
                    if (onInlineStageChange) {
                      onInlineStageChange(
                        order.id,
                        'WAITING',
                        'Awaiting merchant stock delivery'
                      );
                    } else {
                      onMarkWaiting(order);
                    }
                  }}
                  className="w-full px-3 py-2 text-left text-amber-700 dark:text-amber-300 hover:bg-amber-50 dark:hover:bg-amber-950/40 font-semibold flex items-center gap-2 transition-colors cursor-pointer"
                >
                  <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0" />
                  <span>Put on Hold</span>
                </button>
              )}

              {order.stage !== 'DISPATCH' && order.stage !== 'CANCELLED' && (
                <button
                  type="button"
                  onClick={() => {
                    setIsMenuOpen(false);
                    if (onInlineStageChange) {
                      onInlineStageChange(order.id, 'DISPATCH');
                    } else {
                      onPrintAndPack(order);
                    }
                  }}
                  className="w-full px-3 py-2 text-left text-emerald-700 dark:text-emerald-300 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 font-semibold flex items-center gap-2 transition-colors cursor-pointer"
                >
                  <Truck className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                  <span>Move to Dispatch</span>
                </button>
              )}

              {order.stage === 'DISPATCH' && !order.isCourierBooked && (
                <button
                  type="button"
                  onClick={() => {
                    setIsMenuOpen(false);
                    onBookCourier(order);
                  }}
                  className="w-full px-3 py-2 text-left text-amber-700 dark:text-amber-300 hover:bg-amber-50 dark:hover:bg-amber-950/40 font-semibold flex items-center gap-2 transition-colors cursor-pointer"
                >
                  <Truck className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0" />
                  <span>Book Courier</span>
                </button>
              )}

              {order.stage === 'DISPATCH' && order.isCourierBooked && (
                <button
                  type="button"
                  onClick={() => {
                    setIsMenuOpen(false);
                    onConfirmHandover(order);
                  }}
                  className="w-full px-3 py-2 text-left text-emerald-700 dark:text-emerald-300 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 font-semibold flex items-center gap-2 transition-colors cursor-pointer"
                >
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                  <span>Confirm Handover</span>
                </button>
              )}

              {/* Cancel Order */}
              {order.stage !== 'CANCELLED' && order.stage !== 'HANDED_OVER' && (
                <div className="border-t border-slate-100 dark:border-white/10 my-1 pt-1">
                  <button
                    type="button"
                    onClick={() => {
                      setIsMenuOpen(false);
                      onCancelOrder(order);
                    }}
                    className="w-full px-3 py-2 text-left text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 flex items-center gap-2 transition-colors cursor-pointer font-semibold"
                  >
                    <XCircle className="w-4 h-4 text-rose-600 dark:text-rose-400 shrink-0" />
                    <span>Cancel Order</span>
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </td>
    </tr>
  );
}
