'use client';

import React, { useState } from 'react';
import { ArrowRight, ShieldCheck, ScanBarcode, Wallet, PackageCheck, Truck, BadgeCheck } from 'lucide-react';
import { ClickableImage, scrollToId } from './shared';
import { IMG } from './images';

interface HomeHeroProps {
  onOpenRegister: () => void;
  onOpenLogin: () => void;
}

const VOLUMES = ['Under 100 orders', '100 – 500 orders', '500 – 2,000 orders', '2,000+ orders'];
const CATEGORIES = ['Fashion & apparel', 'Electronics', 'Beauty & care', 'Home & living', 'Other'];

function RoadTruck() {
  return (
    <div className="relative h-14 overflow-hidden" aria-hidden>
      <div className="absolute inset-x-0 bottom-3 h-px bg-navy-800/15 dark:bg-white/15" />
      <div className="absolute inset-x-0 bottom-[9px] h-[3px] opacity-40 [background:repeating-linear-gradient(90deg,#F26B1D_0_18px,transparent_18px_42px)]" />
      <div className="absolute bottom-[14px] left-0" style={{ animation: 'fx-drive 16s linear infinite' }}>
        <svg width="92" height="40" viewBox="0 0 92 40" fill="none">
          <rect x="2" y="4" width="56" height="26" rx="4" fill="#F26B1D" />
          <rect x="8" y="10" width="14" height="14" rx="2" fill="#fff" opacity=".9" />
          <rect x="26" y="10" width="14" height="14" rx="2" fill="#fff" opacity=".9" />
          <path d="M60 10h16l10 10v10H60V10Z" fill="#12284C" />
          <path d="M65 14h9l6 6H65v-6Z" fill="#9CC4F5" />
          <circle cx="20" cy="32" r="6" fill="#0D1F3C" /><circle cx="20" cy="32" r="2.2" fill="#cbd5e1" />
          <circle cx="72" cy="32" r="6" fill="#0D1F3C" /><circle cx="72" cy="32" r="2.2" fill="#cbd5e1" />
          <rect x="86" y="22" width="6" height="3" rx="1.5" fill="#FDE68A" />
        </svg>
      </div>
    </div>
  );
}

export function HomeHero({ onOpenRegister, onOpenLogin }: HomeHeroProps) {
  const [volume, setVolume] = useState(VOLUMES[1]);
  const [category, setCategory] = useState(CATEGORIES[0]);

  const selectCls =
    'h-12 w-full rounded-xl bg-white text-navy-800 text-sm font-medium px-4 outline-none focus:ring-2 focus:ring-orange-400 appearance-none cursor-pointer';

  return (
    <section id="top" className="relative overflow-hidden pt-[104px] bg-gradient-to-b from-cream via-white to-white dark:from-navy-950 dark:via-navy-950 dark:to-navy-900">
      <div className="pointer-events-none absolute inset-0 opacity-60 dark:opacity-30 [background-image:radial-gradient(#12284C22_1px,transparent_1px)] dark:[background-image:radial-gradient(#ffffff22_1px,transparent_1px)] [background-size:26px_26px] [mask-image:linear-gradient(to_bottom,black,transparent_75%)]" />

      <div className="relative mx-auto max-w-7xl px-5 lg:px-8 grid lg:grid-cols-12 gap-10 lg:gap-6 items-center pb-10 lg:pb-16">
        {/* Copy */}
        <div className="lg:col-span-5">
          <span className="fx-in inline-flex items-center gap-2 rounded-full border border-orange-200 dark:border-orange-400/30 bg-white/80 dark:bg-white/5 px-3.5 py-1.5 text-xs font-semibold text-orange-600 dark:text-orange-300">
            <span className="relative flex h-2 w-2">
              <span className="fx-pulse-ring absolute inline-flex h-full w-full rounded-full bg-orange-400" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-orange-500" />
            </span>
            Warehouse · Packing · Courier · COD
          </span>

          <h1 className="fx-in mt-6 text-[2.6rem] sm:text-6xl font-extrabold leading-[1.05] tracking-tight text-navy-800 dark:text-white" style={{ ['--d' as string]: '100ms' }}>
            Space for your stock.
            <br />
            <span className="relative inline-block text-orange-500">
              We ship it.
              <svg className="absolute -bottom-2 left-0 w-full" height="10" viewBox="0 0 200 10" fill="none" preserveAspectRatio="none">
                <path d="M2 7C50 2 120 2 198 6" stroke="#F26B1D" strokeWidth="3" strokeLinecap="round" opacity=".45" />
              </svg>
            </span>
          </h1>

          <p className="fx-in mt-6 max-w-lg text-lg leading-relaxed text-navy-800/70 dark:text-white/65" style={{ ['--d' as string]: '200ms' }}>
            Send us your products once. We store them, pick &amp; pack every order, hand parcels to the courier and
            settle your COD cash — every week.
          </p>
          <p className="fx-in mt-2 text-sm text-navy-800/50 dark:text-white/40" style={{ ['--d' as string]: '260ms' }}>
            আপনি শুধু বিক্রি করুন — বাকিটা আমাদের ওয়্যারহাউস সামলাবে।
          </p>

          <div className="fx-in mt-7 flex flex-wrap items-center gap-3" style={{ ['--d' as string]: '320ms' }}>
            <button
              type="button"
              onClick={onOpenRegister}
              className="group inline-flex h-12 items-center gap-2 rounded-full bg-orange-500 px-7 text-sm font-semibold text-white shadow-xl shadow-orange-500/30 transition-all hover:bg-orange-600 active:scale-95"
            >
              Become a merchant
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
            </button>
            <button
              type="button"
              onClick={onOpenLogin}
              className="inline-flex h-12 items-center rounded-full border border-navy-800/15 dark:border-white/20 px-7 text-sm font-semibold text-navy-800 dark:text-white hover:bg-navy-100 dark:hover:bg-white/10 transition-colors"
            >
              Portal login
            </button>
          </div>

          <ul className="mt-8 grid grid-cols-3 gap-4 max-w-md">
            {[
              { i: ShieldCheck, t: 'Secure', s: 'CCTV & fire safety', to: 'trust' },
              { i: ScanBarcode, t: 'Verified', s: 'Barcode-scanned', to: 'services' },
              { i: Wallet, t: 'Weekly', s: 'COD payouts', to: 'pricing' },
            ].map(({ i: Icon, t, s, to }, idx) => (
              <li key={t} className="fx-in" style={{ ['--d' as string]: `${400 + idx * 90}ms` }}>
                <button type="button" onClick={() => scrollToId(to)} className="group flex items-start gap-2.5 text-left">
                  <span className="mt-0.5 grid h-9 w-9 shrink-0 place-items-center rounded-full bg-white dark:bg-white/10 shadow-sm ring-1 ring-navy-100 dark:ring-white/10 text-orange-500 transition-all group-hover:bg-orange-500 group-hover:text-white group-hover:scale-110">
                    <Icon className="h-4 w-4" />
                  </span>
                  <span className="leading-tight">
                    <span className="block text-sm font-bold text-navy-800 dark:text-white">{t}</span>
                    <span className="block text-xs text-navy-800/55 dark:text-white/50">{s}</span>
                  </span>
                </button>
              </li>
            ))}
          </ul>
        </div>

        {/* Visual – transparent PNG, no backdrop, with clickable hotspots */}
        <div className="lg:col-span-7 relative">
          <div className="relative mx-auto max-w-[760px]">
            <div className="fx-float-slow">
              <ClickableImage
                src={IMG.hero.src}
                w={IMG.hero.w}
                h={IMG.hero.h}
                alt="3D isometric warehouse with shelving racks, forklifts and a delivery van"
                priority
                target="showcase"
                hint="Tour the warehouse"
                hotspots={[
                  { x: 22, y: 36, label: 'Storage racks', target: 'showcase' },
                  { x: 57, y: 74, label: 'Pick & pack', target: 'services' },
                  { x: 79, y: 66, label: 'Dispatch dock', target: 'order-flow' },
                ]}
              />
            </div>

            <button
              type="button"
              onClick={() => scrollToId('order-flow')}
              className="fx-float absolute -left-2 top-6 sm:-left-6 hidden sm:flex items-center gap-3 rounded-2xl bg-white dark:bg-navy-800 px-4 py-3 text-left shadow-xl shadow-navy-800/10 ring-1 ring-navy-100 dark:ring-white/10 transition-transform hover:scale-105"
            >
              <span className="grid h-9 w-9 place-items-center rounded-xl bg-emerald-100 dark:bg-emerald-500/15 text-emerald-600 dark:text-emerald-400">
                <PackageCheck className="h-5 w-5" />
              </span>
              <span className="leading-tight">
                <span className="block text-xs text-navy-800/50 dark:text-white/50">Order #2841</span>
                <span className="block text-sm font-bold text-navy-800 dark:text-white">Packed &amp; verified</span>
              </span>
            </button>
            <button
              type="button"
              onClick={() => scrollToId('process')}
              className="fx-float fx-float-delay absolute -right-2 top-[38%] sm:-right-4 hidden sm:flex items-center gap-3 rounded-2xl bg-white dark:bg-navy-800 px-4 py-3 text-left shadow-xl shadow-navy-800/10 ring-1 ring-navy-100 dark:ring-white/10 transition-transform hover:scale-105"
            >
              <span className="grid h-9 w-9 place-items-center rounded-xl bg-orange-100 dark:bg-orange-500/15 text-orange-600 dark:text-orange-400">
                <Truck className="h-5 w-5" />
              </span>
              <span className="leading-tight">
                <span className="block text-xs text-navy-800/50 dark:text-white/50">Courier</span>
                <span className="block text-sm font-bold text-navy-800 dark:text-white">Out for delivery</span>
              </span>
            </button>
            <button
              type="button"
              onClick={() => scrollToId('pricing')}
              className="fx-float absolute left-8 bottom-2 hidden sm:flex items-center gap-3 rounded-2xl bg-navy-800 dark:bg-orange-500 px-4 py-3 text-left text-white shadow-xl shadow-navy-800/30 transition-transform hover:scale-105"
            >
              <BadgeCheck className="h-5 w-5 text-orange-300 dark:text-white" />
              <span className="leading-tight">
                <span className="block text-[11px] opacity-70">COD settled</span>
                <span className="block text-sm font-bold">৳ 48,200 → bKash</span>
              </span>
            </button>
          </div>
        </div>
      </div>

      {/* Quick-start bar */}
      <div className="relative mx-auto max-w-7xl px-5 lg:px-8 pb-6">
        <div className="rounded-3xl bg-navy-800 dark:bg-navy-900 dark:ring-1 dark:ring-white/10 p-5 sm:p-6 shadow-2xl shadow-navy-800/25">
          <div className="grid gap-4 lg:grid-cols-[1.1fr_1fr_1fr_auto] items-end">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-orange-400">Find your plan</p>
              <p className="mt-1 text-lg font-bold text-white leading-snug">Tell us about your shop — we&apos;ll set up your space.</p>
            </div>
            <label className="block">
              <span className="mb-1.5 block text-xs font-medium text-white/60">Monthly orders</span>
              <select value={volume} onChange={(e) => setVolume(e.target.value)} className={selectCls}>
                {VOLUMES.map((v) => (
                  <option key={v}>{v}</option>
                ))}
              </select>
            </label>
            <label className="block">
              <span className="mb-1.5 block text-xs font-medium text-white/60">What do you sell?</span>
              <select value={category} onChange={(e) => setCategory(e.target.value)} className={selectCls}>
                {CATEGORIES.map((v) => (
                  <option key={v}>{v}</option>
                ))}
              </select>
            </label>
            <button
              type="button"
              onClick={onOpenRegister}
              className="h-12 rounded-xl bg-orange-500 px-7 text-sm font-bold text-white hover:bg-orange-400 active:scale-95 transition-all"
            >
              Get started
            </button>
          </div>
        </div>
      </div>

      <RoadTruck />
    </section>
  );
}
