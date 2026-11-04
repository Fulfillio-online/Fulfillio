'use client';

import React from 'react';
import { useMerchant } from '@/features/merchant/portal/MerchantContext';
import { MerchantProfileTab } from '@/features/merchant/portal/profile';

export default function MerchantProfilePage() {
  const { profile, updateProfile, showToast } = useMerchant();

  return (
    <MerchantProfileTab
      profile={profile}
      onUpdateProfile={updateProfile}
      onTriggerToast={showToast}
    />
  );
}
