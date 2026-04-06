'use client';

import { useState, useMemo, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { ChevronRight } from 'lucide-react';
import { SIGNAL_CONFIG, RADAR_TABS, type RadarSortKey } from '@/lib/constants';
import {
  formatReturn,
  formatSentiment,
  formatDivergence,
  formatPrice,
  formatVolume,
  formatTimestamp,
} from '@/lib/api';
import type { RadarStock } from '@/types/dashboard';
import { cn } from '@/lib/utils';

const DIVERGENCE_MAX = 0.5;

interface AIPredictionRadarProps {
  stocks: RadarStock[];
  isLoading: boolean;
  error: string | null;
  updatedAt: string | null;
}

function sortAndFilter(
  stocks: RadarStock[],
  key: RadarSortKey,
): RadarStock[] {
  const list = [...stocks];

  switch (key) {
    case 'volatility':
      return list.sort(
        (a, b) => Math.abs(b.priceReturn) - Math.abs(a.priceReturn),
      );
    case 'gainers':
      return list.sort((a, b) => b.priceReturn - a.priceReturn);
    case 'losers':
      return list.sort((a, b) => a.priceReturn - b.priceReturn);
    case 'volume':
      return list.sort((a, b) => b.volume - a.volume);
    case 'divergence':
      return list.sort(
        (a, b) => Math.abs(b.divergence) - Math.abs(a.divergence),
      );
    case 'buy':
      return list
        .filter((s) => s.signal === 'BUY')
        .sort((a, b) => Math.abs(b.divergence) - Math.abs(a.divergence));
    case 'sell':
      return list
        .filter((s) => s.signal === 'SELL')
        .sort((a, b) => Math.abs(b.divergence) - Math.abs(a.divergence));
    default:
      return list;
  }
}

function DivergenceGauge({ value }: { value: number }) {
  const clamped = Math.max(-DIVERGENCE_MAX, Math.min(DIVERGENCE_MAX, value));
  const pct = (Math.abs(clamped) / DIVERGENCE_MAX) * 50;
  const isPositive = value >= 0;

  return (
    <div className="flex items-center gap-2">
      <div className="relative w-20 h-1.5 bg-zinc-800 rounded-full overflow-hidden">
        <div className="absolute left-1/2 top-0 bottom-0 w-px bg-zinc-600/50" />
        {isPositive ? (
          <div
            className="absolute top-0 bottom-0 left-1/2 rounded-r-full bg-green-500"
            style={{ width: `${pct}%` }}
          />
        ) : (
          <div
            className="absolute top-0 bottom-0 right-1/2 rounded-l-full bg-red-500"
            style={{ width: `${pct}%` }}
          />
        )}
      </div>
      <span
        className={cn(
          'font-mono text-[10px] tabular-nums w-14 text-right',
          isPositive ? 'text-green-500' : 'text-red-500',
        )}
      >
        {formatDivergence(value)}
      </span>
    </div>
  );
}

function SignalBadge({ signal }: { signal: RadarStock['signal'] }) {
  const config = SIGNAL_CONFIG[signal];
  return (
    <span
      className={cn(
        'inline-flex items-center justify-center w-14 py-0.5 rounded text-[10px] font-bold font-mono tracking-widest',
        config.textColor,
        config.bgGlow,
      )}
    >
      {signal}
    </span>
  );
}

function PredictionRow({
  stock,
  onClick,
}: {
  stock: RadarStock;
  onClick: () => void;
}) {
  const sentimentPositive = stock.sentiment >= 0;

  return (
    <tr
      onClick={onClick}
      className={cn(
        'group hover:bg-zinc-800/50 transition-colors border-b border-zinc-800/50 cursor-pointer',
        stock.isTopPick && 'animate-signal-glow',
      )}
    >
      <td className="py-2.5 px-3">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded bg-zinc-800 flex items-center justify-center shrink-0">
            <span className="text-[8px] font-bold text-zinc-400 tracking-tight">
              {stock.ticker.slice(0, 2)}
            </span>
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-semibold text-zinc-100">
                {stock.ticker}
              </span>
              {stock.isTopPick && (
                <span className="text-[8px] px-1 py-px rounded bg-yellow-500/15 text-yellow-500 font-bold">
                  TOP
                </span>
              )}
            </div>
            <div className="text-[10px] text-zinc-500 truncate">
              {stock.name}
            </div>
          </div>
        </div>
      </td>

      <td className="py-2.5 px-2 text-right">
        <span className="font-mono text-[11px] text-zinc-300 tabular-nums">
          ${formatPrice(stock.price)}
        </span>
      </td>

      <td className="py-2.5 px-2 text-right">
        <span
          className={cn(
            'font-mono text-xs font-medium tabular-nums',
            stock.priceReturn >= 0 ? 'text-green-500' : 'text-red-500',
          )}
        >
          {formatReturn(stock.priceReturn)}
        </span>
      </td>

      <td className="py-2.5 px-2 text-right">
        <span className="font-mono text-[10px] text-zinc-400 tabular-nums">
          {formatVolume(stock.volume)}
        </span>
      </td>

      <td className="py-2.5 px-2 text-center">
        <SignalBadge signal={stock.signal} />
      </td>

      <td className="py-2.5 px-2">
        <DivergenceGauge value={stock.divergence} />
      </td>

      <td className="py-2.5 px-2 text-right">
        <span
          className={cn(
            'font-mono text-xs tabular-nums',
            sentimentPositive ? 'text-green-400' : 'text-red-400',
          )}
        >
          {formatSentiment(stock.sentiment)}
        </span>
      </td>

      <td className="py-2.5 pr-3 w-8">
        <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center justify-center">
          <ChevronRight className="w-3.5 h-3.5 text-zinc-500" />
        </div>
      </td>
    </tr>
  );
}

function TableSkeleton() {
  return (
    <div className="flex-1 p-2">
      {Array.from({ length: 8 }).map((_, i) => (
        <div
          key={i}
          className="flex items-center gap-3 px-3 py-3 border-b border-zinc-800/30"
        >
          <div className="w-7 h-7 rounded bg-zinc-800 animate-pulse" />
          <div className="flex-1 space-y-1.5">
            <div className="h-3 w-16 bg-zinc-800 rounded animate-pulse" />
            <div className="h-2 w-28 bg-zinc-800/50 rounded animate-pulse" />
          </div>
          <div className="h-4 w-12 bg-zinc-800 rounded animate-pulse" />
        </div>
      ))}
    </div>
  );
}

function ErrorState({ message }: { message: string }) {
  return (
    <div className="flex-1 flex items-center justify-center p-8">
      <div className="text-center">
        <div className="w-10 h-10 rounded-full bg-red-500/10 flex items-center justify-center mx-auto mb-3">
          <span className="text-red-500 text-lg">!</span>
        </div>
        <p className="text-xs text-red-400 mb-1">연결 실패</p>
        <p className="text-[10px] text-zinc-500 max-w-[200px]">{message}</p>
      </div>
    </div>
  );
}

function EmptyState({ label }: { label: string }) {
  return (
    <div className="flex-1 flex items-center justify-center p-8">
      <div className="text-center">
        <p className="text-[11px] text-zinc-500">
          &apos;{label}&apos; 조건에 해당하는 종목이 없습니다
        </p>
      </div>
    </div>
  );
}

export default function AIPredictionRadar({
  stocks,
  isLoading,
  error,
  updatedAt,
}: AIPredictionRadarProps) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<RadarSortKey>('divergence');

  const sorted = useMemo(
    () => sortAndFilter(stocks, activeTab),
    [stocks, activeTab],
  );

  const handleTabChange = useCallback((key: RadarSortKey) => {
    setActiveTab(key);
  }, []);

  const buyCount = stocks.filter((s) => s.signal === 'BUY').length;
  const sellCount = stocks.filter((s) => s.signal === 'SELL').length;
  const holdCount = stocks.filter((s) => s.signal === 'HOLD').length;

  const activeTabConfig = RADAR_TABS.find((t) => t.key === activeTab);

  return (
    <div className="h-full flex flex-col bg-zinc-900">
      {/* Header */}
      <div className="px-4 py-2 border-b border-zinc-800 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3">
          <h2 className="text-[10px] font-semibold text-zinc-400 uppercase tracking-widest">
            AI Prediction Radar
          </h2>
          <div className="flex items-center gap-1.5">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500" />
            </span>
            <span className="text-[10px] text-green-500 font-medium">
              LIVE
            </span>
          </div>
          {updatedAt && (
            <span className="text-[10px] text-zinc-500 font-mono">
              갱신 {formatTimestamp(updatedAt)}
            </span>
          )}
        </div>
        {stocks.length > 0 && (
          <div className="flex items-center gap-3 text-[10px] font-mono">
            <span className="text-green-500">{buyCount} BUY</span>
            <span className="text-yellow-500">{holdCount} HOLD</span>
            <span className="text-red-500">{sellCount} SELL</span>
            <span className="text-zinc-600 ml-1">
              {sorted.length}/{stocks.length}
            </span>
          </div>
        )}
      </div>

      {/* Sort/Filter Tabs */}
      <div className="px-3 py-1.5 border-b border-zinc-800/60 flex items-center gap-1 overflow-x-auto shrink-0 scrollbar-none">
        {RADAR_TABS.map((tab) => (
          <button
            key={tab.key}
            onClick={() => handleTabChange(tab.key)}
            className={cn(
              'px-2.5 py-1 rounded text-[10px] font-medium whitespace-nowrap transition-all duration-150',
              activeTab === tab.key
                ? tab.key === 'buy'
                  ? 'bg-green-500/15 text-green-400 ring-1 ring-green-500/30'
                  : tab.key === 'sell'
                    ? 'bg-red-500/15 text-red-400 ring-1 ring-red-500/30'
                    : 'bg-zinc-700/50 text-zinc-200 ring-1 ring-zinc-600/50'
                : 'text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800/50',
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Content */}
      {isLoading ? (
        <TableSkeleton />
      ) : error ? (
        <ErrorState message={error} />
      ) : sorted.length === 0 ? (
        <EmptyState label={activeTabConfig?.label ?? activeTab} />
      ) : (
        <div className="relative flex-1 overflow-y-auto terminal-scroll">
          <div className="absolute top-0 left-0 right-0 h-px z-20 overflow-hidden pointer-events-none">
            <div className="animate-live-sweep absolute h-full w-[40%] bg-gradient-to-r from-transparent via-green-500/80 to-transparent" />
          </div>

          <table className="w-full">
            <thead className="sticky top-0 bg-zinc-900 z-10">
              <tr className="border-b border-zinc-800">
                <th className="py-2 px-3 text-left text-[9px] font-medium text-zinc-600 uppercase tracking-wider w-[150px]">
                  Ticker
                </th>
                <th className="py-2 px-2 text-right text-[9px] font-medium text-zinc-600 uppercase tracking-wider">
                  Price
                </th>
                <th className="py-2 px-2 text-right text-[9px] font-medium text-zinc-600 uppercase tracking-wider">
                  5D Return
                </th>
                <th className="py-2 px-2 text-right text-[9px] font-medium text-zinc-600 uppercase tracking-wider">
                  Vol
                </th>
                <th className="py-2 px-2 text-center text-[9px] font-medium text-zinc-600 uppercase tracking-wider">
                  Signal
                </th>
                <th className="py-2 px-2 text-left text-[9px] font-medium text-zinc-600 uppercase tracking-wider">
                  Divergence
                </th>
                <th className="py-2 px-2 text-right text-[9px] font-medium text-zinc-600 uppercase tracking-wider">
                  Sent.
                </th>
                <th className="w-8" />
              </tr>
            </thead>
            <tbody>
              {sorted.map((stock) => (
                <PredictionRow
                  key={stock.ticker}
                  stock={stock}
                  onClick={() => router.push(`/stock/${stock.ticker}`)}
                />
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
