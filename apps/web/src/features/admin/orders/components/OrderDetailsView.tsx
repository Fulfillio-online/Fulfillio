'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  ArrowLeft,
  Printer,
  Truck,
  CheckCircle2,
  Clock,
  MapPin,
  Phone,
  User,
  Package,
  Layers,
  Banknote,
  FileText,
  AlertTriangle,
  RotateCcw,
  Boxes,
  ShieldCheck,
  ChevronRight,
} from 'lucide-react';
import {
  CourierPartner,
  OrderStage,
  WarehousePipelineOrder,
  OrderItem,
  formatOrderDate,
} from '../types';
import { INITIAL_PIPELINE_ORDERS, STORAGE_KEY_ORDERS } from '../mockData';
import { MemoPreviewModal } from './modals/MemoPreviewModal';
import { IsolatedPrintPortal } from './print/IsolatedPrintPortal';

interface OrderDetailsViewProps {
  orderId: string;
}

export function OrderDetailsView({ orderId }: OrderDetailsViewProps) {
  const router = useRouter();
  const [order, setOrder] = useState<WarehousePipelineOrder | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [previewMemo, setPreviewMemo] = useState<WarehousePipelineOrder | null>(null);
  const [isPrinting, setIsPrinting] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY_ORDERS);
      let list = INITIAL_PIPELINE_ORDERS;
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) {
          list = parsed;
        }
      }
      const decodedId = decodeURIComponent(orderId).trim();
      const found = list.find(
        (o) => o.id.toLowerCase() === decodedId.toLowerCase() || o.id === decodedId
      );
      setOrder(found || list[0] || null);
    } catch (e) {
      console.error('Failed to load order details:', e);
      setOrder(INITIAL_PIPELINE_ORDERS[0]);
    } finally {
      setIsLoaded(true);
    }
  }, [orderId]);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  };

  const handlePrint = () => {
    if (!order) return;
    setIsPrinting(true);
    if (typeof document !== 'undefined') {
      document.body.classList.add('printing-single-invoice');
      setTimeout(() => {
        window.print();
        document.body.classList.remove('printing-single-invoice');
        setIsPrinting(false);
      }, 100);
    }
  };

  if (!isLoaded) {
    return (
      <div className="p-8 text-center text-slate-500 dark:text-slate-400 text-sm animate-pulse">
        Loading order details...
      </div>
    );
  }

  if (!order) {
    return (
      <div className="p-8 rounded-2xl bg-white dark:bg-navy-900 border border-slate-200 dark:border-white/10 text-center space-y-4">
        <h2 className="text-lg font-bold text-navy-900 dark:text-white">Order Not Found</h2>
        <p className="text-xs text-slate-500 dark:text-slate-400">
          No order matching ID &ldquo;{orderId}&rdquo; was found in the warehouse system.
        </p>
        <Link
          href="/admin/orders"
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-orange-600 text-white font-bold text-xs"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Return to Orders Pipeline</span>
        </Link>
      </div>
    );
  }

  // Multi-item resolution: Use items array if present, otherwise construct items from single-item fields
  const items: OrderItem[] = order.items && order.items.length > 0
    ? order.items
    : [
        {
          sku: order.sku,
          title: order.productTitle,
          image: order.productImage,
          color: order.color,
          size: order.size,
          qty: order.qty,
          unitPrice: Math.round(order.codAmount / (order.qty || 1)),
          bin: order.bin,
        },
      ];

  const totalItemCount = items.reduce((acc, curr) => acc + curr.qty, 0);

  return (
    <div className="space-y-6">
      {toast && (
        <div className="fixed top-6 right-6 z-50 bg-orange-600 text-white px-4 py-3 rounded-xl shadow-2xl flex items-center gap-2 text-xs font-bold animate-in fade-in">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>{toast}</span>
        </div>
      )}

      {/* Top Navigation & Actions Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2">
        <div className="flex items-center gap-3">
          <Link
            href="/admin/orders"
            className="p-2.5 rounded-xl bg-white dark:bg-navy-900 hover:bg-slate-100 dark:hover:bg-navy-800 border border-slate-200 dark:border-white/10 text-slate-700 dark:text-slate-200 shadow-xs transition-colors shrink-0"
            title="Back to Orders Pipeline"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>

          <div>
            <div className="flex items-center gap-2.5 flex-wrap">
              <h1 className="text-2xl font-extrabold tracking-tight text-navy-900 dark:text-white tabular-nums">
                {order.id}
              </h1>
              <span
                className={`text-xs font-bold px-3 py-1 rounded-full border ${
                  order.stage === 'PICK'
                    ? 'bg-amber-500/10 text-amber-700 dark:text-amber-300 border-amber-500/30'
                    : order.stage === 'WAITING'
                    ? 'bg-rose-500/15 text-rose-700 dark:text-rose-300 border-rose-500/40'
                    : order.stage === 'PACK'
                    ? 'bg-indigo-500/10 text-indigo-700 dark:text-indigo-300 border-indigo-500/30'
                    : order.stage === 'DISPATCH'
                    ? 'bg-sky-500/10 text-sky-700 dark:text-sky-300 border-sky-500/30'
                    : 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/30'
                }`}
              >
                {order.stage}
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Merchant: <strong className="text-navy-900 dark:text-white">{order.merchantName}</strong> · Placed: {order.createdAt}
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2 self-start sm:self-auto flex-wrap">
          <button
            type="button"
            onClick={() => setPreviewMemo(order)}
            className="px-3.5 py-2 rounded-xl bg-white dark:bg-navy-900 hover:bg-slate-50 dark:hover:bg-navy-800 border border-slate-200 dark:border-white/10 text-xs font-bold text-slate-700 dark:text-slate-200 flex items-center gap-1.5 shadow-xs transition-colors cursor-pointer"
          >
            <FileText className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
            <span>Preview Slip</span>
          </button>

          <button
            type="button"
            onClick={handlePrint}
            className="px-4 py-2 rounded-xl bg-orange-600 hover:bg-orange-700 text-white font-bold text-xs flex items-center gap-1.5 shadow-md shadow-orange-500/25 transition-all cursor-pointer active:scale-95"
          >
            <Printer className="w-4 h-4" />
            <span>Print 4x6&quot; Memo</span>
          </button>
        </div>
      </div>

      {/* 4 Summary Scorecards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Total COD Amount */}
        <div className="p-5 rounded-2xl bg-white dark:bg-navy-900 border border-slate-200 dark:border-white/10 shadow-lg">
          <div className="flex items-center justify-between text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
            <span>COD Total Amount</span>
            <Banknote className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
          </div>
          <div className="text-2xl sm:text-3xl font-black text-navy-900 dark:text-white mt-2 tabular-nums">
            ৳ {order.codAmount.toLocaleString()}
          </div>
          <span className="text-xs text-emerald-600 dark:text-emerald-400 font-semibold mt-1 inline-block">
            Cash on Delivery Collection
          </span>
        </div>

        {/* Card 2: Items In Order */}
        <div className="p-5 rounded-2xl bg-white dark:bg-navy-900 border border-slate-200 dark:border-white/10 shadow-lg">
          <div className="flex items-center justify-between text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
            <span>Items &amp; Quantity</span>
            <Package className="w-4 h-4 text-orange-600 dark:text-orange-400" />
          </div>
          <div className="text-2xl sm:text-3xl font-black text-navy-900 dark:text-white mt-2 tabular-nums">
            {totalItemCount} Unit{totalItemCount > 1 ? 's' : ''}
          </div>
          <span className="text-xs text-slate-500 dark:text-slate-400 font-medium mt-1 inline-block">
            {items.length} Product SKU{items.length > 1 ? 's' : ''} in package
          </span>
        </div>

        {/* Card 3: Assigned Courier */}
        <div className="p-5 rounded-2xl bg-white dark:bg-navy-900 border border-slate-200 dark:border-white/10 shadow-lg">
          <div className="flex items-center justify-between text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
            <span>Courier Partner</span>
            <Truck className="w-4 h-4 text-sky-600 dark:text-sky-400" />
          </div>
          <div className="text-xl sm:text-2xl font-black text-navy-900 dark:text-white mt-2">
            {order.courier}
          </div>
          <span className="text-xs font-mono text-amber-600 dark:text-amber-400 font-bold mt-1 inline-block truncate max-w-full">
            {order.trackingCode || 'Pending Tracking ID'}
          </span>
        </div>

        {/* Card 4: Destination */}
        <div className="p-5 rounded-2xl bg-white dark:bg-navy-900 border border-slate-200 dark:border-white/10 shadow-lg">
          <div className="flex items-center justify-between text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
            <span>Destination City</span>
            <MapPin className="w-4 h-4 text-purple-600 dark:text-purple-400" />
          </div>
          <div className="text-xl sm:text-2xl font-black text-navy-900 dark:text-white mt-2 truncate">
            {order.city || 'Dhaka'}
          </div>
          <span className="text-xs text-slate-500 dark:text-slate-400 font-medium mt-1 inline-block">
            Doorstep Courier Delivery
          </span>
        </div>
      </div>

      {/* Products Table (All Items inside this Order) */}
      <div className="p-6 rounded-2xl bg-white dark:bg-navy-900 border border-slate-200 dark:border-white/10 shadow-lg space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-white/10">
          <div className="flex items-center gap-2">
            <Package className="w-5 h-5 text-orange-600 dark:text-orange-400" />
            <h2 className="font-bold text-base text-navy-900 dark:text-white">
              Order Items &amp; Bin Locations ({items.length} Product{items.length > 1 ? 's' : ''})
            </h2>
          </div>
          <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
            Total Qty: {totalItemCount}
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs sm:text-sm">
            <thead className="bg-slate-50 dark:bg-navy-950 text-slate-500 dark:text-slate-400 uppercase text-[11px] font-bold border-b border-slate-200 dark:border-white/10">
              <tr>
                <th className="py-3 px-4">Product Details</th>
                <th className="py-3 px-4">Variant &amp; SKU</th>
                <th className="py-3 px-4">Warehouse Bin</th>
                <th className="py-3 px-4 text-center">Quantity</th>
                <th className="py-3 px-4 text-right">Unit Price</th>
                <th className="py-3 px-4 text-right">Subtotal</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-white/5">
              {items.map((item, idx) => (
                <tr key={idx} className="hover:bg-slate-50/50 dark:hover:bg-navy-800/40">
                  <td className="py-3.5 px-4">
                    <div className="flex items-center gap-3">
                      <img
                        src={item.image}
                        alt={item.title}
                        className="h-11 w-11 rounded-xl object-cover border border-slate-200 dark:border-white/10 shrink-0"
                      />
                      <div>
                        <span className="font-bold text-navy-900 dark:text-white block">
                          {item.title}
                        </span>
                        <span className="text-xs text-slate-500 dark:text-slate-400">
                          {order.merchantName}
                        </span>
                      </div>
                    </div>
                  </td>
                  <td className="py-3.5 px-4">
                    <div className="space-y-1">
                      <span className="px-2 py-0.5 rounded bg-slate-100 dark:bg-navy-800 border border-slate-200 dark:border-white/10 text-xs font-semibold text-navy-900 dark:text-white">
                        {item.color} · {item.size}
                      </span>
                      <div className="font-mono text-xs text-orange-600 dark:text-orange-400 font-bold">
                        {item.sku}
                      </div>
                    </div>
                  </td>
                  <td className="py-3.5 px-4">
                    <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30 text-xs font-bold font-mono">
                      <MapPin className="w-3.5 h-3.5 shrink-0" />
                      <span>{item.bin}</span>
                    </div>
                  </td>
                  <td className="py-3.5 px-4 text-center">
                    <span className="px-2.5 py-1 rounded-full bg-slate-100 dark:bg-navy-800 font-extrabold tabular-nums">
                      {item.qty}
                    </span>
                  </td>
                  <td className="py-3.5 px-4 text-right font-medium tabular-nums">
                    ৳ {item.unitPrice.toLocaleString()}
                  </td>
                  <td className="py-3.5 px-4 text-right font-black tabular-nums text-navy-900 dark:text-white">
                    ৳ {(item.unitPrice * item.qty).toLocaleString()}
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot className="border-t-2 border-slate-200 dark:border-white/10 bg-slate-50/50 dark:bg-navy-950/50 font-bold">
              <tr>
                <td colSpan={4} className="py-3 px-4 text-slate-700 dark:text-slate-200">
                  Total Order Amount (COD)
                </td>
                <td colSpan={2} className="py-3 px-4 text-right text-base text-emerald-600 dark:text-emerald-400 font-black">
                  ৳ {order.codAmount.toLocaleString()}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>

      {/* Bottom 2 Columns: Customer & Shipping Details + Memo Branding */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Customer & Delivery Address Card */}
        <div className="p-6 rounded-2xl bg-white dark:bg-navy-900 border border-slate-200 dark:border-white/10 shadow-lg space-y-4">
          <div className="flex items-center gap-2 pb-3 border-b border-slate-100 dark:border-white/10">
            <User className="w-5 h-5 text-orange-600 dark:text-orange-400" />
            <h2 className="font-bold text-base text-navy-900 dark:text-white">
              Customer &amp; Delivery Address
            </h2>
          </div>

          <div className="space-y-3 text-xs sm:text-sm">
            <div className="flex items-start gap-3">
              <span className="text-slate-400 w-24 shrink-0 font-medium">Customer:</span>
              <span className="font-bold text-navy-900 dark:text-white">{order.customerName}</span>
            </div>

            <div className="flex items-start gap-3">
              <span className="text-slate-400 w-24 shrink-0 font-medium">Phone:</span>
              <span className="font-mono font-bold text-navy-900 dark:text-white">{order.customerPhone}</span>
            </div>

            <div className="flex items-start gap-3">
              <span className="text-slate-400 w-24 shrink-0 font-medium">Address:</span>
              <span className="text-slate-700 dark:text-slate-200 leading-relaxed">
                {order.customerAddress || `${order.city}, Bangladesh`}
              </span>
            </div>

            <div className="flex items-start gap-3">
              <span className="text-slate-400 w-24 shrink-0 font-medium">District / City:</span>
              <span className="font-bold text-navy-900 dark:text-white">{order.city}</span>
            </div>
          </div>

          {/* Reseller Attribution */}
          <div className="pt-3 border-t border-slate-100 dark:border-white/10 space-y-2">
            <span className="text-[11px] uppercase font-bold text-slate-400 tracking-wider block">
              Store / Reseller Attribution
            </span>
            <div className="p-3 rounded-xl bg-slate-50 dark:bg-navy-950 border border-slate-200/80 dark:border-white/10 space-y-1 text-xs">
              <div className="font-bold text-navy-900 dark:text-white">{order.resellerName}</div>
              <div className="text-slate-500 dark:text-slate-400 font-mono">{order.resellerPhone}</div>
              <div className="text-[11px] text-slate-500 dark:text-slate-400">{order.resellerAddress}</div>
            </div>
          </div>
        </div>

        {/* Memo & Invoicing Template Card */}
        <div className="p-6 rounded-2xl bg-white dark:bg-navy-900 border border-slate-200 dark:border-white/10 shadow-lg space-y-4">
          <div className="flex items-center gap-2 pb-3 border-b border-slate-100 dark:border-white/10">
            <Layers className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
            <h2 className="font-bold text-base text-navy-900 dark:text-white">
              Memo Invoice &amp; Courier Logistics
            </h2>
          </div>

          <div className="space-y-3 text-xs sm:text-sm">
            <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-navy-950 border border-slate-200/80 dark:border-white/10">
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">
                  Memo Code
                </span>
                <span className="font-mono font-black text-indigo-600 dark:text-indigo-400 text-sm">
                  {order.memoCode}
                </span>
              </div>
              <button
                type="button"
                onClick={() => setPreviewMemo(order)}
                className="px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-sm cursor-pointer"
              >
                View 4x6&quot; Layout
              </button>
            </div>

            <div className="flex items-start gap-3">
              <span className="text-slate-400 w-28 shrink-0 font-medium">Assigned Courier:</span>
              <span className="font-bold text-navy-900 dark:text-white">{order.courier}</span>
            </div>

            <div className="flex items-start gap-3">
              <span className="text-slate-400 w-28 shrink-0 font-medium">Tracking Code:</span>
              <span className="font-mono font-bold text-amber-600 dark:text-amber-400">
                {order.trackingCode || 'Unassigned (Will generate on dispatch)'}
              </span>
            </div>

            <div className="flex items-start gap-3">
              <span className="text-slate-400 w-28 shrink-0 font-medium">Fulfillment Type:</span>
              <span className="text-emerald-600 dark:text-emerald-400 font-bold flex items-center gap-1">
                <ShieldCheck className="w-4 h-4" />
                Atomic FOR UPDATE WMS Reserved
              </span>
            </div>
          </div>

          <div className="pt-3 border-t border-slate-100 dark:border-white/10 flex items-center justify-between text-xs">
            <span className="text-slate-400">Ready for packing station printer</span>
            <button
              type="button"
              onClick={handlePrint}
              className="text-orange-600 dark:text-orange-400 font-bold hover:underline"
            >
              Print Memo Now →
            </button>
          </div>
        </div>
      </div>

      {/* Modals */}
      <MemoPreviewModal
        isOpen={!!previewMemo}
        order={previewMemo}
        onClose={() => setPreviewMemo(null)}
        onPrint={() => {
          setPreviewMemo(null);
          handlePrint();
        }}
      />

      <IsolatedPrintPortal
        printMode={isPrinting ? 'MEMOS' : null}
        orders={[order]}
      />
    </div>
  );
}
