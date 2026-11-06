'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import { X, Layers, AlertCircle, ArrowUpRight, Package } from 'lucide-react';
import { MerchantProductItem } from '../../types';

interface ManageStockModalProps {
  isOpen: boolean;
  product: MerchantProductItem | null;
  onClose: () => void;
  onSubmitRequest: (productId: string, requestedQty: number, note?: string) => void;
}

export function ManageStockModal({
  isOpen,
  product,
  onClose,
  onSubmitRequest,
}: ManageStockModalProps) {
  const [requestedQty, setRequestedQty] = useState(50);
  const [note, setNote] = useState('');

  if (!isOpen || !product) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (requestedQty <= 0) return;
    onSubmitRequest(product.id, requestedQty, note.trim() || undefined);
    onClose();
    setRequestedQty(50);
    setNote('');
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 cursor-pointer"
      onClick={onClose}
    >
      <div
        className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-lg p-5 sm:p-6 space-y-4 shadow-2xl animate-in zoom-in-95 duration-200 cursor-default"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="h-9 w-9 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
              <Layers className="h-5 w-5" />
            </div>
            <div>
              <h3 className="font-bold text-base text-slate-100">
                Manage Stock & Inbound Request
              </h3>
              <p className="text-xs text-slate-400">
                Submit restock quantity for warehouse verification & admin approval.
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

        {/* Product summary card */}
        <div className="flex items-center gap-3 p-3 rounded-xl bg-slate-950 border border-slate-800">
          <div className="relative h-12 w-12 rounded-lg bg-slate-800 border border-slate-700 overflow-hidden shrink-0 flex items-center justify-center">
            {product.imageUrl ? (
              <Image
                src={product.imageUrl}
                alt={product.title}
                fill
                sizes="48px"
                className="object-cover"
              />
            ) : (
              <Package className="h-6 w-6 text-slate-500" />
            )}
          </div>
          <div className="min-w-0 flex-1">
            <h4 className="font-semibold text-slate-200 text-xs sm:text-sm truncate">
              {product.title}
            </h4>
            <div className="flex items-center gap-2 mt-0.5 text-xs">
              <span className="font-mono text-[11px] text-slate-400">
                {product.sku}
              </span>
              <span className="text-slate-600">•</span>
              <span className="text-slate-300">
                Current Stock: <strong className="text-emerald-400 font-mono">{product.stock}</strong> units
              </span>
            </div>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              New Stock Quantity to Add <span className="text-rose-400">*</span>
            </label>
            <div className="relative">
              <input
                type="number"
                min="1"
                required
                value={requestedQty}
                onChange={(e) => setRequestedQty(Math.max(1, Number(e.target.value) || 1))}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-sm font-bold text-slate-100 focus:outline-none focus:border-emerald-500"
                placeholder="50"
              />
              <span className="absolute right-3 top-2 text-xs text-slate-500">
                units
              </span>
            </div>
            <div className="flex gap-2 mt-2">
              {[25, 50, 100, 250].map((preset) => (
                <button
                  key={preset}
                  type="button"
                  onClick={() => setRequestedQty(preset)}
                  className="px-2.5 py-1 text-xs rounded bg-slate-800 text-slate-300 hover:bg-slate-700 hover:text-white transition-colors cursor-pointer font-mono"
                >
                  +{preset}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              Inbound Batch / Invoice Reference (Optional)
            </label>
            <input
              type="text"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="e.g. Winter batch #402 from Gazipur supplier"
              className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-emerald-500"
            />
          </div>

          {/* WMS Inbound Policy Notice */}
          <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-xs text-amber-300/90 flex items-start gap-2.5">
            <AlertCircle className="h-4 w-4 text-amber-400 shrink-0 mt-0.5" />
            <div className="leading-relaxed">
              <strong className="text-amber-300 block font-semibold mb-0.5">
                Warehouse Inbound Protocol:
              </strong>
              Submitted stock is held in <span className="font-semibold text-amber-200">Pending Approval</span> status. Once physical inventory arrives at the warehouse dock and is verified by the admin, it will be added to your live inventory.
            </div>
          </div>

          {/* Actions */}
          <div className="pt-2 flex items-center justify-end gap-2.5 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition-colors cursor-pointer shadow-md flex items-center gap-1.5"
            >
              <ArrowUpRight className="h-3.5 w-3.5" />
              <span>Submit for Admin Approval</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
