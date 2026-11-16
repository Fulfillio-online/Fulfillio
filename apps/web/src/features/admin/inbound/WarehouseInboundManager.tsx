'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import {
  Truck,
  Package,
  CheckCircle2,
  XCircle,
  MapPin,
  Clock,
  Layers,
  Search,
  RotateCcw,
  SlidersHorizontal,
  ChevronLeft,
  ChevronRight,
  ShieldCheck,
  FileText,
  AlertCircle,
  ArrowUpRight,
} from 'lucide-react';
import { SearchInput } from '@/components/ui';
import {
  InboundStockReplenishment,
  StockWithdrawalRequest,
  WarehouseBin,
  WarehouseProductItem,
} from '@/features/admin/products/types';
import {
  INITIAL_PRODUCTS,
  INITIAL_BINS,
  INITIAL_STOCK_REPLENISHMENTS,
  INITIAL_STOCK_WITHDRAWALS,
  STORAGE_KEY_PRODUCTS,
  STORAGE_KEY_BINS,
  STORAGE_KEY_STOCK_REQUESTS,
  STORAGE_KEY_STOCK_WITHDRAWALS,
  MERCHANTS,
} from '@/features/admin/products/mockData';
import { RestockIntakeModal } from '@/features/admin/products/components/modals/RestockIntakeModal';
import { ReturnApprovalModal } from './ReturnApprovalModal';
import {
  approveAdminStockReplenishment,
  rejectAdminStockReplenishment,
  approveAdminStockWithdrawal,
  rejectAdminStockWithdrawal,
} from '@/lib/warehouseSync';

export function WarehouseInboundManager() {
  // Main view tab: Restocks vs Returns
  const [activeMainTab, setActiveMainTab] = useState<'RESTOCK' | 'RETURNS'>('RESTOCK');

  // Data states
  const [replenishments, setReplenishments] = useState<InboundStockReplenishment[]>(
    INITIAL_STOCK_REPLENISHMENTS
  );
  const [withdrawals, setWithdrawals] = useState<StockWithdrawalRequest[]>(
    INITIAL_STOCK_WITHDRAWALS
  );
  const [products, setProducts] = useState<WarehouseProductItem[]>(INITIAL_PRODUCTS);
  const [bins, setBins] = useState<WarehouseBin[]>(INITIAL_BINS);

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [merchantFilter, setMerchantFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'PENDING' | 'APPROVED' | 'REJECTED'>('ALL');

  // Pagination
  const [pageSize, setPageSize] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);

  // Modals
  const [activeReplenishmentModal, setActiveReplenishmentModal] =
    useState<InboundStockReplenishment | null>(null);
  const [activeWithdrawalModal, setActiveWithdrawalModal] =
    useState<StockWithdrawalRequest | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const triggerToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4000);
  };

  // Load state from localStorage
  const loadInboundData = () => {
    try {
      const savedReqs = localStorage.getItem(STORAGE_KEY_STOCK_REQUESTS);
      if (savedReqs) {
        const parsed = JSON.parse(savedReqs);
        if (Array.isArray(parsed) && parsed.length > 0) setReplenishments(parsed);
      }
      const savedWiths = localStorage.getItem(STORAGE_KEY_STOCK_WITHDRAWALS);
      if (savedWiths) {
        const parsed = JSON.parse(savedWiths);
        if (Array.isArray(parsed) && parsed.length > 0) setWithdrawals(parsed);
      }
      const savedProds = localStorage.getItem(STORAGE_KEY_PRODUCTS);
      if (savedProds) {
        const parsed = JSON.parse(savedProds);
        if (Array.isArray(parsed) && parsed.length > 0) setProducts(parsed);
      }
      const savedBins = localStorage.getItem(STORAGE_KEY_BINS);
      if (savedBins) {
        const parsed = JSON.parse(savedBins);
        if (Array.isArray(parsed) && parsed.length > 0) setBins(parsed);
      }
    } catch {}
  };

  useEffect(() => {
    loadInboundData();

    const handleSync = () => loadInboundData();
    window.addEventListener('fulfillio-warehouse-sync', handleSync);
    window.addEventListener('storage', handleSync);

    return () => {
      window.removeEventListener('fulfillio-warehouse-sync', handleSync);
      window.removeEventListener('storage', handleSync);
    };
  }, []);

  // Reset pagination when tab/filter changes
  useEffect(() => {
    setCurrentPage(1);
  }, [activeMainTab, searchQuery, merchantFilter, statusFilter]);

  // Handle Restock Approval
  const handleConfirmRestock = (
    item: InboundStockReplenishment,
    finalQty: number,
    targetBin: string
  ) => {
    const success = approveAdminStockReplenishment(item.id, finalQty, targetBin);
    if (success) {
      loadInboundData();
      triggerToast(
        `Received ${finalQty} units of "${item.productTitle}". Slotted into Bin ${targetBin}.`
      );
    }
  };

  const handleDeclineRestock = (item: InboundStockReplenishment) => {
    const success = rejectAdminStockReplenishment(item.id);
    if (success) {
      loadInboundData();
      triggerToast(`Declined restock consignment for "${item.productTitle}".`);
    }
  };

  // Handle Return Approval
  const handleConfirmReturn = (
    item: StockWithdrawalRequest,
    approvedQty: number
  ) => {
    const result = approveAdminStockWithdrawal(item.id, approvedQty);
    if (result.ok) {
      loadInboundData();
      triggerToast(
        `Return approved for "${item.productTitle}" (-${approvedQty} pcs). Delivery Gate Pass ${result.gatePassNo} issued.`
      );
    }
  };

  const handleDeclineReturn = (item: StockWithdrawalRequest) => {
    const success = rejectAdminStockWithdrawal(item.id);
    if (success) {
      loadInboundData();
      triggerToast(`Declined stock return request for "${item.productTitle}".`);
    }
  };

  // Filtered lists
  const filteredReplenishments = useMemo(() => {
    return replenishments.filter((r) => {
      const q = searchQuery.trim().toLowerCase();
      const matchesSearch =
        !q ||
        r.productTitle.toLowerCase().includes(q) ||
        r.productSku.toLowerCase().includes(q) ||
        r.merchantName.toLowerCase().includes(q) ||
        (r.trackingRef && r.trackingRef.toLowerCase().includes(q)) ||
        r.id.toLowerCase().includes(q);

      const matchesMerchant = merchantFilter === 'ALL' || r.merchantCode === merchantFilter;

      let matchesStatus = true;
      if (statusFilter === 'PENDING') matchesStatus = r.status === 'PENDING_APPROVAL';
      else if (statusFilter === 'APPROVED') matchesStatus = r.status === 'APPROVED';
      else if (statusFilter === 'REJECTED') matchesStatus = r.status === 'REJECTED';

      return matchesSearch && matchesMerchant && matchesStatus;
    });
  }, [replenishments, searchQuery, merchantFilter, statusFilter]);

  const filteredWithdrawals = useMemo(() => {
    return withdrawals.filter((w) => {
      const q = searchQuery.trim().toLowerCase();
      const matchesSearch =
        !q ||
        w.productTitle.toLowerCase().includes(q) ||
        w.productSku.toLowerCase().includes(q) ||
        w.merchantName.toLowerCase().includes(q) ||
        (w.destination && w.destination.toLowerCase().includes(q)) ||
        (w.reason && w.reason.toLowerCase().includes(q)) ||
        w.id.toLowerCase().includes(q);

      const matchesMerchant = merchantFilter === 'ALL' || w.merchantCode === merchantFilter;

      let matchesStatus = true;
      if (statusFilter === 'PENDING') matchesStatus = w.status === 'PENDING_APPROVAL';
      else if (statusFilter === 'APPROVED') matchesStatus = w.status === 'APPROVED';
      else if (statusFilter === 'REJECTED') matchesStatus = w.status === 'REJECTED';

      return matchesSearch && matchesMerchant && matchesStatus;
    });
  }, [withdrawals, searchQuery, merchantFilter, statusFilter]);

  // Current active list
  const activeList = activeMainTab === 'RESTOCK' ? filteredReplenishments : filteredWithdrawals;
  const totalItems = activeList.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  const safePage = Math.min(Math.max(1, currentPage), totalPages);
  const paginatedList = activeList.slice((safePage - 1) * pageSize, safePage * pageSize);

  // Stats calculation
  const pendingRestockCount = replenishments.filter((r) => r.status === 'PENDING_APPROVAL').length;
  const pendingReturnCount = withdrawals.filter((w) => w.status === 'PENDING_APPROVAL').length;
  const inboundedUnits = replenishments
    .filter((r) => r.status === 'APPROVED')
    .reduce((sum, r) => sum + (r.requestedQty || 0), 0);
  const returnedUnits = withdrawals
    .filter((w) => w.status === 'APPROVED')
    .reduce((sum, w) => sum + (w.withdrawQty || 0), 0);

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="p-4 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-800 dark:text-emerald-300 text-xs font-semibold flex items-center justify-between shadow-md animate-in fade-in">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
            <span>{toastMessage}</span>
          </div>
          <button
            type="button"
            onClick={() => setToastMessage(null)}
            className="text-xs text-emerald-700 dark:text-emerald-400 hover:underline cursor-pointer"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-2xl bg-white dark:bg-navy-900 border border-slate-200/80 dark:border-white/10 shadow-xs">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-orange-500/10 border border-orange-500/20 flex items-center justify-center text-orange-600 dark:text-orange-400">
            <Truck className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-navy-900 dark:text-white">
              Inbound Restock &amp; Stock Returns
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Review and approve merchant restock consignments and physical return/recall requests.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Link
            href="/admin/stock"
            className="px-3.5 py-2 rounded-xl text-xs font-bold border border-slate-200 dark:border-white/10 text-navy-800 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-navy-800 transition-colors"
          >
            View Stock Ledger
          </Link>
        </div>
      </div>

      {/* 4 Summary Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <div className="p-4 rounded-2xl bg-white dark:bg-navy-900 border border-slate-200/80 dark:border-white/10 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
              Inbound Consignments
            </span>
            <Package className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="mt-2 text-2xl font-extrabold text-navy-900 dark:text-white font-mono">
            {replenishments.length}
          </div>
          <div className="text-[11px] text-slate-500 mt-0.5">
            {inboundedUnits} units inbounded
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-navy-900 border border-slate-200/80 dark:border-white/10 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
              Pending Restock QC
            </span>
            <Clock className="w-4 h-4 text-amber-500" />
          </div>
          <div className="mt-2 text-2xl font-extrabold text-amber-600 dark:text-amber-400 font-mono">
            {pendingRestockCount}
          </div>
          <div className="text-[11px] text-slate-500 mt-0.5">
            Awaiting dock verification
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-navy-900 border border-slate-200/80 dark:border-white/10 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
              Stock Returns &amp; Recalls
            </span>
            <RotateCcw className="w-4 h-4 text-orange-500" />
          </div>
          <div className="mt-2 text-2xl font-extrabold text-orange-600 dark:text-orange-400 font-mono">
            {withdrawals.length}
          </div>
          <div className="text-[11px] text-slate-500 mt-0.5">
            {returnedUnits} units dispatched back
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-navy-900 border border-slate-200/80 dark:border-white/10 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
              Pending Return Requests
            </span>
            <AlertCircle className="w-4 h-4 text-rose-500" />
          </div>
          <div className="mt-2 text-2xl font-extrabold text-rose-600 dark:text-rose-400 font-mono">
            {pendingReturnCount}
          </div>
          <div className="text-[11px] text-slate-500 mt-0.5">
            Require Gate Pass approval
          </div>
        </div>
      </div>

      {/* Main Table Container */}
      <div className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-navy-900 border border-slate-200/80 dark:border-white/10 shadow-xs space-y-4">
        {/* Primary View Switcher: Restock vs Returns */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200/80 dark:border-white/10 pb-3">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setActiveMainTab('RESTOCK')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2 ${
                activeMainTab === 'RESTOCK'
                  ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/20'
                  : 'bg-slate-100 dark:bg-navy-800 text-slate-600 dark:text-slate-400 hover:text-navy-900 dark:hover:text-white'
              }`}
            >
              <Truck className="w-4 h-4" />
              <span>Inbound Restocks ({replenishments.length})</span>
              {pendingRestockCount > 0 && (
                <span className="px-1.5 py-0.2 rounded-full bg-white text-emerald-700 text-[10px] font-extrabold">
                  {pendingRestockCount}
                </span>
              )}
            </button>

            <button
              type="button"
              onClick={() => setActiveMainTab('RETURNS')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2 ${
                activeMainTab === 'RETURNS'
                  ? 'bg-orange-600 text-white shadow-md shadow-orange-600/20'
                  : 'bg-slate-100 dark:bg-navy-800 text-slate-600 dark:text-slate-400 hover:text-navy-900 dark:hover:text-white'
              }`}
            >
              <RotateCcw className="w-4 h-4" />
              <span>Merchant Returns &amp; Recalls ({withdrawals.length})</span>
              {pendingReturnCount > 0 && (
                <span className="px-1.5 py-0.2 rounded-full bg-white text-orange-700 text-[10px] font-extrabold">
                  {pendingReturnCount}
                </span>
              )}
            </button>
          </div>

          <div className="text-xs text-slate-500">
            Showing <strong className="font-mono text-navy-900 dark:text-white">{activeList.length}</strong> {activeMainTab === 'RESTOCK' ? 'restock consignments' : 'return requests'}
          </div>
        </div>

        {/* Filters Row: Search + Merchant Filter + Status Tabs */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div className="md:col-span-2">
            <SearchInput
              value={searchQuery}
              onChange={setSearchQuery}
              placeholder={
                activeMainTab === 'RESTOCK'
                  ? 'Search by product title, SKU, consignment tracking, merchant...'
                  : 'Search by product, SKU, return reason, destination outlet, merchant...'
              }
              className="w-full text-xs"
            />
          </div>

          <div className="flex items-center gap-2">
            <select
              value={merchantFilter}
              onChange={(e) => setMerchantFilter(e.target.value)}
              className="flex-1 px-3 py-2 rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-navy-950 text-xs font-medium text-navy-900 dark:text-white focus:outline-none focus:border-orange-500 cursor-pointer"
            >
              <option value="ALL">All Merchants</option>
              {MERCHANTS.map((m) => (
                <option key={m.code} value={m.code}>
                  {m.name} ({m.code})
                </option>
              ))}
            </select>

            <select
              value={statusFilter}
              onChange={(e) =>
                setStatusFilter(e.target.value as 'ALL' | 'PENDING' | 'APPROVED' | 'REJECTED')
              }
              className="px-3 py-2 rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-navy-950 text-xs font-medium text-navy-900 dark:text-white focus:outline-none focus:border-orange-500 cursor-pointer"
            >
              <option value="ALL">All Status</option>
              <option value="PENDING">Pending Approval</option>
              <option value="APPROVED">Approved</option>
              <option value="REJECTED">Declined</option>
            </select>
          </div>
        </div>

        {/* Content Table */}
        {activeMainTab === 'RESTOCK' ? (
          /* ========================================================= */
          /* 1. RESTOCK CONSIGNMENTS TABLE                             */
          /* ========================================================= */
          <div className="overflow-x-auto rounded-xl border border-slate-200/80 dark:border-white/10">
            <table className="w-full min-w-[850px] text-left text-xs">
              <thead className="bg-slate-50 dark:bg-navy-950/70 text-slate-500 dark:text-slate-400 uppercase tracking-wider font-semibold border-b border-slate-200/80 dark:border-white/10">
                <tr>
                  <th className="py-3 px-4">Consignment ID</th>
                  <th className="py-3 px-4">Product &amp; SKU</th>
                  <th className="py-3 px-4">Merchant</th>
                  <th className="py-3 px-4 text-center">Inbound Qty</th>
                  <th className="py-3 px-4 text-center">Target Bin</th>
                  <th className="py-3 px-4">Logistics / Tracking</th>
                  <th className="py-3 px-4 text-center">Intake Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-white/5">
                {paginatedList.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="p-8 text-center text-slate-400">
                      No restock consignments match your filters.
                    </td>
                  </tr>
                ) : (
                  (paginatedList as InboundStockReplenishment[]).map((r) => {
                    const isPending = r.status === 'PENDING_APPROVAL';
                    const isApproved = r.status === 'APPROVED';

                    return (
                      <tr
                        key={r.id}
                        className="hover:bg-slate-50/80 dark:hover:bg-navy-800/40 transition-colors"
                      >
                        <td className="py-3 px-4 font-mono font-bold text-navy-900 dark:text-white">
                          {r.id}
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-3">
                            <img
                              src={r.imageUrl}
                              alt={r.productTitle}
                              className="w-10 h-10 rounded-lg object-cover border border-slate-200 dark:border-white/10 shrink-0"
                            />
                            <div className="min-w-0">
                              <span className="font-bold text-navy-900 dark:text-white block truncate max-w-xs">
                                {r.productTitle}
                              </span>
                              <span className="font-mono text-[11px] text-slate-400 block mt-0.5">
                                {r.productSku}
                              </span>
                            </div>
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <span className="font-medium text-navy-800 dark:text-slate-200 block">
                            {r.merchantName}
                          </span>
                          <span className="font-mono text-[10px] text-slate-400">
                            {r.merchantCode}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-center">
                          <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 font-mono font-bold text-xs">
                            <ArrowUpRight className="w-3.5 h-3.5" />
                            <span>+{r.requestedQty} pcs</span>
                          </div>
                        </td>
                        <td className="py-3 px-4 text-center">
                          <span className="font-mono font-bold text-amber-600 dark:text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20 text-[11px]">
                            {r.binCode || 'A-01-02'}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-slate-500 dark:text-slate-400">
                          <div className="truncate max-w-xs">{r.note || 'Restock Cargo'}</div>
                          {r.trackingRef && (
                            <span className="font-mono text-[10px] text-slate-400 block mt-0.5">
                              Ref: {r.trackingRef}
                            </span>
                          )}
                        </td>
                        <td className="py-3 px-4 text-center">
                          {isPending ? (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/30">
                              <Clock className="w-3 h-3 animate-pulse" />
                              <span>Pending Dock QC</span>
                            </span>
                          ) : isApproved ? (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30">
                              <CheckCircle2 className="w-3 h-3" />
                              <span>Slotted in {r.binCode}</span>
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/30">
                              <XCircle className="w-3 h-3" />
                              <span>Declined</span>
                            </span>
                          )}
                        </td>
                        <td className="py-3 px-4 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            {isPending && (
                              <>
                                <button
                                  type="button"
                                  onClick={() => setActiveReplenishmentModal(r)}
                                  className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold transition-all shadow-xs flex items-center gap-1 cursor-pointer"
                                  title="Receive & Slot Inbound"
                                >
                                  <ShieldCheck className="w-3.5 h-3.5" />
                                  <span>Receive &amp; Slot</span>
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleDeclineRestock(r)}
                                  className="p-1.5 rounded-lg text-slate-400 hover:text-rose-500 hover:bg-rose-500/10 transition-colors cursor-pointer"
                                  title="Decline Consignment"
                                >
                                  <XCircle className="w-4 h-4" />
                                </button>
                              </>
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
        ) : (
          /* ========================================================= */
          /* 2. STOCK RETURNS & RECALLS TABLE                          */
          /* ========================================================= */
          <div className="overflow-x-auto rounded-xl border border-slate-200/80 dark:border-white/10">
            <table className="w-full min-w-[850px] text-left text-xs">
              <thead className="bg-slate-50 dark:bg-navy-950/70 text-slate-500 dark:text-slate-400 uppercase tracking-wider font-semibold border-b border-slate-200/80 dark:border-white/10">
                <tr>
                  <th className="py-3 px-4">Return ID</th>
                  <th className="py-3 px-4">Product &amp; SKU</th>
                  <th className="py-3 px-4">Merchant</th>
                  <th className="py-3 px-4 text-center">Return Qty</th>
                  <th className="py-3 px-4 text-center">Current Bin</th>
                  <th className="py-3 px-4">Reason &amp; Destination</th>
                  <th className="py-3 px-4 text-center">Return Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-white/5">
                {paginatedList.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="p-8 text-center text-slate-400">
                      No stock returns or recall requests found.
                    </td>
                  </tr>
                ) : (
                  (paginatedList as StockWithdrawalRequest[]).map((w) => {
                    const isPending = w.status === 'PENDING_APPROVAL';
                    const isApproved = w.status === 'APPROVED';

                    return (
                      <tr
                        key={w.id}
                        className="hover:bg-slate-50/80 dark:hover:bg-navy-800/40 transition-colors"
                      >
                        <td className="py-3 px-4 font-mono font-bold text-orange-600 dark:text-orange-400">
                          {w.id}
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-3">
                            <img
                              src={w.imageUrl}
                              alt={w.productTitle}
                              className="w-10 h-10 rounded-lg object-cover border border-slate-200 dark:border-white/10 shrink-0"
                            />
                            <div className="min-w-0">
                              <span className="font-bold text-navy-900 dark:text-white block truncate max-w-xs">
                                {w.productTitle}
                              </span>
                              <span className="font-mono text-[11px] text-slate-400 block mt-0.5">
                                {w.productSku}
                              </span>
                            </div>
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <span className="font-medium text-navy-800 dark:text-slate-200 block">
                            {w.merchantName}
                          </span>
                          <span className="font-mono text-[10px] text-slate-400">
                            {w.merchantCode}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-center">
                          <div className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg bg-orange-500/10 border border-orange-500/20 text-orange-600 dark:text-orange-400 font-mono font-bold text-xs">
                            <RotateCcw className="w-3.5 h-3.5" />
                            <span>-{w.withdrawQty} pcs</span>
                          </div>
                        </td>
                        <td className="py-3 px-4 text-center">
                          <span className="font-mono font-bold text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-navy-800 px-2 py-0.5 rounded text-[11px]">
                            {w.binCode || 'A-01-04'}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-slate-600 dark:text-slate-300 max-w-xs space-y-0.5">
                          <div className="truncate font-semibold text-navy-900 dark:text-white">
                            {w.reason || 'Merchant Stock Recall'}
                          </div>
                          {w.destination && (
                            <div className="flex items-center gap-1 text-[11px] text-slate-400 truncate">
                              <MapPin className="w-3 h-3 text-slate-400 shrink-0" />
                              <span>{w.destination}</span>
                            </div>
                          )}
                          {w.gatePassNo && (
                            <span className="font-mono text-[10px] text-emerald-600 dark:text-emerald-400 font-bold block">
                              Gate Pass: {w.gatePassNo}
                            </span>
                          )}
                        </td>
                        <td className="py-3 px-4 text-center">
                          {isPending ? (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/30">
                              <Clock className="w-3 h-3 animate-pulse" />
                              <span>Pending Review</span>
                            </span>
                          ) : isApproved ? (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30">
                              <CheckCircle2 className="w-3 h-3" />
                              <span>Dispatched (Gate Pass)</span>
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/30">
                              <XCircle className="w-3 h-3" />
                              <span>Declined</span>
                            </span>
                          )}
                        </td>
                        <td className="py-3 px-4 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            {isPending && (
                              <>
                                <button
                                  type="button"
                                  onClick={() => setActiveWithdrawalModal(w)}
                                  className="px-3 py-1.5 rounded-lg bg-orange-600 hover:bg-orange-500 text-white font-bold transition-all shadow-xs flex items-center gap-1 cursor-pointer"
                                  title="Approve Return & Issue Gate Pass"
                                >
                                  <ShieldCheck className="w-3.5 h-3.5" />
                                  <span>Approve Return</span>
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleDeclineReturn(w)}
                                  className="p-1.5 rounded-lg text-slate-400 hover:text-rose-500 hover:bg-rose-500/10 transition-colors cursor-pointer"
                                  title="Decline Return"
                                >
                                  <XCircle className="w-4 h-4" />
                                </button>
                              </>
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
        )}

        {/* Pagination Bar */}
        {totalItems > 0 && (
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-3 border-t border-slate-200/80 dark:border-white/10 text-xs text-slate-500 dark:text-slate-400">
            <div>
              Showing <strong className="font-mono text-navy-900 dark:text-white">{(safePage - 1) * pageSize + 1}</strong> to{' '}
              <strong className="font-mono text-navy-900 dark:text-white">
                {Math.min(safePage * pageSize, totalItems)}
              </strong>{' '}
              of <strong className="font-mono text-navy-900 dark:text-white">{totalItems}</strong> items
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={safePage === 1}
                className="p-1.5 rounded-lg border border-slate-200 dark:border-white/10 bg-white dark:bg-navy-900 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer hover:bg-slate-50 dark:hover:bg-navy-800"
                aria-label="Previous page"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="font-mono font-semibold">
                Page {safePage} of {totalPages}
              </span>
              <button
                type="button"
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                disabled={safePage === totalPages}
                className="p-1.5 rounded-lg border border-slate-200 dark:border-white/10 bg-white dark:bg-navy-900 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer hover:bg-slate-50 dark:hover:bg-navy-800"
                aria-label="Next page"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Restock Intake Modal */}
      <RestockIntakeModal
        isOpen={!!activeReplenishmentModal}
        onClose={() => setActiveReplenishmentModal(null)}
        replenishment={activeReplenishmentModal}
        bins={bins}
        onConfirm={handleConfirmRestock}
      />

      {/* Return Approval Modal */}
      <ReturnApprovalModal
        isOpen={!!activeWithdrawalModal}
        onClose={() => setActiveWithdrawalModal(null)}
        withdrawal={activeWithdrawalModal}
        onConfirm={handleConfirmReturn}
      />
    </div>
  );
}
