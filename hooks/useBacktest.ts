'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { fetchBacktestSummary } from '@/lib/api';
import { BACKTEST_DEFAULT_LOOKBACK, BACKTEST_HORIZONS } from '@/lib/constants';
import type { BacktestResponse } from '@/types/dashboard';

export interface UseBacktestReturn {
  data: BacktestResponse | null;
  isLoading: boolean;
  error: string | null;
  retry: () => void;
}

export function useBacktest(): UseBacktestReturn {
  const [data, setData] = useState<BacktestResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const mountedRef = useRef(true);

  const load = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetchBacktestSummary(BACKTEST_DEFAULT_LOOKBACK, [...BACKTEST_HORIZONS]);
      if (mountedRef.current) setData(res);
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

  return { data, isLoading, error, retry: load };
}
