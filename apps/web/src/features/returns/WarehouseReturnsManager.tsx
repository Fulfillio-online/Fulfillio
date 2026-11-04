'use client';

import React, { useState, useEffect } from 'react';
import { RotateCcw, Plus, Package, CheckCircle2 } from 'lucide-react';
import { ReturnStatus, WarehouseReturnRecord } from './types';
import { AVAILABLE_BINS, INITIAL_RETURNS, STORAGE_KEY_RETURNS } from './mockData';
import { WarehouseProductItem } from '@/features/products';
import { ReturnsStatsCards } from './components/ReturnsStatsCards';
import { ReturnsFiltersBar } from './components/ReturnsFiltersBar';
import { ReturnsTable } from './components/ReturnsTable';
import { QcInspectionModal } from './components/modals/QcInspectionModal';
import { LogNewReturnModal } from './components/modals/LogNewReturnModal';

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
  const [returnsList, setReturnsList] = useState<WarehouseReturnRecord[]>(INITIAL_RETURNS);
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

  useEffect(() => {
    const syncData = () => {
      try {
        const savedRet = localStorage.getItem(STORAGE_KEY_RETURNS);
        if (savedRet) {
          const parsed = JSON.parse(savedRet);
          if (Array.isArray(parsed) && parsed.length > 0) {
            setReturnsList(parsed);
          }
        } else {
          localStorage.setItem(STORAGE_KEY_RETURNS, JSON.stringify(INITIAL_RETURNS));
        }

        const savedProds = localStorage.getItem('fulfillio_warehouse_products_v1');
        if (savedProds) {
          const parsedProds = JSON.parse(savedProds);
          if (Array.isArray(parsedProds)) {
            setLiveProducts(parsedProds);
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

  return (
    <div className="space-y-6 text-slate-100">
      {/* Header Banner */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 shadow-xl">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-xl bg-rose-500/10 border border-rose-500/30 flex items-center justify-center text-rose-400 shrink-0">
            <RotateCcw className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-lg sm:text-xl font-bold text-white tracking-tight">
              Warehouse Returns &amp; Reverse Logistics Intake
            </h2>
            <p className="text-xs sm:text-sm text-slate-400">
              Inspect returned parcels from Steadfast, Pathao &amp; RedX, verify tags, restock undamaged units to storage bins, and quarantine damages
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 text-xs">
          {onOpenProducts && (
            <button
              type="button"
              onClick={onOpenProducts}
              className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <Package className="w-3.5 h-3.5 text-emerald-400" />
              <span>Products Catalog</span>
            </button>
          )}

          <button
            type="button"
            onClick={() => setIsNewReturnModalOpen(true)}
            className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold flex items-center gap-1.5 shadow-lg shadow-emerald-950/50 transition-colors cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>+ Log Inbound Return</span>
          </button>
        </div>
      </div>

      {/* Toast Feedback */}
      {toastMessage && (
        <div className="flex items-center justify-between gap-3 px-4 py-3 rounded-xl bg-emerald-500/15 border border-emerald-500/40 text-emerald-300 text-sm shadow-md animate-in fade-in">
          <div className="flex items-center gap-2.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{toastMessage}</span>
          </div>
          <button
            type="button"
            onClick={() => setToastMessage(null)}
            className="text-xs text-emerald-400 hover:text-emerald-200"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Summary KPI Cards */}
      <ReturnsStatsCards returnsList={returnsList} />

      {/* Filter and Scan Toolbar */}
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

      {/* Returns Table */}
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
