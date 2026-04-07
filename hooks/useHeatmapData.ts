'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { fetchSP500Heatmap, apiHeatmapToDisplay } from '@/lib/api';
import { HEATMAP_POLL_INTERVAL_MS } from '@/lib/constants';
import type { HeatmapData } from '@/types/dashboard';

export interface HeatmapDataState {
  data: HeatmapData | null;
  isLoading: boolean;
  error: string | null;
}

/**
 * S&P 500 히트맵 데이터를 관리하는 훅.
 * `enabled`가 true일 때만 데이터를 패칭하고 자동 리프레시한다.
 */
export function useHeatmapData(enabled: boolean): HeatmapDataState & { refetch: () => void } {
  const [data, setData] = useState<HeatmapData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const mountedRef = useRef(true);
  const fetchedOnceRef = useRef(false);

  const load = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const raw = await fetchSP500Heatmap();
      if (!mountedRef.current) return;
      const display = apiHeatmapToDisplay(raw);
      setData(display);
      fetchedOnceRef.current = true;
    } catch (err: unknown) {
      if (!mountedRef.current) return;
      const message =
        err instanceof Error ? err.message : '히트맵 데이터를 불러올 수 없습니다';
      setError(message);
    } finally {
      if (mountedRef.current) setIsLoading(false);
    }
  }, []);

  // 최초 활성화 시 패칭, 이후 자동 리프레시
  useEffect(() => {
    mountedRef.current = true;
    if (!enabled) return;

    // 이미 데이터가 있으면 재패칭 스킵 (탭 전환 시 깜빡임 방지)
    if (!fetchedOnceRef.current) {
      load();
    }

    const interval = setInterval(load, HEATMAP_POLL_INTERVAL_MS);
    return () => {
      clearInterval(interval);
    };
  }, [enabled, load]);

  // 언마운트 시 cleanup
  useEffect(() => {
    return () => {
      mountedRef.current = false;
    };
  }, []);

  return { data, isLoading, error, refetch: load };
}
