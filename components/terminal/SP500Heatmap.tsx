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
  HEATMAP_MIN_CELL_TEXT_W,
  HEATMAP_MIN_CELL_TEXT_H,
  HEATMAP_MIN_CELL_PCT_H,
} from '@/lib/constants';
import type { HeatmapSector, HeatmapStock } from '@/types/dashboard';
import { cn } from '@/lib/utils';

// ── Treemap layout types ──

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

// ── Squarified treemap algorithm ──

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

    // 최적의 row 분할 찾기
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

// ── Color helpers ──

function interpolateColor(
  from: { r: number; g: number; b: number },
  to: { r: number; g: number; b: number },
  t: number,
): string {
  const c = Math.max(0, Math.min(1, t));
  const r = Math.round(from.r + (to.r - from.r) * c);
  const g = Math.round(from.g + (to.g - from.g) * c);
  const b = Math.round(from.b + (to.b - from.b) * c);
  return `rgb(${r}, ${g}, ${b})`;
}

function getHeatColor(changePct: number): string {
  const t = Math.min(1, Math.abs(changePct) / HEATMAP_COLOR_RANGE_PCT);
  if (changePct >= 0.05) {
    return interpolateColor(HEATMAP_COLOR_NEUTRAL, HEATMAP_COLOR_POSITIVE, t);
  }
  if (changePct <= -0.05) {
    return interpolateColor(HEATMAP_COLOR_NEUTRAL, HEATMAP_COLOR_NEGATIVE, t);
  }
  return `rgb(${HEATMAP_COLOR_NEUTRAL.r}, ${HEATMAP_COLOR_NEUTRAL.g}, ${HEATMAP_COLOR_NEUTRAL.b})`;
}

function getTextColor(changePct: number): string {
  const intensity = Math.min(1, Math.abs(changePct) / HEATMAP_COLOR_RANGE_PCT);
  if (intensity > 0.3) return 'rgba(255,255,255,0.95)';
  return 'rgba(255,255,255,0.7)';
}

// ── Two-level treemap layout ──

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
    // 섹터 내부에 1px padding (경계선 역할)
    const innerRect: Rect = {
      x: rect.x + 1,
      y: rect.y + 1,
      w: Math.max(0, rect.w - 2),
      h: Math.max(0, rect.h - 2),
    };

    const stocks = squarifiedLayout(
      node.data.stocks.map((s) => ({ data: s, value: s.marketCap })),
      innerRect,
    );

    return { sector: node.data, rect, stocks };
  });
}

// ── Tooltip component ──

function HeatmapTooltip({
  stock,
  sectorName,
  x,
  y,
  containerRect,
}: {
  stock: HeatmapStock;
  sectorName: string;
  x: number;
  y: number;
  containerRect: DOMRect | null;
}) {
  const tooltipW = 200;
  const tooltipH = 100;

  // 컨테이너 안에서 위치 조정
  let left = x + 12;
  let top = y + 12;

  if (containerRect) {
    if (left + tooltipW > containerRect.width) left = x - tooltipW - 8;
    if (top + tooltipH > containerRect.height) top = y - tooltipH - 8;
    if (left < 0) left = 4;
    if (top < 0) top = 4;
  }

  return (
    <div
      className="absolute z-50 pointer-events-none rounded border border-zinc-700/60 bg-zinc-900/95 px-3 py-2 shadow-xl backdrop-blur"
      style={{ left, top, minWidth: tooltipW }}
    >
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
    </div>
  );
}

// ── Skeleton ──

function HeatmapSkeleton() {
  return (
    <div className="flex-1 flex items-center justify-center">
      <div className="text-center">
        <div className="inline-flex items-center gap-2 mb-2">
          <div className="w-4 h-4 border-2 border-zinc-600 border-t-zinc-300 rounded-full animate-spin" />
          <span className="text-[11px] text-zinc-500 font-mono">
            S&P 500 히트맵 로딩 중...
          </span>
        </div>
        <p className="text-[10px] text-zinc-600">
          첫 호출 시 10~15초 소요될 수 있습니다
        </p>
      </div>
    </div>
  );
}

function HeatmapError({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <div className="flex-1 flex items-center justify-center p-8">
      <div className="text-center">
        <div className="w-10 h-10 rounded-full bg-red-500/10 flex items-center justify-center mx-auto mb-3">
          <span className="text-red-500 text-lg">!</span>
        </div>
        <p className="text-xs text-red-400 mb-1">히트맵 로드 실패</p>
        <p className="text-[10px] text-zinc-500 max-w-[200px] mb-3">{message}</p>
        <button
          onClick={onRetry}
          className="inline-flex items-center gap-1.5 px-3 py-1 rounded text-[10px] font-medium text-zinc-300 bg-zinc-800 hover:bg-zinc-700 transition-colors"
        >
          <RefreshCw className="w-3 h-3" />
          재시도
        </button>
      </div>
    </div>
  );
}

// ── Main component ──

interface SP500HeatmapProps {
  enabled: boolean;
}

export default function SP500Heatmap({ enabled }: SP500HeatmapProps) {
  const router = useRouter();
  const containerRef = useRef<HTMLDivElement>(null);
  const [dimensions, setDimensions] = useState({ w: 0, h: 0 });
  const { data, isLoading, error, refetch } = useHeatmapData(enabled);

  const [hovered, setHovered] = useState<{
    stock: HeatmapStock;
    sectorName: string;
  } | null>(null);
  const [tooltipPos, setTooltipPos] = useState({ x: 0, y: 0 });
  const [containerRect, setContainerRect] = useState<DOMRect | null>(null);

  // ResizeObserver로 컨테이너 크기 추적
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const observer = new ResizeObserver((entries) => {
      const entry = entries[0];
      if (entry) {
        setDimensions({
          w: entry.contentRect.width,
          h: entry.contentRect.height,
        });
      }
    });

    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  // Treemap 레이아웃 계산
  const layout = useMemo(() => {
    if (!data || dimensions.w === 0 || dimensions.h === 0) return [];
    return computeLayout(data.sectors, dimensions.w, dimensions.h);
  }, [data, dimensions]);

  // 총 종목 수
  const totalStocks = useMemo(
    () => (data?.sectors ?? []).reduce((sum, s) => sum + s.stocks.length, 0),
    [data],
  );

  const handleMouseMove = useCallback(
    (e: React.MouseEvent, stock: HeatmapStock, sectorName: string) => {
      const rect = containerRef.current?.getBoundingClientRect();
      if (!rect) return;
      setTooltipPos({
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
      });
      setContainerRect(rect);
      setHovered({ stock, sectorName });
    },
    [],
  );

  const handleMouseLeave = useCallback(() => {
    setHovered(null);
  }, []);

  const handleStockClick = useCallback(
    (ticker: string) => {
      router.push(`/stock/${ticker}`);
    },
    [router],
  );

  if (!enabled) return null;

  if (isLoading && !data) return <HeatmapSkeleton />;

  if (error && !data) return <HeatmapError message={error} onRetry={refetch} />;

  if (!data) {
    return (
      <div className="flex-1 flex items-center justify-center p-8">
        <p className="text-[11px] text-zinc-500">히트맵 데이터가 없습니다</p>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col min-h-0">
      {/* Info bar */}
      <div className="px-3 py-1.5 border-b border-zinc-800/60 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3 text-[10px] font-mono">
          <span className="text-zinc-500">
            {data.sectors.length} sectors
          </span>
          <span className="text-zinc-700">|</span>
          <span className="text-zinc-500">{totalStocks} stocks</span>
          {data.updatedAt && (
            <>
              <span className="text-zinc-700">|</span>
              <span className="text-zinc-600">
                {formatTimestamp(data.updatedAt)}
              </span>
            </>
          )}
          {isLoading && (
            <span className="text-zinc-600 animate-pulse">갱신 중...</span>
          )}
        </div>
        {/* 범례 */}
        <div className="flex items-center gap-2 text-[9px] font-mono text-zinc-600">
          <div className="flex items-center gap-1">
            <div
              className="w-2.5 h-2.5 rounded-sm"
              style={{ backgroundColor: getHeatColor(-HEATMAP_COLOR_RANGE_PCT) }}
            />
            <span>-{HEATMAP_COLOR_RANGE_PCT}%</span>
          </div>
          <div className="flex items-center gap-1">
            <div
              className="w-2.5 h-2.5 rounded-sm"
              style={{ backgroundColor: getHeatColor(0) }}
            />
            <span>0%</span>
          </div>
          <div className="flex items-center gap-1">
            <div
              className="w-2.5 h-2.5 rounded-sm"
              style={{ backgroundColor: getHeatColor(HEATMAP_COLOR_RANGE_PCT) }}
            />
            <span>+{HEATMAP_COLOR_RANGE_PCT}%</span>
          </div>
        </div>
      </div>

      {/* Treemap - ref 컨테이너는 항상 렌더링 (ResizeObserver 측정 필요) */}
      <div
        ref={containerRef}
        className="flex-1 relative min-h-0 overflow-hidden bg-[#0a0a0a]"
      >
        {layout.map((sectorLayout) => (
          <div key={sectorLayout.sector.name}>
            {/* 섹터 라벨 (충분한 크기일 때만) */}
            {sectorLayout.rect.w > 60 && sectorLayout.rect.h > 30 && (
              <div
                className="absolute z-10 pointer-events-none"
                style={{
                  left: sectorLayout.rect.x + 3,
                  top: sectorLayout.rect.y + 2,
                }}
              >
                <span className="text-[8px] font-mono font-bold text-white/30 uppercase tracking-wider">
                  {sectorLayout.sector.name}
                </span>
              </div>
            )}

            {/* 종목 셀 */}
            {sectorLayout.stocks.map((stockNode) => {
              const { rect } = stockNode;
              const stock = stockNode.data;
              const showText =
                rect.w >= HEATMAP_MIN_CELL_TEXT_W &&
                rect.h >= HEATMAP_MIN_CELL_TEXT_H;
              const showPct = rect.h >= HEATMAP_MIN_CELL_PCT_H && showText;

              return (
                <div
                  key={stock.ticker}
                  className="absolute border border-[#0a0a0a] cursor-pointer transition-[filter] duration-100 hover:brightness-125 hover:z-20 flex flex-col items-center justify-center overflow-hidden"
                  style={{
                    left: rect.x,
                    top: rect.y,
                    width: rect.w,
                    height: rect.h,
                    backgroundColor: getHeatColor(stock.changePct),
                  }}
                  onClick={() => handleStockClick(stock.ticker)}
                  onMouseMove={(e) =>
                    handleMouseMove(e, stock, sectorLayout.sector.name)
                  }
                  onMouseLeave={handleMouseLeave}
                >
                  {showText && (
                    <>
                      <span
                        className="font-mono font-bold leading-tight"
                        style={{
                          fontSize: rect.w > 70 ? 11 : 9,
                          color: getTextColor(stock.changePct),
                        }}
                      >
                        {stock.ticker}
                      </span>
                      {showPct && (
                        <span
                          className="font-mono tabular-nums leading-tight"
                          style={{
                            fontSize: rect.w > 70 ? 10 : 8,
                            color: getTextColor(stock.changePct),
                            opacity: 0.8,
                          }}
                        >
                          {stock.changePct >= 0 ? '+' : ''}
                          {stock.changePct.toFixed(2)}%
                        </span>
                      )}
                    </>
                  )}
                </div>
              );
            })}
          </div>
        ))}

        {/* Tooltip */}
        {hovered && (
          <HeatmapTooltip
            stock={hovered.stock}
            sectorName={hovered.sectorName}
            x={tooltipPos.x}
            y={tooltipPos.y}
            containerRect={containerRect}
          />
        )}
      </div>
    </div>
  );
}
