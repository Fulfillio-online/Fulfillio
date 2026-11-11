'use client';

import React from 'react';
import { Search, ChevronDown, ArrowUpDown, LayoutGrid, List } from 'lucide-react';
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
}: ProductToolbarProps) {
  return (
    <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
      {/* Search Bar */}
      <div className="relative flex-1 max-w-md">
        <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-500 pointer-events-none" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="Search products, SKU..."
          className="w-full pl-9 pr-4 py-2 bg-white dark:bg-navy-900 border border-slate-200 dark:border-white/10 rounded-xl text-xs text-navy-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:border-orange-500 transition-colors"
        />
      </div>

      {/* Filters & View Toggles */}
      <div className="flex items-center gap-2 w-full sm:w-auto">
        {/* Category Dropdown */}
        <div className="relative flex-1 sm:flex-initial">
          <select
            value={selectedCategory}
            onChange={(e) => onCategoryChange(e.target.value)}
            className="w-full appearance-none pl-3 pr-8 py-2 bg-white dark:bg-navy-900 border border-slate-200 dark:border-white/10 rounded-xl text-xs font-medium text-navy-900 dark:text-slate-200 focus:outline-none focus:border-orange-500 cursor-pointer"
          >
            <option value="ALL">All Category</option>
            {categories.map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>
          <ChevronDown className="absolute right-2.5 top-2.5 h-3.5 w-3.5 text-slate-500 pointer-events-none" />
        </div>

        {/* Sort Dropdown */}
        <div className="relative flex-1 sm:flex-initial">
          <select
            value={sortOption}
            onChange={(e) => onSortChange(e.target.value as ProductSortOption)}
            className="w-full appearance-none pl-3 pr-8 py-2 bg-white dark:bg-navy-900 border border-slate-200 dark:border-white/10 rounded-xl text-xs font-medium text-navy-900 dark:text-slate-200 focus:outline-none focus:border-orange-500 cursor-pointer"
          >
            <option value="NEWEST">Newest</option>
            <option value="PRICE_ASC">Price: Low to High</option>
            <option value="PRICE_DESC">Price: High to Low</option>
            <option value="MARGIN_DESC">Highest Margin %</option>
            <option value="STOCK_DESC">Stock: High to Low</option>
          </select>
          <ArrowUpDown className="absolute right-2.5 top-2.5 h-3.5 w-3.5 text-slate-500 pointer-events-none" />
        </div>

        {/* Grid vs List View Mode Toggle */}
        <div className="flex items-center border border-slate-200 dark:border-white/10 rounded-xl bg-slate-100 dark:bg-navy-900 p-0.5 shrink-0">
          <button
            type="button"
            onClick={() => onViewModeChange('LIST')}
            className={`p-1.5 rounded-md transition-colors ${
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
            className={`p-1.5 rounded-md transition-colors ${
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
  );
}
