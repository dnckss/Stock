'use client';

/* eslint-disable @next/next/no-img-element */

import { useCallback, useState } from 'react';
import {
  ExternalLink,
  Loader2,
  TrendingUp,
  TrendingDown,
  Activity,
  HelpCircle,
  Sparkles,
  Quote,
  Building2,
  Tags,
  Hash,
  type LucideIcon,
} from 'lucide-react';
import PageHeader from '@/components/common/PageHeader';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeSanitize, { defaultSchema } from 'rehype-sanitize';
import NewsAnalysisPoller from '@/components/news/NewsAnalysisPoller';
import { cn } from '@/lib/utils';
import type { ApiNewsAnalysis } from '@/types/dashboard';

/* ── Utilities ── */

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

/* ── Direction config ── */

type DirectionKey = 'positive' | 'negative' | 'mixed' | 'unclear';

interface DirectionConfig {
  label: string;
  /** 좌측 세로 색띠 */
  stripe: string;
  /** 배지 텍스트 색상 */
  text: string;
  /** 배지 배경 */
  badgeBg: string;
  /** 배지 ring */
  badgeRing: string;
  /** 카드 ambient tint */
  cardTint: string;
  /** progress bar fill */
  barFill: string;
  Icon: LucideIcon;
}

const DIRECTION_CONFIG: Record<DirectionKey, DirectionConfig> = {
  positive: {
    label: '긍정 영향',
    stripe: 'bg-emerald-500',
    text: 'text-emerald-300',
    badgeBg: 'bg-emerald-500/10',
    badgeRing: 'ring-emerald-500/30',
    cardTint: 'from-emerald-500/[0.04]',
    barFill: 'bg-emerald-500',
    Icon: TrendingUp,
  },
  negative: {
    label: '부정 영향',
    stripe: 'bg-red-500',
    text: 'text-red-300',
    badgeBg: 'bg-red-500/10',
    badgeRing: 'ring-red-500/30',
    cardTint: 'from-red-500/[0.04]',
    barFill: 'bg-red-500',
    Icon: TrendingDown,
  },
  mixed: {
    label: '혼재 영향',
    stripe: 'bg-amber-500',
    text: 'text-amber-300',
    badgeBg: 'bg-amber-500/10',
    badgeRing: 'ring-amber-500/30',
    cardTint: 'from-amber-500/[0.04]',
    barFill: 'bg-amber-500',
    Icon: Activity,
  },
  unclear: {
    label: '영향 불명확',
    stripe: 'bg-zinc-600',
    text: 'text-zinc-300',
    badgeBg: 'bg-zinc-800/60',
    badgeRing: 'ring-zinc-700/50',
    cardTint: 'from-zinc-700/[0.04]',
    barFill: 'bg-zinc-500',
    Icon: HelpCircle,
  },
};

function resolveDirection(value: unknown): DirectionKey {
  const k = typeof value === 'string' ? value.toLowerCase() : '';
  if (k === 'positive' || k === 'negative' || k === 'mixed' || k === 'unclear') {
    return k;
  }
  return 'unclear';
}

/* ── Card wrapper ── */

function Card({
  children,
  className,
  tint,
}: {
  children: React.ReactNode;
  className?: string;
  /** Direction config의 cardTint (예: 'from-emerald-500/[0.04]') */
  tint?: string;
}) {
  return (
    <section
      className={cn(
        'relative overflow-hidden rounded-2xl border border-zinc-800/80 bg-zinc-900/60',
        tint && `bg-gradient-to-br ${tint} via-zinc-900/60 to-zinc-900/60`,
        className,
      )}
    >
      {children}
    </section>
  );
}

/* ── Hero (direction + title + meta + chips) ── */

function HeroCard({
  title,
  publisher,
  timestamp,
  fetchedAt,
  analysis,
  isAnalysisPending,
}: {
  title: string;
  publisher: string;
  timestamp: string;
  fetchedAt: string;
  analysis: ApiNewsAnalysis | null;
  isAnalysisPending: boolean;
}) {
  const directionKey = resolveDirection(analysis?.impact?.direction);
  const cfg = DIRECTION_CONFIG[directionKey];
  const DirIcon = cfg.Icon;
  const confidenceRaw =
    typeof analysis?.impact?.confidence === 'number'
      ? Math.max(0, Math.min(1, analysis.impact.confidence))
      : null;
  const confidencePct = confidenceRaw != null ? Math.round(confidenceRaw * 100) : null;

  const tickers = Array.isArray(analysis?.tickers_mentioned)
    ? analysis.tickers_mentioned.filter((t) => typeof t === 'string' && t.trim().length > 0)
    : [];
  const sectors = Array.isArray(analysis?.impact?.sectors)
    ? analysis.impact.sectors.filter((s) => typeof s === 'string' && s.trim().length > 0)
    : [];

  return (
    <Card tint={cfg.cardTint} className="flex">
      {/* 좌측 색띠 */}
      <div className={cn('w-1 shrink-0', cfg.stripe)} aria-hidden />

      <div className="flex-1 min-w-0 px-5 sm:px-6 py-5 sm:py-6">
        {/* Direction badge row — 분석이 있을 때만 방향 배지, 생성 중이면 진행 표시, 분석 전엔 숨김 */}
        {analysis?.impact ? (
          <div className="flex flex-wrap items-center gap-3">
            <span
              className={cn(
                'inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-semibold ring-1',
                cfg.text,
                cfg.badgeBg,
                cfg.badgeRing,
              )}
            >
              <DirIcon className="w-3.5 h-3.5" />
              {cfg.label}
            </span>

            {confidencePct != null ? (
              <div className="flex items-center gap-2 min-w-[120px]">
                <div className="h-1.5 w-24 rounded-full bg-zinc-800 overflow-hidden">
                  <div
                    className={cn('h-full rounded-full transition-all duration-500', cfg.barFill)}
                    style={{ width: `${confidencePct}%` }}
                  />
                </div>
                <span className="text-[11px] font-mono tabular-nums text-zinc-400">
                  {confidencePct}% 신뢰도
                </span>
              </div>
            ) : null}
          </div>
        ) : isAnalysisPending ? (
          <span className="inline-flex items-center gap-1.5 text-[11px] text-zinc-500">
            <Loader2 className="w-3 h-3 animate-spin" />
            분석 진행 중
          </span>
        ) : null}

        {/* Title */}
        <h1 className="mt-4 text-xl sm:text-2xl font-bold text-zinc-50 leading-snug tracking-tight">
          {title || '뉴스 상세'}
        </h1>

        {/* Meta */}
        <div className="mt-3 flex flex-wrap items-center gap-x-2.5 gap-y-1 text-[11px] text-zinc-500">
          {publisher ? <span className="text-zinc-400">{publisher}</span> : null}
          {publisher && timestamp ? <span className="text-zinc-700">·</span> : null}
          {timestamp ? <span>{timestamp}</span> : null}
          {fetchedAt ? (
            <>
              <span className="text-zinc-700">·</span>
              <span className="text-zinc-600">캐시 {fetchedAt}</span>
            </>
          ) : null}
        </div>

        {/* Chips: tickers + sectors */}
        {(tickers.length > 0 || sectors.length > 0) && (
          <div className="mt-4 flex flex-wrap items-center gap-1.5">
            {tickers.map((t) => (
              <span
                key={`ticker-${t}`}
                className="inline-flex items-center gap-1 rounded-md bg-blue-500/10 ring-1 ring-blue-500/20 px-2 py-0.5 font-mono text-[11px] text-blue-300"
              >
                <Hash className="w-3 h-3 opacity-70" />
                {t}
              </span>
            ))}
            {sectors.length > 0 && tickers.length > 0 ? (
              <span className="text-zinc-700 mx-1" aria-hidden>
                ⟫
              </span>
            ) : null}
            {sectors.map((s) => (
              <span
                key={`sector-${s}`}
                className="inline-flex items-center gap-1 rounded-md bg-zinc-800/60 ring-1 ring-zinc-700/40 px-2 py-0.5 text-[11px] text-zinc-300"
              >
                <Building2 className="w-3 h-3 opacity-70" />
                {s}
              </span>
            ))}
          </div>
        )}
      </div>
    </Card>
  );
}

/* ── AI Summary card ── */

function AnalysisCard({
  analysis,
  canAnalyze,
  analysisRequested,
  onRequestAnalysis,
  shouldPoll,
  pollExhausted,
  extractionFailed,
}: {
  analysis: ApiNewsAnalysis | null;
  canAnalyze: boolean;
  analysisRequested: boolean;
  onRequestAnalysis: () => void;
  shouldPoll: boolean;
  pollExhausted: boolean;
  extractionFailed: boolean;
}) {
  if (!analysis) {
    // 본문 추출 실패 → AI 분석 불가
    if (extractionFailed) {
      return (
        <Card className="px-5 sm:px-6 py-5">
          <p className="text-sm text-zinc-400">
            본문 추출이 완료되지 않아 AI 요약을 생성할 수 없습니다.
          </p>
        </Card>
      );
    }
    // 아직 분석 요청 전 → 사용자 액션으로 요청 (무거운 AI 호출을 기본 로드에서 분리)
    if (!analysisRequested) {
      if (!canAnalyze) return null;
      return (
        <Card className="px-5 sm:px-6 py-5">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-start gap-3">
              <Sparkles className="w-4 h-4 text-violet-300 mt-0.5 shrink-0" />
              <div>
                <p className="text-sm text-zinc-200">AI 분석 요약</p>
                <p className="mt-0.5 text-[11px] text-zinc-500">
                  시장 영향·방향·관련 종목을 AI가 요약합니다. 필요할 때만 생성돼요.
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={onRequestAnalysis}
              className="shrink-0 inline-flex items-center justify-center gap-1.5 rounded-lg bg-violet-500/10 ring-1 ring-violet-500/30 px-3.5 py-2 text-xs font-medium text-violet-200 hover:bg-violet-500/15 transition-colors"
            >
              <Sparkles className="w-3.5 h-3.5" />
              분석 보기
            </button>
          </div>
        </Card>
      );
    }
    // 분석 요청 후 생성 중
    if (shouldPoll) {
      return (
        <Card className="px-5 sm:px-6 py-5">
          <div className="flex items-center gap-3 text-zinc-400">
            <Loader2 className="w-4 h-4 animate-spin shrink-0" />
            <div>
              <p className="text-sm text-zinc-200">AI 요약 생성 중</p>
              <p className="mt-0.5 text-[11px] text-zinc-500">잠시 후 자동으로 갱신됩니다.</p>
            </div>
          </div>
        </Card>
      );
    }
    // 요청했지만 실패/시도 소진
    if (pollExhausted) {
      return (
        <Card className="px-5 sm:px-6 py-5">
          <p className="text-sm text-zinc-400">
            요약을 불러오지 못했습니다. 원문을 확인해 주세요.
          </p>
        </Card>
      );
    }
    return null;
  }

  const themes = Array.isArray(analysis.impact?.themes)
    ? analysis.impact.themes.filter((t) => typeof t === 'string' && t.trim().length > 0)
    : [];
  const reason = typeof analysis.impact?.reason_ko === 'string'
    ? analysis.impact.reason_ko.trim()
    : '';

  return (
    <Card className="px-5 sm:px-6 py-5">
      <div className="flex items-center gap-2">
        <Sparkles className="w-4 h-4 text-violet-300" />
        <h2 className="text-[11px] font-mono font-semibold text-zinc-400 uppercase tracking-widest">
          AI 분석 요약
        </h2>
      </div>

      {analysis.ko_summary ? (
        <p className="mt-3 text-[15px] sm:text-base text-zinc-100 leading-relaxed">
          {analysis.ko_summary}
        </p>
      ) : null}

      {reason ? (
        <div className="mt-4 flex gap-2.5">
          <Quote className="w-3.5 h-3.5 text-zinc-600 shrink-0 mt-1" aria-hidden />
          <p className="text-[13px] text-zinc-400 leading-relaxed">{reason}</p>
        </div>
      ) : null}

      {themes.length > 0 ? (
        <div className="mt-4 flex flex-wrap items-center gap-1.5">
          <Tags className="w-3 h-3 text-zinc-600 mr-0.5" aria-hidden />
          {themes.map((t) => (
            <span
              key={`theme-${t}`}
              className="rounded-md border border-zinc-700/60 px-2 py-0.5 text-[11px] text-zinc-400"
            >
              {t}
            </span>
          ))}
        </div>
      ) : null}
    </Card>
  );
}

/* ── Article body ── */

function ArticleBody({
  body,
  sanitizeSchema,
}: {
  body: string;
  sanitizeSchema: ReturnType<typeof buildSanitizeSchema>;
}) {
  return (
    <Card className="px-5 sm:px-6 py-6">
      {/* 카드는 넓게, 본문 텍스트만 reading width 제한 */}
      <article className="prose prose-invert mx-auto max-w-[75ch] prose-p:leading-relaxed prose-p:text-zinc-200 prose-strong:text-zinc-100 prose-headings:text-zinc-100">
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
      </article>
    </Card>
  );
}

function buildSanitizeSchema() {
  return {
    ...defaultSchema,
    attributes: {
      ...defaultSchema.attributes,
      a: [...(defaultSchema.attributes?.a ?? []), 'target', 'rel'],
    },
  };
}

/* ── Media gallery ── */

function MediaGallery({
  media,
  mediaDomains,
}: {
  media: NewsDetailViewProps['media'];
  mediaDomains: string[];
}) {
  if (!Array.isArray(media) || media.length === 0) return null;

  return (
    <Card className="px-5 sm:px-6 py-5">
      <h3 className="text-[11px] font-mono font-semibold text-zinc-400 uppercase tracking-widest">
        미디어
      </h3>
      <div className="mt-3 grid gap-3 sm:grid-cols-2">
        {media.map((m, idx) => {
          const label = (m.type || 'media').toLowerCase();
          const canInline = label === 'image' && isAllowedMediaUrl(m.url, mediaDomains);

          if (canInline) {
            return (
              <figure key={`${m.url}-${idx}`} className="space-y-2 sm:col-span-2">
                <img
                  src={m.url}
                  alt={m.caption ?? 'image'}
                  loading="lazy"
                  className="w-full rounded-lg border border-zinc-800 bg-zinc-950"
                />
                {m.caption ? (
                  <figcaption className="text-[11px] text-zinc-500">{m.caption}</figcaption>
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
              className="flex items-center justify-between gap-3 rounded-lg border border-zinc-800 bg-zinc-950/40 px-4 py-3 text-sm text-zinc-200 hover:bg-zinc-800/40 hover:border-zinc-700/60 transition-colors"
            >
              <div className="min-w-0">
                <div className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest">
                  {label}
                </div>
                <div className="mt-1 text-sm text-zinc-200 break-all line-clamp-2">
                  {m.caption ?? m.url}
                </div>
              </div>
              <ExternalLink className="w-4 h-4 text-zinc-500 shrink-0" />
            </a>
          );
        })}
      </div>
    </Card>
  );
}

/* ── Loading / Error / Empty ── */

function HeroSkeleton() {
  return (
    <Card className="flex animate-pulse">
      <div className="w-1 shrink-0 bg-zinc-800" />
      <div className="flex-1 px-5 sm:px-6 py-5 sm:py-6 space-y-3">
        <div className="flex gap-3">
          <div className="h-6 w-24 bg-zinc-800 rounded-lg" />
          <div className="h-6 w-32 bg-zinc-800/70 rounded-lg" />
        </div>
        <div className="h-6 w-3/4 bg-zinc-800 rounded" />
        <div className="h-5 w-1/2 bg-zinc-800/70 rounded" />
        <div className="h-3 w-1/3 bg-zinc-800/50 rounded" />
      </div>
    </Card>
  );
}

function BodySkeleton() {
  return (
    <Card className="px-5 sm:px-6 py-6 animate-pulse space-y-3">
      {Array.from({ length: 6 }).map((_, i) => (
        <div
          key={i}
          className="h-3 bg-zinc-800 rounded"
          style={{ width: `${70 + ((i * 13) % 25)}%` }}
        />
      ))}
    </Card>
  );
}

/* ── Props (unchanged) ── */

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

/* ── Main view ── */

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
  // AI 분석은 무거우므로 기본 로드에서 분리한다. 사용자가 "분석 보기"를 누르면 analyze=1로 요청.
  // 서버가 이미 캐시된 분석을 함께 내려준 경우(initialAnalysis 존재)는 바로 표시되고 버튼은 생략된다.
  const [analysisRequested, setAnalysisRequested] = useState(false);

  const handleAnalysis = useCallback((a: ApiNewsAnalysis) => {
    setAnalysis(a);
  }, []);

  const handlePollExhausted = useCallback(() => {
    setPollExhausted(true);
  }, []);

  const requestAnalysis = useCallback(() => {
    setPollExhausted(false);
    setAnalysisRequested(true);
  }, []);

  const body = typeof articleMarkdown === 'string' ? articleMarkdown : '';
  const isBodyEmpty = body.trim().length === 0;
  const extractionOk = extractionStatus === 'ok' || extractionStatus === null;
  const extractionFailed = !!extractionStatus && extractionStatus !== 'ok';
  const canAnalyze = !error && !!url && extractionOk && !isBodyEmpty;

  // 사용자가 분석을 요청한 뒤에만 폴링(analyze=1) 시작.
  const shouldPollAnalysis =
    analysisRequested && canAnalyze && !analysis && !pollExhausted;

  const emptyMessage =
    extractionStatus === 'blocked'
      ? '본문을 불러오지 못했습니다 (차단됨).'
      : extractionStatus === 'timeout'
        ? '본문을 불러오지 못했습니다 (시간 초과).'
        : extractionStatus === 'paywall'
          ? '본문을 불러오지 못했습니다 (유료 기사).'
          : '본문을 불러오지 못했습니다.';

  const sanitizeSchema = buildSanitizeSchema();

  return (
    <div className="min-h-screen bg-[#0a0a0a]">
      <NewsAnalysisPoller
        url={url}
        hasAnalysis={!!analysis}
        shouldPoll={shouldPollAnalysis}
        onAnalysis={handleAnalysis}
        onPollExhausted={handlePollExhausted}
      />

      <PageHeader backHref={backHref} title="News">
        <button
          type="button"
          onClick={() => openInNewTab(url)}
          disabled={!url}
          className="inline-flex items-center gap-1.5 text-xs text-zinc-400 hover:text-zinc-200 border border-zinc-800 hover:border-zinc-700 rounded-lg px-3 py-1.5 transition-colors disabled:opacity-50"
        >
          <ExternalLink className="w-3.5 h-3.5" />
          원문 보기
        </button>
      </PageHeader>

      <main className="max-w-5xl mx-auto px-4 sm:px-6 py-6 sm:py-8 space-y-4">
        {isLoading ? (
          <>
            <HeroSkeleton />
            <BodySkeleton />
          </>
        ) : error ? (
          <>
            <HeroCard
              title={title}
              publisher={publisher}
              timestamp={timestamp}
              fetchedAt={fetchedAt}
              analysis={null}
              isAnalysisPending={false}
            />
            <Card className="px-5 sm:px-6 py-5 border-red-500/20 bg-red-500/[0.03]">
              <p className="text-sm text-red-300">{error}</p>
              <p className="mt-2 text-[11px] text-zinc-500">
                문제가 지속되면 “원문 보기”로 확인해주세요.
              </p>
            </Card>
          </>
        ) : (
          <>
            <HeroCard
              title={title}
              publisher={publisher}
              timestamp={timestamp}
              fetchedAt={fetchedAt}
              analysis={analysis}
              isAnalysisPending={shouldPollAnalysis}
            />

            <AnalysisCard
              analysis={analysis}
              canAnalyze={canAnalyze}
              analysisRequested={analysisRequested}
              onRequestAnalysis={requestAnalysis}
              shouldPoll={shouldPollAnalysis}
              pollExhausted={pollExhausted}
              extractionFailed={extractionFailed}
            />

            {isBodyEmpty ? (
              <Card className="px-5 sm:px-6 py-5">
                <p className="text-sm text-zinc-200">{emptyMessage}</p>
                <p className="mt-2 text-[11px] text-zinc-500">
                  원문 보기 버튼을 눌러 출처에서 확인해주세요.
                </p>
              </Card>
            ) : (
              <ArticleBody body={body} sanitizeSchema={sanitizeSchema} />
            )}

            <MediaGallery media={media} mediaDomains={mediaDomains} />
          </>
        )}
      </main>
    </div>
  );
}
