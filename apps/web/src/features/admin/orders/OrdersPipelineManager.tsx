'use client';

import React, { useState, useMemo, useEffect } from 'react';
import Link from 'next/link';
import { CheckCircle2, ListOrdered } from 'lucide-react';
import {
  CourierPartner,
  PendingConfirmationAction,
  PipelineMainTab,
  WarehousePipelineOrder,
} from './types';
import { INITIAL_PIPELINE_ORDERS, STORAGE_KEY_ORDERS } from './mockData';
import { PipelineStageCards } from './components/PipelineStageCards';
import { PipelineFiltersBar } from './components/PipelineFiltersBar';
import { OrdersPickTab } from './components/tabs/OrdersPickTab';
import { OrdersPackTab } from './components/tabs/OrdersPackTab';
import { OrdersDispatchTab } from './components/tabs/OrdersDispatchTab';
import { ActionConfirmModal } from './components/modals/ActionConfirmModal';
import { MemoPreviewModal } from './components/modals/MemoPreviewModal';
import { IsolatedPrintPortal } from './components/print/IsolatedPrintPortal';
import {
  reconcileAdminOrdersWithMerchant,
  syncAdminOrdersToMerchant,
  fetchOrdersFromDatabase,
  updateOrderStatusInDatabase,
  cancelOrderInDatabase,
  getAuthHeaders,
} from '@/lib/warehouseSync';

export interface OrdersPipelineManagerProps {
  initialTab?: PipelineMainTab;
  activeTab?: PipelineMainTab;
  initialSearch?: string;
  onTabChange?: (tab: PipelineMainTab) => void;
  onOpenDeliveryTracker?: () => void;
}

export function OrdersPipelineManager({
  initialTab = 'pick',
  activeTab: controlledTab,
  initialSearch = '',
  onTabChange,
}: OrdersPipelineManagerProps) {
  const [orders, setOrders] = useState<WarehousePipelineOrder[]>(INITIAL_PIPELINE_ORDERS);
  const [internalTab, setInternalTab] = useState<PipelineMainTab>(controlledTab ?? initialTab);
  const activeTab = controlledTab ?? internalTab;

  const [pickSubFilter, setPickSubFilter] = useState<'READY' | 'WAITING'>('READY');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  // Filters
  const [searchQuery, setSearchQuery] = useState(initialSearch);

  useEffect(() => {
    if (initialSearch !== undefined) {
      setSearchQuery(initialSearch);
    }
  }, [initialSearch]);
  const [merchantFilter, setMerchantFilter] = useState<string>('ALL');
  const [courierFilter, setCourierFilter] = useState<string>('ALL');

  // Pagination & Rows limit
  const [pageSize, setPageSize] = useState<number>(10);
  const [currentPage, setCurrentPage] = useState<number>(1);

  // Modals & Printing State
  const [toast, setToast] = useState<string | null>(null);
  const [previewMemoOrder, setPreviewMemoOrder] = useState<WarehousePipelineOrder | null>(null);
  const [printMode, setPrintMode] = useState<'MEMOS' | 'PICK_SHEET' | 'MANIFEST' | null>(null);
  const [printingOrders, setPrintingOrders] = useState<WarehousePipelineOrder[]>([]);
  const [pendingAction, setPendingAction] = useState<PendingConfirmationAction | null>(null);

  // Hydrate orders from localStorage on mount & reconcile with Merchant orders
  useEffect(() => {
    const loadOrders = async () => {
      try {
        const stored = localStorage.getItem(STORAGE_KEY_ORDERS);
        let baseOrders = INITIAL_PIPELINE_ORDERS;
        if (stored) {
          const parsed = JSON.parse(stored);
          if (Array.isArray(parsed) && parsed.length > 0) {
            baseOrders = parsed;
          }
        }
        let reconciled = reconcileAdminOrdersWithMerchant(baseOrders);

        // Fetch latest orders from PostgreSQL database
        try {
          const dbOrders = await fetchOrdersFromDatabase();
          if (dbOrders && dbOrders.length > 0) {
            const merged = [...dbOrders];
            for (const r of reconciled) {
              const rClean = (r.id || '').replace(/^#/, '');
              if (!merged.some((m) => m.id === r.id || m.id === rClean)) {
                merged.push(r);
              }
            }
            reconciled = merged;
            localStorage.setItem(STORAGE_KEY_ORDERS, JSON.stringify(reconciled));
          }
        } catch (dbErr) {
          console.warn('[OrdersPipelineManager] DB fetch fallback:', dbErr);
        }

        setOrders(reconciled);
      } catch (e) {
        console.error('Failed to load orders from localStorage:', e);
      }
    };

    loadOrders();

    const handleSync = (e: Event) => {
      const customEvent = e as CustomEvent<{ source?: string }>;
      if (customEvent.detail?.source === 'OrdersPipelineManager') return;
      loadOrders();
    };

    window.addEventListener('fulfillio-warehouse-sync', handleSync);
    window.addEventListener('storage', handleSync);
    return () => {
      window.removeEventListener('fulfillio-warehouse-sync', handleSync);
      window.removeEventListener('storage', handleSync);
    };
  }, []);

  // Helper to update orders state and persist to localStorage
  const updateOrdersAndPersist = (
    updater: (prev: WarehousePipelineOrder[]) => WarehousePipelineOrder[]
  ) => {
    setOrders((prev) => {
      const next = updater(prev);
      try {
        localStorage.setItem(STORAGE_KEY_ORDERS, JSON.stringify(next));
        syncAdminOrdersToMerchant(next);
        window.dispatchEvent(
          new CustomEvent('fulfillio-warehouse-sync', {
            detail: { source: 'OrdersPipelineManager' },
          })
        );
      } catch (e) {
        console.error('Failed to save orders to localStorage:', e);
      }
      return next;
    });
  };

  // Reset page when any filter or page size changes
  useEffect(() => {
    setCurrentPage(1);
    setSelectedIds([]);
  }, [searchQuery, merchantFilter, courierFilter, activeTab, pickSubFilter, pageSize]);

  // Sync tab props
  useEffect(() => {
    if (controlledTab) {
      setInternalTab(controlledTab);
      setSelectedIds([]);
    }
  }, [controlledTab]);

  useEffect(() => {
    if (!controlledTab) {
      setInternalTab(initialTab);
      setSelectedIds([]);
    }
  }, [initialTab, controlledTab]);

  const handleSelectTab = (tab: PipelineMainTab) => {
    setInternalTab(tab);
    setSelectedIds([]);
    onTabChange?.(tab);
  };

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3400);
  };

  // Printing trigger
  const triggerIsolatedPrint = (
    mode: 'MEMOS' | 'PICK_SHEET' | 'MANIFEST',
    targetOrders: WarehousePipelineOrder[]
  ) => {
    if (targetOrders.length === 0) return;
    setPrintMode(mode);
    setPrintingOrders(targetOrders);
    if (typeof document !== 'undefined') {
      document.body.classList.add('printing-single-invoice');
      setTimeout(() => {
        window.print();
        document.body.classList.remove('printing-single-invoice');
        setPrintMode(null);
      }, 90);
    }
  };

  // Strictly active warehouse pipeline orders (exclude completed/handed-over & cancelled/returned)
  const activePipelineOrders = useMemo(
    () =>
      orders.filter(
        (o) =>
          o.stage === 'PICK' ||
          o.stage === 'WAITING' ||
          o.stage === 'PACK' ||
          o.stage === 'DISPATCH'
      ),
    [orders]
  );

  // Dynamic merchant options from active pipeline orders
  const merchants = useMemo(() => {
    const map = new Map<string, string>();
    for (const o of activePipelineOrders) {
      if (o.merchantCode) {
        map.set(o.merchantCode, o.merchantName || o.merchantCode);
      }
    }
    return Array.from(map.entries())
      .map(([code, name]) => ({ code, name }))
      .sort((a, b) => a.code.localeCompare(b.code));
  }, [activePipelineOrders]);

  // Filtered pipeline orders for the active stage
  const filteredOrders = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return activePipelineOrders.filter((o) => {
      const matchesMerchant = merchantFilter === 'ALL' || o.merchantCode === merchantFilter;
      const matchesCourier = courierFilter === 'ALL' || o.courier === courierFilter;
      const matchesSearch =
        !q ||
        o.id.toLowerCase().includes(q) ||
        o.customerName.toLowerCase().includes(q) ||
        o.customerPhone.includes(searchQuery.trim()) ||
        o.sku.toLowerCase().includes(q) ||
        (o.productTitle && o.productTitle.toLowerCase().includes(q)) ||
        (o.items &&
          o.items.some(
            (it) =>
              it.sku.toLowerCase().includes(q) || it.title.toLowerCase().includes(q)
          )) ||
        o.bin.toLowerCase().includes(q) ||
        o.memoCode.toLowerCase().includes(q);

      if (!matchesMerchant || !matchesCourier || !matchesSearch) return false;

      if (activeTab === 'pick') {
        return pickSubFilter === 'READY' ? o.stage === 'PICK' : o.stage === 'WAITING';
      }
      if (activeTab === 'pack') return o.stage === 'PACK';
      return o.stage === 'DISPATCH';
    });
  }, [activePipelineOrders, activeTab, pickSubFilter, merchantFilter, courierFilter, searchQuery]);

  // Stage counts
  const counts = useMemo(
    () => ({
      pickReady: activePipelineOrders.filter((o) => o.stage === 'PICK').length,
      pickWaiting: activePipelineOrders.filter((o) => o.stage === 'WAITING').length,
      pack: activePipelineOrders.filter((o) => o.stage === 'PACK').length,
      dispatch: activePipelineOrders.filter((o) => o.stage === 'DISPATCH').length,
      dispatchBooked: activePipelineOrders.filter(
        (o) => o.stage === 'DISPATCH' && o.isCourierBooked
      ).length,
    }),
    [activePipelineOrders]
  );

  // Pagination calculations
  const totalItems = filteredOrders.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  const safePage = Math.min(Math.max(1, currentPage), totalPages);
  const startIndex = (safePage - 1) * pageSize;
  const paginatedOrders = filteredOrders.slice(startIndex, startIndex + pageSize);

  const allVisibleSelected =
    paginatedOrders.length > 0 && paginatedOrders.every((o) => selectedIds.includes(o.id));

  const toggleSelectAll = () => {
    setSelectedIds(allVisibleSelected ? [] : paginatedOrders.map((o) => o.id));
  };

  const toggleSelectRow = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handleInlineCourierChange = (orderId: string, newCourier: CourierPartner) => {
    updateOrdersAndPersist((prev) =>
      prev.map((o) => {
        if (o.id !== orderId) return o;
        const updatedTracking =
          o.isCourierBooked && newCourier
            ? `TRK-${newCourier.slice(0, 3).toUpperCase()}-${Math.floor(100000 + Math.random() * 900000)}`
            : o.trackingCode;
        return { ...o, courier: newCourier, trackingCode: updatedTracking };
      })
    );
    const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api';
    fetch(`${API_BASE}/orders/${encodeURIComponent(orderId)}/courier`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
      body: JSON.stringify({ courierProvider: newCourier || null }),
    }).catch(() => {});
    showToast(
      newCourier
        ? `Courier for ${orderId} updated to ${newCourier}.`
        : `Courier for ${orderId} cleared (Unassigned).`
    );
  };

  // Execute Confirmed Stage Actions
  const handleConfirmAction = (
    action: PendingConfirmationAction,
    holdReasonInput?: string,
    courierOverride?: 'KEEP_ORDER_COURIER' | CourierPartner
  ) => {
    const ids = action.orders.map((o) => o.id);

    switch (action.type) {
      case 'MARK_PICKED':
        ids.forEach((id) => updateOrderStatusInDatabase(id, 'PACKED').catch(() => {}));
        updateOrdersAndPersist((prev) =>
          prev.map((o) => (ids.includes(o.id) ? { ...o, stage: 'PACK', holdReason: undefined } : o))
        );
        setSelectedIds([]);
        showToast(`${ids.length} order(s) verified from Bin & moved to 2. Pack List!`);
        break;

      case 'MARK_WAITING': {
        const reason = holdReasonInput?.trim() || 'Awaiting merchant stock delivery';
        ids.forEach((id) => updateOrderStatusInDatabase(id, 'ON_HOLD_STOCK').catch(() => {}));
        updateOrdersAndPersist((prev) =>
          prev.map((o) => (ids.includes(o.id) ? { ...o, stage: 'WAITING', holdReason: reason } : o))
        );
        setSelectedIds([]);
        showToast(`${ids.length} order(s) moved to Waiting / Hold (${reason}).`);
        break;
      }

      case 'RESUME_PICK':
        ids.forEach((id) => updateOrderStatusInDatabase(id, 'ALLOCATED').catch(() => {}));
        updateOrdersAndPersist((prev) =>
          prev.map((o) => (ids.includes(o.id) ? { ...o, stage: 'PICK', holdReason: undefined } : o))
        );
        setSelectedIds([]);
        setPickSubFilter('READY');
        showToast(`${ids.length} order(s) restored to Ready to Pick!`);
        break;

      case 'PRINT_AND_PACK':
        ids.forEach((id) =>
          updateOrderStatusInDatabase(id, 'DISPATCHED', { isMemoPrinted: true }).catch(() => {})
        );
        updateOrdersAndPersist((prev) =>
          prev.map((o) =>
            ids.includes(o.id) ? { ...o, stage: 'DISPATCH', isMemoPrinted: true } : o
          )
        );
        setSelectedIds([]);
        showToast(
          `Printed ${action.orders.length} 4x6" Thermal Invoice(s) & moved to 3. Courier Dispatch!`
        );
        triggerIsolatedPrint('MEMOS', action.orders);
        break;

      case 'BOOK_COURIER': {
        const missingCourier = action.orders.some(
          (o) => (courierOverride === 'KEEP_ORDER_COURIER' || !courierOverride) && !o.courier
        );
        if (missingCourier) {
          showToast('Please select a Courier Partner before booking dispatch.');
          setPendingAction(null);
          return;
        }
        const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api';
        ids.forEach((id) => {
          updateOrderStatusInDatabase(id, 'DISPATCHED').catch(() => {});
          if (courierOverride && courierOverride !== 'KEEP_ORDER_COURIER') {
            fetch(`${API_BASE}/orders/${encodeURIComponent(id)}/courier`, {
              method: 'PATCH',
              headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
              body: JSON.stringify({ courierProvider: courierOverride }),
            }).catch(() => {});
          }
        });
        updateOrdersAndPersist((prev) =>
          prev.map((o) => {
            if (!ids.includes(o.id)) return o;
            const finalCourier: CourierPartner =
              courierOverride === 'KEEP_ORDER_COURIER' || !courierOverride
                ? o.courier
                : courierOverride;
            const prefix = (finalCourier || 'STR').slice(0, 3).toUpperCase();
            const code = `TRK-${prefix}-${Math.floor(100000 + Math.random() * 900000)}`;
            return {
              ...o,
              courier: finalCourier,
              stage: 'DISPATCH',
              isCourierBooked: true,
              trackingCode: code,
            };
          })
        );
        setSelectedIds([]);
        showToast(`Booked ${ids.length} parcel(s) in Courier API with Tracking ID!`);
        break;
      }

      case 'CONFIRM_HANDOVER':
        ids.forEach((id) => updateOrderStatusInDatabase(id, 'DELIVERED').catch(() => {}));
        updateOrdersAndPersist((prev) =>
          prev.map((o) => {
            if (!ids.includes(o.id)) return o;
            const prefix = o.courier.slice(0, 3).toUpperCase();
            const code =
              o.trackingCode || `TRK-${prefix}-${Math.floor(100000 + Math.random() * 900000)}`;
            return {
              ...o,
              stage: 'HANDED_OVER',
              isCourierBooked: true,
              trackingCode: code,
              handedOverAt: 'Just now',
            };
          })
        );
        setSelectedIds([]);
        showToast(
          `${ids.length} parcel(s) handed over to courier & moved to Delivery Tracker!`
        );
        break;

      case 'CANCEL_ORDER': {
        const cancelReason = holdReasonInput?.trim() || 'Cancelled from Order Pipeline';
        Promise.all(
          action.orders.map((ord) => cancelOrderInDatabase(ord.id, cancelReason))
        ).catch(() => {});
        updateOrdersAndPersist((prev) =>
          prev.map((o) =>
            ids.includes(o.id)
              ? { ...o, stage: 'CANCELLED', holdReason: cancelReason }
              : o
          )
        );
        setSelectedIds([]);
        showToast(
          `Order ${ids.join(', ')} cancelled and moved to Returns & Cancellations (Pending Restock).`
        );
        break;
      }
    }
  };

  const selectedOrders = useMemo(
    () => filteredOrders.filter((o) => selectedIds.includes(o.id)),
    [filteredOrders, selectedIds]
  );

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
            Order Pipeline
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Active warehouse workflow: 1. Pick List (Bin Verified) → 2. Pack &amp; 4x6&quot; Print → 3. Courier Dispatch.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Link
            href="/admin/orders/all"
            className="px-3.5 py-2 rounded-xl bg-white dark:bg-navy-900 hover:bg-slate-100 dark:hover:bg-navy-800 border border-slate-200 dark:border-white/10 text-xs font-semibold text-navy-800 dark:text-slate-100 flex items-center gap-2 shadow-2xs transition-colors"
          >
            <ListOrdered className="h-4 w-4 text-orange-600 dark:text-orange-400" />
            <span>All Orders History</span>
          </Link>
        </div>
      </div>

      {/* 3 Clickable Stage KPI Cards */}
      <PipelineStageCards
        activeTab={activeTab}
        onSelectTab={handleSelectTab}
        counts={counts}
      />

      {/* Active Filter Indicator */}
      {searchQuery && (
        <div className="flex items-center justify-between gap-3 px-4 py-2.5 rounded-xl bg-orange-500/10 border border-orange-500/25 text-xs text-navy-900 dark:text-slate-100 shadow-2xs animate-in fade-in-50">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-bold text-orange-600 dark:text-orange-400">Filtering pipeline orders for:</span>
            <span className="font-mono font-bold px-2.5 py-0.5 rounded-md bg-white dark:bg-navy-800 text-orange-600 dark:text-orange-400 border border-orange-500/30">
              {searchQuery}
            </span>
            <span className="text-slate-500 dark:text-slate-400">
              ({filteredOrders.length} matching order{filteredOrders.length !== 1 ? 's' : ''} in this stage)
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

      {/* Filters & Stage-Scoped Bulk Action Bar */}
      <PipelineFiltersBar
        activeTab={activeTab}
        pickSubFilter={pickSubFilter}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        merchantFilter={merchantFilter}
        onMerchantFilterChange={setMerchantFilter}
        merchants={merchants}
        courierFilter={courierFilter}
        onCourierFilterChange={setCourierFilter}
        onResetFilters={() => {
          setSearchQuery('');
          setMerchantFilter('ALL');
          setCourierFilter('ALL');
        }}
        selectedOrders={selectedOrders}
        onPrintPickSheet={() =>
          triggerIsolatedPrint('PICK_SHEET', selectedOrders.length > 0 ? selectedOrders : filteredOrders)
        }
        onMarkWaiting={() => setPendingAction({ type: 'MARK_WAITING', orders: selectedOrders })}
        onMarkPicked={() => setPendingAction({ type: 'MARK_PICKED', orders: selectedOrders })}
        onResumePick={() => setPendingAction({ type: 'RESUME_PICK', orders: selectedOrders })}
        onPrintAndPack={() => setPendingAction({ type: 'PRINT_AND_PACK', orders: selectedOrders })}
        onPrintManifest={() =>
          triggerIsolatedPrint('MANIFEST', selectedOrders.length > 0 ? selectedOrders : filteredOrders)
        }
        onBookCourier={() => setPendingAction({ type: 'BOOK_COURIER', orders: selectedOrders })}
        onConfirmHandover={() =>
          setPendingAction({ type: 'CONFIRM_HANDOVER', orders: selectedOrders })
        }
        onPrintMemos={() => triggerIsolatedPrint('MEMOS', selectedOrders)}
        onCancelSelected={() => setPendingAction({ type: 'CANCEL_ORDER', orders: selectedOrders })}
      />

      {/* Pipeline Stage Views (Pick -> Pack -> Dispatch) */}
      {activeTab === 'pick' && (
        <OrdersPickTab
          orders={paginatedOrders}
          selectedIds={selectedIds}
          onToggleSelectRow={toggleSelectRow}
          onToggleSelectAll={toggleSelectAll}
          allVisibleSelected={allVisibleSelected}
          onClearSelection={() => setSelectedIds([])}
          pickSubFilter={pickSubFilter}
          onPickSubFilterChange={(sub) => {
            setPickSubFilter(sub);
            setSelectedIds([]);
          }}
          counts={counts}
          totalItems={totalItems}
          startIndex={startIndex}
          pageSize={pageSize}
          safePage={safePage}
          totalPages={totalPages}
          onPageSizeChange={setPageSize}
          onPageChange={setCurrentPage}
          onPreviewMemo={(ord) => setPreviewMemoOrder(ord)}
          onInlineCourierChange={handleInlineCourierChange}
          onMarkWaiting={(ord) => setPendingAction({ type: 'MARK_WAITING', orders: [ord] })}
          onMarkPicked={(ord) => setPendingAction({ type: 'MARK_PICKED', orders: [ord] })}
          onResumePick={(ord) => setPendingAction({ type: 'RESUME_PICK', orders: [ord] })}
          onPrintAndPack={(ord) => setPendingAction({ type: 'PRINT_AND_PACK', orders: [ord] })}
          onBookCourier={(ord) => setPendingAction({ type: 'BOOK_COURIER', orders: [ord] })}
          onConfirmHandover={(ord) =>
            setPendingAction({ type: 'CONFIRM_HANDOVER', orders: [ord] })
          }
          onCancelOrder={(ord) => setPendingAction({ type: 'CANCEL_ORDER', orders: [ord] })}
        />
      )}

      {activeTab === 'pack' && (
        <OrdersPackTab
          orders={paginatedOrders}
          selectedIds={selectedIds}
          onToggleSelectRow={toggleSelectRow}
          onToggleSelectAll={toggleSelectAll}
          allVisibleSelected={allVisibleSelected}
          onClearSelection={() => setSelectedIds([])}
          totalItems={totalItems}
          startIndex={startIndex}
          pageSize={pageSize}
          safePage={safePage}
          totalPages={totalPages}
          onPageSizeChange={setPageSize}
          onPageChange={setCurrentPage}
          onPreviewMemo={(ord) => setPreviewMemoOrder(ord)}
          onInlineCourierChange={handleInlineCourierChange}
          onMarkWaiting={(ord) => setPendingAction({ type: 'MARK_WAITING', orders: [ord] })}
          onMarkPicked={(ord) => setPendingAction({ type: 'MARK_PICKED', orders: [ord] })}
          onResumePick={(ord) => setPendingAction({ type: 'RESUME_PICK', orders: [ord] })}
          onPrintAndPack={(ord) => setPendingAction({ type: 'PRINT_AND_PACK', orders: [ord] })}
          onBookCourier={(ord) => setPendingAction({ type: 'BOOK_COURIER', orders: [ord] })}
          onConfirmHandover={(ord) =>
            setPendingAction({ type: 'CONFIRM_HANDOVER', orders: [ord] })
          }
          onCancelOrder={(ord) => setPendingAction({ type: 'CANCEL_ORDER', orders: [ord] })}
        />
      )}

      {activeTab === 'dispatch' && (
        <OrdersDispatchTab
          orders={paginatedOrders}
          selectedIds={selectedIds}
          onToggleSelectRow={toggleSelectRow}
          onToggleSelectAll={toggleSelectAll}
          allVisibleSelected={allVisibleSelected}
          onClearSelection={() => setSelectedIds([])}
          totalItems={totalItems}
          startIndex={startIndex}
          pageSize={pageSize}
          safePage={safePage}
          totalPages={totalPages}
          onPageSizeChange={setPageSize}
          onPageChange={setCurrentPage}
          onPreviewMemo={(ord) => setPreviewMemoOrder(ord)}
          onInlineCourierChange={handleInlineCourierChange}
          onMarkWaiting={(ord) => setPendingAction({ type: 'MARK_WAITING', orders: [ord] })}
          onMarkPicked={(ord) => setPendingAction({ type: 'MARK_PICKED', orders: [ord] })}
          onResumePick={(ord) => setPendingAction({ type: 'RESUME_PICK', orders: [ord] })}
          onPrintAndPack={(ord) => setPendingAction({ type: 'PRINT_AND_PACK', orders: [ord] })}
          onBookCourier={(ord) => setPendingAction({ type: 'BOOK_COURIER', orders: [ord] })}
          onConfirmHandover={(ord) =>
            setPendingAction({ type: 'CONFIRM_HANDOVER', orders: [ord] })
          }
          onCancelOrder={(ord) => setPendingAction({ type: 'CANCEL_ORDER', orders: [ord] })}
        />
      )}

      {/* Modals */}
      <ActionConfirmModal
        isOpen={Boolean(pendingAction)}
        onClose={() => setPendingAction(null)}
        pendingAction={pendingAction}
        onConfirm={handleConfirmAction}
      />

      <MemoPreviewModal
        isOpen={Boolean(previewMemoOrder)}
        onClose={() => setPreviewMemoOrder(null)}
        order={previewMemoOrder}
        onPrint={() => {
          if (!previewMemoOrder) return;
          const targetOrder = previewMemoOrder;
          setPreviewMemoOrder(null);
          if (targetOrder.stage === 'PACK') {
            updateOrderStatusInDatabase(targetOrder.id, 'DISPATCHED', {
              isMemoPrinted: true,
            }).catch(() => {});
            updateOrdersAndPersist((prev) =>
              prev.map((o) =>
                o.id === targetOrder.id ? { ...o, stage: 'DISPATCH', isMemoPrinted: true } : o
              )
            );
            showToast(
              `Printed 4x6" Thermal Invoice for ${targetOrder.id} & moved to 3. Courier Dispatch!`
            );
          }
          triggerIsolatedPrint('MEMOS', [targetOrder]);
        }}
      />

      <IsolatedPrintPortal
        printMode={printMode}
        orders={printingOrders}
      />
    </div>
  );
}

export default OrdersPipelineManager;
