'use client';

import React from 'react';
import { useMerchant } from '@/features/merchant/portal/MerchantContext';
import { MerchantInboundAsnTab } from '@/features/merchant/portal/components/tabs/MerchantInboundAsnTab';

export default function MerchantInboundPage() {
  const {
    asns,
    products,
    createAsn,
    showToast,
  } = useMerchant();

  return (
    <MerchantInboundAsnTab
      asns={asns}
      products={products}
      onCreateAsn={createAsn}
      onTriggerToast={showToast}
    />
  );
}
