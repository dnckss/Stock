'use client';

import { useRef, useState, useEffect, useMemo, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { RefreshCw } from 'lucide-react';
import { useHeatmapData } from '@/hooks/useHeatmapData';
import { formatMarketCap, formatPrice, formatTimestamp } from '@/lib/api';
import {
  HEATMAP_COLOR_RANGE_PCT,
  HEATMAP_COLOR_POSITIVE,
  HEATMAP_COLOR_NEGATIVE,
  HEATMAP_COLOR_NEUTRAL,
} from '@/lib/constants';
import { interpolateRgb, rgbString, cn } from '@/lib/utils';
import type { HeatmapSector, HeatmapStock } from '@/types/dashboard';

// ── Treemap layout ──

interface Rect {
  x: number;
  y: number;
  w: number;
  h: number;
}

interface LayoutNode<T> {
  data: T;
  value: number;
  rect: Rect;
}

function worstAspectRatio(areas: number[], shortSide: number): number {
  const sum = areas.reduce((s, a) => s + a, 0);
  if (sum === 0 || shortSide === 0) return Infinity;
  const maxArea = Math.max(...areas);
  const minArea = Math.min(...areas);
  return Math.max(
    (shortSide * shortSide * maxArea) / (sum * sum),
    (sum * sum) / (shortSide * shortSide * minArea),
  );
}

function squarifiedLayout<T>(
  items: { data: T; value: number }[],
  container: Rect,
): LayoutNode<T>[] {
  if (items.length === 0) return [];

  const totalValue = items.reduce((s, item) => s + item.value, 0);
  if (totalValue <= 0 || container.w <= 0 || container.h <= 0) return [];

  const totalArea = container.w * container.h;
  const sorted = [...items]
    .sort((a, b) => b.value - a.value)
    .map((item) => ({
      ...item,
      area: (item.value / totalValue) * totalArea,
    }));

  const result: LayoutNode<T>[] = [];
  let remaining = sorted;
  let rect = { ...container };

  while (remaining.length > 0) {
    if (remaining.length === 1) {
      result.push({
        data: remaining[0].data,
        value: remaining[0].value,
        rect: { ...rect },
      });
      break;
    }

    const shortSide = Math.min(rect.w, rect.h);
    let rowEnd = 1;
    let bestWorst = worstAspectRatio([remaining[0].area], shortSide);

    for (let i = 1; i < remaining.length; i++) {
      const areas = remaining.slice(0, i + 1).map((n) => n.area);
      const w = worstAspectRatio(areas, shortSide);
      if (w <= bestWorst) {
        rowEnd = i + 1;
        bestWorst = w;
      } else {
        break;
      }
    }

    const row = remaining.slice(0, rowEnd);
    remaining = remaining.slice(rowEnd);
    const rowArea = row.reduce((s, n) => s + n.area, 0);
    const isHorizontal = rect.w >= rect.h;

    if (isHorizontal) {
      const rowWidth = rowArea / rect.h;
      let currentY = rect.y;
      for (const node of row) {
        const nodeHeight = node.area / rowWidth;
        result.push({
          data: node.data,
          value: node.value,
          rect: { x: rect.x, y: currentY, w: rowWidth, h: nodeHeight },
        });
        currentY += nodeHeight;
      }
      rect = { x: rect.x + rowWidth, y: rect.y, w: rect.w - rowWidth, h: rect.h };
    } else {
      const rowHeight = rowArea / rect.w;
      let currentX = rect.x;
      for (const node of row) {
        const nodeWidth = node.area / rowHeight;
        result.push({
          data: node.data,
          value: node.value,
          rect: { x: currentX, y: rect.y, w: nodeWidth, h: rowHeight },
        });
        currentX += nodeWidth;
      }
      rect = { x: rect.x, y: rect.y + rowHeight, w: rect.w, h: rect.h - rowHeight };
    }
  }

  return result;
}

// ── Color ──

const SECTOR_HEADER_H = 16;
const SECTOR_BORDER = 2;
const BG_COLOR = '#1a1a1a';

function getHeatColor(changePct: number): string {
  const t = Math.min(1, Math.abs(changePct) / HEATMAP_COLOR_RANGE_PCT);
  if (changePct >= 0.05) return rgbString(interpolateRgb(HEATMAP_COLOR_NEUTRAL, HEATMAP_COLOR_POSITIVE, t));
  if (changePct <= -0.05) return rgbString(interpolateRgb(HEATMAP_COLOR_NEUTRAL, HEATMAP_COLOR_NEGATIVE, t));
  return rgbString(HEATMAP_COLOR_NEUTRAL);
}

// ── Two-level layout ──

interface SectorLayout {
  sector: HeatmapSector;
  rect: Rect;
  stocks: LayoutNode<HeatmapStock>[];
}

function computeLayout(
  sectors: HeatmapSector[],
  width: number,
  height: number,
): SectorLayout[] {
  const sectorNodes = squarifiedLayout(
    sectors.map((s) => ({ data: s, value: s.totalMarketCap })),
    { x: 0, y: 0, w: width, h: height },
  );

  return sectorNodes.map((node) => {
    const { rect } = node;
    const showHeader = rect.w > 50 && rect.h > 30;
    const headerH = showHeader ? SECTOR_HEADER_H : 0;

    const stockRect: Rect = {
      x: rect.x + SECTOR_BORDER,
      y: rect.y + headerH,
      w: Math.max(0, rect.w - SECTOR_BORDER * 2),
      h: Math.max(0, rect.h - headerH - SECTOR_BORDER),
    };

    const stocks = squarifiedLayout(
      node.data.stocks.map((s) => ({ data: s, value: s.marketCap })),
      stockRect,
    );

    return { sector: node.data, rect, stocks };
  });
}

// ── Font size by cell area ──

function tickerFontSize(w: number, h: number): number {
  const area = w * h;
  if (area > 15000) return 16;
  if (area > 8000) return 13;
  if (area > 4000) return 11;
  if (area > 1500) return 10;
  return 9;
}

function pctFontSize(w: number, h: number): number {
  const area = w * h;
  if (area > 15000) return 14;
  if (area > 8000) return 12;
  if (area > 4000) return 10;
  if (area > 1500) return 9;
  return 8;
}

// ── Tooltip ──

function HeatmapTooltip({
  stock,
  sectorName,
}: {
  stock: HeatmapStock;
  sectorName: string;
}) {
  return (
    <>
      <div className="flex items-center gap-2 mb-1.5">
        <span className="text-[11px] font-bold text-zinc-100 font-mono">
          {stock.ticker}
        </span>
        <span className="text-[10px] text-zinc-400 truncate">{stock.name}</span>
      </div>
      <div className="space-y-0.5 text-[10px] font-mono">
        <div className="flex justify-between">
          <span className="text-zinc-500">Price</span>
          <span className="text-zinc-300 tabular-nums">${formatPrice(stock.price)}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-zinc-500">Change</span>
          <span
            className={cn(
              'tabular-nums font-medium',
              stock.changePct >= 0 ? 'text-green-400' : 'text-red-400',
            )}
          >
            {stock.changePct >= 0 ? '+' : ''}{stock.changePct.toFixed(2)}%
          </span>
        </div>
        <div className="flex justify-between">
          <span className="text-zinc-500">Mkt Cap</span>
          <span className="text-zinc-300 tabular-nums">
            {formatMarketCap(stock.marketCap)}
          </span>
        </div>
        <div className="flex justify-between">
          <span className="text-zinc-500">Sector</span>
          <span className="text-zinc-400 truncate ml-2">{sectorName}</span>
        </div>
      </div>
    </>
  );
}

// ── Main ──

export default function SP500Heatmap() {
  const router = useRouter();
  const containerRef = useRef<HTMLDivElement>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);
  const [dimensions, setDimensions] = useState({ w: 0, h: 0 });
  const { data, isLoading, error, refetch } = useHeatmapData();

  const [hovered, setHovered] = useState<{
    stock: HeatmapStock;
    sectorName: string;
  } | null>(null);
  const currentTickerRef = useRef<string | null>(null);

  // callback ref: ResizeObserver를 DOM 노드 연결 시점에 설정
  const observerRef = useRef<ResizeObserver | null>(null);
  const attachObserver = useCallback((el: HTMLDivElement | null) => {
    if (observerRef.current) {
      observerRef.current.disconnect();
      observerRef.current = null;
    }
    containerRef.current = el;
    if (!el) return;

    const observer = new ResizeObserver((entries) => {
      const entry = entries[0];
      if (entry) {
        setDimensions({ w: entry.contentRect.width, h: entry.contentRect.height });
      }
    });
    observer.observe(el);
    observerRef.current = observer;
  }, []);

  const layout = useMemo(() => {
    if (!data || dimensions.w === 0 || dimensions.h === 0) return [];
    return computeLayout(data.sectors, dimensions.w, dimensions.h);
  }, [data, dimensions]);

  const totalStocks = useMemo(
    () => (data?.sectors ?? []).reduce((sum, s) => sum + s.stocks.length, 0),
    [data],
  );

  // 툴팁 위치는 ref로 직접 업데이트 (re-render 없이), stock 변경 시만 setState
  const handleMouseMove = useCallback(
    (e: React.MouseEvent, stock: HeatmapStock, sectorName: string) => {
      const container = containerRef.current;
      const tip = tooltipRef.current;
      if (!container) return;

      const rect = container.getBoundingClientRect();
      let left = e.clientX - rect.left + 14;
      let top = e.clientY - rect.top + 14;
      if (left + 210 > rect.width) left = e.clientX - rect.left - 218;
      if (top + 105 > rect.height) top = e.clientY - rect.top - 113;
      if (left < 0) left = 4;
      if (top < 0) top = 4;

      if (tip) {
        tip.style.left = `${left}px`;
        tip.style.top = `${top}px`;
      }

      if (currentTickerRef.current !== stock.ticker) {
        currentTickerRef.current = stock.ticker;
        setHovered({ stock, sectorName });
      }
    },
    [],
  );

  const handleMouseLeave = useCallback(() => {
    currentTickerRef.current = null;
    setHovered(null);
  }, []);

  const handleStockClick = useCallback(
    (ticker: string) => router.push(`/stock/${ticker}`),
    [router],
  );

  return (
    <div className="flex-1 flex flex-col min-h-0">
      {data && (
        <div className="px-3 py-1 border-b border-zinc-800/60 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3 text-[10px] font-mono">
            <span className="text-zinc-500">{data.sectors.length} sectors</span>
            <span className="text-zinc-700">|</span>
            <span className="text-zinc-500">{totalStocks} stocks</span>
            {data.updatedAt && (
              <>
                <span className="text-zinc-700">|</span>
                <span className="text-zinc-600">{formatTimestamp(data.updatedAt)}</span>
              </>
            )}
            {isLoading && <span className="text-zinc-600 animate-pulse">갱신 중...</span>}
          </div>
          <div className="flex items-center gap-2 text-[9px] font-mono text-zinc-600">
            <div className="flex items-center gap-1">
              <div className="w-2.5 h-2.5 rounded-sm" style={{ backgroundColor: getHeatColor(-HEATMAP_COLOR_RANGE_PCT) }} />
              <span>-{HEATMAP_COLOR_RANGE_PCT}%</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-2.5 h-2.5 rounded-sm" style={{ backgroundColor: getHeatColor(0) }} />
              <span>0%</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-2.5 h-2.5 rounded-sm" style={{ backgroundColor: getHeatColor(HEATMAP_COLOR_RANGE_PCT) }} />
              <span>+{HEATMAP_COLOR_RANGE_PCT}%</span>
            </div>
          </div>
        </div>
      )}

      <div
        ref={attachObserver}
        className="flex-1 relative min-h-0 overflow-hidden"
        style={{ backgroundColor: BG_COLOR }}
      >
        {isLoading && !data && (
          <div className="absolute inset-0 z-30 flex items-center justify-center" style={{ backgroundColor: BG_COLOR }}>
            <div className="text-center">
              <div className="inline-flex items-center gap-2 mb-2">
                <div className="w-4 h-4 border-2 border-zinc-600 border-t-zinc-300 rounded-full animate-spin" />
                <span className="text-[11px] text-zinc-500 font-mono">S&P 500 히트맵 로딩 중...</span>
              </div>
              <p className="text-[10px] text-zinc-600">첫 호출 시 10~15초 소요될 수 있습니다</p>
            </div>
          </div>
        )}

        {error && !data && (
          <div className="absolute inset-0 z-30 flex items-center justify-center" style={{ backgroundColor: BG_COLOR }}>
            <div className="text-center">
              <div className="w-10 h-10 rounded-full bg-red-500/10 flex items-center justify-center mx-auto mb-3">
                <span className="text-red-500 text-lg">!</span>
              </div>
              <p className="text-xs text-red-400 mb-1">히트맵 로드 실패</p>
              <p className="text-[10px] text-zinc-500 max-w-[200px] mb-3">{error}</p>
              <button
                onClick={refetch}
                className="inline-flex items-center gap-1.5 px-3 py-1 rounded text-[10px] font-medium text-zinc-300 bg-zinc-800 hover:bg-zinc-700 transition-colors"
              >
                <RefreshCw className="w-3 h-3" />
                재시도
              </button>
            </div>
          </div>
        )}

        {layout.map((sl) => {
          const { rect } = sl;
          const showHeader = rect.w > 50 && rect.h > 30;

          return (
            <div key={sl.sector.name}>
              {showHeader && (
                <div
                  className="absolute z-10 flex items-center px-1.5 overflow-hidden"
                  style={{
                    left: rect.x + SECTOR_BORDER,
                    top: rect.y,
                    width: rect.w - SECTOR_BORDER * 2,
                    height: SECTOR_HEADER_H,
                    backgroundColor: BG_COLOR,
                  }}
                >
                  <span
                    className="font-mono font-bold text-white/80 uppercase tracking-wider truncate"
                    style={{ fontSize: rect.w > 200 ? 11 : 9 }}
                  >
                    {sl.sector.name}
                  </span>
                </div>
              )}

              {sl.stocks.map((stockNode) => {
                const sr = stockNode.rect;
                const stock = stockNode.data;
                const canShowTicker = sr.w >= 28 && sr.h >= 18;
                const canShowPct = sr.w >= 32 && sr.h >= 32;

                return (
                  <div
                    key={stock.ticker}
                    className="absolute cursor-pointer transition-[filter] duration-100 hover:brightness-130 hover:z-20 flex flex-col items-center justify-center overflow-hidden"
                    style={{
                      left: sr.x,
                      top: sr.y,
                      width: sr.w,
                      height: sr.h,
                      backgroundColor: getHeatColor(stock.changePct),
                      border: `1px solid ${BG_COLOR}`,
                    }}
                    onClick={() => handleStockClick(stock.ticker)}
                    onMouseMove={(e) => handleMouseMove(e, stock, sl.sector.name)}
                    onMouseLeave={handleMouseLeave}
                  >
                    {canShowTicker && (
                      <span
                        className="font-mono font-bold text-white leading-tight"
                        style={{ fontSize: tickerFontSize(sr.w, sr.h) }}
                      >
                        {stock.ticker}
                      </span>
                    )}
                    {canShowPct && (
                      <span
                        className="font-mono tabular-nums text-white/80 leading-tight"
                        style={{ fontSize: pctFontSize(sr.w, sr.h) }}
                      >
                        {stock.changePct >= 0 ? '+' : ''}
                        {stock.changePct.toFixed(2)}%
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          );
        })}

        {hovered && (
          <div
            ref={tooltipRef}
            className="absolute z-50 pointer-events-none rounded border border-zinc-700/60 bg-zinc-900/95 px-3 py-2 shadow-xl backdrop-blur"
            style={{ minWidth: 210 }}
          >
            <HeatmapTooltip stock={hovered.stock} sectorName={hovered.sectorName} />
          </div>
        )}
      </div>
    </div>
  );
}
