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
import { BarChart3 } from 'lucide-react';
import type { TimeSeriesPoint } from '@/types/dashboard';
import ChartTooltip from './ChartTooltip';

interface TimeSeriesChartProps {
  data: TimeSeriesPoint[];
}

export default function TimeSeriesChart({ data }: TimeSeriesChartProps) {
  return (
    <section className="w-full">
      <div className="relative overflow-hidden rounded-2xl border border-zinc-800/50 bg-zinc-900/80 p-6 transition-all duration-300 hover:-translate-y-1 hover:border-zinc-700/80">
        {/* Top highlight */}
        <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-zinc-700/60 to-transparent" />

        {/* Header */}
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <BarChart3 className="h-5 w-5 text-zinc-400" />
            <h2 className="text-lg font-bold text-zinc-100">
              가격 vs 심리 괴리 분석
            </h2>
          </div>
          <div className="flex items-center gap-5 text-sm text-zinc-500">
            <span className="flex items-center gap-2">
              <span className="h-2.5 w-2.5 rounded-full bg-blue-400" />
              주가 수익률
            </span>
            <span className="flex items-center gap-2">
              <span className="h-2.5 w-2.5 rounded-full bg-emerald-400" />
              뉴스 감성 점수
            </span>
          </div>
        </div>

        {/* Chart */}
        <div className="h-[350px] w-full sm:h-[400px]">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart
              data={data}
              margin={{ top: 5, right: 5, left: -20, bottom: 5 }}
            >
              <defs>
                <linearGradient
                  id="sentimentGradient"
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
                tick={{ fill: '#52525b', fontSize: 12 }}
                tickLine={false}
                axisLine={false}
                dy={8}
              />
              <YAxis
                stroke="transparent"
                tick={{ fill: '#52525b', fontSize: 12 }}
                tickLine={false}
                axisLine={false}
                domain={['dataMin - 5', 'dataMax + 5']}
              />
              <Tooltip
                content={<ChartTooltip />}
                cursor={{
                  stroke: '#3f3f46',
                  strokeWidth: 1,
                  strokeDasharray: '4 4',
                }}
              />
              <Area
                type="monotone"
                dataKey="sentiment"
                fill="url(#sentimentGradient)"
                stroke="#34d399"
                strokeWidth={2}
                name="뉴스 감성 점수"
                dot={false}
                activeDot={{
                  r: 4,
                  fill: '#34d399',
                  stroke: '#09090b',
                  strokeWidth: 2,
                }}
              />
              <Line
                type="monotone"
                dataKey="price"
                stroke="#60a5fa"
                strokeWidth={2.5}
                dot={false}
                activeDot={{
                  r: 4,
                  fill: '#60a5fa',
                  stroke: '#09090b',
                  strokeWidth: 2,
                }}
                name="주가 수익률"
              />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      </div>
    </section>
  );
}
