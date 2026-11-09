'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Package, CheckCircle2, Plus } from 'lucide-react';
import {
  WarehouseBin,
  WarehouseProductItem,
  WarehouseProductSubTab,
} from './types';
import {
  INITIAL_BINS,
  INITIAL_PRODUCTS,
  STORAGE_KEY_BINS,
  STORAGE_KEY_PRODUCTS,
} from './mockData';
import { ProductsStatsOverview } from './components/ProductsStatsOverview';
import { ProductsCatalogTab } from './components/tabs/ProductsCatalogTab';
import { ProductsApprovalTab } from './components/tabs/ProductsApprovalTab';
import { WarehouseBinsTab } from './components/tabs/WarehouseBinsTab';
import { StockAdjustModal } from './components/modals/StockAdjustModal';
import { ApprovalActionModal } from './components/modals/ApprovalActionModal';
import { AddProductModal } from './components/modals/AddProductModal';
import { CreateBinModal } from './components/modals/CreateBinModal';
import {
  reconcileAdminProductsWithMerchant,
  syncAdminProductsToMerchant,
} from '@/lib/warehouseSync';

export interface ProductsManagerProps {
  activeTab?: WarehouseProductSubTab;
  onTabChange?: (tab: WarehouseProductSubTab) => void;
}

export function ProductsManager({
  activeTab = 'all',
  onTabChange,
}: ProductsManagerProps) {
  const [subTab, setSubTab] = useState<WarehouseProductSubTab>(activeTab);
  const [products, setProducts] = useState<WarehouseProductItem[]>(INITIAL_PRODUCTS);
  const [bins, setBins] = useState<WarehouseBin[]>(INITIAL_BINS);
  const [hydrated, setHydrated] = useState(false);

  // Toast Banner
  const [bannerMessage, setBannerMessage] = useState<string | null>(null);
  const triggerToast = (msg: string) => {
    setBannerMessage(msg);
    setTimeout(() => {
      setBannerMessage((prev) => (prev === msg ? null : prev));
    }, 4000);
  };

  // Modals
  const [stockAdjustProduct, setStockAdjustProduct] = useState<WarehouseProductItem | null>(null);
  const [approvalModalData, setApprovalModalData] = useState<{
    mode: 'APPROVE' | 'REJECT';
    product: WarehouseProductItem;
    selectedBin: string;
  } | null>(null);
  const [addProductModalOpen, setAddProductModalOpen] = useState(false);
  const [newBinModalOpen, setNewBinModalOpen] = useState(false);

  // Hydrate & sync with localStorage
  useEffect(() => {
    const loadFromStorage = () => {
      try {
        const savedProds = localStorage.getItem(STORAGE_KEY_PRODUCTS);
        let baseProds = INITIAL_PRODUCTS;
        if (savedProds) {
          const parsed = JSON.parse(savedProds);
          if (Array.isArray(parsed) && parsed.length > 0) {
            baseProds = parsed;
          }
        } else {
          localStorage.setItem(STORAGE_KEY_PRODUCTS, JSON.stringify(INITIAL_PRODUCTS));
        }
        const reconciled = reconcileAdminProductsWithMerchant(baseProds);
        setProducts(reconciled);

        const savedBins = localStorage.getItem(STORAGE_KEY_BINS);
        if (savedBins) {
          const parsedBins = JSON.parse(savedBins);
          if (Array.isArray(parsedBins) && parsedBins.length > 0) setBins(parsedBins);
        } else {
          localStorage.setItem(STORAGE_KEY_BINS, JSON.stringify(INITIAL_BINS));
        }
      } catch {
        // ignore storage errors
      }
      setHydrated(true);
    };

    loadFromStorage();

    const handleWarehouseSync = (e: Event) => {
      const ce = e as CustomEvent;
      // Do not sync if this event was dispatched by this component itself
      if (ce.detail?.source === 'ProductsManager') return;
      loadFromStorage();
    };

    window.addEventListener('fulfillio-warehouse-sync', handleWarehouseSync);
    window.addEventListener('storage', handleWarehouseSync);
    return () => {
      window.removeEventListener('fulfillio-warehouse-sync', handleWarehouseSync);
      window.removeEventListener('storage', handleWarehouseSync);
    };
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    try {
      localStorage.setItem(STORAGE_KEY_PRODUCTS, JSON.stringify(products));
      syncAdminProductsToMerchant(products);
    } catch {
      // ignore
    }
  }, [products, hydrated]);

  useEffect(() => {
    if (!hydrated) return;
    try {
      localStorage.setItem(STORAGE_KEY_BINS, JSON.stringify(bins));
    } catch {
      // ignore
    }
  }, [bins, hydrated]);

  useEffect(() => {
    setSubTab(activeTab);
  }, [activeTab]);

  const handleSelectTab = (tab: WarehouseProductSubTab) => {
    setSubTab(tab);
    onTabChange?.(tab);
  };

  const handleAdjustStock = (productId: string, delta: number) => {
    setProducts((prev) => {
      const next = prev.map((p) =>
        p.id === productId ? { ...p, stock: Math.max(0, p.stock + delta) } : p
      );
      try {
        localStorage.setItem(STORAGE_KEY_PRODUCTS, JSON.stringify(next));
        syncAdminProductsToMerchant(next);
      } catch {
        // ignore
      }
      return next;
    });
  };

  const handleChangeProductBin = (productId: string, nextBinCode: string) => {
    setProducts((prev) => {
      const next = prev.map((p) => (p.id === productId ? { ...p, binCode: nextBinCode } : p));
      try {
        localStorage.setItem(STORAGE_KEY_PRODUCTS, JSON.stringify(next));
        syncAdminProductsToMerchant(next);
      } catch {
        // ignore
      }
      return next;
    });
    const prod = products.find((p) => p.id === productId);
    if (prod) {
      triggerToast(`Updated bin location for ${prod.fullSku} to ${nextBinCode}`);
    }
  };

  const handleConfirmApproval = (
    mode: 'APPROVE' | 'REJECT',
    product: WarehouseProductItem,
    finalQty: number,
    finalBin: string
  ) => {
    if (mode === 'APPROVE') {
      setProducts((prev) => {
        const next = prev.map((p) =>
          p.id === product.id
            ? {
                ...p,
                status: 'APPROVED' as const,
                binCode: finalBin,
                stock: finalQty,
                submittedAt: 'Approved just now',
              }
            : p
        );
        try {
          localStorage.setItem(STORAGE_KEY_PRODUCTS, JSON.stringify(next));
          syncAdminProductsToMerchant(next);
        } catch {
          // ignore
        }
        return next;
      });

      if (typeof window !== 'undefined') {
        window.dispatchEvent(
          new CustomEvent('fulfillio-warehouse-sync', { detail: { source: 'ProductsManager' } })
        );
      }

      triggerToast(
        `Approved "${product.title}" (${product.fullSku}) under ${product.merchantCode} with ${finalQty} units in Bin ${finalBin}.`
      );
    } else {
      setProducts((prev) => {
        const next = prev.filter((p) => p.id !== product.id);
        try {
          localStorage.setItem(STORAGE_KEY_PRODUCTS, JSON.stringify(next));
          syncAdminProductsToMerchant(next, [product]);
        } catch {
          // ignore
        }
        return next;
      });
      triggerToast(`Rejected product submission "${product.title}" (${product.fullSku}).`);
      if (typeof window !== 'undefined') {
        window.dispatchEvent(
          new CustomEvent('fulfillio-warehouse-sync', { detail: { source: 'ProductsManager' } })
        );
      }
    }

    setApprovalModalData(null);
  };

  const handleBulkApprove = (
    productIds: string[],
    binSelections: Record<string, string>
  ) => {
    const idSet = new Set(productIds);
    setProducts((prev) => {
      const next = prev.map((p) =>
        idSet.has(p.id)
          ? {
              ...p,
              status: 'APPROVED' as const,
              binCode: binSelections[p.id] || p.binCode || bins[0]?.code || 'A-01-02',
              submittedAt: 'Approved just now',
            }
          : p
      );
      try {
        localStorage.setItem(STORAGE_KEY_PRODUCTS, JSON.stringify(next));
        syncAdminProductsToMerchant(next);
      } catch {
        // ignore
      }
      return next;
    });

    triggerToast(`Successfully approved ${productIds.length} products into active catalog.`);
    if (typeof window !== 'undefined') {
      window.dispatchEvent(
        new CustomEvent('fulfillio-warehouse-sync', { detail: { source: 'ProductsManager' } })
      );
    }
  };

  const handleBulkReject = (productIds: string[]) => {
    const idSet = new Set(productIds);
    setProducts((prev) => {
      const removed = prev.filter((p) => idSet.has(p.id));
      const next = prev.filter((p) => !idSet.has(p.id));
      try {
        localStorage.setItem(STORAGE_KEY_PRODUCTS, JSON.stringify(next));
        syncAdminProductsToMerchant(next, removed);
      } catch {
        // ignore
      }
      return next;
    });

    triggerToast(`Rejected ${productIds.length} product submissions.`);
    if (typeof window !== 'undefined') {
      window.dispatchEvent(
        new CustomEvent('fulfillio-warehouse-sync', { detail: { source: 'ProductsManager' } })
      );
    }
  };

  const handleAddProduct = (newProduct: WarehouseProductItem) => {
    setProducts((prev) => {
      const next = [newProduct, ...prev];
      try {
        localStorage.setItem(STORAGE_KEY_PRODUCTS, JSON.stringify(next));
        syncAdminProductsToMerchant(next);
      } catch {
        // ignore
      }
      return next;
    });
    triggerToast(
      `Added ${newProduct.fullSku} under ${newProduct.merchantCode} in Bin ${newProduct.binCode}.`
    );
    if (typeof window !== 'undefined') {
      window.dispatchEvent(
        new CustomEvent('fulfillio-warehouse-sync', { detail: { source: 'ProductsManager' } })
      );
    }
  };

  const handleMoveToDraft = (productId: string) => {
    const prod = products.find((p) => p.id === productId);
    setProducts((prev) => {
      const next = prev.map((p) =>
        p.id === productId ? { ...p, status: 'DRAFT' as const, isDraft: true } : p
      );
      try {
        localStorage.setItem(STORAGE_KEY_PRODUCTS, JSON.stringify(next));
      } catch {
        // ignore
      }
      return next;
    });
    if (prod) {
      triggerToast(`Product "${prod.title}" moved to Draft. You can restore it anytime.`);
    }
    if (typeof window !== 'undefined') {
      window.dispatchEvent(
        new CustomEvent('fulfillio-warehouse-sync', { detail: { source: 'ProductsManager' } })
      );
    }
  };

  const handleRestoreProduct = (productId: string) => {
    const prod = products.find((p) => p.id === productId);
    setProducts((prev) => {
      const next = prev.map((p) =>
        p.id === productId ? { ...p, status: 'APPROVED' as const, isDraft: false } : p
      );
      try {
        localStorage.setItem(STORAGE_KEY_PRODUCTS, JSON.stringify(next));
      } catch {
        // ignore
      }
      return next;
    });
    if (prod) {
      triggerToast(`Product "${prod.title}" restored to active catalog.`);
    }
    if (typeof window !== 'undefined') {
      window.dispatchEvent(
        new CustomEvent('fulfillio-warehouse-sync', { detail: { source: 'ProductsManager' } })
      );
    }
  };

  const handleBulkMoveToDraft = (productIds: string[]) => {
    const idSet = new Set(productIds);
    setProducts((prev) => {
      const next = prev.map((p) =>
        idSet.has(p.id) ? { ...p, status: 'DRAFT' as const, isDraft: true } : p
      );
      try {
        localStorage.setItem(STORAGE_KEY_PRODUCTS, JSON.stringify(next));
      } catch {
        // ignore
      }
      return next;
    });
    triggerToast(`Moved ${productIds.length} products to Draft.`);
    if (typeof window !== 'undefined') {
      window.dispatchEvent(
        new CustomEvent('fulfillio-warehouse-sync', { detail: { source: 'ProductsManager' } })
      );
    }
  };

  const handleBulkRestore = (productIds: string[]) => {
    const idSet = new Set(productIds);
    setProducts((prev) => {
      const next = prev.map((p) =>
        idSet.has(p.id) ? { ...p, status: 'APPROVED' as const, isDraft: false } : p
      );
      try {
        localStorage.setItem(STORAGE_KEY_PRODUCTS, JSON.stringify(next));
      } catch {
        // ignore
      }
      return next;
    });
    triggerToast(`Restored ${productIds.length} products to active catalog.`);
    if (typeof window !== 'undefined') {
      window.dispatchEvent(
        new CustomEvent('fulfillio-warehouse-sync', { detail: { source: 'ProductsManager' } })
      );
    }
  };

  const handleDeleteProduct = (productId: string) => {
    const prod = products.find((p) => p.id === productId);
    setProducts((prev) => {
      const removed = prev.filter((p) => p.id === productId);
      const next = prev.filter((p) => p.id !== productId);
      try {
        localStorage.setItem(STORAGE_KEY_PRODUCTS, JSON.stringify(next));
        syncAdminProductsToMerchant(next, removed);
      } catch {
        // ignore
      }
      return next;
    });
    if (prod) {
      triggerToast(`Product "${prod.title}" (${prod.fullSku}) deleted successfully.`);
    }
    if (typeof window !== 'undefined') {
      window.dispatchEvent(
        new CustomEvent('fulfillio-warehouse-sync', { detail: { source: 'ProductsManager' } })
      );
    }
  };

  const handleDeleteProducts = (productIds: string[]) => {
    const idSet = new Set(productIds);
    const count = productIds.length;
    setProducts((prev) => {
      const removed = prev.filter((p) => idSet.has(p.id));
      const next = prev.filter((p) => !idSet.has(p.id));
      try {
        localStorage.setItem(STORAGE_KEY_PRODUCTS, JSON.stringify(next));
        syncAdminProductsToMerchant(next, removed);
      } catch {
        // ignore
      }
      return next;
    });
    triggerToast(`Successfully deleted ${count} products.`);
    if (typeof window !== 'undefined') {
      window.dispatchEvent(
        new CustomEvent('fulfillio-warehouse-sync', { detail: { source: 'ProductsManager' } })
      );
    }
  };

  const handleCreateBin = (newBin: WarehouseBin) => {
    setBins((prev) => {
      const next = [newBin, ...prev];
      try {
        localStorage.setItem(STORAGE_KEY_BINS, JSON.stringify(next));
      } catch {
        // ignore
      }
      return next;
    });
    triggerToast(`Warehouse Bin ${newBin.code} created successfully.`);
  };

  return (
    <div className="space-y-6 text-navy-800 dark:text-navy-800 dark:text-white">
      {/* Top Header & Sub-Tab Navigation */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 bg-white/90 dark:bg-navy-900/90 border border-slate-200 dark:border-white/10 rounded-2xl p-5 shadow-xl">
        <div className="flex items-center gap-2.5">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
            <Package className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-navy-900 dark:text-white tracking-tight">
              Warehouse Master Product &amp; Bin Registry
            </h1>
            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300">
              Multi-merchant 2-part SKU catalog, inbound product approvals, and physical bin slotting
            </p>
          </div>
        </div>

        {/* Action Button */}
        <div className="flex items-center gap-2">
          <Link
            href="/admin/products/new"
            className="px-4 py-2.5 rounded-xl bg-orange-600 hover:bg-orange-700 text-white text-xs sm:text-sm font-semibold flex items-center gap-2 shadow-lg shadow-orange-500/25 transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Add Product (Under Merchant)</span>
          </Link>
        </div>
      </div>

      {/* Feedback Toast Banner */}
      {bannerMessage && (
        <div className="flex items-center justify-between gap-3 px-4 py-3 rounded-xl bg-emerald-500/15 border border-emerald-500/40 text-emerald-700 dark:text-emerald-300 text-sm">
          <div className="flex items-center gap-2.5">
            <CheckCircle2 className="w-4 h-4 text-orange-600 dark:text-orange-400 shrink-0" />
            <span>{bannerMessage}</span>
          </div>
          <button
            type="button"
            onClick={() => setBannerMessage(null)}
            className="text-xs text-orange-600 dark:text-orange-400 hover:text-orange-800 dark:hover:text-orange-200 cursor-pointer"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* 4 Summary Stats Cards */}
      <ProductsStatsOverview
        products={products}
        bins={bins}
      />

      {/* Active Tab View */}
      {subTab === 'all' && (
        <ProductsCatalogTab
          products={products}
          bins={bins}
          onAdjustStock={handleAdjustStock}
          onOpenStockAdjustModal={(prod) => setStockAdjustProduct(prod)}
          onChangeProductBin={handleChangeProductBin}
          onOpenAddProduct={() => setAddProductModalOpen(true)}
          onMoveToDraft={handleMoveToDraft}
          onRestoreProduct={handleRestoreProduct}
          onPermanentDelete={handleDeleteProduct}
          onBulkMoveToDraft={handleBulkMoveToDraft}
          onBulkRestore={handleBulkRestore}
          onBulkPermanentDelete={handleDeleteProducts}
          onDeleteProduct={handleDeleteProduct}
          onDeleteProducts={handleDeleteProducts}
        />
      )}

      {subTab === 'approval' && (
        <ProductsApprovalTab
          products={products}
          bins={bins}
          onOpenApprovalModal={(mode, product, selectedBin) =>
            setApprovalModalData({ mode, product, selectedBin })
          }
          onBulkApprove={handleBulkApprove}
          onBulkReject={handleBulkReject}
          onSwitchToAllTab={() => handleSelectTab('all')}
        />
      )}

      {subTab === 'bins' && (
        <WarehouseBinsTab
          bins={bins}
          products={products}
          onOpenCreateBinModal={() => setNewBinModalOpen(true)}
        />
      )}

      {/* Modals */}
      <StockAdjustModal
        isOpen={Boolean(stockAdjustProduct)}
        onClose={() => setStockAdjustProduct(null)}
        product={stockAdjustProduct}
        onAdjustStock={(id, delta) => handleAdjustStock(id, delta)}
      />

      <ApprovalActionModal
        isOpen={Boolean(approvalModalData)}
        onClose={() => setApprovalModalData(null)}
        approvalData={approvalModalData}
        bins={bins}
        onConfirm={handleConfirmApproval}
      />

      <AddProductModal
        isOpen={addProductModalOpen}
        onClose={() => setAddProductModalOpen(false)}
        bins={bins}
        onAddProduct={handleAddProduct}
      />

      <CreateBinModal
        isOpen={newBinModalOpen}
        onClose={() => setNewBinModalOpen(false)}
        bins={bins}
        onCreateBin={handleCreateBin}
      />
    </div>
  );
}

export default ProductsManager;
