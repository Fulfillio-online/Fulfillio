'use client';

import React, { useState, useMemo } from 'react';
import { Truck, RotateCcw, CheckCircle2 } from 'lucide-react';
import {
  DeliveryTrackingStatus,
  DispatchedOrderRecord,
  MerchantSummaryRow,
} from './types';
import { INITIAL_DISPATCHED_ORDERS, MERCHANTS_LIST } from './mockData';
import { DeliveryKpiCards } from './components/DeliveryKpiCards';
import { MerchantDeliverySummaryTable } from './components/MerchantDeliverySummaryTable';
import { DeliveryFiltersBar } from './components/DeliveryFiltersBar';
import { DispatchedOrdersTable } from './components/DispatchedOrdersTable';
import { ConfirmDeliveryStatusModal } from './components/modals/ConfirmDeliveryStatusModal';

export function WarehouseDeliveryTracker({
  onOpenReturns,
}: {
  onOpenReturns?: () => void;
}) {
  const [orders, setOrders] = useState<DispatchedOrderRecord[]>(
    INITIAL_DISPATCHED_ORDERS
  );

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [merchantFilter, setMerchantFilter] = useState<string>('ALL');
  const [courierFilter, setCourierFilter] = useState<string>('ALL');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');

  // Confirmation Modal State
  const [confirmModal, setConfirmModal] = useState<{
    order: DispatchedOrderRecord;
    nextStatus: DeliveryTrackingStatus;
  } | null>(null);

  // Toast Banner
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage((prev) => (prev === msg ? null : prev));
    }, 4000);
  };

  // Top 4 KPI Metrics
  const kpiStats = useMemo(() => {
    const totalOrders = orders.length;
    const totalProductsSent = orders.reduce((sum, o) => sum + o.qtySent, 0);
    const inTransitCount = orders.filter((o) => o.status === 'IN_TRANSIT').length;
    const deliveredCount = orders.filter((o) => o.status === 'DELIVERED').length;
    const returnedCount = orders.filter((o) => o.status === 'RETURNED').length;
    const completedParcels = deliveredCount + returnedCount;
    const deliverySuccessRate =
      completedParcels > 0
        ? Math.round((deliveredCount / completedParcels) * 100)
        : 100;

    return {
      totalOrders,
      totalProductsSent,
      inTransitCount,
      deliveredCount,
      returnedCount,
      deliverySuccessRate,
    };
  }, [orders]);

  // Merchant-Wise Summary Metrics
  const merchantSummaryRows: MerchantSummaryRow[] = useMemo(() => {
    return MERCHANTS_LIST.map((m) => {
      const mOrders = orders.filter((o) => o.merchantCode === m.code);
      const dispatchedOrders = mOrders.length;
      const totalQty = mOrders.reduce((sum, o) => sum + o.qtySent, 0);
      const inTransit = mOrders.filter((o) => o.status === 'IN_TRANSIT').length;
      const delivered = mOrders.filter((o) => o.status === 'DELIVERED').length;
      const returned = mOrders.filter((o) => o.status === 'RETURNED').length;
      const totalCodValue = mOrders.reduce((sum, o) => sum + o.codAmount, 0);

      return {
        ...m,
        dispatchedOrders,
        totalQty,
        inTransit,
        delivered,
        returned,
        totalCodValue,
      };
    });
  }, [orders]);

  // Filtered Dispatched Orders
  const filteredOrders = useMemo(() => {
    return orders.filter((o) => {
      const q = searchQuery.trim().toLowerCase();
      const matchesSearch =
        !q ||
        o.id.toLowerCase().includes(q) ||
        o.trackingCode.toLowerCase().includes(q) ||
        o.customerName.toLowerCase().includes(q) ||
        o.fullSku.toLowerCase().includes(q) ||
        o.productTitle.toLowerCase().includes(q);
      const matchesMerchant =
        merchantFilter === 'ALL' || o.merchantCode === merchantFilter;
      const matchesCourier =
        courierFilter === 'ALL' || o.courier === courierFilter;
      const matchesStatus = statusFilter === 'ALL' || o.status === statusFilter;

      return (
        matchesSearch && matchesMerchant && matchesCourier && matchesStatus
      );
    });
  }, [orders, searchQuery, merchantFilter, courierFilter, statusFilter]);

  const handleConfirmStatusUpdate = () => {
    if (!confirmModal) return;
    const { order, nextStatus } = confirmModal;

    setOrders((prev) =>
      prev.map((item) =>
        item.id === order.id ? { ...item, status: nextStatus } : item
      )
    );

    showToast(
      `Order ${order.id} (${order.courier} · ${order.trackingCode}) marked as ${
        nextStatus === 'DELIVERED' ? 'DELIVERED' : 'RETURNED / RTO'
      }.`
    );
    setConfirmModal(null);
  };

  return (
    <div className="space-y-6 text-navy-800 dark:text-navy-800 dark:text-white">
      {/* Header Banner */}
      <div className="bg-white/90 dark:bg-navy-900/90 border border-slate-200 dark:border-white/10 rounded-2xl p-5 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 shadow-xl">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-600 dark:text-emerald-400 shrink-0">
            <Truck className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-lg sm:text-xl font-bold text-navy-800 dark:text-white tracking-tight">
              Courier Dispatch &amp; Post-Handover Delivery Tracker
            </h2>
            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300">
              Dedicated tracking for parcels handed over to Steadfast, Pathao, and RedX — keeping the Warehouse Orders Pipeline focused on in-warehouse fulfillment
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 text-xs">
          <span className="px-3 py-1.5 rounded-xl bg-slate-50 dark:bg-navy-950 border border-slate-200 dark:border-white/10 text-slate-700 dark:text-slate-200 font-medium">
            Active Couriers:{' '}
            <strong className="text-orange-600 dark:text-orange-400">Steadfast · Pathao · RedX</strong>
          </span>
          {onOpenReturns && (
            <button
              type="button"
              onClick={onOpenReturns}
              className="px-3 py-1.5 rounded-xl bg-rose-500/15 hover:bg-rose-500/25 border border-rose-500/40 text-rose-700 dark:text-rose-300 font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5 text-rose-600 dark:text-rose-400" />
              <span>Returns &amp; RTO Restock ({kpiStats.returnedCount})</span>
            </button>
          )}
        </div>
      </div>

      {/* Feedback Toast */}
      {toastMessage && (
        <div className="flex items-center justify-between gap-3 px-4 py-3 rounded-xl bg-emerald-500/15 border border-emerald-500/40 text-emerald-700 dark:text-emerald-300 text-sm animate-in fade-in">
          <div className="flex items-center gap-2.5">
            <CheckCircle2 className="w-4 h-4 text-orange-600 dark:text-orange-400 shrink-0" />
            <span>{toastMessage}</span>
          </div>
          <button
            type="button"
            onClick={() => setToastMessage(null)}
            className="text-xs text-orange-600 dark:text-orange-400 hover:text-orange-800 dark:hover:text-orange-200"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* 1. Top 4 KPI Cards */}
      <DeliveryKpiCards kpiStats={kpiStats} />

      {/* 2. Merchant-Wise Summary Table */}
      <MerchantDeliverySummaryTable
        rows={merchantSummaryRows}
        selectedMerchant={merchantFilter}
        onSelectMerchant={(code) =>
          setMerchantFilter((prev) => (prev === code ? 'ALL' : code))
        }
      />

      {/* 3. Filter Controls & Detailed Shipments Table */}
      <div className="space-y-4">
        <DeliveryFiltersBar
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          merchantFilter={merchantFilter}
          onMerchantFilterChange={setMerchantFilter}
          courierFilter={courierFilter}
          onCourierFilterChange={setCourierFilter}
          statusFilter={statusFilter}
          onStatusFilterChange={setStatusFilter}
          merchants={MERCHANTS_LIST}
        />

        <DispatchedOrdersTable
          orders={filteredOrders}
          onRequestStatusChange={(order, nextStatus) =>
            setConfirmModal({ order, nextStatus })
          }
          onOpenReturns={onOpenReturns}
        />
      </div>

      {/* Confirmation Modal */}
      <ConfirmDeliveryStatusModal
        modalState={confirmModal}
        onClose={() => setConfirmModal(null)}
        onConfirm={handleConfirmStatusUpdate}
      />
    </div>
  );
}

export default WarehouseDeliveryTracker;
