import React from 'react';
import { Truck } from 'lucide-react';
import { WorkerOrder } from '../../types';

interface WorkerCourierTabProps {
  orders: WorkerOrder[];
  onHandoverToCourier: (courierName: string) => void;
}

export function WorkerCourierTab({
  orders,
  onHandoverToCourier,
}: WorkerCourierTabProps) {
  const steadfastReadyCount = orders.filter(
    (o) => o.stage === 'PACKED' && o.courier === 'Steadfast',
  ).length;

  const pathaoReadyCount = orders.filter(
    (o) => o.stage === 'PACKED' && o.courier === 'Pathao',
  ).length;

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-base font-bold text-white flex items-center gap-1.5">
          <Truck className="h-4 w-4 text-emerald-400" />
          <span>Courier Dispatch Handover</span>
        </h2>
        <p className="text-[11px] text-slate-400">
          Parcels packed with thermal invoices waiting for courier driver pickup.
        </p>
      </div>

      {/* Courier Dispatch Cards */}
      <div className="grid grid-cols-1 gap-3">
        {/* Steadfast Card */}
        <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="h-9 w-9 rounded-lg bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 font-bold text-sm">
                SF
              </div>
              <div>
                <h3 className="font-bold text-sm text-slate-100">Steadfast Courier</h3>
                <span className="text-[11px] text-slate-400">Direct warehouse API integrated</span>
              </div>
            </div>

            <span className="font-mono text-sm font-black text-emerald-400 bg-slate-950 px-2.5 py-1 rounded border border-slate-800">
              {steadfastReadyCount} Ready
            </span>
          </div>

          <button
            onClick={() => onHandoverToCourier('Steadfast')}
            className="w-full py-2.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold flex items-center justify-center gap-2 border border-slate-700 transition-colors"
          >
            <Truck className="h-4 w-4 text-emerald-400" />
            <span>Handover Steadfast Driver</span>
          </button>
        </div>

        {/* Pathao Card */}
        <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="h-9 w-9 rounded-lg bg-rose-500/10 border border-rose-500/30 flex items-center justify-center text-rose-400 font-bold text-sm">
                PT
              </div>
              <div>
                <h3 className="font-bold text-sm text-slate-100">Pathao Logistics</h3>
                <span className="text-[11px] text-slate-400">Express Dhaka coverage</span>
              </div>
            </div>

            <span className="font-mono text-sm font-black text-rose-400 bg-slate-950 px-2.5 py-1 rounded border border-slate-800">
              {pathaoReadyCount} Ready
            </span>
          </div>

          <button
            onClick={() => onHandoverToCourier('Pathao')}
            className="w-full py-2.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold flex items-center justify-center gap-2 border border-slate-700 transition-colors"
          >
            <Truck className="h-4 w-4 text-rose-400" />
            <span>Handover Pathao Driver</span>
          </button>
        </div>
      </div>

      {/* Manifest Summary */}
      <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
        <span className="text-xs font-bold text-slate-300 block">Today Handover History</span>
        <div className="text-xs text-slate-400 space-y-1">
          <div className="flex justify-between py-1 border-b border-slate-800/80">
            <span>Steadfast Driver Handover (10:45 AM)</span>
            <span className="font-semibold text-emerald-400">14 Parcels (Signed)</span>
          </div>
          <div className="flex justify-between py-1">
            <span>Pathao Courier Rider (09:30 AM)</span>
            <span className="font-semibold text-emerald-400">8 Parcels (Signed)</span>
          </div>
        </div>
      </div>
    </div>
  );
}
