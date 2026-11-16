'use client';

import React, { Suspense, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { ProductsManager } from '@/features/admin/products';

function ProductsContent() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const tabParam = searchParams.get('tab');

  useEffect(() => {
    if (tabParam === 'bins') {
      router.replace('/admin/bins');
    } else if (tabParam === 'ledger') {
      router.replace('/admin/stock');
    }
  }, [tabParam, router]);

  const activeTab = tabParam || 'all';

  const handleTabChange = (newTab: string) => {
    router.replace(`/admin/products?tab=${newTab}`, { scroll: false });
  };

  return (
    <ProductsManager
      activeTab={activeTab}
      onTabChange={handleTabChange}
    />
  );
}

export default function AdminProductsPage() {
  return (
    <Suspense
      fallback={
        <div className="p-8 text-center text-slate-600 dark:text-slate-300 tabular-nums text-sm animate-pulse">
          Loading Warehouse Products Catalog...
        </div>
      }
    >
      <ProductsContent />
    </Suspense>
  );
}
