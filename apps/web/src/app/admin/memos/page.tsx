'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { Copy, Printer } from 'lucide-react';
import { UnifiedThermalSticker } from '@/features/shared/thermal-print/UnifiedThermalSticker';
import { getSyncedAdminMemos, SyncedAdminMemoItem } from '@/lib/warehouseSync';
import { STORAGE_KEY as STORAGE_KEY_MERCHANTS_DIRECTORY, MERCHANTS_DATA } from '@/features/admin/merchants/mockData';

const INITIAL_MEMOS: SyncedAdminMemoItem[] = [
  {
    id: 'memo-1',
    code: 'MEMO-FESTIVE-01',
    resellerName: 'Urban Threads Official',
    merchantName: 'Urban Threads BD',
    merchantCode: 'MC-101',
    phone: '+880 1711-234567',
    address: 'Banani, Dhaka',
    paperSize: '4x6 Thermal Sticker',
    isDefault: true,
    color: '#4f46e5',
    note: 'Thank you for shopping! Return within 7 days with invoice.',
    sampleItems: [
      { name: 'Heavyweight Hoodie (XL)', qty: 1, price: '৳ 3,450' },
    ],
    created: '2026-10-15',
  },
  {
    id: 'memo-2',
    code: 'MEMO-DARAZ-RES',
    resellerName: 'Daraz Express BD Store',
    merchantName: 'Urban Threads BD',
    merchantCode: 'MC-101',
    phone: '+880 1822-998877',
    address: 'Tejgaon, Dhaka',
    paperSize: '4x6 Thermal Sticker',
    isDefault: false,
    color: '#059669',
    note: 'Official Daraz Mall partner fulfilled by Fulfillio.',
    sampleItems: [
      { name: 'Oversized Cotton Tee (L)', qty: 2, price: '৳ 2,100' },
    ],
    created: '2026-10-19',
  },
  {
    id: 'memo-3',
    code: 'MEMO-APEX-POS',
    resellerName: 'Apex Prime Footwear',
    merchantName: 'Apex Footwear Store',
    merchantCode: 'MC-102',
    phone: '+880 1912-334455',
    address: 'Gulshan-1, Dhaka',
    paperSize: '4x6 Thermal Sticker',
    isDefault: true,
    color: '#dc2626',
    note: 'Genuine leather warranty card enclosed. No cash refund without slip.',
    sampleItems: [
      { name: 'Leather Chelsea Boots (42)', qty: 1, price: '৳ 6,850' },
    ],
    created: '2026-10-21',
  },
  {
    id: 'memo-4',
    code: 'MEMO-TECH-SLIP',
    resellerName: 'Gadget Freak BD Express',
    merchantName: 'Gadget Freak Online',
    merchantCode: 'MC-103',
    phone: '+880 1611-778899',
    address: 'Elephant Road, Dhaka',
    paperSize: '4x6 Thermal Sticker',
    isDefault: true,
    color: '#7c3aed',
    note: '1 Year official replacement warranty. Keep sticker intact.',
    sampleItems: [
      { name: 'ANC Wireless Earbuds', qty: 1, price: '৳ 4,200' },
    ],
    created: '2026-10-22',
  },
];

export default function AdminMemosPage() {
  const [memos, setMemos] = useState<SyncedAdminMemoItem[]>(INITIAL_MEMOS);
  const [merchantsList, setMerchantsList] = useState<any[]>(MERCHANTS_DATA);
  const [memoFilter, setMemoFilter] = useState<string>('ALL');
  const [printingMemo, setPrintingMemo] = useState<any | null>(null);

  // Sync memos and merchants list from warehouse storage & cross-tab events
  useEffect(() => {
    const syncMemos = () => {
      try {
        const synced = getSyncedAdminMemos(INITIAL_MEMOS);
        setMemos(synced);

        const savedMerchants = localStorage.getItem(STORAGE_KEY_MERCHANTS_DIRECTORY);
        if (savedMerchants) {
          const parsed = JSON.parse(savedMerchants);
          if (Array.isArray(parsed) && parsed.length > 0) {
            setMerchantsList(parsed);
          }
        }
      } catch (err) {
        console.warn('Error syncing admin memos:', err);
      }
    };

    syncMemos();
    window.addEventListener('fulfillio-warehouse-sync', syncMemos);
    window.addEventListener('storage', syncMemos);
    return () => {
      window.removeEventListener('fulfillio-warehouse-sync', syncMemos);
      window.removeEventListener('storage', syncMemos);
    };
  }, []);

  const handlePrintSingleMemo = (memo: any) => {
    setPrintingMemo(memo);
    if (typeof document !== 'undefined') {
      document.body.classList.add('printing-single-invoice');
      setTimeout(() => {
        window.print();
        document.body.classList.remove('printing-single-invoice');
      }, 80);
    }
  };

  // Dynamically extract all available merchants from merchant directory and current memos
  const merchantOptions = useMemo(() => {
    const map = new Map<string, string>();
    merchantsList.forEach((m) => {
      if (m.merchantCode) {
        map.set(m.merchantCode, m.storeName || m.businessName || m.merchantCode);
      }
    });
    memos.forEach((m) => {
      if (m.merchantCode && !map.has(m.merchantCode)) {
        map.set(m.merchantCode, m.merchantName || m.merchantCode);
      }
    });
    return Array.from(map.entries()).map(([code, name]) => ({ code, name }));
  }, [merchantsList, memos]);

  const filteredMemos =
    memoFilter === 'ALL'
      ? memos
      : memos.filter((m) => m.merchantCode === memoFilter);

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-navy-900 dark:text-white">Memo &amp; Invoice Templates</h1>
          <p className="text-sm text-slate-600 dark:text-slate-300">
            All custom branded 4x6&quot; invoice &amp; memo slips designed by merchants. Click Print Test to print only the selected 4x6&quot; invoice.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-600 dark:text-slate-300">Filter Merchant:</span>
          <select
            value={memoFilter}
            onChange={(e) => setMemoFilter(e.target.value)}
            className="px-3 py-1.5 rounded-lg bg-white dark:bg-navy-900 border border-slate-200 dark:border-white/10 text-xs text-navy-800 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-orange-500 cursor-pointer"
          >
            <option value="ALL">All Merchants ({memos.length})</option>
            {merchantOptions.map((opt) => {
              const count = memos.filter((m) => m.merchantCode === opt.code).length;
              return (
                <option key={opt.code} value={opt.code}>
                  {opt.name} ({opt.code}){count > 0 ? ` [${count}]` : ''}
                </option>
              );
            })}
          </select>
        </div>
      </div>

      {/* Memo Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredMemos.length === 0 ? (
          <div className="col-span-full rounded-2xl border-2 border-dashed border-slate-200 dark:border-white/10 p-12 text-center bg-white/50 dark:bg-navy-900/50">
            <div className="w-12 h-12 mx-auto rounded-full bg-slate-100 dark:bg-navy-800 flex items-center justify-center text-slate-400 mb-3">
              <Printer className="w-6 h-6" />
            </div>
            <h3 className="text-sm font-bold text-navy-900 dark:text-white">No Memos Found</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-sm mx-auto">
              No invoice or memo templates found for {memoFilter === 'ALL' ? 'any merchant' : `merchant ${memoFilter}`}. New memos designed in the Merchant Portal will appear here automatically.
            </p>
          </div>
        ) : (
          filteredMemos.map((memo) => (
            <div
              key={memo.id}
              className="rounded-2xl border border-slate-200 dark:border-white/10 bg-white/90 dark:bg-navy-900/90 overflow-hidden flex flex-col justify-between hover:border-slate-300 dark:hover:border-white/15 transition-all shadow-lg"
            >
            {/* Card Header */}
            <div className="p-4 border-b border-slate-200/80 dark:border-white/10 bg-white dark:bg-navy-900 flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 rounded bg-indigo-50 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 tabular-nums text-xs font-bold border border-indigo-200 dark:border-indigo-800">
                    {memo.code}
                  </span>
                  {memo.isDefault && (
                    <span className="px-2 py-0.5 rounded bg-emerald-50 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400 text-[11px] font-semibold border border-emerald-800">
                      Default
                    </span>
                  )}
                </div>
                <span className="text-xs text-slate-600 dark:text-slate-300 block mt-1">
                  Owner: <span className="text-navy-800 dark:text-slate-100 font-semibold">{memo.merchantName}</span> ({memo.merchantCode})
                </span>
              </div>
              <span className="px-2.5 py-1 rounded-full bg-slate-100 dark:bg-navy-800 text-xs font-medium text-slate-700 dark:text-slate-200 border border-slate-300 dark:border-white/15">
                {memo.paperSize}
              </span>
            </div>

            {/* Card Body — Visual 4x6 Thermal Sticker Preview */}
            <div className="p-4 flex-1">
              <div className="rounded-xl border-2 border-dashed border-slate-300 dark:border-white/15 bg-white text-slate-950 p-4 shadow-inner space-y-3 font-sans text-xs">
                {/* Reseller Branding Header */}
                <div className="text-center pb-2 border-b border-slate-200 dark:border-white/15">
                  {memo.logoUrl ? (
                    <div className="flex justify-center mb-1.5">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={memo.logoUrl}
                        alt={memo.resellerName}
                        className="max-h-9 max-w-[140px] object-contain"
                      />
                    </div>
                  ) : null}
                  <div
                    className="font-extrabold text-sm uppercase tracking-wide"
                    style={{ color: memo.color }}
                  >
                    {memo.resellerName}
                  </div>
                  <div className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">{memo.phone}</div>
                  <div className="text-[11px] text-slate-500 dark:text-slate-400">{memo.address}</div>
                </div>

                {/* Sample Order Data */}
                <div className="space-y-1.5 py-1">
                  <div className="flex justify-between text-xs font-semibold text-slate-300 dark:text-slate-600">
                    <span>Customer: Tariqul Islam</span>
                    <span className="tabular-nums">#ORD-9824</span>
                  </div>
                  <div className="text-[11px] text-slate-400 dark:text-slate-500">Banani Block-D, Dhaka</div>
                </div>

                {/* Line Items Table Mockup */}
                <div className="border-t border-b border-slate-200 dark:border-white/15 py-1.5 space-y-1">
                  {memo.sampleItems.map((item, idx) => (
                    <div key={idx} className="flex justify-between text-xs">
                      <span>
                        {item.name} x {item.qty}
                      </span>
                      <span className="tabular-nums font-bold">{item.price}</span>
                    </div>
                  ))}
                </div>

                {/* COD Amount Banner */}
                <div className="bg-slate-100 dark:bg-slate-300 rounded p-1.5 flex justify-between items-center font-bold text-xs">
                  <span>Cash on Delivery (COD):</span>
                  <span className="tabular-nums text-sm text-slate-100 dark:text-slate-800">৳ 3,450</span>
                </div>

                {/* Reseller Policy Footer */}
                <div className="text-[11px] text-center text-slate-500 dark:text-slate-400 italic pt-1">
                  &quot;{memo.note}&quot;
                </div>
              </div>
            </div>

            {/* Card Footer Actions */}
            <div className="p-3 border-t border-slate-200 dark:border-white/10 bg-white/60 dark:bg-navy-900/60 flex items-center justify-between">
              <span className="text-xs text-slate-500 dark:text-slate-400 tabular-nums">Created: {memo.created}</span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    navigator.clipboard.writeText(memo.code);
                    alert(`Copied Memo Code: ${memo.code}`);
                  }}
                  className="px-2.5 py-1 rounded bg-slate-100 dark:bg-navy-800 hover:bg-slate-200 dark:hover:bg-navy-700 text-xs text-slate-700 dark:text-slate-200 border border-slate-300 dark:border-white/15 flex items-center gap-1 transition-colors cursor-pointer"
                >
                  <Copy className="h-3 w-3" />
                  Copy Code
                </button>
                <button
                  type="button"
                  onClick={() => handlePrintSingleMemo(memo)}
                  className="px-2.5 py-1 rounded bg-orange-600 hover:bg-orange-700 text-xs font-semibold text-white flex items-center gap-1 transition-colors shadow-sm cursor-pointer"
                >
                  <Printer className="h-3 w-3" />
                  Print Test
                </button>
              </div>
            </div>
          </div>
        )))}
      </div>

      {/* Isolated 4x6" Print Portal for Memo Section */}
      {printingMemo &&
        typeof document !== 'undefined' &&
        createPortal(
          <div id="fulfillio-print-invoice-root" className="hidden">
            <UnifiedThermalSticker
              orderId="ORD-9824"
              memoCode={printingMemo.code}
              resellerName={printingMemo.resellerName}
              resellerPhone={printingMemo.phone}
              resellerAddress={printingMemo.address}
              brandColor={printingMemo.color}
              logoUrl={printingMemo.logoUrl}
              footerTerms={printingMemo.note}
              customerName="Tariqul Islam"
              customerPhone="01711-234567"
              customerAddress="Banani Block-D, Dhaka"
              city="Dhaka"
              codAmount={3450}
              courierProvider="STEADFAST"
              consignmentId="CN-982401"
              trackingCode="TRK-STE-982401"
              packagingType="POLY_SMALL"
              items={printingMemo.sampleItems.map((it: any, idx: number) => ({
                sku: `${printingMemo.merchantCode}-ITEM-0${idx + 1}`,
                title: it.name,
                color: 'STD',
                size: 'XL',
                qty: it.qty,
                price: Number(String(it.price).replace(/[^\d]/g, '')) || 1800,
              }))}
            />
          </div>,
          document.body,
        )}
    </div>
  );
}
