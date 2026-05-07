'use client';

import { useState, useEffect, useCallback } from 'react';

export type Theme = 'dark' | 'soft';

const STORAGE_KEY = 'quantix_theme';

export function useTheme() {
  const [theme, setThemeState] = useState<Theme>('dark');

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const saved = localStorage.getItem(STORAGE_KEY) as Theme | null;
    if (saved === 'soft') {
      setThemeState('soft');
      document.documentElement.setAttribute('data-theme', 'soft');
    }
  }, []);

  const setTheme = useCallback((t: Theme) => {
    setThemeState(t);
    localStorage.setItem(STORAGE_KEY, t);
    if (t === 'soft') {
      document.documentElement.setAttribute('data-theme', 'soft');
    } else {
      document.documentElement.removeAttribute('data-theme');
    }
  }, []);

  const toggle = useCallback(() => {
    setTheme(theme === 'dark' ? 'soft' : 'dark');
  }, [theme, setTheme]);

  return { theme, setTheme, toggle };
}
