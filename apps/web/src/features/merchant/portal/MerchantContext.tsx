'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import {
  MerchantAsnRecord,
  MerchantOrderItem,
  MerchantProductItem,
  MerchantProfileData,
  ResellerMemo,
} from './types';
import {
  INITIAL_MERCHANT_ASNS,
  INITIAL_MERCHANT_MEMOS,
  INITIAL_MERCHANT_ORDERS,
  INITIAL_MERCHANT_PRODUCTS,
  INITIAL_MERCHANT_PROFILE,
  STORAGE_KEY_MERCHANT_ASNS,
  STORAGE_KEY_MERCHANT_MEMOS,
  STORAGE_KEY_MERCHANT_ORDERS,
  STORAGE_KEY_MERCHANT_PRODUCTS,
  STORAGE_KEY_MERCHANT_PROFILE,
} from './mockData';
import { merchantApi } from './api';

interface MerchantContextType {
  profile: MerchantProfileData;
  products: MerchantProductItem[];
  orders: MerchantOrderItem[];
  memoList: ResellerMemo[];
  asns: MerchantAsnRecord[];
  toastMessage: string | null;
  isMobileSidebarOpen: boolean;
  setIsMobileSidebarOpen: (open: boolean) => void;
  showToast: (msg: string) => void;
  clearToast: () => void;
  updateProfile: (updated: Partial<MerchantProfileData>) => void;
  adjustStock: (id: string, delta: number) => void;
  deleteProduct: (id: string) => void;
  addProducts: (newItems: MerchantProductItem[]) => void;
  createOrder: (order: MerchantOrderItem, productId: string, qty: number) => void;
  cancelOrder: (orderId: string) => void;
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
    return () => {
      isMounted = false;
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
      const next = prev.map((p) =>
        p.id === id ? { ...p, stock: Math.max(0, p.stock + delta) } : p
      );
      if (typeof window !== 'undefined') {
        localStorage.setItem(STORAGE_KEY_MERCHANT_PRODUCTS, JSON.stringify(next));
      }
      return next;
    });
    showToast('Stock count adjusted.');
  };

  const deleteProduct = (id: string) => {
    setProducts((prev) => {
      const next = prev.filter((p) => p.id !== id);
      if (typeof window !== 'undefined') {
        localStorage.setItem(STORAGE_KEY_MERCHANT_PRODUCTS, JSON.stringify(next));
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
      }
      return next;
    });
    showToast(`Generated ${newItems.length} product SKU(s) successfully.`);
  };

  const createOrder = (order: MerchantOrderItem, productId: string, qty: number) => {
    setProducts((prev) => {
      const next = prev.map((p) =>
        p.id === productId
          ? { ...p, stock: Math.max(0, p.stock - qty), reserved: p.reserved + qty }
          : p
      );
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
  };

  const cancelOrder = (orderId: string) => {
    const target = orders.find((o) => o.id === orderId);
    if (!target) return;

    if (target.productId) {
      setProducts((prev) => {
        const next = prev.map((p) =>
          p.id === target.productId
            ? { ...p, stock: p.stock + target.qty, reserved: Math.max(0, p.reserved - target.qty) }
            : p
        );
        if (typeof window !== 'undefined') {
          localStorage.setItem(STORAGE_KEY_MERCHANT_PRODUCTS, JSON.stringify(next));
        }
        return next;
      });
    }

    setOrders((prev) => {
      const next = prev.map((o) =>
        o.id === orderId ? { ...o, status: 'CANCELLED' as const } : o
      );
      if (typeof window !== 'undefined') {
        localStorage.setItem(STORAGE_KEY_MERCHANT_ORDERS, JSON.stringify(next));
      }
      return next;
    });
    showToast(`Order ${orderId} cancelled & stock restored.`);
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
        toastMessage,
        isMobileSidebarOpen,
        setIsMobileSidebarOpen,
        showToast,
        clearToast,
        updateProfile,
        adjustStock,
        deleteProduct,
        addProducts,
        createOrder,
        cancelOrder,
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
