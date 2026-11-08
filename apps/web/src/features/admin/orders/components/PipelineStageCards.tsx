'use client';

import React from 'react';
import { Boxes, ClipboardList, PackageCheck, Truck } from 'lucide-react';
import { PipelineMainTab } from '../types';

interface PipelineStageCardsProps {
  activeTab: PipelineMainTab;
  onSelectTab: (tab: PipelineMainTab) => void;
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

export function PipelineStageCards({
  activeTab,
  onSelectTab,
  counts,
}: PipelineStageCardsProps) {
  const tabs = [
    {
      id: 'all' as PipelineMainTab,
      label: 'All Active Orders',
      count: counts.all,
      subtitle: `${counts.handedOver} handed over to courier`,
      icon: Boxes,
    },
    {
      id: 'pick' as PipelineMainTab,
      label: '1. Pick List',
      count: counts.pickReady,
      subtitle:
        counts.pickWaiting > 0
          ? `${counts.pickReady} Ready · ${counts.pickWaiting} Waiting/Hold`
          : 'Bin-guided picking queue',
      icon: ClipboardList,
    },
    {
      id: 'pack' as PipelineMainTab,
      label: '2. Pack & 4x6" Print',
      count: counts.pack,
      subtitle: 'Select & print 4x6" memo',
      icon: PackageCheck,
    },
    {
      id: 'dispatch' as PipelineMainTab,
      label: '3. Courier Dispatch',
      count: counts.dispatch,
      subtitle: `${counts.dispatchBooked} booked · Ready handover`,
      icon: Truck,
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {tabs.map((tab) => {
        const Icon = tab.icon;
        const isActive = activeTab === tab.id;
        return (
          <button
            key={tab.id}
            type="button"
            onClick={() => onSelectTab(tab.id)}
            className={`text-left rounded-2xl border p-4 transition-all flex items-center justify-between cursor-pointer ${
              isActive
                ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-950/25 shadow-lg'
                : 'border-slate-200 dark:border-white/10 bg-white/90 dark:bg-navy-900/90 hover:border-slate-300 dark:hover:border-white/15'
            }`}
          >
            <div>
              <span className="text-xs font-semibold text-slate-600 dark:text-slate-300 block">{tab.label}</span>
              <div className="text-2xl font-extrabold text-navy-800 dark:text-white mt-1 tabular-nums">{tab.count}</div>
              <span className="text-xs text-orange-600 dark:text-orange-400 mt-0.5 block">{tab.subtitle}</span>
            </div>
            <div
              className={`h-11 w-11 rounded-xl flex items-center justify-center border shrink-0 ${
                isActive
                  ? 'bg-orange-600 text-white border-orange-500'
                  : 'bg-slate-50 dark:bg-navy-950 text-orange-600 dark:text-orange-400 border-slate-200 dark:border-white/10'
              }`}
            >
              <Icon className="w-5 h-5" />
            </div>
          </button>
        );
      })}
    </div>
  );
}
