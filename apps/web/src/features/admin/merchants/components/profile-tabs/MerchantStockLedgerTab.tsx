'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import {
  ShieldCheck,
  Search,
  ExternalLink,
  ArrowUpRight,
  ArrowDownLeft,
  Boxes,
  Eye,
  Hash,
  RotateCcw,
  FileText,
  Clock,
  Printer,
} from 'lucide-react';
import { MerchantRecord } from '../../types';
import {
  StockMovementRecord,
  STORAGE_KEY_STOCK_LEDGER,
  INITIAL_STOCK_MOVEMENTS,
} from '@/features/admin/products';
import { StockMovementReceiptModal } from '@/features/admin/products/components/modals/StockMovementReceiptModal';

interface MerchantStockLedgerTabProps {
  merchant: MerchantRecord;
}

export function MerchantStockLedgerTab({ merchant }: MerchantStockLedgerTabProps) {
  const [movements, setMovements] = useState<StockMovementRecord[]>([]);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState<'ALL' | 'RESTOCK' | 'WITHDRAWAL' | 'INITIAL_INTAKE' | 'AUDIT_ADJUSTMENT'>('ALL');
  const [receiptRecord, setReceiptRecord] = useState<StockMovementRecord | null>(null);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY_STOCK_LEDGER);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setMovements(parsed);
          return;
        }
      }
    } catch {}
    setMovements(INITIAL_STOCK_MOVEMENTS);
  }, []);

  // Filter strictly to this merchant
  const merchantMovements = useMemo(() => {
    return movements.filter((m) => m.merchantCode === merchant.merchantCode);
  }, [movements, merchant.merchantCode]);

  // Summary Metrics
  const stats = useMemo(() => {
    let inbound = 0;
    let withdrawn = 0;
    merchantMovements.forEach((m) => {
      if (m.deltaQty > 0) inbound += m.deltaQty;
      else withdrawn += Math.abs(m.deltaQty);
    });
    return {
      totalSlips: merchantMovements.length,
      inbound,
      withdrawn,
      netStockDelta: inbound - withdrawn,
    };
  }, [merchantMovements]);

  // Filtered List
  const filtered = useMemo(() => {
    return merchantMovements.filter((m) => {
      if (typeFilter !== 'ALL' && m.type !== typeFilter) return false;
      if (search.trim()) {
        const q = search.toLowerCase().trim();
        const matches =
          m.id.toLowerCase().includes(q) ||
          m.sku.toLowerCase().includes(q) ||
          m.productTitle.toLowerCase().includes(q) ||
          m.referenceNumber.toLowerCase().includes(q) ||
          m.digitalProofHash.toLowerCase().includes(q) ||
          (m.carrierOrCourier && m.carrierOrCourier.toLowerCase().includes(q));
        if (!matches) return false;
      }
      return true;
    });
  }, [merchantMovements, typeFilter, search]);

  const hasFilter = Boolean(search.trim() || typeFilter !== 'ALL');

  return (
    <div className="space-y-4">
      {/* Top Banner & Quick Action */}
      <div className="p-4 rounded-2xl bg-white dark:bg-navy-900 border border-slate-200 dark:border-white/10 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="space-y-0.5">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-orange-600 dark:text-orange-400" />
            <h3 className="text-sm font-bold text-navy-900 dark:text-white">
              Permanent Stock Movement &amp; Digital Proof Ledger
            </h3>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Cryptographic ledger tracking every unit intake, warehouse restock, and physical return for {merchant.storeName}.
          </p>
        </div>

        <Link
          href={`/admin/products?tab=ledger`}
          className="px-3.5 py-2 rounded-xl bg-orange-500/10 hover:bg-orange-500/20 text-orange-600 dark:text-orange-400 text-xs font-bold flex items-center gap-1.5 transition-all self-start sm:self-auto border border-orange-500/30"
        >
          <span>Open Master Ledger</span>
          <ExternalLink className="w-3.5 h-3.5" />
        </Link>
      </div>

      {/* 4 Quick Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="p-3.5 rounded-xl bg-white dark:bg-navy-900 border border-slate-200 dark:border-white/10">
          <div className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase">
            Proof Slips
          </div>
          <div className="text-xl font-black text-navy-900 dark:text-white mt-1 tabular-nums">
            {stats.totalSlips}
          </div>
        </div>

        <div className="p-3.5 rounded-xl bg-white dark:bg-navy-900 border border-slate-200 dark:border-white/10">
          <div className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 uppercase flex items-center gap-1">
            <ArrowUpRight className="w-3.5 h-3.5" />
            <span>Lifetime Inbound</span>
          </div>
          <div className="text-xl font-black text-emerald-600 dark:text-emerald-400 mt-1 tabular-nums">
            +{stats.inbound} <span className="text-xs font-normal text-slate-400">pcs</span>
          </div>
        </div>

        <div className="p-3.5 rounded-xl bg-white dark:bg-navy-900 border border-slate-200 dark:border-white/10">
          <div className="text-xs font-semibold text-rose-600 dark:text-rose-400 uppercase flex items-center gap-1">
            <ArrowDownLeft className="w-3.5 h-3.5" />
            <span>Lifetime Withdrawn</span>
          </div>
          <div className="text-xl font-black text-rose-600 dark:text-rose-400 mt-1 tabular-nums">
            -{stats.withdrawn} <span className="text-xs font-normal text-slate-400">pcs</span>
          </div>
        </div>

        <div className="p-3.5 rounded-xl bg-white dark:bg-navy-900 border border-slate-200 dark:border-white/10">
          <div className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase">
            Net Historical Delta
          </div>
          <div className="text-xl font-black text-navy-900 dark:text-white mt-1 tabular-nums">
            {stats.netStockDelta >= 0 ? `+${stats.netStockDelta}` : stats.netStockDelta}{' '}
            <span className="text-xs font-normal text-slate-400">pcs</span>
          </div>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="p-3 rounded-xl bg-white dark:bg-navy-900 border border-slate-200 dark:border-white/10 flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
        <div className="relative flex-1">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search proof slips by SKU, Ref #, Product..."
            className="w-full pl-8 pr-3 py-1.5 text-xs rounded-lg border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-navy-950 text-navy-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-orange-500"
          />
        </div>

        <select
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value as any)}
          className="px-3 py-1.5 text-xs rounded-lg border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-navy-950 text-navy-900 dark:text-white focus:outline-none focus:border-orange-500 cursor-pointer"
        >
          <option value="ALL">All Event Types</option>
          <option value="RESTOCK">Inbound Restocks</option>
          <option value="WITHDRAWAL">Stock Withdrawals</option>
          <option value="INITIAL_INTAKE">Initial Catalog Intakes</option>
          <option value="AUDIT_ADJUSTMENT">Audit Adjustments</option>
        </select>

        {hasFilter && (
          <button
            type="button"
            onClick={() => {
              setSearch('');
              setTypeFilter('ALL');
            }}
            className="px-2.5 py-1.5 text-xs font-semibold rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-navy-800 dark:hover:bg-navy-700 text-slate-700 dark:text-slate-200 flex items-center gap-1 cursor-pointer shrink-0"
          >
            <RotateCcw className="w-3 h-3" />
            <span>Reset</span>
          </button>
        )}
      </div>

      {/* Movements Table */}
      <div className="rounded-2xl border border-slate-200 dark:border-white/10 bg-white dark:bg-navy-900 overflow-hidden shadow-sm">
        {filtered.length === 0 ? (
          <div className="p-8 text-center space-y-2">
            <FileText className="w-8 h-8 text-slate-400 mx-auto" />
            <div className="text-sm font-bold text-navy-900 dark:text-white">
              No Movement Proof Records
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              No audit slips found matching your filters for this merchant.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto max-h-[480px]">
            <table className="w-full text-left border-collapse text-xs">
              <thead className="sticky top-0 bg-slate-50 dark:bg-navy-950 border-b border-slate-200 dark:border-white/10 text-slate-600 dark:text-slate-300 uppercase tracking-wider font-bold z-10">
                <tr>
                  <th className="py-2.5 px-3">Proof ID</th>
                  <th className="py-2.5 px-3">Date &amp; Time</th>
                  <th className="py-2.5 px-3">Type</th>
                  <th className="py-2.5 px-3">Product &amp; SKU</th>
                  <th className="py-2.5 px-3 text-center">Delta</th>
                  <th className="py-2.5 px-3 text-center">Stock Transition</th>
                  <th className="py-2.5 px-3">Bin</th>
                  <th className="py-2.5 px-3">Reference / Carrier</th>
                  <th className="py-2.5 px-3 text-right">Proof Slip</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-white/5">
                {filtered.map((item) => {
                  const isPositive = item.deltaQty > 0;
                  return (
                    <tr
                      key={item.id}
                      className="hover:bg-slate-50/70 dark:hover:bg-navy-950/50 transition-colors"
                    >
                      <td className="py-2.5 px-3 font-mono font-bold text-orange-600 dark:text-orange-400 whitespace-nowrap">
                        <button
                          type="button"
                          onClick={() => setReceiptRecord(item)}
                          className="hover:underline cursor-pointer flex items-center gap-1"
                        >
                          <Hash className="w-3 h-3 text-slate-400" />
                          <span>{item.id}</span>
                        </button>
                      </td>

                      <td className="py-2.5 px-3 text-slate-600 dark:text-slate-300 whitespace-nowrap">
                        {item.timestamp}
                      </td>

                      <td className="py-2.5 px-3 whitespace-nowrap">
                        {item.type === 'INITIAL_INTAKE' && (
                          <span className="px-2 py-0.5 rounded-full text-2xs font-bold bg-blue-500/10 text-blue-700 dark:text-blue-300 border border-blue-500/20">
                            Intake
                          </span>
                        )}
                        {item.type === 'RESTOCK' && (
                          <span className="px-2 py-0.5 rounded-full text-2xs font-bold bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border border-emerald-500/20">
                            Restock
                          </span>
                        )}
                        {item.type === 'WITHDRAWAL' && (
                          <span className="px-2 py-0.5 rounded-full text-2xs font-bold bg-rose-500/10 text-rose-700 dark:text-rose-300 border border-rose-500/20">
                            Recall
                          </span>
                        )}
                        {item.type === 'AUDIT_ADJUSTMENT' && (
                          <span className="px-2 py-0.5 rounded-full text-2xs font-bold bg-purple-500/10 text-purple-700 dark:text-purple-300 border border-purple-500/20">
                            Audit
                          </span>
                        )}
                      </td>

                      <td className="py-2.5 px-3 max-w-[200px]">
                        <div className="font-semibold text-navy-900 dark:text-white truncate">
                          {item.productTitle}
                        </div>
                        <div className="font-mono text-2xs text-orange-600 dark:text-orange-400 truncate">
                          {item.sku}
                        </div>
                      </td>

                      <td className="py-2.5 px-3 text-center whitespace-nowrap">
                        <span
                          className={`font-mono font-bold text-xs px-2 py-0.5 rounded ${
                            isPositive
                              ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300'
                              : 'bg-rose-500/10 text-rose-700 dark:text-rose-300'
                          }`}
                        >
                          {isPositive ? `+${item.deltaQty}` : item.deltaQty}
                        </span>
                      </td>

                      <td className="py-2.5 px-3 text-center font-mono text-xs text-slate-500 whitespace-nowrap">
                        {item.previousStock} → <strong className="text-navy-900 dark:text-white font-bold">{item.newStock}</strong>
                      </td>

                      <td className="py-2.5 px-3 whitespace-nowrap font-mono font-semibold text-slate-700 dark:text-slate-300">
                        📍 {item.binCode}
                      </td>

                      <td className="py-2.5 px-3 whitespace-nowrap">
                        <div className="font-mono font-bold text-navy-900 dark:text-white">
                          {item.referenceNumber}
                        </div>
                        <div className="text-2xs text-slate-500 dark:text-slate-400 truncate max-w-[120px]">
                          {item.carrierOrCourier || 'Self-Transport'}
                        </div>
                      </td>

                      <td className="py-2.5 px-3 text-right whitespace-nowrap">
                        <button
                          type="button"
                          onClick={() => setReceiptRecord(item)}
                          className="px-2.5 py-1 rounded-lg bg-orange-600 hover:bg-orange-700 text-white font-semibold text-xs inline-flex items-center gap-1 shadow-sm transition-all cursor-pointer"
                        >
                          <Eye className="w-3 h-3" />
                          <span>View</span>
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Digital Proof Slip Modal */}
      <StockMovementReceiptModal
        isOpen={Boolean(receiptRecord)}
        onClose={() => setReceiptRecord(null)}
        record={receiptRecord}
      />
    </div>
  );
}
