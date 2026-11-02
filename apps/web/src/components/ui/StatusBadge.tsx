import React from 'react';
import { cn } from '@/lib/utils';

export interface StatusBadgeProps {
  status: string;
  className?: string;
  dot?: boolean;
}

export function StatusBadge({ status, className, dot = true }: StatusBadgeProps) {
  const normalized = status.toUpperCase();

  let styles = 'bg-slate-800 text-slate-300 border-slate-700';
  let dotColor = 'bg-slate-400';

  if (['ACTIVE', 'APPROVED', 'VERIFIED', 'DELIVERED', 'READY'].includes(normalized)) {
    styles = 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30';
    dotColor = 'bg-emerald-400';
  } else if (['PENDING', 'PENDING_APPROVAL', 'PENDING_REVIEW', 'ALLOCATED', 'PICKING', 'PACKED', 'PROCESSING'].includes(normalized)) {
    styles = 'bg-amber-500/15 text-amber-300 border-amber-500/30';
    dotColor = 'bg-amber-400';
  } else if (['SUSPENDED', 'CANCELLED', 'REJECTED', 'FAILED', 'DAMAGED'].includes(normalized)) {
    styles = 'bg-rose-500/15 text-rose-300 border-rose-500/30';
    dotColor = 'bg-rose-400';
  } else if (['DISPATCHED', 'IN_TRANSIT', 'WEEKLY', 'BI-WEEKLY'].includes(normalized)) {
    styles = 'bg-indigo-500/15 text-indigo-300 border-indigo-500/30';
    dotColor = 'bg-indigo-400';
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
