'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { fetchBacktestSummary, fetchBacktestLive } from '@/lib/api';
import { BACKTEST_DEFAULT_LOOKBACK, BACKTEST_HORIZONS } from '@/lib/constants';
import type { BacktestResponse, BacktestLiveResponse } from '@/types/dashboard';

export interface UseBacktestReturn {
  summary: BacktestResponse | null;
  live: BacktestLiveResponse | null;
  isLoading: boolean;
  error: string | null;
  retry: () => void;
}

export function useBacktest(): UseBacktestReturn {
  const [summary, setSummary] = useState<BacktestResponse | null>(null);
  const [live, setLive] = useState<BacktestLiveResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const mountedRef = useRef(true);

  const load = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [summaryRes, liveRes] = await Promise.allSettled([
        fetchBacktestSummary(BACKTEST_DEFAULT_LOOKBACK, [...BACKTEST_HORIZONS]),
        fetchBacktestLive(40, [...BACKTEST_HORIZONS]),
      ]);

      if (!mountedRef.current) return;

      if (summaryRes.status === 'fulfilled') setSummary(summaryRes.value);
      if (liveRes.status === 'fulfilled') setLive(liveRes.value);

      if (summaryRes.status === 'rejected' && liveRes.status === 'rejected') {
        setError('백테스트 데이터를 불러올 수 없습니다');
      }
    } catch (err: unknown) {
      if (mountedRef.current) {
        setError(err instanceof Error ? err.message : '백테스트 데이터를 불러올 수 없습니다');
      }
    } finally {
      if (mountedRef.current) setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    mountedRef.current = true;
    load();
    return () => { mountedRef.current = false; };
  }, [load]);

  return { summary, live, isLoading, error, retry: load };
}
