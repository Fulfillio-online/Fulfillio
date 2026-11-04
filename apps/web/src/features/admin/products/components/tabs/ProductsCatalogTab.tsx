'use client';

import React, { useState, useMemo } from 'react';
import { Package, Search, Plus, MapPin, SlidersHorizontal, Check, ChevronDown } from 'lucide-react';
import { SearchInput, StatusBadge } from '@/components/ui';
import { WarehouseBin, WarehouseProductItem } from '../../types';
import { MERCHANTS } from '../../mockData';

interface ProductsCatalogTabProps {
  products: WarehouseProductItem[];
  bins: WarehouseBin[];
  onAdjustStock: (productId: string, delta: number) => void;
  onOpenStockAdjustModal: (product: WarehouseProductItem) => void;
  onChangeProductBin: (productId: string, nextBinCode: string) => void;
  onOpenAddProduct: () => void;
}

export function ProductsCatalogTab({
  products,
  bins,
  onAdjustStock,
  onOpenStockAdjustModal,
  onChangeProductBin,
  onOpenAddProduct,
}: ProductsCatalogTabProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [merchantFilter, setMerchantFilter] = useState<string>('ALL');
  const [categoryFilter, setCategoryFilter] = useState<string>('ALL');
  const [binFilter, setBinFilter] = useState<string>('ALL');

  // Mobile Collapsible Accordion State
  const [expandedProductIds, setExpandedProductIds] = useState<Set<string>>(new Set());

  const toggleExpand = (id: string) => {
    setExpandedProductIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const approvedProducts = useMemo(
    () => products.filter((p) => p.status === 'APPROVED'),
    [products]
  );

  const filteredProducts = useMemo(() => {
    return approvedProducts.filter((item) => {
      const q = searchQuery.trim().toLowerCase();
      const matchesSearch =
        !q ||
        item.title.toLowerCase().includes(q) ||
        item.fullSku.toLowerCase().includes(q) ||
        item.shortSku.toLowerCase().includes(q) ||
        item.merchantName.toLowerCase().includes(q);
      const matchesMerchant = merchantFilter === 'ALL' || item.merchantCode === merchantFilter;
      const matchesCategory = categoryFilter === 'ALL' || item.category === categoryFilter;
      const matchesBin = binFilter === 'ALL' || item.binCode === binFilter;
      return matchesSearch && matchesMerchant && matchesCategory && matchesBin;
    });
  }, [approvedProducts, searchQuery, merchantFilter, categoryFilter, binFilter]);

  return (
    <div className="space-y-4">
      {/* Filter Bar */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 shadow-md">
        <div className="lg:col-span-2">
          <SearchInput
            value={searchQuery}
            onChange={setSearchQuery}
            placeholder="Search product title or 2-Part SKU (e.g. MC-101-HOODIE)..."
          />
        </div>

        <div>
          <select
            value={merchantFilter}
            onChange={(e) => setMerchantFilter(e.target.value)}
            aria-label="Filter by Merchant"
            className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm text-slate-200 focus:outline-none focus:border-emerald-500"
          >
            <option value="ALL">All Merchants (MC-101 – MC-104)</option>
            {MERCHANTS.map((m) => (
              <option key={m.code} value={m.code}>
                {m.code} — {m.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            aria-label="Filter by Category"
            className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm text-slate-200 focus:outline-none focus:border-emerald-500"
          >
            <option value="ALL">All Categories</option>
            <option value="Apparel">Apparel</option>
            <option value="Footwear">Footwear</option>
            <option value="Electronics">Electronics</option>
            <option value="Accessories">Accessories</option>
          </select>
        </div>

        <div>
          <select
            value={binFilter}
            onChange={(e) => setBinFilter(e.target.value)}
            aria-label="Filter by Bin Location"
            className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm font-mono text-emerald-300 focus:outline-none focus:border-emerald-500"
          >
            <option value="ALL">All Warehouse Bins</option>
            {bins.map((b) => (
              <option key={b.code} value={b.code}>
                Bin {b.code} ({b.zone})
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Product Catalog Display: Mobile Accordions & Desktop Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl p-3 sm:p-0">
        {/* 1. Mobile Collapsible List (Visible on mobile screens) */}
        <div className="block md:hidden space-y-2.5">
          {filteredProducts.length === 0 ? (
            <div className="py-12 text-center text-slate-400">
              <Package className="w-10 h-10 text-slate-600 mx-auto mb-2" />
              <p className="text-sm font-semibold text-slate-300">No active products match your criteria</p>
              <p className="text-xs text-slate-500 mt-1">Try clearing filters or search keywords</p>
            </div>
          ) : (
            filteredProducts.map((p) => {
              const isExpanded = expandedProductIds.has(p.id);
              const isLowStock = p.stock < 30;

              return (
                <div
                  key={p.id}
                  className="rounded-xl border border-slate-800 bg-slate-950/60 overflow-hidden transition-all shadow-sm"
                >
                  {/* Collapsed Header Summary: 3 Rows on Left & Status + Button on Right */}
                  <div
                    onClick={() => toggleExpand(p.id)}
                    className="p-3.5 flex items-start justify-between gap-3 cursor-pointer hover:bg-slate-800/40 select-none transition-colors"
                  >
                    {/* Left Side: Thumbnail + 3 Distinct Rows */}
                    <div className="flex items-start gap-3 min-w-0 flex-1">
                      <img
                        src={p.imageUrl}
                        alt={p.title}
                        className="w-12 h-12 rounded-xl object-cover border border-slate-800 shrink-0 mt-0.5"
                      />
                      <div className="min-w-0 flex-1 space-y-1">
                        {/* Row 1: Product Title (Larger & Prominent) */}
                        <div className="font-bold text-white text-[15px] leading-tight truncate">
                          {p.title}
                        </div>

                        {/* Row 2: SKU and Merchant */}
                        <div className="flex items-center gap-1.5 text-xs truncate">
                          <span className="font-mono font-bold text-emerald-400">
                            {p.fullSku}
                          </span>
                          <span className="text-slate-500">·</span>
                          <span className="text-slate-300 font-medium truncate">
                            {p.merchantName}
                          </span>
                        </div>

                        {/* Row 3: Price & Physical Stock Box (Colored when Low) */}
                        <div className="flex items-center gap-3 pt-0.5">
                          <span className="font-mono text-xs font-bold text-slate-200">
                            ৳{p.price.toLocaleString()}
                          </span>

                          <div
                            onClick={(e) => e.stopPropagation()}
                            className={`flex items-center rounded-lg p-0.5 border transition-colors ${
                              isLowStock
                                ? 'bg-rose-500/15 border-rose-500/35'
                                : 'bg-slate-950 border-slate-800'
                            }`}
                          >
                            <button
                              type="button"
                              onClick={() => onAdjustStock(p.id, -1)}
                              disabled={p.stock <= 0}
                              className={`w-5 h-5 rounded flex items-center justify-center text-xs font-bold transition-colors ${
                                isLowStock
                                  ? 'text-rose-400 hover:text-white hover:bg-rose-500/20 disabled:opacity-30'
                                  : 'text-slate-400 hover:text-white hover:bg-slate-800 disabled:opacity-30'
                              }`}
                            >
                              -
                            </button>
                            <span
                              className={`w-7 text-center font-mono text-xs font-bold ${
                                isLowStock ? 'text-rose-400' : 'text-white'
                              }`}
                            >
                              {p.stock}
                            </span>
                            <button
                              type="button"
                              onClick={() => onAdjustStock(p.id, 1)}
                              className={`w-5 h-5 rounded flex items-center justify-center text-xs font-bold transition-colors ${
                                isLowStock
                                  ? 'text-rose-400 hover:text-white hover:bg-rose-500/20'
                                  : 'text-slate-400 hover:text-white hover:bg-slate-800'
                              }`}
                            >
                              +
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Right Side: Status Tag on Top Right Corner & Toggle Button Below */}
                    <div className="flex flex-col items-end justify-between self-stretch shrink-0">
                      <div>
                        <StatusBadge status="Approved" />
                      </div>

                      <button
                        type="button"
                        aria-label="Toggle details"
                        className="p-1 rounded-lg bg-slate-800 text-slate-400 hover:text-white transition-colors"
                      >
                        <ChevronDown
                          className={`w-4 h-4 transition-transform duration-200 ${
                            isExpanded ? 'rotate-180 text-emerald-400' : ''
                          }`}
                        />
                      </button>
                    </div>
                  </div>

                  {/* Expanded Row Details */}
                  {isExpanded && (
                    <div className="px-3.5 pb-3.5 pt-2 border-t border-slate-800/80 bg-slate-900/60 text-xs space-y-2.5 animate-in fade-in-50 duration-150 font-sans">
                      <div className="grid grid-cols-2 gap-2 text-[11px] pt-1">
                        <div>
                          <span className="text-slate-400 block text-[10px] uppercase font-semibold">Category</span>
                          <span className="px-2 py-0.5 rounded text-xs bg-slate-800 text-slate-300 border border-slate-700 inline-block mt-0.5">
                            {p.category}
                          </span>
                        </div>

                        <div>
                          <span className="text-slate-400 block text-[10px] uppercase font-semibold">Assigned Bin</span>
                          <div onClick={(e) => e.stopPropagation()} className="mt-0.5">
                            <select
                              value={p.binCode}
                              onChange={(e) => onChangeProductBin(p.id, e.target.value)}
                              className="px-2 py-1 rounded-lg bg-slate-950 border border-slate-700/80 text-xs font-mono font-bold text-emerald-300 focus:outline-none focus:border-emerald-500 w-full"
                            >
                              {bins.map((b) => (
                                <option key={b.code} value={b.code}>
                                  {b.code} ({b.zone})
                                </option>
                              ))}
                            </select>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center justify-between pt-1 border-t border-slate-800/80">
                        <span className="text-[11px] text-slate-400">Inventory Action:</span>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            onOpenStockAdjustModal(p);
                          }}
                          className="px-3.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs flex items-center gap-1.5 transition-colors cursor-pointer"
                        >
                          <SlidersHorizontal className="w-3.5 h-3.5 text-emerald-400" />
                          <span>Detailed Stock Audit</span>
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>

        {/* 2. Desktop Full Table (Visible on md screens and larger) */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-300">
            <thead className="bg-slate-950/80 text-[11px] uppercase tracking-wider text-slate-400 font-semibold border-b border-slate-800">
              <tr>
                <th className="py-3.5 px-4">Product &amp; SKU</th>
                <th className="py-3.5 px-3">Category</th>
                <th className="py-3.5 px-3">Merchant</th>
                <th className="py-3.5 px-3">Assigned Bin</th>
                <th className="py-3.5 px-3">Physical Stock</th>
                <th className="py-3.5 px-3">Price</th>
                <th className="py-3.5 px-3">Status</th>
                <th className="py-3.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-medium">
              {filteredProducts.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400">
                    <Package className="w-10 h-10 text-slate-600 mx-auto mb-2" />
                    <p className="text-sm font-semibold text-slate-300">No active products match your criteria</p>
                    <p className="text-xs text-slate-500 mt-1">Try clearing filters or search keywords</p>
                  </td>
                </tr>
              ) : (
                filteredProducts.map((p) => {
                  const isLowStock = p.stock < 30;

                  return (
                    <tr key={p.id} className="hover:bg-slate-800/40 transition-colors">
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-3">
                          <img
                            src={p.imageUrl}
                            alt={p.title}
                            className="w-11 h-11 rounded-xl object-cover border border-slate-800 shrink-0"
                          />
                          <div>
                            {/* Product Name (Larger & Prominent) */}
                            <div className="font-bold text-white text-[15px] leading-tight line-clamp-1">
                              {p.title}
                            </div>
                            {/* SKU without Color & Size */}
                            <div className="mt-1">
                              <span className="font-mono text-xs font-bold text-emerald-400">
                                {p.fullSku}
                              </span>
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="py-3.5 px-3">
                        <span className="px-2 py-0.5 rounded-md text-xs bg-slate-800 text-slate-300 border border-slate-700">
                          {p.category}
                        </span>
                      </td>
                      <td className="py-3.5 px-3">
                        <div className="text-xs font-semibold text-slate-200">{p.merchantName}</div>
                        <div className="text-[10px] font-mono text-slate-500">{p.merchantCode}</div>
                      </td>
                      <td className="py-3.5 px-3">
                        <select
                          value={p.binCode}
                          onChange={(e) => onChangeProductBin(p.id, e.target.value)}
                          className="px-2 py-1 rounded-lg bg-slate-950 border border-slate-700/80 text-xs font-mono font-bold text-emerald-300 focus:outline-none focus:border-emerald-500"
                        >
                          {bins.map((b) => (
                            <option key={b.code} value={b.code}>
                              {b.code} ({b.zone})
                            </option>
                          ))}
                        </select>
                      </td>
                      <td className="py-3.5 px-3">
                        {/* Physical Stock: Colored Box if Low, No separate Tag */}
                        <div
                          className={`inline-flex items-center rounded-lg p-0.5 border transition-colors ${
                            isLowStock
                              ? 'bg-rose-500/15 border-rose-500/35'
                              : 'bg-slate-950 border-slate-800'
                          }`}
                        >
                          <button
                            type="button"
                            onClick={() => onAdjustStock(p.id, -1)}
                            disabled={p.stock <= 0}
                            className={`w-6 h-6 rounded flex items-center justify-center text-xs font-bold transition-colors ${
                              isLowStock
                                ? 'text-rose-400 hover:text-white hover:bg-rose-500/20 disabled:opacity-30'
                                : 'text-slate-400 hover:text-white hover:bg-slate-800 disabled:opacity-30'
                            }`}
                          >
                            -
                          </button>
                          <span
                            className={`w-10 text-center font-mono text-xs font-bold ${
                              isLowStock ? 'text-rose-400' : 'text-white'
                            }`}
                          >
                            {p.stock}
                          </span>
                          <button
                            type="button"
                            onClick={() => onAdjustStock(p.id, 1)}
                            className={`w-6 h-6 rounded flex items-center justify-center text-xs font-bold transition-colors ${
                              isLowStock
                                ? 'text-rose-400 hover:text-white hover:bg-rose-500/20'
                                : 'text-slate-400 hover:text-white hover:bg-slate-800'
                            }`}
                          >
                            +
                          </button>
                        </div>
                      </td>
                      <td className="py-3.5 px-3 font-mono text-xs font-semibold text-slate-200">
                        ৳{p.price.toLocaleString()}
                      </td>
                      <td className="py-3.5 px-3">
                        <StatusBadge status="Approved" />
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <button
                          type="button"
                          onClick={() => onOpenStockAdjustModal(p)}
                          className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors cursor-pointer"
                          title="Adjust Stock"
                        >
                          <SlidersHorizontal className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
