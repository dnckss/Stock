'use client';

import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import Link from 'next/link';
import { Loader2, TrendingUp, TrendingDown, Minus, Search, X, Flame } from 'lucide-react';
import PageHeader from '@/components/common/PageHeader';
import { fetchNewsList } from '@/lib/api';
import { cn } from '@/lib/utils';
import {
  NEWS_LIST_PAGE_SIZE,
  NEWS_IMPACT_TOP_COUNT,
  NEWS_IMPACT_MIN_FOR_TOP,
  NEWS_IMPACT_BAR_SEGMENTS,
} from '@/lib/constants';
import {
  scoreByImpact,
  groupNewsByDay,
  impactBarLevel,
  formatRelativeTime,
  formatFullDate,
  formatSignedScore,
  type ScoredNewsItem,
} from '@/lib/news';
import type { ApiStockNewsItem, SentimentLabel } from '@/types/dashboard';

type SentConfig = {
  label: string;
  text: string;
  badge: string;
  accent: string; // 좌측 액센트/바 채움 색
  icon: typeof TrendingUp;
};

const SENT_CONFIG: Record<SentimentLabel, SentConfig> = {
  positive: { label: '호재', text: 'text-emerald-400', badge: 'bg-emerald-500/10 border-emerald-500/20', accent: 'bg-emerald-500', icon: TrendingUp },
  negative: { label: '악재', text: 'text-red-400', badge: 'bg-red-500/10 border-red-500/20', accent: 'bg-red-500', icon: TrendingDown },
  neutral: { label: '중립', text: 'text-zinc-400', badge: 'bg-zinc-500/10 border-zinc-700/30', accent: 'bg-zinc-600', icon: Minus },
};

const FILTER_TABS: { key: SentimentLabel | 'all'; label: string }[] = [
  { key: 'all', label: '전체' },
  { key: 'positive', label: '호재' },
  { key: 'negative', label: '악재' },
  { key: 'neutral', label: '중립' },
];

function sentConfig(label: SentimentLabel): SentConfig {
  return SENT_CONFIG[label] ?? SENT_CONFIG.neutral;
}

function buildDetailHref(item: ApiStockNewsItem): string {
  const params = new URLSearchParams();
  if (item.url) params.set('url', item.url);
  if (item.title) params.set('title', item.title);
  if (item.publisher) params.set('publisher', item.publisher);
  if (item.ticker) params.set('ticker', item.ticker);
  return `/news?${params.toString()}`;
}

/* ── Shared bits ── */

function SentBadge({ label, size = 'sm' }: { label: SentimentLabel; size?: 'sm' | 'md' }) {
  const cfg = sentConfig(label);
  const Icon = cfg.icon;
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 font-medium rounded-md border shrink-0',
        cfg.badge, cfg.text,
        size === 'md' ? 'text-[11px] px-2 py-0.5' : 'text-[10px] px-1.5 py-0.5',
      )}
    >
      <Icon className="w-3 h-3" />
      {cfg.label}
    </span>
  );
}

function ImpactBar({ impact, accent }: { impact: number; accent: string }) {
  const level = impactBarLevel(impact);
  return (
    <span className="inline-flex items-center gap-0.5" aria-hidden>
      {Array.from({ length: NEWS_IMPACT_BAR_SEGMENTS }).map((_, i) => (
        <span key={i} className={cn('h-2.5 w-1 rounded-sm', i < level ? accent : 'bg-zinc-800')} />
      ))}
    </span>
  );
}

function MetaLine({ item, now }: { item: ApiStockNewsItem; now: number }) {
  return (
    <div className="flex items-center gap-1.5 min-w-0 text-[11px]">
      <span className="text-zinc-500 truncate">{item.publisher}</span>
      <span className="text-zinc-700 shrink-0">·</span>
      <span className="text-zinc-600 shrink-0" title={formatFullDate(item.timestamp)}>
        {formatRelativeTime(item.timestamp, now)}
      </span>
      {item.ticker && (
        <>
          <span className="text-zinc-700 shrink-0">·</span>
          <span className="font-mono text-zinc-500 shrink-0">{item.ticker}</span>
        </>
      )}
    </div>
  );
}

/* ── Impact section ── */

function ImpactLeadCard({ item, rank, now }: { item: ScoredNewsItem; rank: number; now: number }) {
  const cfg = sentConfig(item.sentiment_label);
  return (
    <Link
      href={buildDetailHref(item)}
      className="group relative flex flex-col justify-between rounded-2xl border border-zinc-800/60
                 bg-gradient-to-br from-zinc-900/70 to-zinc-900/30 p-5 min-h-[208px]
                 hover:border-zinc-700/70 hover:from-zinc-800/60 transition-all duration-200"
    >
      <div className="flex items-center justify-between">
        <span className="text-[11px] font-mono font-bold text-amber-400/90">#{rank}</span>
        <SentBadge label={item.sentiment_label} size="md" />
      </div>
      <h3 className="text-[17px] leading-snug font-semibold text-zinc-100 line-clamp-3 my-3
                     group-hover:text-white transition-colors">
        {item.title}
      </h3>
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <ImpactBar impact={item.impact} accent={cfg.accent} />
          <span className="text-[11px] text-zinc-500">
            영향도 <span className={cn('font-mono font-semibold', cfg.text)}>{item.impact.toFixed(2)}</span>
          </span>
        </div>
        <MetaLine item={item} now={now} />
      </div>
    </Link>
  );
}

function ImpactRankRow({ item, rank, now }: { item: ScoredNewsItem; rank: number; now: number }) {
  const cfg = sentConfig(item.sentiment_label);
  return (
    <Link
      href={buildDetailHref(item)}
      className="group flex items-center gap-3 px-4 py-3 hover:bg-zinc-800/30 transition-colors"
    >
      <span className="text-[11px] font-mono font-bold text-zinc-600 w-5 shrink-0">#{rank}</span>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-1.5">
          <SentBadge label={item.sentiment_label} />
          <h4 className="text-[13px] text-zinc-200 leading-snug line-clamp-1 group-hover:text-zinc-50 transition-colors">
            {item.title}
          </h4>
        </div>
        <div className="mt-1 pl-0.5"><MetaLine item={item} now={now} /></div>
      </div>
      <ImpactBar impact={item.impact} accent={cfg.accent} />
    </Link>
  );
}

function ImpactSection({ items, now }: { items: ScoredNewsItem[]; now: number }) {
  if (items.length === 0) return null;
  const [lead, ...rest] = items;
  return (
    <section className="mb-10">
      <div className="flex items-center gap-2 mb-4">
        <Flame className="w-4 h-4 text-amber-400" />
        <h2 className="text-sm font-semibold text-zinc-200">시장 영향도 TOP</h2>
        <span className="text-[11px] text-zinc-600" title="|감성점수| × 신뢰도 × 최신성(시간 감쇠)으로 산출">
          감성강도 × 신뢰도 × 최신성
        </span>
      </div>
      <div className="grid gap-3 lg:grid-cols-2">
        <ImpactLeadCard item={lead} rank={1} now={now} />
        {rest.length > 0 && (
          <div className="rounded-2xl border border-zinc-800/50 divide-y divide-zinc-800/40 overflow-hidden">
            {rest.map((item, i) => (
              <ImpactRankRow key={`top-${item.url}-${i}`} item={item} rank={i + 2} now={now} />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}

/* ── Feed ── */

function FeedRow({ item, now }: { item: ScoredNewsItem; now: number }) {
  const cfg = sentConfig(item.sentiment_label);
  return (
    <Link
      href={buildDetailHref(item)}
      className="group flex items-stretch gap-3 rounded-md pr-2 py-3 hover:bg-zinc-900/40 transition-colors"
    >
      {/* 좌측 감성 액센트 바 */}
      <span className={cn('w-0.5 shrink-0 rounded-full', cfg.accent)} aria-hidden />
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-1.5 mb-1">
          <SentBadge label={item.sentiment_label} />
          {item.ticker && <span className="text-[10px] font-mono text-zinc-500">{item.ticker}</span>}
        </div>
        <h3 className="text-[14px] text-zinc-200 leading-snug line-clamp-2 group-hover:text-zinc-50 transition-colors">
          {item.title}
        </h3>
        <div className="mt-1.5 flex items-center gap-1.5 min-w-0 text-[11px]">
          <span className="text-zinc-500 truncate">{item.publisher}</span>
          <span className="text-zinc-700 shrink-0">·</span>
          <span className="text-zinc-600 shrink-0" title={formatFullDate(item.timestamp)}>
            {formatRelativeTime(item.timestamp, now)}
          </span>
        </div>
      </div>
      <div className="flex flex-col items-end justify-center gap-1 shrink-0">
        <ImpactBar impact={item.impact} accent={cfg.accent} />
        <span className={cn('text-[11px] font-mono', cfg.text)}>{formatSignedScore(item.score)}</span>
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
        limit: NEWS_LIST_PAGE_SIZE,
        offset,
        with_count: isFirst,
        ticker: ticker || undefined,
      });
      if (!mountedRef.current) return;
      if (isFirst && res.total != null) setTotal(res.total);
      setItems((prev) => (isFirst ? res.items : [...prev, ...res.items]));
      offsetRef.current = offset + res.count;
      hasMoreRef.current = res.count >= NEWS_LIST_PAGE_SIZE;
    } catch (err: unknown) {
      if (mountedRef.current) setError(err instanceof Error ? err.message : '뉴스를 불러올 수 없습니다');
    } finally {
      if (mountedRef.current) {
        setIsLoading(false);
        setIsLoadingMore(false);
      }
    }
  }, []);

  // Initial load
  useEffect(() => {
    mountedRef.current = true;
    loadPage(0, true);
    return () => {
      mountedRef.current = false;
    };
  }, [loadPage]);

  // Ticker search with debounce
  const handleTickerSearch = useCallback((value: string) => {
    setTickerSearch(value);
    clearTimeout(searchTimerRef.current);
    searchTimerRef.current = setTimeout(() => {
      loadPage(0, true, value.trim().toUpperCase());
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

  const hasActiveFilter = Boolean(query || tickerSearch || sentimentFilter !== 'all');

  // 영향도 감쇠/상대시간 기준 시각 — 렌더 순수성을 위해 state 로 보관, 1분마다 갱신.
  const [now, setNow] = useState(0);
  useEffect(() => {
    setNow(Date.now());
    const id = setInterval(() => setNow(Date.now()), 60_000);
    return () => clearInterval(id);
  }, []);

  // Client-side filters (text query + sentiment)
  const filtered = useMemo(
    () =>
      items.filter((item) => {
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
      }),
    [items, sentimentFilter, query],
  );

  const scored = useMemo(() => scoreByImpact(filtered, now), [filtered, now]);

  // 영향도 TOP — 필터/검색이 없을 때만. 노이즈 컷(min impact) 후 상위 N.
  const topItems = useMemo(
    () =>
      hasActiveFilter
        ? []
        : scored.filter((it) => it.impact >= NEWS_IMPACT_MIN_FOR_TOP).slice(0, NEWS_IMPACT_TOP_COUNT),
    [scored, hasActiveFilter],
  );

  // 피드 — TOP에 노출된 항목은 중복 제거. 일자별 그룹핑.
  const feedGroups = useMemo(() => {
    const topUrls = new Set(topItems.map((it) => it.url));
    const feedItems = topUrls.size ? scored.filter((it) => !topUrls.has(it.url)) : scored;
    return groupNewsByDay(feedItems, now);
  }, [scored, topItems, now]);

  const showLoadMore = hasMoreRef.current && sentimentFilter === 'all' && !query;

  return (
    <div className="min-h-screen bg-[#09090b]">
      <PageHeader title="News">
        {total != null && (
          <span className="text-xs font-mono text-zinc-600">{total.toLocaleString()}건</span>
        )}
      </PageHeader>

      {/* Search + filter bar */}
      <div className="sticky top-14 z-40 bg-[#09090b]/80 backdrop-blur-xl border-b border-zinc-800/40">
        <div className="max-w-[1100px] mx-auto px-6 py-2.5 flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
          <div className="flex items-center gap-2 flex-1">
            <div className="relative flex-1 max-w-[320px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-zinc-600" />
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="뉴스 검색..."
                aria-label="뉴스 검색"
                className="w-full text-[13px] bg-zinc-900/60 border border-zinc-800/50 rounded-lg pl-9 pr-3 py-2
                           text-zinc-200 placeholder:text-zinc-600
                           focus:outline-none focus:border-zinc-700 transition-colors"
              />
            </div>
            <div className="relative w-[140px]">
              <input
                type="text"
                value={tickerSearch}
                onChange={(e) => handleTickerSearch(e.target.value)}
                placeholder="티커 (AAPL)"
                aria-label="티커 검색"
                className="w-full text-[13px] font-mono bg-zinc-900/60 border border-zinc-800/50 rounded-lg px-3 py-2
                           text-zinc-200 placeholder:text-zinc-600 uppercase
                           focus:outline-none focus:border-zinc-700 transition-colors"
              />
            </div>
            {hasActiveFilter && (
              <button onClick={clearSearch} className="p-2 text-zinc-600 hover:text-zinc-400 transition-colors shrink-0" title="필터 초기화" aria-label="필터 초기화">
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
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

      {/* Content */}
      <main className="max-w-[1100px] mx-auto px-6 py-6">
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
        ) : scored.length === 0 ? (
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
                {scored.length}건{query && ` · "${query}"`}{tickerSearch && ` · ${tickerSearch.toUpperCase()}`}
              </div>
            )}

            {/* 시장 영향도 TOP */}
            <ImpactSection items={topItems} now={now} />

            {/* 최신 피드 (일자 그룹) */}
            <section>
              {!hasActiveFilter && (
                <h2 className="sr-only">최신 뉴스</h2>
              )}
              {feedGroups.map((group) => (
                <div key={group.label} className="mb-6 last:mb-0">
                  <div className="flex items-center gap-3 mb-2">
                    <span className="text-[11px] font-semibold text-zinc-500 uppercase tracking-wider">{group.label}</span>
                    <span className="h-px flex-1 bg-zinc-800/60" />
                    <span className="text-[10px] font-mono text-zinc-700">{group.items.length}</span>
                  </div>
                  <div className="flex flex-col">
                    {group.items.map((item, i) => (
                      <FeedRow key={`feed-${item.url}-${i}`} item={item} now={now} />
                    ))}
                  </div>
                </div>
              ))}
            </section>

            {/* Load more */}
            {showLoadMore && (
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
