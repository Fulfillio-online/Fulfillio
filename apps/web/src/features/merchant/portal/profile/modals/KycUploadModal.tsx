'use client';

import React, { useState } from 'react';
import { X, ShieldCheck, FileText, CheckCircle2 } from 'lucide-react';
import { KycDocumentData } from '../types';
import { DocumentUploadDropzone } from '@/components/ui';

interface KycUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentKyc?: KycDocumentData;
  onSave: (kyc: KycDocumentData) => void;
}

export function KycUploadModal({
  isOpen,
  onClose,
  currentKyc,
  onSave,
}: KycUploadModalProps) {
  const [tradeLicenseNo, setTradeLicenseNo] = useState(currentKyc?.tradeLicenseNo || '');
  const [tradeLicenseDocUrl, setTradeLicenseDocUrl] = useState(currentKyc?.tradeLicenseDocUrl || '');
  const [nidNumber, setNidNumber] = useState(currentKyc?.nidNumber || '');
  const [nidDocUrl, setNidDocUrl] = useState(currentKyc?.nidDocUrl || '');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({
      tradeLicenseNo,
      tradeLicenseDocUrl,
      nidNumber,
      nidDocUrl,
      verificationStatus: 'PENDING_REVIEW',
      notes: 'Updated KYC documents submitted by merchant',
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in">
      <div className="w-full max-w-xl bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-slate-800 bg-slate-900/50">
          <div className="flex items-center gap-2.5">
            <div className="h-9 w-9 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
              <ShieldCheck className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-100">Business KYC Verification</h2>
              <p className="text-xs text-slate-400">Submit trade license and official identity documents</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="overflow-y-auto p-5 space-y-4 flex-1 text-xs">
          <div>
            <label className="block font-semibold text-slate-300 mb-1">
              Trade License Number / Business Registration
            </label>
            <input
              type="text"
              placeholder="e.g. TRAD/DNCC/092140/2024"
              value={tradeLicenseNo}
              onChange={(e) => setTradeLicenseNo(e.target.value)}
              required
              className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-slate-200 font-mono focus:outline-none focus:ring-1 focus:ring-emerald-500"
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-300 mb-1">
              Trade License Document (PDF or Photo)
            </label>
            <DocumentUploadDropzone
              label="Upload Trade License Document"
              sublabel="Official municipal corporation or union parishad trade license"
              currentUrl={tradeLicenseDocUrl}
              onUploadSuccess={(url) => setTradeLicenseDocUrl(url)}
            />
          </div>

          <div className="pt-3 border-t border-slate-800">
            <label className="block font-semibold text-slate-300 mb-1">
              Owner National ID (NID) / Smart Card #
            </label>
            <input
              type="text"
              placeholder="e.g. 19922692810000192"
              value={nidNumber}
              onChange={(e) => setNidNumber(e.target.value)}
              className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-slate-200 font-mono focus:outline-none focus:ring-1 focus:ring-emerald-500"
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-300 mb-1">
              Owner NID Document (Front / Back Photo)
            </label>
            <DocumentUploadDropzone
              label="Upload NID Photo"
              sublabel="Clear image of Government Smart Card or National ID"
              currentUrl={nidDocUrl}
              onUploadSuccess={(url) => setNidDocUrl(url)}
            />
          </div>

          {/* Footer Submit */}
          <div className="pt-4 border-t border-slate-800 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg font-semibold transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg font-semibold transition-colors shadow-sm"
            >
              Submit KYC for Audit
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
