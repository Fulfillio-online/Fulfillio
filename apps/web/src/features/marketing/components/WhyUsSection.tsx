import React from 'react';
import { Check, X, ShieldAlert, ShieldCheck } from 'lucide-react';

export function WhyUsSection() {
  const comparisonItems = [
    {
      feature: 'Stock Race Conditions & Overselling',
      traditional: 'Frequent stock mismatch & cancelled customer orders',
      fulfillio: '0% Overselling via PostgreSQL SELECT FOR UPDATE atomic row-locking',
    },
    {
      feature: 'Customer Fraud Ratio Shield',
      traditional: 'Blind shipping leading to high RTO & delivery charge loss',
      fulfillio: 'Cross-courier delivery history scoring (Steadfast, Pathao, RedX)',
    },
    {
      feature: 'Branded Invoices & Reseller Attribution',
      traditional: 'Generic courier slips with no merchant branding',
      fulfillio: 'Custom Memo Code engine with dynamic merchant/reseller layouts',
    },
    {
      feature: 'Packing Station Verification',
      traditional: 'Manual eyes-only packing with 4% to 6% mispack rates',
      fulfillio: 'Strict barcode scan verification (< 0.2% error rate)',
    },
    {
      feature: 'Returns & Reverse Logistics',
      traditional: 'Returned parcels left in bags without stock restoration',
      fulfillio: 'Dockside scan intake, restock vs damaged quarantine with audit logs',
    },
    {
      feature: 'COD Reconciliation & Payouts',
      traditional: 'Unclear deductions and delayed courier payments',
      fulfillio: 'Weekly itemized payout statements with automated fee deductions',
    },
  ];

  return (
    <section id="why-us" className="py-20 sm:py-28">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto">
          <span className="text-xs font-bold uppercase tracking-wider text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-3 py-1 rounded-full">
            Why Choose Us
          </span>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight mt-4">
            The Smart Choice for Serious Merchants
          </h2>
          <p className="mt-4 text-sm sm:text-base text-slate-300 leading-relaxed">
            See how Fulfillio eliminates traditional warehouse bottlenecks so your team can focus 100% on marketing and product sourcing.
          </p>
        </div>

        {/* Comparison Table */}
        <div className="mt-16 overflow-hidden rounded-2xl border border-slate-800 bg-slate-900 shadow-xl">
          <div className="grid grid-cols-1 md:grid-cols-3 border-b border-slate-800 bg-slate-950/70 p-4 font-bold text-xs sm:text-sm text-slate-300 uppercase tracking-wider">
            <div className="hidden md:block">Fulfillment Capability</div>
            <div className="hidden md:block text-rose-400">Self-Fulfillment / Old WMS</div>
            <div className="text-emerald-400 font-extrabold flex items-center gap-1.5">
              <ShieldCheck className="h-4 w-4" />
              <span>Fulfillio Automated 3PL</span>
            </div>
          </div>

          <div className="divide-y divide-slate-800/80">
            {comparisonItems.map((item) => (
              <div
                key={item.feature}
                className="grid grid-cols-1 md:grid-cols-3 p-5 sm:p-6 gap-3 sm:gap-4 items-center hover:bg-slate-800/30 transition-colors"
              >
                <div>
                  <span className="font-bold text-sm text-white block">
                    {item.feature}
                  </span>
                </div>
                <div className="flex items-start gap-2 text-xs sm:text-sm text-rose-300/80 bg-rose-950/20 md:bg-transparent p-3 md:p-0 rounded-lg">
                  <X className="h-4 w-4 text-rose-400 shrink-0 mt-0.5" />
                  <span>{item.traditional}</span>
                </div>
                <div className="flex items-start gap-2 text-xs sm:text-sm text-emerald-300 font-medium bg-emerald-950/30 md:bg-transparent p-3 md:p-0 rounded-lg">
                  <Check className="h-4 w-4 text-emerald-400 shrink-0 mt-0.5" />
                  <span>{item.fulfillio}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
