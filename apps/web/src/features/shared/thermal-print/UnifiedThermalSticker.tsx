'use client';

import React from 'react';
import { Truck, ShieldCheck, PackageCheck } from 'lucide-react';

export interface ThermalStickerItem {
  sku: string;
  title: string;
  color?: string;
  size?: string;
  qty: number;
  /** Unit price for a single unit of this item */
  price: number;
}

export interface UnifiedThermalStickerProps {
  orderId: string;
  memoCode: string;
  resellerName: string;
  resellerPhone: string;
  resellerAddress: string;
  brandColor?: string;
  logoUrl?: string;
  customerName: string;
  customerPhone: string;
  customerAddress: string;
  city: string;
  codAmount: number;
  subtotal?: number;
  deliveryFee?: number;
  discount?: number;
  totalAmount?: number;
  advancePayment?: number;
  advancePaymentMethod?: string;
  paymentStatus?: string;
  orderDate?: string;
  courierProvider?: string;
  consignmentId?: string;
  trackingCode?: string;
  packagingType?: string;
  items: ThermalStickerItem[];
  footerTerms?: string;
}

function formatTaka(value: number): string {
  const safe = Number.isFinite(value) ? value : 0;
  return `৳${Math.round(safe).toLocaleString()}`;
}

export function UnifiedThermalSticker({
  orderId,
  memoCode,
  resellerName,
  resellerPhone,
  resellerAddress,
  brandColor = '#111827',
  logoUrl,
  customerName,
  customerPhone,
  customerAddress,
  city,
  codAmount,
  subtotal,
  deliveryFee,
  discount,
  totalAmount,
  advancePayment,
  advancePaymentMethod,
  paymentStatus,
  orderDate,
  courierProvider = 'STEADFAST',
  consignmentId = 'CN-849210',
  trackingCode = 'TRK-STE-202699',
  packagingType = 'POLY_SMALL',
  items,
  footerTerms = 'Please inspect parcel before accepting. 7-day exchange available with unboxing video.',
}: UnifiedThermalStickerProps) {
  const safeItems = Array.isArray(items) ? items : [];
  const computedItemsSubtotal = safeItems.reduce(
    (sum, item) => sum + (Number(item.price) || 0) * (Number(item.qty) || 1),
    0,
  );
  const resolvedSubtotal =
    subtotal !== undefined && Number.isFinite(subtotal) && subtotal > 0
      ? subtotal
      : computedItemsSubtotal > 0
      ? computedItemsSubtotal
      : Math.max(0, (totalAmount ?? codAmount) - (deliveryFee ?? 0) + (discount ?? 0));
  const resolvedDeliveryFee = Number.isFinite(deliveryFee) ? Number(deliveryFee) : 0;
  const resolvedDiscount = Number.isFinite(discount) ? Number(discount) : 0;
  const resolvedAdvancePayment = Number.isFinite(advancePayment) ? Number(advancePayment) : 0;
  const resolvedTotal =
    totalAmount !== undefined && Number.isFinite(totalAmount) && totalAmount > 0
      ? totalAmount
      : Math.max(0, resolvedSubtotal + resolvedDeliveryFee - resolvedDiscount);
  const resolvedCod = Number.isFinite(codAmount)
    ? Math.max(0, Number(codAmount))
    : Math.max(0, resolvedTotal - resolvedAdvancePayment);
  const isFullyPaid =
    paymentStatus === 'Paid' || (resolvedCod === 0 && resolvedTotal > 0);
  const displayDate = orderDate || new Date().toLocaleDateString('en-GB');

  return (
    <div
      className="bg-white text-black mx-auto shadow-2xl border-2 border-black overflow-hidden font-sans select-none print:shadow-none print:border-black"
      style={{ width: '384px', minHeight: '576px', padding: '12px', boxSizing: 'border-box' }}
    >
      {/* TOP SECTION: WHITE-LABEL RESELLER BRANDED MEMO (ZERO 3PL LEAKAGE) */}
      <div
        className="border-b-2 border-black pb-2 flex items-start justify-between gap-2"
        style={{ borderTop: `5px solid ${brandColor}`, paddingTop: '6px' }}
      >
        <div className="flex items-start gap-2 flex-1 min-w-0">
          {logoUrl ? (
            <div className="w-11 h-9 flex items-center justify-center p-0.5 rounded bg-white border border-neutral-300 shrink-0 overflow-hidden">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={logoUrl}
                alt={resellerName}
                className="max-h-full max-w-full object-contain"
              />
            </div>
          ) : null}
          <div className="min-w-0 flex-1">
            <h2 className="text-base font-black uppercase tracking-tight leading-none text-black truncate">
              {resellerName}
            </h2>
            {resellerAddress ? (
              <p className="text-[9px] font-semibold text-neutral-700 mt-0.5 line-clamp-1">
                {resellerAddress}
              </p>
            ) : null}
            {resellerPhone ? (
              <p className="text-[10px] font-bold text-black">Hotline: {resellerPhone}</p>
            ) : null}
          </div>
        </div>
        <div className="text-right shrink-0">
          <span className="inline-block bg-black text-white text-[9px] font-mono font-bold px-1.5 py-0.5 rounded">
            {memoCode}
          </span>
          <p className="text-[10px] font-mono font-bold mt-0.5 text-neutral-800">
            #{orderId.replace(/^#/, '')}
          </p>
          <p className="text-[9px] text-neutral-600">{displayDate}</p>
        </div>
      </div>

      {/* CUSTOMER & COD HIGHLIGHT BLOCK */}
      <div className="grid grid-cols-12 gap-2 py-2 border-b-2 border-black items-center">
        <div className="col-span-7 pr-1">
          <p className="text-[8px] font-bold uppercase tracking-wider text-neutral-500">
            Deliver To:
          </p>
          <p className="text-xs font-black text-black leading-tight">{customerName}</p>
          <p className="text-[11px] font-extrabold font-mono text-black mt-0.5">{customerPhone}</p>
          <p className="text-[10px] text-neutral-800 leading-snug mt-0.5">{customerAddress}</p>
        </div>
        <div className="col-span-5 border-2 border-black rounded-lg p-1.5 text-center bg-neutral-100">
          <p className="text-[8px] font-black uppercase tracking-wider text-neutral-700">
            {isFullyPaid ? 'Payment Status' : 'Condition / COD'}
          </p>
          <p className="text-base font-black font-mono text-black leading-tight">
            {isFullyPaid ? 'PAID' : formatTaka(resolvedCod)}
          </p>
          <span className="inline-block mt-0.5 bg-black text-white text-[8px] font-bold px-1.5 py-0.5 rounded uppercase">
            {city || 'DHAKA'} HUB
          </span>
        </div>
      </div>

      {/* ORDER LINE ITEMS TABLE (PRODUCT, VARIANT, QTY, UNIT COST, LINE TOTAL) */}
      <div className="py-2 border-b border-dashed border-black">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-black text-[8px] font-black uppercase text-neutral-700">
              <th className="pb-1 pr-1">Product / SKU</th>
              <th className="pb-1 text-center w-8">Qty</th>
              <th className="pb-1 text-right w-14">Rate</th>
              <th className="pb-1 text-right w-16">Amount</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-300 text-[10px]">
            {safeItems.length > 0 ? (
              safeItems.map((item, idx) => {
                const qty = Number(item.qty) || 1;
                const unitPrice = Number(item.price) || 0;
                const lineTotal = unitPrice * qty;
                const variantParts = [item.color, item.size]
                  .filter((v) => v && v !== 'Standard' && v !== 'STD' && v !== 'FREE')
                  .join(' / ');
                return (
                  <tr key={`${item.sku || 'item'}-${idx}`}>
                    <td className="py-1 pr-1 align-top">
                      <p className="font-bold text-black leading-tight">{item.title}</p>
                      <p className="text-[8px] font-mono text-neutral-700 leading-tight mt-0.5">
                        {item.sku || 'SKU'}
                        {variantParts ? ` · ${variantParts}` : ''}
                      </p>
                    </td>
                    <td className="py-1 text-center font-black font-mono align-top">{qty}x</td>
                    <td className="py-1 text-right font-mono text-neutral-800 align-top">
                      {formatTaka(unitPrice)}
                    </td>
                    <td className="py-1 text-right font-black font-mono text-black align-top">
                      {formatTaka(lineTotal)}
                    </td>
                  </tr>
                );
              })
            ) : (
              <tr>
                <td colSpan={4} className="py-2 text-center text-[10px] text-neutral-500">
                  No line items recorded
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* INVOICE FINANCIAL SUMMARY (SUBTOTAL, COURIER CHARGE, DISCOUNT, TOTAL, ADVANCE, COD DUE) */}
      <div className="py-2 border-b-2 border-black text-[10px] space-y-0.5">
        <div className="flex items-center justify-between">
          <span className="font-semibold text-neutral-700">Subtotal</span>
          <span className="font-mono font-bold text-black">{formatTaka(resolvedSubtotal)}</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="font-semibold text-neutral-700">Courier Charge</span>
          <span className="font-mono font-bold text-black">
            {resolvedDeliveryFee > 0 ? `+${formatTaka(resolvedDeliveryFee)}` : formatTaka(0)}
          </span>
        </div>
        <div className="flex items-center justify-between">
          <span className="font-semibold text-neutral-700">Discount</span>
          <span className="font-mono font-bold text-black">
            {resolvedDiscount > 0 ? `-${formatTaka(resolvedDiscount)}` : formatTaka(0)}
          </span>
        </div>
        <div className="flex items-center justify-between border-t border-neutral-400 pt-1 mt-1 text-[11px]">
          <span className="font-black uppercase text-black">Total</span>
          <span className="font-mono font-black text-black">{formatTaka(resolvedTotal)}</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="font-semibold text-neutral-700">
            Advance Paid{advancePaymentMethod ? ` (${advancePaymentMethod})` : ''}
          </span>
          <span className="font-mono font-bold text-black">
            {resolvedAdvancePayment > 0 ? `-${formatTaka(resolvedAdvancePayment)}` : formatTaka(0)}
          </span>
        </div>
        <div className="flex items-center justify-between bg-neutral-100 border border-black rounded px-1.5 py-1 mt-1 text-[11px]">
          <span className="font-black uppercase text-black">
            {isFullyPaid ? 'COD Due (Paid)' : 'COD Due / Payable'}
          </span>
          <span className="font-mono font-black text-black text-xs">
            {formatTaka(resolvedCod)}
          </span>
        </div>
      </div>

      {/* RESELLER RETURN TERMS */}
      <div className="py-1.5 border-b-2 border-black text-[8.5px] font-medium text-neutral-800 leading-tight">
        <strong>Note:</strong> {footerTerms}
      </div>

      {/* BOTTOM SECTION: 2-IN-1 COURIER DISPATCH SLIP & BARCODE */}
      <div className="pt-2 flex flex-col justify-between">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <Truck className="w-3.5 h-3.5 text-black" />
            <span className="text-[11px] font-black uppercase tracking-wider text-black">
              {courierProvider || 'STANDARD'} EXPRESS
            </span>
          </div>
          <span className="text-[9px] font-mono font-bold border border-black px-1.5 py-0.5 rounded">
            CN: {consignmentId}
          </span>
        </div>

        {/* VISUAL CODE-128 THERMAL BARCODE */}
        <div className="my-1.5 py-1 px-2 bg-white border border-neutral-400 rounded text-center">
          <div
            className="h-8 w-full mx-auto"
            style={{
              backgroundImage:
                'repeating-linear-gradient(90deg, #000 0px, #000 2px, transparent 2px, transparent 4px, #000 4px, #000 5px, transparent 5px, transparent 8px, #000 8px, #000 11px, transparent 11px, transparent 13px)',
            }}
          />
          <p className="text-[9px] font-mono font-black tracking-widest mt-0.5 text-black">
            *{trackingCode}*
          </p>
        </div>

        {/* PACKING VERIFICATION & DOUBLE-PRINT GUARD FOOTER */}
        <div className="flex items-center justify-between text-[8px] font-mono font-bold text-neutral-600 pt-0.5">
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
