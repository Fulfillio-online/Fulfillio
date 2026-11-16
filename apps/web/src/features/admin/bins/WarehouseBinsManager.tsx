'use client';

import React, { useState, useEffect } from 'react';
import { MapPin, Plus, CheckCircle2, Boxes, Layers, Gauge } from 'lucide-react';
import { WarehouseBin, WarehouseProductItem } from '@/features/admin/products/types';
import {
  INITIAL_BINS,
  INITIAL_PRODUCTS,
  STORAGE_KEY_BINS,
  STORAGE_KEY_PRODUCTS,
  cleanBinCode,
} from '@/features/admin/products/mockData';
import { WarehouseBinsTab } from '@/features/admin/products/components/tabs/WarehouseBinsTab';
import { CreateBinModal } from '@/features/admin/products/components/modals/CreateBinModal';

export function WarehouseBinsManager() {
  const [bins, setBins] = useState<WarehouseBin[]>(INITIAL_BINS);
  const [products, setProducts] = useState<WarehouseProductItem[]>(INITIAL_PRODUCTS);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const triggerToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const loadData = () => {
    try {
      const rawBins = localStorage.getItem(STORAGE_KEY_BINS);
      if (rawBins) {
        const parsed = JSON.parse(rawBins);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setBins(parsed.map((b: WarehouseBin) => ({ ...b, code: cleanBinCode(b.code) })));
        }
      } else {
        localStorage.setItem(STORAGE_KEY_BINS, JSON.stringify(INITIAL_BINS));
      }

      const rawProds = localStorage.getItem(STORAGE_KEY_PRODUCTS);
      if (rawProds) {
        const parsed = JSON.parse(rawProds);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setProducts(parsed);
        }
      }
    } catch {
      // ignore
    }
  };

  useEffect(() => {
    loadData();
    const handleSync = (e: Event) => {
      const ce = e as CustomEvent | undefined;
      if (ce?.detail?.source === 'WarehouseBinsManager') return;
      loadData();
    };
    window.addEventListener('fulfillio-warehouse-sync', handleSync);
    window.addEventListener('storage', handleSync);
    return () => {
      window.removeEventListener('fulfillio-warehouse-sync', handleSync);
      window.removeEventListener('storage', handleSync);
    };
  }, []);

  const handleCreateBin = (newBin: WarehouseBin) => {
    const cleaned: WarehouseBin = {
      ...newBin,
      code: cleanBinCode(newBin.code),
    };
    const next = [...bins, cleaned];
    setBins(next);
    try {
      localStorage.setItem(STORAGE_KEY_BINS, JSON.stringify(next));
    } catch {
      // ignore
    }
    if (typeof window !== 'undefined') {
      window.dispatchEvent(
        new CustomEvent('fulfillio-warehouse-sync', { detail: { source: 'WarehouseBinsManager' } })
      );
    }
    setIsCreateModalOpen(false);
    triggerToast(`Warehouse Bin ${cleaned.code} created successfully.`);
  };

  // KPI Calculations
  const totalBins = bins.length;
  const totalCapacity = bins.reduce((sum, b) => sum + (b.capacityUnits || 250), 0);
  const totalUnitsStored = products
    .filter((p) => p.status !== 'REJECTED' && p.status !== 'DRAFT')
    .reduce((sum, p) => sum + (Number(p.stock) || 0), 0);
  const overallUtilization = totalCapacity > 0 ? Math.min(100, Math.round((totalUnitsStored / totalCapacity) * 100)) : 0;

  return (
    <div className="space-y-6 text-navy-800 dark:text-white">
      {/* Toast */}
      {toastMessage && (
        <div className="fixed top-6 right-6 z-50 bg-orange-600 text-white px-4 py-2.5 rounded-xl shadow-2xl flex items-center gap-2 text-xs font-bold animate-in fade-in slide-in-from-top-2">
          <CheckCircle2 className="w-4 h-4" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-navy-900 border border-slate-200 dark:border-white/10 rounded-2xl p-5 shadow-xl">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-orange-500/10 border border-orange-500/30 flex items-center justify-center text-orange-600 dark:text-orange-400 shrink-0">
            <MapPin className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-navy-900 dark:text-white">
              Warehouse Bins &amp; Shelf Slotting
            </h1>
            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 mt-0.5">
              Physical bin registry, zone assignments, and slotting capacity tracking across the warehouse.
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => setIsCreateModalOpen(true)}
          className="px-4 py-2.5 rounded-xl bg-orange-600 hover:bg-orange-700 text-xs sm:text-sm font-bold text-white flex items-center gap-2 shadow-lg shadow-orange-500/25 transition-all self-start sm:self-auto cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>+ Create New Bin</span>
        </button>
      </div>

      {/* KPI Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-navy-900 border border-slate-200 dark:border-white/10 rounded-2xl p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Total Bins</span>
            <MapPin className="w-4 h-4 text-orange-500" />
          </div>
          <div className="text-2xl font-extrabold text-navy-900 dark:text-white mt-1 tabular-nums">
            {totalBins}
          </div>
          <span className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 block">Active storage locations</span>
        </div>

        <div className="bg-white dark:bg-navy-900 border border-slate-200 dark:border-white/10 rounded-2xl p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Total Units Stored</span>
            <Boxes className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="text-2xl font-extrabold text-emerald-600 dark:text-emerald-400 mt-1 tabular-nums">
            {totalUnitsStored.toLocaleString()}
          </div>
          <span className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 block">Live inventory pieces</span>
        </div>

        <div className="bg-white dark:bg-navy-900 border border-slate-200 dark:border-white/10 rounded-2xl p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Total Capacity</span>
            <Layers className="w-4 h-4 text-indigo-500" />
          </div>
          <div className="text-2xl font-extrabold text-navy-900 dark:text-white mt-1 tabular-nums">
            {totalCapacity.toLocaleString()} <span className="text-xs font-normal text-slate-500">units</span>
          </div>
          <span className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 block">Combined maximum units</span>
        </div>

        <div className="bg-white dark:bg-navy-900 border border-slate-200 dark:border-white/10 rounded-2xl p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Warehouse Utilization</span>
            <Gauge className="w-4 h-4 text-amber-500" />
          </div>
          <div className="text-2xl font-extrabold text-orange-600 dark:text-orange-400 mt-1 tabular-nums">
            {overallUtilization}%
          </div>
          <span className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 block">Average shelf occupancy</span>
        </div>
      </div>

      {/* Bins Grid View */}
      <WarehouseBinsTab
        bins={bins}
        products={products}
        onOpenCreateBinModal={() => setIsCreateModalOpen(true)}
      />

      {/* Create Bin Modal */}
      <CreateBinModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        bins={bins}
        onCreateBin={handleCreateBin}
      />
    </div>
  );
}

export default WarehouseBinsManager;
