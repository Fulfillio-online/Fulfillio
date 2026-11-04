'use client';

import React from 'react';
import { MerchantProvider, useMerchant } from '@/features/merchant/portal/MerchantContext';
import { MerchantSidebar } from '@/features/merchant/portal/components/MerchantSidebar';
import { MerchantHeader } from '@/features/merchant/portal/components/MerchantHeader';

function MerchantLayoutInner({ children }: { children: React.ReactNode }) {
  const {
    profile,
    toastMessage,
    clearToast,
    isMobileSidebarOpen,
    setIsMobileSidebarOpen,
  } = useMerchant();

  return (
    <div className="flex min-h-screen bg-slate-950 text-slate-100">
      <MerchantSidebar
        profile={profile}
        isMobileOpen={isMobileSidebarOpen}
        onCloseMobile={() => setIsMobileSidebarOpen(false)}
      />

      <div className="flex-1 lg:pl-64 flex flex-col min-h-screen">
        <MerchantHeader
          profile={profile}
          onOpenMobileSidebar={() => setIsMobileSidebarOpen(true)}
        />

        <main className="flex-1 p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl w-full mx-auto">
          {toastMessage && (
            <div className="p-3.5 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-xs sm:text-sm font-semibold flex items-center justify-between shadow-lg animate-in fade-in duration-200">
              <span>{toastMessage}</span>
              <button
                onClick={clearToast}
                className="text-emerald-400 hover:text-white ml-2 text-xs"
              >
                Dismiss
              </button>
            </div>
          )}

          {children}
        </main>
      </div>
    </div>
  );
}

export default function MerchantLayout({ children }: { children: React.ReactNode }) {
  return (
    <MerchantProvider>
      <MerchantLayoutInner>{children}</MerchantLayoutInner>
    </MerchantProvider>
  );
}
