'use client';

import type { StrategyNewsTheme, ThemeSentiment } from '@/types/dashboard';

const SENTIMENT_CONFIG: Record<ThemeSentiment, { dot: string; text: string; bar: string; label: string }> = {
  positive: { dot: 'bg-green-500', text: 'text-green-400', bar: 'bg-green-500/30', label: 'POSITIVE' },
  negative: { dot: 'bg-red-500', text: 'text-red-400', bar: 'bg-red-500/30', label: 'NEGATIVE' },
  neutral: { dot: 'bg-zinc-500', text: 'text-zinc-400', bar: 'bg-zinc-500/30', label: 'NEUTRAL' },
};

export default function StrategyNewsThemes({
  themes,
}: {
  themes: StrategyNewsTheme[];
}) {
  if (themes.length === 0) return null;

  return (
    <div className="rounded-lg border border-zinc-800 bg-zinc-900/40 overflow-hidden h-full">
      <div className="px-4 py-2 bg-zinc-800/40 border-b border-zinc-800 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="h-1.5 w-1.5 rounded-full bg-blue-500" />
          <h2 className="text-[10px] font-mono font-bold text-zinc-400 uppercase tracking-widest">
            News Signal
          </h2>
        </div>
        <span className="text-[9px] font-mono text-zinc-600">
          {themes.length} THEMES
        </span>
      </div>

      <div className="divide-y divide-zinc-800/60">
        {themes.map((t) => {
          const s = SENTIMENT_CONFIG[t.sentiment];
          return (
            <div key={t.theme} className="px-4 py-3 hover:bg-zinc-800/20 transition-colors">
              <div className="flex items-start justify-between gap-3 mb-1.5">
                <div className="flex items-center gap-2 min-w-0">
                  <span className={`shrink-0 h-1.5 w-1.5 rounded-full ${s.dot}`} />
                  <h3 className="text-xs font-medium text-zinc-100 truncate">
                    {t.theme}
                  </h3>
                </div>
                <span className={`shrink-0 text-[9px] font-mono font-bold ${s.text}`}>
                  {s.label}
                </span>
              </div>

              {t.tickers.length > 0 && (
                <div className="flex flex-wrap gap-1 mb-1.5 ml-3.5">
                  {t.tickers.map((ticker) => (
                    <span
                      key={ticker}
                      className="text-[9px] font-mono px-1.5 py-px rounded bg-zinc-800 border border-zinc-700/50 text-zinc-300"
                    >
                      {ticker}
                    </span>
                  ))}
                </div>
              )}

              {t.detail && (
                <p className="text-[11px] text-zinc-500 leading-relaxed ml-3.5 line-clamp-2">
                  {t.detail}
                </p>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
