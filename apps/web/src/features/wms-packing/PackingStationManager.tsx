'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { CheckCircle2 } from 'lucide-react';
import { PackingOrder, PackingStatus, MerchantCode } from './types';
import { INITIAL_PACKING_ORDERS } from './mockData';
import { PackingHeader } from './components/PackingHeader';
import { PackingStatsCards } from './components/PackingStatsCards';
import { PackingFiltersBar } from './components/PackingFiltersBar';
import { PackingOrdersTable } from './components/PackingOrdersTable';
import { SingleSlipPreviewModal } from './components/modals/SingleSlipPreviewModal';
import { HiddenThermalPrintPortal } from './components/HiddenThermalPrintPortal';

export function PackingStationManager() {
  const [mounted, setMounted] = useState(false);
  const [orders, setOrders] = useState<PackingOrder[]>(INITIAL_PACKING_ORDERS);
  const [activeTab, setActiveTab] = useState<PackingStatus>('READY_TO_PACK');
  const [merchantFilter, setMerchantFilter] = useState<'ALL' | MerchantCode>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedIds, setSelectedIds] = useState<string[]>(['ORD-99201', 'ORD-99202']);
  const [previewOrder, setPreviewOrder] = useState<PackingOrder | null>(null);
  const [lastBatchNotice, setLastBatchNotice] = useState<string | null>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  const readyCount = useMemo(
    () => orders.filter((o) => o.status === 'READY_TO_PACK').length,
    [orders],
  );
  const packedCount = useMemo(
    () => orders.filter((o) => o.status === 'PACKED').length,
    [orders],
  );

  const filteredOrders = useMemo(() => {
    return orders.filter((order) => {
      if (order.status !== activeTab) return false;
      if (merchantFilter !== 'ALL' && order.merchantCode !== merchantFilter) return false;
      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase();
      const matchesItem = order.items.some(
        (item) =>
          item.sku.toLowerCase().includes(q) ||
          item.title.toLowerCase().includes(q) ||
          item.color.toLowerCase().includes(q) ||
          item.size.toLowerCase().includes(q),
      );
      return (
        order.id.toLowerCase().includes(q) ||
        order.merchantCode.toLowerCase().includes(q) ||
        order.merchantName.toLowerCase().includes(q) ||
        order.memoCode.toLowerCase().includes(q) ||
        order.resellerName.toLowerCase().includes(q) ||
        order.customerName.toLowerCase().includes(q) ||
        order.customerPhone.toLowerCase().includes(q) ||
        order.city.toLowerCase().includes(q) ||
        matchesItem
      );
    });
  }, [orders, activeTab, merchantFilter, searchQuery]);

  const visibleOrderIds = useMemo(() => filteredOrders.map((o) => o.id), [filteredOrders]);

  const allVisibleSelected =
    visibleOrderIds.length > 0 && visibleOrderIds.every((id) => selectedIds.includes(id));

  const toggleSelectAllVisible = () => {
    if (allVisibleSelected) {
      setSelectedIds((prev) => prev.filter((id) => !visibleOrderIds.includes(id)));
    } else {
      setSelectedIds((prev) => Array.from(new Set([...prev, ...visibleOrderIds])));
    }
  };

  const toggleSelectOne = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id],
    );
  };

  const ordersToPrint = useMemo(() => {
    if (previewOrder) {
      return [previewOrder];
    }
    return orders.filter((o) => selectedIds.includes(o.id));
  }, [orders, selectedIds, previewOrder]);

  const executeThermalPrintAndMarkPacked = (targetIds: string[]) => {
    if (targetIds.length === 0) return;

    document.body.classList.add('printing-single-invoice');
    window.print();
    document.body.classList.remove('printing-single-invoice');

    const timestamp = new Date().toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit',
    });

    setOrders((prev) =>
      prev.map((order) =>
        targetIds.includes(order.id)
          ? {
              ...order,
              status: 'PACKED',
              packedAt: timestamp,
            }
          : order,
      ),
    );

    setSelectedIds((prev) => prev.filter((id) => !targetIds.includes(id)));
    setLastBatchNotice(
      `Printed ${targetIds.length} Reseller Branded 4x6" Thermal Slip(s) (${targetIds.join(', ')}) and marked as PACKED.`,
    );
  };

  const handleBatchPrintSelected = () => {
    if (selectedIds.length === 0) return;
    setPreviewOrder(null);
    executeThermalPrintAndMarkPacked(selectedIds);
  };

  const handleSinglePreviewPrint = (order: PackingOrder) => {
    executeThermalPrintAndMarkPacked([order.id]);
    setPreviewOrder(null);
  };

  const handleResetDemoOrders = () => {
    setOrders(INITIAL_PACKING_ORDERS);
    setSelectedIds(['ORD-99201', 'ORD-99202']);
    setActiveTab('READY_TO_PACK');
    setLastBatchNotice('Demo packing queue restored to initial picked orders.');
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
      <PackingHeader
        selectedCount={selectedIds.length}
        onResetDemoOrders={handleResetDemoOrders}
        onBatchPrintSelected={handleBatchPrintSelected}
      />

      <main className="max-w-[1600px] w-full mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6 flex-1 flex flex-col gap-5">
        <PackingStatsCards
          readyCount={readyCount}
          selectedCount={selectedIds.length}
          packedCount={packedCount}
        />

        {lastBatchNotice && (
          <div className="bg-emerald-950/70 border border-emerald-500/50 rounded-xl px-4 py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-sm text-emerald-200">
            <div className="flex items-center gap-2.5">
              <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
              <span className="font-medium">{lastBatchNotice}</span>
            </div>
            <button
              type="button"
              onClick={() => setLastBatchNotice(null)}
              className="text-xs text-emerald-300 hover:text-white px-2 py-1 rounded self-end sm:self-auto"
            >
              Dismiss
            </button>
          </div>
        )}

        <PackingFiltersBar
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          readyCount={readyCount}
          packedCount={packedCount}
          merchantFilter={merchantFilter}
          setMerchantFilter={setMerchantFilter}
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
        />

        <PackingOrdersTable
          orders={filteredOrders}
          selectedIds={selectedIds}
          allVisibleSelected={allVisibleSelected}
          onToggleSelectAllVisible={toggleSelectAllVisible}
          onToggleSelectOne={toggleSelectOne}
          onPreviewOrder={setPreviewOrder}
        />
      </main>

      <SingleSlipPreviewModal
        order={previewOrder}
        onClose={() => setPreviewOrder(null)}
        onPrint={handleSinglePreviewPrint}
      />

      <HiddenThermalPrintPortal
        mounted={mounted}
        ordersToPrint={ordersToPrint}
      />
    </div>
  );
}

export default PackingStationManager;
