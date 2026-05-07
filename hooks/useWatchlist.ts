'use client';

import { useState, useCallback, useEffect } from 'react';

const STORAGE_KEY = 'quantix_watchlist';

function load(): string[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch { return []; }
}

function save(tickers: string[]) {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(tickers)); } catch { /* silent */ }
}

export function useWatchlist() {
  const [tickers, setTickers] = useState<string[]>([]);

  useEffect(() => { setTickers(load()); }, []);

  const add = useCallback((ticker: string) => {
    setTickers((prev) => {
      if (prev.includes(ticker.toUpperCase())) return prev;
      const next = [...prev, ticker.toUpperCase()];
      save(next);
      return next;
    });
  }, []);

  const remove = useCallback((ticker: string) => {
    setTickers((prev) => {
      const next = prev.filter((t) => t !== ticker.toUpperCase());
      save(next);
      return next;
    });
  }, []);

  const toggle = useCallback((ticker: string) => {
    const upper = ticker.toUpperCase();
    setTickers((prev) => {
      const next = prev.includes(upper) ? prev.filter((t) => t !== upper) : [...prev, upper];
      save(next);
      return next;
    });
  }, []);

  const has = useCallback((ticker: string) => tickers.includes(ticker.toUpperCase()), [tickers]);

  return { tickers, add, remove, toggle, has };
}
