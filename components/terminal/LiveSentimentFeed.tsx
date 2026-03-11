'use client';

import { MOCK_TERMINAL_DATA } from '@/lib/constants';
import type { NewsSentimentItem, SentimentType } from '@/types/dashboard';

const SENTIMENT_DOT_COLORS: Record<SentimentType, string> = {
  positive: 'bg-green-500',
  negative: 'bg-red-500',
  neutral: 'bg-yellow-500',
};

const SENTIMENT_SCORE_COLORS: Record<SentimentType, string> = {
  positive: 'text-green-500',
  negative: 'text-red-500',
  neutral: 'text-yellow-500',
};

function NewsItem({ item }: { item: NewsSentimentItem }) {
  return (
    <div className="px-3 py-2.5 hover:bg-zinc-800/30 transition-colors border-b border-zinc-800/50 cursor-default">
      <div className="flex items-start gap-2.5">
        <div
          className={`mt-1.5 w-2 h-2 rounded-full shrink-0 ${SENTIMENT_DOT_COLORS[item.sentiment]}`}
        />
        <div className="flex-1 min-w-0">
          <p className="text-[11px] text-zinc-200 leading-relaxed line-clamp-2">
            {item.headline}
          </p>
          <div className="flex items-center gap-1.5 mt-1.5 flex-wrap">
            <span className="text-[9px] text-zinc-500 font-medium">{item.source}</span>
            <span className="text-zinc-700 text-[9px]">·</span>
            <span className="text-[9px] text-zinc-600">{item.timestamp}</span>
            {item.relatedTicker && (
              <>
                <span className="text-zinc-700 text-[9px]">·</span>
                <span className="text-[9px] font-mono font-semibold text-zinc-400">
                  {'$'}{item.relatedTicker}
                </span>
              </>
            )}
            <span className="text-zinc-700 text-[9px]">·</span>
            <span
              className={`text-[9px] font-mono font-medium ${SENTIMENT_SCORE_COLORS[item.sentiment]}`}
            >
              {item.score >= 0 ? '+' : ''}
              {item.score.toFixed(2)}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function LiveSentimentFeed() {
  const { newsFeed } = MOCK_TERMINAL_DATA;

  const positiveCount = newsFeed.filter((n) => n.sentiment === 'positive').length;
  const negativeCount = newsFeed.filter((n) => n.sentiment === 'negative').length;
  const neutralCount = newsFeed.filter((n) => n.sentiment === 'neutral').length;

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

      <div className="flex-1 overflow-y-auto terminal-scroll">
        {newsFeed.map((item) => (
          <NewsItem key={item.id} item={item} />
        ))}
      </div>

      <div className="px-3 py-1.5 border-t border-zinc-800 flex items-center justify-between bg-zinc-900/80">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1">
            <div className="w-1.5 h-1.5 rounded-full bg-green-500" />
            <span className="text-[9px] text-zinc-500 font-mono">{positiveCount}</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-1.5 h-1.5 rounded-full bg-red-500" />
            <span className="text-[9px] text-zinc-500 font-mono">{negativeCount}</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-1.5 h-1.5 rounded-full bg-yellow-500" />
            <span className="text-[9px] text-zinc-500 font-mono">{neutralCount}</span>
          </div>
        </div>
        <span className="text-[9px] text-zinc-600 font-mono">
          {newsFeed.length} articles
        </span>
      </div>
    </div>
  );
}
