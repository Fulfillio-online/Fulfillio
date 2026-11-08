'use client';

import React, { useState, useEffect } from 'react';
import { CheckCircle2 } from 'lucide-react';
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
import { MerchantStatsOverview } from './components/MerchantStatsOverview';
import { MerchantTable } from './components/MerchantTable';
import { MerchantProfileDrawer } from './components/MerchantProfileDrawer';

export interface MerchantDirectoryManagerProps {
  onNavigateTab?: (tabName: any) => void;
  resetTrigger?: number;
}

export function MerchantDirectoryManager({
  onNavigateTab,
  resetTrigger = 0,
}: MerchantDirectoryManagerProps) {
  const [merchants, setMerchants] = useState<MerchantRecord[]>(MERCHANTS_DATA);
  const [productsList, setProductsList] = useState<MerchantProductItem[]>(ALL_PRODUCTS);
  const [ordersList] = useState<MerchantOrderItem[]>(ALL_ORDERS);
  const [memosList] = useState<MerchantMemoItem[]>(ALL_MEMOS);
  const [selectedMerchantId, setSelectedMerchantId] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const triggerToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3200);
  };

  // Load persisted merchants from localStorage on initial client mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setMerchants(parsed);
        }
      }
    } catch (err) {
      console.warn('Could not read from localStorage', err);
    }
  }, []);

  // Listen to external reset triggers
  useEffect(() => {
    if (resetTrigger > 0) {
      setSelectedMerchantId(null);
    }
  }, [resetTrigger]);

  const selectedMerchant = merchants.find((m) => m.id === selectedMerchantId) || null;

  // Toggle active / suspend status for a single merchant
  const handleToggleStatus = (merchantId: string, currentStatus: string) => {
    const nextStatus: MerchantRecord['status'] = currentStatus === 'Active' ? 'Suspended' : 'Active';
    const updated = merchants.map((m) =>
      m.id === merchantId ? { ...m, status: nextStatus, verified: nextStatus === 'Active' } : m,
    );
    setMerchants(updated);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    } catch (err) {
      console.warn('Could not save to localStorage', err);
    }
    triggerToast(`Status changed to ${nextStatus}`);
  };

  // Bulk update status for multiple merchants
  const handleBulkUpdateStatus = (merchantIds: string[], nextStatus: 'Active' | 'Suspended') => {
    const updated = merchants.map((m) =>
      merchantIds.includes(m.id)
        ? { ...m, status: nextStatus, verified: nextStatus === 'Active' }
        : m,
    );
    setMerchants(updated);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    } catch (err) {
      console.warn('Could not save to localStorage', err);
    }
    triggerToast(
      `${nextStatus === 'Active' ? 'Approved' : 'Suspended'} ${merchantIds.length} merchant${
        merchantIds.length > 1 ? 's' : ''
      }`,
    );
  };

  // Update merchant profile
  const handleUpdateMerchant = (updatedMerchant: MerchantRecord) => {
    const updated = merchants.map((m) =>
      m.id === updatedMerchant.id ? updatedMerchant : m,
    );
    setMerchants(updated);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    } catch (err) {
      console.warn('Could not save to localStorage', err);
    }
    triggerToast(`Saved settings for ${updatedMerchant.storeName}!`);
  };

  // Adjust product stock inline
  const handleAdjustStock = (productId: string, delta: number) => {
    setProductsList((prev) =>
      prev.map((item) => {
        if (item.id !== productId) return item;
        return { ...item, stock: Math.max(0, item.stock + delta) };
      }),
    );
  };

  // Add new merchant product
  const handleAddProduct = (newProduct: MerchantProductItem) => {
    setProductsList((prev) => [newProduct, ...prev]);
    triggerToast(`Added product "${newProduct.title}" (${newProduct.sku})`);
  };

  return (
    <div className="space-y-6">
      {/* Toast Feedback */}
      {toastMessage && (
        <div className="fixed top-6 right-6 z-50 bg-orange-600 text-white px-4 py-2.5 rounded-xl shadow-2xl flex items-center gap-2 text-xs font-bold animate-in fade-in slide-in-from-top-2">
          <CheckCircle2 className="w-4 h-4" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* VIEW 1: MERCHANT DIRECTORY LIST */}
      {!selectedMerchant ? (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-navy-900 dark:text-white">
              Merchant Profiles &amp; Verification
            </h1>
            <p className="text-sm text-slate-600 dark:text-slate-300 mt-1">
              Inspect verified merchant stores, KYC payout accounts, active catalog items, and fulfillment history.
            </p>
          </div>
            <div className="flex items-center gap-2">
            <span className="px-3.5 py-1.5 rounded-xl text-xs font-bold bg-orange-500/10 text-orange-600 dark:text-orange-400 border border-orange-500/20 shadow-2xs">
              {merchants.length} Verified Stores
            </span>
          </div>
          </div>

          {/* 4 Summary Metric Cards */}
          <MerchantStatsOverview
            merchants={merchants}
            productsCount={productsList.length}
          />

          {/* Searchable & Filterable Merchant Table with Multi-Select and Bulk Actions */}
          <MerchantTable
            merchants={merchants}
            productsList={productsList}
            onSelectMerchant={(m) => setSelectedMerchantId(m.id)}
            onToggleStatus={handleToggleStatus}
            onBulkUpdateStatus={handleBulkUpdateStatus}
          />
        </div>
      ) : (
        /* VIEW 2: DRILL-DOWN MODULAR PROFILE DRAWER */
        <MerchantProfileDrawer
          merchant={selectedMerchant}
          allMerchants={merchants}
          allOrders={ordersList}
          productsList={productsList}
          memosList={memosList}
          onBack={() => setSelectedMerchantId(null)}
          onSwitchMerchant={(m) => setSelectedMerchantId(m.id)}
          onUpdateMerchant={handleUpdateMerchant}
          onAdjustStock={handleAdjustStock}
          onAddProduct={handleAddProduct}
        />
      )}
    </div>
  );
}

export default MerchantDirectoryManager;
