'use client';

import { ExternalLink } from 'lucide-react';
import {
  STRATEGY_DIRECTION_CONFIG,
  STRATEGY_CONFIDENCE_CONFIG,
} from '@/lib/strategyConstants';
import RecommendationPriceChart from './RecommendationPriceChart';
import RecommendationTechnicals from './RecommendationTechnicals';
import RecommendationRiskReward from './RecommendationRiskReward';
import type { StrategyRecommendation, StrategyNewsTheme } from '@/types/dashboard';

function findRelatedThemes(ticker: string, themes: StrategyNewsTheme[]): StrategyNewsTheme[] {
  return themes.filter((t) => t.tickers.includes(ticker.toUpperCase()));
}

export default function StrategyRecommendationCard({
  rec,
  newsThemes = [],
}: {
  rec: StrategyRecommendation;
  newsThemes?: StrategyNewsTheme[];
}) {
  const dir = STRATEGY_DIRECTION_CONFIG[rec.direction];
  const conf = STRATEGY_CONFIDENCE_CONFIG[rec.confidence];
  const related = findRelatedThemes(rec.ticker, newsThemes);
  const hasPriceLevels = rec.entryPrice !== null || rec.stopLoss !== null || rec.targetPrice !== null;

  return (
    <div className="border-b border-zinc-800/60 last:border-b-0 hover:bg-zinc-800/10 transition-colors">
      <div className="p-4">
        {/* Header: Ticker + Direction + Confidence */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-3">
            <div
              className={`h-10 px-4 rounded-lg border-2 ${dir.border} ${dir.bg} flex items-center justify-center shadow-lg ${dir.glow}`}
            >
              <span className={`font-mono text-sm font-black tracking-wider ${dir.text}`}>
                {rec.ticker}
              </span>
            </div>
            {rec.name && (
              <span className="text-[11px] text-zinc-500">{rec.name}</span>
            )}
            <span
              className={`text-[10px] font-mono font-black px-2 py-0.5 rounded border ${dir.border} ${dir.bg} ${dir.text}`}
            >
              {dir.label}
            </span>
          </div>
          <div className="flex items-center gap-3">
            {/* Confidence gauge */}
            <div className="w-[100px]">
              <div className="flex items-center justify-between mb-0.5">
                <span className="text-[8px] font-mono text-zinc-600">CONFIDENCE</span>
                <span className={`text-[9px] font-mono font-bold ${conf.text}`}>{conf.label}</span>
              </div>
              <div className="h-1 w-full bg-zinc-800 rounded-full overflow-hidden">
                <div className={`h-full rounded-full ${conf.color} ${conf.width} transition-all`} />
              </div>
            </div>
            {/* Price levels summary */}
            {hasPriceLevels && (
              <div className="hidden lg:flex items-center gap-2 text-[9px] font-mono">
                {rec.entryPrice !== null && (
                  <span className="text-blue-400">E:{rec.entryPrice.toFixed(1)}</span>
                )}
                {rec.stopLoss !== null && (
                  <span className="text-red-400">SL:{rec.stopLoss.toFixed(1)}</span>
                )}
                {rec.targetPrice !== null && (
                  <span className="text-green-400">T:{rec.targetPrice.toFixed(1)}</span>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Body: 2-column on desktop */}
        <div className="flex flex-col lg:flex-row gap-4">
          {/* Left: Rationale + Chart */}
          <div className="flex-1 min-w-0 space-y-3">
            <div>
              <span className="text-[9px] font-mono text-zinc-600 uppercase tracking-wider">
                Rationale
              </span>
              <p className="text-[12px] text-zinc-200 leading-relaxed whitespace-pre-line mt-1">
                {rec.rationale}
              </p>
            </div>

            {rec.priceHistory.length > 0 && (
              <RecommendationPriceChart
                priceHistory={rec.priceHistory}
                entryPrice={rec.entryPrice}
                stopLoss={rec.stopLoss}
                targetPrice={rec.targetPrice}
              />
            )}
          </div>

          {/* Right: Technicals + R/R */}
          {(rec.technicalIndicators || rec.riskRewardRatio !== null || hasPriceLevels) && (
            <div className="lg:w-[240px] shrink-0 space-y-4">
              <RecommendationTechnicals indicators={rec.technicalIndicators} />
              <RecommendationRiskReward
                entryPrice={rec.entryPrice}
                stopLoss={rec.stopLoss}
                targetPrice={rec.targetPrice}
                riskRewardRatio={rec.riskRewardRatio}
              />
            </div>
          )}
        </div>

        {/* Footer: Related news + themes */}
        {(rec.relatedNews.length > 0 || related.length > 0) && (
          <div className="mt-3 pt-3 border-t border-zinc-800/40">
            {related.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mb-2">
                {related.map((theme) => {
                  const sentColor =
                    theme.sentiment === 'positive'
                      ? 'text-green-400 border-green-500/30 bg-green-500/5'
                      : theme.sentiment === 'negative'
                        ? 'text-red-400 border-red-500/30 bg-red-500/5'
                        : 'text-zinc-400 border-zinc-600/30 bg-zinc-800/30';
                  return (
                    <span
                      key={theme.theme}
                      className={`inline-flex items-center gap-1 text-[9px] font-mono px-1.5 py-0.5 rounded border ${sentColor}`}
                    >
                      <span
                        className={`h-1 w-1 rounded-full ${
                          theme.sentiment === 'positive' ? 'bg-green-400' : theme.sentiment === 'negative' ? 'bg-red-400' : 'bg-zinc-400'
                        }`}
                      />
                      {theme.theme}
                    </span>
                  );
                })}
              </div>
            )}
            {rec.relatedNews.length > 0 && (
              <div className="space-y-1">
                {rec.relatedNews.map((news, i) => (
                  <div key={`${news.headline}-${i}`} className="flex items-center gap-2 group">
                    <span
                      className={`shrink-0 h-1 w-1 rounded-full ${
                        news.sentiment === 'positive' ? 'bg-green-500' : news.sentiment === 'negative' ? 'bg-red-500' : 'bg-zinc-500'
                      }`}
                    />
                    {news.url ? (
                      <a
                        href={news.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-[10px] text-zinc-400 hover:text-zinc-200 transition-colors truncate flex items-center gap-1"
                      >
                        {news.headline}
                        <ExternalLink className="shrink-0 w-2.5 h-2.5 opacity-0 group-hover:opacity-100 transition-opacity" />
                      </a>
                    ) : (
                      <span className="text-[10px] text-zinc-400 truncate">{news.headline}</span>
                    )}
                    {news.source && (
                      <span className="shrink-0 text-[9px] font-mono text-zinc-600">{news.source}</span>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
