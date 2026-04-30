'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { fetchBacktestTrades } from '@/lib/api';
import type { BacktestTradeResponse, BacktestSource } from '@/types/dashboard';

export type GroupBy = 'day' | 'hour' | 'minute';

export interface UseBacktestReturn {
  data: BacktestTradeResponse | null;
  isLoading: boolean;
  error: string | null;
  source: BacktestSource;
  groupBy: GroupBy;
  setSource: (s: BacktestSource) => void;
  setGroupBy: (g: GroupBy) => void;
  refresh: () => void;
}

export function useBacktest(): UseBacktestReturn {
  const [data, setData] = useState<BacktestTradeResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [source, setSourceState] = useState<BacktestSource>('strategist');
  const [groupBy, setGroupByState] = useState<GroupBy>('day');
  const mountedRef = useRef(true);

  const load = useCallback(async (src: BacktestSource, grp: GroupBy, isRefresh = false) => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetchBacktestTrades({
        source: src,
        horizon: 5,
        lookback_days: 90,
        include_open: true,
        refresh: isRefresh,
        group_by: grp,
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
    load(source, groupBy);
    return () => { mountedRef.current = false; };
  }, [load, source, groupBy]);

  const setSource = useCallback((s: BacktestSource) => { setSourceState(s); }, []);
  const setGroupBy = useCallback((g: GroupBy) => { setGroupByState(g); }, []);
  const refresh = useCallback(() => { load(source, groupBy, true); }, [load, source, groupBy]);

  return { data, isLoading, error, source, groupBy, setSource, setGroupBy, refresh };
}
