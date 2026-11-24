'use client';

import React, { Suspense, use } from 'react';
import { OrderDetailsView } from '@/features/admin/orders';

interface AdminOrderDetailsPageProps {
  params: Promise<{ id: string }>;
}

export default function AdminOrderDetailsPage({ params }: AdminOrderDetailsPageProps) {
  const { id } = use(params);

  return (
    <Suspense
      fallback={
        <div className="p-8 text-center text-slate-500 dark:text-slate-400 text-sm animate-pulse">
          Loading order details...
        </div>
      }
    >
      <OrderDetailsView orderId={id} />
    </Suspense>
  );
}
