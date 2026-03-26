'use client';

import { useEffect, useLayoutEffect, useRef } from 'react';
import { fetchNewsDetail } from '@/lib/api';
import type { ApiNewsAnalysis } from '@/types/dashboard';

const POLL_INTERVAL_MS = 2500;
const MAX_ATTEMPTS = 8;

interface NewsAnalysisPollerProps {
  url: string;
  /** 이미 분석이 있으면 폴링 안 함 */
  hasAnalysis: boolean;
  /** 본문 추출 성공 + 본문 있을 때만 폴링 */
  shouldPoll: boolean;
  onAnalysis: (analysis: ApiNewsAnalysis) => void;
  onPollExhausted: () => void;
}

/**
 * analysis가 null로 내려온 직후(요약 생성 중) 서버 캐시를 채우기 위해 analyze=1로 재호출.
 */
export default function NewsAnalysisPoller({
  url,
  hasAnalysis,
  shouldPoll,
  onAnalysis,
  onPollExhausted,
}: NewsAnalysisPollerProps) {
  const attemptsRef = useRef(0);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const exhaustedRef = useRef(false);
  const onAnalysisRef = useRef(onAnalysis);
  const onPollExhaustedRef = useRef(onPollExhausted);
  useLayoutEffect(() => {
    onAnalysisRef.current = onAnalysis;
    onPollExhaustedRef.current = onPollExhausted;
  });

  useEffect(() => {
    if (!url || hasAnalysis || !shouldPoll) return;

    attemptsRef.current = 0;
    exhaustedRef.current = false;
    let cancelled = false;

    const schedule = (delay: number) => {
      if (cancelled) return;
      timerRef.current = setTimeout(run, delay);
    };

    const run = async () => {
      if (cancelled) return;
      attemptsRef.current += 1;
      if (attemptsRef.current > MAX_ATTEMPTS) {
        if (!exhaustedRef.current) {
          exhaustedRef.current = true;
          onPollExhaustedRef.current();
        }
        return;
      }

      try {
        const data = await fetchNewsDetail(url, { analyze: true });
        if (cancelled) return;
        if (data.analysis) {
          onAnalysisRef.current(data.analysis);
          return;
        }
      } catch {
        /* 네트워크 오류는 다음 폴링에서 재시도 */
      }

      if (!cancelled) schedule(POLL_INTERVAL_MS);
    };

    schedule(600);

    return () => {
      cancelled = true;
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [url, hasAnalysis, shouldPoll]);

  return null;
}
