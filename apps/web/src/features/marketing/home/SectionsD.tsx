'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { Plus, Star, ChevronLeft, ChevronRight, Quote, Boxes, MapPin, Phone, Mail } from 'lucide-react';
import { Reveal } from './Reveal';
import { ClickableImage, SectionHeading, scrollToId } from './shared';
import { IMG } from './images';

/* ------------------------------------------------------------------ */
/* 12. Testimonials – auto-rotating carousel                           */
/* SAMPLE COPY: replace with real merchant quotes before launch.       */
/* ------------------------------------------------------------------ */
const QUOTES = [
  { name: 'Nusrat J.', role: 'Fashion boutique · Dhaka', text: 'I stopped packing orders at midnight. Parcels leave the same day and returns are restocked without me lifting a finger.', to: 'order-flow' },
  { name: 'Rafiq A.', role: 'Electronics reseller · Chattogram', text: 'The barcode checks ended our wrong-item complaints. The weekly COD statement finally makes my accounting easy.', to: 'pricing' },
  { name: 'Tania S.', role: 'Beauty brand · Sylhet', text: 'Branded memos in every parcel made our unboxing feel premium, and stock numbers in the dashboard are always right.', to: 'why-us' },
  { name: 'Imran H.', role: 'Home décor · Dhaka', text: 'Bulky items used to be a nightmare. Now they sit on racks and ship with the right courier automatically.', to: 'industries' },
];

export function TestimonialsSection() {
  const [i, setI] = useState(0);
  const [hover, setHover] = useState(false);

  useEffect(() => {
    if (hover) return;
    const t = window.setTimeout(() => setI((x) => (x + 1) % QUOTES.length), 6500);
    return () => window.clearTimeout(t);
  }, [i, hover]);

  const q = QUOTES[i];
  const go = (d: number) => setI((x) => (x + d + QUOTES.length) % QUOTES.length);

  return (
    <section id="testimonials" className="bg-navy-800 dark:bg-navy-900 py-24 lg:py-32 overflow-hidden">
      <div className="mx-auto max-w-5xl px-5 lg:px-8">
        <Reveal>
          <SectionHeading center light eyebrow="Testimonials" title="Merchants who got their evenings back." />
        </Reveal>

        <div className="relative mt-14" onMouseEnter={() => setHover(true)} onMouseLeave={() => setHover(false)}>
          <Quote className="absolute -top-6 left-2 h-20 w-20 text-orange-500/20" />
          <div key={i} className="fx-in relative rounded-[2rem] bg-white/[0.07] ring-1 ring-white/10 p-8 sm:p-12 backdrop-blur">
            <div className="flex gap-1 text-orange-400">
              {Array.from({ length: 5 }).map((_, k) => (
                <Star key={k} className="h-5 w-5 fill-current" />
              ))}
            </div>
            <p className="mt-6 text-2xl sm:text-3xl font-semibold leading-snug text-white">“{q.text}”</p>
            <div className="mt-8 flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <span className="grid h-12 w-12 place-items-center rounded-full bg-orange-500 text-lg font-extrabold text-white">{q.name[0]}</span>
                <div>
                  <p className="font-bold text-white">{q.name}</p>
                  <p className="text-sm text-white/55">{q.role}</p>
                </div>
              </div>
              <button type="button" onClick={() => scrollToId(q.to)} className="text-sm font-bold text-orange-400 hover:text-orange-300">
                See how it works →
              </button>
            </div>
          </div>

          <div className="mt-8 flex items-center justify-center gap-5">
            <button type="button" onClick={() => go(-1)} aria-label="Previous" className="grid h-11 w-11 place-items-center rounded-full bg-white/10 text-white hover:bg-orange-500 transition-colors">
              <ChevronLeft className="h-5 w-5" />
            </button>
            <div className="flex items-center gap-2">
              {QUOTES.map((_, k) => (
                <button
                  key={k}
                  type="button"
                  onClick={() => setI(k)}
                  aria-label={`Testimonial ${k + 1}`}
                  className={`h-2 rounded-full transition-all duration-500 ${k === i ? 'w-8 bg-orange-500' : 'w-2 bg-white/30 hover:bg-white/50'}`}
                />
              ))}
            </div>
            <button type="button" onClick={() => go(1)} aria-label="Next" className="grid h-11 w-11 place-items-center rounded-full bg-white/10 text-white hover:bg-orange-500 transition-colors">
              <ChevronRight className="h-5 w-5" />
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/* 13. FAQ                                                             */
/* ------------------------------------------------------------------ */
const FAQS = [
  ['How do I get started?', 'Register as a merchant, get approved, then create an inbound shipment from your portal. Send the cartons to our hub and we handle the rest.'],
  ['Can I connect my online store?', 'Yes. WooCommerce, Shopify and our REST API push orders straight to the warehouse. Selling on Facebook? Submit orders from the portal in one click.'],
  ['Which couriers do you use?', 'Steadfast, Pathao and RedX are integrated. We choose the best courier per destination, or follow your preference.'],
  ['When do I receive my COD money?', 'COD collections are reconciled with the courier and paid out weekly to your bank account or bKash, with a downloadable itemised statement.'],
  ['What about returns?', 'Returned parcels are inspected on arrival. Good items go back on the shelf automatically and your inventory updates in real time.'],
];

export function FaqSection() {
  const [open, setOpen] = useState<number | null>(0);
  return (
    <section id="faq" className="bg-white dark:bg-navy-950 py-24 lg:py-32">
      <div className="mx-auto max-w-7xl px-5 lg:px-8 grid items-center gap-14 lg:grid-cols-[380px_1fr]">
        <Reveal className="mx-auto w-full max-w-[340px] lg:max-w-none">
          <ClickableImage
            src={IMG.returns.src}
            w={IMG.returns.w}
            h={IMG.returns.h}
            alt="Returns inspection table"
            target="cta"
            hint="Still unsure? Talk to us"
            imgClassName="fx-float-slow"
            sizes="(min-width: 1024px) 380px, 80vw"
          />
        </Reveal>
        <div>
          <Reveal>
            <SectionHeading eyebrow="FAQ" title="Good questions." />
          </Reveal>
          <div className="mt-10 divide-y divide-navy-100 dark:divide-white/10 border-y border-navy-100 dark:border-white/10">
            {FAQS.map(([q, a], i) => {
              const isOpen = open === i;
              return (
                <div key={q}>
                  <button type="button" onClick={() => setOpen(isOpen ? null : i)} aria-expanded={isOpen} className="flex w-full items-center justify-between gap-6 py-6 text-left">
                    <span className="text-lg font-semibold text-navy-800 dark:text-white">{q}</span>
                    <span className={`grid h-9 w-9 shrink-0 place-items-center rounded-full transition-all duration-300 ${isOpen ? 'rotate-45 bg-orange-500 text-white' : 'bg-navy-50 dark:bg-white/10 text-navy-800 dark:text-white'}`}>
                      <Plus className="h-4 w-4" />
                    </span>
                  </button>
                  <div className={`grid transition-all duration-300 ease-out ${isOpen ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'}`}>
                    <div className="overflow-hidden">
                      <p className="pb-6 pr-14 leading-relaxed text-navy-800/65 dark:text-white/60">{a}</p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/* 14. CTA – van drives in                                             */
/* ------------------------------------------------------------------ */
export function CtaSection({ onOpenRegister }: { onOpenRegister: () => void }) {
  const [arrived, setArrived] = useState(false);
  const ref = React.useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting) {
          setArrived(true);
          io.disconnect();
        }
      },
      { threshold: 0.3 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  return (
    <section id="cta" className="bg-white dark:bg-navy-950 pb-24 lg:pb-32">
      <div className="mx-auto max-w-7xl px-5 lg:px-8">
        <div ref={ref} className="relative overflow-hidden rounded-[2.5rem] bg-orange-500 px-8 py-14 sm:px-14 lg:py-16">
          <div className="pointer-events-none absolute -left-16 -bottom-24 h-72 w-72 rounded-full bg-white/15" />
          <div className="pointer-events-none absolute right-1/3 -top-24 h-60 w-60 rounded-full bg-navy-800/15" />
          <div className="relative grid items-center gap-8 lg:grid-cols-[1.2fr_1fr]">
            <div>
              <h2 className="text-4xl lg:text-5xl font-extrabold tracking-tight text-white leading-[1.1]">Ready to hand off the heavy lifting?</h2>
              <p className="mt-4 max-w-xl text-lg text-white/85">Open a merchant account in minutes and send your first inbound shipment this week.</p>
              <div className="mt-8 flex flex-wrap gap-3">
                <button type="button" onClick={onOpenRegister} className="h-12 rounded-full bg-navy-800 px-8 text-sm font-semibold text-white shadow-xl transition-all hover:bg-navy-900 active:scale-95">
                  Become a merchant
                </button>
                <button type="button" onClick={() => scrollToId('contact')} className="inline-flex h-12 items-center rounded-full bg-white/15 px-8 text-sm font-semibold text-white ring-1 ring-white/40 transition-colors hover:bg-white/25">
                  Talk to us
                </button>
              </div>
            </div>
            <div
              className="mx-auto w-full max-w-[420px] transition-all duration-[1600ms] ease-out"
              style={{ transform: arrived ? 'translateX(0)' : 'translateX(-130%)', opacity: arrived ? 1 : 0 }}
            >
              <ClickableImage src={IMG.van.src} w={IMG.van.w} h={IMG.van.h} alt="Delivery van with open doors" onClick={onOpenRegister} hint="Start shipping" imgClassName="fx-bob !drop-shadow-[0_24px_24px_rgba(0,0,0,0.25)]" sizes="420px" />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/* 15. Footer                                                          */
/* ------------------------------------------------------------------ */
export function HomeFooter({ onOpenLogin, onOpenRegister }: { onOpenLogin: () => void; onOpenRegister: () => void }) {
  const link = 'text-sm text-white/60 hover:text-orange-400 transition-colors';
  const nav: [string, string][] = [
    ['Services', 'services'],
    ['How it works', 'process'],
    ['Showcase', 'showcase'],
    ['Pricing', 'pricing'],
    ['Industries', 'industries'],
    ['FAQ', 'faq'],
  ];
  return (
    <footer id="contact" className="bg-navy-800 dark:bg-navy-900 border-t border-white/5 text-white">
      <div className="mx-auto max-w-7xl px-5 lg:px-8 py-16 grid gap-12 md:grid-cols-2 lg:grid-cols-12">
        <div className="lg:col-span-5">
          <Link href="/" className="flex items-center gap-2.5">
            <span className="grid h-9 w-9 place-items-center rounded-xl bg-orange-500 text-white">
              <Boxes className="h-5 w-5" />
            </span>
            <span className="text-lg font-extrabold">
              Fulfill<span className="text-orange-500">io</span>
            </span>
          </Link>
          <p className="mt-5 max-w-sm text-sm leading-relaxed text-white/60">
            Warehousing, pick &amp; pack, courier management and COD settlement for online merchants in Bangladesh.
          </p>
        </div>
        <div className="lg:col-span-2">
          <h4 className="text-sm font-bold">Explore</h4>
          <ul className="mt-4 space-y-2.5">
            {nav.map(([l, id]) => (
              <li key={id}>
                <button type="button" onClick={() => scrollToId(id)} className={link}>{l}</button>
              </li>
            ))}
          </ul>
        </div>
        <div className="lg:col-span-2">
          <h4 className="text-sm font-bold">Portal</h4>
          <ul className="mt-4 space-y-2.5">
            <li><button type="button" onClick={onOpenLogin} className={link}>Log in</button></li>
            <li><button type="button" onClick={onOpenRegister} className={link}>Register</button></li>
          </ul>
        </div>
        <div className="lg:col-span-3">
          <h4 className="text-sm font-bold">Contact</h4>
          <ul className="mt-4 space-y-3 text-sm text-white/60">
            <li className="flex gap-2.5"><MapPin className="mt-0.5 h-4 w-4 shrink-0 text-orange-400" /> Dhaka Fulfilment Hub, Bangladesh</li>
            <li className="flex gap-2.5"><Phone className="mt-0.5 h-4 w-4 shrink-0 text-orange-400" /> +880 1XXX-XXXXXX</li>
            <li className="flex gap-2.5"><Mail className="mt-0.5 h-4 w-4 shrink-0 text-orange-400" /> hello@fulfillio.online</li>
          </ul>
        </div>
      </div>
      <div className="border-t border-white/10 py-6 text-center text-xs text-white/40">
        © {new Date().getFullYear()} Fulfillio.online — All rights reserved.
      </div>
    </footer>
  );
}
