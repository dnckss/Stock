'use client';

import { AlertTriangle } from 'lucide-react';
import { STRATEGY_RISK_WARNING_CONFIG } from '@/lib/strategyConstants';
import type { RiskWarning } from '@/types/dashboard';

export default function StrategyRiskWarnings({ warnings }: { warnings: RiskWarning[] }) {
  if (warnings.length === 0) return null;

  return (
    <div className="space-y-2">
      {warnings.map((w, i) => {
        const cfg = STRATEGY_RISK_WARNING_CONFIG[w.level];
        return (
          <div
            key={`${w.level}-${i}`}
            className={`flex items-center gap-3 px-5 py-3 rounded-xl border ${cfg.border} ${cfg.bg} backdrop-blur-sm`}
          >
            <AlertTriangle className={`shrink-0 w-4 h-4 ${cfg.icon}`} />
            <span className={`text-sm ${cfg.text}`}>
              {w.message}
            </span>
          </div>
        );
      })}
    </div>
  );
}
