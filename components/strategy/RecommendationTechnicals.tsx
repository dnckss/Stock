'use client';

import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { RSI_OVERSOLD, RSI_OVERBOUGHT } from '@/lib/strategyConstants';
import type { StrategyTechnicalIndicators, MacdSignal } from '@/types/dashboard';

const MACD_CONFIG: Record<
  MacdSignal,
  { icon: typeof TrendingUp; text: string; bg: string; border: string; label: string }
> = {
  bullish: { icon: TrendingUp, text: 'text-emerald-400', bg: 'bg-emerald-500/10', border: 'border-emerald-500/20', label: 'BULLISH' },
  bearish: { icon: TrendingDown, text: 'text-red-400', bg: 'bg-red-500/10', border: 'border-red-500/20', label: 'BEARISH' },
  neutral: { icon: Minus, text: 'text-zinc-400', bg: 'bg-zinc-700/20', border: 'border-zinc-700/30', label: 'NEUTRAL' },
};

function GaugeBar({
  label,
  value,
  zones,
  formatValue,
}: {
  label: string;
  value: number;
  zones?: { position: number; label: string }[];
  formatValue?: (v: number) => string;
}) {
  const pct = Math.max(0, Math.min(100, value));
  const color =
    pct < 30 ? 'bg-red-500' : pct > 70 ? 'bg-red-400' : pct > 55 ? 'bg-yellow-500' : 'bg-emerald-500';

  return (
    <div>
      <div className="flex items-center justify-between mb-1.5">
        <span className="text-[10px] font-mono text-zinc-500 uppercase tracking-wider">{label}</span>
        <span className="text-xs font-mono font-bold text-zinc-200 tabular-nums">
          {formatValue ? formatValue(value) : value.toFixed(1)}
        </span>
      </div>
      <div className="relative h-2 rounded-full bg-zinc-800 overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-700 ease-out ${color}`}
          style={{ width: `${pct}%` }}
        />
        {zones?.map((z) => (
          <div
            key={z.position}
            className="absolute top-0 h-full w-px bg-zinc-600/80"
            style={{ left: `${z.position}%` }}
          />
        ))}
      </div>
      {zones && zones.length > 0 && (
        <div className="relative h-3.5 mt-0.5">
          {zones.map((z) => (
            <span
              key={z.position}
              className="absolute text-[8px] font-mono text-zinc-600 -translate-x-1/2"
              style={{ left: `${z.position}%` }}
            >
              {z.label}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

export default function RecommendationTechnicals({
  indicators,
}: {
  indicators: StrategyTechnicalIndicators | null;
}) {
  if (!indicators) return null;
  const { rsi, bollingerPosition, macdSignal, macdHistogram } = indicators;
  const macdCfg = MACD_CONFIG[macdSignal];
  const MacdIcon = macdCfg.icon;

  const hasAny = rsi !== null || bollingerPosition !== null || macdSignal !== 'neutral' || macdHistogram !== null;
  if (!hasAny) return null;

  return (
    <div className="space-y-4">
      <span className="text-[10px] font-mono text-zinc-500 uppercase tracking-wider block">
        Technical Indicators
      </span>

      {rsi !== null && (
        <GaugeBar
          label="RSI"
          value={rsi}
          zones={[
            { position: RSI_OVERSOLD, label: `${RSI_OVERSOLD}` },
            { position: RSI_OVERBOUGHT, label: `${RSI_OVERBOUGHT}` },
          ]}
        />
      )}

      {bollingerPosition !== null && (
        <GaugeBar
          label="Bollinger"
          value={bollingerPosition}
          zones={[
            { position: 0, label: 'Lower' },
            { position: 50, label: 'Mid' },
            { position: 100, label: 'Upper' },
          ]}
          formatValue={(v) => `${v.toFixed(0)}%`}
        />
      )}

      {/* MACD */}
      <div>
        <div className="flex items-center justify-between mb-1.5">
          <span className="text-[10px] font-mono text-zinc-500 uppercase tracking-wider">MACD</span>
        </div>
        <div className="flex items-center gap-2.5">
          <span
            className={`inline-flex items-center gap-1.5 text-[10px] font-mono font-bold px-2.5 py-1 rounded-lg border ${macdCfg.bg} ${macdCfg.text} ${macdCfg.border}`}
          >
            <MacdIcon className="w-3 h-3" />
            {macdCfg.label}
          </span>
          {macdHistogram !== null && (
            <span className={`text-xs font-mono tabular-nums ${macdHistogram >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
              {macdHistogram >= 0 ? '+' : ''}{macdHistogram.toFixed(3)}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
