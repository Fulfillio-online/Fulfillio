'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import {
  ArrowLeft,
  Edit2,
  Package,
  Tag,
  Boxes,
  CheckCircle,
  Layers,
  Printer,
} from 'lucide-react';
import { MerchantProductItem } from '../../types';
import { ManageStockModal } from '../modals/ManageStockModal';
import { PrintBarcodeModal } from '../../components/modals/PrintBarcodeModal';

interface ProductDetailsViewProps {
  product: MerchantProductItem;
  storeName: string;
  onRequestStockAdd: (productId: string, qty: number, note?: string) => void;
  onTriggerToast: (msg: string) => void;
}

export function ProductDetailsView({
  product,
  storeName,
  onRequestStockAdd,
  onTriggerToast,
}: ProductDetailsViewProps) {
  const [isStockModalOpen, setIsStockModalOpen] = useState(false);
  const [isBarcodeModalOpen, setIsBarcodeModalOpen] = useState(false);

  const defaultFeatures =
    product.keyFeatures && product.keyFeatures.length > 0
      ? product.keyFeatures
      : [
          'Premium cotton-blend fabric',
          'Oversized relaxed fit',
          'Soft and comfortable interior',
          'Unisex streetwear design',
        ];

  const isPendingApproval =
    product.status !== 'PUBLISHED' &&
    (!product.bin || product.bin === 'Pending Approval' || product.bin === 'Assigned on intake');

  // Dynamic variants display from real variantsList or product's primary variant
  const variants =
    product.variantsList && product.variantsList.length > 0
      ? product.variantsList
      : [
          {
            variant: product.colors?.[0]?.name || product.variantLabel?.split('/')[0]?.trim() || 'Standard',
            size: product.sizes?.[0] || product.variantLabel?.split('/')[1]?.trim() || 'Standard',
            stock: product.stock,
          },
        ];

  return (
    <div className="max-w-5xl mx-auto space-y-6 pb-16">
      {/* Top Back bar */}
      <div className="flex items-center justify-between border-b border-slate-800 pb-3">
        <Link
          href="/merchant/products"
          className="flex items-center gap-1.5 text-xs font-semibold text-slate-400 hover:text-emerald-400 transition-colors cursor-pointer"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Back to products</span>
        </Link>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setIsBarcodeModalOpen(true)}
            className="px-3 py-1.5 rounded-lg bg-indigo-600/15 hover:bg-indigo-600/25 text-indigo-300 border border-indigo-500/30 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <Printer className="h-3.5 w-3.5" />
            <span>Print Thermal Sticker</span>
          </button>
        </div>
      </div>

      {/* Product Hero Banner Card (Matching Image 2) */}
      <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-sm">
        <div className="flex items-center gap-4">
          <div className="relative h-20 w-20 rounded-xl bg-slate-950 border border-slate-800 overflow-hidden shrink-0 flex items-center justify-center">
            {product.imageUrl ? (
              product.imageUrl.startsWith('data:') ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={product.imageUrl}
                  alt={product.title}
                  className="h-full w-full object-cover"
                />
              ) : (
                <Image
                  src={product.imageUrl}
                  alt={product.title}
                  fill
                  unoptimized={true}
                  sizes="80px"
                  className="object-cover"
                />
              )
            ) : (
              <Package className="h-8 w-8 text-slate-600" />
            )}
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-extrabold text-slate-100">
              {product.title}
            </h1>
            <p className="text-xs font-mono text-slate-400 mt-0.5">
              {product.id} • SKU: <span className="text-emerald-400 font-bold">{product.sku}</span>
            </p>
            <div className="flex items-center gap-2 mt-2 flex-wrap">
              <span
                className={`px-2.5 py-0.5 rounded-full text-[10px] font-semibold border ${
                  isPendingApproval
                    ? 'bg-amber-500/10 text-amber-400 border-amber-500/30'
                    : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                }`}
              >
                {isPendingApproval ? 'Pending Approval' : 'Approved'}
              </span>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-sky-500/10 text-sky-400 border border-sky-500/30">
                {isPendingApproval ? 'Awaiting Intake' : product.status || 'Active'}
              </span>
              {product.category && (
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-slate-800 text-slate-300 border border-slate-700">
                  {product.category}
                </span>
              )}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <button
            type="button"
            onClick={() => setIsStockModalOpen(true)}
            className="flex-1 sm:flex-initial px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer border border-slate-700"
          >
            <Layers className="h-3.5 w-3.5 text-emerald-400" />
            <span>Manage Stock</span>
          </button>
          <Link
            href={`/merchant/products/${product.id}/edit`}
            className="flex-1 sm:flex-initial px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center justify-center gap-1.5 shadow-md shadow-emerald-900/30 transition-colors cursor-pointer"
          >
            <Edit2 className="h-3.5 w-3.5" />
            <span>Edit product</span>
          </Link>
        </div>
      </div>

      {/* 4 Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 shadow-sm">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
            <span>Declared Value</span>
            <Tag className="h-4 w-4 text-emerald-400" />
          </div>
          <div className="text-xl sm:text-2xl font-extrabold text-slate-100">
            ৳{product.price.toLocaleString()}
          </div>
          <span className="text-[10px] text-slate-500 mt-0.5 block">
            Replacement Valuation
          </span>
        </div>

        <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 shadow-sm">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
            <span>Total Stock</span>
            <Boxes className="h-4 w-4 text-indigo-400" />
          </div>
          <div className="text-xl sm:text-2xl font-extrabold text-slate-100 font-mono">
            {product.stock}
          </div>
          <span className="text-[10px] text-slate-500 mt-0.5 block">
            Recorded Warehouse Units
          </span>
        </div>

        <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 shadow-sm">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
            <span>Catalog Status</span>
            <CheckCircle
              className={`h-4 w-4 ${isPendingApproval ? 'text-amber-400' : 'text-emerald-400'}`}
            />
          </div>
          <div
            className={`text-xl sm:text-2xl font-extrabold font-mono ${
              isPendingApproval ? 'text-amber-400' : 'text-emerald-400'
            }`}
          >
            {isPendingApproval ? 'Pending' : 'Approved'}
          </div>
          <span className="text-[10px] text-slate-500 mt-0.5 block">
            {isPendingApproval ? 'Awaiting Admin Approval' : 'Verified by Warehouse'}
          </span>
        </div>

        <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 shadow-sm">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
            <span>Store Visibility</span>
            <Package className="h-4 w-4 text-sky-400" />
          </div>
          <div className="text-xl sm:text-2xl font-extrabold text-sky-400 font-mono">
            {product.status || 'Active'}
          </div>
          <span className="text-[10px] text-slate-500 mt-0.5 block">
            Fulfillment Ready
          </span>
        </div>
      </div>

      {/* Main Grid: Left Specs & Right Variants */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column (2 Cols) */}
        <div className="lg:col-span-2 space-y-5">
          {/* Core Specs Card */}
          <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-4 shadow-sm">
            <div>
              <h3 className="font-bold text-sm text-slate-200">Product Information</h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Core database details and declared specifications
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4 text-xs">
              <div>
                <span className="text-[10px] uppercase font-semibold text-slate-500 block">
                  PRODUCT NAME
                </span>
                <span className="text-slate-200 font-medium block mt-0.5">
                  {product.title}
                </span>
              </div>
              <div>
                <span className="text-[10px] uppercase font-semibold text-slate-500 block">
                  SKU
                </span>
                <span className="font-mono text-emerald-400 font-bold block mt-0.5">
                  {product.sku}
                </span>
              </div>
              <div>
                <span className="text-[10px] uppercase font-semibold text-slate-500 block">
                  CATEGORY
                </span>
                <span className="text-slate-200 block mt-0.5 capitalize">
                  {product.category || 'Fashion'} {product.subcategory ? `• ${product.subcategory}` : ''}
                </span>
              </div>
              <div>
                <span className="text-[10px] uppercase font-semibold text-slate-500 block">
                  DECLARED VALUE
                </span>
                <span className="text-emerald-400 font-bold block mt-0.5">
                  ৳{product.price.toLocaleString()}
                </span>
              </div>
            </div>

            {/* Description */}
            <div className="pt-3 border-t border-slate-800/80">
              <span className="text-[10px] uppercase font-semibold text-slate-500 block mb-1">
                DESCRIPTION
              </span>
              <p className="text-xs text-slate-300 leading-relaxed">
                {product.description ||
                  `${product.title} high-quality item engineered for durable performance and customer satisfaction.`}
              </p>
            </div>

            {/* Key Features */}
            <div className="pt-3 border-t border-slate-800/80">
              <span className="text-[10px] uppercase font-semibold text-slate-500 block mb-2">
                KEY FEATURES
              </span>
              <ul className="space-y-1.5 text-xs text-slate-300">
                {defaultFeatures.map((feat, idx) => (
                  <li key={idx} className="flex items-center gap-2">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 shrink-0" />
                    <span>{feat}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Inventory Status Card */}
          <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-3 shadow-sm">
            <h3 className="font-bold text-sm text-slate-200">Inventory Status</h3>
            <div className="flex items-center justify-between p-3 rounded-xl bg-slate-950 border border-slate-800">
              <div>
                <span className="text-xs font-semibold text-slate-300 block">
                  Available inventory
                </span>
                <span className="text-[11px] text-slate-500 block">
                  Recorded warehouse physical stock
                </span>
              </div>
              <span className="text-2xl font-extrabold text-slate-100 font-mono">
                {product.stock}
              </span>
            </div>
            <div className="p-2.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-xs text-emerald-400 flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-emerald-400 shrink-0" />
              <span>Stock levels are healthy & ready for fulfillment.</span>
            </div>
          </div>
        </div>

        {/* Right Column: Variants Breakdown Table (Matching Image 2) */}
        <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-4 shadow-sm">
          <div>
            <h3 className="font-bold text-sm text-slate-200">Product Variants</h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Sizes, colors, and stock configurations
            </p>
          </div>

          <div className="rounded-xl border border-slate-800 overflow-hidden bg-slate-950">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-900 text-slate-400 font-semibold border-b border-slate-800">
                <tr>
                  <th className="p-2.5">Variant</th>
                  <th className="p-2.5">Size / Spec</th>
                  <th className="p-2.5 text-right">Stock</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/80 font-mono">
                {variants.map((v: any, idx: number) => (
                  <tr key={idx} className="hover:bg-slate-900/40">
                    <td className="p-2.5 text-slate-300 font-sans font-medium">
                      {v.color || v.variant || 'Standard'}
                    </td>
                    <td className="p-2.5 text-slate-400">
                      <span className="px-1.5 py-0.5 rounded bg-slate-850 text-slate-200 border border-slate-700/80 text-[11px]">
                        {v.size || v.attributeValue || 'Default'}
                      </span>
                    </td>
                    <td className="p-2.5 text-right font-mono font-bold text-slate-100">
                      {v.stock}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Stock Management Modal */}
      <ManageStockModal
        isOpen={isStockModalOpen}
        product={product}
        onClose={() => setIsStockModalOpen(false)}
        onSubmitRequest={(productId, qty, note) => {
          onRequestStockAdd(productId, qty, note);
        }}
      />

      {/* Print Thermal Label Sticker Modal */}
      <PrintBarcodeModal
        isOpen={isBarcodeModalOpen}
        product={product}
        storeName={storeName}
        onClose={() => setIsBarcodeModalOpen(false)}
        onTriggerToast={onTriggerToast}
      />
    </div>
  );
}
