'use client';

import React, { use } from 'react';
import { AdminProductDetailsView } from '@/features/admin/products';

interface AdminProductDetailsPageProps {
  params: Promise<{ id: string }>;
}

export default function AdminProductDetailsPage({ params }: AdminProductDetailsPageProps) {
  const { id } = use(params);

  return <AdminProductDetailsView productId={id} />;
}
