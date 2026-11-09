'use client';

import React, { useState, useMemo, useEffect } from 'react';
import Link from 'next/link';
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
  Eye,
  Layers,
  Globe,
  AlertCircle,
  FileEdit,
  RotateCcw,
  Archive,
} from 'lucide-react';
import { SearchInput } from '@/components/ui';
import { Modal } from '@/components/admin/AdminModal';
import { WarehouseBin, WarehouseProductItem } from '../../types';
import { MERCHANTS } from '../../mockData';

export type ProductCatalogFilterTab = 'ALL' | 'PUBLIC' | 'OUT_OF_STOCK' | 'DRAFT';

interface ProductsCatalogTabProps {
  products: WarehouseProductItem[];
  bins: WarehouseBin[];
  onAdjustStock: (productId: string, delta: number) => void;
  onOpenStockAdjustModal: (product: WarehouseProductItem) => void;
  onChangeProductBin: (productId: string, nextBinCode: string) => void;
  onOpenAddProduct: () => void;
  onMoveToDraft?: (productId: string) => void;
  onRestoreProduct?: (productId: string) => void;
  onPermanentDelete?: (productId: string) => void;
  onBulkMoveToDraft?: (productIds: string[]) => void;
  onBulkRestore?: (productIds: string[]) => void;
  onBulkPermanentDelete?: (productIds: string[]) => void;
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
  onMoveToDraft,
  onRestoreProduct,
  onPermanentDelete,
  onBulkMoveToDraft,
  onBulkRestore,
  onBulkPermanentDelete,
  onDeleteProduct,
  onDeleteProducts,
}: ProductsCatalogTabProps) {
  // Catalog Segment Tab: ALL | PUBLIC | OUT_OF_STOCK | DRAFT
  const [activeCatalogTab, setActiveCatalogTab] = useState<ProductCatalogFilterTab>('ALL');

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

  // Delete & Confirmation Modals
  const [productToDelete, setProductToDelete] = useState<WarehouseProductItem | null>(null);
  const [bulkDeleteModalOpen, setBulkDeleteModalOpen] = useState(false);
  const [isPermanentDeleteMode, setIsPermanentDeleteMode] = useState(false);

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

  // Calculate live counts for each tab
  const catalogCounts = useMemo(() => {
    let allCount = 0;
    let publicCount = 0;
    let outOfStockCount = 0;
    let draftCount = 0;

    products.forEach((p) => {
      if (p.status === 'PENDING_APPROVAL' || p.status === 'REJECTED') return;

      allCount++;
      const isDraft = p.status === 'DRAFT' || p.isDraft;
      if (isDraft) {
        draftCount++;
      } else if (p.stock === 0) {
        outOfStockCount++;
      } else {
        publicCount++;
      }
    });

    return { allCount, publicCount, outOfStockCount, draftCount };
  }, [products]);

  // Filter products by active status segment tab
  const tabFilteredProducts = useMemo(() => {
    return products.filter((item) => {
      if (item.status === 'PENDING_APPROVAL' || item.status === 'REJECTED') return false;

      const isDraft = item.status === 'DRAFT' || item.isDraft;
      const isOutOfStock = !isDraft && item.stock === 0;
      const isPublic = !isDraft && item.stock > 0;

      if (activeCatalogTab === 'PUBLIC') return isPublic;
      if (activeCatalogTab === 'OUT_OF_STOCK') return isOutOfStock;
      if (activeCatalogTab === 'DRAFT') return isDraft;
      return true; // 'ALL' shows all
    });
  }, [products, activeCatalogTab]);

  // Filter by search, merchant, category, bin
  const filteredProducts = useMemo(() => {
    return tabFilteredProducts.filter((item) => {
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
  }, [tabFilteredProducts, searchQuery, merchantFilter, categoryFilter, binFilter]);

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

  // Actions: Move to Draft & Restore
  const handleSingleMoveToDraft = (product: WarehouseProductItem) => {
    onMoveToDraft?.(product.id);
    setSelectedProductIds((prev) => {
      const next = new Set(prev);
      next.delete(product.id);
      return next;
    });
  };

  const handleSingleRestore = (product: WarehouseProductItem) => {
    onRestoreProduct?.(product.id);
    setSelectedProductIds((prev) => {
      const next = new Set(prev);
      next.delete(product.id);
      return next;
    });
  };

  // Confirm Single Delete
  const handleConfirmSingleDelete = () => {
    if (!productToDelete) return;
    const id = productToDelete.id;
    if (isPermanentDeleteMode || productToDelete.status === 'DRAFT' || productToDelete.isDraft) {
      if (onPermanentDelete) onPermanentDelete(id);
      else onDeleteProduct?.(id);
    } else {
      onMoveToDraft?.(id);
    }

    setSelectedProductIds((prev) => {
      const next = new Set(prev);
      next.delete(id);
      return next;
    });
    setProductToDelete(null);
    setIsPermanentDeleteMode(false);
  };

  // Confirm Bulk Delete
  const handleConfirmBulkDelete = () => {
    const ids = Array.from(selectedProductIds);
    if (ids.length === 0) return;

    if (activeCatalogTab === 'DRAFT' || isPermanentDeleteMode) {
      if (onBulkPermanentDelete) onBulkPermanentDelete(ids);
      else onDeleteProducts?.(ids);
    } else {
      if (onBulkMoveToDraft) onBulkMoveToDraft(ids);
      else onDeleteProducts?.(ids);
    }

    setSelectedProductIds(new Set());
    setBulkDeleteModalOpen(false);
    setIsPermanentDeleteMode(false);
  };

  // Bulk Restore Action
  const handleBulkRestoreAction = () => {
    const ids = Array.from(selectedProductIds);
    if (ids.length === 0) return;
    onBulkRestore?.(ids);
    setSelectedProductIds(new Set());
  };

  return (
    <div className="space-y-4">
      {/* 1. TOP SEGMENT STATUS TABS: All Products, Public, Out of Stock, Draft */}
      <div className="bg-white dark:bg-navy-900 border border-slate-200 dark:border-white/10 rounded-2xl p-2 sm:p-2.5 shadow-md flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
          {/* Tab 1: All Products */}
          <button
            type="button"
            onClick={() => {
              setActiveCatalogTab('ALL');
              setCurrentPage(1);
            }}
            className={`px-3.5 py-2 rounded-xl text-xs sm:text-sm font-bold flex items-center gap-2 transition-all cursor-pointer ${
              activeCatalogTab === 'ALL'
                ? 'bg-orange-600 text-white shadow-md shadow-orange-500/25'
                : 'text-slate-600 dark:text-slate-300 hover:text-navy-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-navy-800'
            }`}
          >
            <Layers className="w-4 h-4" />
            <span>All Products</span>
            <span
              className={`px-2 py-0.5 rounded-full text-[11px] font-extrabold tabular-nums ${
                activeCatalogTab === 'ALL'
                  ? 'bg-white/20 text-white'
                  : 'bg-slate-200 dark:bg-navy-800 text-slate-700 dark:text-slate-300'
              }`}
            >
              {catalogCounts.allCount}
            </span>
          </button>

          {/* Tab 2: Public */}
          <button
            type="button"
            onClick={() => {
              setActiveCatalogTab('PUBLIC');
              setCurrentPage(1);
            }}
            className={`px-3.5 py-2 rounded-xl text-xs sm:text-sm font-bold flex items-center gap-2 transition-all cursor-pointer ${
              activeCatalogTab === 'PUBLIC'
                ? 'bg-emerald-600 text-white shadow-md shadow-emerald-500/25'
                : 'text-slate-600 dark:text-slate-300 hover:text-emerald-600 dark:hover:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/20'
            }`}
          >
            <Globe className="w-4 h-4" />
            <span>Public</span>
            <span
              className={`px-2 py-0.5 rounded-full text-[11px] font-extrabold tabular-nums ${
                activeCatalogTab === 'PUBLIC'
                  ? 'bg-white/20 text-white'
                  : 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30'
              }`}
            >
              {catalogCounts.publicCount}
            </span>
          </button>

          {/* Tab 3: Out of Stock */}
          <button
            type="button"
            onClick={() => {
              setActiveCatalogTab('OUT_OF_STOCK');
              setCurrentPage(1);
            }}
            className={`px-3.5 py-2 rounded-xl text-xs sm:text-sm font-bold flex items-center gap-2 transition-all cursor-pointer ${
              activeCatalogTab === 'OUT_OF_STOCK'
                ? 'bg-rose-600 text-white shadow-md shadow-rose-500/25'
                : 'text-slate-600 dark:text-slate-300 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/20'
            }`}
          >
            <AlertCircle className="w-4 h-4" />
            <span>Out of Stock</span>
            <span
              className={`px-2 py-0.5 rounded-full text-[11px] font-extrabold tabular-nums ${
                activeCatalogTab === 'OUT_OF_STOCK'
                  ? 'bg-white/20 text-white'
                  : 'bg-rose-500/15 text-rose-700 dark:text-rose-400 border border-rose-500/30'
              }`}
            >
              {catalogCounts.outOfStockCount}
            </span>
          </button>

          {/* Tab 4: Draft */}
          <button
            type="button"
            onClick={() => {
              setActiveCatalogTab('DRAFT');
              setCurrentPage(1);
            }}
            className={`px-3.5 py-2 rounded-xl text-xs sm:text-sm font-bold flex items-center gap-2 transition-all cursor-pointer ${
              activeCatalogTab === 'DRAFT'
                ? 'bg-amber-600 text-white shadow-md shadow-amber-500/25'
                : 'text-slate-600 dark:text-slate-300 hover:text-amber-600 dark:hover:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-950/20'
            }`}
          >
            <FileEdit className="w-4 h-4" />
            <span>Draft</span>
            <span
              className={`px-2 py-0.5 rounded-full text-[11px] font-extrabold tabular-nums ${
                activeCatalogTab === 'DRAFT'
                  ? 'bg-white/20 text-white'
                  : 'bg-amber-500/15 text-amber-700 dark:text-amber-300 border border-amber-500/30'
              }`}
            >
              {catalogCounts.draftCount}
            </span>
          </button>
        </div>

        {/* Informational Status Legend */}
        <div className="text-xs text-slate-500 dark:text-slate-400 px-2 font-medium hidden lg:block">
          {activeCatalogTab === 'ALL' && 'Viewing all catalog products (Public, Stock-out, & Drafts)'}
          {activeCatalogTab === 'PUBLIC' && 'Live in warehouse store with positive physical stock'}
          {activeCatalogTab === 'OUT_OF_STOCK' && 'Warehouse stock depleted (0 units remaining)'}
          {activeCatalogTab === 'DRAFT' && 'Unpublished drafts & products deleted from catalog'}
        </div>
      </div>

      {/* 2. Filter Bar */}
      <div className="bg-white dark:bg-navy-900 border border-slate-200 dark:border-white/10 rounded-2xl p-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 shadow-md">
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
            className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-navy-950 border border-slate-200 dark:border-white/10 rounded-xl text-sm text-navy-800 dark:text-slate-100 focus:outline-none focus:border-orange-500"
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
            className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-navy-950 border border-slate-200 dark:border-white/10 rounded-xl text-sm text-navy-800 dark:text-slate-100 focus:outline-none focus:border-orange-500"
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
            className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-navy-950 border border-slate-200 dark:border-white/10 rounded-xl text-sm tabular-nums text-orange-700 dark:text-orange-300 focus:outline-none focus:border-orange-500"
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

      {/* 3. Bulk Action Bar (Visible when 1+ products selected) */}
      {selectedProductIds.size > 0 && (
        <div className="bg-white dark:bg-navy-900 border border-orange-500/50 rounded-2xl p-3 sm:p-4 flex flex-col sm:flex-row items-center justify-between gap-3 shadow-xl animate-in fade-in-50 duration-200">
          <div className="flex items-center gap-3">
            <span className="w-8 h-8 rounded-xl bg-orange-500/20 text-orange-600 dark:text-orange-400 tabular-nums font-bold flex items-center justify-center text-xs">
              {selectedProductIds.size}
            </span>
            <div className="text-xs sm:text-sm">
              <span className="text-navy-800 dark:text-white font-bold">{selectedProductIds.size}</span>
              <span className="text-slate-600 dark:text-slate-300"> products selected</span>
            </div>
            <button
              type="button"
              onClick={() => setSelectedProductIds(new Set())}
              className="text-xs text-slate-600 dark:text-slate-300 hover:text-navy-800 dark:hover:text-white underline underline-offset-2 ml-2 cursor-pointer"
            >
              Deselect All
            </button>
          </div>

          <div className="flex items-center gap-2">
            {activeCatalogTab === 'DRAFT' ? (
              <>
                <button
                  type="button"
                  onClick={handleBulkRestoreAction}
                  className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center gap-1.5 shadow-md shadow-emerald-500/20 cursor-pointer transition-colors"
                >
                  <RotateCcw className="w-4 h-4 pointer-events-none" />
                  <span>Restore Selected ({selectedProductIds.size})</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setIsPermanentDeleteMode(true);
                    setBulkDeleteModalOpen(true);
                  }}
                  className="px-3.5 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold flex items-center gap-1.5 shadow-md shadow-rose-600/20 cursor-pointer transition-colors"
                >
                  <Trash2 className="w-4 h-4 pointer-events-none" />
                  <span>Permanently Delete ({selectedProductIds.size})</span>
                </button>
              </>
            ) : (
              <>
                <button
                  type="button"
                  onClick={() => {
                    setIsPermanentDeleteMode(false);
                    setBulkDeleteModalOpen(true);
                  }}
                  className="px-3.5 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold flex items-center gap-1.5 shadow-md shadow-amber-500/20 cursor-pointer transition-colors"
                >
                  <Archive className="w-4 h-4 pointer-events-none" />
                  <span>Move Selected to Draft ({selectedProductIds.size})</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setIsPermanentDeleteMode(true);
                    setBulkDeleteModalOpen(true);
                  }}
                  className="px-3 py-2 rounded-xl bg-slate-100 dark:bg-navy-800 hover:bg-rose-50 dark:hover:bg-rose-950/30 text-rose-600 dark:text-rose-400 text-xs font-bold flex items-center gap-1.5 border border-slate-200 dark:border-white/10 cursor-pointer transition-colors"
                >
                  <Trash2 className="w-3.5 h-3.5 pointer-events-none" />
                  <span>Permanent Delete</span>
                </button>
              </>
            )}
          </div>
        </div>
      )}

      {/* 4. Product Catalog Display: Mobile Accordions & Desktop Table */}
      <div className="bg-white dark:bg-navy-900 border border-slate-200 dark:border-white/10 rounded-2xl overflow-visible shadow-xl p-3 sm:p-0">
        {/* Mobile View */}
        <div className="block md:hidden space-y-2.5">
          {paginatedProducts.length === 0 ? (
            <div className="py-12 text-center text-slate-600 dark:text-slate-300">
              <Package className="w-10 h-10 text-slate-400 dark:text-slate-500 mx-auto mb-2" />
              <p className="text-sm font-semibold text-navy-900 dark:text-white">
                No products found in {activeCatalogTab === 'ALL' ? 'catalog' : activeCatalogTab.toLowerCase().replace('_', ' ')}
              </p>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                Try switching tabs or adjusting search filters
              </p>
            </div>
          ) : (
            paginatedProducts.map((p, idx) => {
              const isExpanded = expandedProductIds.has(p.id);
              const isSelected = selectedProductIds.has(p.id);
              const isMenuOpen = activeMenuId === `mobile-${p.id}`;
              const isNearBottom = idx > 0 && idx === paginatedProducts.length - 1;

              const isDraft = p.status === 'DRAFT' || p.isDraft;
              const isOutOfStock = !isDraft && p.stock === 0;
              const isLowStock = !isDraft && p.stock > 0 && p.stock < 30;

              return (
                <div
                  key={p.id}
                  className={`relative rounded-xl border transition-colors shadow-sm ${
                    isMenuOpen ? 'z-50' : 'z-0'
                  } ${
                    isSelected
                      ? 'border-orange-500/50 bg-orange-50/40 dark:bg-orange-950/20'
                      : 'border-slate-200 dark:border-white/10 bg-slate-50/60 dark:bg-navy-950/60'
                  }`}
                >
                  {/* Collapsed Header Summary */}
                  <div className="p-3 sm:p-3.5 flex items-start gap-2.5 sm:gap-3 select-none">
                    <div className="pt-1 shrink-0" onClick={(e) => e.stopPropagation()}>
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => toggleSelect(p.id)}
                        aria-label={`Select ${p.title}`}
                        className="w-4 h-4 rounded bg-slate-50 dark:bg-navy-950 border-slate-300 dark:border-white/15 text-orange-600 dark:text-orange-500 focus:ring-orange-500 cursor-pointer accent-orange-500"
                      />
                    </div>

                    <Link href={`/admin/products/${p.id}`} className="shrink-0 mt-0.5">
                      <img
                        src={p.imageUrl}
                        alt={p.title}
                        className="w-11 h-11 sm:w-12 sm:h-12 rounded-xl object-cover border border-slate-200 dark:border-white/10"
                      />
                    </Link>

                    <div className="min-w-0 flex-1 space-y-1">
                      {/* Row 1: Product Title + Status Badge */}
                      <div className="flex items-center justify-between gap-2">
                        <Link
                          href={`/admin/products/${p.id}`}
                          className="font-bold text-navy-900 dark:text-white text-sm leading-snug line-clamp-2 min-w-0 flex-1 hover:text-orange-600 dark:hover:text-orange-400 transition-colors block cursor-pointer"
                          title="Click to view product details"
                        >
                          {p.title}
                        </Link>
                        <div className="shrink-0">
                          {isDraft ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/15 text-amber-700 dark:text-amber-300 border border-amber-500/30">
                              <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                              Draft
                            </span>
                          ) : isOutOfStock ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-500/15 text-rose-700 dark:text-rose-400 border border-rose-500/30">
                              <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
                              Out of Stock
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30">
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                              Public
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Row 2: SKU and Merchant */}
                      <div className="flex items-center gap-1.5 text-xs truncate">
                        <span className="tabular-nums font-mono font-bold text-orange-600 dark:text-orange-400 truncate">
                          {p.fullSku}
                        </span>
                        <span className="text-slate-500 dark:text-slate-400 shrink-0">·</span>
                        <span className="text-slate-700 dark:text-slate-200 font-medium truncate">
                          {p.merchantName}
                        </span>
                      </div>

                      {/* Row 3: Price & Physical Stock Box + Accordion Toggle */}
                      <div className="flex items-center justify-between gap-2 pt-0.5">
                        <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
                          <span className="tabular-nums text-xs font-bold text-navy-800 dark:text-slate-100">
                            ৳{p.price.toLocaleString()}
                          </span>

                          <span
                            className={`px-2 py-0.5 rounded text-xs font-bold tabular-nums border ${
                              isOutOfStock
                                ? 'bg-rose-500/15 border-rose-500/35 text-rose-600 dark:text-rose-400'
                                : isLowStock
                                ? 'bg-amber-500/15 border-amber-500/35 text-amber-600 dark:text-amber-400'
                                : 'bg-slate-100 dark:bg-navy-950 border-slate-200 dark:border-white/10 text-navy-900 dark:text-white'
                            }`}
                          >
                            Stock: {p.stock} pcs
                          </span>
                        </div>

                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleExpand(p.id);
                          }}
                          aria-label="Toggle details"
                          className="p-1 rounded-lg bg-slate-200 dark:bg-navy-800 text-slate-600 dark:text-slate-300 hover:text-navy-900 dark:hover:text-white transition-colors cursor-pointer shrink-0"
                        >
                          <ChevronDown
                            className={`w-4 h-4 transition-transform duration-200 ${
                              isExpanded ? 'rotate-180 text-orange-600 dark:text-orange-400' : ''
                            }`}
                          />
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Expanded Row Details */}
                  {isExpanded && (
                    <div className="relative z-20 px-3.5 pb-3.5 pt-2 border-t border-slate-200/80 dark:border-white/10 bg-white/60 dark:bg-navy-900/60 rounded-b-xl text-xs space-y-2.5 font-sans">
                      <div className="grid grid-cols-2 gap-2 text-xs pt-1">
                        <div>
                          <span className="text-slate-600 dark:text-slate-300 block text-[11px] uppercase font-semibold">Category</span>
                          <span className="px-2 py-0.5 rounded text-xs bg-slate-100 dark:bg-navy-800 text-slate-700 dark:text-slate-200 border border-slate-300 dark:border-white/15 inline-block mt-0.5">
                            {p.category}
                          </span>
                        </div>

                        <div>
                          <span className="text-slate-600 dark:text-slate-300 block text-[11px] uppercase font-semibold">Assigned Bin</span>
                          <div onClick={(e) => e.stopPropagation()} className="mt-0.5">
                            <select
                              value={p.binCode}
                              onChange={(e) => onChangeProductBin(p.id, e.target.value)}
                              className="px-2 py-1 rounded-lg bg-slate-50 dark:bg-navy-950 border border-slate-300/80 dark:border-white/15 text-xs tabular-nums font-bold text-orange-700 dark:text-orange-300 focus:outline-none focus:border-orange-500 w-full"
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

                      {/* Actions on Mobile: Dropdown */}
                      <div className="flex items-center justify-between pt-2 border-t border-slate-200/80 dark:border-white/10">
                        <span className="text-xs text-slate-600 dark:text-slate-300 font-medium">Manage Product:</span>
                        <div className="relative inline-flex items-center justify-end text-left" data-dropdown-container>
                          <button
                            type="button"
                            onClick={() =>
                              setActiveMenuId(isMenuOpen ? null : `mobile-${p.id}`)
                            }
                            className="px-3 py-1.5 rounded-lg bg-slate-100 dark:bg-navy-800 hover:bg-slate-200 dark:hover:bg-navy-700 text-xs font-bold text-navy-800 dark:text-slate-100 border border-slate-300 dark:border-white/15 flex items-center gap-1.5 transition-colors cursor-pointer shadow-sm"
                          >
                            <span>Actions</span>
                            <ChevronDown
                              className={`w-3.5 h-3.5 transition-transform duration-200 ${
                                isMenuOpen ? 'rotate-180 text-orange-600 dark:text-orange-400' : 'text-slate-600 dark:text-slate-300'
                              }`}
                            />
                          </button>

                          {isMenuOpen && (
                            <div className={`absolute right-0 ${isNearBottom ? 'bottom-full mb-1.5' : 'top-full mt-1.5'} w-52 rounded-xl bg-white dark:bg-navy-900 border border-slate-200 dark:border-white/10 shadow-2xl py-1.5 z-[100] text-left font-sans text-xs pointer-events-auto`}>
                              <Link
                                href={`/admin/products/${p.id}`}
                                onClick={() => setActiveMenuId(null)}
                                className="w-full px-3.5 py-2 text-left text-orange-600 dark:text-orange-400 hover:bg-slate-100 dark:hover:bg-navy-800 flex items-center gap-2.5 transition-colors cursor-pointer font-bold border-b border-slate-200/60 dark:border-white/10"
                              >
                                <Eye className="w-4 h-4 text-orange-600 dark:text-orange-400 pointer-events-none" />
                                <span>View Product Details</span>
                              </Link>

                              <button
                                type="button"
                                onClick={() => {
                                  setActiveMenuId(null);
                                  onOpenStockAdjustModal(p);
                                }}
                                className="w-full px-3.5 py-2 text-left text-navy-800 dark:text-slate-100 hover:bg-slate-100 dark:hover:bg-navy-800 flex items-center gap-2.5 transition-colors cursor-pointer font-semibold"
                              >
                                <SlidersHorizontal className="w-4 h-4 text-orange-600 dark:text-orange-400 pointer-events-none" />
                                <span>Manage Stock (Color & Size)</span>
                              </button>

                              {isDraft ? (
                                <>
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setActiveMenuId(null);
                                      handleSingleRestore(p);
                                    }}
                                    className="w-full px-3.5 py-2 text-left text-emerald-700 dark:text-emerald-300 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 flex items-center gap-2.5 transition-colors cursor-pointer border-t border-slate-200/80 dark:border-white/10 font-bold"
                                  >
                                    <RotateCcw className="w-4 h-4 text-emerald-600 dark:text-emerald-400 pointer-events-none" />
                                    <span>Restore to Public</span>
                                  </button>

                                  <button
                                    type="button"
                                    onClick={() => {
                                      setActiveMenuId(null);
                                      setIsPermanentDeleteMode(true);
                                      setProductToDelete(p);
                                    }}
                                    className="w-full px-3.5 py-2 text-left text-rose-700 dark:text-rose-300 hover:bg-rose-50 dark:hover:bg-rose-950/40 flex items-center gap-2.5 transition-colors cursor-pointer border-t border-slate-200/80 dark:border-white/10"
                                  >
                                    <Trash2 className="w-4 h-4 text-rose-600 dark:text-rose-400 pointer-events-none" />
                                    <span>Permanently Delete</span>
                                  </button>
                                </>
                              ) : (
                                <button
                                  type="button"
                                  onClick={() => {
                                    setActiveMenuId(null);
                                    handleSingleMoveToDraft(p);
                                  }}
                                  className="w-full px-3.5 py-2 text-left text-rose-700 dark:text-rose-300 hover:bg-rose-50 dark:hover:bg-rose-950/40 flex items-center gap-2.5 transition-colors cursor-pointer border-t border-slate-200/80 dark:border-white/10"
                                >
                                  <Trash2 className="w-4 h-4 text-rose-600 dark:text-rose-400 pointer-events-none" />
                                  <span>Delete (Move to Draft)</span>
                                </button>
                              )}
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

        {/* 5. Desktop Full Table */}
        <div className="hidden md:block overflow-x-auto overflow-y-visible">
          <table className="w-full text-left text-sm text-slate-700 dark:text-slate-200 border-collapse">
            <thead className="bg-slate-50/80 dark:bg-navy-950/80 text-xs uppercase tracking-wider text-slate-600 dark:text-slate-300 font-semibold border-b border-slate-200 dark:border-white/10">
              <tr>
                <th className="py-3.5 pl-4 pr-2 w-10 align-middle">
                  <input
                    type="checkbox"
                    checked={isAllPageSelected}
                    onChange={toggleSelectAllPage}
                    aria-label="Select all products on this page"
                    className="w-4 h-4 rounded bg-slate-50 dark:bg-navy-950 border-slate-300 dark:border-white/15 text-orange-600 dark:text-orange-500 focus:ring-orange-500 cursor-pointer accent-orange-500"
                  />
                </th>
                <th className="py-3.5 px-3 align-middle">Product &amp; SKU</th>
                <th className="py-3.5 px-3 align-middle">Category</th>
                <th className="py-3.5 px-3 align-middle">Merchant</th>
                <th className="py-3.5 px-3 align-middle">Warehouse Bin</th>
                <th className="py-3.5 px-3 align-middle">Stock (Units)</th>
                <th className="py-3.5 px-3 align-middle">Unit Price</th>
                <th className="py-3.5 px-3 align-middle">Status</th>
                <th className="py-3.5 px-4 text-right align-middle">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200/70 dark:divide-white/10 font-sans">
              {paginatedProducts.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-slate-600 dark:text-slate-300">
                    <Package className="w-10 h-10 text-slate-400 dark:text-slate-500 mx-auto mb-2" />
                    <p className="text-sm font-semibold text-navy-900 dark:text-white">
                      No products match your active tab ({activeCatalogTab}) or filter search
                    </p>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                      Try switching between All, Public, Out of Stock, or Draft tabs
                    </p>
                  </td>
                </tr>
              ) : (
                paginatedProducts.map((p, idx) => {
                  const isSelected = selectedProductIds.has(p.id);
                  const isMenuOpen = activeMenuId === `desktop-${p.id}`;
                  const isNearBottom = idx > 0 && idx >= paginatedProducts.length - 2;

                  const isDraft = p.status === 'DRAFT' || p.isDraft;
                  const isOutOfStock = !isDraft && p.stock === 0;
                  const isLowStock = !isDraft && p.stock > 0 && p.stock < 30;

                  return (
                    <tr
                      key={p.id}
                      className={`hover:bg-slate-100/40 dark:hover:bg-navy-800/40 transition-colors ${
                        isSelected ? 'bg-orange-50/50 dark:bg-orange-950/15' : ''
                      }`}
                    >
                      {/* Checkbox */}
                      <td className="py-3.5 pl-4 pr-2 w-10 align-middle" onClick={(e) => e.stopPropagation()}>
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => toggleSelect(p.id)}
                          aria-label={`Select ${p.title}`}
                          className="w-4 h-4 rounded bg-slate-50 dark:bg-navy-950 border-slate-300 dark:border-white/15 text-orange-600 dark:text-orange-500 focus:ring-orange-500 cursor-pointer accent-orange-500"
                        />
                      </td>

                      {/* Product Thumbnail & Title (1-2 lines) */}
                      <td className="py-3.5 px-3 align-middle">
                        <div className="flex items-center gap-3">
                          <Link href={`/admin/products/${p.id}`} className="shrink-0 group">
                            <img
                              src={p.imageUrl}
                              alt={p.title}
                              className="w-11 h-11 rounded-xl object-cover border border-slate-200 dark:border-white/10 group-hover:border-orange-500 transition-colors"
                            />
                          </Link>
                          <div className="min-w-0 max-w-xs lg:max-w-md">
                            <Link
                              href={`/admin/products/${p.id}`}
                              className="font-bold text-navy-900 dark:text-white text-sm leading-snug line-clamp-2 hover:text-orange-600 dark:hover:text-orange-400 hover:underline transition-colors block cursor-pointer"
                              title="Click to view product details"
                            >
                              {p.title}
                            </Link>
                            <div className="mt-1">
                              <span className="tabular-nums text-xs font-mono font-bold text-orange-600 dark:text-orange-400">
                                {p.fullSku}
                              </span>
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Category */}
                      <td className="py-3.5 px-3 align-middle">
                        <span className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-slate-100 dark:bg-navy-800 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-white/10 inline-block">
                          {p.category}
                        </span>
                      </td>

                      {/* Merchant */}
                      <td className="py-3.5 px-3 align-middle">
                        <div className="text-xs">
                          <span className="font-bold text-navy-900 dark:text-white block">{p.merchantName}</span>
                          <span className="text-slate-500 dark:text-slate-400 font-mono text-[11px] block mt-0.5">
                            {p.merchantCode}
                          </span>
                        </div>
                      </td>

                      {/* Assigned Bin Location */}
                      <td className="py-3.5 px-3 align-middle" onClick={(e) => e.stopPropagation()}>
                        <div className="inline-block">
                          <select
                            value={p.binCode}
                            onChange={(e) => onChangeProductBin(p.id, e.target.value)}
                            aria-label={`Assigned bin for ${p.title}`}
                            className="px-2.5 py-1.5 rounded-lg bg-slate-50 dark:bg-navy-950 border border-slate-200 dark:border-white/15 text-xs font-mono font-bold text-orange-700 dark:text-orange-300 focus:outline-none focus:border-orange-500 cursor-pointer"
                          >
                            {bins.map((b) => (
                              <option key={b.code} value={b.code}>
                                {b.code} ({b.zone})
                              </option>
                            ))}
                          </select>
                        </div>
                      </td>

                      {/* Stock Units (Display only — edit via Action button) */}
                      <td className="py-3.5 px-3 align-middle">
                        <span
                          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold tabular-nums border ${
                            isOutOfStock
                              ? 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/30'
                              : isLowStock
                              ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30'
                              : 'bg-slate-100 dark:bg-navy-950 text-navy-900 dark:text-white border-slate-200 dark:border-white/10'
                          }`}
                        >
                          {p.stock} <span className="text-[11px] font-normal text-slate-500">pcs</span>
                        </span>
                      </td>

                      {/* Unit Price */}
                      <td className="py-3.5 px-3 tabular-nums text-xs font-semibold text-navy-800 dark:text-slate-100 align-middle">
                        ৳{p.price.toLocaleString()}
                      </td>

                      {/* Status Column: Public | Out of Stock | Draft */}
                      <td className="py-3.5 px-3 align-middle">
                        {isDraft ? (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-amber-500/15 text-amber-700 dark:text-amber-300 border border-amber-500/30">
                            <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                            Draft
                          </span>
                        ) : isOutOfStock ? (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-rose-500/15 text-rose-700 dark:text-rose-400 border border-rose-500/30">
                            <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
                            Out of Stock
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                            Public
                          </span>
                        )}
                      </td>

                      {/* Actions Column: Dropdown */}
                      <td className="py-3.5 px-4 text-right align-middle">
                        <div className="relative inline-flex items-center justify-end text-left align-middle" data-dropdown-container>
                          <button
                            type="button"
                            onClick={() =>
                              setActiveMenuId(isMenuOpen ? null : `desktop-${p.id}`)
                            }
                            className="px-3 py-1.5 rounded-lg bg-slate-100 dark:bg-navy-800 hover:bg-slate-200 dark:hover:bg-navy-700 text-xs font-bold text-navy-800 dark:text-slate-100 border border-slate-300 dark:border-white/15 flex items-center gap-1.5 transition-colors cursor-pointer shadow-sm"
                          >
                            <span>Actions</span>
                            <ChevronDown
                              className={`w-3.5 h-3.5 transition-transform duration-200 ${
                                isMenuOpen ? 'rotate-180 text-orange-600 dark:text-orange-400' : 'text-slate-600 dark:text-slate-300'
                              }`}
                            />
                          </button>

                          {isMenuOpen && (
                            <div className={`absolute right-0 ${isNearBottom ? 'bottom-full mb-1.5' : 'top-full mt-1.5'} w-52 rounded-xl bg-white dark:bg-navy-900 border border-slate-200 dark:border-white/10 shadow-2xl py-1.5 z-[100] text-left font-sans text-xs pointer-events-auto`}>
                              <Link
                                href={`/admin/products/${p.id}`}
                                onClick={() => setActiveMenuId(null)}
                                className="w-full px-3.5 py-2 text-left text-orange-600 dark:text-orange-400 hover:bg-slate-100 dark:hover:bg-navy-800 flex items-center gap-2.5 transition-colors cursor-pointer font-bold border-b border-slate-200/60 dark:border-white/10"
                              >
                                <Eye className="w-4 h-4 text-orange-600 dark:text-orange-400 pointer-events-none" />
                                <span>View Product Details</span>
                              </Link>

                              <button
                                type="button"
                                onClick={() => {
                                  setActiveMenuId(null);
                                  onOpenStockAdjustModal(p);
                                }}
                                className="w-full px-3.5 py-2 text-left text-navy-800 dark:text-slate-100 hover:bg-slate-100 dark:hover:bg-navy-800 flex items-center gap-2.5 transition-colors cursor-pointer font-semibold"
                              >
                                <SlidersHorizontal className="w-4 h-4 text-orange-600 dark:text-orange-400 pointer-events-none" />
                                <span>Manage Stock (Color & Size)</span>
                              </button>

                              {isDraft ? (
                                <>
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setActiveMenuId(null);
                                      handleSingleRestore(p);
                                    }}
                                    className="w-full px-3.5 py-2 text-left text-emerald-700 dark:text-emerald-300 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 flex items-center gap-2.5 transition-colors cursor-pointer border-t border-slate-200/80 dark:border-white/10 font-bold"
                                  >
                                    <RotateCcw className="w-4 h-4 text-emerald-600 dark:text-emerald-400 pointer-events-none" />
                                    <span>Restore to Public</span>
                                  </button>

                                  <button
                                    type="button"
                                    onClick={() => {
                                      setActiveMenuId(null);
                                      setIsPermanentDeleteMode(true);
                                      setProductToDelete(p);
                                    }}
                                    className="w-full px-3.5 py-2 text-left text-rose-700 dark:text-rose-300 hover:bg-rose-50 dark:hover:bg-rose-950/40 flex items-center gap-2.5 transition-colors cursor-pointer border-t border-slate-200/80 dark:border-white/10"
                                  >
                                    <Trash2 className="w-4 h-4 text-rose-600 dark:text-rose-400 pointer-events-none" />
                                    <span>Permanently Delete</span>
                                  </button>
                                </>
                              ) : (
                                <button
                                  type="button"
                                  onClick={() => {
                                    setActiveMenuId(null);
                                    handleSingleMoveToDraft(p);
                                  }}
                                  className="w-full px-3.5 py-2 text-left text-rose-700 dark:text-rose-300 hover:bg-rose-50 dark:hover:bg-rose-950/40 flex items-center gap-2.5 transition-colors cursor-pointer border-t border-slate-200/80 dark:border-white/10"
                                >
                                  <Trash2 className="w-4 h-4 text-rose-600 dark:text-rose-400 pointer-events-none" />
                                  <span>Delete (Move to Draft)</span>
                                </button>
                              )}
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

        {/* 6. Pagination Footer */}
        <div className="p-4 border-t border-slate-200 dark:border-white/10 bg-slate-50/60 dark:bg-navy-950/60 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-600 dark:text-slate-300">
          <div>
            Showing <strong className="text-navy-800 dark:text-white">{totalItems === 0 ? 0 : startIndex + 1}</strong> to{' '}
            <strong className="text-navy-800 dark:text-white">
              {Math.min(startIndex + pageSize, totalItems)}
            </strong>{' '}
            of <strong className="text-navy-800 dark:text-white">{totalItems}</strong> products in {activeCatalogTab === 'ALL' ? 'all status' : activeCatalogTab.toLowerCase().replace('_', ' ')}
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-1.5 bg-white dark:bg-navy-900 border border-slate-200 dark:border-white/10 rounded-xl px-2.5 py-1">
              <span className="text-xs font-semibold text-slate-600 dark:text-slate-300 whitespace-nowrap">Show:</span>
              <select
                value={pageSize}
                onChange={(e) => handlePageSizeChange(Number(e.target.value))}
                aria-label="Products per page"
                className="bg-transparent text-xs font-bold text-orange-600 dark:text-orange-400 focus:outline-none cursor-pointer"
              >
                <option value={10} className="bg-slate-50 dark:bg-navy-950 text-navy-800 dark:text-slate-100">10</option>
                <option value={25} className="bg-slate-50 dark:bg-navy-950 text-navy-800 dark:text-slate-100">25</option>
                <option value={50} className="bg-slate-50 dark:bg-navy-950 text-navy-800 dark:text-slate-100">50</option>
                <option value={100} className="bg-slate-50 dark:bg-navy-950 text-navy-800 dark:text-slate-100">100</option>
              </select>
              <span className="text-xs text-slate-500 dark:text-slate-400">rows</span>
            </div>

            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => handlePageChange(safePage - 1)}
                disabled={safePage <= 1}
                aria-label="Previous page"
                className="p-1.5 rounded-lg bg-white dark:bg-navy-900 border border-slate-200 dark:border-white/10 text-slate-600 dark:text-slate-300 hover:text-navy-800 dark:hover:text-white hover:border-slate-300 disabled:opacity-30 disabled:cursor-not-allowed transition-colors cursor-pointer"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>

              <span className="px-2 text-xs font-semibold tabular-nums text-slate-600 dark:text-slate-300">
                Page <strong className="text-navy-800 dark:text-white">{safePage}</strong> of{' '}
                <strong className="text-navy-800 dark:text-white">{totalPages}</strong>
              </span>

              <button
                type="button"
                onClick={() => handlePageChange(safePage + 1)}
                disabled={safePage >= totalPages}
                aria-label="Next page"
                className="p-1.5 rounded-lg bg-white dark:bg-navy-900 border border-slate-200 dark:border-white/10 text-slate-600 dark:text-slate-300 hover:text-navy-800 dark:hover:text-white hover:border-slate-300 disabled:opacity-30 disabled:cursor-not-allowed transition-colors cursor-pointer"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* 7. Delete Confirmation Modal (Draft vs Permanent) */}
      <Modal
        isOpen={Boolean(productToDelete)}
        onClose={() => {
          setProductToDelete(null);
          setIsPermanentDeleteMode(false);
        }}
        title={
          isPermanentDeleteMode || productToDelete?.status === 'DRAFT' || productToDelete?.isDraft
            ? 'Confirm Permanent Deletion'
            : 'Move Product to Draft'
        }
        size="md"
      >
        <div className="space-y-4">
          <div className="flex items-start gap-3.5">
            <div
              className={`w-11 h-11 rounded-2xl flex items-center justify-center shrink-0 border ${
                isPermanentDeleteMode || productToDelete?.status === 'DRAFT' || productToDelete?.isDraft
                  ? 'bg-rose-500/15 border-rose-500/30 text-rose-600 dark:text-rose-400'
                  : 'bg-amber-500/15 border-amber-500/30 text-amber-600 dark:text-amber-400'
              }`}
            >
              <AlertTriangle className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm text-navy-800 dark:text-slate-100 font-semibold">
                {isPermanentDeleteMode || productToDelete?.status === 'DRAFT' || productToDelete?.isDraft
                  ? 'Are you sure you want to permanently delete this product?'
                  : 'Move this product to Drafts?'}
              </p>
              <p className="text-xs text-slate-600 dark:text-slate-300 mt-1 leading-relaxed">
                {isPermanentDeleteMode || productToDelete?.status === 'DRAFT' || productToDelete?.isDraft
                  ? 'This will completely remove the SKU from the database and cannot be recovered.'
                  : 'This product will be hidden from the public store, but kept safely in the Draft tab. You can restore it anytime.'}
              </p>
            </div>
          </div>

          {productToDelete && (
            <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-navy-950 border border-slate-200 dark:border-white/10 flex items-center gap-3">
              <img
                src={productToDelete.imageUrl}
                alt={productToDelete.title}
                className="w-12 h-12 rounded-xl object-cover border border-slate-200 dark:border-white/10 shrink-0"
              />
              <div className="text-xs space-y-0.5 min-w-0 flex-1">
                <div className="font-bold text-navy-800 dark:text-white truncate">{productToDelete.title}</div>
                <div className="tabular-nums font-mono text-orange-600 dark:text-orange-400">{productToDelete.fullSku}</div>
                <div className="text-slate-600 dark:text-slate-300">
                  Stock: <strong className="text-navy-800 dark:text-white">{productToDelete.stock} pcs</strong> · Bin:{' '}
                  <strong className="text-orange-700 dark:text-orange-300 tabular-nums">{productToDelete.binCode}</strong>
                </div>
              </div>
            </div>
          )}

          <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-200 dark:border-white/10">
            <button
              type="button"
              onClick={() => {
                setProductToDelete(null);
                setIsPermanentDeleteMode(false);
              }}
              className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-navy-800 hover:bg-slate-200 dark:hover:bg-navy-700 text-slate-700 dark:text-slate-200 text-xs font-semibold cursor-pointer transition-colors"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleConfirmSingleDelete}
              className={`px-4 py-2 rounded-xl text-white text-xs font-bold flex items-center gap-1.5 shadow-lg cursor-pointer transition-colors ${
                isPermanentDeleteMode || productToDelete?.status === 'DRAFT' || productToDelete?.isDraft
                  ? 'bg-rose-600 hover:bg-rose-500 shadow-rose-600/20'
                  : 'bg-amber-600 hover:bg-amber-500 shadow-amber-600/20'
              }`}
            >
              <Trash2 className="w-4 h-4 pointer-events-none" />
              <span>
                {isPermanentDeleteMode || productToDelete?.status === 'DRAFT' || productToDelete?.isDraft
                  ? 'Permanently Delete'
                  : 'Move to Draft'}
              </span>
            </button>
          </div>
        </div>
      </Modal>

      {/* 8. Bulk Action Confirmation Modal */}
      <Modal
        isOpen={bulkDeleteModalOpen}
        onClose={() => {
          setBulkDeleteModalOpen(false);
          setIsPermanentDeleteMode(false);
        }}
        title={
          isPermanentDeleteMode || activeCatalogTab === 'DRAFT'
            ? 'Confirm Permanent Bulk Deletion'
            : 'Move Selected to Draft'
        }
        size="md"
      >
        <div className="space-y-4">
          <div className="flex items-start gap-3.5">
            <div
              className={`w-11 h-11 rounded-2xl flex items-center justify-center shrink-0 border ${
                isPermanentDeleteMode || activeCatalogTab === 'DRAFT'
                  ? 'bg-rose-500/15 border-rose-500/30 text-rose-600 dark:text-rose-400'
                  : 'bg-amber-500/15 border-amber-500/30 text-amber-600 dark:text-amber-400'
              }`}
            >
              <AlertTriangle className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm text-navy-800 dark:text-slate-100 font-semibold">
                {isPermanentDeleteMode || activeCatalogTab === 'DRAFT'
                  ? `Are you sure you want to permanently delete ${selectedProductIds.size} products?`
                  : `Move ${selectedProductIds.size} products to Draft?`}
              </p>
              <p className="text-xs text-slate-600 dark:text-slate-300 mt-1 leading-relaxed">
                {isPermanentDeleteMode || activeCatalogTab === 'DRAFT'
                  ? 'This will completely erase all selected records permanently.'
                  : 'They will be moved to the Draft tab where you can restore them anytime.'}
              </p>
            </div>
          </div>

          <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-200 dark:border-white/10">
            <button
              type="button"
              onClick={() => {
                setBulkDeleteModalOpen(false);
                setIsPermanentDeleteMode(false);
              }}
              className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-navy-800 hover:bg-slate-200 dark:hover:bg-navy-700 text-slate-700 dark:text-slate-200 text-xs font-semibold cursor-pointer transition-colors"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleConfirmBulkDelete}
              className={`px-4 py-2 rounded-xl text-white text-xs font-bold flex items-center gap-1.5 shadow-lg cursor-pointer transition-colors ${
                isPermanentDeleteMode || activeCatalogTab === 'DRAFT'
                  ? 'bg-rose-600 hover:bg-rose-500 shadow-rose-600/20'
                  : 'bg-amber-600 hover:bg-amber-500 shadow-amber-600/20'
              }`}
            >
              <Trash2 className="w-4 h-4 pointer-events-none" />
              <span>
                {isPermanentDeleteMode || activeCatalogTab === 'DRAFT'
                  ? `Permanently Delete (${selectedProductIds.size})`
                  : `Move to Draft (${selectedProductIds.size})`}
              </span>
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
