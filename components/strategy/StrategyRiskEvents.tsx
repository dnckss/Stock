'use client';

import type { StrategyRiskEvent, RiskLevel } from '@/types/dashboard';

const RISK_STYLE: Record<RiskLevel, { text: string; bg: string; border: string; dot: string; label: string }> = {
  high: { text: 'text-red-400', bg: 'bg-red-500/10', border: 'border-red-500/30', dot: 'bg-red-400', label: 'HIGH' },
  medium: { text: 'text-yellow-400', bg: 'bg-yellow-500/10', border: 'border-yellow-500/30', dot: 'bg-yellow-400', label: 'MED' },
  low: { text: 'text-zinc-400', bg: 'bg-zinc-700/20', border: 'border-zinc-600/40', dot: 'bg-zinc-400', label: 'LOW' },
};

export default function StrategyRiskEvents({
  econImpact,
  riskEvents,
}: {
  econImpact: string | null;
  riskEvents: StrategyRiskEvent[];
}) {
  if (!econImpact && riskEvents.length === 0) return null;

  return (
    <section className="rounded-2xl border border-zinc-800/50 bg-zinc-900/60 backdrop-blur-xl p-6 relative overflow-hidden">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-zinc-700/60 to-transparent" />

      <div className="flex flex-col lg:flex-row gap-4">
        {/* Econ Impact */}
        {econImpact && (
          <div className="flex-1 rounded-xl border border-zinc-800/50 bg-zinc-950/20 p-4">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-8 h-8 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center justify-center">
                <span className="h-1.5 w-1.5 rounded-full bg-amber-400" />
              </div>
              <div>
                <h2 className="text-sm font-bold text-zinc-100 font-mono">
                  Econ Impact
                </h2>
                <p className="text-[10px] text-zinc-500">경제 이벤트 영향 분석</p>
              </div>
            </div>
            <p className="text-sm text-zinc-300 leading-relaxed whitespace-pre-line">
              {econImpact}
            </p>
          </div>
        )}

        {/* Risk Events */}
        {riskEvents.length > 0 && (
          <div
            className={`rounded-xl border border-zinc-800/50 bg-zinc-950/20 p-4 ${
              econImpact ? 'w-full lg:w-[400px]' : 'w-full'
            }`}
          >
            <div className="flex items-center gap-3 mb-3">
              <div className="w-8 h-8 rounded-lg bg-red-500/10 border border-red-500/20 flex items-center justify-center">
                <span className="h-1.5 w-1.5 rounded-full bg-red-400 animate-pulse" />
              </div>
              <div>
                <h2 className="text-sm font-bold text-zinc-100 font-mono">
                  Risk Events
                </h2>
                <p className="text-[10px] text-zinc-500">주의할 예정 이벤트</p>
              </div>
            </div>

            <div className="space-y-2">
              {riskEvents.map((r) => {
                const style = RISK_STYLE[r.riskLevel];
                return (
                  <div
                    key={`${r.event}-${r.date}`}
                    className="rounded-lg border border-zinc-800/40 bg-zinc-900/40 px-3 py-2.5"
                  >
                    <div className="flex items-center justify-between gap-2 mb-1">
                      <span className="text-xs font-medium text-zinc-200 truncate">
                        {r.event}
                      </span>
                      <span
                        className={`shrink-0 text-[9px] font-mono font-bold px-1.5 py-0.5 rounded border ${style.bg} ${style.border} ${style.text}`}
                      >
                        {style.label}
                      </span>
                    </div>
                    {r.date && (
                      <p className="text-[10px] font-mono text-zinc-500 mb-1">
                        {r.date}
                      </p>
                    )}
                    {r.detail && (
                      <p className="text-[11px] text-zinc-400 leading-relaxed line-clamp-2">
                        {r.detail}
                      </p>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
