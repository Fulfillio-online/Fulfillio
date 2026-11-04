import React from 'react';
import { ShieldCheck, Award, TrendingUp, Building2 } from 'lucide-react';

export function AboutSection() {
  const pillars = [
    {
      icon: Building2,
      title: 'Centrally Located Hubs',
      description:
        'State-of-the-art climate-controlled warehouse hubs located across Dhaka and surrounding hubs with 24/7 security and dedicated SKU bin allocations.',
    },
    {
      icon: ShieldCheck,
      title: 'Customer Fraud Shield',
      description:
        'Integrated with Steadfast, Pathao, and RedX cross-courier delivery analytics to identify high-risk phone numbers and eliminate fake COD return rates.',
    },
    {
      icon: TrendingUp,
      title: 'Reseller Attribution Engine',
      description:
        'Run white-label reseller dropshipping with personalized branded invoice templates, custom Memo Codes, and automated sub-merchant commission settlements.',
    },
    {
      icon: Award,
      title: 'PostgreSQL Atomic Isolation',
      description:
        'Multi-tenant architecture ensuring your customer data, stock reservations, and profit margins remain strictly segregated and completely secure.',
    },
  ];

  return (
    <section id="about" className="py-20 sm:py-28 bg-slate-900/40 border-y border-slate-800/80">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto">
          <span className="text-xs font-bold uppercase tracking-wider text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-3 py-1 rounded-full">
            About Fulfillio
          </span>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight mt-4">
            Engineered for High-Growth Bangladeshi D2C &amp; Reseller Brands
          </h2>
          <p className="mt-4 text-sm sm:text-base text-slate-300 leading-relaxed">
            Fulfillio bridges the gap between digital storefronts (WooCommerce, Shopify, custom webhooks) and enterprise physical fulfillment. We store your inventory, pack parcels in seconds using verified barcodes, print branded invoices, and hand over to couriers with zero manual intervention.
          </p>
        </div>

        <div className="mt-16 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {pillars.map((pillar) => {
            const Icon = pillar.icon;
            return (
              <div
                key={pillar.title}
                className="p-6 rounded-2xl bg-slate-900/90 border border-slate-800 hover:border-emerald-500/40 transition-all hover:-translate-y-1 group"
              >
                <div className="h-12 w-12 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 mb-5 group-hover:scale-110 transition-transform">
                  <Icon className="h-6 w-6" />
                </div>
                <h3 className="font-bold text-base text-white mb-2">
                  {pillar.title}
                </h3>
                <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
                  {pillar.description}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
