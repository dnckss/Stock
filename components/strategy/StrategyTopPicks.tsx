'use client';

import { motion } from 'framer-motion';
import type { StrategyTopPick } from '@/types/dashboard';

export default function StrategyTopPicks({
  picks,
}: {
  picks: StrategyTopPick[];
}) {
  return (
    <section className="rounded-2xl border border-zinc-800/50 bg-zinc-900/60 backdrop-blur-xl p-6">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-base font-bold text-zinc-100">AI&apos;s Top Picks</h2>
          <p className="text-xs text-zinc-500">3개의 핵심 종목을 엄선해 제공합니다</p>
        </div>
        <div className="flex items-center gap-2 text-[10px] text-zinc-500">
          <span className="h-2 w-2 rounded-full bg-emerald-400" />
          <span className="font-mono">{picks.length} picks</span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {picks.map((p) => (
          <motion.div
            key={p.ticker}
            whileHover={{ y: -6 }}
            transition={{ type: 'spring', stiffness: 320, damping: 22 }}
            className="group relative rounded-xl border border-zinc-800/50 bg-zinc-950/20 p-5 overflow-hidden hover:ring-1 hover:ring-emerald-500/30 transition-shadow"
          >
            <div className="pointer-events-none absolute -top-10 left-0 right-0 h-10 bg-gradient-to-r from-transparent via-white/10 to-transparent opacity-0 group-hover:opacity-70 transition-opacity duration-300" />
            <div className="pointer-events-none absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
              <div className="absolute -inset-1 rounded-xl blur-lg bg-emerald-500/10" />
              <div className="absolute inset-0 rounded-xl border border-emerald-500/20" />
            </div>

            <div className="flex items-center justify-between mb-3">
              <div className="h-9 w-24 rounded-lg bg-zinc-900/60 border border-zinc-800/50 flex items-center justify-center">
                <span className="font-mono text-xs text-zinc-200 tracking-wider">
                  {p.ticker.toUpperCase()}
                </span>
              </div>
              <div className="h-2 w-12 rounded-md bg-emerald-400/30 group-hover:bg-emerald-400/45 transition-colors" />
            </div>

            <p className="text-xs text-zinc-500 mb-2">추천 근거</p>
            <p className="text-sm text-zinc-200 leading-relaxed whitespace-pre-line line-clamp-6">
              {p.rationale}
            </p>
          </motion.div>
        ))}
      </div>
    </section>
  );
}

