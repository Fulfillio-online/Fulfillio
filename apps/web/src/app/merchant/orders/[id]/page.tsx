'use client';

import React, { useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useMerchant } from '@/features/merchant/portal/MerchantContext';
import { MerchantOrderDetailsTab } from '@/features/merchant/portal/components/tabs/MerchantOrderDetailsTab';
import { getStoredMerchantOrdersForCode } from '@/lib/warehouseSync';
import { STORAGE_KEY_ORDERS, INITIAL_PIPELINE_ORDERS } from '@/features/admin/orders/mockData';
import { WarehousePipelineOrder } from '@/features/admin/orders/types';
import { MerchantOrderItem } from '@/features/merchant/portal/types';
import { ArrowLeft, PackageX } from 'lucide-react';

export default function MerchantOrderDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const { orders, profile, updateOrderStatus, cancelOrder, showToast } = useMerchant();

  const rawParamId = typeof params?.id === 'string' ? params.id : '';

  // Match by id or orderNumber (handles cases like 'ord-1001', '#ord-1001', '%23ord-1001', etc.)
  const targetOrder = useMemo<MerchantOrderItem | null>(() => {
    if (!rawParamId) return null;
    const decodedId = decodeURIComponent(rawParamId).trim();
    const cleanId = decodedId.replace(/^#/, '').toLowerCase().trim();

    // 1. Search in MerchantContext active orders
    const fromContext = orders.find((o) => {
      const oId = (o.id || '').replace(/^#/, '').toLowerCase().trim();
      const oNum = (o.orderNumber || '').replace(/^#/, '').toLowerCase().trim();
      return oId === cleanId || oNum === cleanId;
    });
    if (fromContext) return fromContext;

    // 2. Search in localStorage merchant orders cache
    const cachedOrders = getStoredMerchantOrdersForCode(profile?.merchantCode || 'MC-101');
    const fromCache = cachedOrders.find((o) => {
      const oId = (o.id || '').replace(/^#/, '').toLowerCase().trim();
      const oNum = (o.orderNumber || '').replace(/^#/, '').toLowerCase().trim();
      return oId === cleanId || oNum === cleanId;
    });
    if (fromCache) return fromCache;

    // 3. Search in Admin Pipeline orders and convert to MerchantOrderItem
    try {
      if (typeof window !== 'undefined') {
        const raw = localStorage.getItem(STORAGE_KEY_ORDERS);
        const adminOrders: WarehousePipelineOrder[] = raw ? JSON.parse(raw) : INITIAL_PIPELINE_ORDERS;
        const matchedAdmin = adminOrders.find((ao: WarehousePipelineOrder) => {
          const aoId = (ao.id || '').replace(/^#/, '').toLowerCase().trim();
          return aoId === cleanId;
        });
        if (matchedAdmin) {
          const mappedStatus: MerchantOrderItem['status'] =
            matchedAdmin.stage === 'DISPATCH'
              ? 'DISPATCHED'
              : matchedAdmin.stage === 'PACK'
              ? 'PACKED'
              : 'PENDING';

          return {
            id: matchedAdmin.id.replace(/^#/, '').trim(),
            orderNumber: matchedAdmin.id.replace(/^#/, '').trim(),
            date: matchedAdmin.createdAt || 'Today',
            customer: matchedAdmin.customerName,
            phone: matchedAdmin.customerPhone,
            address: matchedAdmin.customerAddress,
            productId: 'p-1',
            items: `${matchedAdmin.productTitle} (${matchedAdmin.color} • ${matchedAdmin.size}) x ${matchedAdmin.qty}`,
            qty: matchedAdmin.qty,
            amount: matchedAdmin.codAmount,
            subtotal: matchedAdmin.subtotal || matchedAdmin.codAmount,
            deliveryFee: matchedAdmin.deliveryFee || 80,
            discount: matchedAdmin.discount || 0,
            advancePayment: matchedAdmin.advancePayment || 0,
            codAmount: matchedAdmin.codAmount,
            memoCode: matchedAdmin.memoCode || 'MEMO-DEFAULT',
            status: mappedStatus,
            courier: matchedAdmin.courier,
            trackingId: matchedAdmin.trackingCode,
          };
        }
      }
    } catch {}

    return null;
  }, [orders, rawParamId, profile?.merchantCode]);

  if (!targetOrder) {
    return (
      <div className="max-w-2xl mx-auto py-16 text-center space-y-4">
        <div className="h-16 w-16 bg-slate-100 dark:bg-navy-800 rounded-full flex items-center justify-center mx-auto text-slate-500">
          <PackageX className="h-8 w-8" />
        </div>
        <h2 className="text-xl font-bold text-navy-900 dark:text-white">Order Not Found</h2>
        <p className="text-sm text-slate-400">
          We could not find an order matching <span className="font-mono text-emerald-400 font-semibold">#{rawParamId.replace(/^#/, '')}</span>.
        </p>
        <div>
          <button
            onClick={() => router.push('/merchant/orders')}
            className="inline-flex items-center gap-2 px-4 py-2 bg-slate-100 dark:bg-navy-800 hover:bg-slate-200 dark:hover:bg-navy-700 text-navy-900 dark:text-slate-200 rounded-lg text-xs font-semibold transition-colors"
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
