'use client';

import {
  ComposedChart,
  Bar,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { formatMarketCap } from '@/lib/api';

interface BarConfig {
  dataKey: string;
  name: string;
  color: string;
  yAxisId?: string;
}

interface LineConfig {
  dataKey: string;
  name: string;
  color: string;
  yAxisId?: string;
  unit?: string;
}

interface QuarterlyChartProps {
  // recharts는 dataKey 기반으로 프로퍼티에 접근 — 인터페이스 호환을 위해 object[] 사용
  data: object[];
  bars: BarConfig[];
  lines?: LineConfig[];
  xKey?: string;
  height?: number;
  rightAxisUnit?: string;
}

function ChartTooltipContent({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: Array<{ value: number; name: string; color: string; unit?: string }>;
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
          <span className="text-zinc-400 text-[10px]">{entry.name}</span>
          <span className="text-zinc-100 font-medium ml-auto tabular-nums">
            {typeof entry.value === 'number'
              ? Math.abs(entry.value) >= 1e6
                ? formatMarketCap(entry.value)
                : entry.value.toFixed(2)
              : '-'}
            {entry.unit ?? ''}
          </span>
        </div>
      ))}
    </div>
  );
}

export default function QuarterlyChart({
  data,
  bars,
  lines,
  xKey = 'label',
  height = 220,
  rightAxisUnit = '%',
}: QuarterlyChartProps) {
  if (data.length === 0) {
    return (
      <div
        className="flex items-center justify-center text-[10px] text-zinc-600 font-mono"
        style={{ height }}
      >
        차트 데이터 없음
      </div>
    );
  }

  const hasRightAxis = lines && lines.some((l) => l.yAxisId === 'right');

  return (
    <div style={{ height }} className="w-full">
      <ResponsiveContainer width="100%" height="100%">
        <ComposedChart
          data={data}
          margin={{ top: 8, right: hasRightAxis ? 8 : 0, left: -10, bottom: 0 }}
        >
          <CartesianGrid
            strokeDasharray="4 4"
            stroke="#27272a"
            vertical={false}
          />
          <XAxis
            dataKey={xKey}
            stroke="transparent"
            tick={{ fill: '#52525b', fontSize: 10 }}
            tickLine={false}
            axisLine={false}
            dy={4}
          />
          <YAxis
            yAxisId="left"
            stroke="transparent"
            tick={{ fill: '#52525b', fontSize: 10 }}
            tickLine={false}
            axisLine={false}
            tickFormatter={(v: number) =>
              Math.abs(v) >= 1e6 ? formatMarketCap(v) : String(v)
            }
          />
          {hasRightAxis && (
            <YAxis
              yAxisId="right"
              orientation="right"
              stroke="transparent"
              tick={{ fill: '#52525b', fontSize: 10 }}
              tickLine={false}
              axisLine={false}
              tickFormatter={(v: number) => `${v.toFixed(0)}${rightAxisUnit}`}
            />
          )}
          <Tooltip
            content={<ChartTooltipContent />}
            cursor={{
              stroke: '#3f3f46',
              strokeWidth: 1,
              strokeDasharray: '4 4',
            }}
          />
          {bars.map((bar) => (
            <Bar
              key={bar.dataKey}
              yAxisId={bar.yAxisId ?? 'left'}
              dataKey={bar.dataKey}
              name={bar.name}
              fill={bar.color}
              fillOpacity={0.8}
              radius={[3, 3, 0, 0]}
              maxBarSize={32}
            />
          ))}
          {lines?.map((line) => (
            <Line
              key={line.dataKey}
              yAxisId={line.yAxisId ?? 'left'}
              type="monotone"
              dataKey={line.dataKey}
              name={line.name}
              stroke={line.color}
              strokeWidth={2}
              dot={false}
              activeDot={{
                r: 3,
                fill: line.color,
                stroke: '#0a0a0a',
                strokeWidth: 2,
              }}
            />
          ))}
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
}
