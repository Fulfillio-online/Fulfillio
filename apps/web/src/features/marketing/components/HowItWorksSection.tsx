import React from 'react';
import { ArrowRight, PackagePlus, RefreshCw, Barcode, Banknote } from 'lucide-react';

export function HowItWorksSection() {
  const steps = [
    {
      step: '01',
      icon: PackagePlus,
      title: 'Send Inventory to Fulfillio',
      desc: 'Create an Inbound ASN from your merchant portal. Our dock team unloads, verifies SKU quantities, and places goods into dedicated rack bins.',
    },
    {
      step: '02',
      icon: RefreshCw,
      title: 'Orders Sync Automatically',
      desc: 'Connect your WooCommerce store or send REST API payloads. Orders sync in real time with automated stock reservations and fraud ratio scoring.',
    },
    {
      step: '03',
      icon: Barcode,
      title: 'Wave-Pick & Barcode Pack',
      desc: 'Warehouse operators execute route-optimized wave picks. Packing stations scan item barcodes and print your branded 4x6 thermal memos.',
    },
    {
      step: '04',
      icon: Banknote,
      title: 'Courier Handover & COD Payout',
      desc: 'Consignments are automatically generated for Steadfast, Pathao, or RedX. COD is collected and settled weekly into your bank account.',
    },
  ];

  return (
    <section id="how-it-works" className="py-20 sm:py-28 bg-slate-900/50 border-y border-slate-800/80">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto">
          <span className="text-xs font-bold uppercase tracking-wider text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-3 py-1 rounded-full">
            Simple 4-Step Process
          </span>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight mt-4">
            How Fulfillio Works
          </h2>
          <p className="mt-4 text-sm sm:text-base text-slate-300 leading-relaxed">
            Zero complicated paperwork. Go from store setup to fully hands-off warehouse fulfillment in less than 24 hours.
          </p>
        </div>

        <div className="mt-16 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 relative">
          {steps.map((s, idx) => {
            const Icon = s.icon;
            return (
              <div
                key={s.step}
                className="p-6 rounded-2xl bg-slate-900 border border-slate-800 relative z-10 flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-2xl font-black text-emerald-400/80 font-mono">
                      {s.step}
                    </span>
                    <div className="h-10 w-10 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
                      <Icon className="h-5 w-5" />
                    </div>
                  </div>
                  <h3 className="font-bold text-base text-white mb-2">
                    {s.title}
                  </h3>
                  <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
                    {s.desc}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
