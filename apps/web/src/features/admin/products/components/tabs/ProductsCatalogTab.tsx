'use client';

import React, { useState, useMemo, useEffect } from 'react';
import {
  Package,
  Search,
  Plus,
  SlidersHorizontal,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Trash2,
  AlertTriangle,
  Check,
} from 'lucide-react';
import { SearchInput, StatusBadge } from '@/components/ui';
import { Modal } from '@/components/ui/Modal';
import { WarehouseBin, WarehouseProductItem } from '../../types';
import { MERCHANTS } from '../../mockData';

interface ProductsCatalogTabProps {
  products: WarehouseProductItem[];
  bins: WarehouseBin[];
  onAdjustStock: (productId: string, delta: number) => void;
  onOpenStockAdjustModal: (product: WarehouseProductItem) => void;
  onChangeProductBin: (productId: string, nextBinCode: string) => void;
  onOpenAddProduct: () => void;
  onDeleteProduct?: (productId: string) => void;
  onDeleteProducts?: (productIds: string[]) => void;
}

export function ProductsCatalogTab({
  products,
  bins,
  onAdjustStock,
  onOpenStockAdjustModal,
  onChangeProductBin,
  onOpenAddProduct,
  onDeleteProduct,
  onDeleteProducts,
}: ProductsCatalogTabProps) {
  // Search & Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [merchantFilter, setMerchantFilter] = useState<string>('ALL');
  const [categoryFilter, setCategoryFilter] = useState<string>('ALL');
  const [binFilter, setBinFilter] = useState<string>('ALL');

  // Pagination & Limits
  const [pageSize, setPageSize] = useState<number>(10);
  const [currentPage, setCurrentPage] = useState<number>(1);

  // Bulk Selection
  const [selectedProductIds, setSelectedProductIds] = useState<Set<string>>(new Set());

  // Actions Dropdown Menu
  const [activeMenuId, setActiveMenuId] = useState<string | null>(null);

  // Mobile Collapsible Accordion State
  const [expandedProductIds, setExpandedProductIds] = useState<Set<string>>(new Set());

  // Delete Modals
  const [productToDelete, setProductToDelete] = useState<WarehouseProductItem | null>(null);
  const [bulkDeleteModalOpen, setBulkDeleteModalOpen] = useState(false);

  // Close dropdown on outside click
  useEffect(() => {
    if (!activeMenuId) return;
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target.closest('[data-dropdown-container]')) {
        setActiveMenuId(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [activeMenuId]);

  const toggleExpand = (id: string) => {
    setExpandedProductIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const approvedProducts = useMemo(
    () => products.filter((p) => p.status === 'APPROVED'),
    [products]
  );

  const filteredProducts = useMemo(() => {
    return approvedProducts.filter((item) => {
      const q = searchQuery.trim().toLowerCase();
      const matchesSearch =
        !q ||
        item.title.toLowerCase().includes(q) ||
        item.fullSku.toLowerCase().includes(q) ||
        item.shortSku.toLowerCase().includes(q) ||
        item.merchantName.toLowerCase().includes(q);
      const matchesMerchant = merchantFilter === 'ALL' || item.merchantCode === merchantFilter;
      const matchesCategory = categoryFilter === 'ALL' || item.category === categoryFilter;
      const matchesBin = binFilter === 'ALL' || item.binCode === binFilter;
      return matchesSearch && matchesMerchant && matchesCategory && matchesBin;
    });
  }, [approvedProducts, searchQuery, merchantFilter, categoryFilter, binFilter]);

  // Pagination calculations
  const totalItems = filteredProducts.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  const safePage = Math.min(Math.max(1, currentPage), totalPages);
  const startIndex = (safePage - 1) * pageSize;
  const paginatedProducts = filteredProducts.slice(startIndex, startIndex + pageSize);

  // Bulk Selection Helpers
  const isAllPageSelected =
    paginatedProducts.length > 0 &&
    paginatedProducts.every((p) => selectedProductIds.has(p.id));

  const toggleSelect = (id: string) => {
    setSelectedProductIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleSelectAllPage = () => {
    setSelectedProductIds((prev) => {
      const next = new Set(prev);
      if (isAllPageSelected) {
        paginatedProducts.forEach((p) => next.delete(p.id));
      } else {
        paginatedProducts.forEach((p) => next.add(p.id));
      }
      return next;
    });
  };

  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setCurrentPage(newPage);
      setActiveMenuId(null);
    }
  };

  const handlePageSizeChange = (newSize: number) => {
    setPageSize(newSize);
    setCurrentPage(1);
    setActiveMenuId(null);
  };

  // Confirm Single Delete
  const handleConfirmSingleDelete = () => {
    if (!productToDelete) return;
    const id = productToDelete.id;
    onDeleteProduct?.(id);
    setSelectedProductIds((prev) => {
      const next = new Set(prev);
      next.delete(id);
      return next;
    });
    setProductToDelete(null);
  };

  // Confirm Bulk Delete
  const handleConfirmBulkDelete = () => {
    const ids = Array.from(selectedProductIds);
    if (ids.length === 0) return;
    onDeleteProducts?.(ids);
    setSelectedProductIds(new Set());
    setBulkDeleteModalOpen(false);
  };

  return (
    <div className="space-y-4">
      {/* Filter Bar */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 shadow-md">
        <div className="lg:col-span-2">
          <SearchInput
            value={searchQuery}
            onChange={(val) => {
              setSearchQuery(val);
              setCurrentPage(1);
            }}
            placeholder="Search product title or 2-Part SKU (e.g. MC-101-HOODIE)..."
          />
        </div>

        <div>
          <select
            value={merchantFilter}
            onChange={(e) => {
              setMerchantFilter(e.target.value);
              setCurrentPage(1);
            }}
            aria-label="Filter by Merchant"
            className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm text-slate-200 focus:outline-none focus:border-emerald-500"
          >
            <option value="ALL">All Merchants (MC-101 – MC-104)</option>
            {MERCHANTS.map((m) => (
              <option key={m.code} value={m.code}>
                {m.code} — {m.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <select
            value={categoryFilter}
            onChange={(e) => {
              setCategoryFilter(e.target.value);
              setCurrentPage(1);
            }}
            aria-label="Filter by Category"
            className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm text-slate-200 focus:outline-none focus:border-emerald-500"
          >
            <option value="ALL">All Categories</option>
            <option value="Apparel">Apparel</option>
            <option value="Footwear">Footwear</option>
            <option value="Electronics">Electronics</option>
            <option value="Accessories">Accessories</option>
          </select>
        </div>

        <div>
          <select
            value={binFilter}
            onChange={(e) => {
              setBinFilter(e.target.value);
              setCurrentPage(1);
            }}
            aria-label="Filter by Bin Location"
            className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm font-mono text-emerald-300 focus:outline-none focus:border-emerald-500"
          >
            <option value="ALL">All Warehouse Bins</option>
            {bins.map((b) => (
              <option key={b.code} value={b.code}>
                Bin {b.code} ({b.zone})
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Bulk Action Bar (Visible when 1+ products selected) */}
      {selectedProductIds.size > 0 && (
        <div className="bg-slate-900 border border-emerald-500/50 rounded-2xl p-3 sm:p-4 flex flex-col sm:flex-row items-center justify-between gap-3 shadow-xl animate-in fade-in-50 duration-200">
          <div className="flex items-center gap-3">
            <span className="w-8 h-8 rounded-xl bg-emerald-500/20 text-emerald-400 font-mono font-bold flex items-center justify-center text-xs">
              {selectedProductIds.size}
            </span>
            <div className="text-xs sm:text-sm">
              <span className="text-white font-bold">{selectedProductIds.size}</span>
              <span className="text-slate-400"> products selected across catalog</span>
            </div>
            <button
              type="button"
              onClick={() => setSelectedProductIds(new Set())}
              className="text-xs text-slate-400 hover:text-white underline underline-offset-2 ml-2 cursor-pointer"
            >
              Deselect All
            </button>
          </div>

          <div className="flex items-center gap-2">
            {/* Bulk Actions Dropdown */}
            <div className="relative inline-flex items-center text-left" data-dropdown-container>
              <button
                type="button"
                onClick={() =>
                  setActiveMenuId(activeMenuId === 'bulk-actions' ? null : 'bulk-actions')
                }
                className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-bold text-slate-200 border border-slate-700 flex items-center gap-1.5 transition-colors cursor-pointer shadow-sm"
              >
                <span>Bulk Actions</span>
                <ChevronDown
                  className={`w-3.5 h-3.5 transition-transform duration-200 ${
                    activeMenuId === 'bulk-actions' ? 'rotate-180 text-emerald-400' : 'text-slate-400'
                  }`}
                />
              </button>

              {activeMenuId === 'bulk-actions' && (
                <div className="absolute right-0 top-full mt-1.5 w-56 rounded-xl bg-slate-900 border border-slate-800 shadow-2xl py-1.5 z-[100] text-left font-sans text-xs">
                  <button
                    type="button"
                    onClick={() => {
                      setActiveMenuId(null);
                      setBulkDeleteModalOpen(true);
                    }}
                    className="w-full px-3.5 py-2 text-left text-rose-300 hover:bg-rose-950/40 flex items-center gap-2.5 transition-colors cursor-pointer"
                  >
                    <Trash2 className="w-4 h-4 text-rose-400 pointer-events-none" />
                    <span>Delete Selected ({selectedProductIds.size})</span>
                  </button>
                </div>
              )}
            </div>

            {/* Direct Delete Selected Button */}
            <button
              type="button"
              onClick={() => setBulkDeleteModalOpen(true)}
              className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 active:scale-95 text-white text-xs font-bold flex items-center gap-2 shadow-lg shadow-rose-600/20 transition-all cursor-pointer"
            >
              <Trash2 className="w-4 h-4 pointer-events-none" />
              <span>Delete Selected ({selectedProductIds.size})</span>
            </button>
          </div>
        </div>
      )}

      {/* Product Catalog Display: Mobile Accordions & Desktop Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl p-3 sm:p-0">
        {/* 1. Mobile Collapsible List (Visible on mobile screens) */}
        <div className="block md:hidden space-y-2.5">
          {paginatedProducts.length === 0 ? (
            <div className="py-12 text-center text-slate-400">
              <Package className="w-10 h-10 text-slate-600 mx-auto mb-2" />
              <p className="text-sm font-semibold text-slate-300">No active products match your criteria</p>
              <p className="text-xs text-slate-500 mt-1">Try clearing filters or search keywords</p>
            </div>
          ) : (
            paginatedProducts.map((p, idx) => {
              const isExpanded = expandedProductIds.has(p.id);
              const isSelected = selectedProductIds.has(p.id);
              const isLowStock = p.stock < 30;
              const isMenuOpen = activeMenuId === `mobile-${p.id}`;
              const isNearBottom = idx > 0 && idx >= paginatedProducts.length - 2;

              return (
                <div
                  key={p.id}
                  className={`rounded-xl border transition-all shadow-sm overflow-hidden ${
                    isSelected
                      ? 'border-emerald-500/50 bg-emerald-950/20'
                      : 'border-slate-800 bg-slate-950/60'
                  }`}
                >
                  {/* Collapsed Header Summary */}
                  <div className="p-3.5 flex items-start justify-between gap-3 select-none">
                    {/* Left: Checkbox + Thumbnail + 3 Distinct Rows */}
                    <div className="flex items-start gap-3 min-w-0 flex-1">
                      <div className="pt-1" onClick={(e) => e.stopPropagation()}>
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => toggleSelect(p.id)}
                          aria-label={`Select ${p.title}`}
                          className="w-4 h-4 rounded bg-slate-950 border-slate-700 text-emerald-500 focus:ring-emerald-500 cursor-pointer accent-emerald-500"
                        />
                      </div>

                      <img
                        src={p.imageUrl}
                        alt={p.title}
                        className="w-12 h-12 rounded-xl object-cover border border-slate-800 shrink-0 mt-0.5 cursor-pointer"
                        onClick={() => toggleExpand(p.id)}
                      />

                      <div
                        className="min-w-0 flex-1 space-y-1 cursor-pointer"
                        onClick={() => toggleExpand(p.id)}
                      >
                        {/* Row 1: Product Title */}
                        <div className="font-bold text-white text-[15px] leading-tight truncate">
                          {p.title}
                        </div>

                        {/* Row 2: SKU and Merchant */}
                        <div className="flex items-center gap-1.5 text-xs truncate">
                          <span className="font-mono font-bold text-emerald-400">
                            {p.fullSku}
                          </span>
                          <span className="text-slate-500">·</span>
                          <span className="text-slate-300 font-medium truncate">
                            {p.merchantName}
                          </span>
                        </div>

                        {/* Row 3: Price & Physical Stock Box */}
                        <div className="flex items-center gap-3 pt-0.5">
                          <span className="font-mono text-xs font-bold text-slate-200">
                            ৳{p.price.toLocaleString()}
                          </span>

                          <div
                            onClick={(e) => e.stopPropagation()}
                            className={`flex items-center rounded-lg p-0.5 border transition-colors ${
                              isLowStock
                                ? 'bg-rose-500/15 border-rose-500/35'
                                : 'bg-slate-950 border-slate-800'
                            }`}
                          >
                            <button
                              type="button"
                              onClick={() => onAdjustStock(p.id, -1)}
                              disabled={p.stock <= 0}
                              className={`w-5 h-5 rounded flex items-center justify-center text-xs font-bold transition-colors ${
                                isLowStock
                                  ? 'text-rose-400 hover:text-white hover:bg-rose-500/20 disabled:opacity-30'
                                  : 'text-slate-400 hover:text-white hover:bg-slate-800 disabled:opacity-30'
                              }`}
                            >
                              -
                            </button>
                            <span
                              className={`w-7 text-center font-mono text-xs font-bold ${
                                isLowStock ? 'text-rose-400' : 'text-white'
                              }`}
                            >
                              {p.stock}
                            </span>
                            <button
                              type="button"
                              onClick={() => onAdjustStock(p.id, 1)}
                              className={`w-5 h-5 rounded flex items-center justify-center text-xs font-bold transition-colors ${
                                isLowStock
                                  ? 'text-rose-400 hover:text-white hover:bg-rose-500/20'
                                  : 'text-slate-400 hover:text-white hover:bg-slate-800'
                              }`}
                            >
                              +
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Right: Status Tag + Toggle Button */}
                    <div className="flex flex-col items-end justify-between self-stretch shrink-0">
                      <div>
                        <StatusBadge status="Approved" />
                      </div>

                      <button
                        type="button"
                        onClick={() => toggleExpand(p.id)}
                        aria-label="Toggle details"
                        className="p-1 rounded-lg bg-slate-800 text-slate-400 hover:text-white transition-colors cursor-pointer"
                      >
                        <ChevronDown
                          className={`w-4 h-4 transition-transform duration-200 ${
                            isExpanded ? 'rotate-180 text-emerald-400' : ''
                          }`}
                        />
                      </button>
                    </div>
                  </div>

                  {/* Expanded Row Details */}
                  {isExpanded && (
                    <div className="px-3.5 pb-3.5 pt-2 border-t border-slate-800/80 bg-slate-900/60 text-xs space-y-2.5 animate-in fade-in-50 duration-150 font-sans">
                      <div className="grid grid-cols-2 gap-2 text-[11px] pt-1">
                        <div>
                          <span className="text-slate-400 block text-[10px] uppercase font-semibold">Category</span>
                          <span className="px-2 py-0.5 rounded text-xs bg-slate-800 text-slate-300 border border-slate-700 inline-block mt-0.5">
                            {p.category}
                          </span>
                        </div>

                        <div>
                          <span className="text-slate-400 block text-[10px] uppercase font-semibold">Assigned Bin</span>
                          <div onClick={(e) => e.stopPropagation()} className="mt-0.5">
                            <select
                              value={p.binCode}
                              onChange={(e) => onChangeProductBin(p.id, e.target.value)}
                              className="px-2 py-1 rounded-lg bg-slate-950 border border-slate-700/80 text-xs font-mono font-bold text-emerald-300 focus:outline-none focus:border-emerald-500 w-full"
                            >
                              {bins.map((b) => (
                                <option key={b.code} value={b.code}>
                                  {b.code} ({b.zone})
                                </option>
                              ))}
                            </select>
                          </div>
                        </div>
                      </div>

                      {/* Actions Dropdown on Mobile */}
                      <div className="flex items-center justify-between pt-2 border-t border-slate-800/80">
                        <span className="text-[11px] text-slate-400">Manage Product:</span>
                        <div className="relative inline-flex items-center justify-end text-left" data-dropdown-container>
                          <button
                            type="button"
                            onClick={() =>
                              setActiveMenuId(isMenuOpen ? null : `mobile-${p.id}`)
                            }
                            className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-bold text-slate-200 border border-slate-700 flex items-center gap-1.5 transition-colors cursor-pointer shadow-sm"
                          >
                            <span>Actions</span>
                            <ChevronDown
                              className={`w-3.5 h-3.5 transition-transform duration-200 ${
                                isMenuOpen ? 'rotate-180 text-emerald-400' : 'text-slate-400'
                              }`}
                            />
                          </button>

                          {isMenuOpen && (
                            <div className={`absolute right-0 ${isNearBottom ? 'bottom-full mb-1.5' : 'top-full mt-1.5'} w-52 rounded-xl bg-slate-900 border border-slate-800 shadow-2xl py-1.5 z-[100] text-left font-sans text-xs pointer-events-auto`}>
                              <button
                                type="button"
                                onClick={() => {
                                  setActiveMenuId(null);
                                  onOpenStockAdjustModal(p);
                                }}
                                className="w-full px-3.5 py-2 text-left text-slate-200 hover:bg-slate-800 flex items-center gap-2.5 transition-colors cursor-pointer"
                              >
                                <SlidersHorizontal className="w-4 h-4 text-emerald-400 pointer-events-none" />
                                <span>Adjust Physical Stock</span>
                              </button>

                              <button
                                type="button"
                                onClick={() => {
                                  setActiveMenuId(null);
                                  setProductToDelete(p);
                                }}
                                className="w-full px-3.5 py-2 text-left text-rose-300 hover:bg-rose-950/40 flex items-center gap-2.5 transition-colors cursor-pointer border-t border-slate-800/80"
                              >
                                <Trash2 className="w-4 h-4 text-rose-400 pointer-events-none" />
                                <span>Delete Product</span>
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>

        {/* 2. Desktop Full Table (Visible on md screens and larger) */}
        <div className="hidden md:block overflow-x-auto overflow-y-visible">
          <table className="w-full text-left text-sm text-slate-300 border-collapse">
            <thead className="bg-slate-950/80 text-[11px] uppercase tracking-wider text-slate-400 font-semibold border-b border-slate-800">
              <tr>
                <th className="py-3.5 pl-4 pr-2 w-10 align-middle">
                  <input
                    type="checkbox"
                    checked={isAllPageSelected}
                    onChange={toggleSelectAllPage}
                    aria-label="Select all products on this page"
                    className="w-4 h-4 rounded bg-slate-950 border-slate-700 text-emerald-500 focus:ring-emerald-500 cursor-pointer accent-emerald-500"
                  />
                </th>
                <th className="py-3.5 px-3 align-middle">Product &amp; SKU</th>
                <th className="py-3.5 px-3 align-middle">Category</th>
                <th className="py-3.5 px-3 align-middle">Merchant</th>
                <th className="py-3.5 px-3 align-middle">Assigned Bin</th>
                <th className="py-3.5 px-3 align-middle">Physical Stock</th>
                <th className="py-3.5 px-3 align-middle">Price</th>
                <th className="py-3.5 px-3 align-middle">Status</th>
                <th className="py-3.5 px-4 text-right align-middle">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-medium">
              {paginatedProducts.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-slate-400">
                    <Package className="w-10 h-10 text-slate-600 mx-auto mb-2" />
                    <p className="text-sm font-semibold text-slate-300">No active products match your criteria</p>
                    <p className="text-xs text-slate-500 mt-1">Try clearing filters or search keywords</p>
                  </td>
                </tr>
              ) : (
                paginatedProducts.map((p, idx) => {
                  const isSelected = selectedProductIds.has(p.id);
                  const isLowStock = p.stock < 30;
                  const isMenuOpen = activeMenuId === `desktop-${p.id}`;
                  const isNearBottom = idx > 0 && idx >= paginatedProducts.length - 2;

                  return (
                    <tr
                      key={p.id}
                      className={`hover:bg-slate-800/40 transition-colors ${
                        isSelected ? 'bg-emerald-950/15' : ''
                      }`}
                    >
                      {/* Checkbox */}
                      <td className="py-3.5 pl-4 pr-2 w-10 align-middle" onClick={(e) => e.stopPropagation()}>
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => toggleSelect(p.id)}
                          aria-label={`Select ${p.title}`}
                          className="w-4 h-4 rounded bg-slate-950 border-slate-700 text-emerald-500 focus:ring-emerald-500 cursor-pointer accent-emerald-500"
                        />
                      </td>

                      {/* Product Thumbnail & Title */}
                      <td className="py-3.5 px-3 align-middle">
                        <div className="flex items-center gap-3">
                          <img
                            src={p.imageUrl}
                            alt={p.title}
                            className="w-11 h-11 rounded-xl object-cover border border-slate-800 shrink-0"
                          />
                          <div>
                            <div className="font-bold text-white text-[15px] leading-tight line-clamp-1">
                              {p.title}
                            </div>
                            <div className="mt-1">
                              <span className="font-mono text-xs font-bold text-emerald-400">
                                {p.fullSku}
                              </span>
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Category */}
                      <td className="py-3.5 px-3 align-middle">
                        <span className="px-2 py-0.5 rounded-md text-xs bg-slate-800 text-slate-300 border border-slate-700">
                          {p.category}
                        </span>
                      </td>

                      {/* Merchant */}
                      <td className="py-3.5 px-3 align-middle">
                        <div className="text-xs font-semibold text-slate-200">{p.merchantName}</div>
                        <div className="text-[10px] font-mono text-slate-500">{p.merchantCode}</div>
                      </td>

                      {/* Assigned Bin */}
                      <td className="py-3.5 px-3 align-middle">
                        <select
                          value={p.binCode}
                          onChange={(e) => onChangeProductBin(p.id, e.target.value)}
                          className="px-2 py-1 rounded-lg bg-slate-950 border border-slate-700/80 text-xs font-mono font-bold text-emerald-300 focus:outline-none focus:border-emerald-500"
                        >
                          {bins.map((b) => (
                            <option key={b.code} value={b.code}>
                              {b.code} ({b.zone})
                            </option>
                          ))}
                        </select>
                      </td>

                      {/* Physical Stock */}
                      <td className="py-3.5 px-3 align-middle">
                        <div
                          className={`inline-flex items-center rounded-lg p-0.5 border transition-colors ${
                            isLowStock
                              ? 'bg-rose-500/15 border-rose-500/35'
                              : 'bg-slate-950 border-slate-800'
                          }`}
                        >
                          <button
                            type="button"
                            onClick={() => onAdjustStock(p.id, -1)}
                            disabled={p.stock <= 0}
                            className={`w-6 h-6 rounded flex items-center justify-center text-xs font-bold transition-colors ${
                              isLowStock
                                ? 'text-rose-400 hover:text-white hover:bg-rose-500/20 disabled:opacity-30'
                                : 'text-slate-400 hover:text-white hover:bg-slate-800 disabled:opacity-30'
                            }`}
                          >
                            -
                          </button>
                          <span
                            className={`w-10 text-center font-mono text-xs font-bold ${
                              isLowStock ? 'text-rose-400' : 'text-white'
                            }`}
                          >
                            {p.stock}
                          </span>
                          <button
                            type="button"
                            onClick={() => onAdjustStock(p.id, 1)}
                            className={`w-6 h-6 rounded flex items-center justify-center text-xs font-bold transition-colors ${
                              isLowStock
                                ? 'text-rose-400 hover:text-white hover:bg-rose-500/20'
                                : 'text-slate-400 hover:text-white hover:bg-slate-800'
                            }`}
                          >
                            +
                          </button>
                        </div>
                      </td>

                      {/* Price */}
                      <td className="py-3.5 px-3 font-mono text-xs font-semibold text-slate-200 align-middle">
                        ৳{p.price.toLocaleString()}
                      </td>

                      {/* Status */}
                      <td className="py-3.5 px-3 align-middle">
                        <StatusBadge status="Approved" />
                      </td>

                      {/* Actions Dropdown (Truly Floating Without Baseline Shift) */}
                      <td className="py-3.5 px-4 text-right align-middle">
                        <div className="relative inline-flex items-center justify-end text-left align-middle" data-dropdown-container>
                          <button
                            type="button"
                            onClick={() =>
                              setActiveMenuId(isMenuOpen ? null : `desktop-${p.id}`)
                            }
                            className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-bold text-slate-200 border border-slate-700 flex items-center gap-1.5 transition-colors cursor-pointer shadow-sm"
                          >
                            <span>Actions</span>
                            <ChevronDown
                              className={`w-3.5 h-3.5 transition-transform duration-200 ${
                                isMenuOpen ? 'rotate-180 text-emerald-400' : 'text-slate-400'
                              }`}
                            />
                          </button>

                          {isMenuOpen && (
                            <div className={`absolute right-0 ${isNearBottom ? 'bottom-full mb-1.5' : 'top-full mt-1.5'} w-52 rounded-xl bg-slate-900 border border-slate-800 shadow-2xl py-1.5 z-[100] text-left font-sans text-xs pointer-events-auto`}>
                              <button
                                type="button"
                                onClick={() => {
                                  setActiveMenuId(null);
                                  onOpenStockAdjustModal(p);
                                }}
                                className="w-full px-3.5 py-2 text-left text-slate-200 hover:bg-slate-800 flex items-center gap-2.5 transition-colors cursor-pointer"
                              >
                                <SlidersHorizontal className="w-4 h-4 text-emerald-400 pointer-events-none" />
                                <span>Adjust Physical Stock</span>
                              </button>

                              <button
                                type="button"
                                onClick={() => {
                                  setActiveMenuId(null);
                                  setProductToDelete(p);
                                }}
                                className="w-full px-3.5 py-2 text-left text-rose-300 hover:bg-rose-950/40 flex items-center gap-2.5 transition-colors cursor-pointer border-t border-slate-800/80"
                              >
                                <Trash2 className="w-4 h-4 text-rose-400 pointer-events-none" />
                                <span>Delete Product</span>
                              </button>
                            </div>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* 3. Pagination Footer (Desktop & Mobile) */}
        <div className="p-4 border-t border-slate-800 bg-slate-950/60 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-400">
          <div>
            Showing <strong className="text-white">{totalItems === 0 ? 0 : startIndex + 1}</strong> to{' '}
            <strong className="text-white">
              {Math.min(startIndex + pageSize, totalItems)}
            </strong>{' '}
            of <strong className="text-white">{totalItems}</strong> active products
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {/* Rows Limit Selector */}
            <div className="flex items-center gap-1.5 bg-slate-900 border border-slate-800 rounded-xl px-2.5 py-1">
              <span className="text-[11px] font-semibold text-slate-400 whitespace-nowrap">Show:</span>
              <select
                value={pageSize}
                onChange={(e) => handlePageSizeChange(Number(e.target.value))}
                aria-label="Products per page"
                className="bg-transparent text-xs font-bold text-emerald-400 focus:outline-none cursor-pointer"
              >
                <option value={10} className="bg-slate-950 text-slate-200">10</option>
                <option value={25} className="bg-slate-950 text-slate-200">25</option>
                <option value={50} className="bg-slate-950 text-slate-200">50</option>
                <option value={100} className="bg-slate-950 text-slate-200">100</option>
              </select>
              <span className="text-[11px] text-slate-500">rows</span>
            </div>

            {/* Page Buttons */}
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => handlePageChange(safePage - 1)}
                disabled={safePage <= 1}
                className="p-1.5 rounded-lg border border-slate-800 bg-slate-900 text-slate-300 hover:text-white disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer transition-colors"
                aria-label="Previous Page"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>

              {Array.from({ length: totalPages }, (_, i) => i + 1).map((pageNum) => (
                <button
                  key={pageNum}
                  type="button"
                  onClick={() => handlePageChange(pageNum)}
                  className={`w-7 h-7 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                    pageNum === safePage
                      ? 'bg-emerald-600 text-white shadow-sm'
                      : 'bg-slate-900 border border-slate-800 text-slate-300 hover:text-white'
                  }`}
                >
                  {pageNum}
                </button>
              ))}

              <button
                type="button"
                onClick={() => handlePageChange(safePage + 1)}
                disabled={safePage >= totalPages}
                className="p-1.5 rounded-lg border border-slate-800 bg-slate-900 text-slate-300 hover:text-white disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer transition-colors"
                aria-label="Next Page"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Single Product Deletion Confirmation Modal */}
      <Modal
        isOpen={Boolean(productToDelete)}
        onClose={() => setProductToDelete(null)}
        title="Confirm Product Deletion"
        size="md"
      >
        <div className="space-y-4">
          <div className="flex items-start gap-3.5">
            <div className="w-11 h-11 rounded-2xl flex items-center justify-center shrink-0 border bg-rose-500/15 border-rose-500/30 text-rose-400">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm text-slate-200 font-semibold">
                Are you sure you want to permanently delete this product?
              </p>
              <p className="text-xs text-slate-400 mt-1">
                This will remove the SKU from the active catalog and clear its warehouse bin reservation.
              </p>
            </div>
          </div>

          {productToDelete && (
            <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 flex items-center gap-3">
              <img
                src={productToDelete.imageUrl}
                alt={productToDelete.title}
                className="w-12 h-12 rounded-xl object-cover border border-slate-800 shrink-0"
              />
              <div className="text-xs space-y-0.5 min-w-0 flex-1">
                <div className="font-bold text-white truncate">{productToDelete.title}</div>
                <div className="font-mono text-emerald-400">{productToDelete.fullSku}</div>
                <div className="text-slate-400">
                  Stock: <strong className="text-white">{productToDelete.stock} pcs</strong> · Bin:{' '}
                  <strong className="text-emerald-300 font-mono">{productToDelete.binCode}</strong> · Merchant:{' '}
                  {productToDelete.merchantName}
                </div>
              </div>
            </div>
          )}

          <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-800">
            <button
              type="button"
              onClick={() => setProductToDelete(null)}
              className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold cursor-pointer transition-colors"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleConfirmSingleDelete}
              className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 active:scale-95 text-white text-xs font-bold flex items-center gap-1.5 shadow-lg shadow-rose-600/20 cursor-pointer transition-colors"
            >
              <Trash2 className="w-4 h-4 pointer-events-none" />
              <span>Delete Product</span>
            </button>
          </div>
        </div>
      </Modal>

      {/* Bulk Products Deletion Confirmation Modal */}
      <Modal
        isOpen={bulkDeleteModalOpen}
        onClose={() => setBulkDeleteModalOpen(false)}
        title="Confirm Bulk Product Deletion"
        size="md"
      >
        <div className="space-y-4">
          <div className="flex items-start gap-3.5">
            <div className="w-11 h-11 rounded-2xl flex items-center justify-center shrink-0 border bg-rose-500/15 border-rose-500/30 text-rose-400">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm text-slate-200 font-semibold">
                Are you sure you want to delete {selectedProductIds.size} selected products?
              </p>
              <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                This will permanently remove all {selectedProductIds.size} selected SKUs from the active warehouse catalog and inventory records.
              </p>
            </div>
          </div>

          <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-800">
            <button
              type="button"
              onClick={() => setBulkDeleteModalOpen(false)}
              className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold cursor-pointer transition-colors"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleConfirmBulkDelete}
              className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 active:scale-95 text-white text-xs font-bold flex items-center gap-1.5 shadow-lg shadow-rose-600/20 cursor-pointer transition-colors"
            >
              <Trash2 className="w-4 h-4 pointer-events-none" />
              <span>Delete {selectedProductIds.size} Products</span>
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
