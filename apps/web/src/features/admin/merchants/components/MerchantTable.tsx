'use client';

import React, { useState, useMemo, useEffect } from 'react';
import {
  Search,
  Eye,
  MapPin,
  Landmark,
  Phone,
  ShieldCheck,
  CheckCircle2,
  ChevronDown,
  Ban,
  Check,
  AlertTriangle,
} from 'lucide-react';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { Modal } from '@/components/admin/AdminModal';
import { MerchantRecord, MerchantProductItem } from '../types';

export interface MerchantTableProps {
  merchants: MerchantRecord[];
  productsList: MerchantProductItem[];
  onSelectMerchant: (merchant: MerchantRecord) => void;
  onToggleStatus: (id: string, currentStatus: string) => void;
  onBulkUpdateStatus?: (ids: string[], nextStatus: 'Active' | 'Suspended') => void;
}

export function MerchantTable({
  merchants,
  productsList,
  onSelectMerchant,
  onToggleStatus,
  onBulkUpdateStatus,
}: MerchantTableProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'Active' | 'Pending' | 'Suspended'>('ALL');

  // Multi-Selection state
  const [selectedMerchantIds, setSelectedMerchantIds] = useState<Set<string>>(new Set());

  // Bulk actions dropdown & modals
  const [isBulkMenuOpen, setIsBulkMenuOpen] = useState(false);
  const [bulkApproveModalOpen, setBulkApproveModalOpen] = useState(false);
  const [bulkSuspendModalOpen, setBulkSuspendModalOpen] = useState(false);

  // Row-level Actions dropdown
  const [activeMenuId, setActiveMenuId] = useState<string | null>(null);

  // Mobile Collapsible Accordion State
  const [expandedMerchantIds, setExpandedMerchantIds] = useState<Set<string>>(new Set());

  const toggleExpand = (id: string) => {
    setExpandedMerchantIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  // Close dropdown on outside click
  useEffect(() => {
    if (!isBulkMenuOpen && !activeMenuId) return;
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target.closest('[data-dropdown-container]')) {
        setIsBulkMenuOpen(false);
        setActiveMenuId(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isBulkMenuOpen, activeMenuId]);

  // Status counts for the select dropdown options
  const statusCounts = useMemo(() => {
    return {
      ALL: merchants.length,
      Active: merchants.filter((m) => m.status === 'Active').length,
      Pending: merchants.filter((m) => m.status === 'Pending').length,
      Suspended: merchants.filter((m) => m.status === 'Suspended').length,
    };
  }, [merchants]);

  // Filtered merchants based on search and status select
  const filteredMerchants = useMemo(() => {
    return merchants.filter((m) => {
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch =
        !q ||
        m.storeName.toLowerCase().includes(q) ||
        m.merchantCode.toLowerCase().includes(q) ||
        m.ownerName.toLowerCase().includes(q) ||
        m.phone.includes(q) ||
        m.email.toLowerCase().includes(q);

      const matchesStatus = statusFilter === 'ALL' || m.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [merchants, searchQuery, statusFilter]);

  // Calculate product count per merchant
  const getProductCount = (code: string) => {
    return productsList.filter((p) => p.merchantCode === code).length;
  };

  // Selection helpers
  const isAllSelected =
    filteredMerchants.length > 0 &&
    filteredMerchants.every((m) => selectedMerchantIds.has(m.id));
  const isSomeSelected =
    filteredMerchants.some((m) => selectedMerchantIds.has(m.id)) && !isAllSelected;

  const handleToggleSelectAll = () => {
    if (isAllSelected) {
      setSelectedMerchantIds(new Set());
    } else {
      setSelectedMerchantIds(new Set(filteredMerchants.map((m) => m.id)));
    }
  };

  const handleToggleSelect = (id: string) => {
    setSelectedMerchantIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  // Bulk action handlers
  const handleConfirmBulkApprove = () => {
    if (onBulkUpdateStatus && selectedMerchantIds.size > 0) {
      onBulkUpdateStatus(Array.from(selectedMerchantIds), 'Active');
      setSelectedMerchantIds(new Set());
    }
    setBulkApproveModalOpen(false);
  };

  const handleConfirmBulkSuspend = () => {
    if (onBulkUpdateStatus && selectedMerchantIds.size > 0) {
      onBulkUpdateStatus(Array.from(selectedMerchantIds), 'Suspended');
      setSelectedMerchantIds(new Set());
    }
    setBulkSuspendModalOpen(false);
  };

  return (
    <div className="space-y-4">
      {/* Search & Status Filters Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white dark:bg-navy-900 border border-slate-200 dark:border-white/10 p-4 rounded-2xl shadow-lg">
        {/* Search Input */}
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-slate-600 dark:text-slate-300 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search store name, merchant code, phone..."
            className="w-full pl-10 pr-4 py-2 bg-slate-50 dark:bg-navy-950 border border-slate-300/80 dark:border-white/15 rounded-xl text-xs sm:text-sm tabular-nums text-navy-800 dark:text-slate-100 placeholder:text-slate-500 dark:placeholder:text-slate-400 focus:outline-none focus:border-orange-500 transition-colors"
          />
        </div>

        {/* Status Filter - Select Dropdown Option */}
        <div className="flex items-center gap-2 self-stretch sm:self-auto">
          <label htmlFor="merchant-status-select" className="text-xs font-semibold text-slate-600 dark:text-slate-300 shrink-0">
            Status:
          </label>
          <select
            id="merchant-status-select"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as any)}
            className="w-full sm:w-auto px-3.5 py-2 bg-slate-50 dark:bg-navy-950 border border-slate-300/80 dark:border-white/15 rounded-xl text-xs sm:text-sm font-semibold text-navy-800 dark:text-slate-100 focus:outline-none focus:border-orange-500 cursor-pointer shadow-sm"
          >
            <option value="ALL">All Status ({statusCounts.ALL})</option>
            <option value="Active">Active ({statusCounts.Active})</option>
            <option value="Pending">Pending ({statusCounts.Pending})</option>
            <option value="Suspended">Suspended ({statusCounts.Suspended})</option>
          </select>
        </div>
      </div>

      {/* Bulk Action Bar (Visible when 1 or more merchants are selected) */}
      {selectedMerchantIds.size > 0 && (
        <div className="bg-white dark:bg-navy-900 border border-orange-500/50 rounded-2xl p-3 sm:p-4 flex flex-col sm:flex-row items-center justify-between gap-3 shadow-xl animate-in fade-in-50 duration-200">
          <div className="flex items-center gap-3">
            <span className="w-8 h-8 rounded-xl bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 tabular-nums font-bold flex items-center justify-center text-xs">
              {selectedMerchantIds.size}
            </span>
            <div className="text-xs sm:text-sm">
              <span className="text-navy-800 dark:text-white font-bold">{selectedMerchantIds.size}</span>
              <span className="text-slate-600 dark:text-slate-300"> merchant{selectedMerchantIds.size > 1 ? 's' : ''} selected</span>
            </div>
            <button
              type="button"
              onClick={() => setSelectedMerchantIds(new Set())}
              className="text-xs text-slate-600 dark:text-slate-300 hover:text-navy-800 dark:hover:text-white underline underline-offset-2 ml-2 cursor-pointer transition-colors"
            >
              Deselect All
            </button>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Bulk Actions Dropdown */}
            <div className="relative inline-flex items-center text-left" data-dropdown-container>
              <button
                type="button"
                onClick={() => setIsBulkMenuOpen((prev) => !prev)}
                className="px-3.5 py-2 rounded-xl bg-slate-100 dark:bg-navy-800 hover:bg-slate-200 dark:hover:bg-navy-700 text-xs font-bold text-navy-800 dark:text-slate-100 border border-slate-300 dark:border-white/15 flex items-center gap-1.5 transition-colors cursor-pointer shadow-sm"
              >
                <span>Bulk Actions</span>
                <ChevronDown
                  className={`w-3.5 h-3.5 transition-transform duration-200 ${
                    isBulkMenuOpen ? 'rotate-180 text-orange-600 dark:text-orange-400' : 'text-slate-600 dark:text-slate-300'
                  }`}
                />
              </button>

              {isBulkMenuOpen && (
                <div className="absolute right-0 top-full mt-1.5 w-60 rounded-xl bg-white dark:bg-navy-900 border border-slate-200 dark:border-white/10 shadow-2xl py-1.5 z-[100] text-left font-sans text-xs">
                  <button
                    type="button"
                    onClick={() => {
                      setIsBulkMenuOpen(false);
                      setBulkApproveModalOpen(true);
                    }}
                    className="w-full px-3.5 py-2 text-left text-emerald-700 dark:text-emerald-300 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 flex items-center gap-2.5 transition-colors cursor-pointer"
                  >
                    <CheckCircle2 className="w-4 h-4 text-orange-600 dark:text-orange-400 pointer-events-none" />
                    <span>Approve Selected ({selectedMerchantIds.size})</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setIsBulkMenuOpen(false);
                      setBulkSuspendModalOpen(true);
                    }}
                    className="w-full px-3.5 py-2 text-left text-rose-700 dark:text-rose-300 hover:bg-rose-50 dark:hover:bg-rose-950/40 flex items-center gap-2.5 transition-colors cursor-pointer border-t border-slate-200/80 dark:border-white/10"
                  >
                    <Ban className="w-4 h-4 text-rose-600 dark:text-rose-400 pointer-events-none" />
                    <span>Suspend Selected ({selectedMerchantIds.size})</span>
                  </button>
                </div>
              )}
            </div>

            {/* Direct Quick Action: Approve */}
            <button
              type="button"
              onClick={() => setBulkApproveModalOpen(true)}
              className="px-3.5 py-2 rounded-xl bg-orange-600 hover:bg-orange-700 active:scale-95 text-white text-xs font-bold flex items-center gap-1.5 shadow-lg shadow-orange-500/25 transition-all cursor-pointer"
            >
              <Check className="w-4 h-4 pointer-events-none" />
              <span>Approve ({selectedMerchantIds.size})</span>
            </button>

            {/* Direct Quick Action: Suspend */}
            <button
              type="button"
              onClick={() => setBulkSuspendModalOpen(true)}
              className="px-3.5 py-2 rounded-xl bg-rose-600/20 hover:bg-rose-600/30 border border-rose-500/40 text-rose-700 dark:text-rose-300 hover:text-navy-800 dark:hover:text-white active:scale-95 text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer"
            >
              <Ban className="w-4 h-4 pointer-events-none" />
              <span>Suspend ({selectedMerchantIds.size})</span>
            </button>
          </div>
        </div>
      )}

      {/* Merchant Display: Mobile Collapsible Cards & Desktop Table */}
      <div className="rounded-2xl border border-slate-200 dark:border-white/10 bg-white dark:bg-navy-900 shadow-xl overflow-visible p-3 sm:p-0">
        {/* 1. Mobile Collapsible List (Visible on mobile screens < md) */}
        <div className="block md:hidden space-y-2.5">
          {filteredMerchants.length === 0 ? (
            <div className="py-10 text-center text-slate-600 dark:text-slate-300 text-xs">
              No merchants found matching your search.
            </div>
          ) : (
            filteredMerchants.map((merchant, idx) => {
              const skuCount = getProductCount(merchant.merchantCode);
              const isSelected = selectedMerchantIds.has(merchant.id);
              const isExpanded = expandedMerchantIds.has(merchant.id);
              const isMenuOpen = activeMenuId === `mobile-${merchant.id}`;
              const isNearBottom = idx > 0 && idx === filteredMerchants.length - 1;

              return (
                <div
                  key={merchant.id}
                  className={`relative rounded-xl border transition-colors shadow-sm ${
                    isMenuOpen ? 'z-50' : 'z-0'
                  } ${
                    isSelected
                      ? 'border-emerald-500/50 bg-emerald-50 dark:bg-emerald-950/20'
                      : 'border-slate-200 dark:border-white/10 bg-slate-50/60 dark:bg-navy-950/60'
                  }`}
                >
                  {/* Collapsed Header Summary */}
                  <div className="p-3 sm:p-3.5 flex items-start gap-2.5 sm:gap-3 select-none">
                    <div className="pt-1 shrink-0" onClick={(e) => e.stopPropagation()}>
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => handleToggleSelect(merchant.id)}
                        aria-label={`Select ${merchant.storeName}`}
                        className="w-4 h-4 rounded bg-slate-50 dark:bg-navy-950 border-slate-300 dark:border-white/15 text-orange-600 dark:text-orange-500 focus:ring-orange-500 cursor-pointer accent-orange-500"
                      />
                    </div>

                    <div
                      onClick={() => toggleExpand(merchant.id)}
                      className={`w-11 h-11 rounded-xl bg-gradient-to-br ${merchant.avatarBg} flex items-center justify-center text-white font-bold text-sm shadow-md shrink-0 mt-0.5 cursor-pointer`}
                    >
                      {merchant.avatarInitials}
                    </div>

                    <div
                      className="min-w-0 flex-1 space-y-1 cursor-pointer"
                      onClick={() => toggleExpand(merchant.id)}
                    >
                      {/* Row 1: Store Name + Verified Badge + Status Badge */}
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-1.5 min-w-0 flex-1">
                          <span className="font-bold text-navy-800 dark:text-white text-sm sm:text-[15px] leading-tight truncate">
                            {merchant.storeName}
                          </span>
                          {merchant.verified && (
                            <ShieldCheck className="w-3.5 h-3.5 text-orange-600 dark:text-orange-400 shrink-0" />
                          )}
                        </div>
                        <div className="shrink-0">
                          <StatusBadge status={merchant.status} />
                        </div>
                      </div>

                      {/* Row 2: Merchant Code & Owner Name */}
                      <div className="flex items-center gap-1.5 text-xs truncate">
                        <span className="tabular-nums font-bold text-indigo-600 dark:text-indigo-400 bg-indigo-500/10 px-1.5 py-0.5 rounded border border-indigo-500/20 text-xs shrink-0">
                          {merchant.merchantCode}
                        </span>
                        <span className="text-slate-500 dark:text-slate-400 shrink-0">·</span>
                        <span className="text-slate-700 dark:text-slate-200 font-medium truncate">
                          {merchant.ownerName}
                        </span>
                      </div>

                      {/* Row 3: Phone & Active SKUs Count + Accordion Toggle Button */}
                      <div className="flex items-center justify-between gap-2 pt-0.5">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="tabular-nums text-xs text-slate-700 dark:text-slate-200 flex items-center gap-1">
                            <Phone className="w-3 h-3 text-slate-500 dark:text-slate-400 shrink-0" />
                            {merchant.phone}
                          </span>
                          <span className="px-2 py-0.5 rounded-md bg-white dark:bg-navy-900 border border-slate-200 dark:border-white/10 tabular-nums text-xs font-bold text-orange-600 dark:text-orange-400">
                            {skuCount} SKUs
                          </span>
                        </div>

                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleExpand(merchant.id);
                          }}
                          aria-label="Toggle merchant details"
                          className="p-1 rounded-lg bg-navy-800 dark:bg-navy-700 text-slate-600 dark:text-slate-300 hover:text-white transition-colors cursor-pointer shrink-0"
                        >
                          <ChevronDown
                            className={`w-4 h-4 transition-transform duration-200 ${
                              isExpanded ? 'rotate-180 text-orange-600 dark:text-orange-400' : ''
                            }`}
                          />
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Expanded Row Details */}
                  {isExpanded && (
                    <div className="relative z-20 px-3.5 pb-3.5 pt-2 border-t border-slate-200/80 dark:border-white/10 bg-white/60 dark:bg-navy-900/60 rounded-b-xl text-xs space-y-2.5 font-sans">
                      <div className="grid grid-cols-2 gap-2 text-xs pt-1">
                        <div>
                          <span className="text-slate-600 dark:text-slate-300 block text-[11px] uppercase font-semibold">
                            Location &amp; Email
                          </span>
                          <div className="text-navy-800 dark:text-slate-100 flex items-center gap-1 mt-0.5 truncate">
                            <MapPin className="w-3 h-3 text-slate-500 dark:text-slate-400 shrink-0" />
                            <span className="truncate">{merchant.location}</span>
                          </div>
                          <div className="text-slate-600 dark:text-slate-300 tabular-nums text-[11px] truncate mt-0.5">
                            {merchant.email}
                          </div>
                        </div>

                        <div>
                          <span className="text-slate-600 dark:text-slate-300 block text-[11px] uppercase font-semibold">
                            Bank / COD Payout
                          </span>
                          <div className="flex items-center gap-1 font-medium text-navy-800 dark:text-slate-100 mt-0.5 truncate">
                            <Landmark className="w-3 h-3 text-orange-600 dark:text-orange-400 shrink-0" />
                            <span className="truncate">{merchant.payoutAccount.provider}</span>
                          </div>
                          <div className="text-[11px] text-orange-600 dark:text-orange-400 tabular-nums mt-0.5 truncate">
                            A/C ••••{merchant.payoutAccount.accountNumber.slice(-4)} · bKash: {merchant.payoutAccount.bkashNumber}
                          </div>
                        </div>
                      </div>

                      {/* Actions Dropdown on Mobile */}
                      <div className="flex items-center justify-between pt-2 border-t border-slate-200/80 dark:border-white/10">
                        <span className="text-xs text-slate-600 dark:text-slate-300">Manage Merchant:</span>
                        <div
                          className="relative inline-flex items-center justify-end text-left"
                          data-dropdown-container
                        >
                          <button
                            type="button"
                            onClick={() =>
                              setActiveMenuId(isMenuOpen ? null : `mobile-${merchant.id}`)
                            }
                            className="px-3 py-1.5 rounded-lg bg-slate-100 dark:bg-navy-800 hover:bg-slate-200 dark:hover:bg-navy-700 text-xs font-bold text-navy-800 dark:text-slate-100 border border-slate-300 dark:border-white/15 flex items-center gap-1.5 transition-colors cursor-pointer shadow-sm"
                          >
                            <span>Actions</span>
                            <ChevronDown
                              className={`w-3.5 h-3.5 transition-transform duration-200 ${
                                isMenuOpen ? 'rotate-180 text-orange-600 dark:text-orange-400' : 'text-slate-600 dark:text-slate-300'
                              }`}
                            />
                          </button>

                          {isMenuOpen && (
                            <div
                              className={`absolute right-0 ${
                                isNearBottom ? 'bottom-full mb-1.5' : 'top-full mt-1.5'
                              } w-48 rounded-xl bg-white dark:bg-navy-900 border border-slate-200 dark:border-white/10 shadow-2xl py-1.5 z-[100] text-left font-sans text-xs pointer-events-auto`}
                            >
                              {/* 1. View Profile */}
                              <button
                                type="button"
                                onClick={() => {
                                  setActiveMenuId(null);
                                  onSelectMerchant(merchant);
                                }}
                                className="w-full px-3.5 py-2 text-left text-navy-800 dark:text-slate-100 hover:bg-slate-100/80 dark:hover:bg-navy-800/80 font-semibold flex items-center gap-2.5 transition-colors cursor-pointer"
                              >
                                <Eye className="w-4 h-4 text-indigo-600 dark:text-indigo-400 shrink-0 pointer-events-none" />
                                <span>View Profile</span>
                              </button>

                              {/* 2. Toggle Status (Suspend / Approve) */}
                              <button
                                type="button"
                                onClick={() => {
                                  setActiveMenuId(null);
                                  onToggleStatus(merchant.id, merchant.status);
                                }}
                                className={`w-full px-3.5 py-2 text-left font-semibold flex items-center gap-2.5 transition-colors cursor-pointer border-t border-slate-200/80 dark:border-white/10 ${
                                  merchant.status === 'Active'
                                    ? 'text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40'
                                    : 'text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/40'
                                }`}
                              >
                                {merchant.status === 'Active' ? (
                                  <>
                                    <Ban className="w-4 h-4 text-rose-600 dark:text-rose-400 shrink-0 pointer-events-none" />
                                    <span>Suspend Merchant</span>
                                  </>
                                ) : (
                                  <>
                                    <Check className="w-4 h-4 text-orange-600 dark:text-orange-400 shrink-0 pointer-events-none" />
                                    <span>Approve Merchant</span>
                                  </>
                                )}
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>

        {/* 2. Desktop Full Table (Visible on md screens and larger) */}
        <div className="hidden md:block overflow-x-auto overflow-y-visible">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50/80 dark:bg-navy-950/80 text-slate-600 dark:text-slate-300 uppercase tracking-wider font-bold border-b border-slate-200 dark:border-white/10 text-xs">
              <tr>
                {/* 1. Multiple Select Header */}
                <th className="p-4 w-12 text-center">
                  <input
                    type="checkbox"
                    checked={isAllSelected}
                    ref={(el) => {
                      if (el) el.indeterminate = isSomeSelected;
                    }}
                    onChange={handleToggleSelectAll}
                    className="w-4 h-4 rounded border-slate-300 dark:border-white/15 bg-white dark:bg-navy-900 text-orange-600 dark:text-orange-500 focus:ring-orange-500 cursor-pointer accent-orange-500"
                    title="Select all visible merchants"
                  />
                </th>
                <th className="p-4">Merchant &amp; Store</th>
                <th className="p-4">Owner Contact</th>
                <th className="p-4">Bank / COD Payout</th>
                <th className="p-4">Status</th>
                <th className="p-4 text-center">Active SKUs</th>
                <th className="p-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200/80 dark:divide-white/10">
              {filteredMerchants.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-slate-600 dark:text-slate-300">
                    No merchants found matching your search.
                  </td>
                </tr>
              ) : (
                filteredMerchants.map((merchant, idx) => {
                  const skuCount = getProductCount(merchant.merchantCode);
                  const isSelected = selectedMerchantIds.has(merchant.id);
                  const isMenuOpen = activeMenuId === `desktop-${merchant.id}`;
                  const isNearBottom = idx > 0 && idx >= filteredMerchants.length - 2;

                  return (
                    <tr
                      key={merchant.id}
                      className={`hover:bg-slate-100/40 dark:hover:bg-navy-800/40 transition-colors group ${
                        isSelected ? 'bg-emerald-50 dark:bg-emerald-950/20' : ''
                      }`}
                    >
                      {/* Checkbox Cell */}
                      <td className="p-4 w-12 text-center" onClick={(e) => e.stopPropagation()}>
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => handleToggleSelect(merchant.id)}
                          className="w-4 h-4 rounded border-slate-300 dark:border-white/15 bg-white dark:bg-navy-900 text-orange-600 dark:text-orange-500 focus:ring-orange-500 cursor-pointer accent-orange-500"
                        />
                      </td>

                      {/* Merchant & Store Name */}
                      <td className="p-4">
                        <div className="flex items-center gap-3">
                          <div
                            className={`w-10 h-10 rounded-xl bg-gradient-to-br ${merchant.avatarBg} flex items-center justify-center text-white font-bold text-sm shadow-md shrink-0`}
                          >
                            {merchant.avatarInitials}
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-navy-800 dark:text-navy-800 dark:text-white text-sm group-hover:text-orange-600 dark:group-hover:text-orange-400 transition-colors">
                                {merchant.storeName}
                              </span>
                              {merchant.verified && (
                                <ShieldCheck className="w-3.5 h-3.5 text-orange-600 dark:text-orange-400" />
                              )}
                            </div>
                            <div className="flex items-center gap-2 mt-0.5">
                              <span className="tabular-nums text-xs font-bold text-indigo-600 dark:text-indigo-400 bg-indigo-500/10 px-1.5 py-0.5 rounded border border-indigo-500/20">
                                {merchant.merchantCode}
                              </span>
                              <span className="text-slate-600 dark:text-slate-300 text-xs flex items-center gap-1 truncate max-w-[140px]">
                                <MapPin className="w-3 h-3 text-slate-500 dark:text-slate-400 shrink-0" />
                                {merchant.location}
                              </span>
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Owner Contact */}
                      <td className="p-4">
                        <div className="font-medium text-navy-800 dark:text-slate-100">
                          {merchant.ownerName}
                        </div>
                        <div className="text-slate-600 dark:text-slate-300 tabular-nums text-xs flex items-center gap-1 mt-0.5">
                          <Phone className="w-3 h-3 text-slate-500 dark:text-slate-400" />
                          {merchant.phone}
                        </div>
                        <div className="text-slate-500 dark:text-slate-400 tabular-nums text-xs">
                          {merchant.email}
                        </div>
                      </td>

                      {/* Bank / Payout Snapshot */}
                      <td className="p-4">
                        <div className="flex items-center gap-1.5 font-medium text-slate-700 dark:text-slate-200">
                          <Landmark className="w-3.5 h-3.5 text-orange-600 dark:text-orange-400 shrink-0" />
                          <span className="truncate max-w-[150px]">
                            {merchant.payoutAccount.provider}
                          </span>
                        </div>
                        <div className="text-xs text-slate-600 dark:text-slate-300 tabular-nums mt-0.5">
                          A/C: ••••{merchant.payoutAccount.accountNumber.slice(-4)}
                        </div>
                        <div className="text-xs text-orange-600 dark:text-orange-400 tabular-nums font-medium">
                          bKash: {merchant.payoutAccount.bkashNumber}
                        </div>
                      </td>

                      {/* Status */}
                      <td className="p-4">
                        <StatusBadge status={merchant.status} />
                      </td>

                      {/* SKU Count */}
                      <td className="p-4 text-center">
                        <span className="px-2.5 py-1 rounded-lg bg-slate-50 dark:bg-navy-950 border border-slate-200 dark:border-white/10 tabular-nums font-bold text-navy-800 dark:text-slate-100">
                          {skuCount}
                        </span>
                      </td>

                      {/* Actions Dropdown */}
                      <td className="p-4 text-right">
                        <div className="relative inline-block text-left" data-dropdown-container>
                          <button
                            type="button"
                            onClick={() =>
                              setActiveMenuId(isMenuOpen ? null : `desktop-${merchant.id}`)
                            }
                            className="px-2.5 py-1.5 rounded-xl bg-slate-100 dark:bg-navy-800 hover:bg-slate-200 dark:hover:bg-navy-700 text-xs font-bold text-navy-800 dark:text-slate-100 border border-slate-300 dark:border-white/15 flex items-center gap-1.5 transition-colors cursor-pointer shadow-sm ml-auto"
                            title="Actions menu"
                          >
                            <span>Actions</span>
                            <ChevronDown
                              className={`w-3.5 h-3.5 transition-transform duration-200 ${
                                isMenuOpen ? 'rotate-180 text-orange-600 dark:text-orange-400' : 'text-slate-600 dark:text-slate-300'
                              }`}
                            />
                          </button>

                          {isMenuOpen && (
                            <div
                              className={`absolute right-0 ${
                                isNearBottom ? 'bottom-full mb-1.5' : 'top-full mt-1.5'
                              } w-48 rounded-xl bg-white dark:bg-navy-900 border border-slate-200 dark:border-white/10 shadow-2xl py-1.5 z-[100] text-left text-xs pointer-events-auto`}
                            >
                              {/* 1. View Profile */}
                              <button
                                type="button"
                                onClick={() => {
                                  setActiveMenuId(null);
                                  onSelectMerchant(merchant);
                                }}
                                className="w-full px-3.5 py-2 text-left text-navy-800 dark:text-slate-100 hover:bg-slate-100/80 dark:hover:bg-navy-800/80 font-semibold flex items-center gap-2.5 transition-colors cursor-pointer"
                              >
                                <Eye className="w-4 h-4 text-indigo-600 dark:text-indigo-400 shrink-0" />
                                <span>View Profile</span>
                              </button>

                              {/* 2. Toggle Status (Suspend / Approve) */}
                              <button
                                type="button"
                                onClick={() => {
                                  setActiveMenuId(null);
                                  onToggleStatus(merchant.id, merchant.status);
                                }}
                                className={`w-full px-3.5 py-2 text-left font-semibold flex items-center gap-2.5 transition-colors cursor-pointer border-t border-slate-200/80 dark:border-white/10 ${
                                  merchant.status === 'Active'
                                    ? 'text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40'
                                    : 'text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/40'
                                }`}
                              >
                                {merchant.status === 'Active' ? (
                                  <>
                                    <Ban className="w-4 h-4 text-rose-600 dark:text-rose-400 shrink-0" />
                                    <span>Suspend Merchant</span>
                                  </>
                                ) : (
                                  <>
                                    <Check className="w-4 h-4 text-orange-600 dark:text-orange-400 shrink-0" />
                                    <span>Approve Merchant</span>
                                  </>
                                )}
                              </button>
                            </div>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Bulk Approve Confirmation Modal */}
      <Modal
        isOpen={bulkApproveModalOpen}
        onClose={() => setBulkApproveModalOpen(false)}
        title="Bulk Approve Merchants"
        subtitle={`Confirm approving ${selectedMerchantIds.size} selected merchants`}
        size="md"
      >
        <div className="space-y-4">
          <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-700 dark:text-emerald-300 flex items-start gap-3 text-xs leading-relaxed">
            <CheckCircle2 className="w-5 h-5 shrink-0 text-orange-600 dark:text-orange-400 mt-0.5" />
            <div>
              <p className="font-bold text-navy-800 dark:text-white mb-1">
                Approve {selectedMerchantIds.size} Merchant Account{selectedMerchantIds.size > 1 ? 's' : ''}
              </p>
              <p>
                All selected merchants will be marked as <strong className="text-orange-600 dark:text-orange-400">Active</strong>, 
                their store profiles will receive verified status, and they will be able to process warehouse orders and receive COD payouts.
              </p>
            </div>
          </div>

          <div className="flex justify-end gap-2.5 pt-2">
            <button
              type="button"
              onClick={() => setBulkApproveModalOpen(false)}
              className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-navy-800 hover:bg-slate-200 dark:hover:bg-navy-700 text-slate-700 dark:text-slate-200 font-semibold text-xs cursor-pointer transition-colors"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleConfirmBulkApprove}
              className="px-5 py-2 rounded-xl bg-orange-600 hover:bg-orange-700 text-white font-bold text-xs shadow-lg shadow-orange-500/25 cursor-pointer transition-all"
            >
              Confirm &amp; Approve ({selectedMerchantIds.size})
            </button>
          </div>
        </div>
      </Modal>

      {/* Bulk Suspend Confirmation Modal */}
      <Modal
        isOpen={bulkSuspendModalOpen}
        onClose={() => setBulkSuspendModalOpen(false)}
        title="Bulk Suspend Merchants"
        subtitle={`Confirm suspending ${selectedMerchantIds.size} selected merchants`}
        size="md"
      >
        <div className="space-y-4">
          <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-700 dark:text-rose-300 flex items-start gap-3 text-xs leading-relaxed">
            <AlertTriangle className="w-5 h-5 shrink-0 text-rose-600 dark:text-rose-400 mt-0.5" />
            <div>
              <p className="font-bold text-navy-800 dark:text-white mb-1">
                Suspend {selectedMerchantIds.size} Merchant Account{selectedMerchantIds.size > 1 ? 's' : ''}
              </p>
              <p>
                All selected merchants will be marked as <strong className="text-rose-600 dark:text-rose-400">Suspended</strong>.
                Their order fulfillment operations and COD disbursements will be put on hold until re-activated.
              </p>
            </div>
          </div>

          <div className="flex justify-end gap-2.5 pt-2">
            <button
              type="button"
              onClick={() => setBulkSuspendModalOpen(false)}
              className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-navy-800 hover:bg-slate-200 dark:hover:bg-navy-700 text-slate-700 dark:text-slate-200 font-semibold text-xs cursor-pointer transition-colors"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleConfirmBulkSuspend}
              className="px-5 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs shadow-lg shadow-rose-600/20 cursor-pointer transition-all"
            >
              Confirm &amp; Suspend ({selectedMerchantIds.size})
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
