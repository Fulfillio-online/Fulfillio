'use client';

import React, { Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import {
  WarehouseProductsManager,
  WarehouseProductSubTab,
} from '@/features/warehouse/WarehouseProductsManager';

function ProductsContent() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const tabParam = searchParams.get('tab') as WarehouseProductSubTab | null;
  const activeTab: WarehouseProductSubTab =
    tabParam === 'approval' || tabParam === 'bins' ? tabParam : 'all';

  const handleTabChange = (newTab: WarehouseProductSubTab) => {
    router.replace(`/admin/products?tab=${newTab}`, { scroll: false });
  };

  return (
    <WarehouseProductsManager
      activeTab={activeTab}
      onTabChange={handleTabChange}
    />
  );
}

export default function AdminProductsPage() {
  return (
    <Suspense
      fallback={
        <div className="p-8 text-center text-slate-400 font-mono text-sm animate-pulse">
          Loading Warehouse Products Catalog...
        </div>
      }
    >
      <ProductsContent />
    </Suspense>
  );
}
