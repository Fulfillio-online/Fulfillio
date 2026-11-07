'use client';

import React, { useState } from 'react';
import { ChevronDown } from 'lucide-react';

export interface MerchantExpandableCardProps {
  isSelected?: boolean;
  onToggleSelect?: () => void;
  statusBadge?: React.ReactNode;
  row1: React.ReactNode;
  row2: React.ReactNode;
  row3: React.ReactNode;
  expandedContent: React.ReactNode;
  actions?: React.ReactNode;
  defaultExpanded?: boolean;
  className?: string;
}

export function MerchantExpandableCard({
  isSelected,
  onToggleSelect,
  statusBadge,
  row1,
  row2,
  row3,
  expandedContent,
  actions,
  defaultExpanded = false,
  className = '',
}: MerchantExpandableCardProps) {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);

  return (
    <div
      className={`rounded-xl border transition-all shadow-sm overflow-hidden select-none ${
        isSelected
          ? 'border-emerald-500/50 bg-emerald-950/20'
          : 'border-slate-800 bg-slate-900/90 hover:bg-slate-850/60'
      } ${className}`}
    >
      {/* Collapsed Header: Tapping expands/collapses */}
      <div
        onClick={() => setIsExpanded(!isExpanded)}
        className="p-3.5 flex items-start justify-between gap-2.5 cursor-pointer active:bg-slate-800/60 transition-colors"
      >
        {/* Left Side: 3 Stacked Rows */}
        <div className="min-w-0 flex-1 space-y-1.5">
          {/* Row 1: Checkbox (optional) + Identifier + Secondary Info */}
          <div className="flex items-center gap-2 min-w-0 flex-wrap">
            {onToggleSelect && (
              <input
                type="checkbox"
                checked={Boolean(isSelected)}
                onClick={(e) => e.stopPropagation()}
                onChange={onToggleSelect}
                aria-label="Select item"
                className="rounded border-slate-700 bg-slate-800 text-emerald-500 focus:ring-emerald-500/20 focus:ring-offset-0 cursor-pointer h-4 w-4 shrink-0"
              />
            )}
            <div className="flex items-center gap-1.5 min-w-0 flex-1">
              {row1}
            </div>
          </div>

          {/* Row 2: Main Subject (Customer / Product Title) */}
          <div className="min-w-0">
            {row2}
          </div>

          {/* Row 3: Financial / Stock Summary */}
          <div className="min-w-0 pt-0.5">
            {row3}
          </div>
        </div>

        {/* Right Side: Status Badge on Top & Animated Chevron on Bottom */}
        <div className="flex flex-col items-end justify-between self-stretch shrink-0 pl-1">
          {statusBadge && <div className="shrink-0">{statusBadge}</div>}

          <button
            type="button"
            aria-label={isExpanded ? 'Collapse card' : 'Expand card'}
            className="p-1 rounded-lg bg-slate-800/80 text-slate-400 hover:text-white transition-colors mt-auto"
          >
            <ChevronDown
              className={`w-4 h-4 transition-transform duration-200 text-slate-400 ${
                isExpanded ? 'rotate-180 text-emerald-400' : ''
              }`}
            />
          </button>
        </div>
      </div>

      {/* Expanded Drawer */}
      {isExpanded && (
        <div className="px-3.5 pb-3.5 pt-2 border-t border-slate-800/80 bg-slate-950/60 text-xs space-y-3 animate-in fade-in-50 duration-150">
          {expandedContent}

          {/* Direct Quick Action Buttons */}
          {actions && (
            <div
              className="pt-2.5 border-t border-slate-800/80 flex items-center gap-2 flex-wrap"
              onClick={(e) => e.stopPropagation()}
            >
              {actions}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
