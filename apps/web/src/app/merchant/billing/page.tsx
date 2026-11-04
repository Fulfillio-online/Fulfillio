'use client';

import React from 'react';
import { useMerchant } from '@/features/merchant/portal/MerchantContext';
import { MerchantBillingTab } from '@/features/merchant/portal/components/tabs/MerchantBillingTab';

export default function MerchantBillingPage() {
  const { profile } = useMerchant();

  return <MerchantBillingTab payoutAccount={profile.payoutAccount} />;
}
