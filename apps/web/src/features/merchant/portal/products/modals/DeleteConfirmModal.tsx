'use client';

import React from 'react';
import Image from 'next/image';
import { AlertTriangle, Trash2, X, Package } from 'lucide-react';
import { MerchantProductItem } from '../../types';

interface DeleteConfirmModalProps {
  isOpen: boolean;
  product: MerchantProductItem | null;
  onClose: () => void;
  onConfirmDelete: (id: string) => void;
}

export function DeleteConfirmModal({
  isOpen,
  product,
  onClose,
  onConfirmDelete,
}: DeleteConfirmModalProps) {
  if (!isOpen || !product) return null;

  return (
    <div
      className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 cursor-pointer"
      onClick={onClose}
    >
      <div
        className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md p-5 sm:p-6 space-y-4 shadow-2xl animate-in zoom-in-95 duration-200 cursor-default"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-400 shrink-0">
              <AlertTriangle className="h-5 w-5" />
            </div>
            <div>
              <h3 className="font-bold text-base text-slate-100">
                Delete Product?
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                This action cannot be undone.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-500 hover:text-slate-300 p-1 rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Product preview */}
        <div className="flex items-center gap-3 p-3 rounded-xl bg-slate-950 border border-slate-800">
          <div className="relative h-12 w-12 rounded-lg bg-slate-800 border border-slate-700 overflow-hidden shrink-0 flex items-center justify-center">
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
            <h4 className="font-semibold text-slate-200 text-xs sm:text-sm truncate">
              {product.title}
            </h4>
            <div className="flex items-center gap-2 mt-0.5 text-xs text-slate-400">
              <span className="font-mono text-[11px] text-slate-400">
                {product.sku}
              </span>
              <span>•</span>
              <span>{product.stock} in stock</span>
            </div>
          </div>
        </div>

        <p className="text-xs text-slate-400 leading-relaxed">
          Removing this product will unpublish it from your catalog and permanently delete its warehouse SKU and barcode mapping. Are you sure you want to proceed?
        </p>

        <div className="pt-2 flex items-center justify-end gap-2.5 border-t border-slate-800">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition-colors cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={() => {
              onConfirmDelete(product.id);
              onClose();
            }}
            className="px-4 py-2 rounded-lg bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold transition-colors cursor-pointer shadow-md flex items-center gap-1.5"
          >
            <Trash2 className="h-3.5 w-3.5" />
            <span>Yes, Delete Product</span>
          </button>
        </div>
      </div>
    </div>
  );
}
