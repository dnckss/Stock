'use client';

import { useState, useEffect, useRef, useMemo } from 'react';
import { fetchPricePerformance, parsePricePerformance } from '@/lib/api';
import type { PricePerformanceItem } from '@/types/dashboard';
import type { RadarPeriod } from '@/lib/constants';

/** ticker → period → PricePerformanceItem */
type PerfCache = Map<string, Map<string, PricePerformanceItem>>;

/** ticker → PricePerformanceItem (선택된 기간) */
export type PerfMap = Map<string, PricePerformanceItem>;

export interface UseRadarPerformanceReturn {
  perfMap: PerfMap;
  isLoading: boolean;
}

function buildPerfMap(
  cache: PerfCache,
  tickers: string[],
  period: RadarPeriod,
): PerfMap {
  const result = new Map<string, PricePerformanceItem>();
  for (const t of tickers) {
    const key = t.toUpperCase();
    const item = cache.get(key)?.get(period);
    if (item) result.set(key, item);
  }
  return result;
}

export function useRadarPerformance(
  tickers: string[],
  period: RadarPeriod,
): UseRadarPerformanceReturn {
  const cacheRef = useRef<PerfCache>(new Map());
  const [perfMap, setPerfMap] = useState<PerfMap>(new Map());
  const [isLoading, setIsLoading] = useState(false);

  // tickers 배열 참조 안정화 — 내용이 같으면 동일 참조 유지
  const tickerKey = useMemo(() => tickers.map((t) => t.toUpperCase()).join(','), [tickers]);
  const stableTickers = useMemo(() => (tickerKey ? tickerKey.split(',') : []), [tickerKey]);

  useEffect(() => {
    if (period === '1D') {
      setPerfMap(new Map());
      return;
    }

    const missing = stableTickers.filter(
      (t) => !cacheRef.current.has(t),
    );

    if (missing.length === 0) {
      setPerfMap(buildPerfMap(cacheRef.current, stableTickers, period));
      return;
    }

    let cancelled = false;
    setIsLoading(true);

    Promise.allSettled(
      missing.map(async (t) => {
        const raw = await fetchPricePerformance(t);
        const parsed = parsePricePerformance(raw);
        return { ticker: t, data: parsed };
      }),
    ).then((results) => {
      if (cancelled) return;

      for (const r of results) {
        if (r.status === 'fulfilled') {
          cacheRef.current.set(r.value.ticker, r.value.data);
        }
      }

      setPerfMap(buildPerfMap(cacheRef.current, stableTickers, period));
      setIsLoading(false);
    });

    return () => { cancelled = true; };
  }, [stableTickers, period]);

  return { perfMap, isLoading };
}
