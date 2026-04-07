'use client';

import {
  Cell,
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { STRATEGY_DIVERGENCE_BAR_ALPHA, STRATEGY_DIVERGENCE_COLOR_GREEN, STRATEGY_DIVERGENCE_COLOR_RED } from '@/lib/strategyConstants';
import { interpolateRgb, rgbaString } from '@/lib/utils';
import type { StrategyData } from '@/types/dashboard';

type TooltipPayload = { value?: number; payload?: StrategyData['sectors'][number] };

function formatSigned(v: number, d: number): string {
  const f = v.toFixed(d);
  return v >= 0 ? `+${f}` : f;
}

function DivTooltip({ active, payload }: { active?: boolean; payload?: TooltipPayload[] }) {
  if (!active || !payload?.length) return null;
  const p = payload[0]?.payload;
  if (!p) return null;
  const v = typeof payload[0]?.value === 'number' ? payload[0].value : p.divergence;
  return (
    <div className="rounded border border-zinc-700/60 bg-zinc-900/95 px-2 py-1 shadow-lg backdrop-blur text-[10px] font-mono">
      <span className="text-zinc-300">{p.sector}</span>
      <span className={`ml-2 tabular-nums ${v >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
        {formatSigned(v, 3)}
      </span>
    </div>
  );
}

export default function StrategySectorHeatmap({
  data,
}: {
  data: Pick<StrategyData, 'sectors' | 'topSector'>;
}) {
  const list = data.sectors;
  if (list.length === 0) return null;
  const divs = list.map((s) => s.divergence);
  const min = Math.min(...divs);
  const max = Math.max(...divs);

  const chartHeight = Math.max(120, list.length * 22 + 24);

  return (
    <div>
      {/* Header with spotlight inline */}
      <div className="px-3 py-1.5 bg-zinc-800/30 border-b border-zinc-800 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-[9px] font-mono font-bold text-zinc-500 uppercase tracking-widest">
            Sector Divergence
          </span>
          <span className="flex items-center gap-1 text-[8px] font-mono text-zinc-600">
            <span className="h-1.5 w-1.5 rounded-sm bg-emerald-500/60" /> HIGH
            <span className="h-1.5 w-1.5 rounded-sm bg-red-500/60 ml-1" /> LOW
          </span>
        </div>
        {data.topSector.name && (
          <div className="flex items-center gap-1.5 text-[9px] font-mono">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
            <span className="text-zinc-400">Spotlight:</span>
            <span className="text-emerald-400 font-bold">{data.topSector.name}</span>
          </div>
        )}
      </div>

      <div className="px-2 py-1" style={{ height: chartHeight }}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={list} layout="vertical" margin={{ top: 2, right: 8, left: 0, bottom: 2 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#18181b" horizontal={false} />
            <XAxis
              type="number"
              dataKey="divergence"
              tick={{ fill: '#3f3f46', fontSize: 9, fontFamily: 'monospace' }}
              tickLine={false}
              axisLine={false}
              domain={['auto', 'auto']}
            />
            <YAxis
              dataKey="sector"
              type="category"
              tick={{ fill: '#52525b', fontSize: 10, fontFamily: 'monospace' }}
              tickLine={false}
              axisLine={false}
              width={100}
            />
            <Tooltip content={<DivTooltip />} />
            <Bar dataKey="divergence" radius={[3, 3, 3, 3]} barSize={10}>
              {list.map((s, idx) => {
                const t = max === min ? 0.5 : (s.divergence - min) / (max - min);
                const c = interpolateRgb(STRATEGY_DIVERGENCE_COLOR_RED, STRATEGY_DIVERGENCE_COLOR_GREEN, t);
                return (
                  <Cell
                    key={`${s.sector}-${idx}`}
                    fill={rgbaString(c, STRATEGY_DIVERGENCE_BAR_ALPHA)}
                  />
                );
              })}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
