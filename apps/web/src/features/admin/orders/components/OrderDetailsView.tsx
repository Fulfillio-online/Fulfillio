'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
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
  ChevronDown,
  ChevronUp,
  Copy,
  Check,
  ExternalLink,
  PhoneCall,
  CreditCard,
  AlertCircle,
  MoreVertical,
  CheckCheck,
} from 'lucide-react';
import {
  CourierPartner,
  OrderStage,
  WarehousePipelineOrder,
  OrderItem,
} from '../types';
import { INITIAL_PIPELINE_ORDERS, STORAGE_KEY_ORDERS } from '../mockData';
import { MemoPreviewModal } from './modals/MemoPreviewModal';
import { IsolatedPrintPortal } from './print/IsolatedPrintPortal';
import { FraudRatioBadge } from '@/components/ui/FraudRatioBadge';
import {
  getStoredMerchantOrdersForCode,
  convertMerchantOrderToWarehouse,
  getStoredMerchantProductsForCode,
  getStoredMerchantMemosForCode,
  getStoredMerchantProfileForCode,
} from '@/lib/warehouseSync';

interface OrderDetailsViewProps {
  orderId: string;
}

export function OrderDetailsView({ orderId }: OrderDetailsViewProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const fromAllOrders = searchParams.get('from') === 'all';
  const backHref = fromAllOrders ? '/admin/orders/all' : '/admin/orders';
  const backLabel = fromAllOrders ? 'All Orders' : 'Order Pipeline';
  const [order, setOrder] = useState<WarehousePipelineOrder | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [previewMemo, setPreviewMemo] = useState<WarehousePipelineOrder | null>(null);
  const [isPrinting, setIsPrinting] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState(false);
  const [copiedTracking, setCopiedTracking] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isTimelineMobileExpanded, setIsTimelineMobileExpanded] = useState(false);

  useEffect(() => {
    try {
      const decodedId = decodeURIComponent(orderId).trim();
      const cleanId = decodedId.replace(/^#/, '').toLowerCase();

      // 1. Try to load from Admin Storage
      const stored = localStorage.getItem(STORAGE_KEY_ORDERS);
      let list = INITIAL_PIPELINE_ORDERS;
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) {
          list = parsed;
        }
      }

      let found = list.find(
        (o) =>
          o.id.toLowerCase() === cleanId ||
          o.id.replace(/^#/, '').toLowerCase() === cleanId ||
          o.id === decodedId
      );

      // 2. Always cross-reference Merchant Orders to ensure multi-item/multi-variant integrity
      const merchantCodes = ['MC-101', 'MC-102', 'MC-103', 'MC-104', 'MC-107'];
      for (const code of merchantCodes) {
        const merchantOrders = getStoredMerchantOrdersForCode(code);
        const matchedMerchantOrder = merchantOrders.find(
          (mo) =>
            mo.id.toLowerCase() === cleanId ||
            (mo.orderNumber && mo.orderNumber.replace(/^#/, '').toLowerCase() === cleanId)
        );

        if (matchedMerchantOrder) {
          const mProds = getStoredMerchantProductsForCode(code);
          const mProf = getStoredMerchantProfileForCode(code);
          const mMemos = getStoredMerchantMemosForCode(code, mProf);
          const converted = convertMerchantOrderToWarehouse(
            matchedMerchantOrder,
            mProds,
            mMemos,
            mProf
          );

          if (found) {
            // If merchant order has lineItems or distinct items, overwrite items array
            found = {
              ...found,
              productTitle: converted.productTitle,
              items:
                converted.items && converted.items.length > 0
                  ? converted.items
                  : found.items,
              subtotal: matchedMerchantOrder.subtotal ?? converted.subtotal ?? found.subtotal,
              deliveryFee: matchedMerchantOrder.deliveryFee ?? converted.deliveryFee ?? found.deliveryFee,
              discount: matchedMerchantOrder.discount ?? converted.discount ?? found.discount,
              advancePayment: matchedMerchantOrder.advancePayment ?? converted.advancePayment ?? found.advancePayment,
              paymentStatus: matchedMerchantOrder.paymentStatus ?? converted.paymentStatus ?? found.paymentStatus,
            };
          } else {
            found = converted;
          }
          break;
        }
      }

      // Fallback for default demo orders like ORD-9824 and ORD-9825 if loaded from stale cache
      if (found) {
        const upperId = (found.id || '').replace(/^#/, '').toUpperCase();
        if (upperId === 'ORD-9824' && (!found.items || found.items.length <= 1)) {
          found = {
            ...found,
            productTitle: 'Drop-Shoulder Heavyweight Fleece Hoodie',
            qty: 2,
            items: [
              {
                sku: 'MC-101-HEAVY-HOOD-BLK-L',
                title: 'Drop-Shoulder Heavyweight Fleece Hoodie',
                image: found.productImage || 'https://images.unsplash.com/photo-1556905055-8f358a7a47b2?auto=format&fit=crop&w=300&q=80',
                color: 'Obsidian Black',
                size: 'L',
                qty: 1,
                unitPrice: 850,
                bin: 'A-01-02',
              },
              {
                sku: 'MC-101-HEAVY-HOOD-BEI-M',
                title: 'Drop-Shoulder Heavyweight Fleece Hoodie',
                image: found.productImage || 'https://images.unsplash.com/photo-1556905055-8f358a7a47b2?auto=format&fit=crop&w=300&q=80',
                color: 'Warm Beige',
                size: 'M',
                qty: 1,
                unitPrice: 800,
                bin: 'A-01-03',
              },
            ],
          };
        } else if (upperId === 'ORD-9825' && (!found.items || found.items.length <= 1)) {
          found = {
            ...found,
            productTitle: 'Raw Selvedge Denim Jacket',
            qty: 2,
            items: [
              {
                sku: 'MC-101-JKT-RAW-L',
                title: 'Raw Selvedge Denim Jacket',
                image: found.productImage || 'https://images.unsplash.com/photo-1576995853123-5a10305d93c0?auto=format&fit=crop&w=300&q=80',
                color: 'Indigo',
                size: 'L',
                qty: 1,
                unitPrice: 1950,
                bin: 'A-01-04',
              },
              {
                sku: 'MC-101-CAP-STR-BLK',
                title: 'Embroidered Streetwear Cap',
                image: 'https://images.unsplash.com/photo-1588850561407-ed78c282e89b?auto=format&fit=crop&w=300&q=80',
                color: 'Black',
                size: 'Free Size',
                qty: 1,
                unitPrice: 500,
                bin: 'B-02-01',
              },
            ],
          };
        }
      }

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

  const handleCopyId = () => {
    if (!order || typeof navigator === 'undefined') return;
    navigator.clipboard.writeText(order.id);
    setCopiedId(true);
    showToast(`Order ID ${order.id} copied to clipboard!`);
    setTimeout(() => setCopiedId(false), 2000);
  };

  const handleCopyTracking = (code: string) => {
    if (typeof navigator === 'undefined') return;
    navigator.clipboard.writeText(code);
    setCopiedTracking(true);
    showToast(`Tracking Code ${code} copied!`);
    setTimeout(() => setCopiedTracking(false), 2000);
  };

  const handleUpdateStage = (newStage: OrderStage) => {
    if (!order) return;
    const updated: WarehousePipelineOrder = {
      ...order,
      stage: newStage,
      handedOverAt: newStage === 'HANDED_OVER' ? new Date().toLocaleString() : order.handedOverAt,
    };
    setOrder(updated);

    try {
      const stored = localStorage.getItem(STORAGE_KEY_ORDERS);
      if (stored) {
        const list: WarehousePipelineOrder[] = JSON.parse(stored);
        const next = list.map((o) => (o.id === order.id ? updated : o));
        localStorage.setItem(STORAGE_KEY_ORDERS, JSON.stringify(next));
      }
      window.dispatchEvent(
        new CustomEvent('fulfillio-warehouse-sync', { detail: { source: 'AdminOrderStage' } })
      );
    } catch {}

    showToast(`Order ${order.id} stage advanced to ${newStage}.`);
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
          href={backHref}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-orange-600 text-white font-bold text-xs"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Return to {backLabel}</span>
        </Link>
      </div>
    );
  }

  // Multi-item / Multi-variant resolution:
  // Clean every variant's title - NEVER display "(+1 more)" or "+ 1 more"
  const rawLineItems: OrderItem[] =
    order.items && order.items.length > 0
      ? order.items
      : [
          {
            sku: order.sku,
            title: order.productTitle,
            image: order.productImage,
            color: order.color || 'Standard',
            size: order.size || 'L',
            qty: order.qty || 1,
            unitPrice: Math.round(order.codAmount / (order.qty || 1)),
            bin: order.bin || 'A-01-02',
          },
        ];

  const lineItems: OrderItem[] = rawLineItems.map((item) => ({
    ...item,
    title: (item.title || 'Warehouse Order Item')
      .replace(/\s*\(\+\d+\s*more\)/gi, '')
      .replace(/\s*\+\s*\d+\s*more/gi, '')
      .trim(),
  }));

  const totalItemCount = lineItems.reduce((acc, curr) => acc + curr.qty, 0);

  // Financial calculations
  const subtotal =
    order.subtotal ?? lineItems.reduce((acc, it) => acc + it.unitPrice * it.qty, 0);
  const deliveryFee = order.deliveryFee ?? 80;
  const discount = order.discount ?? 0;
  const advancePayment = order.advancePayment ?? 0;
  const orderTotal = order.codAmount ?? Math.max(0, subtotal + deliveryFee - discount);
  const codAmount = order.codAmount ?? Math.max(0, orderTotal - (order.advancePayment || 0));

  // Customer initials
  const customerInitials =
    order.customerName
      ? order.customerName
          .split(' ')
          .map((n) => n[0])
          .slice(0, 2)
          .join('')
          .toUpperCase()
      : 'CU';

  // Tracking code
  const trackingCode = order.trackingCode || `TRK-${order.courier.slice(0, 3).toUpperCase()}-${order.id.slice(-4)}`;

  // Stage Badge style
  const getStageBadge = (stage: OrderStage) => {
    switch (stage) {
      case 'HANDED_OVER':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
            Handed Over
          </span>
        );
      case 'DISPATCH':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-sky-500/10 text-sky-600 dark:text-sky-400 border border-sky-500/30">
            <span className="h-1.5 w-1.5 rounded-full bg-sky-500 animate-pulse" />
            Dispatch Ready
          </span>
        );
      case 'PACK':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/30">
            <span className="h-1.5 w-1.5 rounded-full bg-indigo-500 animate-pulse" />
            Packing Station
          </span>
        );
      case 'WAITING':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/30">
            <span className="h-1.5 w-1.5 rounded-full bg-rose-500" />
            On Hold / Waiting
          </span>
        );
      case 'CANCELLED':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/30">
            <span className="h-1.5 w-1.5 rounded-full bg-rose-500" />
            Cancelled
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/30">
            <span className="h-1.5 w-1.5 rounded-full bg-amber-500 animate-pulse" />
            Picking Bay (WMS)
          </span>
        );
    }
  };

  // Payment Badge style
  const getPaymentBadge = () => {
    const status = order.paymentStatus || (advancePayment >= orderTotal ? 'Paid' : advancePayment > 0 ? 'Partial' : 'Unpaid');
    switch (status) {
      case 'Paid':
        return (
          <span className="px-2.5 py-1 rounded-lg text-xs font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 flex items-center gap-1">
            <CheckCircle2 className="h-3.5 w-3.5" />
            Paid (100%)
          </span>
        );
      case 'Partial':
        return (
          <span className="px-2.5 py-1 rounded-lg text-xs font-bold bg-sky-500/10 text-sky-600 dark:text-sky-400 border border-sky-500/30 flex items-center gap-1">
            <AlertCircle className="h-3.5 w-3.5" />
            Partial (Adv: ৳{advancePayment.toLocaleString()})
          </span>
        );
      default:
        return (
          <span className="px-2.5 py-1 rounded-lg text-xs font-bold bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/30 flex items-center gap-1">
            <AlertCircle className="h-3.5 w-3.5" />
            Unpaid (COD Due)
          </span>
        );
    }
  };

  // Timeline events
  const timelineEvents = [
    {
      title: 'Order Confirmed & Stock Reserved',
      description: `Stock deducted with FOR UPDATE lock for ${order.merchantName}.`,
      timestamp: `${order.createdAt}`,
      isCompleted: true,
    },
    {
      title: 'Pick List Assigned to Floor Picker',
      description: `Bin locations mapped: ${Array.from(new Set(lineItems.map((i) => i.bin))).join(', ')}.`,
      timestamp: 'Today, 11:00 AM',
      isCompleted: order.stage !== 'PICK' && order.stage !== 'WAITING',
    },
    {
      title: 'Packing Station Verification',
      description: 'Thermal 4x6" shipping memo verified and barcode scanned.',
      timestamp: 'Today, 01:30 PM',
      isCompleted:
        order.stage === 'DISPATCH' || order.stage === 'HANDED_OVER' || Boolean(order.isMemoPrinted),
    },
    {
      title: 'Courier Booked & Manifest Generated',
      description: `${order.courier} consignment created with tracking ${trackingCode}.`,
      timestamp: 'Today, 03:45 PM',
      isCompleted: order.stage === 'DISPATCH' || order.stage === 'HANDED_OVER',
    },
    {
      title: 'Courier Handover Completed',
      description: 'Parcel handed over to carrier dispatch rider for door delivery.',
      timestamp: order.handedOverAt || 'Pending handover',
      isCompleted: order.stage === 'HANDED_OVER',
    },
  ];

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-16">
      {toast && (
        <div className="fixed top-6 right-6 z-50 bg-orange-600 text-white px-4 py-3 rounded-xl shadow-2xl flex items-center gap-2 text-xs font-bold animate-in fade-in">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>{toast}</span>
        </div>
      )}

      {/* Top Breadcrumb Nav */}
      <nav className="flex items-center gap-2 text-xs text-slate-500">
        <Link href="/admin" className="hover:text-orange-600 transition-colors">
          Overview
        </Link>
        <span>&gt;</span>
        <Link href={backHref} className="hover:text-orange-600 transition-colors">
          {backLabel}
        </Link>
        <span>&gt;</span>
        <span className="text-navy-900 dark:text-slate-200 font-mono font-bold">
          {order.id}
        </span>
      </nav>

      {/* Header Bar */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white dark:bg-navy-900/80 p-4 sm:p-5 rounded-2xl border border-slate-200/80 dark:border-white/10 shadow-sm">
        <div>
          <div className="flex items-center gap-3 flex-wrap">
            <button
              type="button"
              onClick={() => router.push(backHref)}
              className="p-1.5 hover:bg-slate-100 dark:hover:bg-navy-800 rounded-lg text-slate-500 dark:text-slate-400 hover:text-navy-900 dark:hover:text-white transition-colors cursor-pointer"
              title={`Back to ${backLabel}`}
            >
              <ArrowLeft className="h-5 w-5" />
            </button>
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-navy-900 dark:text-white flex items-center gap-2.5">
              <span>Order</span>
              <span className="font-mono text-emerald-600 dark:text-emerald-400">{order.id}</span>
            </h1>
            {getStageBadge(order.stage)}
          </div>

          <div className="flex items-center gap-2.5 sm:gap-3 text-xs text-slate-500 dark:text-slate-400 mt-2 pl-9 flex-wrap">
            <span>{order.createdAt}</span>
            <span>•</span>
            <button
              type="button"
              onClick={handleCopyId}
              className="inline-flex items-center gap-1 hover:text-orange-600 dark:hover:text-orange-400 transition-colors font-mono cursor-pointer"
            >
              {copiedId ? (
                <Check className="h-3 w-3 text-emerald-500" />
              ) : (
                <Copy className="h-3 w-3" />
              )}
              <span>{copiedId ? 'Copied' : 'Copy ID'}</span>
            </button>
            <span>•</span>
            <span className="font-semibold text-navy-900 dark:text-slate-200">
              Merchant: <strong className="text-orange-600 dark:text-orange-400">{order.merchantName}</strong> ({order.merchantCode})
            </span>
            {order.memoCode && (
              <>
                <span>•</span>
                <span className="px-2 py-0.5 rounded bg-indigo-50 dark:bg-indigo-950/80 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800/60 font-mono text-[11px] font-bold">
                  Memo: {order.memoCode}
                </span>
              </>
            )}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2.5 w-full md:w-auto justify-end flex-wrap">
          {/* Stage Progression Action */}
          {order.stage === 'PICK' && (
            <button
              type="button"
              onClick={() => handleUpdateStage('PACK')}
              className="px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs flex items-center gap-1.5 shadow-md shadow-indigo-500/20 transition-all cursor-pointer"
            >
              <Boxes className="w-4 h-4" />
              <span>Advance to Pack</span>
            </button>
          )}

          {order.stage === 'PACK' && (
            <button
              type="button"
              onClick={() => handleUpdateStage('DISPATCH')}
              className="px-3.5 py-2 rounded-xl bg-sky-600 hover:bg-sky-500 text-white font-bold text-xs flex items-center gap-1.5 shadow-md shadow-sky-500/20 transition-all cursor-pointer"
            >
              <Truck className="w-4 h-4" />
              <span>Advance to Dispatch</span>
            </button>
          )}

          {order.stage === 'DISPATCH' && (
            <button
              type="button"
              onClick={() => handleUpdateStage('HANDED_OVER')}
              className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center gap-1.5 shadow-md shadow-emerald-500/20 transition-all cursor-pointer"
            >
              <CheckCheck className="w-4 h-4" />
              <span>Mark Handed Over</span>
            </button>
          )}

          <button
            type="button"
            onClick={() => setPreviewMemo(order)}
            className="px-3.5 py-2 rounded-xl bg-slate-100 dark:bg-navy-800 hover:bg-slate-200 dark:hover:bg-navy-700 border border-slate-200 dark:border-white/10 text-xs font-semibold text-navy-900 dark:text-slate-200 flex items-center gap-1.5 shadow-xs transition-colors cursor-pointer min-h-[38px]"
          >
            <FileText className="w-4 h-4 text-indigo-500" />
            <span>Preview Slip</span>
          </button>

          <button
            type="button"
            onClick={handlePrint}
            className="px-4 py-2 rounded-xl bg-orange-600 hover:bg-orange-500 text-white font-bold text-xs flex items-center gap-1.5 shadow-md shadow-orange-500/20 transition-all cursor-pointer active:scale-95 min-h-[38px]"
          >
            <Printer className="w-4 h-4" />
            <span>Print 4x6&quot; Memo</span>
          </button>

          {/* 3-dots dropdown */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
              className="p-2 rounded-xl border border-slate-200 dark:border-white/10 text-slate-500 hover:text-navy-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-navy-800 transition-colors cursor-pointer min-h-[38px] min-w-[38px] flex items-center justify-center"
              title="More actions"
            >
              <MoreVertical className="h-4 w-4" />
            </button>

            {isDropdownOpen && (
              <>
                <div className="fixed inset-0 z-20" onClick={() => setIsDropdownOpen(false)} />
                <div className="absolute right-0 mt-2 w-56 rounded-xl bg-white dark:bg-navy-900 border border-slate-200/80 dark:border-white/10 p-1.5 shadow-2xl z-30 text-xs space-y-1 animate-in fade-in zoom-in-95 duration-100">
                  <button
                    type="button"
                    onClick={() => {
                      setIsDropdownOpen(false);
                      handleCopyId();
                    }}
                    className="w-full flex items-center gap-2.5 px-3 py-2 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-navy-800 rounded-lg transition-colors text-left cursor-pointer"
                  >
                    <Copy className="h-3.5 w-3.5 text-slate-400" />
                    <span>Copy Order ID</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setIsDropdownOpen(false);
                      handleCopyTracking(trackingCode);
                    }}
                    className="w-full flex items-center gap-2.5 px-3 py-2 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-navy-800 rounded-lg transition-colors text-left cursor-pointer"
                  >
                    <Truck className="h-3.5 w-3.5 text-sky-500" />
                    <span>Copy Tracking Code</span>
                  </button>

                  {order.stage !== 'WAITING' && (
                    <button
                      type="button"
                      onClick={() => {
                        setIsDropdownOpen(false);
                        handleUpdateStage('WAITING');
                      }}
                      className="w-full flex items-center gap-2.5 px-3 py-2 text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-950/30 rounded-lg transition-colors text-left cursor-pointer"
                    >
                      <AlertTriangle className="h-3.5 w-3.5" />
                      <span>Put On Hold / Waiting</span>
                    </button>
                  )}

                  {order.stage !== 'PICK' && (
                    <button
                      type="button"
                      onClick={() => {
                        setIsDropdownOpen(false);
                        handleUpdateStage('PICK');
                      }}
                      className="w-full flex items-center gap-2.5 px-3 py-2 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-navy-800 rounded-lg transition-colors text-left cursor-pointer"
                    >
                      <RotateCcw className="h-3.5 w-3.5" />
                      <span>Re-route to Picking Bay</span>
                    </button>
                  )}
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* 4 Summary Scorecards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Total COD Amount */}
        <div className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-navy-900 border border-slate-200/80 dark:border-white/10 shadow-xs">
          <div className="flex items-center justify-between text-xs font-bold text-slate-500 uppercase tracking-wider">
            <span>COD Total Amount</span>
            <Banknote className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
          </div>
          <div className="text-2xl sm:text-3xl font-black text-navy-900 dark:text-white mt-2 tabular-nums">
            ৳ {codAmount.toLocaleString()}
          </div>
          <span className="text-xs text-emerald-600 dark:text-emerald-400 font-semibold mt-1 inline-block">
            Cash on Delivery Collection
          </span>
        </div>

        {/* Card 2: Items In Order */}
        <div className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-navy-900 border border-slate-200/80 dark:border-white/10 shadow-xs">
          <div className="flex items-center justify-between text-xs font-bold text-slate-500 uppercase tracking-wider">
            <span>Items &amp; Variants</span>
            <Package className="w-4 h-4 text-orange-600 dark:text-orange-400" />
          </div>
          <div className="text-2xl sm:text-3xl font-black text-navy-900 dark:text-white mt-2 tabular-nums">
            {totalItemCount} Unit{totalItemCount > 1 ? 's' : ''}
          </div>
          <span className="text-xs text-slate-500 dark:text-slate-400 font-medium mt-1 inline-block">
            {lineItems.length} Product Variant{lineItems.length > 1 ? 's' : ''} in package
          </span>
        </div>

        {/* Card 3: Assigned Courier */}
        <div className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-navy-900 border border-slate-200/80 dark:border-white/10 shadow-xs">
          <div className="flex items-center justify-between text-xs font-bold text-slate-500 uppercase tracking-wider">
            <span>Courier Partner</span>
            <Truck className="w-4 h-4 text-sky-600 dark:text-sky-400" />
          </div>
          <div className="text-xl sm:text-2xl font-black text-navy-900 dark:text-white mt-2">
            {order.courier}
          </div>
          <span className="text-xs font-mono text-amber-600 dark:text-amber-400 font-bold mt-1 inline-block truncate max-w-full">
            {trackingCode}
          </span>
        </div>

        {/* Card 4: Destination */}
        <div className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-navy-900 border border-slate-200/80 dark:border-white/10 shadow-xs">
          <div className="flex items-center justify-between text-xs font-bold text-slate-500 uppercase tracking-wider">
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

      {/* Main Two-Column Layout (Merchant Order Details Style) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column (2 Cols on lg): Items Card + Payment Card + Timeline Card */}
        <div className="lg:col-span-2 space-y-6">
          {/* Card 1: Order Items & Variants (Merchant OrderItemsCard Style) */}
          <div className="rounded-2xl border border-slate-200/80 dark:border-white/10 bg-white dark:bg-navy-900 overflow-hidden shadow-sm">
            {/* Header */}
            <div className="p-4 sm:p-5 border-b border-slate-200/80 dark:border-white/10 flex justify-between items-center">
              <div className="flex items-center gap-2.5">
                <div className="h-8 w-8 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
                  <Package className="h-4 w-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-navy-900 dark:text-white">
                    Order Items &amp; Variants
                  </h3>
                  <p className="text-xs text-slate-400">
                    {lineItems.length} product variant{lineItems.length !== 1 ? 's' : ''} in this package
                  </p>
                </div>
              </div>

              <span className="text-xs px-2.5 py-1 rounded-full bg-slate-100 dark:bg-navy-800 text-slate-700 dark:text-slate-300 font-semibold border border-slate-200 dark:border-white/10">
                {totalItemCount} item{totalItemCount !== 1 ? 's' : ''}
              </span>
            </div>

            {/* Items List */}
            <div className="p-4 sm:p-5 divide-y divide-slate-100 dark:divide-white/5">
              {lineItems.map((item, idx) => (
                <div
                  key={`${item.sku}-${idx}`}
                  className="py-4 first:pt-0 last:pb-0 flex items-center justify-between gap-3 sm:gap-4"
                >
                  <div className="flex items-center gap-3.5 min-w-0">
                    {/* Thumbnail */}
                    <img
                      src={
                        item.image ||
                        'https://images.unsplash.com/photo-1556905055-8f358a7a47b2?auto=format&fit=crop&w=150&q=80'
                      }
                      alt={item.title}
                      className="h-13 w-13 sm:h-16 sm:w-16 rounded-xl object-cover bg-slate-100 dark:bg-navy-800 border border-slate-200/80 dark:border-white/10 shrink-0"
                    />

                    <div className="min-w-0 space-y-1">
                      <h4 className="text-xs sm:text-sm font-bold text-navy-900 dark:text-white truncate">
                        {item.title}
                      </h4>

                      {/* Variant and Bin Pill */}
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[11px] font-semibold bg-slate-100 dark:bg-navy-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-white/10">
                          <span className="h-2 w-2 rounded-full bg-orange-500 shrink-0" />
                          <span>
                            {item.color} · {item.size}
                          </span>
                        </span>

                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-mono font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                          <MapPin className="h-3 w-3" />
                          <span>Bin: {item.bin || 'A-01-02'}</span>
                        </span>
                      </div>

                      <p className="text-[10px] sm:text-[11px] font-mono text-slate-400">
                        SKU: <span className="font-semibold text-slate-600 dark:text-slate-300">{item.sku}</span>
                      </p>
                    </div>
                  </div>

                  {/* Quantity and Price */}
                  <div className="text-right shrink-0">
                    <div className="text-xs sm:text-sm font-bold text-navy-900 dark:text-white">
                      ৳{(item.unitPrice * item.qty).toLocaleString()}
                    </div>
                    <div className="text-[11px] text-slate-400 mt-0.5 font-mono">
                      ৳{item.unitPrice.toLocaleString()} × {item.qty}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Financial Breakdown Table (Exact Merchant OrderDetails style) */}
            <div className="p-4 sm:p-5 bg-slate-50 dark:bg-navy-950/70 border-t border-slate-200/80 dark:border-white/10 space-y-2.5 text-xs">
              <div className="flex justify-between text-slate-500 dark:text-slate-400">
                <span>Subtotal</span>
                <span className="font-semibold text-navy-900 dark:text-slate-200">
                  ৳{subtotal.toLocaleString()}
                </span>
              </div>

              <div className="flex justify-between text-slate-500 dark:text-slate-400">
                <span>Delivery Fee (Standard Courier)</span>
                <span className="font-semibold text-navy-900 dark:text-slate-200">
                  +৳{deliveryFee.toLocaleString()}
                </span>
              </div>

              {discount > 0 && (
                <div className="flex justify-between text-emerald-600 dark:text-emerald-400">
                  <span>Merchant Discount</span>
                  <span className="font-semibold">-৳{discount.toLocaleString()}</span>
                </div>
              )}

              {advancePayment > 0 && (
                <div className="flex justify-between text-sky-600 dark:text-sky-400">
                  <span>Advance Payment (Prepaid)</span>
                  <span className="font-semibold">-৳{advancePayment.toLocaleString()}</span>
                </div>
              )}

              <div className="pt-2.5 border-t border-slate-200 dark:border-white/10 flex justify-between items-center text-sm">
                <div>
                  <span className="font-bold text-navy-900 dark:text-white block">
                    Cash on Delivery (COD) Due
                  </span>
                  <span className="text-[11px] text-slate-400">
                    Amount rider will collect upon delivery
                  </span>
                </div>
                <span className="text-lg font-black text-emerald-600 dark:text-emerald-400 tabular-nums">
                  ৳{codAmount.toLocaleString()}
                </span>
              </div>
            </div>
          </div>

          {/* Card 2: Payment & Settlement Card (Exact Merchant OrderPaymentCard style) */}
          <div className="rounded-2xl border border-slate-200/80 dark:border-white/10 bg-white dark:bg-navy-900 p-5 shadow-sm space-y-4">
            <div className="flex items-center justify-between pb-3.5 border-b border-slate-200/80 dark:border-white/10">
              <div className="flex items-center gap-2.5">
                <div className="h-8 w-8 rounded-lg bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
                  <CreditCard className="h-4 w-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-navy-900 dark:text-white">
                    Payment &amp; Collection
                  </h3>
                  <p className="text-xs text-slate-400">Settlement terms and customer advance</p>
                </div>
              </div>

              {getPaymentBadge()}
            </div>

            <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-navy-950/70 border border-slate-200/80 dark:border-white/10 flex items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-2 text-navy-900 dark:text-slate-200 font-semibold">
                <Banknote className="h-4 w-4 text-emerald-500" />
                <span>Payment Method</span>
              </div>
              <span className="font-bold text-slate-700 dark:text-slate-300">
                Cash on Delivery (Courier COD)
              </span>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-navy-950/60 border border-slate-200/80 dark:border-white/10 space-y-0.5">
                <span className="text-[11px] text-slate-400">Advance Collected</span>
                <div className="font-bold text-navy-900 dark:text-white">
                  ৳{advancePayment.toLocaleString()}
                </div>
              </div>
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-navy-950/60 border border-slate-200/80 dark:border-white/10 space-y-0.5">
                <span className="text-[11px] text-slate-400">Balance on Delivery</span>
                <div className="font-bold text-emerald-600 dark:text-emerald-400">
                  ৳{codAmount.toLocaleString()}
                </div>
              </div>
            </div>
          </div>

          {/* Card 3: Fulfillment & Warehouse Timeline (Exact Merchant OrderTimelineCard style) */}
          <div className="rounded-2xl border border-slate-200/80 dark:border-white/10 bg-white dark:bg-navy-900 p-5 shadow-sm space-y-4">
            <div className="flex items-center justify-between pb-3.5 border-b border-slate-200/80 dark:border-white/10">
              <div className="flex items-center gap-2.5">
                <div className="h-8 w-8 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
                  <Clock className="h-4 w-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-navy-900 dark:text-white">
                    Fulfillment Timeline
                  </h3>
                  <p className="text-xs text-slate-400">Warehouse intake and courier milestones</p>
                </div>
              </div>

              {/* Mobile toggle */}
              <button
                type="button"
                onClick={() => setIsTimelineMobileExpanded(!isTimelineMobileExpanded)}
                className="lg:hidden inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-navy-800 text-slate-700 dark:text-slate-300 text-xs font-semibold cursor-pointer"
              >
                <span>{isTimelineMobileExpanded ? 'Collapse' : 'View Full History'}</span>
                {isTimelineMobileExpanded ? (
                  <ChevronUp className="h-3.5 w-3.5" />
                ) : (
                  <ChevronDown className="h-3.5 w-3.5" />
                )}
              </button>
            </div>

            <div
              className={`space-y-4 pt-2 ${
                isTimelineMobileExpanded ? 'block' : 'hidden lg:block'
              }`}
            >
              {timelineEvents.map((evt, idx) => (
                <div key={idx} className="flex items-start gap-3.5 relative">
                  {idx < timelineEvents.length - 1 && (
                    <div
                      className={`absolute left-3.5 top-7 bottom-0 w-0.5 -ml-px ${
                        evt.isCompleted
                          ? 'bg-emerald-500'
                          : 'bg-slate-200 dark:bg-white/10'
                      }`}
                    />
                  )}

                  <div
                    className={`h-7 w-7 rounded-full flex items-center justify-center shrink-0 z-10 ${
                      evt.isCompleted
                        ? 'bg-emerald-500 text-white shadow-xs'
                        : 'bg-slate-100 dark:bg-navy-800 text-slate-400 border border-slate-200 dark:border-white/10'
                    }`}
                  >
                    {evt.isCompleted ? (
                      <Check className="h-4 w-4" />
                    ) : (
                      <span className="h-2 w-2 rounded-full bg-slate-400" />
                    )}
                  </div>

                  <div className="space-y-0.5 flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <h4 className="text-xs sm:text-sm font-bold text-navy-900 dark:text-white truncate">
                        {evt.title}
                      </h4>
                      <span className="text-[11px] text-slate-400 font-mono shrink-0">
                        {evt.timestamp}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      {evt.description}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column (1 Col on lg): Customer & Shipping + Merchant & Memo */}
        <div className="space-y-6">
          {/* Card 1: Customer & Shipping Details (Merchant OrderCustomerShippingCard style) */}
          <div className="rounded-2xl border border-slate-200/80 dark:border-white/10 bg-white dark:bg-navy-900 p-5 shadow-sm space-y-5">
            <div className="flex items-center justify-between pb-3.5 border-b border-slate-200/80 dark:border-white/10">
              <div className="flex items-center gap-2.5">
                <div className="h-8 w-8 rounded-lg bg-teal-500/10 border border-teal-500/20 flex items-center justify-center text-teal-600 dark:text-teal-400">
                  <User className="h-4 w-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-navy-900 dark:text-white">
                    Customer &amp; Shipping
                  </h3>
                  <p className="text-xs text-slate-400">Recipient details &amp; carrier</p>
                </div>
              </div>

              <a
                href={`tel:${order.customerPhone}`}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600/15 hover:bg-emerald-600/25 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 text-xs font-semibold transition-colors shrink-0 cursor-pointer"
              >
                <PhoneCall className="h-3.5 w-3.5" />
                <span>Call</span>
              </a>
            </div>

            {/* Recipient Profile */}
            <div className="flex items-start gap-3.5">
              <div className="h-11 w-11 rounded-full bg-emerald-50 dark:bg-emerald-950/80 border border-emerald-500/40 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold text-sm shrink-0">
                {customerInitials}
              </div>

              <div className="min-w-0 flex-1 space-y-1">
                <h4 className="text-sm font-bold text-navy-900 dark:text-white truncate">
                  {order.customerName}
                </h4>
                <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                  <Phone className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                  <a
                    href={`tel:${order.customerPhone}`}
                    className="font-mono text-slate-700 dark:text-slate-300 hover:text-orange-600 transition-colors"
                  >
                    {order.customerPhone}
                  </a>
                </div>

                <div className="flex items-start gap-2 text-xs text-slate-700 dark:text-slate-300 pt-1">
                  <MapPin className="h-3.5 w-3.5 text-indigo-500 shrink-0 mt-0.5" />
                  <span className="leading-relaxed">
                    {order.customerAddress || `${order.city}, Bangladesh`}
                  </span>
                </div>
              </div>
            </div>

            {/* Fraud Ratio Badge */}
            <div className="pt-1">
              <FraudRatioBadge
                successRatio={order.customerPhone.endsWith('000') ? 42 : 95}
                compact={false}
              />
            </div>

            {/* Courier & Tracking Code Box */}
            <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-navy-950/80 border border-slate-200/80 dark:border-white/10 space-y-2 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                  Assigned Courier
                </span>
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-sky-500/10 text-sky-600 dark:text-sky-400 border border-sky-500/20">
                  {order.courier}
                </span>
              </div>

              <div className="flex items-center justify-between pt-1">
                <div>
                  <span className="text-[10px] text-slate-400 block">Tracking ID</span>
                  <span className="font-mono font-bold text-navy-900 dark:text-slate-200">
                    {trackingCode}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => handleCopyTracking(trackingCode)}
                  className="p-1.5 rounded-lg hover:bg-slate-200 dark:hover:bg-navy-800 text-slate-500 hover:text-navy-900 dark:hover:text-white transition-colors cursor-pointer"
                  title="Copy Tracking ID"
                >
                  {copiedTracking ? (
                    <Check className="h-3.5 w-3.5 text-emerald-500" />
                  ) : (
                    <Copy className="h-3.5 w-3.5" />
                  )}
                </button>
              </div>
            </div>
          </div>

          {/* Card 2: Store / Reseller Memo Attribution Card */}
          <div className="rounded-2xl border border-slate-200/80 dark:border-white/10 bg-white dark:bg-navy-900 p-5 shadow-sm space-y-4">
            <div className="flex items-center gap-2 pb-3.5 border-b border-slate-200/80 dark:border-white/10">
              <div className="h-8 w-8 rounded-lg bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
                <Layers className="h-4 w-4" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-navy-900 dark:text-white">
                  Store &amp; Memo Attribution
                </h3>
                <p className="text-xs text-slate-400">Merchant identity and packing slip</p>
              </div>
            </div>

            {/* Memo Code & Preview */}
            <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-navy-950/80 border border-slate-200/80 dark:border-white/10 flex items-center justify-between gap-3">
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">
                  Memo Code
                </span>
                <span className="font-mono font-black text-indigo-600 dark:text-indigo-400 text-sm">
                  {order.memoCode || 'MEMO-DEFAULT'}
                </span>
              </div>
              <button
                type="button"
                onClick={() => setPreviewMemo(order)}
                className="px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-xs cursor-pointer"
              >
                View 4x6 Slip
              </button>
            </div>

            {/* Reseller Info */}
            <div className="space-y-2 text-xs">
              <div className="flex items-start gap-2">
                <span className="text-slate-400 w-24 shrink-0 font-medium">Store Name:</span>
                <span className="font-bold text-navy-900 dark:text-white">{order.merchantName}</span>
              </div>
              <div className="flex items-start gap-2">
                <span className="text-slate-400 w-24 shrink-0 font-medium">Merchant ID:</span>
                <span className="font-mono font-bold text-orange-600 dark:text-orange-400">
                  {order.merchantCode}
                </span>
              </div>
              <div className="flex items-start gap-2">
                <span className="text-slate-400 w-24 shrink-0 font-medium">Reseller Hub:</span>
                <span className="text-slate-700 dark:text-slate-200 font-medium">
                  {order.resellerName}
                </span>
              </div>
              <div className="flex items-start gap-2">
                <span className="text-slate-400 w-24 shrink-0 font-medium">Phone:</span>
                <span className="font-mono text-slate-700 dark:text-slate-200">
                  {order.resellerPhone}
                </span>
              </div>
            </div>

            {/* WMS Guarantee */}
            <div className="pt-2 border-t border-slate-100 dark:border-white/10">
              <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 shrink-0" />
                <span>Atomic FOR UPDATE WMS Stock Protected</span>
              </span>
            </div>
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
