import type { ReactNode } from 'react';
import { Sparkles } from 'lucide-react';

interface AnalystReportProps {
  content: string;
}

export default function AnalystReport({ content }: AnalystReportProps) {
  return (
    <section className="w-full">
      <div className="relative overflow-hidden rounded-2xl border border-zinc-800/50 bg-zinc-900/80 p-6 transition-all duration-300 hover:-translate-y-1 hover:border-zinc-700/80 sm:p-8 md:p-10">
        {/* Top highlight */}
        <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-zinc-700/60 to-transparent" />

        {/* Header */}
        <div className="mb-8 flex items-center gap-4">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl border border-violet-500/20 bg-violet-500/10">
            <Sparkles className="h-5 w-5 text-violet-400" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-zinc-100">
              AI 애널리스트 리포트
            </h2>
            <p className="text-sm text-zinc-500">
              AI Quant Model v3.2 · 심층 분석
            </p>
          </div>
        </div>

        {/* Divider */}
        <div className="mb-8 h-px bg-gradient-to-r from-violet-500/20 via-zinc-800 to-transparent" />

        {/* Content */}
        <article>
          <MarkdownContent content={content} />
        </article>
      </div>
    </section>
  );
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
