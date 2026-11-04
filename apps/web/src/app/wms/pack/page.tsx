'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  Printer,
  CheckCircle2,
  Package,
  ArrowRight,
  ShieldCheck,
  Check,
  Eye,
  Box,
} from 'lucide-react';
import { useWms, BarcodeScannerBar, WmsOrder } from '@/features/wms';

const PACKAGING_OPTIONS = [
  { id: 'POLY_SMALL', name: 'Polybag Small', cost: '৳ 5' },
  { id: 'POLY_LARGE', name: 'Polybag Large', cost: '৳ 8' },
  { id: 'BOX_MEDIUM', name: 'Box Medium (Carton)', cost: '৳ 22' },
  { id: 'BOX_LARGE', name: 'Box Large (Carton)', cost: '৳ 35' },
];

export default function WmsPackPage() {
  const { orders, packAndPrintOrder, setActivePrintOrder, playAudio, showToast } = useWms();
  const [selectedPackTypes, setSelectedPackTypes] = useState<Record<string, string>>({});

  const packList = orders.filter((o) => o.stage === 'PICKED');

  const handleSelectPackaging = (orderId: string, pkgId: string) => {
    setSelectedPackTypes((prev) => ({ ...prev, [orderId]: pkgId }));
  };

  const handleScan = (code: string) => {
    const target = packList.find(
      (o) =>
        o.id.toUpperCase() === code.toUpperCase() ||
        o.sku.toUpperCase() === code.toUpperCase(),
    );

    if (target) {
      const pkg = selectedPackTypes[target.id] || 'POLY_LARGE';
      packAndPrintOrder(target.id, pkg);
    } else {
      playAudio('error');
      showToast(`Scanned code "${code}" not found in Picked orders awaiting pack!`);
    }
  };

  const handlePack = (order: WmsOrder) => {
    const pkg = selectedPackTypes[order.id] || 'POLY_LARGE';
    packAndPrintOrder(order.id, pkg);
  };

  const handlePreviewSlip = (order: WmsOrder) => {
    setActivePrintOrder(order);
  };

  return (
    <div className="space-y-5">
      {/* Step Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 rounded bg-indigo-500/10 text-indigo-400 font-mono text-[10px] font-bold border border-indigo-500/30">
              PIPELINE STEP 2 OF 4
            </span>
            <span className="text-xs text-slate-400 font-mono">
              Queue: {packList.length} orders awaiting pack &amp; print
            </span>
          </div>
          <h1 className="text-xl font-black text-white tracking-tight mt-1 flex items-center gap-2">
            <Printer className="h-5 w-5 text-indigo-400" />
            <span>Packing Desk &amp; Thermal Memo Printing</span>
          </h1>
          <p className="text-xs text-slate-400">
            Verify picked items, seal inside polybag/box, and print reseller branded 4x6 thermal slips.
          </p>
        </div>

        {packList.length === 0 && (
          <Link
            href="/wms/book"
            className="px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-bold text-xs flex items-center gap-2 shadow-sm transition-all active:scale-95 self-start sm:self-auto"
          >
            <span>Proceed to Step 3: Courier Booking</span>
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        )}
      </div>

      {/* Barcode Scanner Bar */}
      <BarcodeScannerBar
        placeholder="Scan picked item SKU or Order ID to auto-pack & print 4x6 Memo..."
        onScan={handleScan}
      />

      {/* Packing Queue */}
      {packList.length === 0 ? (
        <div className="p-12 text-center rounded-2xl bg-slate-900/60 border border-slate-800 space-y-3">
          <CheckCircle2 className="h-12 w-12 text-indigo-400 mx-auto" />
          <h2 className="font-extrabold text-base text-white">All Picked Items Packed!</h2>
          <p className="text-xs text-slate-400 max-w-md mx-auto">
            Great job! All orders collected from shelves have been verified, packaged, and their thermal invoices printed. They are now waiting for courier API booking.
          </p>
          <div className="pt-2">
            <Link
              href="/wms/book"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-bold text-xs shadow-lg transition-all active:scale-95"
            >
              <span>Go to Step 3: Courier Booking</span>
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {packList.map((order) => {
            const currentPkg = selectedPackTypes[order.id] || 'POLY_LARGE';

            return (
              <div
                key={order.id}
                className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-4 shadow-md hover:border-slate-700 transition-all"
              >
                {/* Header: Order ID & Dynamic Memo Code */}
                <div className="flex items-center justify-between border-b border-slate-800/80 pb-3">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-sm font-black text-slate-100 bg-slate-950 px-2.5 py-1 rounded-lg border border-slate-800">
                      {order.id}
                    </span>
                    <span className="text-xs text-slate-400">
                      via <span className="text-slate-200 font-semibold">{order.courier} Express</span>
                    </span>
                  </div>

                  <span className="font-mono text-xs font-bold px-2.5 py-1 rounded-lg bg-indigo-500/10 text-indigo-400 border border-indigo-500/30">
                    {order.memoCode}
                  </span>
                </div>

                {/* Items & Customer Details */}
                <div className="space-y-2">
                  <div>
                    <h3 className="font-extrabold text-base text-white leading-tight">
                      {order.itemTitle}
                    </h3>
                    <div className="flex flex-wrap items-center gap-2 mt-1">
                      <span className="text-xs font-semibold px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">
                        {order.variant}
                      </span>
                      <span className="text-xs font-mono text-slate-400">
                        SKU: <span className="text-slate-200 font-bold">{order.sku}</span>
                      </span>
                      <span className="text-xs font-extrabold text-emerald-400">
                        Qty: {order.qty} pcs
                      </span>
                    </div>
                  </div>

                  {/* Customer Delivery Information */}
                  <div className="p-3 rounded-xl bg-slate-950 border border-slate-800/80 text-xs space-y-1">
                    <div className="flex justify-between">
                      <span className="text-slate-400">Recipient:</span>
                      <span className="font-bold text-slate-200">{order.customer}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Phone &amp; Address:</span>
                      <span className="font-medium text-slate-300 text-right">
                        {order.phone} • {order.address}, {order.city}
                      </span>
                    </div>
                    <div className="flex justify-between pt-1 border-t border-slate-800/60 font-semibold">
                      <span className="text-slate-400">COD Total:</span>
                      <span className="font-mono text-emerald-400 font-bold">
                        ৳ {order.amount.toLocaleString()}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Packaging Type Selector */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                    <Box className="h-3.5 w-3.5 text-indigo-400" />
                    <span>Select Packaging Material:</span>
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    {PACKAGING_OPTIONS.map((pkg) => (
                      <button
                        key={pkg.id}
                        type="button"
                        onClick={() => handleSelectPackaging(order.id, pkg.id)}
                        className={`p-2 rounded-xl border text-left text-xs transition-all ${
                          currentPkg === pkg.id
                            ? 'bg-indigo-950/40 border-indigo-500/60 text-white shadow-sm'
                            : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
                        }`}
                      >
                        <span className="font-bold block leading-tight text-[11px]">
                          {pkg.name}
                        </span>
                        <span className="text-[10px] text-slate-500 font-mono">{pkg.cost}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Action Buttons: Preview Slip & Pack + Print */}
                <div className="pt-2 flex items-center justify-between gap-2 border-t border-slate-800/80">
                  <button
                    onClick={() => handlePreviewSlip(order)}
                    className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-xs font-semibold flex items-center gap-1.5 border border-slate-700 transition-colors"
                  >
                    <Eye className="h-3.5 w-3.5 text-slate-400" />
                    <span>Preview Slip</span>
                  </button>

                  <button
                    onClick={() => handlePack(order)}
                    className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs flex items-center gap-2 shadow-lg active:scale-95 transition-all"
                  >
                    <Printer className="h-4 w-4" />
                    <span>Pack &amp; Print 4x6 Slip</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
