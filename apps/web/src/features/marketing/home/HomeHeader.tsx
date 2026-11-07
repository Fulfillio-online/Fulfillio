'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { Menu, X, Sun, Moon, Laptop, Boxes } from 'lucide-react';
import { useTheme } from '@/lib/hooks/useTheme';

interface HomeHeaderProps {
  onOpenLogin: () => void;
  onOpenRegister: () => void;
}

const NAV = [
  { label: 'Services', href: '#services' },
  { label: 'How it works', href: '#process' },
  { label: 'Showcase', href: '#showcase' },
  { label: 'Pricing', href: '#pricing' },
  { label: 'Industries', href: '#industries' },
  { label: 'FAQ', href: '#faq' },
];

export function HomeHeader({ onOpenLogin, onOpenRegister }: HomeHeaderProps) {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  const { theme, changeTheme } = useTheme();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 16);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const cycleTheme = () => changeTheme(theme === 'system' ? 'light' : theme === 'light' ? 'dark' : 'system');
  const ThemeIcon = theme === 'system' ? Laptop : theme === 'light' ? Sun : Moon;

  return (
    <header
      className={`fixed inset-x-0 top-0 z-50 transition-all duration-300 ${
        scrolled
          ? 'bg-white/85 dark:bg-navy-950/85 backdrop-blur-xl border-b border-navy-100 dark:border-white/10'
          : 'bg-transparent border-b border-transparent'
      }`}
    >
      <div className="mx-auto max-w-7xl px-5 lg:px-8 h-[72px] flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2.5">
          <span className="grid h-9 w-9 place-items-center rounded-xl bg-orange-500 text-white shadow-lg shadow-orange-500/30">
            <Boxes className="h-5 w-5" />
          </span>
          <span className="text-lg font-extrabold tracking-tight text-navy-800 dark:text-white">
            Fulfill<span className="text-orange-500">io</span>
          </span>
        </Link>

        <nav className="hidden lg:flex items-center gap-8">
          {NAV.map((l) => (
            <a
              key={l.href}
              href={l.href}
              className="text-sm font-medium text-navy-800/70 dark:text-white/70 hover:text-orange-500 dark:hover:text-orange-400 transition-colors"
            >
              {l.label}
            </a>
          ))}
        </nav>

        <div className="hidden md:flex items-center gap-2.5">
          <button
            type="button"
            onClick={cycleTheme}
            aria-label={`Theme: ${theme}`}
            title={`Theme: ${theme}`}
            className="grid h-10 w-10 place-items-center rounded-full text-navy-800/70 dark:text-white/70 hover:bg-navy-100 dark:hover:bg-white/10 transition-colors"
          >
            <ThemeIcon className="h-[18px] w-[18px]" />
          </button>
          <button
            type="button"
            onClick={onOpenLogin}
            className="h-10 px-5 rounded-full text-sm font-semibold text-navy-800 dark:text-white hover:bg-navy-100 dark:hover:bg-white/10 transition-colors"
          >
            Log in
          </button>
          <button
            type="button"
            onClick={onOpenRegister}
            className="h-10 px-5 rounded-full text-sm font-semibold text-white bg-orange-500 hover:bg-orange-600 shadow-lg shadow-orange-500/25 active:scale-95 transition-all"
          >
            Get started
          </button>
        </div>

        <div className="flex md:hidden items-center gap-1">
          <button
            type="button"
            onClick={cycleTheme}
            aria-label="Toggle theme"
            className="grid h-10 w-10 place-items-center rounded-full text-navy-800 dark:text-white"
          >
            <ThemeIcon className="h-[18px] w-[18px]" />
          </button>
          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            aria-label="Menu"
            className="grid h-10 w-10 place-items-center rounded-full text-navy-800 dark:text-white"
          >
            {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {open && (
        <div className="md:hidden bg-white dark:bg-navy-950 border-t border-navy-100 dark:border-white/10 px-5 py-5 space-y-1">
          {NAV.map((l) => (
            <a
              key={l.href}
              href={l.href}
              onClick={() => setOpen(false)}
              className="block py-3 text-base font-medium text-navy-800 dark:text-white border-b border-navy-100/70 dark:border-white/5"
            >
              {l.label}
            </a>
          ))}
          <div className="pt-4 grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => {
                setOpen(false);
                onOpenLogin();
              }}
              className="h-11 rounded-full text-sm font-semibold border border-navy-100 dark:border-white/15 text-navy-800 dark:text-white"
            >
              Log in
            </button>
            <button
              type="button"
              onClick={() => {
                setOpen(false);
                onOpenRegister();
              }}
              className="h-11 rounded-full text-sm font-semibold bg-orange-500 text-white"
            >
              Get started
            </button>
          </div>
        </div>
      )}
    </header>
  );
}
