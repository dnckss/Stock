import type { ReactNode } from 'react';
import { Loader2, RefreshCw } from 'lucide-react';

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
      <ul key={key++} className="space-y-1.5 pl-1">
        {listItems.map((item, i) => (
          <li
            key={i}
            className="flex items-start gap-2 leading-relaxed text-zinc-300 text-[11px]"
          >
            <span className="mt-[7px] h-1 w-1 shrink-0 rounded-full bg-zinc-600" />
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
          className="pt-3 text-xs font-bold text-zinc-100 first:pt-0"
        >
          {trimmed.slice(3)}
        </h2>,
      );
    } else if (trimmed.startsWith('# ')) {
      flushList();
      elements.push(
        <h1 key={key++} className="pb-0.5 text-sm font-bold text-zinc-50">
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
        <p key={key++} className="leading-relaxed text-[11px] text-zinc-300">
          {renderInline(trimmed)}
        </p>,
      );
    }
  }

  flushList();
  return <div className="space-y-2">{elements}</div>;
}

export default function AIReport({
  ticker,
  report,
  isLoading,
  error,
  onRetry,
}: AIReportProps) {
  return (
    <div className="border-b border-zinc-800">
      {/* Header */}
      <div className="px-3 py-1.5 bg-zinc-800/30 flex items-center justify-between">
        <span className="text-[9px] font-mono font-bold text-zinc-500 uppercase tracking-widest">
          AI 리포트
        </span>
        <span className="text-[8px] font-mono text-zinc-600">{ticker}</span>
      </div>

      {/* Content */}
      <div className="px-3 py-3">
        {isLoading ? (
          <div className="flex items-center gap-2 py-4 justify-center">
            <Loader2 className="w-3.5 h-3.5 text-violet-400 animate-spin" />
            <span className="text-[10px] text-zinc-500">리포트 생성 중...</span>
          </div>
        ) : error ? (
          <div className="text-center py-4">
            <p className="text-[10px] text-red-400 mb-2">{error}</p>
            <button
              onClick={onRetry}
              className="inline-flex items-center gap-1.5 text-[9px] font-mono text-zinc-400 hover:text-zinc-200 border border-zinc-700 rounded px-2 py-1 hover:border-zinc-600 transition-colors"
            >
              <RefreshCw className="w-2.5 h-2.5" />
              재시도
            </button>
          </div>
        ) : report ? (
          <article>
            <MarkdownContent content={report} />
          </article>
        ) : null}
      </div>
    </div>
  );
}
