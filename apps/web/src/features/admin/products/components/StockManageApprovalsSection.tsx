'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  CheckCircle2,
  XCircle,
  Layers,
  AlertTriangle,
  RefreshCw,
  Search,
  ChevronLeft,
  ChevronRight,
  Clock,
  RotateCcw,
  ArrowUpRight,
  MapPin,
  Truck,
  X,
} from 'lucide-react';
import type { StockManageRequestRecord } from '@/features/merchant/portal/products/types';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api';

function getAuthHeader(): Record<string, string> {
  if (typeof window === 'undefined') return {};
  const token =
    localStorage.getItem('fulfillio_admin_token') ||
    localStorage.getItem('fulfillio_token') ||
    localStorage.getItem('token');
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export interface StockManageApprovalsSectionProps {
  onApprovedOrRejected?: (message: string) => void;
}

const PAGE_SIZE = 10;

export function StockManageApprovalsSection({
  onApprovedOrRejected,
}: StockManageApprovalsSectionProps) {
  const [requests, setRequests] = useState<StockManageRequestRecord[]>([]);
  const [filter, setFilter] = useState<'PENDING' | 'APPROVED' | 'REJECTED' | 'ALL'>('PENDING');
  const [searchQuery, setSearchQuery] = useState('');
  const [merchantFilter, setMerchantFilter] = useState('ALL');
  const [typeFilter, setTypeFilter] = useState<
    'ALL' | 'RETURN' | 'RESTOCK' | 'NEW_VARIANTS' | 'ADJUSTMENTS'
  >('ALL');
  const [sortOrder, setSortOrder] = useState<'NEWEST' | 'OLDEST'>('NEWEST');
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [errorBanner, setErrorBanner] = useState<string | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [rejectModalTarget, setRejectModalTarget] = useState<StockManageRequestRecord | null>(null);
  const [rejectReason, setRejectReason] = useState('');
  const [previewImage, setPreviewImage] = useState<{ title: string; url: string } | null>(null);

  const migrateLegacyLocalStockRequests = useCallback(async () => {
    if (typeof window === 'undefined') return;
    const isUuid = (val?: string) =>
      Boolean(val && /^[0-9a-f]{8}-[0-9a-f]{4}-/i.test(val.trim()));

    const headers = {
      'Content-Type': 'application/json',
      ...getAuthHeader(),
    };

    // 1. Bridge any un-migrated pending recall/withdrawal requests stored in admin localStorage
    try {
      const rawWith = localStorage.getItem('fulfillio_admin_stock_withdrawals_v1');
      if (rawWith) {
        const parsed = JSON.parse(rawWith);
        if (Array.isArray(parsed)) {
          const migratedIds = new Set<string>();
          for (const w of parsed) {
            if (w?.status === 'PENDING_APPROVAL' && isUuid(w?.productId)) {
              try {
                const res = await fetch(
                  `${API_BASE}/inventory/products/${encodeURIComponent(w.productId)}/stock-manage-requests`,
                  {
                    method: 'POST',
                    headers: {
                      ...headers,
                      ...(w.merchantCode ? { 'x-merchant-code': String(w.merchantCode) } : {}),
                    },
                    body: JSON.stringify({
                      merchantCode: w.merchantCode || 'MC-101',
                      operationType: 'RETURN',
                      requestedQty: Number(w.withdrawQty) || 1,
                      variantSku: w.productSku,
                      destination: w.destination,
                      trackingRef: w.trackingRef,
                      reason: w.reason,
                    }),
                  }
                );
                if (res.ok) migratedIds.add(w.id);
              } catch {}
            }
          }
          if (migratedIds.size > 0) {
            localStorage.setItem(
              'fulfillio_admin_stock_withdrawals_v1',
              JSON.stringify(parsed.filter((w: any) => !migratedIds.has(w.id)))
            );
          }
        }
      }
    } catch {}

    // 2. Bridge any un-migrated pending requests in merchant-scoped localStorage keys
    try {
      const keysToCheck: string[] = [];
      for (let i = 0; i < localStorage.length; i++) {
        const k = localStorage.key(i);
        if (k && k.startsWith('fulfillio_merchant_stock_requests_')) {
          keysToCheck.push(k);
        }
      }
      for (const key of keysToCheck) {
        const mCode = key.replace('fulfillio_merchant_stock_requests_', '') || 'MC-101';
        const raw = localStorage.getItem(key);
        if (!raw) continue;
        const parsed = JSON.parse(raw);
        if (!Array.isArray(parsed)) continue;
        const migratedIds = new Set<string>();
        for (const mr of parsed) {
          if (mr?.status === 'PENDING_APPROVAL' && isUuid(mr?.productId)) {
            try {
              const opType = mr.type === 'RETURN' ? 'RETURN' : 'RESTOCK';
              const res = await fetch(
                `${API_BASE}/inventory/products/${encodeURIComponent(mr.productId)}/stock-manage-requests`,
                {
                  method: 'POST',
                  headers: { ...headers, 'x-merchant-code': mCode },
                  body: JSON.stringify({
                    merchantCode: mCode,
                    operationType: opType,
                    requestedQty: Number(mr.requestedQty) || 1,
                    variantSku: mr.variantSku,
                    color: mr.color,
                    size: mr.size,
                    destination: mr.destination,
                    carrier: mr.carrier,
                    trackingRef: mr.trackingRef,
                    note: mr.note,
                    reason: mr.reason || mr.note,
                  }),
                }
              );
              if (res.ok) migratedIds.add(mr.id);
            } catch {}
          }
        }
        if (migratedIds.size > 0) {
          localStorage.setItem(
            key,
            JSON.stringify(parsed.filter((mr: any) => !migratedIds.has(mr.id)))
          );
        }
      }
    } catch {}
  }, []);

  const fetchRequests = useCallback(async () => {
    setLoading(true);
    try {
      await migrateLegacyLocalStockRequests();
      const res = await fetch(`${API_BASE}/inventory/stock-manage-requests`, {
        headers: { ...getAuthHeader() },
      });
      if (!res.ok) return;
      const data = await res.json();
      if (Array.isArray(data)) {
        const mapped: StockManageRequestRecord[] = data.map((r: any) => {
          const changes = r.requestedChanges || {};
          const origSnap = r.originalSnapshot || {};
          return {
            id: r.id,
            productId: r.productId,
            merchantId: r.merchantId,
            merchantCode: r.product?.merchant?.merchantCode || '',
            merchantName: r.product?.merchant?.businessName || '',
            productTitle: r.product?.title || 'Product',
            productSku: r.product?.baseSku || '',
            productImageUrl: r.product?.imageUrl || '',
            currentTotalStock: Number(origSnap.totalStock ?? 0),
            status: r.status || 'PENDING',
            operationType: changes.operationType || 'ADJUST',
            requestedQty:
              changes.requestedQty !== undefined ? Number(changes.requestedQty) : undefined,
            variantId: changes.variantId || undefined,
            variantSku: changes.variantSku || undefined,
            color: changes.color || undefined,
            size: changes.size || undefined,
            destination: changes.destination || undefined,
            carrier: changes.carrier || undefined,
            trackingRef: changes.trackingRef || undefined,
            note: changes.note || undefined,
            gatePassNo: changes.gatePassNo || undefined,
            reason: changes.reason || r.reason || '',
            rejectionReason: r.rejectionReason || undefined,
            newVariants: Array.isArray(changes.newVariants) ? changes.newVariants : [],
            adjustments: Array.isArray(changes.adjustments) ? changes.adjustments : [],
            createdAt: r.createdAt || new Date().toISOString(),
            reviewedAt: r.reviewedAt || undefined,
          };
        });
        setRequests(mapped);
      }
    } catch {
      // ignore network error
    } finally {
      setLoading(false);
    }
  }, [migrateLegacyLocalStockRequests]);

  useEffect(() => {
    fetchRequests();
    const onSync = () => fetchRequests();
    window.addEventListener('fulfillio-warehouse-sync', onSync);
    window.addEventListener('focus', onSync);
    return () => {
      window.removeEventListener('fulfillio-warehouse-sync', onSync);
      window.removeEventListener('focus', onSync);
    };
  }, [fetchRequests]);

  const handleReview = async (
    requestId: string,
    action: 'APPROVE' | 'REJECT',
    reason?: string
  ) => {
    setProcessingId(requestId);
    setErrorBanner(null);
    try {
      const res = await fetch(
        `${API_BASE}/inventory/stock-manage-requests/${encodeURIComponent(requestId)}/review`,
        {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            ...getAuthHeader(),
          },
          body: JSON.stringify({
            action,
            ...(reason ? { rejectionReason: reason } : {}),
          }),
        }
      );
      if (res.ok) {
        const respData = await res.json().catch(() => ({}));
        const reviewedReq = respData?.request;
        const changes = reviewedReq?.requestedChanges || {};
        await fetchRequests();
        setRejectModalTarget(null);
        setRejectReason('');
        setSelectedIds((prev) => {
          const next = new Set(prev);
          next.delete(requestId);
          return next;
        });
        if (typeof window !== 'undefined') {
          window.dispatchEvent(
            new CustomEvent('fulfillio-warehouse-sync', {
              detail: { source: 'AdminStockManageApproval' },
            })
          );
        }
        const opType = changes.operationType || requests.find((r) => r.id === requestId)?.operationType;
        if (action === 'APPROVE') {
          if (opType === 'RETURN') {
            const gp = changes.gatePassNo ? ` · Gate Pass: ${changes.gatePassNo}` : '';
            onApprovedOrRejected?.(
              `Product recall approved (-${changes.requestedQty || ''} pcs deducted)${gp}`
            );
          } else if (opType === 'RESTOCK') {
            onApprovedOrRejected?.(
              `Inbound restock approved (+${changes.requestedQty || ''} pcs added to live stock)!`
            );
          } else {
            onApprovedOrRejected?.('Stock & variant update approved and applied to live catalog!');
          }
        } else {
          onApprovedOrRejected?.(
            opType === 'RETURN'
              ? 'Product recall / return request rejected.'
              : 'Stock & variant update request rejected.'
          );
        }
      } else {
        const errData = await res.json().catch(() => ({}));
        const errMsg = Array.isArray(errData?.message)
          ? errData.message.join(', ')
          : errData?.message || `Failed to process request (HTTP ${res.status})`;
        setErrorBanner(errMsg);
      }
    } catch (err: any) {
      setErrorBanner(err?.message || 'Network error while reviewing request.');
    } finally {
      setProcessingId(null);
    }
  };

  const handleBulkApprove = async () => {
    const ids = Array.from(selectedIds);
    if (ids.length === 0) return;
    setProcessingId('__bulk__');
    setErrorBanner(null);
    try {
      let approvedCount = 0;
      const failures: string[] = [];
      for (const id of ids) {
        const res = await fetch(
          `${API_BASE}/inventory/stock-manage-requests/${encodeURIComponent(id)}/review`,
          {
            method: 'PATCH',
            headers: {
              'Content-Type': 'application/json',
              ...getAuthHeader(),
            },
            body: JSON.stringify({ action: 'APPROVE' }),
          }
        );
        if (res.ok) {
          approvedCount++;
        } else {
          const errData = await res.json().catch(() => ({}));
          failures.push(errData?.message || `Request ${id} failed`);
        }
      }
      await fetchRequests();
      setSelectedIds(new Set());
      if (typeof window !== 'undefined') {
        window.dispatchEvent(
          new CustomEvent('fulfillio-warehouse-sync', {
            detail: { source: 'AdminStockManageApproval' },
          })
        );
      }
      if (failures.length > 0) {
        setErrorBanner(failures[0]);
      }
      if (approvedCount > 0) {
        onApprovedOrRejected?.(`Approved & applied ${approvedCount} stock request(s)!`);
      }
    } finally {
      setProcessingId(null);
    }
  };

  const merchantOptions = useMemo(() => {
    const map = new Map<string, string>();
    requests.forEach((r) => {
      if (r.merchantCode) {
        map.set(r.merchantCode, r.merchantName ? `${r.merchantCode} — ${r.merchantName}` : r.merchantCode);
      }
    });
    return Array.from(map.entries());
  }, [requests]);

  const statusCounts = useMemo(
    () => ({
      PENDING: requests.filter((r) => r.status === 'PENDING').length,
      APPROVED: requests.filter((r) => r.status === 'APPROVED').length,
      REJECTED: requests.filter((r) => r.status === 'REJECTED').length,
      ALL: requests.length,
    }),
    [requests]
  );

  const filteredRequests = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    const list = requests.filter((r) => {
      if (filter !== 'ALL' && r.status !== filter) return false;
      if (merchantFilter !== 'ALL' && r.merchantCode !== merchantFilter) return false;
      const opType = r.operationType || 'ADJUST';
      if (typeFilter === 'RETURN' && opType !== 'RETURN') return false;
      if (typeFilter === 'RESTOCK' && opType !== 'RESTOCK') return false;
      if (typeFilter === 'NEW_VARIANTS' && r.newVariants.length === 0) return false;
      if (typeFilter === 'ADJUSTMENTS' && r.adjustments.length === 0) return false;
      if (!q) return true;
      return (
        r.productTitle.toLowerCase().includes(q) ||
        r.productSku.toLowerCase().includes(q) ||
        (r.variantSku || '').toLowerCase().includes(q) ||
        (r.merchantCode || '').toLowerCase().includes(q) ||
        (r.merchantName || '').toLowerCase().includes(q) ||
        (r.destination || '').toLowerCase().includes(q) ||
        (r.trackingRef || '').toLowerCase().includes(q) ||
        (r.reason || '').toLowerCase().includes(q)
      );
    });
    return [...list].sort((a, b) => {
      const ta = Date.parse(a.createdAt) || 0;
      const tb = Date.parse(b.createdAt) || 0;
      return sortOrder === 'NEWEST' ? tb - ta : ta - tb;
    });
  }, [requests, filter, merchantFilter, typeFilter, searchQuery, sortOrder]);

  const totalPages = Math.max(1, Math.ceil(filteredRequests.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const paginatedRequests = filteredRequests.slice(
    (safePage - 1) * PAGE_SIZE,
    safePage * PAGE_SIZE
  );

  useEffect(() => {
    setPage(1);
    setSelectedIds(new Set());
  }, [filter, merchantFilter, typeFilter, searchQuery, sortOrder]);

  const pendingOnPage = paginatedRequests.filter((r) => r.status === 'PENDING');
  const allPendingSelected =
    pendingOnPage.length > 0 && pendingOnPage.every((r) => selectedIds.has(r.id));

  return (
    <div className="rounded-2xl border border-slate-200 dark:border-white/10 bg-white/90 dark:bg-navy-900/90 shadow-xl overflow-hidden">
      {/* Header & Status Tabs */}
      <div className="px-5 py-4 border-b border-slate-200 dark:border-white/10 flex flex-col lg:flex-row lg:items-center justify-between gap-3 bg-slate-50/70 dark:bg-navy-950/60">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-orange-500/15 border border-orange-500/30 flex items-center justify-center text-orange-500 shrink-0">
            <Layers className="h-5 w-5" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="text-base font-extrabold text-navy-900 dark:text-white">
                Merchant Stock &amp; Variant Approval Queue
              </h3>
              {statusCounts.PENDING > 0 && (
                <span className="px-2.5 py-0.5 rounded-full text-[11px] font-extrabold bg-amber-500 text-slate-950">
                  {statusCounts.PENDING} Pending
                </span>
              )}
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Inspect variant photos, color/size additions, and stock quantity adjustments before applying to live inventory.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {(['PENDING', 'APPROVED', 'REJECTED', 'ALL'] as const).map((tab) => (
            <button
              key={tab}
              type="button"
              onClick={() => setFilter(tab)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer flex items-center gap-1.5 ${
                filter === tab
                  ? 'bg-orange-600 text-white'
                  : 'bg-white dark:bg-navy-900 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-white/10 hover:border-orange-400'
              }`}
            >
              <span>{tab === 'ALL' ? 'All' : tab.charAt(0) + tab.slice(1).toLowerCase()}</span>
              <span className="text-[10px] font-mono opacity-80">({statusCounts[tab]})</span>
            </button>
          ))}
          <button
            type="button"
            onClick={fetchRequests}
            className="p-2 rounded-lg bg-white dark:bg-navy-900 border border-slate-200 dark:border-white/10 text-slate-500 hover:text-orange-500 cursor-pointer"
            title="Refresh requests"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Filter & Search Toolbar */}
      <div className="px-5 py-3 border-b border-slate-200/80 dark:border-white/10 flex flex-col md:flex-row gap-2.5 bg-white dark:bg-navy-900/40">
        <div className="relative flex-1">
          <Search className="h-3.5 w-3.5 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by product, SKU, merchant code, or note..."
            className="w-full pl-9 pr-3 py-2 rounded-xl bg-slate-50 dark:bg-navy-950 border border-slate-200 dark:border-white/10 text-xs text-navy-900 dark:text-white focus:outline-none focus:border-orange-500"
          />
        </div>

        <select
          value={merchantFilter}
          onChange={(e) => setMerchantFilter(e.target.value)}
          className="px-3 py-2 rounded-xl bg-slate-50 dark:bg-navy-950 border border-slate-200 dark:border-white/10 text-xs font-semibold text-navy-900 dark:text-white focus:outline-none focus:border-orange-500"
        >
          <option value="ALL">All Merchants ({merchantOptions.length})</option>
          {merchantOptions.map(([code, label]) => (
            <option key={code} value={code}>
              {label}
            </option>
          ))}
        </select>

        <select
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value as any)}
          className="px-3 py-2 rounded-xl bg-slate-50 dark:bg-navy-950 border border-slate-200 dark:border-white/10 text-xs font-semibold text-navy-900 dark:text-white focus:outline-none focus:border-orange-500"
        >
          <option value="ALL">All Request Types</option>
          <option value="RETURN">Recall / Return (-)</option>
          <option value="RESTOCK">Inbound Restock (+)</option>
          <option value="NEW_VARIANTS">Has New Variants</option>
          <option value="ADJUSTMENTS">Qty Adjustments</option>
        </select>

        <select
          value={sortOrder}
          onChange={(e) => setSortOrder(e.target.value as any)}
          className="px-3 py-2 rounded-xl bg-slate-50 dark:bg-navy-950 border border-slate-200 dark:border-white/10 text-xs font-semibold text-navy-900 dark:text-white focus:outline-none focus:border-orange-500"
        >
          <option value="NEWEST">Newest First</option>
          <option value="OLDEST">Oldest First</option>
        </select>
      </div>

      {/* Error Alert Banner */}
      {errorBanner && (
        <div className="px-5 py-3 bg-rose-500/10 border-b border-rose-500/20 flex items-center justify-between gap-3 text-xs text-rose-700 dark:text-rose-300 font-semibold">
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 shrink-0" />
            <span>{errorBanner}</span>
          </div>
          <button
            type="button"
            onClick={() => setErrorBanner(null)}
            className="p-1 rounded hover:bg-rose-500/15 cursor-pointer"
            aria-label="Dismiss error"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      )}

      {/* Bulk Action Bar */}
      {selectedIds.size > 0 && (
        <div className="px-5 py-2.5 bg-orange-500/10 border-b border-orange-500/20 flex items-center justify-between gap-3">
          <span className="text-xs font-bold text-orange-700 dark:text-orange-300">
            {selectedIds.size} pending request(s) selected
          </span>
          <div className="flex items-center gap-2">
            <button
              type="button"
              disabled={processingId === '__bulk__'}
              onClick={handleBulkApprove}
              className="px-3.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer"
            >
              <CheckCircle2 className="h-3.5 w-3.5" />
              <span>{processingId === '__bulk__' ? 'Approving...' : 'Approve Selected'}</span>
            </button>
            <button
              type="button"
              onClick={() => setSelectedIds(new Set())}
              className="px-3 py-1.5 rounded-lg bg-white dark:bg-navy-900 border border-slate-200 dark:border-white/10 text-xs font-semibold text-slate-600 dark:text-slate-300 cursor-pointer"
            >
              Clear
            </button>
          </div>
        </div>
      )}

      {/* Data Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead className="bg-slate-50 dark:bg-navy-950/70 text-slate-500 dark:text-slate-400 uppercase tracking-wider font-semibold border-b border-slate-200 dark:border-white/10">
            <tr>
              <th className="py-3 px-2.5 lg:px-3 w-9">
                <input
                  type="checkbox"
                  checked={allPendingSelected}
                  disabled={pendingOnPage.length === 0}
                  onChange={(e) => {
                    if (e.target.checked) {
                      setSelectedIds(new Set(pendingOnPage.map((r) => r.id)));
                    } else {
                      setSelectedIds(new Set());
                    }
                  }}
                  aria-label="Select all pending requests on page"
                  className="rounded border-slate-300 dark:border-white/20 cursor-pointer"
                />
              </th>
              <th className="py-3 px-2.5 lg:px-3">Type</th>
              <th className="py-3 px-2.5 lg:px-3">Merchant</th>
              <th className="py-3 px-2.5 lg:px-3">Product &amp; SKU</th>
              <th className="py-3 px-2.5 lg:px-3">Variant / Photo</th>
              <th className="py-3 px-2.5 lg:px-3">Qty Adjustments</th>
              <th className="py-3 px-2.5 lg:px-3">Reason / Destination</th>
              <th className="py-3 px-2.5 lg:px-3 text-center">Status</th>
              <th className="py-3 px-2.5 lg:px-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-white/5">
            {paginatedRequests.length === 0 ? (
              <tr>
                <td colSpan={9} className="py-12 px-4 text-center text-slate-500 dark:text-slate-400">
                  No {filter === 'ALL' ? '' : filter.toLowerCase()} stock, recall, or variant requests found.
                </td>
              </tr>
            ) : (
              paginatedRequests.map((req) => {
                const isPending = req.status === 'PENDING';
                const isProcessing = processingId === req.id;
                const opType = req.operationType || 'ADJUST';
                const isRecall = opType === 'RETURN';
                const isRestock = opType === 'RESTOCK';
                const variantLabel = [req.color, req.size].filter(Boolean).join(' / ');

                return (
                  <tr
                    key={req.id}
                    className="hover:bg-slate-50/70 dark:hover:bg-navy-800/40 transition-colors"
                  >
                    <td className="py-3.5 px-4 align-top">
                      <input
                        type="checkbox"
                        disabled={!isPending}
                        checked={selectedIds.has(req.id)}
                        onChange={(e) => {
                          setSelectedIds((prev) => {
                            const next = new Set(prev);
                            if (e.target.checked) next.add(req.id);
                            else next.delete(req.id);
                            return next;
                          });
                        }}
                        aria-label={`Select request ${req.id}`}
                        className="rounded border-slate-300 dark:border-white/20 cursor-pointer disabled:opacity-30"
                      />
                    </td>

                    {/* Type */}
                    <td className="py-3.5 px-4 align-top">
                      {isRecall ? (
                        <div className="space-y-1">
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-orange-500/10 border border-orange-500/20 text-orange-600 dark:text-orange-400 font-bold text-[11px] whitespace-nowrap">
                            <RotateCcw className="h-3 w-3" />
                            <span>RECALL / RETURN</span>
                          </span>
                          {req.requestedQty ? (
                            <div className="font-mono font-extrabold text-orange-600 dark:text-orange-400">
                              -{req.requestedQty} pcs
                            </div>
                          ) : null}
                        </div>
                      ) : isRestock ? (
                        <div className="space-y-1">
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 font-bold text-[11px] whitespace-nowrap">
                            <ArrowUpRight className="h-3 w-3" />
                            <span>RESTOCK</span>
                          </span>
                          {req.requestedQty ? (
                            <div className="font-mono font-extrabold text-emerald-600 dark:text-emerald-400">
                              +{req.requestedQty} pcs
                            </div>
                          ) : null}
                        </div>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-indigo-500/10 border border-indigo-500/20 text-indigo-600 dark:text-indigo-400 font-bold text-[11px] whitespace-nowrap">
                          <Layers className="h-3 w-3" />
                          <span>STOCK &amp; VARIANT</span>
                        </span>
                      )}
                    </td>

                    {/* Merchant */}
                    <td className="py-3.5 px-4 align-top">
                      <div className="font-mono font-bold text-orange-600 dark:text-orange-400">
                        {req.merchantCode || '—'}
                      </div>
                      <div className="font-semibold text-navy-900 dark:text-white truncate max-w-[140px]">
                        {req.merchantName || 'Merchant'}
                      </div>
                      <div className="text-[10px] text-slate-400 mt-0.5">
                        {new Date(req.createdAt).toLocaleString()}
                      </div>
                    </td>

                    {/* Product & SKU */}
                    <td className="py-3.5 px-4 align-top">
                      <div className="flex items-start gap-2.5">
                        {req.productImageUrl ? (
                          /* eslint-disable-next-line @next/next/no-img-element */
                          <img
                            src={req.productImageUrl}
                            alt={req.productTitle}
                            className="h-10 w-10 rounded-lg object-cover border border-slate-200 dark:border-white/10 shrink-0"
                          />
                        ) : (
                          <div className="h-10 w-10 rounded-lg bg-slate-100 dark:bg-navy-800 shrink-0" />
                        )}
                        <div className="min-w-0">
                          <div className="font-bold text-navy-900 dark:text-white truncate max-w-[180px]">
                            {req.productTitle}
                          </div>
                          <div className="font-mono text-[11px] text-slate-500 dark:text-slate-400">
                            {req.variantSku || req.productSku}
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* Variant / Photo */}
                    <td className="py-3.5 px-4 align-top">
                      {isRecall || isRestock ? (
                        <div className="space-y-0.5">
                          <div className="font-semibold text-navy-900 dark:text-white">
                            {variantLabel || 'Product / Default Variant'}
                          </div>
                          {req.variantSku && (
                            <div className="font-mono text-[11px] text-slate-500 dark:text-slate-400">
                              {req.variantSku}
                            </div>
                          )}
                        </div>
                      ) : req.newVariants.length === 0 ? (
                        <span className="text-slate-400 italic">None</span>
                      ) : (
                        <div className="space-y-1.5">
                          {req.newVariants.map((nv, i) => (
                            <div key={i} className="flex items-center gap-2">
                              {nv.imageUrl && (
                                <button
                                  type="button"
                                  onClick={() =>
                                    setPreviewImage({
                                      title: `${req.productTitle} — ${[nv.color, nv.size]
                                        .filter(Boolean)
                                        .join(' / ')}`,
                                      url: nv.imageUrl!,
                                    })
                                  }
                                  className="shrink-0 cursor-pointer hover:opacity-80"
                                  title="Click to zoom variant photo"
                                >
                                  {/* eslint-disable-next-line @next/next/no-img-element */}
                                  <img
                                    src={nv.imageUrl}
                                    alt={nv.color || 'Variant'}
                                    className="h-8 w-8 rounded-md object-cover border border-emerald-400/50"
                                  />
                                </button>
                              )}
                              <div className="min-w-0">
                                <div className="font-semibold text-navy-900 dark:text-white truncate">
                                  {[nv.color, nv.size].filter(Boolean).join(' / ') || 'Standard'}
                                </div>
                                <div className="font-mono font-bold text-emerald-600 dark:text-emerald-400">
                                  +{nv.stock} pcs
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </td>

                    {/* Qty Adjustments */}
                    <td className="py-3.5 px-4 align-top">
                      {req.adjustments.length === 0 ? (
                        <span className="text-slate-400 italic">None</span>
                      ) : (
                        <div className="space-y-1">
                          {req.adjustments.map((adj, i) => (
                            <div key={i} className="font-mono whitespace-nowrap">
                              <span className="font-sans font-semibold text-slate-600 dark:text-slate-300 mr-1.5">
                                {[adj.color, adj.size].filter(Boolean).join('/') ||
                                  adj.variantSku ||
                                  'Base'}:
                              </span>
                              <span className="text-slate-400">{adj.previousQuantity ?? '—'}</span>
                              <span className="mx-1 text-slate-400">→</span>
                              <span
                                className={`font-bold ${
                                  isRestock
                                    ? 'text-emerald-600 dark:text-emerald-400'
                                    : 'text-orange-600 dark:text-orange-400'
                                }`}
                              >
                                {adj.newQuantity}
                              </span>
                            </div>
                          ))}
                        </div>
                      )}
                    </td>

                    {/* Reason / Destination / Tracking */}
                    <td className="py-3.5 px-4 align-top max-w-[220px] space-y-1">
                      <p className="text-slate-700 dark:text-slate-200 font-medium break-words">
                        {req.reason || '—'}
                      </p>
                      {req.destination && (
                        <div className="flex items-start gap-1 text-[11px] text-slate-500 dark:text-slate-400">
                          <MapPin className="h-3 w-3 text-orange-500 shrink-0 mt-0.5" />
                          <span className="break-words">{req.destination}</span>
                        </div>
                      )}
                      {(req.carrier || req.trackingRef) && (
                        <div className="flex items-center gap-1 text-[11px] font-mono text-slate-500 dark:text-slate-400">
                          <Truck className="h-3 w-3 text-emerald-500 shrink-0" />
                          <span>{[req.carrier, req.trackingRef].filter(Boolean).join(' · ')}</span>
                        </div>
                      )}
                      {req.status === 'APPROVED' && req.gatePassNo && (
                        <span className="inline-block px-2 py-0.5 rounded bg-emerald-500/10 border border-emerald-500/20 font-mono text-[10px] font-bold text-emerald-600 dark:text-emerald-400">
                          Gate Pass: {req.gatePassNo}
                        </span>
                      )}
                      {req.status === 'REJECTED' && req.rejectionReason && (
                        <p className="mt-1 text-rose-600 dark:text-rose-400 font-semibold">
                          Rejected: {req.rejectionReason}
                        </p>
                      )}
                    </td>

                    {/* Status */}
                    <td className="py-3.5 px-4 text-center align-top">
                      {isPending ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-600 dark:text-amber-400 font-bold">
                          <Clock className="h-3.5 w-3.5" />
                          <span>Pending</span>
                        </span>
                      ) : req.status === 'APPROVED' ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 font-bold">
                          <CheckCircle2 className="h-3.5 w-3.5" />
                          <span>Approved</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-400 font-bold">
                          <AlertTriangle className="h-3.5 w-3.5" />
                          <span>Rejected</span>
                        </span>
                      )}
                    </td>

                    {/* Actions */}
                    <td className="py-3.5 px-4 text-right align-top">
                      {isPending ? (
                        <div className="inline-flex items-center gap-1.5 justify-end">
                          <button
                            type="button"
                            disabled={isProcessing}
                            onClick={() => handleReview(req.id, 'APPROVE')}
                            className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-bold inline-flex items-center gap-1 cursor-pointer"
                          >
                            <CheckCircle2 className="h-3.5 w-3.5" />
                            <span>{isProcessing ? '...' : 'Approve'}</span>
                          </button>
                          <button
                            type="button"
                            disabled={isProcessing}
                            onClick={() => {
                              setRejectModalTarget(req);
                              setRejectReason('');
                            }}
                            className="px-2.5 py-1.5 rounded-lg bg-rose-500/15 hover:bg-rose-500/25 border border-rose-500/30 text-rose-700 dark:text-rose-300 font-bold inline-flex items-center gap-1 cursor-pointer"
                          >
                            <XCircle className="h-3.5 w-3.5" />
                            <span>Reject</span>
                          </button>
                        </div>
                      ) : (
                        <span className="text-[11px] text-slate-400">
                          {req.reviewedAt ? new Date(req.reviewedAt).toLocaleDateString() : 'Reviewed'}
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="px-5 py-3 border-t border-slate-200 dark:border-white/10 flex items-center justify-between text-xs text-slate-500">
          <span>
            Showing {(safePage - 1) * PAGE_SIZE + 1}–
            {Math.min(safePage * PAGE_SIZE, filteredRequests.length)} of {filteredRequests.length}
          </span>
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              disabled={safePage <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              className="p-1.5 rounded-lg border border-slate-200 dark:border-white/10 disabled:opacity-40 cursor-pointer"
            >
              <ChevronLeft className="h-3.5 w-3.5" />
            </button>
            <span className="font-mono font-bold px-2">
              {safePage} / {totalPages}
            </span>
            <button
              type="button"
              disabled={safePage >= totalPages}
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              className="p-1.5 rounded-lg border border-slate-200 dark:border-white/10 disabled:opacity-40 cursor-pointer"
            >
              <ChevronRight className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* Reject Reason Modal */}
      {rejectModalTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-navy-950/70 backdrop-blur-xs">
          <div className="w-full max-w-md rounded-2xl bg-white dark:bg-navy-900 border border-slate-200 dark:border-white/10 p-5 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-bold text-navy-900 dark:text-white">
                Reject Stock Request ({rejectModalTarget.productTitle})
              </h4>
              <button
                type="button"
                onClick={() => setRejectModalTarget(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-white"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <textarea
              rows={3}
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              placeholder="Enter reason for rejecting this stock/variant update..."
              className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-navy-950 border border-slate-200 dark:border-white/10 text-xs text-navy-900 dark:text-white focus:outline-none focus:border-rose-500"
            />
            <div className="flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setRejectModalTarget(null)}
                className="px-3.5 py-2 rounded-xl bg-slate-100 dark:bg-navy-800 text-xs font-semibold text-slate-600 dark:text-slate-300"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={processingId === rejectModalTarget.id}
                onClick={() => handleReview(rejectModalTarget.id, 'REJECT', rejectReason)}
                className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold cursor-pointer"
              >
                Confirm Rejection
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Image Zoom Preview Modal */}
      {previewImage && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-navy-950/80 backdrop-blur-xs"
          onClick={() => setPreviewImage(null)}
        >
          <div
            className="max-w-lg w-full rounded-2xl bg-white dark:bg-navy-900 border border-slate-200 dark:border-white/10 p-4 space-y-3 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-navy-900 dark:text-white truncate">
                {previewImage.title}
              </span>
              <button
                type="button"
                onClick={() => setPreviewImage(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-white"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={previewImage.url}
              alt={previewImage.title}
              className="w-full max-h-[65vh] object-contain rounded-xl bg-slate-50 dark:bg-navy-950"
            />
          </div>
        </div>
      )}
    </div>
  );
}
