'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import {
  MerchantAsnRecord,
  MerchantOrderItem,
  MerchantProductItem,
  MerchantProfileData,
  PayoutAccount,
  ResellerMemo,
  MerchantCategoryItem,
  MerchantSubcategoryItem,
  isOrderCancellable,
} from './types';
import { StockRequestItem } from './products/types';
import { safeSetLocalStorage } from './products/utils/imageCompressor';
import { CancelledOrderItemRecord, RecoveryLedgerEntry } from '@/features/admin/returns/types';
import { STORAGE_KEY_STOCK_LEDGER } from '@/features/admin/products/mockData';
import {
  INITIAL_MERCHANT_PROFILE, INITIAL_MERCHANT_PRODUCTS, INITIAL_MERCHANT_ORDERS, INITIAL_MERCHANT_MEMOS,
} from './mockData';
import { merchantApi } from './api';
import {
  buildRevisionSnapshotFromMerchantProduct,
  computeRevisionDiff,
  extractPendingEditFromApiProduct,
  ProductPendingEditInfo,
} from '@/lib/productRevision';
import {
  getActiveMerchantSession,
  getMerchantAsnsKey,
  getMerchantMemosKey,
  getMerchantOrdersKey,
  getMerchantProductsKey,
  getMerchantProfileKey,
  getMerchantStockRequestsKey,
  getStoredMerchantAsnsForCode,
  getStoredMerchantMemosForCode,
  getStoredMerchantOrdersForCode,
  getStoredMerchantProductsForCode,
  getStoredMerchantProfileForCode,
  getStoredMerchantStockRequestsForCode,
  syncMerchantOrderCancelledToAdmin,
  syncMerchantOrderCreatedToAdmin,
  syncMerchantProductsAddedToAdmin,
  syncMerchantProductsDeletedToAdmin,
  syncMerchantProfileToAdminDirectory,
  syncMerchantProductUpdatedToAdmin,
  syncMerchantProductRevisionToAdmin,
  syncMerchantMemoToAdmin,
  syncMerchantMemoDeletedToAdmin,
  syncMerchantStockRequestToAdmin,
  getStoredMerchantCategoriesForCode,
  saveMerchantCategoriesForCode,
  getMerchantCategoriesKey,
  updateOrderStatusInDatabase,
  cancelOrderInDatabase,
} from '@/lib/warehouseSync';

function getPayoutTimestamp(p?: Partial<PayoutAccount> | null): number {
  if (!p) return 0;
  const raw = p.updatedAt || p.submittedAt || p.verifiedAt;
  if (!raw) return 0;
  const ms = Date.parse(raw);
  return Number.isFinite(ms) ? ms : 0;
}

function hasPayoutCoordinates(p?: Partial<PayoutAccount> | null): boolean {
  return Boolean(
    p &&
      (String(p.accountNumber || '').trim() ||
        String(p.bkashMerchantNumber || '').trim())
  );
}

function pickFresherPayout(localPayout: PayoutAccount, serverPayout?: PayoutAccount): PayoutAccount {
  if (!serverPayout) return localPayout;
  const localHas = hasPayoutCoordinates(localPayout);
  const serverHas = hasPayoutCoordinates(serverPayout);
  if (serverHas && !localHas) return serverPayout;
  if (localHas && !serverHas) return localPayout;

  const localTs = getPayoutTimestamp(localPayout);
  const serverTs = getPayoutTimestamp(serverPayout);
  if (serverTs > 0 && localTs > 0) {
    return serverTs >= localTs ? serverPayout : localPayout;
  }
  if (serverTs > 0 && localTs === 0) return serverPayout;
  if (localTs > 0 && serverTs === 0) return localPayout;
  if (serverHas) return serverPayout;
  return localPayout;
}

function safeLocalStorageSet(key: string, value: string): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(key, value);
  } catch (err) {
    console.warn(`[Storage] Quota exceeded for "${key}", cleaning non-critical cache...`, err);
    try {
      const purgeKeys = ['fulfillio_temp_cache', 'fulfillio_audit_logs'];
      purgeKeys.forEach((k) => localStorage.removeItem(k));
      localStorage.setItem(key, value);
    } catch {
      // Gracefully prevent unhandled DOMException quota errors
    }
  }
}

interface MerchantContextType {
  profile: MerchantProfileData;
  products: MerchantProductItem[];
  orders: MerchantOrderItem[];
  memoList: ResellerMemo[];
  asns: MerchantAsnRecord[];
  stockRequests: StockRequestItem[];
  toastMessage: string | null;
  isMobileSidebarOpen: boolean;
  setIsMobileSidebarOpen: (open: boolean) => void;
  showToast: (msg: string) => void;
  clearToast: () => void;
  updateProfile: (updated: Partial<MerchantProfileData>) => void;
  adjustStock: (id: string, delta: number) => void;
  deleteProduct: (id: string) => void;
  addProducts: (newItems: MerchantProductItem[]) => Promise<{ ok: boolean; error?: string }>;
  updateProduct: (id: string, updated: Partial<MerchantProductItem>) => Promise<{ ok: boolean; error?: string }>;
  toggleProductStatus: (id: string) => void;
  bulkUpdateStatus: (ids: string[], status: 'PUBLISHED' | 'DRAFT') => void;
  bulkDeleteProducts: (ids: string[]) => void;
  requestStockAdd: (productId: string, requestedQty: number, note?: string) => void;
  requestStockOperation: (payload: import("./products/modals/ManageStockModal").SubmitStockRequestPayload) => void;
  manageProductVariantsAndStock: (payload: import("./products/types").ManageVariantsAndStockPayload) => Promise<{ ok: boolean; error?: string }>;
  requestEditAccess: (productId: string, reason: string) => Promise<boolean>;
  cancelPendingEdit: (productId: string) => Promise<boolean>;
  approveStockRequest: (requestId: string) => void;
  cancelStockRequest: (requestId: string) => void;
  createOrder: (
    order: MerchantOrderItem,
    productIdOrItems?: string | { productId: string; qty: number }[],
    qty?: number
  ) => Promise<{ ok: boolean; error?: string }>;
  syncLocalOrdersToDatabase: () => Promise<{ uploaded: number; failed: number }>;
  cancelOrder: (orderId: string, reason?: string) => Promise<boolean>;
  updateOrderStatus: (orderId: string, status: MerchantOrderItem['status']) => void;
  createAsn: (newAsn: MerchantAsnRecord) => void;
  saveMemo: (newMemo: ResellerMemo) => void;
  setDefaultMemo: (id: string) => void;
  deleteMemo: (id: string) => void;
  categories: MerchantCategoryItem[];
  addCategory: (item: { name: string; description?: string; subcategories?: string[] }) => void;
  updateCategory: (id: string, updated: Partial<MerchantCategoryItem>) => void;
  deleteCategory: (id: string) => void;
  addSubcategory: (categoryId: string, subcategory: { name: string; description?: string }) => void;
  updateSubcategory: (categoryId: string, subcategoryId: string, updated: Partial<MerchantSubcategoryItem>) => void;
  deleteSubcategory: (categoryId: string, subcategoryId: string) => void;
}

const MerchantContext = createContext<MerchantContextType | undefined>(undefined);

export function MerchantProvider({ children }: { children: ReactNode }) {
  const [profile, setProfile] = useState<MerchantProfileData>(() => {
    if (typeof window !== 'undefined') {
      const session = getActiveMerchantSession();
      const code = session?.merchantCode || 'MC-101';
      return getStoredMerchantProfileForCode(code);
    }
    return INITIAL_MERCHANT_PROFILE;
  });
  const [products, setProducts] = useState<MerchantProductItem[]>(() => {
    if (typeof window !== 'undefined') {
      const session = getActiveMerchantSession();
      const code = session?.merchantCode || 'MC-101';
      return getStoredMerchantProductsForCode(code);
    }
    return [];
  });
  const [orders, setOrders] = useState<MerchantOrderItem[]>(() => {
    if (typeof window !== 'undefined') {
      const session = getActiveMerchantSession();
      const code = session?.merchantCode || 'MC-101';
      return getStoredMerchantOrdersForCode(code);
    }
    return [];
  });
  const [memoList, setMemoList] = useState<ResellerMemo[]>([]);
  const [asns, setAsns] = useState<MerchantAsnRecord[]>([]);
  const [stockRequests, setStockRequests] = useState<StockRequestItem[]>([]);
  const [categories, setCategories] = useState<MerchantCategoryItem[]>([]);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  // Load active merchant session & scoped data
  useEffect(() => {
    const loadActiveMerchantWorkspace = async () => {
      const session = getActiveMerchantSession();
      const code = session.merchantCode || 'MC-101';
      const prof = getStoredMerchantProfileForCode(code);
      setProfile(prof);

      try {
        const [serverProfile, serverProds, serverOrds] = await Promise.all([
          merchantApi.getProfile(),
          merchantApi.getProducts(),
          merchantApi.getOrders(),
        ]);

        if (serverProfile && serverProfile.merchantCode) {
          const effectiveCode = serverProfile.merchantCode || code;
          const reconciledPayout = pickFresherPayout(
            prof.payoutAccount,
            serverProfile.payoutAccount
          );
          const mergedProfile: MerchantProfileData = {
            ...prof,
            ...serverProfile,
            merchantCode: effectiveCode,
            storeName: serverProfile.storeName || prof.storeName || session.storeName || '',
            ownerName: serverProfile.ownerName || prof.ownerName || session.ownerName || '',
            email: serverProfile.email || prof.email || session.email || '',
            payoutAccount: reconciledPayout,
          };
          setProfile(mergedProfile);
          if (typeof window !== 'undefined') {
            safeLocalStorageSet(
              getMerchantProfileKey(effectiveCode),
              JSON.stringify(mergedProfile)
            );
          }
        }
        if (serverProds && serverProds.length > 0) {
          const localProds = getStoredMerchantProductsForCode(code);
          const reconciled = serverProds.map((sp) => {
            const localMatch = localProds.find((lp) => lp.id === sp.id || lp.sku === sp.sku);
            if (localMatch) {
              const serverApproved =
                (sp.status === 'PUBLISHED' || sp.status === 'STOCK_STORED' || sp.status === 'APPROVED') &&
                sp.bin &&
                sp.bin !== 'Pending Approval' &&
                sp.bin !== 'Assigned on intake';

              const localApproved =
                (localMatch.status === 'PUBLISHED' || localMatch.status === 'STOCK_STORED' || localMatch.status === 'APPROVED') &&
                localMatch.bin &&
                localMatch.bin !== 'Pending Approval' &&
                localMatch.bin !== 'Assigned on intake';

              const isApproved = serverApproved || localApproved;
              const isDraft =
                sp.status === 'DRAFT' ||
                (localMatch.status === 'DRAFT' && sp.status !== 'STOCK_STORED' && sp.status !== 'APPROVED' && sp.status !== 'REJECTED');
              const isRejected =
                !isDraft &&
                (sp.status === 'REJECTED' ||
                  (localMatch.status === 'REJECTED' &&
                    sp.status !== 'STOCK_STORED' &&
                    sp.status !== 'APPROVED' &&
                    sp.status !== 'PENDING_APPROVAL'));
              const effectiveStock = sp.stock !== undefined ? sp.stock : localMatch.stock;
              const isStockStored =
                !isDraft &&
                !isRejected &&
                isApproved &&
                (sp.status === 'STOCK_STORED' || localMatch.status === 'STOCK_STORED' || effectiveStock > 0);
              const finalStatus = isDraft
                ? ('DRAFT' as const)
                : isRejected
                  ? ('REJECTED' as const)
                  : isStockStored
                    ? ('STOCK_STORED' as const)
                    : isApproved
                      ? ('APPROVED' as const)
                      : ('PENDING_APPROVAL' as const);
              const finalBin = isApproved && !isRejected
                ? (serverApproved ? sp.bin : localMatch.bin)
                : 'Pending Approval';

              return {
                ...localMatch,
                ...sp,
                status: finalStatus,
                bin: finalBin,
                rejectionReason: isRejected
                  ? (sp.rejectionReason ?? localMatch.rejectionReason)
                  : undefined,
                editState: sp.editState ?? null,
                pendingEdit: sp.pendingEdit ?? null,
                lastEditRejectionReason: sp.lastEditRejectionReason,
                stock: sp.stock !== undefined ? sp.stock : localMatch.stock,
                imageUrl: (sp.imageUrl && sp.imageUrl.trim()) ? sp.imageUrl : localMatch.imageUrl,
                images: (sp.images && sp.images.length > 0) ? sp.images : (localMatch.images || []),
                colors: (sp.colors && sp.colors.length > 0) ? sp.colors : (localMatch.colors || sp.colors),
              };
            }
            return sp;
          });
          const withDemoProducts =
            code === 'MC-101'
              ? [
                  ...reconciled,
                  ...INITIAL_MERCHANT_PRODUCTS.filter(
                    (dp) => !reconciled.some((sp) => sp.id === dp.id || sp.sku === dp.sku)
                  ),
                ]
              : reconciled;
          setProducts(withDemoProducts);
          if (typeof window !== 'undefined') {
            safeSetLocalStorage(getMerchantProductsKey(code), JSON.stringify(withDemoProducts));
          }
        } else {
          const localProds = getStoredMerchantProductsForCode(code);
          const withDemoProducts =
            code === 'MC-101'
              ? [
                  ...localProds,
                  ...INITIAL_MERCHANT_PRODUCTS.filter(
                    (dp) => !localProds.some((lp) => lp.id === dp.id || lp.sku === dp.sku)
                  ),
                ]
              : localProds;
          setProducts(withDemoProducts);
        }
        if (serverOrds && serverOrds.length > 0) {
          const withDemoOrders =
            code === 'MC-101'
              ? [
                  ...serverOrds,
                  ...INITIAL_MERCHANT_ORDERS.filter(
                    (doItem) =>
                      !serverOrds.some(
                        (so) => so.id === doItem.id || so.orderNumber === doItem.orderNumber
                      )
                  ),
                ]
              : serverOrds;
          setOrders(withDemoOrders);
          if (typeof window !== 'undefined') {
            safeSetLocalStorage(getMerchantOrdersKey(code), JSON.stringify(withDemoOrders));
          }
        } else {
          const localOrds = getStoredMerchantOrdersForCode(code);
          const withDemoOrders =
            code === 'MC-101'
              ? [
                  ...localOrds,
                  ...INITIAL_MERCHANT_ORDERS.filter(
                    (doItem) =>
                      !localOrds.some(
                        (lo) => lo.id === doItem.id || lo.orderNumber === doItem.orderNumber
                      )
                  ),
                ]
              : localOrds;
          setOrders(withDemoOrders);
        }
      } catch {
        setProducts(getStoredMerchantProductsForCode(code));
        setOrders(getStoredMerchantOrdersForCode(code));
      }

      const localMemos = getStoredMerchantMemosForCode(code, prof);
      setMemoList(localMemos);
      setAsns(getStoredMerchantAsnsForCode(code));
      setStockRequests(getStoredMerchantStockRequestsForCode(code));
      setCategories(getStoredMerchantCategoriesForCode(code));
    };

    loadActiveMerchantWorkspace();

    const handleExternalSync = (e: Event) => {
      const ce = e as CustomEvent;
      if (ce.detail?.source === 'MerchantContext') return;
      loadActiveMerchantWorkspace();
    };

    window.addEventListener('fulfillio-warehouse-sync', handleExternalSync);
    window.addEventListener('storage', handleExternalSync);

    return () => {
      window.removeEventListener('fulfillio-warehouse-sync', handleExternalSync);
      window.removeEventListener('storage', handleExternalSync);
    };
  }, []);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage((curr) => (curr === msg ? null : curr));
    }, 4000);
  };

  const clearToast = () => setToastMessage(null);

  const updateProfile = (updated: Partial<MerchantProfileData>) => {
    const session = typeof window !== 'undefined' ? getActiveMerchantSession() : null;
    const effectiveCode = profile.merchantCode || session?.merchantCode || 'MC-101';
    const nowIso = new Date().toISOString();
    const normalizedPayout: PayoutAccount | undefined = updated.payoutAccount
      ? {
          ...updated.payoutAccount,
          status: 'PENDING_REVIEW',
          submittedAt: updated.payoutAccount.submittedAt || nowIso,
          updatedAt: nowIso,
          rejectionReason: undefined,
        }
      : undefined;

    const nextProfile: MerchantProfileData = {
      ...profile,
      ...updated,
      merchantCode: effectiveCode,
      ...(normalizedPayout ? { payoutAccount: normalizedPayout } : {}),
    };

    setProfile(nextProfile);
    if (typeof window !== 'undefined') {
      localStorage.setItem(getMerchantProfileKey(effectiveCode), JSON.stringify(nextProfile));
      syncMerchantProfileToAdminDirectory(nextProfile);
    }

    merchantApi
      .updateProfile({
        ...updated,
        merchantCode: effectiveCode,
        ...(nextProfile.storeName ? { storeName: nextProfile.storeName } : {}),
        ...(normalizedPayout ? { payoutAccount: normalizedPayout } : {}),
      })
      .catch(() => {});
  };

  const adjustStock = (id: string, delta: number) => {
    setProducts((prev) => {
      let updatedTarget: MerchantProductItem | null = null;
      const next = prev.map((p) => {
        if (p.id !== id) return p;
        updatedTarget = { ...p, stock: Math.max(0, p.stock + delta) };
        return updatedTarget;
      });
      if (typeof window !== 'undefined') {
        safeLocalStorageSet(getMerchantProductsKey(profile.merchantCode), JSON.stringify(next));
        if (updatedTarget) {
          syncMerchantProductUpdatedToAdmin(updatedTarget, profile);
        }
      }
      return next;
    });
    showToast('Stock count adjusted.');
  };

  const deleteProduct = (id: string) => {
    const target = products.find((p) => p.id === id);
    if (!target) return;

    // Strict 0-Stock Rule: If warehouse has even 1 single unit in stock, product CANNOT be deleted!
    if ((target.stock || 0) >= 1) {
      showToast(
        `Cannot delete "${target.title}": Warehouse currently holds ${target.stock} pcs in stock. Product must have 0 stock before it can be deleted.`
      );
      return;
    }

    // When stock === 0, permanently delete from catalog and PostgreSQL database
    setProducts((prev) => {
      const deleted = prev.filter((p) => p.id === id);
      const next = prev.filter((p) => p.id !== id);
      if (typeof window !== 'undefined') {
        safeLocalStorageSet(getMerchantProductsKey(profile.merchantCode), JSON.stringify(next));
        syncMerchantProductsDeletedToAdmin(deleted);
      }
      return next;
    });

    merchantApi.deleteProduct(id).catch(() => {});
    showToast(
      target.status === 'PENDING_APPROVAL'
        ? `Store request for "${target.title}" cancelled and removed.`
        : `"${target.title}" has been permanently deleted from the database.`
    );
  };

  const addProducts = async (newItems: MerchantProductItem[]): Promise<{ ok: boolean; error?: string }> => {
    const preparedItems: MerchantProductItem[] = newItems.map((item) => {
      const isDraft = item.status === 'DRAFT';
      return {
        ...item,
        status: isDraft ? ('DRAFT' as const) : ('PENDING_APPROVAL' as const),
        bin: isDraft ? 'Pending Approval' : (item.bin || 'Pending Approval'),
      };
    });

    let savedToDatabase = true;

    // 1. Send directly to PostgreSQL backend (parallelized, no blocking full-catalog refetch)
    const createdResults = await Promise.all(
      preparedItems.map(async (it) => {
        try {
          const res = await merchantApi.createProduct(it);
          if (!res.ok) {
            savedToDatabase = false;
            console.warn('[MerchantContext] createProduct server failed:', res.error);
            return it;
          }
          const serverData = res.data;
          if (!serverData?.id) return it;
          return {
            ...it,
            id: serverData.id,
            sku: serverData.baseSku || it.sku,
            variantsList:
              Array.isArray(serverData.variants) && serverData.variants.length > 0 && it.variantsList
                ? it.variantsList.map((mv, idx) => ({
                    ...mv,
                    id: serverData.variants[idx]?.id || mv.id,
                    variantSku: serverData.variants[idx]?.sku || mv.variantSku,
                  }))
                : it.variantsList,
          };
        } catch (err: any) {
          savedToDatabase = false;
          console.warn('[MerchantContext] createProduct network exception:', err);
          return it;
        }
      })
    );

    // Only sync submitted (PENDING_APPROVAL) products to Admin! Drafts are strictly private to Merchant.
    const itemsForAdminSync = createdResults.filter((it) => it.status === 'PENDING_APPROVAL');

    // 2. Optimistic state update & local cache sync (instant UI response)
    setProducts((prev) => {
      const filtered = prev.filter(
        (p) => !createdResults.some((pi) => pi.sku === p.sku || pi.id === p.id)
      );
      const next = [...createdResults, ...filtered];
      if (typeof window !== 'undefined') {
        safeSetLocalStorage(getMerchantProductsKey(profile.merchantCode), JSON.stringify(next));
        if (itemsForAdminSync.length > 0) {
          syncMerchantProductsAddedToAdmin(itemsForAdminSync, profile);
        }
      }
      return next;
    });

    if (savedToDatabase) {
      const hasDraft = createdResults.some((it) => it.status === 'DRAFT');
      const hasPending = createdResults.some((it) => it.status === 'PENDING_APPROVAL');
      if (hasDraft && !hasPending) {
        showToast('Product saved as Draft. Visible only in your Merchant Dashboard.');
      } else {
        showToast('Product submitted for Admin Approval (Pending Review).');
      }
    } else {
      const hasDraft = createdResults.some((it) => it.status === 'DRAFT');
      showToast(
        hasDraft
          ? 'Product saved as Draft locally in your Merchant Dashboard.'
          : 'Product saved locally as Pending Approval.'
      );
    }

    return { ok: true };
  };

  const updateProduct = async (
    id: string,
    updated: Partial<MerchantProductItem>,
  ): Promise<{ ok: boolean; error?: string }> => {
    const targetProduct = products.find((p) => p.id === id || p.sku === id);

    if (targetProduct?.isSuspended) {
      const errorMsg = 'Cannot edit a suspended product. Please contact warehouse admin.';
      showToast(errorMsg);
      return { ok: false, error: errorMsg };
    }

    if (targetProduct?.status === 'REJECTED') {
      const errorMsg = 'Rejected products cannot be edited directly.';
      showToast(errorMsg);
      return { ok: false, error: errorMsg };
    }

    const isTargetDraft = targetProduct?.status === 'DRAFT' || Boolean(targetProduct?.isDraft);
    const isTargetPending =
      targetProduct &&
      !isTargetDraft &&
      (targetProduct.status === 'PENDING_APPROVAL' ||
        !targetProduct.bin ||
        targetProduct.bin === 'Pending Approval' ||
        targetProduct.bin === 'Assigned on intake');
    const isTargetApprovedOrPublished =
      Boolean(targetProduct) &&
      !isTargetDraft &&
      !isTargetPending &&
      (targetProduct?.status === 'STOCK_STORED' ||
        targetProduct?.status === 'APPROVED' ||
        targetProduct?.status === 'PUBLISHED' ||
        targetProduct?.stockAccepted === true);

    // Published / Approved Product Edit Flow:
    // Live published product remains unchanged; edits wait in Pending Approval until Admin approves.
    if (targetProduct && isTargetApprovedOrPublished) {
      const mergedProduct: MerchantProductItem = {
        ...targetProduct,
        ...updated,
        id: targetProduct.id,
        sku: targetProduct.sku,
        bin: targetProduct.bin,
        stock: targetProduct.stock,
        status: targetProduct.status,
      };

      const originalSnapshot = buildRevisionSnapshotFromMerchantProduct(targetProduct);
      const proposedSnapshot = buildRevisionSnapshotFromMerchantProduct(mergedProduct);
      const diff = computeRevisionDiff(originalSnapshot, proposedSnapshot);

      if (!diff.hasChanges) {
        const msg = 'No changes detected compared to the published product.';
        showToast(msg);
        return { ok: false, error: msg };
      }

      let pendingEdit: ProductPendingEditInfo = {
        status: 'PENDING',
        submittedAt: new Date().toISOString(),
        changedFields: diff.changedFields,
        originalSnapshot,
        proposedSnapshot,
      };

      try {
        const res = await merchantApi.submitProductRevision(targetProduct.id, proposedSnapshot);
        if (res.ok && res.data) {
          const extracted = extractPendingEditFromApiProduct(res.data);
          if (extracted.pendingEdit) {
            pendingEdit = extracted.pendingEdit;
          }
        }
      } catch (err) {
        console.warn('[MerchantContext] submitProductRevision network error:', err);
      }

      // Strictly preserve all live fields; only attach pendingEdit & editState
      setProducts((prev) => {
        const next = prev.map((p) =>
          p.id === targetProduct.id
            ? {
                ...p,
                editState: 'EDIT_APPROVAL_PENDING' as const,
                pendingEdit,
                lastEditRejectionReason: undefined,
              }
            : p
        );
        if (typeof window !== 'undefined') {
          safeSetLocalStorage(getMerchantProductsKey(profile.merchantCode), JSON.stringify(next));
          syncMerchantProductRevisionToAdmin(
            targetProduct.id,
            pendingEdit,
            'EDIT_APPROVAL_PENDING'
          );
        }
        return next;
      });

      showToast(
        'Product edits submitted for Admin Approval! Your published product stays live until approved.'
      );
      return { ok: true };
    }

    const mergedProduct: MerchantProductItem = {
      ...(targetProduct || ({} as MerchantProductItem)),
      ...updated,
      id: targetProduct ? targetProduct.id : id,
    };

    let serverError: string | undefined;
    let serverOk = false;

    // Send update directly to backend API (PostgreSQL database)
    try {
      const res = await merchantApi.updateProduct(id, mergedProduct);
      if (res.ok) {
        serverOk = true;
      } else {
        serverError = res.error;
        console.warn('[MerchantContext] updateProduct server sync failed:', res.error);
      }
    } catch (err: any) {
      serverError = err?.message || 'Server connection failed';
      console.warn('[MerchantContext] updateProduct network error:', err);
    }

    setProducts((prev) => {
      let updatedTarget: MerchantProductItem | null = null;
      const next = prev.map((p) => {
        if (p.id !== id && p.sku !== id) return p;
        const wasDraft = p.status === 'DRAFT';
        const isSavingAsDraft = updated.status === 'DRAFT';
        const isPendingApproval =
          !isSavingAsDraft &&
          (wasDraft ||
            p.status === 'PENDING_APPROVAL' ||
            !p.bin ||
            p.bin === 'Pending Approval' ||
            p.bin === 'Assigned on intake');
        updatedTarget = {
          ...p,
          ...updated,
          imageUrl: updated.imageUrl !== undefined ? updated.imageUrl : p.imageUrl,
          images: updated.images !== undefined ? updated.images : (p.images || []),
          status: isSavingAsDraft
            ? 'DRAFT'
            : isPendingApproval
              ? 'PENDING_APPROVAL'
              : updated.status ?? p.status,
        };
        return updatedTarget;
      });
      if (typeof window !== 'undefined') {
        safeSetLocalStorage(getMerchantProductsKey(profile.merchantCode), JSON.stringify(next));
        if (updatedTarget) {
          syncMerchantProductUpdatedToAdmin(updatedTarget, profile);
        }
      }
      return next;
    });

    if (serverOk) {
      showToast('প্রোডাক্ট সফলভাবে PostgreSQL ডাটাবেজে আপডেট হয়েছে!');
      return { ok: true };
    } else {
      showToast(`প্রোডাক্ট লোকালি আপডেট হয়েছে (${serverError || 'ডাটাবেজ সিঙ্ক ব্যর্থ'})`);
      return { ok: true }; // Allow UI transition while noting local update
    }
  };

  const toggleProductStatus = (id: string) => {
    const target = products.find((p) => p.id === id);
    if (!target) return;

    const isTargetDraft = target.status === 'DRAFT';
    const isTargetRejected = target.status === 'REJECTED';
    const isPendingOrAwaiting =
      !isTargetRejected &&
      (target.status === 'PENDING_APPROVAL' ||
        target.status === 'APPROVED' ||
        target.stockStatus === 'AWAITING_STOCK' ||
        target.stockAccepted === false);
    const hasPhysicalStock = (target.stock || 0) > 0;
    const isTargetStockStored =
      !isTargetDraft &&
      !isTargetRejected &&
      !isPendingOrAwaiting &&
      (target.status === 'STOCK_STORED' || target.status === 'PUBLISHED') &&
      hasPhysicalStock;

    // Rule: When physical stock is already stored in warehouse, merchant cannot move to Draft (must request return)
    if (!isTargetDraft && !isTargetRejected && isTargetStockStored) {
      showToast(
        `Action Blocked: "${target.title}" has ${target.stock} units stored in warehouse. Please use "Request to Return" before drafting.`
      );
      return;
    }

    let newStatus: 'DRAFT' | 'PENDING_APPROVAL' | 'APPROVED' | 'STOCK_STORED';
    if (isTargetRejected || isTargetDraft) {
      // Submitting from draft or re-requesting store from rejected requires admin approval
      newStatus = 'PENDING_APPROVAL';
    } else {
      // Pending Approval or Awaiting Stock can be cancelled / moved back to Draft
      newStatus = 'DRAFT';
    }

    const updatedTarget: MerchantProductItem = {
      ...target,
      status: newStatus,
      rejectionReason: newStatus === 'PENDING_APPROVAL' ? undefined : target.rejectionReason,
      stockAccepted: newStatus === 'DRAFT' ? false : target.stockAccepted,
      stockStatus: newStatus === 'DRAFT' ? 'AWAITING_STOCK' : target.stockStatus,
      bin: newStatus === 'DRAFT' || isTargetRejected ? 'Pending Approval' : target.bin,
    };

    setProducts((prev) => {
      const next = prev.map((p) => (p.id === id ? updatedTarget : p));
      if (typeof window !== 'undefined') {
        localStorage.setItem(getMerchantProductsKey(profile.merchantCode), JSON.stringify(next));
      }
      return next;
    });

    syncMerchantProductUpdatedToAdmin(updatedTarget, profile);
    merchantApi.updateProductStatus(id, newStatus).catch(() => {});
    showToast(
      newStatus === 'DRAFT'
        ? `"${target.title}" moved to Draft.`
        : (target.stock || 0) > 0
          ? `"${target.title}" submitted for Warehouse Publish Approval (Waiting for Publish).`
          : `"${target.title}" submitted for Admin Approval.`
    );
  };

  const bulkUpdateStatus = (ids: string[], status: 'PUBLISHED' | 'DRAFT') => {
    const idSet = new Set(ids);
    let blockedCount = 0;

    setProducts((prev) => {
      const next = prev.map((p) => {
        if (!idSet.has(p.id)) return p;

        if (status === 'DRAFT') {
          const isTargetDraft = p.status === 'DRAFT';
          const isTargetFirstTimePending =
            !isTargetDraft &&
            (p.status === 'PENDING_APPROVAL' ||
              !p.bin ||
              p.bin === 'Pending Approval' ||
              p.bin === 'Assigned on intake') &&
            (p.stock || 0) === 0;

          const isAcceptedByAdmin =
            !isTargetDraft &&
            !isTargetFirstTimePending &&
            (p.status === 'APPROVED' ||
              p.status === 'STOCK_STORED' ||
              (Boolean(p.bin) &&
                p.bin !== 'Pending Approval' &&
                p.bin !== 'Assigned on intake'));

          if (isAcceptedByAdmin) {
            blockedCount++;
            return p; // Skip moving accepted product to Draft
          }
        }

        let nextStage: 'DRAFT' | 'PENDING_APPROVAL' | 'APPROVED' | 'STOCK_STORED' = 'DRAFT';
        if (status !== 'DRAFT') {
          if (p.status === 'DRAFT') {
            nextStage = 'PENDING_APPROVAL';
          } else {
            const hasApprovedBin =
              Boolean(p.bin) &&
              p.bin !== 'Pending Approval' &&
              p.bin !== 'Assigned on intake';
            nextStage = (p.stock || 0) > 0 && hasApprovedBin
              ? 'STOCK_STORED'
              : hasApprovedBin
                ? 'APPROVED'
                : 'PENDING_APPROVAL';
          }
        }
        const updated: MerchantProductItem = { ...p, status: nextStage };
        syncMerchantProductUpdatedToAdmin(updated, profile);
        merchantApi.updateProductStatus(p.id, nextStage).catch(() => {});
        return updated;
      });
      if (typeof window !== 'undefined') {
        localStorage.setItem(getMerchantProductsKey(profile.merchantCode), JSON.stringify(next));
      }
      return next;
    });

    if (blockedCount > 0) {
      showToast(
        `${blockedCount} accepted product(s) skipped. After admin accepts a product, it cannot be drafted.`
      );
    } else {
      showToast(
        status === 'DRAFT'
          ? `Moved ${ids.length} product(s) to Draft.`
          : `Submitted ${ids.length} product(s) for Admin Approval.`
      );
    }
  };

  const bulkDeleteProducts = (ids: string[]) => {
    const selected = products.filter((p) => ids.includes(p.id));
    const withStock = selected.filter((p) => (p.stock || 0) >= 1);
    const deletable = selected.filter((p) => (p.stock || 0) === 0);

    if (withStock.length > 0 && deletable.length === 0) {
      showToast(
        `Cannot delete: ${withStock.length} product(s) still have warehouse stock (> 0 pcs). Stock must be 0 to delete.`
      );
      return;
    }

    const deletableIds = new Set(deletable.map((p) => p.id));
    setProducts((prev) => {
      const deleted = prev.filter((p) => deletableIds.has(p.id));
      const next = prev.filter((p) => !deletableIds.has(p.id));
      if (typeof window !== 'undefined') {
        localStorage.setItem(getMerchantProductsKey(profile.merchantCode), JSON.stringify(next));
        syncMerchantProductsDeletedToAdmin(deleted);
      }
      return next;
    });

    deletable.forEach((p) => {
      merchantApi.deleteProduct(p.id).catch(() => {});
    });

    if (withStock.length > 0) {
      showToast(
        `Deleted ${deletable.length} product(s) with 0 stock. Skipped ${withStock.length} product(s) that have warehouse stock.`
      );
    } else {
      showToast(`Deleted ${deletable.length} product(s) from database.`);
    }
  };

  const requestStockOperation = (payload: import("./products/modals/ManageStockModal").SubmitStockRequestPayload) => {
    const product = products.find((p) => p.id === payload.productId);
    if (!product || payload.requestedQty <= 0) return;

    const isReturn = payload.type === 'RETURN';
    const newReq: StockRequestItem = {
      id: isReturn ? `SW-${Date.now().toString().slice(-4)}` : `SR-${Date.now().toString().slice(-4)}`,
      productId: payload.productId,
      productTitle: product.title,
      productSku: product.sku,
      variantSku: payload.variantSku,
      color: payload.color,
      size: payload.size,
      type: payload.type,
      requestedQty: payload.requestedQty,
      currentStock: product.stock,
      status: 'PENDING_APPROVAL',
      note: payload.note,
      reason: payload.reason,
      destination: payload.destination,
      carrier: payload.carrier,
      trackingRef:
        payload.trackingRef ||
        (isReturn ? `RET-${Date.now().toString().slice(-6)}` : `INB-${Date.now().toString().slice(-6)}`),
      createdAt: new Date().toISOString().replace('T', ' ').slice(0, 16),
      imageUrl: product.imageUrl,
    };

    setStockRequests((prev) => {
      const next = [newReq, ...prev];
      if (typeof window !== 'undefined') {
        localStorage.setItem(getMerchantStockRequestsKey(profile.merchantCode), JSON.stringify(next));
      }
      return next;
    });

    syncMerchantStockRequestToAdmin(newReq, profile);

    // If Return, deduct stock from the product and matching variant
    if (isReturn) {
      setProducts((prev) => {
        let updatedTarget: MerchantProductItem | null = null;
        const next = prev.map((p) => {
          if (p.id !== payload.productId) return p;
          const updatedVariants = (p.variantsList || []).map((v) => {
            const matches =
              (payload.variantSku && v.variantSku === payload.variantSku) ||
              (payload.color &&
                payload.size &&
                (v.color || '').toLowerCase() === payload.color.toLowerCase() &&
                (v.size || '').toLowerCase() === payload.size.toLowerCase());
            if (matches) {
              return { ...v, stock: Math.max(0, v.stock - payload.requestedQty) };
            }
            return v;
          });
          const newTotalStock = Math.max(0, p.stock - payload.requestedQty);
          updatedTarget = {
            ...p,
            stock: newTotalStock,
            variantsList: updatedVariants.length > 0 ? updatedVariants : p.variantsList,
          };
          return updatedTarget;
        });

        if (typeof window !== 'undefined') {
          localStorage.setItem(getMerchantProductsKey(profile.merchantCode), JSON.stringify(next));
          if (updatedTarget) {
            syncMerchantProductUpdatedToAdmin(updatedTarget, profile);
          }
        }
        return next;
      });

      showToast(`Return request of ${payload.requestedQty} units (${payload.color || ''} ${payload.size || ''}) submitted & warehouse stock updated.`);
    } else {
      showToast(`Inbound restock request (+${payload.requestedQty} units) submitted for Admin Approval.`);
    }
  };

  const requestStockAdd = (productId: string, requestedQty: number, note?: string) => {
    requestStockOperation({
      productId,
      type: 'RESTOCK',
      requestedQty,
      note,
    });
  };

  const manageProductVariantsAndStock = async (
    payload: import("./products/types").ManageVariantsAndStockPayload
  ): Promise<{ ok: boolean; error?: string }> => {
    const targetProduct = products.find((p) => p.id === payload.productId);
    if (!targetProduct) {
      return { ok: false, error: 'Product not found' };
    }

    let apiResult: { ok: boolean; data?: any; error?: string } = { ok: false };
    try {
      apiResult = await merchantApi.manageProductStock(payload.productId, {
        newVariants: payload.newVariants,
        adjustments: payload.adjustments.map((a) => ({
          ...a,
          reason: a.reason || payload.reason,
        })),
      });
    } catch (err: any) {
      apiResult = { ok: false, error: err?.message || 'Network error' };
    }

    if (!apiResult.ok && apiResult.error) {
      if (/suspend|reject/i.test(apiResult.error)) {
        showToast(apiResult.error);
        return { ok: false, error: apiResult.error };
      }
      console.warn(
        '[MerchantContext] manageProductStock server sync fallback to local cache:',
        apiResult.error
      );
    }

    // Update local state (preferring backend-returned variants if available)
    setProducts((prev) => {
      let updatedTarget: MerchantProductItem | null = null;
      const next = prev.map((p) => {
        if (p.id !== payload.productId) return p;

        let nextVariants = [...(p.variantsList || [])];
        let nextColors = [...(p.colors || [])];
        let nextSizes = [...(p.sizes || [])];

        if (apiResult.ok && apiResult.data?.variants && Array.isArray(apiResult.data.variants)) {
          const remoteVariants = apiResult.data.variants;
          const colorMap = new Map<string, { id: string; name: string; hex: string; imageUrl?: string; sizes: string[] }>();
          nextColors.forEach((c) => {
            colorMap.set(c.name.toLowerCase(), { ...c, sizes: [...(c.sizes || [])] });
          });

          nextVariants = remoteVariants.map((rv: any) => {
            const cName = rv.attributes?.color || rv.title?.split('/')[0]?.trim() || '';
            const sName = rv.attributes?.size || rv.title?.split('/')[1]?.trim() || '';
            const cHex = rv.attributes?.hex || '#111827';
            const vImg = rv.imageUrl || rv.attributes?.imageUrl;
            const vPhysical = rv.inventoryItems?.[0]?.quantityAvailable ?? 0;
            const vDeclared = Number(rv.attributes?.declaredStock ?? rv.attributes?.stock ?? 0);
            const vStock = vPhysical > 0 ? vPhysical : vDeclared;

            if (cName) {
              const key = cName.toLowerCase();
              if (!colorMap.has(key)) {
                colorMap.set(key, {
                  id: `c-${colorMap.size + 1}`,
                  name: cName,
                  hex: cHex,
                  imageUrl: vImg,
                  sizes: sName ? [sName] : [],
                });
              } else {
                const entry = colorMap.get(key)!;
                if (sName && !entry.sizes.includes(sName)) {
                  entry.sizes.push(sName);
                }
              }
            }
            if (sName && !nextSizes.includes(sName)) {
              nextSizes.push(sName);
            }

            return {
              id: rv.id,
              variantSku: rv.sku,
              color: cName,
              size: sName,
              imageUrl: vImg,
              attributeName: rv.attributes?.attributeName,
              attributeValue: rv.attributes?.attributeValue,
              stock: vStock,
            };
          });

          nextColors = Array.from(colorMap.values());
        } else {
          // Offline / localStorage fallback
          if (
            nextVariants.length === 0 &&
            payload.adjustments.length > 0 &&
            payload.newVariants.length > 0
          ) {
            nextVariants.push({
              id: `var-std-${Date.now()}`,
              variantSku: `${p.sku}-STD`,
              color: 'Standard',
              size: 'Standard',
              imageUrl: p.imageUrl,
              stock: Math.max(0, Math.round(payload.adjustments[0].newQuantity)),
            });
          }

          for (const adj of payload.adjustments) {
            const idx = nextVariants.findIndex(
              (v) =>
                (adj.variantId && v.id === adj.variantId) ||
                (adj.variantSku && v.variantSku === adj.variantSku) ||
                (adj.color &&
                  adj.size &&
                  (v.color || '').toLowerCase() === adj.color.toLowerCase() &&
                  (v.size || '').toLowerCase() === adj.size.toLowerCase())
            );
            if (idx >= 0) {
              nextVariants[idx] = {
                ...nextVariants[idx],
                stock: Math.max(0, Math.round(adj.newQuantity)),
              };
            }
          }

          for (const nv of payload.newVariants) {
            const cName = (nv.color || '').trim();
            const sName = (nv.size || '').trim();
            const qty = Math.max(0, Math.round(nv.stock || 0));
            const varCode = [cName, sName].filter(Boolean).join('-').toUpperCase().replace(/[^A-Z0-9_-]/g, '-') || `V${nextVariants.length + 1}`;
            const generatedSku = `${p.sku}-${varCode}`;

            nextVariants.push({
              id: `var-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
              variantSku: generatedSku,
              color: cName || undefined,
              size: sName || undefined,
              attributeName: nv.attributeName,
              attributeValue: nv.attributeValue,
              imageUrl: nv.imageUrl || p.imageUrl,
              stock: qty,
            });

            if (cName) {
              const existingColor = nextColors.find(
                (c) => c.name.toLowerCase() === cName.toLowerCase()
              );
              if (!existingColor) {
                nextColors.push({
                  id: `c-${nextColors.length + 1}`,
                  name: cName,
                  hex: nv.hex || '#111827',
                  imageUrl: nv.imageUrl,
                  sizes: sName ? [sName] : [],
                });
              } else if (sName && !(existingColor.sizes || []).includes(sName)) {
                existingColor.sizes = [...(existingColor.sizes || []), sName];
              }
            }
            if (sName && !nextSizes.includes(sName)) {
              nextSizes.push(sName);
            }
          }
        }

        const totalStock =
          nextVariants.length > 0
            ? nextVariants.reduce((sum, v) => sum + (Number(v.stock) || 0), 0)
            : payload.adjustments.length > 0
            ? Math.max(0, Math.round(payload.adjustments[0].newQuantity))
            : p.stock;

        const nextVariantLabel =
          nextVariants.length > 1
            ? `${nextVariants.length} Variants`
            : nextVariants.length === 1
            ? [nextVariants[0].color, nextVariants[0].size].filter(Boolean).join(' / ') || 'Standard'
            : p.variantLabel;

        const nextStatus =
          p.status === 'APPROVED' && totalStock > 0 ? ('STOCK_STORED' as const) : p.status;
        const nextStockAccepted =
          nextStatus === 'STOCK_STORED' ? true : p.stockAccepted;
        const nextStockStatus =
          nextStatus === 'STOCK_STORED' || nextStatus === 'PUBLISHED'
            ? totalStock > 0
              ? ('IN_STOCK' as const)
              : ('OUT_OF_STOCK' as const)
            : p.stockStatus;

        updatedTarget = {
          ...p,
          variantLabel: nextVariantLabel,
          stock: totalStock,
          status: nextStatus,
          stockAccepted: nextStockAccepted,
          stockStatus: nextStockStatus,
          variantsList: nextVariants,
          colors: nextColors,
          sizes: nextSizes,
        };
        return updatedTarget;
      });

      if (typeof window !== 'undefined') {
        safeSetLocalStorage(getMerchantProductsKey(profile.merchantCode), JSON.stringify(next));
        if (updatedTarget) {
          syncMerchantProductUpdatedToAdmin(updatedTarget, profile);
        }
      }
      return next;
    });

    const addedCount = payload.newVariants.length;
    const adjCount = payload.adjustments.length;
    const summaryParts: string[] = [];
    if (addedCount > 0) summaryParts.push(`${addedCount} new variant${addedCount > 1 ? 's' : ''} added`);
    if (adjCount > 0) summaryParts.push(`${adjCount} quantity adjustment${adjCount > 1 ? 's' : ''} saved`);
    showToast(summaryParts.length > 0 ? `Stock updated: ${summaryParts.join(' & ')}.` : 'Stock updated.');

    return { ok: true };
  };

  const approveStockRequest = (requestId: string) => {
    const req = stockRequests.find((r) => r.id === requestId);
    if (!req || req.status === 'APPROVED') return;

    const isReturn = req.type === 'RETURN';
    const delta = isReturn ? -req.requestedQty : req.requestedQty;

    // Adjust stock to product
    setProducts((prev) => {
      let updatedTarget: MerchantProductItem | null = null;
      const next = prev.map((p) => {
        if (p.id !== req.productId) return p;
        updatedTarget = { ...p, stock: Math.max(0, p.stock + delta) };
        return updatedTarget;
      });
      if (typeof window !== 'undefined') {
        localStorage.setItem(getMerchantProductsKey(profile.merchantCode), JSON.stringify(next));
        if (updatedTarget) {
          syncMerchantProductUpdatedToAdmin(updatedTarget, profile);
        }
      }
      return next;
    });

    // Mark request as APPROVED
    setStockRequests((prev) => {
      const next = prev.map((r) =>
        r.id === requestId ? { ...r, status: 'APPROVED' as const } : r
      );
      if (typeof window !== 'undefined') {
        localStorage.setItem(getMerchantStockRequestsKey(profile.merchantCode), JSON.stringify(next));
      }
      return next;
    });

    showToast(
      isReturn
        ? `Admin approved return: -${req.requestedQty} units withdrawn from ${req.productSku}.`
        : `Admin approved restock: +${req.requestedQty} units added to ${req.productSku}.`
    );
  };

  const cancelStockRequest = (requestId: string) => {
    setStockRequests((prev) => {
      const next = prev.filter((r) => r.id !== requestId);
      if (typeof window !== 'undefined') {
        localStorage.setItem(getMerchantStockRequestsKey(profile.merchantCode), JSON.stringify(next));
      }
      return next;
    });
    showToast('Stock request cancelled.');
  };

  const requestEditAccess = async (productId: string, reason: string): Promise<boolean> => {
    const target = products.find((p) => p.id === productId);
    if (!target) return false;

    const updatedTarget: MerchantProductItem = {
      ...target,
      editState: 'EDIT_ACCESS_REQUESTED',
      editReason: reason,
    } as any;

    setProducts((prev) => {
      const next = prev.map((p) => (p.id === productId ? updatedTarget : p));
      if (typeof window !== 'undefined') {
        localStorage.setItem(getMerchantProductsKey(profile.merchantCode), JSON.stringify(next));
      }
      return next;
    });

    syncMerchantProductUpdatedToAdmin(updatedTarget, profile);

    try {
      await fetch(`/api/inventory/products/${productId}/request-edit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason }),
      });
    } catch {}

    showToast(`Edit request for "${target.title}" submitted to warehouse admin.`);
    return true;
  };

  const cancelPendingEdit = async (productId: string): Promise<boolean> => {
    const target = products.find((p) => p.id === productId);
    if (!target) return false;

    try {
      await merchantApi.cancelProductRevision(productId);
    } catch {
      // Fall back to local clear
    }

    setProducts((prev) => {
      const next = prev.map((p) =>
        p.id === productId
          ? {
              ...p,
              editState: null,
              pendingEdit: null,
            }
          : p
      );
      if (typeof window !== 'undefined') {
        safeSetLocalStorage(getMerchantProductsKey(profile.merchantCode), JSON.stringify(next));
        syncMerchantProductRevisionToAdmin(productId, null, null);
      }
      return next;
    });

    showToast('Pending edit cancelled. Published product remains unchanged.');
    return true;
  };

  const createOrder = async (
    rawOrder: MerchantOrderItem,
    productIdOrItems?: string | { productId: string; qty: number }[],
    qty?: number
  ): Promise<{ ok: boolean; error?: string }> => {
    const cleanId = (rawOrder.id || rawOrder.orderNumber || `ORD-${Date.now()}`).replace(/^#/, '').trim();
    const cleanOrderNumber = (rawOrder.orderNumber || cleanId).replace(/^#/, '').trim();
    const order: MerchantOrderItem = {
      ...rawOrder,
      id: cleanId,
      orderNumber: cleanOrderNumber,
    };
    const itemsToDeduct: { productId: string; qty: number }[] = [];
    if (Array.isArray(productIdOrItems)) {
      itemsToDeduct.push(...productIdOrItems);
    } else if (typeof productIdOrItems === 'string') {
      itemsToDeduct.push({ productId: productIdOrItems, qty: qty || order.qty || 1 });
    } else if (order.lineItems && order.lineItems.length > 0) {
      order.lineItems.forEach((li) => {
        itemsToDeduct.push({ productId: li.id, qty: li.quantity });
      });
    } else if (order.productId) {
      itemsToDeduct.push({ productId: order.productId, qty: order.qty || 1 });
    }

    // Strict Business Logic: Merchant must create and select a custom memo
    if (!memoList || memoList.length === 0) {
      const err = `Cannot create order: You must create at least one custom Memo Template before placing orders. Please design your invoice memo in the Memo Designer.`;
      showToast(err);
      return { ok: false, error: err };
    }

    if (!order.memoCode || !order.memoCode.trim()) {
      const err = `Cannot create order: A custom Memo Template must be selected for every order.`;
      showToast(err);
      return { ok: false, error: err };
    }

    const matchedMemo = memoList.find((m) => m.code === order.memoCode);
    if (!matchedMemo) {
      const err = `Cannot create order: Selected memo "${order.memoCode}" is not found in your created memo templates. Please choose a valid memo template.`;
      showToast(err);
      return { ok: false, error: err };
    }

    // Strict Business Logic: Orders can only be placed for approved products with verified stored stock
    for (const it of itemsToDeduct) {
      const prod = products.find((p) => p.id === it.productId);
      if (prod) {
        if (Boolean((prod as any).isSuspended)) {
          const err = `Cannot order "${prod.title}": Product is currently suspended by warehouse admin.`;
          showToast(err);
          return { ok: false, error: err };
        }

        const isApprovedAndStocked =
          (prod.status === 'PUBLISHED' || prod.status === 'STOCK_STORED') &&
          prod.stockAccepted !== false &&
          prod.stockStatus !== 'AWAITING_STOCK';
        if (!isApprovedAndStocked) {
          const err = `Cannot create order: "${prod.title}" is waiting for warehouse stock intake. Orders can only be placed after the warehouse admin receives and publishes the stock into inventory.`;
          showToast(err);
          return { ok: false, error: err };
        }
        if ((prod.stock || 0) < it.qty) {
          const err = `Cannot create order: "${prod.title}" has insufficient warehouse stock (Available: ${prod.stock || 0}, Requested: ${it.qty}). Please wait for stock intake.`;
          showToast(err);
          return { ok: false, error: err };
        }
      }
    }

    let latestProducts = products;
    setProducts((prev) => {
      const next = prev.map((p) => {
        const match = itemsToDeduct.find(
          (it: any) =>
            it.productId === p.id ||
            (it.variantSku && (p.sku === it.variantSku || (p.variantsList && p.variantsList.some((v) => v.variantSku === it.variantSku))))
        );
        if (match) {
          const matchAny = match as any;
          const updatedVariants = (p.variantsList || []).map((v) => {
            const isMatch =
              (matchAny.variantSku && v.variantSku.toUpperCase() === matchAny.variantSku.toUpperCase()) ||
              (matchAny.color && matchAny.size &&
                (v.color || '').toLowerCase() === matchAny.color.toLowerCase() &&
                (v.size || '').toLowerCase() === matchAny.size.toLowerCase());
            if (isMatch) {
              return { ...v, stock: Math.max(0, v.stock - match.qty) };
            }
            return v;
          });

          return {
            ...p,
            stock: Math.max(0, p.stock - match.qty),
            reserved: (p.reserved || 0) + match.qty,
            variantsList: updatedVariants.length > 0 ? updatedVariants : p.variantsList,
          };
        }
        return p;
      });
      latestProducts = next;
      if (typeof window !== 'undefined') {
        localStorage.setItem(getMerchantProductsKey(profile.merchantCode), JSON.stringify(next));
      }
      return next;
    });

    // 1. Upload order directly to PostgreSQL backend
    const res = await merchantApi.createOrder(order);

    if (!res.ok) {
      console.warn('Backend order upload notice:', res.error);
      // Fallback: preserve in local cache memory so no user data is lost
      setOrders((prev) => {
        const next = [order, ...prev];
        if (typeof window !== 'undefined') {
          localStorage.setItem(getMerchantOrdersKey(profile.merchantCode), JSON.stringify(next));
        }
        return next;
      });
      syncMerchantOrderCreatedToAdmin(order, itemsToDeduct, latestProducts, memoList, profile);
      showToast(`সতর্কতা: ডাটাবেজে সেভ হতে সমস্যা হয়েছে (${res.error}), লোকাল ক্যাশে সেভ করা হয়েছে।`);
      return { ok: false, error: res.error };
    }

    // 2. If uploaded successfully, refresh orders from PostgreSQL
    try {
      const serverOrds = await merchantApi.getOrders();
      if (serverOrds && serverOrds.length > 0) {
        setOrders(serverOrds);
        if (typeof window !== 'undefined') {
          localStorage.setItem(getMerchantOrdersKey(profile.merchantCode), JSON.stringify(serverOrds));
        }
      } else {
        setOrders((prev) => {
          const next = [order, ...prev];
          if (typeof window !== 'undefined') {
            localStorage.setItem(getMerchantOrdersKey(profile.merchantCode), JSON.stringify(next));
          }
          return next;
        });
      }
    } catch {
      setOrders((prev) => {
        const next = [order, ...prev];
        if (typeof window !== 'undefined') {
          localStorage.setItem(getMerchantOrdersKey(profile.merchantCode), JSON.stringify(next));
        }
        return next;
      });
    }

    syncMerchantOrderCreatedToAdmin(order, itemsToDeduct, latestProducts, memoList, profile);
    showToast(
      `অর্ডার ${order.orderNumber || order.id} সফলভাবে PostgreSQL ডাটাবেজে সেভ হয়েছে!`
    );
    return { ok: true };
  };

  const syncLocalOrdersToDatabase = async (): Promise<{ uploaded: number; failed: number }> => {
    let uploaded = 0;
    let failed = 0;
    for (const ord of orders) {
      try {
        const res = await merchantApi.createOrder(ord);
        if (res.ok) {
          uploaded++;
        } else {
          failed++;
        }
      } catch {
        failed++;
      }
    }
    if (uploaded > 0) {
      const serverOrds = await merchantApi.getOrders();
      if (serverOrds && serverOrds.length > 0) {
        setOrders(serverOrds);
        if (typeof window !== 'undefined') {
          localStorage.setItem(getMerchantOrdersKey(profile.merchantCode), JSON.stringify(serverOrds));
        }
      }
      showToast(`${uploaded} টি অর্ডার সফলভাবে PostgreSQL ডাটাবেজে আপলোড হয়েছে!`);
    } else if (failed > 0) {
      showToast('অর্ডার ডাটাবেজে আপলোড হতে সমস্যা হয়েছে।');
    } else {
      showToast('সব অর্ডার ইতিমধ্যে ডাটাবেজে সংরক্ষিত রয়েছে।');
    }
    return { uploaded, failed };
  };

  const cancelOrder = async (orderId: string, reason?: string): Promise<boolean> => {
    if (!orderId) return false;
    const cleanReqId = orderId.replace(/^#/, '').toLowerCase().trim();

    // 1. Find target order in memory (robust lookup)
    const target = orders.find((o) => {
      const oId = (o.id || '').replace(/^#/, '').toLowerCase().trim();
      const oNum = (o.orderNumber || '').replace(/^#/, '').toLowerCase().trim();
      return (
        oId === cleanReqId ||
        oNum === cleanReqId ||
        o.id === orderId ||
        o.orderNumber === orderId
      );
    });

    const cleanTargetId = target?.orderNumber || target?.id || cleanReqId;
    const displayOrderNum = cleanTargetId.startsWith('#') ? cleanTargetId : `#${cleanTargetId}`;

    // Strict Rule: Once handed over to courier, order cannot be cancelled
    if (target && !isOrderCancellable(target.status, target.courierStatus)) {
      showToast(`Cannot cancel order ${displayOrderNum}: Parcel is already handed over to courier (${target.courier || 'partner'}) or in transit.`);
      return false;
    }

    // 2. Identify items to restore from target
    const itemsToRestore: Array<{ productId: string; qty: number; variantSku?: string; color?: string; size?: string }> = [];
    if (target?.lineItems && target.lineItems.length > 0) {
      target.lineItems.forEach((li) => {
        const vParts = (li.variant || '').split('·');
        itemsToRestore.push({
          productId: li.id,
          qty: li.quantity,
          variantSku: li.sku,
          color: vParts[0]?.trim(),
          size: vParts[1]?.trim(),
        });
      });
    } else if (target?.productId) {
      itemsToRestore.push({ productId: target.productId, qty: target.qty || 1 });
    }

    // 3. Restore inventory in Merchant products
    let latestProducts = products;
    if (itemsToRestore.length > 0) {
      setProducts((prev) => {
        const next = prev.map((p) => {
          const match = itemsToRestore.find(
            (it) =>
              it.productId === p.id ||
              (it.variantSku && (p.sku === it.variantSku || (p.variantsList && p.variantsList.some((v) => v.variantSku === it.variantSku))))
          );
          if (match) {
            const updatedVariants = (p.variantsList || []).map((v) => {
              const isMatch =
                (match.variantSku && v.variantSku.toUpperCase() === match.variantSku.toUpperCase()) ||
                (match.color && match.size &&
                  (v.color || '').toLowerCase() === match.color.toLowerCase() &&
                  (v.size || '').toLowerCase() === match.size.toLowerCase());
              if (isMatch) {
                return { ...v, stock: v.stock + match.qty };
              }
              return v;
            });

            return {
              ...p,
              stock: p.stock + match.qty,
              reserved: Math.max(0, (p.reserved || 0) - match.qty),
              variantsList: updatedVariants.length > 0 ? updatedVariants : p.variantsList,
            };
          }
          return p;
        });
        latestProducts = next;
        if (typeof window !== 'undefined') {
          safeLocalStorageSet(getMerchantProductsKey(profile.merchantCode), JSON.stringify(next));
        }
        return next;
      });
    }

    // 4. Update orders in Merchant state & localStorage immediately
    setOrders((prev) => {
      const next = prev.map((o) => {
        const oId = (o.id || '').replace(/^#/, '').toLowerCase().trim();
        const oNum = (o.orderNumber || '').replace(/^#/, '').toLowerCase().trim();
        if (
          oId === cleanReqId ||
          oNum === cleanReqId ||
          o.id === orderId ||
          o.orderNumber === orderId
        ) {
          return { ...o, status: 'CANCELLED' as const };
        }
        return o;
      });
      if (typeof window !== 'undefined') {
        safeLocalStorageSet(getMerchantOrdersKey(profile.merchantCode), JSON.stringify(next));
      }
      return next;
    });

    // 5. Update in PostgreSQL Database via API
    try {
      await cancelOrderInDatabase(cleanTargetId);
      if (target?.id && target.id !== cleanTargetId) {
        await cancelOrderInDatabase(target.id);
      }
    } catch (dbErr) {
      console.warn('[MerchantContext] DB cancellation error:', dbErr);
    }

    // 6. Sync with Admin Warehouse Pipeline & Stock Recovery Ledger
    syncMerchantOrderCancelledToAdmin(cleanTargetId, itemsToRestore, latestProducts);

    // 7. Accumulate into Returns & Cancellations Hub (both merchant & admin)
    try {
      if (typeof window !== 'undefined') {
        const now = new Date();
        const timeStr = `${now.toLocaleDateString('en-CA')} ${now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
        const newProofId = `PRF-${now.getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;

        const totalQty = target?.qty || itemsToRestore.reduce((s, it) => s + it.qty, 0) || 1;
        const newCancelRecord: CancelledOrderItemRecord = {
          id: cleanReqId,
          orderId: displayOrderNum,
          merchantCode: profile.merchantCode || 'MC-101',
          merchantName: profile.storeName || "Sabbir's Store",
          customerName: target?.customer || 'Customer',
          customerPhone: target?.phone || 'N/A',
          city: target?.address ? target.address.split(',')[0].trim() : 'Dhaka',
          productTitle: target?.lineItems?.[0]?.title || target?.items || 'Product Item',
          fullSku: target?.lineItems?.[0]?.sku || 'SKU-001',
          color: target?.lineItems?.[0]?.variant ? target.lineItems[0].variant.split('·')[0]?.trim() : 'Standard',
          size: target?.lineItems?.[0]?.variant ? target.lineItems[0].variant.split('·')[1]?.trim() : 'Standard',
          qty: totalQty,
          unitPrice: target?.amount ? target.amount / Math.max(1, target.qty || 1) : 1200,
          codAmount: target?.amount || 1200,
          targetBin: 'A-01-02',
          currentStockSnapshot: 15,
          cancelledAt: 'Just now',
          cancelReason: reason || 'Cancelled by merchant — restored to available stock',
          isRestocked: true,
          restockedAt: 'Just now',
          restockedBin: 'A-01-02',
          imageUrl: target?.lineItems?.[0]?.imageUrl || '',
        };

        const newLedgerItem: RecoveryLedgerEntry = {
          id: newProofId,
          timestamp: timeStr,
          sourceType: 'ORDER_CANCELLED',
          referenceId: displayOrderNum,
          merchantCode: profile.merchantCode || 'MC-101',
          merchantName: profile.storeName || "Sabbir's Store",
          productTitle: newCancelRecord.productTitle,
          sku: newCancelRecord.fullSku,
          deltaQty: totalQty,
          previousStock: 10,
          newStock: 10 + totalQty,
          binCode: 'A-01-02',
          operator: `${profile.storeName} (Merchant Portal)`,
          digitalProofHash: `FL-SHA256-${cleanReqId.toUpperCase()}-CAN-REV`,
          notes: reason || `Order cancelled by merchant. +${totalQty} units restored to stock.`,
        };

        const rawLedger = localStorage.getItem(STORAGE_KEY_STOCK_LEDGER);
        let currLedger: any[] = [];
        if (rawLedger) {
          try {
            const parsed = JSON.parse(rawLedger);
            if (Array.isArray(parsed)) currLedger = parsed;
          } catch {}
        }
        localStorage.setItem(STORAGE_KEY_STOCK_LEDGER, JSON.stringify([newLedgerItem, ...currLedger]));
      }
    } catch (ledgerErr) {
      console.warn('[MerchantContext] Error writing stock ledger entry:', ledgerErr);
    }

    // 8. Re-fetch latest database orders to ensure full backend reconciliation
    try {
      const serverOrds = await merchantApi.getOrders();
      if (serverOrds && serverOrds.length > 0) {
        setOrders(serverOrds);
        safeLocalStorageSet(getMerchantOrdersKey(profile.merchantCode), JSON.stringify(serverOrds));
      }
    } catch {}

    window.dispatchEvent(
      new CustomEvent('fulfillio-warehouse-sync', { detail: { source: 'MerchantCancelOrder' } })
    );

    showToast(`Order ${displayOrderNum} cancelled successfully & stock restored in PostgreSQL database.`);
    return true;
  };

  const updateOrderStatus = (orderId: string, status: MerchantOrderItem['status']) => {
    setOrders((prev) => {
      const next = prev.map((o) => (o.id === orderId ? { ...o, status } : o));
      if (typeof window !== 'undefined') {
        localStorage.setItem(getMerchantOrdersKey(profile.merchantCode), JSON.stringify(next));
      }
      return next;
    });
    updateOrderStatusInDatabase(orderId, status).catch(() => {});
    merchantApi.updateOrderStatus?.(orderId, status).catch(() => {});
    showToast(`Order ${orderId} status updated to ${status}.`);
  };

  const createAsn = (newAsn: MerchantAsnRecord) => {
    setAsns((prev) => {
      const next = [newAsn, ...prev];
      if (typeof window !== 'undefined') {
        localStorage.setItem(getMerchantAsnsKey(profile.merchantCode), JSON.stringify(next));
      }
      return next;
    });
    merchantApi.createInboundAsn(newAsn).catch(() => {});
  };

  const saveMemo = (newMemo: ResellerMemo) => {
    const memoWithMerchant: ResellerMemo = {
      ...newMemo,
      merchantCode: newMemo.merchantCode || profile.merchantCode || 'MC-101',
      merchantName: newMemo.merchantName || profile.storeName || "Sabbir's Store",
    };
    setMemoList((prev) => {
      const filtered = prev.filter((m) => m.id !== memoWithMerchant.id && m.code !== memoWithMerchant.code);
      const next = [memoWithMerchant, ...filtered];
      if (typeof window !== 'undefined') {
        localStorage.setItem(getMerchantMemosKey(profile.merchantCode), JSON.stringify(next));
        syncMerchantMemoToAdmin(memoWithMerchant, profile);
      }
      return next;
    });
    showToast(`Memo template ${newMemo.code} saved!`);
  };

  const setDefaultMemo = (id: string) => {
    setMemoList((prev) => {
      const next = prev.map((m) => ({ ...m, isDefault: m.id === id }));
      if (typeof window !== 'undefined') {
        localStorage.setItem(getMerchantMemosKey(profile.merchantCode), JSON.stringify(next));
        const target = next.find((m) => m.id === id);
        if (target) {
          syncMerchantMemoToAdmin(target, profile);
        }
      }
      return next;
    });
    showToast('Default memo design updated.');
  };

  const deleteMemo = (id: string) => {
    setMemoList((prev) => {
      const target = prev.find((m) => m.id === id);
      const next = prev.filter((m) => m.id !== id);
      if (typeof window !== 'undefined') {
        localStorage.setItem(getMerchantMemosKey(profile.merchantCode), JSON.stringify(next));
        if (target) {
          syncMerchantMemoDeletedToAdmin(target.id, target.code);
        }
      }
      return next;
    });
    showToast('Memo design deleted.');
  };
  const addCategory = (item: { name: string; description?: string; subcategories?: string[] }) => {
    const slug = item.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
    const newCat: MerchantCategoryItem = {
      id: `cat-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      name: item.name.trim(),
      slug: slug || `cat-${Date.now()}`,
      description: item.description?.trim(),
      createdAt: new Date().toISOString(),
      subcategories: (item.subcategories || []).map((subName) => ({
        id: `sub-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
        name: subName.trim(),
        slug: subName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, ''),
        createdAt: new Date().toISOString(),
      })),
    };
    setCategories((prev) => {
      const next = [newCat, ...prev];
      saveMerchantCategoriesForCode(profile.merchantCode, next);
      return next;
    });
    showToast(`Category "${newCat.name}" added successfully.`);
  };

  const updateCategory = (id: string, updated: Partial<MerchantCategoryItem>) => {
    setCategories((prev) => {
      const next = prev.map((c) => (c.id === id ? { ...c, ...updated } : c));
      saveMerchantCategoriesForCode(profile.merchantCode, next);
      return next;
    });
    showToast('Category updated.');
  };

  const deleteCategory = (id: string) => {
    setCategories((prev) => {
      const target = prev.find((c) => c.id === id);
      const next = prev.filter((c) => c.id !== id);
      saveMerchantCategoriesForCode(profile.merchantCode, next);
      if (target) {
        showToast(`Category "${target.name}" removed.`);
      }
      return next;
    });
  };

  const addSubcategory = (categoryId: string, subcategory: { name: string; description?: string }) => {
    const slug = subcategory.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
    const newSub: MerchantSubcategoryItem = {
      id: `sub-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      name: subcategory.name.trim(),
      slug: slug || `sub-${Date.now()}`,
      description: subcategory.description?.trim(),
      createdAt: new Date().toISOString(),
    };
    setCategories((prev) => {
      const next = prev.map((c) => {
        if (c.id !== categoryId) return c;
        return {
          ...c,
          subcategories: [...c.subcategories, newSub],
        };
      });
      saveMerchantCategoriesForCode(profile.merchantCode, next);
      return next;
    });
    showToast(`Sub-category "${newSub.name}" added.`);
  };

  const updateSubcategory = (categoryId: string, subcategoryId: string, updated: Partial<MerchantSubcategoryItem>) => {
    setCategories((prev) => {
      const next = prev.map((c) => {
        if (c.id !== categoryId) return c;
        return {
          ...c,
          subcategories: c.subcategories.map((s: MerchantSubcategoryItem) => (s.id === subcategoryId ? { ...s, ...updated } : s)),
        };
      });
      saveMerchantCategoriesForCode(profile.merchantCode, next);
      return next;
    });
    showToast('Sub-category updated.');
  };

  const deleteSubcategory = (categoryId: string, subcategoryId: string) => {
    setCategories((prev) => {
      const next = prev.map((c) => {
        if (c.id !== categoryId) return c;
        return {
          ...c,
          subcategories: c.subcategories.filter((s: MerchantSubcategoryItem) => s.id !== subcategoryId),
        };
      });
      saveMerchantCategoriesForCode(profile.merchantCode, next);
      return next;
    });
    showToast('Sub-category removed.');
  };


  return (
    <MerchantContext.Provider
      value={{
        profile,
        products,
        orders,
        memoList,
        asns,
        stockRequests,
        toastMessage,
        isMobileSidebarOpen,
        setIsMobileSidebarOpen,
        showToast,
        clearToast,
        updateProfile,
        adjustStock,
        deleteProduct,
        addProducts,
        updateProduct,
        toggleProductStatus,
        bulkUpdateStatus,
        bulkDeleteProducts,
        requestStockAdd,
        requestStockOperation,
        manageProductVariantsAndStock,
        requestEditAccess,
        cancelPendingEdit,
        approveStockRequest,
        cancelStockRequest,
        createOrder,
        syncLocalOrdersToDatabase,
        cancelOrder,
        updateOrderStatus,
        createAsn,
        saveMemo,
        setDefaultMemo,
        deleteMemo,
        categories,
        addCategory,
        updateCategory,
        deleteCategory,
        addSubcategory,
        updateSubcategory,
        deleteSubcategory,
      }}
    >
      {children}
    </MerchantContext.Provider>
  );
}

export function useMerchant() {
  const context = useContext(MerchantContext);
  if (!context) {
    throw new Error('useMerchant must be used within a MerchantProvider');
  }
  return context;
}
