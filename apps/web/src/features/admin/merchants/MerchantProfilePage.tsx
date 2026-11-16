'use client';

import React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { CheckCircle2, ArrowLeft, Store } from 'lucide-react';
import { MerchantProfileDrawer } from './components/MerchantProfileDrawer';
import { useMerchantDirectory } from './useMerchantDirectory';

export interface MerchantProfilePageProps {
  merchantId: string;
}

/**
 * Dedicated merchant profile page: /admin/merchants/[id]
 */
export function MerchantProfilePage({ merchantId }: MerchantProfilePageProps) {
  const router = useRouter();
  const {
    merchants,
    productsList,
    ordersList,
    memosList,
    hydrated,
    toastMessage,
    handleUpdateMerchant,
    handleAdjustStock,
    handleAddProduct,
    handleApproveProduct,
    handleRejectProduct,
  } = useMerchantDirectory();

  const merchant = merchants.find((m) => m.id === merchantId) || null;

  if (!hydrated) {
    return (
      <div className="py-24 text-center text-xs text-slate-500 dark:text-slate-400">
        Loading merchant profile…
      </div>
    );
  }

  if (!merchant) {
    return (
      <div className="space-y-4">
        <Link
          href="/admin/merchants"
          className="inline-flex items-center gap-2 text-xs font-semibold text-orange-600 dark:text-orange-400 hover:text-orange-700 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Merchant List</span>
        </Link>
        <div className="rounded-2xl border border-slate-200 dark:border-white/10 bg-white dark:bg-navy-900 p-12 text-center space-y-2">
          <Store className="w-8 h-8 text-slate-400 mx-auto" />
          <h2 className="text-sm font-bold text-navy-800 dark:text-white">Merchant not found</h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            No merchant exists with the ID “{merchantId}”.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {toastMessage && (
        <div className="fixed top-6 right-6 z-50 bg-orange-600 text-white px-4 py-2.5 rounded-xl shadow-2xl flex items-center gap-2 text-xs font-bold animate-in fade-in slide-in-from-top-2">
          <CheckCircle2 className="w-4 h-4" />
          <span>{toastMessage}</span>
        </div>
      )}

      <MerchantProfileDrawer
        merchant={merchant}
        allMerchants={merchants}
        allOrders={ordersList}
        productsList={productsList}
        memosList={memosList}
        onBack={() => router.push('/admin/merchants')}
        onSwitchMerchant={(m) => router.push(`/admin/merchants/${encodeURIComponent(m.id)}`)}
        onUpdateMerchant={handleUpdateMerchant}
        onAdjustStock={handleAdjustStock}
        onAddProduct={handleAddProduct}
        onApproveProduct={handleApproveProduct}
        onRejectProduct={handleRejectProduct}
      />
    </div>
  );
}

export default MerchantProfilePage;
