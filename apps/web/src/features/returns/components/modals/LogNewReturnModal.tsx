'use client';

import React, { useState } from 'react';
import { X, Plus } from 'lucide-react';
import { WarehouseReturnRecord } from '../../types';
import { WarehouseProductItem } from '@/features/products';

interface LogNewReturnModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLogReturn: (newRecord: WarehouseReturnRecord) => void;
  liveProducts: WarehouseProductItem[];
}

export function LogNewReturnModal({
  isOpen,
  onClose,
  onLogReturn,
  liveProducts,
}: LogNewReturnModalProps) {
  const [orderId, setOrderId] = useState('ORD-9849');
  const [trackingCode, setTrackingCode] = useState('SF-8842910');
  const [courier, setCourier] = useState<'Steadfast' | 'Pathao' | 'RedX'>('Steadfast');
  const [selectedSku, setSelectedSku] = useState(
    liveProducts[0]?.fullSku || 'MC-101-HOODIE-BLK-XL'
  );
  const [qty, setQty] = useState('1');
  const [reason, setReason] = useState('Customer unreachable on phone');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const product = liveProducts.find((p) => p.fullSku === selectedSku);
    const merchantCode = product?.merchantCode || 'MC-101';
    const merchantName = product?.merchantName || "Sabbir's Store";
    const productTitle = product?.title || 'Returned Warehouse Item';
    const targetBin = product?.binCode || 'A-01-02';
    const currentStock = product?.stock || 50;

    const newRecord: WarehouseReturnRecord = {
      id: `RTO-${Math.floor(500 + Math.random() * 500)}`,
      orderId: orderId.trim().toUpperCase(),
      trackingCode: trackingCode.trim().toUpperCase(),
      courier,
      merchantCode,
      merchantName,
      productTitle,
      fullSku: selectedSku,
      qty: Math.max(1, Number(qty) || 1),
      targetBin,
      currentStockSnapshot: currentStock,
      returnReason: reason.trim() || 'Courier return intake',
      status: 'PENDING_INSPECTION',
      receivedAt: 'Just now',
      imageUrl: product?.imageUrl || '',
    };

    onLogReturn(newRecord);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4 animate-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div>
            <h3 className="text-base font-bold text-white">Log Inbound Return Parcel (RTO)</h3>
            <p className="text-xs text-slate-400">
              Receive a returned parcel at the warehouse dock for inspection
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-white"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3.5 text-xs">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-slate-300 mb-1">Order ID *</label>
              <input
                type="text"
                required
                value={orderId}
                onChange={(e) => setOrderId(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white font-mono uppercase"
              />
            </div>
            <div>
              <label className="block font-bold text-slate-300 mb-1">Tracking Code *</label>
              <input
                type="text"
                required
                value={trackingCode}
                onChange={(e) => setTrackingCode(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-emerald-300 font-mono uppercase"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-slate-300 mb-1">Courier Partner *</label>
              <select
                value={courier}
                onChange={(e) => setCourier(e.target.value as any)}
                className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white"
              >
                <option value="Steadfast">Steadfast</option>
                <option value="Pathao">Pathao</option>
                <option value="RedX">RedX</option>
              </select>
            </div>
            <div>
              <label className="block font-bold text-slate-300 mb-1">Quantity Returned *</label>
              <input
                type="number"
                min={1}
                required
                value={qty}
                onChange={(e) => setQty(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white font-mono"
              />
            </div>
          </div>

          <div>
            <label className="block font-bold text-slate-300 mb-1">Product SKU *</label>
            <select
              value={selectedSku}
              onChange={(e) => setSelectedSku(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white font-mono text-xs"
            >
              {liveProducts.map((p) => (
                <option key={p.id} value={p.fullSku}>
                  {p.fullSku} — {p.title} ({p.color} / {p.size})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block font-bold text-slate-300 mb-1">Return Reason *</label>
            <input
              type="text"
              required
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white"
            />
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 font-semibold cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold cursor-pointer"
            >
              Log Return Parcel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
