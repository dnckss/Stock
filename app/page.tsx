'use client';

import { useState, useEffect, useMemo, memo } from 'react';
import Link from 'next/link';
import { useMarketData } from '@/hooks/useMarketData';
import { formatTimestamp } from '@/lib/api';
import StockSearch from '@/components/common/StockSearch';
import GlobalMarketTicker from '@/components/terminal/GlobalMarketTicker';
import MacroIndicators from '@/components/terminal/MacroIndicators';
import AIPredictionRadar from '@/components/terminal/AIPredictionRadar';
import LiveSentimentFeed from '@/components/terminal/LiveSentimentFeed';
import type { MarketTickerItem, MacroIndicator } from '@/types/dashboard';

/**
 * 매초 setInterval로 갱신되는 시계 — 부모를 리렌더링하지 않도록
 * 별도 컴포넌트로 격리한다. MacroIndicators/AIPredictionRadar/LiveSentimentFeed가
 * 매초 리렌더되던 문제를 제거.
 */
const TerminalClock = memo(function TerminalClock() {
  const [time, setTime] = useState('');

  useEffect(() => {
    const update = () => {
      setTime(
        new Date().toLocaleTimeString('en-US', {
          hour12: false,
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
        }),
      );
    };
    update();
    const interval = setInterval(update, 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="flex items-center gap-1.5">
      <span className="font-mono text-xs text-zinc-300 tabular-nums">
        {time}
      </span>
      <span className="text-[9px] text-zinc-600 font-mono">KST</span>
    </div>
  );
});

function TerminalBoot() {
  return (
    <div className="h-screen bg-[#0a0a0a] flex items-center justify-center">
      <div className="text-center animate-terminal-boot">
        <div className="text-xl font-mono font-bold text-zinc-100 tracking-widest mb-3">
          Quant<span className="text-green-500">ix</span>
        </div>
        <div className="flex items-center gap-2 justify-center">
          <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
          <span className="text-[10px] text-zinc-500 font-mono tracking-wider">
            LOADING...
          </span>
        </div>
      </div>
    </div>
  );
}

function toTickerItems(items: MacroIndicator[] | null | undefined): MarketTickerItem[] {
  if (!items) return [];
  return items.map((m) => ({
    symbol: m.label,
    name: m.label,
    price: m.value,
    change: m.change,
    changePercent: m.change,
  }));
}

export default function TerminalPage() {
  const [isBooted, setIsBooted] = useState(false);
  const {
    stocks,
    macro,
    newsFeed,
    economicCalendar,
    economicCalendarMeta,
    isEconomicLoading,
    updatedAt,
    isLoading,
    error,
    wsConnected,
  } = useMarketData();

  // macro snapshot이 동일 참조면 동일 ticker 배열을 재사용 → GlobalMarketTicker memo 적중
  const headerTickerItems: MarketTickerItem[] = useMemo(() => {
    if (!macro) return [];
    return [
      ...(macro.marquee ?? []),
      ...toTickerItems(macro.indices),
      ...toTickerItems(macro.indicators),
    ];
  }, [macro]);

  useEffect(() => {
    const timer = setTimeout(() => setIsBooted(true), 800);
    return () => clearTimeout(timer);
  }, []);

  if (!isBooted) return <TerminalBoot />;

  return (
    <div className="h-screen flex flex-col bg-[#0a0a0a] overflow-hidden">
      <GlobalMarketTicker
        items={headerTickerItems}
        isLoading={isLoading}
      />

      {/* Terminal Header Bar */}
      <div className="flex items-center justify-between px-4 py-1.5 bg-zinc-900/50 border-b border-zinc-800 shrink-0">
        <div className="flex items-center gap-3">
          <span className="text-sm font-mono font-bold text-zinc-100 tracking-wider">
            Quant<span className="text-green-500">ix</span>
          </span>
          <span className="text-zinc-700">|</span>
          <span className="text-[10px] text-zinc-500 uppercase tracking-widest font-medium">
            Market Intelligence
          </span>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5">
            {wsConnected ? (
              <>
                <span className="relative flex h-1.5 w-1.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-green-500" />
                </span>
                <span className="text-[10px] text-green-500 font-mono font-medium">
                  CONNECTED
                </span>
              </>
            ) : (
              <>
                <span className="relative flex h-1.5 w-1.5">
                  <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-yellow-500" />
                </span>
                <span className="text-[10px] text-yellow-500 font-mono font-medium">
                  RECONNECTING
                </span>
              </>
            )}
          </div>
          <span className="text-zinc-700">|</span>
          <TerminalClock />
          <Link
            href="/strategy"
            className="inline-flex items-center gap-1.5 px-2 py-1 rounded border border-zinc-800/50 bg-zinc-800/20 hover:bg-zinc-800/60 hover:border-zinc-700 transition-colors text-[10px] text-zinc-300 font-mono"
          >
            <span className="h-1.5 w-1.5 rounded-full bg-green-500 animate-pulse" />
            Strategy
          </Link>
          <Link
            href="/watchlist"
            className="inline-flex items-center gap-1.5 px-2 py-1 rounded border border-zinc-800/50 bg-zinc-800/20 hover:bg-zinc-800/60 hover:border-zinc-700 transition-colors text-[10px] text-zinc-300 font-mono"
          >
            Watchlist
          </Link>
          <Link
            href="/compare"
            className="inline-flex items-center gap-1.5 px-2 py-1 rounded border border-zinc-800/50 bg-zinc-800/20 hover:bg-zinc-800/60 hover:border-zinc-700 transition-colors text-[10px] text-zinc-300 font-mono"
          >
            Compare
          </Link>
          <StockSearch stocks={stocks} />
        </div>
      </div>

      {/* Main 3-Column Layout */}
      <div className="flex-1 flex overflow-hidden min-h-0">
        <div className="w-[280px] shrink-0 terminal-panel-1">
          <MacroIndicators
            indices={macro?.indices ?? null}
            indicators={macro?.indicators ?? null}
            fearGreed={macro?.fearGreed ?? null}
            isLoading={isLoading}
            economicCalendar={economicCalendar}
            economicError={economicCalendarMeta.error}
            isEconomicLoading={isEconomicLoading}
          />
        </div>
        <div className="flex-1 min-w-0 terminal-panel-2">
          <AIPredictionRadar
            stocks={stocks}
            isLoading={isLoading}
            error={error}
            updatedAt={updatedAt}
          />
        </div>
        <div className="w-[320px] shrink-0 terminal-panel-3">
          <LiveSentimentFeed
            items={newsFeed}
            isLoading={isLoading}
          />
        </div>
      </div>

      {/* Status Bar */}
      <div className="flex items-center justify-between px-4 py-1 bg-zinc-900/80 border-t border-zinc-800 shrink-0">
        <div className="flex items-center gap-3 text-[9px] font-mono">
          <span className="text-zinc-600">Quantix</span>
          <span className="text-zinc-800">|</span>
          {wsConnected ? (
            <span className="text-green-600">● WS CONNECTED</span>
          ) : (
            <span className="text-yellow-600">○ RECONNECTING</span>
          )}
          <span className="text-zinc-800">|</span>
          <span className="text-zinc-600">
            {updatedAt
              ? `UPDATED: ${formatTimestamp(updatedAt)}`
              : 'AWAITING DATA...'}
          </span>
        </div>
        <div className="flex items-center gap-3 text-[9px] font-mono">
          <span className="text-zinc-500">© 2026 Quantix</span>
        </div>
      </div>
    </div>
  );
}
