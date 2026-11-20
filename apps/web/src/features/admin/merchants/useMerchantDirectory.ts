'use client';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api';

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

      fetch(`${API_BASE}/merchants/public-directory`)
        .then((res) => (res.ok ? res.json() : null))
        .then((data) => {
          if (data?.items && Array.isArray(data.items)) {
            const dbList: MerchantRecord[] = data.items.map((m: any) => ({
              id: m.id,
              merchantCode: m.merchantCode,
              storeName: m.businessName,
              ownerName: m.ownerName || m.users?.[0]?.name || 'Store Owner',
              email: m.email,
              phone: m.phone || '01700-000000',
              location: m.location || 'Dhaka, Bangladesh',
              deliveryArea: 'Nationwide Bangladesh',
              status: m.status === 'APPROVED' ? 'Active' : m.status === 'SUSPENDED' ? 'Suspended' : 'Pending',
              verified: m.status === 'APPROVED',
              joinedDate: new Date(m.createdAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }),
              avatarInitials: (m.businessName || 'MC').slice(0, 2).toUpperCase(),
              avatarBg: 'from-orange-500 to-amber-600',
              payoutAccount: m.payoutAccount || {
                provider: 'Pending Bank Setup',
                accountHolder: m.ownerName || 'Store Owner',
                accountNumber: '0000000000000',
                branchName: 'Dhaka Main Branch',
                routingNumber: '000000000',
                bkashNumber: m.phone || '',
                frequency: 'Weekly (Every Friday)',
                status: 'PENDING_REVIEW',
                availableBalance: 0,
                lastPayoutAmount: 0,
              },
            }));

            setMerchants((prev) => {
              const merged = dbList.map((dbItem) => {
                const existing = prev.find(
                  (p) =>
                    p.merchantCode === dbItem.merchantCode ||
                    p.email?.toLowerCase() === dbItem.email?.toLowerCase() ||
                    p.id === dbItem.id
                );
                if (!existing) return dbItem;
                return {
                  ...existing,
                  ...dbItem,
                  id: existing.id || dbItem.id,
                  storeName: existing.storeName || dbItem.storeName,
                  ownerName:
                    existing.ownerName && existing.ownerName !== 'Store Owner'
                      ? existing.ownerName
                      : dbItem.ownerName || existing.ownerName,
                  phone:
                    existing.phone && existing.phone !== '01700-000000'
                      ? existing.phone
                      : dbItem.phone || existing.phone,
                  location: existing.location || dbItem.location,
                  avatarUrl: existing.avatarUrl || dbItem.avatarUrl,
                  avatarBg: existing.avatarBg || dbItem.avatarBg,
                  avatarInitials: existing.avatarInitials || dbItem.avatarInitials,
                  payoutAccount: existing.payoutAccount || dbItem.payoutAccount,
                  status: dbItem.status || existing.status,
                  verified: dbItem.verified !== undefined ? dbItem.verified : existing.verified,
                };
              });

              for (const existing of prev) {
                if (!merged.some((m) => m.merchantCode === existing.merchantCode || m.email === existing.email)) {
                  merged.push(existing);
                }
              }
              try {
                localStorage.setItem(STORAGE_KEY, JSON.stringify(merged));
              } catch {}
              return merged;
            });
          }
        })
        .catch(() => {});

      const { products, orders } = getSyncedMerchantDirectoryLists(ALL_PRODUCTS, ALL_ORDERS);
      setProductsList(products);
      setOrdersList(orders);
      setMemosList(getSyncedMerchantMemos(ALL_MEMOS));

      // Fetch products from backend PostgreSQL database to guarantee all merchant uploads appear
      fetch(`${API_BASE}/inventory/products`)
        .then((res) => (res.ok ? res.json() : null))
        .then((backendProds) => {
          if (backendProds && Array.isArray(backendProds) && backendProds.length > 0) {
            const mappedBackend: MerchantProductItem[] = backendProds.map((p: any) => {
              const variants = p.variants || [];
              const totalStock = variants.reduce(
                (sum: number, v: any) => sum + (v.inventoryItems?.[0]?.quantityAvailable ?? 0),
                0
              );
              const mCode = p.merchant?.merchantCode || p.merchantCode || 'MC-101';
              const firstVariant = variants[0];
              const isApproved = variants.some(
                (v: any) =>
                  v.defaultBinCode &&
                  v.defaultBinCode !== 'Pending Approval' &&
                  v.defaultBinCode !== 'Assigned on intake'
              );

              const variantParts = (firstVariant?.title || '').split(/[/•·|-]/).map((s: string) => s.trim());
              const color = firstVariant?.attributes?.color || variantParts[0] || 'Standard';
              const size = firstVariant?.attributes?.size || variantParts[1] || 'Standard';

              return {
                id: p.id,
                merchantCode: mCode,
                title: p.title,
                category: (firstVariant?.attributes as any)?.category || 'Fashion',
                sku: firstVariant?.sku || `${mCode}-${p.baseSku}-STD`,
                barcode: firstVariant?.barcode || '',
                color,
                size,
                price: Number(firstVariant?.price) || 0,
                wholesalePrice: Number(firstVariant?.wholesalePrice) || Math.round((Number(firstVariant?.price) || 0) * 0.75),
                stock: totalStock,
                reserved: 0,
                damaged: 0,
                bin: isApproved ? (firstVariant?.defaultBinCode || 'A-01-02') : 'Pending Approval',
                status: isApproved ? ('APPROVED' as const) : ('PENDING_APPROVAL' as const),
                imageUrl: p.imageUrl || '',
              };
            });

            setProductsList((prev) => {
              const combined = [...prev];
              for (const bp of mappedBackend) {
                const idx = combined.findIndex((cp) => cp.id === bp.id || cp.sku === bp.sku);
                if (idx >= 0) {
                  combined[idx] = { ...combined[idx], ...bp };
                } else {
                  combined.unshift(bp);
                }
              }
              return combined;
            });
          }
        })
        .catch(() => {});
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
    const target = merchants.find((m) => m.id === merchantId || m.merchantCode === merchantId);
    const updated = merchants.map((m) =>
      m.id === merchantId || m.merchantCode === merchantId
        ? { ...m, status: nextStatus, verified: nextStatus === 'Active' }
        : m,
    );
    setMerchants(updated);
    syncMerchantDirectoryToProfiles(updated);
    const targetIdentifier = target?.merchantCode || target?.id || merchantId;
    fetch(`${API_BASE}/merchants/${encodeURIComponent(targetIdentifier)}/status`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: nextStatus === 'Active' ? 'APPROVED' : 'SUSPENDED' }),
    }).catch(() => {});
    triggerToast(`Status changed to ${nextStatus}`);
  };

  const handleBulkUpdateStatus = (merchantIds: string[], nextStatus: 'Active' | 'Suspended') => {
    const updated = merchants.map((m) =>
      merchantIds.includes(m.id) || (m.merchantCode && merchantIds.includes(m.merchantCode))
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
    const updated = merchants.map((m) =>
      m.id === updatedMerchant.id || m.merchantCode === updatedMerchant.merchantCode
        ? { ...m, ...updatedMerchant }
        : m
    );
    setMerchants(updated);
    syncMerchantDirectoryToProfiles(updated);

    if (updatedMerchant.status === 'Active') {
      triggerToast(`Merchant "${updatedMerchant.storeName}" Approved Successfully!`);
    } else if (updatedMerchant.status === 'Suspended') {
      triggerToast(`Merchant "${updatedMerchant.storeName}" Suspended.`);
    } else {
      triggerToast(`Saved settings for ${updatedMerchant.storeName}!`);
    }

    // Sync with backend API
    const targetIdentifier = updatedMerchant.merchantCode || updatedMerchant.id;
    fetch(`${API_BASE}/merchants/${encodeURIComponent(targetIdentifier)}/status`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        status: updatedMerchant.status === 'Active' ? 'APPROVED' : 'SUSPENDED',
      }),
    }).catch(() => {});
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
