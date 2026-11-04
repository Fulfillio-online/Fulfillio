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
  PackageCheck,
  RotateCcw,
  SlidersHorizontal,
  CreditCard,
  Settings,
  ChevronDown,
  ChevronRight,
  ExternalLink,
} from 'lucide-react';

interface AdminSidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export function AdminSidebar({ isOpen, onClose }: AdminSidebarProps) {
  const pathname = usePathname();
  const [isProductsExpanded, setIsProductsExpanded] = useState(false);
  const [isOrdersExpanded, setIsOrdersExpanded] = useState(false);

  // Auto-expand when active route matches
  useEffect(() => {
    if (pathname.startsWith('/admin/products')) {
      setIsProductsExpanded(true);
    }
    if (pathname.startsWith('/admin/orders')) {
      setIsOrdersExpanded(true);
    }
  }, [pathname]);

  const isCurrent = (path: string, exact = false) => {
    if (exact) return pathname === path;
    return pathname.startsWith(path);
  };

  return (
    <aside
      className={`fixed inset-y-0 left-0 z-50 w-72 border-r border-slate-800 bg-slate-900 p-4 flex flex-col justify-between shrink-0 overflow-y-auto transition-transform duration-200 lg:static lg:h-full lg:w-64 lg:bg-slate-900/60 lg:translate-x-0 ${
        isOpen ? 'translate-x-0 shadow-2xl' : '-translate-x-full'
      }`}
    >
      <div>
        {/* Logo & Header */}
        <div className="flex items-center justify-between gap-2.5 px-3 py-4 mb-4 border-b border-slate-800">
          <Link
            href="/admin"
            onClick={onClose}
            className="flex items-center gap-2.5 group cursor-pointer"
          >
            <div className="h-9 w-9 rounded-lg bg-emerald-600 flex items-center justify-center font-bold text-white text-lg shadow-md group-hover:bg-emerald-500 transition-colors">
              F
            </div>
            <div>
              <span className="font-extrabold text-lg tracking-tight block">Fulfillio</span>
              <span className="text-[10px] uppercase font-bold text-emerald-400 tracking-wider">
                Admin Control Panel
              </span>
            </div>
          </Link>
        </div>

        {/* Navigation Links */}
        <nav className="space-y-4">
          {/* Overview */}
          <div>
            <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 px-3">
              Overview
            </span>
            <div className="mt-2 space-y-1">
              <Link
                href="/admin"
                onClick={onClose}
                className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  pathname === '/admin' || pathname === '/admin/dashboard'
                    ? 'bg-emerald-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                }`}
              >
                <LayoutDashboard className="h-4 w-4" />
                <span>Dashboard</span>
              </Link>
            </div>
          </div>

          {/* Merchant Section */}
          <div>
            <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 px-3">
              Merchant Section
            </span>
            <div className="mt-2 space-y-1">
              <Link
                href="/admin/merchants"
                onClick={onClose}
                className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  isCurrent('/admin/merchants')
                    ? 'bg-emerald-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
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
                    ? 'bg-emerald-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                }`}
              >
                <Printer className="h-4 w-4" />
                <span>Memo / Invoice</span>
              </Link>
            </div>
          </div>

          {/* Warehouse Section */}
          <div>
            <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 px-3">
              Warehouse Section
            </span>
            <div className="mt-2 space-y-1">
              {/* Products Collapsible Option + Sub-tabs */}
              <div className="space-y-1">
                <div
                  onClick={() => setIsProductsExpanded((prev) => !prev)}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm font-medium transition-colors cursor-pointer select-none ${
                    isCurrent('/admin/products')
                      ? 'bg-emerald-600 text-white shadow-sm'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
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
                    <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-black/20">
                      SKUs &amp; Bins
                    </span>
                    {isProductsExpanded ? (
                      <ChevronDown className="h-3.5 w-3.5 text-white/80" />
                    ) : (
                      <ChevronRight className="h-3.5 w-3.5 text-slate-400" />
                    )}
                  </div>
                </div>

                {/* Sub-options under Products */}
                {isProductsExpanded && (
                  <Suspense fallback={<div className="ml-4 pl-3 border-l border-slate-800 py-1" />}>
                    <ProductsSubNav
                      pathname={pathname}
                      onItemClick={onClose}
                    />
                  </Suspense>
                )}
              </div>

              {/* Orders Collapsible Option + Sub-tabs */}
              <div className="space-y-1">
                <div
                  onClick={() => setIsOrdersExpanded((prev) => !prev)}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm font-medium transition-colors cursor-pointer select-none ${
                    isCurrent('/admin/orders')
                      ? 'bg-emerald-600 text-white shadow-sm'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                  }`}
                >
                  <Link
                    href="/admin/orders"
                    onClick={(e) => {
                      e.stopPropagation();
                      setIsOrdersExpanded(true);
                      onClose();
                    }}
                    className="flex items-center gap-3 flex-1"
                  >
                    <Boxes className="h-4 w-4" />
                    <span>Orders</span>
                  </Link>
                  <div className="flex items-center gap-1.5">
                    <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-black/20">
                      Pipeline
                    </span>
                    {isOrdersExpanded ? (
                      <ChevronDown className="h-3.5 w-3.5 text-white/80" />
                    ) : (
                      <ChevronRight className="h-3.5 w-3.5 text-slate-400" />
                    )}
                  </div>
                </div>

                {/* Sub-options under Orders */}
                {isOrdersExpanded && (
                  <Suspense fallback={<div className="ml-4 pl-3 border-l border-slate-800 py-1" />}>
                    <OrdersSubNav
                      pathname={pathname}
                      onItemClick={onClose}
                    />
                  </Suspense>
                )}
              </div>

              {/* Delivery & Dispatch Tracker */}
              <Link
                href="/admin/delivery"
                onClick={onClose}
                className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  isCurrent('/admin/delivery')
                    ? 'bg-emerald-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                }`}
              >
                <span className="flex items-center gap-3">
                  <Truck className="h-4 w-4" />
                  <span>Delivery &amp; Dispatch</span>
                </span>
                <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-black/20">
                  Tracker
                </span>
              </Link>

            

              {/* Returns & RTO */}
              <Link
                href="/admin/returns"
                onClick={onClose}
                className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  isCurrent('/admin/returns')
                    ? 'bg-emerald-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
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
                    ? 'bg-emerald-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                }`}
              >
                <SlidersHorizontal className="h-4 w-4" />
                <span>Stock &amp; Cycle Count</span>
              </Link>
            </div>
          </div>

          {/* Financials & Settings */}
          <div>
            <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 px-3">
              Financials &amp; Settings
            </span>
            <div className="mt-2 space-y-1">
              <Link
                href="/admin/billing"
                onClick={onClose}
                className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  isCurrent('/admin/billing')
                    ? 'bg-emerald-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
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
                    ? 'bg-emerald-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                }`}
              >
                <Settings className="h-4 w-4" />
                <span>Courier Integration</span>
              </Link>
            </div>
          </div>
        </nav>
      </div>

      {/* User Badge & Sign Out */}
      <div className="border-t border-slate-800 pt-3 space-y-2 text-xs text-slate-400">
        <div className="flex items-center justify-between">
          <div>
            <span className="font-semibold text-slate-200 block">Super Admin</span>
            <span>admin@fulfillio.online</span>
          </div>
          <Link
            href="/login"
            className="text-rose-400 hover:text-rose-300 font-semibold transition-colors"
          >
            Sign Out
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
    <div className="ml-4 pl-3 border-l border-slate-800 space-y-0.5 py-1">
      {subOptions.map((sub) => {
        const isActive = isProductsRoute && currentTab === sub.tab;
        return (
          <Link
            key={sub.tab}
            href={`/admin/products?tab=${sub.tab}`}
            onClick={onItemClick}
            className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-md text-xs font-medium transition-all ${
              isActive
                ? 'bg-emerald-500/20 text-emerald-300 font-semibold border border-emerald-500/40 shadow-sm'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
            }`}
          >
            <span>{sub.label}</span>
            {isActive && (
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shadow-sm shadow-emerald-400" />
            )}
          </Link>
        );
      })}
    </div>
  );
}

function OrdersSubNav({
  pathname,
  onItemClick,
}: {
  pathname: string;
  onItemClick: () => void;
}) {
  const searchParams = useSearchParams();
  const isOrdersRoute = pathname.startsWith('/admin/orders');
  const currentTab = searchParams.get('tab') || 'all';

  const subOptions = [
    { tab: 'all', label: 'All Orders' },
    { tab: 'pick', label: 'Pick' },
    { tab: 'pack', label: 'Pack' },
    { tab: 'dispatch', label: 'Dispatch' },
  ];

  return (
    <div className="ml-4 pl-3 border-l border-slate-800 space-y-0.5 py-1">
      {subOptions.map((sub) => {
        const isActive = isOrdersRoute && currentTab === sub.tab;
        return (
          <Link
            key={sub.tab}
            href={`/admin/orders?tab=${sub.tab}`}
            onClick={onItemClick}
            className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-md text-xs font-medium transition-all ${
              isActive
                ? 'bg-emerald-500/20 text-emerald-300 font-semibold border border-emerald-500/40 shadow-sm'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
            }`}
          >
            <span>{sub.label}</span>
            {isActive && (
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shadow-sm shadow-emerald-400" />
            )}
          </Link>
        );
      })}
    </div>
  );
}
