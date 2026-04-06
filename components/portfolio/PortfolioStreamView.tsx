'use client';

import { useEffect, useRef } from 'react';
import { Loader2, CheckCircle2, AlertCircle } from 'lucide-react';
import DataOrbitCanvas from '@/components/portfolio/DataOrbitCanvas';
import type {
  StrategyData,
  PortfolioStreamStatus,
  PortfolioAgentStep,
  PortfolioThinkingEntry,
} from '@/types/dashboard';

// ── Step progress bar ──

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
    <div className="flex items-center gap-1.5">
      {Array.from({ length: totalSteps }, (_, i) => {
        const step = i + 1;
        const isComplete = step < currentStep || status === 'complete';
        const isActive = step === currentStep && status === 'streaming';

        return (
          <div key={step} className="flex-1">
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
  );
}

// ── Thinking terminal (compact) ──

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
    <div className="rounded-lg border border-zinc-800 bg-black/80 backdrop-blur-sm overflow-hidden">
      <div className="px-3 py-1 bg-zinc-900/80 border-b border-zinc-800/40 flex items-center gap-2">
        <span className="h-1.5 w-1.5 rounded-full bg-green-500 animate-pulse" />
        <span className="text-[8px] font-mono text-zinc-500 uppercase tracking-widest">
          AI Thinking
        </span>
      </div>
      <div
        ref={scrollRef}
        className="max-h-[140px] overflow-y-auto terminal-scroll p-2 space-y-0.5"
      >
        {entries.map((entry, i) => (
          <div key={i} className="flex gap-2">
            <span className="shrink-0 text-[8px] font-mono text-zinc-700 mt-0.5 w-[56px] truncate">
              [{entry.agent}]
            </span>
            <span className="text-[9px] font-mono text-zinc-400 leading-relaxed whitespace-pre-wrap break-words">
              {entry.content}
            </span>
          </div>
        ))}
        {status === 'streaming' && (
          <span className="inline-block w-1.5 h-3 bg-green-500/80 animate-pulse ml-[64px]" />
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
    <div className="space-y-3 p-4">
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
