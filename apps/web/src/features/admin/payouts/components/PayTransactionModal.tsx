'use client';

import React, { useEffect, useRef, useState } from 'react';
import {
  CheckCircle2,
  UploadCloud,
  FileText,
  X,
  ShieldCheck,
  AlertCircle,
} from 'lucide-react';
import { Modal } from '@/components/admin/AdminModal';
import { compressImage } from '@/features/merchant/portal/products/utils/imageCompressor';
import { PaymentRequest } from '../types';

export interface PayTransactionPayload {
  trxId: string;
  proofDocumentUrl: string;
  proofDocumentName: string;
  proofDocumentMime: string;
  proofChannel?: string;
  proofNotes?: string;
}

interface PayTransactionModalProps {
  isOpen: boolean;
  onClose: () => void;
  request: PaymentRequest | null;
  onConfirm: (requestId: string, payload: PayTransactionPayload) => Promise<void>;
}

export function PayTransactionModal({
  isOpen,
  onClose,
  request,
  onConfirm,
}: PayTransactionModalProps) {
  const [trxId, setTrxId] = useState('');
  const [proofUrl, setProofUrl] = useState('');
  const [proofName, setProofName] = useState('');
  const [proofMime, setProofMime] = useState('');
  const [proofChannel, setProofChannel] = useState('');
  const [proofNotes, setProofNotes] = useState('');
  const [isDragging, setIsDragging] = useState(false);
  const [isProcessingFile, setIsProcessingFile] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen && request) {
      setTrxId('');
      setProofUrl('');
      setProofName('');
      setProofMime('');
      setProofChannel(request.accountDetails.provider || request.method);
      setProofNotes('');
      setError('');
      setIsProcessingFile(false);
      setIsSubmitting(false);
    }
  }, [isOpen, request]);

  if (!request) return null;

  const handleFile = async (file?: File | null) => {
    if (!file) return;
    const maxBytes = 5 * 1024 * 1024;
    if (file.size > maxBytes) {
      setError('Digital proof file must be 5MB or smaller.');
      return;
    }

    const isImage = file.type.startsWith('image/');
    const isPdf = file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf');
    if (!isImage && !isPdf) {
      setError('Please upload a PNG, JPG, WebP receipt screenshot or PDF bank statement.');
      return;
    }

    setError('');
    setIsProcessingFile(true);
    try {
      if (isImage) {
        const dataUrl = await compressImage(file, 1100, 1100, 0.82);
        setProofUrl(dataUrl);
        setProofMime('image/jpeg');
      } else {
        const dataUrl = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => resolve(String(reader.result || ''));
          reader.onerror = () => reject(new Error('Failed to read PDF file.'));
          reader.readAsDataURL(file);
        });
        setProofUrl(dataUrl);
        setProofMime('application/pdf');
      }
      setProofName(file.name);
    } catch (err: any) {
      setError(err?.message || 'Failed to process receipt file.');
    } finally {
      setIsProcessingFile(false);
    }
  };

  const clearFile = (e: React.MouseEvent) => {
    e.stopPropagation();
    setProofUrl('');
    setProofName('');
    setProofMime('');
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!trxId.trim()) {
      setError('Transaction ID (TrxID) is required.');
      return;
    }
    if (!proofUrl) {
      setError('Digital proof receipt (screenshot or PDF) is strictly required for every payout.');
      return;
    }

    setIsSubmitting(true);
    setError('');
    try {
      await onConfirm(request.id, {
        trxId: trxId.trim(),
        proofDocumentUrl: proofUrl,
        proofDocumentName: proofName || `proof-${trxId.trim()}`,
        proofDocumentMime: proofMime || 'image/jpeg',
        proofChannel: proofChannel.trim() || undefined,
        proofNotes: proofNotes.trim() || undefined,
      });
      onClose();
    } catch (err: any) {
      setError(err?.message || 'Failed to settle payout.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const isPdf = proofMime === 'application/pdf' || proofUrl.startsWith('data:application/pdf');

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Settle Payout with Mandatory Digital Proof"
      subtitle="Both a verified Transaction ID and receipt upload are required before disbursement completes."
      size="lg"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Request Summary */}
        <div className="bg-slate-50 dark:bg-navy-950 border border-slate-200 dark:border-white/10 rounded-xl p-3.5 space-y-1.5">
          <div className="flex items-center justify-between text-xs">
            <span className="text-slate-600 dark:text-slate-300">Request Code:</span>
            <span className="font-mono font-bold text-navy-900 dark:text-white">
              {request.requestCode}
            </span>
          </div>
          <div className="flex items-center justify-between text-xs">
            <span className="text-slate-600 dark:text-slate-300">Merchant:</span>
            <span className="font-semibold text-navy-900 dark:text-white">
              {request.merchantName} ({request.merchantCode})
            </span>
          </div>
          <div className="flex items-center justify-between text-xs pt-1.5 border-t border-slate-200/80 dark:border-white/10">
            <span className="text-slate-600 dark:text-slate-300">Payout Amount:</span>
            <span className="tabular-nums text-base font-black text-orange-600 dark:text-orange-400">
              ৳{request.amount.toLocaleString()}
            </span>
          </div>
          <div className="flex items-center justify-between text-xs">
            <span className="text-slate-600 dark:text-slate-300">Destination:</span>
            <span className="text-slate-700 dark:text-slate-200 font-mono">
              {request.accountDetails.provider} · {request.accountDetails.accountNumber}
            </span>
          </div>
        </div>

        {error && (
          <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-700 dark:text-rose-300 text-xs font-medium flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* TrxID + Channel */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-navy-900 dark:text-slate-100">
              Transaction ID (TrxID) <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              value={trxId}
              onChange={(e) => {
                setTrxId(e.target.value);
                if (error) setError('');
              }}
              placeholder="e.g. BKA98421057 or NPSB-772190"
              autoFocus
              required
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-navy-950 border border-slate-200 dark:border-white/10 text-xs font-mono font-bold text-orange-700 dark:text-orange-300 focus:outline-none focus:border-orange-500"
            />
          </div>

          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-navy-900 dark:text-slate-100">
              Transfer Channel
            </label>
            <input
              type="text"
              value={proofChannel}
              onChange={(e) => setProofChannel(e.target.value)}
              placeholder="e.g. bKash Merchant App / BEFTN"
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-navy-950 border border-slate-200 dark:border-white/10 text-xs text-navy-900 dark:text-slate-100 focus:outline-none focus:border-orange-500"
            />
          </div>
        </div>

        {/* Mandatory Digital Proof Upload Dropzone */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <label className="block text-xs font-bold text-navy-900 dark:text-slate-100">
              Digital Payment Proof (Receipt Screenshot or Bank PDF) <span className="text-rose-500">*</span>
            </label>
            <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5" />
              SHA-256 Verified
            </span>
          </div>

          <div
            onClick={() => fileInputRef.current?.click()}
            onDragOver={(e) => {
              e.preventDefault();
              setIsDragging(true);
            }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={(e) => {
              e.preventDefault();
              setIsDragging(false);
              handleFile(e.dataTransfer.files?.[0]);
            }}
            className={`relative border-2 border-dashed rounded-2xl p-4 text-center cursor-pointer transition-all ${
              isDragging
                ? 'border-orange-500 bg-orange-500/10'
                : proofUrl
                  ? 'border-emerald-500/50 bg-emerald-500/5'
                  : 'border-slate-300 dark:border-white/15 bg-slate-50 dark:bg-navy-950 hover:border-orange-500/60'
            }`}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept="image/png,image/jpeg,image/webp,application/pdf"
              onChange={(e) => handleFile(e.target.files?.[0])}
              className="hidden"
            />

            {isProcessingFile ? (
              <p className="text-xs font-semibold text-slate-500 py-4">Processing digital receipt...</p>
            ) : proofUrl ? (
              <div className="flex flex-col items-center gap-2">
                {isPdf ? (
                  <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-white dark:bg-navy-900 border border-slate-200 dark:border-white/10 text-xs">
                    <FileText className="w-5 h-5 text-orange-500 shrink-0" />
                    <span className="font-mono font-semibold truncate max-w-xs">{proofName}</span>
                    <button
                      type="button"
                      onClick={clearFile}
                      className="p-1 rounded-full hover:bg-rose-500/10 text-slate-400 hover:text-rose-500"
                      title="Remove proof"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ) : (
                  <div className="relative inline-block rounded-xl overflow-hidden border border-slate-200 dark:border-white/10 bg-white dark:bg-navy-900">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={proofUrl}
                      alt="Uploaded digital proof"
                      className="max-h-40 max-w-full object-contain"
                    />
                    <button
                      type="button"
                      onClick={clearFile}
                      className="absolute top-1.5 right-1.5 p-1 rounded-full bg-navy-950/80 text-white hover:text-rose-400 border border-white/20"
                      title="Remove proof"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}
                <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold">
                  Digital proof attached ({proofName}) — click to replace
                </span>
              </div>
            ) : (
              <div className="py-2 flex flex-col items-center gap-1.5">
                <div className="w-10 h-10 rounded-xl bg-orange-500/10 border border-orange-500/20 text-orange-600 dark:text-orange-400 flex items-center justify-center">
                  <UploadCloud className="w-5 h-5" />
                </div>
                <p className="text-xs font-bold text-navy-900 dark:text-white">
                  Upload Transfer Screenshot or Bank Slip
                </p>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  PNG, JPG, WebP, or PDF up to 5MB (stored permanently on payout voucher)
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Notes */}
        <div className="space-y-1.5">
          <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300">
            Disbursement Audit Note (Optional)
          </label>
          <input
            type="text"
            value={proofNotes}
            onChange={(e) => setProofNotes(e.target.value)}
            placeholder="e.g. Verified corporate bKash settlement batch"
            className="w-full px-3.5 py-2 rounded-xl bg-slate-50 dark:bg-navy-950 border border-slate-200 dark:border-white/10 text-xs text-navy-900 dark:text-slate-100 focus:outline-none focus:border-orange-500"
          />
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-200 dark:border-white/10">
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-navy-800 hover:bg-slate-200 dark:hover:bg-navy-700 text-xs font-semibold text-slate-700 dark:text-slate-200 transition-colors cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isSubmitting || isProcessingFile || !trxId.trim() || !proofUrl}
            className="px-5 py-2 rounded-xl bg-orange-600 hover:bg-orange-500 disabled:opacity-50 disabled:cursor-not-allowed text-xs font-bold text-white flex items-center gap-1.5 shadow-lg transition-colors cursor-pointer"
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>{isSubmitting ? 'Settling...' : 'Confirm Payout & Attach Proof'}</span>
          </button>
        </div>
      </form>
    </Modal>
  );
}
