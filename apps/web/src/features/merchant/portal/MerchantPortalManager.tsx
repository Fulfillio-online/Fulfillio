'use client';

import React, { useState, useEffect, Suspense, useCallback } from 'react';
import { useSearchParams, useRouter, usePathname } from 'next/navigation';
import { CheckCircle2 } from 'lucide-react';
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
import {
  syncMerchantMemoToAdmin,
  syncMerchantMemoDeletedToAdmin,
  syncMerchantProductUpdatedToAdmin,
  syncMerchantOrderCancelledToAdmin,
  cancelOrderInDatabase,
  getMerchantProfileKey,
} from '@/lib/warehouseSync';
import { MerchantSidebar } from './components/MerchantSidebar';
import { MerchantHeader } from './components/MerchantHeader';
import { MerchantOverviewTab } from './components/tabs/MerchantOverviewTab';
import { MerchantProductsTab } from './products';
import { MerchantOrdersTab } from './components/tabs/MerchantOrdersTab';
import { MerchantMemoDesignerTab } from './components/tabs/MerchantMemoDesignerTab';
import { MerchantInboundAsnTab } from './components/tabs/MerchantInboundAsnTab';
import { MerchantBillingTab } from './components/tabs/MerchantBillingTab';
import { MerchantReturnsTab } from './components/tabs/MerchantReturnsTab';
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
    'returns',
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
  const [products, setProducts] = useState<MerchantProductItem[]>([]);
  const [orders, setOrders] = useState<MerchantOrderItem[]>([]);
  const [memoList, setMemoList] = useState<ResellerMemo[]>([]);
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
          if (profData) {
            setProfile((prev) => {
              // If active merchant is not MC-101, never allow default MC-101 demo preset to overwrite it
              if (
                prev.merchantCode &&
                prev.merchantCode !== 'MC-101' &&
                profData.merchantCode === 'MC-101' &&
                profData.storeName === "Sabbir's Store"
              ) {
                return prev;
              }
              return { ...prev, ...profData };
            });
          }
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
        const key = getMerchantProfileKey(next.merchantCode);
        localStorage.setItem(key, JSON.stringify(next));
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
    let updatedProduct: MerchantProductItem | undefined;
    setProducts((prev) => {
      const next = prev.map((p) => {
        if (p.id !== id) return p;
        // Restoring from DRAFT or REJECTED requires Admin Approval again
        const newStatus =
          p.status === 'DRAFT' || p.status === 'REJECTED'
            ? ('PENDING_APPROVAL' as const)
            : ('DRAFT' as const);
        updatedProduct = {
          ...p,
          status: newStatus,
          rejectionReason: newStatus === 'PENDING_APPROVAL' ? undefined : p.rejectionReason,
        };
        return updatedProduct;
      });
      if (typeof window !== 'undefined') {
        localStorage.setItem(STORAGE_KEY_MERCHANT_PRODUCTS, JSON.stringify(next));
      }
      return next;
    });
    if (updatedProduct) {
      const targetStatus: 'DRAFT' | 'PENDING_APPROVAL' =
        updatedProduct.status === 'DRAFT' ? 'DRAFT' : 'PENDING_APPROVAL';
      syncMerchantProductUpdatedToAdmin(updatedProduct, profile);
      merchantApi.updateProductStatus(id, targetStatus).catch(() => {});
    }
    showToast(
      updatedProduct?.status === 'DRAFT'
        ? 'Product saved in Draft.'
        : 'Product submitted for Admin Approval.'
    );
  };

  const handleBulkUpdateStatus = (ids: string[], status: 'PUBLISHED' | 'DRAFT') => {
    const idSet = new Set(ids);
    setProducts((prev) => {
      const next = prev.map((p) => {
        if (!idSet.has(p.id)) return p;
        const nextStatus =
          status === 'DRAFT'
            ? ('DRAFT' as const)
            : p.status === 'DRAFT'
              ? ('PENDING_APPROVAL' as const)
              : status;
        const updated = { ...p, status: nextStatus };
        syncMerchantProductUpdatedToAdmin(updated, profile);
        merchantApi.updateProductStatus(p.id, nextStatus).catch(() => {});
        return updated;
      });
      if (typeof window !== 'undefined') {
        localStorage.setItem(STORAGE_KEY_MERCHANT_PRODUCTS, JSON.stringify(next));
      }
      return next;
    });
    showToast(
      status === 'DRAFT'
        ? `Moved ${ids.length} products to Draft.`
        : `Submitted ${ids.length} products for Admin Approval.`
    );
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
              const vQty = matches
                .filter((it) => it.variantSku && it.variantSku === v.variantSku)
                .reduce((s, it) => s + it.qty, 0);
              if (vQty > 0) {
                return { ...v, stock: Math.max(0, v.stock - vQty) };
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

  const handleCancelOrder = async (orderId: string, reason?: string): Promise<boolean> => {
    if (!orderId) return false;
    const cleanReqId = orderId.replace(/^#/, '').toLowerCase().trim();

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

    const itemsToRestore: { productId: string; qty: number; variantSku?: string }[] = [];
    if (target?.lineItems && target.lineItems.length > 0) {
      target.lineItems.forEach((li) => {
        itemsToRestore.push({ productId: li.id, qty: li.quantity, variantSku: li.sku });
      });
    } else if (target?.productId) {
      itemsToRestore.push({ productId: target.productId, qty: target.qty || 1 });
    }

    let latestProducts = products;
    if (itemsToRestore.length > 0) {
      setProducts((prev) => {
        const next = prev.map((p) => {
          const matches = itemsToRestore.filter((it) => it.productId === p.id);
          if (matches.length > 0) {
            const totalQty = matches.reduce((sum, it) => sum + it.qty, 0);
            let updatedVariants = p.variantsList;
            if (p.variantsList && p.variantsList.length > 0) {
              updatedVariants = p.variantsList.map((v) => {
                const vQty = matches
                  .filter((it) => it.variantSku && it.variantSku === v.variantSku)
                  .reduce((s, it) => s + it.qty, 0);
                if (vQty > 0) {
                  return { ...v, stock: v.stock + vQty };
                }
                return v;
              });
            }
            return {
              ...p,
              stock: p.stock + totalQty,
              reserved: Math.max(0, (p.reserved || 0) - totalQty),
              variantsList: updatedVariants,
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
        localStorage.setItem(STORAGE_KEY_MERCHANT_ORDERS, JSON.stringify(next));
      }
      return next;
    });

    try {
      await cancelOrderInDatabase(cleanTargetId);
      if (target?.id && target.id !== cleanTargetId) {
        await cancelOrderInDatabase(target.id);
      }
    } catch (e) {
      console.warn('[MerchantPortalManager] DB cancel error:', e);
    }

    syncMerchantOrderCancelledToAdmin(cleanTargetId, itemsToRestore, latestProducts);

    window.dispatchEvent(
      new CustomEvent('fulfillio-warehouse-sync', { detail: { source: 'MerchantPortalManager' } })
    );

    showToast(`Order ${displayOrderNum} cancelled successfully & stock restored in PostgreSQL database.`);
    return true;
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
    <div className="flex min-h-screen bg-slate-50 dark:bg-navy-950 text-navy-900 dark:text-white">
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
            <div className="p-3.5 sm:p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/90 border border-emerald-300 dark:border-emerald-500/40 text-emerald-950 dark:text-emerald-100 text-xs sm:text-sm font-semibold flex items-center justify-between shadow-md shadow-emerald-950/5 animate-in fade-in slide-in-from-top-2 duration-200">
              <div className="flex items-center gap-2.5 min-w-0">
                <CheckCircle2 className="h-5 w-5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                <span className="leading-snug truncate sm:whitespace-normal">{toastMessage}</span>
              </div>
              <button
                onClick={() => setToastMessage(null)}
                className="text-emerald-800 dark:text-emerald-300 hover:text-emerald-950 dark:hover:text-white ml-3 text-xs font-bold px-2.5 py-1 rounded-lg bg-emerald-100/80 dark:bg-emerald-900/50 hover:bg-emerald-200 dark:hover:bg-emerald-800 transition-colors cursor-pointer shrink-0"
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

          {activeTab === 'returns' && (
            <MerchantReturnsTab
              profile={profile}
              orders={orders}
              products={products}
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
            <MerchantBillingTab
              merchantCode={profile.merchantCode}
              payoutAccount={profile.payoutAccount}
              onUpdatePayoutAccount={(updatedAccount) =>
                handleUpdateProfile({ payoutAccount: updatedAccount })
              }
            />
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
        <div className="min-h-screen bg-slate-50 dark:bg-navy-950 flex items-center justify-center text-slate-400 text-sm">
          Loading Merchant Portal...
        </div>
      }
    >
      <MerchantPortalInner />
    </Suspense>
  );
}
