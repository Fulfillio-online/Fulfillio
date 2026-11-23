'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Printer,
  Edit2,
  Trash2,
  MoreVertical,
  Layers,
  FileText,
  Eye,
  CheckSquare,
  Square,
  CheckCircle2,
  Clock,
  RotateCcw,
} from 'lucide-react';
import { ProductTableProps } from '../types';
import { MerchantExpandableCard } from '../../components/common/MerchantExpandableCard';
import { ProductThumbnail } from './ProductThumbnail';
import { MerchantProductItem } from '../../types';

export const isPendingApprovalProductItem = (p: MerchantProductItem): boolean => {
  if (p.status === 'DRAFT') return false;
  if (p.status === 'APPROVED' || p.status === 'PUBLISHED' || p.status === 'STOCK_STORED') return false;
  return (
    p.status === 'PENDING_APPROVAL' ||
    !p.bin ||
    p.bin === 'Pending Approval' ||
    p.bin === 'Assigned on intake'
  );
};

/**
 * First-time product approval request:
 * Product is pending approval AND has 0 warehouse stock (has never been stored in warehouse yet).
 * Merchant CAN edit and CAN delete/cancel this product.
 */
export const isFirstTimePendingApprovalItem = (p: MerchantProductItem): boolean => {
  return isPendingApprovalProductItem(p) && p.stockAccepted !== true;
};

/**
 * Draft-to-Publish re-approval request:
 * Product already has physical stock stored in warehouse, was moved to Draft,
 * and merchant requested to publish it again (waiting for warehouse acceptance).
 */
export const isPublishPendingFromDraftItem = (p: MerchantProductItem): boolean => {
  return isPendingApprovalProductItem(p) && p.stockAccepted === true;
};

export const isApprovedAwaitingStockProductItem = (_p: MerchantProductItem): boolean => {
  return false;
};

export const isStockStoredProductItem = (p: MerchantProductItem): boolean => {
  if (p.status === 'DRAFT' || isPendingApprovalProductItem(p)) return false;
  return p.status === 'PUBLISHED' || p.status === 'STOCK_STORED' || p.status === 'APPROVED';
};

export function ProductTable({
  products,
  selectedIds,
  onToggleSelect,
  onToggleSelectAll,
  onToggleStatus,
  onManageStock,
  onViewDetails,
  onEditProduct,
  onRequestEdit,
  onPrintBarcode,
  onRequestDelete,
}: ProductTableProps) {
  const [activeMenuId, setActiveMenuId] = useState<string | null>(null);

  const isAllSelected = products.length > 0 && selectedIds.length === products.length;

  // Close dropdown on outside click (matching admin panel behavior)
  useEffect(() => {
    if (!activeMenuId) return;
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target.closest('[data-dropdown-container]')) {
        setActiveMenuId(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [activeMenuId]);

  const renderDropdownItems = (p: MerchantProductItem) => {
    const isDraft = p.status === 'DRAFT';
    const isPendingApproval = !isDraft && isPendingApprovalProductItem(p);
    const isAwaitingStock = isApprovedAwaitingStockProductItem(p);
    const isStockStored = isStockStoredProductItem(p);
    const isEditAllowed = (p as any).editState === 'EDIT_ALLOWED';
    const isEditPending = (p as any).editState === 'EDIT_APPROVAL_PENDING';
    const isEditAccessRequested = (p as any).editState === 'EDIT_ACCESS_REQUESTED';
    const isSuspended = Boolean((p as any).isSuspended);

    // DRAFT STAGE: Merchant can View, Edit Draft, Submit for Approval, Delete (stock = 0)
    if (isDraft) {
      return (
        <>
          <Link
            href={`/merchant/products/${p.id}`}
            onClick={() => setActiveMenuId(null)}
            className="w-full px-3.5 py-2 text-xs text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-navy-800 flex items-center gap-2 cursor-pointer transition-colors"
          >
            <Eye className="h-3.5 w-3.5 text-sky-500" />
            <span>View Product Details</span>
          </Link>

          <Link
            href={`/merchant/products/${p.id}/edit`}
            onClick={() => setActiveMenuId(null)}
            className="w-full px-3.5 py-2 text-xs text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-navy-800 flex items-center gap-2 cursor-pointer transition-colors font-semibold"
          >
            <Edit2 className="h-3.5 w-3.5 text-orange-500" />
            <span>Edit Draft</span>
          </Link>

          <button
            type="button"
            onClick={() => {
              setActiveMenuId(null);
              onToggleStatus(p.id);
            }}
            className="w-full px-3.5 py-2 text-xs text-emerald-600 dark:text-emerald-400 hover:bg-slate-100 dark:hover:bg-navy-800 flex items-center gap-2 cursor-pointer transition-colors font-semibold"
          >
            <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
            <span>Submit for Approval</span>
          </button>

          <div className="border-t border-slate-100 dark:border-white/10 my-1" />

          <button
            type="button"
            onClick={() => {
              setActiveMenuId(null);
              onRequestDelete(p);
            }}
            className="w-full px-3.5 py-2 text-xs text-rose-500 hover:bg-rose-500/10 flex items-center gap-2 cursor-pointer transition-colors font-bold"
          >
            <Trash2 className="h-3.5 w-3.5" />
            <span>Delete Product</span>
          </button>
        </>
      );
    }

    // STAGE 1: Pending Approval (Awaiting Admin review)
    // Merchant can: View Details, Edit (if stock === 0), Cancel Submission (moves to Draft), Delete (if stock === 0)
    if (isPendingApproval) {
      return (
        <>
          <Link
            href={`/merchant/products/${p.id}`}
            onClick={() => setActiveMenuId(null)}
            className="w-full px-3.5 py-2 text-xs text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-navy-800 flex items-center gap-2 cursor-pointer transition-colors"
          >
            <Eye className="h-3.5 w-3.5 text-sky-500" />
            <span>View Product Details</span>
          </Link>

          {p.stockAccepted !== true && (
            <Link
              href={`/merchant/products/${p.id}/edit`}
              onClick={() => setActiveMenuId(null)}
              className="w-full px-3.5 py-2 text-xs text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-navy-800 flex items-center gap-2 cursor-pointer transition-colors font-semibold"
            >
              <Edit2 className="h-3.5 w-3.5 text-orange-500" />
              <span>Edit Product</span>
            </Link>
          )}

          <button
            type="button"
            onClick={() => {
              setActiveMenuId(null);
              onToggleStatus(p.id);
            }}
            className="w-full px-3.5 py-2 text-xs text-amber-600 dark:text-amber-400 hover:bg-slate-100 dark:hover:bg-navy-800 flex items-center gap-2 cursor-pointer transition-colors font-semibold"
            title="Cancel submission and move product back to Draft"
          >
            <RotateCcw className="h-3.5 w-3.5 text-amber-500" />
            <span>Cancel Submission</span>
          </button>

          {p.stockAccepted !== true && (
            <>
              <div className="border-t border-slate-100 dark:border-white/10 my-1" />
              <button
                type="button"
                onClick={() => {
                  setActiveMenuId(null);
                  onRequestDelete(p);
                }}
                className="w-full px-3.5 py-2 text-xs text-rose-500 hover:bg-rose-500/10 flex items-center gap-2 cursor-pointer transition-colors font-bold"
              >
                <Trash2 className="h-3.5 w-3.5" />
                <span>Delete Product</span>
              </button>
            </>
          )}
        </>
      );
    }

    // STAGE 2: Awaiting Stock (Admin accepted product, waiting for physical stock to be received into warehouse)
    // Rule: Merchant can cancel request (moves to draft) and view product only.
    if (isAwaitingStock) {
      return (
        <>
          <Link
            href={`/merchant/products/${p.id}`}
            onClick={() => setActiveMenuId(null)}
            className="w-full px-3.5 py-2 text-xs text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-navy-800 flex items-center gap-2 cursor-pointer transition-colors font-medium"
          >
            <Eye className="h-3.5 w-3.5 text-sky-500" />
            <span>View Product Details</span>
          </Link>

          <button
            type="button"
            onClick={() => {
              setActiveMenuId(null);
              onToggleStatus(p.id);
            }}
            className="w-full px-3.5 py-2 text-xs text-amber-600 dark:text-amber-400 hover:bg-slate-100 dark:hover:bg-navy-800 flex items-center gap-2 cursor-pointer transition-colors font-semibold"
            title="Cancel warehouse stock intake and move product back to Draft"
          >
            <RotateCcw className="h-3.5 w-3.5 text-amber-500" />
            <span>Cancel Submission</span>
          </button>
        </>
      );
    }

    // STAGE 3: Stock Stored / Active in Warehouse
    // Actions: View product, print thermal sticker, send edit request / edit product, request to return, request for restock, delete (if stock = 0)
    return (
      <>
        {/* View Product Details */}
        <Link
          href={`/merchant/products/${p.id}`}
          onClick={() => setActiveMenuId(null)}
          className="w-full px-3.5 py-2 text-xs text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-navy-800 flex items-center gap-2 cursor-pointer transition-colors font-medium"
        >
          <Eye className="h-3.5 w-3.5 text-sky-500" />
          <span>View Product Details</span>
        </Link>

        {/* Print Thermal Barcode Sticker */}
        <button
          type="button"
          onClick={() => {
            setActiveMenuId(null);
            onPrintBarcode(p);
          }}
          className="w-full px-3.5 py-2 text-xs text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-navy-800 flex items-center gap-2 cursor-pointer transition-colors font-semibold"
        >
          <Printer className="h-3.5 w-3.5 text-indigo-500" />
          <span>Print Thermal Sticker</span>
        </button>

        {/* Edit Request / Edit Product Behavior */}
        {isEditAllowed ? (
          <Link
            href={`/merchant/products/${p.id}/edit`}
            onClick={() => setActiveMenuId(null)}
            className="w-full px-3.5 py-2 text-xs text-orange-600 dark:text-orange-400 hover:bg-orange-50 dark:hover:bg-navy-800 flex items-center gap-2 cursor-pointer transition-colors font-bold"
          >
            <Edit2 className="h-3.5 w-3.5 text-orange-500" />
            <span>Edit Product</span>
          </Link>
        ) : isEditPending ? (
          <div className="w-full px-3.5 py-1.5 text-[11px] text-indigo-600 dark:text-indigo-400 font-semibold flex items-center gap-2 bg-indigo-50/50 dark:bg-navy-950/60">
            <Clock className="h-3 w-3" />
            <span>Revision in QA Review</span>
          </div>
        ) : isEditAccessRequested ? (
          <div className="w-full px-3.5 py-1.5 text-[11px] text-amber-600 dark:text-amber-400 font-semibold flex items-center gap-2 bg-amber-50/50 dark:bg-navy-950/60">
            <Clock className="h-3 w-3" />
            <span>Edit Access Requested</span>
          </div>
        ) : !isSuspended ? (
          <button
            type="button"
            onClick={() => {
              setActiveMenuId(null);
              if (onRequestEdit) onRequestEdit(p);
            }}
            className="w-full px-3.5 py-2 text-xs text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-navy-800 flex items-center gap-2 cursor-pointer transition-colors font-semibold"
          >
            <Edit2 className="h-3.5 w-3.5 text-orange-500" />
            <span>Send Edit Request</span>
          </button>
        ) : null}

        <div className="border-t border-slate-100 dark:border-white/10 my-1" />

        {/* Delete Product (ONLY allowed when stock is 0) */}
        <button
          type="button"
          onClick={() => {
            if ((p.stock || 0) === 0) {
              setActiveMenuId(null);
              onRequestDelete(p);
            }
          }}
          disabled={(p.stock || 0) > 0}
          className={`w-full px-3.5 py-2 text-xs flex items-center gap-2 transition-colors ${
            (p.stock || 0) === 0
              ? 'text-rose-500 hover:bg-rose-500/10 cursor-pointer font-bold'
              : 'text-slate-400 dark:text-slate-500 cursor-not-allowed font-medium'
          }`}
          title={(p.stock || 0) > 0 ? `Cannot delete while warehouse holds ${p.stock} pcs` : 'Delete Product'}
        >
          <Trash2 className="h-3.5 w-3.5" />
          <span>
            {(p.stock || 0) > 0 ? `Delete Locked (${p.stock} in stock)` : 'Delete Product'}
          </span>
        </button>
      </>
    );
  };

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
            const isDraft = p.status === 'DRAFT';
            const isPendingApproval = !isDraft && isPendingApprovalProductItem(p);
            const isFirstTimePending = !isDraft && isFirstTimePendingApprovalItem(p);
            const isPublishPendingFromDraft = !isDraft && isPublishPendingFromDraftItem(p);
            const isAwaitingStock = isApprovedAwaitingStockProductItem(p);
            const isOutOfStock = isAwaitingStock;
            const isLowStock = !isPendingApproval && !isDraft && !isAwaitingStock && p.stock > 0 && p.stock <= 30;

            return (
              <MerchantExpandableCard
                key={p.id}
                isSelected={isSelected}
                onToggleSelect={() => onToggleSelect(p.id)}
                statusBadge={
                  <span
                    className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full border select-none ${
                      isPendingApproval
                        ? 'bg-amber-500/15 text-amber-700 dark:text-amber-300 border-amber-500/30'
                        : isDraft
                        ? 'bg-slate-100 dark:bg-navy-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-white/10'
                        : isAwaitingStock
                        ? 'bg-sky-500/15 text-sky-700 dark:text-sky-300 border-sky-500/30'
                        : 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-500/30'
                    }`}
                  >
                    {isPendingApproval
                      ? 'PENDING PRODUCT'
                      : isDraft
                      ? 'DRAFT'
                      : isAwaitingStock
                      ? 'WAITING FOR STOCK'
                      : 'PUBLISHED'}
                  </span>
                }
                row1={
                  <div className="flex items-center gap-2 text-xs">
                    <span className="font-mono text-[11px] font-bold text-orange-600 dark:text-orange-400 bg-orange-500/10 px-1.5 py-0.5 rounded border border-orange-500/20">
                      {p.sku}
                    </span>
                    <div className="ml-auto font-mono text-[10px]">
                      {isFirstTimePending ? (
                        <span className="px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 font-bold">
                          Pending Review
                        </span>
                      ) : p.bin && p.bin !== 'Pending Approval' && p.bin !== 'Assigned on intake' ? (
                        <span className="px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 font-bold">
                          {p.bin}
                        </span>
                      ) : (
                        <span className="text-slate-400">Unassigned</span>
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
                    <span className="text-slate-400 text-[11px]">•</span>
                    <div className="flex items-center gap-1.5 text-[11px]">
                      <span className="text-slate-400 font-medium">Stock:</span>
                      <span
                        className={`font-mono font-bold ${
                          isOutOfStock
                            ? 'text-rose-500'
                            : isLowStock
                            ? 'text-amber-600 dark:text-amber-400'
                            : 'text-navy-900 dark:text-white'
                        }`}
                      >
                        {p.stock}
                      </span>
                    </div>
                  </div>
                }
                expandedContent={
                  <div className="space-y-3 pt-1">
                    {/* Secondary details */}
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div className="p-2 rounded-lg bg-slate-50 dark:bg-navy-950 border border-slate-200/80 dark:border-white/10">
                        <span className="text-[10px] uppercase font-bold text-slate-400 block">Category</span>
                        <span className="text-xs text-slate-700 dark:text-slate-300 font-medium">{p.category || 'General'}</span>
                      </div>
                      <div className="p-2 rounded-lg bg-slate-50 dark:bg-navy-950 border border-slate-200/80 dark:border-white/10">
                        <span className="text-[10px] uppercase font-bold text-slate-400 block">Warehouse Bin</span>
                        <span className="font-mono text-xs text-amber-600 dark:text-amber-400 font-bold">
                          {isPendingApproval ? 'Pending Review' : p.bin || 'Unassigned'}
                        </span>
                      </div>
                    </div>

                    {/* Variant stock breakdown in mobile view */}
                    {p.variantsList && p.variantsList.length > 0 && (
                      <div className="p-2.5 rounded-lg bg-slate-50 dark:bg-navy-950 border border-slate-200/80 dark:border-white/10 space-y-1.5">
                        <div className="flex items-center justify-between text-[10px] uppercase font-bold text-slate-400">
                          <span>Stock Details by Variant</span>
                          <span className="text-orange-600 dark:text-orange-400 font-mono">Total: {p.stock} pcs</span>
                        </div>
                        <div className="flex flex-wrap gap-1.5">
                          {p.variantsList.map((v, i) => (
                            <span
                              key={i}
                              className="px-2 py-0.5 rounded bg-white dark:bg-navy-900 border border-slate-200 dark:border-white/10 text-[11px] font-mono flex items-center gap-1.5"
                            >
                              <span className="text-slate-600 dark:text-slate-300 font-semibold">
                                {v.color ? `${v.color}${v.size ? ` / ${v.size}` : ''}` : (v.size || `V${i + 1}`)}:
                              </span>
                              <span className={`font-bold ${v.stock > 0 ? 'text-orange-600 dark:text-orange-400' : 'text-rose-500'}`}>
                                {v.stock}
                              </span>
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Actions button for mobile */}
                    <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-200 dark:border-white/10">
                      <div
                        className="relative inline-flex items-center justify-end text-left"
                        data-dropdown-container
                      >
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setActiveMenuId(activeMenuId === `mobile-${p.id}` ? null : `mobile-${p.id}`);
                          }}
                          className="px-3.5 py-1.5 rounded-lg bg-slate-100 dark:bg-navy-800 hover:bg-slate-200 dark:hover:bg-navy-700 text-slate-700 dark:text-slate-200 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer border border-slate-200 dark:border-white/10"
                        >
                          <MoreVertical className="h-4 w-4" />
                          <span>Product Actions</span>
                        </button>

                        {activeMenuId === `mobile-${p.id}` && (
                          <div className="absolute right-0 top-0 -translate-y-full -mt-1.5 w-56 rounded-xl bg-white dark:bg-navy-900 border border-slate-200 dark:border-white/10 shadow-2xl py-1.5 z-[100] text-left font-sans text-xs pointer-events-auto">
                            {renderDropdownItems(p)}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                }
              />
            );
          })}
        </div>
      </div>

      {/* ============================================================== */}
      {/* 2. DESKTOP FULL DATA TABLE VIEW                                */}
      {/* ============================================================== */}
      <div className="hidden md:block overflow-x-auto min-h-[280px]">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-slate-200/80 dark:border-white/10 bg-slate-50/70 dark:bg-navy-950/60 text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider select-none">
              <th className="py-3 px-3.5 w-10 text-center">
                <input
                  type="checkbox"
                  checked={isAllSelected}
                  onChange={onToggleSelectAll}
                  aria-label="Select all products"
                  className="rounded border-slate-300 dark:border-white/20 bg-white dark:bg-navy-900 text-orange-600 focus:ring-orange-500/20 h-4 w-4 cursor-pointer"
                />
              </th>
              <th className="py-3 px-3.5">Product & SKU</th>
              <th className="py-3 px-3.5">Location / Bin</th>
              <th className="py-3 px-3.5 text-center">Warehouse Stock</th>
              <th className="py-3 px-3.5 text-right">Declare Price</th>
              <th className="py-3 px-3.5 text-center">Status</th>
              <th className="py-3 px-3.5 text-center w-20">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-white/5 text-xs text-slate-700 dark:text-slate-200">
            {products.map((p, idx) => {
              const isSelected = selectedIds.includes(p.id);
              const isMenuOpen = activeMenuId === `desktop-${p.id}`;
              const isNearBottom = products.length > 4 && idx >= products.length - 2;
              const isDraft = p.status === 'DRAFT';
              const isPendingApproval = !isDraft && isPendingApprovalProductItem(p);
              const isFirstTimePending = !isDraft && isFirstTimePendingApprovalItem(p);
              const isPublishPendingFromDraft = !isDraft && isPublishPendingFromDraftItem(p);
              const isAwaitingStock = false;
              const isSuspended = Boolean((p as any).isSuspended);
              const isOutOfStock = !isDraft && !isPendingApproval && (p.stock || 0) === 0;
              const isLowStock = !isPendingApproval && !isDraft && !isOutOfStock && p.stock > 0 && p.stock <= 30;

              return (
                <tr
                  key={p.id}
                  className={`hover:bg-slate-50/80 dark:hover:bg-navy-800/40 transition-colors ${
                    isSelected ? 'bg-orange-50/30 dark:bg-orange-950/15' : ''
                  }`}
                >
                  {/* Select Checkbox */}
                  <td className="py-3.5 px-3.5 text-center">
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => onToggleSelect(p.id)}
                      aria-label={`Select ${p.title}`}
                      className="rounded border-slate-300 dark:border-white/20 bg-white dark:bg-navy-900 text-orange-600 focus:ring-orange-500/20 h-4 w-4 cursor-pointer"
                    />
                  </td>

                  {/* Product Title, Image & SKU */}
                  <td className="py-3.5 px-3.5">
                    <div className="flex items-center gap-3">
                      <ProductThumbnail
                        src={p.imageUrl}
                        alt={p.title}
                        size="md"
                        className="rounded-lg border border-slate-200 dark:border-white/10 shrink-0"
                      />
                      <div className="min-w-0">
                        <Link
                          href={`/merchant/products/${p.id}`}
                          className="font-bold text-navy-900 dark:text-white hover:text-orange-600 dark:hover:text-orange-400 transition-colors truncate block max-w-xs cursor-pointer"
                          title={p.title}
                        >
                          {p.title}
                        </Link>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className="font-mono text-[11px] font-semibold text-orange-600 dark:text-orange-400 bg-orange-500/10 px-1.5 py-0.5 rounded border border-orange-500/20">
                            {p.sku}
                          </span>
                        </div>
                      </div>
                    </div>
                  </td>

                  {/* Warehouse Bin Location: First-time pending shows Pending Admin Review; Draft-to-Publish pending keeps its assigned bin */}
                  <td className="py-3.5 px-3.5">
                    {isFirstTimePending ? (
                      <span className="inline-flex items-center gap-1.5 font-mono text-[10px] font-bold text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-500/10 px-2.5 py-1 rounded-full border border-amber-300 dark:border-amber-500/20">
                        <Clock className="h-3 w-3 text-amber-500" />
                        <span>Pending Admin Review</span>
                      </span>
                    ) : p.bin && p.bin !== 'Pending Approval' && p.bin !== 'Assigned on intake' ? (
                      <span className="font-mono text-[11px] font-bold text-amber-600 dark:text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">
                        {p.bin}
                      </span>
                    ) : isPublishPendingFromDraft ? (
                      <span className="inline-flex items-center gap-1.5 font-mono text-[10px] font-bold text-indigo-700 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-500/10 px-2.5 py-1 rounded-full border border-indigo-300 dark:border-indigo-500/20">
                        <Clock className="h-3 w-3 text-indigo-500" />
                        <span>Warehouse Stored</span>
                      </span>
                    ) : (
                      <span className="text-[11px] text-slate-400 font-medium">Unassigned</span>
                    )}
                  </td>

                  {/* Warehouse Stock Units: ONLY the stock number, colored by status */}
                  <td className="py-3.5 px-3.5 text-center font-mono">
                    <span
                      className={`font-extrabold text-sm ${
                        isOutOfStock
                          ? 'text-rose-500'
                          : isLowStock
                          ? 'text-amber-600 dark:text-amber-400'
                          : 'text-navy-900 dark:text-white'
                      }`}
                    >
                      {p.stock}
                    </span>
                    {p.variantsList && p.variantsList.length > 0 && (
                      <span className="block text-[10px] text-slate-400 font-normal mt-0.5">
                        {p.variantsList.length} variants
                      </span>
                    )}
                  </td>

                  {/* Price */}
                  <td className="py-3.5 px-3.5 text-right font-mono font-bold text-navy-900 dark:text-white text-sm">
                    ৳{p.price.toLocaleString()}
                  </td>

                  {/* Status Column: PURE INFORMATIVE TEXT BADGE (NOT a button!) */}
                  <td className="py-3.5 px-3.5 text-center">
                    <span
                      className={`inline-flex items-center justify-center text-[11px] uppercase font-bold tracking-wider px-2.5 py-1 rounded-full border select-none mx-auto ${
                        isPendingApproval
                          ? 'bg-amber-500/15 text-amber-700 dark:text-amber-300 border-amber-500/30'
                          : isDraft
                          ? 'bg-slate-100 dark:bg-navy-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-white/10'
                          : isSuspended
                          ? 'bg-rose-500/15 text-rose-700 dark:text-rose-300 border-rose-500/30'
                          : isOutOfStock
                          ? 'bg-rose-500/15 text-rose-700 dark:text-rose-300 border-rose-500/30'
                          : 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-500/30'
                      }`}
                    >
                      {isPendingApproval
                        ? 'Pending Product'
                        : isDraft
                        ? 'Draft'
                        : isSuspended
                        ? 'Suspended'
                        : isOutOfStock
                        ? 'Out of Stock'
                        : 'Published'}
                    </span>
                  </td>

                  {/* Actions Column: ONLY the clean 3-dots trigger button! */}
                  <td className="py-3.5 px-3.5 text-center">
                    <div
                      className="relative inline-flex items-center justify-center text-left"
                      data-dropdown-container
                    >
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setActiveMenuId(isMenuOpen ? null : `desktop-${p.id}`);
                        }}
                        className={`p-2 rounded-xl text-slate-500 hover:text-navy-900 dark:text-slate-400 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-navy-800 transition-colors cursor-pointer border border-transparent hover:border-slate-200 dark:hover:border-white/10 ${
                          isMenuOpen ? 'bg-slate-100 dark:bg-navy-800 text-orange-600 dark:text-orange-400 border-slate-200 dark:border-white/10' : ''
                        }`}
                        aria-label="Actions menu"
                        title="Actions"
                      >
                        <MoreVertical className="h-4 w-4" />
                      </button>

                      {isMenuOpen && (
                        <div
                          className={`absolute right-0 ${
                            isNearBottom
                              ? 'top-0 -translate-y-full -mt-1.5'
                              : 'top-full mt-1.5'
                          } w-56 rounded-xl bg-white dark:bg-navy-900 border border-slate-200 dark:border-white/10 shadow-2xl py-1.5 z-[100] text-left font-sans text-xs pointer-events-auto`}
                        >
                          {renderDropdownItems(p)}
                        </div>
                      )}
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
