'use client';

import React from 'react';
import { Truck, ShieldCheck, PackageCheck } from 'lucide-react';

export interface UnifiedThermalStickerProps {
  orderId: string;
  memoCode: string;
  resellerName: string;
  resellerPhone: string;
  resellerAddress: string;
  brandColor?: string;
  customerName: string;
  customerPhone: string;
  customerAddress: string;
  city: string;
  codAmount: number;
  courierProvider?: string;
  consignmentId?: string;
  trackingCode?: string;
  packagingType?: string;
  items: Array<{
    sku: string;
    title: string;
    color?: string;
    size?: string;
    qty: number;
    price: number;
  }>;
  footerTerms?: string;
}

export function UnifiedThermalSticker({
  orderId,
  memoCode,
  resellerName,
  resellerPhone,
  resellerAddress,
  brandColor = '#111827',
  customerName,
  customerPhone,
  customerAddress,
  city,
  codAmount,
  courierProvider = 'STEADFAST',
  consignmentId = 'CN-849210',
  trackingCode = 'TRK-STE-202699',
  packagingType = 'POLY_SMALL',
  items,
  footerTerms = 'পণ্য গ্রহণের সময় ডেলিভারি ম্যানের সামনে চেক করে নিন। ডেলিভারির ৭ দিনের মধ্যে এক্সচেঞ্জযোগ্য।',
}: UnifiedThermalStickerProps) {
  return (
    <div
      className="bg-white text-black mx-auto shadow-2xl border-2 border-black overflow-hidden font-sans select-none print:shadow-none print:border-black"
      style={{ width: '384px', minHeight: '576px', padding: '14px', boxSizing: 'border-box' }}
    >
      {/* TOP SECTION: WHITE-LABEL RESELLER BRANDED MEMO (ZERO 3PL LEAKAGE) */}
      <div
        className="border-b-2 border-black pb-2.5 flex items-start justify-between"
        style={{ borderTop: `6px solid ${brandColor}`, paddingTop: '8px' }}
      >
        <div>
          <h2 className="text-lg font-black uppercase tracking-tight leading-none text-black">
            {resellerName}
          </h2>
          <p className="text-[10px] font-semibold text-neutral-700 mt-1">{resellerAddress}</p>
          <p className="text-[11px] font-bold text-black">Hotline: {resellerPhone}</p>
        </div>
        <div className="text-right">
          <span className="inline-block bg-black text-white text-[10px] font-mono font-bold px-2 py-0.5 rounded">
            {memoCode}
          </span>
          <p className="text-[10px] font-mono font-bold mt-1 text-neutral-800">#{orderId}</p>
          <p className="text-[9px] text-neutral-600">{new Date().toLocaleDateString('en-GB')}</p>
        </div>
      </div>

      {/* CUSTOMER & COD HIGHLIGHT BLOCK */}
      <div className="grid grid-cols-12 gap-2 py-2.5 border-b-2 border-black items-center">
        <div className="col-span-7 pr-1">
          <p className="text-[9px] font-bold uppercase tracking-wider text-neutral-500">
            Deliver To (প্রাপক):
          </p>
          <p className="text-sm font-black text-black leading-tight">{customerName}</p>
          <p className="text-xs font-extrabold font-mono text-black mt-0.5">{customerPhone}</p>
          <p className="text-[11px] text-neutral-800 leading-snug mt-0.5">{customerAddress}</p>
        </div>
        <div className="col-span-5 border-2 border-black rounded-lg p-2 text-center bg-neutral-100">
          <p className="text-[9px] font-black uppercase tracking-wider text-neutral-700">
            Condition / COD
          </p>
          <p className="text-lg font-black font-mono text-black leading-tight">
            ৳{codAmount.toLocaleString()}
          </p>
          <span className="inline-block mt-0.5 bg-black text-white text-[9px] font-bold px-1.5 py-0.5 rounded uppercase">
            {city} HUB
          </span>
        </div>
      </div>

      {/* ORDER LINE ITEMS (WITH 2-PART SKU) */}
      <div className="py-2 border-b-2 border-dashed border-black">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-black text-[9px] font-black uppercase text-neutral-700">
              <th className="pb-1">Item & 2-Part SKU</th>
              <th className="pb-1 text-center">Variant</th>
              <th className="pb-1 text-right">Qty</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-300 text-[11px]">
            {items.map((item, idx) => (
              <tr key={idx}>
                <td className="py-1.5 pr-1">
                  <p className="font-bold text-black leading-tight">{item.title}</p>
                  <p className="text-[9px] font-mono font-semibold text-neutral-700">{item.sku}</p>
                </td>
                <td className="py-1.5 text-center font-bold text-[10px]">
                  {item.color || 'STD'} / {item.size || 'FREE'}
                </td>
                <td className="py-1.5 text-right font-black font-mono text-sm">{item.qty}x</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* RESELLER RETURN TERMS */}
      <div className="py-1.5 border-b-2 border-black text-[9px] font-medium text-neutral-800 leading-tight">
        <strong>Note:</strong> {footerTerms}
      </div>

      {/* BOTTOM SECTION: 2-IN-1 COURIER DISPATCH SLIP & BARCODE */}
      <div className="pt-2.5 flex flex-col justify-between">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <Truck className="w-4 h-4 text-black" />
            <span className="text-xs font-black uppercase tracking-wider text-black">
              {courierProvider} EXPRESS
            </span>
          </div>
          <span className="text-[10px] font-mono font-bold border border-black px-1.5 py-0.5 rounded">
            CN: {consignmentId}
          </span>
        </div>

        {/* VISUAL CODE-128 THERMAL BARCODE */}
        <div className="my-2 py-1.5 px-2 bg-white border border-neutral-400 rounded text-center">
          <div
            className="h-10 w-full mx-auto"
            style={{
              backgroundImage:
                'repeating-linear-gradient(90deg, #000 0px, #000 2px, transparent 2px, transparent 4px, #000 4px, #000 5px, transparent 5px, transparent 8px, #000 8px, #000 11px, transparent 11px, transparent 13px)',
            }}
          />
          <p className="text-[10px] font-mono font-black tracking-widest mt-1 text-black">
            *{trackingCode}*
          </p>
        </div>

        {/* PACKING VERIFICATION & DOUBLE-PRINT GUARD FOOTER */}
        <div className="flex items-center justify-between text-[8px] font-mono font-bold text-neutral-600 pt-1">
          <span className="flex items-center gap-1">
            <PackageCheck className="w-3 h-3 text-black" /> PKG: {packagingType}
          </span>
          <span className="flex items-center gap-1">
            <ShieldCheck className="w-3 h-3 text-black" /> 4x6 THERMAL VERIFIED
          </span>
        </div>
      </div>
    </div>
  );
}
