'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { PackageCheck, Printer, BookmarkCheck, Truck, ChevronRight } from 'lucide-react';
import { useWms } from '../WmsContext';

export function WmsPipelineNav() {
  const pathname = usePathname();
  const { counts } = useWms();

  const steps = [
    {
      id: 'pick',
      label: '1. Pick List',
      sublabel: 'Collect from Bins',
      href: '/wms/pick',
      count: counts.readyToPick,
      icon: PackageCheck,
      color: 'emerald',
    },
    {
      id: 'pack',
      label: '2. Pack & Print',
      sublabel: '4x6 Thermal Slip',
      href: '/wms/pack',
      count: counts.picked,
      icon: Printer,
      color: 'indigo',
    },
    {
      id: 'book',
      label: '3. Courier Booking',
      sublabel: 'API Consignment',
      href: '/wms/book',
      count: counts.packed,
      icon: BookmarkCheck,
      color: 'amber',
    },
    {
      id: 'handover',
      label: '4. Courier Handover',
      sublabel: 'Rider Manifest',
      href: '/wms/handover',
      count: counts.booked,
      icon: Truck,
      color: 'teal',
    },
  ];

  return (
    <nav className="bg-slate-950/80 border-b border-slate-800/80 sticky top-[61px] z-30 backdrop-blur-md px-4 py-2.5">
      <div className="max-w-7xl mx-auto flex items-center justify-between overflow-x-auto gap-2 no-scrollbar py-0.5">
        <div className="flex items-center gap-1.5 sm:gap-2 min-w-max">
          {steps.map((step, idx) => {
            const isActive = pathname === step.href;
            const Icon = step.icon;

            return (
              <React.Fragment key={step.id}>
                {idx > 0 && (
                  <ChevronRight className="h-4 w-4 text-slate-700 shrink-0 hidden md:block" />
                )}
                <Link
                  href={step.href}
                  className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold transition-all shrink-0 border ${
                    isActive
                      ? 'bg-slate-800 text-white border-emerald-500/50 shadow-sm ring-1 ring-emerald-500/20'
                      : 'bg-slate-900/60 text-slate-400 hover:text-slate-200 border-slate-800 hover:border-slate-700'
                  }`}
                >
                  <div
                    className={`h-6 w-6 rounded-lg flex items-center justify-center shrink-0 ${
                      isActive
                        ? 'bg-emerald-500 text-slate-950'
                        : 'bg-slate-800 text-slate-400'
                    }`}
                  >
                    <Icon className="h-3.5 w-3.5" />
                  </div>

                  <div className="text-left">
                    <span className="font-bold block leading-tight">{step.label}</span>
                    <span className="text-[10px] text-slate-400 hidden lg:block leading-tight">
                      {step.sublabel}
                    </span>
                  </div>

                  {step.count > 0 && (
                    <span
                      className={`ml-1 px-1.5 py-0.5 rounded-full text-[10px] font-mono font-bold ${
                        isActive
                          ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                          : 'bg-slate-800 text-slate-300'
                      }`}
                    >
                      {step.count}
                    </span>
                  )}
                </Link>
              </React.Fragment>
            );
          })}
        </div>

        {/* Live Dispatched count pill */}
        <div className="hidden sm:flex items-center gap-1.5 text-xs text-slate-400 font-mono pl-3 shrink-0">
          <span className="text-slate-500">Dispatched Today:</span>
          <span className="font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/30">
            {counts.dispatched} parcels
          </span>
        </div>
      </div>
    </nav>
  );
}
