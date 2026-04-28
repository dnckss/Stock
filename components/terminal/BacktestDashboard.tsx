'use client';

import { useState } from 'react';
import {
  RefreshCw, TrendingUp, Target, BarChart3, AlertTriangle,
  ArrowUpRight, ArrowDownRight, Clock,
} from 'lucide-react';
import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  ResponsiveContainer, Tooltip, Cell,
} from 'recharts';
import { useBacktest } from '@/hooks/useBacktest';
import { BACKTEST_HORIZON_LABELS } from '@/lib/constants';
import { cn } from '@/lib/utils';
import type {
  BacktestHorizonResult, BacktestDirectionRow, BacktestBucketRow,
  BacktestLiveHorizonResult, BacktestLivePosition,
} from '@/types/dashboard';

/* ── Helpers ── */

function pct(v: number): string { return `${(v * 100).toFixed(2)}%`; }
function pctSigned(v: number): string { const s = (v * 100).toFixed(2); return v >= 0 ? `+${s}%` : `${s}%`; }
function pctDirect(v: number): string { return v >= 0 ? `+${v.toFixed(2)}%` : `${v.toFixed(2)}%`; }

/* ── Shared components ── */

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

/* ══════════════════════════════════════
   ── SUMMARY VIEW (과거 성과) ──
   ══════════════════════════════════════ */

type EquityPayload = { payload?: { date: string; cumulative_return: number }; value?: number };
function EquityTooltip({ active, payload }: { active?: boolean; payload?: EquityPayload[] }) {
  if (!active || !payload?.length) return null;
  const d = payload[0]?.payload;
  if (!d) return null;
  return (
    <div className="rounded-lg border border-zinc-700/60 bg-zinc-900/95 px-3 py-2 shadow-xl backdrop-blur-lg text-xs font-mono">
      <p className="text-zinc-400">{d.date}</p>
      <p className={`font-bold ${d.cumulative_return >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>{pctSigned(d.cumulative_return)}</p>
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
            <XAxis dataKey="date" tick={{ fill: '#3f3f46', fontSize: 9, fontFamily: 'monospace' }} tickLine={false} axisLine={false} interval="preserveStartEnd" />
            <YAxis tick={{ fill: '#3f3f46', fontSize: 9, fontFamily: 'monospace' }} tickLine={false} axisLine={false} width={50} tickFormatter={(v: number) => `${(v * 100).toFixed(0)}%`} />
            <Tooltip content={<EquityTooltip />} />
            <Line type="monotone" dataKey="cumulative_return" stroke="#10b981" strokeWidth={1.5} dot={false} activeDot={{ r: 3, fill: '#10b981', strokeWidth: 0 }} />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

function BucketBarChart({ title, icon: Icon, rows, nameKey }: {
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
            <XAxis type="number" tick={{ fill: '#3f3f46', fontSize: 9, fontFamily: 'monospace' }} tickLine={false} axisLine={false} tickFormatter={(v: number) => `${v.toFixed(1)}%`} />
            <YAxis dataKey="name" type="category" tick={{ fill: '#71717a', fontSize: 10, fontFamily: 'monospace' }} tickLine={false} axisLine={false} width={80} />
            <Tooltip content={<BucketTooltip />} />
            <Bar dataKey="value" radius={[3, 3, 3, 3]} barSize={12}>
              {data.map((d, i) => <Cell key={i} fill={d.value >= 0 ? '#10b981' : '#ef4444'} fillOpacity={0.7} />)}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

function SummaryHorizonView({ result }: { result: BacktestHorizonResult }) {
  const { overall, by_direction, by_divergence, by_confidence, by_market_regime, top_tickers, equity } = result;
  return (
    <div className="space-y-3">
      <div className="grid grid-cols-3 gap-2">
        <StatCard label="총 시그널" value={String(overall.total_signals)} />
        <StatCard label="승률" value={pct(overall.win_rate)} positive={overall.win_rate > 0.5} />
        <StatCard label="평균 수익률" value={pctSigned(overall.avg_return)} positive={overall.avg_return > 0} />
      </div>
      <div className="grid grid-cols-2 gap-2">
        <StatCard label="Profit Factor" value={overall.profit_factor.toFixed(2)} positive={overall.profit_factor > 1} />
        <StatCard label="총 수익률" value={pctSigned(equity.total_return_pct / 100)} positive={equity.total_return_pct > 0} />
      </div>
      <EquityCurveChart equity={equity} />
      {by_direction.length > 0 && <BucketBarChart title="방향별 수익률" icon={BarChart3} rows={by_direction} nameKey="direction" />}
      {by_divergence && by_divergence.length > 0 && <BucketBarChart title="괴리율 구간별" icon={BarChart3} rows={by_divergence} />}
      {by_confidence && by_confidence.length > 0 && <BucketBarChart title="확신도별" icon={BarChart3} rows={by_confidence} />}
      {by_market_regime && by_market_regime.length > 0 && <BucketBarChart title="시장 국면별" icon={BarChart3} rows={by_market_regime} />}
      {top_tickers.length > 0 && (
        <div className="bg-zinc-900/50 border border-zinc-800/50 rounded-xl overflow-hidden">
          <div className="px-3 py-2 border-b border-zinc-800/40 flex items-center gap-2">
            <Target className="w-3.5 h-3.5 text-zinc-500" />
            <span className="text-[10px] font-mono text-zinc-500 uppercase">Top Tickers</span>
          </div>
          <div className="divide-y divide-zinc-800/30 max-h-[200px] overflow-y-auto">
            {top_tickers.slice(0, 10).map((t) => (
              <div key={t.ticker} className="px-3 py-1.5 flex items-center gap-3">
                <span className="w-[50px] text-[11px] font-mono font-bold text-zinc-100">{t.ticker}</span>
                <span className="flex-1 text-[10px] font-mono text-zinc-500 tabular-nums">{t.count}건</span>
                <span className="text-[10px] font-mono text-zinc-400 tabular-nums">{pct(t.win_rate)}</span>
                <span className={cn('text-[10px] font-mono font-bold tabular-nums', t.avg_return >= 0 ? 'text-emerald-400' : 'text-red-400')}>{pctSigned(t.avg_return)}</span>
              </div>
            ))}
          </div>
        </div>
      )}
      <div className="flex items-start gap-2 px-3 py-2 rounded-lg bg-yellow-500/5 border border-yellow-500/10">
        <AlertTriangle className="w-3 h-3 text-yellow-500/50 mt-0.5 shrink-0" />
        <p className="text-[10px] text-zinc-500 leading-relaxed">
          Sharpe Ratio ({equity.sharpe_ratio.toFixed(1)}) / MDD ({pct(equity.max_drawdown_pct / 100)}) 는 집계 방식 특성상 참고 지표로 활용해주세요.
        </p>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════
   ── LIVE VIEW (진행 중 시그널) ──
   ══════════════════════════════════════ */

function PositionRow({ pos }: { pos: BacktestLivePosition }) {
  const isBuy = pos.direction.toUpperCase().includes('BUY');
  const positive = pos.unrealized_adjusted_pct >= 0;

  return (
    <div className="px-3 py-2 hover:bg-zinc-800/20 transition-colors">
      <div className="flex items-center gap-2">
        {/* Direction badge */}
        <span className={cn(
          'shrink-0 w-10 text-center text-[9px] font-mono font-black py-0.5 rounded',
          isBuy ? 'bg-green-500/10 text-green-400 border border-green-500/30' : 'bg-red-500/10 text-red-400 border border-red-500/30',
        )}>
          {isBuy ? 'BUY' : 'SELL'}
        </span>
        {/* Ticker */}
        <span className="w-[48px] text-[11px] font-mono font-bold text-zinc-100">{pos.ticker}</span>
        {/* Prices */}
        <span className="text-[10px] font-mono text-zinc-500 tabular-nums">${pos.entry_price.toFixed(1)}</span>
        <span className="text-[9px] text-zinc-700">→</span>
        <span className="text-[10px] font-mono text-zinc-300 tabular-nums">${pos.current_price.toFixed(1)}</span>
        {/* P&L */}
        <div className="flex items-center gap-0.5 ml-auto">
          {positive ? <ArrowUpRight className="w-3 h-3 text-emerald-400" /> : <ArrowDownRight className="w-3 h-3 text-red-400" />}
          <span className={cn('text-[11px] font-mono font-bold tabular-nums', positive ? 'text-emerald-400' : 'text-red-400')}>
            {pctDirect(pos.unrealized_adjusted_pct)}
          </span>
        </div>
      </div>
      {/* Progress bar */}
      <div className="mt-1.5 flex items-center gap-2">
        <div className="flex-1 h-1 rounded-full bg-zinc-800 overflow-hidden">
          <div className="h-full rounded-full bg-zinc-600 transition-all" style={{ width: `${Math.min(pos.progress_pct, 100)}%` }} />
        </div>
        <div className="flex items-center gap-1 text-[8px] font-mono text-zinc-600 shrink-0">
          <Clock className="w-2.5 h-2.5" />
          D{pos.elapsed_trading_days}/{pos.elapsed_trading_days + pos.remaining_trading_days}
        </div>
      </div>
    </div>
  );
}

function LiveHorizonView({ result }: { result: BacktestLiveHorizonResult }) {
  const { overall, by_direction = [], positions = [] } = result;

  return (
    <div className="space-y-3">
      {/* Stats */}
      <div className="grid grid-cols-3 gap-2">
        <StatCard label="진행 중" value={String(overall.count ?? 0)} />
        <StatCard label="적중률" value={`${(overall.hit_rate_so_far_pct ?? 0).toFixed(1)}%`} positive={(overall.hit_rate_so_far_pct ?? 0) > 50} />
        <StatCard label="평균 미실현" value={pctDirect(overall.avg_unrealized_pct ?? 0)} positive={(overall.avg_unrealized_pct ?? 0) > 0} />
      </div>

      {/* Direction breakdown */}
      {by_direction.length > 0 && (
        <div className="bg-zinc-900/50 border border-zinc-800/50 rounded-xl overflow-hidden">
          <div className="px-3 py-2 border-b border-zinc-800/40">
            <span className="text-[10px] font-mono text-zinc-500 uppercase">방향별</span>
          </div>
          <div className="divide-y divide-zinc-800/30">
            {by_direction.map((d) => (
              <div key={d.direction} className="px-3 py-2 flex items-center gap-3">
                <span className={cn('w-10 text-center text-[9px] font-mono font-black py-0.5 rounded',
                  d.direction.toUpperCase().includes('BUY')
                    ? 'bg-green-500/10 text-green-400 border border-green-500/30'
                    : 'bg-red-500/10 text-red-400 border border-red-500/30',
                )}>{d.direction}</span>
                <span className="text-[10px] font-mono text-zinc-500 tabular-nums">{d.count}건</span>
                <span className="text-[10px] font-mono text-zinc-400 tabular-nums">{d.hit_rate_pct.toFixed(1)}%</span>
                <span className={cn('text-[10px] font-mono font-bold tabular-nums ml-auto', d.avg_unrealized_pct >= 0 ? 'text-emerald-400' : 'text-red-400')}>
                  {pctDirect(d.avg_unrealized_pct)}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Positions */}
      {positions.length > 0 && (
        <div className="bg-zinc-900/50 border border-zinc-800/50 rounded-xl overflow-hidden">
          <div className="px-3 py-2 border-b border-zinc-800/40 flex items-center justify-between">
            <span className="text-[10px] font-mono text-zinc-500 uppercase">포지션</span>
            <span className="text-[9px] font-mono text-zinc-600">{positions.length}건 표시</span>
          </div>
          <div className="divide-y divide-zinc-800/30 max-h-[320px] overflow-y-auto terminal-scroll">
            {positions.map((pos, i) => <PositionRow key={`${pos.ticker}-${i}`} pos={pos} />)}
          </div>
        </div>
      )}

      {/* Best / Worst */}
      {(overall.best_pct != null || overall.worst_pct != null) && (
        <div className="grid grid-cols-2 gap-2">
          <StatCard label="최고 수익" value={pctDirect(overall.best_pct ?? 0)} positive />
          <StatCard label="최저 수익" value={pctDirect(overall.worst_pct ?? 0)} positive={(overall.worst_pct ?? 0) >= 0} />
        </div>
      )}
    </div>
  );
}

/* ══════════════════════════════════════
   ── MAIN DASHBOARD ──
   ══════════════════════════════════════ */

type MainTab = 'summary' | 'live';

export default function BacktestDashboard() {
  const { summary, live, isLoading, error, retry } = useBacktest();
  const [mainTab, setMainTab] = useState<MainTab>('live');
  const [summaryHorizon, setSummaryHorizon] = useState<number | null>(null);
  const [liveHorizon, setLiveHorizon] = useState<number | null>(null);

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

  if (error && !summary && !live) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center">
          <p className="text-[10px] text-red-400 font-mono mb-2">{error}</p>
          <button onClick={retry} className="text-[10px] font-mono text-zinc-400 hover:text-zinc-200 border border-zinc-700 rounded px-3 py-1 transition-colors">다시 시도</button>
        </div>
      </div>
    );
  }

  const summaryHorizons = summary?.horizons ?? [];
  const selectedSummaryH = summaryHorizon ?? summaryHorizons[0] ?? null;
  const summaryResult = selectedSummaryH != null ? summary?.results?.[String(selectedSummaryH)] ?? null : null;

  const liveHorizons = live?.horizons ?? [];
  const selectedLiveH = liveHorizon ?? liveHorizons[0] ?? null;
  const liveResult = selectedLiveH != null ? live?.results?.[String(selectedLiveH)] ?? null : null;

  const hasLive = live && liveHorizons.length > 0;
  const hasSummary = summary && summaryHorizons.length > 0;

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      {/* Main tab switch */}
      <div className="px-3 py-1.5 border-b border-zinc-800/40 flex items-center gap-2 shrink-0">
        {hasLive && (
          <button
            onClick={() => setMainTab('live')}
            className={cn(
              'px-2.5 py-1 rounded text-[10px] font-medium transition-all',
              mainTab === 'live' ? 'bg-emerald-500/15 text-emerald-400 ring-1 ring-emerald-500/30' : 'text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800/50',
            )}
          >
            진행 중 {live?.total_open != null && <span className="ml-1 text-[9px] text-zinc-600">{live.total_open.toLocaleString()}</span>}
          </button>
        )}
        {hasSummary && (
          <button
            onClick={() => setMainTab('summary')}
            className={cn(
              'px-2.5 py-1 rounded text-[10px] font-medium transition-all',
              mainTab === 'summary' ? 'bg-zinc-700/50 text-zinc-200 ring-1 ring-zinc-600/50' : 'text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800/50',
            )}
          >
            과거 성과
          </button>
        )}
      </div>

      {/* Horizon sub-tabs */}
      {mainTab === 'summary' && hasSummary && (
        <div className="px-3 py-1 border-b border-zinc-800/30 flex items-center gap-1 shrink-0">
          {summaryHorizons.map((h) => (
            <button
              key={h}
              onClick={() => setSummaryHorizon(h)}
              className={cn('px-2 py-0.5 rounded text-[10px] font-mono transition-all', selectedSummaryH === h ? 'bg-zinc-700/60 text-zinc-100' : 'text-zinc-500 hover:text-zinc-300')}
            >
              {BACKTEST_HORIZON_LABELS[h] ?? `${h}일`}
            </button>
          ))}
          <span className="ml-auto text-[9px] font-mono text-zinc-600">최근 {summary?.lookback_days ?? 90}일</span>
        </div>
      )}
      {mainTab === 'live' && hasLive && (
        <div className="px-3 py-1 border-b border-zinc-800/30 flex items-center gap-1 shrink-0">
          {liveHorizons.map((h) => (
            <button
              key={h}
              onClick={() => setLiveHorizon(h)}
              className={cn('px-2 py-0.5 rounded text-[10px] font-mono transition-all', selectedLiveH === h ? 'bg-zinc-700/60 text-zinc-100' : 'text-zinc-500 hover:text-zinc-300')}
            >
              {BACKTEST_HORIZON_LABELS[h] ?? `${h}일`}
            </button>
          ))}
          <span className="ml-auto text-[9px] font-mono text-zinc-600">총 {live?.total_open?.toLocaleString() ?? 0}건</span>
        </div>
      )}

      {/* Content */}
      <div className="flex-1 overflow-y-auto px-3 py-3 terminal-scroll">
        {mainTab === 'summary' && summaryResult && <SummaryHorizonView result={summaryResult} />}
        {mainTab === 'summary' && !summaryResult && (
          <div className="flex items-center justify-center py-12"><p className="text-[10px] text-zinc-600 font-mono">해당 기간 데이터가 없습니다</p></div>
        )}
        {mainTab === 'live' && liveResult && <LiveHorizonView result={liveResult} />}
        {mainTab === 'live' && !liveResult && (
          <div className="flex items-center justify-center py-12"><p className="text-[10px] text-zinc-600 font-mono">진행 중인 시그널이 없습니다</p></div>
        )}
      </div>
    </div>
  );
}
