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

export function useHeatmapData(): HeatmapDataState & { refetch: () => void } {
  const [data, setData] = useState<HeatmapData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fetchedOnceRef = useRef(false);

  const load = useCallback(async (signal?: AbortSignal) => {
    setIsLoading(true);
    setError(null);
    try {
      const raw = await fetchSP500Heatmap();
      if (signal?.aborted) return;
      const display = apiHeatmapToDisplay(raw);
      setData(display);
      fetchedOnceRef.current = true;
    } catch (err: unknown) {
      if (signal?.aborted) return;
      const message =
        err instanceof Error ? err.message : '히트맵 데이터를 불러올 수 없습니다';
      setError(message);
    } finally {
      if (!signal?.aborted) setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    const controller = new AbortController();

    if (!fetchedOnceRef.current) {
      load(controller.signal);
    }

    const interval = setInterval(() => load(controller.signal), HEATMAP_POLL_INTERVAL_MS);

    return () => {
      controller.abort();
      clearInterval(interval);
    };
  }, [load]);

  return { data, isLoading, error, refetch: () => load() };
}
