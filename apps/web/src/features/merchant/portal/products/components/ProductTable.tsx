'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import {
  Printer,
  Edit2,
  Trash2,
  MoreVertical,
  Layers,
  FileText,
  Eye,
  Package,
} from 'lucide-react';
import { ProductTableProps } from '../types';

export function ProductTable({
  products,
  selectedIds,
  onToggleSelect,
  onToggleSelectAll,
  onToggleStatus,
  onManageStock,
  onViewDetails,
  onEditProduct,
  onPrintBarcode,
  onRequestDelete,
}: ProductTableProps) {
  const [activeMenuId, setActiveMenuId] = useState<string | null>(null);

  const isAllSelected = products.length > 0 && selectedIds.length === products.length;

  return (
    <div className="rounded-xl border border-slate-800 bg-slate-900 overflow-hidden shadow-sm">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[760px] text-left text-sm">
          <thead className="bg-slate-950/60 text-slate-400 text-xs uppercase tracking-wider font-semibold border-b border-slate-800">
            <tr>
              <th className="p-4 w-12 text-center">
                <input
                  type="checkbox"
                  checked={isAllSelected}
                  onChange={onToggleSelectAll}
                  aria-label="Select all products"
                  className="rounded border-slate-700 bg-slate-800 text-emerald-500 focus:ring-emerald-500/20 focus:ring-offset-0 cursor-pointer h-4 w-4"
                />
              </th>
              <th className="p-4">Product</th>
              <th className="p-4">Declared Value</th>
              <th className="p-4">Stock</th>
              <th className="p-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/80">
            {products.map((p) => {
              const isSelected = selectedIds.includes(p.id);
              const isPublished = p.status === 'PUBLISHED' || (!p.status && p.stock > 0);
              const isLowStock = p.stock <= 30 && p.stock > 0;
              const isOutOfStock = p.stock === 0;

              return (
                <tr
                  key={p.id}
                  className={`transition-colors hover:bg-slate-800/40 ${
                    isSelected ? 'bg-emerald-950/10' : ''
                  }`}
                >
                  {/* Row Checkbox */}
                  <td className="p-4 text-center">
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => onToggleSelect(p.id)}
                      aria-label={`Select ${p.title}`}
                      className="rounded border-slate-700 bg-slate-800 text-emerald-500 focus:ring-emerald-500/20 focus:ring-offset-0 cursor-pointer h-4 w-4"
                    />
                  </td>

                  {/* Product Details */}
                  <td className="p-4">
                    <div className="flex items-center gap-3">
                      {/* Product Thumbnail */}
                      <Link
                        href={`/merchant/products/${p.id}`}
                        className="relative h-12 w-12 rounded-lg bg-slate-800 border border-slate-700 overflow-hidden shrink-0 flex items-center justify-center cursor-pointer hover:border-emerald-500 transition-colors"
                      >
                        {p.imageUrl ? (
                          <Image
                            src={p.imageUrl}
                            alt={p.title}
                            fill
                            sizes="48px"
                            className="object-cover"
                          />
                        ) : (
                          <Package className="h-6 w-6 text-slate-500" />
                        )}
                      </Link>

                      {/* Title & SKU info */}
                      <div className="min-w-0">
                        <Link
                          href={`/merchant/products/${p.id}`}
                          className="font-semibold text-slate-200 hover:text-emerald-400 transition-colors text-sm text-left truncate block max-w-xs sm:max-w-sm cursor-pointer"
                        >
                          {p.title}
                        </Link>
                        <div className="flex items-center gap-2 mt-0.5 text-xs text-slate-400 flex-wrap">
                          {p.category && (
                            <span className="text-slate-400 font-medium">
                              {p.category}
                            </span>
                          )}
                          <span className="font-mono text-[11px] text-slate-400 bg-slate-950 px-1.5 py-0.5 rounded border border-slate-800">
                            {p.sku}
                          </span>
                        </div>
                      </div>
                    </div>
                  </td>

                  {/* Declared Value */}
                  <td className="p-4">
                    <div className="font-bold text-slate-100 text-sm">
                      ৳{p.price.toLocaleString()}
                    </div>
                    <div className="text-[11px] text-slate-500 mt-0.5">
                      Replacement worth
                    </div>
                  </td>

                  {/* Stock (Clean display without jumping +/- buttons!) */}
                  <td className="p-4">
                    <div>
                      {isOutOfStock ? (
                        <span className="text-xs font-bold text-rose-400 bg-rose-500/10 px-2 py-0.5 rounded border border-rose-500/20">
                          Out of stock
                        </span>
                      ) : isLowStock ? (
                        <span className="text-xs font-bold text-amber-400">
                          {p.stock} left
                        </span>
                      ) : (
                        <span className="text-xs text-slate-200 font-semibold font-mono">
                          {p.stock} in stock
                        </span>
                      )}
                      {p.reserved > 0 && (
                        <div className="text-[10px] text-slate-500 mt-0.5">
                          ({p.reserved} reserved)
                        </div>
                      )}
                    </div>
                  </td>

                  {/* Actions */}
                  <td className="p-4 text-right">
                    <div className="flex items-center justify-end gap-2 relative">
                      {/* Status Toggle Button (Draft / Publish) */}
                      <button
                        type="button"
                        onClick={() => onToggleStatus(p.id)}
                        className={`text-xs font-semibold px-2.5 py-1.5 rounded-lg border transition-all flex items-center gap-1.5 cursor-pointer shadow-sm ${
                          isPublished
                            ? 'bg-slate-800/90 hover:bg-slate-700 text-slate-200 border-slate-700'
                            : 'bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 border-emerald-500/40'
                        }`}
                        title={isPublished ? 'Click to set as Draft' : 'Click to Publish'}
                      >
                        {isPublished ? (
                          <>
                            <FileText className="h-3 w-3 text-slate-400" />
                            <span>Draft</span>
                          </>
                        ) : (
                          <>
                            <Eye className="h-3 w-3 text-emerald-400" />
                            <span>Publish</span>
                          </>
                        )}
                      </button>

                      {/* Action Menu (⋮) */}
                      <div className="relative">
                        <button
                          type="button"
                          onClick={() =>
                            setActiveMenuId(activeMenuId === p.id ? null : p.id)
                          }
                          className="p-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors cursor-pointer"
                          aria-label="More actions"
                        >
                          <MoreVertical className="h-4 w-4" />
                        </button>

                        {activeMenuId === p.id && (
                          <>
                            <div
                              className="fixed inset-0 z-20"
                              onClick={() => setActiveMenuId(null)}
                            />
                            <div className="absolute right-0 mt-1 w-48 rounded-xl bg-slate-900 border border-slate-800 shadow-2xl py-1 z-30 animate-in fade-in zoom-in-95 text-left">
                              <Link
                                href={`/merchant/products/${p.id}`}
                                onClick={() => setActiveMenuId(null)}
                                className="w-full px-3 py-2 text-xs text-slate-300 hover:bg-slate-800 flex items-center gap-2 cursor-pointer"
                              >
                                <Eye className="h-3.5 w-3.5 text-sky-400" />
                                <span>View Product Details</span>
                              </Link>
                              <button
                                type="button"
                                onClick={() => {
                                  setActiveMenuId(null);
                                  onManageStock(p);
                                }}
                                className="w-full px-3 py-2 text-xs text-slate-300 hover:bg-slate-800 flex items-center gap-2 cursor-pointer"
                              >
                                <Layers className="h-3.5 w-3.5 text-emerald-400" />
                                <span>Manage Stock</span>
                              </button>
                              <button
                                type="button"
                                onClick={() => {
                                  setActiveMenuId(null);
                                  onPrintBarcode(p);
                                }}
                                className="w-full px-3 py-2 text-xs text-slate-300 hover:bg-slate-800 flex items-center gap-2 cursor-pointer"
                              >
                                <Printer className="h-3.5 w-3.5 text-indigo-400" />
                                <span>Print Thermal Sticker</span>
                              </button>
                              <Link
                                href={`/merchant/products/${p.id}/edit`}
                                onClick={() => setActiveMenuId(null)}
                                className="w-full px-3 py-2 text-xs text-slate-300 hover:bg-slate-800 flex items-center gap-2 cursor-pointer"
                              >
                                <Edit2 className="h-3.5 w-3.5 text-slate-400" />
                                <span>Edit Product & Valuation</span>
                              </Link>
                              <div className="border-t border-slate-800 my-1" />
                              <button
                                type="button"
                                onClick={() => {
                                  setActiveMenuId(null);
                                  onRequestDelete(p);
                                }}
                                className="w-full px-3 py-2 text-xs text-rose-400 hover:bg-rose-500/10 flex items-center gap-2 cursor-pointer"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                                <span>Delete Product</span>
                              </button>
                            </div>
                          </>
                        )}
                      </div>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
