'use client';

import React, { useState } from 'react';
import { Search, Eye, CheckCircle2, Clock, RotateCcw } from 'lucide-react';

export interface EarningsOrderRow {
  id: string;
  transactionRef: string;
  orderNumber: string;
  itemTitle: string;
  date: string;
  grossAmount: number;
  feeAmount: number;
  netAmount: number;
  status: 'READY_TO_CLAIM' | 'PENDING' | 'REFUNDED';
}

interface EarningsOrdersTableProps {
  orders: EarningsOrderRow[];
  onTriggerToast: (msg: string) => void;
}

export function EarningsOrdersTable({ orders, onTriggerToast }: EarningsOrdersTableProps) {
  const [activeTab, setActiveTab] = useState<'ALL' | 'READY_TO_CLAIM' | 'PENDING'>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  const filteredOrders = orders.filter((order) => {
    if (activeTab === 'READY_TO_CLAIM' && order.status !== 'READY_TO_CLAIM') return false;
    if (activeTab === 'PENDING' && order.status !== 'PENDING') return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return (
        order.orderNumber.toLowerCase().includes(q) ||
        order.transactionRef.toLowerCase().includes(q) ||
        order.itemTitle.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const readyCount = orders.filter((o) => o.status === 'READY_TO_CLAIM').length;
  const pendingCount = orders.filter((o) => o.status === 'PENDING').length;

  const toggleSelectAll = () => {
    if (selectedIds.length === filteredOrders.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(filteredOrders.map((o) => o.id));
    }
  };

  const toggleSelectOne = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const getStatusBadge = (status: EarningsOrderRow['status']) => {
    switch (status) {
      case 'READY_TO_CLAIM':
        return (
          <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 inline-flex items-center gap-1">
            <CheckCircle2 className="h-3 w-3" />
            <span>Ready to Claim</span>
          </span>
        );
      case 'PENDING':
        return (
          <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-amber-500/10 text-amber-400 border border-amber-500/30 inline-flex items-center gap-1">
            <Clock className="h-3 w-3" />
            <span>Pending</span>
          </span>
        );
      case 'REFUNDED':
        return (
          <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-rose-500/10 text-rose-400 border border-rose-500/30 inline-flex items-center gap-1">
            <RotateCcw className="h-3 w-3" />
            <span>Refunded</span>
          </span>
        );
    }
  };

  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-900 overflow-hidden shadow-sm space-y-4 p-4 sm:p-6">
      {/* Tab Filter Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-4">
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => setActiveTab('ALL')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-colors cursor-pointer ${
              activeTab === 'ALL'
                ? 'bg-emerald-500 text-slate-950 shadow-sm'
                : 'bg-slate-800 text-slate-400 hover:text-slate-200'
            }`}
          >
            Cumulative Pending
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('READY_TO_CLAIM')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-colors cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'READY_TO_CLAIM'
                ? 'bg-emerald-500 text-slate-950 shadow-sm'
                : 'bg-slate-800 text-slate-400 hover:text-slate-200'
            }`}
          >
            <span>Ready to Claim</span>
            <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-emerald-950 text-emerald-300 font-mono">
              {readyCount}
            </span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('PENDING')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-colors cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'PENDING'
                ? 'bg-emerald-500 text-slate-950 shadow-sm'
                : 'bg-slate-800 text-slate-400 hover:text-slate-200'
            }`}
          >
            <span>Pending</span>
            <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-amber-950 text-amber-300 font-mono">
              {pendingCount}
            </span>
          </button>
        </div>

        {/* Search */}
        <div className="relative w-full sm:w-64">
          <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-slate-500" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search order or transaction..."
            className="w-full pl-9 pr-3 py-1.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-200 focus:outline-none focus:border-emerald-500"
          />
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full min-w-[760px] text-left text-xs">
          <thead className="bg-slate-800/60 text-slate-400 uppercase tracking-wider font-semibold border-b border-slate-800">
            <tr>
              <th className="p-3 w-8">
                <input
                  type="checkbox"
                  checked={selectedIds.length === filteredOrders.length && filteredOrders.length > 0}
                  onChange={toggleSelectAll}
                  className="rounded border-slate-700 bg-slate-900 text-emerald-500 focus:ring-emerald-500"
                />
              </th>
              <th className="p-3">Date / Transaction</th>
              <th className="p-3">Order & Item</th>
              <th className="p-3">Gross</th>
              <th className="p-3">Fees</th>
              <th className="p-3 font-bold text-emerald-400">Net earnings</th>
              <th className="p-3">Status</th>
              <th className="p-3 text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/80">
            {filteredOrders.length === 0 ? (
              <tr>
                <td colSpan={8} className="p-8 text-center text-slate-500 text-xs">
                  No orders found for this tab or filter.
                </td>
              </tr>
            ) : (
              filteredOrders.map((order) => {
                const isSelected = selectedIds.includes(order.id);
                return (
                  <tr
                    key={order.id}
                    className={`hover:bg-slate-800/30 transition-colors ${
                      isSelected ? 'bg-emerald-950/20' : ''
                    }`}
                  >
                    <td className="p-3">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => toggleSelectOne(order.id)}
                        className="rounded border-slate-700 bg-slate-900 text-emerald-500 focus:ring-emerald-500"
                      />
                    </td>
                    <td className="p-3">
                      <span className="font-mono text-slate-200 block font-semibold">
                        {order.transactionRef}
                      </span>
                      <span className="text-[10px] text-slate-500">{order.date}</span>
                    </td>
                    <td className="p-3">
                      <span className="font-bold text-slate-200 block text-xs">
                        {order.orderNumber}
                      </span>
                      <span className="text-[11px] text-slate-400 line-clamp-1">
                        {order.itemTitle}
                      </span>
                    </td>
                    <td className="p-3 font-semibold text-slate-300">
                      ৳ {order.grossAmount.toLocaleString()}
                    </td>
                    <td className="p-3 text-rose-400 font-mono">
                      -৳ {order.feeAmount.toLocaleString()}
                    </td>
                    <td className="p-3 font-black text-emerald-400">
                      ৳ {order.netAmount.toLocaleString()}
                    </td>
                    <td className="p-3">{getStatusBadge(order.status)}</td>
                    <td className="p-3 text-right">
                      <button
                        type="button"
                        onClick={() =>
                          onTriggerToast(`Viewing order transaction ${order.transactionRef}`)
                        }
                        className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-slate-200 transition-colors"
                        title="View Order Details"
                      >
                        <Eye className="h-3.5 w-3.5" />
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
