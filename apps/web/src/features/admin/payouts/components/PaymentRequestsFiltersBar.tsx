'use client';

import React from 'react';
import { Search, CheckCircle2, XCircle, RotateCcw } from 'lucide-react';
import { PaymentRequestMethod, PaymentRequestStatus } from '../types';

interface PaymentRequestsFiltersBarProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  statusFilter: 'ALL' | PaymentRequestStatus;
  onStatusFilterChange: (status: 'ALL' | PaymentRequestStatus) => void;
  methodFilter: 'ALL' | PaymentRequestMethod;
  onMethodFilterChange: (method: 'ALL' | PaymentRequestMethod) => void;
  selectedCount: number;
  onBulkAccept: () => void;
  onBulkReject: () => void;
  onResetFilters: () => void;
}

export function PaymentRequestsFiltersBar({
  searchQuery,
  onSearchChange,
  statusFilter,
  onStatusFilterChange,
  methodFilter,
  onMethodFilterChange,
  selectedCount,
  onBulkAccept,
  onBulkReject,
  onResetFilters,
}: PaymentRequestsFiltersBarProps) {
  const hasActiveFilters = searchQuery || statusFilter !== 'ALL' || methodFilter !== 'ALL';

  return (
    <div className="space-y-3">
      {/* Filters Bar */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900/90 p-4 flex flex-col md:flex-row md:items-center justify-between gap-3 shadow-md">
        {/* Left Side: Search + Dropdowns */}
        <div className="flex flex-wrap items-center gap-2.5 flex-1">
          {/* Search Box */}
          <div className="relative flex-1 sm:flex-initial sm:w-72 min-w-[200px]">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder="Search TrxID, Merchant, Store, Account..."
              className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-emerald-500 transition-colors"
            />
          </div>

          {/* Status Select Filter */}
          <select
            value={statusFilter}
            onChange={(e) => onStatusFilterChange(e.target.value as 'ALL' | PaymentRequestStatus)}
            aria-label="Filter by Status"
            className="px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs font-semibold text-slate-200 focus:outline-none focus:border-emerald-500 cursor-pointer"
          >
            <option value="ALL">All Requests</option>
            <option value="PENDING">Pending Approval</option>
            <option value="ACCEPTED">Accepted (Ready to Pay)</option>
            <option value="REJECTED">Rejected</option>
          </select>

          {/* Method Select Filter */}
          <select
            value={methodFilter}
            onChange={(e) => onMethodFilterChange(e.target.value as 'ALL' | PaymentRequestMethod)}
            aria-label="Filter by Payment Method"
            className="px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs font-semibold text-slate-200 focus:outline-none focus:border-emerald-500 cursor-pointer"
          >
            <option value="ALL">All Methods</option>
            <option value="BKASH">bKash</option>
            <option value="NAGAD">Nagad</option>
            <option value="BANK_TRANSFER">Bank Transfer</option>
            <option value="CASH">Cash</option>
          </select>

          {/* Reset Filters */}
          {hasActiveFilters && (
            <button
              type="button"
              onClick={onResetFilters}
              className="px-3 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-300 flex items-center gap-1 cursor-pointer transition-colors"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset</span>
            </button>
          )}
        </div>

        {/* Bulk Action Controls (Visible when items selected) */}
        {selectedCount > 0 && (
          <div className="flex items-center gap-2 bg-slate-950/90 border border-emerald-500/30 px-3.5 py-2 rounded-xl shadow-lg">
            <span className="text-xs font-mono font-bold text-emerald-400">
              {selectedCount} selected
            </span>
            <div className="h-4 w-px bg-slate-800" />
            <button
              type="button"
              onClick={onBulkAccept}
              className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer shadow-sm"
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Bulk Accept</span>
            </button>
            <button
              type="button"
              onClick={onBulkReject}
              className="px-3 py-1.5 rounded-lg bg-rose-600/90 hover:bg-rose-500 text-white text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer shadow-sm"
            >
              <XCircle className="w-3.5 h-3.5" />
              <span>Bulk Reject</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
