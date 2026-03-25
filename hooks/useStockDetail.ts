'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  fetchStockDetail,
  requestReport,
  apiHistoryToChart,
  deriveConfidence,
  apiStockNewsToRelatedNews,
} from '@/lib/api';
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
  error: string | null;
  reportError: string | null;
  retryReport: () => void;
}

export function useStockDetail(ticker: string): UseStockDetailReturn {
  const [detail, setDetail] = useState<StockDetailState | null>(null);
  const [report, setReport] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [reportLoading, setReportLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [reportError, setReportError] = useState<string | null>(null);

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

    fetchStockDetail(ticker, 10)
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

  const retryReport = useCallback(() => {
    if (detail) generateReport(detail.ticker);
  }, [detail, generateReport]);

  return {
    detail,
    report,
    isLoading,
    reportLoading,
    error,
    reportError,
    retryReport,
  };
}
