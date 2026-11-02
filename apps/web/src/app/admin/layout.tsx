'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
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
  Menu,
  Search,
  ExternalLink,
} from 'lucide-react';

interface AdminLayoutProps {
  children: React.ReactNode;
}

export default function AdminLayout({ children }: AdminLayoutProps) {
  const pathname = usePathname();
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  // Collapsible sub-options states
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

  // Determine current active section title for top header
  const getSectionTitle = () => {
    if (pathname === '/admin' || pathname === '/admin/dashboard') return 'Dashboard';
    if (pathname.startsWith('/admin/merchants')) return 'Merchant Directory';
    if (pathname.startsWith('/admin/memos')) return 'Memo / Invoice';
    if (pathname.startsWith('/admin/products')) return 'Warehouse Products';
    if (pathname.startsWith('/admin/orders')) return 'Orders Pipeline';
    if (pathname.startsWith('/admin/delivery')) return 'Delivery & Dispatch Tracker';
    if (pathname.startsWith('/admin/returns')) return 'Returns & RTO';
    if (pathname.startsWith('/admin/stock')) return 'Stock & Cycle Count';
    if (pathname.startsWith('/admin/billing')) return 'Billing & Settlements';
    if (pathname.startsWith('/admin/couriers')) return 'Courier Integration';
    return 'Admin';
  };

  const isCurrent = (path: string, exact = false) => {
    if (exact) return pathname === path;
    return pathname.startsWith(path);
  };

  return (
    <div className="flex min-h-screen bg-slate-950 text-slate-100">
      {/* Mobile / Tablet Backdrop Overlay */}
      {isMobileSidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-slate-950/80 backdrop-blur-sm lg:hidden"
          onClick={() => setIsMobileSidebarOpen(false)}
        />
      )}

      {/* Sidebar Navigation */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-72 border-r border-slate-800 bg-slate-900 p-4 flex flex-col justify-between shrink-0 overflow-y-auto transition-transform duration-200 lg:static lg:w-64 lg:bg-slate-900/60 lg:translate-x-0 ${
          isMobileSidebarOpen ? 'translate-x-0 shadow-2xl' : '-translate-x-full'
        }`}
      >
        <div>
          {/* Logo & Header */}
          <div className="flex items-center justify-between gap-2.5 px-3 py-4 mb-4 border-b border-slate-800">
            <Link
              href="/admin"
              onClick={() => setIsMobileSidebarOpen(false)}
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
                  onClick={() => setIsMobileSidebarOpen(false)}
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
                  onClick={() => setIsMobileSidebarOpen(false)}
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
                  onClick={() => setIsMobileSidebarOpen(false)}
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
                        setIsMobileSidebarOpen(false);
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
                    <div className="ml-4 pl-3 border-l border-slate-800 space-y-0.5 py-1">
                      {[
                        { tab: 'all', label: 'All Products' },
                        { tab: 'approval', label: 'Product Approval' },
                        { tab: 'bins', label: 'Warehouse Bins' },
                      ].map((sub) => (
                        <Link
                          key={sub.tab}
                          href={`/admin/products?tab=${sub.tab}`}
                          onClick={() => setIsMobileSidebarOpen(false)}
                          className="w-full flex items-center justify-between px-2.5 py-1.5 rounded-md text-xs font-medium text-slate-400 hover:text-slate-200 hover:bg-slate-800/40 transition-colors"
                        >
                          <span>{sub.label}</span>
                        </Link>
                      ))}
                    </div>
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
                        setIsMobileSidebarOpen(false);
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
                    <div className="ml-4 pl-3 border-l border-slate-800 space-y-0.5 py-1">
                      {[
                        { tab: 'all', label: 'All Orders' },
                        { tab: 'pick', label: 'Pick' },
                        { tab: 'pack', label: 'Pack' },
                        { tab: 'dispatch', label: 'Dispatch' },
                      ].map((sub) => (
                        <Link
                          key={sub.tab}
                          href={`/admin/orders?tab=${sub.tab}`}
                          onClick={() => setIsMobileSidebarOpen(false)}
                          className="w-full flex items-center justify-between px-2.5 py-1.5 rounded-md text-xs font-medium text-slate-400 hover:text-slate-200 hover:bg-slate-800/40 transition-colors"
                        >
                          <span>{sub.label}</span>
                        </Link>
                      ))}
                    </div>
                  )}
                </div>

                {/* Delivery & Dispatch Tracker */}
                <Link
                  href="/admin/delivery"
                  onClick={() => setIsMobileSidebarOpen(false)}
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

                {/* Packing Station Direct Link */}
                <Link
                  href="/wms/packing"
                  target="_blank"
                  onClick={() => setIsMobileSidebarOpen(false)}
                  className="w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm font-medium text-emerald-400 hover:bg-emerald-950/40 border border-emerald-900/40 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <PackageCheck className="h-4 w-4" />
                    <span>Packing Station</span>
                  </div>
                  <ExternalLink className="h-3 w-3" />
                </Link>

                {/* Returns & RTO */}
                <Link
                  href="/admin/returns"
                  onClick={() => setIsMobileSidebarOpen(false)}
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
                  onClick={() => setIsMobileSidebarOpen(false)}
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
                  onClick={() => setIsMobileSidebarOpen(false)}
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
                  onClick={() => setIsMobileSidebarOpen(false)}
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

        {/* User Badge & Switcher */}
        <div className="border-t border-slate-800 pt-3 space-y-2 text-xs text-slate-400">
          <div className="flex items-center justify-between">
            <div>
              <span className="font-semibold text-slate-200 block">Super Admin</span>
              <span>admin@fulfillio.online</span>
            </div>
            <Link href="/" className="hover:text-emerald-400 transition-colors">
              Exit
            </Link>
          </div>

          <div className="pt-2 border-t border-slate-800/60">
            <Link
              href="/merchant"
              className="w-full flex items-center justify-between p-2 rounded-lg bg-indigo-950/40 hover:bg-indigo-900/60 border border-indigo-800/40 text-indigo-300 font-semibold transition-colors"
            >
              <span>Open Merchant Portal</span>
              <ExternalLink className="h-3 w-3" />
            </Link>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 min-w-0 flex flex-col overflow-x-hidden">
        {/* Top Header Bar */}
        <header className="h-16 border-b border-slate-800 px-4 sm:px-6 lg:px-8 flex items-center justify-between gap-3 bg-slate-900/40 sticky top-0 z-10 backdrop-blur">
          <div className="flex items-center gap-2 min-w-0">
            <button
              type="button"
              onClick={() => setIsMobileSidebarOpen(true)}
              className="lg:hidden p-2 rounded-lg bg-slate-900 border border-slate-800 text-slate-200 hover:text-emerald-400 shrink-0"
              aria-label="Open navigation menu"
            >
              <Menu className="h-5 w-5" />
            </button>
            <span className="hidden sm:inline text-slate-500 text-sm">Fulfillio 3PL</span>
            <ChevronRight className="hidden sm:inline h-4 w-4 text-slate-600" />
            <span className="font-bold text-xs sm:text-sm uppercase tracking-wide text-slate-200 truncate">
              {getSectionTitle()}
            </span>
          </div>

          <div className="flex items-center gap-2 sm:gap-4">
            <div className="relative hidden md:block">
              <Search className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
              <input
                type="text"
                placeholder="Search orders, SKU, merchants..."
                className="pl-9 pr-4 py-1.5 bg-slate-800/80 border border-slate-700 rounded-lg text-xs font-mono text-slate-200 placeholder:text-slate-500 focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div className="flex items-center gap-2 text-xs bg-emerald-950/60 text-emerald-300 border border-emerald-800/60 px-2.5 sm:px-3 py-1.5 rounded-lg shrink-0">
              <div className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
              <span className="hidden sm:inline">All 3PL Nodes Healthy</span>
              <span className="sm:hidden">Live</span>
            </div>
          </div>
        </header>

        {/* Dynamic Page Content */}
        <div className="p-4 sm:p-6 lg:p-8 space-y-6">
          {children}
        </div>
      </main>
    </div>
  );
}
