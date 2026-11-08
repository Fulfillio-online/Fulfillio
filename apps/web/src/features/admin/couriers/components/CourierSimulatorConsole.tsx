'use client';

import React, { useState } from 'react';
import {
  Activity,
  Send,
  RefreshCw,
  CheckCircle2,
  AlertCircle,
  Truck,
  RotateCcw,
  Code2,
  ArrowRight,
  ShieldAlert,
} from 'lucide-react';
import {
  useConsignments,
  useCreateConsignment,
  useAdvanceConsignmentStatus,
  useCourierSettlements,
} from '@/lib/hooks/useCouriers';
import {
  CourierDeliveryStatus,
  CourierName,
  courierSimulator,
  ConsignmentRecord,
} from '@/lib/couriers';

export function CourierSimulatorConsole() {
  const { data: consignments = [], isLoading, refetch } = useConsignments();
  const createMutation = useCreateConsignment();
  const advanceMutation = useAdvanceConsignmentStatus();
  const { summaries } = useCourierSettlements();

  const [selectedConsignmentId, setSelectedConsignmentId] = useState<string>('CN-849201');
  const [newOrderId, setNewOrderId] = useState('ORD-99210');
  const [newCourier, setNewCourier] = useState<CourierName>('Steadfast');
  const [newCity, setNewCity] = useState('Dhaka');
  const [newCod, setNewCod] = useState(1850);
  const [lastWebhookPayload, setLastWebhookPayload] = useState<string | null>(null);
  const [actionSuccessNotice, setActionSuccessNotice] = useState<string | null>(null);

  const selectedConsignment = consignments.find((c) => c.consignmentId === selectedConsignmentId) || consignments[0];

  const handleCreateMockConsignment = (e: React.FormEvent) => {
    e.preventDefault();
    createMutation.mutate(
      {
        orderId: newOrderId,
        merchantCode: 'MC-101',
        courier: newCourier,
        customerName: 'Kazi Farhan',
        customerPhone: '01711-002233',
        customerAddress: 'House 8, Road 12, Dhanmondi',
        city: newCity,
        codAmount: Number(newCod),
      },
      {
        onSuccess: (record) => {
          setSelectedConsignmentId(record.consignmentId);
          setActionSuccessNotice(`Created mock consignment ${record.consignmentId} (${record.trackingCode})!`);
          setNewOrderId(`ORD-${Math.floor(99200 + Math.random() * 800)}`);
        },
      },
    );
  };

  const handleAdvanceStatus = (status: CourierDeliveryStatus) => {
    if (!selectedConsignment) return;

    advanceMutation.mutate(
      {
        consignmentId: selectedConsignment.consignmentId,
        status,
      },
      {
        onSuccess: (updated) => {
          const payload = courierSimulator.generateWebhookPayload(updated);
          setLastWebhookPayload(JSON.stringify(payload, null, 2));
          setActionSuccessNotice(
            `Consignment ${updated.consignmentId} advanced to ${status}. Simulated Webhook emitted!`,
          );
        },
      },
    );
  };

  return (
    <div className="space-y-6">
      {/* Banner */}
      <div className="bg-white dark:bg-navy-900 border border-slate-200 dark:border-white/10 rounded-2xl p-4 sm:p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-start sm:items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/30 flex items-center justify-center text-indigo-600 dark:text-indigo-400 shrink-0">
            <Activity className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base sm:text-lg font-bold text-navy-800 dark:text-white">
                Internal Courier Sandbox &amp; Webhook Simulator
              </h2>
              <span className="px-2 py-0.5 rounded text-[11px] tabular-nums font-bold bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30">
                TanStack Query Powered
              </span>
            </div>
            <p className="text-xs text-slate-600 dark:text-slate-300 mt-0.5">
              Simulate end-to-end Bangladeshi courier lifecycle (Steadfast, Pathao, RedX) without third-party production keys.
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => {
            courierSimulator.resetToDefaults();
            refetch();
            setActionSuccessNotice('Reset courier simulator queue to default seeded states.');
          }}
          className="px-3 py-2 rounded-xl bg-slate-100 dark:bg-navy-800 hover:bg-slate-200 dark:hover:bg-navy-700 text-xs font-semibold text-slate-700 dark:text-slate-200 inline-flex items-center gap-1.5 self-start md:self-auto transition-colors"
        >
          <RotateCcw className="w-3.5 h-3.5 text-slate-600 dark:text-slate-300" />
          <span>Reset Sandbox Data</span>
        </button>
      </div>

      {actionSuccessNotice && (
        <div className="p-3.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/70 border border-emerald-500/40 text-emerald-800 dark:text-emerald-200 text-xs font-semibold flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-orange-600 dark:text-orange-400 shrink-0" />
            <span>{actionSuccessNotice}</span>
          </div>
          <button
            type="button"
            onClick={() => setActionSuccessNotice(null)}
            className="text-xs text-orange-700 dark:text-orange-300 hover:text-navy-800 dark:hover:text-white"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Settlements Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {summaries.map((s) => (
          <div
            key={s.courier}
            className="bg-white dark:bg-navy-900 border border-slate-200 dark:border-white/10 rounded-xl p-3.5 space-y-1.5"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-navy-800 dark:text-slate-100">{s.courier} COD Pool</span>
              <span className="text-[11px] tabular-nums font-bold px-1.5 py-0.5 rounded bg-slate-100 dark:bg-navy-800 text-orange-600 dark:text-orange-400">
                {s.totalConsignments} parcels
              </span>
            </div>
            <div className="flex items-baseline justify-between">
              <span className="text-xs text-slate-600 dark:text-slate-300">Net Merchant Payout:</span>
              <span className="text-base font-extrabold tabular-nums text-orange-600 dark:text-orange-400">
                ৳{s.netPayableToMerchant.toLocaleString()}
              </span>
            </div>
            <div className="text-xs tabular-nums text-slate-500 dark:text-slate-400 flex justify-between pt-1 border-t border-slate-200/80 dark:border-white/10">
              <span>COD Collected: ৳{s.totalCodCollected.toLocaleString()}</span>
              <span>Fees: ৳{(s.totalDeliveryFee + s.totalCodFee).toLocaleString()}</span>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Left Column: Quick Create & Consignment List (5 cols) */}
        <div className="lg:col-span-5 space-y-4">
          {/* Create Mock Booking Card */}
          <div className="bg-white dark:bg-navy-900 border border-slate-200 dark:border-white/10 rounded-xl p-4 space-y-3">
            <h3 className="text-xs font-bold text-slate-700 dark:text-slate-200 uppercase tracking-wider flex items-center gap-1.5">
              <Send className="w-3.5 h-3.5 text-orange-600 dark:text-orange-400" />
              <span>Simulate Consignment Booking API</span>
            </h3>

            <form onSubmit={handleCreateMockConsignment} className="space-y-2.5 text-xs">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-xs text-slate-600 dark:text-slate-300 block mb-1">Order ID</label>
                  <input
                    type="text"
                    value={newOrderId}
                    onChange={(e) => setNewOrderId(e.target.value)}
                    className="w-full px-2.5 py-1.5 rounded-lg bg-slate-50 dark:bg-navy-950 border border-slate-200 dark:border-white/10 tabular-nums text-navy-800 dark:text-slate-100"
                    required
                  />
                </div>
                <div>
                  <label className="text-xs text-slate-600 dark:text-slate-300 block mb-1">Courier</label>
                  <select
                    value={newCourier}
                    onChange={(e) => setNewCourier(e.target.value as CourierName)}
                    className="w-full px-2.5 py-1.5 rounded-lg bg-slate-50 dark:bg-navy-950 border border-slate-200 dark:border-white/10 text-navy-800 dark:text-slate-100 font-medium"
                  >
                    <option value="Steadfast">Steadfast</option>
                    <option value="Pathao">Pathao</option>
                    <option value="RedX">RedX</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-xs text-slate-600 dark:text-slate-300 block mb-1">City Hub</label>
                  <select
                    value={newCity}
                    onChange={(e) => setNewCity(e.target.value)}
                    className="w-full px-2.5 py-1.5 rounded-lg bg-slate-50 dark:bg-navy-950 border border-slate-200 dark:border-white/10 text-navy-800 dark:text-slate-100"
                  >
                    <option value="Dhaka">Dhaka (Inside ৳60)</option>
                    <option value="Chattogram">Chattogram (Outside ৳120)</option>
                    <option value="Sylhet">Sylhet (Outside ৳120)</option>
                    <option value="Rajshahi">Rajshahi (Outside ৳120)</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs text-slate-600 dark:text-slate-300 block mb-1">COD Amount (৳)</label>
                  <input
                    type="number"
                    value={newCod}
                    onChange={(e) => setNewCod(Number(e.target.value))}
                    className="w-full px-2.5 py-1.5 rounded-lg bg-slate-50 dark:bg-navy-950 border border-slate-200 dark:border-white/10 tabular-nums text-navy-800 dark:text-slate-100"
                    required
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={createMutation.isPending}
                className="w-full mt-2 py-2 rounded-lg bg-orange-600 hover:bg-orange-700 font-bold text-white text-xs flex items-center justify-center gap-1.5 shadow transition-all"
              >
                {createMutation.isPending ? (
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Send className="w-3.5 h-3.5" />
                )}
                <span>Book Consignment in Simulator</span>
              </button>
            </form>
          </div>

          {/* Consignments List */}
          <div className="bg-white dark:bg-navy-900 border border-slate-200 dark:border-white/10 rounded-xl p-4 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-700 dark:text-slate-200 uppercase tracking-wider">
                Simulated Consignments ({consignments.length})
              </span>
              {isLoading && <RefreshCw className="w-3.5 h-3.5 animate-spin text-slate-600 dark:text-slate-300" />}
            </div>

            <div className="space-y-2 max-h-[380px] overflow-y-auto pr-1">
              {consignments.map((c) => {
                const isSelected = c.consignmentId === selectedConsignment?.consignmentId;
                return (
                  <div
                    key={c.consignmentId}
                    onClick={() => setSelectedConsignmentId(c.consignmentId)}
                    className={`p-3 rounded-lg border cursor-pointer transition-all ${
                      isSelected
                        ? 'bg-emerald-50 dark:bg-emerald-950/30 border-emerald-500/60 shadow-md'
                        : 'bg-slate-50 dark:bg-navy-950 border-slate-200 dark:border-white/10 hover:border-slate-300 dark:hover:border-white/15'
                    }`}
                  >
                    <div className="flex items-center justify-between text-xs">
                      <span className="tabular-nums font-bold text-orange-600 dark:text-orange-400">{c.consignmentId}</span>
                      <span className="px-1.5 py-0.5 rounded text-[11px] tabular-nums font-bold bg-slate-100 dark:bg-navy-800 text-slate-700 dark:text-slate-200">
                        {c.courier}
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-xs text-slate-600 dark:text-slate-300 mt-1">
                      <span>{c.orderId} • {c.customerName}</span>
                      <span className="tabular-nums text-navy-800 dark:text-white font-bold">৳{c.codAmount}</span>
                    </div>

                    <div className="flex items-center justify-between text-[11px] tabular-nums mt-1 pt-1 border-t border-slate-200/60 dark:border-white/10">
                      <span className="text-indigo-600 dark:text-indigo-400">{c.trackingCode}</span>
                      <span
                        className={`font-bold ${
                          c.status === 'DELIVERED'
                            ? 'text-orange-600 dark:text-orange-400'
                            : c.status === 'RETURNED_TO_ORIGIN'
                            ? 'text-rose-600 dark:text-rose-400'
                            : 'text-amber-600 dark:text-amber-400'
                        }`}
                      >
                        {c.status}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right Column: Live Tracking Timeline & Webhook Dispatcher (7 cols) */}
        <div className="lg:col-span-7 space-y-4">
          {selectedConsignment ? (
            <div className="bg-white dark:bg-navy-900 border border-slate-200 dark:border-white/10 rounded-xl p-4 sm:p-5 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-200 dark:border-white/10 pb-3">
                <div>
                  <span className="text-xs tabular-nums text-orange-600 dark:text-orange-400 uppercase font-bold">
                    Active Consignment Inspector
                  </span>
                  <h3 className="text-base font-bold text-navy-800 dark:text-white">
                    {selectedConsignment.consignmentId} ({selectedConsignment.trackingCode})
                  </h3>
                  <p className="text-xs text-slate-600 dark:text-slate-300 mt-0.5">
                    Order: <strong className="text-navy-800 dark:text-slate-100">{selectedConsignment.orderId}</strong> • Customer: {selectedConsignment.customerName} ({selectedConsignment.city})
                  </p>
                </div>

                <div className="text-right">
                  <span className="text-xs text-slate-600 dark:text-slate-300 block">Current Status</span>
                  <span className="inline-block mt-0.5 px-2.5 py-0.5 rounded-full text-xs tabular-nums font-bold bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30">
                    {selectedConsignment.status}
                  </span>
                </div>
              </div>

              {/* Status Transition Action Buttons */}
              <div>
                <span className="text-xs font-bold text-slate-700 dark:text-slate-200 block mb-2">
                  1-Click Dispatch Status Transitions:
                </span>
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => handleAdvanceStatus('PICKED_UP')}
                    disabled={advanceMutation.isPending}
                    className="px-2.5 py-1.5 rounded-lg bg-slate-100 dark:bg-navy-800 hover:bg-slate-200 dark:hover:bg-navy-700 text-xs font-semibold text-navy-800 dark:text-slate-100 border border-slate-300 dark:border-white/15 transition-colors"
                  >
                    → Rider Picked Up
                  </button>
                  <button
                    type="button"
                    onClick={() => handleAdvanceStatus('IN_TRANSIT')}
                    disabled={advanceMutation.isPending}
                    className="px-2.5 py-1.5 rounded-lg bg-slate-100 dark:bg-navy-800 hover:bg-slate-200 dark:hover:bg-navy-700 text-xs font-semibold text-navy-800 dark:text-slate-100 border border-slate-300 dark:border-white/15 transition-colors"
                  >
                    → Sorting Hub (In Transit)
                  </button>
                  <button
                    type="button"
                    onClick={() => handleAdvanceStatus('OUT_FOR_DELIVERY')}
                    disabled={advanceMutation.isPending}
                    className="px-2.5 py-1.5 rounded-lg bg-slate-100 dark:bg-navy-800 hover:bg-slate-200 dark:hover:bg-navy-700 text-xs font-semibold text-amber-700 dark:text-amber-300 border border-amber-500/30 transition-colors"
                  >
                    → Out for Delivery
                  </button>
                  <button
                    type="button"
                    onClick={() => handleAdvanceStatus('DELIVERED')}
                    disabled={advanceMutation.isPending}
                    className="px-2.5 py-1.5 rounded-lg bg-orange-600 hover:bg-orange-700 text-xs font-bold text-white transition-colors shadow"
                  >
                    ✓ Delivered (COD Collected)
                  </button>
                  <button
                    type="button"
                    onClick={() => handleAdvanceStatus('RETURNED_TO_ORIGIN')}
                    disabled={advanceMutation.isPending}
                    className="px-2.5 py-1.5 rounded-lg bg-rose-50 dark:bg-rose-950/60 hover:bg-rose-100 dark:hover:bg-rose-900/80 text-xs font-bold text-rose-700 dark:text-rose-300 border border-rose-500/30 transition-colors"
                  >
                    ⚠ Refused (RTO)
                  </button>
                </div>
              </div>

              {/* Sequential Timeline Checkpoints */}
              <div className="space-y-2 pt-2">
                <span className="text-xs font-bold text-slate-700 dark:text-slate-200 block">
                  Simulated Real-Time Tracking Checkpoints:
                </span>
                <div className="space-y-2 border-l-2 border-orange-500/40 ml-2 pl-3">
                  {selectedConsignment.checkpoints.map((pt, idx) => (
                    <div key={idx} className="relative text-xs">
                      <div className="absolute -left-[19px] top-1 w-2.5 h-2.5 rounded-full bg-orange-400 border border-slate-100 dark:border-white/5" />
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-bold text-orange-700 dark:text-orange-300 tabular-nums">{pt.statusLabel}</span>
                        <span className="text-slate-600 dark:text-slate-300 tabular-nums">{pt.timestamp}</span>
                      </div>
                      <p className="text-slate-700 dark:text-slate-200 text-xs mt-0.5">{pt.location}</p>
                      <p className="text-slate-600 dark:text-slate-300 text-[11px] italic">{pt.notes}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Webhook JSON Output */}
              {lastWebhookPayload && (
                <div className="pt-2 border-t border-slate-200 dark:border-white/10 space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-700 dark:text-slate-200 flex items-center gap-1.5">
                      <Code2 className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
                      <span>Simulated Webhook Payload (POST /api/shipping/webhooks/{selectedConsignment.courier.toLowerCase()})</span>
                    </span>
                    <span className="text-[11px] tabular-nums text-orange-600 dark:text-orange-400">200 OK Accepted</span>
                  </div>
                  <pre className="p-3 rounded-lg bg-slate-50 dark:bg-navy-950 border border-slate-200 dark:border-white/10 text-xs tabular-nums text-slate-700 dark:text-slate-200 overflow-x-auto">
                    {lastWebhookPayload}
                  </pre>
                </div>
              )}
            </div>
          ) : (
            <div className="p-8 text-center bg-white dark:bg-navy-900 border border-slate-200 dark:border-white/10 rounded-xl text-slate-600 dark:text-slate-300">
              Select or create a consignment to inspect simulation data.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default CourierSimulatorConsole;
