'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, CheckCircle2 } from 'lucide-react';
import { StockManageApprovalsSection } from '@/features/admin/products/components/StockManageApprovalsSection';

export default function AdminStockRequestsPage() {
  const [toast, setToast] = useState<string | null>(null);

  const handleFeedback = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 4000);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <Link
            href="/admin/products"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-orange-600 dark:text-orange-400 hover:underline mb-2"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            <span>Back to Products Catalog</span>
          </Link>
          <h1 className="text-2xl font-extrabold tracking-tight text-navy-900 dark:text-white">
            Stock &amp; Variant Approval Requests
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5">
            Dedicated workspace to verify, approve, or reject merchant stock and new variant requests.
          </p>
        </div>
      </div>

      {toast && (
        <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-700 dark:text-emerald-300 text-xs font-bold flex items-center gap-2">
          <CheckCircle2 className="h-4 w-4 shrink-0" />
          <span>{toast}</span>
        </div>
      )}

      <StockManageApprovalsSection onApprovedOrRejected={handleFeedback} />
    </div>
  );
}
