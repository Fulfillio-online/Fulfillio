'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  ArrowLeft,
  Copy,
  Check,
  Printer,
  MoreVertical,
  Truck,
  HelpCircle,
  Trash2,
} from 'lucide-react';
import { MerchantOrderItem, isOrderCancellable } from '../../types';
import { OrderItemsCard } from './order-details/OrderItemsCard';
import { OrderCustomerShippingCard } from './order-details/OrderCustomerShippingCard';
import { OrderPaymentCard } from './order-details/OrderPaymentCard';
import { OrderTimelineCard } from './order-details/OrderTimelineCard';
import { CancelOrderModal } from './order-details/CancelOrderModal';

interface MerchantOrderDetailsTabProps {
  order: MerchantOrderItem;
  onUpdateStatus?: (orderId: string, status: MerchantOrderItem['status']) => void;
  onCancelOrder: (orderId: string, reason?: string) => Promise<boolean> | void;
  onTriggerToast: (msg: string) => void;
}

export function MerchantOrderDetailsTab({
  order,
  onCancelOrder,
  onTriggerToast,
}: MerchantOrderDetailsTabProps) {
  const router = useRouter();
  const [copied, setCopied] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isCancelConfirmOpen, setIsCancelConfirmOpen] = useState(false);

  const handleCopyId = () => {
    if (typeof navigator !== 'undefined') {
      navigator.clipboard.writeText(order.orderNumber || order.id);
      setCopied(true);
      onTriggerToast(`Order ID ${order.orderNumber || order.id} copied to clipboard!`);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const lineItems =
    order.lineItems && order.lineItems.length > 0
      ? order.lineItems
      : [
          {
            id: 'li-default-1',
            title: order.items || 'Standard Ordered Item',
            variant: 'Standard / Default',
            sku: 'SKU-01',
            price: Math.round(order.amount / (order.qty || 1)),
            quantity: order.qty || 1,
            total: order.amount,
            imageUrl:
              'https://images.unsplash.com/photo-1556905055-8f358a7a47b2?auto=format&fit=crop&w=300&q=80',
          },
        ];

  const subtotal =
    order.subtotal ?? lineItems.reduce((acc, it) => acc + it.price * it.quantity, 0);
  const deliveryFee = order.deliveryFee ?? 80;
  const discount = order.discount ?? 0;
  const orderTotal = order.amount ?? subtotal + deliveryFee - discount;

  const timelineEvents =
    order.timeline && order.timeline.length > 0
      ? order.timeline
      : [
          {
            title: 'Order Confirmed',
            description: 'Order placed by customer & stock reserved in warehouse.',
            timestamp: `${order.date}, 10:00 AM`,
            isCompleted: true,
          },
          {
            title: 'Order Picked Up',
            description: 'Package verified and collected from warehouse dispatch bay.',
            timestamp: `${order.date}, 02:30 PM`,
            isCompleted: order.status !== 'PENDING' && order.status !== 'ALLOCATED',
          },
          {
            title: 'Courier Booked',
            description: 'Order booked with courier and parcel packed for dispatch.',
            timestamp: `${order.date}, 06:00 PM`,
            isCompleted: order.status === 'DISPATCHED' || order.status === 'DELIVERED',
          },
          {
            title: 'Handover Completed',
            description: 'Package successfully handed over to courier / customer delivery.',
            timestamp: `${order.date}, 08:15 PM`,
            isCompleted: order.status === 'DELIVERED',
          },
        ];

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'DELIVERED':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
            Handover
          </span>
        );
      case 'DISPATCHED':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-blue-500/10 text-blue-400 border border-blue-500/30">
            <span className="h-1.5 w-1.5 rounded-full bg-blue-400" />
            Courier Booked
          </span>
        );
      case 'PACKED':
      case 'ALLOCATED':
      case 'PICKED':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/30">
            <span className="h-1.5 w-1.5 rounded-full bg-amber-400" />
            Processing
          </span>
        );
      case 'CANCELLED':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-rose-500/10 text-rose-400 border border-rose-500/30">
            <span className="h-1.5 w-1.5 rounded-full bg-rose-400" />
            Cancelled
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-sky-500/10 text-sky-400 border border-sky-500/30">
            <span className="h-1.5 w-1.5 rounded-full bg-sky-400" />
            Pending
          </span>
        );
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-14">
      {/* Breadcrumbs */}
      <nav className="flex items-center gap-2 text-xs text-slate-400">
        <Link href="/merchant" className="hover:text-navy-900 dark:text-slate-200 transition-colors">
          Overview
        </Link>
        <span>&gt;</span>
        <Link href="/merchant/orders" className="hover:text-navy-900 dark:text-slate-200 transition-colors">
          Orders
        </Link>
        <span>&gt;</span>
        <span className="text-navy-900 dark:text-slate-200 font-mono font-medium">
          {order.orderNumber || `#${order.id}`}
        </span>
      </nav>

      {/* Header Bar */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white dark:bg-navy-900/60 p-4 sm:p-5 rounded-2xl border border-slate-200/80 dark:border-white/10 shadow-md">
        <div>
          <div className="flex items-center gap-3 flex-wrap">
            <button
              onClick={() => router.push('/merchant/orders')}
              className="p-1.5 hover:bg-slate-100 dark:bg-navy-800 rounded-lg text-slate-500 dark:text-slate-400 hover:text-navy-900 dark:hover:text-white transition-colors cursor-pointer"
              title="Back to Orders"
            >
              <ArrowLeft className="h-5 w-5" />
            </button>
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-white flex items-center gap-2.5">
              <span>Order</span>
              <span className="font-mono text-emerald-400">{order.orderNumber || `#${order.id}`}</span>
            </h1>
            {getStatusBadge(order.status)}
          </div>

          <div className="flex items-center gap-2.5 sm:gap-3 text-xs text-slate-400 mt-2 pl-9 flex-wrap">
            <span>{order.date}, 04:15 PM</span>
            <span>•</span>
            <button
              onClick={handleCopyId}
              className="inline-flex items-center gap-1 hover:text-orange-600 dark:hover:text-orange-400 transition-colors font-mono cursor-pointer"
            >
              {copied ? <Check className="h-3 w-3 text-emerald-400" /> : <Copy className="h-3 w-3" />}
              <span>{copied ? 'Copied ID' : 'Copy order ID'}</span>
            </button>
            {order.memoCode && (
              <>
                <span>•</span>
                <span className="px-2 py-0.5 rounded bg-indigo-950/80 text-indigo-300 border border-indigo-800/60 font-mono text-[11px]">
                  Memo: {order.memoCode}
                </span>
              </>
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2.5 w-full md:w-auto justify-end">
          <Link
            href={`/print/memo/${encodeURIComponent(order.orderNumber || order.id)}?memoCode=${encodeURIComponent(
              order.memoCode || 'MEMO-DEFAULT',
            )}&customerName=${encodeURIComponent(order.customer)}&customerPhone=${encodeURIComponent(
              order.phone,
            )}&customerAddress=${encodeURIComponent(order.address)}&codAmount=${
              order.codAmount ?? Math.max(0, orderTotal - (order.advancePayment || 0))
            }`}
            className="px-3.5 py-2 bg-slate-100 dark:bg-navy-800 hover:bg-slate-200 dark:hover:bg-navy-700 border border-slate-200 dark:border-white/10 text-navy-900 dark:text-slate-200 hover:text-white rounded-xl text-xs font-semibold flex items-center gap-2 transition-colors shadow-sm cursor-pointer min-h-[38px]"
          >
            <Printer className="h-4 w-4 text-emerald-400" />
            <span>Print Invoice Memo</span>
          </Link>

          {isOrderCancellable(order.status, order.courierStatus) && (
            <button
              type="button"
              onClick={() => setIsCancelConfirmOpen(true)}
              className="px-3.5 py-2 bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/40 dark:hover:bg-rose-900/60 border border-rose-200 dark:border-rose-800/40 text-rose-600 dark:text-rose-400 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-sm cursor-pointer min-h-[38px]"
            >
              <Trash2 className="h-4 w-4" />
              <span>Cancel Order</span>
            </button>
          )}

          {/* 3-Dots More Options Menu */}
          <div className="relative">
            <button
              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
              className={`p-2 border rounded-xl transition-colors min-h-[38px] min-w-[38px] flex items-center justify-center cursor-pointer ${
                isDropdownOpen
                  ? 'bg-slate-100 dark:bg-navy-800 border-slate-200 dark:border-white/10 text-navy-900 dark:text-white'
                  : 'border-slate-200/80 dark:border-white/10 text-slate-400 hover:text-navy-900 dark:text-slate-200 hover:bg-slate-100 dark:bg-navy-800'
              }`}
              title="More actions"
            >
              <MoreVertical className="h-4 w-4" />
            </button>

            {isDropdownOpen && (
              <>
                <div className="fixed inset-0 z-20" onClick={() => setIsDropdownOpen(false)} />
                <div className="absolute right-0 mt-2 w-56 rounded-xl bg-white dark:bg-navy-900 border border-slate-200/80 dark:border-white/10 p-1.5 shadow-2xl z-30 text-xs space-y-1 animate-in fade-in zoom-in-95 duration-100">
                  <button
                    onClick={() => {
                      setIsDropdownOpen(false);
                      handleCopyId();
                    }}
                    className="w-full flex items-center gap-2.5 px-3 py-2 text-slate-700 dark:text-slate-300 hover:text-white hover:bg-slate-100 dark:bg-navy-800 rounded-lg transition-colors text-left cursor-pointer"
                  >
                    <Copy className="h-3.5 w-3.5 text-slate-400" />
                    <span>Copy Order ID</span>
                  </button>

                  {order.trackingId && (
                    <button
                      onClick={() => {
                        setIsDropdownOpen(false);
                        if (typeof navigator !== 'undefined') {
                          navigator.clipboard.writeText(order.trackingId!);
                          onTriggerToast(`Tracking Code ${order.trackingId} copied!`);
                        }
                      }}
                      className="w-full flex items-center gap-2.5 px-3 py-2 text-slate-700 dark:text-slate-300 hover:text-white hover:bg-slate-100 dark:bg-navy-800 rounded-lg transition-colors text-left cursor-pointer"
                    >
                      <Truck className="h-3.5 w-3.5 text-blue-400" />
                      <span>Copy Tracking ID</span>
                    </button>
                  )}

                  <button
                    onClick={() => {
                      setIsDropdownOpen(false);
                      onTriggerToast('Connecting to Fulfillio Warehouse Support: support@fulfillio.online');
                    }}
                    className="w-full flex items-center gap-2.5 px-3 py-2 text-slate-700 dark:text-slate-300 hover:text-white hover:bg-slate-100 dark:bg-navy-800 rounded-lg transition-colors text-left cursor-pointer"
                  >
                    <HelpCircle className="h-3.5 w-3.5 text-slate-400" />
                    <span>Warehouse Support</span>
                  </button>

                  {isOrderCancellable(order.status, order.courierStatus) && (
                    <>
                      <div className="h-px bg-slate-100 dark:bg-navy-800 my-1" />
                      <button
                        onClick={() => {
                          setIsDropdownOpen(false);
                          setIsCancelConfirmOpen(true);
                        }}
                        className="w-full flex items-center gap-2.5 px-3 py-2 text-rose-600 dark:text-rose-400 hover:text-rose-700 hover:bg-rose-50 dark:hover:bg-rose-500/10 rounded-lg transition-colors text-left font-semibold cursor-pointer"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                        <span>Cancel Order</span>
                      </button>
                    </>
                  )}
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Main Content Layout */}
      {/* On Desktop: 2-column grid (8 cols left / 4 cols right).
          On Mobile: Clean vertical sequence:
          1. Items Card
          2. Customer & Shipping Card
          3. Payment Card
          4. Fulfillment Timeline Card (Collapsible at bottom) */}
      <div className="flex flex-col lg:grid lg:grid-cols-12 gap-6 items-start">
        {/* Left Column (Desktop 8 cols) */}
        <div className="lg:col-span-8 space-y-6 w-full flex flex-col">
          {/* Step 1 on Mobile & Left-Top on Desktop: Ordered Items */}
          <OrderItemsCard
            order={order}
            lineItems={lineItems}
            subtotal={subtotal}
            deliveryFee={deliveryFee}
            discount={discount}
            orderTotal={orderTotal}
          />

          {/* Step 4 on Desktop: Timeline stays in left column */}
          <div className="hidden lg:block">
            <OrderTimelineCard order={order} timelineEvents={timelineEvents} />
          </div>
        </div>

        {/* Right Column (Desktop 4 cols) */}
        <div className="lg:col-span-4 space-y-6 w-full flex flex-col">
          {/* Step 2 on Mobile: Customer & Shipping */}
          <OrderCustomerShippingCard
            order={order}
            deliveryFee={deliveryFee}
            onTriggerToast={onTriggerToast}
          />

          {/* Step 3 on Mobile: Payment & COD */}
          <OrderPaymentCard order={order} orderTotal={orderTotal} />
        </div>

        {/* Step 4 on Mobile: Timeline rendered at the very bottom on mobile screens */}
        <div className="block lg:hidden w-full">
          <OrderTimelineCard order={order} timelineEvents={timelineEvents} />
        </div>
      </div>

      {/* Cancel Order Confirmation Modal */}
      <CancelOrderModal
        isOpen={isCancelConfirmOpen}
        orderNumber={order.orderNumber || `#${order.id}`}
        customerName={order.customer}
        amount={order.amount}
        qty={order.qty}
        onClose={() => setIsCancelConfirmOpen(false)}
        onConfirm={async (reason) => {
          await onCancelOrder(order.orderNumber || order.id, reason);
          setIsCancelConfirmOpen(false);
        }}
      />
    </div>
  );
}
