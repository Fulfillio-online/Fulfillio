'use client';

import React, { useState, useMemo } from 'react';
import {
  FileText,
  Search,
  Filter,
  ArrowUpRight,
  Boxes,
  MapPin,
  Calendar,
  RotateCcw,
  ShieldCheck,
  CheckCircle2,
  Printer,
  Download,
  Hash,
  XCircle,
  AlertTriangle,
} from 'lucide-react';
import { RecoveryLedgerEntry } from '../types';

interface ReturnsStockLedgerTabProps {
  ledgerEntries: RecoveryLedgerEntry[];
  merchants: { code: string; name: string }[];
}

export function ReturnsStockLedgerTab({
  ledgerEntries,
  merchants,
}: ReturnsStockLedgerTabProps) {
  const [search, setSearch] = useState('');
  const [selectedMerchant, setSelectedMerchant] = useState('ALL');
  const [selectedSource, setSelectedSource] = useState<'ALL' | 'ORDER_CANCELLED' | 'COURIER_RETURN' | 'DAMAGED_QUARANTINE'>('ALL');
  const [receiptRecord, setReceiptRecord] = useState<RecoveryLedgerEntry | null>(null);

  // Filtered movements
  const filteredLedger = useMemo(() => {
    return ledgerEntries.filter((m) => {
      if (selectedSource !== 'ALL' && m.sourceType !== selectedSource) return false;
      if (selectedMerchant !== 'ALL' && m.merchantCode !== selectedMerchant) return false;

      if (search.trim()) {
        const q = search.toLowerCase().trim();
        const matches =
          m.id.toLowerCase().includes(q) ||
          m.sku.toLowerCase().includes(q) ||
          m.productTitle.toLowerCase().includes(q) ||
          m.referenceId.toLowerCase().includes(q) ||
          m.merchantName.toLowerCase().includes(q);
        if (!matches) return false;
      }

      return true;
    });
  }, [ledgerEntries, selectedSource, selectedMerchant, search]);

  // Overall metrics
  const metrics = useMemo(() => {
    let totalRecoveredUnits = 0;
    let totalDamagedUnits = 0;
    let cancelledUnits = 0;
    let returnUnits = 0;

    ledgerEntries.forEach((m) => {
      if (m.sourceType === 'ORDER_CANCELLED') {
        cancelledUnits += Math.abs(m.deltaQty);
        totalRecoveredUnits += Math.abs(m.deltaQty);
      } else if (m.sourceType === 'COURIER_RETURN') {
        returnUnits += Math.abs(m.deltaQty);
        totalRecoveredUnits += Math.abs(m.deltaQty);
      } else if (m.sourceType === 'DAMAGED_QUARANTINE') {
        totalDamagedUnits += Math.abs(m.deltaQty);
      }
    });

    return {
      totalRecoveredUnits,
      cancelledUnits,
      returnUnits,
      totalDamagedUnits,
      count: ledgerEntries.length,
    };
  }, [ledgerEntries]);

  // CSV Export
  const handleExportCsv = () => {
    const headers = [
      'Proof ID',
      'Date & Time',
      'Source Type',
      'Reference ID',
      'Merchant Code',
      'Merchant Name',
      'Product Title',
      'SKU',
      'Delta Qty',
      'Previous Stock',
      'New Stock',
      'Bin Code',
      'Operator',
      'Digital Proof Hash',
    ];

    const rows = filteredLedger.map((m) => [
      m.id,
      m.timestamp,
      m.sourceType,
      m.referenceId,
      m.merchantCode,
      m.merchantName,
      m.productTitle,
      m.sku,
      m.deltaQty > 0 ? `+${m.deltaQty}` : `${m.deltaQty}`,
      m.previousStock,
      m.newStock,
      m.binCode,
      m.operator,
      m.digitalProofHash,
    ]);

    const csvContent =
      'data:text/csv;charset=utf-8,' +
      [headers.join(','), ...rows.map((e) => e.map((val) => `"${String(val).replace(/"/g, '""')}"`).join(','))].join('\n');

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Fulfillio_Reverse_Stock_Ledger_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      {/* Sub-metrics bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="p-3.5 rounded-xl bg-white dark:bg-navy-900 border border-slate-200 dark:border-white/10 shadow-sm">
          <span className="text-[11px] font-semibold text-slate-500 uppercase block tracking-wider">
            Total Movements
          </span>
          <span className="text-xl font-extrabold text-navy-900 dark:text-white tabular-nums mt-0.5 block">
            {metrics.count} Receipts
          </span>
        </div>
        <div className="p-3.5 rounded-xl bg-white dark:bg-navy-900 border border-slate-200 dark:border-white/10 shadow-sm">
          <span className="text-[11px] font-semibold text-slate-500 uppercase block tracking-wider">
            Cancelled Restocks
          </span>
          <span className="text-xl font-extrabold text-emerald-600 dark:text-emerald-400 tabular-nums mt-0.5 block">
            +{metrics.cancelledUnits} pcs
          </span>
        </div>
        <div className="p-3.5 rounded-xl bg-white dark:bg-navy-900 border border-slate-200 dark:border-white/10 shadow-sm">
          <span className="text-[11px] font-semibold text-slate-500 uppercase block tracking-wider">
            Courier RTO Restocks
          </span>
          <span className="text-xl font-extrabold text-blue-600 dark:text-blue-400 tabular-nums mt-0.5 block">
            +{metrics.returnUnits} pcs
          </span>
        </div>
        <div className="p-3.5 rounded-xl bg-white dark:bg-navy-900 border border-slate-200 dark:border-white/10 shadow-sm">
          <span className="text-[11px] font-semibold text-slate-500 uppercase block tracking-wider">
            Damaged Quarantines
          </span>
          <span className="text-xl font-extrabold text-rose-600 dark:text-rose-400 tabular-nums mt-0.5 block">
            {metrics.totalDamagedUnits} pcs
          </span>
        </div>
      </div>

      {/* Filter and Export Bar */}
      <div className="bg-white dark:bg-navy-900 border border-slate-200 dark:border-white/10 rounded-2xl p-4 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 shadow-sm">
        <div className="flex-1 relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search proof hash, order number, SKU or product title..."
            className="w-full pl-10 pr-4 py-2 bg-slate-50 dark:bg-navy-950 border border-slate-200 dark:border-white/10 rounded-xl text-xs text-navy-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-orange-500"
          />
        </div>

        <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
          <select
            value={selectedSource}
            onChange={(e) => setSelectedSource(e.target.value as any)}
            className="px-3 py-2 bg-slate-50 dark:bg-navy-950 border border-slate-200 dark:border-white/10 rounded-xl text-xs font-semibold text-navy-900 dark:text-white focus:outline-none focus:border-orange-500"
          >
            <option value="ALL">All Recovery Sources</option>
            <option value="ORDER_CANCELLED">Order Cancellations</option>
            <option value="COURIER_RETURN">Courier Returns (RTO)</option>
            <option value="DAMAGED_QUARANTINE">Damaged / Quarantine</option>
          </select>

          <select
            value={selectedMerchant}
            onChange={(e) => setSelectedMerchant(e.target.value)}
            className="px-3 py-2 bg-slate-50 dark:bg-navy-950 border border-slate-200 dark:border-white/10 rounded-xl text-xs font-semibold text-navy-900 dark:text-white focus:outline-none focus:border-orange-500"
          >
            <option value="ALL">All Merchants</option>
            {merchants.map((m) => (
              <option key={m.code} value={m.code}>
                {m.code} — {m.name}
              </option>
            ))}
          </select>

          <button
            type="button"
            onClick={handleExportCsv}
            className="px-3.5 py-2 bg-white dark:bg-navy-800 hover:bg-slate-50 dark:hover:bg-navy-700 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-white/10 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer shrink-0"
          >
            <Download className="w-3.5 h-3.5 text-orange-600 dark:text-orange-400" />
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      {/* Ledger Audit Table */}
      <div className="bg-white dark:bg-navy-900 border border-slate-200 dark:border-white/10 rounded-2xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[1040px]">
            <thead>
              <tr className="border-b border-slate-200 dark:border-white/10 text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-300 bg-slate-50/60 dark:bg-navy-950/60">
                <th className="py-3.5 px-4">Proof ID &amp; Time</th>
                <th className="py-3.5 px-4">Recovery Source</th>
                <th className="py-3.5 px-4">Product &amp; SKU</th>
                <th className="py-3.5 px-4 text-center">Delta</th>
                <th className="py-3.5 px-4 text-center">Stock Audit</th>
                <th className="py-3.5 px-4">Bin &amp; Reference</th>
                <th className="py-3.5 px-4">Operator &amp; Notes</th>
                <th className="py-3.5 px-4 text-right">Digital Proof</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200/80 dark:divide-white/10 text-sm">
              {filteredLedger.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400 text-xs">
                    No reverse stock recovery movements found matching filters.
                  </td>
                </tr>
              ) : (
                filteredLedger.map((item) => {
                  const isCancel = item.sourceType === 'ORDER_CANCELLED';
                  const isDamaged = item.sourceType === 'DAMAGED_QUARANTINE';
                  const isIntake = item.sourceType === 'INITIAL_INTAKE';

                  return (
                    <tr
                      key={item.id}
                      className="hover:bg-slate-100/40 dark:hover:bg-navy-800/40 transition-colors"
                    >
                      {/* Proof ID & Time */}
                      <td className="py-3.5 px-4">
                        <span className="font-mono font-bold text-navy-900 dark:text-white text-xs block">
                          {item.id}
                        </span>
                        <span className="text-[11px] text-slate-400 font-sans">
                          {item.timestamp}
                        </span>
                      </td>

                      {/* Recovery Source */}
                      <td className="py-3.5 px-4">
                        {isCancel ? (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                            <RotateCcw className="w-3 h-3" />
                            <span>Order Cancel</span>
                          </span>
                        ) : isDamaged ? (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20">
                            <AlertTriangle className="w-3 h-3" />
                            <span>Damage Quarantine</span>
                          </span>
                        ) : isIntake ? (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-sky-500/10 text-sky-600 dark:text-sky-400 border border-sky-500/20">
                            <Boxes className="w-3 h-3" />
                            <span>Initial Stock Intake</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20">
                            <Boxes className="w-3 h-3" />
                            <span>Courier Return</span>
                          </span>
                        )}
                        <span className="block text-[11px] text-slate-500 mt-1 font-mono">
                          Ref: {item.referenceId}
                        </span>
                      </td>

                      {/* Product & SKU */}
                      <td className="py-3.5 px-4 max-w-xs">
                        <div className="font-semibold text-xs text-navy-900 dark:text-white line-clamp-1">
                          {item.productTitle}
                        </div>
                        <div className="flex items-center gap-1.5 mt-0.5">
                          <span className="font-mono text-[10px] text-slate-500 bg-slate-100 dark:bg-navy-800 px-1.5 py-0.5 rounded">
                            {item.sku}
                          </span>
                          <span className="text-[10px] text-orange-600 dark:text-orange-400 font-bold">
                            {item.merchantCode}
                          </span>
                        </div>
                      </td>

                      {/* Delta */}
                      <td className="py-3.5 px-4 text-center">
                        <span
                          className={`inline-block font-mono font-bold text-xs px-2 py-0.5 rounded ${
                            item.deltaQty > 0
                              ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400'
                              : 'bg-rose-500/15 text-rose-600 dark:text-rose-400'
                          }`}
                        >
                          {item.deltaQty > 0 ? `+${item.deltaQty}` : item.deltaQty} pcs
                        </span>
                      </td>

                      {/* Stock Audit */}
                      <td className="py-3.5 px-4 text-center">
                        <div className="font-mono text-xs tabular-nums text-slate-700 dark:text-slate-200">
                          <span className="text-slate-400 line-through mr-1">
                            {item.previousStock}
                          </span>
                          &rarr;
                          <span className="font-bold text-emerald-600 dark:text-emerald-400 ml-1">
                            {item.newStock}
                          </span>
                        </div>
                        <span className="text-[10px] text-slate-400 block mt-0.5">
                          Available in Bin
                        </span>
                      </td>

                      {/* Bin & Reference */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-1 text-xs font-mono font-bold text-navy-900 dark:text-slate-200">
                          <MapPin className="w-3.5 h-3.5 text-orange-600 dark:text-orange-400 shrink-0" />
                          <span>{item.binCode}</span>
                        </div>
                        <span className="text-[10px] text-slate-400 block mt-0.5 truncate max-w-[120px]">
                          {item.merchantName}
                        </span>
                      </td>

                      {/* Operator & Notes */}
                      <td className="py-3.5 px-4 max-w-xs">
                        <span className="text-xs font-semibold text-slate-700 dark:text-slate-200 block">
                          {item.operator}
                        </span>
                        <span className="text-[11px] text-slate-400 block line-clamp-1 mt-0.5">
                          {item.notes || 'Warehouse return intake verification'}
                        </span>
                      </td>

                      {/* Digital Proof */}
                      <td className="py-3.5 px-4 text-right">
                        <button
                          type="button"
                          onClick={() => setReceiptRecord(item)}
                          className="px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 dark:bg-navy-800 dark:hover:bg-navy-700 border border-slate-200 dark:border-white/10 rounded-lg text-[11px] font-mono text-slate-700 dark:text-slate-200 flex items-center gap-1.5 ml-auto transition-colors cursor-pointer"
                          title="View Digital Proof Receipt"
                        >
                          <ShieldCheck className="w-3.5 h-3.5 text-orange-600 dark:text-orange-400" />
                          <span>{item.digitalProofHash.slice(0, 10)}...</span>
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Digital Proof Receipt Modal */}
      {receiptRecord && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white dark:bg-navy-900 border border-slate-200 dark:border-white/10 rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-white/10 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-orange-500/10 border border-orange-500/20 flex items-center justify-center text-orange-600">
                  <ShieldCheck className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-navy-900 dark:text-white">
                    Stock Recovery Digital Proof
                  </h4>
                  <span className="text-[10px] text-slate-400 font-mono">
                    {receiptRecord.id}
                  </span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setReceiptRecord(null)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-white text-xs font-bold p-1 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="space-y-2 text-xs">
              <div className="flex justify-between py-1 border-b border-slate-50 dark:border-white/5">
                <span className="text-slate-500">Recovery Event</span>
                <span className="font-bold text-navy-900 dark:text-white font-mono">
                  {receiptRecord.sourceType}
                </span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-50 dark:border-white/5">
                <span className="text-slate-500">Reference Order</span>
                <span className="font-bold text-navy-900 dark:text-white font-mono">
                  {receiptRecord.referenceId}
                </span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-50 dark:border-white/5">
                <span className="text-slate-500">Product Title</span>
                <span className="font-semibold text-navy-900 dark:text-white text-right max-w-[200px] truncate">
                  {receiptRecord.productTitle}
                </span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-50 dark:border-white/5">
                <span className="text-slate-500">SKU / Variant</span>
                <span className="font-mono text-emerald-600 dark:text-emerald-400">
                  {receiptRecord.sku}
                </span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-50 dark:border-white/5">
                <span className="text-slate-500">Quantity Recovered</span>
                <span className="font-bold text-emerald-600 dark:text-emerald-400 font-mono">
                  +{receiptRecord.deltaQty} units
                </span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-50 dark:border-white/5">
                <span className="text-slate-500">Stock Impact</span>
                <span className="font-mono font-bold text-navy-900 dark:text-white">
                  {receiptRecord.previousStock} &rarr; {receiptRecord.newStock} pcs
                </span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-50 dark:border-white/5">
                <span className="text-slate-500">Storage Bin</span>
                <span className="font-mono font-bold text-orange-600">
                  {receiptRecord.binCode}
                </span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-50 dark:border-white/5">
                <span className="text-slate-500">Timestamp</span>
                <span className="text-slate-600 dark:text-slate-300">
                  {receiptRecord.timestamp}
                </span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-50 dark:border-white/5">
                <span className="text-slate-500">Authorized Operator</span>
                <span className="text-navy-900 dark:text-white font-medium">
                  {receiptRecord.operator}
                </span>
              </div>

              <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-navy-950 border border-slate-200 dark:border-white/10 mt-2">
                <span className="text-[10px] font-semibold text-slate-400 uppercase block mb-1">
                  Cryptographic Verification Hash
                </span>
                <span className="font-mono text-[10px] text-slate-600 dark:text-slate-300 break-all select-all">
                  {receiptRecord.digitalProofHash}
                </span>
              </div>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                type="button"
                onClick={() => setReceiptRecord(null)}
                className="px-4 py-2 bg-orange-600 hover:bg-orange-500 text-white rounded-xl text-xs font-bold transition-all cursor-pointer"
              >
                Close Receipt
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
