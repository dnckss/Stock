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

/** 백엔드/외부 API 부하 방지를 위한 동시 요청 제한 */
const FETCH_CONCURRENCY = 6;

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

/** 동시 요청 수를 제한하여 순차적으로 batch 실행. 각 batch 완료 시 콜백 호출. */
async function processInBatches<T>(
  items: T[],
  worker: (item: T) => Promise<void>,
  concurrency: number,
  onBatchComplete: () => void,
): Promise<void> {
  for (let i = 0; i < items.length; i += concurrency) {
    const batch = items.slice(i, i + concurrency);
    await Promise.allSettled(batch.map(worker));
    onBatchComplete();
  }
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

    // 캐시에 이미 있는 데이터로 일단 즉시 반영
    setPerfMap(buildPerfMap(cacheRef.current, stableTickers, period));

    if (missing.length === 0) return;

    let cancelled = false;
    setIsLoading(true);

    processInBatches(
      missing,
      async (t) => {
        try {
          const raw = await fetchPricePerformance(t);
          const parsed = parsePricePerformance(raw);
          if (!cancelled) cacheRef.current.set(t, parsed);
        } catch {
          // 개별 실패는 다른 티커 처리에 영향 없음
        }
      },
      FETCH_CONCURRENCY,
      () => {
        if (cancelled) return;
        // batch 단위로 누적 데이터 반영 (progressive UI 업데이트)
        setPerfMap(buildPerfMap(cacheRef.current, stableTickers, period));
      },
    ).then(() => {
      if (cancelled) return;
      setIsLoading(false);
    });

    return () => { cancelled = true; };
  }, [stableTickers, period]);

  return { perfMap, isLoading };
}
