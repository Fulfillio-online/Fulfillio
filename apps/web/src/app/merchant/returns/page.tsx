'use client';

import React from 'react';
import { useMerchant } from '@/features/merchant/portal/MerchantContext';
import { MerchantReturnsTab } from '@/features/merchant/portal/components/tabs/MerchantReturnsTab';

export default function MerchantReturnsPage() {
  const { profile, orders, products, showToast } = useMerchant();

  return (
    <MerchantReturnsTab
      profile={profile}
      orders={orders}
      products={products}
      onTriggerToast={showToast}
    />
  );
}
