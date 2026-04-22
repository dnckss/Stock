'use client';

import { useState } from 'react';
import { RefreshCw, TrendingUp, TrendingDown, Target, BarChart3, AlertTriangle } from 'lucide-react';
import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  ResponsiveContainer, Tooltip, Cell,
} from 'recharts';
import { useBacktest } from '@/hooks/useBacktest';
import { BACKTEST_HORIZON_LABELS } from '@/lib/constants';
import { cn } from '@/lib/utils';
import type { BacktestHorizonResult, BacktestDirectionRow, BacktestBucketRow } from '@/types/dashboard';

/* ── Helpers ── */

function pct(v: number): string { return `${(v * 100).toFixed(2)}%`; }
function pctSigned(v: number): string { const s = (v * 100).toFixed(2); return v >= 0 ? `+${s}%` : `${s}%`; }

/* ── Tooltip components ── */

type EquityPayload = { payload?: { date: string; cumulative_return: number }; value?: number };

function EquityTooltip({ active, payload }: { active?: boolean; payload?: EquityPayload[] }) {
  if (!active || !payload?.length) return null;
  const d = payload[0]?.payload;
  if (!d) return null;
  return (
    <div className="rounded-lg border border-zinc-700/60 bg-zinc-900/95 px-3 py-2 shadow-xl backdrop-blur-lg text-xs font-mono">
      <p className="text-zinc-400">{d.date}</p>
      <p className={`font-bold ${d.cumulative_return >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
        {pctSigned(d.cumulative_return)}
      </p>
    </div>
  );
}

type BarPayload = { payload?: { name: string; value: number; count: number; winRate: number }; value?: number };

function BucketTooltip({ active, payload }: { active?: boolean; payload?: BarPayload[] }) {
  if (!active || !payload?.length) return null;
  const d = payload[0]?.payload;
  if (!d) return null;
  return (
    <div className="rounded-lg border border-zinc-700/60 bg-zinc-900/95 px-3 py-2 shadow-xl backdrop-blur-lg text-xs font-mono">
      <p className="text-zinc-300 font-bold">{d.name}</p>
      <p className="text-zinc-500">수익률 <span className={d.value >= 0 ? 'text-emerald-400' : 'text-red-400'}>{pctSigned(d.value / 100)}</span></p>
      <p className="text-zinc-500">승률 <span className="text-zinc-300">{d.winRate.toFixed(1)}%</span></p>
      <p className="text-zinc-600">{d.count}건</p>
    </div>
  );
}

/* ── Stat card ── */

function StatCard({ label, value, sub, positive }: { label: string; value: string; sub?: string; positive?: boolean }) {
  return (
    <div className="bg-zinc-900/50 border border-zinc-800/50 rounded-xl px-3 py-2.5">
      <span className="text-[9px] font-mono text-zinc-600 uppercase block mb-1">{label}</span>
      <span className={cn('text-base font-mono font-bold tabular-nums', positive == null ? 'text-zinc-100' : positive ? 'text-emerald-400' : 'text-red-400')}>
        {value}
      </span>
      {sub && <span className="text-[9px] font-mono text-zinc-600 block mt-0.5">{sub}</span>}
    </div>
  );
}

/* ── Equity curve chart ── */

function EquityCurveChart({ equity }: { equity: BacktestHorizonResult['equity'] }) {
  if (equity.curve.length === 0) return null;

  return (
    <div className="bg-zinc-900/50 border border-zinc-800/50 rounded-xl overflow-hidden">
      <div className="px-3 py-2 border-b border-zinc-800/40 flex items-center gap-2">
        <TrendingUp className="w-3.5 h-3.5 text-zinc-500" />
        <span className="text-[10px] font-mono text-zinc-500 uppercase">Equity Curve</span>
      </div>
      <div className="px-2 py-2 h-[180px]">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={equity.curve} margin={{ top: 4, right: 8, left: 0, bottom: 4 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#1c1c22" />
            <XAxis
              dataKey="date"
              tick={{ fill: '#3f3f46', fontSize: 9, fontFamily: 'monospace' }}
              tickLine={false} axisLine={false} interval="preserveStartEnd"
            />
            <YAxis
              tick={{ fill: '#3f3f46', fontSize: 9, fontFamily: 'monospace' }}
              tickLine={false} axisLine={false} width={50}
              tickFormatter={(v: number) => `${(v * 100).toFixed(0)}%`}
            />
            <Tooltip content={<EquityTooltip />} />
            <Line
              type="monotone" dataKey="cumulative_return"
              stroke="#10b981" strokeWidth={1.5} dot={false}
              activeDot={{ r: 3, fill: '#10b981', strokeWidth: 0 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

/* ── Direction / bucket bar chart ── */

function BucketBarChart({
  title,
  icon: Icon,
  rows,
  nameKey = 'direction',
}: {
  title: string;
  icon: React.ElementType;
  rows: (BacktestDirectionRow | BacktestBucketRow)[];
  nameKey?: string;
}) {
  if (rows.length === 0) return null;

  const data = rows.map((r) => ({
    name: 'direction' in r ? r.direction : 'bucket' in r ? r.bucket : String(nameKey),
    value: r.avg_return * 100,
    count: r.count,
    winRate: r.win_rate * 100,
  }));

  const chartHeight = Math.max(100, data.length * 36 + 24);

  return (
    <div className="bg-zinc-900/50 border border-zinc-800/50 rounded-xl overflow-hidden">
      <div className="px-3 py-2 border-b border-zinc-800/40 flex items-center gap-2">
        <Icon className="w-3.5 h-3.5 text-zinc-500" />
        <span className="text-[10px] font-mono text-zinc-500 uppercase">{title}</span>
      </div>
      <div className="px-2 py-2" style={{ height: chartHeight }}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} layout="vertical" margin={{ top: 2, right: 12, left: 0, bottom: 2 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#18181b" horizontal={false} />
            <XAxis
              type="number"
              tick={{ fill: '#3f3f46', fontSize: 9, fontFamily: 'monospace' }}
              tickLine={false} axisLine={false}
              tickFormatter={(v: number) => `${v.toFixed(1)}%`}
            />
            <YAxis
              dataKey="name" type="category"
              tick={{ fill: '#71717a', fontSize: 10, fontFamily: 'monospace' }}
              tickLine={false} axisLine={false} width={80}
            />
            <Tooltip content={<BucketTooltip />} />
            <Bar dataKey="value" radius={[3, 3, 3, 3]} barSize={12}>
              {data.map((d, i) => (
                <Cell key={i} fill={d.value >= 0 ? '#10b981' : '#ef4444'} fillOpacity={0.7} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

/* ── Top tickers table ── */

function TopTickersTable({ tickers }: { tickers: BacktestHorizonResult['top_tickers'] }) {
  if (tickers.length === 0) return null;

  return (
    <div className="bg-zinc-900/50 border border-zinc-800/50 rounded-xl overflow-hidden">
      <div className="px-3 py-2 border-b border-zinc-800/40 flex items-center gap-2">
        <Target className="w-3.5 h-3.5 text-zinc-500" />
        <span className="text-[10px] font-mono text-zinc-500 uppercase">Top Tickers</span>
      </div>
      <div className="divide-y divide-zinc-800/30 max-h-[200px] overflow-y-auto">
        {tickers.slice(0, 10).map((t) => (
          <div key={t.ticker} className="px-3 py-1.5 flex items-center gap-3">
            <span className="w-[50px] text-[11px] font-mono font-bold text-zinc-100">{t.ticker}</span>
            <span className="flex-1 text-[10px] font-mono text-zinc-500 tabular-nums">{t.count}건</span>
            <span className="text-[10px] font-mono text-zinc-400 tabular-nums">{pct(t.win_rate)}</span>
            <span className={cn('text-[10px] font-mono font-bold tabular-nums', t.avg_return >= 0 ? 'text-emerald-400' : 'text-red-400')}>
              {pctSigned(t.avg_return)}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ── Horizon view ── */

function HorizonView({ result }: { result: BacktestHorizonResult }) {
  const { overall, by_direction, by_divergence, by_confidence, by_market_regime, top_tickers, equity } = result;

  return (
    <div className="space-y-3">
      {/* Stat cards */}
      <div className="grid grid-cols-3 gap-2">
        <StatCard label="총 시그널" value={String(overall.total_signals)} />
        <StatCard label="승률" value={pct(overall.win_rate)} positive={overall.win_rate > 0.5} />
        <StatCard label="평균 수익률" value={pctSigned(overall.avg_return)} positive={overall.avg_return > 0} />
      </div>

      <div className="grid grid-cols-2 gap-2">
        <StatCard label="Profit Factor" value={overall.profit_factor.toFixed(2)} positive={overall.profit_factor > 1} />
        <StatCard label="총 수익률" value={pctSigned(equity.total_return_pct / 100)} positive={equity.total_return_pct > 0} />
      </div>

      {/* Equity curve */}
      <EquityCurveChart equity={equity} />

      {/* Direction breakdown */}
      {by_direction.length > 0 && (
        <BucketBarChart title="방향별 수익률" icon={BarChart3} rows={by_direction} nameKey="direction" />
      )}

      {/* Divergence/Confidence/Regime breakdowns */}
      {by_divergence && by_divergence.length > 0 && (
        <BucketBarChart title="괴리율 구간별" icon={BarChart3} rows={by_divergence} nameKey="bucket" />
      )}
      {by_confidence && by_confidence.length > 0 && (
        <BucketBarChart title="확신도별" icon={BarChart3} rows={by_confidence} nameKey="bucket" />
      )}
      {by_market_regime && by_market_regime.length > 0 && (
        <BucketBarChart title="시장 국면별" icon={BarChart3} rows={by_market_regime} nameKey="bucket" />
      )}

      {/* Top tickers */}
      <TopTickersTable tickers={top_tickers} />

      {/* Sharpe note */}
      <div className="flex items-start gap-2 px-3 py-2 rounded-lg bg-yellow-500/5 border border-yellow-500/10">
        <AlertTriangle className="w-3 h-3 text-yellow-500/50 mt-0.5 shrink-0" />
        <p className="text-[10px] text-zinc-500 leading-relaxed">
          Sharpe Ratio ({equity.sharpe_ratio.toFixed(1)}) / MDD ({pct(equity.max_drawdown_pct / 100)}) 는 집계 방식 특성상 참고 지표로 활용해주세요.
        </p>
      </div>
    </div>
  );
}

/* ── Main dashboard ── */

export default function BacktestDashboard() {
  const { data, isLoading, error, retry } = useBacktest();
  const horizons = data?.horizons ?? [];
  const [activeHorizon, setActiveHorizon] = useState<number | null>(null);

  const selectedHorizon = activeHorizon ?? horizons[0] ?? null;
  const result = selectedHorizon != null ? data?.results[String(selectedHorizon)] : null;

  if (isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="flex items-center gap-2 text-[10px] font-mono text-zinc-500">
          <RefreshCw className="w-3.5 h-3.5 animate-spin" />
          백테스트 데이터 로딩 중...
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center">
          <p className="text-[10px] text-red-400 font-mono mb-2">{error}</p>
          <button onClick={retry} className="text-[10px] font-mono text-zinc-400 hover:text-zinc-200 border border-zinc-700 rounded px-3 py-1 transition-colors">
            다시 시도
          </button>
        </div>
      </div>
    );
  }

  if (!data || horizons.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <p className="text-[10px] text-zinc-600 font-mono">백테스트 데이터가 없습니다</p>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      {/* Horizon tabs */}
      <div className="px-3 py-1.5 border-b border-zinc-800/40 flex items-center gap-1.5 shrink-0">
        {horizons.map((h) => (
          <button
            key={h}
            onClick={() => setActiveHorizon(h)}
            className={cn(
              'px-2.5 py-1 rounded text-[10px] font-mono font-medium transition-all duration-150',
              selectedHorizon === h
                ? 'bg-zinc-700/50 text-zinc-200 ring-1 ring-zinc-600/50'
                : 'text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800/50',
            )}
          >
            {BACKTEST_HORIZON_LABELS[h] ?? `${h}일`} 후
          </button>
        ))}
        <div className="flex-1" />
        <span className="text-[9px] font-mono text-zinc-600">
          최근 {data.lookback_days}일
        </span>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto px-3 py-3 terminal-scroll">
        {result ? (
          <HorizonView result={result} />
        ) : (
          <div className="flex items-center justify-center py-12">
            <p className="text-[10px] text-zinc-600 font-mono">해당 기간 데이터가 없습니다</p>
          </div>
        )}
      </div>
    </div>
  );
}
