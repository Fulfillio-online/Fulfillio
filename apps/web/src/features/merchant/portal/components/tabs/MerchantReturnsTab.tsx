'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import {
  RotateCcw,
  XCircle,
  Package,
  Layers,
  FileText,
  Search,
  Filter,
  Download,
  ShieldCheck,
  CheckCircle2,
  Clock,
  ArrowRight,
  TrendingUp,
  AlertTriangle,
  MapPin,
  ExternalLink,
  Hash,
  Truck,
  Boxes,
} from 'lucide-react';
import {
  MerchantOrderItem,
  MerchantProductItem,
  MerchantProfileData,
} from '../../types';
import {
  WarehouseReturnRecord,
  CancelledOrderItemRecord,
  RecoveryLedgerEntry,
} from '@/features/admin/returns/types';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api';

interface MerchantReturnsTabProps {
  profile: MerchantProfileData;
  orders: MerchantOrderItem[];
  products: MerchantProductItem[];
  onTriggerToast?: (msg: string) => void;
}

type MerchantTabMode = 'ALL' | 'CANCELLED' | 'RETURNS' | 'STOCK_LEDGER' | 'INITIAL_INTAKE';

export function MerchantReturnsTab({
  profile,
  orders,
  products,
  onTriggerToast,
}: MerchantReturnsTabProps) {
  const [activeTab, setActiveTab] = useState<MerchantTabMode>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'RESTOCKED' | 'PENDING_INSPECTION' | 'DAMAGED'>('ALL');
  const [receiptRecord, setReceiptRecord] = useState<RecoveryLedgerEntry | null>(null);

  // Raw states
  const [returnsList, setReturnsList] = useState<WarehouseReturnRecord[]>([]);
  const [cancelledOrders, setCancelledOrders] = useState<CancelledOrderItemRecord[]>([]);
  const [ledgerEntries, setLedgerEntries] = useState<RecoveryLedgerEntry[]>([]);

  const merchantCode = profile.merchantCode || 'MC-101';

  // Load live data directly from Neon PostgreSQL strictly for this merchant
  useEffect(() => {
    const syncData = async () => {
      try {
        const qs = `merchantCode=${encodeURIComponent(merchantCode)}`;
        const [cancelledRes, returnsRes, ledgerRes] = await Promise.all([
          fetch(`${API_BASE}/returns/cancelled?${qs}`).catch(() => null),
          fetch(`${API_BASE}/returns?${qs}`).catch(() => null),
          fetch(`${API_BASE}/returns/ledger?${qs}`).catch(() => null),
        ]);

        if (cancelledRes?.ok) {
          const data = await cancelledRes.json();
          if (Array.isArray(data)) {
            setCancelledOrders(data);
          }
        }

        if (returnsRes?.ok) {
          const data = await returnsRes.json();
          if (Array.isArray(data)) {
            setReturnsList(
              data.map((r: any) => {
                const firstItem = r.items?.[0] || {};
                return {
                  id: `RTO-${r.id}`,
                  orderId: r.id?.startsWith('#') ? r.id : `#${r.id}`,
                  trackingCode: r.trackingCode || `TRK-${r.id}`,
                  courier: r.courier || 'Steadfast',
                  merchantCode: r.merchantCode || merchantCode,
                  merchantName: r.merchantName || profile.storeName,
                  productTitle: firstItem.title || 'Returned Product',
                  fullSku: firstItem.sku || 'SKU-N/A',
                  qty: (r.items || []).reduce((s: number, it: any) => s + (it.qty || 1), 0) || 1,
                  targetBin: 'A-01-01',
                  currentStockSnapshot: 0,
                  returnReason: 'Courier RTO Return',
                  status: 'PENDING_INSPECTION',
                  receivedAt: r.returnedAt
                    ? new Date(r.returnedAt).toLocaleString('en-GB', {
                        day: '2-digit',
                        month: 'short',
                        hour: '2-digit',
                        minute: '2-digit',
                      })
                    : 'Recently',
                  imageUrl: '',
                };
              })
            );
          }
        }

        if (ledgerRes?.ok) {
          const data = await ledgerRes.json();
          if (Array.isArray(data)) {
            setLedgerEntries(
              data.map((m: any) => ({
                id: m.id,
                timestamp: m.timestamp,
                sourceType: m.sourceType || 'ORDER_CANCELLED',
                referenceId: m.orderId || '—',
                merchantCode: m.merchantCode || merchantCode,
                merchantName: m.merchantName || profile.storeName,
                productTitle: m.productTitle || 'Product',
                sku: m.fullSku || 'SKU-N/A',
                deltaQty: m.qty ?? 0,
                previousStock: m.previousStock ?? 0,
                newStock: m.newStock ?? 0,
                binCode: m.binCode || 'A-01-01',
                operator: m.operatorName || 'Warehouse Admin',
                digitalProofHash: `DB-${String(m.id || '').slice(0, 8).toUpperCase()}`,
                notes: m.notes || 'Stock recovery recorded in PostgreSQL',
              }))
            );
          }
        }
      } catch {
        // keep current state on network failure
      }
    };

    syncData();
    window.addEventListener('fulfillio-warehouse-sync', syncData);
    return () => window.removeEventListener('fulfillio-warehouse-sync', syncData);
  }, [merchantCode, profile.storeName]);

  // KPI Calculations
  const stats = useMemo(() => {
    const totalCancelledUnits = cancelledOrders.reduce((s, c) => s + (c.qty || 1), 0);
    const totalRtoParcels = returnsList.length;
    const restockedRto = returnsList.filter((r) => r.status === 'RESTOCKED');
    const damagedRto = returnsList.filter((r) => r.status === 'DAMAGED');

    const restockedRtoUnits = restockedRto.reduce((s, r) => s + (r.qty || 1), 0);
    const damagedUnits = damagedRto.reduce((s, r) => s + (r.qty || 1), 0);

    const totalRecoveredUnits = totalCancelledUnits + restockedRtoUnits;
    const totalRecoveredValue =
      cancelledOrders.reduce((s, c) => s + (c.codAmount || c.qty * c.unitPrice || 0), 0) +
      restockedRto.reduce((s, r) => s + r.qty * 1650, 0);

    return {
      cancelledOrdersCount: cancelledOrders.length,
      totalCancelledUnits,
      totalRtoParcels,
      totalRecoveredUnits,
      totalRecoveredValue,
      damagedUnits,
    };
  }, [cancelledOrders, returnsList]);

  // Filtered lists
  const filteredCancelled = useMemo(() => {
    return cancelledOrders.filter((c) => {
      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase().trim();
      return (
        c.orderId.toLowerCase().includes(q) ||
        c.productTitle.toLowerCase().includes(q) ||
        c.fullSku.toLowerCase().includes(q) ||
        c.customerName.toLowerCase().includes(q)
      );
    });
  }, [cancelledOrders, searchQuery]);

  const filteredReturns = useMemo(() => {
    return returnsList.filter((r) => {
      if (statusFilter !== 'ALL' && r.status !== statusFilter) return false;
      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase().trim();
      return (
        r.id.toLowerCase().includes(q) ||
        r.orderId.toLowerCase().includes(q) ||
        r.trackingCode.toLowerCase().includes(q) ||
        r.productTitle.toLowerCase().includes(q) ||
        r.fullSku.toLowerCase().includes(q) ||
        r.courier.toLowerCase().includes(q)
      );
    });
  }, [returnsList, searchQuery, statusFilter]);

  // Segment ledger into:
  // 1. Initial Intake (প্রাথমিক ক্যাটালগ ও ইনওয়ার্ড চালান এন্ট্রি)
  // 2. Recovery Ledger (অর্ডার বাতিল ও কুরিয়ার রিটার্ন হতে রিকভারি)
  const initialIntakeEntries = useMemo(
    () => ledgerEntries.filter((m) => m.sourceType === 'INITIAL_INTAKE'),
    [ledgerEntries]
  );

  const recoveryLedgerEntries = useMemo(
    () => ledgerEntries.filter((m) => m.sourceType !== 'INITIAL_INTAKE'),
    [ledgerEntries]
  );

  const filteredRecoveryLedger = useMemo(() => {
    return recoveryLedgerEntries.filter((m) => {
      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase().trim();
      return (
        m.id.toLowerCase().includes(q) ||
        m.referenceId.toLowerCase().includes(q) ||
        m.sku.toLowerCase().includes(q) ||
        m.productTitle.toLowerCase().includes(q)
      );
    });
  }, [recoveryLedgerEntries, searchQuery]);

  const filteredInitialIntake = useMemo(() => {
    return initialIntakeEntries.filter((m) => {
      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase().trim();
      return (
        m.id.toLowerCase().includes(q) ||
        m.referenceId.toLowerCase().includes(q) ||
        m.sku.toLowerCase().includes(q) ||
        m.productTitle.toLowerCase().includes(q)
      );
    });
  }, [initialIntakeEntries, searchQuery]);

  const filteredLedger = useMemo(() => {
    return ledgerEntries.filter((m) => {
      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase().trim();
      return (
        m.id.toLowerCase().includes(q) ||
        m.referenceId.toLowerCase().includes(q) ||
        m.sku.toLowerCase().includes(q) ||
        m.productTitle.toLowerCase().includes(q)
      );
    });
  }, [ledgerEntries, searchQuery]);

  // CSV Export for Merchant
  const handleExportCsv = (mode: 'RECOVERY' | 'INITIAL' | 'ALL' | React.MouseEvent = 'RECOVERY') => {
    const effectiveMode = typeof mode === 'string' ? mode : 'RECOVERY';
    const targetList =
      effectiveMode === 'INITIAL'
        ? filteredInitialIntake
        : effectiveMode === 'RECOVERY'
        ? filteredRecoveryLedger
        : filteredLedger;

    const headers = [
      'Proof ID',
      'Date & Time',
      'Source Type',
      'Reference ID (Order/Challan/Tracking)',
      'Product Title',
      'SKU',
      'Delta Units (+)',
      'Previous Stock',
      'New Stock',
      'Restocked Bin',
      'Digital Proof Hash',
      'Notes',
    ];

    const rows = targetList.map((m) => [
      `"${m.id}"`,
      `"${m.timestamp}"`,
      `"${m.sourceType}"`,
      `"${m.referenceId}"`,
      `"${m.productTitle.replace(/"/g, '""')}"`,
      `"${m.sku}"`,
      `"+${m.deltaQty}"`,
      m.previousStock,
      m.newStock,
      `"${m.binCode}"`,
      `"${m.digitalProofHash}"`,
      `"${(m.notes || '').replace(/"/g, '""')}"`,
    ]);

    const csvContent =
      'data:text/csv;charset=utf-8,\uFEFF' +
      [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    const fileTag =
      mode === 'INITIAL'
        ? 'initial_stock_intake_ledger'
        : mode === 'RECOVERY'
        ? 'stock_recovery_ledger'
        : 'full_stock_ledger';
    link.setAttribute(
      'download',
      `${merchantCode}_${fileTag}_${new Date().toISOString().slice(0, 10)}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    if (onTriggerToast) {
      onTriggerToast(
        mode === 'INITIAL'
          ? 'Initial stock intake ledger CSV downloaded successfully.'
          : 'Stock recovery ledger CSV downloaded successfully.'
      );
    }
  };

  return (
    <div className="space-y-6 text-navy-900 dark:text-white">
      {/* 1. Top Header Banner */}
      <div className="bg-white dark:bg-navy-900 border border-slate-200 dark:border-white/10 rounded-2xl p-5 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-orange-500/10 border border-orange-500/30 flex items-center justify-center text-orange-600 dark:text-orange-400 shrink-0">
            <RotateCcw className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg sm:text-xl font-bold tracking-tight text-navy-900 dark:text-white">
                Returns &amp; Cancellations Management
              </h1>
              <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-orange-500/15 text-orange-600 dark:text-orange-400 border border-orange-500/30">
                {profile.storeName} ({merchantCode})
              </span>
            </div>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5">
              Track cancelled customer orders, courier RTO parcels, and view real-time warehouse stock accounting and restocked storage bins
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 text-xs">
          <button
            type="button"
            onClick={() => handleExportCsv('ALL')}
            className="px-3.5 py-2 rounded-xl bg-slate-100 dark:bg-navy-800 hover:bg-slate-200 dark:hover:bg-navy-700 text-navy-800 dark:text-slate-100 border border-slate-300 dark:border-white/15 flex items-center gap-1.5 transition-colors cursor-pointer font-semibold"
          >
            <Download className="w-3.5 h-3.5 text-orange-600 dark:text-orange-400" />
            <span>Export Stock Ledger (CSV)</span>
          </button>

          <Link
            href="/merchant/orders"
            className="px-4 py-2 rounded-xl bg-orange-600 hover:bg-orange-700 text-white font-bold flex items-center gap-1.5 shadow-md shadow-orange-500/25 transition-colors cursor-pointer"
          >
            <span>View All Orders</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>

      {/* 2. Isolated Merchant KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Cancelled Orders */}
        <div className="p-4 rounded-2xl bg-white dark:bg-navy-900 border border-slate-200 dark:border-white/10 flex items-center justify-between shadow-sm">
          <div>
            <span className="text-xs font-semibold uppercase text-slate-500 dark:text-slate-400 block tracking-wider">
              Cancelled Orders
            </span>
            <span className="text-2xl font-extrabold text-navy-900 dark:text-white tabular-nums mt-1 block">
              {stats.cancelledOrdersCount}{' '}
              <span className="text-xs font-normal text-slate-500 dark:text-slate-400">
                ({stats.totalCancelledUnits} pcs)
              </span>
            </span>
            <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-medium">
              Auto-restored to available stock
            </span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-navy-800 border border-slate-200 dark:border-white/10 flex items-center justify-center text-rose-500 shrink-0">
            <XCircle className="w-5 h-5" />
          </div>
        </div>

        {/* Courier Returns (RTO) */}
        <div className="p-4 rounded-2xl bg-white dark:bg-navy-900 border border-slate-200 dark:border-white/10 flex items-center justify-between shadow-sm">
          <div>
            <span className="text-xs font-semibold uppercase text-slate-500 dark:text-slate-400 block tracking-wider">
              Courier Returns (RTO)
            </span>
            <span className="text-2xl font-extrabold text-navy-900 dark:text-white tabular-nums mt-1 block">
              {stats.totalRtoParcels}{' '}
              <span className="text-xs font-normal text-slate-500 dark:text-slate-400">parcels</span>
            </span>
            <span className="text-[11px] text-amber-600 dark:text-amber-400 font-medium">
              Steadfast · Pathao · RedX
            </span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-navy-800 border border-slate-200 dark:border-white/10 flex items-center justify-center text-amber-500 shrink-0">
            <RotateCcw className="w-5 h-5" />
          </div>
        </div>

        {/* Total Sellable Stock Recovered */}
        <div className="p-4 rounded-2xl bg-white dark:bg-navy-900 border border-slate-200 dark:border-white/10 flex items-center justify-between shadow-sm">
          <div>
            <span className="text-xs font-semibold uppercase text-slate-500 dark:text-slate-400 block tracking-wider">
              Sellable Stock Recovered
            </span>
            <span className="text-2xl font-extrabold text-navy-900 dark:text-white tabular-nums mt-1 block">
              +{stats.totalRecoveredUnits}{' '}
              <span className="text-xs font-normal text-slate-500 dark:text-slate-400">pcs</span>
            </span>
            <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-medium">
              ৳{stats.totalRecoveredValue.toLocaleString()} recovered value
            </span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-600 dark:text-emerald-400 shrink-0">
            <CheckCircle2 className="w-5 h-5" />
          </div>
        </div>

        {/* Quarantined Damage */}
        <div className="p-4 rounded-2xl bg-white dark:bg-navy-900 border border-slate-200 dark:border-white/10 flex items-center justify-between shadow-sm">
          <div>
            <span className="text-xs font-semibold uppercase text-slate-500 dark:text-slate-400 block tracking-wider">
              Damaged in Transit
            </span>
            <span className="text-2xl font-extrabold text-navy-900 dark:text-white tabular-nums mt-1 block">
              {stats.damagedUnits}{' '}
              <span className="text-xs font-normal text-slate-500 dark:text-slate-400">pcs</span>
            </span>
            <span className="text-[11px] text-rose-600 dark:text-rose-400 font-medium">
              Quarantined for courier claim
            </span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-600 dark:text-rose-400 shrink-0">
            <AlertTriangle className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* 3. Navigation Mode Switcher */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-white dark:bg-navy-900 border border-slate-200 dark:border-white/10 rounded-2xl p-2 shadow-sm">
        <div className="flex flex-wrap items-center gap-1.5">
          <button
            type="button"
            onClick={() => setActiveTab('ALL')}
            className={`px-3.5 py-2 rounded-xl text-xs sm:text-sm font-bold flex items-center gap-2 transition-all cursor-pointer ${
              activeTab === 'ALL'
                ? 'bg-orange-600 text-white shadow-md shadow-orange-500/20'
                : 'text-slate-600 dark:text-slate-300 hover:text-navy-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-navy-800'
            }`}
          >
            <Layers className="w-4 h-4" />
            <span>All Reverse Items</span>
            <span
              className={`px-2 py-0.5 rounded-full text-[11px] tabular-nums font-semibold ${
                activeTab === 'ALL' ? 'bg-white/20 text-white' : 'bg-slate-200 dark:bg-navy-700 text-slate-700 dark:text-slate-300'
              }`}
            >
              {cancelledOrders.length + returnsList.length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('CANCELLED')}
            className={`px-3.5 py-2 rounded-xl text-xs sm:text-sm font-bold flex items-center gap-2 transition-all cursor-pointer ${
              activeTab === 'CANCELLED'
                ? 'bg-orange-600 text-white shadow-md shadow-orange-500/20'
                : 'text-slate-600 dark:text-slate-300 hover:text-navy-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-navy-800'
            }`}
          >
            <XCircle className="w-4 h-4 text-rose-500" />
            <span>Cancelled Orders</span>
            <span
              className={`px-2 py-0.5 rounded-full text-[11px] tabular-nums font-semibold ${
                activeTab === 'CANCELLED' ? 'bg-white/20 text-white' : 'bg-rose-500/10 text-rose-600 dark:text-rose-400'
              }`}
            >
              {cancelledOrders.length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('RETURNS')}
            className={`px-3.5 py-2 rounded-xl text-xs sm:text-sm font-bold flex items-center gap-2 transition-all cursor-pointer ${
              activeTab === 'RETURNS'
                ? 'bg-orange-600 text-white shadow-md shadow-orange-500/20'
                : 'text-slate-600 dark:text-slate-300 hover:text-navy-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-navy-800'
            }`}
          >
            <RotateCcw className="w-4 h-4 text-amber-500" />
            <span>Courier Returns (RTO)</span>
            <span
              className={`px-2 py-0.5 rounded-full text-[11px] tabular-nums font-semibold ${
                activeTab === 'RETURNS' ? 'bg-white/20 text-white' : 'bg-amber-500/10 text-amber-600 dark:text-amber-400'
              }`}
            >
              {returnsList.length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('STOCK_LEDGER')}
            className={`px-3.5 py-2 rounded-xl text-xs sm:text-sm font-bold flex items-center gap-2 transition-all cursor-pointer ${
              activeTab === 'STOCK_LEDGER'
                ? 'bg-orange-600 text-white shadow-md shadow-orange-500/20'
                : 'text-slate-600 dark:text-slate-300 hover:text-navy-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-navy-800'
            }`}
          >
            <FileText className="w-4 h-4 text-sky-500" />
            <span>Stock Recovery Ledger</span>
            <span
              className={`px-2 py-0.5 rounded-full text-[11px] tabular-nums font-semibold ${
                activeTab === 'STOCK_LEDGER' ? 'bg-white/20 text-white' : 'bg-sky-500/10 text-sky-600 dark:text-sky-400'
              }`}
            >
              {recoveryLedgerEntries.length} Proofs
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('INITIAL_INTAKE')}
            className={`px-3.5 py-2 rounded-xl text-xs sm:text-sm font-bold flex items-center gap-2 transition-all cursor-pointer ${
              activeTab === 'INITIAL_INTAKE'
                ? 'bg-orange-600 text-white shadow-md shadow-orange-500/20'
                : 'text-slate-600 dark:text-slate-300 hover:text-navy-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-navy-800'
            }`}
          >
            <Boxes className="w-4 h-4 text-indigo-500" />
            <span>Initial Stock Intake</span>
            <span
              className={`px-2 py-0.5 rounded-full text-[11px] tabular-nums font-semibold ${
                activeTab === 'INITIAL_INTAKE' ? 'bg-white/20 text-white' : 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400'
              }`}
            >
              {initialIntakeEntries.length} Proofs
            </span>
          </button>
        </div>

        <div className="flex items-center gap-2 px-2 text-xs text-slate-500 dark:text-slate-400">
          <ShieldCheck className="w-4 h-4 text-emerald-500" />
          <span>Warehouse Sync Active</span>
        </div>
      </div>

      {/* 4. Search and Filters Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white dark:bg-navy-900 border border-slate-200 dark:border-white/10 rounded-2xl p-3 shadow-sm">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by Order ID, SKU, product, courier tracking, or customer..."
            className="w-full pl-9 pr-4 py-2 rounded-xl bg-slate-50 dark:bg-navy-950 border border-slate-200 dark:border-white/10 text-xs sm:text-sm text-navy-900 dark:text-white focus:outline-none focus:border-orange-500"
          />
        </div>

        {activeTab === 'RETURNS' && (
          <div className="flex items-center gap-2 shrink-0">
            <Filter className="w-4 h-4 text-slate-400 shrink-0" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as any)}
              className="px-3 py-2 rounded-xl bg-slate-50 dark:bg-navy-950 border border-slate-200 dark:border-white/10 text-xs text-navy-900 dark:text-white focus:outline-none focus:border-orange-500 cursor-pointer"
            >
              <option value="ALL">All Inspection States</option>
              <option value="RESTOCKED">Restocked to Bin</option>
              <option value="PENDING_INSPECTION">Pending QC Inspection</option>
              <option value="DAMAGED">Damaged / Quarantined</option>
            </select>
          </div>
        )}
      </div>

      {/* 5. Tab Content Rendering */}

      {/* TAB: ALL REVERSE ITEMS */}
      {activeTab === 'ALL' && (
        <div className="space-y-6">
          {/* Cancelled Section */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-2.5 h-2.5 rounded-full bg-rose-500" />
                <h3 className="text-sm font-bold text-navy-900 dark:text-white uppercase tracking-wider">
                  Cancelled Orders &mdash; Restored to Available Stock ({filteredCancelled.length})
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setActiveTab('CANCELLED')}
                className="text-xs font-semibold text-orange-600 hover:text-orange-700 dark:text-orange-400 flex items-center gap-1 cursor-pointer"
              >
                <span>View Full Table</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            {filteredCancelled.length === 0 ? (
              <div className="p-8 text-center bg-white dark:bg-navy-900 rounded-2xl border border-slate-200 dark:border-white/10">
                <p className="text-xs text-slate-400">No cancelled orders found.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredCancelled.slice(0, 6).map((c) => (
                  <div
                    key={c.id}
                    className="p-4 rounded-2xl bg-white dark:bg-navy-900 border border-slate-200 dark:border-white/10 space-y-3 shadow-sm hover:border-orange-500/30 transition-all"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-extrabold text-xs text-orange-600 dark:text-orange-400">
                        {c.orderId}
                      </span>
                      <span className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full">
                        +{c.qty} pcs Restored
                      </span>
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-navy-900 dark:text-white line-clamp-1">
                        {c.productTitle}
                      </h4>
                      <p className="text-xs text-slate-500 font-mono mt-0.5">{c.fullSku}</p>
                    </div>
                    <div className="pt-2 border-t border-slate-100 dark:border-white/5 flex items-center justify-between text-xs text-slate-500">
                      <span>Customer: {c.customerName}</span>
                      <span className="font-semibold text-navy-900 dark:text-white">
                        ৳{c.codAmount.toLocaleString()}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Courier Returns Section */}
          <div className="space-y-3 pt-4 border-t border-slate-200 dark:border-white/10">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-2.5 h-2.5 rounded-full bg-amber-500" />
                <h3 className="text-sm font-bold text-navy-900 dark:text-white uppercase tracking-wider">
                  Courier Inbound Returns (RTO Parcels) ({filteredReturns.length})
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setActiveTab('RETURNS')}
                className="text-xs font-semibold text-orange-600 hover:text-orange-700 dark:text-orange-400 flex items-center gap-1 cursor-pointer"
              >
                <span>View All RTO Parcels</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            {filteredReturns.length === 0 ? (
              <div className="p-8 text-center bg-white dark:bg-navy-900 rounded-2xl border border-slate-200 dark:border-white/10">
                <p className="text-xs text-slate-400">No returned courier parcels recorded.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredReturns.slice(0, 6).map((r) => (
                  <div
                    key={r.id}
                    className="p-4 rounded-2xl bg-white dark:bg-navy-900 border border-slate-200 dark:border-white/10 space-y-3 shadow-sm hover:border-orange-500/30 transition-all"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                        <Truck className="w-3.5 h-3.5 text-slate-400" />
                        <span className="font-bold text-xs text-navy-900 dark:text-white">
                          {r.courier} &bull; {r.trackingCode}
                        </span>
                      </div>
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ${
                          r.status === 'RESTOCKED'
                            ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30'
                            : r.status === 'DAMAGED'
                            ? 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/30'
                            : 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/30'
                        }`}
                      >
                        {r.status === 'RESTOCKED'
                          ? 'Restocked'
                          : r.status === 'DAMAGED'
                          ? 'Damaged'
                          : 'Pending QC'}
                      </span>
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-navy-900 dark:text-white line-clamp-1">
                        {r.productTitle}
                      </h4>
                      <p className="text-xs text-slate-500 font-mono mt-0.5">{r.fullSku}</p>
                    </div>
                    <div className="pt-2 border-t border-slate-100 dark:border-white/5 flex items-center justify-between text-xs text-slate-500">
                      <span>Reason: {r.returnReason.slice(0, 28)}...</span>
                      <span className="font-semibold text-navy-900 dark:text-white">
                        {r.qty} pcs
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB: CANCELLED ORDERS TABLE */}
      {activeTab === 'CANCELLED' && (
        <div className="bg-white dark:bg-navy-900 border border-slate-200 dark:border-white/10 rounded-2xl overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[960px]">
              <thead>
                <tr className="border-b border-slate-200 dark:border-white/10 text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 bg-slate-50/60 dark:bg-navy-950/60">
                  <th className="py-3.5 px-4">Order ID &amp; Date</th>
                  <th className="py-3.5 px-4">Product &amp; SKU</th>
                  <th className="py-3.5 px-4">Customer</th>
                  <th className="py-3.5 px-4">Qty &amp; Value</th>
                  <th className="py-3.5 px-4">Stock Recovery Status</th>
                  <th className="py-3.5 px-4">Cancellation Reason</th>
                  <th className="py-3.5 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-white/5 text-xs sm:text-sm">
                {filteredCancelled.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-12 text-center text-slate-400">
                      No cancelled orders found matching your criteria.
                    </td>
                  </tr>
                ) : (
                  filteredCancelled.map((c) => (
                    <tr key={c.id} className="hover:bg-slate-50/50 dark:hover:bg-navy-800/40 transition-colors">
                      <td className="py-3.5 px-4">
                        <span className="font-extrabold text-orange-600 dark:text-orange-400 block font-mono">
                          {c.orderId}
                        </span>
                        <span className="text-[11px] text-slate-400 flex items-center gap-1 mt-0.5">
                          <Clock className="w-3 h-3" />
                          {c.cancelledAt}
                        </span>
                      </td>

                      <td className="py-3.5 px-4">
                        <span className="font-bold text-navy-900 dark:text-white block line-clamp-1">
                          {c.productTitle}
                        </span>
                        <span className="text-xs font-mono text-slate-500 block mt-0.5">
                          {c.fullSku} &bull; {c.color} &bull; {c.size}
                        </span>
                      </td>

                      <td className="py-3.5 px-4">
                        <span className="font-semibold text-navy-900 dark:text-white block">
                          {c.customerName}
                        </span>
                        <span className="text-xs text-slate-400">{c.city}</span>
                      </td>

                      <td className="py-3.5 px-4">
                        <span className="font-extrabold text-navy-900 dark:text-white block">
                          {c.qty} pcs
                        </span>
                        <span className="text-xs text-slate-500">৳{c.codAmount.toLocaleString()}</span>
                      </td>

                      <td className="py-3.5 px-4">
                        <div className="flex flex-col gap-1">
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 w-fit">
                            <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                            <span>+{c.qty} Restored</span>
                          </span>
                          <span className="text-[11px] text-slate-400 flex items-center gap-1">
                            <MapPin className="w-3 h-3 text-orange-500" />
                            <span>Bin: {c.targetBin}</span>
                          </span>
                        </div>
                      </td>

                      <td className="py-3.5 px-4">
                        <span className="text-xs text-slate-600 dark:text-slate-300 line-clamp-2 max-w-xs">
                          {c.cancelReason}
                        </span>
                      </td>

                      <td className="py-3.5 px-4 text-right">
                        <Link
                          href={`/merchant/orders/${encodeURIComponent(c.id)}`}
                          className="px-2.5 py-1.5 rounded-lg bg-slate-100 dark:bg-navy-800 hover:bg-slate-200 dark:hover:bg-navy-700 text-xs font-semibold text-navy-900 dark:text-white inline-flex items-center gap-1 transition-colors"
                        >
                          <span>Details</span>
                          <ExternalLink className="w-3 h-3" />
                        </Link>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB: COURIER RETURNS (RTO) TABLE */}
      {activeTab === 'RETURNS' && (
        <div className="bg-white dark:bg-navy-900 border border-slate-200 dark:border-white/10 rounded-2xl overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[960px]">
              <thead>
                <tr className="border-b border-slate-200 dark:border-white/10 text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 bg-slate-50/60 dark:bg-navy-950/60">
                  <th className="py-3.5 px-4">Return ID &amp; Courier</th>
                  <th className="py-3.5 px-4">Order Reference</th>
                  <th className="py-3.5 px-4">Product &amp; SKU</th>
                  <th className="py-3.5 px-4">Qty</th>
                  <th className="py-3.5 px-4">Return Reason</th>
                  <th className="py-3.5 px-4">QC Status</th>
                  <th className="py-3.5 px-4">Warehouse Bin</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-white/5 text-xs sm:text-sm">
                {filteredReturns.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-12 text-center text-slate-400">
                      No courier return parcels found.
                    </td>
                  </tr>
                ) : (
                  filteredReturns.map((r) => (
                    <tr key={r.id} className="hover:bg-slate-50/50 dark:hover:bg-navy-800/40 transition-colors">
                      <td className="py-3.5 px-4">
                        <span className="font-extrabold text-navy-900 dark:text-white block font-mono">
                          {r.id}
                        </span>
                        <span className="text-xs text-orange-600 dark:text-orange-400 font-bold block mt-0.5">
                          {r.courier} &bull; {r.trackingCode}
                        </span>
                      </td>

                      <td className="py-3.5 px-4">
                        <span className="font-semibold text-navy-900 dark:text-white block font-mono">
                          {r.orderId}
                        </span>
                        <span className="text-[11px] text-slate-400">{r.receivedAt}</span>
                      </td>

                      <td className="py-3.5 px-4">
                        <span className="font-bold text-navy-900 dark:text-white block line-clamp-1">
                          {r.productTitle}
                        </span>
                        <span className="text-xs font-mono text-slate-500 block mt-0.5">
                          {r.fullSku}
                        </span>
                      </td>

                      <td className="py-3.5 px-4">
                        <span className="font-extrabold text-navy-900 dark:text-white">
                          {r.qty} pcs
                        </span>
                      </td>

                      <td className="py-3.5 px-4">
                        <span className="text-xs text-slate-600 dark:text-slate-300 line-clamp-2 max-w-xs block">
                          {r.returnReason}
                        </span>
                        {r.inspectorNote && (
                          <span className="text-[11px] text-slate-400 italic block mt-0.5">
                            Note: {r.inspectorNote}
                          </span>
                        )}
                      </td>

                      <td className="py-3.5 px-4">
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${
                            r.status === 'RESTOCKED'
                              ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20'
                              : r.status === 'DAMAGED'
                              ? 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20'
                              : 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20'
                          }`}
                        >
                          {r.status === 'RESTOCKED' && <CheckCircle2 className="w-3.5 h-3.5" />}
                          {r.status === 'DAMAGED' && <AlertTriangle className="w-3.5 h-3.5" />}
                          {r.status === 'PENDING_INSPECTION' && <Clock className="w-3.5 h-3.5" />}
                          <span>
                            {r.status === 'RESTOCKED'
                              ? 'QC Pass & Restocked'
                              : r.status === 'DAMAGED'
                              ? 'Damaged (Claim)'
                              : 'Pending QC'}
                          </span>
                        </span>
                      </td>

                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-1 font-mono text-xs font-bold text-navy-900 dark:text-white">
                          <MapPin className="w-3.5 h-3.5 text-orange-500" />
                          <span>{r.status === 'DAMAGED' ? 'QUARANTINE-01' : r.targetBin}</span>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB: STOCK RECOVERY LEDGER (Returns & Cancellations recovery only) */}
      {activeTab === 'STOCK_LEDGER' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-1">
            <div>
              <h3 className="text-sm font-bold text-navy-900 dark:text-white flex items-center gap-2">
                <FileText className="w-4 h-4 text-sky-500" />
                <span>Store Stock Recovery Ledger (Returns &amp; Cancellations)</span>
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Immutable audit trail of inventory restored from customer cancellations and courier returns (RTO)
              </p>
            </div>
            <button
              type="button"
              onClick={() => handleExportCsv('RECOVERY')}
              className="px-3.5 py-1.5 rounded-xl bg-orange-600 hover:bg-orange-700 text-white text-xs font-bold flex items-center gap-1.5 shadow-sm transition-colors cursor-pointer self-start sm:self-auto"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Download Recovery CSV</span>
            </button>
          </div>

          <div className="bg-white dark:bg-navy-900 border border-slate-200 dark:border-white/10 rounded-2xl overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse min-w-[980px]">
                <thead>
                  <tr className="border-b border-slate-200 dark:border-white/10 text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 bg-slate-50/60 dark:bg-navy-950/60">
                    <th className="py-3.5 px-4">Proof ID &amp; Time</th>
                    <th className="py-3.5 px-4">Source &amp; Reference</th>
                    <th className="py-3.5 px-4">Product &amp; SKU</th>
                    <th className="py-3.5 px-4">Delta Units</th>
                    <th className="py-3.5 px-4">Stock Audit (Before &rarr; After)</th>
                    <th className="py-3.5 px-4">Storage Bin</th>
                    <th className="py-3.5 px-4 text-right">Verification</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-white/5 text-xs sm:text-sm">
                  {filteredRecoveryLedger.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-12 text-center text-slate-400">
                        No reverse stock recovery records found.
                      </td>
                    </tr>
                  ) : (
                    filteredRecoveryLedger.map((m) => (
                      <tr key={m.id} className="hover:bg-slate-50/50 dark:hover:bg-navy-800/40 transition-colors">
                        <td className="py-3.5 px-4">
                          <span className="font-extrabold text-navy-900 dark:text-white block font-mono text-xs">
                            {m.id}
                          </span>
                          <span className="text-[11px] text-slate-400">{m.timestamp}</span>
                        </td>

                        <td className="py-3.5 px-4">
                          <span
                            className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                              m.sourceType === 'ORDER_CANCELLED'
                                ? 'bg-rose-500/10 text-rose-600 dark:text-rose-400'
                                : m.sourceType === 'COURIER_RETURN'
                                ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                                : 'bg-amber-500/10 text-amber-600 dark:text-amber-400'
                            }`}
                          >
                            {m.sourceType === 'ORDER_CANCELLED'
                              ? 'Cancelled Order'
                              : m.sourceType === 'COURIER_RETURN'
                              ? 'Courier Return (RTO)'
                              : 'Damage / Quarantine'}
                          </span>
                          <span className="text-xs font-mono text-slate-500 block mt-0.5">
                            Ref: {m.referenceId}
                          </span>
                        </td>

                        <td className="py-3.5 px-4">
                          <span className="font-bold text-navy-900 dark:text-white block line-clamp-1">
                            {m.productTitle}
                          </span>
                          <span className="text-xs font-mono text-slate-500 block mt-0.5">
                            {m.sku}
                          </span>
                        </td>

                        <td className="py-3.5 px-4">
                          <span
                            className={`font-extrabold text-sm ${
                              m.deltaQty > 0
                                ? 'text-emerald-600 dark:text-emerald-400'
                                : 'text-slate-500'
                            }`}
                          >
                            {m.deltaQty > 0 ? `+${m.deltaQty}` : '0'} pcs
                          </span>
                        </td>

                        <td className="py-3.5 px-4">
                          <div className="flex items-center gap-1.5 font-mono text-xs">
                            <span className="text-slate-400 line-through">{m.previousStock}</span>
                            <span className="text-slate-400">&rarr;</span>
                            <span className="font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded">
                              {m.newStock} units
                            </span>
                          </div>
                        </td>

                        <td className="py-3.5 px-4">
                          <div className="flex items-center gap-1 font-mono text-xs font-bold text-navy-900 dark:text-white">
                            <MapPin className="w-3.5 h-3.5 text-orange-500" />
                            <span>{m.binCode}</span>
                          </div>
                        </td>

                        <td className="py-3.5 px-4 text-right">
                          <button
                            type="button"
                            onClick={() => setReceiptRecord(m)}
                            className="px-2.5 py-1.5 rounded-lg bg-slate-100 dark:bg-navy-800 hover:bg-slate-200 dark:hover:bg-navy-700 text-xs font-semibold text-navy-900 dark:text-white inline-flex items-center gap-1 transition-colors cursor-pointer"
                          >
                            <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
                            <span>Proof</span>
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB: INITIAL PRODUCT STOCK INTAKE (প্রাথমিক ক্যাটালগ ও ইনওয়ার্ড চালান স্টক হিসাব) */}
      {activeTab === 'INITIAL_INTAKE' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-1">
            <div>
              <h3 className="text-sm font-bold text-navy-900 dark:text-white flex items-center gap-2">
                <Boxes className="w-4 h-4 text-indigo-500" />
                <span>Initial Product Stock Intake Ledger (প্রাথমিক স্টক হিসাব)</span>
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Immutable audit trail of initial catalog stock intake and warehouse inward receiving challans (CHL-...)
              </p>
            </div>
            <button
              type="button"
              onClick={() => handleExportCsv('INITIAL')}
              className="px-3.5 py-1.5 rounded-xl bg-orange-600 hover:bg-orange-700 text-white text-xs font-bold flex items-center gap-1.5 shadow-sm transition-colors cursor-pointer self-start sm:self-auto"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Download Intake CSV</span>
            </button>
          </div>

          <div className="bg-white dark:bg-navy-900 border border-slate-200 dark:border-white/10 rounded-2xl overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse min-w-[980px]">
                <thead>
                  <tr className="border-b border-slate-200 dark:border-white/10 text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 bg-slate-50/60 dark:bg-navy-950/60">
                    <th className="py-3.5 px-4">Proof ID &amp; Time</th>
                    <th className="py-3.5 px-4">Source &amp; Inward Challan</th>
                    <th className="py-3.5 px-4">Product &amp; SKU</th>
                    <th className="py-3.5 px-4">Intake Units</th>
                    <th className="py-3.5 px-4">Stock Audit (Before &rarr; After)</th>
                    <th className="py-3.5 px-4">Storage Bin</th>
                    <th className="py-3.5 px-4 text-right">Verification</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-white/5 text-xs sm:text-sm">
                  {filteredInitialIntake.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-12 text-center text-slate-400">
                        No initial stock intake records found.
                      </td>
                    </tr>
                  ) : (
                    filteredInitialIntake.map((m) => (
                      <tr key={m.id} className="hover:bg-slate-50/50 dark:hover:bg-navy-800/40 transition-colors">
                        <td className="py-3.5 px-4">
                          <span className="font-extrabold text-navy-900 dark:text-white block font-mono text-xs">
                            {m.id}
                          </span>
                          <span className="text-[11px] text-slate-400">{m.timestamp}</span>
                        </td>

                        <td className="py-3.5 px-4">
                          <span className="inline-block px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-sky-500/10 text-sky-600 dark:text-sky-400 border border-sky-500/20">
                            Initial Stock Intake
                          </span>
                          <span className="text-xs font-mono text-slate-500 block mt-0.5">
                            Challan: {m.referenceId}
                          </span>
                        </td>

                        <td className="py-3.5 px-4">
                          <span className="font-bold text-navy-900 dark:text-white block line-clamp-1">
                            {m.productTitle}
                          </span>
                          <span className="text-xs font-mono text-slate-500 block mt-0.5">
                            {m.sku}
                          </span>
                        </td>

                        <td className="py-3.5 px-4">
                          <span className="font-extrabold text-sm text-emerald-600 dark:text-emerald-400">
                            +{m.deltaQty} pcs
                          </span>
                        </td>

                        <td className="py-3.5 px-4">
                          <div className="flex items-center gap-1.5 font-mono text-xs">
                            <span className="text-slate-400 line-through">{m.previousStock}</span>
                            <span className="text-slate-400">&rarr;</span>
                            <span className="font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded">
                              {m.newStock} units
                            </span>
                          </div>
                        </td>

                        <td className="py-3.5 px-4">
                          <div className="flex items-center gap-1 font-mono text-xs font-bold text-navy-900 dark:text-white">
                            <MapPin className="w-3.5 h-3.5 text-orange-500" />
                            <span>{m.binCode}</span>
                          </div>
                        </td>

                        <td className="py-3.5 px-4 text-right">
                          <button
                            type="button"
                            onClick={() => setReceiptRecord(m)}
                            className="px-2.5 py-1.5 rounded-lg bg-slate-100 dark:bg-navy-800 hover:bg-slate-200 dark:hover:bg-navy-700 text-xs font-semibold text-navy-900 dark:text-white inline-flex items-center gap-1 transition-colors cursor-pointer"
                          >
                            <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
                            <span>Proof</span>
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* 6. Proof Receipt Verification Modal */}
      {receiptRecord && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-navy-950/80 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white dark:bg-navy-900 border border-slate-200 dark:border-white/10 rounded-3xl p-6 max-w-lg w-full space-y-5 shadow-2xl relative">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-white/10">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-6 h-6 text-emerald-500" />
                <h3 className="font-bold text-base text-navy-900 dark:text-white">
                  Stock Recovery Digital Proof
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setReceiptRecord(null)}
                className="text-slate-400 hover:text-navy-900 dark:hover:text-white p-1 rounded-lg cursor-pointer"
              >
                &times;
              </button>
            </div>

            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-navy-950 border border-slate-200 dark:border-white/5 space-y-3 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-500">Proof Hash:</span>
                <span className="font-mono font-bold text-orange-600 dark:text-orange-400 break-all text-right">
                  {receiptRecord.digitalProofHash}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Record ID:</span>
                <span className="font-mono font-bold text-navy-900 dark:text-white">
                  {receiptRecord.id}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Timestamp:</span>
                <span className="text-navy-900 dark:text-white font-medium">
                  {receiptRecord.timestamp}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Source:</span>
                <span className="font-bold text-navy-900 dark:text-white">
                  {receiptRecord.sourceType === 'INITIAL_INTAKE'
                    ? 'Initial Stock Intake'
                    : receiptRecord.sourceType === 'ORDER_CANCELLED'
                    ? 'Cancelled Order'
                    : receiptRecord.sourceType === 'COURIER_RETURN'
                    ? 'Courier Return (RTO)'
                    : 'Damage / Quarantine'}{' '}
                  ({receiptRecord.referenceId})
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Product SKU:</span>
                <span className="font-mono font-bold text-navy-900 dark:text-white">
                  {receiptRecord.sku}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Delta Stock:</span>
                <span className="font-bold text-emerald-600 dark:text-emerald-400">
                  +{receiptRecord.deltaQty} units
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Stock Adjustment:</span>
                <span className="font-mono font-bold text-navy-900 dark:text-white">
                  {receiptRecord.previousStock} &rarr; {receiptRecord.newStock} units
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Warehouse Storage Bin:</span>
                <span className="font-mono font-bold text-orange-600 dark:text-orange-400">
                  {receiptRecord.binCode}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">QC Inspector:</span>
                <span className="text-navy-900 dark:text-white font-medium">
                  {receiptRecord.operator}
                </span>
              </div>
              {receiptRecord.notes && (
                <div className="pt-2 border-t border-slate-200 dark:border-white/10 text-slate-500 italic">
                  Note: {receiptRecord.notes}
                </div>
              )}
            </div>

            <button
              type="button"
              onClick={() => setReceiptRecord(null)}
              className="w-full py-2.5 rounded-xl bg-orange-600 hover:bg-orange-700 text-white font-bold text-xs transition-colors cursor-pointer"
            >
              Close Receipt
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default MerchantReturnsTab;
