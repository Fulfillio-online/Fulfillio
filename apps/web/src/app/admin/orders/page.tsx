'use client';

import React, { Suspense, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import {
  OrdersPipelineManager,
  PipelineMainTab,
} from '@/features/admin/orders';

function OrdersPipelineContent() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const rawTab = searchParams.get('tab');
  const searchQuery = searchParams.get('search') || searchParams.get('q') || searchParams.get('sku') || '';

  useEffect(() => {
    if (rawTab === 'all') {
      const searchPart = searchQuery ? `?search=${encodeURIComponent(searchQuery)}` : '';
      router.replace(`/admin/orders/all${searchPart}`);
    }
  }, [rawTab, searchQuery, router]);

  if (rawTab === 'all') {
    return (
      <div className="p-8 text-center text-slate-600 dark:text-slate-300 tabular-nums text-sm animate-pulse">
        Redirecting to All Orders...
      </div>
    );
  }

  const activeTab: PipelineMainTab =
    rawTab === 'pack' || rawTab === 'dispatch' ? rawTab : 'pick';

  const handleTabChange = (newTab: PipelineMainTab) => {
    const searchPart = searchQuery ? `&search=${encodeURIComponent(searchQuery)}` : '';
    router.replace(`/admin/orders?tab=${newTab}${searchPart}`, { scroll: false });
  };

  return (
    <OrdersPipelineManager
      activeTab={activeTab}
      initialSearch={searchQuery}
      onTabChange={handleTabChange}
      onOpenDeliveryTracker={() => router.push('/admin/delivery')}
    />
  );
}

export default function AdminOrdersPage() {
  return (
    <Suspense
      fallback={
        <div className="p-8 text-center text-slate-600 dark:text-slate-300 tabular-nums text-sm animate-pulse">
          Loading Orders Pipeline...
        </div>
      }
    >
      <OrdersPipelineContent />
    </Suspense>
  );
}
