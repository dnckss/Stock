'use client';

import { useEffect, useRef } from 'react';
import { AlertCircle } from 'lucide-react';
import DataOrbitCanvas from '@/components/portfolio/DataOrbitCanvas';
import type {
  StrategyData,
  PortfolioStreamStatus,
  PortfolioAgentStep,
  PortfolioThinkingEntry,
} from '@/types/dashboard';

/* ── Step progress bar ── */

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
    <div className="flex items-center gap-2">
      {Array.from({ length: totalSteps }, (_, i) => {
        const step = i + 1;
        const isComplete = step < currentStep || status === 'complete';
        const isActive = step === currentStep && status === 'streaming';

        return (
          <div key={step} className="flex-1">
            <div
              className={`h-2 w-full rounded-full transition-all duration-500 ${
                isComplete
                  ? 'bg-violet-500'
                  : isActive
                    ? 'bg-violet-500/50 animate-pulse'
                    : 'bg-zinc-800'
              }`}
            />
          </div>
        );
      })}
    </div>
  );
}

/* ── Thinking terminal ── */

function ThinkingTerminal({
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
    <div className="rounded-xl border border-zinc-800/50 bg-black/40 backdrop-blur-sm overflow-hidden">
      <div className="px-4 py-2 bg-zinc-900/60 border-b border-zinc-800/40 flex items-center gap-2">
        <span className="h-2 w-2 rounded-full bg-violet-500 animate-pulse" />
        <span className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest">
          AI Thinking
        </span>
      </div>
      <div
        ref={scrollRef}
        className="max-h-[160px] overflow-y-auto p-3 space-y-1"
      >
        {entries.map((entry, i) => (
          <div key={i} className="flex gap-2.5">
            <span className="shrink-0 text-[9px] font-mono text-zinc-700 mt-0.5 w-[60px] truncate">
              [{entry.agent}]
            </span>
            <span className="text-xs font-mono text-zinc-400 leading-relaxed whitespace-pre-wrap break-words">
              {entry.content}
            </span>
          </div>
        ))}
        {status === 'streaming' && (
          <span className="inline-block w-1.5 h-3.5 bg-violet-500/80 animate-pulse ml-[72px]" />
        )}
      </div>
    </div>
  );
}

/* ── Main ── */

export default function PortfolioStreamView({
  status,
  currentStep,
  totalSteps,
  currentAgent,
  thinkingLog,
  error,
  onCancel,
  strategyData,
}: {
  status: PortfolioStreamStatus;
  currentStep: number;
  totalSteps: number;
  currentAgent: PortfolioAgentStep | null;
  thinkingLog: PortfolioThinkingEntry[];
  error: string | null;
  onCancel: () => void;
  strategyData?: StrategyData | null;
}) {
  return (
    <div className="space-y-4 bg-zinc-900/40 border border-zinc-800/50 rounded-2xl p-5">
      {/* Step progress */}
      <StepIndicator
        currentStep={currentStep}
        totalSteps={totalSteps}
        status={status}
      />

      {/* Data orbit visualization */}
      {strategyData && (
        <DataOrbitCanvas
          data={strategyData}
          currentStep={currentStep}
          totalSteps={totalSteps}
          currentAgent={currentAgent}
          status={status}
        />
      )}

      {/* Thinking terminal */}
      <ThinkingTerminal entries={thinkingLog} status={status} />

      {/* Error message */}
      {error && (
        <div className="flex items-center gap-2.5 px-4 py-3 rounded-xl border border-red-500/20 bg-red-500/5">
          <AlertCircle className="shrink-0 w-4 h-4 text-red-400" />
          <span className="text-sm text-red-300">{error}</span>
        </div>
      )}

      {/* Cancel / Retry button */}
      <div className="flex justify-center">
        {status === 'streaming' || status === 'connecting' ? (
          <button
            type="button"
            onClick={onCancel}
            className="text-xs font-medium text-zinc-500 hover:text-zinc-300 border border-zinc-700/50 rounded-xl px-5 py-2 hover:border-zinc-600 transition-colors"
          >
            취소
          </button>
        ) : status === 'error' ? (
          <button
            type="button"
            onClick={onCancel}
            className="text-xs font-medium text-zinc-400 hover:text-zinc-200 border border-zinc-700/50 rounded-xl px-5 py-2 hover:border-zinc-600 transition-colors"
          >
            돌아가기
          </button>
        ) : null}
      </div>
    </div>
  );
}
