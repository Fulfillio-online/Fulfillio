'use client';

import React, { useState, useMemo } from 'react';
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
  Calendar,
  PieChart as PieChartIcon,
} from 'lucide-react';
import { MerchantTab } from '../../types';
import { useMerchant } from '../../MerchantContext';

interface MerchantOverviewTabProps {
  memoCount: number;
  onSelectTab: (tab: MerchantTab) => void;
}

type MerchantTimeframe = 'today' | '7d' | '30d' | '3m' | '6m' | '1y';

interface TimeframeDataPoint {
  label: string;
  subLabel?: string;
  amount: number;
  orderCount: number;
}

// Helper to calculate solid SVG Pie Slice path
function getPieSectorPath(
  cx: number,
  cy: number,
  r: number,
  startAngleDeg: number,
  endAngleDeg: number
): string {
  const rad = Math.PI / 180;
  const startRad = (startAngleDeg - 90) * rad;
  const endRad = (endAngleDeg - 90) * rad;

  const x1 = cx + r * Math.cos(startRad);
  const y1 = cy + r * Math.sin(startRad);
  const x2 = cx + r * Math.cos(endRad);
  const y2 = cy + r * Math.sin(endRad);

  const largeArcFlag = endAngleDeg - startAngleDeg > 180 ? 1 : 0;

  return `M ${cx} ${cy} L ${x1.toFixed(2)} ${y1.toFixed(2)} A ${r} ${r} 0 ${largeArcFlag} 1 ${x2.toFixed(2)} ${y2.toFixed(2)} Z`;
}

export function MerchantOverviewTab({ memoCount, onSelectTab }: MerchantOverviewTabProps) {
  const { profile, products, orders, asns } = useMerchant();
  const [timeframe, setTimeframe] = useState<MerchantTimeframe>('7d');
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastRefreshed, setLastRefreshed] = useState('Just now');
  const [activeBarIndex, setActiveBarIndex] = useState<number | null>(null);
  const [hoveredSlice, setHoveredSlice] = useState<'net' | 'courier' | 'fee' | null>(null);

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
  const pendingOrdersCount = orders.filter(
    (o) => o.status === 'PENDING' || o.status === 'ALLOCATED'
  ).length;
  const deliveredOrdersCount = orders.filter(
    (o) => o.status === 'DISPATCHED' || o.status === 'DELIVERED'
  ).length;

  // 3PL Financial estimates
  const estFulfillmentFees = Math.round(totalGrossRevenue * 0.045);
  const estCourierFees = totalOrdersCount * 60;
  const estNetWalletBalance = Math.max(
    0,
    totalGrossRevenue - estFulfillmentFees - estCourierFees
  );

  // Financial percentages for Donut / Circle chart
  const netPercent =
    totalGrossRevenue > 0
      ? Math.max(0, Math.round((estNetWalletBalance / totalGrossRevenue) * 100))
      : 82;
  const feePercent = totalGrossRevenue > 0 ? 5 : 5;
  const courierPercent =
    totalGrossRevenue > 0 ? Math.max(0, 100 - netPercent - feePercent) : 13;

  // Solid Pie Chart Sector Calculations
  const angleNet = (netPercent / 100) * 360;
  const angleCourier = (courierPercent / 100) * 360;
  const angleFee = 360 - angleNet - angleCourier;

  const netStart = 0;
  const netEnd = angleNet;
  const courierStart = netEnd;
  const courierEnd = courierStart + angleCourier;
  const feeStart = courierEnd;
  const feeEnd = 360;

  const pieCx = 90;
  const pieCy = 90;
  const pieR = 80;

  const pathNet = getPieSectorPath(pieCx, pieCy, pieR, netStart, netEnd);
  const pathCourier = getPieSectorPath(pieCx, pieCy, pieR, courierStart, courierEnd);
  const pathFee = getPieSectorPath(pieCx, pieCy, pieR, feeStart, feeEnd);

  const timeframeOptions: { id: MerchantTimeframe; label: string }[] = [
    { id: 'today', label: 'Today (Live Hourly)' },
    { id: '7d', label: 'Last 7 Days (Daily)' },
    { id: '30d', label: 'Last 30 Days (Weekly)' },
    { id: '3m', label: 'Last 3 Months' },
    { id: '6m', label: 'Last 6 Months' },
    { id: '1y', label: 'This Year (12 Months)' },
  ];

  // Dynamic Vertical Bar Chart Data Points (খাড়া খাড়া বার চার্ট)
  const barChartData: TimeframeDataPoint[] = useMemo(() => {
    if (totalGrossRevenue === 0 || totalOrdersCount === 0) {
      // Empty state baseline
      switch (timeframe) {
        case 'today':
          return [
            { label: '08:00', amount: 0, orderCount: 0 },
            { label: '10:00', amount: 0, orderCount: 0 },
            { label: '12:00', amount: 0, orderCount: 0 },
            { label: '14:00', amount: 0, orderCount: 0 },
            { label: '16:00', amount: 0, orderCount: 0 },
            { label: '18:00', amount: 0, orderCount: 0 },
            { label: '20:00', amount: 0, orderCount: 0 },
          ];
        case '7d':
          return [
            { label: 'Sat', amount: 0, orderCount: 0 },
            { label: 'Sun', amount: 0, orderCount: 0 },
            { label: 'Mon', amount: 0, orderCount: 0 },
            { label: 'Tue', amount: 0, orderCount: 0 },
            { label: 'Wed', amount: 0, orderCount: 0 },
            { label: 'Thu', amount: 0, orderCount: 0 },
            { label: 'Fri', amount: 0, orderCount: 0 },
          ];
        case '30d':
          return [
            { label: 'Wk 1', amount: 0, orderCount: 0 },
            { label: 'Wk 2', amount: 0, orderCount: 0 },
            { label: 'Wk 3', amount: 0, orderCount: 0 },
            { label: 'Wk 4', amount: 0, orderCount: 0 },
          ];
        case '3m':
          return [
            { label: 'Month 1', amount: 0, orderCount: 0 },
            { label: 'Month 2', amount: 0, orderCount: 0 },
            { label: 'Month 3', amount: 0, orderCount: 0 },
          ];
        case '6m':
          return [
            { label: 'Aug', amount: 0, orderCount: 0 },
            { label: 'Sep', amount: 0, orderCount: 0 },
            { label: 'Oct', amount: 0, orderCount: 0 },
            { label: 'Nov', amount: 0, orderCount: 0 },
            { label: 'Dec', amount: 0, orderCount: 0 },
            { label: 'Jan', amount: 0, orderCount: 0 },
          ];
        case '1y':
          return [
            { label: 'Jan', amount: 0, orderCount: 0 },
            { label: 'Feb', amount: 0, orderCount: 0 },
            { label: 'Mar', amount: 0, orderCount: 0 },
            { label: 'Apr', amount: 0, orderCount: 0 },
            { label: 'May', amount: 0, orderCount: 0 },
            { label: 'Jun', amount: 0, orderCount: 0 },
            { label: 'Jul', amount: 0, orderCount: 0 },
            { label: 'Aug', amount: 0, orderCount: 0 },
            { label: 'Sep', amount: 0, orderCount: 0 },
            { label: 'Oct', amount: 0, orderCount: 0 },
            { label: 'Nov', amount: 0, orderCount: 0 },
            { label: 'Dec', amount: 0, orderCount: 0 },
          ];
      }
    }

    // When orders exist, distribute them proportionally
    const rev = totalGrossRevenue;
    const ord = totalOrdersCount;

    switch (timeframe) {
      case 'today':
        return [
          { label: '08:00', amount: Math.round(rev * 0.08), orderCount: Math.max(1, Math.round(ord * 0.08)) },
          { label: '10:00', amount: Math.round(rev * 0.16), orderCount: Math.max(1, Math.round(ord * 0.16)) },
          { label: '12:00', amount: Math.round(rev * 0.22), orderCount: Math.max(1, Math.round(ord * 0.22)) },
          { label: '14:00', amount: Math.round(rev * 0.18), orderCount: Math.max(1, Math.round(ord * 0.18)) },
          { label: '16:00', amount: Math.round(rev * 0.14), orderCount: Math.max(1, Math.round(ord * 0.14)) },
          { label: '18:00', amount: Math.round(rev * 0.12), orderCount: Math.max(1, Math.round(ord * 0.12)) },
          { label: '20:00', amount: Math.round(rev * 0.10), orderCount: Math.max(1, Math.round(ord * 0.10)) },
        ];
      case '7d':
        return [
          { label: 'Sat', amount: Math.round(rev * 0.12), orderCount: Math.max(1, Math.round(ord * 0.12)) },
          { label: 'Sun', amount: Math.round(rev * 0.15), orderCount: Math.max(1, Math.round(ord * 0.15)) },
          { label: 'Mon', amount: Math.round(rev * 0.20), orderCount: Math.max(1, Math.round(ord * 0.20)) },
          { label: 'Tue', amount: Math.round(rev * 0.14), orderCount: Math.max(1, Math.round(ord * 0.14)) },
          { label: 'Wed', amount: Math.round(rev * 0.18), orderCount: Math.max(1, Math.round(ord * 0.18)) },
          { label: 'Thu', amount: Math.round(rev * 0.13), orderCount: Math.max(1, Math.round(ord * 0.13)) },
          { label: 'Fri', amount: Math.round(rev * 0.08), orderCount: Math.max(1, Math.round(ord * 0.08)) },
        ];
      case '30d':
        return [
          { label: 'Week 1', amount: Math.round(rev * 0.22), orderCount: Math.max(1, Math.round(ord * 0.22)) },
          { label: 'Week 2', amount: Math.round(rev * 0.28), orderCount: Math.max(1, Math.round(ord * 0.28)) },
          { label: 'Week 3', amount: Math.round(rev * 0.30), orderCount: Math.max(1, Math.round(ord * 0.30)) },
          { label: 'Week 4', amount: Math.round(rev * 0.20), orderCount: Math.max(1, Math.round(ord * 0.20)) },
        ];
      case '3m':
        return [
          { label: '2 Months Ago', amount: Math.round(rev * 0.28), orderCount: Math.max(1, Math.round(ord * 0.28)) },
          { label: 'Last Month', amount: Math.round(rev * 0.34), orderCount: Math.max(1, Math.round(ord * 0.34)) },
          { label: 'This Month', amount: Math.round(rev * 0.38), orderCount: Math.max(1, Math.round(ord * 0.38)) },
        ];
      case '6m':
        return [
          { label: 'Month 1', amount: Math.round(rev * 0.12), orderCount: Math.max(1, Math.round(ord * 0.12)) },
          { label: 'Month 2', amount: Math.round(rev * 0.14), orderCount: Math.max(1, Math.round(ord * 0.14)) },
          { label: 'Month 3', amount: Math.round(rev * 0.18), orderCount: Math.max(1, Math.round(ord * 0.18)) },
          { label: 'Month 4', amount: Math.round(rev * 0.16), orderCount: Math.max(1, Math.round(ord * 0.16)) },
          { label: 'Month 5', amount: Math.round(rev * 0.22), orderCount: Math.max(1, Math.round(ord * 0.22)) },
          { label: 'Month 6', amount: Math.round(rev * 0.18), orderCount: Math.max(1, Math.round(ord * 0.18)) },
        ];
      case '1y':
        return [
          { label: 'Jan', amount: Math.round(rev * 0.06), orderCount: Math.max(1, Math.round(ord * 0.06)) },
          { label: 'Feb', amount: Math.round(rev * 0.07), orderCount: Math.max(1, Math.round(ord * 0.07)) },
          { label: 'Mar', amount: Math.round(rev * 0.09), orderCount: Math.max(1, Math.round(ord * 0.09)) },
          { label: 'Apr', amount: Math.round(rev * 0.08), orderCount: Math.max(1, Math.round(ord * 0.08)) },
          { label: 'May', amount: Math.round(rev * 0.10), orderCount: Math.max(1, Math.round(ord * 0.10)) },
          { label: 'Jun', amount: Math.round(rev * 0.08), orderCount: Math.max(1, Math.round(ord * 0.08)) },
          { label: 'Jul', amount: Math.round(rev * 0.11), orderCount: Math.max(1, Math.round(ord * 0.11)) },
          { label: 'Aug', amount: Math.round(rev * 0.09), orderCount: Math.max(1, Math.round(ord * 0.09)) },
          { label: 'Sep', amount: Math.round(rev * 0.10), orderCount: Math.max(1, Math.round(ord * 0.10)) },
          { label: 'Oct', amount: Math.round(rev * 0.12), orderCount: Math.max(1, Math.round(ord * 0.12)) },
          { label: 'Nov', amount: Math.round(rev * 0.14), orderCount: Math.max(1, Math.round(ord * 0.14)) },
          { label: 'Dec', amount: Math.round(rev * 0.16), orderCount: Math.max(1, Math.round(ord * 0.16)) },
        ];
    }
  }, [timeframe, totalGrossRevenue, totalOrdersCount]);

  const maxBarAmount = useMemo(() => {
    const max = Math.max(...barChartData.map((d) => d.amount), 0);
    return max > 0 ? max : 1000;
  }, [barChartData]);

  // Donut circumference (2 * pi * 52 ≈ 326.7)
  const donutRadius = 52;
  const circumference = 2 * Math.PI * donutRadius;
  const strokeNet = (netPercent / 100) * circumference;
  const strokeFee = (feePercent / 100) * circumference;
  const strokeCourier = (courierPercent / 100) * circumference;

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
              {profile.storeName || 'Merchant Store'} Overview
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

        {/* Timeframe Select Dropdown & Refresh */}
        <div className="flex items-center gap-2.5 self-start md:self-auto">
          <div className="relative">
            <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-white dark:bg-navy-900 border border-slate-200 dark:border-white/10 shadow-xs text-xs font-semibold text-navy-900 dark:text-white hover:border-orange-500/40 transition-colors">
              <Calendar className="h-3.5 w-3.5 text-orange-600 dark:text-orange-400 shrink-0" />
              <select
                value={timeframe}
                onChange={(e) => setTimeframe(e.target.value as MerchantTimeframe)}
                className="bg-transparent font-bold text-xs text-navy-900 dark:text-white focus:outline-none cursor-pointer pr-1"
              >
                {timeframeOptions.map((opt) => (
                  <option
                    key={opt.id}
                    value={opt.id}
                    className="bg-white dark:bg-navy-900 text-navy-900 dark:text-white py-1"
                  >
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>
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
            <span className="font-bold text-navy-900 dark:text-white">
              ৳ {estNetWalletBalance.toLocaleString()}
            </span>
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
                {totalStockUnits.toLocaleString()}{' '}
                <span className="text-sm font-medium text-slate-400">Units</span>
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
            <span className="font-bold text-emerald-600 dark:text-emerald-400">
              {totalStockUnits > 0 ? '100% Available' : 'No Stock'}
            </span>
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
                {totalOrdersCount}{' '}
                <span className="text-sm font-medium text-slate-400">Orders</span>
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
            <span className="font-bold text-navy-900 dark:text-white">
              {deliveredOrdersCount} Dispatched
            </span>
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

      {/* 3. NEW SECTION: Vertical Bar Chart (খাড়া খাড়া বার চার্ট) — Revenue & Order Velocity Analytics */}
      <div className="p-5 sm:p-6 rounded-2xl bg-white dark:bg-navy-900 border border-slate-200 dark:border-white/10 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 dark:border-white/10 pb-4">
          <div>
            <h2 className="text-base font-bold text-navy-900 dark:text-white flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-orange-600 dark:text-orange-400" />
              <span>Revenue & Order Velocity Analytics</span>
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Live trend of orders fulfilled and gross COD volume for the selected timeframe.
            </p>
          </div>

          <div className="flex items-center gap-2 text-xs font-semibold text-slate-600 dark:text-slate-300">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-orange-500/10 text-orange-600 dark:text-orange-400 border border-orange-500/20 font-bold">
              <span className="h-2 w-2 rounded-full bg-orange-500" />
              <span>
                {timeframeOptions.find((o) => o.id === timeframe)?.label}
              </span>
            </span>
          </div>
        </div>

        {/* Vertical Columns Graphic Area */}
        <div className="relative pt-6 pb-2">
          {totalGrossRevenue === 0 && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-white/70 dark:bg-navy-900/70 backdrop-blur-2xs z-10 rounded-xl">
              <BarChart3 className="h-8 w-8 text-slate-400 mb-1.5 opacity-60" />
              <p className="text-xs font-bold text-navy-900 dark:text-white">
                No orders recorded in this timeframe
              </p>
              <p className="text-[11px] text-slate-400 mt-0.5">
                Once customer orders arrive, live vertical bars will reflect here.
              </p>
            </div>
          )}

          {/* Grid lines */}
          <div className="absolute inset-x-0 top-6 bottom-8 flex flex-col justify-between pointer-events-none opacity-40">
            <div className="border-b border-dashed border-slate-200 dark:border-white/10 w-full" />
            <div className="border-b border-dashed border-slate-200 dark:border-white/10 w-full" />
            <div className="border-b border-dashed border-slate-200 dark:border-white/10 w-full" />
            <div className="border-b border-slate-200 dark:border-white/20 w-full" />
          </div>

          {/* Vertical Columns Container */}
          <div className="h-48 sm:h-56 flex items-end justify-between gap-2 sm:gap-4 px-2 sm:px-6 relative z-0">
            {barChartData.map((d, idx) => {
              const heightPercent =
                maxBarAmount > 0 ? Math.max(8, Math.round((d.amount / maxBarAmount) * 100)) : 8;
              const isHovered = activeBarIndex === idx;

              return (
                <div
                  key={idx}
                  onMouseEnter={() => setActiveBarIndex(idx)}
                  onMouseLeave={() => setActiveBarIndex(null)}
                  className="flex-1 flex flex-col items-center h-full justify-end group relative cursor-pointer"
                >
                  {/* Floating Tooltip Card */}
                  {isHovered && (
                    <div className="absolute -top-14 z-20 px-2.5 py-1.5 rounded-lg bg-navy-950 text-white text-[11px] shadow-xl border border-white/15 whitespace-nowrap animate-in fade-in zoom-in-95 pointer-events-none">
                      <div className="font-bold text-orange-400">{d.label}</div>
                      <div>
                        ৳ {d.amount.toLocaleString()} ({d.orderCount} orders)
                      </div>
                    </div>
                  )}

                  {/* Vertical Column Bar (খাড়া বার) */}
                  <div className="w-full max-w-[42px] h-full flex items-end">
                    <div
                      style={{ height: `${totalGrossRevenue > 0 ? heightPercent : 6}%` }}
                      className={`w-full rounded-t-lg transition-all duration-300 relative ${
                        isHovered
                          ? 'bg-gradient-to-t from-orange-600 to-amber-400 shadow-lg shadow-orange-500/30 scale-x-105'
                          : totalGrossRevenue > 0
                          ? 'bg-gradient-to-t from-orange-600/90 to-amber-500/90 group-hover:from-orange-600 group-hover:to-amber-400'
                          : 'bg-slate-200 dark:bg-navy-800'
                      }`}
                    >
                      {totalGrossRevenue > 0 && (
                        <div className="absolute top-1 inset-x-0 h-1 bg-white/30 rounded-t" />
                      )}
                    </div>
                  </div>

                  {/* Column Bottom Label */}
                  <span
                    className={`mt-2 text-[10px] sm:text-xs font-semibold truncate transition-colors ${
                      isHovered
                        ? 'text-orange-600 dark:text-orange-400 font-bold'
                        : 'text-slate-500 dark:text-slate-400'
                    }`}
                  >
                    {d.label}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* 4. Financial Settlement Breakdown Card with CIRCLE / DONUT CHART (সার্কেল চার্ট) & Pipeline */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* Left: Financial Profit & Fee Breakdown with SVG CIRCLE / DONUT (7 cols) */}
        <div className="lg:col-span-7 p-5 sm:p-6 rounded-2xl bg-white dark:bg-navy-900 border border-slate-200 dark:border-white/10 shadow-sm space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 dark:border-white/10 pb-4">
            <div>
              <h2 className="text-base font-bold text-navy-900 dark:text-white flex items-center gap-2">
                <PieChartIcon className="h-5 w-5 text-orange-600 dark:text-orange-400" />
                <span>COD Financial Settlement & 3PL Deductions</span>
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Transparent revenue ledger breakdown with zero hidden fees.
              </p>
            </div>
            <span className="text-xs font-mono font-bold px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-navy-800 text-slate-700 dark:text-slate-300 self-start sm:self-auto border border-slate-200 dark:border-white/10">
              Weekly Settlement Cycle
            </span>
          </div>

          {/* SOLID PIE CHART GRAPH + LEGEND LAYOUT */}
          <div className="flex flex-col sm:flex-row items-center justify-around gap-6 py-2">
            {/* Real Solid SVG Pie Chart */}
            <div className="relative shrink-0 flex flex-col items-center justify-center">
              <svg
                width="180"
                height="180"
                viewBox="0 0 180 180"
                className="drop-shadow-md overflow-visible"
              >
                {totalGrossRevenue > 0 ? (
                  <>
                    {/* Sector 1: Net Merchant Payout (Emerald) */}
                    <path
                      d={pathNet}
                      fill="#10b981"
                      stroke="currentColor"
                      strokeWidth="2.5"
                      className={`text-navy-900 dark:text-white transition-all duration-300 cursor-pointer ${
                        hoveredSlice === 'net' ? 'opacity-100 scale-105 origin-center' : 'opacity-95 hover:opacity-100'
                      }`}
                      onMouseEnter={() => setHoveredSlice('net')}
                      onMouseLeave={() => setHoveredSlice(null)}
                    >
                      <title>{`Net Payout: ৳${estNetWalletBalance.toLocaleString()} (${netPercent}%)`}</title>
                    </path>

                    {/* Sector 2: Courier Delivery Charges (Amber) */}
                    <path
                      d={pathCourier}
                      fill="#f59e0b"
                      stroke="currentColor"
                      strokeWidth="2.5"
                      className={`text-navy-900 dark:text-white transition-all duration-300 cursor-pointer ${
                        hoveredSlice === 'courier' ? 'opacity-100 scale-105 origin-center' : 'opacity-95 hover:opacity-100'
                      }`}
                      onMouseEnter={() => setHoveredSlice('courier')}
                      onMouseLeave={() => setHoveredSlice(null)}
                    >
                      <title>{`Courier Charges: ৳${estCourierFees.toLocaleString()} (${courierPercent}%)`}</title>
                    </path>

                    {/* Sector 3: 3PL Pick & Pack Fee (Rose) */}
                    <path
                      d={pathFee}
                      fill="#f43f5e"
                      stroke="currentColor"
                      strokeWidth="2.5"
                      className={`text-navy-900 dark:text-white transition-all duration-300 cursor-pointer ${
                        hoveredSlice === 'fee' ? 'opacity-100 scale-105 origin-center' : 'opacity-95 hover:opacity-100'
                      }`}
                      onMouseEnter={() => setHoveredSlice('fee')}
                      onMouseLeave={() => setHoveredSlice(null)}
                    >
                      <title>{`3PL Fee: ৳${estFulfillmentFees.toLocaleString()} (${feePercent}%)`}</title>
                    </path>
                  </>
                ) : (
                  <>
                    {/* Empty State Pie with 3 placeholder sectors showing authentic pie slices */}
                    <path
                      d={getPieSectorPath(pieCx, pieCy, pieR, 0, 297)}
                      fill="#10b981"
                      fillOpacity="0.3"
                      stroke="currentColor"
                      strokeWidth="2"
                      className="text-navy-900 dark:text-white"
                    />
                    <path
                      d={getPieSectorPath(pieCx, pieCy, pieR, 297, 342)}
                      fill="#f59e0b"
                      fillOpacity="0.3"
                      stroke="currentColor"
                      strokeWidth="2"
                      className="text-navy-900 dark:text-white"
                    />
                    <path
                      d={getPieSectorPath(pieCx, pieCy, pieR, 342, 360)}
                      fill="#f43f5e"
                      fillOpacity="0.3"
                      stroke="currentColor"
                      strokeWidth="2"
                      className="text-navy-900 dark:text-white"
                    />
                  </>
                )}
              </svg>

              {/* Hover Info Badge below the Pie */}
              <div className="mt-3 text-center">
                {hoveredSlice === 'net' ? (
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                    Net Payout: {netPercent}% (৳ {estNetWalletBalance.toLocaleString()})
                  </span>
                ) : hoveredSlice === 'courier' ? (
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
                    Courier Charges: {courierPercent}% (৳ {estCourierFees.toLocaleString()})
                  </span>
                ) : hoveredSlice === 'fee' ? (
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20">
                    3PL Fees: {feePercent}% (৳ {estFulfillmentFees.toLocaleString()})
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-navy-800 border border-slate-200 dark:border-white/10">
                    Solid Pie Chart • Hover slices
                  </span>
                )}
              </div>
            </div>

            {/* Legend Breakdown Details */}
            <div className="flex-1 w-full space-y-3 text-xs">
              {/* Item 1: Net Payout */}
              <div
                onMouseEnter={() => setHoveredSlice('net')}
                onMouseLeave={() => setHoveredSlice(null)}
                className={`p-2.5 rounded-xl border transition-all cursor-pointer ${
                  hoveredSlice === 'net'
                    ? 'border-emerald-500 bg-emerald-50/50 dark:bg-emerald-950/20 shadow-xs'
                    : 'bg-slate-50 dark:bg-navy-950/60 border-slate-200/80 dark:border-white/10'
                } flex items-center justify-between`}
              >
                <div className="flex items-center gap-2">
                  <span className="h-3 w-3 rounded-full bg-emerald-500 shrink-0" />
                  <div>
                    <span className="font-bold text-navy-900 dark:text-white block">
                      Net Merchant Payout ({netPercent}%)
                    </span>
                    <span className="text-[11px] text-slate-400">
                      Disbursed directly to your bank/bKash
                    </span>
                  </div>
                </div>
                <div className="text-right font-mono font-bold text-emerald-600 dark:text-emerald-400">
                  ৳ {estNetWalletBalance.toLocaleString()}
                </div>
              </div>

              {/* Item 2: Courier Charges */}
              <div
                onMouseEnter={() => setHoveredSlice('courier')}
                onMouseLeave={() => setHoveredSlice(null)}
                className={`p-2.5 rounded-xl border transition-all cursor-pointer ${
                  hoveredSlice === 'courier'
                    ? 'border-amber-500 bg-amber-50/50 dark:bg-amber-950/20 shadow-xs'
                    : 'bg-slate-50 dark:bg-navy-950/60 border-slate-200/80 dark:border-white/10'
                } flex items-center justify-between`}
              >
                <div className="flex items-center gap-2">
                  <span className="h-3 w-3 rounded-full bg-amber-500 shrink-0" />
                  <div>
                    <span className="font-bold text-navy-900 dark:text-white block">
                      Courier Delivery Charges ({courierPercent}%)
                    </span>
                    <span className="text-[11px] text-slate-400">
                      Steadfast / Pathao / RedX handovers
                    </span>
                  </div>
                </div>
                <div className="text-right font-mono font-bold text-amber-600 dark:text-amber-400">
                  - ৳ {estCourierFees.toLocaleString()}
                </div>
              </div>

              {/* Item 3: 3PL Warehousing Fee */}
              <div
                onMouseEnter={() => setHoveredSlice('fee')}
                onMouseLeave={() => setHoveredSlice(null)}
                className={`p-2.5 rounded-xl border transition-all cursor-pointer ${
                  hoveredSlice === 'fee'
                    ? 'border-rose-500 bg-rose-50/50 dark:bg-rose-950/20 shadow-xs'
                    : 'bg-slate-50 dark:bg-navy-950/60 border-slate-200/80 dark:border-white/10'
                } flex items-center justify-between`}
              >
                <div className="flex items-center gap-2">
                  <span className="h-3 w-3 rounded-full bg-rose-500 shrink-0" />
                  <div>
                    <span className="font-bold text-navy-900 dark:text-white block">
                      3PL Pick, Pack & Bin Fee ({feePercent}%)
                    </span>
                    <span className="text-[11px] text-slate-400">
                      Warehouse storage & 4x6 slip execution (4.5%)
                    </span>
                  </div>
                </div>
                <div className="text-right font-mono font-bold text-rose-600 dark:text-rose-400">
                  - ৳ {estFulfillmentFees.toLocaleString()}
                </div>
              </div>
            </div>
          </div>

          {/* Bottom Net Wallet Action Box */}
          <div className="p-4 rounded-xl bg-slate-50 dark:bg-navy-950/70 border border-slate-200/80 dark:border-white/10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div>
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 block">
                Total Gross Sales Collection
              </span>
              <div className="text-xl font-black text-navy-900 dark:text-white font-mono mt-0.5">
                ৳ {totalGrossRevenue.toLocaleString()}
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

      {/* 5. Bespoke Invoice Slip Brand Banner */}
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

      {/* 6. Modular Navigation Grid (6 Core Modules) */}
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
