'use client';

import React, { useEffect, useState } from 'react';
import {
  Send,
  Warehouse,
  Package,
  Truck,
  CheckCircle2,
  PauseCircle,
  PlayCircle,
  ScanBarcode,
  Lock,
  Palette,
  ReceiptText,
  GitBranch,
  LayoutDashboard,
  ArrowUpRight,
} from 'lucide-react';
import { Reveal, CountUp } from './Reveal';
import { ClickableImage, SectionHeading, scrollToId } from './shared';
import { IMG } from './images';

/* ------------------------------------------------------------------ */
/* 6. How it works – auto-advancing animated steps                     */
/* ------------------------------------------------------------------ */
const STEPS = [
  {
    icon: Send,
    title: 'Send your stock',
    short: 'Ship cartons to our hub',
    img: IMG.van,
    to: 'showcase',
    hint: 'See where it lands',
    points: ['Create an inbound shipment in your portal', 'Ship by courier or drop at our Dhaka hub', 'Get a receiving ID to track the delivery'],
  },
  {
    icon: Warehouse,
    title: 'We count & shelve',
    short: 'Scanned, inspected, binned',
    img: IMG.racks,
    to: 'why-us',
    hint: 'Why merchants trust us',
    points: ['Every unit counted and defect-checked', 'Assigned to your own zone, rack and bin', 'Stock goes live in your dashboard instantly'],
  },
  {
    icon: Package,
    title: 'Orders get packed',
    short: 'Picked, verified, branded',
    img: IMG.packing,
    to: 'order-flow',
    hint: 'Follow an order',
    points: ['Orders sync from WooCommerce, Shopify or API', 'Barcode-verified pick & pack at the station', 'Your branded memo printed and included'],
  },
  {
    icon: Truck,
    title: 'Delivered & paid',
    short: 'Courier ships, COD settles',
    img: IMG.courier,
    to: 'pricing',
    hint: 'See what it costs',
    points: ['Parcel handed to the best courier for the route', 'Live tracking from dock to doorstep', 'COD reconciled and paid out every week'],
  },
];

const STEP_MS = 5500;

export function HowItWorksSection() {
  const [active, setActive] = useState(0);
  const [paused, setPaused] = useState(false);

  useEffect(() => {
    if (paused) return;
    const t = window.setTimeout(() => setActive((a) => (a + 1) % STEPS.length), STEP_MS);
    return () => window.clearTimeout(t);
  }, [active, paused]);

  const s = STEPS[active];
  const pct = (active / (STEPS.length - 1)) * 100;

  return (
    <section id="process" className="bg-white dark:bg-navy-950 py-24 lg:py-32 overflow-hidden">
      <div className="mx-auto max-w-7xl px-5 lg:px-8">
        <Reveal>
          <SectionHeading center eyebrow="How it works" title="Four steps. Zero warehouse headaches." />
        </Reveal>

        {/* Timeline */}
        <div className="relative mt-16">
          <div className="absolute left-[12.5%] right-[12.5%] top-8 hidden md:block">
            <div className="h-[3px] rounded-full bg-navy-800/10 dark:bg-white/10" />
            <div
              className="absolute inset-y-0 left-0 h-[3px] rounded-full bg-gradient-to-r from-orange-400 to-orange-600 transition-all duration-1000 ease-out"
              style={{ width: `${pct}%` }}
            />
            <div className="absolute -top-[26px] -ml-4 text-orange-500 transition-all duration-1000 ease-out" style={{ left: `${pct}%` }}>
              <Truck className="h-8 w-8 fill-orange-500/20 fx-bob" />
            </div>
          </div>

          <ol className="relative grid gap-4 md:grid-cols-4 md:gap-6">
            {STEPS.map(({ icon: Icon, title, short }, i) => {
              const done = i <= active;
              return (
                <li key={title}>
                  <button type="button" onClick={() => setActive(i)} className="group w-full text-center" aria-current={i === active}>
                    <span
                      className={`mx-auto grid h-16 w-16 place-items-center rounded-full ring-8 ring-white dark:ring-navy-950 transition-all duration-500 ${
                        done
                          ? 'bg-orange-500 text-white shadow-xl shadow-orange-500/30'
                          : 'bg-navy-50 dark:bg-navy-800 text-navy-800/50 dark:text-white/50 group-hover:bg-orange-100'
                      } ${i === active ? 'scale-110' : ''}`}
                    >
                      {i < active ? <CheckCircle2 className="h-7 w-7" /> : <Icon className="h-7 w-7" />}
                    </span>
                    <span className="mt-4 block text-xs font-bold tracking-widest text-orange-500">STEP 0{i + 1}</span>
                    <span className={`mt-1 block text-lg font-bold transition-colors ${i === active ? 'text-navy-800 dark:text-white' : 'text-navy-800/60 dark:text-white/55'}`}>
                      {title}
                    </span>
                    <span className="mt-1 block text-sm text-navy-800/50 dark:text-white/45">{short}</span>
                    <span className="mx-auto mt-3 block h-1 w-24 overflow-hidden rounded-full bg-navy-100 dark:bg-white/10">
                      {i === active && !paused && (
                        <span
                          key={active}
                          className="block h-full origin-left rounded-full bg-orange-500"
                          style={{ animation: `fx-progress ${STEP_MS}ms linear forwards` }}
                        />
                      )}
                      {i < active && <span className="block h-full w-full bg-orange-500" />}
                      {i === active && paused && <span className="block h-full w-full bg-orange-500/60" />}
                    </span>
                  </button>
                </li>
              );
            })}
          </ol>
        </div>

        {/* Detail panel */}
        <div
          className="mt-14 grid items-center gap-10 rounded-[2.5rem] bg-cream/70 dark:bg-navy-900 ring-1 ring-orange-100/80 dark:ring-white/10 p-8 lg:p-12 lg:grid-cols-2"
          onMouseEnter={() => setPaused(true)}
          onMouseLeave={() => setPaused(false)}
        >
          <div key={`t${active}`} className="fx-in">
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-orange-500">Step 0{active + 1}</p>
            <h3 className="mt-2 text-3xl font-extrabold text-navy-800 dark:text-white">{s.title}</h3>
            <ul className="mt-6 space-y-3">
              {s.points.map((p, i) => (
                <li key={p} className="fx-in flex items-start gap-3 text-navy-800/75 dark:text-white/70" style={{ ['--d' as string]: `${120 + i * 100}ms` }}>
                  <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-orange-500" />
                  {p}
                </li>
              ))}
            </ul>
            <div className="mt-8 flex items-center gap-3">
              <button
                type="button"
                onClick={() => scrollToId(s.to)}
                className="inline-flex h-11 items-center gap-1.5 rounded-full bg-navy-800 dark:bg-orange-500 px-6 text-sm font-semibold text-white hover:bg-navy-700 dark:hover:bg-orange-600 transition-colors"
              >
                {s.hint} <ArrowUpRight className="h-4 w-4" />
              </button>
              <button
                type="button"
                onClick={() => setPaused((p) => !p)}
                aria-label={paused ? 'Resume autoplay' : 'Pause autoplay'}
                className="grid h-11 w-11 place-items-center rounded-full text-navy-800/60 dark:text-white/60 hover:bg-navy-100 dark:hover:bg-white/10"
              >
                {paused ? <PlayCircle className="h-6 w-6" /> : <PauseCircle className="h-6 w-6" />}
              </button>
            </div>
          </div>
          <div key={`i${active}`} className="fx-in mx-auto w-full max-w-[480px]">
            <ClickableImage src={s.img.src} w={s.img.w} h={s.img.h} alt={s.title} target={s.to} hint={s.hint} imgClassName="fx-float-slow" sizes="(min-width: 1024px) 480px, 90vw" />
          </div>
        </div>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/* 7. Warehouse showcase – interactive zones                           */
/* ------------------------------------------------------------------ */
const ZONES = [
  {
    id: 'inbound',
    name: 'Inbound dock',
    x: 80,
    y: 62,
    text: 'Cartons are received, counted unit-by-unit and quality-checked before they ever touch a shelf.',
    stat: 'Same-day receiving',
    to: 'process',
  },
  {
    id: 'storage',
    name: 'Bin storage',
    x: 14,
    y: 46,
    text: 'Pallet racking with merchant-specific zones. Every bin has a barcode so stock is never lost.',
    stat: 'Zone · Rack · Shelf · Bin',
    to: 'why-us',
  },
  {
    id: 'pick',
    name: 'Pick faces',
    x: 43,
    y: 47,
    text: 'Fast-moving SKUs sit at waist height for rapid picking, guided by an optimised wave path.',
    stat: 'Wave-based picking',
    to: 'services',
  },
  {
    id: 'dispatch',
    name: 'Staging & dispatch',
    x: 42,
    y: 86,
    text: 'Packed, labelled parcels are sorted by courier and handed over with a signed manifest.',
    stat: 'Courier-sorted handover',
    to: 'order-flow',
  },
];

export function ShowcaseSection() {
  const [zone, setZone] = useState(1);
  const z = ZONES[zone];
  const metrics = [
    { to: 99.8, suffix: '%', decimals: 1, label: 'Pack accuracy' },
    { to: 24, suffix: 'h', decimals: 0, label: 'Avg. dispatch time' },
    { to: 7, suffix: ' days', decimals: 0, label: 'COD payout cycle' },
    { to: 24, suffix: '/7', decimals: 0, label: 'CCTV monitoring' },
  ];

  return (
    <section id="showcase" className="bg-navy-800 dark:bg-navy-900 py-24 lg:py-32 overflow-hidden">
      <div className="mx-auto max-w-7xl px-5 lg:px-8">
        <Reveal>
          <SectionHeading
            light
            eyebrow="Warehouse showcase"
            title="Walk the floor. Tap a zone."
            sub="Click the glowing points to see how each part of our warehouse protects and moves your products."
          />
        </Reveal>

        <div className="mt-14 grid items-center gap-10 lg:grid-cols-12">
          <Reveal className="lg:col-span-7">
            <div className="relative mx-auto max-w-[680px]">
              <ClickableImage
                src={IMG.racks.src}
                w={IMG.racks.w}
                h={IMG.racks.h}
                alt="Isometric storage racks with a forklift"
                onClick={() => scrollToId(z.to)}
                hotspots={ZONES.map((zz, i) => ({
                  x: zz.x,
                  y: zz.y,
                  label: zz.name,
                  active: i === zone,
                  onSelect: () => setZone(i),
                }))}
                imgClassName="fx-float-slow"
                sizes="(min-width: 1024px) 680px, 90vw"
              />
            </div>
          </Reveal>

          <Reveal delay={120} className="lg:col-span-5">
            <div className="flex flex-wrap gap-2">
              {ZONES.map((zz, i) => (
                <button
                  key={zz.id}
                  type="button"
                  onClick={() => setZone(i)}
                  className={`h-9 rounded-full px-4 text-xs font-bold transition-all ${
                    i === zone ? 'bg-orange-500 text-white shadow-lg shadow-orange-500/30' : 'bg-white/10 text-white/70 hover:bg-white/20'
                  }`}
                >
                  {zz.name}
                </button>
              ))}
            </div>
            <div key={z.id} className="fx-in mt-6 rounded-3xl bg-white/[0.07] ring-1 ring-white/10 p-7 backdrop-blur">
              <span className="inline-flex items-center gap-2 rounded-full bg-orange-500/15 px-3 py-1 text-xs font-bold text-orange-300">
                <ScanBarcode className="h-3.5 w-3.5" /> {z.stat}
              </span>
              <h3 className="mt-4 text-2xl font-extrabold text-white">{z.name}</h3>
              <p className="mt-3 leading-relaxed text-white/65">{z.text}</p>
              <button
                type="button"
                onClick={() => scrollToId(z.to)}
                className="mt-6 inline-flex items-center gap-1.5 text-sm font-bold text-orange-400 hover:text-orange-300"
              >
                Explore this stage <ArrowUpRight className="h-4 w-4" />
              </button>
            </div>
          </Reveal>
        </div>

        <dl className="mt-16 grid grid-cols-2 gap-6 border-t border-white/10 pt-10 lg:grid-cols-4">
          {metrics.map((m) => (
            <div key={m.label} className="text-center lg:text-left">
              <dt className="text-4xl lg:text-5xl font-extrabold text-white">
                <CountUp to={m.to} suffix={m.suffix} decimals={m.decimals} />
              </dt>
              <dd className="mt-1 text-sm text-white/50">{m.label}</dd>
            </div>
          ))}
        </dl>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/* 8. Why choose us                                                    */
/* ------------------------------------------------------------------ */
const REASONS = [
  { icon: Lock, title: 'Zero double-selling', text: 'Atomic stock reservation means one unit can never be sold twice.', to: 'process' },
  { icon: ScanBarcode, title: 'Scan-verified packing', text: 'Barcode checks at the packing bench catch mistakes before dispatch.', to: 'services' },
  { icon: Palette, title: 'Your brand, your memo', text: 'Custom invoice templates with your logo, picked by memo code.', to: 'order-flow' },
  { icon: ReceiptText, title: 'Transparent ledger', text: 'Every fee and COD taka itemised and downloadable.', to: 'pricing' },
  { icon: GitBranch, title: 'Smart courier booking', text: 'Steadfast, Pathao and RedX chosen per destination.', to: 'trust' },
  { icon: LayoutDashboard, title: 'Real-time dashboard', text: 'Stock, orders and payouts live — plus a public REST API.', to: 'showcase' },
];

export function WhyChooseSection() {
  return (
    <section id="why-us" className="bg-white dark:bg-navy-950 py-24 lg:py-32">
      <div className="mx-auto max-w-7xl px-5 lg:px-8">
        <Reveal>
          <SectionHeading center eyebrow="Why choose us" title="Built for merchants who plan to scale." />
        </Reveal>

        <div className="mt-16 grid items-center gap-10 lg:grid-cols-[1fr_380px_1fr]">
          <div className="grid gap-5">
            {REASONS.slice(0, 3).map((r, i) => (
              <ReasonCard key={r.title} {...r} delay={i * 90} align="right" />
            ))}
          </div>

          <Reveal delay={100} className="order-first lg:order-none mx-auto w-full max-w-[340px] lg:max-w-none">
            <ClickableImage
              src={IMG.worker.src}
              w={IMG.worker.w}
              h={IMG.worker.h}
              alt="Warehouse specialist inspecting stock"
              target="testimonials"
              hint="Hear from merchants"
              imgClassName="fx-float-slow"
              sizes="(min-width: 1024px) 380px, 80vw"
            />
          </Reveal>

          <div className="grid gap-5">
            {REASONS.slice(3).map((r, i) => (
              <ReasonCard key={r.title} {...r} delay={i * 90} align="left" />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

function ReasonCard({
  icon: Icon,
  title,
  text,
  to,
  delay,
  align,
}: {
  icon: React.ElementType;
  title: string;
  text: string;
  to: string;
  delay: number;
  align: 'left' | 'right';
}) {
  return (
    <Reveal delay={delay}>
      <button
        type="button"
        onClick={() => scrollToId(to)}
        className={`group flex w-full items-start gap-4 rounded-3xl bg-white dark:bg-navy-900 p-6 text-left ring-1 ring-navy-100 dark:ring-white/10 transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:shadow-navy-800/10 dark:hover:shadow-black/40 ${
          align === 'right' ? 'lg:flex-row-reverse lg:text-right' : ''
        }`}
      >
        <span className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-orange-50 dark:bg-orange-500/10 text-orange-500 transition-all duration-300 group-hover:bg-orange-500 group-hover:text-white group-hover:rotate-6">
          <Icon className="h-6 w-6" />
        </span>
        <span>
          <span className="block text-lg font-bold text-navy-800 dark:text-white">{title}</span>
          <span className="mt-1 block text-sm leading-relaxed text-navy-800/60 dark:text-white/55">{text}</span>
        </span>
      </button>
    </Reveal>
  );
}
