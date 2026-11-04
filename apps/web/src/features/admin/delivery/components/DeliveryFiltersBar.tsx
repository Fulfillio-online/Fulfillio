'use client';

import React from 'react';
import { Search } from 'lucide-react';

interface DeliveryFiltersBarProps {
  searchQuery: string;
  onSearchChange: (val: string) => void;
  merchantFilter: string;
  onMerchantFilterChange: (val: string) => void;
  courierFilter: string;
  onCourierFilterChange: (val: string) => void;
  statusFilter: string;
  onStatusFilterChange: (val: string) => void;
  merchants: { code: string; name: string }[];
}

export function DeliveryFiltersBar({
  searchQuery,
  onSearchChange,
  merchantFilter,
  onMerchantFilterChange,
  courierFilter,
  onCourierFilterChange,
  statusFilter,
  onStatusFilterChange,
  merchants,
}: DeliveryFiltersBarProps) {
  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 shadow-sm">
      <div className="lg:col-span-2 relative">
        <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="Search Order ID, Tracking ID, Customer, or SKU..."
          className="w-full pl-10 pr-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
        />
      </div>

      <div>
        <select
          value={merchantFilter}
          onChange={(e) => onMerchantFilterChange(e.target.value)}
          aria-label="Filter by Merchant"
          className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm text-slate-200 focus:outline-none focus:border-emerald-500"
        >
          <option value="ALL">All Merchants</option>
          {merchants.map((m) => (
            <option key={m.code} value={m.code}>
              {m.code} — {m.name}
            </option>
          ))}
        </select>
      </div>

      <div>
        <select
          value={courierFilter}
          onChange={(e) => onCourierFilterChange(e.target.value)}
          aria-label="Filter by Courier"
          className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm text-slate-200 focus:outline-none focus:border-emerald-500"
        >
          <option value="ALL">All Couriers (Steadfast, Pathao, RedX)</option>
          <option value="Steadfast">Steadfast Courier</option>
          <option value="Pathao">Pathao Courier</option>
          <option value="RedX">RedX Logistics</option>
        </select>
      </div>

      <div>
        <select
          value={statusFilter}
          onChange={(e) => onStatusFilterChange(e.target.value)}
          aria-label="Filter by Delivery Status"
          className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm text-slate-200 focus:outline-none focus:border-emerald-500"
        >
          <option value="ALL">All Statuses</option>
          <option value="IN_TRANSIT">IN_TRANSIT</option>
          <option value="DELIVERED">DELIVERED</option>
          <option value="RETURNED">RETURNED</option>
        </select>
      </div>
    </div>
  );
}
