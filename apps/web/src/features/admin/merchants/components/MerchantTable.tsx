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
import { Modal } from '@/components/ui/Modal';
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
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-900 border border-slate-800 p-4 rounded-2xl shadow-lg">
        {/* Search Input */}
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search store name, merchant code, phone..."
            className="w-full pl-10 pr-4 py-2 bg-slate-950 border border-slate-700/80 rounded-xl text-xs sm:text-sm font-mono text-slate-200 placeholder:text-slate-500 focus:outline-none focus:border-emerald-500 transition-colors"
          />
        </div>

        {/* Status Filter - Select Dropdown Option */}
        <div className="flex items-center gap-2 self-stretch sm:self-auto">
          <label htmlFor="merchant-status-select" className="text-xs font-semibold text-slate-400 shrink-0">
            Status:
          </label>
          <select
            id="merchant-status-select"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as any)}
            className="w-full sm:w-auto px-3.5 py-2 bg-slate-950 border border-slate-700/80 rounded-xl text-xs sm:text-sm font-semibold text-slate-200 focus:outline-none focus:border-emerald-500 cursor-pointer shadow-sm"
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
        <div className="bg-slate-900 border border-emerald-500/50 rounded-2xl p-3 sm:p-4 flex flex-col sm:flex-row items-center justify-between gap-3 shadow-xl animate-in fade-in-50 duration-200">
          <div className="flex items-center gap-3">
            <span className="w-8 h-8 rounded-xl bg-emerald-500/20 text-emerald-400 font-mono font-bold flex items-center justify-center text-xs">
              {selectedMerchantIds.size}
            </span>
            <div className="text-xs sm:text-sm">
              <span className="text-white font-bold">{selectedMerchantIds.size}</span>
              <span className="text-slate-400"> merchant{selectedMerchantIds.size > 1 ? 's' : ''} selected</span>
            </div>
            <button
              type="button"
              onClick={() => setSelectedMerchantIds(new Set())}
              className="text-xs text-slate-400 hover:text-white underline underline-offset-2 ml-2 cursor-pointer transition-colors"
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
                className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-bold text-slate-200 border border-slate-700 flex items-center gap-1.5 transition-colors cursor-pointer shadow-sm"
              >
                <span>Bulk Actions</span>
                <ChevronDown
                  className={`w-3.5 h-3.5 transition-transform duration-200 ${
                    isBulkMenuOpen ? 'rotate-180 text-emerald-400' : 'text-slate-400'
                  }`}
                />
              </button>

              {isBulkMenuOpen && (
                <div className="absolute right-0 top-full mt-1.5 w-60 rounded-xl bg-slate-900 border border-slate-800 shadow-2xl py-1.5 z-[100] text-left font-sans text-xs">
                  <button
                    type="button"
                    onClick={() => {
                      setIsBulkMenuOpen(false);
                      setBulkApproveModalOpen(true);
                    }}
                    className="w-full px-3.5 py-2 text-left text-emerald-300 hover:bg-emerald-950/40 flex items-center gap-2.5 transition-colors cursor-pointer"
                  >
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 pointer-events-none" />
                    <span>Approve Selected ({selectedMerchantIds.size})</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setIsBulkMenuOpen(false);
                      setBulkSuspendModalOpen(true);
                    }}
                    className="w-full px-3.5 py-2 text-left text-rose-300 hover:bg-rose-950/40 flex items-center gap-2.5 transition-colors cursor-pointer border-t border-slate-800/80"
                  >
                    <Ban className="w-4 h-4 text-rose-400 pointer-events-none" />
                    <span>Suspend Selected ({selectedMerchantIds.size})</span>
                  </button>
                </div>
              )}
            </div>

            {/* Direct Quick Action: Approve */}
            <button
              type="button"
              onClick={() => setBulkApproveModalOpen(true)}
              className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 active:scale-95 text-white text-xs font-bold flex items-center gap-1.5 shadow-lg shadow-emerald-600/20 transition-all cursor-pointer"
            >
              <Check className="w-4 h-4 pointer-events-none" />
              <span>Approve ({selectedMerchantIds.size})</span>
            </button>

            {/* Direct Quick Action: Suspend */}
            <button
              type="button"
              onClick={() => setBulkSuspendModalOpen(true)}
              className="px-3.5 py-2 rounded-xl bg-rose-600/20 hover:bg-rose-600/30 border border-rose-500/40 text-rose-300 hover:text-white active:scale-95 text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer"
            >
              <Ban className="w-4 h-4 pointer-events-none" />
              <span>Suspend ({selectedMerchantIds.size})</span>
            </button>
          </div>
        </div>
      )}

      {/* Table Container */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900 shadow-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-950/80 text-slate-400 uppercase tracking-wider font-bold border-b border-slate-800 text-[11px]">
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
                    className="w-4 h-4 rounded border-slate-700 bg-slate-900 text-emerald-600 focus:ring-emerald-500 cursor-pointer accent-emerald-500"
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
            <tbody className="divide-y divide-slate-800/80">
              {filteredMerchants.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-slate-400">
                    No merchants found matching your search.
                  </td>
                </tr>
              ) : (
                filteredMerchants.map((merchant, idx) => {
                  const skuCount = getProductCount(merchant.merchantCode);
                  const isSelected = selectedMerchantIds.has(merchant.id);
                  const isNearBottom = idx >= filteredMerchants.length - 2;

                  return (
                    <tr
                      key={merchant.id}
                      className={`hover:bg-slate-800/40 transition-colors group ${
                        isSelected ? 'bg-emerald-950/20' : ''
                      }`}
                    >
                      {/* Checkbox Cell */}
                      <td className="p-4 w-12 text-center" onClick={(e) => e.stopPropagation()}>
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => handleToggleSelect(merchant.id)}
                          className="w-4 h-4 rounded border-slate-700 bg-slate-900 text-emerald-600 focus:ring-emerald-500 cursor-pointer accent-emerald-500"
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
                              <span className="font-bold text-slate-100 text-sm group-hover:text-emerald-400 transition-colors">
                                {merchant.storeName}
                              </span>
                              {merchant.verified && (
                                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                              )}
                            </div>
                            <div className="flex items-center gap-2 mt-0.5">
                              <span className="font-mono text-[11px] font-bold text-indigo-400 bg-indigo-500/10 px-1.5 py-0.5 rounded border border-indigo-500/20">
                                {merchant.merchantCode}
                              </span>
                              <span className="text-slate-400 text-[11px] flex items-center gap-1 truncate max-w-[140px]">
                                <MapPin className="w-3 h-3 text-slate-500 shrink-0" />
                                {merchant.location}
                              </span>
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Owner Contact */}
                      <td className="p-4">
                        <div className="font-medium text-slate-200">
                          {merchant.ownerName}
                        </div>
                        <div className="text-slate-400 font-mono text-[11px] flex items-center gap-1 mt-0.5">
                          <Phone className="w-3 h-3 text-slate-500" />
                          {merchant.phone}
                        </div>
                        <div className="text-slate-500 font-mono text-[11px]">
                          {merchant.email}
                        </div>
                      </td>

                      {/* Bank / Payout Snapshot */}
                      <td className="p-4">
                        <div className="flex items-center gap-1.5 font-medium text-slate-300">
                          <Landmark className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                          <span className="truncate max-w-[150px]">
                            {merchant.payoutAccount.provider}
                          </span>
                        </div>
                        <div className="text-[11px] text-slate-400 font-mono mt-0.5">
                          A/C: ••••{merchant.payoutAccount.accountNumber.slice(-4)}
                        </div>
                        <div className="text-[11px] text-emerald-400 font-mono font-medium">
                          bKash: {merchant.payoutAccount.bkashNumber}
                        </div>
                      </td>

                      {/* Status */}
                      <td className="p-4">
                        <StatusBadge status={merchant.status} />
                      </td>

                      {/* SKU Count */}
                      <td className="p-4 text-center">
                        <span className="px-2.5 py-1 rounded-lg bg-slate-950 border border-slate-800 font-mono font-bold text-slate-200">
                          {skuCount}
                        </span>
                      </td>

                      {/* Actions Dropdown */}
                      <td className="p-4 text-right">
                        <div className="relative inline-block text-left" data-dropdown-container>
                          <button
                            type="button"
                            onClick={() =>
                              setActiveMenuId(activeMenuId === merchant.id ? null : merchant.id)
                            }
                            className="px-2.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-bold text-slate-200 border border-slate-700 flex items-center gap-1.5 transition-colors cursor-pointer shadow-sm ml-auto"
                            title="Actions menu"
                          >
                            <span>Actions</span>
                            <ChevronDown
                              className={`w-3.5 h-3.5 transition-transform duration-200 ${
                                activeMenuId === merchant.id ? 'rotate-180 text-emerald-400' : 'text-slate-400'
                              }`}
                            />
                          </button>

                          {activeMenuId === merchant.id && (
                            <div
                              className={`absolute right-0 ${
                                isNearBottom ? 'bottom-full mb-1.5' : 'top-full mt-1.5'
                              } w-48 rounded-xl bg-slate-900 border border-slate-800 shadow-2xl py-1.5 z-[100] text-left text-xs pointer-events-auto`}
                            >
                              {/* 1. View Profile */}
                              <button
                                type="button"
                                onClick={() => {
                                  setActiveMenuId(null);
                                  onSelectMerchant(merchant);
                                }}
                                className="w-full px-3.5 py-2 text-left text-slate-200 hover:bg-slate-800/80 font-semibold flex items-center gap-2.5 transition-colors cursor-pointer"
                              >
                                <Eye className="w-4 h-4 text-indigo-400 shrink-0" />
                                <span>View Profile</span>
                              </button>

                              {/* 2. Toggle Status (Suspend / Approve) */}
                              <button
                                type="button"
                                onClick={() => {
                                  setActiveMenuId(null);
                                  onToggleStatus(merchant.id, merchant.status);
                                }}
                                className={`w-full px-3.5 py-2 text-left font-semibold flex items-center gap-2.5 transition-colors cursor-pointer border-t border-slate-800/80 ${
                                  merchant.status === 'Active'
                                    ? 'text-rose-400 hover:bg-rose-950/40'
                                    : 'text-emerald-400 hover:bg-emerald-950/40'
                                }`}
                              >
                                {merchant.status === 'Active' ? (
                                  <>
                                    <Ban className="w-4 h-4 text-rose-400 shrink-0" />
                                    <span>Suspend Merchant</span>
                                  </>
                                ) : (
                                  <>
                                    <Check className="w-4 h-4 text-emerald-400 shrink-0" />
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
          <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 flex items-start gap-3 text-xs leading-relaxed">
            <CheckCircle2 className="w-5 h-5 shrink-0 text-emerald-400 mt-0.5" />
            <div>
              <p className="font-bold text-white mb-1">
                Approve {selectedMerchantIds.size} Merchant Account{selectedMerchantIds.size > 1 ? 's' : ''}
              </p>
              <p>
                All selected merchants will be marked as <strong className="text-emerald-400">Active</strong>, 
                their store profiles will receive verified status, and they will be able to process warehouse orders and receive COD payouts.
              </p>
            </div>
          </div>

          <div className="flex justify-end gap-2.5 pt-2">
            <button
              type="button"
              onClick={() => setBulkApproveModalOpen(false)}
              className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-xs cursor-pointer transition-colors"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleConfirmBulkApprove}
              className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-lg shadow-emerald-600/20 cursor-pointer transition-all"
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
          <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 flex items-start gap-3 text-xs leading-relaxed">
            <AlertTriangle className="w-5 h-5 shrink-0 text-rose-400 mt-0.5" />
            <div>
              <p className="font-bold text-white mb-1">
                Suspend {selectedMerchantIds.size} Merchant Account{selectedMerchantIds.size > 1 ? 's' : ''}
              </p>
              <p>
                All selected merchants will be marked as <strong className="text-rose-400">Suspended</strong>.
                Their order fulfillment operations and COD disbursements will be put on hold until re-activated.
              </p>
            </div>
          </div>

          <div className="flex justify-end gap-2.5 pt-2">
            <button
              type="button"
              onClick={() => setBulkSuspendModalOpen(false)}
              className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-xs cursor-pointer transition-colors"
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
