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
          className="w-full pl-9 pr-4 py-2 bg-slate-900/90 border border-slate-800 rounded-lg text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-emerald-500 transition-colors"
        />
      </div>

      {/* Filters & View Toggles */}
      <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap justify-between sm:justify-end">
        {/* Category Dropdown */}
        <div className="relative">
          <select
            value={selectedCategory}
            onChange={(e) => onCategoryChange(e.target.value)}
            className="appearance-none pl-3 pr-8 py-2 bg-slate-900 border border-slate-800 rounded-lg text-xs font-medium text-slate-300 focus:outline-none focus:border-emerald-500 cursor-pointer"
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
        <div className="relative">
          <select
            value={sortOption}
            onChange={(e) => onSortChange(e.target.value as ProductSortOption)}
            className="appearance-none pl-3 pr-8 py-2 bg-slate-900 border border-slate-800 rounded-lg text-xs font-medium text-slate-300 focus:outline-none focus:border-emerald-500 cursor-pointer"
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
        <div className="flex items-center border border-slate-800 rounded-lg bg-slate-900 p-0.5">
          <button
            type="button"
            onClick={() => onViewModeChange('LIST')}
            className={`p-1.5 rounded-md transition-colors ${
              viewMode === 'LIST'
                ? 'bg-slate-800 text-emerald-400 font-bold'
                : 'text-slate-400 hover:text-slate-200'
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
                ? 'bg-slate-800 text-emerald-400 font-bold'
                : 'text-slate-400 hover:text-slate-200'
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
