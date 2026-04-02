'use client';

import { AlertTriangle, ShieldCheck, Brain, TrendingDown, Activity, Lightbulb, Target } from 'lucide-react';
import type { PortfolioFullResult, RiskAnalysis, Xai } from '@/types/dashboard';

const RISK_COLOR: Record<string, string> = {
  low: 'text-green-400',
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

// ── Section header ──

function SectionHeader({ icon: Icon, label }: { icon: React.ElementType; label: string }) {
  return (
    <div className="flex items-center gap-2 mb-2">
      <Icon className="w-3 h-3 text-zinc-500" />
      <span className="text-[9px] font-mono text-zinc-600 uppercase tracking-wider">{label}</span>
    </div>
  );
}

// ── XAI: Stock briefs ──

function XaiStockBriefs({ xai }: { xai: Xai }) {
  if (xai.stockBriefs.length === 0) return null;

  return (
    <div className="rounded-lg border border-zinc-800 bg-zinc-900/40 px-4 py-3">
      <SectionHeader icon={Target} label="종목별 선택 근거" />
      <div className="space-y-3">
        {xai.stockBriefs.map((sb) => (
          <div key={sb.ticker}>
            <span className="text-[11px] font-mono font-bold text-zinc-100">{sb.ticker}</span>
            {sb.reason && (
              <p className="text-[10px] text-zinc-300 mt-0.5 leading-relaxed">{sb.reason}</p>
            )}
            {sb.keyEvidence.length > 0 && (
              <ul className="mt-1 space-y-0.5">
                {sb.keyEvidence.map((ev, i) => (
                  <li key={i} className="flex items-start gap-1.5">
                    <span className="text-green-500/60 text-[8px] mt-1">●</span>
                    <span className="text-[9px] text-zinc-500 leading-relaxed">{ev}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

// ── XAI: Narratives ──

function XaiNarratives({ xai }: { xai: Xai }) {
  const sections = [
    { label: '투자 스토리', content: xai.portfolioNarrative, icon: Brain },
    { label: '리스크 해석', content: xai.riskNarrative, icon: ShieldCheck },
    { label: '시나리오 분석', content: xai.scenarioBrief, icon: TrendingDown },
  ].filter((s) => s.content);

  if (sections.length === 0) return null;

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
      {sections.map(({ label, content, icon: SIcon }) => (
        <div key={label} className="rounded-lg border border-zinc-800 bg-zinc-900/40 px-4 py-3">
          <SectionHeader icon={SIcon} label={label} />
          <p className="text-[10px] text-zinc-300 leading-relaxed whitespace-pre-wrap">{content}</p>
        </div>
      ))}
    </div>
  );
}

// ── XAI: Action items ──

function XaiActionItems({ items }: { items: string[] }) {
  if (items.length === 0) return null;

  return (
    <div className="rounded-lg border border-zinc-800 bg-zinc-900/40 px-4 py-3">
      <SectionHeader icon={Lightbulb} label="투자자 행동 가이드" />
      <ul className="space-y-1.5">
        {items.map((item, i) => (
          <li key={i} className="flex items-start gap-2">
            <span className="text-[9px] font-mono text-green-500/60 mt-0.5 shrink-0">
              {String(i + 1).padStart(2, '0')}
            </span>
            <span className="text-[10px] text-zinc-300 leading-relaxed">{item}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

// ── Risk analysis detail ──

function RiskVolatilityTable({ risk }: { risk: RiskAnalysis }) {
  if (risk.volatility.length === 0) return null;

  return (
    <div className="rounded-lg border border-zinc-800 overflow-hidden">
      <div className="px-3 py-1.5 bg-zinc-800/30">
        <SectionHeader icon={Activity} label="변동성 분석" />
      </div>
      {/* Header */}
      <div className="px-3 py-1 bg-zinc-900/60 border-b border-zinc-800/40 flex items-center gap-2 text-[8px] font-mono text-zinc-600 uppercase">
        <span className="w-[60px]">Ticker</span>
        <span className="flex-1 text-right">연간변동성</span>
        <span className="flex-1 text-right">MDD</span>
        <span className="flex-1 text-right">Sharpe</span>
      </div>
      <div className="divide-y divide-zinc-800/40">
        {risk.volatility.map((v) => (
          <div key={v.ticker} className="px-3 py-1.5 flex items-center gap-2">
            <span className="w-[60px] text-[10px] font-mono font-bold text-zinc-100">{v.ticker}</span>
            <span className="flex-1 text-[10px] font-mono text-zinc-300 text-right tabular-nums">
              {formatPct(v.annualVolatility)}
            </span>
            <span className="flex-1 text-[10px] font-mono text-red-400 text-right tabular-nums">
              {formatPct(v.mdd)}
            </span>
            <span className="flex-1 text-[10px] font-mono text-zinc-300 text-right tabular-nums">
              {v.sharpe.toFixed(2)}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

function RiskVarSummary({ risk }: { risk: RiskAnalysis }) {
  const { var: varData, monteCarlo } = risk;
  const hasVar = varData.var95 !== 0 || varData.var99 !== 0;
  const hasMc = monteCarlo.expectedReturn !== 0 || monteCarlo.lossProbability !== 0;

  if (!hasVar && !hasMc) return null;

  return (
    <div className="rounded-lg border border-zinc-800 bg-zinc-900/40 px-4 py-3 space-y-3">
      <SectionHeader icon={ShieldCheck} label="위험 지표 (VaR / 몬테카를로)" />

      {hasVar && (
        <div className="grid grid-cols-3 gap-3">
          <div>
            <span className="text-[8px] font-mono text-zinc-600 uppercase">VaR 95%</span>
            <p className="text-[11px] font-mono text-red-400 mt-0.5">{formatPct(varData.var95)}</p>
          </div>
          <div>
            <span className="text-[8px] font-mono text-zinc-600 uppercase">VaR 99%</span>
            <p className="text-[11px] font-mono text-red-400 mt-0.5">{formatPct(varData.var99)}</p>
          </div>
          <div>
            <span className="text-[8px] font-mono text-zinc-600 uppercase">CVaR</span>
            <p className="text-[11px] font-mono text-red-400 mt-0.5">{formatPct(varData.cvar)}</p>
          </div>
        </div>
      )}

      {hasMc && (
        <div className="grid grid-cols-2 gap-3 pt-2 border-t border-zinc-800/40">
          <div>
            <span className="text-[8px] font-mono text-zinc-600 uppercase">기대수익률</span>
            <p className="text-[11px] font-mono text-green-400 mt-0.5">
              {formatPct(monteCarlo.expectedReturn)}
            </p>
          </div>
          <div>
            <span className="text-[8px] font-mono text-zinc-600 uppercase">손실확률</span>
            <p className="text-[11px] font-mono text-red-400 mt-0.5">
              {formatPct(monteCarlo.lossProbability)}
            </p>
          </div>
        </div>
      )}

      {/* Diversification score */}
      {risk.correlation.diversificationScore > 0 && (
        <div className="pt-2 border-t border-zinc-800/40">
          <span className="text-[8px] font-mono text-zinc-600 uppercase">분산투자 점수</span>
          <div className="mt-1 flex items-center gap-2">
            <div className="flex-1 h-1.5 rounded-full bg-zinc-800 overflow-hidden">
              <div
                className="h-full rounded-full bg-green-500/60 transition-all"
                style={{ width: `${Math.min(risk.correlation.diversificationScore * 100, 100)}%` }}
              />
            </div>
            <span className="text-[9px] font-mono text-zinc-400 tabular-nums">
              {(risk.correlation.diversificationScore * 100).toFixed(0)}%
            </span>
          </div>
        </div>
      )}
    </div>
  );
}

function RiskScenarios({ risk }: { risk: RiskAnalysis }) {
  if (risk.scenarios.length === 0) return null;

  return (
    <div className="rounded-lg border border-zinc-800 bg-zinc-900/40 px-4 py-3">
      <SectionHeader icon={TrendingDown} label="시나리오 분석" />
      <div className="space-y-2">
        {risk.scenarios.map((s, i) => (
          <div key={i} className="flex items-start gap-3">
            <span
              className={`shrink-0 text-[10px] font-mono font-bold tabular-nums ${
                s.impact < 0 ? 'text-red-400' : 'text-green-400'
              }`}
            >
              {s.impact > 0 ? '+' : ''}{formatPct(s.impact)}
            </span>
            <div className="flex-1">
              <span className="text-[10px] font-mono text-zinc-200">{s.name}</span>
              {s.description && (
                <p className="text-[9px] text-zinc-500 mt-0.5 leading-relaxed">{s.description}</p>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function RiskAnomalies({ risk }: { risk: RiskAnalysis }) {
  if (risk.anomalies.length === 0) return null;

  return (
    <div className="space-y-1.5">
      {risk.anomalies.map((a, i) => {
        const colorClass = SEVERITY_COLOR[a.severity] ?? SEVERITY_COLOR.medium;
        return (
          <div key={i} className={`flex items-center gap-2 px-3 py-2 rounded-lg border ${colorClass}`}>
            <AlertTriangle className="shrink-0 w-3 h-3" />
            <div className="flex-1">
              <span className="text-[10px]">
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

// ── Main component ──

export default function PortfolioResultView({ data }: { data: PortfolioFullResult }) {
  const sectorEntries = Object.entries(data.sectorExposure).sort((a, b) => b[1] - a[1]);
  const maxSector = sectorEntries.length > 0 ? sectorEntries[0][1] : 100;

  return (
    <div className="space-y-4">
      {/* Summary bar */}
      <div className="flex items-center justify-between px-3 py-2 rounded-lg border border-zinc-800 bg-zinc-900/40">
        <div className="flex items-center gap-4 text-[10px] font-mono flex-wrap">
          <span className="text-zinc-500">
            투자 <span className="text-zinc-200 font-bold">{formatUsd(data.totalInvested)}</span>
          </span>
          <span className="text-zinc-700">|</span>
          <span className="text-zinc-500">
            잔여 <span className="text-zinc-200">{formatUsd(data.cashRemaining)}</span>
          </span>
          <span className="text-zinc-700">|</span>
          <span className="text-zinc-500">
            성향 <span className="text-zinc-300">{data.styleKo}</span>
          </span>
          <span className="text-zinc-700">|</span>
          <span className="text-zinc-500">
            기간 <span className="text-zinc-300">{data.periodKo}</span>
          </span>
          {data.totalElapsedSec != null && (
            <>
              <span className="text-zinc-700">|</span>
              <span className="text-zinc-500">
                소요 <span className="text-zinc-300">{data.totalElapsedSec.toFixed(1)}s</span>
              </span>
            </>
          )}
        </div>
        {data.generatedAt && (
          <span className="text-[8px] font-mono text-zinc-600 shrink-0 ml-2">
            {new Date(data.generatedAt).toLocaleString('ko-KR', { month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', hour12: false })}
          </span>
        )}
      </div>

      {/* XAI: Portfolio narrative + Risk narrative + Scenario */}
      {data.xai && <XaiNarratives xai={data.xai} />}

      {/* Thesis */}
      {data.portfolioThesis && (
        <div className="rounded-lg border border-zinc-800 bg-zinc-900/40 px-4 py-3">
          <span className="text-[9px] font-mono text-zinc-600 uppercase tracking-wider">포트폴리오 전략</span>
          <p className="text-[12px] text-zinc-200 leading-relaxed mt-1">{data.portfolioThesis}</p>
        </div>
      )}

      {/* Allocations table */}
      <div className="rounded-lg border border-zinc-800 overflow-hidden">
        <div className="px-3 py-1.5 bg-zinc-800/30 flex items-center justify-between">
          <span className="text-[9px] font-mono font-bold text-zinc-500 uppercase tracking-widest">종목 배분</span>
          <span className="text-[9px] font-mono text-zinc-600">{data.allocations.length}종목</span>
        </div>
        {/* Header */}
        <div className="px-3 py-1 bg-zinc-900/60 border-b border-zinc-800/40 flex items-center gap-2 text-[8px] font-mono text-zinc-600 uppercase">
          <span className="w-[60px]">Ticker</span>
          <span className="flex-1">종목명</span>
          <span className="w-[50px] text-right">주수</span>
          <span className="w-[70px] text-right">금액</span>
          <span className="w-[45px] text-right">비중</span>
        </div>
        {/* Rows */}
        <div className="divide-y divide-zinc-800/40">
          {data.allocations.map((a) => (
            <div key={a.ticker} className="px-3 py-2 hover:bg-zinc-800/20 transition-colors">
              <div className="flex items-center gap-2">
                <span className="w-[60px] text-[11px] font-mono font-bold text-zinc-100">{a.ticker}</span>
                <span className="flex-1 text-[10px] text-zinc-400 truncate">{a.name || '-'}</span>
                <span className="w-[50px] text-[10px] font-mono text-zinc-300 text-right tabular-nums">{a.shares}주</span>
                <span className="w-[70px] text-[10px] font-mono text-zinc-200 text-right tabular-nums">{formatUsd(a.amount)}</span>
                <span className="w-[45px] text-[10px] font-mono text-zinc-400 text-right tabular-nums">{a.weightPct.toFixed(1)}%</span>
              </div>
              {a.rationale && (
                <p className="text-[9px] text-zinc-500 mt-1 ml-[60px] leading-relaxed line-clamp-2">{a.rationale}</p>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* XAI: Stock briefs */}
      {data.xai && <XaiStockBriefs xai={data.xai} />}

      {/* Sector exposure + Risk side by side */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {/* Sectors */}
        {sectorEntries.length > 0 && (
          <div className="rounded-lg border border-zinc-800 bg-zinc-900/40 px-4 py-3">
            <span className="text-[9px] font-mono text-zinc-600 uppercase tracking-wider">섹터 비중</span>
            <div className="mt-2 space-y-1.5">
              {sectorEntries.map(([sector, pct]) => (
                <div key={sector}>
                  <div className="flex items-center justify-between mb-0.5">
                    <span className="text-[10px] text-zinc-300">{sector}</span>
                    <span className="text-[9px] font-mono text-zinc-400 tabular-nums">{pct}%</span>
                  </div>
                  <div className="h-1 rounded-full bg-zinc-800 overflow-hidden">
                    <div
                      className="h-full rounded-full bg-green-500/60 transition-all"
                      style={{ width: `${(pct / maxSector) * 100}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Risk assessment (basic) */}
        <div className="rounded-lg border border-zinc-800 bg-zinc-900/40 px-4 py-3 space-y-3">
          <span className="text-[9px] font-mono text-zinc-600 uppercase tracking-wider">리스크 평가</span>
          {data.riskAssessment.level && (
            <div className="flex items-center gap-2">
              <span className="text-[9px] font-mono text-zinc-500">수준</span>
              <span className={`text-[11px] font-mono font-bold ${RISK_COLOR[data.riskAssessment.level] ?? 'text-zinc-400'}`}>
                {data.riskAssessment.level.toUpperCase()}
              </span>
            </div>
          )}
          {data.riskAssessment.maxDrawdownEst && (
            <div className="flex items-center gap-2">
              <span className="text-[9px] font-mono text-zinc-500">예상 MDD</span>
              <span className="text-[11px] font-mono text-red-400">{data.riskAssessment.maxDrawdownEst}</span>
            </div>
          )}
          {data.riskAssessment.volatilityNote && (
            <p className="text-[9px] text-zinc-500">{data.riskAssessment.volatilityNote}</p>
          )}
          {data.rebalanceTrigger && (
            <div>
              <span className="text-[9px] font-mono text-zinc-600">리밸런싱</span>
              <p className="text-[9px] text-zinc-400 mt-0.5">{data.rebalanceTrigger}</p>
            </div>
          )}
        </div>
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
        <div className="space-y-1.5">
          {data.warnings.map((w, i) => (
            <div key={i} className="flex items-center gap-2 px-3 py-2 rounded-lg border border-yellow-500/20 bg-yellow-500/5">
              <AlertTriangle className="shrink-0 w-3 h-3 text-yellow-400" />
              <span className="text-[10px] text-yellow-300">{w}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
