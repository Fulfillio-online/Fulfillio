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
  RotateCcw,
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
      label: 'Overview',
      href: '/merchant/overview',
      icon: LayoutDashboard,
    },
    {
      id: 'products' as MerchantTab,
      label: 'Products',
      href: '/merchant/products',
      icon: Package,
    },
    {
      id: 'stock-requests' as MerchantTab,
      label: 'Stock Requests',
      href: '/merchant/stock-requests',
      icon: Layers,
    },
    {
      id: 'orders' as MerchantTab,
      label: 'Orders',
      href: '/merchant/orders',
      icon: ShoppingCart,
    },
    {
      id: 'returns' as MerchantTab,
      label: 'Returns & Cancels',
      href: '/merchant/returns',
      icon: RotateCcw,
      badge: 'Hub',
    },
    {
      id: 'memo-designer' as MerchantTab,
      label: 'Memos',
      href: '/merchant/memos',
      icon: Layers,
    },
    {
      id: 'inbound' as MerchantTab,
      label: 'Inbound & ASNs',
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
    if (item.href === '/merchant/overview') {
      return pathname === '/merchant' || pathname === '/merchant/overview';
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
                      : 'text-slate-600 dark:text-slate-300 hover:text-orange-600 dark:hover:text-white hover:bg-orange-50/70 dark:hover:bg-navy-800/80'
                  }`}
                >
                  <Icon className="h-4 w-4 shrink-0" />
                  <span className="truncate">{item.label}</span>
                  {(item as any).badge && (
                    <span
                      className={`ml-auto text-[10px] font-bold tabular-nums px-1.5 py-0.5 rounded ${
                        isActive
                          ? 'bg-black/20 text-white'
                          : 'bg-orange-500/10 text-orange-600 dark:text-orange-400'
                      }`}
                    >
                      {(item as any).badge}
                    </span>
                  )}
                </Link>
              );
            })}
          </nav>
        </div>

                {/* 3. FIXED BOTTOM CORNER: Sign Out */}
        <div className="shrink-0 p-3 sm:p-4 border-t border-slate-200 dark:border-white/10 bg-white/95 dark:bg-navy-950/95 backdrop-blur-xs">
          <div className="flex items-center justify-between text-xs px-1">
            <span className="text-slate-400 dark:text-slate-500 text-[11px]">Mode: Merchant</span>
            <Link
              href="/login"
              onClick={() => {
                try {
                  localStorage.removeItem('fulfillio_active_merchant_session_v1');
                  localStorage.removeItem('fulfillio_merchant_token');
                  localStorage.removeItem('fulfillio_token');
                } catch {}
              }}
              className="text-rose-600 dark:text-rose-400 hover:text-rose-700 dark:hover:text-rose-300 font-semibold transition-colors flex items-center gap-1 cursor-pointer py-1 px-2 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-950/30"
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
