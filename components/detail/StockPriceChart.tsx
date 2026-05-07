'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { Loader2, ChevronDown, TrendingUp, Minus, Pencil, Trash2, MousePointer } from 'lucide-react';
import { createChart, CandlestickSeries, HistogramSeries } from 'lightweight-charts';
import type { IChartApi, UTCTimestamp } from 'lightweight-charts';
import {
  CHART_MINUTE_PERIODS,
  CHART_UPPER_PERIODS,
  CHART_MINUTE_LABELS,
  CHART_UPPER_LABELS,
} from '@/lib/constants';
import { cn } from '@/lib/utils';
import type { ChartBar, ChartPeriod } from '@/types/dashboard';

const UP_COLOR = '#ef4444';
const DOWN_COLOR = '#3b82f6';
const DRAW_COLOR = '#facc15';
const DRAW_WIDTH = 1.5;

function isIntraday(period: ChartPeriod): boolean {
  return period.endsWith('min');
}

function toUtc(ts: string): UTCTimestamp {
  const ms = new Date(ts).getTime();
  if (Number.isNaN(ms)) return 0 as UTCTimestamp;
  return Math.floor(ms / 1000) as UTCTimestamp;
}

function dedupSort<T extends { time: UTCTimestamp }>(data: T[]): T[] {
  const map = new Map<number, T>();
  for (const d of data) map.set(d.time, d);
  return Array.from(map.values()).sort((a, b) => a.time - b.time);
}

/* ── Drawing types ── */

type DrawingTool = 'none' | 'trendline' | 'hline' | 'freehand';

interface Drawing {
  type: 'trendline' | 'hline' | 'freehand';
  points: { x: number; y: number }[];
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

/* ── Drawing toolbar ── */

const TOOLS: { key: DrawingTool; icon: typeof Pencil; label: string }[] = [
  { key: 'none', icon: MousePointer, label: '선택' },
  { key: 'trendline', icon: TrendingUp, label: '추세선' },
  { key: 'hline', icon: Minus, label: '수평선' },
  { key: 'freehand', icon: Pencil, label: '자유 그리기' },
];

/* ── Canvas drawing helpers ── */

function renderDrawings(
  ctx: CanvasRenderingContext2D,
  drawings: Drawing[],
  width: number,
) {
  ctx.strokeStyle = DRAW_COLOR;
  ctx.lineWidth = DRAW_WIDTH;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';

  for (const d of drawings) {
    if (d.points.length === 0) continue;
    ctx.beginPath();

    if (d.type === 'hline') {
      const y = d.points[0].y;
      ctx.setLineDash([6, 4]);
      ctx.moveTo(0, y);
      ctx.lineTo(width, y);
      ctx.stroke();
      ctx.setLineDash([]);
    } else if (d.type === 'trendline' && d.points.length === 2) {
      ctx.moveTo(d.points[0].x, d.points[0].y);
      ctx.lineTo(d.points[1].x, d.points[1].y);
      ctx.stroke();
    } else if (d.type === 'freehand') {
      ctx.moveTo(d.points[0].x, d.points[0].y);
      for (let i = 1; i < d.points.length; i++) {
        ctx.lineTo(d.points[i].x, d.points[i].y);
      }
      ctx.stroke();
    }
  }
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

  // Drawing state
  const [activeTool, setActiveTool] = useState<DrawingTool>('none');
  const drawCanvasRef = useRef<HTMLCanvasElement>(null);
  const drawingsRef = useRef<Drawing[]>([]);
  const pendingRef = useRef<{ x: number; y: number }[]>([]);
  const isDrawingRef = useRef(false);

  const isDrawMode = activeTool !== 'none';

  // ── Redraw canvas ──
  const redraw = useCallback(() => {
    const canvas = drawCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    renderDrawings(ctx, drawingsRef.current, canvas.width);

    // Preview in-progress drawing
    const pts = pendingRef.current;
    if (pts.length > 0) {
      ctx.strokeStyle = DRAW_COLOR;
      ctx.lineWidth = DRAW_WIDTH;
      ctx.globalAlpha = 0.5;
      ctx.setLineDash([]);
      ctx.lineCap = 'round';
      ctx.beginPath();

      if (activeTool === 'hline') {
        ctx.setLineDash([6, 4]);
        ctx.moveTo(0, pts[0].y);
        ctx.lineTo(canvas.width, pts[0].y);
      } else if (activeTool === 'trendline' && pts.length === 2) {
        ctx.moveTo(pts[0].x, pts[0].y);
        ctx.lineTo(pts[1].x, pts[1].y);
      } else if (activeTool === 'freehand' && pts.length > 1) {
        ctx.moveTo(pts[0].x, pts[0].y);
        for (let i = 1; i < pts.length; i++) ctx.lineTo(pts[i].x, pts[i].y);
      }

      ctx.stroke();
      ctx.globalAlpha = 1;
      ctx.setLineDash([]);
    }
  }, [activeTool]);

  // ── Sync canvas size ──
  const syncCanvasSize = useCallback(() => {
    const canvas = drawCanvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;
    const rect = container.getBoundingClientRect();
    if (canvas.width !== rect.width || canvas.height !== rect.height) {
      canvas.width = rect.width;
      canvas.height = rect.height;
      redraw();
    }
  }, [redraw]);

  // ── Toggle chart interaction ──
  useEffect(() => {
    if (chartRef.current) {
      chartRef.current.applyOptions({
        handleScroll: !isDrawMode,
        handleScale: !isDrawMode,
      });
    }
  }, [isDrawMode]);

  // ── Mouse handlers ──
  const getPos = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const rect = drawCanvasRef.current?.getBoundingClientRect();
    if (!rect) return { x: 0, y: 0 };
    return { x: e.clientX - rect.left, y: e.clientY - rect.top };
  };

  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawMode) return;
    const pos = getPos(e);

    if (activeTool === 'hline') {
      drawingsRef.current.push({ type: 'hline', points: [pos] });
      redraw();
      return;
    }

    if (activeTool === 'trendline') {
      if (pendingRef.current.length === 0) {
        pendingRef.current = [pos];
      } else {
        drawingsRef.current.push({ type: 'trendline', points: [pendingRef.current[0], pos] });
        pendingRef.current = [];
        redraw();
      }
      return;
    }

    if (activeTool === 'freehand') {
      isDrawingRef.current = true;
      pendingRef.current = [pos];
    }
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawMode) return;
    const pos = getPos(e);

    if (activeTool === 'trendline' && pendingRef.current.length === 1) {
      pendingRef.current = [pendingRef.current[0], pos];
      redraw();
      return;
    }

    if (activeTool === 'freehand' && isDrawingRef.current) {
      pendingRef.current.push(pos);
      redraw();
    }
  };

  const handleMouseUp = () => {
    if (activeTool === 'freehand' && isDrawingRef.current) {
      isDrawingRef.current = false;
      if (pendingRef.current.length > 1) {
        drawingsRef.current.push({ type: 'freehand', points: [...pendingRef.current] });
      }
      pendingRef.current = [];
      redraw();
    }
  };

  const handleClear = () => {
    drawingsRef.current = [];
    pendingRef.current = [];
    redraw();
  };

  // ── Build chart ──
  const buildChart = useCallback(() => {
    if (!containerRef.current || bars.length === 0) return;

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
      handleScroll: !isDrawMode,
      handleScale: !isDrawMode,
    });

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

    // sync canvas after chart created
    syncCanvasSize();
  }, [bars, period, isDrawMode, syncCanvasSize]);

  useEffect(() => { buildChart(); }, [buildChart]);

  // Resize
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const ro = new ResizeObserver(() => {
      if (chartRef.current && el) {
        chartRef.current.applyOptions({ width: el.clientWidth, height: el.clientHeight });
      }
      syncCanvasSize();
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, [syncCanvasSize]);

  // Cleanup
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
      {/* Toolbar */}
      <div className="px-3 py-1.5 flex items-center gap-2 border-b border-zinc-800/40">
        <PeriodSelector current={period} onChange={onPeriodChange} disabled={isLoading} />
        {isLoading && <Loader2 className="w-3 h-3 text-zinc-600 animate-spin" />}

        <div className="w-px h-4 bg-zinc-800 mx-1" />

        {/* Drawing tools */}
        {TOOLS.map(({ key, icon: Icon, label }) => (
          <button
            key={key}
            type="button"
            onClick={() => { setActiveTool(key); pendingRef.current = []; }}
            className={cn(
              'p-1 rounded transition-colors',
              activeTool === key
                ? 'bg-yellow-500/15 text-yellow-400'
                : 'text-zinc-600 hover:text-zinc-400 hover:bg-zinc-800/50',
            )}
            title={label}
          >
            <Icon className="w-3.5 h-3.5" />
          </button>
        ))}

        {drawingsRef.current.length > 0 && (
          <button
            type="button"
            onClick={handleClear}
            className="p-1 rounded text-zinc-600 hover:text-red-400 hover:bg-zinc-800/50 transition-colors"
            title="모두 지우기"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {/* Chart + Drawing overlay */}
      {bars.length === 0 && !isLoading ? (
        <div className="h-[420px] flex items-center justify-center bg-[#0a0a0a]">
          <span className="text-[10px] font-mono text-zinc-600">NO CHART DATA</span>
        </div>
      ) : (
        <div className="relative h-[420px] w-full bg-[#0a0a0a]">
          <div ref={containerRef} className="absolute inset-0" />
          <canvas
            ref={drawCanvasRef}
            className={cn(
              'absolute inset-0',
              isDrawMode ? 'cursor-crosshair z-10' : 'pointer-events-none',
            )}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
          />
        </div>
      )}
    </div>
  );
}
