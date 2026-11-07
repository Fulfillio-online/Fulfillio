'use client';

import { useState, useEffect } from 'react';

export type ThemeMode = 'system' | 'light' | 'dark';

export function useTheme() {
  const [theme, setTheme] = useState<ThemeMode>('system');
  const [resolvedTheme, setResolvedTheme] = useState<'light' | 'dark'>('dark');

  useEffect(() => {
    // Check saved preference or default to system
    const saved = localStorage.getItem('fulfillio-theme') as ThemeMode | null;
    if (saved && (saved === 'light' || saved === 'dark' || saved === 'system')) {
      setTheme(saved);
    }
  }, []);

  useEffect(() => {
    const media = window.matchMedia('(prefers-color-scheme: dark)');

    const applyTheme = () => {
      let activeIsDark = false;
      if (theme === 'system') {
        activeIsDark = media.matches;
      } else {
        activeIsDark = theme === 'dark';
      }

      setResolvedTheme(activeIsDark ? 'dark' : 'light');

      if (activeIsDark) {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
    };

    applyTheme();

    const handleMediaChange = () => {
      if (theme === 'system') {
        applyTheme();
      }
    };

    media.addEventListener('change', handleMediaChange);
    return () => media.removeEventListener('change', handleMediaChange);
  }, [theme]);

  const changeTheme = (newTheme: ThemeMode) => {
    setTheme(newTheme);
    localStorage.setItem('fulfillio-theme', newTheme);
  };

  return {
    theme,
    resolvedTheme,
    changeTheme,
  };
}
