'use client';

import { ExternalLink } from 'lucide-react';
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
  const related = findRelatedThemes(rec.ticker, newsThemes);

  return (
    <div className="p-3">
      {/* Rationale */}
      <p className="text-[11px] text-zinc-300 leading-relaxed whitespace-pre-line mb-3">
        {rec.rationale}
      </p>

      {/* 3-column: Chart | Technicals | R/R + News */}
      <div className="flex flex-col lg:flex-row gap-3">
        {/* Chart */}
        {rec.priceHistory.length > 0 && (
          <div className="flex-1 min-w-0">
            <RecommendationPriceChart
              priceHistory={rec.priceHistory}
              entryPrice={rec.entryPrice}
              stopLoss={rec.stopLoss}
              targetPrice={rec.targetPrice}
            />
          </div>
        )}

        {/* Technicals */}
        {rec.technicalIndicators && (
          <div className="lg:w-[200px] shrink-0">
            <RecommendationTechnicals indicators={rec.technicalIndicators} />
          </div>
        )}

        {/* R/R + Related */}
        <div className="lg:w-[180px] shrink-0 space-y-3">
          <RecommendationRiskReward
            entryPrice={rec.entryPrice}
            stopLoss={rec.stopLoss}
            targetPrice={rec.targetPrice}
            riskRewardRatio={rec.riskRewardRatio}
          />

          {/* Related themes */}
          {related.length > 0 && (
            <div>
              <span className="text-[8px] font-mono text-zinc-600 uppercase">Themes</span>
              <div className="mt-1 flex flex-wrap gap-1">
                {related.map((theme) => {
                  const c = theme.sentiment === 'positive' ? 'text-green-400 bg-green-500/5' : theme.sentiment === 'negative' ? 'text-red-400 bg-red-500/5' : 'text-zinc-400 bg-zinc-800/30';
                  return (
                    <span key={theme.theme} className={`text-[8px] font-mono px-1 py-px rounded ${c}`}>
                      {theme.theme}
                    </span>
                  );
                })}
              </div>
            </div>
          )}

          {/* Related news */}
          {rec.relatedNews.length > 0 && (
            <div>
              <span className="text-[8px] font-mono text-zinc-600 uppercase">News</span>
              <div className="mt-1 space-y-0.5">
                {rec.relatedNews.map((n, i) => (
                  <div key={`${n.headline}-${i}`} className="flex items-start gap-1 group">
                    <span className={`shrink-0 mt-1 h-1 w-1 rounded-full ${n.sentiment === 'positive' ? 'bg-green-500' : n.sentiment === 'negative' ? 'bg-red-500' : 'bg-zinc-500'}`} />
                    {n.url ? (
                      <a href={n.url} target="_blank" rel="noopener noreferrer" className="text-[9px] text-zinc-400 hover:text-zinc-200 transition-colors line-clamp-1 flex items-center gap-0.5">
                        {n.headline}
                        <ExternalLink className="shrink-0 w-2 h-2 opacity-0 group-hover:opacity-100" />
                      </a>
                    ) : (
                      <span className="text-[9px] text-zinc-500 line-clamp-1">{n.headline}</span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
