'use client';

import React from 'react';
import { useMerchant } from '@/features/merchant/portal/MerchantContext';
import { MerchantOrdersTab } from '@/features/merchant/portal/components/tabs/MerchantOrdersTab';

export default function MerchantOrdersPage() {
  const {
    orders,
    products,
    memoList,
    createOrder,
    cancelOrder,
    showToast,
  } = useMerchant();

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
