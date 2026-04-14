'use client';

import { formatMarketCap } from '@/lib/api';
import { FUNDAMENTALS_CHART_COLORS } from '@/lib/constants';
import QuarterlyChart from './QuarterlyChart';
import SummaryRow from './SummaryRow';
import type { StabilityQuarter } from '@/types/dashboard';

export default function StabilitySection({
  quarters,
}: {
  quarters: StabilityQuarter[];
}) {
  if (quarters.length === 0) {
    return (
      <div className="px-4 py-8 text-center">
        <span className="text-[11px] text-zinc-600">안정성 데이터가 없습니다</span>
      </div>
    );
  }

  const latest = quarters[quarters.length - 1];

  return (
    <div className="px-4 py-4 space-y-4">
      {/* Legend */}
      <div className="flex items-center gap-4 text-[10px] text-zinc-500">
        <span className="flex items-center gap-1.5">
          <span className="h-2 w-2 rounded-full" style={{ background: FUNDAMENTALS_CHART_COLORS.totalEquity }} />
          자기자본
        </span>
        <span className="flex items-center gap-1.5">
          <span className="h-2 w-2 rounded-full" style={{ background: FUNDAMENTALS_CHART_COLORS.totalDebt }} />
          총부채
        </span>
        <span className="flex items-center gap-1.5">
          <span className="h-2 w-2 rounded-sm" style={{ background: FUNDAMENTALS_CHART_COLORS.margin }} />
          부채비율
        </span>
      </div>

      {/* Chart */}
      <QuarterlyChart
        data={quarters}
        bars={[
          { dataKey: 'totalEquity', name: '자기자본', color: FUNDAMENTALS_CHART_COLORS.totalEquity },
          { dataKey: 'totalDebt', name: '총부채', color: FUNDAMENTALS_CHART_COLORS.totalDebt },
        ]}
        lines={[
          { dataKey: 'debtRatio', name: '부채비율', color: FUNDAMENTALS_CHART_COLORS.margin, yAxisId: 'right', unit: '%' },
        ]}
      />

      {/* Latest quarter summary */}
      {latest && (
        <div className="rounded-xl border border-zinc-800/60 bg-zinc-900/40 px-3.5 py-2">
          <p className="text-[10px] font-medium text-zinc-500 uppercase tracking-wider mb-1">
            최근 분기 ({latest.label})
          </p>
          <SummaryRow
            label="자기자본"
            value={latest.totalEquity != null ? formatMarketCap(latest.totalEquity) : '-'}
          />
          <SummaryRow
            label="총부채"
            value={latest.totalDebt != null ? formatMarketCap(latest.totalDebt) : '-'}
            color="text-red-400"
          />
          <SummaryRow
            label="부채비율"
            value={latest.debtRatio != null ? `${latest.debtRatio.toFixed(2)}%` : '-'}
            color={
              latest.debtRatio != null
                ? latest.debtRatio > 100
                  ? 'text-red-400'
                  : 'text-green-400'
                : undefined
            }
          />
        </div>
      )}
    </div>
  );
}
