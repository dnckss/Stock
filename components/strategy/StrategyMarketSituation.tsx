'use client';

import { STRATEGY_REGIME_CONFIG } from '@/lib/strategyConstants';
import type { MarketRegime } from '@/types/dashboard';

const FEAR_GREED_LABELS: { min: number; label: string; color: string }[] = [
  { min: 75, label: 'Extreme Greed', color: 'text-green-400' },
  { min: 55, label: 'Greed', color: 'text-green-500' },
  { min: 45, label: 'Neutral', color: 'text-yellow-500' },
  { min: 25, label: 'Fear', color: 'text-orange-500' },
  { min: 0, label: 'Extreme Fear', color: 'text-red-500' },
];

function getFearGreedStyle(value: number) {
  for (const t of FEAR_GREED_LABELS) {
    if (value >= t.min) return t;
  }
  return FEAR_GREED_LABELS[FEAR_GREED_LABELS.length - 1];
}

export default function StrategyMarketSituation({
  summary,
  regime,
  fearGreed,
}: {
  summary: string;
  regime: MarketRegime | null;
  fearGreed: number | null;
}) {
  const regimeCfg = regime ? STRATEGY_REGIME_CONFIG[regime] : null;
  const fgStyle = fearGreed !== null ? getFearGreedStyle(fearGreed) : null;

  return (
    <section className="rounded-lg border border-zinc-800 bg-zinc-900/40 overflow-hidden">
      <div className="px-4 py-2 bg-zinc-800/40 border-b border-zinc-800 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="h-1.5 w-1.5 rounded-full bg-green-500 animate-pulse" />
          <h2 className="text-[10px] font-mono font-bold text-zinc-400 uppercase tracking-widest">
            Market Briefing
          </h2>
        </div>
        {regimeCfg && (
          <span
            className={`text-[10px] font-mono font-bold px-2.5 py-0.5 rounded border ${regimeCfg.bg} ${regimeCfg.border} ${regimeCfg.text}`}
          >
            {regimeCfg.label}
          </span>
        )}
      </div>

      <div className="p-4">
        <p className="text-[13px] text-zinc-200 leading-relaxed whitespace-pre-line mb-4">
          {summary}
        </p>

        {fearGreed !== null && fgStyle && (
          <div className="border-t border-zinc-800/60 pt-3">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-[9px] font-mono text-zinc-500 uppercase tracking-wider">
                Fear &amp; Greed Index
              </span>
              <div className="flex items-center gap-2">
                <span className="text-sm font-mono font-bold text-zinc-100 tabular-nums">
                  {fearGreed}
                </span>
                <span className={`text-[10px] font-mono font-medium ${fgStyle.color}`}>
                  {fgStyle.label}
                </span>
              </div>
            </div>
            <div className="h-1.5 rounded-full bg-zinc-800 overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-700 ease-out"
                style={{
                  width: `${fearGreed}%`,
                  background: 'linear-gradient(90deg, #ef4444 0%, #f97316 30%, #eab308 50%, #22c55e 100%)',
                }}
              />
            </div>
            <div className="flex justify-between mt-0.5">
              <span className="text-[8px] text-zinc-600">Extreme Fear</span>
              <span className="text-[8px] text-zinc-600">Extreme Greed</span>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
