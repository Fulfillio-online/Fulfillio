'use client';

import React, { useState, useRef } from 'react';
import {
  Layers,
  Sparkles,
  CheckCircle2,
  Printer,
  Trash2,
  Upload,
  Image as ImageIcon,
  Copy,
  Check,
  X,
} from 'lucide-react';
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
  const [designerCode, setDesignerCode] = useState('MEMO-FESTIVE-01');
  const [designerName, setDesignerName] = useState('Festive Season Branded Slip');
  const [resellerStoreName, setResellerStoreName] = useState('URBAN THREADS OFFICIAL');
  const [resellerPhone, setResellerPhone] = useState('+880 1711-234567');
  const [resellerAddress, setResellerAddress] = useState('Banani, Dhaka');
  const [resellerNote, setResellerNote] = useState('Thank you for shopping! Return within 7 days with invoice.');
  const [resellerLogo, setResellerLogo] = useState<string>('');
  const [paperSize, setPaperSize] = useState('THERMAL_4X6');
  const [memoSavedAlert, setMemoSavedAlert] = useState(false);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  const logoInputRef = useRef<HTMLInputElement>(null);

  const handleCopyCode = (code: string) => {
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(code);
      setCopiedCode(code);
      setTimeout(() => setCopiedCode(null), 2000);
      onTriggerToast(`Copied ${code} to clipboard!`);
    }
  };

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        onTriggerToast('Logo file size should be less than 2MB');
        return;
      }
      const reader = new FileReader();
      reader.onload = (uploadEvent) => {
        const result = uploadEvent.target?.result as string;
        setResellerLogo(result);
        onTriggerToast('Store logo uploaded successfully!');
      };
      reader.readAsDataURL(file);
    }
  };

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
      logoUrl: resellerLogo || undefined,
      paperSize,
      isDefault: false,
      created: new Date().toISOString().split('T')[0],
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
                placeholder="e.g. MEMO-FESTIVE-01"
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
                  placeholder="e.g. Festive Season Branded Slip"
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
                  placeholder="e.g. URBAN THREADS OFFICIAL"
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
                  placeholder="+880 1711-234567"
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
                placeholder="e.g. Banani, Dhaka"
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
                placeholder="e.g. Thank you for shopping! Return within 7 days with invoice."
                required
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-sm text-slate-200 focus:outline-none focus:border-indigo-500"
              />
            </div>

            {/* Store / Brand Logo Upload (Replaces Brand Color Picker) */}
            <div>
              <label className="text-xs font-semibold text-slate-400 block mb-1.5">
                Store / Brand Logo
              </label>
              <div className="flex items-center gap-3">
                {resellerLogo ? (
                  <div className="relative group w-20 h-16 rounded-xl bg-white border border-slate-700 flex items-center justify-center p-1.5 overflow-hidden shrink-0 shadow-sm">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={resellerLogo}
                      alt="Store Logo"
                      className="max-h-full max-w-full object-contain"
                    />
                    <button
                      type="button"
                      onClick={() => setResellerLogo('')}
                      className="absolute top-1 right-1 p-0.5 rounded-full bg-rose-600 hover:bg-rose-500 text-white shadow"
                      title="Remove Logo"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                ) : (
                  <div className="w-20 h-16 rounded-xl bg-slate-950 border border-dashed border-slate-800 flex flex-col items-center justify-center text-slate-500 shrink-0">
                    <ImageIcon className="h-5 w-5 mb-0.5 opacity-50" />
                    <span className="text-[9px]">No Logo</span>
                  </div>
                )}

                <div className="flex-1 space-y-1.5">
                  <input
                    ref={logoInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleLogoUpload}
                    className="hidden"
                    id="store-logo-upload"
                  />
                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => logoInputRef.current?.click()}
                      className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium flex items-center gap-1.5 border border-slate-700 transition-colors"
                    >
                      <Upload className="h-3.5 w-3.5 text-indigo-400" />
                      <span>{resellerLogo ? 'Change Logo' : 'Upload Logo'}</span>
                    </button>
                    {resellerLogo && (
                      <button
                        type="button"
                        onClick={() => setResellerLogo('')}
                        className="px-2.5 py-1.5 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 text-xs font-medium border border-rose-500/20 transition-colors"
                      >
                        Remove
                      </button>
                    )}
                  </div>
                  <p className="text-[10px] text-slate-500">
                    Upload PNG, JPG, or SVG. Shows at the top of the memo slip instead of or above text.
                  </p>
                </div>
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

        {/* Live 4x6 Thermal Slip Preview matching Screenshot_35.png */}
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
                type="button"
                onClick={() => {
                  onTriggerToast(`Triggered 4x6 thermal test print for ${designerCode}!`);
                }}
                className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors shadow-sm shrink-0"
              >
                <Printer className="h-3.5 w-3.5" />
                <span>Print 4x6 Test</span>
              </button>
            </div>

            {/* Realistic 4x6 Thermal Label Simulation matching Screenshot_35.png */}
            <div className="overflow-x-auto py-2">
              <div className="mx-auto w-full max-w-[340px] bg-white text-slate-800 p-5 sm:p-6 rounded-2xl shadow-xl font-sans border-2 border-dashed border-slate-300">
                {/* Header */}
                <div className="text-center space-y-0.5">
                  {resellerLogo ? (
                    <div className="flex justify-center mb-2">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={resellerLogo}
                        alt={resellerStoreName}
                        className="max-h-12 max-w-[180px] object-contain"
                      />
                    </div>
                  ) : null}
                  <h4 className="text-indigo-600 font-black text-base tracking-wider uppercase">
                    {resellerStoreName || 'STORE NAME'}
                  </h4>
                  <p className="text-xs text-slate-500 font-medium">{resellerPhone}</p>
                  <p className="text-xs text-slate-500 font-medium">Return: {resellerAddress}</p>
                </div>

                <hr className="border-t border-slate-200 my-3" />

                {/* Customer Details */}
                <div className="flex justify-between items-start text-xs">
                  <div>
                    <p className="font-bold text-slate-800">Customer: Tariqul Islam</p>
                    <p className="text-[11px] text-slate-500 mt-0.5">Banani Block-D, Dhaka</p>
                  </div>
                  <span className="font-bold text-slate-700">#ORD-9824</span>
                </div>

                <hr className="border-t border-slate-200 my-3" />

                {/* Order Item */}
                <div className="flex justify-between items-center text-xs">
                  <span className="font-medium text-slate-800">Heavyweight Hoodie (XL) x 1</span>
                  <span className="font-bold text-slate-800">৳ 3,450</span>
                </div>

                {/* COD Highlight Box */}
                <div className="bg-slate-100 rounded-xl p-3 flex justify-between items-center text-xs mt-3">
                  <span className="text-slate-600 font-semibold">Cash on Delivery (COD):</span>
                  <span className="font-black text-slate-900 text-sm">৳ 3,450</span>
                </div>

                {/* Footer Note */}
                {resellerNote && (
                  <p className="text-[11px] italic text-slate-400 text-center mt-3 leading-relaxed">
                    &ldquo;{resellerNote}&rdquo;
                  </p>
                )}
              </div>
            </div>

            {/* Bottom Controls matching Screenshot_35.png */}
            <div className="flex items-center justify-between pt-3 border-t border-slate-800 text-xs text-slate-400">
              <span className="text-[11px]">
                Created: <span className="text-slate-300 font-mono">2026-10-15</span>
              </span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => handleCopyCode(designerCode)}
                  className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold flex items-center gap-1.5 transition-colors border border-slate-700"
                >
                  {copiedCode === designerCode ? (
                    <>
                      <Check className="h-3.5 w-3.5 text-emerald-400" />
                      <span className="text-emerald-400">Copied</span>
                    </>
                  ) : (
                    <>
                      <Copy className="h-3.5 w-3.5 text-slate-400" />
                      <span>Copy Code</span>
                    </>
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    onTriggerToast(`Triggered 4x6 thermal test print for ${designerCode}!`);
                  }}
                  className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-sm"
                >
                  <Printer className="h-3.5 w-3.5" />
                  <span>Print Test</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Active Reseller Memo Templates Grid */}
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

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {memoList.map((memo) => (
            <div
              key={memo.id}
              className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-4 relative group hover:border-slate-700 transition-colors shadow-sm flex flex-col justify-between"
            >
              {/* Card Header */}
              <div className="flex items-start justify-between gap-2">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-bold text-indigo-300 bg-slate-950 px-2 py-0.5 rounded border border-slate-800 inline-block">
                      {memo.code}
                    </span>
                    {memo.isDefault && (
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                        Default
                      </span>
                    )}
                  </div>
                  <h4 className="font-bold text-sm text-slate-100 mt-1.5">{memo.resellerName}</h4>
                  <span className="text-xs text-slate-400 block">{memo.name}</span>
                </div>

                <div className="flex items-center gap-1">
                  {!memo.isDefault && (
                    <button
                      onClick={() => {
                        onSetDefaultMemo(memo.id);
                        onTriggerToast('Default Reseller Memo updated!');
                      }}
                      className="px-2 py-1 rounded text-[11px] text-slate-400 hover:text-emerald-400 font-semibold transition-colors"
                      title="Set as Default"
                    >
                      Set Default
                    </button>
                  )}
                  <button
                    onClick={() => {
                      onDeleteMemo(memo.id);
                      onTriggerToast('Reseller Memo removed.');
                    }}
                    className="p-1.5 rounded hover:bg-rose-500/10 text-slate-500 hover:text-rose-400 transition-colors"
                    title="Delete memo"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>

              {/* Thermal Slip Simulation matching Screenshot_35.png */}
              <div className="bg-white text-slate-800 p-4 rounded-xl font-sans border-2 border-dashed border-slate-300 shadow-sm space-y-2 text-left">
                {/* Header */}
                <div className="text-center space-y-0.5">
                  {memo.logoUrl ? (
                    <div className="flex justify-center mb-1.5">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={memo.logoUrl}
                        alt={memo.resellerName}
                        className="max-h-8 max-w-[140px] object-contain"
                      />
                    </div>
                  ) : null}
                  <h5 className="text-indigo-600 font-black text-xs tracking-wider uppercase">
                    {memo.resellerName}
                  </h5>
                  <p className="text-[10px] text-slate-500 font-medium">{memo.phone}</p>
                  <p className="text-[10px] text-slate-500 font-medium">Return: {memo.address}</p>
                </div>

                <hr className="border-t border-slate-200 my-2" />

                {/* Customer Details */}
                <div className="flex justify-between items-start text-[10px]">
                  <div>
                    <p className="font-bold text-slate-800">Customer: Tariqul Islam</p>
                    <p className="text-[9px] text-slate-500">Banani Block-D, Dhaka</p>
                  </div>
                  <span className="font-bold text-slate-700">#ORD-9824</span>
                </div>

                <hr className="border-t border-slate-200 my-2" />

                {/* Items */}
                <div className="flex justify-between items-center text-[10px]">
                  <span className="font-medium text-slate-800">Heavyweight Hoodie (XL) x 1</span>
                  <span className="font-bold text-slate-800">৳ 3,450</span>
                </div>

                {/* COD Box */}
                <div className="bg-slate-100 rounded-lg p-2 flex justify-between items-center text-[10px] mt-2">
                  <span className="text-slate-600 font-semibold">Cash on Delivery (COD):</span>
                  <span className="font-black text-slate-900 text-xs">৳ 3,450</span>
                </div>

                {/* Footer Note */}
                {memo.note && (
                  <p className="text-[9px] italic text-slate-400 text-center mt-2 leading-relaxed">
                    &ldquo;{memo.note}&rdquo;
                  </p>
                )}
              </div>

              {/* Bottom Actions */}
              <div className="pt-2 flex items-center justify-between border-t border-slate-800 text-xs">
                <span className="text-[11px] text-slate-500">
                  Created: <span className="text-slate-400">{memo.created || '2026-10-15'}</span>
                </span>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => handleCopyCode(memo.code)}
                    className="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold flex items-center gap-1 transition-colors border border-slate-700"
                  >
                    {copiedCode === memo.code ? (
                      <>
                        <Check className="h-3.5 w-3.5 text-emerald-400" />
                        <span className="text-emerald-400">Copied</span>
                      </>
                    ) : (
                      <>
                        <Copy className="h-3.5 w-3.5 text-slate-400" />
                        <span>Copy Code</span>
                      </>
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      onTriggerToast(`Printed 4x6 test slip for ${memo.code}`);
                    }}
                    className="px-2.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold flex items-center gap-1 transition-colors shadow-sm"
                  >
                    <Printer className="h-3.5 w-3.5" />
                    <span>Print Test</span>
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
