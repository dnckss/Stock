'use client';

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
} from 'recharts';
import {
  PRICE_ENTRY_COLOR,
  PRICE_STOPLOSS_COLOR,
  PRICE_TARGET_COLOR,
} from '@/lib/strategyConstants';
import type { StrategyPriceLevel } from '@/types/dashboard';

function PriceTooltip({
  active,
  payload,
}: {
  active?: boolean;
  payload?: Array<{ value?: number; payload?: StrategyPriceLevel }>;
}) {
  if (!active || !payload?.length) return null;
  const p = payload[0];
  if (!p?.payload) return null;
  return (
    <div className="rounded-xl border border-zinc-700/60 bg-zinc-900/95 px-3 py-2 shadow-xl backdrop-blur-lg">
      <p className="text-[10px] font-mono text-zinc-400">{p.payload.date}</p>
      <p className="text-sm font-mono font-bold text-zinc-100 tabular-nums">
        ${typeof p.value === 'number' ? p.value.toFixed(2) : '-'}
      </p>
    </div>
  );
}

export default function RecommendationPriceChart({
  priceHistory,
  entryPrice,
  stopLoss,
  targetPrice,
}: {
  priceHistory: StrategyPriceLevel[];
  entryPrice: number | null;
  stopLoss: number | null;
  targetPrice: number | null;
}) {
  if (priceHistory.length === 0) {
    return (
      <div className="h-[180px] flex items-center justify-center rounded-xl bg-zinc-800/20 border border-zinc-800/40">
        <span className="text-xs font-mono text-zinc-600">NO PRICE DATA</span>
      </div>
    );
  }

  const prices = priceHistory.map((p) => p.close);
  const refLines = [entryPrice, stopLoss, targetPrice].filter((v): v is number => v !== null);
  const allValues = [...prices, ...refLines];
  const dataMin = Math.min(...allValues);
  const dataMax = Math.max(...allValues);
  const padding = (dataMax - dataMin) * 0.08 || 1;

  return (
    <div className="h-[180px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={priceHistory} margin={{ top: 8, right: 12, left: 0, bottom: 4 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#1c1c22" />
          <XAxis
            dataKey="date"
            tick={{ fill: '#3f3f46', fontSize: 10, fontFamily: 'monospace' }}
            tickLine={false}
            axisLine={false}
            interval="preserveStartEnd"
          />
          <YAxis
            domain={[dataMin - padding, dataMax + padding]}
            tick={{ fill: '#3f3f46', fontSize: 10, fontFamily: 'monospace' }}
            tickLine={false}
            axisLine={false}
            width={55}
            tickFormatter={(v: number) => `$${v.toFixed(0)}`}
          />
          <Tooltip content={<PriceTooltip />} />

          <Line
            type="monotone"
            dataKey="close"
            stroke="#71717a"
            strokeWidth={1.5}
            dot={false}
            activeDot={{ r: 4, fill: '#a1a1aa', strokeWidth: 0 }}
          />

          {entryPrice !== null && (
            <ReferenceLine
              y={entryPrice}
              stroke={PRICE_ENTRY_COLOR}
              strokeDasharray="6 3"
              label={{
                value: `Entry $${entryPrice.toFixed(1)}`,
                fill: PRICE_ENTRY_COLOR,
                fontSize: 10,
                position: 'right',
              }}
            />
          )}
          {stopLoss !== null && (
            <ReferenceLine
              y={stopLoss}
              stroke={PRICE_STOPLOSS_COLOR}
              strokeDasharray="6 3"
              label={{
                value: `S/L $${stopLoss.toFixed(1)}`,
                fill: PRICE_STOPLOSS_COLOR,
                fontSize: 10,
                position: 'left',
              }}
            />
          )}
          {targetPrice !== null && (
            <ReferenceLine
              y={targetPrice}
              stroke={PRICE_TARGET_COLOR}
              strokeDasharray="6 3"
              label={{
                value: `Target $${targetPrice.toFixed(1)}`,
                fill: PRICE_TARGET_COLOR,
                fontSize: 10,
                position: 'right',
              }}
            />
          )}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
