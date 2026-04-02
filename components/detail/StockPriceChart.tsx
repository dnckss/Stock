'use client';

import { useEffect, useRef, useState } from 'react';
import { Loader2, ChevronDown } from 'lucide-react';
import { createChart, CandlestickSeries, HistogramSeries } from 'lightweight-charts';
import type { IChartApi, ISeriesApi, CandlestickData, HistogramData, Time, UTCTimestamp } from 'lightweight-charts';
import {
  CHART_MINUTE_PERIODS,
  CHART_UPPER_PERIODS,
  CHART_MINUTE_LABELS,
  CHART_UPPER_LABELS,
} from '@/lib/constants';
import type { ChartBar, ChartPeriod } from '@/types/dashboard';

const UP_COLOR = '#ef4444';
const DOWN_COLOR = '#3b82f6';

function isIntraday(period: ChartPeriod): boolean {
  return period.endsWith('m');
}

/**
 * 분봉 → UTCTimestamp (초 단위)
 * 일봉 이상 → 'YYYY-MM-DD' 문자열
 */
function toTime(ts: string, intra: boolean): Time {
  const d = new Date(ts);
  if (intra) {
    return Math.floor(d.getTime() / 1000) as UTCTimestamp;
  }
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}` as Time;
}

/** time 기준 오름차순 정렬 키 추출 */
function timeToSortKey(t: Time): number {
  if (typeof t === 'number') return t;
  if (typeof t === 'string') return new Date(t).getTime();
  // BusinessDay
  return new Date((t as { year: number; month: number; day: number }).year,
    (t as { year: number; month: number; day: number }).month - 1,
    (t as { year: number; month: number; day: number }).day).getTime();
}

/** 중복 제거 + 오름차순 정렬 (lightweight-charts 필수 조건) */
function dedupSort<T extends { time: Time }>(data: T[]): T[] {
  const map = new Map<string | number, T>();
  for (const d of data) {
    const key = typeof d.time === 'number' ? d.time : String(d.time);
    map.set(key, d);
  }
  return Array.from(map.values()).sort((a, b) => timeToSortKey(a.time) - timeToSortKey(b.time));
}

function toCandlestick(bars: ChartBar[], intra: boolean): CandlestickData<Time>[] {
  return dedupSort(bars.map((b) => ({
    time: toTime(b.timestamp, intra),
    open: b.open, high: b.high, low: b.low, close: b.close,
  })));
}

function toVolume(bars: ChartBar[], intra: boolean): HistogramData<Time>[] {
  return dedupSort(bars.map((b) => ({
    time: toTime(b.timestamp, intra),
    value: b.volume,
    color: b.close >= b.open ? `${UP_COLOR}88` : `${DOWN_COLOR}88`,
  })));
}

/* ── Period selector (dropdown + tabs) ── */
function PeriodSelector({
  current,
  onChange,
  disabled,
}: {
  current: ChartPeriod;
  onChange: (p: ChartPeriod) => void;
  disabled: boolean;
}) {
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const isMinute = isIntraday(current);
  const minuteLabel = isMinute ? (CHART_MINUTE_LABELS[current] ?? current) : '분';

  // close dropdown on click outside
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
    }
    if (dropdownOpen) document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [dropdownOpen]);

  return (
    <div className="flex items-center gap-0.5">
      {/* Minute dropdown */}
      <div ref={dropdownRef} className="relative">
        <button
          type="button"
          onClick={() => setDropdownOpen((p) => !p)}
          disabled={disabled}
          className={`flex items-center gap-0.5 text-[11px] font-mono px-2 py-1 rounded transition-colors ${
            isMinute ? 'bg-zinc-700 text-zinc-100' : 'text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800/50'
          } disabled:opacity-50`}
        >
          {minuteLabel}
          <ChevronDown className="w-3 h-3" />
        </button>

        {dropdownOpen && (
          <div className="absolute top-full left-0 mt-1 z-50 rounded-lg border border-zinc-700 bg-zinc-900 shadow-xl py-1 min-w-[80px]">
            {CHART_MINUTE_PERIODS.map((p) => (
              <button
                key={p}
                type="button"
                onClick={() => {
                  onChange(p);
                  setDropdownOpen(false);
                }}
                className={`block w-full text-left px-3 py-1.5 text-[11px] font-mono transition-colors ${
                  current === p ? 'text-zinc-100 bg-zinc-800' : 'text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800/50'
                }`}
              >
                {CHART_MINUTE_LABELS[p]}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Upper period tabs */}
      {CHART_UPPER_PERIODS.map((p) => (
        <button
          key={p}
          type="button"
          onClick={() => onChange(p)}
          disabled={disabled}
          className={`text-[11px] font-mono px-2 py-1 rounded transition-colors ${
            current === p ? 'bg-zinc-700 text-zinc-100' : 'text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800/50'
          } disabled:opacity-50`}
        >
          {CHART_UPPER_LABELS[p]}
        </button>
      ))}
    </div>
  );
}

/* ── Main ── */
export default function StockPriceChart({
  bars,
  period,
  isLoading,
  onPeriodChange,
}: {
  bars: ChartBar[];
  period: ChartPeriod;
  isLoading: boolean;
  onPeriodChange: (p: ChartPeriod) => void;
}) {
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const candleSeriesRef = useRef<ISeriesApi<'Candlestick'> | null>(null);
  const volumeSeriesRef = useRef<ISeriesApi<'Histogram'> | null>(null);

  // Create chart
  useEffect(() => {
    if (!chartContainerRef.current) return;

    const chart = createChart(chartContainerRef.current, {
      layout: {
        background: { color: '#0a0a0a' },
        textColor: '#52525b',
        fontFamily: 'monospace',
        fontSize: 10,
      },
      grid: {
        vertLines: { color: '#18181b' },
        horzLines: { color: '#18181b' },
      },
      crosshair: {
        vertLine: { color: '#3f3f46', width: 1, style: 2, labelBackgroundColor: '#27272a' },
        horzLine: { color: '#3f3f46', width: 1, style: 2, labelBackgroundColor: '#27272a' },
      },
      rightPriceScale: {
        borderColor: '#27272a',
        scaleMargins: { top: 0.05, bottom: 0.25 },
      },
      timeScale: {
        borderColor: '#27272a',
        timeVisible: false,
        secondsVisible: false,
      },
      handleScroll: true,
      handleScale: true,
    });

    const candleSeries = chart.addSeries(CandlestickSeries, {
      upColor: UP_COLOR,
      downColor: DOWN_COLOR,
      borderUpColor: UP_COLOR,
      borderDownColor: DOWN_COLOR,
      wickUpColor: UP_COLOR,
      wickDownColor: DOWN_COLOR,
    });

    const volumeSeries = chart.addSeries(HistogramSeries, {
      priceFormat: { type: 'volume' },
      priceScaleId: 'volume',
    });

    chart.priceScale('volume').applyOptions({
      scaleMargins: { top: 0.8, bottom: 0 },
    });

    chartRef.current = chart;
    candleSeriesRef.current = candleSeries;
    volumeSeriesRef.current = volumeSeries;

    const ro = new ResizeObserver(() => {
      if (chartContainerRef.current) {
        chart.applyOptions({
          width: chartContainerRef.current.clientWidth,
          height: chartContainerRef.current.clientHeight,
        });
      }
    });
    ro.observe(chartContainerRef.current);

    return () => {
      ro.disconnect();
      chart.remove();
      chartRef.current = null;
      candleSeriesRef.current = null;
      volumeSeriesRef.current = null;
    };
  }, []);

  // Update data
  useEffect(() => {
    if (!candleSeriesRef.current || !volumeSeriesRef.current || !chartRef.current || bars.length === 0) return;

    const intra = isIntraday(period);
    chartRef.current.timeScale().applyOptions({
      timeVisible: intra,
      secondsVisible: false,
    });

    candleSeriesRef.current.setData(toCandlestick(bars, intra));
    volumeSeriesRef.current.setData(toVolume(bars, intra));
    chartRef.current.timeScale().fitContent();
  }, [bars, period]);

  return (
    <div className="border-b border-zinc-800">
      {/* Period selector */}
      <div className="px-3 py-1.5 flex items-center gap-2 border-b border-zinc-800/40">
        <PeriodSelector current={period} onChange={onPeriodChange} disabled={isLoading} />
        {isLoading && <Loader2 className="w-3 h-3 text-zinc-600 animate-spin" />}
      </div>

      {/* Chart */}
      {bars.length === 0 && !isLoading ? (
        <div className="h-[420px] flex items-center justify-center bg-[#0a0a0a]">
          <span className="text-[10px] font-mono text-zinc-600">NO CHART DATA</span>
        </div>
      ) : (
        <div ref={chartContainerRef} className="h-[420px] w-full" />
      )}
    </div>
  );
}
