'use client';

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useMerchant } from '@/features/merchant/portal/MerchantContext';
import { MerchantOrdersTab } from '@/features/merchant/portal/components/tabs/MerchantOrdersTab';

export default function MerchantOrdersPage() {
  const router = useRouter();
  const {
    orders,
    products,
    memoList,
    createOrder,
    cancelOrder,
    showToast,
  } = useMerchant();

  // URL Hash Auto-Recovery:
  // If the URL contains an accidental fragment hash (e.g. /merchant/orders/#ord-1001 or #ORD-...),
  // automatically redirect to the real dynamic order details route /merchant/orders/ord-1001!
  useEffect(() => {
    if (typeof window !== 'undefined' && window.location.hash) {
      const hashId = window.location.hash.replace(/^#/, '').trim();
      if (hashId) {
        router.replace(`/merchant/orders/${encodeURIComponent(hashId)}`);
      }
    }
  }, [router]);

  return (
    <MerchantOrdersTab
      orders={orders}
      products={products}
      memoList={memoList}
      onCreateOrder={createOrder}
      onCancelOrder={cancelOrder}
      onTriggerToast={showToast}
    />
  );
}
