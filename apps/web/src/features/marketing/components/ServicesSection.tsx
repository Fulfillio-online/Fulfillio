import React from 'react';
import {
  Boxes,
  Barcode,
  Layers,
  Truck,
  RotateCcw,
  CreditCard,
  CheckCircle2,
} from 'lucide-react';

export function ServicesSection() {
  const services = [
    {
      icon: Boxes,
      title: 'Inbound ASNs & Warehouse Bin Storage',
      description:
        'Ship products in bulk to our warehouse. Every variant is cataloged with 2-part SKUs and assigned physical bin coordinates (Zone, Aisle, Rack, Shelf) for lightning-fast retrieval.',
      tag: 'Warehouse Infrastructure',
    },
    {
      icon: Layers,
      title: 'Custom Memo Code & Branded Invoices',
      description:
        'Design branded invoice slips in the Merchant Portal. Orders pass custom Memo Codes (e.g., MEMO-DARAZ, MEMO-VIP-A4) and our stations compile and print them on-the-fly.',
      tag: 'Branded Experience',
    },
    {
      icon: Barcode,
      title: 'Ergonomic Barcode Packing Stations',
      description:
        'Packers scan line-item barcodes with USB HID or handheld camera scanners. Real-time audio-visual validation prevents mispacks and double-prints before thermal sealing.',
      tag: 'Packing Precision',
    },
    {
      icon: Truck,
      title: 'Multi-Courier Auto-Consignment',
      description:
        'Live rate calculation and automated parcel booking across Steadfast Courier, Pathao Courier, and RedX Logistics with consolidated parcel handover manifests.',
      tag: 'Courier Integration',
    },
    {
      icon: RotateCcw,
      title: 'Reverse Logistics & RTO Dock Intake',
      description:
        'When parcels return, warehouse operators scan tracking barcodes at the dock, perform QC inspection, and either restock good items or quarantine damaged stock with audit logs.',
      tag: 'RTO Management',
    },
    {
      icon: CreditCard,
      title: 'Automated COD Settlements & Billing',
      description:
        'Transparent weekly settlement cycles. Total COD collected minus handling, packaging, and storage fees deposited directly into your bank or bKash merchant account.',
      tag: 'Financial Peace of Mind',
    },
  ];

  return (
    <section id="services" className="py-20 sm:py-28">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto">
          <span className="text-xs font-bold uppercase tracking-wider text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-3 py-1 rounded-full">
            Our Services
          </span>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight mt-4">
            End-to-End Fulfillment Capabilities
          </h2>
          <p className="mt-4 text-sm sm:text-base text-slate-300 leading-relaxed">
            Everything your e-commerce enterprise needs to run seamless operations from the moment a customer clicks &ldquo;Order Now&rdquo; to the moment cash is in your account.
          </p>
        </div>

        <div className="mt-16 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {services.map((service) => {
            const Icon = service.icon;
            return (
              <div
                key={service.title}
                className="p-7 rounded-2xl bg-slate-900 border border-slate-800 hover:border-slate-700 transition-all flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-5">
                    <div className="h-12 w-12 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
                      <Icon className="h-6 w-6" />
                    </div>
                    <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider bg-slate-800/80 px-2.5 py-1 rounded-md">
                      {service.tag}
                    </span>
                  </div>

                  <h3 className="font-bold text-lg text-white mb-2.5">
                    {service.title}
                  </h3>

                  <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
                    {service.description}
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
