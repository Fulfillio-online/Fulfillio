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

export interface OrdersMobileCardProps {
  order: WarehousePipelineOrder;
  isSelected: boolean;
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

export function OrdersMobileCard({
  order,
  isSelected,
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
}: OrdersMobileCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);
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
    <div
      className={`rounded-xl border transition-all shadow-sm overflow-hidden ${
        isSelected
          ? 'border-emerald-500/50 bg-emerald-50 dark:bg-emerald-950/20'
          : order.stage === 'WAITING'
          ? 'border-amber-500/40 bg-amber-50 dark:bg-amber-950/10'
          : 'border-slate-200 dark:border-white/10 bg-slate-50/60 dark:bg-navy-950/60'
      }`}
    >
      {/* Collapsed Header: 3 Rows on Left & Status + Button on Right */}
      <div
        onClick={() => setIsExpanded(!isExpanded)}
        className="p-3.5 flex items-start justify-between gap-3 cursor-pointer hover:bg-slate-100/40 dark:hover:bg-navy-800/40 select-none transition-colors"
      >
        {/* Left Side: 3 Distinct Rows */}
        <div className="min-w-0 flex-1 space-y-1">
          {/* Row 1: Order ID & Date */}
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={isSelected}
              onClick={(e) => e.stopPropagation()}
              onChange={() => onToggleSelect(order.id)}
              aria-label={`Select order ${order.id}`}
              className="h-3.5 w-3.5 rounded border-slate-300 dark:border-white/15 bg-white dark:bg-navy-900 text-orange-600 dark:text-orange-500 cursor-pointer"
            />
            <span className="tabular-nums font-extrabold text-xs text-navy-800 dark:text-white">
              {order.id}
            </span>
            <span className="text-[11px] text-slate-500 dark:text-slate-400 font-sans">
              · {order.createdAt}
            </span>
          </div>

          {/* Row 2: Merchant & Product Name */}
          <div className="text-xs text-slate-700 dark:text-slate-200 truncate">
            <span className="font-semibold text-orange-600 dark:text-orange-400 tabular-nums text-xs">{order.merchantCode}</span>
            <span className="text-slate-500 dark:text-slate-400"> · </span>
            <span className="font-bold text-navy-800 dark:text-white">{order.productTitle}</span>
          </div>

          {/* Row 3: COD Amount & Variant badges */}
          <div className="flex items-center gap-2 pt-0.5">
            <span className="tabular-nums text-xs font-bold text-orange-600 dark:text-orange-400">
              ৳ {order.codAmount.toLocaleString()}
            </span>
            <span className="px-2 py-0.5 rounded bg-white dark:bg-navy-900 border border-slate-200 dark:border-white/10 text-[11px] font-semibold text-slate-700 dark:text-slate-200">
              {order.size} · {order.color} (Qty: {order.qty})
            </span>
          </div>
        </div>

        {/* Right Side: Stage Badge on Top Right & Chevron Toggle Button on Bottom Right */}
        <div className="flex flex-col items-end justify-between self-stretch shrink-0">
          <div>
            <span
              className={`text-[11px] font-bold px-2 py-0.5 rounded-full border inline-block ${
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
                ? 'WAITING'
                : order.stage === 'PACK'
                ? 'TO PACK'
                : order.stage === 'DISPATCH'
                ? order.isCourierBooked
                  ? 'BOOKED'
                  : 'DISPATCH'
                : order.stage}
            </span>
          </div>

          <button
            type="button"
            aria-label="Toggle details"
            className="p-1 rounded-lg bg-navy-800 dark:bg-navy-700 text-slate-600 dark:text-slate-300 hover:text-white transition-colors"
          >
            <ChevronDown
              className={`w-4 h-4 transition-transform duration-200 ${
                isExpanded ? 'rotate-180 text-orange-600 dark:text-orange-400' : ''
              }`}
            />
          </button>
        </div>
      </div>

      {/* Expanded Details Drawer */}
      {isExpanded && (
        <div className="px-3.5 pb-3.5 pt-2 border-t border-slate-200/80 dark:border-white/10 bg-white/60 dark:bg-navy-900/60 text-xs space-y-3 animate-in fade-in-50 duration-150 font-sans">
          {/* Product Detail with image, size, color, qty in row 1; SKU & title in row 2 */}
          <div className="p-2.5 rounded-lg bg-slate-50 dark:bg-navy-950 border border-slate-200 dark:border-white/10">
            {/* Row 1: Image, Size, Color and Quantity all together in one row */}
            <div className="flex items-center gap-2">
              <img
                src={order.productImage}
                alt={order.productTitle}
                className="h-10 w-10 rounded-lg object-cover border border-slate-300 dark:border-white/15 bg-slate-50 dark:bg-navy-950 shrink-0"
              />
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="px-2 py-0.5 rounded bg-white dark:bg-navy-900 border border-slate-200 dark:border-white/10 text-[11px] font-semibold text-navy-800 dark:text-slate-100">
                  {order.size} · {order.color}
                </span>
                <span className="px-2 py-0.5 rounded bg-emerald-500/10 border border-emerald-500/30 text-[11px] tabular-nums font-bold text-emerald-600 dark:text-emerald-400">
                  Qty: {order.qty}
                </span>
              </div>
            </div>

            {/* Row 2: One line SKU, and next line Product Title */}
            <div className="mt-2 space-y-0.5">
              <div className="tabular-nums text-xs font-bold text-orange-600 dark:text-orange-400 tracking-wide">
                {order.sku}
              </div>
              <div className="text-xs font-bold text-navy-800 dark:text-navy-800 dark:text-white leading-snug">
                {order.productTitle}
              </div>
            </div>
          </div>

          {/* Bin Location & Memo */}
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div className="p-2 rounded-lg bg-slate-50 dark:bg-navy-950 border border-slate-200 dark:border-white/10">
              <span className="text-slate-600 dark:text-slate-300 block text-[11px] uppercase font-semibold">Location</span>
              <span className="tabular-nums font-bold text-orange-600 dark:text-orange-400 flex items-center gap-1 mt-0.5">
                <MapPin className="w-3 h-3" />
                {order.bin}
              </span>
              <span className="text-[11px] text-slate-500 dark:text-slate-400 block">
                {order.stockAvailable > 0 ? `${order.stockAvailable} in stock` : 'Stock Out'}
              </span>
            </div>

            <div className="p-2 rounded-lg bg-slate-50 dark:bg-navy-950 border border-slate-200 dark:border-white/10">
              <span className="text-slate-600 dark:text-slate-300 block text-[11px] uppercase font-semibold">Invoice</span>
              <span className="tabular-nums font-bold text-indigo-700 dark:text-indigo-300 block mt-0.5">
                {order.memoCode.replace(/^MEMO-?/i, '')}
              </span>
              <span className="text-[11px] text-slate-600 dark:text-slate-300 truncate block">
                {order.resellerName}
              </span>
            </div>
          </div>

          {/* Customer & Courier */}
          <div className="p-2.5 rounded-lg bg-slate-50 dark:bg-navy-950 border border-slate-200 dark:border-white/10 text-xs space-y-1">
            <div className="flex justify-between items-start">
              <div>
                <span className="font-bold text-navy-800 dark:text-white block">{order.customerName}</span>
                <span className="text-slate-600 dark:text-slate-300 tabular-nums text-[11px]">
                  {order.customerPhone} · {order.city}
                </span>
              </div>
              <select
                value={order.courier}
                onChange={(e) => onInlineCourierChange(order.id, e.target.value as CourierPartner)}
                disabled={order.stage === 'CANCELLED'}
                onClick={(e) => e.stopPropagation()}
                className="text-[11px] font-bold px-2 py-0.5 rounded-lg bg-white dark:bg-navy-900 text-sky-700 dark:text-sky-300 border border-slate-300 dark:border-white/15 focus:outline-none"
              >
                <option value="Steadfast">Steadfast</option>
                <option value="Pathao">Pathao</option>
                <option value="RedX">RedX</option>
              </select>
            </div>
            {order.trackingCode && (
              <span className="text-[11px] tabular-nums text-amber-700 dark:text-amber-300 block">
                Tracking: {order.trackingCode}
              </span>
            )}
          </div>

          {/* Action Dropdown Menu & Quick Buttons */}
          <div className="flex items-center justify-between pt-1 border-t border-slate-200/80 dark:border-white/10">
            <button
              type="button"
              onClick={() => onPreviewMemo(order)}
              className="px-3 py-1.5 rounded-lg bg-slate-100 dark:bg-navy-800 hover:bg-slate-200 dark:hover:bg-navy-700 text-xs font-semibold text-navy-800 dark:text-slate-100 border border-slate-300 dark:border-white/15 flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <Eye className="w-3.5 h-3.5 text-orange-600 dark:text-orange-400" />
              <span>View Memo</span>
            </button>

            {/* Action Dropdown Menu */}
            <div className="relative inline-block text-left" ref={menuRef}>
              <button
                type="button"
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                className="px-3.5 py-1.5 rounded-lg bg-orange-600 hover:bg-orange-700 text-white font-bold text-xs flex items-center gap-1.5 transition-colors cursor-pointer shadow-md"
              >
                <span>Actions</span>
                <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-200 ${isMenuOpen ? 'rotate-180' : ''}`} />
              </button>

              {isMenuOpen && (
                <div className="absolute right-0 bottom-full mb-1.5 w-52 rounded-xl bg-white dark:bg-navy-900 border border-slate-200 dark:border-white/10 shadow-2xl py-1.5 z-50 text-xs font-sans">
                  {order.stage === 'PICK' && (
                    <>
                      <button
                        type="button"
                        onClick={() => {
                          setIsMenuOpen(false);
                          onMarkPicked(order);
                        }}
                        className="w-full px-3 py-2 text-left text-emerald-700 dark:text-emerald-300 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 font-semibold flex items-center gap-2"
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
                        className="w-full px-3 py-2 text-left text-amber-700 dark:text-amber-300 hover:bg-amber-50 dark:hover:bg-amber-950/40 flex items-center gap-2"
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
                        className="w-full px-3 py-2 text-left text-emerald-700 dark:text-emerald-300 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 font-semibold flex items-center gap-2"
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
                        className="w-full px-3 py-2 text-left text-navy-800 dark:text-slate-100 hover:bg-slate-100 dark:hover:bg-navy-800 flex items-center gap-2"
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
                      className="w-full px-3 py-2 text-left text-emerald-700 dark:text-emerald-300 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 font-semibold flex items-center gap-2"
                    >
                      <Printer className="w-4 h-4 text-orange-600 dark:text-orange-400" />
                      <span>Print 4x6" &amp; Pack</span>
                    </button>
                  )}

                  {order.stage === 'DISPATCH' && !order.isCourierBooked && (
                    <button
                      type="button"
                      onClick={() => {
                        setIsMenuOpen(false);
                        onBookCourier(order);
                      }}
                      className="w-full px-3 py-2 text-left text-amber-700 dark:text-amber-300 hover:bg-amber-50 dark:hover:bg-amber-950/40 font-semibold flex items-center gap-2"
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
                      className="w-full px-3 py-2 text-left text-emerald-700 dark:text-emerald-300 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 font-semibold flex items-center gap-2"
                    >
                      <CheckCircle2 className="w-4 h-4 text-orange-600 dark:text-orange-400" />
                      <span>Confirm Handover</span>
                    </button>
                  )}

                  {(order.stage === 'PICK' || order.stage === 'WAITING' || order.stage === 'PACK') && (
                    <div className="border-t border-slate-200 dark:border-white/10 my-1 pt-1">
                      <button
                        type="button"
                        onClick={() => {
                          setIsMenuOpen(false);
                          onCancelOrder(order);
                        }}
                        className="w-full px-3 py-2 text-left text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 flex items-center gap-2"
                      >
                        <XCircle className="w-4 h-4 text-rose-600 dark:text-rose-400" />
                        <span>Cancel Order</span>
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
