'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Package,
  Plus,
  Printer,
  Search,
  SlidersHorizontal,
  Download,
  Clock,
  Truck,
  CheckCircle2,
  TrendingUp,
  AlertCircle,
  ExternalLink,
} from 'lucide-react';
import { FraudRatioBadge } from '@/components/ui/FraudRatioBadge';
import { MerchantOrderItem, MerchantProductItem, ResellerMemo } from '../../types';
import { CreateManualOrderModal } from '../modals/CreateManualOrderModal';

interface MerchantOrdersTabProps {
  orders: MerchantOrderItem[];
  products: MerchantProductItem[];
  memoList: ResellerMemo[];
  onCreateOrder: (
    order: MerchantOrderItem,
    productIdOrItems?: string | { productId: string; qty: number }[],
    qty?: number
  ) => void;
  onCancelOrder: (orderId: string) => void;
  onTriggerToast: (msg: string) => void;
}

type TabFilter = 'ALL' | 'PENDING' | 'PROCESSING' | 'SHIPPED' | 'DELIVERED';

export function MerchantOrdersTab({
  orders,
  products,
  memoList,
  onCreateOrder,
  onCancelOrder,
  onTriggerToast,
}: MerchantOrdersTabProps) {
  const router = useRouter();
  const [isCreateOrderOpen, setIsCreateOrderOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<TabFilter>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 8; // Matching the reference screenshot showing 8 items per page

  // Calculate Stat Cards Metrics
  const stats = useMemo(() => {
    const total = orders.length;
    const pending = orders.filter((o) => o.status === 'PENDING').length;
    const inDelivery = orders.filter((o) => o.status === 'DISPATCHED').length;
    const delivered = orders.filter((o) => o.status === 'DELIVERED').length;
    const processing = orders.filter(
      (o) => o.status === 'ALLOCATED' || o.status === 'PICKED' || o.status === 'PACKED',
    ).length;

    return { total, pending, inDelivery, delivered, processing };
  }, [orders]);

  // Filter Orders by Tab and Search
  const filteredOrders = useMemo(() => {
    return orders.filter((o) => {
      // Tab filter
      if (activeTab === 'PENDING' && o.status !== 'PENDING') return false;
      if (
        activeTab === 'PROCESSING' &&
        o.status !== 'ALLOCATED' &&
        o.status !== 'PICKED' &&
        o.status !== 'PACKED'
      )
        return false;
      if (activeTab === 'SHIPPED' && o.status !== 'DISPATCHED') return false;
      if (activeTab === 'DELIVERED' && o.status !== 'DELIVERED') return false;

      // Search filter
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchId = (o.orderNumber || o.id).toLowerCase().includes(q);
        const matchCustomer = o.customer.toLowerCase().includes(q);
        const matchPhone = o.phone.toLowerCase().includes(q);
        const matchCourier = o.courier.toLowerCase().includes(q);
        const matchMemo = (o.memoCode || '').toLowerCase().includes(q);
        if (!matchId && !matchCustomer && !matchPhone && !matchCourier && !matchMemo) {
          return false;
        }
      }

      return true;
    });
  }, [orders, activeTab, searchQuery]);

  // Pagination Slice
  const totalPages = Math.max(1, Math.ceil(filteredOrders.length / pageSize));
  const paginatedOrders = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredOrders.slice(start, start + pageSize);
  }, [filteredOrders, currentPage, pageSize]);

  // CSV Export
  const handleExportCsv = () => {
    const headers = [
      'Order ID',
      'Date',
      'Customer',
      'Phone',
      'Address',
      'Amount (BDT)',
      'Payment Method',
      'Payment Status',
      'Courier',
      'Status',
      'Memo Code',
    ];
    const rows = filteredOrders.map((o) => [
      `"${o.orderNumber || o.id}"`,
      `"${o.date}"`,
      `"${o.customer}"`,
      `"${o.phone}"`,
      `"${o.address.replace(/"/g, '""')}"`,
      o.amount,
      `"${o.paymentMethod || 'Cash on Delivery'}"`,
      `"${o.paymentStatus || 'Unpaid'}"`,
      `"${o.courier}"`,
      `"${o.status}"`,
      `"${o.memoCode || 'MEMO-DEFAULT'}"`,
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `fulfillio_orders_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    onTriggerToast(`Exported ${filteredOrders.length} orders to CSV successfully.`);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'DELIVERED':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400"></span>
            Delivered
          </span>
        );
      case 'DISPATCHED':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-500/10 text-blue-400 border border-blue-500/30">
            <span className="h-1.5 w-1.5 rounded-full bg-blue-400"></span>
            Shipped
          </span>
        );
      case 'PACKED':
      case 'ALLOCATED':
      case 'PICKED':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/30">
            <span className="h-1.5 w-1.5 rounded-full bg-amber-400"></span>
            Processing
          </span>
        );
      case 'CANCELLED':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-rose-500/10 text-rose-400 border border-rose-500/30">
            <span className="h-1.5 w-1.5 rounded-full bg-rose-400"></span>
            Cancelled
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-sky-500/10 text-sky-400 border border-sky-500/30">
            <span className="h-1.5 w-1.5 rounded-full bg-sky-400"></span>
            Pending
          </span>
        );
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3.5 sm:gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-emerald-500/10 border border-emerald-500/30 rounded-lg text-emerald-400">
              <Package className="h-5 w-5 sm:h-6 sm:w-6" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-white">Orders</h1>
              <p className="text-xs text-slate-400 mt-0.5">Manage, track, and fulfill your customer orders.</p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2.5 w-full sm:w-auto">
          <button
            onClick={handleExportCsv}
            className="flex-1 sm:flex-initial px-3.5 py-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 rounded-lg text-xs font-semibold flex items-center justify-center gap-2 transition-colors shadow-sm cursor-pointer"
          >
            <Download className="h-4 w-4 text-slate-400" />
            <span>Export</span>
          </button>

          <button
            onClick={() => setIsCreateOrderOpen(true)}
            className="flex-1 sm:flex-initial px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-semibold flex items-center justify-center gap-2 transition-colors shadow-sm shrink-0 cursor-pointer"
          >
            <Plus className="h-4 w-4" />
            <span>Create Manual Order</span>
          </button>
        </div>
      </div>

      {/* 4 KPI Metrics Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-4">
        {/* Card 1: Total Orders */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-3 sm:p-4 flex flex-col justify-between shadow-sm">
          <div className="flex justify-between items-start">
            <span className="text-[11px] sm:text-xs font-medium text-slate-400">Total Orders</span>
            <div className="p-1.5 bg-emerald-500/10 border border-emerald-500/30 rounded-lg text-emerald-400">
              <Package className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
            </div>
          </div>
          <div className="mt-2.5 sm:mt-3">
            <div className="text-xl sm:text-2xl font-extrabold text-white">{stats.total}</div>
            <div className="flex items-center gap-1 text-[10px] sm:text-[11px] text-emerald-400 font-medium mt-1 truncate">
              <TrendingUp className="h-3 w-3 shrink-0" />
              <span>+18.2%</span>
            </div>
          </div>
        </div>

        {/* Card 2: Pending Fulfillment */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-3 sm:p-4 flex flex-col justify-between shadow-sm">
          <div className="flex justify-between items-start">
            <span className="text-[11px] sm:text-xs font-medium text-slate-400">Pending</span>
            <div className="p-1.5 bg-amber-500/10 border border-amber-500/30 rounded-lg text-amber-400">
              <Clock className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
            </div>
          </div>
          <div className="mt-2.5 sm:mt-3">
            <div className="text-xl sm:text-2xl font-extrabold text-white">{stats.pending}</div>
            <div className="text-[10px] sm:text-[11px] text-amber-400/90 font-medium mt-1 truncate">need attention</div>
          </div>
        </div>

        {/* Card 3: In Delivery */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-3 sm:p-4 flex flex-col justify-between shadow-sm">
          <div className="flex justify-between items-start">
            <span className="text-[11px] sm:text-xs font-medium text-slate-400">In Delivery</span>
            <div className="p-1.5 bg-blue-500/10 border border-blue-500/30 rounded-lg text-blue-400">
              <Truck className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
            </div>
          </div>
          <div className="mt-2.5 sm:mt-3">
            <div className="text-xl sm:text-2xl font-extrabold text-white">{stats.inDelivery}</div>
            <div className="text-[10px] sm:text-[11px] text-blue-400/90 font-medium mt-1 truncate">on the way</div>
          </div>
        </div>

        {/* Card 4: Delivered */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-3 sm:p-4 flex flex-col justify-between shadow-sm">
          <div className="flex justify-between items-start">
            <span className="text-[11px] sm:text-xs font-medium text-slate-400">Delivered</span>
            <div className="p-1.5 bg-emerald-500/10 border border-emerald-500/30 rounded-lg text-emerald-400">
              <CheckCircle2 className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
            </div>
          </div>
          <div className="mt-2.5 sm:mt-3">
            <div className="text-xl sm:text-2xl font-extrabold text-white">{stats.delivered}</div>
            <div className="text-[10px] sm:text-[11px] text-emerald-400 font-medium mt-1 truncate">+12.4% completed</div>
          </div>
        </div>
      </div>

      {/* Filter Toolbar & Tab Bar */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-3.5 sm:p-4 space-y-3.5 sm:space-y-4 shadow-sm">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-3">
          <div>
            <h2 className="text-base font-bold text-white">All orders</h2>
            <p className="text-xs text-slate-400">{filteredOrders.length} orders matching your filters</p>
          </div>

          <div className="flex items-center gap-2 w-full md:w-auto">
            <div className="relative flex-1 md:w-72">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
              <input
                type="text"
                placeholder="Search orders or customers..."
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setCurrentPage(1);
                }}
                className="w-full pl-9 pr-3.5 py-1.5 bg-slate-950 border border-slate-800 rounded-lg text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-emerald-500 transition-colors"
              />
            </div>

            <button
              onClick={() => {
                setSearchQuery('');
                setActiveTab('ALL');
                setCurrentPage(1);
              }}
              className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 rounded-lg text-xs font-semibold flex items-center gap-1.5 shrink-0 transition-colors cursor-pointer"
            >
              <SlidersHorizontal className="h-3.5 w-3.5 text-slate-400" />
              <span>Filters</span>
            </button>
          </div>
        </div>

        {/* Tab Filters */}
        <div className="flex items-center gap-1.5 overflow-x-auto border-t border-slate-800/80 pt-3 pb-1 -mx-1 px-1">
          <button
            onClick={() => {
              setActiveTab('ALL');
              setCurrentPage(1);
            }}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors shrink-0 cursor-pointer ${
              activeTab === 'ALL'
                ? 'bg-slate-800 text-white border border-slate-700'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
            }`}
          >
            All Orders ({stats.total})
          </button>
          <button
            onClick={() => {
              setActiveTab('PENDING');
              setCurrentPage(1);
            }}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors shrink-0 cursor-pointer ${
              activeTab === 'PENDING'
                ? 'bg-slate-800 text-white border border-slate-700'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
            }`}
          >
            Pending ({stats.pending})
          </button>
          <button
            onClick={() => {
              setActiveTab('PROCESSING');
              setCurrentPage(1);
            }}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors shrink-0 cursor-pointer ${
              activeTab === 'PROCESSING'
                ? 'bg-slate-800 text-white border border-slate-700'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
            }`}
          >
            Processing ({stats.processing})
          </button>
          <button
            onClick={() => {
              setActiveTab('SHIPPED');
              setCurrentPage(1);
            }}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors shrink-0 cursor-pointer ${
              activeTab === 'SHIPPED'
                ? 'bg-slate-800 text-white border border-slate-700'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
            }`}
          >
            Shipped ({stats.inDelivery})
          </button>
          <button
            onClick={() => {
              setActiveTab('DELIVERED');
              setCurrentPage(1);
            }}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors shrink-0 cursor-pointer ${
              activeTab === 'DELIVERED'
                ? 'bg-slate-800 text-white border border-slate-700'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
            }`}
          >
            Delivered ({stats.delivered})
          </button>
        </div>

        {/* Mobile Orders Card View (block md:hidden) */}
        <div className="block md:hidden space-y-3">
          {paginatedOrders.length === 0 ? (
            <div className="py-12 text-center text-slate-500 bg-slate-950/60 rounded-xl border border-slate-800">
              <Package className="h-8 w-8 mx-auto text-slate-600 mb-2" />
              <p className="text-xs">No orders found matching your filters.</p>
            </div>
          ) : (
            paginatedOrders.map((o) => (
              <div
                key={o.id}
                onClick={() => router.push(`/merchant/orders/${o.id}`)}
                className="bg-slate-950/80 hover:bg-slate-900 border border-slate-800 rounded-xl p-3.5 space-y-3 transition-colors cursor-pointer shadow-sm active:border-emerald-500/50"
              >
                {/* Card Header: Order Number, Items badge, & Status Badge */}
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <div className="p-1.5 bg-slate-800/80 rounded-lg text-emerald-400 shrink-0">
                      <Package className="h-4 w-4" />
                    </div>
                    <div>
                      <span className="font-mono font-bold text-slate-100 text-xs block">
                        {o.orderNumber || `#${o.id}`}
                      </span>
                      <span className="text-[10px] text-slate-500 font-medium">
                        {o.date} • {o.qty || 1} {o.qty === 1 ? 'item' : 'items'}
                      </span>
                    </div>
                  </div>
                  <div>{getStatusBadge(o.status)}</div>
                </div>

                {/* Customer Details & Courier */}
                <div className="p-2.5 rounded-lg bg-slate-900/90 border border-slate-800/70 text-xs space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-slate-200">{o.customer}</span>
                    <span className="text-[11px] font-semibold text-slate-300 px-2 py-0.5 rounded bg-slate-800/90 border border-slate-700/60">
                      {o.courier}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-[11px] text-slate-400">
                    <span className="font-mono">{o.phone}</span>
                    <span>Fee: ৳{o.deliveryFee ?? 60}</span>
                  </div>
                </div>

                {/* Financial Summary */}
                <div className="flex items-center justify-between text-xs pt-1">
                  <div>
                    <div className="text-[10px] text-slate-400 uppercase font-semibold">Total Amount</div>
                    <div className="font-extrabold text-sm text-slate-100">
                      ৳{Number(o.amount).toLocaleString()}
                    </div>
                  </div>

                  <div className="text-right">
                    <div
                      className={`text-[11px] font-semibold ${
                        o.paymentStatus === 'Paid'
                          ? 'text-emerald-400'
                          : o.paymentStatus === 'Partial'
                          ? 'text-sky-400'
                          : 'text-amber-400'
                      }`}
                    >
                      {o.paymentStatus === 'Paid'
                        ? 'Paid (100%)'
                        : o.paymentStatus === 'Partial'
                        ? `Partial (Adv: ৳${o.advancePayment})`
                        : 'Unpaid (COD)'}
                    </div>
                    {o.advancePayment && o.advancePayment > 0 ? (
                      <div className="text-[10px] text-emerald-400 font-medium">
                        COD: ৳{(o.codAmount ?? Math.max(0, o.amount - o.advancePayment)).toLocaleString()}
                      </div>
                    ) : (
                      <div className="text-[10px] text-slate-500 font-medium">
                        {o.paymentMethod || 'Cash on Delivery'}
                      </div>
                    )}
                  </div>
                </div>

                {/* Action Buttons */}
                <div
                  className="pt-2.5 border-t border-slate-800/80 flex items-center gap-2"
                  onClick={(e) => e.stopPropagation()}
                >
                  <Link
                    href={`/merchant/orders/${o.id}`}
                    className="flex-1 py-1.5 px-3 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors border border-slate-700/70"
                  >
                    <span>View Details</span>
                  </Link>

                  <Link
                    href={`/print/memo/${o.id}?memoCode=${encodeURIComponent(o.memoCode || 'MEMO-DEFAULT')}&customerName=${encodeURIComponent(o.customer)}&customerPhone=${encodeURIComponent(o.phone)}&customerAddress=${encodeURIComponent(o.address)}&codAmount=${o.amount}`}
                    className="py-1.5 px-3 rounded-lg bg-indigo-600/20 hover:bg-indigo-600/30 border border-indigo-500/40 text-indigo-300 text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors shrink-0"
                    title="Print 2-in-1 4x6 Thermal Memo Slip"
                  >
                    <Printer className="h-3.5 w-3.5" />
                    <span>Print Memo</span>
                  </Link>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Desktop Orders Data Table (hidden md:block) */}
        <div className="hidden md:block overflow-x-auto rounded-lg border border-slate-800">
          <table className="w-full min-w-[840px] text-left text-xs">
            <thead className="bg-slate-950/70 text-slate-400 uppercase tracking-wider font-semibold border-b border-slate-800">
              <tr>
                <th className="py-3.5 px-4">Order</th>
                <th className="py-3.5 px-4">Customer</th>
                <th className="py-3.5 px-4">Date</th>
                <th className="py-3.5 px-4">Amount</th>
                <th className="py-3.5 px-4">Payment</th>
                <th className="py-3.5 px-4">Delivery</th>
                <th className="py-3.5 px-4">Status</th>
                <th className="py-3.5 px-4 text-center">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/80 bg-slate-900/60">
              {paginatedOrders.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-500">
                    No orders found matching your filters.
                  </td>
                </tr>
              ) : (
                paginatedOrders.map((o) => (
                  <tr
                    key={o.id}
                    onClick={() => router.push(`/merchant/orders/${o.id}`)}
                    className="hover:bg-slate-800/50 cursor-pointer transition-colors group"
                  >
                    {/* ORDER ID & Items */}
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-2.5">
                        <div className="p-1.5 bg-slate-800 rounded text-slate-400 group-hover:text-emerald-400 group-hover:bg-slate-700/80 transition-colors">
                          <Package className="h-3.5 w-3.5" />
                        </div>
                        <div>
                          <span className="font-mono font-bold text-slate-200 group-hover:text-emerald-400 transition-colors block">
                            {o.orderNumber || `#${o.id}`}
                          </span>
                          <span className="text-[11px] text-slate-500 font-medium">
                            {o.qty || 1} {o.qty === 1 ? 'item' : 'items'}
                          </span>
                        </div>
                      </div>
                    </td>

                    {/* CUSTOMER */}
                    <td className="py-3.5 px-4">
                      <div className="font-semibold text-slate-200">{o.customer}</div>
                      <div className="text-[11px] font-mono text-slate-400">{o.phone}</div>
                    </td>

                    {/* DATE */}
                    <td className="py-3.5 px-4 text-slate-300 font-medium">{o.date}</td>

                    {/* AMOUNT */}
                    <td className="py-3.5 px-4">
                      <div className="font-bold text-slate-100">৳{Number(o.amount).toLocaleString()}</div>
                      {o.advancePayment && o.advancePayment > 0 ? (
                        <div className="text-[10px] text-emerald-400 font-medium">
                          COD: ৳{(o.codAmount ?? Math.max(0, o.amount - o.advancePayment)).toLocaleString()}
                        </div>
                      ) : null}
                    </td>

                    {/* PAYMENT */}
                    <td className="py-3.5 px-4">
                      <div className="text-slate-200 font-medium">{o.paymentMethod || 'Cash on Delivery'}</div>
                      <div
                        className={`text-[11px] font-semibold ${
                          o.paymentStatus === 'Paid'
                            ? 'text-emerald-400'
                            : o.paymentStatus === 'Partial'
                            ? 'text-sky-400'
                            : 'text-amber-400'
                        }`}
                      >
                        {o.paymentStatus === 'Paid'
                          ? 'Paid (100%)'
                          : o.paymentStatus === 'Partial'
                          ? `Partial (Adv: ৳${o.advancePayment})`
                          : 'Unpaid (COD)'}
                      </div>
                    </td>

                    {/* DELIVERY */}
                    <td className="py-3.5 px-4">
                      <div className="text-slate-200 font-semibold">{o.courier}</div>
                      <div className="text-[11px] text-slate-400">Charge: ৳{o.deliveryFee ?? 60}</div>
                    </td>

                    {/* STATUS */}
                    <td className="py-3.5 px-4">{getStatusBadge(o.status)}</td>

                    {/* ACTION */}
                    <td className="py-3.5 px-4 text-center" onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center justify-center gap-2">
                        <Link
                          href={`/print/memo/${o.id}?memoCode=${encodeURIComponent(o.memoCode || 'MEMO-DEFAULT')}&customerName=${encodeURIComponent(o.customer)}&customerPhone=${encodeURIComponent(o.phone)}&customerAddress=${encodeURIComponent(o.address)}&codAmount=${o.amount}`}
                          className="px-2.5 py-1 bg-indigo-600/20 hover:bg-indigo-600/30 border border-indigo-500/40 text-indigo-300 rounded text-[11px] font-semibold flex items-center gap-1 transition-colors cursor-pointer"
                          title="Print 2-in-1 4x6 Thermal Memo Slip"
                        >
                          <Printer className="h-3 w-3" />
                          <span>Print</span>
                        </Link>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Controls */}
        <div className="flex flex-col sm:flex-row justify-between items-center gap-3 pt-2 text-xs text-slate-400">
          <div className="text-center sm:text-left">
            Showing <span className="font-semibold text-slate-200">{filteredOrders.length === 0 ? 0 : (currentPage - 1) * pageSize + 1}</span> to{' '}
            <span className="font-semibold text-slate-200">
              {Math.min(currentPage * pageSize, filteredOrders.length)}
            </span>{' '}
            of <span className="font-semibold text-slate-200">{filteredOrders.length}</span> results
          </div>

          <div className="flex items-center gap-1.5 flex-wrap justify-center">
            <button
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 disabled:opacity-40 disabled:hover:bg-slate-800 text-slate-300 rounded-lg font-medium transition-colors cursor-pointer"
            >
              &lt; Previous
            </button>

            {/* Mobile simplified page indicator */}
            <span className="sm:hidden px-2 py-1 text-slate-300 font-semibold text-xs">
              {currentPage} / {totalPages}
            </span>

            {/* Desktop page number buttons */}
            <div className="hidden sm:flex items-center gap-1">
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                <button
                  key={page}
                  onClick={() => setCurrentPage(page)}
                  className={`h-7 w-7 rounded-lg font-semibold flex items-center justify-center transition-colors cursor-pointer ${
                    currentPage === page
                      ? 'bg-slate-100 text-slate-950 font-bold'
                      : 'bg-slate-800 hover:bg-slate-700 text-slate-300'
                  }`}
                >
                  {page}
                </button>
              ))}
            </div>

            <button
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 disabled:opacity-40 disabled:hover:bg-slate-800 text-slate-300 rounded-lg font-medium transition-colors cursor-pointer"
            >
              Next &gt;
            </button>
          </div>
        </div>
      </div>

      {/* Bottom Earnings Banner (matching Image 2) */}
      <div className="bg-emerald-950/40 border border-emerald-500/30 rounded-xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-3 text-emerald-300">
          <div className="p-1.5 bg-emerald-500/20 rounded-lg shrink-0">
            <Package className="h-4 w-4 text-emerald-400" />
          </div>
          <span>Orders marked as delivered are automatically added to your earnings report.</span>
        </div>
        <Link
          href="/merchant/billing"
          className="text-emerald-400 hover:text-emerald-300 font-semibold inline-flex items-center gap-1 shrink-0 transition-colors"
        >
          <span>View earnings</span>
          <span>&rarr;</span>
        </Link>
      </div>

      {/* Create Manual Order Modal */}
      <CreateManualOrderModal
        isOpen={isCreateOrderOpen}
        onClose={() => setIsCreateOrderOpen(false)}
        products={products}
        memoList={memoList}
        onCreateOrder={onCreateOrder}
        onTriggerToast={onTriggerToast}
      />
    </div>
  );
}
