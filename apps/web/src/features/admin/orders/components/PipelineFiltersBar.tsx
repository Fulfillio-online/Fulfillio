'use client';

import React, { useState } from 'react';
import {
  Printer,
  FileText,
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
  onBulkChangeStage?: (newStage: OrderStage | 'COURIER_BOOKED', reason?: string) => void;
  onPrintMemos?: () => void;
  onCancelSelected?: () => void;
  onClearSelection?: () => void;
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
  selectedOrders,
  onPrintPickSheet,
  onPrintManifest,
  onBookCourier,
  onConfirmHandover,
  onBulkChangeStage,
  onPrintMemos,
  onCancelSelected,
  onClearSelection,
}: PipelineFiltersBarProps) {
  const [bulkAction, setBulkAction] = useState<string>('');

  const hasActiveFilters =
    searchQuery || merchantFilter !== 'ALL' || courierFilter !== 'ALL' || stageFilter !== 'ALL';

  const handleApplyBulkAction = () => {
    if (!bulkAction || selectedOrders.length === 0) return;

    switch (bulkAction) {
      case 'PACK':
        onBulkChangeStage?.('PACK');
        break;
      case 'DISPATCH':
        onBulkChangeStage?.('DISPATCH');
        break;
      case 'WAITING':
        onBulkChangeStage?.('WAITING', 'Awaiting merchant stock delivery');
        break;
      case 'PICK':
        onBulkChangeStage?.('PICK');
        break;
      case 'PRINT_MEMOS':
        onPrintMemos?.();
        break;
      case 'BOOK_COURIER':
        onBookCourier();
        break;
      case 'CONFIRM_HANDOVER':
        onConfirmHandover();
        break;
      case 'CANCEL':
        onCancelSelected?.();
        break;
    }
    setBulkAction('');
  };

  return (
    <div className="rounded-2xl border border-slate-200 dark:border-white/10 bg-white/90 dark:bg-navy-900/90 p-3 sm:p-4 shadow-sm space-y-3">
      {/* Row 1: Dedicated Search Bar (spacious, standalone row) & Quick Tab Actions */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5">
        <div className="flex-1 w-full min-w-0">
          <SearchInput
            value={searchQuery}
            onChange={onSearchChange}
            onClear={() => onSearchChange('')}
            placeholder="Search Order ID, Bin Location, SKU, Product Title, Customer Name or Phone..."
            className="w-full text-xs"
          />
        </div>

        {/* Quick Tab Utilities (Compact print sheets for Pick & Dispatch) */}
        {(activeTab === 'pick' || activeTab === 'dispatch') && (
          <div className="flex items-center gap-2 shrink-0">
            {activeTab === 'pick' && (
              <button
                type="button"
                onClick={onPrintPickSheet}
                className="px-3 py-2 rounded-xl bg-slate-100 dark:bg-navy-800 hover:bg-slate-200 dark:hover:bg-navy-700 border border-slate-200 dark:border-white/10 text-xs font-semibold text-slate-700 dark:text-slate-200 flex items-center gap-1.5 cursor-pointer shadow-2xs transition-colors shrink-0"
              >
                <Printer className="w-3.5 h-3.5 text-orange-600 dark:text-orange-400" />
                <span>Print Pick Sheet</span>
              </button>
            )}

            {activeTab === 'dispatch' && (
              <button
                type="button"
                onClick={onPrintManifest}
                className="px-3 py-2 rounded-xl bg-slate-100 dark:bg-navy-800 hover:bg-slate-200 dark:hover:bg-navy-700 border border-slate-200 dark:border-white/10 text-xs font-semibold text-slate-700 dark:text-slate-200 flex items-center gap-1.5 cursor-pointer shadow-2xs transition-colors shrink-0"
              >
                <FileText className="w-3.5 h-3.5 text-orange-600 dark:text-orange-400" />
                <span>Print Handover Sheet</span>
              </button>
            )}
          </div>
        )}
      </div>

      {/* Row 2: Bulk Actions -> Apply -> All Orders -> All Merchants -> All Couriers -> All Stages -> Reset */}
      <div className="flex flex-wrap items-center gap-2 pt-2.5 border-t border-slate-100 dark:border-white/5">
        {/* 1. Bulk Actions Dropdown */}
        <select
          value={bulkAction}
          onChange={(e) => setBulkAction(e.target.value)}
          aria-label="Bulk Actions"
          className="px-3 py-2 rounded-xl bg-slate-50 dark:bg-navy-950 border border-slate-200 dark:border-white/10 text-xs font-semibold text-navy-800 dark:text-slate-100 focus:outline-none focus:border-orange-500 cursor-pointer shadow-2xs"
        >
          <option value="">Bulk Actions</option>
          <option value="PACK">Move to Pack</option>
          <option value="DISPATCH">Move to Dispatch</option>
          <option value="WAITING">Put on Hold</option>
          <option value="PICK">Move to Pick</option>
          <option value="PRINT_MEMOS">Print 4x6" Memos</option>
          <option value="BOOK_COURIER">Book Courier</option>
          <option value="CONFIRM_HANDOVER">Confirm Handover</option>
          <option value="CANCEL">Cancel Orders</option>
        </select>

        {/* 2. Apply Button */}
        <button
          type="button"
          onClick={handleApplyBulkAction}
          disabled={!bulkAction || selectedOrders.length === 0}
          className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all border ${
            bulkAction && selectedOrders.length > 0
              ? 'bg-orange-600 hover:bg-orange-500 text-white border-orange-600 shadow-sm cursor-pointer active:scale-95'
              : 'bg-slate-100 dark:bg-navy-800 text-slate-400 dark:text-slate-500 border-slate-200 dark:border-white/10 cursor-not-allowed opacity-60'
          }`}
        >
          Apply
        </button>

        {/* 3. All Orders (Pipeline Stage Tabs Dropdown) */}
        {onTabChange && (
          <select
            value={activeTab}
            onChange={(e) => onTabChange(e.target.value as PipelineMainTab)}
            aria-label="Filter by Pipeline Stage"
            className="px-3 py-2 rounded-xl bg-slate-50 dark:bg-navy-950 border border-slate-200 dark:border-white/10 text-xs font-bold text-orange-600 dark:text-orange-400 focus:outline-none focus:border-orange-500 cursor-pointer shadow-2xs"
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

        {/* 4. All Merchants Dropdown */}
        <select
          value={merchantFilter}
          onChange={(e) => onMerchantFilterChange(e.target.value)}
          aria-label="Filter by Merchant"
          className="px-3 py-2 rounded-xl bg-slate-50 dark:bg-navy-950 border border-slate-200 dark:border-white/10 text-xs font-semibold text-navy-800 dark:text-slate-100 focus:outline-none focus:border-orange-500 cursor-pointer shadow-2xs"
        >
          <option value="ALL">All Merchants</option>
          <option value="MC-101">MC-101 — Sabbir&apos;s Store</option>
          <option value="MC-102">MC-102 — Urban Threads BD</option>
          <option value="MC-103">MC-103 — Apex Footwear Hub</option>
        </select>

        {/* 5. All Couriers Dropdown */}
        <select
          value={courierFilter}
          onChange={(e) => onCourierFilterChange(e.target.value)}
          aria-label="Filter by Courier Partner"
          className="px-3 py-2 rounded-xl bg-slate-50 dark:bg-navy-950 border border-slate-200 dark:border-white/10 text-xs font-semibold text-navy-800 dark:text-slate-100 focus:outline-none focus:border-orange-500 cursor-pointer shadow-2xs"
        >
          <option value="ALL">All Couriers</option>
          <option value="Steadfast">Steadfast</option>
          <option value="Pathao">Pathao</option>
          <option value="RedX">RedX</option>
        </select>

        {/* 6. All Stages Dropdown */}
        <select
          value={stageFilter}
          onChange={(e) => {
            const val = e.target.value as 'ALL' | OrderStage;
            onStageFilterChange(val);
            if (activeTab !== 'all' && val !== 'ALL') {
              onTabChange?.('all');
            }
          }}
          aria-label="Filter by Stage"
          className="px-3 py-2 rounded-xl bg-slate-50 dark:bg-navy-950 border border-slate-200 dark:border-white/10 text-xs font-semibold text-navy-800 dark:text-slate-100 focus:outline-none focus:border-orange-500 cursor-pointer shadow-2xs"
        >
          <option value="ALL">All Stages</option>
          <option value="PICK">To Pick</option>
          <option value="WAITING">On Hold</option>
          <option value="PACK">To Pack</option>
          <option value="DISPATCH">Ready Dispatch</option>
          <option value="CANCELLED">Cancelled</option>
        </select>

        {/* 7. Reset Button (Hidden by default; appears when any filter is selected) */}
        {hasActiveFilters && (
          <button
            type="button"
            onClick={onResetFilters}
            title="Reset active filters"
            className="px-3 py-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer bg-slate-100 dark:bg-navy-800 hover:bg-slate-200 dark:hover:bg-navy-700 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-white/10 shadow-2xs active:scale-95 animate-in fade-in"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset</span>
          </button>
        )}
      </div>
    </div>
  );
}
