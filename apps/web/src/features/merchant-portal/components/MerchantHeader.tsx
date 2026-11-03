'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  Menu,
  ChevronRight,
  ExternalLink,
  Plus,
  Bell,
  ChevronDown,
  User,
  CreditCard,
  Key,
  Lock,
} from 'lucide-react';
import { MerchantProfileData, MerchantTab } from '../types';

interface MerchantHeaderProps {
  activeTab: MerchantTab;
  onSelectTab: (tab: MerchantTab) => void;
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

  const getTabLabel = (tab: MerchantTab) => {
    switch (tab) {
      case 'overview':
        return 'Overview';
      case 'products':
        return 'Products';
      case 'orders':
        return 'Orders';
      case 'memo-designer':
        return 'Memo Designer';
      case 'tracking':
        return 'Inbound Tracking';
      case 'billing':
        return 'Payout & Billing';
      case 'api-keys':
        return 'API Keys & Webhooks';
      case 'profile':
        return 'My Profile';
    }
  };

  return (
    <header className="h-16 border-b border-slate-800 px-4 sm:px-6 lg:px-8 flex items-center justify-between gap-2 bg-slate-900/60 sticky top-0 z-20 backdrop-blur">
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
          {getTabLabel(activeTab)}
        </span>
      </div>

      <div className="flex items-center gap-2 sm:gap-3 shrink-0">
        <Link
          href="/wms/packing"
          target="_blank"
          className="hidden md:flex text-xs font-semibold px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-colors items-center gap-1.5"
        >
          <span>Packing Station</span>
          <ExternalLink className="h-3 w-3" />
        </Link>

        <button
          type="button"
          onClick={() => onSelectTab('memo-designer')}
          className="text-xs font-semibold px-2.5 sm:px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white transition-colors flex items-center gap-1.5 cursor-pointer shadow-sm"
        >
          <Plus className="h-3.5 w-3.5 shrink-0" />
          <span className="hidden sm:inline">Create Memo</span>
          <span className="sm:hidden">Memo</span>
        </button>

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
                .map((n) => n[0])
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
            <div className="absolute right-0 mt-2 w-64 rounded-xl border border-slate-800 bg-slate-900 shadow-2xl p-2 z-30 space-y-1 animate-in fade-in zoom-in-95 duration-150">
              <div className="px-3 py-2 border-b border-slate-800">
                <span className="text-xs font-bold text-slate-200 block">{profile.storeName}</span>
                <span className="text-[11px] text-slate-400 block truncate">{profile.email}</span>
                <div className="mt-1 flex items-center gap-1.5">
                  <span className="text-[10px] font-mono font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 px-1.5 py-0.5 rounded">
                    Merchant ID: {profile.merchantCode}
                  </span>
                </div>
              </div>

              <button
                type="button"
                onClick={() => {
                  onSelectTab('profile');
                  setIsUserMenuOpen(false);
                }}
                className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium text-slate-300 hover:bg-slate-800 transition-colors cursor-pointer text-left"
              >
                <User className="h-3.5 w-3.5 text-emerald-400" />
                <span>My Profile &amp; Identity</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  onSelectTab('profile');
                  setIsUserMenuOpen(false);
                  onOpenManagePayout?.();
                }}
                className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium text-slate-300 hover:bg-slate-800 transition-colors cursor-pointer text-left"
              >
                <CreditCard className="h-3.5 w-3.5 text-indigo-400" />
                <span>Payout &amp; Settlement Setup</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  onSelectTab('api-keys');
                  setIsUserMenuOpen(false);
                }}
                className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium text-slate-300 hover:bg-slate-800 transition-colors cursor-pointer text-left"
              >
                <Key className="h-3.5 w-3.5 text-amber-400" />
                <span>API Keys &amp; Webhooks</span>
              </button>

              <div className="pt-1 border-t border-slate-800">
                <Link
                  href="/"
                  className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium text-rose-400 hover:bg-rose-500/10 transition-colors"
                >
                  <Lock className="h-3.5 w-3.5" />
                  <span>Log Out Session</span>
                </Link>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
