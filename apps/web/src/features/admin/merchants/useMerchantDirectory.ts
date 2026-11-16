'use client';

import { useCallback, useEffect, useState } from 'react';
import {
  MerchantRecord,
  MerchantProductItem,
  MerchantOrderItem,
  MerchantMemoItem,
} from './types';
import {
  MERCHANTS_DATA,
  ALL_PRODUCTS,
  ALL_ORDERS,
  ALL_MEMOS,
  STORAGE_KEY,
} from './mockData';
import {
  addAdminCatalogProductForMerchant,
  adjustAdminProductStock,
  approveAdminProductSubmission,
  getSyncedMerchantDirectoryLists,
  getSyncedMerchantMemos,
  rejectAdminProductSubmission,
  syncMerchantDirectoryToProfiles,
} from '@/lib/warehouseSync';

/**
 * Shared data layer for the admin merchant list page and the dedicated
 * merchant profile page (/admin/merchants/[id]). Both read from the same
 * localStorage-backed warehouse store and stay in sync with the merchant portal.
 */
export function useMerchantDirectory() {
  const [merchants, setMerchants] = useState<MerchantRecord[]>(MERCHANTS_DATA);
  const [productsList, setProductsList] = useState<MerchantProductItem[]>(ALL_PRODUCTS);
  const [ordersList, setOrdersList] = useState<MerchantOrderItem[]>(ALL_ORDERS);
  const [memosList, setMemosList] = useState<MerchantMemoItem[]>(ALL_MEMOS);
  const [hydrated, setHydrated] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const triggerToast = useCallback((msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3200);
  }, []);

  const reload = useCallback(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setMerchants(parsed);
        }
      }
      const { products, orders } = getSyncedMerchantDirectoryLists(ALL_PRODUCTS, ALL_ORDERS);
      setProductsList(products);
      setOrdersList(orders);
      setMemosList(getSyncedMerchantMemos(ALL_MEMOS));
    } catch (err) {
      console.warn('Could not read from localStorage', err);
    }
  }, []);

  useEffect(() => {
    reload();
    setHydrated(true);

    const onSync = (e: Event) => {
      const ce = e as CustomEvent | undefined;
      // Ignore events this page's own merchant-directory writes dispatched (state is already current).
      if (ce?.detail?.source === 'AdminMerchantDirectory') return;
      reload();
    };
    window.addEventListener('fulfillio-warehouse-sync', onSync);
    window.addEventListener('storage', onSync);
    return () => {
      window.removeEventListener('fulfillio-warehouse-sync', onSync);
      window.removeEventListener('storage', onSync);
    };
  }, [reload]);

  const handleToggleStatus = (merchantId: string, currentStatus: string) => {
    const nextStatus: MerchantRecord['status'] = currentStatus === 'Active' ? 'Suspended' : 'Active';
    const updated = merchants.map((m) =>
      m.id === merchantId ? { ...m, status: nextStatus, verified: nextStatus === 'Active' } : m,
    );
    setMerchants(updated);
    syncMerchantDirectoryToProfiles(updated);
    triggerToast(`Status changed to ${nextStatus}`);
  };

  const handleBulkUpdateStatus = (merchantIds: string[], nextStatus: 'Active' | 'Suspended') => {
    const updated = merchants.map((m) =>
      merchantIds.includes(m.id)
        ? { ...m, status: nextStatus, verified: nextStatus === 'Active' }
        : m,
    );
    setMerchants(updated);
    syncMerchantDirectoryToProfiles(updated);
    triggerToast(
      `${nextStatus === 'Active' ? 'Approved' : 'Suspended'} ${merchantIds.length} merchant${
        merchantIds.length > 1 ? 's' : ''
      }`,
    );
  };

  const handleUpdateMerchant = (updatedMerchant: MerchantRecord) => {
    const updated = merchants.map((m) => (m.id === updatedMerchant.id ? updatedMerchant : m));
    setMerchants(updated);
    syncMerchantDirectoryToProfiles(updated);
    triggerToast(`Saved settings for ${updatedMerchant.storeName}!`);
  };

  const handleAdjustStock = (productId: string, delta: number) => {
    const persisted = adjustAdminProductStock(productId, delta);
    if (persisted) {
      reload();
      return;
    }
    // Demo/seed rows that are not in the warehouse catalog: adjust in-memory only.
    setProductsList((prev) =>
      prev.map((item) =>
        item.id === productId ? { ...item, stock: Math.max(0, item.stock + delta) } : item,
      ),
    );
  };

  const handleAddProduct = (newProduct: MerchantProductItem) => {
    const owner = merchants.find((m) => m.merchantCode === newProduct.merchantCode);
    const persisted = addAdminCatalogProductForMerchant(
      newProduct,
      owner?.storeName || newProduct.merchantCode,
    );
    if (persisted) {
      reload();
    } else {
      setProductsList((prev) => [newProduct, ...prev]);
    }
    triggerToast(`Added product "${newProduct.title}" (${newProduct.sku})`);
  };

  /** Admin approves a pending product -> Published everywhere (warehouse + merchant portal). */
  const handleApproveProduct = (productId: string, finalQty: number, finalBin: string) => {
    const approved = approveAdminProductSubmission(productId, finalQty, finalBin);
    if (!approved) {
      triggerToast('Could not approve this product. Please refresh and try again.');
      return;
    }
    reload();
    triggerToast(
      `Approved & published "${approved.title}" (${approved.fullSku}) with ${approved.stock} units in Bin ${approved.binCode}.`,
    );
  };

  const handleRejectProduct = (productId: string) => {
    const rejected = rejectAdminProductSubmission(productId);
    if (!rejected) {
      triggerToast('Could not reject this product. Please refresh and try again.');
      return;
    }
    reload();
    triggerToast(`Rejected product submission "${rejected.title}" (${rejected.fullSku}).`);
  };

  return {
    merchants,
    productsList,
    ordersList,
    memosList,
    hydrated,
    toastMessage,
    triggerToast,
    handleToggleStatus,
    handleBulkUpdateStatus,
    handleUpdateMerchant,
    handleAdjustStock,
    handleAddProduct,
    handleApproveProduct,
    handleRejectProduct,
  };
}
