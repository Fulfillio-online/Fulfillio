'use client';

import React from 'react';
import {
  Printer,
  FileText,
  Truck,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  RotateCcw,
} from 'lucide-react';
import { SearchInput } from '@/components/ui';
import { CourierPartner, OrderStage, PipelineMainTab, WarehousePipelineOrder } from '../types';

interface PipelineFiltersBarProps {
  activeTab: PipelineMainTab;
  onTabChange?: (tab: PipelineMainTab) => void;
  counts?: {
    all: number;
    pickReady: number;
    pickWaiting: number;
    pack: number;
    dispatch: number;
  };
  searchQuery: string;
  onSearchChange: (query: string) => void;
  merchantFilter: string;
  onMerchantFilterChange: (code: string) => void;
  courierFilter: string;
  onCourierFilterChange: (courier: string) => void;
  stageFilter: 'ALL' | OrderStage;
  onStageFilterChange: (stage: 'ALL' | OrderStage) => void;
  onResetFilters: () => void;
  // Stage actions
  pickSubFilter: 'READY' | 'WAITING';
  selectedOrders: WarehousePipelineOrder[];
  filteredOrders: WarehousePipelineOrder[];
  onPrintPickSheet: () => void;
  onMarkWaiting: () => void;
  onMarkPicked: () => void;
  onResumePick: () => void;
  onPrintAndPack: () => void;
  onPrintManifest: () => void;
  onBookCourier: () => void;
  onConfirmHandover: () => void;
}

export function PipelineFiltersBar({
  activeTab,
  onTabChange,
  counts,
  searchQuery,
  onSearchChange,
  merchantFilter,
  onMerchantFilterChange,
  courierFilter,
  onCourierFilterChange,
  stageFilter,
  onStageFilterChange,
  onResetFilters,
  pickSubFilter,
  selectedOrders,
  onPrintPickSheet,
  onMarkWaiting,
  onMarkPicked,
  onResumePick,
  onPrintAndPack,
  onPrintManifest,
  onBookCourier,
  onConfirmHandover,
}: PipelineFiltersBarProps) {
  const hasActiveFilters =
    searchQuery || merchantFilter !== 'ALL' || courierFilter !== 'ALL' || stageFilter !== 'ALL';

  return (
    <div className="rounded-2xl border border-slate-200 dark:border-white/10 bg-white/90 dark:bg-navy-900/90 p-4 flex flex-col lg:flex-row lg:items-center justify-between gap-3 shadow-md">
      {/* Left Filters */}
      <div className="flex flex-wrap items-center gap-2.5 w-full lg:w-auto">
        {/* Stage Selector */}
        {onTabChange && (
          <select
            value={activeTab}
            onChange={(e) => onTabChange(e.target.value as PipelineMainTab)}
            aria-label="Filter by Pipeline Stage"
            className="px-3 py-2.5 rounded-xl bg-slate-50 dark:bg-navy-950 border border-slate-200 dark:border-white/10 text-xs font-bold text-orange-600 dark:text-orange-400 focus:outline-none focus:border-orange-500 cursor-pointer shadow-sm"
          >
            <option value="all">
              All Orders {counts ? `(${counts.all})` : ''}
            </option>
            <option value="pick">
              1. Pick List {counts ? `(${counts.pickReady + counts.pickWaiting})` : ''}
            </option>
            <option value="pack">
              2. Pack &amp; Print {counts ? `(${counts.pack})` : ''}
            </option>
            <option value="dispatch">
              3. Courier Dispatch {counts ? `(${counts.dispatch})` : ''}
            </option>
          </select>
        )}

        <div className="flex-1 sm:flex-initial sm:w-64 min-w-[190px]">
          <SearchInput
            value={searchQuery}
            onChange={onSearchChange}
            placeholder="Search Order, Bin, SKU, Customer..."
          />
        </div>

        <select
          value={merchantFilter}
          onChange={(e) => onMerchantFilterChange(e.target.value)}
          aria-label="Filter by Merchant"
          className="px-3 py-2.5 rounded-xl bg-slate-50 dark:bg-navy-950 border border-slate-200 dark:border-white/10 text-xs text-navy-800 dark:text-slate-100 focus:outline-none focus:border-orange-500"
        >
          <option value="ALL">All Merchants</option>
          <option value="MC-101">MC-101 — Sabbir&apos;s Store</option>
          <option value="MC-102">MC-102 — Urban Threads BD</option>
          <option value="MC-103">MC-103 — Apex Footwear Hub</option>
        </select>

        <select
          value={courierFilter}
          onChange={(e) => onCourierFilterChange(e.target.value)}
          aria-label="Filter by Courier Partner"
          className="px-3 py-2.5 rounded-xl bg-slate-50 dark:bg-navy-950 border border-slate-200 dark:border-white/10 text-xs text-navy-800 dark:text-slate-100 focus:outline-none focus:border-orange-500"
        >
          <option value="ALL">All Couriers</option>
          <option value="Steadfast">Steadfast</option>
          <option value="Pathao">Pathao</option>
          <option value="RedX">RedX</option>
        </select>

        {activeTab === 'all' && (
          <select
            value={stageFilter}
            onChange={(e) => onStageFilterChange(e.target.value as 'ALL' | OrderStage)}
            aria-label="Filter by Stage"
            className="px-3 py-2.5 rounded-xl bg-slate-50 dark:bg-navy-950 border border-slate-200 dark:border-white/10 text-xs text-navy-800 dark:text-slate-100 focus:outline-none focus:border-orange-500"
          >
            <option value="ALL">All In-Warehouse Stages</option>
            <option value="PICK">To Pick (Bin Ready)</option>
            <option value="WAITING">Waiting / Not Found in Bin</option>
            <option value="PACK">To Pack</option>
            <option value="DISPATCH">Ready Dispatch / Booked</option>
            <option value="CANCELLED">Cancelled</option>
          </select>
        )}

        {hasActiveFilters && (
          <button
            type="button"
            onClick={onResetFilters}
            className="px-3 py-2.5 rounded-xl bg-slate-100 dark:bg-navy-800 hover:bg-slate-200 dark:hover:bg-navy-700 text-xs font-semibold text-slate-700 dark:text-slate-200 flex items-center gap-1 cursor-pointer transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset</span>
          </button>
        )}
      </div>

      {/* Right Stage-Specific Bulk Actions */}
      <div className="flex flex-wrap items-center gap-2">
        {activeTab === 'pick' && (
          <>
            <button
              type="button"
              onClick={onPrintPickSheet}
              className="px-3.5 py-2.5 rounded-xl bg-slate-100 dark:bg-navy-800 hover:bg-slate-200 dark:hover:bg-navy-700 border border-slate-300 dark:border-white/15 text-xs font-bold text-navy-800 dark:text-slate-100 flex items-center gap-1.5 cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5 text-orange-600 dark:text-orange-400" />
              <span>Print Pick Sheet (with Bins)</span>
            </button>

            {pickSubFilter === 'READY' ? (
              <>
                <button
                  type="button"
                  disabled={selectedOrders.length === 0}
                  onClick={onMarkWaiting}
                  className={`px-3.5 py-2.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all border ${
                    selectedOrders.length > 0
                      ? 'bg-amber-50 dark:bg-amber-950/60 hover:bg-amber-100 dark:hover:bg-amber-900/70 text-amber-700 dark:text-amber-300 border-amber-500/40 cursor-pointer'
                      : 'bg-white dark:bg-navy-900 text-slate-400 dark:text-slate-500 border-slate-200 dark:border-white/10 cursor-not-allowed'
                  }`}
                >
                  <AlertTriangle className="w-3.5 h-3.5" />
                  <span>Not Found / Hold ({selectedOrders.length})</span>
                </button>

                <button
                  type="button"
                  disabled={selectedOrders.length === 0}
                  onClick={onMarkPicked}
                  className={`px-4 py-2.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all ${
                    selectedOrders.length > 0
                      ? 'bg-orange-600 hover:bg-orange-700 text-white shadow-md cursor-pointer'
                      : 'bg-slate-100 dark:bg-navy-800 text-slate-500 dark:text-slate-400 cursor-not-allowed'
                  }`}
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Mark Selected Picked ({selectedOrders.length})</span>
                </button>
              </>
            ) : (
              <button
                type="button"
                disabled={selectedOrders.length === 0}
                onClick={onResumePick}
                className={`px-4 py-2.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all ${
                  selectedOrders.length > 0
                    ? 'bg-orange-600 hover:bg-orange-700 text-white shadow-md cursor-pointer'
                    : 'bg-slate-100 dark:bg-navy-800 text-slate-500 dark:text-slate-400 cursor-not-allowed'
                }`}
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Found → Resume Pick ({selectedOrders.length})</span>
              </button>
            )}
          </>
        )}

        {activeTab === 'pack' && (
          <button
            type="button"
            disabled={selectedOrders.length === 0}
            onClick={onPrintAndPack}
            className={`px-4 py-2.5 rounded-xl text-xs font-extrabold flex items-center gap-2 transition-all ${
              selectedOrders.length > 0
                ? 'bg-orange-600 hover:bg-orange-700 text-white shadow-lg cursor-pointer'
                : 'bg-slate-100 dark:bg-navy-800 text-slate-500 dark:text-slate-400 cursor-not-allowed'
            }`}
          >
            <Printer className="w-4 h-4" />
            <span>
              Print Selected 4x6&quot; Invoices &amp; Mark Packed ({selectedOrders.length})
            </span>
          </button>
        )}

        {activeTab === 'dispatch' && (
          <>
            <button
              type="button"
              onClick={onPrintManifest}
              className="px-3.5 py-2.5 rounded-xl bg-slate-100 dark:bg-navy-800 hover:bg-slate-200 dark:hover:bg-navy-700 border border-slate-300 dark:border-white/15 text-xs font-bold text-navy-800 dark:text-slate-100 flex items-center gap-1.5 cursor-pointer"
            >
              <FileText className="w-3.5 h-3.5 text-orange-600 dark:text-orange-400" />
              <span>Print Handover Sheet</span>
            </button>

            <button
              type="button"
              disabled={selectedOrders.length === 0}
              onClick={onBookCourier}
              className={`px-3.5 py-2.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all ${
                selectedOrders.length > 0
                  ? 'bg-amber-600 hover:bg-amber-500 text-white shadow-md cursor-pointer'
                  : 'bg-slate-100 dark:bg-navy-800 text-slate-500 dark:text-slate-400 cursor-not-allowed'
              }`}
            >
              <Truck className="w-4 h-4" />
              <span>Book Selected in Courier ({selectedOrders.length})</span>
            </button>

            <button
              type="button"
              disabled={selectedOrders.length === 0}
              onClick={onConfirmHandover}
              className={`px-4 py-2.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all ${
                selectedOrders.length > 0
                  ? 'bg-orange-600 hover:bg-orange-700 text-white shadow-md cursor-pointer'
                  : 'bg-slate-100 dark:bg-navy-800 text-slate-500 dark:text-slate-400 cursor-not-allowed'
              }`}
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>Confirm Courier Handover ({selectedOrders.length})</span>
            </button>
          </>
        )}
      </div>
    </div>
  );
}
