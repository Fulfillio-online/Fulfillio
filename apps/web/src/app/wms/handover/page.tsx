'use client';

import React, { useState } from 'react';
import {
  Truck,
  CheckCircle2,
  FileText,
  Printer,
  X,
  UserCheck,
  ShieldCheck,
  Phone,
  ArrowRight,
} from 'lucide-react';
import { useWms, BarcodeScannerBar, WmsOrder } from '@/features/wms';

export default function WmsHandoverPage() {
  const { orders, handoverToCourier, playAudio, showToast } = useWms();
  const [selectedCourier, setSelectedCourier] = useState<'Steadfast' | 'Pathao' | 'RedX'>('Steadfast');
  const [riderName, setRiderName] = useState('Kamrul Hassan');
  const [riderPhone, setRiderPhone] = useState('01711223344');
  const [showManifestModal, setShowManifestModal] = useState(false);

  const bookedOrders = orders.filter((o) => o.stage === 'BOOKED');
  const currentCourierOrders = bookedOrders.filter((o) => o.courier === selectedCourier);
  const dispatchedOrders = orders.filter((o) => o.stage === 'DISPATCHED');

  const handleScan = (code: string) => {
    const target = bookedOrders.find(
      (o) =>
        o.id.toUpperCase() === code.toUpperCase() ||
        (o.trackingNumber && o.trackingNumber.toUpperCase() === code.toUpperCase()),
    );

    if (target) {
      showToast(`Parcel ${target.id} (${target.trackingNumber}) verified for ${target.courier} manifest!`);
      playAudio('success');
    } else {
      playAudio('error');
      showToast(`Scanned code "${code}" not found in current booked queue!`);
    }
  };

  const handleConfirmHandover = () => {
    if (currentCourierOrders.length === 0) {
      showToast(`No booked parcels waiting for ${selectedCourier}!`);
      return;
    }
    handoverToCourier(selectedCourier, riderName);
    setShowManifestModal(false);
  };

  const totalCodForCourier = currentCourierOrders.reduce((sum, o) => sum + o.amount, 0);

  return (
    <div className="space-y-6">
      {/* Step Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 rounded bg-teal-500/10 text-teal-400 font-mono text-[10px] font-bold border border-teal-500/30">
              PIPELINE STEP 4 OF 4 (FINAL)
            </span>
            <span className="text-xs text-slate-400 font-mono">
              Total {bookedOrders.length} parcels waiting for driver pickup
            </span>
          </div>
          <h1 className="text-xl font-black text-white tracking-tight mt-1 flex items-center gap-2">
            <Truck className="h-5 w-5 text-teal-400" />
            <span>Courier Handover &amp; Manifest Sheet</span>
          </h1>
          <p className="text-xs text-slate-400">
            Hand over sealed parcels to courier driver, print signed manifest sheet, and dispatch shipments.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {currentCourierOrders.length > 0 && (
            <button
              onClick={() => setShowManifestModal(true)}
              className="px-4 py-2 rounded-xl bg-teal-600 hover:bg-teal-500 text-white font-bold text-xs flex items-center gap-2 shadow-md transition-all active:scale-95"
            >
              <FileText className="h-4 w-4" />
              <span>Generate {selectedCourier} Manifest</span>
            </button>
          )}
        </div>
      </div>

      {/* Barcode Scanner Bar */}
      <BarcodeScannerBar
        placeholder="Scan tracking barcode or Order ID to verify parcel into manifest..."
        onScan={handleScan}
      />

      {/* Courier Selector Tabs */}
      <div className="grid grid-cols-3 gap-3">
        {(['Steadfast', 'Pathao', 'RedX'] as const).map((courier) => {
          const count = bookedOrders.filter((o) => o.courier === courier).length;
          const isSelected = selectedCourier === courier;

          return (
            <div
              key={courier}
              onClick={() => setSelectedCourier(courier)}
              className={`p-4 rounded-2xl border cursor-pointer transition-all flex items-center justify-between ${
                isSelected
                  ? 'bg-slate-900 border-teal-500/60 shadow-lg ring-1 ring-teal-500/20'
                  : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
              }`}
            >
              <div>
                <span className={`font-bold text-sm block ${isSelected ? 'text-white' : 'text-slate-300'}`}>
                  {courier} Express
                </span>
                <span className="text-[11px] text-slate-400">
                  {count} parcel{count === 1 ? '' : 's'} waiting
                </span>
              </div>
              <span
                className={`font-mono text-xs font-bold px-2.5 py-1 rounded-lg ${
                  count > 0
                    ? 'bg-teal-500/20 text-teal-300 border border-teal-500/40'
                    : 'bg-slate-800 text-slate-500'
                }`}
              >
                {count}
              </span>
            </div>
          );
        })}
      </div>

      {/* Current Courier Order Queue */}
      {currentCourierOrders.length === 0 ? (
        <div className="p-12 text-center rounded-2xl bg-slate-900/60 border border-slate-800 space-y-3">
          <CheckCircle2 className="h-12 w-12 text-teal-400 mx-auto" />
          <h2 className="font-extrabold text-base text-white">
            No Booked Parcels Waiting for {selectedCourier}
          </h2>
          <p className="text-xs text-slate-400 max-w-md mx-auto">
            All parcels booked for {selectedCourier} have already been handed over, or are still in Step 1-3. Select another courier tab or process incoming orders.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider">
              {selectedCourier} Ready for Handover ({currentCourierOrders.length})
            </h3>
            <span className="text-xs font-mono text-emerald-400 font-bold">
              Total COD: ৳ {totalCodForCourier.toLocaleString()}
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {currentCourierOrders.map((order) => (
              <div
                key={order.id}
                className="p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-3 hover:border-slate-700 transition-all shadow-md"
              >
                <div className="flex items-center justify-between border-b border-slate-800/80 pb-2">
                  <span className="font-mono text-xs font-bold text-slate-100 bg-slate-950 px-2 py-0.5 rounded border border-slate-800">
                    {order.id}
                  </span>
                  <span className="font-mono text-xs font-black text-teal-300 bg-teal-500/10 px-2.5 py-0.5 rounded border border-teal-500/30">
                    {order.trackingNumber}
                  </span>
                </div>

                <div>
                  <h4 className="font-bold text-sm text-white">{order.itemTitle}</h4>
                  <div className="text-xs text-slate-400 mt-1">
                    To: <span className="text-slate-200 font-semibold">{order.customer}</span> • {order.address}, {order.city}
                  </div>
                </div>

                <div className="pt-2 flex items-center justify-between text-xs border-t border-slate-800/80">
                  <span className="text-slate-400">
                    COD: <span className="font-mono text-emerald-400 font-bold">৳ {order.amount.toLocaleString()}</span>
                  </span>
                  <span className="text-[11px] text-slate-400 font-mono">
                    Booked: {order.bookedAt || 'Recently'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Dispatched History */}
      {dispatchedOrders.length > 0 && (
        <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-emerald-400" />
              <span>Today Handed Over &amp; Dispatched ({dispatchedOrders.length})</span>
            </h3>
            <span className="text-xs font-mono text-slate-400">Live Session</span>
          </div>

          <div className="divide-y divide-slate-800/80 text-xs">
            {dispatchedOrders.map((order) => (
              <div key={order.id} className="py-2.5 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <span className="font-mono font-bold text-slate-200">{order.id}</span>
                  <span className="text-slate-400">•</span>
                  <span className="text-slate-300">{order.customer}</span>
                  <span className="text-slate-500 font-mono text-[11px]">({order.courier})</span>
                </div>

                <div className="flex items-center gap-3">
                  <span className="font-mono text-teal-400 font-semibold text-[11px]">
                    {order.trackingNumber || 'Manifested'}
                  </span>
                  <span className="px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 font-mono font-bold text-[10px] border border-emerald-500/30">
                    DISPATCHED
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Manifest Sheet Printable Modal */}
      {showManifestModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="w-full max-w-xl bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            {/* Modal Header */}
            <div className="p-4 bg-slate-950 border-b border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="h-8 w-8 rounded-lg bg-teal-500/10 border border-teal-500/30 flex items-center justify-center text-teal-400">
                  <FileText className="h-4 w-4" />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-white">Courier Handover Manifest Sheet</h3>
                  <p className="text-[11px] text-slate-400">Partner: {selectedCourier} Express</p>
                </div>
              </div>
              <button
                onClick={() => setShowManifestModal(false)}
                className="p-1 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-slate-200 transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Rider Info Input */}
            <div className="p-4 bg-slate-900 border-b border-slate-800 grid grid-cols-2 gap-3 text-xs">
              <div>
                <label className="text-slate-400 block mb-1 font-semibold">Rider Name:</label>
                <input
                  type="text"
                  value={riderName}
                  onChange={(e) => setRiderName(e.target.value)}
                  className="w-full px-3 py-1.5 bg-slate-950 border border-slate-700 rounded-lg text-slate-100 font-semibold focus:outline-none focus:border-teal-500"
                />
              </div>
              <div>
                <label className="text-slate-400 block mb-1 font-semibold">Rider Phone:</label>
                <input
                  type="text"
                  value={riderPhone}
                  onChange={(e) => setRiderPhone(e.target.value)}
                  className="w-full px-3 py-1.5 bg-slate-950 border border-slate-700 rounded-lg text-slate-100 font-semibold focus:outline-none focus:border-teal-500"
                />
              </div>
            </div>

            {/* Printable Manifest Preview */}
            <div className="p-4 overflow-y-auto flex-1 bg-slate-950">
              <div className="bg-white text-black p-5 rounded-lg font-sans text-xs border border-slate-300 space-y-3">
                <div className="border-b-2 border-black pb-2 text-center">
                  <h2 className="text-base font-black uppercase">Fulfillio 3PL Warehouse</h2>
                  <div className="text-xs font-bold text-slate-700 uppercase">
                    Official Courier Handover Manifest Sheet
                  </div>
                  <div className="text-[10px] text-slate-600 font-mono">
                    Courier: {selectedCourier} Express • Hub: Dhaka Central • Date: {new Date().toLocaleDateString()}
                  </div>
                </div>

                <div className="grid grid-cols-2 text-[11px] py-1 border-b border-slate-300">
                  <div>
                    Rider: <span className="font-bold">{riderName}</span> ({riderPhone})
                  </div>
                  <div className="text-right">
                    Total Parcels: <span className="font-black text-sm">{currentCourierOrders.length} pcs</span>
                  </div>
                </div>

                {/* Table of Orders */}
                <table className="w-full text-left text-[10px] border-collapse">
                  <thead>
                    <tr className="border-b border-black text-slate-700 uppercase font-bold">
                      <th className="py-1">#</th>
                      <th className="py-1">Order Ref</th>
                      <th className="py-1">Tracking ID</th>
                      <th className="py-1">Recipient</th>
                      <th className="py-1 text-right">COD</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {currentCourierOrders.map((order, idx) => (
                      <tr key={order.id} className="py-1">
                        <td className="py-1 text-slate-500">{idx + 1}</td>
                        <td className="py-1 font-mono font-bold">{order.id}</td>
                        <td className="py-1 font-mono font-bold">{order.trackingNumber}</td>
                        <td className="py-1 truncate max-w-[120px]">{order.customer}</td>
                        <td className="py-1 text-right font-bold">৳ {order.amount.toLocaleString()}</td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr className="border-t-2 border-black font-black text-xs">
                      <td colSpan={4} className="py-2 uppercase">Total COD Payable:</td>
                      <td className="py-2 text-right">৳ {totalCodForCourier.toLocaleString()}</td>
                    </tr>
                  </tfoot>
                </table>

                {/* Signatures */}
                <div className="grid grid-cols-2 gap-4 pt-6 text-[10px]">
                  <div className="border-t border-slate-400 pt-1 text-center">
                    Warehouse Dispatcher Signature
                  </div>
                  <div className="border-t border-slate-400 pt-1 text-center font-bold">
                    Courier Rider Signature &amp; Stamp
                  </div>
                </div>
              </div>
            </div>

            {/* Modal Actions */}
            <div className="p-4 bg-slate-950 border-t border-slate-800 flex items-center justify-between">
              <button
                onClick={() => window.print()}
                className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold flex items-center gap-1.5 border border-slate-700"
              >
                <Printer className="h-4 w-4" />
                <span>Print Manifest</span>
              </button>

              <button
                onClick={handleConfirmHandover}
                className="px-5 py-2 rounded-xl bg-teal-600 hover:bg-teal-500 text-white text-xs font-bold transition-all shadow-lg active:scale-95 flex items-center gap-2"
              >
                <CheckCircle2 className="h-4 w-4" />
                <span>Confirm Handover &amp; Dispatch</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
