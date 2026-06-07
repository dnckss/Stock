'use client';

import { useState } from 'react';
import { RefreshCw, ChevronDown, Target } from 'lucide-react';
import PageHeader from '@/components/common/PageHeader';
import { motion, AnimatePresence } from 'framer-motion';
import { useStrategyData } from '@/hooks/useStrategy';
import StrategyLoadingCanvas from '@/components/strategy/StrategyLoadingCanvas';
import StrategyRiskWarnings from '@/components/strategy/StrategyRiskWarnings';
import StrategyMarketSituation from '@/components/strategy/StrategyMarketSituation';
import StrategyNewsThemes from '@/components/strategy/StrategyNewsThemes';
import StrategyEconPanel from '@/components/strategy/StrategyEconPanel';
import StrategySectorHeatmap from '@/components/strategy/StrategySectorHeatmap';
import StrategyRecommendationCard from '@/components/strategy/StrategyRecommendationCard';
import {
  STRATEGY_DIRECTION_CONFIG,
  STRATEGY_CONFIDENCE_CONFIG,
} from '@/lib/strategyConstants';
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

  // 전략실에는 매수(BUY) 추천만 노출한다.
  const buyPicks = data?.recommendations.filter((r) => r.direction === 'BUY') ?? [];

  return (
    <div className="min-h-screen bg-[#09090b]">
      {/* Ambient background glow */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-[400px] -right-[300px] w-[800px] h-[800px] rounded-full bg-emerald-500/[0.03] blur-[120px]" />
        <div className="absolute top-[50%] -left-[300px] w-[600px] h-[600px] rounded-full bg-blue-500/[0.03] blur-[120px]" />
        <div className="absolute -bottom-[200px] right-[30%] w-[500px] h-[500px] rounded-full bg-zinc-500/[0.015] blur-[120px]" />
      </div>

      <PageHeader title="Strategy">
        {data?.generatedAt && (
          <span className="text-xs font-mono text-zinc-600 hidden sm:block">
            {formatGeneratedAt(data.generatedAt)}
          </span>
        )}
        <button
          type="button"
          onClick={retry}
          disabled={isLoading}
          className="text-zinc-500 hover:text-zinc-300 disabled:opacity-40 transition-colors"
          title="새로고침"
        >
          <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
        </button>
        <span className="relative flex h-2 w-2">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
          <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
        </span>
      </PageHeader>

      {/* Content */}
      {isLoading ? (
        <div className="h-[calc(100vh-56px)] flex flex-col">
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

          {/* Recommendations (BUY only) */}
          <motion.div variants={cardVariants}>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
                  <Target className="w-4 h-4 text-emerald-400" />
                </div>
                <div>
                  <h2 className="text-sm font-semibold text-zinc-100">Top Picks</h2>
                  <p className="text-xs text-zinc-500">{buyPicks.length} 종목 추천</p>
                </div>
              </div>
            </div>

            <div className="space-y-3">
              {buyPicks.length === 0 ? (
                <div className="flex items-center justify-center py-12 bg-zinc-900/40 border border-zinc-800/50 rounded-xl">
                  <span className="text-sm text-zinc-600">추천 종목이 없습니다</span>
                </div>
              ) : (
                buyPicks.map((rec, i) => (
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

          {/* Footer */}
          <motion.div
            className="mt-12 pb-6 flex items-center justify-between text-xs font-mono text-zinc-700"
            variants={cardVariants}
          >
            <span>Quantix Strategy</span>
            <span>&copy; 2026 Quantix</span>
          </motion.div>
        </motion.main>
      ) : null}
    </div>
  );
}
