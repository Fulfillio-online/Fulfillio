'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { WarehouseStockCycleManager } from '@/features/admin/stock';

export default function AdminStockCyclePage() {
  const router = useRouter();

  return (
    <div className="space-y-6">
      <WarehouseStockCycleManager
        onOpenReturns={() => router.push('/admin/returns')}
      />
    </div>
  );
}
