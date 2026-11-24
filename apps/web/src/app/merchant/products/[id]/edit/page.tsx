'use client';

import React, { use } from 'react';
import Link from 'next/link';
import { ArrowLeft, Package, Loader2, ShieldAlert, Eye } from 'lucide-react';
import { useMerchant } from '@/features/merchant/portal/MerchantContext';
import { ProductForm } from '@/features/merchant/portal/products/components/ProductForm';

interface EditProductPageProps {
  params: Promise<{ id: string }>;
}

export default function EditProductPage({ params }: EditProductPageProps) {
  const { id } = use(params);
  const { products, profile, updateProduct } = useMerchant();

  const product = products.find((p) => p.id === id || p.sku === id);

  if (!product) {
    if (products.length === 0) {
      return (
        <div className="rounded-2xl border border-slate-200 dark:border-white/10 p-12 text-center max-w-lg mx-auto my-12 bg-white dark:bg-navy-900/40 flex flex-col items-center justify-center">
          <Loader2 className="h-8 w-8 text-orange-500 animate-spin mb-3" />
          <h2 className="text-sm font-bold text-navy-900 dark:text-white">Loading Product Details...</h2>
          <p className="text-xs text-slate-400 mt-1">Please wait while we retrieve your product data.</p>
        </div>
      );
    }

    return (
      <div className="rounded-2xl border border-dashed border-slate-200 dark:border-white/10 p-12 text-center max-w-lg mx-auto my-12 bg-white dark:bg-navy-900/40">
        <Package className="h-10 w-10 text-slate-600 mx-auto mb-3" />
        <h2 className="text-base font-bold text-navy-900 dark:text-white">Product Not Found</h2>
        <p className="text-xs text-slate-400 mt-1">
          The requested product ID &quot;{id}&quot; does not exist in your store catalog.
        </p>
        <Link
          href="/merchant/products"
          className="mt-4 inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-slate-100 dark:bg-navy-800 hover:bg-slate-200 dark:hover:bg-navy-700 text-xs font-semibold text-navy-900 dark:text-slate-200 transition-colors"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          <span>Back to Products</span>
        </Link>
      </div>
    );
  }

  // Security & Inventory Integrity Guard:
  // Merchants can edit Draft, First-Time Pending Approval, AND Published/Approved products
  // (Published product edits wait in Pending Approval without altering the live published product).
  // Only Suspended, Rejected, or Draft-to-Publish intake-pending products are blocked.
  const isDraft = product.status === 'DRAFT' || Boolean(product.isDraft);
  const isRejected = !isDraft && product.status === 'REJECTED';
  const isPending =
    !isDraft &&
    !isRejected &&
    (product.status === 'PENDING_APPROVAL' ||
      !product.bin ||
      product.bin === 'Pending Approval' ||
      product.bin === 'Assigned on intake');
  const isApprovedOrPublished =
    !isDraft &&
    !isRejected &&
    !isPending &&
    (product.status === 'STOCK_STORED' ||
      product.status === 'APPROVED' ||
      product.status === 'PUBLISHED' ||
      product.stockAccepted === true);
  const isSuspended = Boolean(product.isSuspended);
  const canEdit =
    !isSuspended &&
    !isRejected &&
    (isDraft || (isPending && product.stockAccepted !== true) || isApprovedOrPublished);

  if (!canEdit) {
    const currentStatusLabel = isSuspended
      ? 'Suspended'
      : isRejected
      ? 'Rejected'
      : `Pending Publish (${product.stock} pcs)`;

    return (
      <div className="rounded-2xl border border-slate-200 dark:border-white/10 p-8 sm:p-12 text-center max-w-xl mx-auto my-12 bg-white dark:bg-navy-900/60 shadow-lg">
        <div className="w-14 h-14 rounded-2xl bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 flex items-center justify-center mx-auto mb-4">
          <ShieldAlert className="h-7 w-7" />
        </div>
        <h2 className="text-base sm:text-lg font-bold text-navy-900 dark:text-white">
          Product Editing Locked
        </h2>
        <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 mt-2 leading-relaxed">
          Product <strong className="text-navy-900 dark:text-white">&quot;{product.title}&quot;</strong> is currently in{' '}
          <strong className="text-navy-900 dark:text-white">{currentStatusLabel}</strong> status.
        </p>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-2 leading-relaxed">
          {isSuspended
            ? 'Suspended products cannot be edited until reactivated by warehouse admin.'
            : isRejected
            ? 'Rejected products cannot be edited directly.'
            : 'This product is awaiting warehouse publish approval.'}
        </p>
        <div className="mt-6 flex items-center justify-center gap-3">
          <Link
            href="/merchant/products"
            className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-navy-800 hover:bg-slate-200 dark:hover:bg-navy-700 text-xs font-semibold text-navy-900 dark:text-slate-200 transition-colors inline-flex items-center gap-1.5"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            <span>Back to Products</span>
          </Link>
          <Link
            href={`/merchant/products/${product.id}`}
            className="px-4 py-2 rounded-xl bg-orange-600 hover:bg-orange-500 text-xs font-bold text-white transition-colors shadow-sm shadow-orange-500/20 inline-flex items-center gap-1.5"
          >
            <Eye className="h-3.5 w-3.5" />
            <span>View Product Details</span>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="py-2 sm:py-4">
      <ProductForm
        key={`${product.id}-${product.editState || 'none'}`}
        initialProduct={product}
        merchantCode={profile.merchantCode}
        isPublishedEditMode={isApprovedOrPublished}
        onSave={async (updated) => {
          return await updateProduct(product.id, updated);
        }}
      />
    </div>
  );
}
