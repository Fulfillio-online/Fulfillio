'use client';

import React, { useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useMerchant } from '@/features/merchant/portal/MerchantContext';
import { MerchantOverviewTab } from '@/features/merchant/portal/components/tabs/MerchantOverviewTab';

function MerchantOverviewPageInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { memoList } = useMerchant();

  useEffect(() => {
    const legacyTab = searchParams.get('tab');
    if (legacyTab) {
      if (legacyTab === 'overview') {
        router.replace('/merchant');
      } else if (legacyTab === 'memo-designer') {
        router.replace('/merchant/memos');
      } else if (legacyTab === 'tracking') {
        router.replace('/merchant/inbound');
      } else {
        router.replace(`/merchant/${legacyTab}`);
      }
    }
  }, [searchParams, router]);

  const handleSelectTab = (tab: string) => {
    if (tab === 'overview') router.push('/merchant');
    else if (tab === 'memo-designer') router.push('/merchant/memos');
    else if (tab === 'tracking') router.push('/merchant/inbound');
    else router.push(`/merchant/${tab}`);
  };

  return (
    <MerchantOverviewTab
      memoCount={memoList.length}
      onSelectTab={handleSelectTab as any}
    />
  );
}

export default function MerchantOverviewPage() {
  return (
    <Suspense fallback={<div className="text-slate-400 text-sm">Loading Overview...</div>}>
      <MerchantOverviewPageInner />
    </Suspense>
  );
}
