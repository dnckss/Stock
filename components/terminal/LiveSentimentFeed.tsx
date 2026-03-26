'use client';

import { AnimatePresence, motion } from 'framer-motion';
import { ExternalLink } from 'lucide-react';
import { useRouter } from 'next/navigation';
import type { NewsFeedItem, SentimentLabel } from '@/types/dashboard';
import { cn } from '@/lib/utils';

const LABEL_STYLE: Record<SentimentLabel, { dot: string; text: string; badge: string; label: string }> = {
  positive: {
    dot: 'bg-green-500',
    text: 'text-green-500',
    badge: 'bg-green-500/10 text-green-400 ring-green-500/20',
    label: '호재',
  },
  negative: {
    dot: 'bg-red-500',
    text: 'text-red-500',
    badge: 'bg-red-500/10 text-red-400 ring-red-500/20',
    label: '악재',
  },
  neutral: {
    dot: 'bg-yellow-500',
    text: 'text-yellow-500',
    badge: 'bg-yellow-500/10 text-yellow-400 ring-yellow-500/20',
    label: '중립',
  },
};

function toRelativeTime(input: number): string {
  const ts = input > 1_000_000_000_000 ? input : input * 1000;
  const diffMs = Date.now() - ts;
  if (!Number.isFinite(diffMs)) return '';
  if (diffMs < 60_000) return '방금 전';
  const mins = Math.floor(diffMs / 60_000);
  if (mins < 60) return `${mins}분 전`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}시간 전`;
  const days = Math.floor(hrs / 24);
  return `${days}일 전`;
}

function hasValidUrl(url: string | undefined | null): url is string {
  return typeof url === 'string' && url.length > 0;
}

function formatNewsTimestamp(input: number): string {
  const tsMs = input > 1_000_000_000_000 ? input : input * 1000;
  const d = new Date(tsMs);
  if (Number.isNaN(d.getTime())) return '';

  return d.toLocaleString('ko-KR', {
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });
}

function buildNewsDetailHref(item: NewsFeedItem): string {
  const params = new URLSearchParams();
  if (item.url) params.set('url', item.url);
  if (item.title) params.set('title', item.title);
  if (item.publisher) params.set('publisher', item.publisher);
  if (item.timestamp) params.set('timestamp', formatNewsTimestamp(item.timestamp));
  if (item.ticker) params.set('ticker', item.ticker);
  return `/news?${params.toString()}`;
}

function NewsItem({ item }: { item: NewsFeedItem }) {
  const router = useRouter();
  const style = LABEL_STYLE[item.sentimentLabel] ?? LABEL_STYLE.neutral;
  const linkable = hasValidUrl(item.url);
  const scorePositive = item.score >= 0;

  const content = (
    <div className="flex items-start gap-2.5">
      <div className={cn('mt-1.5 w-2 h-2 rounded-full shrink-0', style.dot)} />
      <div className="flex-1 min-w-0">
        <div className="flex items-start gap-1.5">
          <p className="text-[11px] text-zinc-200 leading-relaxed line-clamp-2 flex-1">
            {item.title}
          </p>
          {linkable && (
            <ExternalLink className="w-3 h-3 text-zinc-600 shrink-0 mt-0.5 opacity-0 group-hover/news:opacity-100 transition-opacity" />
          )}
        </div>

        <div className="flex items-center gap-1.5 mt-1.5 flex-wrap">
          <span className="text-[9px] text-zinc-500 font-medium">
            {item.publisher}
          </span>
          <span className="text-zinc-700 text-[9px]">·</span>
          <span className="text-[9px] text-zinc-600">
            {toRelativeTime(item.timestamp)}
          </span>

          {item.ticker && (
            <>
              <span className="text-zinc-700 text-[9px]">·</span>
              <span className="text-[9px] font-mono font-semibold text-zinc-400">
                ${item.ticker}
              </span>
            </>
          )}

          <span className="text-zinc-700 text-[9px]">·</span>
          <span
            className={cn(
              'inline-flex items-center gap-0.5 text-[8px] font-medium px-1 py-px rounded ring-1',
              style.badge,
            )}
          >
            {style.label}
          </span>

          <span
            className={cn(
              'text-[9px] font-mono font-medium',
              style.text,
            )}
          >
            {scorePositive ? '+' : ''}
            {item.score.toFixed(2)}
          </span>

          {item.confidence > 0 && (
            <>
              <span className="text-zinc-700 text-[9px]">·</span>
              <span className="text-[9px] font-mono text-zinc-600">
                {(item.confidence * 100).toFixed(0)}%
              </span>
            </>
          )}
        </div>
      </div>
    </div>
  );

  const motionProps = {
    layout: true as const,
    initial: { opacity: 0, y: -8 },
    animate: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: 8 },
    transition: { duration: 0.22, ease: 'easeOut' as const },
  };

  if (linkable) {
    const href = buildNewsDetailHref(item);
    return (
      <motion.div
        {...motionProps}
        role="button"
        tabIndex={0}
        aria-label={`기사 보기: ${item.title}`}
        onClick={() => router.push(href)}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            router.push(href);
          }
        }}
        className="group/news block px-3 py-2.5 hover:bg-zinc-800/40 transition-colors border-b border-zinc-800/50 cursor-pointer"
      >
        {content}
      </motion.div>
    );
  }

  return (
    <motion.div
      {...motionProps}
      className="group/news px-3 py-2.5 border-b border-zinc-800/50 cursor-default"
    >
      {content}
    </motion.div>
  );
}

interface LiveSentimentFeedProps {
  items: NewsFeedItem[];
  isLoading: boolean;
}

function FeedSkeleton() {
  return (
    <div className="flex-1 overflow-y-auto terminal-scroll">
      {Array.from({ length: 10 }).map((_, i) => (
        <div key={i} className="px-3 py-2.5 border-b border-zinc-800/50">
          <div className="flex items-start gap-2.5">
            <div className="mt-1.5 w-2 h-2 rounded-full bg-zinc-800 animate-pulse" />
            <div className="flex-1 min-w-0">
              <div className="h-3 w-[90%] bg-zinc-800 rounded animate-pulse" />
              <div className="mt-2 h-2 w-[60%] bg-zinc-800/70 rounded animate-pulse" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

export default function LiveSentimentFeed({
  items,
  isLoading,
}: LiveSentimentFeedProps) {
  const posCount = items.filter((n) => n.sentimentLabel === 'positive').length;
  const negCount = items.filter((n) => n.sentimentLabel === 'negative').length;
  const neutralCount = items.length - posCount - negCount;

  return (
    <div className="h-full flex flex-col bg-zinc-900 border-l border-zinc-800">
      <div className="px-3 py-2 border-b border-zinc-800 flex items-center justify-between">
        <h2 className="text-[10px] font-semibold text-zinc-400 uppercase tracking-widest">
          AI Sentiment Feed
        </h2>
        <div className="flex items-center gap-1.5">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500" />
          </span>
          <span className="text-[10px] text-blue-400 font-medium">LIVE</span>
        </div>
      </div>

      {isLoading ? (
        <FeedSkeleton />
      ) : (
        <div className="flex-1 overflow-y-auto terminal-scroll">
          <AnimatePresence initial={false}>
            {items.map((item) => (
              <NewsItem key={item.id} item={item} />
            ))}
          </AnimatePresence>
        </div>
      )}

      <div className="px-3 py-1.5 border-t border-zinc-800 flex items-center justify-between bg-zinc-900/80">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1">
            <div className="w-1.5 h-1.5 rounded-full bg-green-500" />
            <span className="text-[9px] text-zinc-500 font-mono">{posCount}</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-1.5 h-1.5 rounded-full bg-red-500" />
            <span className="text-[9px] text-zinc-500 font-mono">{negCount}</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-1.5 h-1.5 rounded-full bg-yellow-500" />
            <span className="text-[9px] text-zinc-500 font-mono">{neutralCount}</span>
          </div>
        </div>
        <span className="text-[9px] text-zinc-600 font-mono">
          {items.length} articles
        </span>
      </div>
    </div>
  );
}
