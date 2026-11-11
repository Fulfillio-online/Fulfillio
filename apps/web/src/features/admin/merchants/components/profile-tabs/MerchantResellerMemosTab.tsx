import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { Printer, Eye, Tag } from 'lucide-react';
import { Modal } from '@/components/admin/AdminModal';
import { UnifiedThermalSticker } from '@/features/shared/thermal-print/UnifiedThermalSticker';
import { MerchantRecord, MerchantMemoItem } from '../../types';

export interface MerchantResellerMemosTabProps {
  merchant: MerchantRecord;
  memos: MerchantMemoItem[];
}

export function MerchantResellerMemosTab({
  merchant,
  memos,
}: MerchantResellerMemosTabProps) {
  const [previewMemo, setPreviewMemo] = useState<MerchantMemoItem | null>(null);

  const merchantMemos = memos.filter((m) => m.merchantCode === merchant.merchantCode);

  const handlePrint = (memo: MerchantMemoItem) => {
    setPreviewMemo(memo);
    if (typeof document !== 'undefined') {
      document.body.classList.add('printing-single-invoice');
      setTimeout(() => {
        window.print();
        document.body.classList.remove('printing-single-invoice');
      }, 80);
    }
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h3 className="text-lg font-bold text-navy-800 dark:text-white">
            Memo / Invoice Templates for {merchant.storeName} ({merchant.merchantCode})
          </h3>
          <p className="text-xs text-slate-600 dark:text-slate-300">
            4x6&quot; White-Label thermal invoice slips configured by this merchant.
          </p>
        </div>
      </div>

      {/* Memos Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {merchantMemos.map((memo) => (
          <div
            key={memo.id}
            className="rounded-2xl border border-slate-200 dark:border-white/10 bg-white/90 dark:bg-navy-900/90 p-5 space-y-4 shadow-lg hover:border-slate-300 dark:hover:border-white/15 transition-all flex flex-col justify-between"
          >
            <div className="space-y-3">
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span className="tabular-nums text-xs font-bold px-2.5 py-1 rounded-lg bg-indigo-500/10 text-indigo-700 dark:text-indigo-300 border border-indigo-500/30">
                    {memo.code}
                  </span>
                  {memo.isDefault && (
                    <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30">
                      Default
                    </span>
                  )}
                </div>
                <div
                  className="w-4 h-4 rounded-full border border-slate-300 dark:border-white/15"
                  style={{ backgroundColor: memo.brandColor }}
                />
              </div>

              <div className="flex items-start gap-3">
                {memo.logoUrl ? (
                  <div className="w-12 h-10 flex items-center justify-center p-1 rounded-lg bg-slate-100 dark:bg-navy-950 border border-slate-200 dark:border-white/10 shrink-0 overflow-hidden">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={memo.logoUrl} alt={memo.resellerName} className="max-h-full max-w-full object-contain" />
                  </div>
                ) : null}
                <div>
                  <h4 className="text-base font-bold text-navy-800 dark:text-white">{memo.resellerName}</h4>
                  <div className="text-xs text-slate-600 dark:text-slate-300 mt-1 space-y-0.5">
                    <div>Phone: {memo.phone}</div>
                    <div>Address: {memo.address}</div>
                  </div>
                </div>
              </div>

              <div className="p-3 rounded-xl bg-slate-50 dark:bg-navy-950 border border-slate-200 dark:border-white/10 text-xs text-slate-700 dark:text-slate-200 italic">
                &quot;{memo.terms}&quot;
              </div>
            </div>

            <div className="pt-3 border-t border-slate-200 dark:border-white/10 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setPreviewMemo(memo)}
                className="px-3.5 py-1.5 rounded-xl bg-slate-100 dark:bg-navy-800 hover:bg-slate-200 dark:hover:bg-navy-700 text-xs font-semibold text-navy-800 dark:text-slate-100 flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <Eye className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
                <span>View Template</span>
              </button>
              <button
                type="button"
                onClick={() => handlePrint(memo)}
                className="px-3.5 py-1.5 rounded-xl bg-orange-600 hover:bg-orange-700 text-xs font-bold text-white flex items-center gap-1.5 transition-colors shadow-sm cursor-pointer"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Print Test</span>
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Preview Modal */}
      <Modal
        isOpen={Boolean(previewMemo)}
        onClose={() => setPreviewMemo(null)}
        title={previewMemo ? `Memo Slip Preview · ${previewMemo.code}` : 'Memo Preview'}
        subtitle={previewMemo ? `${previewMemo.resellerName} — 4x6" White-Label Thermal Slip` : ''}
        size="lg"
      >
        {previewMemo && (
          <div className="space-y-4">
            <div className="flex items-center justify-between bg-slate-50 dark:bg-navy-950 border border-slate-200 dark:border-white/10 rounded-xl p-3">
              <div className="text-xs text-slate-700 dark:text-slate-200">
                <span className="font-bold text-navy-800 dark:text-white">{previewMemo.resellerName}</span> •{' '}
                <span className="tabular-nums text-indigo-600 dark:text-indigo-400">{previewMemo.code}</span>
              </div>
              <button
                type="button"
                onClick={() => handlePrint(previewMemo)}
                className="px-3.5 py-1.5 rounded-lg bg-orange-600 hover:bg-orange-700 text-xs font-bold text-white flex items-center gap-1.5 cursor-pointer"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Print Template</span>
              </button>
            </div>

            <div className="max-h-[65vh] overflow-y-auto py-2">
              <UnifiedThermalSticker
                orderId="ORD-SAMPLE-4X6"
                memoCode={previewMemo.code}
                resellerName={previewMemo.resellerName}
                resellerPhone={previewMemo.phone}
                resellerAddress={previewMemo.address}
                brandColor={previewMemo.brandColor}
                logoUrl={previewMemo.logoUrl}
                footerTerms={previewMemo.terms}
                customerName="Sample Customer"
                customerPhone="01700-000000"
                customerAddress="House 14, Road 7, Sector 4, Uttara"
                city="Dhaka"
                codAmount={1650}
                courierProvider="STEADFAST"
                consignmentId="CN-849201"
                trackingCode="TRK-STE-849201"
                packagingType="POLY_SMALL"
                items={[
                  {
                    sku: `${merchant.merchantCode}-SAMPLE-SKU`,
                    title: 'Sample Fulfillio Warehouse Item',
                    color: 'BLACK',
                    size: 'XL',
                    qty: 1,
                    price: 1650,
                  },
                ]}
              />
            </div>
          </div>
        )}
      </Modal>

      {/* Hidden Portal for Print */}
      {previewMemo &&
        typeof document !== 'undefined' &&
        createPortal(
          <div id="fulfillio-print-invoice-root" className="hidden">
            <UnifiedThermalSticker
              orderId="ORD-SAMPLE-4X6"
              memoCode={previewMemo.code}
              resellerName={previewMemo.resellerName}
              resellerPhone={previewMemo.phone}
              resellerAddress={previewMemo.address}
              brandColor={previewMemo.brandColor}
              logoUrl={previewMemo.logoUrl}
              footerTerms={previewMemo.terms}
              customerName="Sample Customer"
              customerPhone="01700-000000"
              customerAddress="House 14, Road 7, Sector 4, Uttara"
              city="Dhaka"
              codAmount={1650}
              courierProvider="STEADFAST"
              consignmentId="CN-849201"
              trackingCode="TRK-STE-849201"
              packagingType="POLY_SMALL"
              items={[
                {
                  sku: `${merchant.merchantCode}-SAMPLE-SKU`,
                  title: 'Sample Fulfillio Warehouse Item',
                  color: 'BLACK',
                  size: 'XL',
                  qty: 1,
                  price: 1650,
                },
              ]}
            />
          </div>,
          document.body,
        )}
    </div>
  );
}
