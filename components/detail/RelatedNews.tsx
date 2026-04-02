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
  positive: '호재',
  negative: '악재',
  neutral: '중립',
};

const SENTIMENT_TEXT: Record<SentimentType, string> = {
  positive: 'text-green-500',
  negative: 'text-red-500',
  neutral: 'text-zinc-400',
};

export default function RelatedNews({
  items,
  ticker,
  onRefreshLatest,
  isRefreshing = false,
  lastRefreshForced = false,
}: RelatedNewsProps) {
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
    <div className="border-b border-zinc-800">
      {/* Header */}
      <div className="px-3 py-1.5 bg-zinc-800/30 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-[9px] font-mono font-bold text-zinc-500 uppercase tracking-widest">
            관련 뉴스
          </span>
          <span className="text-[8px] font-mono text-zinc-600">
            {items.length}건
          </span>
          {lastRefreshForced && (
            <span className="text-[8px] font-mono text-zinc-600 bg-zinc-800 px-1 rounded">
              refresh
            </span>
          )}
        </div>
        {onRefreshLatest && (
          <button
            type="button"
            onClick={onRefreshLatest}
            disabled={isRefreshing}
            className="text-[9px] font-mono text-zinc-500 hover:text-zinc-300 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {isRefreshing ? '갱신중...' : '새로고침'}
          </button>
        )}
      </div>

      {/* Items */}
      {items.length === 0 ? (
        <div className="px-3 py-4 text-center">
          <span className="text-[10px] text-zinc-600">관련 뉴스가 없습니다</span>
        </div>
      ) : (
        <div className="divide-y divide-zinc-800/30">
          {items.map((item, i) => (
            <Link
              key={i}
              href={buildNewsDetailHref(item)}
              className="block px-3 py-2 hover:bg-zinc-800/20 transition-colors group"
            >
              <div className="flex items-start gap-2">
                <span
                  className={`mt-1.5 shrink-0 h-1.5 w-1.5 rounded-full ${SENTIMENT_COLORS[item.sentiment]}`}
                />
                <div className="flex-1 min-w-0">
                  <p className="text-[11px] text-zinc-300 leading-snug line-clamp-2 group-hover:text-zinc-100 transition-colors">
                    {item.headline}
                  </p>
                  <div className="flex items-center gap-1.5 mt-1">
                    <span className="text-[9px] text-zinc-500">{item.source}</span>
                    <span className="text-zinc-700 text-[9px]">&middot;</span>
                    <span className="text-[9px] text-zinc-600">{item.timestamp}</span>
                    <span className="text-zinc-700 text-[9px]">&middot;</span>
                    <span className={`text-[9px] font-medium ${SENTIMENT_TEXT[item.sentiment]}`}>
                      {SENTIMENT_LABELS[item.sentiment]}
                    </span>
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
