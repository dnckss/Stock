'use client';

import { Loader2 } from 'lucide-react';
import {
  ComposedChart,
  Line,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { CHART_PERIODS } from '@/lib/constants';
import type { ChartBar, ChartPeriod } from '@/types/dashboard';

function formatTimestamp(ts: string, period: ChartPeriod): string {
  if (!ts) return '';
  try {
    const d = new Date(ts);
    if (period === '1D' || period === '5D') {
      return d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false });
    }
    return `${d.getMonth() + 1}/${d.getDate()}`;
  } catch {
    return ts.slice(5, 10);
  }
}

function ChartTooltip({
  active,
  payload,
  period,
}: {
  active?: boolean;
  payload?: Array<{ value?: number; dataKey?: string; payload?: ChartBar }>;
  period: ChartPeriod;
}) {
  if (!active || !payload?.length) return null;
  const bar = payload[0]?.payload;
  if (!bar) return null;
  return (
    <div className="rounded border border-zinc-700/60 bg-zinc-900/95 px-3 py-2 shadow-lg backdrop-blur text-[10px] font-mono space-y-0.5">
      <p className="text-zinc-400">{formatTimestamp(bar.timestamp, period)}</p>
      <p className="text-zinc-200">
        O {bar.open.toFixed(2)} · H {bar.high.toFixed(2)} · L {bar.low.toFixed(2)} · C{' '}
        <span className="font-bold text-zinc-100">{bar.close.toFixed(2)}</span>
      </p>
      <p className="text-zinc-500">Vol {(bar.volume / 1_000_000).toFixed(1)}M</p>
    </div>
  );
}

export default function StockPriceChart({
  bars,
  period,
  isLoading,
  onPeriodChange,
}: {
  bars: ChartBar[];
  period: ChartPeriod;
  isLoading: boolean;
  onPeriodChange: (p: ChartPeriod) => void;
}) {
  return (
    <div className="border-b border-zinc-800">
      {/* Period tabs */}
      <div className="px-4 py-1.5 flex items-center gap-1 border-b border-zinc-800/50">
        {CHART_PERIODS.map((p) => (
          <button
            key={p}
            type="button"
            onClick={() => onPeriodChange(p)}
            disabled={isLoading}
            className={`text-[10px] font-mono px-2 py-0.5 rounded transition-colors ${
              period === p
                ? 'bg-zinc-700 text-zinc-100'
                : 'text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800/50'
            } disabled:opacity-50`}
          >
            {p}
          </button>
        ))}
        {isLoading && <Loader2 className="w-3 h-3 text-zinc-600 animate-spin ml-2" />}
      </div>

      {/* Chart */}
      <div className="px-2 py-2 h-[280px] relative">
        {bars.length === 0 && !isLoading ? (
          <div className="h-full flex items-center justify-center">
            <span className="text-[10px] font-mono text-zinc-600">NO CHART DATA</span>
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={bars} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="volumeGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#3f3f46" stopOpacity={0.4} />
                  <stop offset="100%" stopColor="#3f3f46" stopOpacity={0.05} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#18181b" />
              <XAxis
                dataKey="timestamp"
                tick={{ fill: '#3f3f46', fontSize: 9, fontFamily: 'monospace' }}
                tickLine={false}
                axisLine={false}
                tickFormatter={(v: string) => formatTimestamp(v, period)}
                interval="preserveStartEnd"
              />
              <YAxis
                yAxisId="price"
                orientation="right"
                tick={{ fill: '#52525b', fontSize: 9, fontFamily: 'monospace' }}
                tickLine={false}
                axisLine={false}
                domain={['auto', 'auto']}
                tickFormatter={(v: number) => v.toFixed(0)}
                width={50}
              />
              <YAxis
                yAxisId="volume"
                orientation="left"
                tick={false}
                axisLine={false}
                tickLine={false}
                domain={[0, (max: number) => max * 4]}
                width={0}
              />
              <Tooltip content={<ChartTooltip period={period} />} />
              <Bar
                yAxisId="volume"
                dataKey="volume"
                fill="url(#volumeGrad)"
                radius={[1, 1, 0, 0]}
                barSize={3}
              />
              <Line
                yAxisId="price"
                type="monotone"
                dataKey="close"
                stroke="#60a5fa"
                strokeWidth={1.5}
                dot={false}
                activeDot={{ r: 3, fill: '#93c5fd' }}
              />
            </ComposedChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
}
