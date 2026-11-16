'use client';

import React, { useState, useMemo, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Store, Plus, ChevronRight, ChevronLeft, PackageOpen, ArrowUpRight } from 'lucide-react';
import { MerchantOrderItem, MerchantProductItem } from '../types';
import {
  ProductFilterTab,
  ProductSortOption,
  ProductViewMode,
  ProductStats,
  StockRequestItem,
  StockRequestType,
} from './types';
import { SubmitStockRequestPayload } from './modals/ManageStockModal';
import { ProductStatsGrid } from './components/ProductStatsGrid';
import { ProductStatusTabs } from './components/ProductStatusTabs';
import { ProductToolbar } from './components/ProductToolbar';
import { ProductTable } from './components/ProductTable';
import { ProductGrid } from './components/ProductGrid';
import { ProductBulkActionBar } from './components/ProductBulkActionBar';
import { StockRequestsTable } from './components/StockRequestsTable';
import { ManageStockModal } from './modals/ManageStockModal';
import { DeleteConfirmModal } from './modals/DeleteConfirmModal';
import { PrintBarcodeModal } from '../components/modals/PrintBarcodeModal';

const isPendingApprovalProduct = (p: MerchantProductItem): boolean => {
  if (p.status === 'PENDING_APPROVAL') return true;
  if (!p.bin || p.bin === 'Pending Approval' || p.bin === 'Assigned on intake') return true;
  return false;
};

export interface MerchantProductsTabProps {
  products: MerchantProductItem[];
  orders?: MerchantOrderItem[];
  stockRequests?: StockRequestItem[];
  merchantCode: string;
  storeName: string;
  onDeleteProduct: (id: string) => void;
  onAddProducts: (newItems: MerchantProductItem[]) => void;
  onUpdateProduct: (id: string, updated: Partial<MerchantProductItem>) => void;
  onToggleStatus: (id: string) => void;
  onBulkUpdateStatus: (ids: string[], status: 'PUBLISHED' | 'DRAFT') => void;
  onBulkDelete: (ids: string[]) => void;
  onRequestStockAdd?: (productId: string, qty: number, note?: string) => void;
  onRequestStockOperation?: (payload: SubmitStockRequestPayload) => void;
  onApproveStockRequest?: (requestId: string) => void;
  onCancelStockRequest?: (requestId: string) => void;
  onTriggerToast: (msg: string) => void;
}

export function MerchantProductsTab({
  products,
  orders = [],
  stockRequests = [],
  merchantCode,
  storeName,
  onDeleteProduct,
  onAddProducts,
  onUpdateProduct,
  onToggleStatus,
  onBulkUpdateStatus,
  onBulkDelete,
  onRequestStockAdd,
  onRequestStockOperation,
  onApproveStockRequest,
  onCancelStockRequest,
  onTriggerToast,
}: MerchantProductsTabProps) {
  const router = useRouter();

  // Filters & State
  const [activeTab, setActiveTab] = useState<ProductFilterTab>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('ALL');
  const [sortOption, setSortOption] = useState<ProductSortOption>('NEWEST');
  const [viewMode, setViewMode] = useState<ProductViewMode>('LIST');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  // Pagination state
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number>(10);

  // Reset page to 1 when filter, search, category or tab changes
  useEffect(() => {
    setCurrentPage(1);
  }, [activeTab, searchQuery, selectedCategory, sortOption]);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const requestedTab = sessionStorage.getItem('fulfillio_products_initial_tab');
      if (requestedTab === 'PENDING_APPROVAL') {
        sessionStorage.removeItem('fulfillio_products_initial_tab');
        setActiveTab('PENDING_APPROVAL');
      }
    }
  }, []);

  // Modals state for stock adjustment, delete confirmation & thermal barcode
  const [stockModalProduct, setStockModalProduct] = useState<MerchantProductItem | null>(null);
  const [stockModalInitialMode, setStockModalInitialMode] = useState<StockRequestType>('RESTOCK');
  const [isStockModalOpen, setIsStockModalOpen] = useState(false);

  const [deleteProductTarget, setDeleteProductTarget] = useState<MerchantProductItem | null>(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

  const [isBarcodeModalOpen, setIsBarcodeModalOpen] = useState(false);
  const [barcodeProduct, setBarcodeProduct] = useState<MerchantProductItem | null>(null);

  // Category options extraction
  const categories = useMemo(() => {
    const set = new Set<string>();
    products.forEach((p) => {
      if (p.category) set.add(p.category);
    });
    return Array.from(set);
  }, [products]);

  // Dynamic Statistics
  const stats: ProductStats = useMemo(() => {
    const approvedProducts = products.filter((p) => !isPendingApprovalProduct(p));
    const published = approvedProducts.filter(
      (p) => p.status === 'PUBLISHED' || (!p.status && p.stock > 0)
    ).length;
    const lowStock = approvedProducts.filter((p) => p.stock > 0 && p.stock <= 30).length;
    const totalOrders =
      orders.length > 0
        ? orders.length
        : products.reduce((sum, p) => sum + (p.totalOrders || 0), 0);

    return {
      storeProducts: approvedProducts.length,
      published,
      totalOrders,
      lowStock,
      pendingRequests: stockRequests.filter((r) => r.status === 'PENDING_APPROVAL').length,
    };
  }, [products, orders, stockRequests]);

  // Tab counts
  const counts = useMemo(() => {
    const approvedProducts = products.filter((p) => !isPendingApprovalProduct(p));
    const pendingApprovalProducts = products.filter((p) => isPendingApprovalProduct(p));

    return {
      all: approvedProducts.length,
      published: approvedProducts.filter(
        (p) => p.status === 'PUBLISHED' || (!p.status && p.stock > 0)
      ).length,
      pendingApproval: pendingApprovalProducts.length,
      draft: approvedProducts.filter((p) => p.status === 'DRAFT').length,
      outOfStock: approvedProducts.filter((p) => p.stock === 0).length,
      stockRequests: stockRequests.filter((r) => r.status === 'PENDING_APPROVAL').length,
    };
  }, [products, stockRequests]);

  // Filtered & Sorted Product List
  const filteredProducts = useMemo(() => {
    return products
      .filter((p) => {
        const isPendingApproval = isPendingApprovalProduct(p);

        // Strict isolation: unapproved products ONLY appear in the PENDING_APPROVAL tab
        if (activeTab === 'PENDING_APPROVAL') {
          if (!isPendingApproval) return false;
        } else {
          if (isPendingApproval) return false;

          if (activeTab === 'PUBLISHED') {
            const isPublished = p.status === 'PUBLISHED' || (!p.status && p.stock > 0);
            if (!isPublished) return false;
          } else if (activeTab === 'DRAFT') {
            if (p.status !== 'DRAFT') return false;
          } else if (activeTab === 'OUT_OF_STOCK') {
            if (p.stock !== 0) return false;
          }
        }

        // Category Filter
        if (selectedCategory !== 'ALL' && p.category !== selectedCategory) {
          return false;
        }

        // Search Query
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase();
          const matchTitle = p.title.toLowerCase().includes(q);
          const matchSku = p.sku.toLowerCase().includes(q);
          const matchBarcode = p.barcode.toLowerCase().includes(q);
          const matchBin = p.bin?.toLowerCase().includes(q);
          if (!matchTitle && !matchSku && !matchBarcode && !matchBin) {
            return false;
          }
        }

        return true;
      })
      .sort((a, b) => {
        if (sortOption === 'PRICE_ASC') return a.price - b.price;
        if (sortOption === 'PRICE_DESC') return b.price - a.price;
        if (sortOption === 'STOCK_DESC') return b.stock - a.stock;
        if (sortOption === 'MARGIN_DESC') {
          const marginA = a.profitMargin ?? 0;
          const marginB = b.profitMargin ?? 0;
          return marginB - marginA;
        }
        return 0; // Default NEWEST preservation
      });
  }, [products, activeTab, selectedCategory, searchQuery, sortOption]);

  // Pagination calculation
  const totalPages = Math.max(1, Math.ceil(filteredProducts.length / pageSize));

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [currentPage, totalPages]);

  const paginatedProducts = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredProducts.slice(start, start + pageSize);
  }, [filteredProducts, currentPage, pageSize]);

  // Selection handlers
  const handleToggleSelect = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handleToggleSelectAll = () => {
    const pageIds = paginatedProducts.map((p) => p.id);
    const allSelectedOnPage = pageIds.length > 0 && pageIds.every((id) => selectedIds.includes(id));
    if (allSelectedOnPage) {
      setSelectedIds((prev) => prev.filter((id) => !pageIds.includes(id)));
    } else {
      setSelectedIds((prev) => Array.from(new Set([...prev, ...pageIds])));
    }
  };

  // Navigation Handlers (Navigates to dedicated pages)
  const handleOpenEdit = (p: MerchantProductItem) => {
    router.push(`/merchant/products/${p.id}/edit`);
  };

  const handleViewDetails = (p: MerchantProductItem) => {
    router.push(`/merchant/products/${p.id}`);
  };

  // Manage Stock Handler
  const handleOpenManageStock = (p: MerchantProductItem, mode: StockRequestType = 'RESTOCK') => {
    setStockModalProduct(p);
    setStockModalInitialMode(mode);
    setIsStockModalOpen(true);
  };

  // Delete Request Handler (Opens confirmation modal!)
  const handleRequestDelete = (p: MerchantProductItem) => {
    setDeleteProductTarget(p);
    setIsDeleteModalOpen(true);
  };

  // Barcode Thermal Sticker Modal Handler
  const handlePrintBarcode = (p: MerchantProductItem) => {
    setBarcodeProduct(p);
    setIsBarcodeModalOpen(true);
  };

  return (
    <div className="space-y-6">
      {/* Top Breadcrumb & Store Badge */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-1.5 text-xs text-slate-500 mb-1.5">
            <Link href="/merchant/overview" className="hover:text-slate-700 dark:hover:text-slate-300 transition-colors">
              Overview
            </Link>
            <ChevronRight className="h-3 w-3 text-slate-400" />
            <span className="text-slate-700 dark:text-slate-300 font-medium">My Store Products</span>
          </div>

          <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-slate-100 dark:bg-navy-900 text-[11px] font-semibold text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-white/10 mb-2">
            <Store className="h-3 w-3 text-emerald-500" />
            <span>Your Store ({storeName})</span>
          </div>

          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-navy-900 dark:text-white">
            My Store Products
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1 max-w-2xl">
            Manage the products you sell, update prices, monitor stock, and keep your storefront ready for customers.
          </p>
        </div>

        {/* Top Action Buttons: Request Restock/Return + Add Products */}
        <div className="flex flex-wrap items-center gap-2.5 w-full sm:w-auto shrink-0">
          <button
            type="button"
            onClick={() => {
              if (products.length > 0) {
                handleOpenManageStock(products[0], 'RESTOCK');
              } else {
                onTriggerToast('Please add products first before requesting restock or returns.');
              }
            }}
            className="px-4 py-2.5 bg-slate-100 dark:bg-navy-800 hover:bg-slate-200 dark:hover:bg-navy-700 text-navy-900 dark:text-white rounded-xl text-xs font-bold flex items-center justify-center gap-2 border border-slate-200/80 dark:border-white/10 transition-all cursor-pointer shadow-xs active:scale-95"
          >
            <ArrowUpRight className="h-4 w-4 text-emerald-500" />
            <span>Request Restock / Return</span>
          </button>

          <Link
            href="/merchant/products/new"
            className="px-4 py-2.5 bg-orange-600 hover:bg-orange-500 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-2 shadow-md shadow-orange-500/20 transition-all cursor-pointer active:scale-95"
          >
            <Plus className="h-4 w-4" />
            <span>Add Products</span>
          </Link>
        </div>
      </div>

      {/* 4 Stat Cards */}
      <ProductStatsGrid stats={stats} />

      {/* Main Content Card Container */}
      <div className="rounded-2xl border border-slate-200/80 dark:border-white/10 bg-white dark:bg-navy-900/60 shadow-xs p-4 sm:p-5 space-y-4">
        {/* Status Filter Tabs (Published, Drafts, Out of Stock, Stock Requests, All) */}
        <ProductStatusTabs
          activeTab={activeTab}
          onTabChange={(tab) => {
            setActiveTab(tab);
            setSelectedIds([]);
          }}
          counts={counts}
        />

        {/* Condition: If Tab is STOCK_REQUESTS, render StockRequestsTable */}
        {activeTab === 'STOCK_REQUESTS' ? (
          <StockRequestsTable
            requests={stockRequests}
            onApproveRequest={(id) => onApproveStockRequest?.(id)}
            onCancelRequest={(id) => onCancelStockRequest?.(id)}
          />
        ) : (
          <>
            {/* Toolbar with Admin-style Bulk Actions: Search, Category, Sort, Grid/List view */}
            <ProductToolbar
              searchQuery={searchQuery}
              onSearchChange={setSearchQuery}
              selectedCategory={selectedCategory}
              onCategoryChange={setSelectedCategory}
              categories={categories}
              sortOption={sortOption}
              onSortChange={setSortOption}
              viewMode={viewMode}
              onViewModeChange={setViewMode}
              selectedCount={selectedIds.length}
              activeTab={activeTab}
              onBulkPublish={() => {
                onBulkUpdateStatus(selectedIds, 'PUBLISHED');
                setSelectedIds([]);
              }}
              onBulkDraft={() => {
                onBulkUpdateStatus(selectedIds, 'DRAFT');
                setSelectedIds([]);
              }}
              onBulkDelete={() => {
                onBulkDelete(selectedIds);
                setSelectedIds([]);
              }}
              onClearSelection={() => setSelectedIds([])}
            />

            {/* Products View (List vs Grid) */}
            {filteredProducts.length === 0 ? (
              <div className="rounded-xl border border-dashed border-slate-200 dark:border-white/10 bg-slate-50/50 dark:bg-navy-950/40 p-12 text-center">
                <PackageOpen className="h-10 w-10 text-slate-400 dark:text-slate-600 mx-auto mb-3" />
                <h3 className="text-sm font-semibold text-navy-900 dark:text-white">No products found</h3>
                <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
                  {searchQuery || selectedCategory !== 'ALL'
                    ? 'Try adjusting your search query or category filters.'
                    : 'No products in this tab. Click "+ Add Products" above to create one.'}
                </p>
              </div>
            ) : viewMode === 'LIST' ? (
              <ProductTable
                products={paginatedProducts}
                selectedIds={selectedIds}
                merchantCode={merchantCode}
                onToggleSelect={handleToggleSelect}
                onToggleSelectAll={handleToggleSelectAll}
                onToggleStatus={onToggleStatus}
                onManageStock={handleOpenManageStock}
                onViewDetails={handleViewDetails}
                onEditProduct={handleOpenEdit}
                onPrintBarcode={handlePrintBarcode}
                onRequestDelete={handleRequestDelete}
              />
            ) : (
              <ProductGrid
                products={paginatedProducts}
                selectedIds={selectedIds}
                onToggleSelect={handleToggleSelect}
                onToggleStatus={onToggleStatus}
                onManageStock={handleOpenManageStock}
                onViewDetails={handleViewDetails}
                onEditProduct={handleOpenEdit}
                onPrintBarcode={handlePrintBarcode}
                onRequestDelete={handleRequestDelete}
              />
            )}

            {/* Pagination Controls Bar */}
            {filteredProducts.length > 0 && (
              <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-4 border-t border-slate-200/80 dark:border-white/10 text-xs text-slate-500 dark:text-slate-400">
                <div className="flex items-center gap-2">
                  <span>
                    Showing <strong className="text-navy-900 dark:text-white font-mono">{(currentPage - 1) * pageSize + 1}</strong> to{' '}
                    <strong className="text-navy-900 dark:text-white font-mono">
                      {Math.min(currentPage * pageSize, filteredProducts.length)}
                    </strong>{' '}
                    of <strong className="text-navy-900 dark:text-white font-mono">{filteredProducts.length}</strong> products
                  </span>
                </div>

                <div className="flex items-center gap-4">
                  {/* Rows per page dropdown */}
                  <div className="flex items-center gap-1.5">
                    <span>Rows per page:</span>
                    <select
                      value={pageSize}
                      onChange={(e) => {
                        setPageSize(Number(e.target.value));
                        setCurrentPage(1);
                      }}
                      className="rounded-lg border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-navy-950 px-2.5 py-1 text-xs font-semibold text-navy-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-orange-500 cursor-pointer"
                    >
                      <option value={10}>10</option>
                      <option value={25}>25</option>
                      <option value={50}>50</option>
                      <option value={100}>100</option>
                    </select>
                  </div>

                  {/* Page navigation buttons */}
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                      disabled={currentPage === 1}
                      className="p-1.5 rounded-lg border border-slate-200 dark:border-white/10 bg-white dark:bg-navy-900 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-navy-800 disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer"
                      title="Previous Page"
                      aria-label="Previous Page"
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </button>

                    {/* Page numbers */}
                    {Array.from({ length: totalPages }, (_, i) => i + 1)
                      .filter((page) => {
                        if (totalPages <= 5) return true;
                        if (page === 1 || page === totalPages) return true;
                        return Math.abs(page - currentPage) <= 1;
                      })
                      .map((page, idx, arr) => {
                        const prevPage = arr[idx - 1];
                        const showEllipsis = prevPage && page - prevPage > 1;
                        return (
                          <React.Fragment key={page}>
                            {showEllipsis && <span className="px-1 text-slate-400">...</span>}
                            <button
                              type="button"
                              onClick={() => setCurrentPage(page)}
                              className={`min-w-[28px] h-7 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
                                currentPage === page
                                  ? 'bg-orange-600 text-white shadow-xs'
                                  : 'border border-slate-200 dark:border-white/10 bg-white dark:bg-navy-900 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-navy-800'
                              }`}
                            >
                              {page}
                            </button>
                          </React.Fragment>
                        );
                      })}

                    <button
                      type="button"
                      onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                      disabled={currentPage === totalPages}
                      className="p-1.5 rounded-lg border border-slate-200 dark:border-white/10 bg-white dark:bg-navy-900 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-navy-800 disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer"
                      title="Next Page"
                      aria-label="Next Page"
                    >
                      <ChevronRight className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Floating Bulk Action Bar */}
      <ProductBulkActionBar
        selectedCount={selectedIds.length}
        onClearSelection={() => setSelectedIds([])}
        onBulkPublish={() => {
          onBulkUpdateStatus(selectedIds, 'PUBLISHED');
          setSelectedIds([]);
        }}
        onBulkDraft={() => {
          onBulkUpdateStatus(selectedIds, 'DRAFT');
          setSelectedIds([]);
        }}
        onBulkDelete={() => {
          onBulkDelete(selectedIds);
          setSelectedIds([]);
        }}
      />

      {/* Manage Stock / Inbound Restock & Return Request Modal */}
      <ManageStockModal
        isOpen={isStockModalOpen}
        product={stockModalProduct}
        products={products}
        initialMode={stockModalInitialMode}
        onClose={() => setIsStockModalOpen(false)}
        onSubmitRequest={(payload) => {
          if (onRequestStockOperation) {
            onRequestStockOperation(payload);
          } else {
            onRequestStockAdd?.(payload.productId, payload.requestedQty, payload.note);
          }
        }}
      />

      {/* Delete Confirmation Popup Modal with Restore to Store button */}
      <DeleteConfirmModal
        isOpen={isDeleteModalOpen}
        product={deleteProductTarget}
        onClose={() => {
          setIsDeleteModalOpen(false);
          setDeleteProductTarget(null);
        }}
        onConfirmDelete={(id) => {
          onDeleteProduct(id);
          setIsDeleteModalOpen(false);
          setDeleteProductTarget(null);
        }}
        onRestore={(id) => {
          onToggleStatus(id);
          setIsDeleteModalOpen(false);
          setDeleteProductTarget(null);
        }}
      />

      {/* Barcode Thermal Label Sticker Modal */}
      <PrintBarcodeModal
        isOpen={isBarcodeModalOpen}
        product={barcodeProduct}
        storeName={storeName}
        onClose={() => {
          setIsBarcodeModalOpen(false);
          setBarcodeProduct(null);
        }}
        onTriggerToast={onTriggerToast}
      />
    </div>
  );
}
