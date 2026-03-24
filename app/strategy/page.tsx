'use client';

import Link from 'next/link';
import { ArrowLeft, RefreshCw } from 'lucide-react';
import { useStrategyData } from '@/hooks/useStrategy';
import StrategySkeleton from '@/components/strategy/StrategySkeleton';
import StrategySectorHeatmap from '@/components/strategy/StrategySectorHeatmap';
import StrategyTopPicks from '@/components/strategy/StrategyTopPicks';

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
          <div className="w-12 h-12 rounded-full bg-red-500/10 flex items-center justify-center mx-auto mb-4">
            <span className="text-red-500 text-xl font-bold">!</span>
          </div>
          <p className="text-sm text-red-400 mb-3">전략 데이터를 불러오지 못했습니다</p>
          <p className="text-[10px] text-zinc-500 max-w-[420px] mx-auto">
            {message}
          </p>
          <button
            type="button"
            onClick={onRetry}
            className="mt-6 inline-flex items-center gap-2 text-xs text-zinc-400 hover:text-zinc-200 transition-colors border border-zinc-700 rounded-lg px-3 py-1.5 hover:border-zinc-600"
          >
            <RefreshCw className="w-3 h-3" />
            다시 시도
          </button>
        </div>
      </div>
    </main>
  );
}

export default function StrategyPage() {
  const { data, isLoading, error, retry } = useStrategyData();

  return (
    <div className="min-h-screen bg-[#0a0a0a]">
      {/* Navigation Bar */}
      <nav className="sticky top-0 z-50 border-b border-zinc-800 bg-zinc-900/80 backdrop-blur-sm">
        <div className="max-w-5xl mx-auto px-6 py-3 flex items-center justify-between">
          <Link
            href="/"
            className="flex items-center gap-2 text-sm text-zinc-400 hover:text-zinc-200 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span className="font-mono text-[10px] uppercase tracking-widest">
              Back to Terminal
            </span>
          </Link>
          <div className="flex items-center gap-3">
            <span className="font-mono text-sm font-bold text-zinc-100 tracking-wider">
              QUANT<span className="text-green-500">AI</span>
            </span>
            <span className="text-zinc-700">|</span>
            <span className="text-[10px] text-zinc-500 font-mono">
              AI Strategy Room
            </span>
          </div>
        </div>
      </nav>

      {isLoading ? (
        <StrategySkeleton />
      ) : error ? (
        <ErrorState message={error} onRetry={retry} />
      ) : data ? (
        <main className="mx-auto max-w-7xl px-4 py-8 space-y-6">
          {/* Top Section: Market Summary */}
          <section className="rounded-2xl border border-zinc-800/50 bg-zinc-900/60 backdrop-blur-xl p-6 relative overflow-hidden">
            <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-zinc-700/60 to-transparent" />
            <div className="flex items-center justify-between gap-4 mb-4">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-green-500/10 border border-green-500/20 flex items-center justify-center">
                  <span className="h-2 w-2 rounded-full bg-green-400 animate-pulse" />
                </div>
                <div>
                  <h1 className="text-sm font-bold text-zinc-100 tracking-wider font-mono">
                    AI Market Strategist Briefing
                  </h1>
                  <p className="text-xs text-zinc-500 mt-1">
                    시장 요약: AI 모델이 포착한 핵심 맥락
                  </p>
                </div>
              </div>
            </div>

            <blockquote className="rounded-xl border border-zinc-800/50 bg-zinc-950/30 p-5 relative overflow-hidden">
              <div className="pointer-events-none absolute inset-y-0 left-0 w-1.5 bg-gradient-to-b from-emerald-400/45 to-red-400/25" />
              <p className="text-sm text-zinc-200 leading-relaxed whitespace-pre-line">
                {data.marketSummary}
              </p>
              <div className="pointer-events-none absolute -top-20 left-0 right-0 h-16 bg-gradient-to-r from-transparent via-white/10 to-transparent animate-pulse opacity-40" />
            </blockquote>
          </section>

          {/* Middle Section: Sector Heatmap / Chart */}
          <StrategySectorHeatmap data={data} />

          {/* Bottom Section: AI's Top Picks */}
          <StrategyTopPicks picks={data.topPicks} />
        </main>
      ) : null}

      <footer className="border-t border-zinc-800 mt-10">
        <div className="max-w-5xl mx-auto px-6 py-4 flex items-center justify-between text-[9px] font-mono text-zinc-600">
          <span>AI MODEL v3.7.2</span>
          <span>© 2025 QuantAI Terminal</span>
        </div>
      </footer>
    </div>
  );
}

