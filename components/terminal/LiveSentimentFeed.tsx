'use client';

import { AnimatePresence, motion } from 'framer-motion';
import { NEWS_SENTIMENT_SCORE_THRESHOLD } from '@/lib/constants';
import type { NewsFeedItem } from '@/types/dashboard';

function scoreStyle(score: number): { dot: string; text: string; showPlus: boolean } {
  if (score >= NEWS_SENTIMENT_SCORE_THRESHOLD) {
    return { dot: 'bg-green-500', text: 'text-green-500', showPlus: true };
  }
  if (score <= -NEWS_SENTIMENT_SCORE_THRESHOLD) {
    return { dot: 'bg-red-500', text: 'text-red-500', showPlus: false };
  }
  return { dot: 'bg-yellow-500', text: 'text-yellow-500', showPlus: true };
}

function toRelativeTime(input: number): string {
  const ts = input > 1_000_000_000_000 ? input : input * 1000; // ms vs sec
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

function NewsItem({ item }: { item: NewsFeedItem }) {
  const style = scoreStyle(item.score);
  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 8 }}
      transition={{ duration: 0.22, ease: 'easeOut' }}
      className="px-3 py-2.5 hover:bg-zinc-800/30 transition-colors border-b border-zinc-800/50 cursor-default"
    >
      <div className="flex items-start gap-2.5">
        <div
          className={`mt-1.5 w-2 h-2 rounded-full shrink-0 ${style.dot}`}
        />
        <div className="flex-1 min-w-0">
          <p className="text-[11px] text-zinc-200 leading-relaxed line-clamp-2">
            {item.title}
          </p>
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
                  {'$'}{item.ticker}
                </span>
              </>
            )}
            <span className="text-zinc-700 text-[9px]">·</span>
            <span
              className={`text-[9px] font-mono font-medium ${style.text}`}
            >
              {style.showPlus ? '+' : ''}
              {item.score.toFixed(2)}
            </span>
          </div>
        </div>
      </div>
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
        <div
          key={i}
          className="px-3 py-2.5 border-b border-zinc-800/50"
        >
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

export default function LiveSentimentFeed({ items, isLoading }: LiveSentimentFeedProps) {
  const strongPos = items.filter((n) => n.score >= NEWS_SENTIMENT_SCORE_THRESHOLD).length;
  const strongNeg = items.filter((n) => n.score <= -NEWS_SENTIMENT_SCORE_THRESHOLD).length;
  const neutralish = items.length - strongPos - strongNeg;

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
            <span className="text-[9px] text-zinc-500 font-mono">{strongPos}</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-1.5 h-1.5 rounded-full bg-red-500" />
            <span className="text-[9px] text-zinc-500 font-mono">{strongNeg}</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-1.5 h-1.5 rounded-full bg-yellow-500" />
            <span className="text-[9px] text-zinc-500 font-mono">{neutralish}</span>
          </div>
        </div>
        <span className="text-[9px] text-zinc-600 font-mono">
          {items.length} articles
        </span>
      </div>
    </div>
  );
}
