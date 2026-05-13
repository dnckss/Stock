'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import {
  fetchLatest,
  apiStockToRadar,
  apiMacroToDisplay,
  WS_URL,
  fetchEconomicCalendar,
  apiEconomicCalendarToDisplay,
} from '@/lib/api';
import type {
  RadarStock,
  ApiStockItem,
  ApiMacroData,
  MacroDisplayData,
  ApiNewsFeedItem,
  NewsFeedItem,
  ApiEconomicCalendarResponse,
  EconomicCalendarItem,
} from '@/types/dashboard';
import {
  ECON_CALENDAR_DEFAULT_SOURCE,
  ECON_CALENDAR_AUTO_REFRESH_MIN_MS,
  ECON_CALENDAR_AUTO_REFRESH_MAX_MS,
  TICKER_ALIASES,
  LATEST_RADAR_LIMIT,
} from '@/lib/constants';

const WS_RECONNECT_DELAY = 3000;
const MAX_NEWS_ITEMS = 30;

export interface MarketDataState {
  stocks: RadarStock[];
  macro: MacroDisplayData | null;
  newsFeed: NewsFeedItem[];
  economicCalendar: EconomicCalendarItem[];
  economicCalendarMeta: {
    source: string;
    fetchedAt: string | null;
    cacheHit: boolean;
    cacheTtlSec: number;
    error: ApiEconomicCalendarResponse['error'];
  };
  isEconomicLoading: boolean;
  isEconomicRefreshing: boolean;
  updatedAt: string | null;
  isLoading: boolean;
  error: string | null;
  wsConnected: boolean;
  refreshEconomicCalendar: () => Promise<void>;
}

export function useMarketData(): MarketDataState {
  const [stocks, setStocks] = useState<RadarStock[]>([]);
  const [macro, setMacro] = useState<MacroDisplayData | null>(null);
  const [newsFeed, setNewsFeed] = useState<NewsFeedItem[]>([]);
  const [economicCalendar, setEconomicCalendar] = useState<EconomicCalendarItem[]>([]);
  const [economicCalendarMeta, setEconomicCalendarMeta] = useState<MarketDataState['economicCalendarMeta']>({
    source: ECON_CALENDAR_DEFAULT_SOURCE,
    fetchedAt: null,
    cacheHit: false,
    cacheTtlSec: 0,
    error: null,
  });
  const [isEconomicLoading, setIsEconomicLoading] = useState(true);
  const [isEconomicRefreshing, setIsEconomicRefreshing] = useState(false);
  const [updatedAt, setUpdatedAt] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [wsConnected, setWsConnected] = useState(false);
  const mountedRef = useRef(true);
  const calendarRefreshTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const normalizeNews = useCallback((items: ApiNewsFeedItem[] | undefined): NewsFeedItem[] => {
    if (!items || !Array.isArray(items)) return [];
    return items.map((n) => ({
      id: `${n.ticker}-${n.timestamp}-${n.title}`.toLowerCase(),
      title: n.title,
      publisher: n.publisher,
      ticker: n.ticker,
      score: n.score,
      sentimentLabel: n.sentiment_label ?? 'neutral',
      confidence: n.confidence ?? 0,
      url: n.url ?? '',
      timestamp: n.timestamp,
    }));
  }, []);

  const handleUpdate = useCallback(
    (
      topPicks: ApiStockItem[],
      radar: ApiStockItem[],
      timestamp: string | null,
      macroPayload?: ApiMacroData,
      newsFeedPayload?: ApiNewsFeedItem[],
      /** 'full': 응답을 정답으로 교체 / 'merge': 기존 stocks에 in-place 덮어쓰기 */
      mode: 'full' | 'merge' = 'full',
    ) => {
      const incoming = [
        ...topPicks.map((s) => apiStockToRadar(s, true)),
        ...radar.map((s) => apiStockToRadar(s, false)),
      ];
      // 동일 기업 중복 제거 (GOOG/GOOGL 등 — canonical 티커 우선)
      const seen = new Set<string>();
      const incomingMerged = incoming.filter((s) => {
        const canonical = TICKER_ALIASES[s.ticker] ?? s.ticker;
        if (seen.has(canonical)) return false;
        seen.add(canonical);
        return true;
      });

      if (mode === 'merge') {
        // WS 업데이트: 들어온 ticker만 갱신, 나머지는 기존 값 유지
        setStocks((prev) => {
          if (prev.length === 0) return incomingMerged;
          const byTicker = new Map(prev.map((s) => [s.ticker, s]));
          for (const s of incomingMerged) {
            byTicker.set(s.ticker, s);
          }
          return Array.from(byTicker.values());
        });
      } else {
        setStocks(incomingMerged);
      }

      setUpdatedAt(timestamp);
      setError(null);

      if (macroPayload != null) {
        const next = apiMacroToDisplay(macroPayload);
        if (next !== null) setMacro(next);
      }

      if (newsFeedPayload) {
        const normalized = normalizeNews(newsFeedPayload);
        setNewsFeed((prev) => {
          const seen = new Set<string>();
          const mergedNews = [...normalized, ...prev].filter((x) => {
            if (seen.has(x.id)) return false;
            seen.add(x.id);
            return true;
          });
          mergedNews.sort((a, b) => b.timestamp - a.timestamp);
          return mergedNews.slice(0, MAX_NEWS_ITEMS);
        });
      }
    },
    [normalizeNews],
  );

  const loadEconomicCalendar = useCallback(async (refresh: 0 | 1) => {
    if (refresh === 1) setIsEconomicRefreshing(true);
    else setIsEconomicLoading(true);

    try {
      const payload = await fetchEconomicCalendar({
        refresh,
      });
      if (!mountedRef.current) return;

      setEconomicCalendar(apiEconomicCalendarToDisplay(payload));
      setEconomicCalendarMeta({
        source: payload.source,
        fetchedAt: payload.fetched_at,
        cacheHit: payload.cache_hit,
        cacheTtlSec: payload.cache_ttl_sec,
        error: payload.error,
      });
    } catch (err: unknown) {
      if (!mountedRef.current) return;
      setEconomicCalendar([]);
      setEconomicCalendarMeta({
        source: ECON_CALENDAR_DEFAULT_SOURCE,
        fetchedAt: null,
        cacheHit: false,
        cacheTtlSec: 0,
        error: {
          code: 'network_error',
          message:
            err instanceof Error ? err.message : '경제 일정을 불러올 수 없습니다',
        },
      });
    } finally {
      if (!mountedRef.current) return;
      setIsEconomicLoading(false);
      setIsEconomicRefreshing(false);
    }
  }, []);

  useEffect(() => {
    if (calendarRefreshTimerRef.current) {
      clearTimeout(calendarRefreshTimerRef.current);
      calendarRefreshTimerRef.current = null;
    }
    if (!mountedRef.current) return;

    const ttlSec = Number(economicCalendarMeta.cacheTtlSec);
    const baseMs = Number.isFinite(ttlSec) && ttlSec > 0
      ? ttlSec * 1000
      : ECON_CALENDAR_AUTO_REFRESH_MIN_MS;
    const nextMs = Math.min(
      ECON_CALENDAR_AUTO_REFRESH_MAX_MS,
      Math.max(ECON_CALENDAR_AUTO_REFRESH_MIN_MS, baseMs),
    );

    calendarRefreshTimerRef.current = setTimeout(() => {
      if (!mountedRef.current) return;
      void loadEconomicCalendar(0);
    }, nextMs);

    return () => {
      if (calendarRefreshTimerRef.current) {
        clearTimeout(calendarRefreshTimerRef.current);
        calendarRefreshTimerRef.current = null;
      }
    };
  }, [economicCalendarMeta.cacheTtlSec, loadEconomicCalendar]);

  useEffect(() => {
    let cancelled = false;

    fetchLatest({ radarLimit: LATEST_RADAR_LIMIT })
      .then((data) => {
        if (!cancelled) {
          handleUpdate(
            data.top_picks,
            data.radar,
            data.updated_at,
            data.macro,
            data.news_feed,
            'full',
          );
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
  }, [handleUpdate]);

  useEffect(() => {
    mountedRef.current = true;
    void loadEconomicCalendar(0);
  }, [loadEconomicCalendar]);

  useEffect(() => {
    mountedRef.current = true;
    let ws: WebSocket | null = null;
    let reconnectTimer: ReturnType<typeof setTimeout>;

    function connect() {
      try {
        ws = new WebSocket(WS_URL);
      } catch {
        if (mountedRef.current) {
          reconnectTimer = setTimeout(connect, WS_RECONNECT_DELAY);
        }
        return;
      }

      ws.onopen = () => {
        if (mountedRef.current) setWsConnected(true);
      };

      ws.onmessage = (event: MessageEvent) => {
        if (!mountedRef.current) return;
        try {
          const msg = JSON.parse(event.data);
          if (msg.type === 'MARKET_UPDATE') {
            handleUpdate(
              msg.top_picks,
              msg.radar,
              msg.updated_at,
              msg.macro,
              msg.news_feed,
              'merge',
            );
            setIsLoading(false);
          }
        } catch {
          /* ignore malformed messages */
        }
      };

      ws.onclose = () => {
        if (!mountedRef.current) return;
        setWsConnected(false);
        reconnectTimer = setTimeout(connect, WS_RECONNECT_DELAY);
      };

      ws.onerror = () => {
        ws?.close();
      };
    }

    connect();

    return () => {
      mountedRef.current = false;
      if (calendarRefreshTimerRef.current) {
        clearTimeout(calendarRefreshTimerRef.current);
        calendarRefreshTimerRef.current = null;
      }
      clearTimeout(reconnectTimer);
      ws?.close();
    };
  }, [handleUpdate]);

  const refreshEconomicCalendar = useCallback(async () => {
    await loadEconomicCalendar(1);
  }, [loadEconomicCalendar]);

  return {
    stocks,
    macro,
    newsFeed,
    economicCalendar,
    economicCalendarMeta,
    isEconomicLoading,
    isEconomicRefreshing,
    updatedAt,
    isLoading,
    error,
    wsConnected,
    refreshEconomicCalendar,
  };
}
