'use client';

import React from 'react';
import { useMerchant } from '@/features/merchant/portal/MerchantContext';
import { MerchantApiKeysTab } from '@/features/merchant/portal/components/tabs/MerchantApiKeysTab';

export default function MerchantApiKeysPage() {
  const { profile, updateProfile, showToast } = useMerchant();

  return (
    <MerchantApiKeysTab
      apiKey={profile.apiKey}
      webhookUrl={profile.webhookUrl}
      onSaveWebhook={(url: string) => updateProfile({ webhookUrl: url })}
      onTriggerToast={showToast}
    />
  );
}
