'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { CheckCircle2 } from 'lucide-react';
import { MerchantProvider, useMerchant } from '@/features/merchant/portal/MerchantContext';
import { MerchantSidebar } from '@/features/merchant/portal/components/MerchantSidebar';
import { MerchantHeader } from '@/features/merchant/portal/components/MerchantHeader';
import { isMerchantLoggedIn } from '@/lib/warehouseSync';

function MerchantLayoutInner({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [authChecked, setAuthChecked] = useState(false);
  const {
    profile,
    toastMessage,
    clearToast,
    isMobileSidebarOpen,
    setIsMobileSidebarOpen,
  } = useMerchant();

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const loggedIn = isMerchantLoggedIn();
      if (!loggedIn) {
        router.replace('/login');
        return;
      }
      setAuthChecked(true);
    }
  }, [router]);

  if (!authChecked) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center text-slate-400 gap-3">
        <div className="h-6 w-6 border-2 border-orange-500 border-t-transparent rounded-full animate-spin" />
        <span className="text-xs font-medium">Checking login session...</span>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-slate-50 dark:bg-navy-950 text-navy-900 dark:text-white w-full overflow-x-hidden transition-colors duration-200">
      <MerchantSidebar
        profile={profile}
        isMobileOpen={isMobileSidebarOpen}
        onCloseMobile={() => setIsMobileSidebarOpen(false)}
      />

      <div className="flex-1 lg:pl-64 flex flex-col min-h-screen w-full min-w-0 overflow-x-hidden">
        <MerchantHeader
          profile={profile}
          onOpenMobileSidebar={() => setIsMobileSidebarOpen(true)}
        />

        <main className="flex-1 p-3.5 sm:p-6 lg:p-8 space-y-6 max-w-7xl w-full mx-auto min-w-0">
          {toastMessage && (
            <div className="p-3.5 sm:p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/90 border border-emerald-300 dark:border-emerald-500/40 text-emerald-950 dark:text-emerald-100 text-xs sm:text-sm font-semibold flex items-center justify-between shadow-md shadow-emerald-950/5 animate-in fade-in slide-in-from-top-2 duration-200">
              <div className="flex items-center gap-2.5 min-w-0">
                <CheckCircle2 className="h-5 w-5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                <span className="leading-snug truncate sm:whitespace-normal">{toastMessage}</span>
              </div>
              <button
                onClick={clearToast}
                className="text-emerald-800 dark:text-emerald-300 hover:text-emerald-950 dark:hover:text-white ml-3 text-xs font-bold px-2.5 py-1 rounded-lg bg-emerald-100/80 dark:bg-emerald-900/50 hover:bg-emerald-200 dark:hover:bg-emerald-800 transition-colors cursor-pointer shrink-0"
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
