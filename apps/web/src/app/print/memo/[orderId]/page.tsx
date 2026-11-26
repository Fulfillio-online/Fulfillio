'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useSearchParams, useRouter } from 'next/navigation';
import { Printer, ArrowLeft, Loader2 } from 'lucide-react';
import {
  UnifiedThermalSticker,
  ThermalStickerItem,
} from '@/features/shared/thermal-print/UnifiedThermalSticker';
import { WarehousePipelineOrder } from '@/features/admin/orders/types';
import { STORAGE_KEY_ORDERS } from '@/features/admin/orders/mockData';
import {
  fetchOrderByIdFromDatabase,
  getActiveMerchantSession,
  getStoredMerchantOrdersForCode,
  getStoredMerchantProductsForCode,
  getStoredMerchantProfileForCode,
  getStoredMerchantMemosForCode,
  convertMerchantOrderToWarehouse,
} from '@/lib/warehouseSync';

function buildStickerItemsFromOrder(order: WarehousePipelineOrder): ThermalStickerItem[] {
  if (order.items && order.items.length > 0) {
    return order.items.map((it) => ({
      sku: it.sku || order.sku || 'SKU',
      title: (it.title || 'Ordered Product')
        .replace(/\s*\(\+\d+\s*more\)/gi, '')
        .replace(/\s*\+\s*\d+\s*more/gi, '')
        .trim(),
      color: it.color,
      size: it.size,
      qty: it.qty || 1,
      price: Number(it.unitPrice) || 0,
    }));
  }

  const qty = order.qty || 1;
  const fallbackUnitPrice =
    order.subtotal && order.subtotal > 0
      ? Math.round(order.subtotal / qty)
      : Math.round((order.totalAmount ?? order.codAmount) / qty);

  return [
    {
      sku: order.sku || 'SKU',
      title: order.productTitle || 'Ordered Product',
      color: order.color,
      size: order.size,
      qty,
      price: fallbackUnitPrice,
    },
  ];
}

export default function DedicatedThermalMemoPrintPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();
  const rawOrderId = decodeURIComponent((params?.orderId as string) || '');
  const cleanOrderId = rawOrderId.replace(/^#/, '').trim();

  const [order, setOrder] = useState<WarehousePipelineOrder | null>(null);
  const [footerTerms, setFooterTerms] = useState<string | undefined>(undefined);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    const loadOrder = async () => {
      try {
        // 1. Primary source: PostgreSQL backend via /api/orders/:id
        let resolved: WarehousePipelineOrder | null = await fetchOrderByIdFromDatabase(rawOrderId);

        // 2. Fallback: Merchant portal localStorage orders
        if (!resolved && typeof window !== 'undefined') {
          const session = getActiveMerchantSession();
          const candidateCodes = Array.from(
            new Set([session?.merchantCode, 'MC-101', 'MC-102', 'MC-103', 'MC-104', 'MC-107'].filter(Boolean) as string[]),
          );

          for (const code of candidateCodes) {
            const merchantOrders = getStoredMerchantOrdersForCode(code);
            const match = merchantOrders.find(
              (mo) =>
                mo.id.toLowerCase() === cleanOrderId.toLowerCase() ||
                (mo.orderNumber &&
                  mo.orderNumber.replace(/^#/, '').toLowerCase() === cleanOrderId.toLowerCase()),
            );
            if (match) {
              const mProds = getStoredMerchantProductsForCode(code);
              const mProf = getStoredMerchantProfileForCode(code);
              const mMemos = getStoredMerchantMemosForCode(code, mProf);
              resolved = convertMerchantOrderToWarehouse(match, mProds, mMemos, mProf);
              const matchedMemo = mMemos.find(
                (m) => m.code.toUpperCase() === (match.memoCode || '').toUpperCase(),
              );
              if (matchedMemo?.note && !cancelled) {
                setFooterTerms(matchedMemo.note);
              }
              break;
            }
          }
        }

        // 3. Fallback: Admin localStorage orders
        if (!resolved && typeof window !== 'undefined') {
          const stored = localStorage.getItem(STORAGE_KEY_ORDERS);
          if (stored) {
            const list: WarehousePipelineOrder[] = JSON.parse(stored);
            if (Array.isArray(list)) {
              const found = list.find(
                (o) =>
                  o.id.toLowerCase() === cleanOrderId.toLowerCase() ||
                  o.id.replace(/^#/, '').toLowerCase() === cleanOrderId.toLowerCase(),
              );
              if (found) resolved = found;
            }
          }
        }

        // Enrich reseller memo branding from merchant's saved memos if available
        if (resolved && typeof window !== 'undefined') {
          const mProf = getStoredMerchantProfileForCode(resolved.merchantCode || 'MC-101');
          const mMemos = getStoredMerchantMemosForCode(resolved.merchantCode || 'MC-101', mProf);
          const matchedMemo =
            mMemos.find(
              (m) => m.code.toUpperCase() === (resolved?.memoCode || '').toUpperCase(),
            ) || mMemos.find((m) => m.isDefault);

          if (matchedMemo) {
            resolved = {
              ...resolved,
              resellerName: matchedMemo.resellerName || resolved.resellerName,
              resellerPhone: matchedMemo.phone || resolved.resellerPhone,
              resellerAddress: matchedMemo.address || resolved.resellerAddress,
              resellerLogo: matchedMemo.logoUrl || resolved.resellerLogo,
            };
            if (matchedMemo.note && !cancelled) {
              setFooterTerms(matchedMemo.note);
            }
          }
        }

        if (!cancelled) {
          setOrder(resolved);
        }
      } catch (err) {
        console.error('Failed to load invoice order:', err);
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    };

    if (rawOrderId) {
      loadOrder();
    } else {
      setIsLoading(false);
    }

    return () => {
      cancelled = true;
    };
  }, [rawOrderId, cleanOrderId]);

  // Query-param fallback values if order could not be loaded
  const fallbackMemoCode = searchParams.get('memoCode') || 'MEMO-DEFAULT';
  const fallbackResellerName = searchParams.get('resellerName') || 'Merchant Store';
  const fallbackCustomerName = searchParams.get('customerName') || 'Customer';
  const fallbackCustomerPhone = searchParams.get('customerPhone') || '';
  const fallbackCustomerAddress = searchParams.get('customerAddress') || '';
  const fallbackCity = searchParams.get('city') || 'Dhaka';
  const fallbackCodAmount = Number(searchParams.get('codAmount') || 0);
  const fallbackLogoUrl = searchParams.get('logoUrl') || undefined;

  const courierLabel = (order?.courier || 'STANDARD').toUpperCase();
  const displayOrderId = order?.id || cleanOrderId || 'ORD';
  const numericIdPart = displayOrderId.replace(/\D/g, '') || displayOrderId.slice(-6);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 py-8 px-4 print:bg-white print:p-0 print:m-0">
      <style>{`
        @media print {
          @page {
            size: 4in 6in;
            margin: 0mm;
          }
          body {
            background: #ffffff !important;
            margin: 0 !important;
            padding: 0 !important;
          }
        }
      `}</style>

      {/* Top Controls (Hidden when printing on 4x6 Thermal Printer) */}
      <div className="max-w-md mx-auto mb-6 flex items-center justify-between bg-slate-900 border border-slate-800 rounded-xl p-3 print:hidden">
        <button
          type="button"
          onClick={() => router.back()}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-300 hover:text-white cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" /> Go Back
        </button>
        <button
          type="button"
          onClick={() => window.print()}
          disabled={isLoading}
          className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 px-4 py-2 text-xs font-bold text-white shadow-lg cursor-pointer"
        >
          <Printer className="w-4 h-4" /> Print 4x6&quot; Thermal Invoice
        </button>
      </div>

      {isLoading ? (
        <div className="max-w-md mx-auto py-16 flex flex-col items-center justify-center gap-3 text-slate-400 text-xs">
          <Loader2 className="w-6 h-6 animate-spin text-emerald-400" />
          <span>Loading order items &amp; invoice breakdown...</span>
        </div>
      ) : order ? (
        <UnifiedThermalSticker
          orderId={displayOrderId}
          memoCode={order.memoCode || fallbackMemoCode}
          resellerName={order.resellerName || order.merchantName || fallbackResellerName}
          resellerPhone={order.resellerPhone || ''}
          resellerAddress={order.resellerAddress || ''}
          logoUrl={order.resellerLogo || fallbackLogoUrl}
          customerName={order.customerName}
          customerPhone={order.customerPhone}
          customerAddress={order.customerAddress}
          city={order.city || 'Dhaka'}
          codAmount={order.codAmount}
          subtotal={order.subtotal}
          deliveryFee={order.deliveryFee}
          discount={order.discount}
          totalAmount={order.totalAmount}
          advancePayment={order.advancePayment}
          advancePaymentMethod={order.advancePaymentMethod}
          paymentStatus={order.paymentStatus}
          orderDate={
            order.createdAtIso
              ? new Date(order.createdAtIso).toLocaleDateString('en-GB')
              : undefined
          }
          courierProvider={courierLabel}
          consignmentId={`CN-${numericIdPart}`}
          trackingCode={
            order.trackingCode || `TRK-${courierLabel.slice(0, 3)}-${numericIdPart}`
          }
          packagingType="POLY_SMALL"
          items={buildStickerItemsFromOrder(order)}
          footerTerms={footerTerms}
        />
      ) : (
        <UnifiedThermalSticker
          orderId={displayOrderId}
          memoCode={fallbackMemoCode}
          resellerName={fallbackResellerName}
          resellerPhone=""
          resellerAddress=""
          logoUrl={fallbackLogoUrl}
          customerName={fallbackCustomerName}
          customerPhone={fallbackCustomerPhone}
          customerAddress={fallbackCustomerAddress}
          city={fallbackCity}
          codAmount={fallbackCodAmount}
          subtotal={fallbackCodAmount}
          deliveryFee={0}
          discount={0}
          totalAmount={fallbackCodAmount}
          advancePayment={0}
          courierProvider="STANDARD"
          consignmentId={`CN-${numericIdPart}`}
          trackingCode={`TRK-STD-${numericIdPart}`}
          packagingType="POLY_SMALL"
          items={[]}
        />
      )}
    </div>
  );
}
