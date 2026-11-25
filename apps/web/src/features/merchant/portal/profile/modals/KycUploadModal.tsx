'use client';

import React, { useState, useEffect } from 'react';
import { X, ShieldCheck, AlertCircle, Camera, CreditCard } from 'lucide-react';
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
  const [nidBackDocUrl, setNidBackDocUrl] = useState(currentKyc?.nidBackDocUrl || '');
  const [selfieDocUrl, setSelfieDocUrl] = useState(currentKyc?.selfieDocUrl || '');
  const [formError, setFormError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setTradeLicenseNo(currentKyc?.tradeLicenseNo || '');
      setTradeLicenseDocUrl(currentKyc?.tradeLicenseDocUrl || '');
      setNidNumber(currentKyc?.nidNumber || '');
      setNidDocUrl(currentKyc?.nidDocUrl || '');
      setNidBackDocUrl(currentKyc?.nidBackDocUrl || '');
      setSelfieDocUrl(currentKyc?.selfieDocUrl || '');
      setFormError(null);
    }
  }, [isOpen, currentKyc]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!nidNumber.trim()) {
      setFormError('Please enter your National ID (NID) number.');
      return;
    }
    if (!nidDocUrl) {
      setFormError('Please upload a clear photo of your National ID (NID) card.');
      return;
    }
    if (!selfieDocUrl) {
      setFormError('Please upload your own photo (selfie / portrait) for identity verification.');
      return;
    }

    setFormError(null);
    onSave({
      tradeLicenseNo: tradeLicenseNo.trim(),
      tradeLicenseDocUrl,
      nidNumber: nidNumber.trim(),
      nidDocUrl,
      nidBackDocUrl,
      selfieDocUrl,
      verificationStatus: 'PENDING_REVIEW',
      submittedAt: new Date().toISOString(),
      rejectionReason: undefined,
      notes: 'NID card and owner photo submitted for KYC verification',
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-50 dark:bg-navy-950/80 backdrop-blur-sm animate-in fade-in">
      <div className="w-full max-w-xl bg-white dark:bg-navy-900 border border-slate-200 dark:border-white/10 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-slate-200 dark:border-white/10 bg-white dark:bg-navy-900/50">
          <div className="flex items-center gap-2.5">
            <div className="h-9 w-9 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
              <ShieldCheck className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-navy-900 dark:text-white">KYC Identity Verification</h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Upload your National ID card photo and your own photo for system verification
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-100 dark:bg-navy-800 transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="overflow-y-auto p-5 space-y-5 flex-1 text-xs">
          {formError && (
            <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-600 dark:text-rose-300 flex items-center gap-2 font-semibold">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>{formError}</span>
            </div>
          )}

          {/* Step 1: National ID */}
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-navy-900 dark:text-white font-bold">
              <span className="h-5 w-5 rounded-full bg-orange-600 text-white text-[10px] flex items-center justify-center">
                1
              </span>
              <CreditCard className="h-3.5 w-3.5 text-orange-500" />
              <span>National ID (NID) Card</span>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Owner National ID (NID) / Smart Card Number <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                placeholder="e.g. 19922692810000192"
                value={nidNumber}
                onChange={(e) => setNidNumber(e.target.value)}
                required
                className="w-full px-3 py-2 bg-slate-100 dark:bg-navy-800 border border-slate-200 dark:border-white/10 rounded-lg text-navy-900 dark:text-slate-200 font-mono focus:outline-none focus:ring-1 focus:ring-orange-500"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  NID Front Photo <span className="text-rose-500">*</span>
                </label>
                <DocumentUploadDropzone
                  label="Upload NID Front"
                  sublabel="Clear photo of front side"
                  accept="image/png,image/jpeg,image/webp"
                  currentUrl={nidDocUrl}
                  onUploadSuccess={(url) => setNidDocUrl(url)}
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  NID Back Photo (Optional)
                </label>
                <DocumentUploadDropzone
                  label="Upload NID Back"
                  sublabel="Clear photo of back side"
                  accept="image/png,image/jpeg,image/webp"
                  currentUrl={nidBackDocUrl}
                  onUploadSuccess={(url) => setNidBackDocUrl(url)}
                />
              </div>
            </div>
          </div>

          {/* Step 2: Owner Selfie / Own Photo */}
          <div className="pt-4 border-t border-slate-200 dark:border-white/10 space-y-3">
            <div className="flex items-center gap-2 text-navy-900 dark:text-white font-bold">
              <span className="h-5 w-5 rounded-full bg-orange-600 text-white text-[10px] flex items-center justify-center">
                2
              </span>
              <Camera className="h-3.5 w-3.5 text-orange-500" />
              <span>Your Own Photo (Selfie / Portrait)</span>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Owner Face Photo <span className="text-rose-500">*</span>
              </label>
              <DocumentUploadDropzone
                label="Upload Your Own Photo"
                sublabel="Clear, well-lit portrait photo matching your NID card"
                accept="image/png,image/jpeg,image/webp"
                currentUrl={selfieDocUrl}
                onUploadSuccess={(url) => setSelfieDocUrl(url)}
              />
            </div>
          </div>

          {/* Step 3: Optional Trade License */}
          <div className="pt-4 border-t border-slate-200 dark:border-white/10 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-navy-900 dark:text-white font-bold">
                3. Business Trade License (Optional)
              </span>
              <span className="text-[10px] text-slate-400">Optional for individual sellers</span>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Trade License Number
              </label>
              <input
                type="text"
                placeholder="e.g. TRAD/DNCC/092140/2024"
                value={tradeLicenseNo}
                onChange={(e) => setTradeLicenseNo(e.target.value)}
                className="w-full px-3 py-2 bg-slate-100 dark:bg-navy-800 border border-slate-200 dark:border-white/10 rounded-lg text-navy-900 dark:text-slate-200 font-mono focus:outline-none focus:ring-1 focus:ring-orange-500"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Trade License Document (PDF or Photo)
              </label>
              <DocumentUploadDropzone
                label="Upload Trade License"
                sublabel="Municipal corporation or union parishad trade license"
                currentUrl={tradeLicenseDocUrl}
                onUploadSuccess={(url) => setTradeLicenseDocUrl(url)}
              />
            </div>
          </div>

          {/* Footer Submit */}
          <div className="pt-4 border-t border-slate-200 dark:border-white/10 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-slate-100 dark:bg-navy-800 hover:bg-slate-200 dark:hover:bg-navy-700 text-slate-700 dark:text-slate-300 rounded-lg font-semibold transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 bg-orange-600 hover:bg-orange-500 text-white rounded-lg font-semibold transition-colors shadow-sm"
            >
              Submit KYC for Verification
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
