import React, { useState, useMemo } from 'react';
import {
  Package,
  Search,
  Plus,
  CheckCircle2,
  Clock,
  X,
  List,
  LayoutGrid,
  RotateCcw,
} from 'lucide-react';
import { Modal } from '@/components/admin/AdminModal';
import { MerchantRecord, MerchantProductItem } from '../../types';
import { makeMerchantProductThumbnail } from '../../mockData';

export interface MerchantProductsTabProps {
  merchant: MerchantRecord;
  productsList: MerchantProductItem[];
  onAdjustStock: (productId: string, delta: number) => void;
  onAddProduct: (newProduct: MerchantProductItem) => void;
}

export function MerchantProductsTab({
  merchant,
  productsList,
  onAdjustStock,
  onAddProduct,
}: MerchantProductsTabProps) {
  const [productSearch, setProductSearch] = useState('');
  const [productCategory, setProductCategory] = useState<'ALL' | 'Apparel' | 'Footwear' | 'Electronics' | 'Beauty'>('ALL');
  const [productStockFilter, setProductStockFilter] = useState<'ALL' | 'IN_STOCK' | 'LOW_STOCK' | 'OUT_OF_STOCK'>('ALL');
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('list');

  // Add Product Modal Form States
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newCategory, setNewCategory] = useState<'Apparel' | 'Footwear' | 'Electronics' | 'Beauty'>('Apparel');
  const [newBaseSku, setNewBaseSku] = useState('');
  const [newColor, setNewColor] = useState('');
  const [newSize, setNewSize] = useState('');
  const [newPrice, setNewPrice] = useState('');
  const [newStock, setNewStock] = useState('25');
  const [newBin, setNewBin] = useState('A-01-02');

  // Scoped Products for this merchant
  const allMerchantProducts = useMemo(() => {
    return productsList.filter((p) => p.merchantCode === merchant.merchantCode);
  }, [productsList, merchant.merchantCode]);

  // Filtered Products
  const filteredProducts = useMemo(() => {
    return allMerchantProducts.filter((p) => {
      const q = productSearch.toLowerCase().trim();
      const matchesSearch =
        !q ||
        p.title.toLowerCase().includes(q) ||
        p.sku.toLowerCase().includes(q) ||
        p.barcode.includes(q) ||
        p.color.toLowerCase().includes(q);

      const matchesCat = productCategory === 'ALL' || p.category === productCategory;

      const matchesStock =
        productStockFilter === 'ALL'
          ? true
          : productStockFilter === 'OUT_OF_STOCK'
            ? p.stock === 0
            : productStockFilter === 'LOW_STOCK'
              ? p.stock > 0 && p.stock <= 10
              : p.stock > 10;

      return matchesSearch && matchesCat && matchesStock;
    });
  }, [allMerchantProducts, productSearch, productCategory, productStockFilter]);

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;

    const cleanBase = (newBaseSku.trim() || newTitle.trim().split(' ')[0] || 'ITEM')
      .toUpperCase()
      .replace(/[^A-Z0-9]/g, '');
    const cleanColor = (newColor.trim() || 'STD')
      .toUpperCase()
      .slice(0, 3)
      .replace(/[^A-Z0-9]/g, '');
    const cleanSize = (newSize.trim() || 'OS').toUpperCase().replace(/[^A-Z0-9]/g, '');
    const generatedSku = `${merchant.merchantCode}-${cleanBase}-${cleanColor}-${cleanSize}`;

    const created: MerchantProductItem = {
      id: `p-${Date.now()}`,
      merchantCode: merchant.merchantCode,
      title: newTitle.trim(),
      category: newCategory,
      sku: generatedSku,
      barcode: `894${Math.floor(1000000000 + Math.random() * 8999999999)}`,
      color: newColor.trim() || 'Standard',
      size: newSize.trim() || 'OS',
      price: Math.max(0, Number(newPrice) || 950),
      wholesalePrice: Math.round(Math.max(0, Number(newPrice) || 950) * 0.7),
      stock: Math.max(0, Number(newStock) || 0),
      reserved: 0,
      damaged: 0,
      bin: newBin || 'A-01-02',
      imageUrl: makeMerchantProductThumbnail(
        cleanBase.slice(0, 2) || 'PR',
        '#064e3b',
        '#0f172a',
        '#34d399',
      ),
    };

    onAddProduct(created);
    setNewTitle('');
    setNewBaseSku('');
    setNewColor('');
    setNewSize('');
    setNewPrice('');
    setNewStock('25');
    setIsAddModalOpen(false);
  };

  return (
    <div className="space-y-5">
      {/* 4 Interactive Product Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <button
          type="button"
          onClick={() => setProductStockFilter('ALL')}
          className={`text-left rounded-2xl border p-4 transition-all cursor-pointer ${
            productStockFilter === 'ALL'
              ? 'border-emerald-500/60 bg-emerald-50 dark:bg-emerald-950/20 shadow-md'
              : 'border-slate-200 dark:border-white/10 bg-white/80 dark:bg-navy-900/80 hover:border-slate-300 dark:hover:border-white/15'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-600 dark:text-slate-300">Total Products</span>
            <Package className="w-4 h-4 text-orange-600 dark:text-orange-400" />
          </div>
          <div className="text-2xl font-extrabold text-navy-800 dark:text-white mt-1.5 tabular-nums">
            {allMerchantProducts.length} SKUs
          </div>
          <span className="text-xs text-slate-600 dark:text-slate-300 mt-1 block">
            {allMerchantProducts.reduce((sum, p) => sum + p.stock, 0)} total units
          </span>
        </button>

        <button
          type="button"
          onClick={() => setProductStockFilter('IN_STOCK')}
          className={`text-left rounded-2xl border p-4 transition-all cursor-pointer ${
            productStockFilter === 'IN_STOCK'
              ? 'border-emerald-500/60 bg-emerald-50 dark:bg-emerald-950/20 shadow-md'
              : 'border-slate-200 dark:border-white/10 bg-white/80 dark:bg-navy-900/80 hover:border-slate-300 dark:hover:border-white/15'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-600 dark:text-slate-300">In Stock (&gt;10)</span>
            <CheckCircle2 className="w-4 h-4 text-orange-600 dark:text-orange-400" />
          </div>
          <div className="text-2xl font-extrabold text-orange-600 dark:text-orange-400 mt-1.5 tabular-nums">
            {allMerchantProducts.filter((p) => p.stock > 10).length}
          </div>
          <span className="text-xs text-slate-600 dark:text-slate-300 mt-1 block">Ready for pick</span>
        </button>

        <button
          type="button"
          onClick={() => setProductStockFilter('LOW_STOCK')}
          className={`text-left rounded-2xl border p-4 transition-all cursor-pointer ${
            productStockFilter === 'LOW_STOCK'
              ? 'border-amber-500/60 bg-amber-50 dark:bg-amber-950/20 shadow-md'
              : 'border-slate-200 dark:border-white/10 bg-white/80 dark:bg-navy-900/80 hover:border-slate-300 dark:hover:border-white/15'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-600 dark:text-slate-300">Low Stock (1–10)</span>
            <Clock className="w-4 h-4 text-amber-600 dark:text-amber-400" />
          </div>
          <div className="text-2xl font-extrabold text-amber-600 dark:text-amber-400 mt-1.5 tabular-nums">
            {allMerchantProducts.filter((p) => p.stock > 0 && p.stock <= 10).length}
          </div>
          <span className="text-xs text-slate-600 dark:text-slate-300 mt-1 block">Needs restock soon</span>
        </button>

        <button
          type="button"
          onClick={() => setProductStockFilter('OUT_OF_STOCK')}
          className={`text-left rounded-2xl border p-4 transition-all cursor-pointer ${
            productStockFilter === 'OUT_OF_STOCK'
              ? 'border-rose-500/60 bg-rose-50 dark:bg-rose-950/20 shadow-md'
              : 'border-slate-200 dark:border-white/10 bg-white/80 dark:bg-navy-900/80 hover:border-slate-300 dark:hover:border-white/15'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-600 dark:text-slate-300">Stock Out (0)</span>
            <X className="w-4 h-4 text-rose-600 dark:text-rose-400" />
          </div>
          <div className="text-2xl font-extrabold text-rose-600 dark:text-rose-400 mt-1.5 tabular-nums">
            {allMerchantProducts.filter((p) => p.stock === 0).length}
          </div>
          <span className="text-xs text-slate-600 dark:text-slate-300 mt-1 block">Unavailable</span>
        </button>
      </div>

      {/* Filter & Action Controls Bar */}
      <div className="rounded-2xl border border-slate-200 dark:border-white/10 bg-white/90 dark:bg-navy-900/90 p-4 flex flex-col lg:flex-row lg:items-center justify-between gap-4 shadow-lg">
        <div className="flex flex-wrap items-center gap-2.5 flex-1">
          {/* Search */}
          <div className="relative flex-1 min-w-[200px] max-w-sm">
            <Search className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              value={productSearch}
              onChange={(e) => setProductSearch(e.target.value)}
              placeholder={`Search ${merchant.merchantCode} products or SKU...`}
              className="w-full pl-8 pr-3 py-1.5 rounded-xl bg-slate-50 dark:bg-navy-950 border border-slate-200 dark:border-white/10 text-xs text-navy-800 dark:text-white placeholder-slate-500 dark:placeholder-slate-400 focus:outline-none focus:border-orange-500 tabular-nums"
            />
          </div>

          {/* Category Pills */}
          <div className="inline-flex items-center gap-1 rounded-xl bg-slate-50 dark:bg-navy-950 p-1 border border-slate-200 dark:border-white/10">
            {(['ALL', 'Apparel', 'Footwear', 'Electronics'] as const).map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => setProductCategory(cat)}
                className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                  productCategory === cat
                    ? 'bg-orange-600 text-white shadow'
                    : 'text-slate-600 dark:text-slate-300 hover:text-navy-800 dark:hover:text-slate-100'
                }`}
              >
                {cat === 'ALL' ? 'All' : cat}
              </button>
            ))}
          </div>
        </div>

        {/* View Switcher & Add Product Action */}
        <div className="flex items-center gap-2.5">
          <div className="inline-flex items-center rounded-xl bg-slate-50 dark:bg-navy-950 p-1 border border-slate-200 dark:border-white/10">
            <button
              type="button"
              onClick={() => setViewMode('list')}
              className={`px-2.5 py-1 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                viewMode === 'list'
                  ? 'bg-orange-600 text-white shadow'
                  : 'text-slate-600 dark:text-slate-300 hover:text-navy-800 dark:hover:text-slate-100'
              }`}
            >
              <List className="w-3.5 h-3.5" />
              <span>Table</span>
            </button>
            <button
              type="button"
              onClick={() => setViewMode('grid')}
              className={`px-2.5 py-1 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                viewMode === 'grid'
                  ? 'bg-orange-600 text-white shadow'
                  : 'text-slate-600 dark:text-slate-300 hover:text-navy-800 dark:hover:text-slate-100'
              }`}
            >
              <LayoutGrid className="w-3.5 h-3.5" />
              <span>Cards</span>
            </button>
          </div>

          <button
            type="button"
            onClick={() => setIsAddModalOpen(true)}
            className="px-4 py-2 rounded-xl bg-orange-600 hover:bg-orange-700 text-xs font-bold text-white flex items-center gap-1.5 shadow-lg shadow-orange-500/25 transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Add Product</span>
          </button>
        </div>
      </div>

      {/* Products Content */}
      {filteredProducts.length === 0 ? (
        <div className="rounded-2xl border border-slate-200 dark:border-white/10 bg-white/50 dark:bg-navy-900/50 p-12 text-center space-y-3">
          <Package className="w-8 h-8 text-slate-500 dark:text-slate-400 mx-auto" />
          <h4 className="text-sm font-bold text-navy-800 dark:text-white">
            No products match your filter for {merchant.storeName}
          </h4>
          <button
            type="button"
            onClick={() => {
              setProductSearch('');
              setProductCategory('ALL');
              setProductStockFilter('ALL');
            }}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-100 dark:bg-navy-800 hover:bg-slate-200 dark:hover:bg-navy-700 text-xs font-semibold text-orange-600 dark:text-orange-400 cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset Filters</span>
          </button>
        </div>
      ) : viewMode === 'list' ? (
        /* TABLE VIEW */
        <div className="rounded-2xl border border-slate-200 dark:border-white/10 bg-white dark:bg-navy-900 overflow-hidden shadow-xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50/90 dark:bg-navy-950/90 text-slate-600 dark:text-slate-300 uppercase tracking-wider font-bold border-b border-slate-200 dark:border-white/10 text-xs">
                <tr>
                  <th className="p-4">Product &amp; Image</th>
                  <th className="p-4">2-Part System SKU</th>
                  <th className="p-4">Bin Location</th>
                  <th className="p-4">Variant (Color / Size)</th>
                  <th className="p-4 text-right">Unit Price</th>
                  <th className="p-4 text-center">Status</th>
                  <th className="p-4 text-right">Stock Adjust</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200/80 dark:divide-white/10">
                {filteredProducts.map((prod) => (
                  <tr key={prod.id} className="hover:bg-slate-100/40 dark:hover:bg-navy-800/40 transition-colors">
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        {prod.imageUrl ? (
                          <img
                            src={prod.imageUrl}
                            alt={prod.title}
                            className="h-10 w-10 rounded-xl object-cover border border-slate-300 dark:border-white/15 shadow-sm shrink-0 bg-slate-50 dark:bg-navy-950"
                          />
                        ) : (
                          <div className="h-10 w-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-600 dark:text-emerald-400 shrink-0">
                            <Package className="w-5 h-5" />
                          </div>
                        )}
                        <div>
                          <div className="font-bold text-navy-800 dark:text-white">{prod.title}</div>
                          <span className="text-xs text-slate-600 dark:text-slate-300">{prod.category}</span>
                        </div>
                      </div>
                    </td>

                    <td className="p-4">
                      <span className="tabular-nums text-xs font-bold px-2 py-0.5 rounded bg-slate-50 dark:bg-navy-950 text-orange-600 dark:text-orange-400 border border-slate-200 dark:border-white/10">
                        {prod.sku}
                      </span>
                    </td>

                    <td className="p-4">
                      <span className="tabular-nums text-xs font-bold px-2 py-0.5 rounded bg-indigo-500/10 text-indigo-700 dark:text-indigo-300 border border-indigo-500/30">
                        Bin: {prod.bin}
                      </span>
                    </td>

                    <td className="p-4">
                      <div className="inline-flex items-center gap-1.5 text-xs text-navy-800 dark:text-slate-100">
                        <span className="px-2 py-0.5 rounded bg-slate-50 dark:bg-navy-950 border border-slate-200 dark:border-white/10">
                          {prod.color}
                        </span>
                        <span className="px-2 py-0.5 rounded bg-slate-50 dark:bg-navy-950 border border-slate-200 dark:border-white/10 font-bold text-navy-800 dark:text-white">
                          {prod.size}
                        </span>
                      </div>
                    </td>

                    <td className="p-4 text-right tabular-nums font-bold text-navy-800 dark:text-white">
                      ৳{prod.price.toLocaleString()}
                    </td>

                    <td className="p-4 text-center">
                      <span
                        className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full border ${
                          prod.stock === 0
                            ? 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/30'
                            : prod.stock <= 10
                              ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30'
                              : 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30'
                        }`}
                      >
                        {prod.stock === 0
                          ? 'Stock Out'
                          : prod.stock <= 10
                            ? 'Low Stock'
                            : 'In Stock'}
                      </span>
                    </td>

                    <td className="p-4 text-right">
                      <div className="inline-flex items-center gap-1.5 rounded-xl bg-slate-50 dark:bg-navy-950 p-1 border border-slate-200 dark:border-white/10">
                        <button
                          type="button"
                          onClick={() => onAdjustStock(prod.id, -1)}
                          className="h-7 w-7 rounded-lg bg-white dark:bg-navy-900 hover:bg-slate-100 dark:hover:bg-navy-800 text-slate-700 dark:text-slate-200 font-bold text-xs flex items-center justify-center transition-colors cursor-pointer"
                          title="Decrease Stock (-1)"
                        >
                          -
                        </button>
                        <span className="w-10 text-center tabular-nums text-xs font-extrabold text-navy-800 dark:text-white">
                          {prod.stock}
                        </span>
                        <button
                          type="button"
                          onClick={() => onAdjustStock(prod.id, 1)}
                          className="h-7 w-7 rounded-lg bg-orange-500/20 hover:bg-orange-500/30 text-orange-600 dark:text-orange-400 border border-orange-500/30 font-bold text-xs flex items-center justify-center transition-colors cursor-pointer"
                          title="Increase Stock (+1)"
                        >
                          +
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        /* CARD GRID VIEW */
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredProducts.map((prod) => (
            <div
              key={prod.id}
              className="rounded-2xl border border-slate-200 dark:border-white/10 bg-white/90 dark:bg-navy-900/90 hover:border-orange-500/40 p-5 flex flex-col justify-between gap-4 shadow-lg transition-all"
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between gap-2">
                  <span className="tabular-nums text-xs font-bold px-2 py-0.5 rounded bg-slate-50 dark:bg-navy-950 text-orange-600 dark:text-orange-400 border border-slate-200 dark:border-white/10">
                    {prod.sku}
                  </span>
                  <span
                    className={`text-[11px] font-bold px-2 py-0.5 rounded-full border ${
                      prod.stock === 0
                        ? 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/30'
                        : prod.stock <= 10
                          ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30'
                          : 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30'
                    }`}
                  >
                    {prod.stock === 0 ? 'Stock Out' : prod.stock <= 10 ? 'Low Stock' : 'In Stock'}
                  </span>
                </div>

                <div className="flex items-start gap-3">
                  {prod.imageUrl ? (
                    <img
                      src={prod.imageUrl}
                      alt={prod.title}
                      className="h-12 w-12 rounded-xl object-cover border border-slate-300 dark:border-white/15 shrink-0 bg-slate-50 dark:bg-navy-950"
                    />
                  ) : (
                    <div className="h-12 w-12 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-600 dark:text-emerald-400 shrink-0">
                      <Package className="w-5 h-5" />
                    </div>
                  )}
                  <div>
                    <span className="text-xs font-semibold text-slate-600 dark:text-slate-300">
                      {prod.category} • <span className="tabular-nums text-indigo-700 dark:text-indigo-300">Bin {prod.bin}</span>
                    </span>
                    <h4 className="text-sm font-bold text-navy-800 dark:text-white mt-0.5">{prod.title}</h4>
                  </div>
                </div>

                <div className="flex items-center gap-2 text-xs">
                  <span className="px-2 py-0.5 rounded bg-slate-50 dark:bg-navy-950 border border-slate-200 dark:border-white/10 text-slate-700 dark:text-slate-200">
                    Color: <strong className="text-navy-800 dark:text-white">{prod.color}</strong>
                  </span>
                  <span className="px-2 py-0.5 rounded bg-slate-50 dark:bg-navy-950 border border-slate-200 dark:border-white/10 text-slate-700 dark:text-slate-200">
                    Size: <strong className="text-navy-800 dark:text-white">{prod.size}</strong>
                  </span>
                </div>
              </div>

              <div className="pt-3 border-t border-slate-200 dark:border-white/10 flex items-center justify-between">
                <div>
                  <span className="text-[11px] uppercase text-slate-500 dark:text-slate-400 font-semibold block">
                    Unit Price
                  </span>
                  <span className="text-base font-extrabold text-navy-800 dark:text-white tabular-nums">
                    ৳{prod.price.toLocaleString()}
                  </span>
                </div>

                <div className="inline-flex items-center gap-1.5 rounded-xl bg-slate-50 dark:bg-navy-950 p-1 border border-slate-200 dark:border-white/10">
                  <button
                    type="button"
                    onClick={() => onAdjustStock(prod.id, -1)}
                    className="h-7 w-7 rounded-lg bg-white dark:bg-navy-900 hover:bg-slate-100 dark:hover:bg-navy-800 text-slate-700 dark:text-slate-200 font-bold text-xs flex items-center justify-center cursor-pointer"
                  >
                    -
                  </button>
                  <span className="w-10 text-center tabular-nums text-xs font-extrabold text-navy-800 dark:text-white">
                    {prod.stock}
                  </span>
                  <button
                    type="button"
                    onClick={() => onAdjustStock(prod.id, 1)}
                    className="h-7 w-7 rounded-lg bg-orange-500/20 hover:bg-orange-500/30 text-orange-600 dark:text-orange-400 border border-orange-500/30 font-bold text-xs flex items-center justify-center cursor-pointer"
                  >
                    +
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add Product Modal */}
      <Modal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        title={`Add Product for ${merchant.storeName}`}
        subtitle={`Generates 2-part SKU with prefix ${merchant.merchantCode}`}
        size="md"
      >
        <form onSubmit={handleCreateSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-200 mb-1">
              Product Title *
            </label>
            <input
              type="text"
              required
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              placeholder="e.g. Heavyweight Fleece Hoodie"
              className="w-full rounded-xl bg-slate-50 dark:bg-navy-950 border border-slate-200 dark:border-white/10 px-3.5 py-2 text-xs text-navy-800 dark:text-white focus:outline-none focus:border-orange-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-200 mb-1">Category</label>
              <select
                value={newCategory}
                onChange={(e) => setNewCategory(e.target.value as any)}
                className="w-full rounded-xl bg-slate-50 dark:bg-navy-950 border border-slate-200 dark:border-white/10 px-3 py-2 text-xs text-navy-800 dark:text-white focus:outline-none focus:border-orange-500"
              >
                <option value="Apparel">Apparel</option>
                <option value="Footwear">Footwear</option>
                <option value="Electronics">Electronics</option>
                <option value="Beauty">Beauty</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-200 mb-1">
                Short SKU Code
              </label>
              <input
                type="text"
                value={newBaseSku}
                onChange={(e) => setNewBaseSku(e.target.value.toUpperCase())}
                placeholder="e.g. HOODIE"
                className="w-full rounded-xl bg-slate-50 dark:bg-navy-950 border border-slate-200 dark:border-white/10 px-3.5 py-2 text-xs text-navy-800 dark:text-white tabular-nums uppercase focus:outline-none focus:border-orange-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-200 mb-1">Color</label>
              <input
                type="text"
                value={newColor}
                onChange={(e) => setNewColor(e.target.value)}
                placeholder="e.g. Black"
                className="w-full rounded-xl bg-slate-50 dark:bg-navy-950 border border-slate-200 dark:border-white/10 px-3.5 py-2 text-xs text-navy-800 dark:text-white focus:outline-none focus:border-orange-500"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-200 mb-1">Size</label>
              <input
                type="text"
                value={newSize}
                onChange={(e) => setNewSize(e.target.value)}
                placeholder="e.g. XL"
                className="w-full rounded-xl bg-slate-50 dark:bg-navy-950 border border-slate-200 dark:border-white/10 px-3.5 py-2 text-xs text-navy-800 dark:text-white focus:outline-none focus:border-orange-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-200 mb-1">Price (৳)</label>
              <input
                type="number"
                value={newPrice}
                onChange={(e) => setNewPrice(e.target.value)}
                placeholder="1650"
                className="w-full rounded-xl bg-slate-50 dark:bg-navy-950 border border-slate-200 dark:border-white/10 px-3.5 py-2 text-xs text-navy-800 dark:text-white tabular-nums focus:outline-none focus:border-orange-500"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-200 mb-1">Stock</label>
              <input
                type="number"
                value={newStock}
                onChange={(e) => setNewStock(e.target.value)}
                className="w-full rounded-xl bg-slate-50 dark:bg-navy-950 border border-slate-200 dark:border-white/10 px-3.5 py-2 text-xs text-navy-800 dark:text-white tabular-nums focus:outline-none focus:border-orange-500"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-200 mb-1">Bin</label>
              <input
                type="text"
                value={newBin}
                onChange={(e) => setNewBin(e.target.value.toUpperCase())}
                placeholder="A-01-02"
                className="w-full rounded-xl bg-slate-50 dark:bg-navy-950 border border-slate-200 dark:border-white/10 px-3.5 py-2 text-xs text-navy-800 dark:text-white tabular-nums uppercase focus:outline-none focus:border-orange-500"
              />
            </div>
          </div>

          <div className="pt-2 flex justify-end gap-2.5">
            <button
              type="button"
              onClick={() => setIsAddModalOpen(false)}
              className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-navy-800 hover:bg-slate-200 dark:hover:bg-navy-700 text-xs font-semibold text-slate-700 dark:text-slate-200"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 rounded-xl bg-orange-600 hover:bg-orange-700 text-xs font-bold text-white shadow-lg shadow-orange-500/25"
            >
              Save Product
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
