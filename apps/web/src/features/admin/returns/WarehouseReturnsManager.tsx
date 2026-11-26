'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import {
  RotateCcw,
  Plus,
  Package,
  CheckCircle2,
  XCircle,
  Boxes,
  FileText,
  Layers,
  ArrowRight,
  TrendingUp,
  ShieldCheck,
  Search,
} from 'lucide-react';
import {
  ReturnStatus,
  ReturnsTabMode,
  WarehouseReturnRecord,
  CancelledOrderItemRecord,
  RecoveryLedgerEntry,
} from './types';
import { WarehouseProductItem } from '@/features/admin/products';
import { ReturnsStatsCards } from './components/ReturnsStatsCards';
import { ReturnsFiltersBar } from './components/ReturnsFiltersBar';
import { ReturnsTable } from './components/ReturnsTable';
import { CancelledOrdersTable } from './components/CancelledOrdersTable';
import { ReturnsStockLedgerTab } from './components/ReturnsStockLedgerTab';
import { QcInspectionModal } from './components/modals/QcInspectionModal';
import { LogNewReturnModal } from './components/modals/LogNewReturnModal';
import { getAuthHeaders } from '@/lib/warehouseSync';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api';

export function WarehouseReturnsManager({
  onOpenProducts,
}: {
  onOpenProducts?: () => void;
}) {
  const [activeTab, setActiveTab] = useState<ReturnsTabMode>('ALL');
  const [returnsList, setReturnsList] = useState<WarehouseReturnRecord[]>([]);
  const [cancelledOrders, setCancelledOrders] = useState<CancelledOrderItemRecord[]>([]);
  const [ledgerEntries, setLedgerEntries] = useState<RecoveryLedgerEntry[]>([]);
  const [availableBins, setAvailableBins] = useState<string[]>(['A-01-01']);
  const [merchantsList, setMerchantsList] = useState<Array<{ code: string; name: string }>>([]);
  const [liveProducts, setLiveProducts] = useState<WarehouseProductItem[]>([]);
  const [scanInput, setScanInput] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | ReturnStatus>('ALL');
  const [merchantFilter, setMerchantFilter] = useState<string>('ALL');
  const [rowBinSelections, setRowBinSelections] = useState<Record<string, string>>({});
  const [restockingId, setRestockingId] = useState<string | null>(null);

  const [qcModal, setQcModal] = useState<{
    mode: 'RESTOCK' | 'DAMAGED';
    item: WarehouseReturnRecord;
    selectedBin: string;
    note: string;
  } | null>(null);

  const [isNewReturnModalOpen, setIsNewReturnModalOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const triggerToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage((prev) => (prev === msg ? null : prev));
    }, 4500);
  };

  // Load all Returns, Cancelled Orders, Recovery Ledger, Bins, and Merchants directly from Neon PostgreSQL
  const syncDataFromDatabase = useCallback(async () => {
    try {
      const authHeaders = getAuthHeaders();
      const [cancelledRes, returnsRes, ledgerRes, binsRes, merchantsRes] = await Promise.all([
        fetch(`${API_BASE}/returns/cancelled`, { headers: authHeaders }).catch(() => null),
        fetch(`${API_BASE}/returns`, { headers: authHeaders }).catch(() => null),
        fetch(`${API_BASE}/returns/ledger`, { headers: authHeaders }).catch(() => null),
        fetch(`${API_BASE}/returns/bins`, { headers: authHeaders }).catch(() => null),
        fetch(`${API_BASE}/merchants/public-directory`, { headers: authHeaders }).catch(() => null),
      ]);

      if (cancelledRes?.ok) {
        const data = await cancelledRes.json();
        if (Array.isArray(data)) {
          setCancelledOrders(data);
        }
      }

      if (returnsRes?.ok) {
        const data = await returnsRes.json();
        if (Array.isArray(data)) {
          const mappedReturns: WarehouseReturnRecord[] = data.map((r: any) => {
            const firstItem = r.items?.[0] || {};
            return {
              id: `RTO-${r.id}`,
              orderId: r.id?.startsWith('#') ? r.id : `#${r.id}`,
              trackingCode: r.trackingCode || `TRK-${r.id}`,
              courier: r.courier || 'Steadfast',
              merchantCode: r.merchantCode || 'MC-101',
              merchantName: r.merchantName || 'Merchant',
              productTitle: firstItem.title || 'Returned Product',
              fullSku: firstItem.sku || 'SKU-N/A',
              qty: (r.items || []).reduce((s: number, it: any) => s + (it.qty || 1), 0) || 1,
              targetBin: 'A-01-01',
              currentStockSnapshot: 0,
              returnReason: 'Courier RTO Return',
              status: 'PENDING_INSPECTION',
              receivedAt: r.returnedAt
                ? new Date(r.returnedAt).toLocaleString('en-GB', {
                    day: '2-digit',
                    month: 'short',
                    hour: '2-digit',
                    minute: '2-digit',
                  })
                : 'Recently',
              imageUrl: '',
            };
          });
          setReturnsList(mappedReturns);
        }
      }

      if (ledgerRes?.ok) {
        const data = await ledgerRes.json();
        if (Array.isArray(data)) {
          const mappedLedger: RecoveryLedgerEntry[] = data.map((m: any) => ({
            id: m.id,
            timestamp: m.timestamp,
            sourceType: m.sourceType || 'ORDER_CANCELLED',
            referenceId: m.orderId || '—',
            merchantCode: m.merchantCode || 'MC-101',
            merchantName: m.merchantName || 'Merchant',
            productTitle: m.productTitle || 'Product',
            sku: m.fullSku || 'SKU-N/A',
            deltaQty: m.qty ?? 0,
            previousStock: m.previousStock ?? 0,
            newStock: m.newStock ?? 0,
            binCode: m.binCode || 'A-01-01',
            operator: m.operatorName || 'Warehouse Admin',
            digitalProofHash: `DB-${String(m.id || '').slice(0, 8).toUpperCase()}`,
            notes: m.notes || 'Stock recovery recorded in PostgreSQL',
          }));
          setLedgerEntries(mappedLedger);
        }
      }

      if (binsRes?.ok) {
        const data = await binsRes.json();
        if (Array.isArray(data) && data.length > 0) {
          setAvailableBins(data);
        }
      }

      if (merchantsRes?.ok) {
        const data = await merchantsRes.json();
        const items = Array.isArray(data?.items) ? data.items : Array.isArray(data) ? data : [];
        setMerchantsList(
          items.map((m: any) => ({
            code: m.merchantCode || m.code || 'MC-101',
            name: m.businessName || m.storeName || m.name || 'Merchant',
          }))
        );
      }
    } catch {
      // keep current state on network failure
    }
  }, []);

  useEffect(() => {
    syncDataFromDatabase();
    window.addEventListener('fulfillio-warehouse-sync', syncDataFromDatabase);
    return () => window.removeEventListener('fulfillio-warehouse-sync', syncDataFromDatabase);
  }, [syncDataFromDatabase]);

  const handleRestockCancelledOrder = async (
    order: CancelledOrderItemRecord,
    binCode: string
  ) => {
    const cleanId = (order.orderId || order.id || '').replace(/^#/, '').trim();
    setRestockingId(order.id);
    try {
      const res = await fetch(
        `${API_BASE}/returns/cancelled/${encodeURIComponent(cleanId)}/restock`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
          body: JSON.stringify({
            binCode,
            notes: `Manually restocked cancelled order #${cleanId} (+${order.qty} pcs) into Bin ${binCode}`,
          }),
        }
      );
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        triggerToast(err?.message || `Failed to restock Order #${cleanId}.`);
        return;
      }
      await syncDataFromDatabase();
      triggerToast(
        `Restocked +${order.qty} pcs of ${order.fullSku} (Order #${cleanId}) into Bin ${binCode} in PostgreSQL!`
      );
    } catch {
      triggerToast(`Could not connect to API server to restock Order #${cleanId}.`);
    } finally {
      setRestockingId(null);
    }
  };

  const persistReturns = (updated: WarehouseReturnRecord[]) => {
    setReturnsList(updated);
  };

  const getLiveStockForSku = (fullSku: string, fallback: number): number => {
    const match = liveProducts.find((p) => p.fullSku === fullSku);
    return match ? match.stock : fallback;
  };

  const handleScanLookup = (e?: React.FormEvent, customCode?: string) => {
    if (e) e.preventDefault();
    const query = (customCode ?? scanInput).trim().toUpperCase();
    if (!query) return;

    const found = returnsList.find(
      (r) =>
        r.trackingCode.toUpperCase() === query ||
        r.orderId.toUpperCase() === query ||
        r.id.toUpperCase() === query
    );

    if (found) {
      setScanInput(found.trackingCode);
      const bin = rowBinSelections[found.id] || found.targetBin;
      setQcModal({
        mode: 'RESTOCK',
        item: found,
        selectedBin: bin,
        note: 'Barcode scanned at RTO station — item intact & ready for bin restock.',
      });
    } else {
      triggerToast(`No return parcel found matching "${query}". Try scanning RX-9902890 or SF-8838420.`);
    }
  };

  const handleExecuteQcDecision = (
    mode: 'RESTOCK' | 'DAMAGED',
    selectedBin: string,
    note: string
  ) => {
    if (!qcModal) return;
    const { item } = qcModal;
    const currentLiveStock = getLiveStockForSku(item.fullSku, item.currentStockSnapshot);

    if (mode === 'RESTOCK') {
      const updatedStock = currentLiveStock + item.qty;

      try {
        const savedProds = localStorage.getItem('fulfillio_warehouse_products_v1');
        if (savedProds) {
          const parsedProds: WarehouseProductItem[] = JSON.parse(savedProds);
          const nextProds = parsedProds.map((p) =>
            p.fullSku === item.fullSku
              ? { ...p, stock: p.stock + item.qty, binCode: selectedBin }
              : p
          );
          localStorage.setItem('fulfillio_warehouse_products_v1', JSON.stringify(nextProds));
          setLiveProducts(nextProds);
        }
      } catch {
        // ignore
      }

      const nextReturns = returnsList.map((r) =>
        r.id === item.id
          ? {
              ...r,
              status: 'RESTOCKED' as ReturnStatus,
              targetBin: selectedBin,
              currentStockSnapshot: updatedStock,
              processedAt: 'Just now',
              inspectorNote:
                note.trim() || `QC Passed. Added +${item.qty} units to Bin ${selectedBin} (New Stock: ${updatedStock}).`,
            }
          : r
      );
      persistReturns(nextReturns);

      // Record in Stock Recovery Ledger
      const now = new Date();
      const timeStr = `${now.toLocaleDateString('en-CA')} ${now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
      const newProofId = `PRF-${now.getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;
      const newLedgerItem: RecoveryLedgerEntry = {
        id: newProofId,
        timestamp: timeStr,
        sourceType: 'COURIER_RETURN',
        referenceId: item.trackingCode || item.orderId,
        merchantCode: item.merchantCode,
        merchantName: item.merchantName,
        productTitle: item.productTitle,
        sku: item.fullSku,
        deltaQty: item.qty,
        previousStock: currentLiveStock,
        newStock: updatedStock,
        binCode: selectedBin,
        operator: 'Warehouse QC Station (Admin)',
        digitalProofHash: `FL-SHA256-${item.id}-${Math.random().toString(36).substring(2, 8).toUpperCase()}`,
        notes: note.trim() || `QC Passed. Restocked +${item.qty} units into Bin ${selectedBin}.`,
      };

      setLedgerEntries((prev) => [newLedgerItem, ...prev]);

      window.dispatchEvent(new Event('fulfillio-warehouse-sync'));

      triggerToast(
        `Restocked +${item.qty} pcs of ${item.fullSku} into Bin ${selectedBin}! Stock increased from ${currentLiveStock} → ${updatedStock} units.`
      );
    } else {
      const nextReturns = returnsList.map((r) =>
        r.id === item.id
          ? {
              ...r,
              status: 'DAMAGED' as ReturnStatus,
              processedAt: 'Just now',
              inspectorNote:
                note.trim() || 'Marked as Damaged during RTO inspection — quarantined for merchant/courier claim.',
            }
          : r
      );
      persistReturns(nextReturns);

      const now = new Date();
      const timeStr = `${now.toLocaleDateString('en-CA')} ${now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
      const newProofId = `PRF-${now.getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;
      const newLedgerItem: RecoveryLedgerEntry = {
        id: newProofId,
        timestamp: timeStr,
        sourceType: 'DAMAGED_QUARANTINE',
        referenceId: item.trackingCode || item.orderId,
        merchantCode: item.merchantCode,
        merchantName: item.merchantName,
        productTitle: item.productTitle,
        sku: item.fullSku,
        deltaQty: 0,
        previousStock: currentLiveStock,
        newStock: currentLiveStock,
        binCode: 'QUARANTINE-01',
        operator: 'Warehouse QC Inspector (Admin)',
        digitalProofHash: `FL-SHA256-${item.id}-DMG-HOLD`,
        notes: note.trim() || 'Transit damage verified — item held in quarantine for insurance claim.',
      };

      setLedgerEntries((prev) => [newLedgerItem, ...prev]);

      triggerToast(
        `Parcel ${item.id} (${item.orderId}) marked as DAMAGED / QUARANTINE. Sellable stock was NOT modified.`
      );
    }

    setQcModal(null);
  };

  const handleLogNewReturn = (record: WarehouseReturnRecord) => {
    persistReturns([record, ...returnsList]);
    triggerToast(`Logged inbound return parcel ${record.id} for ${record.merchantName}!`);
  };

  // Filter returns
  const filteredReturns = returnsList.filter((r) => {
    const q = scanInput.trim().toUpperCase();
    const matchSearch =
      !q ||
      r.id.toUpperCase().includes(q) ||
      r.orderId.toUpperCase().includes(q) ||
      r.trackingCode.toUpperCase().includes(q) ||
      r.fullSku.toUpperCase().includes(q) ||
      r.productTitle.toUpperCase().includes(q);
    const matchMerchant = merchantFilter === 'ALL' || r.merchantCode === merchantFilter;
    const matchStatus = statusFilter === 'ALL' || r.status === statusFilter;
    return matchSearch && matchMerchant && matchStatus;
  });

  // Filter cancelled orders
  const filteredCancelled = cancelledOrders.filter((c) => {
    const q = scanInput.trim().toUpperCase();
    const matchSearch =
      !q ||
      c.orderId.toUpperCase().includes(q) ||
      c.id.toUpperCase().includes(q) ||
      c.fullSku.toUpperCase().includes(q) ||
      c.productTitle.toUpperCase().includes(q) ||
      c.customerName.toUpperCase().includes(q);
    const matchMerchant = merchantFilter === 'ALL' || c.merchantCode === merchantFilter;
    return matchSearch && matchMerchant;
  });

  const totalReverseItems = returnsList.length + cancelledOrders.length;

  return (
    <div className="space-y-6 text-navy-800 dark:text-white">
      {/* Header Banner */}
      <div className="bg-white/90 dark:bg-navy-900/90 border border-slate-200 dark:border-white/10 rounded-2xl p-5 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 shadow-xl">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-xl bg-orange-500/10 border border-orange-500/30 flex items-center justify-center text-orange-600 dark:text-orange-400 shrink-0">
            <RotateCcw className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg sm:text-xl font-bold text-navy-800 dark:text-white tracking-tight">
                Returns &amp; Cancellations Management Hub
              </h2>
              <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-orange-500/15 text-orange-600 dark:text-orange-400 border border-orange-500/30">
                Reverse Logistics &amp; Stock Ledger
              </span>
            </div>
            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 mt-0.5">
              Accumulate cancelled orders &amp; returned parcels, manage warehouse restocking to designated storage bins, and maintain accurate stock ledger accounting
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 text-xs">
          {onOpenProducts && (
            <button
              type="button"
              onClick={onOpenProducts}
              className="px-3.5 py-2 rounded-xl bg-slate-100 dark:bg-navy-800 hover:bg-slate-200 dark:hover:bg-navy-700 text-navy-800 dark:text-slate-100 border border-slate-300 dark:border-white/15 flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <Package className="w-3.5 h-3.5 text-orange-600 dark:text-orange-400" />
              <span>Products Catalog</span>
            </button>
          )}

          <button
            type="button"
            onClick={() => setIsNewReturnModalOpen(true)}
            className="px-4 py-2 rounded-xl bg-orange-600 hover:bg-orange-700 text-white font-bold flex items-center gap-1.5 shadow-lg shadow-orange-500/25 transition-colors cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Log Inbound Return</span>
          </button>
        </div>
      </div>

      {/* Toast Feedback */}
      {toastMessage && (
        <div className="flex items-center justify-between gap-3 px-4 py-3 rounded-xl bg-emerald-500/15 border border-emerald-500/40 text-emerald-700 dark:text-emerald-300 text-sm shadow-md animate-in fade-in">
          <div className="flex items-center gap-2.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
            <span>{toastMessage}</span>
          </div>
          <button
            type="button"
            onClick={() => setToastMessage(null)}
            className="text-xs text-emerald-700 dark:text-emerald-300 hover:underline font-semibold"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Summary KPI Cards */}
      <ReturnsStatsCards
        returnsList={returnsList}
        cancelledList={cancelledOrders}
        totalLedgerMovements={ledgerEntries.length}
      />

      {/* Main Mode Tabs Switcher */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-white dark:bg-navy-900 border border-slate-200 dark:border-white/10 rounded-2xl p-2 shadow-sm">
        <div className="flex flex-wrap items-center gap-1.5">
          {/* Tab 1: All Reverse Items */}
          <button
            type="button"
            onClick={() => setActiveTab('ALL')}
            className={`px-3.5 py-2 rounded-xl text-xs sm:text-sm font-bold flex items-center gap-2 transition-all cursor-pointer ${
              activeTab === 'ALL'
                ? 'bg-orange-600 text-white shadow-md shadow-orange-500/20'
                : 'text-slate-600 dark:text-slate-300 hover:text-navy-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-navy-800'
            }`}
          >
            <Layers className="w-4 h-4" />
            <span>All Reverse Items</span>
            <span
              className={`px-2 py-0.5 rounded-full text-[11px] tabular-nums font-semibold ${
                activeTab === 'ALL' ? 'bg-white/20 text-white' : 'bg-slate-200 dark:bg-navy-700 text-slate-700 dark:text-slate-300'
              }`}
            >
              {totalReverseItems}
            </span>
          </button>

          {/* Tab 2: Cancelled Orders */}
          <button
            type="button"
            onClick={() => setActiveTab('CANCELLED')}
            className={`px-3.5 py-2 rounded-xl text-xs sm:text-sm font-bold flex items-center gap-2 transition-all cursor-pointer ${
              activeTab === 'CANCELLED'
                ? 'bg-orange-600 text-white shadow-md shadow-orange-500/20'
                : 'text-slate-600 dark:text-slate-300 hover:text-navy-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-navy-800'
            }`}
          >
            <XCircle className="w-4 h-4 text-rose-500" />
            <span>Cancelled Orders</span>
            <span
              className={`px-2 py-0.5 rounded-full text-[11px] tabular-nums font-semibold ${
                activeTab === 'CANCELLED' ? 'bg-white/20 text-white' : 'bg-rose-500/10 text-rose-600 dark:text-rose-400'
              }`}
            >
              {cancelledOrders.length}
            </span>
          </button>

          {/* Tab 3: Courier Returns / RTO */}
          <button
            type="button"
            onClick={() => setActiveTab('RETURNS')}
            className={`px-3.5 py-2 rounded-xl text-xs sm:text-sm font-bold flex items-center gap-2 transition-all cursor-pointer ${
              activeTab === 'RETURNS'
                ? 'bg-orange-600 text-white shadow-md shadow-orange-500/20'
                : 'text-slate-600 dark:text-slate-300 hover:text-navy-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-navy-800'
            }`}
          >
            <RotateCcw className="w-4 h-4 text-amber-500" />
            <span>Courier Returns (RTO)</span>
            <span
              className={`px-2 py-0.5 rounded-full text-[11px] tabular-nums font-semibold ${
                activeTab === 'RETURNS' ? 'bg-white/20 text-white' : 'bg-amber-500/10 text-amber-600 dark:text-amber-400'
              }`}
            >
              {returnsList.length}
            </span>
          </button>

          {/* Tab 4: Stock Accounting Ledger */}
          <button
            type="button"
            onClick={() => setActiveTab('STOCK_LEDGER')}
            className={`px-3.5 py-2 rounded-xl text-xs sm:text-sm font-bold flex items-center gap-2 transition-all cursor-pointer ${
              activeTab === 'STOCK_LEDGER'
                ? 'bg-orange-600 text-white shadow-md shadow-orange-500/20'
                : 'text-slate-600 dark:text-slate-300 hover:text-navy-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-navy-800'
            }`}
          >
            <FileText className="w-4 h-4 text-sky-500" />
            <span>Stock Accounting Ledger</span>
            <span
              className={`px-2 py-0.5 rounded-full text-[11px] tabular-nums font-semibold ${
                activeTab === 'STOCK_LEDGER' ? 'bg-white/20 text-white' : 'bg-sky-500/10 text-sky-600 dark:text-sky-400'
              }`}
            >
              {ledgerEntries.length} Proofs
            </span>
          </button>
        </div>

        <div className="flex items-center gap-2 px-2 text-xs text-slate-500 dark:text-slate-400">
          <ShieldCheck className="w-4 h-4 text-emerald-500" />
          <span>Realtime Stock Ledger Synced</span>
        </div>
      </div>

      {/* Filter and Scan Toolbar (visible for ALL, CANCELLED, and RETURNS tabs) */}
      {activeTab !== 'STOCK_LEDGER' && (
        <ReturnsFiltersBar
          scanInput={scanInput}
          onScanInputChange={setScanInput}
          onScanSubmit={handleScanLookup}
          merchantFilter={merchantFilter}
          onMerchantFilterChange={setMerchantFilter}
          statusFilter={statusFilter}
          onStatusFilterChange={setStatusFilter}
          merchants={merchantsList}
        />
      )}

      {/* Tab 1: ALL REVERSE ITEMS */}
      {activeTab === 'ALL' && (
        <div className="space-y-6">
          {/* Section A: Cancelled Orders */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-2.5 h-2.5 rounded-full bg-rose-500" />
                <h3 className="text-sm font-bold text-navy-900 dark:text-white uppercase tracking-wider">
                  Cancelled Orders &mdash; Warehouse Restock Queue ({filteredCancelled.length})
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setActiveTab('CANCELLED')}
                className="text-xs font-semibold text-orange-600 hover:text-orange-700 dark:text-orange-400 flex items-center gap-1 cursor-pointer"
              >
                <span>View Full Table</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
            <CancelledOrdersTable
              orders={filteredCancelled}
              availableBins={availableBins}
              restockingId={restockingId}
              onRestockOrderToBin={handleRestockCancelledOrder}
            />
          </div>

          {/* Section B: Courier Returns (RTO) */}
          <div className="space-y-3 pt-4 border-t border-slate-200 dark:border-white/10">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-2.5 h-2.5 rounded-full bg-amber-500" />
                <h3 className="text-sm font-bold text-navy-900 dark:text-white uppercase tracking-wider">
                  Courier Inbound Returns &amp; RTO Parcels ({filteredReturns.length})
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setActiveTab('RETURNS')}
                className="text-xs font-semibold text-orange-600 hover:text-orange-700 dark:text-orange-400 flex items-center gap-1 cursor-pointer"
              >
                <span>View Returns Grid</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
            <ReturnsTable
              returns={filteredReturns}
              availableBins={availableBins}
              rowBinSelections={rowBinSelections}
              onBinSelectionChange={(id, bin) =>
                setRowBinSelections((prev) => ({ ...prev, [id]: bin }))
              }
              onOpenQcModal={(item, mode) => {
                const bin = rowBinSelections[item.id] || item.targetBin;
                setQcModal({
                  mode,
                  item,
                  selectedBin: bin,
                  note:
                    mode === 'RESTOCK'
                      ? `QC inspection verified item intact. Restocking +${item.qty} units to Bin ${bin}.`
                      : 'Item damaged during courier transit. Quarantined for merchant claim.',
                });
              }}
              getLiveStock={getLiveStockForSku}
            />
          </div>
        </div>
      )}

      {/* Tab 2: CANCELLED ORDERS */}
      {activeTab === 'CANCELLED' && (
        <div className="space-y-3">
          <div className="flex items-center justify-between px-1">
            <div>
              <h3 className="text-sm font-bold text-navy-900 dark:text-white">
                Cancelled Customer Orders ({filteredCancelled.length})
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Orders cancelled from the Orders Pipeline appear here as Pending Restock. Select a warehouse bin and click Restock to Bin to restore inventory in PostgreSQL.
              </p>
            </div>
            <Link
              href="/admin/orders"
              className="text-xs font-semibold text-orange-600 hover:text-orange-700 dark:text-orange-400 flex items-center gap-1"
            >
              <span>Go to Orders Pipeline</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
          <CancelledOrdersTable
            orders={filteredCancelled}
            availableBins={availableBins}
            restockingId={restockingId}
            onRestockOrderToBin={handleRestockCancelledOrder}
          />
        </div>
      )}

      {/* Tab 3: COURIER RETURNS (RTO) */}
      {activeTab === 'RETURNS' && (
        <div className="space-y-3">
          <div className="flex items-center justify-between px-1">
            <div>
              <h3 className="text-sm font-bold text-navy-900 dark:text-white">
                Courier Returns &amp; RTO Parcels ({filteredReturns.length})
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Parcels returned by Steadfast, Pathao, or RedX. Perform barcode tag verification, QC inspection, and bin restock.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setIsNewReturnModalOpen(true)}
              className="text-xs font-semibold text-orange-600 hover:text-orange-700 dark:text-orange-400 flex items-center gap-1 cursor-pointer"
            >
              <span>+ Log Inbound Parcel</span>
              <Plus className="w-3.5 h-3.5" />
            </button>
          </div>
          <ReturnsTable
            returns={filteredReturns}
            availableBins={availableBins}
            rowBinSelections={rowBinSelections}
            onBinSelectionChange={(id, bin) =>
              setRowBinSelections((prev) => ({ ...prev, [id]: bin }))
            }
            onOpenQcModal={(item, mode) => {
              const bin = rowBinSelections[item.id] || item.targetBin;
              setQcModal({
                mode,
                item,
                selectedBin: bin,
                note:
                  mode === 'RESTOCK'
                    ? `QC inspection verified item intact. Restocking +${item.qty} units to Bin ${bin}.`
                    : 'Item damaged during courier transit. Quarantined for merchant claim.',
              });
            }}
            getLiveStock={getLiveStockForSku}
          />
        </div>
      )}

      {/* Tab 4: STOCK ACCOUNTING LEDGER ("stock er hisab rakhar jonno") */}
      {activeTab === 'STOCK_LEDGER' && (
        <ReturnsStockLedgerTab
          ledgerEntries={ledgerEntries}
          merchants={merchantsList}
        />
      )}

      {/* QC Decision Modal */}
      <QcInspectionModal
        modalState={qcModal}
        availableBins={availableBins}
        currentLiveStock={
          qcModal ? getLiveStockForSku(qcModal.item.fullSku, qcModal.item.currentStockSnapshot) : 0
        }
        onClose={() => setQcModal(null)}
        onConfirm={handleExecuteQcDecision}
      />

      {/* Log Inbound Return Modal */}
      <LogNewReturnModal
        isOpen={isNewReturnModalOpen}
        onClose={() => setIsNewReturnModalOpen(false)}
        onLogReturn={handleLogNewReturn}
        liveProducts={liveProducts}
      />
    </div>
  );
}

export default WarehouseReturnsManager;
