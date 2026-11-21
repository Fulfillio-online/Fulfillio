'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import {
  MerchantAsnRecord,
  MerchantOrderItem,
  MerchantProductItem,
  MerchantProfileData,
  ResellerMemo,
  MerchantCategoryItem,
  MerchantSubcategoryItem,
} from './types';
import { StockRequestItem } from './products/types';
import { safeSetLocalStorage } from './products/utils/imageCompressor';
import {
  INITIAL_MERCHANT_PROFILE, INITIAL_MERCHANT_PRODUCTS, INITIAL_MERCHANT_ORDERS,
} from './mockData';
import { merchantApi } from './api';
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
  syncMerchantProductUpdatedToAdmin,
  syncMerchantMemoToAdmin,
  syncMerchantMemoDeletedToAdmin,
  syncMerchantStockRequestToAdmin,
  getStoredMerchantCategoriesForCode,
  saveMerchantCategoriesForCode,
  getMerchantCategoriesKey,
} from '@/lib/warehouseSync';

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
  approveStockRequest: (requestId: string) => void;
  cancelStockRequest: (requestId: string) => void;
  createOrder: (
    order: MerchantOrderItem,
    productIdOrItems?: string | { productId: string; qty: number }[],
    qty?: number
  ) => Promise<{ ok: boolean; error?: string }>;
  syncLocalOrdersToDatabase: () => Promise<{ uploaded: number; failed: number }>;
  cancelOrder: (orderId: string) => void;
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
        const [serverProds, serverOrds] = await Promise.all([
          merchantApi.getProducts(),
          merchantApi.getOrders(),
        ]);
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
                (localMatch.status === 'DRAFT' && sp.status !== 'STOCK_STORED' && sp.status !== 'APPROVED');
              const effectiveStock = sp.stock !== undefined ? sp.stock : localMatch.stock;
              const isStockStored =
                !isDraft &&
                isApproved &&
                (sp.status === 'STOCK_STORED' || localMatch.status === 'STOCK_STORED' || effectiveStock > 0);
              const finalStatus = isDraft
                ? ('DRAFT' as const)
                : isStockStored
                  ? ('STOCK_STORED' as const)
                  : isApproved
                    ? ('APPROVED' as const)
                    : ('PENDING_APPROVAL' as const);
              const finalBin = isApproved
                ? (serverApproved ? sp.bin : localMatch.bin)
                : 'Pending Approval';

              return {
                ...localMatch,
                ...sp,
                status: finalStatus,
                bin: finalBin,
                stock: sp.stock !== undefined ? sp.stock : localMatch.stock,
                imageUrl: (sp.imageUrl && sp.imageUrl.trim()) ? sp.imageUrl : localMatch.imageUrl,
                images: (sp.images && sp.images.length > 0) ? sp.images : (localMatch.images || []),
                colors: (sp.colors && sp.colors.some((c) => c.imageUrl)) ? sp.colors : (localMatch.colors || sp.colors),
              };
            }
            return sp;
          });
          setProducts(reconciled);
          if (typeof window !== 'undefined') {
            safeSetLocalStorage(getMerchantProductsKey(code), JSON.stringify(reconciled));
          }
        } else {
          setProducts(getStoredMerchantProductsForCode(code));
        }
        if (serverOrds && serverOrds.length > 0) {
          setOrders(serverOrds);
          if (typeof window !== 'undefined') {
            safeSetLocalStorage(getMerchantOrdersKey(code), JSON.stringify(serverOrds));
          }
        } else {
          setOrders(getStoredMerchantOrdersForCode(code));
        }
      } catch {
        setProducts(getStoredMerchantProductsForCode(code));
        setOrders(getStoredMerchantOrdersForCode(code));
      }

      setMemoList(getStoredMerchantMemosForCode(code, prof));
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
    setProfile((prev) => {
      const next = { ...prev, ...updated };
      if (typeof window !== 'undefined') {
        localStorage.setItem(getMerchantProfileKey(next.merchantCode), JSON.stringify(next));
      }
      return next;
    });
    merchantApi.updateProfile(updated).catch(() => {});
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
    const pendingItems: MerchantProductItem[] = newItems.map((item) => ({
      ...item,
      status: 'PENDING_APPROVAL' as const,
      bin: 'Pending Approval',
    }));

    let savedToDatabase = true;

    // 1. Send directly to PostgreSQL backend
    for (const it of pendingItems) {
      try {
        const res = await merchantApi.createProduct(it);
        if (!res.ok) {
          savedToDatabase = false;
          console.warn('[MerchantContext] createProduct server failed:', res.error);
        }
      } catch (err: any) {
        savedToDatabase = false;
        console.warn('[MerchantContext] createProduct network exception:', err);
      }
    }

    // 2. Refresh from server if online, or save locally with offline resilience
    if (savedToDatabase) {
      try {
        const serverProds = await merchantApi.getProducts();
        if (serverProds && serverProds.length > 0) {
          const reconciled = serverProds.map((sp) => {
            const matchPending = pendingItems.find(
              (pi) => pi.sku === sp.sku || pi.id === sp.id || pi.title === sp.title
            );
            if (matchPending) {
              return {
                ...sp,
                status: 'PENDING_APPROVAL' as const,
                bin: 'Pending Approval',
                colors: (sp.colors && sp.colors.some((c) => c.imageUrl))
                  ? sp.colors
                  : (matchPending.colors || sp.colors),
                imageUrl: sp.imageUrl || matchPending.imageUrl,
              };
            }
            return sp;
          });
          setProducts(reconciled);
          if (typeof window !== 'undefined') {
            safeSetLocalStorage(getMerchantProductsKey(profile.merchantCode), JSON.stringify(reconciled));
            syncMerchantProductsAddedToAdmin(pendingItems, profile);
          }
        } else {
          setProducts((prev) => {
            const filtered = prev.filter((p) => !pendingItems.some((pi) => pi.sku === p.sku || pi.id === p.id));
            const next = [...pendingItems, ...filtered];
            if (typeof window !== 'undefined') {
              safeSetLocalStorage(getMerchantProductsKey(profile.merchantCode), JSON.stringify(next));
              syncMerchantProductsAddedToAdmin(pendingItems, profile);
            }
            return next;
          });
        }
      } catch {
        setProducts((prev) => {
          const filtered = prev.filter((p) => !pendingItems.some((pi) => pi.sku === p.sku || pi.id === p.id));
          const next = [...pendingItems, ...filtered];
          if (typeof window !== 'undefined') {
            safeSetLocalStorage(getMerchantProductsKey(profile.merchantCode), JSON.stringify(next));
            syncMerchantProductsAddedToAdmin(pendingItems, profile);
          }
          return next;
        });
      }
      showToast('প্রোডাক্ট সফলভাবে PostgreSQL ডাটাবেজে সেভ হয়েছে (Pending Admin Approval)!');
    } else {
      // Offline fallback: persist locally and to Admin queue
      setProducts((prev) => {
        const filtered = prev.filter((p) => !pendingItems.some((pi) => pi.sku === p.sku || pi.id === p.id));
        const next = [...pendingItems, ...filtered];
        if (typeof window !== 'undefined') {
          safeSetLocalStorage(getMerchantProductsKey(profile.merchantCode), JSON.stringify(next));
          syncMerchantProductsAddedToAdmin(pendingItems, profile);
        }
        return next;
      });
      showToast('ডাটাবেজ বর্তমানে অফলাইনে থাকায় প্রোডাক্টটি লোকালি Pending Approval হিসেবে সেভ করা হয়েছে।');
    }

    return { ok: true };
  };

  const updateProduct = async (
    id: string,
    updated: Partial<MerchantProductItem>,
  ): Promise<{ ok: boolean; error?: string }> => {
    let targetProduct = products.find((p) => p.id === id || p.sku === id);

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

    let newStatus: 'DRAFT' | 'PENDING_APPROVAL' | 'APPROVED' | 'STOCK_STORED';
    if (target.status !== 'DRAFT') {
      // Merchant can save in draft from Pending Approval, Approved, or Stock Stored
      newStatus = 'DRAFT';
    } else {
      // Any product sent to Draft requires Admin Approval again before it can be published
      newStatus = 'PENDING_APPROVAL';
    }

    const updatedTarget: MerchantProductItem = { ...target, status: newStatus };

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
        ? `"${target.title}" saved in Draft.`
        : `"${target.title}" submitted for Admin Approval.`
    );
  };

  const bulkUpdateStatus = (ids: string[], status: 'PUBLISHED' | 'DRAFT') => {
    const idSet = new Set(ids);
    setProducts((prev) => {
      const next = prev.map((p) => {
        if (!idSet.has(p.id)) return p;
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
    showToast(
      status === 'DRAFT'
        ? `Moved ${ids.length} product(s) to Draft.`
        : `Submitted ${ids.length} product(s) for Admin Approval.`
    );
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

  const createOrder = async (
    order: MerchantOrderItem,
    productIdOrItems?: string | { productId: string; qty: number }[],
    qty?: number
  ): Promise<{ ok: boolean; error?: string }> => {
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

    // Strict Business Logic: Orders can only be placed for approved products with verified stored stock
    for (const it of itemsToDeduct) {
      const prod = products.find((p) => p.id === it.productId);
      if (prod) {
        const isApproved =
          (prod.status === 'PUBLISHED' || (prod.status as any) === 'APPROVED') &&
          prod.bin &&
          prod.bin !== 'Pending Approval' &&
          prod.bin !== 'Assigned on intake';
        if (!isApproved) {
          const err = `Cannot create order: "${prod.title}" is pending warehouse admin approval. Orders can only be created after the warehouse approves the product and accepts stock.`;
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
        const match = itemsToDeduct.find((it) => it.productId === p.id);
        if (match) {
          return {
            ...p,
            stock: Math.max(0, p.stock - match.qty),
            reserved: p.reserved + match.qty,
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

  const cancelOrder = (orderId: string) => {
    const target = orders.find((o) => o.id === orderId || o.orderNumber === orderId);
    if (!target) return;

    const itemsToRestore: { productId: string; qty: number }[] = [];
    if (target.lineItems && target.lineItems.length > 0) {
      target.lineItems.forEach((li) => {
        itemsToRestore.push({ productId: li.id, qty: li.quantity });
      });
    } else if (target.productId) {
      itemsToRestore.push({ productId: target.productId, qty: target.qty });
    }

    let latestProducts = products;
    if (itemsToRestore.length > 0) {
      setProducts((prev) => {
        const next = prev.map((p) => {
          const match = itemsToRestore.find((it) => it.productId === p.id);
          if (match) {
            return {
              ...p,
              stock: p.stock + match.qty,
              reserved: Math.max(0, p.reserved - match.qty),
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
    }

    setOrders((prev) => {
      const next = prev.map((o) =>
        o.id === orderId || o.orderNumber === orderId
          ? { ...o, status: 'CANCELLED' as const }
          : o
      );
      if (typeof window !== 'undefined') {
        localStorage.setItem(getMerchantOrdersKey(profile.merchantCode), JSON.stringify(next));
      }
      return next;
    });

    syncMerchantOrderCancelledToAdmin(target.orderNumber || target.id, itemsToRestore, latestProducts);
    showToast(`Order ${orderId} cancelled & stock restored.`);
  };

  const updateOrderStatus = (orderId: string, status: MerchantOrderItem['status']) => {
    setOrders((prev) => {
      const next = prev.map((o) => (o.id === orderId ? { ...o, status } : o));
      if (typeof window !== 'undefined') {
        localStorage.setItem(getMerchantOrdersKey(profile.merchantCode), JSON.stringify(next));
      }
      return next;
    });
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
