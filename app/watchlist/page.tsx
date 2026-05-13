'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import Link from 'next/link';
import { Star, Trash2, Loader2, RefreshCw } from 'lucide-react';
import PageHeader from '@/components/common/PageHeader';
import { useWatchlist } from '@/hooks/useWatchlist';
import { fetchStockQuote, parseQuote, getTickerName } from '@/lib/api';
import { WATCHLIST_POLL_INTERVAL_MS } from '@/lib/constants';
import { cn } from '@/lib/utils';
import type { StockQuote } from '@/types/dashboard';

async function fetchOne(ticker: string): Promise<StockQuote | null> {
  try {
    const raw = await fetchStockQuote(ticker);
    return parseQuote(raw);
  } catch {
    return null;
  }
}

export default function WatchlistPage() {
  const { tickers, remove } = useWatchlist();
  const [quotes, setQuotes] = useState<Map<string, StockQuote>>(new Map());
  const [loading, setLoading] = useState(false);
  const mountedRef = useRef(true);

  const loadQuotes = useCallback(async () => {
    if (tickers.length === 0) {
      setQuotes(new Map());
      return;
    }
    setLoading(true);
    const results = await Promise.allSettled(
      tickers.map(async (t) => ({ ticker: t, quote: await fetchOne(t) })),
    );
    if (!mountedRef.current) return;
    const map = new Map<string, StockQuote>();
    for (const r of results) {
      if (r.status === 'fulfilled' && r.value.quote) {
        map.set(r.value.ticker, r.value.quote);
      }
    }
    setQuotes(map);
    setLoading(false);
  }, [tickers]);

  // 초기 로드 + tickers 변경 시 로드
  useEffect(() => {
    mountedRef.current = true;
    // 비동기 호출 — setState는 fetch 완료 후에만 발생하므로 cascade 위험 없음
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void loadQuotes();
    return () => {
      mountedRef.current = false;
    };
  }, [loadQuotes]);

  // 주기 폴링
  useEffect(() => {
    if (tickers.length === 0) return;
    const id = setInterval(() => void loadQuotes(), WATCHLIST_POLL_INTERVAL_MS);
    return () => clearInterval(id);
  }, [tickers.length, loadQuotes]);

  return (
    <div className="min-h-screen bg-[#09090b]">
      <PageHeader title="Watchlist">
        <button
          type="button"
          onClick={() => void loadQuotes()}
          disabled={loading || tickers.length === 0}
          className="text-zinc-500 hover:text-zinc-300 disabled:opacity-40 transition-colors"
          title="새로고침"
          aria-label="새로고침"
        >
          <RefreshCw className={cn('w-4 h-4', loading && 'animate-spin')} />
        </button>
      </PageHeader>

      <main className="max-w-3xl mx-auto px-6 py-8">
        {tickers.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24">
            <Star className="w-8 h-8 text-zinc-700 mb-3" />
            <p className="text-sm text-zinc-500 mb-1">관심 종목이 없습니다</p>
            <p className="text-xs text-zinc-600">종목 상세 페이지에서 별 아이콘을 눌러 추가하세요</p>
          </div>
        ) : (
          <div className="space-y-2">
            {tickers.map((ticker) => {
              const q = quotes.get(ticker);
              const positive = (q?.changePct ?? 0) >= 0;
              return (
                <Link
                  key={ticker}
                  href={`/stock/${ticker}`}
                  className="flex items-center gap-4 px-4 py-3 bg-zinc-900/40 border border-zinc-800/50 rounded-xl
                             hover:border-zinc-700/60 hover:bg-zinc-800/40 transition-all group"
                >
                  <Star className="w-4 h-4 fill-yellow-400 text-yellow-400 shrink-0" />
                  <div className="flex-1 min-w-0">
                    <span className="text-sm font-mono font-bold text-zinc-100">{ticker}</span>
                    <span className="text-xs text-zinc-500 ml-2">{getTickerName(ticker)}</span>
                  </div>
                  {q ? (
                    <div className="text-right shrink-0">
                      <div className="text-sm font-mono font-bold text-zinc-100 tabular-nums">
                        ${q.price.toFixed(2)}
                      </div>
                      <div
                        className={cn(
                          'text-xs font-mono tabular-nums',
                          positive ? 'text-emerald-400' : 'text-red-400',
                        )}
                      >
                        {positive ? '+' : ''}
                        {q.changePct.toFixed(2)}%
                      </div>
                    </div>
                  ) : loading ? (
                    <Loader2 className="w-3.5 h-3.5 text-zinc-600 animate-spin shrink-0" />
                  ) : (
                    <span className="text-xs text-zinc-600 shrink-0">시세 없음</span>
                  )}
                  <button
                    type="button"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      remove(ticker);
                    }}
                    className="p-1.5 text-zinc-700 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-all shrink-0"
                    title="관심 종목 해제"
                    aria-label="관심 종목 해제"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </Link>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}
