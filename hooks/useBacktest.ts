'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { fetchBacktestTrades } from '@/lib/api';
import type { BacktestTradeResponse, BacktestSource } from '@/types/dashboard';

export interface UseBacktestReturn {
  data: BacktestTradeResponse | null;
  isLoading: boolean;
  error: string | null;
  source: BacktestSource;
  setSource: (s: BacktestSource) => void;
  refresh: () => void;
}

export function useBacktest(): UseBacktestReturn {
  const [data, setData] = useState<BacktestTradeResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [source, setSourceState] = useState<BacktestSource>('strategist');
  const mountedRef = useRef(true);

  const load = useCallback(async (src: BacktestSource, isRefresh = false) => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetchBacktestTrades({
        source: src,
        horizon: 5,
        lookback_days: 90,
        include_open: true,
        refresh: isRefresh,
      });
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
    load(source);
    return () => { mountedRef.current = false; };
  }, [load, source]);

  const setSource = useCallback((s: BacktestSource) => {
    setSourceState(s);
  }, []);

  const refresh = useCallback(() => {
    load(source, true);
  }, [load, source]);

  return { data, isLoading, error, source, setSource, refresh };
}
