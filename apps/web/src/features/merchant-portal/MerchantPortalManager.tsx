'use client';

import React, { useState, useEffect } from 'react';
import {
  MerchantOrderItem,
  MerchantProductItem,
  MerchantProfileData,
  MerchantTab,
  ResellerMemo,
} from './types';
import {
  INITIAL_MERCHANT_MEMOS,
  INITIAL_MERCHANT_ORDERS,
  INITIAL_MERCHANT_PRODUCTS,
  INITIAL_MERCHANT_PROFILE,
  STORAGE_KEY_MERCHANT_MEMOS,
  STORAGE_KEY_MERCHANT_ORDERS,
  STORAGE_KEY_MERCHANT_PRODUCTS,
  STORAGE_KEY_MERCHANT_PROFILE,
} from './mockData';
import { MerchantSidebar } from './components/MerchantSidebar';
import { MerchantHeader } from './components/MerchantHeader';
import { MerchantOverviewTab } from './components/tabs/MerchantOverviewTab';
import { MerchantProductsTab } from './components/tabs/MerchantProductsTab';
import { MerchantOrdersTab } from './components/tabs/MerchantOrdersTab';
import { MerchantMemoDesignerTab } from './components/tabs/MerchantMemoDesignerTab';
import { MerchantTrackingTab } from './components/tabs/MerchantTrackingTab';
import { MerchantBillingTab } from './components/tabs/MerchantBillingTab';
import { MerchantApiKeysTab } from './components/tabs/MerchantApiKeysTab';
import { MerchantProfileTab } from './components/tabs/MerchantProfileTab';

export function MerchantPortalManager() {
  const [activeTab, setActiveTab] = useState<MerchantTab>('overview');
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Hydration & state persistence
  const [profile, setProfile] = useState<MerchantProfileData>(INITIAL_MERCHANT_PROFILE);
  const [products, setProducts] = useState<MerchantProductItem[]>(INITIAL_MERCHANT_PRODUCTS);
  const [orders, setOrders] = useState<MerchantOrderItem[]>(INITIAL_MERCHANT_ORDERS);
  const [memoList, setMemoList] = useState<ResellerMemo[]>(INITIAL_MERCHANT_MEMOS);
  const [isHydrated, setIsHydrated] = useState(false);

  useEffect(() => {
    try {
      const savedProfile = localStorage.getItem(STORAGE_KEY_MERCHANT_PROFILE);
      if (savedProfile) setProfile(JSON.parse(savedProfile));

      const savedProducts = localStorage.getItem(STORAGE_KEY_MERCHANT_PRODUCTS);
      if (savedProducts) setProducts(JSON.parse(savedProducts));

      const savedOrders = localStorage.getItem(STORAGE_KEY_MERCHANT_ORDERS);
      if (savedOrders) setOrders(JSON.parse(savedOrders));

      const savedMemos = localStorage.getItem(STORAGE_KEY_MERCHANT_MEMOS);
      if (savedMemos) setMemoList(JSON.parse(savedMemos));
    } catch {
      // Local storage fallback
    } finally {
      setIsHydrated(true);
    }
  }, []);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage((curr) => (curr === msg ? null : curr));
    }, 4000);
  };

  // State mutators with localStorage sync
  const handleUpdateProfile = (updated: Partial<MerchantProfileData>) => {
    setProfile((prev) => {
      const next = { ...prev, ...updated };
      if (typeof window !== 'undefined') {
        localStorage.setItem(STORAGE_KEY_MERCHANT_PROFILE, JSON.stringify(next));
      }
      return next;
    });
  };

  const handleAdjustStock = (id: string, delta: number) => {
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

  const handleDeleteProduct = (id: string) => {
    setProducts((prev) => {
      const next = prev.filter((p) => p.id !== id);
      if (typeof window !== 'undefined') {
        localStorage.setItem(STORAGE_KEY_MERCHANT_PRODUCTS, JSON.stringify(next));
      }
      return next;
    });
    showToast('Product removed from catalog.');
  };

  const handleAddProducts = (newItems: MerchantProductItem[]) => {
    setProducts((prev) => {
      const next = [...newItems, ...prev];
      if (typeof window !== 'undefined') {
        localStorage.setItem(STORAGE_KEY_MERCHANT_PRODUCTS, JSON.stringify(next));
      }
      return next;
    });
  };

  const handleCreateOrder = (
    order: MerchantOrderItem,
    productId: string,
    qty: number
  ) => {
    // Reserve stock atomically
    setProducts((prev) => {
      const next = prev.map((p) =>
        p.id === productId
          ? { ...p, stock: p.stock - qty, reserved: p.reserved + qty }
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

  const handleCancelOrder = (orderId: string) => {
    const order = orders.find((o) => o.id === orderId);
    if (!order) return;

    if (order.status === 'PENDING' || order.status === 'ALLOCATED') {
      setProducts((prev) => {
        const next = prev.map((p) =>
          p.id === order.productId
            ? {
                ...p,
                stock: p.stock + order.qty,
                reserved: Math.max(0, p.reserved - order.qty),
              }
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
    showToast(`Order ${orderId} cancelled. Stock restored to warehouse inventory.`);
  };

  const handleSaveMemo = (newMemo: ResellerMemo) => {
    setMemoList((prev) => {
      const next = [newMemo, ...prev];
      if (typeof window !== 'undefined') {
        localStorage.setItem(STORAGE_KEY_MERCHANT_MEMOS, JSON.stringify(next));
      }
      return next;
    });
  };

  const handleSetDefaultMemo = (id: string) => {
    setMemoList((prev) => {
      const next = prev.map((m) => ({ ...m, isDefault: m.id === id }));
      if (typeof window !== 'undefined') {
        localStorage.setItem(STORAGE_KEY_MERCHANT_MEMOS, JSON.stringify(next));
      }
      return next;
    });
  };

  const handleDeleteMemo = (id: string) => {
    setMemoList((prev) => {
      const next = prev.filter((m) => m.id !== id);
      if (typeof window !== 'undefined') {
        localStorage.setItem(STORAGE_KEY_MERCHANT_MEMOS, JSON.stringify(next));
      }
      return next;
    });
  };

  return (
    <div className="flex min-h-screen bg-slate-950 text-slate-100">
      {/* Sidebar Navigation */}
      <MerchantSidebar
        activeTab={activeTab}
        onSelectTab={setActiveTab}
        profile={profile}
        isMobileOpen={isMobileSidebarOpen}
        onCloseMobile={() => setIsMobileSidebarOpen(false)}
      />

      {/* Main Content Area */}
      <div className="flex-1 lg:pl-64 flex flex-col min-h-screen">
        <MerchantHeader
          activeTab={activeTab}
          profile={profile}
          onSelectTab={setActiveTab}
          onOpenMobileSidebar={() => setIsMobileSidebarOpen(true)}
          onOpenManagePayout={() => setActiveTab('profile')}
        />

        <main className="flex-1 p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl w-full mx-auto">
          {/* Toast Notification */}
          {toastMessage && (
            <div className="p-3.5 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-xs sm:text-sm font-semibold flex items-center justify-between shadow-lg animate-in fade-in duration-200">
              <span>{toastMessage}</span>
              <button
                onClick={() => setToastMessage(null)}
                className="text-emerald-400 hover:text-white ml-2 text-xs"
              >
                Dismiss
              </button>
            </div>
          )}

          {/* Active Tab View */}
          {activeTab === 'overview' && (
            <MerchantOverviewTab
              memoCount={memoList.length}
              onSelectTab={setActiveTab}
            />
          )}

          {activeTab === 'products' && (
            <MerchantProductsTab
              products={products}
              merchantCode={profile.merchantCode}
              storeName={profile.storeName}
              onAdjustStock={handleAdjustStock}
              onDeleteProduct={handleDeleteProduct}
              onAddProducts={handleAddProducts}
              onTriggerToast={showToast}
            />
          )}

          {activeTab === 'orders' && (
            <MerchantOrdersTab
              orders={orders}
              products={products}
              memoList={memoList}
              onCreateOrder={handleCreateOrder}
              onCancelOrder={handleCancelOrder}
              onTriggerToast={showToast}
            />
          )}

          {activeTab === 'memo-designer' && (
            <MerchantMemoDesignerTab
              memoList={memoList}
              onSaveMemo={handleSaveMemo}
              onSetDefaultMemo={handleSetDefaultMemo}
              onDeleteMemo={handleDeleteMemo}
              onTriggerToast={showToast}
            />
          )}

          {activeTab === 'tracking' && <MerchantTrackingTab />}

          {activeTab === 'billing' && (
            <MerchantBillingTab payoutAccount={profile.payoutAccount} />
          )}

          {activeTab === 'api-keys' && (
            <MerchantApiKeysTab onTriggerToast={showToast} />
          )}

          {activeTab === 'profile' && (
            <MerchantProfileTab
              profile={profile}
              onUpdateProfile={handleUpdateProfile}
              onTriggerToast={showToast}
            />
          )}
        </main>
      </div>
    </div>
  );
}
