'use client';

import React from 'react';
import Image from 'next/image';
import { Trash2, X, Package, FileText, CheckCircle2 } from 'lucide-react';
import { MerchantProductItem } from '../../types';

interface DeleteConfirmModalProps {
  isOpen: boolean;
  product: MerchantProductItem | null;
  onClose: () => void;
  onConfirmDelete: (id: string) => void;
  onRestore?: (id: string) => void;
}

export function DeleteConfirmModal({
  isOpen,
  product,
  onClose,
  onConfirmDelete,
  onRestore,
}: DeleteConfirmModalProps) {
  if (!isOpen || !product) return null;

  const isDraft = product.status === 'DRAFT';
  const isPending = product.status === 'PENDING_APPROVAL';
  const hasStock = (product.stock || 0) >= 1;

  return (
    <div
      className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 cursor-pointer"
      onClick={onClose}
    >
      <div
        className="bg-white dark:bg-navy-900 border border-slate-200 dark:border-white/10 rounded-2xl w-full max-w-md p-5 sm:p-6 space-y-4 shadow-2xl animate-in zoom-in-95 duration-200 cursor-default"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div
              className={`h-10 w-10 rounded-xl flex items-center justify-center shrink-0 ${
                hasStock
                  ? 'bg-amber-500/10 border border-amber-500/20 text-amber-500'
                  : 'bg-rose-500/10 border border-rose-500/20 text-rose-500'
              }`}
            >
              <Trash2 className="h-5 w-5" />
            </div>
            <div>
              <h3 className="font-bold text-base text-navy-900 dark:text-white">
                {hasStock
                  ? 'Deletion Blocked — Warehouse Stock Exists'
                  : isPending
                    ? 'Cancel Store Request?'
                    : 'Permanently Delete Product?'}
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                {hasStock
                  ? 'Products with 1 or more units in the warehouse cannot be deleted.'
                  : 'This action removes the product from your catalog and PostgreSQL database.'}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-navy-900 dark:hover:text-white p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-navy-800 transition-colors cursor-pointer"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Product preview */}
        <div className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 dark:bg-navy-950 border border-slate-200 dark:border-white/10">
          <div className="relative h-12 w-12 rounded-lg bg-slate-100 dark:bg-navy-800 border border-slate-200 dark:border-white/10 overflow-hidden shrink-0 flex items-center justify-center">
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
                  sizes="48px"
                  className="object-cover"
                />
              )
            ) : (
              <Package className="h-6 w-6 text-slate-500" />
            )}
          </div>
          <div className="min-w-0 flex-1">
            <h4 className="font-semibold text-navy-900 dark:text-white text-xs sm:text-sm truncate">
              {product.title}
            </h4>
            <div className="flex items-center gap-2 mt-0.5 text-xs text-slate-400">
              <span className="font-mono text-[11px] text-orange-600 dark:text-orange-400 font-bold">
                {product.sku}
              </span>
              <span>•</span>
              <span className={hasStock ? 'text-rose-500 font-bold' : ''}>
                {product.stock} in stock
              </span>
              <span>•</span>
              <span className="uppercase text-[10px] font-bold text-slate-500">{product.status || 'PENDING_APPROVAL'}</span>
            </div>
          </div>
        </div>

        <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
          {hasStock ? (
            <>
              Warehouse currently stores <strong className="text-rose-600 dark:text-rose-400">{product.stock} pcs</strong> of this product. Even if a single unit exists in the warehouse, the product cannot be deleted. Please withdraw/return or clear all stock to <strong>0 units</strong> before deleting, or save it in Draft instead.
            </>
          ) : isPending ? (
            'Are you sure you want to cancel this product approval request? It will be permanently removed from the pending queue and database.'
          ) : (
            'This product has 0 stock in the warehouse. Confirming will permanently delete it from both your catalog and the PostgreSQL database.'
          )}
        </p>

        <div className="pt-2 flex items-center justify-end gap-2.5 border-t border-slate-100 dark:border-white/10 flex-wrap">
          {hasStock && !isDraft && onRestore && (
            <button
              type="button"
              onClick={() => {
                onRestore(product.id);
                onClose();
              }}
              className="mr-auto px-3.5 py-2 rounded-xl bg-amber-600 hover:bg-amber-500 text-white text-xs font-bold transition-all cursor-pointer shadow-xs flex items-center gap-1.5 active:scale-95"
            >
              <FileText className="h-3.5 w-3.5" />
              <span>Save in Draft Instead</span>
            </button>
          )}

          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-navy-800 hover:bg-slate-200 dark:hover:bg-navy-700 text-slate-700 dark:text-slate-300 text-xs font-semibold transition-colors cursor-pointer"
          >
            {hasStock ? 'Close' : 'Cancel'}
          </button>

          {!hasStock && (
            <button
              type="button"
              onClick={() => {
                onConfirmDelete(product.id);
                onClose();
              }}
              className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 shadow-rose-500/20 text-white text-xs font-bold transition-all cursor-pointer shadow-md flex items-center gap-1.5"
            >
              <Trash2 className="h-3.5 w-3.5" />
              <span>{isPending ? 'Confirm Cancel Request' : 'Delete Product'}</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
