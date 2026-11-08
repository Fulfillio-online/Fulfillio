import React from 'react';
import { cn } from '@/lib/utils';

export interface StatusBadgeProps {
  status: string;
  className?: string;
  dot?: boolean;
}

export function StatusBadge({ status, className, dot = true }: StatusBadgeProps) {
  const normalized = status.toUpperCase();

  let styles =
    'bg-slate-100 text-slate-700 border-slate-200 dark:bg-white/5 dark:text-slate-300 dark:border-white/10';
  let dotColor = 'bg-slate-400';

  if (['ACTIVE', 'APPROVED', 'VERIFIED', 'DELIVERED', 'READY'].includes(normalized)) {
    styles =
      'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-300 dark:border-emerald-500/30';
    dotColor = 'bg-emerald-500';
  } else if (['PENDING', 'PENDING_APPROVAL', 'PENDING_REVIEW', 'ALLOCATED', 'PICKING', 'PACKED', 'PROCESSING'].includes(normalized)) {
    styles =
      'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-500/10 dark:text-amber-300 dark:border-amber-500/30';
    dotColor = 'bg-amber-500';
  } else if (['SUSPENDED', 'CANCELLED', 'REJECTED', 'FAILED', 'DAMAGED'].includes(normalized)) {
    styles =
      'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-500/10 dark:text-rose-300 dark:border-rose-500/30';
    dotColor = 'bg-rose-500';
  } else if (['DISPATCHED', 'IN_TRANSIT', 'WEEKLY', 'BI-WEEKLY'].includes(normalized)) {
    styles =
      'bg-sky-50 text-sky-700 border-sky-200 dark:bg-sky-500/10 dark:text-sky-300 dark:border-sky-500/30';
    dotColor = 'bg-sky-500';
  }

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold border',
        styles,
        className
      )}
    >
      {dot && <span className={cn('w-1.5 h-1.5 rounded-full', dotColor)} />}
      <span>{status}</span>
    </span>
  );
}
