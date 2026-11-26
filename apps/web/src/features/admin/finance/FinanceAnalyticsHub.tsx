'use client';

import React, { useMemo, useState } from 'react';
import {
  BarChart3,
  Calendar,
  Download,
  Printer,
  Plus,
  RotateCw,
  Store,
  AlertCircle,
} from 'lucide-react';
import {
  CompanyFinanceEntryDto,
  FinanceEntryType,
  FinanceTimeframePreset,
} from '@fulfillio/contracts';
import { useAdminFinanceAnalytics } from '@/lib/hooks/useBilling';
import { CodSettlementSection } from './components/CodSettlementSection';
import { CompanyProfitLossSection } from './components/CompanyProfitLossSection';
import { OrderVolumeAndMerchantsSection } from './components/OrderVolumeAndMerchantsSection';
import { FinanceEntryModal } from './components/modals/FinanceEntryModal';

const PRESET_OPTIONS: Array<{ id: FinanceTimeframePreset; label: string }> = [
  { id: 'TODAY', label: 'Today' },
  { id: 'LAST_7_DAYS', label: 'Last 7 Days' },
  { id: 'THIS_MONTH', label: 'This Month' },
  { id: 'LAST_30_DAYS', label: 'Last 30 Days' },
  { id: 'ALL_TIME', label: 'All Time' },
  { id: 'CUSTOM', label: 'Custom Range' },
];

function getDefaultMonthStart(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`;
}

function getTodayDateString(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
}

export function FinanceAnalyticsHub() {
  const [preset, setPreset] = useState<FinanceTimeframePreset>('THIS_MONTH');
  const [customStart, setCustomStart] = useState<string>(getDefaultMonthStart);
  const [customEnd, setCustomEnd] = useState<string>(getTodayDateString);
  const [selectedMerchantId, setSelectedMerchantId] = useState<string>('ALL');

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalDefaultType, setModalDefaultType] = useState<FinanceEntryType>(
    FinanceEntryType.EXPENSE,
  );
  const [editingEntry, setEditingEntry] = useState<CompanyFinanceEntryDto | null>(null);

  const queryParams = useMemo(
    () => ({
      preset,
      startDate: preset === 'CUSTOM' ? customStart : undefined,
      endDate: preset === 'CUSTOM' ? customEnd : undefined,
      merchantId: selectedMerchantId !== 'ALL' ? selectedMerchantId : undefined,
    }),
    [preset, customStart, customEnd, selectedMerchantId],
  );

  const {
    data,
    isLoading,
    isFetching,
    isError,
    error,
    refetch,
  } = useAdminFinanceAnalytics(queryParams);

  const handleOpenNewEntry = (defaultType: FinanceEntryType) => {
    setEditingEntry(null);
    setModalDefaultType(defaultType);
    setIsModalOpen(true);
  };

  const handleEditEntry = (entry: CompanyFinanceEntryDto) => {
    setEditingEntry(entry);
    setModalDefaultType(entry.type);
    setIsModalOpen(true);
  };

  const handleExportCsv = () => {
    if (!data) return;

    const escapeCsv = (val: unknown) => {
      const s = String(val ?? '');
      if (s.includes(',') || s.includes('"') || s.includes('\n')) {
        return `"${s.replace(/"/g, '""')}"`;
      }
      return s;
    };

    const lines: string[] = [];
    lines.push('FULFILLIO 3PL FINANCE & ANALYTICS REPORT');
    lines.push(`Period,${escapeCsv(data.filter.label)}`);
    lines.push(
      `Merchant Scope,${escapeCsv(data.filter.merchantName || 'All Merchants')}`,
    );
    lines.push('');

    lines.push('SECTION 1: COD & MERCHANT SETTLEMENT SUMMARY');
    lines.push('Metric,Amount (BDT)');
    lines.push(`Total Order Bill Collected (COD),${data.codSettlement.totalOrderBillCollected}`);
    lines.push(`Platform & Courier Fees Deducted,${data.codSettlement.totalPlatformFeesDeducted}`);
    lines.push(`Merchant Net Payable,${data.codSettlement.merchantNetPayable}`);
    lines.push(`Paid to Merchants (Period),${data.codSettlement.totalPaidToMerchants}`);
    lines.push(`Live Unpaid Merchant Liability,${data.codSettlement.totalUnpaidMerchantLiability}`);
    lines.push('');

    lines.push('SECTION 2: FULFILLIO 3PL PROFIT & LOSS');
    lines.push('Metric,Amount (BDT)');
    lines.push(`Auto Handling Fees,${data.companyProfitLoss.autoHandlingRevenue}`);
    lines.push(`Auto Delivery Charges,${data.companyProfitLoss.autoDeliveryFeeRevenue}`);
    lines.push(`Auto Packaging Fees,${data.companyProfitLoss.autoPackagingRevenue}`);
    lines.push(`Manual Storage Income,${data.companyProfitLoss.manualStorageIncome}`);
    lines.push(`Manual Other Income,${data.companyProfitLoss.manualOtherIncome}`);
    lines.push(`Gross 3PL Revenue,${data.companyProfitLoss.gross3plRevenue}`);
    lines.push(`Total Operating Expenses,${data.companyProfitLoss.totalOperatingExpenses}`);
    lines.push(`Net Profit / Loss,${data.companyProfitLoss.netProfit}`);
    lines.push(`Net Margin %,${data.companyProfitLoss.netMarginPercentage}%`);
    lines.push('');

    lines.push('SECTION 3: MERCHANT-WISE BREAKDOWN');
    lines.push(
      'Merchant Code,Merchant Name,Total Orders,Delivered Orders,Returned Orders,COD Collected,3PL Fees Earned,Merchant Net,Paid Out,Live Unpaid Due',
    );
    for (const m of data.merchantBreakdown) {
      lines.push(
        [
          escapeCsv(m.merchantCode),
          escapeCsv(m.merchantName),
          m.totalOrders,
          m.deliveredOrders,
          m.returnedOrders,
          m.grossCodCollected,
          m.total3plFees,
          m.merchantNetEarned,
          m.totalPaidOut,
          m.currentUnpaidDue,
        ].join(','),
      );
    }
    lines.push('');

    lines.push('COMPANY INCOME & EXPENSE LEDGER');
    lines.push('Entry Code,Date,Type,Category,Title,Merchant,Payment Method,Reference,Amount');
    for (const entry of data.ledgerEntries) {
      lines.push(
        [
          escapeCsv(entry.entryCode),
          escapeCsv(entry.entryDate.slice(0, 10)),
          escapeCsv(entry.type),
          escapeCsv(entry.category),
          escapeCsv(entry.title),
          escapeCsv(entry.merchantName || 'Company-wide'),
          escapeCsv(entry.paymentMethod || ''),
          escapeCsv(entry.referenceNo || ''),
          entry.amount,
        ].join(','),
      );
    }

    const blob = new Blob([lines.join('\n')], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `fulfillio-finance-${preset.toLowerCase()}-${getTodayDateString()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col xl:flex-row xl:items-center xl:justify-between gap-4 print:hidden">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-orange-500/10 border border-orange-500/20 text-orange-600 dark:text-orange-400">
              <BarChart3 className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-navy-900 dark:text-white">
                Finance, P&amp;L &amp; Analytics Hub
              </h1>
              <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5">
                Complete 3PL hishab-nikash: COD &amp; merchant payouts, Fulfillio gross revenue vs expenses (P&amp;L), and order volume trends.
              </p>
            </div>
          </div>
        </div>

        {/* Top Action Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => handleOpenNewEntry(FinanceEntryType.EXPENSE)}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-orange-600 hover:bg-orange-500 text-xs font-bold text-white shadow-md shadow-orange-500/20 transition-all cursor-pointer active:scale-95"
          >
            <Plus className="w-4 h-4" />
            <span>Log Expense / Income</span>
          </button>

          <button
            type="button"
            onClick={handleExportCsv}
            disabled={!data}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white dark:bg-navy-900 hover:bg-slate-100 dark:hover:bg-navy-800 border border-slate-200 dark:border-white/15 text-xs font-bold text-navy-900 dark:text-slate-100 transition-colors cursor-pointer disabled:opacity-50"
          >
            <Download className="w-3.5 h-3.5 text-orange-600 dark:text-orange-400" />
            <span>Export CSV</span>
          </button>

          <button
            type="button"
            onClick={() => window.print()}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white dark:bg-navy-900 hover:bg-slate-100 dark:hover:bg-navy-800 border border-slate-200 dark:border-white/15 text-xs font-bold text-navy-900 dark:text-slate-100 transition-colors cursor-pointer"
          >
            <Printer className="w-3.5 h-3.5 text-slate-500" />
            <span>Print Report</span>
          </button>

          <button
            type="button"
            onClick={() => refetch()}
            disabled={isFetching}
            title="Refresh live analytics"
            className="p-2 rounded-xl bg-white dark:bg-navy-900 border border-slate-200 dark:border-white/15 text-slate-600 dark:text-slate-300 hover:text-orange-600 dark:hover:text-orange-400 transition-colors cursor-pointer"
          >
            <RotateCw className={`w-4 h-4 ${isFetching ? 'animate-spin text-orange-500' : ''}`} />
          </button>
        </div>
      </div>

      {/* Filter Bar: Date Presets + Custom Dates + Merchant Selector */}
      <div className="p-4 rounded-2xl bg-white dark:bg-navy-900 border border-slate-200/80 dark:border-white/10 shadow-xs flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3 print:hidden">
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex flex-wrap items-center p-1 rounded-xl bg-slate-100 dark:bg-navy-950 border border-slate-200 dark:border-white/10 gap-0.5">
            {PRESET_OPTIONS.map((opt) => (
              <button
                key={opt.id}
                type="button"
                onClick={() => setPreset(opt.id)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  preset === opt.id
                    ? 'bg-orange-600 text-white shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-navy-900 dark:hover:text-white'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>

          {preset === 'CUSTOM' && (
            <div className="flex flex-wrap items-center gap-2 pl-1">
              <div className="flex items-center gap-1.5 text-xs">
                <Calendar className="w-3.5 h-3.5 text-orange-500" />
                <input
                  type="date"
                  value={customStart}
                  onChange={(e) => setCustomStart(e.target.value)}
                  className="px-2.5 py-1.5 rounded-xl border border-slate-200 dark:border-white/15 bg-slate-50 dark:bg-navy-950 text-xs font-semibold text-navy-900 dark:text-white"
                />
                <span className="text-slate-400">to</span>
                <input
                  type="date"
                  value={customEnd}
                  onChange={(e) => setCustomEnd(e.target.value)}
                  className="px-2.5 py-1.5 rounded-xl border border-slate-200 dark:border-white/15 bg-slate-50 dark:bg-navy-950 text-xs font-semibold text-navy-900 dark:text-white"
                />
              </div>
            </div>
          )}
        </div>

        {/* Merchant Selector */}
        <div className="flex items-center gap-2">
          <Store className="w-4 h-4 text-orange-500 shrink-0" />
          <select
            value={selectedMerchantId}
            onChange={(e) => setSelectedMerchantId(e.target.value)}
            className="px-3 py-1.5 rounded-xl border border-slate-200 dark:border-white/15 bg-slate-50 dark:bg-navy-950 text-xs font-bold text-navy-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-orange-500/30 min-w-[200px]"
          >
            <option value="ALL">All Merchants (Full 3PL P&amp;L)</option>
            {(data?.merchantsList || []).map((m) => (
              <option key={m.id} value={m.id}>
                {m.merchantCode} — {m.businessName}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Loading / Error States */}
      {isError ? (
        <div className="p-6 rounded-2xl bg-rose-500/10 border border-rose-500/30 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-rose-600 dark:text-rose-400 shrink-0 mt-0.5" />
            <div>
              <h3 className="text-sm font-extrabold text-rose-700 dark:text-rose-300">
                Could not load live finance analytics
              </h3>
              <p className="text-xs text-rose-600/80 dark:text-rose-400/80 mt-0.5">
                {(error as any)?.message || 'Please check that the API server is running.'}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => refetch()}
            className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-xs font-bold text-white cursor-pointer self-start sm:self-auto"
          >
            Retry
          </button>
        </div>
      ) : isLoading || !data ? (
        <div className="space-y-6 animate-pulse">
          <div className="h-64 rounded-2xl bg-slate-200/70 dark:bg-navy-900/60 border border-slate-200 dark:border-white/10" />
          <div className="h-80 rounded-2xl bg-slate-200/70 dark:bg-navy-900/60 border border-slate-200 dark:border-white/10" />
          <div className="h-80 rounded-2xl bg-slate-200/70 dark:bg-navy-900/60 border border-slate-200 dark:border-white/10" />
        </div>
      ) : (
        <>
          {/* Section 1: COD & Merchant Settlement Summary */}
          <CodSettlementSection
            codSettlement={data.codSettlement}
            periodLabel={data.filter.label}
          />

          {/* Section 2: Fulfillio 3PL Revenue & Profit/Loss */}
          <CompanyProfitLossSection
            companyProfitLoss={data.companyProfitLoss}
            ledgerEntries={data.ledgerEntries}
            periodLabel={data.filter.label}
            onOpenNewEntry={handleOpenNewEntry}
            onEditEntry={handleEditEntry}
          />

          {/* Section 3: Order Volume & Merchant-wise Breakdown */}
          <OrderVolumeAndMerchantsSection
            orderVolume={data.orderVolume}
            merchantBreakdown={data.merchantBreakdown}
            periodLabel={data.filter.label}
            selectedMerchantId={selectedMerchantId}
            onSelectMerchant={setSelectedMerchantId}
          />
        </>
      )}

      {/* Add / Edit Company Finance Ledger Modal */}
      <FinanceEntryModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setEditingEntry(null);
        }}
        entry={editingEntry}
        defaultType={modalDefaultType}
        merchantsList={data?.merchantsList || []}
        defaultMerchantId={selectedMerchantId}
      />
    </div>
  );
}
