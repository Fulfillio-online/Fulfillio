'use client';

import React, { useState } from 'react';
import { Search, ChevronDown, ArrowUpDown, LayoutGrid, List, CheckSquare } from 'lucide-react';
import { ProductToolbarProps, ProductSortOption } from '../types';

export function ProductToolbar({
  searchQuery,
  onSearchChange,
  selectedCategory,
  onCategoryChange,
  categories,
  sortOption,
  onSortChange,
  viewMode,
  onViewModeChange,
  selectedCount = 0,
  activeTab = 'ALL',
  onBulkPublish,
  onBulkDraft,
  onBulkDelete,
  onClearSelection,
}: ProductToolbarProps) {
  const [bulkAction, setBulkAction] = useState<string>('');

  const handleApplyBulkAction = () => {
    if (!bulkAction || selectedCount === 0) return;
    if (bulkAction === 'PUBLISH') {
      onBulkPublish?.();
    } else if (bulkAction === 'DRAFT') {
      onBulkDraft?.();
    } else if (bulkAction === 'DELETE') {
      onBulkDelete?.();
    }
    setBulkAction('');
  };

  return (
    <div className="space-y-3">
      {/* Row 1: Search Bar & Primary Filters */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        {/* Search Bar */}
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search products, SKU, barcode, bin..."
            className="w-full pl-9 pr-4 py-2 bg-white dark:bg-navy-900 border border-slate-200 dark:border-white/10 rounded-xl text-xs text-navy-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:border-orange-500 transition-colors shadow-2xs"
          />
        </div>

        {/* Filters & View Toggles */}
        <div className="flex items-center gap-2 w-full sm:w-auto">
          {/* Sort Dropdown */}
          <div className="relative flex-1 sm:flex-initial">
            <select
              value={sortOption}
              onChange={(e) => onSortChange(e.target.value as ProductSortOption)}
              aria-label="Sort products"
              className="w-full appearance-none pl-3 pr-8 py-2 bg-white dark:bg-navy-900 border border-slate-200 dark:border-white/10 rounded-xl text-xs font-semibold text-navy-900 dark:text-slate-200 focus:outline-none focus:border-orange-500 cursor-pointer shadow-2xs"
            >
              <option value="NEWEST">Newest</option>
              <option value="PRICE_ASC">Declare Price: Low to High</option>
              <option value="PRICE_DESC">Declare Price: High to Low</option>
              <option value="STOCK_DESC">Stock: High to Low</option>
            </select>
            <ArrowUpDown className="absolute right-2.5 top-2.5 h-3.5 w-3.5 text-slate-400 pointer-events-none" />
          </div>

          {/* Grid vs List View Mode Toggle */}
          <div className="flex items-center border border-slate-200 dark:border-white/10 rounded-xl bg-slate-100 dark:bg-navy-900 p-0.5 shrink-0 shadow-2xs">
            <button
              type="button"
              onClick={() => onViewModeChange('LIST')}
              className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                viewMode === 'LIST'
                  ? 'bg-white dark:bg-navy-800 text-orange-600 dark:text-orange-400 shadow-xs font-bold'
                  : 'text-slate-500 dark:text-slate-400 hover:text-navy-900 dark:hover:text-white'
              }`}
              title="List View"
              aria-label="List View"
            >
              <List className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={() => onViewModeChange('GRID')}
              className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                viewMode === 'GRID'
                  ? 'bg-white dark:bg-navy-800 text-orange-600 dark:text-orange-400 shadow-xs font-bold'
                  : 'text-slate-500 dark:text-slate-400 hover:text-navy-900 dark:hover:text-white'
              }`}
              title="Grid View"
              aria-label="Grid View"
            >
              <LayoutGrid className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Row 2: ADMIN-STYLE BULK ACTIONS BAR */}
      <div className="flex flex-wrap items-center justify-between gap-2 pt-2.5 border-t border-slate-100 dark:border-white/5 text-xs">
        <div className="flex items-center gap-2 flex-wrap">
          {/* Bulk Actions Dropdown */}
          <select
            value={bulkAction}
            onChange={(e) => setBulkAction(e.target.value)}
            aria-label="Bulk Actions"
            className="px-3 py-1.5 rounded-xl bg-slate-50 dark:bg-navy-950 border border-slate-200 dark:border-white/10 text-xs font-semibold text-navy-800 dark:text-slate-100 focus:outline-none focus:border-orange-500 cursor-pointer shadow-2xs"
          >
            <option value="">Bulk Actions</option>
            {activeTab === 'DRAFT' ? (
              <>
                <option value="PUBLISH">Restore / Publish to Store</option>
                <option value="DELETE">Permanently Delete</option>
              </>
            ) : (
              <>
                <option value="PUBLISH">Set as Published</option>
                <option value="DRAFT">Move to Draft</option>
                <option value="DELETE">Permanently Delete</option>
              </>
            )}
          </select>

          {/* Apply Button */}
          <button
            type="button"
            onClick={handleApplyBulkAction}
            disabled={!bulkAction || selectedCount === 0}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all border ${
              bulkAction && selectedCount > 0
                ? 'bg-orange-600 hover:bg-orange-500 text-white border-orange-600 shadow-xs cursor-pointer active:scale-95'
                : 'bg-slate-100 dark:bg-navy-800 text-slate-400 dark:text-slate-500 border-slate-200 dark:border-white/10 cursor-not-allowed opacity-60'
            }`}
          >
            Apply
          </button>

          {/* Selection Counter Feedback */}
          {selectedCount > 0 && (
            <div className="flex items-center gap-2 ml-2">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-orange-500/10 text-orange-600 dark:text-orange-400 font-bold border border-orange-500/20 text-xs">
                <CheckSquare className="h-3.5 w-3.5" />
                <span>{selectedCount} selected</span>
              </span>
              <button
                type="button"
                onClick={onClearSelection}
                className="text-xs text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white underline cursor-pointer"
              >
                Clear
              </button>
            </div>
          )}
        </div>

        {selectedCount === 0 && (
          <span className="text-slate-400 text-[11px] hidden sm:inline">
            Select items using checkboxes to change status in bulk
          </span>
        )}
      </div>
    </div>
  );
}
