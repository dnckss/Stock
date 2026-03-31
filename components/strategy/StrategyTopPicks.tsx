'use client';

import { motion } from 'framer-motion';
import type {
  StrategyTopPick,
  StrategyNewsTheme,
  StrategyDirection,
  StrategyConfidence,
} from '@/types/dashboard';

const DIRECTION_CONFIG: Record<
  StrategyDirection,
  { text: string; bg: string; border: string; glow: string }
> = {
  BUY: {
    text: 'text-green-400',
    bg: 'bg-green-500/10',
    border: 'border-green-500/40',
    glow: 'shadow-green-500/10',
  },
  SELL: {
    text: 'text-red-400',
    bg: 'bg-red-500/10',
    border: 'border-red-500/40',
    glow: 'shadow-red-500/10',
  },
  HOLD: {
    text: 'text-yellow-400',
    bg: 'bg-yellow-500/10',
    border: 'border-yellow-500/40',
    glow: 'shadow-yellow-500/10',
  },
};

const CONFIDENCE_BAR: Record<StrategyConfidence, { width: string; color: string; label: string }> = {
  high: { width: 'w-full', color: 'bg-emerald-500', label: 'HIGH' },
  medium: { width: 'w-2/3', color: 'bg-yellow-500', label: 'MED' },
  low: { width: 'w-1/3', color: 'bg-zinc-500', label: 'LOW' },
};

function findRelatedThemes(
  ticker: string,
  newsThemes: StrategyNewsTheme[],
): StrategyNewsTheme[] {
  return newsThemes.filter((t) =>
    t.tickers.includes(ticker.toUpperCase()),
  );
}

export default function StrategyTopPicks({
  picks,
  newsThemes = [],
}: {
  picks: StrategyTopPick[];
  newsThemes?: StrategyNewsTheme[];
}) {
  return (
    <section className="rounded-lg border border-zinc-800 bg-zinc-900/40 overflow-hidden">
      <div className="px-4 py-2 bg-zinc-800/40 border-b border-zinc-800 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
          <h2 className="text-[10px] font-mono font-bold text-zinc-400 uppercase tracking-widest">
            AI Top Picks
          </h2>
        </div>
        <span className="text-[9px] font-mono text-zinc-600">
          {picks.length} RECOMMENDATIONS
        </span>
      </div>

      <div className="divide-y divide-zinc-800/60">
        {picks.map((p, idx) => {
          const dir = DIRECTION_CONFIG[p.direction];
          const conf = CONFIDENCE_BAR[p.confidence];
          const related = findRelatedThemes(p.ticker, newsThemes);

          return (
            <motion.div
              key={p.ticker}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.08, duration: 0.3 }}
              className="p-4 hover:bg-zinc-800/15 transition-colors"
            >
              <div className="flex flex-col lg:flex-row gap-4">
                {/* Left: Ticker + Signal */}
                <div className="shrink-0 lg:w-[200px]">
                  <div className="flex items-center gap-3 mb-3">
                    <div
                      className={`h-11 px-4 rounded-lg border-2 ${dir.border} ${dir.bg} flex items-center justify-center shadow-lg ${dir.glow}`}
                    >
                      <span className={`font-mono text-sm font-black tracking-wider ${dir.text}`}>
                        {p.ticker}
                      </span>
                    </div>
                    <div
                      className={`text-xs font-mono font-black px-2.5 py-1 rounded border ${dir.border} ${dir.bg} ${dir.text}`}
                    >
                      {p.direction}
                    </div>
                  </div>

                  {/* Confidence bar */}
                  <div className="mb-1">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-[9px] font-mono text-zinc-500 uppercase">
                        Confidence
                      </span>
                      <span className={`text-[9px] font-mono font-bold ${conf.color === 'bg-emerald-500' ? 'text-emerald-400' : conf.color === 'bg-yellow-500' ? 'text-yellow-400' : 'text-zinc-400'}`}>
                        {conf.label}
                      </span>
                    </div>
                    <div className="h-1 w-full bg-zinc-800 rounded-full overflow-hidden">
                      <div className={`h-full rounded-full ${conf.color} ${conf.width} transition-all`} />
                    </div>
                  </div>
                </div>

                {/* Right: Rationale + Evidence */}
                <div className="flex-1 min-w-0">
                  <div className="mb-2">
                    <span className="text-[9px] font-mono text-zinc-500 uppercase tracking-wider">
                      Rationale
                    </span>
                  </div>
                  <p className="text-[13px] text-zinc-200 leading-relaxed whitespace-pre-line mb-3">
                    {p.rationale}
                  </p>

                  {/* Cross-referenced news themes as evidence */}
                  {related.length > 0 && (
                    <div className="border-t border-zinc-800/50 pt-2.5">
                      <span className="text-[9px] font-mono text-zinc-600 uppercase tracking-wider">
                        Related Signal
                      </span>
                      <div className="mt-1.5 flex flex-wrap gap-2">
                        {related.map((theme) => {
                          const sentColor =
                            theme.sentiment === 'positive'
                              ? 'text-green-400 border-green-500/30 bg-green-500/5'
                              : theme.sentiment === 'negative'
                                ? 'text-red-400 border-red-500/30 bg-red-500/5'
                                : 'text-zinc-400 border-zinc-600/30 bg-zinc-800/30';
                          return (
                            <span
                              key={theme.theme}
                              className={`inline-flex items-center gap-1.5 text-[10px] font-mono px-2 py-1 rounded border ${sentColor}`}
                            >
                              <span className={`h-1 w-1 rounded-full ${
                                theme.sentiment === 'positive'
                                  ? 'bg-green-400'
                                  : theme.sentiment === 'negative'
                                    ? 'bg-red-400'
                                    : 'bg-zinc-400'
                              }`} />
                              {theme.theme}
                            </span>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>
    </section>
  );
}
