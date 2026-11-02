'use client';

import React from 'react';
import { Package, CheckCircle2, Clock, MapPin } from 'lucide-react';
import { StatCard } from '@/components/ui';
import { WarehouseBin, WarehouseProductItem } from '../types';

interface ProductsStatsOverviewProps {
  products: WarehouseProductItem[];
  bins: WarehouseBin[];
  onSelectTab: (tab: 'all' | 'approval' | 'bins') => void;
}

export function ProductsStatsOverview({
  products,
  bins,
  onSelectTab,
}: ProductsStatsOverviewProps) {
  const approvedProducts = products.filter((p) => p.status === 'APPROVED');
  const pendingProducts = products.filter((p) => p.status === 'PENDING_APPROVAL');

  const totalInStockUnits = approvedProducts.reduce((acc, p) => acc + p.stock, 0);

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      <div onClick={() => onSelectTab('all')} className="cursor-pointer">
        <StatCard
          title="ACTIVE CATALOG SKUS"
          value={approvedProducts.length}
          description="Verified multi-merchant items"
          icon={<Package className="w-5 h-5" />}
          className="hover:border-emerald-500/50 transition-all"
        />
      </div>

      <div onClick={() => onSelectTab('all')} className="cursor-pointer">
        <StatCard
          title="TOTAL PHYSICAL UNITS"
          value={totalInStockUnits.toLocaleString()}
          description="Live warehouse stock"
          icon={<CheckCircle2 className="w-5 h-5" />}
          className="hover:border-emerald-500/50 transition-all"
        />
      </div>

      <div onClick={() => onSelectTab('approval')} className="cursor-pointer">
        <StatCard
          title="PENDING INBOUND APPROVALS"
          value={pendingProducts.length}
          description={pendingProducts.length > 0 ? 'Requires warehouse QC' : 'Queue clear'}
          trend={
            pendingProducts.length > 0
              ? { value: `${pendingProducts.length} pending`, isPositive: false }
              : undefined
          }
          icon={<Clock className="w-5 h-5" />}
          className="hover:border-amber-500/50 transition-all"
        />
      </div>

      <div onClick={() => onSelectTab('bins')} className="cursor-pointer">
        <StatCard
          title="PHYSICAL BIN SLOTS"
          value={bins.length}
          description="Zone A – D assigned locations"
          icon={<MapPin className="w-5 h-5" />}
          className="hover:border-emerald-500/50 transition-all"
        />
      </div>
    </div>
  );
}
