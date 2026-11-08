'use client';

import React from 'react';
import { StockAuditLogItem } from '../types';

interface StockAuditLogTableProps {
  auditLog: StockAuditLogItem[];
}

export function StockAuditLogTable({ auditLog }: StockAuditLogTableProps) {
  return (
    <div className="rounded-2xl border border-slate-200 dark:border-white/10 bg-white dark:bg-navy-900 overflow-hidden shadow-xl">
      <div className="p-4 border-b border-slate-200 dark:border-white/10 flex items-center justify-between">
        <h3 className="font-bold text-sm sm:text-base text-navy-800 dark:text-white">
          Warehouse Stock Movement &amp; Return Restock Audit Log
        </h3>
        <span className="text-xs text-slate-600 dark:text-slate-300 tabular-nums">{auditLog.length} entries</span>
      </div>

      <div className="divide-y divide-slate-200 dark:divide-white/10">
        {auditLog.map((entry) => (
          <div
            key={entry.id}
            className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-slate-100/40 dark:hover:bg-navy-800/40 transition-colors"
          >
            <div className="space-y-1">
              <div className="flex flex-wrap items-center gap-2">
                <span className="tabular-nums text-xs font-bold text-orange-600 dark:text-orange-400">
                  {entry.fullSku}
                </span>
                <span className="px-2 py-0.5 rounded bg-slate-50 dark:bg-navy-950 border border-slate-200 dark:border-white/10 tabular-nums text-xs text-indigo-700 dark:text-indigo-300">
                  Bin: {entry.binCode}
                </span>
                <span
                  className={`px-2 py-0.5 rounded text-[11px] font-bold uppercase ${
                    entry.type === 'RTO_RESTOCK'
                      ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30'
                      : entry.type === 'DAMAGE_WRITEOFF'
                      ? 'bg-rose-500/15 text-rose-700 dark:text-rose-300 border border-rose-500/30'
                      : 'bg-sky-500/15 text-sky-700 dark:text-sky-300 border border-sky-500/30'
                  }`}
                >
                  {entry.type.replace('_', ' ')}
                </span>
                <span className="text-xs text-slate-500 dark:text-slate-400 tabular-nums">
                  Ref: {entry.referenceId} • {entry.timestamp}
                </span>
              </div>
              <div className="text-sm font-semibold text-navy-800 dark:text-white">{entry.productTitle}</div>
              <p className="text-xs text-slate-600 dark:text-slate-300">Reason: {entry.reason}</p>
            </div>

            <div className="text-right shrink-0">
              <div
                className={`text-base tabular-nums font-extrabold ${
                  entry.deltaQty >= 0 ? 'text-orange-600 dark:text-orange-400' : 'text-rose-600 dark:text-rose-400'
                }`}
              >
                {entry.deltaQty >= 0 ? `+${entry.deltaQty}` : entry.deltaQty} Units
              </div>
              <div className="text-xs tabular-nums text-slate-600 dark:text-slate-300">
                Stock: {entry.previousStock} → <strong className="text-navy-800 dark:text-white">{entry.newStock}</strong>
              </div>
            </div>
          </div>
        ))}

        {auditLog.length === 0 && (
          <div className="p-8 text-center text-slate-600 dark:text-slate-300 text-sm">
            No stock audit logs recorded yet.
          </div>
        )}
      </div>
    </div>
  );
}
