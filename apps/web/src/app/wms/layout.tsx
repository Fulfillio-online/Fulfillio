'use client';

import React from 'react';
import {
  WmsProvider,
  WmsHeader,
  WmsPipelineNav,
  ThermalMemoModal,
  useWms,
} from '@/features/wms';
import { CheckCircle2 } from 'lucide-react';

function WmsLayoutInner({ children }: { children: React.ReactNode }) {
  const { toastMessage, activePrintOrder, setActivePrintOrder } = useWms();

  return (
    <div className="flex flex-col min-h-screen bg-slate-950 text-slate-100 selection:bg-emerald-500 selection:text-white font-sans antialiased">
      {/* Top Floor Header */}
      <WmsHeader />

      {/* 4-Step Pipeline Navigation Bar */}
      <WmsPipelineNav />

      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 animate-in slide-in-from-bottom-3 duration-200">
          <div className="px-4 py-3 rounded-xl bg-emerald-600 text-white font-semibold text-xs shadow-2xl flex items-center gap-2 border border-emerald-400/40">
            <CheckCircle2 className="h-4 w-4 shrink-0" />
            <span>{toastMessage}</span>
          </div>
        </div>
      )}

      {/* Dynamic 4x6 Thermal Memo Print Modal */}
      {activePrintOrder && (
        <ThermalMemoModal
          order={activePrintOrder}
          onClose={() => setActivePrintOrder(null)}
        />
      )}

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6">{children}</main>
    </div>
  );
}

export default function WmsRootLayout({ children }: { children: React.ReactNode }) {
  return (
    <WmsProvider>
      <WmsLayoutInner>{children}</WmsLayoutInner>
    </WmsProvider>
  );
}
