'use client';

import React, { useState, useMemo } from 'react';
import {
  FileText,
  Search,
  Filter,
  ArrowUpRight,
  ArrowDownLeft,
  Boxes,
  MapPin,
  Calendar,
  RotateCcw,
  ShieldCheck,
  CheckCircle2,
  Printer,
  Eye,
  Hash,
} from 'lucide-react';
import { StockMovementRecord, WarehouseProductItem } from '../../types';
import { MERCHANTS } from '../../mockData';
import { StockMovementReceiptModal } from '../modals/StockMovementReceiptModal';

interface WarehouseStockLedgerTabProps {
  stockMovements: StockMovementRecord[];
  products: WarehouseProductItem[];
}

export function WarehouseStockLedgerTab({
  stockMovements,
  products,
}: WarehouseStockLedgerTabProps) {
  const [search, setSearch] = useState('');
  const [selectedMerchant, setSelectedMerchant] = useState('ALL');
  const [selectedType, setSelectedType] = useState<'ALL' | 'INITIAL_INTAKE' | 'RESTOCK' | 'WITHDRAWAL' | 'AUDIT_ADJUSTMENT'>('ALL');
  const [quickTab, setQuickTab] = useState<'ALL' | 'RESTOCK' | 'WITHDRAWAL' | 'INITIAL_INTAKE' | 'AUDIT_ADJUSTMENT'>('ALL');
  const [receiptRecord, setReceiptRecord] = useState<StockMovementRecord | null>(null);

  // Quick Tab Counts
  const counts = useMemo(() => {
    return {
      all: stockMovements.length,
      restock: stockMovements.filter((m) => m.type === 'RESTOCK').length,
      withdrawal: stockMovements.filter((m) => m.type === 'WITHDRAWAL').length,
      initial: stockMovements.filter((m) => m.type === 'INITIAL_INTAKE').length,
      audit: stockMovements.filter((m) => m.type === 'AUDIT_ADJUSTMENT').length,
    };
  }, [stockMovements]);

  // Overall Stat Metrics
  const metrics = useMemo(() => {
    let totalInbound = 0;
    let totalOutbound = 0;
    stockMovements.forEach((m) => {
      if (m.deltaQty > 0) totalInbound += m.deltaQty;
      else totalOutbound += Math.abs(m.deltaQty);
    });
    return {
      totalMovements: stockMovements.length,
      totalInbound,
      totalOutbound,
      netDelta: totalInbound - totalOutbound,
    };
  }, [stockMovements]);

  // Has active filters
  const isFiltered = Boolean(
    search.trim() ||
    selectedMerchant !== 'ALL' ||
    selectedType !== 'ALL' ||
    quickTab !== 'ALL'
  );

  const handleResetFilters = () => {
    setSearch('');
    setSelectedMerchant('ALL');
    setSelectedType('ALL');
    setQuickTab('ALL');
  };

  // Filtered Movements
  const filteredMovements = useMemo(() => {
    return stockMovements.filter((m) => {
      // Quick Tab
      if (quickTab !== 'ALL' && m.type !== quickTab) return false;

      // Select Dropdown Type
      if (selectedType !== 'ALL' && m.type !== selectedType) return false;

      // Merchant
      if (selectedMerchant !== 'ALL' && m.merchantCode !== selectedMerchant) return false;

      // Search Query
      if (search.trim()) {
        const q = search.toLowerCase().trim();
        const matches =
          m.id.toLowerCase().includes(q) ||
          m.sku.toLowerCase().includes(q) ||
          m.productTitle.toLowerCase().includes(q) ||
          m.merchantName.toLowerCase().includes(q) ||
          m.merchantCode.toLowerCase().includes(q) ||
          m.referenceNumber.toLowerCase().includes(q) ||
          m.digitalProofHash.toLowerCase().includes(q) ||
          (m.carrierOrCourier && m.carrierOrCourier.toLowerCase().includes(q));
        if (!matches) return false;
      }

      return true;
    });
  }, [stockMovements, quickTab, selectedType, selectedMerchant, search]);

  const getProductImage = (sku: string) => {
    const prod = products.find((p) => p.fullSku === sku || p.shortSku === sku);
    return prod?.imageUrl;
  };

  return (
    <div className="space-y-4">
      {/* Top Banner / Explanation */}
      <div className="bg-white dark:bg-navy-900 border border-slate-200 dark:border-white/10 rounded-2xl p-5 shadow-md flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-orange-600 dark:text-orange-400" />
            <h2 className="text-base sm:text-lg font-bold text-navy-900 dark:text-white">
              Stock Movement Ledger &amp; Digital Proof Registry
            </h2>
          </div>
          <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 mt-1">
            Permanent tamper-evident audit trail of all warehouse inward restocks, outward merchant withdrawals, initial product slotting, and physical cycle adjustments.
          </p>
        </div>

        <div className="flex items-center gap-2 self-start md:self-auto shrink-0">
          <span className="px-3 py-1.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-700 dark:text-emerald-300 text-xs font-bold flex items-center gap-1.5">
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>Audited &amp; Synchronized</span>
          </span>
        </div>
      </div>

      {/* 4 Summary Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-navy-900 border border-slate-200 dark:border-white/10 rounded-2xl p-4 shadow-sm">
          <div className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
            Total Proof Events
          </div>
          <div className="text-2xl font-black text-navy-900 dark:text-white mt-1 tabular-nums">
            {metrics.totalMovements}
          </div>
          <div className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Lifetime recorded movements
          </div>
        </div>

        <div className="bg-white dark:bg-navy-900 border border-slate-200 dark:border-white/10 rounded-2xl p-4 shadow-sm">
          <div className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider flex items-center gap-1">
            <ArrowUpRight className="w-3.5 h-3.5" />
            <span>Total Inbound Units</span>
          </div>
          <div className="text-2xl font-black text-emerald-600 dark:text-emerald-400 mt-1 tabular-nums">
            +{metrics.totalInbound.toLocaleString()} <span className="text-xs font-normal text-slate-400">pcs</span>
          </div>
          <div className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Restocks &amp; initial catalog intakes
          </div>
        </div>

        <div className="bg-white dark:bg-navy-900 border border-slate-200 dark:border-white/10 rounded-2xl p-4 shadow-sm">
          <div className="text-xs font-semibold text-rose-600 dark:text-rose-400 uppercase tracking-wider flex items-center gap-1">
            <ArrowDownLeft className="w-3.5 h-3.5" />
            <span>Total Withdrawn Units</span>
          </div>
          <div className="text-2xl font-black text-rose-600 dark:text-rose-400 mt-1 tabular-nums">
            -{metrics.totalOutbound.toLocaleString()} <span className="text-xs font-normal text-slate-400">pcs</span>
          </div>
          <div className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Recalled by merchants or gate pass
          </div>
        </div>

        <div className="bg-white dark:bg-navy-900 border border-slate-200 dark:border-white/10 rounded-2xl p-4 shadow-sm">
          <div className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
            Net On-Hand Movement
          </div>
          <div className="text-2xl font-black text-navy-900 dark:text-white mt-1 tabular-nums">
            {metrics.netDelta >= 0 ? `+${metrics.netDelta.toLocaleString()}` : metrics.netDelta.toLocaleString()}{' '}
            <span className="text-xs font-normal text-slate-400">pcs</span>
          </div>
          <div className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Net active inventory delta
          </div>
        </div>
      </div>

      {/* Filter Bar (2 Rows) */}
      <div className="bg-white dark:bg-navy-900 border border-slate-200 dark:border-white/10 rounded-2xl p-4 shadow-md space-y-3">
        {/* Row 1: Search & Dropdowns */}
        <div className="flex flex-col md:flex-row items-stretch md:items-center gap-3">
          {/* Search Input */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by Proof ID, SKU, Product Title, Ref #, Courier..."
              className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-navy-950 text-navy-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all"
            />
          </div>

          {/* Merchant Filter */}
          <select
            value={selectedMerchant}
            onChange={(e) => setSelectedMerchant(e.target.value)}
            className="px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-navy-950 text-navy-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 cursor-pointer"
          >
            <option value="ALL">All Merchants</option>
            {MERCHANTS.map((m) => (
              <option key={m.code} value={m.code}>
                {m.code} · {m.name}
              </option>
            ))}
          </select>

          {/* Type Filter */}
          <select
            value={selectedType}
            onChange={(e) => setSelectedType(e.target.value as any)}
            className="px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-navy-950 text-navy-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 cursor-pointer"
          >
            <option value="ALL">All Movement Types</option>
            <option value="RESTOCK">Inbound Restocks</option>
            <option value="WITHDRAWAL">Stock Withdrawals</option>
            <option value="INITIAL_INTAKE">Initial Catalog Intakes</option>
            <option value="AUDIT_ADJUSTMENT">Audit Adjustments</option>
          </select>

          {/* Conditional Reset Button */}
          {isFiltered && (
            <button
              type="button"
              onClick={handleResetFilters}
              className="px-3 py-2 text-xs font-semibold rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-navy-800 dark:hover:bg-navy-700 text-slate-700 dark:text-slate-200 flex items-center gap-1.5 transition-all cursor-pointer shrink-0"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset</span>
            </button>
          )}
        </div>

        {/* Row 2: WordPress-Style Filter Tabs */}
        <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-100 dark:border-white/5">
          <button
            type="button"
            onClick={() => setQuickTab('ALL')}
            className={`px-3 py-1 text-xs font-medium rounded-lg transition-all cursor-pointer ${
              quickTab === 'ALL'
                ? 'bg-orange-500/10 text-orange-600 dark:text-orange-400 font-bold border border-orange-500/30'
                : 'text-slate-600 dark:text-slate-300 hover:text-navy-900 dark:hover:text-white hover:bg-slate-100/50 dark:hover:bg-navy-800/50'
            }`}
          >
            All Movements <span className="tabular-nums font-semibold">({counts.all})</span>
          </button>

          <span className="text-slate-300 dark:text-slate-700">|</span>

          <button
            type="button"
            onClick={() => setQuickTab('RESTOCK')}
            className={`px-3 py-1 text-xs font-medium rounded-lg transition-all cursor-pointer ${
              quickTab === 'RESTOCK'
                ? 'bg-orange-500/10 text-orange-600 dark:text-orange-400 font-bold border border-orange-500/30'
                : 'text-slate-600 dark:text-slate-300 hover:text-navy-900 dark:hover:text-white hover:bg-slate-100/50 dark:hover:bg-navy-800/50'
            }`}
          >
            Inbound Restocks <span className="tabular-nums font-semibold">({counts.restock})</span>
          </button>

          <span className="text-slate-300 dark:text-slate-700">|</span>

          <button
            type="button"
            onClick={() => setQuickTab('WITHDRAWAL')}
            className={`px-3 py-1 text-xs font-medium rounded-lg transition-all cursor-pointer ${
              quickTab === 'WITHDRAWAL'
                ? 'bg-orange-500/10 text-orange-600 dark:text-orange-400 font-bold border border-orange-500/30'
                : 'text-slate-600 dark:text-slate-300 hover:text-navy-900 dark:hover:text-white hover:bg-slate-100/50 dark:hover:bg-navy-800/50'
            }`}
          >
            Stock Withdrawals <span className="tabular-nums font-semibold">({counts.withdrawal})</span>
          </button>

          <span className="text-slate-300 dark:text-slate-700">|</span>

          <button
            type="button"
            onClick={() => setQuickTab('INITIAL_INTAKE')}
            className={`px-3 py-1 text-xs font-medium rounded-lg transition-all cursor-pointer ${
              quickTab === 'INITIAL_INTAKE'
                ? 'bg-orange-500/10 text-orange-600 dark:text-orange-400 font-bold border border-orange-500/30'
                : 'text-slate-600 dark:text-slate-300 hover:text-navy-900 dark:hover:text-white hover:bg-slate-100/50 dark:hover:bg-navy-800/50'
            }`}
          >
            Initial Intakes <span className="tabular-nums font-semibold">({counts.initial})</span>
          </button>

          <span className="text-slate-300 dark:text-slate-700">|</span>

          <button
            type="button"
            onClick={() => setQuickTab('AUDIT_ADJUSTMENT')}
            className={`px-3 py-1 text-xs font-medium rounded-lg transition-all cursor-pointer ${
              quickTab === 'AUDIT_ADJUSTMENT'
                ? 'bg-orange-500/10 text-orange-600 dark:text-orange-400 font-bold border border-orange-500/30'
                : 'text-slate-600 dark:text-slate-300 hover:text-navy-900 dark:hover:text-white hover:bg-slate-100/50 dark:hover:bg-navy-800/50'
            }`}
          >
            Audit Adjustments <span className="tabular-nums font-semibold">({counts.audit})</span>
          </button>
        </div>
      </div>

      {/* Movements Table */}
      <div className="bg-white dark:bg-navy-900 border border-slate-200 dark:border-white/10 rounded-2xl shadow-md overflow-hidden">
        {filteredMovements.length === 0 ? (
          <div className="p-12 text-center space-y-3">
            <FileText className="w-10 h-10 text-slate-400 mx-auto" />
            <div className="text-base font-bold text-navy-900 dark:text-white">
              No Stock Movement Records Found
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto">
              No audit transactions match your search filters or selected parameters.
            </p>
            {isFiltered && (
              <button
                type="button"
                onClick={handleResetFilters}
                className="px-4 py-2 text-xs font-semibold rounded-xl bg-orange-600 hover:bg-orange-700 text-white transition-all cursor-pointer inline-flex items-center gap-1.5"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Reset All Filters</span>
              </button>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-200 dark:border-white/10 bg-slate-50/80 dark:bg-navy-950/80 text-slate-600 dark:text-slate-300 font-bold uppercase tracking-wider">
                  <th className="py-3 px-4">Proof ID</th>
                  <th className="py-3 px-4">Date &amp; Time</th>
                  <th className="py-3 px-4">Movement Type</th>
                  <th className="py-3 px-4">Merchant</th>
                  <th className="py-3 px-4">Product &amp; SKU</th>
                  <th className="py-3 px-4 text-center">Delta Qty</th>
                  <th className="py-3 px-4 text-center">Stock Transition</th>
                  <th className="py-3 px-4">Storage Bin</th>
                  <th className="py-3 px-4">Reference / Carrier</th>
                  <th className="py-3 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-white/5">
                {filteredMovements.map((item) => {
                  const isPositive = item.deltaQty > 0;
                  const thumb = getProductImage(item.sku);

                  return (
                    <tr
                      key={item.id}
                      className="hover:bg-slate-50/70 dark:hover:bg-navy-950/50 transition-colors"
                    >
                      {/* Proof ID */}
                      <td className="py-3.5 px-4 font-mono font-bold text-orange-600 dark:text-orange-400 whitespace-nowrap">
                        <button
                          type="button"
                          onClick={() => setReceiptRecord(item)}
                          className="hover:underline cursor-pointer flex items-center gap-1"
                          title="Click to view digital proof slip"
                        >
                          <Hash className="w-3 h-3 text-slate-400" />
                          <span>{item.id}</span>
                        </button>
                      </td>

                      {/* Timestamp */}
                      <td className="py-3.5 px-4 text-slate-600 dark:text-slate-300 whitespace-nowrap">
                        {item.timestamp}
                      </td>

                      {/* Movement Type */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        {item.type === 'INITIAL_INTAKE' && (
                          <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-500/10 text-blue-700 dark:text-blue-300 border border-blue-500/20">
                            Initial Intake
                          </span>
                        )}
                        {item.type === 'RESTOCK' && (
                          <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border border-emerald-500/20">
                            Inbound Restock
                          </span>
                        )}
                        {item.type === 'WITHDRAWAL' && (
                          <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-rose-500/10 text-rose-700 dark:text-rose-300 border border-rose-500/20">
                            Stock Recall
                          </span>
                        )}
                        {item.type === 'AUDIT_ADJUSTMENT' && (
                          <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-purple-500/10 text-purple-700 dark:text-purple-300 border border-purple-500/20">
                            Audit Adjust
                          </span>
                        )}
                      </td>

                      {/* Merchant */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <div className="font-semibold text-navy-900 dark:text-white">
                          {item.merchantName}
                        </div>
                        <div className="font-mono text-xs text-slate-500 dark:text-slate-400">
                          {item.merchantCode}
                        </div>
                      </td>

                      {/* Product */}
                      <td className="py-3.5 px-4 min-w-[200px]">
                        <div className="flex items-center gap-2.5">
                          {thumb ? (
                            <img
                              src={thumb}
                              alt={item.productTitle}
                              className="w-8 h-8 rounded-lg object-cover border border-slate-200 dark:border-white/10 shrink-0"
                            />
                          ) : (
                            <div className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-navy-950 flex items-center justify-center shrink-0">
                              <Boxes className="w-4 h-4 text-slate-400" />
                            </div>
                          )}
                          <div className="min-w-0">
                            <div className="font-semibold text-navy-900 dark:text-white truncate">
                              {item.productTitle}
                            </div>
                            <div className="font-mono text-xs text-orange-600 dark:text-orange-400 truncate">
                              {item.sku}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Delta Qty */}
                      <td className="py-3.5 px-4 text-center whitespace-nowrap">
                        <span
                          className={`inline-block font-mono font-bold text-xs px-2.5 py-1 rounded-lg tabular-nums ${
                            isPositive
                              ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border border-emerald-500/20'
                              : 'bg-rose-500/10 text-rose-700 dark:text-rose-300 border border-rose-500/20'
                          }`}
                        >
                          {isPositive ? `+${item.deltaQty}` : item.deltaQty} pcs
                        </span>
                      </td>

                      {/* Stock Transition */}
                      <td className="py-3.5 px-4 text-center font-mono text-xs text-slate-600 dark:text-slate-300 whitespace-nowrap">
                        <span className="text-slate-400">{item.previousStock}</span>
                        <span className="mx-1.5 text-slate-400">→</span>
                        <strong className="text-navy-900 dark:text-white font-bold">{item.newStock} pcs</strong>
                      </td>

                      {/* Storage Bin */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <span className="px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-navy-950 border border-slate-200 dark:border-white/10 text-slate-700 dark:text-slate-300 font-mono font-bold">
                          📍 {item.binCode}
                        </span>
                      </td>

                      {/* Ref & Carrier */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <div className="font-mono font-bold text-navy-900 dark:text-white">
                          {item.referenceNumber}
                        </div>
                        <div className="text-xs text-slate-500 dark:text-slate-400 truncate max-w-[160px]">
                          {item.carrierOrCourier || 'Self-Transport'}
                        </div>
                      </td>

                      {/* Action */}
                      <td className="py-3.5 px-4 text-right whitespace-nowrap">
                        <button
                          type="button"
                          onClick={() => setReceiptRecord(item)}
                          className="px-3 py-1.5 rounded-xl bg-orange-600 hover:bg-orange-700 text-white font-semibold text-xs inline-flex items-center gap-1.5 shadow-sm transition-all cursor-pointer"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>View Proof Slip</span>
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

      {/* Proof Receipt Modal */}
      <StockMovementReceiptModal
        isOpen={Boolean(receiptRecord)}
        onClose={() => setReceiptRecord(null)}
        record={receiptRecord}
      />
    </div>
  );
}
