'use client';

import type { StrategyNewsTheme, ThemeSentiment } from '@/types/dashboard';

const SENTIMENT_STYLE: Record<ThemeSentiment, { text: string; bg: string; border: string; dot: string; label: string }> = {
  positive: { text: 'text-green-400', bg: 'bg-green-500/10', border: 'border-green-500/30', dot: 'bg-green-400', label: '긍정' },
  negative: { text: 'text-red-400', bg: 'bg-red-500/10', border: 'border-red-500/30', dot: 'bg-red-400', label: '부정' },
  neutral: { text: 'text-zinc-400', bg: 'bg-zinc-700/20', border: 'border-zinc-600/40', dot: 'bg-zinc-400', label: '중립' },
};

export default function StrategyNewsThemes({
  themes,
}: {
  themes: StrategyNewsTheme[];
}) {
  if (themes.length === 0) return null;

  return (
    <section className="rounded-2xl border border-zinc-800/50 bg-zinc-900/60 backdrop-blur-xl p-6 relative overflow-hidden">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-zinc-700/60 to-transparent" />
      <div className="flex items-center gap-3 mb-4">
        <div className="w-9 h-9 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center">
          <span className="h-2 w-2 rounded-full bg-blue-400 animate-pulse" />
        </div>
        <div>
          <h2 className="text-sm font-bold text-zinc-100 tracking-wider font-mono">
            News Themes
          </h2>
          <p className="text-xs text-zinc-500 mt-0.5">
            AI가 포착한 뉴스 핵심 테마
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {themes.map((t) => {
          const s = SENTIMENT_STYLE[t.sentiment];
          return (
            <div
              key={t.theme}
              className="rounded-xl border border-zinc-800/50 bg-zinc-950/20 p-4"
            >
              <div className="flex items-center justify-between gap-2 mb-2">
                <h3 className="text-sm font-medium text-zinc-100 truncate">
                  {t.theme}
                </h3>
                <span
                  className={`shrink-0 text-[10px] font-mono px-2 py-0.5 rounded border ${s.bg} ${s.border} ${s.text}`}
                >
                  {s.label}
                </span>
              </div>

              {t.tickers.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mb-2">
                  {t.tickers.map((ticker) => (
                    <span
                      key={ticker}
                      className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-zinc-800/60 border border-zinc-700/50 text-zinc-300"
                    >
                      {ticker}
                    </span>
                  ))}
                </div>
              )}

              {t.detail && (
                <p className="text-xs text-zinc-400 leading-relaxed line-clamp-3">
                  {t.detail}
                </p>
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
}
