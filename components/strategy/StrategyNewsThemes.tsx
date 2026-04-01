'use client';

import type { StrategyNewsTheme, ThemeSentiment } from '@/types/dashboard';

const SENT_DOT: Record<ThemeSentiment, string> = {
  positive: 'bg-green-500',
  negative: 'bg-red-500',
  neutral: 'bg-zinc-500',
};

export default function StrategyNewsThemes({ themes }: { themes: StrategyNewsTheme[] }) {
  if (themes.length === 0) return null;

  return (
    <div className="border-b border-zinc-800">
      <div className="px-3 py-1.5 bg-zinc-800/30 flex items-center justify-between">
        <span className="text-[9px] font-mono font-bold text-zinc-500 uppercase tracking-widest">
          News Signal
        </span>
        <span className="text-[8px] font-mono text-zinc-600">{themes.length}</span>
      </div>
      <div className="divide-y divide-zinc-800/30">
        {themes.map((t) => (
          <div key={t.theme} className="px-3 py-1.5 hover:bg-zinc-800/20 transition-colors">
            <div className="flex items-center gap-1.5 mb-0.5">
              <span className={`shrink-0 h-1.5 w-1.5 rounded-full ${SENT_DOT[t.sentiment]}`} />
              <span className="text-[10px] text-zinc-200 truncate font-medium">{t.theme}</span>
            </div>
            {t.tickers.length > 0 && (
              <div className="flex gap-1 ml-3 mb-0.5">
                {t.tickers.map((tk) => (
                  <span key={tk} className="text-[8px] font-mono px-1 py-px rounded bg-zinc-800 text-zinc-400">
                    {tk}
                  </span>
                ))}
              </div>
            )}
            {t.detail && (
              <p className="text-[9px] text-zinc-500 ml-3 line-clamp-1">{t.detail}</p>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
