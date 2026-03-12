'use client';

import {
  ComposedChart,
  Area,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import type { ChartDataPoint } from '@/types/dashboard';

interface DivergenceChartProps {
  data: ChartDataPoint[];
}

function ChartTooltipContent({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: Array<{ value: number; name: string; color: string }>;
  label?: string;
}) {
  if (!active || !payload?.length) return null;

  return (
    <div className="bg-zinc-800/95 border border-zinc-700 rounded-lg px-3 py-2.5 text-xs shadow-xl backdrop-blur-sm">
      <p className="text-zinc-400 font-medium mb-2">{label}</p>
      {payload.map((entry, i) => (
        <div key={i} className="flex items-center gap-2 font-mono py-0.5">
          <div
            className="w-2 h-2 rounded-full shrink-0"
            style={{ background: entry.color }}
          />
          <span className="text-zinc-400">{entry.name}</span>
          <span className="text-zinc-100 font-medium ml-auto tabular-nums">
            {typeof entry.value === 'number'
              ? entry.value.toFixed(2)
              : entry.value}
          </span>
        </div>
      ))}
    </div>
  );
}

export default function DivergenceChart({ data }: DivergenceChartProps) {
  if (data.length === 0) return null;

  return (
    <section className="relative overflow-hidden rounded-xl border border-zinc-800 bg-zinc-900 p-6">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-zinc-700/60 to-transparent" />

      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <h2 className="text-lg font-bold text-zinc-100">
          수익률 vs 감성 괴리 분석
        </h2>
        <div className="flex items-center gap-5 text-xs text-zinc-500">
          <span className="flex items-center gap-2">
            <span className="h-2.5 w-2.5 rounded-full bg-blue-400" />
            5일 수익률 (%)
          </span>
          <span className="flex items-center gap-2">
            <span className="h-2.5 w-2.5 rounded-full bg-emerald-400" />
            뉴스 감성 점수
          </span>
        </div>
      </div>

      <div className="h-[350px] w-full sm:h-[400px]">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart
            data={data}
            margin={{ top: 5, right: 5, left: -10, bottom: 5 }}
          >
            <defs>
              <linearGradient
                id="detailSentimentGrad"
                x1="0"
                y1="0"
                x2="0"
                y2="1"
              >
                <stop offset="0%" stopColor="#34d399" stopOpacity={0.25} />
                <stop offset="100%" stopColor="#34d399" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid
              strokeDasharray="4 4"
              stroke="#27272a"
              vertical={false}
            />
            <XAxis
              dataKey="date"
              stroke="transparent"
              tick={{ fill: '#52525b', fontSize: 11 }}
              tickLine={false}
              axisLine={false}
              dy={8}
            />
            <YAxis
              yAxisId="price"
              stroke="transparent"
              tick={{ fill: '#52525b', fontSize: 11 }}
              tickLine={false}
              axisLine={false}
              domain={['auto', 'auto']}
              tickFormatter={(v: number) => `${v.toFixed(0)}%`}
            />
            <YAxis
              yAxisId="sentiment"
              orientation="right"
              stroke="transparent"
              tick={{ fill: '#52525b', fontSize: 11 }}
              tickLine={false}
              axisLine={false}
              domain={[-1, 1]}
              tickFormatter={(v: number) => v.toFixed(1)}
            />
            <Tooltip
              content={<ChartTooltipContent />}
              cursor={{
                stroke: '#3f3f46',
                strokeWidth: 1,
                strokeDasharray: '4 4',
              }}
            />
            <Area
              yAxisId="sentiment"
              type="monotone"
              dataKey="sentiment"
              fill="url(#detailSentimentGrad)"
              stroke="#34d399"
              strokeWidth={2}
              name="감성 점수"
              dot={false}
              activeDot={{
                r: 4,
                fill: '#34d399',
                stroke: '#09090b',
                strokeWidth: 2,
              }}
            />
            <Line
              yAxisId="price"
              type="monotone"
              dataKey="priceReturn"
              stroke="#60a5fa"
              strokeWidth={2.5}
              dot={false}
              activeDot={{
                r: 4,
                fill: '#60a5fa',
                stroke: '#09090b',
                strokeWidth: 2,
              }}
              name="5일 수익률 (%)"
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>
    </section>
  );
}
