'use client';

import React from 'react';
import { MerchantDirectoryManager } from '@/features/merchants/MerchantDirectoryManager';

export default function AdminMerchantsPage() {
  return (
    <div className="space-y-6">
      <MerchantDirectoryManager resetTrigger={0} />
    </div>
  );
}
