'use client';

import React from 'react';
import { CreditCard, Landmark, CheckCircle2, TrendingUp, ArrowUpRight } from 'lucide-react';

export default function AdminBillingPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Billing &amp; COD Settlement</h1>
        <p className="text-sm text-slate-400">
          Reconcile courier COD remittances, deduct warehouse storage &amp; pick-and-pack handling fees, and disburse weekly merchant settlements.
        </p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 shadow-lg">
          <div className="flex items-center justify-between">
            <span className="text-xs uppercase font-semibold text-slate-400">Gross COD Collected</span>
            <TrendingUp className="h-4 w-4 text-emerald-400" />
          </div>
          <div className="text-3xl font-bold text-emerald-400 mt-2 font-mono">৳ 4,821,500</div>
          <span className="text-xs text-slate-500 mt-1 block">Last 7 days from Steadfast &amp; Pathao</span>
        </div>

        <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 shadow-lg">
          <div className="flex items-center justify-between">
            <span className="text-xs uppercase font-semibold text-slate-400">Fulfillment &amp; Storage Fees</span>
            <CreditCard className="h-4 w-4 text-indigo-400" />
          </div>
          <div className="text-3xl font-bold text-indigo-400 mt-2 font-mono">৳ 328,400</div>
          <span className="text-xs text-slate-500 mt-1 block">Pick-and-pack &amp; shelf rental fees</span>
        </div>

        <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 shadow-lg">
          <div className="flex items-center justify-between">
            <span className="text-xs uppercase font-semibold text-slate-400">Net Merchant Payout</span>
            <Landmark className="h-4 w-4 text-emerald-400" />
          </div>
          <div className="text-3xl font-bold text-slate-100 mt-2 font-mono">৳ 4,493,100</div>
          <span className="text-xs text-emerald-400 font-semibold mt-1 block">Scheduled for Friday bank transfer</span>
        </div>
      </div>

      {/* Settlement Breakdown Table */}
      <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 shadow-lg space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-bold text-white">Active Merchant Settlement Summary</h2>
          <span className="text-xs font-mono text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-lg border border-emerald-500/25">
            Auto-Reconciliation Active
          </span>
        </div>

        <div className="rounded-xl border border-slate-800 overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-800/80 text-slate-400 uppercase tracking-wider font-semibold border-b border-slate-800">
              <tr>
                <th className="p-3.5">Merchant</th>
                <th className="p-3.5">Delivered Parcels</th>
                <th className="p-3.5">Collected COD</th>
                <th className="p-3.5">Courier Charges</th>
                <th className="p-3.5">3PL Handling</th>
                <th className="p-3.5">Payable Net</th>
                <th className="p-3.5 text-right">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800 font-mono">
              {[
                { code: 'MC-101', name: 'Urban Threads BD', count: 184, cod: 420800, courier: 22080, wms: 18400, net: 380320, status: 'READY' },
                { code: 'MC-102', name: 'Apex Footwear Store', count: 96, cod: 312000, courier: 11520, wms: 9600, net: 290880, status: 'READY' },
                { code: 'MC-103', name: 'Gadget Freak Online', count: 240, cod: 894000, courier: 28800, wms: 24000, net: 841200, status: 'PROCESSING' },
                { code: 'MC-104', name: 'Shajgoj Cosmetics Co.', count: 130, cod: 290000, courier: 15600, wms: 13000, net: 261400, status: 'READY' },
              ].map((row) => (
                <tr key={row.code} className="hover:bg-slate-800/40 transition-colors">
                  <td className="p-3.5 font-sans">
                    <span className="font-bold text-slate-200">{row.name}</span>
                    <span className="text-slate-400 block font-mono text-[11px]">{row.code}</span>
                  </td>
                  <td className="p-3.5 text-slate-300">{row.count} orders</td>
                  <td className="p-3.5 text-emerald-400 font-bold">৳{row.cod.toLocaleString()}</td>
                  <td className="p-3.5 text-rose-400">-৳{row.courier.toLocaleString()}</td>
                  <td className="p-3.5 text-indigo-400">-৳{row.wms.toLocaleString()}</td>
                  <td className="p-3.5 text-white font-bold text-sm">৳{row.net.toLocaleString()}</td>
                  <td className="p-3.5 text-right font-sans">
                    <span
                      className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${
                        row.status === 'READY'
                          ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                          : 'bg-amber-500/15 text-amber-300 border border-amber-500/30'
                      }`}
                    >
                      {row.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
