'use client';

import React from 'react';
import { CheckCircle2, Clock, AlertTriangle, ShieldCheck, XCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

export type VerificationState = 'VERIFIED' | 'PENDING_REVIEW' | 'REJECTED' | 'UNVERIFIED';

export interface VerificationStatusBadgeProps {
  status: VerificationState | string;
  className?: string;
  showIcon?: boolean;
  size?: 'sm' | 'md';
}

export function VerificationStatusBadge({
  status,
  className,
  showIcon = true,
  size = 'sm',
}: VerificationStatusBadgeProps) {
  const norm = (status || 'UNVERIFIED').toUpperCase();

  let label = 'Unverified';
  let styles = 'bg-slate-800 text-slate-400 border-slate-700';
  let Icon = AlertTriangle;

  if (norm === 'VERIFIED' || norm === 'APPROVED' || norm === 'ACTIVE') {
    label = 'Verified by Admin';
    styles = 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30';
    Icon = ShieldCheck;
  } else if (norm === 'PENDING_REVIEW' || norm === 'PENDING') {
    label = 'Pending Review';
    styles = 'bg-amber-500/10 text-amber-300 border-amber-500/30';
    Icon = Clock;
  } else if (norm === 'REJECTED' || norm === 'SUSPENDED') {
    label = 'Rejected';
    styles = 'bg-rose-500/10 text-rose-400 border-rose-500/30';
    Icon = XCircle;
  }

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 font-bold rounded-full border transition-colors',
        size === 'sm' ? 'px-2.5 py-0.5 text-xs' : 'px-3 py-1 text-sm',
        styles,
        className
      )}
    >
      {showIcon && <Icon className={size === 'sm' ? 'h-3.5 w-3.5 shrink-0' : 'h-4 w-4 shrink-0'} />}
      <span>{label}</span>
    </span>
  );
}
