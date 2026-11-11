'use client';

import React, { useState, useEffect } from 'react';
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
  CheckCircle2,
  ArrowUpRight,
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
  const [menuCoords, setMenuCoords] = useState<{ top: number; right: number; openUpward: boolean } | null>(null);

  const isAllSelected = products.length > 0 && selectedIds.length === products.length;

  // Auto-close floating dropdown on window scroll or resize
  useEffect(() => {
    const handleClose = () => {
      if (activeMenuId) {
        setActiveMenuId(null);
        setMenuCoords(null);
      }
    };
    window.addEventListener('scroll', handleClose, true);
    window.addEventListener('resize', handleClose);
    return () => {
      window.removeEventListener('scroll', handleClose, true);
      window.removeEventListener('resize', handleClose);
    };
  }, [activeMenuId]);

  const handleToggleMenu = (id: string, e: React.MouseEvent<HTMLButtonElement>) => {
    e.stopPropagation();
    if (activeMenuId === id) {
      setActiveMenuId(null);
      setMenuCoords(null);
      return;
    }
    const rect = e.currentTarget.getBoundingClientRect();
    const menuHeight = 240;
    const spaceBelow = window.innerHeight - rect.bottom;
    const openUpward = spaceBelow < menuHeight && rect.top > menuHeight;

    const top = openUpward ? rect.top - menuHeight - 6 : rect.bottom + 6;
    const right = Math.max(16, window.innerWidth - rect.right);

    setMenuCoords({ top, right, openUpward });
    setActiveMenuId(id);
  };

  const activeProduct = activeMenuId ? products.find((p) => p.id === activeMenuId) : null;

  return (
    <div className="rounded-xl border border-slate-200/80 dark:border-white/10 bg-white dark:bg-navy-900 overflow-hidden shadow-xs">
      {/* ============================================================== */}
      {/* 1. MOBILE RESPONSIVE CARDS VIEW (Visible on screens < 768px)  */}
      {/* ============================================================== */}
      <div className="block md:hidden">
        {/* Mobile "Select All" Bar */}
        <div className="p-3 bg-slate-50 dark:bg-navy-950/70 border-b border-slate-200 dark:border-white/10 flex items-center justify-between text-xs">
          <button
            type="button"
            onClick={onToggleSelectAll}
            className="flex items-center gap-2 text-slate-700 dark:text-slate-300 font-semibold hover:text-navy-900 dark:hover:text-white transition-colors cursor-pointer"
          >
            {isAllSelected ? (
              <CheckSquare className="h-4 w-4 text-emerald-500" />
            ) : (
              <Square className="h-4 w-4 text-slate-400" />
            )}
            <span>Select All ({products.length} products)</span>
          </button>

          {selectedIds.length > 0 && (
            <span className="text-[11px] font-mono text-emerald-600 dark:text-emerald-400 font-bold bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
              {selectedIds.length} selected
            </span>
          )}
        </div>

        {/* Mobile Product Cards List */}
        <div className="p-2 sm:p-3 space-y-2.5">
          {products.map((p) => {
            const isSelected = selectedIds.includes(p.id);
            const isPublished = p.status === 'PUBLISHED' || (!p.status && p.stock > 0);
            const isPendingApproval =
              !isPublished &&
              (!p.bin || p.bin === 'Pending Approval' || p.bin === 'Assigned on intake');
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
                        ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30'
                        : isPendingApproval
                        ? 'bg-amber-500/15 text-amber-600 dark:text-amber-300 border-amber-500/30'
                        : 'bg-slate-100 dark:bg-navy-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-white/10 hover:border-emerald-500'
                    }`}
                    title={
                      isPendingApproval
                        ? 'Awaiting Admin Approval'
                        : isPublished
                        ? 'Published (Click to Move to Draft)'
                        : 'Draft (Click to Publish)'
                    }
                  >
                    {isPublished
                      ? 'PUBLISHED'
                      : isPendingApproval
                      ? 'PENDING'
                      : 'DRAFT (Publish)'}
                  </button>
                }
                row1={
                  <div className="flex items-center gap-2 text-xs">
                    <span className="font-mono text-[11px] font-bold text-orange-600 dark:text-orange-400 bg-orange-500/10 px-1.5 py-0.5 rounded border border-orange-500/20">
                      {p.sku}
                    </span>
                    <span className="text-slate-400 text-[11px]">•</span>
                    <span className="text-slate-500 dark:text-slate-400 text-[11px] truncate">{p.category || 'Apparel'}</span>
                    <div className="ml-auto font-mono text-[10px] text-slate-500">
                      {p.bin && p.bin !== 'Pending Approval' ? (
                        <span className="px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
                          {p.bin}
                        </span>
                      ) : (
                        <span className="text-amber-600 dark:text-amber-400 font-medium">Pending Bin</span>
                      )}
                    </div>
                  </div>
                }
                row2={
                  <Link
                    href={`/merchant/products/${p.id}`}
                    onClick={(e) => e.stopPropagation()}
                    className="font-bold text-xs text-navy-900 dark:text-white hover:text-orange-600 dark:hover:text-orange-400 transition-colors line-clamp-1 block cursor-pointer"
                  >
                    {p.title}
                  </Link>
                }
                row3={
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-mono text-xs font-extrabold text-navy-900 dark:text-white">
                      ৳{p.price.toLocaleString()}
                    </span>
                    <span className="text-slate-400 text-[10px]">•</span>
                    {isOutOfStock ? (
                      <span className="text-[10px] font-bold text-rose-500 bg-rose-500/10 px-2 py-0.5 rounded border border-rose-500/20">
                        Out of stock
                      </span>
                    ) : isLowStock ? (
                      <span className="text-[10px] font-bold text-amber-500 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">
                        {p.stock} left (Low)
                      </span>
                    ) : (
                      <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                        {p.stock} in stock
                      </span>
                    )}
                  </div>
                }
                expandedContent={
                  <div className="space-y-2.5">
                    {/* Barcode & Stock breakdown */}
                    <div className="grid grid-cols-2 gap-2 text-[11px]">
                      <div className="p-2 rounded-lg bg-white dark:bg-navy-900 border border-slate-200 dark:border-white/10">
                        <span className="text-slate-500 text-[10px] uppercase font-semibold block">Barcode</span>
                        <span className="font-mono font-bold text-navy-900 dark:text-slate-200 block mt-0.5 truncate">{p.barcode}</span>
                      </div>
                      <div className="p-2 rounded-lg bg-white dark:bg-navy-900 border border-slate-200 dark:border-white/10">
                        <span className="text-slate-500 text-[10px] uppercase font-semibold block">Profit Margin</span>
                        <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400 block mt-0.5">
                          {p.profitMargin ?? 50}% (৳{p.profit ?? (p.price - (p.costPrice || p.price * 0.5))})
                        </span>
                      </div>
                    </div>
                  </div>
                }
                actions={
                  <>
                    {/* Re-Publish button for Drafts */}
                    {p.status === 'DRAFT' && (
                      <button
                        type="button"
                        onClick={() => onToggleStatus(p.id)}
                        className="flex-1 py-1.5 px-3 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center justify-center gap-1 transition-colors cursor-pointer shadow-sm"
                      >
                        <CheckCircle2 className="h-3.5 w-3.5" />
                        <span>Publish</span>
                      </button>
                    )}

                    <button
                      type="button"
                      onClick={() => onManageStock(p)}
                      className="flex-1 py-1.5 px-3 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-navy-800 dark:hover:bg-navy-700 text-navy-900 dark:text-white text-xs font-semibold flex items-center justify-center gap-1 transition-colors border border-slate-200 dark:border-white/10 cursor-pointer"
                    >
                      <Layers className="h-3.5 w-3.5 text-emerald-500" />
                      <span>Stock</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => onPrintBarcode(p)}
                      className="p-2 rounded-lg bg-indigo-600/10 hover:bg-indigo-600/20 text-indigo-600 dark:text-indigo-400 border border-indigo-500/30 transition-colors cursor-pointer"
                      title="Print Barcode"
                    >
                      <Printer className="h-3.5 w-3.5" />
                    </button>

                    <Link
                      href={`/merchant/products/${p.id}/edit`}
                      className="p-2 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-navy-800 dark:hover:bg-navy-700 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-white/10 transition-colors cursor-pointer"
                      title="Edit Product"
                    >
                      <Edit2 className="h-3.5 w-3.5" />
                    </Link>

                    <button
                      type="button"
                      onClick={() => onRequestDelete(p)}
                      className="p-2 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-500 border border-rose-500/30 transition-colors cursor-pointer"
                      title={p.status === 'DRAFT' ? 'Permanently Delete' : 'Move to Drafts'}
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
      {/* 2. DESKTOP EXPANDED DATA TABLE (Visible on screens >= 768px)  */}
      {/* ============================================================== */}
      <div className="hidden md:block overflow-x-auto">
        <table className="w-full min-w-[760px] text-left text-xs">
          <thead className="bg-slate-50 dark:bg-navy-950/70 border-b border-slate-200/80 dark:border-white/10 text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider">
            <tr>
              <th className="py-3 px-3.5 w-10 text-center">
                <button
                  type="button"
                  onClick={onToggleSelectAll}
                  className="text-slate-400 hover:text-navy-900 dark:hover:text-white transition-colors cursor-pointer"
                  title="Select All"
                >
                  {isAllSelected ? (
                    <CheckSquare className="h-4 w-4 text-emerald-500" />
                  ) : (
                    <Square className="h-4 w-4" />
                  )}
                </button>
              </th>
              <th className="py-3 px-3.5">Product & SKU</th>
              <th className="py-3 px-3.5">Bin Code</th>
              <th className="py-3 px-3.5">Warehouse Stock</th>
              <th className="py-3 px-3.5 text-right">Selling Price</th>
              <th className="py-3 px-3.5 text-center">Status</th>
              <th className="py-3 px-3.5 text-center">Actions</th>
            </tr>
          </thead>

          <tbody className="divide-y divide-slate-100 dark:divide-white/5">
            {products.map((p) => {
              const isSelected = selectedIds.includes(p.id);
              const isPublished = p.status === 'PUBLISHED' || (!p.status && p.stock > 0);
              const isPendingApproval =
                !isPublished &&
                (!p.bin || p.bin === 'Pending Approval' || p.bin === 'Assigned on intake');
              const isLowStock = p.stock <= 30 && p.stock > 0;
              const isOutOfStock = p.stock === 0;

              return (
                <tr
                  key={p.id}
                  className={`hover:bg-slate-50 dark:hover:bg-navy-800/40 transition-colors ${
                    isSelected ? 'bg-orange-500/5 dark:bg-orange-500/10' : ''
                  }`}
                >
                  {/* Select Checkbox */}
                  <td className="py-3.5 px-3.5 text-center">
                    <button
                      type="button"
                      onClick={() => onToggleSelect(p.id)}
                      className="text-slate-400 hover:text-navy-900 dark:hover:text-white transition-colors cursor-pointer"
                    >
                      {isSelected ? (
                        <CheckSquare className="h-4 w-4 text-emerald-500" />
                      ) : (
                        <Square className="h-4 w-4" />
                      )}
                    </button>
                  </td>

                  {/* Product Thumbnail, Title & SKU */}
                  <td className="py-3.5 px-3.5">
                    <div className="flex items-center gap-3">
                      <ProductThumbnail src={p.imageUrl} alt={p.title} size="md" />
                      <div className="min-w-0">
                        <Link
                          href={`/merchant/products/${p.id}`}
                          className="font-bold text-navy-900 dark:text-white hover:text-orange-600 dark:hover:text-orange-400 transition-colors block truncate max-w-xs cursor-pointer text-xs sm:text-sm"
                        >
                          {p.title}
                        </Link>
                        <div className="flex items-center gap-2 mt-0.5 font-mono text-[11px] text-slate-500 dark:text-slate-400">
                          <span className="font-bold text-orange-600 dark:text-orange-400">
                            {p.sku}
                          </span>
                          <span>•</span>
                          <span>Barcode: {p.barcode || 'N/A'}</span>
                        </div>
                      </div>
                    </div>
                  </td>

                  {/* Bin Location */}
                  <td className="py-3.5 px-3.5">
                    {p.bin && p.bin !== 'Pending Approval' ? (
                      <span className="font-mono text-xs font-bold text-amber-600 dark:text-amber-400 bg-amber-500/10 px-2.5 py-1 rounded-lg border border-amber-500/20">
                        {p.bin}
                      </span>
                    ) : (
                      <span className="text-[11px] text-amber-600 dark:text-amber-400 font-semibold italic">
                        Pending Bin Allocation
                      </span>
                    )}
                  </td>

                  {/* Warehouse Stock */}
                  <td className="py-3.5 px-3.5">
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-sm text-navy-900 dark:text-white">
                        {p.stock}
                      </span>
                      {isOutOfStock ? (
                        <span className="text-[10px] font-bold text-rose-500 bg-rose-500/10 px-1.5 py-0.5 rounded border border-rose-500/20">
                          Out of stock
                        </span>
                      ) : isLowStock ? (
                        <span className="text-[10px] font-bold text-amber-500 bg-amber-500/10 px-1.5 py-0.5 rounded border border-amber-500/20">
                          Low
                        </span>
                      ) : (
                        <span className="text-[10px] font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded border border-emerald-500/20">
                          In stock
                        </span>
                      )}
                    </div>
                  </td>

                  {/* Price */}
                  <td className="py-3.5 px-3.5 text-right font-mono font-bold text-navy-900 dark:text-white text-sm">
                    ৳{p.price.toLocaleString()}
                  </td>

                  {/* Status Toggle Badge */}
                  <td className="py-3.5 px-3.5 text-center">
                    <button
                      type="button"
                      onClick={() => onToggleStatus(p.id)}
                      className={`text-[11px] font-bold px-2.5 py-1 rounded-full border transition-all cursor-pointer ${
                        isPublished
                          ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30 hover:border-amber-500'
                          : isPendingApproval
                          ? 'bg-amber-500/15 text-amber-600 dark:text-amber-300 border-amber-500/30'
                          : 'bg-slate-100 dark:bg-navy-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-white/10 hover:border-emerald-500 hover:text-emerald-600'
                      }`}
                      title={
                        isPendingApproval
                          ? 'Awaiting Admin Approval'
                          : isPublished
                          ? 'Click to Move to Draft'
                          : 'Click to Publish Product'
                      }
                    >
                      {isPublished
                        ? 'PUBLISHED'
                        : isPendingApproval
                        ? 'PENDING'
                        : 'DRAFT'}
                    </button>
                  </td>

                  {/* Actions Column */}
                  <td className="py-3.5 px-3.5 text-center">
                    <div className="flex items-center justify-center gap-1.5">
                      {/* If Draft, show quick 1-click Publish button! */}
                      {p.status === 'DRAFT' && !isPendingApproval && (
                        <button
                          type="button"
                          onClick={() => onToggleStatus(p.id)}
                          className="px-2 py-1 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 text-[11px] font-bold transition-colors cursor-pointer flex items-center gap-1"
                          title="Publish this product back to store"
                        >
                          <CheckCircle2 className="h-3 w-3" />
                          <span>Publish</span>
                        </button>
                      )}

                      {/* Manage Stock Action */}
                      <button
                        type="button"
                        onClick={() => onManageStock(p)}
                        className="px-2 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-navy-800 dark:hover:bg-navy-700 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-white/10 text-[11px] font-semibold transition-colors cursor-pointer flex items-center gap-1"
                        title="Manage warehouse stock & inbound request"
                      >
                        <Layers className="h-3 w-3 text-emerald-500" />
                        <span>Stock</span>
                      </button>

                      {/* 3-dots Trigger Button */}
                      <button
                        type="button"
                        onClick={(e) => handleToggleMenu(p.id, e)}
                        className={`p-1.5 rounded-lg text-slate-400 hover:text-navy-900 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-navy-800 transition-colors cursor-pointer ${
                          activeMenuId === p.id ? 'bg-slate-100 dark:bg-navy-800 text-orange-600 dark:text-orange-400' : ''
                        }`}
                        aria-label="More actions"
                      >
                        <MoreVertical className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* ============================================================== */}
      {/* 3. VIEWPORT-AWARE FIXED FLOATING DROPDOWN (Zero-overflow clipping) */}
      {/* ============================================================== */}
      {activeMenuId && menuCoords && activeProduct && (
        <>
          <div
            className="fixed inset-0 z-50 bg-transparent"
            onClick={() => {
              setActiveMenuId(null);
              setMenuCoords(null);
            }}
          />
          <div
            style={{
              position: 'fixed',
              top: `${menuCoords.top}px`,
              right: `${menuCoords.right}px`,
              zIndex: 9999,
            }}
            className="w-52 rounded-2xl bg-white dark:bg-navy-900 border border-slate-200/90 dark:border-white/10 shadow-2xl py-1.5 animate-in fade-in zoom-in-95 text-left backdrop-blur-md"
            onClick={(e) => e.stopPropagation()}
          >
            <Link
              href={`/merchant/products/${activeProduct.id}`}
              onClick={() => {
                setActiveMenuId(null);
                setMenuCoords(null);
              }}
              className="w-full px-3.5 py-2 text-xs text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-navy-800 flex items-center gap-2 cursor-pointer transition-colors"
            >
              <Eye className="h-3.5 w-3.5 text-sky-500" />
              <span>View Product Details</span>
            </Link>

            {/* Publish or Move to Drafts button */}
            {activeProduct.status === 'DRAFT' ? (
              <button
                type="button"
                onClick={() => {
                  setActiveMenuId(null);
                  setMenuCoords(null);
                  onToggleStatus(activeProduct.id);
                }}
                className="w-full px-3.5 py-2 text-xs text-emerald-600 dark:text-emerald-400 hover:bg-slate-100 dark:hover:bg-navy-800 flex items-center gap-2 cursor-pointer transition-colors font-bold"
              >
                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
                <span>Publish to Store</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={() => {
                  setActiveMenuId(null);
                  setMenuCoords(null);
                  onToggleStatus(activeProduct.id);
                }}
                className="w-full px-3.5 py-2 text-xs text-amber-600 dark:text-amber-400 hover:bg-slate-100 dark:hover:bg-navy-800 flex items-center gap-2 cursor-pointer transition-colors"
              >
                <FileText className="h-3.5 w-3.5 text-amber-500" />
                <span>Move to Drafts</span>
              </button>
            )}

            <button
              type="button"
              onClick={() => {
                setActiveMenuId(null);
                setMenuCoords(null);
                onManageStock(activeProduct);
              }}
              className="w-full px-3.5 py-2 text-xs text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-navy-800 flex items-center gap-2 cursor-pointer transition-colors"
            >
              <Layers className="h-3.5 w-3.5 text-emerald-500" />
              <span>Manage Stock / Inbound</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setActiveMenuId(null);
                setMenuCoords(null);
                onPrintBarcode(activeProduct);
              }}
              className="w-full px-3.5 py-2 text-xs text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-navy-800 flex items-center gap-2 cursor-pointer transition-colors"
            >
              <Printer className="h-3.5 w-3.5 text-indigo-500" />
              <span>Print Thermal Sticker</span>
            </button>

            <Link
              href={`/merchant/products/${activeProduct.id}/edit`}
              onClick={() => {
                setActiveMenuId(null);
                setMenuCoords(null);
              }}
              className="w-full px-3.5 py-2 text-xs text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-navy-800 flex items-center gap-2 cursor-pointer transition-colors"
            >
              <Edit2 className="h-3.5 w-3.5 text-slate-400" />
              <span>Edit Product & Valuation</span>
            </Link>

            <div className="border-t border-slate-100 dark:border-white/10 my-1" />

            <button
              type="button"
              onClick={() => {
                setActiveMenuId(null);
                setMenuCoords(null);
                onRequestDelete(activeProduct);
              }}
              className="w-full px-3.5 py-2 text-xs text-rose-500 hover:bg-rose-500/10 flex items-center gap-2 cursor-pointer transition-colors"
            >
              <Trash2 className="h-3.5 w-3.5" />
              <span>
                {activeProduct.status === 'DRAFT'
                  ? 'Permanently Delete'
                  : 'Move to Drafts (Delete)'}
              </span>
            </button>
          </div>
        </>
      )}
    </div>
  );
}
