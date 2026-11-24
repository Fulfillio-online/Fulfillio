'use client';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api';

import React, { useCallback, useEffect, useRef, useState } from 'react';
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
  getStoredMerchantDirectory,
  rejectAdminProductSubmission,
  syncMerchantDirectoryToProfiles,
} from '@/lib/warehouseSync';

function hasPayoutCoords(p?: MerchantRecord['payoutAccount'] | null): boolean {
  return Boolean(
    p &&
      (String(p.accountNumber || '').trim() ||
        String(p.bkashNumber || '').trim())
  );
}

function getPayoutTime(p?: MerchantRecord['payoutAccount'] | null): number {
  if (!p) return 0;
  const raw = p.updatedAt || p.submittedAt;
  if (!raw) return 0;
  const ms = Date.parse(raw);
  return Number.isFinite(ms) ? ms : 0;
}

function pickFresherAdminPayout(
  localPayout?: MerchantRecord['payoutAccount'],
  dbPayout?: MerchantRecord['payoutAccount'],
): MerchantRecord['payoutAccount'] {
  if (!localPayout) return dbPayout!;
  if (!dbPayout) return localPayout;
  const localHas = hasPayoutCoords(localPayout);
  const dbHas = hasPayoutCoords(dbPayout);
  if (localHas && !dbHas) return localPayout;
  if (dbHas && !localHas) return dbPayout;

  const localTs = getPayoutTime(localPayout);
  const dbTs = getPayoutTime(dbPayout);
  if (dbTs > 0 && localTs > 0) {
    return dbTs >= localTs ? dbPayout : localPayout;
  }
  if (dbTs > 0) return dbPayout;
  if (localTs > 0) return localPayout;
  return dbPayout;
}

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

  // Last known backend snapshots. Re-applied synchronously on every reload so the UI never
  // flips between "localStorage-only" and "backend-merged" states (that flip caused the
  // tab counts / pending badges / status pills on the merchant profile page to blink).
  const dbMerchantsRef = useRef<MerchantRecord[] | null>(null);
  const backendProductsRef = useRef<MerchantProductItem[] | null>(null);
  const lastFetchAtRef = useRef(0);
  const fetchInFlightRef = useRef(false);
  const reloadTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  /** Only commit state when the content actually changed (prevents no-op re-renders). */
  const setIfChanged = useCallback(<T,>(setter: React.Dispatch<React.SetStateAction<T>>, next: T) => {
    setter((prev) => {
      try {
        return JSON.stringify(prev) === JSON.stringify(next) ? prev : next;
      } catch {
        return next;
      }
    });
  }, []);

  const mergeMerchants = (local: MerchantRecord[], db: MerchantRecord[] | null): MerchantRecord[] => {
    if (!db || db.length === 0) return local;
    const merged = db.map((dbItem) => {
      const existing = local.find(
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
        joinedDate: existing.joinedDate || dbItem.joinedDate,
        avatarUrl: existing.avatarUrl || dbItem.avatarUrl,
        avatarBg: existing.avatarBg || dbItem.avatarBg,
        avatarInitials: existing.avatarInitials || dbItem.avatarInitials,
        payoutAccount: pickFresherAdminPayout(existing.payoutAccount, dbItem.payoutAccount),
        status: dbItem.status || existing.status,
        verified: dbItem.verified !== undefined ? dbItem.verified : existing.verified,
      };
    });
    for (const existing of local) {
      if (!merged.some((m) => m.merchantCode === existing.merchantCode || m.email === existing.email)) {
        merged.push(existing);
      }
    }
    return merged;
  };

  const mergeProducts = (
    local: MerchantProductItem[],
    backend: MerchantProductItem[] | null,
    prev: MerchantProductItem[],
  ): MerchantProductItem[] => {
    const combined = [...local];
    if (backend && backend.length > 0) {
      for (const bp of backend) {
        const idx = combined.findIndex((cp) => cp.id === bp.id || cp.sku === bp.sku);
        if (idx >= 0) {
          const existing = combined[idx];
          const isDraft =
            bp.status === 'DRAFT' ||
            Boolean(bp.isDraft) ||
            existing.status === 'DRAFT' ||
            Boolean(existing.isDraft);
          combined[idx] = {
            ...existing,
            ...bp,
            isDraft,
            status: isDraft ? 'DRAFT' : bp.status || existing.status,
          };
        } else {
          combined.unshift(bp);
        }
      }
    }
    // Keep generated barcodes stable between reloads (they are randomised when missing).
    return combined.map((p) => {
      const old = prev.find((o) => o.id === p.id);
      return old && old.barcode && p.barcode !== old.barcode ? { ...p, barcode: old.barcode } : p;
    });
  };

  const readLocalMerchants = (): MerchantRecord[] | null => {
    return null;
  };

  const productsRef = useRef<MerchantProductItem[]>(ALL_PRODUCTS);
  useEffect(() => {
    productsRef.current = productsList;
  }, [productsList]);

  /** Apply localStorage + last backend snapshot synchronously in ONE commit. */
  const applyLocal = useCallback(() => {
    const localMerchants = getStoredMerchantDirectory();
    if (dbMerchantsRef.current && dbMerchantsRef.current.length > 0) {
      setIfChanged(setMerchants, mergeMerchants(localMerchants, dbMerchantsRef.current));
    } else if (localMerchants && localMerchants.length > 0) {
      setIfChanged(setMerchants, localMerchants);
    }

    const { products, orders } = getSyncedMerchantDirectoryLists(ALL_PRODUCTS, ALL_ORDERS);
    setIfChanged(
      setProductsList,
      mergeProducts(products, backendProductsRef.current, productsRef.current),
    );
    setIfChanged(setOrdersList, orders);
    setIfChanged(setMemosList, getSyncedMerchantMemos(ALL_MEMOS));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [setIfChanged]);

  /** Refresh backend snapshots (throttled), then re-apply in a single commit. */
  const fetchBackend = useCallback(
    (force = false) => {
      const now = Date.now();
      if (fetchInFlightRef.current) return;
      if (!force && now - lastFetchAtRef.current < 5000) return;
      fetchInFlightRef.current = true;
      lastFetchAtRef.current = now;

      const merchantsReq = fetch(`${API_BASE}/merchants/public-directory`)
        .then((res) => (res.ok ? res.json() : null))
        .then((data) => {
          if (!data?.items || !Array.isArray(data.items)) return;
          dbMerchantsRef.current = data.items.map((m: any) => {
            const rawPayout = m.payoutAccount;
            const hasPayoutDetails = Boolean(
              rawPayout &&
                (String(rawPayout.accountNumber || '').trim() ||
                  String(rawPayout.bkashNumber || '').trim() ||
                  String(rawPayout.bkashMerchantNumber || '').trim())
            );
            const payoutStatus: MerchantRecord['payoutAccount']['status'] = hasPayoutDetails
              ? rawPayout.status || 'PENDING_REVIEW'
              : rawPayout?.status === 'REJECTED'
                ? 'REJECTED'
                : 'UNVERIFIED';

            return {
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
              joinedDate: new Date(m.createdAt).toLocaleDateString('en-GB', {
                day: '2-digit',
                month: 'short',
                year: 'numeric',
              }),
              avatarInitials: (m.businessName || 'MC').slice(0, 2).toUpperCase(),
              avatarBg: 'from-orange-500 to-amber-600',
              payoutAccount: {
                provider:
                  rawPayout?.provider ||
                  rawPayout?.bankName ||
                  rawPayout?.method ||
                  (hasPayoutDetails ? 'Bank / MFS Account' : 'Not Configured'),
                accountHolder:
                  rawPayout?.accountHolder ||
                  rawPayout?.accountName ||
                  m.ownerName ||
                  m.businessName ||
                  'Store Owner',
                accountNumber: String(rawPayout?.accountNumber || ''),
                branchName: rawPayout?.branchName || (hasPayoutDetails ? '—' : ''),
                routingNumber: rawPayout?.routingNumber || (hasPayoutDetails ? '—' : ''),
                bkashNumber:
                  rawPayout?.bkashNumber ||
                  rawPayout?.bkashMerchantNumber ||
                  (rawPayout?.method === 'BKASH' ? rawPayout?.accountNumber : '') ||
                  '',
                frequency: rawPayout?.frequency || 'Weekly (Every Friday)',
                status: payoutStatus,
                chequeLeafUrl: rawPayout?.chequeLeafUrl || '',
                rejectionReason: rawPayout?.rejectionReason || undefined,
                submittedAt: rawPayout?.submittedAt,
                updatedAt: rawPayout?.updatedAt || rawPayout?.submittedAt,
                availableBalance: Number(rawPayout?.availableBalance ?? 0),
                lastPayoutAmount: Number(rawPayout?.lastPayoutAmount ?? 0),
              },
            };
          });
        })
        .catch(() => {});

      const productsReq = fetch(`${API_BASE}/inventory/products`)
        .then((res) => (res.ok ? res.json() : null))
        .then((backendProds) => {
          if (!backendProds || !Array.isArray(backendProds) || backendProds.length === 0) return;
          backendProductsRef.current = backendProds.map((p: any) => {
            const variants = p.variants || [];
            const totalStock = variants.reduce(
              (sum: number, v: any) => sum + (v.inventoryItems?.[0]?.quantityAvailable ?? 0),
              0
            );
            const mCode = p.merchant?.merchantCode || p.merchantCode || 'MC-101';
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
            const variantParts = (firstVariant?.title || '').split(/[/|-]/).map((s: string) => s.trim());
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
              wholesalePrice:
                Number(firstVariant?.wholesalePrice) || Math.round((Number(firstVariant?.price) || 0) * 0.75),
              stock: totalStock,
              reserved: 0,
              damaged: 0,
              bin: isApproved || isDraft ? firstVariant?.defaultBinCode || 'A-01-02' : 'Pending Approval',
              isDraft,
              status: isDraft
                ? ('DRAFT' as const)
                : isApproved
                  ? ('APPROVED' as const)
                  : ('PENDING_APPROVAL' as const),
              imageUrl: p.imageUrl || '',
            } as MerchantProductItem;
          });
        })
        .catch(() => {});

      Promise.all([merchantsReq, productsReq]).finally(() => {
        fetchInFlightRef.current = false;
        applyLocal();
      });
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [applyLocal]
  );

  const reload = useCallback(() => {
    try {
      applyLocal();
      fetchBackend();
    } catch (err) {
      console.warn('Could not read from localStorage', err);
    }
  }, [applyLocal, fetchBackend]);

  useEffect(() => {
    applyLocal();
    fetchBackend(true);
    setHydrated(true);

    // Debounce bursts of sync/storage events into a single reload.
    const onSync = (e: Event) => {
      const ce = e as CustomEvent | undefined;
      // Ignore events this page's own merchant-directory writes dispatched (state is already current).
      if (ce?.detail?.source === 'AdminMerchantDirectory') return;
      if (reloadTimerRef.current) clearTimeout(reloadTimerRef.current);
      reloadTimerRef.current = setTimeout(() => {
        reloadTimerRef.current = null;
        applyLocal();
        fetchBackend(true);
      }, 200);
    };
    window.addEventListener('fulfillio-warehouse-sync', onSync);
    window.addEventListener('storage', onSync);
    return () => {
      if (reloadTimerRef.current) clearTimeout(reloadTimerRef.current);
      window.removeEventListener('fulfillio-warehouse-sync', onSync);
      window.removeEventListener('storage', onSync);
    };
  }, [applyLocal, fetchBackend, reload]);

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
      setProductsList((prev) =>
        prev.map((p) =>
          p.id === productId
            ? { ...p, status: 'APPROVED' as const, stock: Math.max(0, finalQty), bin: finalBin || 'A-01-02' }
            : p
        )
      );
      triggerToast('Approved & published product to catalog!');
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
      setProductsList((prev) => prev.filter((p) => p.id !== productId));
      triggerToast('Product submission rejected.');
      return;
    }
    reload();
    triggerToast(`Rejected product submission "${rejected.title}" (${rejected.fullSku}).`);
  };

  const applyPayoutReview = (
    merchantIds: string[],
    action: 'APPROVE' | 'REJECT',
    rejectionReason?: string,
  ): MerchantRecord[] => {
    const idSet = new Set(merchantIds);
    const nextStatus: 'VERIFIED' | 'REJECTED' = action === 'APPROVE' ? 'VERIFIED' : 'REJECTED';
    const nowIso = new Date().toISOString();
    const resolvedReason =
      nextStatus === 'REJECTED'
        ? rejectionReason?.trim() || 'Payout details verification failed'
        : undefined;

    const patchList = (list: MerchantRecord[]) =>
      list.map((m) =>
        idSet.has(m.id) || (m.merchantCode && idSet.has(m.merchantCode))
          ? {
              ...m,
              payoutAccount: {
                ...m.payoutAccount,
                status: nextStatus,
                updatedAt: nowIso,
                rejectionReason: resolvedReason,
              },
            }
          : m,
      );

    const matchedTargets = merchants.filter(
      (m) => idSet.has(m.id) || (m.merchantCode && idSet.has(m.merchantCode)),
    );
    const updated = patchList(merchants);

    if (dbMerchantsRef.current) {
      dbMerchantsRef.current = patchList(dbMerchantsRef.current);
    }

    setMerchants(updated);
    syncMerchantDirectoryToProfiles(updated);

    const identifiers =
      matchedTargets.length > 0
        ? matchedTargets.map((m) => m.merchantCode || m.id)
        : merchantIds;

    for (const targetIdentifier of identifiers) {
      fetch(`${API_BASE}/merchants/${encodeURIComponent(targetIdentifier)}/payout-status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: nextStatus,
          ...(resolvedReason ? { rejectionReason: resolvedReason } : {}),
        }),
      }).catch(() => {});
    }

    return matchedTargets;
  };

  const handleReviewPayoutAccount = (
    merchantId: string,
    action: 'APPROVE' | 'REJECT',
    rejectionReason?: string,
  ) => {
    const matched = applyPayoutReview([merchantId], action, rejectionReason);
    const target = matched[0];
    const targetLabel = target?.storeName || target?.merchantCode || merchantId;
    triggerToast(
      action === 'APPROVE'
        ? `Payout account for "${targetLabel}" verified!`
        : `Payout account for "${targetLabel}" rejected.`,
    );
  };

  const handleBulkReviewPayoutAccounts = (
    merchantIds: string[],
    action: 'APPROVE' | 'REJECT',
    rejectionReason?: string,
  ) => {
    if (!merchantIds.length) return;
    const matched = applyPayoutReview(merchantIds, action, rejectionReason);
    const count = matched.length || merchantIds.length;
    triggerToast(
      action === 'APPROVE'
        ? `Verified ${count} payout account${count > 1 ? 's' : ''}!`
        : `Rejected ${count} payout account${count > 1 ? 's' : ''}.`,
    );
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
    handleReviewPayoutAccount,
    handleBulkReviewPayoutAccounts,
    handleAdjustStock,
    handleAddProduct,
    handleApproveProduct,
    handleRejectProduct,
  };
}
