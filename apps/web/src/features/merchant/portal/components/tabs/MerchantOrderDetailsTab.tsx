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
  Phone,
  MapPin,
  Truck,
  CreditCard,
  User,
  CheckCircle2,
  Clock,
  Package,
  ExternalLink,
  X,
  AlertTriangle,
  Trash2,
  HelpCircle,
} from 'lucide-react';
import { MerchantOrderItem } from '../../types';
import { FraudRatioBadge } from '@/components/ui/FraudRatioBadge';

interface MerchantOrderDetailsTabProps {
  order: MerchantOrderItem;
  onUpdateStatus?: (orderId: string, status: MerchantOrderItem['status']) => void;
  onCancelOrder: (orderId: string) => void;
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

  const lineItems = order.lineItems && order.lineItems.length > 0 ? order.lineItems : [
    {
      id: 'li-default-1',
      title: order.items || 'Standard Ordered Item',
      variant: 'Standard / Default',
      sku: 'SKU-01',
      price: Math.round(order.amount / (order.qty || 1)),
      quantity: order.qty || 1,
      total: order.amount,
      imageUrl: 'https://images.unsplash.com/photo-1556905055-8f358a7a47b2?auto=format&fit=crop&w=300&q=80',
    },
  ];

  const subtotal = order.subtotal ?? lineItems.reduce((acc, it) => acc + (it.price * it.quantity), 0);
  const deliveryFee = order.deliveryFee ?? 80;
  const discount = order.discount ?? 0;
  const orderTotal = order.amount ?? (subtotal + deliveryFee - discount);

  const timelineEvents = order.timeline && order.timeline.length > 0 ? order.timeline : [
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
      title: 'Out for Delivery',
      description: 'Package is out with the local delivery rider.',
      timestamp: `${order.date}, 06:00 PM`,
      isCompleted: order.status === 'DISPATCHED' || order.status === 'DELIVERED',
    },
    {
      title: 'Delivered',
      description: 'Package successfully delivered to the customer.',
      timestamp: `${order.date}, 08:15 PM`,
      isCompleted: order.status === 'DELIVERED',
    },
  ];

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'DELIVERED':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400"></span>
            Delivered
          </span>
        );
      case 'DISPATCHED':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-blue-500/10 text-blue-400 border border-blue-500/30">
            <span className="h-1.5 w-1.5 rounded-full bg-blue-400"></span>
            Shipped
          </span>
        );
      case 'PACKED':
      case 'ALLOCATED':
      case 'PICKED':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/30">
            <span className="h-1.5 w-1.5 rounded-full bg-amber-400"></span>
            Processing
          </span>
        );
      case 'CANCELLED':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-rose-500/10 text-rose-400 border border-rose-500/30">
            <span className="h-1.5 w-1.5 rounded-full bg-rose-400"></span>
            Cancelled
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-sky-500/10 text-sky-400 border border-sky-500/30">
            <span className="h-1.5 w-1.5 rounded-full bg-sky-400"></span>
            Pending
          </span>
        );
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Breadcrumbs */}
      <nav className="flex items-center gap-2 text-xs text-slate-400">
        <Link href="/merchant" className="hover:text-slate-200 transition-colors">Overview</Link>
        <span>&gt;</span>
        <Link href="/merchant/orders" className="hover:text-slate-200 transition-colors">Orders</Link>
        <span>&gt;</span>
        <span className="text-slate-200 font-mono font-medium">{order.orderNumber || `#${order.id}`}</span>
      </nav>

      {/* Header Bar */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-slate-900/40 p-4 rounded-xl border border-slate-800">
        <div>
          <div className="flex items-center gap-3 flex-wrap">
            <button
              onClick={() => router.push('/merchant/orders')}
              className="p-1.5 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-slate-100 transition-colors"
              title="Back to Orders"
            >
              <ArrowLeft className="h-5 w-5" />
            </button>
            <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2.5">
              <span>Order</span>
              <span className="font-mono text-emerald-400">{order.orderNumber || `#${order.id}`}</span>
            </h1>
            {getStatusBadge(order.status)}
          </div>
          <div className="flex items-center gap-3 text-xs text-slate-400 mt-2 pl-9">
            <span>{order.date}, 04:15 PM</span>
            <span>•</span>
            <button
              onClick={handleCopyId}
              className="inline-flex items-center gap-1 hover:text-emerald-400 transition-colors font-mono"
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
            href={`/print/memo/${order.id}?memoCode=${encodeURIComponent(order.memoCode || 'MEMO-DEFAULT')}&customerName=${encodeURIComponent(order.customer)}&customerPhone=${encodeURIComponent(order.phone)}&customerAddress=${encodeURIComponent(order.address)}&codAmount=${orderTotal}`}
            className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 rounded-lg text-xs font-semibold flex items-center gap-2 transition-colors shadow-sm"
          >
            <Printer className="h-4 w-4 text-slate-400" />
            <span>Print</span>
          </Link>

          {/* 3-Dots More Options Menu */}
          <div className="relative">
            <button
              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
              className={`p-2 border rounded-lg transition-colors ${
                isDropdownOpen
                  ? 'bg-slate-800 border-slate-700 text-slate-100'
                  : 'border-slate-800 text-slate-400 hover:text-slate-200 hover:bg-slate-800'
              }`}
              title="More actions"
            >
              <MoreVertical className="h-4 w-4" />
            </button>

            {isDropdownOpen && (
              <>
                <div
                  className="fixed inset-0 z-20"
                  onClick={() => setIsDropdownOpen(false)}
                />
                <div className="absolute right-0 mt-2 w-56 rounded-xl bg-slate-900 border border-slate-800 p-1.5 shadow-2xl z-30 text-xs space-y-1 animate-in fade-in zoom-in-95 duration-100">
                  <button
                    onClick={() => {
                      setIsDropdownOpen(false);
                      handleCopyId();
                    }}
                    className="w-full flex items-center gap-2.5 px-3 py-2 text-slate-300 hover:text-white hover:bg-slate-800 rounded-lg transition-colors text-left"
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
                      className="w-full flex items-center gap-2.5 px-3 py-2 text-slate-300 hover:text-white hover:bg-slate-800 rounded-lg transition-colors text-left"
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
                    className="w-full flex items-center gap-2.5 px-3 py-2 text-slate-300 hover:text-white hover:bg-slate-800 rounded-lg transition-colors text-left"
                  >
                    <HelpCircle className="h-3.5 w-3.5 text-slate-400" />
                    <span>Warehouse Support</span>
                  </button>

                  <div className="h-px bg-slate-800 my-1" />

                  {/* Cancel Order Option with Status Check */}
                  {order.status === 'DELIVERED' || order.status === 'DISPATCHED' ? (
                    <div className="px-3 py-2 text-[11px] text-slate-500 leading-snug">
                      Cannot cancel: Order is already {order.status.toLowerCase()}.
                    </div>
                  ) : order.status === 'CANCELLED' ? (
                    <div className="px-3 py-2 text-[11px] text-slate-500 leading-snug">
                      Order is already cancelled.
                    </div>
                  ) : (
                    <button
                      onClick={() => {
                        setIsDropdownOpen(false);
                        setIsCancelConfirmOpen(true);
                      }}
                      className="w-full flex items-center gap-2.5 px-3 py-2 text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 rounded-lg transition-colors text-left font-semibold"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                      <span>Cancel Order</span>
                    </button>
                  )}
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column (8 cols): Order items & Timeline */}
        <div className="lg:col-span-8 space-y-6">
          {/* Order Items Card */}
          <div className="rounded-xl border border-slate-800 bg-slate-900 overflow-hidden shadow-sm">
            <div className="p-4 border-b border-slate-800 flex justify-between items-center">
              <div>
                <h3 className="text-sm font-bold text-slate-100">Order items</h3>
                <p className="text-xs text-slate-400">{lineItems.length} products in this order</p>
              </div>
              <span className="text-xs px-2.5 py-0.5 rounded-full bg-slate-800 text-slate-300 font-medium">
                {order.qty || lineItems.reduce((acc, it) => acc + it.quantity, 0)} items
              </span>
            </div>

            <div className="p-4 divide-y divide-slate-800/80">
              {lineItems.map((item) => (
                <div key={item.id} className="py-4 first:pt-0 last:pb-0 flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3.5 min-w-0">
                    <img
                      src={item.imageUrl || 'https://images.unsplash.com/photo-1556905055-8f358a7a47b2?auto=format&fit=crop&w=150&q=80'}
                      alt={item.title}
                      className="h-14 w-14 rounded-lg object-cover bg-slate-800 border border-slate-700/80 shrink-0"
                    />
                    <div className="min-w-0">
                      <h4 className="text-sm font-semibold text-slate-200 truncate">{item.title}</h4>
                      <p className="text-xs text-slate-400 mt-0.5">{item.variant}</p>
                      <p className="text-[11px] font-mono text-slate-500 mt-0.5">SKU: {item.sku}</p>
                    </div>
                  </div>

                  <div className="text-right shrink-0">
                    <div className="text-sm font-bold text-slate-100">৳{Number(item.total).toLocaleString()}</div>
                    <div className="text-xs text-slate-400 mt-0.5 font-mono">
                      ৳{Number(item.price).toLocaleString()} × {item.quantity}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Calculations breakdown */}
            <div className="p-4 bg-slate-950/60 border-t border-slate-800 space-y-2.5 text-xs">
              <div className="flex justify-between text-slate-400">
                <span>Subtotal</span>
                <span className="font-medium text-slate-200">৳{Number(subtotal).toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>Delivery fee</span>
                <span className="font-medium text-slate-200">৳{Number(deliveryFee).toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>Discount</span>
                <span className="font-medium text-emerald-400">-৳{Number(discount).toLocaleString()}</span>
              </div>
              <div className="pt-2.5 border-t border-slate-800 flex justify-between items-center text-xs font-semibold text-slate-300">
                <span>Total invoice value</span>
                <span className="font-extrabold text-sm text-white">৳{Number(orderTotal).toLocaleString()}</span>
              </div>
              {order.advancePayment && order.advancePayment > 0 ? (
                <div className="flex justify-between items-center text-xs text-emerald-400 bg-emerald-950/30 p-2 rounded-lg border border-emerald-500/20">
                  <span>Advance Received ({order.advancePaymentMethod || 'bKash'})</span>
                  <span className="font-bold font-mono">-৳{Number(order.advancePayment).toLocaleString()}</span>
                </div>
              ) : null}
              <div className="pt-2 border-t border-slate-800 flex justify-between items-center text-sm font-bold">
                <span className="text-slate-100">Courier COD Collection:</span>
                <span className="text-base font-extrabold text-emerald-400 font-mono">
                  ৳{Number(order.codAmount ?? Math.max(0, orderTotal - (order.advancePayment || 0))).toLocaleString()}
                </span>
              </div>
            </div>
          </div>

          {/* Fulfillment Timeline Card */}
          <div className="rounded-xl border border-slate-800 bg-slate-900 p-5 shadow-sm">
            <div className="mb-5">
              <h3 className="text-sm font-bold text-slate-100">Fulfillment timeline</h3>
              <p className="text-xs text-slate-400 mt-0.5">Track the order from confirmation to delivery.</p>
            </div>

            <div className="relative pl-6 space-y-6 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-800">
              {timelineEvents.map((evt, idx) => (
                <div key={idx} className="relative group">
                  <span
                    className={`absolute -left-6 top-0.5 h-5 w-5 rounded-full flex items-center justify-center ${
                      evt.isCompleted
                        ? 'bg-emerald-500 text-slate-950 ring-4 ring-slate-900'
                        : 'bg-slate-800 text-slate-500 ring-4 ring-slate-900'
                    }`}
                  >
                    <CheckCircle2 className="h-3.5 w-3.5" />
                  </span>

                  <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-1">
                    <h4 className={`text-xs font-semibold ${evt.isCompleted ? 'text-slate-200' : 'text-slate-500'}`}>
                      {evt.title}
                    </h4>
                    <span className="text-[11px] text-slate-500 font-mono">{evt.timestamp}</span>
                  </div>
                  <p className="text-xs text-slate-400 mt-0.5">{evt.description}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column (4 cols): Customer, Delivery, Payment */}
        <div className="lg:col-span-4 space-y-6">
          {/* Customer Card */}
          <div className="rounded-xl border border-slate-800 bg-slate-900 p-5 shadow-sm">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-4">Customer</h3>
            <div className="flex items-center gap-3 mb-4">
              <div className="h-10 w-10 rounded-full bg-emerald-950/80 border border-emerald-500/40 text-emerald-400 flex items-center justify-center font-bold text-sm shrink-0">
                {order.customerInitials || order.customer.substring(0, 2).toUpperCase()}
              </div>
              <div className="min-w-0">
                <h4 className="text-sm font-bold text-slate-100 truncate">{order.customer}</h4>
                <p className="text-xs text-slate-400">Customer</p>
              </div>
            </div>

            <div className="space-y-3 text-xs border-t border-slate-800/80 pt-3">
              <div className="flex items-center gap-2.5 text-slate-300">
                <Phone className="h-4 w-4 text-slate-500 shrink-0" />
                <span className="font-mono">{order.phone}</span>
              </div>
              <div className="flex items-start gap-2.5 text-slate-300">
                <MapPin className="h-4 w-4 text-slate-500 shrink-0 mt-0.5" />
                <span className="leading-relaxed">{order.address}</span>
              </div>
              <div className="pt-2">
                <FraudRatioBadge
                  successRatio={order.phone.endsWith('000') ? 35 : 94}
                  compact={false}
                />
              </div>
            </div>

            <div className="mt-4 pt-3 border-t border-slate-800 text-xs">
              <a
                href={`tel:${order.phone}`}
                className="text-emerald-400 hover:text-emerald-300 flex items-center justify-between font-medium transition-colors"
              >
                <span>Call customer</span>
                <ExternalLink className="h-3.5 w-3.5" />
              </a>
            </div>
          </div>

          {/* Delivery Card */}
          <div className="rounded-xl border border-slate-800 bg-slate-900 p-5 shadow-sm">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400">Delivery</h3>
              <span className="text-[11px] text-slate-500">Shipping destination</span>
            </div>

            <div className="text-xs text-slate-300 space-y-1 mb-4">
              <p className="font-semibold text-slate-200">{order.customer}</p>
              <p className="text-slate-400 leading-relaxed">{order.address}</p>
              <p className="font-mono text-slate-400">{order.phone}</p>
            </div>

            <div className="rounded-lg bg-slate-950/70 border border-slate-800 p-3.5 space-y-3">
              <div className="flex justify-between items-center">
                <div className="text-[10px] uppercase font-bold tracking-wider text-slate-500">Courier</div>
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                  {order.courierStatus || 'Assigned'}
                </span>
              </div>
              <div className="text-sm font-bold text-slate-200">{order.courier}</div>

              <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-800/80 text-xs">
                <div>
                  <span className="text-[10px] text-slate-500 uppercase block">Tracking ID</span>
                  <span className="font-mono text-slate-300 font-medium">
                    {order.trackingId || `del-${order.id.slice(-4)}`}
                  </span>
                </div>
                <div className="text-right">
                  <span className="text-[10px] text-slate-500 uppercase block">Delivery Charge</span>
                  <span className="font-bold text-slate-200">৳{Number(deliveryFee).toLocaleString()}</span>
                </div>
              </div>

              <div className="pt-2 border-t border-slate-800/80">
                <Link
                  href={`/tracking?trackingCode=${encodeURIComponent(order.trackingId || `del-${order.id}`)}`}
                  className="w-full py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors"
                >
                  <span>Track shipment</span>
                  <ExternalLink className="h-3 w-3" />
                </Link>
              </div>
            </div>
          </div>

          {/* Payment Card */}
          <div className="rounded-xl border border-slate-800 bg-slate-900 p-5 shadow-sm">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-4">Payment</h3>

            <div className="flex items-center justify-between p-3 rounded-lg bg-slate-950/70 border border-slate-800 mb-4">
              <div className="flex items-center gap-2.5">
                <CreditCard className="h-4 w-4 text-emerald-400" />
                <span className="text-xs font-bold text-slate-200">{order.paymentMethod || 'Cash on Delivery'}</span>
              </div>
              <span
                className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                  order.paymentStatus === 'Paid'
                    ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                    : order.paymentStatus === 'Partial'
                    ? 'bg-sky-500/10 text-sky-400 border border-sky-500/30'
                    : 'bg-amber-500/10 text-amber-400 border border-amber-500/30'
                }`}
              >
                {order.paymentStatus === 'Paid'
                  ? 'Paid (100%)'
                  : order.paymentStatus === 'Partial'
                  ? `Partial (Adv: ৳${order.advancePayment})`
                  : 'Unpaid (COD)'}
              </span>
            </div>

            <div className="space-y-2 text-xs">
              <div className="flex justify-between text-slate-400">
                <span className="text-[11px] uppercase text-slate-500">Transaction ID</span>
                <span className="font-mono text-slate-300 font-medium">
                  {order.advanceTrxId || order.transactionId || `COD-TRX-${order.id}`}
                </span>
              </div>
              {order.advancePayment && order.advancePayment > 0 ? (
                <div className="flex justify-between text-slate-400">
                  <span className="text-[11px] uppercase text-slate-500">Advance Received</span>
                  <span className="font-mono text-emerald-400 font-semibold">
                    ৳{Number(order.advancePayment).toLocaleString()} ({order.advancePaymentMethod || 'bKash'})
                  </span>
                </div>
              ) : null}
              <div className="flex justify-between items-center pt-2 border-t border-slate-800">
                <span className="text-slate-300 font-medium">Due COD to Collect</span>
                <span className="text-sm font-extrabold text-white">
                  ৳{Number(order.codAmount ?? Math.max(0, orderTotal - (order.advancePayment || 0))).toLocaleString()}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Cancel Order Confirmation Modal */}
      {isCancelConfirmOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4 animate-in fade-in duration-150">
          <div className="bg-slate-900 border border-slate-800 rounded-xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-start gap-3.5">
              <div className="p-2.5 bg-rose-500/10 border border-rose-500/30 rounded-xl text-rose-400 shrink-0">
                <AlertTriangle className="h-5 w-5" />
              </div>
              <div className="space-y-1">
                <h3 className="text-base font-bold text-white">
                  Cancel Order {order.orderNumber || `#${order.id}`}?
                </h3>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Are you sure you want to cancel this order? This will immediately stop fulfillment and automatically restore the reserved inventory items back into the warehouse stock bins.
                </p>
              </div>
            </div>

            <div className="flex justify-end gap-2.5 pt-3 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setIsCancelConfirmOpen(false)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs font-semibold transition-colors"
              >
                No, Keep Order
              </button>
              <button
                type="button"
                onClick={() => {
                  onCancelOrder(order.id);
                  setIsCancelConfirmOpen(false);
                }}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white rounded-lg text-xs font-semibold transition-colors shadow-sm"
              >
                Yes, Cancel Order
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
