'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Download } from 'lucide-react';
import { PayoutAccount } from '../../types';
import { PaymentRequest, PaymentRequestMethod } from '@/features/admin/payouts/types';
import {
  STORAGE_KEY_PAYMENT_REQUESTS,
  INITIAL_PAYMENT_REQUESTS,
} from '@/features/admin/payouts/mockData';
import { EarningsWalletBanner } from '../billing/EarningsWalletBanner';
import { EarningsKpiCards } from '../billing/EarningsKpiCards';
import { EarningsOverviewChart } from '../billing/EarningsOverviewChart';
import { EarningsOrdersTable, EarningsOrderRow } from '../billing/EarningsOrdersTable';
import { PayoutHistorySection } from '../billing/PayoutHistorySection';
import { RequestPayoutModal } from '../billing/RequestPayoutModal';
import { ManagePayoutAccountModal } from '../billing/ManagePayoutAccountModal';

const STORAGE_KEY_MERCHANT_WALLET = 'fulfillio_merchant_wallet_balance';

const INITIAL_EARNINGS_ORDERS: EarningsOrderRow[] = [
  {
    id: 'ord-101',
    transactionRef: 'TXN-8811-01',
    orderNumber: 'ORD-9824',
    itemTitle: 'Heavyweight Hoodie (XL Black) x 1',
    date: '24 Oct 2026, 04:30 PM',
    grossAmount: 3450,
    feeAmount: 180,
    netAmount: 3270,
    status: 'READY_TO_CLAIM',
  },
  {
    id: 'ord-102',
    transactionRef: 'TXN-8811-02',
    orderNumber: 'ORD-9825',
    itemTitle: 'Premium Cotton T-Shirt Combo Pack (L) x 2',
    date: '24 Oct 2026, 03:15 PM',
    grossAmount: 2200,
    feeAmount: 150,
    netAmount: 2050,
    status: 'READY_TO_CLAIM',
  },
  {
    id: 'ord-103',
    transactionRef: 'TXN-8811-03',
    orderNumber: 'ORD-9826',
    itemTitle: 'Denim Slim Stretch Jeans (32/34) x 1',
    date: '24 Oct 2026, 01:45 PM',
    grossAmount: 2800,
    feeAmount: 160,
    netAmount: 2640,
    status: 'READY_TO_CLAIM',
  },
  {
    id: 'ord-104',
    transactionRef: 'TXN-8811-04',
    orderNumber: 'ORD-9827',
    itemTitle: 'Formal Executive Oxford Shirt (M White) x 1',
    date: '23 Oct 2026, 06:10 PM',
    grossAmount: 1950,
    feeAmount: 140,
    netAmount: 1810,
    status: 'PENDING',
  },
  {
    id: 'ord-105',
    transactionRef: 'TXN-8811-05',
    orderNumber: 'ORD-9828',
    itemTitle: 'Winter Puffer Jacket (L Navy) x 1',
    date: '23 Oct 2026, 02:00 PM',
    grossAmount: 4800,
    feeAmount: 220,
    netAmount: 4580,
    status: 'PENDING',
  },
  {
    id: 'ord-106',
    transactionRef: 'TXN-8811-06',
    orderNumber: 'ORD-9829',
    itemTitle: 'Canvas Casual Sneakers (Size 42) x 1',
    date: '22 Oct 2026, 11:20 AM',
    grossAmount: 2500,
    feeAmount: 160,
    netAmount: 2340,
    status: 'REFUNDED',
  },
];

interface MerchantBillingTabProps {
  payoutAccount?: PayoutAccount;
}

export function MerchantBillingTab({ payoutAccount: initialAccount }: MerchantBillingTabProps) {
  const [account, setAccount] = useState<PayoutAccount | undefined>(initialAccount);
  const [availableBalance, setAvailableBalance] = useState<number>(24500);
  const [allRequests, setAllRequests] = useState<PaymentRequest[]>(INITIAL_PAYMENT_REQUESTS);

  // Modals state
  const [isRequestModalOpen, setIsRequestModalOpen] = useState(false);
  const [isAccountModalOpen, setIsAccountModalOpen] = useState(false);

  // Toast
  const [toast, setToast] = useState<string | null>(null);
  const triggerToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3500);
  };

  // Hydrate wallet & requests from localStorage
  const loadData = useCallback(() => {
    try {
      const storedBal = localStorage.getItem(STORAGE_KEY_MERCHANT_WALLET);
      if (storedBal !== null) {
        setAvailableBalance(Number(storedBal));
      }

      const storedReqs = localStorage.getItem(STORAGE_KEY_PAYMENT_REQUESTS);
      if (storedReqs) {
        const parsed = JSON.parse(storedReqs);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setAllRequests(parsed);
        }
      }
    } catch (err) {
      console.error('Failed to load wallet data:', err);
    }
  }, []);

  useEffect(() => {
    loadData();

    const handleSync = (e: Event) => {
      const customEvent = e as CustomEvent<{ source?: string }>;
      if (customEvent.detail?.source === 'MerchantBillingTab') return;
      loadData();
    };

    window.addEventListener('fulfillio:sync:payment-requests', handleSync);
    window.addEventListener('storage', handleSync);
    return () => {
      window.removeEventListener('fulfillio:sync:payment-requests', handleSync);
      window.removeEventListener('storage', handleSync);
    };
  }, [loadData]);

  // Filter requests for this merchant (MC-101 / Sabbir's Store or current session)
  const merchantRequests = allRequests.filter(
    (r) => r.merchantCode === 'MC-101' || r.merchantId === 'm-101'
  );

  // Calculate upcoming (pending or accepted) payouts and paid total
  const upcomingPayout = merchantRequests
    .filter((r) => r.status === 'PENDING' || r.status === 'ACCEPTED')
    .reduce((sum, r) => sum + r.amount, 0);

  const totalPaidOut =
    17640 +
    merchantRequests
      .filter((r) => r.status === 'PAID')
      .reduce((sum, r) => sum + r.amount, 0);

  const readyToClaim = 7960;

  // Handle new payout request submission
  const handleSubmitPayoutRequest = (params: {
    amount: number;
    method: PaymentRequestMethod;
    provider: string;
    accountNumber: string;
    accountHolder?: string;
    remarks?: string;
  }) => {
    const newReqId = `PR-${Math.floor(1000 + Math.random() * 9000)}`;
    const nowFormatted =
      new Date().toLocaleDateString('en-GB', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
      }) +
      ', ' +
      new Date().toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: true,
      });

    const newReq: PaymentRequest = {
      id: newReqId,
      merchantId: 'm-101',
      merchantCode: 'MC-101',
      merchantName: "Sabbir's Store",
      ownerName: params.accountHolder || 'Sabbir Ahmed',
      amount: params.amount,
      method: params.method,
      accountDetails: {
        provider: params.provider,
        accountNumber: params.accountNumber,
        accountHolder: params.accountHolder,
      },
      requestedAt: nowFormatted,
      status: 'PENDING',
      remarks: params.remarks,
    };

    const updatedList = [newReq, ...allRequests];
    setAllRequests(updatedList);

    // Deduct available balance
    const newBal = Math.max(0, availableBalance - params.amount);
    setAvailableBalance(newBal);

    // Persist
    try {
      localStorage.setItem(STORAGE_KEY_PAYMENT_REQUESTS, JSON.stringify(updatedList));
      localStorage.setItem(STORAGE_KEY_MERCHANT_WALLET, String(newBal));
      window.dispatchEvent(
        new CustomEvent('fulfillio:sync:payment-requests', {
          detail: { source: 'MerchantBillingTab' },
        })
      );
    } catch (err) {
      console.error('Failed to save payment request:', err);
    }

    triggerToast(
      `Payout request ${newReqId} for ৳${params.amount.toLocaleString()} submitted! Admin approval pending.`
    );
  };

  const handleSaveAccount = (updated: PayoutAccount) => {
    setAccount(updated);
    triggerToast('Payout account settings updated successfully!');
  };

  return (
    <div className="space-y-6">
      {/* Toast Alert */}
      {toast && (
        <div className="p-3.5 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-xs sm:text-sm font-semibold flex items-center justify-between shadow-lg animate-in fade-in duration-200">
          <span>{toast}</span>
          <button onClick={() => setToast(null)} className="text-emerald-400 hover:text-white ml-2 text-xs">
            Dismiss
          </button>
        </div>
      )}

      {/* Top Header matching Screenshot */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2 text-xs text-slate-400 font-semibold mb-1">
            <span>Overview</span>
            <span>/</span>
            <span className="text-emerald-400">Earnings</span>
            <span className="px-2 py-0.2 rounded-full text-[10px] font-bold bg-slate-800 text-slate-300 border border-slate-700">
              Financial overview
            </span>
          </div>
          <h1 className="text-xl sm:text-2xl font-black tracking-tight text-slate-100">
            Earnings
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-0.5">
            Track your revenue, available balance, payouts and earnings from fulfilled orders.
          </p>
        </div>

        <button
          type="button"
          onClick={() => triggerToast('Statement exported as PDF & CSV!')}
          className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-200 text-xs font-semibold flex items-center justify-center gap-2 border border-slate-800 transition-colors shrink-0 shadow-sm"
        >
          <Download className="w-4 h-4 text-emerald-400" />
          <span>Export Statement</span>
        </button>
      </div>

      {/* 1. Wallet Banner & Payout Account (Top Section) */}
      <EarningsWalletBanner
        availableBalance={availableBalance}
        readyToClaim={readyToClaim}
        upcomingPayout={upcomingPayout}
        totalPaidOut={totalPaidOut}
        payoutAccount={account}
        onRequestPayout={() => setIsRequestModalOpen(true)}
        onManageAccount={() => setIsAccountModalOpen(true)}
      />

      {/* 2. KPI Cards Row */}
      <EarningsKpiCards
        totalProfit={1900}
        pendingEarnings={14150}
        totalPayouts={totalPaidOut}
        platformFees={1200}
      />

      {/* 3. Monthly Chart & Breakdown */}
      <EarningsOverviewChart
        grossProductEarnings={20200}
        deliveryFees={1240}
        netEarnings={18960}
      />

      {/* 4. Orders / Transactions Itemized Table */}
      <EarningsOrdersTable
        orders={INITIAL_EARNINGS_ORDERS}
        onTriggerToast={triggerToast}
      />

      {/* 5. Payout History & Automatic Payout Schedule */}
      <PayoutHistorySection
        payoutRequests={merchantRequests}
        onManageAccount={() => setIsAccountModalOpen(true)}
        onTriggerToast={triggerToast}
      />

      {/* Request Payout Modal */}
      <RequestPayoutModal
        isOpen={isRequestModalOpen}
        onClose={() => setIsRequestModalOpen(false)}
        availableBalance={availableBalance}
        payoutAccount={account}
        onSubmit={handleSubmitPayoutRequest}
      />

      {/* Manage Payout Account Modal */}
      <ManagePayoutAccountModal
        isOpen={isAccountModalOpen}
        onClose={() => setIsAccountModalOpen(false)}
        payoutAccount={account}
        onSave={handleSaveAccount}
      />
    </div>
  );
}
