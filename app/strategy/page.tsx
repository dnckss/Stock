'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, RefreshCw, ChevronDown, Sparkles, Target } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useStrategyData } from '@/hooks/useStrategy';
import { usePortfolioStream } from '@/hooks/usePortfolioStream';
import StrategyLoadingCanvas from '@/components/strategy/StrategyLoadingCanvas';
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
import { PORTFOLIO_MAX_WEIGHT_DEFAULT } from '@/lib/constants';
import type { StrategyRecommendation, StrategyNewsTheme } from '@/types/dashboard';

/* ── Helpers ── */

function ErrorState({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <div className="flex-1 flex items-center justify-center min-h-[60vh]">
      <div className="text-center space-y-4">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-red-500/10 border border-red-500/20">
          <RefreshCw className="w-6 h-6 text-red-400" />
        </div>
        <div>
          <p className="text-sm font-medium text-red-400 mb-1">전략 데이터를 불러올 수 없습니다</p>
          <p className="text-xs text-zinc-500 max-w-sm mx-auto">{message}</p>
        </div>
        <button
          type="button"
          onClick={onRetry}
          className="inline-flex items-center gap-2 text-sm font-medium text-zinc-300 hover:text-white
                     bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 hover:border-zinc-600
                     rounded-xl px-5 py-2.5 transition-all duration-200"
        >
          <RefreshCw className="w-4 h-4" />
          다시 시도
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

/* ── Animation variants ── */

const containerVariants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.08 } },
};

const cardVariants = {
  hidden: { opacity: 0, y: 20, scale: 0.98 },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] as const },
  },
};

/* ── Recommendation card ── */

function RecommendationRow({
  rec,
  isOpen,
  onToggle,
  newsThemes,
  index,
}: {
  rec: StrategyRecommendation;
  isOpen: boolean;
  onToggle: () => void;
  newsThemes: StrategyNewsTheme[];
  index: number;
}) {
  const dir = STRATEGY_DIRECTION_CONFIG[rec.direction];
  const conf = STRATEGY_CONFIDENCE_CONFIG[rec.confidence];

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.1 + index * 0.06, ease: [0.25, 0.46, 0.45, 0.94] }}
    >
      <div
        className={`bg-zinc-900/40 border rounded-xl overflow-hidden transition-all duration-300
          ${isOpen ? 'border-zinc-700/60 shadow-lg shadow-black/20' : 'border-zinc-800/50 hover:border-zinc-700/50'}`}
      >
        {/* Collapsed header */}
        <button
          type="button"
          onClick={onToggle}
          className="w-full text-left px-5 py-3.5 flex items-center gap-4 hover:bg-white/[0.02] transition-colors"
        >
          {/* Direction badge */}
          <span
            className={`shrink-0 w-14 text-center text-[11px] font-mono font-black py-1.5 rounded-lg
              ${dir.bg} ${dir.text} border ${dir.border}`}
          >
            {dir.label}
          </span>

          {/* Ticker + Name */}
          <div className="shrink-0 min-w-[80px]">
            <span className="font-mono text-sm font-bold text-zinc-100 tracking-wide block">
              {rec.ticker}
            </span>
            {rec.name && (
              <span className="hidden md:block text-[11px] text-zinc-500 truncate max-w-[120px]">
                {rec.name}
              </span>
            )}
          </div>

          {/* Rationale preview */}
          <span className="flex-1 min-w-0 text-xs text-zinc-400 truncate">
            {rec.rationale}
          </span>

          {/* Price levels */}
          <div className="hidden lg:flex items-center gap-2 shrink-0">
            {rec.entryPrice !== null && (
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-blue-500/10 text-blue-400 border border-blue-500/20">
                E {rec.entryPrice.toFixed(1)}
              </span>
            )}
            {rec.targetPrice !== null && (
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                T {rec.targetPrice.toFixed(1)}
              </span>
            )}
            {rec.stopLoss !== null && (
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-red-500/10 text-red-400 border border-red-500/20">
                SL {rec.stopLoss.toFixed(1)}
              </span>
            )}
          </div>

          {/* Confidence */}
          <div className="shrink-0 hidden sm:flex items-center gap-2">
            <div className="w-14 h-1.5 rounded-full bg-zinc-800 overflow-hidden">
              <div className={`h-full rounded-full ${conf.color} ${conf.width} transition-all`} />
            </div>
            <span className={`text-[10px] font-mono ${conf.text}`}>{conf.label}</span>
          </div>

          {/* R:R */}
          {rec.riskRewardRatio !== null && (
            <span className="shrink-0 text-[11px] font-mono text-zinc-500 tabular-nums">
              1:{rec.riskRewardRatio.toFixed(1)}
            </span>
          )}

          {/* Expand icon */}
          <ChevronDown
            className={`shrink-0 w-4 h-4 text-zinc-600 transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`}
          />
        </button>

        {/* Expanded detail */}
        <AnimatePresence>
          {isOpen && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.3, ease: [0.25, 0.46, 0.45, 0.94] }}
              className="overflow-hidden"
            >
              <div className="border-t border-zinc-800/50 bg-black/20">
                <StrategyRecommendationCard rec={rec} newsThemes={newsThemes} />
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}

/* ── Main page ── */

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
      include: values.include || undefined,
      preferred_sectors: values.preferredSectors.length > 0 ? values.preferredSectors.join(',') : undefined,
      max_weight: values.maxWeight !== PORTFOLIO_MAX_WEIGHT_DEFAULT ? values.maxWeight : undefined,
      target_return: values.targetReturn ? Number(values.targetReturn) : undefined,
      dividend_preference: values.dividendPreference || undefined,
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
    <div className="min-h-screen bg-[#09090b]">
      {/* Ambient background glow */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-[400px] -right-[300px] w-[800px] h-[800px] rounded-full bg-emerald-500/[0.03] blur-[120px]" />
        <div className="absolute top-[50%] -left-[300px] w-[600px] h-[600px] rounded-full bg-blue-500/[0.03] blur-[120px]" />
        <div className="absolute -bottom-[200px] right-[30%] w-[500px] h-[500px] rounded-full bg-violet-500/[0.02] blur-[120px]" />
      </div>

      {/* Nav */}
      <nav className="sticky top-0 z-50 bg-[#09090b]/80 backdrop-blur-xl border-b border-zinc-800/50">
        <div className="max-w-7xl mx-auto px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/" className="flex items-center gap-1.5 text-zinc-500 hover:text-zinc-300 transition-colors">
              <ArrowLeft className="w-4 h-4" />
              <span className="text-xs font-medium hidden sm:block">Terminal</span>
            </Link>
            <div className="h-4 w-px bg-zinc-800" />
            <div className="flex items-center gap-2.5">
              <span className="text-base font-bold text-zinc-100 tracking-tight">
                Quant<span className="text-emerald-400">ix</span>
              </span>
              <span className="text-[10px] font-mono text-zinc-600 uppercase tracking-widest">Strategy</span>
            </div>
          </div>
          <div className="flex items-center gap-4">
            {data?.generatedAt && (
              <span className="text-xs font-mono text-zinc-600 hidden sm:block">
                {formatGeneratedAt(data.generatedAt)}
              </span>
            )}
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
            </span>
          </div>
        </div>
      </nav>

      {/* Content */}
      {isLoading ? (
        <div className="h-[calc(100vh-56px)]">
          <StrategyLoadingCanvas />
        </div>
      ) : error ? (
        <ErrorState message={error} onRetry={retry} />
      ) : data ? (
        <motion.main
          className="relative max-w-7xl mx-auto px-6 py-8"
          initial="hidden"
          animate="visible"
          variants={containerVariants}
        >
          {/* Risk warnings */}
          {data.riskWarnings.length > 0 && (
            <motion.div className="mb-6" variants={cardVariants}>
              <StrategyRiskWarnings warnings={data.riskWarnings} />
            </motion.div>
          )}

          {/* Market Overview */}
          <motion.div className="mb-6" variants={cardVariants}>
            <StrategyMarketSituation
              summary={data.marketSummary}
              regime={data.marketRegime}
              fearGreed={data.fearGreed}
            />
          </motion.div>

          {/* Sector Divergence */}
          {data.sectors.length > 0 && (
            <motion.div className="mb-6" variants={cardVariants}>
              <StrategySectorHeatmap data={data} />
            </motion.div>
          )}

          {/* News + Econ grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
            <motion.div variants={cardVariants}>
              <StrategyNewsThemes themes={data.newsThemes} />
            </motion.div>
            <motion.div variants={cardVariants}>
              <StrategyEconPanel data={data.econAnalysis} />
            </motion.div>
          </div>

          {/* Recommendations */}
          <motion.div variants={cardVariants}>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
                  <Target className="w-4 h-4 text-emerald-400" />
                </div>
                <div>
                  <h2 className="text-sm font-semibold text-zinc-100">AI Recommendations</h2>
                  <p className="text-xs text-zinc-500">{data.recommendations.length} picks selected</p>
                </div>
              </div>
            </div>

            <div className="space-y-3">
              {data.recommendations.length === 0 ? (
                <div className="flex items-center justify-center py-12 bg-zinc-900/40 border border-zinc-800/50 rounded-xl">
                  <span className="text-sm text-zinc-600">추천 종목이 없습니다</span>
                </div>
              ) : (
                data.recommendations.map((rec, i) => (
                  <RecommendationRow
                    key={rec.ticker}
                    rec={rec}
                    isOpen={openTicker === rec.ticker}
                    onToggle={() =>
                      setOpenTicker((prev) => (prev === rec.ticker ? null : rec.ticker))
                    }
                    newsThemes={data.newsThemes}
                    index={i}
                  />
                ))
              )}
            </div>
          </motion.div>

          {/* Portfolio Builder */}
          <motion.div className="mt-8" variants={cardVariants}>
            {/* Idle: trigger button */}
            {stream.status === 'idle' && !showPortfolioForm && (
              <div className="flex justify-center py-6">
                <button
                  type="button"
                  onClick={() => setShowPortfolioForm(true)}
                  className="group inline-flex items-center gap-3 text-sm font-medium px-6 py-3 rounded-xl
                             border border-violet-500/30 bg-violet-500/10 text-violet-400
                             hover:bg-violet-500/20 hover:border-violet-500/50 transition-all duration-300
                             shadow-lg shadow-violet-500/5 hover:shadow-violet-500/10"
                >
                  <Sparkles className="w-4 h-4 group-hover:scale-110 transition-transform" />
                  AI 포트폴리오 생성
                </button>
              </div>
            )}

            {/* Form modal */}
            <AnimatePresence>
              {showPortfolioForm && (
                <div className="fixed inset-0 z-50 flex items-center justify-center">
                  <div
                    className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                    onClick={() => setShowPortfolioForm(false)}
                  />
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95, y: 10 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: 10 }}
                    className="relative w-full max-w-2xl mx-4 max-h-[90vh] rounded-2xl border border-zinc-700/50 bg-zinc-900 shadow-2xl flex flex-col overflow-hidden"
                  >
                    <div className="px-6 py-4 border-b border-zinc-800/50 flex items-center justify-between shrink-0">
                      <div className="flex items-center gap-2.5">
                        <Sparkles className="w-4 h-4 text-violet-400" />
                        <span className="text-sm font-semibold text-zinc-200">AI 포트폴리오 빌더</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => setShowPortfolioForm(false)}
                        className="text-zinc-500 hover:text-zinc-300 transition-colors text-lg leading-none"
                      >
                        ✕
                      </button>
                    </div>
                    <div className="p-6 overflow-y-auto flex-1">
                      <PortfolioForm onSubmit={handlePortfolioSubmit} isLoading={false} />
                    </div>
                  </motion.div>
                </div>
              )}
            </AnimatePresence>

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
                strategyData={data}
              />
            )}

            {/* Complete: result */}
            {stream.result && (
              <div className="bg-zinc-900/40 border border-zinc-800/50 rounded-2xl overflow-hidden">
                <div className="px-5 py-3.5 border-b border-zinc-800/50 flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <Sparkles className="w-4 h-4 text-violet-400" />
                    <span className="text-sm font-semibold text-zinc-200">AI 포트폴리오</span>
                  </div>
                  <button
                    type="button"
                    onClick={handleRegenerate}
                    className="text-xs text-zinc-500 hover:text-zinc-300 transition-colors"
                  >
                    다시 생성
                  </button>
                </div>
                <div className="p-5">
                  <PortfolioResultView data={stream.result} />
                </div>
              </div>
            )}
          </motion.div>

          {/* Footer */}
          <motion.div
            className="mt-12 pb-6 flex items-center justify-between text-xs font-mono text-zinc-700"
            variants={cardVariants}
          >
            <span>QUANTIX STRATEGY ENGINE</span>
            <span>&copy; 2025 Quantix</span>
          </motion.div>
        </motion.main>
      ) : null}
    </div>
  );
}
