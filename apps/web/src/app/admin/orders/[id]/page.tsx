'use client';

import React, { use } from 'react';
import { OrderDetailsView } from '@/features/admin/orders';

interface AdminOrderDetailsPageProps {
  params: Promise<{ id: string }>;
}

export default function AdminOrderDetailsPage({ params }: AdminOrderDetailsPageProps) {
  const { id } = use(params);

  return <OrderDetailsView orderId={id} />;
}
