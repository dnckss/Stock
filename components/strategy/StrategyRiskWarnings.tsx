'use client';

import { AlertTriangle } from 'lucide-react';
import { STRATEGY_RISK_WARNING_CONFIG } from '@/lib/strategyConstants';
import type { RiskWarning } from '@/types/dashboard';

export default function StrategyRiskWarnings({ warnings }: { warnings: RiskWarning[] }) {
  if (warnings.length === 0) return null;

  return (
    <div className="space-y-1.5">
      {warnings.map((w, i) => {
        const cfg = STRATEGY_RISK_WARNING_CONFIG[w.level];
        return (
          <div
            key={`${w.level}-${i}`}
            className={`flex items-center gap-2.5 px-4 py-2 rounded-lg border ${cfg.border} ${cfg.bg}`}
          >
            <AlertTriangle className={`shrink-0 w-3.5 h-3.5 ${cfg.icon}`} />
            <span className={`text-[11px] font-mono ${cfg.text}`}>
              {w.message}
            </span>
          </div>
        );
      })}
    </div>
  );
}
