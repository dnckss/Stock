import { Newspaper } from 'lucide-react';
import Link from 'next/link';
import type { RelatedNewsItem, SentimentType } from '@/types/dashboard';

interface RelatedNewsProps {
  items: RelatedNewsItem[];
  ticker: string;
  onRefreshLatest?: () => void;
  isRefreshing?: boolean;
  lastRefreshForced?: boolean;
}

const SENTIMENT_COLORS: Record<SentimentType, string> = {
  positive: 'bg-green-500',
  negative: 'bg-red-500',
  neutral: 'bg-zinc-500',
};

const SENTIMENT_LABELS: Record<SentimentType, string> = {
  positive: '긍정',
  negative: '부정',
  neutral: '중립',
};

export default function RelatedNews({
  items,
  ticker,
  onRefreshLatest,
  isRefreshing = false,
  lastRefreshForced = false,
}: RelatedNewsProps) {
  if (items.length === 0) {
    return (
      <section className="rounded-xl border border-zinc-800 bg-zinc-900 p-6">
        <div className="flex items-center gap-3 text-zinc-500">
          <Newspaper className="w-5 h-5" />
          <span className="text-sm">관련 뉴스가 없습니다.</span>
        </div>
      </section>
    );
  }

  const buildNewsDetailHref = (item: RelatedNewsItem) => {
    const params = new URLSearchParams();
    params.set('url', item.url);
    params.set('title', item.headline);
    params.set('publisher', item.source);
    params.set('timestamp', item.timestamp);
    params.set('ticker', ticker);
    return `/news?${params.toString()}`;
  };

  return (
    <section className="relative overflow-hidden rounded-xl border border-zinc-800 bg-zinc-900 p-6">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-zinc-700/60 to-transparent" />

      <div className="mb-6 flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg border border-blue-500/20 bg-blue-500/10">
            <Newspaper className="h-5 w-5 text-blue-400" />
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-lg font-bold text-zinc-100">Related News</h2>
              {lastRefreshForced ? (
                <span className="rounded-md border border-zinc-700/70 bg-zinc-950/40 px-2 py-0.5 text-[10px] font-mono text-zinc-400">
                  refresh=1
                </span>
              ) : null}
            </div>
            <p className="text-xs text-zinc-500">
              {ticker} · {items.length}건의 관련 뉴스 분석
            </p>
          </div>
        </div>

        {onRefreshLatest ? (
          <button
            type="button"
            onClick={onRefreshLatest}
            disabled={isRefreshing}
            className="inline-flex items-center gap-2 rounded-lg border border-zinc-800 bg-zinc-950/40 px-3 py-2 text-[11px] font-mono text-zinc-200 transition-colors hover:bg-zinc-800/30 disabled:pointer-events-none disabled:opacity-50"
          >
            최신 뉴스 새로고침
          </button>
        ) : null}
      </div>

      <div className="space-y-3">
        {items.map((item, i) => (
          <Link
            key={i}
            href={buildNewsDetailHref(item)}
            className="group flex items-start gap-3 rounded-lg border border-zinc-800/50 bg-zinc-800/20 p-4 transition-colors hover:border-zinc-700 hover:bg-zinc-800/40"
          >
            <div
              className={`mt-1 w-2 h-2 rounded-full shrink-0 ${SENTIMENT_COLORS[item.sentiment]}`}
            />
            <div className="flex-1 min-w-0">
              <p className="text-sm text-zinc-200 leading-relaxed group-hover:text-zinc-100 transition-colors">
                {item.headline}
              </p>
              <div className="flex items-center gap-2 mt-2">
                <span className="text-[10px] font-medium text-zinc-500">
                  {item.source}
                </span>
                <span className="text-zinc-700 text-[10px]">·</span>
                <span className="text-[10px] text-zinc-600">{item.timestamp}</span>
                <span className="text-zinc-700 text-[10px]">·</span>
                <span
                  className={`text-[10px] font-medium ${
                    item.sentiment === 'positive'
                      ? 'text-green-500'
                      : item.sentiment === 'negative'
                        ? 'text-red-500'
                        : 'text-zinc-400'
                  }`}
                >
                  {SENTIMENT_LABELS[item.sentiment]}
                </span>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}
