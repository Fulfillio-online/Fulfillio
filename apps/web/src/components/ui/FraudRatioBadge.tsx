'use client';

import React from 'react';
import { ShieldCheck, ShieldAlert, AlertTriangle } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface FraudRatioBadgeProps {
  successRatio: number;
  totalParcels?: number;
  compact?: boolean;
  className?: string;
}

export function FraudRatioBadge({
  successRatio,
  totalParcels = 18,
  compact = false,
  className,
}: FraudRatioBadgeProps) {
  const isSafe = successRatio >= 75;
  const isModerate = successRatio >= 50 && successRatio < 75;

  const badgeStyle = isSafe
    ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
    : isModerate
      ? 'bg-amber-500/10 text-amber-400 border-amber-500/30'
      : 'bg-rose-500/15 text-rose-400 border-rose-500/40 animate-pulse';

  const Icon = isSafe ? ShieldCheck : isModerate ? AlertTriangle : ShieldAlert;
  const label = isSafe ? 'Safe Customer' : isModerate ? 'Call Verify' : 'High Fraud Risk';

  return (
    <span
      title={`BD Courier Ratio: ${successRatio}% Success across ${totalParcels} parcels (Steadfast/Pathao/RedX)`}
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-semibold',
        badgeStyle,
        className,
      )}
    >
      <Icon className="w-3.5 h-3.5 shrink-0" />
      <span>{successRatio}%</span>
      {!compact ? <span className="opacity-85">· {label}</span> : null}
    </span>
  );
}
