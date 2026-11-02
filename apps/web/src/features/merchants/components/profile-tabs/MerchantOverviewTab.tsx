import React, { useMemo } from 'react';
import {
  Package,
  Clock,
  Truck,
  CheckCircle2,
  ArrowUpRight,
  ArrowRight,
  Boxes,
  CreditCard,
  ShoppingCart,
  Landmark,
} from 'lucide-react';
import {
  MerchantRecord,
  MerchantOrderItem,
  MerchantProductItem,
  OrderPeriodFilter,
  PERIOD_FILTER_OPTIONS,
  PERIOD_RANK,
  MerchantSubTab,
} from '../../types';

export interface MerchantOverviewTabProps {
  merchant: MerchantRecord;
  orderPeriodFilter: OrderPeriodFilter;
  onPeriodChange: (filter: OrderPeriodFilter) => void;
  onNavigateSubTab: (tab: MerchantSubTab) => void;
  onSelectOrderStatusFilter: (status: string) => void;
  allOrders: MerchantOrderItem[];
  allProducts: MerchantProductItem[];
}

export function MerchantOverviewTab({
  merchant,
  orderPeriodFilter,
  onPeriodChange,
  onNavigateSubTab,
  onSelectOrderStatusFilter,
  allOrders,
  allProducts,
}: MerchantOverviewTabProps) {
  // Scoped orders by period rank
  const periodFilteredOrders = useMemo(() => {
    const maxRank = PERIOD_RANK[orderPeriodFilter];
    return allOrders.filter(
      (ord) =>
        ord.merchantCode === merchant.merchantCode &&
        PERIOD_RANK[ord.periodBucket] <= maxRank,
    );
  }, [allOrders, merchant.merchantCode, orderPeriodFilter]);

  const overviewOrderStats = useMemo(() => {
    const totalOrders = periodFilteredOrders.length;
    const pendingFulfillment = periodFilteredOrders.filter(
      (o) => o.status === 'ALLOCATED' || o.status === 'PICKING' || o.status === 'PACKED',
    ).length;
    const inDelivery = periodFilteredOrders.filter((o) => o.status === 'DISPATCHED').length;
    const delivered = periodFilteredOrders.filter((o) => o.status === 'DELIVERED').length;

    const opt = PERIOD_FILTER_OPTIONS.find((o) => o.id === orderPeriodFilter);
    const periodLabel = opt?.periodLabel || 'selected period';

    let totalTrend = '+12%';
    let deliveredTrend = '+8%';
    if (orderPeriodFilter === 'DAY') {
      totalTrend = '+18%';
      deliveredTrend = '+100%';
    } else if (orderPeriodFilter === 'WEEK') {
      totalTrend = '+24%';
      deliveredTrend = '+16%';
    } else if (orderPeriodFilter === '1M') {
      totalTrend = '+32%';
      deliveredTrend = '+28%';
    }

    return {
      totalOrders,
      pendingFulfillment,
      inDelivery,
      delivered,
      periodLabel,
      totalTrend,
      deliveredTrend,
    };
  }, [periodFilteredOrders, orderPeriodFilter]);

  return (
    <div className="space-y-6">
      {/* ORDERS OVERVIEW SECTION */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900/90 p-6 space-y-6 shadow-xl">
        {/* Top Header + 7-Range Period Filter Bar */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="h-12 w-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shadow-inner shrink-0">
              <Package className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl sm:text-2xl font-extrabold text-white tracking-tight">
                Order Analytics
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Manage, track, and fulfill merchant customer orders.
              </p>
            </div>
          </div>

          {/* Timeframe Filter Buttons */}
          <div className="inline-flex flex-wrap items-center gap-1 rounded-xl bg-slate-950 p-1.5 border border-slate-800 self-start lg:self-auto">
            {PERIOD_FILTER_OPTIONS.map((item) => {
              const active = orderPeriodFilter === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => onPeriodChange(item.id)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    active
                      ? 'bg-emerald-600 text-white shadow-md'
                      : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
                  }`}
                >
                  {item.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* 4 KPI Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Card 1: Total Orders */}
          <div
            onClick={() => {
              onSelectOrderStatusFilter('ALL');
              onNavigateSubTab('orders');
            }}
            className="rounded-2xl border border-slate-800 bg-slate-950/80 hover:border-emerald-500/40 p-5 flex flex-col justify-between gap-5 cursor-pointer transition-all"
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <span className="text-xs font-medium text-slate-400 block">Total Orders</span>
                <div className="text-3xl font-extrabold text-white mt-1.5 font-mono">
                  {overviewOrderStats.totalOrders}
                </div>
              </div>
              <div className="h-10 w-10 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shrink-0">
                <Package className="w-5 h-5" />
              </div>
            </div>

            <div className="flex items-center gap-1.5 text-xs">
              <ArrowUpRight className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
              <span className="font-bold text-emerald-400">{overviewOrderStats.totalTrend}</span>
              <span className="text-slate-500">{overviewOrderStats.periodLabel}</span>
            </div>
          </div>

          {/* Card 2: Pending Fulfillment */}
          <div
            onClick={() => {
              onSelectOrderStatusFilter('PENDING_FULFILLMENT');
              onNavigateSubTab('orders');
            }}
            className="rounded-2xl border border-slate-800 bg-slate-950/80 hover:border-amber-500/40 p-5 flex flex-col justify-between gap-5 cursor-pointer transition-all"
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <span className="text-xs font-medium text-slate-400 block">
                  Pending Fulfillment
                </span>
                <div className="text-3xl font-extrabold text-amber-300 mt-1.5 font-mono">
                  {overviewOrderStats.pendingFulfillment}
                </div>
              </div>
              <div className="h-10 w-10 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 shrink-0">
                <Clock className="w-5 h-5" />
              </div>
            </div>

            <div className="flex items-center gap-1.5 text-xs text-slate-400">
              <span>Ready for pick &amp; pack</span>
            </div>
          </div>

          {/* Card 3: In Delivery */}
          <div
            onClick={() => {
              onSelectOrderStatusFilter('DISPATCHED');
              onNavigateSubTab('orders');
            }}
            className="rounded-2xl border border-slate-800 bg-slate-950/80 hover:border-indigo-500/40 p-5 flex flex-col justify-between gap-5 cursor-pointer transition-all"
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <span className="text-xs font-medium text-slate-400 block">In Delivery</span>
                <div className="text-3xl font-extrabold text-indigo-300 mt-1.5 font-mono">
                  {overviewOrderStats.inDelivery}
                </div>
              </div>
              <div className="h-10 w-10 rounded-xl bg-indigo-500/10 border border-indigo-500/30 flex items-center justify-center text-indigo-400 shrink-0">
                <Truck className="w-5 h-5" />
              </div>
            </div>

            <div className="flex items-center gap-1.5 text-xs text-slate-400">
              <span>With courier drivers</span>
            </div>
          </div>

          {/* Card 4: Delivered */}
          <div
            onClick={() => {
              onSelectOrderStatusFilter('DELIVERED');
              onNavigateSubTab('orders');
            }}
            className="rounded-2xl border border-slate-800 bg-slate-950/80 hover:border-emerald-500/40 p-5 flex flex-col justify-between gap-5 cursor-pointer transition-all"
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <span className="text-xs font-medium text-slate-400 block">Delivered</span>
                <div className="text-3xl font-extrabold text-emerald-400 mt-1.5 font-mono">
                  {overviewOrderStats.delivered}
                </div>
              </div>
              <div className="h-10 w-10 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shrink-0">
                <CheckCircle2 className="w-5 h-5" />
              </div>
            </div>

            <div className="flex items-center gap-1.5 text-xs">
              <ArrowUpRight className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
              <span className="font-bold text-emerald-400">{overviewOrderStats.deliveredTrend}</span>
              <span className="text-slate-500">successfully completed</span>
            </div>
          </div>
        </div>
      </div>

      {/* Store Highlights & Quick Shortcuts */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Store Snapshot */}
        <div className="lg:col-span-6 rounded-2xl border border-slate-800 bg-slate-900/80 p-6 space-y-4 shadow-lg">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div>
              <h3 className="text-sm font-bold text-white">Store Identity &amp; Coverage</h3>
              <p className="text-xs text-slate-400">Merchant registration details</p>
            </div>
            <button
              type="button"
              onClick={() => onNavigateSubTab('profile')}
              className="text-xs text-emerald-400 hover:text-emerald-300 font-semibold flex items-center gap-1 cursor-pointer"
            >
              <span>Edit Store</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="space-y-2.5 text-xs">
            <div className="flex justify-between items-center py-1.5 border-b border-slate-800/60">
              <span className="text-slate-400 font-medium">Merchant Code</span>
              <span className="font-mono font-bold text-emerald-400 px-2 py-0.5 rounded bg-emerald-500/10 border border-emerald-500/30">
                {merchant.merchantCode}
              </span>
            </div>
            <div className="flex justify-between items-center py-1.5 border-b border-slate-800/60">
              <span className="text-slate-400 font-medium">Store Name</span>
              <span className="font-bold text-white">{merchant.storeName}</span>
            </div>
            <div className="flex justify-between items-center py-1.5 border-b border-slate-800/60">
              <span className="text-slate-400 font-medium">Owner Name</span>
              <span className="font-bold text-slate-200">{merchant.ownerName}</span>
            </div>
            <div className="flex justify-between items-center py-1.5 border-b border-slate-800/60">
              <span className="text-slate-400 font-medium">Primary Contact</span>
              <span className="font-mono text-slate-200">{merchant.phone}</span>
            </div>
            <div className="flex justify-between items-center py-1.5">
              <span className="text-slate-400 font-medium">Location</span>
              <span className="text-slate-200">{merchant.location}</span>
            </div>
          </div>
        </div>

        {/* Right: Quick Action Shortcuts */}
        <div className="lg:col-span-6 rounded-2xl border border-slate-800 bg-slate-900/80 p-6 space-y-4 shadow-lg flex flex-col justify-between">
          <div>
            <h3 className="text-sm font-bold text-white mb-3">Merchant Management Shortcuts</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => onNavigateSubTab('products')}
                className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 hover:border-emerald-500/40 text-left transition-all group cursor-pointer"
              >
                <div className="flex items-center gap-2 text-emerald-400 font-bold text-xs mb-1">
                  <Boxes className="w-4 h-4" />
                  <span>Product Catalog</span>
                </div>
                <div className="text-lg font-bold text-white font-mono">
                  {allProducts.length} Items
                </div>
                <span className="text-[11px] text-slate-400 group-hover:text-slate-300">
                  Inspect stock &amp; bins →
                </span>
              </button>

              <button
                type="button"
                onClick={() => onNavigateSubTab('orders')}
                className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 hover:border-emerald-500/40 text-left transition-all group cursor-pointer"
              >
                <div className="flex items-center gap-2 text-indigo-400 font-bold text-xs mb-1">
                  <ShoppingCart className="w-4 h-4" />
                  <span>Orders Pipeline</span>
                </div>
                <div className="text-lg font-bold text-white font-mono">
                  {allOrders.length} Total
                </div>
                <span className="text-[11px] text-slate-400 group-hover:text-slate-300">
                  Date filters &amp; slips →
                </span>
              </button>

              <button
                type="button"
                onClick={() => onNavigateSubTab('payout')}
                className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 hover:border-emerald-500/40 text-left transition-all group cursor-pointer"
              >
                <div className="flex items-center gap-2 text-amber-400 font-bold text-xs mb-1">
                  <Landmark className="w-4 h-4" />
                  <span>COD Balance</span>
                </div>
                <div className="text-lg font-bold text-emerald-400 font-mono">
                  ৳{merchant.payoutAccount.availableBalance.toLocaleString()}
                </div>
                <span className="text-[11px] text-slate-400 group-hover:text-slate-300">
                  Bank &amp; bKash setup →
                </span>
              </button>

              <button
                type="button"
                onClick={() => onNavigateSubTab('memo')}
                className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 hover:border-emerald-500/40 text-left transition-all group cursor-pointer"
              >
                <div className="flex items-center gap-2 text-purple-400 font-bold text-xs mb-1">
                  <CreditCard className="w-4 h-4" />
                  <span>Thermal Slips</span>
                </div>
                <div className="text-sm font-bold text-white">4x6&quot; Memo Engine</div>
                <span className="text-[11px] text-slate-400 group-hover:text-slate-300">
                  Branded packing slips →
                </span>
              </button>
            </div>
          </div>

          <div className="text-[11px] text-slate-500 pt-2 border-t border-slate-800/80">
            Fulfillio WMS • Merchant Portal Integrated
          </div>
        </div>
      </div>
    </div>
  );
}
