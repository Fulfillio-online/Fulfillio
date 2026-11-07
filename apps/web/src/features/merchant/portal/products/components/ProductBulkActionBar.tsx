'use client';

import React from 'react';
import { Eye, FileText, Trash2, X, CheckSquare } from 'lucide-react';

interface ProductBulkActionBarProps {
  selectedCount: number;
  onClearSelection: () => void;
  onBulkPublish: () => void;
  onBulkDraft: () => void;
  onBulkDelete: () => void;
}

export function ProductBulkActionBar({
  selectedCount,
  onClearSelection,
  onBulkPublish,
  onBulkDraft,
  onBulkDelete,
}: ProductBulkActionBarProps) {
  if (selectedCount === 0) return null;

  return (
    <div className="fixed bottom-4 sm:bottom-6 left-1/2 -translate-x-1/2 z-40 max-w-[calc(100vw-24px)] overflow-x-auto bg-slate-900 border border-slate-700/80 shadow-2xl rounded-2xl px-3 sm:px-4 py-2.5 sm:py-3 flex items-center gap-2 sm:gap-4 animate-in slide-in-from-bottom-4 backdrop-blur">
      <div className="flex items-center gap-2 pr-3 border-r border-slate-800">
        <CheckSquare className="h-4 w-4 text-emerald-400" />
        <span className="text-xs font-bold text-slate-100 whitespace-nowrap">
          {selectedCount} selected
        </span>
      </div>

      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={onBulkPublish}
          className="px-3 py-1.5 rounded-lg bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 border border-emerald-500/40 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
        >
          <Eye className="h-3.5 w-3.5" />
          <span className="hidden sm:inline">Set as</span> Published
        </button>

        <button
          type="button"
          onClick={onBulkDraft}
          className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
        >
          <FileText className="h-3.5 w-3.5" />
          <span className="hidden sm:inline">Set as</span> Draft
        </button>

        <button
          type="button"
          onClick={onBulkDelete}
          className="px-3 py-1.5 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
        >
          <Trash2 className="h-3.5 w-3.5" />
          <span>Delete</span>
        </button>
      </div>

      <button
        type="button"
        onClick={onClearSelection}
        className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors ml-1 cursor-pointer"
        title="Clear Selection"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  );
}
