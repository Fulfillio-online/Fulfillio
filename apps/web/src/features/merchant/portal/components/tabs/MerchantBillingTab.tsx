'use client';

import React, { useState } from 'react';
import {
  Download,
  RefreshCw,
  AlertCircle,
  CheckCircle2,
  Clock,
  Sparkles,
  ShieldCheck,
  PackageCheck,
} from 'lucide-react';
import {
  EarningsChartPeriod,
  PayoutMethod,
  PayoutRequestDto,
} from '@fulfillio/contracts';
import {
  useMerchantEarnings,
  useClaimEarnings,
  useCreatePayoutRequest,
  useCancelPayoutRequest,
} from '@/lib/hooks/useBilling';
import { getActiveMerchantSession } from '@/lib/warehouseSync';
import {
  PayoutDigitalProofModal,
  PayoutDigitalProofData,
} from '@/components/billing/PayoutDigitalProofModal';
import { PayoutAccount } from '../../types';
import { EarningsWalletBanner } from '../billing/EarningsWalletBanner';
import { EarningsKpiCards } from '../billing/EarningsKpiCards';
import { EarningsOverviewChart } from '../billing/EarningsOverviewChart';
import { EarningsOrdersTable } from '../billing/EarningsOrdersTable';
import { PayoutHistorySection } from '../billing/PayoutHistorySection';
import { RequestPayoutModal } from '../billing/RequestPayoutModal';
import { ManagePayoutAccountModal } from '../billing/ManagePayoutAccountModal';

interface MerchantBillingTabProps {
  merchantCode?: string;
  payoutAccount?: PayoutAccount;
  onUpdatePayoutAccount?: (updated: PayoutAccount) => void;
}

function escapeCsv(val: unknown): string {
  return `"${String(val ?? '').replace(/"/g, '""')}"`;
}

export function MerchantBillingTab({
  merchantCode,
  payoutAccount: initialAccount,
  onUpdatePayoutAccount,
}: MerchantBillingTabProps) {
  const effectiveMerchantCode =
    merchantCode ||
    (typeof window !== 'undefined' ? getActiveMerchantSession()?.merchantCode : undefined);

  const [chartPeriod, setChartPeriod] = useState<EarningsChartPeriod>('THIS_MONTH');
  const [accountOverride, setAccountOverride] = useState<PayoutAccount | undefined>(undefined);
  const [isRequestModalOpen, setIsRequestModalOpen] = useState(false);
  const [isAccountModalOpen, setIsAccountModalOpen] = useState(false);
  const [activeProof, setActiveProof] = useState<PayoutDigitalProofData | null>(null);
  const [cancellingId, setCancellingId] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  const triggerToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => {
      setToast((curr) => (curr === msg ? null : curr));
    }, 4000);
  };

  const {
    data: dashboard,
    isLoading,
    isFetching,
    error,
    refetch,
  } = useMerchantEarnings(effectiveMerchantCode, chartPeriod);

  const claimMutation = useClaimEarnings();
  const createPayoutMutation = useCreatePayoutRequest();
  const cancelPayoutMutation = useCancelPayoutRequest();

  const resolvedPayoutAccount =
    accountOverride ||
    initialAccount ||
    ((dashboard?.merchant?.payoutAccount as PayoutAccount | null) ?? undefined);

  const handleClaimAll = async () => {
    try {
      const res: any = await claimMutation.mutateAsync({
        merchantCode: dashboard?.merchant?.merchantCode || effectiveMerchantCode,
        claimAll: true,
      });
      triggerToast(
        `Claimed ${res.claimedCount} order earning(s) totaling ৳${Number(res.claimedAmount || 0).toLocaleString()} into your wallet!`,
      );
    } catch (err: any) {
      triggerToast(err?.message || 'Unable to claim earnings right now.');
    }
  };

  const handleClaimSelected = async (earningIds: string[]) => {
    if (earningIds.length === 0) return;
    try {
      const res: any = await claimMutation.mutateAsync({
        merchantCode: dashboard?.merchant?.merchantCode || effectiveMerchantCode,
        earningIds,
      });
      triggerToast(
        `Claimed ${res.claimedCount} selected order(s) (৳${Number(res.claimedAmount || 0).toLocaleString()}) into wallet!`,
      );
    } catch (err: any) {
      triggerToast(err?.message || 'Unable to claim selected earnings.');
    }
  };

  const handleSubmitPayoutRequest = async (params: {
    amount: number;
    method: PayoutMethod;
    provider: string;
    accountNumber: string;
    accountHolder?: string;
    branchName?: string;
    routingNumber?: string;
    remarks?: string;
  }) => {
    const created = await createPayoutMutation.mutateAsync({
      ...params,
      merchantCode: dashboard?.merchant?.merchantCode || effectiveMerchantCode,
    });
    triggerToast(
      `Payout request ${created.requestCode} for ৳${created.amount.toLocaleString()} submitted for Admin approval!`,
    );
  };

  const handleCancelPayout = async (id: string) => {
    setCancellingId(id);
    try {
      const cancelled = await cancelPayoutMutation.mutateAsync({
        id,
        merchantCode: dashboard?.merchant?.merchantCode || effectiveMerchantCode,
      });
      triggerToast(
        `Payout request ${cancelled.requestCode} cancelled and balance restored to your wallet.`,
      );
    } catch (err: any) {
      triggerToast(err?.message || 'Failed to cancel payout request.');
    } finally {
      setCancellingId(null);
    }
  };

  const handleSaveAccount = (updated: PayoutAccount) => {
    setAccountOverride(updated);
    onUpdatePayoutAccount?.(updated);
    triggerToast('Payout account updated and submitted for Admin approval.');
  };

  const handleExportCsv = () => {
    if (!dashboard) return;
    const rows: string[] = [
      [
        'Type',
        'Reference',
        'Order / Request',
        'Items / Method',
        'Gross (BDT)',
        'Fees (BDT)',
        'Net / Payout (BDT)',
        'Status',
        'Date',
        'TrxID / Proof Checksum',
      ]
        .map(escapeCsv)
        .join(','),
    ];

    for (const e of dashboard.earnings) {
      rows.push(
        [
          'ORDER_EARNING',
          e.transactionRef,
          e.orderNumber,
          e.itemSummary,
          e.grossAmount,
          e.feeAmount,
          e.netAmount,
          e.status,
          e.completedAt,
          e.refundReason || '',
        ]
          .map(escapeCsv)
          .join(','),
      );
    }

    for (const p of dashboard.payoutRequests) {
      rows.push(
        [
          'PAYOUT_REQUEST',
          p.requestCode,
          p.provider,
          p.accountNumber,
          p.amount,
          0,
          p.amount,
          p.status,
          p.paidAt || p.requestedAt,
          p.trxId ? `${p.trxId}${p.proofChecksum ? ` (${p.proofChecksum.slice(0, 12)})` : ''}` : '',
        ]
          .map(escapeCsv)
          .join(','),
      );
    }

    const blob = new Blob([rows.join('\n')], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `fulfillio-earnings-${dashboard.merchant.merchantCode}-${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    triggerToast('Earnings & Payouts CSV statement exported!');
  };

  const openProofModal = (req: PayoutRequestDto) => {
    setActiveProof({
      requestCode: req.requestCode,
      transactionRef: req.trxId,
      merchantName: req.merchantName,
      merchantCode: req.merchantCode,
      amount: req.amount,
      method: req.method,
      provider: req.provider,
      accountNumber: req.accountNumber,
      accountHolder: req.accountHolder,
      trxId: req.trxId,
      proofDocumentUrl: req.proofDocumentUrl,
      proofDocumentName: req.proofDocumentName,
      proofDocumentMime: req.proofDocumentMime,
      proofChannel: req.proofChannel,
      proofNotes: req.proofNotes,
      proofChecksum: req.proofChecksum,
      paidAt: req.paidAt,
      paidByAdminName: req.paidByAdminName,
      status: req.status,
    });
  };

  if (isLoading && !dashboard) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-14 rounded-2xl bg-slate-200/70 dark:bg-navy-900/80" />
        <div className="h-44 rounded-2xl bg-slate-200/70 dark:bg-navy-900/80" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-28 rounded-2xl bg-slate-200/70 dark:bg-navy-900/80" />
          ))}
        </div>
        <div className="h-72 rounded-2xl bg-slate-200/70 dark:bg-navy-900/80" />
      </div>
    );
  }

  if (error && !dashboard) {
    return (
      <div className="rounded-2xl border border-rose-500/30 bg-rose-500/10 p-6 text-center space-y-3">
        <AlertCircle className="w-8 h-8 text-rose-500 mx-auto" />
        <h3 className="font-bold text-sm text-navy-900 dark:text-white">
          Unable to load live earnings from server
        </h3>
        <p className="text-xs text-slate-600 dark:text-slate-300">
          {(error as any)?.message || 'Please check that the API server is running and try again.'}
        </p>
        <button
          type="button"
          onClick={() => refetch()}
          className="px-4 py-2 rounded-xl bg-orange-600 hover:bg-orange-500 text-white text-xs font-bold cursor-pointer"
        >
          Retry Sync
        </button>
      </div>
    );
  }

  const summary = dashboard!.summary;
  const merchant = dashboard!.merchant;
  const chart = dashboard!.chart;

  return (
    <div className="space-y-6">
      {/* Toast Banner */}
      {toast && (
        <div className="p-3.5 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-700 dark:text-emerald-300 text-xs sm:text-sm font-semibold flex items-center justify-between shadow-sm animate-in fade-in duration-150">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>{toast}</span>
          </div>
          <button
            type="button"
            onClick={() => setToast(null)}
            className="text-emerald-600 dark:text-emerald-400 hover:underline ml-3 text-xs cursor-pointer"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400 font-semibold mb-1">
            <span>Merchant Portal</span>
            <span>/</span>
            <span className="text-orange-600 dark:text-orange-400">Earnings &amp; Payouts</span>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
              Live Order Ledger · {merchant.merchantCode}
            </span>
          </div>
          <h1 className="text-xl sm:text-2xl font-black tracking-tight text-navy-900 dark:text-white">
            Earnings &amp; Payouts
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5">
            Completed orders enter a {merchant.returnWindowDays}-day return hold before moving to Claim stage for verified payouts.
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={() => refetch()}
            disabled={isFetching}
            className="px-3.5 py-2 rounded-xl bg-white dark:bg-navy-900 hover:bg-slate-100 dark:hover:bg-navy-800 text-navy-900 dark:text-slate-200 text-xs font-semibold flex items-center gap-1.5 border border-slate-200/80 dark:border-white/10 transition-colors shadow-sm cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-orange-500 ${isFetching ? 'animate-spin' : ''}`} />
            <span>Sync</span>
          </button>

          <button
            type="button"
            onClick={handleExportCsv}
            className="px-4 py-2 rounded-xl bg-white dark:bg-navy-900 hover:bg-slate-100 dark:hover:bg-navy-800 text-navy-900 dark:text-slate-200 text-xs font-semibold flex items-center justify-center gap-2 border border-slate-200/80 dark:border-white/10 transition-colors shadow-sm cursor-pointer"
          >
            <Download className="w-4 h-4 text-emerald-500" />
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      {/* 4-Stage Earnings Lifecycle Strip */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="rounded-xl border border-slate-200/80 dark:border-white/10 bg-white dark:bg-navy-900 p-3.5 flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-navy-800 text-navy-900 dark:text-slate-200 flex items-center justify-center shrink-0">
            <PackageCheck className="w-4 h-4" />
          </div>
          <div className="min-w-0">
            <span className="text-[10px] font-bold uppercase text-slate-500 block">1. Order Completed</span>
            <span className="text-xs font-bold text-navy-900 dark:text-white truncate block">
              {summary.completedOrdersCount} Delivered Order(s)
            </span>
          </div>
        </div>

        <div className="rounded-xl border border-amber-500/30 bg-amber-500/5 p-3.5 flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-amber-500/15 text-amber-600 dark:text-amber-300 flex items-center justify-center shrink-0">
            <Clock className="w-4 h-4" />
          </div>
          <div className="min-w-0">
            <span className="text-[10px] font-bold uppercase text-amber-700 dark:text-amber-300 block">
              2. Pending ({merchant.returnWindowDays}d Return Hold)
            </span>
            <span className="text-xs font-bold text-navy-900 dark:text-white tabular-nums block">
              ৳{summary.pendingEarnings.toLocaleString()} ({summary.pendingCount})
            </span>
          </div>
        </div>

        <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/5 p-3.5 flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
            <Sparkles className="w-4 h-4" />
          </div>
          <div className="min-w-0">
            <span className="text-[10px] font-bold uppercase text-emerald-700 dark:text-emerald-300 block">
              3. Claim Stage (Window Over)
            </span>
            <span className="text-xs font-bold text-navy-900 dark:text-white tabular-nums block">
              ৳{summary.readyToClaim.toLocaleString()} ({summary.readyToClaimCount})
            </span>
          </div>
        </div>

        <div className="rounded-xl border border-orange-500/30 bg-orange-500/5 p-3.5 flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-orange-500/15 text-orange-600 dark:text-orange-400 flex items-center justify-center shrink-0">
            <ShieldCheck className="w-4 h-4" />
          </div>
          <div className="min-w-0">
            <span className="text-[10px] font-bold uppercase text-orange-700 dark:text-orange-300 block">
              4. Paid w/ Digital Proof
            </span>
            <span className="text-xs font-bold text-navy-900 dark:text-white tabular-nums block">
              ৳{summary.totalPaidOut.toLocaleString()} ({summary.paidPayoutsCount})
            </span>
          </div>
        </div>
      </div>

      {/* 1. Wallet Banner & Payout Account */}
      <EarningsWalletBanner
        availableBalance={summary.availableBalance}
        readyToClaim={summary.readyToClaim}
        withdrawableTotal={summary.withdrawableTotal}
        pendingEarnings={summary.pendingEarnings}
        upcomingPayout={summary.upcomingPayout}
        totalPaidOut={summary.totalPaidOut}
        minPayoutAmount={merchant.minPayoutAmount}
        returnWindowDays={merchant.returnWindowDays}
        clawbackDeficit={summary.clawbackDeficit}
        payoutAccount={resolvedPayoutAccount}
        isClaiming={claimMutation.isPending}
        onClaimAll={handleClaimAll}
        onRequestPayout={() => setIsRequestModalOpen(true)}
        onManageAccount={() => setIsAccountModalOpen(true)}
      />

      {/* 2. KPI Cards */}
      <EarningsKpiCards
        totalNetEarnings={summary.totalNetEarnings}
        completedOrdersCount={summary.completedOrdersCount}
        pendingEarnings={summary.pendingEarnings}
        pendingCount={summary.pendingCount}
        returnWindowDays={merchant.returnWindowDays}
        totalPayouts={summary.totalPaidOut}
        paidPayoutsCount={summary.paidPayoutsCount}
        platformFees={summary.totalPlatformFees}
        totalRefunded={summary.totalRefunded}
        refundedCount={summary.refundedCount}
      />

      {/* 3. Dynamic Chart & Breakdown */}
      <EarningsOverviewChart
        period={chart.period}
        onPeriodChange={setChartPeriod}
        buckets={chart.buckets}
        grossProductEarnings={chart.periodGross}
        deliveryFees={chart.periodDeliveryFees}
        handlingAndPackagingFees={chart.periodHandlingAndPackagingFees}
        refundedAmount={chart.periodRefunded}
        netEarnings={chart.periodNet}
        returnWindowDays={merchant.returnWindowDays}
      />

      {/* 4. Itemized Order Earnings Table */}
      <EarningsOrdersTable
        orders={dashboard!.earnings}
        isClaiming={claimMutation.isPending}
        onClaimSelected={handleClaimSelected}
        onTriggerToast={triggerToast}
      />

      {/* 5. Payout History & Digital Proof Vouchers */}
      <PayoutHistorySection
        payoutRequests={dashboard!.payoutRequests}
        nextScheduledPayoutDate={summary.nextScheduledPayoutDate}
        payoutFrequency={resolvedPayoutAccount?.frequency || 'Weekly'}
        minPayoutAmount={merchant.minPayoutAmount}
        returnWindowDays={merchant.returnWindowDays}
        cancellingId={cancellingId}
        onCancelRequest={handleCancelPayout}
        onViewDigitalProof={openProofModal}
        onManageAccount={() => setIsAccountModalOpen(true)}
      />

      {/* Request Payout Modal */}
      <RequestPayoutModal
        isOpen={isRequestModalOpen}
        onClose={() => setIsRequestModalOpen(false)}
        availableBalance={summary.availableBalance}
        readyToClaim={summary.readyToClaim}
        withdrawableTotal={summary.withdrawableTotal}
        minPayoutAmount={merchant.minPayoutAmount}
        payoutAccount={resolvedPayoutAccount}
        onSubmit={handleSubmitPayoutRequest}
      />

      {/* Manage Payout Account Modal */}
      <ManagePayoutAccountModal
        isOpen={isAccountModalOpen}
        onClose={() => setIsAccountModalOpen(false)}
        payoutAccount={resolvedPayoutAccount}
        onSave={handleSaveAccount}
      />

      {/* Digital Proof Modal */}
      <PayoutDigitalProofModal
        isOpen={Boolean(activeProof)}
        onClose={() => setActiveProof(null)}
        proof={activeProof}
      />
    </div>
  );
}
