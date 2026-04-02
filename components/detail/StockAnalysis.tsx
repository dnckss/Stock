'use client';

import { Loader2, RefreshCw, TrendingUp, TrendingDown, Minus, AlertTriangle, Target, Shield } from 'lucide-react';
import type { StockAnalysis, TrendType, TechnicalCondition, ReboundRating, StrategyAction } from '@/types/dashboard';

const TREND_CONFIG: Record<TrendType, { icon: typeof TrendingUp; text: string; bg: string; label: string }> = {
  uptrend: { icon: TrendingUp, text: 'text-green-400', bg: 'bg-green-500/10', label: '상승 추세' },
  downtrend: { icon: TrendingDown, text: 'text-red-400', bg: 'bg-red-500/10', label: '하락 추세' },
  sideways: { icon: Minus, text: 'text-yellow-400', bg: 'bg-yellow-500/10', label: '횡보' },
};

const CONDITION_CONFIG: Record<TechnicalCondition, { text: string; bg: string; label: string }> = {
  oversold: { text: 'text-blue-400', bg: 'bg-blue-500/10', label: '과매도' },
  overbought: { text: 'text-red-400', bg: 'bg-red-500/10', label: '과매수' },
  neutral: { text: 'text-zinc-400', bg: 'bg-zinc-700/20', label: '중립' },
};

const REBOUND_CONFIG: Record<ReboundRating, { text: string; bg: string; label: string }> = {
  high: { text: 'text-green-400', bg: 'bg-green-500/10', label: '높음' },
  medium: { text: 'text-yellow-400', bg: 'bg-yellow-500/10', label: '보통' },
  low: { text: 'text-zinc-400', bg: 'bg-zinc-700/20', label: '낮음' },
};

const ACTION_CONFIG: Record<StrategyAction, { text: string; bg: string; border: string }> = {
  BUY: { text: 'text-green-400', bg: 'bg-green-500/10', border: 'border-green-500/30' },
  SELL: { text: 'text-red-400', bg: 'bg-red-500/10', border: 'border-red-500/30' },
  WAIT: { text: 'text-yellow-400', bg: 'bg-yellow-500/10', border: 'border-yellow-500/30' },
  HOLD: { text: 'text-zinc-400', bg: 'bg-zinc-700/20', border: 'border-zinc-600/30' },
};

function SectionHeader({ children }: { children: React.ReactNode }) {
  return (
    <div className="px-3 py-1 bg-zinc-800/20 border-y border-zinc-800/30">
      <span className="text-[8px] font-mono text-zinc-600 uppercase tracking-wider">{children}</span>
    </div>
  );
}

export default function StockAnalysisPanel({
  analysis,
  isLoading,
  error,
  onRetry,
}: {
  analysis: StockAnalysis | null;
  isLoading: boolean;
  error: string | null;
  onRetry: () => void;
}) {
  return (
    <div className="border-b border-zinc-800">
      {/* Header */}
      <div className="px-3 py-1.5 bg-zinc-800/30 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="h-1.5 w-1.5 rounded-full bg-violet-500 animate-pulse" />
          <span className="text-[9px] font-mono font-bold text-zinc-500 uppercase tracking-widest">
            AI 분석
          </span>
        </div>
        {analysis?.generatedAt && (
          <span className="text-[8px] font-mono text-zinc-600">
            {new Date(analysis.generatedAt).toLocaleString('ko-KR', { month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', hour12: false })}
          </span>
        )}
      </div>

      {/* Loading */}
      {isLoading && (
        <div className="px-3 py-6 flex items-center justify-center gap-2">
          <Loader2 className="w-3.5 h-3.5 text-violet-400 animate-spin" />
          <span className="text-[10px] text-zinc-500">AI가 분석 중입니다... (30~60초)</span>
        </div>
      )}

      {/* Error */}
      {!isLoading && error && (
        <div className="px-3 py-4 text-center">
          <p className="text-[10px] text-red-400 mb-2">{error}</p>
          <button
            onClick={onRetry}
            className="inline-flex items-center gap-1 text-[9px] font-mono text-zinc-400 hover:text-zinc-200 border border-zinc-700 rounded px-2 py-0.5 transition-colors"
          >
            <RefreshCw className="w-2.5 h-2.5" />
            재시도
          </button>
        </div>
      )}

      {/* Content */}
      {!isLoading && !error && analysis && (
        <div>
          {/* Overall Summary */}
          <div className="px-3 py-2">
            <p className="text-[11px] text-zinc-300 leading-relaxed">{analysis.overallSummary}</p>
          </div>

          {/* Price Action */}
          {analysis.priceAction.cause && (
            <>
              <SectionHeader>가격 동향</SectionHeader>
              <div className="px-3 py-2">
                <div className="flex items-center gap-2 mb-1.5">
                  {(() => {
                    const cfg = TREND_CONFIG[analysis.priceAction.trend];
                    const Icon = cfg.icon;
                    return (
                      <span className={`inline-flex items-center gap-1 text-[9px] font-mono font-bold px-1.5 py-0.5 rounded ${cfg.bg} ${cfg.text}`}>
                        <Icon className="w-3 h-3" />
                        {cfg.label}
                      </span>
                    );
                  })()}
                </div>
                <p className="text-[10px] text-zinc-400 leading-relaxed">{analysis.priceAction.cause}</p>
                {analysis.priceAction.keyEvents.length > 0 && (
                  <div className="mt-1.5 space-y-0.5">
                    {analysis.priceAction.keyEvents.map((e, i) => (
                      <div key={i} className="flex items-start gap-1.5">
                        <span className="mt-1 h-1 w-1 shrink-0 rounded-full bg-zinc-600" />
                        <span className="text-[9px] text-zinc-500">{e}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </>
          )}

          {/* Technical Diagnosis */}
          {analysis.technicalDiagnosis.summary && (
            <>
              <SectionHeader>기술적 진단</SectionHeader>
              <div className="px-3 py-2">
                {(() => {
                  const cfg = CONDITION_CONFIG[analysis.technicalDiagnosis.condition];
                  return (
                    <span className={`inline-flex text-[9px] font-mono font-bold px-1.5 py-0.5 rounded mb-1.5 ${cfg.bg} ${cfg.text}`}>
                      {cfg.label}
                    </span>
                  );
                })()}
                <p className="text-[10px] text-zinc-400 leading-relaxed mt-1">{analysis.technicalDiagnosis.summary}</p>
                {analysis.technicalDiagnosis.supportTest && (
                  <p className="text-[9px] text-zinc-500 mt-1">
                    <Shield className="w-3 h-3 inline mr-0.5 text-zinc-600" />
                    {analysis.technicalDiagnosis.supportTest}
                  </p>
                )}
              </div>
            </>
          )}

          {/* Rebound Potential */}
          {analysis.reboundPotential.reason && (
            <>
              <SectionHeader>반등 가능성</SectionHeader>
              <div className="px-3 py-2">
                {(() => {
                  const cfg = REBOUND_CONFIG[analysis.reboundPotential.rating];
                  return (
                    <span className={`inline-flex text-[9px] font-mono font-bold px-1.5 py-0.5 rounded mb-1.5 ${cfg.bg} ${cfg.text}`}>
                      {cfg.label}
                    </span>
                  );
                })()}
                <p className="text-[10px] text-zinc-400 leading-relaxed mt-1">{analysis.reboundPotential.reason}</p>
                {analysis.reboundPotential.catalysts.length > 0 && (
                  <div className="mt-1.5 space-y-0.5">
                    {analysis.reboundPotential.catalysts.map((c, i) => (
                      <div key={i} className="flex items-start gap-1.5">
                        <Target className="mt-0.5 w-2.5 h-2.5 shrink-0 text-zinc-600" />
                        <span className="text-[9px] text-zinc-500">{c}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </>
          )}

          {/* Risks */}
          {analysis.risks.length > 0 && (
            <>
              <SectionHeader>리스크</SectionHeader>
              <div className="px-3 py-2 space-y-1">
                {analysis.risks.map((r, i) => (
                  <div key={i} className="flex items-start gap-1.5">
                    <AlertTriangle className="mt-0.5 w-2.5 h-2.5 shrink-0 text-red-400/50" />
                    <span className="text-[9px] text-zinc-400">{r}</span>
                  </div>
                ))}
              </div>
            </>
          )}

          {/* Strategy */}
          {analysis.strategy.summary && (
            <>
              <SectionHeader>전략</SectionHeader>
              <div className="px-3 py-2">
                {(() => {
                  const cfg = ACTION_CONFIG[analysis.strategy.action];
                  return (
                    <span className={`inline-flex text-[10px] font-mono font-black px-2 py-0.5 rounded border mb-1.5 ${cfg.bg} ${cfg.border} ${cfg.text}`}>
                      {analysis.strategy.action}
                    </span>
                  );
                })()}
                <p className="text-[10px] text-zinc-300 leading-relaxed mt-1">{analysis.strategy.summary}</p>
                {analysis.strategy.entryCondition && (
                  <p className="text-[9px] text-zinc-500 mt-1">진입: {analysis.strategy.entryCondition}</p>
                )}
                {analysis.strategy.stopLossNote && (
                  <p className="text-[9px] text-red-400/60 mt-0.5">손절: {analysis.strategy.stopLossNote}</p>
                )}
              </div>
            </>
          )}
        </div>
      )}

      {/* Empty state */}
      {!isLoading && !error && !analysis && (
        <div className="px-3 py-4 text-center">
          <span className="text-[10px] text-zinc-600">분석 데이터 없음</span>
        </div>
      )}
    </div>
  );
}
