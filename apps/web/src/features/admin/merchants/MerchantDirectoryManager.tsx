'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { CheckCircle2 } from 'lucide-react';
import { MerchantStatsOverview } from './components/MerchantStatsOverview';
import { MerchantTable } from './components/MerchantTable';
import { PendingPayoutApprovalsPanel } from './components/PendingPayoutApprovalsPanel';
import { useMerchantDirectory } from './useMerchantDirectory';

export interface MerchantDirectoryManagerProps {
  onNavigateTab?: (tabName: any) => void;
  resetTrigger?: number;
}

/**
 * Merchant list. Each merchant opens as its own page: /admin/merchants/[id]
 */
export function MerchantDirectoryManager(_props: MerchantDirectoryManagerProps) {
  const router = useRouter();
  const {
    merchants,
    productsList,
    toastMessage,
    handleToggleStatus,
    handleBulkUpdateStatus,
    handleReviewPayoutAccount,
  } = useMerchantDirectory();

  // Pending-approval submissions are not live catalog items yet.
  const liveProducts = productsList.filter((p) => p.status !== 'PENDING_APPROVAL');
  const pendingPayoutMerchants = merchants.filter(
    (m) => m.payoutAccount?.status === 'PENDING_REVIEW'
  );

  return (
    <div className="space-y-6">
      {/* Toast Feedback */}
      {toastMessage && (
        <div className="fixed top-6 right-6 z-50 bg-orange-600 text-white px-4 py-2.5 rounded-xl shadow-2xl flex items-center gap-2 text-xs font-bold animate-in fade-in slide-in-from-top-2">
          <CheckCircle2 className="w-4 h-4" />
          <span>{toastMessage}</span>
        </div>
      )}

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
          <div className="flex items-center gap-2 flex-wrap">
            {pendingPayoutMerchants.length > 0 && (
              <button
                type="button"
                onClick={() =>
                  router.push(
                    `/admin/merchants/${encodeURIComponent(pendingPayoutMerchants[0].id)}?tab=payout`
                  )
                }
                className="px-3.5 py-1.5 rounded-xl text-xs font-bold bg-amber-500/15 text-amber-700 dark:text-amber-300 border border-amber-500/30 hover:bg-amber-500/25 transition-colors cursor-pointer"
              >
                {pendingPayoutMerchants.length} Payout Approval{pendingPayoutMerchants.length > 1 ? 's' : ''} Pending
              </button>
            )}
            <span className="px-3.5 py-1.5 rounded-xl text-xs font-bold bg-orange-500/10 text-orange-600 dark:text-orange-400 border border-orange-500/20 shadow-2xs">
              {merchants.length} Verified Stores
            </span>
          </div>
        </div>

        {/* 4 Summary Metric Cards */}
        <MerchantStatsOverview merchants={merchants} productsCount={liveProducts.length} />

        {/* Pending Payment Details Approval Queue */}
        <PendingPayoutApprovalsPanel
          pendingMerchants={pendingPayoutMerchants}
          onReviewPayout={handleReviewPayoutAccount}
        />

        {/* Searchable & Filterable Merchant Table with Multi-Select and Bulk Actions */}
        <MerchantTable
          merchants={merchants}
          productsList={liveProducts}
          onSelectMerchant={(m) => router.push(`/admin/merchants/${encodeURIComponent(m.id)}`)}
          onToggleStatus={handleToggleStatus}
          onBulkUpdateStatus={handleBulkUpdateStatus}
        />
      </div>
    </div>
  );
}

export default MerchantDirectoryManager;
