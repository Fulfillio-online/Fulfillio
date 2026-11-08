'use client';

import React from 'react';
import { Building2 } from 'lucide-react';
import { MerchantSummaryRow } from '../types';

interface MerchantDeliverySummaryTableProps {
  rows: MerchantSummaryRow[];
  selectedMerchant: string;
  onSelectMerchant: (code: string) => void;
}

export function MerchantDeliverySummaryTable({
  rows,
  selectedMerchant,
  onSelectMerchant,
}: MerchantDeliverySummaryTableProps) {
  return (
    <div className="bg-white dark:bg-navy-900 border border-slate-200 dark:border-white/10 rounded-2xl overflow-hidden shadow-xl">
      <div className="px-5 py-4 border-b border-slate-200 dark:border-white/10 flex flex-wrap items-center justify-between gap-3 bg-slate-50/50 dark:bg-navy-950/50">
        <div>
          <h3 className="text-sm sm:text-base font-bold text-navy-800 dark:text-white flex items-center gap-2">
            <Building2 className="w-4 h-4 text-orange-600 dark:text-orange-400" />
            <span>Merchant-Wise Dispatch &amp; Delivery Summary</span>
          </h3>
          <p className="text-xs text-slate-600 dark:text-slate-300 mt-0.5">
            Click any merchant row below to filter the detailed dispatched orders table for that merchant
          </p>
        </div>
        {selectedMerchant !== 'ALL' && (
          <button
            type="button"
            onClick={() => onSelectMerchant('ALL')}
            className="px-3 py-1.5 rounded-lg bg-emerald-500/15 border border-emerald-500/30 text-xs font-semibold text-emerald-700 dark:text-emerald-300 hover:bg-emerald-500/25 cursor-pointer"
          >
            Showing {selectedMerchant} · Click to Show All Merchants
          </button>
        )}
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse min-w-[780px]">
          <thead>
            <tr className="border-b border-slate-200 dark:border-white/10 text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-300 bg-slate-50/60 dark:bg-navy-950/60">
              <th className="py-3 px-4">Merchant</th>
              <th className="py-3 px-4 text-center">Orders Dispatched</th>
              <th className="py-3 px-4 text-center">Product Units Sent</th>
              <th className="py-3 px-4 text-center">In Transit</th>
              <th className="py-3 px-4 text-center">Delivered</th>
              <th className="py-3 px-4 text-center">Returned / RTO</th>
              <th className="py-3 px-4 text-right">Dispatched COD Value</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200/80 dark:divide-white/10 text-sm">
            {rows.map((row) => {
              const isSelected = selectedMerchant === row.code;
              return (
                <tr
                  key={row.code}
                  onClick={() => onSelectMerchant(row.code)}
                  className={`cursor-pointer transition-colors ${
                    isSelected
                      ? 'bg-emerald-500/10 hover:bg-emerald-500/15'
                      : 'hover:bg-slate-100/50 dark:hover:bg-navy-800/50'
                  }`}
                >
                  <td className="py-3.5 px-4">
                    <div className="flex items-center gap-2.5">
                      <span className="px-2.5 py-1 rounded-lg bg-slate-50 dark:bg-navy-950 border border-slate-200 dark:border-white/10 tabular-nums text-xs font-bold text-orange-600 dark:text-orange-400">
                        {row.code}
                      </span>
                      <span className="font-semibold text-navy-800 dark:text-white">{row.name}</span>
                      {isSelected && (
                        <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30">
                          Filtered
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="py-3.5 px-4 text-center tabular-nums font-bold text-navy-800 dark:text-white">
                    {row.dispatchedOrders}
                  </td>
                  <td className="py-3.5 px-4 text-center">
                    <span className="px-2.5 py-0.5 rounded-md bg-slate-50 dark:bg-navy-950 border border-slate-200 dark:border-white/10 tabular-nums text-xs font-semibold text-orange-700 dark:text-orange-300">
                      {row.totalQty} pcs
                    </span>
                  </td>
                  <td className="py-3.5 px-4 text-center tabular-nums font-semibold text-sky-600 dark:text-sky-400">
                    {row.inTransit}
                  </td>
                  <td className="py-3.5 px-4 text-center tabular-nums font-semibold text-orange-600 dark:text-orange-400">
                    {row.delivered}
                  </td>
                  <td className="py-3.5 px-4 text-center tabular-nums font-semibold text-rose-600 dark:text-rose-400">
                    {row.returned}
                  </td>
                  <td className="py-3.5 px-4 text-right tabular-nums font-bold text-navy-800 dark:text-white">
                    ৳{row.totalCodValue.toLocaleString()}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
