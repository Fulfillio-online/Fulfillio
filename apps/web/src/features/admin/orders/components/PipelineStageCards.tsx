'use client';

import React from 'react';
import { Boxes, ClipboardList, PackageCheck, Truck } from 'lucide-react';
import { PipelineMainTab } from '../types';

interface PipelineStageCardsProps {
  activeTab?: PipelineMainTab;
  onSelectTab?: (tab: PipelineMainTab) => void;
  counts: {
    all: number;
    pickReady: number;
    pickWaiting: number;
    pack: number;
    dispatch: number;
    dispatchBooked: number;
    handedOver: number;
  };
}

export function PipelineStageCards({ counts }: PipelineStageCardsProps) {
  const cards = [
    {
      id: 'all',
      label: 'All Active Orders',
      count: counts.all,
      subtitle: `${counts.handedOver} handed over to courier`,
      icon: Boxes,
      containerClass:
        'border-orange-500/25 bg-gradient-to-br from-orange-500/10 via-white dark:via-navy-900 to-transparent',
      iconBoxClass:
        'bg-orange-500/10 text-orange-600 dark:text-orange-400 border border-orange-500/30',
      badgeClass: 'text-orange-600 dark:text-orange-400',
    },
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
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
      {cards.map((card) => {
        const Icon = card.icon;
        return (
          <div
            key={card.id}
            className={`rounded-2xl border p-5 sm:p-6 flex items-center justify-between gap-4 shadow-sm select-none transition-all ${card.containerClass}`}
          >
            <div className="space-y-1.5 min-w-0 flex-1">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 block truncate">
                {card.label}
              </span>
              <div className="text-2xl sm:text-3xl font-black text-navy-900 dark:text-white mt-1 tabular-nums tracking-tight">
                {card.count.toLocaleString()}
              </div>
              <span className={`text-xs font-semibold mt-1 block truncate ${card.badgeClass}`}>
                {card.subtitle}
              </span>
            </div>
            <div
              className={`h-12 w-12 rounded-2xl flex items-center justify-center shrink-0 shadow-xs ${card.iconBoxClass}`}
            >
              <Icon className="w-6 h-6" />
            </div>
          </div>
        );
      })}
    </div>
  );
}
