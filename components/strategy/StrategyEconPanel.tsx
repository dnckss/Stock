'use client';

import type { EconAnalysis, EconImpactType, RiskLevel } from '@/types/dashboard';

const IMPACT_CONFIG: Record<EconImpactType, { dot: string; text: string; label: string }> = {
  positive: { dot: 'bg-green-500', text: 'text-green-400', label: '+' },
  negative: { dot: 'bg-red-500', text: 'text-red-400', label: '-' },
  neutral: { dot: 'bg-zinc-500', text: 'text-zinc-400', label: '~' },
};

const RISK_CONFIG: Record<RiskLevel, { text: string; border: string; label: string }> = {
  high: { text: 'text-red-400', border: 'border-l-red-500', label: 'HIGH' },
  medium: { text: 'text-yellow-400', border: 'border-l-yellow-500', label: 'MED' },
  low: { text: 'text-zinc-400', border: 'border-l-zinc-600', label: 'LOW' },
};

export default function StrategyEconPanel({ data }: { data: EconAnalysis | null }) {
  if (!data) return null;
  const { summary, recentSurprises, upcomingRisks } = data;
  if (!summary && recentSurprises.length === 0 && upcomingRisks.length === 0) return null;

  return (
    <div className="rounded-lg border border-zinc-800 bg-zinc-900/40 overflow-hidden h-full flex flex-col">
      {/* Summary */}
      {summary && (
        <>
          <div className="px-4 py-2 bg-zinc-800/40 border-b border-zinc-800 flex items-center gap-2">
            <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />
            <h2 className="text-[10px] font-mono font-bold text-zinc-400 uppercase tracking-widest">
              Econ Impact
            </h2>
          </div>
          <div className="px-4 py-3 border-b border-zinc-800/60">
            <p className="text-[11px] text-zinc-300 leading-relaxed">{summary}</p>
          </div>
        </>
      )}

      {/* Recent Surprises */}
      {recentSurprises.length > 0 && (
        <>
          <div className="px-4 py-1.5 bg-zinc-800/30 border-b border-zinc-800/40 flex items-center justify-between">
            <span className="text-[9px] font-mono text-zinc-500 uppercase tracking-wider">
              Recent Surprises
            </span>
            <span className="text-[9px] font-mono text-zinc-600">{recentSurprises.length}</span>
          </div>
          <div className="divide-y divide-zinc-800/40">
            {recentSurprises.map((s, i) => {
              const cfg = IMPACT_CONFIG[s.impact];
              return (
                <div key={`${s.event}-${i}`} className="px-4 py-2 hover:bg-zinc-800/20 transition-colors">
                  <div className="flex items-center justify-between gap-2 mb-0.5">
                    <div className="flex items-center gap-1.5 min-w-0">
                      <span className={`shrink-0 h-1.5 w-1.5 rounded-full ${cfg.dot}`} />
                      <span className="text-[11px] text-zinc-200 truncate">{s.event}</span>
                    </div>
                    {(s.actual || s.forecast) && (
                      <div className="shrink-0 flex items-center gap-1 text-[9px] font-mono">
                        {s.actual && <span className={cfg.text}>A:{s.actual}</span>}
                        {s.forecast && <span className="text-zinc-500">F:{s.forecast}</span>}
                      </div>
                    )}
                  </div>
                  {s.detail && (
                    <p className="text-[10px] text-zinc-500 ml-3 line-clamp-1">{s.detail}</p>
                  )}
                </div>
              );
            })}
          </div>
        </>
      )}

      {/* Upcoming Risks */}
      {upcomingRisks.length > 0 && (
        <>
          <div className="px-4 py-1.5 bg-zinc-800/30 border-b border-zinc-800/40 flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <span className="h-1.5 w-1.5 rounded-full bg-red-500 animate-pulse" />
              <span className="text-[9px] font-mono text-zinc-500 uppercase tracking-wider">
                Upcoming Risks
              </span>
            </div>
            <span className="text-[9px] font-mono text-zinc-600">{upcomingRisks.length}</span>
          </div>
          <div className="flex-1 divide-y divide-zinc-800/40">
            {upcomingRisks.map((r, i) => {
              const cfg = RISK_CONFIG[r.riskLevel];
              return (
                <div
                  key={`${r.event}-${i}`}
                  className={`px-4 py-2 border-l-2 ${cfg.border} hover:bg-zinc-800/20 transition-colors`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[11px] text-zinc-200 truncate">{r.event}</span>
                    <span className={`shrink-0 text-[9px] font-mono font-bold ${cfg.text}`}>
                      {cfg.label}
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    {r.date && <span className="text-[9px] font-mono text-zinc-500">{r.date}</span>}
                    {r.detail && r.date && <span className="text-zinc-700 text-[9px]">&middot;</span>}
                    {r.detail && <span className="text-[9px] text-zinc-500 truncate">{r.detail}</span>}
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}
