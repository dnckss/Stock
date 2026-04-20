'use client';

import {
  AlertTriangle, ShieldCheck, Brain, TrendingDown, Activity,
  Lightbulb, Target, PieChart as PieChartIcon, BarChart3, Gauge,
} from 'lucide-react';
import {
  PieChart, Pie, Cell,
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
  ResponsiveContainer, Tooltip,
} from 'recharts';
import type {
  PortfolioFullResult, PortfolioAllocation,
  RiskAnalysis, RiskScenario, Xai,
} from '@/types/dashboard';

/* ── Color palette ── */

const ALLOC_COLORS = [
  '#8b5cf6', '#6366f1', '#3b82f6', '#06b6d4', '#10b981',
  '#f59e0b', '#ef4444', '#ec4899', '#84cc16', '#14b8a6',
];

const RISK_COLOR: Record<string, string> = {
  low: 'text-emerald-400',
  medium: 'text-yellow-400',
  high: 'text-red-400',
};

const SEVERITY_COLOR: Record<string, string> = {
  low: 'border-yellow-500/20 bg-yellow-500/5 text-yellow-300',
  medium: 'border-orange-500/20 bg-orange-500/5 text-orange-300',
  high: 'border-red-500/20 bg-red-500/5 text-red-300',
};

/* ── Formatters ── */

function formatUsd(v: number): string {
  return `$${v.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function formatUsdShort(v: number): string {
  if (v >= 1000) return `$${(v / 1000).toFixed(1)}K`;
  return `$${v.toFixed(0)}`;
}

function formatPct(v: number): string {
  return `${(v * 100).toFixed(2)}%`;
}

/* ── Card wrapper ── */

function Card({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`bg-zinc-900/40 border border-zinc-800/50 rounded-2xl overflow-hidden ${className}`}>
      {children}
    </div>
  );
}

function CardHeader({
  icon: Icon,
  label,
  trailing,
}: {
  icon: React.ElementType;
  label: string;
  trailing?: React.ReactNode;
}) {
  return (
    <div className="px-5 py-3.5 border-b border-zinc-800/50 flex items-center justify-between">
      <div className="flex items-center gap-2">
        <Icon className="w-4 h-4 text-zinc-500" />
        <span className="text-xs font-medium text-zinc-400 uppercase tracking-wider">{label}</span>
      </div>
      {trailing}
    </div>
  );
}

/* ── Allocation Donut Chart ── */

type AllocTooltipPayload = { payload?: PortfolioAllocation; value?: number };

function AllocTooltip({ active, payload }: { active?: boolean; payload?: AllocTooltipPayload[] }) {
  if (!active || !payload?.length) return null;
  const d = payload[0]?.payload;
  if (!d) return null;
  return (
    <div className="rounded-xl border border-zinc-700/60 bg-zinc-900/95 px-3 py-2 shadow-xl backdrop-blur-lg">
      <p className="text-sm font-mono font-bold text-zinc-100">{d.ticker}</p>
      {d.name && <p className="text-[11px] text-zinc-400">{d.name}</p>}
      <div className="flex items-center gap-3 mt-1">
        <span className="text-xs font-mono text-zinc-300">{formatUsd(d.amount)}</span>
        <span className="text-xs font-mono text-violet-400 font-bold">{d.weightPct.toFixed(1)}%</span>
      </div>
    </div>
  );
}

function AllocationDonut({
  allocations,
  totalInvested,
}: {
  allocations: PortfolioAllocation[];
  totalInvested: number;
}) {
  if (allocations.length === 0) return null;

  return (
    <div className="relative w-full h-[220px]">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={allocations}
            dataKey="weightPct"
            nameKey="ticker"
            cx="50%"
            cy="50%"
            innerRadius={65}
            outerRadius={95}
            paddingAngle={2}
            strokeWidth={0}
          >
            {allocations.map((_, idx) => (
              <Cell key={idx} fill={ALLOC_COLORS[idx % ALLOC_COLORS.length]} />
            ))}
          </Pie>
          <Tooltip content={<AllocTooltip />} />
        </PieChart>
      </ResponsiveContainer>
      {/* Center label */}
      <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
        <span className="text-[10px] font-mono text-zinc-500 uppercase">Total</span>
        <span className="text-base font-mono font-bold text-zinc-100">{formatUsdShort(totalInvested)}</span>
      </div>
    </div>
  );
}

/* ── Sector Horizontal Bar Chart ── */

type SectorEntry = { sector: string; pct: number };
type SectorTooltipPayload = { payload?: SectorEntry; value?: number };

function SectorTooltip({ active, payload }: { active?: boolean; payload?: SectorTooltipPayload[] }) {
  if (!active || !payload?.length) return null;
  const d = payload[0]?.payload;
  if (!d) return null;
  return (
    <div className="rounded-xl border border-zinc-700/60 bg-zinc-900/95 px-3 py-2 shadow-xl backdrop-blur-lg text-xs font-mono">
      <span className="text-zinc-300">{d.sector}</span>
      <span className="ml-2 text-violet-400 font-bold">{d.pct}%</span>
    </div>
  );
}

function SectorChart({ sectorExposure }: { sectorExposure: Record<string, number> }) {
  const entries: SectorEntry[] = Object.entries(sectorExposure)
    .sort((a, b) => b[1] - a[1])
    .map(([sector, pct]) => ({ sector, pct }));

  if (entries.length === 0) return null;

  const chartHeight = Math.max(120, entries.length * 32 + 30);

  return (
    <Card>
      <CardHeader icon={BarChart3} label="섹터 비중" />
      <div className="px-3 py-2" style={{ height: chartHeight }}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={entries} layout="vertical" margin={{ top: 4, right: 20, left: 0, bottom: 4 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#18181b" horizontal={false} />
            <XAxis
              type="number"
              tick={{ fill: '#3f3f46', fontSize: 10, fontFamily: 'monospace' }}
              tickLine={false}
              axisLine={false}
              tickFormatter={(v: number) => `${v}%`}
            />
            <YAxis
              dataKey="sector"
              type="category"
              tick={{ fill: '#52525b', fontSize: 11, fontFamily: 'monospace' }}
              tickLine={false}
              axisLine={false}
              width={100}
            />
            <Tooltip content={<SectorTooltip />} />
            <Bar dataKey="pct" radius={[4, 4, 4, 4]} barSize={14}>
              {entries.map((_, idx) => (
                <Cell key={idx} fill={ALLOC_COLORS[idx % ALLOC_COLORS.length]} fillOpacity={0.75} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </Card>
  );
}

/* ── Scenario Impact Chart ── */

type ScenarioChartEntry = { name: string; impact: number; description: string };
type ScenarioTooltipPayload = { payload?: ScenarioChartEntry; value?: number };

function ScenarioTooltip({ active, payload }: { active?: boolean; payload?: ScenarioTooltipPayload[] }) {
  if (!active || !payload?.length) return null;
  const d = payload[0]?.payload;
  if (!d) return null;
  return (
    <div className="rounded-xl border border-zinc-700/60 bg-zinc-900/95 px-3 py-2 shadow-xl backdrop-blur-lg max-w-[240px]">
      <p className="text-xs font-mono font-bold text-zinc-100">{d.name}</p>
      <p className={`text-sm font-mono font-bold mt-0.5 ${d.impact < 0 ? 'text-red-400' : 'text-emerald-400'}`}>
        {d.impact > 0 ? '+' : ''}{d.impact.toFixed(2)}%
      </p>
      {d.description && (
        <p className="text-[10px] text-zinc-500 mt-1 leading-relaxed">{d.description}</p>
      )}
    </div>
  );
}

function ScenarioChart({ scenarios }: { scenarios: RiskScenario[] }) {
  if (scenarios.length === 0) return null;

  const data: ScenarioChartEntry[] = scenarios.map((s) => ({
    name: s.name,
    impact: s.impact * 100,
    description: s.description,
  }));

  const chartHeight = Math.max(120, data.length * 40 + 30);

  return (
    <Card>
      <CardHeader icon={TrendingDown} label="시나리오 분석" />
      <div className="px-3 py-2" style={{ height: chartHeight }}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} layout="vertical" margin={{ top: 4, right: 20, left: 0, bottom: 4 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#18181b" horizontal={false} />
            <XAxis
              type="number"
              tick={{ fill: '#3f3f46', fontSize: 10, fontFamily: 'monospace' }}
              tickLine={false}
              axisLine={false}
              tickFormatter={(v: number) => `${v > 0 ? '+' : ''}${v.toFixed(1)}%`}
            />
            <YAxis
              dataKey="name"
              type="category"
              tick={{ fill: '#52525b', fontSize: 10, fontFamily: 'monospace' }}
              tickLine={false}
              axisLine={false}
              width={120}
            />
            <Tooltip content={<ScenarioTooltip />} />
            <Bar dataKey="impact" radius={[4, 4, 4, 4]} barSize={14}>
              {data.map((d, idx) => (
                <Cell key={idx} fill={d.impact < 0 ? '#ef4444' : '#10b981'} fillOpacity={0.75} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </Card>
  );
}

/* ── Volatility Chart ── */

type VolChartEntry = { ticker: string; vol: number; mdd: number };
type VolTooltipPayload = { payload?: VolChartEntry; name?: string; value?: number };

function VolTooltip({ active, payload }: { active?: boolean; payload?: VolTooltipPayload[] }) {
  if (!active || !payload?.length) return null;
  const d = payload[0]?.payload;
  if (!d) return null;
  return (
    <div className="rounded-xl border border-zinc-700/60 bg-zinc-900/95 px-3 py-2 shadow-xl backdrop-blur-lg text-xs font-mono">
      <p className="font-bold text-zinc-100 mb-1">{d.ticker}</p>
      <div className="space-y-0.5">
        <p><span className="text-zinc-500">Annual Vol: </span><span className="text-violet-400">{d.vol.toFixed(2)}%</span></p>
        <p><span className="text-zinc-500">MDD: </span><span className="text-red-400">{d.mdd.toFixed(2)}%</span></p>
      </div>
    </div>
  );
}

function VolatilityChart({ risk }: { risk: RiskAnalysis }) {
  if (risk.volatility.length === 0) return null;

  const data: VolChartEntry[] = risk.volatility.map((v) => ({
    ticker: v.ticker,
    vol: Math.abs(v.annualVolatility) * 100,
    mdd: Math.abs(v.mdd) * 100,
  }));

  const chartHeight = Math.max(140, data.length * 36 + 30);

  return (
    <Card>
      <CardHeader
        icon={Activity}
        label="변동성 분석"
        trailing={
          <div className="flex items-center gap-3 text-[10px] font-mono text-zinc-600">
            <span className="flex items-center gap-1"><span className="h-2 w-2 rounded bg-violet-500/70" />Vol</span>
            <span className="flex items-center gap-1"><span className="h-2 w-2 rounded bg-red-500/70" />MDD</span>
          </div>
        }
      />
      <div className="px-3 py-2" style={{ height: chartHeight }}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} layout="vertical" margin={{ top: 4, right: 20, left: 0, bottom: 4 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#18181b" horizontal={false} />
            <XAxis
              type="number"
              tick={{ fill: '#3f3f46', fontSize: 10, fontFamily: 'monospace' }}
              tickLine={false}
              axisLine={false}
              tickFormatter={(v: number) => `${v.toFixed(0)}%`}
            />
            <YAxis
              dataKey="ticker"
              type="category"
              tick={{ fill: '#a1a1aa', fontSize: 11, fontFamily: 'monospace', fontWeight: 700 }}
              tickLine={false}
              axisLine={false}
              width={60}
            />
            <Tooltip content={<VolTooltip />} />
            <Bar dataKey="vol" fill="#8b5cf6" fillOpacity={0.7} radius={[4, 4, 4, 4]} barSize={10} />
            <Bar dataKey="mdd" fill="#ef4444" fillOpacity={0.7} radius={[4, 4, 4, 4]} barSize={10} />
          </BarChart>
        </ResponsiveContainer>
      </div>
      {/* Sharpe table below chart */}
      <div className="px-5 py-3 border-t border-zinc-800/30">
        <div className="flex items-center gap-4 flex-wrap">
          {risk.volatility.map((v) => (
            <div key={v.ticker} className="flex items-center gap-2">
              <span className="text-xs font-mono font-bold text-zinc-300">{v.ticker}</span>
              <span className="text-[10px] font-mono text-zinc-500">Sharpe</span>
              <span className={`text-xs font-mono font-bold tabular-nums ${v.sharpe >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                {v.sharpe.toFixed(2)}
              </span>
            </div>
          ))}
        </div>
      </div>
    </Card>
  );
}

/* ── XAI: Stock briefs ── */

function XaiStockBriefs({ xai }: { xai: Xai }) {
  if (xai.stockBriefs.length === 0) return null;

  return (
    <Card>
      <CardHeader icon={Target} label="종목별 선택 근거" />
      <div className="p-5 space-y-4">
        {xai.stockBriefs.map((sb) => (
          <div key={sb.ticker}>
            <span className="text-sm font-mono font-bold text-zinc-100">{sb.ticker}</span>
            {sb.reason && (
              <p className="text-xs text-zinc-300 mt-1 leading-relaxed">{sb.reason}</p>
            )}
            {sb.keyEvidence.length > 0 && (
              <ul className="mt-1.5 space-y-1">
                {sb.keyEvidence.map((ev, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <span className="text-emerald-500/60 text-[9px] mt-1">●</span>
                    <span className="text-[11px] text-zinc-500 leading-relaxed">{ev}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        ))}
      </div>
    </Card>
  );
}

/* ── XAI: Narratives ── */

function XaiNarratives({ xai }: { xai: Xai }) {
  const sections = [
    { label: '투자 스토리', content: xai.portfolioNarrative, icon: Brain },
    { label: '리스크 해석', content: xai.riskNarrative, icon: ShieldCheck },
    { label: '시나리오 분석', content: xai.scenarioBrief, icon: TrendingDown },
  ].filter((s) => s.content);

  if (sections.length === 0) return null;

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {sections.map(({ label, content, icon: SIcon }) => (
        <Card key={label}>
          <CardHeader icon={SIcon} label={label} />
          <div className="p-5">
            <p className="text-xs text-zinc-300 leading-relaxed whitespace-pre-wrap">{content}</p>
          </div>
        </Card>
      ))}
    </div>
  );
}

/* ── XAI: Action items ── */

function XaiActionItems({ items }: { items: string[] }) {
  if (items.length === 0) return null;

  return (
    <Card>
      <CardHeader icon={Lightbulb} label="투자자 행동 가이드" />
      <div className="p-5">
        <ul className="space-y-2">
          {items.map((item, i) => (
            <li key={i} className="flex items-start gap-3">
              <span className="text-xs font-mono text-violet-500/60 mt-0.5 shrink-0 w-5 text-right tabular-nums">
                {String(i + 1).padStart(2, '0')}
              </span>
              <span className="text-xs text-zinc-300 leading-relaxed">{item}</span>
            </li>
          ))}
        </ul>
      </div>
    </Card>
  );
}

/* ── VaR / Monte Carlo Summary ── */

function RiskVarSummary({ risk }: { risk: RiskAnalysis }) {
  const { var: varData, monteCarlo } = risk;
  const hasVar = varData.var95 !== 0 || varData.var99 !== 0;
  const hasMc = monteCarlo.expectedReturn !== 0 || monteCarlo.lossProbability !== 0;

  if (!hasVar && !hasMc) return null;

  return (
    <Card>
      <CardHeader icon={Gauge} label="위험 지표 (VaR / 몬테카를로)" />
      <div className="p-5 space-y-4">
        {hasVar && (
          <div className="grid grid-cols-3 gap-4">
            {[
              { label: 'VaR 95%', value: varData.var95 },
              { label: 'VaR 99%', value: varData.var99 },
              { label: 'CVaR', value: varData.cvar },
            ].map(({ label, value }) => (
              <div key={label} className="text-center p-3 rounded-xl bg-zinc-800/30 border border-zinc-800/40">
                <span className="text-[10px] font-mono text-zinc-600 uppercase block mb-1">{label}</span>
                <span className="text-lg font-mono font-bold text-red-400">{formatPct(value)}</span>
              </div>
            ))}
          </div>
        )}

        {hasMc && (
          <div className={`grid grid-cols-2 gap-4 ${hasVar ? 'pt-4 border-t border-zinc-800/40' : ''}`}>
            <div className="text-center p-3 rounded-xl bg-emerald-500/5 border border-emerald-500/10">
              <span className="text-[10px] font-mono text-zinc-600 uppercase block mb-1">기대수익률</span>
              <span className="text-lg font-mono font-bold text-emerald-400">{formatPct(monteCarlo.expectedReturn)}</span>
            </div>
            <div className="text-center p-3 rounded-xl bg-red-500/5 border border-red-500/10">
              <span className="text-[10px] font-mono text-zinc-600 uppercase block mb-1">손실확률</span>
              <span className="text-lg font-mono font-bold text-red-400">{formatPct(monteCarlo.lossProbability)}</span>
            </div>
          </div>
        )}

        {/* Diversification score */}
        {risk.correlation.diversificationScore > 0 && (
          <div className="pt-4 border-t border-zinc-800/40">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] font-mono text-zinc-600 uppercase">분산투자 점수</span>
              <span className="text-sm font-mono font-bold text-zinc-200 tabular-nums">
                {(risk.correlation.diversificationScore * 100).toFixed(0)}%
              </span>
            </div>
            <div className="h-2.5 rounded-full bg-zinc-800 overflow-hidden">
              <div
                className="h-full rounded-full bg-gradient-to-r from-violet-600 to-emerald-500 transition-all duration-700"
                style={{ width: `${Math.min(risk.correlation.diversificationScore * 100, 100)}%` }}
              />
            </div>
          </div>
        )}
      </div>
    </Card>
  );
}

/* ── Risk Anomalies ── */

function RiskAnomalies({ risk }: { risk: RiskAnalysis }) {
  if (risk.anomalies.length === 0) return null;

  return (
    <div className="space-y-2">
      {risk.anomalies.map((a, i) => {
        const colorClass = SEVERITY_COLOR[a.severity] ?? SEVERITY_COLOR.medium;
        return (
          <div key={i} className={`flex items-center gap-2.5 px-4 py-3 rounded-xl border ${colorClass}`}>
            <AlertTriangle className="shrink-0 w-4 h-4" />
            <div className="flex-1">
              <span className="text-xs">
                {a.ticker && <span className="font-mono font-bold mr-1">{a.ticker}</span>}
                {a.message}
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
}

/* ══════════════════════════════════════
   ── Main component ──
   ══════════════════════════════════════ */

export default function PortfolioResultView({ data }: { data: PortfolioFullResult }) {
  return (
    <div className="space-y-6">
      {/* ── Summary stat cards ── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="bg-zinc-900/40 border border-zinc-800/50 rounded-xl px-4 py-3">
          <span className="text-[10px] font-mono text-zinc-600 uppercase block mb-1">투자 금액</span>
          <span className="text-lg font-mono font-bold text-zinc-100">{formatUsd(data.totalInvested)}</span>
        </div>
        <div className="bg-zinc-900/40 border border-zinc-800/50 rounded-xl px-4 py-3">
          <span className="text-[10px] font-mono text-zinc-600 uppercase block mb-1">잔여 현금</span>
          <span className="text-lg font-mono font-bold text-zinc-100">{formatUsd(data.cashRemaining)}</span>
        </div>
        <div className="bg-zinc-900/40 border border-zinc-800/50 rounded-xl px-4 py-3">
          <span className="text-[10px] font-mono text-zinc-600 uppercase block mb-1">투자 성향</span>
          <span className="text-lg font-semibold text-zinc-100">{data.styleKo}</span>
        </div>
        <div className="bg-zinc-900/40 border border-zinc-800/50 rounded-xl px-4 py-3">
          <span className="text-[10px] font-mono text-zinc-600 uppercase block mb-1">투자 기간</span>
          <span className="text-lg font-semibold text-zinc-100">{data.periodKo}</span>
        </div>
      </div>

      {/* Meta */}
      <div className="flex items-center gap-4 text-xs font-mono text-zinc-600 px-1">
        {data.totalElapsedSec != null && <span>소요 {data.totalElapsedSec.toFixed(1)}s</span>}
        {data.generatedAt && (
          <span>
            {new Date(data.generatedAt).toLocaleString('ko-KR', {
              month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', hour12: false,
            })}
          </span>
        )}
      </div>

      {/* ── XAI Narratives ── */}
      {data.xai && <XaiNarratives xai={data.xai} />}

      {/* ── Thesis ── */}
      {data.portfolioThesis && (
        <Card>
          <CardHeader icon={Brain} label="포트폴리오 전략" />
          <div className="p-5">
            <p className="text-sm text-zinc-200 leading-relaxed">{data.portfolioThesis}</p>
          </div>
        </Card>
      )}

      {/* ── Allocations: Donut + Table ── */}
      <Card>
        <CardHeader
          icon={PieChartIcon}
          label="종목 배분"
          trailing={
            <span className="text-xs font-mono text-zinc-600 bg-zinc-800/50 px-2 py-0.5 rounded-md">
              {data.allocations.length}종목
            </span>
          }
        />
        <div className="flex flex-col lg:flex-row">
          {/* Donut chart */}
          {data.allocations.length > 0 && (
            <div className="lg:w-[280px] shrink-0 p-4 border-b lg:border-b-0 lg:border-r border-zinc-800/50 flex flex-col items-center justify-center">
              <AllocationDonut allocations={data.allocations} totalInvested={data.totalInvested} />
              {/* Legend */}
              <div className="flex flex-wrap justify-center gap-x-3 gap-y-1 mt-2">
                {data.allocations.map((a, i) => (
                  <div key={a.ticker} className="flex items-center gap-1.5">
                    <span
                      className="h-2 w-2 rounded-sm shrink-0"
                      style={{ backgroundColor: ALLOC_COLORS[i % ALLOC_COLORS.length] }}
                    />
                    <span className="text-[10px] font-mono text-zinc-400">{a.ticker}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Table */}
          <div className="flex-1 min-w-0">
            {/* Header */}
            <div className="px-5 py-2 bg-zinc-800/20 border-b border-zinc-800/30 flex items-center gap-3 text-[10px] font-mono text-zinc-600 uppercase">
              <span className="w-[70px]">Ticker</span>
              <span className="flex-1">종목명</span>
              <span className="w-[50px] text-right">주수</span>
              <span className="w-[80px] text-right">금액</span>
              <span className="w-[50px] text-right">비중</span>
            </div>
            {/* Rows */}
            <div className="divide-y divide-zinc-800/30">
              {data.allocations.map((a, i) => (
                <div key={a.ticker} className="px-5 py-3 hover:bg-white/[0.02] transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="w-[70px] flex items-center gap-2">
                      <span
                        className="h-2.5 w-1 rounded-full shrink-0"
                        style={{ backgroundColor: ALLOC_COLORS[i % ALLOC_COLORS.length] }}
                      />
                      <span className="text-sm font-mono font-bold text-zinc-100">{a.ticker}</span>
                    </div>
                    <span className="flex-1 text-xs text-zinc-400 truncate">{a.name || '-'}</span>
                    <span className="w-[50px] text-xs font-mono text-zinc-300 text-right tabular-nums">{a.shares}주</span>
                    <span className="w-[80px] text-xs font-mono text-zinc-200 text-right tabular-nums">{formatUsd(a.amount)}</span>
                    <span className="w-[50px] text-xs font-mono text-zinc-400 text-right tabular-nums">{a.weightPct.toFixed(1)}%</span>
                  </div>
                  {a.rationale && (
                    <p className="text-[11px] text-zinc-500 mt-1.5 ml-[82px] leading-relaxed line-clamp-2">{a.rationale}</p>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </Card>

      {/* ── XAI Stock briefs ── */}
      {data.xai && <XaiStockBriefs xai={data.xai} />}

      {/* ── Sector Chart + Risk Assessment ── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <SectorChart sectorExposure={data.sectorExposure} />

        {/* Risk assessment card */}
        <Card>
          <CardHeader icon={ShieldCheck} label="리스크 평가" />
          <div className="p-5 space-y-4">
            {data.riskAssessment.level && (
              <div className="flex items-center justify-between">
                <span className="text-xs text-zinc-500">위험 수준</span>
                <span className={`text-sm font-mono font-bold ${RISK_COLOR[data.riskAssessment.level] ?? 'text-zinc-400'}`}>
                  {data.riskAssessment.level.toUpperCase()}
                </span>
              </div>
            )}
            {data.riskAssessment.maxDrawdownEst && (
              <div className="flex items-center justify-between">
                <span className="text-xs text-zinc-500">예상 MDD</span>
                <span className="text-sm font-mono font-bold text-red-400">{data.riskAssessment.maxDrawdownEst}</span>
              </div>
            )}
            {data.riskAssessment.volatilityNote && (
              <p className="text-xs text-zinc-500 leading-relaxed">{data.riskAssessment.volatilityNote}</p>
            )}
            {data.rebalanceTrigger && (
              <div className="pt-3 border-t border-zinc-800/40">
                <span className="text-[10px] font-mono text-zinc-600 uppercase block mb-1">리밸런싱 조건</span>
                <p className="text-xs text-zinc-400 leading-relaxed">{data.rebalanceTrigger}</p>
              </div>
            )}
          </div>
        </Card>
      </div>

      {/* ── Risk Analysis Detail ── */}
      {data.riskAnalysisDetail && (
        <>
          <VolatilityChart risk={data.riskAnalysisDetail} />
          <RiskVarSummary risk={data.riskAnalysisDetail} />
          <ScenarioChart scenarios={data.riskAnalysisDetail.scenarios} />
          <RiskAnomalies risk={data.riskAnalysisDetail} />
        </>
      )}

      {/* ── XAI Action items ── */}
      {data.xai && <XaiActionItems items={data.xai.actionItems} />}

      {/* ── Warnings ── */}
      {data.warnings.length > 0 && (
        <div className="space-y-2">
          {data.warnings.map((w, i) => (
            <div key={i} className="flex items-center gap-2.5 px-4 py-3 rounded-xl border border-yellow-500/20 bg-yellow-500/5">
              <AlertTriangle className="shrink-0 w-4 h-4 text-yellow-400" />
              <span className="text-xs text-yellow-300">{w}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
