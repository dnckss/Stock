'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import {
  fetchStockDetail,
  fetchStockChart,
  fetchStockQuote,
  fetchStockAnalysis,
  parseStockAnalysis,
  requestReport,
  apiHistoryToChart,
  deriveConfidence,
  apiStockNewsToRelatedNews,
  parseQuote,
  parseChartBars,
} from '@/lib/api';
import {
  STOCK_NEWS_DEFAULT_LIMIT,
  STOCK_NEWS_FORCE_REFRESH_INTERVAL_MS,
  STOCK_NEWS_POLL_INTERVAL_MS,
  CHART_DEFAULT_PERIOD,
  QUOTE_POLL_INTERVAL_MS,
} from '@/lib/constants';
import type {
  SignalType,
  ChartDataPoint,
  RelatedNewsItem,
  StockQuote,
  ChartBar,
  ChartPeriod,
  StockAnalysis,
} from '@/types/dashboard';

export interface StockDetailState {
  ticker: string;
  name: string;
  signal: SignalType;
  priceReturn: number;
  sentiment: number;
  divergence: number;
  confidence: number;
  history: ChartDataPoint[];
  relatedNews: RelatedNewsItem[];
}

export interface UseStockDetailReturn {
  detail: StockDetailState | null;
  report: string | null;
  quote: StockQuote | null;
  chartBars: ChartBar[];
  chartPeriod: ChartPeriod;
  chartLoading: boolean;
  analysis: StockAnalysis | null;
  analysisLoading: boolean;
  analysisError: string | null;
  isLoading: boolean;
  reportLoading: boolean;
  newsRefreshing: boolean;
  lastNewsRefreshForced: boolean;
  error: string | null;
  reportError: string | null;
  retryReport: () => void;
  retryAnalysis: () => void;
  refreshLatestNews: () => void;
  setChartPeriod: (period: ChartPeriod) => void;
}

export function useStockDetail(ticker: string): UseStockDetailReturn {
  const [detail, setDetail] = useState<StockDetailState | null>(null);
  const [report, setReport] = useState<string | null>(null);
  const [quote, setQuote] = useState<StockQuote | null>(null);
  const [chartBars, setChartBars] = useState<ChartBar[]>([]);
  const [chartPeriod, setChartPeriodState] = useState<ChartPeriod>(CHART_DEFAULT_PERIOD as ChartPeriod);
  const [chartLoading, setChartLoading] = useState(false);
  const [analysis, setAnalysis] = useState<StockAnalysis | null>(null);
  const [analysisLoading, setAnalysisLoading] = useState(false);
  const [analysisError, setAnalysisError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [reportLoading, setReportLoading] = useState(false);
  const [newsRefreshing, setNewsRefreshing] = useState(false);
  const [lastNewsRefreshForced, setLastNewsRefreshForced] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [reportError, setReportError] = useState<string | null>(null);
  const inFlightNewsRef = useRef(false);
  const lastForcedAtRef = useRef(0);
  const pendingForceRef = useRef(false);
  const mountedRef = useRef(true);

  // ── AI Analysis ──
  const loadAnalysis = useCallback(async (t: string) => {
    setAnalysisLoading(true);
    setAnalysisError(null);
    try {
      const raw = await fetchStockAnalysis(t);
      if (mountedRef.current) {
        const parsed = parseStockAnalysis(raw);
        setAnalysis(parsed);
        if (!parsed) setAnalysisError('분석 결과를 파싱할 수 없습니다');
      }
    } catch (err: unknown) {
      if (mountedRef.current) {
        setAnalysisError(err instanceof Error ? err.message : 'AI 분석을 불러올 수 없습니다');
      }
    } finally {
      if (mountedRef.current) setAnalysisLoading(false);
    }
  }, []);

  // ── Report ──
  const generateReport = useCallback(async (t: string) => {
    setReportLoading(true);
    setReportError(null);
    try {
      const data = await requestReport(t);
      if (mountedRef.current) setReport(data.report);
    } catch (err: unknown) {
      if (mountedRef.current) {
        setReportError(
          err instanceof Error ? err.message : 'AI 리포트 생성에 실패했습니다',
        );
      }
    } finally {
      if (mountedRef.current) setReportLoading(false);
    }
  }, []);

  // ── Initial load ──
  useEffect(() => {
    mountedRef.current = true;
    let cancelled = false;
    setIsLoading(true);
    setError(null);
    setReport(null);
    setReportError(null);
    setAnalysis(null);
    setAnalysisError(null);
    setLastNewsRefreshForced(false);
    setQuote(null);
    setChartBars([]);
    setChartPeriodState(CHART_DEFAULT_PERIOD as ChartPeriod);

    fetchStockDetail(ticker, { newsLimit: STOCK_NEWS_DEFAULT_LIMIT, newsRefresh: 0, chartPeriod: CHART_DEFAULT_PERIOD })
      .then((data) => {
        if (cancelled) return;
        const history = Array.isArray(data.history)
          ? data.history
          : Array.isArray(data.analysis?.history)
            ? data.analysis.history
            : [];
        const latest = history[0];
        const signal = (latest?.signal ?? 'HOLD') as SignalType;
        const priceReturn = latest?.price_return ?? 0;
        const sentiment = latest?.sentiment ?? 0;
        const divergence = latest?.divergence ?? 0;

        const newsItems = data.stock_news ?? data.news ?? [];

        setDetail({
          ticker: data.ticker,
          name:
            typeof data.company_name === 'string' && data.company_name.trim()
              ? data.company_name.trim()
              : data.ticker,
          signal,
          priceReturn,
          sentiment,
          divergence,
          confidence: deriveConfidence(divergence),
          history: apiHistoryToChart(history),
          relatedNews: apiStockNewsToRelatedNews(newsItems),
        });
        setLastNewsRefreshForced(Boolean(data.stock_news_meta?.refresh));
        if (data.stock_news_meta?.refresh) lastForcedAtRef.current = Date.now();

        // report from analysis fallback
        const reportRecord = data.latest_report ?? data.analysis?.latest_report ?? null;

        // quote & chart from initial response
        if (data.quote) setQuote(parseQuote(data.quote));
        if (data.chart) setChartBars(parseChartBars(data.chart.bars));

        if (reportRecord) {
          setReport(reportRecord.report);
        } else {
          generateReport(data.ticker);
        }

        // AI 분석 비동기 로드
        loadAnalysis(data.ticker);
      })
      .catch((err: unknown) => {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : '데이터를 불러올 수 없습니다');
        }
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });

    return () => {
      cancelled = true;
      mountedRef.current = false;
    };
  }, [ticker, generateReport, loadAnalysis]);

  // ── Quote polling (8s) ──
  useEffect(() => {
    if (!ticker || isLoading) return;
    let cancelled = false;

    const poll = async () => {
      try {
        const q = await fetchStockQuote(ticker);
        if (!cancelled) setQuote(parseQuote(q));
      } catch {
        // polling 실패는 무시
      }
    };

    const interval = setInterval(poll, QUOTE_POLL_INTERVAL_MS);
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [ticker, isLoading]);

  // ── Chart period switch ──
  const setChartPeriod = useCallback(
    (period: ChartPeriod) => {
      setChartPeriodState(period);
      setChartLoading(true);
      fetchStockChart(ticker, period)
        .then((res) => {
          if (mountedRef.current) setChartBars(parseChartBars(res.bars));
        })
        .catch(() => {
          // chart load 실패 시 기존 데이터 유지
        })
        .finally(() => {
          if (mountedRef.current) setChartLoading(false);
        });
    },
    [ticker],
  );

  // ── News polling ──
  const refreshLatestNews = useCallback(() => {
    pendingForceRef.current = true;
  }, []);

  useEffect(() => {
    if (!ticker) return;
    let cancelled = false;

    async function refreshNews(force: boolean) {
      if (cancelled || inFlightNewsRef.current) return;
      inFlightNewsRef.current = true;
      setNewsRefreshing(true);
      try {
        const data = await fetchStockDetail(ticker, {
          newsLimit: STOCK_NEWS_DEFAULT_LIMIT,
          newsRefresh: force ? 1 : 0,
        });
        if (cancelled) return;
        setDetail((prev) => {
          if (!prev) return prev;
          return { ...prev, relatedNews: apiStockNewsToRelatedNews(data.stock_news ?? data.news ?? []) };
        });
        const forced = Boolean(data.stock_news_meta?.refresh);
        setLastNewsRefreshForced(forced);
        if (forced) lastForcedAtRef.current = Date.now();
      } catch {
        // 폴링 실패 무시
      } finally {
        if (!cancelled) setNewsRefreshing(false);
        inFlightNewsRef.current = false;
      }
    }

    const tick = () => {
      const now = Date.now();
      const shouldForce =
        pendingForceRef.current ||
        now - lastForcedAtRef.current >= STOCK_NEWS_FORCE_REFRESH_INTERVAL_MS;
      pendingForceRef.current = false;
      refreshNews(shouldForce);
    };

    const initialTimer = setTimeout(() => tick(), 800);
    const interval = setInterval(() => tick(), STOCK_NEWS_POLL_INTERVAL_MS);

    return () => {
      cancelled = true;
      clearTimeout(initialTimer);
      clearInterval(interval);
    };
  }, [ticker]);

  const retryReport = useCallback(() => {
    if (detail) generateReport(detail.ticker);
  }, [detail, generateReport]);

  const retryAnalysis = useCallback(() => {
    if (detail) loadAnalysis(detail.ticker);
  }, [detail, loadAnalysis]);

  return {
    detail,
    report,
    quote,
    chartBars,
    chartPeriod,
    chartLoading,
    analysis,
    analysisLoading,
    analysisError,
    isLoading,
    reportLoading,
    newsRefreshing,
    lastNewsRefreshForced,
    error,
    reportError,
    retryReport,
    retryAnalysis,
    refreshLatestNews,
    setChartPeriod,
  };
}
