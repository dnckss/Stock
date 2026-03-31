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
import type { StrategyData } from '@/types/dashboard';

type DivergenceTooltipPayload = {
  value?: number;
  payload?: StrategyData['sectors'][number];
};

function formatSigned(value: number, digits: number): string {
  const fixed = value.toFixed(digits);
  return value >= 0 ? `+${fixed}` : fixed;
}

function interpolateColor(
  low: { r: number; g: number; b: number },
  high: { r: number; g: number; b: number },
  t: number,
): { r: number; g: number; b: number } {
  const clamped = Math.max(0, Math.min(1, t));
  return {
    r: Math.round(low.r + (high.r - low.r) * clamped),
    g: Math.round(low.g + (high.g - low.g) * clamped),
    b: Math.round(low.b + (high.b - low.b) * clamped),
  };
}

function DivergenceTooltip({
  active,
  payload,
}: {
  active?: boolean;
  payload?: DivergenceTooltipPayload[];
}) {
  if (!active || !payload?.length) return null;
  const first = payload[0];
  const raw = first?.payload;
  if (!raw) return null;

  const divergence = typeof first?.value === 'number' ? first.value : raw.divergence;
  const sector = raw.sector;
  const signClass = divergence >= 0 ? 'text-emerald-400' : 'text-red-400';

  return (
    <div className="rounded-lg border border-zinc-700/60 bg-zinc-900/95 px-3 py-2 shadow-xl backdrop-blur-xl">
      <div className="flex items-center justify-between gap-4">
        <p className="text-[11px] font-mono text-zinc-300">{sector}</p>
        <p className={`text-[11px] font-mono font-bold tabular-nums ${signClass}`}>
          {formatSigned(divergence, 3)}
        </p>
      </div>
      <div className="mt-1 text-[9px] font-mono text-zinc-600">AVG DIVERGENCE</div>
    </div>
  );
}

export default function StrategySectorHeatmap({
  data,
}: {
  data: Pick<StrategyData, 'sectors' | 'topSector'>;
}) {
  const sectorList = data.sectors;
  if (sectorList.length === 0) return null;
  const divergences = sectorList.map((s) => s.divergence);
  const min = Math.min(...divergences);
  const max = Math.max(...divergences);

  return (
    <section className="rounded-lg border border-zinc-800 bg-zinc-900/40 overflow-hidden">
      <div className="flex flex-col lg:flex-row">
        {/* Chart area */}
        <div className="flex-1 border-r border-zinc-800">
          <div className="px-4 py-2 bg-zinc-800/40 border-b border-zinc-800 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
              <h2 className="text-[10px] font-mono font-bold text-zinc-400 uppercase tracking-widest">
                Sector Divergence
              </h2>
            </div>
            <div className="flex items-center gap-3 text-[9px] font-mono text-zinc-600">
              <span className="flex items-center gap-1">
                <span className="h-2 w-2 rounded-sm bg-emerald-500/60" />
                HIGH
              </span>
              <span className="flex items-center gap-1">
                <span className="h-2 w-2 rounded-sm bg-red-500/60" />
                LOW
              </span>
            </div>
          </div>

          <div className="p-4">
            <div className="h-[320px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={sectorList}
                  layout="vertical"
                  margin={{ top: 4, right: 16, left: 0, bottom: 4 }}
                >
                  <defs>
                    <linearGradient id="divergenceGrid" x1="0" y1="0" x2="1" y2="0">
                      <stop offset="0%" stopColor="#22c55e" stopOpacity={0.08} />
                      <stop offset="100%" stopColor="#ef4444" stopOpacity={0.08} />
                    </linearGradient>
                  </defs>

                  <CartesianGrid
                    strokeDasharray="4 4"
                    stroke="url(#divergenceGrid)"
                    horizontal={false}
                  />

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
                    tick={{ fill: '#71717a', fontSize: 11, fontFamily: 'monospace' }}
                    tickLine={false}
                    axisLine={false}
                    width={120}
                  />

                  <Tooltip content={<DivergenceTooltip />} />

                  <Bar
                    dataKey="divergence"
                    radius={[4, 4, 4, 4]}
                    barSize={12}
                  >
                    {sectorList.map((s, idx) => {
                      const t = max === min ? 0.5 : (s.divergence - min) / (max - min);
                      const c = interpolateColor(
                        STRATEGY_DIVERGENCE_COLOR_RED,
                        STRATEGY_DIVERGENCE_COLOR_GREEN,
                        t,
                      );
                      const fill = `rgba(${c.r}, ${c.g}, ${c.b}, ${STRATEGY_DIVERGENCE_BAR_ALPHA})`;
                      return <Cell key={`${s.sector}-${idx}`} fill={fill} />;
                    })}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* AI Spotlight sidebar */}
        <aside className="w-full lg:w-[320px] flex flex-col">
          <div className="px-4 py-2 bg-zinc-800/40 border-b border-zinc-800 flex items-center gap-2">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
            <h3 className="text-[10px] font-mono font-bold text-zinc-400 uppercase tracking-widest">
              AI Spotlight
            </h3>
          </div>
          <div className="p-4 flex-1">
            <div className="mb-3">
              <span className="text-[9px] font-mono text-zinc-600 uppercase">Top Sector</span>
              <h3 className="text-lg font-bold text-zinc-100 font-mono mt-0.5">
                {data.topSector.name}
              </h3>
            </div>
            <div className="rounded-lg border border-zinc-800/50 bg-zinc-950/30 p-3">
              <span className="text-[9px] font-mono text-zinc-600 uppercase">Reason</span>
              <p className="text-xs text-zinc-300 leading-relaxed mt-1 whitespace-pre-line">
                {data.topSector.reason}
              </p>
            </div>
          </div>
        </aside>
      </div>
    </section>
  );
}
