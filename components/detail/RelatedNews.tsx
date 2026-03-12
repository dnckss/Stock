import { Newspaper } from 'lucide-react';
import type { RelatedNewsItem, SentimentType } from '@/types/dashboard';

interface RelatedNewsProps {
  items: RelatedNewsItem[];
  ticker: string;
}

const SENTIMENT_COLORS: Record<SentimentType, string> = {
  positive: 'bg-green-500',
  negative: 'bg-red-500',
  neutral: 'bg-yellow-500',
};

const SENTIMENT_LABELS: Record<SentimentType, string> = {
  positive: '긍정',
  negative: '부정',
  neutral: '중립',
};

export default function RelatedNews({ items, ticker }: RelatedNewsProps) {
  if (items.length === 0) {
    return (
      <section className="rounded-xl border border-zinc-800 bg-zinc-900 p-6">
        <div className="flex items-center gap-3 text-zinc-500">
          <Newspaper className="w-5 h-5" />
          <span className="text-sm">{ticker} 관련 뉴스가 없습니다.</span>
        </div>
      </section>
    );
  }

  return (
    <section className="relative overflow-hidden rounded-xl border border-zinc-800 bg-zinc-900 p-6">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-zinc-700/60 to-transparent" />

      <div className="mb-6 flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg border border-blue-500/20 bg-blue-500/10">
          <Newspaper className="h-5 w-5 text-blue-400" />
        </div>
        <div>
          <h2 className="text-lg font-bold text-zinc-100">
            AI 판별 근거 뉴스
          </h2>
          <p className="text-xs text-zinc-500">
            {ticker} · {items.length}건의 관련 뉴스 분석
          </p>
        </div>
      </div>

      <div className="space-y-3">
        {items.map((item, i) => (
          <a
            key={i}
            href={item.url}
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
                        : 'text-yellow-500'
                  }`}
                >
                  {SENTIMENT_LABELS[item.sentiment]}
                </span>
              </div>
            </div>
          </a>
        ))}
      </div>
    </section>
  );
}
