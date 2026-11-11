'use client';

import React, { useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useMerchant } from '@/features/merchant/portal/MerchantContext';
import { MerchantOrderDetailsTab } from '@/features/merchant/portal/components/tabs/MerchantOrderDetailsTab';
import { ArrowLeft, PackageX } from 'lucide-react';

export default function MerchantOrderDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const { orders, updateOrderStatus, cancelOrder, showToast } = useMerchant();

  const orderId = typeof params?.id === 'string' ? params.id : '';

  // Match by id or orderNumber (handles cases like 'ord-1001', '#ord-1001', etc.)
  const targetOrder = useMemo(() => {
    if (!orderId) return null;
    const cleanId = orderId.replace(/^#/, '').toLowerCase();
    return orders.find(
      (o) =>
        o.id.toLowerCase() === cleanId ||
        (o.orderNumber && o.orderNumber.replace(/^#/, '').toLowerCase() === cleanId),
    );
  }, [orders, orderId]);

  if (!targetOrder) {
    return (
      <div className="max-w-2xl mx-auto py-16 text-center space-y-4">
        <div className="h-16 w-16 bg-slate-800 rounded-full flex items-center justify-center mx-auto text-slate-500">
          <PackageX className="h-8 w-8" />
        </div>
        <h2 className="text-xl font-bold text-slate-100">Order Not Found</h2>
        <p className="text-sm text-slate-400">
          We could not find an order matching <span className="font-mono text-emerald-400 font-semibold">#{orderId}</span>.
        </p>
        <div>
          <button
            onClick={() => router.push('/merchant/orders')}
            className="inline-flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-semibold transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Back to Orders List</span>
          </button>
        </div>
      </div>
    );
  }

  return (
    <MerchantOrderDetailsTab
      order={targetOrder}
      onUpdateStatus={updateOrderStatus}
      onCancelOrder={cancelOrder}
      onTriggerToast={showToast}
    />
  );
}
