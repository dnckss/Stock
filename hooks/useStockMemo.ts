'use client';

import { useState, useCallback, useEffect } from 'react';

const STORAGE_KEY = 'quantix_memos';

function loadAll(): Record<string, string> {
  if (typeof window === 'undefined') return {};
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch { return {}; }
}

function saveAll(memos: Record<string, string>) {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(memos)); } catch { /* silent */ }
}

export function useStockMemo(ticker: string) {
  const [memo, setMemoState] = useState('');

  useEffect(() => {
    const all = loadAll();
    setMemoState(all[ticker.toUpperCase()] ?? '');
  }, [ticker]);

  const setMemo = useCallback((value: string) => {
    setMemoState(value);
    const all = loadAll();
    if (value.trim()) {
      all[ticker.toUpperCase()] = value;
    } else {
      delete all[ticker.toUpperCase()];
    }
    saveAll(all);
  }, [ticker]);

  return { memo, setMemo };
}
