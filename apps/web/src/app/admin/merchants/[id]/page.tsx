'use client';

import React, { use } from 'react';
import { MerchantProfilePage } from '@/features/admin/merchants/MerchantProfilePage';

interface AdminMerchantProfileRouteProps {
  params: Promise<{ id: string }>;
}

export default function AdminMerchantProfileRoute({ params }: AdminMerchantProfileRouteProps) {
  const { id } = use(params);
  return <MerchantProfilePage merchantId={decodeURIComponent(id)} />;
}
