'use client';

import { Landmark, TrendingUp, AlertCircle } from 'lucide-react';
import type { EconAnalysis, EconImpactType, RiskLevel } from '@/types/dashboard';

const IMPACT_DOT: Record<EconImpactType, string> = {
  positive: 'bg-emerald-500',
  negative: 'bg-red-500',
  neutral: 'bg-zinc-500',
};

const RISK_STYLES: Record<RiskLevel, { border: string; badge: string }> = {
  high: {
    border: 'border-l-red-500/50',
    badge: 'bg-red-500/10 text-red-400 border-red-500/20',
  },
  medium: {
    border: 'border-l-yellow-500/50',
    badge: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20',
  },
  low: {
    border: 'border-l-zinc-600/50',
    badge: 'bg-zinc-500/10 text-zinc-500 border-zinc-700/30',
  },
};

export default function StrategyEconPanel({ data }: { data: EconAnalysis | null }) {
  if (!data) return null;
  const { summary, recentSurprises, upcomingRisks } = data;
  if (!summary && recentSurprises.length === 0 && upcomingRisks.length === 0) return null;

  return (
    <div className="bg-zinc-900/40 border border-zinc-800/50 rounded-2xl overflow-hidden h-full">
      {/* Header */}
      <div className="px-5 py-3.5 border-b border-zinc-800/50 flex items-center gap-2">
        <Landmark className="w-4 h-4 text-zinc-500" />
        <span className="text-xs font-medium text-zinc-400 uppercase tracking-wider">
          Economic Impact
        </span>
      </div>

      {/* Summary */}
      {summary && (
        <div className="px-5 py-3.5 border-b border-zinc-800/30">
          <p className="text-sm text-zinc-300 leading-relaxed">{summary}</p>
        </div>
      )}

      {/* Surprises */}
      {recentSurprises.length > 0 && (
        <div>
          <div className="px-5 py-2 bg-zinc-800/20 border-b border-zinc-800/30 flex items-center gap-2">
            <TrendingUp className="w-3 h-3 text-zinc-600" />
            <span className="text-[10px] font-mono text-zinc-600 uppercase tracking-wider">
              Economic Surprises
            </span>
          </div>
          <div className="divide-y divide-zinc-800/20">
            {recentSurprises.map((s, i) => (
              <div key={`${s.event}-${i}`} className="px-5 py-2.5 flex items-center gap-3">
                <span className={`shrink-0 h-2 w-2 rounded-full ${IMPACT_DOT[s.impact]}`} />
                <span className="flex-1 text-sm text-zinc-300 truncate">{s.event}</span>
                <div className="shrink-0 flex gap-2 text-xs font-mono tabular-nums">
                  {s.actual && <span className="text-zinc-200">A:{s.actual}</span>}
                  {s.forecast && <span className="text-zinc-500">F:{s.forecast}</span>}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Upcoming Risks */}
      {upcomingRisks.length > 0 && (
        <div>
          <div className="px-5 py-2 bg-zinc-800/20 border-b border-zinc-800/30 flex items-center gap-2">
            <AlertCircle className="w-3 h-3 text-red-500/60" />
            <span className="text-[10px] font-mono text-zinc-600 uppercase tracking-wider">
              Upcoming Risks
            </span>
          </div>
          <div className="divide-y divide-zinc-800/20">
            {upcomingRisks.map((r, i) => {
              const style = RISK_STYLES[r.riskLevel];
              return (
                <div key={`${r.event}-${i}`} className={`px-5 py-2.5 border-l-2 ${style.border}`}>
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-sm text-zinc-300 truncate">{r.event}</span>
                    <span
                      className={`shrink-0 text-[10px] font-mono font-bold px-2 py-0.5 rounded-md border ${style.badge}`}
                    >
                      {r.riskLevel.toUpperCase()}
                    </span>
                  </div>
                  {r.date && (
                    <span className="text-[10px] font-mono text-zinc-600 mt-0.5 block">{r.date}</span>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
