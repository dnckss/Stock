'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import {
  fetchStockDetail,
  requestReport,
  apiHistoryToChart,
  deriveConfidence,
  apiStockNewsToRelatedNews,
} from '@/lib/api';
import {
  STOCK_NEWS_DEFAULT_LIMIT,
  STOCK_NEWS_FORCE_REFRESH_INTERVAL_MS,
  STOCK_NEWS_POLL_INTERVAL_MS,
} from '@/lib/constants';
import type { SignalType, ChartDataPoint, RelatedNewsItem } from '@/types/dashboard';

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
  isLoading: boolean;
  reportLoading: boolean;
  newsRefreshing: boolean;
  /** 최근 뉴스 갱신이 강제 refresh(news_refresh=1)였는지 */
  lastNewsRefreshForced: boolean;
  error: string | null;
  reportError: string | null;
  retryReport: () => void;
  refreshLatestNews: () => void;
}

export function useStockDetail(ticker: string): UseStockDetailReturn {
  const [detail, setDetail] = useState<StockDetailState | null>(null);
  const [report, setReport] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [reportLoading, setReportLoading] = useState(false);
  const [newsRefreshing, setNewsRefreshing] = useState(false);
  const [lastNewsRefreshForced, setLastNewsRefreshForced] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [reportError, setReportError] = useState<string | null>(null);
  const inFlightNewsRef = useRef(false);
  const lastForcedAtRef = useRef(0);
  const pendingForceRef = useRef(false);

  const generateReport = useCallback(async (t: string) => {
    setReportLoading(true);
    setReportError(null);
    try {
      const data = await requestReport(t);
      setReport(data.report);
    } catch (err: unknown) {
      setReportError(
        err instanceof Error
          ? err.message
          : 'AI 리포트 생성에 실패했습니다',
      );
    } finally {
      setReportLoading(false);
    }
  }, []);

  useEffect(() => {
    let cancelled = false;
    setIsLoading(true);
    setError(null);
    setReport(null);
    setReportError(null);
    setLastNewsRefreshForced(false);

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

        if (data.latest_report) {
          setReport(data.latest_report.report);
        } else {
          generateReport(data.ticker);
        }
      })
      .catch((err: unknown) => {
        if (!cancelled) {
          setError(
            err instanceof Error
              ? err.message
              : '데이터를 불러올 수 없습니다',
          );
        }
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [ticker, generateReport]);

  const refreshLatestNews = useCallback(() => {
    pendingForceRef.current = true;
  }, []);

  useEffect(() => {
    if (!ticker) return;
    let cancelled = false;

    async function refreshNews(force: boolean) {
      if (cancelled) return;
      if (inFlightNewsRef.current) return;
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
          return {
            ...prev,
            relatedNews: apiStockNewsToRelatedNews(data.stock_news),
          };
        });

        const forced = Boolean(data.stock_news_meta?.refresh);
        setLastNewsRefreshForced(forced);
        if (forced) lastForcedAtRef.current = Date.now();
      } catch {
        // 폴링/수동 갱신 실패는 UI를 깨지 않도록 무시하고 다음 주기에 재시도
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

    // 최초 진입 후 바로 한 번(가벼운) 갱신 트리거
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
    isLoading,
    reportLoading,
    newsRefreshing,
    lastNewsRefreshForced,
    error,
    reportError,
    retryReport,
    refreshLatestNews,
  };
}
