'use client';

import React, { useState, useRef, useEffect, useMemo } from 'react';
import { Search, ChevronDown, Check, Building2, X, Store } from 'lucide-react';
import { MerchantFinancialProfile, SettlementTransaction } from '../types';

interface MerchantSelectComboboxProps {
  selectedMerchant: string; // 'ALL' or merchantCode
  onSelectMerchant: (merchantCode: string) => void;
  merchants: MerchantFinancialProfile[];
  transactions: SettlementTransaction[];
  className?: string;
}

export function MerchantSelectCombobox({
  selectedMerchant,
  onSelectMerchant,
  merchants,
  transactions,
  className = '',
}: MerchantSelectComboboxProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Close when clicking outside
  useEffect(() => {
    if (!isOpen) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

  // Focus search input when dropdown opens
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => {
        searchInputRef.current?.focus();
      }, 50);
    } else {
      setSearchQuery('');
    }
  }, [isOpen]);

  // Count transactions per merchant
  const countsByMerchant = useMemo(() => {
    const map: Record<string, number> = {};
    for (const tx of transactions) {
      map[tx.merchantCode] = (map[tx.merchantCode] || 0) + 1;
    }
    return map;
  }, [transactions]);

  // Active merchant profile
  const activeProfile = useMemo(() => {
    if (selectedMerchant === 'ALL') return null;
    return merchants.find((m) => m.merchantCode === selectedMerchant);
  }, [merchants, selectedMerchant]);

  // Filtered merchants based on search
  const filteredMerchants = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    if (!query) return merchants;
    return merchants.filter(
      (m) =>
        m.merchantName.toLowerCase().includes(query) ||
        m.merchantCode.toLowerCase().includes(query) ||
        m.ownerName.toLowerCase().includes(query)
    );
  }, [merchants, searchQuery]);

  return (
    <div ref={containerRef} className={`relative inline-block text-left ${className}`}>
      {/* Trigger Button */}
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer border ${
          selectedMerchant !== 'ALL'
            ? 'bg-emerald-500/10 border-emerald-500/40 text-emerald-700 dark:text-emerald-300 shadow-sm'
            : 'bg-slate-50 dark:bg-navy-950 hover:bg-white dark:hover:bg-navy-900 border-slate-200 dark:border-white/10 text-slate-700 dark:text-slate-200'
        }`}
        title="Filter transactions by merchant"
        aria-haspopup="listbox"
        aria-expanded={isOpen}
      >
        <Building2
          className={`w-3.5 h-3.5 shrink-0 ${
            selectedMerchant !== 'ALL' ? 'text-orange-600 dark:text-orange-400' : 'text-slate-600 dark:text-slate-300'
          }`}
        />

        <span className="truncate max-w-[150px] sm:max-w-[200px]">
          {activeProfile ? `${activeProfile.merchantName} (${activeProfile.merchantCode})` : 'All Merchants'}
        </span>

        {/* Clear filter button if not ALL */}
        {selectedMerchant !== 'ALL' && (
          <span
            onClick={(e) => {
              e.stopPropagation();
              onSelectMerchant('ALL');
            }}
            className="p-0.5 rounded-full hover:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 dark:hover:text-emerald-300 transition-colors ml-0.5"
            title="Clear merchant filter"
          >
            <X className="w-3 h-3" />
          </span>
        )}

        <ChevronDown
          className={`w-3.5 h-3.5 shrink-0 transition-transform duration-200 text-slate-600 dark:text-slate-300 ${
            isOpen ? 'rotate-180 text-orange-600 dark:text-orange-400' : ''
          }`}
        />
      </button>

      {/* Dropdown Floating Panel */}
      {isOpen && (
        <div
          role="listbox"
          className="absolute left-0 top-full mt-2 w-72 sm:w-80 max-w-[calc(100vw-2rem)] rounded-2xl bg-white dark:bg-navy-900 border border-slate-300/80 dark:border-white/15 shadow-2xl shadow-black/80 z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-150"
        >
          {/* Header Search Box */}
          <div className="p-2.5 border-b border-slate-200 dark:border-white/10 bg-slate-50/80 dark:bg-navy-950/80">
            <div className="relative flex items-center">
              <Search className="w-3.5 h-3.5 absolute left-3 text-slate-500 dark:text-slate-400 pointer-events-none" />
              <input
                ref={searchInputRef}
                type="text"
                placeholder="Search merchant name or code..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-8 pr-7 py-1.5 rounded-xl bg-white dark:bg-navy-900 border border-slate-200 dark:border-white/10 text-xs text-navy-800 dark:text-slate-100 placeholder-slate-500 dark:placeholder-slate-400 focus:outline-none focus:border-orange-500 transition-colors"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2.5 text-slate-600 dark:text-slate-300 hover:text-navy-800 dark:hover:text-white"
                  title="Clear search"
                >
                  <X className="w-3 h-3" />
                </button>
              )}
            </div>
          </div>

          {/* Scrollable Merchant List - Max Height Enforced */}
          <div className="max-h-60 overflow-y-auto divide-y divide-slate-200/50 dark:divide-white/10 p-1.5 scrollbar-thin scrollbar-thumb-slate-700 scrollbar-track-slate-900">
            {/* 1. All Merchants Option (visible when search query matches or is empty) */}
            {(!searchQuery || 'all merchants'.includes(searchQuery.toLowerCase())) && (
              <button
                type="button"
                onClick={() => {
                  onSelectMerchant('ALL');
                  setIsOpen(false);
                }}
                className={`w-full text-left px-3 py-2 rounded-xl text-xs flex items-center justify-between transition-colors cursor-pointer ${
                  selectedMerchant === 'ALL'
                    ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 font-bold'
                    : 'text-slate-700 dark:text-slate-200 hover:bg-slate-100/80 dark:hover:bg-navy-800/80 font-medium'
                }`}
              >
                <div className="flex items-center gap-2.5 truncate">
                  <div
                    className={`w-6 h-6 rounded-lg flex items-center justify-center shrink-0 ${
                      selectedMerchant === 'ALL'
                        ? 'bg-orange-500 text-slate-950'
                        : 'bg-slate-100 dark:bg-navy-800 text-slate-600 dark:text-slate-300'
                    }`}
                  >
                    <Store className="w-3.5 h-3.5" />
                  </div>
                  <div className="truncate">
                    <span className="block truncate font-semibold">All Merchants</span>
                    <span className="text-[11px] text-slate-600 dark:text-slate-300 tabular-nums">View all vouchers</span>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <span className="px-1.5 py-0.5 rounded text-[11px] tabular-nums font-bold bg-slate-100 dark:bg-navy-800 text-slate-700 dark:text-slate-200 border border-slate-300 dark:border-white/15">
                    {transactions.length}
                  </span>
                  {selectedMerchant === 'ALL' && <Check className="w-3.5 h-3.5 text-orange-600 dark:text-orange-400" />}
                </div>
              </button>
            )}

            {/* 2. Individual Merchants */}
            {filteredMerchants.length === 0 && searchQuery ? (
              <div className="py-6 px-3 text-center text-xs text-slate-600 dark:text-slate-300 space-y-1">
                <p>No merchants found matching</p>
                <p className="tabular-nums text-orange-600 dark:text-orange-400 font-bold">"{searchQuery}"</p>
              </div>
            ) : (
              filteredMerchants.map((m) => {
                const isSelected = selectedMerchant === m.merchantCode;
                const count = countsByMerchant[m.merchantCode] || 0;

                return (
                  <button
                    key={m.merchantCode}
                    type="button"
                    onClick={() => {
                      onSelectMerchant(m.merchantCode);
                      setIsOpen(false);
                    }}
                    className={`w-full text-left px-3 py-2 rounded-xl text-xs flex items-center justify-between transition-colors cursor-pointer ${
                      isSelected
                        ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 font-bold'
                        : 'text-slate-700 dark:text-slate-200 hover:bg-slate-100/80 dark:hover:bg-navy-800/80 font-medium'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 truncate min-w-0 pr-2">
                      <div
                        className={`w-6 h-6 rounded-lg flex items-center justify-center text-[11px] font-bold shrink-0 bg-gradient-to-br ${
                          m.avatarBg || 'from-slate-200 dark:from-navy-700 to-slate-100 dark:to-navy-800'
                        } text-white shadow-sm`}
                      >
                        {m.avatarInitials || m.merchantCode.slice(-2)}
                      </div>

                      <div className="truncate min-w-0">
                        <span className="block truncate font-semibold text-navy-800 dark:text-white">
                          {m.merchantName}
                        </span>
                        <span className="text-[11px] text-slate-600 dark:text-slate-300 tabular-nums block">
                          {m.merchantCode} · {m.ownerName}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <span className="px-1.5 py-0.5 rounded text-[11px] tabular-nums font-bold bg-slate-100 dark:bg-navy-800 text-slate-700 dark:text-slate-200 border border-slate-300 dark:border-white/15">
                        {count}
                      </span>
                      {isSelected && <Check className="w-3.5 h-3.5 text-orange-600 dark:text-orange-400 shrink-0" />}
                    </div>
                  </button>
                );
              })
            )}
          </div>

          {/* Footer - Count information */}
          <div className="px-3 py-2 bg-slate-50/90 dark:bg-navy-950/90 border-t border-slate-200/80 dark:border-white/10 flex items-center justify-between text-[11px] text-slate-600 dark:text-slate-300 select-none">
            <span>
              Showing {filteredMerchants.length} of {merchants.length} merchants
            </span>
            {selectedMerchant !== 'ALL' && (
              <button
                type="button"
                onClick={() => {
                  onSelectMerchant('ALL');
                  setIsOpen(false);
                }}
                className="text-orange-600 dark:text-orange-400 hover:underline font-semibold cursor-pointer"
              >
                Reset to All
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
