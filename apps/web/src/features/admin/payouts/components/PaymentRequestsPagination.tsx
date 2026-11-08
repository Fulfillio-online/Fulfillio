'use client';

import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface PaymentRequestsPaginationProps {
  totalItems: number;
  pageSize: number;
  currentPage: number;
  onPageChange: (page: number) => void;
  onPageSizeChange: (size: number) => void;
}

export function PaymentRequestsPagination({
  totalItems,
  pageSize,
  currentPage,
  onPageChange,
  onPageSizeChange,
}: PaymentRequestsPaginationProps) {
  if (totalItems === 0) return null;

  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  const safePage = Math.min(Math.max(1, currentPage), totalPages);
  const startIndex = (safePage - 1) * pageSize;

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-3 px-4 py-3 bg-white dark:bg-navy-900 border border-slate-200 dark:border-white/10 rounded-2xl shadow-sm text-xs text-slate-600 dark:text-slate-300">
      <div className="flex items-center gap-3">
        <span>
          Showing <span className="font-bold text-navy-800 dark:text-white">{startIndex + 1}</span> to{' '}
          <span className="font-bold text-navy-800 dark:text-white">
            {Math.min(startIndex + pageSize, totalItems)}
          </span>{' '}
          of <span className="font-bold text-navy-800 dark:text-white">{totalItems}</span> requests
        </span>

        <div className="flex items-center gap-1.5 border-l border-slate-200 dark:border-white/10 pl-3">
          <span>Show</span>
          <select
            value={pageSize}
            onChange={(e) => onPageSizeChange(Number(e.target.value))}
            aria-label="Rows per page"
            className="px-2 py-1 rounded-lg bg-slate-50 dark:bg-navy-950 border border-slate-200 dark:border-white/10 text-xs font-semibold text-navy-800 dark:text-slate-100 focus:outline-none focus:border-orange-500 cursor-pointer"
          >
            <option value={10}>10</option>
            <option value={25}>25</option>
            <option value={50}>50</option>
            <option value={100}>100</option>
          </select>
          <span>rows</span>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <span className="text-slate-600 dark:text-slate-300 font-medium">
          Page <span className="text-navy-800 dark:text-white font-bold">{safePage}</span> of{' '}
          <span className="text-navy-800 dark:text-white font-bold">{totalPages}</span>
        </span>

        <div className="flex items-center gap-1">
          <button
            type="button"
            disabled={safePage <= 1}
            onClick={() => onPageChange(Math.max(1, safePage - 1))}
            aria-label="Previous page"
            className="p-1.5 rounded-lg border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-navy-950 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-navy-800 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer transition-colors"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button
            type="button"
            disabled={safePage >= totalPages}
            onClick={() => onPageChange(Math.min(totalPages, safePage + 1))}
            aria-label="Next page"
            className="p-1.5 rounded-lg border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-navy-950 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-navy-800 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer transition-colors"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
