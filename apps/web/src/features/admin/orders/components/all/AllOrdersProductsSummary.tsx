'use client';

import React, { useMemo, useState } from 'react';
import { ArrowUpRight, Package } from 'lucide-react';
import {
  OrderItem,
  WarehousePipelineOrder,
  getOrderHistoryStatus,
  parseOrderDate,
} from '../../types';

export interface ProductSummaryRow {
  skuKey: string;
  sku: string;
  title: string;
  image: string;
  color: string;
  size: string;
  merchantName: string;
  ordersCount: number;
  totalQty: number;
  pipelineQty: number;
  deliveredQty: number;
  cancelledReturnedQty: number;
  grossValue: number;
  lastOrderedDate: Date | null;
  lastOrderedLabel: string;
}

type ProductSortOption = 'QTY_DESC' | 'VALUE_DESC' | 'RECENT_DESC' | 'ORDERS_DESC';

interface AllOrdersProductsSummaryProps {
  orders: WarehousePipelineOrder[];
  onFilterBySku: (sku: string) => void;
}

export function buildProductSummaryRows(
  orders: WarehousePipelineOrder[]
): ProductSummaryRow[] {
  const map = new Map<
    string,
    {
      skuKey: string;
      sku: string;
      title: string;
      image: string;
      color: string;
      size: string;
      merchantName: string;
      orderIds: Set<string>;
      totalQty: number;
      pipelineQty: number;
      deliveredQty: number;
      cancelledReturnedQty: number;
      grossValue: number;
      lastOrderedDate: Date | null;
      lastOrderedFallback: string;
    }
  >();

  for (const order of orders) {
    const status = getOrderHistoryStatus(order);
    const isPipeline =
      status === 'PICK' ||
      status === 'WAITING' ||
      status === 'PACK' ||
      status === 'DISPATCH' ||
      status === 'COURIER_BOOKED';
    const isDelivered = status === 'HANDED_OVER';
    const isCancelledReturned = status === 'CANCELLED' || status === 'RETURNED';
    const parsedDate = parseOrderDate(order);

    const lineItems: OrderItem[] =
      order.items && order.items.length > 0
        ? order.items
        : [
            {
              sku: order.sku || 'SKU-001',
              title: (order.productTitle || 'Warehouse Item')
                .replace(/\s*\(\+\d+\s*more\)/gi, '')
                .replace(/\s*\+\s*\d+\s*more/gi, '')
                .trim(),
              image: order.productImage || '',
              color: order.color || 'Standard',
              size: order.size || 'Standard',
              qty: order.qty || 1,
              unitPrice: 0,
              bin: order.bin || 'A-01-01',
            },
          ];

    for (const item of lineItems) {
      const displaySku = (item.sku || order.sku || 'SKU-001').trim();
      const skuKey = (
        displaySku || `${item.title}|${item.color}|${item.size}`
      ).toUpperCase();
      const itemQty = Math.max(1, Number(item.qty) || 1);
      const itemValue =
        Number(item.unitPrice) > 0
          ? Number(item.unitPrice) * itemQty
          : lineItems.length === 1
          ? Number(order.codAmount) || 0
          : 0;

      const existing = map.get(skuKey);
      if (!existing) {
        map.set(skuKey, {
          skuKey,
          sku: displaySku,
          title: item.title || 'Warehouse Item',
          image: item.image || order.productImage || '',
          color: item.color || 'Standard',
          size: item.size || 'Standard',
          merchantName: order.merchantName || order.merchantCode || 'Merchant',
          orderIds: new Set([order.id]),
          totalQty: itemQty,
          pipelineQty: isPipeline ? itemQty : 0,
          deliveredQty: isDelivered ? itemQty : 0,
          cancelledReturnedQty: isCancelledReturned ? itemQty : 0,
          grossValue: itemValue,
          lastOrderedDate: parsedDate,
          lastOrderedFallback: order.createdAt || 'Today',
        });
      } else {
        existing.orderIds.add(order.id);
        existing.totalQty += itemQty;
        if (isPipeline) existing.pipelineQty += itemQty;
        if (isDelivered) existing.deliveredQty += itemQty;
        if (isCancelledReturned) existing.cancelledReturnedQty += itemQty;
        existing.grossValue += itemValue;
        if (!existing.image && (item.image || order.productImage)) {
          existing.image = item.image || order.productImage || '';
        }
        if (
          parsedDate &&
          (!existing.lastOrderedDate || parsedDate > existing.lastOrderedDate)
        ) {
          existing.lastOrderedDate = parsedDate;
          existing.lastOrderedFallback = order.createdAt;
        }
      }
    }
  }

  return Array.from(map.values()).map((entry) => ({
    skuKey: entry.skuKey,
    sku: entry.sku,
    title: entry.title,
    image: entry.image,
    color: entry.color,
    size: entry.size,
    merchantName: entry.merchantName,
    ordersCount: entry.orderIds.size,
    totalQty: entry.totalQty,
    pipelineQty: entry.pipelineQty,
    deliveredQty: entry.deliveredQty,
    cancelledReturnedQty: entry.cancelledReturnedQty,
    grossValue: entry.grossValue,
    lastOrderedDate: entry.lastOrderedDate,
    lastOrderedLabel: entry.lastOrderedDate
      ? entry.lastOrderedDate.toLocaleDateString('en-US', {
          month: 'short',
          day: 'numeric',
          year: 'numeric',
        })
      : entry.lastOrderedFallback,
  }));
}

function SummaryThumb({ src, alt }: { src?: string; alt: string }) {
  const [hasError, setHasError] = useState(false);

  if (!src || hasError) {
    return (
      <div className="h-10 w-10 rounded-xl bg-slate-100 dark:bg-navy-800 border border-slate-200 dark:border-white/10 flex items-center justify-center shrink-0 text-slate-400 dark:text-slate-500">
        <Package className="w-4 h-4" />
      </div>
    );
  }

  return (
    <img
      src={src}
      alt={alt}
      onError={() => setHasError(true)}
      className="h-10 w-10 rounded-xl object-cover border border-slate-200 dark:border-white/10 shrink-0 bg-slate-100 dark:bg-navy-800"
    />
  );
}

export function AllOrdersProductsSummary({
  orders,
  onFilterBySku,
}: AllOrdersProductsSummaryProps) {
  const [sortBy, setSortBy] = useState<ProductSortOption>('QTY_DESC');

  const rows = useMemo(() => {
    const base = buildProductSummaryRows(orders);
    return [...base].sort((a, b) => {
      switch (sortBy) {
        case 'VALUE_DESC':
          return b.grossValue - a.grossValue || b.totalQty - a.totalQty;
        case 'RECENT_DESC':
          return (
            (b.lastOrderedDate?.getTime() || 0) -
            (a.lastOrderedDate?.getTime() || 0)
          );
        case 'ORDERS_DESC':
          return b.ordersCount - a.ordersCount || b.totalQty - a.totalQty;
        case 'QTY_DESC':
        default:
          return b.totalQty - a.totalQty || b.grossValue - a.grossValue;
      }
    });
  }, [orders, sortBy]);

  const totals = useMemo(
    () =>
      rows.reduce(
        (acc, r) => ({
          units: acc.units + r.totalQty,
          value: acc.value + r.grossValue,
        }),
        { units: 0, value: 0 }
      ),
    [rows]
  );

  return (
    <div className="rounded-2xl border border-slate-200 dark:border-white/10 bg-white dark:bg-navy-900 overflow-hidden shadow-lg">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-4 py-3 bg-slate-50/80 dark:bg-navy-950/80 border-b border-slate-200 dark:border-white/10 text-xs">
        <div>
          <h3 className="font-bold text-navy-900 dark:text-white text-sm">
            Ordered Products Summary
          </h3>
          <p className="text-slate-500 dark:text-slate-400">
            Products ordered within the selected date range &amp; filters. Click any SKU to view its matching orders.
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <span className="text-slate-500 dark:text-slate-400 font-semibold">Sort by</span>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as ProductSortOption)}
            aria-label="Sort products summary"
            className="px-2.5 py-1.5 rounded-xl bg-white dark:bg-navy-900 border border-slate-200 dark:border-white/10 text-xs font-semibold text-navy-800 dark:text-slate-100 focus:outline-none focus:border-orange-500 cursor-pointer shadow-2xs"
          >
            <option value="QTY_DESC">Most Units Ordered</option>
            <option value="VALUE_DESC">Highest Value</option>
            <option value="RECENT_DESC">Most Recently Ordered</option>
            <option value="ORDERS_DESC">Most Orders</option>
          </select>
        </div>
      </div>

      {/* Mobile Cards (< md) */}
      <div className="block md:hidden p-2.5 space-y-2.5">
        {rows.length === 0 ? (
          <div className="p-8 text-center text-xs text-slate-500 dark:text-slate-400">
            No ordered products found for the selected date range.
          </div>
        ) : (
          rows.map((item) => (
            <div
              key={item.skuKey}
              onClick={() => onFilterBySku(item.sku)}
              className="rounded-2xl border border-slate-200 dark:border-white/10 bg-white dark:bg-navy-900 p-4 space-y-3 cursor-pointer hover:border-orange-500/40 transition-colors"
            >
              <div className="flex items-start gap-3">
                <SummaryThumb src={item.image} alt={item.title} />
                <div className="min-w-0 flex-1">
                  <div className="font-bold text-navy-900 dark:text-white text-xs truncate">
                    {item.title}
                  </div>
                  <div className="font-mono text-[11px] font-bold text-orange-600 dark:text-orange-400 mt-0.5">
                    {item.sku}
                  </div>
                  <div className="text-[11px] text-slate-500 dark:text-slate-400">
                    {item.color} · {item.size} · {item.merchantName}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2 text-center bg-slate-50 dark:bg-navy-950/60 rounded-xl p-2 text-[11px]">
                <div>
                  <span className="text-slate-400 block">Orders</span>
                  <span className="font-black text-navy-900 dark:text-white tabular-nums">
                    {item.ordersCount}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block">Total Units</span>
                  <span className="font-black text-orange-600 dark:text-orange-400 tabular-nums">
                    {item.totalQty}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block">Gross Value</span>
                  <span className="font-black text-navy-900 dark:text-white tabular-nums">
                    ৳ {item.grossValue.toLocaleString()}
                  </span>
                </div>
              </div>

              <div className="flex items-center justify-between text-[11px] pt-1 border-t border-slate-100 dark:border-white/5">
                <span className="text-slate-500 dark:text-slate-400">
                  Last ordered: <strong className="text-navy-800 dark:text-slate-200">{item.lastOrderedLabel}</strong>
                </span>
                <span className="font-bold text-orange-600 dark:text-orange-400 inline-flex items-center gap-1">
                  <span>View Orders</span>
                  <ArrowUpRight className="w-3.5 h-3.5" />
                </span>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Desktop Table (>= md) */}
      <div className="hidden md:block overflow-x-auto">
        <table className="w-full text-left text-xs sm:text-sm">
          <thead className="bg-slate-50/80 dark:bg-navy-950/80 text-slate-500 dark:text-slate-400 text-[11px] uppercase tracking-wider font-bold border-b border-slate-200 dark:border-white/10">
            <tr>
              <th className="py-3 px-3 whitespace-nowrap">Product &amp; SKU</th>
              <th className="py-3 px-3 text-center whitespace-nowrap">Orders</th>
              <th className="py-3 px-3 text-center whitespace-nowrap">Units Ordered</th>
              <th className="py-3 px-3 whitespace-nowrap">Lifecycle Split</th>
              <th className="py-3 px-3 text-right whitespace-nowrap">Gross Value</th>
              <th className="py-3 px-3 whitespace-nowrap">Last Ordered</th>
              <th className="py-3 px-3 text-right whitespace-nowrap">Lookup</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-white/5">
            {rows.length === 0 ? (
              <tr>
                <td
                  colSpan={7}
                  className="p-10 text-center text-xs text-slate-500 dark:text-slate-400"
                >
                  No ordered products found for the selected date range and filters.
                </td>
              </tr>
            ) : (
              rows.map((item) => (
                <tr
                  key={item.skuKey}
                  onClick={() => onFilterBySku(item.sku)}
                  className="hover:bg-orange-500/5 dark:hover:bg-navy-800/40 transition-colors cursor-pointer text-xs"
                >
                  <td className="py-3.5 px-3">
                    <div className="flex items-center gap-3">
                      <SummaryThumb src={item.image} alt={item.title} />
                      <div className="min-w-0 space-y-0.5">
                        <div className="font-bold text-navy-900 dark:text-white truncate max-w-[260px]">
                          {item.title}
                        </div>
                        <div className="flex flex-wrap items-center gap-1.5">
                          <span className="font-mono text-[11px] font-bold px-2 py-0.5 rounded bg-slate-100 dark:bg-navy-950 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-white/10">
                            {item.sku}
                          </span>
                          <span className="text-[11px] text-slate-500 dark:text-slate-400">
                            {item.color} · {item.size}
                          </span>
                        </div>
                        <div className="text-[11px] text-slate-500 dark:text-slate-400">
                          {item.merchantName}
                        </div>
                      </div>
                    </div>
                  </td>

                  <td className="py-3.5 px-3 text-center tabular-nums font-bold text-navy-900 dark:text-white">
                    {item.ordersCount}
                  </td>

                  <td className="py-3.5 px-3 text-center">
                    <span className="inline-flex items-center justify-center px-2.5 py-1 rounded-full text-xs font-black tabular-nums bg-orange-500/10 text-orange-600 dark:text-orange-400 border border-orange-500/25">
                      {item.totalQty}
                    </span>
                  </td>

                  <td className="py-3.5 px-3">
                    <div className="flex flex-wrap items-center gap-1.5 text-[11px] font-semibold">
                      <span className="px-2 py-0.5 rounded-full bg-indigo-50 dark:bg-indigo-600/10 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-500/30 tabular-nums">
                        Pipeline: {item.pipelineQty}
                      </span>
                      <span className="px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30 tabular-nums">
                        Delivered: {item.deliveredQty}
                      </span>
                      {item.cancelledReturnedQty > 0 && (
                        <span className="px-2 py-0.5 rounded-full bg-rose-500/15 text-rose-700 dark:text-rose-400 border border-rose-500/30 tabular-nums">
                          Canc/Ret: {item.cancelledReturnedQty}
                        </span>
                      )}
                    </div>
                  </td>

                  <td className="py-3.5 px-3 text-right tabular-nums font-black text-navy-900 dark:text-white">
                    ৳ {item.grossValue.toLocaleString()}
                  </td>

                  <td className="py-3.5 px-3 whitespace-nowrap text-slate-600 dark:text-slate-300 font-medium">
                    {item.lastOrderedLabel}
                  </td>

                  <td className="py-3.5 px-3 text-right whitespace-nowrap">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onFilterBySku(item.sku);
                      }}
                      className="px-2.5 py-1.5 rounded-xl bg-orange-500/10 hover:bg-orange-600 text-orange-600 dark:text-orange-400 hover:text-white border border-orange-500/25 text-xs font-bold inline-flex items-center gap-1 transition-colors cursor-pointer"
                    >
                      <span>View Orders</span>
                      <ArrowUpRight className="w-3.5 h-3.5" />
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Footer Totals */}
      <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 bg-slate-50/80 dark:bg-navy-950/80 border-t border-slate-200 dark:border-white/10 text-xs text-slate-600 dark:text-slate-300">
        <div>
          Showing <span className="font-bold text-navy-900 dark:text-white">{rows.length}</span> unique SKU
          {rows.length === 1 ? '' : 's'}
        </div>
        <div className="flex items-center gap-4 font-semibold">
          <span>
            Total Units:{' '}
            <strong className="text-orange-600 dark:text-orange-400 tabular-nums">
              {totals.units.toLocaleString()}
            </strong>
          </span>
          <span>
            Total Gross Value:{' '}
            <strong className="text-navy-900 dark:text-white tabular-nums">
              ৳ {totals.value.toLocaleString()}
            </strong>
          </span>
        </div>
      </div>
    </div>
  );
}
