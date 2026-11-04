'use client';

import React from 'react';
import { usePathname } from 'next/navigation';
import { Menu, ChevronRight, Search } from 'lucide-react';

interface AdminHeaderProps {
  onOpenMobileSidebar: () => void;
}

export function AdminHeader({ onOpenMobileSidebar }: AdminHeaderProps) {
  const pathname = usePathname();

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

  return (
    <header className="h-16 border-b border-slate-800 px-4 sm:px-6 lg:px-8 flex items-center justify-between gap-3 bg-slate-900/40 sticky top-0 z-10 backdrop-blur">
      <div className="flex items-center gap-2 min-w-0">
        <button
          type="button"
          onClick={onOpenMobileSidebar}
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
  );
}
