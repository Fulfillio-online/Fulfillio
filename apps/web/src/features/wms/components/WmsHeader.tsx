'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Volume2, VolumeX, LogOut, ArrowRightLeft, ShieldCheck, Warehouse, RefreshCw } from 'lucide-react';
import { useWms } from '../WmsContext';
import { StationSwitchModal } from './StationSwitchModal';

export function WmsHeader() {
  const { station, audioEnabled, toggleAudio, refreshOrders, loading } = useWms();
  const [isSwitchModalOpen, setIsSwitchModalOpen] = useState(false);

  return (
    <>
      <header className="bg-slate-900 border-b border-slate-800 sticky top-0 z-40 px-4 py-3 shadow-md">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-3">
          {/* Brand & Station Info */}
          <div className="flex items-center gap-3">
            <Link
              href="/wms"
              className="h-10 w-10 rounded-xl bg-emerald-600 flex items-center justify-center font-black text-white text-lg shadow-inner hover:bg-emerald-500 transition-colors"
            >
              F
            </Link>

            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-base tracking-tight text-white flex items-center gap-1.5">
                  <Warehouse className="h-4 w-4 text-emerald-400" />
                  <span>Fulfillio WMS</span>
                </span>
                <span className="text-[10px] uppercase font-bold tracking-wider bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 px-1.5 py-0.5 rounded">
                  Floor Operations
                </span>
              </div>

              <div className="flex items-center gap-2 text-xs text-slate-400 mt-0.5">
                <span className="flex items-center gap-1 text-slate-200 font-semibold">
                  <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
                  {station.stationName}
                </span>
                <span>•</span>
                <span className="font-mono text-emerald-400 font-bold">
                  {station.operatorName} ({station.operatorId})
                </span>
              </div>
            </div>
          </div>

          {/* Action Tools: Refresh, Switch Station, Audio Chime, Sign Out */}
          <div className="flex items-center gap-2">
            {/* Sync / Refresh Queue */}
            <button
              onClick={() => refreshOrders()}
              disabled={loading}
              className="p-2 sm:px-3 sm:py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold flex items-center gap-1.5 border border-slate-700 transition-colors shadow-sm disabled:opacity-50"
              title="Sync live orders from database"
            >
              <RefreshCw className={`h-3.5 w-3.5 text-emerald-400 ${loading ? 'animate-spin' : ''}`} />
              <span className="hidden sm:inline">Sync DB</span>
            </button>

            {/* Quick Shift / Station Switch */}
            <button
              onClick={() => setIsSwitchModalOpen(true)}
              className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold flex items-center gap-1.5 border border-slate-700 transition-colors shadow-sm"
              title="Switch Station or Operator"
            >
              <ArrowRightLeft className="h-3.5 w-3.5 text-emerald-400" />
              <span className="hidden sm:inline">Station / Shift</span>
            </button>

            {/* Audio Toggle */}
            <button
              onClick={toggleAudio}
              className={`p-2 rounded-lg border transition-colors ${
                audioEnabled
                  ? 'bg-slate-800 border-slate-700 text-emerald-400 hover:bg-slate-700'
                  : 'bg-slate-900 border-slate-800 text-slate-500 hover:text-slate-300'
              }`}
              title={audioEnabled ? 'Audio chime enabled (Click to mute)' : 'Audio chime muted (Click to enable)'}
            >
              {audioEnabled ? <Volume2 className="h-4 w-4" /> : <VolumeX className="h-4 w-4" />}
            </button>

            {/* Sign Out */}
            <Link
              href="/login"
              className="p-2 sm:px-3 sm:py-1.5 rounded-lg bg-slate-800 hover:bg-rose-950/40 hover:text-rose-300 text-slate-400 border border-slate-700 transition-colors flex items-center gap-1.5 text-xs font-semibold"
              title="Sign Out of Station"
            >
              <LogOut className="h-4 w-4" />
              <span className="hidden sm:inline">Sign Out</span>
            </Link>
          </div>
        </div>
      </header>

      {/* Switch Station Modal */}
      {isSwitchModalOpen && (
        <StationSwitchModal onClose={() => setIsSwitchModalOpen(false)} />
      )}
    </>
  );
}
