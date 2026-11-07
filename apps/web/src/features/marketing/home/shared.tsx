'use client';

import React from 'react';
import Image from 'next/image';
import { ArrowUpRight } from 'lucide-react';

/* ------------------------------------------------------------------ */
/* Smooth navigation between sections (+ brief highlight pulse)        */
/* ------------------------------------------------------------------ */
export function scrollToId(id: string) {
  const el = document.getElementById(id);
  if (!el) return;
  el.scrollIntoView({ behavior: 'smooth', block: 'start' });
  el.classList.remove('section-flash');
  // restart animation
  void el.offsetWidth;
  el.classList.add('section-flash');
  window.setTimeout(() => el.classList.remove('section-flash'), 1800);
}

/* ------------------------------------------------------------------ */
/* Section heading                                                     */
/* ------------------------------------------------------------------ */
interface HeadingProps {
  eyebrow: string;
  title: React.ReactNode;
  sub?: string;
  center?: boolean;
  light?: boolean;
}

export function SectionHeading({ eyebrow, title, sub, center, light }: HeadingProps) {
  return (
    <div className={`max-w-2xl ${center ? 'mx-auto text-center' : ''}`}>
      <p className="text-xs font-bold uppercase tracking-[0.2em] text-orange-500">{eyebrow}</p>
      <h2
        className={`mt-3 text-4xl lg:text-5xl font-extrabold tracking-tight leading-[1.1] ${
          light ? 'text-white' : 'text-navy-800 dark:text-white'
        }`}
      >
        {title}
      </h2>
      {sub && (
        <p className={`mt-4 text-lg leading-relaxed ${light ? 'text-white/65' : 'text-navy-800/65 dark:text-white/60'}`}>{sub}</p>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Clickable transparent PNG – click anywhere to jump to another       */
/* section; optional pulsing hotspots for finer targets.               */
/* ------------------------------------------------------------------ */
export interface HotspotDef {
  x: number; // % from left
  y: number; // % from top
  label: string;
  target?: string; // section id to scroll to
  onSelect?: () => void;
  active?: boolean;
}

interface ClickableImageProps {
  src: string;
  alt: string;
  w: number;
  h: number;
  target?: string;
  hint?: string;
  onClick?: () => void;
  priority?: boolean;
  className?: string;
  imgClassName?: string;
  hotspots?: HotspotDef[];
  sizes?: string;
}

export function ClickableImage({
  src,
  alt,
  w,
  h,
  target,
  hint,
  onClick,
  priority,
  className = '',
  imgClassName = '',
  hotspots,
  sizes = '(min-width: 1024px) 50vw, 100vw',
}: ClickableImageProps) {
  const go = () => {
    if (onClick) onClick();
    else if (target) scrollToId(target);
  };
  return (
    <div
      role="button"
      tabIndex={0}
      aria-label={hint ? `${alt} — ${hint}` : alt}
      onClick={go}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          go();
        }
      }}
      className={`group/img relative cursor-pointer select-none outline-none focus-visible:ring-4 focus-visible:ring-orange-400/50 rounded-3xl ${className}`}
    >
      <Image
        src={src}
        alt={alt}
        width={w}
        height={h}
        priority={priority}
        sizes={sizes}
        draggable={false}
        className={`h-auto w-full object-contain drop-shadow-[0_28px_28px_rgba(18,40,76,0.22)] dark:drop-shadow-[0_28px_28px_rgba(0,0,0,0.5)] transition-transform duration-700 ease-out group-hover/img:scale-[1.035] ${imgClassName}`}
      />

      {hotspots?.map((h) => (
        <button
          key={h.label}
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            if (h.onSelect) h.onSelect();
            else if (h.target) scrollToId(h.target);
          }}
          style={{ left: `${h.x}%`, top: `${h.y}%` }}
          className="group/hot absolute -translate-x-1/2 -translate-y-1/2 z-10 outline-none"
          aria-label={h.label}
        >
          <span className="relative grid h-9 w-9 place-items-center">
            <span className="fx-pulse-ring absolute inset-0 rounded-full bg-orange-500/60" />
            <span
              className={`relative h-4 w-4 rounded-full ring-4 transition-all duration-300 group-hover/hot:scale-125 ${
                h.active ? 'bg-white ring-orange-500' : 'bg-orange-500 ring-white/90'
              } shadow-lg`}
            />
          </span>
          <span
            className={`pointer-events-none absolute left-1/2 top-full mt-1 -translate-x-1/2 whitespace-nowrap rounded-full bg-navy-800 px-3 py-1 text-[11px] font-semibold text-white shadow-lg transition-all duration-200 ${
              h.active ? 'opacity-100' : 'opacity-0 group-hover/hot:opacity-100 group-focus-visible/hot:opacity-100'
            }`}
          >
            {h.label}
          </span>
        </button>
      ))}

      {hint && (
        <span className="pointer-events-none absolute -bottom-3 left-1/2 -translate-x-1/2 inline-flex items-center gap-1 rounded-full bg-orange-500 px-4 py-1.5 text-xs font-bold text-white shadow-lg shadow-orange-500/30 opacity-0 translate-y-2 transition-all duration-300 group-hover/img:opacity-100 group-hover/img:translate-y-0 group-focus-visible/img:opacity-100 group-focus-visible/img:translate-y-0">
          {hint}
          <ArrowUpRight className="h-3.5 w-3.5" />
        </span>
      )}
    </div>
  );
}

/* Small inline "go to section" link */
export function SectionLink({ target, children, className = '' }: { target: string; children: React.ReactNode; className?: string }) {
  return (
    <button
      type="button"
      onClick={() => scrollToId(target)}
      className={`group/link inline-flex items-center gap-1 text-sm font-bold text-orange-600 dark:text-orange-400 ${className}`}
    >
      {children}
      <ArrowUpRight className="h-4 w-4 transition-transform group-hover/link:translate-x-0.5 group-hover/link:-translate-y-0.5" />
    </button>
  );
}
