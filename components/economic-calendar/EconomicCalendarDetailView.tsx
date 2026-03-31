'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { ArrowLeft, RefreshCw } from 'lucide-react';
import {
  fetchEconomicCalendar,
  apiEconomicCalendarToDisplay,
} from '@/lib/api';
import {
  ECON_CALENDAR_DETAIL_LIMIT,
  ECON_CALENDAR_AUTO_REFRESH_MIN_MS,
  ECON_CALENDAR_AUTO_REFRESH_MAX_MS,
} from '@/lib/constants';
import type {
  EconomicCalendarItem,
  ApiEconomicCalendarError,
} from '@/types/dashboard';

type ImportanceFilter = 'all' | 'high' | 'medium' | 'low';

const IMPORTANCE_FILTERS: { key: ImportanceFilter; label: string }[] = [
  { key: 'all', label: '전체' },
  { key: 'high', label: 'High' },
  { key: 'medium', label: 'Medium' },
  { key: 'low', label: 'Low' },
];

function importanceBadgeClass(importance: 0 | 1 | 2 | 3): string {
  if (importance === 3)
    return 'text-red-400 border-red-500/40 bg-red-500/10';
  if (importance === 2)
    return 'text-yellow-400 border-yellow-500/40 bg-yellow-500/10';
  return 'text-zinc-400 border-zinc-600/40 bg-zinc-800/40';
}

function importanceLabel(importance: 0 | 1 | 2 | 3): 'High' | 'Medium' | 'Low' {
  if (importance === 3) return 'High';
  if (importance === 2) return 'Medium';
  return 'Low';
}

function matchesImportance(
  item: EconomicCalendarItem,
  filter: ImportanceFilter,
): boolean {
  if (filter === 'all') return true;
  if (filter === 'high') return item.importance === 3;
  if (filter === 'medium') return item.importance === 2;
  return item.importance <= 1;
}

function ValueCell({ label, value }: { label: string; value: string | null }) {
  const hasValue = value !== null && value.trim() !== '' && value !== '-';
  return (
    <div className="text-center min-w-[60px]">
      <div className="text-[9px] text-zinc-500 mb-0.5">{label}</div>
      <div
        className={`text-[11px] font-mono tabular-nums ${hasValue ? 'text-zinc-100' : 'text-zinc-600'}`}
      >
        {hasValue ? value : '-'}
      </div>
    </div>
  );
}

export default function EconomicCalendarDetailView() {
  const [items, setItems] = useState<EconomicCalendarItem[]>([]);
  const [error, setError] = useState<ApiEconomicCalendarError | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [fetchedAt, setFetchedAt] = useState<string | null>(null);
  const [source, setSource] = useState<string>('');
  const [cacheTtlSec, setCacheTtlSec] = useState(0);
  const [importanceFilter, setImportanceFilter] =
    useState<ImportanceFilter>('all');
  const [countryFilter, setCountryFilter] = useState('');

  const loadData = useCallback(async (refresh: 0 | 1) => {
    if (refresh === 1) {
      setIsRefreshing(true);
    } else {
      setIsLoading(true);
    }

    try {
      const res = await fetchEconomicCalendar({
        refresh,
        limit: ECON_CALENDAR_DETAIL_LIMIT,
      });
      setItems(apiEconomicCalendarToDisplay(res));
      setFetchedAt(res.fetched_at);
      setSource(res.source);
      setCacheTtlSec(res.cache_ttl_sec);
      setError(res.error);
    } catch (err: unknown) {
      const msg =
        err instanceof Error ? err.message : '경제 일정을 불러올 수 없습니다';
      setError({ code: 'FETCH_ERROR', message: msg });
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  // initial load
  useEffect(() => {
    void loadData(0);
  }, [loadData]);

  // auto-refresh based on cache TTL
  useEffect(() => {
    if (cacheTtlSec <= 0) return;

    const ttlMs = cacheTtlSec * 1000;
    const delay = Math.max(
      ECON_CALENDAR_AUTO_REFRESH_MIN_MS,
      Math.min(ECON_CALENDAR_AUTO_REFRESH_MAX_MS, ttlMs),
    );

    const timer = setTimeout(() => {
      void loadData(0);
    }, delay);

    return () => clearTimeout(timer);
  }, [cacheTtlSec, loadData]);

  const countries = Array.from(
    new Set(items.map((i) => i.countryCode).filter(Boolean)),
  ).sort();

  const filteredItems = items.filter((item) => {
    if (!matchesImportance(item, importanceFilter)) return false;
    if (countryFilter && item.countryCode !== countryFilter) return false;
    return true;
  });

  // group by dateLabel
  const grouped = new Map<string, EconomicCalendarItem[]>();
  for (const item of filteredItems) {
    const key = item.dateLabel || '날짜 미정';
    const arr = grouped.get(key);
    if (arr) {
      arr.push(item);
    } else {
      grouped.set(key, [item]);
    }
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-zinc-100">
      {/* Header */}
      <header className="sticky top-0 z-10 bg-zinc-900/95 backdrop-blur border-b border-zinc-800">
        <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Link
              href="/"
              className="inline-flex items-center gap-1.5 text-[11px] text-zinc-400 hover:text-zinc-200 transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              터미널
            </Link>
            <span className="text-zinc-700">|</span>
            <h1 className="text-sm font-mono font-bold tracking-wider">
              경제 일정
            </h1>
          </div>
          <button
            type="button"
            onClick={() => void loadData(1)}
            disabled={isRefreshing}
            className="inline-flex items-center gap-1.5 text-[10px] font-mono px-2.5 py-1.5 rounded border border-zinc-700 text-zinc-300 hover:bg-zinc-700/60 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <RefreshCw
              className={`w-3 h-3 ${isRefreshing ? 'animate-spin' : ''}`}
            />
            {isRefreshing ? '갱신중...' : '새로고침'}
          </button>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-4">
        {/* Meta info */}
        {fetchedAt && (
          <div className="flex flex-wrap items-center gap-3 mb-4 text-[10px] font-mono text-zinc-500">
            <span>
              소스: <span className="text-zinc-300">{source}</span>
            </span>
          </div>
        )}

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-3 mb-4">
          <div className="flex items-center gap-1.5">
            <span className="text-[10px] text-zinc-500 font-mono mr-1">
              중요도
            </span>
            {IMPORTANCE_FILTERS.map((f) => (
              <button
                key={f.key}
                type="button"
                onClick={() => setImportanceFilter(f.key)}
                className={`text-[10px] font-mono px-2 py-1 rounded border transition-colors ${
                  importanceFilter === f.key
                    ? 'border-green-500/50 bg-green-500/10 text-green-400'
                    : 'border-zinc-700 text-zinc-400 hover:bg-zinc-800'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>

          <span className="text-zinc-700">|</span>

          <div className="flex items-center gap-1.5">
            <span className="text-[10px] text-zinc-500 font-mono mr-1">
              국가
            </span>
            <select
              value={countryFilter}
              onChange={(e) => setCountryFilter(e.target.value)}
              className="text-[10px] font-mono px-2 py-1 rounded border border-zinc-700 bg-zinc-900 text-zinc-300 hover:bg-zinc-800 transition-colors"
              aria-label="국가 필터"
            >
              <option value="">전체</option>
              {countries.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>

          {(importanceFilter !== 'all' || countryFilter) && (
            <span className="text-[10px] text-zinc-500 font-mono">
              {filteredItems.length}건 표시
            </span>
          )}
        </div>

        {/* Error */}
        {error && (
          <div className="mb-4 px-3 py-2 rounded border border-red-500/30 bg-red-500/5 text-[11px] text-red-400">
            {error.message}
          </div>
        )}

        {/* Loading */}
        {isLoading ? (
          <div className="space-y-3">
            {Array.from({ length: 8 }).map((_, i) => (
              <div
                key={i}
                className="h-14 bg-zinc-800/50 rounded animate-pulse"
              />
            ))}
          </div>
        ) : filteredItems.length === 0 ? (
          <div className="text-center py-12 text-[11px] text-zinc-500">
            {items.length === 0
              ? '표시할 경제 일정이 없습니다'
              : '필터 조건에 맞는 일정이 없습니다'}
          </div>
        ) : (
          <div className="space-y-6">
            {Array.from(grouped.entries()).map(([dateLabel, groupItems]) => (
              <section key={dateLabel}>
                <div className="sticky top-[53px] z-[5] bg-[#0a0a0a]/95 backdrop-blur py-1.5 mb-2 border-b border-zinc-800">
                  <h2 className="text-[11px] font-mono font-semibold text-zinc-300 tracking-wide">
                    {dateLabel}
                  </h2>
                </div>
                <div className="space-y-1">
                  {groupItems.map((item) => (
                    <div
                      key={item.id}
                      className="flex items-start gap-3 px-3 py-2.5 rounded bg-zinc-900 border border-zinc-800/60 hover:border-zinc-700/80 transition-colors"
                    >
                      {/* Time + Country */}
                      <div className="shrink-0 w-[80px]">
                        <div className="font-mono text-[11px] text-zinc-300 tabular-nums">
                          {item.timeLabel || '시간미정'}
                        </div>
                        <div className="font-mono text-[10px] text-zinc-500 mt-0.5">
                          {item.countryCode || '--'}
                          {item.countryName && (
                            <span className="text-zinc-600">
                              {' '}
                              {item.countryName}
                            </span>
                          )}
                        </div>
                        <div className="text-[9px] text-zinc-600 mt-0.5">
                          {item.currency}
                        </div>
                      </div>

                      {/* Event + Importance */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-0.5">
                          <span
                            className={`text-[9px] px-1.5 py-0.5 rounded border shrink-0 ${importanceBadgeClass(item.importance)}`}
                          >
                            {importanceLabel(item.importance)}
                          </span>
                          <span className="text-[11px] text-zinc-100 leading-snug truncate">
                            {item.event}
                          </span>
                        </div>
                      </div>

                      {/* Values */}
                      <div className="shrink-0 flex items-center gap-3">
                        <ValueCell label="실제" value={item.actual} />
                        <ValueCell label="예측" value={item.forecast} />
                        <ValueCell label="이전" value={item.previous} />
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
