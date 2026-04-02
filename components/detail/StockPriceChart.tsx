'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { Loader2, ChevronDown } from 'lucide-react';
import { createChart, CandlestickSeries, HistogramSeries } from 'lightweight-charts';
import type { IChartApi, UTCTimestamp } from 'lightweight-charts';
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
 * ISO 8601 UTC → UTCTimestamp (초)
 * "2026-04-01T14:30:00Z" → 1775001600
 */
function toUtc(ts: string): UTCTimestamp {
  const ms = new Date(ts).getTime();
  if (Number.isNaN(ms)) return 0 as UTCTimestamp;
  return Math.floor(ms / 1000) as UTCTimestamp;
}

/** 중복 제거 + 오름차순 정렬 */
function dedupSort<T extends { time: UTCTimestamp }>(data: T[]): T[] {
  const map = new Map<number, T>();
  for (const d of data) map.set(d.time, d);
  return Array.from(map.values()).sort((a, b) => a.time - b.time);
}

/* ── Period selector ── */
function PeriodSelector({
  current,
  onChange,
  disabled,
}: {
  current: ChartPeriod;
  onChange: (p: ChartPeriod) => void;
  disabled: boolean;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const isMin = isIntraday(current);
  const label = isMin ? (CHART_MINUTE_LABELS[current] ?? current) : '분';

  useEffect(() => {
    if (!open) return;
    function close(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener('mousedown', close);
    return () => document.removeEventListener('mousedown', close);
  }, [open]);

  return (
    <div className="flex items-center gap-0.5">
      <div ref={ref} className="relative">
        <button
          type="button"
          onClick={() => setOpen((p) => !p)}
          disabled={disabled}
          className={`flex items-center gap-0.5 text-[11px] font-mono px-2 py-1 rounded transition-colors ${
            isMin ? 'bg-zinc-700 text-zinc-100' : 'text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800/50'
          } disabled:opacity-50`}
        >
          {label}
          <ChevronDown className="w-3 h-3" />
        </button>
        {open && (
          <div className="absolute top-full left-0 mt-1 z-50 rounded-lg border border-zinc-700 bg-zinc-900 shadow-xl py-1 min-w-[80px]">
            {CHART_MINUTE_PERIODS.map((p) => (
              <button
                key={p}
                type="button"
                onClick={() => { onChange(p); setOpen(false); }}
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
  const containerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);

  /**
   * 차트 생성/재생성 함수
   * period가 바뀌면(분봉↔일봉) timeVisible이 달라져야 하므로
   * 차트를 완전히 재생성한다.
   */
  const buildChart = useCallback(() => {
    if (!containerRef.current || bars.length === 0) return;

    // 기존 차트 제거
    if (chartRef.current) {
      chartRef.current.remove();
      chartRef.current = null;
    }

    const intra = isIntraday(period);

    const chart = createChart(containerRef.current, {
      width: containerRef.current.clientWidth,
      height: containerRef.current.clientHeight,
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
        timeVisible: intra,
        secondsVisible: false,
      },
      handleScroll: true,
      handleScale: true,
    });

    // Candlestick
    const candles = chart.addSeries(CandlestickSeries, {
      upColor: UP_COLOR,
      downColor: DOWN_COLOR,
      borderUpColor: UP_COLOR,
      borderDownColor: DOWN_COLOR,
      wickUpColor: UP_COLOR,
      wickDownColor: DOWN_COLOR,
    });

    const candleData = dedupSort(
      bars.map((b) => ({
        time: toUtc(b.timestamp),
        open: b.open,
        high: b.high,
        low: b.low,
        close: b.close,
      })),
    );
    candles.setData(candleData);

    // Volume
    const volume = chart.addSeries(HistogramSeries, {
      priceFormat: { type: 'volume' },
      priceScaleId: 'volume',
    });
    chart.priceScale('volume').applyOptions({
      scaleMargins: { top: 0.8, bottom: 0 },
    });

    const volData = dedupSort(
      bars.map((b) => ({
        time: toUtc(b.timestamp),
        value: b.volume,
        color: b.close >= b.open ? `${UP_COLOR}88` : `${DOWN_COLOR}88`,
      })),
    );
    volume.setData(volData);

    chart.timeScale().fitContent();
    chartRef.current = chart;
  }, [bars, period]);

  // bars 또는 period 변경 시 차트 재생성
  useEffect(() => {
    buildChart();
  }, [buildChart]);

  // 리사이즈 대응
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const ro = new ResizeObserver(() => {
      if (chartRef.current && el) {
        chartRef.current.applyOptions({
          width: el.clientWidth,
          height: el.clientHeight,
        });
      }
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  // cleanup
  useEffect(() => {
    return () => {
      if (chartRef.current) {
        chartRef.current.remove();
        chartRef.current = null;
      }
    };
  }, []);

  return (
    <div className="border-b border-zinc-800">
      <div className="px-3 py-1.5 flex items-center gap-2 border-b border-zinc-800/40">
        <PeriodSelector current={period} onChange={onPeriodChange} disabled={isLoading} />
        {isLoading && <Loader2 className="w-3 h-3 text-zinc-600 animate-spin" />}
      </div>

      {bars.length === 0 && !isLoading ? (
        <div className="h-[420px] flex items-center justify-center bg-[#0a0a0a]">
          <span className="text-[10px] font-mono text-zinc-600">NO CHART DATA</span>
        </div>
      ) : (
        <div ref={containerRef} className="h-[420px] w-full bg-[#0a0a0a]" />
      )}
    </div>
  );
}
