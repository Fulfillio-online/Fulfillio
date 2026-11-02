'use client';

import React, { useState, useEffect } from 'react';
import { Package, CheckCircle2, MapPin, Plus, Box } from 'lucide-react';
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
        if (savedProds) {
          const parsed = JSON.parse(savedProds);
          if (Array.isArray(parsed) && parsed.length > 0) setProducts(parsed);
        } else {
          localStorage.setItem(STORAGE_KEY_PRODUCTS, JSON.stringify(INITIAL_PRODUCTS));
        }

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
    window.addEventListener('fulfillio-warehouse-sync', loadFromStorage);
    return () => window.removeEventListener('fulfillio-warehouse-sync', loadFromStorage);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    try {
      localStorage.setItem(STORAGE_KEY_PRODUCTS, JSON.stringify(products));
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
    setProducts((prev) =>
      prev.map((p) =>
        p.id === productId ? { ...p, stock: Math.max(0, p.stock + delta) } : p
      )
    );
  };

  const handleChangeProductBin = (productId: string, nextBinCode: string) => {
    setProducts((prev) =>
      prev.map((p) => (p.id === productId ? { ...p, binCode: nextBinCode } : p))
    );
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
      setProducts((prev) =>
        prev.map((p) =>
          p.id === product.id
            ? {
                ...p,
                status: 'APPROVED',
                binCode: finalBin,
                stock: finalQty,
                submittedAt: 'Approved just now',
              }
            : p
        )
      );

      if (typeof window !== 'undefined') {
        window.dispatchEvent(new Event('fulfillio-warehouse-sync'));
      }

      triggerToast(
        `Approved "${product.title}" (${product.fullSku}) under ${product.merchantCode} with ${finalQty} units in Bin ${finalBin}.`
      );
    } else {
      setProducts((prev) => prev.filter((p) => p.id !== product.id));
      triggerToast(`Rejected product submission "${product.title}" (${product.fullSku}).`);
    }

    setApprovalModalData(null);
  };

  const handleAddProduct = (newProduct: WarehouseProductItem) => {
    setProducts((prev) => [newProduct, ...prev]);
    triggerToast(
      `Added ${newProduct.fullSku} under ${newProduct.merchantCode} in Bin ${newProduct.binCode}.`
    );
  };

  const handleCreateBin = (newBin: WarehouseBin) => {
    setBins((prev) => [newBin, ...prev]);
    triggerToast(`Warehouse Bin ${newBin.code} created successfully.`);
  };

  const approvedCount = products.filter((p) => p.status === 'APPROVED').length;
  const pendingCount = products.filter((p) => p.status === 'PENDING_APPROVAL').length;

  return (
    <div className="space-y-6 text-slate-100">
      {/* Top Header & Sub-Tab Navigation */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-xl">
        <div className="flex items-center gap-2.5">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
            <Package className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-lg sm:text-xl font-bold text-white tracking-tight">
              Warehouse Master Product &amp; Bin Registry
            </h2>
            <p className="text-xs sm:text-sm text-slate-400">
              Multi-merchant 2-part SKU catalog, inbound product approvals, and physical bin slotting
            </p>
          </div>
        </div>

        {/* 3 Sub-Tabs + Add Product button */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="inline-flex bg-slate-950 p-1 rounded-xl border border-slate-800">
            <button
              type="button"
              onClick={() => handleSelectTab('all')}
              className={`px-3.5 py-2 rounded-lg text-xs sm:text-sm font-semibold transition-all flex items-center gap-2 cursor-pointer ${
                subTab === 'all'
                  ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-600/25'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Package className="w-4 h-4" />
              <span>All Products</span>
              <span className="px-1.5 py-0.5 text-[11px] rounded-md bg-slate-900/70 text-emerald-300 font-mono">
                {approvedCount}
              </span>
            </button>

            <button
              type="button"
              onClick={() => handleSelectTab('approval')}
              className={`px-3.5 py-2 rounded-lg text-xs sm:text-sm font-semibold transition-all flex items-center gap-2 cursor-pointer ${
                subTab === 'approval'
                  ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-600/25'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>Pending Approval</span>
              {pendingCount > 0 && (
                <span className="px-1.5 py-0.5 text-[11px] rounded-md bg-amber-500/20 border border-amber-500/40 text-amber-300 font-mono">
                  {pendingCount}
                </span>
              )}
            </button>

            <button
              type="button"
              onClick={() => handleSelectTab('bins')}
              className={`px-3.5 py-2 rounded-lg text-xs sm:text-sm font-semibold transition-all flex items-center gap-2 cursor-pointer ${
                subTab === 'bins'
                  ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-600/25'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <MapPin className="w-4 h-4" />
              <span>Warehouse Bins</span>
              <span className="px-1.5 py-0.5 text-[11px] rounded-md bg-slate-900/70 text-slate-300 font-mono">
                {bins.length}
              </span>
            </button>
          </div>

          <button
            type="button"
            onClick={() => setAddProductModalOpen(true)}
            className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs sm:text-sm font-semibold flex items-center gap-2 shadow-lg shadow-emerald-600/20 transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>+ Add Product (Under Merchant)</span>
          </button>
        </div>
      </div>

      {/* Feedback Toast Banner */}
      {bannerMessage && (
        <div className="flex items-center justify-between gap-3 px-4 py-3 rounded-xl bg-emerald-500/15 border border-emerald-500/40 text-emerald-300 text-sm">
          <div className="flex items-center gap-2.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{bannerMessage}</span>
          </div>
          <button
            type="button"
            onClick={() => setBannerMessage(null)}
            className="text-xs text-emerald-400 hover:text-emerald-200 cursor-pointer"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* 4 Summary Stats Cards */}
      <ProductsStatsOverview
        products={products}
        bins={bins}
        onSelectTab={handleSelectTab}
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
        />
      )}

      {subTab === 'approval' && (
        <ProductsApprovalTab
          products={products}
          bins={bins}
          onOpenApprovalModal={(mode, product, selectedBin) =>
            setApprovalModalData({ mode, product, selectedBin })
          }
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
