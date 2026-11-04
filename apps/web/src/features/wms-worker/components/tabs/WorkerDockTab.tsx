import React from 'react';
import { RotateCcw } from 'lucide-react';
import { InboundAsnManager } from '@/features/inbound/InboundAsnManager';

interface WorkerDockTabProps {
  onShowToast: (msg: string) => void;
}

export function WorkerDockTab({ onShowToast }: WorkerDockTabProps) {
  return (
    <div className="space-y-4">
      <InboundAsnManager
        mode="WAREHOUSE"
        onStockReceived={(sku, good, dmg) =>
          onShowToast(`Received ${sku}: +${good} Sellable, ${dmg} Quarantine`)
        }
      />

      {/* Courier Return (RTO) Quarantine & Restock Card */}
      <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold text-white flex items-center gap-1.5">
            <RotateCcw className="w-4 h-4 text-amber-400" />
            <span>Courier Return (RTO) Intake</span>
          </h3>
          <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-amber-500/10 text-amber-400 border border-amber-500/30">
            Quarantine Guard
          </span>
        </div>
        <p className="text-xs text-slate-400">
          Inspect returned courier parcels. Undamaged units return to sellable shelf; damaged units route to Quarantine Bin.
        </p>
        <div className="grid grid-cols-2 gap-2 pt-1">
          <button
            onClick={() =>
              onShowToast('RTO Restocked: +1 MC-101-HOODIE-BLK-XL to Sellable Shelf A-01-02')
            }
            className="py-2.5 px-3 rounded-lg bg-emerald-600/20 hover:bg-emerald-600/30 border border-emerald-500/40 text-emerald-300 text-xs font-bold"
          >
            ✓ Good → Restock Shelf
          </button>
          <button
            onClick={() =>
              onShowToast('RTO Damaged: Routed 1 unit to Quarantine Bin DMG-01')
            }
            className="py-2.5 px-3 rounded-lg bg-rose-600/20 hover:bg-rose-600/30 border border-rose-500/40 text-rose-300 text-xs font-bold"
          >
            ⚠ Damaged → Quarantine
          </button>
        </div>
      </div>
    </div>
  );
}
