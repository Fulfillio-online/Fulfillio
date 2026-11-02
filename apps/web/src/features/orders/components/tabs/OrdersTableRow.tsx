'use client';

import React from 'react';
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
} from 'lucide-react';
import { CourierPartner, WarehousePipelineOrder } from '../../types';

interface OrdersTableRowProps {
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

export function OrdersTableRow({
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
}: OrdersTableRowProps) {
  return (
    <tr
      className={`transition-colors ${
        isSelected
          ? 'bg-emerald-950/20'
          : order.stage === 'WAITING'
          ? 'bg-amber-950/10 hover:bg-amber-950/20'
          : 'hover:bg-slate-800/40'
      }`}
    >
      {/* Checkbox */}
      <td className="p-4">
        <input
          type="checkbox"
          checked={isSelected}
          onChange={() => onToggleSelect(order.id)}
          aria-label={`Select order ${order.id}`}
          className="h-4 w-4 rounded border-slate-700 bg-slate-950 text-emerald-500 cursor-pointer"
        />
      </td>

      {/* Order ID & Merchant */}
      <td className="p-4">
        <span className="font-mono text-xs font-extrabold text-white block">
          {order.id}
        </span>
        <span className="text-[11px] font-mono text-emerald-400 font-semibold">
          {order.merchantCode} · {order.merchantName}
        </span>
        <span className="text-[10px] text-slate-500 block mt-0.5">
          {order.createdAt}
        </span>
      </td>

      {/* Product Thumbnail + Title, Variant & 2-Part SKU */}
      <td className="p-4">
        <div className="flex items-start gap-3">
          <img
            src={order.productImage}
            alt={order.productTitle}
            className="h-10 w-10 rounded-xl object-cover border border-slate-700 bg-slate-950 shrink-0"
          />
          <div className="min-w-0">
            <div className="text-xs font-bold text-slate-100 leading-snug">
              {order.productTitle}
            </div>
            <div className="flex items-center gap-1.5 mt-1 flex-wrap">
              <span className="px-2 py-0.5 rounded bg-slate-950 border border-slate-800 text-[11px] text-slate-300">
                {order.color} / <strong>{order.size}</strong>
              </span>
              <span className="px-2 py-0.5 rounded bg-emerald-500/10 border border-emerald-500/30 text-[11px] font-mono font-bold text-emerald-400">
                Qty: {order.qty}
              </span>
            </div>
            <span className="text-[11px] font-mono text-slate-400 block mt-1">
              {order.sku}
            </span>
          </div>
        </div>
      </td>

      {/* Bin Location & Stock Availability */}
      <td className="p-4">
        <div className="flex flex-col items-start gap-1.5">
          <span
            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-mono font-extrabold border ${
              order.stage === 'WAITING'
                ? 'bg-amber-500/15 text-amber-300 border-amber-500/40'
                : 'bg-emerald-500/15 text-emerald-300 border-emerald-500/40'
            }`}
          >
            <MapPin className="w-3.5 h-3.5 shrink-0" />
            <span>Bin: {order.bin}</span>
          </span>

          <span
            className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-mono font-bold border ${
              order.stockAvailable > 0
                ? 'bg-slate-950 text-slate-300 border-slate-800'
                : 'bg-rose-500/10 text-rose-400 border-rose-500/30'
            }`}
          >
            {order.stockAvailable > 0 ? `${order.stockAvailable} in stock` : 'Stock Out'}
          </span>
        </div>
      </td>

      {/* Reseller Memo Code */}
      <td className="p-4">
        <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-indigo-500/10 text-indigo-300 border border-indigo-500/30 inline-block">
          {order.memoCode}
        </span>
        <span className="text-[11px] text-slate-400 block mt-1">
          {order.resellerName}
        </span>
      </td>

      {/* Customer & Inline Courier Override Dropdown */}
      <td className="p-4">
        <div className="text-xs font-bold text-slate-200">{order.customerName}</div>
        <div className="text-[11px] font-mono text-slate-400">
          {order.customerPhone} · {order.city}
        </div>
        <div className="flex items-center gap-2 mt-1.5 flex-wrap">
          <span className="text-xs font-mono font-extrabold text-emerald-400">
            ৳ {order.codAmount.toLocaleString()}
          </span>

          <select
            value={order.courier}
            onChange={(e) => onInlineCourierChange(order.id, e.target.value as CourierPartner)}
            disabled={order.stage === 'CANCELLED'}
            aria-label="Change Courier Partner"
            className="text-[11px] font-bold px-2 py-0.5 rounded-lg bg-slate-950 text-sky-300 border border-slate-700 hover:border-sky-500/60 focus:outline-none focus:border-emerald-500 cursor-pointer"
          >
            <option value="Steadfast">Steadfast</option>
            <option value="Pathao">Pathao</option>
            <option value="RedX">RedX</option>
          </select>
        </div>
        {order.trackingCode && (
          <span className="text-[10px] font-mono text-amber-300 block mt-1">
            {order.trackingCode}
          </span>
        )}
      </td>

      {/* Stage Badge + Waiting Reason */}
      <td className="p-4">
        <span
          className={`text-[11px] font-bold px-2.5 py-1 rounded-full border inline-block ${
            order.stage === 'PICK'
              ? 'bg-amber-500/10 text-amber-300 border-amber-500/30'
              : order.stage === 'WAITING'
              ? 'bg-rose-500/15 text-amber-200 border-amber-500/40'
              : order.stage === 'PACK'
              ? 'bg-indigo-500/10 text-indigo-300 border-indigo-500/30'
              : order.stage === 'DISPATCH'
              ? 'bg-sky-500/10 text-sky-300 border-sky-500/30'
              : 'bg-rose-500/10 text-rose-400 border-rose-500/30'
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
          <p className="text-[10px] text-amber-300/90 mt-1 max-w-[180px] leading-tight">
            {order.holdReason}
          </p>
        )}
      </td>

      {/* Actions */}
      <td className="p-4 text-right">
        <div className="flex items-center justify-end gap-1.5 flex-wrap">
          <button
            type="button"
            onClick={() => onPreviewMemo(order)}
            className="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-200 border border-slate-700 flex items-center gap-1 cursor-pointer"
            title="View or Print 4x6 Invoice"
          >
            <Eye className="w-3.5 h-3.5 text-emerald-400" />
            <span>Memo</span>
          </button>

          {order.stage === 'PICK' && (
            <>
              <button
                type="button"
                onClick={() => onMarkWaiting(order)}
                className="px-2.5 py-1.5 rounded-lg bg-amber-950/70 hover:bg-amber-900/80 text-amber-300 border border-amber-500/40 text-xs font-bold flex items-center gap-1 cursor-pointer"
                title="Put on Waiting/Hold if item is not found in the assigned Bin"
              >
                <AlertTriangle className="w-3.5 h-3.5" />
                <span>Not Found / Hold</span>
              </button>

              <button
                type="button"
                onClick={() => onMarkPicked(order)}
                className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-xs font-bold text-white flex items-center gap-1 cursor-pointer"
              >
                <span>Mark Picked</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </>
          )}

          {order.stage === 'WAITING' && (
            <>
              <button
                type="button"
                onClick={() => onResumePick(order)}
                className="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-emerald-300 border border-emerald-500/40 text-xs font-bold flex items-center gap-1 cursor-pointer"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Found → Resume Pick</span>
              </button>

              <button
                type="button"
                onClick={() => onMarkPicked(order)}
                className="px-2.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-xs font-bold text-white flex items-center gap-1 cursor-pointer"
              >
                <span>Mark Picked</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </>
          )}

          {order.stage === 'PACK' && (
            <button
              type="button"
              onClick={() => onPrintAndPack(order)}
              className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-xs font-bold text-white flex items-center gap-1.5 cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print 4x6&quot; &amp; Pack</span>
            </button>
          )}

          {order.stage === 'DISPATCH' && !order.isCourierBooked && (
            <button
              type="button"
              onClick={() => onBookCourier(order)}
              className="px-3 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-500 text-xs font-bold text-white flex items-center gap-1 cursor-pointer"
            >
              <Truck className="w-3.5 h-3.5" />
              <span>Book Courier</span>
            </button>
          )}

          {order.stage === 'DISPATCH' && order.isCourierBooked && (
            <button
              type="button"
              onClick={() => onConfirmHandover(order)}
              className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-xs font-bold text-white flex items-center gap-1 cursor-pointer"
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Confirm Handover</span>
            </button>
          )}

          {(order.stage === 'PICK' || order.stage === 'WAITING' || order.stage === 'PACK') && (
            <button
              type="button"
              onClick={() => onCancelOrder(order)}
              className="p-1.5 rounded-lg bg-rose-950/60 hover:bg-rose-900/80 text-rose-300 border border-rose-800/60 cursor-pointer"
              title="Cancel Order & Restore Stock"
            >
              <XCircle className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </td>
    </tr>
  );
}
