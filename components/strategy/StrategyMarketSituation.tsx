'use client';

import { STRATEGY_REGIME_CONFIG } from '@/lib/strategyConstants';
import type { MarketRegime } from '@/types/dashboard';

const FG_LABELS: { min: number; label: string; color: string }[] = [
  { min: 75, label: 'Extreme Greed', color: 'text-green-400' },
  { min: 55, label: 'Greed', color: 'text-green-500' },
  { min: 45, label: 'Neutral', color: 'text-yellow-500' },
  { min: 25, label: 'Fear', color: 'text-orange-500' },
  { min: 0, label: 'Extreme Fear', color: 'text-red-500' },
];

function getFgStyle(v: number) {
  for (const t of FG_LABELS) { if (v >= t.min) return t; }
  return FG_LABELS[FG_LABELS.length - 1];
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
  const fgStyle = fearGreed !== null ? getFgStyle(fearGreed) : null;

  return (
    <div className="bg-zinc-900/40 border border-zinc-800/50 rounded-2xl overflow-hidden">
      {/* Header */}
      <div className="px-5 py-3.5 border-b border-zinc-800/50 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
          <span className="text-xs font-medium text-zinc-400 uppercase tracking-wider">
            Market Overview
          </span>
        </div>
        {regimeCfg && (
          <span
            className={`text-xs font-mono font-bold px-3 py-1 rounded-lg
              ${regimeCfg.bg} ${regimeCfg.text} border ${regimeCfg.border}`}
          >
            {regimeCfg.label}
          </span>
        )}
      </div>

      <div className="p-5">
        <div className="flex flex-col lg:flex-row gap-6">
          {/* Fear & Greed */}
          {fearGreed !== null && fgStyle && (
            <div className="lg:w-[200px] shrink-0">
              <span className="text-[10px] font-mono text-zinc-600 uppercase tracking-wider block mb-3">
                Fear &amp; Greed Index
              </span>
              <div className="flex items-baseline gap-2 mb-3">
                <span className="text-3xl font-bold text-zinc-100 tabular-nums font-mono">
                  {fearGreed}
                </span>
                <span className={`text-sm font-medium ${fgStyle.color}`}>
                  {fgStyle.label}
                </span>
              </div>
              <div className="h-2 rounded-full bg-zinc-800 overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-1000 ease-out"
                  style={{
                    width: `${fearGreed}%`,
                    background: 'linear-gradient(90deg, #ef4444 0%, #f97316 25%, #eab308 50%, #22c55e 80%, #10b981 100%)',
                  }}
                />
              </div>
              <div className="flex justify-between mt-1.5">
                <span className="text-[9px] text-zinc-600">Fear</span>
                <span className="text-[9px] text-zinc-600">Greed</span>
              </div>
            </div>
          )}

          {/* Summary */}
          <div className="flex-1 min-w-0">
            <p className="text-sm text-zinc-300 leading-relaxed whitespace-pre-line">
              {summary}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
