'use client';

import { SIGNAL_CONFIG } from '@/lib/constants';
import StockLogo from '@/components/common/StockLogo';
import type { StockDetailState } from '@/hooks/useStockDetail';
import type { StockQuote } from '@/types/dashboard';

export default function StockHeader({
  detail,
  quote,
}: {
  detail: StockDetailState;
  quote: StockQuote | null;
}) {
  const config = SIGNAL_CONFIG[detail.signal];
  const price = quote?.price;
  const change = quote?.change;
  const changePct = quote?.changePct;
  const isUp = (change ?? 0) >= 0;

  return (
    <div className="px-4 py-3 border-b border-zinc-800 flex items-center justify-between gap-4">
      {/* Left: ticker + name + price */}
      <div className="flex items-center gap-4 min-w-0">
        <StockLogo ticker={detail.ticker} size={40} />
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <h1 className="text-base font-bold text-zinc-100 font-mono tracking-wider">
              {detail.ticker}
            </h1>
            {detail.name !== detail.ticker && (
              <span className="text-xs text-zinc-500 truncate">{detail.name}</span>
            )}
          </div>
          {price != null ? (
            <div className="flex items-baseline gap-2 mt-0.5">
              <span className="text-xl font-mono font-bold text-zinc-100 tabular-nums">
                ${price.toFixed(2)}
              </span>
              <span
                className={`text-sm font-mono font-semibold tabular-nums ${isUp ? 'text-green-400' : 'text-red-400'}`}
              >
                {isUp ? '+' : ''}
                {change?.toFixed(2)} ({isUp ? '+' : ''}
                {changePct?.toFixed(2)}%)
              </span>
            </div>
          ) : (
            <span className="text-xs text-zinc-500 font-mono mt-0.5 block">시세 로딩 중...</span>
          )}
        </div>
      </div>

      {/* Right: AI signal badge */}
      <div className="shrink-0 text-right">
        <span className="text-[9px] font-mono text-zinc-600 uppercase">AI Signal</span>
        <div className="flex items-center gap-2 mt-0.5 justify-end">
          <span
            className={`text-2xl font-black font-mono tracking-tight ${config.textColor}`}
            style={{ textShadow: `0 0 20px ${config.shadowColor}` }}
          >
            {detail.signal}
          </span>
          <span className={`text-[10px] font-mono ${config.textColor}`}>
            {detail.confidence.toFixed(0)}%
          </span>
        </div>
      </div>
    </div>
  );
}
