'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { WarehouseReturnsManager } from '@/features/admin/returns';

export default function AdminReturnsPage() {
  const router = useRouter();

  return (
    <div className="space-y-6">
      <WarehouseReturnsManager
        onOpenProducts={() => router.push('/admin/products?tab=all')}
      />
    </div>
  );
}
