'use client';

import { MOCK_TERMINAL_DATA } from '@/lib/constants';
import type { MarketTickerItem } from '@/types/dashboard';

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

export default function GlobalMarketTicker() {
  const items = MOCK_TERMINAL_DATA.marketTicker;

  return (
    <div className="w-full bg-zinc-900/80 border-b border-zinc-800 overflow-hidden select-none">
      <div className="animate-marquee flex">
        <div className="flex shrink-0 items-center">
          {items.map((item) => (
            <TickerItem key={`a-${item.symbol}`} item={item} />
          ))}
        </div>
        <div className="flex shrink-0 items-center">
          {items.map((item) => (
            <TickerItem key={`b-${item.symbol}`} item={item} />
          ))}
        </div>
      </div>
    </div>
  );
}
