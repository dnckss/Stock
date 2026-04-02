'use client';

import { AlertTriangle } from 'lucide-react';
import type { PortfolioResult } from '@/types/dashboard';

const RISK_COLOR: Record<string, string> = {
  low: 'text-green-400',
  medium: 'text-yellow-400',
  high: 'text-red-400',
};

function formatUsd(v: number): string {
  return `$${v.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export default function PortfolioResultView({ data }: { data: PortfolioResult }) {
  const sectorEntries = Object.entries(data.sectorExposure).sort((a, b) => b[1] - a[1]);
  const maxSector = sectorEntries.length > 0 ? sectorEntries[0][1] : 100;

  return (
    <div className="space-y-4">
      {/* Summary bar */}
      <div className="flex items-center justify-between px-3 py-2 rounded-lg border border-zinc-800 bg-zinc-900/40">
        <div className="flex items-center gap-4 text-[10px] font-mono">
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
        </div>
        {data.generatedAt && (
          <span className="text-[8px] font-mono text-zinc-600">
            {new Date(data.generatedAt).toLocaleString('ko-KR', { month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', hour12: false })}
          </span>
        )}
      </div>

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

        {/* Risk */}
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
