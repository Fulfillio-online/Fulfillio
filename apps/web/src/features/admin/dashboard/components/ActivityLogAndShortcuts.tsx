'use client';

import React from 'react';
import Link from 'next/link';
import {
  ExternalLink,
  ChevronRight,
  PackageCheck,
  Users,
  Truck,
  Activity,
  CheckCircle2,
  Layers,
  ShieldCheck,
  Boxes,
  BarChart3,
  HandCoins,
} from 'lucide-react';
import { AdminOperationsActivityDto } from '@fulfillio/contracts';

interface ActivityLogAndShortcutsProps {
  recentActivity: AdminOperationsActivityDto[];
}

function formatTimeAgo(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  const diffMin = Math.max(0, Math.floor((Date.now() - d.getTime()) / 60000));
  if (diffMin < 1) return 'Just now';
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffHrs = Math.floor(diffMin / 60);
  if (diffHrs < 24) return `${diffHrs}h ago`;
  const diffDays = Math.floor(diffHrs / 24);
  return `${diffDays}d ago`;
}

export function ActivityLogAndShortcuts({
  recentActivity,
}: ActivityLogAndShortcutsProps) {
  const getFeedIcon = (type: AdminOperationsActivityDto['type']) => {
    switch (type) {
      case 'order':
        return PackageCheck;
      case 'inbound':
        return Boxes;
      case 'payout':
        return HandCoins;
      case 'merchant':
        return Users;
      case 'inventory':
        return Layers;
      default:
        return Activity;
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Live Warehouse Activity Audit Feed */}
      <div className="lg:col-span-2 p-6 rounded-2xl bg-white dark:bg-navy-900 border border-slate-200/80 dark:border-white/10 shadow-sm space-y-4">
        <div className="flex justify-between items-center pb-3 border-b border-slate-200/80 dark:border-white/10">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-orange-500/10 text-orange-600 dark:text-orange-400">
              <Activity className="h-4 w-4" />
            </div>
            <h2 className="font-extrabold text-sm sm:text-base text-navy-900 dark:text-white">
              Live Warehouse Operational Feed
            </h2>
          </div>
          <span className="flex items-center gap-1.5 text-xs text-emerald-600 dark:text-emerald-400 font-semibold bg-emerald-500/10 px-2.5 py-1 rounded-lg">
            <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
            <span>PostgreSQL Live</span>
          </span>
        </div>

        <div className="space-y-2.5">
          {recentActivity.length === 0 ? (
            <div className="p-6 rounded-xl bg-slate-50 dark:bg-navy-950 border border-slate-200/80 dark:border-white/10 text-center text-xs text-slate-500 dark:text-slate-400">
              No operational events recorded yet.
            </div>
          ) : (
            recentActivity.map((item) => {
              const Icon = getFeedIcon(item.type);
              return (
                <div
                  key={item.id}
                  className="p-3.5 rounded-xl bg-slate-50 dark:bg-navy-950 border border-slate-200/80 dark:border-white/10 flex items-start gap-3 hover:border-orange-500/30 transition-colors"
                >
                  <div className="h-8 w-8 rounded-lg bg-white dark:bg-navy-900 border border-slate-200 dark:border-white/10 flex items-center justify-center text-orange-600 dark:text-orange-400 shrink-0 mt-0.5">
                    <Icon className="h-4 w-4" />
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-xs font-bold text-navy-900 dark:text-white truncate">
                        {item.title}
                      </span>
                      <span className="text-[10px] text-slate-400 shrink-0 tabular-nums font-mono">
                        {formatTimeAgo(item.createdAt)}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-600 dark:text-slate-300 mt-0.5 leading-relaxed">
                      {item.details}
                    </p>
                  </div>
                </div>
              );
            })
          )}
        </div>

        <div className="pt-3 border-t border-slate-200/80 dark:border-white/10 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
          <span className="flex items-center gap-1.5 text-[11px]">
            <ShieldCheck className="h-3.5 w-3.5 text-orange-500" />
            <span>Atomic reservation locks &amp; tenant isolation active.</span>
          </span>
          <Link
            href="/admin/orders"
            className="text-orange-600 dark:text-orange-400 hover:underline font-bold text-[11px]"
          >
            View Order Pipeline
          </Link>
        </div>
      </div>

      {/* Operator Quick Access Shortcuts */}
      <div className="p-6 rounded-2xl bg-white dark:bg-navy-900 border border-slate-200/80 dark:border-white/10 shadow-sm flex flex-col justify-between space-y-4">
        <div>
          <h2 className="font-extrabold text-sm sm:text-base mb-3 text-navy-900 dark:text-white">
            Operator Quick Shortcuts
          </h2>

          <div className="space-y-2.5">
            <Link
              href="/wms/packing"
              target="_blank"
              className="w-full p-3 rounded-xl bg-orange-600 hover:bg-orange-500 font-bold text-xs sm:text-sm text-white flex items-center justify-between transition-colors shadow-md shadow-orange-500/20"
            >
              <div className="flex items-center gap-2">
                <PackageCheck className="h-4 w-4" />
                <span>Open Packing Station</span>
              </div>
              <ExternalLink className="h-3.5 w-3.5" />
            </Link>

            <Link
              href="/admin/finance"
              className="w-full p-3 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/15 font-bold text-xs sm:text-sm text-emerald-700 dark:text-emerald-300 flex items-center justify-between transition-colors border border-emerald-500/30"
            >
              <div className="flex items-center gap-2">
                <BarChart3 className="h-4 w-4" />
                <span>Finance &amp; P&amp;L Analytics</span>
              </div>
              <ChevronRight className="h-3.5 w-3.5" />
            </Link>

            <Link
              href="/admin/orders"
              className="w-full p-3 rounded-xl bg-slate-100 dark:bg-navy-800 hover:bg-slate-200 dark:hover:bg-navy-700 font-semibold text-xs sm:text-sm text-navy-900 dark:text-slate-100 flex items-center justify-between transition-colors border border-slate-200 dark:border-white/10"
            >
              <div className="flex items-center gap-2">
                <Layers className="h-4 w-4 text-orange-500" />
                <span>Order Pipeline &amp; Pick List</span>
              </div>
              <ChevronRight className="h-3.5 w-3.5" />
            </Link>

            <Link
              href="/admin/payouts"
              className="w-full p-3 rounded-xl bg-slate-100 dark:bg-navy-800 hover:bg-slate-200 dark:hover:bg-navy-700 font-semibold text-xs sm:text-sm text-navy-900 dark:text-slate-100 flex items-center justify-between transition-colors border border-slate-200 dark:border-white/10"
            >
              <div className="flex items-center gap-2">
                <HandCoins className="h-4 w-4 text-amber-500" />
                <span>Merchant Payout Requests</span>
              </div>
              <ChevronRight className="h-3.5 w-3.5" />
            </Link>

            <Link
              href="/admin/couriers"
              className="w-full p-3 rounded-xl bg-slate-100 dark:bg-navy-800 hover:bg-slate-200 dark:hover:bg-navy-700 font-semibold text-xs sm:text-sm text-navy-900 dark:text-slate-100 flex items-center justify-between transition-colors border border-slate-200 dark:border-white/10"
            >
              <div className="flex items-center gap-2">
                <Truck className="h-4 w-4 text-sky-500" />
                <span>Courier Sync &amp; Manifests</span>
              </div>
              <ChevronRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        </div>

        <div className="pt-3 border-t border-slate-200/80 dark:border-white/10 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 tabular-nums">
          <span>Fulfillio WMS</span>
          <span className="flex items-center gap-1 font-bold text-emerald-600 dark:text-emerald-400">
            <CheckCircle2 className="h-3.5 w-3.5" />
            <span>Live Connected</span>
          </span>
        </div>
      </div>
    </div>
  );
}
