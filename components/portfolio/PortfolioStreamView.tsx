'use client';

import { useEffect, useRef } from 'react';
import { AlertCircle, CheckCircle2, Circle, FileText, Loader2 } from 'lucide-react';
import type {
  PortfolioStreamStatus,
  PortfolioAgentStep,
  PortfolioThinkingEntry,
} from '@/types/dashboard';

const STEP_LABELS = ['유니버스', '시그널', '리스크', '배분', '검토'];

function StepIndicator({
  currentStep,
  totalSteps,
  status,
}: {
  currentStep: number;
  totalSteps: number;
  status: PortfolioStreamStatus;
}) {
  return (
    <div className="grid grid-cols-1 gap-2 sm:grid-cols-5">
      {Array.from({ length: totalSteps }, (_, i) => {
        const step = i + 1;
        const isComplete = step < currentStep || status === 'complete';
        const isActive = step === currentStep && (status === 'streaming' || status === 'connecting');

        return (
          <div
            key={step}
            className={`flex items-center gap-2 rounded-lg border px-3 py-2 transition-colors ${
              isActive
                ? 'border-emerald-500/30 bg-emerald-500/10'
                : isComplete
                  ? 'border-zinc-700/70 bg-zinc-900/60'
                  : 'border-zinc-800/70 bg-zinc-950/40'
            }`}
          >
            {isComplete ? (
              <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-400" />
            ) : isActive ? (
              <Loader2 className="h-4 w-4 shrink-0 animate-spin text-emerald-300" />
            ) : (
              <Circle className="h-4 w-4 shrink-0 text-zinc-700" />
            )}
            <div className="min-w-0 flex-1">
              <div className="flex items-center justify-between gap-2">
                <span
                  className={`truncate text-xs font-medium ${
                    isActive ? 'text-emerald-200' : isComplete ? 'text-zinc-300' : 'text-zinc-600'
                  }`}
                >
                  {STEP_LABELS[i] ?? `Step ${step}`}
                </span>
                <span className="text-[10px] font-mono text-zinc-600">{step}</span>
              </div>
              <div
                className={`mt-2 h-1 w-full rounded-full ${
                  isComplete
                    ? 'bg-emerald-500'
                    : isActive
                      ? 'bg-emerald-500/50'
                      : 'bg-zinc-800'
                }`}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}

function ResearchLog({
  entries,
  status,
}: {
  entries: PortfolioThinkingEntry[];
  status: PortfolioStreamStatus;
}) {
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = scrollRef.current;
    if (el) {
      el.scrollTop = el.scrollHeight;
    }
  }, [entries.length]);

  if (entries.length === 0 && status !== 'streaming') return null;

  return (
    <div className="rounded-xl border border-zinc-800/70 bg-zinc-950/40 overflow-hidden">
      <div className="px-4 py-2.5 border-b border-zinc-800/70 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <FileText className="h-4 w-4 text-zinc-500" />
          <span className="text-xs font-medium text-zinc-400">분석 로그</span>
        </div>
        {status === 'streaming' && (
          <span className="text-[10px] font-mono text-emerald-400">RUNNING</span>
        )}
      </div>
      <div ref={scrollRef} className="max-h-[180px] overflow-y-auto p-3 space-y-2">
        {entries.map((entry, i) => (
          <div key={i} className="grid grid-cols-[86px_1fr] gap-3 rounded-lg bg-zinc-900/35 px-3 py-2">
            <span className="shrink-0 truncate text-[10px] font-mono text-zinc-600">
              {entry.agent}
            </span>
            <span className="text-xs text-zinc-400 leading-relaxed whitespace-pre-wrap break-words">
              {entry.content}
            </span>
          </div>
        ))}
        {status === 'streaming' && (
          <div className="grid grid-cols-[86px_1fr] gap-3 rounded-lg bg-zinc-900/35 px-3 py-2">
            <span className="text-[10px] font-mono text-zinc-600">status</span>
            <span className="text-xs text-zinc-500">계산 진행 중</span>
          </div>
        )}
      </div>
    </div>
  );
}

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
  const isRunning = status === 'streaming' || status === 'connecting';

  return (
    <div className="space-y-4 rounded-xl border border-zinc-800/70 bg-zinc-950/40 p-5">
      <div className="rounded-xl border border-zinc-800/70 bg-zinc-900/35 px-4 py-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg border border-emerald-500/20 bg-emerald-500/10">
              {isRunning ? (
                <Loader2 className="h-4 w-4 animate-spin text-emerald-300" />
              ) : (
                <FileText className="h-4 w-4 text-zinc-500" />
              )}
            </div>
            <div>
              <p className="text-sm font-semibold text-zinc-100">
                {status === 'error' ? '포트폴리오 구성 실패' : '포트폴리오 구성 중'}
              </p>
              <p className="text-xs text-zinc-500">
                {currentAgent?.title || '투자 조건을 검토하고 있습니다'}
              </p>
            </div>
          </div>
          <span className="w-fit rounded-md border border-zinc-800 bg-zinc-950/60 px-2.5 py-1 text-[11px] font-mono text-zinc-500">
            STEP {Math.min(currentStep, totalSteps)} / {totalSteps}
          </span>
        </div>
        {currentAgent?.description && (
          <p className="mt-3 border-t border-zinc-800/60 pt-3 text-xs leading-relaxed text-zinc-500">
            {currentAgent.description}
          </p>
        )}
      </div>

      <StepIndicator currentStep={currentStep} totalSteps={totalSteps} status={status} />

      <ResearchLog entries={thinkingLog} status={status} />

      {error && (
        <div className="flex items-center gap-2.5 px-4 py-3 rounded-lg border border-red-500/20 bg-red-500/5">
          <AlertCircle className="shrink-0 w-4 h-4 text-red-400" />
          <span className="text-sm text-red-300">{error}</span>
        </div>
      )}

      <div className="flex justify-center">
        {isRunning ? (
          <button
            type="button"
            onClick={onCancel}
            className="rounded-lg border border-zinc-700/70 px-5 py-2 text-xs font-medium text-zinc-500 transition-colors hover:border-zinc-600 hover:text-zinc-300"
          >
            취소
          </button>
        ) : status === 'error' ? (
          <button
            type="button"
            onClick={onCancel}
            className="rounded-lg border border-zinc-700/70 px-5 py-2 text-xs font-medium text-zinc-400 transition-colors hover:border-zinc-600 hover:text-zinc-200"
          >
            돌아가기
          </button>
        ) : null}
      </div>
    </div>
  );
}
