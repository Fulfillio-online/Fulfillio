'use client';

import React, { useState } from 'react';
import { X, Sparkles } from 'lucide-react';
import { MerchantOrderItem, MerchantProductItem, ResellerMemo } from '../../types';

interface CreateManualOrderModalProps {
  isOpen: boolean;
  onClose: () => void;
  products: MerchantProductItem[];
  memoList: ResellerMemo[];
  onCreateOrder: (order: MerchantOrderItem, productId: string, qty: number) => void;
  onTriggerToast: (msg: string) => void;
}

export function CreateManualOrderModal({
  isOpen,
  onClose,
  products,
  memoList,
  onCreateOrder,
  onTriggerToast,
}: CreateManualOrderModalProps) {
  const [orderCustomer, setOrderCustomer] = useState('');
  const [orderPhone, setOrderPhone] = useState('');
  const [orderAddress, setOrderAddress] = useState('');
  const [orderSelectedProductId, setOrderSelectedProductId] = useState(
    products[0]?.id || ''
  );
  const [orderQty, setOrderQty] = useState(1);
  const [orderMemoCode, setOrderMemoCode] = useState(
    memoList[0]?.code || 'MEMO-DEFAULT'
  );
  const [orderCourier, setOrderCourier] = useState('Steadfast');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const product = products.find((p) => p.id === orderSelectedProductId);
    if (!product) {
      onTriggerToast('Please select a valid product.');
      return;
    }

    if (product.stock < orderQty) {
      onTriggerToast(`Insufficient stock! Available: ${product.stock}`);
      return;
    }

    const newOrderId = `ORD-${Math.floor(1000 + Math.random() * 9000)}`;
    const newOrder: MerchantOrderItem = {
      id: newOrderId,
      date: 'Today, Just now',
      customer: orderCustomer,
      phone: orderPhone,
      address: orderAddress,
      productId: product.id,
      items: `${product.title} (${product.variantLabel}) x ${orderQty}`,
      qty: orderQty,
      amount: product.price * orderQty,
      memoCode: orderMemoCode,
      status: 'PENDING',
      courier: orderCourier,
    };

    onCreateOrder(newOrder, product.id, orderQty);
    onClose();
    setOrderCustomer('');
    setOrderPhone('');
    setOrderAddress('');
    setOrderQty(1);
    onTriggerToast(`Manual order ${newOrderId} created with ${orderMemoCode}! Stock reserved.`);
  };

  const selectedProduct = products.find((p) => p.id === orderSelectedProductId) || products[0];

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto p-4 sm:p-6 space-y-5 shadow-2xl animate-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div>
            <h3 className="font-bold text-base text-slate-100">Create Manual Order</h3>
            <p className="text-xs text-slate-400">
              Reserves warehouse stock and assigns custom Reseller Memo for packing.
            </p>
          </div>
          <button onClick={onClose} className="text-slate-500 hover:text-slate-300 p-1">
            <X className="h-4 w-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-xs font-semibold text-slate-400 block mb-1">
              Customer Full Name
            </label>
            <input
              type="text"
              value={orderCustomer}
              onChange={(e) => setOrderCustomer(e.target.value)}
              placeholder="e.g. Mahfuz Rahman"
              required
              className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-sm text-slate-100 focus:outline-none focus:border-emerald-500"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-slate-400 block mb-1">
                Phone Number
              </label>
              <input
                type="text"
                value={orderPhone}
                onChange={(e) => setOrderPhone(e.target.value)}
                placeholder="017xxxxxxxx"
                required
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-sm text-slate-100 focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-400 block mb-1">
                Courier Partner
              </label>
              <select
                value={orderCourier}
                onChange={(e) => setOrderCourier(e.target.value)}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-sm text-slate-100 focus:outline-none focus:border-emerald-500"
              >
                <option value="Steadfast">Steadfast Courier</option>
                <option value="Pathao">Pathao Logistics</option>
              </select>
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-400 block mb-1">
              Delivery Address & City
            </label>
            <input
              type="text"
              value={orderAddress}
              onChange={(e) => setOrderAddress(e.target.value)}
              placeholder="House, Road, Area, Dhaka"
              required
              className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-sm text-slate-100 focus:outline-none focus:border-emerald-500"
            />
          </div>

          {/* Product Selector with Live Stock Display */}
          <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-3">
            <span className="text-xs font-bold text-slate-300 block">
              Product & Warehouse Stock Reservation:
            </span>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              <div className="sm:col-span-2">
                <label className="text-[11px] font-semibold text-slate-400 block mb-1">
                  Select SKU
                </label>
                <select
                  value={orderSelectedProductId}
                  onChange={(e) => setOrderSelectedProductId(e.target.value)}
                  className="w-full px-2.5 py-1.5 bg-slate-900 border border-slate-800 rounded text-xs text-slate-200 focus:outline-none focus:border-emerald-500"
                >
                  {products.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.title} ({p.variantLabel}) — Avail: {p.stock} pcs (৳ {p.price})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-[11px] font-semibold text-slate-400 block mb-1">
                  Quantity
                </label>
                <input
                  type="number"
                  min="1"
                  max="50"
                  value={orderQty}
                  onChange={(e) => setOrderQty(Math.max(1, Number(e.target.value)))}
                  required
                  className="w-full px-2.5 py-1.5 bg-slate-900 border border-slate-800 rounded text-xs text-slate-200 focus:outline-none focus:border-emerald-500"
                />
              </div>
            </div>

            {selectedProduct && (
              <div className="flex items-center justify-between text-xs pt-2 border-t border-slate-800/80">
                <span className="text-slate-400">
                  SKU: <span className="font-mono text-emerald-400">{selectedProduct.sku}</span>
                </span>
                <span className="font-bold text-slate-200">
                  Total COD: ৳ {(selectedProduct.price * orderQty).toLocaleString()}
                </span>
              </div>
            )}
          </div>

          {/* Reseller Memo Code Selector */}
          <div>
            <label className="text-xs font-semibold text-slate-400 block mb-1">
              Assign Reseller Memo Template (4x6 Thermal Slip)
            </label>
            <select
              value={orderMemoCode}
              onChange={(e) => setOrderMemoCode(e.target.value)}
              className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-sm font-mono text-indigo-300 focus:outline-none focus:border-indigo-500"
            >
              {memoList.map((m) => (
                <option key={m.id} value={m.code}>
                  {m.code} — {m.resellerName} ({m.name}) {m.isDefault ? '[DEFAULT]' : ''}
                </option>
              ))}
            </select>
          </div>

          <div className="pt-2 flex justify-end gap-3 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-300"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-xs font-semibold text-white shadow-sm flex items-center gap-1.5"
            >
              <Sparkles className="h-4 w-4" />
              <span>Save & Reserve Stock</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
