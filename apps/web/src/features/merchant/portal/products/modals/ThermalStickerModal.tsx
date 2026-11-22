'use client';

import React, { useState, useRef } from 'react';
import { Printer, X, Check, Settings2, Sliders, Sparkles } from 'lucide-react';
import { MerchantProductItem } from '../../types';

interface ThermalStickerModalProps {
  product: MerchantProductItem | null;
  isOpen: boolean;
  onClose: () => void;
  merchantCode?: string;
}

export type StickerDimension = '40x30' | '50x30';

/**
 * Clean SVG Code 128 / Code 39 Barcode Generator
 */
function SvgBarcode({ code, width = 220, height = 48 }: { code: string; width?: number; height?: number }) {
  // Generate deterministic bar widths based on char codes
  const bars: { x: number; w: number }[] = [];
  let currentX = 10;
  const safeCode = (code || 'PRD-000').toUpperCase().replace(/[^A-Z0-9-]/g, '');

  for (let i = 0; i < safeCode.length; i++) {
    const charCode = safeCode.charCodeAt(i);
    const pattern = [
      (charCode % 3) + 1,
      ((charCode >> 1) % 2) + 1,
      ((charCode >> 2) % 3) + 1,
      ((charCode >> 3) % 2) + 1,
    ];
    for (let j = 0; j < pattern.length; j++) {
      const barWidth = pattern[j];
      if (j % 2 === 0) {
        bars.push({ x: currentX, w: barWidth * 1.5 });
      }
      currentX += barWidth * 1.5 + 1.2;
    }
    currentX += 2;
  }

  const totalWidth = Math.max(width, currentX + 10);

  return (
    <svg
      viewBox={`0 0 ${totalWidth} ${height}`}
      className="w-full h-full max-h-12 overflow-visible"
      preserveAspectRatio="xMidYMid meet"
    >
      <rect x="0" y="0" width={totalWidth} height={height} fill="transparent" />
      {bars.map((bar, idx) => (
        <rect
          key={idx}
          x={bar.x}
          y="2"
          width={bar.w}
          height={height - 4}
          fill="currentColor"
          className="text-slate-900 dark:text-white print:text-black"
        />
      ))}
    </svg>
  );
}

export function ThermalStickerModal({
  product,
  isOpen,
  onClose,
  merchantCode = 'MC-101',
}: ThermalStickerModalProps) {
  const [dimension, setDimension] = useState<StickerDimension>('50x30');
  const [showPrice, setShowPrice] = useState(true);
  const [showMerchantCode, setShowMerchantCode] = useState(true);
  const [showProductId, setShowProductId] = useState(false);
  const printAreaRef = useRef<HTMLDivElement>(null);

  if (!isOpen || !product) return null;

  const barcodeValue = product.barcode || product.sku;

  const handlePrint = () => {
    window.print();
  };

  const is50x30 = dimension === '50x30';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
      {/* Modal Dialog */}
      <div className="bg-white dark:bg-navy-900 rounded-2xl border border-slate-200 dark:border-white/10 shadow-2xl max-w-lg w-full overflow-hidden flex flex-col">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-100 dark:border-white/10 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="h-9 w-9 rounded-xl bg-orange-500/10 text-orange-600 dark:text-orange-400 flex items-center justify-center border border-orange-500/20">
              <Printer className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-sm sm:text-base font-bold text-navy-900 dark:text-white">
                Print Thermal Sticker
              </h3>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                Barcode label optimized for warehouse thermal printers
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-navy-800 transition-colors cursor-pointer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Body Content */}
        <div className="p-5 space-y-5 flex-1 overflow-y-auto">
          {/* Dimension Selector */}
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-2">
              Sticker Dimension
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setDimension('50x30')}
                className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                  is50x30
                    ? 'border-orange-500 bg-orange-50/50 dark:bg-orange-950/20 text-navy-900 dark:text-white ring-2 ring-orange-500/20'
                    : 'border-slate-200 dark:border-white/10 hover:border-slate-300 text-slate-600 dark:text-slate-300'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold text-xs">50 × 30 mm</span>
                  {is50x30 && <Check className="h-4 w-4 text-orange-600" />}
                </div>
                <p className="text-[10px] text-slate-400 mt-0.5">Standard 3PL Shipping &amp; Bin Label</p>
              </button>

              <button
                type="button"
                onClick={() => setDimension('40x30')}
                className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                  !is50x30
                    ? 'border-orange-500 bg-orange-50/50 dark:bg-orange-950/20 text-navy-900 dark:text-white ring-2 ring-orange-500/20'
                    : 'border-slate-200 dark:border-white/10 hover:border-slate-300 text-slate-600 dark:text-slate-300'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold text-xs">40 × 30 mm</span>
                  {!is50x30 && <Check className="h-4 w-4 text-orange-600" />}
                </div>
                <p className="text-[10px] text-slate-400 mt-0.5">Compact Tag (Apparel &amp; Small Items)</p>
              </button>
            </div>
          </div>

          {/* Configurable Elements */}
          <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-navy-950/60 border border-slate-200/80 dark:border-white/10 space-y-2">
            <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block mb-1">
              Sticker Layout Options
            </span>
            <div className="grid grid-cols-3 gap-2">
              <label className="flex items-center gap-2 text-xs text-slate-700 dark:text-slate-300 cursor-pointer">
                <input
                  type="checkbox"
                  checked={showPrice}
                  onChange={(e) => setShowPrice(e.target.checked)}
                  className="rounded border-slate-300 text-orange-600 focus:ring-orange-500"
                />
                <span>Price (৳)</span>
              </label>

              <label className="flex items-center gap-2 text-xs text-slate-700 dark:text-slate-300 cursor-pointer">
                <input
                  type="checkbox"
                  checked={showMerchantCode}
                  onChange={(e) => setShowMerchantCode(e.target.checked)}
                  className="rounded border-slate-300 text-orange-600 focus:ring-orange-500"
                />
                <span>Merchant</span>
              </label>

              <label className="flex items-center gap-2 text-xs text-slate-700 dark:text-slate-300 cursor-pointer">
                <input
                  type="checkbox"
                  checked={showProductId}
                  onChange={(e) => setShowProductId(e.target.checked)}
                  className="rounded border-slate-300 text-orange-600 focus:ring-orange-500"
                />
                <span>Internal ID</span>
              </label>
            </div>
          </div>

          {/* Sticker Live Preview Surface */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                Sticker Preview ({is50x30 ? '50×30 mm' : '40×30 mm'})
              </span>
              <span className="text-[10px] font-mono text-slate-400">Scale: 100% 203 DPI</span>
            </div>

            <div className="p-6 rounded-xl bg-slate-100 dark:bg-navy-950 flex items-center justify-center border border-slate-200/70 dark:border-white/10">
              {/* THE STICKER ELEMENT (Print target) */}
              <div
                ref={printAreaRef}
                id="thermal-sticker-print-area"
                className={`bg-white text-slate-900 p-2.5 rounded-md shadow-md border border-slate-300 flex flex-col justify-between overflow-hidden print:shadow-none print:border-none ${
                  is50x30 ? 'w-64 h-38' : 'w-52 h-38'
                }`}
              >
                {/* Top Row: Merchant Code & Price */}
                <div className="flex items-center justify-between text-[10px] font-mono font-bold leading-tight border-b border-slate-200 pb-1">
                  {showMerchantCode && (
                    <span className="bg-slate-100 px-1 rounded text-slate-800">
                      {merchantCode}
                    </span>
                  )}
                  {showPrice && (
                    <span className="text-right font-extrabold text-[11px] text-slate-900 ml-auto">
                      ৳{product.price.toLocaleString()}
                    </span>
                  )}
                </div>

                {/* Product Title */}
                <div className="my-1">
                  <p className="text-[10px] font-bold text-slate-900 line-clamp-1 leading-snug">
                    {product.title}
                  </p>
                  <p className="text-[9px] font-mono text-slate-500">
                    SKU: {product.sku}
                  </p>
                </div>

                {/* Barcode Graphic */}
                <div className="flex-1 flex flex-col items-center justify-center min-h-[36px] my-0.5">
                  <SvgBarcode code={barcodeValue} width={is50x30 ? 200 : 160} height={32} />
                  <span className="text-[9px] font-mono font-bold tracking-widest text-slate-800 mt-0.5">
                    {barcodeValue}
                  </span>
                </div>

                {/* Bottom Row: Optional Internal ID / Bin */}
                {showProductId && (
                  <div className="text-[8px] font-mono text-slate-400 text-center border-t border-slate-100 pt-0.5">
                    ID: {product.id} • Bin: {product.bin || 'Unassigned'}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-4 border-t border-slate-100 dark:border-white/10 bg-slate-50 dark:bg-navy-950 flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl border border-slate-200 dark:border-white/10 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100 transition-colors cursor-pointer"
          >
            Cancel
          </button>

          <button
            type="button"
            onClick={handlePrint}
            className="px-5 py-2 rounded-xl bg-orange-600 hover:bg-orange-500 text-white text-xs font-bold shadow-md shadow-orange-500/20 transition-all flex items-center gap-2 cursor-pointer active:scale-[0.98]"
          >
            <Printer className="h-4 w-4" />
            <span>Print Sticker</span>
          </button>
        </div>
      </div>

      {/* Print-specific style */}
      <style jsx global>{`
        @media print {
          body * {
            visibility: hidden !important;
          }
          #thermal-sticker-print-area,
          #thermal-sticker-print-area * {
            visibility: visible !important;
          }
          #thermal-sticker-print-area {
            position: absolute !important;
            left: 0 !important;
            top: 0 !important;
            width: ${is50x30 ? '50mm' : '40mm'} !important;
            height: 30mm !important;
            margin: 0 !important;
            padding: 2mm !important;
            background: white !important;
            color: black !important;
            box-shadow: none !important;
            border: none !important;
          }
          @page {
            size: ${is50x30 ? '50mm 30mm' : '40mm 30mm'};
            margin: 0;
          }
        }
      `}</style>
    </div>
  );
}
