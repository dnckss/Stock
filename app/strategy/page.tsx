'use client';

import Link from 'next/link';
import { ArrowLeft, RefreshCw } from 'lucide-react';
import { useStrategyData } from '@/hooks/useStrategy';
import StrategySkeleton from '@/components/strategy/StrategySkeleton';
import StrategyRiskWarnings from '@/components/strategy/StrategyRiskWarnings';
import StrategyMarketSituation from '@/components/strategy/StrategyMarketSituation';
import StrategyNewsThemes from '@/components/strategy/StrategyNewsThemes';
import StrategyEconPanel from '@/components/strategy/StrategyEconPanel';
import StrategySectorHeatmap from '@/components/strategy/StrategySectorHeatmap';
import StrategyRecommendations from '@/components/strategy/StrategyRecommendations';

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
          {/* Risk Warnings */}
          <StrategyRiskWarnings warnings={data.riskWarnings} />

          {/* Market Situation */}
          <StrategyMarketSituation
            summary={data.marketSummary}
            regime={data.marketRegime}
            fearGreed={data.fearGreed}
          />

          {/* News Themes + Econ Panel */}
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-3">
            <div className="lg:col-span-3">
              <StrategyNewsThemes themes={data.newsThemes} />
            </div>
            <div className="lg:col-span-2">
              <StrategyEconPanel data={data.econAnalysis} />
            </div>
          </div>

          {/* Sector Heatmap */}
          {data.sectors.length > 0 && <StrategySectorHeatmap data={data} />}

          {/* Recommendations */}
          <StrategyRecommendations
            recommendations={data.recommendations}
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
