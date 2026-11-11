'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  Sparkles,
  LayoutDashboard,
  Package,
  ShoppingCart,
  Truck,
  CreditCard,
  Key,
  User,
  Layers,
  ArrowRight,
  TrendingUp,
  Boxes,
  ShieldCheck,
  CheckCircle2,
  Clock,
  RotateCw,
  Search,
  ExternalLink,
  ChevronRight,
  Printer,
  DollarSign,
  AlertCircle,
  BarChart3,
  Percent,
} from 'lucide-react';
import { MerchantTab } from '../../types';
import { useMerchant } from '../../MerchantContext';

interface MerchantOverviewTabProps {
  memoCount: number;
  onSelectTab: (tab: MerchantTab) => void;
}

type MerchantTimeframe = 'today' | '7d' | '30d' | 'quarter';

export function MerchantOverviewTab({ memoCount, onSelectTab }: MerchantOverviewTabProps) {
  const { profile, products, orders, asns } = useMerchant();
  const [timeframe, setTimeframe] = useState<MerchantTimeframe>('7d');
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastRefreshed, setLastRefreshed] = useState('Just now');

  const handleRefresh = () => {
    setIsRefreshing(true);
    setTimeout(() => {
      setIsRefreshing(false);
      setLastRefreshed('Updated just now');
    }, 600);
  };

  // Dynamic calculations based on live context
  const totalOrdersCount = orders.length;
  const totalGrossRevenue = orders.reduce((sum, o) => sum + (Number(o.amount) || 0), 0);
  const totalStockUnits = products.reduce((sum, p) => sum + (p.stock || 0), 0);
  const activeSkusCount = products.length;
  const pendingOrdersCount = orders.filter((o) => o.status === 'PENDING' || o.status === 'ALLOCATED').length;
  const deliveredOrdersCount = orders.filter((o) => o.status === 'DISPATCHED' || o.status === 'DELIVERED').length;

  // 3PL Financial estimates
  const estFulfillmentFees = Math.round(totalGrossRevenue * 0.045);
  const estCourierFees = totalOrdersCount * 60;
  const estNetWalletBalance = Math.max(0, totalGrossRevenue - estFulfillmentFees - estCourierFees);

  const timeframeOptions: { id: MerchantTimeframe; label: string }[] = [
    { id: 'today', label: 'Today (Live)' },
    { id: '7d', label: 'Last 7 Days' },
    { id: '30d', label: 'Last 30 Days' },
    { id: 'quarter', label: 'This Quarter' },
  ];

  const quickModules = [
    {
      tab: 'products' as MerchantTab,
      title: 'Product Master & Catalog',
      desc: 'Catalog management, barcode labels, and warehouse bin allocation',
      icon: Package,
      badge: `${activeSkusCount} SKUs Active`,
      color: 'text-orange-600 dark:text-orange-400',
    },
    {
      tab: 'orders' as MerchantTab,
      title: 'Customer Orders Pipeline',
      desc: 'Live order lifecycle, fulfillment stages, and 4x6 slip print',
      icon: ShoppingCart,
      badge: '99.8% On-Time SLA',
      color: 'text-emerald-600 dark:text-emerald-400',
    },
    {
      tab: 'memo-designer' as MerchantTab,
      title: 'Custom Memo / Invoice Slip',
      desc: 'Branded invoice templates with custom logo, colors & thermal sizes',
      icon: Layers,
      badge: `${memoCount || 1} Custom Designs`,
      color: 'text-indigo-600 dark:text-indigo-400',
    },
    {
      tab: 'inbound' as MerchantTab,
      title: 'Inbound ASNs & Warehouse Dock',
      desc: 'Advance shipping notices, carrier tracking, and intake verification',
      icon: Truck,
      badge: `${asns.length} Inbound ASNs`,
      color: 'text-amber-600 dark:text-amber-400',
    },
    {
      tab: 'billing' as MerchantTab,
      title: 'COD Earnings & Payout Wallet',
      desc: 'Live COD settlement balances, disbursement history & bank payouts',
      icon: CreditCard,
      badge: `৳ ${estNetWalletBalance.toLocaleString()} Available`,
      color: 'text-teal-600 dark:text-teal-400',
    },
    {
      tab: 'api-keys' as MerchantTab,
      title: 'API Keys & Webhook Hub',
      desc: 'REST API tokens, WooCommerce/Shopify sync & outbound webhook logs',
      icon: Key,
      badge: 'REST Engine Live',
      color: 'text-purple-600 dark:text-purple-400',
    },
  ];

  return (
    <div className="space-y-6">
      {/* 1. Page Header & Range Controls */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5 flex-wrap">
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-navy-900 dark:text-white">
              {profile.storeName || 'Merchant Store'} Dashboard
            </h1>
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
              <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>Merchant Code: {profile.merchantCode}</span>
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
            Realtime warehouse inventory levels, orders fulfilled by Fulfillio 3PL, and COD settlements.
          </p>
        </div>

        {/* Timeframe Selector & Refresh */}
        <div className="flex flex-wrap items-center gap-2 self-start md:self-auto">
          <div className="flex items-center p-1 rounded-xl bg-white dark:bg-navy-900 border border-slate-200 dark:border-white/10 shadow-xs">
            {timeframeOptions.map((opt) => (
              <button
                key={opt.id}
                type="button"
                onClick={() => setTimeframe(opt.id)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  timeframe === opt.id
                    ? 'bg-orange-600 text-white shadow-sm'
                    : 'text-slate-600 dark:text-slate-400 hover:text-navy-900 dark:hover:text-white'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>

          <button
            type="button"
            onClick={handleRefresh}
            title="Refresh metrics"
            className="p-2.5 rounded-xl bg-white dark:bg-navy-900 border border-slate-200 dark:border-white/10 text-slate-600 dark:text-slate-300 hover:text-orange-500 hover:border-orange-500/30 transition-all shadow-xs cursor-pointer active:scale-95"
          >
            <RotateCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin text-orange-500' : ''}`} />
          </button>
        </div>
      </div>

      {/* 2. Top Executive Scorecards (4 High-Impact KPI Cards) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Gross Sales / COD Amount */}
        <div className="p-5 rounded-2xl bg-white dark:bg-navy-900 border border-slate-200 dark:border-white/10 shadow-sm flex flex-col justify-between transition-all hover:border-orange-500/30">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-[11px] uppercase font-bold tracking-wider text-slate-500 dark:text-slate-400">
                Gross Order Value
              </span>
              <div className="h-8 w-8 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                <DollarSign className="h-4 w-4" />
              </div>
            </div>
            <div className="mt-3">
              <div className="text-2xl sm:text-3xl font-extrabold text-navy-900 dark:text-white tabular-nums">
                ৳ {totalGrossRevenue.toLocaleString()}
              </div>
{totalGrossRevenue > 0 ? (
                <div className="flex items-center gap-1.5 mt-1 text-xs text-emerald-600 dark:text-emerald-400 font-semibold">
                  <TrendingUp className="h-3.5 w-3.5" />
                  <span>+14.8% vs previous period</span>
                </div>
              ) : (
                <div className="text-xs text-slate-400 font-normal mt-1">
                  <span>৳ 0.00 Gross Sales</span>
                </div>
              )}
            </div>
          </div>
          <div className="mt-4 pt-3 border-t border-slate-100 dark:border-white/5 flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400">
            <span>Net Claimable</span>
            <span className="font-bold text-navy-900 dark:text-white">৳ {estNetWalletBalance.toLocaleString()}</span>
          </div>
        </div>

        {/* Card 2: Warehouse In-Stock Units */}
        <div className="p-5 rounded-2xl bg-white dark:bg-navy-900 border border-slate-200 dark:border-white/10 shadow-sm flex flex-col justify-between transition-all hover:border-orange-500/30">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-[11px] uppercase font-bold tracking-wider text-slate-500 dark:text-slate-400">
                Warehouse In-Stock
              </span>
              <div className="h-8 w-8 rounded-lg bg-indigo-500/10 border border-indigo-500/20 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
                <Boxes className="h-4 w-4" />
              </div>
            </div>
            <div className="mt-3">
              <div className="text-2xl sm:text-3xl font-extrabold text-navy-900 dark:text-white tabular-nums">
                {totalStockUnits.toLocaleString()} <span className="text-sm font-medium text-slate-400">Units</span>
              </div>
{activeSkusCount > 0 ? (
                <div className="flex items-center gap-1.5 mt-1 text-xs text-indigo-600 dark:text-indigo-400 font-semibold">
                  <CheckCircle2 className="h-3.5 w-3.5" />
                  <span>Across {activeSkusCount} active catalog items</span>
                </div>
              ) : (
                <div className="text-xs text-slate-400 font-normal mt-1">
                  <span>0 Products in Catalog</span>
                </div>
              )}
            </div>
          </div>
          <div className="mt-4 pt-3 border-t border-slate-100 dark:border-white/5 flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400">
            <span>Stock Health</span>
            <span className="font-bold text-emerald-600 dark:text-emerald-400">{totalStockUnits > 0 ? '100% Available' : 'No Stock'}</span>
          </div>
        </div>

        {/* Card 3: Total Orders & Fulfillment */}
        <div className="p-5 rounded-2xl bg-white dark:bg-navy-900 border border-slate-200 dark:border-white/10 shadow-sm flex flex-col justify-between transition-all hover:border-orange-500/30">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-[11px] uppercase font-bold tracking-wider text-slate-500 dark:text-slate-400">
                Total Orders
              </span>
              <div className="h-8 w-8 rounded-lg bg-orange-500/10 border border-orange-500/20 text-orange-600 dark:text-orange-400 flex items-center justify-center">
                <ShoppingCart className="h-4 w-4" />
              </div>
            </div>
            <div className="mt-3">
              <div className="text-2xl sm:text-3xl font-extrabold text-navy-900 dark:text-white tabular-nums">
                {totalOrdersCount} <span className="text-sm font-medium text-slate-400">Orders</span>
              </div>
{totalOrdersCount > 0 ? (
                <div className="flex items-center gap-1.5 mt-1 text-xs text-orange-600 dark:text-orange-400 font-semibold">
                  <Clock className="h-3.5 w-3.5" />
                  <span>{pendingOrdersCount} orders in picking & packing</span>
                </div>
              ) : (
                <div className="text-xs text-slate-400 font-normal mt-1">
                  <span>0 Orders Placed</span>
                </div>
              )}
            </div>
          </div>
          <div className="mt-4 pt-3 border-t border-slate-100 dark:border-white/5 flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400">
            <span>Courier Handed Over</span>
            <span className="font-bold text-navy-900 dark:text-white">{deliveredOrdersCount} Dispatched</span>
          </div>
        </div>

        {/* Card 4: 3PL Dispatch SLA */}
        <div className="p-5 rounded-2xl bg-white dark:bg-navy-900 border border-slate-200 dark:border-white/10 shadow-sm flex flex-col justify-between transition-all hover:border-orange-500/30">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-[11px] uppercase font-bold tracking-wider text-slate-500 dark:text-slate-400">
                3PL Fulfillment SLA
              </span>
              <div className="h-8 w-8 rounded-lg bg-purple-500/10 border border-purple-500/20 text-purple-600 dark:text-purple-400 flex items-center justify-center">
                <ShieldCheck className="h-4 w-4" />
              </div>
            </div>
            <div className="mt-3">
              <div className="text-2xl sm:text-3xl font-extrabold text-navy-900 dark:text-white tabular-nums">
                99.8%
              </div>
              <div className="flex items-center gap-1.5 mt-1 text-xs text-emerald-600 dark:text-emerald-400 font-semibold">
                <CheckCircle2 className="h-3.5 w-3.5" />
                <span>Same-day dispatch guarantee</span>
              </div>
            </div>
          </div>
          <div className="mt-4 pt-3 border-t border-slate-100 dark:border-white/5 flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400">
            <span>Avg Packaging Time</span>
            <span className="font-bold text-navy-900 dark:text-white">18 Mins</span>
          </div>
        </div>
      </div>

      {/* 3. Financial Settlement Breakdown Card & Live Flow */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* Left: Financial Profit & Fee Breakdown (7 cols) */}
        <div className="lg:col-span-7 p-5 sm:p-6 rounded-2xl bg-white dark:bg-navy-900 border border-slate-200 dark:border-white/10 shadow-sm space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 dark:border-white/10 pb-4">
            <div>
              <h2 className="text-base font-bold text-navy-900 dark:text-white flex items-center gap-2">
                <CreditCard className="h-5 w-5 text-orange-600 dark:text-orange-400" />
                <span>COD Financial Settlement & 3PL Deductions</span>
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Transparent revenue ledger breakdown with zero hidden fees.
              </p>
            </div>
            <span className="text-xs font-mono font-bold px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-navy-800 text-slate-700 dark:text-slate-300 self-start sm:self-auto border border-slate-200 dark:border-white/10">
              Weekly Cycle
            </span>
          </div>

          {/* Fee Breakdown Bars */}
          <div className="space-y-3.5">
            <div>
              <div className="flex justify-between text-xs font-semibold mb-1.5">
                <span className="text-slate-600 dark:text-slate-300">Gross Sales Collection (COD & Prepaid)</span>
                <span className="font-bold font-mono text-navy-900 dark:text-white">৳ {totalGrossRevenue.toLocaleString()}</span>
              </div>
              <div className="w-full h-2 rounded-full bg-slate-100 dark:bg-navy-800 overflow-hidden">
                <div className="h-full bg-emerald-500 rounded-full" style={{ width: '100%' }} />
              </div>
            </div>

            <div>
              <div className="flex justify-between text-xs font-semibold mb-1.5">
                <span className="text-slate-600 dark:text-slate-300">Fulfillio 3PL Warehousing & Pick-Pack Fee (4.5%)</span>
                <span className="font-mono text-rose-600 dark:text-rose-400 font-bold">- ৳ {estFulfillmentFees.toLocaleString()}</span>
              </div>
              <div className="w-full h-2 rounded-full bg-slate-100 dark:bg-navy-800 overflow-hidden">
                <div className="h-full bg-rose-500 rounded-full" style={{ width: '12%' }} />
              </div>
            </div>

            <div>
              <div className="flex justify-between text-xs font-semibold mb-1.5">
                <span className="text-slate-600 dark:text-slate-300">Courier Delivery Charges (Steadfast / Pathao / RedX)</span>
                <span className="font-mono text-amber-600 dark:text-amber-400 font-bold">- ৳ {estCourierFees.toLocaleString()}</span>
              </div>
              <div className="w-full h-2 rounded-full bg-slate-100 dark:bg-navy-800 overflow-hidden">
                <div className="h-full bg-amber-500 rounded-full" style={{ width: '18%' }} />
              </div>
            </div>
          </div>

          {/* Bottom Net Wallet Calculation Box */}
          <div className="p-4 rounded-xl bg-slate-50 dark:bg-navy-950/70 border border-slate-200/80 dark:border-white/10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div>
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 block">
                Net Payout Available in Wallet
              </span>
              <div className="text-2xl font-black text-emerald-600 dark:text-emerald-400 font-mono mt-0.5">
                ৳ {estNetWalletBalance.toLocaleString()}
              </div>
            </div>
            <button
              onClick={() => onSelectTab('billing')}
              className="px-4 py-2 bg-orange-600 hover:bg-orange-500 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-orange-500/20 cursor-pointer shrink-0"
            >
              Request COD Payout &rarr;
            </button>
          </div>
        </div>

        {/* Right: Live Order Dispatch Pipeline Stages (5 cols) */}
        <div className="lg:col-span-5 p-5 sm:p-6 rounded-2xl bg-white dark:bg-navy-900 border border-slate-200 dark:border-white/10 shadow-sm flex flex-col justify-between space-y-4">
          <div>
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-white/10 pb-4">
              <h2 className="text-base font-bold text-navy-900 dark:text-white flex items-center gap-2">
                <Truck className="h-5 w-5 text-orange-600 dark:text-orange-400" />
                <span>Live Order Pipeline</span>
              </h2>
              <span className="text-xs text-emerald-600 dark:text-emerald-400 font-semibold">Active</span>
            </div>

            <div className="space-y-3 mt-4">
              <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-navy-950/70 border border-slate-200/80 dark:border-white/10">
                <div className="flex items-center gap-2.5">
                  <div className="h-8 w-8 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-600 dark:text-amber-400 flex items-center justify-center font-bold text-xs">
                    1
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-navy-900 dark:text-white">Pending / Processing</h4>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400">Awaiting wave allocation</p>
                  </div>
                </div>
                <span className="font-mono font-bold text-xs text-navy-900 dark:text-white px-2 py-0.5 rounded bg-white dark:bg-navy-900 border border-slate-200 dark:border-white/10">
                  {pendingOrdersCount}
                </span>
              </div>

              <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-navy-950/70 border border-slate-200/80 dark:border-white/10">
                <div className="flex items-center gap-2.5">
                  <div className="h-8 w-8 rounded-lg bg-blue-500/10 border border-blue-500/20 text-blue-600 dark:text-blue-400 flex items-center justify-center font-bold text-xs">
                    2
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-navy-900 dark:text-white">Packing & 4x6 Slip Print</h4>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400">Barcoded & sealed</p>
                  </div>
                </div>
                <span className="font-mono font-bold text-xs text-navy-900 dark:text-white px-2 py-0.5 rounded bg-white dark:bg-navy-900 border border-slate-200 dark:border-white/10">
                  {Math.round(pendingOrdersCount * 0.5)}
                </span>
              </div>

              <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-navy-950/70 border border-slate-200/80 dark:border-white/10">
                <div className="flex items-center gap-2.5">
                  <div className="h-8 w-8 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold text-xs">
                    3
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-navy-900 dark:text-white">Handover to Courier</h4>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400">Steadfast / Pathao in transit</p>
                  </div>
                </div>
                <span className="font-mono font-bold text-xs text-emerald-600 dark:text-emerald-400 px-2 py-0.5 rounded bg-emerald-500/10 border border-emerald-500/20">
                  {deliveredOrdersCount}
                </span>
              </div>
            </div>
          </div>

          <button
            onClick={() => onSelectTab('orders')}
            className="w-full py-2.5 px-4 bg-slate-100 hover:bg-slate-200 dark:bg-navy-800 dark:hover:bg-navy-700 text-slate-800 dark:text-slate-100 rounded-xl text-xs font-bold transition-all border border-slate-200 dark:border-white/10 flex items-center justify-center gap-2 cursor-pointer"
          >
            <span>View Full Customer Orders Pipeline</span>
            <ArrowRight className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* 4. Bespoke Invoice Slip Brand Banner */}
      <div className="p-6 rounded-2xl bg-gradient-to-r from-orange-500/10 via-amber-500/5 to-white dark:to-navy-900 border border-orange-500/20 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-start sm:items-center gap-4">
          <div className="h-12 w-12 rounded-xl bg-orange-600 text-white flex items-center justify-center shrink-0 shadow-md shadow-orange-500/25">
            <Sparkles className="h-6 w-6" />
          </div>
          <div>
            <h3 className="font-bold text-base text-navy-900 dark:text-white">
              Bespoke Branded Invoice Delivery
            </h3>
            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 max-w-2xl mt-0.5">
              When your WooCommerce or Shopify store pushes orders, specify a{' '}
              <code className="text-xs font-mono font-semibold text-orange-600 dark:text-orange-400 bg-white dark:bg-navy-950 px-1.5 py-0.5 rounded border border-orange-500/20">
                memo_code
              </code>{' '}
              to have our warehouse packing station print your customized branded invoice.
            </p>
          </div>
        </div>

        <button
          onClick={() => onSelectTab('memo-designer')}
          className="w-full sm:w-auto px-4 py-2.5 bg-orange-600 hover:bg-orange-500 text-white font-bold text-xs rounded-xl transition-all shrink-0 text-center shadow-md shadow-orange-500/20 cursor-pointer active:scale-95"
        >
          Manage Memo Designs ({memoCount})
        </button>
      </div>

      {/* 5. Modular Navigation Grid (6 Core Modules) */}
      <div>
        <div className="flex items-center justify-between mb-3 px-1">
          <h2 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
            Merchant Operations & Modules
          </h2>
          <span className="text-xs text-slate-400 font-medium">6 modules ready</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {quickModules.map((m) => {
            const Icon = m.icon;
            return (
              <button
                key={m.tab}
                onClick={() => onSelectTab(m.tab)}
                className="p-5 rounded-2xl bg-white dark:bg-navy-900 border border-slate-200 dark:border-white/10 hover:border-orange-500/40 dark:hover:border-orange-500/40 hover:shadow-lg text-left transition-all duration-200 group flex flex-col justify-between cursor-pointer"
              >
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <div className="h-10 w-10 rounded-xl bg-slate-100 dark:bg-navy-800 border border-slate-200/80 dark:border-white/10 flex items-center justify-center text-orange-600 dark:text-orange-400 group-hover:bg-orange-600 group-hover:text-white transition-all shadow-xs">
                      <Icon className="h-5 w-5" />
                    </div>
                    <span className="text-[10px] font-bold text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-navy-800 px-2 py-0.5 rounded-md border border-slate-200 dark:border-white/10">
                      {m.badge}
                    </span>
                  </div>
                  <h3 className="text-sm font-bold text-navy-900 dark:text-white group-hover:text-orange-600 dark:group-hover:text-orange-400 transition-colors">
                    {m.title}
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 line-clamp-2 leading-relaxed">
                    {m.desc}
                  </p>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-100 dark:border-white/10 flex items-center justify-between text-xs font-bold text-orange-600 dark:text-orange-400 group-hover:translate-x-0.5 transition-transform">
                  <span>Open Module</span>
                  <ArrowRight className="h-3.5 w-3.5 group-hover:translate-x-1 transition-transform" />
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
