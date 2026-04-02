'use client';

import { Loader2 } from 'lucide-react';
import {
  ComposedChart,
  Bar,
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

/* ── Colors (Korean style: red=up, blue=down) ── */
const UP_COLOR = '#ef4444';    // red
const DOWN_COLOR = '#3b82f6';  // blue
const FLAT_COLOR = '#52525b';  // zinc

function isUp(bar: ChartBar): boolean {
  return bar.close >= bar.open;
}

function barColor(bar: ChartBar): string {
  if (bar.close > bar.open) return UP_COLOR;
  if (bar.close < bar.open) return DOWN_COLOR;
  return FLAT_COLOR;
}

/* ── Candlestick custom shape ── */
function CandlestickShape(props: {
  x?: number;
  y?: number;
  width?: number;
  height?: number;
  payload?: ChartBar;
  yAxis?: { scale: (v: number) => number };
}) {
  const { x = 0, width = 0, payload, yAxis } = props;
  if (!payload || !yAxis?.scale) return null;

  const scale = yAxis.scale;
  const o = scale(payload.open);
  const c = scale(payload.close);
  const h = scale(payload.high);
  const l = scale(payload.low);

  const bodyTop = Math.min(o, c);
  const bodyBottom = Math.max(o, c);
  const bodyHeight = Math.max(bodyBottom - bodyTop, 1);
  const color = barColor(payload);
  const cx = x + width / 2;

  return (
    <g>
      {/* Wick (high-low line) */}
      <line x1={cx} y1={h} x2={cx} y2={l} stroke={color} strokeWidth={1} />
      {/* Body */}
      <rect
        x={x + 1}
        y={bodyTop}
        width={Math.max(width - 2, 2)}
        height={bodyHeight}
        fill={isUp(payload) ? color : color}
        stroke={color}
        strokeWidth={0.5}
      />
    </g>
  );
}

/* ── Format helpers ── */
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
  payload?: Array<{ payload?: ChartBar }>;
  period: ChartPeriod;
}) {
  if (!active || !payload?.length) return null;
  const bar = payload[0]?.payload;
  if (!bar) return null;
  const color = barColor(bar);
  const changePct = bar.open !== 0 ? ((bar.close - bar.open) / bar.open) * 100 : 0;

  return (
    <div className="rounded-lg border border-zinc-700/60 bg-[#0a0a0a]/95 px-3 py-2 shadow-xl backdrop-blur text-[10px] font-mono">
      <p className="text-zinc-400 mb-1">{formatTimestamp(bar.timestamp, period)}</p>
      <div className="grid grid-cols-2 gap-x-4 gap-y-0.5">
        <span className="text-zinc-500">시가</span>
        <span className="text-right text-zinc-300">{formatPrice(bar.open)}</span>
        <span className="text-zinc-500">고가</span>
        <span className="text-right text-zinc-300">{formatPrice(bar.high)}</span>
        <span className="text-zinc-500">저가</span>
        <span className="text-right text-zinc-300">{formatPrice(bar.low)}</span>
        <span className="text-zinc-500">종가</span>
        <span className="text-right font-bold" style={{ color }}>
          {formatPrice(bar.close)}
        </span>
      </div>
      <div className="mt-1 pt-1 border-t border-zinc-800 flex justify-between">
        <span className="text-zinc-500">등락</span>
        <span style={{ color }}>
          {changePct >= 0 ? '+' : ''}{changePct.toFixed(2)}%
        </span>
      </div>
      <div className="flex justify-between">
        <span className="text-zinc-500">거래량</span>
        <span className="text-zinc-400">{formatVolume(bar.volume)}</span>
      </div>
    </div>
  );
}

/* ── Current price label on Y axis ── */
function CurrentPriceLabel({
  viewBox,
  price,
  isUp: up,
}: {
  viewBox?: { x?: number; y?: number; width?: number };
  price: number;
  isUp: boolean;
}) {
  const vx = viewBox?.x ?? 0;
  const vy = viewBox?.y ?? 0;
  const vw = viewBox?.width ?? 0;
  const color = up ? UP_COLOR : DOWN_COLOR;

  return (
    <g>
      <rect
        x={vx + vw - 58}
        y={vy - 9}
        width={58}
        height={18}
        rx={3}
        fill={color}
      />
      <text
        x={vx + vw - 29}
        y={vy + 4}
        textAnchor="middle"
        fill="#fff"
        fontSize={10}
        fontFamily="monospace"
        fontWeight="bold"
      >
        {formatPrice(price)}
      </text>
    </g>
  );
}

/* ── Main component ── */
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
  const lastBar = bars.length > 0 ? bars[bars.length - 1] : null;
  const firstBar = bars.length > 0 ? bars[0] : null;
  const currentPrice = lastBar?.close ?? 0;
  const priceIsUp = lastBar ? lastBar.close >= (firstBar?.open ?? lastBar.open) : true;

  // Compute price domain with padding
  const prices = bars.flatMap((b) => [b.high, b.low]);
  const pMin = prices.length > 0 ? Math.min(...prices) : 0;
  const pMax = prices.length > 0 ? Math.max(...prices) : 100;
  const pPad = (pMax - pMin) * 0.05 || 1;

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

      {bars.length === 0 && !isLoading ? (
        <div className="h-[380px] flex items-center justify-center">
          <span className="text-[10px] font-mono text-zinc-600">NO CHART DATA</span>
        </div>
      ) : (
        <div>
          {/* Candlestick chart */}
          <div className="h-[300px] px-1">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={bars} margin={{ top: 8, right: 60, left: 0, bottom: 0 }}>
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="#18181b"
                  horizontal
                  vertical={false}
                />
                <XAxis
                  dataKey="timestamp"
                  tick={{ fill: '#3f3f46', fontSize: 9, fontFamily: 'monospace' }}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(v: string) => formatTimestamp(v, period)}
                  interval="preserveStartEnd"
                  hide
                />
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

                {/* Current price reference line */}
                {lastBar && (
                  <ReferenceLine
                    yAxisId="price"
                    y={currentPrice}
                    stroke={priceIsUp ? UP_COLOR : DOWN_COLOR}
                    strokeDasharray="4 2"
                    strokeOpacity={0.5}
                    label={
                      <CurrentPriceLabel price={currentPrice} isUp={priceIsUp} />
                    }
                  />
                )}

                {/* Candlestick bodies via Bar + custom shape */}
                <Bar
                  yAxisId="price"
                  dataKey="high"
                  shape={<CandlestickShape />}
                  isAnimationActive={false}
                />
              </ComposedChart>
            </ResponsiveContainer>
          </div>

          {/* Volume chart (separate) */}
          <div className="h-[80px] px-1 border-t border-zinc-800/30">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={bars} margin={{ top: 4, right: 60, left: 0, bottom: 0 }}>
                <XAxis
                  dataKey="timestamp"
                  tick={{ fill: '#3f3f46', fontSize: 9, fontFamily: 'monospace' }}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(v: string) => formatTimestamp(v, period)}
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
                <Bar dataKey="volume" barSize={bars.length > 100 ? 2 : bars.length > 50 ? 3 : 5} isAnimationActive={false}>
                  {bars.map((bar, idx) => (
                    <Cell
                      key={idx}
                      fill={isUp(bar) ? `${UP_COLOR}99` : `${DOWN_COLOR}99`}
                    />
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
