'use client';

import React from 'react';
import Link from 'next/link';
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
} from 'lucide-react';
import { MerchantProfileData, MerchantTab } from '../types';

interface MerchantSidebarProps {
  activeTab: MerchantTab;
  onSelectTab: (tab: MerchantTab) => void;
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
  const navItems = [
    { id: 'overview' as MerchantTab, label: 'Dashboard Overview', icon: LayoutDashboard },
    { id: 'products' as MerchantTab, label: 'Product Master & 2-Part SKU', icon: Package },
    { id: 'orders' as MerchantTab, label: 'Orders & Reseller Attribution', icon: ShoppingCart },
    { id: 'memo-designer' as MerchantTab, label: 'Custom Memo / Invoice Slip', icon: Layers },
    { id: 'tracking' as MerchantTab, label: 'Inbound ASNs & Warehouse', icon: Truck },
    { id: 'billing' as MerchantTab, label: 'Payout & Billing', icon: CreditCard },
    { id: 'api-keys' as MerchantTab, label: 'API Keys & Webhooks', icon: Key },
    { id: 'profile' as MerchantTab, label: 'My Store Profile', icon: User },
  ];

  const handleNavClick = (tab: MerchantTab) => {
    onSelectTab(tab);
    onCloseMobile();
  };

  return (
    <>
      {/* Mobile Backdrop */}
      {isMobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-slate-950/80 backdrop-blur-sm lg:hidden animate-in fade-in"
          onClick={onCloseMobile}
        />
      )}

      <aside
        className={`fixed inset-y-0 left-0 z-50 w-64 bg-slate-900 border-r border-slate-800 p-4 flex flex-col justify-between transition-transform duration-200 ease-in-out lg:translate-x-0 ${
          isMobileOpen ? 'translate-x-0 shadow-2xl' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        <div className="space-y-6">
          {/* Logo / Header */}
          <div className="flex items-center justify-between px-2">
            <Link href="/merchant" className="flex items-center gap-2 group">
              <div className="h-8 w-8 rounded-lg bg-emerald-600 flex items-center justify-center font-black text-white text-lg tracking-wider group-hover:scale-105 transition-transform">
                F
              </div>
              <div className="leading-none">
                <span className="text-base font-extrabold tracking-tight text-white block">
                  FULFILLIO
                </span>
                <span className="text-[10px] font-semibold text-emerald-400 tracking-wider">
                  MERCHANT PORTAL
                </span>
              </div>
            </Link>

            <button
              onClick={onCloseMobile}
              className="lg:hidden p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
              aria-label="Close sidebar"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Navigation Links */}
          <nav className="space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => handleNavClick(item.id)}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs sm:text-sm font-medium transition-all cursor-pointer ${
                    isActive
                      ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/25 font-bold'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                  }`}
                >
                  <Icon className="h-4 w-4 shrink-0" />
                  <span className="truncate">{item.label}</span>
                </button>
              );
            })}
          </nav>
        </div>

        {/* Store & Nav Footer */}
        <div className="border-t border-slate-800 pt-3 space-y-2">
          <div className="px-2">
            <span className="text-xs font-semibold text-slate-200 block truncate">
              {profile.storeName}
            </span>
            <div className="flex items-center gap-1.5 mt-0.5">
              <span className="h-2 w-2 rounded-full bg-emerald-400" />
              <span className="text-[11px] text-emerald-400 font-medium">
                Store Verified ({profile.merchantCode})
              </span>
            </div>
          </div>

          <div className="pt-2 border-t border-slate-800/60 flex items-center justify-between text-xs text-slate-400 px-2">
            <Link href="/admin" className="hover:text-emerald-400 transition-colors">
              Admin Portal
            </Link>
            <Link href="/" className="hover:text-slate-200 transition-colors">
              Home
            </Link>
          </div>
        </div>
      </aside>
    </>
  );
}
