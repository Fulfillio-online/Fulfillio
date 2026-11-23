'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Package,
  ShoppingCart,
  Truck,
  CreditCard,
  Key,
  Layers,
  ArrowRight,
  TrendingUp,
  ArrowUpRight,
  Boxes,
  CheckCircle2,
  Clock,
  RotateCw,
  Plus,
  DollarSign,
  AlertTriangle,
  BarChart3,
  Calendar,
  PieChart as PieChartIcon,
  ShoppingBag,
  Tag,
  Eye,
  FileText,
  Wallet,
  Activity,
  Ban,
  PackageCheck,
} from 'lucide-react';
import { MerchantTab, MerchantOrderItem } from '../../types';
import { useMerchant } from '../../MerchantContext';

interface MerchantOverviewTabProps {
  memoCount: number;
  onSelectTab: (tab: MerchantTab) => void;
}

type MerchantTimeframe = 'today' | '7d' | '30d' | '3m' | '6m' | '1y';
type OrderQuickFilter = 'ALL' | 'PENDING' | 'IN_TRANSIT' | 'DELIVERED';

interface TimeframeDataPoint {
  label: string;
  amount: number;
  orderCount: number;
}

// Helper to calculate solid SVG Pie Slice path (triangular wedge meeting at center cx, cy)
function getPieSectorPath(
  cx: number,
  cy: number,
  r: number,
  startAngleDeg: number,
  endAngleDeg: number
): string {
  const clampedDiff = Math.min(359.99, Math.max(0.01, endAngleDeg - startAngleDeg));
  const actualEnd = startAngleDeg + clampedDiff;
  const rad = Math.PI / 180;
  const startRad = (startAngleDeg - 90) * rad;
  const endRad = (actualEnd - 90) * rad;

  const x1 = cx + r * Math.cos(startRad);
  const y1 = cy + r * Math.sin(startRad);
  const x2 = cx + r * Math.cos(endRad);
  const y2 = cy + r * Math.sin(endRad);

  const largeArcFlag = clampedDiff > 180 ? 1 : 0;

  return `M ${cx} ${cy} L ${x1.toFixed(2)} ${y1.toFixed(2)} A ${r} ${r} 0 ${largeArcFlag} 1 ${x2.toFixed(2)} ${y2.toFixed(2)} Z`;
}

export function MerchantOverviewTab({ memoCount, onSelectTab }: MerchantOverviewTabProps) {
  const router = useRouter();
  const { profile, products, orders, asns } = useMerchant();

  const [timeframe, setTimeframe] = useState<MerchantTimeframe>('7d');
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [activeBarIndex, setActiveBarIndex] = useState<number | null>(null);
  const [hoveredSlice, setHoveredSlice] = useState<'net' | 'courier' | 'fee' | null>(null);
  const [orderFilter, setOrderFilter] = useState<OrderQuickFilter>('ALL');
  const [productWidgetTab, setProductWidgetTab] = useState<'TOP_SELLING' | 'STOCK_ALERTS'>('TOP_SELLING');

  const handleRefresh = () => {
    setIsRefreshing(true);
    setTimeout(() => {
      setIsRefreshing(false);
    }, 500);
  };

  // ---------------------------------------------------------------------------
  // E-Commerce Core Metrics & Live Calculations
  // ---------------------------------------------------------------------------
  const validOrders = useMemo(
    () => orders.filter((o) => o.status !== 'CANCELLED'),
    [orders]
  );

  const totalOrdersCount = orders.length;
  const cancelledOrdersCount = orders.filter((o) => o.status === 'CANCELLED').length;
  const totalGrossRevenue = validOrders.reduce((sum, o) => sum + (Number(o.amount) || 0), 0);
  const avgOrderValue = validOrders.length > 0 ? Math.round(totalGrossRevenue / validOrders.length) : 0;

  // Order Pipeline Counts
  const pendingOrdersCount = orders.filter(
    (o) => o.status === 'PENDING' || o.status === 'ALLOCATED'
  ).length;
  const packedOrdersCount = orders.filter(
    (o) => o.status === 'PICKED' || o.status === 'PACKED'
  ).length;
  const dispatchedOrdersCount = orders.filter((o) => o.status === 'DISPATCHED').length;
  const deliveredOrdersCount = orders.filter((o) => o.status === 'DELIVERED').length;
  const fulfilledAndTransitCount = dispatchedOrdersCount + deliveredOrdersCount;

  // Inventory & Catalog Metrics
  const totalStockUnits = products.reduce((sum, p) => sum + (Number(p.stock) || 0), 0);
  const totalInventoryValue = products.reduce(
    (sum, p) => sum + (Number(p.stock) || 0) * (Number(p.price) || 0),
    0
  );
  const activeSkusCount = products.filter(
    (p) => p.status !== 'DRAFT' && !p.isDraft
  ).length;
  const lowStockProducts = useMemo(
    () =>
      products.filter(
        (p) => p.status !== 'DRAFT' && !p.isDraft && (p.stock || 0) > 0 && (p.stock || 0) <= 15
      ),
    [products]
  );
  const outOfStockProducts = useMemo(
    () =>
      products.filter(
        (p) => p.status !== 'DRAFT' && !p.isDraft && (p.stock || 0) === 0
      ),
    [products]
  );

  // 3PL Financial Settlement Calculations
  const estFulfillmentFees = Math.round(totalGrossRevenue * 0.045);
  const estCourierFees = validOrders.length * 60;
  const estNetWalletBalance = Math.max(
    0,
    totalGrossRevenue - estFulfillmentFees - estCourierFees
  );

  // Solid Pie Chart Percentages
  const netPercent =
    totalGrossRevenue > 0
      ? Math.max(0, Math.round((estNetWalletBalance / totalGrossRevenue) * 100))
      : 82;
  const feePercent = 5;
  const courierPercent =
    totalGrossRevenue > 0 ? Math.max(0, 100 - netPercent - feePercent) : 13;

  const angleNet = (netPercent / 100) * 360;
  const angleCourier = (courierPercent / 100) * 360;

  const netStart = 0;
  const netEnd = angleNet;
  const courierStart = netEnd;
  const courierEnd = courierStart + angleCourier;
  const feeStart = courierEnd;
  const feeEnd = 360;

  const pieCx = 86;
  const pieCy = 86;
  const pieR = 76;

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

  // Vertical Column Chart Data
  const barChartData: TimeframeDataPoint[] = useMemo(() => {
    if (totalGrossRevenue === 0 || validOrders.length === 0) {
      switch (timeframe) {
        case 'today':
          return ['08:00', '10:00', '12:00', '14:00', '16:00', '18:00', '20:00'].map((label) => ({
            label,
            amount: 0,
            orderCount: 0,
          }));
        case '7d':
          return ['Sat', 'Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri'].map((label) => ({
            label,
            amount: 0,
            orderCount: 0,
          }));
        case '30d':
          return ['Week 1', 'Week 2', 'Week 3', 'Week 4'].map((label) => ({
            label,
            amount: 0,
            orderCount: 0,
          }));
        case '3m':
          return ['2 Months Ago', 'Last Month', 'This Month'].map((label) => ({
            label,
            amount: 0,
            orderCount: 0,
          }));
        case '6m':
          return ['Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov'].map((label) => ({
            label,
            amount: 0,
            orderCount: 0,
          }));
        case '1y':
          return ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'].map(
            (label) => ({ label, amount: 0, orderCount: 0 })
          );
      }
    }

    const rev = totalGrossRevenue;
    const ord = validOrders.length;

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
          { label: 'Jun', amount: Math.round(rev * 0.12), orderCount: Math.max(1, Math.round(ord * 0.12)) },
          { label: 'Jul', amount: Math.round(rev * 0.14), orderCount: Math.max(1, Math.round(ord * 0.14)) },
          { label: 'Aug', amount: Math.round(rev * 0.18), orderCount: Math.max(1, Math.round(ord * 0.18)) },
          { label: 'Sep', amount: Math.round(rev * 0.16), orderCount: Math.max(1, Math.round(ord * 0.16)) },
          { label: 'Oct', amount: Math.round(rev * 0.22), orderCount: Math.max(1, Math.round(ord * 0.22)) },
          { label: 'Nov', amount: Math.round(rev * 0.18), orderCount: Math.max(1, Math.round(ord * 0.18)) },
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
  }, [timeframe, totalGrossRevenue, validOrders.length]);

  const maxBarAmount = useMemo(() => {
    const max = Math.max(...barChartData.map((d) => d.amount), 0);
    return max > 0 ? max : 1000;
  }, [barChartData]);

  // Filtered Recent Orders for the Live Orders Table
  const filteredRecentOrders = useMemo(() => {
    const list = orders.filter((o) => {
      if (orderFilter === 'ALL') return true;
      if (orderFilter === 'PENDING') {
        return o.status === 'PENDING' || o.status === 'ALLOCATED' || o.status === 'PICKED' || o.status === 'PACKED';
      }
      if (orderFilter === 'IN_TRANSIT') return o.status === 'DISPATCHED';
      if (orderFilter === 'DELIVERED') return o.status === 'DELIVERED';
      return true;
    });
    return list.slice(0, 6);
  }, [orders, orderFilter]);

  // Top Selling Products Computation
  const topSellingProducts = useMemo(() => {
    return [...products]
      .filter((p) => p.status !== 'DRAFT' && !p.isDraft)
      .map((p) => {
        const matchingOrders = validOrders.filter(
          (o) =>
            o.productId === p.id ||
            (o.items && o.items.toLowerCase().includes(p.title.toLowerCase()))
        );
        const unitsSold =
          matchingOrders.reduce((acc, o) => acc + (Number(o.qty) || 1), 0) ||
          p.totalOrders ||
          0;
        const revenue = unitsSold * (Number(p.price) || 0);
        return {
          ...p,
          unitsSold,
          revenue,
        };
      })
      .sort((a, b) => b.revenue - a.revenue || b.stock - a.stock)
      .slice(0, 5);
  }, [products, validOrders]);

  // Category Breakdown Computation
  const categoryBreakdown = useMemo(() => {
    const map = new Map<string, { count: number; stock: number; value: number }>();
    products.forEach((p) => {
      const cat = p.category || 'Fashion & Apparel';
      const curr = map.get(cat) || { count: 0, stock: 0, value: 0 };
      curr.count += 1;
      curr.stock += Number(p.stock) || 0;
      curr.value += (Number(p.stock) || 0) * (Number(p.price) || 0);
      map.set(cat, curr);
    });
    const entries = Array.from(map.entries()).map(([name, stats]) => ({
      name,
      ...stats,
    }));
    const totalVal = entries.reduce((s, e) => s + e.value, 0) || 1;
    return entries
      .sort((a, b) => b.value - a.value)
      .slice(0, 4)
      .map((e) => ({
        ...e,
        sharePercent: Math.max(5, Math.round((e.value / totalVal) * 100)),
      }));
  }, [products]);

  // Helper for Order Status Badge (Strictly Pure Informative Text <span>)
  const renderOrderStatusBadge = (status: MerchantOrderItem['status']) => {
    switch (status) {
      case 'DELIVERED':
        return (
          <span className="inline-flex items-center justify-center text-[10px] uppercase font-bold tracking-wider px-2.5 py-0.5 rounded-full border select-none bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30">
            Delivered
          </span>
        );
      case 'DISPATCHED':
        return (
          <span className="inline-flex items-center justify-center text-[10px] uppercase font-bold tracking-wider px-2.5 py-0.5 rounded-full border select-none bg-indigo-50 dark:bg-indigo-600/10 text-indigo-700 dark:text-indigo-300 border-indigo-200 dark:border-indigo-500/30">
            In Transit
          </span>
        );
      case 'PICKED':
      case 'PACKED':
        return (
          <span className="inline-flex items-center justify-center text-[10px] uppercase font-bold tracking-wider px-2.5 py-0.5 rounded-full border select-none bg-indigo-50 dark:bg-indigo-600/10 text-indigo-700 dark:text-indigo-300 border-indigo-200 dark:border-indigo-500/30">
            {status}
          </span>
        );
      case 'CANCELLED':
        return (
          <span className="inline-flex items-center justify-center text-[10px] uppercase font-bold tracking-wider px-2.5 py-0.5 rounded-full border select-none bg-rose-500/15 text-rose-600 dark:text-rose-400 border-rose-500/30">
            Cancelled
          </span>
        );
      case 'PENDING':
      case 'ALLOCATED':
      default:
        return (
          <span className="inline-flex items-center justify-center text-[10px] uppercase font-bold tracking-wider px-2.5 py-0.5 rounded-full border select-none bg-amber-500/15 text-amber-600 dark:text-amber-300 border-amber-500/30">
            {status === 'ALLOCATED' ? 'Allocated' : 'Pending'}
          </span>
        );
    }
  };

  return (
    <div className="space-y-6">
      {/* =====================================================================
          1. E-COMMERCE STORE ADMIN HEADER & QUICK ACTIONS BAR
      ===================================================================== */}
      <div className="p-5 sm:p-6 rounded-2xl bg-white dark:bg-navy-900 border border-slate-200/80 dark:border-white/10 shadow-xs flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2.5 flex-wrap">
            <h1 className="text-xl sm:text-2xl font-extrabold tracking-tight text-navy-900 dark:text-white">
              {profile.storeName || 'Merchant Store'} Dashboard
            </h1>
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 select-none">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
              <span>Store Live • {profile.merchantCode}</span>
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
            Welcome back, <strong className="text-navy-900 dark:text-white font-semibold">{profile.ownerName || 'Partner'}</strong>. Here is what is happening with your store today.
          </p>
        </div>

        {/* Store Controls & E-Commerce Primary Actions */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Timeframe Selector */}
          <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-slate-50 dark:bg-navy-950 border border-slate-200/80 dark:border-white/10 text-xs font-semibold text-navy-900 dark:text-white hover:border-orange-500/40 transition-colors">
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
                  className="bg-white dark:bg-navy-900 text-navy-900 dark:text-white"
                >
                  {opt.label}
                </option>
              ))}
            </select>
          </div>

          <button
            type="button"
            onClick={handleRefresh}
            title="Refresh store metrics"
            className="p-2 rounded-xl bg-slate-50 dark:bg-navy-950 border border-slate-200/80 dark:border-white/10 text-slate-600 dark:text-slate-300 hover:text-orange-600 dark:hover:text-orange-400 hover:border-orange-500/30 transition-all cursor-pointer active:scale-95"
          >
            <RotateCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin text-orange-500' : ''}`} />
          </button>

          <div className="h-5 w-px bg-slate-200 dark:bg-white/10 hidden sm:block mx-0.5" />

          {/* Quick E-Commerce Action: Add Product */}
          <Link
            href="/merchant/products/new"
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200/80 dark:bg-navy-800 dark:hover:bg-navy-700 text-navy-900 dark:text-white font-bold text-xs border border-slate-200/80 dark:border-white/10 transition-all cursor-pointer active:scale-95"
          >
            <Plus className="h-3.5 w-3.5 text-orange-600 dark:text-orange-400" />
            <span>Add Product</span>
          </Link>

          {/* Quick E-Commerce Action: Create / View Orders */}
          <button
            type="button"
            onClick={() => onSelectTab('orders')}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-orange-600 hover:bg-orange-500 text-white font-bold text-xs shadow-md shadow-orange-600/20 transition-all cursor-pointer active:scale-95"
          >
            <ShoppingBag className="h-3.5 w-3.5" />
            <span>Manage Orders</span>
          </button>
        </div>
      </div>

      {/* =====================================================================
          2. EXECUTIVE E-COMMERCE KPI SCORECARDS (4 CARDS)
      ===================================================================== */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* KPI 1: Total Sales / Gross Revenue */}
        <div className="p-5 rounded-2xl bg-white dark:bg-navy-900 border border-slate-200/80 dark:border-white/10 shadow-xs flex flex-col justify-between transition-all hover:border-orange-500/30">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-[11px] uppercase font-bold tracking-wider text-slate-500 dark:text-slate-400">
                Total Gross Sales
              </span>
              <div className="h-9 w-9 rounded-xl bg-orange-500/10 border border-orange-500/20 text-orange-600 dark:text-orange-400 flex items-center justify-center">
                <DollarSign className="h-4 w-4" />
              </div>
            </div>
            <div className="mt-3">
              <div className="text-2xl sm:text-3xl font-extrabold text-navy-900 dark:text-white tabular-nums tracking-tight">
                ৳ {totalGrossRevenue.toLocaleString()}
              </div>
              <div className="flex items-center gap-1.5 mt-1.5 text-xs">
                <span className="inline-flex items-center gap-0.5 font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded-md">
                  <ArrowUpRight className="h-3 w-3" />
                  14.8%
                </span>
                <span className="text-slate-500 dark:text-slate-400">
                  AOV: <strong className="text-navy-900 dark:text-white font-mono">৳{avgOrderValue.toLocaleString()}</strong>
                </span>
              </div>
            </div>
          </div>
          <div className="mt-4 pt-3 border-t border-slate-100 dark:border-white/10 flex items-center justify-between text-xs">
            <span className="text-slate-500 dark:text-slate-400">Active Orders Value</span>
            <button
              type="button"
              onClick={() => onSelectTab('orders')}
              className="font-bold text-orange-600 dark:text-orange-400 hover:underline flex items-center gap-1 cursor-pointer"
            >
              <span>Sales report</span>
              <ArrowRight className="h-3 w-3" />
            </button>
          </div>
        </div>

        {/* KPI 2: Net COD Payout / Wallet */}
        <div className="p-5 rounded-2xl bg-white dark:bg-navy-900 border border-slate-200/80 dark:border-white/10 shadow-xs flex flex-col justify-between transition-all hover:border-orange-500/30">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-[11px] uppercase font-bold tracking-wider text-slate-500 dark:text-slate-400">
                Net Claimable Payout
              </span>
              <div className="h-9 w-9 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                <Wallet className="h-4 w-4" />
              </div>
            </div>
            <div className="mt-3">
              <div className="text-2xl sm:text-3xl font-extrabold text-emerald-600 dark:text-emerald-400 tabular-nums tracking-tight">
                ৳ {estNetWalletBalance.toLocaleString()}
              </div>
              <div className="flex items-center gap-1.5 mt-1.5 text-xs text-slate-500 dark:text-slate-400">
                <span>Net margin:</span>
                <strong className="text-navy-900 dark:text-white font-mono">{netPercent}%</strong>
                <span>after fees</span>
              </div>
            </div>
          </div>
          <div className="mt-4 pt-3 border-t border-slate-100 dark:border-white/10 flex items-center justify-between text-xs">
            <span className="text-slate-500 dark:text-slate-400">
              {profile.payoutMethod || 'Bank / MFS'}
            </span>
            <button
              type="button"
              onClick={() => onSelectTab('billing')}
              className="font-bold text-emerald-600 dark:text-emerald-400 hover:underline flex items-center gap-1 cursor-pointer"
            >
              <span>Withdraw</span>
              <ArrowRight className="h-3 w-3" />
            </button>
          </div>
        </div>

        {/* KPI 3: Total Orders & Fulfillment */}
        <div className="p-5 rounded-2xl bg-white dark:bg-navy-900 border border-slate-200/80 dark:border-white/10 shadow-xs flex flex-col justify-between transition-all hover:border-orange-500/30">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-[11px] uppercase font-bold tracking-wider text-slate-500 dark:text-slate-400">
                Total Store Orders
              </span>
              <div className="h-9 w-9 rounded-xl bg-indigo-50 dark:bg-indigo-600/10 border border-indigo-200 dark:border-indigo-500/30 text-indigo-700 dark:text-indigo-300 flex items-center justify-center">
                <ShoppingCart className="h-4 w-4" />
              </div>
            </div>
            <div className="mt-3">
              <div className="flex items-baseline gap-2">
                <span className="text-2xl sm:text-3xl font-extrabold text-navy-900 dark:text-white tabular-nums tracking-tight">
                  {totalOrdersCount}
                </span>
                <span className="text-xs font-semibold text-slate-400">Orders</span>
              </div>
              <div className="flex items-center gap-2 mt-1.5 text-xs">
                <span className="text-amber-600 dark:text-amber-300 font-semibold">
                  {pendingOrdersCount + packedOrdersCount} Processing
                </span>
                <span className="text-slate-300 dark:text-slate-700">•</span>
                <span className="text-emerald-600 dark:text-emerald-400 font-semibold">
                  {fulfilledAndTransitCount} Shipped
                </span>
              </div>
            </div>
          </div>
          <div className="mt-4 pt-3 border-t border-slate-100 dark:border-white/10 flex items-center justify-between text-xs">
            <span className="text-slate-500 dark:text-slate-400">Dispatch SLA</span>
            <span className="font-bold text-emerald-600 dark:text-emerald-400">99.8% On-Time</span>
          </div>
        </div>

        {/* KPI 4: Products & Warehouse Inventory */}
        <div className="p-5 rounded-2xl bg-white dark:bg-navy-900 border border-slate-200/80 dark:border-white/10 shadow-xs flex flex-col justify-between transition-all hover:border-orange-500/30">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-[11px] uppercase font-bold tracking-wider text-slate-500 dark:text-slate-400">
                Inventory &amp; Catalog
              </span>
              <div className="h-9 w-9 rounded-xl bg-amber-500/15 border border-amber-500/30 text-amber-600 dark:text-amber-300 flex items-center justify-center">
                <Boxes className="h-4 w-4" />
              </div>
            </div>
            <div className="mt-3">
              <div className="flex items-baseline gap-2">
                <span className="text-2xl sm:text-3xl font-extrabold text-navy-900 dark:text-white tabular-nums tracking-tight">
                  {totalStockUnits.toLocaleString()}
                </span>
                <span className="text-xs font-semibold text-slate-400">Units ({activeSkusCount} SKUs)</span>
              </div>
              <div className="flex items-center gap-2 mt-1.5 text-xs">
                {outOfStockProducts.length > 0 || lowStockProducts.length > 0 ? (
                  <span className="text-amber-600 dark:text-amber-300 font-semibold flex items-center gap-1">
                    <AlertTriangle className="h-3.5 w-3.5" />
                    {lowStockProducts.length} Low · {outOfStockProducts.length} Out of stock
                  </span>
                ) : (
                  <span className="text-emerald-600 dark:text-emerald-400 font-semibold flex items-center gap-1">
                    <CheckCircle2 className="h-3.5 w-3.5" />
                    All SKUs healthy in stock
                  </span>
                )}
              </div>
            </div>
          </div>
          <div className="mt-4 pt-3 border-t border-slate-100 dark:border-white/10 flex items-center justify-between text-xs">
            <span className="text-slate-500 dark:text-slate-400">
              Stock Value: <strong className="text-navy-900 dark:text-white font-mono">৳{totalInventoryValue.toLocaleString()}</strong>
            </span>
            <button
              type="button"
              onClick={() => onSelectTab('products')}
              className="font-bold text-orange-600 dark:text-orange-400 hover:underline flex items-center gap-1 cursor-pointer"
            >
              <span>Catalog</span>
              <ArrowRight className="h-3 w-3" />
            </button>
          </div>
        </div>
      </div>

      {/* =====================================================================
          3. ANALYTICS ROW: REVENUE BAR CHART (7 COLS) + SOLID PIE CHART (5 COLS)
      ===================================================================== */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* Left: Sales & Order Velocity Column Chart (7 cols) */}
        <div className="lg:col-span-7 p-5 sm:p-6 rounded-2xl bg-white dark:bg-navy-900 border border-slate-200/80 dark:border-white/10 shadow-xs flex flex-col justify-between space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 dark:border-white/10 pb-4">
            <div>
              <h2 className="text-base font-bold text-navy-900 dark:text-white flex items-center gap-2">
                <BarChart3 className="h-5 w-5 text-orange-600 dark:text-orange-400" />
                <span>Sales &amp; Order Velocity</span>
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Revenue performance and order volume across {timeframeOptions.find((o) => o.id === timeframe)?.label}.
              </p>
            </div>

            <div className="flex items-center gap-3">
              <div className="text-right">
                <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400 block">
                  Period Revenue
                </span>
                <span className="text-sm font-extrabold font-mono text-navy-900 dark:text-white">
                  ৳ {totalGrossRevenue.toLocaleString()}
                </span>
              </div>
              <div className="h-7 w-px bg-slate-200 dark:bg-white/10" />
              <div className="text-right">
                <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400 block">
                  Orders
                </span>
                <span className="text-sm font-extrabold font-mono text-orange-600 dark:text-orange-400">
                  {validOrders.length}
                </span>
              </div>
            </div>
          </div>

          {/* Vertical Column Chart Canvas */}
          <div className="relative pt-8 pb-2">
            {totalGrossRevenue === 0 && (
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-white/75 dark:bg-navy-900/75 backdrop-blur-2xs z-10 rounded-xl">
                <BarChart3 className="h-8 w-8 text-slate-400 mb-1.5 opacity-60" />
                <p className="text-xs font-bold text-navy-900 dark:text-white">
                  No sales recorded in this period
                </p>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Create or sync orders to track live revenue velocity.
                </p>
              </div>
            )}

            {/* Background Grid Lines */}
            <div className="absolute inset-x-0 top-8 bottom-8 flex flex-col justify-between pointer-events-none opacity-40">
              <div className="border-b border-dashed border-slate-200 dark:border-white/10 w-full" />
              <div className="border-b border-dashed border-slate-200 dark:border-white/10 w-full" />
              <div className="border-b border-dashed border-slate-200 dark:border-white/10 w-full" />
              <div className="border-b border-slate-200 dark:border-white/20 w-full" />
            </div>

            {/* Bars */}
            <div className="h-52 flex items-end justify-between gap-2 sm:gap-4 px-2 sm:px-4 relative z-0">
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
                    {isHovered && (
                      <div className="absolute -top-14 z-20 px-2.5 py-1.5 rounded-lg bg-navy-950 text-white text-[11px] shadow-xl border border-white/15 whitespace-nowrap pointer-events-none">
                        <div className="font-bold text-orange-400">{d.label}</div>
                        <div className="font-mono">
                          ৳ {d.amount.toLocaleString()} ({d.orderCount} orders)
                        </div>
                      </div>
                    )}

                    <div className="w-full max-w-[40px] h-full flex items-end">
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

          {/* Chart Footer Bar */}
          <div className="pt-3 border-t border-slate-100 dark:border-white/10 flex flex-wrap items-center justify-between gap-2 text-xs text-slate-500 dark:text-slate-400">
            <div className="flex items-center gap-4">
              <span className="inline-flex items-center gap-1.5">
                <span className="h-2.5 w-2.5 rounded-xs bg-gradient-to-t from-orange-600 to-amber-400" />
                <span>Gross Order Value (৳)</span>
              </span>
              <span>•</span>
              <span>Hover bars for order count breakdown</span>
            </div>
            <span className="font-mono font-semibold text-navy-900 dark:text-white">
              Peak Period: ৳ {maxBarAmount.toLocaleString()}
            </span>
          </div>
        </div>

        {/* Right: COD Financial Settlement Solid SVG Pie Chart (5 cols) */}
        <div className="lg:col-span-5 p-5 sm:p-6 rounded-2xl bg-white dark:bg-navy-900 border border-slate-200/80 dark:border-white/10 shadow-xs flex flex-col justify-between space-y-4">
          <div className="flex items-center justify-between gap-2 border-b border-slate-100 dark:border-white/10 pb-4">
            <div>
              <h2 className="text-base font-bold text-navy-900 dark:text-white flex items-center gap-2">
                <PieChartIcon className="h-5 w-5 text-orange-600 dark:text-orange-400" />
                <span>COD Settlement Breakdown</span>
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Net merchant payout vs courier &amp; 3PL fees.
              </p>
            </div>
            <span className="text-[11px] font-mono font-bold px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-navy-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-white/10">
              Weekly Payout
            </span>
          </div>

          <div className="flex flex-col sm:flex-row lg:flex-col xl:flex-row items-center justify-around gap-5 py-1">
            {/* Solid SVG Pie Chart */}
            <div className="relative shrink-0 flex flex-col items-center justify-center">
              <svg
                width="172"
                height="172"
                viewBox="0 0 172 172"
                className="drop-shadow-sm overflow-visible"
              >
                {totalGrossRevenue > 0 ? (
                  <>
                    <path
                      d={pathNet}
                      fill="#10b981"
                      stroke="currentColor"
                      strokeWidth="2.5"
                      className={`text-white dark:text-navy-900 transition-all duration-300 cursor-pointer ${
                        hoveredSlice === 'net' ? 'opacity-100 scale-105 origin-center' : 'opacity-95 hover:opacity-100'
                      }`}
                      onMouseEnter={() => setHoveredSlice('net')}
                      onMouseLeave={() => setHoveredSlice(null)}
                    >
                      <title>{`Net Payout: ৳${estNetWalletBalance.toLocaleString()} (${netPercent}%)`}</title>
                    </path>

                    <path
                      d={pathCourier}
                      fill="#f59e0b"
                      stroke="currentColor"
                      strokeWidth="2.5"
                      className={`text-white dark:text-navy-900 transition-all duration-300 cursor-pointer ${
                        hoveredSlice === 'courier' ? 'opacity-100 scale-105 origin-center' : 'opacity-95 hover:opacity-100'
                      }`}
                      onMouseEnter={() => setHoveredSlice('courier')}
                      onMouseLeave={() => setHoveredSlice(null)}
                    >
                      <title>{`Courier Charges: ৳${estCourierFees.toLocaleString()} (${courierPercent}%)`}</title>
                    </path>

                    <path
                      d={pathFee}
                      fill="#f43f5e"
                      stroke="currentColor"
                      strokeWidth="2.5"
                      className={`text-white dark:text-navy-900 transition-all duration-300 cursor-pointer ${
                        hoveredSlice === 'fee' ? 'opacity-100 scale-105 origin-center' : 'opacity-95 hover:opacity-100'
                      }`}
                      onMouseEnter={() => setHoveredSlice('fee')}
                      onMouseLeave={() => setHoveredSlice(null)}
                    >
                      <title>{`3PL Handling Fee: ৳${estFulfillmentFees.toLocaleString()} (${feePercent}%)`}</title>
                    </path>
                  </>
                ) : (
                  <>
                    <path
                      d={getPieSectorPath(pieCx, pieCy, pieR, 0, 297)}
                      fill="#10b981"
                      fillOpacity="0.3"
                      stroke="currentColor"
                      strokeWidth="2"
                      className="text-white dark:text-navy-900"
                    />
                    <path
                      d={getPieSectorPath(pieCx, pieCy, pieR, 297, 342)}
                      fill="#f59e0b"
                      fillOpacity="0.3"
                      stroke="currentColor"
                      strokeWidth="2"
                      className="text-white dark:text-navy-900"
                    />
                    <path
                      d={getPieSectorPath(pieCx, pieCy, pieR, 342, 360)}
                      fill="#f43f5e"
                      fillOpacity="0.3"
                      stroke="currentColor"
                      strokeWidth="2"
                      className="text-white dark:text-navy-900"
                    />
                  </>
                )}
              </svg>

              <div className="mt-2.5 text-center">
                {hoveredSlice === 'net' ? (
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30">
                    Net Payout: {netPercent}% (৳{estNetWalletBalance.toLocaleString()})
                  </span>
                ) : hoveredSlice === 'courier' ? (
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-500/15 text-amber-600 dark:text-amber-300 border border-amber-500/30">
                    Courier: {courierPercent}% (৳{estCourierFees.toLocaleString()})
                  </span>
                ) : hoveredSlice === 'fee' ? (
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-rose-500/15 text-rose-600 dark:text-rose-400 border border-rose-500/30">
                    3PL Fee: {feePercent}% (৳{estFulfillmentFees.toLocaleString()})
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-navy-800 border border-slate-200 dark:border-white/10">
                    Hover slices to inspect
                  </span>
                )}
              </div>
            </div>

            {/* Interactive Legend */}
            <div className="flex-1 w-full space-y-2.5 text-xs">
              <div
                onMouseEnter={() => setHoveredSlice('net')}
                onMouseLeave={() => setHoveredSlice(null)}
                className={`p-2.5 rounded-xl border transition-all cursor-pointer flex items-center justify-between ${
                  hoveredSlice === 'net'
                    ? 'border-emerald-500 bg-emerald-50/50 dark:bg-emerald-950/20'
                    : 'bg-slate-50 dark:bg-navy-950/60 border-slate-200/80 dark:border-white/10'
                }`}
              >
                <div className="flex items-center gap-2">
                  <span className="h-2.5 w-2.5 rounded-full bg-emerald-500 shrink-0" />
                  <div>
                    <span className="font-bold text-navy-900 dark:text-white block">
                      Net Payout ({netPercent}%)
                    </span>
                    <span className="text-[10px] text-slate-400">Your net earnings</span>
                  </div>
                </div>
                <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400">
                  ৳{estNetWalletBalance.toLocaleString()}
                </span>
              </div>

              <div
                onMouseEnter={() => setHoveredSlice('courier')}
                onMouseLeave={() => setHoveredSlice(null)}
                className={`p-2.5 rounded-xl border transition-all cursor-pointer flex items-center justify-between ${
                  hoveredSlice === 'courier'
                    ? 'border-amber-500 bg-amber-50/50 dark:bg-amber-950/20'
                    : 'bg-slate-50 dark:bg-navy-950/60 border-slate-200/80 dark:border-white/10'
                }`}
              >
                <div className="flex items-center gap-2">
                  <span className="h-2.5 w-2.5 rounded-full bg-amber-500 shrink-0" />
                  <div>
                    <span className="font-bold text-navy-900 dark:text-white block">
                      Courier Charges ({courierPercent}%)
                    </span>
                    <span className="text-[10px] text-slate-400">Steadfast / Pathao</span>
                  </div>
                </div>
                <span className="font-mono font-bold text-amber-600 dark:text-amber-300">
                  -৳{estCourierFees.toLocaleString()}
                </span>
              </div>

              <div
                onMouseEnter={() => setHoveredSlice('fee')}
                onMouseLeave={() => setHoveredSlice(null)}
                className={`p-2.5 rounded-xl border transition-all cursor-pointer flex items-center justify-between ${
                  hoveredSlice === 'fee'
                    ? 'border-rose-500 bg-rose-50/50 dark:bg-rose-950/20'
                    : 'bg-slate-50 dark:bg-navy-950/60 border-slate-200/80 dark:border-white/10'
                }`}
              >
                <div className="flex items-center gap-2">
                  <span className="h-2.5 w-2.5 rounded-full bg-rose-500 shrink-0" />
                  <div>
                    <span className="font-bold text-navy-900 dark:text-white block">
                      3PL Pick &amp; Pack ({feePercent}%)
                    </span>
                    <span className="text-[10px] text-slate-400">Storage &amp; 4x6 slip</span>
                  </div>
                </div>
                <span className="font-mono font-bold text-rose-600 dark:text-rose-400">
                  -৳{estFulfillmentFees.toLocaleString()}
                </span>
              </div>
            </div>
          </div>

          <div className="pt-3 border-t border-slate-100 dark:border-white/10 flex items-center justify-between gap-2">
            <div>
              <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400 block">
                Available Balance
              </span>
              <span className="text-base font-extrabold font-mono text-navy-900 dark:text-white">
                ৳ {estNetWalletBalance.toLocaleString()}
              </span>
            </div>
            <button
              type="button"
              onClick={() => onSelectTab('billing')}
              className="px-4 py-2 bg-orange-600 hover:bg-orange-500 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-orange-600/20 cursor-pointer active:scale-95"
            >
              Request COD Payout &rarr;
            </button>
          </div>
        </div>
      </div>

      {/* =====================================================================
          4. CORE E-COMMERCE WORKSPACE: RECENT ORDERS TABLE (7 COLS) + TOP PRODUCTS & ALERTS (5 COLS)
      ===================================================================== */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* Left: Recent Customer Orders Table (7 cols) */}
        <div className="lg:col-span-7 rounded-2xl bg-white dark:bg-navy-900 border border-slate-200/80 dark:border-white/10 shadow-xs flex flex-col justify-between overflow-hidden">
          <div>
            {/* Table Card Header & Filter Pills */}
            <div className="p-5 border-b border-slate-100 dark:border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h2 className="text-base font-bold text-navy-900 dark:text-white flex items-center gap-2">
                  <ShoppingCart className="h-5 w-5 text-orange-600 dark:text-orange-400" />
                  <span>Recent Customer Orders</span>
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Latest e-commerce transactions and live warehouse fulfillment states.
                </p>
              </div>

              {/* Filter Tabs */}
              <div className="flex items-center gap-1 p-1 rounded-xl bg-slate-100 dark:bg-navy-950 border border-slate-200/60 dark:border-white/10 self-start sm:self-auto">
                {(
                  [
                    { id: 'ALL', label: 'All' },
                    { id: 'PENDING', label: 'Processing' },
                    { id: 'IN_TRANSIT', label: 'Shipped' },
                    { id: 'DELIVERED', label: 'Delivered' },
                  ] as { id: OrderQuickFilter; label: string }[]
                ).map((tab) => (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setOrderFilter(tab.id)}
                    className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all cursor-pointer ${
                      orderFilter === tab.id
                        ? 'bg-white dark:bg-navy-800 text-orange-600 dark:text-orange-400 shadow-2xs'
                        : 'text-slate-600 dark:text-slate-400 hover:text-navy-900 dark:hover:text-white'
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Recent Orders Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-200/80 dark:border-white/10 bg-slate-50/60 dark:bg-navy-950/50 text-[11px] uppercase font-bold tracking-wider text-slate-500 dark:text-slate-400">
                    <th className="py-3 px-4">Order ID</th>
                    <th className="py-3 px-4">Customer</th>
                    <th className="py-3 px-4 hidden sm:table-cell">Product</th>
                    <th className="py-3 px-4 text-right">Amount</th>
                    <th className="py-3 px-4 text-center">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-white/5 text-xs">
                  {filteredRecentOrders.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="py-10 text-center text-slate-400">
                        No matching orders found.
                      </td>
                    </tr>
                  ) : (
                    filteredRecentOrders.map((ord) => (
                      <tr
                        key={ord.id}
                        onClick={() => router.push(`/merchant/orders/${ord.id}`)}
                        className="hover:bg-slate-50/80 dark:hover:bg-navy-800/50 transition-colors cursor-pointer group"
                      >
                        <td className="py-3 px-4 whitespace-nowrap">
                          <span className="font-mono font-bold text-navy-900 dark:text-white group-hover:text-orange-600 dark:group-hover:text-orange-400 transition-colors">
                            {ord.orderNumber || ord.id}
                          </span>
                          <span className="block text-[10px] text-slate-400 mt-0.5">
                            {ord.date}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          <span className="font-semibold text-navy-900 dark:text-white block truncate max-w-[130px]">
                            {ord.customer}
                          </span>
                          <span className="text-[10px] text-slate-400 block truncate max-w-[130px]">
                            {ord.courier || 'Steadfast'}
                          </span>
                        </td>
                        <td className="py-3 px-4 hidden sm:table-cell">
                          <span className="text-slate-700 dark:text-slate-300 font-medium block truncate max-w-[170px]">
                            {ord.items}
                          </span>
                          <span className="text-[10px] text-slate-400 font-mono">
                            Qty: {ord.qty} • {ord.memoCode}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-right whitespace-nowrap">
                          <span className="font-mono font-bold text-navy-900 dark:text-white">
                            ৳ {(Number(ord.amount) || 0).toLocaleString()}
                          </span>
                          <span className="block text-[10px] text-slate-400">
                            {ord.paymentMethod || 'COD'}
                          </span>
                        </td>
                        {/* Rule 1: Status Column is PURE INFORMATIVE TEXT (NEVER A BUTTON) */}
                        <td className="py-3 px-4 text-center whitespace-nowrap">
                          {renderOrderStatusBadge(ord.status)}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          <div className="p-4 border-t border-slate-100 dark:border-white/10 bg-slate-50/40 dark:bg-navy-950/30 flex items-center justify-between text-xs">
            <span className="text-slate-500 dark:text-slate-400">
              Showing latest {filteredRecentOrders.length} of {orders.length} store orders
            </span>
            <button
              type="button"
              onClick={() => onSelectTab('orders')}
              className="font-bold text-orange-600 dark:text-orange-400 hover:underline flex items-center gap-1 cursor-pointer"
            >
              <span>View All Orders</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>

        {/* Right: Top Selling Products & Stock Alerts (5 cols) */}
        <div className="lg:col-span-5 rounded-2xl bg-white dark:bg-navy-900 border border-slate-200/80 dark:border-white/10 shadow-xs flex flex-col justify-between overflow-hidden">
          <div>
            {/* Header with Switcher */}
            <div className="p-5 border-b border-slate-100 dark:border-white/10 flex items-center justify-between gap-2">
              <div>
                <h2 className="text-base font-bold text-navy-900 dark:text-white flex items-center gap-2">
                  <Package className="h-5 w-5 text-orange-600 dark:text-orange-400" />
                  <span>Catalog Performance</span>
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Best sellers &amp; inventory replenishment alerts.
                </p>
              </div>

              <div className="flex items-center gap-1 p-1 rounded-xl bg-slate-100 dark:bg-navy-950 border border-slate-200/60 dark:border-white/10">
                <button
                  type="button"
                  onClick={() => setProductWidgetTab('TOP_SELLING')}
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all cursor-pointer ${
                    productWidgetTab === 'TOP_SELLING'
                      ? 'bg-white dark:bg-navy-800 text-orange-600 dark:text-orange-400 shadow-2xs'
                      : 'text-slate-600 dark:text-slate-400 hover:text-navy-900 dark:hover:text-white'
                  }`}
                >
                  Top Selling
                </button>
                <button
                  type="button"
                  onClick={() => setProductWidgetTab('STOCK_ALERTS')}
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all flex items-center gap-1 cursor-pointer ${
                    productWidgetTab === 'STOCK_ALERTS'
                      ? 'bg-white dark:bg-navy-800 text-orange-600 dark:text-orange-400 shadow-2xs'
                      : 'text-slate-600 dark:text-slate-400 hover:text-navy-900 dark:hover:text-white'
                  }`}
                >
                  <span>Stock Alerts</span>
                  {(lowStockProducts.length + outOfStockProducts.length) > 0 && (
                    <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-amber-500/20 text-amber-600 dark:text-amber-300">
                      {lowStockProducts.length + outOfStockProducts.length}
                    </span>
                  )}
                </button>
              </div>
            </div>

            {/* Tab Content */}
            <div className="p-4 divide-y divide-slate-100 dark:divide-white/5">
              {productWidgetTab === 'TOP_SELLING' ? (
                topSellingProducts.length === 0 ? (
                  <div className="py-10 text-center text-xs text-slate-400">
                    No active products in catalog yet.
                  </div>
                ) : (
                  topSellingProducts.map((prod) => {
                    const isOut = (prod.stock || 0) === 0;
                    const isLow = !isOut && (prod.stock || 0) <= 15;
                    return (
                      <div
                        key={prod.id}
                        onClick={() => router.push(`/merchant/products/${prod.id}`)}
                        className="py-3 first:pt-1 last:pb-1 flex items-center justify-between gap-3 hover:bg-slate-50/70 dark:hover:bg-navy-800/40 px-2 rounded-xl transition-colors cursor-pointer group"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="h-10 w-10 rounded-xl bg-slate-100 dark:bg-navy-800 border border-slate-200/80 dark:border-white/10 flex items-center justify-center overflow-hidden shrink-0">
                            {prod.imageUrl ? (
                              <img
                                src={prod.imageUrl}
                                alt={prod.title}
                                className="h-full w-full object-cover"
                              />
                            ) : (
                              <Package className="h-4 w-4 text-slate-400" />
                            )}
                          </div>
                          <div className="min-w-0">
                            <h4 className="text-xs font-bold text-navy-900 dark:text-white truncate group-hover:text-orange-600 dark:group-hover:text-orange-400 transition-colors">
                              {prod.title}
                            </h4>
                            <div className="flex items-center gap-2 mt-0.5 text-[11px] text-slate-500 dark:text-slate-400">
                              <span className="font-mono font-semibold">{prod.sku}</span>
                              <span>•</span>
                              <span className="font-mono font-bold text-navy-900 dark:text-white">
                                ৳{(prod.price || 0).toLocaleString()}
                              </span>
                            </div>
                          </div>
                        </div>

                        <div className="text-right shrink-0">
                          <span
                            className={`inline-flex items-center justify-center text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full border select-none ${
                              isOut
                                ? 'bg-rose-500/15 text-rose-600 dark:text-rose-400 border-rose-500/30'
                                : isLow
                                ? 'bg-amber-500/15 text-amber-600 dark:text-amber-300 border-amber-500/30'
                                : 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30'
                            }`}
                          >
                            {isOut ? 'Out of Stock' : `${prod.stock} in stock`}
                          </span>
                          <span className="block text-[10px] text-slate-400 mt-1 font-mono">
                            Bin: {prod.bin || 'A-01'}
                          </span>
                        </div>
                      </div>
                    );
                  })
                )
              ) : (
                // Stock Alerts View
                [...outOfStockProducts, ...lowStockProducts].length === 0 ? (
                  <div className="py-10 text-center space-y-2">
                    <CheckCircle2 className="h-8 w-8 text-emerald-500 mx-auto" />
                    <p className="text-xs font-bold text-navy-900 dark:text-white">
                      All Catalog SKUs Have Healthy Stock
                    </p>
                    <p className="text-[11px] text-slate-400">
                      No products are currently below the 15-unit warning threshold.
                    </p>
                  </div>
                ) : (
                  [...outOfStockProducts, ...lowStockProducts].slice(0, 5).map((prod) => {
                    const isOut = (prod.stock || 0) === 0;
                    return (
                      <div
                        key={prod.id}
                        onClick={() => router.push(`/merchant/products/${prod.id}`)}
                        className="py-3 first:pt-1 last:pb-1 flex items-center justify-between gap-3 hover:bg-slate-50/70 dark:hover:bg-navy-800/40 px-2 rounded-xl transition-colors cursor-pointer"
                      >
                        <div className="min-w-0">
                          <h4 className="text-xs font-bold text-navy-900 dark:text-white truncate">
                            {prod.title}
                          </h4>
                          <span className="text-[11px] font-mono text-slate-400">
                            SKU: {prod.sku} • Bin: {prod.bin}
                          </span>
                        </div>
                        <span
                          className={`inline-flex items-center justify-center text-[10px] uppercase font-bold tracking-wider px-2.5 py-0.5 rounded-full border select-none shrink-0 ${
                            isOut
                              ? 'bg-rose-500/15 text-rose-600 dark:text-rose-400 border-rose-500/30'
                              : 'bg-amber-500/15 text-amber-600 dark:text-amber-300 border-amber-500/30'
                          }`}
                        >
                          {isOut ? '0 Left (Out)' : `${prod.stock} Left (Low)`}
                        </span>
                      </div>
                    );
                  })
                )
              )}
            </div>
          </div>

          <div className="p-4 border-t border-slate-100 dark:border-white/10 bg-slate-50/40 dark:bg-navy-950/30 flex items-center justify-between text-xs">
            <button
              type="button"
              onClick={() => onSelectTab('inbound')}
              className="font-semibold text-slate-600 dark:text-slate-300 hover:text-orange-600 dark:hover:text-orange-400 cursor-pointer"
            >
              + Send Restock ASN ({asns.length})
            </button>
            <button
              type="button"
              onClick={() => onSelectTab('products')}
              className="font-bold text-orange-600 dark:text-orange-400 hover:underline flex items-center gap-1 cursor-pointer"
            >
              <span>Manage Catalog</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* =====================================================================
          5. E-COMMERCE INSIGHTS ROW: FULFILLMENT FUNNEL + CATEGORY SHARE + STORE TOOLS
      ===================================================================== */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Column 1: Order Fulfillment Funnel */}
        <div className="p-5 rounded-2xl bg-white dark:bg-navy-900 border border-slate-200/80 dark:border-white/10 shadow-xs flex flex-col justify-between space-y-4">
          <div>
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-white/10 pb-3.5">
              <h3 className="text-sm font-bold text-navy-900 dark:text-white flex items-center gap-2">
                <Activity className="h-4 w-4 text-orange-600 dark:text-orange-400" />
                <span>Order Fulfillment Funnel</span>
              </h3>
              <span className="text-[11px] font-mono font-bold text-emerald-600 dark:text-emerald-400">
                Live WMS Sync
              </span>
            </div>

            <div className="space-y-3 mt-4 text-xs">
              {[
                {
                  label: '1. Pending & Wave Allocated',
                  count: pendingOrdersCount,
                  barColor: 'bg-amber-500',
                  badgeClass: 'bg-amber-500/15 text-amber-600 dark:text-amber-300 border-amber-500/30',
                },
                {
                  label: '2. Picked & 4x6 Slip Packed',
                  count: packedOrdersCount,
                  barColor: 'bg-indigo-500',
                  badgeClass: 'bg-indigo-50 dark:bg-indigo-600/10 text-indigo-700 dark:text-indigo-300 border-indigo-200 dark:border-indigo-500/30',
                },
                {
                  label: '3. Dispatched with Courier',
                  count: dispatchedOrdersCount,
                  barColor: 'bg-orange-500',
                  badgeClass: 'bg-orange-500/15 text-orange-600 dark:text-orange-400 border-orange-500/30',
                },
                {
                  label: '4. Delivered to Customer',
                  count: deliveredOrdersCount,
                  barColor: 'bg-emerald-500',
                  badgeClass: 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30',
                },
              ].map((stage, i) => {
                const pct =
                  totalOrdersCount > 0
                    ? Math.min(100, Math.round((stage.count / totalOrdersCount) * 100))
                    : 0;
                return (
                  <div key={i} className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-slate-700 dark:text-slate-300">
                        {stage.label}
                      </span>
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-bold border select-none ${stage.badgeClass}`}>
                        {stage.count} ({pct}%)
                      </span>
                    </div>
                    <div className="w-full h-1.5 rounded-full bg-slate-100 dark:bg-navy-950 overflow-hidden">
                      <div
                        className={`h-full rounded-full ${stage.barColor} transition-all duration-500`}
                        style={{ width: `${Math.max(4, pct)}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="pt-3 border-t border-slate-100 dark:border-white/10 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
            <span>Cancelled / Returned: <strong className="text-rose-600 dark:text-rose-400">{cancelledOrdersCount}</strong></span>
            <button
              type="button"
              onClick={() => onSelectTab('returns')}
              className="font-bold text-orange-600 dark:text-orange-400 hover:underline cursor-pointer"
            >
              Returns Portal &rarr;
            </button>
          </div>
        </div>

        {/* Column 2: Inventory Valuation by Product Category */}
        <div className="p-5 rounded-2xl bg-white dark:bg-navy-900 border border-slate-200/80 dark:border-white/10 shadow-xs flex flex-col justify-between space-y-4">
          <div>
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-white/10 pb-3.5">
              <h3 className="text-sm font-bold text-navy-900 dark:text-white flex items-center gap-2">
                <Tag className="h-4 w-4 text-orange-600 dark:text-orange-400" />
                <span>Stock by Category</span>
              </h3>
              <button
                type="button"
                onClick={() => onSelectTab('categories')}
                className="text-[11px] font-bold text-orange-600 dark:text-orange-400 hover:underline cursor-pointer"
              >
                Manage
              </button>
            </div>

            <div className="space-y-3.5 mt-4 text-xs">
              {categoryBreakdown.length === 0 ? (
                <div className="py-8 text-center text-slate-400">
                  No category data available.
                </div>
              ) : (
                categoryBreakdown.map((cat, idx) => (
                  <div key={idx} className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-navy-900 dark:text-white truncate max-w-[160px]">
                        {cat.name}
                      </span>
                      <span className="font-mono text-[11px] text-slate-500 dark:text-slate-400">
                        {cat.stock} units • <strong className="text-navy-900 dark:text-white">৳{cat.value.toLocaleString()}</strong>
                      </span>
                    </div>
                    <div className="w-full h-1.5 rounded-full bg-slate-100 dark:bg-navy-950 overflow-hidden">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-orange-600 to-amber-400"
                        style={{ width: `${cat.sharePercent}%` }}
                      />
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="pt-3 border-t border-slate-100 dark:border-white/10 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
            <span>Total Catalog Categories</span>
            <span className="font-mono font-bold text-navy-900 dark:text-white">
              {categoryBreakdown.length} Active
            </span>
          </div>
        </div>

        {/* Column 3: Store Integrations, Custom Memo & Quick Tools */}
        <div className="p-5 rounded-2xl bg-white dark:bg-navy-900 border border-slate-200/80 dark:border-white/10 shadow-xs flex flex-col justify-between space-y-4">
          <div>
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-white/10 pb-3.5">
              <h3 className="text-sm font-bold text-navy-900 dark:text-white flex items-center gap-2">
                <Layers className="h-4 w-4 text-orange-600 dark:text-orange-400" />
                <span>Store Setup &amp; Automation</span>
              </h3>
              <span className="text-[11px] font-semibold text-slate-400">Quick Tools</span>
            </div>

            <div className="space-y-2.5 mt-4">
              <button
                type="button"
                onClick={() => onSelectTab('memo-designer')}
                className="w-full p-3 rounded-xl bg-slate-50 hover:bg-orange-500/5 dark:bg-navy-950/70 dark:hover:bg-orange-500/10 border border-slate-200/80 dark:border-white/10 hover:border-orange-500/30 transition-all flex items-center justify-between text-left group cursor-pointer"
              >
                <div className="flex items-center gap-3">
                  <div className="h-9 w-9 rounded-xl bg-orange-500/10 text-orange-600 dark:text-orange-400 flex items-center justify-center shrink-0">
                    <FileText className="h-4 w-4" />
                  </div>
                  <div>
                    <span className="text-xs font-bold text-navy-900 dark:text-white group-hover:text-orange-600 dark:group-hover:text-orange-400 block">
                      Branded 4x6 Invoice Slips
                    </span>
                    <span className="text-[11px] text-slate-500 dark:text-slate-400">
                      {memoCount || 1} active memo template(s)
                    </span>
                  </div>
                </div>
                <ArrowRight className="h-4 w-4 text-slate-400 group-hover:text-orange-500 group-hover:translate-x-0.5 transition-all" />
              </button>

              <button
                type="button"
                onClick={() => onSelectTab('inbound')}
                className="w-full p-3 rounded-xl bg-slate-50 hover:bg-orange-500/5 dark:bg-navy-950/70 dark:hover:bg-orange-500/10 border border-slate-200/80 dark:border-white/10 hover:border-orange-500/30 transition-all flex items-center justify-between text-left group cursor-pointer"
              >
                <div className="flex items-center gap-3">
                  <div className="h-9 w-9 rounded-xl bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
                    <Truck className="h-4 w-4" />
                  </div>
                  <div>
                    <span className="text-xs font-bold text-navy-900 dark:text-white group-hover:text-orange-600 dark:group-hover:text-orange-400 block">
                      Inbound Warehouse ASNs
                    </span>
                    <span className="text-[11px] text-slate-500 dark:text-slate-400">
                      {asns.length} shipment notices logged
                    </span>
                  </div>
                </div>
                <ArrowRight className="h-4 w-4 text-slate-400 group-hover:text-orange-500 group-hover:translate-x-0.5 transition-all" />
              </button>

              <button
                type="button"
                onClick={() => onSelectTab('api-keys')}
                className="w-full p-3 rounded-xl bg-slate-50 hover:bg-orange-500/5 dark:bg-navy-950/70 dark:hover:bg-orange-500/10 border border-slate-200/80 dark:border-white/10 hover:border-orange-500/30 transition-all flex items-center justify-between text-left group cursor-pointer"
              >
                <div className="flex items-center gap-3">
                  <div className="h-9 w-9 rounded-xl bg-indigo-50 dark:bg-indigo-600/10 text-indigo-700 dark:text-indigo-300 flex items-center justify-center shrink-0">
                    <Key className="h-4 w-4" />
                  </div>
                  <div>
                    <span className="text-xs font-bold text-navy-900 dark:text-white group-hover:text-orange-600 dark:group-hover:text-orange-400 block">
                      WooCommerce &amp; Shopify API
                    </span>
                    <span className="text-[11px] text-slate-500 dark:text-slate-400">
                      Webhooks &amp; automatic order sync
                    </span>
                  </div>
                </div>
                <ArrowRight className="h-4 w-4 text-slate-400 group-hover:text-orange-500 group-hover:translate-x-0.5 transition-all" />
              </button>
            </div>
          </div>

          <div className="pt-3 border-t border-slate-100 dark:border-white/10 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
            <span>Store Profile &amp; KYC</span>
            <button
              type="button"
              onClick={() => onSelectTab('profile')}
              className="font-bold text-orange-600 dark:text-orange-400 hover:underline cursor-pointer"
            >
              Settings &rarr;
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
