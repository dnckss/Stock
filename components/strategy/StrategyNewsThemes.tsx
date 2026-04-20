'use client';

import { Newspaper } from 'lucide-react';
import type { StrategyNewsTheme, ThemeSentiment } from '@/types/dashboard';

const SENT_STYLES: Record<ThemeSentiment, { dot: string; border: string }> = {
  positive: { dot: 'bg-emerald-500', border: 'border-l-emerald-500/50' },
  negative: { dot: 'bg-red-500', border: 'border-l-red-500/50' },
  neutral: { dot: 'bg-zinc-500', border: 'border-l-zinc-600/50' },
};

export default function StrategyNewsThemes({ themes }: { themes: StrategyNewsTheme[] }) {
  if (themes.length === 0) return null;

  return (
    <div className="bg-zinc-900/40 border border-zinc-800/50 rounded-2xl overflow-hidden h-full">
      {/* Header */}
      <div className="px-5 py-3.5 border-b border-zinc-800/50 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Newspaper className="w-4 h-4 text-zinc-500" />
          <span className="text-xs font-medium text-zinc-400 uppercase tracking-wider">
            News Signal
          </span>
        </div>
        <span className="text-xs font-mono text-zinc-600 bg-zinc-800/50 px-2 py-0.5 rounded-md">
          {themes.length}
        </span>
      </div>

      {/* Themes list */}
      <div className="divide-y divide-zinc-800/30">
        {themes.map((t) => {
          const style = SENT_STYLES[t.sentiment];
          return (
            <div
              key={t.theme}
              className={`px-5 py-3 border-l-2 ${style.border} hover:bg-white/[0.02] transition-colors`}
            >
              <div className="flex items-center gap-2 mb-1">
                <span className={`shrink-0 h-2 w-2 rounded-full ${style.dot}`} />
                <span className="text-sm text-zinc-200 font-medium truncate">{t.theme}</span>
              </div>
              {t.tickers.length > 0 && (
                <div className="flex gap-1.5 ml-4 mb-1">
                  {t.tickers.map((tk) => (
                    <span
                      key={tk}
                      className="text-[10px] font-mono px-1.5 py-0.5 rounded-md bg-zinc-800/60 text-zinc-400 border border-zinc-700/30"
                    >
                      {tk}
                    </span>
                  ))}
                </div>
              )}
              {t.detail && (
                <p className="text-xs text-zinc-500 ml-4 line-clamp-1">{t.detail}</p>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
