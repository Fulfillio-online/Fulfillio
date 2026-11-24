'use client';

import React from 'react';
import { Calendar, Layers, Package, RotateCcw } from 'lucide-react';
import { SearchInput } from '@/components/ui';
import { AllOrdersStatusFilter, DateRangePreset } from '../../types';

interface AllOrdersFiltersBarProps {
  viewMode: 'orders' | 'products';
  onViewModeChange: (mode: 'orders' | 'products') => void;
  ordersCount: number;
  uniqueProductsCount: number;
  totalUnitsCount: number;
  datePreset: DateRangePreset;
  onDatePresetChange: (preset: DateRangePreset) => void;
  fromDate: string;
  toDate: string;
  onFromDateChange: (val: string) => void;
  onToDateChange: (val: string) => void;
  searchQuery: string;
  onSearchChange: (q: string) => void;
  statusFilter: AllOrdersStatusFilter;
  onStatusFilterChange: (status: AllOrdersStatusFilter) => void;
  merchantFilter: string;
  onMerchantFilterChange: (code: string) => void;
  merchants: Array<{ code: string; name: string }>;
  courierFilter: string;
  onCourierFilterChange: (courier: string) => void;
  onResetFilters: () => void;
}

const DATE_PRESETS: Array<{ id: DateRangePreset; label: string }> = [
  { id: 'ALL_TIME', label: 'All Time' },
  { id: 'TODAY', label: 'Today' },
  { id: 'YESTERDAY', label: 'Yesterday' },
  { id: 'LAST_7_DAYS', label: 'Last 7 Days' },
  { id: 'LAST_30_DAYS', label: 'Last 30 Days' },
  { id: 'THIS_MONTH', label: 'This Month' },
];

export function AllOrdersFiltersBar({
  viewMode,
  onViewModeChange,
  ordersCount,
  uniqueProductsCount,
  totalUnitsCount,
  datePreset,
  onDatePresetChange,
  fromDate,
  toDate,
  onFromDateChange,
  onToDateChange,
  searchQuery,
  onSearchChange,
  statusFilter,
  onStatusFilterChange,
  merchantFilter,
  onMerchantFilterChange,
  merchants,
  courierFilter,
  onCourierFilterChange,
  onResetFilters,
}: AllOrdersFiltersBarProps) {
  const hasActiveFilters = Boolean(
    searchQuery ||
      statusFilter !== 'ALL' ||
      merchantFilter !== 'ALL' ||
      courierFilter !== 'ALL' ||
      datePreset !== 'ALL_TIME' ||
      fromDate ||
      toDate
  );

  return (
    <div className="rounded-2xl border border-slate-200 dark:border-white/10 bg-white/95 dark:bg-navy-900/95 p-3 sm:p-4 shadow-sm space-y-3">
      {/* Row 1: Segmented View Switcher & Quick Date Presets */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
        {/* View Switcher */}
        <div className="inline-flex items-center p-1 rounded-xl bg-slate-100 dark:bg-navy-950 border border-slate-200 dark:border-white/10 self-start">
          <button
            type="button"
            onClick={() => onViewModeChange('orders')}
            className={`px-3.5 py-2 rounded-lg text-xs font-bold flex items-center gap-2 transition-all cursor-pointer ${
              viewMode === 'orders'
                ? 'bg-orange-600 text-white shadow-sm'
                : 'text-slate-600 dark:text-slate-300 hover:text-navy-900 dark:hover:text-white'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>Orders List ({ordersCount})</span>
          </button>

          <button
            type="button"
            onClick={() => onViewModeChange('products')}
            className={`px-3.5 py-2 rounded-lg text-xs font-bold flex items-center gap-2 transition-all cursor-pointer ${
              viewMode === 'products'
                ? 'bg-orange-600 text-white shadow-sm'
                : 'text-slate-600 dark:text-slate-300 hover:text-navy-900 dark:hover:text-white'
            }`}
          >
            <Package className="w-3.5 h-3.5" />
            <span>
              Products Summary ({uniqueProductsCount} SKUs · {totalUnitsCount} units)
            </span>
          </button>
        </div>

        {/* Date Range Presets */}
        <div className="flex flex-wrap items-center gap-1.5">
          {DATE_PRESETS.map((preset) => {
            const isActive = datePreset === preset.id;
            return (
              <button
                key={preset.id}
                type="button"
                onClick={() => onDatePresetChange(preset.id)}
                className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold border transition-all cursor-pointer ${
                  isActive
                    ? 'bg-orange-500/15 text-orange-700 dark:text-orange-300 border-orange-500/40 shadow-2xs'
                    : 'bg-slate-50 dark:bg-navy-950 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-white/10 hover:border-orange-500/30 hover:text-navy-900 dark:hover:text-white'
                }`}
              >
                {preset.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Row 2: Search Input + Custom Date From/To */}
      <div className="flex flex-col lg:flex-row items-stretch lg:items-center gap-2.5 pt-2.5 border-t border-slate-100 dark:border-white/5">
        <div className="flex-1 min-w-0">
          <SearchInput
            value={searchQuery}
            onChange={onSearchChange}
            onClear={() => onSearchChange('')}
            placeholder="Search Order ID, SKU, Product Title, Customer Name, Phone, Memo or Tracking..."
            className="w-full text-xs"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2 shrink-0">
          <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-slate-50 dark:bg-navy-950 border border-slate-200 dark:border-white/10 text-xs">
            <Calendar className="w-3.5 h-3.5 text-orange-600 dark:text-orange-400 shrink-0" />
            <span className="text-slate-500 dark:text-slate-400 font-semibold">From</span>
            <input
              type="date"
              value={fromDate}
              onChange={(e) => onFromDateChange(e.target.value)}
              aria-label="Filter from date"
              className="bg-transparent text-navy-900 dark:text-slate-100 font-semibold focus:outline-none cursor-pointer"
            />
          </div>

          <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-slate-50 dark:bg-navy-950 border border-slate-200 dark:border-white/10 text-xs">
            <Calendar className="w-3.5 h-3.5 text-orange-600 dark:text-orange-400 shrink-0" />
            <span className="text-slate-500 dark:text-slate-400 font-semibold">To</span>
            <input
              type="date"
              value={toDate}
              onChange={(e) => onToDateChange(e.target.value)}
              aria-label="Filter to date"
              className="bg-transparent text-navy-900 dark:text-slate-100 font-semibold focus:outline-none cursor-pointer"
            />
          </div>
        </div>
      </div>

      {/* Row 3: Status -> Merchant -> Courier -> Reset */}
      <div className="flex flex-wrap items-center gap-2 pt-2.5 border-t border-slate-100 dark:border-white/5">
        <select
          value={statusFilter}
          onChange={(e) => onStatusFilterChange(e.target.value as AllOrdersStatusFilter)}
          aria-label="Filter by Status"
          className="px-3 py-2 rounded-xl bg-slate-50 dark:bg-navy-950 border border-slate-200 dark:border-white/10 text-xs font-semibold text-navy-800 dark:text-slate-100 focus:outline-none focus:border-orange-500 cursor-pointer shadow-2xs"
        >
          <option value="ALL">All Statuses</option>
          <option value="PICK">To Pick</option>
          <option value="WAITING">On Hold / Waiting</option>
          <option value="PACK">To Pack</option>
          <option value="DISPATCH">Ready Dispatch</option>
          <option value="COURIER_BOOKED">Courier Booked</option>
          <option value="HANDED_OVER">Handed Over / Delivered</option>
          <option value="RETURNED">Returned</option>
          <option value="CANCELLED">Cancelled</option>
        </select>

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
          aria-label="Filter by Courier"
          className="px-3 py-2 rounded-xl bg-slate-50 dark:bg-navy-950 border border-slate-200 dark:border-white/10 text-xs font-semibold text-navy-800 dark:text-slate-100 focus:outline-none focus:border-orange-500 cursor-pointer shadow-2xs"
        >
          <option value="ALL">All Couriers</option>
          <option value="Steadfast">Steadfast</option>
          <option value="Pathao">Pathao</option>
          <option value="RedX">RedX</option>
          <option value="UNASSIGNED">Unassigned</option>
        </select>

        {hasActiveFilters && (
          <button
            type="button"
            onClick={onResetFilters}
            title="Reset all filters"
            className="px-3 py-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer bg-slate-100 dark:bg-navy-800 hover:bg-slate-200 dark:hover:bg-navy-700 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-white/10 shadow-2xs active:scale-95"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset</span>
          </button>
        )}
      </div>
    </div>
  );
}
