'use client';

import React, { useState, useEffect } from 'react';
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
import {
  AVAILABLE_BINS,
  INITIAL_RETURNS,
  INITIAL_CANCELLED_ORDERS,
  INITIAL_RECOVERY_LEDGER,
  STORAGE_KEY_RETURNS,
} from './mockData';
import { WarehouseProductItem } from '@/features/admin/products';
import { ReturnsStatsCards } from './components/ReturnsStatsCards';
import { ReturnsFiltersBar } from './components/ReturnsFiltersBar';
import { ReturnsTable } from './components/ReturnsTable';
import { CancelledOrdersTable } from './components/CancelledOrdersTable';
import { ReturnsStockLedgerTab } from './components/ReturnsStockLedgerTab';
import { QcInspectionModal } from './components/modals/QcInspectionModal';
import { LogNewReturnModal } from './components/modals/LogNewReturnModal';
import { fetchOrdersFromDatabase } from '@/lib/warehouseSync';
import { STORAGE_KEY_ORDERS } from '@/features/admin/orders/mockData';
import { STORAGE_KEY_STOCK_LEDGER } from '@/features/admin/products/mockData';

const MERCHANTS_LIST = [
  { code: 'MC-101', name: "Sabbir's Store" },
  { code: 'MC-102', name: 'Urban Threads BD' },
  { code: 'MC-103', name: 'Apex Footwear Hub' },
  { code: 'MC-104', name: 'Gadget Freak Online' },
];

export function WarehouseReturnsManager({
  onOpenProducts,
}: {
  onOpenProducts?: () => void;
}) {
  const [activeTab, setActiveTab] = useState<ReturnsTabMode>('ALL');
  const [returnsList, setReturnsList] = useState<WarehouseReturnRecord[]>(INITIAL_RETURNS);
  const [cancelledOrders, setCancelledOrders] = useState<CancelledOrderItemRecord[]>(INITIAL_CANCELLED_ORDERS);
  const [ledgerEntries, setLedgerEntries] = useState<RecoveryLedgerEntry[]>(INITIAL_RECOVERY_LEDGER);
  const [liveProducts, setLiveProducts] = useState<WarehouseProductItem[]>([]);
  const [scanInput, setScanInput] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | ReturnStatus>('ALL');
  const [merchantFilter, setMerchantFilter] = useState<string>('ALL');
  const [rowBinSelections, setRowBinSelections] = useState<Record<string, string>>({
    'RTO-501': 'B-03-01',
    'RTO-502': 'C-01-01',
    'RTO-503': 'A-01-02',
    'RTO-504': 'D-01-01',
  });

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

  // Reconcile and load data from PostgreSQL DB & LocalStorage
  useEffect(() => {
    const syncData = async () => {
      try {
        // 1. Returns list
        const savedRet = localStorage.getItem(STORAGE_KEY_RETURNS);
        if (savedRet) {
          const parsed = JSON.parse(savedRet);
          if (Array.isArray(parsed) && parsed.length > 0) {
            setReturnsList(parsed);
          }
        } else {
          localStorage.setItem(STORAGE_KEY_RETURNS, JSON.stringify(INITIAL_RETURNS));
        }

        // 2. Warehouse Products (for live stock snapshot)
        const savedProds = localStorage.getItem('fulfillio_warehouse_products_v1');
        if (savedProds) {
          const parsedProds = JSON.parse(savedProds);
          if (Array.isArray(parsedProds)) {
            setLiveProducts(parsedProds);
          }
        }

        // 3. Cancelled orders from DB & localStorage
        let loadedCancelled: CancelledOrderItemRecord[] = [...INITIAL_CANCELLED_ORDERS];
        try {
          const dbOrders = await fetchOrdersFromDatabase();
          const dbCancelled = (dbOrders || []).filter(
            (o: any) => o.stage === 'CANCELLED' || o.status === 'CANCELLED' || o.status === 'RETURNED'
          );

          if (dbCancelled.length > 0) {
            const mappedDbCancelled: CancelledOrderItemRecord[] = dbCancelled.map((o: any) => {
              const cleanId = String(o.id || '').replace(/^#/, '');
              const firstItem = (o.items && o.items[0]) || {};
              return {
                id: cleanId,
                orderId: o.id.startsWith('#') ? o.id : `#${o.id}`,
                merchantCode: o.merchantCode || 'MC-101',
                merchantName: o.merchantName || "Sabbir's Store",
                customerName: o.customer?.name || o.customerName || 'Customer',
                customerPhone: o.customer?.phone || o.customerPhone || 'N/A',
                city: o.customer?.city || o.city || 'Dhaka',
                productTitle: firstItem.title || firstItem.productTitle || 'Product Item',
                fullSku: firstItem.sku || 'SKU-001',
                color: firstItem.color || 'Standard',
                size: firstItem.size || 'Standard',
                qty: (o.items || []).reduce((sum: number, it: any) => sum + (it.qty || 1), 0) || 1,
                unitPrice: firstItem.unitPrice || 1200,
                codAmount: o.codAmount || o.totalAmount || 1200,
                targetBin: firstItem.bin || 'A-01-01',
                currentStockSnapshot: 15,
                cancelledAt: 'Today',
                cancelReason: o.internalNotes || 'Order cancelled — auto-restored stock to available pool',
                isRestocked: true,
                restockedAt: 'Automatic Reversal',
                restockedBin: firstItem.bin || 'A-01-01',
                imageUrl: firstItem.image || '',
                items: o.items,
              };
            });

            // Merge unique by orderId
            for (const item of mappedDbCancelled) {
              if (!loadedCancelled.some((c) => c.orderId === item.orderId || c.id === item.id)) {
                loadedCancelled.unshift(item);
              }
            }
          }

          // Check localStorage orders
          const storedOrders = localStorage.getItem(STORAGE_KEY_ORDERS);
          if (storedOrders) {
            const parsedOrders = JSON.parse(storedOrders);
            if (Array.isArray(parsedOrders)) {
              const localCancelled = parsedOrders.filter(
                (o: any) => o.stage === 'CANCELLED' || o.status === 'CANCELLED'
              );
              for (const o of localCancelled) {
                const cleanId = String(o.id || '').replace(/^#/, '');
                const firstItem = (o.items && o.items[0]) || {};
                if (!loadedCancelled.some((c) => c.orderId === o.id || c.id === cleanId)) {
                  loadedCancelled.unshift({
                    id: cleanId,
                    orderId: o.id.startsWith('#') ? o.id : `#${o.id}`,
                    merchantCode: o.merchantCode || 'MC-101',
                    merchantName: o.merchantName || "Sabbir's Store",
                    customerName: o.customer?.name || o.customerName || 'Customer',
                    customerPhone: o.customer?.phone || o.customerPhone || 'N/A',
                    city: o.customer?.city || o.city || 'Dhaka',
                    productTitle: firstItem.title || firstItem.productTitle || 'Product Item',
                    fullSku: firstItem.sku || 'SKU-001',
                    color: firstItem.color || 'Standard',
                    size: firstItem.size || 'Standard',
                    qty: (o.items || []).reduce((sum: number, it: any) => sum + (it.qty || 1), 0) || 1,
                    unitPrice: firstItem.unitPrice || 1200,
                    codAmount: o.codAmount || o.totalAmount || 1200,
                    targetBin: firstItem.bin || 'A-01-01',
                    currentStockSnapshot: 15,
                    cancelledAt: 'Recently',
                    cancelReason: o.internalNotes || 'Order cancelled — auto-restored stock to available pool',
                    isRestocked: true,
                    restockedAt: 'Automatic Reversal',
                    restockedBin: firstItem.bin || 'A-01-01',
                    imageUrl: firstItem.image || '',
                    items: o.items,
                  });
                }
              }
            }
          }
        } catch {
          // fallback
        }
        setCancelledOrders(loadedCancelled);

        // 4. Stock Ledger Movements
        const savedLedger = localStorage.getItem(STORAGE_KEY_STOCK_LEDGER);
        if (savedLedger) {
          const parsed = JSON.parse(savedLedger);
          if (Array.isArray(parsed) && parsed.length > 0) {
            // Reconcile with recovery format
            const dynamicMovements: RecoveryLedgerEntry[] = parsed
              .filter(
                (m: any) =>
                  m.notes?.includes('cancel') ||
                  m.notes?.includes('Return') ||
                  m.notes?.includes('RTO') ||
                  m.referenceDocType === 'INTERNAL_AUDIT' ||
                  m.type === 'AUDIT_ADJUSTMENT' ||
                  m.type === 'RESTOCK'
              )
              .map((m: any) => ({
                id: m.id || `PRF-2026-${Math.floor(1000 + Math.random() * 9000)}`,
                timestamp: m.timestamp || '2026-11-22 14:00',
                sourceType:
                  m.type === 'INITIAL_INTAKE' ||
                  m.sourceType === 'INITIAL_INTAKE' ||
                  m.referenceDocType === 'INWARD_CHALLAN' ||
                  (typeof m.referenceNumber === 'string' && m.referenceNumber.startsWith('CHL-')) ||
                  m.carrierOrCourier?.toLowerCase().includes('initial catalog') ||
                  m.notes?.toLowerCase().includes('catalog submission')
                    ? 'INITIAL_INTAKE'
                    : m.sourceType === 'ORDER_CANCELLED' ||
                      m.type === 'ORDER_CANCELLED' ||
                      m.notes?.toLowerCase().includes('cancel')
                    ? 'ORDER_CANCELLED'
                    : m.sourceType === 'DAMAGED_QUARANTINE' ||
                      m.notes?.toLowerCase().includes('damage')
                    ? 'DAMAGED_QUARANTINE'
                    : 'COURIER_RETURN',
                referenceId: m.referenceNumber || m.id,
                merchantCode: m.merchantCode || 'MC-101',
                merchantName: m.merchantName || "Sabbir's Store",
                productTitle: m.productTitle || 'Product',
                sku: m.sku || 'SKU',
                deltaQty: Math.abs(m.deltaQty || 1),
                previousStock: m.previousStock || 10,
                newStock: m.newStock || 15,
                binCode: m.binCode || 'A-01-02',
                operator: m.operator || 'Admin',
                digitalProofHash: m.digitalProofHash || 'FL-SHA256-PROOF',
                notes: m.notes || 'Stock recovered & restored',
              }));

            const combined = [...INITIAL_RECOVERY_LEDGER];
            for (const dm of dynamicMovements) {
              if (!combined.some((c) => c.id === dm.id)) {
                combined.unshift(dm);
              }
            }
            setLedgerEntries(combined);
          }
        }
      } catch {
        // ignore storage errors
      }
    };

    syncData();
    window.addEventListener('fulfillio-warehouse-sync', syncData);
    return () => window.removeEventListener('fulfillio-warehouse-sync', syncData);
  }, []);

  const persistReturns = (updated: WarehouseReturnRecord[]) => {
    setReturnsList(updated);
    try {
      localStorage.setItem(STORAGE_KEY_RETURNS, JSON.stringify(updated));
    } catch {
      // ignore
    }
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
            <span>+ Log Inbound Return</span>
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
          merchants={MERCHANTS_LIST}
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
                  Cancelled Orders &mdash; Stock Automatically Restored ({filteredCancelled.length})
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
              availableBins={AVAILABLE_BINS}
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
              availableBins={AVAILABLE_BINS}
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
                Orders cancelled from the order pipeline or merchant portal. Units are unreserved and returned directly to available warehouse stock.
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
            availableBins={AVAILABLE_BINS}
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
            availableBins={AVAILABLE_BINS}
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
          merchants={MERCHANTS_LIST}
        />
      )}

      {/* QC Decision Modal */}
      <QcInspectionModal
        modalState={qcModal}
        availableBins={AVAILABLE_BINS}
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
