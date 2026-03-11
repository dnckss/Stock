'use client';

import { MOCK_TERMINAL_DATA } from '@/lib/constants';
import type { MacroIndicator, FearGreedData } from '@/types/dashboard';

const FEAR_GREED_LABELS: { min: number; label: string; color: string }[] = [
  { min: 75, label: 'Extreme Greed', color: 'text-green-400' },
  { min: 55, label: 'Greed', color: 'text-green-500' },
  { min: 45, label: 'Neutral', color: 'text-yellow-500' },
  { min: 25, label: 'Fear', color: 'text-orange-500' },
  { min: 0, label: 'Extreme Fear', color: 'text-red-500' },
];

function getFearGreedStyle(value: number) {
  return FEAR_GREED_LABELS.find((l) => value >= l.min) ?? FEAR_GREED_LABELS[FEAR_GREED_LABELS.length - 1];
}

function Sparkline({ data, positive }: { data: number[]; positive: boolean }) {
  if (data.length < 2) return null;

  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;
  const w = 64;
  const h = 20;

  const points = data
    .map((v, i) => {
      const x = (i / (data.length - 1)) * w;
      const y = h - ((v - min) / range) * (h - 4) - 2;
      return `${x},${y}`;
    })
    .join(' ');

  return (
    <svg width={w} height={h} className="shrink-0">
      <polyline
        points={points}
        fill="none"
        stroke={positive ? '#22c55e' : '#ef4444'}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function FearGreedGauge({ data }: { data: FearGreedData }) {
  const style = getFearGreedStyle(data.value);

  return (
    <div className="p-3 border-b border-zinc-800">
      <div className="text-[10px] font-medium text-zinc-500 uppercase tracking-wider mb-2">
        Fear & Greed Index
      </div>
      <div className="flex items-end gap-2 mb-2.5">
        <span className="text-2xl font-mono font-bold text-zinc-100 leading-none tabular-nums">
          {data.value}
        </span>
        <span className={`text-xs font-semibold ${style.color} mb-0.5`}>
          {style.label}
        </span>
      </div>
      <div className="h-1.5 rounded-full bg-zinc-800 overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-700"
          style={{
            width: `${data.value}%`,
            background: 'linear-gradient(90deg, #ef4444 0%, #f97316 30%, #eab308 50%, #22c55e 100%)',
          }}
        />
      </div>
      <div className="flex justify-between mt-1">
        <span className="text-[8px] text-zinc-600">Extreme Fear</span>
        <span className="text-[8px] text-zinc-600">Extreme Greed</span>
      </div>
    </div>
  );
}

function MacroItem({ data }: { data: MacroIndicator }) {
  const isPositive = data.change >= 0;

  return (
    <div className="flex items-center justify-between py-2.5 px-3 hover:bg-zinc-800/30 transition-colors">
      <div className="flex-1 min-w-0">
        <div className="text-[9px] text-zinc-500 uppercase tracking-wider font-medium">
          {data.label}
        </div>
        <div className="flex items-baseline gap-2 mt-0.5">
          <span className="font-mono text-sm font-semibold text-zinc-100 tabular-nums">
            {data.value}
          </span>
          <span
            className={`font-mono text-[10px] font-medium ${
              isPositive ? 'text-green-500' : 'text-red-500'
            }`}
          >
            {data.changeLabel}
          </span>
        </div>
      </div>
      <Sparkline data={data.sparkline} positive={isPositive} />
    </div>
  );
}

export default function MacroIndicators() {
  const { macroIndicators, fearGreed } = MOCK_TERMINAL_DATA;

  return (
    <div className="h-full flex flex-col bg-zinc-900 border-r border-zinc-800">
      <div className="px-3 py-2 border-b border-zinc-800">
        <h2 className="text-[10px] font-semibold text-zinc-400 uppercase tracking-widest">
          Macro Overview
        </h2>
      </div>
      <FearGreedGauge data={fearGreed} />
      <div className="flex-1 overflow-y-auto terminal-scroll divide-y divide-zinc-800/50">
        {macroIndicators.map((indicator) => (
          <MacroItem key={indicator.id} data={indicator} />
        ))}
      </div>
    </div>
  );
}
