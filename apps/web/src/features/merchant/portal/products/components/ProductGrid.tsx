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
  CheckCircle2,
  RotateCcw,
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
        const isDraft = p.status === 'DRAFT';
        const isPendingApproval =
          !isDraft &&
          (p.status === 'PENDING_APPROVAL' ||
            !p.bin ||
            p.bin === 'Pending Approval' ||
            p.bin === 'Assigned on intake');
        const isFirstTimePending = isPendingApproval && (p.stock || 0) === 0;
        const isPublishPendingFromDraft = isPendingApproval && (p.stock || 0) > 0;
        const isAwaitingStock =
          !isDraft &&
          !isPendingApproval &&
          (p.stock === 0 || p.stockAccepted === false || p.stockStatus === 'AWAITING_STOCK');
        const isStockStored =
          !isDraft &&
          !isPendingApproval &&
          !isAwaitingStock &&
          (p.status === 'STOCK_STORED' || (p.stock || 0) > 0);
        const isPublished = isStockStored;
        const isLowStock = !isDraft && isStockStored && p.stock <= 30 && p.stock > 0;
        const isOutOfStock = isAwaitingStock;

        return (
          <div
            key={p.id}
            className={`rounded-xl border bg-white dark:bg-navy-900 overflow-hidden shadow-xs transition-all hover:border-orange-500/40 flex flex-col justify-between ${
              isSelected
                ? 'border-orange-500 ring-2 ring-orange-500/20 bg-orange-50/10 dark:bg-orange-950/10'
                : 'border-slate-200/80 dark:border-white/10'
            }`}
          >
            {/* Image Header with badges */}
            <div className="relative aspect-video w-full bg-slate-100 dark:bg-navy-950 border-b border-slate-200 dark:border-white/10 overflow-hidden">
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
                    <Package className="h-10 w-10 text-slate-400 dark:text-slate-700" />
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
                  className="rounded border-slate-300 dark:border-white/20 bg-white dark:bg-navy-900 text-orange-600 focus:ring-orange-500/20 h-4 w-4 cursor-pointer"
                />
              </div>

              {/* Status Badge: Non-clickable pure text badge */}
              <div className="absolute top-2 right-2 z-10">
                <span
                  className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border backdrop-blur shadow-xs select-none ${
                    isPendingApproval
                      ? 'bg-amber-50 text-amber-700 border-amber-300 dark:bg-amber-500/20 dark:text-amber-300 dark:border-amber-500/30'
                      : isDraft
                      ? 'bg-slate-100 text-slate-700 border-slate-300 dark:bg-navy-800/80 dark:text-slate-300 dark:border-white/10'
                      : isAwaitingStock
                      ? 'bg-sky-50 text-sky-700 border-sky-300 dark:bg-sky-500/20 dark:text-sky-300 dark:border-sky-500/30'
                      : 'bg-emerald-50 text-emerald-700 border-emerald-300 dark:bg-emerald-500/20 dark:text-emerald-300 dark:border-emerald-500/30'
                  }`}
                >
                  {isPendingApproval
                    ? 'Pending Product'
                    : isDraft
                    ? 'Draft'
                    : isAwaitingStock
                    ? 'Waiting for Stock'
                    : 'Published'}
                </span>
              </div>
            </div>

            {/* Body */}
            <div className="p-4 flex-1 flex flex-col justify-between">
              <div>
                <Link
                  href={`/merchant/products/${p.id}`}
                  className="font-bold text-navy-900 dark:text-white hover:text-orange-600 dark:hover:text-orange-400 text-sm line-clamp-1 text-left transition-colors cursor-pointer block"
                  title={p.title}
                >
                  {p.title}
                </Link>

                <div className="flex items-center gap-2 mt-1">
                  <span className="font-mono text-[11px] text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-navy-950 px-1.5 py-0.5 rounded border border-slate-200 dark:border-white/10">
                    {p.sku}
                  </span>
                  {isFirstTimePending ? (
                    <span className="text-[10px] font-mono text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-500/10 px-1.5 py-0.5 rounded border border-amber-300 dark:border-amber-500/20">
                      Pending Admin Review
                    </span>
                  ) : p.bin && p.bin !== 'Assigned on intake' && p.bin !== 'Pending Approval' ? (
                    <span className="text-[10px] font-mono text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-navy-950 px-1.5 py-0.5 rounded border border-slate-200 dark:border-white/10">
                      {p.bin}
                    </span>
                  ) : null}
                </div>

                {/* Declared Value Card */}
                <div className="mt-3 p-2.5 rounded-lg bg-slate-50 dark:bg-navy-950/60 border border-slate-200/80 dark:border-white/10 flex items-center justify-between text-xs">
                  <div>
                    <span className="text-slate-500 block text-[10px] uppercase font-semibold">
                      Declare Price
                    </span>
                    <span className="font-bold text-navy-900 dark:text-white text-sm">
                      ৳{p.price.toLocaleString()}
                    </span>
                  </div>
                  <span className="text-[10px] text-slate-500 font-medium">
                    Liability Worth
                  </span>
                </div>

                {/* Stock Row */}
                <div className="mt-3 flex items-center justify-between">
                  <div>
                    <span className="text-[10px] text-slate-500 dark:text-slate-400 block font-medium">Warehouse Stock</span>
                    {isOutOfStock ? (
                      <span className="text-xs font-bold text-rose-600 dark:text-rose-400 font-mono">0</span>
                    ) : isLowStock ? (
                      <span className="text-xs font-bold text-amber-600 dark:text-amber-400 font-mono">{p.stock}</span>
                    ) : (
                      <span className="text-xs text-navy-900 dark:text-white font-semibold font-mono">{p.stock}</span>
                    )}
                  </div>
                </div>
              </div>

              {/* Bottom Actions */}
              <div className="mt-4 pt-3 border-t border-slate-200/80 dark:border-white/10 flex items-center justify-between gap-1.5">
                {/* Save in Draft or Restore Button */}
                {isDraft ? (
                  <button
                    type="button"
                    onClick={() => onToggleStatus(p.id)}
                    className="text-xs font-bold px-2 py-1.5 rounded-lg border bg-emerald-600 hover:bg-emerald-500 text-white border-emerald-600 shadow-xs flex items-center gap-1.5 cursor-pointer flex-1 justify-center transition-all"
                    title="Submit Product for Admin Approval"
                  >
                    <CheckCircle2 className="h-3.5 w-3.5" />
                    <span>Submit for Approval</span>
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => onToggleStatus(p.id)}
                    className="text-xs font-bold px-2 py-1.5 rounded-lg border bg-slate-100 hover:bg-slate-200 dark:bg-navy-800 dark:hover:bg-navy-700 text-slate-700 dark:text-slate-200 border-slate-200 dark:border-white/10 transition-all flex items-center gap-1.5 cursor-pointer flex-1 justify-center"
                    title={isPendingApproval || isAwaitingStock ? 'Cancel Submission and save in Draft' : 'Save product in Draft'}
                  >
                    <RotateCcw className="h-3.5 w-3.5 text-amber-500" />
                    <span>{isPendingApproval || isAwaitingStock ? 'Cancel Submission' : 'Save in Draft'}</span>
                  </button>
                )}

                {isStockStored && (
                  <button
                    type="button"
                    onClick={() => onPrintBarcode(p)}
                    className="p-1.5 rounded-lg border border-indigo-200 dark:border-indigo-500/30 bg-indigo-50 dark:bg-indigo-600/10 hover:bg-indigo-100 dark:hover:bg-indigo-600/20 text-indigo-700 dark:text-indigo-300 transition-colors cursor-pointer"
                    title="Print Thermal Sticker"
                  >
                    <Printer className="h-4 w-4" />
                  </button>
                )}

                {isFirstTimePending && (
                  <Link
                    href={`/merchant/products/${p.id}/edit`}
                    className="p-1.5 rounded-lg border border-slate-200 dark:border-white/10 bg-slate-100 dark:bg-navy-800 hover:bg-slate-200 dark:hover:bg-navy-700 text-slate-700 dark:text-slate-300 transition-colors cursor-pointer"
                    title="Edit Product"
                  >
                    <Edit2 className="h-4 w-4" />
                  </Link>
                )}

                {!isPublishPendingFromDraft && (
                  <button
                    type="button"
                    onClick={() => onRequestDelete(p)}
                    className="p-1.5 rounded-lg border border-rose-200 dark:border-rose-500/20 bg-rose-50 dark:bg-rose-500/10 hover:bg-rose-100 dark:hover:bg-rose-500/20 text-rose-600 dark:text-rose-400 transition-colors cursor-pointer"
                    title={isFirstTimePending ? 'Cancel Request' : (p.stock || 0) >= 1 ? 'Cannot delete while stock > 0' : 'Delete Product'}
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                )}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
