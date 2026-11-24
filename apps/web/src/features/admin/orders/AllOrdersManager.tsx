'use client';

import React, { useState, useMemo, useEffect } from 'react';
import Link from 'next/link';
import {
  Boxes,
  CheckCircle2,
  Download,
  Layers,
  Plus,
  RotateCcw,
  Truck,
} from 'lucide-react';
import {
  AllOrdersStatusFilter,
  DateRangePreset,
  WarehousePipelineOrder,
  formatFullOrderDate,
  getOrderHistoryStatus,
  parseOrderDate,
} from './types';
import { INITIAL_PIPELINE_ORDERS, STORAGE_KEY_ORDERS } from './mockData';
import { AllOrdersFiltersBar } from './components/all/AllOrdersFiltersBar';
import { AllOrdersTable } from './components/all/AllOrdersTable';
import {
  AllOrdersProductsSummary,
  buildProductSummaryRows,
} from './components/all/AllOrdersProductsSummary';
import { CreateOrderModal } from './components/modals/CreateOrderModal';
import { MemoPreviewModal } from './components/modals/MemoPreviewModal';
import { IsolatedPrintPortal } from './components/print/IsolatedPrintPortal';
import {
  fetchOrdersFromDatabase,
  reconcileAdminOrdersWithMerchant,
  syncAdminOrdersToMerchant,
} from '@/lib/warehouseSync';

export interface AllOrdersManagerProps {
  initialSearch?: string;
  initialStatus?: AllOrdersStatusFilter;
  initialDateFrom?: string;
  initialDateTo?: string;
  initialView?: 'orders' | 'products';
}

function formatDateInputValue(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function computeDatesForPreset(preset: DateRangePreset): { from: string; to: string } {
  const now = new Date();
  const today = formatDateInputValue(now);

  switch (preset) {
    case 'TODAY':
      return { from: today, to: today };
    case 'YESTERDAY': {
      const d = new Date(now);
      d.setDate(d.getDate() - 1);
      const y = formatDateInputValue(d);
      return { from: y, to: y };
    }
    case 'LAST_7_DAYS': {
      const d = new Date(now);
      d.setDate(d.getDate() - 6);
      return { from: formatDateInputValue(d), to: today };
    }
    case 'LAST_30_DAYS': {
      const d = new Date(now);
      d.setDate(d.getDate() - 29);
      return { from: formatDateInputValue(d), to: today };
    }
    case 'THIS_MONTH': {
      const first = new Date(now.getFullYear(), now.getMonth(), 1);
      return { from: formatDateInputValue(first), to: today };
    }
    case 'ALL_TIME':
    default:
      return { from: '', to: '' };
  }
}

function toLocalBoundaryDate(yyyyMmDd: string, isEndOfDay: boolean): Date | null {
  if (!yyyyMmDd || !/^\d{4}-\d{2}-\d{2}$/.test(yyyyMmDd)) return null;
  const [y, m, d] = yyyyMmDd.split('-').map(Number);
  return isEndOfDay
    ? new Date(y, m - 1, d, 23, 59, 59, 999)
    : new Date(y, m - 1, d, 0, 0, 0, 0);
}

function escapeCsvCell(value: unknown): string {
  const str = String(value ?? '');
  return `"${str.replace(/"/g, '""')}"`;
}

export function AllOrdersManager({
  initialSearch = '',
  initialStatus = 'ALL',
  initialDateFrom = '',
  initialDateTo = '',
  initialView = 'orders',
}: AllOrdersManagerProps) {
  const [orders, setOrders] = useState<WarehousePipelineOrder[]>(INITIAL_PIPELINE_ORDERS);
  const [isLoading, setIsLoading] = useState(true);
  const [syncTick, setSyncTick] = useState(0);

  const [viewMode, setViewMode] = useState<'orders' | 'products'>(initialView);
  const [datePreset, setDatePreset] = useState<DateRangePreset>(
    initialDateFrom || initialDateTo ? 'CUSTOM' : 'ALL_TIME'
  );
  const [fromDate, setFromDate] = useState<string>(initialDateFrom);
  const [toDate, setToDate] = useState<string>(initialDateTo);

  const [searchQuery, setSearchQuery] = useState<string>(initialSearch);
  const [statusFilter, setStatusFilter] = useState<AllOrdersStatusFilter>(initialStatus);
  const [merchantFilter, setMerchantFilter] = useState<string>('ALL');
  const [courierFilter, setCourierFilter] = useState<string>('ALL');

  const [pageSize, setPageSize] = useState<number>(10);
  const [currentPage, setCurrentPage] = useState<number>(1);

  const [toast, setToast] = useState<string | null>(null);
  const [previewMemoOrder, setPreviewMemoOrder] = useState<WarehousePipelineOrder | null>(null);
  const [printMode, setPrintMode] = useState<'MEMOS' | null>(null);
  const [printingOrders, setPrintingOrders] = useState<WarehousePipelineOrder[]>([]);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  const handlePrintMemoOrder = (order: WarehousePipelineOrder) => {
    setPrintMode('MEMOS');
    setPrintingOrders([order]);
    if (typeof document !== 'undefined') {
      document.body.classList.add('printing-single-invoice');
      setTimeout(() => {
        window.print();
        document.body.classList.remove('printing-single-invoice');
        setPrintMode(null);
      }, 90);
    }
  };

  useEffect(() => {
    setSearchQuery(initialSearch);
  }, [initialSearch]);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3400);
  };

  // Subscribe to cross-tab / cross-module order sync events
  useEffect(() => {
    const handleSync = (e: Event) => {
      const customEvent = e as CustomEvent<{ source?: string }>;
      if (customEvent.detail?.source === 'AllOrdersManager') return;
      setSyncTick((t) => t + 1);
    };

    window.addEventListener('fulfillio-warehouse-sync', handleSync);
    window.addEventListener('storage', handleSync);
    return () => {
      window.removeEventListener('fulfillio-warehouse-sync', handleSync);
      window.removeEventListener('storage', handleSync);
    };
  }, []);

  // Fetch PostgreSQL orders for the active date range & merge reconciled local orders
  useEffect(() => {
    let isCancelled = false;

    const loadOrders = async () => {
      setIsLoading(true);
      const startBound = toLocalBoundaryDate(fromDate, false);
      const endBound = toLocalBoundaryDate(toDate, true);

      try {
        let baseOrders = INITIAL_PIPELINE_ORDERS;
        try {
          const stored = localStorage.getItem(STORAGE_KEY_ORDERS);
          if (stored) {
            const parsed = JSON.parse(stored);
            if (Array.isArray(parsed) && parsed.length > 0) {
              baseOrders = parsed;
            }
          }
        } catch {
          // ignore localStorage read errors
        }
        const reconciled = reconcileAdminOrdersWithMerchant(baseOrders);

        const dbOrders = await fetchOrdersFromDatabase({
          dateFrom: startBound ? startBound.toISOString() : undefined,
          dateTo: endBound ? endBound.toISOString() : undefined,
          limit: 500,
        });

        if (isCancelled) return;

        const merged: WarehousePipelineOrder[] = [...dbOrders];
        for (const r of reconciled) {
          const rClean = (r.id || '').replace(/^#/, '');
          if (merged.some((m) => m.id === r.id || m.id === rClean)) continue;

          if (startBound || endBound) {
            const parsed = parseOrderDate(r);
            if (!parsed) continue;
            if (startBound && parsed < startBound) continue;
            if (endBound && parsed > endBound) continue;
          }
          merged.push(r);
        }

        merged.sort((a, b) => {
          const da = parseOrderDate(a)?.getTime() || 0;
          const db = parseOrderDate(b)?.getTime() || 0;
          return db - da;
        });

        setOrders(merged);
      } catch (err) {
        console.warn('[AllOrdersManager] Failed to load orders:', err);
      } finally {
        if (!isCancelled) {
          setIsLoading(false);
        }
      }
    };

    loadOrders();
    return () => {
      isCancelled = true;
    };
  }, [fromDate, toDate, syncTick]);

  // Reset pagination whenever filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [
    viewMode,
    datePreset,
    fromDate,
    toDate,
    searchQuery,
    statusFilter,
    merchantFilter,
    courierFilter,
    pageSize,
  ]);

  const handleDatePresetChange = (preset: DateRangePreset) => {
    setDatePreset(preset);
    if (preset !== 'CUSTOM') {
      const next = computeDatesForPreset(preset);
      setFromDate(next.from);
      setToDate(next.to);
    }
  };

  const handleFromDateChange = (val: string) => {
    setFromDate(val);
    setDatePreset(val || toDate ? 'CUSTOM' : 'ALL_TIME');
  };

  const handleToDateChange = (val: string) => {
    setToDate(val);
    setDatePreset(fromDate || val ? 'CUSTOM' : 'ALL_TIME');
  };

  const handleResetFilters = () => {
    setDatePreset('ALL_TIME');
    setFromDate('');
    setToDate('');
    setSearchQuery('');
    setStatusFilter('ALL');
    setMerchantFilter('ALL');
    setCourierFilter('ALL');
  };

  const merchants = useMemo(() => {
    const map = new Map<string, string>();
    for (const o of orders) {
      if (o.merchantCode) {
        map.set(o.merchantCode, o.merchantName || o.merchantCode);
      }
    }
    return Array.from(map.entries())
      .map(([code, name]) => ({ code, name }))
      .sort((a, b) => a.code.localeCompare(b.code));
  }, [orders]);

  const filteredOrders = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    const startBound = toLocalBoundaryDate(fromDate, false);
    const endBound = toLocalBoundaryDate(toDate, true);

    return orders.filter((o) => {
      if (startBound || endBound) {
        const parsed = parseOrderDate(o);
        if (!parsed) return false;
        if (startBound && parsed < startBound) return false;
        if (endBound && parsed > endBound) return false;
      }

      if (merchantFilter !== 'ALL' && o.merchantCode !== merchantFilter) return false;

      if (courierFilter === 'UNASSIGNED') {
        if (o.courier) return false;
      } else if (courierFilter !== 'ALL' && o.courier !== courierFilter) {
        return false;
      }

      if (statusFilter !== 'ALL' && getOrderHistoryStatus(o) !== statusFilter) {
        return false;
      }

      if (q) {
        const matchesItems =
          o.items &&
          o.items.some(
            (it) =>
              it.sku.toLowerCase().includes(q) || it.title.toLowerCase().includes(q)
          );
        const matchesCore =
          o.id.toLowerCase().includes(q) ||
          o.customerName.toLowerCase().includes(q) ||
          o.customerPhone.includes(searchQuery.trim()) ||
          o.sku.toLowerCase().includes(q) ||
          (o.productTitle && o.productTitle.toLowerCase().includes(q)) ||
          (o.trackingCode && o.trackingCode.toLowerCase().includes(q)) ||
          o.memoCode.toLowerCase().includes(q) ||
          o.merchantName.toLowerCase().includes(q);
        if (!matchesCore && !matchesItems) return false;
      }

      return true;
    });
  }, [orders, fromDate, toDate, merchantFilter, courierFilter, statusFilter, searchQuery]);

  const productSummaryRows = useMemo(
    () => buildProductSummaryRows(filteredOrders),
    [filteredOrders]
  );

  const kpis = useMemo(() => {
    let totalUnits = 0;
    let totalValue = 0;
    let inPipeline = 0;
    let delivered = 0;
    let cancelledReturned = 0;

    for (const o of filteredOrders) {
      totalUnits += Math.max(1, o.qty || 1);
      totalValue += Number(o.codAmount) || 0;
      const st = getOrderHistoryStatus(o);
      if (st === 'HANDED_OVER') delivered += 1;
      else if (st === 'CANCELLED' || st === 'RETURNED') cancelledReturned += 1;
      else inPipeline += 1;
    }

    return {
      totalOrders: filteredOrders.length,
      totalUnits,
      totalValue,
      inPipeline,
      delivered,
      cancelledReturned,
    };
  }, [filteredOrders]);

  const totalItems = filteredOrders.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  const safePage = Math.min(Math.max(1, currentPage), totalPages);
  const startIndex = (safePage - 1) * pageSize;
  const paginatedOrders = filteredOrders.slice(startIndex, startIndex + pageSize);

  const handleExportCsv = () => {
    let csvContent = '';
    let filename = '';

    if (viewMode === 'products') {
      const headers = [
        'SKU',
        'Product Title',
        'Variant',
        'Merchant',
        'Orders Count',
        'Total Units',
        'In Pipeline Units',
        'Delivered Units',
        'Cancelled/Returned Units',
        'Gross Value (BDT)',
        'Last Ordered Date',
      ];
      const rows = productSummaryRows.map((p) => [
        p.sku,
        p.title,
        `${p.color} / ${p.size}`,
        p.merchantName,
        p.ordersCount,
        p.totalQty,
        p.pipelineQty,
        p.deliveredQty,
        p.cancelledReturnedQty,
        p.grossValue,
        p.lastOrderedLabel,
      ]);
      csvContent = [headers, ...rows]
        .map((row) => row.map(escapeCsvCell).join(','))
        .join('\n');
      filename = `fulfillio-ordered-products-${formatDateInputValue(new Date())}.csv`;
    } else {
      const headers = [
        'Order ID',
        'Date',
        'Merchant',
        'SKUs',
        'Products',
        'Total Qty',
        'Memo Code',
        'Customer',
        'Phone',
        'Address',
        'Courier',
        'Tracking Code',
        'Amount (BDT)',
        'Payment Status',
        'Order Status',
      ];
      const rows = filteredOrders.map((o) => {
        const skus =
          o.items && o.items.length > 0
            ? o.items.map((it) => `${it.sku} (x${it.qty})`).join('; ')
            : `${o.sku} (x${o.qty})`;
        const products =
          o.items && o.items.length > 0
            ? o.items.map((it) => it.title).join('; ')
            : o.productTitle;
        return [
          o.id,
          formatFullOrderDate(o).full,
          o.merchantName,
          skus,
          products,
          o.qty,
          o.memoCode,
          o.customerName,
          o.customerPhone,
          o.customerAddress || o.city,
          o.courier || 'Unassigned',
          o.trackingCode || '',
          o.codAmount,
          o.paymentStatus || 'Unpaid',
          getOrderHistoryStatus(o),
        ];
      });
      csvContent = [headers, ...rows]
        .map((row) => row.map(escapeCsvCell).join(','))
        .join('\n');
      filename = `fulfillio-all-orders-${formatDateInputValue(new Date())}.csv`;
    }

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    showToast(`Exported ${viewMode === 'products' ? productSummaryRows.length : filteredOrders.length} row(s) to CSV.`);
  };

  const handleCreateOrder = (newOrder: WarehousePipelineOrder) => {
    setOrders((prev) => [newOrder, ...prev]);
    try {
      const raw = localStorage.getItem(STORAGE_KEY_ORDERS);
      const existing: WarehousePipelineOrder[] = raw ? JSON.parse(raw) : [];
      const nextStored = [
        newOrder,
        ...(Array.isArray(existing) ? existing.filter((o) => o.id !== newOrder.id) : []),
      ];
      localStorage.setItem(STORAGE_KEY_ORDERS, JSON.stringify(nextStored));
      syncAdminOrdersToMerchant(nextStored);
      window.dispatchEvent(
        new CustomEvent('fulfillio-warehouse-sync', {
          detail: { source: 'AllOrdersManager' },
        })
      );
    } catch (e) {
      console.error('Failed to persist newly created order:', e);
    }
    showToast(`Order ${newOrder.id} created & sent to 1. Pick List!`);
  };

  const kpiCards = [
    {
      label: 'Total Orders',
      value: kpis.totalOrders,
      subtitle: `${kpis.totalUnits.toLocaleString()} units · ৳ ${kpis.totalValue.toLocaleString()}`,
      icon: Boxes,
      container:
        'border-orange-500/25 bg-gradient-to-br from-orange-500/10 via-white dark:via-navy-900 to-transparent',
      iconBox:
        'bg-orange-500/10 text-orange-600 dark:text-orange-400 border border-orange-500/30',
      subClass: 'text-orange-600 dark:text-orange-400',
    },
    {
      label: 'In Pipeline',
      value: kpis.inPipeline,
      subtitle: 'Pick, Pack & Dispatch queue',
      icon: Layers,
      container:
        'border-indigo-500/25 bg-gradient-to-br from-indigo-500/10 via-white dark:via-navy-900 to-transparent',
      iconBox:
        'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/30',
      subClass: 'text-indigo-600 dark:text-indigo-400',
    },
    {
      label: 'Handed Over / Delivered',
      value: kpis.delivered,
      subtitle: 'Completed courier handovers',
      icon: Truck,
      container:
        'border-emerald-500/25 bg-gradient-to-br from-emerald-500/10 via-white dark:via-navy-900 to-transparent',
      iconBox:
        'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30',
      subClass: 'text-emerald-600 dark:text-emerald-400',
    },
    {
      label: 'Cancelled / Returned',
      value: kpis.cancelledReturned,
      subtitle: 'Exceptions & reverse logistics',
      icon: RotateCcw,
      container:
        'border-rose-500/25 bg-gradient-to-br from-rose-500/10 via-white dark:via-navy-900 to-transparent',
      iconBox:
        'bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/30',
      subClass: 'text-rose-600 dark:text-rose-400',
    },
  ];

  return (
    <div className="space-y-6">
      {toast && (
        <div className="fixed top-6 right-6 z-50 bg-orange-600 text-white px-4 py-3 rounded-xl shadow-2xl flex items-center gap-2 text-xs font-bold animate-in fade-in">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>{toast}</span>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-navy-900 dark:text-white">
            All Orders
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Complete order history across all statuses with date-range filtering and ordered product lookup.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Link
            href="/admin/orders"
            className="px-3.5 py-2.5 rounded-xl bg-white dark:bg-navy-900 hover:bg-slate-100 dark:hover:bg-navy-800 border border-slate-200 dark:border-white/10 text-xs font-semibold text-navy-800 dark:text-slate-100 flex items-center gap-1.5 shadow-2xs transition-colors"
          >
            <Layers className="h-4 w-4 text-orange-600 dark:text-orange-400" />
            <span>Order Pipeline</span>
          </Link>

          <button
            type="button"
            onClick={handleExportCsv}
            className="px-3.5 py-2.5 rounded-xl bg-white dark:bg-navy-900 hover:bg-slate-100 dark:hover:bg-navy-800 border border-slate-200 dark:border-white/10 text-xs font-semibold text-navy-800 dark:text-slate-100 flex items-center gap-1.5 shadow-2xs transition-colors cursor-pointer"
          >
            <Download className="h-4 w-4 text-orange-600 dark:text-orange-400" />
            <span>Export CSV</span>
          </button>

          <button
            type="button"
            onClick={() => setIsCreateModalOpen(true)}
            className="px-4 py-2.5 bg-orange-600 hover:bg-orange-500 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-2 shadow-md shadow-orange-500/20 transition-all cursor-pointer active:scale-95"
          >
            <Plus className="h-4 w-4" />
            <span>Create Order</span>
          </button>
        </div>
      </div>

      {/* 4 Summary KPI Cards (Read-Only) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
        {kpiCards.map((card) => {
          const Icon = card.icon;
          return (
            <div
              key={card.label}
              className={`rounded-2xl border p-5 sm:p-6 flex items-center justify-between gap-4 shadow-sm select-none ${card.container}`}
            >
              <div className="space-y-1.5 min-w-0 flex-1">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 block truncate">
                  {card.label}
                </span>
                <div className="text-2xl sm:text-3xl font-black text-navy-900 dark:text-white mt-1 tabular-nums tracking-tight">
                  {card.value.toLocaleString()}
                </div>
                <span className={`text-xs font-semibold mt-1 block truncate ${card.subClass}`}>
                  {card.subtitle}
                </span>
              </div>
              <div
                className={`h-12 w-12 rounded-2xl flex items-center justify-center shrink-0 shadow-xs ${card.iconBox}`}
              >
                <Icon className="w-6 h-6" />
              </div>
            </div>
          );
        })}
      </div>

      {/* Filters, Date Range & View Switcher */}
      <AllOrdersFiltersBar
        viewMode={viewMode}
        onViewModeChange={setViewMode}
        ordersCount={filteredOrders.length}
        uniqueProductsCount={productSummaryRows.length}
        totalUnitsCount={kpis.totalUnits}
        datePreset={datePreset}
        onDatePresetChange={handleDatePresetChange}
        fromDate={fromDate}
        toDate={toDate}
        onFromDateChange={handleFromDateChange}
        onToDateChange={handleToDateChange}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        statusFilter={statusFilter}
        onStatusFilterChange={setStatusFilter}
        merchantFilter={merchantFilter}
        onMerchantFilterChange={setMerchantFilter}
        merchants={merchants}
        courierFilter={courierFilter}
        onCourierFilterChange={setCourierFilter}
        onResetFilters={handleResetFilters}
      />

      {/* Active Search Banner */}
      {searchQuery && (
        <div className="flex items-center justify-between gap-3 px-4 py-2.5 rounded-xl bg-orange-500/10 border border-orange-500/25 text-xs text-navy-900 dark:text-slate-100 shadow-2xs">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-bold text-orange-600 dark:text-orange-400">
              Filtering All Orders for query / SKU:
            </span>
            <span className="font-mono font-bold px-2.5 py-0.5 rounded-md bg-white dark:bg-navy-800 text-orange-600 dark:text-orange-400 border border-orange-500/30">
              {searchQuery}
            </span>
            <span className="text-slate-500 dark:text-slate-400">
              ({filteredOrders.length} order{filteredOrders.length === 1 ? '' : 's'} ·{' '}
              {productSummaryRows.length} product{productSummaryRows.length === 1 ? '' : 's'})
            </span>
          </div>
          <button
            type="button"
            onClick={() => setSearchQuery('')}
            className="px-2.5 py-1 rounded-lg bg-white dark:bg-navy-800 hover:bg-slate-100 dark:hover:bg-navy-700 border border-slate-200 dark:border-white/10 text-xs font-semibold text-slate-700 dark:text-slate-200 transition-colors cursor-pointer shrink-0"
          >
            Clear Filter
          </button>
        </div>
      )}

      {/* Main Content View */}
      {viewMode === 'orders' ? (
        <AllOrdersTable
          orders={paginatedOrders}
          totalItems={totalItems}
          startIndex={startIndex}
          pageSize={pageSize}
          safePage={safePage}
          totalPages={totalPages}
          onPageSizeChange={setPageSize}
          onPageChange={setCurrentPage}
          onPreviewMemo={(ord) => setPreviewMemoOrder(ord)}
          isLoading={isLoading}
        />
      ) : (
        <AllOrdersProductsSummary
          orders={filteredOrders}
          onFilterBySku={(sku) => {
            setSearchQuery(sku);
            setViewMode('orders');
          }}
        />
      )}

      {/* Modals & Print Portal */}
      <CreateOrderModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        ordersCount={orders.length}
        onCreateOrder={handleCreateOrder}
      />

      <MemoPreviewModal
        isOpen={Boolean(previewMemoOrder)}
        onClose={() => setPreviewMemoOrder(null)}
        order={previewMemoOrder}
        onPrint={() => {
          if (previewMemoOrder) handlePrintMemoOrder(previewMemoOrder);
        }}
      />

      <IsolatedPrintPortal printMode={printMode} orders={printingOrders} />
    </div>
  );
}

export default AllOrdersManager;
