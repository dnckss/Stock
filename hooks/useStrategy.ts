'use client';

import { useCallback, useEffect, useState } from 'react';
import { fetchStrategy } from '@/lib/api';
import {
  STRATEGY_TOP_PICKS_COUNT,
} from '@/lib/strategyConstants';
import type {
  ApiStrategyResponse,
  StrategyData,
  StrategySectorItem,
  StrategyTopPick,
} from '@/types/dashboard';

function toFiniteNumber(value: unknown): number | null {
  const n = Number(value);
  if (!Number.isFinite(n)) return null;
  return n;
}

function parseSectorItem(raw: ApiStrategyResponse['sector_data'][number]): StrategySectorItem | null {
  const sector = String(raw?.sector ?? raw?.name ?? '').trim();
  const divergence =
    toFiniteNumber(raw?.divergence) ??
    toFiniteNumber(raw?.avg_divergence) ??
    toFiniteNumber((raw as unknown as { avgDivergence?: unknown })?.avgDivergence) ??
    toFiniteNumber((raw as unknown as { divergenceRate?: unknown })?.divergenceRate) ??
    toFiniteNumber((raw as unknown as { divergence_pct?: unknown })?.divergence_pct) ??
    toFiniteNumber((raw as unknown as { divergencePct?: unknown })?.divergencePct);

  if (!sector || divergence === null) return null;
  return { sector, divergence };
}

function parseTopPick(raw: ApiStrategyResponse['top_picks'][number]): StrategyTopPick | null {
  const ticker = String(
    raw?.ticker ??
      (raw as unknown as { symbol?: unknown })?.symbol ??
      (raw as unknown as { ticker_symbol?: unknown })?.ticker_symbol ??
      '',
  ).trim();
  const rationale = String(
    raw?.rationale ??
      (raw as unknown as { reason?: unknown })?.reason ??
      (raw as unknown as { explanation?: unknown })?.explanation ??
      '',
  ).trim();
  if (!ticker || !rationale) return null;
  return { ticker, rationale };
}

function parseStrategyResponse(raw: unknown): StrategyData | null {
  if (!raw || typeof raw !== 'object') return null;

  const response = raw as ApiStrategyResponse;

  const marketSummary = String(response?.market_summary ?? '').trim();
  if (!marketSummary) return null;

  const sectorRawList = Array.isArray(response?.sector_data)
    ? response.sector_data
    : [];
  const sectors = sectorRawList
    .map(parseSectorItem)
    .filter((x): x is StrategySectorItem => x !== null);

  if (sectors.length === 0) return null;

  const topSectorName = String(response?.top_sector?.name ?? '').trim();
  const topSectorReason = String(response?.top_sector?.reason ?? '').trim();
  if (!topSectorName || !topSectorReason) return null;

  const topPickRawList = Array.isArray(response?.top_picks)
    ? response.top_picks
    : [];
  const topPicks = topPickRawList
    .map(parseTopPick)
    .filter((x): x is StrategyTopPick => x !== null)
    .slice(0, STRATEGY_TOP_PICKS_COUNT);
  if (topPicks.length === 0) return null;

  return {
    marketSummary,
    sectors,
    topSector: { name: topSectorName, reason: topSectorReason },
    topPicks,
  };
}

export interface UseStrategyReturn {
  data: StrategyData | null;
  isLoading: boolean;
  error: string | null;
  retry: () => void;
}

export function useStrategyData(): UseStrategyReturn {
  const [data, setData] = useState<StrategyData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const controller = new AbortController();

    fetchStrategy()
      .then((raw) => {
        if (controller.signal.aborted) return;
        const parsed = parseStrategyResponse(raw);
        if (!parsed) {
          setError('전략 응답 형식이 올바르지 않습니다');
          setData(null);
          return;
        }
        setData(parsed);
      })
      .catch((err: unknown) => {
        if (controller.signal.aborted) return;
        setData(null);
        setError(
          err instanceof Error
            ? err.message
            : '전략 데이터를 불러올 수 없습니다',
        );
      })
      .finally(() => {
        if (controller.signal.aborted) return;
        setIsLoading(false);
      });

    return () => {
      controller.abort();
    };
  }, []);

  const retry = useCallback(() => {
    const controller = new AbortController();
    setIsLoading(true);
    setError(null);

    fetchStrategy()
      .then((raw) => {
        if (controller.signal.aborted) return;
        const parsed = parseStrategyResponse(raw);
        if (!parsed) {
          setData(null);
          setError('전략 응답 형식이 올바르지 않습니다');
          return;
        }
        setData(parsed);
      })
      .catch((err: unknown) => {
        if (controller.signal.aborted) return;
        setData(null);
        setError(
          err instanceof Error
            ? err.message
            : '전략 데이터를 불러올 수 없습니다',
        );
      })
      .finally(() => {
        if (!controller.signal.aborted) setIsLoading(false);
      });

    return () => controller.abort();
  }, []);

  return { data, isLoading, error, retry };
}

