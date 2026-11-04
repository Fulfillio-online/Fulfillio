'use client';

import React, { useState } from 'react';
import { Layers, Sparkles, CheckCircle2, Printer, Trash2 } from 'lucide-react';
import { ResellerMemo } from '../../types';

interface MerchantMemoDesignerTabProps {
  memoList: ResellerMemo[];
  onSaveMemo: (memo: ResellerMemo) => void;
  onSetDefaultMemo: (id: string) => void;
  onDeleteMemo: (id: string) => void;
  onTriggerToast: (msg: string) => void;
}

export function MerchantMemoDesignerTab({
  memoList,
  onSaveMemo,
  onSetDefaultMemo,
  onDeleteMemo,
  onTriggerToast,
}: MerchantMemoDesignerTabProps) {
  const [designerCode, setDesignerCode] = useState('MEMO-VIP-SPECIAL');
  const [designerName, setDesignerName] = useState('VIP Black Card Reseller');
  const [resellerStoreName, setResellerStoreName] = useState('VIP Trends BD');
  const [resellerPhone, setResellerPhone] = useState('+880 1812-990011');
  const [resellerAddress, setResellerAddress] = useState('Dhanmondi 27, Dhaka');
  const [resellerNote, setResellerNote] = useState('Exclusive VIP packing. Please preserve tags.');
  const [resellerColor, setResellerColor] = useState('#4f46e5');
  const [paperSize, setPaperSize] = useState('THERMAL_4X6');
  const [memoSavedAlert, setMemoSavedAlert] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!designerCode) return;

    const newMemo: ResellerMemo = {
      id: `memo-${Date.now()}`,
      code: designerCode.toUpperCase(),
      name: designerName,
      resellerName: resellerStoreName,
      phone: resellerPhone,
      address: resellerAddress,
      note: resellerNote,
      accentColor: resellerColor,
      paperSize,
      isDefault: false,
      created: 'Just now',
    };

    onSaveMemo(newMemo);
    setMemoSavedAlert(true);
    setTimeout(() => setMemoSavedAlert(false), 4000);
    onTriggerToast(
      `Reseller Memo ${designerCode.toUpperCase()} created & compiled for 4x6 thermal printers!`
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-100 flex items-center gap-2">
            <Layers className="h-6 w-6 text-indigo-400 shrink-0" />
            <span>Reseller Memo Designer (4x6 Thermal Focus)</span>
          </h1>
          <p className="text-sm text-slate-400 mt-0.5">
            Design custom branded slips for your dropshippers & resellers. Automatically prints on 4x6 thermal paper at the packing station.
          </p>
        </div>
      </div>

      {memoSavedAlert && (
        <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-sm font-semibold flex items-center gap-2">
          <CheckCircle2 className="h-4 w-4 shrink-0" />
          <span>Reseller memo template successfully saved and compiled for edge thermal printers!</span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8">
        {/* Form Editor */}
        <div className="lg:col-span-6 space-y-4">
          <form onSubmit={handleSubmit} className="p-4 sm:p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-4 shadow-sm">
            <h3 className="font-bold text-base text-slate-200 border-b border-slate-800 pb-3 flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-indigo-400" />
              <span>Reseller Slip Configuration</span>
            </h3>

            <div>
              <label className="text-xs font-semibold text-slate-400 block mb-1">
                Unique Memo Code (System Attribution)
              </label>
              <input
                type="text"
                value={designerCode}
                onChange={(e) => setDesignerCode(e.target.value.toUpperCase())}
                placeholder="e.g. MEMO-DARAZ-BD"
                required
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-sm font-mono text-indigo-300 focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-semibold text-slate-400 block mb-1">
                  Template Purpose
                </label>
                <input
                  type="text"
                  value={designerName}
                  onChange={(e) => setDesignerName(e.target.value)}
                  placeholder="e.g. Daraz Festive Slip"
                  required
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-sm text-slate-200 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-400 block mb-1">
                  Reseller Store / Brand Name
                </label>
                <input
                  type="text"
                  value={resellerStoreName}
                  onChange={(e) => setResellerStoreName(e.target.value)}
                  placeholder="e.g. Daraz Partner Store"
                  required
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-sm text-slate-200 focus:outline-none focus:border-indigo-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-semibold text-slate-400 block mb-1">
                  Reseller Contact Phone
                </label>
                <input
                  type="text"
                  value={resellerPhone}
                  onChange={(e) => setResellerPhone(e.target.value)}
                  placeholder="+880 18xx-xxxxxx"
                  required
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-sm text-slate-200 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-400 block mb-1">
                  Paper Size
                </label>
                <select
                  value={paperSize}
                  onChange={(e) => setPaperSize(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-sm text-slate-200 focus:outline-none focus:border-indigo-500"
                >
                  <option value="THERMAL_4X6">4x6 Inch Thermal Sticker</option>
                  <option value="POS_80MM">80mm POS Slip</option>
                </select>
              </div>
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-400 block mb-1">
                Reseller Return / Shop Address
              </label>
              <input
                type="text"
                value={resellerAddress}
                onChange={(e) => setResellerAddress(e.target.value)}
                placeholder="e.g. Tejgaon Industrial Area, Dhaka"
                required
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-sm text-slate-200 focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-400 block mb-1">
                Footnote / Warranty Notice
              </label>
              <input
                type="text"
                value={resellerNote}
                onChange={(e) => setResellerNote(e.target.value)}
                placeholder="e.g. 7-day return guarantee with invoice."
                required
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-sm text-slate-200 focus:outline-none focus:border-indigo-500"
              />
            </div>

            {/* Brand Accent Color Selector */}
            <div>
              <label className="text-xs font-semibold text-slate-400 block mb-1.5">
                Brand Accent Color:
              </label>
              <div className="flex flex-wrap items-center gap-2">
                {[
                  { color: '#4f46e5', label: 'Indigo' },
                  { color: '#ea580c', label: 'Orange' },
                  { color: '#059669', label: 'Emerald' },
                  { color: '#db2777', label: 'Pink' },
                  { color: '#1e293b', label: 'Slate' },
                ].map((c) => (
                  <button
                    key={c.color}
                    type="button"
                    onClick={() => setResellerColor(c.color)}
                    className={`h-7 px-2.5 rounded-lg text-[10px] font-bold text-white transition-all flex items-center gap-1.5 border ${
                      resellerColor === c.color ? 'ring-2 ring-white border-transparent' : 'border-slate-700'
                    }`}
                    style={{ backgroundColor: c.color }}
                  >
                    <span>{c.label}</span>
                  </button>
                ))}
              </div>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                type="submit"
                className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs transition-colors flex items-center justify-center gap-1.5 shadow-md"
              >
                <Sparkles className="h-4 w-4" />
                <span>Save Reseller Memo</span>
              </button>
            </div>
          </form>
        </div>

        {/* Live 4x6 Thermal Slip Preview */}
        <div className="lg:col-span-6 space-y-4">
          <div className="p-4 sm:p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-4 shadow-sm">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-3">
              <div>
                <h3 className="font-bold text-base text-slate-200">
                  Thermal 4x6 Slip Real Preview
                </h3>
                <p className="text-xs text-slate-400">
                  Exact layout sent to Zebra/TSC thermal label printer at packing station.
                </p>
              </div>

              <button
                onClick={() => {
                  onTriggerToast(`Triggered 4x6 thermal test print for ${designerCode}!`);
                }}
                className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors border border-slate-700 shrink-0"
              >
                <Printer className="h-3.5 w-3.5" />
                <span>Print 4x6 Test</span>
              </button>
            </div>

            {/* Realistic 4x6 Thermal Label Simulation */}
            <div className="overflow-x-auto">
              <div className="mx-auto w-full max-w-[310px] bg-white text-black p-5 rounded-lg shadow-2xl font-mono text-[11px] leading-tight space-y-3 border-2 border-slate-300">
                {/* Top Brand Banner */}
                <div
                  className="p-2 text-center text-white rounded font-bold"
                  style={{ backgroundColor: resellerColor }}
                >
                  <span className="text-sm tracking-wide block uppercase">{resellerStoreName}</span>
                  <span className="text-[10px] opacity-90 block">{resellerPhone}</span>
                </div>

                <div className="text-center">
                  <div className="inline-block border border-black px-2 py-0.5 font-bold text-[10px] bg-slate-100">
                    CODE: {designerCode || 'DEFAULT'}
                  </div>
                </div>

                <div className="border-b border-black pb-2 space-y-1">
                  <div className="flex justify-between text-[10px]">
                    <span>Order: #ORD-9824</span>
                    <span>24 Oct 2026</span>
                  </div>
                  <div className="font-bold">Customer: Tariqul Islam (01812345678)</div>
                  <div className="text-[10px] text-gray-700">Dhanmondi, Dhaka</div>
                </div>

                <div className="w-full text-left text-[10px]">
                  <div className="grid grid-cols-12 border-b border-black font-bold py-1">
                    <span className="col-span-7">Item / SKU</span>
                    <span className="col-span-2 text-center">Qty</span>
                    <span className="col-span-3 text-right">Price</span>
                  </div>
                  <div className="grid grid-cols-12 border-b border-gray-200 py-1 items-center">
                    <div className="col-span-7">
                      <div>Heavyweight Hoodie (XL)</div>
                      <span className="text-[9px] text-gray-500 font-bold">MC-101-HOODIE-BLK-XL</span>
                    </div>
                    <span className="col-span-2 text-center">1</span>
                    <span className="col-span-3 text-right">৳ 3,450</span>
                  </div>
                </div>

                <div className="border-t-2 border-black pt-2 flex justify-between font-black text-xs">
                  <span>Total Payable (COD):</span>
                  <span>৳ 3,450</span>
                </div>

                <div className="text-center pt-2 border-t border-dashed border-gray-400 text-[9px] text-gray-600">
                  {resellerNote}
                </div>

                <div className="text-center text-[9px] text-gray-500 font-bold">
                  Return: {resellerAddress}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Active Reseller Memo Cards Grid */}
      <div className="space-y-4 pt-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
          <h3 className="font-bold text-lg text-slate-100 flex items-center gap-2">
            <Layers className="h-5 w-5 text-indigo-400 shrink-0" />
            <span>Active Reseller Memo Templates ({memoList.length})</span>
          </h3>
          <span className="text-xs text-slate-400">
            Assigned to your manual orders and WooCommerce webhooks.
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {memoList.map((memo) => (
            <div
              key={memo.id}
              className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-3 relative overflow-hidden group hover:border-slate-700 transition-colors shadow-sm"
            >
              {/* Accent Header Bar */}
              <div
                className="h-1.5 w-full absolute top-0 left-0"
                style={{ backgroundColor: memo.accentColor }}
              />

              <div className="flex items-start justify-between">
                <div>
                  <span className="font-mono text-xs font-bold text-indigo-300 bg-slate-950 px-2 py-0.5 rounded border border-slate-800 inline-block">
                    {memo.code}
                  </span>
                  <h4 className="font-bold text-sm text-slate-100 mt-1">{memo.resellerName}</h4>
                  <span className="text-xs text-slate-400 block">{memo.name}</span>
                </div>

                {memo.isDefault && (
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                    Default
                  </span>
                )}
              </div>

              <div className="text-xs text-slate-400 space-y-1 pt-1 border-t border-slate-800/80">
                <div>Phone: <span className="text-slate-300 font-mono">{memo.phone}</span></div>
                <div className="truncate">Return: <span className="text-slate-300">{memo.address}</span></div>
              </div>

              <div className="pt-2 flex items-center justify-between border-t border-slate-800/80 text-xs">
                {!memo.isDefault ? (
                  <button
                    onClick={() => {
                      onSetDefaultMemo(memo.id);
                      onTriggerToast('Default Reseller Memo updated!');
                    }}
                    className="text-slate-400 hover:text-emerald-400 text-xs font-semibold transition-colors"
                  >
                    Set as Default
                  </button>
                ) : (
                  <span className="text-[11px] text-emerald-400 font-semibold">Primary Default</span>
                )}

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      onTriggerToast(`Printed 4x6 test for ${memo.code}`);
                    }}
                    className="p-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300"
                    title="Print test slip"
                  >
                    <Printer className="h-3.5 w-3.5" />
                  </button>
                  <button
                    onClick={() => {
                      onDeleteMemo(memo.id);
                      onTriggerToast('Reseller Memo removed.');
                    }}
                    className="p-1 rounded hover:bg-rose-500/10 text-slate-500 hover:text-rose-400 transition-colors"
                    title="Delete memo"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
