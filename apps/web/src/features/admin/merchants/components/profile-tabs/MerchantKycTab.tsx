import React, { useState } from 'react';
import {
  ShieldCheck,
  CheckCircle2,
  XCircle,
  Clock,
  AlertTriangle,
  Eye,
  CreditCard,
  Camera,
  FileText,
} from 'lucide-react';
import { Modal } from '@/components/admin/AdminModal';
import { MerchantRecord } from '../../types';

export interface MerchantKycTabProps {
  merchant: MerchantRecord;
  onApproveKyc?: () => void;
  onRejectKyc?: (reason?: string) => void;
}

export function MerchantKycTab({
  merchant,
  onApproveKyc,
  onRejectKyc,
}: MerchantKycTabProps) {
  const [previewDoc, setPreviewDoc] = useState<{ title: string; url: string } | null>(null);
  const [showRejectInput, setShowRejectInput] = useState(false);
  const [rejectReason, setRejectReason] = useState('');

  const kyc = merchant.kycData;
  const hasRequiredDocs = Boolean(
    kyc?.nidDocUrl?.trim() && kyc?.selfieDocUrl?.trim(),
  );
  const kycStatus = hasRequiredDocs
    ? kyc?.verificationStatus || 'PENDING_REVIEW'
    : kyc?.verificationStatus === 'REJECTED'
      ? 'REJECTED'
      : 'UNVERIFIED';

  const isPending = kycStatus === 'PENDING_REVIEW';
  const isVerified = kycStatus === 'VERIFIED';
  const isRejected = kycStatus === 'REJECTED';
  const isUnverified = kycStatus === 'UNVERIFIED';

  return (
    <div className="space-y-5">
      {/* Unverified Banner */}
      {isUnverified && (
        <div className="rounded-2xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-navy-900/60 p-4 sm:p-5 flex items-start gap-3">
          <div className="h-10 w-10 rounded-xl bg-slate-200/70 dark:bg-navy-800 border border-slate-300/70 dark:border-white/10 flex items-center justify-center text-slate-600 dark:text-slate-300 shrink-0">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <h4 className="text-sm font-bold text-navy-900 dark:text-white">
              KYC Documents Not Submitted Yet
            </h4>
            <p className="text-xs text-slate-600 dark:text-slate-300 mt-0.5 leading-relaxed">
              This merchant has not uploaded their National ID (NID) card photo and own photo yet. Once submitted from their portal, you can review and verify their identity here.
            </p>
          </div>
        </div>
      )}

      {/* Pending Approval Banner */}
      {isPending && (
        <div className="rounded-2xl border border-amber-500/30 bg-amber-500/10 p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="h-10 w-10 rounded-xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-amber-600 dark:text-amber-400 shrink-0">
              <Clock className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-amber-900 dark:text-amber-200">
                KYC Identity Verification Pending Review
              </h4>
              <p className="text-xs text-amber-800/80 dark:text-amber-300/80 mt-0.5 leading-relaxed">
                Compare the uploaded National ID (NID) card photo with the owner&apos;s selfie photo before approving KYC verification.
              </p>
            </div>
          </div>
          {(onApproveKyc || onRejectKyc) && (
            <div className="flex items-center gap-2 shrink-0 flex-wrap">
              {onApproveKyc && (
                <button
                  type="button"
                  onClick={onApproveKyc}
                  className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center gap-1.5 shadow-md shadow-emerald-500/20 transition-all cursor-pointer"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Approve KYC</span>
                </button>
              )}
              {onRejectKyc && (
                <button
                  type="button"
                  onClick={() => setShowRejectInput((prev) => !prev)}
                  className="px-3.5 py-2 rounded-xl bg-rose-500/15 hover:bg-rose-500/25 border border-rose-500/30 text-rose-700 dark:text-rose-300 text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  <XCircle className="w-4 h-4" />
                  <span>Reject</span>
                </button>
              )}
            </div>
          )}
        </div>
      )}

      {/* Verified Banner */}
      {isVerified && (
        <div className="rounded-2xl border border-emerald-500/30 bg-emerald-500/10 p-4 flex items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" />
            <div>
              <h4 className="text-sm font-bold text-emerald-900 dark:text-emerald-200">
                KYC Identity Verified
              </h4>
              <p className="text-xs text-emerald-800/80 dark:text-emerald-300/80 mt-0.5">
                {kyc?.verifiedAt
                  ? `Verified on ${new Date(kyc.verifiedAt).toLocaleDateString()}`
                  : 'Merchant NID and owner photo verified.'}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Rejected Banner */}
      {isRejected && (
        <div className="rounded-2xl border border-rose-500/30 bg-rose-500/10 p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-rose-500 shrink-0 mt-0.5" />
            <div>
              <h4 className="text-sm font-bold text-rose-800 dark:text-rose-200">
                KYC Verification Rejected
              </h4>
              <p className="text-xs text-rose-700/80 dark:text-rose-300/80 mt-0.5">
                {kyc?.rejectionReason || 'Merchant must resubmit clear NID card and selfie photos.'}
              </p>
            </div>
          </div>
          {onApproveKyc && hasRequiredDocs && (
            <button
              type="button"
              onClick={onApproveKyc}
              className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer shrink-0"
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Approve Anyway</span>
            </button>
          )}
        </div>
      )}

      {/* Rejection Reason Input */}
      {showRejectInput && onRejectKyc && (
        <div className="rounded-2xl border border-rose-500/30 bg-white dark:bg-navy-900 p-4 space-y-3">
          <label className="block text-xs font-bold text-navy-800 dark:text-white">
            Rejection Reason (shown to merchant)
          </label>
          <div className="flex flex-col sm:flex-row gap-2">
            <input
              type="text"
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              placeholder="e.g. NID photo is blurry or does not match owner photo"
              className="flex-1 rounded-xl border border-slate-300 dark:border-white/15 bg-slate-50 dark:bg-navy-950 px-3.5 py-2 text-xs text-navy-900 dark:text-white focus:outline-none focus:border-rose-500"
            />
            <button
              type="button"
              onClick={() => {
                onRejectKyc(rejectReason.trim() || undefined);
                setShowRejectInput(false);
                setRejectReason('');
              }}
              className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold cursor-pointer shrink-0"
            >
              Confirm Rejection
            </button>
          </div>
        </div>
      )}

      {/* Uploaded KYC Documents Grid */}
      <div className="rounded-2xl border border-slate-200 dark:border-white/10 bg-white/80 dark:bg-navy-900/80 p-6 space-y-5 shadow-xl">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* NID Card */}
          <div className="p-4 rounded-xl bg-slate-50 dark:bg-navy-950/70 border border-slate-200 dark:border-white/10 space-y-2.5">
            <div className="flex items-center gap-2 text-xs font-bold text-navy-800 dark:text-white">
              <CreditCard className="w-4 h-4 text-orange-500" />
              <span>National ID (NID)</span>
            </div>
            <p className="font-mono text-xs text-slate-700 dark:text-slate-300">
              {kyc?.nidNumber || 'Not provided'}
            </p>
            <div className="flex flex-wrap gap-2">
              {kyc?.nidDocUrl ? (
                <button
                  type="button"
                  onClick={() =>
                    setPreviewDoc({ title: 'NID Card Front Photo', url: kyc.nidDocUrl! })
                  }
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-xs font-semibold cursor-pointer"
                >
                  <Eye className="w-3.5 h-3.5" />
                  <span>View NID Front</span>
                </button>
              ) : (
                <span className="text-xs text-amber-500 italic">Front photo missing</span>
              )}
              {kyc?.nidBackDocUrl && (
                <button
                  type="button"
                  onClick={() =>
                    setPreviewDoc({ title: 'NID Card Back Photo', url: kyc.nidBackDocUrl! })
                  }
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-xs font-semibold cursor-pointer"
                >
                  <Eye className="w-3.5 h-3.5" />
                  <span>View NID Back</span>
                </button>
              )}
            </div>
          </div>

          {/* Owner Photo (Selfie) */}
          <div className="p-4 rounded-xl bg-slate-50 dark:bg-navy-950/70 border border-slate-200 dark:border-white/10 space-y-2.5">
            <div className="flex items-center gap-2 text-xs font-bold text-navy-800 dark:text-white">
              <Camera className="w-4 h-4 text-orange-500" />
              <span>Owner Photo (Selfie)</span>
            </div>
            <p className="text-xs text-slate-600 dark:text-slate-300">
              {kyc?.selfieDocUrl ? 'Portrait uploaded for face match' : 'Not uploaded'}
            </p>
            {kyc?.selfieDocUrl ? (
              <button
                type="button"
                onClick={() =>
                  setPreviewDoc({ title: 'Owner Photo (Selfie)', url: kyc.selfieDocUrl! })
                }
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-xs font-semibold cursor-pointer"
              >
                <Eye className="w-3.5 h-3.5" />
                <span>View Owner Photo</span>
              </button>
            ) : (
              <span className="text-xs text-amber-500 italic">Owner photo missing</span>
            )}
          </div>

          {/* Trade License */}
          <div className="p-4 rounded-xl bg-slate-50 dark:bg-navy-950/70 border border-slate-200 dark:border-white/10 space-y-2.5">
            <div className="flex items-center gap-2 text-xs font-bold text-navy-800 dark:text-white">
              <FileText className="w-4 h-4 text-orange-500" />
              <span>Trade License (Optional)</span>
            </div>
            <p className="font-mono text-xs text-slate-700 dark:text-slate-300">
              {kyc?.tradeLicenseNo || 'Not provided'}
            </p>
            {kyc?.tradeLicenseDocUrl ? (
              <button
                type="button"
                onClick={() =>
                  setPreviewDoc({
                    title: 'Trade License Document',
                    url: kyc.tradeLicenseDocUrl!,
                  })
                }
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-xs font-semibold cursor-pointer"
              >
                <Eye className="w-3.5 h-3.5" />
                <span>View License</span>
              </button>
            ) : (
              <span className="text-xs text-slate-400 italic">No file uploaded</span>
            )}
          </div>
        </div>
      </div>

      {/* Document Preview Modal */}
      {previewDoc && (
        <Modal
          isOpen={Boolean(previewDoc)}
          onClose={() => setPreviewDoc(null)}
          title={previewDoc.title}
        >
          <div className="p-4 flex items-center justify-center bg-slate-100 dark:bg-navy-950 rounded-xl">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={previewDoc.url}
              alt={previewDoc.title}
              className="max-h-[70vh] max-w-full rounded-lg object-contain"
            />
          </div>
        </Modal>
      )}
    </div>
  );
}
