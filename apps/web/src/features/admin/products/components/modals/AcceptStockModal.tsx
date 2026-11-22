'use client';

import React, { useState, useEffect } from 'react';
import { PackageCheck, MapPin, Plus, Minus, FileText, CheckCircle2 } from 'lucide-react';
import { Modal } from '@/components/admin/AdminModal';
import { WarehouseBin, WarehouseProductItem } from '../../types';

interface AcceptStockModalProps {
  isOpen: boolean;
  onClose: () => void;
  product: WarehouseProductItem | null;
  bins: WarehouseBin[];
  onConfirm: (
    productId: string,
    quantity: number,
    binCode: string,
    challanOrTracking?: string,
    note?: string
  ) => void;
}

export function AcceptStockModal({
  isOpen,
  onClose,
  product,
  bins,
  onConfirm,
}: AcceptStockModalProps) {
  const [quantity, setQuantity] = useState<number | ''>(50);
  const [selectedBin, setSelectedBin] = useState<string>('A-01-02');
  const [challanNo, setChallanNo] = useState<string>('');
  const [note, setNote] = useState<string>('Physical consignment verified and stored in warehouse');

  // Track the product ID for which the modal was initialized so state is initialized ONLY ONCE per opening
  const initializedProductIdRef = React.useRef<string | null>(null);

  useEffect(() => {
    if (isOpen && product) {
      if (initializedProductIdRef.current !== product.id) {
        initializedProductIdRef.current = product.id;

        const defaultBin =
          product.binCode &&
          product.binCode !== 'Pending Approval' &&
          product.binCode !== 'Assigned on intake'
            ? product.binCode
            : bins[0]?.code || 'A-01-02';

        setSelectedBin(defaultBin);

        // Determine starting units from variants total or product stock (fallback to 50)
        const variantQty = product.variantsList?.reduce((sum, v) => sum + (v.stock || 0), 0) || 0;
        const initialQty = variantQty > 0 ? variantQty : product.stock > 0 ? product.stock : 50;
        setQuantity(initialQty);

        // Generate a STABLE unique Inward Challan number once per opening
        const datePart = new Date().toISOString().slice(2, 10).replace(/-/g, '');
        const randomSuffix = Math.floor(1000 + Math.random() * 9000);
        setChallanNo(`INW-${datePart}-${randomSuffix}`);
        setNote('Physical consignment verified and stored in warehouse');
      }
    } else if (!isOpen) {
      initializedProductIdRef.current = null;
    }
  }, [isOpen, product?.id]);

  if (!product) return null;

  const handleDecrement = () => {
    setQuantity((prev) => {
      const current = typeof prev === 'number' ? prev : 1;
      return Math.max(1, current > 5 ? current - 5 : 1);
    });
  };

  const handleIncrement = () => {
    setQuantity((prev) => {
      const current = typeof prev === 'number' ? prev : 0;
      return current + 5;
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const finalQty = typeof quantity === 'number' && quantity > 0 ? quantity : 1;
    onConfirm(
      product.id,
      finalQty,
      selectedBin || 'A-01-02',
      challanNo.trim() || undefined,
      note.trim() || undefined
    );
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Receive Product — Inbound Stock Intake & Publish"
      size="md"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Banner Alert */}
        <div className="flex items-start gap-3 p-3.5 rounded-xl bg-orange-500/10 border border-orange-500/20">
          <div className="w-9 h-9 rounded-xl bg-orange-500/20 text-orange-600 dark:text-orange-400 flex items-center justify-center shrink-0">
            <PackageCheck className="w-5 h-5" />
          </div>
          <div className="text-xs text-slate-700 dark:text-slate-200 leading-relaxed">
            <strong>Step 2 — Receive Physical Stock &amp; Publish:</strong> Physical goods received at warehouse dock.
            Confirming intake stores stock into the selected warehouse bin and transitions the product status to <strong>Published (Active)</strong>, allowing the merchant to immediately fulfill customer orders.
          </div>
        </div>

        {/* Product Summary */}
        <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-navy-950 border border-slate-200 dark:border-white/10 flex items-center gap-3">
          <img
            src={product.imageUrl || '/placeholder.png'}
            alt={product.title}
            className="w-12 h-12 rounded-xl object-cover border border-slate-200 dark:border-white/10 shrink-0"
          />
          <div className="text-xs space-y-0.5 flex-1 min-w-0">
            <div className="font-bold text-navy-800 dark:text-white truncate">
              {product.title}
            </div>
            <div className="font-mono text-[11px] text-orange-600 dark:text-orange-400">
              {product.fullSku} · {product.merchantName} ({product.merchantCode})
            </div>
            <div className="flex items-center gap-2 text-[11px] text-slate-500 dark:text-slate-400">
              <span>
                Current Stored Stock:{' '}
                <strong className="text-navy-900 dark:text-white font-mono">
                  {product.stock || 0} pcs
                </strong>
              </span>
              <span>·</span>
              <span>
                Status:{' '}
                <strong className="text-sky-600 dark:text-sky-400">
                  {product.stock && product.stock > 0 && product.stockAccepted !== false
                    ? 'Published'
                    : 'Waiting for Stock'}
                </strong>
              </span>
            </div>
          </div>
        </div>

        {/* Quantity to Accept */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="text-xs font-bold text-slate-700 dark:text-slate-200">
              Verified Inbound Quantity to Store (Units) *
            </label>
            <span className="text-[11px] text-slate-400 font-normal">Editable units count</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleDecrement}
              className="w-10 h-10 rounded-xl bg-white dark:bg-navy-900 hover:bg-slate-100 dark:hover:bg-navy-800 border border-slate-300 dark:border-white/15 text-navy-800 dark:text-slate-100 flex items-center justify-center font-bold text-base transition-colors shrink-0 cursor-pointer select-none"
              title="Decrease quantity by 5"
            >
              <Minus className="w-4 h-4" />
            </button>
            <div className="relative flex-1">
              <input
                type="number"
                min={1}
                required
                value={quantity}
                onChange={(e) => {
                  const val = e.target.value;
                  if (val === '') {
                    setQuantity('');
                  } else {
                    const parsed = parseInt(val, 10);
                    if (!isNaN(parsed)) {
                      setQuantity(Math.max(0, parsed));
                    }
                  }
                }}
                onBlur={() => {
                  if (quantity === '' || quantity < 1) {
                    setQuantity(1);
                  }
                }}
                placeholder="Enter units count..."
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-navy-950 border border-slate-300 dark:border-white/15 text-sm tabular-nums font-bold text-orange-600 dark:text-orange-400 focus:outline-none focus:border-orange-500 pr-12"
              />
              <span className="absolute right-3.5 top-2.5 text-xs text-slate-500 dark:text-slate-400 font-semibold pointer-events-none select-none">
                pcs
              </span>
            </div>
            <button
              type="button"
              onClick={handleIncrement}
              className="w-10 h-10 rounded-xl bg-white dark:bg-navy-900 hover:bg-slate-100 dark:hover:bg-navy-800 border border-slate-300 dark:border-white/15 text-navy-800 dark:text-slate-100 flex items-center justify-center font-bold text-base transition-colors shrink-0 cursor-pointer select-none"
              title="Increase quantity by 5"
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>

          {/* Quick presets */}
          <div className="flex items-center gap-1.5 mt-2 flex-wrap">
            <span className="text-[11px] text-slate-400 font-medium">Quick Set:</span>
            {[10, 50, 100, 250, 500].map((preset) => (
              <button
                key={preset}
                type="button"
                onClick={() => setQuantity(preset)}
                className={`px-2 py-0.5 rounded-md text-[11px] font-semibold border transition-colors cursor-pointer ${
                  quantity === preset
                    ? 'bg-orange-600 text-white border-orange-600'
                    : 'bg-slate-100 dark:bg-navy-800 hover:bg-orange-50 dark:hover:bg-orange-950/40 text-slate-600 dark:text-slate-300 hover:text-orange-600 border-slate-200 dark:border-white/10'
                }`}
              >
                {preset} pcs
              </button>
            ))}
          </div>

          <span className="text-xs text-slate-500 dark:text-slate-400 mt-2 block">
            Will increase available warehouse inventory from {product.stock} to{' '}
            <strong className="text-navy-900 dark:text-white">
              {product.stock + (typeof quantity === 'number' ? quantity : 0)} pcs
            </strong>
            .
          </span>
        </div>

        {/* Warehouse Storage Bin */}
        <div>
          <label className="block text-xs font-bold text-slate-700 dark:text-slate-200 mb-1.5 flex items-center gap-1.5">
            <MapPin className="w-3.5 h-3.5 text-orange-600" />
            <span>Store into Warehouse Bin *</span>
          </label>
          <select
            value={selectedBin}
            onChange={(e) => setSelectedBin(e.target.value)}
            className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-navy-950 border border-slate-300 dark:border-white/15 text-xs font-bold text-navy-800 dark:text-slate-100 focus:outline-none focus:border-orange-500 cursor-pointer"
          >
            {bins.map((b) => (
              <option key={b.code} value={b.code}>
                Bin {b.code} — {b.zone} ({b.description || 'Fulfillment Slot'})
              </option>
            ))}
          </select>
        </div>

        {/* Consignment / Challan No */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="text-xs font-bold text-slate-700 dark:text-slate-200 flex items-center gap-1.5">
              <FileText className="w-3.5 h-3.5 text-slate-400" />
              <span>Inward Challan / Consignment Gate Pass No</span>
            </label>
            <span className="text-[10px] text-slate-400">Fixed transaction ref · Editable</span>
          </div>
          <input
            type="text"
            value={challanNo}
            onChange={(e) => setChallanNo(e.target.value)}
            placeholder="e.g. INW-261121-8402 or CHL-2026-0819"
            className="w-full px-3.5 py-2 rounded-xl bg-slate-50 dark:bg-navy-950 border border-slate-300 dark:border-white/15 text-xs text-navy-800 dark:text-slate-100 focus:outline-none focus:border-orange-500 font-mono"
          />
        </div>

        {/* Note */}
        <div>
          <label className="block text-xs font-bold text-slate-700 dark:text-slate-200 mb-1.5">
            Intake Verification Notes
          </label>
          <input
            type="text"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="e.g. Received 2 cartons intact from merchant courier"
            className="w-full px-3.5 py-2 rounded-xl bg-slate-50 dark:bg-navy-950 border border-slate-300 dark:border-white/15 text-xs text-navy-800 dark:text-slate-100 focus:outline-none focus:border-orange-500"
          />
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-200 dark:border-white/10">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-navy-800 hover:bg-slate-200 dark:hover:bg-navy-700 text-xs font-semibold text-slate-700 dark:text-slate-200 cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="px-5 py-2.5 rounded-xl bg-orange-600 hover:bg-orange-500 text-white text-xs font-bold flex items-center gap-2 shadow-lg shadow-orange-500/25 cursor-pointer active:scale-[0.98] transition-all"
          >
            <CheckCircle2 className="w-4 h-4 stroke-[2.5]" />
            <span>
              Receive Stock &amp; Publish ({typeof quantity === 'number' ? quantity : 0} pcs)
            </span>
          </button>
        </div>
      </form>
    </Modal>
  );
}
