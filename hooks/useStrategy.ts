'use client';

import { useCallback, useEffect, useState } from 'react';
import { fetchStrategy } from '@/lib/api';
import { STRATEGY_TOP_PICKS_COUNT } from '@/lib/strategyConstants';
import type {
  ApiStrategyResponse,
  StrategyData,
  StrategySectorItem,
  StrategyRecommendation,
  StrategyNewsTheme,
  StrategyTechnicalIndicators,
  StrategyPriceLevel,
  StrategyRelatedNews,
  EconAnalysis,
  EconSurprise,
  UpcomingRisk,
  RiskWarning,
  StrategyDirection,
  StrategyConfidence,
  ThemeSentiment,
  MacdSignal,
  MarketRegime,
  EconImpactType,
  RiskLevel,
  RiskWarningLevel,
} from '@/types/dashboard';

// ── Validators ──

function toFiniteNumber(value: unknown): number | null {
  const n = Number(value);
  if (!Number.isFinite(n)) return null;
  return n;
}

const VALID_DIRECTIONS = new Set<StrategyDirection>(['BUY', 'SELL', 'SHORT', 'HOLD']);
const VALID_CONFIDENCES = new Set<StrategyConfidence>(['high', 'medium', 'low']);
const VALID_SENTIMENTS = new Set<ThemeSentiment>(['positive', 'negative', 'neutral']);
const VALID_RISK_LEVELS = new Set<RiskLevel>(['high', 'medium', 'low']);
const VALID_REGIMES = new Set<MarketRegime>(['bull', 'bear', 'sideways', 'volatile']);
const VALID_MACD = new Set<MacdSignal>(['bullish', 'bearish', 'neutral']);
const VALID_ECON_IMPACT = new Set<EconImpactType>(['positive', 'negative', 'neutral']);
const VALID_WARNING_LEVELS = new Set<RiskWarningLevel>(['critical', 'high', 'medium']);

function toDirection(value: unknown): StrategyDirection {
  const s = String(value ?? '').trim().toUpperCase();
  return VALID_DIRECTIONS.has(s as StrategyDirection) ? (s as StrategyDirection) : 'HOLD';
}

function toConfidence(value: unknown): StrategyConfidence {
  const s = String(value ?? '').trim().toLowerCase();
  return VALID_CONFIDENCES.has(s as StrategyConfidence) ? (s as StrategyConfidence) : 'medium';
}

function toSentiment(value: unknown): ThemeSentiment {
  const s = String(value ?? '').trim().toLowerCase();
  return VALID_SENTIMENTS.has(s as ThemeSentiment) ? (s as ThemeSentiment) : 'neutral';
}

function toRiskLevel(value: unknown): RiskLevel {
  const s = String(value ?? '').trim().toLowerCase();
  return VALID_RISK_LEVELS.has(s as RiskLevel) ? (s as RiskLevel) : 'medium';
}

function toRegime(value: unknown): MarketRegime | null {
  const s = String(value ?? '').trim().toLowerCase();
  return VALID_REGIMES.has(s as MarketRegime) ? (s as MarketRegime) : null;
}

function toMacdSignal(value: unknown): MacdSignal {
  const s = String(value ?? '').trim().toLowerCase();
  return VALID_MACD.has(s as MacdSignal) ? (s as MacdSignal) : 'neutral';
}

function toEconImpact(value: unknown): EconImpactType {
  const s = String(value ?? '').trim().toLowerCase();
  return VALID_ECON_IMPACT.has(s as EconImpactType) ? (s as EconImpactType) : 'neutral';
}

function toWarningLevel(value: unknown): RiskWarningLevel {
  const s = String(value ?? '').trim().toLowerCase();
  return VALID_WARNING_LEVELS.has(s as RiskWarningLevel) ? (s as RiskWarningLevel) : 'medium';
}

// ── Parsers ──

function parseSectorItem(raw: ApiStrategyResponse['sector_data'][number]): StrategySectorItem | null {
  const sector = String(raw?.sector ?? raw?.name ?? '').trim();
  const divergence =
    toFiniteNumber(raw?.divergence) ??
    toFiniteNumber(raw?.avg_divergence) ??
    toFiniteNumber((raw as unknown as Record<string, unknown>)?.avgDivergence) ??
    toFiniteNumber((raw as unknown as Record<string, unknown>)?.divergenceRate) ??
    toFiniteNumber((raw as unknown as Record<string, unknown>)?.divergence_pct);
  if (!sector || divergence === null) return null;
  return { sector, divergence };
}

function parseNewsTheme(raw: unknown): StrategyNewsTheme | null {
  if (!raw || typeof raw !== 'object') return null;
  const r = raw as Record<string, unknown>;
  const theme = String(r.theme ?? '').trim();
  if (!theme) return null;
  const tickers = Array.isArray(r.tickers)
    ? r.tickers.map((t) => String(t).trim().toUpperCase()).filter(Boolean)
    : [];
  return {
    theme,
    tickers,
    sentiment: toSentiment(r.sentiment),
    detail: String(r.detail ?? '').trim(),
  };
}

function parseTechnicalIndicators(raw: unknown): StrategyTechnicalIndicators | null {
  if (!raw || typeof raw !== 'object') return null;
  const r = raw as Record<string, unknown>;
  const rsi = toFiniteNumber(r.rsi);
  const bollingerPosition = toFiniteNumber(r.bollinger_position);
  const macdHistogram = toFiniteNumber(r.macd_histogram);
  const macdSignal = toMacdSignal(r.macd_signal);
  if (rsi === null && bollingerPosition === null && macdSignal === 'neutral' && macdHistogram === null) return null;
  return { rsi, bollingerPosition, macdSignal, macdHistogram };
}

function parsePriceLevel(raw: unknown): StrategyPriceLevel | null {
  if (!raw || typeof raw !== 'object') return null;
  const r = raw as Record<string, unknown>;
  const date = String(r.date ?? '').trim();
  const close = toFiniteNumber(r.close);
  if (!date || close === null) return null;
  return { date, close };
}

function parseRelatedNews(raw: unknown): StrategyRelatedNews | null {
  if (!raw || typeof raw !== 'object') return null;
  const r = raw as Record<string, unknown>;
  const headline = String(r.headline ?? r.title ?? '').trim();
  if (!headline) return null;
  return {
    headline,
    url: String(r.url ?? '').trim(),
    source: String(r.source ?? '').trim(),
    sentiment: toSentiment(r.sentiment),
  };
}

function parseRecommendation(raw: unknown): StrategyRecommendation | null {
  if (!raw || typeof raw !== 'object') return null;
  const r = raw as Record<string, unknown>;
  const ticker = String(r.ticker ?? r.symbol ?? '').trim().toUpperCase();
  const rationale = String(r.rationale ?? r.reason ?? '').trim();
  if (!ticker || !rationale) return null;

  return {
    ticker,
    name: String(r.name ?? '').trim(),
    direction: toDirection(r.direction),
    confidence: toConfidence(r.confidence),
    rationale,
    entryPrice: toFiniteNumber(r.entry_price),
    stopLoss: toFiniteNumber(r.stop_loss),
    targetPrice: toFiniteNumber(r.target_price),
    riskRewardRatio: toFiniteNumber(r.risk_reward_ratio),
    technicalIndicators: parseTechnicalIndicators(r.technical_indicators),
    priceHistory: Array.isArray(r.price_history)
      ? r.price_history.map(parsePriceLevel).filter((x): x is StrategyPriceLevel => x !== null)
      : [],
    relatedNews: Array.isArray(r.related_news)
      ? r.related_news.map(parseRelatedNews).filter((x): x is StrategyRelatedNews => x !== null)
      : [],
  };
}

function parseEconSurprise(raw: unknown): EconSurprise | null {
  if (!raw || typeof raw !== 'object') return null;
  const r = raw as Record<string, unknown>;
  const event = String(r.event ?? r.indicator ?? '').trim();
  if (!event) return null;
  return {
    event,
    date: String(r.date ?? '').trim(),
    actual: r.actual != null ? String(r.actual).trim() : null,
    forecast: r.forecast != null ? String(r.forecast).trim() : null,
    impact: toEconImpact(r.impact),
    detail: String(r.detail ?? '').trim(),
  };
}

function parseUpcomingRisk(raw: unknown): UpcomingRisk | null {
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

function parseEconAnalysis(raw: unknown): EconAnalysis | null {
  if (!raw || typeof raw !== 'object') return null;
  const r = raw as Record<string, unknown>;
  const summary = typeof r.summary === 'string' && r.summary.trim() ? r.summary.trim() : null;
  const recentSurprises = Array.isArray(r.recent_surprises)
    ? r.recent_surprises.map(parseEconSurprise).filter((x): x is EconSurprise => x !== null)
    : [];
  const upcomingRisks = Array.isArray(r.upcoming_risks)
    ? r.upcoming_risks.map(parseUpcomingRisk).filter((x): x is UpcomingRisk => x !== null)
    : [];
  if (!summary && recentSurprises.length === 0 && upcomingRisks.length === 0) return null;
  return { summary, recentSurprises, upcomingRisks };
}

function parseRiskWarning(raw: unknown): RiskWarning | null {
  if (!raw || typeof raw !== 'object') return null;
  const r = raw as Record<string, unknown>;
  const message = String(r.message ?? '').trim();
  if (!message) return null;
  return { level: toWarningLevel(r.level), message };
}

// ── Legacy fallback converters ──

function convertLegacyPick(raw: unknown): StrategyRecommendation | null {
  if (!raw || typeof raw !== 'object') return null;
  const r = raw as Record<string, unknown>;
  const ticker = String(r.ticker ?? r.symbol ?? '').trim().toUpperCase();
  const rationale = String(r.rationale ?? r.reason ?? '').trim();
  if (!ticker || !rationale) return null;
  return {
    ticker,
    name: '',
    direction: toDirection(r.direction),
    confidence: toConfidence(r.confidence),
    rationale,
    entryPrice: null,
    stopLoss: null,
    targetPrice: null,
    riskRewardRatio: null,
    technicalIndicators: null,
    priceHistory: [],
    relatedNews: [],
  };
}

function convertLegacyEcon(
  econImpact: string | null | undefined,
  riskEvents: unknown[] | undefined,
): EconAnalysis | null {
  const summary = typeof econImpact === 'string' && econImpact.trim() ? econImpact.trim() : null;
  const upcomingRisks = Array.isArray(riskEvents)
    ? riskEvents.map(parseUpcomingRisk).filter((x): x is UpcomingRisk => x !== null)
    : [];
  if (!summary && upcomingRisks.length === 0) return null;
  return { summary, recentSurprises: [], upcomingRisks };
}

// ── Main parser ──

function parseStrategyResponse(raw: unknown): StrategyData | null {
  if (!raw || typeof raw !== 'object') return null;
  const response = raw as ApiStrategyResponse;

  const marketSummary = String(response?.market_summary ?? '').trim();
  if (!marketSummary) return null;

  const sectors = (Array.isArray(response?.sector_data) ? response.sector_data : [])
    .map(parseSectorItem)
    .filter((x): x is StrategySectorItem => x !== null);

  const topSectorName = String(response?.top_sector?.name ?? '').trim();
  const topSectorReason = String(response?.top_sector?.reason ?? '').trim();

  // recommendations → top_picks 폴백
  let recommendations = (Array.isArray(response?.recommendations) ? response.recommendations : [])
    .map(parseRecommendation)
    .filter((x): x is StrategyRecommendation => x !== null)
    .slice(0, STRATEGY_TOP_PICKS_COUNT);

  if (recommendations.length === 0 && Array.isArray(response?.top_picks)) {
    recommendations = response.top_picks
      .map(convertLegacyPick)
      .filter((x): x is StrategyRecommendation => x !== null)
      .slice(0, STRATEGY_TOP_PICKS_COUNT);
  }

  const newsThemes = (Array.isArray(response?.news_themes) ? response.news_themes : [])
    .map(parseNewsTheme)
    .filter((x): x is StrategyNewsTheme => x !== null);

  // econ_analysis → econ_impact + risk_events 폴백
  const econAnalysis = response?.econ_analysis
    ? parseEconAnalysis(response.econ_analysis)
    : convertLegacyEcon(response?.econ_impact, response?.risk_events);

  const riskWarnings = (Array.isArray(response?.risk_warnings) ? response.risk_warnings : [])
    .map(parseRiskWarning)
    .filter((x): x is RiskWarning => x !== null);

  const marketRegime = toRegime(response?.market_regime);

  const fearGreedRaw = toFiniteNumber(response?.fear_greed);
  const fearGreed = fearGreedRaw !== null ? Math.max(0, Math.min(100, fearGreedRaw)) : null;

  const generatedAt =
    typeof response?.generated_at === 'string' && response.generated_at.trim()
      ? response.generated_at.trim()
      : null;

  return {
    marketSummary,
    marketRegime,
    fearGreed,
    sectors,
    topSector: {
      name: topSectorName || 'N/A',
      reason: topSectorReason || '',
    },
    recommendations,
    newsThemes,
    econAnalysis,
    riskWarnings,
    generatedAt,
  };
}

// ── Hook ──

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

  const load = useCallback((signal?: AbortSignal) => {
    setIsLoading(true);
    setError(null);

    fetchStrategy()
      .then((raw) => {
        if (signal?.aborted) return;
        const parsed = parseStrategyResponse(raw);
        if (!parsed) {
          setError('전략 응답 형식이 올바르지 않습니다');
          setData(null);
          return;
        }
        setData(parsed);
      })
      .catch((err: unknown) => {
        if (signal?.aborted) return;
        setData(null);
        setError(
          err instanceof Error ? err.message : '전략 데이터를 불러올 수 없습니다',
        );
      })
      .finally(() => {
        if (signal?.aborted) return;
        setIsLoading(false);
      });
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    load(controller.signal);
    return () => controller.abort();
  }, [load]);

  const retry = useCallback(() => {
    load();
  }, [load]);

  return { data, isLoading, error, retry };
}
