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
    <div className="border-b border-zinc-800">
      {/* Header */}
      <div className="px-3 py-1.5 bg-zinc-800/30 flex items-center justify-between">
        <span className="text-[9px] font-mono font-bold text-zinc-500 uppercase tracking-widest">
          Market Overview
        </span>
        {regimeCfg && (
          <span className={`text-[9px] font-mono font-bold px-1.5 py-px rounded ${regimeCfg.bg} ${regimeCfg.text}`}>
            {regimeCfg.label}
          </span>
        )}
      </div>

      {/* Fear & Greed */}
      {fearGreed !== null && fgStyle && (
        <div className="px-3 py-2 border-b border-zinc-800/40">
          <div className="flex items-center justify-between mb-1">
            <span className="text-[8px] font-mono text-zinc-600 uppercase">Fear &amp; Greed</span>
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-mono font-bold text-zinc-100 tabular-nums">{fearGreed}</span>
              <span className={`text-[9px] font-mono ${fgStyle.color}`}>{fgStyle.label}</span>
            </div>
          </div>
          <div className="h-1 rounded-full bg-zinc-800 overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-700"
              style={{
                width: `${fearGreed}%`,
                background: 'linear-gradient(90deg, #ef4444 0%, #f97316 30%, #eab308 50%, #22c55e 100%)',
              }}
            />
          </div>
        </div>
      )}

      {/* Briefing */}
      <div className="px-3 py-2">
        <p className="text-[11px] text-zinc-300 leading-relaxed whitespace-pre-line">
          {summary}
        </p>
      </div>
    </div>
  );
}
