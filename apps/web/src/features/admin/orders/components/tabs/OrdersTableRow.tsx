'use client';

import React, { useState, useRef, useEffect } from 'react';
import {
  MapPin,
  Eye,
  AlertTriangle,
  ArrowRight,
  RefreshCw,
  Printer,
  Truck,
  CheckCircle2,
  XCircle,
  ChevronDown,
} from 'lucide-react';
import { CourierPartner, WarehousePipelineOrder } from '../../types';

export interface OrdersTableRowProps {
  order: WarehousePipelineOrder;
  isSelected: boolean;
  isNearBottom?: boolean;
  onToggleSelect: (id: string) => void;
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

export function OrdersTableRow({
  order,
  isSelected,
  isNearBottom = false,
  onToggleSelect,
  onPreviewMemo,
  onInlineCourierChange,
  onMarkWaiting,
  onMarkPicked,
  onResumePick,
  onPrintAndPack,
  onBookCourier,
  onConfirmHandover,
  onCancelOrder,
}: OrdersTableRowProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

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

  return (
    <tr
      className={`transition-colors ${
        isSelected
          ? 'bg-emerald-50 dark:bg-emerald-950/20'
          : order.stage === 'WAITING'
          ? 'bg-amber-50 dark:bg-amber-950/10 hover:bg-amber-50 dark:hover:bg-amber-950/20'
          : 'hover:bg-slate-100/40 dark:hover:bg-navy-800/40'
      }`}
    >
      {/* Checkbox */}
      <td className="p-4">
        <input
          type="checkbox"
          checked={isSelected}
          onChange={() => onToggleSelect(order.id)}
          aria-label={`Select order ${order.id}`}
          className="h-4 w-4 rounded border-slate-300 dark:border-white/15 bg-slate-50 dark:bg-navy-950 text-orange-600 dark:text-orange-500 cursor-pointer"
        />
      </td>

      {/* Order ID & Merchant */}
      <td className="p-4">
        <span className="tabular-nums text-xs font-extrabold text-navy-800 dark:text-white block">
          {order.id}
        </span>
        <span className="text-xs tabular-nums text-orange-600 dark:text-orange-400 font-semibold">
          {order.merchantCode} · {order.merchantName}
        </span>
        <span className="text-[11px] text-slate-500 dark:text-slate-400 block mt-0.5">
          {order.createdAt}
        </span>
      </td>

      {/* Product Thumbnail + Variant (Image, Size, Color, Qty in row 1; SKU and Title in row 2) */}
      <td className="p-4">
        <div>
          {/* Row 1: Image, Size, Color, and Quantity all together in one row */}
          <div className="flex items-center gap-2.5">
            <img
              src={order.productImage}
              alt={order.productTitle}
              className="h-10 w-10 rounded-lg object-cover border border-slate-300 dark:border-white/15 bg-slate-50 dark:bg-navy-950 shrink-0"
            />
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="px-2 py-0.5 rounded bg-slate-50 dark:bg-navy-950 border border-slate-200 dark:border-white/10 text-xs font-semibold text-navy-800 dark:text-slate-100">
                {order.size} · {order.color}
              </span>
              <span className="px-2 py-0.5 rounded bg-emerald-500/10 border border-emerald-500/30 text-xs tabular-nums font-bold text-emerald-600 dark:text-emerald-400">
                Qty: {order.qty}
              </span>
            </div>
          </div>

          {/* Row 2: One line SKU, and next line Product Title */}
          <div className="mt-2 space-y-0.5">
            <div className="tabular-nums text-xs font-bold text-orange-600 dark:text-orange-400 tracking-wide">
              {order.sku}
            </div>
            <div className="text-xs font-bold text-navy-800 dark:text-navy-800 dark:text-white leading-snug line-clamp-1">
              {order.productTitle}
            </div>
          </div>
        </div>
      </td>

      {/* Bin Location & Stock Availability (Without "Bin:" text) */}
      <td className="p-4">
        <div className="flex flex-col items-start gap-1.5">
          <span
            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs tabular-nums font-extrabold border ${
              order.stage === 'WAITING'
                ? 'bg-amber-500/15 text-amber-700 dark:text-amber-300 border-amber-500/40'
                : 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-500/40'
            }`}
          >
            <MapPin className="w-3.5 h-3.5 shrink-0" />
            <span>{order.bin}</span>
          </span>

          <span
            className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] tabular-nums font-bold border ${
              order.stockAvailable > 0
                ? 'bg-slate-50 dark:bg-navy-950 text-slate-700 dark:text-slate-200 border-slate-200 dark:border-white/10'
                : 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/30'
            }`}
          >
            {order.stockAvailable > 0 ? `${order.stockAvailable} in stock` : 'Stock Out'}
          </span>
        </div>
      </td>

      {/* Reseller Memo Code (Without redundant "MEMO" prefix) */}
      <td className="p-4">
        <span className="tabular-nums text-xs font-bold px-2 py-0.5 rounded bg-indigo-500/10 text-indigo-700 dark:text-indigo-300 border border-indigo-500/30 inline-block">
          {order.memoCode.replace(/^MEMO-?/i, '')}
        </span>
        <span className="text-xs text-slate-600 dark:text-slate-300 block mt-1">
          {order.resellerName}
        </span>
      </td>

      {/* Customer & Inline Courier Override Dropdown */}
      <td className="p-4">
        <div className="text-xs font-bold text-navy-800 dark:text-slate-100">{order.customerName}</div>
        <div className="text-xs tabular-nums text-slate-600 dark:text-slate-300">
          {order.customerPhone} · {order.city}
        </div>
        <div className="flex items-center gap-2 mt-1.5 flex-wrap">
          <span className="text-xs tabular-nums font-extrabold text-orange-600 dark:text-orange-400">
            ৳ {order.codAmount.toLocaleString()}
          </span>

          <select
            value={order.courier}
            onChange={(e) => onInlineCourierChange(order.id, e.target.value as CourierPartner)}
            disabled={order.stage === 'CANCELLED'}
            aria-label="Change Courier Partner"
            className="text-xs font-bold px-2 py-0.5 rounded-lg bg-slate-50 dark:bg-navy-950 text-sky-700 dark:text-sky-300 border border-slate-300 dark:border-white/15 hover:border-sky-500/60 focus:outline-none focus:border-orange-500 cursor-pointer"
          >
            <option value="Steadfast">Steadfast</option>
            <option value="Pathao">Pathao</option>
            <option value="RedX">RedX</option>
          </select>
        </div>
        {order.trackingCode && (
          <span className="text-[11px] tabular-nums text-amber-700 dark:text-amber-300 block mt-1">
            {order.trackingCode}
          </span>
        )}
      </td>

      {/* Stage Badge + Waiting Reason */}
      <td className="p-4">
        <span
          className={`text-xs font-bold px-2.5 py-1 rounded-full border inline-block ${
            order.stage === 'PICK'
              ? 'bg-amber-500/10 text-amber-700 dark:text-amber-300 border-amber-500/30'
              : order.stage === 'WAITING'
              ? 'bg-rose-500/15 text-amber-800 dark:text-amber-200 border-amber-500/40'
              : order.stage === 'PACK'
              ? 'bg-indigo-500/10 text-indigo-700 dark:text-indigo-300 border-indigo-500/30'
              : order.stage === 'DISPATCH'
              ? 'bg-sky-500/10 text-sky-700 dark:text-sky-300 border-sky-500/30'
              : 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/30'
          }`}
        >
          {order.stage === 'PICK'
            ? 'TO PICK'
            : order.stage === 'WAITING'
            ? 'WAITING: NOT IN BIN'
            : order.stage === 'PACK'
            ? 'TO PACK'
            : order.stage === 'DISPATCH'
            ? order.isCourierBooked
              ? 'COURIER BOOKED'
              : 'READY DISPATCH'
            : order.stage}
        </span>
        {order.stage === 'WAITING' && order.holdReason && (
          <p className="text-[11px] text-amber-700 dark:text-amber-300 mt-1 max-w-[180px] leading-tight">
            {order.holdReason}
          </p>
        )}
      </td>

      {/* Actions Dropdown Menu */}
      <td className="p-4 text-right">
        <div className="relative inline-block text-left" ref={menuRef}>
          <button
            type="button"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="px-3 py-1.5 rounded-lg bg-slate-100 dark:bg-navy-800 hover:bg-slate-200 dark:hover:bg-navy-700 text-xs font-bold text-navy-800 dark:text-slate-100 border border-slate-300 dark:border-white/15 flex items-center gap-1.5 transition-colors cursor-pointer shadow-sm"
          >
            <span>Actions</span>
            <ChevronDown
              className={`w-3.5 h-3.5 transition-transform duration-200 ${
                isMenuOpen ? 'rotate-180 text-orange-600 dark:text-orange-400' : 'text-slate-600 dark:text-slate-300'
              }`}
            />
          </button>

          {isMenuOpen && (
            <div
              className={`absolute right-0 ${
                isNearBottom ? 'bottom-full mb-1.5' : 'top-full mt-1.5'
              } w-52 rounded-xl bg-white dark:bg-navy-900 border border-slate-200 dark:border-white/10 shadow-2xl py-1.5 z-[100] text-left font-sans text-xs`}
            >
              {/* Preview Memo */}
              <button
                type="button"
                onClick={() => {
                  setIsMenuOpen(false);
                  onPreviewMemo(order);
                }}
                className="w-full px-3 py-2 text-left text-navy-800 dark:text-slate-100 hover:bg-slate-100 dark:hover:bg-navy-800 flex items-center gap-2 transition-colors cursor-pointer"
              >
                <Eye className="w-4 h-4 text-orange-600 dark:text-orange-400" />
                <span>View / Print Memo</span>
              </button>

              {/* Stage Specific Actions */}
              {order.stage === 'PICK' && (
                <>
                  <button
                    type="button"
                    onClick={() => {
                      setIsMenuOpen(false);
                      onMarkPicked(order);
                    }}
                    className="w-full px-3 py-2 text-left text-emerald-700 dark:text-emerald-300 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 font-semibold flex items-center gap-2 transition-colors cursor-pointer"
                  >
                    <ArrowRight className="w-4 h-4 text-orange-600 dark:text-orange-400" />
                    <span>Mark Picked</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setIsMenuOpen(false);
                      onMarkWaiting(order);
                    }}
                    className="w-full px-3 py-2 text-left text-amber-700 dark:text-amber-300 hover:bg-amber-50 dark:hover:bg-amber-950/40 flex items-center gap-2 transition-colors cursor-pointer"
                  >
                    <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                    <span>Not Found / Hold</span>
                  </button>
                </>
              )}

              {order.stage === 'WAITING' && (
                <>
                  <button
                    type="button"
                    onClick={() => {
                      setIsMenuOpen(false);
                      onResumePick(order);
                    }}
                    className="w-full px-3 py-2 text-left text-emerald-700 dark:text-emerald-300 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 font-semibold flex items-center gap-2 transition-colors cursor-pointer"
                  >
                    <RefreshCw className="w-4 h-4 text-orange-600 dark:text-orange-400" />
                    <span>Found → Resume Pick</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setIsMenuOpen(false);
                      onMarkPicked(order);
                    }}
                    className="w-full px-3 py-2 text-left text-navy-800 dark:text-slate-100 hover:bg-slate-100 dark:hover:bg-navy-800 flex items-center gap-2 transition-colors cursor-pointer"
                  >
                    <ArrowRight className="w-4 h-4 text-slate-600 dark:text-slate-300" />
                    <span>Mark Picked</span>
                  </button>
                </>
              )}

              {order.stage === 'PACK' && (
                <button
                  type="button"
                  onClick={() => {
                    setIsMenuOpen(false);
                    onPrintAndPack(order);
                  }}
                  className="w-full px-3 py-2 text-left text-emerald-700 dark:text-emerald-300 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 font-semibold flex items-center gap-2 transition-colors cursor-pointer"
                >
                  <Printer className="w-4 h-4 text-orange-600 dark:text-orange-400" />
                  <span>Print 4x6&quot; &amp; Pack</span>
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
                  <Truck className="w-4 h-4 text-amber-600 dark:text-amber-400" />
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
                  <CheckCircle2 className="w-4 h-4 text-orange-600 dark:text-orange-400" />
                  <span>Confirm Handover</span>
                </button>
              )}

              {/* Cancel Order */}
              {(order.stage === 'PICK' || order.stage === 'WAITING' || order.stage === 'PACK') && (
                <div className="border-t border-slate-200 dark:border-white/10 my-1 pt-1">
                  <button
                    type="button"
                    onClick={() => {
                      setIsMenuOpen(false);
                      onCancelOrder(order);
                    }}
                    className="w-full px-3 py-2 text-left text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 flex items-center gap-2 transition-colors cursor-pointer"
                  >
                    <XCircle className="w-4 h-4 text-rose-600 dark:text-rose-400" />
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
