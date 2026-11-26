'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Menu,
  ChevronRight,
  Bell,
  ChevronDown,
  User,
  CreditCard,
  Key,
  Lock,
  Sun,
  Moon,
  Search,
  Store,
  Package,
  ShoppingCart,
  Layers,
  Truck,
  LayoutDashboard,
} from 'lucide-react';
import { useTheme } from '@/lib/hooks/useTheme';
import { MerchantProfileData, MerchantTab } from '../types';

interface MerchantHeaderProps {
  activeTab?: MerchantTab;
  onSelectTab?: (tab: MerchantTab) => void;
  profile: MerchantProfileData;
  onOpenMobileSidebar: () => void;
  onOpenManagePayout?: () => void;
}

export function MerchantHeader({
  activeTab,
  onSelectTab,
  profile,
  onOpenMobileSidebar,
  onOpenManagePayout,
}: MerchantHeaderProps) {
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
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

  const getHeaderInfo = () => {
    if (activeTab) {
      switch (activeTab) {
        case 'overview':
          return { title: 'Overview', subtitle: 'Live Metrics & Performance', icon: LayoutDashboard };
        case 'products':
          return { title: 'Products', subtitle: 'Stock & Bin Slotting', icon: Package };
        case 'orders':
          return { title: 'Orders', subtitle: 'Live Lifecycle & Attribution', icon: ShoppingCart };
        case 'memo-designer':
          return { title: 'Memos', subtitle: '4x6" Thermal Templates', icon: Layers };
        case 'inbound':
        case 'tracking':
          return { title: 'Inbound ASNs', subtitle: 'Dock Receiving & Manifests', icon: Truck };
        case 'billing':
          return { title: 'Payout & Billing', subtitle: 'COD Settlements & Statements', icon: CreditCard };
        case 'api-keys':
          return { title: 'API & Webhooks', subtitle: 'REST Integration Hub', icon: Key };
        case 'profile':
          return { title: 'My Store Profile', subtitle: 'Account & Business Settings', icon: User };
      }
    }
    if (pathname.includes('/products')) {
      return { title: 'Products', subtitle: 'Stock & Bin Slotting', icon: Package };
    }
    if (pathname.includes('/orders')) {
      return { title: 'Orders', subtitle: 'Live Lifecycle & Attribution', icon: ShoppingCart };
    }
    if (pathname.includes('/memos')) {
      return { title: 'Memos', subtitle: '4x6" Thermal Templates', icon: Layers };
    }
    if (pathname.includes('/inbound')) {
      return { title: 'Inbound ASNs', subtitle: 'Dock Receiving & Manifests', icon: Truck };
    }
    if (pathname.includes('/billing')) {
      return { title: 'Payout & Billing', subtitle: 'COD Settlements & Statements', icon: CreditCard };
    }
    if (pathname.includes('/api-keys')) {
      return { title: 'API & Webhooks', subtitle: 'REST Integration Hub', icon: Key };
    }
    if (pathname.includes('/profile')) {
      return { title: 'My Store Profile', subtitle: 'Account & Business Settings', icon: User };
    }
    return { title: 'Overview', subtitle: 'Live Metrics & Performance', icon: LayoutDashboard };
  };

  const headerInfo = getHeaderInfo();
  const HeaderIcon = headerInfo.icon;

  return (
    <header className="py-3 border-b border-slate-200 dark:border-white/10 px-4 sm:px-6 lg:px-8 flex items-center justify-between gap-3 bg-white/90 dark:bg-navy-950/90 sticky top-0 z-30 backdrop-blur-md shadow-xs transition-colors duration-200">
      {/* Left: Mobile Toggle + Page Title */}
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
          <div className="hidden sm:flex items-center gap-2 min-w-0 truncate">
            <div className="p-1.5 rounded-lg bg-slate-100 dark:bg-navy-900 text-orange-600 dark:text-orange-400 border border-slate-200/70 dark:border-white/10 shrink-0">
              <HeaderIcon className="h-4 w-4" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5">
                <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">Merchant</span>
                <ChevronRight className="h-3 w-3 text-slate-400" />
                <h2 className="text-sm sm:text-base font-bold text-navy-900 dark:text-white tracking-tight truncate leading-tight">
                  {headerInfo.title}
                </h2>
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate hidden md:block leading-tight">
                {headerInfo.subtitle}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Right: Dark/Light Mode + Profile Menu */}
      <div className="flex items-center gap-2 sm:gap-3 shrink-0">
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

        {/* User Dropdown Menu (Shows Store Name on trigger, User Details inside) */}
        <div className="relative">
          <button
            type="button"
            onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
            className="flex items-center gap-2 p-1.5 pr-2.5 rounded-xl border border-slate-200 dark:border-white/10 bg-slate-100 dark:bg-navy-900 hover:bg-slate-200 dark:hover:bg-navy-800 transition-colors text-left cursor-pointer"
          >
            <div className="h-7 w-7 rounded-lg bg-orange-600 flex items-center justify-center text-xs font-black text-white shadow-sm shrink-0">
              {(profile.storeName || "Sabbir's Store")
                .split(' ')
                .map((n) => n[0])
                .join('')
                .slice(0, 2)
                .toUpperCase() || 'SS'}
            </div>
            <div className="hidden md:block">
              <span className="text-xs font-bold text-navy-900 dark:text-white block leading-tight truncate max-w-[140px]">
                {profile.storeName || "Sabbir's Store"}
              </span>
              <span className="text-[10px] font-mono text-orange-600 dark:text-orange-400 block leading-none font-semibold">
                {profile.merchantCode}
              </span>
            </div>
            <ChevronDown className="h-3.5 w-3.5 text-slate-400 ml-0.5" />
          </button>

          {isUserMenuOpen && (
            <>
              {/* Outside click backdrop */}
              <div
                className="fixed inset-0 z-30"
                onClick={() => setIsUserMenuOpen(false)}
              />
              <div className="absolute right-0 mt-2 w-64 rounded-2xl bg-white dark:bg-navy-900 border border-slate-200 dark:border-white/10 shadow-2xl py-2 z-40 animate-in fade-in zoom-in-95">
                <div className="px-4 py-2.5 border-b border-slate-100 dark:border-white/10">
                  <span className="text-xs font-bold text-navy-900 dark:text-white block truncate">
                    {profile.ownerName || 'Sabbir Ahmed'}
                  </span>
                  <span className="text-[11px] text-slate-500 dark:text-slate-400 block truncate mt-0.5">
                    {profile.email || 'sabbir@fulfillio.online'}
                  </span>
                  <div className="mt-2 flex items-center justify-between gap-1 text-[10px]">
                    <span className="text-slate-400 truncate max-w-[120px] font-medium">
                      {profile.storeName || "Sabbir's Store"}
                    </span>
                    <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 font-semibold flex items-center gap-1">
                      <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                      Verified Merchant
                    </span>
                  </div>
                </div>

                <div className="py-1">
                  <Link
                    href="/merchant/profile"
                    onClick={() => setIsUserMenuOpen(false)}
                    className="w-full px-4 py-2 text-left text-xs text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-navy-800 flex items-center gap-2.5 transition-colors"
                  >
                    <User className="h-4 w-4 text-slate-400" />
                    <span>My Store Profile</span>
                  </Link>
                  <Link
                    href="/merchant/billing"
                    onClick={() => setIsUserMenuOpen(false)}
                    className="w-full px-4 py-2 text-left text-xs text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-navy-800 flex items-center gap-2.5 transition-colors"
                  >
                    <CreditCard className="h-4 w-4 text-slate-400" />
                    <span>Payout & Settlements</span>
                  </Link>
                  <Link
                    href="/merchant/api-keys"
                    onClick={() => setIsUserMenuOpen(false)}
                    className="w-full px-4 py-2 text-left text-xs text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-navy-800 flex items-center gap-2.5 transition-colors"
                  >
                    <Key className="h-4 w-4 text-slate-400" />
                    <span>API Keys & Webhooks</span>
                  </Link>
                </div>

                <div className="border-t border-slate-100 dark:border-white/10 pt-1">
                  <Link
                    href="/login"
                    onClick={() => {
                      try {
                        localStorage.removeItem('fulfillio_active_merchant_session_v1');
                        localStorage.removeItem('fulfillio_merchant_token');
                        localStorage.removeItem('fulfillio_token');
                      } catch {}
                    }}
                    className="w-full px-4 py-2 text-left text-xs text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-500/10 flex items-center gap-2.5 font-semibold transition-colors"
                  >
                    <Lock className="h-4 w-4" />
                    <span>Sign Out</span>
                  </Link>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
