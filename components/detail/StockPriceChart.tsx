'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { Loader2, ChevronDown, TrendingUp, Minus, Pencil, Trash2, MousePointer } from 'lucide-react';
import {
  createChart,
  CandlestickSeries,
  HistogramSeries,
  TickMarkType,
} from 'lightweight-charts';
import type { IChartApi, Time, UTCTimestamp } from 'lightweight-charts';
import {
  CHART_MINUTE_PERIODS,
  CHART_UPPER_PERIODS,
  CHART_MINUTE_LABELS,
  CHART_UPPER_LABELS,
  CHART_VISIBLE_BARS,
} from '@/lib/constants';
import { cn } from '@/lib/utils';
import type { ChartBar, ChartPeriod } from '@/types/dashboard';

// 한국식 캔들 표기: 빨강↑ / 파랑↓ — 의미색, 변경 금지
const UP_COLOR = '#ef4444';
const DOWN_COLOR = '#3b82f6';
const DRAW_COLOR = '#facc15';
const DRAW_WIDTH = 1.5;

function isIntraday(period: ChartPeriod): boolean {
  return period.endsWith('min');
}

/* ── Time parsing ────────────────────────────────────────────────
 * 백엔드 timestamp → lightweight-charts Time
 *   • intraday(1/5/30/60min) : "YYYY-MM-DDTHH:MM:SS+00:00" → UTCTimestamp(s)
 *   • day/week/month/year    : "YYYY-MM-DDT00:00:00" (TZ-naive)
 *                              → BusinessDay {y,m,d}
 *     ★ 일/주/월/년 봉은 BusinessDay 로 넘겨 타임존 영향을 원천 제거한다.
 *       (UTCTimestamp 로 넘기면 JS 의 로컬 해석 + 라이브러리 UTC 표시로 날짜가
 *        하루씩 어긋날 수 있음 — 본 페이지에서 발견된 버그의 핵심 원인)
 * ──────────────────────────────────────────────────────────────── */
function parseYmd(ts: string): { y: number; m: number; d: number } | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})/.exec(ts);
  if (!match) return null;
  return { y: +match[1], m: +match[2], d: +match[3] };
}

function barToTime(ts: string, intra: boolean): Time | null {
  if (intra) {
    const ms = Date.parse(ts);
    return Number.isNaN(ms) ? null : (Math.floor(ms / 1000) as UTCTimestamp);
  }
  const p = parseYmd(ts);
  return p ? { year: p.y, month: p.m, day: p.d } : null;
}

function timeOrdinal(t: Time): number {
  if (typeof t === 'number') return t;
  if (typeof t === 'string') {
    const ms = Date.parse(t);
    return Number.isNaN(ms) ? 0 : ms / 1000;
  }
  return Date.UTC(t.year, t.month - 1, t.day) / 1000;
}

function timeKey(t: Time): string {
  if (typeof t === 'number') return `n${t}`;
  if (typeof t === 'string') return `s${t}`;
  return `d${t.year}-${String(t.month).padStart(2, '0')}-${String(t.day).padStart(2, '0')}`;
}

function dedupSortTime<T extends { time: Time }>(data: T[]): T[] {
  const map = new Map<string, T>();
  for (const d of data) map.set(timeKey(d.time), d);
  return Array.from(map.values()).sort((a, b) => timeOrdinal(a.time) - timeOrdinal(b.time));
}

/* ── 라벨 포매터 ──────────────────────────────────────────────── */
function unpackTime(time: Time): {
  y: number; mo: number; d: number; hh: number; mm: number;
} | null {
  if (typeof time === 'number') {
    const dt = new Date(time * 1000);
    return {
      y: dt.getFullYear(),
      mo: dt.getMonth() + 1,
      d: dt.getDate(),
      hh: dt.getHours(),
      mm: dt.getMinutes(),
    };
  }
  if (typeof time === 'object' && time !== null) {
    return { y: time.year, mo: time.month, d: time.day, hh: 0, mm: 0 };
  }
  return null;
}

function pad2(n: number): string {
  return String(n).padStart(2, '0');
}

/** x축 tick 라벨 — TickMarkType 에 맞춰 종류별 포맷 */
function makeTickFormatter(intra: boolean) {
  return (time: Time, type: TickMarkType): string | null => {
    const u = unpackTime(time);
    if (!u) return null;
    switch (type) {
      case TickMarkType.Year:
        return String(u.y);
      case TickMarkType.Month:
        return `${u.y}.${pad2(u.mo)}`;
      case TickMarkType.DayOfMonth:
        return `${u.mo}/${u.d}`;
      case TickMarkType.Time:
      case TickMarkType.TimeWithSeconds:
        return intra ? `${pad2(u.hh)}:${pad2(u.mm)}` : `${u.mo}/${u.d}`;
      default:
        return null;
    }
  };
}

/** 크로스헤어 툴팁 — 풀 데이트(필요 시 시:분 포함) */
function makeCrosshairFormatter(intra: boolean) {
  return (time: Time): string => {
    const u = unpackTime(time);
    if (!u) return '';
    const ds = `${u.y}-${pad2(u.mo)}-${pad2(u.d)}`;
    return intra ? `${ds} ${pad2(u.hh)}:${pad2(u.mm)}` : ds;
  };
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
    // 백엔드가 기간별(일/주/월/년)로 리샘플된 봉을 보내므로 그대로 사용한다.
    const candleData = dedupSortTime(
      bars
        .map((b) => {
          const t = barToTime(b.timestamp, intra);
          return t ? { time: t, open: b.open, high: b.high, low: b.low, close: b.close } : null;
        })
        .filter((x): x is NonNullable<typeof x> => x !== null),
    );

    if (candleData.length === 0) return;

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
        // 기간별 라벨 포매터 — UTC/로컬 혼동 없이 명시적 표기
        tickMarkFormatter: makeTickFormatter(intra),
      },
      localization: {
        // 크로스헤어 시간 표기도 동일 컨벤션
        timeFormatter: makeCrosshairFormatter(intra),
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
    candles.setData(candleData);

    const volume = chart.addSeries(HistogramSeries, {
      priceFormat: { type: 'volume' },
      priceScaleId: 'volume',
    });
    chart.priceScale('volume').applyOptions({
      scaleMargins: { top: 0.8, bottom: 0 },
    });

    const volData = dedupSortTime(
      bars
        .map((b) => {
          const t = barToTime(b.timestamp, intra);
          return t
            ? {
                time: t,
                value: b.volume,
                color: b.close >= b.open ? `${UP_COLOR}88` : `${DOWN_COLOR}88`,
              }
            : null;
        })
        .filter((x): x is NonNullable<typeof x> => x !== null),
    );
    volume.setData(volData);

    // 기간별 합리적 초기 가시 범위 (fitContent 대신) — 라벨 가독성/직관성 확보.
    // 데이터가 그보다 적으면 fitContent.
    const visN = CHART_VISIBLE_BARS[period];
    const total = candleData.length;
    if (visN && total > visN) {
      chart.timeScale().setVisibleLogicalRange({ from: total - visN, to: total });
    } else {
      chart.timeScale().fitContent();
    }

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
