'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import {
  MerchantAsnRecord,
  MerchantOrderItem,
  MerchantProductItem,
  MerchantProfileData,
  ResellerMemo,
} from './types';
import { StockRequestItem } from './products/types';
import {
  INITIAL_MERCHANT_ASNS,
  INITIAL_MERCHANT_MEMOS,
  INITIAL_MERCHANT_ORDERS,
  INITIAL_MERCHANT_PRODUCTS,
  INITIAL_MERCHANT_PROFILE,
  INITIAL_STOCK_REQUESTS,
  STORAGE_KEY_MERCHANT_ASNS,
  STORAGE_KEY_MERCHANT_MEMOS,
  STORAGE_KEY_MERCHANT_ORDERS,
  STORAGE_KEY_MERCHANT_PRODUCTS,
  STORAGE_KEY_MERCHANT_PROFILE,
  STORAGE_KEY_STOCK_REQUESTS,
} from './mockData';
import { merchantApi } from './api';
import {
  syncMerchantOrderCancelledToAdmin,
  syncMerchantOrderCreatedToAdmin,
  syncMerchantProductsAddedToAdmin,
  syncMerchantProductsDeletedToAdmin,
  syncMerchantProductUpdatedToAdmin,
} from '@/lib/warehouseSync';

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
  addProducts: (newItems: MerchantProductItem[]) => void;
  updateProduct: (id: string, updated: Partial<MerchantProductItem>) => void;
  toggleProductStatus: (id: string) => void;
  bulkUpdateStatus: (ids: string[], status: 'PUBLISHED' | 'DRAFT') => void;
  bulkDeleteProducts: (ids: string[]) => void;
  requestStockAdd: (productId: string, requestedQty: number, note?: string) => void;
  approveStockRequest: (requestId: string) => void;
  cancelStockRequest: (requestId: string) => void;
  createOrder: (
    order: MerchantOrderItem,
    productIdOrItems?: string | { productId: string; qty: number }[],
    qty?: number
  ) => void;
  cancelOrder: (orderId: string) => void;
  updateOrderStatus: (orderId: string, status: MerchantOrderItem['status']) => void;
  createAsn: (newAsn: MerchantAsnRecord) => void;
  saveMemo: (newMemo: ResellerMemo) => void;
  setDefaultMemo: (id: string) => void;
  deleteMemo: (id: string) => void;
}

const MerchantContext = createContext<MerchantContextType | undefined>(undefined);

export function MerchantProvider({ children }: { children: ReactNode }) {
  const [profile, setProfile] = useState<MerchantProfileData>(INITIAL_MERCHANT_PROFILE);
  const [products, setProducts] = useState<MerchantProductItem[]>(INITIAL_MERCHANT_PRODUCTS);
  const [orders, setOrders] = useState<MerchantOrderItem[]>(INITIAL_MERCHANT_ORDERS);
  const [memoList, setMemoList] = useState<ResellerMemo[]>(INITIAL_MERCHANT_MEMOS);
  const [asns, setAsns] = useState<MerchantAsnRecord[]>(INITIAL_MERCHANT_ASNS);
  const [stockRequests, setStockRequests] = useState<StockRequestItem[]>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem(STORAGE_KEY_STOCK_REQUESTS);
      if (saved) {
        try {
          return JSON.parse(saved);
        } catch {}
      }
    }
    return INITIAL_STOCK_REQUESTS;
  });
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  // Load from API with localStorage / seed fallback
  useEffect(() => {
    let isMounted = true;
    async function loadData() {
      try {
        const [profData, prodsData, ordsData, memosData, asnsData] = await Promise.all([
          merchantApi.getProfile(),
          merchantApi.getProducts(),
          merchantApi.getOrders(),
          merchantApi.getMemos(),
          merchantApi.getInboundAsns(),
        ]);
        if (isMounted) {
          if (profData) setProfile(profData);
          if (prodsData && prodsData.length > 0) setProducts(prodsData);
          if (ordsData && ordsData.length > 0) setOrders(ordsData);
          if (memosData && memosData.length > 0) setMemoList(memosData);
          if (asnsData && asnsData.length > 0) setAsns(asnsData);
        }
      } catch {
        // Fallback already handled
      }
    }
    loadData();

    const handleExternalSync = (e: Event) => {
      const ce = e as CustomEvent;
      if (ce.detail?.source === 'MerchantContext') return;
      try {
        const savedProds = localStorage.getItem(STORAGE_KEY_MERCHANT_PRODUCTS);
        if (savedProds) {
          const parsedProds = JSON.parse(savedProds);
          if (Array.isArray(parsedProds) && parsedProds.length > 0) {
            setProducts(parsedProds);
          }
        }
        const savedOrds = localStorage.getItem(STORAGE_KEY_MERCHANT_ORDERS);
        if (savedOrds) {
          const parsedOrds = JSON.parse(savedOrds);
          if (Array.isArray(parsedOrds) && parsedOrds.length > 0) {
            setOrders(parsedOrds);
          }
        }
      } catch {
        // ignore
      }
    };

    window.addEventListener('fulfillio-warehouse-sync', handleExternalSync);
    window.addEventListener('storage', handleExternalSync);

    return () => {
      isMounted = false;
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
        localStorage.setItem(STORAGE_KEY_MERCHANT_PROFILE, JSON.stringify(next));
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
        localStorage.setItem(STORAGE_KEY_MERCHANT_PRODUCTS, JSON.stringify(next));
        if (updatedTarget) {
          syncMerchantProductUpdatedToAdmin(updatedTarget, profile);
        }
      }
      return next;
    });
    showToast('Stock count adjusted.');
  };

  const deleteProduct = (id: string) => {
    setProducts((prev) => {
      const deleted = prev.filter((p) => p.id === id);
      const next = prev.filter((p) => p.id !== id);
      if (typeof window !== 'undefined') {
        localStorage.setItem(STORAGE_KEY_MERCHANT_PRODUCTS, JSON.stringify(next));
        syncMerchantProductsDeletedToAdmin(deleted);
      }
      return next;
    });
    showToast('Product removed from catalog.');
  };

  const addProducts = (newItems: MerchantProductItem[]) => {
    setProducts((prev) => {
      const next = [...newItems, ...prev];
      if (typeof window !== 'undefined') {
        localStorage.setItem(STORAGE_KEY_MERCHANT_PRODUCTS, JSON.stringify(next));
        syncMerchantProductsAddedToAdmin(newItems, profile);
      }
      return next;
    });
    showToast(`Generated ${newItems.length} product SKU(s) & submitted for Admin Approval.`);
  };

  const updateProduct = (id: string, updated: Partial<MerchantProductItem>) => {
    setProducts((prev) => {
      let updatedTarget: MerchantProductItem | null = null;
      const next = prev.map((p) => {
        if (p.id !== id) return p;
        updatedTarget = { ...p, ...updated };
        return updatedTarget;
      });
      if (typeof window !== 'undefined') {
        localStorage.setItem(STORAGE_KEY_MERCHANT_PRODUCTS, JSON.stringify(next));
        if (updatedTarget) {
          syncMerchantProductUpdatedToAdmin(updatedTarget, profile);
        }
      }
      return next;
    });
    showToast('Product updated successfully.');
  };

  const toggleProductStatus = (id: string) => {
    setProducts((prev) => {
      const next = prev.map((p) => {
        if (p.id !== id) return p;
        const newStatus = p.status === 'DRAFT' ? ('PUBLISHED' as const) : ('DRAFT' as const);
        return { ...p, status: newStatus };
      });
      if (typeof window !== 'undefined') {
        localStorage.setItem(STORAGE_KEY_MERCHANT_PRODUCTS, JSON.stringify(next));
      }
      return next;
    });
    showToast('Product status updated.');
  };

  const bulkUpdateStatus = (ids: string[], status: 'PUBLISHED' | 'DRAFT') => {
    setProducts((prev) => {
      const next = prev.map((p) => (ids.includes(p.id) ? { ...p, status } : p));
      if (typeof window !== 'undefined') {
        localStorage.setItem(STORAGE_KEY_MERCHANT_PRODUCTS, JSON.stringify(next));
      }
      return next;
    });
    showToast(`Updated ${ids.length} products to ${status.toLowerCase()}.`);
  };

  const bulkDeleteProducts = (ids: string[]) => {
    setProducts((prev) => {
      const deleted = prev.filter((p) => ids.includes(p.id));
      const next = prev.filter((p) => !ids.includes(p.id));
      if (typeof window !== 'undefined') {
        localStorage.setItem(STORAGE_KEY_MERCHANT_PRODUCTS, JSON.stringify(next));
        syncMerchantProductsDeletedToAdmin(deleted);
      }
      return next;
    });
    showToast(`Removed ${ids.length} products.`);
  };

  const requestStockAdd = (productId: string, requestedQty: number, note?: string) => {
    const product = products.find((p) => p.id === productId);
    if (!product || requestedQty <= 0) return;

    const newReq: StockRequestItem = {
      id: `sr-${Date.now()}`,
      productId,
      productTitle: product.title,
      productSku: product.sku,
      requestedQty,
      currentStock: product.stock,
      status: 'PENDING_APPROVAL',
      note: note || 'Merchant requested restock',
      createdAt: new Date().toISOString().replace('T', ' ').slice(0, 16),
      imageUrl: product.imageUrl,
    };

    setStockRequests((prev) => {
      const next = [newReq, ...prev];
      if (typeof window !== 'undefined') {
        localStorage.setItem(STORAGE_KEY_STOCK_REQUESTS, JSON.stringify(next));
      }
      return next;
    });

    showToast(`Stock request (+${requestedQty} units) submitted for Admin Approval.`);
  };

  const approveStockRequest = (requestId: string) => {
    const req = stockRequests.find((r) => r.id === requestId);
    if (!req || req.status === 'APPROVED') return;

    // Credit stock to product
    setProducts((prev) => {
      let updatedTarget: MerchantProductItem | null = null;
      const next = prev.map((p) => {
        if (p.id !== req.productId) return p;
        updatedTarget = { ...p, stock: p.stock + req.requestedQty };
        return updatedTarget;
      });
      if (typeof window !== 'undefined') {
        localStorage.setItem(STORAGE_KEY_MERCHANT_PRODUCTS, JSON.stringify(next));
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
        localStorage.setItem(STORAGE_KEY_STOCK_REQUESTS, JSON.stringify(next));
      }
      return next;
    });

    showToast(`Admin approved: +${req.requestedQty} units added to ${req.productSku}.`);
  };

  const cancelStockRequest = (requestId: string) => {
    setStockRequests((prev) => {
      const next = prev.filter((r) => r.id !== requestId);
      if (typeof window !== 'undefined') {
        localStorage.setItem(STORAGE_KEY_STOCK_REQUESTS, JSON.stringify(next));
      }
      return next;
    });
    showToast('Stock request cancelled.');
  };

  const createOrder = (
    order: MerchantOrderItem,
    productIdOrItems?: string | { productId: string; qty: number }[],
    qty?: number
  ) => {
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
        localStorage.setItem(STORAGE_KEY_MERCHANT_PRODUCTS, JSON.stringify(next));
      }
      return next;
    });

    setOrders((prev) => {
      const next = [order, ...prev];
      if (typeof window !== 'undefined') {
        localStorage.setItem(STORAGE_KEY_MERCHANT_ORDERS, JSON.stringify(next));
      }
      return next;
    });

    syncMerchantOrderCreatedToAdmin(order, itemsToDeduct, latestProducts, memoList, profile);
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
          localStorage.setItem(STORAGE_KEY_MERCHANT_PRODUCTS, JSON.stringify(next));
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
        localStorage.setItem(STORAGE_KEY_MERCHANT_ORDERS, JSON.stringify(next));
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
        localStorage.setItem(STORAGE_KEY_MERCHANT_ORDERS, JSON.stringify(next));
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
        localStorage.setItem(STORAGE_KEY_MERCHANT_ASNS, JSON.stringify(next));
      }
      return next;
    });
    merchantApi.createInboundAsn(newAsn).catch(() => {});
  };

  const saveMemo = (newMemo: ResellerMemo) => {
    setMemoList((prev) => {
      const filtered = prev.filter((m) => m.id !== newMemo.id && m.code !== newMemo.code);
      const next = [newMemo, ...filtered];
      if (typeof window !== 'undefined') {
        localStorage.setItem(STORAGE_KEY_MERCHANT_MEMOS, JSON.stringify(next));
      }
      return next;
    });
    showToast(`Memo template ${newMemo.code} saved!`);
  };

  const setDefaultMemo = (id: string) => {
    setMemoList((prev) => {
      const next = prev.map((m) => ({ ...m, isDefault: m.id === id }));
      if (typeof window !== 'undefined') {
        localStorage.setItem(STORAGE_KEY_MERCHANT_MEMOS, JSON.stringify(next));
      }
      return next;
    });
    showToast('Default memo design updated.');
  };

  const deleteMemo = (id: string) => {
    setMemoList((prev) => {
      const next = prev.filter((m) => m.id !== id);
      if (typeof window !== 'undefined') {
        localStorage.setItem(STORAGE_KEY_MERCHANT_MEMOS, JSON.stringify(next));
      }
      return next;
    });
    showToast('Memo design deleted.');
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
        approveStockRequest,
        cancelStockRequest,
        createOrder,
        cancelOrder,
        updateOrderStatus,
        createAsn,
        saveMemo,
        setDefaultMemo,
        deleteMemo,
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
