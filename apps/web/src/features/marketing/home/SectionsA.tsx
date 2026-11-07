'use client';

import React, { useState } from 'react';
import {
  ShieldCheck,
  Clock,
  Truck,
  Headset,
  X,
  Check,
  Warehouse,
  RefreshCw,
  FileText,
  Banknote,
  ScanLine,
  Route,
  Package,
} from 'lucide-react';
import { Reveal } from './Reveal';
import { ClickableImage, SectionHeading, SectionLink, scrollToId } from './shared';
import { IMG } from './images';

/* ------------------------------------------------------------------ */
/* 3. Trust                                                            */
/* ------------------------------------------------------------------ */
const PARTNERS = ['Steadfast', 'Pathao', 'RedX', 'WooCommerce', 'Shopify', 'bKash', 'Nagad', 'Facebook Shops'];

export function TrustSection() {
  const items = [
    { icon: ShieldCheck, title: '24/7 Security', text: 'CCTV monitoring and fire protection across every zone.', to: 'showcase' },
    { icon: Clock, title: 'Same-day dispatch', text: 'Orders received before cut-off leave our dock today.', to: 'order-flow' },
    { icon: Truck, title: 'Top couriers', text: 'Steadfast, Pathao and RedX connected by API.', to: 'services' },
    { icon: Headset, title: 'Merchant support', text: 'A real account manager, not a ticket queue.', to: 'faq' },
  ];
  const row = [...PARTNERS, ...PARTNERS];
  return (
    <section id="trust" className="bg-navy-800 dark:bg-navy-900 border-y border-white/5">
      {/* marquee */}
      <div className="relative overflow-hidden border-b border-white/10 py-5 [mask-image:linear-gradient(90deg,transparent,black_12%,black_88%,transparent)]">
        <div className="fx-marquee flex w-max items-center gap-14 pr-14">
          {row.map((p, i) => (
            <span key={i} className="flex items-center gap-14 text-lg font-bold tracking-tight text-white/45">
              {p}
              <span className="h-1.5 w-1.5 rounded-full bg-orange-500/70" />
            </span>
          ))}
        </div>
      </div>
      <div className="mx-auto max-w-7xl px-5 lg:px-8 py-10 grid gap-8 sm:grid-cols-2 lg:grid-cols-4 lg:divide-x lg:divide-white/10">
        {items.map(({ icon: Icon, title, text, to }, i) => (
          <Reveal key={title} delay={i * 90} className="lg:px-6 first:lg:pl-0">
            <button type="button" onClick={() => scrollToId(to)} className="group flex items-start gap-4 text-left">
              <Icon className="h-9 w-9 shrink-0 text-orange-400 transition-transform duration-300 group-hover:scale-110 group-hover:-rotate-6" strokeWidth={1.4} />
              <div>
                <h3 className="font-bold text-white group-hover:text-orange-300 transition-colors">{title}</h3>
                <p className="mt-1 text-sm leading-relaxed text-white/60">{text}</p>
              </div>
            </button>
          </Reveal>
        ))}
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/* 4. Problem & Solution                                               */
/* ------------------------------------------------------------------ */
const PAIRS = [
  { problem: 'Cartons piling up at home or in your shop', solution: 'Dedicated rack space in a secure hub', to: 'showcase' },
  { problem: 'Late packing, wrong item sent, angry customers', solution: 'Barcode-verified packing, every order', to: 'services' },
  { problem: 'Chasing couriers and lost parcels by phone', solution: 'One dashboard tracking every courier', to: 'order-flow' },
  { problem: 'COD cash stuck for weeks with no breakdown', solution: 'Reconciled weekly payouts, itemised', to: 'pricing' },
];

export function ProblemSolutionSection() {
  const [fixed, setFixed] = useState(false);
  return (
    <section id="problem" className="bg-white dark:bg-navy-950 py-24 lg:py-32">
      <div className="mx-auto max-w-7xl px-5 lg:px-8 grid items-center gap-14 lg:grid-cols-2">
        <div>
          <Reveal>
            <SectionHeading
              eyebrow="Problem → Solution"
              title={
                <>
                  Running a shop shouldn&apos;t mean running a <span className="text-orange-500">warehouse.</span>
                </>
              }
            />
          </Reveal>

          {/* switch */}
          <div className="mt-8 inline-flex rounded-full bg-navy-50 dark:bg-white/10 p-1.5 relative" role="tablist">
            <span
              className="absolute top-1.5 bottom-1.5 w-[calc(50%-6px)] rounded-full bg-white dark:bg-navy-800 shadow-md transition-all duration-500 ease-out"
              style={{ left: fixed ? 'calc(50% + 3px)' : '6px' }}
            />
            {[
              { v: false, l: 'Without Fulfillio' },
              { v: true, l: 'With Fulfillio' },
            ].map(({ v, l }) => (
              <button
                key={l}
                type="button"
                role="tab"
                aria-selected={fixed === v}
                onClick={() => setFixed(v)}
                className={`relative z-10 h-11 px-6 rounded-full text-sm font-bold transition-colors ${
                  fixed === v ? (v ? 'text-orange-600 dark:text-orange-400' : 'text-navy-800 dark:text-white') : 'text-navy-800/50 dark:text-white/50'
                }`}
              >
                {l}
              </button>
            ))}
          </div>

          <ul className="mt-8 space-y-3" key={String(fixed)}>
            {PAIRS.map((p, i) => (
              <li key={p.problem} className="fx-in" style={{ ['--d' as string]: `${i * 90}ms` }}>
                <button
                  type="button"
                  onClick={() => (fixed ? scrollToId(p.to) : setFixed(true))}
                  className={`group flex w-full items-center gap-4 rounded-2xl p-4 text-left ring-1 transition-all duration-300 hover:-translate-y-0.5 ${
                    fixed
                      ? 'bg-orange-50 dark:bg-orange-500/10 ring-orange-200 dark:ring-orange-400/25 hover:shadow-lg'
                      : 'bg-navy-50 dark:bg-white/5 ring-navy-100 dark:ring-white/10'
                  }`}
                >
                  <span
                    className={`grid h-9 w-9 shrink-0 place-items-center rounded-full text-white ${
                      fixed ? 'bg-orange-500' : 'bg-slate-400 dark:bg-slate-600'
                    }`}
                  >
                    {fixed ? <Check className="h-4 w-4" strokeWidth={3} /> : <X className="h-4 w-4" strokeWidth={3} />}
                  </span>
                  <span
                    className={`flex-1 font-semibold ${
                      fixed ? 'text-navy-800 dark:text-white' : 'text-navy-800/60 dark:text-white/55 line-through decoration-slate-400/70'
                    }`}
                  >
                    {fixed ? p.solution : p.problem}
                  </span>
                  {fixed ? (
                    <span className="text-xs font-bold text-orange-600 dark:text-orange-400 opacity-0 transition-opacity group-hover:opacity-100">See how →</span>
                  ) : (
                    <span className="text-[11px] font-semibold text-navy-800/40 dark:text-white/35 opacity-0 transition-opacity group-hover:opacity-100">Fix it →</span>
                  )}
                </button>
              </li>
            ))}
          </ul>
        </div>

        <Reveal delay={150} className="relative mx-auto w-full max-w-[460px]">
          <div className={`transition-all duration-700 ${fixed ? 'grayscale-0 rotate-0' : 'grayscale opacity-70 fx-shake'}`}>
            <ClickableImage
              src={IMG.parcels.src}
              w={IMG.parcels.w}
              h={IMG.parcels.h}
              alt="Neatly stacked, labelled parcels with a barcode scanner"
              target="services"
              hint="Explore our services"
              imgClassName={fixed ? 'fx-float-slow' : ''}
              sizes="(min-width: 1024px) 460px, 90vw"
            />
          </div>
        </Reveal>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/* 5. Our services                                                     */
/* ------------------------------------------------------------------ */
export function ServicesSection({ onOpenRegister }: { onOpenRegister: () => void }) {
  const small = [
    { icon: Warehouse, title: 'Secure storage', text: 'Your own zone, rack and shelf — tracked down to the bin.', to: 'showcase' },
    { icon: RefreshCw, title: 'Live inventory', text: 'Stock syncs with WooCommerce, Shopify and our API.', to: 'why-us' },
    { icon: FileText, title: 'Branded memos', text: 'Your logo on every invoice slipped into the parcel.', to: 'order-flow' },
    { icon: Banknote, title: 'COD settlement', text: 'Reconciled with couriers, paid to bank or bKash weekly.', to: 'pricing' },
  ];
  return (
    <section id="services" className="bg-cream/60 dark:bg-navy-900 py-24 lg:py-32">
      <div className="mx-auto max-w-7xl px-5 lg:px-8">
        <Reveal>
          <SectionHeading eyebrow="Our services" title="Everything between your shop and your customer." />
        </Reveal>

        <div className="mt-14 grid gap-5 lg:grid-cols-12">
          <Reveal className="lg:col-span-7">
            <article className="group relative h-full overflow-hidden rounded-[2rem] bg-white dark:bg-navy-800 ring-1 ring-orange-100 dark:ring-white/10 p-8 lg:p-10 min-h-[380px]">
              <span className="inline-flex items-center gap-2 rounded-full bg-orange-50 dark:bg-white/10 px-3 py-1 text-xs font-semibold text-navy-800 dark:text-white">
                <ScanLine className="h-3.5 w-3.5 text-orange-500" /> Barcode verified
              </span>
              <h3 className="mt-4 text-3xl font-extrabold text-navy-800 dark:text-white">Pick &amp; pack, done right</h3>
              <p className="mt-3 max-w-xs text-navy-800/65 dark:text-white/60">
                Every item is scanned at the packing station. Wrong size or colour never leaves the building.
              </p>
              <SectionLink target="process" className="mt-5">How it works</SectionLink>
              <div className="mt-4 lg:absolute lg:bottom-6 lg:right-6 lg:mt-0 lg:w-[58%]">
                <ClickableImage
                  src={IMG.packing.src}
                  w={IMG.packing.w}
                  h={IMG.packing.h}
                  alt="Packing station with conveyor and parcels"
                  target="order-flow"
                  hint="Follow an order"
                  sizes="(min-width: 1024px) 40vw, 90vw"
                />
              </div>
            </article>
          </Reveal>

          <Reveal delay={120} className="lg:col-span-5">
            <article className="group relative h-full overflow-hidden rounded-[2rem] bg-navy-800 dark:bg-navy-800 ring-1 ring-white/5 p-8 lg:p-10">
              <span className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-xs font-semibold text-white">
                <Route className="h-3.5 w-3.5 text-orange-400" /> Courier network
              </span>
              <h3 className="mt-4 text-3xl font-extrabold text-white">Handed to the right courier</h3>
              <p className="mt-3 max-w-xs text-white/60">Parcels are booked, labelled and handed over before you finish your coffee.</p>
              <div className="mt-6">
                <ClickableImage
                  src={IMG.courier.src}
                  w={IMG.courier.w}
                  h={IMG.courier.h}
                  alt="Loading dock with delivery vans"
                  target="showcase"
                  hint="See the dispatch bay"
                  sizes="(min-width: 1024px) 40vw, 90vw"
                />
              </div>
            </article>
          </Reveal>

          {small.map(({ icon: Icon, title, text, to }, i) => (
            <Reveal key={title} delay={i * 80} className="lg:col-span-3">
              <button
                type="button"
                onClick={() => scrollToId(to)}
                className="group h-full w-full text-left rounded-[1.75rem] bg-white dark:bg-navy-800 p-7 ring-1 ring-navy-100 dark:ring-white/10 transition-all duration-300 hover:-translate-y-1.5 hover:shadow-2xl hover:shadow-navy-800/10 dark:hover:shadow-black/40"
              >
                <span className="grid h-12 w-12 place-items-center rounded-2xl bg-orange-50 dark:bg-orange-500/10 text-orange-500 transition-all duration-300 group-hover:bg-orange-500 group-hover:text-white group-hover:rotate-6">
                  <Icon className="h-6 w-6" />
                </span>
                <h3 className="mt-5 text-lg font-bold text-navy-800 dark:text-white">{title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-navy-800/60 dark:text-white/55">{text}</p>
                <span className="mt-4 inline-flex items-center gap-1 text-xs font-bold text-orange-600 dark:text-orange-400 opacity-0 transition-opacity group-hover:opacity-100">
                  Learn more →
                </span>
              </button>
            </Reveal>
          ))}
        </div>

        <div className="mt-10 flex justify-center">
          <button
            type="button"
            onClick={onOpenRegister}
            className="inline-flex items-center gap-2 rounded-full bg-orange-500 px-7 h-12 text-sm font-semibold text-white shadow-lg shadow-orange-500/25 transition-all hover:bg-orange-600 active:scale-95"
          >
            <Package className="h-4 w-4" /> Start with one SKU
          </button>
        </div>
      </div>
    </section>
  );
}
