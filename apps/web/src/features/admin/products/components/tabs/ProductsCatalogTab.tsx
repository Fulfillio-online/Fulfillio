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
  RotateCcw,
  Archive,
  Clock,
  MapPin,
  CheckCircle2,
  XCircle,
  PackageCheck,
} from 'lucide-react';
import { SearchInput } from '@/components/ui';
import { Modal } from '@/components/admin/AdminModal';
import {
  WarehouseBin,
  WarehouseProductItem,
} from '../../types';
import { MERCHANTS } from '../../mockData';
import { BulkApprovalModal, BulkSlotAssignment } from '../modals/BulkApprovalModal';

export type ProductCatalogFilterTab =
  | 'ALL'
  | 'APPROVAL'
  | 'PUBLIC'
  | 'OUT_OF_STOCK'
  | 'DRAFT'
  | 'REJECTED';

export interface ProductsCatalogTabProps {
  products: WarehouseProductItem[];
  bins: WarehouseBin[];
  fixedMerchantCode?: string;
  hideMerchantFilter?: boolean;
  initialFilterTab?: ProductCatalogFilterTab;
  onFilterTabChange?: (tab: ProductCatalogFilterTab) => void;
  onAdjustStock: (productId: string, delta: number) => void;
  onOpenStockAdjustModal: (product: WarehouseProductItem) => void;
  onChangeProductBin: (productId: string, nextBinCode: string) => void;
  onOpenAddProduct?: () => void;
  onApproveProduct?: (productId: string, binCode?: string) => void;
  onOpenAcceptStockModal?: (product: WarehouseProductItem) => void;
  onOpenApprovalModal?: (
    mode: 'APPROVE' | 'REJECT',
    product: WarehouseProductItem,
    selectedBin: string
  ) => void;
  onBulkApproveProductsWithSlots?: (assignments: BulkSlotAssignment[]) => void;
  onBulkApproveProducts?: (productIds: string[]) => void;
  onBulkRejectProducts?: (productIds: string[]) => void;
  onMoveToDraft?: (productId: string) => void;
  onRestoreProduct?: (productId: string) => void;
  onPermanentDelete?: (productId: string) => void;
  onBulkMoveToDraft?: (productIds: string[]) => void;
  onBulkRestore?: (productIds: string[]) => void;
  onBulkPermanentDelete?: (productIds: string[]) => void;
  onDeleteProduct?: (productId: string) => void;
  onDeleteProducts?: (productIds: string[]) => void;
  onAllowEdit?: (productId: string) => void;
  onApproveRevision?: (productId: string) => void;
  onRejectRevision?: (productId: string) => void;
  onToggleSuspend?: (productId: string) => void;
}

export function ProductsCatalogTab({
  products,
  bins,
  fixedMerchantCode,
  hideMerchantFilter,
  initialFilterTab = 'ALL',
  onFilterTabChange,
  onAdjustStock,
  onOpenStockAdjustModal,
  onChangeProductBin,
  onOpenAddProduct,
  onApproveProduct,
  onOpenAcceptStockModal,
  onOpenApprovalModal,
  onBulkApproveProductsWithSlots,
  onBulkApproveProducts,
  onBulkRejectProducts,
  onMoveToDraft,
  onRestoreProduct,
  onPermanentDelete,
  onBulkMoveToDraft,
  onBulkRestore,
  onBulkPermanentDelete,
  onDeleteProduct,
  onDeleteProducts,
  onAllowEdit,
  onApproveRevision,
  onRejectRevision,
  onToggleSuspend,
}: ProductsCatalogTabProps) {
  // Catalog Filter Tab
  const [activeCatalogTab, setActiveCatalogTab] = useState<ProductCatalogFilterTab>(initialFilterTab);

  useEffect(() => {
    if (initialFilterTab) {
      setActiveCatalogTab((prev) => (prev !== initialFilterTab ? initialFilterTab : prev));
    }
  }, [initialFilterTab]);

  const handleTabSwitch = (tab: ProductCatalogFilterTab) => {
    setActiveCatalogTab(tab);
    setCurrentPage(1);
    setSelectedProductIds(new Set());
    setActiveMenuId(null);
    onFilterTabChange?.(tab);
  };

  // Search & Secondary Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [merchantFilter, setMerchantFilter] = useState<string>(fixedMerchantCode || 'ALL');
  const [categoryFilter, setCategoryFilter] = useState<string>('ALL');
  const [binFilter, setBinFilter] = useState<string>('ALL');

  useEffect(() => {
    if (fixedMerchantCode) {
      setMerchantFilter((prev) => (prev !== fixedMerchantCode ? fixedMerchantCode : prev));
    }
  }, [fixedMerchantCode]);

  // Pagination
  const [pageSize, setPageSize] = useState<number>(10);
  const [currentPage, setCurrentPage] = useState<number>(1);

  // Bulk Selection
  const [selectedProductIds, setSelectedProductIds] = useState<Set<string>>(new Set());
  const [bulkAction, setBulkAction] = useState<string>('');

  // Bulk Approval Bin Slotting Modal State
  const [bulkSlotModalOpen, setBulkSlotModalOpen] = useState(false);

  // Actions Dropdown Menu
  const [activeMenuId, setActiveMenuId] = useState<string | null>(null);

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

  // Helper: map merchant code to merchant record id (e.g. MC-101 -> m-101)
  const getMerchantProfileId = (code?: string): string => {
    if (!code) return 'm-101';
    return code.toLowerCase().replace('mc-', 'm-');
  };

  // Helper: normalize category names ('Apparel' -> 'Fashion')
  const normalizeCategory = (cat: string): string => {
    if (!cat || cat.toLowerCase() === 'apparel') return 'Fashion';
    return cat;
  };

  // Base Pool (scoped by merchant if fixedMerchantCode is provided)
  const basePool = useMemo(() => {
    if (!fixedMerchantCode) return products;
    return products.filter((p) => p.merchantCode === fixedMerchantCode);
  }, [products, fixedMerchantCode]);

  // 1. Tab Counts
  const catalogCounts = useMemo(() => {
    const allCount = basePool.length;
    const approvalCount = basePool.filter((p) => p.status === 'PENDING_APPROVAL' && !p.isDraft).length;
    const publicCount = basePool.filter(
      (p) => (p.status === 'STOCK_STORED' || p.status === 'APPROVED') && !p.isDraft && p.stock > 0
    ).length;
    const outOfStockCount = basePool.filter(
      (p) => (p.status === 'APPROVED' || p.status === 'STOCK_STORED') && !p.isDraft && p.stock === 0
    ).length;
    const draftCount = basePool.filter((p) => p.status === 'DRAFT' || p.isDraft).length;
    const rejectedCount = basePool.filter((p) => p.status === 'REJECTED' && !p.isDraft).length;
    return { allCount, approvalCount, publicCount, outOfStockCount, draftCount, rejectedCount };
  }, [basePool]);

  // 2. Tab Filtering
  const tabFilteredProducts = useMemo(() => {
    return basePool.filter((p) => {
      const isDraft = p.status === 'DRAFT' || Boolean(p.isDraft);
      const isPending = p.status === 'PENDING_APPROVAL';
      const isRejected = !isDraft && p.status === 'REJECTED';
      const isOutOfStock = !isDraft && !isPending && !isRejected && p.stock === 0;
      const isPublic = !isDraft && !isPending && !isRejected && p.stock > 0;

      if (activeCatalogTab === 'APPROVAL') return isPending;
      if (activeCatalogTab === 'PUBLIC') return isPublic;
      if (activeCatalogTab === 'OUT_OF_STOCK') return isOutOfStock;
      if (activeCatalogTab === 'DRAFT') return isDraft;
      if (activeCatalogTab === 'REJECTED') return isRejected;
      return true; // 'ALL' shows all
    });
  }, [basePool, activeCatalogTab]);

  // 3. Search and Dropdown Filtering
  const filteredProducts = useMemo(() => {
    return tabFilteredProducts.filter((p) => {
      const q = searchQuery.trim().toLowerCase();
      const normCat = normalizeCategory(p.category);
      const matchesSearch =
        !q ||
        p.title.toLowerCase().includes(q) ||
        normCat.toLowerCase().includes(q) ||
        p.merchantName.toLowerCase().includes(q) ||
        p.merchantCode.toLowerCase().includes(q) ||
        p.fullSku.toLowerCase().includes(q) ||
        p.shortSku.toLowerCase().includes(q);

      const matchesMerchant = merchantFilter === 'ALL' || p.merchantCode === merchantFilter;
      const matchesCategory = categoryFilter === 'ALL' || normCat === categoryFilter;
      const matchesBin =
        binFilter === 'ALL' ||
        (binFilter === 'UNASSIGNED' && (!p.binCode || p.status === 'PENDING_APPROVAL')) ||
        (p.binCode && p.binCode === binFilter);

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

  const toggleSelect = (productId: string) => {
    setSelectedProductIds((prev) => {
      const next = new Set(prev);
      if (next.has(productId)) next.delete(productId);
      else next.add(productId);
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

  // Selected Products Analysis for Bulk Slotting
  const selectedProductsList = useMemo(() => {
    return products.filter((p) => selectedProductIds.has(p.id));
  }, [products, selectedProductIds]);

  const hasPendingApprovalSelected = useMemo(() => {
    return selectedProductsList.some((p) => p.status === 'PENDING_APPROVAL');
  }, [selectedProductsList]);

  const selectedPendingProducts = useMemo(() => {
    return selectedProductsList.filter((p) => p.status === 'PENDING_APPROVAL');
  }, [selectedProductsList]);

  // Execute Bulk Action
  const handleApplyBulkAction = () => {
    if (!bulkAction || selectedProductIds.size === 0) return;

    const ids = Array.from(selectedProductIds);

    if (bulkAction === 'APPROVE_SLOT') {
      if (selectedPendingProducts.length > 0) {
        setBulkSlotModalOpen(true);
      } else if (onBulkApproveProducts) {
        onBulkApproveProducts(ids);
        setSelectedProductIds(new Set());
        setBulkAction('');
      }
    } else if (bulkAction === 'REJECT') {
      onBulkRejectProducts?.(ids);
      setSelectedProductIds(new Set());
      setBulkAction('');
    } else if (bulkAction === 'DRAFT') {
      onBulkMoveToDraft?.(ids);
      setSelectedProductIds(new Set());
      setBulkAction('');
    } else if (bulkAction === 'RESTORE') {
      onBulkRestore?.(ids);
      setSelectedProductIds(new Set());
      setBulkAction('');
    } else if (bulkAction === 'DELETE') {
      setBulkDeleteModalOpen(true);
    }
  };

  // Confirm Bulk Slotting from Modal
  const handleConfirmBulkSlotting = (assignments: BulkSlotAssignment[]) => {
    if (onBulkApproveProductsWithSlots) {
      onBulkApproveProductsWithSlots(assignments);
    } else if (onBulkApproveProducts) {
      onBulkApproveProducts(assignments.map((a) => a.productId));
    }
    setSelectedProductIds(new Set());
    setBulkAction('');
    setBulkSlotModalOpen(false);
  };

  // Single Item Delete / Draft Actions
  const handleConfirmSingleDelete = () => {
    if (!productToDelete) return;
    const prodId = productToDelete.id;
    if (isPermanentDeleteMode) {
      if ((productToDelete.stock || 0) >= 1) {
        setProductToDelete(null);
        setIsPermanentDeleteMode(false);
        return;
      }
      if (onPermanentDelete) onPermanentDelete(prodId);
      else onDeleteProduct?.(prodId);
    } else {
      onMoveToDraft?.(prodId);
    }

    setSelectedProductIds((prev) => {
      const next = new Set(prev);
      next.delete(prodId);
      return next;
    });
    setProductToDelete(null);
    setIsPermanentDeleteMode(false);
  };

  const handleConfirmBulkDelete = () => {
    const ids = Array.from(selectedProductIds);
    if (onBulkPermanentDelete) onBulkPermanentDelete(ids);
    else onDeleteProducts?.(ids);
    setSelectedProductIds(new Set());
    setBulkDeleteModalOpen(false);
    setBulkAction('');
  };

  const handleResetFilters = () => {
    setSearchQuery('');
    setMerchantFilter(fixedMerchantCode || 'ALL');
    setCategoryFilter('ALL');
    setBinFilter('ALL');
    setActiveCatalogTab('ALL');
    setCurrentPage(1);
    setSelectedProductIds(new Set());
    setBulkAction('');
    onFilterTabChange?.('ALL');
  };

  const hasActiveFilters =
    searchQuery !== '' ||
    (!fixedMerchantCode && merchantFilter !== 'ALL') ||
    categoryFilter !== 'ALL' ||
    binFilter !== 'ALL' ||
    activeCatalogTab !== 'ALL';

  return (
    <div className="space-y-4">
      {/* Search and Filters Card: Clean 3-Tier Separated Rows (No Broken Wrapping) */}
      <div className="bg-white dark:bg-navy-900 border border-slate-200 dark:border-white/10 rounded-2xl p-5 shadow-sm space-y-4">
        {/* ROW 1: Dedicated Full-Width Spacious Search Bar */}
        <div className="w-full">
          <SearchInput
            value={searchQuery}
            onChange={(val) => {
              setSearchQuery(val);
              setCurrentPage(1);
            }}
            placeholder="Search by product name, merchant store, or SKU..."
            className="w-full"
          />
        </div>

        {/* ROW 2: Action Controls on Left, Filters on Right */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pt-1">
          {/* Left: Add Product Button + Bulk Action Selector + Apply Button */}
          <div className="flex items-center gap-2 flex-wrap">
            {onOpenAddProduct && (
              <button
                type="button"
                onClick={onOpenAddProduct}
                className="px-3.5 py-2 rounded-xl bg-orange-600 hover:bg-orange-500 text-white text-xs font-bold flex items-center gap-1.5 shadow-sm transition-all cursor-pointer active:scale-95"
              >
                <Plus className="w-3.5 h-3.5 pointer-events-none" />
                <span>Add Product</span>
              </button>
            )}

            <select
              value={bulkAction}
              onChange={(e) => setBulkAction(e.target.value)}
              aria-label="Bulk actions"
              className="px-3.5 py-2 rounded-xl bg-slate-50 dark:bg-navy-950 border border-slate-200 dark:border-white/10 text-xs font-semibold text-navy-800 dark:text-slate-100 focus:outline-none focus:border-orange-500 cursor-pointer shadow-2xs"
            >
              <option value="">Bulk Actions</option>

              {/* Dynamic options based on active tab & selection */}
              {activeCatalogTab === 'APPROVAL' || hasPendingApprovalSelected ? (
                <>
                  <option value="APPROVE_SLOT">Approve &amp; Slot to Bin</option>
                  <option value="REJECT">Reject Submissions</option>
                </>
              ) : activeCatalogTab === 'DRAFT' ? (
                <>
                  <option value="RESTORE">Send Selected for Approval</option>
                  <option value="DELETE">Permanent Delete</option>
                </>
              ) : (
                <>
                  <option value="DRAFT">Move to Draft</option>
                  <option value="DELETE">Delete Selected</option>
                  {hasPendingApprovalSelected && (
                    <option value="APPROVE_SLOT">Approve &amp; Slot to Bin</option>
                  )}
                </>
              )}
            </select>

            <button
              type="button"
              onClick={handleApplyBulkAction}
              disabled={!bulkAction || selectedProductIds.size === 0}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all border ${
                bulkAction && selectedProductIds.size > 0
                  ? 'bg-orange-600 hover:bg-orange-500 text-white border-orange-600 shadow-sm cursor-pointer active:scale-95'
                  : 'bg-slate-100 dark:bg-navy-800 text-slate-400 dark:text-slate-500 border-slate-200 dark:border-white/10 cursor-not-allowed opacity-60'
              }`}
            >
              Apply ({selectedProductIds.size})
            </button>
          </div>

          {/* Right: Secondary Filter Dropdowns & Reset Button */}
          <div className="flex flex-wrap items-center gap-2">
            {/* Merchant Filter: hidden if fixed to a single merchant */}
            {!fixedMerchantCode && !hideMerchantFilter && (
              <select
                value={merchantFilter}
                onChange={(e) => {
                  setMerchantFilter(e.target.value);
                  setCurrentPage(1);
                }}
                aria-label="Filter by Merchant"
                className="px-3 py-2 rounded-xl bg-slate-50 dark:bg-navy-950 border border-slate-200 dark:border-white/10 text-xs font-semibold text-navy-800 dark:text-slate-100 focus:outline-none focus:border-orange-500 cursor-pointer shadow-2xs"
              >
                <option value="ALL">All Merchants</option>
                {MERCHANTS.map((m) => (
                  <option key={m.code} value={m.code}>
                    {m.code} — {m.name}
                  </option>
                ))}
              </select>
            )}

            {/* Warehouse Bin Filter */}
            <select
              value={binFilter}
              onChange={(e) => {
                setBinFilter(e.target.value);
                setCurrentPage(1);
              }}
              aria-label="Filter by Bin Location"
              className="px-3 py-2 rounded-xl bg-slate-50 dark:bg-navy-950 border border-slate-200 dark:border-white/10 text-xs font-semibold text-navy-800 dark:text-slate-100 focus:outline-none focus:border-orange-500 cursor-pointer shadow-2xs"
            >
              <option value="ALL">All Bins</option>
              <option value="UNASSIGNED">Unassigned (Pending)</option>
              {bins.map((b) => (
                <option key={b.code} value={b.code}>
                  Bin {b.code} ({b.zone})
                </option>
              ))}
            </select>

            {/* Reset Filters */}
            {hasActiveFilters && (
              <button
                type="button"
                onClick={handleResetFilters}
                title="Reset active filters"
                className="px-3 py-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer bg-slate-100 dark:bg-navy-800 hover:bg-slate-200 dark:hover:bg-navy-700 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-white/10 shadow-2xs active:scale-95"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Reset</span>
              </button>
            )}
          </div>
        </div>

        {/* ROW 3: Status Filter Tabs (All | Product Approval | Public | Out of Stock | Draft) */}
        <div className="flex flex-wrap items-center gap-2 pt-3 border-t border-slate-100 dark:border-white/5 text-xs">
          <button
            type="button"
            onClick={() => handleTabSwitch('ALL')}
            className={`cursor-pointer transition-colors px-2.5 py-1 rounded-lg ${
              activeCatalogTab === 'ALL'
                ? 'bg-orange-50 dark:bg-orange-950/40 text-orange-600 dark:text-orange-400 font-bold border border-orange-500/20'
                : 'text-slate-600 dark:text-slate-400 hover:text-navy-900 dark:hover:text-white font-medium'
            }`}
          >
            All Products <span className="font-semibold tabular-nums">({catalogCounts.allCount})</span>
          </button>
          <span className="text-slate-300 dark:text-slate-700">|</span>

          <button
            type="button"
            onClick={() => handleTabSwitch('APPROVAL')}
            className={`cursor-pointer transition-colors px-2.5 py-1 rounded-lg flex items-center gap-1.5 ${
              activeCatalogTab === 'APPROVAL'
                ? 'bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 font-bold border border-amber-500/30'
                : 'text-slate-600 dark:text-slate-400 hover:text-navy-900 dark:hover:text-white font-medium'
            }`}
          >
            <span>Pending Product</span>
            <span
              className={`px-1.5 py-0.2 rounded-full text-[11px] font-bold tabular-nums ${
                catalogCounts.approvalCount > 0
                  ? 'bg-amber-500 text-slate-950 font-bold'
                  : 'text-slate-400 dark:text-slate-500'
              }`}
            >
              {catalogCounts.approvalCount}
            </span>
          </button>
          <span className="text-slate-300 dark:text-slate-700">|</span>

          <button
            type="button"
            onClick={() => handleTabSwitch('PUBLIC')}
            className={`cursor-pointer transition-colors px-2.5 py-1 rounded-lg ${
              activeCatalogTab === 'PUBLIC'
                ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 font-bold border border-emerald-500/20'
                : 'text-slate-600 dark:text-slate-400 hover:text-navy-900 dark:hover:text-white font-medium'
            }`}
          >
            Published <span className="font-semibold tabular-nums">({catalogCounts.publicCount})</span>
          </button>
          <span className="text-slate-300 dark:text-slate-700">|</span>

          <button
            type="button"
            onClick={() => handleTabSwitch('OUT_OF_STOCK')}
            className={`cursor-pointer transition-colors px-2.5 py-1 rounded-lg ${
              activeCatalogTab === 'OUT_OF_STOCK'
                ? 'bg-sky-50 dark:bg-sky-950/40 text-sky-700 dark:text-sky-300 font-bold border border-sky-500/20'
                : 'text-slate-600 dark:text-slate-400 hover:text-navy-900 dark:hover:text-white font-medium'
            }`}
          >
            Out of Stock <span className="font-semibold tabular-nums">({catalogCounts.outOfStockCount})</span>
          </button>
          <span className="text-slate-300 dark:text-slate-700">|</span>

          <button
            type="button"
            onClick={() => handleTabSwitch('DRAFT')}
            className={`cursor-pointer transition-colors px-2.5 py-1 rounded-lg ${
              activeCatalogTab === 'DRAFT'
                ? 'bg-slate-100 dark:bg-navy-800 text-slate-800 dark:text-slate-200 font-bold border border-slate-300 dark:border-white/20'
                : 'text-slate-600 dark:text-slate-400 hover:text-navy-900 dark:hover:text-white font-medium'
            }`}
          >
            Draft <span className="font-semibold tabular-nums">({catalogCounts.draftCount})</span>
          </button>
          <span className="text-slate-300 dark:text-slate-700">|</span>

          <button
            type="button"
            onClick={() => handleTabSwitch('REJECTED')}
            className={`cursor-pointer transition-colors px-2.5 py-1 rounded-lg flex items-center gap-1.5 ${
              activeCatalogTab === 'REJECTED'
                ? 'bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 font-bold border border-rose-500/30'
                : 'text-slate-600 dark:text-slate-400 hover:text-navy-900 dark:hover:text-white font-medium'
            }`}
          >
            <span>Rejected</span>
            <span
              className={`px-1.5 py-0.2 rounded-full text-[11px] font-bold tabular-nums ${
                catalogCounts.rejectedCount > 0
                  ? 'bg-rose-500/15 text-rose-600 dark:text-rose-400 font-bold'
                  : 'text-slate-400 dark:text-slate-500'
              }`}
            >
              {catalogCounts.rejectedCount}
            </span>
          </button>
        </div>
      </div>

      {/* Main Master Products Table Card */}
      <div className="bg-white dark:bg-navy-900 border border-slate-200 dark:border-white/10 rounded-2xl shadow-sm overflow-hidden">
        {/* Table Top Header: Item Count & Rows Per Page */}
        <div className="p-4 border-b border-slate-200 dark:border-white/10 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="text-slate-600 dark:text-slate-400 font-medium">
            Showing{' '}
            <span className="font-bold text-navy-900 dark:text-white">
              {totalItems > 0 ? startIndex + 1 : 0}
            </span>{' '}
            to{' '}
            <span className="font-bold text-navy-900 dark:text-white">
              {Math.min(startIndex + pageSize, totalItems)}
            </span>{' '}
            of{' '}
            <span className="font-bold text-navy-900 dark:text-white tabular-nums">
              {totalItems}
            </span>{' '}
            products
          </div>

          <div className="flex items-center gap-1.5">
            <span className="text-slate-500 dark:text-slate-400 font-medium">Show</span>
            <select
              value={pageSize}
              onChange={(e) => handlePageSizeChange(Number(e.target.value))}
              aria-label="Rows per page"
              className="px-2 py-1 rounded-lg bg-white dark:bg-navy-900 border border-slate-200 dark:border-white/10 text-xs font-semibold text-navy-800 dark:text-slate-100 focus:outline-none focus:border-orange-500 cursor-pointer shadow-2xs"
            >
              <option value={10}>10</option>
              <option value={25}>25</option>
              <option value={50}>50</option>
              <option value={100}>100</option>
            </select>
            <span className="text-slate-500 dark:text-slate-400 font-medium">rows</span>
          </div>
        </div>

        {/* Desktop Table View */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-200 dark:border-white/10 text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider bg-slate-50/80 dark:bg-navy-950/80">
                {/* 1. Selection Checkbox */}
                <th className="py-3.5 pl-4 pr-2 w-10 text-left align-middle">
                  <input
                    type="checkbox"
                    checked={isAllPageSelected}
                    onChange={toggleSelectAllPage}
                    aria-label="Select all on this page"
                    className="w-4 h-4 rounded bg-slate-50 dark:bg-navy-950 border-slate-300 dark:border-white/15 text-orange-600 focus:ring-orange-500 cursor-pointer accent-orange-500"
                  />
                </th>

                {/* 2. Product Name, Thumbnail & Date */}
                <th className="py-3.5 px-3 text-left align-middle">Product</th>

                {/* 3. Merchant (Name & Code) */}
                <th className="py-3.5 px-3 text-left align-middle">Merchant</th>

                {/* 4. Warehouse Bin (Public items have bin; pending approval items have no bin) */}
                <th className="py-3.5 px-3 text-left align-middle">Warehouse Bin</th>

                {/* 5. Stock Level */}
                <th className="py-3.5 px-3 text-left align-middle">Stock Level</th>

                {/* 6. Declare Price */}
                <th className="py-3.5 px-3 text-left align-middle">Declare Price</th>

                {/* 7. Status */}
                <th className="py-3.5 px-3 text-left align-middle">Status</th>

                {/* 8. Actions */}
                <th className="py-3.5 px-4 text-right align-middle">Actions</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-100 dark:divide-white/5 text-xs text-navy-800 dark:text-slate-200">
              {paginatedProducts.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-14 text-center text-slate-600 dark:text-slate-400">
                    <Package className="w-10 h-10 text-slate-400 dark:text-slate-500 mx-auto mb-2 opacity-60" />
                    <p className="text-sm font-semibold text-navy-900 dark:text-white">
                      No products found
                    </p>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                      Try switching filter tabs or resetting search filters
                    </p>
                  </td>
                </tr>
              ) : (
                paginatedProducts.map((p, idx) => {
                  const isSelected = selectedProductIds.has(p.id);
                  const isMenuOpen = activeMenuId === `desktop-${p.id}`;
                  const isNearBottom = paginatedProducts.length > 4 && idx >= paginatedProducts.length - 2;

                  const isDraft = p.status === 'DRAFT' || Boolean(p.isDraft);
                  const isPending = p.status === 'PENDING_APPROVAL';
                  const isRejected = !isDraft && p.status === 'REJECTED';
                  const isOutOfStock = !isDraft && !isPending && !isRejected && (p.stock || 0) === 0;
                  const isLowStock = !isDraft && !isPending && !isRejected && !isOutOfStock && p.stock > 0 && p.stock < 30;

                  return (
                    <tr
                      key={p.id}
                      className={`hover:bg-slate-50/70 dark:hover:bg-navy-800/40 transition-colors ${
                        isSelected ? 'bg-orange-50/50 dark:bg-orange-950/15' : ''
                      }`}
                    >
                      {/* 1. Checkbox */}
                      <td className="py-3.5 pl-4 pr-2 w-10 align-middle" onClick={(e) => e.stopPropagation()}>
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => toggleSelect(p.id)}
                          aria-label={`Select ${p.title}`}
                          className="w-4 h-4 rounded bg-slate-50 dark:bg-navy-950 border-slate-300 dark:border-white/15 text-orange-600 focus:ring-orange-500 cursor-pointer accent-orange-500"
                        />
                      </td>

                      {/* 2. Product Name, Thumbnail & Category with Date */}
                      <td className="py-3.5 px-3 align-middle">
                        <div className="flex items-center gap-3">
                          <Link href={`/admin/products/${p.id}`} className="shrink-0 group">
                            {p.imageUrl ? (
                              <img
                                src={p.imageUrl}
                                alt={p.title}
                                className="w-11 h-11 rounded-xl object-cover border border-slate-200 dark:border-white/10 group-hover:border-orange-500 transition-colors"
                              />
                            ) : (
                              <div className="w-11 h-11 rounded-xl bg-slate-100 dark:bg-navy-950 border border-slate-200 dark:border-white/10 group-hover:border-orange-500 transition-colors flex items-center justify-center">
                                <Package className="w-5 h-5 text-slate-400 dark:text-slate-600" />
                              </div>
                            )}
                          </Link>
                          <div className="min-w-0 max-w-xs lg:max-w-md">
                            <Link
                              href={`/admin/products/${p.id}`}
                              className="font-bold text-navy-900 dark:text-white text-sm leading-snug line-clamp-2 hover:text-orange-600 dark:hover:text-orange-400 hover:underline transition-colors block cursor-pointer"
                              title="Click to view product details"
                            >
                              {p.title}
                            </Link>
                            <div className="flex items-center gap-2 mt-1 flex-wrap text-xs">
                              <span className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-1 font-medium">
                                <Clock className="w-3 h-3 text-slate-400 shrink-0" />
                                <span>{p.submittedAt || 'Recently added'}</span>
                              </span>
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* 3. Merchant (Name & Code linked to Merchant Profile) */}
                      <td className="py-3.5 px-3 align-middle">
                        <div className="text-xs">
                          <Link
                            href={`/admin/merchants/${getMerchantProfileId(p.merchantCode)}`}
                            className="font-bold text-navy-900 dark:text-white hover:text-orange-600 dark:hover:text-orange-400 transition-colors block"
                          >
                            {p.merchantName}
                          </Link>
                          <span className="font-mono text-[11px] text-slate-500 dark:text-slate-400 block mt-0.5 font-semibold">
                            {p.merchantCode}
                          </span>
                        </div>
                      </td>

                      {/* 4. Warehouse Bin (Public items show bin; new pending approval items show Unassigned) */}
                      <td className="py-3.5 px-3 align-middle" onClick={(e) => e.stopPropagation()}>
                        {isPending && p.stockAccepted !== true ? (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold bg-amber-500/10 text-amber-700 dark:text-amber-300 border border-dashed border-amber-500/40">
                            <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                            Unassigned
                          </span>
                        ) : (
                          <div className="inline-block">
                            <select
                              value={p.binCode && p.binCode !== 'Pending Approval' ? p.binCode : bins[0]?.code || 'A-01-02'}
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
                        )}
                      </td>

                      {/* 5. Stock Level */}
                      <td className="py-3.5 px-3 align-middle">
                        {isPending ? (
                          p.stockAccepted === true ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold tabular-nums bg-indigo-500/10 text-indigo-700 dark:text-indigo-300 border border-indigo-500/30">
                              {p.stock} <span className="text-[11px] font-normal">pcs</span>
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold tabular-nums bg-amber-500/10 text-amber-700 dark:text-amber-300 border border-amber-500/30">
                              {p.stock} <span className="text-[11px] font-normal">pcs</span>
                            </span>
                          )
                        ) : p.isSuspended ? (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-rose-500/15 text-rose-700 dark:text-rose-300 border border-rose-500/30">
                            <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
                            Suspended
                          </span>
                        ) : isOutOfStock ? (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold tabular-nums bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/30">
                            0 <span className="text-[11px] font-normal text-rose-500">pcs</span>
                          </span>
                        ) : (
                          <span
                            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold tabular-nums border ${
                              isLowStock
                                ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30'
                                : 'bg-slate-100 dark:bg-navy-950 text-navy-900 dark:text-white border-slate-200 dark:border-white/10'
                            }`}
                          >
                            {p.stock} <span className="text-[11px] font-normal text-slate-500">pcs</span>
                          </span>
                        )}
                      </td>

                      {/* 6. Unit Price */}
                      <td className="py-3.5 px-3 tabular-nums text-xs font-bold text-navy-800 dark:text-slate-100 align-middle">
                        ৳{p.price ? p.price.toLocaleString() : '—'}
                      </td>

                      {/* 7. Status Column */}
                      <td className="py-3.5 px-3 align-middle">
                        {isPending ? (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-amber-500/15 text-amber-700 dark:text-amber-300 border border-amber-500/30">
                            <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                            Pending
                          </span>
                        ) : isRejected ? (
                          <div className="space-y-1 max-w-[200px]">
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-rose-500/15 text-rose-700 dark:text-rose-300 border border-rose-500/30">
                              <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
                              Rejected
                            </span>
                            {p.rejectionReason && (
                              <p
                                className="text-[11px] text-rose-600 dark:text-rose-400 line-clamp-2 leading-tight"
                                title={p.rejectionReason}
                              >
                                {p.rejectionReason}
                              </p>
                            )}
                          </div>
                        ) : isDraft ? (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-slate-500/15 text-slate-700 dark:text-slate-300 border border-slate-500/30">
                            <span className="w-1.5 h-1.5 rounded-full bg-slate-400" />
                            Draft
                          </span>
                        ) : p.isSuspended ? (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-rose-500/15 text-rose-700 dark:text-rose-300 border border-rose-500/30">
                            <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
                            Suspended
                          </span>
                        ) : isOutOfStock ? (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-rose-500/15 text-rose-700 dark:text-rose-300 border border-rose-500/30">
                            <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
                            Out of Stock
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                            Published
                          </span>
                        )}
                      </td>

                      {/* 8. Actions Dropdown */}
                      <td className="py-3.5 px-4 text-right align-middle">
                        <div
                          className="relative inline-flex items-center justify-end text-left align-middle"
                          data-dropdown-container
                        >
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
                            <div
                              className={`absolute right-0 ${
                                isNearBottom
                                  ? 'top-0 -translate-y-full -mt-1.5'
                                  : 'top-full mt-1.5'
                              } w-56 rounded-xl bg-white dark:bg-navy-900 border border-slate-200 dark:border-white/10 shadow-2xl py-1.5 z-[100] text-left font-sans text-xs pointer-events-auto`}
                            >
                              {/* STAGE 0: Pending Product -> Approved, Reject, and View */}
                              {isPending && (
                                <>
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setActiveMenuId(null);
                                      onOpenApprovalModal?.(
                                        'APPROVE',
                                        p,
                                        p.binCode && p.binCode !== 'Pending Approval' && p.binCode !== 'Assigned on intake'
                                          ? p.binCode
                                          : bins[0]?.code || 'A-01-02'
                                      );
                                    }}
                                    className="w-full px-3.5 py-2 text-left text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/30 flex items-center gap-2.5 font-bold cursor-pointer"
                                  >
                                    <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600 dark:text-emerald-400" />
                                    <span>Approved</span>
                                  </button>

                                  <button
                                    type="button"
                                    onClick={() => {
                                      setActiveMenuId(null);
                                      onOpenApprovalModal?.(
                                        'REJECT',
                                        p,
                                        p.binCode && p.binCode !== 'Pending Approval'
                                          ? p.binCode
                                          : bins[0]?.code || 'A-01-02'
                                        );
                                    }}
                                    className="w-full px-3.5 py-2 text-left text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30 flex items-center gap-2.5 font-semibold cursor-pointer border-b border-slate-200/60 dark:border-white/10"
                                  >
                                    <XCircle className="w-4 h-4 shrink-0 text-rose-600 dark:text-rose-400" />
                                    <span>Reject</span>
                                  </button>

                                  <Link
                                    href={`/admin/products/${p.id}`}
                                    onClick={() => setActiveMenuId(null)}
                                    className="w-full px-3.5 py-2 text-left text-orange-600 dark:text-orange-400 hover:bg-slate-100 dark:hover:bg-navy-800 flex items-center gap-2.5 font-bold cursor-pointer"
                                  >
                                    <Eye className="w-4 h-4 shrink-0" />
                                    <span>View</span>
                                  </Link>
                                </>
                              )}

                              {/* STAGE 2: Published / Out of Stock -> View, Allow Edit, Approve/Reject Revision, Suspend/Reactivate, and Delete (if stock is 0) */}
                              {!isPending && !isDraft && !isRejected && (
                                <>
                                  {p.editState === 'EDIT_ACCESS_REQUESTED' && (
                                    <button
                                      type="button"
                                      onClick={() => {
                                        setActiveMenuId(null);
                                        onAllowEdit?.(p.id);
                                      }}
                                      className="w-full px-3.5 py-2 text-left text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/30 flex items-center gap-2.5 font-bold cursor-pointer"
                                    >
                                      <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-500" />
                                      <span>Allow Edit</span>
                                    </button>
                                  )}

                                  {p.editState === 'EDIT_APPROVAL_PENDING' && (
                                    <>
                                      <button
                                        type="button"
                                        onClick={() => {
                                          setActiveMenuId(null);
                                          onApproveRevision?.(p.id);
                                        }}
                                        className="w-full px-3.5 py-2 text-left text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/30 flex items-center gap-2.5 font-bold cursor-pointer"
                                      >
                                        <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-500" />
                                        <span>Approve Revision</span>
                                      </button>
                                      <button
                                        type="button"
                                        onClick={() => {
                                          setActiveMenuId(null);
                                          onRejectRevision?.(p.id);
                                        }}
                                        className="w-full px-3.5 py-2 text-left text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30 flex items-center gap-2.5 font-semibold cursor-pointer"
                                      >
                                        <XCircle className="w-4 h-4 shrink-0 text-rose-500" />
                                        <span>Reject Revision</span>
                                      </button>
                                    </>
                                  )}

                                  <Link
                                    href={`/admin/products/${p.id}`}
                                    onClick={() => setActiveMenuId(null)}
                                    className="w-full px-3.5 py-2 text-left text-orange-600 dark:text-orange-400 hover:bg-slate-100 dark:hover:bg-navy-800 flex items-center gap-2.5 font-bold cursor-pointer"
                                  >
                                    <Eye className="w-4 h-4 shrink-0" />
                                    <span>View</span>
                                  </Link>

                                  <button
                                    type="button"
                                    onClick={() => {
                                      setActiveMenuId(null);
                                      onToggleSuspend?.(p.id);
                                    }}
                                    className="w-full px-3.5 py-2 text-left text-amber-600 dark:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-950/30 flex items-center gap-2.5 font-semibold cursor-pointer"
                                  >
                                    <AlertTriangle className="w-4 h-4 shrink-0" />
                                    <span>{p.isSuspended ? 'Reactivate Product' : 'Suspend Product'}</span>
                                  </button>

                                  <button
                                    type="button"
                                    onClick={() => {
                                      if ((p.stock || 0) === 0) {
                                        setActiveMenuId(null);
                                        setProductToDelete(p);
                                        setIsPermanentDeleteMode(true);
                                      }
                                    }}
                                    disabled={(p.stock || 0) > 0}
                                    className={`w-full px-3.5 py-2 text-left flex items-center gap-2.5 font-semibold transition-colors border-t border-slate-200/60 dark:border-white/10 ${
                                      (p.stock || 0) === 0
                                        ? 'text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30 cursor-pointer'
                                        : 'text-slate-400 dark:text-slate-500 cursor-not-allowed'
                                    }`}
                                    title={(p.stock || 0) > 0 ? `Cannot delete while warehouse stock holds ${p.stock} pcs` : 'Delete Product'}
                                  >
                                    <Trash2 className="w-4 h-4 shrink-0" />
                                    <span>{(p.stock || 0) > 0 ? `Delete Locked (${p.stock} pcs)` : 'Delete Product'}</span>
                                  </button>
                                </>
                              )}

                              {/* STAGE 3: Draft / Rejected -> View and Delete (strictly only if stock is 0) */}
                              {(isDraft || isRejected) && (
                                <>
                                  <Link
                                    href={`/admin/products/${p.id}`}
                                    onClick={() => setActiveMenuId(null)}
                                    className="w-full px-3.5 py-2 text-left text-orange-600 dark:text-orange-400 hover:bg-slate-100 dark:hover:bg-navy-800 flex items-center gap-2.5 font-bold cursor-pointer"
                                  >
                                    <Eye className="w-4 h-4 shrink-0" />
                                    <span>View</span>
                                  </Link>

                                  <button
                                    type="button"
                                    onClick={() => {
                                      if ((p.stock || 0) >= 1) return;
                                      setActiveMenuId(null);
                                      setProductToDelete(p);
                                      setIsPermanentDeleteMode(true);
                                    }}
                                    disabled={(p.stock || 0) >= 1}
                                    className={`w-full px-3.5 py-2 text-left flex items-center gap-2.5 font-semibold border-t border-slate-200/60 dark:border-white/10 ${
                                      (p.stock || 0) >= 1
                                        ? 'text-slate-400 dark:text-slate-500 cursor-not-allowed opacity-60'
                                        : 'text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30 cursor-pointer'
                                    }`}
                                    title={
                                      (p.stock || 0) >= 1
                                        ? `Cannot delete while warehouse stock (${p.stock} pcs) > 0`
                                        : 'Delete Product'
                                    }
                                  >
                                    <Trash2 className="w-4 h-4 shrink-0" />
                                    <span>
                                      {(p.stock || 0) >= 1
                                        ? `Delete Locked (${p.stock} pcs)`
                                        : 'Delete Product'}
                                    </span>
                                  </button>
                                </>
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

        {/* Mobile View */}
        <div className="block md:hidden p-3 space-y-3">
          {paginatedProducts.length === 0 ? (
            <div className="py-12 text-center text-slate-600 dark:text-slate-400">
              <Package className="w-10 h-10 text-slate-400 dark:text-slate-500 mx-auto mb-2 opacity-60" />
              <p className="text-sm font-semibold text-navy-900 dark:text-white">
                No products found
              </p>
            </div>
          ) : (
            paginatedProducts.map((p) => {
              const isSelected = selectedProductIds.has(p.id);
              const isPending = p.status === 'PENDING_APPROVAL';
              const isDraft = p.status === 'DRAFT' || Boolean(p.isDraft);
              const isRejected = !isDraft && p.status === 'REJECTED';
              const isOutOfStock = !isDraft && !isPending && !isRejected && p.stock === 0;

              return (
                <div
                  key={p.id}
                  className={`p-3.5 rounded-xl border transition-all ${
                    isSelected
                      ? 'border-orange-500 bg-orange-50/40 dark:bg-orange-950/20'
                      : 'border-slate-200 dark:border-white/10 bg-white dark:bg-navy-950'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => toggleSelect(p.id)}
                      aria-label={`Select ${p.title}`}
                      className="mt-1 w-4 h-4 rounded bg-slate-50 dark:bg-navy-950 border-slate-300 dark:border-white/15 text-orange-600 focus:ring-orange-500 cursor-pointer accent-orange-500"
                    />

                    {p.imageUrl ? (
                      <img
                        src={p.imageUrl}
                        alt={p.title}
                        className="w-12 h-12 rounded-xl object-cover border border-slate-200 dark:border-white/10 shrink-0"
                      />
                    ) : (
                      <div className="w-12 h-12 rounded-xl bg-slate-100 dark:bg-navy-950 border border-slate-200 dark:border-white/10 shrink-0 flex items-center justify-center">
                        <Package className="w-5 h-5 text-slate-400 dark:text-slate-600" />
                      </div>
                    )}

                    <div className="min-w-0 flex-1">
                      <Link
                        href={`/admin/products/${p.id}`}
                        className="font-bold text-navy-900 dark:text-white text-sm line-clamp-2 hover:text-orange-600 transition-colors"
                      >
                        {p.title}
                      </Link>

                      <div className="flex items-center gap-2 mt-1 flex-wrap text-xs">
                        <span className="text-[10px] text-slate-500 flex items-center gap-1">
                          <Clock className="w-2.5 h-2.5" />
                          {p.submittedAt}
                        </span>
                      </div>

                      <div className="mt-2 text-xs flex items-center justify-between gap-2">
                        <span className="text-slate-600 dark:text-slate-400">
                          {p.merchantName} ({p.merchantCode})
                        </span>
                        <span className="font-bold text-navy-900 dark:text-white tabular-nums">
                          ৳{p.price ? p.price.toLocaleString() : '—'}
                        </span>
                      </div>

                      <div className="mt-2 pt-2 border-t border-slate-100 dark:border-white/5 flex items-center justify-between gap-2">
                        <span className="text-xs font-semibold">
                          Stock: {p.stock} pcs
                        </span>
                        <div>
                          {isPending ? (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/15 text-amber-700 dark:text-amber-300">
                              Pending Approval
                            </span>
                          ) : isRejected ? (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-500/15 text-rose-700 dark:text-rose-300">
                              Rejected
                            </span>
                          ) : isDraft ? (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-500/15 text-slate-700 dark:text-slate-300">
                              Draft
                            </span>
                          ) : p.isSuspended ? (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-rose-500/15 text-rose-700 dark:text-rose-300 border border-rose-500/30">
                            <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
                            Suspended
                          </span>
                        ) : isOutOfStock ? (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-sky-500/15 text-sky-700 dark:text-sky-400">
                              Approved
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/15 text-emerald-700 dark:text-emerald-300">
                              Stock Stored ({p.stock})
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Pagination Bar */}
        <div className="p-4 border-t border-slate-200 dark:border-white/10 flex items-center justify-between gap-3 text-xs bg-slate-50/50 dark:bg-navy-950/50">
          <div className="text-slate-500 dark:text-slate-400">
            Page {safePage} of {totalPages}
          </div>

          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => handlePageChange(safePage - 1)}
              disabled={safePage <= 1}
              className={`p-2 rounded-lg border text-xs font-semibold transition-all ${
                safePage <= 1
                  ? 'border-slate-200 dark:border-white/10 text-slate-400 cursor-not-allowed opacity-50'
                  : 'border-slate-300 dark:border-white/20 hover:bg-slate-100 dark:hover:bg-navy-800 text-navy-900 dark:text-white cursor-pointer'
              }`}
            >
              <ChevronLeft className="w-4 h-4" />
            </button>

            {Array.from({ length: totalPages }, (_, i) => i + 1)
              .filter((p) => p === 1 || p === totalPages || Math.abs(p - safePage) <= 1)
              .map((p, idx, arr) => (
                <React.Fragment key={p}>
                  {idx > 0 && arr[idx - 1] !== p - 1 && (
                    <span className="px-1 text-slate-400">...</span>
                  )}
                  <button
                    type="button"
                    onClick={() => handlePageChange(p)}
                    className={`w-7 h-7 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                      p === safePage
                        ? 'bg-orange-600 text-white shadow-sm'
                        : 'hover:bg-slate-100 dark:hover:bg-navy-800 text-navy-800 dark:text-slate-200'
                    }`}
                  >
                    {p}
                  </button>
                </React.Fragment>
              ))}

            <button
              type="button"
              onClick={() => handlePageChange(safePage + 1)}
              disabled={safePage >= totalPages}
              className={`p-2 rounded-lg border text-xs font-semibold transition-all ${
                safePage >= totalPages
                  ? 'border-slate-200 dark:border-white/10 text-slate-400 cursor-not-allowed opacity-50'
                  : 'border-slate-300 dark:border-white/20 hover:bg-slate-100 dark:hover:bg-navy-800 text-navy-900 dark:text-white cursor-pointer'
              }`}
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Bulk Approval & Bin Slotting Modal with Individual Bin Selectors */}
      <BulkApprovalModal
        isOpen={bulkSlotModalOpen}
        onClose={() => setBulkSlotModalOpen(false)}
        products={selectedPendingProducts}
        bins={bins}
        onConfirm={handleConfirmBulkSlotting}
      />

      {/* Delete / Move to Draft Single Confirmation Modal */}
      <Modal
        isOpen={Boolean(productToDelete)}
        onClose={() => setProductToDelete(null)}
        title={
          isPermanentDeleteMode && (productToDelete?.stock || 0) >= 1
            ? 'Deletion Blocked — Warehouse Stock Exists'
            : isPermanentDeleteMode
              ? 'Permanently Delete Product?'
              : 'Move Product to Draft?'
        }
      >
        <div className="space-y-4">
          <p className="text-sm text-slate-600 dark:text-slate-300">
            {isPermanentDeleteMode && (productToDelete?.stock || 0) >= 1 ? (
              <>
                Cannot delete{' '}
                <strong className="text-navy-900 dark:text-white">
                  &quot;{productToDelete?.title}&quot;
                </strong>{' '}
                because the warehouse currently holds{' '}
                <strong className="text-rose-600 dark:text-rose-400">
                  {productToDelete?.stock} pcs
                </strong>{' '}
                in stock. Even if 1 single unit exists in the warehouse, the product cannot be deleted. Product stock must be 0 before deleting.
              </>
            ) : isPermanentDeleteMode ? (
              <>
                Are you sure you want to permanently delete{' '}
                <strong className="text-navy-900 dark:text-white">
                  &quot;{productToDelete?.title}&quot;
                </strong>{' '}
                (0 stock in warehouse)? This will permanently delete it from the PostgreSQL database.
              </>
            ) : (
              <>
                Move{' '}
                <strong className="text-navy-900 dark:text-white">
                  &quot;{productToDelete?.title}&quot;
                </strong>{' '}
                to Draft? It will no longer be visible on storefronts until restored.
              </>
            )}
          </p>

          <div className="flex justify-end gap-2.5 pt-2">
            <button
              type="button"
              onClick={() => setProductToDelete(null)}
              className="px-4 py-2 rounded-xl text-xs font-semibold border border-slate-200 dark:border-white/10 hover:bg-slate-100 dark:hover:bg-navy-800 text-slate-700 dark:text-slate-300 cursor-pointer"
            >
              {isPermanentDeleteMode && (productToDelete?.stock || 0) >= 1 ? 'Close' : 'Cancel'}
            </button>
            {(!isPermanentDeleteMode || (productToDelete?.stock || 0) === 0) && (
              <button
                type="button"
                onClick={handleConfirmSingleDelete}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-rose-600 hover:bg-rose-500 text-white cursor-pointer shadow-sm"
              >
                {isPermanentDeleteMode ? 'Delete Forever' : 'Move to Draft'}
              </button>
            )}
          </div>
        </div>
      </Modal>

      {/* Bulk Delete Modal */}
      <Modal
        isOpen={bulkDeleteModalOpen}
        onClose={() => setBulkDeleteModalOpen(false)}
        title="Confirm Bulk Action"
      >
        <div className="space-y-4">
          <p className="text-sm text-slate-600 dark:text-slate-300">
            Are you sure you want to delete or move{' '}
            <strong className="text-navy-900 dark:text-white">
              {selectedProductIds.size} selected item(s)
            </strong>
            ?
          </p>

          <div className="flex justify-end gap-2.5 pt-2">
            <button
              type="button"
              onClick={() => setBulkDeleteModalOpen(false)}
              className="px-4 py-2 rounded-xl text-xs font-semibold border border-slate-200 dark:border-white/10 hover:bg-slate-100 dark:hover:bg-navy-800 text-slate-700 dark:text-slate-300 cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleConfirmBulkDelete}
              className="px-4 py-2 rounded-xl text-xs font-bold bg-rose-600 hover:bg-rose-500 text-white cursor-pointer shadow-sm"
            >
              Confirm
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
