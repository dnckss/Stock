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
  StrategyNewsTheme,
  StrategyRiskEvent,
  StrategyDirection,
  StrategyConfidence,
  ThemeSentiment,
  RiskLevel,
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

const VALID_DIRECTIONS = new Set<StrategyDirection>(['BUY', 'SELL', 'HOLD']);
const VALID_CONFIDENCES = new Set<StrategyConfidence>(['high', 'medium', 'low']);
const VALID_SENTIMENTS = new Set<ThemeSentiment>(['positive', 'negative', 'neutral']);
const VALID_RISK_LEVELS = new Set<RiskLevel>(['high', 'medium', 'low']);

function toDirection(value: unknown): StrategyDirection {
  const s = String(value ?? '').trim().toUpperCase();
  return VALID_DIRECTIONS.has(s as StrategyDirection)
    ? (s as StrategyDirection)
    : 'HOLD';
}

function toConfidence(value: unknown): StrategyConfidence {
  const s = String(value ?? '').trim().toLowerCase();
  return VALID_CONFIDENCES.has(s as StrategyConfidence)
    ? (s as StrategyConfidence)
    : 'medium';
}

function toSentiment(value: unknown): ThemeSentiment {
  const s = String(value ?? '').trim().toLowerCase();
  return VALID_SENTIMENTS.has(s as ThemeSentiment)
    ? (s as ThemeSentiment)
    : 'neutral';
}

function toRiskLevel(value: unknown): RiskLevel {
  const s = String(value ?? '').trim().toLowerCase();
  return VALID_RISK_LEVELS.has(s as RiskLevel)
    ? (s as RiskLevel)
    : 'medium';
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
  return {
    ticker,
    direction: toDirection(raw?.direction),
    confidence: toConfidence(raw?.confidence),
    rationale,
  };
}

function parseNewsTheme(raw: unknown): StrategyNewsTheme | null {
  if (!raw || typeof raw !== 'object') return null;
  const r = raw as Record<string, unknown>;
  const theme = String(r.theme ?? '').trim();
  const detail = String(r.detail ?? '').trim();
  if (!theme) return null;
  const tickers = Array.isArray(r.tickers)
    ? r.tickers.map((t) => String(t).trim().toUpperCase()).filter(Boolean)
    : [];
  return {
    theme,
    tickers,
    sentiment: toSentiment(r.sentiment),
    detail,
  };
}

function parseRiskEvent(raw: unknown): StrategyRiskEvent | null {
  if (!raw || typeof raw !== 'object') return null;
  const r = raw as Record<string, unknown>;
  const event = String(r.event ?? '').trim();
  if (!event) return null;
  return {
    event,
    date: String(r.date ?? '').trim(),
    riskLevel: toRiskLevel(r.risk_level),
    detail: String(r.detail ?? '').trim(),
  };
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

  const newsThemes = (Array.isArray(response?.news_themes) ? response.news_themes : [])
    .map(parseNewsTheme)
    .filter((x): x is StrategyNewsTheme => x !== null);

  const econImpact =
    typeof response?.econ_impact === 'string' && response.econ_impact.trim()
      ? response.econ_impact.trim()
      : null;

  const riskEvents = (Array.isArray(response?.risk_events) ? response.risk_events : [])
    .map(parseRiskEvent)
    .filter((x): x is StrategyRiskEvent => x !== null);

  const generatedAt =
    typeof response?.generated_at === 'string' && response.generated_at.trim()
      ? response.generated_at.trim()
      : null;

  return {
    marketSummary,
    sectors,
    topSector: { name: topSectorName, reason: topSectorReason },
    topPicks,
    newsThemes,
    econImpact,
    riskEvents,
    generatedAt,
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

