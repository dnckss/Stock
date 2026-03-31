'use client';

import type { StrategyRiskEvent, RiskLevel } from '@/types/dashboard';

const RISK_CONFIG: Record<RiskLevel, { dot: string; text: string; border: string; label: string }> = {
  high: { dot: 'bg-red-500 animate-pulse', text: 'text-red-400', border: 'border-l-red-500', label: 'HIGH' },
  medium: { dot: 'bg-yellow-500', text: 'text-yellow-400', border: 'border-l-yellow-500', label: 'MED' },
  low: { dot: 'bg-zinc-500', text: 'text-zinc-400', border: 'border-l-zinc-600', label: 'LOW' },
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
    <div className="rounded-lg border border-zinc-800 bg-zinc-900/40 overflow-hidden h-full flex flex-col">
      {/* Econ Impact */}
      {econImpact && (
        <>
          <div className="px-4 py-2 bg-zinc-800/40 border-b border-zinc-800 flex items-center gap-2">
            <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />
            <h2 className="text-[10px] font-mono font-bold text-zinc-400 uppercase tracking-widest">
              Econ Impact
            </h2>
          </div>
          <div className="px-4 py-3 border-b border-zinc-800/60">
            <p className="text-[11px] text-zinc-300 leading-relaxed">
              {econImpact}
            </p>
          </div>
        </>
      )}

      {/* Risk Events */}
      {riskEvents.length > 0 && (
        <>
          <div className="px-4 py-2 bg-zinc-800/40 border-b border-zinc-800 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="h-1.5 w-1.5 rounded-full bg-red-500 animate-pulse" />
              <h2 className="text-[10px] font-mono font-bold text-zinc-400 uppercase tracking-widest">
                Risk Watch
              </h2>
            </div>
            <span className="text-[9px] font-mono text-zinc-600">
              {riskEvents.length} EVENTS
            </span>
          </div>
          <div className="flex-1 divide-y divide-zinc-800/40">
            {riskEvents.map((r) => {
              const cfg = RISK_CONFIG[r.riskLevel];
              return (
                <div
                  key={`${r.event}-${r.date}`}
                  className={`px-4 py-2.5 border-l-2 ${cfg.border} hover:bg-zinc-800/20 transition-colors`}
                >
                  <div className="flex items-center justify-between gap-2 mb-0.5">
                    <span className="text-[11px] font-medium text-zinc-200 truncate">
                      {r.event}
                    </span>
                    <span className={`shrink-0 text-[9px] font-mono font-bold ${cfg.text}`}>
                      {cfg.label}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    {r.date && (
                      <span className="text-[9px] font-mono text-zinc-500">
                        {r.date}
                      </span>
                    )}
                    {r.detail && (
                      <>
                        {r.date && <span className="text-zinc-700 text-[9px]">&middot;</span>}
                        <span className="text-[9px] text-zinc-500 truncate">
                          {r.detail}
                        </span>
                      </>
                    )}
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
