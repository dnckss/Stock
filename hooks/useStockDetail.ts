'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import {
  fetchStockDetail,
  fetchStockChart,
  fetchStockQuote,
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
  isLoading: boolean;
  reportLoading: boolean;
  newsRefreshing: boolean;
  lastNewsRefreshForced: boolean;
  error: string | null;
  reportError: string | null;
  retryReport: () => void;
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
    setLastNewsRefreshForced(false);
    setQuote(null);
    setChartBars([]);
    setChartPeriodState(CHART_DEFAULT_PERIOD as ChartPeriod);

    fetchStockDetail(ticker, { newsLimit: STOCK_NEWS_DEFAULT_LIMIT, newsRefresh: 0 })
      .then((data) => {
        if (cancelled) return;
        const latest = data.history[0];
        const signal = (latest?.signal ?? 'HOLD') as SignalType;
        const priceReturn = latest?.price_return ?? 0;
        const sentiment = latest?.sentiment ?? 0;
        const divergence = latest?.divergence ?? 0;

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
          history: apiHistoryToChart(data.history),
          relatedNews: apiStockNewsToRelatedNews(data.stock_news),
        });
        setLastNewsRefreshForced(Boolean(data.stock_news_meta?.refresh));
        if (data.stock_news_meta?.refresh) lastForcedAtRef.current = Date.now();

        // quote & chart from initial response
        if (data.quote) setQuote(parseQuote(data.quote));
        if (data.chart) setChartBars(parseChartBars(data.chart.bars));

        if (data.latest_report) {
          setReport(data.latest_report.report);
        } else {
          generateReport(data.ticker);
        }
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
  }, [ticker, generateReport]);

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
          return { ...prev, relatedNews: apiStockNewsToRelatedNews(data.stock_news) };
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

  return {
    detail,
    report,
    quote,
    chartBars,
    chartPeriod,
    chartLoading,
    isLoading,
    reportLoading,
    newsRefreshing,
    lastNewsRefreshForced,
    error,
    reportError,
    retryReport,
    refreshLatestNews,
    setChartPeriod,
  };
}
