'use client';

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';

/**
 * The marketing home page, the admin panel, and the merchant portal follow the device / user theme (light | dark).
 * Every other area (warehouse/worker, login, print) is dark-only, so force `dark` there.
 */
export function isThemedRoute(pathname: string | null): boolean {
  if (!pathname) return false;
  return (
    pathname === '/' ||
    pathname === '/admin' ||
    pathname.startsWith('/admin/') ||
    pathname === '/merchant' ||
    pathname.startsWith('/merchant/')
  );
}

export function ThemeRouteGuard() {
  const pathname = usePathname();

  useEffect(() => {
    if (!isThemedRoute(pathname)) {
      document.documentElement.classList.add('dark');
    } else {
      const saved = localStorage.getItem('fulfillio-theme');
      const isSystemDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      const shouldBeDark = saved === 'dark' || (saved === 'system' && isSystemDark) || (!saved && isSystemDark);
      if (shouldBeDark) {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
    }
  }, [pathname]);

  return null;
}
