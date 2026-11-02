'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { WarehouseDeliveryTracker } from '@/features/warehouse/WarehouseDeliveryTracker';

export default function AdminDeliveryPage() {
  const router = useRouter();

  return (
    <div className="space-y-6">
      <WarehouseDeliveryTracker
        onOpenReturns={() => router.push('/admin/returns')}
      />
    </div>
  );
}
