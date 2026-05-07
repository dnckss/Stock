'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import Link from 'next/link';
import { ArrowLeft, Loader2, ChevronRight } from 'lucide-react';
import { fetchNewsList } from '@/lib/api';
import { cn } from '@/lib/utils';
import type { ApiStockNewsItem, SentimentLabel } from '@/types/dashboard';

const PAGE_SIZE = 50;

const SENT_STYLE: Record<SentimentLabel, { dot: string; label: string; text: string }> = {
  positive: { dot: 'bg-green-500', label: '호재', text: 'text-green-400' },
  negative: { dot: 'bg-red-500', label: '악재', text: 'text-red-400' },
  neutral: { dot: 'bg-yellow-500', label: '중립', text: 'text-yellow-400' },
};

function formatTime(ts: number): string {
  const d = new Date(ts * 1000);
  const now = Date.now();
  const diff = Math.floor((now - d.getTime()) / 1000);
  if (diff < 60) return '방금 전';
  if (diff < 3600) return `${Math.floor(diff / 60)}분 전`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}시간 전`;
  return d.toLocaleDateString('ko-KR', { month: 'short', day: 'numeric' });
}

function buildDetailHref(item: ApiStockNewsItem): string {
  const params = new URLSearchParams();
  if (item.url) params.set('url', item.url);
  if (item.title) params.set('title', item.title);
  if (item.publisher) params.set('publisher', item.publisher);
  if (item.ticker) params.set('ticker', item.ticker);
  return `/news?${params.toString()}`;
}

function NewsRow({ item }: { item: ApiStockNewsItem }) {
  const style = SENT_STYLE[item.sentiment_label] ?? SENT_STYLE.neutral;

  return (
    <Link
      href={buildDetailHref(item)}
      className="flex items-start gap-3 px-4 py-3 border-b border-zinc-800/40 hover:bg-zinc-800/30 transition-colors group"
    >
      <div className={cn('mt-2 w-2 h-2 rounded-full shrink-0', style.dot)} />
      <div className="flex-1 min-w-0">
        <p className="text-sm text-zinc-200 leading-relaxed line-clamp-2 group-hover:text-zinc-100 transition-colors">
          {item.title}
        </p>
        <div className="flex items-center gap-2 mt-1.5">
          <span className="text-[11px] text-zinc-600">{item.publisher}</span>
          <span className="text-[11px] text-zinc-700">{formatTime(item.timestamp)}</span>
          {item.ticker && (
            <span className="text-[10px] font-mono text-zinc-500 bg-zinc-800/60 px-1.5 py-0.5 rounded">
              {item.ticker}
            </span>
          )}
          <span className={cn('text-[10px] font-mono', style.text)}>{style.label}</span>
        </div>
      </div>
      <ChevronRight className="w-4 h-4 text-zinc-700 group-hover:text-zinc-500 shrink-0 mt-1 transition-colors" />
    </Link>
  );
}

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
      const res = await fetchNewsList({
        limit: PAGE_SIZE,
        offset,
        with_count: isFirst,
      });
      if (!mountedRef.current) return;

      if (isFirst && res.total != null) setTotal(res.total);
      setItems((prev) => isFirst ? res.items : [...prev, ...res.items]);
      offsetRef.current = offset + res.count;
      hasMoreRef.current = res.count >= PAGE_SIZE;
    } catch (err: unknown) {
      if (mountedRef.current) {
        setError(err instanceof Error ? err.message : '뉴스를 불러올 수 없습니다');
      }
    } finally {
      if (mountedRef.current) {
        setIsLoading(false);
        setIsLoadingMore(false);
      }
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
    <div className="min-h-screen bg-[#0a0a0a] text-zinc-100">
      {/* Header */}
      <header className="sticky top-0 z-10 bg-[#0a0a0a]/90 backdrop-blur-xl border-b border-zinc-800">
        <div className="max-w-3xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/" className="flex items-center gap-1.5 text-zinc-500 hover:text-zinc-300 transition-colors">
              <ArrowLeft className="w-4 h-4" />
              <span className="text-xs font-medium">Terminal</span>
            </Link>
            <div className="h-4 w-px bg-zinc-800" />
            <span className="text-sm font-semibold text-zinc-200">뉴스 피드</span>
          </div>
          {total != null && (
            <span className="text-xs font-mono text-zinc-600">{total.toLocaleString()}건</span>
          )}
        </div>
      </header>

      {/* Content */}
      <main className="max-w-3xl mx-auto">
        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-5 h-5 text-zinc-500 animate-spin" />
          </div>
        ) : error && items.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20">
            <p className="text-sm text-red-400 mb-3">{error}</p>
            <button
              onClick={() => loadPage(0, true)}
              className="text-xs text-zinc-400 hover:text-zinc-200 border border-zinc-700 rounded-lg px-4 py-2 transition-colors"
            >
              다시 시도
            </button>
          </div>
        ) : items.length === 0 ? (
          <div className="flex items-center justify-center py-20">
            <p className="text-sm text-zinc-600">뉴스가 없습니다</p>
          </div>
        ) : (
          <>
            {items.map((item, i) => (
              <NewsRow key={`${item.url}-${i}`} item={item} />
            ))}

            {/* Load more */}
            {hasMoreRef.current && (
              <div className="flex justify-center py-6">
                <button
                  onClick={handleLoadMore}
                  disabled={isLoadingMore}
                  className="flex items-center gap-2 text-sm text-zinc-400 hover:text-zinc-200
                             border border-zinc-800 hover:border-zinc-700 rounded-xl px-6 py-2.5
                             transition-colors disabled:opacity-50"
                >
                  {isLoadingMore ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    '더 불러오기'
                  )}
                </button>
              </div>
            )}

            {!hasMoreRef.current && items.length > 0 && (
              <div className="text-center py-6">
                <span className="text-xs text-zinc-700 font-mono">모든 뉴스를 불러왔습니다</span>
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
}
