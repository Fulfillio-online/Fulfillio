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
  CheckSquare,
  Square,
} from 'lucide-react';
import { ProductTableProps } from '../types';
import { MerchantExpandableCard } from '../../components/common/MerchantExpandableCard';
import { ProductThumbnail } from './ProductThumbnail';

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
      {/* ============================================================== */}
      {/* 1. MOBILE RESPONSIVE CARDS VIEW (Visible on screens < 768px)  */}
      {/* ============================================================== */}
      <div className="block md:hidden">
        {/* Mobile "Select All" Bar */}
        <div className="p-3 bg-slate-950/70 border-b border-slate-800 flex items-center justify-between text-xs">
          <button
            type="button"
            onClick={onToggleSelectAll}
            className="flex items-center gap-2 text-slate-300 font-semibold hover:text-white transition-colors"
          >
            {isAllSelected ? (
              <CheckSquare className="h-4 w-4 text-emerald-400" />
            ) : (
              <Square className="h-4 w-4 text-slate-500" />
            )}
            <span>Select All ({products.length} products)</span>
          </button>

          {selectedIds.length > 0 && (
            <span className="text-[11px] font-mono text-emerald-400 font-bold bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
              {selectedIds.length} selected
            </span>
          )}
        </div>

        {/* Mobile Product Cards List */}
        <div className="p-2 sm:p-3 space-y-2.5">
          {products.map((p) => {
            const isSelected = selectedIds.includes(p.id);
            const isPublished = p.status === 'PUBLISHED' || (!p.status && p.stock > 0);
            const isLowStock = p.stock <= 30 && p.stock > 0;
            const isOutOfStock = p.stock === 0;

            return (
              <MerchantExpandableCard
                key={p.id}
                isSelected={isSelected}
                onToggleSelect={() => onToggleSelect(p.id)}
                statusBadge={
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onToggleStatus(p.id);
                    }}
                    className={`text-[10px] font-bold px-2 py-0.5 rounded-full border transition-all cursor-pointer ${
                      isPublished
                        ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30'
                        : 'bg-slate-800 text-slate-400 border-slate-700'
                    }`}
                    title="Click to toggle status"
                  >
                    {isPublished ? '● Published' : '○ Draft'}
                  </button>
                }
                row1={
                  <div className="flex items-center gap-2 min-w-0">
                    <ProductThumbnail src={p.imageUrl} alt={p.title} size="md" />
                    <div className="min-w-0 flex-1">
                      <span className="font-mono text-[10px] text-emerald-400 font-bold bg-slate-950 px-1.5 py-0.5 rounded border border-slate-800">
                        {p.sku}
                      </span>
                      {p.category && (
                        <span className="text-[11px] text-slate-400 font-medium ml-1.5 truncate">
                          {p.category}
                        </span>
                      )}
                    </div>
                  </div>
                }
                row2={
                  <Link
                    href={`/merchant/products/${p.id}`}
                    onClick={(e) => e.stopPropagation()}
                    className="font-bold text-xs text-slate-100 hover:text-emerald-400 transition-colors line-clamp-1 block cursor-pointer"
                  >
                    {p.title}
                  </Link>
                }
                row3={
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-mono text-xs font-extrabold text-slate-100">
                      ৳{p.price.toLocaleString()}
                    </span>
                    <span className="text-slate-600 text-[10px]">•</span>
                    {isOutOfStock ? (
                      <span className="text-[10px] font-bold text-rose-400 bg-rose-500/10 px-2 py-0.5 rounded border border-rose-500/20">
                        Out of stock
                      </span>
                    ) : isLowStock ? (
                      <span className="text-[10px] font-bold text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">
                        {p.stock} left (Low)
                      </span>
                    ) : (
                      <span className="text-[10px] font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                        {p.stock} in stock
                      </span>
                    )}
                  </div>
                }
                expandedContent={
                  <div className="space-y-2.5">
                    {/* Barcode & Stock breakdown */}
                    <div className="grid grid-cols-2 gap-2 text-[11px]">
                      <div className="p-2 rounded-lg bg-slate-900 border border-slate-800">
                        <span className="text-slate-500 text-[10px] uppercase font-semibold block">Barcode</span>
                        <span className="font-mono font-bold text-slate-200 block mt-0.5 truncate">{p.barcode}</span>
                        <span className="text-slate-500 text-[10px]">Bin: {p.bin || 'Intake bin'}</span>
                      </div>
                      <div className="p-2 rounded-lg bg-slate-900 border border-slate-800">
                        <span className="text-slate-500 text-[10px] uppercase font-semibold block">Warehouse Stock</span>
                        <span className="font-mono font-bold text-emerald-400 block mt-0.5">{p.stock} units</span>
                        <span className="text-slate-400 text-[10px]">{p.reserved} reserved</span>
                      </div>
                    </div>
                  </div>
                }
                actions={
                  <>
                    <button
                      type="button"
                      onClick={() => onManageStock(p)}
                      className="flex-1 min-w-[100px] py-2 px-3 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors border border-slate-700/80 cursor-pointer"
                    >
                      <Layers className="h-3.5 w-3.5 text-emerald-400" />
                      <span>Manage Stock</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => onPrintBarcode(p)}
                      className="flex-1 min-w-[90px] py-2 px-3 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors border border-slate-700/80 cursor-pointer"
                    >
                      <Printer className="h-3.5 w-3.5 text-indigo-400" />
                      <span>Barcode</span>
                    </button>

                    <Link
                      href={`/merchant/products/${p.id}/edit`}
                      className="py-2 px-3.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors border border-slate-700/80 cursor-pointer shrink-0"
                    >
                      <Edit2 className="h-3.5 w-3.5 text-slate-300" />
                      <span>Edit</span>
                    </Link>

                    <button
                      type="button"
                      onClick={() => onRequestDelete(p)}
                      className="p-2 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30 text-xs font-semibold flex items-center justify-center transition-colors cursor-pointer shrink-0"
                      title="Delete Product"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </>
                }
              />
            );
          })}
        </div>
      </div>

      {/* ============================================================== */}
      {/* 2. DESKTOP / TABLET DATA TABLE VIEW (Visible on screens >= 768px) */}
      {/* ============================================================== */}
      <div className="hidden md:block overflow-x-auto">
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
                        className="cursor-pointer hover:opacity-90 transition-opacity"
                      >
                        <ProductThumbnail src={p.imageUrl} alt={p.title} size="lg" />
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

                  {/* Stock */}
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
