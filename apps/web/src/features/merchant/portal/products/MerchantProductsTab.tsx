'use client';

import React, { useState, useMemo, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Store, Plus, ChevronRight, PackageOpen } from 'lucide-react';
import { MerchantOrderItem, MerchantProductItem } from '../types';
import {
  ProductFilterTab,
  ProductSortOption,
  ProductViewMode,
  ProductStats,
  StockRequestItem,
} from './types';
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
  const isPublished = p.status === 'PUBLISHED' || (!p.status && p.stock > 0);
  return (
    !isPublished &&
    (!p.bin || p.bin === 'Pending Approval' || p.bin === 'Assigned on intake')
  );
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

  // Tab counts (Pending Approval products are strictly isolated into the Pending Approval tab)
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

  // Selection handlers
  const handleToggleSelect = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handleToggleSelectAll = () => {
    if (selectedIds.length === filteredProducts.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(filteredProducts.map((p) => p.id));
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
  const handleOpenManageStock = (p: MerchantProductItem) => {
    setStockModalProduct(p);
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
            <Link href="/merchant" className="hover:text-slate-300 transition-colors">
              Overview
            </Link>
            <ChevronRight className="h-3 w-3 text-slate-600" />
            <span className="text-slate-300 font-medium">My Store Products</span>
          </div>

          <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-slate-800 text-[11px] font-semibold text-slate-300 border border-slate-700/80 mb-2">
            <Store className="h-3 w-3 text-emerald-400" />
            <span>Your Store ({storeName})</span>
          </div>

          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-100">
            My Store Products
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1 max-w-2xl">
            Manage the products you sell, update prices, monitor stock, and keep your storefront ready for customers.
          </p>
        </div>

        {/* Top Action Button: Navigates to dedicated Add Product page */}
        <div className="w-full sm:w-auto shrink-0">
          <Link
            href="/merchant/products/new"
            className="w-full sm:w-auto px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-2 shadow-lg shadow-emerald-900/30 transition-all cursor-pointer"
          >
            <Plus className="h-4 w-4" />
            <span>Add Products</span>
          </Link>
        </div>
      </div>

      {/* 4 Stat Cards */}
      <ProductStatsGrid stats={stats} />

      {/* Main Content Card Container */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900/40 p-4 sm:p-5 space-y-4">
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
            {/* Toolbar: Search, Category, Sort, Grid/List view */}
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
            />

            {/* Products View (List vs Grid) */}
            {filteredProducts.length === 0 ? (
              <div className="rounded-xl border border-dashed border-slate-800 p-12 text-center">
                <PackageOpen className="h-10 w-10 text-slate-600 mx-auto mb-3" />
                <h3 className="text-sm font-semibold text-slate-200">No products found</h3>
                <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
                  {searchQuery || selectedCategory !== 'ALL'
                    ? 'Try adjusting your search query or category filters.'
                    : 'No products in this tab. Click "+ Add Products" above to create one.'}
                </p>
              </div>
            ) : viewMode === 'LIST' ? (
              <ProductTable
                products={filteredProducts}
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
                products={filteredProducts}
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

      {/* Manage Stock / Inbound Restock Request Modal */}
      <ManageStockModal
        isOpen={isStockModalOpen}
        product={stockModalProduct}
        onClose={() => setIsStockModalOpen(false)}
        onSubmitRequest={(productId, qty, note) => {
          onRequestStockAdd?.(productId, qty, note);
        }}
      />

      {/* Delete Confirmation Popup Modal */}
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
      />

      {/* Barcode Thermal Label Sticker Modal (with working close handler & backdrop click!) */}
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
