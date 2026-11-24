'use client';

import React from 'react';
import { ClipboardList, PackageCheck, Truck } from 'lucide-react';
import { PipelineMainTab } from '../types';

interface PipelineStageCardsProps {
  activeTab: PipelineMainTab;
  onSelectTab: (tab: PipelineMainTab) => void;
  counts: {
    pickReady: number;
    pickWaiting: number;
    pack: number;
    dispatch: number;
    dispatchBooked: number;
  };
}

export function PipelineStageCards({
  activeTab,
  onSelectTab,
  counts,
}: PipelineStageCardsProps) {
  const cards: Array<{
    id: PipelineMainTab;
    label: string;
    count: number;
    subtitle: string;
    icon: React.ComponentType<{ className?: string }>;
    containerClass: string;
    iconBoxClass: string;
    badgeClass: string;
  }> = [
    {
      id: 'pick',
      label: '1. Pick List (Bin Verified)',
      count: counts.pickReady,
      subtitle:
        counts.pickWaiting > 0
          ? `${counts.pickReady} Ready · ${counts.pickWaiting} On Hold`
          : 'Ready in warehouse bins',
      icon: ClipboardList,
      containerClass:
        'border-indigo-500/25 bg-gradient-to-br from-indigo-500/10 via-white dark:via-navy-900 to-transparent',
      iconBoxClass:
        'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/30',
      badgeClass: 'text-indigo-600 dark:text-indigo-400',
    },
    {
      id: 'pack',
      label: '2. Pack & 4x6" Print',
      count: counts.pack,
      subtitle: 'Verified & ready for memo slip',
      icon: PackageCheck,
      containerClass:
        'border-purple-500/25 bg-gradient-to-br from-purple-500/10 via-white dark:via-navy-900 to-transparent',
      iconBoxClass:
        'bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/30',
      badgeClass: 'text-purple-600 dark:text-purple-400',
    },
    {
      id: 'dispatch',
      label: '3. Courier Dispatch',
      count: counts.dispatch,
      subtitle: `${counts.dispatchBooked} booked · Ready handover`,
      icon: Truck,
      containerClass:
        'border-emerald-500/25 bg-gradient-to-br from-emerald-500/10 via-white dark:via-navy-900 to-transparent',
      iconBoxClass:
        'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30',
      badgeClass: 'text-emerald-600 dark:text-emerald-400',
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-5">
      {cards.map((card) => {
        const Icon = card.icon;
        const isActive = activeTab === card.id;
        return (
          <button
            key={card.id}
            type="button"
            onClick={() => onSelectTab(card.id)}
            aria-pressed={isActive}
            className={`text-left rounded-2xl border p-5 sm:p-6 flex items-center justify-between gap-4 shadow-sm select-none transition-all cursor-pointer active:scale-[0.99] ${
              card.containerClass
            } ${
              isActive
                ? 'ring-2 ring-orange-500 border-orange-500 shadow-md shadow-orange-500/10'
                : 'hover:border-orange-500/40 hover:shadow-md'
            }`}
          >
            <div className="space-y-1.5 min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 block truncate">
                  {card.label}
                </span>
                {isActive && (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-orange-600 text-white shrink-0">
                    Active
                  </span>
                )}
              </div>
              <div className="text-2xl sm:text-3xl font-black text-navy-900 dark:text-white mt-1 tabular-nums tracking-tight">
                {card.count.toLocaleString()}
              </div>
              <span className={`text-xs font-semibold mt-1 block truncate ${card.badgeClass}`}>
                {card.subtitle}
              </span>
            </div>
            <div
              className={`h-12 w-12 rounded-2xl flex items-center justify-center shrink-0 shadow-xs ${
                isActive
                  ? 'bg-orange-600 text-white border border-orange-500'
                  : card.iconBoxClass
              }`}
            >
              <Icon className="w-6 h-6" />
            </div>
          </button>
        );
      })}
    </div>
  );
}
