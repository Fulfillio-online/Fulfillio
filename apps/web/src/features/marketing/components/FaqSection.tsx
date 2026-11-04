'use client';

import React, { useState } from 'react';
import { ChevronDown, HelpCircle } from 'lucide-react';

export function FaqSection() {
  const [openIdx, setOpenIdx] = useState<number | null>(0);

  const faqs = [
    {
      q: 'What is a "Memo Code" and how does it work with my online store?',
      a: 'A Memo Code (e.g., MEMO-DEFAULT, MEMO-DARAZ-BD, MEMO-RESELLER) is an immutable template identifier for your branded invoice/packing slip. In the Merchant Portal, you design custom layouts with your logo, return policy, and barcodes. When an order syncs via WooCommerce or API with that Memo Code, our warehouse packing station compiles and prints that exact design automatically upon scanning the order barcode.',
    },
    {
      q: 'Which courier services are supported for automated parcel booking?',
      a: 'Fulfillio comes pre-integrated with Bangladesh’s leading courier networks: Steadfast Courier, Pathao Courier, RedX Logistics, and Paperfly. Our system calculates rates, books consignments, prints barcode tracking labels, and generates handover manifests automatically.',
    },
    {
      q: 'How does Fulfillio calculate and payout my Cash on Delivery (COD) funds?',
      a: 'We operate weekly automated settlement cycles. Once couriers deliver your parcels and remit COD amounts, Fulfillio calculates your net payout by deducting storage fees, handling fees (typically ৳ 40–50/order), and packaging material costs. The remaining balance is deposited directly into your verified bank account or bKash merchant account with an itemized statement.',
    },
    {
      q: 'What happens when a customer rejects or returns a parcel (RTO)?',
      a: 'When an RTO parcel returns to the dock, our intake operator scans the courier tracking barcode to immediately update the order status. A QC inspector checks whether the item is undamaged. If good, it is restocked to its assigned bin; if damaged, it is quarantined with timestamped audit logs for your insurance or reseller claim.',
    },
    {
      q: 'How does the Atomic Stock Reservation prevent overselling during flash sales?',
      a: 'Unlike traditional spreadsheets or cached databases, Fulfillio uses PostgreSQL row-level locks (SELECT FOR UPDATE) inside atomic transactions. If 10 customers attempt to buy the last 2 units at the exact same millisecond, the database guarantees only 2 succeed and 8 receive clean out-of-stock or backorder notices, completely preventing double-booking.',
    },
    {
      q: 'Can I integrate multiple WooCommerce or Shopify stores under one merchant account?',
      a: 'Yes. Fulfillio provides scoped API Keys and webhook receivers. You can route multiple WooCommerce domains or reseller storefronts into your single merchant inventory and track which store or reseller generated each sale.',
    },
  ];

  return (
    <section id="faqs" className="py-20 sm:py-28">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center">
          <span className="text-xs font-bold uppercase tracking-wider text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-3 py-1 rounded-full">
            Frequently Asked Questions
          </span>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight mt-4">
            Got Questions? We Have Answers
          </h2>
          <p className="mt-3 text-sm sm:text-base text-slate-300">
            Everything you need to know about Fulfillio warehouse integration, memo slips, and COD settlements.
          </p>
        </div>

        <div className="mt-12 space-y-4">
          {faqs.map((faq, idx) => {
            const isOpen = openIdx === idx;
            return (
              <div
                key={faq.q}
                className="rounded-2xl border border-slate-800 bg-slate-900/90 overflow-hidden transition-all"
              >
                <button
                  type="button"
                  onClick={() => setOpenIdx(isOpen ? null : idx)}
                  className="w-full p-5 text-left flex items-center justify-between gap-4 hover:bg-slate-800/40 transition-colors"
                >
                  <span className="font-bold text-sm sm:text-base text-white">
                    {faq.q}
                  </span>
                  <ChevronDown
                    className={`h-5 w-5 text-emerald-400 shrink-0 transition-transform duration-200 ${
                      isOpen ? 'rotate-180 text-emerald-300' : ''
                    }`}
                  />
                </button>
                {isOpen && (
                  <div className="px-5 pb-5 pt-1 text-xs sm:text-sm text-slate-300 leading-relaxed border-t border-slate-800/60 animate-in fade-in">
                    {faq.a}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
