'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { fetchFundamentals, fetchFundamentalsSection, parseFundamentals } from '@/lib/api';
import type { FundamentalsData, FundamentalsSectionKey } from '@/types/dashboard';

export interface UseStockFundamentalsReturn {
  data: FundamentalsData | null;
  isLoading: boolean;
  error: string | null;
  refreshSection: (section: FundamentalsSectionKey) => void;
  sectionRefreshing: FundamentalsSectionKey | null;
}

export function useStockFundamentals(ticker: string | null): UseStockFundamentalsReturn {
  const [data, setData] = useState<FundamentalsData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sectionRefreshing, setSectionRefreshing] = useState<FundamentalsSectionKey | null>(null);
  const mountedRef = useRef(true);

  useEffect(() => {
    if (!ticker) return;
    mountedRef.current = true;
    setIsLoading(true);
    setError(null);
    setData(null);

    fetchFundamentals(ticker)
      .then((raw) => {
        if (!mountedRef.current) return;
        const parsed = parseFundamentals(raw);
        setData(parsed);
        if (!parsed) setError('펀더멘털 데이터를 파싱할 수 없습니다');
      })
      .catch((err: unknown) => {
        if (!mountedRef.current) return;
        setError(
          err instanceof Error ? err.message : '펀더멘털 데이터를 불러올 수 없습니다',
        );
      })
      .finally(() => {
        if (mountedRef.current) setIsLoading(false);
      });

    return () => {
      mountedRef.current = false;
    };
  }, [ticker]);

  const refreshingRef = useRef(false);

  const refreshSection = useCallback(
    (section: FundamentalsSectionKey) => {
      if (!ticker || refreshingRef.current) return;
      refreshingRef.current = true;
      setSectionRefreshing(section);

      fetchFundamentalsSection(ticker, section)
        .then((raw) => {
          if (!mountedRef.current) return;
          const parsed = parseFundamentals(raw);
          if (!parsed) return;
          setData((prev) => {
            if (!prev) return parsed;
            return { ...prev, [section]: parsed[section] };
          });
        })
        .catch(() => {
          // Section refresh 실패는 기존 데이터 유지
        })
        .finally(() => {
          refreshingRef.current = false;
          if (mountedRef.current) setSectionRefreshing(null);
        });
    },
    [ticker],
  );

  return { data, isLoading, error, refreshSection, sectionRefreshing };
}
