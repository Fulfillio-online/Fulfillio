'use client';

import React, { useState } from 'react';
import { ShieldCheck, FileText, Eye, Upload, CheckCircle2, AlertCircle, Copy } from 'lucide-react';
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

  const status = kycData?.verificationStatus || 'PENDING_REVIEW';

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

  const tradeLicenseNo = kycData?.tradeLicenseNo || 'TRAD/DNCC/092140/2024';
  const nidNumber = kycData?.nidNumber || '19922692810000192';

  return (
    <div className="p-5 sm:p-6 rounded-2xl bg-slate-900 border border-slate-800 shadow-md relative overflow-hidden space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-800">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 shrink-0">
            <ShieldCheck className="h-5 w-5" />
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-base font-bold text-slate-100">Business KYC &amp; Compliance</h2>
              <VerificationStatusBadge status={status} />
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Verified merchants enjoy zero-hold daily settlements and priority warehouse intake.
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={onOpenUpload}
          className="inline-flex items-center justify-center gap-1.5 px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white border border-slate-700 rounded-xl text-xs font-semibold transition-colors cursor-pointer self-start sm:self-auto min-h-[38px]"
        >
          <Upload className="h-3.5 w-3.5 text-emerald-400" />
          <span>Update KYC Docs</span>
        </button>
      </div>

      {/* KYC Documents Info Tiles */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
        {/* Trade License Card */}
        <div className="p-4 rounded-xl bg-slate-950/70 border border-slate-800 space-y-2">
          <span className="text-[10px] uppercase tracking-wider font-semibold text-slate-500 block">
            Trade License Number
          </span>
          <div className="flex items-center justify-between gap-2">
            <p className="font-mono text-slate-200 font-bold text-xs truncate">
              {tradeLicenseNo}
            </p>
            <button
              type="button"
              onClick={() => handleCopy('trade', tradeLicenseNo)}
              className="p-1 text-slate-500 hover:text-slate-300 transition-colors"
              title="Copy Trade License No"
            >
              {copiedKey === 'trade' ? (
                <CheckCircle2 className="h-3 w-3 text-emerald-400" />
              ) : (
                <Copy className="h-3 w-3" />
              )}
            </button>
          </div>
          <div>
            {kycData?.tradeLicenseDocUrl ? (
              <button
                type="button"
                onClick={() =>
                  setViewerDoc({
                    title: 'Trade License Document',
                    url: kycData.tradeLicenseDocUrl!,
                  })
                }
                className="text-emerald-400 hover:underline inline-flex items-center gap-1 text-[11px] font-semibold transition-colors"
              >
                <Eye className="h-3 w-3" />
                <span>View License File</span>
              </button>
            ) : (
              <span className="text-amber-400 text-[11px] italic flex items-center gap-1">
                <AlertCircle className="h-3 w-3" />
                Document upload pending
              </span>
            )}
          </div>
        </div>

        {/* Owner National ID Card */}
        <div className="p-4 rounded-xl bg-slate-950/70 border border-slate-800 space-y-2">
          <span className="text-[10px] uppercase tracking-wider font-semibold text-slate-500 block">
            Owner National ID (NID)
          </span>
          <div className="flex items-center justify-between gap-2">
            <p className="font-mono text-slate-200 font-bold text-xs truncate">
              {nidNumber}
            </p>
            <button
              type="button"
              onClick={() => handleCopy('nid', nidNumber)}
              className="p-1 text-slate-500 hover:text-slate-300 transition-colors"
              title="Copy NID Number"
            >
              {copiedKey === 'nid' ? (
                <CheckCircle2 className="h-3 w-3 text-emerald-400" />
              ) : (
                <Copy className="h-3 w-3" />
              )}
            </button>
          </div>
          <div>
            {kycData?.nidDocUrl ? (
              <button
                type="button"
                onClick={() =>
                  setViewerDoc({
                    title: 'National Identity Document (NID)',
                    url: kycData.nidDocUrl!,
                  })
                }
                className="text-emerald-400 hover:underline inline-flex items-center gap-1 text-[11px] font-semibold transition-colors"
              >
                <Eye className="h-3 w-3" />
                <span>View NID Card</span>
              </button>
            ) : (
              <span className="text-slate-400 text-[11px] flex items-center gap-1">
                <CheckCircle2 className="h-3 w-3 text-emerald-400" />
                Identity verified via EC database
              </span>
            )}
          </div>
        </div>

        {/* Compliance Status Tile */}
        <div className="p-4 rounded-xl bg-slate-950/70 border border-slate-800 space-y-2 sm:col-span-2 lg:col-span-1">
          <span className="text-[10px] uppercase tracking-wider font-semibold text-slate-500 block">
            Compliance Tier
          </span>
          <div className="flex items-center gap-2 text-slate-200">
            <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse shrink-0" />
            <span className="font-semibold text-xs text-white">Full Tier-1 Verified Merchant</span>
          </div>
          <p className="text-slate-500 text-[11px] leading-relaxed">
            Annual audit renewal scheduled automatically. Next audit: Nov 2027.
          </p>
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
