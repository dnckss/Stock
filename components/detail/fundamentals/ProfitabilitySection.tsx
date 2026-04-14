'use client';

import { formatMarketCap } from '@/lib/api';
import { FUNDAMENTALS_CHART_COLORS } from '@/lib/constants';
import QuarterlyChart from './QuarterlyChart';
import SummaryRow from './SummaryRow';
import type { ProfitabilityQuarter } from '@/types/dashboard';

export default function ProfitabilitySection({
  quarters,
}: {
  quarters: ProfitabilityQuarter[];
}) {
  if (quarters.length === 0) {
    return (
      <div className="px-4 py-8 text-center">
        <span className="text-[11px] text-zinc-600">수익성 데이터가 없습니다</span>
      </div>
    );
  }

  const latest = quarters[quarters.length - 1];

  return (
    <div className="px-4 py-4 space-y-4">
      {/* Legend */}
      <div className="flex items-center gap-4 text-[10px] text-zinc-500">
        <span className="flex items-center gap-1.5">
          <span className="h-2 w-2 rounded-full" style={{ background: FUNDAMENTALS_CHART_COLORS.revenue }} />
          매출
        </span>
        <span className="flex items-center gap-1.5">
          <span className="h-2 w-2 rounded-full" style={{ background: FUNDAMENTALS_CHART_COLORS.netIncome }} />
          순이익
        </span>
        <span className="flex items-center gap-1.5">
          <span className="h-2 w-2 rounded-sm" style={{ background: FUNDAMENTALS_CHART_COLORS.margin }} />
          순이익률
        </span>
      </div>

      {/* Chart */}
      <QuarterlyChart
        data={quarters}
        bars={[
          { dataKey: 'revenue', name: '매출', color: FUNDAMENTALS_CHART_COLORS.revenue },
          { dataKey: 'netIncome', name: '순이익', color: FUNDAMENTALS_CHART_COLORS.netIncome },
        ]}
        lines={[
          { dataKey: 'netMargin', name: '순이익률', color: FUNDAMENTALS_CHART_COLORS.margin, yAxisId: 'right', unit: '%' },
        ]}
      />

      {/* Latest quarter summary */}
      {latest && (
        <div className="rounded-xl border border-zinc-800/60 bg-zinc-900/40 px-3.5 py-2">
          <p className="text-[10px] font-medium text-zinc-500 uppercase tracking-wider mb-1">
            최근 분기 ({latest.label})
          </p>
          <SummaryRow
            label="매출"
            value={latest.revenue != null ? formatMarketCap(latest.revenue) : '-'}
          />
          <SummaryRow
            label="순이익"
            value={latest.netIncome != null ? formatMarketCap(latest.netIncome) : '-'}
            color={
              latest.netIncome != null
                ? latest.netIncome >= 0
                  ? 'text-green-400'
                  : 'text-red-400'
                : undefined
            }
          />
          <SummaryRow
            label="순이익률"
            value={latest.netMargin != null ? `${latest.netMargin.toFixed(2)}%` : '-'}
          />
          <SummaryRow
            label="순이익 YoY"
            value={latest.netIncomeYoy != null ? `${latest.netIncomeYoy >= 0 ? '+' : ''}${latest.netIncomeYoy.toFixed(2)}%` : '-'}
            color={
              latest.netIncomeYoy != null
                ? latest.netIncomeYoy >= 0
                  ? 'text-green-400'
                  : 'text-red-400'
                : undefined
            }
          />
        </div>
      )}
    </div>
  );
}
