'use client';

import React, { Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import {
  OrdersPipelineManager,
  PipelineMainTab,
} from '@/features/admin/orders';

function OrdersPipelineContent() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const tabParam = searchParams.get('tab') as PipelineMainTab | null;
  const activeTab: PipelineMainTab =
    tabParam === 'pick' || tabParam === 'pack' || tabParam === 'dispatch'
      ? tabParam
      : 'all';

  const handleTabChange = (newTab: PipelineMainTab) => {
    router.replace(`/admin/orders?tab=${newTab}`, { scroll: false });
  };

  return (
    <OrdersPipelineManager
      activeTab={activeTab}
      onTabChange={handleTabChange}
      onOpenDeliveryTracker={() => router.push('/admin/delivery')}
    />
  );
}

export default function AdminOrdersPage() {
  return (
    <Suspense
      fallback={
        <div className="p-8 text-center text-slate-400 font-mono text-sm animate-pulse">
          Loading Orders Pipeline...
        </div>
      }
    >
      <OrdersPipelineContent />
    </Suspense>
  );
}
