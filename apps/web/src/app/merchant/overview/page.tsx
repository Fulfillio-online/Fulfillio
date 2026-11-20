'use client';

import React, { Suspense } from 'react';
import { useRouter } from 'next/navigation';
import { useMerchant } from '@/features/merchant/portal/MerchantContext';
import { MerchantOverviewTab } from '@/features/merchant/portal/components/tabs/MerchantOverviewTab';

function MerchantOverviewPageInner() {
  const router = useRouter();
  const { memoList } = useMerchant();

  const handleSelectTab = (tab: string) => {
    if (tab === 'overview') router.push('/merchant/overview');
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
