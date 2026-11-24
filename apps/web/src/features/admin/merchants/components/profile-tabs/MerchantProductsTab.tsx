'use client';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  WarehouseBin,
  WarehouseProductItem,
} from '@/features/admin/products/types';
import {
  INITIAL_BINS,
  INITIAL_PRODUCTS,
  STORAGE_KEY_BINS,
  STORAGE_KEY_PRODUCTS,
  cleanBinCode,
} from '@/features/admin/products/mockData';
import { ProductsStatsOverview } from '@/features/admin/products/components/ProductsStatsOverview';
import { ProductsCatalogTab } from '@/features/admin/products/components/tabs/ProductsCatalogTab';
import { StockAdjustModal, VariantStockItemDraft } from '@/features/admin/products/components/modals/StockAdjustModal';
import { ApprovalActionModal } from '@/features/admin/products/components/modals/ApprovalActionModal';
import { AcceptStockModal } from '@/features/admin/products/components/modals/AcceptStockModal';
import { AddProductModal } from '@/features/admin/products/components/modals/AddProductModal';
import { BulkSlotAssignment } from '@/features/admin/products/components/modals/BulkApprovalModal';
import {
  reconcileAdminProductsWithMerchant,
  syncAdminProductsToMerchant,
  approveProductInDatabase,
  acceptStockInDatabase,
  deleteProductFromDatabase,
  rejectProductInDatabase,
} from '@/lib/warehouseSync';
import { MerchantRecord, MerchantProductItem } from '../../types';

export interface MerchantProductsTabProps {
  merchant: MerchantRecord;
  productsList: MerchantProductItem[];
  onAdjustStock: (productId: string, delta: number) => void;
  onAddProduct: (newProduct: MerchantProductItem) => void;
  onApproveProduct: (productId: string, finalQty: number, finalBin: string) => void;
  onRejectProduct: (productId: string) => void;
  onNavigateSubTab?: (tab: any) => void;
}

export function MerchantProductsTab({
  merchant,
  productsList,
  onAdjustStock,
  onAddProduct,
  onApproveProduct,
  onRejectProduct,
  onNavigateSubTab,
}: MerchantProductsTabProps) {
  // Load bins
  const [bins, setBins] = useState<WarehouseBin[]>(INITIAL_BINS);

  // Load products from warehouse storage
  const [products, setProducts] = useState<WarehouseProductItem[]>(() => {
    if (typeof window !== 'undefined') {
      try {
        const stored = localStorage.getItem(STORAGE_KEY_PRODUCTS);
        if (stored) {
          const parsed = JSON.parse(stored);
          if (Array.isArray(parsed) && parsed.length > 0) {
            return reconcileAdminProductsWithMerchant(parsed);
          }
        }
      } catch {}
    }
    return reconcileAdminProductsWithMerchant(INITIAL_PRODUCTS);
  });

  // Modal states (identically matched to /admin/products)
  const [stockAdjustProduct, setStockAdjustProduct] = useState<WarehouseProductItem | null>(null);
  const [acceptStockProduct, setAcceptStockProduct] = useState<WarehouseProductItem | null>(null);
  const [approvalModalData, setApprovalModalData] = useState<{
    mode: 'APPROVE' | 'REJECT';
    product: WarehouseProductItem;
    selectedBin: string;
  } | null>(null);
  const [addProductModalOpen, setAddProductModalOpen] = useState(false);

  // Reload handler from storage (with draft-preserving healing identical to ProductsManager)
  const reloadFromStorage = useCallback(() => {
    try {
      const rawBins = localStorage.getItem(STORAGE_KEY_BINS);
      if (rawBins) {
        const parsed = JSON.parse(rawBins);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setBins(parsed.map((b: WarehouseBin) => ({ ...b, code: cleanBinCode(b.code) })));
        }
      }

      const stored = localStorage.getItem(STORAGE_KEY_PRODUCTS);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) {
          const healed = parsed.map((p: any) => {
            const init = INITIAL_PRODUCTS.find((ip) => ip.id === p.id || ip.fullSku === p.fullSku);
            const isDraft = p.status === 'DRAFT' || Boolean(p.isDraft);
            const isPending = !isDraft && p.status === 'PENDING_APPROVAL';
            const isRejected = !isDraft && p.status === 'REJECTED';
            const cleanedBin = isPending
              ? p.binCode || 'Pending Approval'
              : cleanBinCode(p.binCode) || (init ? cleanBinCode(init.binCode) : 'A-01-02');
            const safeStock =
              typeof p.stock === 'number' && !isNaN(p.stock) ? p.stock : (init?.stock ?? 100);
            const safeStatus = isDraft
              ? ('DRAFT' as const)
              : isPending
                ? ('PENDING_APPROVAL' as const)
                : isRejected
                  ? ('REJECTED' as const)
                  : ('APPROVED' as const);
            return {
              ...p,
              binCode: cleanedBin,
              stock: safeStock,
              status: safeStatus,
              isDraft,
            };
          });
          const reconciled = reconcileAdminProductsWithMerchant(healed);
          setProducts((prev) =>
            JSON.stringify(prev) === JSON.stringify(reconciled) ? prev : reconciled
          );
        }
      }
    } catch {}
  }, []);

  useEffect(() => {
    reloadFromStorage();

    // Fetch products directly from PostgreSQL backend to stay in sync with /admin/products
    fetch(`${API_BASE}/inventory/products`)
      .then((res) => (res.ok ? res.json() : null))
      .then((backendProds) => {
        if (backendProds && Array.isArray(backendProds) && backendProds.length > 0) {
          const mappedBackend: WarehouseProductItem[] = backendProds.map((p: any) => {
            const variants = p.variants || [];
            const totalStock = variants.reduce(
              (sum: number, v: any) => sum + (v.inventoryItems?.[0]?.quantityAvailable ?? 0),
              0
            );
            const mCode = p.merchant?.merchantCode || p.merchantCode || 'MC-101';
            const mName = p.merchant?.businessName || `Merchant (${mCode})`;
            const firstVariant = variants[0];
            const rawDbStatus = (p.status || '').trim().toUpperCase();
            const isDraft = rawDbStatus === 'DRAFT';
            const isPending =
              !isDraft &&
              (rawDbStatus === 'PENDING_APPROVAL' ||
                (!rawDbStatus && variants.some((v: any) => v.defaultBinCode === 'Pending Approval')));
            const isApproved =
              !isDraft &&
              !isPending &&
              (rawDbStatus === 'APPROVED' ||
                rawDbStatus === 'PUBLISHED' ||
                rawDbStatus === 'STOCK_STORED' ||
                variants.some(
                  (v: any) =>
                    v.defaultBinCode &&
                    v.defaultBinCode !== 'Pending Approval' &&
                    v.defaultBinCode !== 'Assigned on intake'
                ));

            const computedStatus = isDraft
              ? ('DRAFT' as const)
              : isPending
                ? ('PENDING_APPROVAL' as const)
                : ('APPROVED' as const);

            const assignedBin = isApproved || isDraft || totalStock > 0
              ? firstVariant?.defaultBinCode &&
                firstVariant.defaultBinCode !== 'Pending Approval' &&
                firstVariant.defaultBinCode !== 'Assigned on intake'
                ? firstVariant.defaultBinCode
                : 'A-01-02'
              : 'Pending Approval';

            const stockAccepted = isApproved && totalStock > 0;
            const stockStatus = isApproved
              ? totalStock > 0
                ? ('IN_STOCK' as const)
                : ('AWAITING_STOCK' as const)
              : undefined;

            const variantParts = (firstVariant?.title || '').split(/[/|-]/).map((s: string) => s.trim());
            const color = firstVariant?.attributes?.color || variantParts[0] || 'Standard';
            const size = firstVariant?.attributes?.size || variantParts[1] || 'Standard';

            return {
              id: p.id,
              title: p.title,
              category: (firstVariant?.attributes as any)?.category || 'Fashion',
              merchantCode: mCode,
              merchantName: mName,
              shortSku: p.baseSku,
              fullSku: firstVariant?.sku || `${mCode}-${p.baseSku}-STD`,
              color,
              size,
              binCode: assignedBin,
              stock: totalStock,
              stockAccepted,
              stockStatus,
              price: Number(firstVariant?.price) || 0,
              status: computedStatus,
              isDraft,
              submittedAt: new Date(p.createdAt || Date.now()).toLocaleDateString('en-GB', {
                day: '2-digit',
                month: 'short',
                year: 'numeric',
              }),
              imageUrl: p.imageUrl || '',
              images: p.images || [],
              barcode: firstVariant?.barcode || '',
              description: p.description,
              colors: (firstVariant?.attributes as any)?.allColors || [],
              sizes: (firstVariant?.attributes as any)?.sizes || [],
              variantsList: variants.map((v: any) => ({
                id: v.id,
                sku: v.sku,
                color: v.attributes?.color || v.title?.split('/')[0]?.trim() || '',
                size: v.attributes?.size || v.title?.split('/')[1]?.trim() || '',
                stock: v.inventoryItems?.[0]?.quantityAvailable ?? 0,
                imageUrl: v.imageUrl || p.imageUrl || '',
              })),
            };
          });

          setProducts((prev) => {
            const combined = [...prev];
            for (const bp of mappedBackend) {
              const idx = combined.findIndex(
                (cp) =>
                  cp.id === bp.id ||
                  cp.fullSku === bp.fullSku ||
                  (cp.merchantCode === bp.merchantCode &&
                    cp.shortSku &&
                    bp.shortSku &&
                    cp.shortSku.toUpperCase() === bp.shortSku.toUpperCase())
              );
              if (idx >= 0) {
                combined[idx] = {
                  ...combined[idx],
                  ...bp,
                  status: bp.status,
                  isDraft: bp.isDraft,
                };
              } else {
                combined.unshift(bp);
              }
            }
            if (JSON.stringify(prev) === JSON.stringify(combined)) return prev;
            try {
              localStorage.setItem(STORAGE_KEY_PRODUCTS, JSON.stringify(combined));
            } catch {}
            return combined;
          });
        }
      })
      .catch(() => {});

    const handleSync = (e: Event) => {
      const ce = e as CustomEvent | undefined;
      if (ce?.detail?.source === 'AdminMerchantProductsTab') return;
      reloadFromStorage();
    };
    window.addEventListener('fulfillio-warehouse-sync', handleSync);
    window.addEventListener('storage', handleSync);
    return () => {
      window.removeEventListener('fulfillio-warehouse-sync', handleSync);
      window.removeEventListener('storage', handleSync);
    };
  }, [reloadFromStorage]);

  // Use the single canonical warehouse products list (same source of truth as /admin/products)
  const allMerchantWarehouseProducts = useMemo(() => {
    const list = [...products];
    const hasAnyForMerchant = list.some((wp) => wp.merchantCode === merchant.merchantCode);

    // Only fall back to seed productsList if this merchant has zero products in the warehouse store
    if (!hasAnyForMerchant) {
      productsList
        .filter((p) => p.merchantCode === merchant.merchantCode)
        .forEach((mp) => {
          const shortSku = mp.sku.startsWith(`${mp.merchantCode}-`)
            ? mp.sku.slice(mp.merchantCode.length + 1)
            : mp.sku;
          const isDraft = mp.status === 'DRAFT' || Boolean(mp.isDraft);
          list.unshift({
            id: mp.id,
            title: mp.title,
            category: mp.category,
            merchantCode: mp.merchantCode,
            merchantName: merchant.storeName,
            shortSku,
            fullSku: mp.sku,
            color: mp.color,
            size: mp.size,
            binCode: mp.bin && mp.bin !== 'Pending Approval' ? mp.bin : 'A-01-02',
            stock: mp.stock,
            price: mp.price,
            status: isDraft
              ? 'DRAFT'
              : mp.status === 'PENDING_APPROVAL'
                ? 'PENDING_APPROVAL'
                : 'APPROVED',
            isDraft,
            submittedAt: 'Recently added',
            imageUrl: mp.imageUrl || '',
          });
        });
    }

    return list;
  }, [products, productsList, merchant.merchantCode, merchant.storeName]);

  // Scoped strictly to this merchant for overview statistics
  const merchantOnlyProducts = useMemo(() => {
    return allMerchantWarehouseProducts.filter((p) => p.merchantCode === merchant.merchantCode);
  }, [allMerchantWarehouseProducts, merchant.merchantCode]);

  // 1. Stock Adjustment
  const handleAdjustStock = (productId: string, delta: number) => {
    onAdjustStock(productId, delta);
    setProducts((prev) => {
      const next = prev.map((p) =>
        p.id === productId ? { ...p, stock: Math.max(0, (p.stock || 0) + delta) } : p
      );
      try {
        localStorage.setItem(STORAGE_KEY_PRODUCTS, JSON.stringify(next));
        syncAdminProductsToMerchant(next);
      } catch {}
      return next;
    });
  };

  const handleSaveVariantStocks = (
    productId: string,
    updatedVariants: VariantStockItemDraft[],
    totalStock: number
  ) => {
    setProducts((prev) => {
      const next = prev.map((p) =>
        p.id === productId ? { ...p, stock: totalStock } : p
      );
      try {
        localStorage.setItem(STORAGE_KEY_PRODUCTS, JSON.stringify(next));
        syncAdminProductsToMerchant(next);
      } catch {}
      return next;
    });
    setStockAdjustProduct(null);
  };

  // 2. Change Bin
  const handleChangeProductBin = (productId: string, nextBinCode: string) => {
    setProducts((prev) => {
      const next = prev.map((p) => (p.id === productId ? { ...p, binCode: nextBinCode } : p));
      try {
        localStorage.setItem(STORAGE_KEY_PRODUCTS, JSON.stringify(next));
        syncAdminProductsToMerchant(next);
      } catch {}
      return next;
    });
    const prod = products.find((p) => p.id === productId);
    if (prod) {
      approveProductInDatabase(productId, nextBinCode, prod.stock || 0, (prod.stock || 0) > 0);
    }
  };

  // 3. Confirm Approval (from ApprovalActionModal)
  const handleConfirmApproval = (
    mode: 'APPROVE' | 'REJECT',
    product: WarehouseProductItem,
    finalQty: number,
    finalBin: string,
    acceptStockNow?: boolean,
    rejectionReason?: string
  ) => {
    setApprovalModalData(null);

    if (mode === 'APPROVE') {
      const isStockAccepted = acceptStockNow === true;
      const actualStock = isStockAccepted ? finalQty : 0;

      onApproveProduct(product.id, actualStock, finalBin);

      setProducts((prev) => {
        const next = prev.map((p) =>
          p.id === product.id
            ? {
                ...p,
                status: 'APPROVED' as const,
                binCode: finalBin,
                stock: actualStock,
                stockAccepted: isStockAccepted,
                stockStatus: isStockAccepted ? ('IN_STOCK' as const) : ('AWAITING_STOCK' as const),
                isDraft: false,
                submittedAt: 'Approved just now',
              }
            : p
        );
        try {
          localStorage.setItem(STORAGE_KEY_PRODUCTS, JSON.stringify(next));
          syncAdminProductsToMerchant(next);
        } catch {}
        return next;
      });

      approveProductInDatabase(product.id, finalBin, actualStock, isStockAccepted);
      if (typeof window !== 'undefined') {
        window.dispatchEvent(
          new CustomEvent('fulfillio-warehouse-sync', { detail: { source: 'AdminMerchantProductsTab' } })
        );
      }
    } else {
      const reason = rejectionReason?.trim() || 'Rejected by admin';
      onRejectProduct(product.id);
      setProducts((prev) => {
        const next = prev.map((p) =>
          p.id === product.id
            ? { ...p, status: 'REJECTED' as const, isDraft: false, rejectionReason: reason }
            : p
        );
        try {
          localStorage.setItem(STORAGE_KEY_PRODUCTS, JSON.stringify(next));
          syncAdminProductsToMerchant(next);
        } catch {}
        return next;
      });
      rejectProductInDatabase(product.id, reason).finally(() => {
        if (typeof window !== 'undefined') {
          window.dispatchEvent(
            new CustomEvent('fulfillio-warehouse-sync', { detail: { source: 'AdminMerchantProductsTab' } })
          );
        }
      });
      return;
    }
  };

  // 4. Accept Physical Stock Intake
  const handleAcceptStock = (
    productId: string,
    quantity: number,
    binCode: string,
    challanOrTracking?: string,
    note?: string
  ) => {
    setAcceptStockProduct(null);

    setProducts((prev) => {
      const next = prev.map((p) => {
        if (p.id === productId) {
          const newTotal = (p.stock || 0) + quantity;
          return {
            ...p,
            stock: newTotal,
            binCode: binCode || p.binCode,
            status: 'STOCK_STORED' as const,
            stockAccepted: true,
            stockStatus: 'IN_STOCK' as const,
          };
        }
        return p;
      });
      try {
        localStorage.setItem(STORAGE_KEY_PRODUCTS, JSON.stringify(next));
        syncAdminProductsToMerchant(next);
      } catch {}
      return next;
    });

    acceptStockInDatabase(productId, quantity, binCode, challanOrTracking, note);
    if (typeof window !== 'undefined') {
      window.dispatchEvent(
        new CustomEvent('fulfillio-warehouse-sync', { detail: { source: 'AdminMerchantProductsTab' } })
      );
    }
  };

  // 5. Bulk Approvals
  const handleBulkApproveProducts = (productIds: string[]) => {
    const idSet = new Set(productIds);
    const defaultBin = bins[0]?.code || 'A-01-02';

    productIds.forEach((pid) => {
      const prod = products.find((p) => p.id === pid);
      onApproveProduct(pid, prod?.stock || 0, defaultBin);
      approveProductInDatabase(pid, defaultBin, prod?.stock || 0, (prod?.stock || 0) > 0);
    });

    setProducts((prev) => {
      const next = prev.map((p) => {
        if (!idSet.has(p.id)) return p;
        return {
          ...p,
          status: 'APPROVED' as const,
          isDraft: false,
          binCode: p.binCode && p.binCode !== 'Pending Approval' ? p.binCode : defaultBin,
          submittedAt: 'Approved just now',
        };
      });
      try {
        localStorage.setItem(STORAGE_KEY_PRODUCTS, JSON.stringify(next));
        syncAdminProductsToMerchant(next);
      } catch {}
      return next;
    });

    if (typeof window !== 'undefined') {
      window.dispatchEvent(
        new CustomEvent('fulfillio-warehouse-sync', { detail: { source: 'AdminMerchantProductsTab' } })
      );
    }
  };

  const handleBulkApproveWithSlots = (assignments: BulkSlotAssignment[]) => {
    const slotMap = new Map<string, BulkSlotAssignment>();
    assignments.forEach((a) => slotMap.set(a.productId, a));

    assignments.forEach((a) => {
      onApproveProduct(a.productId, a.qty, a.binCode);
      approveProductInDatabase(a.productId, a.binCode, a.qty, a.qty > 0);
    });

    setProducts((prev) => {
      const next = prev.map((p) => {
        const slot = slotMap.get(p.id);
        if (!slot) return p;
        return {
          ...p,
          status: 'APPROVED' as const,
          isDraft: false,
          binCode: slot.binCode,
          stock: slot.qty,
          submittedAt: 'Approved just now',
        };
      });
      try {
        localStorage.setItem(STORAGE_KEY_PRODUCTS, JSON.stringify(next));
        syncAdminProductsToMerchant(next);
      } catch {}
      return next;
    });

    if (typeof window !== 'undefined') {
      window.dispatchEvent(
        new CustomEvent('fulfillio-warehouse-sync', { detail: { source: 'AdminMerchantProductsTab' } })
      );
    }
  };

  // 6. Bulk Rejections
  const handleBulkRejectProducts = (productIds: string[]) => {
    const idSet = new Set(productIds);
    const reason = 'Bulk rejected by admin';

    productIds.forEach((pid) => {
      onRejectProduct(pid);
      rejectProductInDatabase(pid, reason);
    });

    setProducts((prev) => {
      const next = prev.map((p) =>
        idSet.has(p.id)
          ? { ...p, status: 'REJECTED' as const, isDraft: false, rejectionReason: reason }
          : p
      );
      try {
        localStorage.setItem(STORAGE_KEY_PRODUCTS, JSON.stringify(next));
        syncAdminProductsToMerchant(next);
      } catch {}
      return next;
    });

    if (typeof window !== 'undefined') {
      window.dispatchEvent(
        new CustomEvent('fulfillio-warehouse-sync', { detail: { source: 'AdminMerchantProductsTab' } })
      );
    }
  };

  // 7. Draft / Restore / Delete
  const handleMoveToDraft = (productId: string) => {
    setProducts((prev) => {
      const next = prev.map((p) =>
        p.id === productId ? { ...p, status: 'DRAFT' as const, isDraft: true } : p
      );
      try {
        localStorage.setItem(STORAGE_KEY_PRODUCTS, JSON.stringify(next));
        syncAdminProductsToMerchant(next);
      } catch {}
      return next;
    });

    fetch(`${API_BASE}/inventory/products/${encodeURIComponent(productId)}/status`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: 'DRAFT' }),
    }).catch(() => {});

    if (typeof window !== 'undefined') {
      window.dispatchEvent(
        new CustomEvent('fulfillio-warehouse-sync', { detail: { source: 'AdminMerchantProductsTab' } })
      );
    }
  };

  const handleRestoreProduct = (productId: string) => {
    setProducts((prev) => {
      const next = prev.map((p) =>
        p.id === productId ? { ...p, status: 'PENDING_APPROVAL' as const, isDraft: false } : p
      );
      try {
        localStorage.setItem(STORAGE_KEY_PRODUCTS, JSON.stringify(next));
        syncAdminProductsToMerchant(next);
      } catch {}
      return next;
    });

    fetch(`${API_BASE}/inventory/products/${encodeURIComponent(productId)}/status`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: 'PENDING_APPROVAL' }),
    }).catch(() => {});

    if (typeof window !== 'undefined') {
      window.dispatchEvent(
        new CustomEvent('fulfillio-warehouse-sync', { detail: { source: 'AdminMerchantProductsTab' } })
      );
    }
  };

  const handleDeleteProduct = (productId: string) => {
    const target = products.find((p) => p.id === productId);
    setProducts((prev) => {
      const next = prev.filter((p) => p.id !== productId);
      try {
        localStorage.setItem(STORAGE_KEY_PRODUCTS, JSON.stringify(next));
        if (target) syncAdminProductsToMerchant(next, [target]);
      } catch {}
      return next;
    });
    if (target) {
      deleteProductFromDatabase(productId, target.merchantCode);
    }
  };

  const handleDeleteProducts = (productIds: string[]) => {
    const idSet = new Set(productIds);
    const deleted = products.filter((p) => idSet.has(p.id));
    setProducts((prev) => {
      const next = prev.filter((p) => !idSet.has(p.id));
      try {
        localStorage.setItem(STORAGE_KEY_PRODUCTS, JSON.stringify(next));
        syncAdminProductsToMerchant(next, deleted);
      } catch {}
      return next;
    });
    deleted.forEach((p) => deleteProductFromDatabase(p.id, p.merchantCode));
  };

  // 8. Add Product
  const handleAddProduct = (newProduct: WarehouseProductItem) => {
    setProducts((prev) => [newProduct, ...prev]);
    onAddProduct({
      id: newProduct.id,
      merchantCode: newProduct.merchantCode,
      title: newProduct.title,
      category: newProduct.category as any,
      sku: newProduct.fullSku,
      barcode: '',
      color: newProduct.color,
      size: newProduct.size,
      price: newProduct.price,
      wholesalePrice: Math.round(newProduct.price * 0.7),
      stock: newProduct.stock,
      reserved: 0,
      damaged: 0,
      bin: newProduct.binCode,
      status: newProduct.status === 'PENDING_APPROVAL' ? 'PENDING_APPROVAL' : 'APPROVED',
      imageUrl: newProduct.imageUrl,
    });
    setAddProductModalOpen(false);
  };

  return (
    <div className="space-y-6">
      {/* 1. Summary Stats Cards (Same to Same as /admin/products, Display-Only StatCards) */}
      <ProductsStatsOverview
        products={merchantOnlyProducts}
        bins={bins}
        pendingRestockCount={0}
      />

      {/* 2. The Single Master Products Table & Approvals (Same to Same as /admin/products) */}
      <ProductsCatalogTab
        products={allMerchantWarehouseProducts}
        bins={bins}
        fixedMerchantCode={merchant.merchantCode}
        hideMerchantFilter={true}
        onAdjustStock={handleAdjustStock}
        onOpenStockAdjustModal={(prod) => setStockAdjustProduct(prod)}
        onChangeProductBin={handleChangeProductBin}
        onOpenAddProduct={() => setAddProductModalOpen(true)}
        onOpenAcceptStockModal={(prod) => setAcceptStockProduct(prod)}
        onOpenApprovalModal={(mode, product, selectedBin) =>
          setApprovalModalData({ mode, product, selectedBin })
        }
        onBulkApproveProductsWithSlots={handleBulkApproveWithSlots}
        onBulkApproveProducts={handleBulkApproveProducts}
        onBulkRejectProducts={handleBulkRejectProducts}
        onMoveToDraft={handleMoveToDraft}
        onRestoreProduct={handleRestoreProduct}
        onPermanentDelete={handleDeleteProduct}
        onBulkMoveToDraft={(ids) => ids.forEach((id) => handleMoveToDraft(id))}
        onBulkRestore={(ids) => ids.forEach((id) => handleRestoreProduct(id))}
        onBulkPermanentDelete={handleDeleteProducts}
        onDeleteProduct={handleDeleteProduct}
        onDeleteProducts={handleDeleteProducts}
      />

      {/* 3. Modals (Matching /admin/products) */}
      <StockAdjustModal
        isOpen={Boolean(stockAdjustProduct)}
        onClose={() => setStockAdjustProduct(null)}
        product={stockAdjustProduct}
        onAdjustStock={(id, delta) => handleAdjustStock(id, delta)}
        onSaveVariantStocks={handleSaveVariantStocks}
      />

      <ApprovalActionModal
        isOpen={Boolean(approvalModalData)}
        onClose={() => setApprovalModalData(null)}
        approvalData={approvalModalData}
        bins={bins}
        onConfirm={handleConfirmApproval}
      />

      <AcceptStockModal
        isOpen={Boolean(acceptStockProduct)}
        onClose={() => setAcceptStockProduct(null)}
        product={acceptStockProduct}
        bins={bins}
        onConfirm={handleAcceptStock}
      />

      <AddProductModal
        isOpen={addProductModalOpen}
        onClose={() => setAddProductModalOpen(false)}
        bins={bins}
        onAddProduct={handleAddProduct}
      />
    </div>
  );
}

export default MerchantProductsTab;
