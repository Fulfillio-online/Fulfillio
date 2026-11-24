'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Eye,
  Layers,
  MoreVertical,
  Package,
  Printer,
} from 'lucide-react';
import {
  AllOrdersStatusFilter,
  OrderItem,
  WarehousePipelineOrder,
  formatFullOrderDate,
  getOrderHistoryStatus,
} from '../../types';

interface AllOrdersTableProps {
  orders: WarehousePipelineOrder[];
  totalItems: number;
  startIndex: number;
  pageSize: number;
  safePage: number;
  totalPages: number;
  onPageSizeChange: (size: number) => void;
  onPageChange: (page: number) => void;
  onPreviewMemo: (order: WarehousePipelineOrder) => void;
  isLoading?: boolean;
}

function getOrderLineItems(order: WarehousePipelineOrder): OrderItem[] {
  if (order.items && order.items.length > 0) {
    return order.items;
  }
  const cleanTitle = (order.productTitle || 'Warehouse Item')
    .replace(/\s*\(\+\d+\s*more\)/gi, '')
    .replace(/\s*\+\s*\d+\s*more/gi, '')
    .trim();
  return [
    {
      sku: order.sku || 'SKU-001',
      title: cleanTitle,
      image: order.productImage || '',
      color: order.color || 'Standard',
      size: order.size || 'Standard',
      qty: order.qty || 1,
      unitPrice: order.codAmount || 0,
      bin: order.bin || 'A-01-01',
    },
  ];
}

function getStatusBadgeMeta(status: Exclude<AllOrdersStatusFilter, 'ALL'>): {
  label: string;
  classes: string;
} {
  switch (status) {
    case 'PICK':
      return {
        label: 'TO PICK',
        classes:
          'bg-amber-500/15 text-amber-700 dark:text-amber-300 border-amber-500/30',
      };
    case 'WAITING':
      return {
        label: 'ON HOLD',
        classes:
          'bg-rose-500/15 text-rose-700 dark:text-rose-300 border-rose-500/30',
      };
    case 'PACK':
      return {
        label: 'TO PACK',
        classes:
          'bg-indigo-500/15 text-indigo-700 dark:text-indigo-300 border-indigo-500/30',
      };
    case 'DISPATCH':
      return {
        label: 'READY DISPATCH',
        classes: 'bg-sky-500/15 text-sky-700 dark:text-sky-300 border-sky-500/30',
      };
    case 'COURIER_BOOKED':
      return {
        label: 'COURIER BOOKED',
        classes:
          'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-500/30',
      };
    case 'HANDED_OVER':
      return {
        label: 'DELIVERED',
        classes:
          'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-500/30',
      };
    case 'RETURNED':
      return {
        label: 'RETURNED',
        classes:
          'bg-amber-500/15 text-amber-700 dark:text-amber-300 border-amber-500/30',
      };
    case 'CANCELLED':
      return {
        label: 'CANCELLED',
        classes:
          'bg-rose-500/15 text-rose-700 dark:text-rose-400 border-rose-500/30',
      };
  }
}

function getPipelineTabForOrder(order: WarehousePipelineOrder): 'pick' | 'pack' | 'dispatch' | null {
  if (order.stage === 'PICK' || order.stage === 'WAITING') return 'pick';
  if (order.stage === 'PACK') return 'pack';
  if (order.stage === 'DISPATCH') return 'dispatch';
  return null;
}

function ProductThumb({ src, alt }: { src?: string; alt: string }) {
  const [hasError, setHasError] = useState(false);

  if (!src || hasError) {
    return (
      <div className="h-9 w-9 rounded-lg bg-slate-100 dark:bg-navy-800 border border-slate-200 dark:border-white/10 flex items-center justify-center shrink-0 text-slate-400 dark:text-slate-500">
        <Package className="w-4 h-4" />
      </div>
    );
  }

  return (
    <img
      src={src}
      alt={alt}
      onError={() => setHasError(true)}
      className="h-9 w-9 rounded-lg object-cover border border-slate-200 dark:border-white/10 shrink-0 bg-slate-100 dark:bg-navy-800"
    />
  );
}

function AllOrdersRow({
  order,
  onPreviewMemo,
}: {
  order: WarehousePipelineOrder;
  onPreviewMemo: (order: WarehousePipelineOrder) => void;
}) {
  const router = useRouter();
  const [itemsExpanded, setItemsExpanded] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [menuStyle, setMenuStyle] = useState<React.CSSProperties>({});
  const buttonRef = useRef<HTMLButtonElement>(null);
  const portalRef = useRef<HTMLDivElement>(null);

  const lineItems = getOrderLineItems(order);
  const primaryItem = lineItems[0];
  const extraItems = lineItems.slice(1);
  const dateInfo = formatFullOrderDate(order);
  const statusMeta = getStatusBadgeMeta(getOrderHistoryStatus(order));
  const pipelineTab = getPipelineTabForOrder(order);

  const updateMenuPosition = useCallback(() => {
    if (!buttonRef.current) return;
    const rect = buttonRef.current.getBoundingClientRect();
    const spaceBelow = window.innerHeight - rect.bottom;
    const spaceAbove = rect.top;
    const estimatedMenuHeight = pipelineTab ? 165 : 115;
    const openUpward = spaceBelow < estimatedMenuHeight && spaceAbove >= spaceBelow;
    const rawTop = openUpward
      ? rect.top - estimatedMenuHeight - 6
      : rect.bottom + 6;
    const clampedTop = Math.max(
      10,
      Math.min(rawTop, window.innerHeight - estimatedMenuHeight - 10)
    );

    setMenuStyle({
      position: 'fixed',
      top: clampedTop,
      right: Math.max(10, window.innerWidth - rect.right),
      maxHeight: 'calc(100vh - 20px)',
      overflowY: 'auto',
      zIndex: 9999,
    });
  }, [pipelineTab]);

  const handleToggleMenu = () => {
    if (!isMenuOpen) {
      updateMenuPosition();
      setIsMenuOpen(true);
    } else {
      setIsMenuOpen(false);
    }
  };

  useEffect(() => {
    if (!isMenuOpen) return;

    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;
      if (
        buttonRef.current &&
        !buttonRef.current.contains(target) &&
        (!portalRef.current || !portalRef.current.contains(target))
      ) {
        setIsMenuOpen(false);
      }
    };
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setIsMenuOpen(false);
    };
    const handleScrollOrResize = () => {
      setIsMenuOpen(false);
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);
    window.addEventListener('scroll', handleScrollOrResize, true);
    window.addEventListener('resize', handleScrollOrResize);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('scroll', handleScrollOrResize, true);
      window.removeEventListener('resize', handleScrollOrResize);
    };
  }, [isMenuOpen]);

  return (
    <tr className="hover:bg-slate-50/90 dark:hover:bg-navy-800/40 transition-colors border-b border-slate-100 dark:border-white/5 text-xs">
      {/* 1. Order ID & Date */}
      <td className="py-3.5 px-3 align-top">
        <div className="space-y-0.5">
          <Link
            href={`/admin/orders/${encodeURIComponent(order.id)}?from=all`}
            className="tabular-nums font-black text-navy-900 dark:text-white hover:text-orange-600 dark:hover:text-orange-400 block transition-colors leading-tight"
          >
            {order.id}
          </Link>
          <div className="font-semibold text-slate-700 dark:text-slate-300 truncate max-w-[140px] leading-tight">
            {order.merchantName}
          </div>
          <div
            className="text-[11px] font-medium text-slate-500 dark:text-slate-400 leading-tight"
            title={dateInfo.full}
          >
            {dateInfo.label}
          </div>
        </div>
      </td>

      {/* 2. Products / SKUs */}
      <td className="py-3.5 px-3 align-top min-w-[230px] max-w-[300px]">
        <div className="space-y-2">
          <div className="flex items-start gap-2.5">
            <ProductThumb src={primaryItem.image} alt={primaryItem.title} />
            <div className="min-w-0 flex-1 space-y-1">
              <div
                className="font-bold text-navy-900 dark:text-white truncate leading-tight"
                title={primaryItem.title}
              >
                {primaryItem.title}
              </div>
              <div className="flex flex-wrap items-center gap-1.5">
                <span className="font-mono text-[10px] font-bold px-1.5 py-0.5 rounded bg-slate-100 dark:bg-navy-950 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-white/10">
                  {primaryItem.sku}
                </span>
                <span className="text-[11px] text-slate-500 dark:text-slate-400">
                  {primaryItem.color} · {primaryItem.size}
                </span>
                <span className="text-[10px] font-extrabold px-1.5 py-0.5 rounded bg-orange-500/10 text-orange-600 dark:text-orange-400 border border-orange-500/20 tabular-nums">
                  ×{primaryItem.qty}
                </span>
              </div>
            </div>
          </div>

          {extraItems.length > 0 && (
            <div className="pl-11 space-y-1.5">
              <button
                type="button"
                onClick={() => setItemsExpanded((v) => !v)}
                className="inline-flex items-center gap-1 text-[11px] font-bold text-orange-600 dark:text-orange-400 hover:underline cursor-pointer"
              >
                <span>
                  {itemsExpanded
                    ? 'Hide additional items'
                    : `+${extraItems.length} more item${extraItems.length > 1 ? 's' : ''}`}
                </span>
                <ChevronDown
                  className={`w-3 h-3 transition-transform ${
                    itemsExpanded ? 'rotate-180' : ''
                  }`}
                />
              </button>

              {itemsExpanded && (
                <div className="space-y-1.5 pt-1 border-t border-slate-100 dark:border-white/5">
                  {extraItems.map((it, idx) => (
                    <div
                      key={`${it.sku}-${idx}`}
                      className="flex items-start gap-2 rounded-lg bg-slate-50 dark:bg-navy-950/60 p-1.5 border border-slate-200/70 dark:border-white/5"
                    >
                      <ProductThumb src={it.image} alt={it.title} />
                      <div className="min-w-0 flex-1">
                        <div className="font-semibold text-navy-900 dark:text-slate-100 truncate text-[11px]">
                          {it.title}
                        </div>
                        <div className="flex flex-wrap items-center gap-1 mt-0.5">
                          <span className="font-mono text-[10px] font-bold text-slate-600 dark:text-slate-300">
                            {it.sku}
                          </span>
                          <span className="text-[10px] text-slate-500 dark:text-slate-400">
                            ({it.color} · {it.size})
                          </span>
                          <span className="text-[10px] font-bold text-orange-600 dark:text-orange-400 tabular-nums">
                            ×{it.qty}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </td>

      {/* 3. Memo */}
      <td className="py-3.5 px-3 align-top">
        <div className="space-y-0.5">
          <span className="tabular-nums font-bold px-2 py-0.5 rounded bg-indigo-50 dark:bg-indigo-600/10 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-500/30 inline-block font-mono text-[11px]">
            {order.memoCode.replace(/^MEMO-?/i, '')}
          </span>
          <span className="text-[11px] text-slate-500 dark:text-slate-400 block truncate max-w-[130px] font-medium leading-tight">
            {order.resellerName}
          </span>
        </div>
      </td>

      {/* 4. Customer */}
      <td className="py-3.5 px-3 align-top">
        <div className="space-y-0.5 max-w-[180px]">
          <div className="font-bold text-navy-900 dark:text-white truncate">
            {order.customerName}
          </div>
          <div className="tabular-nums text-slate-600 dark:text-slate-300 font-medium text-[11px]">
            {order.customerPhone}
          </div>
          <div
            className="text-[11px] text-slate-500 dark:text-slate-400 truncate leading-tight"
            title={order.customerAddress || order.city}
          >
            {order.customerAddress || order.city}
          </div>
        </div>
      </td>

      {/* 5. Courier (Read-Only) */}
      <td className="py-3.5 px-3 align-top whitespace-nowrap">
        <div className="space-y-1">
          <span
            className={`inline-block text-[11px] font-bold px-2 py-0.5 rounded-lg border ${
              order.courier
                ? 'bg-slate-100 dark:bg-navy-950 text-navy-800 dark:text-slate-200 border-slate-200 dark:border-white/10'
                : 'bg-slate-50 dark:bg-navy-950/50 text-slate-400 dark:text-slate-500 border-slate-200/70 dark:border-white/5'
            }`}
          >
            {order.courier || 'Unassigned'}
          </span>
          {order.trackingCode && (
            <div className="text-[10px] font-mono font-bold text-amber-600 dark:text-amber-400 truncate max-w-[115px]">
              {order.trackingCode}
            </div>
          )}
        </div>
      </td>

      {/* 6. Amount */}
      <td className="py-3.5 px-3 align-top whitespace-nowrap">
        <div className="space-y-0.5">
          <div className="font-black text-navy-900 dark:text-white tabular-nums text-xs sm:text-sm">
            ৳ {order.codAmount.toLocaleString()}
          </div>
          <span className="text-[10px] uppercase font-bold text-emerald-600 dark:text-emerald-400 block tracking-wider leading-none">
            {order.paymentStatus === 'Paid'
              ? 'Paid'
              : order.paymentStatus === 'Partial'
              ? 'Partial Paid'
              : 'COD Total'}
          </span>
        </div>
      </td>

      {/* 7. Status (Pure Non-Clickable Informative Badge) */}
      <td className="py-3.5 px-3 align-top text-center whitespace-nowrap">
        <span
          className={`inline-flex items-center justify-center text-[11px] uppercase font-bold tracking-wider px-2.5 py-1 rounded-full border select-none leading-none ${statusMeta.classes}`}
        >
          {statusMeta.label}
        </span>
      </td>

      {/* 8. Actions (Single 3-Dots Trigger + Portaled Menu) */}
      <td className="py-3.5 px-3 align-top text-center whitespace-nowrap">
        <div className="flex items-center justify-center">
          <button
            ref={buttonRef}
            type="button"
            onClick={handleToggleMenu}
            aria-label="Order actions menu"
            className="p-2 rounded-xl text-slate-500 hover:text-navy-900 dark:text-slate-400 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-navy-800 transition-colors cursor-pointer"
          >
            <MoreVertical className="h-4 w-4" />
          </button>

          {isMenuOpen &&
            typeof document !== 'undefined' &&
            createPortal(
              <div
                ref={portalRef}
                style={menuStyle}
                className="w-52 rounded-xl bg-white dark:bg-navy-900 border border-slate-200 dark:border-white/10 shadow-2xl py-1 text-left font-sans text-xs"
              >
                <button
                  type="button"
                  onClick={() => {
                    setIsMenuOpen(false);
                    router.push(`/admin/orders/${encodeURIComponent(order.id)}?from=all`);
                  }}
                  className="w-full px-3 py-2 text-left text-navy-900 dark:text-slate-100 hover:bg-slate-100 dark:hover:bg-navy-800 flex items-center gap-2 transition-colors cursor-pointer font-semibold"
                >
                  <Eye className="w-4 h-4 text-orange-600 dark:text-orange-400 shrink-0" />
                  <span>View Order Details</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setIsMenuOpen(false);
                    onPreviewMemo(order);
                  }}
                  className="w-full px-3 py-2 text-left text-navy-900 dark:text-slate-100 hover:bg-slate-100 dark:hover:bg-navy-800 flex items-center gap-2 transition-colors cursor-pointer font-semibold"
                >
                  <Printer className="w-4 h-4 text-indigo-600 dark:text-indigo-400 shrink-0" />
                  <span>Print 4x6&quot; Memo Invoice</span>
                </button>

                {pipelineTab && (
                  <>
                    <div className="border-t border-slate-100 dark:border-white/10 my-1" />
                    <button
                      type="button"
                      onClick={() => {
                        setIsMenuOpen(false);
                        router.push(
                          `/admin/orders?tab=${pipelineTab}&search=${encodeURIComponent(order.id)}`
                        );
                      }}
                      className="w-full px-3 py-2 text-left text-orange-600 dark:text-orange-400 hover:bg-orange-500/10 flex items-center gap-2 transition-colors cursor-pointer font-semibold"
                    >
                      <Layers className="w-4 h-4 shrink-0" />
                      <span>Open in Pipeline</span>
                    </button>
                  </>
                )}
              </div>,
              document.body
            )}
        </div>
      </td>
    </tr>
  );
}

function AllOrdersMobileCard({
  order,
  onPreviewMemo,
}: {
  order: WarehousePipelineOrder;
  onPreviewMemo: (order: WarehousePipelineOrder) => void;
}) {
  const router = useRouter();
  const [expanded, setExpanded] = useState(false);
  const lineItems = getOrderLineItems(order);
  const primaryItem = lineItems[0];
  const dateInfo = formatFullOrderDate(order);
  const statusMeta = getStatusBadgeMeta(getOrderHistoryStatus(order));
  const pipelineTab = getPipelineTabForOrder(order);

  return (
    <div className="rounded-2xl border border-slate-200 dark:border-white/10 bg-white dark:bg-navy-900 shadow-sm overflow-hidden">
      <div
        onClick={() => setExpanded((v) => !v)}
        className="p-4 flex items-start justify-between gap-3 cursor-pointer select-none"
      >
        <div className="min-w-0 flex-1 space-y-1.5">
          <div className="flex items-center gap-2 flex-wrap">
            <Link
              href={`/admin/orders/${encodeURIComponent(order.id)}?from=all`}
              onClick={(e) => e.stopPropagation()}
              className="tabular-nums font-extrabold text-sm text-navy-900 dark:text-white hover:text-orange-600 dark:hover:text-orange-400"
            >
              {order.id}
            </Link>
            <span className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">
              · {dateInfo.label}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <ProductThumb src={primaryItem.image} alt={primaryItem.title} />
            <div className="min-w-0 flex-1">
              <div className="text-xs font-bold text-navy-900 dark:text-white truncate">
                {primaryItem.title}
                {lineItems.length > 1 ? ` (+${lineItems.length - 1} more)` : ''}
              </div>
              <div className="text-[11px] font-mono text-slate-500 dark:text-slate-400 truncate">
                {primaryItem.sku} · ×{order.qty || primaryItem.qty}
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between text-xs pt-1">
            <span className="text-slate-600 dark:text-slate-300 font-medium truncate max-w-[170px]">
              {order.customerName} · {order.merchantName}
            </span>
            <span className="font-black text-navy-900 dark:text-white tabular-nums">
              ৳ {order.codAmount.toLocaleString()}
            </span>
          </div>
        </div>

        <div className="flex flex-col items-end gap-2 shrink-0">
          <span
            className={`text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full border select-none ${statusMeta.classes}`}
          >
            {statusMeta.label}
          </span>
          <ChevronDown
            className={`w-4 h-4 text-slate-400 transition-transform ${
              expanded ? 'rotate-180' : ''
            }`}
          />
        </div>
      </div>

      {expanded && (
        <div className="px-4 pb-4 pt-2 border-t border-slate-100 dark:border-white/5 space-y-3 text-xs bg-slate-50/60 dark:bg-navy-950/50">
          <div className="space-y-1.5">
            <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
              Products ({lineItems.length})
            </span>
            {lineItems.map((it, idx) => (
              <div
                key={`${it.sku}-${idx}`}
                className="flex items-center justify-between gap-2 text-[11px] bg-white dark:bg-navy-900 rounded-lg px-2.5 py-1.5 border border-slate-200/70 dark:border-white/5"
              >
                <div className="min-w-0">
                  <div className="font-semibold text-navy-900 dark:text-white truncate">
                    {it.title}
                  </div>
                  <div className="font-mono text-[10px] text-slate-500 dark:text-slate-400">
                    {it.sku} ({it.color} · {it.size})
                  </div>
                </div>
                <span className="font-bold text-orange-600 dark:text-orange-400 tabular-nums shrink-0">
                  ×{it.qty}
                </span>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-2 gap-2 pt-1 border-t border-slate-200/60 dark:border-white/5">
            <div>
              <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block">
                Customer
              </span>
              <div className="font-semibold text-navy-900 dark:text-white mt-0.5">
                {order.customerName}
              </div>
              <div className="text-[11px] text-slate-500 dark:text-slate-400">
                {order.customerPhone}
              </div>
            </div>
            <div>
              <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block">
                Courier &amp; Memo
              </span>
              <div className="font-semibold text-navy-900 dark:text-white mt-0.5">
                {order.courier || 'Unassigned'}
              </div>
              <div className="text-[11px] font-mono text-indigo-600 dark:text-indigo-400">
                {order.memoCode}
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-200/60 dark:border-white/5">
            <button
              type="button"
              onClick={() =>
                router.push(`/admin/orders/${encodeURIComponent(order.id)}?from=all`)
              }
              className="flex-1 py-2 px-3 rounded-xl bg-orange-600 hover:bg-orange-500 text-white font-bold text-xs flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <Eye className="w-3.5 h-3.5" />
              <span>View Details</span>
            </button>
            <button
              type="button"
              onClick={() => onPreviewMemo(order)}
              className="py-2 px-3 rounded-xl bg-white dark:bg-navy-900 border border-slate-200 dark:border-white/10 text-slate-700 dark:text-slate-200 font-bold text-xs flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
              <span>Print Memo</span>
            </button>
            {pipelineTab && (
              <button
                type="button"
                onClick={() =>
                  router.push(
                    `/admin/orders?tab=${pipelineTab}&search=${encodeURIComponent(order.id)}`
                  )
                }
                className="w-full py-2 px-3 rounded-xl bg-orange-500/10 border border-orange-500/30 text-orange-600 dark:text-orange-400 font-bold text-xs flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <Layers className="w-3.5 h-3.5" />
                <span>Open in Order Pipeline</span>
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export function AllOrdersTable({
  orders,
  totalItems,
  startIndex,
  pageSize,
  safePage,
  totalPages,
  onPageSizeChange,
  onPageChange,
  onPreviewMemo,
  isLoading = false,
}: AllOrdersTableProps) {
  return (
    <div className="rounded-2xl border border-slate-200 dark:border-white/10 bg-white dark:bg-navy-900 overflow-hidden shadow-lg">
      {/* Top Sub-header */}
      <div className="flex items-center justify-between px-4 py-2.5 bg-slate-50/80 dark:bg-navy-950/80 border-b border-slate-200 dark:border-white/10 text-xs text-slate-600 dark:text-slate-300">
        <div className="font-medium text-slate-500 dark:text-slate-400">
          {isLoading
            ? 'Refreshing order history from database...'
            : `${totalItems} historical order${totalItems === 1 ? '' : 's'} matching active date & filters`}
        </div>

        <div className="flex items-center gap-1.5">
          <span className="text-slate-500 dark:text-slate-400 font-medium">Show</span>
          <select
            value={pageSize}
            onChange={(e) => {
              onPageSizeChange(Number(e.target.value));
              onPageChange(1);
            }}
            aria-label="Rows per page"
            className="px-2 py-1 rounded-lg bg-white dark:bg-navy-900 border border-slate-200 dark:border-white/10 text-xs font-semibold text-navy-800 dark:text-slate-100 focus:outline-none focus:border-orange-500 cursor-pointer shadow-2xs"
          >
            <option value={10}>10</option>
            <option value={25}>25</option>
            <option value={50}>50</option>
            <option value={100}>100</option>
          </select>
          <span className="text-slate-500 dark:text-slate-400 font-medium">rows</span>
        </div>
      </div>

      {/* Mobile Cards (< md) */}
      <div className="block md:hidden p-2.5 space-y-2.5">
        {orders.length === 0 ? (
          <div className="p-8 text-center text-xs text-slate-500 dark:text-slate-400">
            No orders found for the selected date range and filters.
          </div>
        ) : (
          orders.map((order) => (
            <AllOrdersMobileCard
              key={order.id}
              order={order}
              onPreviewMemo={onPreviewMemo}
            />
          ))
        )}
      </div>

      {/* Desktop Table (>= md) */}
      <div className="hidden md:block overflow-x-auto">
        <table className="w-full text-left text-xs sm:text-sm">
          <thead className="bg-slate-50/80 dark:bg-navy-950/80 text-slate-500 dark:text-slate-400 text-[11px] uppercase tracking-wider font-bold border-b border-slate-200 dark:border-white/10">
            <tr>
              <th className="py-3 px-3 whitespace-nowrap">Order ID &amp; Date</th>
              <th className="py-3 px-3 whitespace-nowrap">Products / SKU</th>
              <th className="py-3 px-3 whitespace-nowrap">Memo</th>
              <th className="py-3 px-3 whitespace-nowrap">Customer</th>
              <th className="py-3 px-3 whitespace-nowrap">Courier</th>
              <th className="py-3 px-3 whitespace-nowrap">Amount</th>
              <th className="py-3 px-3 text-center whitespace-nowrap">Status</th>
              <th className="py-3 px-3 text-center whitespace-nowrap">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-white/5">
            {orders.length === 0 ? (
              <tr>
                <td
                  colSpan={8}
                  className="p-10 text-center text-xs text-slate-500 dark:text-slate-400"
                >
                  No orders found for the selected date range and filters.
                </td>
              </tr>
            ) : (
              orders.map((order) => (
                <AllOrdersRow
                  key={order.id}
                  order={order}
                  onPreviewMemo={onPreviewMemo}
                />
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination Footer */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 px-4 py-3 bg-slate-50/80 dark:bg-navy-950/80 border-t border-slate-200 dark:border-white/10 text-xs text-slate-600 dark:text-slate-300">
        <div>
          Showing{' '}
          <span className="font-bold text-navy-800 dark:text-white">
            {totalItems > 0 ? startIndex + 1 : 0}
          </span>{' '}
          to{' '}
          <span className="font-bold text-navy-800 dark:text-white">
            {Math.min(startIndex + pageSize, totalItems)}
          </span>{' '}
          of <span className="font-bold text-navy-800 dark:text-white">{totalItems}</span> orders
        </div>

        <div className="flex items-center gap-2">
          <span className="font-medium">
            Page <span className="text-navy-800 dark:text-white font-bold">{safePage}</span> of{' '}
            <span className="text-navy-800 dark:text-white font-bold">{totalPages}</span>
          </span>
          <div className="flex items-center gap-1">
            <button
              type="button"
              disabled={safePage <= 1}
              onClick={() => onPageChange(Math.max(1, safePage - 1))}
              aria-label="Previous page"
              className="p-1.5 rounded-lg border border-slate-200 dark:border-white/10 bg-white dark:bg-navy-900 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-navy-800 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer transition-colors shadow-2xs"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              type="button"
              disabled={safePage >= totalPages}
              onClick={() => onPageChange(Math.min(totalPages, safePage + 1))}
              aria-label="Next page"
              className="p-1.5 rounded-lg border border-slate-200 dark:border-white/10 bg-white dark:bg-navy-900 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-navy-800 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer transition-colors shadow-2xs"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
