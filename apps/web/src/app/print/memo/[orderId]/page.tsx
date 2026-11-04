'use client';

import React from 'react';
import { useParams, useSearchParams, useRouter } from 'next/navigation';
import { Printer, ArrowLeft } from 'lucide-react';
import { UnifiedThermalSticker } from '@/features/shared/thermal-print/UnifiedThermalSticker';

export default function DedicatedThermalMemoPrintPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();
  const orderId = (params?.orderId as string) || 'ORD-9041';

  const memoCode = searchParams.get('memoCode') || 'MEMO-DARAZ-BD';
  const resellerName = searchParams.get('resellerName') || 'Urban Style BD (Official)';
  const customerName = searchParams.get('customerName') || 'Tanvir Hasan';
  const customerPhone = searchParams.get('customerPhone') || '01712-889900';
  const customerAddress =
    searchParams.get('customerAddress') || 'House 14, Road 7, Sector 4, Uttara, Dhaka';
  const city = searchParams.get('city') || 'Dhaka';
  const codAmount = Number(searchParams.get('codAmount') || 1650);
  const sku = searchParams.get('sku') || 'MC-101-HOODIE-BLK-XL';
  const title = searchParams.get('title') || 'Heavyweight Winter Fleece Hoodie';

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
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-300 hover:text-white"
        >
          <ArrowLeft className="w-4 h-4" /> Go Back
        </button>
        <button
          type="button"
          onClick={() => window.print()}
          className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 px-4 py-2 text-xs font-bold text-white shadow-lg"
        >
          <Printer className="w-4 h-4" /> Print 4x6&quot; Thermal Sticker
        </button>
      </div>

      {/* 4x6 Unified Thermal Sticker */}
      <UnifiedThermalSticker
        orderId={orderId}
        memoCode={memoCode}
        resellerName={resellerName}
        resellerPhone="+880 1819-554433"
        resellerAddress="Plot 22, Gulshan-1, Dhaka (White-Label Dispatch)"
        customerName={customerName}
        customerPhone={customerPhone}
        customerAddress={customerAddress}
        city={city}
        codAmount={codAmount}
        courierProvider="STEADFAST"
        consignmentId={`CN-${orderId.replace(/\D/g, '') || '849201'}`}
        trackingCode={`TRK-STE-${orderId.replace(/\D/g, '') || '849201'}`}
        packagingType="POLY_SMALL"
        items={[
          {
            sku,
            title,
            color: 'BLACK',
            size: 'XL',
            qty: 1,
            price: codAmount,
          },
        ]}
      />
    </div>
  );
}
