'use client';

import {
  AlertTriangle, ShieldCheck, Brain, TrendingDown, Activity,
  Lightbulb, Target, PieChart, BarChart3,
} from 'lucide-react';
import type { PortfolioFullResult, RiskAnalysis, Xai } from '@/types/dashboard';

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

function formatUsd(v: number): string {
  return `$${v.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
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

/* ── Risk analysis ── */

function RiskVolatilityTable({ risk }: { risk: RiskAnalysis }) {
  if (risk.volatility.length === 0) return null;

  return (
    <Card>
      <CardHeader icon={Activity} label="변동성 분석" />
      {/* Header */}
      <div className="px-5 py-2 bg-zinc-800/20 border-b border-zinc-800/30 flex items-center gap-3 text-[10px] font-mono text-zinc-600 uppercase">
        <span className="w-[70px]">Ticker</span>
        <span className="flex-1 text-right">연간변동성</span>
        <span className="flex-1 text-right">MDD</span>
        <span className="flex-1 text-right">Sharpe</span>
      </div>
      <div className="divide-y divide-zinc-800/30">
        {risk.volatility.map((v) => (
          <div key={v.ticker} className="px-5 py-2.5 flex items-center gap-3">
            <span className="w-[70px] text-sm font-mono font-bold text-zinc-100">{v.ticker}</span>
            <span className="flex-1 text-xs font-mono text-zinc-300 text-right tabular-nums">
              {formatPct(v.annualVolatility)}
            </span>
            <span className="flex-1 text-xs font-mono text-red-400 text-right tabular-nums">
              {formatPct(v.mdd)}
            </span>
            <span className="flex-1 text-xs font-mono text-zinc-300 text-right tabular-nums">
              {v.sharpe.toFixed(2)}
            </span>
          </div>
        ))}
      </div>
    </Card>
  );
}

function RiskVarSummary({ risk }: { risk: RiskAnalysis }) {
  const { var: varData, monteCarlo } = risk;
  const hasVar = varData.var95 !== 0 || varData.var99 !== 0;
  const hasMc = monteCarlo.expectedReturn !== 0 || monteCarlo.lossProbability !== 0;

  if (!hasVar && !hasMc) return null;

  return (
    <Card>
      <CardHeader icon={ShieldCheck} label="위험 지표 (VaR / 몬테카를로)" />
      <div className="p-5 space-y-4">
        {hasVar && (
          <div className="grid grid-cols-3 gap-4">
            <div>
              <span className="text-[10px] font-mono text-zinc-600 uppercase block mb-1">VaR 95%</span>
              <span className="text-sm font-mono font-bold text-red-400">{formatPct(varData.var95)}</span>
            </div>
            <div>
              <span className="text-[10px] font-mono text-zinc-600 uppercase block mb-1">VaR 99%</span>
              <span className="text-sm font-mono font-bold text-red-400">{formatPct(varData.var99)}</span>
            </div>
            <div>
              <span className="text-[10px] font-mono text-zinc-600 uppercase block mb-1">CVaR</span>
              <span className="text-sm font-mono font-bold text-red-400">{formatPct(varData.cvar)}</span>
            </div>
          </div>
        )}

        {hasMc && (
          <div className={`grid grid-cols-2 gap-4 ${hasVar ? 'pt-4 border-t border-zinc-800/40' : ''}`}>
            <div>
              <span className="text-[10px] font-mono text-zinc-600 uppercase block mb-1">기대수익률</span>
              <span className="text-sm font-mono font-bold text-emerald-400">{formatPct(monteCarlo.expectedReturn)}</span>
            </div>
            <div>
              <span className="text-[10px] font-mono text-zinc-600 uppercase block mb-1">손실확률</span>
              <span className="text-sm font-mono font-bold text-red-400">{formatPct(monteCarlo.lossProbability)}</span>
            </div>
          </div>
        )}

        {/* Diversification score */}
        {risk.correlation.diversificationScore > 0 && (
          <div className="pt-4 border-t border-zinc-800/40">
            <span className="text-[10px] font-mono text-zinc-600 uppercase block mb-2">분산투자 점수</span>
            <div className="flex items-center gap-3">
              <div className="flex-1 h-2 rounded-full bg-zinc-800 overflow-hidden">
                <div
                  className="h-full rounded-full bg-emerald-500/60 transition-all duration-700"
                  style={{ width: `${Math.min(risk.correlation.diversificationScore * 100, 100)}%` }}
                />
              </div>
              <span className="text-sm font-mono font-bold text-zinc-200 tabular-nums">
                {(risk.correlation.diversificationScore * 100).toFixed(0)}%
              </span>
            </div>
          </div>
        )}
      </div>
    </Card>
  );
}

function RiskScenarios({ risk }: { risk: RiskAnalysis }) {
  if (risk.scenarios.length === 0) return null;

  return (
    <Card>
      <CardHeader icon={TrendingDown} label="시나리오 분석" />
      <div className="p-5 space-y-3">
        {risk.scenarios.map((s, i) => (
          <div key={i} className="flex items-start gap-3">
            <span
              className={`shrink-0 text-sm font-mono font-bold tabular-nums min-w-[60px] text-right ${
                s.impact < 0 ? 'text-red-400' : 'text-emerald-400'
              }`}
            >
              {s.impact > 0 ? '+' : ''}{formatPct(s.impact)}
            </span>
            <div className="flex-1">
              <span className="text-sm text-zinc-200">{s.name}</span>
              {s.description && (
                <p className="text-xs text-zinc-500 mt-0.5 leading-relaxed">{s.description}</p>
              )}
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}

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

/* ── Main component ── */

export default function PortfolioResultView({ data }: { data: PortfolioFullResult }) {
  const sectorEntries = Object.entries(data.sectorExposure).sort((a, b) => b[1] - a[1]);
  const maxSector = sectorEntries.length > 0 ? sectorEntries[0][1] : 100;

  return (
    <div className="space-y-5">
      {/* Summary stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="bg-zinc-900/40 border border-zinc-800/50 rounded-xl px-4 py-3">
          <span className="text-[10px] font-mono text-zinc-600 uppercase block mb-1">투자 금액</span>
          <span className="text-base font-mono font-bold text-zinc-100">{formatUsd(data.totalInvested)}</span>
        </div>
        <div className="bg-zinc-900/40 border border-zinc-800/50 rounded-xl px-4 py-3">
          <span className="text-[10px] font-mono text-zinc-600 uppercase block mb-1">잔여 현금</span>
          <span className="text-base font-mono font-bold text-zinc-100">{formatUsd(data.cashRemaining)}</span>
        </div>
        <div className="bg-zinc-900/40 border border-zinc-800/50 rounded-xl px-4 py-3">
          <span className="text-[10px] font-mono text-zinc-600 uppercase block mb-1">투자 성향</span>
          <span className="text-base font-semibold text-zinc-100">{data.styleKo}</span>
        </div>
        <div className="bg-zinc-900/40 border border-zinc-800/50 rounded-xl px-4 py-3">
          <span className="text-[10px] font-mono text-zinc-600 uppercase block mb-1">투자 기간</span>
          <span className="text-base font-semibold text-zinc-100">{data.periodKo}</span>
        </div>
      </div>

      {/* Meta info bar */}
      <div className="flex items-center gap-4 text-xs font-mono text-zinc-600 px-1">
        {data.totalElapsedSec != null && (
          <span>소요 {data.totalElapsedSec.toFixed(1)}s</span>
        )}
        {data.generatedAt && (
          <span>
            {new Date(data.generatedAt).toLocaleString('ko-KR', {
              month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', hour12: false,
            })}
          </span>
        )}
      </div>

      {/* XAI Narratives */}
      {data.xai && <XaiNarratives xai={data.xai} />}

      {/* Thesis */}
      {data.portfolioThesis && (
        <Card>
          <CardHeader icon={Brain} label="포트폴리오 전략" />
          <div className="p-5">
            <p className="text-sm text-zinc-200 leading-relaxed">{data.portfolioThesis}</p>
          </div>
        </Card>
      )}

      {/* Allocations table */}
      <Card>
        <CardHeader
          icon={PieChart}
          label="종목 배분"
          trailing={
            <span className="text-xs font-mono text-zinc-600 bg-zinc-800/50 px-2 py-0.5 rounded-md">
              {data.allocations.length}종목
            </span>
          }
        />
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
          {data.allocations.map((a) => (
            <div key={a.ticker} className="px-5 py-3 hover:bg-white/[0.02] transition-colors">
              <div className="flex items-center gap-3">
                <span className="w-[70px] text-sm font-mono font-bold text-zinc-100">{a.ticker}</span>
                <span className="flex-1 text-xs text-zinc-400 truncate">{a.name || '-'}</span>
                <span className="w-[50px] text-xs font-mono text-zinc-300 text-right tabular-nums">{a.shares}주</span>
                <span className="w-[80px] text-xs font-mono text-zinc-200 text-right tabular-nums">{formatUsd(a.amount)}</span>
                <span className="w-[50px] text-xs font-mono text-zinc-400 text-right tabular-nums">{a.weightPct.toFixed(1)}%</span>
              </div>
              {/* Weight bar */}
              <div className="mt-1.5 ml-[82px]">
                <div className="h-1 rounded-full bg-zinc-800 overflow-hidden">
                  <div
                    className="h-full rounded-full bg-violet-500/50 transition-all duration-500"
                    style={{ width: `${Math.min(a.weightPct, 100)}%` }}
                  />
                </div>
              </div>
              {a.rationale && (
                <p className="text-[11px] text-zinc-500 mt-1.5 ml-[82px] leading-relaxed line-clamp-2">{a.rationale}</p>
              )}
            </div>
          ))}
        </div>
      </Card>

      {/* XAI: Stock briefs */}
      {data.xai && <XaiStockBriefs xai={data.xai} />}

      {/* Sector exposure + Risk side by side */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Sectors */}
        {sectorEntries.length > 0 && (
          <Card>
            <CardHeader icon={BarChart3} label="섹터 비중" />
            <div className="p-5 space-y-2.5">
              {sectorEntries.map(([sector, pct]) => (
                <div key={sector}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs text-zinc-300">{sector}</span>
                    <span className="text-xs font-mono text-zinc-400 tabular-nums">{pct}%</span>
                  </div>
                  <div className="h-1.5 rounded-full bg-zinc-800 overflow-hidden">
                    <div
                      className="h-full rounded-full bg-violet-500/50 transition-all duration-500"
                      style={{ width: `${(pct / maxSector) * 100}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </Card>
        )}

        {/* Risk assessment */}
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

      {/* Risk analysis detail */}
      {data.riskAnalysisDetail && (
        <>
          <RiskVolatilityTable risk={data.riskAnalysisDetail} />
          <RiskVarSummary risk={data.riskAnalysisDetail} />
          <RiskScenarios risk={data.riskAnalysisDetail} />
          <RiskAnomalies risk={data.riskAnalysisDetail} />
        </>
      )}

      {/* XAI: Action items */}
      {data.xai && <XaiActionItems items={data.xai.actionItems} />}

      {/* Warnings */}
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
