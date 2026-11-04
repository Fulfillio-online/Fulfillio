'use client';

import React from 'react';
import { useMerchant } from '@/features/merchant/portal/MerchantContext';
import { MerchantProductsTab } from '@/features/merchant/portal/components/tabs/MerchantProductsTab';

export default function MerchantProductsPage() {
  const {
    products,
    profile,
    adjustStock,
    deleteProduct,
    addProducts,
    showToast,
  } = useMerchant();

  return (
    <MerchantProductsTab
      products={products}
      merchantCode={profile.merchantCode}
      storeName={profile.storeName}
      onAdjustStock={adjustStock}
      onDeleteProduct={deleteProduct}
      onAddProducts={addProducts}
      onTriggerToast={showToast}
    />
  );
}
