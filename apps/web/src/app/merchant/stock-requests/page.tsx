'use client';

import React, { useState, useMemo, useEffect } from 'react';
import Link from 'next/link';
import { ArrowLeft, Layers, Search, Clock, CheckCircle2, XCircle, RefreshCw } from 'lucide-react';
import { useMerchant } from '@/features/merchant/portal/MerchantContext';
import { StockRequestsTable } from '@/features/merchant/portal/products/components/StockRequestsTable';

export default function MerchantStockRequestsPage() {
  const {
    profile,
    stockRequests,
    stockManageRequests,
    refreshStockManageRequests,
    approveStockRequest,
    cancelStockRequest,
    cancelStockManageRequest,
  } = useMerchant();

  const [statusFilter, setStatusFilter] = useState<'ALL' | 'PENDING' | 'APPROVED' | 'REJECTED'>('ALL');
  const [typeFilter, setTypeFilter] = useState<'ALL' | 'RETURN' | 'RESTOCK' | 'ADJUST'>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await refreshStockManageRequests();
    setIsRefreshing(false);
  };

  useEffect(() => {
    refreshStockManageRequests();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profile.id, profile.merchantCode]);

  const filteredManageRequests = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return stockManageRequests.filter((r) => {
      if (statusFilter !== 'ALL' && r.status !== statusFilter) return false;
      const opType = r.operationType || 'ADJUST';
      if (typeFilter !== 'ALL' && opType !== typeFilter) return false;
      if (!q) return true;
      return (
        r.productTitle.toLowerCase().includes(q) ||
        r.productSku.toLowerCase().includes(q) ||
        (r.variantSku || '').toLowerCase().includes(q) ||
        (r.destination || '').toLowerCase().includes(q) ||
        (r.trackingRef || '').toLowerCase().includes(q) ||
        (r.reason || '').toLowerCase().includes(q)
      );
    });
  }, [stockManageRequests, statusFilter, typeFilter, searchQuery]);

  const filteredLegacyRequests = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return stockRequests.filter((r) => {
      const normalizedStatus = r.status === 'PENDING_APPROVAL' ? 'PENDING' : r.status;
      if (statusFilter !== 'ALL' && normalizedStatus !== statusFilter) return false;
      const opType = r.type === 'RETURN' ? 'RETURN' : 'RESTOCK';
      if (typeFilter !== 'ALL' && opType !== typeFilter) return false;
      if (!q) return true;
      return (
        r.productTitle.toLowerCase().includes(q) ||
        r.productSku.toLowerCase().includes(q) ||
        (r.variantSku || '').toLowerCase().includes(q) ||
        (r.destination || '').toLowerCase().includes(q) ||
        (r.reason || '').toLowerCase().includes(q) ||
        (r.note || '').toLowerCase().includes(q)
      );
    });
  }, [stockRequests, statusFilter, typeFilter, searchQuery]);

  const counts = useMemo(
    () => ({
      all: stockManageRequests.length + stockRequests.length,
      pending:
        stockManageRequests.filter((r) => r.status === 'PENDING').length +
        stockRequests.filter((r) => r.status === 'PENDING_APPROVAL').length,
      approved:
        stockManageRequests.filter((r) => r.status === 'APPROVED').length +
        stockRequests.filter((r) => r.status === 'APPROVED').length,
      rejected:
        stockManageRequests.filter((r) => r.status === 'REJECTED').length +
        stockRequests.filter((r) => r.status === 'REJECTED').length,
    }),
    [stockManageRequests, stockRequests]
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <Link
            href="/merchant/products"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-orange-600 dark:text-orange-400 hover:underline mb-2"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            <span>Back to Products</span>
          </Link>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-navy-900 dark:text-white flex items-center gap-2">
            <Layers className="h-6 w-6 text-orange-500 shrink-0" />
            <span>Stock, Recall &amp; Variant Requests</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5">
            Track your product recall / return requests, inbound restocks, and variant/stock adjustments awaiting Admin approval.
          </p>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="p-4 rounded-2xl bg-white dark:bg-navy-900 border border-slate-200 dark:border-white/10">
          <span className="text-[11px] font-semibold text-slate-500 uppercase">Total Requests</span>
          <p className="text-xl font-extrabold text-navy-900 dark:text-white mt-1 font-mono">
            {counts.all}
          </p>
        </div>
        <div className="p-4 rounded-2xl bg-white dark:bg-navy-900 border border-amber-500/20">
          <span className="text-[11px] font-semibold text-amber-600 dark:text-amber-400 uppercase flex items-center gap-1">
            <Clock className="h-3 w-3" /> Pending Admin
          </span>
          <p className="text-xl font-extrabold text-amber-600 dark:text-amber-400 mt-1 font-mono">
            {counts.pending}
          </p>
        </div>
        <div className="p-4 rounded-2xl bg-white dark:bg-navy-900 border border-emerald-500/20">
          <span className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 uppercase flex items-center gap-1">
            <CheckCircle2 className="h-3 w-3" /> Approved
          </span>
          <p className="text-xl font-extrabold text-emerald-600 dark:text-emerald-400 mt-1 font-mono">
            {counts.approved}
          </p>
        </div>
        <div className="p-4 rounded-2xl bg-white dark:bg-navy-900 border border-rose-500/20">
          <span className="text-[11px] font-semibold text-rose-600 dark:text-rose-400 uppercase flex items-center gap-1">
            <XCircle className="h-3 w-3" /> Rejected
          </span>
          <p className="text-xl font-extrabold text-rose-600 dark:text-rose-400 mt-1 font-mono">
            {counts.rejected}
          </p>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between bg-white dark:bg-navy-900 p-3.5 rounded-2xl border border-slate-200 dark:border-white/10">
        <div className="relative flex-1">
          <Search className="h-3.5 w-3.5 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by product name, SKU, destination, tracking ref, or reason..."
            className="w-full pl-9 pr-3 py-2 rounded-xl bg-slate-50 dark:bg-navy-950 border border-slate-200 dark:border-white/10 text-xs text-navy-900 dark:text-white focus:outline-none focus:border-orange-500"
          />
        </div>

        <select
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value as any)}
          className="px-3 py-2 rounded-xl bg-slate-50 dark:bg-navy-950 border border-slate-200 dark:border-white/10 text-xs font-semibold text-navy-900 dark:text-white focus:outline-none focus:border-orange-500"
          aria-label="Filter by request type"
        >
          <option value="ALL">All Types</option>
          <option value="RETURN">Recall / Return (-)</option>
          <option value="RESTOCK">Inbound Restock (+)</option>
          <option value="ADJUST">Variant &amp; Qty Manage</option>
        </select>

        <div className="flex items-center gap-1.5 flex-wrap">
          {(['ALL', 'PENDING', 'APPROVED', 'REJECTED'] as const).map((st) => (
            <button
              key={st}
              type="button"
              onClick={() => setStatusFilter(st)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold cursor-pointer transition-colors ${
                statusFilter === st
                  ? 'bg-orange-600 text-white'
                  : 'bg-slate-100 dark:bg-navy-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-navy-700'
              }`}
            >
              {st === 'ALL' ? 'All' : st.charAt(0) + st.slice(1).toLowerCase()}
            </button>
          ))}
          <button
            type="button"
            onClick={handleRefresh}
            className="p-2 rounded-lg bg-slate-100 dark:bg-navy-800 hover:bg-slate-200 dark:hover:bg-navy-700 text-slate-600 dark:text-slate-300 cursor-pointer transition-colors"
            title="Refresh stock requests"
            aria-label="Refresh stock requests"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${isRefreshing ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      <StockRequestsTable
        requests={filteredLegacyRequests}
        stockManageRequests={filteredManageRequests}
        onApproveRequest={approveStockRequest}
        onCancelRequest={cancelStockRequest}
        onCancelManageRequest={cancelStockManageRequest}
      />
    </div>
  );
}
