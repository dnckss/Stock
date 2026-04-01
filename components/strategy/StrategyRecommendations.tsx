'use client';

import { motion } from 'framer-motion';
import StrategyRecommendationCard from './StrategyRecommendationCard';
import type { StrategyRecommendation, StrategyNewsTheme } from '@/types/dashboard';

export default function StrategyRecommendations({
  recommendations,
  newsThemes = [],
}: {
  recommendations: StrategyRecommendation[];
  newsThemes?: StrategyNewsTheme[];
}) {
  if (recommendations.length === 0) return null;

  return (
    <section className="rounded-lg border border-zinc-800 bg-zinc-900/40 overflow-hidden">
      <div className="px-4 py-2 bg-zinc-800/40 border-b border-zinc-800 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
          <h2 className="text-[10px] font-mono font-bold text-zinc-400 uppercase tracking-widest">
            AI Recommendations
          </h2>
        </div>
        <span className="text-[9px] font-mono text-zinc-600">
          {recommendations.length} PICKS
        </span>
      </div>

      {recommendations.map((rec, idx) => (
        <motion.div
          key={rec.ticker}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: idx * 0.08, duration: 0.3 }}
        >
          <StrategyRecommendationCard rec={rec} newsThemes={newsThemes} />
        </motion.div>
      ))}
    </section>
  );
}
