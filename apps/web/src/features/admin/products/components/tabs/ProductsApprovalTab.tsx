'use client';

import React, { useState, useMemo, useEffect } from 'react';
import {
  Sparkles,
  Layers,
  CheckCircle2,
  Clock,
  Check,
  XCircle,
  Store,
  Eye,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Search,
} from 'lucide-react';
import { WarehouseBin, WarehouseProductItem } from '../../types';
import { Modal } from '@/components/ui/Modal';

interface ProductsApprovalTabProps {
  products: WarehouseProductItem[];
  bins: WarehouseBin[];
  onOpenApprovalModal: (
    mode: 'APPROVE' | 'REJECT',
    product: WarehouseProductItem,
    selectedBin: string
  ) => void;
  onSwitchToAllTab: () => void;
}

export function ProductsApprovalTab({
  products,
  bins,
  onOpenApprovalModal,
  onSwitchToAllTab,
}: ProductsApprovalTabProps) {
  const pendingProducts = useMemo(
    () => products.filter((p) => p.status === 'PENDING_APPROVAL'),
    [products]
  );

  // Search & Filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [merchantFilter, setMerchantFilter] = useState('ALL');

  // Pagination & Rows limit
  const [pageSize, setPageSize] = useState<number>(10);
  const [currentPage, setCurrentPage] = useState<number>(1);

  // Actions Dropdown state
  const [activeMenuId, setActiveMenuId] = useState<string | null>(null);

  // Mobile Accordion expanded items
  const [expandedItemIds, setExpandedItemIds] = useState<Set<string>>(new Set());

  // Viewing Product Modal
  const [viewingProduct, setViewingProduct] = useState<WarehouseProductItem | null>(null);

  // Selected bin per product
  const [pendingBinSelection, setPendingBinSelection] = useState<Record<string, string>>({
    'PRD-2001': 'A-02-01',
    'PRD-2002': 'B-01-03',
    'PRD-2003': 'C-01-02',
    'PRD-2004': 'D-01-01',
  });

  // Close dropdown on outside click
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

  // Unique merchants for filter
  const merchantsList = useMemo(() => {
    const map = new Map<string, string>();
    products.forEach((p) => {
      if (p.merchantCode && p.merchantName) {
        map.set(p.merchantCode, p.merchantName);
      }
    });
    return Array.from(map.entries()).map(([code, name]) => ({ code, name }));
  }, [products]);

  // Filtered products
  const filteredProducts = useMemo(() => {
    return pendingProducts.filter((item) => {
      const q = searchQuery.trim().toLowerCase();
      const matchSearch =
        !q ||
        item.title.toLowerCase().includes(q) ||
        item.fullSku.toLowerCase().includes(q) ||
        item.merchantName.toLowerCase().includes(q) ||
        item.merchantCode.toLowerCase().includes(q);
      const matchMerchant = merchantFilter === 'ALL' || item.merchantCode === merchantFilter;
      return matchSearch && matchMerchant;
    });
  }, [pendingProducts, searchQuery, merchantFilter]);

  // Pagination calculation
  const totalItems = filteredProducts.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  const safePage = Math.min(Math.max(1, currentPage), totalPages);
  const startIndex = (safePage - 1) * pageSize;
  const paginatedProducts = filteredProducts.slice(startIndex, startIndex + pageSize);

  const toggleExpand = (id: string) => {
    setExpandedItemIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setCurrentPage(newPage);
      setActiveMenuId(null);
    }
  };

  const handlePageSizeChange = (newSize: number) => {
    setPageSize(newSize);
    setCurrentPage(1);
    setActiveMenuId(null);
  };

  return (
    <div className="space-y-4">
      {/* Top Banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 shadow-md">
        <div>
          <h3 className="text-base font-bold text-white flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-amber-400" />
            <span>Inbound Merchant Product Submissions Awaiting Bin Assignment</span>
          </h3>
          <p className="text-xs sm:text-sm text-slate-400 mt-0.5">
            Review inbound product submissions, assign warehouse storage bins, and approve into active catalog.
          </p>
        </div>
        <div className="text-xs text-slate-400 flex items-center gap-1.5 self-start sm:self-auto bg-slate-950 px-3 py-1.5 rounded-xl border border-slate-800">
          <Layers className="w-3.5 h-3.5 text-emerald-400" />
          <span>Bins can be configured from <strong>Warehouse Bins</strong> tab</span>
        </div>
      </div>

      {/* Filter & Controls Bar */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 shadow-md">
        {/* Search Input */}
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3.5 top-3 w-4 h-4 text-slate-400 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setCurrentPage(1);
            }}
            placeholder="Search by title, SKU, or merchant..."
            className="w-full pl-10 pr-4 py-2 bg-slate-950 border border-slate-800 focus:border-emerald-500 rounded-xl text-xs sm:text-sm text-slate-200 placeholder-slate-500 focus:outline-none transition-colors"
          />
        </div>

        {/* Merchant Filter & Per-Page Controls */}
        <div className="flex flex-wrap items-center gap-2 sm:gap-3">
          <select
            value={merchantFilter}
            onChange={(e) => {
              setMerchantFilter(e.target.value);
              setCurrentPage(1);
            }}
            aria-label="Filter by Merchant"
            className="px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs font-medium text-slate-200 focus:outline-none focus:border-emerald-500 cursor-pointer"
          >
            <option value="ALL">All Merchants</option>
            {merchantsList.map((m) => (
              <option key={m.code} value={m.code}>
                {m.code} — {m.name}
              </option>
            ))}
          </select>

          {/* Rows Limit Selector */}
          <div className="flex items-center gap-1.5 bg-slate-950 border border-slate-800 rounded-xl px-2.5 py-1.5">
            <span className="text-[11px] font-semibold text-slate-400 whitespace-nowrap">Show:</span>
            <select
              value={pageSize}
              onChange={(e) => handlePageSizeChange(Number(e.target.value))}
              aria-label="Items per page"
              className="bg-transparent text-xs font-bold text-emerald-400 focus:outline-none cursor-pointer"
            >
              <option value={10} className="bg-slate-950 text-slate-200">10</option>
              <option value={25} className="bg-slate-950 text-slate-200">25</option>
              <option value={50} className="bg-slate-950 text-slate-200">50</option>
            </select>
            <span className="text-[11px] text-slate-500">rows</span>
          </div>
        </div>
      </div>

      {pendingProducts.length === 0 ? (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-12 text-center space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 flex items-center justify-center mx-auto">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <h4 className="text-base font-bold text-white">
            All Merchant Product Submissions Approved!
          </h4>
          <p className="text-xs sm:text-sm text-slate-400 max-w-md mx-auto">
            Every pending product has been assigned a warehouse storage bin and moved into the active catalog.
          </p>
          <button
            type="button"
            onClick={onSwitchToAllTab}
            className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold cursor-pointer"
          >
            View All Approved Products
          </button>
        </div>
      ) : filteredProducts.length === 0 ? (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-8 text-center text-slate-400 text-sm">
          No pending products match your search or filter.
        </div>
      ) : (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
          {/* 1. Mobile Accordion Card View (Visible on < md) */}
          <div className="block md:hidden p-3 space-y-2.5">
            {paginatedProducts.map((item) => {
              const chosenBin =
                pendingBinSelection[item.id] || item.binCode || bins[0]?.code || 'A-01-02';
              const isExpanded = expandedItemIds.has(item.id);
              const isMenuOpen = activeMenuId === `mobile-${item.id}`;

              return (
                <div
                  key={item.id}
                  className="rounded-xl border border-slate-800 bg-slate-950/70 p-3.5 space-y-2.5 transition-all shadow-sm"
                >
                  {/* Row 1: Product Thumbnail + Title + Status + Accordion Toggle */}
                  <div className="flex items-center justify-between gap-2.5">
                    <div
                      className="flex items-center gap-2.5 min-w-0 flex-1 cursor-pointer"
                      onClick={() => toggleExpand(item.id)}
                    >
                      <img
                        src={item.imageUrl}
                        alt={item.title}
                        className="w-10 h-10 rounded-lg object-cover border border-slate-800 shrink-0 bg-slate-900"
                      />
                      <div className="min-w-0 flex-1">
                        <div className="text-sm font-bold text-white truncate">{item.title}</div>
                        <div className="text-[11px] text-slate-400 flex items-center gap-1.5">
                          <span>{item.category}</span>
                          <span>·</span>
                          <span className="text-emerald-400 font-mono font-semibold">{item.fullSku}</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-amber-500/15 text-amber-300 border border-amber-500/30">
                        Pending
                      </span>
                      <button
                        type="button"
                        onClick={() => toggleExpand(item.id)}
                        className="p-1 rounded-lg text-slate-400 hover:text-white"
                        aria-label="Toggle details"
                      >
                        <ChevronDown
                          className={`w-4 h-4 transition-transform duration-200 ${
                            isExpanded ? 'rotate-180 text-emerald-400' : ''
                          }`}
                        />
                      </button>
                    </div>
                  </div>

                  {/* Row 2: Merchant Info & Stock */}
                  <div className="flex items-center justify-between text-xs pt-1 border-t border-slate-900">
                    <div className="flex items-center gap-1 text-slate-300">
                      <Store className="w-3.5 h-3.5 text-slate-500" />
                      <span>{item.merchantName}</span>
                      <span className="text-emerald-400 font-mono font-bold">({item.merchantCode})</span>
                    </div>
                    <div className="text-cyan-300 font-mono font-bold">
                      {item.stock} <span className="text-[10px] font-normal text-slate-400">units</span>
                    </div>
                  </div>

                  {/* Row 3: Target Bin & Actions Dropdown */}
                  <div className="flex items-center justify-between pt-1 border-t border-slate-900 gap-2">
                    <div className="flex items-center gap-1.5">
                      <span className="text-[11px] text-slate-400 font-medium">Bin:</span>
                      <select
                        value={chosenBin}
                        onChange={(e) =>
                          setPendingBinSelection((prev) => ({
                            ...prev,
                            [item.id]: e.target.value,
                          }))
                        }
                        className="px-2 py-1 rounded-lg bg-slate-900 border border-slate-700 text-xs font-mono font-bold text-emerald-300 focus:outline-none"
                      >
                        {bins.map((b) => (
                          <option key={b.code} value={b.code}>
                            {b.code}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Actions Dropdown */}
                    <div className="relative inline-block" data-dropdown-container>
                      <button
                        type="button"
                        onClick={() =>
                          setActiveMenuId(isMenuOpen ? null : `mobile-${item.id}`)
                        }
                        className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-bold text-slate-200 border border-slate-700 flex items-center gap-1.5 transition-colors cursor-pointer"
                      >
                        <span>Actions</span>
                        <ChevronDown
                          className={`w-3.5 h-3.5 transition-transform duration-200 ${
                            isMenuOpen ? 'rotate-180 text-emerald-400' : 'text-slate-400'
                          }`}
                        />
                      </button>

                      {isMenuOpen && (
                        <div className="absolute right-0 bottom-full mb-1.5 w-48 rounded-xl bg-slate-900 border border-slate-800 shadow-2xl py-1.5 z-50 text-left text-xs">
                          <button
                            type="button"
                            onClick={() => {
                              setActiveMenuId(null);
                              setViewingProduct(item);
                            }}
                            className="w-full px-3 py-2 text-left text-slate-200 hover:bg-slate-800 flex items-center gap-2 transition-colors cursor-pointer"
                          >
                            <Eye className="w-4 h-4 text-emerald-400" />
                            <span>View Details</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setActiveMenuId(null);
                              onOpenApprovalModal('APPROVE', item, chosenBin);
                            }}
                            className="w-full px-3 py-2 text-left text-emerald-300 hover:bg-emerald-950/40 font-semibold flex items-center gap-2 transition-colors cursor-pointer"
                          >
                            <Check className="w-4 h-4 text-emerald-400" />
                            <span>Approve &amp; Assign Bin</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setActiveMenuId(null);
                              onOpenApprovalModal('REJECT', item, chosenBin);
                            }}
                            className="w-full px-3 py-2 text-left text-rose-300 hover:bg-rose-950/40 flex items-center gap-2 transition-colors cursor-pointer"
                          >
                            <XCircle className="w-4 h-4 text-rose-400" />
                            <span>Reject / QC Fail</span>
                          </button>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Expanded Accordion Details */}
                  {isExpanded && (
                    <div className="pt-2 border-t border-slate-800/80 space-y-2 text-xs text-slate-300">
                      <div className="grid grid-cols-2 gap-2 bg-slate-900/60 p-2.5 rounded-lg border border-slate-800/60">
                        <div>
                          <div className="text-[10px] text-slate-500 font-semibold uppercase">Variant</div>
                          <div className="font-medium text-slate-200">{item.color} · {item.size}</div>
                        </div>
                        <div>
                          <div className="text-[10px] text-slate-500 font-semibold uppercase">Price</div>
                          <div className="font-mono font-bold text-white">৳{item.price.toLocaleString()}</div>
                        </div>
                        <div className="col-span-2">
                          <div className="text-[10px] text-slate-500 font-semibold uppercase">Submitted</div>
                          <div className="text-slate-400">{item.submittedAt}</div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* 2. Desktop Full Table View (Visible on md and larger) */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-800 bg-slate-950/70 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                  <th className="py-3.5 pl-5 pr-3">Product</th>
                  <th className="py-3.5 px-3">Merchant</th>
                  <th className="py-3.5 px-3">SKU &amp; Variant</th>
                  <th className="py-3.5 px-3">Received Qty &amp; Price</th>
                  <th className="py-3.5 px-3">Target Bin</th>
                  <th className="py-3.5 px-3">Submitted</th>
                  <th className="py-3.5 pl-3 pr-5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 text-xs">
                {paginatedProducts.map((item) => {
                  const chosenBin =
                    pendingBinSelection[item.id] || item.binCode || bins[0]?.code || 'A-01-02';
                  const isMenuOpen = activeMenuId === `desktop-${item.id}`;

                  return (
                    <tr
                      key={item.id}
                      className="hover:bg-slate-800/40 transition-colors group"
                    >
                      {/* Product Thumbnail & Title */}
                      <td className="py-3 pl-5 pr-3">
                        <div className="flex items-center gap-3">
                          <img
                            src={item.imageUrl}
                            alt={item.title}
                            className="w-11 h-11 rounded-xl object-cover border border-slate-800 bg-slate-950 shrink-0"
                          />
                          <div className="min-w-0 max-w-[220px]">
                            <div
                              className="text-sm font-bold text-white truncate cursor-pointer hover:text-emerald-400 transition-colors"
                              title={item.title}
                              onClick={() => setViewingProduct(item)}
                            >
                              {item.title}
                            </div>
                            <div className="text-[11px] text-slate-400 flex items-center gap-1.5 mt-0.5">
                              <span className="px-1.5 py-0.2 rounded bg-slate-950 border border-slate-800 text-[10px] font-medium text-slate-300">
                                {item.category}
                              </span>
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Merchant */}
                      <td className="py-3 px-3">
                        <div className="font-semibold text-slate-200">{item.merchantName}</div>
                        <div className="font-mono text-[11px] font-bold text-emerald-400">
                          {item.merchantCode}
                        </div>
                      </td>

                      {/* SKU & Variant */}
                      <td className="py-3 px-3">
                        <div className="font-mono font-bold text-emerald-400 text-xs" title={item.fullSku}>
                          {item.fullSku}
                        </div>
                        <div className="text-[11px] text-slate-400 mt-0.5">
                          {item.color} · {item.size}
                        </div>
                      </td>

                      {/* Received Qty & Price */}
                      <td className="py-3 px-3">
                        <div className="font-mono font-bold text-cyan-300 text-xs">
                          {item.stock} <span className="text-[10px] font-normal text-slate-400">units</span>
                        </div>
                        <div className="font-mono text-[11px] text-slate-300 mt-0.5">
                          ৳{item.price.toLocaleString()}
                        </div>
                      </td>

                      {/* Target Bin Assignment */}
                      <td className="py-3 px-3">
                        <select
                          value={chosenBin}
                          onChange={(e) =>
                            setPendingBinSelection((prev) => ({
                              ...prev,
                              [item.id]: e.target.value,
                            }))
                          }
                          aria-label={`Select Bin for ${item.title}`}
                          className="px-2.5 py-1.5 rounded-lg bg-slate-950 border border-slate-800 hover:border-slate-700 text-xs font-mono font-bold text-emerald-300 focus:outline-none focus:border-emerald-500 cursor-pointer shadow-inner"
                        >
                          {bins.map((b) => (
                            <option key={b.code} value={b.code}>
                              {b.code} ({b.zone})
                            </option>
                          ))}
                        </select>
                      </td>

                      {/* Submitted At */}
                      <td className="py-3 px-3 whitespace-nowrap text-slate-400 text-xs">
                        <div className="flex items-center gap-1.5">
                          <Clock className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                          <span>{item.submittedAt}</span>
                        </div>
                      </td>

                      {/* Actions Single Dropdown */}
                      <td className="py-3 pl-3 pr-5 text-right">
                        <div className="relative inline-block text-left" data-dropdown-container>
                          <button
                            type="button"
                            onClick={() =>
                              setActiveMenuId(isMenuOpen ? null : `desktop-${item.id}`)
                            }
                            className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-bold text-slate-200 border border-slate-700 flex items-center gap-1.5 transition-colors cursor-pointer shadow-sm"
                          >
                            <span>Actions</span>
                            <ChevronDown
                              className={`w-3.5 h-3.5 transition-transform duration-200 ${
                                isMenuOpen ? 'rotate-180 text-emerald-400' : 'text-slate-400'
                              }`}
                            />
                          </button>

                          {isMenuOpen && (
                            <div className="absolute right-0 mt-1.5 w-52 rounded-xl bg-slate-900 border border-slate-800 shadow-2xl py-1.5 z-50 text-left font-sans text-xs">
                              {/* 1. View Details */}
                              <button
                                type="button"
                                onClick={() => {
                                  setActiveMenuId(null);
                                  setViewingProduct(item);
                                }}
                                className="w-full px-3.5 py-2 text-left text-slate-200 hover:bg-slate-800 flex items-center gap-2.5 transition-colors cursor-pointer"
                              >
                                <Eye className="w-4 h-4 text-emerald-400" />
                                <span>View Details</span>
                              </button>

                              {/* 2. Approve & Assign Bin */}
                              <button
                                type="button"
                                onClick={() => {
                                  setActiveMenuId(null);
                                  onOpenApprovalModal('APPROVE', item, chosenBin);
                                }}
                                className="w-full px-3.5 py-2 text-left text-emerald-300 hover:bg-emerald-950/40 font-semibold flex items-center gap-2.5 transition-colors cursor-pointer"
                              >
                                <Check className="w-4 h-4 text-emerald-400" />
                                <span>Approve &amp; Assign Bin</span>
                              </button>

                              {/* 3. Reject */}
                              <button
                                type="button"
                                onClick={() => {
                                  setActiveMenuId(null);
                                  onOpenApprovalModal('REJECT', item, chosenBin);
                                }}
                                className="w-full px-3.5 py-2 text-left text-rose-300 hover:bg-rose-950/40 flex items-center gap-2.5 transition-colors cursor-pointer border-t border-slate-800/80"
                              >
                                <XCircle className="w-4 h-4 text-rose-400" />
                                <span>Reject / QC Fail</span>
                              </button>
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

          {/* 3. Pagination Footer */}
          <div className="p-4 border-t border-slate-800 bg-slate-950/60 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-400">
            <div>
              Showing <strong className="text-white">{totalItems === 0 ? 0 : startIndex + 1}</strong> to{' '}
              <strong className="text-white">
                {Math.min(startIndex + pageSize, totalItems)}
              </strong>{' '}
              of <strong className="text-white">{totalItems}</strong> pending submissions
            </div>

            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => handlePageChange(safePage - 1)}
                disabled={safePage <= 1}
                className="p-1.5 rounded-lg border border-slate-800 bg-slate-900 text-slate-300 hover:text-white disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer transition-colors"
                aria-label="Previous Page"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>

              {Array.from({ length: totalPages }, (_, i) => i + 1).map((pageNum) => (
                <button
                  key={pageNum}
                  type="button"
                  onClick={() => handlePageChange(pageNum)}
                  className={`w-7 h-7 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                    pageNum === safePage
                      ? 'bg-emerald-600 text-white shadow-sm'
                      : 'bg-slate-900 border border-slate-800 text-slate-300 hover:text-white'
                  }`}
                >
                  {pageNum}
                </button>
              ))}

              <button
                type="button"
                onClick={() => handlePageChange(safePage + 1)}
                disabled={safePage >= totalPages}
                className="p-1.5 rounded-lg border border-slate-800 bg-slate-900 text-slate-300 hover:text-white disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer transition-colors"
                aria-label="Next Page"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Product Submission Details Modal */}
      {viewingProduct && (
        <Modal
          isOpen={!!viewingProduct}
          onClose={() => setViewingProduct(null)}
          title="Product Submission Details"
          subtitle={`Inbound review for SKU: ${viewingProduct.fullSku}`}
          size="lg"
        >
          <div className="space-y-4">
            {/* Product Overview Header */}
            <div className="flex flex-col sm:flex-row items-start gap-4 p-4 rounded-2xl bg-slate-950 border border-slate-800">
              <img
                src={viewingProduct.imageUrl}
                alt={viewingProduct.title}
                className="w-full sm:w-36 h-36 rounded-xl object-cover border border-slate-800 shrink-0 bg-slate-900"
              />
              <div className="space-y-2 flex-1 min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wider bg-amber-500/15 text-amber-300 border border-amber-500/30">
                    Pending Approval
                  </span>
                  <span className="px-2 py-0.5 rounded-md text-[11px] font-bold uppercase tracking-wider bg-slate-900 text-slate-300 border border-slate-800">
                    {viewingProduct.category}
                  </span>
                  <span className="text-xs text-slate-400 flex items-center gap-1 sm:ml-auto">
                    <Clock className="w-3.5 h-3.5 text-slate-500" />
                    Submitted {viewingProduct.submittedAt}
                  </span>
                </div>
                <h3 className="text-base font-bold text-white leading-snug">
                  {viewingProduct.title}
                </h3>
                <div className="flex items-center gap-2 text-xs text-slate-300">
                  <Store className="w-3.5 h-3.5 text-slate-400" />
                  <span>Merchant: <strong className="text-white">{viewingProduct.merchantName}</strong> ({viewingProduct.merchantCode})</span>
                </div>
              </div>
            </div>

            {/* Specifications Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
                <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Full SKU</div>
                <div className="text-xs font-mono font-bold text-emerald-400 truncate mt-1">
                  {viewingProduct.fullSku}
                </div>
              </div>
              <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
                <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Variant</div>
                <div className="text-xs font-medium text-slate-200 truncate mt-1">
                  {viewingProduct.color} · {viewingProduct.size}
                </div>
              </div>
              <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
                <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Unit Price</div>
                <div className="text-xs font-mono font-bold text-white mt-1">
                  ৳{viewingProduct.price.toLocaleString()}
                </div>
              </div>
              <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
                <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Received Stock</div>
                <div className="text-xs font-mono font-bold text-cyan-300 mt-1">
                  {viewingProduct.stock} pcs
                </div>
              </div>
            </div>

            {/* Assign Target Bin */}
            <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
                  <Layers className="w-4 h-4 text-emerald-400" />
                  <span>Assign Target Storage Bin</span>
                </label>
                <p className="text-xs text-slate-400 mt-0.5">Physical location where this inventory will be shelved</p>
              </div>
              <select
                value={pendingBinSelection[viewingProduct.id] || viewingProduct.binCode || bins[0]?.code}
                onChange={(e) =>
                  setPendingBinSelection((prev) => ({
                    ...prev,
                    [viewingProduct.id]: e.target.value,
                  }))
                }
                className="bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2 text-xs font-mono font-bold text-emerald-300 focus:outline-none focus:border-emerald-500 cursor-pointer"
              >
                {bins.map((b) => (
                  <option key={b.code} value={b.code}>
                    {b.code} — {b.zone}
                  </option>
                ))}
              </select>
            </div>

            {/* Modal Actions */}
            <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setViewingProduct(null)}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold cursor-pointer transition-colors"
              >
                Close
              </button>
              <button
                type="button"
                onClick={() => {
                  const bin =
                    pendingBinSelection[viewingProduct.id] ||
                    viewingProduct.binCode ||
                    bins[0]?.code ||
                    'A-01-02';
                  const prod = viewingProduct;
                  setViewingProduct(null);
                  onOpenApprovalModal('REJECT', prod, bin);
                }}
                className="px-4 py-2 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 text-rose-300 text-xs font-semibold flex items-center gap-1.5 cursor-pointer transition-colors"
              >
                <XCircle className="w-4 h-4 text-rose-400" />
                <span>Reject / QC Fail</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  const bin =
                    pendingBinSelection[viewingProduct.id] ||
                    viewingProduct.binCode ||
                    bins[0]?.code ||
                    'A-01-02';
                  const prod = viewingProduct;
                  setViewingProduct(null);
                  onOpenApprovalModal('APPROVE', prod, bin);
                }}
                className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center gap-1.5 shadow-lg shadow-emerald-600/20 cursor-pointer transition-colors"
              >
                <Check className="w-4 h-4" />
                <span>Approve &amp; Assign Bin</span>
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
