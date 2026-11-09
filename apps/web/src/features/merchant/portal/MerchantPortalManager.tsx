'use client';

import React, { useState, useEffect, Suspense, useCallback } from 'react';
import { useSearchParams, useRouter, usePathname } from 'next/navigation';
import {
  MerchantAsnRecord,
  MerchantOrderItem,
  MerchantProductItem,
  MerchantProfileData,
  MerchantTab,
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
import { syncMerchantMemoToAdmin, syncMerchantMemoDeletedToAdmin } from '@/lib/warehouseSync';
import { MerchantSidebar } from './components/MerchantSidebar';
import { MerchantHeader } from './components/MerchantHeader';
import { MerchantOverviewTab } from './components/tabs/MerchantOverviewTab';
import { MerchantProductsTab } from './products';
import { MerchantOrdersTab } from './components/tabs/MerchantOrdersTab';
import { MerchantMemoDesignerTab } from './components/tabs/MerchantMemoDesignerTab';
import { MerchantInboundAsnTab } from './components/tabs/MerchantInboundAsnTab';
import { MerchantBillingTab } from './components/tabs/MerchantBillingTab';
import { MerchantApiKeysTab } from './components/tabs/MerchantApiKeysTab';
import { MerchantProfileTab, StoreProfileData } from './profile';

function MerchantPortalInner() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const tabParam = searchParams.get('tab') as MerchantTab | null;
  const validTabs: MerchantTab[] = [
    'overview',
    'products',
    'orders',
    'memo-designer',
    'inbound',
    'tracking',
    'billing',
    'api-keys',
    'profile',
  ];

  const [activeTab, setActiveTabState] = useState<MerchantTab>(() => {
    if (tabParam && validTabs.includes(tabParam)) {
      return tabParam === 'tracking' ? 'inbound' : tabParam;
    }
    return 'overview';
  });

  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // States
  const [profile, setProfile] = useState<MerchantProfileData>(INITIAL_MERCHANT_PROFILE);
  const [products, setProducts] = useState<MerchantProductItem[]>(INITIAL_MERCHANT_PRODUCTS);
  const [orders, setOrders] = useState<MerchantOrderItem[]>(INITIAL_MERCHANT_ORDERS);
  const [memoList, setMemoList] = useState<ResellerMemo[]>(INITIAL_MERCHANT_MEMOS);
  const [asns, setAsns] = useState<MerchantAsnRecord[]>(INITIAL_MERCHANT_ASNS);

  // Sync tab with URL query parameter
  const setActiveTab = useCallback(
    (newTab: MerchantTab) => {
      const resolvedTab = newTab === 'tracking' ? 'inbound' : newTab;
      setActiveTabState(resolvedTab);
      const params = new URLSearchParams(searchParams.toString());
      params.set('tab', resolvedTab);
      router.push(`${pathname}?${params.toString()}`, { scroll: false });
    },
    [pathname, router, searchParams]
  );

  useEffect(() => {
    if (tabParam && validTabs.includes(tabParam)) {
      const target = tabParam === 'tracking' ? 'inbound' : tabParam;
      if (target !== activeTab) {
        setActiveTabState(target);
      }
    }
  }, [tabParam, activeTab]);

  // Initial load: try real API first with localStorage & mock fallback
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

  // State Mutators
  const handleUpdateProfile = (updated: Partial<MerchantProfileData>) => {
    setProfile((prev) => {
      const next = { ...prev, ...updated };
      if (typeof window !== 'undefined') {
        localStorage.setItem(STORAGE_KEY_MERCHANT_PROFILE, JSON.stringify(next));
      }
      return next;
    });
    merchantApi.updateProfile(updated).catch(() => {});
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

  const handleUpdateProduct = (id: string, updated: Partial<MerchantProductItem>) => {
    setProducts((prev) => {
      const next = prev.map((p) => (p.id === id ? { ...p, ...updated } : p));
      if (typeof window !== 'undefined') {
        localStorage.setItem(STORAGE_KEY_MERCHANT_PRODUCTS, JSON.stringify(next));
      }
      return next;
    });
    showToast('Product updated.');
  };

  const handleToggleStatus = (id: string) => {
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
    showToast('Status updated.');
  };

  const handleBulkUpdateStatus = (ids: string[], status: 'PUBLISHED' | 'DRAFT') => {
    setProducts((prev) => {
      const next = prev.map((p) => (ids.includes(p.id) ? { ...p, status } : p));
      if (typeof window !== 'undefined') {
        localStorage.setItem(STORAGE_KEY_MERCHANT_PRODUCTS, JSON.stringify(next));
      }
      return next;
    });
    showToast(`Updated ${ids.length} products to ${status.toLowerCase()}.`);
  };

  const handleBulkDelete = (ids: string[]) => {
    setProducts((prev) => {
      const next = prev.filter((p) => !ids.includes(p.id));
      if (typeof window !== 'undefined') {
        localStorage.setItem(STORAGE_KEY_MERCHANT_PRODUCTS, JSON.stringify(next));
      }
      return next;
    });
    showToast(`Removed ${ids.length} products.`);
  };

  const handleCreateOrder = (
    order: MerchantOrderItem,
    productIdOrItems?: string | { productId: string; qty: number; variantSku?: string }[],
    qty?: number
  ) => {
    const itemsToDeduct: { productId: string; qty: number; variantSku?: string }[] = [];
    if (Array.isArray(productIdOrItems)) {
      itemsToDeduct.push(...productIdOrItems);
    } else if (typeof productIdOrItems === 'string') {
      itemsToDeduct.push({ productId: productIdOrItems, qty: qty || order.qty || 1 });
    } else if (order.lineItems && order.lineItems.length > 0) {
      order.lineItems.forEach((li) => {
        itemsToDeduct.push({ productId: li.id, qty: li.quantity, variantSku: li.sku });
      });
    } else if (order.productId) {
      itemsToDeduct.push({ productId: order.productId, qty: order.qty || 1 });
    }

    setProducts((prev) => {
      const next = prev.map((p) => {
        const matches = itemsToDeduct.filter((it) => it.productId === p.id);
        if (matches.length > 0) {
          const totalQty = matches.reduce((sum, it) => sum + it.qty, 0);
          let updatedVariants = p.variantsList;
          if (p.variantsList && p.variantsList.length > 0) {
            updatedVariants = p.variantsList.map((v) => {
              const vMatch = matches.find((it) => it.variantSku && it.variantSku === v.variantSku);
              if (vMatch) {
                return { ...v, stock: Math.max(0, v.stock - vMatch.qty) };
              }
              return v;
            });
          }
          return {
            ...p,
            stock: Math.max(0, p.stock - totalQty),
            reserved: (p.reserved || 0) + totalQty,
            variantsList: updatedVariants,
          };
        }
        return p;
      });
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
    const target = orders.find((o) => o.id === orderId);
    if (!target) return;

    const itemsToRestore: { productId: string; qty: number }[] = [];
    if (target.lineItems && target.lineItems.length > 0) {
      target.lineItems.forEach((li) => {
        itemsToRestore.push({ productId: li.id, qty: li.quantity });
      });
    } else if (target.productId) {
      itemsToRestore.push({ productId: target.productId, qty: target.qty });
    }

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

  const handleCreateAsn = (newAsn: MerchantAsnRecord) => {
    setAsns((prev) => {
      const next = [newAsn, ...prev];
      if (typeof window !== 'undefined') {
        localStorage.setItem(STORAGE_KEY_MERCHANT_ASNS, JSON.stringify(next));
      }
      return next;
    });
    merchantApi.createInboundAsn(newAsn).catch(() => {});
  };

  const handleSaveMemo = (newMemo: ResellerMemo) => {
    const memoWithMerchant: ResellerMemo = {
      ...newMemo,
      merchantCode: newMemo.merchantCode || profile.merchantCode || 'MC-101',
      merchantName: newMemo.merchantName || profile.storeName || "Sabbir's Store",
    };
    setMemoList((prev) => {
      const filtered = prev.filter((m) => m.id !== memoWithMerchant.id && m.code !== memoWithMerchant.code);
      const next = [memoWithMerchant, ...filtered];
      if (typeof window !== 'undefined') {
        localStorage.setItem(STORAGE_KEY_MERCHANT_MEMOS, JSON.stringify(next));
        syncMerchantMemoToAdmin(memoWithMerchant, profile);
      }
      return next;
    });
    showToast(`Memo template ${newMemo.code} saved!`);
  };

  const handleSetDefaultMemo = (id: string) => {
    setMemoList((prev) => {
      const next = prev.map((m) => ({ ...m, isDefault: m.id === id }));
      if (typeof window !== 'undefined') {
        localStorage.setItem(STORAGE_KEY_MERCHANT_MEMOS, JSON.stringify(next));
        const target = next.find((m) => m.id === id);
        if (target) {
          syncMerchantMemoToAdmin(target, profile);
        }
      }
      return next;
    });
    showToast('Default memo design updated.');
  };

  const handleDeleteMemo = (id: string) => {
    setMemoList((prev) => {
      const target = prev.find((m) => m.id === id);
      const next = prev.filter((m) => m.id !== id);
      if (typeof window !== 'undefined') {
        localStorage.setItem(STORAGE_KEY_MERCHANT_MEMOS, JSON.stringify(next));
        if (target) {
          syncMerchantMemoDeletedToAdmin(target.id, target.code);
        }
      }
      return next;
    });
    showToast('Memo design deleted.');
  };

  return (
    <div className="flex min-h-screen bg-slate-950 text-slate-100">
      <MerchantSidebar
        activeTab={activeTab}
        onSelectTab={setActiveTab}
        profile={profile}
        isMobileOpen={isMobileSidebarOpen}
        onCloseMobile={() => setIsMobileSidebarOpen(false)}
      />

      <div className="flex-1 lg:pl-64 flex flex-col min-h-screen">
        <MerchantHeader
          activeTab={activeTab}
          profile={profile}
          onSelectTab={setActiveTab}
          onOpenMobileSidebar={() => setIsMobileSidebarOpen(true)}
          onOpenManagePayout={() => setActiveTab('profile')}
        />

        <main className="flex-1 p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl w-full mx-auto">
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

          {activeTab === 'overview' && (
            <MerchantOverviewTab
              memoCount={memoList.length}
              onSelectTab={setActiveTab}
            />
          )}

          {activeTab === 'products' && (
            <MerchantProductsTab
              products={products}
              orders={orders}
              merchantCode={profile.merchantCode}
              storeName={profile.storeName}
              onDeleteProduct={handleDeleteProduct}
              onAddProducts={handleAddProducts}
              onUpdateProduct={handleUpdateProduct}
              onToggleStatus={handleToggleStatus}
              onBulkUpdateStatus={handleBulkUpdateStatus}
              onBulkDelete={handleBulkDelete}
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

          {(activeTab === 'inbound' || activeTab === 'tracking') && (
            <MerchantInboundAsnTab
              asns={asns}
              products={products}
              onCreateAsn={handleCreateAsn}
              onTriggerToast={showToast}
            />
          )}

          {activeTab === 'billing' && (
            <MerchantBillingTab payoutAccount={profile.payoutAccount} />
          )}

          {activeTab === 'api-keys' && (
            <MerchantApiKeysTab
              onTriggerToast={showToast}
              apiKey={profile.apiKey}
              webhookUrl={profile.webhookUrl}
              onSaveWebhook={(url) => handleUpdateProfile({ webhookUrl: url })}
            />
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

export function MerchantPortalManager() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-slate-950 flex items-center justify-center text-slate-400 text-sm">
          Loading Merchant Portal...
        </div>
      }
    >
      <MerchantPortalInner />
    </Suspense>
  );
}
