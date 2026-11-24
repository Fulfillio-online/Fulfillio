'use client';

import React, { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import {
  AllOrdersManager,
  AllOrdersStatusFilter,
} from '@/features/admin/orders';

const VALID_STATUS_FILTERS: AllOrdersStatusFilter[] = [
  'ALL',
  'PICK',
  'WAITING',
  'PACK',
  'DISPATCH',
  'COURIER_BOOKED',
  'HANDED_OVER',
  'RETURNED',
  'CANCELLED',
];

function AllOrdersContent() {
  const searchParams = useSearchParams();

  const initialSearch =
    searchParams.get('search') ||
    searchParams.get('q') ||
    searchParams.get('sku') ||
    '';

  const rawStatus = (searchParams.get('status') || '').toUpperCase() as AllOrdersStatusFilter;
  const initialStatus: AllOrdersStatusFilter = VALID_STATUS_FILTERS.includes(rawStatus)
    ? rawStatus
    : 'ALL';

  const initialDateFrom = searchParams.get('dateFrom') || '';
  const initialDateTo = searchParams.get('dateTo') || '';
  const rawView = searchParams.get('view');
  const initialView: 'orders' | 'products' =
    rawView === 'products' ? 'products' : 'orders';

  return (
    <AllOrdersManager
      initialSearch={initialSearch}
      initialStatus={initialStatus}
      initialDateFrom={initialDateFrom}
      initialDateTo={initialDateTo}
      initialView={initialView}
    />
  );
}

export default function AdminAllOrdersPage() {
  return (
    <Suspense
      fallback={
        <div className="p-8 text-center text-slate-600 dark:text-slate-300 tabular-nums text-sm animate-pulse">
          Loading All Orders...
        </div>
      }
    >
      <AllOrdersContent />
    </Suspense>
  );
}
