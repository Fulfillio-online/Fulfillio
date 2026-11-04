'use client';

import React from 'react';
import { X, Printer, CheckCircle2, ShieldCheck, QrCode } from 'lucide-react';
import { WmsOrder } from '../types';

interface ThermalMemoModalProps {
  order: WmsOrder;
  onClose: () => void;
}

export function ThermalMemoModal({ order, onClose }: ThermalMemoModalProps) {
  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Modal Top Bar */}
        <div className="p-3.5 bg-slate-950 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="h-7 w-7 rounded-lg bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
              <Printer className="h-4 w-4" />
            </div>
            <div>
              <h3 className="font-bold text-xs text-slate-100">4x6 Thermal Packing Slip</h3>
              <p className="text-[10px] text-slate-400">Memo Code: {order.memoCode}</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition-all flex items-center gap-1.5 shadow-sm active:scale-95"
            >
              <Printer className="h-3.5 w-3.5" />
              <span>Print Now</span>
            </button>
            <button
              onClick={onClose}
              className="p-1 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-slate-200 transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Printable 4x6 Slip Container (White thermal paper simulation) */}
        <div className="p-4 overflow-y-auto flex-1 bg-slate-950">
          <div
            id="thermal-printable-area"
            className="w-full max-w-[340px] mx-auto bg-white text-black p-4 rounded-lg shadow-xl font-sans text-xs border border-slate-300 select-all"
          >
            {/* Header: Reseller Store Branding */}
            <div className="text-center border-b-2 border-black pb-2 mb-2">
              <div className="text-xs uppercase font-extrabold tracking-widest text-slate-700">
                Fulfillment by Fulfillio
              </div>
              <h2 className="text-base font-black tracking-tight uppercase mt-0.5">
                {order.reseller}
              </h2>
              <div className="text-[10px] text-slate-600 font-mono">
                Memo Ref: {order.memoCode} • Station: PACK-01
              </div>
            </div>

            {/* Courier & Barcode Header */}
            <div className="bg-black text-white p-2 rounded flex items-center justify-between mb-2">
              <div>
                <span className="text-[9px] uppercase font-bold tracking-wider block text-slate-300">
                  Delivery Partner
                </span>
                <span className="text-sm font-black tracking-wide">{order.courier} Express</span>
              </div>
              <div className="text-right">
                <span className="text-[9px] uppercase font-bold tracking-wider block text-slate-300">
                  Order ID
                </span>
                <span className="font-mono text-xs font-bold">{order.id}</span>
              </div>
            </div>

            {/* Barcode Mock Graphic */}
            <div className="border border-slate-300 p-2 text-center rounded mb-2">
              <div className="flex justify-center items-center gap-0.5 h-10 w-full bg-slate-100 p-1">
                {Array.from({ length: 42 }).map((_, i) => (
                  <div
                    key={i}
                    className="bg-black h-full"
                    style={{
                      width: i % 4 === 0 ? '3px' : i % 2 === 0 ? '1px' : '2px',
                    }}
                  />
                ))}
              </div>
              <span className="font-mono text-[10px] font-bold tracking-widest block mt-0.5">
                *{order.id}*
              </span>
            </div>

            {/* Customer Details */}
            <div className="border-b border-black pb-2 mb-2 text-[11px] leading-tight space-y-0.5">
              <div className="font-bold uppercase text-[10px] text-slate-500">Deliver To:</div>
              <div className="font-black text-sm">{order.customer}</div>
              <div className="font-mono font-bold text-slate-800">{order.phone}</div>
              <div className="text-slate-700 font-medium">{order.address}, {order.city}</div>
            </div>

            {/* Line Items */}
            <div className="border-b border-black pb-2 mb-2">
              <div className="flex justify-between text-[10px] font-black uppercase border-b border-slate-300 pb-1 mb-1">
                <span>Item / SKU</span>
                <span className="text-right">Qty</span>
              </div>
              <div className="flex justify-between items-start text-[11px] mb-1">
                <div>
                  <div className="font-bold">{order.itemTitle}</div>
                  <div className="text-[10px] text-slate-600 font-mono">
                    {order.variant} • {order.sku}
                  </div>
                </div>
                <div className="font-black text-xs">{order.qty}x</div>
              </div>
            </div>

            {/* COD Amount Summary */}
            <div className="bg-slate-100 p-2 rounded border border-slate-300 flex items-center justify-between mb-2">
              <div>
                <span className="text-[10px] font-bold uppercase block text-slate-600">
                  Cash on Delivery (COD)
                </span>
                <span className="text-[9px] text-slate-500">Collect from recipient</span>
              </div>
              <div className="text-right">
                <span className="text-base font-black text-black">
                  ৳ {order.amount.toLocaleString()}
                </span>
              </div>
            </div>

            {/* Footer */}
            <div className="text-center text-[9px] text-slate-500 pt-1 border-t border-slate-200">
              Printed via Fulfillio WMS • Return if unsealed or damaged
            </div>
          </div>
        </div>

        {/* Modal Bottom Close */}
        <div className="p-3 bg-slate-950 border-t border-slate-800 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}
