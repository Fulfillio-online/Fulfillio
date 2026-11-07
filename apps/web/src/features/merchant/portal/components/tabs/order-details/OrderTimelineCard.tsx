'use client';

import React, { useState } from 'react';
import { Clock, CheckCircle2, ChevronDown, ChevronUp } from 'lucide-react';

interface TimelineEvent {
  title: string;
  description: string;
  timestamp: string;
  isCompleted: boolean;
}

interface OrderTimelineCardProps {
  timelineEvents: TimelineEvent[];
}

export function OrderTimelineCard({ timelineEvents }: OrderTimelineCardProps) {
  // On mobile, collapsible; default collapsed to save vertical scrolling
  const [isMobileExpanded, setIsMobileExpanded] = useState(false);

  // Find latest active or completed milestone
  const activeEvent =
    [...timelineEvents].reverse().find((evt) => evt.isCompleted) ||
    timelineEvents[0];

  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-900 p-5 shadow-md space-y-4">
      {/* Header (interactive on mobile) */}
      <div className="flex items-center justify-between pb-3.5 border-b border-slate-800">
        <div className="flex items-center gap-2.5">
          <div className="h-8 w-8 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
            <Clock className="h-4 w-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-100">Fulfillment Timeline</h3>
            <p className="text-xs text-slate-400">Warehouse intake and courier milestones</p>
          </div>
        </div>

        {/* Mobile toggle button */}
        <button
          type="button"
          onClick={() => setIsMobileExpanded(!isMobileExpanded)}
          className="lg:hidden inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition-colors cursor-pointer"
        >
          <span>{isMobileExpanded ? 'Collapse' : 'View Full History'}</span>
          {isMobileExpanded ? (
            <ChevronUp className="h-3.5 w-3.5" />
          ) : (
            <ChevronDown className="h-3.5 w-3.5" />
          )}
        </button>
      </div>

      {/* Mobile preview when collapsed */}
      {!isMobileExpanded && (
        <div className="lg:hidden p-3.5 rounded-xl bg-slate-950/70 border border-slate-800 flex items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2.5 min-w-0">
            <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse shrink-0" />
            <div className="min-w-0">
              <span className="font-bold text-slate-200 block truncate">
                Current: {activeEvent.title}
              </span>
              <span className="text-[11px] text-slate-400 truncate block">
                {activeEvent.timestamp}
              </span>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setIsMobileExpanded(true)}
            className="text-[11px] text-emerald-400 font-semibold hover:underline shrink-0"
          >
            Show all steps ({timelineEvents.length})
          </button>
        </div>
      )}

      {/* Full Timeline List (always shown on lg, conditionally shown on mobile) */}
      <div
        className={`${
          isMobileExpanded ? 'block' : 'hidden lg:block'
        } relative pl-6 space-y-6 pt-2 before:absolute before:left-2.5 before:top-3 before:bottom-3 before:w-0.5 before:bg-slate-800`}
      >
        {timelineEvents.map((evt, idx) => (
          <div key={idx} className="relative group">
            <span
              className={`absolute -left-6 top-0.5 h-5 w-5 rounded-full flex items-center justify-center ${
                evt.isCompleted
                  ? 'bg-emerald-500 text-slate-950 ring-4 ring-slate-900'
                  : 'bg-slate-800 text-slate-500 ring-4 ring-slate-900'
              }`}
            >
              <CheckCircle2 className="h-3.5 w-3.5" />
            </span>

            <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-1">
              <h4
                className={`text-xs font-semibold ${
                  evt.isCompleted ? 'text-slate-200' : 'text-slate-500'
                }`}
              >
                {evt.title}
              </h4>
              <span className="text-[11px] text-slate-500 font-mono">{evt.timestamp}</span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5 leading-relaxed">{evt.description}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
