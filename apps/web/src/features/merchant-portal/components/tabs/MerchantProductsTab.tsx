'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  Package,
  Printer,
  Plus,
  Search,
  Barcode,
  Minus,
  Trash2,
} from 'lucide-react';
import { InboundAsnManager } from '@/features/inbound/InboundAsnManager';
import { MerchantProductItem } from '../../types';
import { AddSingleProductModal } from '../modals/AddSingleProductModal';
import { PrintBarcodeModal } from '../modals/PrintBarcodeModal';

interface MerchantProductsTabProps {
  products: MerchantProductItem[];
  merchantCode: string;
  storeName: string;
  onAdjustStock: (id: string, delta: number) => void;
  onDeleteProduct: (id: string) => void;
  onAddProducts: (newItems: MerchantProductItem[]) => void;
  onTriggerToast: (msg: string) => void;
}

export function MerchantProductsTab({
  products,
  merchantCode,
  storeName,
  onAdjustStock,
  onDeleteProduct,
  onAddProducts,
  onTriggerToast,
}: MerchantProductsTabProps) {
  const [productSearch, setProductSearch] = useState('');
  const [stockFilter, setStockFilter] = useState<'ALL' | 'IN_STOCK' | 'LOW_STOCK'>('ALL');
  const [isAddProductOpen, setIsAddProductOpen] = useState(false);
  const [isBarcodeModalOpen, setIsBarcodeModalOpen] = useState(false);
  const [barcodeProduct, setBarcodeProduct] = useState<MerchantProductItem | null>(null);

  const filteredProducts = products.filter((p) => {
    const matchSearch =
      p.title.toLowerCase().includes(productSearch.toLowerCase()) ||
      p.sku.toLowerCase().includes(productSearch.toLowerCase()) ||
      p.barcode.includes(productSearch);
    if (!matchSearch) return false;
    if (stockFilter === 'IN_STOCK') return p.stock > 20;
    if (stockFilter === 'LOW_STOCK') return p.stock <= 20;
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Tab Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-100 flex items-center gap-2">
            <Package className="h-6 w-6 text-emerald-400 shrink-0" />
            <span>Products & 2-Part SKU Inventory</span>
          </h1>
          <p className="text-sm text-slate-400 mt-0.5">
            Manage 2-part warehouse SKUs ({merchantCode}-[SKU]), barcode stickers, and physical bin mapping.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
          <Link
            href="/print/memo/ORD-9041?memoCode=MEMO-DARAZ-BD"
            className="px-3.5 py-2 bg-indigo-600/20 hover:bg-indigo-600/30 border border-indigo-500/40 text-indigo-300 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors flex-1 sm:flex-initial"
          >
            <Printer className="h-3.5 w-3.5 shrink-0" />
            <span>2-in-1 4x6&quot; Thermal Preview</span>
          </Link>
          <button
            onClick={() => setIsAddProductOpen(true)}
            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-semibold flex items-center justify-center gap-2 transition-colors shadow-sm shrink-0 flex-1 sm:flex-initial"
          >
            <Plus className="h-4 w-4 shrink-0" />
            <span>Add Single Product</span>
          </button>
        </div>
      </div>

      {/* Module 14: Inbound ASN Stock Sending & Receiving Manager */}
      <InboundAsnManager
        mode="MERCHANT"
        merchantCode={merchantCode}
        onStockReceived={(sku, good, dmg) =>
          onTriggerToast(
            `Dock Putaway Complete for ${sku}: +${good} Sellable added (${dmg} Quarantine)`
          )
        }
      />

      {/* Filters & Search Toolbar */}
      <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 flex flex-col sm:flex-row gap-3 items-center justify-between shadow-sm">
        <div className="relative w-full sm:w-96">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-500" />
          <input
            type="text"
            value={productSearch}
            onChange={(e) => setProductSearch(e.target.value)}
            placeholder="Search product name, 2-part SKU, or barcode..."
            className="w-full pl-9 pr-4 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-emerald-500"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto justify-between sm:justify-end">
          <span className="text-xs text-slate-400">Stock Filter:</span>
          <select
            value={stockFilter}
            onChange={(e) => setStockFilter(e.target.value as any)}
            className="px-3 py-1.5 bg-slate-950 border border-slate-800 rounded-lg text-xs text-slate-300 focus:outline-none focus:border-emerald-500"
          >
            <option value="ALL">All Items ({products.length})</option>
            <option value="IN_STOCK">In Stock (&gt; 20)</option>
            <option value="LOW_STOCK">Low Stock (≤ 20)</option>
          </select>
        </div>
      </div>

      {/* Products Table */}
      <div className="rounded-xl border border-slate-800 bg-slate-900 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[680px] text-left text-sm">
            <thead className="bg-slate-800/80 text-slate-400 text-xs uppercase tracking-wider font-semibold border-b border-slate-800">
              <tr>
                <th className="p-4">Product Name & Variant</th>
                <th className="p-4">2-Part SKU Code</th>
                <th className="p-4">Barcode</th>
                <th className="p-4">Storage Bin</th>
                <th className="p-4">Warehouse Stock</th>
                <th className="p-4 text-right">Unit Price</th>
                <th className="p-4 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {filteredProducts.map((p) => (
                <tr key={p.id} className="hover:bg-slate-800/40 transition-colors">
                  <td className="p-4">
                    <div className="font-semibold text-slate-200">{p.title}</div>
                    <div className="text-xs text-slate-400 flex items-center gap-1.5 mt-0.5">
                      <span className="px-1.5 py-0.5 rounded bg-slate-800 text-[10px] text-slate-300 border border-slate-700">
                        {p.variantLabel}
                      </span>
                    </div>
                  </td>
                  <td className="p-4">
                    <span className="font-mono text-xs font-bold text-emerald-400 bg-slate-950 px-2 py-1 rounded border border-slate-800">
                      {p.sku}
                    </span>
                  </td>
                  <td className="p-4 font-mono text-xs text-slate-300">
                    <div className="flex items-center gap-1.5">
                      <Barcode className="h-3.5 w-3.5 text-slate-500" />
                      <span>{p.barcode}</span>
                    </div>
                  </td>
                  <td className="p-4 font-mono text-xs font-bold text-amber-400">
                    <span className="px-2 py-0.5 rounded bg-amber-500/10 text-amber-300 border border-amber-500/20">
                      {p.bin}
                    </span>
                  </td>
                  <td className="p-4">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => onAdjustStock(p.id, -1)}
                        className="h-6 w-6 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 flex items-center justify-center text-xs font-bold transition-colors"
                        title="Decrease Stock"
                      >
                        <Minus className="h-3 w-3" />
                      </button>
                      <span className="font-bold text-sm text-slate-100 min-w-7 text-center">
                        {p.stock}
                      </span>
                      <button
                        onClick={() => onAdjustStock(p.id, 1)}
                        className="h-6 w-6 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 flex items-center justify-center text-xs font-bold transition-colors"
                        title="Increase Stock"
                      >
                        <Plus className="h-3 w-3" />
                      </button>
                      {p.reserved > 0 && (
                        <span className="text-[10px] text-slate-500 ml-1">
                          ({p.reserved} reserved)
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="p-4 text-right font-bold text-slate-100">
                    ৳ {p.price.toLocaleString()}
                  </td>
                  <td className="p-4 text-center">
                    <div className="flex items-center justify-center gap-1.5">
                      <button
                        onClick={() => {
                          setBarcodeProduct(p);
                          setIsBarcodeModalOpen(true);
                        }}
                        className="px-2.5 py-1 bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-300 border border-indigo-500/30 rounded-lg text-xs font-semibold flex items-center gap-1 transition-colors"
                        title="Print Barcode Thermal Label"
                      >
                        <Printer className="h-3.5 w-3.5" />
                        <span>Sticker</span>
                      </button>

                      <button
                        onClick={() => onDeleteProduct(p.id)}
                        className="p-1 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
                        title="Remove Product"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modals */}
      <AddSingleProductModal
        isOpen={isAddProductOpen}
        onClose={() => setIsAddProductOpen(false)}
        merchantCode={merchantCode}
        onAddProducts={(newItems) => {
          onAddProducts(newItems);
          onTriggerToast(
            `Generated ${newItems.length} product SKU(s) with barcodes successfully!`
          );
        }}
      />

      <PrintBarcodeModal
        product={barcodeProduct}
        storeName={storeName}
        onClose={() => setIsBarcodeModalOpen(false)}
        onTriggerToast={onTriggerToast}
      />
    </div>
  );
}
