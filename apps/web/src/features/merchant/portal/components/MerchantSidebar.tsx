'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Package,
  ShoppingCart,
  Layers,
  Truck,
  CreditCard,
  Key,
  User,
  X,
  LogOut,
  ShieldCheck,
} from 'lucide-react';
import { MerchantProfileData, MerchantTab } from '../types';

interface MerchantSidebarProps {
  activeTab?: MerchantTab;
  onSelectTab?: (tab: MerchantTab) => void;
  profile: MerchantProfileData;
  isMobileOpen: boolean;
  onCloseMobile: () => void;
}

export function MerchantSidebar({
  activeTab,
  onSelectTab,
  profile,
  isMobileOpen,
  onCloseMobile,
}: MerchantSidebarProps) {
  const pathname = usePathname();

  const navItems = [
    {
      id: 'overview' as MerchantTab,
      label: 'Store Overview',
      href: '/merchant',
      icon: LayoutDashboard,
    },
    {
      id: 'products' as MerchantTab,
      label: 'Products Catalog',
      href: '/merchant/products',
      icon: Package,
    },
    {
      id: 'orders' as MerchantTab,
      label: 'Customer Orders',
      href: '/merchant/orders',
      icon: ShoppingCart,
    },
    {
      id: 'memo-designer' as MerchantTab,
      label: 'Memo / Invoice Slip',
      href: '/merchant/memos',
      icon: Layers,
    },
    {
      id: 'inbound' as MerchantTab,
      label: 'Inbound ASNs & Dock',
      href: '/merchant/inbound',
      icon: Truck,
    },
    {
      id: 'billing' as MerchantTab,
      label: 'Earnings & Payouts',
      href: '/merchant/billing',
      icon: CreditCard,
    },
    {
      id: 'api-keys' as MerchantTab,
      label: 'API Keys & Webhooks',
      href: '/merchant/api-keys',
      icon: Key,
    },
    {
      id: 'profile' as MerchantTab,
      label: 'My Store Profile',
      href: '/merchant/profile',
      icon: User,
    },
  ];

  const checkIsActive = (item: (typeof navItems)[0]) => {
    if (activeTab) return activeTab === item.id;
    if (item.href === '/merchant') {
      return pathname === '/merchant';
    }
    return pathname.startsWith(item.href);
  };

  return (
    <>
      {/* Mobile Backdrop Overlay */}
      {isMobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-navy-950/80 backdrop-blur-sm lg:hidden animate-in fade-in"
          onClick={onCloseMobile}
        />
      )}

      <aside
        className={`fixed inset-y-0 left-0 z-50 w-72 lg:w-64 h-full bg-white dark:bg-navy-950 border-r border-slate-200 dark:border-white/10 flex flex-col justify-between shrink-0 transition-transform duration-200 ease-in-out lg:translate-x-0 ${
          isMobileOpen ? 'translate-x-0 shadow-2xl' : '-translate-x-full'
        }`}
      >
        {/* 1. FIXED TOP CORNER: Logo & Brand Header */}
        <div className="shrink-0 px-5 py-4 border-b border-slate-200 dark:border-white/10 bg-white/95 dark:bg-navy-950/95 backdrop-blur-xs flex items-center justify-between">
          <Link
            href="/merchant"
            onClick={onCloseMobile}
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
                MERCHANT PORTAL
              </span>
            </div>
          </Link>

          <button
            onClick={onCloseMobile}
            className="lg:hidden p-1.5 rounded-lg text-slate-400 hover:text-navy-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-navy-900 transition-colors cursor-pointer"
            aria-label="Close sidebar"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* 2. SCROLLABLE MIDDLE: Navigation Menu */}
        <div className="flex-1 min-h-0 overflow-y-auto px-4 py-4 space-y-4 overscroll-contain">
          <nav className="space-y-1">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 px-3 block mb-2">
              Store Management
            </span>

            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = checkIsActive(item);
              return (
                <Link
                  key={item.id}
                  href={item.href}
                  onClick={() => {
                    if (onSelectTab) onSelectTab(item.id);
                    onCloseMobile();
                  }}
                  className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                    isActive
                      ? 'bg-orange-600 text-white shadow-sm font-bold'
                      : 'text-slate-600 dark:text-slate-300 hover:text-navy-800 dark:hover:text-slate-100 hover:bg-slate-100/60 dark:hover:bg-navy-800/60'
                  }`}
                >
                  <Icon className="h-4 w-4 shrink-0" />
                  <span className="truncate">{item.label}</span>
                </Link>
              );
            })}
          </nav>
        </div>

        {/* 3. FIXED BOTTOM CORNER: Store Profile & Sign Out */}
        <div className="shrink-0 p-4 border-t border-slate-200 dark:border-white/10 bg-white/95 dark:bg-navy-950/95 backdrop-blur-xs space-y-3">
          <div className="p-3 rounded-xl bg-slate-50 dark:bg-navy-900/70 border border-slate-200/80 dark:border-white/10">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-navy-900 dark:text-white truncate block max-w-[130px]">
                {profile.storeName || 'Merchant Store'}
              </span>
              <span className="text-[10px] font-mono font-bold text-orange-600 dark:text-orange-400 bg-orange-500/10 dark:bg-orange-500/20 px-1.5 py-0.5 rounded">
                {profile.merchantCode}
              </span>
            </div>
            <div className="flex items-center gap-1.5 mt-1.5 text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold">
              <ShieldCheck className="h-3.5 w-3.5" />
              <span>Verified Merchant</span>
            </div>
          </div>

          <div className="flex items-center justify-between text-xs px-1">
            <span className="text-slate-400 dark:text-slate-500 text-[11px]">Mode: Merchant</span>
            <Link
              href="/login"
onClick={() => {
                try {
                  localStorage.removeItem('fulfillio_active_merchant_session_v1');
                } catch {}
              }}
              className="text-rose-600 dark:text-rose-400 hover:text-rose-700 dark:hover:text-rose-300 font-semibold transition-colors flex items-center gap-1 cursor-pointer"
            >
              <LogOut className="h-3.5 w-3.5" />
              <span>Sign Out</span>
            </Link>
          </div>
        </div>
      </aside>
    </>
  );
}
