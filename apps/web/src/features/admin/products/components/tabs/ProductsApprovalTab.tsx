'use client';

import React, { useState, useMemo, useEffect } from 'react';
import {
  Sparkles,
  Truck,
  PlusCircle,
  BellRing,
  CheckCircle2,
  XCircle,
  Eye,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  AlertTriangle,
  RotateCcw,
  Store,
  MapPin,
  Tag,
  ArrowRight,
  Package,
  PackageMinus,
  Check,
} from 'lucide-react';
import { SearchInput } from '@/components/ui';
import { Modal } from '@/components/admin/AdminModal';
import {
  InboundStockReplenishment,
  StockWithdrawalRequest,
  UnifiedApprovalItem,
  WarehouseBin,
  WarehouseProductItem,
} from '../../types';
import { RestockIntakeModal } from '../modals/RestockIntakeModal';
import { SendRestockNoticeModal } from '../modals/SendRestockNoticeModal';
import { ManualRestockModal } from '../modals/ManualRestockModal';
import { ConfirmWithdrawalModal } from '../modals/ConfirmWithdrawalModal';
import { ManualWithdrawalModal } from '../modals/ManualWithdrawalModal';
import { ApprovalItemDetailsModal } from '../modals/ApprovalItemDetailsModal';

interface ProductsApprovalTabProps {
  products: WarehouseProductItem[];
  bins: WarehouseBin[];
  stockReplenishments: InboundStockReplenishment[];
  stockWithdrawals?: StockWithdrawalRequest[];
  onOpenApprovalModal: (
    mode: 'APPROVE' | 'REJECT',
    product: WarehouseProductItem,
    selectedBin: string
  ) => void;
  onApproveReplenishment: (
    replenishment: InboundStockReplenishment,
    finalQty: number,
    targetBin: string
  ) => void;
  onRejectReplenishment: (
    replenishment: InboundStockReplenishment,
    reason?: string
  ) => void;
  onApproveWithdrawal?: (
    withdrawal: StockWithdrawalRequest,
    verifiedQty: number,
    dispatchNote?: string
  ) => void;
  onRejectWithdrawal?: (
    withdrawal: StockWithdrawalRequest,
    reason?: string
  ) => void;
  onBulkApproveUnified?: (items: UnifiedApprovalItem[]) => void;
  onBulkRejectUnified?: (items: UnifiedApprovalItem[]) => void;
  onSendRestockNotice?: (productId: string, suggestedQty: number, note?: string) => void;
  onRecordManualRestock?: (
    productId: string,
    quantity: number,
    binCode: string,
    note?: string
  ) => void;
  onRecordManualWithdrawal?: (
    productId: string,
    quantity: number,
    reason?: string
  ) => void;
  onSwitchToAllTab: () => void;
}

export function ProductsApprovalTab({
  products,
  bins,
  stockReplenishments,
  stockWithdrawals = [],
  onOpenApprovalModal,
  onApproveReplenishment,
  onRejectReplenishment,
  onApproveWithdrawal,
  onRejectWithdrawal,
  onBulkApproveUnified,
  onBulkRejectUnified,
  onSendRestockNotice,
  onRecordManualRestock,
  onRecordManualWithdrawal,
  onSwitchToAllTab,
}: ProductsApprovalTabProps) {
  // 1. Separate pending subsets
  const pendingProducts = useMemo(
    () => products.filter((p) => p.status === 'PENDING_APPROVAL'),
    [products]
  );

  const pendingReplenishments = useMemo(
    () => stockReplenishments.filter((r) => r.status === 'PENDING_APPROVAL'),
    [stockReplenishments]
  );

  const pendingWithdrawals = useMemo(
    () => stockWithdrawals.filter((w) => w.status === 'PENDING_APPROVAL'),
    [stockWithdrawals]
  );

  // 2. Build Unified Requests list
  const unifiedItems: UnifiedApprovalItem[] = useMemo(() => {
    const newItems: UnifiedApprovalItem[] = pendingProducts.map((p) => ({
      id: p.id,
      approvalType: 'NEW_PRODUCT',
      productId: p.id,
      title: p.title,
      category: p.category,
      merchantCode: p.merchantCode,
      merchantName: p.merchantName,
      sku: p.fullSku,
      color: p.color,
      size: p.size,
      currentStock: 0,
      inboundQty: p.stock || 50,
      binCode: p.binCode || 'Unassigned',
      status: p.status,
      submittedAt: p.submittedAt,
      imageUrl: p.imageUrl,
      price: p.price,
      rawProduct: p,
    }));

    const restockItems: UnifiedApprovalItem[] = pendingReplenishments.map((r) => {
      const liveProd = products.find((p) => p.id === r.productId || p.fullSku === r.productSku);
      return {
        id: r.id,
        approvalType: 'RESTOCK',
        productId: r.productId,
        title: r.productTitle,
        category: r.category,
        merchantCode: r.merchantCode,
        merchantName: r.merchantName,
        sku: r.productSku,
        currentStock: liveProd ? liveProd.stock : r.currentStock,
        inboundQty: r.requestedQty,
        binCode: (liveProd ? liveProd.binCode : r.binCode) || 'A-01-02',
        status: r.status,
        submittedAt: r.submittedAt,
        imageUrl: r.imageUrl,
        note: r.note,
        trackingRef: r.trackingRef,
        rawReplenishment: r,
        rawProduct: liveProd,
      };
    });

    const withdrawalItems: UnifiedApprovalItem[] = pendingWithdrawals.map((w) => {
      const liveProd = products.find((p) => p.id === w.productId || p.fullSku === w.productSku);
      return {
        id: w.id,
        approvalType: 'WITHDRAWAL',
        productId: w.productId,
        title: w.productTitle,
        category: w.category,
        merchantCode: w.merchantCode,
        merchantName: w.merchantName,
        sku: w.productSku,
        currentStock: liveProd ? liveProd.stock : w.currentStock,
        inboundQty: w.withdrawQty,
        binCode: (liveProd ? liveProd.binCode : w.binCode) || 'A-01-02',
        status: w.status,
        submittedAt: w.submittedAt,
        imageUrl: w.imageUrl,
        note: w.reason,
        trackingRef: w.trackingRef,
        rawWithdrawal: w,
        rawProduct: liveProd,
      };
    });

    return [...withdrawalItems, ...restockItems, ...newItems];
  }, [pendingProducts, pendingReplenishments, pendingWithdrawals, products]);

  // Counts for WordPress-style tabs
  const allCount = unifiedItems.length;
  const newProductsCount = pendingProducts.length;
  const restocksCount = pendingReplenishments.length;
  const withdrawalsCount = pendingWithdrawals.length;

  // Filter States
  const [activeTypeFilter, setActiveTypeFilter] = useState<'ALL' | 'NEW_PRODUCT' | 'RESTOCK' | 'WITHDRAWAL'>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [merchantFilter, setMerchantFilter] = useState('ALL');
  const [categoryFilter, setCategoryFilter] = useState('ALL');
  const [binFilter, setBinFilter] = useState('ALL');

  // Bulk Selection & Action
  const [selectedItemIds, setSelectedItemIds] = useState<Set<string>>(new Set());
  const [bulkAction, setBulkAction] = useState<string>('');

  // Dropdown Menu State for row actions
  const [openDropdownId, setOpenDropdownId] = useState<string | null>(null);

  // Close dropdown on click outside
  useEffect(() => {
    if (!openDropdownId) return;
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target.closest('[data-actions-dropdown]')) {
        setOpenDropdownId(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [openDropdownId]);

  // Pagination
  const [pageSize, setPageSize] = useState<number>(10);
  const [currentPage, setCurrentPage] = useState<number>(1);

  // Modals
  const [restockModalTarget, setRestockModalTarget] = useState<InboundStockReplenishment | null>(null);
  const [withdrawalModalTarget, setWithdrawalModalTarget] = useState<StockWithdrawalRequest | null>(null);
  const [sendNoticeModalOpen, setSendNoticeModalOpen] = useState(false);
  const [manualRestockModalOpen, setManualRestockModalOpen] = useState(false);
  const [manualWithdrawalModalOpen, setManualWithdrawalModalOpen] = useState(false);
  const [detailsModalItem, setDetailsModalItem] = useState<UnifiedApprovalItem | null>(null);
  const [rejectModalItem, setRejectModalItem] = useState<UnifiedApprovalItem | null>(null);
  const [bulkApproveModalOpen, setBulkApproveModalOpen] = useState(false);
  const [bulkRejectModalOpen, setBulkRejectModalOpen] = useState(false);

  // Unique merchants
  const merchantsList = useMemo(() => {
    const map = new Map<string, string>();
    products.forEach((p) => {
      if (p.merchantCode && p.merchantName) {
        map.set(p.merchantCode, p.merchantName);
      }
    });
    return Array.from(map.entries()).map(([code, name]) => ({ code, name }));
  }, [products]);

  // Unique categories
  const categoriesList = useMemo(() => {
    const set = new Set<string>();
    products.forEach((p) => {
      if (p.category) set.add(p.category);
    });
    return Array.from(set);
  }, [products]);

  // Active filter check
  const hasActiveFilters =
    Boolean(searchQuery.trim()) ||
    merchantFilter !== 'ALL' ||
    categoryFilter !== 'ALL' ||
    binFilter !== 'ALL';

  const handleResetFilters = () => {
    setSearchQuery('');
    setMerchantFilter('ALL');
    setCategoryFilter('ALL');
    setBinFilter('ALL');
    setCurrentPage(1);
  };

  // Filtered items
  const filteredItems = useMemo(() => {
    return unifiedItems.filter((item) => {
      // Type Tab
      if (activeTypeFilter !== 'ALL' && item.approvalType !== activeTypeFilter) {
        return false;
      }
      // Search
      const q = searchQuery.trim().toLowerCase();
      if (q) {
        const matchSearch =
          item.title.toLowerCase().includes(q) ||
          item.sku.toLowerCase().includes(q) ||
          item.merchantName.toLowerCase().includes(q) ||
          item.merchantCode.toLowerCase().includes(q) ||
          (item.note && item.note.toLowerCase().includes(q)) ||
          (item.trackingRef && item.trackingRef.toLowerCase().includes(q)) ||
          item.binCode.toLowerCase().includes(q);
        if (!matchSearch) return false;
      }
      // Merchant
      if (merchantFilter !== 'ALL' && item.merchantCode !== merchantFilter) {
        return false;
      }
      // Category
      if (categoryFilter !== 'ALL' && item.category !== categoryFilter) {
        return false;
      }
      // Bin
      if (binFilter !== 'ALL' && item.binCode !== binFilter) {
        return false;
      }
      return true;
    });
  }, [unifiedItems, activeTypeFilter, searchQuery, merchantFilter, categoryFilter, binFilter]);

  // Pagination calculation
  const totalItems = filteredItems.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  const safePage = Math.min(Math.max(1, currentPage), totalPages);
  const startIndex = (safePage - 1) * pageSize;
  const paginatedItems = filteredItems.slice(startIndex, startIndex + pageSize);

  // Bulk Selection
  const isAllPageSelected =
    paginatedItems.length > 0 && paginatedItems.every((item) => selectedItemIds.has(item.id));

  const toggleSelect = (id: string) => {
    setSelectedItemIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleSelectAllPage = () => {
    setSelectedItemIds((prev) => {
      const next = new Set(prev);
      if (isAllPageSelected) {
        paginatedItems.forEach((item) => next.delete(item.id));
      } else {
        paginatedItems.forEach((item) => next.add(item.id));
      }
      return next;
    });
  };

  const handleApplyBulkAction = () => {
    if (!bulkAction || selectedItemIds.size === 0) return;
    if (bulkAction === 'APPROVE') {
      setBulkApproveModalOpen(true);
    } else if (bulkAction === 'REJECT') {
      setBulkRejectModalOpen(true);
    }
  };

  const executeBulkApprove = () => {
    const selectedList = unifiedItems.filter((item) => selectedItemIds.has(item.id));
    if (onBulkApproveUnified) {
      onBulkApproveUnified(selectedList);
    } else {
      selectedList.forEach((item) => {
        if (item.approvalType === 'NEW_PRODUCT' && item.rawProduct) {
          onOpenApprovalModal('APPROVE', item.rawProduct, bins[0]?.code || 'A-01-02');
        } else if (item.approvalType === 'RESTOCK' && item.rawReplenishment) {
          onApproveReplenishment(item.rawReplenishment, item.inboundQty, item.binCode);
        } else if (item.approvalType === 'WITHDRAWAL' && item.rawWithdrawal && onApproveWithdrawal) {
          onApproveWithdrawal(item.rawWithdrawal, item.inboundQty);
        }
      });
    }
    setSelectedItemIds(new Set());
    setBulkAction('');
    setBulkApproveModalOpen(false);
  };

  const executeBulkReject = () => {
    const selectedList = unifiedItems.filter((item) => selectedItemIds.has(item.id));
    if (onBulkRejectUnified) {
      onBulkRejectUnified(selectedList);
    } else {
      selectedList.forEach((item) => {
        if (item.approvalType === 'NEW_PRODUCT' && item.rawProduct) {
          onOpenApprovalModal('REJECT', item.rawProduct, item.binCode);
        } else if (item.approvalType === 'RESTOCK' && item.rawReplenishment) {
          onRejectReplenishment(item.rawReplenishment, 'Rejected via bulk action');
        } else if (item.approvalType === 'WITHDRAWAL' && item.rawWithdrawal && onRejectWithdrawal) {
          onRejectWithdrawal(item.rawWithdrawal, 'Rejected via bulk action');
        }
      });
    }
    setSelectedItemIds(new Set());
    setBulkAction('');
    setBulkRejectModalOpen(false);
  };

  return (
    <div className="space-y-4">
      {/* 1. TOP BANNER & INVENTORY ACTIONS */}
      <div className="bg-white dark:bg-navy-900 border border-slate-200 dark:border-white/10 rounded-2xl p-4 sm:p-5 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 shadow-md">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-orange-500/15 border border-orange-500/30 flex items-center justify-center text-orange-600 dark:text-orange-400">
              <Sparkles className="w-4 h-4" />
            </div>
            <h3 className="text-base sm:text-lg font-extrabold text-navy-800 dark:text-white">
              Warehouse Inventory Approvals &amp; Stock Movements
            </h3>
          </div>
          <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 max-w-2xl">
            Single control center for <strong>new catalog products</strong>,{' '}
            <strong>inbound stock replenishments</strong>, and <strong>merchant stock recalls</strong>.
            Inspect physical goods, assign bins, and release outbound withdrawals.
          </p>
        </div>

        {/* Top Quick Actions */}
        <div className="flex flex-wrap items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={() => setSendNoticeModalOpen(true)}
            className="px-3.5 py-2 rounded-xl bg-slate-100 dark:bg-navy-800 hover:bg-slate-200 dark:hover:bg-navy-700 text-xs font-bold text-navy-800 dark:text-slate-100 border border-slate-200 dark:border-white/10 shadow-sm transition-all flex items-center gap-1.5 cursor-pointer active:scale-95"
            title="Send notification to merchant requesting restock for low or out-of-stock items"
          >
            <BellRing className="w-3.5 h-3.5 text-orange-600 dark:text-orange-400" />
            <span>Send Restock Notice</span>
          </button>

          <button
            type="button"
            onClick={() => setManualRestockModalOpen(true)}
            className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-md shadow-emerald-500/20 transition-all flex items-center gap-1.5 cursor-pointer active:scale-95"
            title="Log manual inbound replenishment for goods received directly at dock"
          >
            <PlusCircle className="w-3.5 h-3.5" />
            <span>Record Inbound Restock</span>
          </button>

          <button
            type="button"
            onClick={() => setManualWithdrawalModalOpen(true)}
            className="px-3.5 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold shadow-md shadow-rose-500/20 transition-all flex items-center gap-1.5 cursor-pointer active:scale-95"
            title="Process stock withdrawal / return to merchant"
          >
            <PackageMinus className="w-3.5 h-3.5" />
            <span>Record Stock Withdrawal</span>
          </button>
        </div>
      </div>

      {/* 2. FILTER BAR (2-Row Layout Matching Orders & Products Catalog) */}
      <div className="rounded-2xl border border-slate-200 dark:border-white/10 bg-white/90 dark:bg-navy-900/90 p-3 sm:p-4 shadow-sm space-y-3">
        {/* Row 1: Standalone Search Bar */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5">
          <div className="flex-1 w-full min-w-0">
            <SearchInput
              value={searchQuery}
              onChange={(val) => {
                setSearchQuery(val);
                setCurrentPage(1);
              }}
              onClear={() => {
                setSearchQuery('');
                setCurrentPage(1);
              }}
              placeholder="Search product title, SKU, merchant, or tracking reference..."
              className="w-full text-xs"
            />
          </div>
        </div>

        {/* Row 2: Bulk Actions -> Apply -> All Merchants -> All Categories -> All Warehouse Bins -> Reset */}
        <div className="flex flex-wrap items-center gap-2 pt-2.5 border-t border-slate-100 dark:border-white/5">
          {/* 1. Bulk Actions Dropdown */}
          <select
            value={bulkAction}
            onChange={(e) => setBulkAction(e.target.value)}
            aria-label="Bulk Actions"
            className="px-3 py-2 rounded-xl bg-slate-50 dark:bg-navy-950 border border-slate-200 dark:border-white/10 text-xs font-semibold text-navy-800 dark:text-slate-100 focus:outline-none focus:border-orange-500 cursor-pointer shadow-2xs"
          >
            <option value="">Bulk Actions</option>
            <option value="APPROVE">Approve Selected Requests</option>
            <option value="REJECT">Decline Selected Requests</option>
          </select>

          {/* 2. Apply Button */}
          <button
            type="button"
            onClick={handleApplyBulkAction}
            disabled={!bulkAction || selectedItemIds.size === 0}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all border ${
              bulkAction && selectedItemIds.size > 0
                ? 'bg-orange-600 hover:bg-orange-500 text-white border-orange-600 shadow-sm cursor-pointer active:scale-95'
                : 'bg-slate-100 dark:bg-navy-800 text-slate-400 dark:text-slate-500 border-slate-200 dark:border-white/10 cursor-not-allowed opacity-60'
            }`}
          >
            Apply
          </button>

          {/* Subtle Divider */}
          <div className="hidden sm:block h-5 w-[1px] bg-slate-200 dark:bg-white/10 mx-0.5" />

          {/* 3. All Merchants Dropdown */}
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
            {merchantsList.map((m) => (
              <option key={m.code} value={m.code}>
                {m.code} — {m.name}
              </option>
            ))}
          </select>

          {/* 4. All Categories Dropdown */}
          <select
            value={categoryFilter}
            onChange={(e) => {
              setCategoryFilter(e.target.value);
              setCurrentPage(1);
            }}
            aria-label="Filter by Category"
            className="px-3 py-2 rounded-xl bg-slate-50 dark:bg-navy-950 border border-slate-200 dark:border-white/10 text-xs font-semibold text-navy-800 dark:text-slate-100 focus:outline-none focus:border-orange-500 cursor-pointer shadow-2xs"
          >
            <option value="ALL">All Categories</option>
            {categoriesList.map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>

          {/* 5. All Warehouse Bins Dropdown */}
          <select
            value={binFilter}
            onChange={(e) => {
              setBinFilter(e.target.value);
              setCurrentPage(1);
            }}
            aria-label="Filter by Bin Location"
            className="px-3 py-2 rounded-xl bg-slate-50 dark:bg-navy-950 border border-slate-200 dark:border-white/10 text-xs font-semibold text-navy-800 dark:text-slate-100 focus:outline-none focus:border-orange-500 cursor-pointer shadow-2xs"
          >
            <option value="ALL">All Warehouse Bins</option>
            {bins.map((b) => (
              <option key={b.code} value={b.code}>
                Bin {b.code} ({b.zone})
              </option>
            ))}
          </select>

          {/* 6. Reset Button */}
          {hasActiveFilters && (
            <button
              type="button"
              onClick={handleResetFilters}
              title="Reset active filters"
              className="px-3 py-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer bg-slate-100 dark:bg-navy-800 hover:bg-slate-200 dark:hover:bg-navy-700 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-white/10 shadow-2xs active:scale-95 animate-in fade-in"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset</span>
            </button>
          )}
        </div>

        {/* Row 3: WordPress-style Status Tabs */}
        <div className="flex flex-wrap items-center gap-2 pt-2.5 border-t border-slate-100 dark:border-white/5 text-xs">
          <button
            type="button"
            onClick={() => {
              setActiveTypeFilter('ALL');
              setCurrentPage(1);
              setSelectedItemIds(new Set());
            }}
            className={`cursor-pointer transition-colors ${
              activeTypeFilter === 'ALL'
                ? 'text-orange-600 dark:text-orange-400 font-bold'
                : 'text-slate-600 dark:text-slate-400 hover:text-navy-900 dark:hover:text-white font-medium'
            }`}
          >
            All Requests{' '}
            <span className="text-slate-400 dark:text-slate-500 font-normal">({allCount})</span>
          </button>
          <span className="text-slate-300 dark:text-slate-700">|</span>

          <button
            type="button"
            onClick={() => {
              setActiveTypeFilter('NEW_PRODUCT');
              setCurrentPage(1);
              setSelectedItemIds(new Set());
            }}
            className={`cursor-pointer transition-colors ${
              activeTypeFilter === 'NEW_PRODUCT'
                ? 'text-indigo-600 dark:text-indigo-400 font-bold'
                : 'text-slate-600 dark:text-slate-400 hover:text-navy-900 dark:hover:text-white font-medium'
            }`}
          >
            New Product Submissions{' '}
            <span className="text-slate-400 dark:text-slate-500 font-normal">({newProductsCount})</span>
          </button>
          <span className="text-slate-300 dark:text-slate-700">|</span>

          <button
            type="button"
            onClick={() => {
              setActiveTypeFilter('RESTOCK');
              setCurrentPage(1);
              setSelectedItemIds(new Set());
            }}
            className={`cursor-pointer transition-colors ${
              activeTypeFilter === 'RESTOCK'
                ? 'text-amber-600 dark:text-amber-400 font-bold'
                : 'text-slate-600 dark:text-slate-400 hover:text-navy-900 dark:hover:text-white font-medium'
            }`}
          >
            Stock Restocks{' '}
            <span className="text-slate-400 dark:text-slate-500 font-normal">({restocksCount})</span>
          </button>
          <span className="text-slate-300 dark:text-slate-700">|</span>

          <button
            type="button"
            onClick={() => {
              setActiveTypeFilter('WITHDRAWAL');
              setCurrentPage(1);
              setSelectedItemIds(new Set());
            }}
            className={`cursor-pointer transition-colors ${
              activeTypeFilter === 'WITHDRAWAL'
                ? 'text-rose-600 dark:text-rose-400 font-bold'
                : 'text-slate-600 dark:text-slate-400 hover:text-navy-900 dark:hover:text-white font-medium'
            }`}
          >
            Stock Withdrawals{' '}
            <span className="text-slate-400 dark:text-slate-500 font-normal">({withdrawalsCount})</span>
          </button>
        </div>
      </div>

      {/* 3. TABLE CARD CONTAINER (Clean layout with attached header/footer) */}
      <div className="bg-white dark:bg-navy-900 border border-slate-200 dark:border-white/10 rounded-2xl overflow-visible shadow-lg">
        {/* Top Attached Sub-header: Selection Info & Rows Selector */}
        <div className="flex items-center justify-between px-4 py-2.5 bg-slate-50/80 dark:bg-navy-950/80 border-b border-slate-200 dark:border-white/10 text-xs text-slate-600 dark:text-slate-300 rounded-t-2xl">
          <div>
            <span className="text-slate-500 dark:text-slate-400 text-xs font-medium">
              {selectedItemIds.size > 0
                ? `${selectedItemIds.size} ${selectedItemIds.size === 1 ? 'request' : 'requests'} selected`
                : 'Select requests to apply bulk actions'}
            </span>
          </div>

          <div className="flex items-center gap-1.5">
            <span className="text-slate-500 dark:text-slate-400 font-medium">Show</span>
            <select
              value={pageSize}
              onChange={(e) => {
                setPageSize(Number(e.target.value));
                setCurrentPage(1);
              }}
              aria-label="Requests per page"
              className="bg-white dark:bg-navy-900 border border-slate-200 dark:border-white/10 rounded-lg px-2 py-0.5 text-xs font-bold text-orange-600 dark:text-orange-400 focus:outline-none cursor-pointer"
            >
              <option value={10}>10</option>
              <option value={25}>25</option>
              <option value={50}>50</option>
              <option value={100}>100</option>
            </select>
            <span className="text-slate-500 dark:text-slate-400 font-medium">rows</span>
          </div>
        </div>

        {/* Empty State */}
        {paginatedItems.length === 0 ? (
          <div className="text-center py-16 px-4">
            <div className="w-14 h-14 rounded-2xl bg-slate-100 dark:bg-navy-800 text-slate-400 flex items-center justify-center mx-auto mb-3">
              <CheckCircle2 className="w-7 h-7 text-emerald-500" />
            </div>
            <h4 className="text-sm font-bold text-navy-800 dark:text-white">
              No Pending Requests in Queue
            </h4>
            <p className="text-xs text-slate-500 dark:text-slate-400 max-w-md mx-auto mt-1">
              All merchant product catalog submissions, stock replenishment batches, and withdrawals
              have been processed.
            </p>
            <button
              type="button"
              onClick={onSwitchToAllTab}
              className="mt-4 px-4 py-2 rounded-xl bg-orange-600 hover:bg-orange-500 text-white text-xs font-bold shadow-md shadow-orange-500/20 transition-all cursor-pointer"
            >
              Browse Active Warehouse Catalog
            </button>
          </div>
        ) : (
          <div className="overflow-visible">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-200 dark:border-white/10 bg-slate-50/50 dark:bg-navy-950/50 text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  <th className="py-3 px-4 w-10 text-center">
                    <input
                      type="checkbox"
                      checked={isAllPageSelected}
                      onChange={toggleSelectAllPage}
                      aria-label="Select all on this page"
                      className="w-4 h-4 rounded border-slate-300 dark:border-white/20 text-orange-600 focus:ring-orange-500 cursor-pointer"
                    />
                  </th>
                  <th className="py-3 px-4">Product &amp; Request Type</th>
                  <th className="py-3 px-4">Merchant</th>
                  <th className="py-3 px-4">Quantity &amp; Stock Math</th>
                  <th className="py-3 px-4">Storage Bin</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-white/5">
                {paginatedItems.map((item) => {
                  const isSelected = selectedItemIds.has(item.id);
                  const isRestock = item.approvalType === 'RESTOCK';
                  const isWithdrawal = item.approvalType === 'WITHDRAWAL';
                  const isNewProduct = item.approvalType === 'NEW_PRODUCT';
                  const isMenuOpen = openDropdownId === item.id;

                  return (
                    <tr
                      key={item.id}
                      className={`transition-colors hover:bg-slate-50/60 dark:hover:bg-navy-800/40 ${
                        isSelected ? 'bg-orange-50/40 dark:bg-orange-950/15' : ''
                      }`}
                    >
                      {/* Checkbox */}
                      <td className="py-3.5 px-4 text-center">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => toggleSelect(item.id)}
                          aria-label={`Select ${item.title}`}
                          className="w-4 h-4 rounded border-slate-300 dark:border-white/20 text-orange-600 focus:ring-orange-500 cursor-pointer"
                        />
                      </td>

                      {/* Product & Type Badge */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-3">
                          <img
                            src={item.imageUrl}
                            alt={item.title}
                            className="w-11 h-11 rounded-xl object-cover border border-slate-200 dark:border-white/10 shrink-0"
                          />
                          <div className="space-y-0.5 min-w-0">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              {isWithdrawal ? (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-500/15 text-rose-700 dark:text-rose-400 border border-rose-500/30">
                                  📤 Stock Recall (-{item.inboundQty})
                                </span>
                              ) : isRestock ? (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/15 text-amber-700 dark:text-amber-400 border border-amber-500/30">
                                  🔄 Restock (+{item.inboundQty})
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-500/15 text-indigo-700 dark:text-indigo-400 border border-indigo-500/30">
                                  ✨ New Catalog SKU
                                </span>
                              )}
                              <span className="text-[10px] text-slate-400 font-medium">
                                {item.category}
                              </span>
                            </div>
                            <div className="font-bold text-navy-800 dark:text-white truncate max-w-xs">
                              {item.title}
                            </div>
                            <div className="font-mono text-[11px] text-orange-600 dark:text-orange-400 tabular-nums">
                              {item.sku}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Merchant */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <div className="font-bold text-navy-800 dark:text-white">
                          {item.merchantName}
                        </div>
                        <div className="text-[11px] text-slate-500 dark:text-slate-400">
                          {item.merchantCode}
                        </div>
                      </td>

                      {/* Quantity & Stock Math */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        {isWithdrawal ? (
                          <div className="space-y-0.5">
                            <div className="flex items-center gap-1 text-[11px]">
                              <span className="text-slate-500 dark:text-slate-400">Current:</span>
                              <strong className="text-navy-800 dark:text-white">
                                {item.currentStock} pcs
                              </strong>
                            </div>
                            <div className="text-rose-600 dark:text-rose-400 font-extrabold text-xs flex items-center gap-1">
                              <span>-{item.inboundQty} withdraw</span>
                              <span className="text-slate-400 font-normal">
                                → Remaining: {Math.max(0, item.currentStock - item.inboundQty)} pcs
                              </span>
                            </div>
                          </div>
                        ) : isRestock ? (
                          <div className="space-y-0.5">
                            <div className="flex items-center gap-1 text-[11px]">
                              <span className="text-slate-500 dark:text-slate-400">Current:</span>
                              {item.currentStock === 0 ? (
                                <span className="px-1.5 py-0.2 rounded font-bold text-rose-600 bg-rose-500/15 border border-rose-500/30">
                                  0 (Depleted)
                                </span>
                              ) : (
                                <strong className="text-navy-800 dark:text-white">
                                  {item.currentStock} pcs
                                </strong>
                              )}
                            </div>
                            <div className="text-emerald-600 dark:text-emerald-400 font-extrabold text-xs flex items-center gap-1">
                              <span>+{item.inboundQty} inbound</span>
                              <span className="text-slate-400 font-normal">
                                → Total: {item.currentStock + item.inboundQty} pcs
                              </span>
                            </div>
                          </div>
                        ) : (
                          <div className="space-y-0.5">
                            <div className="font-extrabold text-indigo-600 dark:text-indigo-400 text-xs">
                              +{item.inboundQty} pcs initial
                            </div>
                            <div className="text-[11px] text-slate-400">
                              Brand new item submission
                            </div>
                          </div>
                        )}
                      </td>

                      {/* Storage Bin (Clean static indicator - No select dropdown!) */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        {isNewProduct ? (
                          <span className="text-slate-400 dark:text-slate-500 italic text-[11px]">
                            Unassigned (Pending QC)
                          </span>
                        ) : isWithdrawal ? (
                          <span className="inline-flex items-center gap-1 font-bold text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-navy-800 px-2 py-0.5 rounded text-xs border border-slate-200 dark:border-white/10">
                            Bin {item.binCode}
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 font-bold text-orange-600 dark:text-orange-400 bg-orange-500/10 px-2 py-0.5 rounded text-xs border border-orange-500/20">
                            Bin {item.binCode}
                          </span>
                        )}
                      </td>

                      {/* Actions: Clean Dropdown Menu */}
                      <td className="py-3.5 px-4 text-right whitespace-nowrap relative">
                        <div className="inline-block text-left" data-actions-dropdown>
                          <button
                            type="button"
                            onClick={() => setOpenDropdownId(isMenuOpen ? null : item.id)}
                            className="px-3 py-1.5 rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-navy-800 hover:bg-slate-100 dark:hover:bg-navy-700 text-xs font-bold text-navy-800 dark:text-slate-100 shadow-2xs transition-all flex items-center gap-1 cursor-pointer active:scale-95"
                          >
                            <span>Actions</span>
                            <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-150 ${isMenuOpen ? 'rotate-180' : ''}`} />
                          </button>

                          {/* Dropdown Popover */}
                          {isMenuOpen && (
                            <div className="absolute right-4 mt-1 w-48 rounded-xl bg-white dark:bg-navy-900 border border-slate-200 dark:border-white/10 shadow-xl py-1 z-30 animate-in fade-in zoom-in-95">
                              {/* Option 1: Approve */}
                              <button
                                type="button"
                                onClick={() => {
                                  setOpenDropdownId(null);
                                  if (isWithdrawal && item.rawWithdrawal) {
                                    setWithdrawalModalTarget(item.rawWithdrawal);
                                  } else if (isRestock && item.rawReplenishment) {
                                    setRestockModalTarget(item.rawReplenishment);
                                  } else if (item.rawProduct) {
                                    onOpenApprovalModal('APPROVE', item.rawProduct, bins[0]?.code || 'A-01-02');
                                  }
                                }}
                                className="w-full text-left px-3.5 py-2 text-xs font-bold text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/20 flex items-center gap-2 cursor-pointer transition-colors"
                              >
                                <CheckCircle2 className="w-3.5 h-3.5" />
                                <span>
                                  {isWithdrawal
                                    ? 'Approve & Release'
                                    : isRestock
                                    ? 'Approve & Intake'
                                    : 'Approve & Assign Bin'}
                                </span>
                              </button>

                              {/* Option 2: Decline / Reject */}
                              <button
                                type="button"
                                onClick={() => {
                                  setOpenDropdownId(null);
                                  setRejectModalItem(item);
                                }}
                                className="w-full text-left px-3.5 py-2 text-xs font-semibold text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/20 flex items-center gap-2 cursor-pointer transition-colors"
                              >
                                <XCircle className="w-3.5 h-3.5" />
                                <span>Decline Request</span>
                              </button>

                              <div className="my-1 border-t border-slate-100 dark:border-white/5" />

                              {/* Option 3: View Details */}
                              <button
                                type="button"
                                onClick={() => {
                                  setOpenDropdownId(null);
                                  setDetailsModalItem(item);
                                }}
                                className="w-full text-left px-3.5 py-2 text-xs font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-navy-800 flex items-center gap-2 cursor-pointer transition-colors"
                              >
                                <Eye className="w-3.5 h-3.5 text-slate-500" />
                                <span>View Details</span>
                              </button>
                            </div>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Bottom Attached Pagination Footer (Zero-Gap) */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 px-4 py-3 bg-slate-50/80 dark:bg-navy-950/80 border-t border-slate-200 dark:border-white/10 text-xs text-slate-600 dark:text-slate-300 rounded-b-2xl">
          <div>
            Showing{' '}
            <span className="font-bold text-navy-800 dark:text-white">
              {totalItems === 0 ? 0 : startIndex + 1}
            </span>{' '}
            to{' '}
            <span className="font-bold text-navy-800 dark:text-white">
              {Math.min(startIndex + pageSize, totalItems)}
            </span>{' '}
            of <span className="font-bold text-navy-800 dark:text-white">{totalItems}</span> requests
          </div>

          <div className="flex items-center gap-2">
            <span className="text-slate-600 dark:text-slate-300 font-medium">
              Page <span className="text-navy-800 dark:text-white font-bold">{safePage}</span> of{' '}
              <span className="text-navy-800 dark:text-white font-bold">{totalPages}</span>
            </span>

            <div className="flex items-center gap-1">
              <button
                type="button"
                disabled={safePage <= 1}
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                aria-label="Previous page"
                className="p-1.5 rounded-lg border border-slate-200 dark:border-white/10 bg-white dark:bg-navy-900 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-navy-800 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer transition-colors shadow-2xs"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                type="button"
                disabled={safePage >= totalPages}
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                aria-label="Next page"
                className="p-1.5 rounded-lg border border-slate-200 dark:border-white/10 bg-white dark:bg-navy-900 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-navy-800 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer transition-colors shadow-2xs"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* 4. MODALS */}
      {/* Restock Intake & Put-Away Modal */}
      <RestockIntakeModal
        isOpen={Boolean(restockModalTarget)}
        onClose={() => setRestockModalTarget(null)}
        replenishment={restockModalTarget}
        bins={bins}
        onConfirm={(rep, qty, targetBin) => {
          onApproveReplenishment(rep, qty, targetBin);
          setRestockModalTarget(null);
        }}
      />

      {/* Stock Withdrawal Confirmation Modal */}
      <ConfirmWithdrawalModal
        isOpen={Boolean(withdrawalModalTarget)}
        onClose={() => setWithdrawalModalTarget(null)}
        withdrawal={withdrawalModalTarget}
        onConfirm={(wth, verifiedQty, note) => {
          onApproveWithdrawal?.(wth, verifiedQty, note);
          setWithdrawalModalTarget(null);
        }}
      />

      {/* Send Restock Notice Modal */}
      <SendRestockNoticeModal
        isOpen={sendNoticeModalOpen}
        onClose={() => setSendNoticeModalOpen(false)}
        products={products}
        onSend={(prodId, qty, note) => {
          onSendRestockNotice?.(prodId, qty, note);
        }}
      />

      {/* Manual Direct Inbound Restock Modal */}
      <ManualRestockModal
        isOpen={manualRestockModalOpen}
        onClose={() => setManualRestockModalOpen(false)}
        products={products}
        bins={bins}
        onConfirm={(prodId, qty, binCode, note) => {
          onRecordManualRestock?.(prodId, qty, binCode, note);
        }}
      />

      {/* Manual Direct Stock Withdrawal Modal */}
      <ManualWithdrawalModal
        isOpen={manualWithdrawalModalOpen}
        onClose={() => setManualWithdrawalModalOpen(false)}
        products={products}
        onConfirm={(prodId, qty, reason) => {
          onRecordManualWithdrawal?.(prodId, qty, reason);
        }}
      />

      {/* Request Details View Modal */}
      <ApprovalItemDetailsModal
        isOpen={Boolean(detailsModalItem)}
        onClose={() => setDetailsModalItem(null)}
        item={detailsModalItem}
      />

      {/* Reject Confirmation Modal */}
      {rejectModalItem && (
        <Modal
          isOpen={Boolean(rejectModalItem)}
          onClose={() => setRejectModalItem(null)}
          title={
            rejectModalItem.approvalType === 'WITHDRAWAL'
              ? 'Confirm Decline Stock Withdrawal Request'
              : rejectModalItem.approvalType === 'RESTOCK'
              ? 'Confirm Decline Stock Restock Request'
              : 'Confirm Reject Product Submission'
          }
          size="sm"
        >
          <div className="space-y-4">
            <div className="flex items-start gap-3 p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-xs text-rose-700 dark:text-rose-300">
              <AlertTriangle className="w-5 h-5 shrink-0" />
              <div>
                Are you sure you want to decline{' '}
                <strong>
                  {rejectModalItem.title} ({rejectModalItem.sku})
                </strong>{' '}
                from merchant {rejectModalItem.merchantName}?
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-200 dark:border-white/10">
              <button
                type="button"
                onClick={() => setRejectModalItem(null)}
                className="px-4 py-2 rounded-xl border border-slate-300 dark:border-white/10 text-xs font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-navy-800 transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  if (rejectModalItem.approvalType === 'NEW_PRODUCT' && rejectModalItem.rawProduct) {
                    onOpenApprovalModal('REJECT', rejectModalItem.rawProduct, rejectModalItem.binCode);
                  } else if (rejectModalItem.approvalType === 'RESTOCK' && rejectModalItem.rawReplenishment) {
                    onRejectReplenishment(rejectModalItem.rawReplenishment, 'Warehouse declined inbound restock');
                  } else if (rejectModalItem.approvalType === 'WITHDRAWAL' && rejectModalItem.rawWithdrawal && onRejectWithdrawal) {
                    onRejectWithdrawal(rejectModalItem.rawWithdrawal, 'Warehouse declined stock withdrawal');
                  }
                  setRejectModalItem(null);
                }}
                className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold transition-all cursor-pointer"
              >
                Decline Request
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* Bulk Approve Confirmation Modal */}
      <Modal
        isOpen={bulkApproveModalOpen}
        onClose={() => setBulkApproveModalOpen(false)}
        title="Confirm Bulk Approval & Execution"
        size="sm"
      >
        <div className="space-y-4 text-xs">
          <p className="text-slate-700 dark:text-slate-300">
            Confirm approving all <strong>{selectedItemIds.size} selected requests</strong>{' '}
            (new products, restocks, and withdrawals)?
          </p>
          <div className="flex justify-end gap-2 pt-2 border-t border-slate-200 dark:border-white/10">
            <button
              type="button"
              onClick={() => setBulkApproveModalOpen(false)}
              className="px-4 py-2 rounded-xl border border-slate-300 dark:border-white/10 text-xs font-bold text-slate-700 dark:text-slate-300 cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={executeBulkApprove}
              className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold cursor-pointer"
            >
              Approve All {selectedItemIds.size} Requests
            </button>
          </div>
        </div>
      </Modal>

      {/* Bulk Reject Confirmation Modal */}
      <Modal
        isOpen={bulkRejectModalOpen}
        onClose={() => setBulkRejectModalOpen(false)}
        title="Confirm Bulk Rejection"
        size="sm"
      >
        <div className="space-y-4 text-xs">
          <p className="text-slate-700 dark:text-slate-300">
            Are you sure you want to decline all{' '}
            <strong>{selectedItemIds.size} selected requests</strong>?
          </p>
          <div className="flex justify-end gap-2 pt-2 border-t border-slate-200 dark:border-white/10">
            <button
              type="button"
              onClick={() => setBulkRejectModalOpen(false)}
              className="px-4 py-2 rounded-xl border border-slate-300 dark:border-white/10 text-xs font-bold text-slate-700 dark:text-slate-300 cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={executeBulkReject}
              className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold cursor-pointer"
            >
              Decline All {selectedItemIds.size} Requests
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
