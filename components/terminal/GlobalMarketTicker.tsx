'use client';

import type { MarketTickerItem } from '@/types/dashboard';

interface GlobalMarketTickerProps {
  items: MarketTickerItem[] | null;
  isLoading: boolean;
}

function TickerItem({ item }: { item: MarketTickerItem }) {
  const isPositive = item.changePercent >= 0;

  return (
    <div className="inline-flex items-center gap-2 px-5 py-1.5 border-r border-zinc-800/60">
      <span className="text-[10px] font-medium text-zinc-500 tracking-wide">
        {item.symbol}
      </span>
      <span className="font-mono text-[11px] font-semibold text-zinc-200">
        {item.price}
      </span>
      <span
        className={`font-mono text-[10px] font-medium ${
          isPositive ? 'text-green-500' : 'text-red-500'
        }`}
      >
        {isPositive ? '▲' : '▼'}{' '}
        {isPositive ? '+' : ''}
        {item.changePercent.toFixed(2)}%
      </span>
    </div>
  );
}

function TickerSkeleton() {
  return (
    <div className="w-full bg-zinc-900/80 border-b border-zinc-800 overflow-hidden select-none">
      <div className="flex items-center py-1.5">
        {Array.from({ length: 14 }).map((_, i) => (
          <div
            key={i}
            className="inline-flex items-center gap-2 px-5 py-0.5 border-r border-zinc-800/60"
          >
            <div className="h-2.5 w-8 bg-zinc-800 rounded animate-pulse" />
            <div className="h-3 w-16 bg-zinc-800/80 rounded animate-pulse" />
            <div className="h-2.5 w-12 bg-zinc-800/60 rounded animate-pulse" />
          </div>
        ))}
      </div>
    </div>
  );
}

export default function GlobalMarketTicker({
  items,
  isLoading,
}: GlobalMarketTickerProps) {
  if (isLoading) {
    return <TickerSkeleton />;
  }

  if (!items || items.length === 0) {
    return (
      <div className="w-full bg-zinc-900/80 border-b border-zinc-800 py-2 px-4">
        <p className="text-[10px] text-zinc-500 font-mono">
          시장 티커 데이터를 불러오지 못했습니다
        </p>
      </div>
    );
  }

  return (
    <div className="w-full bg-zinc-900/80 border-b border-zinc-800 overflow-hidden select-none">
      <div className="animate-marquee flex">
        <div className="flex shrink-0 items-center">
          {items.map((item, i) => (
            <TickerItem key={`a-${i}`} item={item} />
          ))}
        </div>
        <div className="flex shrink-0 items-center">
          {items.map((item, i) => (
            <TickerItem key={`b-${i}`} item={item} />
          ))}
        </div>
      </div>
    </div>
  );
}
