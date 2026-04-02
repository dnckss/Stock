'use client';

import { useMemo } from 'react';
import { Loader2 } from 'lucide-react';
import {
  ComposedChart,
  Line,
  Bar,
  ErrorBar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
  ReferenceLine,
} from 'recharts';
import { CHART_PERIODS } from '@/lib/constants';
import type { ChartBar, ChartPeriod } from '@/types/dashboard';

const UP_COLOR = '#ef4444';
const DOWN_COLOR = '#3b82f6';

function isUp(bar: ChartBar): boolean {
  return bar.close >= bar.open;
}

function barColor(bar: ChartBar): string {
  if (bar.close > bar.open) return UP_COLOR;
  if (bar.close < bar.open) return DOWN_COLOR;
  return '#52525b';
}

/* ── Preprocessed bar data for recharts stacking trick ── */
interface CandleData {
  timestamp: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
  // For candlestick via Bar: base + body height
  bodyBase: number;
  bodySize: number;
  // For ErrorBar: wick distances from body edges
  wickUp: number;
  wickDown: number;
  up: boolean;
  label: string;
}

function formatTimestamp(ts: string, period: ChartPeriod): string {
  if (!ts) return '';
  try {
    const d = new Date(ts);
    if (period === '1D' || period === '5D') {
      return d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false });
    }
    if (period === '1Y' || period === '5Y') {
      return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, '0')}`;
    }
    return `${d.getMonth() + 1}/${d.getDate()}`;
  } catch {
    return ts.slice(5, 10);
  }
}

function formatPrice(v: number): string {
  if (v >= 1000) return v.toLocaleString('en-US', { maximumFractionDigits: 0 });
  if (v >= 1) return v.toFixed(2);
  return v.toFixed(4);
}

function formatVolume(v: number): string {
  if (v >= 1_000_000_000) return `${(v / 1_000_000_000).toFixed(1)}B`;
  if (v >= 1_000_000) return `${(v / 1_000_000).toFixed(1)}M`;
  if (v >= 1_000) return `${(v / 1_000).toFixed(0)}K`;
  return String(v);
}

/* ── Tooltip ── */
function ChartTooltip({
  active,
  payload,
  period,
}: {
  active?: boolean;
  payload?: Array<{ payload?: CandleData }>;
  period: ChartPeriod;
}) {
  if (!active || !payload?.length) return null;
  const d = payload[0]?.payload;
  if (!d) return null;
  const color = d.up ? UP_COLOR : DOWN_COLOR;
  const changePct = d.open !== 0 ? ((d.close - d.open) / d.open) * 100 : 0;

  return (
    <div className="rounded-lg border border-zinc-700/60 bg-[#0a0a0a]/95 px-3 py-2 shadow-xl backdrop-blur text-[10px] font-mono">
      <p className="text-zinc-400 mb-1">{d.label}</p>
      <div className="grid grid-cols-2 gap-x-4 gap-y-0.5">
        <span className="text-zinc-500">시가</span>
        <span className="text-right text-zinc-300">{formatPrice(d.open)}</span>
        <span className="text-zinc-500">고가</span>
        <span className="text-right text-zinc-300">{formatPrice(d.high)}</span>
        <span className="text-zinc-500">저가</span>
        <span className="text-right text-zinc-300">{formatPrice(d.low)}</span>
        <span className="text-zinc-500">종가</span>
        <span className="text-right font-bold" style={{ color }}>{formatPrice(d.close)}</span>
      </div>
      <div className="mt-1 pt-1 border-t border-zinc-800 flex justify-between">
        <span className="text-zinc-500">등락</span>
        <span style={{ color }}>{changePct >= 0 ? '+' : ''}{changePct.toFixed(2)}%</span>
      </div>
      <div className="flex justify-between">
        <span className="text-zinc-500">거래량</span>
        <span className="text-zinc-400">{formatVolume(d.volume)}</span>
      </div>
    </div>
  );
}

/* ── Current price label ── */
function PriceLabel({
  viewBox,
  price,
  up,
}: {
  viewBox?: { x?: number; y?: number; width?: number };
  price: number;
  up: boolean;
}) {
  const vy = viewBox?.y ?? 0;
  const vw = viewBox?.width ?? 0;
  const vx = viewBox?.x ?? 0;
  const color = up ? UP_COLOR : DOWN_COLOR;
  return (
    <g>
      <rect x={vx + vw - 58} y={vy - 9} width={58} height={18} rx={3} fill={color} />
      <text x={vx + vw - 29} y={vy + 4} textAnchor="middle" fill="#fff" fontSize={10} fontFamily="monospace" fontWeight="bold">
        {formatPrice(price)}
      </text>
    </g>
  );
}

/* ── Main ── */
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
  const candleData: CandleData[] = useMemo(
    () =>
      bars.map((b) => {
        const up = b.close >= b.open;
        const bodyTop = Math.max(b.open, b.close);
        const bodyBot = Math.min(b.open, b.close);
        return {
          ...b,
          label: formatTimestamp(b.timestamp, period),
          up,
          bodyBase: bodyBot,
          bodySize: Math.max(bodyTop - bodyBot, (b.high - b.low) * 0.01),
          wickUp: b.high - bodyTop,
          wickDown: bodyBot - b.low,
        };
      }),
    [bars, period],
  );

  const lastBar = candleData.length > 0 ? candleData[candleData.length - 1] : null;
  const firstBar = candleData.length > 0 ? candleData[0] : null;
  const currentPrice = lastBar?.close ?? 0;
  const priceIsUp = lastBar ? lastBar.close >= (firstBar?.open ?? lastBar.open) : true;

  const prices = bars.flatMap((b) => [b.high, b.low]);
  const pMin = prices.length > 0 ? Math.min(...prices) : 0;
  const pMax = prices.length > 0 ? Math.max(...prices) : 100;
  const pPad = (pMax - pMin) * 0.06 || 1;

  const barWidth = bars.length > 120 ? 2 : bars.length > 60 ? 4 : bars.length > 30 ? 6 : 8;

  return (
    <div className="border-b border-zinc-800">
      {/* Period tabs */}
      <div className="px-3 py-1.5 flex items-center gap-1 border-b border-zinc-800/40">
        {CHART_PERIODS.map((p) => (
          <button
            key={p}
            type="button"
            onClick={() => onPeriodChange(p)}
            disabled={isLoading}
            className={`text-[10px] font-mono px-2.5 py-0.5 rounded transition-colors ${
              period === p ? 'bg-zinc-700 text-zinc-100' : 'text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800/50'
            } disabled:opacity-50`}
          >
            {p}
          </button>
        ))}
        {isLoading && <Loader2 className="w-3 h-3 text-zinc-600 animate-spin ml-2" />}
      </div>

      {bars.length === 0 && !isLoading ? (
        <div className="h-[380px] flex items-center justify-center">
          <span className="text-[10px] font-mono text-zinc-600">NO CHART DATA</span>
        </div>
      ) : (
        <div>
          {/* Candlestick + Line */}
          <div className="h-[320px] px-1">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={candleData} margin={{ top: 8, right: 60, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#18181b" horizontal vertical={false} />
                <XAxis dataKey="label" hide />
                <YAxis
                  yAxisId="price"
                  orientation="right"
                  tick={{ fill: '#52525b', fontSize: 9, fontFamily: 'monospace' }}
                  tickLine={false}
                  axisLine={false}
                  domain={[pMin - pPad, pMax + pPad]}
                  tickFormatter={(v: number) => formatPrice(v)}
                  width={58}
                />
                <Tooltip content={<ChartTooltip period={period} />} />

                {/* Current price line */}
                {lastBar && (
                  <ReferenceLine
                    yAxisId="price"
                    y={currentPrice}
                    stroke={priceIsUp ? UP_COLOR : DOWN_COLOR}
                    strokeDasharray="4 2"
                    strokeOpacity={0.4}
                    label={<PriceLabel price={currentPrice} up={priceIsUp} />}
                  />
                )}

                {/* Close price line (trend) */}
                <Line
                  yAxisId="price"
                  type="monotone"
                  dataKey="close"
                  stroke="#22c55e"
                  strokeWidth={1}
                  dot={false}
                  activeDot={false}
                  isAnimationActive={false}
                />

                {/* Candlestick body as stacked bar: invisible base + visible body */}
                <Bar yAxisId="price" dataKey="bodyBase" stackId="candle" fill="transparent" barSize={barWidth} isAnimationActive={false} />
                <Bar yAxisId="price" dataKey="bodySize" stackId="candle" barSize={barWidth} isAnimationActive={false}>
                  {candleData.map((d, idx) => {
                    const color = d.up ? UP_COLOR : DOWN_COLOR;
                    return (
                      <Cell
                        key={idx}
                        fill={d.up ? 'transparent' : color}
                        stroke={color}
                        strokeWidth={d.up ? 1.5 : 0}
                      />
                    );
                  })}
                  {/* Wicks via ErrorBar */}
                  <ErrorBar dataKey="wickUp" direction="y" stroke="#52525b" strokeWidth={0.8} width={0} />
                </Bar>
              </ComposedChart>
            </ResponsiveContainer>
          </div>

          {/* Volume */}
          <div className="h-[70px] px-1 border-t border-zinc-800/30">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={candleData} margin={{ top: 4, right: 60, left: 0, bottom: 0 }}>
                <XAxis
                  dataKey="label"
                  tick={{ fill: '#3f3f46', fontSize: 9, fontFamily: 'monospace' }}
                  tickLine={false}
                  axisLine={false}
                  interval="preserveStartEnd"
                />
                <YAxis
                  orientation="right"
                  tick={{ fill: '#3f3f46', fontSize: 8, fontFamily: 'monospace' }}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(v: number) => formatVolume(v)}
                  width={58}
                />
                <Bar dataKey="volume" barSize={barWidth} isAnimationActive={false}>
                  {candleData.map((d, idx) => (
                    <Cell key={idx} fill={d.up ? `${UP_COLOR}88` : `${DOWN_COLOR}88`} />
                  ))}
                </Bar>
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}
    </div>
  );
}
