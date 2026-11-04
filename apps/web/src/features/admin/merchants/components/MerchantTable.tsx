import React, { useState, useMemo } from 'react';
import {
  Search,
  Eye,
  MapPin,
  Landmark,
  Phone,
  Mail,
  ShieldCheck,
  CheckCircle2,
} from 'lucide-react';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { MerchantRecord, MerchantProductItem } from '../types';

export interface MerchantTableProps {
  merchants: MerchantRecord[];
  productsList: MerchantProductItem[];
  onSelectMerchant: (merchant: MerchantRecord) => void;
  onToggleStatus: (id: string, currentStatus: string) => void;
}

export function MerchantTable({
  merchants,
  productsList,
  onSelectMerchant,
  onToggleStatus,
}: MerchantTableProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'Active' | 'Pending' | 'Suspended'>('ALL');

  const filteredMerchants = useMemo(() => {
    return merchants.filter((m) => {
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch =
        !q ||
        m.storeName.toLowerCase().includes(q) ||
        m.merchantCode.toLowerCase().includes(q) ||
        m.ownerName.toLowerCase().includes(q) ||
        m.phone.includes(q) ||
        m.email.toLowerCase().includes(q);

      const matchesStatus = statusFilter === 'ALL' || m.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [merchants, searchQuery, statusFilter]);

  // Calculate product count per merchant
  const getProductCount = (code: string) => {
    return productsList.filter((p) => p.merchantCode === code).length;
  };

  return (
    <div className="space-y-4">
      {/* Search & Status Filters Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-900 border border-slate-800 p-4 rounded-2xl shadow-lg">
        {/* Search Input */}
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search store name, merchant code, phone..."
            className="w-full pl-10 pr-4 py-2 bg-slate-950 border border-slate-700/80 rounded-xl text-xs sm:text-sm font-mono text-slate-200 placeholder:text-slate-500 focus:outline-none focus:border-emerald-500"
          />
        </div>

        {/* Filter Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto self-start sm:self-auto">
          {(['ALL', 'Active', 'Pending', 'Suspended'] as const).map((st) => (
            <button
              key={st}
              type="button"
              onClick={() => setStatusFilter(st)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all whitespace-nowrap cursor-pointer ${
                statusFilter === st
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'bg-slate-950 border border-slate-800 text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
              }`}
            >
              {st === 'ALL' ? `All (${merchants.length})` : st}
            </button>
          ))}
        </div>
      </div>

      {/* Table Container */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900 shadow-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-950/80 text-slate-400 uppercase tracking-wider font-bold border-b border-slate-800 text-[11px]">
              <tr>
                <th className="p-4">Merchant &amp; Store</th>
                <th className="p-4">Owner Contact</th>
                <th className="p-4">Bank / COD Payout</th>
                <th className="p-4">Status</th>
                <th className="p-4 text-center">Active SKUs</th>
                <th className="p-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/80">
              {filteredMerchants.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-slate-400">
                    No merchants found matching your search.
                  </td>
                </tr>
              ) : (
                filteredMerchants.map((merchant) => {
                  const skuCount = getProductCount(merchant.merchantCode);
                  return (
                    <tr
                      key={merchant.id}
                      className="hover:bg-slate-800/40 transition-colors group"
                    >
                      {/* Merchant & Store Name */}
                      <td className="p-4">
                        <div className="flex items-center gap-3">
                          <div
                            className={`w-10 h-10 rounded-xl bg-gradient-to-br ${merchant.avatarBg} flex items-center justify-center text-white font-bold text-sm shadow-md shrink-0`}
                          >
                            {merchant.avatarInitials}
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-slate-100 text-sm group-hover:text-emerald-400 transition-colors">
                                {merchant.storeName}
                              </span>
                              {merchant.verified && (
                                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                              )}
                            </div>
                            <div className="flex items-center gap-2 mt-0.5">
                              <span className="font-mono text-[11px] font-bold text-indigo-400 bg-indigo-500/10 px-1.5 py-0.5 rounded border border-indigo-500/20">
                                {merchant.merchantCode}
                              </span>
                              <span className="text-slate-400 text-[11px] flex items-center gap-1 truncate max-w-[140px]">
                                <MapPin className="w-3 h-3 text-slate-500 shrink-0" />
                                {merchant.location}
                              </span>
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Owner Contact */}
                      <td className="p-4">
                        <div className="font-medium text-slate-200">
                          {merchant.ownerName}
                        </div>
                        <div className="text-slate-400 font-mono text-[11px] flex items-center gap-1 mt-0.5">
                          <Phone className="w-3 h-3 text-slate-500" />
                          {merchant.phone}
                        </div>
                        <div className="text-slate-500 font-mono text-[11px]">
                          {merchant.email}
                        </div>
                      </td>

                      {/* Bank / Payout Snapshot */}
                      <td className="p-4">
                        <div className="flex items-center gap-1.5 font-medium text-slate-300">
                          <Landmark className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                          <span className="truncate max-w-[150px]">
                            {merchant.payoutAccount.provider}
                          </span>
                        </div>
                        <div className="text-[11px] text-slate-400 font-mono mt-0.5">
                          A/C: ••••{merchant.payoutAccount.accountNumber.slice(-4)}
                        </div>
                        <div className="text-[11px] text-emerald-400 font-mono font-medium">
                          bKash: {merchant.payoutAccount.bkashNumber}
                        </div>
                      </td>

                      {/* Status */}
                      <td className="p-4">
                        <StatusBadge status={merchant.status} />
                      </td>

                      {/* SKU Count */}
                      <td className="p-4 text-center">
                        <span className="px-2.5 py-1 rounded-lg bg-slate-950 border border-slate-800 font-mono font-bold text-slate-200">
                          {skuCount}
                        </span>
                      </td>

                      {/* Actions */}
                      <td className="p-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            type="button"
                            onClick={() => onSelectMerchant(merchant)}
                            className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-semibold text-xs flex items-center gap-1.5 transition-all shadow-sm cursor-pointer"
                          >
                            <Eye className="w-3.5 h-3.5 text-indigo-400" />
                            <span>View Profile</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => onToggleStatus(merchant.id, merchant.status)}
                            className={`px-3 py-1.5 rounded-xl font-semibold text-xs transition-all cursor-pointer ${
                              merchant.status === 'Active'
                                ? 'bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 border border-rose-500/30'
                                : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-600/20'
                            }`}
                          >
                            {merchant.status === 'Active' ? 'Suspend' : 'Approve'}
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
