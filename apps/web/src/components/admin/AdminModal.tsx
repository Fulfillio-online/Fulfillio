'use client';

import React, { useEffect } from 'react';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { ModalProps } from '@/components/ui/Modal';

const sizeClasses: Record<NonNullable<ModalProps['size']>, string> = {
  sm: 'max-w-md',
  md: 'max-w-lg',
  lg: 'max-w-2xl',
  xl: 'max-w-4xl',
};

/** Admin-themed dialog (light + dark). Same API as the shared Modal. */
export function Modal({ isOpen, onClose, title, subtitle, size = 'md', children, footer }: ModalProps) {
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      className="admin-font fixed inset-0 z-50 flex items-center justify-center bg-navy-950/60 backdrop-blur-sm p-2.5 sm:p-4 animate-in fade-in duration-150"
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
    >
      <div
        className={cn(
          'w-full rounded-3xl border border-slate-200 dark:border-white/10 bg-white dark:bg-navy-900 text-navy-800 dark:text-slate-100 shadow-2xl shadow-navy-950/30 overflow-hidden flex flex-col max-h-[92vh]',
          sizeClasses[size],
        )}
      >
        <div className="flex items-center justify-between px-5 sm:px-7 py-4 border-b border-slate-100 dark:border-white/10 gap-3">
          <div className="min-w-0">
            <h3 id="modal-title" className="text-base sm:text-lg font-bold text-navy-800 dark:text-white truncate">
              {title}
            </h3>
            {subtitle ? <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 line-clamp-2">{subtitle}</p> : null}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full p-2 text-slate-400 hover:bg-slate-100 dark:hover:bg-white/10 hover:text-navy-800 dark:hover:text-white transition-colors shrink-0"
            aria-label="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-5 sm:p-7 overflow-y-auto flex-1 space-y-4">{children}</div>

        {footer ? (
          <div className="px-5 sm:px-7 py-3.5 border-t border-slate-100 dark:border-white/10 bg-slate-50 dark:bg-navy-950/60 flex flex-wrap items-center justify-end gap-2 sm:gap-3">
            {footer}
          </div>
        ) : null}
      </div>
    </div>
  );
}
