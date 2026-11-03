'use client';

import React from 'react';
import { Truck } from 'lucide-react';

export function MerchantTrackingTab() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-100 flex items-center gap-2">
          <Truck className="h-6 w-6 text-emerald-400 shrink-0" />
          <span>Steadfast & Pathao Courier Live Tracking</span>
        </h1>
        <p className="text-sm text-slate-400 mt-0.5">
          Consignment status synced automatically via courier webhook events.
        </p>
      </div>

      <div className="p-4 sm:p-6 rounded-xl bg-slate-900 border border-slate-800 space-y-4 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <span className="text-xs font-semibold text-slate-400">Consignment: CID-88491024</span>
            <h3 className="text-lg font-bold text-slate-200">Steadfast Courier Delivery</h3>
          </div>
          <span className="w-fit px-3 py-1 rounded-full text-xs font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
            IN TRANSIT
          </span>
        </div>

        <div className="border-l-2 border-emerald-500 pl-4 space-y-3 text-xs">
          <div className="flex flex-col sm:flex-row sm:gap-4 sm:items-center">
            <span className="text-slate-500 sm:w-28">10:45 AM Today</span>
            <span className="font-medium text-slate-300">Package handed over to Steadfast driver</span>
          </div>
          <div className="flex flex-col sm:flex-row sm:gap-4 sm:items-center">
            <span className="text-slate-500 sm:w-28">09:30 AM Today</span>
            <span className="font-medium text-slate-300">Packed and verified at Fulfillio Station #3</span>
          </div>
        </div>
      </div>
    </div>
  );
}
