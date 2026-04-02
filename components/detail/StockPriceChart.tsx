'use client';

import { useCallback } from 'react';
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
  Customized,
} from 'recharts';
import { CHART_PERIODS } from '@/lib/constants';
import type { ChartBar, ChartPeriod } from '@/types/dashboard';

/* ── Colors (Korean: red=up, blue=down) ── */
const UP_COLOR = '#ef4444';
const DOWN_COLOR = '#3b82f6';
const FLAT_COLOR = '#52525b';

function isUp(bar: ChartBar): boolean {
  return bar.close >= bar.open;
}

function barColor(bar: ChartBar): string {
  if (bar.close > bar.open) return UP_COLOR;
  if (bar.close < bar.open) return DOWN_COLOR;
  return FLAT_COLOR;
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

/* ── Candlestick renderer via Customized ── */
function CandlestickRenderer(props: {
  formattedGraphicalItems?: Array<{
    props?: { data?: Array<{ x?: number; width?: number; payload?: ChartBar }> };
  }>;
  yAxisMap?: Record<string, { scale?: (v: number) => number }>;
}) {
  const { formattedGraphicalItems, yAxisMap } = props;
  const yAxis = yAxisMap?.price;
  if (!yAxis?.scale || !formattedGraphicalItems?.[0]?.props?.data) return null;

  const scale = yAxis.scale;
  const items = formattedGraphicalItems[0].props.data;

  return (
    <g>
      {items.map((item, idx) => {
        if (!item.payload || item.x == null || item.width == null) return null;
        const bar = item.payload;
        const x = item.x;
        const w = item.width;
        const cx = x + w / 2;

        const oY = scale(bar.open);
        const cY = scale(bar.close);
        const hY = scale(bar.high);
        const lY = scale(bar.low);
        const bodyTop = Math.min(oY, cY);
        const bodyH = Math.max(Math.abs(cY - oY), 1);
        const color = barColor(bar);
        const bodyW = Math.max(w - 2, 2);

        return (
          <g key={idx}>
            <line x1={cx} y1={hY} x2={cx} y2={lY} stroke={color} strokeWidth={1} />
            <rect
              x={x + (w - bodyW) / 2}
              y={bodyTop}
              width={bodyW}
              height={bodyH}
              fill={color}
              stroke={color}
              strokeWidth={0.5}
            />
          </g>
        );
      })}
    </g>
  );
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
        <span className="text-right font-bold" style={{ color }}>{formatPrice(bar.close)}</span>
      </div>
      <div className="mt-1 pt-1 border-t border-zinc-800 flex justify-between">
        <span className="text-zinc-500">등락</span>
        <span style={{ color }}>{changePct >= 0 ? '+' : ''}{changePct.toFixed(2)}%</span>
      </div>
      <div className="flex justify-between">
        <span className="text-zinc-500">거래량</span>
        <span className="text-zinc-400">{formatVolume(bar.volume)}</span>
      </div>
    </div>
  );
}

/* ── Current price label ── */
function CurrentPriceLabel({
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
  const lastBar = bars.length > 0 ? bars[bars.length - 1] : null;
  const firstBar = bars.length > 0 ? bars[0] : null;
  const currentPrice = lastBar?.close ?? 0;
  const priceIsUp = lastBar ? lastBar.close >= (firstBar?.open ?? lastBar.open) : true;

  const prices = bars.flatMap((b) => [b.high, b.low]);
  const pMin = prices.length > 0 ? Math.min(...prices) : 0;
  const pMax = prices.length > 0 ? Math.max(...prices) : 100;
  const pPad = (pMax - pMin) * 0.05 || 1;

  const candleRenderer = useCallback(
    (props: Record<string, unknown>) => <CandlestickRenderer {...(props as Parameters<typeof CandlestickRenderer>[0])} />,
    [],
  );

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
          {/* Candlestick */}
          <div className="h-[300px] px-1">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={bars} margin={{ top: 8, right: 60, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#18181b" horizontal vertical={false} />
                <XAxis dataKey="timestamp" hide />
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

                {lastBar && (
                  <ReferenceLine
                    yAxisId="price"
                    y={currentPrice}
                    stroke={priceIsUp ? UP_COLOR : DOWN_COLOR}
                    strokeDasharray="4 2"
                    strokeOpacity={0.4}
                    label={<CurrentPriceLabel price={currentPrice} up={priceIsUp} />}
                  />
                )}

                {/* Invisible bar to establish data mapping for Customized */}
                <Bar yAxisId="price" dataKey="high" fill="transparent" isAnimationActive={false} />
                <Customized component={candleRenderer} />
              </ComposedChart>
            </ResponsiveContainer>
          </div>

          {/* Volume */}
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
                <Bar
                  dataKey="volume"
                  barSize={bars.length > 100 ? 2 : bars.length > 50 ? 3 : 5}
                  isAnimationActive={false}
                >
                  {bars.map((bar, idx) => (
                    <Cell key={idx} fill={isUp(bar) ? `${UP_COLOR}99` : `${DOWN_COLOR}99`} />
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
