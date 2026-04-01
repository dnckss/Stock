'use client';

import Link from 'next/link';
import { ArrowLeft, RefreshCw } from 'lucide-react';
import { useStrategyData } from '@/hooks/useStrategy';
import StrategySkeleton from '@/components/strategy/StrategySkeleton';
import StrategySectorHeatmap from '@/components/strategy/StrategySectorHeatmap';
import StrategyTopPicks from '@/components/strategy/StrategyTopPicks';
import StrategyNewsThemes from '@/components/strategy/StrategyNewsThemes';
import StrategyRiskEvents from '@/components/strategy/StrategyRiskEvents';

function ErrorState({
  message,
  onRetry,
}: {
  message: string;
  onRetry: () => void;
}) {
  return (
    <main className="mx-auto max-w-7xl px-4 py-14">
      <div className="flex items-center justify-center">
        <div className="text-center">
          <div className="w-10 h-10 rounded-lg bg-red-500/10 border border-red-500/20 flex items-center justify-center mx-auto mb-4">
            <span className="text-red-400 text-sm font-mono font-bold">ERR</span>
          </div>
          <p className="text-xs text-red-400 font-mono mb-2">STRATEGY_LOAD_FAILED</p>
          <p className="text-[10px] text-zinc-500 max-w-[420px] mx-auto mb-4">
            {message}
          </p>
          <button
            type="button"
            onClick={onRetry}
            className="inline-flex items-center gap-2 text-[10px] font-mono text-zinc-400 hover:text-zinc-200 transition-colors border border-zinc-700 rounded px-3 py-1.5 hover:border-zinc-600"
          >
            <RefreshCw className="w-3 h-3" />
            RETRY
          </button>
        </div>
      </div>
    </main>
  );
}

function formatGeneratedAt(iso: string | null): string {
  if (!iso) return '';
  try {
    return new Date(iso).toLocaleString('ko-KR', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    });
  } catch {
    return iso;
  }
}

export default function StrategyPage() {
  const { data, isLoading, error, retry } = useStrategyData();

  return (
    <div className="min-h-screen bg-[#0a0a0a]">
      {/* Navigation Bar */}
      <nav className="sticky top-0 z-50 border-b border-zinc-800 bg-[#0a0a0a]/95 backdrop-blur-sm">
        <div className="max-w-[1400px] mx-auto px-4 py-2.5 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link
              href="/"
              className="flex items-center gap-1.5 text-zinc-500 hover:text-zinc-300 transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span className="font-mono text-[10px] uppercase tracking-widest">
                Terminal
              </span>
            </Link>
            <span className="text-zinc-800">|</span>
            <div className="flex items-center gap-2">
              <span className="font-mono text-xs font-bold text-zinc-100 tracking-wider">
                Quant<span className="text-green-500">ix</span>
              </span>
              <span className="text-[10px] text-zinc-600 font-mono">
                STRATEGY
              </span>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {data?.generatedAt && (
              <span className="text-[9px] font-mono text-zinc-600">
                GENERATED {formatGeneratedAt(data.generatedAt)}
              </span>
            )}
            <span className="relative flex h-1.5 w-1.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-green-500" />
            </span>
          </div>
        </div>
      </nav>

      {isLoading ? (
        <StrategySkeleton />
      ) : error ? (
        <ErrorState message={error} onRetry={retry} />
      ) : data ? (
        <main className="max-w-[1400px] mx-auto px-4 py-4 space-y-3">
          {/* Row 1: Market Briefing */}
          <section className="rounded-lg border border-zinc-800 bg-zinc-900/40 overflow-hidden">
            <div className="px-4 py-2 bg-zinc-800/40 border-b border-zinc-800 flex items-center gap-2">
              <span className="h-1.5 w-1.5 rounded-full bg-green-500 animate-pulse" />
              <h1 className="text-[10px] font-mono font-bold text-zinc-400 uppercase tracking-widest">
                AI Market Briefing
              </h1>
            </div>
            <div className="p-4">
              <p className="text-[13px] text-zinc-200 leading-relaxed whitespace-pre-line">
                {data.marketSummary}
              </p>
            </div>
          </section>

          {/* Row 2: News Themes + Risk/Econ side by side */}
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-3">
            <div className="lg:col-span-3">
              <StrategyNewsThemes themes={data.newsThemes} />
            </div>
            <div className="lg:col-span-2">
              <StrategyRiskEvents
                econImpact={data.econImpact}
                riskEvents={data.riskEvents}
              />
            </div>
          </div>

          {/* Row 3: Sector Heatmap */}
          <StrategySectorHeatmap data={data} />

          {/* Row 4: AI Top Picks - full width, prominent */}
          <StrategyTopPicks
            picks={data.topPicks}
            newsThemes={data.newsThemes}
          />
        </main>
      ) : null}

      <footer className="border-t border-zinc-800 mt-6">
        <div className="max-w-[1400px] mx-auto px-4 py-3 flex items-center justify-between text-[9px] font-mono text-zinc-700">
          <span>QUANTIX v3.7.2 | STRATEGY ENGINE</span>
          <span>&copy; 2025 Quantix Terminal</span>
        </div>
      </footer>
    </div>
  );
}
