'use client';

import React, { useState, useMemo, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { createPortal } from 'react-dom';
import {
  ShieldCheck,
  Search,
  Clock,
  CheckCircle2,
  XCircle,
  Landmark,
  Smartphone,
  Building2,
  MoreVertical,
  Eye,
  FileText,
  Store,
  RotateCcw,
  ChevronDown,
  HandCoins,
  Users,
  CreditCard,
} from 'lucide-react';
import { Modal } from '@/components/admin/AdminModal';
import { DocumentViewerModal } from '@/components/ui';
import { PaymentRequestsPagination } from '@/features/admin/payouts/components/PaymentRequestsPagination';
import { useMerchantDirectory } from '@/features/admin/merchants/useMerchantDirectory';
import { MerchantRecord } from '@/features/admin/merchants/types';

type VerificationFilter = 'ALL' | 'PENDING_REVIEW' | 'VERIFIED' | 'REJECTED';
type ChannelFilter = 'ALL' | 'BANK' | 'BKASH' | 'NAGAD';

interface DropdownPosition {
  merchantId: string;
  top: number;
  left: number;
}

const MENU_WIDTH = 224;
const MENU_HEIGHT = 228;

function resolveChannelType(provider?: string): 'BKASH' | 'NAGAD' | 'BANK' {
  const lower = (provider || '').toLowerCase();
  if (lower.includes('bkash')) return 'BKASH';
  if (lower.includes('nagad')) return 'NAGAD';
  return 'BANK';
}

function getStatusRank(status?: string): number {
  if (status === 'PENDING_REVIEW') return 0;
  if (status === 'REJECTED') return 1;
  return 2;
}

function getAccountTimestampMs(m: MerchantRecord): number {
  const raw = m.payoutAccount?.updatedAt || m.payoutAccount?.submittedAt;
  if (!raw) return 0;
  const ms = Date.parse(raw);
  return Number.isFinite(ms) ? ms : 0;
}

function formatSubmittedTimestamp(value?: string): string {
  if (!value) return 'Recently submitted';
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return value;
  return parsed.toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }) + ', ' + parsed.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  });
}

function renderChannelBadge(provider?: string) {
  const channel = resolveChannelType(provider);
  if (channel === 'BKASH') {
    return (
      <span className="inline-flex items-center gap-1.5 font-semibold text-xs text-rose-600 dark:text-rose-400">
        <Smartphone className="w-3.5 h-3.5 shrink-0" />
        <span>bKash</span>
      </span>
    );
  }
  if (channel === 'NAGAD') {
    return (
      <span className="inline-flex items-center gap-1.5 font-semibold text-xs text-orange-600 dark:text-orange-400">
        <Smartphone className="w-3.5 h-3.5 shrink-0" />
        <span>Nagad</span>
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1.5 font-semibold text-xs text-sky-600 dark:text-sky-400">
      <Building2 className="w-3.5 h-3.5 shrink-0" />
      <span>Bank Transfer</span>
    </span>
  );
}

function renderStatusBadge(status?: string) {
  if (status === 'VERIFIED') {
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30 select-none">
        <CheckCircle2 className="w-3 h-3 shrink-0" />
        <span>Verified</span>
      </span>
    );
  }
  if (status === 'REJECTED') {
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider bg-rose-500/15 text-rose-700 dark:text-rose-300 border border-rose-500/30 select-none">
        <XCircle className="w-3 h-3 shrink-0" />
        <span>Rejected</span>
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider bg-amber-500/15 text-amber-700 dark:text-amber-300 border border-amber-500/30 select-none">
      <Clock className="w-3 h-3 shrink-0" />
      <span>Pending Approval</span>
    </span>
  );
}

export function PaymentAccountVerificationsManager() {
  const {
    merchants,
    hydrated,
    toastMessage,
    handleReviewPayoutAccount,
    handleBulkReviewPayoutAccounts,
  } = useMerchantDirectory();

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<VerificationFilter>('ALL');
  const [channelFilter, setChannelFilter] = useState<ChannelFilter>('ALL');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());

  const [pageSize, setPageSize] = useState<number>(10);
  const [currentPage, setCurrentPage] = useState<number>(1);

  const [menuPosition, setMenuPosition] = useState<DropdownPosition | null>(null);
  const [inspectMerchantId, setInspectMerchantId] = useState<string | null>(null);
  const [chequePreviewMerchant, setChequePreviewMerchant] = useState<MerchantRecord | null>(null);

  const [rejectTargetIds, setRejectTargetIds] = useState<string[] | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');

  // Submitted payout accounts only (exclude UNVERIFIED empty records)
  const submittedMerchants = useMemo(() => {
    return merchants
      .filter((m) => {
        const payout = m.payoutAccount;
        const hasAccountCoords = Boolean(
          payout?.accountNumber?.trim() ||
            payout?.bkashNumber?.trim() ||
            payout?.status === 'REJECTED',
        );
        return hasAccountCoords && payout?.status !== 'UNVERIFIED';
      })
      .sort((a, b) => {
        const rankDiff =
          getStatusRank(a.payoutAccount?.status) - getStatusRank(b.payoutAccount?.status);
        if (rankDiff !== 0) return rankDiff;
        return getAccountTimestampMs(b) - getAccountTimestampMs(a);
      });
  }, [merchants]);

  const inspectMerchant = useMemo(
    () => submittedMerchants.find((m) => m.id === inspectMerchantId) || null,
    [submittedMerchants, inspectMerchantId],
  );

  const stats = useMemo(() => {
    const total = submittedMerchants.length;
    const pending = submittedMerchants.filter(
      (m) => m.payoutAccount?.status === 'PENDING_REVIEW',
    ).length;
    const verified = submittedMerchants.filter(
      (m) => m.payoutAccount?.status === 'VERIFIED',
    ).length;
    const rejected = submittedMerchants.filter(
      (m) => m.payoutAccount?.status === 'REJECTED',
    ).length;
    return { total, pending, verified, rejected };
  }, [submittedMerchants]);

  const filteredMerchants = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    return submittedMerchants.filter((m) => {
      const p = m.payoutAccount;
      const matchesSearch =
        !q ||
        m.storeName.toLowerCase().includes(q) ||
        m.merchantCode.toLowerCase().includes(q) ||
        m.ownerName.toLowerCase().includes(q) ||
        m.email.toLowerCase().includes(q) ||
        (p?.provider || '').toLowerCase().includes(q) ||
        (p?.accountHolder || '').toLowerCase().includes(q) ||
        (p?.accountNumber || '').toLowerCase().includes(q) ||
        (p?.bkashNumber || '').toLowerCase().includes(q);

      const matchesStatus = statusFilter === 'ALL' || p?.status === statusFilter;
      const matchesChannel =
        channelFilter === 'ALL' || resolveChannelType(p?.provider) === channelFilter;

      return matchesSearch && matchesStatus && matchesChannel;
    });
  }, [submittedMerchants, searchQuery, statusFilter, channelFilter]);

  // Reset pagination & selection when filters change
  useEffect(() => {
    setCurrentPage(1);
    setSelectedIds([]);
  }, [searchQuery, statusFilter, channelFilter, pageSize]);

  // Close floating portal dropdown on outside click, scroll, or resize
  useEffect(() => {
    if (!menuPosition) return;
    const closeMenu = () => setMenuPosition(null);
    const handleMouseDown = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target.closest('[data-portal-dropdown]') && !target.closest('[data-dropdown-trigger]')) {
        setMenuPosition(null);
      }
    };

    document.addEventListener('mousedown', handleMouseDown);
    window.addEventListener('scroll', closeMenu, true);
    window.addEventListener('resize', closeMenu);
    return () => {
      document.removeEventListener('mousedown', handleMouseDown);
      window.removeEventListener('scroll', closeMenu, true);
      window.removeEventListener('resize', closeMenu);
    };
  }, [menuPosition]);

  const handleToggleMenu = useCallback(
    (merchantId: string, e: React.MouseEvent<HTMLButtonElement>) => {
      e.stopPropagation();
      if (menuPosition?.merchantId === merchantId) {
        setMenuPosition(null);
        return;
      }
      const rect = e.currentTarget.getBoundingClientRect();
      const spaceBelow = window.innerHeight - rect.bottom;
      const spaceAbove = rect.top;
      const openUpwards = spaceBelow < MENU_HEIGHT && spaceAbove >= spaceBelow;
      const rawTop = openUpwards ? rect.top - MENU_HEIGHT - 6 : rect.bottom + 6;
      const clampedTop = Math.max(10, Math.min(rawTop, window.innerHeight - MENU_HEIGHT - 10));
      const clampedLeft = Math.max(
        10,
        Math.min(rect.right - MENU_WIDTH, window.innerWidth - MENU_WIDTH - 10),
      );
      setMenuPosition({ merchantId, top: clampedTop, left: clampedLeft });
    },
    [menuPosition],
  );

  // Pagination calculation
  const totalItems = filteredMerchants.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  const safePage = Math.min(Math.max(1, currentPage), totalPages);
  const startIndex = (safePage - 1) * pageSize;
  const paginatedMerchants = filteredMerchants.slice(startIndex, startIndex + pageSize);

  const allVisibleSelected =
    paginatedMerchants.length > 0 &&
    paginatedMerchants.every((m) => selectedIds.includes(m.id));

  const toggleSelectAll = () => {
    setSelectedIds(allVisibleSelected ? [] : paginatedMerchants.map((m) => m.id));
  };

  const toggleSelectRow = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id],
    );
  };

  const toggleExpandMobile = (id: string) => {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const openRejectModal = (ids: string[]) => {
    setMenuPosition(null);
    setRejectTargetIds(ids);
    setRejectionReason('');
  };

  const handleConfirmReject = (e: React.FormEvent) => {
    e.preventDefault();
    if (!rejectTargetIds || rejectTargetIds.length === 0) return;
    const reason = rejectionReason.trim() || 'Payout details verification failed';
    if (rejectTargetIds.length === 1) {
      handleReviewPayoutAccount(rejectTargetIds[0], 'REJECT', reason);
    } else {
      handleBulkReviewPayoutAccounts(rejectTargetIds, 'REJECT', reason);
      setSelectedIds([]);
    }
    setRejectTargetIds(null);
    setRejectionReason('');
  };

  const handleBulkApprove = () => {
    if (selectedIds.length === 0) return;
    handleBulkReviewPayoutAccounts(selectedIds, 'APPROVE');
    setSelectedIds([]);
  };

  const activeMenuMerchant = useMemo(
    () =>
      menuPosition
        ? submittedMerchants.find((m) => m.id === menuPosition.merchantId) || null
        : null,
    [menuPosition, submittedMerchants],
  );

  const hasActiveFilters =
    Boolean(searchQuery) || statusFilter !== 'ALL' || channelFilter !== 'ALL';

  const statusTabs: { id: VerificationFilter; label: string; count: number }[] = [
    { id: 'ALL', label: 'All Accounts', count: stats.total },
    { id: 'PENDING_REVIEW', label: 'Pending Approval', count: stats.pending },
    { id: 'VERIFIED', label: 'Verified', count: stats.verified },
    { id: 'REJECTED', label: 'Rejected', count: stats.rejected },
  ];

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-6 right-6 z-50 bg-orange-600 text-white px-4 py-3 rounded-xl shadow-2xl flex items-center gap-2 text-xs font-bold animate-in fade-in">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5 flex-wrap">
            <h1 className="text-2xl font-bold tracking-tight text-navy-900 dark:text-white">
              Payment Account Verification Requests
            </h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-orange-500/10 text-orange-600 dark:text-orange-400 border border-orange-500/20">
              KYC &amp; Payout Audit
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 mt-1">
            Inspect, verify, or reject merchant bank and MFS payout accounts submitted from the Merchant Portal.
          </p>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          <Link
            href="/admin/payouts"
            className="px-3.5 py-2 rounded-xl bg-white dark:bg-navy-900 hover:bg-slate-100 dark:hover:bg-navy-800 border border-slate-300 dark:border-white/15 text-xs font-bold text-navy-800 dark:text-slate-100 flex items-center gap-2 shadow-sm transition-colors"
          >
            <HandCoins className="w-4 h-4 text-orange-600 dark:text-orange-400" />
            <span>Payment Requests</span>
          </Link>

          <Link
            href="/admin/merchants"
            className="px-3.5 py-2 rounded-xl bg-white dark:bg-navy-900 hover:bg-slate-100 dark:hover:bg-navy-800 border border-slate-300 dark:border-white/15 text-xs font-bold text-navy-800 dark:text-slate-100 flex items-center gap-2 shadow-sm transition-colors"
          >
            <Users className="w-4 h-4 text-orange-600 dark:text-orange-400" />
            <span>Merchant List</span>
          </Link>
        </div>
      </div>

      {/* 4 KPI Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
        <div className="rounded-2xl border border-slate-200 dark:border-white/10 bg-white dark:bg-navy-900 p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-600 dark:text-slate-300 font-medium">
              Submitted Accounts
            </span>
            <div className="w-8 h-8 rounded-xl bg-slate-100 dark:bg-navy-800 flex items-center justify-center text-slate-700 dark:text-slate-200">
              <CreditCard className="w-4 h-4" />
            </div>
          </div>
          <div className="tabular-nums text-xl sm:text-2xl font-extrabold text-navy-900 dark:text-white mt-2">
            {stats.total}
          </div>
          <span className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 block">
            Merchants with payout info
          </span>
        </div>

        <div className="rounded-2xl border border-amber-500/30 bg-amber-50/70 dark:bg-amber-950/15 p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs text-amber-700 dark:text-amber-300 font-medium">
              Pending Approval
            </span>
            <div className="w-8 h-8 rounded-xl bg-amber-500/15 flex items-center justify-center text-amber-700 dark:text-amber-300 border border-amber-500/30">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="tabular-nums text-xl sm:text-2xl font-extrabold text-amber-700 dark:text-amber-300 mt-2">
            {stats.pending}
          </div>
          <span className="text-[11px] text-amber-600 dark:text-amber-400 mt-0.5 block">
            Awaiting KYC review
          </span>
        </div>

        <div className="rounded-2xl border border-emerald-500/30 bg-emerald-50/70 dark:bg-emerald-950/15 p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs text-emerald-700 dark:text-emerald-300 font-medium">
              Verified Accounts
            </span>
            <div className="w-8 h-8 rounded-xl bg-emerald-500/15 flex items-center justify-center text-emerald-700 dark:text-emerald-300 border border-emerald-500/30">
              <ShieldCheck className="w-4 h-4" />
            </div>
          </div>
          <div className="tabular-nums text-xl sm:text-2xl font-extrabold text-emerald-700 dark:text-emerald-300 mt-2">
            {stats.verified}
          </div>
          <span className="text-[11px] text-emerald-600 dark:text-emerald-400 mt-0.5 block">
            Ready for COD payouts
          </span>
        </div>

        <div className="rounded-2xl border border-rose-500/30 bg-rose-50/70 dark:bg-rose-950/15 p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs text-rose-700 dark:text-rose-300 font-medium">
              Rejected Accounts
            </span>
            <div className="w-8 h-8 rounded-xl bg-rose-500/15 flex items-center justify-center text-rose-700 dark:text-rose-300 border border-rose-500/30">
              <XCircle className="w-4 h-4" />
            </div>
          </div>
          <div className="tabular-nums text-xl sm:text-2xl font-extrabold text-rose-700 dark:text-rose-300 mt-2">
            {stats.rejected}
          </div>
          <span className="text-[11px] text-rose-600 dark:text-rose-400 mt-0.5 block">
            Needs resubmission
          </span>
        </div>
      </div>

      {/* Filters & Bulk Actions Bar */}
      <div className="rounded-2xl border border-slate-200 dark:border-white/10 bg-white dark:bg-navy-900 p-4 space-y-3 shadow-md">
        {/* Status Pills */}
        <div className="flex flex-wrap items-center gap-2 pb-3 border-b border-slate-200/80 dark:border-white/10">
          {statusTabs.map((tab) => {
            const isActive = statusFilter === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setStatusFilter(tab.id)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-2 transition-colors cursor-pointer ${
                  isActive
                    ? 'bg-orange-600 text-white shadow-sm'
                    : 'bg-slate-100 dark:bg-navy-800 text-slate-700 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-navy-700'
                }`}
              >
                <span>{tab.label}</span>
                <span
                  className={`px-1.5 py-0.5 rounded-full text-[10px] tabular-nums ${
                    isActive
                      ? 'bg-white/20 text-white'
                      : 'bg-white dark:bg-navy-900 text-slate-600 dark:text-slate-300'
                  }`}
                >
                  {tab.count}
                </span>
              </button>
            );
          })}
        </div>

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2.5 flex-1">
            <div className="relative flex-1 sm:flex-initial sm:w-80 min-w-[210px]">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 dark:text-slate-400 pointer-events-none" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search merchant, code, provider, A/C #..."
                className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-50 dark:bg-navy-950 border border-slate-200 dark:border-white/10 text-xs text-navy-900 dark:text-slate-100 placeholder-slate-500 dark:placeholder-slate-400 focus:outline-none focus:border-orange-500 transition-colors"
              />
            </div>

            <select
              value={channelFilter}
              onChange={(e) => setChannelFilter(e.target.value as ChannelFilter)}
              aria-label="Filter by Channel"
              className="px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-navy-950 border border-slate-200 dark:border-white/10 text-xs font-semibold text-navy-800 dark:text-slate-100 focus:outline-none focus:border-orange-500 cursor-pointer"
            >
              <option value="ALL">All Channels</option>
              <option value="BANK">Bank Transfer</option>
              <option value="BKASH">bKash</option>
              <option value="NAGAD">Nagad</option>
            </select>

            {hasActiveFilters && (
              <button
                type="button"
                onClick={() => {
                  setSearchQuery('');
                  setStatusFilter('ALL');
                  setChannelFilter('ALL');
                }}
                className="px-3 py-2.5 rounded-xl bg-slate-100 dark:bg-navy-800 hover:bg-slate-200 dark:hover:bg-navy-700 text-xs font-semibold text-slate-700 dark:text-slate-200 flex items-center gap-1 cursor-pointer transition-colors"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Reset</span>
              </button>
            )}
          </div>

          {/* Bulk Action Bar */}
          {selectedIds.length > 0 && (
            <div className="flex flex-wrap items-center gap-2 bg-slate-50 dark:bg-navy-950 border border-orange-500/35 px-3.5 py-2 rounded-xl shadow-sm">
              <span className="text-xs tabular-nums font-bold text-orange-600 dark:text-orange-400">
                {selectedIds.length} selected
              </span>
              <div className="h-4 w-px bg-slate-200 dark:bg-white/10" />
              <button
                type="button"
                onClick={handleBulkApprove}
                className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Approve Selected</span>
              </button>
              <button
                type="button"
                onClick={() => openRejectModal(selectedIds)}
                className="px-3 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <XCircle className="w-3.5 h-3.5" />
                <span>Reject Selected</span>
              </button>
              <button
                type="button"
                onClick={() => setSelectedIds([])}
                className="px-2 py-1 text-xs font-semibold text-slate-500 dark:text-slate-400 hover:text-navy-900 dark:hover:text-white cursor-pointer"
              >
                Clear
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Table & Mobile Cards Container */}
      {!hydrated ? (
        <div className="rounded-2xl border border-slate-200 dark:border-white/10 bg-white dark:bg-navy-900 p-12 text-center text-xs text-slate-500 dark:text-slate-400">
          Loading payment account verification requests…
        </div>
      ) : (
        <div className="rounded-2xl border border-slate-200 dark:border-white/10 bg-white dark:bg-navy-900 overflow-hidden shadow-xl">
          {/* Mobile Expandable Cards (< md) */}
          <div className="block md:hidden p-3 space-y-3">
            {paginatedMerchants.length === 0 ? (
              <div className="p-8 text-center text-xs text-slate-500 dark:text-slate-400">
                No payment account verification requests match your filters.
              </div>
            ) : (
              paginatedMerchants.map((m) => {
                const isSelected = selectedIds.includes(m.id);
                const isExpanded = expandedIds.has(m.id);
                const payout = m.payoutAccount;
                return (
                  <div
                    key={m.id}
                    className={`rounded-xl border p-3.5 space-y-2.5 transition-colors ${
                      isSelected
                        ? 'border-orange-500/50 bg-orange-50/40 dark:bg-orange-950/15'
                        : 'border-slate-200 dark:border-white/10 bg-slate-50/60 dark:bg-navy-950/60'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2 min-w-0">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => toggleSelectRow(m.id)}
                          aria-label={`Select ${m.storeName}`}
                          className="w-4 h-4 rounded border-slate-300 dark:border-white/15 text-orange-600 focus:ring-orange-500 cursor-pointer accent-orange-500 shrink-0"
                        />
                        <div className="min-w-0">
                          <div className="font-bold text-sm text-navy-900 dark:text-white truncate">
                            {m.storeName}
                          </div>
                          <span className="inline-block mt-0.5 tabular-nums text-[11px] font-bold px-1.5 py-0.5 rounded bg-slate-100 dark:bg-navy-800 text-navy-800 dark:text-slate-200 border border-slate-200 dark:border-white/10">
                            {m.merchantCode}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-1 shrink-0">
                        {renderStatusBadge(payout?.status)}
                        <button
                          type="button"
                          data-dropdown-trigger
                          onClick={(e) => handleToggleMenu(m.id, e)}
                          className="p-1.5 rounded-lg text-slate-500 hover:text-navy-900 dark:text-slate-400 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-navy-800 transition-colors cursor-pointer"
                          aria-label="Actions menu"
                        >
                          <MoreVertical className="h-4 w-4" />
                        </button>
                      </div>
                    </div>

                    <div className="flex items-center justify-between gap-2 pt-2 border-t border-slate-200/70 dark:border-white/10 text-xs">
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">{renderChannelBadge(payout?.provider)}</div>
                        <div className="font-semibold text-navy-900 dark:text-slate-100 truncate mt-0.5">
                          {payout?.provider}
                        </div>
                        <div className="font-mono text-orange-600 dark:text-orange-400 font-bold">
                          {payout?.accountNumber || payout?.bkashNumber || '—'}
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => toggleExpandMobile(m.id)}
                        className="p-1.5 rounded-lg bg-slate-100 dark:bg-navy-800 text-slate-600 dark:text-slate-300 cursor-pointer shrink-0"
                        aria-label="Toggle account details"
                      >
                        <ChevronDown
                          className={`w-4 h-4 transition-transform ${
                            isExpanded ? 'rotate-180 text-orange-600 dark:text-orange-400' : ''
                          }`}
                        />
                      </button>
                    </div>

                    {isExpanded && (
                      <div className="pt-2 border-t border-slate-200/70 dark:border-white/10 text-xs space-y-1.5 text-slate-700 dark:text-slate-200">
                        <div>
                          <span className="text-slate-500 dark:text-slate-400">Account Holder: </span>
                          <strong>{payout?.accountHolder || m.ownerName}</strong>
                        </div>
                        <div>
                          <span className="text-slate-500 dark:text-slate-400">Branch / Routing: </span>
                          <span>
                            {payout?.branchName || '—'}
                            {payout?.routingNumber && payout.routingNumber !== '—'
                              ? ` (${payout.routingNumber})`
                              : ''}
                          </span>
                        </div>
                        {payout?.bkashNumber && (
                          <div>
                            <span className="text-slate-500 dark:text-slate-400">bKash / MFS: </span>
                            <span className="font-mono">{payout.bkashNumber}</span>
                          </div>
                        )}
                        <div>
                          <span className="text-slate-500 dark:text-slate-400">Schedule: </span>
                          <span>{payout?.frequency || 'Weekly'}</span>
                        </div>
                        <div>
                          <span className="text-slate-500 dark:text-slate-400">Submitted: </span>
                          <span>{formatSubmittedTimestamp(payout?.updatedAt || payout?.submittedAt)}</span>
                        </div>
                        {payout?.status === 'REJECTED' && payout?.rejectionReason && (
                          <div className="text-rose-600 dark:text-rose-400 font-medium">
                            Rejection reason: {payout.rejectionReason}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>

          {/* Desktop Table (>= md) */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-200 dark:border-white/10 bg-slate-50/80 dark:bg-navy-950/80 text-xs font-bold text-slate-600 dark:text-slate-300 uppercase tracking-wider">
                  <th className="py-3.5 pl-4 pr-2 w-10 align-middle">
                    <input
                      type="checkbox"
                      checked={allVisibleSelected}
                      onChange={toggleSelectAll}
                      aria-label="Select all visible accounts"
                      className="w-4 h-4 rounded border-slate-300 dark:border-white/15 bg-white dark:bg-navy-900 text-orange-600 focus:ring-orange-500 cursor-pointer accent-orange-500"
                    />
                  </th>
                  <th className="py-3.5 px-3 align-middle">Merchant &amp; Store</th>
                  <th className="py-3.5 px-3 align-middle">Channel &amp; Provider</th>
                  <th className="py-3.5 px-3 align-middle">Account Details</th>
                  <th className="py-3.5 px-3 align-middle">Submitted / Cheque</th>
                  <th className="py-3.5 px-3 text-center align-middle">Status</th>
                  <th className="py-3.5 pl-3 pr-4 text-center align-middle">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200/70 dark:divide-white/10">
                {paginatedMerchants.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="p-10 text-center text-xs text-slate-500 dark:text-slate-400">
                      No payment account verification requests match your filters.
                    </td>
                  </tr>
                ) : (
                  paginatedMerchants.map((m) => {
                    const isSelected = selectedIds.includes(m.id);
                    const payout = m.payoutAccount;
                    return (
                      <tr
                        key={m.id}
                        className={`hover:bg-slate-100/50 dark:hover:bg-navy-800/40 transition-colors ${
                          isSelected ? 'bg-orange-50/50 dark:bg-orange-950/15' : ''
                        }`}
                      >
                        <td className="py-3.5 pl-4 pr-2 w-10 align-middle">
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => toggleSelectRow(m.id)}
                            aria-label={`Select ${m.storeName}`}
                            className="w-4 h-4 rounded border-slate-300 dark:border-white/15 bg-white dark:bg-navy-900 text-orange-600 focus:ring-orange-500 cursor-pointer accent-orange-500"
                          />
                        </td>

                        <td className="py-3.5 px-3 align-middle">
                          <Link
                            href={`/admin/merchants/${encodeURIComponent(m.id)}?tab=payout`}
                            className="font-bold text-navy-900 dark:text-white hover:text-orange-600 dark:hover:text-orange-400 transition-colors block"
                          >
                            {m.storeName}
                          </Link>
                          <div className="flex items-center gap-1.5 mt-0.5">
                            <span className="tabular-nums text-[11px] font-bold px-1.5 py-0.5 rounded bg-slate-100 dark:bg-navy-800 text-navy-800 dark:text-slate-200 border border-slate-200 dark:border-white/10">
                              {m.merchantCode}
                            </span>
                            <span className="text-slate-500 dark:text-slate-400 truncate max-w-[140px]">
                              {m.ownerName}
                            </span>
                          </div>
                        </td>

                        <td className="py-3.5 px-3 align-middle">
                          <div>{renderChannelBadge(payout?.provider)}</div>
                          <div className="font-semibold text-navy-900 dark:text-slate-100 mt-0.5">
                            {payout?.provider || '—'}
                          </div>
                          <div className="text-[11px] text-slate-500 dark:text-slate-400">
                            {payout?.frequency || 'Weekly'}
                          </div>
                        </td>

                        <td className="py-3.5 px-3 align-middle">
                          <div className="font-mono font-bold text-orange-600 dark:text-orange-400">
                            {payout?.accountNumber || payout?.bkashNumber || '—'}
                          </div>
                          <div className="text-navy-800 dark:text-slate-200 font-medium mt-0.5">
                            {payout?.accountHolder || m.ownerName}
                          </div>
                          <div className="text-[11px] text-slate-500 dark:text-slate-400">
                            {[
                              payout?.branchName && payout.branchName !== '—'
                                ? payout.branchName
                                : null,
                              payout?.routingNumber && payout.routingNumber !== '—'
                                ? `Routing: ${payout.routingNumber}`
                                : null,
                              payout?.bkashNumber && payout.bkashNumber !== payout.accountNumber
                                ? `MFS: ${payout.bkashNumber}`
                                : null,
                            ]
                              .filter(Boolean)
                              .join(' · ') || 'Standard Account'}
                          </div>
                        </td>

                        <td className="py-3.5 px-3 align-middle">
                          <div className="text-slate-700 dark:text-slate-200 font-medium">
                            {formatSubmittedTimestamp(payout?.updatedAt || payout?.submittedAt)}
                          </div>
                          <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                            {payout?.chequeLeafUrl ? 'Cheque leaf attached' : 'No cheque attachment'}
                          </div>
                        </td>

                        {/* Status Column: Strictly non-clickable span */}
                        <td className="py-3.5 px-3 text-center align-middle">
                          <div className="inline-flex flex-col items-center gap-1">
                            {renderStatusBadge(payout?.status)}
                            {payout?.status === 'REJECTED' && payout?.rejectionReason && (
                              <span className="text-[10px] text-rose-600 dark:text-rose-400 max-w-[170px] truncate">
                                {payout.rejectionReason}
                              </span>
                            )}
                          </div>
                        </td>

                        {/* Actions Column: ONLY the 3-dots trigger button */}
                        <td className="py-3.5 pl-3 pr-4 text-center align-middle">
                          <div className="flex items-center justify-center">
                            <button
                              type="button"
                              data-dropdown-trigger
                              onClick={(e) => handleToggleMenu(m.id, e)}
                              className="p-2 rounded-xl text-slate-500 hover:text-navy-900 dark:text-slate-400 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-navy-800 transition-colors cursor-pointer"
                              aria-label="Actions menu"
                            >
                              <MoreVertical className="h-4 w-4" />
                            </button>
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
      )}

      {/* Pagination Footer */}
      <PaymentRequestsPagination
        totalItems={totalItems}
        pageSize={pageSize}
        currentPage={safePage}
        onPageChange={setCurrentPage}
        onPageSizeChange={(size) => {
          setPageSize(size);
          setCurrentPage(1);
        }}
      />

      {/* Portaled Floating Action Menu */}
      {typeof document !== 'undefined' &&
        menuPosition &&
        activeMenuMerchant &&
        createPortal(
          <div
            data-portal-dropdown
            style={{
              position: 'fixed',
              top: menuPosition.top,
              left: menuPosition.left,
              width: MENU_WIDTH,
              maxHeight: 'calc(100vh - 20px)',
            }}
            className="z-[9999] overflow-y-auto rounded-2xl bg-white dark:bg-navy-900 border border-slate-200 dark:border-white/10 shadow-2xl py-1.5 text-xs animate-in fade-in duration-100"
          >
            <button
              type="button"
              onClick={() => {
                setInspectMerchantId(activeMenuMerchant.id);
                setMenuPosition(null);
              }}
              className="w-full px-3.5 py-2 text-left text-navy-800 dark:text-slate-100 hover:bg-slate-100 dark:hover:bg-navy-800 font-semibold flex items-center gap-2.5 transition-colors cursor-pointer"
            >
              <Eye className="w-4 h-4 text-orange-600 dark:text-orange-400 shrink-0" />
              <span>Inspect Account Details</span>
            </button>

            {activeMenuMerchant.payoutAccount?.chequeLeafUrl && (
              <button
                type="button"
                onClick={() => {
                  setChequePreviewMerchant(activeMenuMerchant);
                  setMenuPosition(null);
                }}
                className="w-full px-3.5 py-2 text-left text-navy-800 dark:text-slate-100 hover:bg-slate-100 dark:hover:bg-navy-800 font-semibold flex items-center gap-2.5 transition-colors cursor-pointer"
              >
                <FileText className="w-4 h-4 text-sky-600 dark:text-sky-400 shrink-0" />
                <span>View Cheque Leaf</span>
              </button>
            )}

            <Link
              href={`/admin/merchants/${encodeURIComponent(activeMenuMerchant.id)}?tab=payout`}
              onClick={() => setMenuPosition(null)}
              className="w-full px-3.5 py-2 text-left text-navy-800 dark:text-slate-100 hover:bg-slate-100 dark:hover:bg-navy-800 font-semibold flex items-center gap-2.5 transition-colors"
            >
              <Store className="w-4 h-4 text-slate-500 dark:text-slate-400 shrink-0" />
              <span>Open Merchant Profile</span>
            </Link>

            <div className="my-1 border-t border-slate-100 dark:border-white/10" />

            {activeMenuMerchant.payoutAccount?.status !== 'VERIFIED' && (
              <button
                type="button"
                onClick={() => {
                  handleReviewPayoutAccount(activeMenuMerchant.id, 'APPROVE');
                  setMenuPosition(null);
                }}
                className="w-full px-3.5 py-2 text-left text-emerald-700 dark:text-emerald-300 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 font-semibold flex items-center gap-2.5 transition-colors cursor-pointer"
              >
                <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                <span>Approve Account</span>
              </button>
            )}

            {activeMenuMerchant.payoutAccount?.status !== 'REJECTED' && (
              <button
                type="button"
                onClick={() => openRejectModal([activeMenuMerchant.id])}
                className="w-full px-3.5 py-2 text-left text-rose-700 dark:text-rose-300 hover:bg-rose-50 dark:hover:bg-rose-950/40 font-semibold flex items-center gap-2.5 transition-colors cursor-pointer"
              >
                <XCircle className="w-4 h-4 text-rose-600 dark:text-rose-400 shrink-0" />
                <span>Reject Account</span>
              </button>
            )}
          </div>,
          document.body,
        )}

      {/* Account Inspection Modal */}
      <Modal
        isOpen={Boolean(inspectMerchant)}
        onClose={() => setInspectMerchantId(null)}
        title={`Payout Account Verification · ${inspectMerchant?.storeName || ''}`}
        subtitle={
          inspectMerchant
            ? `${inspectMerchant.merchantCode} · Owned by ${inspectMerchant.ownerName}`
            : undefined
        }
        size="lg"
        footer={
          inspectMerchant ? (
            <>
              <button
                type="button"
                onClick={() => setInspectMerchantId(null)}
                className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-navy-800 hover:bg-slate-200 dark:hover:bg-navy-700 text-slate-700 dark:text-slate-200 text-xs font-semibold cursor-pointer"
              >
                Close
              </button>
              {inspectMerchant.payoutAccount?.status !== 'REJECTED' && (
                <button
                  type="button"
                  onClick={() => {
                    const id = inspectMerchant.id;
                    setInspectMerchantId(null);
                    openRejectModal([id]);
                  }}
                  className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer"
                >
                  <XCircle className="w-4 h-4" />
                  <span>Reject Account</span>
                </button>
              )}
              {inspectMerchant.payoutAccount?.status !== 'VERIFIED' && (
                <button
                  type="button"
                  onClick={() => {
                    handleReviewPayoutAccount(inspectMerchant.id, 'APPROVE');
                    setInspectMerchantId(null);
                  }}
                  className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Approve Account</span>
                </button>
              )}
            </>
          ) : undefined
        }
      >
        {inspectMerchant && (
          <div className="space-y-4 text-xs">
            <div className="flex items-center justify-between gap-2 pb-3 border-b border-slate-200/80 dark:border-white/10">
              <div className="flex items-center gap-2">
                <Landmark className="w-4 h-4 text-orange-600 dark:text-orange-400" />
                <span className="font-bold text-sm text-navy-900 dark:text-white">
                  {inspectMerchant.payoutAccount?.provider || '—'}
                </span>
              </div>
              {renderStatusBadge(inspectMerchant.payoutAccount?.status)}
            </div>

            {inspectMerchant.payoutAccount?.status === 'REJECTED' &&
              inspectMerchant.payoutAccount?.rejectionReason && (
                <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-700 dark:text-rose-300">
                  <strong>Rejection Reason:</strong>{' '}
                  {inspectMerchant.payoutAccount.rejectionReason}
                </div>
              )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="rounded-xl bg-slate-50 dark:bg-navy-950 border border-slate-200 dark:border-white/10 p-3">
                <span className="text-[10px] uppercase font-bold text-slate-500 dark:text-slate-400 block">
                  Account Holder
                </span>
                <span className="font-bold text-navy-900 dark:text-white mt-0.5 block">
                  {inspectMerchant.payoutAccount?.accountHolder || inspectMerchant.ownerName}
                </span>
              </div>

              <div className="rounded-xl bg-slate-50 dark:bg-navy-950 border border-slate-200 dark:border-white/10 p-3">
                <span className="text-[10px] uppercase font-bold text-slate-500 dark:text-slate-400 block">
                  Account / MFS Number
                </span>
                <span className="font-mono font-bold text-orange-600 dark:text-orange-400 mt-0.5 block">
                  {inspectMerchant.payoutAccount?.accountNumber ||
                    inspectMerchant.payoutAccount?.bkashNumber ||
                    '—'}
                </span>
              </div>

              <div className="rounded-xl bg-slate-50 dark:bg-navy-950 border border-slate-200 dark:border-white/10 p-3">
                <span className="text-[10px] uppercase font-bold text-slate-500 dark:text-slate-400 block">
                  Branch &amp; Routing
                </span>
                <span className="font-medium text-navy-900 dark:text-slate-100 mt-0.5 block">
                  {inspectMerchant.payoutAccount?.branchName || '—'}
                  {inspectMerchant.payoutAccount?.routingNumber &&
                  inspectMerchant.payoutAccount.routingNumber !== '—'
                    ? ` (Routing: ${inspectMerchant.payoutAccount.routingNumber})`
                    : ''}
                </span>
              </div>

              <div className="rounded-xl bg-slate-50 dark:bg-navy-950 border border-slate-200 dark:border-white/10 p-3">
                <span className="text-[10px] uppercase font-bold text-slate-500 dark:text-slate-400 block">
                  bKash / MFS Number
                </span>
                <span className="font-mono font-semibold text-navy-900 dark:text-slate-100 mt-0.5 block">
                  {inspectMerchant.payoutAccount?.bkashNumber || '—'}
                </span>
              </div>

              <div className="rounded-xl bg-slate-50 dark:bg-navy-950 border border-slate-200 dark:border-white/10 p-3">
                <span className="text-[10px] uppercase font-bold text-slate-500 dark:text-slate-400 block">
                  Disbursement Schedule
                </span>
                <span className="font-semibold text-navy-900 dark:text-slate-100 mt-0.5 block">
                  {inspectMerchant.payoutAccount?.frequency || 'Weekly'}
                </span>
              </div>

              <div className="rounded-xl bg-slate-50 dark:bg-navy-950 border border-slate-200 dark:border-white/10 p-3">
                <span className="text-[10px] uppercase font-bold text-slate-500 dark:text-slate-400 block">
                  Submitted At
                </span>
                <span className="font-medium text-navy-900 dark:text-slate-100 mt-0.5 block">
                  {formatSubmittedTimestamp(
                    inspectMerchant.payoutAccount?.updatedAt ||
                      inspectMerchant.payoutAccount?.submittedAt,
                  )}
                </span>
              </div>
            </div>

            {inspectMerchant.payoutAccount?.chequeLeafUrl && (
              <div className="space-y-2">
                <span className="text-[11px] uppercase font-bold text-slate-500 dark:text-slate-400 block">
                  Uploaded Cheque Leaf / Proof
                </span>
                <div className="rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-navy-950 p-2 overflow-hidden">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={inspectMerchant.payoutAccount.chequeLeafUrl}
                    alt="Cheque leaf verification proof"
                    className="w-full max-h-64 object-contain rounded-lg"
                  />
                </div>
              </div>
            )}
          </div>
        )}
      </Modal>

      {/* Reject Reason Modal (Single & Bulk) */}
      <Modal
        isOpen={Boolean(rejectTargetIds && rejectTargetIds.length > 0)}
        onClose={() => {
          setRejectTargetIds(null);
          setRejectionReason('');
        }}
        title={
          rejectTargetIds && rejectTargetIds.length > 1
            ? `Reject ${rejectTargetIds.length} Payout Accounts`
            : 'Reject Payment Account'
        }
        subtitle="Provide a clear reason so the merchant can correct and resubmit their payout details."
        size="sm"
      >
        <form onSubmit={handleConfirmReject} className="space-y-4 text-xs">
          <div>
            <label
              htmlFor="payout-rejection-reason"
              className="block font-semibold text-slate-700 dark:text-slate-200 mb-1.5"
            >
              Rejection Reason
            </label>
            <input
              id="payout-rejection-reason"
              type="text"
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              placeholder="e.g. Cheque leaf unclear / Account holder mismatch"
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-navy-950 border border-slate-200 dark:border-white/10 text-navy-900 dark:text-white focus:outline-none focus:border-rose-500"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => {
                setRejectTargetIds(null);
                setRejectionReason('');
              }}
              className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-navy-800 hover:bg-slate-200 dark:hover:bg-navy-700 text-slate-700 dark:text-slate-200 font-semibold cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold cursor-pointer"
            >
              Confirm Reject
            </button>
          </div>
        </form>
      </Modal>

      {/* Cheque Document Viewer Modal */}
      <DocumentViewerModal
        isOpen={Boolean(chequePreviewMerchant)}
        onClose={() => setChequePreviewMerchant(null)}
        title={`Cheque Leaf · ${chequePreviewMerchant?.storeName || ''}`}
        subtitle={
          chequePreviewMerchant
            ? `${chequePreviewMerchant.payoutAccount?.provider} — A/C: ${chequePreviewMerchant.payoutAccount?.accountNumber}`
            : undefined
        }
        documentUrl={chequePreviewMerchant?.payoutAccount?.chequeLeafUrl}
      />
    </div>
  );
}

export default PaymentAccountVerificationsManager;
