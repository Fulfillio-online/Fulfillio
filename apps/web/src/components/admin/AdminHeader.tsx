'use client';

import React, { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import {
  Menu,
  Search,
  Sun,
  Moon,
  Boxes,
  Activity,
  Layers,
  Store,
  FileText,
  Package,
  Truck,
  RotateCcw,
  CreditCard,
  Radio,
} from 'lucide-react';
import { useTheme } from '@/lib/hooks/useTheme';

interface AdminHeaderProps {
  onOpenMobileSidebar: () => void;
}

export function AdminHeader({ onOpenMobileSidebar }: AdminHeaderProps) {
  const pathname = usePathname();
  const { resolvedTheme, changeTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const isDark = mounted ? resolvedTheme === 'dark' : true;

  const handleToggleTheme = () => {
    const nextTheme = isDark ? 'light' : 'dark';
    changeTheme(nextTheme);
  };

  const getPageInfo = () => {
    if (pathname === '/admin' || pathname === '/admin/dashboard') {
      return {
        title: '3PL Dashboard',
        icon: Activity,
        subtitle: 'Executive Operations Overview',
      };
    }
    if (pathname.startsWith('/admin/merchants')) {
      return {
        title: 'Merchant Directory',
        icon: Store,
        subtitle: 'Verified Stores & Accounts',
      };
    }
    if (pathname.startsWith('/admin/memos')) {
      return {
        title: 'Memo / Invoices',
        icon: FileText,
        subtitle: 'Custom 4x6" Thermal Templates',
      };
    }
    if (pathname === '/admin/products') {
      return {
        title: 'Warehouse Products',
        icon: Package,
        subtitle: 'Master Catalog & Bin Slotting',
      };
    }
    if (pathname.startsWith('/admin/products/')) {
      return {
        title: 'Product Details',
        icon: Package,
        subtitle: 'Performance, Stock & Recent Orders',
      };
    }
    if (pathname.startsWith('/admin/orders')) {
      return {
        title: 'Orders Pipeline',
        icon: Layers,
        subtitle: 'Pick, Pack & Dispatch Queue',
      };
    }
    if (pathname.startsWith('/admin/delivery')) {
      return {
        title: 'Delivery & Dispatch',
        icon: Truck,
        subtitle: 'Courier Tracking & Handover',
      };
    }
    if (pathname.startsWith('/admin/returns')) {
      return {
        title: 'Returns & RTO',
        icon: RotateCcw,
        subtitle: 'Reverse Logistics & Restocking',
      };
    }
    if (pathname.startsWith('/admin/stock')) {
      return {
        title: 'Stock & Cycle Count',
        icon: Boxes,
        subtitle: 'Inventory Audits & Discrepancies',
      };
    }
    if (pathname.startsWith('/admin/billing')) {
      return {
        title: 'Billing & Settlements',
        icon: CreditCard,
        subtitle: 'Storage & Fulfillment Invoicing',
      };
    }
    if (pathname.startsWith('/admin/couriers')) {
      return {
        title: 'Courier Integration',
        icon: Radio,
        subtitle: 'Steadfast, Pathao & RedX API Hub',
      };
    }
    return {
      title: 'Admin Console',
      icon: Boxes,
      subtitle: 'System Control',
    };
  };

  const pageInfo = getPageInfo();
  const PageIcon = pageInfo.icon;

  return (
    <header className="py-3 border-b border-slate-200 dark:border-white/10 px-4 sm:px-6 lg:px-8 flex items-center justify-between gap-3 bg-white/90 dark:bg-navy-950/90 sticky top-0 z-30 backdrop-blur-md shadow-xs transition-colors duration-200">
      {/* Left: Mobile Toggle + Prominent Brand & Page Title */}
      <div className="flex items-center gap-3 min-w-0">
        <button
          type="button"
          onClick={onOpenMobileSidebar}
          className="lg:hidden p-2.5 rounded-xl bg-slate-100 dark:bg-navy-900 border border-slate-200 dark:border-white/10 text-navy-800 dark:text-slate-100 hover:text-orange-500 hover:border-orange-500/30 shrink-0 transition-colors cursor-pointer"
          aria-label="Open navigation menu"
        >
          <Menu className="h-5 w-5" />
        </button>

        <div className="flex items-center gap-2.5 min-w-0">
          
          {/* Active Page Title - Prominent, clean, and never small */}
          <div className="hidden sm:flex items-center gap-2 min-w-0 truncate">
            <div className="p-1.5 rounded-lg bg-slate-100 dark:bg-navy-900 text-orange-600 dark:text-orange-400 border border-slate-200/70 dark:border-white/10 shrink-0">
              <PageIcon className="h-4 w-4" />
            </div>
            <div className="min-w-0">
              <h2 className="text-sm sm:text-base font-bold text-navy-900 dark:text-white tracking-tight truncate leading-tight">
                {pageInfo.title}
              </h2>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate hidden md:block leading-tight">
                {pageInfo.subtitle}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Right: Search + Health Status + Dark/Light Mode Button */}
      <div className="flex items-center gap-2 sm:gap-3 shrink-0">
        {/* Search Input */}
        <div className="relative hidden md:block w-56 lg:w-72 xl:w-80">
          <Search className="h-4 w-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500" />
          <input
            type="text"
            placeholder="Search orders, SKU, merchants..."
            className="w-full pl-9 pr-12 py-2 bg-slate-100/90 dark:bg-navy-900/90 border border-slate-200 dark:border-white/10 rounded-xl text-xs sm:text-sm text-navy-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-orange-500/25 focus:border-orange-500 transition-all"
          />
          <kbd className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none hidden lg:inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded bg-white dark:bg-navy-800 border border-slate-200 dark:border-white/10 text-[10px] text-slate-500 font-mono">
            ⌘K
          </kbd>
        </div>

        {/* 3PL System Health status pill */}
        <div className="flex items-center gap-2 text-xs bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 border border-emerald-300/70 dark:border-emerald-800/60 px-3 py-2 rounded-xl shrink-0 font-medium shadow-2xs">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
          </span>
          <span className="hidden sm:inline font-semibold">All 3PL Nodes Healthy</span>
          <span className="sm:hidden font-semibold">Live</span>
        </div>

        {/* Dark / Light Mode Toggle Button */}
        <button
          type="button"
          onClick={handleToggleTheme}
          aria-label={isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
          title={isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
          className="flex items-center gap-2 px-3 py-2 rounded-xl border border-slate-200 dark:border-white/10 bg-slate-100 hover:bg-slate-200 dark:bg-navy-900 hover:dark:bg-navy-800 text-navy-800 dark:text-slate-100 transition-all text-xs font-semibold shadow-2xs cursor-pointer active:scale-95"
        >
          {isDark ? (
            <>
              <Sun className="h-4 w-4 text-amber-500 fill-amber-500 shrink-0" />
              <span className="hidden md:inline">Light Mode</span>
            </>
          ) : (
            <>
              <Moon className="h-4 w-4 text-indigo-600 fill-indigo-600 shrink-0" />
              <span className="hidden md:inline">Dark Mode</span>
            </>
          )}
        </button>
      </div>
    </header>
  );
}
