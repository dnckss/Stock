'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, RefreshCw, ChevronDown } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useStrategyData } from '@/hooks/useStrategy';
import { usePortfolioStream } from '@/hooks/usePortfolioStream';
import StrategySkeleton from '@/components/strategy/StrategySkeleton';
import StrategyRiskWarnings from '@/components/strategy/StrategyRiskWarnings';
import StrategyMarketSituation from '@/components/strategy/StrategyMarketSituation';
import StrategyNewsThemes from '@/components/strategy/StrategyNewsThemes';
import StrategyEconPanel from '@/components/strategy/StrategyEconPanel';
import StrategySectorHeatmap from '@/components/strategy/StrategySectorHeatmap';
import StrategyRecommendationCard from '@/components/strategy/StrategyRecommendationCard';
import PortfolioForm from '@/components/portfolio/PortfolioForm';
import PortfolioStreamView from '@/components/portfolio/PortfolioStreamView';
import PortfolioResultView from '@/components/portfolio/PortfolioResultView';
import type { PortfolioFormValues } from '@/components/portfolio/PortfolioForm';
import {
  STRATEGY_DIRECTION_CONFIG,
  STRATEGY_CONFIDENCE_CONFIG,
} from '@/lib/strategyConstants';
import type { StrategyRecommendation, StrategyNewsTheme } from '@/types/dashboard';

function ErrorState({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <div className="flex-1 flex items-center justify-center">
      <div className="text-center">
        <p className="text-xs text-red-400 font-mono mb-2">STRATEGY_LOAD_FAILED</p>
        <p className="text-[10px] text-zinc-500 max-w-[400px] mx-auto mb-4">{message}</p>
        <button
          type="button"
          onClick={onRetry}
          className="inline-flex items-center gap-1.5 text-[10px] font-mono text-zinc-400 hover:text-zinc-200 border border-zinc-700 rounded px-3 py-1.5 hover:border-zinc-600 transition-colors"
        >
          <RefreshCw className="w-3 h-3" />
          RETRY
        </button>
      </div>
    </div>
  );
}

function formatGeneratedAt(iso: string | null): string {
  if (!iso) return '';
  try {
    return new Date(iso).toLocaleString('ko-KR', {
      month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', hour12: false,
    });
  } catch { return iso; }
}

/* ── Recommendation table row ── */
function RecommendationRow({
  rec,
  isOpen,
  onToggle,
  newsThemes,
}: {
  rec: StrategyRecommendation;
  isOpen: boolean;
  onToggle: () => void;
  newsThemes: StrategyNewsTheme[];
}) {
  const dir = STRATEGY_DIRECTION_CONFIG[rec.direction];
  const conf = STRATEGY_CONFIDENCE_CONFIG[rec.confidence];

  return (
    <div className="border-b border-zinc-800/50 last:border-b-0">
      {/* Collapsed row */}
      <button
        type="button"
        onClick={onToggle}
        className="w-full text-left px-3 py-2 flex items-center gap-3 hover:bg-zinc-800/30 transition-colors group"
      >
        {/* Direction badge */}
        <span className={`shrink-0 w-[52px] text-center text-[10px] font-mono font-black py-0.5 rounded ${dir.bg} ${dir.text} border ${dir.border}`}>
          {dir.label}
        </span>

        {/* Ticker */}
        <span className="shrink-0 w-[60px] font-mono text-xs font-bold text-zinc-100 tracking-wider">
          {rec.ticker}
        </span>

        {/* Name */}
        <span className="hidden md:block shrink-0 w-[120px] text-[10px] text-zinc-500 truncate">
          {rec.name || '-'}
        </span>

        {/* Rationale preview */}
        <span className="flex-1 min-w-0 text-[10px] text-zinc-400 truncate">
          {rec.rationale}
        </span>

        {/* Price levels */}
        <span className="hidden lg:flex items-center gap-2 shrink-0 text-[9px] font-mono">
          {rec.entryPrice !== null && <span className="text-blue-400">E {rec.entryPrice.toFixed(1)}</span>}
          {rec.targetPrice !== null && <span className="text-green-400">T {rec.targetPrice.toFixed(1)}</span>}
          {rec.stopLoss !== null && <span className="text-red-400">SL {rec.stopLoss.toFixed(1)}</span>}
        </span>

        {/* Confidence mini-bar */}
        <div className="shrink-0 w-[50px] hidden sm:block">
          <div className="h-1 rounded-full bg-zinc-800 overflow-hidden">
            <div className={`h-full rounded-full ${conf.color} ${conf.width}`} />
          </div>
        </div>

        {/* R:R */}
        {rec.riskRewardRatio !== null && (
          <span className="shrink-0 w-[40px] text-[9px] font-mono text-zinc-500 text-right tabular-nums">
            1:{rec.riskRewardRatio.toFixed(1)}
          </span>
        )}

        {/* Expand icon */}
        <ChevronDown
          className={`shrink-0 w-3.5 h-3.5 text-zinc-600 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
        />
      </button>

      {/* Expanded detail */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="border-t border-zinc-800/30 bg-zinc-900/60">
              <StrategyRecommendationCard rec={rec} newsThemes={newsThemes} />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function StrategyPage() {
  const { data, isLoading, error, retry } = useStrategyData();
  const [openTicker, setOpenTicker] = useState<string | null>(null);
  const [showPortfolioForm, setShowPortfolioForm] = useState(false);

  const stream = usePortfolioStream();
  const isStreaming = stream.status === 'streaming' || stream.status === 'connecting';

  const handlePortfolioSubmit = (values: PortfolioFormValues) => {
    setShowPortfolioForm(false);
    stream.start({
      budget: values.budget,
      style: values.style,
      period: values.period,
      exclude: values.exclude || undefined,
    });
  };

  const handleStreamCancel = () => {
    stream.reset();
  };

  const handleRegenerate = () => {
    stream.reset();
    setShowPortfolioForm(true);
  };

  return (
    <div className="h-screen flex flex-col bg-[#0a0a0a] overflow-hidden">
      {/* Nav */}
      <nav className="shrink-0 border-b border-zinc-800 bg-[#0a0a0a]">
        <div className="px-3 py-1.5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/" className="flex items-center gap-1 text-zinc-500 hover:text-zinc-300 transition-colors">
              <ArrowLeft className="w-3 h-3" />
              <span className="font-mono text-[9px] uppercase tracking-widest">Terminal</span>
            </Link>
            <span className="text-zinc-800">|</span>
            <span className="font-mono text-[11px] font-bold text-zinc-100 tracking-wider">
              Quant<span className="text-green-500">ix</span>
            </span>
            <span className="text-[9px] text-zinc-600 font-mono">STRATEGY</span>
          </div>
          <div className="flex items-center gap-3">
            {data?.generatedAt && (
              <span className="text-[9px] font-mono text-zinc-600">
                {formatGeneratedAt(data.generatedAt)}
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
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Risk banner */}
          {data.riskWarnings.length > 0 && (
            <div className="shrink-0 px-3 py-1">
              <StrategyRiskWarnings warnings={data.riskWarnings} />
            </div>
          )}

          {/* Dashboard grid */}
          <div className="flex-1 flex overflow-hidden min-h-0">
            {/* Left column: Market + News + Econ */}
            <div className="w-[340px] shrink-0 border-r border-zinc-800 flex flex-col overflow-y-auto terminal-scroll">
              <StrategyMarketSituation
                summary={data.marketSummary}
                regime={data.marketRegime}
                fearGreed={data.fearGreed}
              />
              <StrategyNewsThemes themes={data.newsThemes} />
              <StrategyEconPanel data={data.econAnalysis} />
            </div>

            {/* Right column: Sector + Recommendations */}
            <div className="flex-1 flex flex-col overflow-hidden min-w-0">
              {/* Sector chart - compact */}
              {data.sectors.length > 0 && (
                <div className="shrink-0 border-b border-zinc-800">
                  <StrategySectorHeatmap data={data} />
                </div>
              )}

              {/* Recommendations table */}
              <div className="flex-1 flex flex-col overflow-hidden min-h-0">
                <div className="shrink-0 px-3 py-1.5 bg-zinc-800/30 border-b border-zinc-800 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    <span className="text-[9px] font-mono font-bold text-zinc-400 uppercase tracking-widest">
                      Recommendations
                    </span>
                  </div>
                  <span className="text-[9px] font-mono text-zinc-600">
                    {data.recommendations.length} PICKS
                  </span>
                </div>

                {/* Table header */}
                <div className="shrink-0 px-3 py-1 bg-zinc-900/80 border-b border-zinc-800/40 flex items-center gap-3 text-[8px] font-mono text-zinc-600 uppercase tracking-wider">
                  <span className="w-[52px]">Signal</span>
                  <span className="w-[60px]">Ticker</span>
                  <span className="hidden md:block w-[120px]">Name</span>
                  <span className="flex-1">Rationale</span>
                  <span className="hidden lg:block w-[180px] text-right">Levels</span>
                  <span className="hidden sm:block w-[50px]">Conf.</span>
                  <span className="w-[40px] text-right">R:R</span>
                  <span className="w-3.5" />
                </div>

                {/* Scrollable rows + portfolio */}
                <div className="flex-1 overflow-y-auto terminal-scroll">
                  {data.recommendations.length === 0 ? (
                    <div className="flex items-center justify-center py-8">
                      <span className="text-[10px] font-mono text-zinc-600">NO RECOMMENDATIONS</span>
                    </div>
                  ) : (
                    data.recommendations.map((rec) => (
                      <RecommendationRow
                        key={rec.ticker}
                        rec={rec}
                        isOpen={openTicker === rec.ticker}
                        onToggle={() =>
                          setOpenTicker((prev) => (prev === rec.ticker ? null : rec.ticker))
                        }
                        newsThemes={data.newsThemes}
                      />
                    ))
                  )}

                  {/* Portfolio Builder */}
                  <div className="border-t border-zinc-800">
                    {/* Idle: show trigger button */}
                    {stream.status === 'idle' && !showPortfolioForm && (
                      <div className="flex justify-center py-4">
                        <button
                          type="button"
                          onClick={() => setShowPortfolioForm(true)}
                          className="inline-flex items-center gap-2 text-[11px] font-mono px-4 py-2 rounded-lg border border-violet-500/40 bg-violet-500/10 text-violet-400 hover:bg-violet-500/20 transition-colors"
                        >
                          <span className="h-1.5 w-1.5 rounded-full bg-violet-500 animate-pulse" />
                          AI 포트폴리오 생성
                        </button>
                      </div>
                    )}

                    {/* Form modal */}
                    {showPortfolioForm && (
                      <div className="fixed inset-0 z-50 flex items-center justify-center">
                        <div
                          className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                          onClick={() => setShowPortfolioForm(false)}
                        />
                        <div className="relative w-full max-w-[480px] mx-4 rounded-xl border border-zinc-700 bg-zinc-900 shadow-2xl">
                          <div className="px-4 py-3 border-b border-zinc-800 flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <span className="h-1.5 w-1.5 rounded-full bg-violet-500 animate-pulse" />
                              <span className="text-[11px] font-mono font-bold text-zinc-300 uppercase tracking-widest">
                                AI 포트폴리오 빌더
                              </span>
                            </div>
                            <button
                              type="button"
                              onClick={() => setShowPortfolioForm(false)}
                              className="text-[10px] font-mono text-zinc-500 hover:text-zinc-300 transition-colors"
                            >
                              ✕
                            </button>
                          </div>
                          <div className="p-5">
                            <PortfolioForm onSubmit={handlePortfolioSubmit} isLoading={false} />
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Streaming progress */}
                    {(isStreaming || stream.status === 'error') && !stream.result && (
                      <PortfolioStreamView
                        status={stream.status}
                        currentStep={stream.currentStep}
                        totalSteps={stream.totalSteps}
                        currentAgent={stream.currentAgent}
                        thinkingLog={stream.thinkingLog}
                        error={stream.error}
                        onCancel={handleStreamCancel}
                      />
                    )}

                    {/* Complete: show result */}
                    {stream.result && (
                      <div>
                        <div className="px-3 py-1.5 bg-zinc-800/30 border-b border-zinc-800 flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className="h-1.5 w-1.5 rounded-full bg-violet-500" />
                            <span className="text-[9px] font-mono font-bold text-zinc-500 uppercase tracking-widest">
                              AI 포트폴리오
                            </span>
                          </div>
                          <button
                            type="button"
                            onClick={handleRegenerate}
                            className="text-[9px] font-mono text-zinc-600 hover:text-zinc-400 transition-colors"
                          >
                            다시 생성
                          </button>
                        </div>
                        <div className="px-4 py-4">
                          <PortfolioResultView data={stream.result} />
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Status bar */}
          <div className="shrink-0 px-3 py-1 border-t border-zinc-800 flex items-center justify-between text-[8px] font-mono text-zinc-700">
            <span>QUANTIX STRATEGY ENGINE</span>
            <span>&copy; 2025 Quantix</span>
          </div>
        </div>
      ) : null}
    </div>
  );
}
