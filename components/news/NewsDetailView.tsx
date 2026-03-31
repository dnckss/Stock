'use client';

/* eslint-disable @next/next/no-img-element */

import Link from 'next/link';
import { useCallback, useState } from 'react';
import { ArrowLeft, ExternalLink, Loader2 } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeSanitize, { defaultSchema } from 'rehype-sanitize';
import NewsAnalysisPoller from '@/components/news/NewsAnalysisPoller';
import type { ApiNewsAnalysis } from '@/types/dashboard';

function openInNewTab(url: string) {
  if (!url) return;
  window.open(url, '_blank', 'noopener,noreferrer');
}

function isAllowedMediaUrl(url: string, allowedDomains: string[]): boolean {
  if (!url) return false;
  try {
    const u = new URL(url);
    if (u.protocol !== 'http:' && u.protocol !== 'https:') return false;
    if (!Array.isArray(allowedDomains) || allowedDomains.length === 0) return false;
    const host = u.hostname.toLowerCase();
    return allowedDomains.some((d) => host === d.toLowerCase());
  } catch {
    return false;
  }
}

function isSafeHref(href: string): boolean {
  try {
    const u = new URL(href);
    return u.protocol === 'http:' || u.protocol === 'https:';
  } catch {
    return false;
  }
}

const DIRECTION_LABEL: Record<string, string> = {
  positive: '긍정',
  negative: '부정',
  mixed: '혼재',
  unclear: '불명확',
};

const DIRECTION_STYLE: Record<string, string> = {
  positive: 'text-green-400 ring-green-500/30 bg-green-500/10',
  negative: 'text-red-400 ring-red-500/30 bg-red-500/10',
  mixed: 'text-amber-400 ring-amber-500/30 bg-amber-500/10',
  unclear: 'text-zinc-400 ring-zinc-600/40 bg-zinc-800/40',
};

export interface NewsDetailViewProps {
  backHref: string;
  url: string;
  title: string;
  publisher: string;
  timestamp: string;
  fetchedAt: string;
  articleMarkdown: string;
  extractionStatus: string | null;
  media: Array<{
    type: string;
    url: string;
    caption?: string | null;
    thumbnail_url?: string | null;
    provider?: string | null;
    start_time?: number | null;
  }>;
  mediaDomains: string[];
  initialAnalysis: ApiNewsAnalysis | null;
  isLoading: boolean;
  error: string | null;
}

export default function NewsDetailView({
  backHref,
  url,
  title,
  publisher,
  timestamp,
  fetchedAt,
  articleMarkdown,
  extractionStatus,
  media,
  mediaDomains,
  initialAnalysis,
  isLoading,
  error,
}: NewsDetailViewProps) {
  const [analysis, setAnalysis] = useState<ApiNewsAnalysis | null>(initialAnalysis);
  const [pollExhausted, setPollExhausted] = useState(false);

  const handleAnalysis = useCallback((a: ApiNewsAnalysis) => {
    setAnalysis(a);
  }, []);

  const handlePollExhausted = useCallback(() => {
    setPollExhausted(true);
  }, []);

  const body = typeof articleMarkdown === 'string' ? articleMarkdown : '';
  const isBodyEmpty = body.trim().length === 0;
  const extractionOk = extractionStatus === 'ok' || extractionStatus === null;
  const shouldPollAnalysis =
    !error &&
    !!url &&
    extractionOk &&
    !isBodyEmpty &&
    !analysis &&
    !pollExhausted;

  const emptyMessage =
    extractionStatus === 'blocked'
      ? '본문을 불러오지 못했습니다 (차단됨).'
      : extractionStatus === 'timeout'
        ? '본문을 불러오지 못했습니다 (시간 초과).'
        : extractionStatus === 'paywall'
          ? '본문을 불러오지 못했습니다 (유료 기사).'
          : '본문을 불러오지 못했습니다.';

  const sanitizeSchema = {
    ...defaultSchema,
    attributes: {
      ...defaultSchema.attributes,
      a: [...(defaultSchema.attributes?.a ?? []), 'target', 'rel'],
    },
  };

  const directionKey =
    analysis?.impact?.direction && typeof analysis.impact.direction === 'string'
      ? analysis.impact.direction.toLowerCase()
      : 'unclear';
  const directionClass =
    DIRECTION_STYLE[directionKey] ?? DIRECTION_STYLE.unclear;
  const directionLabel =
    DIRECTION_LABEL[directionKey] ?? analysis?.impact?.direction ?? '—';

  return (
    <div className="min-h-screen bg-[#0a0a0a]">
      <NewsAnalysisPoller
        url={url}
        hasAnalysis={!!analysis}
        shouldPoll={shouldPollAnalysis}
        onAnalysis={handleAnalysis}
        onPollExhausted={handlePollExhausted}
      />
      <nav className="sticky top-0 z-50 border-b border-zinc-800 bg-zinc-900/80 backdrop-blur-sm">
        <div className="max-w-5xl mx-auto px-6 py-3 flex flex-wrap items-center justify-between gap-2">
          <Link
            href={backHref}
            className="flex items-center gap-2 text-sm text-zinc-400 hover:text-zinc-200 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span className="font-mono text-[10px] uppercase tracking-widest">
              Back
            </span>
          </Link>
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => openInNewTab(url)}
              disabled={!url}
              className="inline-flex items-center gap-2 rounded-lg border border-zinc-800 bg-zinc-900 px-3 py-2 text-[11px] font-mono text-zinc-200 transition-colors hover:bg-zinc-800 disabled:opacity-50 disabled:hover:bg-zinc-900"
            >
              <ExternalLink className="w-4 h-4" />
              원문 보기
            </button>
          </div>
        </div>
      </nav>

      <main className="max-w-5xl mx-auto px-6 py-8">
        <header className="mb-6">
          <h1 className="text-xl font-bold text-zinc-100 leading-snug">
            {title || '뉴스 상세'}
          </h1>
          <div className="mt-3 flex flex-wrap items-center gap-x-2 gap-y-1 text-[11px] text-zinc-500">
            {publisher ? <span>{publisher}</span> : null}
            {publisher && timestamp ? (
              <span className="text-zinc-700">·</span>
            ) : null}
            {timestamp ? <span>{timestamp}</span> : null}
            {fetchedAt ? (
              <>
                <span className="text-zinc-700">·</span>
                <span>캐시 갱신: {fetchedAt}</span>
              </>
            ) : null}
          </div>
        </header>

        {isLoading ? (
          <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-6">
            <div className="flex items-center gap-3 text-zinc-500">
              <Loader2 className="w-5 h-5 animate-spin" />
              <span className="text-sm">본문을 불러오는 중...</span>
            </div>
          </div>
        ) : error ? (
          <div className="rounded-xl border border-red-500/20 bg-red-500/5 p-6">
            <p className="text-sm text-red-300">{error}</p>
            <p className="mt-2 text-[11px] text-zinc-500">
              문제가 지속되면 “원문 보기”로 확인해주세요.
            </p>
          </div>
        ) : isBodyEmpty ? (
          <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-6">
            <p className="text-sm text-zinc-200">{emptyMessage}</p>
            <p className="mt-2 text-[11px] text-zinc-500">
              원문 보기 버튼을 눌러 출처에서 확인해주세요.
            </p>
          </div>
        ) : (
          <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_320px] lg:items-start">
            <article className="rounded-xl border border-zinc-800 bg-zinc-900 p-6 min-w-0">
              <div className="prose prose-invert max-w-none prose-p:leading-relaxed prose-p:text-zinc-200 prose-strong:text-zinc-100">
                <ReactMarkdown
                  remarkPlugins={[remarkGfm]}
                  rehypePlugins={[[rehypeSanitize, sanitizeSchema]]}
                  components={{
                    a: ({ href, children }) => {
                      const safeHref = typeof href === 'string' ? href : '';
                      if (!safeHref || !isSafeHref(safeHref)) {
                        return <span>{children}</span>;
                      }
                      return (
                        <a
                          href={safeHref}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-300 hover:text-blue-200 underline underline-offset-4"
                        >
                          {children}
                        </a>
                      );
                    },
                    img: () => null, // 미디어는 media[]만 사용
                  }}
                >
                  {body}
                </ReactMarkdown>
              </div>

              {Array.isArray(media) && media.length > 0 ? (
                <div className="mt-6 border-t border-zinc-800 pt-5">
                  <h3 className="text-[11px] font-mono text-zinc-400 uppercase tracking-widest">
                    Media
                  </h3>
                  <div className="mt-3 space-y-3">
                    {media.map((m, idx) => {
                      const label = (m.type || 'media').toLowerCase();
                      const canInline =
                        label === 'image' && isAllowedMediaUrl(m.url, mediaDomains);

                      if (canInline) {
                        return (
                          <figure key={`${m.url}-${idx}`} className="space-y-2">
                            <img
                              src={m.url}
                              alt={m.caption ?? 'image'}
                              loading="lazy"
                              className="w-full rounded-lg border border-zinc-800 bg-zinc-950"
                            />
                            {m.caption ? (
                              <figcaption className="text-[11px] text-zinc-500">
                                {m.caption}
                              </figcaption>
                            ) : null}
                          </figure>
                        );
                      }

                      return (
                        <a
                          key={`${m.url}-${idx}`}
                          href={m.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center justify-between gap-3 rounded-lg border border-zinc-800 bg-zinc-950/40 px-4 py-3 text-sm text-zinc-200 hover:bg-zinc-800/30 transition-colors"
                        >
                          <div className="min-w-0">
                            <div className="text-[11px] font-mono text-zinc-500 uppercase tracking-widest">
                              {label}
                            </div>
                            <div className="mt-1 text-sm text-zinc-200 break-all">
                              {m.caption ?? m.url}
                            </div>
                          </div>
                          <ExternalLink className="w-4 h-4 text-zinc-500 shrink-0" />
                        </a>
                      );
                    })}
                  </div>
                </div>
              ) : null}
            </article>

            <aside className="lg:sticky lg:top-20 space-y-3">
              <div className="rounded-xl border border-zinc-800 bg-zinc-900/90 p-4">
                <h2 className="text-[10px] font-mono font-semibold text-zinc-500 uppercase tracking-widest">
                  AI 분석
                </h2>

                {analysis ? (
                  <div className="mt-3 space-y-4">
                    <p className="text-sm text-zinc-200 leading-relaxed">
                      {analysis.ko_summary}
                    </p>

                    <div
                      className={`inline-flex items-center gap-2 rounded-lg px-2.5 py-1 text-[11px] font-medium ring-1 ${directionClass}`}
                    >
                      영향: {directionLabel}
                      {typeof analysis.impact?.confidence === 'number' ? (
                        <span className="text-zinc-500 font-mono">
                          · {(analysis.impact.confidence * 100).toFixed(0)}%
                        </span>
                      ) : null}
                    </div>

                    {analysis.impact?.reason_ko ? (
                      <p className="text-[12px] text-zinc-400 leading-relaxed">
                        {analysis.impact.reason_ko}
                      </p>
                    ) : null}

                    {Array.isArray(analysis.impact?.sectors) &&
                    analysis.impact.sectors.length > 0 ? (
                      <div>
                        <div className="text-[10px] font-mono text-zinc-600 uppercase tracking-wider mb-1.5">
                          섹터
                        </div>
                        <div className="flex flex-wrap gap-1.5">
                          {analysis.impact.sectors.map((s) => (
                            <span
                              key={s}
                              className="rounded-md bg-zinc-800 px-2 py-0.5 text-[11px] text-zinc-300"
                            >
                              {s}
                            </span>
                          ))}
                        </div>
                      </div>
                    ) : null}

                    {Array.isArray(analysis.impact?.themes) &&
                    analysis.impact.themes.length > 0 ? (
                      <div>
                        <div className="text-[10px] font-mono text-zinc-600 uppercase tracking-wider mb-1.5">
                          테마
                        </div>
                        <div className="flex flex-wrap gap-1.5">
                          {analysis.impact.themes.map((t) => (
                            <span
                              key={t}
                              className="rounded-md border border-zinc-700/80 px-2 py-0.5 text-[11px] text-zinc-400"
                            >
                              {t}
                            </span>
                          ))}
                        </div>
                      </div>
                    ) : null}

                    {Array.isArray(analysis.tickers_mentioned) &&
                    analysis.tickers_mentioned.length > 0 ? (
                      <div>
                        <div className="text-[10px] font-mono text-zinc-600 uppercase tracking-wider mb-1.5">
                          언급 티커
                        </div>
                        <div className="flex flex-wrap gap-1.5">
                          {analysis.tickers_mentioned.map((t) => (
                            <span
                              key={t}
                              className="rounded-md bg-blue-500/10 px-2 py-0.5 font-mono text-[11px] text-blue-300"
                            >
                              ${t}
                            </span>
                          ))}
                        </div>
                      </div>
                    ) : null}
                  </div>
                ) : shouldPollAnalysis ? (
                  <div className="mt-3 flex items-center gap-3 text-zinc-500">
                    <Loader2 className="w-5 h-5 animate-spin shrink-0" />
                    <div>
                      <p className="text-sm text-zinc-300">요약 생성 중</p>
                      <p className="mt-1 text-[11px] text-zinc-600">
                        잠시 후 자동으로 갱신됩니다.
                      </p>
                    </div>
                  </div>
                ) : pollExhausted && extractionOk && !isBodyEmpty ? (
                  <p className="mt-3 text-sm text-zinc-500">
                    요약을 불러오지 못했습니다. 원문을 확인해 주세요.
                  </p>
                ) : extractionStatus && extractionStatus !== 'ok' ? (
                  <p className="mt-3 text-sm text-zinc-500">
                    본문 추출이 완료되지 않아 AI 요약을 생성할 수 없습니다.
                  </p>
                ) : (
                  <p className="mt-3 text-sm text-zinc-500">
                    분석 데이터가 없습니다.
                  </p>
                )}
              </div>
            </aside>
          </div>
        )}
      </main>
    </div>
  );
}

