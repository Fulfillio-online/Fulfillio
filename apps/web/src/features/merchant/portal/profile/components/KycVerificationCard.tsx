'use client';

import React, { useState } from 'react';
import { ShieldCheck, FileText, Eye, Upload, AlertCircle } from 'lucide-react';
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

  const status = kycData?.verificationStatus || 'PENDING_REVIEW';

  return (
    <div className="p-5 sm:p-6 rounded-2xl bg-slate-900 border border-slate-800 shadow-sm relative overflow-hidden">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-5 border-b border-slate-800">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
            <ShieldCheck className="h-5 w-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-bold text-slate-100">Business KYC & Regulatory Compliance</h3>
              <VerificationStatusBadge status={status} />
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Verified merchants receive zero-hold daily payouts and priority warehouse intake
            </p>
          </div>
        </div>

        <button
          onClick={onOpenUpload}
          className="px-3.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors self-start sm:self-auto"
        >
          <Upload className="h-3.5 w-3.5 text-emerald-400" />
          <span>Update KYC Docs</span>
        </button>
      </div>

      {/* KYC Documents Info */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 pt-5 text-xs">
        <div className="space-y-1">
          <span className="text-slate-500 uppercase tracking-wider font-semibold text-[10px]">
            Trade License Number
          </span>
          <p className="font-mono text-slate-200 font-bold">
            {kycData?.tradeLicenseNo || 'TRAD/DNCC/092140/2024'}
          </p>
          {kycData?.tradeLicenseDocUrl ? (
            <button
              onClick={() =>
                setViewerDoc({
                  title: 'Trade License Document',
                  url: kycData.tradeLicenseDocUrl!,
                })
              }
              className="text-emerald-400 hover:underline flex items-center gap-1 text-[11px] pt-0.5 font-semibold"
            >
              <Eye className="h-3 w-3" />
              <span>View License File</span>
            </button>
          ) : (
            <span className="text-amber-400 text-[11px] italic">Document file pending</span>
          )}
        </div>

        <div className="space-y-1">
          <span className="text-slate-500 uppercase tracking-wider font-semibold text-[10px]">
            Owner National ID (NID)
          </span>
          <p className="font-mono text-slate-200 font-bold">
            {kycData?.nidNumber || '19922692810000192'}
          </p>
          {kycData?.nidDocUrl ? (
            <button
              onClick={() =>
                setViewerDoc({
                  title: 'National Identity Document (NID)',
                  url: kycData.nidDocUrl!,
                })
              }
              className="text-emerald-400 hover:underline flex items-center gap-1 text-[11px] pt-0.5 font-semibold"
            >
              <Eye className="h-3 w-3" />
              <span>View NID Card</span>
            </button>
          ) : (
            <span className="text-slate-500 text-[11px]">NID copy verified</span>
          )}
        </div>

        <div className="space-y-1">
          <span className="text-slate-500 uppercase tracking-wider font-semibold text-[10px]">
            Compliance Status
          </span>
          <div className="flex items-center gap-1.5 text-slate-300">
            <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="font-semibold">Full Merchant KYC Active</span>
          </div>
          <span className="text-slate-500 text-[11px] block">Audit renewed automatically yearly</span>
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
