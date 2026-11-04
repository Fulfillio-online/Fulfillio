import React from 'react';
import { Search, Building2 } from 'lucide-react';
import { PackingStatus, MerchantCode } from '../types';

interface PackingFiltersBarProps {
  activeTab: PackingStatus;
  setActiveTab: (tab: PackingStatus) => void;
  readyCount: number;
  packedCount: number;
  merchantFilter: 'ALL' | MerchantCode;
  setMerchantFilter: (mc: 'ALL' | MerchantCode) => void;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
}

export function PackingFiltersBar({
  activeTab,
  setActiveTab,
  readyCount,
  packedCount,
  merchantFilter,
  setMerchantFilter,
  searchQuery,
  setSearchQuery,
}: PackingFiltersBarProps) {
  const merchantOptions: Array<'ALL' | MerchantCode> = ['ALL', 'MC-101', 'MC-102', 'MC-103'];

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-3 sm:p-4 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3 sm:gap-4">
      {/* Status Tabs */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 w-full lg:w-auto">
        <button
          type="button"
          onClick={() => setActiveTab('READY_TO_PACK')}
          className={`w-full sm:w-auto px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition-colors flex items-center justify-between sm:justify-start gap-2 ${
            activeTab === 'READY_TO_PACK'
              ? 'bg-emerald-600 text-white'
              : 'bg-slate-950 text-slate-400 hover:text-slate-200 border border-slate-800'
          }`}
        >
          <span>Ready to Pack (Picked)</span>
          <span
            className={`px-2 py-0.5 rounded-full text-[11px] font-mono ${
              activeTab === 'READY_TO_PACK'
                ? 'bg-emerald-800 text-emerald-100'
                : 'bg-slate-800 text-slate-300'
            }`}
          >
            {readyCount}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('PACKED')}
          className={`w-full sm:w-auto px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition-colors flex items-center justify-between sm:justify-start gap-2 ${
            activeTab === 'PACKED'
              ? 'bg-emerald-600 text-white'
              : 'bg-slate-950 text-slate-400 hover:text-slate-200 border border-slate-800'
          }`}
        >
          <span>Packed (Done)</span>
          <span
            className={`px-2 py-0.5 rounded-full text-[11px] font-mono ${
              activeTab === 'PACKED'
                ? 'bg-emerald-800 text-emerald-100'
                : 'bg-slate-800 text-slate-300'
            }`}
          >
            {packedCount}
          </span>
        </button>
      </div>

      {/* Merchant Filter Pills & Search */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full lg:w-auto">
        <div className="flex flex-wrap items-center gap-1.5 bg-slate-950 border border-slate-800 rounded-lg p-1.5">
          <span className="text-[11px] font-semibold text-slate-400 px-1.5 flex items-center gap-1">
            <Building2 className="w-3.5 h-3.5 text-emerald-400" />
            Merchant:
          </span>
          {merchantOptions.map((mc) => (
            <button
              key={mc}
              type="button"
              onClick={() => setMerchantFilter(mc)}
              className={`px-2.5 py-1 rounded-md text-xs font-mono font-bold transition-colors ${
                merchantFilter === mc
                  ? 'bg-emerald-600 text-white'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              {mc}
            </button>
          ))}
        </div>

        <div className="relative w-full sm:w-auto sm:min-w-[260px] flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search Order ID, Memo Code, SKU, Customer..."
            className="w-full pl-9 pr-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-emerald-500"
          />
        </div>
      </div>
    </div>
  );
}
