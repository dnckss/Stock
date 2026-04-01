'use client';

import type { EconAnalysis, EconImpactType, RiskLevel } from '@/types/dashboard';

const IMPACT_DOT: Record<EconImpactType, string> = {
  positive: 'bg-green-500',
  negative: 'bg-red-500',
  neutral: 'bg-zinc-500',
};

const RISK_BORDER: Record<RiskLevel, string> = {
  high: 'border-l-red-500',
  medium: 'border-l-yellow-500',
  low: 'border-l-zinc-600',
};

const RISK_TEXT: Record<RiskLevel, string> = {
  high: 'text-red-400',
  medium: 'text-yellow-400',
  low: 'text-zinc-500',
};

export default function StrategyEconPanel({ data }: { data: EconAnalysis | null }) {
  if (!data) return null;
  const { summary, recentSurprises, upcomingRisks } = data;
  if (!summary && recentSurprises.length === 0 && upcomingRisks.length === 0) return null;

  return (
    <div className="border-b border-zinc-800">
      {summary && (
        <>
          <div className="px-3 py-1.5 bg-zinc-800/30 flex items-center gap-1.5">
            <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />
            <span className="text-[9px] font-mono font-bold text-zinc-500 uppercase tracking-widest">
              Econ Impact
            </span>
          </div>
          <div className="px-3 py-2">
            <p className="text-[10px] text-zinc-300 leading-relaxed">{summary}</p>
          </div>
        </>
      )}

      {recentSurprises.length > 0 && (
        <>
          <div className="px-3 py-1 bg-zinc-800/20 border-y border-zinc-800/30">
            <span className="text-[8px] font-mono text-zinc-600 uppercase tracking-wider">Surprises</span>
          </div>
          <div className="divide-y divide-zinc-800/20">
            {recentSurprises.map((s, i) => (
              <div key={`${s.event}-${i}`} className="px-3 py-1.5 flex items-center gap-2">
                <span className={`shrink-0 h-1.5 w-1.5 rounded-full ${IMPACT_DOT[s.impact]}`} />
                <span className="flex-1 text-[10px] text-zinc-300 truncate">{s.event}</span>
                <div className="shrink-0 flex gap-1.5 text-[9px] font-mono tabular-nums">
                  {s.actual && <span className="text-zinc-200">A:{s.actual}</span>}
                  {s.forecast && <span className="text-zinc-500">F:{s.forecast}</span>}
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {upcomingRisks.length > 0 && (
        <>
          <div className="px-3 py-1 bg-zinc-800/20 border-y border-zinc-800/30 flex items-center gap-1.5">
            <span className="h-1.5 w-1.5 rounded-full bg-red-500 animate-pulse" />
            <span className="text-[8px] font-mono text-zinc-600 uppercase tracking-wider">Upcoming Risks</span>
          </div>
          <div className="divide-y divide-zinc-800/20">
            {upcomingRisks.map((r, i) => (
              <div key={`${r.event}-${i}`} className={`px-3 py-1.5 border-l-2 ${RISK_BORDER[r.riskLevel]}`}>
                <div className="flex items-center justify-between gap-2">
                  <span className="text-[10px] text-zinc-300 truncate">{r.event}</span>
                  <span className={`shrink-0 text-[8px] font-mono font-bold ${RISK_TEXT[r.riskLevel]}`}>
                    {r.riskLevel.toUpperCase()}
                  </span>
                </div>
                {r.date && <span className="text-[8px] font-mono text-zinc-600">{r.date}</span>}
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
