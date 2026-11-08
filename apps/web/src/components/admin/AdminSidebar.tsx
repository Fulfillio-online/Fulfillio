'use client';

import React, { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { usePathname, useSearchParams } from 'next/navigation';
import {
  LayoutDashboard,
  Users,
  Printer,
  Package,
  Boxes,
  Truck,
  RotateCcw,
  SlidersHorizontal,
  CreditCard,
  Settings,
  HandCoins,
  ChevronDown,
  ChevronRight,
  LogOut,
} from 'lucide-react';

interface AdminSidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export function AdminSidebar({ isOpen, onClose }: AdminSidebarProps) {
  const pathname = usePathname();
  const [isProductsExpanded, setIsProductsExpanded] = useState(false);

  // Auto-expand when active route matches
  useEffect(() => {
    if (pathname.startsWith('/admin/products')) {
      setIsProductsExpanded(true);
    }
  }, [pathname]);

  const isCurrent = (path: string, exact = false) => {
    if (exact) return pathname === path;
    return pathname.startsWith(path);
  };

  return (
    <aside
      className={`fixed inset-y-0 left-0 z-50 w-72 h-full border-r border-slate-200 dark:border-white/10 bg-white dark:bg-navy-950 flex flex-col justify-between shrink-0 transition-transform duration-200 lg:static lg:h-full lg:w-64 lg:bg-white/80 dark:lg:bg-navy-950/80 lg:backdrop-blur-md lg:translate-x-0 ${
        isOpen ? 'translate-x-0 shadow-2xl' : '-translate-x-full'
      }`}
    >
      {/* 1. FIXED TOP CORNER: Logo & Brand Header */}
      <div className="shrink-0 px-5 py-4 border-b border-slate-200 dark:border-white/10 bg-white/95 dark:bg-navy-950/95 backdrop-blur-xs">
        <Link
          href="/admin"
          onClick={onClose}
          className="flex items-center gap-3 group cursor-pointer"
        >
          <div className="h-10 w-10 rounded-xl bg-orange-600 flex items-center justify-center font-extrabold text-white text-lg shadow-md shadow-orange-500/25 group-hover:scale-105 group-hover:bg-orange-500 transition-all">
            F
          </div>
          <div className="min-w-0">
            <p className="font-extrabold text-xl tracking-tight text-navy-900 dark:text-white leading-tight">
              Fulfill<span className="text-orange-500">io</span>
            </p>
            <span className="inline-block text-[10px] uppercase font-bold text-orange-600 dark:text-orange-400 tracking-wider">
              Admin Control Panel
            </span>
          </div>
        </Link>
      </div>

      {/* 2. SCROLLABLE MIDDLE: Navigation Menu */}
      <div className="flex-1 min-h-0 overflow-y-auto px-4 py-4 space-y-4 overscroll-contain">
        <nav className="space-y-4">
          {/* Overview */}
          <div>
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 px-3">
              Overview
            </span>
            <div className="mt-2 space-y-1">
              <Link
                href="/admin"
                onClick={onClose}
                className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  pathname === '/admin' || pathname === '/admin/dashboard'
                    ? 'bg-orange-600 text-white shadow-sm'
                    : 'text-slate-600 dark:text-slate-300 hover:text-navy-800 dark:hover:text-slate-100 hover:bg-slate-100/60 dark:hover:bg-navy-800/60'
                }`}
              >
                <LayoutDashboard className="h-4 w-4" />
                <span>Dashboard</span>
              </Link>
            </div>
          </div>

          {/* Merchant Section */}
          <div>
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 px-3">
              Merchant Section
            </span>
            <div className="mt-2 space-y-1">
              <Link
                href="/admin/merchants"
                onClick={onClose}
                className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  isCurrent('/admin/merchants')
                    ? 'bg-orange-600 text-white shadow-sm'
                    : 'text-slate-600 dark:text-slate-300 hover:text-navy-800 dark:hover:text-slate-100 hover:bg-slate-100/60 dark:hover:bg-navy-800/60'
                }`}
              >
                <Users className="h-4 w-4" />
                <span>Merchant List</span>
              </Link>

              <Link
                href="/admin/memos"
                onClick={onClose}
                className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  isCurrent('/admin/memos')
                    ? 'bg-orange-600 text-white shadow-sm'
                    : 'text-slate-600 dark:text-slate-300 hover:text-navy-800 dark:hover:text-slate-100 hover:bg-slate-100/60 dark:hover:bg-navy-800/60'
                }`}
              >
                <Printer className="h-4 w-4" />
                <span>Memo / Invoice</span>
              </Link>
            </div>
          </div>

          {/* Warehouse Section */}
          <div>
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 px-3">
              Warehouse Section
            </span>
            <div className="mt-2 space-y-1">
              {/* Products Collapsible Option + Sub-tabs */}
              <div className="space-y-1">
                <div
                  onClick={() => setIsProductsExpanded((prev) => !prev)}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm font-medium transition-colors cursor-pointer select-none ${
                    isCurrent('/admin/products')
                      ? 'bg-orange-600 text-white shadow-sm'
                      : 'text-slate-600 dark:text-slate-300 hover:text-navy-800 dark:hover:text-slate-100 hover:bg-slate-100/60 dark:hover:bg-navy-800/60'
                  }`}
                >
                  <Link
                    href="/admin/products"
                    onClick={(e) => {
                      e.stopPropagation();
                      setIsProductsExpanded(true);
                      onClose();
                    }}
                    className="flex items-center gap-3 flex-1"
                  >
                    <Package className="h-4 w-4" />
                    <span>Products</span>
                  </Link>
                  <div className="flex items-center gap-1.5">
                    <span className="text-[11px] tabular-nums px-1.5 py-0.5 rounded bg-black/20">
                      SKUs &amp; Bins
                    </span>
                    {isProductsExpanded ? (
                      <ChevronDown className="h-3.5 w-3.5 text-navy-800 dark:text-white/80" />
                    ) : (
                      <ChevronRight className="h-3.5 w-3.5 text-slate-600 dark:text-slate-300" />
                    )}
                  </div>
                </div>

                {/* Sub-options under Products */}
                {isProductsExpanded && (
                  <Suspense fallback={<div className="ml-4 pl-3 border-l border-slate-200 dark:border-white/10 py-1" />}>
                    <ProductsSubNav
                      pathname={pathname}
                      onItemClick={onClose}
                    />
                  </Suspense>
                )}
              </div>

              {/* Orders Single Link */}
              <Link
                href="/admin/orders"
                onClick={onClose}
                className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  isCurrent('/admin/orders')
                    ? 'bg-orange-600 text-white shadow-sm'
                    : 'text-slate-600 dark:text-slate-300 hover:text-navy-800 dark:hover:text-slate-100 hover:bg-slate-100/60 dark:hover:bg-navy-800/60'
                }`}
              >
                <span className="flex items-center gap-3">
                  <Boxes className="h-4 w-4" />
                  <span>Orders</span>
                </span>
                <span className="text-[11px] tabular-nums px-1.5 py-0.5 rounded bg-black/20">
                  Pipeline
                </span>
              </Link>

              {/* Delivery & Dispatch Tracker */}
              <Link
                href="/admin/delivery"
                onClick={onClose}
                className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  isCurrent('/admin/delivery')
                    ? 'bg-orange-600 text-white shadow-sm'
                    : 'text-slate-600 dark:text-slate-300 hover:text-navy-800 dark:hover:text-slate-100 hover:bg-slate-100/60 dark:hover:bg-navy-800/60'
                }`}
              >
                <span className="flex items-center gap-3">
                  <Truck className="h-4 w-4" />
                  <span>Delivery &amp; Dispatch</span>
                </span>
                <span className="text-[11px] tabular-nums px-1.5 py-0.5 rounded bg-black/20">
                  Tracker
                </span>
              </Link>

              {/* Returns & RTO */}
              <Link
                href="/admin/returns"
                onClick={onClose}
                className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  isCurrent('/admin/returns')
                    ? 'bg-orange-600 text-white shadow-sm'
                    : 'text-slate-600 dark:text-slate-300 hover:text-navy-800 dark:hover:text-slate-100 hover:bg-slate-100/60 dark:hover:bg-navy-800/60'
                }`}
              >
                <RotateCcw className="h-4 w-4" />
                <span>Returns &amp; RTO</span>
              </Link>

              {/* Stock & Cycle Count */}
              <Link
                href="/admin/stock"
                onClick={onClose}
                className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  isCurrent('/admin/stock')
                    ? 'bg-orange-600 text-white shadow-sm'
                    : 'text-slate-600 dark:text-slate-300 hover:text-navy-800 dark:hover:text-slate-100 hover:bg-slate-100/60 dark:hover:bg-navy-800/60'
                }`}
              >
                <SlidersHorizontal className="h-4 w-4" />
                <span>Stock &amp; Cycle Count</span>
              </Link>
            </div>
          </div>

          {/* Financials & Settings */}
          <div>
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 px-3">
              Financials &amp; Settings
            </span>
            <div className="mt-2 space-y-1">
              <Link
                href="/admin/payouts"
                onClick={onClose}
                className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  isCurrent('/admin/payouts')
                    ? 'bg-orange-600 text-white shadow-sm'
                    : 'text-slate-600 dark:text-slate-300 hover:text-navy-800 dark:hover:text-slate-100 hover:bg-slate-100/60 dark:hover:bg-navy-800/60'
                }`}
              >
                <HandCoins className="h-4 w-4" />
                <span>Payment Requests</span>
              </Link>

              <Link
                href="/admin/billing"
                onClick={onClose}
                className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  isCurrent('/admin/billing')
                    ? 'bg-orange-600 text-white shadow-sm'
                    : 'text-slate-600 dark:text-slate-300 hover:text-navy-800 dark:hover:text-slate-100 hover:bg-slate-100/60 dark:hover:bg-navy-800/60'
                }`}
              >
                <CreditCard className="h-4 w-4" />
                <span>Billing &amp; COD Settlement</span>
              </Link>

              <Link
                href="/admin/couriers"
                onClick={onClose}
                className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  isCurrent('/admin/couriers')
                    ? 'bg-orange-600 text-white shadow-sm'
                    : 'text-slate-600 dark:text-slate-300 hover:text-navy-800 dark:hover:text-slate-100 hover:bg-slate-100/60 dark:hover:bg-navy-800/60'
                }`}
              >
                <Settings className="h-4 w-4" />
                <span>Courier Integration</span>
              </Link>
            </div>
          </div>
        </nav>
      </div>

      {/* 3. FIXED BOTTOM CORNER: Super Admin & Sign Out */}
      <div className="shrink-0 p-4 border-t border-slate-200 dark:border-white/10 bg-white/95 dark:bg-navy-950/95 backdrop-blur-xs">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="h-9 w-9 rounded-xl bg-orange-500/10 border border-orange-500/20 text-orange-600 dark:text-orange-400 flex items-center justify-center font-extrabold text-xs shrink-0">
              SA
            </div>
            <div className="min-w-0">
              <span className="font-bold text-xs text-navy-900 dark:text-slate-100 block truncate leading-tight">
                Super Admin
              </span>
              <span className="text-[11px] text-slate-500 dark:text-slate-400 truncate block leading-tight">
                admin@fulfillio.online
              </span>
            </div>
          </div>
          <Link
            href="/login"
            className="flex items-center gap-1.5 text-xs font-bold text-rose-600 dark:text-rose-400 hover:text-rose-700 dark:hover:text-rose-300 hover:bg-rose-50 dark:hover:bg-rose-950/40 px-2.5 py-1.5 rounded-lg border border-transparent hover:border-rose-200 dark:hover:border-rose-900/50 transition-colors shrink-0 cursor-pointer"
            title="Sign out of Admin Console"
          >
            <LogOut className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Sign Out</span>
          </Link>
        </div>
      </div>
    </aside>
  );
}

function ProductsSubNav({
  pathname,
  onItemClick,
}: {
  pathname: string;
  onItemClick: () => void;
}) {
  const searchParams = useSearchParams();
  const isProductsRoute = pathname.startsWith('/admin/products');
  const currentTab = searchParams.get('tab') || 'all';

  const subOptions = [
    { tab: 'all', label: 'All Products' },
    { tab: 'approval', label: 'Product Approval' },
    { tab: 'bins', label: 'Warehouse Bins' },
  ];

  return (
    <div className="ml-4 pl-3 border-l border-slate-200 dark:border-white/10 space-y-0.5 py-1">
      {subOptions.map((sub) => {
        const isActive = isProductsRoute && currentTab === sub.tab;
        return (
          <Link
            key={sub.tab}
            href={`/admin/products?tab=${sub.tab}`}
            onClick={onItemClick}
            className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-md text-xs font-medium transition-all ${
              isActive
                ? 'bg-orange-500/10 text-orange-600 dark:text-orange-400 font-semibold border border-orange-500/30 shadow-2xs'
                : 'text-slate-600 dark:text-slate-300 hover:text-navy-800 dark:hover:text-slate-100 hover:bg-slate-100/40 dark:hover:bg-navy-800/40'
            }`}
          >
            <span>{sub.label}</span>
            {isActive && (
              <span className="w-1.5 h-1.5 rounded-full bg-orange-500 shadow-2xs shadow-orange-500" />
            )}
          </Link>
        );
      })}
    </div>
  );
}
