'use client';

import { useEffect, useRef } from 'react';
import { Loader2, CheckCircle2, AlertCircle } from 'lucide-react';
import type {
  PortfolioStreamStatus,
  PortfolioAgentStep,
  PortfolioThinkingEntry,
} from '@/types/dashboard';

// ── Step progress bar ──

function StepIndicator({
  currentStep,
  totalSteps,
  currentAgent,
  status,
}: {
  currentStep: number;
  totalSteps: number;
  currentAgent: PortfolioAgentStep | null;
  status: PortfolioStreamStatus;
}) {
  return (
    <div className="space-y-3">
      {/* Progress bar */}
      <div className="flex items-center gap-1.5">
        {Array.from({ length: totalSteps }, (_, i) => {
          const step = i + 1;
          const isComplete = step < currentStep || status === 'complete';
          const isActive = step === currentStep && status === 'streaming';

          return (
            <div key={step} className="flex-1 flex flex-col items-center gap-1">
              <div
                className={`h-1.5 w-full rounded-full transition-all duration-500 ${
                  isComplete
                    ? 'bg-green-500'
                    : isActive
                      ? 'bg-green-500/60 animate-pulse'
                      : 'bg-zinc-800'
                }`}
              />
            </div>
          );
        })}
      </div>

      {/* Step label */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {status === 'streaming' && (
            <Loader2 className="w-3 h-3 text-green-400 animate-spin" />
          )}
          {status === 'complete' && (
            <CheckCircle2 className="w-3 h-3 text-green-400" />
          )}
          {status === 'error' && (
            <AlertCircle className="w-3 h-3 text-red-400" />
          )}
          <span className="text-[10px] font-mono text-zinc-400">
            {currentAgent?.title ?? (status === 'connecting' ? '연결 중...' : '대기 중')}
          </span>
        </div>
        <span className="text-[9px] font-mono text-zinc-600 tabular-nums">
          {currentStep}/{totalSteps}
        </span>
      </div>

      {/* Description */}
      {currentAgent?.description && status === 'streaming' && (
        <p className="text-[9px] font-mono text-zinc-500 leading-relaxed">
          {currentAgent.description}
        </p>
      )}
    </div>
  );
}

// ── Thinking terminal ──

function ThinkingTerminal({
  entries,
  status,
}: {
  entries: PortfolioThinkingEntry[];
  status: PortfolioStreamStatus;
}) {
  const scrollRef = useRef<HTMLDivElement>(null);

  // 새 항목 추가 시 자동 스크롤
  useEffect(() => {
    const el = scrollRef.current;
    if (el) {
      el.scrollTop = el.scrollHeight;
    }
  }, [entries.length]);

  if (entries.length === 0 && status !== 'streaming') return null;

  return (
    <div className="rounded-lg border border-zinc-800 bg-black/60 overflow-hidden">
      <div className="px-3 py-1.5 bg-zinc-900/80 border-b border-zinc-800/40 flex items-center gap-2">
        <span className="h-1.5 w-1.5 rounded-full bg-green-500 animate-pulse" />
        <span className="text-[8px] font-mono text-zinc-500 uppercase tracking-widest">
          AI 사고 과정
        </span>
      </div>
      <div
        ref={scrollRef}
        className="max-h-[280px] overflow-y-auto terminal-scroll p-3 space-y-1"
      >
        {entries.map((entry, i) => (
          <div key={i} className="flex gap-2">
            <span className="shrink-0 text-[8px] font-mono text-zinc-700 mt-0.5 w-[60px] truncate">
              [{entry.agent}]
            </span>
            <span className="text-[10px] font-mono text-zinc-400 leading-relaxed whitespace-pre-wrap break-words">
              {entry.content}
            </span>
          </div>
        ))}
        {/* Blinking cursor */}
        {status === 'streaming' && (
          <span className="inline-block w-1.5 h-3 bg-green-500/80 animate-pulse ml-[68px]" />
        )}
      </div>
    </div>
  );
}

// ── Main ──

export default function PortfolioStreamView({
  status,
  currentStep,
  totalSteps,
  currentAgent,
  thinkingLog,
  error,
  onCancel,
}: {
  status: PortfolioStreamStatus;
  currentStep: number;
  totalSteps: number;
  currentAgent: PortfolioAgentStep | null;
  thinkingLog: PortfolioThinkingEntry[];
  error: string | null;
  onCancel: () => void;
}) {
  return (
    <div className="space-y-4 p-4">
      {/* Step progress */}
      <StepIndicator
        currentStep={currentStep}
        totalSteps={totalSteps}
        currentAgent={currentAgent}
        status={status}
      />

      {/* Thinking terminal */}
      <ThinkingTerminal entries={thinkingLog} status={status} />

      {/* Error message */}
      {error && (
        <div className="flex items-center gap-2 px-3 py-2 rounded-lg border border-red-500/20 bg-red-500/5">
          <AlertCircle className="shrink-0 w-3 h-3 text-red-400" />
          <span className="text-[10px] font-mono text-red-300">{error}</span>
        </div>
      )}

      {/* Cancel / Retry button */}
      <div className="flex justify-center">
        {status === 'streaming' || status === 'connecting' ? (
          <button
            type="button"
            onClick={onCancel}
            className="text-[10px] font-mono text-zinc-500 hover:text-zinc-300 border border-zinc-700 rounded-lg px-4 py-1.5 hover:border-zinc-600 transition-colors"
          >
            취소
          </button>
        ) : status === 'error' ? (
          <button
            type="button"
            onClick={onCancel}
            className="text-[10px] font-mono text-zinc-400 hover:text-zinc-200 border border-zinc-700 rounded-lg px-4 py-1.5 hover:border-zinc-600 transition-colors"
          >
            돌아가기
          </button>
        ) : null}
      </div>
    </div>
  );
}
