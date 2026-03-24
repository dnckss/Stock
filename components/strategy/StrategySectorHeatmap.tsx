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

  const color = divergence >= 0 ? '#34d399' : '#f87171';

  return (
    <div className="rounded-xl border border-zinc-700/50 bg-zinc-900/90 px-4 py-3 shadow-2xl shadow-black/50 backdrop-blur-xl">
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <span className="h-2 w-2 rounded-full" style={{ backgroundColor: color }} />
          <p className="text-xs font-medium text-zinc-300">{sector}</p>
        </div>
        <p className={`text-xs font-mono tabular-nums ${signClass}`}>
          {formatSigned(divergence, 3)}
        </p>
      </div>
      <div className="mt-2 text-[10px] text-zinc-500">평균 괴리율(Divergence)</div>
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
    <section className="rounded-2xl border border-zinc-800/50 bg-zinc-900/60 backdrop-blur-xl p-6">
      <div className="flex flex-col lg:flex-row gap-4">
        <div className="flex-1 rounded-xl border border-zinc-800/50 bg-zinc-950/20 p-4 relative overflow-hidden">
          <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-zinc-700/60 to-transparent" />
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-base font-bold text-zinc-100">Sector Heatmap</h2>
              <p className="text-xs text-zinc-500">평균 괴리율에 따른 섹터 민감도</p>
            </div>
            <div className="flex items-center gap-2 text-[10px] text-zinc-500">
              <span className="flex items-center gap-2">
                <span className="h-2.5 w-2.5 rounded-full bg-emerald-400" />
                High
              </span>
              <span className="text-zinc-700">/</span>
              <span className="flex items-center gap-2">
                <span className="h-2.5 w-2.5 rounded-full bg-red-400" />
                Low
              </span>
            </div>
          </div>

          <div className="h-[340px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={sectorList}
                layout="vertical"
                margin={{ top: 10, right: 20, left: 0, bottom: 10 }}
              >
                <defs>
                  <linearGradient id="divergenceGrid" x1="0" y1="0" x2="1" y2="0">
                    <stop offset="0%" stopColor="#22c55e" stopOpacity={0.12} />
                    <stop offset="100%" stopColor="#ef4444" stopOpacity={0.12} />
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
                  tick={{ fill: '#52525b', fontSize: 12 }}
                  tickLine={false}
                  axisLine={false}
                  domain={['auto', 'auto']}
                  label={{
                    value: '평균 괴리율(Divergence)',
                    position: 'bottom',
                    fill: '#71717a',
                    fontSize: 11,
                  }}
                />
                <YAxis
                  dataKey="sector"
                  type="category"
                  tick={{ fill: '#52525b', fontSize: 12 }}
                  tickLine={false}
                  axisLine={false}
                  width={130}
                />

                <Tooltip content={<DivergenceTooltip />} />

                <Bar
                  dataKey="divergence"
                  radius={[10, 10, 10, 10]}
                  barSize={14}
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

        <aside className="w-full lg:w-[360px] rounded-xl border border-zinc-800/50 bg-zinc-950/20 p-4 relative overflow-hidden">
          <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-zinc-700/60 to-transparent" />
          <div className="flex items-start gap-3">
            <div className="h-10 w-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
              <span className="h-2 w-2 rounded-full bg-emerald-400" />
            </div>
            <div>
              <p className="text-[10px] text-zinc-500 font-mono uppercase tracking-wider">
                AI Spotlight
              </p>
              <h3 className="mt-1 text-base font-bold text-zinc-100">
                {data.topSector.name}
              </h3>
            </div>
          </div>

          <div className="mt-4 rounded-xl border border-zinc-800/50 bg-zinc-900/40 p-4">
            <p className="text-xs text-zinc-400 mb-2">Reason</p>
            <p className="text-sm text-zinc-200 leading-relaxed whitespace-pre-line line-clamp-6">
              {data.topSector.reason}
            </p>
          </div>

          <div className="mt-4 text-[10px] text-zinc-600 font-mono">
            업데이트: 실시간 추정치
          </div>
        </aside>
      </div>
    </section>
  );
}

