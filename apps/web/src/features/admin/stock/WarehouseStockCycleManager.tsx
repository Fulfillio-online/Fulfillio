'use client';

import React, { useState, useEffect } from 'react';
import { Plus, CheckCircle2 } from 'lucide-react';
import { StockAdjustmentType, StockAuditLogItem } from './types';
import { INITIAL_AUDIT_LOG, STORAGE_KEY_STOCK_AUDIT } from './mockData';
import { WarehouseProductItem } from '@/features/admin/products';
import { StockAuditLogTable } from './components/StockAuditLogTable';
import { CycleAdjustmentModal } from './components/modals/CycleAdjustmentModal';

export function WarehouseStockCycleManager({
  onOpenReturns,
}: {
  onOpenReturns?: () => void;
}) {
  const [auditLog, setAuditLog] = useState<StockAuditLogItem[]>(INITIAL_AUDIT_LOG);
  const [products, setProducts] = useState<WarehouseProductItem[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  useEffect(() => {
    const load = () => {
      try {
        const rawLog = localStorage.getItem(STORAGE_KEY_STOCK_AUDIT);
        if (rawLog) {
          setAuditLog(JSON.parse(rawLog));
        } else {
          localStorage.setItem(STORAGE_KEY_STOCK_AUDIT, JSON.stringify(INITIAL_AUDIT_LOG));
        }

        const rawProds = localStorage.getItem('fulfillio_warehouse_products_v1');
        if (rawProds) {
          setProducts(JSON.parse(rawProds));
        }
      } catch {
        // ignore
      }
    };
    load();
    window.addEventListener('fulfillio-warehouse-sync', load);
    return () => window.removeEventListener('fulfillio-warehouse-sync', load);
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
      localStorage.setItem('fulfillio_warehouse_products_v1', JSON.stringify(updatedProducts));
    } catch {
      // ignore
    }

    const newEntry: StockAuditLogItem = {
      id: `AUD-${Math.floor(1000 + Math.random() * 9000)}`,
      timestamp: 'Just now',
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

    const nextLog = [newEntry, ...auditLog];
    setAuditLog(nextLog);
    try {
      localStorage.setItem(STORAGE_KEY_STOCK_AUDIT, JSON.stringify(nextLog));
    } catch {
      // ignore
    }

    window.dispatchEvent(new Event('fulfillio-warehouse-sync'));
    setToast(`Updated ${target.fullSku} in Bin ${target.binCode}: ${target.stock} → ${nextStock} units.`);
    setTimeout(() => setToast(null), 4000);
  };

  return (
    <div className="space-y-6 text-navy-800 dark:text-navy-800 dark:text-white">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-navy-900 border border-slate-200 dark:border-white/10 rounded-2xl p-5 shadow-xl">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-navy-800 dark:text-white">
            Stock Adjustments &amp; Cycle Counts
          </h1>
          <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 mt-0.5">
            Live audit ledger of all Return (RTO) restocks, shelf cycle counts, and supervisor inventory adjustments.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
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
          <CheckCircle2 className="w-4 h-4 text-orange-600 dark:text-orange-400" />
          <span>{toast}</span>
        </div>
      )}

      {/* Audit Log Table */}
      <StockAuditLogTable auditLog={auditLog} />

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
