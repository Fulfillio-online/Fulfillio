'use client';

import React, { useState } from 'react';
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
} from 'lucide-react';
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

  const getHeaderTitle = () => {
    if (activeTab) {
      switch (activeTab) {
        case 'overview': return 'Overview';
        case 'products': return 'Products';
        case 'orders': return 'Orders';
        case 'memo-designer': return 'Memo Designer';
        case 'inbound':
        case 'tracking': return 'Inbound ASNs';
        case 'billing': return 'Payout & Billing';
        case 'api-keys': return 'API Keys & Webhooks';
        case 'profile': return 'My Profile';
      }
    }
    if (pathname.includes('/products')) return 'Products';
    if (pathname.includes('/orders')) return 'Orders';
    if (pathname.includes('/memos')) return 'Memo Designer';
    if (pathname.includes('/inbound')) return 'Inbound ASNs';
    if (pathname.includes('/billing')) return 'Payout & Billing';
    if (pathname.includes('/api-keys')) return 'API Keys & Webhooks';
    if (pathname.includes('/profile')) return 'My Profile';
    return 'Overview';
  };

  return (
    <header className="w-full min-w-0 h-16 border-b border-slate-800 px-3.5 sm:px-6 lg:px-8 flex items-center justify-between gap-2 bg-slate-900/60 sticky top-0 z-20 backdrop-blur">
      <div className="flex items-center gap-2 min-w-0">
        <button
          type="button"
          onClick={onOpenMobileSidebar}
          className="lg:hidden p-2 -ml-1 rounded-lg border border-slate-800 bg-slate-900 text-slate-300 hover:text-white hover:bg-slate-800 transition-colors shrink-0 cursor-pointer"
          aria-label="Open navigation menu"
        >
          <Menu className="h-5 w-5" />
        </button>
        <span className="text-slate-500 text-sm hidden sm:inline">Merchant Portal</span>
        <ChevronRight className="h-4 w-4 text-slate-600 hidden sm:inline shrink-0" />
        <span className="font-bold text-xs sm:text-sm uppercase tracking-wide text-slate-200 truncate">
          {getHeaderTitle()}
        </span>
      </div>

      <div className="flex items-center gap-2 sm:gap-3 shrink-0">
        {/* Notification Bell */}
        <button
          type="button"
          aria-label="Notifications"
          className="h-9 w-9 rounded-lg border border-slate-800 bg-slate-900 flex items-center justify-center text-slate-400 hover:text-slate-200 transition-colors relative shrink-0"
        >
          <Bell className="h-4 w-4" />
          <span className="absolute top-2 right-2 h-2 w-2 rounded-full bg-emerald-500" />
        </button>

        {/* User Dropdown Menu */}
        <div className="relative">
          <button
            type="button"
            onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
            className="flex items-center gap-2 sm:gap-2.5 p-1.5 pr-2 sm:pr-3 rounded-lg border border-slate-800 bg-slate-900 hover:bg-slate-800 transition-colors text-left cursor-pointer"
          >
            <div className="h-7 w-7 rounded-full bg-gradient-to-tr from-emerald-600 to-teal-400 flex items-center justify-center text-xs font-bold text-white shadow-sm shrink-0">
              {profile.ownerName
                .split(' ')
                .map((n: string) => n[0])
                .join('')
                .slice(0, 2)
                .toUpperCase() || 'SA'}
            </div>
            <div className="hidden sm:block">
              <span className="text-xs font-bold text-slate-200 block leading-tight">
                {profile.ownerName}
              </span>
              <span className="text-[10px] font-mono text-emerald-400 block leading-none">
                {profile.merchantCode}
              </span>
            </div>
            <ChevronDown className="h-3.5 w-3.5 text-slate-400 ml-0.5 sm:ml-1" />
          </button>

          {isUserMenuOpen && (
            <div className="absolute right-0 mt-2 w-56 rounded-xl bg-slate-900 border border-slate-800 shadow-2xl py-1 z-30 animate-in fade-in zoom-in-95">
              <div className="px-4 py-2 border-b border-slate-800">
                <span className="text-xs font-bold text-slate-200 block">{profile.storeName}</span>
                <span className="text-[11px] text-slate-400 block truncate">{profile.email}</span>
                <div className="mt-1 flex items-center gap-1 text-[10px] font-semibold text-emerald-400">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                  <span>Verified Merchant</span>
                </div>
              </div>

              <div className="py-1">
                <Link
                  href="/merchant/profile"
                  onClick={() => setIsUserMenuOpen(false)}
                  className="w-full px-4 py-2 text-left text-xs text-slate-300 hover:bg-slate-800 flex items-center gap-2"
                >
                  <User className="h-3.5 w-3.5 text-slate-400" />
                  <span>My Store Profile</span>
                </Link>
                <Link
                  href="/merchant/billing"
                  onClick={() => setIsUserMenuOpen(false)}
                  className="w-full px-4 py-2 text-left text-xs text-slate-300 hover:bg-slate-800 flex items-center gap-2"
                >
                  <CreditCard className="h-3.5 w-3.5 text-slate-400" />
                  <span>Payout & Settlements</span>
                </Link>
                <Link
                  href="/merchant/api-keys"
                  onClick={() => setIsUserMenuOpen(false)}
                  className="w-full px-4 py-2 text-left text-xs text-slate-300 hover:bg-slate-800 flex items-center gap-2"
                >
                  <Key className="h-3.5 w-3.5 text-slate-400" />
                  <span>API Keys & Webhooks</span>
                </Link>
              </div>

              <div className="border-t border-slate-800 py-1">
                <Link
                  href="/login"
                  onClick={() => {
                    try {
                      localStorage.removeItem('fulfillio_active_merchant_session_v1');
                    } catch {}
                  }}
                  className="w-full px-4 py-2 text-left text-xs text-rose-400 hover:bg-rose-500/10 flex items-center gap-2 font-medium"
                >
                  <Lock className="h-3.5 w-3.5" />
                  <span>Sign Out</span>
                </Link>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
