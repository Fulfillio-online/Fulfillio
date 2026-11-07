'use client';

import React, { useEffect, useRef, useState } from 'react';
import {
  ShoppingCart,
  Lock,
  ScanBarcode,
  Package,
  Truck,
  MapPinCheck,
  Banknote,
  Check,
  ArrowRight,
  Shirt,
  Smartphone,
  Sparkles,
  Sofa,
  Gift,
  PauseCircle,
  PlayCircle,
} from 'lucide-react';
import { Reveal } from './Reveal';
import { ClickableImage, SectionHeading, SectionLink, scrollToId } from './shared';
import { IMG } from './images';

/* ------------------------------------------------------------------ */
/* 9. Order flow – looping live pipeline                               */
/* ------------------------------------------------------------------ */
const FLOW = [
  { icon: ShoppingCart, label: 'Order placed', note: 'Synced from your store or API', tone: 'bg-sky-500' },
  { icon: Lock, label: 'Stock reserved', note: 'Atomic row-lock, no oversell', tone: 'bg-indigo-500' },
  { icon: ScanBarcode, label: 'Picked', note: 'Wave path, bin-scanned', tone: 'bg-amber-500' },
  { icon: Package, label: 'Packed', note: 'Verified, memo printed', tone: 'bg-orange-500' },
  { icon: Truck, label: 'Handed over', note: 'Courier manifest signed', tone: 'bg-rose-500' },
  { icon: MapPinCheck, label: 'Delivered', note: 'Customer receives parcel', tone: 'bg-emerald-500' },
  { icon: Banknote, label: 'COD settled', note: 'Weekly bank / bKash payout', tone: 'bg-teal-500' },
];

export function OrderFlowSection() {
  const [idx, setIdx] = useState(0);
  const [paused, setPaused] = useState(false);
  const resumeRef = useRef<number | null>(null);

  useEffect(() => {
    if (paused) return;
    const last = idx === FLOW.length - 1;
    const t = window.setTimeout(() => setIdx((i) => (i + 1) % FLOW.length), last ? 2600 : 1700);
    return () => window.clearTimeout(t);
  }, [idx, paused]);

  useEffect(() => () => { if (resumeRef.current) window.clearTimeout(resumeRef.current); }, []);

  const pick = (i: number) => {
    setIdx(i);
    setPaused(true);
    if (resumeRef.current) window.clearTimeout(resumeRef.current);
    resumeRef.current = window.setTimeout(() => setPaused(false), 7000);
  };

  const cur = FLOW[idx];
  const CurIcon = cur.icon;
  const pct = (idx / (FLOW.length - 1)) * 100;

  return (
    <section id="order-flow" className="bg-cream/60 dark:bg-navy-900 py-24 lg:py-32 overflow-hidden">
      <div className="mx-auto max-w-7xl px-5 lg:px-8">
        <div className="flex flex-col gap-10 lg:flex-row lg:items-end lg:justify-between">
          <Reveal>
            <SectionHeading
              eyebrow="Order flow"
              title="Watch one order travel from click to cash."
              sub="Tap any stage to pause and inspect it. Everything you see is tracked live in your merchant portal."
            />
          </Reveal>
          <Reveal delay={100} className="hidden lg:block w-[210px] shrink-0">
            <ClickableImage src={IMG.parcels.src} w={IMG.parcels.w} h={IMG.parcels.h} alt="Parcel stack" target="pricing" hint="See pricing" imgClassName="fx-float" sizes="210px" />
          </Reveal>
        </div>

        <div className="mt-14 overflow-x-auto pb-4 -mx-5 px-5 lg:mx-0 lg:px-0 lg:overflow-visible">
          <div className="relative min-w-[860px] lg:min-w-0">
            {/* track */}
            <div className="absolute left-[7.14%] right-[7.14%] top-8">
              <div className="h-[3px] rounded-full bg-navy-800/10 dark:bg-white/10" />
              <div className="absolute inset-y-0 left-0 h-[3px] rounded-full bg-gradient-to-r from-orange-400 to-orange-600 transition-all duration-700 ease-out" style={{ width: `${pct}%` }} />
              <div className="absolute -top-[13px] -ml-[14px] transition-all duration-700 ease-out" style={{ left: `${pct}%` }}>
                <span className="relative grid h-7 w-7 place-items-center rounded-lg bg-navy-800 dark:bg-white text-white dark:text-navy-800 shadow-lg">
                  <Package className="h-4 w-4" />
                  <span className="fx-pulse-ring absolute inset-0 rounded-lg bg-orange-500/50" />
                </span>
              </div>
            </div>

            <ol className="relative grid grid-cols-7">
              {FLOW.map(({ icon: Icon, label, tone }, i) => (
                <li key={label} className="text-center">
                  <button type="button" onClick={() => pick(i)} className="group w-full px-1">
                    <span
                      className={`mx-auto grid h-16 w-16 place-items-center rounded-full ring-8 ring-cream/60 dark:ring-navy-900 transition-all duration-500 ${
                        i <= idx ? `${tone} text-white shadow-xl` : 'bg-white dark:bg-navy-800 text-navy-800/40 dark:text-white/40 group-hover:text-orange-500'
                      } ${i === idx ? 'scale-110' : ''}`}
                    >
                      <Icon className="h-7 w-7" />
                    </span>
                    <span className={`mt-4 block text-sm font-bold transition-colors ${i === idx ? 'text-navy-800 dark:text-white' : 'text-navy-800/50 dark:text-white/45'}`}>{label}</span>
                  </button>
                </li>
              ))}
            </ol>
          </div>
        </div>

        {/* live card */}
        <div className="mx-auto mt-10 max-w-3xl">
          <div className="rounded-3xl bg-white dark:bg-navy-800 p-6 sm:p-8 shadow-2xl shadow-navy-800/10 dark:shadow-black/30 ring-1 ring-navy-100 dark:ring-white/10">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <p className="text-xs font-semibold text-navy-800/50 dark:text-white/50">Order</p>
                <p className="text-xl font-extrabold text-navy-800 dark:text-white">#FL-2841 · Dhanmondi, Dhaka</p>
              </div>
              <div className="flex items-center gap-2">
                <span key={idx} className={`fx-in inline-flex items-center gap-2 rounded-full ${cur.tone} px-4 py-2 text-sm font-bold text-white`}>
                  <CurIcon className="h-4 w-4" /> {cur.label}
                </span>
                <button
                  type="button"
                  onClick={() => setPaused((p) => !p)}
                  aria-label={paused ? 'Resume' : 'Pause'}
                  className="grid h-10 w-10 place-items-center rounded-full text-navy-800/50 dark:text-white/50 hover:bg-navy-50 dark:hover:bg-white/10"
                >
                  {paused ? <PlayCircle className="h-6 w-6" /> : <PauseCircle className="h-6 w-6" />}
                </button>
              </div>
            </div>
            <p key={`n${idx}`} className="fx-in mt-5 text-navy-800/70 dark:text-white/65">{cur.note}.</p>
            <div className="mt-5 h-2 overflow-hidden rounded-full bg-navy-50 dark:bg-white/10">
              <div className="h-full rounded-full bg-gradient-to-r from-orange-400 to-orange-600 transition-all duration-700" style={{ width: `${((idx + 1) / FLOW.length) * 100}%` }} />
            </div>
            <div className="mt-5">
              <SectionLink target="services">What we do at each stage</SectionLink>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/* 10. Pricing                                                         */
/* ------------------------------------------------------------------ */
const TIERS = [
  { id: 'starter', name: 'Starter', range: 'Up to 499 orders / mo', perOrder: 22, storage: 1500, min: 50, max: 499, pick: 250, perks: ['Pick, pack & memo included', 'Shared storage zone', 'Weekly COD payout'] },
  { id: 'growth', name: 'Growth', range: '500 – 1,499 orders / mo', perOrder: 18, storage: 3500, min: 500, max: 1499, pick: 900, perks: ['Dedicated rack space', 'Priority dispatch window', 'Account manager'], featured: true },
  { id: 'scale', name: 'Scale', range: '1,500+ orders / mo', perOrder: 16, storage: 6000, min: 1500, max: 3000, pick: 2200, perks: ['Multi-zone storage', 'Custom courier rules', 'API & webhook support'] },
];

const fmt = (n: number) => '৳ ' + n.toLocaleString('en-IN');

export function PricingSection({ onOpenRegister }: { onOpenRegister: () => void }) {
  const [orders, setOrders] = useState(900);
  const activeTier = TIERS.find((t) => orders >= t.min && orders <= t.max) ?? TIERS[2];
  const total = orders * activeTier.perOrder + activeTier.storage;
  const pct = ((orders - 50) / (3000 - 50)) * 100;

  return (
    <section id="pricing" className="bg-white dark:bg-navy-950 py-24 lg:py-32">
      <div className="mx-auto max-w-7xl px-5 lg:px-8">
        <Reveal>
          <SectionHeading center eyebrow="Pricing" title="Simple, per-order pricing that scales with you." sub="Drag the slider — the right plan lights up and your estimate updates instantly." />
        </Reveal>

        <Reveal delay={80} className="mx-auto mt-12 max-w-2xl">
          <div className="rounded-3xl bg-cream/70 dark:bg-navy-900 ring-1 ring-orange-100 dark:ring-white/10 p-6 sm:p-8">
            <div className="flex items-baseline justify-between">
              <span className="text-sm font-semibold text-navy-800/60 dark:text-white/60">Orders per month</span>
              <span className="text-3xl font-extrabold tabular-nums text-navy-800 dark:text-white">{orders.toLocaleString('en-IN')}</span>
            </div>
            <input
              type="range"
              min={50}
              max={3000}
              step={50}
              value={orders}
              onChange={(e) => setOrders(Number(e.target.value))}
              aria-label="Orders per month"
              className="mt-5 h-2 w-full cursor-pointer appearance-none rounded-full accent-orange-500"
              style={{ background: `linear-gradient(90deg,#F26B1D ${pct}%,rgba(127,140,165,.25) ${pct}%)` }}
            />
            <div className="mt-6 flex items-end justify-between">
              <div>
                <p className="text-xs text-navy-800/50 dark:text-white/50">Estimated monthly · {activeTier.name} plan</p>
                <p key={total} className="fx-in text-4xl font-extrabold tabular-nums text-orange-500">{fmt(total)}</p>
              </div>
              <p className="text-right text-xs text-navy-800/50 dark:text-white/45">
                {fmt(activeTier.perOrder)} / order
                <br />+ {fmt(activeTier.storage)} storage
              </p>
            </div>
          </div>
        </Reveal>

        <div className="mt-10 grid gap-6 lg:grid-cols-3">
          {TIERS.map((t, i) => {
            const on = t.id === activeTier.id;
            return (
              <Reveal key={t.id} delay={i * 100}>
                <article
                  onClick={() => setOrders(t.pick)}
                  className={`relative h-full cursor-pointer rounded-[2rem] p-8 transition-all duration-500 ${
                    on
                      ? 'bg-navy-800 dark:bg-orange-500 text-white -translate-y-2 shadow-2xl shadow-navy-800/30 ring-2 ring-orange-500'
                      : 'bg-white dark:bg-navy-900 ring-1 ring-navy-100 dark:ring-white/10 text-navy-800 dark:text-white hover:-translate-y-1'
                  }`}
                >
                  {t.featured && (
                    <span className="absolute -top-3 left-8 rounded-full bg-orange-500 dark:bg-navy-800 px-3 py-1 text-[11px] font-bold text-white">Most popular</span>
                  )}
                  <h3 className="text-xl font-extrabold">{t.name}</h3>
                  <p className={`mt-1 text-sm ${on ? 'text-white/70' : 'text-navy-800/55 dark:text-white/50'}`}>{t.range}</p>
                  <p className="mt-6 flex items-baseline gap-1">
                    <span className="text-4xl font-extrabold">{fmt(t.perOrder)}</span>
                    <span className={`text-sm ${on ? 'text-white/70' : 'text-navy-800/55 dark:text-white/50'}`}>/ order</span>
                  </p>
                  <p className={`text-sm ${on ? 'text-white/70' : 'text-navy-800/55 dark:text-white/50'}`}>+ {fmt(t.storage)} / mo storage</p>
                  <ul className="mt-6 space-y-3 text-sm">
                    {t.perks.map((p) => (
                      <li key={p} className="flex items-center gap-2.5">
                        <span className={`grid h-5 w-5 place-items-center rounded-full ${on ? 'bg-white text-orange-500 dark:text-orange-600' : 'bg-orange-500 text-white'}`}>
                          <Check className="h-3 w-3" strokeWidth={3} />
                        </span>
                        {p}
                      </li>
                    ))}
                  </ul>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onOpenRegister();
                    }}
                    className={`group mt-8 inline-flex h-12 w-full items-center justify-center gap-2 rounded-full text-sm font-semibold transition-all active:scale-95 ${
                      on ? 'bg-orange-500 dark:bg-navy-800 text-white hover:brightness-110' : 'bg-navy-800 dark:bg-white/10 text-white hover:bg-navy-700'
                    }`}
                  >
                    Choose {t.name}
                    <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                  </button>
                </article>
              </Reveal>
            );
          })}
        </div>
        <p className="mt-6 text-center text-xs text-navy-800/45 dark:text-white/40">Indicative estimate. Courier charges are billed at actuals. Final rates confirmed on approval.</p>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/* 11. Industries – expanding panels                                   */
/* ------------------------------------------------------------------ */
const INDUSTRIES = [
  { icon: Shirt, name: 'Fashion & apparel', text: 'Size and colour variants tracked per SKU, quick re-packs, and tidy returns restocking.', tags: ['Variants', 'Returns', 'Seasonal peaks'], to: 'pricing' },
  { icon: Smartphone, name: 'Electronics', text: 'Serial-aware handling, secure storage zones and careful, protective packing for fragile gear.', tags: ['High-value', 'Fragile', 'Verified'], to: 'showcase' },
  { icon: Sparkles, name: 'Beauty & care', text: 'Batch and expiry awareness with clean, sealed packaging that keeps unboxing premium.', tags: ['Batch tracking', 'Sealed', 'Branded'], to: 'services' },
  { icon: Sofa, name: 'Home & living', text: 'Bulky and oversize items on pallet racking, with courier rules tuned for large parcels.', tags: ['Oversize', 'Pallets', 'Courier rules'], to: 'process' },
  { icon: Gift, name: 'Gifts & lifestyle', text: 'Gift-ready packing with custom memos and notes — perfect for campaign and festival rushes.', tags: ['Custom memo', 'Campaigns', 'Gift wrap'], to: 'order-flow' },
];

export function IndustriesSection() {
  const [open, setOpen] = useState(0);
  return (
    <section id="industries" className="bg-cream/60 dark:bg-navy-900 py-24 lg:py-32 overflow-hidden">
      <div className="mx-auto max-w-7xl px-5 lg:px-8">
        <Reveal>
          <SectionHeading eyebrow="Industries" title="Made for the way your category ships." />
        </Reveal>

        <div className="mt-12 flex flex-col gap-4 lg:h-[420px] lg:flex-row">
          {INDUSTRIES.map(({ icon: Icon, name, text, tags, to }, i) => {
            const on = open === i;
            return (
              <Reveal key={name} delay={i * 80} className={`min-w-0 transition-all duration-700 ease-out ${on ? 'lg:flex-[3.2]' : 'lg:flex-1'}`}>
                <div
                  role="button"
                  tabIndex={0}
                  onClick={() => setOpen(i)}
                  onMouseEnter={() => setOpen(i)}
                  onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && setOpen(i)}
                  className={`relative h-full cursor-pointer overflow-hidden rounded-[2rem] p-7 outline-none transition-colors duration-500 ${
                    on ? 'bg-navy-800 dark:bg-navy-800 text-white shadow-2xl shadow-navy-800/20' : 'bg-white dark:bg-navy-800/60 text-navy-800 dark:text-white ring-1 ring-navy-100 dark:ring-white/10'
                  }`}
                >
                  <div className="flex items-center gap-4 lg:flex-col lg:items-start lg:gap-0">
                    <span className={`grid h-14 w-14 shrink-0 place-items-center rounded-2xl transition-all duration-500 ${on ? 'bg-orange-500 text-white rotate-6' : 'bg-orange-50 dark:bg-orange-500/10 text-orange-500'}`}>
                      <Icon className="h-7 w-7" />
                    </span>
                    <h3 className={`text-xl font-extrabold lg:mt-5 ${on ? '' : 'lg:[writing-mode:vertical-rl] lg:rotate-180 lg:mt-8'}`}>{name}</h3>
                  </div>

                  <div className={`grid transition-all duration-500 ${on ? 'grid-rows-[1fr] opacity-100 mt-4' : 'grid-rows-[0fr] opacity-0'}`}>
                    <div className="overflow-hidden">
                      <p className="max-w-md leading-relaxed text-white/70">{text}</p>
                      <div className="mt-5 flex flex-wrap gap-2">
                        {tags.map((t) => (
                          <span key={t} className="rounded-full bg-white/10 px-3 py-1 text-xs font-semibold text-orange-300">{t}</span>
                        ))}
                      </div>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          scrollToId(to);
                        }}
                        className="mt-6 inline-flex items-center gap-1.5 text-sm font-bold text-orange-400 hover:text-orange-300"
                      >
                        See how we handle it <ArrowRight className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </div>
              </Reveal>
            );
          })}
        </div>
      </div>
    </section>
  );
}
