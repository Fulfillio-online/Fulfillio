'use client';

import React, { useState, useEffect } from 'react';
import { Plus, CheckCircle2, ShieldCheck, SlidersHorizontal } from 'lucide-react';
import { StockAdjustmentType, StockAuditLogItem } from './types';
import { INITIAL_AUDIT_LOG, STORAGE_KEY_STOCK_AUDIT } from './mockData';
import {
  StockMovementRecord,
  WarehouseProductItem,
} from '@/features/admin/products/types';
import {
  INITIAL_PRODUCTS,
  INITIAL_STOCK_MOVEMENTS,
  STORAGE_KEY_PRODUCTS,
  STORAGE_KEY_STOCK_LEDGER,
  generateDigitalProofHash,
} from '@/features/admin/products/mockData';
import { StockAuditLogTable } from './components/StockAuditLogTable';
import { CycleAdjustmentModal } from './components/modals/CycleAdjustmentModal';
import { WarehouseStockLedgerTab } from '@/features/admin/products/components/tabs/WarehouseStockLedgerTab';

export function WarehouseStockCycleManager({
  onOpenReturns,
}: {
  onOpenReturns?: () => void;
}) {
  const [activeTab, setActiveTab] = useState<'LEDGER' | 'CYCLE_COUNTS'>('LEDGER');
  const [auditLog, setAuditLog] = useState<StockAuditLogItem[]>(INITIAL_AUDIT_LOG);
  const [stockMovements, setStockMovements] = useState<StockMovementRecord[]>(INITIAL_STOCK_MOVEMENTS);
  const [products, setProducts] = useState<WarehouseProductItem[]>(INITIAL_PRODUCTS);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  const loadData = () => {
    try {
      const rawLog = localStorage.getItem(STORAGE_KEY_STOCK_AUDIT);
      if (rawLog) {
        setAuditLog(JSON.parse(rawLog));
      } else {
        localStorage.setItem(STORAGE_KEY_STOCK_AUDIT, JSON.stringify(INITIAL_AUDIT_LOG));
      }

      const rawLedger = localStorage.getItem(STORAGE_KEY_STOCK_LEDGER);
      if (rawLedger) {
        setStockMovements(JSON.parse(rawLedger));
      } else {
        localStorage.setItem(STORAGE_KEY_STOCK_LEDGER, JSON.stringify(INITIAL_STOCK_MOVEMENTS));
      }

      const rawProds = localStorage.getItem(STORAGE_KEY_PRODUCTS);
      if (rawProds) {
        setProducts(JSON.parse(rawProds));
      }
    } catch {
      // ignore
    }
  };

  useEffect(() => {
    loadData();
    window.addEventListener('fulfillio-warehouse-sync', loadData);
    window.addEventListener('storage', loadData);
    return () => {
      window.removeEventListener('fulfillio-warehouse-sync', loadData);
      window.removeEventListener('storage', loadData);
    };
  }, []);

  const handleApplyAdjustment = (
    sku: string,
    adjustType: 'CYCLE_SURPLUS' | 'MANUAL_RESTOCK' | 'DAMAGE_WRITEOFF',
    rawQty: number,
    reason: string
  ) => {
    const target = products.find((p) => p.fullSku === sku);
    if (!target) return;

    const signedDelta = adjustType === 'DAMAGE_WRITEOFF' ? -rawQty : rawQty;
    const nextStock = Math.max(0, target.stock + signedDelta);

    const updatedProducts = products.map((p) =>
      p.fullSku === sku ? { ...p, stock: nextStock } : p
    );
    setProducts(updatedProducts);
    try {
      localStorage.setItem(STORAGE_KEY_PRODUCTS, JSON.stringify(updatedProducts));
    } catch {
      // ignore
    }

    const now = new Date();
    const timeStr = `${now.toLocaleDateString('en-CA')} ${now.toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit',
    })}`;

    const newAuditEntry: StockAuditLogItem = {
      id: `AUD-${Math.floor(1000 + Math.random() * 9000)}`,
      timestamp: timeStr,
      merchantCode: target.merchantCode,
      fullSku: target.fullSku,
      productTitle: target.title,
      binCode: target.binCode,
      deltaQty: signedDelta,
      previousStock: target.stock,
      newStock: nextStock,
      type: adjustType,
      reason: reason.trim() || 'Supervisor cycle count adjustment',
      referenceId: `CYC-${Math.floor(100 + Math.random() * 900)}`,
    };

    const nextLog = [newAuditEntry, ...auditLog];
    setAuditLog(nextLog);
    try {
      localStorage.setItem(STORAGE_KEY_STOCK_AUDIT, JSON.stringify(nextLog));
    } catch {
      // ignore
    }

    // Also record into the Stock Movement Ledger so proof hash and receipts are preserved
    const movementId = `PRF-${now.getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;
    const proofHash = generateDigitalProofHash(`${movementId}-${target.fullSku}-${signedDelta}-${timeStr}`);
    const newMovement: StockMovementRecord = {
      id: movementId,
      timestamp: timeStr,
      type: 'AUDIT_ADJUSTMENT',
      merchantCode: target.merchantCode,
      merchantName: target.merchantName,
      productId: target.id,
      productTitle: target.title,
      sku: target.fullSku,
      deltaQty: signedDelta,
      previousStock: target.stock,
      newStock: nextStock,
      binCode: target.binCode,
      referenceDocType: 'INTERNAL_AUDIT',
      referenceNumber: newAuditEntry.referenceId,
      digitalProofHash: proofHash,
      operator: 'Supervisor Cycle Auditor',
      notes: reason.trim() || 'Manual cycle adjustment',
      verifiedAt: timeStr,
    };

    const nextLedger = [newMovement, ...stockMovements];
    setStockMovements(nextLedger);
    try {
      localStorage.setItem(STORAGE_KEY_STOCK_LEDGER, JSON.stringify(nextLedger));
    } catch {
      // ignore
    }

    window.dispatchEvent(
      new CustomEvent('fulfillio-warehouse-sync', { detail: { source: 'WarehouseStockCycleManager' } })
    );
    setToast(`Updated ${target.fullSku} in Bin ${target.binCode}: ${target.stock} → ${nextStock} units.`);
    setTimeout(() => setToast(null), 4000);
  };

  return (
    <div className="space-y-6 text-navy-800 dark:text-white">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-navy-900 border border-slate-200 dark:border-white/10 rounded-2xl p-5 shadow-xl">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-orange-500/10 border border-orange-500/30 flex items-center justify-center text-orange-600 dark:text-orange-400 shrink-0">
            <SlidersHorizontal className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-navy-900 dark:text-white">
              Stock &amp; Cycle Count Management
            </h1>
            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 mt-0.5">
              Live stock movement ledger, verified digital proof hashes, cycle counts, and supervisor inventory adjustments.
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {onOpenReturns && (
            <button
              type="button"
              onClick={onOpenReturns}
              className="px-3.5 py-2 rounded-xl bg-slate-100 dark:bg-navy-800 hover:bg-slate-200 dark:hover:bg-navy-700 text-xs font-semibold text-navy-800 dark:text-slate-100 border border-slate-300 dark:border-white/15 cursor-pointer"
            >
              Open Returns &amp; RTO
            </button>
          )}
          <button
            type="button"
            onClick={() => setIsModalOpen(true)}
            className="px-4 py-2 rounded-xl bg-orange-600 hover:bg-orange-700 text-xs font-bold text-white flex items-center gap-1.5 shadow-lg shadow-orange-500/25 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>+ New Cycle Count / Adjustment</span>
          </button>
        </div>
      </div>

      {toast && (
        <div className="p-3.5 rounded-xl bg-emerald-500/15 border border-emerald-500/40 text-emerald-700 dark:text-emerald-300 text-xs font-semibold flex items-center gap-2 animate-in fade-in">
          <CheckCircle2 className="w-4 h-4 text-orange-600 dark:text-orange-400 shrink-0" />
          <span>{toast}</span>
        </div>
      )}

      {/* Sub-Tabs Switcher */}
      <div className="flex items-center gap-2 p-1.5 rounded-2xl bg-white dark:bg-navy-900 border border-slate-200 dark:border-white/10 shadow-xs">
        <button
          type="button"
          onClick={() => setActiveTab('LEDGER')}
          className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all cursor-pointer flex items-center gap-2 ${
            activeTab === 'LEDGER'
              ? 'bg-orange-600 text-white shadow-md shadow-orange-500/25'
              : 'text-slate-600 dark:text-slate-300 hover:text-navy-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-navy-800'
          }`}
        >
          <ShieldCheck className="w-4 h-4" />
          <span>Stock Movement Ledger</span>
          <span
            className={`px-2 py-0.5 rounded-full text-xs tabular-nums font-bold ${
              activeTab === 'LEDGER'
                ? 'bg-white/20 text-white'
                : 'bg-emerald-500/15 border border-emerald-500/30 text-emerald-700 dark:text-emerald-300'
            }`}
          >
            {stockMovements.length}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('CYCLE_COUNTS')}
          className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all cursor-pointer flex items-center gap-2 ${
            activeTab === 'CYCLE_COUNTS'
              ? 'bg-orange-600 text-white shadow-md shadow-orange-500/25'
              : 'text-slate-600 dark:text-slate-300 hover:text-navy-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-navy-800'
          }`}
        >
          <SlidersHorizontal className="w-4 h-4" />
          <span>Cycle Counts &amp; Adjustments</span>
          <span
            className={`px-2 py-0.5 rounded-full text-xs tabular-nums ${
              activeTab === 'CYCLE_COUNTS'
                ? 'bg-white/20 text-white'
                : 'bg-slate-200 dark:bg-white/10 text-slate-700 dark:text-slate-200'
            }`}
          >
            {auditLog.length}
          </span>
        </button>
      </div>

      {/* Tab View */}
      {activeTab === 'LEDGER' ? (
        <WarehouseStockLedgerTab
          stockMovements={stockMovements}
          products={products}
        />
      ) : (
        <StockAuditLogTable auditLog={auditLog} />
      )}

      {/* Cycle Adjustment Modal */}
      <CycleAdjustmentModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        products={products}
        onApplyAdjustment={handleApplyAdjustment}
      />
    </div>
  );
}

export default WarehouseStockCycleManager;
