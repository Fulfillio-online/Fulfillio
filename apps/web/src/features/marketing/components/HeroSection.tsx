import React from 'react';
import Link from 'next/link';
import {
  Zap,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  Package,
  Barcode,
  Truck,
  Layers,
} from 'lucide-react';

export function HeroSection() {
  const highlights = [
    'Zero Stock Overselling (PostgreSQL Atomic Locking)',
    'Next-Day Courier Dispatch across Bangladesh',
    'Custom Branded Memo Codes for Resellers',
    'Automated COD Collection & Weekly Payouts',
  ];

  const metrics = [
    { label: 'Packing Accuracy', value: '99.8%', desc: 'Barcode Scan Verified' },
    { label: 'Dispatch Speed', value: '< 2 Hours', desc: 'From Ingestion to Bay' },
    { label: 'Courier Delivery Ratio', value: '94%+', desc: 'BD Fraud Shield Active' },
    { label: 'Daily Capacity', value: '10,000+', desc: 'Parcels Throughput' },
  ];

  return (
    <section className="relative overflow-hidden pt-12 pb-20 sm:pt-20 sm:pb-28">
      {/* Background glow effects */}
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[350px] bg-gradient-to-tr from-emerald-600/20 to-teal-500/10 rounded-full blur-[120px] pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center">
        {/* Top Announcement Pill */}
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-950/70 border border-emerald-500/30 text-emerald-300 text-xs font-semibold uppercase tracking-wider mb-8 shadow-sm">
          <Zap className="h-3.5 w-3.5 text-emerald-400" />
          <span>Bangladesh&apos;s First Automated 3PL + Custom Memo WMS</span>
        </div>

        {/* Main Catchy Heading */}
        <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black tracking-tight text-white max-w-5xl mx-auto leading-[1.15]">
          Scale Your E-Commerce Store{' '}
          <span className="bg-gradient-to-r from-emerald-400 via-teal-300 to-emerald-200 bg-clip-text text-transparent">
            Without Warehouse Headaches
          </span>
        </h1>

        {/* Subtitle */}
        <p className="mt-6 text-base sm:text-xl text-slate-300 max-w-3xl mx-auto leading-relaxed font-normal">
          Connect your WooCommerce, Shopify, or custom store to Fulfillio. Enjoy atomic inventory reservations, barcode-driven packing stations, branded reseller invoices using custom <strong className="text-emerald-400 font-semibold">Memo Codes</strong>, and automated courier dispatches across Bangladesh.
        </p>

        {/* Bullet Highlights */}
        <div className="mt-8 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-xs sm:text-sm text-slate-300">
          {highlights.map((item) => (
            <div key={item} className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
              <span>{item}</span>
            </div>
          ))}
        </div>

        {/* Action CTAs */}
        <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
          <a
            href="#login"
            className="w-full sm:w-auto px-8 py-3.5 rounded-xl font-bold text-sm sm:text-base text-white bg-emerald-600 hover:bg-emerald-500 shadow-xl shadow-emerald-600/30 transition-all inline-flex items-center justify-center gap-2"
          >
            <span>Open Demo Portal</span>
            <ArrowRight className="h-4 w-4" />
          </a>
          <a
            href="#services"
            className="w-full sm:w-auto px-8 py-3.5 rounded-xl font-bold text-sm sm:text-base text-slate-200 hover:text-white bg-slate-900/90 hover:bg-slate-800 border border-slate-700/80 transition-all inline-flex items-center justify-center gap-2"
          >
            <span>Explore Services</span>
          </a>
        </div>

        {/* Key Metrics Strip */}
        <div className="mt-16 sm:mt-20 grid grid-cols-2 lg:grid-cols-4 gap-4 max-w-5xl mx-auto">
          {metrics.map((m) => (
            <div
              key={m.label}
              className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800/80 backdrop-blur-sm shadow-lg text-left"
            >
              <div className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
                {m.value}
              </div>
              <div className="text-xs sm:text-sm font-semibold text-emerald-400 mt-1">
                {m.label}
              </div>
              <div className="text-[11px] text-slate-400 mt-0.5">
                {m.desc}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
