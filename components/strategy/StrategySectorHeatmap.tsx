'use client';

import { BarChart3 } from 'lucide-react';
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
import { formatDivergence } from '@/lib/api';
import type { StrategyData } from '@/types/dashboard';

type TooltipPayload = { value?: number; payload?: StrategyData['sectors'][number] };

function DivTooltip({ active, payload }: { active?: boolean; payload?: TooltipPayload[] }) {
  if (!active || !payload?.length) return null;
  const p = payload[0]?.payload;
  if (!p) return null;
  const v = typeof payload[0]?.value === 'number' ? payload[0].value : p.divergence;
  return (
    <div className="rounded-xl border border-zinc-700/60 bg-zinc-900/95 px-3 py-2 shadow-xl backdrop-blur-lg text-xs font-mono">
      <span className="text-zinc-300">{p.sector}</span>
      <span className={`ml-2.5 tabular-nums font-bold ${v >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
        {formatDivergence(v)}
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

  const chartHeight = Math.max(140, list.length * 28 + 30);

  return (
    <div className="bg-zinc-900/40 border border-zinc-800/50 rounded-2xl overflow-hidden">
      {/* Header */}
      <div className="px-5 py-3.5 border-b border-zinc-800/50 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <BarChart3 className="w-4 h-4 text-zinc-500" />
          <span className="text-xs font-medium text-zinc-400 uppercase tracking-wider">
            Sector Divergence
          </span>
          <div className="hidden sm:flex items-center gap-2 ml-3 text-[10px] font-mono text-zinc-600">
            <span className="flex items-center gap-1">
              <span className="h-2 w-2 rounded bg-emerald-500/60" />
              HIGH
            </span>
            <span className="flex items-center gap-1">
              <span className="h-2 w-2 rounded bg-red-500/60" />
              LOW
            </span>
          </div>
        </div>
        {data.topSector.name && (
          <div className="flex items-center gap-2 text-xs font-mono">
            <span className="h-2 w-2 rounded-full bg-emerald-500" />
            <span className="text-zinc-500">Spotlight:</span>
            <span className="text-emerald-400 font-bold">{data.topSector.name}</span>
          </div>
        )}
      </div>

      {/* Chart */}
      <div className="px-3 py-2" style={{ height: chartHeight }}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={list} layout="vertical" margin={{ top: 4, right: 12, left: 0, bottom: 4 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#18181b" horizontal={false} />
            <XAxis
              type="number"
              dataKey="divergence"
              tick={{ fill: '#3f3f46', fontSize: 10, fontFamily: 'monospace' }}
              tickLine={false}
              axisLine={false}
              domain={['auto', 'auto']}
            />
            <YAxis
              dataKey="sector"
              type="category"
              tick={{ fill: '#52525b', fontSize: 11, fontFamily: 'monospace' }}
              tickLine={false}
              axisLine={false}
              width={110}
            />
            <Tooltip content={<DivTooltip />} />
            <Bar dataKey="divergence" radius={[4, 4, 4, 4]} barSize={14}>
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
