'use client';

import React from 'react';
import { X, ExternalLink, Download, FileText } from 'lucide-react';

export interface DocumentViewerModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  documentUrl?: string;
}

export function DocumentViewerModal({
  isOpen,
  onClose,
  title,
  subtitle = 'Verification document submitted for audit',
  documentUrl,
}: DocumentViewerModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in">
      <div className="w-full max-w-3xl bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between p-4 sm:p-5 border-b border-slate-800 bg-slate-900/80">
          <div>
            <h2 className="text-base font-bold text-slate-100">{title}</h2>
            {subtitle && <p className="text-xs text-slate-400 mt-0.5">{subtitle}</p>}
          </div>

          <div className="flex items-center gap-2">
            {documentUrl && (
              <a
                href={documentUrl}
                target="_blank"
                rel="noreferrer"
                download
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
                title="Open in new window"
              >
                <ExternalLink className="h-4 w-4" />
              </a>
            )}
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
              title="Close viewer"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Document Viewer Body */}
        <div className="p-4 sm:p-6 overflow-y-auto flex-1 flex items-center justify-center bg-slate-950/50 min-h-[300px]">
          {documentUrl ? (
            documentUrl.endsWith('.pdf') ? (
              <div className="text-center space-y-3 p-8">
                <FileText className="h-16 w-16 text-indigo-400 mx-auto" />
                <p className="text-sm font-semibold text-slate-200">PDF Document Attached</p>
                <a
                  href={documentUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-semibold"
                >
                  <Download className="h-3.5 w-3.5" />
                  <span>Download / View PDF</span>
                </a>
              </div>
            ) : (
              <div className="rounded-xl overflow-hidden border border-slate-800 bg-slate-900 shadow-md">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={documentUrl}
                  alt={title}
                  className="max-h-[60vh] max-w-full object-contain mx-auto"
                />
              </div>
            )
          ) : (
            <div className="text-center text-slate-500 py-12">
              <FileText className="h-12 w-12 mx-auto mb-2 opacity-50" />
              <p className="text-sm">No document uploaded yet</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-800 flex justify-end bg-slate-900/60">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-semibold transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
