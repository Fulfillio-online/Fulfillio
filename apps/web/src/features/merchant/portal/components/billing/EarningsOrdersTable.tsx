'use client';

import React, { useState, useMemo, useEffect } from 'react';
import Link from 'next/link';
import { createPortal } from 'react-dom';
import {
  Search,
  CheckCircle2,
  Clock,
  RotateCcw,
  Wallet,
  Sparkles,
  MoreVertical,
  Eye,
  ExternalLink,
  X,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { OrderEarningDto, OrderEarningStatus } from '@fulfillio/contracts';

interface EarningsOrdersTableProps {
  orders: OrderEarningDto[];
  isClaiming?: boolean;
  onClaimSelected: (earningIds: string[]) => Promise<void> | void;
  onTriggerToast: (msg: string) => void;
}

function formatDateTimeShort(iso?: string): string {
  if (!iso) return '—';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  });
}

function formatCountdown(remainingMs: number, claimableAt: string): string {
  if (remainingMs <= 0) return 'Return window cleared';
  const totalHours = Math.ceil(remainingMs / (1000 * 60 * 60));
  const days = Math.floor(totalHours / 24);
  const hours = totalHours % 24;
  const label = days > 0 ? `${days}d ${hours}h left` : `${hours}h left`;
  const dateStr = new Date(claimableAt).toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
  });
  return `${label} (Clears ${dateStr})`;
}

export function EarningsOrdersTable({
  orders,
  isClaiming = false,
  onClaimSelected,
}: EarningsOrdersTableProps) {
  const [activeTab, setActiveTab] = useState<'ALL' | OrderEarningStatus>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [detailRow, setDetailRow] = useState<OrderEarningDto | null>(null);

  // Portaled dropdown menu state
  const [menuState, setMenuState] = useState<{
    row: OrderEarningDto;
    top: number;
    left: number;
  } | null>(null);

  useEffect(() => {
    if (!menuState) return;
    const close = () => setMenuState(null);
    window.addEventListener('scroll', close, true);
    window.addEventListener('resize', close);
    window.addEventListener('click', close);
    return () => {
      window.removeEventListener('scroll', close, true);
      window.removeEventListener('resize', close);
      window.removeEventListener('click', close);
    };
  }, [menuState]);

  const counts = useMemo(() => {
    return {
      all: orders.length,
      ready: orders.filter((o) => o.status === OrderEarningStatus.READY_TO_CLAIM).length,
      pending: orders.filter((o) => o.status === OrderEarningStatus.PENDING).length,
      claimed: orders.filter((o) => o.status === OrderEarningStatus.CLAIMED).length,
      refunded: orders.filter((o) => o.status === OrderEarningStatus.REFUNDED).length,
    };
  }, [orders]);

  const filteredOrders = useMemo(() => {
    return orders.filter((order) => {
      if (activeTab !== 'ALL' && order.status !== activeTab) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        return (
          order.orderNumber.toLowerCase().includes(q) ||
          order.transactionRef.toLowerCase().includes(q) ||
          order.itemSummary.toLowerCase().includes(q) ||
          (order.customerName || '').toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [orders, activeTab, searchQuery]);

  useEffect(() => {
    setCurrentPage(1);
    setSelectedIds([]);
  }, [activeTab, searchQuery, pageSize]);

  const total = filteredOrders.length;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const safePage = Math.min(Math.max(1, currentPage), totalPages);
  const paginatedOrders = filteredOrders.slice((safePage - 1) * pageSize, safePage * pageSize);

  const selectableVisible = paginatedOrders.filter(
    (o) => o.status === OrderEarningStatus.READY_TO_CLAIM,
  );
  const allVisibleReadySelected =
    selectableVisible.length > 0 &&
    selectableVisible.every((o) => selectedIds.includes(o.id));

  const toggleSelectAll = () => {
    if (allVisibleReadySelected) {
      const visibleSet = new Set(selectableVisible.map((o) => o.id));
      setSelectedIds((prev) => prev.filter((id) => !visibleSet.has(id)));
    } else {
      const merged = new Set([...selectedIds, ...selectableVisible.map((o) => o.id)]);
      setSelectedIds(Array.from(merged));
    }
  };

  const toggleSelectOne = (row: OrderEarningDto) => {
    if (row.status !== OrderEarningStatus.READY_TO_CLAIM) return;
    setSelectedIds((prev) =>
      prev.includes(row.id) ? prev.filter((item) => item !== row.id) : [...prev, row.id],
    );
  };

  const selectedClaimAmount = useMemo(() => {
    const selectedSet = new Set(selectedIds);
    return orders
      .filter((o) => selectedSet.has(o.id) && o.status === OrderEarningStatus.READY_TO_CLAIM)
      .reduce((sum, o) => sum + o.netAmount, 0);
  }, [orders, selectedIds]);

  const handleOpenMenu = (row: OrderEarningDto, e: React.MouseEvent<HTMLButtonElement>) => {
    e.stopPropagation();
    if (menuState?.row.id === row.id) {
      setMenuState(null);
      return;
    }
    const rect = e.currentTarget.getBoundingClientRect();
    const menuWidth = 200;
    const menuHeight = row.status === OrderEarningStatus.READY_TO_CLAIM ? 148 : 104;
    const spaceBelow = window.innerHeight - rect.bottom;
    const spaceAbove = rect.top;
    const rawTop =
      spaceBelow < menuHeight && spaceAbove >= spaceBelow
        ? rect.top - menuHeight - 6
        : rect.bottom + 6;
    const top = Math.max(10, Math.min(rawTop, window.innerHeight - menuHeight - 10));
    const left = Math.max(10, Math.min(rect.right - menuWidth, window.innerWidth - menuWidth - 10));
    setMenuState({ row, top, left });
  };

  const renderStatusBadge = (status: OrderEarningStatus) => {
    switch (status) {
      case OrderEarningStatus.READY_TO_CLAIM:
        return (
          <span className="inline-flex items-center justify-center gap-1 text-[11px] uppercase font-bold tracking-wider px-2.5 py-1 rounded-full border select-none bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30">
            <CheckCircle2 className="h-3 w-3" />
            <span>Ready to Claim</span>
          </span>
        );
      case OrderEarningStatus.PENDING:
        return (
          <span className="inline-flex items-center justify-center gap-1 text-[11px] uppercase font-bold tracking-wider px-2.5 py-1 rounded-full border select-none bg-amber-500/15 text-amber-600 dark:text-amber-300 border-amber-500/30">
            <Clock className="h-3 w-3" />
            <span>Pending Hold</span>
          </span>
        );
      case OrderEarningStatus.CLAIMED:
        return (
          <span className="inline-flex items-center justify-center gap-1 text-[11px] uppercase font-bold tracking-wider px-2.5 py-1 rounded-full border select-none bg-orange-500/15 text-orange-600 dark:text-orange-400 border-orange-500/30">
            <Wallet className="h-3 w-3" />
            <span>Claimed</span>
          </span>
        );
      case OrderEarningStatus.REFUNDED:
        return (
          <span className="inline-flex items-center justify-center gap-1 text-[11px] uppercase font-bold tracking-wider px-2.5 py-1 rounded-full border select-none bg-rose-500/15 text-rose-600 dark:text-rose-400 border-rose-500/30">
            <RotateCcw className="h-3 w-3" />
            <span>Refunded</span>
          </span>
        );
    }
  };

  const handleClaimAction = async () => {
    if (selectedIds.length === 0) return;
    await onClaimSelected(selectedIds);
    setSelectedIds([]);
  };

  return (
    <div className="rounded-2xl border border-slate-200/80 dark:border-white/10 bg-white dark:bg-navy-900 overflow-hidden shadow-sm space-y-4 p-4 sm:p-6">
      {/* Header & Tabs */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 border-b border-slate-200/80 dark:border-white/10 pb-4">
        <div className="flex flex-wrap items-center gap-2">
          {(
            [
              { id: 'ALL', label: 'All Completed Orders', count: counts.all },
              { id: OrderEarningStatus.READY_TO_CLAIM, label: 'Ready to Claim', count: counts.ready },
              { id: OrderEarningStatus.PENDING, label: 'Pending Hold', count: counts.pending },
              { id: OrderEarningStatus.CLAIMED, label: 'Claimed', count: counts.claimed },
              { id: OrderEarningStatus.REFUNDED, label: 'Refunded', count: counts.refunded },
            ] as const
          ).map((tab) => {
            const active = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-colors cursor-pointer inline-flex items-center gap-1.5 ${
                  active
                    ? 'bg-orange-600 text-white shadow-sm'
                    : 'bg-slate-100 dark:bg-navy-800 text-slate-600 dark:text-slate-300 hover:text-navy-900 dark:hover:text-white'
                }`}
              >
                <span>{tab.label}</span>
                <span
                  className={`px-1.5 py-0.2 rounded-full text-[10px] font-mono ${
                    active
                      ? 'bg-black/20 text-white'
                      : 'bg-white dark:bg-navy-900 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-white/10'
                  }`}
                >
                  {tab.count}
                </span>
              </button>
            );
          })}
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {selectedIds.length > 0 && (
            <button
              type="button"
              onClick={handleClaimAction}
              disabled={isClaiming}
              className="px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center gap-1.5 shadow-sm transition-colors cursor-pointer disabled:opacity-60"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>
                {isClaiming
                  ? 'Claiming...'
                  : `Claim Selected (${selectedIds.length} · ৳${selectedClaimAmount.toLocaleString()})`}
              </span>
            </button>
          )}

          <div className="relative w-full sm:w-64">
            <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search order #, ref, item..."
              className="w-full pl-9 pr-3 py-1.5 rounded-xl bg-slate-50 dark:bg-navy-950 border border-slate-200/80 dark:border-white/10 text-xs text-navy-900 dark:text-slate-200 focus:outline-none focus:border-orange-500"
            />
          </div>
        </div>
      </div>

      {/* Mobile Cards (< md) */}
      <div className="block md:hidden space-y-2.5">
        {paginatedOrders.length === 0 ? (
          <div className="p-8 text-center text-xs text-slate-500 dark:text-slate-400">
            No completed order earnings found for this filter.
          </div>
        ) : (
          paginatedOrders.map((order) => {
            const isReady = order.status === OrderEarningStatus.READY_TO_CLAIM;
            const isSelected = selectedIds.includes(order.id);
            return (
              <div
                key={order.id}
                className={`rounded-xl border p-3.5 space-y-2.5 ${
                  isSelected
                    ? 'border-emerald-500/40 bg-emerald-500/5'
                    : 'border-slate-200/80 dark:border-white/10 bg-slate-50/70 dark:bg-navy-950/60'
                }`}
              >
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={isSelected}
                      disabled={!isReady}
                      onChange={() => toggleSelectOne(order)}
                      className="rounded border-slate-300 dark:border-white/15 text-orange-600 focus:ring-orange-500 disabled:opacity-30"
                    />
                    <Link
                      href={`/merchant/orders/${encodeURIComponent(order.orderNumber)}`}
                      className="font-bold text-xs text-orange-600 dark:text-orange-400 hover:underline"
                    >
                      #{order.orderNumber}
                    </Link>
                  </div>
                  {renderStatusBadge(order.status)}
                </div>

                <div className="text-xs text-slate-700 dark:text-slate-200 line-clamp-1">
                  {order.itemSummary}
                </div>

                <div className="grid grid-cols-3 gap-2 text-xs pt-2 border-t border-slate-200/60 dark:border-white/10">
                  <div>
                    <span className="text-[10px] text-slate-500 block">Order Bill</span>
                    <span className="font-semibold tabular-nums">৳{order.grossAmount.toLocaleString()}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-500 block">Fees</span>
                    <span className="font-mono text-rose-500 tabular-nums">-৳{order.feeAmount.toLocaleString()}</span>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] text-slate-500 block">Net Earning</span>
                    <span className="font-black text-emerald-600 dark:text-emerald-400 tabular-nums">
                      ৳{order.netAmount.toLocaleString()}
                    </span>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-slate-200/60 dark:border-white/10 text-[11px] text-slate-500 dark:text-slate-400">
                  <span>
                    {order.status === OrderEarningStatus.PENDING
                      ? formatCountdown(order.remainingMs, order.claimableAt)
                      : order.status === OrderEarningStatus.REFUNDED
                        ? order.refundReason || 'Returned by customer'
                        : `Completed ${formatDateTimeShort(order.completedAt)}`}
                  </span>
                  <button
                    type="button"
                    onClick={(e) => handleOpenMenu(order, e)}
                    className="p-1.5 rounded-lg text-slate-500 hover:text-navy-900 dark:hover:text-white hover:bg-slate-200/60 dark:hover:bg-navy-800"
                    aria-label="Actions menu"
                  >
                    <MoreVertical className="h-4 w-4" />
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Desktop Table (>= md) */}
      <div className="hidden md:block overflow-x-auto">
        <table className="w-full min-w-[820px] text-left text-xs">
          <thead className="bg-slate-100/80 dark:bg-navy-800/60 text-slate-600 dark:text-slate-300 uppercase tracking-wider font-semibold border-b border-slate-200/80 dark:border-white/10">
            <tr>
              <th className="p-3 w-9">
                <input
                  type="checkbox"
                  checked={allVisibleReadySelected}
                  onChange={toggleSelectAll}
                  disabled={selectableVisible.length === 0}
                  title="Select all Ready to Claim rows on this page"
                  className="rounded border-slate-300 dark:border-white/15 bg-white dark:bg-navy-900 text-orange-600 focus:ring-orange-500 cursor-pointer disabled:opacity-30"
                />
              </th>
              <th className="p-3">Transaction &amp; Completed</th>
              <th className="p-3">Order &amp; Items</th>
              <th className="p-3">Return Window</th>
              <th className="p-3">Order Bill</th>
              <th className="p-3">Fees</th>
              <th className="p-3 font-bold text-emerald-600 dark:text-emerald-400">Net Earning</th>
              <th className="p-3 text-center">Status</th>
              <th className="p-3 text-center w-14">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-white/5">
            {paginatedOrders.length === 0 ? (
              <tr>
                <td colSpan={9} className="p-10 text-center text-slate-500 dark:text-slate-400 text-xs">
                  No completed order earnings found for this filter. Deliver an order to generate live pending earnings.
                </td>
              </tr>
            ) : (
              paginatedOrders.map((order) => {
                const isReady = order.status === OrderEarningStatus.READY_TO_CLAIM;
                const isSelected = selectedIds.includes(order.id);
                return (
                  <tr
                    key={order.id}
                    className={`hover:bg-slate-50 dark:hover:bg-navy-800/40 transition-colors ${
                      isSelected ? 'bg-emerald-500/5' : ''
                    }`}
                  >
                    <td className="p-3">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        disabled={!isReady}
                        onChange={() => toggleSelectOne(order)}
                        className="rounded border-slate-300 dark:border-white/15 bg-white dark:bg-navy-900 text-orange-600 focus:ring-orange-500 cursor-pointer disabled:opacity-30"
                      />
                    </td>
                    <td className="p-3">
                      <span className="font-mono text-navy-900 dark:text-slate-200 block font-semibold">
                        {order.transactionRef}
                      </span>
                      <span className="text-[11px] text-slate-500 dark:text-slate-400">
                        {formatDateTimeShort(order.completedAt)}
                      </span>
                    </td>
                    <td className="p-3 max-w-[230px]">
                      <Link
                        href={`/merchant/orders/${encodeURIComponent(order.orderNumber)}`}
                        className="font-bold text-orange-600 dark:text-orange-400 hover:underline block text-xs"
                      >
                        #{order.orderNumber}
                      </Link>
                      <span className="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-1">
                        {order.itemSummary}
                      </span>
                    </td>
                    <td className="p-3 text-[11px]">
                      {order.status === OrderEarningStatus.PENDING ? (
                        <span className="font-semibold text-amber-600 dark:text-amber-300">
                          {formatCountdown(order.remainingMs, order.claimableAt)}
                        </span>
                      ) : order.status === OrderEarningStatus.REFUNDED ? (
                        <span className="text-rose-600 dark:text-rose-400 line-clamp-1">
                          {order.refundReason || 'Returned by customer'}
                        </span>
                      ) : order.status === OrderEarningStatus.CLAIMED ? (
                        <span className="text-slate-500 dark:text-slate-400">
                          Claimed {formatDateTimeShort(order.claimedAt)}
                        </span>
                      ) : (
                        <span className="text-emerald-600 dark:text-emerald-400 font-semibold">
                          {order.releasedByAdmin ? 'Released by Admin' : 'Return period over'}
                        </span>
                      )}
                    </td>
                    <td className="p-3 font-semibold text-slate-700 dark:text-slate-200 tabular-nums">
                      ৳ {order.grossAmount.toLocaleString()}
                    </td>
                    <td className="p-3 text-rose-600 dark:text-rose-400 font-mono tabular-nums">
                      -৳ {order.feeAmount.toLocaleString()}
                    </td>
                    <td className="p-3 font-black text-emerald-600 dark:text-emerald-400 tabular-nums">
                      {order.status === OrderEarningStatus.REFUNDED ? (
                        <span className="line-through text-slate-400">
                          ৳ {order.netAmount.toLocaleString()}
                        </span>
                      ) : (
                        <>৳ {order.netAmount.toLocaleString()}</>
                      )}
                    </td>
                    <td className="p-3 text-center">{renderStatusBadge(order.status)}</td>
                    <td className="p-3 text-center">
                      <div className="flex items-center justify-center">
                        <button
                          type="button"
                          onClick={(e) => handleOpenMenu(order, e)}
                          className="p-2 rounded-xl text-slate-500 hover:text-navy-900 dark:text-slate-400 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-navy-800 transition-colors cursor-pointer"
                          aria-label="Actions menu"
                        >
                          <MoreVertical className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination Footer */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-4 border-t border-slate-200/80 dark:border-white/10 text-xs text-slate-500 dark:text-slate-400">
        <div>
          Showing{' '}
          <strong className="text-navy-900 dark:text-white font-mono">
            {total === 0 ? 0 : (safePage - 1) * pageSize + 1}
          </strong>{' '}
          to{' '}
          <strong className="text-navy-900 dark:text-white font-mono">
            {Math.min(safePage * pageSize, total)}
          </strong>{' '}
          of <strong className="text-navy-900 dark:text-white font-mono">{total}</strong> orders
        </div>

        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1.5">
            <span>Rows per page:</span>
            <select
              value={pageSize}
              onChange={(e) => setPageSize(Number(e.target.value))}
              className="rounded-lg border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-navy-950 px-2 py-1 text-xs font-semibold text-navy-900 dark:text-white"
            >
              <option value={10}>10</option>
              <option value={25}>25</option>
              <option value={50}>50</option>
              <option value={100}>100</option>
            </select>
          </div>

          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={safePage <= 1}
              className="p-1.5 rounded-lg border border-slate-200 dark:border-white/10 disabled:opacity-40 hover:bg-slate-100 dark:hover:bg-navy-800 cursor-pointer"
              aria-label="Previous page"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
            </button>
            <span className="px-2.5 py-1 rounded-lg bg-orange-600 text-white font-bold font-mono">
              {safePage} / {totalPages}
            </span>
            <button
              type="button"
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={safePage >= totalPages}
              className="p-1.5 rounded-lg border border-slate-200 dark:border-white/10 disabled:opacity-40 hover:bg-slate-100 dark:hover:bg-navy-800 cursor-pointer"
              aria-label="Next page"
            >
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Portaled Row Actions Dropdown */}
      {menuState &&
        typeof document !== 'undefined' &&
        createPortal(
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              position: 'fixed',
              top: menuState.top,
              left: menuState.left,
              width: 200,
              maxHeight: 'calc(100vh - 20px)',
            }}
            className="z-[9999] rounded-xl border border-slate-200 dark:border-white/15 bg-white dark:bg-navy-900 shadow-2xl py-1.5 overflow-y-auto text-xs"
          >
            <button
              type="button"
              onClick={() => {
                setDetailRow(menuState.row);
                setMenuState(null);
              }}
              className="w-full px-3.5 py-2 text-left flex items-center gap-2 text-navy-900 dark:text-slate-100 hover:bg-slate-100 dark:hover:bg-navy-800 font-semibold cursor-pointer"
            >
              <Eye className="w-3.5 h-3.5 text-orange-500" />
              <span>View Fee Breakdown</span>
            </button>

            {menuState.row.status === OrderEarningStatus.READY_TO_CLAIM && (
              <button
                type="button"
                onClick={() => {
                  const id = menuState.row.id;
                  setMenuState(null);
                  onClaimSelected([id]);
                }}
                className="w-full px-3.5 py-2 text-left flex items-center gap-2 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 font-semibold cursor-pointer"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Claim to Wallet</span>
              </button>
            )}

            <Link
              href={`/merchant/orders/${encodeURIComponent(menuState.row.orderNumber)}`}
              onClick={() => setMenuState(null)}
              className="w-full px-3.5 py-2 text-left flex items-center gap-2 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-navy-800 font-semibold border-t border-slate-100 dark:border-white/10"
            >
              <ExternalLink className="w-3.5 h-3.5 text-slate-400" />
              <span>Open Order Details</span>
            </Link>
          </div>,
          document.body,
        )}

      {/* Portaled Fee Breakdown Modal */}
      {detailRow &&
        typeof document !== 'undefined' &&
        createPortal(
          <div
            className="fixed inset-0 z-[9999] flex items-center justify-center bg-slate-950/70 backdrop-blur-sm p-4"
            onClick={() => setDetailRow(null)}
          >
            <div
              className="w-full max-w-md rounded-2xl border border-slate-200 dark:border-white/10 bg-white dark:bg-navy-900 text-navy-900 dark:text-white shadow-2xl p-5 space-y-4"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between border-b border-slate-200 dark:border-white/10 pb-3">
                <div>
                  <h4 className="font-bold text-sm">Order Earning Breakdown</h4>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 font-mono">
                    #{detailRow.orderNumber} · {detailRow.transactionRef}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setDetailRow(null)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-navy-900 dark:hover:text-white"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="space-y-2 text-xs">
                <div className="flex justify-between">
                  <span className="text-slate-500 dark:text-slate-400">Status</span>
                  {renderStatusBadge(detailRow.status)}
                </div>
                <div className="flex justify-between pt-2 border-t border-slate-100 dark:border-white/5">
                  <span className="text-slate-500 dark:text-slate-400">Gross Order Bill</span>
                  <span className="font-bold tabular-nums">৳ {detailRow.grossAmount.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500 dark:text-slate-400">Courier Delivery Fee</span>
                  <span className="text-amber-600 dark:text-amber-400 tabular-nums">-৳ {detailRow.deliveryFee.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500 dark:text-slate-400">3PL Handling Fee</span>
                  <span className="text-rose-600 dark:text-rose-400 tabular-nums">-৳ {detailRow.handlingFee.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500 dark:text-slate-400">Packaging Cost</span>
                  <span className="text-rose-600 dark:text-rose-400 tabular-nums">-৳ {detailRow.packagingFee.toLocaleString()}</span>
                </div>
                <div className="flex justify-between pt-2 border-t border-slate-200 dark:border-white/10 font-extrabold text-sm">
                  <span>Net Merchant Earning</span>
                  <span className="text-emerald-600 dark:text-emerald-400 tabular-nums">
                    ৳ {detailRow.netAmount.toLocaleString()}
                  </span>
                </div>
              </div>

              <div className="p-3 rounded-xl bg-slate-50 dark:bg-navy-950 border border-slate-200 dark:border-white/10 text-[11px] space-y-1 text-slate-600 dark:text-slate-300">
                <div>Completed: <strong>{formatDateTimeShort(detailRow.completedAt)}</strong></div>
                <div>Return Window ({detailRow.returnWindowDays}d) Ends: <strong>{formatDateTimeShort(detailRow.claimableAt)}</strong></div>
                {detailRow.claimedAt && <div>Claimed: <strong>{formatDateTimeShort(detailRow.claimedAt)}</strong></div>}
                {detailRow.refundedAt && (
                  <div className="text-rose-600 dark:text-rose-400">
                    Refunded ({formatDateTimeShort(detailRow.refundedAt)}): {detailRow.refundReason}
                  </div>
                )}
              </div>
            </div>
          </div>,
          document.body,
        )}
    </div>
  );
}
