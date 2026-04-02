'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { buildPortfolioStreamUrl, parsePortfolioFullResult } from '@/lib/api';
import { PORTFOLIO_STREAM_TOTAL_STEPS } from '@/lib/constants';
import type {
  PortfolioStyle,
  PortfolioPeriod,
  PortfolioFullResult,
  PortfolioStreamStatus,
  PortfolioAgentStep,
  PortfolioThinkingEntry,
  ApiPortfolioPipelineStart,
  ApiPortfolioAgentStart,
  ApiPortfolioThinking,
  ApiPortfolioAgentError,
  ApiPortfolioStreamResult,
} from '@/types/dashboard';

export interface PortfolioStreamOptions {
  budget: number;
  style: PortfolioStyle;
  period: PortfolioPeriod;
  exclude?: string;
}

export interface UsePortfolioStreamReturn {
  start: (options: PortfolioStreamOptions) => void;
  stop: () => void;
  reset: () => void;
  status: PortfolioStreamStatus;
  currentStep: number;
  totalSteps: number;
  currentAgent: PortfolioAgentStep | null;
  thinkingLog: PortfolioThinkingEntry[];
  result: PortfolioFullResult | null;
  error: string | null;
}

export function usePortfolioStream(): UsePortfolioStreamReturn {
  const [status, setStatus] = useState<PortfolioStreamStatus>('idle');
  const [currentStep, setCurrentStep] = useState(0);
  const [totalSteps, setTotalSteps] = useState(PORTFOLIO_STREAM_TOTAL_STEPS);
  const [currentAgent, setCurrentAgent] = useState<PortfolioAgentStep | null>(null);
  const [thinkingLog, setThinkingLog] = useState<PortfolioThinkingEntry[]>([]);
  const [result, setResult] = useState<PortfolioFullResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const esRef = useRef<EventSource | null>(null);
  const mountedRef = useRef(true);

  const cleanup = useCallback(() => {
    if (esRef.current) {
      esRef.current.close();
      esRef.current = null;
    }
  }, []);

  // 언마운트 시 정리
  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      cleanup();
    };
  }, [cleanup]);

  const reset = useCallback(() => {
    cleanup();
    setStatus('idle');
    setCurrentStep(0);
    setTotalSteps(PORTFOLIO_STREAM_TOTAL_STEPS);
    setCurrentAgent(null);
    setThinkingLog([]);
    setResult(null);
    setError(null);
  }, [cleanup]);

  const stop = useCallback(() => {
    cleanup();
    if (mountedRef.current && status === 'streaming') {
      setStatus('idle');
    }
  }, [cleanup, status]);

  const start = useCallback((options: PortfolioStreamOptions) => {
    // 기존 연결 정리
    cleanup();

    setStatus('connecting');
    setCurrentStep(0);
    setTotalSteps(PORTFOLIO_STREAM_TOTAL_STEPS);
    setCurrentAgent(null);
    setThinkingLog([]);
    setResult(null);
    setError(null);

    const url = buildPortfolioStreamUrl(options);
    const es = new EventSource(url);
    esRef.current = es;

    es.addEventListener('pipeline_start', (e: MessageEvent) => {
      if (!mountedRef.current) return;
      try {
        const data: ApiPortfolioPipelineStart = JSON.parse(e.data);
        setTotalSteps(data.total_steps);
        setStatus('streaming');
      } catch {
        // pipeline_start 파싱 실패는 무시 — 스트리밍은 계속
      }
    });

    es.addEventListener('agent_start', (e: MessageEvent) => {
      if (!mountedRef.current) return;
      try {
        const data: ApiPortfolioAgentStart = JSON.parse(e.data);
        setCurrentStep(data.step);
        setTotalSteps(data.total_steps);
        setCurrentAgent({
          agent: data.agent,
          step: data.step,
          title: data.title,
          description: data.description,
        });
      } catch {
        // agent_start 파싱 실패 무시
      }
    });

    es.addEventListener('thinking', (e: MessageEvent) => {
      if (!mountedRef.current) return;
      try {
        const data: ApiPortfolioThinking = JSON.parse(e.data);
        setThinkingLog((prev) => [...prev, { agent: data.agent, content: data.content }]);
      } catch {
        // thinking 파싱 실패 무시
      }
    });

    es.addEventListener('agent_result', (e: MessageEvent) => {
      if (!mountedRef.current) return;
      try {
        const raw = JSON.parse(e.data);
        const payload = raw.data ?? raw.result ?? raw;

        // allocations가 있으면 최종 포트폴리오 결과
        if (Array.isArray(payload.allocations)) {
          const parsed = parsePortfolioFullResult(payload as ApiPortfolioStreamResult);
          if (parsed) {
            setResult(parsed);
            setStatus('complete');
          } else {
            setError('포트폴리오 결과를 파싱할 수 없습니다');
            setStatus('error');
          }
          es.close();
          esRef.current = null;
          return;
        }

        // 중간 에이전트 결과 → 사고 과정 로그에 요약 추가
        const agent = String(raw.agent ?? '');
        const summary = payload.market_summary ?? payload.summary ?? '';
        if (agent && summary) {
          setThinkingLog((prev) => [...prev, { agent, content: summary }]);
        }
      } catch {
        // 개별 agent_result 파싱 실패는 무시 — 스트리밍 계속
      }
    });

    es.addEventListener('agent_error', (e: MessageEvent) => {
      if (!mountedRef.current) return;
      try {
        const data: ApiPortfolioAgentError = JSON.parse(e.data);
        setError(data.error || '포트폴리오 생성 중 오류가 발생했습니다');
      } catch {
        setError('포트폴리오 생성 중 오류가 발생했습니다');
      }
      setStatus('error');
      es.close();
      esRef.current = null;
    });

    // 서버가 complete 이벤트로 최종 결과 또는 에러를 보냄
    es.addEventListener('complete', (e: MessageEvent) => {
      if (!mountedRef.current) return;
      try {
        const data = JSON.parse(e.data);
        if (data.error) {
          setError(data.error);
          setStatus('error');
        } else if (Array.isArray(data.allocations)) {
          const parsed = parsePortfolioFullResult(data as ApiPortfolioStreamResult);
          if (parsed) {
            setResult(parsed);
            setStatus('complete');
          } else {
            setError('포트폴리오 결과를 파싱할 수 없습니다');
            setStatus('error');
          }
        } else {
          // allocations도 error도 없는 경우
          setError('포트폴리오 생성 결과가 비어있습니다');
          setStatus('error');
        }
      } catch {
        setError('포트폴리오 결과를 처리할 수 없습니다');
        setStatus('error');
      }
      es.close();
      esRef.current = null;
    });

    // 서버가 pipeline_end를 보내면 스트림 정상 종료
    es.addEventListener('pipeline_end', () => {
      if (!mountedRef.current) return;
      es.close();
      esRef.current = null;
    });

    es.onerror = () => {
      if (!mountedRef.current) return;
      // 자동 재연결을 방지하여 파이프라인이 처음부터 반복되는 것을 막음
      es.close();
      esRef.current = null;
      setError('서버와의 연결이 끊어졌습니다');
      setStatus('error');
    };
  }, [cleanup]);

  return {
    start,
    stop,
    reset,
    status,
    currentStep,
    totalSteps,
    currentAgent,
    thinkingLog,
    result,
    error,
  };
}
