import React from 'react';
import { Printer, CheckCircle2 } from 'lucide-react';
import { WorkerOrder } from '../../types';

interface WorkerPackTabProps {
  packList: WorkerOrder[];
  selectedPackCount: number;
  onToggleSelectPack: (orderId: string) => void;
  onSelectAllForPack: () => void;
  onPrintAndPackSelected: () => void;
}

export function WorkerPackTab({
  packList,
  selectedPackCount,
  onToggleSelectPack,
  onSelectAllForPack,
  onPrintAndPackSelected,
}: WorkerPackTabProps) {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-base font-bold text-white flex items-center gap-1.5">
            <Printer className="h-4 w-4 text-emerald-400" />
            <span>Pack &amp; Print Reseller Memo</span>
          </h2>
          <p className="text-[11px] text-slate-400">
            Select items packed into flyer bags and print 4x6 thermal slips.
          </p>
        </div>

        {packList.length > 0 && (
          <button
            onClick={onSelectAllForPack}
            className="text-xs font-semibold text-emerald-400 hover:text-emerald-300"
          >
            Toggle All
          </button>
        )}
      </div>

      {packList.length === 0 ? (
        <div className="p-8 text-center rounded-2xl bg-slate-900/60 border border-slate-800 space-y-2">
          <CheckCircle2 className="h-10 w-10 text-emerald-400 mx-auto" />
          <h3 className="font-bold text-sm text-slate-200">No Items Awaiting Pack</h3>
          <p className="text-xs text-slate-400">
            Go to Pick List to collect items from shelves.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {packList.map((order) => (
            <div
              key={order.id}
              onClick={() => onToggleSelectPack(order.id)}
              className={`p-4 rounded-xl border transition-all cursor-pointer space-y-2.5 ${
                order.selectedForPack
                  ? 'bg-emerald-950/30 border-emerald-500/60 shadow-lg'
                  : 'bg-slate-900 border-slate-800'
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={order.selectedForPack}
                    onChange={() => {}} // Controlled by container onClick
                    className="h-4 w-4 rounded bg-slate-950 border-slate-700 text-emerald-600 focus:ring-0"
                  />
                  <span className="font-mono text-xs font-bold text-slate-200">
                    {order.id}
                  </span>
                </div>

                <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-indigo-500/10 text-indigo-400 border border-indigo-500/30">
                  {order.memoCode}
                </span>
              </div>

              <div>
                <span className="font-extrabold text-sm text-slate-100 block">
                  {order.itemTitle} ({order.variant})
                </span>
                <span className="text-xs text-slate-400">
                  Customer: {order.customer} • {order.address}
                </span>
              </div>

              <div className="flex items-center justify-between text-xs pt-1 border-t border-slate-800/80">
                <span className="text-slate-400">
                  Courier: <span className="font-semibold text-slate-200">{order.courier}</span>
                </span>
                <span className="font-bold text-emerald-400">৳ {order.amount.toLocaleString()}</span>
              </div>
            </div>
          ))}

          {/* Big Action Button (Sticky for mobile packers) */}
          <div className="p-3 bg-slate-900 border border-slate-800 rounded-xl space-y-2">
            <div className="flex items-center justify-between text-xs text-slate-400">
              <span>Selected for batch printing:</span>
              <span className="font-bold text-emerald-400 font-mono">
                {selectedPackCount} parcel(s)
              </span>
            </div>

            <button
              onClick={onPrintAndPackSelected}
              disabled={selectedPackCount === 0}
              className={`w-full py-3.5 px-4 rounded-xl text-sm font-black flex items-center justify-center gap-2 shadow-lg transition-all ${
                selectedPackCount > 0
                  ? 'bg-emerald-600 hover:bg-emerald-500 text-white cursor-pointer active:scale-98'
                  : 'bg-slate-800 text-slate-500 cursor-not-allowed'
              }`}
            >
              <Printer className="h-5 w-5" />
              <span>Print 4x6 Thermal Memo ({selectedPackCount})</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
