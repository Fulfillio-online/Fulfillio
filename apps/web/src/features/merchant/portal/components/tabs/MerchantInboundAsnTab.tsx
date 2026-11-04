'use client';

import React, { useState } from 'react';
import {
  Truck,
  Plus,
  Search,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Boxes,
  MapPin,
  ExternalLink,
} from 'lucide-react';
import { MerchantAsnRecord, MerchantProductItem } from '../../types';
import { CreateInboundAsnModal } from '../modals/CreateInboundAsnModal';

interface MerchantInboundAsnTabProps {
  asns: MerchantAsnRecord[];
  products: MerchantProductItem[];
  onCreateAsn: (asn: MerchantAsnRecord) => void;
  onTriggerToast: (msg: string) => void;
}

export function MerchantInboundAsnTab({
  asns,
  products,
  onCreateAsn,
  onTriggerToast,
}: MerchantInboundAsnTabProps) {
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'IN_TRANSIT' | 'ARRIVED_AT_DOCK' | 'COMPLETED'>('ALL');

  const filteredAsns = asns.filter((a) => {
    const matchSearch =
      a.asnCode.toLowerCase().includes(search.toLowerCase()) ||
      a.carrierName.toLowerCase().includes(search.toLowerCase()) ||
      a.trackingRef.toLowerCase().includes(search.toLowerCase());
    if (!matchSearch) return false;
    if (statusFilter !== 'ALL' && a.status !== statusFilter) return false;
    return true;
  });

  const inTransitCount = asns.filter((a) => a.status === 'IN_TRANSIT').length;
  const arrivedDockCount = asns.filter((a) => a.status === 'ARRIVED_AT_DOCK').length;
  const completedCount = asns.filter((a) => a.status === 'COMPLETED').length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-100 flex items-center gap-2">
            <Truck className="h-6 w-6 text-emerald-400 shrink-0" />
            <span>Inbound ASNs & Warehouse Intake</span>
          </h1>
          <p className="text-sm text-slate-400 mt-0.5">
            Advance Shipping Notices (ASNs) for goods sent to Fulfillio central warehouse.
          </p>
        </div>

        <button
          onClick={() => setIsCreateOpen(true)}
          className="w-full sm:w-auto px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-semibold flex items-center justify-center gap-2 transition-colors shadow-sm shrink-0"
        >
          <Plus className="h-4 w-4" />
          <span>Create Inbound ASN</span>
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-4 sm:p-5 rounded-xl bg-slate-900 border border-slate-800 shadow-sm">
          <div className="flex items-center justify-between text-slate-400 text-xs font-semibold">
            <span>In-Transit Parcels</span>
            <Truck className="h-4 w-4 text-amber-400" />
          </div>
          <div className="text-2xl font-bold mt-2 text-slate-100">{inTransitCount} Shipments</div>
          <span className="text-[11px] text-amber-400/90 mt-1 inline-block">
            Expected within 24-48 hours
          </span>
        </div>

        <div className="p-4 sm:p-5 rounded-xl bg-slate-900 border border-slate-800 shadow-sm">
          <div className="flex items-center justify-between text-slate-400 text-xs font-semibold">
            <span>Arrived at Dock Bay</span>
            <Clock className="h-4 w-4 text-indigo-400" />
          </div>
          <div className="text-2xl font-bold mt-2 text-slate-100">{arrivedDockCount} Shipments</div>
          <span className="text-[11px] text-indigo-400 mt-1 inline-block">
            Under physical inspection & sorting
          </span>
        </div>

        <div className="p-4 sm:p-5 rounded-xl bg-slate-900 border border-slate-800 shadow-sm">
          <div className="flex items-center justify-between text-slate-400 text-xs font-semibold">
            <span>Put-Away Completed</span>
            <CheckCircle2 className="h-4 w-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-bold mt-2 text-emerald-400">{completedCount} Shipments</div>
          <span className="text-[11px] text-slate-400 mt-1 inline-block">
            100% added to live sellable inventory
          </span>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-500" />
          <input
            type="text"
            placeholder="Search ASN code, carrier, or chalan #..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 bg-slate-900 border border-slate-800 rounded-lg text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
          />
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
          {(['ALL', 'IN_TRANSIT', 'ARRIVED_AT_DOCK', 'COMPLETED'] as const).map((filter) => (
            <button
              key={filter}
              onClick={() => setStatusFilter(filter)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors ${
                statusFilter === filter
                  ? 'bg-slate-800 text-emerald-400 border border-emerald-500/40'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
              }`}
            >
              {filter === 'ALL'
                ? 'All ASNs'
                : filter === 'IN_TRANSIT'
                ? 'In Transit'
                : filter === 'ARRIVED_AT_DOCK'
                ? 'At Dock'
                : 'Completed'}
            </button>
          ))}
        </div>
      </div>

      {/* ASNs Table */}
      <div className="rounded-xl border border-slate-800 bg-slate-900 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[720px] text-left text-sm">
            <thead className="bg-slate-800/80 text-slate-400 text-xs uppercase tracking-wider font-semibold border-b border-slate-800">
              <tr>
                <th className="p-4">ASN Code & Date</th>
                <th className="p-4">Carrier & Tracking</th>
                <th className="p-4">SKU Contents</th>
                <th className="p-4 text-center">Expected Qty</th>
                <th className="p-4 text-center">Received / Damaged</th>
                <th className="p-4">Dock Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {filteredAsns.map((asn) => {
                const totalExpected = asn.items.reduce((s, it) => s + it.expectedQty, 0);
                const totalReceived = asn.items.reduce((s, it) => s + it.receivedGoodQty, 0);
                const totalDamaged = asn.items.reduce((s, it) => s + it.receivedDamagedQty, 0);

                return (
                  <tr key={asn.id} className="hover:bg-slate-800/40 transition-colors">
                    <td className="p-4">
                      <span className="font-mono text-xs font-bold text-slate-200 block">
                        {asn.asnCode}
                      </span>
                      <span className="text-[11px] text-slate-500">{asn.createdAt}</span>
                    </td>

                    <td className="p-4">
                      <div className="font-semibold text-xs text-slate-200">{asn.carrierName}</div>
                      <span className="font-mono text-[11px] text-emerald-400">
                        {asn.trackingRef}
                      </span>
                    </td>

                    <td className="p-4 max-w-xs">
                      {asn.items.map((it, idx) => (
                        <div key={idx} className="text-xs text-slate-300">
                          <span className="font-mono text-[11px] text-slate-400 mr-1.5">{it.sku}</span>
                          {it.binCode && (
                            <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-800 text-indigo-300 border border-slate-700 font-mono">
                              {it.binCode}
                            </span>
                          )}
                        </div>
                      ))}
                      {asn.notes && (
                        <p className="text-[11px] text-slate-500 italic mt-0.5 truncate">
                          &quot;{asn.notes}&quot;
                        </p>
                      )}
                    </td>

                    <td className="p-4 text-center font-bold text-slate-200">{totalExpected}</td>

                    <td className="p-4 text-center">
                      <div className="flex items-center justify-center gap-1.5 text-xs font-semibold">
                        <span className="text-emerald-400">{totalReceived} Good</span>
                        {totalDamaged > 0 && (
                          <span className="text-rose-400">/ {totalDamaged} Dmg</span>
                        )}
                      </div>
                    </td>

                    <td className="p-4">
                      <span
                        className={`text-[11px] font-bold px-2.5 py-1 rounded-full border inline-flex items-center gap-1 ${
                          asn.status === 'COMPLETED'
                            ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                            : asn.status === 'ARRIVED_AT_DOCK'
                            ? 'bg-indigo-500/10 text-indigo-400 border-indigo-500/30'
                            : 'bg-amber-500/10 text-amber-400 border-amber-500/30'
                        }`}
                      >
                        {asn.status === 'COMPLETED' && <CheckCircle2 className="h-3 w-3" />}
                        {asn.status === 'ARRIVED_AT_DOCK' && <Clock className="h-3 w-3" />}
                        {asn.status === 'IN_TRANSIT' && <Truck className="h-3 w-3" />}
                        <span>{asn.status.replace(/_/g, ' ')}</span>
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal */}
      <CreateInboundAsnModal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        products={products}
        onCreateAsn={onCreateAsn}
        onTriggerToast={onTriggerToast}
      />
    </div>
  );
}
