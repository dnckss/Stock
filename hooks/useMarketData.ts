'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { fetchLatest, apiStockToRadar, apiMacroToDisplay, WS_URL } from '@/lib/api';
import type { RadarStock, ApiStockItem, ApiMacroData, MacroDisplayData, ApiNewsFeedItem, NewsFeedItem } from '@/types/dashboard';

const WS_RECONNECT_DELAY = 3000;
const MAX_NEWS_ITEMS = 30;

export interface MarketDataState {
  stocks: RadarStock[];
  macro: MacroDisplayData | null;
  newsFeed: NewsFeedItem[];
  updatedAt: string | null;
  isLoading: boolean;
  error: string | null;
  wsConnected: boolean;
}

export function useMarketData(): MarketDataState {
  const [stocks, setStocks] = useState<RadarStock[]>([]);
  const [macro, setMacro] = useState<MacroDisplayData | null>(null);
  const [newsFeed, setNewsFeed] = useState<NewsFeedItem[]>([]);
  const [updatedAt, setUpdatedAt] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [wsConnected, setWsConnected] = useState(false);
  const mountedRef = useRef(true);

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
    ) => {
      const merged = [
        ...topPicks.map((s) => apiStockToRadar(s, true)),
        ...radar.map((s) => apiStockToRadar(s, false)),
      ];
      setStocks(merged);
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

  useEffect(() => {
    let cancelled = false;

    fetchLatest()
      .then((data) => {
        if (!cancelled) {
          handleUpdate(
            data.top_picks,
            data.radar,
            data.updated_at,
            data.macro,
            data.news_feed,
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
      clearTimeout(reconnectTimer);
      ws?.close();
    };
  }, [handleUpdate]);

  return { stocks, macro, newsFeed, updatedAt, isLoading, error, wsConnected };
}
