'use client';

import { useEffect, useRef } from 'react';
import { Loader2 } from 'lucide-react';
import { createChart, CandlestickSeries, HistogramSeries } from 'lightweight-charts';
import type { IChartApi, ISeriesApi, CandlestickData, HistogramData, Time } from 'lightweight-charts';
import { CHART_PERIODS } from '@/lib/constants';
import type { ChartBar, ChartPeriod } from '@/types/dashboard';

const UP_COLOR = '#ef4444';
const UP_BORDER = '#ef4444';
const DOWN_COLOR = '#3b82f6';
const DOWN_BORDER = '#3b82f6';
const WICK_UP = '#ef4444';
const WICK_DOWN = '#3b82f6';

/** 일봉 이상은 yyyy-MM-dd, 분봉(1D/5D)은 UTC 초 단위 timestamp */
function toTime(ts: string, intraday: boolean): Time {
  const d = new Date(ts);
  if (intraday) {
    return Math.floor(d.getTime() / 1000) as unknown as Time;
  }
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}` as Time;
}

/** 중복 time 제거 (같은 시간 → 마지막 것만 유지) */
function dedup<T extends { time: Time }>(data: T[]): T[] {
  const map = new Map<string | number, T>();
  for (const d of data) {
    map.set(d.time as string | number, d);
  }
  return Array.from(map.values());
}

function toCandlestick(bars: ChartBar[], intraday: boolean): CandlestickData<Time>[] {
  return dedup(
    bars.map((b) => ({
      time: toTime(b.timestamp, intraday),
      open: b.open,
      high: b.high,
      low: b.low,
      close: b.close,
    })),
  );
}

function toVolume(bars: ChartBar[], intraday: boolean): HistogramData<Time>[] {
  return dedup(
    bars.map((b) => ({
      time: toTime(b.timestamp, intraday),
      value: b.volume,
      color: b.close >= b.open ? `${UP_COLOR}88` : `${DOWN_COLOR}88`,
    })),
  );
}

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

  // Create chart once
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
      borderUpColor: UP_BORDER,
      borderDownColor: DOWN_BORDER,
      wickUpColor: WICK_UP,
      wickDownColor: WICK_DOWN,
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

    const handleResize = () => {
      if (chartContainerRef.current) {
        chart.applyOptions({
          width: chartContainerRef.current.clientWidth,
          height: chartContainerRef.current.clientHeight,
        });
      }
    };

    const resizeObserver = new ResizeObserver(handleResize);
    resizeObserver.observe(chartContainerRef.current);

    return () => {
      resizeObserver.disconnect();
      chart.remove();
      chartRef.current = null;
      candleSeriesRef.current = null;
      volumeSeriesRef.current = null;
    };
  }, []);

  // Update data when bars or period change
  useEffect(() => {
    if (!candleSeriesRef.current || !volumeSeriesRef.current || !chartRef.current || bars.length === 0) return;

    const intraday = period === '1D' || period === '5D';

    // timeScale needs timeVisible for intraday
    chartRef.current.timeScale().applyOptions({
      timeVisible: intraday,
      secondsVisible: false,
    });

    const candleData = toCandlestick(bars, intraday);
    const volumeData = toVolume(bars, intraday);

    candleSeriesRef.current.setData(candleData);
    volumeSeriesRef.current.setData(volumeData);

    chartRef.current.timeScale().fitContent();
  }, [bars, period]);

  return (
    <div className="border-b border-zinc-800">
      {/* Period tabs */}
      <div className="px-3 py-1.5 flex items-center gap-1 border-b border-zinc-800/40">
        {CHART_PERIODS.map((p) => (
          <button
            key={p}
            type="button"
            onClick={() => onPeriodChange(p)}
            disabled={isLoading}
            className={`text-[10px] font-mono px-2.5 py-0.5 rounded transition-colors ${
              period === p ? 'bg-zinc-700 text-zinc-100' : 'text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800/50'
            } disabled:opacity-50`}
          >
            {p}
          </button>
        ))}
        {isLoading && <Loader2 className="w-3 h-3 text-zinc-600 animate-spin ml-2" />}
      </div>

      {/* Chart container */}
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
