import React, { useState, useMemo } from 'react';
import {
  Search,
  Calendar,
  RotateCcw,
  Truck,
  RotateCcw as ResetIcon,
  Package,
} from 'lucide-react';
import { StatusBadge } from '@/components/ui/StatusBadge';
import {
  MerchantRecord,
  MerchantOrderItem,
  OrderPeriodFilter,
  PERIOD_FILTER_OPTIONS,
  PERIOD_RANK,
} from '../../types';

export interface MerchantOrdersTabProps {
  merchant: MerchantRecord;
  allOrders: MerchantOrderItem[];
  defaultStatusFilter?: string;
}

export function MerchantOrdersTab({
  merchant,
  allOrders,
  defaultStatusFilter = 'ALL',
}: MerchantOrdersTabProps) {
  const [orderSearch, setOrderSearch] = useState('');
  const [orderStatusFilter, setOrderStatusFilter] = useState(defaultStatusFilter);
  const [orderPeriodFilter, setOrderPeriodFilter] = useState<OrderPeriodFilter>('ALL');
  const [orderStartDate, setOrderStartDate] = useState('');
  const [orderEndDate, setOrderEndDate] = useState('');

  // Unique order dates for this merchant for quick selection
  const availableOrderDates = useMemo(() => {
    const map = new Map<string, { isoDate: string; label: string; count: number }>();
    allOrders
      .filter((o) => o.merchantCode === merchant.merchantCode)
      .forEach((ord) => {
        const existing = map.get(ord.isoDate);
        if (existing) {
          existing.count += 1;
        } else {
          map.set(ord.isoDate, {
            isoDate: ord.isoDate,
            label: ord.date.split(',')[0] || ord.isoDate,
            count: 1,
          });
        }
      });
    return Array.from(map.values()).sort((a, b) => b.isoDate.localeCompare(a.isoDate));
  }, [allOrders, merchant.merchantCode]);

  // Orders pool scoped to merchant
  const periodFilteredPool = useMemo(() => {
    const maxRank = PERIOD_RANK[orderPeriodFilter];
    return allOrders.filter(
      (ord) =>
        ord.merchantCode === merchant.merchantCode &&
        PERIOD_RANK[ord.periodBucket] <= maxRank,
    );
  }, [allOrders, merchant.merchantCode, orderPeriodFilter]);

  // Final filtered list with date range, search and status
  const filteredOrders = useMemo(() => {
    const hasCustomDate = Boolean(orderStartDate || orderEndDate);
    const basePool = hasCustomDate
      ? allOrders.filter((ord) => ord.merchantCode === merchant.merchantCode)
      : periodFilteredPool;

    return basePool.filter((ord) => {
      const q = orderSearch.trim().toLowerCase();
      const matchesSearch =
        !q ||
        ord.id.toLowerCase().includes(q) ||
        ord.customer.toLowerCase().includes(q) ||
        ord.phone.includes(q) ||
        ord.sku.toLowerCase().includes(q);

      const matchesStatus =
        orderStatusFilter === 'ALL'
          ? true
          : orderStatusFilter === 'PENDING_FULFILLMENT'
            ? ord.status === 'ALLOCATED' || ord.status === 'PICKING' || ord.status === 'PACKED'
            : ord.status === orderStatusFilter;

      let matchesDate = true;
      if (orderStartDate && orderEndDate) {
        const minD = orderStartDate <= orderEndDate ? orderStartDate : orderEndDate;
        const maxD = orderStartDate <= orderEndDate ? orderEndDate : orderStartDate;
        matchesDate = ord.isoDate >= minD && ord.isoDate <= maxD;
      } else if (orderStartDate && !orderEndDate) {
        const hasExactMatch = basePool.some((o) => o.isoDate === orderStartDate);
        matchesDate = hasExactMatch
          ? ord.isoDate === orderStartDate
          : ord.isoDate >= orderStartDate;
      } else if (!orderStartDate && orderEndDate) {
        matchesDate = ord.isoDate <= orderEndDate;
      }

      return matchesSearch && matchesStatus && matchesDate;
    });
  }, [
    allOrders,
    merchant.merchantCode,
    periodFilteredPool,
    orderSearch,
    orderStatusFilter,
    orderStartDate,
    orderEndDate,
  ]);

  const handleResetFilters = () => {
    setOrderSearch('');
    setOrderStatusFilter('ALL');
    setOrderPeriodFilter('ALL');
    setOrderStartDate('');
    setOrderEndDate('');
  };

  const isFiltered = Boolean(
    orderSearch ||
      orderStatusFilter !== 'ALL' ||
      orderPeriodFilter !== 'ALL' ||
      orderStartDate ||
      orderEndDate,
  );

  return (
    <div className="space-y-4">
      {/* Filters Bar */}
      <div className="rounded-2xl border border-slate-200 dark:border-white/10 bg-white/90 dark:bg-navy-900/90 p-4 space-y-3 shadow-lg">
        {/* Top: 7-Range Period Pills */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-slate-700 dark:text-slate-200">Period:</span>
            <div className="inline-flex flex-wrap items-center gap-1 rounded-xl bg-slate-50 dark:bg-navy-950 p-1 border border-slate-200 dark:border-white/10">
              {PERIOD_FILTER_OPTIONS.map((item) => {
                const active = orderPeriodFilter === item.id;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => {
                      setOrderPeriodFilter(item.id);
                      setOrderStartDate('');
                      setOrderEndDate('');
                    }}
                    className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                      active
                        ? 'bg-orange-600 text-white shadow-sm'
                        : 'text-slate-600 dark:text-slate-300 hover:text-white hover:bg-slate-100/60 dark:hover:bg-navy-800/60'
                    }`}
                  >
                    {item.label}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="text-xs tabular-nums text-slate-700 dark:text-slate-200">
            Total COD:{' '}
            <strong className="text-orange-600 dark:text-orange-400">
              ৳ {filteredOrders.reduce((sum, o) => sum + o.amount, 0).toLocaleString()}
            </strong>
          </div>
        </div>

        {/* Bottom Filter Controls: Search + Status + Jump to Date + Range Picker + Reset */}
        <div className="flex flex-wrap items-center gap-2.5 pt-3 border-t border-slate-200/80 dark:border-white/10">
          {/* Search */}
          <div className="relative flex-1 min-w-[180px]">
            <Search className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              value={orderSearch}
              onChange={(e) => setOrderSearch(e.target.value)}
              placeholder="Search Order ID, Customer, Phone, SKU..."
              className="w-full pl-8 pr-3 py-1.5 rounded-xl bg-slate-50 dark:bg-navy-950 border border-slate-200 dark:border-white/10 text-xs text-navy-800 dark:text-white placeholder-slate-500 dark:placeholder-slate-400 focus:outline-none focus:border-orange-500 tabular-nums"
            />
          </div>

          {/* Status Dropdown */}
          <select
            value={orderStatusFilter}
            onChange={(e) => setOrderStatusFilter(e.target.value)}
            className="px-3 py-1.5 rounded-xl bg-slate-50 dark:bg-navy-950 border border-slate-200 dark:border-white/10 text-xs text-navy-800 dark:text-slate-100 focus:outline-none focus:border-orange-500"
          >
            <option value="ALL">All Status</option>
            <option value="PENDING_FULFILLMENT">Pending Fulfillment</option>
            <option value="ALLOCATED">Allocated</option>
            <option value="PICKING">Picking</option>
            <option value="PACKED">Packed</option>
            <option value="DISPATCHED">In Delivery</option>
            <option value="DELIVERED">Delivered</option>
            <option value="CANCELLED">Cancelled</option>
          </select>

          {/* Jump to Order Date */}
          <select
            value={orderStartDate && orderStartDate === orderEndDate ? orderStartDate : ''}
            onChange={(e) => {
              const val = e.target.value;
              if (!val) {
                setOrderStartDate('');
                setOrderEndDate('');
              } else {
                setOrderStartDate(val);
                setOrderEndDate(val);
              }
            }}
            className="px-3 py-1.5 rounded-xl bg-slate-50 dark:bg-navy-950 border border-slate-200 dark:border-white/10 text-xs text-orange-600 dark:text-orange-400 font-semibold focus:outline-none focus:border-orange-500"
          >
            <option value="">Jump to Date...</option>
            {availableOrderDates.map((d) => (
              <option key={d.isoDate} value={d.isoDate}>
                {d.label} ({d.count} orders)
              </option>
            ))}
          </select>

          {/* Date Range Picker */}
          <div className="flex items-center gap-1.5 rounded-xl bg-slate-50 dark:bg-navy-950 border border-slate-200 dark:border-white/10 px-2.5 py-1">
            <Calendar className="w-3.5 h-3.5 text-orange-600 dark:text-orange-400 shrink-0" />
            <span className="text-xs text-slate-600 dark:text-slate-300 font-medium">From:</span>
            <input
              type="date"
              style={{ colorScheme: 'dark' }}
              value={orderStartDate}
              onChange={(e) => setOrderStartDate(e.target.value)}
              className="bg-transparent text-xs text-navy-800 dark:text-slate-100 focus:outline-none tabular-nums"
            />
            <span className="text-slate-400 dark:text-slate-500">→</span>
            <span className="text-xs text-slate-600 dark:text-slate-300 font-medium">To:</span>
            <input
              type="date"
              style={{ colorScheme: 'dark' }}
              value={orderEndDate}
              onChange={(e) => setOrderEndDate(e.target.value)}
              className="bg-transparent text-xs text-navy-800 dark:text-slate-100 focus:outline-none tabular-nums"
            />
          </div>

          {/* Reset Button */}
          {isFiltered && (
            <button
              type="button"
              onClick={handleResetFilters}
              className="px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-navy-800 hover:bg-slate-200 dark:hover:bg-navy-700 border border-slate-300 dark:border-white/15 text-xs font-semibold text-navy-800 dark:text-slate-100 flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5 text-orange-600 dark:text-orange-400" />
              <span>Reset</span>
            </button>
          )}
        </div>

        {/* Filter Summary Badge */}
        <div className="text-xs text-slate-600 dark:text-slate-300 pt-1">
          Showing <strong className="text-navy-800 dark:text-white">{filteredOrders.length}</strong> orders for{' '}
          <strong className="text-orange-600 dark:text-orange-400">{merchant.storeName}</strong>
        </div>
      </div>

      {/* Orders Table */}
      <div className="rounded-2xl border border-slate-200 dark:border-white/10 bg-white dark:bg-navy-900 shadow-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50/80 dark:bg-navy-950/80 text-slate-600 dark:text-slate-300 uppercase tracking-wider font-bold border-b border-slate-200 dark:border-white/10 text-xs">
              <tr>
                <th className="p-4">Order ID &amp; Date</th>
                <th className="p-4">Customer</th>
                <th className="p-4">Product &amp; SKU</th>
                <th className="p-4">Memo Code</th>
                <th className="p-4">Courier</th>
                <th className="p-4">Status</th>
                <th className="p-4 text-right">COD Amount</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200/80 dark:divide-white/10">
              {filteredOrders.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-slate-600 dark:text-slate-300">
                    No orders match your filter criteria.
                  </td>
                </tr>
              ) : (
                filteredOrders.map((ord) => (
                  <tr key={ord.id} className="hover:bg-slate-100/40 dark:hover:bg-navy-800/40 transition-colors">
                    <td className="p-4">
                      <span className="tabular-nums text-xs font-bold text-navy-800 dark:text-white block">
                        {ord.id}
                      </span>
                      <span className="text-xs text-slate-600 dark:text-slate-300">{ord.date}</span>
                    </td>
                    <td className="p-4 space-y-0.5">
                      <div className="font-bold text-navy-800 dark:text-slate-100">{ord.customer}</div>
                      <div className="text-xs text-slate-600 dark:text-slate-300 tabular-nums">{ord.phone}</div>
                    </td>
                    <td className="p-4">
                      <div className="font-medium text-navy-800 dark:text-white">{ord.items}</div>
                      <div className="text-xs tabular-nums text-orange-600 dark:text-orange-400">
                        {ord.sku} (Qty: {ord.qty})
                      </div>
                    </td>
                    <td className="p-4">
                      <span className="tabular-nums text-xs px-2 py-0.5 rounded bg-slate-50 dark:bg-navy-950 text-orange-700 dark:text-orange-300 border border-slate-200 dark:border-white/10">
                        {ord.memoCode}
                      </span>
                    </td>
                    <td className="p-4 font-bold text-slate-700 dark:text-slate-200">{ord.courier}</td>
                    <td className="p-4">
                      <StatusBadge status={ord.status} />
                    </td>
                    <td className="p-4 text-right tabular-nums font-bold text-navy-800 dark:text-white">
                      ৳{ord.amount.toLocaleString()}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
