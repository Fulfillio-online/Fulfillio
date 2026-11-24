'use client';

import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import {
  CheckCircle2,
  Copy,
  Check,
  Download,
  FileText,
  Printer,
  ShieldCheck,
  X,
  Building2,
  Smartphone,
  Hash,
} from 'lucide-react';

export interface PayoutDigitalProofData {
  requestCode?: string;
  transactionRef?: string;
  merchantName: string;
  merchantCode: string;
  amount: number;
  method: string;
  provider: string;
  accountNumber: string;
  accountHolder?: string;
  trxId?: string;
  proofDocumentUrl?: string;
  proofDocumentName?: string;
  proofDocumentMime?: string;
  proofChannel?: string;
  proofNotes?: string;
  proofChecksum?: string;
  paidAt?: string;
  paidByAdminName?: string;
  status?: string;
}

interface PayoutDigitalProofModalProps {
  isOpen: boolean;
  onClose: () => void;
  proof: PayoutDigitalProofData | null;
}

function formatDateTime(iso?: string): string {
  if (!iso) return '—';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  });
}

function escapeHtml(val: string): string {
  return val
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

export function PayoutDigitalProofModal({
  isOpen,
  onClose,
  proof,
}: PayoutDigitalProofModalProps) {
  const [mounted, setMounted] = useState(false);
  const [copiedTrx, setCopiedTrx] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!isOpen) return;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => {
      document.body.style.overflow = prevOverflow;
      window.removeEventListener('keydown', onKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen || !mounted || !proof) return null;

  const trxId = proof.trxId || proof.transactionRef || '—';
  const docUrl = proof.proofDocumentUrl || '';
  const isPdf =
    Boolean(docUrl) &&
    (docUrl.startsWith('data:application/pdf') ||
      proof.proofDocumentMime === 'application/pdf' ||
      docUrl.toLowerCase().endsWith('.pdf'));

  const handleCopyTrx = () => {
    if (!trxId || trxId === '—' || typeof navigator === 'undefined') return;
    navigator.clipboard.writeText(trxId);
    setCopiedTrx(true);
    setTimeout(() => setCopiedTrx(false), 1800);
  };

  const handleDownloadProof = () => {
    if (!docUrl) return;
    const a = document.createElement('a');
    a.href = docUrl;
    const fallbackExt = isPdf ? 'pdf' : 'jpg';
    a.download = proof.proofDocumentName || `payout-proof-${trxId}.${fallbackExt}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const handlePrintVoucher = () => {
    const win = window.open('', '_blank', 'width=820,height=900');
    if (!win) return;

    const imageBlock =
      docUrl && !isPdf
        ? `<div style="margin-top:20px;text-align:center;">
             <div style="font-size:11px;font-weight:700;text-transform:uppercase;color:#64748b;margin-bottom:8px;">Attached Digital Receipt</div>
             <img src="${docUrl}" alt="Digital Proof" style="max-width:100%;max-height:420px;border:1px solid #e2e8f0;border-radius:10px;" />
           </div>`
        : isPdf
          ? `<div style="margin-top:16px;padding:12px;border:1px dashed #cbd5e1;border-radius:8px;font-size:12px;color:#334155;">PDF Receipt Attached: ${escapeHtml(proof.proofDocumentName || 'payout-receipt.pdf')}</div>`
          : '';

    win.document.write(`<!doctype html>
<html>
<head>
  <title>Fulfillio Payout Voucher - ${escapeHtml(proof.requestCode || trxId)}</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; color: #0f172a; margin: 28px; }
    .card { border: 1px solid #cbd5e1; border-radius: 14px; padding: 24px; max-width: 720px; margin: 0 auto; }
    .hdr { display:flex; justify-content:space-between; align-items:center; border-bottom: 2px solid #f26b1d; padding-bottom: 14px; margin-bottom: 18px; }
    .brand { font-size: 20px; font-weight: 800; color: #12284c; }
    .brand span { color: #f26b1d; }
    .badge { background:#ecfdf5; color:#047857; border:1px solid #6ee7b7; padding:4px 10px; border-radius:999px; font-size:11px; font-weight:700; }
    .grid { display:grid; grid-template-columns: 1fr 1fr; gap:12px; font-size:12px; }
    .box { background:#f8fafc; border:1px solid #e2e8f0; border-radius:10px; padding:10px 12px; }
    .lbl { font-size:10px; text-transform:uppercase; color:#64748b; font-weight:700; margin-bottom:3px; }
    .val { font-size:13px; font-weight:700; color:#0f172a; word-break:break-all; }
    .amt { font-size:22px; font-weight:800; color:#f26b1d; }
    .chk { margin-top:14px; font-family:monospace; font-size:10px; color:#475569; background:#f1f5f9; padding:8px 10px; border-radius:8px; word-break:break-all; }
    @media print { body { margin: 10px; } }
  </style>
</head>
<body>
  <div class="card">
    <div class="hdr">
      <div>
        <div class="brand">Fulfill<span>io</span> Digital Payout Voucher</div>
        <div style="font-size:11px;color:#64748b;margin-top:2px;">Official Verified Disbursement Record</div>
      </div>
      <div class="badge">VERIFIED &amp; PAID</div>
    </div>
    <div class="grid">
      <div class="box"><div class="lbl">Voucher / Request Code</div><div class="val">${escapeHtml(proof.requestCode || proof.transactionRef || '—')}</div></div>
      <div class="box"><div class="lbl">Disbursed Amount</div><div class="amt">৳${proof.amount.toLocaleString()}</div></div>
      <div class="box"><div class="lbl">Merchant</div><div class="val">${escapeHtml(proof.merchantName)} (${escapeHtml(proof.merchantCode)})</div></div>
      <div class="box"><div class="lbl">Transaction ID (TrxID)</div><div class="val">${escapeHtml(trxId)}</div></div>
      <div class="box"><div class="lbl">Channel &amp; Account</div><div class="val">${escapeHtml(proof.provider)} · ${escapeHtml(proof.accountNumber)}</div></div>
      <div class="box"><div class="lbl">Paid Timestamp</div><div class="val">${escapeHtml(formatDateTime(proof.paidAt))}</div></div>
      <div class="box"><div class="lbl">Verified By</div><div class="val">${escapeHtml(proof.paidByAdminName || 'Super Admin')}</div></div>
      <div class="box"><div class="lbl">Account Holder</div><div class="val">${escapeHtml(proof.accountHolder || '—')}</div></div>
    </div>
    ${proof.proofNotes ? `<div class="box" style="margin-top:12px;"><div class="lbl">Disbursement Notes</div><div class="val" style="font-weight:500;">${escapeHtml(proof.proofNotes)}</div></div>` : ''}
    ${proof.proofChecksum ? `<div class="chk"><strong>SHA-256 Digital Proof Checksum:</strong> ${escapeHtml(proof.proofChecksum)}</div>` : ''}
    ${imageBlock}
  </div>
  <script>window.onload = function() { window.print(); };</script>
</body>
</html>`);
    win.document.close();
  };

  return createPortal(
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center bg-slate-950/75 backdrop-blur-sm p-3 sm:p-4 animate-in fade-in duration-150"
      role="dialog"
      aria-modal="true"
      aria-labelledby="digital-proof-title"
      onClick={onClose}
    >
      <div
        className="w-full max-w-2xl rounded-3xl border border-slate-200 dark:border-white/10 bg-white dark:bg-navy-900 text-navy-900 dark:text-white shadow-2xl overflow-hidden flex flex-col max-h-[92vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 sm:px-6 py-4 border-b border-slate-200/80 dark:border-white/10 bg-slate-50/70 dark:bg-navy-950/60">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h3
                  id="digital-proof-title"
                  className="text-base font-extrabold text-navy-900 dark:text-white truncate"
                >
                  Digital Payout Proof Voucher
                </h3>
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 select-none">
                  <CheckCircle2 className="w-3 h-3" />
                  <span>Verified Paid</span>
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
                {proof.requestCode ? `Request ${proof.requestCode} · ` : ''}
                {proof.merchantName} ({proof.merchantCode})
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-full text-slate-400 hover:text-navy-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/10 transition-colors cursor-pointer"
            aria-label="Close voucher modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-5 sm:p-6 overflow-y-auto flex-1 space-y-4">
          {/* Amount & TrxID Highlight Banner */}
          <div className="rounded-2xl border border-orange-500/25 bg-orange-500/5 p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 block">
                Disbursed Amount
              </span>
              <span className="text-2xl sm:text-3xl font-black text-orange-600 dark:text-orange-400 tabular-nums">
                ৳ {proof.amount.toLocaleString()}
              </span>
            </div>

            <div className="sm:text-right">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 block">
                Transaction ID (TrxID)
              </span>
              <div className="flex items-center sm:justify-end gap-2 mt-0.5">
                <span className="font-mono text-sm font-extrabold text-navy-900 dark:text-white">
                  {trxId}
                </span>
                {trxId !== '—' && (
                  <button
                    type="button"
                    onClick={handleCopyTrx}
                    className="p-1.5 rounded-lg bg-white dark:bg-navy-800 border border-slate-200 dark:border-white/10 text-slate-500 hover:text-orange-600 dark:hover:text-orange-400 transition-colors cursor-pointer"
                    title="Copy TrxID"
                  >
                    {copiedTrx ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Metadata Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-navy-950/70 border border-slate-200/80 dark:border-white/10 space-y-1">
              <span className="text-[10px] uppercase font-bold tracking-wider text-slate-500 dark:text-slate-400 block">
                Payment Destination
              </span>
              <div className="flex items-center gap-1.5 font-bold text-navy-900 dark:text-white">
                {proof.method === 'BANK_TRANSFER' ? (
                  <Building2 className="w-3.5 h-3.5 text-orange-500" />
                ) : (
                  <Smartphone className="w-3.5 h-3.5 text-emerald-500" />
                )}
                <span>{proof.provider}</span>
              </div>
              <div className="font-mono text-slate-700 dark:text-slate-300">
                {proof.accountNumber}
                {proof.accountHolder ? ` · ${proof.accountHolder}` : ''}
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-navy-950/70 border border-slate-200/80 dark:border-white/10 space-y-1">
              <span className="text-[10px] uppercase font-bold tracking-wider text-slate-500 dark:text-slate-400 block">
                Audit &amp; Settlement Timestamp
              </span>
              <div className="font-bold text-navy-900 dark:text-white">
                {formatDateTime(proof.paidAt)}
              </div>
              <div className="text-slate-500 dark:text-slate-400">
                Verified by <strong className="text-navy-900 dark:text-slate-200">{proof.paidByAdminName || 'Super Admin'}</strong>
                {proof.proofChannel ? ` via ${proof.proofChannel}` : ''}
              </div>
            </div>
          </div>

          {proof.proofNotes && (
            <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-navy-950/70 border border-slate-200/80 dark:border-white/10 text-xs">
              <span className="text-[10px] uppercase font-bold tracking-wider text-slate-500 dark:text-slate-400 block mb-1">
                Settlement Notes
              </span>
              <p className="text-slate-700 dark:text-slate-300">{proof.proofNotes}</p>
            </div>
          )}

          {proof.proofChecksum && (
            <div className="p-3 rounded-xl bg-slate-100/80 dark:bg-navy-950 border border-slate-200 dark:border-white/10 flex items-start gap-2 text-[11px]">
              <Hash className="w-3.5 h-3.5 text-emerald-500 shrink-0 mt-0.5" />
              <div className="min-w-0">
                <span className="font-bold text-slate-600 dark:text-slate-300 block">
                  SHA-256 Tamper-Evident Checksum
                </span>
                <span className="font-mono text-slate-500 dark:text-slate-400 break-all">
                  {proof.proofChecksum}
                </span>
              </div>
            </div>
          )}

          {/* Attached Digital Proof Receipt */}
          <div className="space-y-2">
            <span className="text-xs font-bold text-navy-900 dark:text-white block">
              Attached Digital Receipt / Transfer Proof
            </span>
            {docUrl ? (
              isPdf ? (
                <div className="rounded-2xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-navy-950 p-5 text-center space-y-3">
                  <FileText className="w-12 h-12 text-orange-500 mx-auto" />
                  <div>
                    <p className="text-xs font-bold text-navy-900 dark:text-white">
                      {proof.proofDocumentName || 'Digital Proof Receipt (PDF)'}
                    </p>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                      PDF receipt attached and verified on ledger.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={handleDownloadProof}
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-orange-600 hover:bg-orange-500 text-white text-xs font-bold transition-colors cursor-pointer"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Download PDF Receipt</span>
                  </button>
                </div>
              ) : (
                <div className="rounded-2xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-navy-950 p-3 flex items-center justify-center">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={docUrl}
                    alt={`Digital proof for ${trxId}`}
                    className="max-h-72 max-w-full rounded-xl object-contain"
                  />
                </div>
              )
            ) : (
              <div className="rounded-2xl border border-dashed border-slate-300 dark:border-white/15 p-6 text-center text-xs text-slate-500 dark:text-slate-400">
                No receipt file attached to this legacy settlement record.
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="px-5 sm:px-6 py-3.5 border-t border-slate-200/80 dark:border-white/10 bg-slate-50/70 dark:bg-navy-950/60 flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            {docUrl && (
              <button
                type="button"
                onClick={handleDownloadProof}
                className="px-3.5 py-2 rounded-xl bg-white dark:bg-navy-800 hover:bg-slate-100 dark:hover:bg-navy-700 border border-slate-200 dark:border-white/10 text-xs font-bold text-navy-900 dark:text-slate-100 flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <Download className="w-3.5 h-3.5 text-emerald-500" />
                <span>Download Proof</span>
              </button>
            )}
            <button
              type="button"
              onClick={handlePrintVoucher}
              className="px-3.5 py-2 rounded-xl bg-orange-600 hover:bg-orange-500 text-white text-xs font-bold flex items-center gap-1.5 shadow-sm transition-colors cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print Voucher</span>
            </button>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-navy-800 hover:bg-slate-200 dark:hover:bg-navy-700 text-xs font-semibold text-slate-700 dark:text-slate-200 transition-colors cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>,
    document.body,
  );
}
