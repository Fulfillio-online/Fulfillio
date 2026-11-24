'use client';

import React, { useState, useEffect, useMemo } from 'react';
import {
  Printer,
  FileText,
  RotateCcw,
} from 'lucide-react';
import { SearchInput } from '@/components/ui';
import { PipelineMainTab, WarehousePipelineOrder } from '../types';

interface PipelineFiltersBarProps {
  activeTab: PipelineMainTab;
  pickSubFilter: 'READY' | 'WAITING';
  searchQuery: string;
  onSearchChange: (query: string) => void;
  merchantFilter: string;
  onMerchantFilterChange: (code: string) => void;
  merchants: Array<{ code: string; name: string }>;
  courierFilter: string;
  onCourierFilterChange: (courier: string) => void;
  onResetFilters: () => void;
  selectedOrders: WarehousePipelineOrder[];
  onPrintPickSheet: () => void;
  onMarkWaiting: () => void;
  onMarkPicked: () => void;
  onResumePick: () => void;
  onPrintAndPack: () => void;
  onPrintManifest: () => void;
  onBookCourier: () => void;
  onConfirmHandover: () => void;
  onPrintMemos: () => void;
  onCancelSelected: () => void;
}

export function PipelineFiltersBar({
  activeTab,
  pickSubFilter,
  searchQuery,
  onSearchChange,
  merchantFilter,
  onMerchantFilterChange,
  merchants,
  courierFilter,
  onCourierFilterChange,
  onResetFilters,
  selectedOrders,
  onPrintPickSheet,
  onMarkWaiting,
  onMarkPicked,
  onResumePick,
  onPrintAndPack,
  onPrintManifest,
  onBookCourier,
  onConfirmHandover,
  onPrintMemos,
  onCancelSelected,
}: PipelineFiltersBarProps) {
  const [bulkAction, setBulkAction] = useState<string>('');

  useEffect(() => {
    setBulkAction('');
  }, [activeTab, pickSubFilter]);

  const hasActiveFilters = Boolean(
    searchQuery || merchantFilter !== 'ALL' || courierFilter !== 'ALL'
  );

  const stageBulkOptions = useMemo(() => {
    if (activeTab === 'pick') {
      if (pickSubFilter === 'WAITING') {
        return [
          { value: 'RESUME_PICK', label: 'Resume to Pick List' },
          { value: 'CANCEL', label: 'Cancel Orders' },
        ];
      }
      return [
        { value: 'MARK_PICKED', label: 'Mark Picked → Move to Pack' },
        { value: 'MARK_WAITING', label: 'Put on Hold / Not in Bin' },
        { value: 'PRINT_PICK_SHEET', label: 'Print Pick Sheet' },
        { value: 'CANCEL', label: 'Cancel Orders' },
      ];
    }

    if (activeTab === 'pack') {
      return [
        { value: 'PRINT_AND_PACK', label: 'Print 4x6" & Move to Dispatch' },
        { value: 'PRINT_MEMOS', label: 'Print 4x6" Memos Only' },
        { value: 'MARK_WAITING', label: 'Put on Hold' },
        { value: 'CANCEL', label: 'Cancel Orders' },
      ];
    }

    return [
      { value: 'BOOK_COURIER', label: 'Book Courier API' },
      { value: 'PRINT_MANIFEST', label: 'Print Handover Sheet' },
      { value: 'CONFIRM_HANDOVER', label: 'Confirm Handover to Driver' },
      { value: 'CANCEL', label: 'Cancel Orders' },
    ];
  }, [activeTab, pickSubFilter]);

  const handleApplyBulkAction = () => {
    if (!bulkAction || selectedOrders.length === 0) return;

    switch (bulkAction) {
      case 'MARK_PICKED':
        onMarkPicked();
        break;
      case 'MARK_WAITING':
        onMarkWaiting();
        break;
      case 'RESUME_PICK':
        onResumePick();
        break;
      case 'PRINT_PICK_SHEET':
        onPrintPickSheet();
        break;
      case 'PRINT_AND_PACK':
        onPrintAndPack();
        break;
      case 'PRINT_MEMOS':
        onPrintMemos();
        break;
      case 'PRINT_MANIFEST':
        onPrintManifest();
        break;
      case 'BOOK_COURIER':
        onBookCourier();
        break;
      case 'CONFIRM_HANDOVER':
        onConfirmHandover();
        break;
      case 'CANCEL':
        onCancelSelected();
        break;
    }
    setBulkAction('');
  };

  return (
    <div className="rounded-2xl border border-slate-200 dark:border-white/10 bg-white/90 dark:bg-navy-900/90 p-3 sm:p-4 shadow-sm space-y-3">
      {/* Row 1: Dedicated Search Bar & Stage-Specific Print Utility */}
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

        {((activeTab === 'pick' && pickSubFilter === 'READY') || activeTab === 'dispatch') && (
          <div className="flex items-center gap-2 shrink-0">
            {activeTab === 'pick' && pickSubFilter === 'READY' && (
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

      {/* Row 2: Stage-Scoped Bulk Actions -> Apply -> Merchant Filter -> Courier Filter -> Reset */}
      <div className="flex flex-wrap items-center gap-2 pt-2.5 border-t border-slate-100 dark:border-white/5">
        <select
          value={bulkAction}
          onChange={(e) => setBulkAction(e.target.value)}
          aria-label="Bulk Actions"
          className="px-3 py-2 rounded-xl bg-slate-50 dark:bg-navy-950 border border-slate-200 dark:border-white/10 text-xs font-semibold text-navy-800 dark:text-slate-100 focus:outline-none focus:border-orange-500 cursor-pointer shadow-2xs"
        >
          <option value="">Bulk Actions</option>
          {stageBulkOptions.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>

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

        <select
          value={merchantFilter}
          onChange={(e) => onMerchantFilterChange(e.target.value)}
          aria-label="Filter by Merchant"
          className="px-3 py-2 rounded-xl bg-slate-50 dark:bg-navy-950 border border-slate-200 dark:border-white/10 text-xs font-semibold text-navy-800 dark:text-slate-100 focus:outline-none focus:border-orange-500 cursor-pointer shadow-2xs"
        >
          <option value="ALL">All Merchants</option>
          {merchants.map((m) => (
            <option key={m.code} value={m.code}>
              {m.code} — {m.name}
            </option>
          ))}
          {merchantFilter !== 'ALL' && !merchants.some((m) => m.code === merchantFilter) && (
            <option value={merchantFilter}>{merchantFilter}</option>
          )}
        </select>

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
