'use client';

import React, { useState, useRef, useEffect } from 'react';
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
import { MerchantProfileData, ResellerMemo } from '../../types';

interface PaperSizeSpec {
  id: string;
  label: string;
  shortLabel: string;
  dimensions: string;
  previewClass: string;
  pageCss: string;
  bodyWidthCss: string;
}

const PAPER_SIZE_CONFIG: Record<string, PaperSizeSpec> = {
  THERMAL_4X6: {
    id: 'THERMAL_4X6',
    label: '4x6 Inch Thermal Sticker',
    shortLabel: '4x6 Thermal',
    dimensions: '101.6 × 152.4 mm',
    previewClass: 'max-w-[340px] min-h-[440px] p-5 sm:p-6',
    pageCss: '4in 6in',
    bodyWidthCss: '4in',
  },
  POS_80MM: {
    id: 'POS_80MM',
    label: '80mm POS Slip',
    shortLabel: '80mm POS',
    dimensions: '80 × auto mm',
    previewClass: 'max-w-[250px] p-3.5 text-[11px]',
    pageCss: '80mm auto',
    bodyWidthCss: '76mm',
  },
  A5: {
    id: 'A5',
    label: 'A5 Invoice Slip',
    shortLabel: 'A5',
    dimensions: '148 × 210 mm',
    previewClass: 'max-w-[440px] min-h-[540px] p-6 sm:p-7',
    pageCss: 'A5',
    bodyWidthCss: '138mm',
  },
  A4: {
    id: 'A4',
    label: 'A4 Full Invoice',
    shortLabel: 'A4',
    dimensions: '210 × 297 mm',
    previewClass: 'max-w-[560px] min-h-[680px] p-7 sm:p-9',
    pageCss: 'A4',
    bodyWidthCss: '190mm',
  },
};

function getPaperSpec(size?: string): PaperSizeSpec {
  return PAPER_SIZE_CONFIG[size || 'THERMAL_4X6'] || PAPER_SIZE_CONFIG.THERMAL_4X6;
}

interface MerchantMemoDesignerTabProps {
  profile?: MerchantProfileData;
  memoList: ResellerMemo[];
  onSaveMemo: (memo: ResellerMemo) => void;
  onSetDefaultMemo: (id: string) => void;
  onDeleteMemo: (id: string) => void;
  onTriggerToast: (msg: string) => void;
}

export function MerchantMemoDesignerTab({
  profile,
  memoList,
  onSaveMemo,
  onSetDefaultMemo,
  onDeleteMemo,
  onTriggerToast,
}: MerchantMemoDesignerTabProps) {
  const defaultAddress = profile?.personalAddress?.trim() || profile?.location?.trim() || '';

  const [designerName, setDesignerName] = useState('Default Branded Slip');
  const [resellerStoreName, setResellerStoreName] = useState(profile?.storeName || '');
  const [resellerPhone, setResellerPhone] = useState(profile?.phone || '');
  const [resellerAddress, setResellerAddress] = useState(defaultAddress);
  const [resellerNote, setResellerNote] = useState('Thank you for shopping! Return within 7 days with invoice.');
  const [resellerLogo, setResellerLogo] = useState<string>(profile?.logoUrl || '');
  const [paperSize, setPaperSize] = useState('THERMAL_4X6');
  const [memoSavedAlert, setMemoSavedAlert] = useState(false);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  // Track whether user manually edited fields so async profile hydration pre-fills untouched fields
  const dirtyRef = useRef({
    storeName: false,
    phone: false,
    address: false,
    logo: false,
  });

  useEffect(() => {
    if (!profile) return;
    if (!dirtyRef.current.storeName && profile.storeName) {
      setResellerStoreName(profile.storeName);
    }
    if (!dirtyRef.current.phone && profile.phone) {
      setResellerPhone(profile.phone);
    }
    const addr = profile.personalAddress?.trim() || profile.location?.trim() || '';
    if (!dirtyRef.current.address && addr) {
      setResellerAddress(addr);
    }
    if (!dirtyRef.current.logo && profile.logoUrl) {
      setResellerLogo(profile.logoUrl);
    }
  }, [profile]);

  const logoInputRef = useRef<HTMLInputElement>(null);
  const currentSpec = getPaperSpec(paperSize);

  const handlePrintMemo = (memoData: {
    storeName: string;
    phone: string;
    address: string;
    note: string;
    logoUrl?: string;
    paperSize: string;
    code?: string;
  }) => {
    const spec = getPaperSpec(memoData.paperSize);
    if (typeof window === 'undefined') return;
    const printWin = window.open('', '_blank', 'width=720,height=840');
    if (!printWin) {
      onTriggerToast(`Popup blocked — allow popups to print ${spec.shortLabel} slip.`);
      return;
    }
    const safeHtml = (val: string) =>
      String(val || '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;');
    printWin.document.write(`<!DOCTYPE html>
<html>
<head>
  <title>Memo Print Preview - ${safeHtml(memoData.code || spec.shortLabel)}</title>
  <style>
    @page { size: ${spec.pageCss}; margin: 4mm; }
    * { box-sizing: border-box; font-family: system-ui, -apple-system, sans-serif; }
    body { margin: 0; padding: 12px; display: flex; justify-content: center; background: #f8fafc; }
    .slip {
      width: ${spec.bodyWidthCss};
      background: #fff;
      color: #0f172a;
      border: 1px dashed #cbd5e1;
      padding: ${memoData.paperSize === 'POS_80MM' ? '10px' : '18px'};
    }
    .center { text-align: center; }
    .brand { color: #4f46e5; font-weight: 900; font-size: ${memoData.paperSize === 'A4' ? '20px' : '15px'}; text-transform: uppercase; margin: 4px 0; }
    .muted { color: #64748b; font-size: 11px; margin: 2px 0; }
    hr { border: none; border-top: 1px solid #e2e8f0; margin: 10px 0; }
    .row { display: flex; justify-content: space-between; align-items: flex-start; font-size: 12px; }
    .cod { background: #f1f5f9; border-radius: 8px; padding: 10px; display: flex; justify-content: space-between; font-weight: 800; margin-top: 10px; font-size: 13px; }
    .note { font-size: 11px; font-style: italic; color: #64748b; text-align: center; margin-top: 12px; }
    @media print { body { background: #fff; padding: 0; } .slip { border: none; } }
  </style>
</head>
<body>
  <div class="slip">
    <div class="center">
      ${memoData.logoUrl ? `<img src="${memoData.logoUrl}" alt="Logo" style="max-height:48px;max-width:160px;object-fit:contain;margin-bottom:6px;" />` : ''}
      <div class="brand">${safeHtml(memoData.storeName || 'STORE NAME')}</div>
      <div class="muted">${safeHtml(memoData.phone)}</div>
      <div class="muted">Return: ${safeHtml(memoData.address)}</div>
    </div>
    <hr />
    <div class="row">
      <div><strong>Customer: Tariqul Islam</strong><div class="muted">Banani Block-D, Dhaka</div></div>
      <strong>#ORD-9824</strong>
    </div>
    <hr />
    <div class="row">
      <span>Heavyweight Hoodie (XL) x 1</span>
      <strong>৳ 3,450</strong>
    </div>
    <div class="cod">
      <span>Cash on Delivery (COD):</span>
      <span>৳ 3,450</span>
    </div>
    ${memoData.note ? `<div class="note">"${safeHtml(memoData.note)}"</div>` : ''}
  </div>
  <script>window.onload = function() { window.print(); };</script>
</body>
</html>`);
    printWin.document.close();
    onTriggerToast(`Opened ${spec.shortLabel} (${spec.dimensions}) print preview!`);
  };

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

    // Auto-generate unique memo code by system/backend
    const autoCode = `MEMO-${Math.floor(100000 + Math.random() * 900000)}`;

    const newMemo: ResellerMemo = {
      id: `memo-${Date.now()}`,
      code: autoCode,
      name: designerName.trim() || 'Branded Slip',
      resellerName: resellerStoreName.trim() || 'Brand Store',
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
      `Reseller Memo created with Code: ${autoCode}! You can copy it from the list below.`
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-navy-900 dark:text-white flex items-center gap-2">
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
          <form onSubmit={handleSubmit} className="p-4 sm:p-6 rounded-2xl bg-white dark:bg-navy-900 border border-slate-200/80 dark:border-white/10 shadow-xs space-y-4 shadow-sm">
            <h3 className="font-bold text-base text-navy-900 dark:text-white border-b border-slate-200 dark:border-white/10 pb-3 flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-indigo-400" />
              <span>Reseller Slip Configuration</span>
            </h3>

            <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-navy-950/70 border border-slate-200 dark:border-white/10 flex items-center justify-between text-xs">
              <div className="flex items-center gap-2 text-slate-700 dark:text-slate-300">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <span className="font-medium">Memo Code:</span>
                <span className="text-slate-400 text-[11px]">(Assigned automatically upon creation)</span>
              </div>
              <span className="font-mono text-xs font-bold text-orange-700 bg-orange-50 border border-orange-200 dark:text-indigo-300 dark:bg-indigo-950/60 dark:border-indigo-800/50 px-2.5 py-1 rounded">
                AUTO-ASSIGNED
              </span>
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
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-navy-950 border border-slate-200 dark:border-white/10 rounded-lg text-sm text-navy-900 dark:text-white focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-400 block mb-1">
                  Reseller Store / Brand Name
                </label>
                <input
                  type="text"
                  value={resellerStoreName}
                  onChange={(e) => {
                    dirtyRef.current.storeName = true;
                    setResellerStoreName(e.target.value);
                  }}
                  placeholder={profile?.storeName || 'e.g. Your Store Name'}
                  required
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-navy-950 border border-slate-200 dark:border-white/10 rounded-lg text-sm text-navy-900 dark:text-white focus:outline-none focus:border-indigo-500"
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
                  onChange={(e) => {
                    dirtyRef.current.phone = true;
                    setResellerPhone(e.target.value);
                  }}
                  placeholder={profile?.phone || '+880 17XX-XXXXXX'}
                  required
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-navy-950 border border-slate-200 dark:border-white/10 rounded-lg text-sm text-navy-900 dark:text-white focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-400 block mb-1">
                  Paper Size
                </label>
                <select
                  value={paperSize}
                  onChange={(e) => setPaperSize(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-navy-950 border border-slate-200 dark:border-white/10 rounded-lg text-sm text-navy-900 dark:text-white focus:outline-none focus:border-indigo-500"
                >
                  <option value="THERMAL_4X6">4x6 Inch Thermal Sticker (101.6 × 152.4 mm)</option>
                  <option value="POS_80MM">80mm POS Receipt Slip (80 mm)</option>
                  <option value="A5">A5 Invoice Slip (148 × 210 mm)</option>
                  <option value="A4">A4 Full Invoice (210 × 297 mm)</option>
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
                onChange={(e) => {
                  dirtyRef.current.address = true;
                  setResellerAddress(e.target.value);
                }}
                placeholder={defaultAddress || 'Enter return / shop address'}
                required
                className="w-full px-3 py-2 bg-slate-50 dark:bg-navy-950 border border-slate-200 dark:border-white/10 rounded-lg text-sm text-navy-900 dark:text-white focus:outline-none focus:border-indigo-500"
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
                className="w-full px-3 py-2 bg-slate-50 dark:bg-navy-950 border border-slate-200 dark:border-white/10 rounded-lg text-sm text-navy-900 dark:text-white focus:outline-none focus:border-indigo-500"
              />
            </div>

            {/* Store / Brand Logo Upload (Replaces Brand Color Picker) */}
            <div>
              <label className="text-xs font-semibold text-slate-400 block mb-1.5">
                Store / Brand Logo
              </label>
              <div className="flex items-center gap-3">
                {resellerLogo ? (
                  <div className="relative group w-20 h-16 rounded-xl bg-white border border-slate-200 dark:border-white/10 flex items-center justify-center p-1.5 overflow-hidden shrink-0 shadow-sm">
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
                  <div className="w-20 h-16 rounded-xl bg-slate-50 dark:bg-navy-950 border border-dashed border-slate-200/80 dark:border-white/10 flex flex-col items-center justify-center text-slate-500 shrink-0">
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
                      className="px-3 py-1.5 rounded-lg bg-slate-100 dark:bg-navy-800 hover:bg-slate-200 dark:hover:bg-navy-700 text-navy-900 dark:text-white text-xs font-medium flex items-center gap-1.5 border border-slate-200 dark:border-white/10 transition-colors"
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
                className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-orange-600 hover:bg-orange-500 dark:bg-indigo-600 dark:hover:bg-indigo-500 text-white font-bold text-xs transition-colors flex items-center justify-center gap-1.5 shadow-md shadow-orange-500/20 dark:shadow-indigo-500/20 cursor-pointer"
              >
                <Sparkles className="h-4 w-4" />
                <span>Save Reseller Memo</span>
              </button>
            </div>
          </form>
        </div>

        {/* Live Slip Preview scaled to selected Paper Size */}
        <div className="lg:col-span-6 space-y-4">
          <div className="p-4 sm:p-6 rounded-2xl bg-white dark:bg-navy-900 border border-slate-200/80 dark:border-white/10 shadow-xs space-y-4 shadow-sm">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 dark:border-white/10 pb-3">
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="font-bold text-base text-navy-900 dark:text-white">
                    {currentSpec.shortLabel} Real Preview
                  </h3>
                  <span className="px-2 py-0.5 rounded-md text-[10px] font-mono font-bold bg-indigo-500/10 text-indigo-500 dark:text-indigo-300 border border-indigo-500/20">
                    {currentSpec.dimensions}
                  </span>
                </div>
                <p className="text-xs text-slate-400 mt-0.5">
                  Exact {currentSpec.label} layout used for printing at the packing station.
                </p>
              </div>

              <button
                type="button"
                onClick={() =>
                  handlePrintMemo({
                    storeName: resellerStoreName,
                    phone: resellerPhone,
                    address: resellerAddress,
                    note: resellerNote,
                    logoUrl: resellerLogo,
                    paperSize,
                  })
                }
                className="px-3 py-1.5 rounded-lg bg-orange-600 hover:bg-orange-500 text-white text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors shadow-sm shrink-0 cursor-pointer"
              >
                <Printer className="h-3.5 w-3.5" />
                <span>Print {currentSpec.shortLabel} Test</span>
              </button>
            </div>

            {/* Dynamic Paper Size Simulation */}
            <div className="overflow-x-auto py-2">
              <div
                className={`mx-auto w-full ${currentSpec.previewClass} bg-white text-slate-800 rounded-2xl shadow-xl font-sans border-2 border-dashed border-slate-300 transition-all duration-200 flex flex-col justify-between`}
              >
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
            <div className="flex items-center justify-between pt-3 border-t border-slate-200/80 dark:border-white/10 text-xs text-slate-400">
              <span className="text-[11px]">
                Memo Code: <span className="text-orange-600 dark:text-indigo-400 font-mono font-semibold">Auto-assigned upon save</span>
              </span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() =>
                    handlePrintMemo({
                      storeName: resellerStoreName,
                      phone: resellerPhone,
                      address: resellerAddress,
                      note: resellerNote,
                      logoUrl: resellerLogo,
                      paperSize,
                    })
                  }
                  className="px-3 py-1.5 rounded-lg bg-orange-600 hover:bg-orange-500 text-white text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-sm cursor-pointer"
                >
                  <Printer className="h-3.5 w-3.5" />
                  <span>Print Preview Test</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Active Reseller Memo Templates Grid */}
      <div className="space-y-4 pt-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
          <h3 className="font-bold text-lg text-navy-900 dark:text-white flex items-center gap-2">
            <Layers className="h-5 w-5 text-indigo-400 shrink-0" />
            <span>Active Reseller Memo Templates ({memoList.length})</span>
          </h3>
          <span className="text-xs text-slate-400">
            Assigned to your manual orders and WooCommerce webhooks.
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {memoList.map((memo) => {
            const memoSpec = getPaperSpec(memo.paperSize);
            return (
            <div
              key={memo.id}
              className="p-5 rounded-2xl bg-white dark:bg-navy-900 border border-slate-200/80 dark:border-white/10 shadow-xs space-y-4 relative group hover:border-slate-200 dark:border-white/10 transition-colors shadow-sm flex flex-col justify-between"
            >
              {/* Card Header */}
              <div className="flex items-start justify-between gap-2">
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-mono text-xs font-bold text-indigo-300 bg-slate-50 dark:bg-navy-950 px-2 py-0.5 rounded border border-slate-200/80 dark:border-white/10 inline-block">
                      {memo.code}
                    </span>
                    <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-indigo-500/10 text-indigo-500 dark:text-indigo-300 border border-indigo-500/20">
                      {memoSpec.shortLabel}
                    </span>
                    {memo.isDefault && (
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                        Default
                      </span>
                    )}
                  </div>
                  <h4 className="font-bold text-sm text-navy-900 dark:text-white mt-1.5">{memo.resellerName}</h4>
                  <span className="text-xs text-slate-400 block">{memo.name}</span>
                </div>

                <div className="flex items-center gap-1">
                  {!memo.isDefault && (
                    <button
                      onClick={() => {
                        onSetDefaultMemo(memo.id);
                        onTriggerToast('Default Reseller Memo updated!');
                      }}
                      className="px-2 py-1 rounded text-[11px] text-slate-400 hover:text-orange-600 dark:hover:text-orange-400 font-semibold transition-colors"
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
              <div className="pt-2 flex items-center justify-between border-t border-slate-200/80 dark:border-white/10 text-xs">
                <span className="text-[11px] text-slate-500">
                  Created: <span className="text-slate-400">{memo.created || '2026-10-15'}</span>
                </span>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => handleCopyCode(memo.code)}
                    className="px-2.5 py-1.5 rounded-lg bg-slate-100 dark:bg-navy-800 hover:bg-slate-200 dark:hover:bg-navy-700 text-navy-900 dark:text-white text-xs font-semibold flex items-center gap-1 transition-colors border border-slate-200 dark:border-white/10"
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
                    onClick={() =>
                      handlePrintMemo({
                        storeName: memo.resellerName,
                        phone: memo.phone,
                        address: memo.address,
                        note: memo.note,
                        logoUrl: memo.logoUrl,
                        paperSize: memo.paperSize,
                        code: memo.code,
                      })
                    }
                    className="px-2.5 py-1.5 rounded-lg bg-orange-600 hover:bg-orange-500 text-white text-xs font-semibold flex items-center gap-1 transition-colors shadow-sm cursor-pointer"
                  >
                    <Printer className="h-3.5 w-3.5" />
                    <span>Print Test</span>
                  </button>
                </div>
              </div>
            </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
