'use client';

import React, { useState } from 'react';
import { Modal } from '@/components/admin/AdminModal';
import { CourierPartner, WarehousePipelineOrder } from '../../types';
import { PRODUCT_CATALOG, RESELLER_MEMOS } from '../../mockData';

interface CreateOrderModalProps {
  isOpen: boolean;
  onClose: () => void;
  ordersCount: number;
  onCreateOrder: (order: WarehousePipelineOrder) => void;
}

export function CreateOrderModal({
  isOpen,
  onClose,
  ordersCount,
  onCreateOrder,
}: CreateOrderModalProps) {
  const [newCustomerName, setNewCustomerName] = useState('');
  const [newCustomerPhone, setNewCustomerPhone] = useState('');
  const [newCustomerAddress, setNewCustomerAddress] = useState('');
  const [newCity, setNewCity] = useState('Dhaka');
  const [newSku, setNewSku] = useState(PRODUCT_CATALOG[0].sku);
  const [newQty, setNewQty] = useState(1);
  const [newMemoCode, setNewMemoCode] = useState(RESELLER_MEMOS[0].code);
  const [newCourier, setNewCourier] = useState<CourierPartner>('Steadfast');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCustomerName.trim() || !newCustomerPhone.trim() || !newCustomerAddress.trim()) {
      return;
    }
    const product = PRODUCT_CATALOG.find((p) => p.sku === newSku) || PRODUCT_CATALOG[0];
    const memo = RESELLER_MEMOS.find((m) => m.code === newMemoCode) || RESELLER_MEMOS[0];
    const nextOrderNum = 9833 + ordersCount;

    const created: WarehousePipelineOrder = {
      id: `ORD-${nextOrderNum}`,
      createdAt: 'Just now',
      merchantCode: product.merchantCode,
      merchantName: product.merchantName,
      customerName: newCustomerName.trim(),
      customerPhone: newCustomerPhone.trim(),
      customerAddress: newCustomerAddress.trim(),
      city: newCity,
      productTitle: product.title,
      productImage: product.productImage,
      bin: product.bin,
      color: product.color,
      size: product.size,
      sku: product.sku,
      qty: newQty,
      stockAvailable: Math.max(0, product.stock - newQty),
      memoCode: memo.code,
      resellerName: memo.resellerName,
      resellerPhone: memo.phone,
      resellerAddress: memo.address,
      codAmount: product.price * newQty,
      courier: newCourier,
      stage: 'PICK',
    };

    onCreateOrder(created);
    setNewCustomerName('');
    setNewCustomerPhone('');
    setNewCustomerAddress('');
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Create Manual Order"
      subtitle="Select product variant (Color/Size/Bin) and Reseller Memo Code. In-stock orders go directly to Pick List."
      size="md"
    >
      <form onSubmit={handleSubmit} className="space-y-4 text-xs">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block font-bold text-slate-700 dark:text-slate-200 mb-1">Customer Name</label>
            <input
              type="text"
              required
              value={newCustomerName}
              onChange={(e) => setNewCustomerName(e.target.value)}
              placeholder="e.g. Tanvir Hasan"
              className="w-full rounded-xl bg-slate-50 dark:bg-navy-950 border border-slate-200 dark:border-white/10 px-3 py-2 text-navy-800 dark:text-white focus:outline-none focus:border-orange-500"
            />
          </div>
          <div>
            <label className="block font-bold text-slate-700 dark:text-slate-200 mb-1">Phone Number</label>
            <input
              type="text"
              required
              value={newCustomerPhone}
              onChange={(e) => setNewCustomerPhone(e.target.value)}
              placeholder="e.g. 01712-889900"
              className="w-full rounded-xl bg-slate-50 dark:bg-navy-950 border border-slate-200 dark:border-white/10 px-3 py-2 text-navy-800 dark:text-white focus:outline-none focus:border-orange-500"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="sm:col-span-2">
            <label className="block font-bold text-slate-700 dark:text-slate-200 mb-1">Delivery Address</label>
            <input
              type="text"
              required
              value={newCustomerAddress}
              onChange={(e) => setNewCustomerAddress(e.target.value)}
              placeholder="House, Road, Area"
              className="w-full rounded-xl bg-slate-50 dark:bg-navy-950 border border-slate-200 dark:border-white/10 px-3 py-2 text-navy-800 dark:text-white focus:outline-none focus:border-orange-500"
            />
          </div>
          <div>
            <label className="block font-bold text-slate-700 dark:text-slate-200 mb-1">City</label>
            <select
              value={newCity}
              onChange={(e) => setNewCity(e.target.value)}
              aria-label="City"
              className="w-full rounded-xl bg-slate-50 dark:bg-navy-950 border border-slate-200 dark:border-white/10 px-3 py-2 text-navy-800 dark:text-white focus:outline-none focus:border-orange-500"
            >
              <option value="Dhaka">Dhaka</option>
              <option value="Chattogram">Chattogram</option>
              <option value="Sylhet">Sylhet</option>
              <option value="Khulna">Khulna</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="sm:col-span-2">
            <label className="block font-bold text-slate-700 dark:text-slate-200 mb-1">
              Product Variant (2-Part SKU · Bin · Stock)
            </label>
            <select
              value={newSku}
              onChange={(e) => setNewSku(e.target.value)}
              aria-label="Product SKU Variant"
              className="w-full rounded-xl bg-slate-50 dark:bg-navy-950 border border-slate-200 dark:border-white/10 px-3 py-2 text-navy-800 dark:text-white focus:outline-none focus:border-orange-500"
            >
              {PRODUCT_CATALOG.map((p) => (
                <option key={p.sku} value={p.sku}>
                  {p.sku} — {p.title} ({p.color}/{p.size}) · Bin: {p.bin} · Stock: {p.stock}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block font-bold text-slate-700 dark:text-slate-200 mb-1">Quantity</label>
            <input
              type="number"
              min={1}
              max={20}
              value={newQty}
              onChange={(e) => setNewQty(Math.max(1, Number(e.target.value)))}
              className="w-full rounded-xl bg-slate-50 dark:bg-navy-950 border border-slate-200 dark:border-white/10 px-3 py-2 text-navy-800 dark:text-white focus:outline-none focus:border-orange-500"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block font-bold text-slate-700 dark:text-slate-200 mb-1">
              Reseller Memo Code (4x6&quot; Branded Slip)
            </label>
            <select
              value={newMemoCode}
              onChange={(e) => setNewMemoCode(e.target.value)}
              aria-label="Reseller Memo Template Code"
              className="w-full rounded-xl bg-slate-50 dark:bg-navy-950 border border-slate-200 dark:border-white/10 px-3 py-2 text-navy-800 dark:text-white focus:outline-none focus:border-orange-500"
            >
              {RESELLER_MEMOS.map((m) => (
                <option key={m.code} value={m.code}>
                  {m.code} — {m.resellerName}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block font-bold text-slate-700 dark:text-slate-200 mb-1">Courier Partner</label>
            <select
              value={newCourier}
              onChange={(e) => setNewCourier(e.target.value as CourierPartner)}
              aria-label="Courier Partner"
              className="w-full rounded-xl bg-slate-50 dark:bg-navy-950 border border-slate-200 dark:border-white/10 px-3 py-2 text-navy-800 dark:text-white focus:outline-none focus:border-orange-500"
            >
              <option value="Steadfast">Steadfast</option>
              <option value="Pathao">Pathao</option>
              <option value="RedX">RedX</option>
            </select>
          </div>
        </div>

        <div className="flex justify-end gap-2 pt-3 border-t border-slate-200 dark:border-white/10">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-navy-800 hover:bg-slate-200 dark:hover:bg-navy-700 text-slate-700 dark:text-slate-200 font-semibold cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="px-4 py-2 rounded-xl bg-orange-600 hover:bg-orange-700 text-white font-bold cursor-pointer"
          >
            Create &amp; Send to Pick List
          </button>
        </div>
      </form>
    </Modal>
  );
}
