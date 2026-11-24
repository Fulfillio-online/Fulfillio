'use client';

import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { Truck, RotateCcw, CheckCircle2, RefreshCw } from 'lucide-react';
import {
  fetchOrdersFromDatabase,
  updateOrderStatusInDatabase,
} from '@/lib/warehouseSync';
import {
  CourierPartner,
  DeliveryTrackingStatus,
  DispatchedOrderRecord,
  MerchantSummaryRow,
} from './types';
import { DeliveryKpiCards } from './components/DeliveryKpiCards';
import { MerchantDeliverySummaryTable } from './components/MerchantDeliverySummaryTable';
import { DeliveryFiltersBar } from './components/DeliveryFiltersBar';
import { DispatchedOrdersTable } from './components/DispatchedOrdersTable';
import { ConfirmDeliveryStatusModal } from './components/modals/ConfirmDeliveryStatusModal';

function mapDbStatusToDeliveryStatus(dbStatus?: string): DeliveryTrackingStatus | null {
  const upper = (dbStatus || '').toUpperCase();
  if (upper === 'DELIVERED' || upper === 'PARTIAL_DELIVERED') return 'DELIVERED';
  if (upper === 'RETURNED') return 'RETURNED';
  if (upper === 'DISPATCHED') return 'IN_TRANSIT';
  return null;
}

function normalizeCourier(raw?: string): CourierPartner {
  if (raw === 'Pathao') return 'Pathao';
  if (raw === 'RedX') return 'RedX';
  return 'Steadfast';
}

export function WarehouseDeliveryTracker({
  onOpenReturns,
}: {
  onOpenReturns?: () => void;
}) {
  const [orders, setOrders] = useState<DispatchedOrderRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const [searchQuery, setSearchQuery] = useState('');
  const [merchantFilter, setMerchantFilter] = useState<string>('ALL');
  const [courierFilter, setCourierFilter] = useState<string>('ALL');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');

  const [confirmModal, setConfirmModal] = useState<{
    order: DispatchedOrderRecord;
    nextStatus: DeliveryTrackingStatus;
  } | null>(null);

  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage((prev) => (prev === msg ? null : prev));
    }, 4000);
  };

  const loadDeliveryOrders = useCallback(async () => {
    setIsLoading(true);
    try {
      const dbOrders = await fetchOrdersFromDatabase({ limit: 500 });
      const mapped: DispatchedOrderRecord[] = [];
      for (const o of dbOrders) {
        const deliveryStatus = mapDbStatusToDeliveryStatus(o.dbStatus);
        if (!deliveryStatus) continue;
        mapped.push({
          id: o.id,
          dispatchedAt: o.createdAt || 'Today',
          merchantCode: o.merchantCode || 'MC-101',
          merchantName: o.merchantName || 'Merchant',
          productTitle: o.productTitle || 'Order Item',
          fullSku: o.sku || 'SKU-N/A',
          qtySent: o.qty || 1,
          customerName: o.customerName || 'Customer',
          customerPhone: o.customerPhone || '',
          city: o.city || 'Dhaka',
          courier: normalizeCourier(o.courier),
          trackingCode: o.trackingCode || `TRK-${o.id}`,
          codAmount: Number(o.codAmount) || 0,
          status: deliveryStatus,
        });
      }
      setOrders(mapped);
    } catch (err) {
      console.warn('[WarehouseDeliveryTracker] Failed to load orders from DB:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadDeliveryOrders();
  }, [loadDeliveryOrders]);

  const kpiStats = useMemo(() => {
    const totalOrders = orders.length;
    const totalProductsSent = orders.reduce((sum, o) => sum + o.qtySent, 0);
    const inTransitCount = orders.filter((o) => o.status === 'IN_TRANSIT').length;
    const deliveredCount = orders.filter((o) => o.status === 'DELIVERED').length;
    const returnedCount = orders.filter((o) => o.status === 'RETURNED').length;
    const completedParcels = deliveredCount + returnedCount;
    const deliverySuccessRate =
      completedParcels > 0 ? Math.round((deliveredCount / completedParcels) * 100) : 100;

    return {
      totalOrders,
      totalProductsSent,
      inTransitCount,
      deliveredCount,
      returnedCount,
      deliverySuccessRate,
    };
  }, [orders]);

  const dynamicMerchantsList = useMemo(() => {
    const seen = new Map<string, string>();
    for (const o of orders) {
      if (!seen.has(o.merchantCode)) {
        seen.set(o.merchantCode, o.merchantName);
      }
    }
    return Array.from(seen.entries()).map(([code, name]) => ({ code, name }));
  }, [orders]);

  const merchantSummaryRows: MerchantSummaryRow[] = useMemo(() => {
    return dynamicMerchantsList.map((m) => {
      const mOrders = orders.filter((o) => o.merchantCode === m.code);
      return {
        ...m,
        dispatchedOrders: mOrders.length,
        totalQty: mOrders.reduce((sum, o) => sum + o.qtySent, 0),
        inTransit: mOrders.filter((o) => o.status === 'IN_TRANSIT').length,
        delivered: mOrders.filter((o) => o.status === 'DELIVERED').length,
        returned: mOrders.filter((o) => o.status === 'RETURNED').length,
        totalCodValue: mOrders.reduce((sum, o) => sum + o.codAmount, 0),
      };
    });
  }, [orders, dynamicMerchantsList]);

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
      const matchesMerchant = merchantFilter === 'ALL' || o.merchantCode === merchantFilter;
      const matchesCourier = courierFilter === 'ALL' || o.courier === courierFilter;
      const matchesStatus = statusFilter === 'ALL' || o.status === statusFilter;

      return matchesSearch && matchesMerchant && matchesCourier && matchesStatus;
    });
  }, [orders, searchQuery, merchantFilter, courierFilter, statusFilter]);

  const handleConfirmStatusUpdate = async () => {
    if (!confirmModal) return;
    const { order, nextStatus } = confirmModal;

    const ok = await updateOrderStatusInDatabase(order.id, nextStatus);
    if (!ok) {
      showToast(`Failed to update Order ${order.id} in PostgreSQL. Please retry.`);
      setConfirmModal(null);
      return;
    }

    setOrders((prev) =>
      prev.map((item) => (item.id === order.id ? { ...item, status: nextStatus } : item)),
    );

    showToast(
      `Order ${order.id} marked as ${
        nextStatus === 'DELIVERED'
          ? 'DELIVERED — merchant earning added to Pending return-window hold'
          : 'RETURNED / RTO — merchant earning reversed to Refunded'
      }.`,
    );
    setConfirmModal(null);
  };

  return (
    <div className="space-y-6 text-navy-800 dark:text-white">
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
              Live database tracker — marking parcels DELIVERED credits merchant Pending Earnings; RETURNED reverses them automatically.
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 text-xs">
          <button
            type="button"
            onClick={loadDeliveryOrders}
            disabled={isLoading}
            className="px-3 py-1.5 rounded-xl bg-slate-50 dark:bg-navy-950 border border-slate-200 dark:border-white/10 text-slate-700 dark:text-slate-200 font-semibold flex items-center gap-1.5 cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-orange-500 ${isLoading ? 'animate-spin' : ''}`} />
            <span>Sync Orders</span>
          </button>

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

      {toastMessage && (
        <div className="flex items-center justify-between gap-3 px-4 py-3 rounded-xl bg-emerald-500/15 border border-emerald-500/40 text-emerald-700 dark:text-emerald-300 text-sm animate-in fade-in">
          <div className="flex items-center gap-2.5">
            <CheckCircle2 className="w-4 h-4 text-orange-600 dark:text-orange-400 shrink-0" />
            <span>{toastMessage}</span>
          </div>
          <button
            type="button"
            onClick={() => setToastMessage(null)}
            className="text-xs text-orange-600 dark:text-orange-400 hover:underline cursor-pointer"
          >
            Dismiss
          </button>
        </div>
      )}

      <DeliveryKpiCards kpiStats={kpiStats} />

      <MerchantDeliverySummaryTable
        rows={merchantSummaryRows}
        selectedMerchant={merchantFilter}
        onSelectMerchant={(code) =>
          setMerchantFilter((prev) => (prev === code ? 'ALL' : code))
        }
      />

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
          merchants={dynamicMerchantsList}
        />

        <DispatchedOrdersTable
          orders={filteredOrders}
          onRequestStatusChange={(order, nextStatus) =>
            setConfirmModal({ order, nextStatus })
          }
          onOpenReturns={onOpenReturns}
        />
      </div>

      <ConfirmDeliveryStatusModal
        modalState={confirmModal}
        onClose={() => setConfirmModal(null)}
        onConfirm={handleConfirmStatusUpdate}
      />
    </div>
  );
}

export default WarehouseDeliveryTracker;
