'use client';

import React from 'react';
import { StockAuditLogItem } from '../types';

interface StockAuditLogTableProps {
  auditLog: StockAuditLogItem[];
}

export function StockAuditLogTable({ auditLog }: StockAuditLogTableProps) {
  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-900 overflow-hidden shadow-xl">
      <div className="p-4 border-b border-slate-800 flex items-center justify-between">
        <h3 className="font-bold text-sm sm:text-base text-white">
          Warehouse Stock Movement &amp; Return Restock Audit Log
        </h3>
        <span className="text-xs text-slate-400 font-mono">{auditLog.length} entries</span>
      </div>

      <div className="divide-y divide-slate-800">
        {auditLog.map((entry) => (
          <div
            key={entry.id}
            className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-slate-800/40 transition-colors"
          >
            <div className="space-y-1">
              <div className="flex flex-wrap items-center gap-2">
                <span className="font-mono text-xs font-bold text-emerald-400">
                  {entry.fullSku}
                </span>
                <span className="px-2 py-0.5 rounded bg-slate-950 border border-slate-800 font-mono text-[11px] text-indigo-300">
                  Bin: {entry.binCode}
                </span>
                <span
                  className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                    entry.type === 'RTO_RESTOCK'
                      ? 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30'
                      : entry.type === 'DAMAGE_WRITEOFF'
                      ? 'bg-rose-500/15 text-rose-300 border border-rose-500/30'
                      : 'bg-sky-500/15 text-sky-300 border border-sky-500/30'
                  }`}
                >
                  {entry.type.replace('_', ' ')}
                </span>
                <span className="text-[11px] text-slate-500 font-mono">
                  Ref: {entry.referenceId} • {entry.timestamp}
                </span>
              </div>
              <div className="text-sm font-semibold text-white">{entry.productTitle}</div>
              <p className="text-xs text-slate-400">Reason: {entry.reason}</p>
            </div>

            <div className="text-right shrink-0">
              <div
                className={`text-base font-mono font-extrabold ${
                  entry.deltaQty >= 0 ? 'text-emerald-400' : 'text-rose-400'
                }`}
              >
                {entry.deltaQty >= 0 ? `+${entry.deltaQty}` : entry.deltaQty} Units
              </div>
              <div className="text-[11px] font-mono text-slate-400">
                Stock: {entry.previousStock} → <strong className="text-white">{entry.newStock}</strong>
              </div>
            </div>
          </div>
        ))}

        {auditLog.length === 0 && (
          <div className="p-8 text-center text-slate-400 text-sm">
            No stock audit logs recorded yet.
          </div>
        )}
      </div>
    </div>
  );
}
