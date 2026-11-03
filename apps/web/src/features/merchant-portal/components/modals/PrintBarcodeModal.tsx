'use client';

import React, { useState } from 'react';
import { X, Printer } from 'lucide-react';
import { MerchantProductItem } from '../../types';

interface PrintBarcodeModalProps {
  product: MerchantProductItem | null;
  storeName: string;
  onClose: () => void;
  onTriggerToast: (msg: string) => void;
}

export function PrintBarcodeModal({
  product,
  storeName,
  onClose,
  onTriggerToast,
}: PrintBarcodeModalProps) {
  const [barcodeCopies, setBarcodeCopies] = useState(10);

  if (!product) return null;

  const handlePrint = () => {
    onClose();
    onTriggerToast(
      `Sent ${barcodeCopies} barcode sticker(s) for ${product.sku} to warehouse printer!`
    );
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md p-4 sm:p-6 space-y-4 shadow-2xl animate-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <Printer className="h-4 w-4 text-emerald-400" />
            <h3 className="font-bold text-base text-slate-100">Print Thermal Barcode Label</h3>
          </div>
          <button onClick={onClose} className="text-slate-500 hover:text-slate-300 p-1">
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Realistic 2x1 Inch Thermal Label Simulation */}
        <div className="bg-white text-black p-4 rounded-lg font-mono text-xs select-none shadow-xl border-2 border-slate-300 space-y-2">
          <div className="text-center border-b border-black pb-1.5">
            <span className="font-black text-sm block tracking-tight">{storeName}</span>
            <span className="text-[10px] text-gray-700 block truncate">
              {product.title} ({product.variantLabel})
            </span>
          </div>

          <div className="text-center space-y-1">
            <span className="font-black text-xs block text-black">SKU: {product.sku}</span>

            {/* Barcode visual bars */}
            <div className="py-1 flex justify-center items-center gap-[2px] h-10 overflow-hidden">
              {[4, 2, 6, 3, 5, 2, 4, 6, 2, 3, 6, 4, 3, 5, 2, 6, 3, 4, 2, 5, 3, 6, 2, 4, 5, 3, 6, 2].map(
                (w, idx) => (
                  <div key={idx} className="bg-black h-full" style={{ width: `${w}px` }} />
                )
              )}
            </div>

            <span className="font-mono text-xs font-bold tracking-widest text-black block">
              {product.barcode}
            </span>
          </div>

          <div className="border-t border-black pt-1 flex justify-between items-center text-[11px] font-bold">
            <span>PRICE: ৳ {product.price.toLocaleString()}</span>
            <span>BIN: {product.bin}</span>
          </div>
        </div>

        <div className="space-y-3 pt-2">
          <div className="flex items-center justify-between text-xs">
            <span className="text-slate-400">Label Format:</span>
            <span className="font-bold text-slate-200">2x1 Inch Thermal Sticker</span>
          </div>

          <div className="flex items-center justify-between text-xs">
            <span className="text-slate-400">Number of Copies:</span>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setBarcodeCopies(Math.max(1, barcodeCopies - 5))}
                className="px-2 py-1 rounded bg-slate-800 text-slate-300 text-xs hover:bg-slate-700"
              >
                -5
              </button>
              <span className="font-bold text-emerald-400 min-w-8 text-center font-mono">
                {barcodeCopies}
              </span>
              <button
                onClick={() => setBarcodeCopies(barcodeCopies + 5)}
                className="px-2 py-1 rounded bg-slate-800 text-slate-300 text-xs hover:bg-slate-700"
              >
                +5
              </button>
            </div>
          </div>

          <div className="pt-2 flex justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-300"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handlePrint}
              className="px-5 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-xs font-semibold text-white shadow-sm flex items-center gap-1.5"
            >
              <Printer className="h-4 w-4" />
              <span>Print Label Now</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
