'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import Link from 'next/link';
import { LineChart, Line, ResponsiveContainer } from 'recharts';
import { ECON_CALENDAR_SIDEBAR_PAGE_SIZE } from '@/lib/constants';
import type {
  MacroIndicator,
  FearGreedData,
  EconomicCalendarItem,
  ApiEconomicCalendarError,
} from '@/types/dashboard';

interface MacroIndicatorsProps {
  /** 3대지수 (백엔드 macro.indices) */
  indices: MacroIndicator[] | null;
  /** 기타 매크로 지표 (백엔드 macro.sidebar) */
  indicators: MacroIndicator[] | null;
  fearGreed: FearGreedData | null;
  isLoading: boolean;
  economicCalendar: EconomicCalendarItem[];
  economicError: ApiEconomicCalendarError | null;
  isEconomicLoading: boolean;
}

const FEAR_GREED_THRESHOLDS: { min: number; label: string; color: string }[] = [
  { min: 75, label: 'Extreme Greed', color: 'text-green-400' },
  { min: 55, label: 'Greed', color: 'text-green-500' },
  { min: 45, label: 'Neutral', color: 'text-yellow-500' },
  { min: 25, label: 'Fear', color: 'text-orange-500' },
  { min: 0, label: 'Extreme Fear', color: 'text-red-500' },
];

function getFearGreedStyle(value: number) {
  return (
    FEAR_GREED_THRESHOLDS.find((t) => value >= t.min) ??
    FEAR_GREED_THRESHOLDS[FEAR_GREED_THRESHOLDS.length - 1]
  );
}

function SparklineChart({
  data,
  positive,
}: {
  data: number[];
  positive: boolean;
}) {
  if (data.length < 2) return null;

  const chartData = data.map((value, index) => ({ index, value }));
  const color = positive ? '#22c55e' : '#ef4444';

  return (
    <div className="w-16 h-5 shrink-0">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={chartData}>
          <Line
            type="monotone"
            dataKey="value"
            stroke={color}
            strokeWidth={1.5}
            dot={false}
            isAnimationActive={false}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

/** 백엔드에서 내려준 지표 1개 — name, value, change, pct 그대로 표시 */
function MacroItem({ data }: { data: MacroIndicator }) {
  const isPositive = data.change >= 0;

  return (
    <div className="flex items-center justify-between py-2.5 px-3 hover:bg-zinc-800/30 transition-colors">
      <div className="flex-1 min-w-0">
        <div className="text-[9px] text-zinc-500 uppercase tracking-wider font-medium">
          {data.label}
        </div>
        <div className="flex items-baseline gap-2 mt-0.5">
          <span className="font-mono text-sm font-semibold text-zinc-100 tabular-nums">
            {data.value}
          </span>
          <span
            className={`font-mono text-[10px] font-medium ${
              isPositive ? 'text-green-500' : 'text-red-500'
            }`}
          >
            {data.changeLabel}
          </span>
        </div>
      </div>
      <SparklineChart data={data.sparkline} positive={isPositive} />
    </div>
  );
}

/** 3대지수 / 기타 지표 블록 — 제목 + 리스트 */
function MacroBlock({
  title,
  items,
}: {
  title: string;
  items: MacroIndicator[];
}) {
  if (items.length === 0) return null;

  return (
    <div className="border-b border-zinc-800">
      <div className="px-3 py-1.5 bg-zinc-800/30">
        <h3 className="text-[9px] font-semibold text-zinc-400 uppercase tracking-widest">
          {title}
        </h3>
      </div>
      <div className="divide-y divide-zinc-800/50">
        {items.map((indicator) => (
          <MacroItem key={indicator.id} data={indicator} />
        ))}
      </div>
    </div>
  );
}

function FearGreedGauge({ data }: { data: FearGreedData }) {
  const style = getFearGreedStyle(data.value);

  return (
    <div className="p-3 border-b border-zinc-800">
      <div className="text-[10px] font-medium text-zinc-500 uppercase tracking-wider mb-2">
        Fear &amp; Greed Index
      </div>
      <div className="flex items-end gap-2 mb-2.5">
        <span className="text-2xl font-mono font-bold text-zinc-100 leading-none tabular-nums">
          {data.value}
        </span>
        <span className={`text-xs font-semibold ${style.color} mb-0.5`}>
          {data.label || style.label}
        </span>
      </div>
      <div className="h-1.5 rounded-full bg-zinc-800 overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-700 ease-out"
          style={{
            width: `${Math.max(0, Math.min(100, data.value))}%`,
            background:
              'linear-gradient(90deg, #ef4444 0%, #f97316 30%, #eab308 50%, #22c55e 100%)',
          }}
        />
      </div>
      <div className="flex justify-between mt-1">
        <span className="text-[8px] text-zinc-600">Extreme Fear</span>
        <span className="text-[8px] text-zinc-600">Extreme Greed</span>
      </div>
    </div>
  );
}

function FearGreedSkeleton() {
  return (
    <div className="p-3 border-b border-zinc-800">
      <div className="h-2.5 w-32 bg-zinc-800 rounded animate-pulse mb-2.5" />
      <div className="flex items-end gap-2 mb-2.5">
        <div className="h-7 w-10 bg-zinc-800 rounded animate-pulse" />
        <div className="h-4 w-16 bg-zinc-800/70 rounded animate-pulse mb-0.5" />
      </div>
      <div className="h-1.5 w-full bg-zinc-800 rounded-full animate-pulse" />
    </div>
  );
}

function IndicatorSkeleton() {
  return (
    <div className="flex items-center justify-between py-2.5 px-3 border-b border-zinc-800/30">
      <div className="flex-1">
        <div className="h-2 w-14 bg-zinc-800 rounded animate-pulse mb-1.5" />
        <div className="flex items-baseline gap-2">
          <div className="h-3.5 w-16 bg-zinc-800 rounded animate-pulse" />
          <div className="h-2.5 w-10 bg-zinc-800/60 rounded animate-pulse" />
        </div>
      </div>
      <div className="h-5 w-16 bg-zinc-800/50 rounded animate-pulse" />
    </div>
  );
}

function importanceBadgeClass(importance: 0 | 1 | 2 | 3): string {
  if (importance === 3) return 'text-red-400 border-red-500/40 bg-red-500/10';
  if (importance === 2) return 'text-yellow-400 border-yellow-500/40 bg-yellow-500/10';
  return 'text-zinc-300 border-zinc-600/40 bg-zinc-700/20';
}

function importanceLabel(importance: 0 | 1 | 2 | 3): 'High' | 'Medium' | 'Low' {
  if (importance === 3) return 'High';
  if (importance === 2) return 'Medium';
  return 'Low';
}

function EconomicCalendarSection({
  items,
  error,
  isLoading,
}: {
  items: EconomicCalendarItem[];
  error: ApiEconomicCalendarError | null;
  isLoading: boolean;
}) {
  const [visibleCount, setVisibleCount] = useState(ECON_CALENDAR_SIDEBAR_PAGE_SIZE);
  const sentinelRef = useRef<HTMLDivElement>(null);

  // items가 바뀌면(새 데이터 fetch 시) 페이지 초기화
  useEffect(() => {
    setVisibleCount(ECON_CALENDAR_SIDEBAR_PAGE_SIZE);
  }, [items]);

  const loadMore = useCallback(() => {
    setVisibleCount((prev) =>
      Math.min(prev + ECON_CALENDAR_SIDEBAR_PAGE_SIZE, items.length),
    );
  }, [items.length]);

  useEffect(() => {
    const el = sentinelRef.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) {
          loadMore();
        }
      },
      { rootMargin: '100px' },
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [loadMore]);

  const visibleItems = items.slice(0, visibleCount);
  const hasMore = visibleCount < items.length;

  return (
    <div className="border-t border-zinc-800">
      <div className="px-3 py-2 bg-zinc-800/30 flex items-center justify-between gap-2">
        <h3 className="text-[9px] font-semibold text-zinc-400 uppercase tracking-widest">
          경제 일정
        </h3>
        <Link
          href="/economic-calendar"
          className="text-[9px] font-mono px-2 py-1 rounded border border-zinc-700 text-zinc-300 hover:bg-zinc-700/60 transition-colors"
        >
          자세히 보기
        </Link>
      </div>

      {isLoading ? (
        <div className="px-3 py-3 space-y-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-8 bg-zinc-800/50 rounded animate-pulse" />
          ))}
        </div>
      ) : items.length === 0 && error ? (
        <div className="px-3 py-4 text-[10px] text-zinc-500">
          데이터 수집 지연
        </div>
      ) : items.length === 0 ? (
        <div className="px-3 py-4 text-[10px] text-zinc-500">
          표시할 일정 없음
        </div>
      ) : (
        <div className="divide-y divide-zinc-800/40">
          {visibleItems.map((item) => (
            <div key={item.id} className="px-3 py-2.5">
              <div className="flex items-center justify-between gap-2 mb-1">
                <div className="font-mono text-[10px] text-zinc-400 tabular-nums">
                  {item.timeLabel || '시간미정'} · {item.countryCode || '--'}
                </div>
                <span
                  className={`text-[9px] px-1.5 py-0.5 rounded border ${importanceBadgeClass(item.importance)}`}
                >
                  {importanceLabel(item.importance)}
                </span>
              </div>
              <div className="text-[11px] text-zinc-100 leading-snug line-clamp-2">
                {item.event}
              </div>
              <div className="mt-1 font-mono text-[9px] text-zinc-500">
                A {item.actual ?? '-'} / F {item.forecast ?? '-'} / P {item.previous ?? '-'}
              </div>
            </div>
          ))}
          {hasMore && <div ref={sentinelRef} className="h-1" />}
        </div>
      )}
    </div>
  );
}

export default function MacroIndicators({
  indices,
  indicators,
  fearGreed,
  isLoading,
  economicCalendar,
  economicError,
  isEconomicLoading,
}: MacroIndicatorsProps) {
  const hasIndices = indices && indices.length > 0;
  const hasIndicators = indicators && indicators.length > 0;
  const hasData = hasIndices || hasIndicators || fearGreed;
  const showSkeleton = isLoading;
  const showEmpty = !isLoading && !hasData;

  return (
    <div className="h-full flex flex-col bg-zinc-900 border-r border-zinc-800">
      <div className="px-3 py-2 border-b border-zinc-800">
        <h2 className="text-[10px] font-semibold text-zinc-400 uppercase tracking-widest">
          Macro Overview
        </h2>
      </div>

      {showSkeleton ? (
        <>
          <FearGreedSkeleton />
          <div className="px-3 py-1.5 bg-zinc-800/30">
            <div className="h-2.5 w-20 bg-zinc-800 rounded animate-pulse" />
          </div>
          {Array.from({ length: 3 }).map((_, i) => (
            <IndicatorSkeleton key={i} />
          ))}
          <div className="px-3 py-1.5 bg-zinc-800/30 mt-2">
            <div className="h-2.5 w-24 bg-zinc-800 rounded animate-pulse" />
          </div>
          {Array.from({ length: 5 }).map((_, i) => (
            <IndicatorSkeleton key={i} />
          ))}
        </>
      ) : showEmpty ? (
        <div className="flex-1 flex items-center justify-center p-4 text-center">
          <p className="text-[10px] text-zinc-500">
            매크로 데이터를
            <br />
            불러오지 못했습니다
          </p>
        </div>
      ) : (
        <div className="flex-1 overflow-y-auto terminal-scroll">
          {fearGreed && <FearGreedGauge data={fearGreed} />}
          {hasIndices && <MacroBlock title="3대지수" items={indices} />}
          {hasIndicators && (
            <MacroBlock title="기타 지표" items={indicators} />
          )}
          <EconomicCalendarSection
            items={economicCalendar}
            error={economicError}
            isLoading={isEconomicLoading}
          />
        </div>
      )}
    </div>
  );
}
