'use client';

import React, { use } from 'react';
import Link from 'next/link';
import { ArrowLeft, Package } from 'lucide-react';
import { useMerchant } from '@/features/merchant/portal/MerchantContext';
import { ProductDetailsView } from '@/features/merchant/portal/products/components/ProductDetailsView';

interface ProductDetailsPageProps {
  params: Promise<{ id: string }>;
}

export default function ProductDetailsPage({ params }: ProductDetailsPageProps) {
  const { id } = use(params);
  const { products, profile, requestStockAdd, showToast } = useMerchant();

  const product = products.find((p) => p.id === id);

  if (!product) {
    return (
      <div className="rounded-2xl border border-dashed border-slate-800 p-12 text-center max-w-lg mx-auto my-12 bg-slate-900/40">
        <Package className="h-10 w-10 text-slate-600 mx-auto mb-3" />
        <h2 className="text-base font-bold text-slate-100">Product Not Found</h2>
        <p className="text-xs text-slate-400 mt-1">
          The requested product ID &quot;{id}&quot; does not exist in your store catalog.
        </p>
        <Link
          href="/merchant/products"
          className="mt-4 inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-200 transition-colors"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          <span>Back to Products</span>
        </Link>
      </div>
    );
  }

  return (
    <div className="py-2 sm:py-4">
      <ProductDetailsView
        product={product}
        storeName={profile.storeName}
        onRequestStockAdd={requestStockAdd}
        onTriggerToast={showToast}
      />
    </div>
  );
}
