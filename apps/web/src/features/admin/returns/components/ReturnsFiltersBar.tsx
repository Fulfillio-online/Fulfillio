'use client';

import React from 'react';
import { Search } from 'lucide-react';
import { ReturnStatus } from '../types';

interface ReturnsFiltersBarProps {
  scanInput: string;
  onScanInputChange: (val: string) => void;
  onScanSubmit: (e?: React.FormEvent, customCode?: string) => void;
  merchantFilter: string;
  onMerchantFilterChange: (val: string) => void;
  statusFilter: 'ALL' | ReturnStatus;
  onStatusFilterChange: (val: 'ALL' | ReturnStatus) => void;
  merchants: { code: string; name: string }[];
}

export function ReturnsFiltersBar({
  scanInput,
  onScanInputChange,
  onScanSubmit,
  merchantFilter,
  onMerchantFilterChange,
  statusFilter,
  onStatusFilterChange,
  merchants,
}: ReturnsFiltersBarProps) {
  return (
    <div className="bg-white dark:bg-navy-900 border border-slate-200 dark:border-white/10 rounded-2xl p-4 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 shadow-sm">
      {/* Search / Scan Barcode Input */}
      <form
        onSubmit={(e) => onScanSubmit(e)}
        className="flex-1 relative"
      >
        <Search className="w-4 h-4 text-slate-600 dark:text-slate-300 absolute left-3.5 top-1/2 -translate-y-1/2" />
        <input
          type="text"
          value={scanInput}
          onChange={(e) => onScanInputChange(e.target.value)}
          placeholder="Scan or enter RTO Tracking Code / Order ID (e.g. RX-9902890)..."
          className="w-full pl-10 pr-24 py-2.5 bg-slate-50 dark:bg-navy-950 border border-slate-200 dark:border-white/10 rounded-xl text-sm text-navy-800 dark:text-white placeholder-slate-500 dark:placeholder-slate-400 tabular-nums focus:outline-none focus:border-orange-500"
        />
        <button
          type="submit"
          className="absolute right-1.5 top-1/2 -translate-y-1/2 px-3 py-1 rounded-lg bg-orange-600 hover:bg-orange-700 text-xs font-bold text-white shadow transition-colors cursor-pointer"
        >
          Scan
        </button>
      </form>

      {/* Filter Selectors */}
      <div className="flex items-center gap-2">
        <select
          value={merchantFilter}
          onChange={(e) => onMerchantFilterChange(e.target.value)}
          aria-label="Filter by Merchant"
          className="px-3.5 py-2.5 bg-slate-50 dark:bg-navy-950 border border-slate-200 dark:border-white/10 rounded-xl text-xs font-semibold text-navy-800 dark:text-slate-100 focus:outline-none focus:border-orange-500"
        >
          <option value="ALL">All Merchants</option>
          {merchants.map((m) => (
            <option key={m.code} value={m.code}>
              {m.code} — {m.name}
            </option>
          ))}
        </select>

        <select
          value={statusFilter}
          onChange={(e) => onStatusFilterChange(e.target.value as any)}
          aria-label="Filter by Return Status"
          className="px-3.5 py-2.5 bg-slate-50 dark:bg-navy-950 border border-slate-200 dark:border-white/10 rounded-xl text-xs font-semibold text-navy-800 dark:text-slate-100 focus:outline-none focus:border-orange-500"
        >
          <option value="ALL">All Statuses</option>
          <option value="PENDING_INSPECTION">PENDING INSPECTION</option>
          <option value="RESTOCKED">RESTOCKED</option>
          <option value="DAMAGED">DAMAGED / QUARANTINE</option>
        </select>
      </div>
    </div>
  );
}
