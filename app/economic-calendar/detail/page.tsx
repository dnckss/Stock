'use client';

import { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Loader2, RefreshCw, TrendingUp, TrendingDown, Clock, BarChart3, BookOpen, AlertTriangle } from 'lucide-react';
import { fetchEconEventDetail, parseEconEventDetail } from '@/lib/api';
import type { EconEventDetail } from '@/types/dashboard';

function SectionHeader({ icon: Icon, children }: { icon: typeof TrendingUp; children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-2 mb-2">
      <Icon className="w-3.5 h-3.5 text-zinc-500" />
      <h3 className="text-[11px] font-mono font-bold text-zinc-400 uppercase tracking-wider">{children}</h3>
    </div>
  );
}

export default function EconEventDetailPage() {
  const searchParams = useSearchParams();
  const event = searchParams.get('event') ?? '';
  const country = searchParams.get('country') ?? undefined;
  const currency = searchParams.get('currency') ?? undefined;
  const forecast = searchParams.get('forecast') ?? undefined;
  const previous = searchParams.get('previous') ?? undefined;

  const [detail, setDetail] = useState<EconEventDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!event) {
      setError('이벤트명이 필요합니다');
      setIsLoading(false);
      return;
    }
    setIsLoading(true);
    setError(null);
    try {
      const raw = await fetchEconEventDetail({ event, country, currency, forecast, previous });
      const parsed = parseEconEventDetail(raw);
      setDetail(parsed);
      if (!parsed) setError('상세 정보를 파싱할 수 없습니다');
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : '경제 일정 상세를 불러올 수 없습니다');
    } finally {
      setIsLoading(false);
    }
  }, [event, country, currency, forecast, previous]);

  useEffect(() => {
    void load();
  }, [load]);

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-zinc-100">
      {/* Header */}
      <header className="sticky top-0 z-10 bg-zinc-900/95 backdrop-blur border-b border-zinc-800">
        <div className="max-w-3xl mx-auto px-4 py-3 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Link
              href="/economic-calendar"
              className="inline-flex items-center gap-1.5 text-[11px] text-zinc-400 hover:text-zinc-200 transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              경제 일정
            </Link>
          </div>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-6">
        {/* Loading */}
        {isLoading && (
          <div className="flex items-center justify-center gap-2 py-16">
            <Loader2 className="w-4 h-4 text-violet-400 animate-spin" />
            <span className="text-[11px] text-zinc-500">AI가 분석 중입니다... (최초 요청 시 30~60초)</span>
          </div>
        )}

        {/* Error */}
        {!isLoading && error && (
          <div className="text-center py-16">
            <p className="text-[11px] text-red-400 mb-3">{error}</p>
            <button
              onClick={() => void load()}
              className="inline-flex items-center gap-1.5 text-[10px] font-mono text-zinc-400 hover:text-zinc-200 border border-zinc-700 rounded px-3 py-1 transition-colors"
            >
              <RefreshCw className="w-3 h-3" />
              재시도
            </button>
          </div>
        )}

        {/* Content */}
        {!isLoading && !error && detail && (
          <div className="space-y-6">
            {/* Title */}
            <div>
              <div className="flex items-center gap-2 mb-1">
                {detail.category && (
                  <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-zinc-800 text-zinc-400 border border-zinc-700/50">
                    {detail.category}
                  </span>
                )}
                {detail.cacheHit && (
                  <span className="text-[8px] font-mono text-zinc-600">캐시</span>
                )}
              </div>
              <h1 className="text-lg font-bold text-zinc-100">
                {detail.nameKo || detail.event}
              </h1>
              {detail.nameKo && detail.event && (
                <p className="text-[11px] text-zinc-500 font-mono mt-0.5">{detail.event}</p>
              )}
            </div>

            {/* Summary */}
            {detail.summary && (
              <div className="rounded-lg border border-zinc-800 bg-zinc-900/40 px-4 py-3">
                <p className="text-[12px] text-zinc-200 leading-relaxed">{detail.summary}</p>
              </div>
            )}

            {/* Description */}
            {detail.description && (
              <div>
                <SectionHeader icon={BookOpen}>개요</SectionHeader>
                <p className="text-[11px] text-zinc-400 leading-relaxed">{detail.description}</p>
              </div>
            )}

            {/* Why Important */}
            {detail.whyImportant && (
              <div>
                <SectionHeader icon={AlertTriangle}>왜 중요한가</SectionHeader>
                <p className="text-[11px] text-zinc-400 leading-relaxed">{detail.whyImportant}</p>
              </div>
            )}

            {/* Market Impact */}
            {(detail.marketImpact.stocks || detail.marketImpact.currency) && (
              <div>
                <SectionHeader icon={BarChart3}>시장 영향</SectionHeader>
                <div className="space-y-2">
                  {detail.marketImpact.stocks && (
                    <div className="flex items-start gap-2">
                      <span className="shrink-0 text-[9px] font-mono text-zinc-500 w-[40px]">주식</span>
                      <span className="text-[11px] text-zinc-300">{detail.marketImpact.stocks}</span>
                    </div>
                  )}
                  {detail.marketImpact.currency && (
                    <div className="flex items-start gap-2">
                      <span className="shrink-0 text-[9px] font-mono text-zinc-500 w-[40px]">환율</span>
                      <span className="text-[11px] text-zinc-300">{detail.marketImpact.currency}</span>
                    </div>
                  )}
                  {detail.marketImpact.sectors.length > 0 && (
                    <div className="flex items-start gap-2">
                      <span className="shrink-0 text-[9px] font-mono text-zinc-500 w-[40px]">섹터</span>
                      <div className="flex flex-wrap gap-1">
                        {detail.marketImpact.sectors.map((s) => (
                          <span key={s} className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-zinc-800 text-zinc-300 border border-zinc-700/50">
                            {s}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Reading Guide */}
            {(detail.readingGuide.aboveExpected || detail.readingGuide.belowExpected) && (
              <div>
                <SectionHeader icon={TrendingUp}>해석 가이드</SectionHeader>
                <div className="space-y-2">
                  {detail.readingGuide.keyThreshold && (
                    <div className="rounded-lg border border-zinc-800 bg-zinc-900/40 px-3 py-2">
                      <span className="text-[10px] font-mono font-bold text-yellow-400">{detail.readingGuide.keyThreshold}</span>
                    </div>
                  )}
                  {detail.readingGuide.aboveExpected && (
                    <div className="flex items-start gap-2">
                      <TrendingUp className="shrink-0 w-3 h-3 mt-0.5 text-green-400" />
                      <span className="text-[11px] text-zinc-300">{detail.readingGuide.aboveExpected}</span>
                    </div>
                  )}
                  {detail.readingGuide.belowExpected && (
                    <div className="flex items-start gap-2">
                      <TrendingDown className="shrink-0 w-3 h-3 mt-0.5 text-red-400" />
                      <span className="text-[11px] text-zinc-300">{detail.readingGuide.belowExpected}</span>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Release Info */}
            {(detail.releaseInfo.frequency || detail.releaseInfo.source) && (
              <div>
                <SectionHeader icon={Clock}>발표 정보</SectionHeader>
                <div className="grid grid-cols-2 gap-3">
                  {detail.releaseInfo.frequency && (
                    <div>
                      <span className="text-[9px] text-zinc-500 block mb-0.5">발표 주기</span>
                      <span className="text-[11px] text-zinc-300">{detail.releaseInfo.frequency}</span>
                    </div>
                  )}
                  {detail.releaseInfo.source && (
                    <div>
                      <span className="text-[9px] text-zinc-500 block mb-0.5">출처</span>
                      <span className="text-[11px] text-zinc-300">{detail.releaseInfo.source}</span>
                    </div>
                  )}
                  {detail.releaseInfo.typicalImpactDuration && (
                    <div>
                      <span className="text-[9px] text-zinc-500 block mb-0.5">영향 지속</span>
                      <span className="text-[11px] text-zinc-300">{detail.releaseInfo.typicalImpactDuration}</span>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Related Indicators */}
            {detail.relatedIndicators.length > 0 && (
              <div>
                <h3 className="text-[11px] font-mono font-bold text-zinc-400 uppercase tracking-wider mb-2">관련 지표</h3>
                <div className="flex flex-wrap gap-1.5">
                  {detail.relatedIndicators.map((ind) => (
                    <span key={ind} className="text-[10px] font-mono px-2 py-0.5 rounded bg-zinc-800 text-zinc-300 border border-zinc-700/50">
                      {ind}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
