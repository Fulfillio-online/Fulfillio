'use client';

import React, { useState, useMemo } from 'react';
import { Package, Search, Plus, MapPin, SlidersHorizontal, Check } from 'lucide-react';
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

      {/* Product Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-300">
            <thead className="bg-slate-950/80 text-[11px] uppercase tracking-wider text-slate-400 font-semibold border-b border-slate-800">
              <tr>
                <th className="py-3.5 px-4">Product &amp; 2-Part SKU</th>
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
                  const isLowStock = p.stock < 50;
                  return (
                    <tr key={p.id} className="hover:bg-slate-800/40 transition-colors">
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-3">
                          <img
                            src={p.imageUrl}
                            alt={p.title}
                            className="w-10 h-10 rounded-xl object-cover border border-slate-800 shrink-0"
                          />
                          <div>
                            <div className="font-semibold text-white leading-tight line-clamp-1">
                              {p.title}
                            </div>
                            <div className="flex items-center gap-1.5 mt-0.5">
                              <span className="font-mono text-xs font-bold text-emerald-400">
                                {p.fullSku}
                              </span>
                              <span className="text-[10px] text-slate-500">
                                ({p.color} · {p.size})
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
                        <div className="text-xs text-slate-300">{p.merchantName}</div>
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
                        <div className="flex items-center gap-2">
                          <div className="flex items-center bg-slate-950 border border-slate-800 rounded-lg p-0.5">
                            <button
                              type="button"
                              onClick={() => onAdjustStock(p.id, -1)}
                              disabled={p.stock <= 0}
                              className="w-6 h-6 rounded flex items-center justify-center text-xs font-bold text-slate-400 hover:text-white hover:bg-slate-800 disabled:opacity-30"
                            >
                              -
                            </button>
                            <span className="w-10 text-center font-mono text-xs font-bold text-white">
                              {p.stock}
                            </span>
                            <button
                              type="button"
                              onClick={() => onAdjustStock(p.id, 1)}
                              className="w-6 h-6 rounded flex items-center justify-center text-xs font-bold text-slate-400 hover:text-white hover:bg-slate-800"
                            >
                              +
                            </button>
                          </div>
                          {isLowStock && (
                            <span className="text-[10px] font-bold text-amber-400 bg-amber-500/10 px-1.5 py-0.5 rounded">
                              Low
                            </span>
                          )}
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
                          className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors"
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
