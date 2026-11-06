'use client';

import React from 'react';
import { useMerchant } from '@/features/merchant/portal/MerchantContext';
import { ProductForm } from '@/features/merchant/portal/products/components/ProductForm';

export default function NewProductPage() {
  const { profile, addProducts } = useMerchant();

  return (
    <div className="py-2 sm:py-4">
      <ProductForm
        merchantCode={profile.merchantCode}
        onSave={(newProd) => {
          addProducts([newProd]);
        }}
      />
    </div>
  );
}
