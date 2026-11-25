'use client';

import React, { useState } from 'react';
import {
  ShieldCheck,
  Eye,
  Upload,
  CheckCircle2,
  AlertCircle,
  Copy,
  Clock,
  Camera,
  XCircle,
} from 'lucide-react';
import { KycDocumentData } from '../types';
import { VerificationStatusBadge, DocumentViewerModal } from '@/components/ui';

interface KycVerificationCardProps {
  kycData?: KycDocumentData;
  onOpenUpload: () => void;
}

export function KycVerificationCard({
  kycData,
  onOpenUpload,
}: KycVerificationCardProps) {
  const [viewerDoc, setViewerDoc] = useState<{ title: string; url: string } | null>(null);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const hasRequiredDocs = Boolean(
    kycData?.nidDocUrl?.trim() && kycData?.selfieDocUrl?.trim(),
  );
  const status =
    kycData?.verificationStatus === 'VERIFIED'
      ? 'VERIFIED'
      : kycData?.verificationStatus === 'REJECTED'
        ? 'REJECTED'
        : hasRequiredDocs
          ? kycData?.verificationStatus || 'PENDING_REVIEW'
          : 'UNVERIFIED';

  const handleCopy = async (key: string, text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedKey(key);
      setTimeout(() => setCopiedKey(null), 2000);
    } catch {
      setCopiedKey(key);
      setTimeout(() => setCopiedKey(null), 2000);
    }
  };

  const tradeLicenseNo = kycData?.tradeLicenseNo?.trim() || '';
  const nidNumber = kycData?.nidNumber?.trim() || '';

  return (
    <div className="p-5 sm:p-6 rounded-2xl bg-white dark:bg-navy-900 border border-slate-200/80 dark:border-white/10 shadow-md relative overflow-hidden space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-200/80 dark:border-white/10">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 shrink-0">
            <ShieldCheck className="h-5 w-5" />
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-base font-bold text-navy-900 dark:text-white">Business KYC &amp; Compliance</h2>
              <VerificationStatusBadge status={status} />
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Upload your National ID card photo and your own photo to complete identity verification.
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={onOpenUpload}
          className="inline-flex items-center justify-center gap-1.5 px-3.5 py-2 bg-slate-100 dark:bg-navy-800 hover:bg-slate-200 dark:hover:bg-navy-700 text-navy-900 dark:text-slate-200 hover:text-white border border-slate-200 dark:border-white/10 rounded-xl text-xs font-semibold transition-colors cursor-pointer self-start sm:self-auto min-h-[38px]"
        >
          <Upload className="h-3.5 w-3.5 text-emerald-400" />
          <span>{hasRequiredDocs ? 'Update KYC Docs' : 'Submit KYC Docs'}</span>
        </button>
      </div>

      {/* Status Guidance Banner */}
      {status === 'UNVERIFIED' && (
        <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-start gap-2.5 text-xs">
          <AlertCircle className="h-4 w-4 text-amber-500 shrink-0 mt-0.5" />
          <div>
            <p className="font-bold text-amber-800 dark:text-amber-200">
              KYC Verification Required
            </p>
            <p className="text-amber-700/90 dark:text-amber-300/80 mt-0.5">
              Please upload your National ID (NID) card photo and your own photo (selfie). After submission, the system/admin will review and verify your KYC.
            </p>
          </div>
        </div>
      )}

      {status === 'PENDING_REVIEW' && (
        <div className="p-3.5 rounded-xl bg-sky-500/10 border border-sky-500/30 flex items-start gap-2.5 text-xs">
          <Clock className="h-4 w-4 text-sky-400 shrink-0 mt-0.5" />
          <div>
            <p className="font-bold text-sky-800 dark:text-sky-200">
              KYC Under Review
            </p>
            <p className="text-sky-700/90 dark:text-sky-300/80 mt-0.5">
              Your NID card and photo have been submitted. Your KYC status will become Verified once reviewed and approved in the system.
            </p>
          </div>
        </div>
      )}

      {status === 'VERIFIED' && (
        <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-start gap-2.5 text-xs">
          <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0 mt-0.5" />
          <div>
            <p className="font-bold text-emerald-800 dark:text-emerald-200">
              KYC Verified Successfully
            </p>
            <p className="text-emerald-700/90 dark:text-emerald-300/80 mt-0.5">
              Your National ID card and owner photo have been verified by the system.
              {kycData?.verifiedAt
                ? ` Verified on ${new Date(kycData.verifiedAt).toLocaleDateString()}.`
                : ''}
            </p>
          </div>
        </div>
      )}

      {status === 'REJECTED' && (
        <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 flex items-start gap-2.5 text-xs">
          <XCircle className="h-4 w-4 text-rose-500 shrink-0 mt-0.5" />
          <div>
            <p className="font-bold text-rose-800 dark:text-rose-200">
              KYC Verification Rejected
            </p>
            <p className="text-rose-700/90 dark:text-rose-300/80 mt-0.5">
              {kycData?.rejectionReason || 'Submitted documents could not be verified. Please re-upload clear photos of your NID and yourself.'}
            </p>
          </div>
        </div>
      )}

      {/* KYC Documents Info Tiles */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
        {/* Owner National ID Card */}
        <div className="p-4 rounded-xl bg-slate-50 dark:bg-navy-950/70 border border-slate-200/80 dark:border-white/10 space-y-2">
          <span className="text-[10px] uppercase tracking-wider font-semibold text-slate-500 block">
            Owner National ID (NID)
          </span>
          <div className="flex items-center justify-between gap-2">
            <p className="font-mono text-navy-900 dark:text-slate-200 font-bold text-xs truncate">
              {nidNumber || 'Not submitted'}
            </p>
            {nidNumber && (
              <button
                type="button"
                onClick={() => handleCopy('nid', nidNumber)}
                className="p-1 text-slate-500 hover:text-slate-700 dark:text-slate-300 transition-colors"
                title="Copy NID Number"
              >
                {copiedKey === 'nid' ? (
                  <CheckCircle2 className="h-3 w-3 text-emerald-400" />
                ) : (
                  <Copy className="h-3 w-3" />
                )}
              </button>
            )}
          </div>
          <div className="flex flex-wrap items-center gap-3">
            {kycData?.nidDocUrl ? (
              <button
                type="button"
                onClick={() =>
                  setViewerDoc({
                    title: 'National Identity Document (NID Front)',
                    url: kycData.nidDocUrl!,
                  })
                }
                className="text-emerald-400 hover:underline inline-flex items-center gap-1 text-[11px] font-semibold transition-colors"
              >
                <Eye className="h-3 w-3" />
                <span>View NID Front</span>
              </button>
            ) : (
              <span className="text-amber-400 text-[11px] italic flex items-center gap-1">
                <AlertCircle className="h-3 w-3" />
                NID card upload pending
              </span>
            )}
            {kycData?.nidBackDocUrl && (
              <button
                type="button"
                onClick={() =>
                  setViewerDoc({
                    title: 'National Identity Document (NID Back)',
                    url: kycData.nidBackDocUrl!,
                  })
                }
                className="text-emerald-400 hover:underline inline-flex items-center gap-1 text-[11px] font-semibold transition-colors"
              >
                <Eye className="h-3 w-3" />
                <span>View NID Back</span>
              </button>
            )}
          </div>
        </div>

        {/* Owner Photo (Selfie) Card */}
        <div className="p-4 rounded-xl bg-slate-50 dark:bg-navy-950/70 border border-slate-200/80 dark:border-white/10 space-y-2">
          <span className="text-[10px] uppercase tracking-wider font-semibold text-slate-500 block">
            Owner Photo (Selfie)
          </span>
          <div className="flex items-center gap-2">
            <Camera className="h-3.5 w-3.5 text-slate-400 shrink-0" />
            <p className="text-navy-900 dark:text-slate-200 font-bold text-xs truncate">
              {kycData?.selfieDocUrl ? 'Photo Uploaded' : 'Not uploaded'}
            </p>
          </div>
          <div>
            {kycData?.selfieDocUrl ? (
              <button
                type="button"
                onClick={() =>
                  setViewerDoc({
                    title: 'Merchant Owner Photo (Selfie)',
                    url: kycData.selfieDocUrl!,
                  })
                }
                className="text-emerald-400 hover:underline inline-flex items-center gap-1 text-[11px] font-semibold transition-colors"
              >
                <Eye className="h-3 w-3" />
                <span>View Owner Photo</span>
              </button>
            ) : (
              <span className="text-amber-400 text-[11px] italic flex items-center gap-1">
                <AlertCircle className="h-3 w-3" />
                Owner photo upload pending
              </span>
            )}
          </div>
        </div>

        {/* Compliance & Trade License Tile */}
        <div className="p-4 rounded-xl bg-slate-50 dark:bg-navy-950/70 border border-slate-200/80 dark:border-white/10 space-y-2 sm:col-span-2 lg:col-span-1">
          <span className="text-[10px] uppercase tracking-wider font-semibold text-slate-500 block">
            Compliance Status
          </span>
          <div className="flex items-center gap-2 text-navy-900 dark:text-slate-200">
            <span
              className={`h-2 w-2 rounded-full shrink-0 ${
                status === 'VERIFIED'
                  ? 'bg-emerald-400 animate-pulse'
                  : status === 'PENDING_REVIEW'
                    ? 'bg-amber-400 animate-pulse'
                    : status === 'REJECTED'
                      ? 'bg-rose-400'
                      : 'bg-slate-400'
              }`}
            />
            <span className="font-semibold text-xs text-navy-900 dark:text-white">
              {status === 'VERIFIED'
                ? 'Verified Merchant (KYC Approved)'
                : status === 'PENDING_REVIEW'
                  ? 'Pending System Verification'
                  : status === 'REJECTED'
                    ? 'Verification Rejected'
                    : 'Unverified — Docs Required'}
            </span>
          </div>
          {tradeLicenseNo ? (
            <div className="flex items-center justify-between gap-2 pt-0.5">
              <span className="text-[11px] font-mono text-slate-500 dark:text-slate-400 truncate">
                TL: {tradeLicenseNo}
              </span>
              {kycData?.tradeLicenseDocUrl && (
                <button
                  type="button"
                  onClick={() =>
                    setViewerDoc({
                      title: 'Trade License Document',
                      url: kycData.tradeLicenseDocUrl!,
                    })
                  }
                  className="text-emerald-400 hover:underline inline-flex items-center gap-1 text-[11px] font-semibold shrink-0"
                >
                  <Eye className="h-3 w-3" />
                  <span>View</span>
                </button>
              )}
            </div>
          ) : (
            <p className="text-slate-500 text-[11px] leading-relaxed">
              {status === 'VERIFIED' && kycData?.verifiedAt
                ? `Verified on ${new Date(kycData.verifiedAt).toLocaleDateString()}`
                : 'Trade license is optional.'}
            </p>
          )}
        </div>
      </div>

      {/* Viewer Modal */}
      {viewerDoc && (
        <DocumentViewerModal
          isOpen={Boolean(viewerDoc)}
          onClose={() => setViewerDoc(null)}
          title={viewerDoc.title}
          documentUrl={viewerDoc.url}
        />
      )}
    </div>
  );
}
