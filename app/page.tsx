'use client';

import { useState, useEffect } from 'react';
import GlobalMarketTicker from '@/components/terminal/GlobalMarketTicker';
import MacroIndicators from '@/components/terminal/MacroIndicators';
import AIPredictionRadar from '@/components/terminal/AIPredictionRadar';
import LiveSentimentFeed from '@/components/terminal/LiveSentimentFeed';

function useCurrentTime() {
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

  return time;
}

function TerminalBoot() {
  return (
    <div className="h-screen bg-[#0a0a0a] flex items-center justify-center">
      <div className="text-center animate-terminal-boot">
        <div className="text-xl font-mono font-bold text-zinc-100 tracking-widest mb-3">
          QUANT<span className="text-green-500">AI</span>
        </div>
        <div className="flex items-center gap-2 justify-center">
          <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
          <span className="text-[10px] text-zinc-500 font-mono tracking-wider">
            INITIALIZING TERMINAL...
          </span>
        </div>
      </div>
    </div>
  );
}

export default function TerminalPage() {
  const [isReady, setIsReady] = useState(false);
  const currentTime = useCurrentTime();

  useEffect(() => {
    const timer = setTimeout(() => setIsReady(true), 800);
    return () => clearTimeout(timer);
  }, []);

  if (!isReady) return <TerminalBoot />;

  return (
    <div className="h-screen flex flex-col bg-[#0a0a0a] overflow-hidden">
      {/* Section 1: Global Market Ticker */}
      <GlobalMarketTicker />

      {/* Terminal Header Bar */}
      <div className="flex items-center justify-between px-4 py-1.5 bg-zinc-900/50 border-b border-zinc-800 shrink-0">
        <div className="flex items-center gap-3">
          <span className="text-sm font-mono font-bold text-zinc-100 tracking-wider">
            QUANT<span className="text-green-500">AI</span>
          </span>
          <span className="text-zinc-700">|</span>
          <span className="text-[10px] text-zinc-500 uppercase tracking-widest font-medium">
            Global Trading Terminal
          </span>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5">
            <span className="relative flex h-1.5 w-1.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-green-500" />
            </span>
            <span className="text-[10px] text-green-500 font-mono font-medium">
              CONNECTED
            </span>
          </div>
          <span className="text-zinc-700">|</span>
          <div className="flex items-center gap-1.5">
            <span className="font-mono text-xs text-zinc-300 tabular-nums">
              {currentTime}
            </span>
            <span className="text-[9px] text-zinc-600 font-mono">KST</span>
          </div>
        </div>
      </div>

      {/* Main 3-Column Layout */}
      <div className="flex-1 flex overflow-hidden min-h-0">
        <div className="w-[280px] shrink-0 terminal-panel-1">
          <MacroIndicators />
        </div>
        <div className="flex-1 min-w-0 terminal-panel-2">
          <AIPredictionRadar />
        </div>
        <div className="w-[320px] shrink-0 terminal-panel-3">
          <LiveSentimentFeed />
        </div>
      </div>

      {/* Status Bar */}
      <div className="flex items-center justify-between px-4 py-1 bg-zinc-900/80 border-t border-zinc-800 shrink-0">
        <div className="flex items-center gap-3 text-[9px] font-mono">
          <span className="text-zinc-600">AI MODEL v3.7.2</span>
          <span className="text-zinc-800">|</span>
          <span className="text-zinc-600">LATENCY: 12ms</span>
          <span className="text-zinc-800">|</span>
          <span className="text-zinc-600">FEED: REAL-TIME</span>
        </div>
        <div className="flex items-center gap-3 text-[9px] font-mono">
          <span className="text-green-600">● MARKET OPEN</span>
          <span className="text-zinc-800">|</span>
          <span className="text-zinc-500">© 2025 QuantAI Terminal</span>
        </div>
      </div>
    </div>
  );
}
