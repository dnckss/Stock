'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import Link from 'next/link';
import { ArrowLeft, Loader2, Newspaper, TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { fetchNewsList } from '@/lib/api';
import { cn } from '@/lib/utils';
import type { ApiStockNewsItem, SentimentLabel } from '@/types/dashboard';

const PAGE_SIZE = 48; // 4열에 맞게 4의 배수

const SENT_CONFIG: Record<SentimentLabel, { dot: string; label: string; text: string; bg: string; icon: typeof TrendingUp }> = {
  positive: { dot: 'bg-emerald-500', label: '호재', text: 'text-emerald-400', bg: 'bg-emerald-500/10 border-emerald-500/20', icon: TrendingUp },
  negative: { dot: 'bg-red-500', label: '악재', text: 'text-red-400', bg: 'bg-red-500/10 border-red-500/20', icon: TrendingDown },
  neutral: { dot: 'bg-zinc-500', label: '중립', text: 'text-zinc-400', bg: 'bg-zinc-500/10 border-zinc-700/20', icon: Minus },
};

function formatTime(ts: number): string {
  const d = new Date(ts * 1000);
  const now = Date.now();
  const diff = Math.floor((now - d.getTime()) / 1000);
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

/* ── News card (velog style) ── */

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
      {/* Content */}
      <div className="flex-1 p-4 pb-3">
        <h3 className="text-[14px] text-zinc-200 leading-snug font-medium line-clamp-2
                        group-hover:text-zinc-100 transition-colors mb-3">
          {item.title}
        </h3>
        {/* Sentiment badge */}
        <span className={cn('inline-flex items-center gap-1 text-[10px] font-medium px-2 py-0.5 rounded-md border', cfg.bg, cfg.text)}>
          <SentIcon className="w-3 h-3" />
          {cfg.label}
        </span>
      </div>

      {/* Footer */}
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

  const loadPage = useCallback(async (offset: number, isFirst: boolean) => {
    if (isFirst) setIsLoading(true);
    else setIsLoadingMore(true);
    setError(null);

    try {
      const res = await fetchNewsList({ limit: PAGE_SIZE, offset, with_count: isFirst });
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

  useEffect(() => {
    mountedRef.current = true;
    loadPage(0, true);
    return () => { mountedRef.current = false; };
  }, [loadPage]);

  const handleLoadMore = () => {
    if (isLoadingMore || !hasMoreRef.current) return;
    loadPage(offsetRef.current, false);
  };

  return (
    <div className="min-h-screen bg-[#09090b]">
      {/* Header */}
      <header className="sticky top-0 z-10 bg-[#09090b]/80 backdrop-blur-xl border-b border-zinc-800/50">
        <div className="max-w-[1400px] mx-auto px-6 h-14 flex items-center justify-between">
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
      </header>

      {/* Content */}
      <main className="max-w-[1400px] mx-auto px-6 py-8">
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
        ) : items.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24">
            <Newspaper className="w-8 h-8 text-zinc-700 mb-3" />
            <p className="text-sm text-zinc-600">뉴스가 없습니다</p>
          </div>
        ) : (
          <>
            {/* 4-column grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {items.map((item, i) => (
                <NewsCard key={`${item.url}-${i}`} item={item} />
              ))}
            </div>

            {/* Load more */}
            {hasMoreRef.current && (
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

            {!hasMoreRef.current && (
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
