'use client';

import React from 'react';
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
} from 'lucide-react';
import { MerchantTab } from '../../types';

interface MerchantOverviewTabProps {
  memoCount: number;
  onSelectTab: (tab: MerchantTab) => void;
}

export function MerchantOverviewTab({ memoCount, onSelectTab }: MerchantOverviewTabProps) {
  const quickModules = [
    {
      tab: 'products' as MerchantTab,
      title: 'Product Master & 2-Part SKU',
      desc: 'Catalog, barcode labels, and warehouse bin allocation',
      icon: Package,
      badge: '3 SKUs Active',
      color: 'text-orange-600 dark:text-orange-400',
    },
    {
      tab: 'orders' as MerchantTab,
      title: 'Orders & Reseller Attribution',
      desc: 'Live order lifecycle, fraud scoring, and 4x6 slip preview',
      icon: ShoppingCart,
      badge: '99.8% On-Time',
      color: 'text-emerald-600 dark:text-emerald-400',
    },
    {
      tab: 'memo-designer' as MerchantTab,
      title: 'Custom Memo / Invoice Slip',
      desc: 'Branded invoice templates with custom colors and paper sizes',
      icon: Layers,
      badge: `${memoCount} Designs`,
      color: 'text-indigo-600 dark:text-indigo-400',
    },
    {
      tab: 'inbound' as MerchantTab,
      title: 'Inbound ASNs & Warehouse',
      desc: 'Advance shipping notices, carrier tracking, dock receiving',
      icon: Truck,
      badge: '2 In-Transit',
      color: 'text-amber-600 dark:text-amber-400',
    },
    {
      tab: 'billing' as MerchantTab,
      title: 'Payout & Billing',
      desc: 'COD settlement calculations, 3PL handling deductions',
      icon: CreditCard,
      badge: '৳ 184.5k Available',
      color: 'text-teal-600 dark:text-teal-400',
    },
    {
      tab: 'api-keys' as MerchantTab,
      title: 'API Keys & Webhooks',
      desc: 'REST API tokens and real-time webhook event dispatcher',
      icon: Key,
      badge: 'REST Live',
      color: 'text-purple-600 dark:text-purple-400',
    },
  ];

  return (
    <div className="space-y-6">
      {/* Page Title & Intro */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-navy-900 dark:text-white flex items-center gap-2.5">
            <LayoutDashboard className="h-6 w-6 text-orange-600 dark:text-orange-400 shrink-0" />
            <span>Merchant Store Performance</span>
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Real-time inventory levels, orders fulfilled by Fulfillio 3PL, and COD settlements.
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto bg-white dark:bg-navy-900 border border-slate-200 dark:border-white/10 px-3 py-1.5 rounded-xl shadow-xs text-xs font-semibold text-slate-600 dark:text-slate-300">
          <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
          <span>Sync Status: Realtime WMS Connected</span>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1 */}
        <div className="p-5 rounded-2xl bg-white dark:bg-navy-900 border border-slate-200 dark:border-white/10 shadow-lg">
          <div className="flex justify-between items-start">
            <span className="text-xs uppercase font-bold text-slate-500 dark:text-slate-400 tracking-wider">
              Total Fulfillments
            </span>
            <TrendingUp className="h-4 w-4 text-orange-600 dark:text-orange-400" />
          </div>
          <div className="text-3xl font-extrabold mt-2 tabular-nums text-navy-900 dark:text-white">
            1,842
          </div>
          <span className="text-xs text-emerald-600 dark:text-emerald-400 mt-1 inline-flex items-center gap-1 font-semibold">
            <CheckCircle2 className="h-3 w-3" />
            99.8% on-time dispatch
          </span>
        </div>

        {/* Card 2 */}
        <div className="p-5 rounded-2xl bg-white dark:bg-navy-900 border border-slate-200 dark:border-white/10 shadow-lg">
          <div className="flex justify-between items-start">
            <span className="text-xs uppercase font-bold text-slate-500 dark:text-slate-400 tracking-wider">
              Warehouse In-Stock
            </span>
            <Boxes className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
          </div>
          <div className="text-3xl font-extrabold mt-2 tabular-nums text-navy-900 dark:text-white">
            183 Units
          </div>
          <span className="text-xs text-slate-500 dark:text-slate-400 mt-1 inline-block">
            Across 3 active SKU bins
          </span>
        </div>

        {/* Card 3 */}
        <div className="p-5 rounded-2xl bg-white dark:bg-navy-900 border border-slate-200 dark:border-white/10 shadow-lg">
          <div className="flex justify-between items-start">
            <span className="text-xs uppercase font-bold text-slate-500 dark:text-slate-400 tracking-wider">
              Active Memo Codes
            </span>
            <Layers className="h-4 w-4 text-purple-600 dark:text-purple-400" />
          </div>
          <div className="text-3xl font-extrabold mt-2 tabular-nums text-purple-600 dark:text-purple-400">
            {memoCount} Designs
          </div>
          <span className="text-xs text-slate-500 dark:text-slate-400 mt-1 inline-block">
            1 Default / 4x6 Thermal
          </span>
        </div>

        {/* Card 4 */}
        <div className="p-5 rounded-2xl bg-white dark:bg-navy-900 border border-slate-200 dark:border-white/10 shadow-lg">
          <div className="flex justify-between items-start">
            <span className="text-xs uppercase font-bold text-slate-500 dark:text-slate-400 tracking-wider">
              Available COD Balance
            </span>
            <CreditCard className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
          </div>
          <div className="text-3xl font-extrabold mt-2 tabular-nums text-emerald-600 dark:text-emerald-400">
            ৳ 184,500
          </div>
          <span className="text-xs text-slate-500 dark:text-slate-400 mt-1 inline-block">
            Disbursement scheduled Friday
          </span>
        </div>
      </div>

      {/* Quick Info Banner with Orange Warm Brand Accent */}
      <div className="p-6 rounded-2xl bg-gradient-to-r from-orange-500/10 via-amber-500/5 to-slate-50 dark:to-navy-900 border border-orange-500/20 shadow-md flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
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
          Manage Memo Designs
        </button>
      </div>

      {/* Modular Navigation Grid */}
      <div>
        <h2 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-3 px-1">
          Merchant Operations & Modules
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {quickModules.map((m) => {
            const Icon = m.icon;
            return (
              <button
                key={m.tab}
                onClick={() => onSelectTab(m.tab)}
                className="p-5 rounded-2xl bg-white dark:bg-navy-900 border border-slate-200 dark:border-white/10 hover:border-orange-500/40 dark:hover:border-orange-500/40 hover:shadow-xl text-left transition-all duration-200 group flex flex-col justify-between cursor-pointer"
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
