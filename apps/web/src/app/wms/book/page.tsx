'use client';

import React from 'react';
import Link from 'next/link';
import {
  BookmarkCheck,
  CheckCircle2,
  Truck,
  ArrowRight,
  ExternalLink,
  ShieldCheck,
  Layers,
  Zap,
} from 'lucide-react';
import { useWms, BarcodeScannerBar } from '@/features/wms';

export default function WmsBookPage() {
  const { orders, bookCourier, bookAllByCourier, playAudio, showToast } = useWms();

  const packedOrders = orders.filter((o) => o.stage === 'PACKED');

  const steadfastOrders = packedOrders.filter((o) => o.courier === 'Steadfast');
  const pathaoOrders = packedOrders.filter((o) => o.courier === 'Pathao');
  const redxOrders = packedOrders.filter((o) => o.courier === 'RedX');

  const handleScan = (code: string) => {
    const target = packedOrders.find(
      (o) =>
        o.id.toUpperCase() === code.toUpperCase() ||
        o.sku.toUpperCase() === code.toUpperCase(),
    );

    if (target) {
      bookCourier(target.id);
    } else {
      playAudio('error');
      showToast(`Scanned code "${code}" not found in packed queue awaiting booking!`);
    }
  };

  return (
    <div className="space-y-6">
      {/* Step Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 rounded bg-amber-500/10 text-amber-400 font-mono text-[10px] font-bold border border-amber-500/30">
              PIPELINE STEP 3 OF 4
            </span>
            <span className="text-xs text-slate-400 font-mono">
              Queue: {packedOrders.length} packed parcels awaiting booking
            </span>
          </div>
          <h1 className="text-xl font-black text-white tracking-tight mt-1 flex items-center gap-2">
            <BookmarkCheck className="h-5 w-5 text-amber-400" />
            <span>Courier API Consignment Booking</span>
          </h1>
          <p className="text-xs text-slate-400">
            Transmit parcel dimensions and customer addresses to courier partner APIs to generate official tracking numbers.
          </p>
        </div>

        {packedOrders.length === 0 && (
          <Link
            href="/wms/handover"
            className="px-4 py-2 rounded-xl bg-teal-600 hover:bg-teal-500 text-white font-bold text-xs flex items-center gap-2 shadow-sm transition-all active:scale-95 self-start sm:self-auto"
          >
            <span>Proceed to Step 4: Courier Handover</span>
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        )}
      </div>

      {/* Barcode Scanner Bar */}
      <BarcodeScannerBar
        placeholder="Scan Order ID to immediately book courier consignment..."
        onScan={handleScan}
      />

      {/* Courier Fast Batch Booking Panels */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Steadfast Card */}
        <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="h-9 w-9 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center font-black text-emerald-400 text-sm">
                SF
              </div>
              <div>
                <h3 className="font-bold text-sm text-white">Steadfast Courier</h3>
                <span className="text-[10px] text-slate-400">Direct API Integration</span>
              </div>
            </div>
            <span className="font-mono text-xs font-black text-emerald-400 bg-slate-950 px-2 py-0.5 rounded border border-slate-800">
              {steadfastOrders.length} Ready
            </span>
          </div>

          <button
            onClick={() => bookAllByCourier('Steadfast')}
            disabled={steadfastOrders.length === 0}
            className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 disabled:hover:bg-emerald-600 text-white text-xs font-bold transition-all shadow-md active:scale-95 flex items-center justify-center gap-2"
          >
            <Zap className="h-3.5 w-3.5" />
            <span>Book All Steadfast ({steadfastOrders.length})</span>
          </button>
        </div>

        {/* Pathao Card */}
        <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="h-9 w-9 rounded-xl bg-rose-500/10 border border-rose-500/30 flex items-center justify-center font-black text-rose-400 text-sm">
                PT
              </div>
              <div>
                <h3 className="font-bold text-sm text-white">Pathao Logistics</h3>
                <span className="text-[10px] text-slate-400">Express Delivery Dhaka</span>
              </div>
            </div>
            <span className="font-mono text-xs font-black text-rose-400 bg-slate-950 px-2 py-0.5 rounded border border-slate-800">
              {pathaoOrders.length} Ready
            </span>
          </div>

          <button
            onClick={() => bookAllByCourier('Pathao')}
            disabled={pathaoOrders.length === 0}
            className="w-full py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 disabled:opacity-40 disabled:hover:bg-rose-600 text-white text-xs font-bold transition-all shadow-md active:scale-95 flex items-center justify-center gap-2"
          >
            <Zap className="h-3.5 w-3.5" />
            <span>Book All Pathao ({pathaoOrders.length})</span>
          </button>
        </div>

        {/* RedX Card */}
        <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="h-9 w-9 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center font-black text-amber-400 text-sm">
                RX
              </div>
              <div>
                <h3 className="font-bold text-sm text-white">RedX Logistics</h3>
                <span className="text-[10px] text-slate-400">Nationwide 64 Districts</span>
              </div>
            </div>
            <span className="font-mono text-xs font-black text-amber-400 bg-slate-950 px-2 py-0.5 rounded border border-slate-800">
              {redxOrders.length} Ready
            </span>
          </div>

          <button
            onClick={() => bookAllByCourier('RedX')}
            disabled={redxOrders.length === 0}
            className="w-full py-2.5 rounded-xl bg-amber-600 hover:bg-amber-500 disabled:opacity-40 disabled:hover:bg-amber-600 text-white text-xs font-bold transition-all shadow-md active:scale-95 flex items-center justify-center gap-2"
          >
            <Zap className="h-3.5 w-3.5" />
            <span>Book All RedX ({redxOrders.length})</span>
          </button>
        </div>
      </div>

      {/* Individual Order Booking List */}
      {packedOrders.length === 0 ? (
        <div className="p-12 text-center rounded-2xl bg-slate-900/60 border border-slate-800 space-y-3">
          <CheckCircle2 className="h-12 w-12 text-amber-400 mx-auto" />
          <h2 className="font-extrabold text-base text-white">All Packed Parcels Booked!</h2>
          <p className="text-xs text-slate-400 max-w-md mx-auto">
            All packed shipments have received their official tracking IDs from the courier APIs. They are now assembled and ready for courier driver handover.
          </p>
          <div className="pt-2">
            <Link
              href="/wms/handover"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-500 text-white font-bold text-xs shadow-lg transition-all active:scale-95"
            >
              <span>Go to Step 4: Courier Handover</span>
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider">
            Packed Parcels Waiting for Booking ({packedOrders.length})
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {packedOrders.map((order) => (
              <div
                key={order.id}
                className="p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-3 hover:border-slate-700 transition-all shadow-md"
              >
                <div className="flex items-center justify-between border-b border-slate-800/80 pb-2.5">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-black text-slate-100 bg-slate-950 px-2 py-0.5 rounded border border-slate-800">
                      {order.id}
                    </span>
                    <span className="text-xs font-bold text-emerald-400">
                      {order.courier}
                    </span>
                  </div>
                  <span className="text-[10px] text-slate-400 font-mono">
                    Packed at {order.packedAt || 'Station #01'}
                  </span>
                </div>

                <div>
                  <h4 className="font-bold text-sm text-white">{order.itemTitle}</h4>
                  <div className="text-xs text-slate-400 mt-0.5">
                    To: <span className="text-slate-200 font-semibold">{order.customer}</span> ({order.city})
                  </div>
                  <div className="mt-1 text-xs font-mono text-emerald-400 font-bold">
                    COD: ৳ {order.amount.toLocaleString()}
                  </div>
                </div>

                <div className="pt-2 flex items-center justify-between border-t border-slate-800/80">
                  <span className="text-[11px] text-slate-400">
                    Packaging: <span className="font-mono text-slate-300">{order.packagingType}</span>
                  </span>

                  <button
                    onClick={() => bookCourier(order.id)}
                    className="px-3.5 py-1.5 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-bold text-xs flex items-center gap-1.5 shadow-md active:scale-95 transition-all"
                  >
                    <BookmarkCheck className="h-3.5 w-3.5" />
                    <span>Book {order.courier}</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
