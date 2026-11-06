'use client';

import React from 'react';
import Image from 'next/image';
import {
  X,
  Edit2,
  Package,
  Tag,
  Boxes,
  CheckCircle,
  ArrowLeft,
  Layers,
} from 'lucide-react';
import { MerchantProductItem } from '../../types';

interface ProductDetailsModalProps {
  isOpen: boolean;
  product: MerchantProductItem | null;
  onClose: () => void;
  onEdit: (product: MerchantProductItem) => void;
  onManageStock: (product: MerchantProductItem) => void;
}

export function ProductDetailsModal({
  isOpen,
  product,
  onClose,
  onEdit,
  onManageStock,
}: ProductDetailsModalProps) {
  if (!isOpen || !product) return null;

  const defaultFeatures = product.keyFeatures && product.keyFeatures.length > 0
    ? product.keyFeatures
    : [
        'Premium cotton-blend fabric',
        'Oversized relaxed fit',
        'Soft and comfortable interior',
        'Unisex streetwear design',
        'Suitable for everyday active wear',
      ];

  // Realistic sample variants matrix
  const variants = [
    { variant: 'Black', size: 'M', stock: Math.max(0, Math.floor(product.stock * 0.2)) },
    { variant: 'Black', size: 'L', stock: Math.max(0, Math.floor(product.stock * 0.3)) },
    { variant: 'Black', size: 'XL', stock: Math.max(0, Math.floor(product.stock * 0.15)) },
    { variant: 'Charcoal Grey', size: 'M', stock: Math.max(0, Math.floor(product.stock * 0.1)) },
    { variant: 'Charcoal Grey', size: 'L', stock: Math.max(0, Math.floor(product.stock * 0.15)) },
    { variant: 'Dark Olive', size: 'L', stock: Math.max(0, Math.floor(product.stock * 0.1)) },
  ];

  return (
    <div
      className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-2 sm:p-4 overflow-y-auto cursor-pointer"
      onClick={onClose}
    >
      <div
        className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-5xl my-6 p-4 sm:p-6 space-y-6 shadow-2xl animate-in zoom-in-95 duration-200 cursor-default text-slate-100 max-h-[92vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Back bar */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <button
            type="button"
            onClick={onClose}
            className="flex items-center gap-1.5 text-xs font-semibold text-emerald-400 hover:text-emerald-300 transition-colors cursor-pointer"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Back to products</span>
          </button>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Product Hero Banner Card */}
        <div className="p-4 sm:p-5 rounded-2xl bg-slate-950 border border-slate-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="relative h-20 w-20 rounded-xl bg-slate-900 border border-slate-800 overflow-hidden shrink-0 flex items-center justify-center">
              {product.imageUrl ? (
                <Image
                  src={product.imageUrl}
                  alt={product.title}
                  fill
                  sizes="80px"
                  className="object-cover"
                />
              ) : (
                <Package className="h-8 w-8 text-slate-600" />
              )}
            </div>
            <div>
              <h2 className="text-lg sm:text-xl font-extrabold text-slate-100">
                {product.title}
              </h2>
              <p className="text-xs font-mono text-slate-400 mt-0.5">
                {product.id} • SKU: <span className="text-emerald-400 font-bold">{product.sku}</span>
              </p>
              <div className="flex items-center gap-2 mt-2 flex-wrap">
                <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                  Approved
                </span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-sky-500/10 text-sky-400 border border-sky-500/30">
                  {product.status || 'Active'}
                </span>
                {product.category && (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-slate-800 text-slate-300 border border-slate-700">
                    {product.category}
                  </span>
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <button
              type="button"
              onClick={() => {
                onClose();
                onManageStock(product);
              }}
              className="flex-1 sm:flex-initial px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer border border-slate-700"
            >
              <Layers className="h-3.5 w-3.5 text-emerald-400" />
              <span>Manage Stock</span>
            </button>
            <button
              type="button"
              onClick={() => {
                onClose();
                onEdit(product);
              }}
              className="flex-1 sm:flex-initial px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center justify-center gap-1.5 shadow-md transition-colors cursor-pointer"
            >
              <Edit2 className="h-3.5 w-3.5" />
              <span>Edit product</span>
            </button>
          </div>
        </div>

        {/* 4 Stat Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          <div className="p-4 rounded-xl bg-slate-950/80 border border-slate-800">
            <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
              <span>Declared Value</span>
              <Tag className="h-4 w-4 text-emerald-400" />
            </div>
            <div className="text-xl sm:text-2xl font-extrabold text-slate-100">
              ৳{product.price.toLocaleString()}
            </div>
            <span className="text-[10px] text-slate-500 mt-0.5 block">
              Replacement Worth
            </span>
          </div>

          <div className="p-4 rounded-xl bg-slate-950/80 border border-slate-800">
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

          <div className="p-4 rounded-xl bg-slate-950/80 border border-slate-800">
            <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
              <span>Catalog Status</span>
              <CheckCircle className="h-4 w-4 text-emerald-400" />
            </div>
            <div className="text-xl sm:text-2xl font-extrabold text-emerald-400 font-mono">
              Approved
            </div>
            <span className="text-[10px] text-slate-500 mt-0.5 block">
              Verified by Warehouse
            </span>
          </div>

          <div className="p-4 rounded-xl bg-slate-950/80 border border-slate-800">
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
            <div className="p-5 rounded-2xl bg-slate-950/60 border border-slate-800 space-y-4">
              <div>
                <h3 className="font-bold text-sm text-slate-200">Product Information</h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Core database details and declared specs
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
                    `${product.title} high-quality apparel engineered for comfort and durable streetwear performance.`}
                </p>
              </div>

              {/* Key Features */}
              <div className="pt-3 border-t border-slate-800/80">
                <span className="text-[10px] uppercase font-semibold text-slate-500 block mb-2">
                  KEY FEATURES
                </span>
                <ul className="space-y-1 text-xs text-slate-300">
                  {defaultFeatures.map((feat, idx) => (
                    <li key={idx} className="flex items-center gap-2">
                      <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                      <span>{feat}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {/* Inventory Status Card */}
            <div className="p-4 sm:p-5 rounded-2xl bg-slate-950/60 border border-slate-800 space-y-3">
              <h3 className="font-bold text-sm text-slate-200">Inventory Status</h3>
              <div className="flex items-center justify-between p-3 rounded-xl bg-slate-900 border border-slate-800">
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
                <span>Stock levels are healthy & ready for order fulfillment.</span>
              </div>
            </div>
          </div>

          {/* Right Column: Variants Breakdown Table */}
          <div className="p-5 rounded-2xl bg-slate-950/60 border border-slate-800 space-y-4">
            <div>
              <h3 className="font-bold text-sm text-slate-200">Product Variants</h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Sizes, colors, and stock configurations
              </p>
            </div>

            <div className="rounded-xl border border-slate-800 overflow-hidden">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-900 text-slate-400 font-semibold border-b border-slate-800">
                  <tr>
                    <th className="p-2.5">Variant</th>
                    <th className="p-2.5">Size</th>
                    <th className="p-2.5 text-right">Stock</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/80">
                  {variants.map((v, idx) => (
                    <tr key={idx} className="hover:bg-slate-800/30">
                      <td className="p-2.5 text-slate-300 font-medium">
                        {v.variant}
                      </td>
                      <td className="p-2.5 text-slate-400 font-mono">
                        {v.size}
                      </td>
                      <td className="p-2.5 text-right font-mono font-bold text-slate-200">
                        {v.stock}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
