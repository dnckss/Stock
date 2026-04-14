'use client';

import { INDICATOR_GROUP_LABELS, INDICATOR_LABELS } from '@/lib/constants';
import type { FundamentalsIndicators } from '@/types/dashboard';

function IndicatorRow({ label, value, unit }: { label: string; value: number | string | null; unit: string }) {
  const displayValue =
    value === null || value === undefined
      ? '-'
      : typeof value === 'string'
        ? value
        : `${value.toFixed(2)}${unit ? ` ${unit}` : ''}`;

  const colorClass =
    typeof value === 'number' && unit === '%'
      ? value > 0
        ? 'text-green-400'
        : value < 0
          ? 'text-red-400'
          : 'text-zinc-200'
      : 'text-zinc-200';

  return (
    <div className="flex items-center justify-between py-2 border-b border-zinc-800/20 last:border-b-0">
      <span className="text-[11px] text-zinc-500">{label}</span>
      <span className={`text-[11px] font-mono tabular-nums ${colorClass}`}>
        {displayValue}
      </span>
    </div>
  );
}

function IndicatorGroup({
  groupKey,
  data,
}: {
  groupKey: string;
  data: { [K: string]: number | string | null };
}) {
  const title = INDICATOR_GROUP_LABELS[groupKey] ?? groupKey;
  const entries = Object.entries(data).filter(
    ([key]) => INDICATOR_LABELS[key] !== undefined,
  );

  if (entries.length === 0) return null;

  return (
    <div className="rounded-xl border border-zinc-800/60 bg-zinc-900/40 px-3.5 py-2">
      <p className="text-[10px] font-medium text-zinc-500 uppercase tracking-wider mb-1">
        {title}
      </p>
      {entries.map(([key, val]) => {
        const cfg = INDICATOR_LABELS[key];
        return (
          <IndicatorRow
            key={key}
            label={cfg.label}
            value={val}
            unit={cfg.unit}
          />
        );
      })}
    </div>
  );
}

export default function IndicatorsSection({
  indicators,
}: {
  indicators: FundamentalsIndicators | null;
}) {
  if (!indicators) {
    return (
      <div className="px-4 py-8 text-center">
        <span className="text-[11px] text-zinc-600">투자 지표 데이터가 없습니다</span>
      </div>
    );
  }

  return (
    <div className="px-4 py-4 space-y-3">
      <IndicatorGroup groupKey="valuation" data={{ ...indicators.valuation }} />
      <IndicatorGroup groupKey="perShare" data={{ ...indicators.perShare }} />
      <IndicatorGroup groupKey="dividends" data={{ ...indicators.dividends }} />
      <IndicatorGroup groupKey="financialHealth" data={{ ...indicators.financialHealth }} />
    </div>
  );
}
