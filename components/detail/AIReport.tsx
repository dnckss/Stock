import type { ReactNode } from 'react';
import { Sparkles, Loader2, RefreshCw } from 'lucide-react';

interface AIReportProps {
  ticker: string;
  report: string | null;
  isLoading: boolean;
  error: string | null;
  onRetry: () => void;
}

function renderInline(text: string): ReactNode[] {
  const parts = text.split(/(\*\*.*?\*\*)/g);
  return parts.map((part, i) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      return (
        <strong key={i} className="font-semibold text-zinc-100">
          {part.slice(2, -2)}
        </strong>
      );
    }
    return part;
  });
}

function MarkdownContent({ content }: { content: string }) {
  const lines = content.split('\n');
  const elements: ReactNode[] = [];
  let listItems: string[] = [];
  let key = 0;

  const flushList = () => {
    if (listItems.length === 0) return;
    elements.push(
      <ul key={key++} className="space-y-2.5 pl-1">
        {listItems.map((item, i) => (
          <li
            key={i}
            className="flex items-start gap-3 leading-relaxed text-zinc-300"
          >
            <span className="mt-[9px] h-1.5 w-1.5 shrink-0 rounded-full bg-zinc-600" />
            <span>{renderInline(item)}</span>
          </li>
        ))}
      </ul>,
    );
    listItems = [];
  };

  for (const line of lines) {
    const trimmed = line.trim();

    if (trimmed.startsWith('## ')) {
      flushList();
      elements.push(
        <h2
          key={key++}
          className="pt-6 text-lg font-bold text-zinc-100 first:pt-0"
        >
          {trimmed.slice(3)}
        </h2>,
      );
    } else if (trimmed.startsWith('# ')) {
      flushList();
      elements.push(
        <h1 key={key++} className="pb-1 text-2xl font-bold text-zinc-50">
          {trimmed.slice(2)}
        </h1>,
      );
    } else if (trimmed.startsWith('- ')) {
      listItems.push(trimmed.slice(2));
    } else if (trimmed === '') {
      flushList();
    } else {
      flushList();
      elements.push(
        <p key={key++} className="leading-[1.8] tracking-wide text-zinc-300">
          {renderInline(trimmed)}
        </p>,
      );
    }
  }

  flushList();
  return <div className="space-y-4">{elements}</div>;
}

function ReportLoading() {
  return (
    <div className="flex items-center gap-3 py-8 justify-center">
      <Loader2 className="w-5 h-5 text-violet-400 animate-spin" />
      <span className="text-sm text-zinc-400">
        AI 리포트를 생성하고 있습니다...
      </span>
    </div>
  );
}

function ReportError({
  message,
  onRetry,
}: {
  message: string;
  onRetry: () => void;
}) {
  return (
    <div className="text-center py-8">
      <p className="text-sm text-red-400 mb-3">{message}</p>
      <button
        onClick={onRetry}
        className="inline-flex items-center gap-2 text-xs text-zinc-400 hover:text-zinc-200 transition-colors border border-zinc-700 rounded-lg px-3 py-1.5 hover:border-zinc-600"
      >
        <RefreshCw className="w-3 h-3" />
        다시 시도
      </button>
    </div>
  );
}

export default function AIReport({
  ticker,
  report,
  isLoading,
  error,
  onRetry,
}: AIReportProps) {
  return (
    <section className="relative overflow-hidden rounded-xl border border-zinc-800 bg-zinc-900 p-6 sm:p-8">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-zinc-700/60 to-transparent" />

      <div className="mb-8 flex items-center gap-4">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg border border-violet-500/20 bg-violet-500/10">
          <Sparkles className="h-5 w-5 text-violet-400" />
        </div>
        <div>
          <h2 className="text-lg font-bold text-zinc-100">
            AI 애널리스트 리포트
          </h2>
          <p className="text-xs text-zinc-500">
            {ticker} · AI Quant Model v3.7.2
          </p>
        </div>
      </div>

      <div className="mb-6 h-px bg-gradient-to-r from-violet-500/20 via-zinc-800 to-transparent" />

      {isLoading ? (
        <ReportLoading />
      ) : error ? (
        <ReportError message={error} onRetry={onRetry} />
      ) : report ? (
        <article>
          <MarkdownContent content={report} />
        </article>
      ) : null}
    </section>
  );
}
