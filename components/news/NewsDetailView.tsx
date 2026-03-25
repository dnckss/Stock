'use client';

import Link from 'next/link';
import { ArrowLeft, ExternalLink, Loader2 } from 'lucide-react';

function escapeHtml(input: string): string {
  return input
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

function textToSafeHtml(text: string): string {
  const safe = escapeHtml(text);
  const paragraphs = safe
    .split(/\n{2,}/g)
    .map((p) => p.trim())
    .filter(Boolean);

  if (paragraphs.length === 0) return '';

  return paragraphs
    .map((p) => `<p>${p.replaceAll('\n', '<br />')}</p>`)
    .join('');
}

function openInNewTab(url: string) {
  if (!url) return;
  window.open(url, '_blank', 'noopener,noreferrer');
}

export interface NewsDetailViewProps {
  backHref: string;
  url: string;
  title: string;
  publisher: string;
  timestamp: string;
  fetchedAt: string;
  articleText: string;
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
  articleText,
  isLoading,
  error,
}: NewsDetailViewProps) {
  const articleHtml = textToSafeHtml(articleText);

  return (
    <div className="min-h-screen bg-[#0a0a0a]">
      <nav className="sticky top-0 z-50 border-b border-zinc-800 bg-zinc-900/80 backdrop-blur-sm">
        <div className="max-w-3xl mx-auto px-6 py-3 flex items-center justify-between">
          <Link
            href={backHref}
            className="flex items-center gap-2 text-sm text-zinc-400 hover:text-zinc-200 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span className="font-mono text-[10px] uppercase tracking-widest">
              Back
            </span>
          </Link>
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
      </nav>

      <main className="max-w-3xl mx-auto px-6 py-8">
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
        ) : articleText.trim().length === 0 ? (
          <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-6">
            <p className="text-sm text-zinc-200">본문을 불러오지 못했습니다.</p>
            <p className="mt-2 text-[11px] text-zinc-500">
              원문 보기 버튼을 눌러 출처에서 확인해주세요.
            </p>
          </div>
        ) : (
          <article className="rounded-xl border border-zinc-800 bg-zinc-900 p-6">
            <div
              className="prose prose-invert max-w-none prose-p:leading-relaxed prose-p:text-zinc-200 prose-strong:text-zinc-100"
              dangerouslySetInnerHTML={{ __html: articleHtml }}
            />
          </article>
        )}
      </main>
    </div>
  );
}

