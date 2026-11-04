'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { Truck, Plus, CheckCircle2, ExternalLink } from 'lucide-react';
import {
  CourierPartner,
  OrderStage,
  PendingConfirmationAction,
  PipelineMainTab,
  WarehousePipelineOrder,
} from './types';
import { INITIAL_PIPELINE_ORDERS, STORAGE_KEY_ORDERS } from './mockData';
import { PipelineStageCards } from './components/PipelineStageCards';
import { PipelineFiltersBar } from './components/PipelineFiltersBar';
import { OrdersAllTab } from './components/tabs/OrdersAllTab';
import { OrdersPickTab } from './components/tabs/OrdersPickTab';
import { OrdersPackTab } from './components/tabs/OrdersPackTab';
import { OrdersDispatchTab } from './components/tabs/OrdersDispatchTab';
import { ActionConfirmModal } from './components/modals/ActionConfirmModal';
import { CreateOrderModal } from './components/modals/CreateOrderModal';
import { MemoPreviewModal } from './components/modals/MemoPreviewModal';
import { IsolatedPrintPortal } from './components/print/IsolatedPrintPortal';

export interface OrdersPipelineManagerProps {
  initialTab?: PipelineMainTab;
  activeTab?: PipelineMainTab;
  onTabChange?: (tab: PipelineMainTab) => void;
  onOpenDeliveryTracker?: () => void;
}

export function OrdersPipelineManager({
  initialTab = 'all',
  activeTab: controlledTab,
  onTabChange,
  onOpenDeliveryTracker,
}: OrdersPipelineManagerProps) {
  const [orders, setOrders] = useState<WarehousePipelineOrder[]>(INITIAL_PIPELINE_ORDERS);
  const [internalTab, setInternalTab] = useState<PipelineMainTab>(controlledTab ?? initialTab);
  const activeTab = controlledTab ?? internalTab;

  const [pickSubFilter, setPickSubFilter] = useState<'READY' | 'WAITING'>('READY');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [merchantFilter, setMerchantFilter] = useState<string>('ALL');
  const [stageFilter, setStageFilter] = useState<'ALL' | OrderStage>('ALL');
  const [courierFilter, setCourierFilter] = useState<string>('ALL');

  // Modals & Printing State
  const [toast, setToast] = useState<string | null>(null);
  const [previewMemoOrder, setPreviewMemoOrder] = useState<WarehousePipelineOrder | null>(null);
  const [printMode, setPrintMode] = useState<'MEMOS' | 'PICK_SHEET' | 'MANIFEST' | null>(null);
  const [printingOrders, setPrintingOrders] = useState<WarehousePipelineOrder[]>([]);
  const [pendingAction, setPendingAction] = useState<PendingConfirmationAction | null>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

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

  // Filtered orders
  const filteredOrders = useMemo(() => {
    return orders.filter((o) => {
      if (o.stage === 'HANDED_OVER') return false;

      const matchesMerchant = merchantFilter === 'ALL' || o.merchantCode === merchantFilter;
      const matchesCourier = courierFilter === 'ALL' || o.courier === courierFilter;
      const matchesSearch =
        !searchQuery.trim() ||
        o.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
        o.customerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        o.customerPhone.includes(searchQuery) ||
        o.sku.toLowerCase().includes(searchQuery.toLowerCase()) ||
        o.bin.toLowerCase().includes(searchQuery.toLowerCase()) ||
        o.memoCode.toLowerCase().includes(searchQuery.toLowerCase());

      if (!matchesMerchant || !matchesCourier || !matchesSearch) return false;

      if (activeTab === 'pick') {
        return pickSubFilter === 'READY' ? o.stage === 'PICK' : o.stage === 'WAITING';
      }
      if (activeTab === 'pack') return o.stage === 'PACK';
      if (activeTab === 'dispatch') return o.stage === 'DISPATCH';

      return stageFilter === 'ALL' || o.stage === stageFilter;
    });
  }, [orders, activeTab, pickSubFilter, merchantFilter, courierFilter, searchQuery, stageFilter]);

  // Stage counts
  const counts = useMemo(
    () => ({
      all: orders.filter((o) => o.stage !== 'HANDED_OVER').length,
      pickReady: orders.filter((o) => o.stage === 'PICK').length,
      pickWaiting: orders.filter((o) => o.stage === 'WAITING').length,
      pack: orders.filter((o) => o.stage === 'PACK').length,
      dispatch: orders.filter((o) => o.stage === 'DISPATCH').length,
      dispatchBooked: orders.filter((o) => o.stage === 'DISPATCH' && o.isCourierBooked).length,
      handedOver: orders.filter((o) => o.stage === 'HANDED_OVER').length,
    }),
    [orders]
  );

  const allVisibleSelected =
    filteredOrders.length > 0 && filteredOrders.every((o) => selectedIds.includes(o.id));

  const toggleSelectAll = () => {
    setSelectedIds(allVisibleSelected ? [] : filteredOrders.map((o) => o.id));
  };

  const toggleSelectRow = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handleInlineCourierChange = (orderId: string, newCourier: CourierPartner) => {
    setOrders((prev) =>
      prev.map((o) => {
        if (o.id !== orderId) return o;
        const updatedTracking = o.isCourierBooked
          ? `TRK-${newCourier.slice(0, 3).toUpperCase()}-${Math.floor(100000 + Math.random() * 900000)}`
          : o.trackingCode;
        return { ...o, courier: newCourier, trackingCode: updatedTracking };
      })
    );
    showToast(`Courier for ${orderId} updated to ${newCourier}.`);
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
        setOrders((prev) =>
          prev.map((o) => (ids.includes(o.id) ? { ...o, stage: 'PACK', holdReason: undefined } : o))
        );
        setSelectedIds([]);
        showToast(`${ids.length} order(s) verified from Bin & moved to 2. Pack List!`);
        break;

      case 'MARK_WAITING': {
        const reason = holdReasonInput?.trim() || 'Item not found in assigned Bin';
        setOrders((prev) =>
          prev.map((o) => (ids.includes(o.id) ? { ...o, stage: 'WAITING', holdReason: reason } : o))
        );
        setSelectedIds([]);
        showToast(`${ids.length} order(s) moved to Waiting / Hold (${reason}).`);
        break;
      }

      case 'RESUME_PICK':
        setOrders((prev) =>
          prev.map((o) => (ids.includes(o.id) ? { ...o, stage: 'PICK', holdReason: undefined } : o))
        );
        setSelectedIds([]);
        setPickSubFilter('READY');
        showToast(`${ids.length} order(s) restored to Ready to Pick!`);
        break;

      case 'PRINT_AND_PACK':
        triggerIsolatedPrint('MEMOS', action.orders);
        setOrders((prev) =>
          prev.map((o) =>
            ids.includes(o.id) ? { ...o, stage: 'DISPATCH', isMemoPrinted: true } : o
          )
        );
        setSelectedIds([]);
        showToast(
          `Printed ${action.orders.length} 4x6" Thermal Invoice(s) & moved to 3. Courier Dispatch!`
        );
        break;

      case 'BOOK_COURIER':
        setOrders((prev) =>
          prev.map((o) => {
            if (!ids.includes(o.id)) return o;
            const finalCourier: CourierPartner =
              courierOverride === 'KEEP_ORDER_COURIER' || !courierOverride
                ? o.courier
                : courierOverride;
            const prefix = finalCourier.slice(0, 3).toUpperCase();
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

      case 'CONFIRM_HANDOVER':
        setOrders((prev) =>
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

      case 'CANCEL_ORDER':
        setOrders((prev) =>
          prev.map((o) =>
            ids.includes(o.id)
              ? { ...o, stage: 'CANCELLED', stockAvailable: o.stockAvailable + o.qty }
              : o
          )
        );
        setSelectedIds([]);
        showToast(`Order ${ids.join(', ')} cancelled & stock restored to warehouse bin.`);
        break;
    }
  };

  const selectedOrders = useMemo(
    () => filteredOrders.filter((o) => selectedIds.includes(o.id)),
    [filteredOrders, selectedIds]
  );

  return (
    <div className="space-y-6">
      {toast && (
        <div className="fixed top-6 right-6 z-50 bg-emerald-600 text-white px-4 py-3 rounded-xl shadow-2xl flex items-center gap-2 text-xs font-bold animate-in fade-in">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>{toast}</span>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5 flex-wrap">
            <h1 className="text-2xl font-bold tracking-tight text-white">
              Warehouse Orders Pipeline
            </h1>
            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-mono font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
              In-Warehouse Fulfillment Only
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            Active warehouse operations: All Orders → 1. Pick List (Bin Verified) → 2. Pack &amp;
            4x6&quot; Print → 3. Courier Dispatch. Handed-over parcels move to Delivery Tracker.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            type="button"
            onClick={() => {
              if (onOpenDeliveryTracker) {
                onOpenDeliveryTracker();
              } else {
                showToast(
                  `${counts.handedOver} dispatched order(s) are tracked in Dispatched & Delivery Tracker.`
                );
              }
            }}
            className="px-3.5 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-sky-500/40 text-xs font-bold text-sky-300 flex items-center gap-2 shadow-sm transition-colors cursor-pointer"
          >
            <Truck className="w-4 h-4 text-sky-400" />
            <span>View Dispatched &amp; Delivery Tracker</span>
            <span className="px-2 py-0.5 rounded-full bg-sky-500/20 text-sky-200 font-mono text-[11px] border border-sky-500/30">
              {counts.handedOver} Sent
            </span>
            <ExternalLink className="w-3.5 h-3.5 text-sky-400" />
          </button>

          <button
            type="button"
            onClick={() => setIsCreateModalOpen(true)}
            className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-xs font-bold text-white flex items-center gap-1.5 shadow-lg transition-colors cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Create Manual Order</span>
          </button>
        </div>
      </div>

      {/* 4 Stage KPI Cards */}
      <PipelineStageCards
        activeTab={activeTab}
        onSelectTab={handleSelectTab}
        counts={counts}
      />

      {/* Filters & Bulk Action Bar */}
      <PipelineFiltersBar
        activeTab={activeTab}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        merchantFilter={merchantFilter}
        onMerchantFilterChange={setMerchantFilter}
        courierFilter={courierFilter}
        onCourierFilterChange={setCourierFilter}
        stageFilter={stageFilter}
        onStageFilterChange={setStageFilter}
        onResetFilters={() => {
          setSearchQuery('');
          setMerchantFilter('ALL');
          setCourierFilter('ALL');
          setStageFilter('ALL');
        }}
        pickSubFilter={pickSubFilter}
        selectedOrders={selectedOrders}
        filteredOrders={filteredOrders}
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
      />

      {/* Tab Views */}
      {activeTab === 'all' && (
        <OrdersAllTab
          orders={filteredOrders}
          selectedIds={selectedIds}
          onToggleSelectRow={toggleSelectRow}
          onToggleSelectAll={toggleSelectAll}
          allVisibleSelected={allVisibleSelected}
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

      {activeTab === 'pick' && (
        <OrdersPickTab
          orders={filteredOrders}
          selectedIds={selectedIds}
          onToggleSelectRow={toggleSelectRow}
          onToggleSelectAll={toggleSelectAll}
          allVisibleSelected={allVisibleSelected}
          pickSubFilter={pickSubFilter}
          onPickSubFilterChange={(sub) => {
            setPickSubFilter(sub);
            setSelectedIds([]);
          }}
          counts={counts}
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
          orders={filteredOrders}
          selectedIds={selectedIds}
          onToggleSelectRow={toggleSelectRow}
          onToggleSelectAll={toggleSelectAll}
          allVisibleSelected={allVisibleSelected}
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
          orders={filteredOrders}
          selectedIds={selectedIds}
          onToggleSelectRow={toggleSelectRow}
          onToggleSelectAll={toggleSelectAll}
          allVisibleSelected={allVisibleSelected}
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

      <CreateOrderModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        ordersCount={orders.length}
        onCreateOrder={(newOrder) => {
          setOrders((prev) => [newOrder, ...prev]);
          showToast(`Order ${newOrder.id} created & sent to 1. Pick List!`);
        }}
      />

      <MemoPreviewModal
        isOpen={Boolean(previewMemoOrder)}
        onClose={() => setPreviewMemoOrder(null)}
        order={previewMemoOrder}
        onPrint={() => window.print()}
      />

      <IsolatedPrintPortal
        printMode={printMode}
        orders={printingOrders}
      />
    </div>
  );
}

export default OrdersPipelineManager;
