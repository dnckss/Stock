'use client';

import { Calendar, TrendingUp, Users } from 'lucide-react';
import { FUNDAMENTALS_CHART_COLORS, EARNINGS_RECOMMENDATION_CONFIG } from '@/lib/constants';
import { formatDDay, formatDateKR } from '@/lib/api';
import QuarterlyChart from './QuarterlyChart';
import type { FundamentalsEarnings } from '@/types/dashboard';

export default function EarningsSection({
  earnings,
}: {
  earnings: FundamentalsEarnings | null;
}) {
  if (!earnings) {
    return (
      <div className="px-4 py-8 text-center">
        <span className="text-[11px] text-zinc-600">실적 데이터가 없습니다</span>
      </div>
    );
  }

  const recConfig = earnings.recommendation
    ? EARNINGS_RECOMMENDATION_CONFIG[earnings.recommendation] ?? null
    : null;

  return (
    <div className="px-4 py-4 space-y-4">
      {/* Next earnings date */}
      {earnings.nextEarningsDate && (
        <div className="rounded-xl border border-zinc-800/60 bg-zinc-900/40 px-3.5 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <Calendar className="w-4 h-4 text-zinc-500" />
            <div>
              <p className="text-[10px] text-zinc-500">다음 실적 발표</p>
              <p className="text-[12px] text-zinc-200 font-medium">
                {formatDateKR(earnings.nextEarningsDate)}
              </p>
            </div>
          </div>
          <span className="text-xs font-mono font-bold text-blue-400">
            {formatDDay(earnings.nextEarningsDate)}
          </span>
        </div>
      )}

      {/* EPS History chart */}
      {earnings.history.length > 0 && (
        <div>
          <div className="flex items-center gap-4 text-[10px] text-zinc-500 mb-2">
            <span className="flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full" style={{ background: FUNDAMENTALS_CHART_COLORS.epsActual }} />
              실제 EPS
            </span>
            <span className="flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full" style={{ background: FUNDAMENTALS_CHART_COLORS.epsEstimate }} />
              예상 EPS
            </span>
          </div>
          <QuarterlyChart
            data={earnings.history}
            bars={[
              { dataKey: 'epsActual', name: '실제 EPS', color: FUNDAMENTALS_CHART_COLORS.epsActual },
              { dataKey: 'epsEstimate', name: '예상 EPS', color: FUNDAMENTALS_CHART_COLORS.epsEstimate },
            ]}
            height={180}
          />
          {/* Surprise table */}
          <div className="mt-2 space-y-1">
            {[...earnings.history].reverse().slice(0, 4).map((h) => (
              <div key={h.date} className="flex items-center justify-between text-[10px] py-1 border-b border-zinc-800/20 last:border-b-0">
                <span className="text-zinc-500 w-14">{h.label}</span>
                <span className="text-zinc-300 font-mono tabular-nums">
                  {h.epsActual != null ? `$${h.epsActual.toFixed(2)}` : '-'}
                </span>
                <span className="text-zinc-500 font-mono tabular-nums">
                  vs {h.epsEstimate != null ? `$${h.epsEstimate.toFixed(2)}` : '-'}
                </span>
                <span
                  className={`font-mono font-medium tabular-nums ${
                    h.surprisePct != null
                      ? h.surprisePct >= 0
                        ? 'text-green-400'
                        : 'text-red-400'
                      : 'text-zinc-500'
                  }`}
                >
                  {h.surprisePct != null
                    ? `${h.surprisePct >= 0 ? '+' : ''}${h.surprisePct.toFixed(2)}%`
                    : '-'}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Analyst consensus */}
      {(recConfig || earnings.targetMeanPrice != null) && (
        <div className="rounded-xl border border-zinc-800/60 bg-zinc-900/40 px-3.5 py-3 space-y-2.5">
          <p className="text-[10px] font-medium text-zinc-500 uppercase tracking-wider">
            애널리스트 컨센서스
          </p>

          {recConfig && (
            <div className="flex items-center gap-2">
              <span
                className={`inline-flex text-[10px] font-bold font-mono px-2 py-0.5 rounded ${recConfig.bg} ${recConfig.color}`}
              >
                {recConfig.label}
              </span>
              {earnings.analystCount != null && (
                <span className="flex items-center gap-1 text-[10px] text-zinc-500">
                  <Users className="w-3 h-3" />
                  {earnings.analystCount}명
                </span>
              )}
            </div>
          )}

          {/* Target price range */}
          {earnings.targetMeanPrice != null && (
            <div>
              <div className="flex items-center gap-1.5 mb-1.5">
                <TrendingUp className="w-3 h-3 text-zinc-500" />
                <span className="text-[10px] text-zinc-500">목표가</span>
              </div>
              <div className="flex items-center justify-between text-[11px] font-mono tabular-nums">
                <span className="text-zinc-500">
                  {earnings.targetLowPrice != null ? `$${earnings.targetLowPrice.toFixed(2)}` : '-'}
                </span>
                <span className="text-zinc-100 font-bold text-xs">
                  ${earnings.targetMeanPrice.toFixed(2)}
                </span>
                <span className="text-zinc-500">
                  {earnings.targetHighPrice != null ? `$${earnings.targetHighPrice.toFixed(2)}` : '-'}
                </span>
              </div>
              {/* Range bar */}
              <div className="mt-1.5 h-1.5 rounded-full bg-zinc-800 relative overflow-hidden">
                {earnings.targetLowPrice != null && earnings.targetHighPrice != null && (
                  <div
                    className="absolute inset-y-0 rounded-full bg-gradient-to-r from-red-500/60 via-yellow-500/60 to-green-500/60"
                    style={{
                      left: '0%',
                      right: '0%',
                    }}
                  />
                )}
                {earnings.targetLowPrice != null &&
                  earnings.targetHighPrice != null &&
                  earnings.targetHighPrice > earnings.targetLowPrice && (
                    <div
                      className="absolute top-0 w-1.5 h-1.5 rounded-full bg-white border border-zinc-600"
                      style={{
                        left: `${((earnings.targetMeanPrice - earnings.targetLowPrice) / (earnings.targetHighPrice - earnings.targetLowPrice)) * 100}%`,
                        transform: 'translateX(-50%)',
                      }}
                    />
                  )}
              </div>
              <div className="flex items-center justify-between mt-0.5 text-[9px] text-zinc-600">
                <span>최저</span>
                <span>평균</span>
                <span>최고</span>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
