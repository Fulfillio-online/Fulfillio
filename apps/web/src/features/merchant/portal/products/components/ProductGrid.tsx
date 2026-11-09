'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import {
  Printer,
  Edit2,
  Trash2,
  Package,
  Layers,
  FileText,
  Eye,
} from 'lucide-react';
import { MerchantProductItem } from '../../types';

interface ProductGridProps {
  products: MerchantProductItem[];
  selectedIds: string[];
  onToggleSelect: (id: string) => void;
  onToggleStatus: (id: string) => void;
  onManageStock: (product: MerchantProductItem) => void;
  onViewDetails: (product: MerchantProductItem) => void;
  onEditProduct: (product: MerchantProductItem) => void;
  onPrintBarcode: (product: MerchantProductItem) => void;
  onRequestDelete: (product: MerchantProductItem) => void;
}

export function ProductGrid({
  products,
  selectedIds,
  onToggleSelect,
  onToggleStatus,
  onManageStock,
  onViewDetails,
  onEditProduct,
  onPrintBarcode,
  onRequestDelete,
}: ProductGridProps) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
      {products.map((p) => {
        const isSelected = selectedIds.includes(p.id);
        const costPrice = p.costPrice ?? Math.round(p.price * 0.5);
        const profit = p.profit ?? (p.price - costPrice);
        const profitMargin =
          p.profitMargin ??
          (p.price > 0 ? Math.round((profit / p.price) * 100) : 50);
        const isPublished = p.status === 'PUBLISHED' || (!p.status && p.stock > 0);
        const isLowStock = p.stock <= 30 && p.stock > 0;
        const isOutOfStock = p.stock === 0;

        return (
          <div
            key={p.id}
            className={`rounded-xl border bg-slate-900 overflow-hidden shadow-sm transition-all hover:border-slate-700 flex flex-col justify-between ${
              isSelected ? 'border-emerald-500 bg-emerald-950/10' : 'border-slate-800'
            }`}
          >
            {/* Image Header with badges */}
            <div className="relative aspect-video w-full bg-slate-950 border-b border-slate-800/80 overflow-hidden">
              <Link
                href={`/merchant/products/${p.id}`}
                className="w-full h-full relative cursor-pointer block"
              >
                {p.imageUrl ? (
                  p.imageUrl.startsWith('data:') ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={p.imageUrl}
                      alt={p.title}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <Image
                      src={p.imageUrl}
                      alt={p.title}
                      fill
                      unoptimized={true}
                      sizes="(max-width: 768px) 100vw, 300px"
                      className="object-cover"
                    />
                  )
                ) : (
                  <div className="h-full w-full flex items-center justify-center">
                    <Package className="h-10 w-10 text-slate-700" />
                  </div>
                )}
              </Link>

              {/* Selection Checkbox */}
              <div className="absolute top-2 left-2 z-10">
                <input
                  type="checkbox"
                  checked={isSelected}
                  onChange={() => onToggleSelect(p.id)}
                  aria-label={`Select ${p.title}`}
                  className="rounded border-slate-700 bg-slate-900/90 text-emerald-500 focus:ring-emerald-500/20 h-4 w-4 cursor-pointer"
                />
              </div>

              {/* Status Badge */}
              <div className="absolute top-2 right-2 z-10">
                <span
                  className={`text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full border backdrop-blur shadow-sm ${
                    isPublished
                      ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
                      : 'bg-slate-800/80 text-slate-300 border-slate-700'
                  }`}
                >
                  {isPublished ? 'Published' : 'Draft'}
                </span>
              </div>

              {/* Category Pill */}
              {p.category && (
                <div className="absolute bottom-2 left-2 z-10">
                  <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-slate-900/90 text-slate-300 border border-slate-700/80 backdrop-blur">
                    {p.category}
                  </span>
                </div>
              )}
            </div>

            {/* Body */}
            <div className="p-4 flex-1 flex flex-col justify-between">
              <div>
                <Link
                  href={`/merchant/products/${p.id}`}
                  className="font-semibold text-slate-200 hover:text-emerald-400 text-sm line-clamp-1 text-left transition-colors cursor-pointer block"
                  title={p.title}
                >
                  {p.title}
                </Link>

                <div className="flex items-center gap-2 mt-1">
                  <span className="font-mono text-[11px] text-slate-400 bg-slate-950 px-1.5 py-0.5 rounded border border-slate-800">
                    {p.sku}
                  </span>
                  {p.bin && p.bin !== 'Assigned on intake' && (
                    <span className="text-[10px] font-mono text-amber-400 bg-amber-500/10 px-1.5 py-0.5 rounded border border-amber-500/20">
                      {p.bin}
                    </span>
                  )}
                </div>

                {/* Declared Value Card */}
                <div className="mt-3 p-2.5 rounded-lg bg-slate-950/60 border border-slate-800/80 flex items-center justify-between text-xs">
                  <div>
                    <span className="text-slate-500 block text-[10px] uppercase font-semibold">
                      Declared Value
                    </span>
                    <span className="font-bold text-slate-100 text-sm">
                      ৳{p.price.toLocaleString()}
                    </span>
                  </div>
                  <span className="text-[10px] text-slate-500">
                    Liability Worth
                  </span>
                </div>

                {/* Stock Row (No jumping +/- buttons!) */}
                <div className="mt-3 flex items-center justify-between">
                  <div>
                    <span className="text-[10px] text-slate-400 block">Warehouse Stock</span>
                    {isOutOfStock ? (
                      <span className="text-xs font-bold text-rose-400">Out of stock</span>
                    ) : isLowStock ? (
                      <span className="text-xs font-bold text-amber-400">{p.stock} left</span>
                    ) : (
                      <span className="text-xs text-slate-200 font-semibold font-mono">{p.stock} in stock</span>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={() => onManageStock(p)}
                    className="px-2 py-1 rounded-md bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold flex items-center gap-1 border border-slate-700 cursor-pointer transition-colors"
                  >
                    <Layers className="h-3 w-3 text-emerald-400" />
                    <span>+ Stock</span>
                  </button>
                </div>
              </div>

              {/* Bottom Actions */}
              <div className="mt-4 pt-3 border-t border-slate-800 flex items-center justify-between gap-1.5">
                <button
                  type="button"
                  onClick={() => onToggleStatus(p.id)}
                  className={`text-xs font-semibold px-2 py-1.5 rounded-lg border transition-all flex items-center gap-1 cursor-pointer flex-1 justify-center ${
                    isPublished
                      ? 'bg-slate-800 hover:bg-slate-700 text-slate-200 border-slate-700'
                      : 'bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 border-emerald-500/40'
                  }`}
                >
                  {isPublished ? (
                    <>
                      <FileText className="h-3 w-3" />
                      <span>Draft</span>
                    </>
                  ) : (
                    <>
                      <Eye className="h-3 w-3" />
                      <span>Publish</span>
                    </>
                  )}
                </button>

                <button
                  type="button"
                  onClick={() => onPrintBarcode(p)}
                  className="p-1.5 rounded-lg border border-indigo-500/30 bg-indigo-600/10 hover:bg-indigo-600/20 text-indigo-300 transition-colors cursor-pointer"
                  title="Print Thermal Barcode"
                >
                  <Printer className="h-4 w-4" />
                </button>

                <Link
                  href={`/merchant/products/${p.id}/edit`}
                  className="p-1.5 rounded-lg border border-slate-800 bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors cursor-pointer"
                  title="Edit Product"
                >
                  <Edit2 className="h-4 w-4" />
                </Link>

                <button
                  type="button"
                  onClick={() => onRequestDelete(p)}
                  className="p-1.5 rounded-lg border border-rose-500/20 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 transition-colors cursor-pointer"
                  title="Delete Product"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
