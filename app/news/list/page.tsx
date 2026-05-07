'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import Link from 'next/link';
import { ArrowLeft, Loader2, Newspaper, TrendingUp, TrendingDown, Minus, Search, X } from 'lucide-react';
import { fetchNewsList } from '@/lib/api';
import { cn } from '@/lib/utils';
import type { ApiStockNewsItem, SentimentLabel } from '@/types/dashboard';

const PAGE_SIZE = 48;

const SENT_CONFIG: Record<SentimentLabel, { label: string; text: string; bg: string; icon: typeof TrendingUp }> = {
  positive: { label: '호재', text: 'text-emerald-400', bg: 'bg-emerald-500/10 border-emerald-500/20', icon: TrendingUp },
  negative: { label: '악재', text: 'text-red-400', bg: 'bg-red-500/10 border-red-500/20', icon: TrendingDown },
  neutral: { label: '중립', text: 'text-zinc-400', bg: 'bg-zinc-500/10 border-zinc-700/20', icon: Minus },
};

const FILTER_TABS: { key: SentimentLabel | 'all'; label: string }[] = [
  { key: 'all', label: '전체' },
  { key: 'positive', label: '호재' },
  { key: 'negative', label: '악재' },
  { key: 'neutral', label: '중립' },
];

function formatTime(ts: number): string {
  const d = new Date(ts * 1000);
  const diff = Math.floor((Date.now() - d.getTime()) / 1000);
  if (diff < 60) return '방금 전';
  if (diff < 3600) return `${Math.floor(diff / 60)}분 전`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}시간 전`;
  if (diff < 172800) return '어제';
  return d.toLocaleDateString('ko-KR', { month: 'short', day: 'numeric' });
}

function formatFullDate(ts: number): string {
  return new Date(ts * 1000).toLocaleString('ko-KR', {
    month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit', hour12: false,
  });
}

function buildDetailHref(item: ApiStockNewsItem): string {
  const params = new URLSearchParams();
  if (item.url) params.set('url', item.url);
  if (item.title) params.set('title', item.title);
  if (item.publisher) params.set('publisher', item.publisher);
  if (item.ticker) params.set('ticker', item.ticker);
  return `/news?${params.toString()}`;
}

/* ── News card ── */

function NewsCard({ item }: { item: ApiStockNewsItem }) {
  const cfg = SENT_CONFIG[item.sentiment_label] ?? SENT_CONFIG.neutral;
  const SentIcon = cfg.icon;

  return (
    <Link
      href={buildDetailHref(item)}
      className="group flex flex-col bg-zinc-900/40 border border-zinc-800/50 rounded-2xl
                 hover:border-zinc-700/60 hover:bg-zinc-800/40 hover:-translate-y-0.5
                 transition-all duration-200 overflow-hidden"
    >
      <div className="flex-1 p-4 pb-3">
        <h3 className="text-[14px] text-zinc-200 leading-snug font-medium line-clamp-2
                        group-hover:text-zinc-100 transition-colors mb-3">
          {item.title}
        </h3>
        <span className={cn('inline-flex items-center gap-1 text-[10px] font-medium px-2 py-0.5 rounded-md border', cfg.bg, cfg.text)}>
          <SentIcon className="w-3 h-3" />
          {cfg.label}
        </span>
      </div>
      <div className="px-4 py-2.5 border-t border-zinc-800/40 flex items-center justify-between">
        <div className="flex items-center gap-1.5 min-w-0">
          <span className="text-[11px] text-zinc-500 truncate">{item.publisher}</span>
          <span className="text-zinc-800 shrink-0">·</span>
          <span className="text-[11px] text-zinc-600 shrink-0" title={formatFullDate(item.timestamp)}>
            {formatTime(item.timestamp)}
          </span>
        </div>
        {item.ticker && (
          <span className="text-[10px] font-mono text-zinc-500 bg-zinc-800/60 border border-zinc-700/30 px-1.5 py-0.5 rounded shrink-0 ml-2">
            {item.ticker}
          </span>
        )}
      </div>
    </Link>
  );
}

/* ── Main ── */

export default function NewsListPage() {
  const [items, setItems] = useState<ApiStockNewsItem[]>([]);
  const [total, setTotal] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const offsetRef = useRef(0);
  const hasMoreRef = useRef(true);
  const mountedRef = useRef(true);

  // Search & filter
  const [query, setQuery] = useState('');
  const [tickerSearch, setTickerSearch] = useState('');
  const [sentimentFilter, setSentimentFilter] = useState<SentimentLabel | 'all'>('all');
  const searchTimerRef = useRef<ReturnType<typeof setTimeout>>(undefined);

  const loadPage = useCallback(async (offset: number, isFirst: boolean, ticker?: string) => {
    if (isFirst) setIsLoading(true);
    else setIsLoadingMore(true);
    setError(null);

    try {
      const res = await fetchNewsList({
        limit: PAGE_SIZE,
        offset,
        with_count: isFirst,
        ticker: ticker || undefined,
      });
      if (!mountedRef.current) return;
      if (isFirst && res.total != null) setTotal(res.total);
      setItems((prev) => isFirst ? res.items : [...prev, ...res.items]);
      offsetRef.current = offset + res.count;
      hasMoreRef.current = res.count >= PAGE_SIZE;
    } catch (err: unknown) {
      if (mountedRef.current) setError(err instanceof Error ? err.message : '뉴스를 불러올 수 없습니다');
    } finally {
      if (mountedRef.current) { setIsLoading(false); setIsLoadingMore(false); }
    }
  }, []);

  // Initial load
  useEffect(() => {
    mountedRef.current = true;
    loadPage(0, true);
    return () => { mountedRef.current = false; };
  }, [loadPage]);

  // Ticker search with debounce
  const handleTickerSearch = useCallback((value: string) => {
    setTickerSearch(value);
    clearTimeout(searchTimerRef.current);
    searchTimerRef.current = setTimeout(() => {
      const ticker = value.trim().toUpperCase();
      loadPage(0, true, ticker);
    }, 400);
  }, [loadPage]);

  const clearSearch = useCallback(() => {
    setTickerSearch('');
    setQuery('');
    setSentimentFilter('all');
    loadPage(0, true);
  }, [loadPage]);

  const handleLoadMore = () => {
    if (isLoadingMore || !hasMoreRef.current) return;
    loadPage(offsetRef.current, false, tickerSearch.trim().toUpperCase() || undefined);
  };

  // Client-side filters (text query + sentiment)
  const filtered = items.filter((item) => {
    if (sentimentFilter !== 'all' && item.sentiment_label !== sentimentFilter) return false;
    if (query) {
      const q = query.toLowerCase();
      return (
        item.title?.toLowerCase().includes(q) ||
        item.publisher?.toLowerCase().includes(q) ||
        item.ticker?.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const hasActiveFilter = query || tickerSearch || sentimentFilter !== 'all';

  return (
    <div className="min-h-screen bg-[#09090b]">
      {/* Header */}
      <header className="sticky top-0 z-10 bg-[#09090b]/80 backdrop-blur-xl border-b border-zinc-800/50">
        <div className="max-w-[1400px] mx-auto px-6">
          {/* Top row */}
          <div className="h-14 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link href="/" className="flex items-center gap-1.5 text-zinc-500 hover:text-zinc-300 transition-colors">
                <ArrowLeft className="w-4 h-4" />
                <span className="text-xs font-medium hidden sm:block">Terminal</span>
              </Link>
              <div className="h-4 w-px bg-zinc-800" />
              <div className="flex items-center gap-2">
                <Newspaper className="w-4 h-4 text-zinc-500" />
                <span className="text-sm font-semibold text-zinc-200">뉴스 피드</span>
              </div>
            </div>
            {total != null && (
              <span className="text-xs font-mono text-zinc-600">{total.toLocaleString()}건</span>
            )}
          </div>

          {/* Search + filter row */}
          <div className="pb-3 flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
            {/* Search inputs */}
            <div className="flex items-center gap-2 flex-1">
              {/* Text search */}
              <div className="relative flex-1 max-w-[320px]">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-zinc-600" />
                <input
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="뉴스 검색..."
                  className="w-full text-[13px] bg-zinc-900/60 border border-zinc-800/50 rounded-lg pl-9 pr-3 py-2
                             text-zinc-200 placeholder:text-zinc-600
                             focus:outline-none focus:border-zinc-700 transition-colors"
                />
              </div>
              {/* Ticker search */}
              <div className="relative w-[140px]">
                <input
                  type="text"
                  value={tickerSearch}
                  onChange={(e) => handleTickerSearch(e.target.value)}
                  placeholder="티커 (AAPL)"
                  className="w-full text-[13px] font-mono bg-zinc-900/60 border border-zinc-800/50 rounded-lg px-3 py-2
                             text-zinc-200 placeholder:text-zinc-600 uppercase
                             focus:outline-none focus:border-zinc-700 transition-colors"
                />
              </div>
              {hasActiveFilter && (
                <button
                  onClick={clearSearch}
                  className="p-2 text-zinc-600 hover:text-zinc-400 transition-colors shrink-0"
                  title="필터 초기화"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            {/* Sentiment tabs */}
            <div className="flex items-center gap-1">
              {FILTER_TABS.map((tab) => (
                <button
                  key={tab.key}
                  onClick={() => setSentimentFilter(tab.key)}
                  className={cn(
                    'px-2.5 py-1.5 rounded-lg text-[11px] font-medium transition-all',
                    sentimentFilter === tab.key
                      ? 'bg-zinc-800 text-zinc-200'
                      : 'text-zinc-600 hover:text-zinc-400 hover:bg-zinc-800/50',
                  )}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="max-w-[1400px] mx-auto px-6 py-6">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-24 gap-3">
            <Loader2 className="w-5 h-5 text-zinc-500 animate-spin" />
            <span className="text-xs text-zinc-600">뉴스를 불러오는 중...</span>
          </div>
        ) : error && items.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 gap-4">
            <p className="text-sm text-red-400">{error}</p>
            <button
              onClick={() => loadPage(0, true)}
              className="text-xs text-zinc-400 hover:text-zinc-200 border border-zinc-700 rounded-xl px-5 py-2.5 transition-colors"
            >
              다시 시도
            </button>
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24">
            <Search className="w-8 h-8 text-zinc-700 mb-3" />
            <p className="text-sm text-zinc-600">
              {hasActiveFilter ? '검색 결과가 없습니다' : '뉴스가 없습니다'}
            </p>
            {hasActiveFilter && (
              <button onClick={clearSearch} className="text-xs text-zinc-500 hover:text-zinc-300 mt-3 transition-colors">
                필터 초기화
              </button>
            )}
          </div>
        ) : (
          <>
            {/* Result count when filtered */}
            {hasActiveFilter && (
              <div className="mb-4 text-xs text-zinc-600">
                {filtered.length}건{query && ` · "${query}"`}{tickerSearch && ` · ${tickerSearch.toUpperCase()}`}
              </div>
            )}

            {/* Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {filtered.map((item, i) => (
                <NewsCard key={`${item.url}-${i}`} item={item} />
              ))}
            </div>

            {/* Load more */}
            {hasMoreRef.current && sentimentFilter === 'all' && !query && (
              <div className="flex justify-center pt-10">
                <button
                  onClick={handleLoadMore}
                  disabled={isLoadingMore}
                  className="flex items-center gap-2 text-sm text-zinc-400 hover:text-zinc-200
                             bg-zinc-900/40 border border-zinc-800/50 hover:border-zinc-700/60
                             rounded-xl px-8 py-3 transition-all duration-200 disabled:opacity-50"
                >
                  {isLoadingMore ? (
                    <><Loader2 className="w-4 h-4 animate-spin" /> 불러오는 중...</>
                  ) : (
                    '더 불러오기'
                  )}
                </button>
              </div>
            )}

            {!hasMoreRef.current && !hasActiveFilter && (
              <div className="text-center pt-10 pb-4">
                <span className="text-xs text-zinc-700">모든 뉴스를 불러왔습니다</span>
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
}
